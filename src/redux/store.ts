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
    plans: plansReduce


  },
});

export default store;
