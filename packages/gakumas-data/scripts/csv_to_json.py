import csv
import json
import os

data_types = [
    "idols",
    "p_idols",
    "p_items",
    "skill_cards",
    "stages",
    "customizations",
    "p_drinks",
]

csv_dir = os.path.realpath("csv")
json_dir = os.path.realpath("json")

for data_type in data_types:
    data = []

    csv_path = os.path.realpath(os.path.join("csv", f"{data_type}.csv"))
    if not csv_path.startswith(csv_dir + os.sep):
        raise ValueError(f"Invalid data_type: {data_type}")

    with open(csv_path, encoding="utf-8") as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            for k, v in row.items():
                if v in ("TRUE", "FALSE"):
                    row[k] = v == "TRUE"
                elif v.isnumeric():
                    row[k] = int(v)
            data.append(row)

    json_path = os.path.realpath(os.path.join("json", f"{data_type}.json"))
    if not json_path.startswith(json_dir + os.sep):
        raise ValueError(f"Invalid data_type: {data_type}")

    with open(json_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
