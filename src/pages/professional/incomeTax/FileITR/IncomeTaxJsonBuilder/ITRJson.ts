// ITRJson.js
// ✅ PURE MAPPER: meta + sections  -> IncomeTax ITR1 JSON
// ✅ No tax calculations here. Only mapping + defaults (null -> 0, "" -> "", etc.)

/* ===================== HELPERS ===================== */
const toStr = (v, d = '') => (v === null || v === undefined ? d : String(v));
const toUpper = (v) => toStr(v, '').trim().toUpperCase();
const toNum = (v, d = 0) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : d;
};
const toBoolYN = (v, defaultYN = 'N') => {
  const s = toStr(v, '').toLowerCase();
  if (s === 'true' || s === '1' || s === 'y' || s === 'yes') return 'Y';
  if (s === 'false' || s === '0' || s === 'n' || s === 'no') return 'N';
  return defaultYN;
};
const safeArr = (v) => (Array.isArray(v) ? v : []);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatToYMD = (d) => {
  // accepts: Date | "YYYY-MM-DD" | ISO
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ReturnFileSec expects a number (in your sample it's 12).
// If you already have returnFileSec computed, pass it directly.
const defaultReturnFileSec = (v) => toNum(v, 11);

// AY in IncomeTax JSON example: "2025" (start year)
const getAssessmentYearStart = (ayStr) => {
  // "2025-2026" => "2025"
  const s = toStr(ayStr, '');
  const y = s.split('-')[0];
  return y || '';
};

/* ===================== MAIN BUILDER ===================== */
export const buildITR1FromMyJson = ({
  meta = {},
  sections = {},
  ayRow = null, // optional: to pull dueDate etc if you store there
  SWNO = 'SW20011054',
  intermediaryCity = 'NAGPUR',
  digest = '-',
  returnFileSec = 12,
}) => {
  console.log('irt 1 json prepare');
  // ---- meta pieces
  const pan = toUpper(meta?.pan);
  const pd = meta?.taxpayer?.personalDetails || {};
  const addr = meta?.address || {};
  const bank = meta?.bank || {};

  const firstName = toUpper(pd?.firstName || meta?.taxpayer?.name?.split(' ')?.[0] || '');
  const middleName = toUpper(pd?.middleName || '');
  const lastName = toUpper(pd?.lastName || '');

  const cityName = toUpper(addr?.city?.name?.en || addr?.city?.name?.hi || addr?.city?.name?.mr || addr?.city || intermediaryCity);

  const stateCode = toStr(addr?.state?.incomeTaxStateCode, ''); // in your meta.state this exists
  const pinCode = toNum(addr?.pin, 0);

  const dob = formatToYMD(meta?.taxpayer?.dob || pd?.dob);

  // Employer category in IncomeTax JSON sample is like "CGOV"/"OTH"
  const employerCategory = toUpper(meta?.natureOfEmployment || '');

  const aadhaar = toUpper(pd?.aadharNumber || '');

  const assessmentYear = getAssessmentYearStart(meta?.assessmentYear); // "2025"

  // Due date: if you store it in ayRow.dueDate or ayRow.lastFilingItrDate
  const itrDueDate = formatToYMD(ayRow?.dueDate || ayRow?.lastFilingItrDate || '');

  // ---- sections (your UI json)
  const sal = sections?.incomeFromSalary || {};
  const hp = sections?.houseProperty || {};
  const os = sections?.incomeOtherSources || {};
  const ded = sections?.totalDeductions || {};
  const exm = sections?.exemptedIncome || sections?.exemptedIncome || {};
  const taxesPaid = sections?.taxesPaid || {};
  const comp = sections?.computations || {};

  // Salary fields
  const s1 = toNum(sal?.salary?.fields?.s1, 0);
  const s2 = toNum(sal?.salary?.fields?.s2, 0);
  const s3 = toNum(sal?.salary?.fields?.s3, 0);

  const salaryTotal = toNum(sal?.salary?.totalSalary, s1 + s2 + s3);

  // 89A notified (IncomeFromSalary salary89A.fields in your json)
  const notUSA = toNum(sal?.salary89A?.fields?.usa, 0);
  const notUK = toNum(sal?.salary89A?.fields?.uk, 0);
  const notCA = toNum(sal?.salary89A?.fields?.canada, 0);
  const notOther = toNum(sal?.salary89A?.fields?.other, 0); // not in IncomeTax type list, keep as other bucket

  // Exempt allowances
  const exemptRows = safeArr(sal?.exemptAllowances?.rows);
  const totalExemptAllowance = toNum(sal?.exemptAllowances?.totalExempt, 0);

  // Deductions u/s 16
  const stdDed = toNum(sal?.deductions?.standardDeduction, 0);
  const entertainment = toNum(sal?.deductions?.fields?.entertainment, 0);
  const professionalTax = toNum(sal?.deductions?.fields?.professionalTax, 0);

  // Net salary (IncomeFromSal in IncomeTax schema) — already computed in your sections
  const incomeFromSal = toNum(sal?.netSalary, 0);

  // House property (your json is all strings, mapped to ITR1 HP fields)
  const typeOfHP = toStr(hp?.propertyType || 'L', 'L'); // you can pass actual if you have; default "L"
  const grossRentReceived = toNum(hp?.rent?.received, 0);
  const taxPaidLocal = toNum(hp?.rent?.municipalTax, 0);
  const annualValue = toNum(hp?.rent?.annualValue, 0);
  const stdDedHP = toNum(hp?.rent?.thirtyPercentAnnualValue, 0);
  const interestPayable = toNum(hp?.loan?.interest, 0);
  const arrears = toNum(hp?.loan?.arrearsAfter30, toNum(hp?.loan?.arrears, 0));
  const totalIncomeHP = toNum(hp?.totalIncomeFromHouseProperty, 0);

  // Other sources
  const saving = toNum(os?.nature?.saving, 0);
  const deposit = toNum(os?.nature?.deposit, 0);
  const refund = toNum(os?.nature?.refund, 0);

  const dividendTotal = toNum(os?.dividend?.totalDividend, 0);
  const divQ1 = toNum(os?.dividend?.q1, 0);
  const divQ2 = toNum(os?.dividend?.q2, 0);
  const divQ3 = toNum(os?.dividend?.q3, 0);
  const divQ4 = toNum(os?.dividend?.q4, 0);
  const divQ5 = toNum(os?.dividend?.q5, 0);

  const notified89A_total = toNum(os?.notified?.totalNotified, notUSA + notUK + notCA); // keep consistent
  const nonNotified89A = toNum(os?.nonNotified89A, 0);

  const q89A1 = toNum(os?.quarters89A?.q1, 0);
  const q89A2 = toNum(os?.quarters89A?.q2, 0);
  const q89A3 = toNum(os?.quarters89A?.q3, 0);
  const q89A4 = toNum(os?.quarters89A?.q4, 0);
  const q89A5 = toNum(os?.quarters89A?.q5, 0);

  const grossOtherIncome = toNum(os?.totals?.grossOtherIncome, saving + deposit + refund);
  const incomeOthSrc = toNum(os?.netOtherIncome, grossOtherIncome); // your json has netOtherIncome

  // Extra other income rows: map directly
  const otherIncomeRows = safeArr(os?.otherRows)
    .filter((r) => toStr(r?.incomeType || r?.type, '').trim() !== '')
    .map((r) => ({
      OthSrcNatureDesc: toUpper(r?.incomeType || r?.type),
      OthSrcOthAmount: toNum(r?.amount, 0),
    }));

  // Deductions u/s 57
  const deduction57iia = toNum(os?.deductions?.deduction57, 0);

  // Gross Total Income etc (already computed by you in computations)
  const grossTotIncome = toNum(comp?.totalIncomeTaxPayable, 0); // matches your computations.totalIncomeTaxPayable
  const grossTotIncomeIncLTCG112A = grossTotIncome; // if you later support LTCG 112A, add it here

  // Chapter VIA deductions (you have totalDeductions.totalDeduction already)
  const totalChapVIADeductions = toNum(ded?.totalDeduction, 0);

  // Exempted income schedule (your exemptedIncome.rows)
  const exemptedRows = safeArr(exm?.rows);
  const totalExemptIncome = toNum(exm?.totalExemptIncome, 0);

  // LTCG 112A from your exemptedIncome.ltcg112a
  const ltcgSale = toNum(exm?.ltcg112a?.sale, 0);
  const ltcgCost = toNum(exm?.ltcg112a?.cost, 0);
  const ltcg = toNum(exm?.ltcg112a?.ltcg, 0);

  // Tax computation (already computed)
  const totalTaxPayable = toNum(comp?.taxPayable, 0);
  const rebate87A = toNum(comp?.rebate87A, 0);
  const taxPayableOnRebate = toNum(comp?.taxAfterRebate, totalTaxPayable);
  const cess = toNum(comp?.cess, 0);
  const grossTaxLiability = toNum(comp?.totalTaxAndCess, 0);
  const section89 = toNum(comp?.relief89, 0);
  const netTaxLiability = toNum(comp?.balanceAfterRelief, grossTaxLiability);

  const intr234A = toNum(comp?.fee234A, 0);
  const intr234B = toNum(comp?.fee234B, 0);
  const intr234C = toNum(comp?.fee234C, 0);
  const fee234F = toNum(comp?.fee234F, 0);
  const totalIntrstPay = toNum(comp?.totalInterestFeePayable, intr234A + intr234B + intr234C + fee234F);

  const totTaxPlusIntrstPay = toNum(comp?.balanceAfterRelief, 0) + totalIntrstPay;

  // TaxesPaid mapping
  // NOTE: your taxesPaid.advanceTaxes includes BOTH Advance + Self assessment in one list
  // since you said you already calculated earlier, we should not re-calc here.
  // We'll just pick totals when present, else 0.
  const totalTds = toNum(taxesPaid?.totals?.totalTdsTaxPaid, 0);

  // If you want to split AdvanceTax vs SelfAssessmentTax:
  // you MUST pass those precomputed values in sections.taxesPaid.totals (recommended)
  const totalAdvanceTaxPaid = toNum(taxesPaid?.totals?.totalAdvanceTaxPaid, 0);

  const totalTaxesPaid = toNum(taxesPaid?.totalTaxesPaid, totalTds + totalAdvanceTaxPaid);

  // Balance tax payable in sample is TotTaxPlusIntrstPay - TotalTaxesPaid
  const balTaxPayable = totTaxPlusIntrstPay - totalTaxesPaid;

  // Refund
  // Your app likely uses 0 unless net is negative; keep 0 here like sample.
  const refundDue = 0;

  // TDS on salaries (Schedule)
  const tdsData = safeArr(taxesPaid?.tdsData);
  const tdsOnSalaryList =
    totalTds > 0
      ? tdsData.map((item) => ({
          EmployerOrDeductorOrCollectDetl: {
            TAN: toUpper(item?.tan),
            EmployerOrDeductorOrCollecterName: toStr(item?.companyName, ''),
          },
          IncChrgSal: toNum(item?.totalSalary, 0),
          TotalTDSSal: toNum(item?.amount, 0),
        }))
      : undefined;

  // Tax payments schedule (challans): use advanceTaxes list (your schema uses bsr/depositDate/challan/taxPaid)
  const challans = safeArr(taxesPaid?.advanceTaxes);
  const taxPaymentList =
    totalAdvanceTaxPaid > 0
      ? challans.map((c) => ({
          BSRCode: toStr(c?.bsr, ''),
          DateDep: formatToYMD(c?.depositDate),
          SrlNoOfChaln: toStr(c?.challan, ''),
          Amt: toNum(c?.taxPaid, 0),
        }))
      : undefined;

  // ---- Build fixed skeleton with required keys (IncomeTax expects these)
  const itr1 = {
    CreationInfo: {
      SWVersionNo: 'Ver1.0',
      SWCreatedBy: SWNO,
      JSONCreatedBy: SWNO,
      JSONCreationDate: formatToYMD(new Date()),
      IntermediaryCity: toUpper(intermediaryCity),
      Digest: toStr(digest, '-'),
    },

    Form_ITR1: {
      FormName: 'ITR-1',
      Description: 'For Indls having Income from Salary, Pension, family pension and Interest',
      AssessmentYear: assessmentYear,
      SchemaVer: 'Ver1.0',
      FormVer: 'Ver1.0',
    },

    PersonalInfo: {
      AssesseeName: {
        FirstName: firstName,
        MiddleName: middleName,
        SurNameOrOrgName: lastName,
      },
      PAN: pan,
      Address: {
        ResidenceNo: toUpper(addr?.address1),
        ResidenceName: toUpper(addr?.address2),
        RoadOrStreet: toUpper(addr?.address3),
        LocalityOrArea: toUpper(addr?.address4),
        CityOrTownOrDistrict: cityName,
        StateCode: toStr(stateCode, ''), // IncomeTax state code
        CountryCode: '91',
        PinCode: pinCode,
        CountryCodeMobile: 91,
        MobileNo: toNum(meta?.taxpayer?.mobileNumber, 0),
        EmailAddress: toStr(meta?.taxpayer?.emailId, ''),
      },
      DOB: dob,
      EmployerCategory: employerCategory,
      AadhaarCardNo: aadhaar,
    },

    FilingStatus: {
      ReturnFileSec: defaultReturnFileSec(returnFileSec),
      SeventhProvisio139: 'N',
      OptOutNewTaxRegime: 'N',
      ItrFilingDueDate: itrDueDate,
    },

    ITR1_IncomeDeductions: {
      GrossSalary: salaryTotal, // already computed; else s1+s2+s3
      Salary: s1,
      PerquisitesValue: s2,
      ProfitsInSalary: s3,
      Increliefus89A: 0,
      Increliefus89AOS: 0,

      IncomeNotified89AType: [
        { NOT89ACountrycode: 'US', NOT89AAmount: notUSA },
        { NOT89ACountrycode: 'UK', NOT89AAmount: notUK },
        { NOT89ACountrycode: 'CA', NOT89AAmount: notCA },
      ],

      IncomeNotified89A: notUSA + notUK + notCA, // as per sample
      IncomeNotifiedOther89A: notOther + nonNotified89A,

      AllwncExemptUs10: {
        TotalAllwncExemptUs10: totalExemptAllowance,
        ...(totalExemptAllowance > 0
          ? {
              AllwncExemptUs10Dtls: exemptRows.map((r) => ({
                SalNatureDesc: toStr(r?.exemptAllowance || r?.nature || '', ''),
                SalOthAmount: toNum(r?.exemptAmount, 0),
              })),
            }
          : {}),
      },

      NetSalary: salaryTotal, // In your sample it is 1425160. (IncomeFromSal already contains std deduction.)
      DeductionUs16: stdDed + entertainment + professionalTax,
      DeductionUs16ia: stdDed,
      EntertainmentAlw16ii: entertainment,
      ProfessionalTaxUs16iii: professionalTax,

      IncomeFromSal: incomeFromSal, // ✅ your already computed netSalary

      TypeOfHP: toStr(typeOfHP, 'L'),
      GrossRentReceived: grossRentReceived,
      TaxPaidlocalAuth: taxPaidLocal,
      AnnualValue: annualValue,
      StandardDeduction: stdDedHP,
      InterestPayable: interestPayable,
      ArrearsUnrealizedRentRcvd: arrears,
      TotalIncomeOfHP: totalIncomeHP,

      IncomeOthSrc: incomeOthSrc,

      OthersInc: {
        OthersIncDtlsOthSrc: [
          { OthSrcNatureDesc: 'SAV', OthSrcOthAmount: saving },
          { OthSrcNatureDesc: 'IFD', OthSrcOthAmount: deposit },
          { OthSrcNatureDesc: 'TAX', OthSrcOthAmount: refund },

          ...otherIncomeRows,

          {
            OthSrcOthAmount: dividendTotal,
            OthSrcNatureDesc: 'DIV',
            DividendInc: {
              DateRange: {
                Upto15Of6: divQ1,
                Upto15Of9: divQ2,
                Up16Of9To15Of12: divQ3,
                Up16Of12To15Of3: divQ4,
                Up16Of3To31Of3: divQ5,
              },
            },
          },

          {
            OthSrcOthAmount: notified89A_total,
            OthSrcNatureDesc: 'NOT89A',
            NOT89A: [
              { NOT89ACountrycode: 'US', NOT89AAmount: toNum(os?.notified?.usa, 0) },
              { NOT89ACountrycode: 'UK', NOT89AAmount: toNum(os?.notified?.uk, 0) },
              { NOT89ACountrycode: 'CA', NOT89AAmount: toNum(os?.notified?.canada, 0) },
            ],
            NOT89AInc: {
              DateRange: {
                Upto15Of6: q89A1,
                Upto15Of9: q89A2,
                Up16Of9To15Of12: q89A3,
                Up16Of12To15Of3: q89A4,
                Up16Of3To31Of3: q89A5,
              },
            },
          },
        ],
      },

      DeductionUs57iia: deduction57iia,

      GrossTotIncome: grossTotIncome,
      GrossTotIncomeIncLTCG112A: grossTotIncomeIncLTCG112A,

      // You don't have per-section deductions breakup; keep all zeros but keep the object present
      UsrDeductUndChapVIA: {
        Section80C: 0,
        Section80CCC: 0,
        Section80CCDEmployeeOrSE: 0,
        Section80CCD1B: 0,
        Section80CCDEmployer: 0,
        Section80D: 0,
        Section80DD: 0,
        Section80DDB: 0,
        Section80E: 0,
        Section80EE: 0,
        Section80EEA: 0,
        Section80EEB: 0,
        Section80G: 0,
        Section80GG: 0,
        Section80GGA: 0,
        Section80GGC: 0,
        AnyOthSec80CCH: 0,
        Section80U: 0,
        Section80TTA: 0,
        Section80TTB: 0,
        TotalChapVIADeductions: totalChapVIADeductions,
      },

      DeductUndChapVIA: {
        Section80C: 0,
        Section80CCC: 0,
        Section80CCDEmployeeOrSE: 0,
        Section80CCD1B: 0,
        Section80CCDEmployer: 0,
        Section80D: 0,
        Section80DD: 0,
        Section80DDB: 0,
        Section80E: 0,
        Section80EE: 0,
        Section80EEA: 0,
        Section80EEB: 0,
        Section80G: 0,
        Section80GG: 0,
        Section80GGA: 0,
        Section80GGC: 0,
        AnyOthSec80CCH: 0,
        Section80U: 0,
        Section80TTA: 0,
        Section80TTB: 0,
        TotalChapVIADeductions: totalChapVIADeductions,
      },

      TotalIncome: grossTotIncome, // you already have computed total income; keep same
      ExemptIncAgriOthUs10: {
        ExemptIncAgriOthUs10Total: totalExemptIncome,
        ...(totalExemptIncome > 0
          ? {
              ExemptIncAgriOthUs10Dtls: exemptedRows.map((r) => ({
                NatureDesc: toStr(r?.reportingPurpose || r?.nature || '', ''),
                OthAmount: toNum(r?.exemptIncome, 0),
              })),
            }
          : {}),
      },
    },

    ITR1_TaxComputation: {
      TotalTaxPayable: totalTaxPayable,
      Rebate87A: rebate87A,
      TaxPayableOnRebate: taxPayableOnRebate,
      EducationCess: cess,
      GrossTaxLiability: grossTaxLiability,
      Section89: section89,
      NetTaxLiability: netTaxLiability,
      TotalIntrstPay: totalIntrstPay,
      IntrstPay: {
        IntrstPayUs234A: intr234A,
        IntrstPayUs234B: intr234B,
        IntrstPayUs234C: intr234C,
        LateFilingFee234F: fee234F,
      },
      TotTaxPlusIntrstPay: totTaxPlusIntrstPay,
    },

    LTCG112A: {
      TotSaleCnsdrn: ltcgSale,
      TotCstAcqisn: ltcgCost,
      LongCap112A: ltcg,
    },

    TaxPaid: {
      TaxesPaid: {
        // Keep as 0 breakdown unless you later store separate buckets
        AdvanceTax: 0,
        TDS: totalTds,
        TCS: 0,
        SelfAssessmentTax: totalAdvanceTaxPaid,
        TotalTaxesPaid: totalTaxesPaid,
      },
      BalTaxPayable: balTaxPayable,
    },

    Refund: {
      RefundDue: refundDue,
      BankAccountDtls: {
        AddtnlBankDetails: [
          {
            IFSCCode: toStr(bank?.ifscCode, ''),
            BankName: toStr(bank?.bankName, ''),
            BankAccountNo: toStr(bank?.accountNumber, ''),
            AccountType: toStr(bank?.accountType, ''),
            UseForRefund: 'true',
          },
        ],
      },
    },

    Verification: {
      Declaration: {
        AssesseeVerName: toUpper(meta?.taxpayer?.name || `${firstName} ${lastName}`),
        FatherName: toUpper(`${middleName} ${lastName}`.trim()),
        AssesseeVerPAN: pan,
      },
      Capacity: 'R',
      Place: cityName,
    },

    TDSonSalaries: {
      ...(tdsOnSalaryList ? { TDSonSalary: tdsOnSalaryList } : {}),
      TotalTDSonSalaries: totalTds,
    },

    TDSonOthThanSals: {
      TotalTDSonOthThanSals: 0,
    },

    ScheduleTDS3Dtls: {
      TotalTDS3Details: 0,
    },

    ScheduleTCS: {
      TotalSchTCS: 0,
    },

    TaxPayments: {
      ...(taxPaymentList ? { TaxPayment: taxPaymentList } : {}),
      TotalTaxPayments: totalAdvanceTaxPaid,
    },
  };

  return { ITR: { ITR1: itr1 } };
};



export const buildITR4FromMyJson = ({ meta = {}, sections = {}, ayRow = null, SWNO = 'SW20011054', intermediaryCity = 'NAGPUR', digest = '-', returnFileSec = 11 }) => {
  console.log('irt 4 json prepare');
  const pan = toUpper(meta?.pan);
  const pd = meta?.taxpayer?.personalDetails || {};
  const addr = meta?.address || {};
  const bank = meta?.bank || {};

  const assessmentYear = getAssessmentYearStart(meta?.assessmentYear);
  const itrDueDate = formatToYMD(ayRow?.dueDate || ayRow?.lastFilingItrDate || '');

  const firstName = toUpper(pd?.firstName || meta?.taxpayer?.name?.split(' ')?.[0] || '');
  const middleName = toUpper(pd?.middleName || '');
  const lastName = toUpper(pd?.lastName || '');

  const cityName = toUpper(addr?.city?.name?.en || addr?.city?.name || addr?.city || intermediaryCity);
  const stateCode = toStr(addr?.state?.incomeTaxStateCode, '');
  const pinCode = toNum(addr?.pin, 0);

  const dob = formatToYMD(meta?.taxpayer?.dob || pd?.dob);
  const employerCategory = toUpper(meta?.natureOfEmployment || 'OTH');
  const aadhaar = toUpper(pd?.aadharNumber || '');

  // ---- sections ----
  const sal = sections?.incomeFromSalary || {};
  const hp = sections?.houseProperty || {};
  const os = sections?.incomeOtherSources || {};
  const ded = sections?.totalDeductions || {};
  const taxesPaid = sections?.taxesPaid || {};
  const comp = sections?.computations || {};
  const u44 = sections?.underSec44 || {};

  // ---- salary ----
  const s1 = toNum(sal?.salary?.fields?.s1, 0);
  const s2 = toNum(sal?.salary?.fields?.s2, 0);
  const s3 = toNum(sal?.salary?.fields?.s3, 0);
  const grossSalary = toNum(sal?.salary?.totalSalary, s1 + s2 + s3);

  const stdDed = toNum(sal?.deductions?.standardDeduction, 0);
  const entertainment = toNum(sal?.deductions?.fields?.entertainment, 0);
  const professionalTax = toNum(sal?.deductions?.fields?.professionalTax, 0);
  const deductionUs16 = stdDed + entertainment + professionalTax;

  const incomeFromSal = toNum(sal?.netSalary, 0);
  const netSalary = toNum(sal?.netSalary, 0); // schema wants both NetSalary + IncomeFromSal

  // ---- house property ----
  const grossRentReceived = toNum(hp?.rent?.received, 0);
  const taxPaidLocal = toNum(hp?.rent?.municipalTax, 0);
  const annualValue = toNum(hp?.rent?.annualValue, 0);
  const annualValue30 = toNum(hp?.rent?.thirtyPercentAnnualValue, 0);
  const interestPayable = toNum(hp?.loan?.interest, 0);
  const arrears = toNum(hp?.loan?.arrearsAfter30, toNum(hp?.loan?.arrears, 0));
  const totalIncomeHP = toNum(hp?.totalIncomeFromHouseProperty, 0);

  // ---- other sources ----
  const saving = toNum(os?.nature?.saving, 0);
  const deposit = toNum(os?.nature?.deposit, 0);
  const refundInt = toNum(os?.nature?.refund, 0);

  const dividendTotal = toNum(os?.dividend?.totalDividend, 0);
  const divQ1 = toNum(os?.dividend?.q1, 0);
  const divQ2 = toNum(os?.dividend?.q2, 0);
  const divQ3 = toNum(os?.dividend?.q3, 0);
  const divQ4 = toNum(os?.dividend?.q4, 0);
  const divQ5 = toNum(os?.dividend?.q5, 0);

  // ITR4 sample uses only SAV and DIV in OthersIncDtlsOthSrc (you can add more if needed)
  const othersIncDtls = [];
  if (saving > 0) {
    othersIncDtls.push({
      OthSrcNatureDesc: 'SAV',
      OthSrcOthNatOfInc: 'Interest from Saving Account',
      OthSrcOthAmount: saving,
    });
  }
  if (deposit > 0) {
    othersIncDtls.push({
      OthSrcNatureDesc: 'IFD',
      OthSrcOthNatOfInc: 'Interest from Deposits',
      OthSrcOthAmount: deposit,
    });
  }
  if (refundInt > 0) {
    othersIncDtls.push({
      OthSrcNatureDesc: 'TAX',
      OthSrcOthNatOfInc: 'Interest on Income Tax Refund',
      OthSrcOthAmount: refundInt,
    });
  }
  if (dividendTotal > 0) {
    othersIncDtls.push({
      OthSrcNatureDesc: 'DIV',
      OthSrcOthNatOfInc: 'Dividends, Gross',
      OthSrcOthAmount: dividendTotal,
      DividendInc: {
        DateRange: {
          Upto15Of6: divQ1,
          Upto15Of9: divQ2,
          Up16Of9To15Of12: divQ3,
          Up16Of12To15Of3: divQ4,
          Up16Of3To31Of3: divQ5,
        },
      },
    });
  }

  const incomeOthSrc = toNum(os?.netOtherIncome, saving + deposit + refundInt + dividendTotal);

  // ---- deductions (Chapter VIA totals) ----
  const totalChapVIADeductions = toNum(ded?.totalDeduction, 0);

  // ---- presumptive (ScheduleBP) ----
  const sectionOpted = toUpper(u44?.sectionOpted || u44?.section); // 44AD/44ADA/44AE
  const businessName = toUpper(u44?.businessName || '');
  const businessCode = toStr(u44?.sectionTypeCode || u44?.codeAD || ''); // you should map this from your dropdown

  const turnoverTotal = toNum(u44?.totalTurnoverAuto ?? u44?.turnover, 0);
  const cashTurnover = toNum(u44?.cashTurnover, 0);
  const digitalTurnover = toNum(u44?.digitalTurnover, 0);

  // Your computed values
  const incomeOnDigital6 = toNum(u44?.incomeOnDigital6, 0);
  const incomeOnCash8 = toNum(u44?.incomeOnCash8, 0);
  const presumptiveIncome44ADA = toNum(u44?.presumptiveIncome44ADA, 0);
  const computedPresumptiveIncome44AE = toNum(u44?.computedPresumptiveIncome44AE, 0);

  const finalPresumptiveIncome = toNum(u44?.finalPresumptiveIncome, 0);

  // For schema: IncomeFromBusinessProf must match BP income chargeable
  const incomeFromBusinessProf = finalPresumptiveIncome;

  // Financial particulars mapping (your modalPayload naming vs schema naming)
  const fin = u44?.financials || null;
  const financlPart = fin
    ? {
        PartnerMemberOwnCapital: toNum(fin?.liabilities?.partnersOwnCapital ?? fin?.PartnerMemberOwnCapital, 0),
        SecuredLoans: toNum(fin?.liabilities?.securedLoans ?? fin?.SecuredLoans, 0),
        UnSecuredLoans: toNum(fin?.liabilities?.unsecuredLoans ?? fin?.UnSecuredLoans, 0),
        Advances: toNum(fin?.liabilities?.advances ?? fin?.Advances, 0),
        SundryCreditors: toNum(fin?.liabilities?.sundryCreditors ?? fin?.SundryCreditors, 0),
        OthrCurrLiab: toNum(fin?.liabilities?.otherLiabilities ?? fin?.OthrCurrLiab, 0),
        TotCapLiabilities: toNum(fin?.totalLiabilities ?? fin?.TotCapLiabilities, 0),

        FixedAssets: toNum(fin?.assets?.fixedAssets ?? fin?.FixedAssets, 0),
        Inventories: toNum(fin?.assets?.inventories ?? fin?.Inventories, 0),
        SundryDebtors: toNum(fin?.assets?.sundryDebtors ?? fin?.SundryDebtors, 0),
        BalWithBanks: toNum(fin?.assets?.balanceWithBanks ?? fin?.BalWithBanks, 0),
        CashInHand: toNum(fin?.assets?.cashInHand ?? fin?.CashInHand, 0),
        LoansAndAdvances: toNum(fin?.assets?.loansAndAdvances ?? fin?.LoansAndAdvances, 0),
        OtherAssets: toNum(fin?.assets?.otherAssets ?? fin?.OtherAssets, 0),
        TotalAssets: toNum(fin?.totalAssets ?? fin?.TotalAssets, 0),
      }
    : {
        PartnerMemberOwnCapital: 0,
        SecuredLoans: 0,
        UnSecuredLoans: 0,
        Advances: 0,
        SundryCreditors: 0,
        OthrCurrLiab: 0,
        TotCapLiabilities: 0,
        FixedAssets: 0,
        Inventories: 0,
        SundryDebtors: 0,
        BalWithBanks: 0,
        CashInHand: 0,
        LoansAndAdvances: 0,
        OtherAssets: 0,
        TotalAssets: 0,
      };

  // ---- computations ----
  const grossTotIncome = toNum(comp?.totalIncomeTaxPayable ?? comp?.GrossTotIncome, 0);
  const grossTotIncomeIncLTCG112A = grossTotIncome;
  const totalIncome = toNum(comp?.totalIncomeTaxPayable, grossTotIncome);

  const totalTaxPayable = toNum(comp?.taxPayable, 0);
  const rebate87AVal = toNum(comp?.rebate87A, 0);
  const taxPayableOnRebate = toNum(comp?.taxAfterRebate, 0);
  const cess = toNum(comp?.cess, 0);
  const grossTaxLiability = toNum(comp?.totalTaxAndCess, 0);
  const section89 = toNum(comp?.relief89, 0);
  const netTaxLiability = toNum(comp?.balanceAfterRelief, 0);

  const intr234A = toNum(comp?.fee234A, 0);
  const intr234B = toNum(comp?.fee234B, 0);
  const intr234C = toNum(comp?.fee234C, 0);
  const fee234F = toNum(comp?.fee234F, 0);

  const totTaxPlusIntrstPay = toNum(comp?.totalTaxFeeInterest, 0);

  // ---- taxes paid ----
  const totalTds = toNum(taxesPaid?.totals?.totalTdsTaxPaid, 0);
  const totalAdvanceTaxPaid = toNum(taxesPaid?.totals?.totalAdvanceTaxPaid, 0);
  const totalTaxesPaid = toNum(taxesPaid?.totalTaxesPaid, totalTds + totalAdvanceTaxPaid);

  // refund + balance (your sample uses RefundDue=3150 and BalTaxPayable=0)
  // implement simple: if TotTaxPlusIntrstPay <= TotalTaxesPaid => refund due else bal payable
  const balTaxPayable = Math.max(toNum(totTaxPlusIntrstPay, 0) - totalTaxesPaid, 0);
  const refundDue = Math.max(totalTaxesPaid - toNum(totTaxPlusIntrstPay, 0), 0);

  // ---- ITR4 JSON ----
  const itr4 = {
    CreationInfo: {
      SWVersionNo: toStr(meta?.swVersionNo, 'Ver1.0'),
      SWCreatedBy: SWNO,
      JSONCreatedBy: SWNO,
      JSONCreationDate: formatToYMD(new Date()),
      IntermediaryCity: toUpper(intermediaryCity),
      Digest: toStr(digest, '-'),
    },

    Form_ITR4: {
      FormName: 'ITR-4',
      Description: 'For Individuals having Income From Presemptive Business',
      AssessmentYear: assessmentYear,
      SchemaVer: 'Ver1.0',
      FormVer: 'Ver1.0',
    },

    PersonalInfo: {
      AssesseeName: {
        FirstName: firstName,
        MiddleName: middleName,
        SurNameOrOrgName: lastName,
      },
      PAN: pan,
      Address: {
        ResidenceNo: toUpper(addr?.address1),
        ResidenceName: toUpper(addr?.address2),
        RoadOrStreet: toUpper(addr?.address3),
        LocalityOrArea: toUpper(addr?.address4),
        CityOrTownOrDistrict: cityName,
        StateCode: stateCode,
        CountryCode: '91',
        PinCode: pinCode,
        CountryCodeMobile: 91,
        MobileNo: toNum(meta?.taxpayer?.mobileNumber, 0),
        EmailAddress: toStr(meta?.taxpayer?.emailId, ''),
      },
      DOB: dob,
      EmployerCategory: employerCategory,
      AadhaarCardNo: aadhaar,
      Status: 'I',
    },

    FilingStatus: {
      ReturnFileSec: defaultReturnFileSec(returnFileSec),
      SeventhProvisio139: 'N',
      OptOutNewTaxRegime_Form10IEA_AY24_25: 'N',
      No_OptOutNewTaxReg: 'N',
      ItrFilingDueDate: itrDueDate,
      AsseseeRepFlg: 'N',
    },

    IncomeDeductions: {
      GrossTotIncome: grossTotIncome,
      GrossTotIncomeIncLTCG112A: grossTotIncomeIncLTCG112A,

      IncomeFromBusinessProf: incomeFromBusinessProf,

      GrossSalary: grossSalary,
      Salary: s1,
      PerquisitesValue: s2,
      ProfitsInSalary: s3,

      IncomeNotified89A: 0,
      IncomeNotifiedOther89A: 0,
      AllwncExemptUs10: { TotalAllwncExemptUs10: 0 },
      Increliefus89A: 0,

      NetSalary: grossSalary,
      DeductionUs16: deductionUs16,
      DeductionUs16ia: stdDed,
      EntertainmntalwncUs16ii: entertainment,
      ProfessionalTaxUs16iii: professionalTax,
      IncomeFromSal: incomeFromSal,

      GrossRentReceived: grossRentReceived,
      TaxPaidlocalAuth: taxPaidLocal,
      AnnualValue: annualValue,
      AnnualValue30Percent: annualValue30,
      InterestPayable: interestPayable,
      ArrearsUnrealizedRentRcvd: arrears,
      TotalIncomeOfHP: totalIncomeHP,

      IncomeOthSrc: incomeOthSrc,
      OthersInc: { OthersIncDtlsOthSrc: othersIncDtls },

      DeductionUs57iia: toNum(os?.deductions?.deduction57, 0),

      Increliefus89AOS: 0,

      UsrDeductUndChapVIA: {
        Section80C: 0,
        Section80CCC: 0,
        Section80CCDEmployeeOrSE: 0,
        Section80CCD1B: 0,
        Section80CCDEmployer: 0,
        Section80D: 0,
        Section80DD: 0,
        Section80DDB: 0,
        Section80E: 0,
        Section80EE: 0,
        Section80EEA: 0,
        Section80EEB: 0,
        Section80G: 0,
        Section80GG: 0,
        Section80GGC: 0,
        Section80U: 0,
        Section80TTA: 0,
        Section80TTB: 0,
        TotalChapVIADeductions: totalChapVIADeductions,
        AnyOthSec80CCH: 0,
      },

      DeductUndChapVIA: {
        Section80C: 0,
        Section80CCC: 0,
        Section80CCDEmployeeOrSE: 0,
        Section80CCD1B: 0,
        Section80CCDEmployer: 0,
        Section80D: 0,
        Section80DD: 0,
        Section80DDB: 0,
        Section80E: 0,
        Section80EE: 0,
        Section80EEA: 0,
        Section80EEB: 0,
        Section80G: 0,
        Section80GG: 0,
        Section80GGC: 0,
        Section80U: 0,
        Section80TTA: 0,
        Section80TTB: 0,
        TotalChapVIADeductions: totalChapVIADeductions,
        AnyOthSec80CCH: 0,
      },

      TotalIncome: Math.round(totalIncome),
    },

    TaxComputation: {
      TotalTaxPayable: totalTaxPayable,
      Rebate87A: rebate87AVal,
      TaxPayableOnRebate: taxPayableOnRebate,
      EducationCess: cess,
      GrossTaxLiability: grossTaxLiability,
      Section89: section89,
      NetTaxLiability: netTaxLiability,

      IntrstPay: {
        IntrstPayUs234A: intr234A,
        IntrstPayUs234B: intr234B,
        IntrstPayUs234C: intr234C,
        LateFilingFee234F: fee234F,
      },
      TotTaxPlusIntrstPay: toNum(comp?.totalTaxFeeInterest, 0),
    },

    TaxPaid: {
      TaxesPaid: {
        AdvanceTax: 0,
        TDS: totalTds,
        TCS: 0,
        SelfAssessmentTax: totalAdvanceTaxPaid,
        TotalTaxesPaid: totalTaxesPaid,
      },
      BalTaxPayable: balTaxPayable,
    },

    Refund: {
      RefundDue: refundDue,
      BankAccountDtls: {
        AddtnlBankDetails: [
          {
            IFSCCode: toStr(bank?.ifscCode, ''),
            BankName: toUpper(bank?.bankName || ''),
            BankAccountNo: toStr(bank?.accountNumber, ''),
            UseForRefund: 'true',
            AccountType: toStr(bank?.accountType, 'SB'),
          },
        ],
      },
    },

    Schedule80D: {
      Sec80DSelfFamSrCtznHealth: {
        SeniorCitizenFlag: 'S',
        SelfAndFamily: 0,
        HealthInsPremSlfFam: 0,
        PrevHlthChckUpSlfFam: 0,
        SelfAndFamilySeniorCitizen: 0,
        HlthInsPremSlfFamSrCtzn: 0,
        PrevHlthChckUpSlfFamSrCtzn: 0,
        MedicalExpSlfFamSrCtzn: 0,
        ParentsSeniorCitizenFlag: 'P',
        Parents: 0,
        HlthInsPremParents: 0,
        PrevHlthChckUpParents: 0,
        ParentsSeniorCitizen: 0,
        HlthInsPremParentsSrCtzn: 0,
        PrevHlthChckUpParentsSrCtzn: 0,
        MedicalExpParentsSrCtzn: 0,
        EligibleAmountOfDedn: 0,
      },
    },

    TaxExmpIntIncDtls: {
      OthersInc: { OthersTotalTaxExe: 0 },
    },

    Verification: {
      Declaration: {
        AssesseeVerName: toUpper(meta?.taxpayer?.name || `${firstName} ${middleName} ${lastName}`),
        FatherName: toUpper(`${pd?.fatherFirstName || ''} ${pd?.fatherLastName || ''}`.trim() || `${middleName} ${lastName}`.trim()),
        AssesseeVerPAN: pan,
      },
      Capacity: 'S',
      Place: cityName,
    },

    // ✅ ScheduleBP (matches your sample structure)
    ScheduleBP: {
      NatOfBus44AD: businessName
        ? [
            {
              NameOfBusiness: businessName,
              CodeAD: businessCode,
              Description: '',
            },
          ]
        : [],

      PersumptiveInc44AD: {
        GrsTrnOverBank: digitalTurnover,
        GrsTrnOverAnyOthMode: cashTurnover,
        PersumptiveInc44AD6Per: incomeOnDigital6,
        PersumptiveInc44AD8Per: incomeOnCash8,
        TotPersumptiveInc44AD: sectionOpted === '44AD' ? finalPresumptiveIncome : 0,
        GrsTotalTrnOver: turnoverTotal,
        GrsTotalTrnOverInCash: cashTurnover,
      },

      PersumptiveInc44ADA: {
        GrsReceipt: turnoverTotal,
        TotPersumptiveInc44ADA: sectionOpted === '44ADA' ? finalPresumptiveIncome : 0,
        GrsTrnOverBank44ADA: digitalTurnover,
        GrsTotalTrnOverInCash44ADA: cashTurnover,
        GrsTrnOverAnyOthMode44ADA: cashTurnover,
      },

      PersumptiveInc44AE: {
        TotPersumInc44AE: sectionOpted === '44AE' ? computedPresumptiveIncome44AE : 0,
        SalInterestByFirm: 0,
        TotalPersumptiveInc: sectionOpted === '44AE' ? finalPresumptiveIncome : 0,
        IncChargeableUnderBus: incomeFromBusinessProf,
      },

      TurnoverGrsRcptForGSTIN: u44?.gstNo
        ? [
            {
              GSTINNo: toStr(u44?.gstNo, ''),
              AmtTurnGrossRcptGSTIN: 0,
            },
          ]
        : [],

      TotalTurnoverGrsRcptGSTIN: 0,

      FinanclPartclrOfBusiness: financlPart,
    },

    ScheduleTCS: { TotalSchTCS: 0 },

    // Optional: you can map "TDSonOthThanSals" later from your backend AIS/TIS
    TDSonOthThanSals: { TotalTDSonOthThanSals: totalTds },

    ScheduleTDS3Dtls: { TotalTDS3Details: 0 },

    LTCG112A: {
      TotSaleCnsdrn: 0,
      TotCstAcqisn: 0,
      LongCap112A: 0,
    },
  };

  return { ITR: { ITR4: itr4 } };
};
/* ===================== ROUTER: Decide ITR1 vs ITR4 ===================== */
// You said: if Under Sec 44 has entry then use ITR4.
// Keep this helper near your other builders.
export const decideItrForm = ({ sections = {}, meta = {} }) => {
  const u44 = sections?.underSec44 || {};
  console.log('sectionssections', JSON.stringify(sections, null, 2));
  console.log('u44', JSON.stringify(u44, null, 2));

  const has44Value =
    !!toStr(u44?.sectionOpted, '').trim() ||
    !!toStr(u44?.section, '').trim() ||
    !!toStr(u44?.businessName, '').trim() ||
    !!toStr(u44?.sectionTypeCode, '').trim() ||
    !!toStr(u44?.codeAD, '').trim() ||
    !!toStr(u44?.gstNo, '').trim() ||
    toNum(u44?.turnover, 0) > 0 ||
    toNum(u44?.totalTurnoverAuto, 0) > 0 ||
    toNum(u44?.digitalTurnover, 0) > 0 ||
    toNum(u44?.cashTurnover, 0) > 0 ||
    toNum(u44?.incomeOnDigital6, 0) > 0 ||
    toNum(u44?.incomeOnCash8, 0) > 0 ||
    toNum(u44?.presumptiveIncome44ADA, 0) > 0 ||
    toNum(u44?.computedPresumptiveIncome44AE, 0) > 0 ||
    toNum(u44?.finalPresumptiveIncome, 0) > 0;

  if (has44Value) return 'ITR-4';

  if (toUpper(meta?.itrForm) === 'ITR-4') return 'ITR-4';
  if (toUpper(meta?.itrForm) === 'ITR-1') return 'ITR-1';

  return 'ITR-1';
};

export const buildITRJsonFromMyJson = (args) => {
  const { meta = {}, sections = {} } = args || {};
  const form = decideItrForm({ sections, meta });

  console.log('form type of form ', form);

  return form === 'ITR-4' ? buildITR4FromMyJson(args) : buildITR1FromMyJson(args);
};