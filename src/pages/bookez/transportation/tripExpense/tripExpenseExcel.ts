/**
 * Trip Expense Excel export / import helpers for React Web + TypeScript.
 *
 * Parent downloads the current trip-expense list, edits the allowed columns
 * in Excel, and imports the file to update matching records by voucher number.
 */

import * as XLSX from "xlsx";

import {
  createEmptyAdvanceEntry,
  createEmptyBreakdownEntry,
  createEmptyDieselEntry,
  createEmptyFoodEntry,
  createEmptyOtherEntry,
  createEmptyRunningEntry,
  getTripExpenseVoucher,
  mergeTripExpenseForm,
  toTripExpensePayload,
} from "./tripExpenseInitialState";

export const TRIP_EXPENSE_EXCEL_HEADERS = [
  "Voucher Number",
  "Trip ID",
  "Vehicle",
  "Driver",
  "Trip Status",
  "Advance",
  "Diesel",
  "Food",
  "Running",
  "Breakdown",
  "Other Cost",
  "POD Status",
  "POD Receiver Name",
  "POD Remarks",
] as const;

type TripExpenseExcelHeader = (typeof TRIP_EXPENSE_EXCEL_HEADERS)[number];

type ExcelCellValue = string | number | boolean | Date | null | undefined;

type ExcelRow = Partial<Record<TripExpenseExcelHeader, ExcelCellValue>> &
  Record<string, ExcelCellValue>;

type ExpenseEntry = {
  amount?: number | string;
  date?: string;
  remarks?: string;
  [key: string]: any;
};

type ExpenseEntryFactory = () => ExpenseEntry;

export type DownloadTripExpenseExcelResult = {
  fileName: string;
  count: number;
};

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const sumEntryAmounts = (entries: ExpenseEntry[] = []): number =>
  entries.reduce((total, entry) => total + Number(entry?.amount || 0), 0);

const toNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeHeader = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const HEADER_ALIASES: Record<string, TripExpenseExcelHeader> = {
  vouchernumber: "Voucher Number",
  voucher: "Voucher Number",
  tripexpensenumber: "Voucher Number",
  tripexpensevouchernumber: "Voucher Number",

  tripid: "Trip ID",

  vehicle: "Vehicle",
  vehiclenumber: "Vehicle",

  driver: "Driver",
  drivername: "Driver",

  tripstatus: "Trip Status",
  status: "Trip Status",

  advance: "Advance",
  advancereceived: "Advance",

  diesel: "Diesel",
  dieselcost: "Diesel",

  food: "Food",
  foodcost: "Food",

  running: "Running",
  runningcost: "Running",

  breakdown: "Breakdown",
  breakdowncost: "Breakdown",

  othercost: "Other Cost",
  other: "Other Cost",

  podstatus: "POD Status",
  pod: "POD Status",

  podreceivername: "POD Receiver Name",
  receivername: "POD Receiver Name",

  podremarks: "POD Remarks",
  remarks: "POD Remarks",
};

/** Convert one trip-expense record into an Excel row. */
export const mapTripExpenseToExcelRow = (item: any): ExcelRow => {
  const expenses = item?.expenses || {};

  return {
    "Voucher Number": getTripExpenseVoucher(item),
    "Trip ID": item?.tripId || "",
    Vehicle: item?.vehicle?.vehicleNumber || "",
    Driver: item?.driver?.driverName || "",
    "Trip Status": item?.tripStatus || "",

    Advance:
      item?.summary?.totalAdvanceReceived ??
      expenses?.advanceReceived?.totalAdvance ??
      sumEntryAmounts(expenses?.advanceReceived?.entries),

    Diesel:
      expenses?.dieselCost?.totalDieselCost ??
      sumEntryAmounts(expenses?.dieselCost?.entries),

    Food:
      expenses?.foodCost?.totalFoodCost ??
      sumEntryAmounts(expenses?.foodCost?.entries),

    Running:
      expenses?.runningCost?.totalRunningCost ??
      sumEntryAmounts(expenses?.runningCost?.entries),

    Breakdown:
      expenses?.breakdownCost?.totalBreakdownCost ??
      sumEntryAmounts(expenses?.breakdownCost?.entries),

    "Other Cost":
      expenses?.otherCost?.totalOtherCost ??
      sumEntryAmounts(expenses?.otherCost?.entries),

    "POD Status": item?.pod?.deliveryStatus || "pending",
    "POD Receiver Name": item?.pod?.receiverName || "",
    "POD Remarks": item?.pod?.remarks || "",
  };
};

