import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";
import axiosInstance from "../../../services/axiosInstance";

type RegisterPayload = {
    accountCode?: string;
    productCode?: string;
    fromDate?: string;
    toDate?: string;
    exportType?: "pdf" | "excel" | "";
    offset?: number;
    limit?: number;

    customAuthToken?: string;
    number?: string;
};

/* ===================================================
   COMMON HELPERS
=================================================== */

const defaultPagination = {
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 10,
    offset: 0,
    hasNextPage: false,
    hasPrevPage: false,
};

const normalizePagination = (pagination: any) => {
    return {
        currentPage: pagination?.currentPage ?? 1,
        totalPages: pagination?.totalPages ?? 1,
        totalDocs: pagination?.totalDocs ?? 0,
        limit: pagination?.limit ?? 10,
        offset: pagination?.offset ?? 0,
        hasNextPage: pagination?.hasNextPage ?? false,
        hasPrevPage: pagination?.hasPrevPage ?? false,
    };
};

const getCustomHeaders = (customAuthToken?: string, number?: string) => {
    if (!customAuthToken || !number) return null;

    return {
        authtoken: customAuthToken,
        "x-db-name": number,
        loginuser: number,
    };
};

const makeRegisterPayload = ({
    accountCode = "",
    productCode = "",
    fromDate = "",
    toDate = "",
    exportType = "",
    offset = 0,
    limit = 10,
}: RegisterPayload = {}) => {
    const payload: any = {
        accountCode,
        productCode,
        offset,
        limit,
    };

    if (fromDate) payload.fromDate = fromDate;
    if (toDate) payload.toDate = toDate;
    if (exportType) payload.exportType = exportType;

    return payload;
};

const registerPostApi = async (
    url: string,
    payloadData: RegisterPayload | undefined,
    rejectWithValue: any,
    errorMessage: string
) => {
    try {
        const payload = makeRegisterPayload(payloadData);
        const isExport = Boolean(payloadData?.exportType);

        const customHeaders = getCustomHeaders(
            payloadData?.customAuthToken,
            payloadData?.number
        );

        const config: any = {};

        if (isExport) {
            config.responseType = "blob";
        }

        let res;

        if (customHeaders) {
            config.headers = customHeaders;
            res = await axiosInstance.post(url, payload, config);
        } else {
            res = await professionalAxios.post(url, payload, config);
        }

        if (isExport) {
            return {
                blob: res.data,
                exportType: payloadData?.exportType,
            };
        }

        const responseData = res.data;

        if (responseData?.success === false) {
            return rejectWithValue({
                message: responseData?.message || errorMessage,
            });
        }

        return responseData?.data || responseData || {};
    } catch (err: any) {
        return rejectWithValue({
            message:
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                errorMessage,
        });
    }
};

/* ===================================================
   QUOTATION REGISTER
=================================================== */

export const getQuotationRegister = createAsyncThunk(
    "allRegisters/getQuotationRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/quotationRegister",
            payload,
            rejectWithValue,
            "Failed to fetch quotation register"
        );
    }
);

/* ===================================================
   RECEIPT REGISTER
=================================================== */

export const getReceiptRegister = createAsyncThunk(
    "allRegisters/getReceiptRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/receiptRegister",
            payload,
            rejectWithValue,
            "Failed to fetch receipt register"
        );
    }
);

/* ===================================================
   SALES REGISTER
=================================================== */

export const getSalesRegister = createAsyncThunk(
    "allRegisters/getSalesRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesRegister",
            payload,
            rejectWithValue,
            "Failed to fetch sales register"
        );
    }
);

/* ===================================================
   PURCHASE REGISTER
=================================================== */

export const getPurchaseRegister = createAsyncThunk(
    "allRegisters/getPurchaseRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/purchaseRegister",
            payload,
            rejectWithValue,
            "Failed to fetch purchase register"
        );
    }
);

/* ===================================================
   PAYMENT REGISTER
=================================================== */

export const getPaymentRegister = createAsyncThunk(
    "allRegisters/getPaymentRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/paymentRegister",
            payload,
            rejectWithValue,
            "Failed to fetch payment register"
        );
    }
);

/* ===================================================
   SALES RETURN REGISTER
=================================================== */

export const getSalesReturnRegister = createAsyncThunk(
    "allRegisters/getSalesReturnRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookez/registers/salesReturnRegister",
            payload,
            rejectWithValue,
            "Failed to fetch sales return register"
        );
    }
);

/* ===================================================
   PURCHASE RETURN REGISTER
=================================================== */

export const getPurchaseReturnRegister = createAsyncThunk(
    "allRegisters/getPurchaseReturnRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookez/registers/purchaseReturnRegister",
            payload,
            rejectWithValue,
            "Failed to fetch purchase return register"
        );
    }
);

/* ===================================================
   OPENING BALANCE REGISTER
=================================================== */

