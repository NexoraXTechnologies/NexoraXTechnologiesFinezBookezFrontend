import { Route, Routes } from 'react-router-dom';
import './App.css';
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { TourProvider } from "./tour/TourContext";
import ProfessionalDashboardLayout from "./layouts/ProfessionalDashboardLayout";
import ProfessionalDashboard from "./pages/professional/ProfessionalDashboard";
import ProfessionalProfile from "./pages/professional/ProfessionalProfile";
import DocumentMangement from "./pages/professional/DocumentMangement";
import TaskManagement from "./pages/professional/TaskManagement";
import ProfessionlIncomeTaxLaw from './pages/professional/IncomeTaxLaw/IncomeTaxLaw'
import ProtectedUsersRoute from "./pages/professional/ProtectedUsersRoute";
import Users from "./pages/professional/Users";
import CompanyMaster from "./pages/professional/CompanyMaster";
import AccountMaster from "./pages/bookez/master/AccountMaster";
import ProductMaster from "./pages/bookez/master/productMaster/ProductMaster";
import Configuration from './pages/professional/Configuration/Configuration';

//income tax
import Form26AS from "./pages/professional/incomeTax/Form26AS"
import AIS from "./pages/professional/incomeTax/AIS"
import TIS from "./pages/professional/incomeTax/TIS"
import AddTaxPayer from "./pages/professional/incomeTax/AddTaxPayer/AddTaxPayer"
import FileITR from "./pages/professional/incomeTax/FileITR/FileITR"
import UploadForm16 from "./pages/professional/incomeTax/UploadForm16"
import DownloadITR from "./pages/professional/incomeTax/DownloadITR"
import Refund from './pages/professional/incomeTax/Refund';
import ResetitrPassword from './pages/professional/incomeTax/ResetPassword';

//employeeDropdown
import FileITRList from "./pages/professional/incomeTax/FileITR/FileITRList";
import AiTaxCopilot from "./pages/professional/AiChat/AiTaxCopilot";
import AutomationDashboard from './pages/professional/Automation/AutomationDashboard';

import ProfessionalRegister from "./pages/ProfessionalRegister";
import Subscription from './pages/subscription';
import UnitMaster from './pages/bookez/master/UnitMaster';
import ReportMapping from './pages/bookez/master/ReportMapping';
import MasterDashboard from './pages/bookez/master';
import OpeningBalancesDashboard from './pages/bookez/transactions/openingBalances&stocks';
import ProductionDashboard from './pages/bookez/transactions/production';
import SaleWorkflowDashboard from './pages/bookez/transactions/saleWorkflow';
import PurchaseWorkflowDashboard from './pages/bookez/transactions/purchaseWorkflow';


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReportsDashboard from './pages/bookez/reports';
import RegistersDashboard from './pages/bookez/registers';
import PermissionManagement from './pages/setting/PermissionManagement';
import { useAppearance } from './hooks/useAppearance';
import Appearance from './pages/setting/Appearance';
import POS from './pages/bookez/pos';
import POSPaymentPage from './pages/bookez/pos/POSPaymentPage';
import EngineeringModuleDashboard from './pages/bookez/engineeringModule';
import TransportationDashboard from './pages/bookez/transportation';
import TransportContractList from './pages/bookez/transportation/transportContract/TransportContractList';
import CreateEditTransportContract from './pages/bookez/transportation/transportContract/CreateEditTransportContract';
import TransportOrderList from './pages/bookez/transportation/transportOrder/TransportOrderList';
import CreateTransportOrder from './pages/bookez/transportation/transportOrder/CreateTransportOrder';
import TripAllocationList from './pages/bookez/transportation/tripAllocation/TripAllocationList';
import CreateTripAllocation from './pages/bookez/transportation/tripAllocation/CreateTripAllocation';
import SystemConfiguration from './pages/setting/systemConfiguration';
import MasterConfiguration from './pages/setting/masterConfiguration/MasterConfiguration';
import UserExplorer from './pages/setting/userExplorer';
import TripExpenseList from './pages/bookez/transportation/tripExpense/TripExpenseList';
import CreateEditTripExpence from './pages/bookez/transportation/tripExpense/CreateEditTripExpence';
import TripLREntryList from './pages/bookez/transportation/tripLREntry/TripLREntryList';
import CreateEditTripLREntry from './pages/bookez/transportation/tripLREntry/CreateEditTripLREntry';
import VehicleMaintenanceList from './pages/bookez/transportation/vehicleMaintenance/VehicleMaintenanceList';
import CreateEditVehicleMaintenance from './pages/bookez/transportation/vehicleMaintenance/CreateEditVehicleMaintenance';
import VehicleStatus from './pages/bookez/transportation/vehicleStatus';
import WhereIsMyDriver from './pages/bookez/transportation/whereIsDriver';
import LiveTripTracking from './pages/bookez/transportation/whereIsDriver/liveTrackMap';
import CreateEditDriverSettlement from './pages/bookez/transportation/driverSettlement/CreateEditDriverSettlement';
import DriverSettlementList from './pages/bookez/transportation/driverSettlement/DriverSettlementList';
import PosPosting from './pages/setting/systemConfiguration/posPosting';

