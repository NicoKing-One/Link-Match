# Link Match 连连看项目交接总结

## 1. 项目定位

项目名：Link Match 连连看  
路径：`D:\工作文件\游戏\连连看`  
类型：移动端竖屏优先的 H5 单机连连看 MVP  
当前阶段：`demo1.0.2--布局修改` 已完成本地开发，进入“参考图布局对齐、试玩验收、后续完整 UI 组件重绘”阶段

## 2. 当前开发进度

一句话状态：**H5 单机 demo1.0.2 玩法和经济系统已具备；本轮已换成水果糖果风资源，并按参考图重新调整游戏主页面布局。下一步应该继续把 HUD、道具按钮、弹窗和结算页做成同一套完整 UI。**

已完成：

- `docs/0-to-1-workflow.md`：保存完整“想法到上线”的流程文档。
- `docs/PRD.md`：保存 MVP 产品需求。
- `docs/design.md`：保存当前 UI 和交互设计说明。
- `docs/release-checklist.md`：保存微信/抖音发布检查清单。
- H5 单机游戏：可以开始、消除、提示、洗牌、暂停、返回主页确认、重新开始、结算。
- 核心规则：相同图案、最多两次转弯、允许外侧绕线。
- 错误提示：错误匹配后有文字提示，两个选中方块会抖动，并清空选中状态。
- 布局修复：后期剩余方块不会被拉长。
- 道具耗尽弹框：提示/洗牌用完后，再点会弹出看广告获取或购买的占位弹框。
- 离局弹框：右上主页按钮会先弹出确认框，可选择返回首页、重新开始或继续游戏。
- 星级结算：通关成功后展示 1-3 颗星，星星按剩余时间比例计算。
- 体力系统：
  - 初始体力 `50/50`。
  - 开始一关消耗 3 点体力。
  - 低于 50 时每 3 分钟自然恢复 1 点。
  - 看广告获取体力：每次 +30，最多 3 次。
  - 购买体力占位：点击后直接 +30，不占广告领取次数。
  - 广告/购买可让体力超过 50，例如 `80/50`。
  - 次日凌晨按本地日期自动刷新为 `50/50`，广告领取次数重置。
  - 首页、游戏页、结算页均展示体力和倒计时。
- 自动化验证：规则单测、构建、浏览器 smoke 均可运行。
- Git：本地仓库已初始化，远程仓库已配置并推送到 GitHub。
- 本轮 UI/布局修改：
  - 主题方向确定为水果糖果风，参考图保存在 `docs/fea087d1-5071-4155-9224-59bc0ea52572.jpeg`，视觉参考保存在 `docs/visual-references/jelly-fruit-direction.png`。
  - 生成并接入水果糖果背景图 `src/assets/jelly-fruit/page-bg.png`。
  - 生成并处理水果图标资源，图标位于 `src/assets/jelly-fruit/tiles/`，原始图集保存在 `src/assets/jelly-fruit/tile-sheet.png`。
  - 棋盘方块换成浅蓝果冻底，水果图标约占格子 90%，居中显示。
  - “轻松”关卡从 6x6 调整为 8x8，共 64 个格子。
  - 游戏主页面按参考图调整为三段：顶部信息面板、棋盘区域、底部道具栏。
  - 顶部信息面板包含关卡标题、首页 icon、时间/剩余/得分/体力、最佳分/当前分/星星。
  - 棋盘容器顶部空白已去掉，提示 toast 改成浮层，不占位且不拦截点击。
  - 连线从旧折线改成圆角柔和线条，浏览器 smoke 已增加连线截图和断言。
  - 修复体力 bug：满体力但恢复时间戳过旧时，开局扣体力后不会被立即恢复回 50；开局扣体力会刷新恢复计时起点。

当前未做：

- 正式美术资源、背景、图标、音效。
- 微信/抖音小游戏适配工程。
- 后端登录、云存档、排行榜、每日挑战。
- 真实广告 SDK、真实支付、皮肤系统。
- 真实平台审核资料。
- 正式隐私政策、用户协议、广告/支付合规文案。

下次如果问“现在到什么进度了”，回答应是：

```text
当前完成了 H5 单机 demo1.0.2，并完成水果糖果风主游戏页布局修改。核心玩法、体力、星级结算、广告/购买占位、8x8 轻松关卡、主游戏页参考图布局均可本地运行和自动测试。下一步建议继续把 HUD 图标、道具按钮、弹窗、成功/失败页统一成同一套正式 UI。
```

## 3. 当前功能

- 首页：游戏说明、三档难度选择、体力显示、体力倒计时、获取体力、开始游戏。
- 游戏页：顶部信息面板、关卡标题、首页 icon、倒计时、剩余数量、得分、体力、体力倒计时、最佳分、当前分、星星、棋盘。
- 操作：提示、洗牌、暂停、右上主页确认、弹框内重新开始。
- 匹配规则：相同图案，最多两次转弯，允许棋盘外侧绕线。
- 错误反馈：
  - 两个图案不同：提示“不能连接：两个图案不一样”。
  - 图案相同但被挡住：提示“不能连接：中间被挡住了”。
  - 错误后两个方块会抖动，并失去选中状态，可重新选择。
- 道具反馈：
  - 提示/洗牌次数用完后，再次点击弹出看广告或购买道具占位弹框。
- 体力系统：
  - 开始一关扣 3 点体力。
  - 体力不足时弹出“看广告获取体力 / 购买体力 / 稍后再说”。
  - 看广告获取体力每次 +30，最多 3 次。
  - 购买体力占位每次 +30。
  - 获取/购买可突破 50 上限，次日凌晨刷新回 50。
