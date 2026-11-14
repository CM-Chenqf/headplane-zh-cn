# Headscale Web 双语版本维护

此仓库基于 `tale/headplane`，目标为完整保留上游功能，并提供英文、简体中文界面与文档。当前已完成仓库与自动化基础配置，以及中英切换、登录、公共导航、设备、用户和访问控制模块翻译；尚未完成全部界面和文档，不要把此阶段的构建称为完整汉化版。

## 双语功能进度

- 已完成：请求级语言识别、浏览器偏好 Cookie、中英切换、登录与退出、API 密钥错误、SSO 配置及登录错误、公共导航与主题选项、相对时间与日期提示、设备密钥过期提示，以及设备列表、详情、筛选、操作菜单、弹窗、表单校验和操作结果。公共错误页和设备使用的复制、表单、徽标等组件也已接入翻译。
- 用户模块已完成：用户列表、账号关联、角色及权限说明、所有权转移、用户组、操作结果和服务端错误，以及登录后关联页面和成员设备接入首页。权限、角色标识、用户名规则和 Headscale API 行为保持上游一致。
- 访问控制已完成：访问规则、授权规则、SSH 策略、主机别名、自动批准者、标签和用户组，文件与差异编辑器、查找替换等编辑器提示、HuJSON 语法诊断与行列位置、只读和权限提示及保存结果。策略字段、未知操作、额外配置与上游版本限制保持不变。
- 英文资源：`app/i18n/en.ts`；中文资源：`app/i18n/zh-CN.ts`。两者一起更新，类型检查校验键名，单元测试校验句子占位符。
- 使用及维护说明：`docs/features/language.mdx`；设备操作指南：`docs/features/machines-bilingual.mdx`；用户操作指南：`docs/features/users-bilingual.mdx`；访问控制指南：`docs/features/acls-bilingual.mdx`，均含中英文说明。
- 当前仅在 `main` 建立双语基础，尚未适配 `release/0.8`，尚未发布双语镜像或部署完整中文文档。
- 待完成：DNS、设置及其操作结果与服务端错误、浏览器 SSH、完整文档及搜索、完整漏译和文档过期检查。Headscale 原始诊断保留原文，中文界面附说明与 HTTP 状态。

## 仓库和分支

- 维护仓库：`CM-Chenqf/headscale-web`。
- 上游仓库：`tale/headplane`。
- 原空仓库保留为 `CM-Chenqf/headscale-web-empty`。
- 本地 `origin` 指向维护仓库，`upstream` 指向上游。
- 跟踪上游 `main` 和 `release/X.Y`；兼容范围和测试版本沿用各对应分支，不单独扩大支持承诺。
- 功能和汉化改动保存在维护分支中，使用合并上游提交的方式升级。不要用上游分支强制覆盖维护分支。

本阶段的基础配置先落到 `main`。已继承的 `release/0.8` 文档工具链与 `main` 不同，需要在对应版本的汉化阶段单独适配发布配置，不直接覆盖成 `main` 的文档站。任何发布分支都要完成双语和发布配置验收后再发版。

## 上游更新和汉化提醒

`Upstream sync` 每天北京时间 09:27 发起检查，也支持手动运行。GitHub 定时任务可能延迟运行；仓库长期不活跃导致定时任务停用时，需要在 Actions 页面重新启用。

流程检测到尚未合并的上游提交时：

1. 为对应分支和提交建立独立的 `sync/upstream/...` 分支并打开同步 PR。
2. 按界面与提示、文档、其他功能列出变更文件，附带汉化检查清单。
3. 建立或更新分配给 `CM-Chenqf` 的跟踪 Issue；清单变化时追加评论，供 GitHub 发送通知。

同一提交重复检查不会反复开 PR 或追加评论。自动化不强推维护者的分支，不自动合并，不导入上游标签，也不自动发布。新发布线如果尚未在 fork 建立，先在 Issue 提醒创建，避免自动创建一个缺少中文改动的发布分支。

优先使用普通 merge commit 合并同步 PR。同一发布线出现多个待处理 PR 时，处理最新 PR，再关闭已经包含在其中的旧 PR。关闭但未合并的 PR 仍会在跟踪 Issue 中保留，便于明确决定是否跳过。

仓库设置需要启用 Issues、GitHub Actions，以及 Actions 创建 PR 的权限。若 GitHub 要求批准自动创建 PR 的工作流运行，在 PR 页面批准。将仓库加入 Watch 或订阅跟踪 Issue，并在 GitHub 个人通知设置中启用需要的通知渠道。

