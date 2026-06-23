# Link Match 连连看项目交接文档

更新时间：2026-06-23

## 1. 项目定位

- 项目名称：Link Match 连连看
- 项目路径：`D:\工作文件\游戏\连连看`
- 项目类型：移动端竖屏 H5 单机连连看 MVP
- 当前阶段：`1.1.9首页优化` 本地实现完成：三主题 9 张关卡三态 icon 已统一为生成图资源并保持等比不拉伸；顶部通用星星徽章已下移到关卡主 icon 顶部上方约 `10px` 的贴合位置；正在玩的关卡恢复为整体循环放大缩小的 `currentLevelPulse` 呼吸动画，并将缩放原点设为底部中心，避免第 01 关在呼吸放大时超出关卡区域底部；三主题关卡数字层已按最新反馈调整为 `bottom: 1px`。

## 2. 当前进度

- 2026-06-23 `1.1.9首页优化`：提交前收口当前首页关卡优化。三主题 9 张关卡三态 icon 均来自 `gpt-image-2` 生成图，并经 `scripts/process-home-road-node-assets.py` 绿幕去底、等比缩放、居中贴底和内部透明小孔封闭，不切图、不做非等比拉伸；糖果花园连接线使用 `road-candy-connector.png` 粉白糖果棒生成图分段渲染。按最新反馈将三主题 `.road-stars` 从 `top: 6px` 调整为 `top: 15px`，对应星星图片上边缘约在 `.road-level-main` 顶部上方 `10px`，让顶部星星贴合关卡 icon；正在玩的关卡 `.road-level.current` 恢复 `currentLevelPulse 1.4s ease-in-out infinite` 循环缩放呼吸动画，并补 `transform-origin: 50% 100%`，避免底部首关随缩放向下溢出；三主题 `.road-level-number` 及当前态数字 override 均已调整为 `bottom: 1px`。`scripts/check-home-road-node-assets.py` 覆盖 9 张 icon 尺寸、等比、内部透明洞和糖果连接线透明缝检查；`scripts/smoke-browser.mjs` 覆盖星星相对主 icon 顶部约 `-10px`、当前关卡整体动画为 `currentLevelPulse`、图片连接线和节点结构断言。
- 2026-06-23 `1.1.9-首页三主题关卡节点统一`：按最新反馈重新生成水果森林、糖果花园、果冻城堡三主题 9 张关卡三态 icon，全部来自 `gpt-image-2` 独立生成图，后处理只做绿幕去底、统一 `1024px x 1024px` 画布、等比缩放到 `912px` 可见高度、居中贴底和内部透明小孔封闭，不从整图切片，也不做非等比拉伸。9 张资源均通过 `scripts/check-home-road-node-assets.py` 校验，确认画布尺寸一致、可见高度一致、源图宽高比与输出 bbox 宽高比一致且内部没有全透明空洞；预览图输出到 `output/home-road-node-assets-preview.png`。`src/styles.css` 已将果冻城堡纳入同一套 `84px x 96px` 节点结构，当前态改为 `.road-level-main` 亮度/阴影呼吸，不再缩放整个节点；底部数字牌使用 `padding: 5px 10px`、`height: 26px`、grid 居中。`src/game.js` 已将果冻城堡地图上下边距同步为 48px，保证首关贴合关卡区域底部。`scripts/smoke-browser.mjs` 已扩展三主题节点结构、数字 padding、当前态呼吸、糖果/水果图片连接线和底部贴边断言。
- 2026-06-23 `1.1.7-首页关卡优化`：首页关卡区域已按反馈改为红框内左右交替排布，01 关贴近底部、30 关贴近顶部，并保持与章节栏/底部按钮 30px 间距；水果森林关卡连接线改为 `src/assets/UI-Home/road-vine-connector.png` 藤曼图片分段渲染，糖果花园/果冻城堡保留主题化 SVG 连接线风格。完成关卡星级从 CSS 星星改为图片徽章，`renderMiniStars()` 按 `bestStars` 动态选择 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`；最终采用 C 珊瑚粉底色，1 星为 1 实星 + 2 空心星，2 星为 2 实星 + 1 空心星，3 星为 3 实星。三张星级徽章均由 `gpt-image-2` 独立生成并替换，后处理只做纯色底移除和紧缩透明画布，最终尺寸统一为 `540px x 216px`，页面显示统一为 `66px x 26px`。修复完成关卡 icon 黑色脏阴影问题，并修复通关成功从结果页返回首页后藤曼连接线因隐藏态宽度计算错误而贴到左侧的 bug；`scripts/smoke-browser.mjs` 已新增星级图片、星级尺寸一致、关卡上下边距、左右交替布局、29 段藤曼、通关返回首页藤曼对齐等回归断言。
- 2026-06-23 `1.1.8-首页关卡节点同步优化`：按最新反馈将水果森林与糖果花园同步为新关卡节点结构：顶部显示通用星级图 `road-stars-1/2/3.png`，中间为状态按钮图，底部为 HTML 动态关卡数字牌；已替换 `level-fruit-completed-bg.png`、`level-fruit-current-bg.png`、`level-fruit-not-started-bg.png`、`background-candy-full.png`、`level-candy-completed-bg.png`、`level-candy-current-bg.png`、`level-candy-not-started-bg.png`，并新增 `road-candy-connector.png`。糖果连接线不再走 `buildRoadSvg()`，改为 29 条 `.road-candy-image-segment`，每条使用同一张 `gpt-image-2` 生成的完整粉白糖果棒图片按两点间距拉伸/旋转，避免切片重复导致透明缝。新版水果/糖果关卡节点使用主题专用上下 48px 地图边距，底部首关与关卡区域底边保持约 0px；关卡数字改为固定高度 grid 盒，保证在底部方框中垂直居中。新增 `scripts/process-home-road-node-assets.py` 记录本轮生成图到项目资源的绿幕抠像、裁边和备份流程；`scripts/smoke-browser.mjs` 已增加水果森林/糖果花园必须使用图片连接线、0 条 SVG road-path、节点三层结构、底部首关贴边和数字居中的回归断言。
- 2026-06-23 `1.1.7-首页关卡优化`：首页关卡区域已按反馈改为红框内左右交替排布，01 关贴近底部、30 关贴近顶部，并保持与章节栏/底部按钮 30px 间距；水果森林关卡连接线改为 `src/assets/UI-Home/road-vine-connector.png` 藤曼图片分段渲染，糖果花园/果冻城堡保留主题化 SVG 连接线风格。完成关卡星级从 CSS 星星改为图片徽章，`renderMiniStars()` 按 `bestStars` 动态选择 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`；最终采用 C 珊瑚粉底色，1 星为 1 实星 + 2 空心星，2 星为 2 实星 + 1 空心星，3 星为 3 实星。三张星级徽章均由 `gpt-image-2` 独立生成并替换，后处理只做纯色底移除和紧缩透明画布，最终尺寸统一为 `540px x 216px`，页面显示统一为 `66px x 26px`。修复完成关卡 icon 黑色脏阴影问题，并修复通关成功从结果页返回首页后藤曼连接线因隐藏态宽度计算错误而贴到左侧的 bug；`scripts/smoke-browser.mjs` 已新增星级图片、星级尺寸一致、关卡上下边距、左右交替布局、29 段藤曼、通关返回首页藤曼对齐等回归断言。
- 2026-06-22 `1.1.7-首页关卡Icon二次优化`：根据最新反馈重新生成并替换 `src/assets/UI-Home/level-*-bg.png` 9 张关卡三态 icon。完成态统一为主题色按钮 + 对勾，底部星星不再烘焙进 PNG，仍由 `renderMiniStars()` 按 `record.bestStars` 动态渲染；当前态保留高亮/主题装饰；未通关态统一为锁定视觉，并移除旧 DOM 叠加锁图标与 `.road-lock-icon` 样式，避免“双锁”。资源经 `scripts/process-level-icon-assets.py` 处理，完成绿幕抠像、去溢色、内容边界裁切，最终 9 张资源透明边距均为 `(0, 0, 0, 0)`；关卡 icon 显示尺寸先放大后按反馈缩到当前 0.8 倍，普通节点为 `77px x 67px`，当前关卡为 `84px x 72px`，关卡号和星星同步缩小。期间曾生成三主题树形关卡地图背景并接入试验，因实际效果“不好看”已删除 `src/assets/UI-Home/tree-map/` 并移除所有 `tree-map` / `TREE_MAP` 引用。
- 2026-06-18 `1.1.6-首页关卡Icon优化`：重新生成 `src/assets/UI-Home/level-*-bg.png` 9 张首页关卡底座资源，替换此前挖空/遮挡处理方案；新底座不包含星星、星星槽、文字、锁、黑条或白条，生成后完成绿幕透明化和内容边界裁切，确认无多余透明留边。`src/game.js` 的 `renderMiniStars()` 改为只输出实际获得星数对应的 CSS 星星，0 星不显示，1/2/3 星分别显示对应数量；`src/styles.css` 移除临时底部遮罩条并强化 CSS 星星样式；首页左右章节箭头改为首尾循环切换，不再禁用；金币 icon 相关资源已重切去底色。`scripts/smoke-browser.mjs` 已新增首页章节循环、关卡星级按 `bestStars` 显示、关卡底座无黑条/挖空缺口、金币资源和主流程回归断言。
- 2026-06-18 `1.1.5首页UI优化`：重新生成并替换首页问题资源，修复透明空白、底色残留和主题色不一致；`src/index.html` 首页资源框改为体力/金币/星星 icon + 数值布局，体力保留刷新倒计时，金币/星星去掉说明文字；三个主题 tab 已移除，原章节标题栏上移到左右切换箭头中间，左右箭头统一使用 `src/assets/UI-ICON/exchange-page/exchange-page-arrow-bg-v2.png`；`src/styles.css` 去掉 `.app-shell` padding，首页顶部入口与资源卡重排，底部开始按钮按 `1115/276` 原图比例 `width: 100%` 显示并增加 `padding-bottom: 10px`，`screen-start` 当前为 `padding: 0 10px 0`，`.home-header` 当前为 `margin-top: 30px`；`src/game.js` 改为只维护章节切换器状态，不再渲染三枚 chapter tab；`scripts/smoke-browser.mjs` 已同步断言首页无 chapter tab、章节标题栏/兑换页箭头资源实际渲染、资源框文本精简、开始按钮比例和主流程不回归。
- 2026-06-17 兑换页面优化完成：金币兑换页中间商城已替换为 v2 独立组件资源，新增 `exchange-shop-panel-bg-v2.png`、`exchange-title-card-bg-v2.png`、`exchange-price-button-bg-v2.png`、`exchange-page-arrow-bg-v2.png` 和 `exchange-shop-preview-v2.png`；大兑换框、头衔框、价格按钮和翻页按钮均已重切透明余边并按原图比例显示，避免拉伸压缩。商城从 3x3/两页改为两列、每页 6 个、共 3 页；奖品框当前宽度为 `117px`，绿框文字水平垂直居中，价格按钮和金币 icon 正常比例显示；`scripts/smoke-browser.mjs` 已覆盖 v2 资源接入、两列布局、每页 6 个、3 页翻页、奖品框比例、价格按钮比例、金币 icon 尺寸和兑换结果弹框。
- 2026-06-16 首页 UI 替换：`src/index.html` 已给首页顶部入口、左右箭头和章节锁定提示补入真实图标节点；`src/game.js` 会按当前主题给首页、tab、章节标题和关卡节点切换主题类；`src/styles.css` 已将首页背景、资源卡、tab、章节标题、关卡当前/已完成/未开始三态、锁图标和底部开始按钮切换到 `src/assets/UI-Home/` 切图。旧的渐变卡片、旧路线 SVG 叠层和旧纯色首页背景已从当前首页视觉中移除；`scripts/smoke-browser.mjs` 已新增 UI-Home 资源实际渲染断言。
- 2026-06-16 金币兑换 3x3 头衔商城接入：金币兑换页中部已接入两页 3x3 头衔商城，商品卡为青绿色称号牌 + 金币价格按钮，底部左右方向按钮可翻页；点击价格按钮会按当前金币余额弹出“已兑换成功”或“金币不足”。当前版本仅做展示和反馈，不扣除金币，不保存已拥有/已佩戴头衔；`scripts/smoke-browser.mjs` 已覆盖 9 个商品、两页翻页、成功弹框、金币不足弹框和旧体力/提示/洗牌兑换项不回归。
- 2026-06-16 金币兑换页面方向调整：按最新产品口径，金币后续不用于兑换体力、提示、洗牌这类消耗资源；已删除金币兑换页里“体力 +30 / 提示 +1 / 洗牌 +1”三个兑换框和旧兑换按钮绑定，并将兑换方向转为头衔或其他非体力/非基础道具类内容。`scripts/smoke-browser.mjs` 已新增回归断言，确保旧三项和旧兑换按钮不会重新出现。
- 2026-06-16 首页资源提交：`src/assets/UI-Home/` 已纳入仓库，资源来自三张已确认的新版首页设计稿，包含通用资源 `top-button-bg.png`、`icon-profile.png`、`icon-settings.png`、`resource-card-bg.png`、`arrow-button-bg.png`、`icon-arrow-left.png`、`icon-arrow-right.png`、`icon-lock.png`；水果森林、糖果花园、果冻城堡三主题分别包含完整背景、选中/未选中 tab、章节标题底图、当前/已完成/未开始关卡底图、开始按钮底图；另包含 `asset-manifest.md` 和 `_contact-sheet.png` 便于后续核对。
- 2026-06-15 设置页面 UI 优化：设置页按个人中心页面风格继续收口，左上返回按钮和标题牌保持二级页统一规格；音乐、音效、振动三行保留独立切图背景，去除文字两侧小草 icon，三行内部 icon、文字和开关上下居中；清除进度框已移除，`game.js` 对已删除的 `#clearProgressButton` 做可选绑定保护；`module-settings-row-bg.png`、`icon-music.png`、`icon-sound.png`、`icon-vibration.png` 的设置页目录和根目录同名资源均已裁切透明余边；当前设置行 CSS 关键值为 `grid-template-columns: 70px minmax(0, 1fr) 120px`、`min-height: 80px`、`.settings-icon` 为 `40px x 40px` 且 `margin-left: 20px`、`.settings-toggle` 为 `padding: 0 50px 0 20px`、圆点为 `top: 7px; right: 10px; width: 26px; height: 26px`、面板 `padding: 60px 20px 40px`；`scripts/smoke-browser.mjs` 已增加设置页截图和这些样式值的回归断言。
- 2026-06-15 个人中心页面三星关卡 bug 修复：原个人中心“三星关卡”统计读取旧字段 `record.stars`，而首页关卡星级和进度系统使用的是历史最高星 `bestStars`，导致个人中心与首页显示不一致。现已在 `src/progression.js` 增加统一统计函数 `calculateThreeStarLevels()`，个人中心改为复用该函数；`tests/progression.test.mjs` 增加历史最高星统计回归测试，`scripts/smoke-browser.mjs` 增加个人中心三星关卡数与首页关卡星级节点一致性断言。
- 2026-06-15 个人中心页面 UI 完成：个人中心已完成多轮截图反馈精修，左上返回按钮缩小，标题牌和文字对齐完成，玩家信息框下移并保留独立背景图，6 个中间数据框去除额外杏色填充和白色边框并整体/内部居中；当前进度关卡条、总星数、已通关、三星关卡文字字号和位置已按最新要求调整；底部“返回首页”按钮已移除，保留左上返回入口；页面保持无滚动条。
- 2026-06-15 首页二级页面开发+UI：点击首页“个人”进入个人中心，点击“设置”进入设置页，点击金币资源框进入金币兑换页；三个页面均使用独立 DOM 布局和组件资产组合，保留动态文字/数值为 HTML/CSS 层，整页设计稿仅作为布局参考。个人中心已同步当前关卡、总星数、金币、已通关数和三星关卡数；设置页已提供音乐、音效、振动开关的前端切换；金币兑换页已展示金币、体力/提示/洗牌兑换项和兑换按钮占位。
- 2026-06-14 首页背景回退：按最新截图反馈，首页不再使用或透出水果背景图；`body` 改为纯浅绿色背景，原 `page-bg.png` 仅保留在游戏页使用。浏览器 smoke 已新增断言，防止首页和页面安全区再次露出背景图。
- 2026-06-13 首页 UI 重改：新版三主题首页完整设计稿已确认并保存，覆盖水果森林、糖果花园、果冻城堡；设计稿已去除截图外侧黑色阴影，后续可作为首页切图和 H5 接入依据。

