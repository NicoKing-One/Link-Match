from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw


GENERATED_DIR = Path(r"C:\Users\youzi\.codex\generated_images\019ef2bf-99cb-7501-b596-ea707085eed9")
ASSET_DIR = Path("src/assets/UI-Home")
BACKUP_DIR = Path("output/_backup-home-road-nodes-20260623")
PREVIEW_PATH = Path("output/home-road-node-assets-preview.png")
LEVEL_ICON_SIZE = (1024, 1024)
LEVEL_ICON_TARGET_HEIGHT = 912

TRANSPARENT_ASSETS = [
    ("ig_009d41d11e1b8510016a3a485710688191a5784d22b01238e4.png", "level-fruit-completed-bg.png", True),
    ("ig_009d41d11e1b8510016a3a48bccefc819182b3953d2f945cec.png", "level-fruit-current-bg.png", True),
    ("ig_009d41d11e1b8510016a3a49234f9c8191a1635929a98bb538.png", "level-fruit-not-started-bg.png", True),
    ("ig_009d41d11e1b8510016a3a49884250819187e3db8132af9454.png", "level-candy-completed-bg.png", True),
    ("ig_009d41d11e1b8510016a3a49e9227c8191826350405f1a80c9.png", "level-candy-current-bg.png", True),
    ("ig_009d41d11e1b8510016a3a4a4d63e88191b0a8945d06f8cd8b.png", "level-candy-not-started-bg.png", True),
    ("ig_009d41d11e1b8510016a3a4ac02bf0819191bc4e7ea513a851.png", "level-jelly-completed-bg.png", True),
    ("ig_009d41d11e1b8510016a3a4b1f26f48191b04aa594465be33e.png", "level-jelly-current-bg.png", True),
    ("ig_009d41d11e1b8510016a3a4bc52ffc8191b15b2994323b7654.png", "level-jelly-not-started-bg.png", True),
    ("ig_09e9895771cf76e0016a3a20118c748191b4cf182bc73256d0.png", "road-candy-connector.png", False),
]

OPAQUE_ASSETS = [
    ("ig_09e9895771cf76e0016a3a203bf7f0819197683c2c6abb650a.png", "background-candy-full.png"),
]


def is_border_key_pixel(rgb: tuple[int, int, int], key: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    channel_distance = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2]))
    if channel_distance <= 42:
        return True
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
                pixels[x, y] = (r, max(r, b), b, a)
    return rgba


def trim_to_content(source: Image.Image) -> Image.Image:
    alpha = source.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Generated asset is fully transparent after chroma-key removal.")
    return source.crop(bbox)


def normalize_level_icon(source: Image.Image) -> Image.Image:
    trimmed = trim_to_content(source)
    scale = LEVEL_ICON_TARGET_HEIGHT / trimmed.height
    visible_size = (round(trimmed.width * scale), LEVEL_ICON_TARGET_HEIGHT)
    resized = trimmed.resize(visible_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", LEVEL_ICON_SIZE, (0, 0, 0, 0))
    left = (LEVEL_ICON_SIZE[0] - visible_size[0]) // 2
    top = LEVEL_ICON_SIZE[1] - visible_size[1]
    canvas.alpha_composite(resized, (left, top))
    return canvas


def find_internal_transparent_pixels(image: Image.Image) -> set[tuple[int, int]]:
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue_if_outside_transparent(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or pixels[x, y] != 0:
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue_if_outside_transparent(x, 0)
        enqueue_if_outside_transparent(x, height - 1)
    for y in range(height):
        enqueue_if_outside_transparent(0, y)
        enqueue_if_outside_transparent(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                enqueue_if_outside_transparent(nx, ny)

    return {
        (x, y)
        for y in range(height)
        for x in range(width)
        if pixels[x, y] == 0 and not visited[y * width + x]
    }


def seal_internal_transparent_holes(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    holes = find_internal_transparent_pixels(image)
    while holes:
        filled_this_pass: set[tuple[int, int]] = set()
        for x, y in holes:
            neighbors = []
            for ny in range(max(0, y - 1), min(image.height, y + 2)):
                for nx in range(max(0, x - 1), min(image.width, x + 2)):
                    if nx == x and ny == y:
                        continue
                    r, g, b, a = pixels[nx, ny]
                    if a > 0:
                        neighbors.append((r, g, b, a))
            if not neighbors:
                continue
            count = len(neighbors)
            pixels[x, y] = tuple(round(sum(channel) / count) for channel in zip(*neighbors))
            filled_this_pass.add((x, y))
        if not filled_this_pass:
            raise ValueError(f"Could not seal {len(holes)} internal transparent pixels.")
        holes -= filled_this_pass
    return image


def backup_existing(asset_name: str) -> None:
    target_path = ASSET_DIR / asset_name
    backup_path = BACKUP_DIR / asset_name
    if target_path.exists() and not backup_path.exists():
        copy2(target_path, backup_path)


def make_preview() -> None:
    PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    labels = [
        "fruit completed",
        "fruit current",
        "fruit locked",
        "candy completed",
        "candy current",
        "candy locked",
        "jelly completed",
        "jelly current",
        "jelly locked",
    ]
    icon_names = [asset_name for _, asset_name, is_level_icon in TRANSPARENT_ASSETS if is_level_icon]
    thumb_size = 176
    label_h = 24
    gap = 18
    sheet = Image.new("RGB", (3 * thumb_size + 4 * gap, 3 * (thumb_size + label_h) + 4 * gap), "#f5eee2")
    for index, (asset_name, label) in enumerate(zip(icon_names, labels)):
        with Image.open(ASSET_DIR / asset_name) as icon:
            checker = Image.new("RGBA", (thumb_size, thumb_size), "#ddcfbf")
            tile = 16
            for y in range(0, thumb_size, tile):
                for x in range(0, thumb_size, tile):
                    if (x // tile + y // tile) % 2 == 0:
                        checker.paste("#fff8ee", (x, y, x + tile, y + tile))
            thumb = icon.convert("RGBA")
            thumb.thumbnail((thumb_size, thumb_size), Image.Resampling.LANCZOS)
            row, col = divmod(index, 3)
            left = gap + col * (thumb_size + gap)
            top = gap + row * (thumb_size + label_h + gap)
            checker.alpha_composite(thumb, ((thumb_size - thumb.width) // 2, (thumb_size - thumb.height) // 2))
            sheet.paste(checker.convert("RGB"), (left, top))
            # The preview labels are outside project assets and only help review the 9 generated icons.
            draw = ImageDraw.Draw(sheet)
            draw.text((left + 8, top + thumb_size + 5), label, fill="#604b41")
    sheet.save(PREVIEW_PATH, optimize=True)


def main() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    for generated_name, asset_name, is_level_icon in TRANSPARENT_ASSETS:
        source_path = GENERATED_DIR / generated_name
        target_path = ASSET_DIR / asset_name
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        backup_existing(asset_name)
        with Image.open(source_path) as generated:
            transparent = key_to_alpha(generated)
            final_asset = (
                seal_internal_transparent_holes(normalize_level_icon(transparent))
                if is_level_icon
                else trim_to_content(transparent)
            )
        final_asset.save(target_path, optimize=True)
        print(f"{asset_name}: {source_path.name} -> {final_asset.size}")

    for generated_name, asset_name in OPAQUE_ASSETS:
        source_path = GENERATED_DIR / generated_name
        target_path = ASSET_DIR / asset_name
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        backup_existing(asset_name)
        copy2(source_path, target_path)
        with Image.open(target_path) as copied:
            print(f"{asset_name}: {source_path.name} -> {copied.size}")
    make_preview()
    print(f"preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
