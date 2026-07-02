# Link Match 连连看项目交接文档

更新时间：2026-07-02

## 1. 项目定位

- 项目名称：Link Match 连连看
- 项目路径：`E:\VIGORPLAY\游戏\Link-Match`
- 项目类型：移动端竖屏 H5 单机连连看 MVP
- 当前阶段：`1.2.9优化` 提交收口：窄屏设置页、游戏棋盘适配、棋子视觉比例和后台音乐生命周期已完成验证、本地提交和远程 `main` 推送。

## 2. 当前进度

- 2026-07-02 `1.2.9优化`：按本轮提交备注收口当前工作区优化。设置页改为响应式三列 grid，面板、标题、返回按钮、开关和图标使用容器宽度单位适配窄屏，smoke 新增 360 宽视口检查，避免 OPPO 类窄屏出现开关溢出或横向滚动。游戏页新增 `src/game-layout.js`，根据顶部 HUD、底部工具栏和可用高度动态计算棋盘外框宽度，窗口 resize、开局和复活回到游戏页时都会重新居中收口棋盘，避免宽屏短高设备挤压底部工具栏；棋子图案显示比例同步放大到 185%。音频控制新增页面隐藏、卸载和 freeze 生命周期监听，切后台或离开页面时停止本地背景音乐。新增布局、样式、视觉和音频生命周期单测，`scripts/smoke-browser.mjs` 已同步覆盖窄屏设置页、棋盘居中和棋子视觉比例。本轮已通过 57 条单测、构建和完整 smoke；图片资源检查因当前机器 `python.exe` 无法访问且没有 `py` 启动器，本轮未重跑。
- 2026-07-01 `1.2.9全局优化`：按本轮提交备注收口当前工作区全局优化。背景音乐从程序化 WebAudio 循环切换为随包本地 `src/assets/audio/background_video.mp3`，`src/audio-settings.js` 统一维护媒体 BGM 与 WebAudio 音效控制，启动时进行静音 warmup，首次播放被自动播放策略拦截后保留后续点击重试；`src/game.js` 同步改为只有播放成功才标记启动音频已解锁。`scripts/smoke-browser.mjs` 与 `tests/audio-settings.test.mjs` 已覆盖本地 BGM、播放拒绝重试、音乐/音效开关组合和启动主流程；README、PRD 与 handoff 同步当前音频口径。新增 `src/assets/audio/` 下当前 MP3、授权文件和说明，并删除未被运行时代码引用的旧 WAV 候选资源；运行时资源复扫为 89 个、未引用 0 个。已执行 50 条单测、首页关卡资源检查、构建和完整 smoke，均通过；`dist/`、`output/` 已按临时产物清理。
- 2026-07-01 `1.2.8抖音上架`：按本轮提交备注收口抖音小游戏上架准备。新增 `docs/douyin-minigame-integration-plan.md`，整理抖音开放平台入驻、主体认证、创建小游戏、基础信息审核、必接能力、备案申报、版本提审、发布运营配置与性能优化要点；同时结合当前 H5 单机项目现状，明确推荐路线为先做“抖音小游戏接入 Spike + 最小可预览包”，暂缓头衔系统、商城、内购和普通 UI 微调。下一轮建议以 `1.2.10抖音小游戏接入Spike` 开始，优先新增抖音小游戏工程壳、验证当前 DOM/CSS/H5 架构在开发者工具中的兼容性、接入平台存储/生命周期/侧边栏复访等最小能力。
- 2026-07-01 `1.2.8优化`：按本轮提交备注收口当前工作区累计优化。README 与 PRD 已同步当前实现，三档关卡统一使用 `6列 x 7行` 棋盘，normal/hard 继续通过图案种类和时间递减体现难度；首页与游戏页背景资源改为按章节主题切换，糖果/水晶完整背景和章节箭头使用新的运行时图片资源，favicon 迁移到 `src/assets/image/favicon.ico`。正式进度口径继续锁定为新档仅第 1 关可挑战，版本化清档标记更新为 `2026-07-01-lock-all-levels-reset`。`src/engine.js` 已移除旧 demo `LEVELS` 常量，单测改从 `src/levels.js` 读取正式 90 关配置，避免双关卡数据源误用。WebAudio 启动逻辑减少首次用户手势前的 suspended 上下文 BGM 调度，保留首次触摸/点击后的解锁与恢复路径。`scripts/smoke-browser.mjs` 已同步覆盖主题背景、主题箭头、锁关数量、favicon 新路径、统一棋盘布局、启动音频和主流程回归；`测试bug.txt` 已同步本轮已处理项和剩余真机/平台验证风险。
- 2026-06-29 `1.2.7 UI优化`：按本轮提交备注收口当前工作区累计 UI 与真机预览改动。关卡 normal/hard 继续保留时间和图案数差异，但棋盘布局统一回 easy 的 `6列 x 7行`，避免高行数在移动端压缩棋子和挤压底部工具栏；棋子点击新增按压反馈，洗牌道具接入“棋子四散 - 中途换新棋盘 - 新棋盘回拢”的动画，保证动画结束后棋盘不再突变。道具用完弹框的“看广告获取”已接入真实奖励占位流程，广告完成后可给提示/洗牌各 +1，广告未完成不发奖励。真机预览开发服务新增端口占用自动顺延，避免 `4173` 被占用时启动失败。当前真实设备体力为 0 的旧存档会通过一次性版本标记补满到 `60/60`，不清空关卡进度，非 0 体力存档不受影响。`scripts/smoke-browser.mjs` 已同步覆盖棋子按压反馈、三档关卡统一棋盘布局、道具广告奖励、洗牌动画中途换盘且收尾不突变、金币文本位置、真机预览端口回退等回归断言。
- 2026-06-29 `1.2.6bug修复`：按本轮提交备注收口当前工作区累计改动，覆盖数据重置、音频设置与音效体验、未开放功能统一文案、真机预览地址、首页主题资源预加载、体力弹窗文案和配套文档同步。提交前已重新执行全量单测、首页关卡资源检查、构建和完整 smoke；`dist/`、`output/` 仍作为临时验证产物处理，验证后已清理，不提交到仓库。本轮改动已完成本地提交并推送到远程 `main`。
- 2026-06-26 `1.2.13未开放功能文案统一`：检查当前可点击入口，将未开发/占位流程文案统一为“功能暂未开放”。`src/game.js` 新增 `UNAVAILABLE_FEATURE_MESSAGE`，道具弹框的“看广告获取/购买”、体力购买、失败结果页购买道具均复用同一文案；`src/index.html` 的首页兑换入口弹框标题同步改为“功能暂未开放”。`scripts/smoke-browser.mjs` 已新增和更新回归断言，覆盖首页兑换入口、道具广告/购买、体力购买、结果页购买道具的统一提示。
- 2026-06-26 `1.2.12刷新后音乐解锁修复`：修复关闭音乐后刷新页面，设置已恢复开启但真机需点击首页按钮才听到音乐的体验问题。根因是刷新后的浏览器/WebView 可能因自动播放策略挂起 WebAudio；`src/game.js` 现将启动音频解锁事件从 `pointerdown/keydown` 扩展为 `pointerdown/touchstart/mousedown/click/keydown`，并增加一次性保护，保证首次触摸首页空白处也能解锁音乐，不必依赖某个按钮点击副作用。`scripts/smoke-browser.mjs` 已新增“关闭音乐 -> 刷新 -> 开关恢复开启 -> 首次 touchstart 解锁背景音乐”的回归断言；`tests/audio-settings.test.mjs` 同步当前背景音乐/失败音效口径。本轮已通过 37 条单测、构建和完整 smoke。
- 2026-06-26 `1.2.11音频体验收口`：按反馈继续收口 `src/audio-settings.js` 和 `src/game.js`。所有按钮类反馈统一为单个简洁 `button` 短音，不再为返回首页、提示、洗牌、暂停等按钮分别使用刻意音效；成功/失败仍保留独立情绪反馈。背景音乐重新换成更稀疏柔和的原创 WebAudio 循环，并在小游戏打开到首页时立即尝试启动，移动端若受浏览器自动播放限制，会在首次用户点击/按键时重新解锁播放。设置页音乐/音效/振动开关改为本次页面会话状态，不再写入 `localStorage`；关闭小游戏或刷新后默认恢复为开启。本轮已通过 35 条单测、构建和完整 smoke。
- 2026-06-26 `1.2.10休闲音效重制`：重写 `src/audio-settings.js` 的原创程序化 WebAudio 音效表和背景音乐乐句，整体改为更适合休闲连连看的轻快三角波/正弦波短音。游戏页返回首页入口新增独立 `home` 音效，不再复用暂停音；提示音改为明亮三连闪，洗牌音改为上扬滑音，暂停/恢复改为柔和下行/上行短句；成功音效改为更欢快的上行旋律，失败音效改为更低落的下行尾音。`src/game.js` 已将游戏页左上返回首页按钮接入 `home` 音效。本轮已通过 33 条单测、构建和完整 smoke。
- 2026-06-26 `1.2.9设置实际逻辑`：新增 `src/audio-settings.js` 统一维护 `lianliankan.audioSettings`，音乐/音效/振动默认开启，设置页三个开关会按本地存档初始化、点击后写回 `localStorage`，刷新后保持状态。`src/game.js` 已接入原创程序化 WebAudio：开局启动轻量背景音乐，选择、匹配、错误匹配、提示、洗牌、暂停/恢复、成功/失败、奖励、阻塞入口等流程触发对应音效；关闭音乐会立即停止音乐，关闭音效后不会创建/播放音效，振动开关控制错误匹配、体力不足、锁关等反馈的 `navigator.vibrate`。新增 `tests/audio-settings.test.mjs` 覆盖设置规范化、持久化和音频控制器开关行为；`scripts/smoke-browser.mjs` 新增设置刷新持久化、关闭时不创建音频、重新开启后触发 WebAudio 的浏览器回归断言。本轮已通过 33 条单测、构建和完整 smoke。
- 2026-06-26 `1.2.8所有数据重置`：新增 `src/storage-reset.js` 统一维护 `CURRENT_DATA_RESET_VERSION`、进度/体力 storage key 和版本化清档逻辑；`src/game.js` 在读取 `localStorage` 存档前调用 `applyVersionedDataReset(localStorage)`，只要本地 `lianliankan.dataResetVersion` 不是 `2026-06-26-all-data-reset`，就覆盖 `lianliankan.progress` 为新档、覆盖 `lianliankan.stamina` 为满体力 `60/60` 并写入新版本号。首页“清空数据”测试按钮仍不恢复。新增 `tests/storage-reset.test.mjs` 覆盖旧版本全量清档和同版本保留数据；`scripts/smoke-browser.mjs` 已从共享版本常量同步测试预置数据，并新增旧版本启动后清档的浏览器断言。
- 2026-06-26 `1.2.5首页优化`：首页体力、金币、星星资源框统一为两列布局，左侧 icon 区占 40%、右侧文案区占 60%；icon 尺寸为 `8cqw` 并右贴 icon 区边界，文案字号为 `4cqw` 并左贴文案区且保留 `margin-left: 1cqw`。体力默认上限从 `50/50` 调整为 `60/60`，开局扣 3 点后显示 `57/60`；体力不再按 3 分钟自然恢复，仅跨本地自然日重置为满体力并清零广告领取次数。个人中心昵称改为从进度数据读取，新档会随机生成 6 字以内昵称，旧档/异常昵称会规范化并回写。`tests/game-rules.test.mjs`、`tests/progression.test.mjs` 和 `scripts/smoke-browser.mjs` 已同步覆盖体力 60 基线、首页资源框真实几何布局、个人中心昵称持久化和 6 字限制。
- 2026-06-26 `1.2.7体力显示与恢复逻辑调整`：首页体力资源卡移除 `.staminaCountdown` 小字，只保留体力图标和 `staminaText` 数值；`src/game-rules.js` 删除 3 分钟自然恢复间隔和下一次体力倒计时计算，只保留跨本地自然日时重置为满体力并清零广告领取次数；`src/game.js` 删除每秒体力刷新定时器和倒计时文案维护，交互前仅应用每日重置。`tests/game-rules.test.mjs` 已改为断言经过 3 分钟或更久不会自动增加体力，`scripts/smoke-browser.mjs` 已改为断言首页和游戏页都不存在 `.staminaCountdown`；本轮已通过全量单测、构建和完整浏览器 smoke。
- 2026-06-25 `1.2.6bug修复`：修复失败复活成功后再次失败仍显示“复活”按钮的问题，`finishGame(false)` 现在会结合 `state.revivedThisRun` 隐藏复活按钮，同一局只保留一次复活入口；修复玩家浏览锁定章节后点击“开始闯关”，再从游戏页返回首页仍停留在锁定章节的问题，`returnHome()` 已统一调用 `renderHome({ syncToCurrentLevel: true })`。首页窄屏适配改为基于 390px 设计宽度的容器比例缩放：`.app-shell` 启用 `container-type: inline-size`，首页头部、资源卡、章节标题、道路、关卡节点、兑换入口、底部按钮等关键尺寸改用 `cqw`，`renderRoadMap()` 按当前首页宽度同步缩放纵向道路间距，并在首页激活时监听 resize 重算地图。结果页星级区域 aria-label 已修正为“获得星星”；新增 `src/favicon.ico`，`src/index.html` 声明 favicon，开发服务器和 smoke 静态服务补齐 `.ico` 的 `image/x-icon` MIME。`scripts/smoke-browser.mjs` 已新增 favicon 可加载、320/360 宽度比例缩放、浏览锁定章节后返回当前章节、二次失败隐藏复活按钮等回归断言。`测试bug.txt` 已同步更新为本轮 bug 修复闭环记录。
- 2026-06-25 `1.2.5文件优化`：将运行时图片资源统一迁移并平铺到 `src/assets/image/` 根目录，不再保留图片分类子目录；`src/index.html`、`src/styles.css`、`src/game.js`、资源检查脚本、构建/smoke 脚本和文档引用均已改为 `assets/image/文件名`。本版本不上线的兑换商城已从运行时代码中移除：删除旧 `#exchangeScreen` DOM、头衔商城 JS 渲染逻辑、商城 CSS、商城 smoke 断言和商城独立资源；首页左侧兑换入口继续保留，只弹“功能暂未开放”。同时删除旧设计稿 PNG、旧视觉参考图、contact sheet、旧 tab/箭头图、重复根目录 UI 图、已废弃清档/返回首页资源、`tile-sheet.png`/`tile-preview.png` 等未引用资源。清理后除 `.git` 内部历史对象外，项目图片只保留在 `src/assets/image/` 根目录下。已执行单测、资源检查、构建和完整 smoke，均通过。
- 2026-06-25 `1.2.5后台计时修复`：修复网页切到后台后浏览器节流 `setInterval` 导致倒计时变慢的问题。`src/game.js` 新增 `state.timerLastTickAt` 和 `tickTimer()`，每次 tick 按 `Date.now()` 与上次计时基准的真实差值扣减 `state.remainingSeconds`，而不是每次 interval 固定减 1；`startTimer()` 会先清旧 timer 并以 250ms tick 检查真实 elapsed seconds。暂停弹框、道具弹框、体力弹框和离开确认弹框打开/关闭时会重置计时基准，保证玩家主动暂停期间不扣时间。`scripts/smoke-browser.mjs` 已将失败弹框测试改为模拟真实时间流逝触发倒计时失败，覆盖后台节流类场景。
- 2026-06-25 `1.2.4失败弹框复活广告`：失败结果页新增 `#reviveButton` “复活”按钮，按钮顺序为复活、再玩一局、返回首页；成功结果页和复活后再次失败均隐藏复活按钮。复活逻辑复用 `playRewardedAd("revive")`，正式环境走 `window.linkMatchAds.showRewardedAd`，smoke 可注入 `window.__linkMatchRewardedAd`；广告完成后保留当前棋盘与得分状态、清除选中/提示线、回到游戏页继续挑战，并将 `state.remainingSeconds` 重置为 `state.level.durationSeconds`；广告未完成时停留在失败结果页，通过 `#resultToast` 提示“复活失败，广告没看完”。`scripts/smoke-browser.mjs` 已新增复活广告未完成、完成后时间回满、复活 placement、当前棋盘继续、同一局只可复活一次等回归断言，并修正结果页按钮视觉检查只校验可见按钮。
- 2026-06-25 `1.2.3正式测试`：首页底部“清空数据”测试按钮已从 `src/index.html` 移除，配套样式已从 `src/styles.css` 移除；`src/game.js` 已删除手动清档事件绑定、清档函数、旧数据版本自动重置常量和启动时自动重置调用，正式测试期间只保留正常读档和新档默认值。`src/game.js` 已将 `TEST_UNLOCK_ALL_LEVELS` 改为 `false`，首页地图和章节状态回到 `progression.js` 的真实解锁规则：第 1 关为当前可挑战关卡，未解锁关卡保持锁定且不可点击，通关后按 `highestUnlockedLevel` 逐关推进。`scripts/smoke-browser.mjs` 已同步断言首页不存在清空数据入口，且新档首页 29 个未来关卡锁定、0 个未来关卡可测试。
- 2026-06-25 `1.2.2游戏优化`：首页金币资源卡 `#coinExchangeButton` 已恢复为纯展示余额，不再点击进入兑换商城；首页地图左侧新增独立入口 `#homeExchangeButton`，使用 `src/assets/image/exchange-shop-entry-icon-v1.png` 单张透明资源整图渲染并带 `exchangeEntryWiggle` 轻微摇摆动画，当前版本点击只弹出“功能暂未开放”。首次通关结果页新增 `#doubleCoinsButton` “双倍金币”按钮：调用 `window.linkMatchAds.showRewardedAd` 或 smoke 注入的 `window.__linkMatchRewardedAd`，广告未完成时不加金币，完成后追加一次首通同额金币，已领取后再次点击只提示“不重复领取”；重复通关和挑战失败不显示双倍按钮。结算页已移除得分/最佳统计块，新增卡片内 `#resultToast` 反馈提示；设置页开关补齐开/关态过渡；提示、暂停、洗牌三张道具图标已替换为新资源，数量角标调整为 `36px x 36px` 并上移。`scripts/smoke-browser.mjs` 已新增首页独立兑换入口、金币卡不可打开商城、双倍金币广告完成/未完成/重复点击、重玩/失败隐藏双倍按钮等回归断言。
- 2026-06-24 `首页兑换商城入口调整`：首页金币资源卡恢复为纯展示余额，不再点击进入兑换商城；`#homeExchangeButton` 已新增到首页左侧入口区，当前定位为 `top: 80px; left: 0; width: 60px`，本版本点击只弹出“功能暂未开放”。入口图标已替换为新生成单张透明资源 `src/assets/image/exchange-shop-entry-icon-v1.png`，整图包含“兑换”文字，不从预览图切图、不使用 CSS 拼装图标；当前使用 `exchangeEntryWiggle` 轻微上浮摇摆动画，使用 `transform` 和 `filter`，不改变布局尺寸。`scripts/smoke-browser.mjs` 已新增回归断言，覆盖新入口 CSS 定位、整图资源渲染、动画名/时长、顶部金币卡不可打开商城，以及“功能暂未开放”弹框。
- 2026-06-24 `1.2.1首页优化`：曾为测试阶段临时放开首页关卡入口；正式测试版本已恢复真实进度解锁。`renderHome({ syncToCurrentLevel: true })` 作为进入/返回首页的统一入口，首次进入、游戏页左上返回、暂停弹框返回和结算页返回都会同步到当前进度所在章节，并将 `.road-level.current` 居中到 `#roadScroll` 可视区域；左右章节箭头仍可手动浏览其它主题。提示和洗牌道具继续显示 `0`，点击 0 次道具仍弹“道具用完”弹框。游戏页背景已替换为 `src/assets/image/page-bg-saturated-jelly-v2.png`，该资源为 `gpt-image-2` 独立生成的完整不透明 9:16 候选背景，不切图、不截图、无透明留白；`.board-wrap` 已去掉背景和阴影，只保留浅色实线边框。
- 2026-06-24 `1.1.10水晶城堡连接线优化`：按反馈选择第一种冰晶碎片/冰晶链方向，生成独立横向连接线资源 `src/assets/image/road-jelly-connector.png`，源图为 `gpt-image-2` 生成图，不从背景图截图、不切整图；本地后处理仅做绿幕抠底、透明边缘贴边裁剪和内部透明洞封闭，最终资源尺寸为 `1981px x 303px`，alpha bbox 为整张图。`src/game.js` 已将 `jelly-castle` 纳入图片连接线渲染，移除该主题旧 SVG `road-path`；`src/styles.css` 新增 `.road-jelly-image-segment`，每段使用同一张冰晶链图片按两点间距拉伸/旋转；`scripts/check-home-road-node-assets.py` 已校验 `road-jelly-connector.png` 无透明边缘留白，`scripts/smoke-browser.mjs` 已增加水晶城堡 29 段 `.road-jelly-image-segment`、0 条 `.road-path`、背景图引用 `road-jelly-connector.png` 的回归断言；实际截图输出到 `output/playwright/home-jelly-castle-connector.png`。
- 2026-06-24 `关卡难度棋盘规则调整`：关卡难度改为按每个主题内的局部关卡号循环，而不是按 90 关全局序号计算。每个主题各 30 关：主题内 1-10 关为简单棋盘 `6列 x 7行`，11-20 关为中等棋盘 `6列 x 8行`，21-30 关为困难棋盘 `6列 x 9行`；布局宽度保持 6 列不变，只随难度纵向增加 1-2 行。`tests/progression.test.mjs` 已增加每章本地难度档回归测试，`tests/engine.test.mjs` 已同步锁定 easy/normal/hard 的 42/48/54 格配置。
- 2026-06-23 `1.1.9首页优化`：提交前收口当前首页关卡优化。三主题 9 张关卡三态 icon 均来自 `gpt-image-2` 生成图，并经 `scripts/process-home-road-node-assets.py` 绿幕去底、等比缩放、居中贴底和内部透明小孔封闭，不切图、不做非等比拉伸；糖果花园连接线使用 `road-candy-connector.png` 粉白糖果棒生成图分段渲染。按最新反馈将三主题 `.road-stars` 从 `top: 6px` 调整为 `top: 15px`，对应星星图片上边缘约在 `.road-level-main` 顶部上方 `10px`，让顶部星星贴合关卡 icon；正在玩的关卡 `.road-level.current` 恢复 `currentLevelPulse 1.4s ease-in-out infinite` 循环缩放呼吸动画，并补 `transform-origin: 50% 100%`，避免底部首关随缩放向下溢出；三主题 `.road-level-number` 及当前态数字 override 均已调整为 `bottom: 1px`。`scripts/check-home-road-node-assets.py` 覆盖 9 张 icon 尺寸、等比、内部透明洞和糖果连接线透明缝检查；`scripts/smoke-browser.mjs` 覆盖星星相对主 icon 顶部约 `-10px`、当前关卡整体动画为 `currentLevelPulse`、图片连接线和节点结构断言。
- 2026-06-23 `1.1.9-首页三主题关卡节点统一`：按最新反馈重新生成水果森林、糖果花园、果冻城堡三主题 9 张关卡三态 icon，全部来自 `gpt-image-2` 独立生成图，后处理只做绿幕去底、统一 `1024px x 1024px` 画布、等比缩放到 `912px` 可见高度、居中贴底和内部透明小孔封闭，不从整图切片，也不做非等比拉伸。9 张资源均通过 `scripts/check-home-road-node-assets.py` 校验，确认画布尺寸一致、可见高度一致、源图宽高比与输出 bbox 宽高比一致且内部没有全透明空洞；预览图输出到 `output/home-road-node-assets-preview.png`。`src/styles.css` 已将果冻城堡纳入同一套 `84px x 96px` 节点结构，当前态改为 `.road-level-main` 亮度/阴影呼吸，不再缩放整个节点；底部数字牌使用 `padding: 5px 10px`、`height: 26px`、grid 居中。`src/game.js` 已将果冻城堡地图上下边距同步为 48px，保证首关贴合关卡区域底部。`scripts/smoke-browser.mjs` 已扩展三主题节点结构、数字 padding、当前态呼吸、糖果/水果图片连接线和底部贴边断言。
- 2026-06-23 `1.1.7-首页关卡优化`：首页关卡区域已按反馈改为红框内左右交替排布，01 关贴近底部、30 关贴近顶部，并保持与章节栏/底部按钮 30px 间距；水果森林关卡连接线改为 `src/assets/image/road-vine-connector.png` 藤曼图片分段渲染，糖果花园/果冻城堡保留主题化 SVG 连接线风格。完成关卡星级从 CSS 星星改为图片徽章，`renderMiniStars()` 按 `bestStars` 动态选择 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`；最终采用 C 珊瑚粉底色，1 星为 1 实星 + 2 空心星，2 星为 2 实星 + 1 空心星，3 星为 3 实星。三张星级徽章均由 `gpt-image-2` 独立生成并替换，后处理只做纯色底移除和紧缩透明画布，最终尺寸统一为 `540px x 216px`，页面显示统一为 `66px x 26px`。修复完成关卡 icon 黑色脏阴影问题，并修复通关成功从结果页返回首页后藤曼连接线因隐藏态宽度计算错误而贴到左侧的 bug；`scripts/smoke-browser.mjs` 已新增星级图片、星级尺寸一致、关卡上下边距、左右交替布局、29 段藤曼、通关返回首页藤曼对齐等回归断言。
- 2026-06-23 `1.1.8-首页关卡节点同步优化`：按最新反馈将水果森林与糖果花园同步为新关卡节点结构：顶部显示通用星级图 `road-stars-1/2/3.png`，中间为状态按钮图，底部为 HTML 动态关卡数字牌；已替换 `level-fruit-completed-bg.png`、`level-fruit-current-bg.png`、`level-fruit-not-started-bg.png`、`background-candy-full.png`、`level-candy-completed-bg.png`、`level-candy-current-bg.png`、`level-candy-not-started-bg.png`，并新增 `road-candy-connector.png`。糖果连接线不再走 `buildRoadSvg()`，改为 29 条 `.road-candy-image-segment`，每条使用同一张 `gpt-image-2` 生成的完整粉白糖果棒图片按两点间距拉伸/旋转，避免切片重复导致透明缝。新版水果/糖果关卡节点使用主题专用上下 48px 地图边距，底部首关与关卡区域底边保持约 0px；关卡数字改为固定高度 grid 盒，保证在底部方框中垂直居中。新增 `scripts/process-home-road-node-assets.py` 记录本轮生成图到项目资源的绿幕抠像、裁边和备份流程；`scripts/smoke-browser.mjs` 已增加水果森林/糖果花园必须使用图片连接线、0 条 SVG road-path、节点三层结构、底部首关贴边和数字居中的回归断言。
- 2026-06-23 `1.1.7-首页关卡优化`：首页关卡区域已按反馈改为红框内左右交替排布，01 关贴近底部、30 关贴近顶部，并保持与章节栏/底部按钮 30px 间距；水果森林关卡连接线改为 `src/assets/image/road-vine-connector.png` 藤曼图片分段渲染，糖果花园/果冻城堡保留主题化 SVG 连接线风格。完成关卡星级从 CSS 星星改为图片徽章，`renderMiniStars()` 按 `bestStars` 动态选择 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`；最终采用 C 珊瑚粉底色，1 星为 1 实星 + 2 空心星，2 星为 2 实星 + 1 空心星，3 星为 3 实星。三张星级徽章均由 `gpt-image-2` 独立生成并替换，后处理只做纯色底移除和紧缩透明画布，最终尺寸统一为 `540px x 216px`，页面显示统一为 `66px x 26px`。修复完成关卡 icon 黑色脏阴影问题，并修复通关成功从结果页返回首页后藤曼连接线因隐藏态宽度计算错误而贴到左侧的 bug；`scripts/smoke-browser.mjs` 已新增星级图片、星级尺寸一致、关卡上下边距、左右交替布局、29 段藤曼、通关返回首页藤曼对齐等回归断言。
- 2026-06-22 `1.1.7-首页关卡Icon二次优化`：根据最新反馈重新生成并替换 `src/assets/image/level-*-bg.png` 9 张关卡三态 icon。完成态统一为主题色按钮 + 对勾，底部星星不再烘焙进 PNG，仍由 `renderMiniStars()` 按 `record.bestStars` 动态渲染；当前态保留高亮/主题装饰；未通关态统一为锁定视觉，并移除旧 DOM 叠加锁图标与 `.road-lock-icon` 样式，避免“双锁”。资源经 `scripts/process-level-icon-assets.py` 处理，完成绿幕抠像、去溢色、内容边界裁切，最终 9 张资源透明边距均为 `(0, 0, 0, 0)`；关卡 icon 显示尺寸先放大后按反馈缩到当前 0.8 倍，普通节点为 `77px x 67px`，当前关卡为 `84px x 72px`，关卡号和星星同步缩小。期间曾生成三主题树形关卡地图背景并接入试验，因实际效果“不好看”已删除 `src/assets/image/tree-map/` 并移除所有 `tree-map` / `TREE_MAP` 引用。
- 2026-06-18 `1.1.6-首页关卡Icon优化`：重新生成 `src/assets/image/level-*-bg.png` 9 张首页关卡底座资源，替换此前挖空/遮挡处理方案；新底座不包含星星、星星槽、文字、锁、黑条或白条，生成后完成绿幕透明化和内容边界裁切，确认无多余透明留边。`src/game.js` 的 `renderMiniStars()` 改为只输出实际获得星数对应的 CSS 星星，0 星不显示，1/2/3 星分别显示对应数量；`src/styles.css` 移除临时底部遮罩条并强化 CSS 星星样式；首页左右章节箭头改为首尾循环切换，不再禁用；金币 icon 相关资源已重切去底色。`scripts/smoke-browser.mjs` 已新增首页章节循环、关卡星级按 `bestStars` 显示、关卡底座无黑条/挖空缺口、金币资源和主流程回归断言。
- 2026-06-18 `1.1.5首页UI优化`：重新生成并替换首页问题资源，修复透明空白、底色残留和主题色不一致；`src/index.html` 首页资源框改为体力/金币/星星 icon + 数值布局，体力保留刷新倒计时，金币/星星去掉说明文字；三个主题 tab 已移除，原章节标题栏上移到左右切换箭头中间，左右箭头统一使用 `src/assets/image/exchange-page-arrow-bg-v2.png`；`src/styles.css` 去掉 `.app-shell` padding，首页顶部入口与资源卡重排，底部开始按钮按 `1115/276` 原图比例 `width: 100%` 显示并增加 `padding-bottom: 10px`，`screen-start` 当前为 `padding: 0 10px 0`，`.home-header` 当前为 `margin-top: 30px`；`src/game.js` 改为只维护章节切换器状态，不再渲染三枚 chapter tab；`scripts/smoke-browser.mjs` 已同步断言首页无 chapter tab、章节标题栏/兑换页箭头资源实际渲染、资源框文本精简、开始按钮比例和主流程不回归。
- 2026-06-17 兑换页面优化完成：金币兑换页中间商城已替换为 v2 独立组件资源，新增 `exchange-shop-panel-bg-v2.png`、`exchange-title-card-bg-v2.png`、`exchange-price-button-bg-v2.png`、`exchange-page-arrow-bg-v2.png` 和 `exchange-shop-preview-v2.png`；大兑换框、头衔框、价格按钮和翻页按钮均已重切透明余边并按原图比例显示，避免拉伸压缩。商城从 3x3/两页改为两列、每页 6 个、共 3 页；奖品框当前宽度为 `117px`，绿框文字水平垂直居中，价格按钮和金币 icon 正常比例显示；`scripts/smoke-browser.mjs` 已覆盖 v2 资源接入、两列布局、每页 6 个、3 页翻页、奖品框比例、价格按钮比例、金币 icon 尺寸和兑换结果弹框。
- 2026-06-16 首页 UI 替换：`src/index.html` 已给首页顶部入口、左右箭头和章节锁定提示补入真实图标节点；`src/game.js` 会按当前主题给首页、tab、章节标题和关卡节点切换主题类；`src/styles.css` 已将首页背景、资源卡、tab、章节标题、关卡当前/已完成/未开始三态、锁图标和底部开始按钮切换到 `src/assets/image/` 切图。旧的渐变卡片、旧路线 SVG 叠层和旧纯色首页背景已从当前首页视觉中移除；`scripts/smoke-browser.mjs` 已新增首页图片资源实际渲染断言。
- 2026-06-16 金币兑换 3x3 头衔商城接入：金币兑换页中部已接入两页 3x3 头衔商城，商品卡为青绿色称号牌 + 金币价格按钮，底部左右方向按钮可翻页；点击价格按钮会按当前金币余额弹出“已兑换成功”或“金币不足”。当前版本仅做展示和反馈，不扣除金币，不保存已拥有/已佩戴头衔；`scripts/smoke-browser.mjs` 已覆盖 9 个商品、两页翻页、成功弹框、金币不足弹框和旧体力/提示/洗牌兑换项不回归。
- 2026-06-16 金币兑换页面方向调整：按最新产品口径，金币后续不用于兑换体力、提示、洗牌这类消耗资源；已删除金币兑换页里“体力 +30 / 提示 +1 / 洗牌 +1”三个兑换框和旧兑换按钮绑定，并将兑换方向转为头衔或其他非体力/非基础道具类内容。`scripts/smoke-browser.mjs` 已新增回归断言，确保旧三项和旧兑换按钮不会重新出现。
- 2026-06-16 首页资源提交：`src/assets/image/` 已纳入仓库，资源来自三张已确认的新版首页设计稿，包含通用资源 `top-button-bg.png`、`icon-profile.png`、`icon-settings.png`、`resource-card-bg.png`、`arrow-button-bg.png`、`icon-arrow-left.png`、`icon-arrow-right.png`、`icon-lock.png`；水果森林、糖果花园、果冻城堡三主题分别包含完整背景、选中/未选中 tab、章节标题底图、当前/已完成/未开始关卡底图、开始按钮底图。资源清理后，manifest/contact sheet 这类核对文件不再作为仓库资源保留。
- 2026-06-15 设置页面 UI 优化：设置页按个人中心页面风格继续收口，左上返回按钮和标题牌保持二级页统一规格；音乐、音效、振动三行保留独立切图背景，去除文字两侧小草 icon，三行内部 icon、文字和开关上下居中；清除进度框已移除，后续正式测试准备中相关测试绑定也已清理；`module-settings-row-bg.png`、`icon-music.png`、`icon-sound.png`、`icon-vibration.png` 的设置页目录和根目录同名资源均已裁切透明余边；当前设置行 CSS 关键值为 `grid-template-columns: 70px minmax(0, 1fr) 120px`、`min-height: 80px`、`.settings-icon` 为 `40px x 40px` 且 `margin-left: 20px`、`.settings-toggle` 为 `padding: 0 50px 0 20px`、圆点为 `top: 7px; right: 10px; width: 26px; height: 26px`、面板 `padding: 60px 20px 40px`；`scripts/smoke-browser.mjs` 已增加设置页截图和这些样式值的回归断言。
- 2026-06-15 个人中心页面三星关卡 bug 修复：原个人中心“三星关卡”统计读取旧字段 `record.stars`，而首页关卡星级和进度系统使用的是历史最高星 `bestStars`，导致个人中心与首页显示不一致。现已在 `src/progression.js` 增加统一统计函数 `calculateThreeStarLevels()`，个人中心改为复用该函数；`tests/progression.test.mjs` 增加历史最高星统计回归测试，`scripts/smoke-browser.mjs` 增加个人中心三星关卡数与首页关卡星级节点一致性断言。
- 2026-06-15 个人中心页面 UI 完成：个人中心已完成多轮截图反馈精修，左上返回按钮缩小，标题牌和文字对齐完成，玩家信息框下移并保留独立背景图，6 个中间数据框去除额外杏色填充和白色边框并整体/内部居中；当前进度关卡条、总星数、已通关、三星关卡文字字号和位置已按最新要求调整；底部“返回首页”按钮已移除，保留左上返回入口；页面保持无滚动条。
- 2026-06-15 首页二级页面开发+UI：点击首页“个人”进入个人中心，点击“设置”进入设置页，点击金币资源框进入金币兑换页；三个页面均使用独立 DOM 布局和组件资产组合，保留动态文字/数值为 HTML/CSS 层，整页设计稿仅作为布局参考。个人中心已同步当前关卡、总星数、金币、已通关数和三星关卡数；设置页已提供音乐、音效、振动开关的前端切换；金币兑换页已展示金币、体力/提示/洗牌兑换项和兑换按钮占位。
- 2026-06-14 首页背景回退：按最新截图反馈，首页不再使用或透出水果背景图；`body` 改为纯浅绿色背景，原 `page-bg.png` 仅保留在游戏页使用。浏览器 smoke 已新增断言，防止首页和页面安全区再次露出背景图。
- 2026-06-13 首页 UI 重改：新版三主题首页完整设计稿已确认并保存，覆盖水果森林、糖果花园、果冻城堡；设计稿已去除截图外侧黑色阴影，后续可作为首页切图和 H5 接入依据。

