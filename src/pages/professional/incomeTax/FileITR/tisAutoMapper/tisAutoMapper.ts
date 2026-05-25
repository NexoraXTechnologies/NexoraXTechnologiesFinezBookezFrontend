const STANDARD_DEDUCTION = 75000;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const pickAmount = (obj) => {
  if (!obj || typeof obj !== 'object') return 0;

  return toNum(obj.acceptedByTaxpayer ?? obj.processedBySystem ?? obj.reportedBySource ?? 0);
};

const sumDetailRows = (rows = []) => {
  return rows.reduce((sum, row) => sum + pickAmount(row), 0);
};

const getSummaryAmount = (summary = [], category) => {
  const found = summary.find(
    (x) =>
      String(x?.category || '')
        .trim()
        .toLowerCase() ===
      String(category || '')
        .trim()
        .toLowerCase(),
  );

  return found ? pickAmount(found) : 0;
};

const getCategoryAmount = (tisData, category) => {
  const summary = tisData?.summary || [];
  const details = tisData?.details || {};

  const fromSummary = getSummaryAmount(summary, category);
  if (fromSummary > 0) return fromSummary;

  const rows = details?.[category] || [];
  return sumDetailRows(rows);
};

/* =========================================================
   INCOME FROM SALARY FROM TIS
   exact same shape as popup onSave(payload)
========================================================= */
export const buildIncomeFromSalaryFromTIS = ({ tisData, existingValue = {}, taxRegime = 'NEW' }) => {
  if (!tisData) return existingValue || {};

  const salaryAmount = getCategoryAmount(tisData, 'Salary');

  const existingSalary89A = existingValue?.salary89A?.fields || {};
  const existingExemptRows = Array.isArray(existingValue?.exemptAllowances?.rows) ? existingValue.exemptAllowances.rows : [];
  const existingDeductions = existingValue?.deductions?.fields || {};

  const otherSalary = Boolean(existingValue?.otherSalary);

  const salary = {
    s1: salaryAmount,
    s2: 0,
    s3: 0,
  };

  const salary89A = {
    usa: toNum(existingSalary89A.usa),
    uk: toNum(existingSalary89A.uk),
    canada: toNum(existingSalary89A.canada),
    other: toNum(existingSalary89A.other),
  };

  const totalSalary = toNum(salary.s1) + toNum(salary.s2) + toNum(salary.s3);

  const total89A = otherSalary ? toNum(salary89A.usa) + toNum(salary89A.uk) + toNum(salary89A.canada) + toNum(salary89A.other) : 0;

  const totalExempt = existingExemptRows.reduce((sum, row) => sum + toNum(row?.amount), 0);

  const entertainmentDeduction = taxRegime === 'OLD' ? toNum(existingDeductions.entertainment) : 0;

  const professionalTax = taxRegime === 'OLD' ? toNum(existingDeductions.professionalTax) : 0;

  const relief89A = toNum(existingDeductions.relief89A);

  const netSalary = Math.max(0, totalSalary + total89A - totalExempt - STANDARD_DEDUCTION - entertainmentDeduction - professionalTax - relief89A);

  return {
    otherSalary,

    salary: {
      fields: {
        s1: toNum(salary.s1),
        s2: toNum(salary.s2),
        s3: toNum(salary.s3),
      },
      totalSalary,
    },

    salary89A: {
      fields: {
        usa: toNum(salary89A.usa),
        uk: toNum(salary89A.uk),
        canada: toNum(salary89A.canada),
        other: toNum(salary89A.other),
      },
      total89A,
    },

    exemptAllowances: {
      rows: existingExemptRows
        .filter((r) => r?.allowance || r?.amount)
        .map((r) => ({
          allowance: r.allowance,
          amount: toNum(r.amount),
        })),
      totalExempt,
    },

    deductions: {
      standardDeduction: STANDARD_DEDUCTION,
      fields: {
        entertainment: taxRegime === 'OLD' ? entertainmentDeduction : 0,
        professionalTax: taxRegime === 'OLD' ? professionalTax : 0,
        relief89A,
      },
    },

    netSalary,
  };
};

