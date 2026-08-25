"""Update stamina metadata from a pinned gakumasu-diff master-data snapshot.

The external repository is used only as data. This script does not execute any
downloaded content, and it leaves unmatched preview rows blank for manual
verification after they go live.
"""

import argparse
import csv
import io
import re
import unicodedata
import urllib.request
from pathlib import Path


DEFAULT_REF = "1866b84c06d1b713dbfaf21cb9ded2790ffc0236"
BASE_URL = "https://raw.githubusercontent.com/vertesan/gakumasu-diff/{ref}/{name}"
DATA_DIR = Path(__file__).resolve().parents[1]


def fetch(ref, name):
    with urllib.request.urlopen(BASE_URL.format(ref=ref, name=name)) as response:
        return response.read().decode("utf-8")


def top_level_records(text, first_key="id"):
    records = []
    current = None
    block = []
    for line in text.splitlines():
        if line.startswith(f"- {first_key}: "):
            if current is not None:
                records.append((current, "\n".join(block)))
            current = {first_key: line.split(": ", 1)[1].strip('"')}
            block = [line]
        elif current is not None:
            block.append(line)
            if line.startswith("  ") and not line.startswith("    ") and ": " in line:
                key, value = line[2:].split(": ", 1)
                current[key] = value.strip('"')
    if current is not None:
        records.append((current, "\n".join(block)))
    return records


def rank_number(value, prefix):
    return int(value.removeprefix(prefix))


def stamina_milestones(records, id_field, rank_field, rank_prefix):
    by_id = {}
    for record, block in records:
        if "ProduceStamina" not in block:
            continue
        by_id.setdefault(record[id_field], []).append(
            (rank_number(record[rank_field], rank_prefix), int(record["effectValue"]))
        )
    return by_id


def encode_milestones(values):
    return ",".join(f"{rank}:{value}" for rank, value in sorted(values))


def normalize_name(value):
    return unicodedata.normalize("NFKC", value).replace("･", "・")


def read_csv(name):
    path = DATA_DIR / "csv" / name
    with path.open(encoding="utf-8", newline="") as source:
        reader = csv.DictReader(source)
        return path, list(reader.fieldnames), list(reader)


def write_csv(path, fieldnames, rows):
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator="\r\n")
    writer.writeheader()
    writer.writerows(rows)
    path.write_bytes(output.getvalue().removesuffix("\r\n").encode("utf-8"))


def update_p_idols(ref, characters, idol_cards):
    status_records = top_level_records(fetch(ref, "IdolCardLevelLimitStatusUp.yaml"))
    potential_records = top_level_records(fetch(ref, "IdolCardPotential.yaml"))
    training_bonuses = stamina_milestones(
        status_records,
        "id",
        "rank",
        "IdolCardLevelLimitRank__",
    )
    potential_bonuses = stamina_milestones(
        potential_records,
        "id",
        "rank",
        "IdolCardPotentialRank__",
    )

    idol_path, idol_fields, idols = read_csv("idols.csv")
    p_idol_path, p_idol_fields, p_idols = read_csv("p_idols.csv")
    del idol_path, idol_fields

    character_by_name = {
        normalize_name(f"{record['lastName']} {record['firstName']}"): record["id"]
        for record, _ in characters
    }
    character_by_idol_id = {
        row["id"]: character_by_name.get(normalize_name(row["name"])) for row in idols
    }
    cards_by_key = {}
    for card, _ in idol_cards:
        rarity = card["rarity"].removeprefix("IdolCardRarity_").upper()
        key = (card["characterId"], normalize_name(card["name"]), rarity)
        cards_by_key.setdefault(key, []).append(card)

    additions = [
        "baseStamina",
        "trainingStaminaBonuses",
        "potentialStaminaBonuses",
    ]
    for field in additions:
        if field not in p_idol_fields:
            p_idol_fields.append(field)

    unmatched = []
    for row in p_idols:
        key = (
            character_by_idol_id.get(row["idolId"]),
            normalize_name(row["title"]),
            row["rarity"],
        )
        matches = cards_by_key.get(key, [])
        if len(matches) != 1:
            unmatched.append((row["id"], row["title"] or "<preview>"))
            for field in additions:
                row.setdefault(field, "")
            continue
        card = matches[0]
        row["baseStamina"] = card["produceStamina"]
        row["trainingStaminaBonuses"] = encode_milestones(
            training_bonuses[card["idolCardLevelLimitStatusUpId"]]
        )
        row["potentialStaminaBonuses"] = encode_milestones(
            potential_bonuses[card["idolCardPotentialId"]]
        )

    write_csv(p_idol_path, p_idol_fields, p_idols)
    return unmatched


def update_idols(ref, characters):
    dearness_records = top_level_records(
        fetch(ref, "CharacterDearnessLevel.yaml"), "characterId"
    )
    true_end_records = top_level_records(fetch(ref, "CharacterTrueEndBonus.yaml"))

    dearness_by_character = {}
    for record, block in dearness_records:
        match = re.search(
            r"p_dearness_skill-common-p_trigger-produce_start-no_description-"
            r"max_stamina_addition-03-001\n    level: (\d+)",
            block,
        )
        if not match:
            continue
        values = dearness_by_character.setdefault(record["characterId"], [])
        milestone = (int(record["dearnessLevel"]), int(match.group(1)))
        if not values or values[-1][1] != milestone[1]:
            values.append(milestone)

    true_end_fields = {
        "ProduceType_FirstStar": "trueEndStaminaFirstStar",
        "ProduceType_NextIdolAudition": "trueEndStaminaNextIdolAudition",
        "ProduceType_HatsuboshiIdolFestival": "trueEndStaminaHatsuboshiIdolFestival",
    }
    true_end_by_character = {}
    for record, _ in true_end_records:
        character_id = record["id"].removeprefix("character_true_end_bonus-")
        field = true_end_fields.get(record["produceType"])
        if field:
            true_end_by_character.setdefault(character_id, {})[field] = record[
                "produceStamina"
            ]

    path, fieldnames, rows = read_csv("idols.csv")
    additions = [
        "dearnessStaminaBonuses",
        *true_end_fields.values(),
    ]
    for field in additions:
        if field not in fieldnames:
            fieldnames.append(field)

    character_by_name = {
        normalize_name(f"{record['lastName']} {record['firstName']}"): record["id"]
        for record, _ in characters
    }
    for row in rows:
        character_id = character_by_name.get(normalize_name(row["name"]))
        row["dearnessStaminaBonuses"] = encode_milestones(
            dearness_by_character.get(character_id, [])
        )
        true_end = true_end_by_character.get(character_id, {})
        for field in true_end_fields.values():
            row[field] = true_end.get(field, "")

    write_csv(path, fieldnames, rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ref", default=DEFAULT_REF)
    args = parser.parse_args()

    characters = top_level_records(fetch(args.ref, "Character.yaml"))
    idol_cards = top_level_records(fetch(args.ref, "IdolCard.yaml"))
    unmatched = update_p_idols(args.ref, characters, idol_cards)
    update_idols(args.ref, characters)
    print(f"Updated stamina metadata from vertesan/gakumasu-diff@{args.ref}")
    if unmatched:
        print("Unmatched rows left blank:")
        for p_idol_id, title in unmatched:
            print(f"  p-idol {p_idol_id}: {title}")


if __name__ == "__main__":
    main()
