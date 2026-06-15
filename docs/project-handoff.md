# Link Match 连连看项目交接文档

更新时间：2026-06-15

## 1. 项目定位

- 项目名称：Link Match 连连看
- 项目路径：`D:\工作文件\游戏\连连看`
- 项目类型：移动端竖屏 H5 单机连连看 MVP
- 当前阶段：`demo1.0.9个人中心页面UI完成` 已完成个人中心页面视觉精修：个人中心使用真实 HTML/CSS 结构和独立组件资产，玩家信息框、6 个数据框、关卡条、统计数字、返回入口和移动端无滚动布局均已按当前截图反馈调整完成。

## 2. 当前进度

- 2026-06-15 个人中心页面 UI 完成：个人中心已完成多轮截图反馈精修，左上返回按钮缩小，标题牌和文字对齐完成，玩家信息框下移并保留独立背景图，6 个中间数据框去除额外杏色填充和白色边框并整体/内部居中；当前进度关卡条、总星数、已通关、三星关卡文字字号和位置已按最新要求调整；底部“返回首页”按钮已移除，保留左上返回入口；页面保持无滚动条。
- 2026-06-15 首页二级页面开发+UI：点击首页“个人”进入个人中心，点击“设置”进入设置页，点击金币资源框进入金币兑换页；三个页面均使用独立 DOM 布局和组件资产组合，保留动态文字/数值为 HTML/CSS 层，整页设计稿仅作为布局参考。个人中心已同步当前关卡、总星数、金币、已通关数和三星关卡数；设置页已提供音乐、音效、振动开关的前端切换；金币兑换页已展示金币、体力/提示/洗牌兑换项和兑换按钮占位。
- 2026-06-14 首页背景回退：按最新截图反馈，首页不再使用或透出水果背景图；`body` 改为纯浅绿色背景，原 `page-bg.png` 仅保留在游戏页使用。浏览器 smoke 已新增断言，防止首页和页面安全区再次露出背景图。
- 2026-06-13 首页 UI 重改：新版三主题首页完整设计稿已确认并保存，覆盖水果森林、糖果花园、果冻城堡；设计稿已去除截图外侧黑色阴影，后续可作为首页切图和 H5 接入依据。

当前已完成 H5 单机 demo 的核心玩法、体力系统、道具占位、结算流程、移动端游戏 UI、第一版章节闯关首页布局、`demo1.0.6-UI布局更新`、`demo1.0.7--金币系统优化`、`demo1.0.8--首页二级页面开发+UI`、`demo1.0.9个人中心页面UI完成`。首页 UI 方向已执行还原清理：旧三主题高保真稿、首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图均已删除；新版三主题首页完整 UI 设计稿已重新确定并保存。

已完成内容：

- 首页和章节关卡：
  - 首页顶部保留个人中心、设置、体力、金币、星星入口，已删除 `Link Match / 连连看` 大标题。
  - 首页改为可纵向滑动的蜿蜒小路关卡地图，当前视口展示约 10 个关卡点。
  - 关卡顺序为自下而上：第 01 关在底部，向上滑动查看后续关卡。
  - 主题章节为水果森林 1-30、糖果花园 31-60、果冻城堡 61-90。
  - 支持左右切换主题；糖果花园需通关第 30 关后进入，果冻城堡需通关第 60 关后进入。
  - 首页底部居中显示“开始闯关/继续闯关”按钮，按钮宽度为屏幕宽度一半，底部 `padding-bottom: 30px`。
  - 首页不再显示右侧“获取体力/已领取完”按钮，也不保留底部 4 个 tab。
  - 首页背景图已移除：首页和页面安全区使用纯浅绿色背景，不再露出 `src/assets/jelly-fruit/page-bg.png`。
  - 原水果果冻背景图仍保留给主游戏页面使用，不影响游戏页、弹框和结算页视觉。
  - 首页旧三主题高保真稿、旧首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图已删除。
  - 已明确首页地图采用开放式背景，不再使用中部地图左右竖向奶油边框。
  - 已删除旧的临时视觉参考图 `docs/fea087d1-5071-4155-9224-59bc0ea52572.jpeg`。
  - 新版首页 UI 设计稿已保存为三张完整预览图：
    - `docs/ui-design-drafts/home-ui-design-v2-fruit-forest.png`
    - `docs/ui-design-drafts/home-ui-design-v2-candy-garden.png`
    - `docs/ui-design-drafts/home-ui-design-v2-jelly-castle.png`
  - 新版设计稿采用完整首页结构：个人/设置入口、体力/金币/星星资源栏、三主题章节标签、左右切换按钮、蜿蜒关卡路线、关卡星级底座、锁定态、底部开始闯关按钮。

