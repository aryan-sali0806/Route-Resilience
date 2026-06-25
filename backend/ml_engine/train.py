"""
Route Resilience — DeepLabV3+ training script.
Designed for Google Colab (GPU recommended).

Colab quick-start
-----------------
    !pip install segmentation-models-pytorch tqdm albumentations opencv-python-headless

    !python backend/ml_engine/train.py \
        --train-dir /content/drive/MyDrive/deepglobe/train \
        --val-dir   /content/drive/MyDrive/deepglobe/valid \
        --epochs 50 --batch-size 8
"""

import argparse
import os
import sys

import albumentations as A
import segmentation_models_pytorch as smp
import torch
import torch.nn as nn
from albumentations.pytorch import ToTensorV2
from torch.optim import Adam
from torch.utils.data import DataLoader
from tqdm import tqdm

# Allow running from any working directory (e.g. Colab repo root)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dataset import DeepGlobeDataset  # noqa: E402

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(_HERE, "weights")
BEST_MODEL_PATH = os.path.join(WEIGHTS_DIR, "best_model.pth")

# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------
TRAIN_TRANSFORM = A.Compose([
    A.RandomCrop(height=512, width=512),
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.5),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2(),
])

# No random crop for validation — deterministic centre crop instead
VAL_TRANSFORM = A.Compose([
    A.CenterCrop(height=512, width=512),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2(),
])


# ---------------------------------------------------------------------------
# Loss: 0.5 * BCE + 0.5 * Dice
# ---------------------------------------------------------------------------
class BCEDiceLoss(nn.Module):
    def __init__(self, bce_weight: float = 0.5, smooth: float = 1.0) -> None:
        super().__init__()
        self.bce_weight = bce_weight
        self.smooth = smooth
        self._bce = nn.BCEWithLogitsLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        bce = self._bce(logits, targets)

        probs = torch.sigmoid(logits)
        flat_p = probs.view(-1)
        flat_t = targets.view(-1)
        intersection = (flat_p * flat_t).sum()
        dice = 1.0 - (2.0 * intersection + self.smooth) / (
            flat_p.sum() + flat_t.sum() + self.smooth
        )

        return self.bce_weight * bce + (1.0 - self.bce_weight) * dice


# ---------------------------------------------------------------------------
# Metric
# ---------------------------------------------------------------------------
def batch_iou(logits: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> float:
    preds = (torch.sigmoid(logits) > threshold).float()
    intersection = (preds * targets).sum(dim=(1, 2, 3))
    union = preds.sum(dim=(1, 2, 3)) + targets.sum(dim=(1, 2, 3)) - intersection
    return ((intersection + 1e-6) / (union + 1e-6)).mean().item()


# ---------------------------------------------------------------------------
# Train / validate
# ---------------------------------------------------------------------------
def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: Adam,
    device: torch.device,
    scaler: torch.GradScaler,
) -> float:
    model.train()
    total_loss = 0.0
    for images, masks in tqdm(loader, desc="  train", leave=False):
        images, masks = images.to(device), masks.to(device)
        optimizer.zero_grad()
        with torch.autocast(device_type=device.type, enabled=device.type == "cuda"):
            logits = model(images)
            loss = criterion(logits, masks)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        total_loss += loss.item()
    return total_loss / len(loader)


@torch.no_grad()
def validate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    model.eval()
    total_loss, total_iou = 0.0, 0.0
    for images, masks in tqdm(loader, desc="  val  ", leave=False):
        images, masks = images.to(device), masks.to(device)
        logits = model(images)
        total_loss += criterion(logits, masks).item()
        total_iou += batch_iou(logits, masks)
    n = len(loader)
    return total_loss / n, total_iou / n


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train DeepLabV3+ on DeepGlobe roads")
    p.add_argument(
        "--train-dir", required=True,
        help="Folder containing *_sat.jpg and *_mask.png for training",
    )
    p.add_argument(
        "--val-dir", required=True,
        help="Folder containing *_sat.jpg and *_mask.png for validation",
    )
    p.add_argument("--epochs",      type=int,   default=50)
    p.add_argument("--batch-size",  type=int,   default=8)
    p.add_argument("--lr",          type=float, default=1e-4)
    p.add_argument("--num-workers", type=int,   default=2)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # DeepGlobe co-locates images and masks in the same directory
    train_ds = DeepGlobeDataset(args.train_dir, args.train_dir, transform=TRAIN_TRANSFORM)
    val_ds   = DeepGlobeDataset(args.val_dir,   args.val_dir,   transform=VAL_TRANSFORM)
    print(f"Train samples: {len(train_ds)}  |  Val samples: {len(val_ds)}")

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True,
        num_workers=args.num_workers, pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size, shuffle=False,
        num_workers=args.num_workers, pin_memory=True,
    )

    model = smp.DeepLabV3Plus(
        encoder_name="resnet50",
        encoder_weights="imagenet",
        in_channels=3,
        classes=1,
    ).to(device)

    criterion = BCEDiceLoss()
    optimizer = Adam(model.parameters(), lr=args.lr)
    scaler    = torch.GradScaler(device.type)

    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    best_iou = 0.0

    for epoch in range(1, args.epochs + 1):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer, device, scaler)
        val_loss, val_iou = validate(model, val_loader, criterion, device)

        print(
            f"Epoch {epoch:03d}/{args.epochs} | "
            f"train_loss={train_loss:.4f} | "
            f"val_loss={val_loss:.4f} | "
            f"val_IoU={val_iou:.4f}"
        )

        if val_iou > best_iou:
            best_iou = val_iou
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_iou": best_iou,
                },
                BEST_MODEL_PATH,
            )
            print(f"  -> Saved best model  (IoU={best_iou:.4f})  →  {BEST_MODEL_PATH}")


if __name__ == "__main__":
    main()
