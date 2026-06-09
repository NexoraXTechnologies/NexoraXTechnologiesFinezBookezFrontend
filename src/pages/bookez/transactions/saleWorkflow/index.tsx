import {
  BadgeIndianRupee,
  FileText,
  ClipboardList,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import TransactionDashboard from "../components/TransactionDashboard";
import SalesQuotations from "./salesQuations/SalesQuations";
import SalesOrder from "./salesOrder/SalesOrder";
import SalesInVoice from "./salesInvoice/SalesInvoice";
import SalesReturn from "./salesReturn";

const cards: any = [
  {
    title: "Sales Quotations",
    description: "Create and manage sales quotations.",
    component: SalesQuotations,
    icon: <FileText size={22} />,
  },
  {
    title: "Sales Orders",
    description: "Create and manage sales orders.",
    component: SalesOrder,
    icon: <ClipboardList size={22} />,
  },
  {
    title: "Sales Invoices",
    description: "Create and manage sales invoices.",
    component: SalesInVoice,
    icon: <ReceiptText size={22} />,
  },
  {
    title: "Sales Return",
    description: "Manage sales return transactions.",
    component: SalesReturn,
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