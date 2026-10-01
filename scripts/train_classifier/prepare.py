import json
import os
import shutil

from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_ROOT = os.path.join(REPO_ROOT, ".classifier-data")
GK_IMG_ROOT = os.path.join(REPO_ROOT, "gk-img", "docs")
GAKUMAS_DATA_JSON = os.path.join(
    REPO_ROOT, "packages", "gakumas-data", "json"
)

# Class "0" is the empty-slot placeholder. It has no entry in gakumas-data and
# no icon in gk-img, so prepare seeds a neutral gray icon and preserves any
# user-collected training images in the folder.
EMPTY_CLASS_ID = "0"
EMPTY_ICON_SIZE = 64
EMPTY_ICON_COLOR = (200, 200, 200)


ENTITY_CONFIG = {
    "p_item": {
        "json_filename": "p_items.json",
        "icon_dir": os.path.join(GK_IMG_ROOT, "p_items", "icons"),
        "data_dir": os.path.join(DATA_ROOT, "p_items"),
        "filter": lambda entity: entity.get("sourceType") != "produce",
    },
    "skill_card": {
        "json_filename": "skill_cards.json",
        "icon_dir": os.path.join(GK_IMG_ROOT, "skill_cards", "icons"),
        "data_dir": os.path.join(DATA_ROOT, "skill_cards"),
        "filter": lambda entity: True,
    },
}


def load_entities(entity_type):
    json_path = os.path.join(GAKUMAS_DATA_JSON, ENTITY_CONFIG[entity_type]["json_filename"])
    with open(json_path) as f:
        return json.load(f)


def load_allowed_ids(entity_type):
    entity_filter = ENTITY_CONFIG[entity_type]["filter"]
    return {str(e["id"]) for e in load_entities(entity_type) if entity_filter(e)}


def load_upgraded_ids(entity_type):
    return {str(e["id"]) for e in load_entities(entity_type) if e.get("upgraded")}


def empty_icon():
    return Image.new("RGB", (EMPTY_ICON_SIZE, EMPTY_ICON_SIZE), EMPTY_ICON_COLOR)


def icon_classes(entity_type):
    # Skill card art variants are named "<id>_<idol id>" and stay separate classes.
    config = ENTITY_CONFIG[entity_type]
    allowed_ids = load_allowed_ids(entity_type)
    return sorted(
        (name, os.path.join(config["icon_dir"], filename))
        for filename in os.listdir(config["icon_dir"])
        for name, ext in [os.path.splitext(filename)]
        if ext == ".webp" and name.split("_")[0] in allowed_ids
    )


def prepare_entity(entity_type):
    config = ENTITY_CONFIG[entity_type]
    os.makedirs(config["data_dir"], exist_ok=True)

    empty_icon_path = os.path.join(config["data_dir"], EMPTY_CLASS_ID, "icon.webp")
    if not os.path.exists(empty_icon_path):
        os.makedirs(os.path.dirname(empty_icon_path), exist_ok=True)
        empty_icon().save(empty_icon_path, "WEBP")

    classes = icon_classes(entity_type)
    for name, path in classes:
        class_dir = os.path.join(config["data_dir"], name)
        os.makedirs(class_dir, exist_ok=True)
        shutil.copy(path, os.path.join(class_dir, "icon.webp"))

    expected = {name for name, _ in classes} | {EMPTY_CLASS_ID}
    extra_dirs = sorted(
        name
        for name in os.listdir(config["data_dir"])
        if os.path.isdir(os.path.join(config["data_dir"], name)) and name not in expected
    )
    if extra_dirs:
        print(
            f"  warning: {len(extra_dirs)} {entity_type} folder(s) in "
            f"{config['data_dir']} have no matching icon and are ignored: "
            f"{', '.join(extra_dirs[:5])}"
            + (" ..." if len(extra_dirs) > 5 else "")
        )

    print(f"  {entity_type}: {len(classes)} icons")
    return sorted(expected)
