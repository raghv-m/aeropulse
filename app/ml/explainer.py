import shap
import numpy as np
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class GripExplainer:
    """SHAP-based explainer for grip loss predictions"""
    
    def __init__(self, model):
        """
        Initialize SHAP explainer
        
        Args:
            model: Trained XGBoost model
        """
        self.model = model
        self.explainer = None
        self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize SHAP TreeExplainer"""
        try:
            self.explainer = shap.TreeExplainer(self.model)
            logger.info("SHAP explainer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize SHAP explainer: {e}")
            self.explainer = None
    
    def explain_prediction(
        self, 
        features: np.ndarray, 
        feature_names: List[str],
        top_k: int = 5
    ) -> List[Dict[str, float]]:
        """
        Generate SHAP explanations for a prediction
        
        Args:
            features: Feature vector (1D array)
            feature_names: List of feature names
            top_k: Number of top features to return
        
        Returns:
            List of dictionaries with SHAP explanations
        """
        if self.explainer is None:
            logger.warning("SHAP explainer not initialized, returning empty explanations")
            return []
        
        try:
            # Ensure features is 2D
            if features.ndim == 1:
                features = features.reshape(1, -1)
            
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(features)
            
            # Handle different SHAP output formats
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            
            # Flatten if needed
            if shap_values.ndim > 1:
                shap_values = shap_values[0]
            
            # Get base value
            if hasattr(self.explainer, 'expected_value'):
                base_value = self.explainer.expected_value
                if isinstance(base_value, np.ndarray):
                    base_value = float(base_value[0])
                else:
                    base_value = float(base_value)
            else:
                base_value = 0.0
            
            # Create explanations
            explanations = []
            for i, name in enumerate(feature_names):
                if i < len(shap_values):
                    explanations.append({
                        "feature_name": name,
                        "contribution": float(shap_values[i]),
                        "feature_value": float(features[0, i]),
                        "baseline": base_value
                    })
            
            # Sort by absolute contribution and return top K
            explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            
            return explanations[:top_k]
        
        except Exception as e:
            logger.error(f"Error generating SHAP explanations: {e}")
            return []
    
    def get_feature_importance(self, feature_names: List[str]) -> List[Dict[str, float]]:
        """
        Get global feature importance from the model
        
        Args:
            feature_names: List of feature names
        
        Returns:
            List of dictionaries with feature importance
        """
        try:
            # Get feature importance from XGBoost model
            importance = self.model.feature_importances_
            
            importance_list = []
            for i, name in enumerate(feature_names):
                if i < len(importance):
                    importance_list.append({
                        "feature_name": name,
                        "importance": float(importance[i])
                    })
            
            # Sort by importance
            importance_list.sort(key=lambda x: x["importance"], reverse=True)
            
            return importance_list
        
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return []
    
    def explain_batch(
        self,
        features_batch: np.ndarray,
        feature_names: List[str]
    ) -> np.ndarray:
        """
        Generate SHAP values for a batch of predictions
        
        Args:
            features_batch: Feature matrix (2D array)
            feature_names: List of feature names
        
        Returns:
            SHAP values matrix
        """
        if self.explainer is None:
            logger.warning("SHAP explainer not initialized")
            return np.zeros_like(features_batch)
        
        try:
            shap_values = self.explainer.shap_values(features_batch)
            
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            
            return shap_values
        
        except Exception as e:
            logger.error(f"Error generating batch SHAP explanations: {e}")
            return np.zeros_like(features_batch)
    
    def get_summary_plot_data(
        self,
        features_batch: np.ndarray,
        feature_names: List[str]
    ) -> Dict:
        """
        Get data for SHAP summary plot
        
        Args:
            features_batch: Feature matrix
            feature_names: List of feature names
        
        Returns:
            Dictionary with plot data
        """
        shap_values = self.explain_batch(features_batch, feature_names)
        
        return {
            "shap_values": shap_values.tolist(),
            "features": features_batch.tolist(),
            "feature_names": feature_names
        }

