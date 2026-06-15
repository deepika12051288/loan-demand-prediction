"""
Hyperparameter Tuning Script for Loan Demand Prediction Model
==============================================================
Uses GridSearchCV with 5-fold cross-validation to find optimal
RandomForestRegressor parameters on the seasonal loan dataset.

Outputs:
  - Best hyperparameters
  - Before vs After comparison (R², MAE, RMSE)
  - Saves tuned model to loan_demand_model.pkl
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


DATASET_PATH = os.path.join(os.path.dirname(__file__), "seasonal_loan_dataset.xls")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "loan_demand_model.pkl")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "tuning_results.json")


def load_and_prepare_data():
    """Load dataset and prepare features/target."""
    df = pd.read_csv(DATASET_PATH)

    # Feature engineering: Demand per Farmer
    df["Demand_per_Farmer"] = df["Previous_Loan_Demand"] / df["Farmer_Count"]

    # Separate features and target
    X = df.drop(columns=["Loan_Demand"])
    y = df["Loan_Demand"]

    return X, y


def evaluate_model(model, X_test, y_test):
    """Evaluate a model and return metrics dict."""
    y_pred = model.predict(X_test)
    return {
        "r2_score": round(r2_score(y_test, y_pred), 4),
        "mae": round(mean_absolute_error(y_test, y_pred), 2),
        "rmse": round(np.sqrt(mean_squared_error(y_test, y_pred)), 2),
    }


def run_tuning(param_grid=None):
    """
    Run full hyperparameter tuning pipeline.

    Parameters
    ----------
    param_grid : dict, optional
        Custom parameter grid. If None, uses a comprehensive default grid.

    Returns
    -------
    dict
        Results containing before/after metrics, best params, and timing info.
    """
    print("=" * 60)
    print("  HYPERPARAMETER TUNING - Loan Demand Prediction Model")
    print("=" * 60)

    # ── Load Data ──
    print("\n[1/5] Loading dataset...")
    X, y = load_and_prepare_data()
    print(f"      Dataset shape: {X.shape[0]} rows × {X.shape[1]} features")

    # ── Train/Test Split ──
    print("\n[2/5] Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"      Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")

    # ── Evaluate BEFORE Model ──
    print("\n[3/5] Evaluating current model (before tuning)...")
    before_model = RandomForestRegressor(
        n_estimators=200, max_depth=15, random_state=42
    )
    before_model.fit(X_train, y_train)
    before_metrics = evaluate_model(before_model, X_test, y_test)

    # Cross-validation score for the before model
    before_cv = cross_val_score(before_model, X_train, y_train, cv=5, scoring="r2")
    before_metrics["cv_r2_mean"] = round(before_cv.mean(), 4)
    before_metrics["cv_r2_std"] = round(before_cv.std(), 4)

    print(f"      R² Score:  {before_metrics['r2_score']}")
    print(f"      MAE:       {before_metrics['mae']}")
    print(f"      RMSE:      {before_metrics['rmse']}")
    print(f"      CV R² (5-fold): {before_metrics['cv_r2_mean']} ± {before_metrics['cv_r2_std']}")

    # ── GridSearchCV ──
    print("\n[4/5] Running GridSearchCV (this may take a minute)...")

    if param_grid is None:
        param_grid = {
            "n_estimators": [100, 200, 300],
            "max_depth": [10, 15, 20, None],
            "min_samples_split": [2, 5],
            "min_samples_leaf": [1, 2],
        }

    grid_search = GridSearchCV(
        estimator=RandomForestRegressor(random_state=42),
        param_grid=param_grid,
        cv=5,
        scoring="r2",
        n_jobs=-1,
        verbose=1,
        return_train_score=True,
    )

    start_time = time.time()
    grid_search.fit(X_train, y_train)
    tuning_time = round(time.time() - start_time, 2)

    best_params = grid_search.best_params_
    total_fits = len(grid_search.cv_results_["mean_test_score"])

    print(f"\n      [OK] Tuning complete in {tuning_time}s")
    print(f"      Total combinations evaluated: {total_fits}")
    print(f"      Best Parameters: {best_params}")

    # ── Evaluate AFTER Model ──
    print("\n[5/5] Evaluating tuned model (after tuning)...")
    tuned_model = grid_search.best_estimator_
    after_metrics = evaluate_model(tuned_model, X_test, y_test)

    after_cv = cross_val_score(tuned_model, X_train, y_train, cv=5, scoring="r2")
    after_metrics["cv_r2_mean"] = round(after_cv.mean(), 4)
    after_metrics["cv_r2_std"] = round(after_cv.std(), 4)

    print(f"      R² Score:  {after_metrics['r2_score']}")
    print(f"      MAE:       {after_metrics['mae']}")
    print(f"      RMSE:      {after_metrics['rmse']}")
    print(f"      CV R² (5-fold): {after_metrics['cv_r2_mean']} ± {after_metrics['cv_r2_std']}")

    # ── Improvement Summary ──
    r2_improvement = round(after_metrics["r2_score"] - before_metrics["r2_score"], 4)
    mae_improvement = round(before_metrics["mae"] - after_metrics["mae"], 2)

    print("\n" + "=" * 60)
    print("  COMPARISON SUMMARY")
    print("=" * 60)
    print(f"  {'Metric':<20} {'Before':>10} {'After':>10} {'Change':>10}")
    print(f"  {'-'*50}")
    print(f"  {'R² Score':<20} {before_metrics['r2_score']:>10} {after_metrics['r2_score']:>10} {r2_improvement:>+10}")
    print(f"  {'MAE':<20} {before_metrics['mae']:>10} {after_metrics['mae']:>10} {-mae_improvement:>+10}")
    print(f"  {'RMSE':<20} {before_metrics['rmse']:>10} {after_metrics['rmse']:>10}")
    print("=" * 60)

    # ── Save Model ──
    joblib.dump(tuned_model, MODEL_PATH)
    print(f"\n  [OK] Tuned model saved to: {MODEL_PATH}")

    # ── Feature Importance ──
    feature_importance = dict(
        zip(X.columns.tolist(), tuned_model.feature_importances_.tolist())
    )
    sorted_importance = dict(
        sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    )

    # ── Save Results ──
    results = {
        "before_params": {
            "n_estimators": 200,
            "max_depth": 15,
            "random_state": 42,
        },
        "after_params": best_params,
        "before_metrics": before_metrics,
        "after_metrics": after_metrics,
        "r2_improvement": r2_improvement,
        "mae_improvement": mae_improvement,
        "tuning_time_seconds": tuning_time,
        "total_combinations": total_fits,
        "best_cv_score": round(grid_search.best_score_, 4),
        "feature_importance": {k: round(v, 4) for k, v in sorted_importance.items()},
        "dataset_info": {
            "total_rows": X.shape[0],
            "total_features": X.shape[1],
            "train_rows": X_train.shape[0],
            "test_rows": X_test.shape[0],
        },
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"  [OK] Results saved to: {RESULTS_PATH}")
    print("\n  Done!\n")

    return results


if __name__ == "__main__":
    run_tuning()
