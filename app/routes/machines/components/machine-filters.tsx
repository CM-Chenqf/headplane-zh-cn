import { X } from "lucide-react";
import type { JSX } from "react";

import Button from "~/components/button";
import FilterDropdown from "~/components/filter-dropdown";
import { useI18n } from "~/i18n/provider";
import type { User } from "~/types/User";
import type { PopulatedNode } from "~/utils/node-info";
import { getUserDisplayName, sortUsersByDisplayName } from "~/utils/user";

import { useMachineFilterParams } from "../hooks/use-machine-filter-params";

const STATUS_OPTIONS = [
  { value: "online", label: "machines.online" },
  { value: "offline", label: "machines.offline" },
  { value: "expired", label: "expiry.expired" },
] as const;

const ROUTE_OPTIONS = [
  { value: "exit-node", label: "machines.exitNode" },
  { value: "subnet", label: "machines.subnetRouter" },
] as const;

interface MachineFiltersProps {
  users: User[];
  populatedNodes: PopulatedNode[];
}

export function MachineFilters({ users, populatedNodes }: MachineFiltersProps): JSX.Element {
  const { t } = useI18n();
  const {
    filterUser,
    filterTag,
    filterStatus,
    filterRoute,
    hasActiveFilters,
    setParam,
    clearFilters,
  } = useMachineFilterParams();

  const tagOwnedExists = populatedNodes.some((n) => !n.user);
  const userOptions = [
    ...(tagOwnedExists ? [{ value: "tag-owned", label: t("machines.tagOwned") }] : []),
    ...sortUsersByDisplayName(users).map((u) => ({ value: u.name, label: getUserDisplayName(u) })),
  ];

  const tagOptions = Array.from(new Set(populatedNodes.flatMap((n) => n.tags)))
    .filter(Boolean)
    .sort()
    .map((tag) => ({ value: tag, label: tag }));

  return (
    <>
      {userOptions.length > 0 && (
        <FilterDropdown
          label={t("machines.user")}
          onChange={(v) => setParam("user", v)}
          options={userOptions}
          value={filterUser}
        />
      )}
      {tagOptions.length > 0 && (
        <FilterDropdown
          label={t("machines.tag")}
          onChange={(v) => setParam("tag", v)}
          options={tagOptions}
          value={filterTag}
        />
      )}
      <FilterDropdown
        label={t("machines.status")}
        onChange={(v) => setParam("status", v)}
        options={STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
        value={filterStatus}
      />
      <FilterDropdown
        label={t("machines.route")}
        onChange={(v) => setParam("route", v)}
        options={ROUTE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
        value={filterRoute}
      />
      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="ghost">
          {t("machines.clearFilters")}
          <X className="size-3.5" />
        </Button>
      )}
    </>
  );
}