- 结算：
  - 通关成功：展示剩余时间、得分、最佳分、1-3 星。
  - 挑战失败：标题显示“挑战失败”，保留再玩一局和返回首页。
- 布局修复：消除到后期方块保持接近正方形，不会被拉长。
- 本地最高分：按难度保存到 `localStorage`。
- 水果糖果风主棋盘：
  - 背景图使用 `src/assets/jelly-fruit/page-bg.png`。
  - 方块为浅蓝果冻底。
  - 水果图标约 90% 尺寸，居中显示。
  - 当前轻松模式为 8x8、64 格。
  - 顶部信息面板和底部道具栏位置按参考图重新排版。

## 4. 关键文件

- `docs/0-to-1-workflow.md`：完整项目流程文档，记录想法、UI、PRD、开发、测试、上线、发布平台的顺序。
- `src/index.html`：页面结构。
- `src/styles.css`：移动端 UI 样式、棋盘布局、提示样式。
- `src/game.js`：游戏状态、点击逻辑、提示/洗牌/暂停/主页/结算。
- `src/game-rules.js`：星级、体力恢复、体力消耗、广告/购买体力、次日刷新等纯规则。
- `src/engine.js`：核心连线规则、棋盘生成、查找可消除配对、洗牌。
- `src/assets/jelly-fruit/page-bg.png`：水果糖果风页面背景。
- `src/assets/jelly-fruit/tile-sheet.png`：水果图标原始图集。
- `src/assets/jelly-fruit/tiles/`：当前棋盘使用的水果图标。
- `docs/visual-references/jelly-fruit-direction.png`：水果糖果风方向参考图。
- `docs/fea087d1-5071-4155-9224-59bc0ea52572.jpeg`：用户提供的游戏主界面布局参考图。
- `design-qa.md`：当前设计 QA 记录。
- `tests/engine.test.mjs`：规则层单元测试。
- `tests/game-rules.test.mjs`：星级和体力规则单元测试。
- `scripts/dev-server.mjs`：本地静态服务。
- `scripts/build.mjs`：构建到 `dist/`。
- `scripts/smoke-browser.mjs`：浏览器自动化验收。
- `docs/PRD.md`：产品需求。
- `docs/design.md`：设计说明。
- `docs/release-checklist.md`：发布检查清单。
- `AGENTS.md`：项目规则，所有生成图片必须使用 `gpt-image-2`。

## 5. 运行方式

最简单：双击 `start-game.bat`，然后打开：

```text
http://127.0.0.1:4173
```

PowerShell 方式：

```powershell
Set-Location 'D:\工作文件\游戏\连连看'
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\dev-server.mjs
```

不要直接双击 `src/index.html`，浏览器会限制本地 ES module 加载。

## 6. 验证命令

```powershell
Set-Location 'D:\工作文件\游戏\连连看'
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/smoke-browser.mjs
```

最近一次验证结果：

- 单元测试：15/15 通过。
- 构建：成功输出到 `dist/`。
- 浏览器测试：通过。
- 浏览器 smoke：确认轻松模式渲染 8x8、64 个水果格子。
- 方块比例：消除前后 `1.000`，保持正方形。
- 体力回归：旧时间戳满体力开局后正确显示 `47/50`，不会立即恢复到 `50/50`。
- 视觉回归：水果图标约占格子 90%，关卡信息、最佳分/当前分/星星、圆角连线均有浏览器断言。

## 7. Git 状态

Git 可执行文件位置：

```text
D:\Git\Git\cmd\git.exe
```

当前仓库：

- 分支：`main`
- 初始提交：`2463416 Initial Link Match MVP`
- 交接文档提交：`6d15640 Add project handoff summary`
- demo1.0 提交：`1fc1451 demo1.0完成`
- demo1.0.2 远程提交：`965ae0e demo1.0.2`
- demo1.0.2 交接文档提交：`9bd1edb Update project handoff for demo1.0.2`
- 本轮准备提交备注：`demo1.0.2--布局修改`
- 远程仓库：`https://github.com/NicoKing-One/Link-Match.git`

常用命令：

```powershell
& 'D:\Git\Git\cmd\git.exe' status
& 'D:\Git\Git\cmd\git.exe' log --oneline --decorate -3
```

## 8. 下一个线程建议先做什么

新线程开始时，可以直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，
然后继续开发 Link Match 连连看项目。
```

推荐后续任务顺序：

1. 继续按参考图统一 UI：HUD 图标、顶部面板装饰、底部道具大圆按钮、弹窗、成功/失败页。
2. 做一次完整试玩，记录 8x8 轻松模式是否太密、时间是否合适、星级是否合理。
3. 调整关卡节奏、难度、时间、星级阈值、体力消耗和体力恢复节奏。
4. 补正式音效和动效。
5. 再考虑微信/抖音小游戏适配，以及真实广告 SDK/支付接入。
6. V2 再接后端：登录、云存档、排行榜、每日挑战。

更具体的下一步：

- 先玩 3 局：轻松、标准、挑战各 1 局。
- 记录是否太难、太简单、时间是否合适、星级是否合理、提示/洗牌次数是否合适。
- 额外测试体力流程：
  - 50 体力连续开局是否太宽松。
  - 每局 3 点体力是否合理。
  - 3 分钟恢复 1 点是否太慢或太快。
  - 广告 +30、最多 3 次是否需要调整。
  - 次日凌晨刷新回 50 是否符合预期。
- 决定美术方向：水果、动物、宝石、国潮、节日主题或其他。
- 再让我基于反馈修改 `LEVELS` 难度配置、星级阈值、体力参数和视觉风格。