/** Build an Excel workbook from trip-expense records. */
export const buildTripExpenseWorkbook = (items: any[] = []): XLSX.WorkBook => {
  const safeItems = Array.isArray(items) ? items : [];
  const rows = safeItems.map(mapTripExpenseToExcelRow);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...TRIP_EXPENSE_EXCEL_HEADERS],
  });

  worksheet["!cols"] = TRIP_EXPENSE_EXCEL_HEADERS.map((header) => ({
    wch: Math.max(14, header.length + 2),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Trip Expenses");

  return workbook;
};

/**
 * Kept for backward compatibility with the React Native helper name.
 * It returns the workbook encoded as a base64 XLSX string.
 */
export const buildTripExpenseWorkbookBase64 = (items: any[] = []): string => {
  const workbook = buildTripExpenseWorkbook(items);

  return XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx",
  });
};

/** Download trip expenses as an XLSX file in the browser. */
export const downloadTripExpenseExcel = async (
  items: any[] = [],
): Promise<DownloadTripExpenseExcelResult> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No trip expenses to export");
  }

  const workbook = buildTripExpenseWorkbook(items);

  const excelBuffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  });

  const blob = new Blob([excelBuffer], {
    type: EXCEL_MIME_TYPE,
  });

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const fileName = `TripExpenses_${timestamp}.xlsx`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  try {
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return {
    fileName,
    count: items.length,
  };
};

const normalizeImportedRows = (rawRows: unknown[]): ExcelRow[] =>
  rawRows
    .map((rawRow) => {
      const row =
        rawRow && typeof rawRow === "object"
          ? (rawRow as Record<string, ExcelCellValue>)
          : {};

      return Object.entries(row).reduce<ExcelRow>(
        (normalized, [key, value]) => {
          const normalizedKey = normalizeHeader(key);
          const mappedKey = HEADER_ALIASES[normalizedKey] || key;

          normalized[mappedKey] = value;
          return normalized;
        },
        {},
      );
    })
    .filter((row) => Boolean(String(row["Voucher Number"] || "").trim()));

/** Parse an Excel file selected in the browser. */
export const parseTripExpenseExcelFile = async (
  file: File,
): Promise<ExcelRow[]> => {
  if (!file) {
    throw new Error("No file selected");
  }

  const fileName = String(file.name || "").toLowerCase();

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    throw new Error("Please select an Excel (.xlsx or .xls) file");
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The selected Excel file does not contain a worksheet");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error("Unable to read the first worksheet");
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, ExcelCellValue>>(
    worksheet,
    {
      defval: "",
      raw: false,
    },
  );

  return normalizeImportedRows(rawRows);
};

/** Open the browser file picker and parse one XLS/XLSX file. */
export const pickAndParseTripExpenseExcel = (): Promise<ExcelRow[]> =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    let settled = false;

    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.multiple = false;
    input.style.display = "none";

    const cleanup = () => {
      window.removeEventListener("focus", handleWindowFocus);
      input.remove();
    };

    const finishResolve = (rows: ExcelRow[]) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(rows);
    };

    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const handleWindowFocus = () => {
      // Browsers do not emit a standard cancel event for file pickers.
      // Wait briefly so the change event can run first when a file is chosen.
      window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          finishReject({
            code: "FILE_PICKER_CANCELED",
            message: "File selection cancelled",
          });
        }
      }, 300);
    };

    input.addEventListener("change", async () => {
      try {
        const file = input.files?.[0];

        if (!file) {
          finishReject({
            code: "FILE_PICKER_CANCELED",
            message: "File selection cancelled",
          });
          return;
        }

        const rows = await parseTripExpenseExcelFile(file);
        finishResolve(rows);
      } catch (error) {
        finishReject(error);
      }
    });

    document.body.appendChild(input);
    window.addEventListener("focus", handleWindowFocus);
    input.click();
  });

