// src/pages/bookez/master/MasterDashboard.tsx

import {
  BrickWallShield,
  Wallet,
  PackageSearch,
  Ruler,
} from "lucide-react";
import { FaRegFilePowerpoint } from "react-icons/fa";
import TransactionDashboard, { type DashboardCard } from "../transactions/components/TransactionDashboard";



const masterCards: DashboardCard[] = [
  {
    title: "Account",
    description: "Manage customers, vendors, cash, bank and ledgers.",
    path: "/professional/master/account",
    icon: <Wallet size={22} />,
  },
  {
    title: "Product",
    description: "Manage products, services, pricing and inventory details.",
    path: "/professional/master/product",
    icon: <PackageSearch size={22} />,
  },
  {
    title: "Unit",
    description: "Manage unit measurements for products and transactions.",
    path: "/professional/master/unit",
    icon: <Ruler size={22} />,
  },
  {
    title: "Reports Mapping",
    description: "Configure templates and mapped report formats.",
    path: "/professional/master/reports-mapping",
    icon: <FaRegFilePowerpoint size={22} />,
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