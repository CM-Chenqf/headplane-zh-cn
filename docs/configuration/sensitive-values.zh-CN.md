---
title: 敏感值
description: 从独立文件加载敏感信息，避免直接保存在配置文件中。
---

# 敏感值 [#sensitive-values]

敏感信息可以保存在独立文件中。对下列选项，设置对应的 `_path` 字段后，Headplane 会从文件中读取值，并去除前后空白：

| 选项                     | 文件路径选项                  |
| ------------------------ | ----------------------------- |
| `server.cookie_secret`   | `server.cookie_secret_path`   |
| `headscale.api_key`      | `headscale.api_key_path`      |
| `oidc.client_secret`     | `oidc.client_secret_path`     |
| `oidc.headscale_api_key` | `oidc.headscale_api_key_path` |

`oidc.headscale_api_key` 已弃用，改用 `headscale.api_key`。

```yaml
server:
  cookie_secret_path: "/run/secrets/headplane_cookie_secret"
```

直接值与对应 `_path` 只能设置一个。同时设置两者，或文件无法读取时，Headplane 会拒绝启动。

## 路径中的环境变量 [#environment-variables-in-paths]

这些敏感值路径支持 `${NAME}` 形式的环境变量，可与 systemd 的 `LoadCredential` 配合：

```yaml
headscale:
  api_key_path: "${CREDENTIALS_DIRECTORY}/headscale_api_key"
```

路径中引用了未设置的变量时，Headplane 会拒绝启动。其他以 `_path` 结尾的选项（例如 `headscale.config_path`）是普通文件路径，不会从中读取敏感值，也不会展开环境变量。

## 通过环境变量设置 [#as-environment-variables]

这些 `_path` 选项也支持[环境变量](/configuration#environment-variables)，例如 `HEADPLANE_OIDC__CLIENT_SECRET_PATH=/run/secrets/oidc`。