当前已完成 H5 单机 demo 的核心玩法、体力系统、道具占位、结算流程、移动端游戏 UI、第一版章节闯关首页布局、`demo1.0.6-UI布局更新`、`demo1.0.7--金币系统优化`、`demo1.0.8--首页二级页面开发+UI`、`demo1.0.9个人中心页面UI完成`、`demo1.1.1个人中心页面三星关卡bug修复`、`demo1.1.2设置页面UI优化`、`demo1.1.3首页资源提交`、`1.1.4-首页UI替换`、`1.1.4兑换页面优化完成`、`1.1.5首页UI优化`、`1.1.6-首页关卡Icon优化`、`1.1.7-首页关卡优化`、`1.1.8-首页关卡节点同步优化`、`1.1.9首页优化`、`1.1.10水晶城堡连接线优化`、`1.2.1首页优化`、`1.2.2游戏优化`、`1.2.3正式测试`。首页 UI 方向已执行还原清理：旧三主题高保真稿、首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图均已删除；当前首页资源包已接入 H5 首页渲染，运行时图片统一存放在 `src/assets/image/`。

已完成内容：

- 首页和章节关卡：
  - 首页顶部保留个人中心、设置、体力、金币、星星入口，已删除 `Link Match / 连连看` 大标题。
  - 首页改为可纵向滑动的左右交替关卡地图，当前视口展示约 4-5 个大尺寸关卡点，01 关贴近关卡区域底部，30 关贴近顶部。
  - 关卡顺序为自下而上：第 01 关在底部，向上滑动查看后续关卡。
  - 主题章节为水果森林 1-30、糖果花园 31-60、果冻城堡 61-90；当前首页不再显示三枚主题 tab，中间只保留当前章节关卡栏。
  - 支持左右箭头切换主题；糖果花园需通关第 30 关后进入，果冻城堡需通关第 60 关后进入。
  - 首页底部居中显示“开始闯关/继续闯关”按钮，按钮按 `1115/276` 原图比例铺满底部容器，底部 dock 仍保留 `padding-bottom: 30px`，按钮文字保留 `padding-bottom: 10px` 下压。
  - 首页不再显示右侧“获取体力/已领取完”按钮，也不保留底部 4 个 tab。
  - 首页背景已切换为 `src/assets/image/` 根目录下的三主题完整背景，不再露出 `src/assets/image/page-bg.png`。
  - 原水果果冻背景图仍保留给主游戏页面使用，不影响游戏页、弹框和结算页视觉。
  - 首页旧三主题高保真稿、旧首页背景图、对齐稿、取用规则说明、导出模板/脚本和旧首页截图已删除。
  - 已明确首页地图采用开放式背景，不再使用中部地图左右竖向奶油边框。
  - 已删除旧的临时视觉参考图 `docs/fea087d1-5071-4155-9224-59bc0ea52572.jpeg`。
  - 新版首页设计稿 PNG 已在资源清理中从仓库移除，当前以 `src/assets/image/` 下的运行时切图资源为准。
  - 新版首页采用完整首页结构：个人/设置入口、体力/金币/星星资源栏、左右切换按钮、当前章节关卡栏、蜿蜒关卡路线、关卡星级底座、锁定态、底部开始闯关按钮。
  - 新版首页资源包已接入 H5 首页渲染：顶部个人/设置入口、体力/金币/星星资源卡、章节标题、关卡三态底座、锁图标和底部开始按钮均使用 `src/assets/image/` 独立切图；左右切换按钮复用 `src/assets/image/exchange-page-arrow-bg-v2.png`；动态文字和数值仍由 HTML/CSS/JS 渲染。
  - 2026-06-22 已尝试三主题树形弹框地图背景方案并删除：`tree-map` 资源目录和代码引用已清理，当前首页地图继续使用开放式章节背景 + 关卡 icon 路线。
  - 首页关卡 icon 当前使用二次优化资源：完成态对勾 + 顶部动态星级徽章、当前态高亮、未通关态锁定；普通节点当前显示尺寸约 `77px x 67px`，当前关卡约 `84px x 72px`。
  - 首页完成关卡星级徽章当前使用 `road-stars-1.png`、`road-stars-2.png`、`road-stars-3.png`，均为 `gpt-image-2` 独立生成的 C 珊瑚粉底色图片，画布已收紧到 `540px x 216px`，页面显示约 `66px x 26px`。
  - 水果森林连接线当前使用 `road-vine-connector.png` 藤曼图片分段渲染；糖果花园连接线当前使用 `road-candy-connector.png` 粉白糖果棒图片分段渲染，糖果花园不再使用 SVG 路线；水果森林、糖果花园、果冻城堡 9 张关卡三态 icon 均已统一为顶部通用星星、中间状态按钮、底部数字牌结构；通关成功返回首页后会在首页可见且布局稳定后重新计算图片连接线位置，避免隐藏态宽度计算导致连接线贴边。

