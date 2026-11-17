# 配置 {#configuration}

> Headplane 旧版本仅使用环境变量，不使用配置文件。从 0.5 起，需要手动迁移到新的配置格式。

Headplane 使用配置文件管理设置，参阅 [config.example.yaml](https://github.com/laity-cqf/headplane-zh-cn/blob/stable/config.example.yaml)。默认读取 `/etc/headplane/config.yaml`，可通过 **`HEADPLANE_CONFIG_PATH`** 指定其他位置。

默认数据目录为 `/var/lib/headplane`，各配置节可分别调整。必须保证数据目录持久化，且运行 Headplane 的用户可写。

## 环境变量 {#environment-variables}

环境变量可以覆盖配置文件，覆盖值在文件加载**之后**合并，因此优先级更高。命名格式为 **`HEADPLANE_<SECTION>__<KEY_NAME>`**。例如，使用 `HEADPLANE_OIDC__CLIENT_SECRET` 覆盖 `oidc.client_secret`。

其他示例：

- `HEADPLANE_HEADSCALE__URL` 对应 `headscale.url`。
- `HEADPLANE_SERVER__PORT` 对应 `server.port`。

**此功能默认不启用。** 设置 **`HEADPLANE_LOAD_ENV_OVERRIDES=true`** 后才启用，同时会将相对路径下的 `.env` 文件加载到环境变量中。

> 此机制仅用于覆盖配置字段，不能代替设置 `HEADPLANE_DEBUG_LOG=true`、`HEADPLANE_CONFIG_PATH=/etc/headplane/config.yaml` 等普通环境变量。

## 敏感值 {#sensitive-values}

密钥、密码及私有证书等配置值支持两种方式：

1. 直接在配置文件中提供值，例如 `cookie_secret: "your-32-character-long-secret"`。
2. 使用带 `_path` 后缀的字段，指定保存该值的文件，例如 `cookie_secret_path: "/path/to/your/cookie_secret_file"`。

使用 `_path` 时会读取文件内容作为配置值。路径支持环境变量插值，例如 `${CREDENTIALS_DIRECTORY}/my_secret_file`，适合与 systemd 的 `LoadCredential` 配合。

**双模式字段的规则：**

- 不可同时设置直接值及其对应的 `_path` 字段，否则会产生配置错误。
- 提供 `_path` 后，再同时提供非空直接值，可能被忽略或触发校验错误，具体取决于字段和加载器；应始终只提供一种。
- 环境变量也支持相同机制：`HEADPLANE_OIDC__CLIENT_SECRET` 提供直接值，`HEADPLANE_OIDC__CLIENT_SECRET_PATH` 指定密钥文件。

**路径处理：** 仅明确列入白名单的字段会读取文件内容。其他带 `_path` 后缀的字段只展开环境变量，不读取其内容。

敏感文件路径包括：

- **服务端设置（`server.*`）：**
  - `cookie_secret_path`：用于 Web 会话编码。
  - 必须提供 `cookie_secret` 或 `cookie_secret_path` 之一。
- **Headscale 连接（`headscale.*`）：**
  - `api_key_path`：用于 OIDC、代理认证及 Agent 同步的 Headscale API 密钥。
  - 使用上述功能时，必须提供 `api_key` 或 `api_key_path`。
  - `tls_cert_path` 属于普通路径，不按敏感值文件读取。
- **OIDC 设置（`oidc.*`）：**
  - `client_secret_path`：OIDC 客户端密钥。
  - OIDC 必须提供 `client_secret` 或 `client_secret_path`。
  - `headscale_api_key_path` 已弃用，改用 `headscale.api_key_path`。

**非敏感路径：** 例如 `headscale.config_path` 是可选的 Headscale 配置路径，用于读取或校验配置，而非将整个文件当作一个密钥值。

所有路径字段均支持 `${VAR_NAME}` 插值。例如：

- `HEADPLANE_OIDC__CLIENT_SECRET_PATH=/path/to/secret/file` 从文件读取 OIDC 客户端密钥。
- `HEADPLANE_SERVER__COOKIE_SECRET_PATH=${CREDENTIALS_DIRECTORY}/cookie_secret` 在路径中展开环境变量。

## 调试 {#debugging}

Headplane 使用 Pino 输出逐行 JSON 服务端日志。每条日志包含时间戳、级别、组件和消息（`msg`），便于日志平台筛选与索引。

设置 **`HEADPLANE_DEBUG_LOG=true`** 可启用调试日志。日志量可能迅速增加，不建议在生产环境长期开启。

## TLS 与证书 {#tls-certificates}

进程内 HTTPS 终止、出站连接信任私有 CA、`cookie_secure` 与 Docker 健康检查的交互，参阅 [TLS 与证书](./tls)。

## 反向代理 {#reverse-proxying}

Headscale 与 Headplane 都可使用常见反向代理。以下是 Traefik 示例。

> 示例中的 CORS 中间件用于允许前端与后端通信。使用其他代理时，也需配置必要的响应头。

```yaml
http:
  routers:
    headscale:
      rule: "Host(`headscale.tale.me`)"
      service: "headscale"
      middlewares:
        - "cors"

    rewrite:
      rule: "Host(`headscale.tale.me`) && Path(`/`)"
      service: "headscale"
      middlewares:
        - "rewrite"

    headplane:
      rule: "Host(`headscale.tale.me`) && PathPrefix(`/admin`)"
      service: "headplane"

  services:
    headscale:
      loadBalancer:
        servers:
          - url: "http://headscale:8080"

    headplane:
      loadBalancer:
        servers:
          - url: "http://headplane:3000"

  middlewares:
    rewrite:
      addPrefix:
        prefix: "/admin"
    cors:
      headers:
        accessControlAllowHeaders: "*"
        accessControlAllowMethods:
          - "GET"
          - "POST"
          - "PUT"
        accessControlAllowOriginList:
          - "https://headscale.tale.me"
        accessControlMaxAge: 100
        addVaryHeader: true
```
