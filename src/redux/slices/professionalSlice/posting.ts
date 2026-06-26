import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

export const getAllProductMasterSchema = createAsyncThunk(
    "productMaster/getAllProductMasterSchema",
    async (
        {
            offset = 0,
            limit = 20,
            isSearchable = "",
            isRequired = "",
            isFilterable = "",
        }: { offset?: number; limit?: number; isSearchable?: string; isRequired?: string; isFilterable?: string },
        { rejectWithValue }
    ) => {
        try {
            const params = {
                offset,
                limit,
                isSearchable,
                isRequired,
                isFilterable,
            };

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/getAll",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch account schema",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message || "Failed to fetch account schema",
            });
        }
    }
);

export const getProductByCode = createAsyncThunk(
    "productMaster/getProductByCode",
    async (productCode: string, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/productMaster/getProduct/${productCode}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch product",
                });

            return res.data?.data?.product ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch product",
            });
        }
    }
);

/* ===================================================
    UPDATE PRODUCT
=================================================== */
export const updateProduct = createAsyncThunk(
    "productMaster/updateProduct",
    async ({ productCode, data }: { productCode: string; data: any }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/productMaster/updateProduct/${productCode}`,
                data
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to update product",
                });

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to update product",
            });
        }
    }
);

/* ===================================================
    DELETE PRODUCT
=================================================== */
export const deleteProduct = createAsyncThunk(
    "productMaster/deleteProduct",
    async (productCode, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/productMaster/deleteProduct/${productCode}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete product",
                });

            return productCode;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to delete product",
            });
        }
    }
);

/* ===================================================
    SLICE
=================================================== */
const productMasterSlice = createSlice({
    name: "productMaster",
    initialState: {
        products: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        productMasterSchemaFields: [],
        schemaLoading: false,

        selectedProduct: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearProductMasterState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllProducts.fulfilled, (state, action) => {
                state.loading = false;

                const data = action.payload; // <-- { pagination, items }

                state.products = data?.items ?? [];
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getAllProducts.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.products = [];
            });

        /* ---------- GET BY PRODUCT CODE ---------- */
        builder
            .addCase(getProductByCode.pending, (state) => {
                state.loading = true;
            })
            .addCase(getProductByCode.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProduct = action.payload ?? null;
            })
            .addCase(getProductByCode.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
            });


        /* ----------  Form PRODUCT Master ---------- */
        builder
            .addCase(getAllProductMasterSchema.pending, (state) => {
                state.schemaLoading = true;
                state.error = null;
            })

            .addCase(getAllProductMasterSchema.fulfilled, (state, action) => {
                state.schemaLoading = false;
                state.productMasterSchemaFields = action.payload?.fields || [];
            })

            .addCase(getAllProductMasterSchema.rejected, (state, action: any) => {
                state.schemaLoading = false;
                state.error =
                    action.payload?.message || "Failed to fetch product schema";
            })

        /* ---------- CREATE PRODUCT ---------- */
        builder
            .addCase(createProduct.pending, (state) => {
                state.createLoading = true;
            })
            .addCase(createProduct.fulfilled, (state, action: any) => {
                state.createLoading = false;

                if (action.payload) {
                    // @ts-ignore
                    state.products.unshift(action.payload);
                    state.pagination.totalDocs += 1;
                }
            })
            .addCase(createProduct.rejected, (state, action: any) => {
                state.createLoading = false;
                state.error = action.payload?.message;
            });

        /* ---------- UPDATE PRODUCT ---------- */
        builder
            .addCase(updateProduct.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateProduct.fulfilled, (state: any, action) => {
                state.updateLoading = false;

                const updated = action.payload;
                if (!updated?.productCode) return;

                state.products = state.products.map((prod: any) =>
                    prod.productCode === updated.productCode ? updated : prod
                );
            })
            .addCase(updateProduct.rejected, (state, action: any) => {
                state.updateLoading = false;
                state.error = action.payload?.message;
            });

        /* ---------- DELETE PRODUCT ---------- */
        builder
            .addCase(deleteProduct.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const removedCode = action.payload;
                state.products = state.products.filter(
                    (prod: any) => prod.productCode !== removedCode
                );

                state.pagination.totalDocs = Math.max(0, state.pagination.totalDocs - 1);
            })
            .addCase(deleteProduct.rejected, (state, action: any) => {
                state.deleteLoading = false;
                state.error = action.payload?.message;
            });
    },
});

export default productMasterSlice.reducer;