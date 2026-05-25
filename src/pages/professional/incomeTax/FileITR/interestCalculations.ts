// interestCalculations.js
/* eslint-disable no-restricted-globals */

// ---------- Helpers ----------
export const toNum = (v) => (v ? parseFloat(String(v).replace(/,/g, '')) || 0 : 0);

export const toDateOnly = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const roundTo100 = (val) => Math.floor(toNum(val) / 100) * 100;

// RN: onePercent = floor(principal/100)
export const onePercentFloor = (v) => Math.floor(toNum(v) / 100);

// RN: if current month is Jan-Mar, start from previous year's April
export const generateMonthsFromApril = (todayInput = new Date()) => {
  const months = [];
  const today = new Date(todayInput);

  const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const start = new Date(year, 3, 1); // April 1
  let current = new Date(start);

  while (current <= today) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

export const formatMonthLabel = (d) => d.toLocaleString('default', { month: 'long', year: 'numeric' });

// ---------- RN PORT: 234A/234B interest table ----------
/**
 * This matches RN calculateInterestTable() exactly.
 *
 * Key RN behaviors:
 * - iterate months from April to today (FY-aware)
 * - deposits in a month are applied next month (carryDeposit)
 * - carryDeposit reduces remainingBalance first, then reduces BOTH principals equally
 * - int234B = floor(principal234B/100) if age<=60
 * - int234AF = floor(principal234AF/100) only from Sep onwards (monthIndex>=8)
 * - remainingBalance increases by monthly interests (234B+234AF)
 */
export const calculateInterestTableRN = ({ calculateAccToAge, openingPrincipal234B, openingPrincipal234AF, openingRemainingBalance = 0, deposits = [], today = new Date() }) => {
  let principal234B = toNum(openingPrincipal234B);
  let principal234AF = toNum(openingPrincipal234AF);
  let remainingBalance = toNum(openingRemainingBalance);

  let carryDeposit = 0;

  const months = generateMonthsFromApril(today);

  return months.map((monthDate) => {
    const monthIndex = monthDate.getMonth(); // Jan=0

    // Total deposits made in THIS month (apply NEXT month)
    const depositThisMonth = (deposits || []).reduce((sum, d) => {
      const depDate = new Date(d.date);
      if (depDate.getFullYear() === monthDate.getFullYear() && depDate.getMonth() === monthDate.getMonth()) {
        return sum + toNum(d.amount);
      }
      return sum;
    }, 0);

    // STEP 1: apply previous month deposit
    let intAdjusted = 0;
    let principalAdjusted = 0;

    if (carryDeposit > 0) {
      // adjust remaining balance first
      intAdjusted = Math.min(carryDeposit, remainingBalance);
      remainingBalance -= intAdjusted;

      const left = carryDeposit - intAdjusted;

      // leftover reduces BOTH principals equally
      if (left > 0) {
        principalAdjusted = left;
        principal234B = Math.max(principal234B - left, 0);
        principal234AF = Math.max(principal234AF - left, 0);
      }
    }

    // STEP 2: calculate interest on opening principals of this month
    const int234B = calculateAccToAge <= 60 ? onePercentFloor(principal234B) : 0;
    const int234AF = monthIndex >= 8 ? onePercentFloor(principal234AF) : 0; // Sep onwards

    remainingBalance += int234B + int234AF;

    // STEP 3: store this month deposit for next month
    carryDeposit = depositThisMonth;

    return {
      month: formatMonthLabel(monthDate),
      principal234B,
      principal234AF,
      int234B,
      int234AF,
      deposit: depositThisMonth,
      intAdjusted,
      remainingBalance,
      principalAdjusted,
    };
  });
};

/**
 * RN filtering logic for deposits:
 * - exclude March 31
 * - include only April onwards (month>=3)
 */
export const normalizeDepositsRN = (taxesPaid = []) => {
  return (taxesPaid || [])
    .filter((item) => {
      const d = new Date(item.depositDate);
      if (Number.isNaN(d.getTime())) return false;
      if (d.getMonth() === 2 && d.getDate() === 31) return false; // exclude Mar 31
      return d.getMonth() >= 3; // April onwards only
    })
    .map((item) => ({
      date: item.depositDate,
      amount: toNum(item.taxPaid),
    }));
};

// ---------- RN PORT: 234C table ----------
const calcInterest234C_RN = (shortfall, months) => Math.floor(toNum(shortfall) * 0.01 * toNum(months));

/**
 * Matches RN Interest234CTable.
 *
 * payments = b1/b2/b3/b4 already computed outside (StepEight does that)
 * required = round(totalTax * percent/100)
 * shortfall = floor((required-paid)/100)*100
 * interest = floor(shortfall*0.01*months) if age<=60 AND shortfall>1000 AND calculateOrNot
 */
export const calculate234CTableRN = ({
  calculateAccToAge,
  isCalculate, // {first, second, third, fourth}
  totalTax, // {first, second, third, fourth}  (already net of tds in RN caller)
  dataOfAdvanceTax, // {b1,b2,b3,b4}
}) => {
  const payments = {
    june: toNum(dataOfAdvanceTax?.b1 || 0),
    september: toNum(dataOfAdvanceTax?.b2 || 0),
    december: toNum(dataOfAdvanceTax?.b3 || 0),
    march: toNum(dataOfAdvanceTax?.b4 || 0),
  };

  const slabs = [
    { label: 'First (Up to June)', principle: toNum(totalTax?.first), percent: 15, months: 3, key: 'june', calculateOrNot: !!isCalculate?.first },
    { label: 'Second (Up to Sep)', principle: toNum(totalTax?.second), percent: 45, months: 3, key: 'september', calculateOrNot: !!isCalculate?.second },
    { label: 'Third (Up to Dec)', principle: toNum(totalTax?.third), percent: 75, months: 3, key: 'december', calculateOrNot: !!isCalculate?.third },
    { label: 'Fourth (Up to March)', principle: toNum(totalTax?.fourth), percent: 100, months: 1, key: 'march', calculateOrNot: !!isCalculate?.fourth },
  ];

  const rows = slabs.map((s, idx) => {
    const required = Math.round((s.principle * s.percent) / 100);

    const paidTillDate = payments[s.key];
    const shortfallRaw = Math.max(required - paidTillDate, 0);
    const shortfall = roundTo100(shortfallRaw);

    const interest = calculateAccToAge <= 60 && shortfall > 1000 && s.calculateOrNot ? calcInterest234C_RN(shortfall, s.months) : 0;

    return {
      sno: String(idx + 1),
      period: s.label,
      totalTaxDue: String(s.principle),
      percent: String(s.percent),
      required: String(required),
      paidTillDate: String(paidTillDate),
      shortfall: String(shortfall),
      months: String(s.months),
      interest: String(interest),
    };
  });

  const totalInterest = rows.reduce((sum, r) => sum + toNum(r.interest), 0);

  return { rows, totalInterest };
};

export function getMonthValue(dueDateStr) {
  if (!dueDateStr) return 11;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [yyyy, mm, dd] = String(dueDateStr).split('-').map(Number);
  const dueDate = new Date(yyyy, mm - 1, dd);
  dueDate.setHours(0, 0, 0, 0);

  const endOfYear = new Date(yyyy, 11, 31);
  endOfYear.setHours(0, 0, 0, 0);

  if (today > endOfYear) return 21;
  return today > dueDate ? 12 : 11;
}