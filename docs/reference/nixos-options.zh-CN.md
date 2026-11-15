---
title: NixOS 模块选项
description: Headplane NixOS 模块的全部选项。
---

# NixOS 模块选项 [#nixos-module-options]

全部选项必须位于 `services.headplane` 下。

例如，`settings.headscale.config_path` 的完整名称是 `services.headplane.settings.headscale.config_path`。

## debug

_说明：_ 启用调试日志。

_类型：_ 布尔值

_默认值：_ `false`

## enable

_说明：_ 是否启用 Headplane。

_类型：_ 布尔值

_默认值：_ `false`

_示例：_ `true`

## package

_说明：_ 使用的 Headplane 软件包。

_类型：_ 软件包

_默认值：_ `pkgs.headplane`

## settings

_说明：_ Headplane 配置选项，用于生成 YAML 配置文件。参阅：https://github.com/tale/headplane/blob/main/config.example.yaml

_类型：_ 子模块

_默认值：_ `{ }`

## settings.headscale

_说明：_ Headplane 集成所需的 Headscale 设置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.headscale.api_key_path

_说明：_ 保存 Headscale API 密钥的文件路径。OIDC 认证和 Headplane Agent 需要此密钥。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"config.sops.secrets.headscale_api_key.path"`

## settings.headscale.config_path

_说明：_ Headscale 配置文件路径。此项可选，但强烈建议设置，以获得完整管理体验。文件只读时，Web 界面显示配置，但不能修改。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"/etc/headscale/config.yaml"`

## settings.headscale.config_strict

_说明：_ 已弃用。Headplane 不再校验完整的 Headscale 配置，此选项不再生效。

_类型：_ 布尔值

_默认值：_ `true`

## settings.headscale.dns_records_path

_说明：_ Headscale 配置了 `dns.extra_records_path` 时，Headplane 会自动读取该路径。只有 Headplane 需要通过不同路径访问同一文件时才设置本项。确保 Headplane 进程具有读写权限。修改此文件中的 DNS 记录无需自动重启 Headscale。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"/var/lib/headplane/extra_records.json"`

## settings.headscale.public_url

_说明：_ 与内部连接地址不同时使用的公网 URL，影响部分 Web 界面。

_类型：_ null 或字符串

_默认值：_ `null`

_示例：_ `"https://headscale.example.com"`

## settings.headscale.tls_cert_path

_说明：_ 保存 TLS 证书的文件路径。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"config.sops.secrets.tls_cert.path"`

## settings.headscale.url

_说明：_ Headscale 实例的 URL，所有 API 请求都通过此地址发送。这是 HTTP 端点，不是 gRPC 端点。启用 TLS 时必须使用 `https://`。

_类型：_ 字符串

_默认值：_ `"http://127.0.0.1:8080"`

_示例：_ `"https://headscale.example.com"`

## settings.integration

_说明：_ Headplane 与 Headscale 交互的集成配置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.integration.agent

_说明：_ Headplane Agent 配置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.integration.agent.cache_ttl

_说明：_ Agent 信息的缓存时间，单位毫秒。减小 TTL 可加快数据刷新，但会增加向 Headscale 发送请求的频率。

_类型：_ 有符号整数

_默认值：_ `180000`

## settings.integration.agent.enabled

_说明：_ Headplane Agent 定期同步 tailnet 中节点的版本、操作系统等信息。它使用 `headscale.api_key` 自动生成临时预认证密钥，无需手动配置。需要 Headscale 0.28 或更新版本。

_类型：_ 布尔值

_默认值：_ `false`

## settings.integration.agent.executable_path

_说明：_ Headplane Agent 可执行文件路径。使用 NixOS 模块软件包时，默认值已正确设置。

_类型：_ 绝对路径

_默认值：_ `"/usr/libexec/headplane/agent"`

## settings.integration.agent.host_name

_说明：_ 可选，用于更改 Agent 在 tailnet 中的名称。

_类型：_ 字符串

_默认值：_ `"headplane-agent"`

## settings.integration.agent.package

_说明：_ 使用的 headplane-agent 软件包。

_类型：_ 软件包

_默认值：_ `pkgs.headplane-agent`

## settings.integration.agent.tailscale_netns

_说明：_ 在独立的 Headplane Agent 进程中使用 Tailscale 的套接字级路由回环处理。除非其回退行为将 Headscale 连接固定到了错误接口，否则保持启用。仅在确认容器网络命名空间中的普通系统路由能够正确访问 Headscale 后才设为 false。

_类型：_ 布尔值

_默认值：_ `true`

## settings.integration.agent.work_dir

_说明：_ 除自定义部署外，不应修改。`work_dir` 保存 Agent 数据，以便自动重新认证并加入 tailnet。Headplane 运行用户必须有写入权限。

_类型：_ 绝对路径

_默认值：_ `"/var/lib/headplane/agent"`

## settings.integration.proc

_说明：_ 原生进程集成设置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.integration.proc.enabled

_说明：_ 启用适用于 Headscale 和 Headplane 均在容器外运行的原生集成。无需额外配置，但必须确保 Headplane 进程能终止 Headscale 进程。

_类型：_ 布尔值

_默认值：_ `true`

## settings.oidc

_说明：_ 用于身份认证的 OIDC 配置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.oidc.client_id

_说明：_ OIDC 客户端 ID。

_类型：_ 字符串

_默认值：_ `""`

