---
title: 原生模式
description: 不使用 Docker 安装 Headplane。
outline: [2, 3]
---

# 原生模式 {#native-mode}

::: tip
使用 Docker 部署时，参阅 [Docker 安装](./docker.md)。
:::

Headplane 可直接运行在主机系统上，适合已原生部署 Headscale 或不希望使用容器的环境。

## 前提条件 {#prerequisites}

- Linux 系统，例如 Ubuntu、Debian、CentOS 或 Fedora。
- 构建时需要与所检出发布版 `go.mod` 的 `go` 指令匹配的 Go。
- Node.js 和 [pnpm](https://pnpm.io/) 应满足该发布版 `package.json` 中的 `engines`。v0.8.0 使用 Node.js `>=24.2 <25`、pnpm `>=10.4 <11`，`packageManager` 固定为 `pnpm@10.4.0`。0.8.2 的安全升级要求见[更新日志](/zh-CN/CHANGELOG#_0-8-2-october-22-2026)。
- 已运行的 Headscale 0.27.0 或更新版本。
- 已完成 Headplane [配置文件](./index.md#configuration)。

构建运行前，确保 `server.data_path` 指定的目录已存在，运行用户可写：

```bash
# 按需调整，也可指定自定义用户
sudo mkdir -p /var/lib/headplane
sudo chown -R $(whoami):$(whoami) /var/lib/headplane
```

## 构建 Headplane {#building-headplane}

克隆仓库并构建。以下为社区维护的 0.8 双语线，原始项目为 [tale/headplane](https://github.com/tale/headplane)：

```bash
# 也可检出特定发行版的标签。
git clone --branch release/0.8 https://github.com/CM-Chenqf/headplane-zh-cn.git
cd headplane-zh-cn
./build.sh
```

脚本安装锁定依赖，构建 Web 应用、浏览器 SSH WASM、Agent 和健康检查。Go 与 pnpm 只在构建时需要，产物使用 Node.js 运行。

## 运行 Headplane {#running-headplane}

在项目目录运行 `node build/server/index.js`。安装 pnpm 后，也可用等效的 `pnpm start`。默认读取 `/etc/headplane/config.yaml`，可通过 `HEADPLANE_CONFIG_PATH` 指定其他文件。

> 启动目录下必须有 `build/`，否则无法找到前端资源。

### systemd 服务示例 {#example-systemd-service}

保存为 `/etc/systemd/system/headplane.service`，按需调整用户名和路径，执行 `sudo systemctl daemon-reload` 后启用并启动服务。

```ini
[Unit]
Description=Headplane Service
After=network.target # (or headscale.service if it runs via systemd)
Requires=network.target # (or headscale.service if it runs via systemd)
StartLimitIntervalSec=0

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/cloned/headplane
ExecStart=/usr/bin/node /path/to/your/cloned/headplane/build/server/index.js
Restart=on-failure
RestartSec=5s

# 使用自定义配置路径时，取消注释并设置
# Environment=HEADPLANE_CONFIG_PATH=/path/to/your/config.yaml

[Install]
WantedBy=multi-user.target
```

访问 `http://localhost:3000/admin`；远程访问时替换主机名。使用 Headscale API 密钥登录，在 Headscale 环境中生成：

```bash
# 按需调整有效期
headscale apikeys create --expiration 90d
```

## 启用高级功能 {#enabling-advanced-features}

以下用于网络设置和浏览器 SSH 等高级功能。

### 网络管理 {#network-management}

可管理 DNS 服务器、自定义 A 记录、Tailnet 域名和 MagicDNS。

#### 前提条件 {#prerequisites-1}

Headplane 与 Headscale 应在同一主机运行，Headplane 需要：

- 读写 Headscale 配置文件。
- 读取 Linux `/proc` 文件系统，以定位 Headscale 进程。

#### 配置 {#configuration}

在 Headplane 配置中设置：

| 字段                           | 说明                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **`integration.proc.enabled`** | 设为 `true` 启用进程检查集成。                                                                                                  |
| **`headscale.config_path`**    | Headscale 配置文件路径，例如 `/etc/headscale/config.yaml`。                                                                     |
| `headscale.dns_records_path`   | 可选。DNS 记录文件路径覆盖，参阅[示例配置](https://github.com/CM-Chenqf/headplane-zh-cn/blob/release/0.8/config.example.yaml)。 |

重启 Headplane 后，可在 DNS 和设置等页面管理 Tailnet 配置。保留 0.8 原有集成及重载方式。

### 远程浏览器 SSH {#remote-web-ssh}

使用 [Tailscale SSH](https://tailscale.com/kb/1193/tailscale-ssh) 从网页连接设备。目标节点需启用 `tailscale up --ssh`。

本功能依赖 [Agent](../features/agent.md)，原生部署需按其[原生模式配置](../features/agent.md#native-mode-configuration)设置二进制路径。其他条件见[浏览器 SSH](../features/ssh.md)。

### 单点登录（SSO） {#single-sign-on-sso}

通过 Google、GitHub 等支持 OIDC 的提供商登录，参阅 [SSO 文档](../features/sso.md)。

## 反向代理 {#reverse-proxying}

生产环境建议使用 Nginx、Caddy 等反向代理，Headscale 和 Headplane 可共享域名与 TLS 证书。

#### 配置 {#configuration-1}

::: tip
使用[自定义路径前缀](#custom-path-prefix)时，相应调整以下 `/admin` 路径。
:::

Headscale 支持[多种反向代理](https://headscale.net/stable/ref/integration/reverse-proxy/)。增加 `/admin` 路由，转发至 Headplane。Traefik 示例见 [Docker](./docker.md#reverse-proxying)。

#### Nginx 配置示例 {#example-nginx-configuration}

以下在 `headscale.example.com` 代理 Headscale，并在 `/admin` 提供 Headplane：

```nginx
server {
    listen 80;
    listen [::]:80;

    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name headscale.example.com;

    # 也可使用 Certbot 申请 Let’s Encrypt 证书
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / { # Headscale runs on the root path
        proxy_pass http://localhost:8080/; # Adjust if Headscale runs on a different port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_redirect http:// https://;
        proxy_buffering off;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;
    }

    location /admin/ { # Headplane is served under /admin
        proxy_pass http://localhost:3000; # Adjust if Headplane runs on a different port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_redirect http:// https://;
        proxy_buffering off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 自定义路径前缀 {#custom-path-prefix}

::: warning
上游正式支持的路径前缀仅为 `/admin`。自定义前缀可能出现意外问题，不建议使用。
:::

确需使用 `/headplane` 等前缀时，在构建时设置 `__INTERNAL_PREFIX`：

```bash
# /headplane 路径前缀的示例
git clone --branch release/0.8 https://github.com/CM-Chenqf/headplane-zh-cn.git
cd headplane-zh-cn
# 在此设置路径前缀
__INTERNAL_PREFIX=/headplane ./build.sh
```

运行后仅处理指定前缀下的请求。同步调整反向代理；再次修改前缀时必须重新构建。