当前已完成 H5 单机 demo 的核心玩法、体力系统、道具占位、结算流程、移动端游戏 UI、第一版章节闯关首页布局、`demo1.0.6-UI布局更新`、`demo1.0.7--金币系统优化`、`demo1.0.8--首页二级页面开发+UI`、`demo1.0.9个人中心页面UI完成`、`demo1.1.1个人中心页面三星关卡bug修复`、`demo1.1.2设置页面UI优化`、`demo1.1.3首页资源提交`、`1.1.4-首页UI替换`、`1.1.4兑换页面优化完成`、`1.1.5首页UI优化`、`1.1.6-首页关卡Icon优化`、`1.1.7-首页关卡优化`。首页 UI 方向已执行还原清理：旧三主题高保真稿、首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图均已删除；新版三主题首页完整 UI 设计稿已重新确定并保存，且首页资源包已接入 H5 首页渲染。

已完成内容：

- 首页和章节关卡：
  - 首页顶部保留个人中心、设置、体力、金币、星星入口，已删除 `Link Match / 连连看` 大标题。
  - 首页改为可纵向滑动的左右交替关卡地图，当前视口展示约 4-5 个大尺寸关卡点，01 关贴近关卡区域底部，30 关贴近顶部。
  - 关卡顺序为自下而上：第 01 关在底部，向上滑动查看后续关卡。
  - 主题章节为水果森林 1-30、糖果花园 31-60、果冻城堡 61-90；当前首页不再显示三枚主题 tab，中间只保留当前章节关卡栏。
  - 支持左右箭头切换主题；糖果花园需通关第 30 关后进入，果冻城堡需通关第 60 关后进入。
  - 首页底部居中显示“开始闯关/继续闯关”按钮，按钮按 `1115/276` 原图比例铺满底部容器，底部 dock 仍保留 `padding-bottom: 30px`，按钮文字保留 `padding-bottom: 10px` 下压。
  - 首页不再显示右侧“获取体力/已领取完”按钮，也不保留底部 4 个 tab。
  - 首页背景已切换为 `src/assets/UI-Home/background-*-full.png` 三主题完整背景，不再露出 `src/assets/jelly-fruit/page-bg.png`。
  - 原水果果冻背景图仍保留给主游戏页面使用，不影响游戏页、弹框和结算页视觉。
  - 首页旧三主题高保真稿、旧首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图已删除。
  - 已明确首页地图采用开放式背景，不再使用中部地图左右竖向奶油边框。
  - 已删除旧的临时视觉参考图 `docs/fea087d1-5071-4155-9224-59bc0ea52572.jpeg`。
  - 新版首页 UI 设计稿已保存为三张完整预览图：
    - `docs/ui-design-drafts/home-ui-design-v2-fruit-forest.png`
    - `docs/ui-design-drafts/home-ui-design-v2-candy-garden.png`
    - `docs/ui-design-drafts/home-ui-design-v2-jelly-castle.png`
  - 新版设计稿采用完整首页结构：个人/设置入口、体力/金币/星星资源栏、左右切换按钮、当前章节关卡栏、蜿蜒关卡路线、关卡星级底座、锁定态、底部开始闯关按钮。
  - 新版首页资源包已接入 H5 首页渲染：顶部个人/设置入口、体力/金币/星星资源卡、章节标题、关卡三态底座、锁图标和底部开始按钮均使用 `src/assets/UI-Home/` 独立切图；左右切换按钮复用 `src/assets/UI-ICON/exchange-page/exchange-page-arrow-bg-v2.png`；动态文字和数值仍由 HTML/CSS/JS 渲染。
  - 2026-06-22 已尝试三主题树形弹框地图背景方案并删除：`tree-map` 资源目录和代码引用已清理，当前首页地图继续使用开放式章节背景 + 关卡 icon 路线。
  - 首页关卡 icon 当前使用二次优化资源：完成态对勾 + 顶部动态星级徽章、当前态高亮、未通关态锁定；普通节点当前显示尺寸约 `77px x 67px`，当前关卡约 `84px x 72px`。
  - 首页完成关卡星级徽章当前使用 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`，均为 `gpt-image-2` 独立生成的 C 珊瑚粉底色图片，画布已收紧到 `540px x 216px`，页面显示约 `66px x 26px`。
  - 水果森林连接线当前使用 `road-vine-connector.png` 藤曼图片分段渲染；糖果花园连接线当前使用 `road-candy-connector.png` 粉白糖果棒图片分段渲染，糖果花园不再使用 SVG 路线；水果森林、糖果花园、果冻城堡 9 张关卡三态 icon 均已统一为顶部通用星星、中间状态按钮、底部数字牌结构；通关成功返回首页后会在首页可见且布局稳定后重新计算图片连接线位置，避免隐藏态宽度计算导致连接线贴边。

- 首页二级页面：
  - 首页“个人”按钮已接入 `#profileScreen`，展示个人中心页面。
  - 首页“设置”按钮已接入 `#settingsScreen`，展示设置页面。
  - 首页金币资源框已改为可点击按钮 `#coinExchangeButton`，点击进入 `#exchangeScreen` 金币兑换页面。
  - 三个页面均使用组件化 HTML/CSS 布局，不再使用 `profile-fruit-forest.png`、`settings-fruit-forest.png`、`exchange-fruit-forest.png` 作为整页铺底。
  - 个人中心包含头像昵称、ID、当前进度、总星数、金币、已通关、三星关卡模块；相关数值由 `state.progress` 动态渲染。
  - 个人中心已完成 UI 精修：玩家信息框 `margin-top: 50px`，6 个数据框整体居中、内部内容上下居中，统计模块去除额外边框/填充，当前进度关卡条和总星数数字下移 `10px`，已通关/三星关卡显示为 `0关` 格式。
  - 个人中心“三星关卡”统计已统一使用 `bestStars >= 3`，与首页关卡节点星级显示同源，不再读取旧字段 `stars`。
  - 个人中心底部“返回首页”按钮已移除，只保留左上角返回按钮。
  - 设置页包含音乐、音效、振动三个开关；开关目前为前端状态切换，清除进度框已按当前 UI 要求移除。
  - 金币兑换页目前包含金币数量展示、三页头衔商城、左右翻页按钮和兑换结果弹框；商城中部使用 v2 大兑换框与头衔奖品框独立资源，两列布局，每页 6 个头衔；旧的体力 +30、提示 +1、洗牌 +1 三个兑换项和兑换按钮已删除，金币不再兑换体力、提示、洗牌。
  - 个人中心、设置页和金币兑换页均只保留左上返回按钮，底部“返回首页”按钮已移除。
  - `scripts/smoke-browser.mjs` 已新增断言：二级页必须由布局根节点渲染，若重新使用整页设计图会失败；个人中心覆盖无滚动、返回按钮尺寸、标题文字位置、6 个数据框居中/无边框、统计字号、`0关` 后缀、三星关卡与首页星级数据一致、玩家信息框 `margin-top: 50px`、底部返回按钮移除等回归检查；设置页覆盖 3 个设置行、清除进度框移除、行背景/卡片无额外白边、行内元素上下居中、设置 icon 尺寸和左边距、设置行列宽/高度、开关 padding/圆点尺寸与位置、面板 padding 等回归检查；金币兑换页覆盖 v2 资源、两列/每页 6 个/共 3 页、奖品框原图比例、价格按钮和金币 icon 正常比例、兑换结果弹框和旧兑换项不回归。

