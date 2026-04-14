import sqlite3
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

def train_model(appliance):

    conn = sqlite3.connect("crack_records.db")

    df = pd.read_sql_query(
        f"""
        SELECT timestamp, current_value
        FROM appliance_usage
        WHERE appliance_name='{appliance}'
        """, conn)

    conn.close()

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["timestamp"].dt.hour

    X = df[["hour"]]
    y = df["current_value"]

    model = RandomForestRegressor()
    model.fit(X, y)

    return model
def predict_ideal_hour(model):

    hours = pd.DataFrame({"hour": list(range(24))})

    predictions = model.predict(hours)

    ideal_hour = hours.iloc[predictions.argmin()]["hour"]

    return int(ideal_hour)