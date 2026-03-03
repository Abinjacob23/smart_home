from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import cv2
import numpy as np
import base64
import os
import sqlite3
import datetime
import requests

# -----------------------------
# Flask app
# -----------------------------
app = Flask(__name__)

# -----------------------------
# Load trained model
# -----------------------------
MODEL_PATH = "crack_classifier_model_v2.keras"
IMG_SIZE = (160, 160)

model = load_model(MODEL_PATH)

# -----------------------------
# Database init
# -----------------------------
def init_db():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    # Crack records (already exists)
    c.execute("""
    CREATE TABLE IF NOT EXISTS crack_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        label TEXT,
        severity_score REAL,
        repair_cost REAL,
        warning_level TEXT
    )
    """)

    # 🔥 Gas leak records
    c.execute("""
    CREATE TABLE IF NOT EXISTS gas_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        gas_value REAL,
        level TEXT,
        message TEXT
    )
    """)

    # ⚡ Electricity leak records
    c.execute("""
    CREATE TABLE IF NOT EXISTS electricity_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        current_value REAL,
        leakage INTEGER,
        level TEXT,
        message TEXT
    )
    """)

    conn.commit()
    conn.close()
init_db()

# -----------------------------
BLYNK_TOKEN = "_593RbV7PLcdoxWpgToFcD44MvOFv4dM"

GAS_PIN = "V3"
ELECTRIC_PIN = "V4"
CURRENT_PIN = "V0"      # current reading (mA)
GAS_PIN_VAL = "V2"
# -----------------------------
def get_blynk_value(pin):
    try:
        url = f"https://blynk.cloud/external/api/get?token={BLYNK_TOKEN}&{pin}"
        r = requests.get(url, timeout=5)
        r.raise_for_status()

        # Blynk returns STRING → convert safely
        return float(r.text)
    except Exception as e:
        print("Blynk error:", e)
        return None

# -----------------------------
# Utility functions
# -----------------------------
def preprocess_image(path):
    img = image.load_img(path, target_size=IMG_SIZE)
    img_arr = image.img_to_array(img) / 255.0
    img_arr = np.expand_dims(img_arr, axis=0)
    return img_arr

def encode_image(img):
    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf).decode("utf-8")

def estimate_repair_cost(area, severity):
    base_cost = 300  # ₹ per % cracked area
    return round(area * base_cost * (1 + severity / 100), 2)

def generate_warning(severity, repair_cost):
    if severity > 60 or repair_cost > 2000:
        return {
            "level": "CRITICAL",
            "message": "Immediate repair required. Structural risk detected."
        }
    elif severity >= 25:
        return {
            "level": "WARNING",
            "message": "Crack worsening detected. Schedule maintenance."
        }
    else:
        return {
            "level": "SAFE",
            "message": "No immediate action required."
        }
    
# -----------------------------
# Simulated sensor data
# -----------------------------
@app.route("/gas-status", methods=["GET"])
def gas_status():
    gas_val = get_blynk_value(GAS_PIN_VAL)

    if gas_val is None:
        return jsonify({
            "level": "UNKNOWN",
            "value": 0,
            "message": "Gas sensor offline"
        })

    if gas_val > 2000:
        level = "CRITICAL"
        message = "Dangerous gas leakage detected!"
    elif gas_val > 1500:
        level = "WARNING"
        message = "Elevated gas levels detected"
    else:
        level = "SAFE"
        message = "Gas levels normal"

    # 🔐 STORE ONLY LEAK EVENTS
    if level in ["WARNING", "CRITICAL"]:
        conn = sqlite3.connect("crack_records.db")
        c = conn.cursor()
        c.execute("""
            INSERT INTO gas_records
            (timestamp, gas_value, level, message)
            VALUES (datetime('now','+5 hours','+30 minutes'), ?, ?, ?)
        """, (gas_val, level, message))
        conn.commit()
        conn.close()

    return jsonify({
        "level": level,
        "value": gas_val,
        "message": message
    })

