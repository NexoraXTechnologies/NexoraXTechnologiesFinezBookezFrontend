
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

import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";

import AccountMaster from "./AccountMaster";
import ProductMaster from "./productMaster/ProductMaster";
import UnitMaster from "./UnitMaster";
import ReportMapping from "./ReportMapping";
import { getCustomMasterModules } from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
import CustomMasterComp from "./customMasterComp";
import KitCollection from "./kitCollection";
import { getAllSystemConfigurations } from "../../../redux/slices/systemConf";

const MasterDashboard = () => {
  const dispatch = useDispatch();
  const { customMasterModules = [], loading } = useSelector((state: any) => state.customMasterModule);
  const { configurations = [] } = useSelector((state: any) => state.systemConfiguration);
  const kitEanble = (configurations?.[0]?.systemConfiguration?.kitConfiguration?.enableKit == "true") || configurations?.[0]?.systemConfiguration?.kitConfiguration?.enableKit == true;

  useEffect(() => {
    dispatch(
      getCustomMasterModules({
        offset: 0,
        limit: 1000,
        search: "",
      }) as any
    );
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      getAllSystemConfigurations({}) as any
    );
  },[])
  const masterCards: any[] = useMemo(() => {
    const defaultCards: any[] = [
      {
        title: "Account",
        description: "Manage customers, vendors, cash, bank and ledgers.",
        icon: <Wallet size={22} />,
        component: AccountMaster,
        permissionKey: "accountMaster"
      },
      {
        title: "Product",
        description: "Manage products, services, pricing and inventory details.",
        icon: <PackageSearch size={22} />,
        component: ProductMaster,
        permissionKey: "productMaster"
      },
      {
        title: "Unit",
        description: "Manage unit measurements for products and transactions.",
        icon: <Ruler size={22} />,
        component: UnitMaster,
        permissionKey: "unitMaster"
      },
      ...(kitEanble ? [{
        title: "KIT",
        description: "Manage unit measurements for products and transactions.",
        icon: <Ruler size={22} />,
        component: KitCollection,
        permissionKey: "unitMaster"
      }] : []),
    ];

    const apiCards: any[] = customMasterModules.map((item: any) => {
      const moduleName = item?.moduleName || "Custom Master";
      const moduleCode = item?.moduleCode || item?._id || "";
      const CustomMasterScreen = () => (
        <CustomMasterComp name={moduleName} moduleCode={moduleCode} />
      );

      if (item?.status !== "active") return {}
      return {
        title: moduleName,
        description:
          item?.description || `Manage ${moduleName} custom master data.`,
        icon: <Boxes size={22} />,
        component: CustomMasterScreen,
        permissionKey: "Pass"
      };
    });
 
    const reportCard: any = [
      {
        title: "Reports Mapping",
        description: "Configure templates and mapped report formats.",
        icon: <FaRegFilePowerpoint size={22} />,
        component: ReportMapping,
        permissionKey: "reportMappingMaster"
      },
    ];

    return [...defaultCards, ...apiCards, ...reportCard];
  }, [customMasterModules, configurations]);

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