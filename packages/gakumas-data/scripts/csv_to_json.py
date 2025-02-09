import csv
import json

data_types = ["idols", "p_idols", "p_items", "skill_cards", "stages", "customizations"]

for data_type in data_types:
    data = []

    with open(f"csv/{data_type}.csv", encoding="utf-8") as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            for k, v in row.items():
                if v in ("TRUE", "FALSE"):
                    row[k] = v == "TRUE"
                elif v.isnumeric():
                    row[k] = int(v)
            data.append(row)

    with open(f"json/{data_type}.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
