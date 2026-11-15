import { versions } from "@/lib/versions";

// Compose examples for the configuration pages. They live here rather than
// inline because MDX strips indentation from multi-line expressions.

export const dockerCompose = `services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - "/path/to/headplane/config.yaml:/etc/headplane/config.yaml"
      - "/path/to/data/storage:/var/lib/headplane"

      # Headscale's config file. The path inside this container must match
      # \`headscale.config_path\` in Headplane's config.
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"

      # To edit DNS records, mount the file from Headscale's
      # dns.extra_records_path too. If the path in this container differs,
      # set \`headscale.dns_records_path\` in Headplane's config.
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"

      # The Docker socket (or a socket proxy), used to restart Headscale
      - "/var/run/docker.sock:/var/run/docker.sock"
  headscale:
    image: headscale/headscale:${versions.headscale.example}
    container_name: headscale
    restart: unless-stopped
    command: serve
    labels:
      # How Headplane finds the Headscale container
      me.tale.headplane.target: headscale
    ports:
      - "8080:8080"
    volumes:
      # The same files, at the same paths, as in Headplane's container
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"
      - "/path/to/headscale/dns_records.json:/etc/headscale/dns_records.json"

      - "/path/to/headscale/data/storage:/var/lib/headscale"
`;

export const traefikCompose = `services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    volumes:
      - "/path/to/headplane/config.yaml:/etc/headplane/config.yaml"
      - "/path/to/data/storage:/var/lib/headplane"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.headplane.rule=Host(\`headscale.example.com\`) && PathPrefix(\`/admin\`)"
      - "traefik.http.routers.headplane.entrypoints=websecure"
      - "traefik.http.routers.headplane.tls=true"
      - "traefik.http.services.headplane.loadbalancer.server.port=3000"

  headscale:
    image: headscale/headscale:${versions.headscale.example}
    container_name: headscale
    restart: unless-stopped
    command: serve
    volumes:
      - "/path/to/headscale/config.yaml:/etc/headscale/config.yaml"
      - "/path/to/headscale/data/storage:/var/lib/headscale"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.headscale.rule=Host(\`headscale.example.com\`)"
      - "traefik.http.routers.headscale.entrypoints=websecure"
      - "traefik.http.routers.headscale.tls=true"
      - "traefik.http.services.headscale.loadbalancer.server.port=8080"

      # Optional: send visitors at / to Headplane
      - "traefik.http.routers.root.rule=Host(\`headscale.example.com\`) && Path(\`/\`)"
      - "traefik.http.routers.root.entrypoints=websecure"
      - "traefik.http.routers.root.tls=true"
      - "traefik.http.routers.root.middlewares=to-admin"
      - "traefik.http.middlewares.to-admin.redirectregex.regex=^(https?://[^/]+)/$$"
      - "traefik.http.middlewares.to-admin.redirectregex.replacement=$\${1}/admin/"

  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
`;

// Translate explanatory comments only; the executable examples remain shared.
export const dockerComposeZh = dockerCompose
  .replace(
    "# Headscale's config file. The path inside this container must match\n      # `headscale.config_path` in Headplane's config.",
    "# Headscale 配置文件，容器内路径必须与 Headplane 配置的\n      # `headscale.config_path` 一致。",
  )
  .replace(
    "# To edit DNS records, mount the file from Headscale's\n      # dns.extra_records_path too. If the path in this container differs,\n      # set `headscale.dns_records_path` in Headplane's config.",
    "# 编辑 DNS 记录时，还需挂载 Headscale 的 dns.extra_records_path 文件。\n      # 若容器内路径不同，在 Headplane 配置中设置\n      # `headscale.dns_records_path`。",
  )
  .replace(
    "# The Docker socket (or a socket proxy), used to restart Headscale",
    "# 用于重启 Headscale 的 Docker socket（或 socket 代理）",
  )
  .replace(
    "# How Headplane finds the Headscale container",
    "# Headplane 用于定位 Headscale 容器的标签",
  )
  .replace(
    "# The same files, at the same paths, as in Headplane's container",
    "# 与 Headplane 容器中相同的文件和路径",
  );

export const traefikComposeZh = traefikCompose.replace(
  "# Optional: send visitors at / to Headplane",
  "# 可选：将根路径访问者重定向到 Headplane",
);
