import {
  ClipboardList,
  ShoppingCart,
  ReceiptText,
  WalletCards,
  CreditCard,
  Truck,
  Route,
  Wrench,
  FileCheck,
  UserRoundCheck,
} from "lucide-react";

import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import SalesRegister from "./SalesRegister";
import PurchaseRegister from "./PurchaseRegister";
import ReceiptRegister from "./ReceiptRegister";
import PaymentRegister from "./PaymentRegister";

const cards: any[] = [
  {
    title: "Sales Register",
    description: "View sales invoices, customer billing, taxable values, and total sales records.",
    component: SalesRegister,
    icon: <ShoppingCart size={22} />,
    permissionKey: "registers.salesRegister"
  },
  {
    title: "Purchase Register",
    description: "View purchase invoices, vendor billing, taxable values, and total purchase records.",
    component: PurchaseRegister,
    icon: <ReceiptText size={22} />,
    permissionKey: "registers.purchaseRegister"
  },
  {
    title: "Receipt Register",
    description: "View customer receipts, received amounts, adjusted values, and balance records.",
    component: ReceiptRegister,
    icon: <WalletCards size={22} />,
    permissionKey: "registers.receiptRegister"
  },
  {
    title: "Payment Register",
    description: "View vendor payments, paid amounts, adjusted values, and payable balance records.",
    component: PaymentRegister,
    icon: <CreditCard size={22} />,
    permissionKey: "registers.paymentRegister"
  },
  {
    title: "Transport Order Register",
    description: "Track and manage all transport orders including shipment details, routes, and order status.",
    component: "",
    icon: <Truck size={22} />,
    permissionKey: "registers.transportOrderRegister"
  },
  {
    title: "Trip Allocation Register",
    description: "Manage vehicle and driver assignments for planned trips and transportation activities.",
    component: "",
    icon: <Route size={22} />,
    permissionKey: "registers.tripRegister"
  },
  {
    title: "Trip Expense Register",
    description: "Monitor trip-related expenses including fuel, tolls, and other operational costs.",
    component: "",
    icon: <WalletCards size={22} />,
    permissionKey: "registers.tripExpenseRegister"
  },
  {
    title: "Vehicle Maintenance Register",
    description: "Maintain vehicle service records, repair history, and maintenance schedules.",
    component: "",
    icon: <Wrench size={22} />,
    permissionKey: "registers.vehicleMaintenanceRegister"
  },
  {
    title: "POD Register",
    description: "Manage proof of delivery records and track delivery completion status.",
    component: "",
    icon: <FileCheck size={22} />,
    permissionKey: "registers.podRegister"
  },
  {
    title: "Driver Settlement Register",
    description: "Manage driver payments, settlements, allowances, and trip-wise expenses.",
    component: "",
    icon: <UserRoundCheck size={22} />,
    permissionKey: "registers.driverSettlementRegister"
  },







];

const RegistersDashboard = () => {
  return (
    <TransactionDashboard
      title="Registers"
      description="View and manage Sales, Purchase, Receipt, and Payment registers."
      icon={<ClipboardList size={24} />}
      cards={cards}
    />
  );
};

export default RegistersDashboard;