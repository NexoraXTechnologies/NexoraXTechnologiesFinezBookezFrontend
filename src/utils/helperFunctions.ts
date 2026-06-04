export const todayYMD = () => new Date().toISOString().split("T")[0];

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




export const fmtMoney = (value: any) => num(value).toFixed(2);

