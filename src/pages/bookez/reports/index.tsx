import {
  PackageSearch,
  Factory,
  PackageMinus,
  PackagePlus,
  CircleDollarSign,
} from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import AccountsReceivable from "./AccountsReceivable";
import AccountLedger from "./AccountLedger";
import StockLedger from "./StockLedger";
import AccountPayable from "./AccountPayable";

const cards: any[] = [
  {
    title: "Accounts Receivable",
    description: "View and track outstanding customer balances and pending receivables.",
    component: AccountsReceivable,
    icon: <Factory size={22} />,
    permissionKey: "accountReceivable"
  },
  {
    title: "Accounts Payable",
    description: "Monitor outstanding vendor bills, pending payments, and payable balances.",
    component: AccountPayable,
    icon: <CircleDollarSign size={22} />,
    permissionKey: "accountPayable",
  },
  {
    title: "Account Ledger",
    description: "Review account-wise debit, credit, and running balance transactions.",
    component: AccountLedger,
    icon: <PackageMinus size={22} />,
    permissionKey: "accountLedger"
  },
  {
    title: "Stock Ledger",
    description: "Track item-wise stock movements, quantities, and inventory balances.",
    component: StockLedger,
    icon: <PackagePlus size={22} />,
    permissionKey: "stockLedger"
  },
];

const ReportsDashboard = () => {
  return (
    <TransactionDashboard
      title="Reports"
      description="View and manage Accounts Receivable, Account Ledger, and Stock Ledger reports."
      icon={<PackageSearch size={24} />}
      cards={cards}
    />
  );
};

export default ReportsDashboard;