/* =========================================================
   INCOME FROM OTHER SOURCES FROM TIS
   exact same shape as popup onSave(payload)
========================================================= */
export const buildIncomeOtherSourcesFromTIS = ({ tisData, assessmentYear, existingValue = {} }) => {
  if (!tisData) return existingValue || {};

  const savingInterest = getCategoryAmount(tisData, 'Interest from savings bank');
  const depositInterest = getCategoryAmount(tisData, 'Interest from deposit');
  const dividendIncome = getCategoryAmount(tisData, 'Dividend');

  const existingNature = existingValue?.nature || {};
  const existingDeductions = existingValue?.deductions || {};
  const existingNotified = existingValue?.notified || {};
  const existingQuarters89A = existingValue?.quarters89A || {};
  const existingOtherRows = Array.isArray(existingValue?.otherRows) ? existingValue.otherRows : [];

  const q1 = 0;
  const q2 = 0;
  const q3 = 0;
  const q4 = 0;
  const q5 = dividendIncome;

  const totalDividend = q1 + q2 + q3 + q4 + q5;

  const totalOtherIncome = existingOtherRows.reduce((sum, r) => sum + toNum(r?.amount), 0);

  const totalNotified = toNum(existingNotified.usa) + toNum(existingNotified.uk) + toNum(existingNotified.canada);

  const total89AQuarter = toNum(existingQuarters89A.q1) + toNum(existingQuarters89A.q2) + toNum(existingQuarters89A.q3) + toNum(existingQuarters89A.q4) + toNum(existingQuarters89A.q5);

  const deductionRelief89A = toNum(existingDeductions.relief89A);
  const deduction57 = toNum(existingDeductions.deduction57);

  const nature = {
    saving: savingInterest,
    deposit: depositInterest,
    refund: toNum(existingNature.refund),
  };

  const dividend = {
    q1,
    q2,
    q3,
    q4,
    q5,
    totalDividend,
  };

  const nonNotified89A = toNum(existingValue?.nonNotified89A);

  const grossOtherIncome = totalOtherIncome + totalDividend + toNum(nature.saving) + toNum(nature.deposit) + toNum(nature.refund) + nonNotified89A;

  const netOtherIncome = grossOtherIncome - deductionRelief89A - deduction57;

  return {
    assessmentYear: assessmentYear || existingValue?.assessmentYear || null,

    nature: {
      saving: toNum(nature.saving),
      deposit: toNum(nature.deposit),
      refund: toNum(nature.refund),
    },

    otherRows: existingOtherRows
      .filter((r) => r?.type || r?.amount)
      .map((r) => ({
        type: r.type,
        amount: toNum(r.amount),
      })),

    nonNotified89A,

    isNotified: Boolean(existingValue?.isNotified),

    notified: {
      usa: toNum(existingNotified.usa),
      uk: toNum(existingNotified.uk),
      canada: toNum(existingNotified.canada),
      totalNotified,
    },

    quarters89A: {
      q1: toNum(existingQuarters89A.q1),
      q2: toNum(existingQuarters89A.q2),
      q3: toNum(existingQuarters89A.q3),
      q4: toNum(existingQuarters89A.q4),
      q5: toNum(existingQuarters89A.q5),
      total89AQuarter,
    },

    dividend: {
      q1: toNum(dividend.q1),
      q2: toNum(dividend.q2),
      q3: toNum(dividend.q3),
      q4: toNum(dividend.q4),
      q5: toNum(dividend.q5),
      totalDividend,
    },

    deductions: {
      relief89A: deductionRelief89A,
      deduction57,
    },

    totals: {
      totalOtherIncome,
      grossOtherIncome,
    },

    netOtherIncome,
  };
};

/* =========================================================
   EXEMPTED INCOME FROM TIS
   exact same shape as popup onSave(payload)
========================================================= */
export const buildExemptedIncomeFromTIS = ({ tisData, existingValue = {} }) => {
  if (!tisData) return existingValue || {};

  const sale = getCategoryAmount(tisData, 'Sale of securities and units of mutual fund');

  const cost = getCategoryAmount(tisData, 'Purchase of securities and units of mutual funds');

  const existingRows = Array.isArray(existingValue?.rows) ? existingValue.rows : [];

  const totalExemptIncome = existingRows.reduce((sum, row) => sum + toNum(row?.amount), 0);

  const finalSale = sale > 0 ? toNum(sale) : toNum(existingValue?.ltcg112a?.sale);

  const finalCost = cost > 0 ? toNum(cost) : toNum(existingValue?.ltcg112a?.cost);

  const ltcg = finalSale - finalCost;

  return {
    rows: existingRows
      .filter((r) => r?.type || r?.amount)
      .map((r) => ({
        type: r.type,
        amount: toNum(r.amount),
      })),
    totalExemptIncome,
    ltcg112a: {
      sale: finalSale,
      cost: finalCost,
      ltcg,
    },
  };
};