- 主游戏页面：
  - 移动端竖屏布局，页面禁止滚动。
  - 顶部 HUD、棋盘区域、底部工具栏三段式布局。
  - 棋盘区域已在顶部 HUD 和底部工具栏之间居中显示。
  - 底部道具栏固定在页面底部上方 `50px` 的位置。
  - 顶部显示关卡、时间、剩余、得分、体力。
  - 已移除主页顶部“最佳分 + 星星”横条。
  - 底部工具栏已去掉绿色虚线分隔线。
  - 提示和洗牌道具初始均为 0。
  - 道具为 0 时不再保持呼吸动画；点击提示或洗牌仍会弹出道具用完弹框。

- 弹框和结果页：
  - 暂停弹框、离开本局弹框、道具用完弹框、体力不足弹框、通关成功、挑战失败均已统一为水果糖果果冻风。
  - 所有弹框背景使用独立切图 `src/assets/ui-cut/modal-card-bg.png`，不是截图直接贴上去。
  - 所有弹框按钮使用独立切图：
    - `src/assets/ui-cut/modal-button-primary.png`
    - `src/assets/ui-cut/modal-button-secondary.png`
  - 所有弹框顶部胶囊图压在弹框上边框上，位置为一半在弹框外、一半在弹框内。
  - 胶囊图内已去掉星星装饰，改为动态显示当前关卡，例如 `第01关`。
  - 成功/失败结果页已加黑灰色蒙版。
  - 成功/失败结果页已去掉体力栏。
  - 成功/失败结果页已去掉标题下方说明文字。
  - 首次通关成功文案为“通关成功，获得 X + 金币图标”，金币数字放大加粗并使用独立金币切图。
  - 已通关关卡重复通关文案为“恭喜通关，重复关卡无法获得金币。”，不显示金币数字和金币图标。
  - 通关成功结果页增加“下一关”按钮，按钮顺序为下一关、再玩一局、返回首页，按钮间距统一为 `12px`。
  - 挑战失败文案改为“挑战失败，再来一次吧。”，字号与通关成功文案保持一致。
  - 成功/失败顶部图标已改为独立切图徽章：成功为绿色对勾奖杯，失败为红色 X 奖杯。
  - 暂停弹框和离开本局弹框顶部图标已替换为同风格独立切图，不再使用旧的工具/主页按钮图标。
  - 暂停弹框和离开本局弹框标题字号已调整为与成功/失败结果文案一致。