const setCategoryAmount = (
  existingEntries: ExpenseEntry[] | undefined,
  amount: number | null,
  factory: ExpenseEntryFactory,
  remarks: string,
): ExpenseEntry[] => {
  if (amount === null) {
    return existingEntries || [];
  }

  if (amount <= 0) {
    return [];
  }

  const firstEntry = existingEntries?.[0];

  return [
    {
      ...(factory?.() || {}),
      ...(firstEntry || {}),
      amount,
      date: firstEntry?.date || new Date().toISOString(),
      remarks: remarks || firstEntry?.remarks || "Updated from Excel",
    },
  ];
};

/** Apply one imported Excel row to an existing trip-expense record. */
export const applyExcelRowToTripExpenseForm = (
  existingForm: any,
  excelRow: ExcelRow = {},
): any => {
  const form = mergeTripExpenseForm(existingForm);
  const remark = "Updated from Excel";

  const advance = toNum(excelRow.Advance);
  const diesel = toNum(excelRow.Diesel);
  const food = toNum(excelRow.Food);
  const running = toNum(excelRow.Running);
  const breakdown = toNum(excelRow.Breakdown);
  const otherCost = toNum(excelRow["Other Cost"]);

  form.expenses = {
    ...form.expenses,

    advanceReceived: {
      ...form.expenses?.advanceReceived,
      entries: setCategoryAmount(
        form.expenses?.advanceReceived?.entries,
        advance,
        createEmptyAdvanceEntry,
        remark,
      ),
    },

    dieselCost: {
      ...form.expenses?.dieselCost,
      entries: setCategoryAmount(
        form.expenses?.dieselCost?.entries,
        diesel,
        createEmptyDieselEntry,
        remark,
      ),
    },

    foodCost: {
      ...form.expenses?.foodCost,
      entries: setCategoryAmount(
        form.expenses?.foodCost?.entries,
        food,
        createEmptyFoodEntry,
        remark,
      ),
    },

    runningCost: {
      ...form.expenses?.runningCost,
      entries: setCategoryAmount(
        form.expenses?.runningCost?.entries,
        running,
        createEmptyRunningEntry,
        remark,
      ),
    },

    breakdownCost: {
      ...form.expenses?.breakdownCost,
      entries: setCategoryAmount(
        form.expenses?.breakdownCost?.entries,
        breakdown,
        createEmptyBreakdownEntry,
        remark,
      ),
    },

    otherCost: {
      ...form.expenses?.otherCost,
      entries: setCategoryAmount(
        form.expenses?.otherCost?.entries,
        otherCost,
        createEmptyOtherEntry,
        remark,
      ),
    },
  };

  const podStatus = String(excelRow["POD Status"] || "")
    .trim()
    .toLowerCase();

  const receiverName = String(excelRow["POD Receiver Name"] || "").trim();

  const podRemarks = String(excelRow["POD Remarks"] || "").trim();

  form.pod = {
    ...form.pod,
    deliveryStatus: podStatus || form.pod?.deliveryStatus || "pending",
    receiverName: receiverName || form.pod?.receiverName || "",
    remarks: podRemarks || form.pod?.remarks || "",
  };

  return toTripExpensePayload(form, {
    enteredBy: "dispatcher",
  });
};

/** Browser equivalent of React Native DocumentPicker cancellation detection. */
export const isExcelPickerCancel = (error: any): boolean =>
  error?.code === "FILE_PICKER_CANCELED" ||
  error?.name === "AbortError" ||
  String(error?.message || "")
    .toLowerCase()
    .includes("cancel");