import TripAllocationRegister from './pages/bookez/registers/tripAllocationRegister';
import TripExpenseRegister from './pages/bookez/registers/TripExpenseRegister';
import CreateEditTripExpense from './pages/bookez/registers/TripExpenseRegister/CreateEditTripExpense';
import TransactionConfiguration from './pages/setting/transactionConfiguration';
import DocumentSeries from './pages/setting/documentSeries';
import CustomTransactionDashboard from './pages/bookez/transactions/customTransactions';
import CustomTransaction from './pages/bookez/transactions/customTransactions/CustomTransaction';
import EWayBillList from './pages/bookez/transportation/eWayBill/EwayBillList';
import CreateEditEWayBill from './pages/bookez/transportation/eWayBill/Createeditewaybill';
import BarCodeAndQrCode from './pages/bookez/barcodeAndQRcode';
import ConsolidatedVehicleView from './pages/bookez/transportation/whereIsDriver/ConsolidatedVehicleView';
import TouchUPList from './pages/bookez/transportation/touchUP/TouchUPList';
import CreateEditTouchUP from './pages/bookez/transportation/touchUP/CreateEditTouchUP';
import IndentList from './pages/bookez/transportation/indent/IndentList';
import CreateEditIndent from './pages/bookez/transportation/indent/CreateEditIndent';
import AccountStatement from './pages/bookez/accountStatment';