- 首页二级页面：
  - 首页“个人”按钮已接入 `#profileScreen`，展示个人中心页面。
  - 首页“设置”按钮已接入 `#settingsScreen`，展示设置页面。
  - 首页金币资源框 `#coinExchangeButton` 只展示金币余额，不再承担点击入口；首页地图左侧 `#homeExchangeButton` 本版本只弹出“功能暂未开放”，不进入兑换商城页面。
  - 个人中心和设置页均使用组件化 HTML/CSS 布局，不再使用整页设计图作为铺底。
  - 个人中心包含头像昵称、ID、当前进度、总星数、金币、已通关、三星关卡模块；相关数值由 `state.progress` 动态渲染。
  - 个人中心已完成 UI 精修：玩家信息框 `margin-top: 50px`，6 个数据框整体居中、内部内容上下居中，统计模块去除额外边框/填充，当前进度关卡条和总星数数字下移 `10px`，已通关/三星关卡显示为 `0关` 格式。
  - 个人中心“三星关卡”统计已统一使用 `bestStars >= 3`，与首页关卡节点星级显示同源，不再读取旧字段 `stars`。
  - 个人中心底部“返回首页”按钮已移除，只保留左上角返回按钮。
  - 设置页包含音乐、音效、振动三个开关；开关目前为前端状态切换，清除进度框已按当前 UI 要求移除；开关已补齐开/关态背景过渡、圆点滑动和关闭态左侧定位。
  - 金币兑换商城本版本不上线，旧 `#exchangeScreen`、头衔商城 DOM/JS/CSS、商城资源和商城 smoke 断言已清理；保留首页兑换入口作为“功能暂未开放”提示。
  - 个人中心和设置页均只保留左上返回按钮，底部“返回首页”按钮已移除。
  - `scripts/smoke-browser.mjs` 已新增断言：二级页必须由布局根节点渲染，若重新使用整页设计图会失败；个人中心覆盖无滚动、返回按钮尺寸、标题文字位置、6 个数据框居中/无边框、统计字号、`0关` 后缀、三星关卡与首页星级数据一致、玩家信息框 `margin-top: 50px`、底部返回按钮移除等回归检查；设置页覆盖 3 个设置行、清除进度框移除、行背景/卡片无额外白边、行内元素上下居中、设置 icon 尺寸和左边距、设置行列宽/高度、开关 padding/圆点尺寸与位置、面板 padding 等回归检查；首页兑换入口覆盖只弹出“功能暂未开放”、不进入商城页。

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
  - 所有弹框背景使用独立切图 `src/assets/image/modal-card-bg.png`，不是截图直接贴上去。
  - 所有弹框按钮使用独立切图：
    - `src/assets/image/modal-button-primary.png`
    - `src/assets/image/modal-button-secondary.png`
  - 所有弹框顶部胶囊图压在弹框上边框上，位置为一半在弹框外、一半在弹框内。
  - 胶囊图内已去掉星星装饰，改为动态显示当前关卡，例如 `第01关`。
  - 成功/失败结果页已加黑灰色蒙版。
  - 成功/失败结果页已去掉体力栏。
  - 成功/失败结果页已去掉标题下方说明文字。
  - 首次通关成功文案为“通关成功，获得 X + 金币图标”，金币数字放大加粗并使用独立金币切图。
  - 已通关关卡重复通关文案为“恭喜通关，重复关卡无法获得金币。”，不显示金币数字和金币图标。
  - 首次通关成功结果页增加“双倍金币”按钮，按钮顺序为双倍金币、下一关、再玩一局、返回首页，按钮间距统一为 `12px`；广告未完成不发放额外金币，广告完成后追加一次首通同额金币，重复点击不重复发放，重复通关和挑战失败均隐藏该按钮。
  - 通关成功结果页增加“下一关”按钮，按钮顺序跟随双倍金币按钮之后；重复通关或失败时仍按当前可用操作显示。
  - 挑战失败文案改为“挑战失败，再来一次吧。”，字号与通关成功文案保持一致。
  - 挑战失败结果页增加“复活”按钮，点击后进入激励广告；广告完成则回到当前棋盘继续游戏并重置本关时间，广告未完成则停留在失败弹框并提示“复活失败，广告没看完”；同一局复活成功后再次失败不再显示复活按钮。
  - 成功/失败顶部图标已改为独立切图徽章：成功为绿色对勾奖杯，失败为红色 X 奖杯。
  - 暂停弹框和离开本局弹框顶部图标已替换为同风格独立切图，不再使用旧的工具/主页按钮图标。
  - 暂停弹框和离开本局弹框标题字号已调整为与成功/失败结果文案一致。

