import torch
import numpy as np
import torch.nn as nn


def _enable_only_dropout(model):
    """
    Puts the model in eval mode overall (so BatchNorm uses its running
    statistics, not batch statistics), then selectively re-enables
    train mode ONLY on Dropout layers — which is what actually needs
    to be active for Monte Carlo Dropout to work.
    """
    model.eval()
    for module in model.modules():
        if isinstance(module, nn.Dropout):
            module.train()


def mc_dropout_predict(model, x_tensor: torch.Tensor, n_passes: int = 50):
    """
    Runs the model n_passes times with ONLY Dropout active (BatchNorm
    stays in eval mode), to estimate epistemic uncertainty for a
    single applicant. Returns: (mean_probability, uncertainty_score)
    """
    _enable_only_dropout(model)
    preds = []
    with torch.no_grad():
        for _ in range(n_passes):
            out = torch.sigmoid(model(x_tensor)).numpy()
            preds.append(out)
    preds = np.array(preds)
    mean_pred = float(preds.mean())
    uncertainty = float(preds.std())
    model.eval()  # fully reset to eval mode afterward
    return mean_pred, uncertainty