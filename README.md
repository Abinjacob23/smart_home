## 🏗️ System Architecture

# 🏠 Smart Home Surveillance System

A full-stack **Smart Home Surveillance System** that monitors **wall cracks, gas leakage, and electrical leakage**, using **AI-based crack detection**, **sensor simulation**, and a **React Native mobile app** for real-time monitoring, alerts, and analytics.

---

## 📌 Features

### 🧱 Crack Detection (AI + Image Processing)
- Crack detection using a **trained Keras CNN model**
- Crack area and severity estimation using **OpenCV**
- Wall condition classification (Good / Degraded)
- **AR-style crack patch visualization**
- Repair cost estimation based on severity
- Crack analysis history storage

### 🔥 Gas Safety Module
- Simulated LPG gas leakage detection
- Safety levels: SAFE / WARNING / CRITICAL
- Dedicated Gas Safety screen in the app

### ⚡ Electrical Safety Module
- Simulated current leakage detection
- Safety levels: SAFE / WARNING / CRITICAL
- Dedicated Electrical Safety screen

### ⚠️ Alerts & Warnings
- Combined alerts (Crack + Gas + Electricity)
- Warning history with timestamps
- Severity-based alert levels

### 📊 Dashboard Analytics
- Total crack inspections
- Critical and warning alerts count
- Total estimated repair cost
- Overall home safety overview

---

## 🏗️ System Architecture

ESP32 / Sensors (Simulated)->Flask Backend (Python)->SQLite Database->React Native App (Expo)

### Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py


### Frontend Setup (React Native)
npm install
npx expo start -c
📱 Open Expo Go on your phone and scan the QR code.
⚠️ Ensure your phone and PC are on the same Wi-Fi network.

### Configure API Base URL
services/api.ts->export const api = axios.create({
  baseURL: "http://<YOUR_LOCAL_IP>:5000",
});
paste your ip address

### AI Model
_____________________________________
Model: crack_classifier_model_v2.keras
Framework: TensorFlow / Keras
Input: Wall surface image
Output: Crack probability
Final condition determined using severity fusion logic

### Database
____________________________________
SQLite (crack_records.db)
Automatically created on backend startup
Stores:
Timestamp
Wall condition
Severity score
Repair cost
Warning level

### To Do
____________________
Sensor fusion from an ESP32 module
