---
title: 浏览器 SSH
description: 直接从浏览器连接 Tailnet 节点。
---

# 浏览器 SSH {#browser-ssh}

<figure>
  <img src="../../assets/ssh-btop.png" alt="在浏览器 SSH 中运行 btop" />
  <figcaption>通过浏览器 SSH 运行 btop（上游截图，终端内容保持原样）</figcaption>
</figure>

浏览器 SSH 在浏览器中启动一个临时 Tailscale 节点，在会话期间加入 Tailnet，从而连接可访问的目标节点。

<figure>
  <img src="../../assets/ssh-fastfetch.png" alt="带 Nerd Font 图标的 fastfetch" />
  <figcaption>带 Nerd Font 图标的 fastfetch（上游截图，终端内容保持原样）</figcaption>
</figure>

## 前提条件 {#prerequisites}

- **Headscale 0.28 或更新版本**。0.29 测试版至 0.29.1 的浏览器 SSH 不可用，应使用 0.28.x 或至少 0.29.2。
- 目标节点启用 **Tailscale SSH**：`tailscale up --ssh`。
- 使用 **OIDC** 登录；API 密钥会话无法使用浏览器 SSH。
- [启用并配置 Headplane Agent](/zh-CN/features/agent)。

::: warning Headscale 0.29 测试版至 0.29.1
这些版本的 `/ts2021` WebSocket 路由存在回归，浏览器 / WASM 控制连接会收到 `405 Method Not Allowed`。升级到 Headscale 0.29.2 或更新版本，或使用 0.28.x。
:::

## 工作原理 {#how-it-works}

