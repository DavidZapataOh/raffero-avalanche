"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { RaffleStatus as Status } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RaffleStatusProps {
  status: Status;
  className?: string;
}

const statusMap: Record<Status, { variant: BadgeVariant; label: string }> = {
  open: { variant: "success", label: "Open" },
  drawing: { variant: "warning", label: "Drawing" },
  completed: { variant: "neutral", label: "Completed" },
  claimed: { variant: "neutral", label: "Claimed" },
};

export function RaffleStatus({ status, className }: RaffleStatusProps) {
  const { variant, label } = statusMap[status];
  return (
    <Badge variant={variant} className={className}>
      <span
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
          status === "open" && "bg-mint",
          status === "drawing" && "bg-warning animate-pulse",
          (status === "completed" || status === "claimed") && "bg-gray-500"
        )}
      />
      {label}
    </Badge>
  );
}