- 玩法和系统：
  - 棋盘核心规则可用：相同图案、最多两次转弯、允许棋盘外侧绕线。
  - 关卡配置已拆成 90 关章节数据，关卡可独立配置棋盘尺寸、图案数量、时间、提示、洗牌和金币奖励。
  - 难度按每个主题内 30 关单独计算：1-10 关为 easy，11-20 关为 normal，21-30 关为 hard；三档当前统一使用 `6列 x 7行` 棋盘布局，normal/hard 仍通过图案种类和时间递减体现难度，不再纵向增加棋盘行数。
  - 初始只开放第 1 关；通关第 N 关后解锁第 N+1 关。
  - 新档默认基线为：金币 0、星星 0、无通关记录、第 1 关未通关、体力 60/60、广告领取次数 0、提示 0、洗牌 0。
  - 游戏正常入口保持随机棋盘；自动化 smoke 可通过 `?boardSeed=smoke-easy` 使用固定棋盘，避免随机局面导致验收偶发失败。
  - 提示、洗牌、暂停、返回首页确认、重新开始、再玩一局流程可用。
  - 错误匹配会提示并抖动选中方块。
  - 无可连接组合时不再自动洗牌，而是提示玩家使用洗牌道具。
  - 游戏倒计时按真实时间差结算，浏览器后台节流不会导致倒计时变慢；主动暂停弹框期间不扣时间。
  - 星级结算按剩余时间比例计算。
  - 每关星星只记录历史最高星级，不作为资源消耗，也不能重复刷星。
  - 每个主题 30 关首通金币总计 100：主题内 1-10 关每关 2 金币，11-20 关每关 3 金币，21-30 关每关 5 金币。
  - 只有首次通关获得金币；重复挑战已通关关卡不再获得金币。
  - 金币作为后续道具、皮肤或资源系统的基础货币。
  - 体力系统可用：开局扣 3 点，不再低于上限时自然恢复；跨本地自然日重置为满体力并清零广告领取次数，看广告和购买均为占位流程。

