from flask import Blueprint, jsonify
import requests
from database import get_db
import threading
import time
import numpy as np
from sklearn.linear_model import LinearRegression

electricity_bp = Blueprint("electricity", __name__)

# -----------------------------
# Blynk Config (UPDATED)
# -----------------------------
BLYNK_TOKEN = "I0sHPG7TYOmxUWsuSsOJe2uglxzj_Gc4"

CURRENT_PIN = "v0"
VOLTAGE_PIN = "v2"   # NEW

# -----------------------------
# Dynamic Threshold Variables
# -----------------------------
initial_readings = []
threshold = None
leakage_flag = 0


# -----------------------------
# Get value from Blynk
# -----------------------------
def get_blynk_value(pin):
    url = f"https://blynk.cloud/external/api/get?token={BLYNK_TOKEN}&{pin}"

    try:
        r = requests.get(url, timeout=3)
        print(f"[DEBUG] URL: {url}")
        print(f"[DEBUG] Response: {r.text}")
        return float(r.text)
    except Exception as e:
        print("[ERROR]", e)
        return 0

# -----------------------------
# Determine status
# -----------------------------
def get_level(current, leakage):
    if leakage == 1:
        return "CRITICAL", "Electric leakage detected"

    if current > 500:
        return "WARNING", "High current detected"

    return "SAFE", "Electric system normal"


# -----------------------------
# Leakage Detection Logic
# -----------------------------
import time

recent_readings = []
initial_readings = []
threshold = None
leakage_flag = 0
last_calibration_time = time.time()


def detect_leakage(current):
    global initial_readings, threshold, leakage_flag
    global recent_readings, last_calibration_time

    current_time = time.time()

    # -----------------------------
    # Recalibrate every 20 seconds
    # -----------------------------
    if current_time - last_calibration_time >= 20:
        print("[INFO] Recalibrating threshold...")
        threshold = None
        initial_readings.clear()
        last_calibration_time = current_time

    # -----------------------------
    # Threshold Initialization
    # -----------------------------
    if threshold is None:
        initial_readings.append(current)

        if len(initial_readings) == 5:
            calculated_threshold = max(initial_readings) + 0.04

            # ✅ Minimum threshold enforcement
            threshold = max(0.27, min(calculated_threshold, 0.28))

            print(f"[INFO] Threshold set to: {threshold}")

        return 0

    # -----------------------------
    # Maintain last 3 readings
    # -----------------------------
    recent_readings.append(current)
    if len(recent_readings) > 10:
        recent_readings.pop(0)

    # -----------------------------
    # Detection Logic
    # -----------------------------
    if current > threshold:
        leakage_flag = 1

    elif len(recent_readings) == 10 and all(
        val < (0.7 * threshold) for val in recent_readings
    ):
        # ✅ Leak cleared
        leakage_flag = 0

        print("[INFO] Leak cleared. Resetting threshold...")
        threshold = None
        initial_readings.clear()
        recent_readings.clear()
        last_calibration_time = current_time

    return leakage_flag


# -----------------------------
# Save record
# -----------------------------
def save_record(current, leakage, level, message, voltage=0, source="event"):

    power = current * voltage  # Watts

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        INSERT INTO electricity_records
        (current_value, leakage, level, message,
        voltage, power_watt, energy_kwh)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        current,
        leakage,
        level,
        message,
        voltage,
        power,
        0
    ))

    conn.commit()
    conn.close()


# -----------------------------
# Hourly background logger
# -----------------------------
def hourly_logger():
    while True:
        try:
            current = get_blynk_value(CURRENT_PIN)
            voltage = get_blynk_value(VOLTAGE_PIN)

            leakage = detect_leakage(current)
            level, message = get_level(current, leakage)

            save_record(current, leakage, level, message, voltage, source="hourly")

            print("[INFO] Hourly electricity data logged")

        except Exception as e:
            print("Hourly logging error:", e)

        time.sleep(3600)


# -----------------------------
# Electricity Status
# -----------------------------
@electricity_bp.route("/electricity-status", methods=["GET"])
def electricity_status():

    current = get_blynk_value(CURRENT_PIN)
    voltage = get_blynk_value(VOLTAGE_PIN)

    leakage = detect_leakage(current)
    level, message = get_level(current, leakage)

    if level in ["WARNING", "CRITICAL"]:
        save_record(current, leakage, level, message, voltage, source="event")

    return jsonify({
        "value": current,
        "voltage": voltage,
        "leakage": leakage,
        "level": level,
        "message": message,
        "threshold": threshold
    })


# -----------------------------
# AI Prediction (Next Hour)
# -----------------------------
def predict_next_hour(data):

    if len(data) < 5:
        return None

    X = np.array(range(len(data))).reshape(-1, 1)
    y = np.array([d["current_value"] for d in data])

    model = LinearRegression()
    model.fit(X, y)

    next_index = np.array([[len(data)]])
    prediction = model.predict(next_index)

    return round(float(prediction[0]), 2)


# -----------------------------
# Electricity Analytics
# -----------------------------
@electricity_bp.route("/electricity-analytics", methods=["GET"])
def electricity_analytics():

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT timestamp, current_value
        FROM appliance_usage
        ORDER BY timestamp ASC
    """)

    rows = c.fetchall()
    conn.close()

    if not rows:
        return jsonify({
            "averageCurrent": 0,
            "maxCurrent": 0,
            "minCurrent": 0,
            "data": []
        })

    currents = [r["current_value"] for r in rows]
    avg_current = sum(currents) / len(currents)

    data_points = [
        {
            "timestamp": r["timestamp"],
            "current_value": r["current_value"]
        }
        for r in rows
    ]

    prediction = predict_next_hour(data_points)

    return jsonify({
        "averageCurrent": round(avg_current, 2),
        "maxCurrent": max(currents),
        "minCurrent": min(currents),
        "predictedNextHour": prediction,
        "data": data_points
    })


# -----------------------------
# Electricity History
# -----------------------------
@electricity_bp.route("/electricity-history", methods=["GET"])
def electricity_history():

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT id, timestamp, current_value, leakage, level, message
        FROM electricity_records
        ORDER BY timestamp DESC
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "value": r["current_value"],
            "leakage": r["leakage"],
            "level": r["level"],
            "message": r["message"]
        }
        for r in rows
    ])


# -----------------------------
# Delete one record
# -----------------------------
@electricity_bp.route("/electricity-history/<int:id>", methods=["DELETE"])
def delete_record(id):

    conn = get_db()
    c = conn.cursor()

    c.execute("DELETE FROM electricity_records WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Record deleted"})


# -----------------------------
# Clear all records
# -----------------------------
@electricity_bp.route("/electricity-history", methods=["DELETE"])
def clear_all_records():

    conn = get_db()
    c = conn.cursor()

    c.execute("DELETE FROM electricity_records")
    conn.commit()
    conn.close()

    return jsonify({"message": "All records cleared"})


# -----------------------------
# Start background thread
# -----------------------------
def start_hourly_logging():
    thread = threading.Thread(target=hourly_logger, daemon=True)
    thread.start()