默认使用仓库的 `GITHUB_TOKEN`。如果上游更新包含 `.github/workflows/` 的变更，而 GitHub 拒绝该令牌推送工作流文件，需要额外配置仅限本仓库的 `UPSTREAM_SYNC_TOKEN` Secret：使用具有 Contents、Pull requests、Issues、Workflows 写入权限的 fine-grained token。不要关闭工作流文件同步来绕过权限错误。使用自定义令牌后创建的 PR，其检查触发规则也应在仓库中实际验证。

此阶段的提醒基于上游提交和文件变更，是翻译工作清单；后续双语基础阶段再加入语言键缺失、英文变更和中文文档过期的精确检查，不能把文件提醒视作完整漏译检测。

## Docker 镜像

继续使用上游多阶段 Dockerfile、Go/WASM 模块、Agent、健康检查和 GitHub Actions 发布流程：

- 镜像仓库：`ghcr.io/cm-chenqf/headscale-web`，OCI 仓库路径使用小写。
- 架构：`linux/amd64`、`linux/arm64`。
- 类型：`final` 普通版、`debug-shell` 调试版。
- 标签：完整版本号、次版本号、`latest`，以及对应的 `-shell` 标签。
- 缓存：GitHub Actions 构建缓存。
- 构建来源证明：沿用上游 provenance attestation。
- 权限：使用工作流自带 `GITHUB_TOKEN`，包含 `packages: write`、`id-token: write` 和 `attestations: write`。

通过维护分支的正式发版提交创建并推送版本标签，才能发布对应的双语镜像。`main` 提交不会自动更新镜像。不要重新推送全部历史标签，否则会触发历史版本构建；也不要在旧的上游提交上打标签，误发没有汉化的镜像。

首次发布后，检查 GHCR 中包的可见性。需要匿名拉取时，将包设为 Public，并分别在 amd64、arm64 环境验证启动、登录和健康检查。本阶段未创建或发布双语镜像。

## Cloudflare Pages

沿用上游正式文档、开发预览文档、历史版本归档的发布方式。

先在 Cloudflare 创建两个用于 Direct Upload 的 Pages 项目，然后在 GitHub 仓库的 Settings → Secrets and variables → Actions 配置：

| 类型     | 名称                         | 用途                                                                |
| -------- | ---------------------------- | ------------------------------------------------------------------- |
| Secret   | `CF_API_TOKEN`               | 具备目标账号 Cloudflare Pages 编辑权限的 API Token                  |
| Secret   | `CF_ACCOUNT_ID`              | Cloudflare 账号 ID                                                  |
| Variable | `CF_PAGES_PROJECT`           | 正式文档项目名，默认 `headscale-web-docs`                           |
| Variable | `CF_PAGES_BETA_PROJECT`      | 预览文档项目名，默认 `headscale-web-docs-beta`                      |
| Variable | `HEADPLANE_DOCS_ORIGIN`      | 正式文档来源地址，不带末尾斜杠；默认使用正式项目的 `pages.dev` 地址 |
| Variable | `HEADPLANE_DOCS_BETA_ORIGIN` | 预览文档来源地址，不带末尾斜杠；默认使用预览项目的 `pages.dev` 地址 |
| Variable | `CF_PAGES_DEPLOY_ENABLED`    | 确认项目及凭据配置完成后设为 `true`，开启部署                       |

Token 仅存入 GitHub Secrets，不写入仓库，也不在聊天中提供。

未开启部署时，预览文档仍会构建并保存为 Actions artifact。正式文档由稳定版发布后生成，附加到对应 GitHub Release；未开启部署或选择 dry-run 时，组装后的站点也只保存为 artifact。自定义域名上线前，先更新两个文档来源变量，再重新构建，避免版本切换跳回上游网站。

文档相关 PR 先运行 `Docs (check)`，只验证构建，不部署。

## 本地检查

项目的 Node、pnpm 版本以 `package.json` 中的 `engines` 为准；不要为迁就本地旧版本而降级上游依赖。

```bash
node --test .github/scripts/sync-upstream.test.cjs
pnpm test:unit
pnpm typecheck
pnpm docs:build
```

路由、认证、Headscale API 等功能变更，还要按 `AGENTS.md` 运行相关集成测试。镜像构建、发布、Cloudflare 部署需要分别查看各工作流结果，不能只凭配置文件存在就视为成功。

## 后续阶段

1. 中英切换与登录样板已完成，继续按模块扩展语言资源。
2. 翻译全部界面、表单校验、服务端可见错误、时间与 SSH 提示。
3. 建立双语文档路由、导航和搜索，翻译全部文档并处理截图。
4. 加入精确漏译检查及中文文档过期检查。
5. 验证上游支持的兼容版本、两种镜像及两个架构，再发布完整双语版本。
