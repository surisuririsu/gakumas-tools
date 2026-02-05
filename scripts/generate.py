import os
import re
from PIL import Image

IMAGE_SIZES = {
    "idols": 24,
    "pDrinks/details": 500,
    "pDrinks/icons": 96,
    "pIdols": 96,
    "pItems/details": 500,
    "pItems/icons": 96,
    "skillCards/details": 500,
    "skillCards/icons": 96,
}

for image_type, size in IMAGE_SIZES.items():
    snake_slug = re.sub("([A-Z]+)", r"_\1", image_type).lower()
    if not os.path.exists(f"gk-img/docs/{snake_slug}"):
        os.makedirs(f"gk-img/docs/{snake_slug}")

    directory = f"packages/gakumas-images/images/{image_type}"
    for filename in os.listdir(directory):
        # Skip if the file already exists
        if image_type == "idols":
            output_filename = f"gk-img/docs/{snake_slug}/{filename}"
        else:
            webp_filename = re.sub(r'\.(png|jpg)', '.webp', filename)
            output_filename = f"gk-img/docs/{snake_slug}/{webp_filename}"
        if os.path.isfile(output_filename):
            continue

        # Resize the image
        f = os.path.join(directory, filename)
        if os.path.isfile(f) and f.endswith(".png"):
            im = Image.open(f)
            width, height = im.size
            im = im.resize((size, int(height * size / width)))
            if image_type == "idols":
                im.save(output_filename)
            else:
                im = im.convert("RGB")
                im.save(output_filename, "webp")
