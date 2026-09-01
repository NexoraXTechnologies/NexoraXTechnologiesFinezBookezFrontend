import {
  Truck,
  Route,
  Fuel,
  FileText,
  Wrench,
  FileSignature,
  HandCoins,
  PackagePlus,
  MapPinned,
  ReceiptText,
  MapPinPlus,
  ClipboardList,
} from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";


const cards: any[] = [
  {
    title: "Create Contract",
    description: "Create transport contracts with customers, vendors, or fleet partners.",
    path: "/bookEz/transportation/transport-contract",
    icon: <FileSignature size={22} />,
    permissionKey: "transportContract",
  },
  {
    title: "Create Indent",
    description: "Create and manage transport indents for vehicle placement and goods movement.",
    path: "/bookEz/transportation/indent",
    icon: <ClipboardList size={22} />,
    permissionKey: "createIndent",
  },
  {
    title: "Create Transport Order",
    description: "Create and manage transport orders for customer goods movement.",
    path: "/bookEz/transportation/transport-order",
    icon: <PackagePlus size={22} />,
    permissionKey: "transportOrder",
  },
  {
    title: "Trip Allocation",
    description: "Assign vehicles, drivers, and routes to planned transport trips.",
    path: "/bookEz/transportation/trip-allocation",
    icon: <Route size={22} />,
    permissionKey: "tripAllocation",
  },
  {
    title: "Touch Up",
    description: "Create and manage touch-up points for transport orders.",
    path: "/bookEz/transportation/touch-up",
    icon: <MapPinPlus size={22} />,
    permissionKey: "touchUp",
  },
  {
    title: "Trip Expense",
    description: "Record fuel, toll, loading, unloading, and other trip-related expenses.",
    path: "/bookEz/transportation/trip-expense",
    icon: <Fuel size={22} />,
    permissionKey: "tripExpense",
  },
  {
    title: "Trip L/R Entry",
    description: "Create and track lorry receipt entries for transport shipments.",
    path: "/bookEz/transportation/trip-lr-entry",
    icon: <FileText size={22} />,
    permissionKey: "tripLrCollection",
  },
  {
    title: "E-Way Bill",
    description: "Create, update, and monitor e-way bills for seamless goods transportation.",
    path: "/bookEz/transportation/e-way-bill",
    icon: <ReceiptText size={22} />,
    permissionKey: "eWayBill",
  },
  {
    title: "Vehicle Maintenance",
    description: "Manage vehicle service, repair history, and maintenance expenses.",
    path: "/bookEz/transportation/vehicle-maintenance",
    icon: <Wrench size={22} />,
    permissionKey: "vehicleMaintenance",
  },

  {
    title: "Driver Settlement",
    description: "Calculate and settle driver advances, expenses, and final trip balance.",
    path: "/bookEz/transportation/driver-settlement",
    icon: <HandCoins size={22} />,
    permissionKey: "driverSettlement",
  },
  {
    title: "Vehicle Status",
    description: "Track vehicle availability, current status, assignment state, and movement updates.",
    path: "/bookEz/transportation/vehicle-status",
    icon: <Truck size={22} />,
    permissionKey: "vehicleStatus",
  },
  {
    title: "Where Is My Vehicle?",
    description: "View vehicle location, trip progress, assigned vehicle, and route tracking in real time.",
    path: "/bookEz/transportation/where-is-vehicle",
    icon: <MapPinned size={22} />,
    permissionKey: "tripTracking",
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