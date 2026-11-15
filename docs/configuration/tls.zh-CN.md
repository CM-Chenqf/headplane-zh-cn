---
title: TLS 与证书
description: 通过 HTTPS 提供 Headplane，并信任私有证书颁发机构。
---

# TLS 与证书 [#tls--certificates]

## 自定义证书颁发机构 [#custom-certificate-authorities]

如果 Headscale、OIDC 提供商或 Headplane 连接的其他服务使用私有或自签名 CA 签发的证书，将 Node.js 的 `NODE_EXTRA_CA_CERTS` 指向包含这些 CA 证书的 PEM 文件：

```bash
NODE_EXTRA_CA_CERTS=/etc/headplane/extra-cas.pem
```

该设置适用于全部出站连接，在系统信任的 CA 基础上追加证书，不会替换系统证书，因此公共证书仍可正常使用。在 Docker 中挂载证书文件并设置环境变量：

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

`headscale.tls_cert_path` 的作用更窄：Headplane 连接 Headscale 时只信任指定证书，不再信任系统证书库。它适合将 Headscale 固定到单一证书；若只想添加 CA，优先使用 `NODE_EXTRA_CA_CERTS`。

## TLS 终止 [#tls-termination]

同时将 `server.tls_cert_path` 和 `server.tls_key_path` 设置为可读取的 PEM 文件后，Headplane 可以直接提供 HTTPS：

```yaml
server:
  port: 443
  tls_cert_path: "/var/lib/headplane/tls/fullchain.pem"
  tls_key_path: "/var/lib/headplane/tls/privkey.pem"
```

Headplane 仅提供 HTTP/1.1。如需 HTTP/2 或 HTTP/3，在前面配置[反向代理](/configuration/reverse-proxy)。

启用 TLS 后，`server.cookie_secure` 始终为 `true`。如果配置为 `false`，Headplane 会记录警告。Docker 健康检查无需调整。

此方式适用于没有代理的单机部署。如果 Headscale 已使用代理，在代理处终止 TLS 可让两者共用一张证书。示例镜像来自上游，双语发布状态见[语言与维护说明](/features/language)。
