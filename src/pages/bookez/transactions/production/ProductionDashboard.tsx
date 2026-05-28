import {
  PackageSearch,
  Factory,
  PackageMinus,
  PackagePlus,
} from "lucide-react";
import type { DashboardCard } from "../components/TransactionDashboard";
import TransactionDashboard from "../components/TransactionDashboard";


const cards: DashboardCard[] = [
  {
    title: "Assembly Production",
    description: "Manage assembly and finished goods production.",
    path: "/professional/transaction/production/assembly-production",
    icon: <Factory size={22} />,
  },
  {
    title: "Issues to Production",
    description: "Issue raw materials or items for production.",
    path: "/professional/transaction/production/issues-to-production",
    icon: <PackageMinus size={22} />,
  },
  {
    title: "Receipts from Production",
    description: "Record finished goods received from production.",
    path: "/professional/transaction/production/receipts-from-production",
    icon: <PackagePlus size={22} />,
  },
];

const ProductionDashboard = () => {
  return (
    <TransactionDashboard
      title="Production"
      description="Manage production, material issues and production receipts."
      icon={<PackageSearch size={24} />}
      cards={cards}
    />
  );
};

export default ProductionDashboard;