
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  BrickWallShield,
  Wallet,
  PackageSearch,
  Ruler,
  Boxes,
} from "lucide-react";
import { FaRegFilePowerpoint } from "react-icons/fa";

import TransactionDashboard, {
  type DashboardCard,
} from "../transactions/components/TransactionDashboard";

import AccountMaster from "./AccountMaster";
import ProductMaster from "./ProductMaster";
import UnitMaster from "./UnitMaster";
import ReportMapping from "./ReportMapping";
import { getCustomMasterModules } from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
import CustomMasterComp from "./customMasterComp";


const MasterDashboard = () => {
  const dispatch = useDispatch();

  const { customMasterModules = [], loading } = useSelector(
    (state: any) => state.customMasterModule
  );

  useEffect(() => {
    dispatch(
      getCustomMasterModules({
        offset: 0,
        limit: 1000,
        search: "",
      }) as any
    );
  }, [dispatch]);

  const masterCards: DashboardCard[] = useMemo(() => {
    const defaultCards: DashboardCard[] = [
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
    ];

    const apiCards: DashboardCard[] = customMasterModules.map((item: any) => {
      const moduleName = item?.moduleName || "Custom Master";
      const moduleCode = item?.moduleCode || item?._id || "";

      const CustomMasterScreen = () => (
        <CustomMasterComp name={moduleName} moduleCode={moduleCode} />
      );

      return {
        title: moduleName,
        description:
          item?.description || `Manage ${moduleName} custom master data.`,
        icon: <Boxes size={22} />,
        component: CustomMasterScreen,
      };
    });

    const reportCard: DashboardCard[] = [
      {
        title: "Reports Mapping",
        description: "Configure templates and mapped report formats.",
        icon: <FaRegFilePowerpoint size={22} />,
        component: ReportMapping,
      },
    ];

    return [...defaultCards, ...apiCards, ...reportCard];
  }, [customMasterModules]);

  return (
    <TransactionDashboard
      title="Master"
      description="Manage all BookEZ master data."
      icon={<BrickWallShield size={24} />}
      cards={masterCards}
      loading={loading}
    />
  );
};

export default MasterDashboard;