::: tip
终端由 Ghostty（通过 [restty](https://restty.pages.dev)）渲染，SSH 的 `TERM` 使用 `xterm-256color` 以兼容常见软件。自托管 JetBrains Mono Nerd Font 内置 Nerd Font 图标支持。
:::

打开会话时，浏览器：

1. 加载 WASM，以用户态 WireGuard 运行最小 Tailscale 节点，通过预授权密钥加入 Tailnet。
2. 经隧道连接目标节点的 Tailscale IP，建立 SSH 会话。
3. 使用基于 Ghostty 的 WASM 终端 restty 渲染终端，并转发会话输入输出。

## 反向代理配置 {#reverse-proxy-configuration}

浏览器必须能直接访问 **Headplane 和 Headscale**。代理需支持 WebSocket，WASM 节点通过它与 DERP 中继通信。

### 必需请求头 {#required-headers}

为 Headscale 的 DERP 端点转发：

| 请求头                   | 值                                |
| ------------------------ | --------------------------------- |
| `Upgrade`                | `websocket`                       |
| `Connection`             | `Upgrade`                         |
| `Sec-WebSocket-Protocol` | 原样转发；Tailscale 使用 `derp`。 |

### CORS 响应头 {#cors-headers}

Headscale 必须允许从 Headplane 的来源访问。主机或端口不同时，在 Headscale 代理增加：

| 响应头                         | 值                                              |
| ------------------------------ | ----------------------------------------------- |
| `Access-Control-Allow-Origin`  | Headplane 的来源地址。                          |
| `Access-Control-Allow-Methods` | `GET, POST, OPTIONS`                            |
| `Access-Control-Allow-Headers` | `Content-Type, Upgrade, Sec-WebSocket-Protocol` |

### Caddy 示例 {#example-caddy}

```caddyfile
# Headscale
hs.example.com {
    reverse_proxy localhost:8080

    # 如果 Headplane 位于不同的源：
    header Access-Control-Allow-Origin "https://headplane.example.com"
    header Access-Control-Allow-Methods "GET, POST, OPTIONS"
    header Access-Control-Allow-Headers "Content-Type, Upgrade, Sec-WebSocket-Protocol"
}
```

Caddy 自动处理 WebSocket 升级，无需额外配置。

### nginx 示例 {#example-nginx}

```nginx
# Headscale
server {
    listen 443 ssl;
    server_name hs.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # 如果 Headplane 位于不同的源：
        add_header Access-Control-Allow-Origin "https://headplane.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Upgrade, Sec-WebSocket-Protocol" always;
    }
}
```

### 同源部署 {#same-origin-setup}

Headplane 和 Headscale 共用来源（例如 `/admin` 转发 Headplane，其余路径交给 Headscale）时，无需 CORS；仍必须支持 WebSocket 升级转发。

## 故障排查 {#troubleshooting}

### SSH 不可用 {#ssh-not-available}

提示此构建未包含浏览器 SSH 支持时，检查 `hp_ssh.wasm` 和 `wasm_exec.js`。执行 `./build.sh --wasm` 重新构建，或确认镜像构建包含 `--wasm`。

### 需要 Agent {#agent-required}

提示仅在启用 Agent 集成后可用时，按 [Agent 文档](/zh-CN/features/agent)启用；浏览器 SSH 依赖它提供 Tailnet 连接信息及临时节点清理。

### 需要 OIDC {#oidc-required}

浏览器 SSH 需要 OIDC 身份才能生成与 Headscale 用户关联的预授权密钥。API 密钥登录没有对应用户身份，请改用已配置的 OIDC 提供商。

### 用户未关联 {#user-not-linked}

账号尚未匹配 Headscale 用户时，先至少向 Headscale 认证一次，以创建并关联身份，或联系管理员在用户页建立关联。

### 未找到节点 {#node-not-found}

URL 中的主机名与已注册设备不匹配，设备可能已重命名或移除。返回设备列表后重试。

### 节点离线 {#node-offline}

Headplane 建立 SSH 前会检查在线状态。离线时显示重试按钮，确认目标设备正在运行并连接到 Headscale 后重试。

### 连接返回 EOF 或卡住 {#connection-fails-with-eof-or-hangs}

- **检查 Headscale 版本**：`/ts2021` 返回 405 时，升级到至少 0.29.2 或使用 0.28.x。
- **检查 `server_url`**：Headscale 使用非标准端口时，必须将端口写入，例如 `https://hs.example.com:8443`。内置 DERP 从此值取得通告端口。不要将 DERP 端口写入 Headplane 的 `headscale.public_url`，否则会破坏注册命令与密钥使用说明。
- **检查代理 WebSocket 支持**：必须转发 `Upgrade: websocket`，否则 DERP 连接会立即失败。
- **跨源时检查 CORS**：在浏览器控制台查看错误，并配置 Headscale 代理响应头。
- 确认目标已启用 `tailscale up --ssh`。
- 检查控制台中的 WASM 或 DERP 错误。

### “failed to look up local user \*” {#failed-to-look-up-local-user-}

部分 Tailscale 版本将 SSH ACL 中 `"users": ["*"]` 的星号当作真实用户名，而不是通配符。改用 `autogroup:nonroot` 或明确的用户名：

```jsonc
// 修改前（在部分版本中不可用）
{ "action": "accept", "src": ["autogroup:member"], "dst": ["autogroup:self"], "users": ["*"] }

// After (recommended)
{ "action": "accept", "src": ["autogroup:member"], "dst": ["autogroup:self"], "users": ["autogroup:nonroot"] }
```

### 终端打开但无法输入 {#terminal-opens-but-input-doesnt-work}

- 检查目标节点的 SSH ACL 是否允许该用户。传输层连接成功不代表策略允许建立会话。
- 输入的用户名必须是目标 Linux 上实际存在的用户，否则会立即失败。

### “SSH error: ssh: handshake failed: ssh: no common algorithm” {#ssh-error-ssh-handshake-failed-ssh-no-common-algorithm}

目标 SSH 服务不支持 Go SSH 客户端提供的算法，常见于过旧、过新或自定义算法配置的 OpenSSH。通常更新目标 Tailscale 可解决。

### SSH 连接后立即断开 {#ssh-session-connects-but-immediately-disconnects}

- 目标可能未安装或运行 SSH 服务。Tailscale SSH 自带服务；未启用它时，需要在端口 22 运行 `openssh-server` 等标准服务。
- 检查目标防火墙是否连 Tailnet 来源的端口 22 也一并阻断。

切换界面语言只更新提示，不重新申请预授权密钥或重建终端。远端终端输出、命令、用户名和原始诊断保留原文。
