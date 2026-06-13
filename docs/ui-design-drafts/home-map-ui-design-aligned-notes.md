# 首页三主题对齐版设计稿说明

说明：这组三张图用于校验布局对齐，不作为最终美术首选。最终视觉质感以 `home-map-ui-design-*-preferred.png` 三张为准。

对应图片：

- `home-map-ui-design-fruit-forest-aligned.png`
- `home-map-ui-design-candy-garden-aligned.png`
- `home-map-ui-design-jelly-castle-aligned.png`

## 本轮修正点

- 去掉中部地图区域左右两侧的竖向奶油边框，地图改为开放式背景。
- 顶部三张资源卡保持同尺寸、同 y 坐标、同 x 坐标。
- 资源卡之间固定 `10px` 间距。
- 三个主题的个人、设置、资源卡、章节 tab、左右箭头、章节标题、底部主按钮全部共用同一套位置。
- 主题切换时只更换背景、当前章节高亮色、关卡编号段和星星统计。

## 固定布局参数

- 主视口：`390 x 844` CSS 像素。
- 资源卡：`108 x 62` CSS 像素。
- 资源卡 x 坐标：`24 / 142 / 260`。
- 资源卡间距：`10px`。
- 章节 tab：三枚 tab 等宽，x 坐标为 `65 / 154 / 242`。
- 底部主按钮：`238 x 68` CSS 像素，x 坐标 `76`。

## 产出方式

- 三张主题背景图由 `gpt-image-2` 生成。
- 最终三主题高保真稿由 `docs/ui-design-drafts/home-map-theme-template.html` 统一叠加 UI 控件并导出。
- 导出脚本：`scripts/render-home-map-designs.mjs`。
- 脚本会校验资源卡间距必须为 `10px`，避免后续误改。

## 后续实现建议

- 首页实际开发时优先复用这套固定布局参数。
- 背景和路径可做成主题资源，UI 控件保持统一组件。
- 主题切换或横向滑动时，不要改变顶部资源栏、章节按钮和底部按钮尺寸位置。
