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
import ProductMaster from "./pages/bookez/master/ProductMaster";
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
import BookEZDashboard from './pages/bookez/master';
import MasterDashboard from './pages/bookez/master';
import OpeningBalancesDashboard from './pages/bookez/transactions/openingBalances&stocks/OpeningBalancesDashboard';
import ProductionDashboard from './pages/bookez/transactions/production/ProductionDashboard';
import SaleWorkflowDashboard from './pages/bookez/transactions/saleWorkflow/SaleWorkflowDashboard';
import PurchaseWorkflowDashboard from './pages/bookez/transactions/purchaseWorkflow/PurchaseWorkflowDashboard';


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {

  return (
    <>
      <ToastContainer />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/professionalRegister" element={<ProfessionalRegister />} />
      {/* professional route */}
      <Route
        path="/professional"
        element={
          <ProtectedRoute allowedRoles={['Professional']}>
            <TourProvider>
              <ProfessionalDashboardLayout />
            </TourProvider>
          </ProtectedRoute>
        }>
        <Route index element={<ProfessionalDashboard />} />
        <Route path="profile" element={<ProfessionalProfile />} />
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

        <Route path="/professional/master" element={<MasterDashboard />} />
        <Route path="master/company" element={<CompanyMaster />} />
        <Route path="master/account" element={<AccountMaster />} />
        <Route path="master/product" element={<ProductMaster />} />
        <Route path="master/unit" element={<UnitMaster />} />
        <Route path="master/reports-mapping" element={<ReportMapping />} />


        <Route
          path="/professional/transaction/opening-balances"
          element={<OpeningBalancesDashboard />}
        />

        <Route
          path="/professional/transaction/production"
          element={<ProductionDashboard />}
        />

        <Route
          path="/professional/transaction/sale-workflow"
          element={<SaleWorkflowDashboard />}
        />

        <Route
          path="/professional/transaction/purchase-workflow"
          element={<PurchaseWorkflowDashboard />}
        />

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