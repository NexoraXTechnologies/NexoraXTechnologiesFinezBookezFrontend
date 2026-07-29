import {
  ClipboardList,
  ShoppingCart,
  ReceiptText,
  WalletCards,
  Truck,
  Route,
  Wrench,
  FileCheck,
  UserRoundCheck,
  FileText,
  Combine,
  Scale,
  PackageOpen,
  HandCoins,
  ArchiveRestore,
} from "lucide-react";

import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import SalesRegister from "./SalesRegister";
import PurchaseRegister from "./PurchaseRegister";
import ReceiptRegister from "./ReceiptRegister";
import PaymentRegister from "./PaymentRegister";
import TransportOrderRegister from "./transportOrderRegister";
import TripAllocationRegister from "./tripAllocationRegister";
import TripExpenseRegister from "./TripExpenseRegister";
import PodRegister from "./podRegister";
import VehicleMaintenanceRegister from "./vehiclemaintenanceregister";
import DriverSettlementRegister from "./driversettlementregister";
import QuotationRegister from "./quotationRegister";
import SalesReturnRegister from "./SalesReturnRegister";
import PurchaseReturnRegister from "./PurchaseReturnRegister";
import OpeningBalanceRegister from "./OpeningBalanceRegister";
import OpeningStockRegister from "./OpeningStockRegister";

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
    icon: <HandCoins size={22} />,
    permissionKey: "registers.paymentRegister"
  },
  {
    title: "Quotation Register",
    description: "View quotations, customer estimates, validity dates, amounts, and quotation status.",
    component: QuotationRegister,
    icon: <FileText size={22} />,
    permissionKey: "registers.quotationRegister"
  },
  {
    title: "Sales Return Register",
    description: "View returned sales invoices, customer returns, quantities, taxes, and refund values.",
    component: SalesReturnRegister,
    icon: <ArchiveRestore size={22} />,
    permissionKey: "registers.salesReturnRegister"
  },
  {
    title: "Purchase Return Register",
    description: "View goods returned to vendors, returned quantities, taxes, and payable adjustments.",
    component: PurchaseReturnRegister,
    icon: <Combine size={22} />,
    permissionKey: "registers.purchaseReturnRegister"
  },
  {
    title: "Openining Balance Register",
    description: "View account opening balances, debit and credit amounts, and ledger-wise values.",
    component: OpeningBalanceRegister,
    icon: <Scale size={22} />,
    permissionKey: "registers.openingBalanceRegister"
  },
  {
    title: "Openining Stock Register",
    description: "View opening product quantities, valuation rates, warehouses, and total stock value.",
    component: OpeningStockRegister,
    icon: <PackageOpen size={22} />,
    permissionKey: "registers.openingStockRegister"
  },
  {
    title: "Transport Order Register",
    description: "Track and manage all transport orders including shipment details, routes, and order status.",
    component: TransportOrderRegister,
    icon: <Truck size={22} />,
    permissionKey: "registers.transportOrderRegister"
  },
  {
    title: "Trip Allocation Register",
    description: "Manage vehicle and driver assignments for planned trips and transportation activities.",
    component: TripAllocationRegister,
    icon: <Route size={22} />,
    permissionKey: "registers.tripRegister"
  },
  {
    title: "Trip Expense Register",
    description: "Monitor trip-related expenses including fuel, tolls, and other operational costs.",
    component: TripExpenseRegister,
    icon: <WalletCards size={22} />,
    permissionKey: "registers.tripExpenseRegister"
  },
  {
    title: "Vehicle Maintenance Register",
    description: "Maintain vehicle service records, repair history, and maintenance schedules.",
    component: VehicleMaintenanceRegister,
    icon: <Wrench size={22} />,
    permissionKey: "registers.vehicleMaintenanceRegister"
  },
  {
    title: "POD Register",
    description: "Manage proof of delivery records and track delivery completion status.",
    component: PodRegister,
    icon: <FileCheck size={22} />,
    permissionKey: "registers.podRegister"
  },
  {
    title: "Driver Settlement Register",
    description: "Manage driver payments, settlements, allowances, and trip-wise expenses.",
    component: DriverSettlementRegister,
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