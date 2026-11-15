---
title: 单点登录（SSO）
description: 为 Headplane 配置 OIDC 单点登录。
outline: [2, 3]
---

# 单点登录（SSO） {#single-sign-on-sso}

<figure>
  <img class="dark-only" src="../../assets/sso-dark.png" alt="SSO 配置页面" />
  <img class="light-only" src="../../assets/sso-light.png" alt="SSO 配置页面" />
  <figcaption>SSO 配置页面（上游英文界面截图）</figcaption>
</figure>

单点登录通过 OpenID Connect（OIDC）将 Headplane 认证交给外部身份提供商（IdP）。登录后，Headplane 自动匹配 Headscale 身份、分配角色并管理会话。

反向代理已完成认证并能传递可信身份头时，参阅[代理认证](./proxy-auth.md)。

## 开始配置 {#getting-started}

### 前提条件 {#requirements}

- 已正常安装并完成配置的 Headplane。
- 支持 OAuth2 与 OIDC 的身份提供商。
- `server.base_url` 设为浏览器可见的 Headplane 公网 URL。
- 有效期较长（例如一年）的 Headscale API 密钥。

### 配置客户端 {#configuring-the-client}

在 IdP 中创建供 Headplane 认证使用的客户端，并注册认证完成后的重定向 URL。将域名替换为 `server.base_url`：

```
https://headplane.example.com/admin/oidc/callback
```

记录客户端 ID（Client ID）、客户端密钥（Client Secret，如适用）和签发者 URL（Issuer URL）。

### OIDC 配置 {#oidc-configuration}

在 Headplane 配置中添加：

```yaml
headscale:
  url: "http://headscale:8080"
  api_key: "<generated-api-key>"

oidc:
  issuer: "https://your-idp.com"
  client_id: "your-client-id"
  client_secret: "your-client-secret"
  # 也可通过文件提供客户端密钥：
  # client_secret_path: "${HOME}/secrets/headplane_oidc_client_secret.txt"

  # 这些端点通常可自动发现，也可手动设置：
  # authorization_endpoint: ""
  # token_endpoint: ""
  # userinfo_endpoint: ""
  # jwks_endpoint: ""
  # scope: "openid email profile"
  # subject_claims: ["open_id", "email"]
  # default_role: "member"
  # role_claim: "headplane_role"
  # allow_weak_rsa_keys: false
  # extra_params:
  #  foo: "bar"
```

Headplane 通过签发者的 `/.well-known/openid-configuration` 自动发现端点。不支持发现时，需手动配置各端点。

### 非标准 subject 声明 {#non-standard-subject-claims}

部分提供商不在 ID token 中返回标准 `sub`。Headplane 始终优先使用 `sub`，再按 `oidc.subject_claims` 尝试备用声明。

飞书 / Lark 推荐：

```yaml
oidc:
  subject_claims: ["open_id", "email"]
```

优先采用稳定的 `open_id`，必要时再回退到 `email`。

### 旧版弱 RSA 签名密钥 {#legacy-weak-rsa-signing-keys}

Headplane 默认拒绝小于 2048 位 RSA 密钥签名的 ID token。提供商暂时无法轮换密钥时，可显式启用兼容回退：

```yaml
oidc:
  allow_weak_rsa_keys: true
```

::: warning
这会降低 ID token 校验安全性，仅应作为轮换到至少 2048 位密钥前的临时措施。
:::

### PKCE {#pkce}

::: warning
目前仅支持 **`S256`** 质询方法，必须确认 IdP 接受此方法。
:::

PKCE（Proof Key for Code Exchange）默认未启用。它可增强 OIDC 安全性，部分 IdP 强制要求。启用方式：

```yaml
oidc:
  use_pkce: true
```

## 用户匹配原理 {#how-user-matching-works}

Headplane 需将 OIDC 账号关联到 Headscale 用户，以显示自己的设备、提供自助预授权密钥和浏览器 SSH。

### 匹配策略 {#matching-strategy}

分两步：

1. **subject 优先匹配**：Headscale 的 `provider_id` 通常形如 `https://idp.example.com/3d6f6e3f-...`。Headplane 提取最后一段，与 OIDC subject 比较；subject 优先取 `sub`，缺失时依次取 `oidc.subject_claims`。相同则建立关联。
2. **邮箱回退匹配**：subject 不匹配时，比较 IdP `userinfo` 端点返回的邮箱与 Headscale 用户记录中的邮箱。

关联以 `headscale_user_id` 保存到 Headplane 数据库，后续登录复用，因此只需成功一次。

### Headscale 未使用 OIDC {#headscale-without-oidc}

通过 `headscale users create` 创建的本地用户没有可匹配的 `provider_id` 或邮箱，无法自动关联。

0.8 会在首次引导中让用户选择对应的 Headscale 用户，并保存关联。之后所有基于所有权的功能正常工作。

::: tip
跳过选择后仍可使用 Headplane，但无法使用依赖所有权的功能。管理员不受是否关联的影响，仍可管理全部资源。
:::

### 共用客户端与不同客户端 {#same-client-vs-different-clients}

::: tip 推荐
Headscale 与 Headplane 使用同一个 OIDC 客户端最简单可靠，双方取得相同的 `sub`，可直接匹配。
:::

使用不同客户端时，Azure AD / Entra ID 等提供商可能按应用生成不同的 `sub`：

- 首次登录的 subject 匹配会失败。
- 回退到邮箱匹配，要求 IdP `userinfo` 与 Headscale 用户记录均有 `email`。
- 成功关联后会持久化，后续登录不再依赖初次匹配。