@app.route("/gas-history", methods=["GET"])
def gas_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("""
        SELECT id, timestamp, gas_value, level, message
        FROM gas_records
        ORDER BY id DESC
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "timestamp": r[1],
            "value": r[2],
            "level": r[3],
            "message": r[4]
        } for r in rows
    ])

@app.route("/gas-history/<int:record_id>", methods=["DELETE"])
def delete_gas_record(record_id):
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("DELETE FROM gas_records WHERE id = ?", (record_id,))
    conn.commit()

    deleted = c.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"success": False}), 404

    return jsonify({"success": True})

@app.route("/gas-history", methods=["DELETE"])
def clear_all_gas_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("DELETE FROM gas_records")
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "All gas records cleared"})

# -----------------------------
# Electricity history API
# -----------------------------
@app.route("/electricity-history", methods=["GET"])
def electricity_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("""
        SELECT id, timestamp, current_value, leakage, level, message
        FROM electricity_records
        ORDER BY id DESC
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "timestamp": r[1],
            "value": r[2],
            "leakage": r[3],
            "level": r[4],
            "message": r[5]
        } for r in rows
    ])

@app.route("/electricity-history/<int:record_id>", methods=["DELETE"])
def delete_electricity_record(record_id):
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("DELETE FROM electricity_records WHERE id = ?", (record_id,))
    conn.commit()

    deleted = c.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"success": False}), 404

    return jsonify({"success": True})

@app.route("/electricity-history", methods=["DELETE"])
def clear_all_electricity_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("DELETE FROM electricity_records")
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "All electricity records cleared"})

@app.route("/electricity-status", methods=["GET"])
def electricity_status():
    current = get_blynk_value(CURRENT_PIN)
    leakage = get_blynk_value(ELECTRIC_PIN)

    if current is None or leakage is None:
        return jsonify({
            "level": "UNKNOWN",
            "value": 0,
            "leakage": 0,
            "message": "Electricity sensor offline"
        })

    leakage = int(leakage)

    if leakage == 1:
        level = "CRITICAL"
        message = "Electric leakage detected! Risk of shock."

        # 🔐 STORE LEAK EVENT
        conn = sqlite3.connect("crack_records.db")
        c = conn.cursor()
        c.execute("""
            INSERT INTO electricity_records
            (timestamp, current_value, leakage, level, message)
            VALUES (datetime('now','+5 hours','+30 minutes'), ?, ?, ?, ?)
        """, (current, leakage, level, message))
        conn.commit()
        conn.close()

        return jsonify({
            "level": level,
            "value": current,
            "leakage": leakage,
            "message": message
        })

    return jsonify({
        "level": "SAFE",
        "value": current,
        "leakage": 0,
        "message": "Electric system normal"
    })
def combine_alerts(crack_warning, gas_status, electricity_status):
    levels = [
        crack_warning["level"],
        gas_status["level"],
        electricity_status["level"]
    ]

    if "CRITICAL" in levels:
        return {
            "level": "CRITICAL",
            "message": "Critical condition detected in home. Immediate action required."
        }
    elif "WARNING" in levels:
        return {
            "level": "WARNING",
            "message": "Multiple risk indicators detected. Monitor and schedule maintenance."
        }
    else:
        return {
            "level": "SAFE",
            "message": "All home systems operating safely."
        }

def get_gas_status():
    return gas_status().get_json()

def get_electricity_status():
    return electricity_status().get_json()

