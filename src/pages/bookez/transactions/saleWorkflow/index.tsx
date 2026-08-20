import {
  BadgeIndianRupee,
  FileText,
  ClipboardList,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import SalesQuotations from "./salesQuations/SalesQuations";
import SalesOrder from "./salesOrder/SalesOrder";
import SalesInVoice from "./salesInvoice/SalesInvoice";
import SalesReturn from "./salesReturn";
import SalesReceipt from "./salesReceipt";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";

const SaleWorkflowDashboard = () => {
  const dispatch = useDispatch();
  const { configurations } = useSelector((state: any) => state.systemConfiguration);

  const enableReceipt = useMemo(() => {
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

  const cards: any = [
    {
      title: "Sales Quotations",
      description: "Create and manage sales quotations.",
      component: SalesQuotations,
      icon: <FileText size={22} />,
      permissionKey: "salesQuotation"
    },
    {
      title: "Sales Orders",
      description: "Create and manage sales orders.",
      component: SalesOrder,
      icon: <ClipboardList size={22} />,
      permissionKey: "salesOrder"
    },
    {
      title: "Sales Invoices",
      description: "Create and manage sales invoices.",
      component: SalesInVoice,
      icon: <ReceiptText size={22} />,
      permissionKey: "salesInvoice"
    },
    {
      title: "Sales Return",
      description: "Manage sales return transactions.",
      component: SalesReturn,
      icon: <RotateCcw size={22} />,
      permissionKey: "salesReturn"
    },
    ...(enableReceipt ? [{
      title: "Receipt",
      description: "Manage sales return transactions.",
      component: SalesReceipt,
      icon: <ReceiptText size={22} />,
      permissionKey: "receipt"
    }] : []),
  ];
  return (
    <TransactionDashboard
      title="Sale Workflow"
      description="Manage quotations, orders, invoices and returns."
      icon={<BadgeIndianRupee size={24} />}
      cards={cards}
    />
  );
};

export default SaleWorkflowDashboard;