import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ShoppingCart,
  Landmark,
  CalendarClock,
  PackageCheck,
  RotateCcw,
  FileText,
} from "lucide-react";

/* ===================================================
   ⭐ TYPES
=================================================== */

type TransactionKey =
  | "salesQuotation"
  | "salesOrders"
  | "salesInvoice"
  | "receipt"
  | "salesReturn"
  | "purchaseOrder"
  | "grn"
  | "purchaseInvoice"
  | "purchaseReturn"
  | "purchasePayment";

type TransactionItem = {
  key: TransactionKey;
  name: string;
  description: string;
  icon: ReactNode;
};

/* ===================================================
   ⭐ CONSTANTS
   Order and copy match the reference screens exactly.
   Hook your own schema slice in per key inside
   `renderTransactionDetail` below — that part is left
   for you to wire up.
=================================================== */

const TRANSACTIONS: TransactionItem[] = [
  {
    key: "salesQuotation",
    name: "Sales Quotation",
    description: "Configure Sales Quotation fields",
    icon: <FileText size={20} />,
  },
  {
    key: "salesOrders",
    name: "Sales Orders",
    description: "Configure Sales Orders fields",
    icon: <CalendarClock size={20} />,
  },
  {
    key: "salesInvoice",
    name: "Sales Invoice",
    description: "Configure Sales Invoice fields",
    icon: <ShoppingCart size={20} />,
  },
  {
    key: "receipt",
    name: "Receipt",
    description: "Configure Receipt fields",
    icon: <Landmark size={20} />,
  },
  {
    key: "salesReturn",
    name: "Sales Return",
    description: "Configure Sales Return fields",
    icon: <RotateCcw size={20} />,
  },
  {
    key: "purchaseOrder",
    name: "Purchase Order",
    description: "Configure Purchase Order fields",
    icon: <CalendarClock size={20} />,
  },
  {
    key: "grn",
    name: "GRN",
    description: "Configure GRN fields",
    icon: <PackageCheck size={20} />,
  },
  {
    key: "purchaseInvoice",
    name: "Purchase Invoice",
    description: "Configure Purchase Invoice fields",
    icon: <ShoppingCart size={20} />,
  },
  {
    key: "purchaseReturn",
    name: "Purchase Return",
    description: "Configure Purchase Return fields",
    icon: <RotateCcw size={20} />,
  },
  {
    key: "purchasePayment",
    name: "Purchase Payment",
    description: "Configure Purchase Payment fields",
    icon: <Landmark size={20} />,
  },
];

/* ===================================================
   ⭐ MAIN PAGE
=================================================== */

const TransactionsConfigurationList = () => {
  const [selected, setSelected] = useState<TransactionItem | null>(null);

  /* -------------------------------------------------
     Detail view — swap this stub for your real
     per-transaction schema builder once the slice
     for each transaction type is wired up.
  ------------------------------------------------- */
  const renderTransactionDetail = (item: TransactionItem) => (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-card-foreground transition hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-card-foreground">{item.name}</h1>
      </header>

      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {item.icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            {item.description}
          </h3>
          <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-muted-foreground">
            Hook the schema builder for {item.name} here.
          </p>
        </div>
      </div>
    </div>
  );

  if (selected) {
    return renderTransactionDetail(selected);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ================= HEADER ================= */}
      <header className="flex items-center gap-3 rounded-b-3xl bg-card px-4 py-4 shadow-sm">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-card-foreground transition hover:bg-muted"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-extrabold text-card-foreground">
          Transactions Configuration
        </h1>
      </header>

      {/* ================= LIST ================= */}
      <div className="flex flex-col gap-3 p-4">
        {TRANSACTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSelected(item)}
            className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-sm transition hover:bg-muted/60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {item.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-card-foreground">
                {item.name}
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-muted-foreground">
                {item.description}
              </span>
            </span>

            <ChevronRight size={20} className="shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransactionsConfigurationList;