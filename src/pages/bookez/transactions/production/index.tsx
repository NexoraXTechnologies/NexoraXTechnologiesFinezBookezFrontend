import {
  PackageSearch,
  Factory,
  PackageMinus,
  PackagePlus,
} from "lucide-react";
import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import AssemblyProduction from "./assemblyProduction/AssemblyProduction";
import IssueToProduction from "./IssuesToProduction";
import ReceiptFromProduction from "./receiptFromProduction";


const cards: any[] = [
  {
    title: "Assembly Production",
    description: "Manage assembly and finished goods production.",
    component: AssemblyProduction,
    icon: <Factory size={22} />,
    permissionKey: "productions.assemblyProduction"
  },
  {
    title: "Issues to Production",
    description: "Issue raw materials or items for production.",
    component: IssueToProduction,
    icon: <PackageMinus size={22} />,
    permissionKey: "productions.issuesToProduction"
  },
  {
    title: "Receipts from Production",
    description: "Record finished goods received from production.",
    component: ReceiptFromProduction,
    icon: <PackagePlus size={22} />,
    permissionKey: "productions.receiptFromProduction"
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