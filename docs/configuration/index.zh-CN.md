---
title: 配置
description: 使用配置文件和环境变量配置 Headplane。
---

# 配置 [#configuration]

Headplane 从 YAML 文件读取设置，默认路径为 `/etc/headplane/config.yaml`，也可通过 `HEADPLANE_CONFIG_PATH` 指定其他位置。[示例配置](https://github.com/tale/headplane/blob/main/config.example.yaml)说明了每个选项。只有 `headscale.url` 和 `server.cookie_secret` 是必填项，其他选项都有默认值。

从旧版本升级时，参阅[升级](/upgrading)了解变化。

## 数据目录 [#data-directory]

Headplane 将数据库和 Agent 状态保存在 `server.data_path`，默认为 `/var/lib/headplane`。该目录必须持久化，并允许 Headplane 写入。在 Docker 中应将其挂载为卷。

## 环境变量 [#environment-variables]

所有接受单个值的选项都可通过环境变量设置，且环境变量优先于配置文件。列表和映射（例如 `server.proxy_auth.allowed_cidrs`）只能在文件中设置。将选项路径用双下划线连接，转为大写，再添加 `HEADPLANE_` 前缀：

| 选项                 | 环境变量                        |
| -------------------- | ------------------------------- |
| `headscale.url`      | `HEADPLANE_HEADSCALE__URL`      |
| `server.port`        | `HEADPLANE_SERVER__PORT`        |
| `oidc.client_secret` | `HEADPLANE_OIDC__CLIENT_SECRET` |

`true`、`false` 和数字会转换为相应类型。完全没有配置文件时，Headplane 也可以仅通过环境变量运行。

:::note
旧版本只有在设置 `HEADPLANE_LOAD_ENV_OVERRIDES` 时才读取这些变量，还会加载 `.env` 文件。现在始终读取环境变量，`HEADPLANE_LOAD_ENV_OVERRIDES` 已弃用，也不再加载 `.env` 文件。
:::

敏感信息还可以从独立文件读取，参阅[敏感值](/configuration/sensitive-values)。

## 调试日志 [#debug-logging]

Headplane 使用换行分隔的 JSON 日志，每行包含时间戳、级别、组件和消息，可供日志工具直接索引。设置 `HEADPLANE_DEBUG_LOG=true` 可启用调试日志。调试输出较多，避免在生产环境长期启用。
