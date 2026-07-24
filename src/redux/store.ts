import { configureStore } from "@reduxjs/toolkit";

//professional
import professionalAuthReducer from "./slices/professionalSlice/professionalAuthSlice";
import professionalProfileReducer from "./slices/professionalSlice/professionalProfileSlice";
import professionalUserReducer from "./slices/professionalSlice/professionalUserSlice";
import professionalDocumentMgtReducer from "./slices/professionalSlice/professionalDocumentMgtSlice";
import professionalTaskMgtReducer from "./slices/professionalSlice/professionalTaskManagementSlice";
import professionalCompanyMasterReducer from "./slices/professionalSlice/professionalCompanyMaster.slice";
import accountMasterReducer from "./slices/professionalSlice/accountMasterSlice";
import productMasterReducer from "./slices/professionalSlice/productMasterSlice";
import UnitMasterReducer from "./slices/professionalSlice/unitMasterSlice";
import reportMappingReducer from "./slices/professionalSlice/reportMappingSlice";
import assemblyProductionReducer from "./slices/professionalSlice/production/assemblyProductionSlice";
import issuesToProductionReducer from "./slices/professionalSlice/production/issuesToProductionSlice";
import receiptFromProductionReducer from "./slices/professionalSlice/production/receiptFromProductionSlice";
import salesQuationsReducer from "./slices/professionalSlice/salesWorkflow/salesQuationsSlice";
import salesOrderReducer from "./slices/professionalSlice/salesWorkflow/salesOrderSlice";
import salesInvoiceReducer from "./slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import salesInvoiceReturnReducer from "./slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import aiTaxCopilotReducer from "./slices/professionalSlice/ai/aiTaxCopilotSlice";
import alldropdownReducer from "./slices/professionalSlice/allDropDowns/alldropdownSlice";

//employeeReducer
import authReducer from "./slices/authSlice";
import verifyPanReducer from "./slices/professionalSlice/panVerify/panVerify";

//profeesional dashaboard
import professionalDashboardReducer from "./slices/professionalSlice/dashboard/professionalDashboardSlice";
import professionalIncomeTaxLawReducer from "./slices/professionalSlice/professionIntxLaw/professionalIncomeTaxLawSlice";

import downloadItrWithEmailExtractorReducer from "./slices/professionalSlice/downloaditrviagmail/downloadItrWithEmailExtractorSlice";

// income tax
import taxpayerReducer from "./slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import itrFilingWebMgtReducer from "./slices/professionalSlice/fileITRweb/itrFilingWebMgtSlice";
import aisReducer from "./slices/professionalSlice/incomeTaxSlice/aisSlice";
import tisReducer from "./slices/professionalSlice/incomeTaxSlice/tisSlice";
import form16Reducer from "./slices/professionalSlice/incomeTaxSlice/form16Slice";
import automationReducer from "./slices/professionalSlice/automation/automatioinSlice";
import stateCityReducer from "./slices/professionalSlice/stateCitySlice"
import plansReduce from "./slices/professionalSlice/subscriptions";
import customMasterModuleReducer from "./slices/professionalSlice/customMasterModuleSlice";
import openingBalanceSlice from "./slices/professionalSlice/openingBalancesStocks/openingBalance";
import openingStockSlice from "./slices/professionalSlice/openingBalancesStocks/openingStockSlice";
import journalVoucherReducer from "./slices/professionalSlice/openingBalancesStocks/journalVoucherSlice";
import contraVoucherReducer from "./slices/professionalSlice/openingBalancesStocks/contraVoucherSlice";
import creditNoteReducer from "./slices/professionalSlice/openingBalancesStocks/creditNoteSlice";
import debitNoteReducer from "./slices/professionalSlice/openingBalancesStocks/debitNoteSlice";
import purchaseOrderSlice from "./slices/professionalSlice/purchaseWorkflow/purchaseOrder";
import paymentReducer from "./slices/professionalSlice/purchaseWorkflow/paymentSlice"
import grnReducer from "./slices/professionalSlice//purchaseWorkflow/grnSlice";
import purchaseReturnReducer from "./slices/professionalSlice/purchaseWorkflow/purchaseReturnSlice";
import purchaseInvoiceReducer from "./slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import getAllTransactionSchema from "./slices/professionalSlice/transactionSchema";
import transactionsSchemaReducer from "./slices/professionalSlice/transactionSchema/index";
import customTransactionDataReducer from "./slices/professionalSlice/customTransaction/customTransactionSlice";
// ledger report
import accountReceivableReducer from "./slices/professionalSlice/ledgerReports/accountsReceivableSlice"
import accountPayableReducer from "./slices/professionalSlice/ledgerReports/accountsPayableSlice"
import accountLedgerReducer from "./slices/professionalSlice/ledgerReports/accountLedgerSlice";
import stockLedgerReducer from "./slices/professionalSlice/ledgerReports/stockLedgerSlice";

