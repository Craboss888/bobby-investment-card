# Bobby Demo 复刻

复刻 RockFlow 旗下 AI 投资助手 Bobby 的前端，做成可交互的 demo，在上面加新内容或改动；最终部署到 GitHub，交给 RockFlow 团队验收。做法参照星使智算项目的 demo（`~/Desktop/XF AI Projects/2026 Sep 星使智算/demo/`），区别是这次**拿不到产品源码**。

## 当前有效结论
- **范围（谢峰定）：只做 Bobby.ai 这个 AI 助手本身，不做 RockFlow 券商 App**（后者页面层级太复杂）。
- **Bobby 有网页版 https://bobby.ai**（对话页 `/explore/chat`），Next.js 构建，已适配手机宽度；旧域名 bobby.rockflow.tech、mybobby.ai 都 301 跳过来。
- **网页版 ≠ App，只有局部一致**：仅「手机宽度 + Finance 分区」的首页组件（资讯卡堆叠、快捷入口胶囊、输入框）与 App 一致。电脑宽度布局完全不同（常驻侧栏、顶部居中输入框、双栏）；Predict 分区是预测市场（选举、体育、推文数量赔率），App 截图里没有。
- **复刻流程（谢峰定）**：目标是 App。先按网页版「手机宽度（约 402）+ Finance 分区」取精确样式参数复刻打底，再按谢峰手机录屏调差异。登录后页面用谢峰 Chrome（Claude 插件）读取；未登录部分用 Playwright。
- **展示形态（建议，待验证）**：做成手机尺寸网页，电脑打开显示手机外框、手机打开全屏；部署 GitHub Pages。暂不做原生 App。

## 待确认
- 要加的新内容、demo 的目的
- GitHub 仓库公开还是私有（免费账号私有仓库不能开 Pages）；公开时页面需标「演示」且禁止搜索引擎收录

## 目录
- `素材/`：谢峰提供的 App 录屏与截图；`素材/网页版对照/` 放网页版截图。**不进 git**（可能含账户信息）

## 工具
- 截网页版用 Playwright（后台无头），不用 Claude 应用自带浏览器窗格——2026-10-12 窗格打开 bobby.ai 卡死 19 分钟无返回

## 约定
- 不登录、不操作谢峰的 RockFlow / Bobby 账号；在 bobby.ai 发消息属对外操作，须先问
- 演示数据一律假数据，不接真实行情与交易
- git 署名：Craboss888 / `Craboss888@users.noreply.github.com`（仓库内已配）
