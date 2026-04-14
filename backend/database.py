import sqlite3
from config import DB_NAME


# -----------------------------
# Database connection
# -----------------------------
def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# -----------------------------
# Database initialization
# -----------------------------
def init_db():

    conn = get_db()
    c = conn.cursor()

    # -----------------------------
    # Crack detection records
    # -----------------------------
    c.execute("""
    CREATE TABLE IF NOT EXISTS crack_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        label TEXT,
        severity_score REAL,
        repair_cost REAL,
        warning_level TEXT
    )
    """)

    # -----------------------------
    # Registered appliances
    # -----------------------------
    c.execute("""
    CREATE TABLE IF NOT EXISTS appliances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    )
    """)

    # -----------------------------
    # Appliance usage tracking
    # -----------------------------
    c.execute("""
    CREATE TABLE IF NOT EXISTS appliance_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appliance_name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        current_value REAL
    )
    """)

    # -----------------------------
    # Gas leak records
    # -----------------------------
    c.execute("""
    CREATE TABLE IF NOT EXISTS gas_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        gas_value REAL,
        level TEXT,
        message TEXT
    )
    """)

    # -----------------------------
    # Electricity monitoring records
    # -----------------------------
    c.execute("""
    CREATE TABLE IF NOT EXISTS electricity_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        current_value REAL,
        leakage INTEGER,
        level TEXT,
        message TEXT,
        voltage REAL,
        power_watt REAL,
        energy_kwh REAL
    )
    """)

    conn.commit()
    conn.close()