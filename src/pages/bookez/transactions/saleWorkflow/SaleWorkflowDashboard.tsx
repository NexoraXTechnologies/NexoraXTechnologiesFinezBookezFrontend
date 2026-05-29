import {
  BadgeIndianRupee,
  FileText,
  ClipboardList,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import type { DashboardCard } from "../components/TransactionDashboard";
import TransactionDashboard from "../components/TransactionDashboard";

const cards: DashboardCard[] = [
  {
    title: "Sales Quotations",
    description: "Create and manage sales quotations.",
    path: "/professional/transaction/sale-workflow/sales-quotations",
    icon: <FileText size={22} />,
  },
  {
    title: "Sales Orders",
    description: "Create and manage sales orders.",
    path: "/professional/transaction/sale-workflow/sales-orders",
    icon: <ClipboardList size={22} />,
  },
  {
    title: "Sales Invoices",
    description: "Create and manage sales invoices.",
    path: "/professional/transaction/sale-workflow/sales-invoices",
    icon: <ReceiptText size={22} />,
  },
  {
    title: "Sales Return",
    description: "Manage sales return transactions.",
    path: "/professional/transaction/sale-workflow/sales-return",
    icon: <RotateCcw size={22} />,
  },
];

const SaleWorkflowDashboard = () => {
  return (
    <TransactionDashboard
      title="Sale Workflow"
      description="Manage quotations, orders, invoices and returns."
      icon={<BadgeIndianRupee size={24} />}
      cards={cards}
    />
  );
};

export default SaleWorkflowDashboard;