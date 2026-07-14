import {
  Wallet,
  Landmark,
  Boxes,
  BookOpenCheck,
  ArrowLeftRight,
  FilePlus2,
  FileMinus2,
} from "lucide-react";
import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import OpeningBalance from "./openingBalance";
import OpeningStock from "./openingStock";
import JournalVoucher from "./JournalVoucher";
import ContraVoucher from "./ContraVoucher";
import CreditNote from "./CreditNote";
import DebitNote from "./DebitNote";
import ImpBankStatemnt from "./impBankStatemnt";

const cards: any = [
  {
    title: "Opening Balances",
    description: "Manage account-wise opening balances.",
    component: OpeningBalance,
    icon: <Landmark size={22} />,
    permissionKey: "openingBalance"
  },
  {
    title: "Opening Stocks",
    description: "Manage product-wise opening stock entries.",
    component: OpeningStock,
    icon: <Boxes size={22} />,
    permissionKey: "openingStock"
  },
  {
    title: "Journal Voucher",
    description: "Create and manage journal voucher entries.",
    component: JournalVoucher,
    icon: <BookOpenCheck size={22} />,
    permissionKey: "journalVouchar"
  },
  {
    title: "Contra Voucher",
    description: "Manage cash and bank transfer entries.",
    component: ContraVoucher,
    icon: <ArrowLeftRight size={22} />,
    permissionKey: "contraVoucher"
  },
  {
    title: "Credit Note",
    description: "Create and manage credit note entries.",
    component: CreditNote,
    icon: <FilePlus2 size={22} />,
    permissionKey: "creditNote"
  },
  {
    title: "Debit Note",
    description: "Create and manage debit note entries.",
    component: DebitNote,
    icon: <FileMinus2 size={22} />,
    permissionKey: "debitNotes"
  },
  {
    title: "Import Bank Statement",
    description: "Attach bank statement and fetch data",
    component: ImpBankStatemnt,
    icon: <FileMinus2 size={22} />,
    permissionKey: "Pass"
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