function App() {
  useAppearance();
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar
        closeButton={false}
        pauseOnHover
        draggable={false}
        theme="colored"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/professionalRegister" element={<ProfessionalRegister />} />
        {/* professional route */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['Professional']}>
              <TourProvider>
                <ProfessionalDashboardLayout />
              </TourProvider>
            </ProtectedRoute>
          }>
          <Route index element={<ProfessionalDashboard />} />
          <Route path="profile" element={<ProfessionalProfile />} />
          <Route path="permission" element={<PermissionManagement />} />
          <Route path="appearance" element={<Appearance />} />
          <Route path="documentmngt" element={<DocumentMangement />} />
          <Route path="taskmngt" element={<TaskManagement />} />
          <Route path="incometx" element={<ProfessionlIncomeTaxLaw />} />
          <Route
            path="users"
            element={
              <ProtectedUsersRoute>
                {' '}
                <Users />{' '}
              </ProtectedUsersRoute>
            }
          />

          <Route path="/bookEz/master" element={<MasterDashboard />} />
          <Route path="/bookEz/qr-and-barcode-generator" element={<BarCodeAndQrCode />} />
          <Route path="master/company" element={<CompanyMaster />} />
          <Route path="master/account" element={<AccountMaster />} />
          <Route path="master/product" element={<ProductMaster />} />
          <Route path="master/unit" element={<UnitMaster />} />
          <Route path="master/reports-mapping" element={<ReportMapping />} />

          <Route path="/bookEz/transaction/opening-balances" element={<OpeningBalancesDashboard />} />

          <Route
            path="/bookEz/transaction/production"
            element={<ProductionDashboard />}
          />

          <Route
            path="/bookEz/transaction/sale-workflow"
            element={<SaleWorkflowDashboard />}
          />

          <Route
            path="/bookEz/transaction/purchase-workflow"
            element={<PurchaseWorkflowDashboard />}
          />
          <Route
            path="/bookEz/transaction/custom"
            element={<CustomTransactionDashboard />}
          />
          <Route
            path="/bookEz/transaction/custom-list/:moduleCode"
            element={<CustomTransaction />}
          />

          <Route
            path="/bookEz/reports"
            element={<ReportsDashboard />}
          />
          <Route
            path="/bookEz/registers"
            element={<RegistersDashboard />}
          />
          <Route path="/bookEz/pos" element={<POS />} />
          <Route path="/bookEz/accounts-statement" element={<AccountStatement />} />

          <Route
            path="/bookEz/pos/payment"
            element={<POSPaymentPage />}
          />
          <Route
            path="/bookEz/engineering-module"
            element={<EngineeringModuleDashboard />}
          />


          {/* transportation */}
          <Route
            path="/bookEz/transportation"
            element={<TransportationDashboard />}
          />
          <Route path="/bookEz/transportation/transport-contract" element={<TransportContractList />} />
          <Route path="/bookEz/transportation/transport-contract/create" element={<CreateEditTransportContract />} />
          <Route path="/bookEz/transportation/transport-contract/edit/:contractNumber" element={<CreateEditTransportContract />} />

          <Route path='/bookEz/transportation/indent' element={<IndentList />} />
          <Route path='/bookEz/transportation/indent/create' element={<CreateEditIndent />} />
          <Route path='/bookEz/transportation/indent/edit/:indentNumber' element={<CreateEditIndent />} />

          <Route path="/bookEz/transportation/transport-order" element={<TransportOrderList />} />
          <Route path="/bookEz/transportation/transport-order/create" element={<CreateTransportOrder />} />
          <Route path="/bookEz/transportation/transport-order/edit/:orderNumber" element={<CreateTransportOrder />} />
          <Route path="/bookEz/transportation/transport-order/view/:orderNumber" element={<CreateTransportOrder />} />

          <Route path='/bookEz/transportation/touch-up' element={<TouchUPList />} />
          <Route path='/bookEz/transportation/touch-up/create' element={<CreateEditTouchUP />} />
          <Route path='/bookEz/transportation/touch-up/edit/:voucherNumber' element={<CreateEditTouchUP />} />
          <Route path='/bookEz/transportation/touch-up/view/:voucherNumber' element={<CreateEditTouchUP />} />

          <Route path='/bookEz/transportation/trip-allocation' element={<TripAllocationList />} />
          <Route path="/bookEz/transportation/trip-allocation/create" element={<CreateTripAllocation />} />
          <Route path="/bookEz/transportation/trip-allocation/edit/:voucherNumber" element={<CreateTripAllocation />} />

          <Route path='/bookEz/transportation/trip-execution' element={<TripExpenseList />} />
          <Route path='/bookEz/transportation/trip-execution/create' element={<CreateEditTripExpence />} />
          <Route path='/bookEz/transportation/trip-execution/edit/:voucherNumber' element={<CreateEditTripExpence />} />

          <Route path='/bookEz/transportation/trip-lr-entry' element={<TripLREntryList />} />
          <Route path='/bookEz/transportation/trip-lr-entry/create' element={<CreateEditTripLREntry />} />
          <Route path='/bookEz/transportation/trip-lr-entry/edit/:voucherNumber' element={<CreateEditTripLREntry />} />
          <Route path='/bookEz/transportation/trip-lr-entry/view/:voucherNumber' element={<CreateEditTripLREntry />} />


          <Route path='/bookEz/transportation/e-way-bill' element={<EWayBillList />} />
          <Route path='bookEz/transportation/e-way-bill/view/:ewayBillNo' element={<CreateEditEWayBill />} />
          <Route path="/bookEz/transportation/e-way-bill/edit/:ewayBillNo" element={<CreateEditEWayBill />} />


          <Route path="/bookEz/transportation/vehicle-maintenance" element={<VehicleMaintenanceList />} />
          <Route path="/bookEz/transportation/vehicle-maintenance/create" element={<CreateEditVehicleMaintenance />} />
          <Route path="/bookEz/transportation/vehicle-maintenance/edit/:voucherNumber" element={<CreateEditVehicleMaintenance />} />

          <Route path="/bookEz/transportation/driver-settlement" element={<DriverSettlementList />} />
          <Route path="/bookEz/transportation/driver-settlement/create" element={<CreateEditDriverSettlement />} />
          <Route path="/bookEz/transportation/driver-settlement/edit/:voucherNumber" element={<CreateEditDriverSettlement />} />

          <Route path="/bookEz/transportation/vehicle-status" element={<VehicleStatus />} />
          <Route path="/bookEz/transportation/where-is-vehicle" element={<WhereIsMyDriver />} />
          <Route path="/bookEz/transportation/consolidated-vehicle-view" element={<ConsolidatedVehicleView />} />
          <Route path="/bookEz/transportation/live-trip-tracking" element={<LiveTripTracking />} />

          {/* configuration */}
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/system-configuration" element={<SystemConfiguration />} />
          <Route path="/master-configuration" element={<MasterConfiguration />} />
          <Route path="/transaction-configuration" element={<TransactionConfiguration />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="system-configuration" element={<SystemConfiguration />} />
          <Route path="master-configuration" element={<MasterConfiguration />} />
          <Route path="document-series" element={<DocumentSeries />} />
          <Route path="/bookEz/pos-posting" element={<PosPosting />} />
          <Route path="user-explorer" element={<UserExplorer />} />
          {/* incometax */}
          <Route path="incometax/form26as" element={<Form26AS />} />
          <Route path="incometax/ais" element={<AIS />} />
          <Route path="incometax/tis" element={<TIS />} />
          <Route path="incometax/addtaxpayer" element={<AddTaxPayer />} />
          <Route path="incometax/fileitr" element={<FileITR />} />
          <Route path="incometax/fileitr/edit/:pan/:ay" element={<FileITR />} />
          <Route path="incometax/fileitrlist" element={<FileITRList />} />
          <Route path="incometax/uploadform16" element={<UploadForm16 />} />
          <Route path="incometax/downloaditr" element={<DownloadITR />} />
          <Route path="incometax/refund" element={<Refund />} />
          <Route path="incometax/resetitrpassword" element={<ResetitrPassword />} />
          {/* configuration */}
          <Route path="configuration" element={<Configuration />} />

          <Route
            path="/bookez/transportation/transport-order/create"
            element={<CreateTransportOrder />}
          />

          <Route
            path="/bookez/transportation/transport-order/edit/:voucherNumber"
            element={<CreateTransportOrder />}
          />

          <Route
            path="/bookez/transportation/transport-order/view/:voucherNumber"
            element={<CreateTransportOrder />}
          />

          <Route
            path="/bookez/registers/trip-allocation-register"
            element={<TripAllocationRegister />}
          />

          <Route
            path="/bookez/transportation/trip-allocation-reg/create"
            element={<CreateTripAllocation />}
          />

          <Route
            path="/bookez/transportation/trip-allocation-reg/edit/:voucherNumber"
            element={<CreateTripAllocation />}
          />

          <Route
            path="/bookez/transportation/trip-allocation-reg/view/:voucherNumber"
            element={<CreateTripAllocation />}
          />

          <Route
            path="/bookez/registers/trip-expense-register"
            element={<TripExpenseRegister />}
          />

          <Route
            path="/bookez/registers/trip-expense-register"
            element={<TripExpenseRegister />}
          />

          <Route
            path="/bookez/transportation/trip-expense/create"
            element={<CreateEditTripExpense />}
          />

          <Route
            path="/bookez/transportation/trip-expense/edit/:voucherNumber"
            element={<CreateEditTripExpense />}
          />

          <Route
            path="/bookez/transportation/trip-expense/view/:voucherNumber"
            element={<CreateEditTripExpense />}
          />

          {/* incometax */}
          <Route path="incometax/form26as" element={<Form26AS />} />
          <Route path="incometax/ais" element={<AIS />} />
          <Route path="incometax/tis" element={<TIS />} />
          <Route path="incometax/addtaxpayer" element={<AddTaxPayer />} />
          <Route path="incometax/fileitr" element={<FileITR />} />
          <Route path="incometax/fileitr/edit/:pan/:ay" element={<FileITR />} />
          <Route path="incometax/fileitrlist" element={<FileITRList />} />
          <Route path="incometax/uploadform16" element={<UploadForm16 />} />
          <Route path="incometax/downloaditr" element={<DownloadITR />} />
          <Route path="incometax/refund" element={<Refund />} />
          <Route path="incometax/resetitrpassword" element={<ResetitrPassword />} />

          {/* Subscribe  */}
          <Route path="subscription" element={<Subscription />} />

          {/* ai */}
          <Route path="ai-tax-copilot" element={<AiTaxCopilot />} />
          <Route path="automation" element={<AutomationDashboard />} />
        </Route>
      </Routes>
    </>
  )
}

export default App;