export const buildUnderSec44FromTIS = ({ tisData, existingValue = {} }) => {
  if (!tisData) return existingValue || {};

  const businessReceipts = getCategoryAmount(tisData, 'Business receipts');
  const gstTurnover = getCategoryAmount(tisData, 'GST turnover');

  const maxDigitalTurnover = Math.max(toNum(businessReceipts), toNum(gstTurnover));

  const section = existingValue?.section || '44ADA';
  const sectionType = existingValue?.sectionType || '';
  const businessType = existingValue?.businessType || '';
  const presumptiveOpted = existingValue?.presumptiveOpted === true || existingValue?.presumptiveOpted === false ? existingValue.presumptiveOpted : true;

  const sectionOpted = section;

  const cashTurnover = toNum(existingValue?.cashTurnover);
  const digitalTurnover = maxDigitalTurnover > 0 ? maxDigitalTurnover : toNum(existingValue?.digitalTurnover);

  const totalTurnoverAuto = cashTurnover + digitalTurnover;

  const pan = existingValue?.pan || '';
  const businessName = existingValue?.businessName || '';

  const hasGst = typeof existingValue?.hasGst === 'boolean' ? existingValue.hasGst : true;

  const gstNo = hasGst ? existingValue?.gstNo || '' : null;

  const noOfVehicles = toNum(existingValue?.noOfVehicles);
  const monthsOwned = toNum(existingValue?.monthsOwned);
  const incomePerVehiclePerMonth = toNum(existingValue?.incomePerVehiclePerMonth) || 7500;

  const computedPresumptiveIncome44AE = noOfVehicles * monthsOwned * incomePerVehiclePerMonth;

  const incomeOnDigital6 = (digitalTurnover * 6) / 100;
  const incomeOnCash8 = (cashTurnover * 8) / 100;

  const presumptiveIncome44ADA = totalTurnoverAuto * 0.5;

  const presumptiveIncomeAuto = section === '44ADA' ? presumptiveIncome44ADA : section === '44AD' ? incomeOnDigital6 + incomeOnCash8 : section === '44AE' ? computedPresumptiveIncome44AE : 0;

  const higherIncomeYesNo = existingValue?.higherIncomeYesNo || '';
  const declaredPresumptiveIncome = toNum(existingValue?.declaredPresumptiveIncome);

  const finalPresumptiveIncome = higherIncomeYesNo === 'yes' ? declaredPresumptiveIncome : presumptiveIncomeAuto;

  const financials = existingValue?.financials ?? null;

  return {
    section,
    sectionType,
    businessType,
    presumptiveOpted,
    sectionOpted,

    turnover: totalTurnoverAuto,
    cashTurnover,
    digitalTurnover,
    totalTurnoverAuto,
    pan,
    businessName,
    hasGst,
    gstNo,

    noOfVehicles,
    monthsOwned,
    incomePerVehiclePerMonth,
    computedPresumptiveIncome44AE,

    incomeOnDigital6,
    incomeOnCash8,

    presumptiveIncome44ADA,

    higherIncomeYesNo,
    declaredPresumptiveIncome,

    finalPresumptiveIncome,

    financials,
  };
};

/* =========================================================
   BUILD ALL SECTIONS FROM TIS
========================================================= */
export const buildSectionsFromTIS = ({ tisData, assessmentYear, existingSections = {}, taxRegime = 'NEW' }) => {
  const incomeFromSalary = buildIncomeFromSalaryFromTIS({
    tisData,
    existingValue: existingSections?.incomeFromSalary,
    taxRegime,
  });

  const incomeOtherSources = buildIncomeOtherSourcesFromTIS({
    tisData,
    assessmentYear,
    existingValue: existingSections?.incomeOtherSources,
  });

  const exemptedIncome = buildExemptedIncomeFromTIS({
    tisData,
    existingValue: existingSections?.exemptedIncome,
  });

  const underSec44 = buildUnderSec44FromTIS({
    tisData,
    existingValue: existingSections?.underSec44,
  });

  return {
    ...existingSections,
    incomeFromSalary,
    incomeOtherSources,
    exemptedIncome,
    underSec44,
  };
};