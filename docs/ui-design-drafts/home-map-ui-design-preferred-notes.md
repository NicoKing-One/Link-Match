# 首页三主题首选视觉稿说明

对应图片：

- `home-map-ui-design-fruit-forest-preferred.png`
- `home-map-ui-design-candy-garden-preferred.png`
- `home-map-ui-design-jelly-castle-preferred.png`

## 结论

这三张是当前首页 UI 的首选美术方向，优先级高于 `aligned` 那组三张模板化预览图。

`preferred` 三张负责回答“页面应该长什么样、质感如何、主题氛围如何”；`aligned` 三张和 `home-map-theme-template.html` 只用于确认布局参数，例如资源卡间距、按钮尺寸和三主题坐标一致。

## 开发取用规则

- 美术质感、背景氛围、按钮高光、节点样式：参考 `preferred`。
- 资源卡间距：参考 `aligned`，三张资源卡之间固定 `10px`。
- 三主题切换：个人、设置、资源卡、章节 tab、左右箭头、标题牌、底部主按钮的位置和尺寸必须一致。
- 中部地图：保留开放式地图，不恢复左右竖向奶油边框。
- 主设计视口仍按 `390 x 844` CSS 像素实现，长屏手机只扩展中部地图区域。

## 注意

`preferred` 三张来自当前确认的视觉方向截图，文件尺寸并不完全一致。后续开发或重新出最终切图时，应按统一视口和布局参数重制，而不是直接把截图作为完整页面背景贴进游戏。
