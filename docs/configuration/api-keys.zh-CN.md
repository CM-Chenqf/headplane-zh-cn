---
title: API 密钥
description: Headplane 使用 Headscale API 密钥的两种方式及其轮换方法。
---

# API 密钥 [#api-keys]

Headplane 使用 Headscale API 密钥访问 Headscale API。密钥有两种独立用途，需求也不同。

## 使用密钥登录 [#signing-in-with-a-key]

在配置 [SSO](/features/sso) 或[代理认证](/features/proxy-auth)之前，登录页面要求输入 Headscale API 密钥。该密钥拥有 Headscale 的完整控制权限，因此使用它登录会获得 Headplane 的全部访问权限，不关联角色。密钥过期时，会话随之结束。

```bash
headscale apikeys create --expiration 90d
```

## 服务端密钥 [#the-servers-key]

`headscale.api_key` 是由 Headplane 自身保存和使用的密钥。通过 SSO 或代理登录的人没有个人 Headscale 密钥；Headplane 先检查其角色，再使用服务端密钥发送请求。[Agent](/features/agent) 也使用该密钥加入 tailnet。未设置此密钥时，SSO、代理认证和 Agent 都不会启动。

```bash
headscale apikeys create --expiration 365d
```

```yaml
headscale:
  api_key: "<key>"
```

如需避免在配置文件中直接保存密钥，改用 `api_key_path`，参阅[敏感值](/configuration/sensitive-values)。

为该密钥设置较长有效期，并记录到期时间。一旦过期，SSO 和代理认证用户的所有请求都会失败，Agent 也会停止同步。Headplane 在启动时读取密钥，因此更换密钥后需要重启。

`oidc.headscale_api_key` 是此选项的旧名称。未设置 `headscale.api_key` 时旧名称仍可使用，但已弃用。

## 轮换服务端密钥 [#rotating-the-servers-key]

1. 运行 `headscale apikeys create --expiration 365d` 创建新密钥。
2. 将新密钥设为 `headscale.api_key`，然后重启 Headplane。
3. 运行 `headscale apikeys list` 找到旧密钥前缀，再运行 `headscale apikeys expire --prefix <prefix>` 使其过期。
