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


def load_allowed_ids(entity_type):
    config = ENTITY_CONFIG[entity_type]
    json_path = os.path.join(GAKUMAS_DATA_JSON, config["json_filename"])
    with open(json_path) as f:
        entities = json.load(f)
    return {str(e["id"]) for e in entities if config["filter"](e)}


def ensure_empty_class(data_dir):
    class_dir = os.path.join(data_dir, EMPTY_CLASS_ID)
    os.makedirs(class_dir, exist_ok=True)
    icon_path = os.path.join(class_dir, "icon.webp")
    if not os.path.exists(icon_path):
        Image.new(
            "RGB", (EMPTY_ICON_SIZE, EMPTY_ICON_SIZE), EMPTY_ICON_COLOR
        ).save(icon_path, "WEBP")


def prepare_entity(entity_type):
    config = ENTITY_CONFIG[entity_type]
    allowed_ids = load_allowed_ids(entity_type) | {EMPTY_CLASS_ID}
    os.makedirs(config["data_dir"], exist_ok=True)
    ensure_empty_class(config["data_dir"])

    copied = 0
    skipped = 0
    for icon_filename in os.listdir(config["icon_dir"]):
        if not icon_filename.endswith(".webp"):
            continue
        base = os.path.splitext(icon_filename)[0]
        # Skill card filenames may be "<id>_<variant>"; the entity id is the
        # part before the underscore, but each variant stays its own class.
        entity_id = base.split("_")[0]
        if entity_id not in allowed_ids:
            skipped += 1
            continue
        class_dir = os.path.join(config["data_dir"], base)
        os.makedirs(class_dir, exist_ok=True)
        shutil.copy(
            os.path.join(config["icon_dir"], icon_filename),
            os.path.join(class_dir, "icon.webp"),
        )
        copied += 1

    extra_dirs = [
        name
        for name in os.listdir(config["data_dir"])
        if os.path.isdir(os.path.join(config["data_dir"], name))
        and name.split("_")[0] not in allowed_ids
    ]
    if extra_dirs:
        print(
            f"  warning: {len(extra_dirs)} {entity_type} folder(s) in "
            f"{config['data_dir']} no longer match gakumas-data filter: "
            f"{', '.join(sorted(extra_dirs)[:5])}"
            + (" ..." if len(extra_dirs) > 5 else "")
        )

    print(f"  {entity_type}: copied {copied} icons, skipped {skipped} filtered")
