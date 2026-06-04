/* ===================================================
    TYPES
=================================================== */

export type OptionType = {
    label: string;
    value: string;
    raw?: any;
};

export type ProductLine = {
    id: any;

    productCode: string;
    productName: string;
    productId: string;

    description: string;
    remarks: string;

    quantity: number | string;

    unit: string;
    unitName: string;

    rate: number | string;

    grossAmount: number | string;

    discountPercentage: number | string;
    discountAmount: number | string;

    taxableAmount: number | string;

    cgstPercentage: number | string;
    cgstAmount: number | string;

    sgstPercentage: number | string;
    sgstAmount: number | string;

    igstPercentage: number | string;
    igstAmount: number | string;

    taxAmount: number | string;

    otherAmount: number | string;

    netTotal: number | string;
};

export type ConfirmTooltipState = {
    show: boolean;
    x: number | null;
    y: number | null;
    voucherNumber: string | null;
};