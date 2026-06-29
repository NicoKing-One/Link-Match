# Link Match 连连看

`Link Match 连连看` 是一款移动端竖屏优先的单机 H5 连连看小游戏。当前版本已经从早期三档难度 MVP 演进为三主题、90 关、体力/金币/星级进度、本地存档、二级页面、原创 WebAudio 音频和浏览器 smoke 验收闭环的可试玩版本。

## 当前产物

- `src/`：可运行的 H5 前端游戏，入口为 `src/index.html`，核心逻辑在 `src/game.js`。
- `src/assets/image/`：运行时图片统一平铺目录，首页、游戏页、弹框、结果页、关卡节点、连接线和图标资源都放在这一层。
- `tests/`：连线引擎、关卡进度、体力规则、音频设置、版本化清档等单元测试。
- `scripts/smoke-browser.mjs`：浏览器端完整 smoke，覆盖首页地图、主流程、二级页、弹框、奖励、复活、音频和移动端视觉断言。
- `docs/PRD.md`：当前产品需求文档。
- `docs/design.md`：当前界面与交互设计说明。
- `docs/project-handoff.md`：项目交接和当前进度来源。
- `docs/release-checklist.md`：微信/抖音小游戏发布检查清单。

## 当前游戏范围

- 首页包含个人中心、设置入口、体力/金币/星星资源栏、三主题章节切换、30 关地图路线和“开始闯关”按钮。
- 三个主题共 90 关：水果森林 1-30 关、糖果花园 31-60 关、果冻城堡 61-90 关。
- 每个主题内 1-10 关为 `6列 x 7行`，11-20 关为 `6列 x 8行`，21-30 关为 `6列 x 9行`。
- 初始只开放第 1 关，通关第 N 关后解锁第 N+1 关；首页返回时会同步定位到当前进度所在章节和关卡。
- 体力上限为 `60/60`，开始一关消耗 3 点；体力不再按分钟自然恢复，只在跨本地自然日时重置为满体力。
- 提示和洗牌当前默认均为 0，点击会弹出道具用完弹框；无可连接组合时提示玩家使用洗牌道具，不再自动洗牌。
- 首次通关获得金币和星级记录，重复挑战已通关关卡不再获得金币；星级只记录历史最高，不作为消耗资源。
- 首次通关成功页支持“双倍金币”激励广告入口；失败页支持一次“复活”激励广告入口；当前未开放的购买/商城入口统一提示“功能暂未开放”。
- 设置页提供音乐、音效、振动开关，开关仅在本次页面会话生效，刷新或重新打开后默认恢复开启。

## 本地运行

最简单的方式：双击项目根目录里的 `start-game.bat`，然后打开：

```text
http://127.0.0.1:4173
```

当前机器的普通 `node`/`npm` 不稳定，建议直接使用 Codex 自带 Node：

```powershell
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/dev-server.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/smoke-browser.mjs
```

启动开发服务后打开 `http://127.0.0.1:4173`。不要直接双击 `src/index.html`，浏览器会限制本地 ES module 加载。

如果系统已经配置好 Node/npm，也可以运行：

```powershell
npm test
npm run dev
npm run build
npm run smoke
```

## 本地数据

游戏使用 `localStorage` 保存本地进度和体力：

- `lianliankan.progress`：最高解锁关卡、金币、昵称、每关最佳分和最高星级。
- `lianliankan.stamina`：体力值、更新时间、当日广告领取次数。
- `lianliankan.dataResetVersion`：版本化清档标记，当前为 `2026-06-26-all-data-reset`。

音频设置为会话态，不再持久化到 `localStorage`；刷新后音乐、音效和振动默认恢复开启。

## 版本边界

当前版本仍为纯前端单机实现，不接后端、不接真实登录、不接真实支付。广告入口预留为 `window.linkMatchAds.showRewardedAd`，本地 smoke 可通过注入 hook 验证奖励/复活流程。后续版本可继续接入云存档、排行榜、正式广告、商城/头衔闭环和平台能力。

## 素材规则

本项目遵守 `AGENTS.md`：所有项目所需要生成的图片都要用 `gpt-image-2` 模型生成。工具和关卡相关图片应使用独立、紧贴可见内容裁切的 PNG，不从大图切 sprite，不保留透明空白边。