export const getOpeningBalanceRegister = createAsyncThunk(
    "allRegisters/getOpeningBalanceRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookez/registers/openingBalance",
            payload,
            rejectWithValue,
            "Failed to fetch opening balance register"
        );
    }
);

/* ===================================================
   OPENING STOCK REGISTER
=================================================== */

export const getOpeningStockRegister = createAsyncThunk(
    "allRegisters/getOpeningStockRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookez/registers/openingStock",
            payload,
            rejectWithValue,
            "Failed to fetch opening stock register"
        );
    }
);

/* ===================================================
   SALES ORDER REGISTER
=================================================== */

export const getSalesOrderRegister = createAsyncThunk(
    "allRegisters/getSalesOrderRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesOrderRegister",
            payload,
            rejectWithValue,
            "Failed to fetch sales order register"
        );
    }
);

/* ===================================================
   PURCHASE ORDER REGISTER
=================================================== */

export const getPurchaseOrderRegister = createAsyncThunk(
    "allRegisters/getPurchaseOrderRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/purchaseOrderRegister",
            payload,
            rejectWithValue,
            "Failed to fetch purchase order register"
        );
    }
);

/* ===================================================
   GRN REGISTER
=================================================== */

export const getGrnRegister = createAsyncThunk(
    "allRegisters/getGrnRegister",
    async (payload: RegisterPayload = {}, { rejectWithValue }) => {
        return registerPostApi(
            "/eTaxSolnMongoApiBackend/users/bookEZ/registers/grnRegister",
            payload,
            rejectWithValue,
            "Failed to fetch GRN register"
        );
    }
);

/* ===================================================
   SLICE
=================================================== */

