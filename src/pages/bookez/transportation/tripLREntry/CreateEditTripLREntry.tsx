import {
    ArrowLeft,
    Calendar,
    Clock,
    CreditCard,
    Edit3,
    FileText,
    MapPin,
    Navigation,
    Package,
    Paperclip,
    Upload,
    Users,
    X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { FormSectionCard } from "../../../../components/SectionCards";
import { DocumentUploadInput, renderField } from "../../../../components/inputs";

import {
    createLRCollection,
    getAllLRCollection,
    getTripLRCollectionByVoucherNumber,
    updateTripLRCollection,
} from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";

import { getTransportOrders } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import { getAllTripAllocation } from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";

/* ===================================================
   OPTIONS
=================================================== */

const paymentTypeOptions = [
    { label: "To Pay", value: "To Pay" },
    { label: "Paid", value: "Paid" },
    { label: "To Be Billed", value: "To Be Billed" },
];

const quantityUnitOptions = [
    { label: "Nos", value: "Nos" },
    { label: "Pcs", value: "Pcs" },
    { label: "Bags", value: "Bags" },
    { label: "Boxes", value: "Boxes" },
    { label: "Pallet", value: "Pallet" },
];

const weightUnitOptions = [
    { label: "Ton", value: "Ton" },
    { label: "Kg", value: "Kg" },
];

const tripStatusOptions = [
    { label: "In Transit", value: "in_transit" },
    { label: "Draft", value: "draft" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
];

const documentTypeOptions = [
    { label: "Invoice", value: "Invoice" },
    { label: "E-Way Bill", value: "E-Way Bill" },
    { label: "Challan", value: "Challan" },
    { label: "Other", value: "Other" },
];

const REMARKS_MAX = 200;

/* ===================================================
   HELPERS
=================================================== */

const toDateTimeLocalValue = (value: any) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toISOFromDateTimeLocal = (value: any) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString();
};

const cleanNumber = (value: any) => Number(value || 0);

const formatIndianNumber = (value: any) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const computeBalancePayable = (agreedFreight: any, advancePaid: any) => {
    const agreed = Number(agreedFreight || 0);
    const advance = Number(advancePaid || 0);

    return Math.max(agreed - advance, 0);
};

const getTransportOrderVoucher = (order: any) =>
    order?.voucherNumber ||
    order?.transportOrderNumber ||
    order?.transportOrderVoucherNumber ||
    order?.orderNumber ||
    "";

const normalizeVoucher = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase();

const getUsedTransportOrderVoucher = (item: any) =>
    item?.transportOrderNumber ||
    item?.tripNumber ||
    item?.transportOrder?.transportOrderNumber ||
    item?.transportOrder?.tripNumber ||
    "";

const getApiList = (res: any) => {
    const data = res?.data || res || {};

    const list =
        data?.records ||
        data?.data?.records ||
        data?.data ||
        data?.items ||
        [];

    return Array.isArray(list) ? list : [];
};

const getSingleRecord = (res: any) => {
    const data = res?.data || res || {};

    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.records)) return data.records[0] || null;
    if (Array.isArray(data?.data?.records)) return data.data.records[0] || null;

    return data?.data || data || null;
};

const getLRVoucher = (item: any) =>
    item?.lrNumber ||
    item?.voucherNumber ||
    item?.lrVoucherNumber ||
    item?.tripLRVoucherNumber ||
    "";