// transportation
import transportOrderReducer from "./slices/professionalSlice/transportation/transportOrderSlice";
import tripAllocationReducer from "./slices/professionalSlice/transportation/tripAllocationSlice";
import tripExpensesReducer from "./slices/professionalSlice/transportation/tripExpensesSlice";
import tripLRCollectionReducer from "./slices/professionalSlice/transportation/tripLRCollectionSlice";
import vehicleMaintenanceReducer from "./slices/professionalSlice/transportation/vehicleMaintenanceEntrySlice";
import transportContractReducer from "./slices/professionalSlice/transportation/transportContractSlice";
import vehicleStatusReducer from "./slices/professionalSlice/transportation/vehicleStatusSlice"
import whereIsMyDriverReducer from "./slices/professionalSlice/transportation/whereIsMyDriverSlice"
import driverSettlementReducer from "./slices/professionalSlice/transportation/driverSettlementSlice";
import transportRouteReducer from "./slices/professionalSlice/transportation/transportRoutes";

// transport register
import transportOrderRegisterReducer from "./slices/professionalSlice/bookEzRegister/transportOrderRegister";
import tripAllocationRegisterReducer from "./slices/professionalSlice/bookEzRegister/tripAllocationRegister";
import tripExpenseRegisterReducer from "./slices/professionalSlice/bookEzRegister/tripExpenseRegister";
import podRegisterReducer from "./slices/professionalSlice/bookEzRegister/podRegister"
import driverSettlementRegisterReducer from "./slices/professionalSlice/bookEzRegister/driverSettlementRegister";
import vehicleMaintenanceRegisterReducer from "./slices/professionalSlice/bookEzRegister/vehicleMaintenanceRegister";
import whatsAppReducer from "./slices/professionalSlice/transportation/whatsappSlice";

// bookEz register
import salesRegisterReducer from "./slices/professionalSlice/bookEzRegister/salesRegisterSlice";
import salesReceiptReducer from "./slices/professionalSlice/salesWorkflow/salesReceipt";
import purchaseRegisterReducer from "./slices/professionalSlice/bookEzRegister/purchaseRegisterSlice";
import receiptRegisterReducer from "./slices/professionalSlice/bookEzRegister/receiptRegisterSlice";
import paymentRegisterReducer from "./slices/professionalSlice/bookEzRegister/paymentRegisterSlice";
import HSNCodeReducer from "./slices/professionalSlice/hsnCode"
import seederConfgReducer from "./slices/professionalSlice/seeder"
import permissionReducer from "./slices/permissionSlice";
import postingReduce from "./slices/professionalSlice/posting";
import posReducer from "./slices/professionalSlice/pos";
import dbAccessReducer from "./slices/userExplorer";
import allRegistersReducer from "../redux/slices/professionalSlice/register";
import areaDashboardReducer from "../redux/slices/professionalSlice/dashboard/registerDashboard"
import systemConfigurationReducer from "../redux/slices/systemConf";
import importBankStatementReducer from "../redux/slices/professionalSlice/openingBalancesStocks/bankImpStatement"


