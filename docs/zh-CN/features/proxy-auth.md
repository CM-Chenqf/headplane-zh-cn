---
title: 代理认证
description: 将 Headplane 认证交给受信任的反向代理。
outline: [2, 3]
---

::: warning
代理认证权限很大，配置错误可能允许任何人冒充用户并访问 Headplane。

可行时优先使用内置 SSO。上游不对代理认证的安全性作保证。
:::

# 代理认证 {#proxy-authentication}

代理认证将用户身份认证交给受信任的反向代理，适用于已有 nginx 基本认证、Authelia、Authentik 或其他 SSO 代理保护的环境，避免再次登录 Headplane。

此功能需要显式启用，并设置 `headscale.api_key`。仅当客户端 IP 匹配 `server.proxy_auth.allowed_cidrs` 时，Headplane 才信任身份请求头；所有 Headscale API 调用都使用配置的 API 密钥。

## 基本配置 {#basic-configuration}

```yaml
headscale:
  api_key: "<your-headscale-api-key>"

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

`user_header` 是必需的身份请求头，默认 `Remote-User`，其值在 Headplane 中变为稳定的 `proxy:<value>` 身份。`email_header`、`name_header`、`picture_header` 为可选资料请求头。

首个通过代理认证的用户成为所有者，与 SSO 首用户规则相同；后续用户默认为成员，可在用户页调整角色。

## 客户端 IP 检查 {#client-ip-checks}

省略 `allowed_cidrs` 时仅信任本机。默认检查实际连接到 Headplane 的 socket 对端地址，不读取 `X-Forwarded-For`、`X-Real-IP` 等转发头。应填写代理直接连接 Headplane 时使用的地址范围。

## 转发的客户端 IP 请求头 {#forwarded-client-ip-headers}

需按原始客户端 IP 检查时，将 `ip_header` 设为由可信代理控制的 `X-Forwarded-For`、`X-Real-IP` 等请求头。仅当直接连接的代理 IP 匹配 `trusted_proxy_cidrs`（默认本机）时才读取该头，再取第一个 IP 与 `allowed_cidrs` 匹配：

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

::: warning
只有不受信任客户端无法直连 Headplane 时才应启用。能从允许的 CIDR 直接连接者可以伪造身份头。`ip_header` 必须由可信代理设置或覆盖。
:::

## 请求头参考 {#header-reference}

| 字段                                    | 说明                                               |
| --------------------------------------- | -------------------------------------------------- |
| `server.proxy_auth.enabled`             | 启用代理认证。                                     |
| `server.proxy_auth.user_header`         | 稳定用户标识请求头，默认 `Remote-User`。           |
| `server.proxy_auth.email_header`        | 可选，用户邮箱。                                   |
| `server.proxy_auth.name_header`         | 可选，显示名称。                                   |
| `server.proxy_auth.picture_header`      | 可选，头像 URL。                                   |
| `server.proxy_auth.allowed_cidrs`       | 允许通过代理认证的客户端 CIDR，默认本机。          |
| `server.proxy_auth.ip_header`           | 可选，原始客户端 IP 请求头，如 `X-Forwarded-For`。 |
| `server.proxy_auth.trusted_proxy_cidrs` | 允许提供 `ip_header` 的直接代理 CIDR，默认本机。   |
