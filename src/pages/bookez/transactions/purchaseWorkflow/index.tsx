import {
  ShoppingCart,
  ClipboardList,
  Truck,
  RotateCcw,
  ReceiptText,
  WalletCards,

} from "lucide-react";
import TransactionDashboard from "../components/TransactionDashboard";
import PurchaseOrder from "./purchaseOrder";
import Grn from "./Grn";
import PurchaseReturn from "./PurchaseReturn";
import PurchaseInvoice from "./PurchaseInvoice";
import Payment from "./Payment";

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
    component: Grn,
    icon: <Truck size={22} />,
  },
  {
    title: "Purchase Return",
    description: "Manage purchase return transactions.",
    component: PurchaseReturn,
    icon: <RotateCcw size={22} />,
  },
  {
    title: "Purchase Invoices",
    description: "Create and manage purchase invoices.",
    component: PurchaseInvoice,
    icon: <ReceiptText size={22} />,
  },
  {
    title: "Payment",
    description: "Create and manage payments.",
    component: Payment,
    icon: <WalletCards size={22} />,
  }
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