- 玩法和系统：
  - 棋盘核心规则可用：相同图案、最多两次转弯、允许棋盘外侧绕线。
  - 关卡配置已拆成 90 关章节数据，关卡可独立配置棋盘尺寸、图案数量、时间、提示、洗牌和金币奖励。
  - 初始只开放第 1 关；通关第 N 关后解锁第 N+1 关。
  - 当前数据重置基线为：金币 0、星星 0、通关记录清空、第 1 关未通关、体力 50/50、广告领取次数 0、提示 0、洗牌 0。
  - 游戏正常入口保持随机棋盘；自动化 smoke 可通过 `?boardSeed=smoke-easy` 使用固定棋盘，避免随机局面导致验收偶发失败。
  - 提示、洗牌、暂停、返回首页确认、重新开始、再玩一局流程可用。
  - 错误匹配会提示并抖动选中方块。
  - 无可连接组合时不再自动洗牌，而是提示玩家使用洗牌道具。
  - 星级结算按剩余时间比例计算。
  - 每关星星只记录历史最高星级，不作为资源消耗，也不能重复刷星。
  - 每个主题 30 关首通金币总计 100：主题内 1-10 关每关 2 金币，11-20 关每关 3 金币，21-30 关每关 5 金币。
  - 只有首次通关获得金币；重复挑战已通关关卡不再获得金币。
  - 金币作为后续道具、皮肤或资源系统的基础货币。
  - 体力系统可用：开局扣 3 点，低于上限时自然恢复，看广告和购买均为占位流程。

