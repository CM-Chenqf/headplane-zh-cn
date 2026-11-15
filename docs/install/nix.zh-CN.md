---
title: Nix/NixOS
description: 使用 flake 及其 NixOS 模块在 NixOS 上运行 Headplane。
---

# Nix/NixOS

仓库的 [flake](https://github.com/tale/headplane/blob/main/flake.nix) 提供包含 `pkgs.headplane` 和 `pkgs.headplane-agent` 的 overlay，以及通过 `services.headplane` 将 Headplane 运行为 systemd 服务的 NixOS 模块。运行 `nix flake show github:tale/headplane` 可列出全部导出项。

## 用法 [#usage]

添加 flake 输入，再导入模块和 overlay：

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    headplane = {
      url = "github:tale/headplane";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, headplane, ... }: {
    nixosConfigurations.my-machine = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        headplane.nixosModules.headplane
        { nixpkgs.overlays = [ headplane.overlays.default ]; }
        ({ config, pkgs, ... }: {
          services.headplane = {
            enable = true;
            settings = {
              server = {
                host = "127.0.0.1";
                port = 3000;
                # 任意保存密钥的文件均可，此处仅以 sops-nix 为例
                cookie_secret_path = config.sops.secrets."headplane/cookieSecret".path;
              };
              headscale = {
                url = "https://headscale.example.com";
                api_key_path = config.sops.secrets."headplane/headscaleApiKey".path;
                config_path = (pkgs.formats.yaml { }).generate "headscale.yaml"
                  config.services.headscale.settings;
              };
              integration.agent.enabled = true;
            };
          };
        })
      ];
    };
  };
}
```

模块将 `settings` 写入 `/etc/headplane/config.yaml`，因此[配置文件](/configuration)的每个选项都可在 `services.headplane.settings` 下设置。[NixOS 选项参考](/reference/nixos-options)列出了完整选项。模块还会将 Agent 路径指向对应 Nix 包，因此设置 `integration.agent.enabled = true` 即可启用 Agent。

上例使用上游 flake。使用本维护仓库时，应选择经过验证的双语分支或版本；当前发布状态见[语言与维护说明](/features/language)。

## 运行方式 [#how-it-runs]

服务以 Headscale 用户身份运行，并在 `headscale.service` 之后启动。默认启用 [proc 集成](/configuration/integrations#proc)，在界面修改设置后通过 systemd 重启 Headscale。

像上例一样从 `services.headscale.settings` 生成 `headscale.config_path` 时，文件会位于只读的 Nix store 中。Headplane 会以只读方式显示 DNS 设置并隐藏登录限制，应继续通过 Nix 配置管理这两类设置。DNS 记录是例外：将 Headscale 的 `dns.extra_records_path` 指向 store 之外的可写文件，即可通过 Headplane 编辑记录。

设置 `services.headplane.debug = true` 可启用调试日志。
