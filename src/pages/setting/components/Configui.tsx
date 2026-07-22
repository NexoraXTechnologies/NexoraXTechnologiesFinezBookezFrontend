/* ===================================================
   ⭐ REUSABLE UI
=================================================== */

import type { ReactNode } from "react";

export const Panel = ({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded border border-border bg-card shadow-sm">
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const BooleanBadge = ({ value }: { value: boolean }) => (
  <span
    className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${value
      ? "border-success/20 bg-success/10 text-success"
      : "border-border bg-muted text-muted-foreground"
      }`}
  >
    {value ? "Yes" : "No"}
  </span>
);

export const StatusPill = ({ status }: { status?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${status === "active"
      ? "border-success/20 bg-success/10 text-success"
      : "border-border bg-muted text-muted-foreground"
      }`}
  >
    {status === "active" ? "Active" : "Inactive"}
  </span>
);