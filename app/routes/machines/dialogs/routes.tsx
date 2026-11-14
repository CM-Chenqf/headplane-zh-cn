import { useFetcher } from "react-router";

import Button from "~/components/button";
import Callout from "~/components/callout";
import { Dialog, DialogActions, DialogClose, DialogTitle } from "~/components/dialog";
import Link from "~/components/link";
import { Row, RowList } from "~/components/section";
import Switch from "~/components/switch";
import { useI18n } from "~/i18n/provider";
import type { ActionResult } from "~/utils/form";
import type { PopulatedNode } from "~/utils/node-info";

interface RoutesProps {
  node: PopulatedNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Routes({ node, isOpen, setIsOpen }: RoutesProps) {
  const { t } = useI18n();
  const fetcher = useFetcher<ActionResult>();
  const subnets = [
    ...node.customRouting.subnetApprovedRoutes,
    ...node.customRouting.subnetWaitingRoutes,
  ];

  function submit(routes: string[], enabled: boolean) {
    const form = new FormData();
    form.set("intent", "update_routes");
    form.set("node_id", node.id);
    form.set("enabled", String(enabled));
    for (const route of routes) {
      form.append("routes", route);
    }

    fetcher.submit(form, { method: "POST" });
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTitle>{t("machines.routesTitle", { name: node.givenName })}</DialogTitle>
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">{t("machines.subnetRoutes")}</h3>
        <p className="text-muted">
          {t("machines.subnetDescription")}{" "}
          <Link external styled to="https://tailscale.com/kb/1019/subnets">
            {t("common.docs")}
          </Link>
        </p>
        {subnets.length === 0 ? (
          <p className="text-muted py-2.5 text-sm">{t("machines.noRoutes")}</p>
        ) : (
          <RowList>
            {subnets.map((route) => (
              <Row
                action={
                  <Switch
                    defaultChecked={node.approvedRoutes.includes(route)}
                    label={t("machines.approveRoute", { route })}
                    onCheckedChange={(checked) => submit([route], checked)}
                  />
                }
                key={route}
              >
                <span className="font-mono text-xs break-all">{route}</span>
              </Row>
            ))}
          </RowList>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">{t("machines.exitNode")}</h3>
        <p className="text-muted">
          {t("machines.exitDescription")}{" "}
          <Link external styled to="https://tailscale.com/kb/1103/exit-nodes">
            {t("common.docs")}
          </Link>
        </p>
        {node.customRouting.exitRoutes.length === 0 ? (
          <p className="text-muted py-2.5 text-sm">{t("machines.noExitNode")}</p>
        ) : (
          <RowList>
            <Row
              action={
                <Switch
                  defaultChecked={node.customRouting.exitApproved}
                  label={t("machines.useExitNode")}
                  onCheckedChange={(checked) => submit(node.customRouting.exitRoutes, checked)}
                />
              }
            >
              {t("machines.useExitNode")}
            </Row>
          </RowList>
        )}
      </section>
      {fetcher.data?.ok === false && (
        <Callout variant="error">{fetcher.data.errors.form ?? t("machines.routesFailed")}</Callout>
      )}
      <DialogActions>
        <DialogClose render={<Button>{t("common.done")}</Button>} />
      </DialogActions>
    </Dialog>
  );
}
