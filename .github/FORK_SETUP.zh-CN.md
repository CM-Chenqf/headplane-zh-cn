# Headplane zh-CN 双语版本维护（非官方）

维护仓库为 `CM-Chenqf/headplane-zh-cn`，是基于 [tale/headplane](https://github.com/tale/headplane) 的社区双语 fork，不是 Headplane、Headscale 或 Tailscale 官方中文版。保留上游 `LICENSE` 原文及原作者署名；上游网站、历史发行说明和源码示例仍明确标注来源。

此仓库基于 `tale/headplane`，目标为完整保留上游功能，并提供英文、简体中文界面与文档。当前已完成仓库与自动化基础配置，以及中英切换、登录、公共导航、设备、用户、访问控制、DNS、设置和浏览器 SSH 模块翻译；文档站已接入双语正文、导航、搜索、历史更新日志和升级说明。翻译、文档及容器验收已完成；实际正式发布结果以 GitHub Releases 为准，不要把此阶段的构建称为已正式发布的完整汉化版。

## 双语功能进度

- 已完成：请求级语言识别、浏览器偏好 Cookie、中英切换、登录与退出、API 密钥错误、SSO 配置及登录错误、公共导航与主题选项、相对时间与日期提示、设备密钥过期提示，以及设备列表、详情、筛选、操作菜单、弹窗、表单校验和操作结果。公共错误页和设备使用的复制、表单、徽标等组件也已接入翻译。
- 用户模块已完成：用户列表、账号关联、角色及权限说明、所有权转移、用户组、操作结果和服务端错误，以及登录后关联页面和成员设备接入首页。权限、角色标识、用户名规则和 Headscale API 行为保持上游一致。
- 访问控制已完成：访问规则、授权规则、SSH 策略、主机别名、自动批准者、标签和用户组，文件与差异编辑器、查找替换等编辑器提示、HuJSON 语法诊断与行列位置、只读和权限提示及保存结果。策略字段、未知操作、额外配置与上游版本限制保持不变。
- DNS 已完成：常规设置、Magic DNS、覆盖本地 DNS、全局与分域 DNS 服务器、搜索域、A/AAAA 记录、添加和移除弹窗、排序按钮、表单校验及服务端操作结果。权限、原始配置值、配置文件写入、重启与记录热更新流程保持不变。
- 设置已完成：认证密钥列表、筛选、创建与过期弹窗、有效期校验、OIDC 域名/用户组/用户限制、Agent 状态与已知不可用原因、同步覆盖情况和诊断说明。本人密钥边界、原始字段及数值、配置写入、重启和 Agent 版本要求保持不变。
- 浏览器 SSH 已完成：用户名表单、离线页面、版本兼容提醒、连接状态、重新认证提示、错误页和文档按钮。切换语言不会重新申请连接密钥或重建终端；身份限制、临时密钥、远端输出、诊断原文和原有兼容要求保持不变。
- 英文资源：`app/i18n/en.ts`；中文资源：`app/i18n/zh-CN.ts`。两者一起更新，类型检查校验键名，单元测试校验句子占位符。
- 文档已完成：英文保留原 URL，简体中文使用 `/zh-CN/`；首页、侧栏、主题、搜索、版本切换、错误页及文档组件提示跟随语言。全部 28 个文档页面均有中文对应文件，中文历史更新日志位于 `CHANGELOG.zh-CN.md`。命令、配置值、产品标识和原始诊断保留原文，上游界面截图注明为英文截图。
- 使用及维护说明：`docs/features/language.mdx`；设备、用户、访问控制、DNS、设置和 SSH 操作指南保留原 `*-bilingual.mdx` 地址，并拆分同目录的 `*.zh-CN.mdx` 中文文件。旧地址不变，文档顶部按钮切换语言，搜索按语言隔离。
- `main` 已接入双语界面、文档和翻译复核检查；`stable` 已完成语言基础、登录、公共界面、设备、用户、角色、账号关联和成员下载页，以及访问控制的五类可视化编辑器、文件编辑、差异预览及诊断，并配有对应双语指南。0.8 仍使用首页自助关联及原有 VitePress 工具链，权限、用户名规则及兼容范围不变；访问控制保留原始策略值、未知字段和动作、注释警告，并在切换语言时保留草稿，不引入 main 的 Grants 或自动批准者可视化编辑器。尚未正式发布双语镜像；双语文档保留源码及发行快照，不托管站点。
- `stable` 已补齐 DNS、设置（预授权密钥、认证限制和 Agent）、浏览器 SSH 及完整 VitePress 文档，包含双语导航、搜索、安装、配置、NixOS 选项及完整历史更新日志。语言切换保留表单草稿和 SSH 会话，仍沿用 0.8 的权限、配置和版本矩阵。
- 翻译及容器验收已完成，待运行正式发布及匿名拉取检查。Headscale 原始诊断保留原文，中文界面附说明与 HTTP 状态。

## 仓库和分支

- 维护仓库：`CM-Chenqf/headplane-zh-cn`。
- 上游仓库：`tale/headplane`。
- 原空仓库仍保留为 `CM-Chenqf/headscale-web-empty`，这是历史留存仓库，不是当前维护仓库。
- 本地 `origin` 指向维护仓库，`upstream` 指向上游。
- 只保留两条长期维护分支：`main` 跟随上游 `main`，`stable` 跟随上游最新已发布正式版标签；兼容范围和测试版本沿用对应上游版本，不单独扩大支持承诺。
- 功能和汉化改动保存在维护分支中，使用合并上游提交的方式升级。不要用上游分支强制覆盖维护分支。

自动化基础配置位于 `main`。`stable` 保留 VitePress 文档工具链及自身的阶段翻译检查，文档构建目前仅保存产物；0.8 界面及完整文档的翻译覆盖已完成，仍沿用 VitePress，不直接覆盖成 `main` 的文档站。任何发布分支都要完成双语和发布配置验收后再发版。

## 上游更新和汉化提醒

`Upstream sync` 每天北京时间 09:27 发起检查，也支持手动运行。GitHub 定时任务可能延迟运行；仓库长期不活跃导致定时任务停用时，需要在 Actions 页面重新启用。

流程检测到尚未合并的上游提交时：

1. 为对应分支和提交建立独立的 `sync/upstream/...` 分支并打开同步 PR。
2. 按界面与提示、文档、其他功能列出变更文件，附带汉化检查清单。
3. 建立或更新分配给 `CM-Chenqf` 的跟踪 Issue；清单变化时追加评论，供 GitHub 发送通知。

同一提交重复检查不会反复开 PR 或追加评论。自动化不强推维护者的分支，不自动合并，不导入上游标签，也不自动发布。上游发布新的正式版后，继续向固定 `stable` 分支创建同步 PR，不再新建长期版本分支；缺失固定分支时报告错误并提醒恢复。

优先使用普通 merge commit 合并同步 PR。同一发布线出现多个待处理 PR 时，处理最新 PR，再关闭已经包含在其中的旧 PR。关闭但未合并的 PR 仍会在跟踪 Issue 中保留，便于明确决定是否跳过。

仓库设置需要启用 Issues、GitHub Actions，以及 Actions 创建 PR 的权限。若 GitHub 要求批准自动创建 PR 的工作流运行，在 PR 页面批准。将仓库加入 Watch 或订阅跟踪 Issue，并在 GitHub 个人通知设置中启用需要的通知渠道。

默认使用仓库的 `GITHUB_TOKEN`。如果上游更新包含 `.github/workflows/` 的变更，而 GitHub 拒绝该令牌推送工作流文件，需要额外配置仅限本仓库的 `UPSTREAM_SYNC_TOKEN` Secret：使用具有 Contents、Pull requests、Issues、Workflows 写入权限的 fine-grained token。不要关闭工作流文件同步来绕过权限错误。使用自定义令牌后创建的 PR，其检查触发规则也应在仓库中实际验证。

同步提醒基于上游提交和文件变更，提供翻译工作清单。`Translations` 工作流另行检查语言键、英文变更和文档复核指纹；`stable` 的翻译检查现已覆盖完整界面与文档；正式发布和实际镜像拉取仍需分别核对结果，不能把翻译检查通过视为允许发布。

## Docker 镜像

继续使用上游多阶段 Dockerfile、Go/WASM 模块、Agent、健康检查和 GitHub Actions 发布流程：

- 镜像仓库：`ghcr.io/cm-chenqf/headplane-zh-cn`，OCI 仓库路径使用小写。
- 架构：`linux/amd64`、`linux/arm64`。
- 类型：`final` 普通版、`debug-shell` 调试版。
- 标签：社区完整版本号（如 `v0.8.2-zh`，与 GitHub Release 标签一致）、次版本号（`0.8`）、`latest`，以及对应的 `-shell` 标签。完整版本号不重复使用，次版本号和 latest 别名随发行前移。
- 缓存：GitHub Actions 构建缓存。
- 构建来源证明：沿用上游 provenance attestation。
- 权限：使用工作流自带 `GITHUB_TOKEN`，包含 `packages: write`、`id-token: write` 和 `attestations: write`。

通过 `stable` 已验收提交创建并推送 `vX.Y.Z-zh` 标签，才能发布社区双语镜像。工作流只响应社区标签并严格校验，不响应继承的上游 `vX.Y.Z` 标签；`-zh` 标明非官方双语版本，不标记为测试版；每个上游版本只正式发布一次，不添加修订号。`main` 的 development 通道禁止正式发布。不要重新推送全部历史标签，也不要在旧的上游提交上打社区标签。上游 `pnpm release cut` 在本 fork 中禁止使用，避免误改上游版本号和标签。

### 固定分支、验收与发行留存

1. 上游发布正式版后，将对应标签提交合并到 `stable`，保留中文改动、上游历史和对应版本的依赖、构建工具及兼容矩阵。开发变动仍合并到 `main`。
2. 更新 `.github/fork-release.json` 的上游版本和 40 位提交，使用 schemaVersion=2，不设置 revision。发布后同一上游版本的汉化、打包及文档修正保留在维护分支，随下一个上游版本正式发布。升级时先将 publicationReady 设为 false；如有翻译待办，同步保留翻译 scope 的门禁。
3. 逐项翻译并复核差异，运行翻译、构建、单元与相关集成检查。`Containers (check)` 构建 final/debug-shell × amd64/arm64，按当前源码的标准版本矩阵启动真实 Headscale，验证镜像平台、健康检查、中英登录页、真实 API 密钥登录及登录后设备页。arm64 在 QEMU 下验收。
4. 容器和双语文档验收通过后，将 publicationReady 设为 true，并在适用的 scope 中清空待办、标记完成。再次合并到 `stable` 并等待该精确提交的全部检查通过。
5. 从干净的 `stable` 工作区创建单个标签并推送，不使用 `--follow-tags`：

   ```bash
   node .github/scripts/fork-release.cjs tag
   # 以命令实际输出的标签为准
   git push origin refs/tags/v0.8.2-zh
   ```

6. 发布前再次核对 stable 精确提交、上游标签 SHA、CI 和翻译状态，确认完整镜像标签未被使用。只有明确的 registry manifest 不存在响应才允许继续；认证、限流、网络或服务器错误均失败退出。
7. 两种镜像分别构建 amd64/arm64 清单，保存摘要及来源证明；从 GHCR 拉取精确摘要，在两种架构上对真实 Headscale 再次验证运行。检查通过后，GitHub Release 先以 draft 上传全部附件，再正式发布锁定。保留 `source.tar.gz`、`docs-root.tar.gz`、`docs-archive.tar.gz`、`release-manifest.json`、`SHA256SUMS`，同时保留 GitHub 自带的 Source code ZIP/tar.gz。
8. Release 已发布后才前移镜像 latest/次版本别名。每个 Release 保留本版本的源码、双语文档快照和镜像摘要；历史文档从对应 Release 下载，不额外部署文档站。

仓库开启 immutable releases 和合并后自动删除分支。不得移动已发行标签、覆盖完整版本镜像、使用 `--clobber` 修改历史发行附件，也不配置自动删除历史镜像的清理规则。临时 PR 分支合并后删除；历史版本使用 Tag/Release 定位，无需长期保留对应分支。旧上游标签仅保留历史用途，不表示本 fork 发布过这些版本。

发布失败时先查看已经推送的镜像和 draft，不盲目重跑覆盖。尚未正式发布的失败候选保留供排查；确认镜像、附件及摘要状态后，只恢复尚未完成的步骤，不覆盖已有产物。若 Release 已发布、仅别名更新失败，单独恢复别名，无需重发完整镜像。

分支上的文档构建只生成临时 Actions artifact；文档热修随下一个上游版本发布，不再覆盖旧 Release 附件。这里的归档保留依赖 GitHub/GHCR 及仓库管理员持续保留数据，不是外部备份承诺。

首次发布后，检查 GHCR 中包的可见性；用于公开部署时将包设为 Public。运行 `Published images (check)`，输入正式标签，验证公开 Release 附件、源码 SHA、校验和，以及两种镜像在 amd64/arm64 上的匿名拉取、启动、中英登录和真实 Headscale 健康。本阶段未创建或发布双语镜像。

## 双语文档与归档

不部署托管文档站，不需要文档托管账号、项目或部署凭据。

- 日常阅读：查看仓库内英文及简体中文文档源码。部分页面含组件，完整显示时使用本地预览。
- 本地预览：安装 package.json 要求的 Node、pnpm 后，执行 `pnpm install --frozen-lockfile` 和 `pnpm docs:dev`。应用与文档的中英切换保留。
- 正式版本：从 GitHub Release 下载 `docs-root.tar.gz` 或 `docs-archive.tar.gz`，解压后用静态 HTTP 服务打开。后者保留上游 `/X.Y/` 路径格式，服务需挂载到该路径；静态快照无需部署 Headplane。
- 开发预览：文档 PR 只运行构建检查；分支构建只保存临时 Actions artifact。正式文档快照随新上游版本发布并长期留存于对应 Release，不覆盖旧附件。

镜像和 Release 发布使用 GitHub Actions 自带的 `GITHUB_TOKEN`；无需额外配置文档部署密钥。上游同步令牌的适用条件仍见前文。

## 本地检查

项目的 Node、pnpm 版本以 `package.json` 中的 `engines` 为准；不要为迁就本地旧版本而降级上游依赖。

```bash
node --test .github/scripts/*.test.cjs
pnpm i18n:check
pnpm test:unit
pnpm typecheck
pnpm docs:build
```

路由、认证、Headscale API 等功能变更，还要按 `AGENTS.md` 运行相关集成测试。镜像构建、发布和文档归档需要分别查看各工作流结果，不能只凭配置文件存在就视为成功。

`Translations` 工作流检查消息、文档配对及翻译复核指纹。英文单独更新同样会要求复核；检查只读，不会自动放行。确认中文语义、命令及配置值后，使用 `pnpm i18n:review --message KEY` 或 `pnpm i18n:review --file ENGLISH_PATH` 记录指定项，再运行检查。参数可重复，文档对使用英文路径。只改共享文档代码时也需确认内联双语文案。完整范围和限制见 `.github/I18N_AUDIT.zh-CN.md`；要求强制阻止未通过的 PR 合并时，将 `Translation completeness and freshness` 配为分支保护必需检查。

## 后续阶段

1. 登录、公共导航、设备、用户、访问控制、DNS、设置及浏览器 SSH 双语已接入；继续进行场景验收。
2. 界面、表单校验、服务端可见错误、时间及 SSH 提示已有双语资源；保留原始诊断和远端输出。
3. 双语文档路由、导航、搜索、全部正文和历史日志已接入；截图沿用上游英文图并说明来源，中文截图可后续更新。
4. 漏译扫描、文档配对、翻译复核指纹及 CI 已接入；每次上游同步按检查结果逐项核对中文。
5. 验证上游支持的兼容版本、两种镜像及两个架构，再发布完整双语版本。
