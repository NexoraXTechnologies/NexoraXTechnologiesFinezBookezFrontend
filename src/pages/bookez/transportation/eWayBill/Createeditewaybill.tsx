import {
    ArrowLeft,
    FileText,
    MapPin,
    Package,
    Plus,
    Trash2,
    Truck,
    Wallet,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { FormSectionCard } from "../../../../components/SectionCards";
import { renderField } from "../../../../components/inputs";
import { generateEWayBill, getEWayBillAccessToken, multiVehicleUpdate, saveEWayBill } from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";


/* ===================================================
   OPTIONS
=================================================== */

const supplyTypeOptions = [
    { label: "Outward", value: "O" },
    { label: "Inward", value: "I" },
];

const subSupplyTypeOptions = [
    { label: "Supply", value: "1" },
    { label: "Export", value: "3" },
    { label: "Job Work", value: "4" },
    { label: "SKD/CKD", value: "5" },
    { label: "Recipient Not Known", value: "6" },
    { label: "Line Sales", value: "7" },
    { label: "Sales Return", value: "8" },
    { label: "Exhibition or Fairs", value: "9" },
    { label: "For Own Use", value: "10" },
    { label: "Others", value: "13" },
];

const docTypeOptions = [
    { label: "Tax Invoice", value: "INV" },
    { label: "Delivery Challan", value: "CHL" },
    { label: "Bill of Supply", value: "BIL" },
    { label: "Bill of Entry", value: "BOE" },
    { label: "Others", value: "OTH" },
];

const transactionTypeOptions = [
    { label: "Regular", value: 1 },
    { label: "Bill To - Ship To", value: 2 },
    { label: "Bill From - Dispatch From", value: 3 },
    { label: "Combination (Bill To/From + Ship/Dispatch)", value: 4 },
];

const transModeOptions = [
    { label: "Road", value: "1" },
    { label: "Rail", value: "2" },
    { label: "Air", value: "3" },
    { label: "Ship", value: "4" },
];

const vehicleTypeOptions = [
    { label: "Regular", value: "R" },
    { label: "Over Dimensional Cargo (ODC)", value: "O" },
];

const qtyUnitOptions = [
    { label: "NOS", value: "NOS" },
    { label: "KGS", value: "KGS" },
    { label: "LTR", value: "LTR" },
    { label: "MTR", value: "MTR" },
    { label: "BOX", value: "BOX" },
    { label: "BAG", value: "BAG" },
    { label: "BTL", value: "BTL" },
    { label: "CTN", value: "CTN" },
    { label: "DOZ", value: "DOZ" },
    { label: "PAC", value: "PAC" },
    { label: "SET", value: "SET" },
    { label: "TON", value: "TON" },
    { label: "OTH", value: "OTH" },
];

// GST vehicle-update reason codes (used by the VEHEWB action).
const reasonCodeOptions = [
    { label: "Due to Break Down", value: "1" },
    { label: "Due to Transhipment", value: "2" },
    { label: "Others", value: "3" },
    { label: "First Time (initial vehicle entry)", value: "4" },
];

// GST state codes (01–38 covers all states / UTs).
const stateCodeOptions = [
    { label: "01 - Jammu & Kashmir", value: "1" },
    { label: "02 - Himachal Pradesh", value: "2" },
    { label: "03 - Punjab", value: "3" },
    { label: "04 - Chandigarh", value: "4" },
    { label: "05 - Uttarakhand", value: "5" },
    { label: "06 - Haryana", value: "6" },
    { label: "07 - Delhi", value: "7" },
    { label: "08 - Rajasthan", value: "8" },
    { label: "09 - Uttar Pradesh", value: "9" },
    { label: "10 - Bihar", value: "10" },
    { label: "11 - Sikkim", value: "11" },
    { label: "12 - Arunachal Pradesh", value: "12" },
    { label: "13 - Nagaland", value: "13" },
    { label: "14 - Manipur", value: "14" },
    { label: "15 - Mizoram", value: "15" },
    { label: "16 - Tripura", value: "16" },
    { label: "17 - Meghalaya", value: "17" },
    { label: "18 - Assam", value: "18" },
    { label: "19 - West Bengal", value: "19" },
    { label: "20 - Jharkhand", value: "20" },
    { label: "21 - Odisha", value: "21" },
    { label: "22 - Chhattisgarh", value: "22" },
    { label: "23 - Madhya Pradesh", value: "23" },
    { label: "24 - Gujarat", value: "24" },
    { label: "26 - Dadra & Nagar Haveli and Daman & Diu", value: "26" },
    { label: "27 - Maharashtra", value: "27" },
    { label: "29 - Karnataka", value: "29" },
    { label: "30 - Goa", value: "30" },
    { label: "31 - Lakshadweep", value: "31" },
    { label: "32 - Kerala", value: "32" },
    { label: "33 - Tamil Nadu", value: "33" },
    { label: "34 - Puducherry", value: "34" },
    { label: "35 - Andaman & Nicobar Islands", value: "35" },
    { label: "36 - Telangana", value: "36" },
    { label: "37 - Andhra Pradesh", value: "37" },
    { label: "38 - Ladakh", value: "38" },
];

const REQUIRED_ITEM_KEYS = [
    "productName",
    "hsnCode",
    "quantity",
    "taxableAmount",
];

/* ===================================================
   HELPERS
=================================================== */

const cleanNumber = (value: any) => Number(value || 0);

const formatIndianNumber = (value: any) =>
    Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const todayDDMMYYYY = () => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const ddmmyyyyToInputDate = (value: any) => {
    if (!value || typeof value !== "string") return "";
    const [dd, mm, yyyy] = value.split("/");
    if (!dd || !mm || !yyyy) return "";
    return `${yyyy}-${mm}-${dd}`;
};

const inputDateToDDMMYYYY = (value: any) => {
    if (!value) return "";
    const [yyyy, mm, dd] = String(value).split("-");
    if (!dd || !mm || !yyyy) return "";
    return `${dd}/${mm}/${yyyy}`;
};

const makeItemId = () =>
    `itm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const createEmptyItem = () => ({
    id: makeItemId(),
    productName: "",
    productDesc: "",
    hsnCode: "",
    quantity: "",
    qtyUnit: "NOS",
    taxableAmount: "",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    cessRate: 0,
    cessNonadvol: 0,
});

/* ===================================================
   INITIAL FORM
=================================================== */

const createInitialEWayBillForm = () => ({
    supplyType: "O",
    subSupplyType: "1",
    subSupplyDesc: "",
    docType: "INV",
    docNo: "",
    docDate: todayDDMMYYYY(),

    fromGstin: "",
    fromTrdName: "",
    fromAddr1: "",
    fromAddr2: "",
    fromPlace: "",
    fromPincode: "",
    fromStateCode: "",

    toGstin: "",
    toTrdName: "",
    toAddr1: "",
    toAddr2: "",
    toPlace: "",
    toPincode: "",
    toStateCode: "",

    transactionType: 1,

    otherValue: "",

    transporterId: "",
    transporterName: "",
    transDocNo: "",
    transDocDate: "",
    transMode: "1",
    transDistance: "",

    vehicleNo: "",
    vehicleType: "R",

    itemList: [createEmptyItem()],
});

/**
 * Maps a saved record (as returned by getAllEWayBill / passed via
 * location.state.ewayBillData) back into display form shape, for the
 * read-only View/Edit screens.
 */
const mergeEWayBillRecordToForm = (record: any = {}) => {
    const base = createInitialEWayBillForm();
    const payload = record?.ewayPayload || {};

    return {
        ...base,
        ...payload,
        docDate: payload.docDate || base.docDate,
        itemList:
            Array.isArray(payload.itemList) && payload.itemList.length > 0
                ? payload.itemList.map((item: any) => ({
                      ...createEmptyItem(),
                      ...item,
                      id: makeItemId(),
                  }))
                : base.itemList,
    };
};

/**
 * The ONLY fields GST's vehicle-update (VEHEWB) action allows changing on
 * an already-generated e-way bill — mirrors the mobile app's editable
 * "Vehicle Details" + "Update Details" cards exactly.
 */
const createVehicleUpdateForm = (
    payload: any = {},
    record: any = {}
) => ({
    groupNo:
        record?.multiVehicleUpdatePayload?.groupNo ||
        record?.groupNo ||
        1,

    oldVehicleNo:
        record?.multiVehicleUpdatePayload?.oldvehicleNo ||
        record?.multiVehicleUpdatePayload?.oldVehicleNo ||
        payload?.vehicleNo ||
        "",

    newVehicleNo:
        record?.multiVehicleUpdatePayload?.newVehicleNo ||
        "",

    oldTranNo:
        record?.multiVehicleUpdatePayload?.oldTranNo ||
        payload?.transDocNo ||
        "",

    newTranNo:
        record?.multiVehicleUpdatePayload?.newTranNo ||
        "",

    fromPlace:
        record?.multiVehicleUpdatePayload?.fromPlace ||
        payload?.fromPlace ||
        "",

    fromState:
        String(
            record?.multiVehicleUpdatePayload?.fromState ||
            payload?.fromStateCode ||
            payload?.actFromStateCode ||
            ""
        ),

    reasonCode:
        String(
            record?.multiVehicleUpdatePayload?.reasonCode ||
            "1"
        ),

    reasonRem:
        record?.multiVehicleUpdatePayload?.reasonRem ||
        "Vehicle broke down",
});

/* ===================================================
   CREATE / EDIT / VIEW FORM
=================================================== */

const CreateEditEWayBill = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const { eWayBill: eWayBillList = [] } = useSelector(
        (state: any) => state.eWayBill || {}
    );

    const {
        accessTokenLoader = false,
        generateLoader = false,
        saveLoader = false,
        multiVehicleUpdateLoader = false,
    } = useSelector((state: any) => state.eWayBill || {});

    const mode = location.state?.mode || (params?.ewayBillNo ? "edit" : "add");

    const isAdd = mode === "add";
    const isEdit = mode === "edit";
    const isView = mode === "view";

    const ewayBillNo =
        location.state?.ewayBillNumber ||
        location.state?.ewayBillNo ||
        params?.ewayBillNo ||
        "";

    const [form, setForm] = useState<any>(createInitialEWayBillForm());
    const [vehicleUpdateForm, setVehicleUpdateForm] = useState<any>(
        createVehicleUpdateForm()
    );
    const [savedRecord, setSavedRecord] = useState<any>(null);

    const pageTitle = isView
        ? "View E-Way Bill"
        : isEdit
        ? "Update Vehicle Details"
        : "Create E-Way Bill";

    const pageDescription = isView
        ? "Generated E-Way Bill details (read-only)."
        : isEdit
        ? "Update the vehicle using the Multi Vehicle Update API."
        : "Fill in shipment details to generate a new E-Way Bill via GST.";

    const isBusy =
        accessTokenLoader ||
        generateLoader ||
        saveLoader ||
        multiVehicleUpdateLoader;

    /* ===================================================
       LOAD RECORD (EDIT / VIEW MODE)
    =================================================== */

    useEffect(() => {
        if (isAdd) return;

        const passedData = location.state?.ewayBillData;
        const record =
            passedData ||
            eWayBillList.find((item: any) => item?.ewayBillNo === ewayBillNo);

        if (!record) {
            toast.warn("E-Way Bill details not found. Open it from the list.");
            navigate(-1);
            return;
        }

        setSavedRecord(record);
        setForm(mergeEWayBillRecordToForm(record));
        setVehicleUpdateForm(
            createVehicleUpdateForm(
                record?.ewayPayload,
                record
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdd, ewayBillNo]);

    /* ===================================================
       COMPUTED TOTALS (ADD MODE ONLY)
    =================================================== */

    const totals = useMemo(() => {
        const items = form.itemList || [];

        const totalValue = items.reduce(
            (sum: number, item: any) => sum + cleanNumber(item.taxableAmount),
            0
        );

        const cgstValue = items.reduce(
            (sum: number, item: any) =>
                sum +
                (cleanNumber(item.taxableAmount) * cleanNumber(item.cgstRate)) / 100,
            0
        );

        const sgstValue = items.reduce(
            (sum: number, item: any) =>
                sum +
                (cleanNumber(item.taxableAmount) * cleanNumber(item.sgstRate)) / 100,
            0
        );

        const igstValue = items.reduce(
            (sum: number, item: any) =>
                sum +
                (cleanNumber(item.taxableAmount) * cleanNumber(item.igstRate)) / 100,
            0
        );

        const cessValue = items.reduce(
            (sum: number, item: any) =>
                sum +
                (cleanNumber(item.taxableAmount) * cleanNumber(item.cessRate)) / 100 +
                cleanNumber(item.cessNonadvol),
            0
        );

        const otherValue = cleanNumber(form.otherValue);

        const totInvValue =
            totalValue + cgstValue + sgstValue + igstValue + cessValue + otherValue;

        return { totalValue, cgstValue, sgstValue, igstValue, cessValue, totInvValue };
    }, [form.itemList, form.otherValue]);

    /* ===================================================
       FIELD HANDLERS (ADD MODE — full form)
    =================================================== */

    const updateField = (key: string, value: any) => {
        if (key === "docDate") {
            setForm((prev: any) => ({
                ...prev,
                docDate: inputDateToDDMMYYYY(value),
            }));
            return;
        }

        setForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";
        updateField(key, value);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? e ?? "";
        updateField(key, value);
    };

    const fieldForm: any = {
        supplyType: form.supplyType,
        subSupplyType: form.subSupplyType,
        subSupplyDesc: form.subSupplyDesc,
        docType: form.docType,
        docNo: form.docNo,
        docDate: ddmmyyyyToInputDate(form.docDate),

        fromGstin: form.fromGstin,
        fromTrdName: form.fromTrdName,
        fromAddr1: form.fromAddr1,
        fromAddr2: form.fromAddr2,
        fromPlace: form.fromPlace,
        fromPincode: form.fromPincode,
        fromStateCode: String(form.fromStateCode || ""),

        toGstin: form.toGstin,
        toTrdName: form.toTrdName,
        toAddr1: form.toAddr1,
        toAddr2: form.toAddr2,
        toPlace: form.toPlace,
        toPincode: form.toPincode,
        toStateCode: String(form.toStateCode || ""),

        transactionType: form.transactionType,
        otherValue: form.otherValue,

        transporterId: form.transporterId,
        transporterName: form.transporterName,
        transDocNo: form.transDocNo,
        transDocDate: form.transDocDate,
        transMode: form.transMode,
        transDistance: form.transDistance,

        vehicleNo: form.vehicleNo,
        vehicleType: form.vehicleType,
    };

    /* ===================================================
       VEHICLE UPDATE FIELD HANDLERS (EDIT MODE ONLY)
    =================================================== */

    const updateVehicleField = (key: string, value: any) => {
        setVehicleUpdateForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleVehicleInputChange = (key: string) => (e: any) => {
        updateVehicleField(key, e?.target?.value ?? "");
    };

    const handleVehicleSelectChange = (key: string) => (e: any) => {
        updateVehicleField(key, e?.target?.value ?? e ?? "");
    };

    /* ===================================================
       ITEM LIST HANDLERS (ADD MODE ONLY)
    =================================================== */

    const updateItem = (id: string, key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            itemList: (prev.itemList || []).map((item: any) =>
                item.id === id ? { ...item, [key]: value } : item
            ),
        }));
    };

    const addItem = () => {
        setForm((prev: any) => ({
            ...prev,
            itemList: [...(prev.itemList || []), createEmptyItem()],
        }));
    };

    const removeItem = (id: string) => {
        setForm((prev: any) => {
            const remaining = (prev.itemList || []).filter(
                (item: any) => item.id !== id
            );

            return {
                ...prev,
                itemList: remaining.length > 0 ? remaining : [createEmptyItem()],
            };
        });
    };

    /* ===================================================
       PAYLOAD BUILD + VALIDATION (ADD MODE)
    =================================================== */

    const buildGSTPayload = () => ({
        supplyType: form.supplyType,
        subSupplyType: form.subSupplyType,
        subSupplyDesc: form.subSupplyDesc || "",
        docType: form.docType,
        docNo: form.docNo,
        docDate: form.docDate,

        fromGstin: form.fromGstin,
        fromTrdName: form.fromTrdName,
        fromAddr1: form.fromAddr1,
        fromAddr2: form.fromAddr2,
        fromPlace: form.fromPlace,
        fromPincode: cleanNumber(form.fromPincode),
        actFromStateCode: cleanNumber(form.fromStateCode),
        fromStateCode: cleanNumber(form.fromStateCode),

        toGstin: form.toGstin,
        toTrdName: form.toTrdName,
        toAddr1: form.toAddr1,
        toAddr2: form.toAddr2,
        toPlace: form.toPlace,
        toPincode: cleanNumber(form.toPincode),
        actToStateCode: cleanNumber(form.toStateCode),
        toStateCode: cleanNumber(form.toStateCode),

        transactionType: cleanNumber(form.transactionType),

        totalValue: Number(totals.totalValue.toFixed(2)),
        otherValue: cleanNumber(form.otherValue),
        cgstValue: Number(totals.cgstValue.toFixed(2)),
        sgstValue: Number(totals.sgstValue.toFixed(2)),
        igstValue: Number(totals.igstValue.toFixed(2)),
        cessValue: Number(totals.cessValue.toFixed(2)),
        cessNonAdvolValue: 0,
        totInvValue: Number(totals.totInvValue.toFixed(2)),

        transporterId: form.transporterId || "",
        transporterName: form.transporterName || "",
        transDocNo: form.transDocNo || "",
        transDocDate: form.transDocDate || "",
        transMode: form.transMode,
        transDistance: String(form.transDistance || "0"),

        vehicleNo: form.vehicleNo,
        vehicleType: form.vehicleType,

        itemList: (form.itemList || []).map((item: any) => ({
            productName: item.productName,
            productDesc: item.productDesc || item.productName,
            hsnCode: cleanNumber(item.hsnCode),
            quantity: cleanNumber(item.quantity),
            qtyUnit: item.qtyUnit,
            taxableAmount: cleanNumber(item.taxableAmount),
            cgstRate: cleanNumber(item.cgstRate),
            sgstRate: cleanNumber(item.sgstRate),
            igstRate: cleanNumber(item.igstRate),
            cessRate: cleanNumber(item.cessRate),
            cessNonadvol: cleanNumber(item.cessNonadvol),
        })),
    });

    const validateForm = () => {
        if (!form.docNo?.trim()) {
            toast.warn("Invoice / Document No is required");
            return false;
        }

        if (!form.docDate) {
            toast.warn("Document date is required");
            return false;
        }

        if (!form.fromGstin?.trim() || !form.fromTrdName?.trim()) {
            toast.warn("Consignor GSTIN and trade name are required");
            return false;
        }

        if (!form.fromPlace?.trim() || !form.fromPincode || !form.fromStateCode) {
            toast.warn("Consignor place, pincode and state are required");
            return false;
        }

        if (!form.toGstin?.trim() || !form.toTrdName?.trim()) {
            toast.warn("Consignee GSTIN and trade name are required");
            return false;
        }

        if (!form.toPlace?.trim() || !form.toPincode || !form.toStateCode) {
            toast.warn("Consignee place, pincode and state are required");
            return false;
        }

        if (!form.vehicleNo?.trim()) {
            toast.warn("Vehicle number is required");
            return false;
        }

        if (!form.transDistance || cleanNumber(form.transDistance) <= 0) {
            toast.warn("Approximate distance (KM) is required");
            return false;
        }

        const items = form.itemList || [];

        if (items.length === 0) {
            toast.warn("Add at least one item");
            return false;
        }

        for (const item of items) {
            const missing = REQUIRED_ITEM_KEYS.some((key) => {
                const value = item[key];
                return value === "" || value === null || value === undefined;
            });

            if (missing) {
                toast.warn(
                    "Each item needs a product name, HSN code, quantity and taxable amount"
                );
                return false;
            }
        }

        return true;
    };

    const validateVehicleUpdateForm = () => {
        const groupNo = Number(
            vehicleUpdateForm.groupNo
        );

        const oldvehicleNo = String(
            vehicleUpdateForm.oldVehicleNo || ""
        ).trim();

        const newVehicleNo = String(
            vehicleUpdateForm.newVehicleNo || ""
        ).trim();

        const fromPlace = String(
            vehicleUpdateForm.fromPlace || ""
        ).trim();

        const fromState = Number(
            vehicleUpdateForm.fromState
        );

        const reasonCode = String(
            vehicleUpdateForm.reasonCode || ""
        ).trim();

        const reasonRem = String(
            vehicleUpdateForm.reasonRem || ""
        ).trim();

        if (!groupNo) {
            toast.warn(
                "Multi Vehicle group number is required"
            );
            return false;
        }

        if (!oldvehicleNo) {
            toast.warn(
                "Old vehicle number is required"
            );
            return false;
        }

        if (!newVehicleNo) {
            toast.warn(
                "New vehicle number is required"
            );
            return false;
        }

        if (
            oldvehicleNo.toUpperCase() ===
            newVehicleNo.toUpperCase()
        ) {
            toast.warn(
                "Old and new vehicle numbers cannot be the same"
            );
            return false;
        }

        if (!fromPlace) {
            toast.warn("From place is required");
            return false;
        }

        if (!fromState) {
            toast.warn(
                "From state code is required"
            );
            return false;
        }

        if (!reasonCode) {
            toast.warn(
                "Vehicle update reason is required"
            );
            return false;
        }

        if (!reasonRem) {
            toast.warn(
                "Vehicle update reason remark is required"
            );
            return false;
        }

        return true;
    };

    /* ===================================================
       GENERATE + SAVE (ADD MODE)
    =================================================== */

    const handleGenerate = async () => {
        if (!validateForm()) return;

        try {
            const gstPayload = buildGSTPayload();

            // Step 1 — access token
            const tokenResult = await dispatch(getEWayBillAccessToken()).unwrap();
            const authtoken = tokenResult?.authtoken;

            if (!authtoken) {
                toast.error("Could not obtain e-way bill access token");
                return;
            }

            // Step 2 — generate
            const genResponse = await dispatch(
                generateEWayBill({ payload: gstPayload, authtoken })
            ).unwrap();

            if (!genResponse?.ewayBillNo) {
                toast.error("E-Way Bill generation did not return a bill number");
                return;
            }

            // Step 3 — save internally, field names matching the list screen
            // (row.ewayPayload.*, row.rawResponse.*)
            await dispatch(
                saveEWayBill({
                    // @ts-ignore
                    ewayBillNo: genResponse.ewayBillNo,
                    voucherNumber: gstPayload.docNo,
                    authToken: authtoken,
                    ewayPayload: gstPayload,
                    rawResponse: genResponse,
                    createdAt: new Date().toISOString(),
                })
            ).unwrap();

            toast.success(`E-Way Bill ${genResponse.ewayBillNo} generated successfully`);
            navigate(-1);
        } catch (error: any) {
            // This screen is a deliberate, user-initiated action — failures
            // here SHOULD be shown, not swallowed (unlike the background
            // LR-triggered flow).
            if (error?.error_cd === "604") {
                toast.error(
                    "An E-Way Bill already exists for this document number. Use a different Invoice/Document No."
                );
                return;
            }

            toast.error(error?.message || "Failed to generate E-Way Bill");
        }
    };

    /* ===================================================
       UPDATE VEHICLE (EDIT MODE)
    =================================================== */

    const handleUpdateVehicle = async () => {
        if (!validateVehicleUpdateForm()) return;

        if (!savedRecord?.ewayBillNo) {
            toast.warn("E-Way Bill number not found");
            return;
        }

        try {
            // Step 1 — get a fresh GST E-Way Bill access token.
            const tokenResult = await dispatch(
                getEWayBillAccessToken()
            ).unwrap();

            const authtoken = String(
                tokenResult?.authtoken ||
                tokenResult?.data?.authtoken ||
                tokenResult?.data?.data?.authtoken ||
                ""
            ).trim();

            if (!authtoken) {
                toast.error(
                    "Could not obtain E-Way Bill access token"
                );
                return;
            }

            // Step 2 — send exact MULTIVEHUPD request body.
            const requestPayload = {
                ewbNo: Number(
                    savedRecord.ewayBillNo
                ),

                groupNo: Number(
                    vehicleUpdateForm.groupNo
                ),

                // External API requires exact key casing.
                oldvehicleNo: String(
                    vehicleUpdateForm.oldVehicleNo || ""
                )
                    .trim()
                    .toUpperCase(),

                newVehicleNo: String(
                    vehicleUpdateForm.newVehicleNo || ""
                )
                    .trim()
                    .toUpperCase(),

                oldTranNo: String(
                    vehicleUpdateForm.oldTranNo || ""
                ).trim(),

                newTranNo: String(
                    vehicleUpdateForm.newTranNo || ""
                ).trim(),

                fromPlace: String(
                    vehicleUpdateForm.fromPlace || ""
                ).trim(),

                fromState: Number(
                    vehicleUpdateForm.fromState
                ),

                reasonCode: String(
                    vehicleUpdateForm.reasonCode || ""
                ).trim(),

                reasonRem: String(
                    vehicleUpdateForm.reasonRem || ""
                ).trim(),
            };

            const result = await dispatch(
                multiVehicleUpdate({
                    authtoken,
                    payload: requestPayload,
                })
            ).unwrap();

            toast.success(
                result?.message ||
                result?.status_desc ||
                result?.statusDesc ||
                "E-Way Bill vehicle updated successfully."
            );

            navigate(-1);
        } catch (error: any) {
            const apiErrorMessage =
                error?.error?.error?.message ||
                error?.error?.message ||
                error?.response?.data?.error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.data?.error?.error?.message ||
                error?.data?.error?.message ||
                error?.data?.message ||
                error?.payload?.error?.error?.message ||
                error?.payload?.error?.message ||
                error?.payload?.message ||
                error?.message ||
                "Failed to update E-Way Bill vehicle";

            toast.error(apiErrorMessage);
        }
    };

    /* ===================================================
       FIELD CONFIGS (ADD MODE — always disabled outside add)
    =================================================== */

    const basicFields = [
        {
            key: "docType",
            label: "Document Type",
            type: "select",
            options: docTypeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
        {
            key: "docNo",
            label: "Invoice / Document No",
            type: "text",
            mandatory: true,
            placeholder: "e.g. INV-1024",
            disabled: !isAdd,
        },
        {
            key: "docDate",
            label: "Document Date",
            type: "date",
            mandatory: true,
            disabled: !isAdd,
        },
        {
            key: "supplyType",
            label: "Supply Type",
            type: "select",
            options: supplyTypeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
        {
            key: "subSupplyType",
            label: "Sub Supply Type",
            type: "select",
            options: subSupplyTypeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
        {
            key: "transactionType",
            label: "Transaction Type",
            type: "select",
            options: transactionTypeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
    ];

    const consignorFields = [
        {
            key: "fromGstin",
            label: "Consignor GSTIN",
            type: "text",
            mandatory: true,
            placeholder: "Enter GSTIN",
            disabled: !isAdd,
        },
        {
            key: "fromTrdName",
            label: "Consignor Trade Name",
            type: "text",
            mandatory: true,
            placeholder: "Enter trade name",
            disabled: !isAdd,
        },
        {
            key: "fromAddr1",
            label: "Address Line 1",
            type: "text",
            placeholder: "Enter address",
            disabled: !isAdd,
        },
        {
            key: "fromAddr2",
            label: "Address Line 2",
            type: "text",
            placeholder: "Enter address",
            disabled: !isAdd,
        },
        {
            key: "fromPlace",
            label: "Place",
            type: "text",
            mandatory: true,
            placeholder: "Enter place",
            disabled: !isAdd,
        },
        {
            key: "fromPincode",
            label: "Pincode",
            type: "number",
            mandatory: true,
            placeholder: "Enter pincode",
            disabled: !isAdd,
        },
        {
            key: "fromStateCode",
            label: "State",
            type: "select",
            options: stateCodeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
    ];

    const consigneeFields = [
        {
            key: "toGstin",
            label: "Consignee GSTIN",
            type: "text",
            mandatory: true,
            placeholder: "Enter GSTIN",
            disabled: !isAdd,
        },
        {
            key: "toTrdName",
            label: "Consignee Trade Name",
            type: "text",
            mandatory: true,
            placeholder: "Enter trade name",
            disabled: !isAdd,
        },
        {
            key: "toAddr1",
            label: "Address Line 1",
            type: "text",
            placeholder: "Enter address",
            disabled: !isAdd,
        },
        {
            key: "toAddr2",
            label: "Address Line 2",
            type: "text",
            placeholder: "Enter address",
            disabled: !isAdd,
        },
        {
            key: "toPlace",
            label: "Place",
            type: "text",
            mandatory: true,
            placeholder: "Enter place",
            disabled: !isAdd,
        },
        {
            key: "toPincode",
            label: "Pincode",
            type: "number",
            mandatory: true,
            placeholder: "Enter pincode",
            disabled: !isAdd,
        },
        {
            key: "toStateCode",
            label: "State",
            type: "select",
            options: stateCodeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
    ];

    // Read-only display of the ORIGINAL transport/vehicle details the bill
    // was generated with. Always disabled — the editable copy for Edit
    // mode lives in the separate "Update Vehicle Details" section below.
    const transportFields = [
        {
            key: "transporterId",
            label: "Transporter ID",
            type: "text",
            placeholder: "Enter transporter GSTIN/ID",
            disabled: !isAdd,
        },
        {
            key: "transporterName",
            label: "Transporter Name",
            type: "text",
            placeholder: "Enter transporter name",
            disabled: !isAdd,
        },
        {
            key: "transMode",
            label: "Mode of Transport",
            type: "select",
            options: transModeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
        {
            key: "transDistance",
            label: "Approx. Distance (KM)",
            type: "number",
            mandatory: true,
            placeholder: "Enter distance",
            disabled: !isAdd,
        },
        {
            key: "vehicleNo",
            label: "Vehicle Number",
            type: "text",
            mandatory: true,
            placeholder: "e.g. MH31AS9806",
            disabled: !isAdd,
        },
        {
            key: "vehicleType",
            label: "Vehicle Type",
            type: "select",
            options: vehicleTypeOptions,
            mandatory: true,
            disabled: !isAdd,
        },
    ];

    const otherValueFields = [
        {
            key: "otherValue",
            label: "Other Charges (₹)",
            type: "number",
            placeholder: "0",
            disabled: !isAdd,
        },
    ];

    /* ===================================================
       FIELD CONFIGS (EDIT MODE — vehicle update only)
    =================================================== */

    const vehicleUpdateFieldForm = {
        groupNo: vehicleUpdateForm.groupNo,
        oldVehicleNo:
            vehicleUpdateForm.oldVehicleNo,
        newVehicleNo:
            vehicleUpdateForm.newVehicleNo,
        oldTranNo:
            vehicleUpdateForm.oldTranNo,
        newTranNo:
            vehicleUpdateForm.newTranNo,
        fromPlace:
            vehicleUpdateForm.fromPlace,
        fromState:
            vehicleUpdateForm.fromState,
        reasonCode:
            vehicleUpdateForm.reasonCode,
        reasonRem:
            vehicleUpdateForm.reasonRem,
    };

    const vehicleUpdateFields = [
        {
            key: "groupNo",
            label: "Group Number",
            type: "number",
            mandatory: true,
            placeholder: "e.g. 1",
        },
        {
            key: "oldVehicleNo",
            label: "Old Vehicle Number",
            type: "text",
            mandatory: true,
            placeholder: "e.g. PQR1235",
        },
        {
            key: "newVehicleNo",
            label: "New Vehicle Number",
            type: "text",
            mandatory: true,
            placeholder: "e.g. PQR1234",
        },
        {
            key: "oldTranNo",
            label: "Old Transporter Number",
            type: "text",
            placeholder: "e.g. ABC123",
        },
        {
            key: "newTranNo",
            label: "New Transporter Number",
            type: "text",
            placeholder: "e.g. PQR123",
        },
        {
            key: "fromPlace",
            label: "From Place",
            type: "text",
            mandatory: true,
            placeholder: "e.g. Lucknow",
        },
        {
            key: "fromState",
            label: "From State",
            type: "select",
            options: stateCodeOptions,
            mandatory: true,
        },
        {
            key: "reasonCode",
            label: "Reason for Change",
            type: "select",
            options: reasonCodeOptions,
            mandatory: true,
        },
        {
            key: "reasonRem",
            label: "Reason Remark",
            type: "textarea",
            mandatory: true,
            placeholder: "e.g. Vehicle broke down",
            className: "md:col-span-2",
        },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) => (
            <Fragment key={field.key}>
                {renderField({
                    field,
                    form: fieldForm,
                    handleInputChange,
                    handleSelectChange,
                    updateField,
                })}
            </Fragment>
        ));

    const renderVehicleUpdateFields = (fields: any[]) =>
        fields.map((field: any) => (
            <Fragment key={field.key}>
                {renderField({
                    field,
                    form: vehicleUpdateFieldForm,
                    handleInputChange: handleVehicleInputChange,
                    handleSelectChange: handleVehicleSelectChange,
                    updateField: updateVehicleField,
                })}
            </Fragment>
        ));

    return (
        <div className="flex h-full w-full flex-col bg-card text-card-foreground shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            {pageTitle}
                        </h1>
                        <p className="text-sm text-muted-foreground">{pageDescription}</p>
                    </div>
                </div>

                {isBusy && (
                    <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {accessTokenLoader
                            ? "Getting access token..."
                            : generateLoader
                            ? "Generating..."
                            : multiVehicleUpdateLoader
                            ? "Updating vehicle..."
                            : "Saving..."}
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-auto p-2">
                <div className="space-y-4">
                    {!isAdd && savedRecord && (
                        <FormSectionCard
                            title="Generated E-Way Bill"
                            icon={<FileText size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border border-border bg-background p-3">
                                    <p className="text-xs font-bold text-muted-foreground">
                                        E-Way Bill No
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-card-foreground">
                                        {savedRecord?.ewayBillNo || "-"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border bg-background p-3">
                                    <p className="text-xs font-bold text-muted-foreground">
                                        E-Way Bill Date
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-card-foreground">
                                        {savedRecord?.rawResponse?.ewayBillDate || "-"}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border bg-background p-3">
                                    <p className="text-xs font-bold text-muted-foreground">
                                        Valid Upto
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-card-foreground">
                                        {savedRecord?.rawResponse?.validUpto || "-"}
                                    </p>
                                </div>
                            </div>
                        </FormSectionCard>
                    )}

                    {isEdit && (
                        <FormSectionCard
                            title="Update Vehicle Details"
                            icon={<Truck size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                                {renderVehicleUpdateFields(vehicleUpdateFields)}
                            </div>
                        </FormSectionCard>
                    )}

                    <FormSectionCard
                        title="1. Basic Information"
                        icon={<FileText size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
                            {renderFields(basicFields)}
                        </div>
                    </FormSectionCard>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <FormSectionCard
                            title="2. Consignor (From)"
                            icon={<MapPin size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                                {renderFields(consignorFields)}
                            </div>
                        </FormSectionCard>

                        <FormSectionCard
                            title="3. Consignee (To)"
                            icon={<MapPin size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                                {renderFields(consigneeFields)}
                            </div>
                        </FormSectionCard>
                    </div>

                    <FormSectionCard
                        title={isAdd ? "4. Transport & Vehicle" : "4. Transport & Vehicle (as generated)"}
                        icon={<Truck size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
                            {renderFields(transportFields)}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard title="5. Items" icon={<Package size={18} />}>
                        <div className="md:col-span-2 xl:col-span-4 w-full overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground">
                                        <th className="py-2 pr-2">Product</th>
                                        <th className="py-2 pr-2">HSN Code</th>
                                        <th className="py-2 pr-2">Qty</th>
                                        <th className="py-2 pr-2">Unit</th>
                                        <th className="py-2 pr-2">Taxable Amt (₹)</th>
                                        <th className="py-2 pr-2">CGST %</th>
                                        <th className="py-2 pr-2">SGST %</th>
                                        <th className="py-2 pr-2">IGST %</th>
                                        <th className="py-2 pr-2">Cess %</th>
                                        {isAdd && <th className="py-2 pr-2" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(form.itemList || []).map((item: any) => (
                                        <tr key={item.id} className="border-b border-border/60">
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="text"
                                                    value={item.productName}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "productName", e.target.value)
                                                    }
                                                    className="h-9 w-40 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                    placeholder="Product name"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="text"
                                                    value={item.hsnCode}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "hsnCode", e.target.value)
                                                    }
                                                    className="h-9 w-24 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                    placeholder="HSN"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "quantity", e.target.value)
                                                    }
                                                    className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <select
                                                    value={item.qtyUnit}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "qtyUnit", e.target.value)
                                                    }
                                                    className="h-9 w-24 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                >
                                                    {qtyUnitOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.taxableAmount}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "taxableAmount", e.target.value)
                                                    }
                                                    className="h-9 w-28 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.cgstRate}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "cgstRate", e.target.value)
                                                    }
                                                    className="h-9 w-16 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.sgstRate}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "sgstRate", e.target.value)
                                                    }
                                                    className="h-9 w-16 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.igstRate}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "igstRate", e.target.value)
                                                    }
                                                    className="h-9 w-16 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <input
                                                    type="number"
                                                    value={item.cessRate}
                                                    disabled={!isAdd}
                                                    onChange={(e) =>
                                                        updateItem(item.id, "cessRate", e.target.value)
                                                    }
                                                    className="h-9 w-16 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-60"
                                                />
                                            </td>
                                            {isAdd && (
                                                <td className="py-2 pr-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {isAdd && (
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="mt-3 flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                                >
                                    <Plus size={14} />
                                    Add Item
                                </button>
                            )}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="6. Charges & Totals"
                        icon={<Wallet size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
                            {renderFields(otherValueFields)}

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Taxable Value (₹)
                                </p>
                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {formatIndianNumber(totals.totalValue)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    CGST (₹)
                                </p>
                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {formatIndianNumber(totals.cgstValue)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    SGST (₹)
                                </p>
                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {formatIndianNumber(totals.sgstValue)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    IGST (₹)
                                </p>
                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {formatIndianNumber(totals.igstValue)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Cess (₹)
                                </p>
                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {formatIndianNumber(totals.cessValue)}
                                </p>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3">
                                <p className="text-xs font-bold text-primary">
                                    Total Invoice Value (₹)
                                </p>
                                <p className="text-lg font-bold text-primary">
                                    {formatIndianNumber(totals.totInvValue)}
                                </p>
                            </div>
                        </div>
                    </FormSectionCard>
                </div>
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={isBusy}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                >
                    {isAdd ? "Cancel" : "Close"}
                </button>

                {isView && (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/bookEz/transportation/e-way-bill/edit/${savedRecord?.ewayBillNo || ewayBillNo}`,
                                {
                                    state: {
                                        mode: "edit",
                                        ewayBillNo: savedRecord?.ewayBillNo || ewayBillNo,
                                        ewayBillData: savedRecord,
                                    },
                                }
                            )
                        }
                        className="rounded-md bg-amber-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
                    >
                        Edit Vehicle
                    </button>
                )}

                {isAdd && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isBusy}
                        className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isBusy ? "Please wait..." : "Generate E-Way Bill"}
                    </button>
                )}

                {isEdit && (
                    <button
                        type="button"
                        onClick={handleUpdateVehicle}
                        disabled={isBusy}
                        className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        {isBusy ? "Please wait..." : "Update Vehicle"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateEditEWayBill;