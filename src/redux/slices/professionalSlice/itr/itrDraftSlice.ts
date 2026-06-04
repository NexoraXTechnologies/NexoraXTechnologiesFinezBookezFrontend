import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  meta: {
    pan: null,
    assessmentYearId: null,
    assessmentYear: null,
    regime: null,
    itrForm: null,
    natureOfEmployment: null,
  },
  sections: {
    incomeFromSalary: null,
    houseProperty: null,
    underSec44: null,
    incomeOtherSources: null,
    totalDeductions: null,
    exemptedIncome: null,
    taxesPaid: null,
    computations: null,
    taxLiability: null,
  },
};

const itrDraftSlice = createSlice({
  name: "itrDraft",
  initialState,
  reducers: {
    setMeta(state: any, action: any) {
      Object.assign(state.meta, action.payload);
    },
    setSection(state: any, action: any) {
      const { key, data } = action.payload;
      state.sections[key] = data;
    },
    resetDraft() {
      return initialState;
    },
  },
});

export const { setMeta, setSection, resetDraft } = itrDraftSlice.actions;
export default itrDraftSlice.reducer;