_示例：_ `"your-client-id"`

## settings.oidc.client_secret_path

_说明：_ 保存 OIDC 客户端密钥的文件路径。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"config.sops.secrets.oidc_client_secret.path"`

## settings.oidc.disable_api_key_login

_说明：_ 是否禁用 API 密钥登录。

_类型：_ 布尔值

_默认值：_ `false`

## settings.oidc.default_role

_说明：_ 首个所有者初始化完成后，为新建 OIDC 用户分配的角色。所有者角色仅在首次登录初始化时分配。

_类型：_ 以下值之一： "admin", "network_admin", "it_admin", "auditor", "viewer", "member"

_默认值：_ `"member"`

## settings.oidc.headscale_api_key_path

_说明：_ 已弃用，改用 `headscale.api_key_path`。保存 Headscale API 密钥的文件路径。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"config.sops.secrets.headscale_api_key.path"`

## settings.oidc.issuer

_说明：_ OpenID 身份提供商的 issuer URL。

_类型：_ 字符串

_默认值：_ `""`

_示例：_ `"https://provider.example.com/issuer-url"`

## settings.oidc.redirect_uri

_说明：_ 公开可访问的 Headplane URL，包含 `/admin/oidc/callback`。

_类型：_ 字符串

_默认值：_ `""`

_示例：_ `"https://headscale.example.com/admin/oidc/callback"`

## settings.oidc.role_claim

_说明：_ 可选的 OIDC 声明，包含分配给新用户的 Headplane 角色。有效角色声明优先于 `default_role`。

_类型：_ null 或字符串

_默认值：_ `null`

_示例：_ `"headplane_role"`

## settings.oidc.token_endpoint_auth_method

_说明：_ Token 端点使用的认证方法。

_类型：_ 以下值之一： "client_secret_post", "client_secret_basic", "client_secret_jwt"

_默认值：_ `"client_secret_post"`

## settings.server

_说明：_ Headplane Web 应用的服务端配置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.server.base_path

_说明：_ 管理面板的路径前缀，以斜杠开头，不以斜杠结尾。

_类型：_ 字符串

_默认值：_ `"/admin"`

_示例：_ `"/dashboard"`

## settings.server.cookie_secret_path

_说明：_ 保存 Cookie 密钥的文件路径。密钥必须恰好为 32 个字符。

_类型：_ null 或绝对路径

_默认值：_ `null`

_示例：_ `"config.sops.secrets.headplane_cookie.path"`

## settings.server.cookie_secure

_说明：_ 是否仅允许通过 HTTPS 使用 Cookie。不经过代理、直接使用 HTTP 时设为 false。生产环境建议为 true。

_类型：_ 布尔值

_默认值：_ `true`

## settings.server.data_path

_说明：_ Headplane 数据持久化路径，保存内部数据库、缓存等全部新数据。早于 0.6.1 的数据格式会自动迁移。

_类型：_ 绝对路径

_默认值：_ `"/var/lib/headplane"`

_示例：_ `"/var/lib/headplane"`

## settings.server.host

_说明：_ 绑定的主机地址。

_类型：_ 字符串

_默认值：_ `"127.0.0.1"`

_示例：_ `"0.0.0.0"`

## settings.server.port

_说明：_ 监听端口。

_类型：_ 16 位无符号整数，范围 0 到 65535（包含边界）

_默认值：_ `3000`

## settings.server.proxy_auth

_说明：_ 代理认证配置。

_类型：_ 子模块

_默认值：_ `{ }`

## settings.server.proxy_auth.allowed_cidrs

_说明：_ 允许跳过 Headplane 登录流程的直接连接来源 CIDR 范围。应填写受信任反向代理连接 Headplane 时使用的地址。需要 `headscale.api_key_path`。

_类型：_ 字符串列表

_默认值：_ `[ "127.0.0.1/32" "::1/128" ]`

_示例：_ `[ "10.0.0.0/24" ]`

## settings.server.proxy_auth.email_header

_说明：_ 可选，包含已认证用户邮箱的请求头。

_类型：_ null 或字符串

_默认值：_ `null`

## settings.server.proxy_auth.enabled

_说明：_ 是否信任来自允许客户端 CIDR 范围的反向代理认证。

_类型：_ 布尔值

_默认值：_ `false`

## settings.server.proxy_auth.ip_header

_说明：_ 可选，包含原始客户端 IP 的请求头，例如 `X-Forwarded-For` 或 `X-Real-IP`。

_类型：_ null 或字符串

_默认值：_ `null`

## settings.server.proxy_auth.name_header

_说明：_ 可选，包含已认证用户显示名称的请求头。

_类型：_ null 或字符串

_默认值：_ `null`

## settings.server.proxy_auth.picture_header

_说明：_ 可选，包含已认证用户头像 URL 的请求头。

_类型：_ null 或字符串

_默认值：_ `null`

## settings.server.proxy_auth.user_header

_说明：_ 包含稳定代理认证用户身份的请求头。

_类型：_ 字符串

_默认值：_ `"Remote-User"`

## settings.server.proxy_auth.trusted_proxy_cidrs

_说明：_ 允许提供 `ip_header` 的直接代理连接 CIDR 范围，仅在设置 `ip_header` 时使用。

_类型：_ 字符串列表

_默认值：_ `[ "127.0.0.1/32" "::1/128" ]`

_示例：_ `[ "127.0.0.1/32" ]`
