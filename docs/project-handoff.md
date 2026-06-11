# Link Match 连连看项目交接文档

更新时间：2026-06-11

## 1. 项目定位

- 项目名称：Link Match 连连看
- 项目路径：`D:\工作文件\游戏\连连看`
- 项目类型：移动端竖屏 H5 单机连连看 MVP
- 当前阶段：主游戏页和全部核心弹框 UI 已按水果糖果果冻风完成一轮高保真对齐，进入细节验收、试玩调参和平台适配前准备阶段。

## 2. 当前进度

当前已完成 H5 单机 demo 的核心玩法、体力系统、道具占位、结算流程和移动端 UI。最新一轮重点完成了所有弹框和结果页的糖果果冻风统一设计，不再只做主游戏页。

已完成内容：

- 主游戏页面：
  - 移动端竖屏布局，页面禁止滚动。
  - 顶部 HUD、棋盘区域、底部工具栏三段式布局。
  - 顶部显示关卡、时间、剩余、得分、体力。
  - 已移除主页顶部“最佳分 + 星星”横条。
  - 底部工具栏已去掉绿色虚线分隔线。
  - 提示次数为 0 时，提示按钮图标有循环放大缩小动画，引导用户看广告获取道具。

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

- 玩法和系统：
  - 棋盘核心规则可用：相同图案、最多两次转弯、允许棋盘外侧绕线。
  - 轻松模式为 6x7，共 42 个格子。
  - 提示、洗牌、暂停、返回首页确认、重新开始、再玩一局流程可用。
  - 错误匹配会提示并抖动选中方块。
  - 无可连接组合时不再自动洗牌，而是提示玩家使用洗牌道具。
  - 星级结算按剩余时间比例计算。
  - 体力系统可用：开局扣 3 点，低于上限时自然恢复，看广告和购买均为占位流程。

## 3. 关键文件

- `src/index.html`：页面结构、弹框结构、结果页结构。
- `src/styles.css`：移动端布局、果冻糖果风 UI、弹框、按钮、胶囊标题、滚动锁定。
- `src/game.js`：游戏状态、点击逻辑、弹框流程、关卡标题同步、道具和结算逻辑。
- `src/game-rules.js`：体力、星级、广告/购买占位规则。
- `src/engine.js`：连连看棋盘生成、连线判断、洗牌和可消除对检查。
- `src/assets/ui-cut/modal-card-bg.png`：弹框/结果页背景切图。
- `src/assets/ui-cut/modal-button-primary.png`：主按钮切图。
- `src/assets/ui-cut/modal-button-secondary.png`：副按钮切图。
- `docs/ui-design-drafts/mobile-modal-result-design.png`：移动端弹框/结果页设计稿。
- `scripts/smoke-browser.mjs`：浏览器自动化验收脚本，包含移动端截图和 UI 断言。

## 4. 最近验证

最新验证命令均已通过：

```powershell
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/smoke-browser.mjs
```

验证结果：

- 单元测试：16/16 通过。
- 构建：成功输出到 `dist/`。
- 浏览器 smoke：通过。
- 最新截图输出目录：`output/playwright/`。

重点截图：

- `output/playwright/smoke-mobile.png`
- `output/playwright/result-stars-mobile.png`
- `output/playwright/pause-modal-mobile.png`
- `output/playwright/tool-modal-mobile.png`
- `output/playwright/exit-modal-mobile.png`
- `output/playwright/stamina-modal-mobile.png`

## 5. 当前 Git 状态

- 当前分支：`main`
- 远程仓库：`https://github.com/NicoKing-One/Link-Match.git`
- 本次待提交内容：
  - 全部弹框和结果页 UI 对齐。
  - 新增弹框背景、按钮切图和移动端弹框设计稿。
  - 首页最佳分横条移除。
  - 弹框顶部胶囊改为动态关卡文字。
  - smoke 自动化补充移动端弹框、结果页、按钮、滚动锁定和胶囊位置断言。

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

1. 真机或移动端模拟器完整试玩 3-5 局，确认棋盘密度、时间、星级和道具次数是否合理。
2. 继续微调弹框内部间距，尤其是标题、圆形图标、按钮组之间的垂直节奏。
3. 检查所有动态中文是否需要统一从乱码历史状态恢复为正常中文源码。
4. 增加按钮点击动效、消除动效、通关动效和音效。
5. 做微信/抖音小游戏适配工程前，先确认当前 H5 版本体验稳定。

## 8. 新线程接手提示

新线程开始时可直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，然后继续开发 Link Match 连连看项目。
```
