from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json
import os

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), "../frontend/build/static"),
    template_folder=os.path.join(os.path.dirname(__file__), "../frontend/build")
)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "loan_demand_model.pkl")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "tuning_results.json")

# Load Model
model = joblib.load(MODEL_PATH)


@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    rainfall = float(data["rainfall"])
    farmer_count = int(data["farmerCount"])
    previous_demand = float(data["previousDemand"])
    yield_value = float(data["yield"])

    season = data["season"]
    crop = data["crop"]
    region = data["region"]

    # Feature Engineering
    demand_per_farmer = previous_demand / farmer_count

    input_df = pd.DataFrame([{
        "Rainfall_mm": rainfall,
        "Farmer_Count": farmer_count,
        "Previous_Loan_Demand": previous_demand,
        "Yield": yield_value,

        "Season_Kharif": 1 if season == "Kharif" else 0,
        "Season_Rabi": 1 if season == "Rabi" else 0,
        "Season_Summer": 1 if season == "Summer" else 0,

        "Crop_Type_Cotton": 1 if crop == "Cotton" else 0,
        "Crop_Type_Maize": 1 if crop == "Maize" else 0,
        "Crop_Type_Rice": 1 if crop == "Rice" else 0,
        "Crop_Type_Sugarcane": 1 if crop == "Sugarcane" else 0,
        "Crop_Type_Wheat": 1 if crop == "Wheat" else 0,

        "Region_Central": 1 if region == "Central" else 0,
        "Region_East": 1 if region == "East" else 0,
        "Region_North": 1 if region == "North" else 0,
        "Region_South": 1 if region == "South" else 0,
        "Region_West": 1 if region == "West" else 0,

        "Demand_per_Farmer": demand_per_farmer
    }])

    prediction = model.predict(input_df)

    # Convert to whole number
    prediction = round(float(prediction[0]))

    return jsonify({
        "prediction": prediction
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    """Return current model parameters and tuning results."""
    global model

    # Current model params
    params = model.get_params()
    info = {
        "model_type": type(model).__name__,
        "current_params": {
            "n_estimators": params.get("n_estimators"),
            "max_depth": params.get("max_depth"),
            "min_samples_split": params.get("min_samples_split"),
            "min_samples_leaf": params.get("min_samples_leaf"),
            "max_features": params.get("max_features"),
            "random_state": params.get("random_state"),
        },
    }

    # Load tuning results if they exist
    if os.path.exists(RESULTS_PATH):
        with open(RESULTS_PATH, "r") as f:
            tuning_results = json.load(f)
        info["tuning_results"] = tuning_results

    return jsonify(info)


@app.route("/tune", methods=["POST"])
def tune():
    """Trigger hyperparameter tuning and return results."""
    global model

    from hyperparameter_tuning import run_tuning

    # Get optional custom param grid from request
    data = request.json or {}
    param_grid = data.get("param_grid", None)

    try:
        results = run_tuning(param_grid=param_grid)

        # Reload the newly saved model
        model = joblib.load(MODEL_PATH)

        return jsonify({
            "status": "success",
            "results": results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/dataset-stats", methods=["GET"])
def dataset_stats():
    """Return dataset statistics for analytics dashboard."""
    dataset_path = os.path.join(os.path.dirname(__file__), "seasonal_loan_dataset.xls")

    if not os.path.exists(dataset_path):
        return jsonify({"error": "Dataset not found"}), 404

    df = pd.read_csv(dataset_path)

    # Region-wise average demand
    region_cols = [c for c in df.columns if c.startswith("Region_")]
    region_demand = {}
    for col in region_cols:
        region_name = col.replace("Region_", "")
        avg_demand = round(df[df[col] == True]["Loan_Demand"].mean(), 1)
        region_demand[region_name] = avg_demand

    # Crop-wise average demand
    crop_cols = [c for c in df.columns if c.startswith("Crop_Type_")]
    crop_demand = {}
    for col in crop_cols:
        crop_name = col.replace("Crop_Type_", "")
        avg_demand = round(df[df[col] == True]["Loan_Demand"].mean(), 1)
        crop_demand[crop_name] = avg_demand

    # Season-wise average demand
    season_cols = [c for c in df.columns if c.startswith("Season_")]
    season_demand = {}
    for col in season_cols:
        season_name = col.replace("Season_", "")
        avg_demand = round(df[df[col] == True]["Loan_Demand"].mean(), 1)
        season_demand[season_name] = avg_demand

    # Demand distribution buckets
    demand_distribution = {
        "low": int((df["Loan_Demand"] < 700).sum()),
        "medium": int(((df["Loan_Demand"] >= 700) & (df["Loan_Demand"] < 1200)).sum()),
        "high": int((df["Loan_Demand"] >= 1200).sum()),
    }

    # Rainfall vs Demand (sampled for scatter plot)
    sample = df.sample(min(100, len(df)), random_state=42)
    scatter_data = [
        {"rainfall": int(row["Rainfall_mm"]), "demand": int(row["Loan_Demand"])}
        for _, row in sample.iterrows()
    ]

    return jsonify({
        "total_records": len(df),
        "avg_demand": round(df["Loan_Demand"].mean(), 1),
        "region_demand": region_demand,
        "crop_demand": crop_demand,
        "season_demand": season_demand,
        "demand_distribution": demand_distribution,
        "scatter_data": scatter_data,
    })


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.template_folder, path)):
        return send_from_directory(app.template_folder, path)
    else:
        return send_from_directory(app.template_folder, "index.html")


if __name__ == "__main__":
    import webbrowser
    from threading import Timer

    def open_browser():
        webbrowser.open_new("http://127.0.0.1:5000/")

    # Only open browser in the main thread (ignores Flask's Werkzeug reloader reload)
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        Timer(1.5, open_browser).start()

    app.run(debug=True)