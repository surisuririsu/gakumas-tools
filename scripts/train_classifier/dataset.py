import os

import torch
from torchvision import datasets
from torchvision.transforms import v2


IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")


transform = v2.Compose(
    [
        v2.ToImage(),
        v2.ToDtype(torch.uint8, scale=True),
        v2.RandomResize(16, 64, antialias=False),
        v2.Resize((64, 64)),
        v2.RandomResizedCrop(64, scale=(0.9, 1.0)),
        v2.ColorJitter(0.2, 0.2, 0.2),
        v2.ToDtype(torch.float32, scale=True),
    ]
)


def is_valid_file(path):
    return ".DS_Store" not in path and path.lower().endswith(IMAGE_EXTENSIONS)


class FilteredImageFolder(datasets.ImageFolder):
    """ImageFolder that skips hidden directories (e.g. .DS_Store)."""

    def find_classes(self, directory):
        classes = sorted(
            entry.name
            for entry in os.scandir(directory)
            if entry.is_dir() and not entry.name.startswith(".")
        )
        if not classes:
            raise FileNotFoundError(f"No class folders in {directory}")
        return classes, {name: i for i, name in enumerate(classes)}
