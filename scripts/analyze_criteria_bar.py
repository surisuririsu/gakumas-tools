#!/usr/bin/env python3
"""
Analyze the 審査基準 (evaluation criteria) color bar from Gakumas screenshots.
Finds the bar automatically and calculates the percentage of each color (pink, blue, orange/yellow).
"""

import sys
from PIL import Image
from collections import Counter


# Target colors (RGB values from actual game UI)
COLORS = {
    "pink": (242, 53, 132),     # Magenta/pink
    "blue": (28, 133, 237),     # Blue
    "orange": (247, 177, 46),   # Yellow/orange
}


def color_distance(c1, c2):
    """Calculate Euclidean distance between two RGB colors."""
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5


def is_vivid_color(rgb):
    """Check if a color is vivid (high saturation)."""
    r, g, b = rgb
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    return max_c > 100 and (max_c - min_c) > 60


def classify_pixel(rgb, threshold=60):
    """Classify a pixel as pink, blue, orange, or None (if not matching)."""
    if not is_vivid_color(rgb):
        return None

    # Find closest matching color
    best_match = None
    best_distance = threshold

    for name, color in COLORS.items():
        dist = color_distance(rgb, color)
        if dist < best_distance:
            best_distance = dist
            best_match = name

    return best_match


def find_bar_row(img):
    """
    Find a row that contains the criteria bar by looking for rows
    that have all three colors (pink, blue, orange) in sequence.
    """
    width, height = img.size
    pixels = img.load()

    best_row = None
    best_score = 0

    # Sample rows to find one with all three colors
    for y in range(height):
        colors_found = set()
        color_counts = Counter()

        # Sample pixels across the row
        for x in range(0, width, 2):
            if img.mode == 'RGBA':
                r, g, b, a = pixels[x, y]
            else:
                r, g, b = pixels[x, y]

            color = classify_pixel((r, g, b))
            if color:
                colors_found.add(color)
                color_counts[color] += 1

        # We want rows that have all three colors with reasonable counts
        if len(colors_found) == 3:
            total = sum(color_counts.values())
            # Score based on total colored pixels (more = better, likely the actual bar)
            if total > best_score:
                best_score = total
                best_row = y

    return best_row


def find_bar_bounds(img, row):
    """Find the left and right bounds of the bar on the given row."""
    width = img.size[0]
    pixels = img.load()

    left = None
    right = None

    for x in range(width):
        if img.mode == 'RGBA':
            r, g, b, a = pixels[x, row]
        else:
            r, g, b = pixels[x, row]

        color = classify_pixel((r, g, b))
        if color:
            if left is None:
                left = x
            right = x

    return left, right


def analyze_bar(img, row, left, right):
    """Analyze the bar and return color percentages."""
    pixels = img.load()
    color_counts = Counter()

    # Sample a single row (the bar is uniform vertically)
    for x in range(left, right + 1):
        if img.mode == 'RGBA':
            r, g, b, a = pixels[x, row]
        else:
            r, g, b = pixels[x, row]

        color = classify_pixel((r, g, b))
        if color:
            color_counts[color] += 1

    total = sum(color_counts.values())
    if total == 0:
        return None

    percentages = {
        color: count / total * 100
        for color, count in color_counts.items()
    }

    return percentages


def analyze_image(image_path):
    """Main function to analyze an image and return bar percentages."""
    img = Image.open(image_path)

    # Convert to RGB if necessary
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')

    # Find the row containing the bar
    bar_row = find_bar_row(img)
    if bar_row is None:
        print("Could not find the criteria bar in the image.")
        return None

    # Find bar bounds
    left, right = find_bar_bounds(img, bar_row)
    if left is None or right is None:
        print("Could not determine bar boundaries.")
        return None

    print(f"Found bar at row {bar_row}, x={left} to x={right} (width: {right - left + 1}px)")

    # Analyze the bar
    percentages = analyze_bar(img, bar_row, left, right)

    return percentages


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_criteria_bar.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    percentages = analyze_image(image_path)

    if percentages:
        pink = percentages.get('pink', 0)
        blue = percentages.get('blue', 0)
        orange = percentages.get('orange', 0)

        print("\nCriteria Bar Analysis:")
        print(f"  Pink:   {round(pink)}% ({pink:.1f}%)")
        print(f"  Blue:   {round(blue)}% ({blue:.1f}%)")
        print(f"  Orange: {round(orange)}% ({orange:.1f}%)")


if __name__ == "__main__":
    main()
