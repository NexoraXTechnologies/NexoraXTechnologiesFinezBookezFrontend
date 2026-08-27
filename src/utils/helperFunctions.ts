import professionalAxios from "../services/professionalAxios";

// export const todayYMD = () => new Date().toISOString().split("T")[0];

export const todayYMD = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
};

export const isTrueValue = (value: any) =>
    value === true ||
    String(value ?? "").trim().toLowerCase() === "true";


export const getFirstDateOfCurrentMonth = () => {
    const date = new Date();
    date.setDate(1);

    return date.toISOString().split("T")[0];
};

export const num = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export const money = (value: any) => `₹${num(value).toFixed(2)}`;

export const safePercent = (value: any) => {
    const n = num(value);
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
};

export const formatDateForInput = (value: any) => {
    if (!value) return todayYMD();

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
};


export const formatDateTimeForInput = (value: any) => {
    if (!value) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 16);
    }

    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
};

export const formatDateForList = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getRecords = (res: any) => {
    return Array.isArray(res?.items) ? res.items : Array.isArray(res?.records) ? res.records : Array.isArray(res?.docs) ? res.docs : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.data?.records) ? res.data.records : Array.isArray(res?.data?.docs) ? res.data.docs : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

const loadFieldOptions = async (fields: any[], param: Record<string, any> = {}) => {
    const updatedFields = await Promise.all(
        (fields || []).map(async (field) => {
            if (!!field?.options?.length) {
                const options = Array.isArray(field?.options) ? field?.options.map((item: any) => ({ label: item || "", value: item || "", raw: item })) : [];
                return { ...field, options };
            }
            if (!field?.api) return field;
            try {
                const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend${field.api}`, { params: { ...(field.queryParams || {}), ...param, } });
                const records = getRecords(res.data);
                const options = Array.isArray(records) ? records.map((item: any) => ({ label: item?.[field.labelField] || "", value: item?.[field.valueField] || "", raw: item })) : [];
                return { ...field, options };
            } catch (error) {
                console.log(`Failed to load options for ${field.key}`, error);
                return { ...field, options: [] };
            }
        })
    );
    return updatedFields;
};

export const loadAllTemplateOptions = async (templateData: any, param: any = {}) => {
    const [updatedHeader, updatedBody, updatedFooter] = await Promise.all([loadFieldOptions(templateData?.header || [], param?.header), loadFieldOptions(templateData?.body || [], param?.body), loadFieldOptions(templateData?.footer || [], param?.footer)]);
    return { ...templateData, header: updatedHeader, body: updatedBody, footer: updatedFooter };
};


export const formatMoney = (value: any) => {
    const num = Number(value || 0);

    const formatted = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Math.abs(num));

    return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
};
export const fmtMoney = (value: any) => num(value).toFixed(2);


export const formatDateWithCurrentTime = (dateValue: string) => {
    if (!dateValue) return "";

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${dateValue}T${hours}:${minutes}:${seconds}Z`;
};

export const formatProductType = (value: any) => {
    if (!value) return "-";

    const text = String(value)
        // camelCase / PascalCase handle
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        // snake_case / kebab-case handle
        .replace(/[_-]+/g, " ")
        .trim();

    // ✅ Special known words
    const map: Record<string, string> = {
        rawmaterial: "Raw Material",
        finishedgoods: "Finished Goods",
        semifinished: "Semi Finished",
        tradinggoods: "Trading Goods",
    };

    const normalized = text.replace(/\s+/g, "").toLowerCase();

    if (map[normalized]) return map[normalized];

    // ✅ Normal title case fallback
    return text
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

export const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;
    return {
        fromDate: new Date(Date.UTC(financialYear, 3, 1, 0, 0, 0, 0)).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

export const formatIndianNumber = (value: any) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

export const formatDateTime = (value: any) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatStatusLabel = (status: any) =>
    String(status || "draft")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const unwrapThunk = async (dispatch: any, action: any) => {
    const res = await dispatch(action);

    if (res?.unwrap) return res.unwrap();
    if (res?.error) throw res.error;

    return res?.payload ?? res;
};


export const truncate = (text: string = "", maxLength = 18) =>
    text.length > maxLength
        ? `${text.slice(0, maxLength)}..`
        : text;


export const toLocalStartOfDayUtc = (dateValue: string): string => {
    if (!dateValue) return "";

    const [year, month, day] = dateValue
        .slice(0, 10)
        .split("-")
        .map(Number);

    return new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0,
    ).toISOString();
};

export const toLocalEndOfDayUtc = (dateValue: string): string => {
    if (!dateValue) return "";

    const [year, month, day] = dateValue
        .slice(0, 10)
        .split("-")
        .map(Number);

    return new Date(
        year,
        month - 1,
        day,
        23,
        59,
        59,
        999,
    ).toISOString();
};

// export const toDateInputValue = (dateValue: string): string => {
//     if (!dateValue) return "";

//     const date = new Date(dateValue);

//     if (Number.isNaN(date.getTime())) {
//         return "";
//     }

//     const year = date.getFullYear();
//     const month = String(
//         date.getMonth() + 1,
//     ).padStart(2, "0");
//     const day = String(
//         date.getDate(),
//     ).padStart(2, "0");

//     return `${year}-${month}-${day}`;
// };



export const toDateInputValue = (dateValue: string): string => {
    if (!dateValue) return "";

    // Backend already returned YYYY-MM-DD
    const dateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) return dateValue;

    // Backend returned ISO/date-time format
    const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};
