# Link Match 连连看项目交接文档

更新时间：2026-06-13

## 1. 项目定位

- 项目名称：Link Match 连连看
- 项目路径：`D:\工作文件\游戏\连连看`
- 项目类型：移动端竖屏 H5 单机连连看 MVP
- 当前阶段：`demo1.0.7--金币系统优化` 已完成。项目在 `demo1.0.6-UI布局更新` 基础上完成金币经济规则、重复通关结算文案、初始数据重置和道具 0 状态处理。主游戏页和核心弹框 UI 保持水果糖果果冻风，首页已接入 90 关章节地图、线性解锁、星星记录和金币资源。

## 2. 当前进度

当前已完成 H5 单机 demo 的核心玩法、体力系统、道具占位、结算流程、移动端游戏 UI、第一版章节闯关首页布局、`demo1.0.6-UI布局更新`，以及 `demo1.0.7--金币系统优化`。最新一轮重点调整了金币获得规则、重复关卡通关文案、清档后初始状态和 0 道具按钮表现。

已完成内容：

- 首页和章节关卡：
  - 首页顶部保留个人中心、设置、体力、金币、星星入口，已删除 `Link Match / 连连看` 大标题。
  - 首页改为可纵向滑动的蜿蜒小路关卡地图，当前视口展示约 10 个关卡点。
  - 关卡顺序为自下而上：第 01 关在底部，向上滑动查看后续关卡。
  - 主题章节为水果森林 1-30、糖果花园 31-60、果冻城堡 61-90。
  - 支持左右切换主题；糖果花园需通关第 30 关后进入，果冻城堡需通关第 60 关后进入。
  - 首页底部居中显示“开始闯关/继续闯关”按钮，按钮宽度为屏幕宽度一半，底部 `padding-bottom: 30px`。
  - 首页不再显示右侧“获取体力/已领取完”按钮，也不保留底部 4 个 tab。
  - 最新首页截图：`output/playwright/home-map-mobile.png`。

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

- `src/index.html`：首页地图结构、游戏页结构、弹框结构、结果页结构。
- `src/styles.css`：移动端布局、首页地图、果冻糖果风 UI、弹框、按钮、胶囊标题、滚动锁定。
- `src/game.js`：游戏状态、首页地图渲染、点击逻辑、弹框流程、关卡标题同步、清档基线、道具和结算逻辑。
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
- `scripts/smoke-browser.mjs`：浏览器自动化验收脚本，使用固定 `boardSeed`，包含首页地图、移动端截图和 UI 断言。

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
- 浏览器 smoke：使用固定 seed 通过，覆盖首页地图、游戏页、弹框、结果页、体力流程、首通金币、重复通关无金币文案和 0 道具不呼吸状态。
- 最新截图输出目录：`output/playwright/`。

重点截图：

- `output/playwright/smoke-mobile.png`
- `output/playwright/home-map-mobile.png`
- `output/playwright/result-stars-mobile.png`
- `output/playwright/result-failure-mobile.png`
- `output/playwright/pause-modal-mobile.png`
- `output/playwright/tool-modal-mobile.png`
- `output/playwright/exit-modal-mobile.png`
- `output/playwright/stamina-modal-mobile.png`

## 5. 当前 Git 状态

- 当前分支：`main`
- 远程仓库：`https://github.com/NicoKing-One/Link-Match.git`
- 本轮提交备注：`demo1.0.7--金币系统优化`。
- 本轮提交内容：金币系统改为每主题 100 金币首通总量、重复通关不再发金币、结果页重复关卡文案、清档基线、道具初始 0、移除 0 道具呼吸动画、相关单测和 smoke 断言、交接文档更新。

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

1. 开始做个人中心页面：头像昵称占位、当前进度、总星数、金币、已通关数、三星关卡数。
2. 做金币兑换资源入口：先定义金币兑换体力、提示、洗牌的兑换比例和确认弹框。
3. 做设置入口：音效/音乐开关、振动开关、清除本地进度的确认弹框。
4. 继续细化首页地图视觉：关卡点状态、当前关动效、已通关星星表现、锁定主题提示。
5. 调整 90 关难度曲线，试玩前 10-15 关确认时间、棋盘密度、提示和洗牌次数。
6. 增加按钮点击动效、消除动效、通关动效和音效。
7. 做微信/抖音小游戏适配工程前，先确认当前 H5 版本体验稳定。

## 8. 新线程接手提示

新线程开始时可直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，然后继续开发 Link Match 连连看项目。
```