const allRegistersSlice = createSlice({
    name: "allRegisters",

    initialState: {
        quotationRegisterData: [],
        receiptRegisterData: [],
        salesRegisterData: [],
        purchaseRegisterData: [],
        paymentRegisterData: [],
        salesReturnRegisterData: [],
        purchaseReturnRegisterData: [],
        openingBalanceData: [],
        openingStockData: [],
        salesOrderRegisterData: [],
        purchaseOrderRegisterData: [],
        grnRegisterData: [],

        loading: false,
        quotationLoading: false,
        receiptLoading: false,
        salesLoading: false,
        purchaseLoading: false,
        paymentLoading: false,
        salesReturnLoading: false,
        purchaseReturnLoading: false,
        openingBalanceLoading: false,
        openingStockLoading: false,
        exportLoading: false,
        salesOrderLoading: false,
        purchaseOrderLoading: false,
        grnLoading: false,

        error: null,

        quotationPagination: defaultPagination,
        receiptPagination: defaultPagination,
        salesPagination: defaultPagination,
        purchasePagination: defaultPagination,
        paymentPagination: defaultPagination,
        salesReturnPagination: defaultPagination,
        purchaseReturnPagination: defaultPagination,
        openingBalancePagination: defaultPagination,
        openingStockPagination: defaultPagination,
        salesOrderPagination: defaultPagination,
        purchaseOrderPagination: defaultPagination,
        grnPagination: defaultPagination,
    },

    reducers: {
        clearAllRegistersState: (state: any) => {
            state.loading = false;
            state.quotationLoading = false;
            state.receiptLoading = false;
            state.salesLoading = false;
            state.purchaseLoading = false;
            state.paymentLoading = false;
            state.salesReturnLoading = false;
            state.purchaseReturnLoading = false;
            state.openingBalanceLoading = false;
            state.openingStockLoading = false;
            state.exportLoading = false;
            state.error = null;
            state.salesOrderLoading = false;
            state.purchaseOrderLoading = false;
            state.grnLoading = false;
        },

        clearAllRegistersData: (state: any) => {
            state.quotationRegisterData = [];
            state.receiptRegisterData = [];
            state.salesRegisterData = [];
            state.purchaseRegisterData = [];
            state.paymentRegisterData = [];
            state.salesReturnRegisterData = [];
            state.purchaseReturnRegisterData = [];
            state.openingBalanceData = [];
            state.openingStockData = [];
            state.salesOrderRegisterData = [];
            state.purchaseOrderRegisterData = [];
            state.grnRegisterData = [];

            state.salesOrderPagination = defaultPagination;
            state.purchaseOrderPagination = defaultPagination;
            state.grnPagination = defaultPagination;

            state.quotationPagination = defaultPagination;
            state.receiptPagination = defaultPagination;
            state.salesPagination = defaultPagination;
            state.purchasePagination = defaultPagination;
            state.paymentPagination = defaultPagination;
            state.salesReturnPagination = defaultPagination;
            state.purchaseReturnPagination = defaultPagination;
            state.openingBalancePagination = defaultPagination;
            state.openingStockPagination = defaultPagination;

        },
    },

    extraReducers: (builder) => {
        /* ================= QUOTATION REGISTER ================= */

        builder
            .addCase(getQuotationRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.quotationLoading = true;
                }
            })
            .addCase(getQuotationRegister.fulfilled, (state: any, action: any) => {
                state.quotationLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.quotationRegisterData =
                    action.payload?.quotations ||
                    action.payload?.quotation ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.quotationPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getQuotationRegister.rejected, (state: any, action: any) => {
                state.quotationLoading = false;
                state.exportLoading = false;
                state.quotationRegisterData = [];
                state.quotationPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch quotation register";
            });

        /* ================= RECEIPT REGISTER ================= */

        builder
            .addCase(getReceiptRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.receiptLoading = true;
                }
            })
            .addCase(getReceiptRegister.fulfilled, (state: any, action: any) => {
                state.receiptLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.receiptRegisterData =
                    action.payload?.receipts ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.receiptPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getReceiptRegister.rejected, (state: any, action: any) => {
                state.receiptLoading = false;
                state.exportLoading = false;
                state.receiptRegisterData = [];
                state.receiptPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch receipt register";
            });

        /* ================= SALES REGISTER ================= */

        builder
            .addCase(getSalesRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.salesLoading = true;
                }
            })
            .addCase(getSalesRegister.fulfilled, (state: any, action: any) => {
                state.salesLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.salesRegisterData =
                    action.payload?.invoices ||
                    action.payload?.sales ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.salesPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getSalesRegister.rejected, (state: any, action: any) => {
                state.salesLoading = false;
                state.exportLoading = false;
                state.salesRegisterData = [];
                state.salesPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch sales register";
            });

        /* ================= PURCHASE REGISTER ================= */

        builder
            .addCase(getPurchaseRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.purchaseLoading = true;
                }
            })
            .addCase(getPurchaseRegister.fulfilled, (state: any, action: any) => {
                state.purchaseLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.purchaseRegisterData =
                    action.payload?.invoices ||
                    action.payload?.purchases ||
                    action.payload?.purchaseInvoices ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.purchasePagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getPurchaseRegister.rejected, (state: any, action: any) => {
                state.purchaseLoading = false;
                state.exportLoading = false;
                state.purchaseRegisterData = [];
                state.purchasePagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch purchase register";
            });

        /* ================= PAYMENT REGISTER ================= */

        builder
            .addCase(getPaymentRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.paymentLoading = true;
                }
            })
            .addCase(getPaymentRegister.fulfilled, (state: any, action: any) => {
                state.paymentLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.paymentRegisterData =
                    action.payload?.payments ||
                    action.payload?.payment ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.paymentPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getPaymentRegister.rejected, (state: any, action: any) => {
                state.paymentLoading = false;
                state.exportLoading = false;
                state.paymentRegisterData = [];
                state.paymentPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch payment register";
            });

        /* ================= SALES RETURN REGISTER ================= */

        builder
            .addCase(getSalesReturnRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.salesReturnLoading = true;
                }
            })
            .addCase(
                getSalesReturnRegister.fulfilled,
                (state: any, action: any) => {
                    state.salesReturnLoading = false;
                    state.exportLoading = false;

                    if (action.payload?.blob) return;

                    state.salesReturnRegisterData =
                        action.payload?.salesReturns ||
                        action.payload?.returns ||
                        action.payload?.records ||
                        action.payload?.data ||
                        [];

                    state.salesReturnPagination = normalizePagination(
                        action.payload?.pagination
                    );
                }
            )
            .addCase(
                getSalesReturnRegister.rejected,
                (state: any, action: any) => {
                    state.salesReturnLoading = false;
                    state.exportLoading = false;
                    state.salesReturnRegisterData = [];
                    state.salesReturnPagination = defaultPagination;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch sales return register";
                }
            );

        /* ================= PURCHASE RETURN REGISTER ================= */

        builder
            .addCase(
                getPurchaseReturnRegister.pending,
                (state: any, action: any) => {
                    state.error = null;

                    if (action.meta.arg?.exportType) {
                        state.exportLoading = true;
                    } else {
                        state.purchaseReturnLoading = true;
                    }
                }
            )
            .addCase(
                getPurchaseReturnRegister.fulfilled,
                (state: any, action: any) => {
                    state.purchaseReturnLoading = false;
                    state.exportLoading = false;

                    if (action.payload?.blob) return;

                    state.purchaseReturnRegisterData =
                        action.payload?.purchaseReturns ||
                        action.payload?.returns ||
                        action.payload?.records ||
                        action.payload?.data ||
                        [];

                    state.purchaseReturnPagination = normalizePagination(
                        action.payload?.pagination
                    );
                }
            )
            .addCase(
                getPurchaseReturnRegister.rejected,
                (state: any, action: any) => {
                    state.purchaseReturnLoading = false;
                    state.exportLoading = false;
                    state.purchaseReturnRegisterData = [];
                    state.purchaseReturnPagination = defaultPagination;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch purchase return register";
                }
            );

        /* ================= OPENING BALANCE REGISTER ================= */

        builder
            .addCase(
                getOpeningBalanceRegister.pending,
                (state: any, action: any) => {
                    state.error = null;

                    if (action.meta.arg?.exportType) {
                        state.exportLoading = true;
                    } else {
                        state.openingBalanceLoading = true;
                    }
                }
            )
            .addCase(
                getOpeningBalanceRegister.fulfilled,
                (state: any, action: any) => {
                    state.openingBalanceLoading = false;
                    state.exportLoading = false;

                    if (action.payload?.blob) return;

                    state.openingBalanceData =
                        action.payload?.openingBalances ||
                        action.payload?.records ||
                        action.payload?.data ||
                        [];

                    state.openingBalancePagination = normalizePagination(
                        action.payload?.pagination
                    );
                }
            )
            .addCase(
                getOpeningBalanceRegister.rejected,
                (state: any, action: any) => {
                    state.openingBalanceLoading = false;
                    state.exportLoading = false;
                    state.openingBalanceData = [];
                    state.openingBalancePagination = defaultPagination;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch opening balance register";
                }
            );

        /* ================= OPENING STOCK REGISTER ================= */

        builder
            .addCase(
                getOpeningStockRegister.pending,
                (state: any, action: any) => {
                    state.error = null;

                    if (action.meta.arg?.exportType) {
                        state.exportLoading = true;
                    } else {
                        state.openingStockLoading = true;
                    }
                }
            )
            .addCase(
                getOpeningStockRegister.fulfilled,
                (state: any, action: any) => {
                    state.openingStockLoading = false;
                    state.exportLoading = false;

                    if (action.payload?.blob) return;

                    state.openingStockData =
                        action.payload?.openingStocks ||
                        action.payload?.records ||
                        action.payload?.data ||
                        [];

                    state.openingStockPagination = normalizePagination(
                        action.payload?.pagination
                    );
                }
            )
            .addCase(
                getOpeningStockRegister.rejected,
                (state: any, action: any) => {
                    state.openingStockLoading = false;
                    state.exportLoading = false;
                    state.openingStockData = [];
                    state.openingStockPagination = defaultPagination;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch opening stock register";
                }
        );

        /* ================= SALES ORDER REGISTER ================= */

        builder
            .addCase(getSalesOrderRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.salesOrderLoading = true;
                }
            })
            .addCase(getSalesOrderRegister.fulfilled, (state: any, action: any) => {
                state.salesOrderLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.salesOrderRegisterData =
                    action.payload?.orders ||
                    action.payload?.salesOrders ||
                    action.payload?.salesOrder ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.salesOrderPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getSalesOrderRegister.rejected, (state: any, action: any) => {
                state.salesOrderLoading = false;
                state.exportLoading = false;
                state.salesOrderRegisterData = [];
                state.salesOrderPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch sales order register";
            });

        /* ================= PURCHASE ORDER REGISTER ================= */

        builder
            .addCase(getPurchaseOrderRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.purchaseOrderLoading = true;
                }
            })
            .addCase(getPurchaseOrderRegister.fulfilled, (state: any, action: any) => {
                state.purchaseOrderLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.purchaseOrderRegisterData =
                    action.payload?.orders ||
                    action.payload?.purchaseOrders ||
                    action.payload?.purchaseOrder ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.purchaseOrderPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getPurchaseOrderRegister.rejected, (state: any, action: any) => {
                state.purchaseOrderLoading = false;
                state.exportLoading = false;
                state.purchaseOrderRegisterData = [];
                state.purchaseOrderPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch purchase order register";
            });

        /* ================= GRN REGISTER ================= */

        builder
            .addCase(getGrnRegister.pending, (state: any, action: any) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoading = true;
                } else {
                    state.grnLoading = true;
                }
            })
            .addCase(getGrnRegister.fulfilled, (state: any, action: any) => {
                state.grnLoading = false;
                state.exportLoading = false;

                if (action.payload?.blob) return;

                state.grnRegisterData =
                    action.payload?.grns ||
                    action.payload?.grn ||
                    action.payload?.records ||
                    action.payload?.data ||
                    [];

                state.grnPagination = normalizePagination(
                    action.payload?.pagination
                );
            })
            .addCase(getGrnRegister.rejected, (state: any, action: any) => {
                state.grnLoading = false;
                state.exportLoading = false;
                state.grnRegisterData = [];
                state.grnPagination = defaultPagination;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch GRN register";
            });
    },
});

export const {
    clearAllRegistersState,
    clearAllRegistersData,
} = allRegistersSlice.actions;

export default allRegistersSlice.reducer;