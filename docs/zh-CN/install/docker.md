---
title: Docker
description: 使用 Docker 安装 Headplane。
outline: [2, 3]
---

# Docker 安装 {#docker-installation}

::: tip
不使用 Docker 时，参阅[原生模式](./native-mode.md)。
:::

Docker 是推荐的安装方式，部署方便，适用于多数环境。此处的集成方案要求 Headscale 也在 Docker 中运行。

::: info 镜像来源
本页保留上游已发布镜像的示例。社区维护的完整双语镜像尚未正式发布；目标地址为 `ghcr.io/cm-chenqf/headplane-zh-cn`，应在构建、运行验收及正式发布后使用对应标签。进度见[语言与维护说明](/zh-CN/features/language)。
:::

## 前提条件 {#prerequisites}

- Docker 和 Docker Compose。
- 已运行的 Headscale 0.27.0 或更新版本。
- 已准备好 Headplane [配置文件](./index.md#configuration)。

## 安装 {#installation}

使用以下 Compose 文件：

```yaml
services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - "./config.yaml:/etc/headplane/config.yaml"
      - "./headplane-data:/var/lib/headplane"
```

必须挂载配置文件，并为 Headplane 数据提供持久化存储。可按需修改端口映射。

## 健康检查 {#health-checks}

镜像内置健康检查，用于确认服务运行并响应请求。Docker 会自动报告容器健康状态，无需额外配置。

容器中的二进制路径为 `/bin/hp_healthcheck`，可在 `compose.yaml` 中覆盖参数：

```yaml
services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    healthcheck:
      test: ["CMD", "/bin/hp_healthcheck"]
      interval: 30s
      timeout: 5s
      start_period: 5s
      retries: 3
```

## 访问 Headplane {#accessing-headplane}

启动后访问 `http://localhost:3000/admin`。若不是本机部署，将 `localhost` 替换为服务器 IP 或域名。

登录需要 Headscale API 密钥。在 Headscale 环境中执行，按需调整有效期：

```bash
# 按需调整有效期
headscale apikeys create --expiration 90d
```

## 启用高级功能 {#enabling-advanced-features}

基本安装已完成。以下配置用于在界面中编辑网络设置、使用浏览器 SSH 等功能。

### 网络管理 {#network-management}

可在界面中管理 DNS 服务器、自定义 A 记录、Tailnet 域名和 MagicDNS。

#### 前提条件 {#prerequisites-1}

Headplane 与 Headscale 应运行在同一 Docker 主机上，Headplane 需要：

- 通过共享挂载读写 Headscale 配置文件。
- 访问 Docker socket（通常为 `/var/run/docker.sock`），也可使用 [Tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) 等代理。

启动时会协商 Docker API 版本，以 `1.44` 为目标，下限为 `1.24`（Docker Engine 1.12+），支持现代 Docker 和 Podman 的 Docker 兼容 socket。

#### 配置 {#configuration}

同一 Docker 环境中的示例：

```yaml
services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      # 与前面的配置相同
      - "/path/to/your/config.yaml:/etc/headplane/config.yaml"
      - "/path/to/data/storage:/var/lib/headplane"

      # 共享的 Headscale 配置文件路径。容器内的挂载路径必须
      # 与 Headplane 的 config.yaml 中配置的
      # `headscale.config_path` 一致。
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"

      # 如果在 Headscale 中使用 dns.extra_records_path（推荐），
      # 也应在此挂载该文件，使 Headplane 可以读写。如果
      # 容器内路径与 Headscale 的 dns.extra_records_path 不同，
      # 在 Headplane 的 config.yaml 中设置 `headscale.dns_records_path`。
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"

      # 只读访问 Docker socket（或其代理）
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
  headscale:
    image: headscale/headscale:0.27.1
    container_name: headscale
    restart: unless-stopped
    command: serve
    labels:
      # 必须设置此标签，Headplane 才能找到 Headscale。
      me.tale.headplane.target: headscale
    ports:
      - "8080:8080"
    volumes:
      # 注意：Headscale 和 Headplane 的这些挂载路径应与
      # 主机路径完全一致，这一点非常重要。
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"

      - "/path/to/headscale/data/storage:/var/lib/headscale"
```

::: info
可通过远程 Docker 守护进程跨主机连接，但属于高级方案，不在本文范围。参阅[示例配置](https://github.com/CM-Chenqf/headplane-zh-cn/blob/release/0.8/config.example.yaml)。
:::

在 Headplane 配置中设置：

| 字段                             | 说明                                                           |
| -------------------------------- | -------------------------------------------------------------- |
| **`integration.docker.enabled`** | 设为 `true` 启用 Docker 集成。                                 |
| **`headscale.config_path`**      | 容器内 Headscale 配置路径，例如 `/etc/headscale/config.yaml`。 |
| `headscale.dns_records_path`     | 可选。覆盖 DNS 记录文件路径，参阅示例配置。                    |

重启 Headplane 后，导航栏会出现 DNS、设置等选项。共享的 DNS 记录文件也必须挂载；若容器内路径与 `dns.extra_records_path` 不同，使用 `headscale.dns_records_path` 指定。

### 远程浏览器 SSH {#remote-web-ssh}

通过 [Tailscale SSH](https://tailscale.com/kb/1193/tailscale-ssh) 从网页连接节点。目标设备需执行 `tailscale up --ssh`。

本功能使用 [Headplane Agent](../features/agent.md)，配置方法见对应文档，其他条件和版本限制见[浏览器 SSH](../features/ssh.md)。

### 单点登录（SSO） {#single-sign-on-sso}

可使用 Google、GitHub 等支持 OpenID Connect（OIDC）的身份提供商登录，参阅 [SSO 文档](../features/sso.md)。

## 反向代理 {#reverse-proxying}

生产环境建议使用 Nginx、Caddy 等反向代理。Headscale 也置于同一代理之后时，可共用域名和 TLS 证书。

#### 配置 {#configuration-1}

Headscale 支持[多种反向代理](https://headscale.net/stable/ref/integration/reverse-proxy/)。将 `/admin` 请求转发给 Headplane 即可。以下示例使用 Traefik；不使用 Docker 的 Nginx 示例见[原生模式](./native-mode.md#reverse-proxying)。

#### Traefik 配置示例 {#example-traefik-configuration}

以下将 `headscale.example.com` 上的 Headscale 请求交给 Headscale，在 `/admin` 提供 Headplane，路径形式与 Tailscale 的管理面板类似。

这是路由示例，不能直接作为完整部署使用；仍需配置 Traefik 与 TLS 证书。

```yaml
services:
  # 与前面的配置相同
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - "/path/to/your/config.yaml:/etc/headplane/config.yaml"
      - "/path/to/data/storage:/var/lib/headplane"
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    labels:
      # 在 /admin 路径提供管理界面
      - "traefik.enable=true"
      - "traefik.http.routers.headplane.rule=Host(`headscale.example.com`) && PathPrefix(`/admin`)"
      - "traefik.http.routers.headplane.entrypoints=websecure"
      - "traefik.http.routers.headplane.tls=true"
  headscale:
    image: headscale/headscale:0.27.1
    container_name: headscale
    restart: unless-stopped
    command: serve
    ports:
      - "8080:8080"
    volumes:
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"
      - "/path/to/headscale/data/storage:/var/lib/headscale"
    labels:
      - "me.tale.headplane.target=headscale"

      # 通过 Traefik 标签将 Headscale 暴露在 headscale.example.com
      - "traefik.enable=true"
      - "traefik.http.routers.headscale.rule=Host(`headscale.example.com`)"
      - "traefik.http.routers.headscale.entrypoints=websecure"
      - "traefik.http.routers.headscale.tls=true"

      # 此中间件是保证 Headplane 正常运行的必要配置
      - "traefik.http.routers.headscale.middlewares=cors"
      - "traefik.http.middlewares.cors.headers.accesscontrolallowheaders=*"
      - "traefik.http.middlewares.cors.headers.accesscontrolallowmethods=GET,POST,PUT"
      - "traefik.http.middlewares.cors.headers.accesscontrolalloworiginlist=https://headscale.example.com"
      - "traefik.http.middlewares.cors.headers.accesscontrolmaxage=100"
      - "traefik.http.middlewares.cors.headers.addvaryheader=true"

      # 可选：将 / 自动重定向至 /admin
      - "traefik.http.routers.rewrite.rule=Host(`headscale.example.com`) && Path(`/`)"
      - "traefik.http.routers.rewrite.service=headscale"
      - "traefik.http.routers.rewrite.middlewares=rewrite"
      - "traefik.http.middlewares.rewrite.addprefix.prefix=/admin"

  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # 示例挂载和配置，按实际情况调整 Traefik
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "/path/to/certs/storage:/certs"
```
