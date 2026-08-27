import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


type GSTAddress = {
    bnm: string;
    st: string;
    loc: string;
    bno: string;
    stcd: string;
    flno: string;
    lt: string;
    lg: string;
    dst: string;
    city: string;
    pncd: string;
};

type GSTPrincipalAddress = {
    addr: GSTAddress;
    ntr: string;
};

type GSTTaxpayerInfo = {
    adadr: any[];
    gstin: string;
    lgnm: string;
    stj: string;
    ctj: string;
    rgdt: string;
    ctb: string;
    dty: string;
    nba: string[];
    sts: string;
    cxdt: string;
    tradeNam: string;
    stjCd: string;
    ctjCd: string;
    pradr: GSTPrincipalAddress | null;
    frequencyType: string | null;
    lstupdt: string;
    errorMsg: string | null;
};

type GSTCompliance = {
    filingFrequency: string | null;
};

type GSTDetailsData = {
    taxpayerInfo: GSTTaxpayerInfo | null;
    filing: any[];
    compliance: GSTCompliance | null;
};

type GSTNumberDetailsState = {
    loader: boolean;
    data: GSTDetailsData | null;
    taxpayerInfo: GSTTaxpayerInfo | null;
    filing: any[];
    compliance: GSTCompliance | null;
    error: string | null;
};

type RejectValue = {
    message: string;
};

const initialState: GSTNumberDetailsState = {
    loader: false,
    data: null,
    taxpayerInfo: null,
    filing: [],
    compliance: null,
    error: null,
};

export const getGSTNumberDetails = createAsyncThunk<GSTDetailsData, string, { rejectValue: RejectValue }>(
    "gstNumberDetails/getGSTNumberDetails",
    async (gstNumber, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/gstNumberDetails/get/${gstNumber}`);
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to fetch GST details." });
        }
    }
);

const gstNumberDetailsSlice = createSlice({
    name: "gstNumberDetails",
    initialState,
    reducers: {
        clearGSTNumberDetails: state => {
            state.data = null;
            state.taxpayerInfo = null;
            state.filing = [];
            state.compliance = null;
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getGSTNumberDetails.pending, state => {
                state.loader = true;
                state.error = null;
            })
            .addCase(getGSTNumberDetails.fulfilled, (state, action) => {
                state.loader = false;
                state.data = action.payload;
                state.taxpayerInfo = action.payload?.taxpayerInfo || null;
                state.filing = action.payload?.filing || [];
                state.compliance = action.payload?.compliance || null;
                state.error = null;
            })
            .addCase(getGSTNumberDetails.rejected, (state, action) => {
                state.loader = false;
                state.error = action.payload?.message || "Failed to fetch GST details.";
            });
    },
});

export const { clearGSTNumberDetails } = gstNumberDetailsSlice.actions;
export default gstNumberDetailsSlice.reducer;