- 首页二级页面：
  - 首页“个人”按钮已接入 `#profileScreen`，展示个人中心页面。
  - 首页“设置”按钮已接入 `#settingsScreen`，展示设置页面。
  - 首页金币资源框已改为可点击按钮 `#coinExchangeButton`，点击进入 `#exchangeScreen` 金币兑换页面。
  - 三个页面均使用组件化 HTML/CSS 布局，不再使用 `profile-fruit-forest.png`、`settings-fruit-forest.png`、`exchange-fruit-forest.png` 作为整页铺底。
  - 个人中心包含头像昵称、ID、当前进度、总星数、金币、已通关、三星关卡模块；相关数值由 `state.progress` 动态渲染。
  - 个人中心已完成 UI 精修：玩家信息框 `margin-top: 50px`，6 个数据框整体居中、内部内容上下居中，统计模块去除额外边框/填充，当前进度关卡条和总星数数字下移 `10px`，已通关/三星关卡显示为 `0关` 格式。
  - 个人中心底部“返回首页”按钮已移除，只保留左上角返回按钮。
  - 设置页包含音乐、音效、振动三个开关和清除进度按钮；开关目前为前端状态切换，清除进度按钮保留待接入。
  - 金币兑换页包含金币数量、体力 +30、提示 +1、洗牌 +1 三个兑换项；兑换按钮目前保留待接入实际扣费和确认流程。
  - 设置页和金币兑换页保留返回按钮和底部“返回首页”按钮；个人中心仅保留左上返回按钮。
  - `scripts/smoke-browser.mjs` 已新增断言：二级页必须由布局根节点渲染，若重新使用整页设计图会失败；个人中心还覆盖无滚动、返回按钮尺寸、标题文字位置、6 个数据框居中/无边框、统计字号、`0关` 后缀、玩家信息框 `margin-top: 50px`、底部返回按钮移除等回归检查。

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
- `src/progression.js`：关卡解锁、每关记录、星星统计、首次通关判断和金币奖励规则。
- `src/game-rules.js`：体力、星级、广告/购买占位规则。
- `src/engine.js`：连连看棋盘生成、固定随机种子、连线判断、洗牌和可消除对检查。
- `tests/progression.test.mjs`：章节、线性解锁、星星历史最高、首通金币和重复通关无金币测试。
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
- `src/assets/UI-ICON/profile-page/`：个人中心页面独立组件资产和页面布局参考图。
- `src/assets/UI-ICON/settings-page/`：设置页面独立组件资产和页面布局参考图。
- `src/assets/UI-ICON/exchange-page/`：金币兑换页面独立组件资产和页面布局参考图。
- `scripts/smoke-browser.mjs`：浏览器自动化验收脚本，使用固定 `boardSeed`，包含首页地图、首页背景无图片断言、移动端截图和 UI 断言。

## 4. 最近验证

最新验证命令均已通过：

```powershell
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/smoke-browser.mjs
```

验证结果：

- 单元测试：25/25 通过。
- 构建：成功输出到 `dist/`。
- 浏览器 smoke：使用固定 seed 通过，覆盖首页地图、首页背景无图片、个人中心/设置/金币兑换三个二级入口、二级页禁止整页设计图铺底、个人中心 UI 精修断言、游戏页、弹框、结果页、体力流程、首通金币、重复通关无金币文案和 0 道具不呼吸状态。
- 首页旧设计稿与导出脚本已删除，本条验证记录不再作为当前首页设计依据。
- 新版首页三主题设计稿已做本地文件检查：三张图片均存在，已移除截图外侧黑色阴影并保存为带透明通道的 PNG。
- 最新截图输出目录：`output/playwright/`。

重点截图：

- `output/playwright/home-map-mobile.png`
- `output/playwright/profile-mobile.png`
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
- 本轮提交备注：`demo1.0.9个人中心页面UI完成`。
- 本轮提交内容：完成个人中心页面 UI 精修；移除个人中心底部返回按钮并保留左上返回入口；调整玩家信息框、标题、6 个数据框、关卡条、统计数字和 `0关` 文案；新增/更新 smoke 断言防止个人中心 UI 细节回退；同步更新交接文档。

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

1. 以 `home-ui-design-v2-*.png` 三张新版设计稿为唯一首页视觉依据，先拆出背景、资源栏、章节标签、关卡节点、星级底座、锁、翻页按钮和底部开始按钮等可复用资源。
2. 首页实现时先固定三主题共同布局：个人/设置/资源卡/章节 tab/左右箭头/标题条/关卡路线/底部按钮同尺寸同坐标。
3. 接入 H5 首页时保留文字为 HTML/CSS 层，避免把中文文案烘焙进按钮图；截图式设计稿只作为视觉参考，不整张贴进游戏。
4. 首页 UI 落地后补 smoke 断言：检查三主题切换、资源卡间距、当前主题高亮、锁定章节、关卡星级底座、底部按钮位置。
5. 二级页后续替换正式图片/icon 时，保持当前 HTML/CSS 结构不变，只替换 `src/assets/UI-ICON/*-page/` 下的独立资源；个人中心当前版已按 demo1.0.9 收口，后续优先避免破坏已写入 smoke 的视觉约束。
6. 接入金币兑换实际逻辑：定义体力、提示、洗牌的兑换比例、金币扣除、资源增加和确认/失败提示。
7. 接入设置实际逻辑：音乐/音效/振动持久化，清除本地进度增加确认弹框后再执行。

## 8. 新线程接手提示

新线程开始时可直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，然后继续开发 Link Match 连连看项目。
```
