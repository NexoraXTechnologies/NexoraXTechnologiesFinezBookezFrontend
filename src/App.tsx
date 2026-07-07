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
import OpeningBalancesDashboard from './pages/bookez/transactions/openingBalances&stocks/indec';
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
import UserExplorer from './pages/setting/userExplorer';
import TripExpenseList from './pages/bookez/transportation/tripExpense/TripExpenseList';
import CreateEditTripExpence from './pages/bookez/transportation/tripExpense/CreateEditTripExpence';

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
            path="/bookEz/reports"
            element={<ReportsDashboard />}
          />
          <Route
            path="/bookEz/registers"
            element={<RegistersDashboard />}
          />
          <Route path="/bookEz/pos" element={<POS />} />

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


          <Route path="/bookEz/transportation/transport-order" element={<TransportOrderList />} />
          <Route path="/bookEz/transportation/transport-order/create" element={<CreateTransportOrder />} />
          <Route path="/bookEz/transportation/transport-order/edit/:orderNumber" element={<CreateTransportOrder />} />

          <Route path='/bookEz/transportation/trip-allocation' element={<TripAllocationList />} />
          <Route path="/bookEz/transportation/trip-allocation/create" element={<CreateTripAllocation />}/>
          <Route path="/bookEz/transportation/trip-allocation/edit/:voucherNumber" element={<CreateTripAllocation />}/>

          <Route path='/bookEz/transportation/trip-expense' element={<TripExpenseList />} />
          <Route path='/bookEz/transportation/trip-expense/create' element={<CreateEditTripExpence />} />
          <Route path='/bookEz/transportation/trip-expense/edit/:voucherNumber' element={<CreateEditTripExpence />} />

          {/* configuration */}
          <Route path="configuration" element={<Configuration />} />
          <Route path="system-configuration" element={<SystemConfiguration />} />
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