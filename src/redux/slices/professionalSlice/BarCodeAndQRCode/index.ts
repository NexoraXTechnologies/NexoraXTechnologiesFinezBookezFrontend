import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
    TYPES
=================================================== */

export type CodeType = "barcode" | "qrcode";
export type BarcodeType = "CODE128" | "CODE39";
export type CodeSource = "auto" | "manual";
export type Orientation = "portrait" | "landscape";
export type Status = "active" | "inactive";

export type BarcodeValuePartType = "string" | "date" | "day" | "month" | "year" | "increment";
export type DateFormat = "DDMMYYYY" | "DD-MM-YYYY" | "YYYYMMDD";

export type BarcodeValuePart = {
    id?: string;
    type: BarcodeValuePartType;
    value?: string;
    dateFormat?: DateFormat;
    incrementLength?: number;
    incrementStart?: number;
};

export type TemplateFields = {
    productName: boolean;
    productCode: boolean;
    mrp: boolean;
    sellingPrice: boolean;
    hsnCode: boolean;
    uom: boolean;
    batchNumber: boolean;
    serialNumber: boolean;
    manufacturingDate: boolean;
    expiryDate: boolean;
    warehouse: boolean;
    location: boolean;
};

export type CreateBarcodeQrTemplatePayload = {
    templateName: string;
    codeType: CodeType;
    barcodeType?: BarcodeType | null;
    barcodeValueFormat: BarcodeValuePart[];
    separator: string;
    labelSize: string;
    width: number;
    height: number;
    unit: "mm";
    orientation: Orientation;
    fields: TemplateFields;
    status: Status;
};

export type BarcodeQrTemplate = CreateBarcodeQrTemplatePayload & {
    _id?: string;
    templateCode: string;
    createdAt?: string;
    updatedAt?: string;
};

export type BarcodeQrAssignmentPayload = {
    templateCode: string;
    productCode: string;
    codeType: CodeType;
    codeSource: CodeSource;
    barcodeType?: BarcodeType;
    codeValue?: string;
    sequenceNumber?: number;
    qrValue?: Record<string, any>;
    status: Status;
};

export type BarcodeQrAssignment = BarcodeQrAssignmentPayload & {
    _id?: string;
    assignmentCode?: string;
    templateName?: string;
    productName?: string;
    createdAt?: string;
    updatedAt?: string;
};

type Pagination = {
    offset: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

type BarcodeQrState = {
    templates: BarcodeQrTemplate[];
    templatePagination: Pagination;
    templateLoading: boolean;
    templateCreateLoading: boolean;

    assignments: BarcodeQrAssignment[];
    assignmentPagination: Pagination;
    assignmentLoading: boolean;
    assignmentCreateLoading: boolean;
    assignmentDeleteLoading: boolean;

    selectedBarcodeQrAssignment: BarcodeQrAssignment | null;
    codeValueLoading: boolean;

    error: string | null;
};

const defaultPagination: Pagination = {
    offset: 0,
    limit: 20,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

/* ===================================================
    SCREEN 1 - CREATE TEMPLATE
=================================================== */

export const createBarcodeQrTemplate = createAsyncThunk(
    "barcodeQr/createBarcodeQrTemplate",
    async (payload: CreateBarcodeQrTemplatePayload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/barCodeAndQrCode/create", payload);

            if (!res.data?.success) {
                return rejectWithValue(res.data || { message: "Failed to create Barcode / QR template" });
            }

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data || {
                    success: false,
                    message: "Failed to create Barcode / QR template",
                }
            );
        }
    }
);

/* ===================================================
    SCREEN 1 - GET ALL TEMPLATES
=================================================== */

export const getAllBarcodeQrTemplates = createAsyncThunk(
    "barcodeQr/getAllBarcodeQrTemplates",
    async (
        {
            offset = 0,
            limit = 20,
            search = "",
            status = "",
            codeType = "",
        }: {
            offset?: number;
            limit?: number;
            search?: string;
            status?: string;
            codeType?: string;
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = { offset, limit };

            if (search?.trim()) params.search = search.trim();
            if (status) params.status = status;
            if (codeType) params.codeType = codeType;

            const res = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/barCodeAndQrCode/getAll", { params });

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch Barcode / QR templates",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch Barcode / QR templates",
            });
        }
    }
);

