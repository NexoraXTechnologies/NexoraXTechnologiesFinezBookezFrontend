// utils/dateFormatter.js

/**
 * Convert date to DD-MM-YYYY
 */
export const formatToDDMMYYYY = (input) => {
  if (!input) return '';

  let date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // Prevent timezone shift for YYYY-MM-DD
    date = input.includes('T') ? new Date(input) : new Date(`${input}T00:00:00`);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Convert date to YYYY-MM-DD (for input[type="date"])
 */
export const formatToYYYYMMDD = (input) => {
  if (!input) return '';

  let date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    date = input.includes('T') ? new Date(input) : new Date(`${input}T00:00:00`);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${yyyy}-${mm}-${dd}`;
};

export const formatToInputDate = (input) => {
  if (!input) return '';

  const date = new Date(input);
  if (isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

// ✅ Indian number format: 12,34,567
export const formatIndianNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const num = Number(value);
  if (Number.isNaN(num)) return '';

  return num.toLocaleString('en-IN');
};

export const indianInputToRaw = (value) => {
  // keep only digits (no commas, no dots)
  return String(value || '').replace(/[^\d]/g, '');
};

export const isNumericLike = (v) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  if (!s) return false;
  // allow digits with optional commas/decimal/minus
  return /^-?[\d,]+(\.\d+)?$/.test(s);
};

export const formatIndianNumberSmart = (v) => {
  if (!isNumericLike(v)) return v;

  const raw = String(v).replace(/,/g, '');
  // if decimal exists, keep it (Indian grouping still works)
  const num = Number(raw);
  if (Number.isNaN(num)) return v;

  // if original had decimals, preserve them
  if (raw.includes('.')) {
    const decimals = raw.split('.')[1]?.length ?? 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  return num.toLocaleString('en-IN');
};