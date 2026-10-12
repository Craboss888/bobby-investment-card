# Bobby Demo 复刻

复刻 RockFlow 旗下 AI 投资助手 Bobby 的前端，做成可交互的 demo，在上面加新内容或改动；最终部署到 GitHub，交给 RockFlow 团队验收。做法参照星使智算项目的 demo（`~/Desktop/XF AI Projects/2026 Sep 星使智算/demo/`），区别是这次**拿不到产品源码**。

## 当前有效结论
- **Bobby 有网页版 https://bobby.ai**（对话页 `/explore/chat`），Next.js 构建，已适配手机宽度；旧域名 bobby.rockflow.tech、mybobby.ai 都 301 跳过来。RockFlow App（iOS / Android）里也有 Bobby。
- **复刻依据**：网页版能直接读出真实的布局、颜色、字体、间距数值；App 独有的页面靠谢峰录屏/截图重画。
- **展示形态（建议，待验证）**：做成手机尺寸网页，电脑打开显示手机外框、手机打开全屏；部署 GitHub Pages。暂不做原生 App。

## 待确认
- 网页版与 App 内 Bobby 是否同一套界面（需谢峰发 App 截图对比）
- 复刻范围、要加的新内容、demo 的目的
- GitHub 仓库公开还是私有（免费账号私有仓库不能开 Pages）；公开时页面需标「演示」且禁止搜索引擎收录

## 目录
- `素材/`：谢峰提供的 App 录屏与截图。**不进 git**（可能含账户信息）

## 约定
- 不登录、不操作谢峰的 RockFlow / Bobby 账号；在 bobby.ai 发消息属对外操作，须先问
- 演示数据一律假数据，不接真实行情与交易
- git 署名：Craboss888 / `Craboss888@users.noreply.github.com`（仓库内已配）
