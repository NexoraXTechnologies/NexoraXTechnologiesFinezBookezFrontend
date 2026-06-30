import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type PosState = {
    productLoader: boolean;
    customerLoader: boolean;
    createCustomerLoader: boolean;
    companyLoader: boolean;
    posPostingLoader: boolean;
    saveInvoiceLoader: boolean;
    getInvoiceLoader: boolean;
    updateInvoiceLoader: boolean;
    saveReceiptLoader: boolean;

    products: any[];
    productPagination: any;

    customers: any[];
    customerPagination: any;

    createdCustomer: any;
    companyData: any;
    posPostingData: any;

    savedInvoice: any;
    invoiceData: any;
    updatedInvoice: any;
    savedReceipt: any;

    error: string | null;
};

const initialState: PosState = {
    productLoader: false,
    customerLoader: false,
    createCustomerLoader: false,
    companyLoader: false,
    posPostingLoader: false,
    saveInvoiceLoader: false,
    getInvoiceLoader: false,
    updateInvoiceLoader: false,
    saveReceiptLoader: false,

    products: [],
    productPagination: {},

    customers: [],
    customerPagination: {},

    createdCustomer: null,
    companyData: null,
    posPostingData: null,

    savedInvoice: null,
    invoiceData: null,
    updatedInvoice: null,
    savedReceipt: null,

    error: null,
};

/* ===================================================
   COMMON ERROR HANDLER
=================================================== */

const getErrorMessage = (error: any, fallback: string) => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
};

/* ===================================================
   GET PRODUCTS
   API:
   /eTaxSolnMongoApiBackend/productMaster/getAllProduct
=================================================== */

export const getPosProducts = createAsyncThunk<
    any,
    {
        search?: string;
        productType?: string;
        offset?: number;
        limit?: number;
    } | void,
    { rejectValue: RejectValue }
>("pos/getProducts", async (params, { rejectWithValue }) => {
    try {
        const search = params?.search ?? "";
        const productType = params?.productType ?? "";
        const offset = params?.offset ?? 0;
        const limit = params?.limit ?? 200;

        const response = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/productMaster/getAllProduct?search=${encodeURIComponent(
                search
            )}&productType=${encodeURIComponent(
                productType
            )}&offset=${offset}&limit=${limit}`
        );

        return response.data;
    } catch (error: any) {
        return rejectWithValue({
            message: getErrorMessage(error, "Failed to load products"),
        });
    }
});

/* ===================================================
   GET CUSTOMERS
   API:
   /eTaxSolnMongoApiBackend/accountMaster/getAllAccounts
=================================================== */

export const getPosCustomers = createAsyncThunk<
    any,
    {
        search?: string;
        offset?: number;
        limit?: number;
        append?: boolean;
    } | void,
    { rejectValue: RejectValue }
>("pos/getCustomers", async (params, { rejectWithValue }) => {
    try {
        const search = params?.search ?? "";
        const offset = params?.offset ?? 0;
        const limit = params?.limit ?? 10;

        const response = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/accountMaster/getAllAccounts?search=${encodeURIComponent(
                search
            )}&accountType=customer&offset=${offset}&limit=${limit}`
        );

        return {
            ...response.data,
            append: Boolean(params?.append),
        };
    } catch (error: any) {
        return rejectWithValue({
            message: getErrorMessage(error, "Failed to load customers"),
        });
    }
});

/* ===================================================
   CREATE CUSTOMER
   API:
   /eTaxSolnMongoApiBackend/accountMaster/createAccount
=================================================== */

export const createPosCustomer = createAsyncThunk<
    any,
    { payload: any },
    { rejectValue: RejectValue }
>("pos/createCustomer", async ({ payload }, { rejectWithValue }) => {
    try {
        const response = await professionalAxios.post(
            "/eTaxSolnMongoApiBackend/accountMaster/createAccount",
            payload
        );

        return response.data;
    } catch (error: any) {
        return rejectWithValue({
            message: getErrorMessage(error, "Failed to create customer"),
        });
    }
});

/* ===================================================
   GET COMPANY
   API:
   /eTaxSolnMongoApiBackend/companyMaster/getCompany
=================================================== */

export const getPosCompany = createAsyncThunk<
    any,
    void,
    { rejectValue: RejectValue }
>("pos/getCompany", async (_, { rejectWithValue }) => {
    try {
        const response = await professionalAxios.get(
            "/eTaxSolnMongoApiBackend/companyMaster/getCompany"
        );

        return response.data;
    } catch (error: any) {
        return rejectWithValue({
            message: getErrorMessage(error, "Failed to load company details"),
        });
    }
});

