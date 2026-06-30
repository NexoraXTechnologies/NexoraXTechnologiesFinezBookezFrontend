import {
  Settings2,
  Layers3,
  FileImage,
  Wrench,
} from "lucide-react";
import TransactionDashboard from "../transactions/components/TransactionDashboard";
import SetDefaultValue from "./setDefaultValue/SetDefaultValue";
import Bom from "./BOM/Bom";
import CreateEditEngineeringConfig from "./EngineeringConfig/CreateEditEngineeringConfig";

const cards: any[] = [
  {
    title: "Set Default Value",
    description:
      "Configure default engineering values used across BOM, drawings, and production-related processes.",
    component:SetDefaultValue,
    icon: <Settings2 size={22} />,
    permissionKey: "accountLedger",
  },
  {
    title: "BOM",
    description:
      "Create and manage Bill of Materials with product components, quantities, units, and material details.",
    component: Bom,
    icon: <Layers3 size={22} />,
    permissionKey: "accountLedger",
  },
  {
    title: "Engineering Drawing",
    description:
      "Upload, view, and manage product engineering drawings, technical layouts, and design references.",
    component:CreateEditEngineeringConfig,
    icon: <FileImage size={22} />,
    permissionKey: "accountLedger",
  },
];

const EngineeringModuleDashboard = () => {
  return (
    <TransactionDashboard
      title="Engineering Module"
      description="Manage engineering setup, BOM structures, and technical drawing information in one place."
      icon={<Wrench size={24} />}
      cards={cards}
    />
  );
};

export default EngineeringModuleDashboard;