# stable 汉化与发行进度（当前上游 0.8.2）

- 维护分支：`stable`。
- 上游基线：`tale/headplane` 的 `05e3ee33f6d3b347013654c69186791347be8bd9`（0.8.2）。
- 保留原有界面、VitePress、依赖锁文件、安全补丁、配置、Headscale 版本要求、Agent 和 WASM 构建流程。
- 不把 `main` 的新版界面、授权规则、配置语义或支持范围合并到旧发布线。

## 本批已接入

请求级语言识别、偏好 Cookie、登录前后语言切换、API 密钥登录及原有各校验分支、SSO 配置和登录错误、退出、公共导航及主题、连接横幅、复制提示、弹窗按钮、数值控件及公共错误说明。原始 API 状态、诊断内容和技术字段继续保留。

说明文档：`docs/features/language.md` 和 `docs/zh-CN/features/language.md`。全部 VitePress 页面现已有中文对应页、双语导航、搜索与语言切换，支持根路径及 /0.8/。

设备模块已接入：列表、详情、筛选及排序、操作菜单、注册及管理弹窗、表单校验、服务端结果、状态徽标、日期和相对时间。保留原有表单字段、注册用户名、权限及 Headscale 能力判断；标签错误保留 HTTP 状态和原始诊断。使用指南为 `docs/features/machines-bilingual.md` 和 `docs/zh-CN/features/machines-bilingual.md`。

用户模块已接入：账号及未关联用户列表、角色说明、创建及管理弹窗、所有权转移、策略用户组、首页自助关联及无控制台权限成员的下载页。用户名规则、角色标识、权限与 API 行为不变；表单校验错误支持语言切换并保留草稿。指南为 `docs/features/users-bilingual.md` 和 `docs/zh-CN/features/users-bilingual.md`。

检查范围由 `.github/i18n/scope.json` 明确列出，复核记录在 `.github/i18n/reviewed.json`。`pnpm i18n:check` 是阶段检查，输出明确列出未完成模块；不能把通过结果当作完整汉化证明。英文变更、中文变更和已完成源码变更均需逐项复核。技术例外精确匹配且有理由，失效例外会报错。

访问控制模块已接入：规则、SSH 规则、主机别名、标签与用户组五类编辑器及弹窗、文件编辑、差异预览、权限与只读提示、解析说明和原始诊断。语言切换保留草稿；未知字段、未知动作、注释警告、原权限和版本矩阵不变。指南为 `docs/features/acls.md` 和 `docs/zh-CN/features/acls.md`。

## 本轮完成

DNS、设置（预授权密钥、认证限制、Agent）、浏览器 SSH 和完整 VitePress 文档均已接入中英切换。语言切换保留表单草稿，不重新申请 SSH 密钥或重建终端。文档含安装、配置、SSO、Nix / NixOS、开发、安全、贡献及完整历史日志；旧版截图标注上游英文来源。

## 后续发布验收

原有兼容性矩阵继续由真实 Headscale CI 验证。后续需完成普通版与调试版镜像在 amd64/arm64 的构建和运行验收，再进行正式发行与 Cloudflare 部署。翻译已完成不等于这些发布操作已完成，scope.complete 继续为 false，pending 仅保留 Docker and deployment acceptance。

上游更新提醒仍由 `main` 的 `Upstream sync` 工作流跟踪本分支；翻译改动随本发布线保留，不用上游强制覆盖。

版本标签发布前执行翻译完成状态检查。当前翻译覆盖已完成，但发布验收未完成，仍阻止镜像发布。文档推送会生成根路径和归档构建产物；尚无维护仓库发行版或未完成适配时，不向继承的上游版本号上传文档，也不触发 Cloudflare 部署。

维护分支固定为 stable，未来升级不新建 release/X.Y。社区发行使用 vX.Y.Z-zh.N 标签；源码、双语文档、完整版本镜像及摘要按发行保留。
