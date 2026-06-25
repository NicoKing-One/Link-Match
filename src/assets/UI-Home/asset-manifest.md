# UI-Home Asset Manifest

Generated for the Link Match home screen from the three approved home UI design drafts.

## Common

- `top-button-bg.png` - shared background for profile and settings buttons
- `icon-profile.png` - profile icon
- `icon-settings.png` - settings icon
- `resource-card-bg.png` - shared background for stamina, coin, and star counters
- `exchange-shop-entry-icon-v1.png` - generated tight transparent PNG for the home exchange shop entry, includes the `兑换` label and should be used as one whole image rather than rebuilt from CSS parts
- `arrow-button-bg.png` - shared round background for left and right chapter arrows
- `icon-arrow-left.png` - left arrow icon
- `icon-arrow-right.png` - right arrow icon
- `icon-lock.png` - lock icon

## Fruit Forest

- `background-fruit-full.png`
- `tab-fruit-selected-bg.png`
- `tab-fruit-unselected-bg.png`
- `chapter-title-fruit-bg.png`
- `level-fruit-current-bg.png`
- `level-fruit-completed-bg.png`
- `level-fruit-not-started-bg.png`
- Fruit Forest level nodes use generated `1024px x 1024px` state icons with a shared `912px` visible height and preserved source aspect ratio: top universal stars, middle state button, bottom number plaque.
- `start-button-fruit-bg.png`

## Candy Garden

- `background-candy-full.png`
- `tab-candy-selected-bg.png`
- `tab-candy-unselected-bg.png`
- `chapter-title-candy-bg.png`
- `level-candy-current-bg.png`
- `level-candy-completed-bg.png`
- `level-candy-not-started-bg.png`
- `road-candy-connector.png` - generated continuous candy-stick connector for the Candy Garden road
- Candy Garden level nodes use generated `1024px x 1024px` state icons with a shared `912px` visible height and preserved source aspect ratio: top universal stars, middle state button, bottom number plaque.
- `start-button-candy-bg.png`

## Jelly Castle

- `background-jelly-full.png`
- `tab-jelly-selected-bg.png`
- `tab-jelly-unselected-bg.png`
- `chapter-title-jelly-bg.png`
- `level-jelly-current-bg.png`
- `level-jelly-completed-bg.png`
- `level-jelly-not-started-bg.png`
- `road-jelly-connector.png` - generated continuous ice-crystal connector for the Jelly Castle road, chroma-keyed and trimmed with no transparent edge padding
- Jelly Castle level nodes use generated `1024px x 1024px` state icons with a shared `912px` visible height and preserved source aspect ratio: top universal stars, middle state button, bottom number plaque.
- `start-button-jelly-bg.png`

## Preview

- `_contact-sheet.png` - local overview sheet for quick visual review
- `output/home-road-node-assets-preview.png` - generated 3x3 preview for the current nine level-node state icons

## Level Node Icon Notes

- The nine `level-*-bg.png` state icons are generated image assets, not slices from a shared sheet.
- Their canvas and visible height are normalized with uniform scaling; the source aspect ratio is preserved to avoid stretching.
- Completed states contain a check mark, current states are blank active buttons animated by CSS breathing, and locked states contain a lock.
- The post-processing script only removes chroma-key background, normalizes the canvas with uniform scaling, and seals internal transparent holes.
