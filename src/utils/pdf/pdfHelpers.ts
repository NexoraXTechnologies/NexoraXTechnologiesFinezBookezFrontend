
export function ToWords(value: any): string {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine",
    ];

    const teens = [
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    const num = Math.floor(Number(value || 0));

    if (!Number.isFinite(num)) return "";
    if (num === 0) return "Zero";

    function convertBelowThousand(n: number): string {
        let word = "";

        if (n >= 100) {
            word += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }

        if (n >= 20) {
            word += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        } else if (n >= 10) {
            word += teens[n - 10] + " ";
            n = 0;
        }

        if (n > 0) {
            word += ones[n] + " ";
        }

        return word.trim();
    }

    let result = "";
    let n = num;

    const crore = Math.floor(n / 10000000);
    if (crore > 0) {
        result += convertBelowThousand(crore) + " Crore ";
        n %= 10000000;
    }

    const lakh = Math.floor(n / 100000);
    if (lakh > 0) {
        result += convertBelowThousand(lakh) + " Lakh ";
        n %= 100000;
    }

    const thousand = Math.floor(n / 1000);
    if (thousand > 0) {
        result += convertBelowThousand(thousand) + " Thousand ";
        n %= 1000;
    }

    if (n > 0) {
        result += convertBelowThousand(n);
    }

    return result.trim();
}

export function AmountToWords(amount: any): string {
    const value = Number(amount || 0);

    if (!Number.isFinite(value)) return "";

    const rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);

    let words = `${ToWords(rupees)} Rupees`;

    if (paise > 0) {
        words += ` and ${ToWords(paise)} Paise`;
    }

    return `${words} Only`;
}

export const toNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
};

export const escapeHtml = (s: any) =>
    String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

export const titleCase = (s: any) =>
    String(s ?? "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const pick = (obj: any, keys: any = []) => {
    for (const k of keys) {
        const v = obj?.[k];

        if (v !== undefined && v !== null && v !== "") {
            return v;
        }
    }

    return undefined;
};

export const formatFooterLabel = (key: any) =>
    titleCase(String(key).replace(/_/g, " "));
