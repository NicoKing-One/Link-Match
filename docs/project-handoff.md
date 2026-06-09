# Link Match 连连看项目交接总结

## 1. 项目定位

项目名：Link Match 连连看  
路径：`D:\工作文件\游戏\连连看`  
类型：移动端竖屏优先的 H5 单机连连看 MVP  
当前阶段：单机 MVP 已完成，进入“试玩调参与美术方向”阶段

## 2. 当前开发进度

一句话状态：**单机版本已经可玩，基础交互问题已修复，下一步应该做试玩反馈、关卡调参和正式美术方向。**

已完成：

- `docs/0-to-1-workflow.md`：保存完整“想法到上线”的流程文档。
- `docs/PRD.md`：保存 MVP 产品需求。
- `docs/design.md`：保存当前 UI 和交互设计说明。
- `docs/release-checklist.md`：保存微信/抖音发布检查清单。
- H5 单机游戏：可以开始、消除、提示、洗牌、暂停、重开、返回主页、结算。
- 核心规则：相同图案、最多两次转弯、允许外侧绕线。
- 错误提示：错误匹配后有文字提示，并清空选中状态。
- 布局修复：后期剩余方块不会被拉长。
- 自动化验证：规则单测、构建、浏览器 smoke 均可运行。
- Git：本地仓库已初始化并提交。

当前未做：

- 正式美术资源、背景、图标、音效。
- 微信/抖音小游戏适配工程。
- 后端登录、云存档、排行榜、每日挑战。
- 广告、支付、皮肤系统。
- 真实平台审核资料。

下次如果问“现在到什么进度了”，回答应是：

```text
当前完成了 H5 单机 MVP，可本地运行和测试。下一步建议先试玩记录体验问题，再做难度/计分调参和美术方向；不要急着接后端。
```

## 3. 当前功能

- 首页：游戏说明、三档难度选择、开始游戏。
- 游戏页：倒计时、剩余数量、得分、最佳分、棋盘。
- 操作：提示、洗牌、暂停、重开、返回主页。
- 匹配规则：相同图案，最多两次转弯，允许棋盘外侧绕线。
- 错误反馈：
  - 两个图案不同：提示“不能连接：两个图案不一样”。
  - 图案相同但被挡住：提示“不能连接：中间被挡住了”。
  - 错误后两个方块都会失去选中状态，可重新选择。
- 布局修复：消除到后期方块保持接近正方形，不会被拉长。
- 本地最高分：按难度保存到 `localStorage`。

## 4. 关键文件

- `docs/0-to-1-workflow.md`：完整项目流程文档，记录想法、UI、PRD、开发、测试、上线、发布平台的顺序。
- `src/index.html`：页面结构。
- `src/styles.css`：移动端 UI 样式、棋盘布局、提示样式。
- `src/game.js`：游戏状态、点击逻辑、提示/洗牌/暂停/主页/结算。
- `src/engine.js`：核心连线规则、棋盘生成、查找可消除配对、洗牌。
- `tests/engine.test.mjs`：规则层单元测试。
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

- 规则测试：6/6 通过。
- 构建：成功输出到 `dist/`。
- 浏览器测试：通过。
- 方块比例：消除前后约 `1.003`，保持正方形。

## 7. Git 状态

Git 可执行文件位置：

```text
D:\Git\Git\cmd\git.exe
```

当前仓库：

- 分支：`main`
- 初始提交：`2463416 Initial Link Match MVP`
- 交接文档提交：`6d15640 Add project handoff summary`

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

1. 做一次完整试玩，记录关卡体验问题。
2. 优化关卡节奏、难度和计分规则。
3. 设计正式美术风格；如果生成图片，必须使用 `gpt-image-2`。
4. 再考虑微信/抖音小游戏适配。
5. V2 再接后端：登录、云存档、排行榜、每日挑战。

更具体的下一步：

- 先玩 3 局：轻松、标准、挑战各 1 局。
- 记录是否太难、太简单、时间是否合适、提示/洗牌次数是否合适。
- 决定美术方向：水果、动物、宝石、国潮、节日主题或其他。
- 再让我基于反馈修改 `LEVELS` 难度配置和视觉风格。
