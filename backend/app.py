from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import cv2
import numpy as np
import base64
import os
import sqlite3
import datetime

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

    conn.commit()
    conn.close()
init_db()
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
def get_gas_status():
    # Simulated LPG sensor
    # In real system → ESP32
    return {
        "level": "SAFE",   # SAFE / WARNING / CRITICAL
        "value": 320       # ppm
    }

def get_electricity_status():
    # Simulated leakage sensor
    return {
        "level": "WARNING",
        "leakage_current": 18  # mA
    }
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
