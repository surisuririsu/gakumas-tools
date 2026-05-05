import json
import os

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from .dataset import FilteredImageFolder, is_valid_file, transform
from .models import ClassifierNet, SmallEmbeddingNet
from .prepare import ENTITY_CONFIG, REPO_ROOT

EMBEDDING_DIM = 128
BATCH_SIZE = 64
DEFAULT_EPOCHS_PER_ROUND = 10
DEFAULT_LOSS_THRESHOLD = 0.15

CHECKPOINTS_DIR = os.path.join(REPO_ROOT, "scripts", "train_classifier", "checkpoints")
PUBLIC_DIR = os.path.join(REPO_ROOT, "gakumas-tools", "public")


def _checkpoint_path(entity_type):
    return os.path.join(CHECKPOINTS_DIR, f"{entity_type}_model.pt")


def _onnx_path(entity_type):
    return os.path.join(PUBLIC_DIR, f"{entity_type}_model.onnx")


def _classes_path(entity_type):
    return os.path.join(PUBLIC_DIR, f"{entity_type}_classes.json")


def _train_loop(model, dataloader, optimizer, device, epochs):
    model.train()
    total_loss = 0.0
    for epoch in range(epochs):
        total_loss = 0.0
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            _, outputs = model(images)
            loss = F.cross_entropy(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(dataloader)
        print(f"  epoch [{epoch + 1}/{epochs}], loss: {avg_loss:.4f}")
    return total_loss / len(dataloader)


def _load_surgery_state(model, checkpoint_path, old_classes, new_class_to_idx):
    """Copy old weights into the new model, remapping classifier rows by class name."""
    old_state = torch.load(checkpoint_path, map_location="cpu")
    new_state = model.state_dict()

    for k in new_state.keys():
        if k in old_state and "classifier" not in k:
            new_state[k] = old_state[k]

    old_w = old_state["classifier.weight"]
    old_b = old_state["classifier.bias"]
    new_w = new_state["classifier.weight"].clone()
    new_b = new_state["classifier.bias"].clone()

    matched = 0
    for old_idx, name in enumerate(old_classes):
        new_idx = new_class_to_idx.get(name)
        if new_idx is None:
            continue
        new_w[new_idx] = old_w[old_idx]
        new_b[new_idx] = old_b[old_idx]
        matched += 1
    print(f"  surgery: reused weights for {matched}/{len(old_classes)} old classes")

    new_state["classifier.weight"] = new_w
    new_state["classifier.bias"] = new_b
    model.load_state_dict(new_state)


def _export_onnx(model, num_classes, device, entity_type):
    classifier = ClassifierNet(num_classes, EMBEDDING_DIM).to(device)
    classifier.load_state_dict(model.state_dict(), strict=False)
    classifier.eval()
    dummy = torch.randn(1, 3, 64, 64).to(device)
    torch.onnx.export(
        classifier,
        dummy,
        _onnx_path(entity_type),
        input_names=["input"],
        output_names=["classifier"],
        dynamic_axes={"input": {0: "batch_size"}},
        opset_version=18,
        dynamo=False,
    )


def train_entity(entity_type, fresh, epochs, loss_threshold, device):
    print(f"\ntraining {entity_type} ({'fresh' if fresh else 'surgery'})...")
    config = ENTITY_CONFIG[entity_type]
    dataset = FilteredImageFolder(
        config["data_dir"], transform=transform, is_valid_file=is_valid_file
    )
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    num_classes = len(dataset.classes)
    print(f"  classes: {num_classes}")

    model = SmallEmbeddingNet(num_classes, EMBEDDING_DIM).to(device)

    checkpoint_path = _checkpoint_path(entity_type)
    classes_path = _classes_path(entity_type)

    use_surgery = (
        not fresh and os.path.exists(checkpoint_path) and os.path.exists(classes_path)
    )
    if use_surgery:
        with open(classes_path) as f:
            old_classes = json.load(f)
        _load_surgery_state(model, checkpoint_path, old_classes, dataset.class_to_idx)
        # Leave all layers trainable: a frozen encoder leaves the classifier
        # separating new classes in a fixed embedding space, which converges
        # very slowly when the new art differs from anything the encoder saw.
        # The surgery-transferred weights still provide a warm start; training
        # on all classes together prevents catastrophic forgetting.
    elif not fresh:
        print(f"  no checkpoint at {checkpoint_path}; training from scratch")

    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    while True:
        loss = _train_loop(model, dataloader, optimizer, device, epochs)
        if loss < loss_threshold:
            print(f"  converged (loss {loss:.4f} < {loss_threshold})")
            break

    os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
    torch.save(model.state_dict(), checkpoint_path)
    print(f"  saved checkpoint: {checkpoint_path}")

    _export_onnx(model, num_classes, device, entity_type)
    print(f"  exported onnx: {_onnx_path(entity_type)}")

    with open(classes_path, "w") as f:
        json.dump(dataset.classes, f)
    print(f"  wrote classes: {classes_path}")