## 3. 关键文件

- `src/index.html`：首页地图结构、二级页面结构、游戏页结构、弹框结构、结果页结构。
- `src/styles.css`：移动端布局、首页地图、首页纯色背景、二级页面组件布局、游戏页背景、果冻糖果风 UI、弹框、按钮、胶囊标题、滚动锁定。
- `src/game.js`：游戏状态、首页地图渲染、二级页面切换、个人中心/兑换页数据同步、设置开关前端状态、弹框流程、关卡标题同步、清档基线、道具和结算逻辑。
- `src/levels.js`：3 个主题章节、90 关配置、主题内首通金币档位、初始提示/洗牌次数。
- `src/progression.js`：关卡解锁、每关记录、星星统计、三星关卡统计、首次通关判断和金币奖励规则。
- `src/game-rules.js`：体力、星级、广告/购买占位规则。
- `src/engine.js`：连连看棋盘生成、固定随机种子、连线判断、洗牌和可消除对检查。
- `tests/progression.test.mjs`：章节、线性解锁、星星历史最高、三星关卡统计、首通金币和重复通关无金币测试。
- `tests/game-rules.test.mjs`：体力恢复、消耗、广告/购买占位和默认满体力测试。
- `src/assets/ui-cut/modal-card-bg.png`：弹框/结果页背景切图。
- `src/assets/ui-cut/modal-button-primary.png`：主按钮切图。
- `src/assets/ui-cut/modal-button-secondary.png`：副按钮切图。
- `src/assets/ui-cut/result-pass-badge.png`：通关成功奖杯徽章切图。
- `src/assets/ui-cut/result-fail-badge.png`：挑战失败奖杯徽章切图。
- `src/assets/ui-cut/result-coin.png`：通关金币奖励图标切图。
- `src/assets/ui-cut/modal-pause-badge.png`：暂停弹框顶部徽章切图。
- `src/assets/ui-cut/modal-exit-badge.png`：离开本局弹框顶部徽章切图。
- `docs/ui-design-drafts/mobile-modal-result-design.png`：移动端弹框/结果页设计稿。
- `docs/ui-design-drafts/home-ui-design-v2-fruit-forest.png`：新版首页水果森林主题完整 UI 设计稿。
- `docs/ui-design-drafts/home-ui-design-v2-candy-garden.png`：新版首页糖果花园主题完整 UI 设计稿。
- `docs/ui-design-drafts/home-ui-design-v2-jelly-castle.png`：新版首页果冻城堡主题完整 UI 设计稿。
- `src/assets/UI-Home/`：新版首页三主题资源包，包含通用顶部按钮/资源卡/箭头/锁/icon，以及水果森林、糖果花园、果冻城堡三套背景、tab、章节标题、关卡状态和开始按钮切图；当前 9 张 `level-*-bg.png` 均为 `gpt-image-2` 生成的关卡三态 icon 资源，最终统一为 `1024px x 1024px` 画布、`912px` 可见高度并保留源图宽高比，完成态对勾、当前态高亮呼吸、未解锁态锁定；三主题节点均为顶部通用星级图、中间状态按钮、底部数字牌的新版结构；`road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png` 为完成关卡顶部通用星级徽章；`road-vine-connector.png` 为水果森林关卡藤曼连接线，`road-candy-connector.png` 为糖果花园粉白糖果棒连接线；`asset-manifest.md` 为资源清单，`_contact-sheet.png` 为本地总览图。
- `scripts/process-home-road-node-assets.py`：本轮首页关卡节点资源处理脚本，用于将 `gpt-image-2` 生成的三主题 9 张关卡节点、糖果背景和糖果连接线写入 `src/assets/UI-Home/`，并对透明资源执行 chroma-key 透明化、等比缩放、居中贴底和内部透明小孔封闭。
- `scripts/check-home-road-node-assets.py`：9 张关卡节点资源校验脚本，检查画布尺寸统一为 `1024px x 1024px`、可见高度统一为 `912px`，源图宽高比与输出 bbox 宽高比一致，且不存在内部全透明空洞。
- `scripts/process-level-icon-assets.py`：本轮关卡 icon 资源处理脚本，用于将 `gpt-image-2` 生成图映射到 9 个首页关卡状态资源，完成 chroma-key 透明化、去绿色溢边和内容边界裁切。
- `src/assets/UI-ICON/profile-page/`：个人中心页面独立组件资产和页面布局参考图。
- `src/assets/UI-ICON/settings-page/`：设置页面独立组件资产和页面布局参考图。
- `src/assets/UI-ICON/exchange-page/`：金币兑换页面独立组件资产和页面布局参考图。
- `scripts/smoke-browser.mjs`：浏览器自动化验收脚本，使用固定 `boardSeed`，包含首页地图、首页资源卡精简、章节 tab 移除、章节标题栏/兑换页箭头资源渲染、个人中心三星关卡一致性断言、设置页 UI 精修断言、金币兑换页布局断言、头衔商城翻页和兑换结果弹框断言、旧体力/提示/洗牌兑换项移除断言、移动端截图和主流程 UI 断言。

