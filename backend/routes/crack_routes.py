from flask import Blueprint, request, jsonify
import os
import sqlite3
import datetime

from services.crack_detection_service import analyze_crack

crack_bp = Blueprint("crack", __name__)

DB = "crack_records.db"


# -----------------------------
# Database connection helper
# -----------------------------
def get_db():
    conn = sqlite3.connect(DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------
# Crack Detection API
# ---------------------------------
@crack_bp.route("/crack-detect", methods=["POST"])
def crack_detect():

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]

    path = "temp.jpg"
    file.save(path)

    try:
        # Run crack detection
        result = analyze_crack(path)

        # Remove temp image
        os.remove(path)

        conn = get_db()
        c = conn.cursor()

        c.execute("""
        INSERT INTO crack_records (
            timestamp,
            label,
            severity_score,
            repair_cost,
            warning_level
        )
        VALUES (?, ?, ?, ?, ?)
        """, (
            datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            result.get("label", "Unknown"),
            result.get("area_perc", 0),
            result.get("repair_cost", 0),
            result.get("combined_warning", {}).get("level", "SAFE")
        ))

        conn.commit()
        conn.close()

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Crack analysis failed",
            "details": str(e)
        }), 500


# ---------------------------------
# Crack History API
# ---------------------------------
@crack_bp.route("/crack-history", methods=["GET"])
def crack_history():

    conn = get_db()
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

    history = [
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "label": r["label"],
            "severity_score": r["severity_score"],
            "repair_cost": r["repair_cost"],
            "warning_level": r["warning_level"]
        }
        for r in rows
    ]

    return jsonify(history)


# ---------------------------------
# Delete Single Crack Record
# ---------------------------------
@crack_bp.route("/crack-history/<int:id>", methods=["DELETE"])
def delete_crack_record(id):

    try:
        conn = get_db()
        c = conn.cursor()

        c.execute("DELETE FROM crack_records WHERE id=?", (id,))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Crack record deleted"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ---------------------------------
# Clear All Crack Records
# ---------------------------------
@crack_bp.route("/crack-history", methods=["DELETE"])
def clear_all_cracks():

    try:
        conn = get_db()
        c = conn.cursor()

        c.execute("DELETE FROM crack_records")

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "All crack records cleared"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500