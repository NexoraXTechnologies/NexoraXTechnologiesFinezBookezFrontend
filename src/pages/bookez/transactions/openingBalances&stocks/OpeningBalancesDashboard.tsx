import {
  Wallet,
  Landmark,
  Boxes,
  BookOpenCheck,
  ArrowLeftRight,
  FilePlus2,
  FileMinus2,
} from "lucide-react";
import type { DashboardCard } from "../components/TransactionDashboard";
import TransactionDashboard from "../components/TransactionDashboard";


const cards: DashboardCard[] = [
  {
    title: "Opening Balances",
    description: "Manage account-wise opening balances.",
    path: "/professional/transaction/opening-balances/account",
    icon: <Landmark size={22} />,
  },
  {
    title: "Opening Stocks",
    description: "Manage product-wise opening stock entries.",
    path: "/professional/transaction/opening-balances/stock",
    icon: <Boxes size={22} />,
  },
  {
    title: "Journal Voucher",
    description: "Create and manage journal voucher entries.",
    path: "/professional/transaction/opening-balances/journal-voucher",
    icon: <BookOpenCheck size={22} />,
  },
  {
    title: "Contra Voucher",
    description: "Manage cash and bank transfer entries.",
    path: "/professional/transaction/opening-balances/contra-voucher",
    icon: <ArrowLeftRight size={22} />,
  },
  {
    title: "Credit Note",
    description: "Create and manage credit note entries.",
    path: "/professional/transaction/opening-balances/credit-note",
    icon: <FilePlus2 size={22} />,
  },
  {
    title: "Debit Note",
    description: "Create and manage debit note entries.",
    path: "/professional/transaction/opening-balances/debit-note",
    icon: <FileMinus2 size={22} />,
  },
];

const OpeningBalancesDashboard = () => {
  return (
    <TransactionDashboard
      title="Opening Balances / Stocks"
      description="Manage opening balances, opening stocks and accounting vouchers."
      icon={<Wallet size={24} />}
      cards={cards}
    />
  );
};

export default OpeningBalancesDashboard;