/* ===================================================
   GET POS POSTING
   API:
   /users/bookez/posPosting/getAll
=================================================== */

export const getPosPosting = createAsyncThunk<any, void, { rejectValue: RejectValue }>("pos/getPosPosting", async (_, { rejectWithValue }) => {
    try {
        const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookez/posPosting/getAll");
        return response.data;
    } catch (error: any) {
        return rejectWithValue({
            message: getErrorMessage(error, "Failed to load POS posting"),
        });
    }
});

/* ===================================================
   SLICE
=================================================== */

const posSlice = createSlice({
    name: "pos",
    initialState,
    reducers: {
        clearPosError: (state) => {
            state.error = null;
        },

        clearPosData: (state) => {
            state.createdCustomer = null;
            state.companyData = null;
            state.posPostingData = null;
            state.savedInvoice = null;
            state.invoiceData = null;
            state.updatedInvoice = null;
            state.savedReceipt = null;
            state.error = null;
        },

        clearPosProducts: (state) => {
            state.products = [];
            state.productPagination = {};
        },

        clearPosCustomers: (state) => {
            state.customers = [];
            state.customerPagination = {};
        },
    },
    extraReducers: (builder) => {
        builder

            /* ===================================================
               PRODUCTS
            =================================================== */

            .addCase(getPosProducts.pending, (state) => {
                state.productLoader = true;
                state.error = null;
            })
            .addCase(getPosProducts.fulfilled, (state, action) => {
                state.productLoader = false;

                const root = action.payload?.data || action.payload || {};
                const items = Array.isArray(root?.items) ? root.items : [];

                state.products = items;
                state.productPagination = root?.pagination || {};
            })
            .addCase(getPosProducts.rejected, (state, action) => {
                state.productLoader = false;
                state.products = [];
                state.productPagination = {};
                state.error = action.payload?.message || "Failed to load products";
            })

            /* ===================================================
               CUSTOMERS
            =================================================== */

            .addCase(getPosCustomers.pending, (state) => {
                state.customerLoader = true;
                state.error = null;
            })
            .addCase(getPosCustomers.fulfilled, (state, action) => {
                state.customerLoader = false;

                const root = action.payload?.data || action.payload || {};
                const items = Array.isArray(root?.items) ? root.items : [];
                const append = Boolean(action.payload?.append);

                state.customers = append ? [...state.customers, ...items] : items;
                state.customerPagination = root?.pagination || {};
            })
            .addCase(getPosCustomers.rejected, (state, action) => {
                state.customerLoader = false;
                state.customers = [];
                state.customerPagination = {};
                state.error = action.payload?.message || "Failed to load customers";
            })

            /* ===================================================
               CREATE CUSTOMER
            =================================================== */

            .addCase(createPosCustomer.pending, (state) => {
                state.createCustomerLoader = true;
                state.error = null;
            })
            .addCase(createPosCustomer.fulfilled, (state, action) => {
                state.createCustomerLoader = false;

                const data = action.payload?.data || action.payload;
                state.createdCustomer =
                    data?.account || action.payload?.account || data || null;
            })
            .addCase(createPosCustomer.rejected, (state, action) => {
                state.createCustomerLoader = false;
                state.error = action.payload?.message || "Failed to create customer";
            })

            /* ===================================================
               COMPANY
            =================================================== */

            .addCase(getPosCompany.pending, (state) => {
                state.companyLoader = true;
                state.error = null;
            })
            .addCase(getPosCompany.fulfilled, (state, action) => {
                state.companyLoader = false;

                const data = action.payload?.data || action.payload;
                state.companyData = Array.isArray(data) ? data?.[0] : data;
            })
            .addCase(getPosCompany.rejected, (state, action) => {
                state.companyLoader = false;
                state.companyData = null;
                state.error =
                    action.payload?.message || "Failed to load company details";
            })

            /* ===================================================
               POS POSTING
            =================================================== */

            .addCase(getPosPosting.pending, (state) => {
                state.posPostingLoader = true;
                state.error = null;
            })
            .addCase(getPosPosting.fulfilled, (state, action) => {
                state.posPostingLoader = false;
                state.posPostingData = action.payload?.data || action.payload;
            })
            .addCase(getPosPosting.rejected, (state, action) => {
                state.posPostingLoader = false;
                state.posPostingData = null;
                state.error = action.payload?.message || "Failed to load POS posting";
            })
    },
});

export const {
    clearPosError,
    clearPosData,
    clearPosProducts,
    clearPosCustomers,
} = posSlice.actions;

export default posSlice.reducer;