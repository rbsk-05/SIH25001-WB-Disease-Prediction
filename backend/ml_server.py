from flask import Flask, request, jsonify
import pandas as pd
import joblib
import numpy as np

# Create Flask app
app = Flask(__name__)

# Load trained Gradient Boosting model
hgb_model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    # Get JSON data from POST request
    data = request.json
    
    # Convert to DataFrame (single row)
    df = pd.DataFrame([data])
    
    # Gradient Boosting prediction
    hgb_pred_logit = hgb_model.predict(df)
    
    # Convert logit predictions to probabilities
    hgb_pred_prob = 1 / (1 + np.exp(-hgb_pred_logit))
    
    # Print to CLI
    classes = ["disease prob", "cholera", "typhoid", "hepatitis_a", "shigellosis", "giardia"]
    print("Predicted Probabilities:")
    for disease, prob in zip(classes, hgb_pred_prob[0]):
        print(f"{disease}: {prob*100:.2f}%")
    
    # Return as JSON
    return jsonify({"predicted_probabilities": hgb_pred_prob.tolist()})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
