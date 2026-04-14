from flask import Blueprint, jsonify
import requests
from database import get_db

gas_bp = Blueprint("gas", __name__)

BLYNK_TOKEN = "I0sHPG7TYOmxUWsuSsOJe2uglxzj_Gc4"
PIN = "V1"


# -----------------------------
# Get Gas Value from Blynk
# -----------------------------
def get_gas_value():

    url = f"https://blynk.cloud/external/api/get?token={BLYNK_TOKEN}&{PIN}"

    try:
        response = requests.get(url, timeout=3)
        return float(response.text)
    except:
        return 0


# -----------------------------
# Determine Level
# -----------------------------
def get_level(value):

    if value > 2000:
        return "CRITICAL", "Gas leakage detected"
    elif value > 1500:
        return "WARNING", "Gas level rising"
    else:
        return "SAFE", "Gas levels normal"


# -----------------------------
# Save Record
# -----------------------------
def save_record(value, level, message):

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        INSERT INTO gas_records (gas_value, level, message)
        VALUES (?, ?, ?)
    """, (value, level, message))

    conn.commit()
    conn.close()


# -----------------------------
# Gas Status
# -----------------------------
@gas_bp.route("/gas-status", methods=["GET"])
def gas_status():

    gas_value = get_gas_value()
    level, message = get_level(gas_value)

    # Save only warning/critical
    if level in ["WARNING", "CRITICAL"]:
        save_record(gas_value, level, message)

    return jsonify({
        "value": gas_value,
        "level": level,
        "message": message
    })


# -----------------------------
# Gas Analytics
# -----------------------------
@gas_bp.route("/gas-analytics", methods=["GET"])
def gas_analytics():

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT
            AVG(gas_value),
            MAX(gas_value),
            MIN(gas_value)
        FROM gas_records
    """)

    stats = c.fetchone()

    c.execute("SELECT COUNT(*) FROM gas_records WHERE level='CRITICAL'")
    critical = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM gas_records WHERE level='WARNING'")
    warning = c.fetchone()[0]

    conn.close()

    return jsonify({
        "averageGas": stats[0] or 0,
        "maxGas": stats[1] or 0,
        "minGas": stats[2] or 0,
        "criticalEvents": critical,
        "warningEvents": warning
    })


# -----------------------------
# Gas History
# -----------------------------
@gas_bp.route("/gas-history", methods=["GET"])
def gas_history():

    conn = get_db()
    c = conn.cursor()

    c.execute("""
        SELECT id, timestamp, gas_value, level, message
        FROM gas_records
        ORDER BY timestamp DESC
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "value": r["gas_value"],
            "level": r["level"],
            "message": r["message"]
        }
        for r in rows
    ])


# -----------------------------
# Delete One Record
# -----------------------------
@gas_bp.route("/gas-history/<int:id>", methods=["DELETE"])
def delete_gas_record(id):

    conn = get_db()
    c = conn.cursor()

    c.execute("DELETE FROM gas_records WHERE id=?", (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Gas record deleted"})


# -----------------------------
# Clear All Records
# -----------------------------
@gas_bp.route("/gas-history", methods=["DELETE"])
def clear_all_gas():

    conn = get_db()
    c = conn.cursor()

    c.execute("DELETE FROM gas_records")

    conn.commit()
    conn.close()

    return jsonify({"message": "All gas records cleared"})