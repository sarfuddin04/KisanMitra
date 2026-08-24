"""
Agronomic Crop Dataset for Crop Recommendation.
Based on standard ICAR (Indian Council of Agricultural Research) soil & climate ranges
for major Indian kharif, rabi, and zaid crops.
"""

import numpy as np
import pandas as pd

CROP_PROFILES = {
    "Rice": {"N": (60, 100), "P": (35, 60), "K": (35, 45), "temp": (20, 27), "humidity": (80, 85), "ph": (5.0, 7.0), "rainfall": (180, 300)},
    "Maize": {"N": (60, 100), "P": (35, 60), "K": (15, 25), "temp": (18, 27), "humidity": (55, 75), "ph": (5.5, 7.5), "rainfall": (60, 110)},
    "Chickpea": {"N": (20, 60), "P": (55, 80), "K": (75, 85), "temp": (17, 22), "humidity": (14, 20), "ph": (5.9, 8.5), "rainfall": (65, 95)},
    "Kidney Beans": {"N": (15, 40), "P": (55, 80), "K": (15, 25), "temp": (15, 25), "humidity": (18, 25), "ph": (5.5, 6.0), "rainfall": (60, 150)},
    "Pigeonpeas": {"N": (15, 40), "P": (55, 75), "K": (15, 25), "temp": (27, 38), "humidity": (30, 65), "ph": (5.0, 7.5), "rainfall": (90, 198)},
    "Mothbeans": {"N": (15, 40), "P": (35, 60), "K": (15, 25), "temp": (24, 32), "humidity": (40, 65), "ph": (3.5, 9.5), "rainfall": (30, 75)},
    "Mungbean": {"N": (15, 40), "P": (35, 60), "K": (15, 25), "temp": (27, 30), "humidity": (80, 90), "ph": (6.2, 7.2), "rainfall": (35, 60)},
    "Blackgram": {"N": (35, 60), "P": (55, 80), "K": (15, 25), "temp": (25, 35), "humidity": (60, 70), "ph": (6.5, 7.5), "rainfall": (60, 75)},
    "Lentil": {"N": (15, 40), "P": (55, 80), "K": (15, 25), "temp": (18, 30), "humidity": (60, 70), "ph": (5.9, 7.8), "rainfall": (35, 55)},
    "Pomegranate": {"N": (15, 40), "P": (10, 30), "K": (35, 45), "temp": (18, 25), "humidity": (85, 95), "ph": (5.5, 7.2), "rainfall": (100, 115)},
    "Banana": {"N": (80, 120), "P": (70, 95), "K": (45, 55), "temp": (25, 30), "humidity": (75, 85), "ph": (5.5, 6.5), "rainfall": (90, 120)},
    "Mango": {"N": (15, 40), "P": (15, 35), "K": (25, 35), "temp": (27, 36), "humidity": (45, 55), "ph": (4.5, 7.0), "rainfall": (89, 101)},
    "Grapes": {"N": (15, 40), "P": (120, 145), "K": (195, 205), "temp": (8, 42), "humidity": (80, 85), "ph": (5.5, 6.5), "rainfall": (65, 75)},
    "Watermelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (24, 27), "humidity": (80, 90), "ph": (6.0, 6.8), "rainfall": (40, 60)},
    "Muskmelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (27, 30), "humidity": (90, 95), "ph": (6.0, 6.8), "rainfall": (20, 30)},
    "Apple": {"N": (15, 40), "P": (120, 145), "K": (195, 205), "temp": (21, 24), "humidity": (90, 95), "ph": (5.5, 6.5), "rainfall": (100, 125)},
    "Orange": {"N": (15, 40), "P": (5, 30), "K": (5, 15), "temp": (15, 35), "humidity": (90, 95), "ph": (6.0, 8.0), "rainfall": (100, 120)},
    "Papaya": {"N": (40, 60), "P": (55, 75), "K": (45, 55), "temp": (23, 44), "humidity": (90, 95), "ph": (6.5, 7.0), "rainfall": (140, 250)},
    "Coconut": {"N": (15, 40), "P": (5, 30), "K": (25, 35), "temp": (25, 29), "humidity": (90, 99), "ph": (5.5, 6.5), "rainfall": (130, 230)},
    "Cotton": {"N": (100, 140), "P": (35, 60), "K": (15, 25), "temp": (22, 26), "humidity": (75, 85), "ph": (6.0, 8.0), "rainfall": (60, 100)},
    "Jute": {"N": (60, 100), "P": (35, 60), "K": (35, 45), "temp": (23, 26), "humidity": (70, 90), "ph": (6.0, 7.5), "rainfall": (150, 200)},
    "Coffee": {"N": (80, 120), "P": (15, 40), "K": (25, 35), "temp": (23, 28), "humidity": (50, 70), "ph": (6.0, 7.5), "rainfall": (115, 200)}
}

def generate_crop_dataset(samples_per_crop=100, random_seed=42):
    """Generate synthetic but realistic agronomic dataset based on ICAR parameters."""
    np.random.seed(random_seed)
    data = []
    
    for crop, profile in CROP_PROFILES.items():
        for _ in range(samples_per_crop):
            n = np.random.uniform(profile["N"][0], profile["N"][1])
            p = np.random.uniform(profile["P"][0], profile["P"][1])
            k = np.random.uniform(profile["K"][0], profile["K"][1])
            temp = np.random.uniform(profile["temp"][0], profile["temp"][1])
            humidity = np.random.uniform(profile["humidity"][0], profile["humidity"][1])
            ph = np.random.uniform(profile["ph"][0], profile["ph"][1])
            rainfall = np.random.uniform(profile["rainfall"][0], profile["rainfall"][1])
            
            # Add slight realistic Gaussian noise
            n = max(0, n + np.random.normal(0, 2.5))
            p = max(0, p + np.random.normal(0, 2.0))
            k = max(0, k + np.random.normal(0, 2.0))
            temp = max(0, temp + np.random.normal(0, 0.8))
            humidity = min(100, max(5, humidity + np.random.normal(0, 1.5)))
            ph = min(14, max(3, ph + np.random.normal(0, 0.2)))
            rainfall = max(10, rainfall + np.random.normal(0, 5.0))
            
            data.append({
                "N": round(n, 2),
                "P": round(p, 2),
                "K": round(k, 2),
                "temperature": round(temp, 2),
                "humidity": round(humidity, 2),
                "ph": round(ph, 2),
                "rainfall": round(rainfall, 2),
                "label": crop
            })
            
    df = pd.DataFrame(data)
    # Shuffle
    df = df.sample(frac=1, random_state=random_seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    df = generate_crop_dataset(100)
    df.to_csv("crop_data.csv", index=False)
    print(f"Dataset generated with {len(df)} samples across {df['label'].nunique()} crops.")
