import argparse

from .prepare import ENTITY_CONFIG


def main():
    parser = argparse.ArgumentParser(
        prog="train_classifier",
        description="Train or refresh the gakumas icon classifiers.",
    )
    parser.add_argument(
        "command",
        choices=["train", "evaluate", "refresh"],
        help="train: retrain the encoder and export; "
        "evaluate: report held-out accuracy without exporting; "
        "refresh: re-embed the current icons into the exported models (no training)",
    )
    parser.add_argument("--entity", choices=[*ENTITY_CONFIG, "all"], default="all")
    parser.add_argument("--epochs", type=int)
    args = parser.parse_args()

    entities = list(ENTITY_CONFIG) if args.entity == "all" else [args.entity]

    if args.command == "refresh":
        from .gallery import print_summary, refresh

        for entity_type in entities:
            print_summary(entity_type, refresh(entity_type))
        return

    from .prepare import prepare_entity
    from .train import DEFAULT_EPOCHS, default_device

    device = default_device()
    epochs = args.epochs or DEFAULT_EPOCHS
    print("preparing data...")
    class_names = {e: prepare_entity(e) for e in entities}

    if args.command == "evaluate":
        from .evaluate import evaluate_entity

        for entity_type in entities:
            evaluate_entity(entity_type, class_names[entity_type], epochs, device)
    else:
        from .train import train_entity

        for entity_type in entities:
            train_entity(entity_type, class_names[entity_type], epochs, device)


if __name__ == "__main__":
    main()
