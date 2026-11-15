# 为 Headplane 贡献 {#contributing-to-headplane}

感谢参与。本页翻译上游的贡献规则：上游由原作者独立维护，遵循规则有助于审阅和合并。

本仓库是非官方双语 fork。汉化问题请提交到[维护仓库](https://github.com/CM-Chenqf/headplane-zh-cn/issues)；上游功能问题按以下规则反馈，避免将维护仓库误认为官方中文版。

## 贡献类型 {#contribution-types}

- **错误报告和功能需求**：使用上游预设 [Issue 模板](https://github.com/tale/headplane/issues)。配置或使用问题应到 [Discussions](https://github.com/tale/headplane/discussions)，不作为缺陷或功能请求提交。
- **文档和示例**：发现文档问题或希望补充部署示例时，提交 PR，由维护者审阅调整。
- **代码贡献**：通过 PR 提交，并关联 Issue 或功能请求；不存在时先创建。为 Issue 和 PR 添加合适标签。

### 代码贡献限制 {#code-contribution-restrictions}

- **避免大型重构**：大规模重构难以审阅维护。互不相关的贡献拆成多个 PR。
- **避免变更项目和工具链**：没有充分理由，不更改项目结构、包管理器、Docker 环境、构建和 CI/CD。
- **尽量不破坏兼容性**：现有功能和 API 应保持兼容。必要的破坏性变更先开 Issue 讨论。

### 代码风格 {#code-style}

TypeScript 使用 [oxlint/oxfmt](https://oxc.rs)，`cmd/` 下 Go 使用 Go 默认格式和检查工具。提交前 Git hook 会自动执行相关处理。

> 规则可讨论调整；上游不会仅因未完全遵守就自动关闭贡献，而会协商可行方案。

### 贡献工具 {#contribution-tooling}

开发 WASM SSH Agent 时，需要 `mkcert` 或同类工具，在 `./test/caddy/certs` 准备 `localhost.pem` 和 `localhost-key.pem`。上游说明提供 `pnpm mkcert` 脚本。

### 开发容器 {#development-container}

`./.devcontainer` 包含 Node.js、PNPM、Go、Nix、`mkcert` 和本地证书工具。

在 VS Code 或兼容编辑器中打开仓库并启动容器。首次创建时自动执行 `pnpm install`。

基础镜像使用 Debian 而非 Alpine，以兼容官方 Dev Container 的 Node、Go、Docker 等功能。