/* ===================================================
    SCREEN 2 - CREATE ASSIGNMENT
=================================================== */

export const createBarcodeQrAssignment = createAsyncThunk(
    "barcodeQr/createBarcodeQrAssignment",
    async (payload: BarcodeQrAssignmentPayload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/barcodeQr/assignment/create", payload);

            if (!res.data?.success) {
                return rejectWithValue(res.data || { message: "Failed to assign Barcode / QR Code" });
            }

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data || {
                    success: false,
                    message: "Failed to assign Barcode / QR Code",
                }
            );
        }
    }
);

/* ===================================================
    SCREEN 2 - GET ALL ASSIGNMENTS
=================================================== */

export const getAllBarcodeQrAssignments = createAsyncThunk(
    "barcodeQr/getAllBarcodeQrAssignments",
    async (
        {
            offset = 0,
            limit = 20,
            search = "",
            status = "",
            codeType = "",
            productCode = "",
            templateCode = "",
        }: {
            offset?: number;
            limit?: number;
            search?: string;
            status?: string;
            codeType?: string;
            productCode?: string;
            templateCode?: string;
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = { offset, limit };

            if (search?.trim()) params.search = search.trim();
            if (status) params.status = status;
            if (codeType) params.codeType = codeType;
            if (productCode) params.productCode = productCode;
            if (templateCode) params.templateCode = templateCode;

            const res = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/barcodeQr/assignment/getAll", { params });

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch Barcode / QR assignments",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch Barcode / QR assignments",
            });
        }
    }
);

/* ===================================================
    GET ASSIGNMENT BY BARCODE VALUE
=================================================== */

export const getBarcodeQrAssignmentByCodeValue = createAsyncThunk(
    "barcodeQr/getBarcodeQrAssignmentByCodeValue",
    async (codeValue: string, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/barcodeQr/assignment/getByCodeValue/${encodeURIComponent(codeValue)}`
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Barcode not found",
                });
            }

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Barcode not found",
            });
        }
    }
);

/* ===================================================
    SCREEN 2 - DELETE ASSIGNMENT
=================================================== */

export const deleteBarcodeQrAssignment = createAsyncThunk(
    "barcodeQr/deleteBarcodeQrAssignment",
    async (templateCode: string, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/barcodeQr/assignment/delete/${templateCode}`
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete Barcode / QR assignment",
                });
            }

            return {
                templateCode,
                data: res.data?.data ?? null,
            };
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to delete Barcode / QR assignment",
            });
        }
    }
);

/* ===================================================
    SLICE
=================================================== */

const initialState: BarcodeQrState = {
    templates: [],
    templatePagination: { ...defaultPagination },
    templateLoading: false,
    templateCreateLoading: false,

    assignments: [],
    assignmentPagination: { ...defaultPagination },
    assignmentLoading: false,
    assignmentCreateLoading: false,
    assignmentDeleteLoading: false,

    selectedBarcodeQrAssignment: null,
    codeValueLoading: false,

    error: null,
};