# -----------------------------
# Crack detection API
# -----------------------------
@app.route("/crack-detect", methods=["POST"])
def crack_detect():
    print("\n========== NEW REQUEST ==========")

    # -------------------------
    # 1. Read & save image
    # -------------------------
    file = request.files["image"]
    path = "temp.jpg"
    file.save(path)

    # -------------------------
    # 2. ML prediction
    # -------------------------
    img_batch = preprocess_image(path)
    pred = float(model.predict(img_batch, verbose=0)[0][0])

    # -------------------------
    # 3. OpenCV crack analysis
    # -------------------------
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    area_perc = float((np.count_nonzero(edges) / edges.size) * 100)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    zones = int(len(contours))

    # -------------------------
    # 4. Highlight cracks
    # -------------------------
    highlighted = img.copy()
    highlighted[edges != 0] = [0, 0, 255]

    # -------------------------
    # 5. AR patching (safe)
    # -------------------------
    kernel = np.ones((5, 5), np.uint8)
    crack_mask = cv2.dilate(edges, kernel, iterations=1)

    patched = img.copy()
    if np.count_nonzero(crack_mask) > 0:
        bg_pixels = img[crack_mask == 0]
        if len(bg_pixels) > 0:
            mean_color = bg_pixels.mean(axis=0)
            patched[crack_mask != 0] = mean_color

    patched = cv2.GaussianBlur(patched, (5, 5), 0)

    # -------------------------
    # 6. Severity calculation (NOW SAFE)
    # -------------------------
    severity_score = float(min(100, (area_perc * 15) + (zones * 1.5)))

    if severity_score < 25:
        severity_text = "Minor Touch-up"
    elif severity_score < 60:
        severity_text = "Repainting Recommended"
    else:
        severity_text = "Major Restoration"

    # -------------------------
    # 7. Wall condition (FIXED)
    # -------------------------
    label = "Degraded" if severity_score >= 25 else "Good"

    # ML confidence (independent)
    confidence = abs(pred - 0.5) * 200
    confidence = min(100, confidence)

    # -------------------------
    # 8. Repair cost & warnings
    # -------------------------
    repair_cost = float(estimate_repair_cost(area_perc, severity_score))
    warning = generate_warning(severity_score, repair_cost)

    # -------------------------
    # 9. Simulated sensors
    # -------------------------
    gas_status = get_gas_status()
    electricity_status = get_electricity_status()

    combined_warning = combine_alerts(
        warning,
        gas_status,
        electricity_status
    )

    # -------------------------
    # 10. Debug logs
    # -------------------------
    print("Area %:", area_perc)
    print("Zones:", zones)
    print("Severity:", severity_score)
    print("Repair Cost:", repair_cost)

    os.remove(path)
    # -------------------------
# Save crack record
# -------------------------
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("""
        INSERT INTO crack_records (
            timestamp,
            label,
            severity_score,
            repair_cost,
            warning_level
        )
        VALUES (datetime('now','+5 hours','+30 minutes'), ?, ?, ?, ?)
    """, (
        label,
        severity_score,
        repair_cost,
        combined_warning["level"]
    ))

    conn.commit()
    conn.close()

    # -------------------------
    # 11. Response
    # -------------------------
    return jsonify({
        "label": label,
        "confidence": confidence,
        "severity_score": severity_score,
        "severity_text": severity_text,
        "area_perc": area_perc,
        "zones": zones,
        "repair_cost": repair_cost,

        "warning": warning,
        "gas_status": gas_status,
        "electricity_status": electricity_status,
        "combined_warning": combined_warning,

        "highlighted_image": encode_image(highlighted),
        "patched_image": encode_image(patched)
    })

@app.route("/crack-history/<int:crack_id>", methods=["DELETE"])
def delete_crack(crack_id):
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("DELETE FROM crack_records WHERE id = ?", (crack_id,))
    conn.commit()

    deleted = c.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"success": False, "message": "Record not found"}), 404

    return jsonify({"success": True, "message": "Crack record deleted"})

@app.route("/warnings-history", methods=["GET"])
def warnings_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("""
        SELECT timestamp, warning_level, warning_message, repair_cost
        FROM crack_records
        ORDER BY id DESC
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "timestamp": r[0],
            "level": r[1],
            "message": r[2],
            "repair_cost": r[3]
        } for r in rows
    ])

# -----------------------------
# Crack history API
# -----------------------------
@app.route("/crack-history", methods=["GET"])
def crack_history():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("""
        SELECT
            id,
            timestamp,
            label,
            severity_score,
            repair_cost,
            warning_level
        FROM crack_records
        ORDER BY timestamp DESC
    """)

    rows = c.fetchall()
    conn.close()

    history = []
    for r in rows:
        history.append({
            "id": r[0],
            "timestamp": r[1],
            "label": r[2] if r[2] else "Unknown",
            "severity_score": float(r[3]) if r[3] is not None else 0,
            "repair_cost": float(r[4]) if r[4] is not None else 0,
            "warning_level": r[5] if r[5] else "SAFE"
        })

    return jsonify(history)

@app.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    conn = sqlite3.connect("crack_records.db")
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM crack_records")
    total_checks = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM crack_records WHERE warning_level='CRITICAL'")
    critical_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM crack_records WHERE warning_level='WARNING'")
    warning_count = c.fetchone()[0]

    c.execute("SELECT IFNULL(SUM(repair_cost),0) FROM crack_records")
    total_cost = c.fetchone()[0]

    conn.close()

    return jsonify({
        "total_checks": total_checks,
        "critical_alerts": critical_count,
        "warning_alerts": warning_count,
        "total_repair_cost": total_cost
    })

# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