## 3. 关键文件

- `src/index.html`：首页地图结构、二级页面结构、游戏页结构、弹框结构、结果页结构、favicon 声明和结果页可访问性标签。
- `src/styles.css`：移动端布局、首页地图、首页容器比例缩放、二级页面组件布局、游戏页背景、果冻糖果风 UI、弹框、按钮、胶囊标题、棋子按压反馈、洗牌动画、滚动锁定。
- `src/game.js`：游戏状态、首页地图渲染、首页道路随容器宽度缩放、二级页面切换、个人中心数据同步、设置开关前端状态、未开放功能弹框/提示、关卡标题同步、读档/新档默认值、道具广告奖励、洗牌动画和结算逻辑。
- `src/levels.js`：3 个主题章节、90 关配置、主题内 1-10/11-20/21-30 难度时间和图案档、统一 `6列 x 7行` 棋盘布局、主题内首通金币档位、初始提示/洗牌次数。
- `src/progression.js`：关卡解锁、每关记录、星星统计、三星关卡统计、随机玩家昵称、首次通关判断和金币奖励规则。
- `src/game-rules.js`：体力消耗、每日重置、星级、广告/购买占位规则。
- `src/storage-reset.js`：版本化数据重置、进度/体力 storage key、旧版本全量清档逻辑和当前真机旧档体力一次性补满标记。
- `src/engine.js`：连连看棋盘生成、固定随机种子、连线判断、洗牌和可消除对检查。
- `src/audio-settings.js`：设置页音乐/音效/振动会话态、本地背景音乐播放控制、WebAudio 音效控制器、统一按钮短音、成功/失败反馈。
- `src/game-layout.js`：根据可用宽高、棋盘行列和外框 chrome 计算游戏棋盘外框宽度，保证短高设备上棋盘在 HUD 与工具栏之间居中且不溢出。
- `docs/douyin-minigame-integration-plan.md`：抖音小游戏接入与上架计划，覆盖平台入驻、创建小游戏、基础信息、必接能力、备案提审、发布运营、性能风险、技术适配范围和第一阶段 Spike 计划。
- `tests/progression.test.mjs`：章节、线性解锁、星星历史最高、三星关卡统计、随机玩家昵称、首通金币和重复通关无金币测试。
- `tests/game-rules.test.mjs`：体力不再自然恢复、消耗、每日重置、广告/购买占位和默认满体力测试。
- `src/assets/image/modal-card-bg.png`：弹框/结果页背景切图。
- `src/assets/image/modal-button-primary.png`：主按钮切图。
- `src/assets/image/modal-button-secondary.png`：副按钮切图。
- `src/assets/image/result-pass-badge.png`：通关成功奖杯徽章切图。
- `src/assets/image/result-fail-badge.png`：挑战失败奖杯徽章切图。
- `src/assets/image/result-coin.png`：通关金币奖励图标切图。
- `src/assets/image/modal-pause-badge.png`：暂停弹框顶部徽章切图。
- `src/assets/image/modal-exit-badge.png`：离开本局弹框顶部徽章切图。
- `src/assets/image/`：项目所有运行时图片资源的统一平铺目录；首页、二级页、游戏页、弹框、棋子和结算页图片都直接放在这一层，不再使用图片子目录。
- `src/assets/audio/`：本地背景音乐资源与授权说明目录；当前运行时背景音乐使用 `background_video.mp3`，`kenney-music-jingles-license.txt` 保留素材授权来源，`README.md` 记录当前音频口径。
- `scripts/process-home-road-node-assets.py`：本轮首页关卡节点资源处理脚本，用于将 `gpt-image-2` 生成的三主题 9 张关卡节点和糖果连接线写入 `src/assets/image/`，并对透明资源执行 chroma-key 透明化、等比缩放、居中贴底和内部透明小孔封闭。
- `scripts/check-home-road-node-assets.py`：9 张关卡节点资源和图片连接线校验脚本，检查关卡节点画布尺寸统一为 `1024px x 1024px`、可见高度统一为 `912px`，源图宽高比与输出 bbox 宽高比一致，且不存在内部全透明空洞；同时检查糖果/水晶连接线无透明边缘留白。
- `scripts/process-level-icon-assets.py`：本轮关卡 icon 资源处理脚本，用于将 `gpt-image-2` 生成图映射到 9 个首页关卡状态资源，完成 chroma-key 透明化、去绿色溢边和内容边界裁切。
- `src/assets/image/favicon.ico`：本轮补齐的站点图标，用于避免 favicon 请求产生 404。
- `scripts/dev-server.mjs`：本地和真机预览静态服务，默认监听 `0.0.0.0:4173`，端口占用时自动尝试后续端口并打印 Local/Network 地址。
- `scripts/smoke-browser.mjs`：浏览器自动化验收脚本，使用固定 `boardSeed`，包含 favicon 加载、首页地图、320/360/390 视口比例缩放、首页资源框 40%/60% 几何布局、三主题图片连接线、当前关卡居中、浏览锁定章节后返回首页同步当前章节、游戏/暂停返回首页后仍定位当前关卡、首页无清空数据入口、未开放功能统一文案、顶部金币卡不可打开商城、章节 tab 移除、章节标题栏/首页箭头资源渲染、个人中心昵称和三星关卡一致性断言、设置页 UI 精修与窄屏适配断言、游戏棋盘居中和棋子视觉比例断言、双倍金币广告奖励、道具广告奖励、失败复活广告完成/未完成/二次失败隐藏复活按钮、棋子按压反馈、洗牌动画中途换盘和移动端主流程 UI 断言。

