<div lang="zh-CN">

# 语言与发布线维护

[English](/features/language)

本页说明社区维护仓库 `CM-Chenqf/headplane-zh-cn` 的 **0.8 发布线**，基于上游 [tale/headplane](https://github.com/tale/headplane) 0.8.2，**不是 Headplane、Headscale 或 Tailscale 官方中文版**。保留上游 MIT 许可证原文及原作者版权声明。本发布线保留原有界面、VitePress 文档工具链、配置、权限及兼容要求，不引入 `main` 的新版界面或新功能。

## 当前范围 {#current-scope}

语言偏好、API 密钥登录及错误、SSO 配置与登录提示、退出、公共导航、主题标签、连接横幅、复制控件、弹窗按钮和公共错误说明已支持英文与简体中文。

[设备模块](/zh-CN/features/machines-bilingual)也已支持双语列表、详情、筛选、管理弹窗、校验及操作结果、徽标和日期。设备原始值、命令、权限及 Headscale 能力检查保留原有行为。

[用户、角色与账号关联](/zh-CN/features/users-bilingual)也已支持双语账号列表、创建及管理弹窗、策略用户组、所有权转移、首页关联选择器及成员下载页。本地表单错误跟随语言切换并保留草稿，原有标识符、权限及 API 诊断保持不变。

访问控制及编辑器、DNS、设置、浏览器 SSH 和其余文档仍需适配。目前切换语言后，这些页面仍会显示英文。当前属于未完成的开发分支，不能称为完整汉化发行版；剩余模块和发布检查完成前，不将任何标签或镜像作为完整汉化版本部署。

## 选择界面语言 {#choose-the-interface-language}

使用登录页、退出页或管理界面顶部的语言按钮。首次访问按 `Accept-Language` 选择英文或简体中文；其他中文语言变体统一使用简体中文，不支持的语言回退到英文。

`headplane_locale` 浏览器 Cookie 保存偏好一年，清除后恢复跟随浏览器语言。偏好在登录前后均有效，不更改账号、认证 Cookie、角色、Headscale 配置、其他浏览器或返回地址。语言端点只接受 POST 提交的单个受支持语言值，不接受跳转目标。

命令、API 字段、配置键、产品名、用户输入及原始服务端诊断保留原文；中文错误说明继续展示原始诊断数据。维护文档站完成前，应用内文档按钮继续打开上游英文站。

## 检查与复核改动 {#check-and-review-changes}

使用本发布线要求的 Node 和 pnpm 版本运行检查：

```bash
pnpm i18n:check
pnpm test:unit
pnpm typecheck
pnpm docs:build
```

`i18n:check` 只验证 `.github/i18n/scope.json` 列出的已完成文件和文档对，同时检查实际语言资源、占位符、硬编码文案及逐项复核指纹。检查通过**不代表**整个 0.8 界面或文档已完成汉化，输出会明确列出待完成模块。

同时核对变更后的英文与中文，先格式化，再仅记录已完成的复核项：

```bash
pnpm i18n:review --message login.welcome
pnpm i18n:review --file docs/features/language.md
pnpm i18n:review --file app/layout/header.tsx
pnpm i18n:check
```

参数可重复，文档对使用英文路径。检查命令不更新记录，复核一项也不会放行其他项目。技术例外必须有确切消息键，或确切文件及代码文本，并说明理由。初始化参数 `--initialize` 拒绝覆盖已有基线。

静态扫描不能证明译文质量，也无法追踪所有动态消息、第三方组件及远端终端输出。仍需验收两种语言流程并审阅上游实际差异。`release/0.8` 与 `main` 分别维护；合并上游发布线更新后，按本发布线的行为调整翻译。

## 发布状态 {#publication-status}

由于适配和验收尚未完成，`pnpm i18n:release` 当前会失败。版本标签触发的发布流程也会在发布前检查这一状态，不通过清空待办或错误标记完成来绕过检查。

发布线文档构建保留上游根路径及 `/0.8/` 归档格式。适配期间只上传 Actions 构建产物；上传到 GitHub Release 需要已完成的翻译范围、维护仓库中实际存在的发行版及发布模式。单独推送文档不会创建发行版。Cloudflare 部署仍由 `main` 上单独配置的流程负责，属于后续验收步骤。

</div>
