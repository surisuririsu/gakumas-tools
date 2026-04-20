import argparse

import torch

from .prepare import ENTITY_CONFIG, prepare_entity
from .train import DEFAULT_EPOCHS_PER_ROUND, DEFAULT_LOSS_THRESHOLD, train_entity


def main():
    parser = argparse.ArgumentParser(
        prog="train_classifier",
        description="Train the gakumas icon classifier.",
    )
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="train from scratch instead of surgery on existing weights",
    )
    parser.add_argument(
        "--entity",
        choices=["p_item", "skill_card", "all"],
        default="all",
    )
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS_PER_ROUND)
    parser.add_argument(
        "--threshold", type=float, default=DEFAULT_LOSS_THRESHOLD
    )
    args = parser.parse_args()

    entities = (
        list(ENTITY_CONFIG.keys()) if args.entity == "all" else [args.entity]
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"device: {device}")

    print("\npreparing data...")
    for entity_type in entities:
        prepare_entity(entity_type)

    for entity_type in entities:
        train_entity(
            entity_type,
            fresh=args.fresh,
            epochs=args.epochs,
            loss_threshold=args.threshold,
            device=device,
        )


if __name__ == "__main__":
    main()
