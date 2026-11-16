# TLS 与证书 {#tls-certificates}

本页介绍进程内 HTTPS、出站连接信任私有 CA，以及 TLS 与会话 Cookie、Docker 健康检查的关系。

## 自定义证书颁发机构 {#custom-certificate-authorities}

若 Headscale、OIDC 提供商或 HTTPS Docker 守护进程使用私有或自签名 CA，Headplane 必须信任该 CA。使用标准 Node.js 环境变量 `NODE_EXTRA_CA_CERTS`，可为进程内**所有**出站 TLS 连接添加信任，包括 OIDC 发现、Headscale API、Docker，以及其他使用 `fetch` 或 `https` 的请求。

将其设置为含一个或多个 PEM CA 证书的文件路径：

```bash
NODE_EXTRA_CA_CERTS=/etc/headplane/extra-cas.pem
```

Docker 中挂载证书并传入环境变量：

```yaml
services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    environment:
      NODE_EXTRA_CA_CERTS: /etc/headplane/extra-cas.pem
    volumes:
      - "./internal-ca.pem:/etc/headplane/extra-cas.pem:ro"
      - "./config.yaml:/etc/headplane/config.yaml"
      - "./headplane-data:/var/lib/headplane"
```

::: info 镜像来源
本页保留上游已发布镜像的示例。社区完整双语正式镜像已发布，可使用 `ghcr.io/cm-chenqf/headplane-zh-cn:v0.8.2`。进度见[语言与维护说明](/zh-CN/features/language)。
:::

该证书包是在系统信任库之上**追加**的，不影响 Let's Encrypt、ZeroSSL 等公共证书。

> `headscale.tls_cert_path` 的作用更窄：它将 Headscale API 连接固定到一个特定证书，绕过其余信任库。需要只接受该证书时可使用它；仅需增加受信任 CA 时，应使用 `NODE_EXTRA_CA_CERTS`。

## TLS 终止 {#tls-termination}

同时设置 `server.tls_cert_path` 和 `server.tls_key_path` 后，Headplane 可自行处理 TLS。两个路径必须指向 Headplane 可读取的 PEM 文件。

```yaml
server:
  port: 443
  tls_cert_path: "/var/lib/headplane/tls/fullchain.pem"
  tls_key_path: "/var/lib/headplane/tls/privkey.pem"
```

启用 TLS 后，Headplane 在 `server.port` 上提供 HTTPS/1.1。进程内不提供 HTTP/2 或 HTTP/3；需要这些协议时，在 Caddy、Traefik 等反向代理终止，再通过 HTTP/1.1 转发至 Headplane。

启用 TLS 会强制将 `server.cookie_secure` 设为 `true`；若原配置为 `false`，会记录警告，因为浏览器不会接受 HTTPS 下缺少 `Secure` 的对应会话设置。

多数部署仍建议在[反向代理](./#reverse-proxying)终止 TLS，以便与 Headscale 等服务共用证书。内置 TLS 更适合单机简化部署。

## 健康检查 {#healthcheck}

Docker 内置健康检查自动读取正确的协议和端口。Headplane 启动时将本地回环 URL 写入 `/tmp/headplane-listen`，健康检查从该文件读取。因此启用或停用 TLS 无需额外调整健康检查。
