# UI-ICON 独立组件资产清单

生成日期：2026-06-15

## 说明

本目录用于二级页 HTML 接入，当前资产均为独立组件 PNG，不再使用整页设计稿裁剪版。

- `gpt-image-2` 单独生成：返回按钮、开关、头像框、模块背景、叶子装饰、第 X 关底牌、已通关图标、音乐/音效/振动图标。
- 复用仓库已有独立资产：返回首页按钮背景、兑换按钮背景、顶部标题背景、金币/体力/提示/洗牌/星星/当前进度/三星图标。
- `_contact-sheet.png` 只是预览联系表，不用于游戏接入。

## 按钮

- `button-back-icon.png`：顶部返回按钮，独立去底 PNG。
- `button-return-home-bg.png`：返回首页按钮背景，无文字。
- `button-exchange-bg.png`：兑换按钮背景，无文字。
- `switch-on-icon.png`：开关开启状态，含“开”字。

## 顶部资源栏

- `title-bg-profile-center.png`：个人中心标题背景，无文字。
- `title-bg-settings.png`：设置标题背景，无文字。
- `title-bg-coin-exchange.png`：金币兑换标题背景，无文字。

## 模块背景

- `avatar-frame.png`：头像框。
- `module-profile-info-bg.png`：个人资料大模块背景。
- `module-profile-stat-card-bg.png`：个人中心统计小模块背景。
- `module-profile-coin-wide-bg.png`：个人中心金币横向模块背景。
- `module-profile-bottom-card-bg.png`：个人中心底部统计模块背景。
- `module-settings-panel-bg.png`：设置主面板背景。
- `module-settings-row-bg.png`：设置单行模块背景。
- `module-settings-clear-bg.png`：清除进度模块背景。
- `module-exchange-coin-bg.png`：金币兑换顶部金币资源模块背景。
- `module-exchange-item-bg.png`：金币兑换单个兑换项模块背景。
- `coin-exchange-resource-bg.png`：金币兑换资源栏背景。

## 图标

- `text-side-leaf-left.png`：文字左侧叶子图标。
- `text-side-leaf-right.png`：文字右侧叶子图标。
- `icon-current-progress.png`：当前进度图标。
- `level-badge-bg.png`：第 X 关背景图，无文字。
- `icon-star.png`：星星图标。
- `icon-coin.png`：金币图标。
- `icon-completed.png`：已通关图标。
- `icon-three-star.png`：三星关卡图标。
- `icon-music.png`：音乐图标。
- `icon-sound.png`：音效图标。
- `icon-vibration.png`：振动图标。
- `icon-stamina.png`：体力图标。
- `icon-hint.png`：提示图标。
- `icon-shuffle.png`：洗牌图标。

## 接入建议

- 背景图和图标建议用 `img` 或 `background-image` 接入。
- 动态文字、数字、金币价格、关卡号建议由 HTML/CSS 覆盖，不要烘焙进图片。
- 如果需要统一显示尺寸，优先在 CSS 中按目标宽高缩放，不要直接修改源 PNG。
