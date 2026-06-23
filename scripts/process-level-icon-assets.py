from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image


GENERATED_DIR = Path(r"C:\Users\youzi\.codex\generated_images\019ededb-88bb-74a3-95a9-c47ac4d74fd7")
ASSET_DIR = Path("src/assets/UI-Home")
BACKUP_DIR = Path("output/_backup-level-icons-20260619-1630")

MAPPING = [
    ("ig_0beabaf3b4d7ab4f016a350986893c8191b38f8ec2f4d4b3de.png", "level-fruit-completed-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fb9d2464819189ec2866bbd21df1.png", "level-fruit-current-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fbf2083081918771342e573659c8.png", "level-fruit-not-started-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a350a0145d08191b842bc98be134198.png", "level-candy-completed-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fc7e0e1c8191b91bc71dc8a1e686.png", "level-candy-current-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fcd0e20c8191a25f44c0fb622183.png", "level-candy-not-started-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a350a9228e08191a0e1650d2ac44e57.png", "level-jelly-completed-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fd817b2881918ebdb68671931f3c.png", "level-jelly-current-bg.png"),
    ("ig_0beabaf3b4d7ab4f016a34fdc2752c8191b64bb379389d3e4b.png", "level-jelly-not-started-bg.png"),
]


def is_border_key_pixel(rgb: tuple[int, int, int], key: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    channel_distance = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2]))
    if channel_distance <= 42:
        return True

    # Catch anti-aliased chroma-key glow without eating ordinary green leaves or jewels.
    return g >= 218 and r <= 176 and b <= 150 and g - max(r, b) >= 56


def key_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    border_samples = []
    for x in range(width):
        border_samples.append(pixels[x, 0][:3])
        border_samples.append(pixels[x, height - 1][:3])
    for y in range(height):
        border_samples.append(pixels[0, y][:3])
        border_samples.append(pixels[width - 1, y][:3])
    key = tuple(sorted(sample[channel] for sample in border_samples)[len(border_samples) // 2] for channel in range(3))

    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue_if_key(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        if is_border_key_pixel(pixels[x, y][:3], key):
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue_if_key(x, 0)
        enqueue_if_key(x, height - 1)
    for y in range(height):
        enqueue_if_key(0, y)
        enqueue_if_key(width - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                enqueue_if_key(nx, ny)

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            channel_distance = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2]))
            if channel_distance <= 42:
                pixels[x, y] = (r, g, b, 0)

    # Despill a one-pixel transition edge so the asset does not carry a green outline.
    original = rgba.copy()
    original_pixels = original.load()
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            touches_transparent = (
                original_pixels[x - 1, y][3] == 0
                or original_pixels[x + 1, y][3] == 0
                or original_pixels[x, y - 1][3] == 0
                or original_pixels[x, y + 1][3] == 0
            )
            if touches_transparent and g > max(r, b) + 34:
                capped = max(r, b)
                pixels[x, y] = (r, capped, b, a)
    return rgba


def trim_to_content(source: Image.Image) -> Image.Image:
    alpha = source.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Generated asset is fully transparent after chroma-key removal.")

    return source.crop(bbox)


def main() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    for generated_name, asset_name in MAPPING:
        source_path = GENERATED_DIR / generated_name
        target_path = ASSET_DIR / asset_name
        backup_path = BACKUP_DIR / asset_name

        if not source_path.exists():
            raise FileNotFoundError(source_path)
        if not target_path.exists():
            raise FileNotFoundError(target_path)
        if not backup_path.exists():
            copy2(target_path, backup_path)

        with Image.open(source_path) as generated:
            transparent = key_to_alpha(generated)

        final_asset = trim_to_content(transparent)
        final_asset.save(target_path, optimize=True)
        print(f"{asset_name}: {source_path.name} -> {final_asset.size}")


if __name__ == "__main__":
    main()
