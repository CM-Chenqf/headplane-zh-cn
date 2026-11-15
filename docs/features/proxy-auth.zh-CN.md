---
title: 代理认证
description: 让受信任的反向代理代为登录 Headplane。
---

# 代理认证 [#proxy-authentication]

已负责用户登录的反向代理（例如 Authelia、Authentik 或启用基本认证的 nginx）可以通过请求头告知 Headplane 每个请求的用户身份。用户只需在代理处登录一次。

:::warning
Headplane 信任下方允许地址发送的身份请求头。如果其他人也能从这些地址访问 Headplane，就能冒充任意用户。有 OIDC 提供商时，[SSO](/features/sso) 是更安全的选择。
:::

## 配置 [#setting-it-up]

代理认证需要 [`headscale.api_key`](/configuration/api-keys#the-servers-key)，Headplane 使用它代表已登录用户访问 Headscale：

```yaml
headscale:
  api_key: "<key>"

server:
  proxy_auth:
    enabled: true
    user_header: "Remote-User"
    email_header: "Remote-Email"
    name_header: "Remote-Name"
    allowed_cidrs:
      - "127.0.0.1/32"
      - "::1/128"
```

每个请求必须包含 `user_header` 指定的请求头，默认为 `Remote-User`。其值以 `proxy:<value>` 形式成为 Headplane 账号身份，因此同一个人的值必须保持稳定。邮箱、姓名和 `picture_header` 请求头为可选项，用于补全个人资料。

角色和账号关联见[用户与角色](/features/users-roles)。

## 信任哪些请求 [#which-requests-are-trusted]

Headplane 只读取来自 `allowed_cidrs` 地址的身份请求头，默认仅允许 localhost。检查的是连接本身的地址，而非 `X-Forwarded-For` 等请求头，因此应填写代理实际连接 Headplane 时的来源地址。

如果前面还有另一层代理，需要检查原始客户端地址，可将 `ip_header` 设为可信代理设置或覆盖的请求头，例如 `X-Forwarded-For`。Headplane 仅在连接来自 `trusted_proxy_cidrs`（默认也为 localhost）时读取该头，并使用其中第一个地址匹配 `allowed_cidrs`：

```yaml
server:
  proxy_auth:
    enabled: true
    ip_header: "X-Forwarded-For"
    trusted_proxy_cidrs:
      - "127.0.0.1/32"
    allowed_cidrs:
      - "10.0.0.0/8"
```

## 选项 [#options]

所有选项均位于 `server.proxy_auth` 下。

| 选项                  | 默认值        | 说明                                   |
| --------------------- | ------------- | -------------------------------------- |
| `enabled`             |               | 启用代理认证                           |
| `user_header`         | `Remote-User` | 保存稳定用户身份的请求头               |
| `email_header`        |               | 邮箱地址请求头                         |
| `name_header`         |               | 显示名称请求头                         |
| `picture_header`      |               | 头像 URL 请求头                        |
| `allowed_cidrs`       | localhost     | 允许提供认证身份的来源地址             |
| `ip_header`           |               | 需要检查时，提供原始客户端地址的请求头 |
| `trusted_proxy_cidrs` | localhost     | 允许设置 `ip_header` 的可信代理地址    |
