import {
  ClipboardList,
  ShoppingCart,
  ReceiptText,
  WalletCards,
  CreditCard,
} from "lucide-react";

import TransactionDashboard from "../transactions/components/TransactionDashboard";

const cards: any[] = [
  {
    title: "Sales Register",
    description: "View sales invoices, customer billing, taxable values, and total sales records.",
    component: "",
    icon: <ShoppingCart size={22} />,
  },
  {
    title: "Purchase Register",
    description: "View purchase invoices, vendor billing, taxable values, and total purchase records.",
    component: "",
    icon: <ReceiptText size={22} />,
  },
  {
    title: "Receipt Register",
    description: "View customer receipts, received amounts, adjusted values, and balance records.",
    component: "",
    icon: <WalletCards size={22} />,
  },
  {
    title: "Payment Register",
    description: "View vendor payments, paid amounts, adjusted values, and payable balance records.",
    component: "",
    icon: <CreditCard size={22} />,
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