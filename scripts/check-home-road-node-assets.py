from collections import deque
import importlib.util
from pathlib import Path
import sys

from PIL import Image

sys.dont_write_bytecode = True


ASSET_DIR = Path("src/assets/image")
EXPECTED_SIZE = (1024, 1024)
EXPECTED_LEVEL_VISIBLE_HEIGHT = 912
MIN_LEVEL_VISIBLE_WIDTH = 960
MAX_LEVEL_VISIBLE_WIDTH = 1020
LEVEL_ICON_NAMES = [
    "level-fruit-completed-bg.png",
    "level-fruit-current-bg.png",
    "level-fruit-not-started-bg.png",
    "level-candy-completed-bg.png",
    "level-candy-current-bg.png",
    "level-candy-not-started-bg.png",
    "level-jelly-completed-bg.png",
    "level-jelly-current-bg.png",
    "level-jelly-not-started-bg.png",
]
CONNECTOR_NAMES = [
    "road-candy-connector.png",
    "road-jelly-connector.png",
]


def load_processing_module():
    script_path = Path("scripts/process-home-road-node-assets.py")
    spec = importlib.util.spec_from_file_location("process_home_road_node_assets", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def get_source_ratios_by_asset() -> dict[str, float]:
    processor = load_processing_module()
    ratios: dict[str, float] = {}
    for generated_name, asset_name, is_level_icon in processor.TRANSPARENT_ASSETS:
        if not is_level_icon:
            continue
        with Image.open(processor.GENERATED_DIR / generated_name) as source:
            trimmed = processor.trim_to_content(processor.key_to_alpha(source))
        ratios[asset_name] = trimmed.width / trimmed.height
    return ratios


def count_internal_transparent_holes(image: Image.Image) -> int:
    alpha = image.convert("RGBA").getchannel("A")
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

    return sum(1 for y in range(height) for x in range(width) if pixels[x, y] == 0 and not visited[y * width + x])


def main() -> None:
    errors: list[str] = []
    bboxes: dict[str, tuple[int, int, int, int]] = {}
    source_ratios = get_source_ratios_by_asset()
    for asset_name in LEVEL_ICON_NAMES:
        asset_path = ASSET_DIR / asset_name
        if not asset_path.exists():
            errors.append(f"{asset_name}: missing")
            continue
        with Image.open(asset_path) as image:
            image = image.convert("RGBA")
            if image.size != EXPECTED_SIZE:
                errors.append(f"{asset_name}: expected {EXPECTED_SIZE}, got {image.size}")
            bbox = image.getchannel("A").getbbox()
            if bbox is None:
                errors.append(f"{asset_name}: fully transparent")
                continue
            visible_width = bbox[2] - bbox[0]
            visible_height = bbox[3] - bbox[1]
            visible_center = (bbox[0] + bbox[2]) / 2
            if visible_height != EXPECTED_LEVEL_VISIBLE_HEIGHT or bbox[3] != EXPECTED_SIZE[1]:
                errors.append(
                    f"{asset_name}: expected visible height {EXPECTED_LEVEL_VISIBLE_HEIGHT} bottom-aligned, got {bbox}",
                )
            if not (MIN_LEVEL_VISIBLE_WIDTH <= visible_width <= MAX_LEVEL_VISIBLE_WIDTH):
                errors.append(
                    f"{asset_name}: visible width should stay natural without stretching, got {visible_width} in {bbox}",
                )
            if abs(visible_center - EXPECTED_SIZE[0] / 2) > 1:
                errors.append(f"{asset_name}: visible content should be centered, got center {visible_center} in {bbox}")
            source_ratio = source_ratios[asset_name]
            output_ratio = visible_width / visible_height
            if abs(source_ratio - output_ratio) > 0.003:
                errors.append(
                    f"{asset_name}: non-uniform stretch detected, source ratio {source_ratio:.4f}, output ratio {output_ratio:.4f}",
                )
            bboxes[asset_name] = bbox
            hole_count = count_internal_transparent_holes(image)
            if hole_count:
                errors.append(f"{asset_name}: has {hole_count} internal fully transparent pixels")

    if errors:
        raise SystemExit("\n".join(errors))

    print(f"Validated {len(LEVEL_ICON_NAMES)} generated level icons at {EXPECTED_SIZE}.")
    for asset_name in LEVEL_ICON_NAMES:
        print(f"{asset_name}: bbox={bboxes[asset_name]}")

    for asset_name in CONNECTOR_NAMES:
        asset_path = ASSET_DIR / asset_name
        if not asset_path.exists():
            raise SystemExit(f"{asset_name}: missing")
        with Image.open(asset_path) as image:
            image = image.convert("RGBA")
            alpha = image.getchannel("A")
            hole_count = count_internal_transparent_holes(image)
            if hole_count:
                raise SystemExit(f"{asset_name}: has {hole_count} internal fully transparent pixels")
            if alpha.getbbox() != (0, 0, image.width, image.height):
                raise SystemExit(f"{asset_name}: transparent edge gap detected, bbox={alpha.getbbox()}, size={image.size}")
            print(f"{asset_name}: size={image.size}, bbox={alpha.getbbox()}")


if __name__ == "__main__":
    main()
