# Link Match 连连看

这是一个从零启动的连连看游戏 MVP：移动端竖屏、单机玩法、倒计时、提示、洗牌、暂停、结算、本地最高分。

## 当前产物

- `AGENTS.md`：项目级代理规则，要求生成图片时使用 `gpt-image-2`。
- `src/`：可运行的 H5 前端游戏。
- `tests/`：连线规则、棋盘生成、可用步和洗牌的自动化测试。
- `docs/PRD.md`：产品需求文档，给后续开发继续使用。
- `docs/design.md`：界面和交互设计说明。
- `docs/release-checklist.md`：微信/抖音小游戏发布检查清单。

## 本地运行

最简单的方式：双击项目根目录里的 `start-game.bat`，然后打开 `http://127.0.0.1:4173`。

当前机器的普通 `node`/`npm` 不稳定，建议直接使用 Codex 自带 Node：

```powershell
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/dev-server.mjs
& 'C:\Users\youzi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build.mjs
```

启动开发服务后打开 `http://127.0.0.1:4173`。不要直接双击 `index.html`，浏览器会限制本地 ES module 加载。

如果你的系统已经配置好 Node/npm，也可以运行：

```powershell
npm test
npm run dev
npm run build
```

## Git 状态

项目会初始化为本地 Git 仓库。若 PowerShell 提示找不到 `git`，说明 Windows 的 Git 命令行还没有安装或没有加入 PATH；安装后可以在项目根目录运行：

```powershell
git status
git log --oneline
```

## 版本边界

V1 不接后端，只用 `localStorage` 保存各难度最佳分数。V2 再接入登录、云存档、排行榜、每日挑战、广告奖励和皮肤系统。

## 素材规则

本项目遵守 `AGENTS.md`：所有项目所需要生成的图片都要用 `gpt-image-2` 模型生成。当前 MVP 没有生成图片文件，图案由 CSS 和字符符号实现。
