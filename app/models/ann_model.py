import torch
import torch.nn as nn
from pathlib import Path

MODELS_DIR = Path(__file__).parent


class LoanANN(nn.Module):
    """
    Baseline Deep ANN classifier for loan approval prediction.
    Architecture: 171 -> 128 -> 64 -> 32 -> 1
    """
    def __init__(self, input_size: int):
        super(LoanANN, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.3),

            nn.Linear(128, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.25),

            nn.Linear(64, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Dropout(0.2),

            nn.Linear(32, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)


def load_production_model(input_size: int = 171) -> LoanANN:
    """
    Loads the trained baseline ANN (promoted to production after the
    ablation study against TabTransformer — see PRD Section 7.1).
    """
    model = LoanANN(input_size)
    model.load_state_dict(
        torch.load(MODELS_DIR / "best_ann_model.pt", map_location="cpu")
    )
    model.eval()
    return model