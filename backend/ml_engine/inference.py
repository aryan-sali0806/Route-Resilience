import cv2
import numpy as np
import torch
import albumentations as A
from albumentations.pytorch import ToTensorV2
import segmentation_models_pytorch as smp
from pathlib import Path


WEIGHTS_PATH = Path(__file__).parent / "weights" / "deeplabv3_best.pth"

_transform = A.Compose([
    #A.CenterCrop(512, 512),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2(),
])


class RoadExtractor:
    def __init__(self, weights_path: str | Path = WEIGHTS_PATH):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.model = smp.DeepLabV3Plus(
            encoder_name="resnet50",
            encoder_weights=None,
            in_channels=3,
            classes=1,
        )

        checkpoint = torch.load(weights_path, map_location=self.device)
        state = checkpoint.get("model_state_dict", checkpoint)
        self.model.load_state_dict(state)
        self.model.to(self.device)
        self.model.eval()

    def predict(self, image_bytes: bytes) -> np.ndarray:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        tensor = _transform(image=image)["image"]
        tensor = tensor.unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)

        mask = ((torch.sigmoid(logits) > 0.5).squeeze().cpu().numpy() * 255).astype(np.uint8)
        return mask