const sanitizeFileName = (name: any, fallback = "document") => {
    const cleaned = String(name || fallback)
        .replace(/[/\\?%*:|"<>]/g, "_")
        .trim();

    return cleaned || fallback;
};

/* ===================================================
   INITIAL FORM
=================================================== */

const createInitialTripLRCollection = () => ({
    tripNumber: "",
    transportOrderNumber: "",
    lrNumber: "",
    lrDate: new Date().toISOString(),

    customer: {
        customerCode: "",
        customerName: "",
    },

    consignor: {
        name: "",
        address: "",
        location: {
            city: "",
            state: "",
        },
    },

    consignee: {
        name: "",
        address: "",
        location: {
            city: "",
            state: "",
        },
    },

    vehicle: {
        vehicleCode: "",
        vehicleNumber: "",
        vehicleType: "",
    },

    driver: {
        driverCode: "",
        driverName: "",
    },

    route: {
        routeCode: "",
        routeName: "",
        source: "",
        destination: "",
        distanceKm: "",
    },

    cargo: {
        productCode: "",
        productName: "",
        quantity: "",
        unit: "Nos",
        weight: "",
        weightUnit: "Ton",
    },

    freight: {
        agreedFreight: "",
        advancePaid: "",
        balancePayable: "",
        paymentType: "To Pay",
    },

    loading: {
        loadingDateTime: new Date().toISOString(),
        loadingPoint: "",
    },

    delivery: {
        expectedDeliveryDateTime: new Date().toISOString(),
    },

    documents: [],

    remarks: "",
    tripStatus: "in_transit",
});

const normalizeDocumentRecord = (doc: any = {}) => ({
    documentType: doc.documentType || "",
    fileName: doc.fileName || "",
    fileSizeKB: Number(doc.fileSizeKB || 0),
    fileUri: String(doc.fileUri || doc.fileUrl || doc.url || "").trim(),
    fileUrl: String(doc.fileUrl || doc.url || "").trim(),
    fileType: String(doc.fileType || doc.mimeType || "").trim(),
});

const mergeTripLRCollectionForm = (data: any = {}) => {
    const base: any = createInitialTripLRCollection();

    return {
        ...base,
        ...data,
        customer: {
            ...base.customer,
            ...(data.customer || {}),
        },
        consignor: {
            ...base.consignor,
            ...(data.consignor || {}),
            location: {
                ...base.consignor.location,
                ...(data.consignor?.location || {}),
            },
        },
        consignee: {
            ...base.consignee,
            ...(data.consignee || {}),
            location: {
                ...base.consignee.location,
                ...(data.consignee?.location || {}),
            },
        },
        vehicle: {
            ...base.vehicle,
            ...(data.vehicle || {}),
        },
        driver: {
            ...base.driver,
            ...(data.driver || {}),
        },
        route: {
            ...base.route,
            ...(data.route || {}),
        },
        cargo: {
            ...base.cargo,
            ...(data.cargo || {}),
        },
        freight: {
            ...base.freight,
            ...(data.freight || {}),
        },
        loading: {
            ...base.loading,
            ...(data.loading || {}),
        },
        delivery: {
            ...base.delivery,
            ...(data.delivery || {}),
        },
        documents: Array.isArray(data.documents)
            ? data.documents.map(normalizeDocumentRecord)
            : [],
    };
};

const mapTransportOrderToLRCollection = (order: any, prevForm: any = {}) => {
    const tripNumber = getTransportOrderVoucher(order);

    const pickup =
        order?.pickupDetails?.pickupLocation ||
        order?.pickupDetails?.pickupAddress ||
        order?.pickupLocation ||
        "";

    const delivery =
        order?.deliveryDetails?.deliveryLocation ||
        order?.deliveryDetails?.deliveryAddress ||
        order?.deliveryLocation ||
        "";

    const pickupCity = order?.pickupDetails?.pickupCityName || "";
    const pickupState = order?.pickupDetails?.pickupStateName || "";

    const deliveryCity = order?.deliveryDetails?.deliveryCityName || "";
    const deliveryState = order?.deliveryDetails?.deliveryStateName || "";

    const pickupDisplay = pickupCity || pickup || "";
    const deliveryDisplay = deliveryCity || delivery || "";

    return mergeTripLRCollectionForm({
        ...prevForm,

        tripNumber,
        transportOrderNumber: tripNumber,

        customer: {
            customerCode:
                order?.customerDetails?.customerCode ||
                order?.customerCode ||
                "",
            customerName:
                order?.customerDetails?.customerName ||
                order?.customerName ||
                "",
        },

        consignor: {
            name:
                order?.pickupDetails?.pickupContactName ||
                order?.customerDetails?.customerName ||
                order?.customerName ||
                "",
            address: order?.pickupDetails?.pickupAddress || pickup,
            location: {
                city: pickupCity,
                state: pickupState,
            },
        },

        consignee: {
            name:
                order?.deliveryDetails?.deliveryContactName ||
                order?.customerDetails?.customerName ||
                order?.customerName ||
                "",
            address: order?.deliveryDetails?.deliveryAddress || delivery,
            location: {
                city: deliveryCity,
                state: deliveryState,
            },
        },

        route: {
            routeName:
                pickupDisplay && deliveryDisplay
                    ? `${pickupDisplay} → ${deliveryDisplay}`
                    : "",
            routeCode: tripNumber ? `RT-${tripNumber}` : "",
            source: pickupDisplay,
            destination: deliveryDisplay,
            distanceKm: order?.routeDetails?.routeDistanceKm || "",
        },

        cargo: {
            productName:
                order?.loadDetails?.materialName ||
                order?.materialName ||
                "",
            productCode: order?.loadDetails?.materialName
                ? `PRD-${String(order.loadDetails.materialName)
                    .slice(0, 3)
                    .toUpperCase()}`
                : "",
            quantity: order?.loadDetails?.quantity || "",
            unit:
                order?.loadDetails?.packagingType ||
                prevForm?.cargo?.unit ||
                "Nos",
            weight: order?.loadDetails?.weight || "",
            weightUnit: order?.loadDetails?.weightUnit || "Ton",
        },

        freight: {
            agreedFreight: order?.freightDetails?.expectedFreight || "",
            advancePaid: order?.freightDetails?.advanceAmount || "",
            paymentType: order?.freightDetails?.paymentType || "To Pay",
        },

        loading: {
            loadingDateTime:
                order?.pickupDetails?.pickupDateTime ||
                prevForm?.loading?.loadingDateTime ||
                new Date().toISOString(),
            loadingPoint: pickupDisplay,
        },

        delivery: {
            expectedDeliveryDateTime:
                order?.deliveryDetails?.expectedDeliveryDateTime ||
                prevForm?.delivery?.expectedDeliveryDateTime ||
                new Date().toISOString(),
        },
    });
};

const mapAllocationDriverToLR = (allocation: any = {}) => ({
    driverCode:
        allocation?.driverAllocation?.driverId ||
        allocation?.driverAllocation?.driverCode ||
        allocation?.driver?.driverCode ||
        "",
    driverName:
        allocation?.driverAllocation?.driverName ||
        allocation?.driver?.driverName ||
        "",
});

const mapAllocationVehicleToLR = (allocation: any = {}) => ({
    vehicleCode:
        allocation?.vehicleSelection?.selectedVehicleId ||
        allocation?.vehicleSelection?.vehicleCode ||
        allocation?.vehicle?.vehicleCode ||
        "",
    vehicleNumber:
        allocation?.vehicleSelection?.vehicleNumber ||
        allocation?.vehicle?.vehicleNumber ||
        "",
    vehicleType:
        allocation?.vehicleSelection?.vehicleType ||
        allocation?.vehicle?.vehicleType ||
        "",
});

const findAllocationForOrder = (allocations: any[] = [], orderVoucher = "") => {
    const normalized = String(orderVoucher || "")
        .trim()
        .toLowerCase();

    if (!normalized) return null;

    return (
        allocations
            .filter((item: any) => {
                const status = String(item?.tripStatus || "")
                    .trim()
                    .toLowerCase();

                if (status === "cancelled" || status === "canceled") {
                    return false;
                }

                const orderNo = String(
                    item?.transportOrder?.transportOrderNumber ||
                    item?.transportOrderNumber ||
                    item?.tripNumber ||
                    ""
                )
                    .trim()
                    .toLowerCase();

                return orderNo === normalized;
            })
            .sort(
                (a: any, b: any) =>
                    new Date(b?.allocationDate || b?.createdOn || 0).getTime() -
                    new Date(a?.allocationDate || a?.createdOn || 0).getTime()
            )[0] || null
    );
};

const toTripLRCollectionPayload = (form: any, overrides: any = {}) => {
    const merged = {
        ...form,
        ...overrides,
    };

    const balancePayable = computeBalancePayable(
        merged.freight?.agreedFreight,
        merged.freight?.advancePaid
    );

    return {
        tripNumber: merged.tripNumber || "",
        transportOrderNumber:
            merged.transportOrderNumber || merged.tripNumber || "",

        lrDate: merged.lrDate || new Date().toISOString(),

        customer: {
            customerCode: merged.customer?.customerCode || "",
            customerName: merged.customer?.customerName || "",
        },

        consignor: {
            name: merged.consignor?.name || "",
            address: merged.consignor?.address || "",
            location: {
                city: merged.consignor?.location?.city || "",
                state: merged.consignor?.location?.state || "",
            },
        },

        consignee: {
            name: merged.consignee?.name || "",
            address: merged.consignee?.address || "",
            location: {
                city: merged.consignee?.location?.city || "",
                state: merged.consignee?.location?.state || "",
            },
        },

        vehicle: {
            vehicleCode: merged.vehicle?.vehicleCode || "",
            vehicleNumber: merged.vehicle?.vehicleNumber || "",
            vehicleType: merged.vehicle?.vehicleType || "",
        },

        driver: {
            driverCode: merged.driver?.driverCode || "",
            driverName: merged.driver?.driverName || "",
        },

        route: {
            routeCode: merged.route?.routeCode || "",
            routeName: merged.route?.routeName || "",
            source: merged.route?.source || "",
            destination: merged.route?.destination || "",
            distanceKm: cleanNumber(merged.route?.distanceKm),
        },

        cargo: {
            productCode: merged.cargo?.productCode || "",
            productName: merged.cargo?.productName || "",
            quantity: cleanNumber(merged.cargo?.quantity),
            unit: merged.cargo?.unit || "Nos",
            weight: cleanNumber(merged.cargo?.weight),
            weightUnit: merged.cargo?.weightUnit || "Ton",
        },

        freight: {
            agreedFreight: cleanNumber(merged.freight?.agreedFreight),
            advancePaid: cleanNumber(merged.freight?.advancePaid),
            balancePayable,
            paymentType: merged.freight?.paymentType || "To Pay",
        },

        loading: {
            loadingDateTime:
                merged.loading?.loadingDateTime || new Date().toISOString(),
            loadingPoint: merged.loading?.loadingPoint || "",
        },

        delivery: {
            expectedDeliveryDateTime:
                merged.delivery?.expectedDeliveryDateTime ||
                new Date().toISOString(),
        },

        documents: (merged.documents || []).map((doc: any) => ({
            documentType: doc.documentType || "",
            fileName: doc.fileName || "",
            fileSizeKB: Number(doc.fileSizeKB || 0),
            fileUri: doc.fileUri || "",
            fileUrl: doc.fileUrl || "",
            fileType: doc.fileType || "",
        })),

        remarks: merged.remarks || "",
        tripStatus: merged.tripStatus || "in_transit",
    };
};

/* ===================================================
   CREATE / EDIT FORM
=================================================== */

const CreateEditTripLREntry = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const mode = location.state?.mode || (params?.voucherNumber ? "edit" : "add");

    const voucherNumber =
        location.state?.voucherNumber ||
        location.state?.lrNumber ||
        params?.voucherNumber ||
        params?.lrNumber ||
        "";

    const isEdit = mode === "edit" || Boolean(voucherNumber);

    const [form, setForm] = useState<any>(createInitialTripLRCollection());

    const [loading, setLoading] = useState(false);
    const [transportOrders, setTransportOrders] = useState<any[]>([]);
    const [lrEntries, setLrEntries] = useState<any[]>([]);
    const [allocationLoading, setAllocationLoading] = useState(false);
    const [driverPickError, setDriverPickError] = useState("");
    const [vehiclePickError, setVehiclePickError] = useState("");

    const [showDocModal, setShowDocModal] = useState(false);
    const [docDraft, setDocDraft] = useState<any>({
        documentType: "Invoice",
        fileName: "",
        fileSizeKB: "",
        fileUri: "",
        fileType: "",
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const tripSearchTimerRef = useRef<any>(null);

    const pageTitle = isEdit ? "Edit Trip L/R Collection" : "Create Trip L/R Collection";
    const pageDescription = isEdit
        ? "Update LR collection details."
        : "Create LR collection with trip, route, vehicle, driver, cargo and freight details.";

    const balancePayable = useMemo(
        () =>
            computeBalancePayable(
                form.freight?.agreedFreight,
                form.freight?.advancePaid
            ),
        [form.freight?.agreedFreight, form.freight?.advancePaid]
    );

    const transportOrderOptions = useMemo(() => {
        const usedOrderSet = new Set(
            lrEntries
                .map((item: any) => normalizeVoucher(getUsedTransportOrderVoucher(item)))
                .filter(Boolean)
        );

        return transportOrders
            .filter((order: any) => {
                const voucher = normalizeVoucher(getTransportOrderVoucher(order));

                if (!voucher) return false;

                // In edit mode, keep current selected order visible if needed.
                const currentVoucher = normalizeVoucher(
                    form.transportOrderNumber || form.tripNumber
                );

                if (isEdit && voucher === currentVoucher) return true;

                return !usedOrderSet.has(voucher);
            })
            .map((order: any) => {
                const voucher = getTransportOrderVoucher(order);

                const customer =
                    order?.customerDetails?.customerName ||
                    order?.customerName ||
                    "-";

                const source =
                    order?.pickupDetails?.pickupLocation ||
                    order?.pickupDetails?.pickupCityName ||
                    order?.pickupLocation ||
                    "-";

                const destination =
                    order?.deliveryDetails?.deliveryLocation ||
                    order?.deliveryDetails?.deliveryCityName ||
                    order?.deliveryLocation ||
                    "-";

                return {
                    label: `${voucher} - ${customer} (${source} → ${destination})`,
                    value: voucher,
                    raw: order,
                };
            });
    }, [
        transportOrders,
        lrEntries,
        isEdit,
        form.transportOrderNumber,
        form.tripNumber,
    ]);

    const update = (section: string, key: string, value: any) => {
        const nextValue =
            key.toLowerCase().includes("datetime") || key === "lrDate"
                ? toISOFromDateTimeLocal(value)
                : value;

        setForm((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: nextValue,
            },
        }));
    };

    const updateRootField = (key: string, value: any) => {
        const nextValue = key === "lrDate" ? toISOFromDateTimeLocal(value) : value;

        setForm((prev: any) => ({
            ...prev,
            [key]: nextValue,
        }));
    };

    const fetchTransportOrders = useCallback(
        async (searchValue = "") => {
            try {
                const res = await dispatch(
                    getTransportOrders({
                        limit: 200,
                        offset: 0,
                        search: String(searchValue || "").trim(),
                        status: "open",
                    }) as any
                ).unwrap();

                setTransportOrders(getApiList(res));
            } catch (error: any) {
                toast.error(error?.message || "Failed to load transport orders");
                setTransportOrders([]);
            }
        },
        [dispatch]
    );


    const fetchLREntries = useCallback(async () => {
        try {
            const res = await dispatch(
                getAllLRCollection({
                    limit: 1000,
                    offset: 0,
                    search: "",
                    tripStatus: "",
                }) as any
            ).unwrap();

            setLrEntries(getApiList(res));
        } catch (error: any) {
            toast.error(error?.message || "Failed to load LR entries");
            setLrEntries([]);
        }
    }, [dispatch]);

    const fetchAllocationForOrder = useCallback(
        async (orderVoucher: string) => {
            const voucher = String(orderVoucher || "").trim();

            if (!voucher) {
                setDriverPickError("");
                setVehiclePickError("");
                return null;
            }

            try {
                setAllocationLoading(true);

                const res = await dispatch(
                    getAllTripAllocation({
                        limit: 200,
                        offset: 0,
                    }) as any
                ).unwrap();

                const list = getApiList(res);
                const allocation = findAllocationForOrder(list, voucher);

                if (!allocation) {
                    setDriverPickError(
                        "No trip allocation found for this order. Allocate trip first."
                    );
                    setVehiclePickError(
                        "No vehicle allocation found for this order."
                    );
                    return null;
                }

                const driver = mapAllocationDriverToLR(allocation);
                const vehicle = mapAllocationVehicleToLR(allocation);

                if (!driver.driverName?.trim()) {
                    setDriverPickError("Driver not assigned in trip allocation.");
                } else {
                    setDriverPickError("");
                }

                if (!vehicle.vehicleNumber?.trim()) {
                    setVehiclePickError("Vehicle not assigned in trip allocation.");
                } else {
                    setVehiclePickError("");
                }

                return {
                    driver,
                    vehicle,
                };
            } catch (error: any) {
                setDriverPickError(error?.message || "Failed to load trip allocation");
                setVehiclePickError(error?.message || "Failed to load trip allocation");
                return null;
            } finally {
                setAllocationLoading(false);
            }
        },
        [dispatch]
    );

    const loadEntry = useCallback(async () => {
        if (!isEdit) return;

        const passedData = location.state?.lrData;

        if (passedData) {
            setForm(mergeTripLRCollectionForm(passedData));
            return;
        }

        if (!voucherNumber) return;

        try {
            setLoading(true);

            const res = await dispatch(
                getTripLRCollectionByVoucherNumber(voucherNumber) as any
            ).unwrap();

            const record = getSingleRecord(res);

            setForm(mergeTripLRCollectionForm(record));
        } catch (error: any) {
            toast.error(error?.message || "Failed to load LR collection");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [dispatch, isEdit, location.state?.lrData, navigate, voucherNumber]);

    useEffect(() => {
        fetchTransportOrders("");
        fetchLREntries();
        loadEntry();

        return () => {
            if (tripSearchTimerRef.current) {
                clearTimeout(tripSearchTimerRef.current);
            }
        };
    }, [fetchTransportOrders, fetchLREntries, loadEntry]);

    const handleTripSearchChange = (text: string) => {
        if (tripSearchTimerRef.current) {
            clearTimeout(tripSearchTimerRef.current);
        }

        tripSearchTimerRef.current = setTimeout(() => {
            fetchTransportOrders(text);
        }, 400);
    };

    const handleTransportOrderSelect = async (orderVoucher: string) => {
        const selected = transportOrders.find(
            (order: any) => getTransportOrderVoucher(order) === orderVoucher
        );

        if (!selected) {
            updateRootField("transportOrderNumber", orderVoucher);
            updateRootField("tripNumber", orderVoucher);
            return;
        }

        setForm((prev: any) => mapTransportOrderToLRCollection(selected, prev));

        const allocationResult = await fetchAllocationForOrder(orderVoucher);

        setForm((prev: any) => ({
            ...prev,
            driver: allocationResult?.driver || {
                driverCode: "",
                driverName: "",
            },
            vehicle: allocationResult?.vehicle || {
                vehicleCode: "",
                vehicleNumber: "",
                vehicleType: "",
            },
        }));
    };

    const handleRouteNameChange = (value: string) => {
        setForm((prev: any) => ({
            ...prev,
            route: {
                ...prev.route,
                routeName: value,
                routeCode: value ? `RT-${value.slice(0, 4).toUpperCase()}` : "",
            },
        }));
    };

    const updateField = (key: string, value: any) => {
        if (key === "transportOrderNumber") {
            handleTransportOrderSelect(value);
            return;
        }

        if (key === "lrDate") {
            updateRootField(key, value);
            return;
        }

        if (key === "remarks") {
            setForm((prev: any) => ({
                ...prev,
                remarks: String(value || "").slice(0, REMARKS_MAX),
            }));
            return;
        }

        if (key === "tripStatus") {
            updateRootField(key, value);
            return;
        }

        if (key === "route.routeName") {
            handleRouteNameChange(value);
            return;
        }

        if (key === "cargo.productName") {
            setForm((prev: any) => ({
                ...prev,
                cargo: {
                    ...prev.cargo,
                    productName: value,
                    productCode: value
                        ? `PRD-${String(value).slice(0, 3).toUpperCase()}`
                        : "",
                },
            }));
            return;
        }

        if (key.includes(".")) {
            const [section, childKey] = key.split(".");
            update(section, childKey, value);
            return;
        }

        updateRootField(key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";
        updateField(key, value);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? e ?? "";
        updateField(key, value);
    };

    const handleFilePick = (e: any) => {
        const file = e?.target?.files?.[0];

        if (!file) return;

        const fileUri = URL.createObjectURL(file);

        setDocDraft((prev: any) => ({
            ...prev,
            fileName: sanitizeFileName(file.name || "Document"),
            fileSizeKB: Math.ceil(Number(file.size || 0) / 1024),
            fileUri,
            fileType: file.type || "",
            rawFile: file,
        }));

        e.target.value = "";
    };

    const addDocument = () => {
        if (!docDraft.fileName?.trim()) {
            toast.warn("Please pick a document");
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            documents: [
                ...(prev.documents || []),
                {
                    ...normalizeDocumentRecord(docDraft),
                },
            ],
        }));

        setDocDraft({
            documentType: "Invoice",
            fileName: "",
            fileSizeKB: "",
            fileUri: "",
            fileType: "",
        });

        setShowDocModal(false);
    };

    // const removeDocument = (index: number) => {
    //     setForm((prev: any) => ({
    //         ...prev,
    //         documents: (prev.documents || []).filter(
    //             (_: any, i: number) => i !== index
    //         ),
    //     }));
    // };

    // const openDocument = (doc: any) => {
    //     const uri = doc?.fileUri || doc?.fileUrl;

    //     if (!uri) {
    //         toast.warn("Document file is not available");
    //         return;
    //     }

    //     window.open(uri, "_blank", "noopener,noreferrer");
    // };

    const validateForm = () => {
        if (!form.tripNumber?.trim() && !form.transportOrderNumber?.trim()) {
            toast.warn("Please select a transport order / trip");
            return false;
        }

        if (!form.customer?.customerName?.trim()) {
            toast.warn("Customer is required");
            return false;
        }

        if (!form.consignor?.name?.trim()) {
            toast.warn("Consignor is required");
            return false;
        }

        if (!form.consignee?.name?.trim()) {
            toast.warn("Consignee is required");
            return false;
        }

        if (!form.vehicle?.vehicleNumber?.trim()) {
            toast.warn(vehiclePickError || "Vehicle is required");
            return false;
        }

        if (!form.driver?.driverName?.trim()) {
            toast.warn(driverPickError || "Driver is required");
            return false;
        }

        if (!form.route?.routeName?.trim()) {
            toast.warn("Route is required");
            return false;
        }

        if (!form.cargo?.productName?.trim()) {
            toast.warn("Material / Product is required");
            return false;
        }

        if (form.cargo?.quantity === "" || form.cargo?.quantity === null) {
            toast.warn("Quantity is required");
            return false;
        }

        if (form.cargo?.weight === "" || form.cargo?.weight === null) {
            toast.warn("Weight is required");
            return false;
        }

        if (
            form.freight?.agreedFreight === "" ||
            form.freight?.agreedFreight === null
        ) {
            toast.warn("Agreed freight is required");
            return false;
        }

        if (!form.loading?.loadingPoint?.trim()) {
            toast.warn("Loading point is required");
            return false;
        }

        return true;
    };

    const persistEntry = async (overrides: any = {}, successMessage = "") => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = toTripLRCollectionPayload(form, overrides);

            if (isEdit) {
                const editVoucher = voucherNumber || getLRVoucher(form);

                if (!editVoucher) {
                    toast.warn("LR number not found");
                    return;
                }

                await dispatch(
                    updateTripLRCollection({
                        voucherNumber: editVoucher,
                        payload,
                    }) as any
                ).unwrap();
            } else {
                await dispatch(createLRCollection(payload) as any).unwrap();
            }

            toast.success(successMessage);
            navigate(-1);
        } catch (error: any) {
            toast.error(error?.message || "Trip LR collection save failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndStart = () =>
        persistEntry(
            { tripStatus: form.tripStatus || "in_transit" },
            isEdit ? "Trip LR collection updated" : "LR saved and trip started"
        );

    const fieldForm = {
        transportOrderNumber: form.transportOrderNumber || form.tripNumber || "",
        lrDate: toDateTimeLocalValue(form.lrDate),

        "customer.customerCode": form.customer?.customerCode || "",
        "customer.customerName": form.customer?.customerName || "",

        "consignor.name": form.consignor?.name || "",
        "consignor.address": form.consignor?.address || "",
        "consignor.location.city": form.consignor?.location?.city || "",
        "consignor.location.state": form.consignor?.location?.state || "",

        "consignee.name": form.consignee?.name || "",
        "consignee.address": form.consignee?.address || "",
        "consignee.location.city": form.consignee?.location?.city || "",
        "consignee.location.state": form.consignee?.location?.state || "",

        "route.routeName": form.route?.routeName || "",
        "route.distanceKm": form.route?.distanceKm || "",
        "route.source": form.route?.source || "",
        "route.destination": form.route?.destination || "",

        "cargo.productName": form.cargo?.productName || "",
        "cargo.quantity": form.cargo?.quantity || "",
        "cargo.unit": form.cargo?.unit || "Nos",
        "cargo.weight": form.cargo?.weight || "",
        "cargo.weightUnit": form.cargo?.weightUnit || "Ton",

        "freight.agreedFreight": form.freight?.agreedFreight || "",
        "freight.advancePaid": form.freight?.advancePaid || "",
        "freight.paymentType": form.freight?.paymentType || "To Pay",

        "loading.loadingDateTime": toDateTimeLocalValue(
            form.loading?.loadingDateTime
        ),
        "loading.loadingPoint": form.loading?.loadingPoint || "",

        "delivery.expectedDeliveryDateTime": toDateTimeLocalValue(
            form.delivery?.expectedDeliveryDateTime
        ),

        remarks: form.remarks || "",
        tripStatus: form.tripStatus || "in_transit",
    };

    const basicFields = [
        {
            key: "transportOrderNumber",
            label: "Trip / Transport Order",
            type: "select",
            options: transportOrderOptions,
            mandatory: true,
            placeholder: "Select transport order",
            onSearchChange: handleTripSearchChange,
            disabled: isEdit,
        },
        {
            key: "lrDate",
            label: "LR Date",
            type: "datetime-local",
            mandatory: true,
        },
    ];

    const customerLocationFields = [
        // {
        //     key: "customer.customerCode",
        //     label: "Customer Code",
        //     type: "text",
        //     disabled: true,
        // },
        {
            key: "customer.customerName",
            label: "Customer Name",
            type: "text",
            disabled: true,
        },
        {
            key: "consignor.name",
            label: "Consignor (From)",
            type: "text",
            mandatory: true,
            placeholder: "Enter consignor name",
        },
        {
            key: "consignor.address",
            label: "Consignor Address",
            type: "text",
            placeholder: "Enter consignor address",
            className: "md:col-span-2",
        },
        // {
        //     key: "consignor.location.city",
        //     label: "Consignor City",
        //     type: "text",
        //     placeholder: "Enter city",
        // },
        // {
        //     key: "consignor.location.state",
        //     label: "Consignor State",
        //     type: "text",
        //     placeholder: "Enter state",
        // },
        {
            key: "consignee.name",
            label: "Consignee (To)",
            type: "text",
            mandatory: true,
            placeholder: "Enter consignee name",
        },
        {
            key: "consignee.address",
            label: "Consignee Address",
            type: "text",
            placeholder: "Enter consignee address",
            className: "md:col-span-2",
        },
        // {
        //     key: "consignee.location.city",
        //     label: "Consignee City",
        //     type: "text",
        //     placeholder: "Enter city",
        // },
        // {
        //     key: "consignee.location.state",
        //     label: "Consignee State",
        //     type: "text",
        //     placeholder: "Enter state",
        // },
    ];

    const routeFields = [
        {
            key: "route.routeName",
            label: "Route",
            type: "text",
            mandatory: true,
            placeholder: "Enter route",
        },
        {
            key: "route.distanceKm",
            label: "Distance (KM)",
            type: "number",
            placeholder: "Enter distance",
        },
        {
            key: "route.source",
            label: "Source",
            type: "text",
            disabled: true,
        },
        {
            key: "route.destination",
            label: "Destination",
            type: "text",
            disabled: true,
        },
    ];

    const cargoFields = [
        {
            key: "cargo.productName",
            label: "Material / Product",
            type: "text",
            mandatory: true,
            placeholder: "Enter product name",
        },
        {
            key: "cargo.quantity",
            label: "Quantity",
            type: "number",
            mandatory: true,
            placeholder: "Enter quantity",
        },
        {
            key: "cargo.unit",
            label: "Quantity Unit",
            type: "select",
            options: quantityUnitOptions,
        },
        {
            key: "cargo.weight",
            label: "Weight",
            type: "number",
            mandatory: true,
            placeholder: "Enter weight",
        },
        {
            key: "cargo.weightUnit",
            label: "Weight Unit",
            type: "select",
            options: weightUnitOptions,
        },
    ];

    const freightFields = [
        {
            key: "freight.agreedFreight",
            label: "Agreed Freight (₹)",
            type: "number",
            mandatory: true,
            placeholder: "Enter agreed freight",
        },
        {
            key: "freight.advancePaid",
            label: "Advance Paid (₹)",
            type: "number",
            placeholder: "Enter advance paid",
        },
        {
            key: "freight.paymentType",
            label: "Payment Type",
            type: "select",
            options: paymentTypeOptions,
        },
    ];

    const loadingFields = [
        {
            key: "loading.loadingDateTime",
            label: "Loading Date & Time",
            type: "datetime-local",
            mandatory: true,
            // className: "w-full",
        },
        {
            key: "loading.loadingPoint",
            label: "Loading Point",
            type: "text",
            mandatory: true,
            placeholder: "Enter loading point",
            // className: "w-full",
        },
    ];
    const deliveryFields = [
        {
            key: "delivery.expectedDeliveryDateTime",
            label: "Expected Delivery Date & Time",
            type: "datetime-local",
            mandatory: true,
        },
    ];

    const remarksFields = [
        {
            key: "tripStatus",
            label: "Trip Status",
            type: "select",
            options: tripStatusOptions,
            mandatory: true,
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter remarks",

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

                        <p className="text-sm text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>
                </div>

                {loading && (
                    <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        Saving...
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-auto p-2 ">
                <div className="space-y-4">
                    <FormSectionCard
                        title="1. Basic Information"
                        icon={<FileText size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-2 gap-4">

                            {renderFields(basicFields)}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="2. Customer & Locations"
                        icon={<MapPin size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-5 gap-4">

                            {renderFields(customerLocationFields)}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="3. Vehicle & Driver"
                        icon={<Users size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Vehicle Number
                                </p>

                                <p className="mt-1 truncate text-sm font-bold text-card-foreground">
                                    {allocationLoading
                                        ? "Loading vehicle..."
                                        : form.vehicle?.vehicleNumber ||
                                        vehiclePickError ||
                                        "Select transport order first"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Vehicle Type
                                </p>

                                <p className="mt-1 truncate text-sm font-bold text-card-foreground">
                                    {form.vehicle?.vehicleType || "-"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Assigned Driver
                                </p>

                                <p className="mt-1 truncate text-sm font-bold text-card-foreground">
                                    {allocationLoading
                                        ? "Loading driver..."
                                        : form.driver?.driverName ||
                                        driverPickError ||
                                        "Select transport order first"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border bg-background p-3">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Driver Code / Mobile
                                </p>

                                <p className="mt-1 truncate text-sm font-bold text-card-foreground">
                                    {form.driver?.driverCode || "-"}
                                </p>
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="4. Route Details"
                        icon={<Navigation size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-4 gap-4">

                            {renderFields(routeFields)}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="5. Goods / Cargo Details"
                        icon={<Package size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-5 gap-4">

                            {renderFields(cargoFields)}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="6. Freight & Charges"
                        icon={<CreditCard size={18} />}
                    >
                        <div className="md:col-span-2 xl:col-span-4 grid w-full grid-cols-4 gap-2">

                            {renderFields(freightFields)}

                            <div className="flex items-center justify-between h-8 rounded-sm border border-border bg-background px-3 mt-6">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Balance Payable (₹)
                                </p>

                                <p className="text-lg font-bold text-card-foreground">
                                    ₹ {formatIndianNumber(balancePayable)}
                                </p>
                            </div>
                        </div>
                    </FormSectionCard>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <FormSectionCard
                            title="7. Loading Details"
                            icon={<Clock size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                                {renderFields(loadingFields)}
                            </div>
                        </FormSectionCard>

                        <FormSectionCard
                            title="8. Expected Delivery"
                            icon={<Calendar size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-1 gap-4">
                                {renderFields(deliveryFields)}
                            </div>
                        </FormSectionCard>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <FormSectionCard
                            title="9. Documents"
                            icon={<Paperclip size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3">
                                <DocumentUploadInput
                                    label=""
                                    value={(form.documents || []).map((doc: any) => ({
                                        documentName: doc.documentName || doc.fileName || "",
                                        documentUrl: doc.documentUrl || doc.fileUri || doc.fileUrl || "",
                                        fileSizeKB: doc.fileSizeKB || 0,
                                        mimeType: doc.mimeType || doc.fileType || "",
                                        documentType: doc.documentType || "Other",
                                    }))}
                                    multiple={true}
                                    placeholder="Upload LR Documents"
                                    description="Attach invoice, e-way bill, challan, PDF, Word, Excel, or image files."
                                    allowedText="Allowed: PDF, PNG, JPG, JPEG, XLS, XLSX, DOC, DOCX"
                                    onChange={(docs: any[]) => {
                                        setForm((prev: any) => ({
                                            ...prev,
                                            documents: docs.map((doc: any) => ({
                                                documentType: doc.documentType || "Other",

                                                // For your new DocumentUploadInput
                                                documentName: doc.documentName || "",
                                                documentUrl: doc.documentUrl || "",
                                                mimeType: doc.mimeType || "",

                                                // For your existing LR payload compatibility
                                                fileName: doc.documentName || doc.fileName || "",
                                                fileUri: doc.documentUrl || doc.fileUri || "",
                                                fileUrl: doc.documentUrl || doc.fileUrl || "",
                                                fileType: doc.mimeType || doc.fileType || "",

                                                fileSizeKB: Number(doc.fileSizeKB || 0),
                                            })),
                                        }));
                                    }}
                                />
                            </div>
                        </FormSectionCard>

                        <FormSectionCard
                            title="10. Remarks & Status"
                            icon={<Edit3 size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-1">

                                {renderFields(remarksFields)}

                                <p className="mt-2 text-xs font-bold text-muted-foreground md:col-span-2 xl:col-span-3">
                                    {(form.remarks || "").length}/{REMARKS_MAX}
                                </p>
                            </div>
                        </FormSectionCard>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handleSaveAndStart}
                    disabled={loading}
                    className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                    {loading
                        ? "Saving..."
                        : isEdit
                            ? "Update LR"
                            : "Save & Start Trip"}
                </button>
            </div>

            {showDocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-base font-bold text-card-foreground">
                                Add Document
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowDocModal(false)}
                                className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-card-foreground">
                                    Document Type
                                </span>

                                <select
                                    value={docDraft.documentType}
                                    onChange={(e) =>
                                        setDocDraft((prev: any) => ({
                                            ...prev,
                                            documentType: e.target.value,
                                        }))
                                    }
                                    className="h-10 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
                                >
                                    {documentTypeOptions.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFilePick}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 text-sm font-bold text-primary transition hover:bg-primary/20"
                            >
                                <Upload size={16} />
                                {docDraft.fileName
                                    ? "Change Document"
                                    : "Pick Document"}
                            </button>

                            {docDraft.fileName && (
                                <div className="rounded-md border border-border bg-background p-3">
                                    <p className="truncate text-sm font-bold text-card-foreground">
                                        {docDraft.fileName}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {docDraft.fileSizeKB || 0} KB
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDocModal(false)}
                                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-card-foreground transition hover:bg-muted"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={addDocument}
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEditTripLREntry;