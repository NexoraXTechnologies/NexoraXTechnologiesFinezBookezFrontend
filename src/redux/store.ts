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

// ledger report
import accountReceivableReducer from "./slices/professionalSlice/ledgerReports/accountsReceivableSlice"
import accountLedgerReducer from "./slices/professionalSlice/ledgerReports/accountLedgerSlice";
import stockLedgerReducer from "./slices/professionalSlice/ledgerReports/stockLedgerSlice";


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

    // ledger report 
    accountReceivable: accountReceivableReducer,
    accountLedger: accountLedgerReducer,
    stockLedger: stockLedgerReducer,

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
  },
});

export default store;