## 4. 最近验证

最近一轮（2026-06-23）已执行：

```powershell
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/smoke-browser.mjs
```

验证结果：

- 构建：成功输出到 `dist/`。
- 完整 smoke：`scripts/smoke-browser.mjs` 通过，输出 `Smoke passed: 36 tiles rendered`，覆盖首页地图、水果森林/糖果花园图片连接线与新节点结构、底部首关贴边、数字牌居中、二级页、主流程、结算弹框、通关返回首页和资源渲染。
- 首页截图检查：`output/home-road-node-assets-preview.png` 为三主题 9 张关卡三态 icon 总览；`output/playwright/home-map-mobile.png` 为本轮 smoke 生成的首页地图截图；糖果花园检查到 29 条 `.road-candy-image-segment`、0 条 `.road-path`，三主题关卡节点均为 `84px x 96px`，数字盒为 grid 且带 `5px 10px` 内边距。
- 资源检查：`road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png` 均为 `540px x 216px`，页面显示统一约 `66px x 26px`；1/2/3 星均按 `bestStars` 加载对应图片。
- 首页地图检查：01 关贴近底部、30 关贴近顶部，关卡左右交替，水果森林 29 段藤曼连接线正常渲染。
- 回归检查：通关成功后从结果页返回首页，藤曼连接线会重新按可见布局计算，未再出现贴左边错位。

