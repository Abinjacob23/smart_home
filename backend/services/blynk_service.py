import requests
from config import BLYNK_TOKEN

def get_blynk_value(pin):

    try:
        url = f"https://blynk.cloud/external/api/get?token={BLYNK_TOKEN}&{pin}"
        r = requests.get(url,timeout=5)
        r.raise_for_status()
        return float(r.text)

    except Exception as e:
        print("Blynk error:",e)
        return None