::: warning
不同客户端且无 `email` 时，用户仍可登录，但无法关联 Headscale 身份，也就无法查看自己的设备或自助生成预授权密钥。
:::

## 角色与权限 {#roles-and-permissions}

SSO 启用后，通过角色控制用户可执行的界面操作。

### 可用角色 {#available-roles}

| 角色                        | 说明                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| 所有者（Owner）             | 完全权限，首次登录者自动取得；不能像普通角色一样重新分配。所有权转移使用专门流程。 |
| 管理员（Admin）             | 除所有者专属标识外拥有完全权限，可管理用户、设备、ACL、DNS 和设置。                |
| 网络管理员（Network Admin） | 管理 ACL、DNS 和网络设置；可查看设备和用户，并生成预授权密钥。                     |
| IT 管理员（IT Admin）       | 管理设备、用户与功能设置及 IAM，不能修改 ACL 或 DNS。                              |
| 审计员（Auditor）           | 全部内容只读，可生成自己的预授权密钥。                                             |
| 查看者（Viewer）            | 查看设备和用户，可生成自己的预授权密钥。                                           |
| 成员（Member）              | 在数据库中存在，但没有控制台权限。                                                 |

### 首次登录：初始化所有者 {#first-login-owner-bootstrap}

第一个通过 OIDC 登录的用户自动成为所有者。后续用户默认为成员，由所有者或管理员在用户页分配角色。

### 自动分配角色 {#automatic-role-assignment}

`oidc.default_role` 控制新 OIDC 用户的默认角色：

```yaml
oidc:
  # 有效值：admin、network_admin、it_admin、auditor、viewer、member
  default_role: "viewer"
```

适合 Headscale 已按域名、组或用户限制认证的环境。例如仅允许 `@example.com`，且这些用户都应能查看面板时，设为 `viewer`。

由 IdP 按用户提供角色时，设置声明名：

```yaml
oidc:
  role_claim: "headplane_role"
```

声明可以是 `"admin"` 等字符串，也可以是含有效角色的数组。Keycloak 等可先将用户组或客户端角色映射成 Headplane 角色。新用户同时配置两项时，有效的 `role_claim` 优先。

现有用户每次 OIDC 登录都会同步有效的角色声明，IdP 组或角色发生改变会在下次登录生效。`default_role` 仅用于创建时回退，不覆盖现有角色。所有者保留给首次初始化，不能由这两项授予或覆盖。

### API 密钥会话 {#api-key-sessions}

使用 Headscale API 密钥登录者具有完全权限，绕过角色系统，因为持有该密钥已代表 Headscale 管理权限。

### 首次引导 {#onboarding}

新 OIDC 用户首次登录会看到简短引导，帮助连接第一台设备。可跳过，完成后进入主界面。

## 单点退出：RP 发起退出 {#single-logout-rp-initiated-logout}

支持 [OpenID Connect RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)。启用后，在 OIDC 会话中点击退出会：

1. 销毁 Headplane 本地会话。
2. 将浏览器重定向至 IdP 的 `end_session_endpoint`。
3. 传递原 `id_token` 作为 `id_token_hint`，以及 `post_logout_redirect_uri`，供 IdP 清理自身会话后返回。

### 配置 {#configuration}

默认禁用。必须先在 IdP 客户端注册 `post_logout_redirect_uri`，否则退出后会进入提供商错误页。

设置 `oidc.use_end_session: true`：

```yaml
oidc:
  # 必需：启用 RP 发起的注销
  use_end_session: true

  # 可选：覆盖自动发现的 end_session_endpoint，或在身份提供者
  # 未通过发现接口公开此端点时手动指定。
  # end_session_endpoint: "https://idp.example.com/realms/main/protocol/openid-connect/logout"

  # 可选。默认值为 `<server.base_url>/admin/login?s=logout`。
  # post_logout_redirect_uri: "https://headplane.example.com/admin/login?s=logout"
```

若 Keycloak、Authentik、Auth0、Azure AD 等在发现文档提供 `end_session_endpoint`，启用后会自动采用。

::: tip
确保实际或默认的退出重定向 URL 已列在 IdP 客户端允许的退出后 / 有效重定向 URI 中，否则 IdP 会拒绝返回。
:::

`use_end_session: false` 时仅销毁本地会话并返回登录页。

## 故障排查 {#troubleshooting}

### 常见问题 {#common-issues}

- **OIDC 未启用或配置错误**：确认配置存在 `oidc` 节，Headplane 服务端可访问 issuer URL。
- **登录成功但看不到自己的设备**：检查 subject 匹配或双方 `email`，见[用户匹配原理](#how-user-matching-works)。
- **会话 Cookie 为空或循环登录**：HTTPS 代理下 `cookie_secure` 设为 `true`，纯 HTTP 本地开发设为 `false`。
- **API 密钥无效**：检查 `headscale.api_key` 是否过期，用 `headscale apikeys create --expiration 999d` 重新生成。
- **缺少 `sub`**：用 `oidc.subject_claims` 指定 `open_id` 等稳定备用字段，仅在邮箱对用户稳定时采用 `email`。
- **重定向 URI 不匹配**：IdP 登记地址必须与 `{server.base_url}/admin/oidc/callback` 完全一致。
- **PKCE 错误**：IdP 要求 PKCE 时启用 `oidc.use_pkce: true`；提到 `code_verifier` 的错误通常由此引起。
- **端点缺失**：不支持发现时，手动设置 `authorization_endpoint`、`token_endpoint`、`userinfo_endpoint`、`jwks_endpoint`。
