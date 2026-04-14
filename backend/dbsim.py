from tabulate import tabulate
import sqlite3

conn = sqlite3.connect("crack_records.db")
c = conn.cursor()

c.execute("SELECT * FROM appliance_usage")
rows = c.fetchall()

print(tabulate(rows, headers=["ID", "Appliance", "Timestamp", "Current (mA)"], tablefmt="grid"))

conn.close()