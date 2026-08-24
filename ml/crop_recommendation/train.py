"""
Crop Recommendation Model Training Pipeline.
Uses Scikit-learn Random Forest Classifier to classify suitable crops based on
N, P, K, Temperature, Humidity, pH, and Rainfall.
Generates evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
and serializes the trained model to crop_model.joblib.
"""

import os
import json
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support, confusion_matrix
from dataset import generate_crop_dataset

def train_model():
    print("1. Generating agronomic dataset...")
    df = generate_crop_dataset(samples_per_crop=150, random_seed=42)
    
    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    X = df[features]
    y = df["label"]
    
    print("2. Splitting train and test datasets (80/20 split)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    
    print("3. Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
    model.fit(X_train, y_train)
    
    print("4. Evaluating model on test set...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    classes = list(model.classes_)
    
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    
    print(f"--> Test Accuracy: {accuracy * 100:.2f}%")
    print(f"--> Weighted Precision: {precision * 100:.2f}%")
    print(f"--> Weighted Recall: {recall * 100:.2f}%")
    print(f"--> Weighted F1 Score: {f1 * 100:.2f}%")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "crop_model.joblib")
    metrics_path = os.path.join(current_dir, "metrics.json")
    
    # Save model
    joblib.dump({
        "model": model,
        "features": features,
        "classes": classes
    }, model_path)
    print(f"5. Model saved successfully to {model_path}")
    
    # Save metrics
    metrics = {
        "model_name": "Random Forest Crop Recommender",
        "n_estimators": 100,
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "classes_count": len(classes),
        "classes": classes,
        "sample_count": len(df),
        "features": features
    }
    
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"6. Metrics saved to {metrics_path}")
    return model, metrics

if __name__ == "__main__":
    train_model()
