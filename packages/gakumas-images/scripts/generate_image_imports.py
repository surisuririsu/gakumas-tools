import glob
import os

image_dirs = [
    "idols",
    "pDrinks/icons",
    "pDrinks/details",
    "pIdols",
    "pItems/icons",
    "pItems/details",
    "skillCards/icons",
    "skillCards/details",
]

for dir in image_dirs:
    ids = [
        os.path.splitext(os.path.basename(path))[0] for path in glob.glob(f"images/{dir}/*.png")
    ]
    ids.sort(key=lambda x: int(x))

    with open(f"images/{dir}/imports.js", "w", encoding="utf-8") as f:
        for id in ids:
            f.write(f'import image_{id} from "./{id}.png";\n')

        f.write("\n")
        f.write("const IMAGES = {\n")
        for id in ids:
            f.write(f"  '{id}': image_{id},\n")
        f.write("};\n")
        f.write("\n")
        f.write("export default IMAGES;\n")
