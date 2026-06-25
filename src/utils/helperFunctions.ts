import professionalAxios from "../services/professionalAxios";

export const todayYMD = () => new Date().toISOString().split("T")[0];

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
    if (Number.isNaN(date.getTime())) return value;

    return date.toISOString().split("T")[0];
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
            console.log({ field })
            if (!!field?.options?.length) {
                console.log({ options: field?.options })
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