重点截图：

- `output/home-star-coral-final.png`
- `output/star-badges-coral-final-contact.png`
- `output/playwright/home-after-success-return.png`
- `output/playwright/home-map-mobile.png`
- `output/playwright/home-fruit-forest-node-sync.png`
- `output/playwright/home-candy-garden-node-fix.png`
- `output/playwright/home-candy-garden-updated.png`
- `output/playwright/home-candy-garden-unlocked-updated.png`
- `output/playwright/profile-mobile.png`
- `output/playwright/settings-mobile.png`
- `output/playwright/exchange-mobile.png`
- `output/playwright/smoke-mobile.png`
- `output/playwright/result-stars-mobile.png`
- `output/playwright/result-failure-mobile.png`
- `output/playwright/pause-modal-mobile.png`
- `output/playwright/tool-modal-mobile.png`
- `output/playwright/exit-modal-mobile.png`
- `output/playwright/stamina-modal-mobile.png`

## 5. 当前 Git 状态

- 当前分支：`main`
- 远程仓库：`https://github.com/NicoKing-One/Link-Match.git`
- 当前未提交内容：水果森林/糖果花园/果冻城堡 9 张三态节点、糖果花园背景图、`src/assets/UI-Home/road-candy-connector.png`、`src/game.js`、`src/styles.css`、`scripts/smoke-browser.mjs`、`scripts/process-home-road-node-assets.py`、`scripts/check-home-road-node-assets.py`、`src/assets/UI-Home/asset-manifest.md`、`docs/project-handoff.md`。
- 当前工作区待提交；`tmp/` 为本轮 image2 后处理临时目录，不纳入提交。
- 本轮提交备注：`1.1.8首页关卡节点同步优化`。

