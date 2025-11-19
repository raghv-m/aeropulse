@echo off
echo ========================================
echo   Installing ML Dependencies
echo ========================================
echo.
echo This will install XGBoost, SHAP, Polars, and other ML libraries.
echo This may take several minutes...
echo.

python -m pip install --user polars xgboost scikit-learn joblib
python -m pip install --user shap
python -m pip install --user pandas numpy

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo You can now train the model using:
echo   POST http://localhost:8000/api/v1/train
echo.
pause

