import {
  ClipboardList,
  ShoppingCart,
  ReceiptText,
  WalletCards,
  CreditCard,
} from "lucide-react";

import TransactionDashboard from "../transactions/components/TransactionDashboard";
import SalesRegister from "./SalesRegister";
import PurchaseRegister from "./PurchaseRegister";

const cards: any[] = [
  {
    title: "Sales Register",
    description: "View sales invoices, customer billing, taxable values, and total sales records.",
    component: SalesRegister,
    icon: <ShoppingCart size={22} />,
    permissionKey: "registers.salesRegister"
  },
  {
    title: "Purchase Register",
    description: "View purchase invoices, vendor billing, taxable values, and total purchase records.",
    component:PurchaseRegister,
    icon: <ReceiptText size={22} />,
    permissionKey: "registers.purchaseRegister"
  },
  {
    title: "Receipt Register",
    description: "View customer receipts, received amounts, adjusted values, and balance records.",
    component: "",
    icon: <WalletCards size={22} />,
    permissionKey: "registers.receiptRegister"
  },
  {
    title: "Payment Register",
    description: "View vendor payments, paid amounts, adjusted values, and payable balance records.",
    component: "",
    icon: <CreditCard size={22} />,
    permissionKey: "registers.paymentRegister"
  },
];

const RegistersDashboard = () => {
  return (
    <TransactionDashboard
      title="Registers"
      description="View and manage Sales, Purchase, Receipt, and Payment registers."
      icon={<ClipboardList size={24} />}
      cards={cards}
    />
  );
};

export default RegistersDashboard;