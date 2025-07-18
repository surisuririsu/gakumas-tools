import os
from PIL import Image

for filename in os.listdir("screenshots/p_idols"):
    # Crop the image
    if filename.endswith(".png"):
        im = Image.open(os.path.join("screenshots/p_idols", filename))
        width, height = im.size
        image = im.crop((40, 59, 40 + 128, 59 + 170)).resize((96, 128))

        # Save the cropped image
        image.save(os.path.join("packages/gakumas-images/images/pIdols", filename))
        os.remove(os.path.join("screenshots/p_idols", filename))

for filename in os.listdir("screenshots/p_items"):
    # Crop the icon and description
    if filename.endswith(".png"):
        im = Image.open(os.path.join("screenshots/p_items", filename))
        width, height = im.size
        icon = im.crop((50, 198, 50 + 220, 198 + 220)).resize((130, 130))
        description = im.crop((30, 176, 30 + 1020, 176 + 440)).resize((348, 150))

        # Save the cropped images
        icon.save(os.path.join("packages/gakumas-images/images/pItems/icons", filename))
        description.save(
            os.path.join("packages/gakumas-images/images/pItems/details", filename)
        )
        os.remove(os.path.join("screenshots/p_items", filename))

for filename in os.listdir("screenshots/skill_cards"):
    # Crop the icon and description
    if filename.endswith(".png"):
        im = Image.open(os.path.join("screenshots/skill_cards", filename))
        width, height = im.size
        icon = im.crop((50, 198, 50 + 220, 198 + 220)).resize((130, 130))
        description = im.crop((30, 176, 30 + 1020, 176 + 440)).resize((348, 150))

        # Save the cropped images
        icon.save(
            os.path.join("packages/gakumas-images/images/skillCards/icons", filename)
        )
        description.save(
            os.path.join("packages/gakumas-images/images/skillCards/details", filename)
        )
        os.remove(os.path.join("screenshots/skill_cards", filename))