## 6. 运行方式

推荐使用本地服务运行，不要直接双击 `src/index.html`。

```powershell
Set-Location 'D:\工作文件\游戏\连连看'
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\dev-server.mjs
```

然后打开：

```text
http://127.0.0.1:4173
```

也可以直接双击项目里的 `start-game.bat`。

## 7. 下一步建议

建议下一轮按这个顺序继续：

1. 下一轮优先在真实手机视口复核首页三主题关卡地图的滑动手感、关卡遮挡、藤曼/糖果棒/水晶棒连接线风格是否还需要继续细化。
2. 二级页后续替换正式图片/icon 时，保持当前 HTML/CSS 结构不变，只替换 `src/assets/UI-ICON/*-page/` 下的独立资源；个人中心当前版已按 demo1.1.1 收口，设置页当前版已按 demo1.1.2 收口，后续优先避免破坏已写入 smoke 的视觉和数据一致性约束。
3. 完善头衔系统闭环：定义头衔拥有状态、已佩戴状态、金币扣除与持久化规则，并决定重复点击已拥有头衔时显示“已拥有”还是切换佩戴。
4. 接入设置实际逻辑：音乐/音效/振动持久化；若后续重新加入清除本地进度，需要先确认新的入口位置和确认弹框样式。

## 8. 新线程接手提示

新线程开始时可直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，然后继续开发 Link Match 连连看项目。
```
