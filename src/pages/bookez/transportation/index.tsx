import {
  Truck,
  Route,
  Fuel,
  FileText,
  Wrench,
  FileSignature,
  HandCoins,
  PackagePlus,
} from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";


const cards: any[] = [
   {
    title: "Create Contract",
    description: "Create transport contracts with customers, vendors, or fleet partners.",
    path: "/bookEz/transportation/transport-contract",
    icon: <FileSignature size={22} />,
    permissionKey: "Pass",
  },
  {
    title: "Create Transport Order",
    description: "Create and manage transport orders for customer goods movement.",
    path: "/bookEz/transportation/transport-order",
    icon: <PackagePlus size={22} />,
    permissionKey: "Pass",
  },
  {
    title: "Trip Allocation",
    description: "Assign vehicles, drivers, and routes to planned transport trips.",
    path: "/bookEz/transportation/trip-allocation",
    icon: <Route size={22} />,
    permissionKey: "Pass",
  },
  {
    title: "Trip Expense",
    description: "Record fuel, toll, loading, unloading, and other trip-related expenses.",
    path: "/bookEz/transportation/trip-expense",
    icon: <Fuel size={22} />,
    permissionKey: "Pass",
  },
  {
    title: "Trip L/R Entry",
    description: "Create and track lorry receipt entries for transport shipments.",
    component: "",
    icon: <FileText size={22} />,
    permissionKey: "Pass",
  },
  {
    title: "Vehicle Maintenance",
    description: "Manage vehicle service, repair history, and maintenance expenses.",
    component: "",
    icon: <Wrench size={22} />,
    permissionKey: "Pass",
  },
 
  {
    title: "Driver Settlement",
    description: "Calculate and settle driver advances, expenses, and final trip balance.",
    component: "",
    icon: <HandCoins size={22} />,
    permissionKey: "accountLedger",
  },
];

const TransportationDashboard = () => {
  return (
    <TransactionDashboard
      title="Transportation"
      description="Manage transport orders, trips, expenses, vehicle maintenance, contracts, and driver settlements."
      icon={<Truck size={24} />}
      cards={cards}
    />
  );
};

export default TransportationDashboard;