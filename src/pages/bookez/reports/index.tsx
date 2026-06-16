import {
  PackageSearch,
  Factory,
  PackageMinus,
  PackagePlus,
} from "lucide-react";
import TransactionDashboard from "../transactions/components/TransactionDashboard";
import AccountsReceivable from "./AccountsReceivable";
import AccountLedger from "./AccountLedger";
import StockLedger from "./StockLedger";

const cards: any[] = [
  {
    title: "Accounts Receivable",
    description: "View and track outstanding customer balances and pending receivables.",
    component: AccountsReceivable,
    icon: <Factory size={22} />,
  },
  {
    title: "Account Ledger",
    description: "Review account-wise debit, credit, and running balance transactions.",
    component: AccountLedger,
    icon: <PackageMinus size={22} />,
  },
  {
    title: "Stock Ledger",
    description: "Track item-wise stock movements, quantities, and inventory balances.",
    component: StockLedger,
    icon: <PackagePlus size={22} />,
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