const barcodeQrSlice = createSlice({
    name: "barcodeQr",
    initialState,

    reducers: {
        clearBarcodeQrState: (state) => {
            state.error = null;
            state.templateCreateLoading = false;
            state.assignmentCreateLoading = false;
            state.assignmentDeleteLoading = false;
            state.codeValueLoading = false;
        },

        clearBarcodeQrTemplates: (state) => {
            state.templates = [];
            state.templatePagination = { ...defaultPagination };
        },

        clearBarcodeQrAssignments: (state) => {
            state.assignments = [];
            state.assignmentPagination = { ...defaultPagination };
        },

        clearSelectedBarcodeQrAssignment: (state) => {
            state.selectedBarcodeQrAssignment = null;
            state.codeValueLoading = false;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        /* ---------- CREATE TEMPLATE ---------- */
        builder
            .addCase(createBarcodeQrTemplate.pending, (state) => {
                state.templateCreateLoading = true;
                state.error = null;
            })
            .addCase(createBarcodeQrTemplate.fulfilled, (state, action: any) => {
                state.templateCreateLoading = false;

                if (action.payload) {
                    state.templates.unshift(action.payload);
                    state.templatePagination.totalDocs += 1;
                }
            })
            .addCase(createBarcodeQrTemplate.rejected, (state, action: any) => {
                state.templateCreateLoading = false;
                state.error = action.payload?.message || "Failed to create Barcode / QR template";
            });

        /* ---------- GET ALL TEMPLATES ---------- */
        builder
            .addCase(getAllBarcodeQrTemplates.pending, (state) => {
                state.templateLoading = true;
                state.error = null;
            })
            .addCase(getAllBarcodeQrTemplates.fulfilled, (state, action: any) => {
                state.templateLoading = false;

                const data = action.payload;
                state.templates = data?.items ?? data?.records ?? [];
                state.templatePagination = data?.pagination ?? state.templatePagination;
            })
            .addCase(getAllBarcodeQrTemplates.rejected, (state, action: any) => {
                state.templateLoading = false;
                state.error = action.payload?.message || "Failed to fetch Barcode / QR templates";
                state.templates = [];
            });

        /* ---------- CREATE ASSIGNMENT ---------- */
        builder
            .addCase(createBarcodeQrAssignment.pending, (state) => {
                state.assignmentCreateLoading = true;
                state.error = null;
            })
            .addCase(createBarcodeQrAssignment.fulfilled, (state, action: any) => {
                state.assignmentCreateLoading = false;

                if (action.payload) {
                    state.assignments.unshift(action.payload);
                    state.assignmentPagination.totalDocs += 1;
                }
            })
            .addCase(createBarcodeQrAssignment.rejected, (state, action: any) => {
                state.assignmentCreateLoading = false;
                state.error = action.payload?.message || "Failed to assign Barcode / QR Code";
            });

        /* ---------- GET ALL ASSIGNMENTS ---------- */
        builder
            .addCase(getAllBarcodeQrAssignments.pending, (state) => {
                state.assignmentLoading = true;
                state.error = null;
            })
            .addCase(getAllBarcodeQrAssignments.fulfilled, (state, action: any) => {
                state.assignmentLoading = false;

                const data = action.payload;
                state.assignments = data?.items ?? data?.records ?? [];
                state.assignmentPagination = data?.pagination ?? state.assignmentPagination;
            })
            .addCase(getAllBarcodeQrAssignments.rejected, (state, action: any) => {
                state.assignmentLoading = false;
                state.error = action.payload?.message || "Failed to fetch Barcode / QR assignments";
                state.assignments = [];
            });

        /* ---------- GET ASSIGNMENT BY BARCODE VALUE ---------- */
        builder
            .addCase(getBarcodeQrAssignmentByCodeValue.pending, (state) => {
                state.codeValueLoading = true;
                state.selectedBarcodeQrAssignment = null;
                state.error = null;
            })
            .addCase(getBarcodeQrAssignmentByCodeValue.fulfilled, (state, action: any) => {
                state.codeValueLoading = false;
                state.selectedBarcodeQrAssignment = action.payload ?? null;
            })
            .addCase(getBarcodeQrAssignmentByCodeValue.rejected, (state, action: any) => {
                state.codeValueLoading = false;
                state.selectedBarcodeQrAssignment = null;
                state.error = action.payload?.message || "Barcode not found";
            });

        /* ---------- DELETE ASSIGNMENT ---------- */
        builder
            .addCase(deleteBarcodeQrAssignment.pending, (state) => {
                state.assignmentDeleteLoading = true;
                state.error = null;
            })
            .addCase(deleteBarcodeQrAssignment.fulfilled, (state, action: any) => {
                state.assignmentDeleteLoading = false;

                const templateCode = action.payload?.templateCode;

                state.assignments = state.assignments.filter(
                    (assignment) => assignment.templateCode !== templateCode
                );

                state.assignmentPagination.totalDocs = Math.max(
                    0,
                    state.assignmentPagination.totalDocs - 1
                );
            })
            .addCase(deleteBarcodeQrAssignment.rejected, (state, action: any) => {
                state.assignmentDeleteLoading = false;
                state.error = action.payload?.message || "Failed to delete Barcode / QR assignment";
            });
    },
});

export const {
    clearBarcodeQrState,
    clearBarcodeQrTemplates,
    clearBarcodeQrAssignments,
    clearSelectedBarcodeQrAssignment,
} = barcodeQrSlice.actions;

export default barcodeQrSlice.reducer;