import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import base64

MODEL_PATH = "models/crack_classifier_model_v2.keras"
IMG_SIZE = (160, 160)

# Load ML model once when server starts
model = load_model(MODEL_PATH)


def preprocess_image(path):

    img = image.load_img(path, target_size=IMG_SIZE)
    img_arr = image.img_to_array(img) / 255.0
    img_arr = np.expand_dims(img_arr, axis=0)

    return img_arr


def analyze_crack(image_path):

    # ---------------------------
    # ML Prediction
    # ---------------------------
    img_batch = preprocess_image(image_path)

    pred = float(model.predict(img_batch, verbose=0)[0][0])

    # ---------------------------
    # OpenCV Crack Detection
    # ---------------------------
    img = cv2.imread(image_path)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blurred, 50, 150)

    # Crack area percentage
    area_perc = float((np.count_nonzero(edges) / edges.size) * 100)

    # Crack zones
    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    zones = int(len(contours))

    # ---------------------------
    # Severity calculation
    # ---------------------------
    severity_score = float(min(100, (area_perc * 15) + (zones * 1.5)))

    if severity_score < 25:
        severity_text = "Minor Touch-up"
    elif severity_score < 60:
        severity_text = "Repainting Recommended"
    else:
        severity_text = "Major Restoration"

    label = "Degraded" if severity_score >= 25 else "Good"

    # ML confidence
    confidence = abs(pred - 0.5) * 200
    confidence = min(100, confidence)

    # Estimated repair cost
    repair_cost = round(area_perc * 300, 2)

    return {
        "label": label,
        "confidence": confidence,
        "severity_score": severity_score,
        "severity_text": severity_text,
        "area_perc": area_perc,
        "zones": zones,
        "repair_cost": repair_cost
    }

def encode_image(img):
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer).decode("utf-8")


def analyze_crack(image_path):

    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect cracks using edge detection
    edges = cv2.Canny(gray, 50, 150)

    # Dilate to enlarge crack region
    kernel = np.ones((3, 3), np.uint8)
    crack_mask = cv2.dilate(edges, kernel, iterations=2)

# -----------------------------
    # Highlight cracks (professional overlay)
    # -----------------------------
    highlighted = img.copy()

    overlay = highlighted.copy()

    # Amber inspection color
    overlay[crack_mask > 0] = [0, 0, 255]

    # Blend overlay with original image
    alpha = 0.4
    highlighted = cv2.addWeighted(overlay, alpha, highlighted, 1 - alpha, 0)

    # -----------------------------
    # Patch cracks (simple fill)
    # -----------------------------
    patched = img.copy()

    patched = cv2.inpaint(
        patched,
        crack_mask,
        3,
        cv2.INPAINT_TELEA
    )

    # -----------------------------
    # Calculate crack area
    # -----------------------------
    crack_pixels = np.sum(crack_mask > 0)
    total_pixels = img.shape[0] * img.shape[1]

    area_perc = (crack_pixels / total_pixels) * 100

    # -----------------------------
    # Determine severity
    # -----------------------------
    if area_perc > 15:
        severity_text = "Severe"
        level = "CRITICAL"
    elif area_perc > 5:
        severity_text = "Moderate"
        level = "WARNING"
    else:
        severity_text = "Low"
        level = "SAFE"

    # -----------------------------
    # Logical repair cost
    # -----------------------------
    base_cost = 110

    repair_cost = round(base_cost + (area_perc * 120), 2)

    # -----------------------------
    # Encode images
    # -----------------------------
    highlighted_img = encode_image(highlighted)
    patched_img = encode_image(patched)

    return {
        "label": "Minor Crack" if level == "SAFE" else "Structural Crack",
        "severity_text": severity_text,
        "area_perc": round(area_perc, 2),
        "repair_cost": round(repair_cost, 2),

        "highlighted_image": highlighted_img,
        "patched_image": patched_img,

        "combined_warning": {
            "level": level,
            "message": "Structure is stable"
            if level == "SAFE"
            else "Crack requires maintenance"
        }
    }
