# Nix {#nix}

[flake.nix](https://github.com/tale/headplane/blob/main/flake.nix) 提供以下输出。此处为上游示例快照，树中的 0.6.1 不是本维护线当前版本；构建时以所选源码版本为准。

```sh
$ nix flake show github:tale/headplane --all-systems
github:tale/headplane/ec6d455461955242393b60d9ce60c5123fa9784f?narHash=sha256-CM/vXzUiOed7i1Pp15KyV4FuIvumRlXnpF33dSWZZH4%3D
├───checks
│   ├───aarch64-darwin
│   │   └───default: derivation 'headplane-with-agent'
│   ├───x86_64-darwin
│   │   └───default: derivation 'headplane-with-agent'
│   └───x86_64-linux
│       └───default: derivation 'headplane-with-agent'
├───devShells
│   ├───aarch64-darwin
│   │   └───default: development environment 'headplane'
│   ├───x86_64-darwin
│   │   └───default: development environment 'headplane'
│   └───x86_64-linux
│       └───default: development environment 'headplane'
├───formatter
│   ├───aarch64-darwin: package 'alejandra-4.0.0'
│   ├───x86_64-darwin: package 'alejandra-4.0.0'
│   └───x86_64-linux: package 'alejandra-4.0.0'
├───nixosModules
│   └───headplane: NixOS module
├───overlays
│   └───default: Nixpkgs overlay
└───packages
    ├───aarch64-darwin
    │   ├───headplane: package 'headplane-0.6.1'
    │   ├───headplane-agent: package 'hp_agent-0.6.1'
    │   ├───headplane-nixos-docs: package 'headplane-nixos-docs.md'
    │   └───headplane-ssh-wasm: package 'headplane-ssh-wasm-0.6.1'
    ├───x86_64-darwin
    │   ├───headplane: package 'headplane-0.6.1'
    │   ├───headplane-agent: package 'hp_agent-0.6.1'
    │   ├───headplane-nixos-docs: package 'headplane-nixos-docs.md'
    │   └───headplane-ssh-wasm: package 'headplane-ssh-wasm-0.6.1'
    └───x86_64-linux
        ├───headplane: package 'headplane-0.6.1'
        ├───headplane-agent: package 'hp_agent-0.6.1'
        ├───headplane-nixos-docs: package 'headplane-nixos-docs.md'
        └───headplane-ssh-wasm: package 'headplane-ssh-wasm-0.6.1'
```

## NixOS 模块选项 {#nixos-module-options}

选项位于 `services.headplane.*`，实现见 `./nix/`。
完整选项由 `mise run nixos-docs` 生成，参阅 [NixOS 模块选项](./NixOS-options.md)。中文页为同一选项集的人工翻译，不改变字段名、类型或默认值。

## 使用 {#usage}

1. 添加 `github:tale/headplane` flake 输入。
2. 导入默认 overlay，提供 `pkgs.headplane`。
3. 导入 `services.headplane.*` NixOS 模块。

以下保留上游输入示例。需要社区双语源码时，应选择维护仓库 `laity-cqf/headplane-zh-cn` 的 `stable` 引用；当前不把上游 Nix 包或镜像称为本 fork 的已发布产物。

```nix
# 项目的 flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    headplane = {
      url = "github:tale/headplane";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    headplane,
    ...
  }: {
    nixosConfigurations.MY_MACHINE = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # 提供 `services.headplane.*` NixOS 选项。
        headplane.nixosModules.headplane
        {
          # provides `pkgs.headplane`
          nixpkgs.overlays = [ headplane.overlays.default ];
        }
        {
          {config, pkgs, ...}:
          let
            format = pkgs.formats.yaml {};
            headscaleConfig = format.generate "headscale.yml" config.services.headscale.settings;
          in {
            services.headplane = {
              enable = true;
              settings = {
                server = {
                  host = "127.0.0.1";
                  port = 3000;
                  # 以 `sops-nix` 为例，也可填写任意包含密钥的文件路径。
                  cookie_secret_path = config.sops.secrets."headplane/serverCookieSecret".path;
                };
                headscale = {
                  url = "https://example.com";
                  config_path = "${headscaleConfig}";
                  # 以 `sops-nix` 为例，也可填写任意包含密钥的文件路径。
                  api_key_path = config.sops.secrets."headplane/headscaleApiKey".path;
                };
                integration.agent = {
                  enabled = true;
                };
                oidc = {
                  issuer = "https://oidc.example.com";
                  client_id = "headplane";
                  # 以 `sops-nix` 为例，也可填写任意包含密钥的文件路径。
                  client_secret_path = config.sops.secrets."headplane/oidcClientSecret".path;
                  disable_api_key_login = true;
                  # 与 Authelia 集成时可能需要此设置。
                  token_endpoint_auth_method = "client_secret_basic";
                };
              };
            };
          }
        }
      ];
    };
  };
}
```