## 4. 最近验证

最近一轮（2026-07-02，`1.2.9优化` 收口时）执行：

```powershell
npm.cmd test
npm.cmd run build
npm.cmd install --no-save --no-package-lock playwright
npm.cmd run smoke
```

验证结果：

- 单测：57 条通过，0 失败。
- 构建：`scripts/build.mjs` 成功输出 `dist/`。
- 完整浏览器 smoke：通过，输出 `Smoke passed: 42 tiles rendered`，棋子宽高比初始和消除后均为 `1.000`。
- Playwright：本轮用 `--no-save --no-package-lock` 临时安装到被 `.gitignore` 忽略的 `node_modules/`，未修改 `package.json` 或 lockfile。
- 首页关卡资源检查：本机 `python.exe` 无法访问且没有 `py` 启动器，本轮未重跑；本轮未改动图片资源。

临时验证产物：

- `dist/` 和 `output/` 只在构建、资源处理或 smoke 验证时临时生成；本轮验证后已清理，不提交到仓库。

## 5. 当前 Git 状态

- 当前分支：`main`
- 远程仓库：`https://github.com/NicoKing-One/Link-Match.git`
- 提交前基线：`d581f9e 1.2.9全局优化`。
- 当前提交：本轮提交备注为 `1.2.9优化`，本地 `main` 已提交并推送到远程 `origin/main`。
- 工作区状态：本轮改动已按备注 `1.2.9优化` 完成本地提交并推送到远程 `main`。
- 本轮提交文件：更新 `docs/project-handoff.md`、`scripts/smoke-browser.mjs`、`src/audio-settings.js`、`src/game.js`、`src/styles.css`、`tests/audio-settings.test.mjs`，新增 `src/game-layout.js`、`tests/game-layout-style.test.mjs`、`tests/game-layout.test.mjs`、`tests/game-visuals.test.mjs`、`tests/settings-layout.test.mjs`。
- 本轮收口内容：按备注 `1.2.9优化` 收口设置页窄屏适配、游戏棋盘动态宽度和居中、棋子图案放大、后台/卸载音乐停止以及配套单测和 smoke 断言。
- 本轮提交备注：`1.2.9优化`。