// masterConfiguration
import masterConfigurationReducer from "../redux/slices/professionalSlice/masterConfigurationSlice/masterConfigurationSlice"
// ⭐ NEW: Master Schema
import masterSchemaReducer from "../redux/slices/professionalSlice/masterConfigurationSlice/masterSchemaSlice";
// ⭐ NEW: Standard master schema reducers
import accountMasterSchema from "../redux/slices/professionalSlice/masterConfigurationSlice/accountmasterSchemaSlice"
import productMasterSchemaReducer from "../redux/slices/professionalSlice/masterConfigurationSlice/productMasterSchemaSlice";
import unitMeasurementSchemaReducer from "../redux/slices/professionalSlice/masterConfigurationSlice/unitMeasurementSchemaSlice";
import transactionModuleReducer from "./slices/professionalSlice/transactionConfiguration/transactionModuleSlice"
import voucherConfigurationReducer from "../redux/slices/professionalSlice/documentSeries"
import registerFilterDropdownReducer from "../redux/slices/professionalSlice/registerModule"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    //professional
    professionalAuth: professionalAuthReducer,
    professionalProfile: professionalProfileReducer,
    professionalUser: professionalUserReducer,
    professionalDocumentMgt: professionalDocumentMgtReducer,
    professionalTaskMgt: professionalTaskMgtReducer,
    professionalCompanyMaster: professionalCompanyMasterReducer,
    accountMaster: accountMasterReducer,
    customMasterModule: customMasterModuleReducer,

    productMaster: productMasterReducer,
    unitMaster: UnitMasterReducer,
    assemblyProduction: assemblyProductionReducer,
    issuesToProduction: issuesToProductionReducer,
    receiptFromProduction: receiptFromProductionReducer,
    salesQuotation: salesQuationsReducer,
    salesOrder: salesOrderReducer,
    salesInvoice: salesInvoiceReducer,
    salesInvoiceReturn: salesInvoiceReturnReducer,
    reportMapping: reportMappingReducer,
    alldropdown: alldropdownReducer,
    taxpayer: taxpayerReducer,
    ais: aisReducer,
    tis: tisReducer,
    //profeesiional dashboard
    professionalDashboard: professionalDashboardReducer,
    //professional income tax
    professionalIncomeTaxLaw: professionalIncomeTaxLawReducer,
    form16: form16Reducer,
    // ITR
    itrFilingWebMgt: itrFilingWebMgtReducer,
    // ai
    aiTaxCopilot: aiTaxCopilotReducer,
    verifyPan: verifyPanReducer,
    downloadItrWithEmailExtractor: downloadItrWithEmailExtractorReducer,
    automation: automationReducer,
    stateCity: stateCityReducer,

    // Plans
    plans: plansReduce,
    openingBalance: openingBalanceSlice,
    openingStock: openingStockSlice,
    journalVoucher: journalVoucherReducer,
    contraVoucher: contraVoucherReducer,
    creditNote: creditNoteReducer,
    debitNote: debitNoteReducer,

    purchaseOrder: purchaseOrderSlice,
    grn: grnReducer,
    purchaseReturn: purchaseReturnReducer,
    purchaseInvoice: purchaseInvoiceReducer,
    payment: paymentReducer,
    getAllTransactionSchema,
    transactionsSchema: transactionsSchemaReducer,

    // ledger report 
    accountPayable: accountPayableReducer,
    accountReceivable: accountReceivableReducer,
    accountLedger: accountLedgerReducer,
    stockLedger: stockLedgerReducer,

    // transportation
    transportOrder: transportOrderReducer,
    tripAllocation: tripAllocationReducer,
    tripExpenses: tripExpensesReducer,
    tripLRCollection: tripLRCollectionReducer,
    vehicleMaintenance: vehicleMaintenanceReducer,
    vehicleStatus: vehicleStatusReducer,
    whereIsMyDriver: whereIsMyDriverReducer,
    transportContract: transportContractReducer,
    driverSettlement: driverSettlementReducer,
    transportRoute: transportRouteReducer,

    // transport register
    transportOrderRegister: transportOrderRegisterReducer,
    tripAllocationRegister: tripAllocationRegisterReducer,
    tripExpenseRegister: tripExpenseRegisterReducer,
    podRegister: podRegisterReducer,
    driverSettlementRegister: driverSettlementRegisterReducer,
    vehicleMaintenanceRegister: vehicleMaintenanceRegisterReducer,
    whatsApp: whatsAppReducer,

    // bookEz register
    salesRegister: salesRegisterReducer,
    salesreceipt: salesReceiptReducer,
    purchaseRegister: purchaseRegisterReducer,
    receiptRegister: receiptRegisterReducer,
    paymentRegister: paymentRegisterReducer,
    HSNCode: HSNCodeReducer,
    seederConfg: seederConfgReducer,
    permissions: permissionReducer,
    posting: postingReduce,
    pos: posReducer,
    dbAccess: dbAccessReducer,
    allRegisters: allRegistersReducer,
    registerDashboard: areaDashboardReducer,
    systemConfiguration: systemConfigurationReducer,
    importBankStatement: importBankStatementReducer,
    voucherConfiguration: voucherConfigurationReducer,
    registerFilterDropdown: registerFilterDropdownReducer,
    // master configuration

    masterConfiguration: masterConfigurationReducer,
    // ⭐ NEW: Master Schema reducer
    masterSchema: masterSchemaReducer,
    // ⭐ NEW: Standard master schema reducers
    accountMasterSchema: accountMasterSchema,
    productMasterSchema: productMasterSchemaReducer,
    unitMeasurementSchema: unitMeasurementSchemaReducer,
    transactionModule: transactionModuleReducer,
    customTransaction: customTransactionDataReducer,
  },
});

export default store;
