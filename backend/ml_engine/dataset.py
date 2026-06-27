import os

import albumentations as A
import cv2
import numpy as np
from albumentations.pytorch import ToTensorV2
from torch.utils.data import Dataset

_DEFAULT_TRANSFORM = A.Compose([
    A.RandomCrop(height=512, width=512),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2(),
])


class DeepGlobeDataset(Dataset):
    """
    PyTorch Dataset for the DeepGlobe Road Extraction challenge.

    Expects image_dir to contain files named  <id>_sat.jpg  and
    mask_dir to contain matching files named  <id>_mask.png.
    Masks are thresholded to strictly binary labels (0 background, 1 road).
    """

    def __init__(
        self,
        image_dir: str,
        mask_dir: str,
        transform: A.Compose | None = None,
        ids: list[str] | None = None,
    ) -> None:
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.transform = transform if transform is not None else _DEFAULT_TRANSFORM

        if ids is not None:
            self.ids = list(ids)
        else:
            self.ids = sorted(
                fname.replace("_sat.jpg", "")
                for fname in os.listdir(image_dir)
                if fname.endswith("_sat.jpg")
                and os.path.exists(
                    os.path.join(mask_dir, fname.replace("_sat.jpg", "_mask.png"))
                )
            )

        if not self.ids:
            raise FileNotFoundError(
                f"No '*_sat.jpg' + '*_mask.png' pairs found in '{image_dir}'"
            )

    def __len__(self) -> int:
        return len(self.ids)

    def __getitem__(self, idx: int):
        img_id = self.ids[idx]

        img_path = os.path.join(self.image_dir, f"{img_id}_sat.jpg")
        mask_path = os.path.join(self.mask_dir, f"{img_id}_mask.png")

        image = cv2.imread(img_path)
        if image is None:
            raise FileNotFoundError(f"Could not read image: {img_path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mask_raw = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        if mask_raw is None:
            raise FileNotFoundError(f"Could not read mask: {mask_path}")
        # DeepGlobe masks are white (255) for road, black (0) for background.
        # Threshold strictly: any non-zero pixel becomes 1.
        mask = (mask_raw > 127).astype(np.float32)

        augmented = self.transform(image=image, mask=mask)

        # image: (C, H, W) float32 — mask: (1, H, W) float32
        return augmented["image"], augmented["mask"].unsqueeze(0)
