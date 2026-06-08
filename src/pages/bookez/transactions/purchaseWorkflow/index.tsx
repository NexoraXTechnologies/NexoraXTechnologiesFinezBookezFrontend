import {
  ShoppingCart,
  ClipboardList,
  Truck,
  RotateCcw,
  ReceiptText,
} from "lucide-react";
import TransactionDashboard from "../components/TransactionDashboard";
import PurchaseOrder from "./PurchaseOrder";
import Grn from "./Grn";

const cards: any[] = [
  {
    title: "Purchase Order",
    description: "Create and manage purchase orders.",
    component: PurchaseOrder,
    icon: <ClipboardList size={22} />,
  },
  {
    title: "GRN",
    description: "Manage goods receipt notes.",
    component:Grn,
    icon: <Truck size={22} />,
  },
  {
    title: "Purchase Return",
    description: "Manage purchase return transactions.",
    path: "/professional/transaction/purchase-workflow/purchase-return",
    icon: <RotateCcw size={22} />,
  },
  {
    title: "Purchase Invoices",
    description: "Create and manage purchase invoices.",
    path: "/professional/transaction/purchase-workflow/purchase-invoices",
    icon: <ReceiptText size={22} />,
  },
];

const PurchaseWorkflowDashboard = () => {
  return (
    <TransactionDashboard
      title="Purchase Workflow"
      description="Manage purchase orders, GRN, invoices and returns."
      icon={<ShoppingCart size={24} />}
      cards={cards}
    />
  );
};

export default PurchaseWorkflowDashboard;