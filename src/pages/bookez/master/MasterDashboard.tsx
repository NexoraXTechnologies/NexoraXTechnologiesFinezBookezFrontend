import {
  BrickWallShield,
  Wallet,
  PackageSearch,
  Ruler,
} from "lucide-react";
import { FaRegFilePowerpoint } from "react-icons/fa";

import TransactionDashboard, {
  type DashboardCard,
} from "../transactions/components/TransactionDashboard";
import AccountMaster from "./AccountMaster";
import ProductMaster from "./ProductMaster";
import UnitMaster from "./UnitMaster";
import ReportMapping from "./ReportMapping";


const masterCards: DashboardCard[] = [
  {
    title: "Account",
    description: "Manage customers, vendors, cash, bank and ledgers.",
    icon: <Wallet size={22} />,
    component: AccountMaster,
  },
  {
    title: "Product",
    description: "Manage products, services, pricing and inventory details.",
    icon: <PackageSearch size={22} />,
    component: ProductMaster,
  },
  {
    title: "Unit",
    description: "Manage unit measurements for products and transactions.",
    icon: <Ruler size={22} />,
    component: UnitMaster,
  },
  {
    title: "Reports Mapping",
    description: "Configure templates and mapped report formats.",
    icon: <FaRegFilePowerpoint size={22} />,
    component: ReportMapping,
  },
];

const MasterDashboard = () => {
  return (
    <TransactionDashboard
      title="Master"
      description="Manage all BookEZ master data."
      icon={<BrickWallShield size={24} />}
      cards={masterCards}
    />
  );
};

export default MasterDashboard;