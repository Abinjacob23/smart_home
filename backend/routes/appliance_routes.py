from flask import Blueprint, request, jsonify
import sqlite3
import datetime

appliance_bp = Blueprint("appliance", __name__)

DB = "crack_records.db"

VOLTAGE_PIN = "V2"

# -----------------------------
# Blynk value fetch (IMPORTANT)
# -----------------------------
import requests

BLYNK_TOKEN = "I0sHPG7TYOmxUWsuSsOJe2uglxzj_Gc4"

def get_blynk_value(pin):
    url = f"https://blynk.cloud/external/api/get?token={BLYNK_TOKEN}&{VOLTAGE_PIN}"
    try:
        r = requests.get(url, timeout=3)
        return float(r.text)
    except:
        return 0


# -----------------------------
# Appliance Analytics
# -----------------------------
@appliance_bp.route("/appliance-analytics", methods=["GET"])
def appliance_analytics():

    SAFE_LIMIT = 500
    name = request.args.get("name")

    if not name:
        return jsonify({"error": "Appliance name required"}), 400

    # 🔌 Get REAL voltage
    voltage = get_blynk_value(VOLTAGE_PIN)
    if voltage == 0:
        voltage = 230

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("""
        SELECT timestamp, current_value
        FROM appliance_usage
        WHERE appliance_name = ?
        ORDER BY timestamp ASC
    """, (name,))

    rows = c.fetchall()
    conn.close()

    # -----------------------------
    # No data
    # -----------------------------
    if not rows:
        return jsonify({
            "current": 0,
            "averageCurrent": 0,
            "peakHour": 0,
            "idealHour": 0,
            "peakUsageDay": "N/A",
            "predictedNextHour": None,
            "overloadStatus": "UNKNOWN",
            "overloadMessage": "No data",
            "futurePredictions": [],
            "dailyChangePercent": None,
            "comparisonLabel": "Not enough data",
            "energyKwh": 0,
            "estimatedBill": 0,
            "voltage": voltage,
            "data": []
        })

    currents = [r[1] for r in rows]

    current_usage = currents[-1]
    avg_current = sum(currents) / len(currents)

    data_points = [
        {"timestamp": r[0], "current_value": r[1]}
        for r in rows
    ]

    # -----------------------------
    # 🤖 AI Prediction
    # -----------------------------
    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression

        if len(data_points) < 2:
            prediction = current_usage
        else:
            X = np.array(range(len(data_points))).reshape(-1, 1)
            y = np.array([d["current_value"] for d in data_points])

            model = LinearRegression()
            model.fit(X, y)

            prediction = model.predict([[len(data_points)]])[0]
            prediction = round(float(prediction), 2)

    except:
        prediction = None

    # -----------------------------
    # 📊 Future prediction (24)
    # -----------------------------
    future_predictions = []

    try:
        if len(data_points) >= 2:
            X = np.array(range(len(data_points))).reshape(-1, 1)
            y = np.array([d["current_value"] for d in data_points])

            model = LinearRegression()
            model.fit(X, y)

            for i in range(1, 25):
                pred = model.predict([[len(data_points) + i]])[0]
                future_predictions.append(round(float(pred), 2))
    except:
        pass

    # -----------------------------
    # 🚨 Overload Prediction
    # -----------------------------
    if prediction is None:
        overload_status = "UNKNOWN"
        overload_message = "Not enough data"
    elif prediction > SAFE_LIMIT:
        overload_status = "WARNING"
        overload_message = "High usage expected next hour"
    else:
        overload_status = "SAFE"
        overload_message = "Usage within safe limits"

    # -----------------------------
    # ⚡ Energy Calculation
    # -----------------------------
    currents_amp = [c / 1000 for c in currents]
    power_values = [voltage * i for i in currents_amp]

    TIME_INTERVAL_HOURS = 10 / 60
    energy_kwh = sum(p * TIME_INTERVAL_HOURS for p in power_values) / 1000
    energy_kwh = round(energy_kwh, 3)

    estimated_bill = round(energy_kwh * 7, 2)

    # -----------------------------
    # Hourly analysis
    # -----------------------------
    import datetime

    hourly = {}
    daily_usage = {}

    for r in rows:
        ts = datetime.datetime.fromisoformat(r[0].replace(" ", "T"))
        hour = ts.hour
        day = ts.date()

        hourly.setdefault(hour, []).append(r[1])
        daily_usage[day] = daily_usage.get(day, 0) + r[1]

    hourly_avg = {h: sum(v) / len(v) for h, v in hourly.items()}
    peak_hour = max(hourly_avg, key=hourly_avg.get)
    ideal_hour = min(hourly_avg, key=hourly_avg.get)

    peak_day = max(daily_usage, key=daily_usage.get)

    # -----------------------------
    # 🔥 SMART COMPARISON (FIXED)
    # -----------------------------
    dates = sorted(daily_usage.keys())

    if len(dates) >= 2:
        latest_day = dates[-1]
        prev_day = dates[-2]

        latest_usage = daily_usage[latest_day]
        prev_usage = daily_usage[prev_day]

        if prev_usage > 0:
            daily_change = round(((latest_usage - prev_usage) / prev_usage) * 100, 2)
        else:
            daily_change = None

        comparison_label = f"{latest_day} vs {prev_day}"
    else:
        daily_change = None
        comparison_label = "Not enough data"

    # -----------------------------
    # FINAL RESPONSE
    # -----------------------------
    return jsonify({
        "current": round(current_usage, 2),
        "averageCurrent": round(avg_current, 2),
        "peakHour": peak_hour,
        "idealHour": ideal_hour,
        "peakUsageDay": str(peak_day),

        "predictedNextHour": prediction,
        "overloadStatus": overload_status,
        "overloadMessage": overload_message,
        "futurePredictions": future_predictions,

        "dailyChangePercent": daily_change,
        "comparisonLabel": comparison_label,

        "energyKwh": energy_kwh,
        "estimatedBill": estimated_bill,
        "voltage": round(voltage, 2),

        "data": data_points
    })
# -----------------------------
# Delete Appliance
# -----------------------------
@appliance_bp.route("/appliances/<int:id>", methods=["DELETE"])
def delete_appliance(id):

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # find appliance name
    c.execute("SELECT name FROM appliances WHERE id=?", (id,))
    row = c.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Appliance not found"}), 404

    name = row[0]

    # delete appliance
    c.execute("DELETE FROM appliances WHERE id=?", (id,))

    # delete usage history
    c.execute("DELETE FROM appliance_usage WHERE appliance_name=?", (name,))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Appliance deleted"
    })


# -----------------------------
# Get all appliances
# -----------------------------
@appliance_bp.route("/appliances", methods=["GET"])
def get_appliances():

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("SELECT id, name FROM appliances")

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "name": r[1]
        }
        for r in rows
    ])


# -----------------------------
# Add appliance
# -----------------------------
@appliance_bp.route("/appliances", methods=["POST"])
def add_appliance():

    data = request.json
    name = data.get("name")

    if not name:
        return jsonify({"error": "Appliance name required"}), 400

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute(
        "INSERT INTO appliances (name) VALUES (?)",
        (name,)
    )

    conn.commit()
    conn.close()

    return jsonify({"success": True})