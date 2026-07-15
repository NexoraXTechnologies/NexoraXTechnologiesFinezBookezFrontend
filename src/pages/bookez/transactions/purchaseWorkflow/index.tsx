import { ShoppingCart, ClipboardList, Truck, RotateCcw, ReceiptText, WalletCards } from "lucide-react";
import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import PurchaseOrder from "./purchaseOrder";
import Grn from "./Grn";
import PurchaseReturn from "./PurchaseReturn";
import PurchaseInvoice from "./PurchaseInvoice";
import Payment from "./Payment";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";

const PurchaseWorkflowDashboard = () => {
  const dispatch = useDispatch();
  const { configurations } = useSelector((state: any) => state.systemConfiguration);

  const enablePayment = useMemo(() => {
    const locationConfig = configurations?.[0]?.financeConfiguration?.isActive
    return locationConfig === true || locationConfig === "true";
  }, [configurations]);

  useEffect(() => {
    dispatch(
      getAllSystemConfigurations({
        offset: 0,
        limit: 100000,
        status: "",
      }) as any
    );
  }, [])

  const cards: any[] = [
    {
      title: "Purchase Order",
      description: "Create and manage purchase orders.",
      component: PurchaseOrder,
      icon: <ClipboardList size={22} />,
      permissionKey: "purchaseOrder"
    },
    {
      title: "GRN",
      description: "Manage goods receipt notes.",
      component: Grn,
      icon: <Truck size={22} />,
      permissionKey: "grn"
    },
    {
      title: "Purchase Return",
      description: "Manage purchase return transactions.",
      component: PurchaseReturn,
      icon: <RotateCcw size={22} />,
      permissionKey: "purchaseReturn"
    },
    {
      title: "Purchase Invoices",
      description: "Create and manage purchase invoices.",
      component: PurchaseInvoice,
      icon: <ReceiptText size={22} />,
      permissionKey: "purchaseInvoice"
    },
    ...(enablePayment ? [{
      title: "Payment",
      description: "Create and manage payments.",
      component: Payment,
      icon: <WalletCards size={22} />,
      permissionKey: "payment"
    }] : [])
  ];

  return (
    <TransactionDashboard
      title="Purchase Workflow"
      description="Manage purchase orders, GRN, invoices and returns."
      icon={<ShoppingCart size={24} />}
      cards={cards}
    />
  );
};

export default PurchaseWorkflowDashboard;