## 6. 运行方式

推荐使用本地服务运行，不要直接双击 `src/index.html`。

```powershell
Set-Location 'E:\VIGORPLAY\游戏\Link-Match'
npm.cmd run dev
```

然后打开：

```text
http://127.0.0.1:4173
```

也可以直接双击项目里的 `start-game.bat`。

## 7. 下一步建议

建议下一轮按这个顺序继续：

1. 用户侧优先完成抖音开放平台注册/入驻/主体认证/对公验证，并创建小游戏拿到 `appID`；同时确认小游戏名称、图标、简介、资质材料、隐私政策和适龄提示的初版方向。
2. 开发侧下一轮建议使用备注 `1.2.10抖音小游戏接入Spike`：新增 `platforms/douyin/` 工程壳，补齐 `project.config.json`、`game.json`、`game.js` 等最小文件，并在抖音开发者工具中验证当前 H5 架构能否进入首屏。
3. Spike 阶段优先验证运行环境差异：DOM/CSS 支持、资源路径、WebAudio、存储、生命周期、真机扫码预览和包体/图片资源风险；先输出兼容性结论，再决定轻量适配、局部重写渲染入口或引擎化重构。
4. 最小可预览包通过后，再接入抖音平台必接能力和商业能力：侧边栏复访、平台存储、分享/搜索配置、激励视频广告；广告优先映射现有“双倍金币 / 失败复活 / 道具获取”入口，暂缓头衔系统、商城、内购和普通 UI 微调。

## 8. 新线程接手提示

新线程开始时可直接说：

```text
请先阅读 D:\工作文件\游戏\连连看\docs\project-handoff.md，然后继续开发 Link Match 连连看项目。
```
