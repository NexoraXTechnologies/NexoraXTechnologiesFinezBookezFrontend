import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    LoaderCircle,
    Save,
} from "lucide-react";
import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import professionalAxios from "../../../../services/professionalAxios";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import {
    createTransportOrder,
    getTransportOrderByVoucherNumber,
    updateTransportOrderByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";

/* =====================================================
   OPTIONS
===================================================== */

const orderTypeOptions = [
    { label: "Market", value: "market" },
    { label: "Contract", value: "contract" },
];

const loadTypeOptions = [
    { label: "FTL (Full Truck Load)", value: "FTL" },
    { label: "PTL (Part Truck Load)", value: "PTL" },
];

const weightUnitOptions = [
    { label: "Ton", value: "Ton" },
    { label: "Kg", value: "Kg" },
];

const packagingOptions = [
    { label: "Loose", value: "Loose" },
    { label: "Box", value: "Box" },
    { label: "Pallet", value: "Pallet" },
];

const routeTypeOptions = [
    { label: "National Highway", value: "National Highway" },
    { label: "State Highway", value: "State Highway" },
    { label: "Expressway", value: "Expressway" },
];

const paymentTypeOptions = [
    { label: "To Pay", value: "To Pay" },
    { label: "Paid", value: "Paid" },
    { label: "To Be Billed", value: "To Be Billed" },
];

const paymentModeOptions = [
    { label: "Bank Transfer", value: "Bank Transfer" },
    { label: "Cash", value: "Cash" },
    { label: "UPI", value: "UPI" },
    { label: "Cheque", value: "Cheque" },
];

const priorityOptions = [
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" },
];

const riskOptions = [
    { label: "Carrier Risk", value: "Carrier Risk" },
    { label: "Owner Risk", value: "Owner Risk" },
];

const ewayBillGeneratedByOptions = [
    { label: "Customer", value: "customer" },
    { label: "Transporter", value: "transporter" },
    { label: "Broker", value: "broker" },
];

const vehicleTypeOptions = [
    { label: "Mini Truck", value: "Mini Truck" },
    { label: "Pick Up", value: "Pick Up" },
    { label: "LCV", value: "LCV" },
    { label: "MCV", value: "MCV" },
    { label: "HCV", value: "HCV" },
    { label: "Trailer", value: "Trailer" },
    { label: "Container", value: "Container" },
    { label: "Tipper", value: "Tipper" },
];

const vehicleCapacityOptions = [
    "1",
    "1.5",
    "7",
    "9",
    "10",
    "14",
    "15",
    "16",
    "20",
    "25",
    "32",
    "35",
    "40",
].map(value => ({
    label: `${value} Ton`,
    value,
}));

const vehicleBodyTypeOptions = [
    "Open Body",
    "Closed Body",
    "Container",
    "Half Body",
    "Full Body",
    "Flatbed",
    "Trailer Body",
    "Tanker",
    "Refrigerated",
    "High Deck",
    "Low Bed",
    "Semi Low Bed",
    "Platform",
].map(value => ({
    label: value,
    value,
}));

const STEPS = [
    "Customer",
    "Load",
    "Pickup",
    "Delivery",
    "Vehicle",
    "Freight",
    "Risk",
];

/* =====================================================
   TYPES
===================================================== */

type PageMode = "add" | "edit" | "view";

type Option = {
    label: string;
    value: string;
};

type CreateEditTransportOrderProps = {
    embedded?: boolean;
    mode?: PageMode;
    voucherNumber?: string;
    orderData?: any;
    onClose?: () => void;
    onSaved?: () => void;
};

type RouteState = {
    mode?: PageMode;
    voucherNumber?: string;
    orderData?: any;
};

/* =====================================================
   INITIAL STATE + PAYLOAD HELPERS
===================================================== */

const computeRemainingTrips = (
    totalTrips: any,
    completedTrips: any
) => {
    const total = Number(totalTrips || 0);
    const completed = Number(completedTrips || 0);

    return Math.max(total - completed, 0);
};

const normalizeOrderType = (value: any) => {
    const key = String(value || "")
        .trim()
        .toLowerCase();

    if (key === "contract") {
        return "contract";
    }

    return "market";
};

const toBoolean = (value: any) => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value
            .trim()
            .toLowerCase();

        if (normalized === "true") {
            return true;
        }

        if (normalized === "false") {
            return false;
        }
    }

    return Boolean(value);
};

const nullIfEmpty = (value: any) => {
    const trimmed = String(value ?? "").trim();

    return trimmed ? trimmed : null;
};

const createInitialTransportOrder = () => ({
    orderDate: new Date().toISOString(),
    orderType: "market",

    contractDetails: {
        contractNumber: "",
        validityFrom: "",
        validityTo: "",
        totalTrips: "",
        completedTrips: 0,
        remainingTrips: 0,
        selectedRouteIndex: 0,
        selectedRouteCode: "",
        availableRoutes: [],
    },

    customerDetails: {
        customerCode: "",
        customerName: "",
        gstNumber: "",
        contactPerson: "",
        mobileNumber: "",
        email: "",
    },

    loadDetails: {
        loadType: "",
        materialName: "",
        materialCategory: "",
        quantity: "",
        weight: "",
        weightUnit: "Ton",
        packagingType: "",
        invoiceNumber: "",

        ewayBillDetails: {
            ewayBillRequired: false,
            ewayBillGeneratedBy: "customer",
            ewayBillNumber: "",
            ewayBillDate: new Date().toISOString(),
        },

        specialHandlingInstructions: "",
    },

    pickupDetails: {
        pickupLocation: "",
        pickupAddress: "",
        pickupDateTime: new Date().toISOString(),
        pickupContactName: "",
        pickupContactNumber: "",
        pickupState: null,
        pickupCity: null,
        pickupStateCode: "",
        pickupStateName: "",
        pickupCityName: "",
        pickupPincode: "",
        pickupLatitude: "",
        pickupLongitude: "",
        pickupPlaceId: "",
    },

    deliveryDetails: {
        deliveryLocation: "",
        deliveryAddress: "",
        expectedDeliveryDateTime:
            new Date().toISOString(),
        deliveryContactName: "",
        deliveryContactNumber: "",
        deliveryState: null,
        deliveryCity: null,
        deliveryStateCode: "",
        deliveryStateName: "",
        deliveryCityName: "",
        deliveryPincode: "",
        deliveryLatitude: "",
        deliveryLongitude: "",
        deliveryPlaceId: "",
    },

    routeDetails: {
        routeDistanceKm: "",
        routeType: "",
        expectedTollAmount: "",
    },

    vehicleRequirement: {
        vehicleType: "",
        vehicleBodyType: "",
        vehicleCapacity: "",
        numberOfVehicles: "1",
        specialVehicleRequirement: "",
    },

    freightDetails: {
        freightPerTon: "",
        expectedFreight: "",
        advanceAmount: "",
        balanceAmount: "",
        paymentType: "To Pay",
        paymentMode: "Cash",
    },

    brokerDetails: {
        brokerRequired: false,
        brokerCode: "",
        brokerName: "",
        brokerCommission: 0,
    },

    riskAndInsurance: {
        riskType: "",
        insuranceRequired: false,
        insuranceAmount: "",
    },

    trackingPreferences: {
        gpsTrackingRequired: false,
        podRequired: false,
        liveTrackingEnabled: false,
    },

    priority: "High",
    status: "open",
    remarks: "",
});

const mergeTransportOrderForm = (
    data: any = {}
) => {
    const base = createInitialTransportOrder();

    return {
        ...base,
        ...data,

        orderType: normalizeOrderType(
            data?.orderType || base.orderType
        ),

        contractDetails: {
            ...base.contractDetails,
            ...(data?.contractDetails || {}),

            remainingTrips: computeRemainingTrips(
                data?.contractDetails?.totalTrips,
                data?.contractDetails?.completedTrips
            ),
        },

        customerDetails: {
            ...base.customerDetails,
            ...(data?.customerDetails || {}),
        },

        loadDetails: {
            ...base.loadDetails,
            ...(data?.loadDetails || {}),

            ewayBillDetails: {
                ...base.loadDetails.ewayBillDetails,
                ...(data?.loadDetails
                    ?.ewayBillDetails || {}),

                ewayBillRequired: toBoolean(
                    data?.loadDetails
                        ?.ewayBillDetails
                        ?.ewayBillRequired
                ),
            },
        },

        pickupDetails: {
            ...base.pickupDetails,
            ...(data?.pickupDetails || {}),

            pickupLocation:
                data?.pickupDetails
                    ?.pickupLocation ||
                data?.pickupDetails
                    ?.pickupCityName ||
                "",
        },

        deliveryDetails: {
            ...base.deliveryDetails,
            ...(data?.deliveryDetails || {}),

            deliveryLocation:
                data?.deliveryDetails
                    ?.deliveryLocation ||
                data?.deliveryDetails
                    ?.deliveryCityName ||
                "",
        },

        routeDetails: {
            ...base.routeDetails,
            ...(data?.routeDetails || {}),
        },

        vehicleRequirement: {
            ...base.vehicleRequirement,
            ...(data?.vehicleRequirement || {}),
        },

        freightDetails: {
            ...base.freightDetails,
            ...(data?.freightDetails || {}),
        },

        brokerDetails: {
            ...base.brokerDetails,
            ...(data?.brokerDetails || {}),

            brokerRequired: toBoolean(
                data?.brokerDetails
                    ?.brokerRequired
            ),
        },

        riskAndInsurance: {
            ...base.riskAndInsurance,
            ...(data?.riskAndInsurance || {}),

            insuranceRequired: toBoolean(
                data?.riskAndInsurance
                    ?.insuranceRequired
            ),
        },

        trackingPreferences: {
            ...base.trackingPreferences,
            ...(data?.trackingPreferences || {}),

            gpsTrackingRequired: toBoolean(
                data?.trackingPreferences
                    ?.gpsTrackingRequired
            ),

            podRequired: toBoolean(
                data?.trackingPreferences
                    ?.podRequired
            ),

            liveTrackingEnabled: toBoolean(
                data?.trackingPreferences
                    ?.liveTrackingEnabled
            ),
        },
    };
};

const computeFreightBalance = (
    expectedFreight: any,
    advanceAmount: any
) => {
    return (
        Number(expectedFreight || 0) -
        Number(advanceAmount || 0)
    );
};

const toTransportOrderPayload = (
    form: any
) => ({
    ...form,

    orderType:
        normalizeOrderType(form.orderType) ===
            "contract"
            ? "contract"
            : "normal",

    contractDetails:
        normalizeOrderType(form.orderType) ===
            "contract"
            ? {
                contractNumber: nullIfEmpty(
                    form.contractDetails
                        ?.contractNumber
                ),

                validityFrom:
                    form.contractDetails
                        ?.validityFrom ||
                    null,

                validityTo:
                    form.contractDetails
                        ?.validityTo ||
                    null,

                totalTrips: nullIfEmpty(
                    form.contractDetails
                        ?.totalTrips
                ),

                completedTrips: String(
                    form.contractDetails
                        ?.completedTrips ??
                    0
                ),

                remainingTrips: Number(
                    form.contractDetails
                        ?.remainingTrips ??
                    0
                ),
            }
            : {
                contractNumber: null,
                validityFrom: null,
                validityTo: null,
                totalTrips: null,
                completedTrips: "0",
                remainingTrips: 0,
            },

    customerDetails: {
        customerCode:
            form.customerDetails
                ?.customerCode ||
            "",

        customerName:
            form.customerDetails
                ?.customerName ||
            "",

        gstNumber: nullIfEmpty(
            form.customerDetails?.gstNumber
        ),

        contactPerson:
            form.customerDetails
                ?.contactPerson ||
            "",

        mobileNumber:
            form.customerDetails
                ?.mobileNumber ||
            "",

        email: nullIfEmpty(
            form.customerDetails?.email
        ),
    },

    loadDetails: {
        ...form.loadDetails,

        quantity: Number(
            form.loadDetails?.quantity || 0
        ),

        weight: Number(
            form.loadDetails?.weight || 0
        ),

        ewayBillDetails: {
            ...form.loadDetails
                ?.ewayBillDetails,

            ewayBillRequired: toBoolean(
                form.loadDetails
                    ?.ewayBillDetails
                    ?.ewayBillRequired
            ),
        },
    },

    pickupDetails: {
        ...form.pickupDetails,

        pickupStateCode:
            form.pickupDetails
                ?.pickupStateCode ||
            form.pickupDetails
                ?.pickupState
                ?.isoCode ||
            "",

        pickupStateName:
            form.pickupDetails
                ?.pickupStateName ||
            form.pickupDetails
                ?.pickupState
                ?.name?.en ||
            "",

        pickupCityName:
            form.pickupDetails
                ?.pickupCityName ||
            form.pickupDetails
                ?.pickupCity
                ?.name?.en ||
            "",

        pickupLocation:
            form.pickupDetails
                ?.pickupLocation ||
            form.pickupDetails
                ?.pickupCityName ||
            form.pickupDetails
                ?.pickupCity
                ?.name?.en ||
            "",
    },

    deliveryDetails: {
        ...form.deliveryDetails,

        deliveryStateCode:
            form.deliveryDetails
                ?.deliveryStateCode ||
            form.deliveryDetails
                ?.deliveryState
                ?.isoCode ||
            "",

        deliveryStateName:
            form.deliveryDetails
                ?.deliveryStateName ||
            form.deliveryDetails
                ?.deliveryState
                ?.name?.en ||
            "",

        deliveryCityName:
            form.deliveryDetails
                ?.deliveryCityName ||
            form.deliveryDetails
                ?.deliveryCity
                ?.name?.en ||
            "",

        deliveryLocation:
            form.deliveryDetails
                ?.deliveryLocation ||
            form.deliveryDetails
                ?.deliveryCityName ||
            form.deliveryDetails
                ?.deliveryCity
                ?.name?.en ||
            "",
    },

    routeDetails: {
        ...form.routeDetails,

        routeDistanceKm: Number(
            form.routeDetails
                ?.routeDistanceKm ||
            0
        ),

        expectedTollAmount: Number(
            form.routeDetails
                ?.expectedTollAmount ||
            0
        ),
    },

    vehicleRequirement: {
        ...form.vehicleRequirement,

        numberOfVehicles: Number(
            form.vehicleRequirement
                ?.numberOfVehicles ||
            1
        ),
    },

    freightDetails: {
        ...form.freightDetails,

        freightPerTon: Number(
            form.freightDetails
                ?.freightPerTon ||
            0
        ),

        expectedFreight: Number(
            form.freightDetails
                ?.expectedFreight ||
            0
        ),

        advanceAmount: Number(
            form.freightDetails
                ?.advanceAmount ||
            0
        ),

        balanceAmount:
            computeFreightBalance(
                form.freightDetails
                    ?.expectedFreight,

                form.freightDetails
                    ?.advanceAmount
            ),
    },

    brokerDetails: {
        ...form.brokerDetails,

        brokerRequired: toBoolean(
            form.brokerDetails
                ?.brokerRequired
        ),

        brokerCommission: Number(
            form.brokerDetails
                ?.brokerCommission ||
            0
        ),
    },

    riskAndInsurance: {
        ...form.riskAndInsurance,

        insuranceRequired: toBoolean(
            form.riskAndInsurance
                ?.insuranceRequired
        ),

        insuranceAmount: Number(
            form.riskAndInsurance
                ?.insuranceAmount ||
            0
        ),
    },

    trackingPreferences: {
        ...form.trackingPreferences,

        gpsTrackingRequired: toBoolean(
            form.trackingPreferences
                ?.gpsTrackingRequired
        ),

        podRequired: toBoolean(
            form.trackingPreferences
                ?.podRequired
        ),

        liveTrackingEnabled: toBoolean(
            form.trackingPreferences
                ?.liveTrackingEnabled
        ),
    },
});

/* =====================================================
   GENERAL HELPERS
===================================================== */

const getVoucherFromRecord = (
    record: any
) =>
    record?.transportOrderVoucherNumber ||
    record?.transportOrderNumber ||
    record?.voucherNumber ||
    record?.orderNumber ||
    "";

const getOrderFromResponse = (
    response: any,
    voucherNumber: string
) => {
    const candidates = [
        response?.transportOrder,
        response?.data?.transportOrder,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate)
        ) {
            const candidateVoucher =
                getVoucherFromRecord(candidate);

            if (
                !candidateVoucher ||
                candidateVoucher === voucherNumber
            ) {
                return candidate;
            }
        }
    }

    return null;
};

const getRecords = (
    response: any
): any[] => {
    const root =
        response?.data?.data ??
        response?.data ??
        response ??
        {};

    if (Array.isArray(root)) {
        return root;
    }

    if (Array.isArray(root?.records)) {
        return root.records;
    }

    if (Array.isArray(root?.items)) {
        return root.items;
    }

    if (
        Array.isArray(
            response?.data?.records
        )
    ) {
        return response.data.records;
    }

    if (
        Array.isArray(
            response?.data?.items
        )
    ) {
        return response.data.items;
    }

    return [];
};

const toDateTimeLocal = (
    value: any
): string => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset =
        date.getTimezoneOffset();

    return new Date(
        date.getTime() -
        offset * 60 * 1000
    )
        .toISOString()
        .slice(0, 16);
};

const toDateInput = (
    value: any
): string => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date
        .toISOString()
        .slice(0, 10);
};

const getErrorMessage = (
    error: any,
    fallback: string
) =>
    error?.response?.data?.message ||
    error?.message ||
    error?.payload?.message ||
    fallback;

/* =====================================================
   SMALL UI COMPONENTS
===================================================== */

const FieldShell = ({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: ReactNode;
}) => (
    <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-semibold text-card-foreground">
            {label}

            {required ? (
                <span className="ml-1 text-destructive">
                    *
                </span>
            ) : null}
        </span>

        {children}
    </label>
);

const baseControlClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

const TextField = ({
    label,
    value,
    onChange,
    type = "text",
    required,
    disabled,
    placeholder,
}: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}) => (
    <FieldShell
        label={label}
        required={required}
    >
        <input
            type={type}
            value={value ?? ""}
            onChange={event =>
                onChange(event.target.value)
            }
            disabled={disabled}
            placeholder={
                placeholder || label
            }
            className={baseControlClass}
        />
    </FieldShell>
);

const TextAreaField = ({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    disabled?: boolean;
}) => (
    <FieldShell label={label}>
        <textarea
            value={value ?? ""}
            onChange={event =>
                onChange(event.target.value)
            }
            disabled={disabled}
            rows={4}
            className={`${baseControlClass} h-auto min-h-[96px] resize-y py-2`}
        />
    </FieldShell>
);

const SelectField = ({
    label,
    value,
    onChange,
    options,
    required,
    disabled,
    placeholder = "Select",
}: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    options: Option[];
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}) => (
    <FieldShell
        label={label}
        required={required}
    >
        <select
            value={value ?? ""}
            onChange={event =>
                onChange(event.target.value)
            }
            disabled={disabled}
            className={baseControlClass}
        >
            <option value="">
                {placeholder}
            </option>

            {options.map(option => (
                <option
                    key={`${label}-${option.value}`}
                    value={option.value}
                >
                    {option.label}
                </option>
            ))}
        </select>
    </FieldShell>
);

const ToggleField = ({
    label,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    checked: boolean;
    onChange: (
        checked: boolean
    ) => void;
    disabled?: boolean;
}) => (
    <div className="flex min-h-10 items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
        <span className="text-sm font-semibold text-card-foreground">
            {label}
        </span>

        <button
            type="button"
            disabled={disabled}
            onClick={() =>
                onChange(!checked)
            }
            className={`relative h-6 w-11 rounded-full transition ${checked
                ? "bg-primary"
                : "bg-muted-foreground/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-pressed={checked}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked
                    ? "left-[22px]"
                    : "left-0.5"
                    }`}
            />
        </button>
    </div>
);

const StepCard = ({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) => (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-5 border-b border-border pb-3 text-lg font-bold text-card-foreground">
            {title}
        </h2>

        {children}
    </section>
);

const FieldGrid = ({
    children,
}: {
    children: ReactNode;
}) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
    </div>
);

/* =====================================================
   PAGE
===================================================== */

const CreateEditTransportOrder = ({
    embedded = false,
    mode: propMode,
    voucherNumber: propVoucherNumber,
    orderData: propOrderData,
    onClose,
    onSaved,
}: CreateEditTransportOrderProps) => {
    const dispatch =
        useDispatch<any>();

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const {
        voucherNumber:
        routeVoucherNumber,
    } = useParams<{
        voucherNumber?: string;
    }>();

    const routeState =
        (location.state || {}) as RouteState;

    const voucherNumber =
        propVoucherNumber ||
        routeState.voucherNumber ||
        routeVoucherNumber ||
        "";

    const mode: PageMode =
        propMode ||
        routeState.mode ||
        (voucherNumber
            ? "edit"
            : "add");

    const isEdit =
        mode === "edit";

    const isView =
        mode === "view";

    const initialOrderData =
        propOrderData ||
        routeState.orderData;

    const [form, setForm] =
        useState<any>(() =>
            mergeTransportOrderForm(
                initialOrderData ||
                createInitialTransportOrder()
            )
        );

    const [step, setStep] =
        useState(0);

    const [
        pageLoading,
        setPageLoading,
    ] = useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [
        stateRecords,
        setStateRecords,
    ] = useState<any[]>([]);

    const [
        pickupCityRecords,
        setPickupCityRecords,
    ] = useState<any[]>([]);

    const [
        deliveryCityRecords,
        setDeliveryCityRecords,
    ] = useState<any[]>([]);

    const [
        statesLoading,
        setStatesLoading,
    ] = useState(false);

    const [
        pickupCitiesLoading,
        setPickupCitiesLoading,
    ] = useState(false);

    const [
        deliveryCitiesLoading,
        setDeliveryCitiesLoading,
    ] = useState(false);

    const closeScreen = () => {
        if (embedded) {
            onClose?.();
            return;
        }

        navigate(-1);
    };

    const { accounts = [] } =
        useSelector(
            (state: any) =>
                state.accountMaster ||
                {}
        );

    const customerOptions =
        useMemo<Option[]>(() => {
            return (accounts || [])
                .map((item: any) => ({
                    label:
                        item?.accountName ||
                        "-",

                    value:
                        item?.accountCode ||
                        "",
                }))
                .filter(
                    (item: Option) =>
                        item.value
                );
        }, [accounts]);

    const stateOptions =
        useMemo<Option[]>(() => {
            return stateRecords
                .map(item => ({
                    label:
                        item?.name?.en ||
                        item?.name ||
                        "-",

                    value:
                        item?.isoCode ||
                        "",
                }))
                .filter(item => item.value);
        }, [stateRecords]);

    const pickupCityOptions =
        useMemo<Option[]>(() => {
            return pickupCityRecords
                .map(item => ({
                    label:
                        item?.name?.en ||
                        item?.name ||
                        "-",

                    value:
                        item?.name?.en ||
                        item?.name ||
                        "",
                }))
                .filter(item => item.value);
        }, [pickupCityRecords]);

    const deliveryCityOptions =
        useMemo<Option[]>(() => {
            return deliveryCityRecords
                .map(item => ({
                    label:
                        item?.name?.en ||
                        item?.name ||
                        "-",

                    value:
                        item?.name?.en ||
                        item?.name ||
                        "",
                }))
                .filter(item => item.value);
        }, [deliveryCityRecords]);

    const title = isView
        ? "View Transport Order"
        : isEdit
            ? "Edit Transport Order"
            : "Create Transport Order";

    const balanceAmount =
        useMemo(() => {
            return computeFreightBalance(
                form.freightDetails
                    ?.expectedFreight,

                form.freightDetails
                    ?.advanceAmount
            );
        }, [
            form.freightDetails
                ?.expectedFreight,

            form.freightDetails
                ?.advanceAmount,
        ]);

    const update = useCallback(
        (
            section: string,
            key: string,
            value: any
        ) => {
            setForm((previous: any) => ({
                ...previous,

                [section]: {
                    ...previous[section],
                    [key]: value,
                },
            }));
        },
        []
    );

    const updateNested = useCallback(
        (
            section: string,
            nested: string,
            key: string,
            value: any
        ) => {
            setForm((previous: any) => ({
                ...previous,

                [section]: {
                    ...previous[section],

                    [nested]: {
                        ...previous[section][
                        nested
                        ],

                        [key]: value,
                    },
                },
            }));
        },
        []
    );

    const fetchStates =
        useCallback(async () => {
            try {
                setStatesLoading(true);

                const response =
                    await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/statesMaster",
                        {
                            params: {
                                search: "",
                            },
                        }
                    );

                setStateRecords(
                    getRecords(response)
                );
            } catch (fetchError) {
                setError(
                    getErrorMessage(
                        fetchError,
                        "Failed to load states."
                    )
                );
            } finally {
                setStatesLoading(false);
            }
        }, []);

    const fetchCities = useCallback(
        async (
            stateCode: string,
            target:
                | "pickup"
                | "delivery"
        ) => {
            if (!stateCode) {
                if (
                    target === "pickup"
                ) {
                    setPickupCityRecords(
                        []
                    );
                } else {
                    setDeliveryCityRecords(
                        []
                    );
                }

                return;
            }

            try {
                if (
                    target === "pickup"
                ) {
                    setPickupCitiesLoading(
                        true
                    );
                } else {
                    setDeliveryCitiesLoading(
                        true
                    );
                }

                const response =
                    await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/citiesByStateCode",
                        {
                            params: {
                                stateCode,
                                search: "",
                            },
                        }
                    );

                const records =
                    getRecords(response);

                if (
                    target === "pickup"
                ) {
                    setPickupCityRecords(
                        records
                    );
                } else {
                    setDeliveryCityRecords(
                        records
                    );
                }
            } catch (fetchError) {
                setError(
                    getErrorMessage(
                        fetchError,
                        "Failed to load cities."
                    )
                );
            } finally {
                if (
                    target === "pickup"
                ) {
                    setPickupCitiesLoading(
                        false
                    );
                } else {
                    setDeliveryCitiesLoading(
                        false
                    );
                }
            }
        },
        []
    );

    useEffect(() => {
        if (!propOrderData) {
            return;
        }

        const merged =
            mergeTransportOrderForm(
                propOrderData
            );

        setForm(merged);
        setStep(0);
        setMessage("");
        setError("");

        if (
            merged.pickupDetails
                ?.pickupStateCode
        ) {
            fetchCities(
                merged.pickupDetails
                    .pickupStateCode,
                "pickup"
            );
        }

        if (
            merged.deliveryDetails
                ?.deliveryStateCode
        ) {
            fetchCities(
                merged.deliveryDetails
                    .deliveryStateCode,
                "delivery"
            );
        }
    }, [
        fetchCities,
        propOrderData,
    ]);

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType: "customer",
            } as any)
        );

        fetchStates();
    }, [
        dispatch,
        fetchStates,
    ]);

    useEffect(() => {
        const loadOrder =
            async () => {
                if (
                    !voucherNumber ||
                    (!isEdit &&
                        !isView) ||
                    propOrderData
                ) {
                    return;
                }

                try {
                    setPageLoading(true);
                    setError("");

                    const response =
                        await dispatch(
                            getTransportOrderByVoucherNumber(
                                voucherNumber
                            )
                        ).unwrap();

                    const record =
                        getOrderFromResponse(
                            response,
                            voucherNumber
                        );

                    if (!record) {
                        setError(
                            "Transport order details were not found."
                        );

                        return;
                    }

                    const merged =
                        mergeTransportOrderForm(
                            record
                        );

                    setForm(merged);

                    if (
                        merged
                            .pickupDetails
                            ?.pickupStateCode
                    ) {
                        fetchCities(
                            merged
                                .pickupDetails
                                .pickupStateCode,
                            "pickup"
                        );
                    }

                    if (
                        merged
                            .deliveryDetails
                            ?.deliveryStateCode
                    ) {
                        fetchCities(
                            merged
                                .deliveryDetails
                                .deliveryStateCode,
                            "delivery"
                        );
                    }
                } catch (loadError) {
                    setError(
                        getErrorMessage(
                            loadError,
                            "Failed to load transport order details."
                        )
                    );
                } finally {
                    setPageLoading(false);
                }
            };

        loadOrder();
    }, [
        dispatch,
        fetchCities,
        isEdit,
        isView,
        propOrderData,
        voucherNumber,
    ]);

    useEffect(() => {
        if (step !== 2) {
            return;
        }

        setForm((previous: any) => ({
            ...previous,

            pickupDetails: {
                ...previous.pickupDetails,

                pickupContactName:
                    previous
                        .pickupDetails
                        .pickupContactName ||
                    previous
                        .customerDetails
                        .customerName ||
                    previous
                        .customerDetails
                        .contactPerson ||
                    "",

                pickupContactNumber:
                    previous
                        .pickupDetails
                        .pickupContactNumber ||
                    previous
                        .customerDetails
                        .mobileNumber ||
                    "",
            },
        }));
    }, [step]);

    useEffect(() => {
        if (step !== 3) {
            return;
        }

        setForm((previous: any) => ({
            ...previous,

            deliveryDetails: {
                ...previous.deliveryDetails,

                deliveryContactName:
                    previous
                        .deliveryDetails
                        .deliveryContactName ||
                    previous
                        .customerDetails
                        .customerName ||
                    previous
                        .customerDetails
                        .contactPerson ||
                    "",

                deliveryContactNumber:
                    previous
                        .deliveryDetails
                        .deliveryContactNumber ||
                    previous
                        .customerDetails
                        .mobileNumber ||
                    "",
            },
        }));
    }, [step]);

    const selectCustomer = (
        accountCode: string
    ) => {
        const selected =
            (accounts || []).find(
                (account: any) =>
                    account?.accountCode ===
                    accountCode
            );

        setForm((previous: any) => ({
            ...previous,

            customerDetails: {
                ...previous.customerDetails,

                customerCode:
                    selected?.accountCode ||
                    accountCode ||
                    "",

                customerName:
                    selected?.accountName ||
                    "",

                contactPerson:
                    selected?.accountName ||
                    "",

                gstNumber:
                    selected?.gstNumber ||
                    selected?.gstin ||
                    selected?.GSTNumber ||
                    "",

                mobileNumber:
                    selected?.mobileNumber ||
                    selected
                        ?.accountMobile ||
                    selected?.mobile ||
                    selected?.phone ||
                    "",

                email:
                    selected?.email ||
                    selected
                        ?.accountEmail ||
                    selected?.emailId ||
                    "",
            },

            pickupDetails: {
                ...previous.pickupDetails,

                pickupContactName:
                    selected?.accountName ||
                    "",

                pickupContactNumber:
                    selected?.mobileNumber ||
                    selected
                        ?.accountMobile ||
                    "",
            },

            deliveryDetails: {
                ...previous.deliveryDetails,

                deliveryContactName:
                    selected?.accountName ||
                    "",

                deliveryContactNumber:
                    selected?.mobileNumber ||
                    selected
                        ?.accountMobile ||
                    "",
            },
        }));
    };

    const validateStep = (
        stepIndex: number
    ): boolean => {
        setError("");

        if (stepIndex === 0) {
            if (
                normalizeOrderType(
                    form.orderType
                ) === "contract" &&
                !form.contractDetails
                    ?.contractNumber
            ) {
                setError(
                    "Contract is required."
                );

                return false;
            }

            if (
                !form.customerDetails
                    ?.customerName
            ) {
                setError(
                    "Customer name is required."
                );

                return false;
            }

            if (
                !form.customerDetails
                    ?.mobileNumber
            ) {
                setError(
                    "Mobile number is required."
                );

                return false;
            }
        }

        if (stepIndex === 1) {
            if (
                !form.loadDetails
                    ?.loadType
            ) {
                setError(
                    "Load type is required."
                );

                return false;
            }

            if (
                !form.loadDetails
                    ?.materialName
            ) {
                setError(
                    "Material name is required."
                );

                return false;
            }
        }

        if (stepIndex === 2) {
            if (
                !form.pickupDetails
                    ?.pickupStateCode
            ) {
                setError(
                    "Pickup state is required."
                );

                return false;
            }

            if (
                !form.pickupDetails
                    ?.pickupCityName
            ) {
                setError(
                    "Pickup city is required."
                );

                return false;
            }

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const pickupDate =
                new Date(
                    form.pickupDetails
                        ?.pickupDateTime
                );

            pickupDate.setHours(
                0,
                0,
                0,
                0
            );

            if (
                pickupDate < today
            ) {
                setError(
                    "Pickup date cannot be in the past."
                );

                return false;
            }
        }

        if (stepIndex === 3) {
            if (
                !form.deliveryDetails
                    ?.deliveryStateCode
            ) {
                setError(
                    "Delivery state is required."
                );

                return false;
            }

            if (
                !form.deliveryDetails
                    ?.deliveryCityName
            ) {
                setError(
                    "Delivery city is required."
                );

                return false;
            }

            const pickupDate =
                new Date(
                    form.pickupDetails
                        ?.pickupDateTime
                );

            const deliveryDate =
                new Date(
                    form.deliveryDetails
                        ?.expectedDeliveryDateTime
                );

            if (
                deliveryDate <
                pickupDate
            ) {
                setError(
                    "Delivery date cannot be earlier than pickup date."
                );

                return false;
            }
        }

        if (stepIndex === 4) {
            const loadWeight =
                Number(
                    form.loadDetails
                        ?.weight ||
                    0
                );

            const loadWeightTon =
                form.loadDetails
                    ?.weightUnit === "Kg"
                    ? loadWeight / 1000
                    : loadWeight;

            const vehicleCapacity =
                Number(
                    form.vehicleRequirement
                        ?.vehicleCapacity ||
                    0
                );

            if (
                loadWeightTon > 0 &&
                vehicleCapacity > 0 &&
                vehicleCapacity <
                loadWeightTon
            ) {
                setError(
                    "Vehicle capacity must be greater than or equal to load weight."
                );

                return false;
            }
        }

        if (stepIndex === 5) {
            if (
                Number(
                    form.freightDetails
                        ?.freightPerTon ||
                    0
                ) <= 0 ||
                Number(
                    form.freightDetails
                        ?.expectedFreight ||
                    0
                ) <= 0
            ) {
                setError(
                    "Freight Per Ton and Expected Freight are required."
                );

                return false;
            }
        }

        return true;
    };

    const validateAllSteps = () => {
        for (
            let index = 0;
            index < STEPS.length;
            index += 1
        ) {
            if (!validateStep(index)) {
                setStep(index);
                return false;
            }
        }

        return true;
    };

    const next = () => {
        if (
            !isView &&
            !validateStep(step)
        ) {
            return;
        }

        setStep(previous =>
            Math.min(
                previous + 1,
                STEPS.length - 1
            )
        );
    };

    const back = () => {
        setError("");

        setStep(previous =>
            Math.max(
                previous - 1,
                0
            )
        );
    };

    const handleSave = async () => {
        if (isView) {
            closeScreen();
            return;
        }

        if (!validateAllSteps()) {
            return;
        }

        try {
            setPageLoading(true);
            setError("");
            setMessage("");

            const payload =
                toTransportOrderPayload(
                    form
                );

            if (isEdit) {
                if (!voucherNumber) {
                    setError(
                        "Voucher number is missing for update."
                    );

                    return;
                }

                await dispatch(
                    updateTransportOrderByVoucherNumber(
                        {
                            voucherNumber,
                            payload,
                        }
                    )
                ).unwrap();

                setMessage(
                    "Transport order updated successfully."
                );
            } else {
                await dispatch(
                    createTransportOrder(
                        payload
                    )
                ).unwrap();

                setMessage(
                    "Transport order created successfully."
                );
            }

            if (embedded) {
                onSaved?.();
            } else {
                window.setTimeout(
                    () => navigate(-1),
                    500
                );
            }
        } catch (saveError) {
            setError(
                getErrorMessage(
                    saveError,

                    isEdit
                        ? "Failed to update transport order."
                        : "Failed to create transport order."
                )
            );
        } finally {
            setPageLoading(false);
        }
    };

    const renderCustomerStep = () => (
        <StepCard title="Customer Details">
            <FieldGrid>
                <SelectField
                    label="Order Type"
                    required
                    value={normalizeOrderType(
                        form.orderType
                    )}
                    onChange={value => {
                        setForm(
                            (previous: any) => ({
                                ...previous,

                                orderType:
                                    value,

                                contractDetails:
                                    value ===
                                        "contract"
                                        ? previous.contractDetails
                                        : createInitialTransportOrder()
                                            .contractDetails,
                            })
                        );
                    }}
                    options={
                        orderTypeOptions
                    }
                    disabled={isView}
                />

                {normalizeOrderType(
                    form.orderType
                ) === "contract" ? (
                    <>
                        <TextField
                            label="Contract Number"
                            required
                            value={
                                form
                                    .contractDetails
                                    ?.contractNumber
                            }
                            onChange={value =>
                                update(
                                    "contractDetails",
                                    "contractNumber",
                                    value
                                )
                            }
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="Validity From"
                            type="date"
                            value={toDateInput(
                                form
                                    .contractDetails
                                    ?.validityFrom
                            )}
                            onChange={value =>
                                update(
                                    "contractDetails",
                                    "validityFrom",
                                    value
                                )
                            }
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="Validity To"
                            type="date"
                            value={toDateInput(
                                form
                                    .contractDetails
                                    ?.validityTo
                            )}
                            onChange={value =>
                                update(
                                    "contractDetails",
                                    "validityTo",
                                    value
                                )
                            }
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="Total Trips"
                            type="number"
                            value={
                                form
                                    .contractDetails
                                    ?.totalTrips
                            }
                            onChange={value => {
                                const completed =
                                    Number(
                                        form
                                            .contractDetails
                                            ?.completedTrips ||
                                        0
                                    );

                                setForm(
                                    (
                                        previous: any
                                    ) => ({
                                        ...previous,

                                        contractDetails:
                                        {
                                            ...previous.contractDetails,

                                            totalTrips:
                                                value,

                                            remainingTrips:
                                                computeRemainingTrips(
                                                    value,
                                                    completed
                                                ),
                                        },
                                    })
                                );
                            }}
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="Completed Trips"
                            type="number"
                            value={
                                form
                                    .contractDetails
                                    ?.completedTrips
                            }
                            onChange={value => {
                                const total =
                                    Number(
                                        form
                                            .contractDetails
                                            ?.totalTrips ||
                                        0
                                    );

                                setForm(
                                    (
                                        previous: any
                                    ) => ({
                                        ...previous,

                                        contractDetails:
                                        {
                                            ...previous.contractDetails,

                                            completedTrips:
                                                value,

                                            remainingTrips:
                                                computeRemainingTrips(
                                                    total,
                                                    value
                                                ),
                                        },
                                    })
                                );
                            }}
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="Remaining Trips"
                            type="number"
                            value={
                                form
                                    .contractDetails
                                    ?.remainingTrips
                            }
                            onChange={() =>
                                undefined
                            }
                            disabled
                        />
                    </>
                ) : null}

                <SelectField
                    label="Customer Name"
                    required
                    value={
                        form.customerDetails
                            ?.customerCode
                    }
                    onChange={
                        selectCustomer
                    }
                    options={
                        customerOptions
                    }
                    disabled={isView}
                    placeholder="Select customer"
                />

                <TextField
                    label="GST Number"
                    value={
                        form.customerDetails
                            ?.gstNumber
                    }
                    onChange={value =>
                        update(
                            "customerDetails",
                            "gstNumber",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Contact Person"
                    required
                    value={
                        form.customerDetails
                            ?.contactPerson
                    }
                    onChange={value =>
                        update(
                            "customerDetails",
                            "contactPerson",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Mobile Number"
                    required
                    type="tel"
                    value={
                        form.customerDetails
                            ?.mobileNumber
                    }
                    onChange={value =>
                        update(
                            "customerDetails",
                            "mobileNumber",
                            value.replace(
                                /[^0-9]/g,
                                ""
                            )
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Email"
                    type="email"
                    value={
                        form.customerDetails
                            ?.email
                    }
                    onChange={value =>
                        update(
                            "customerDetails",
                            "email",
                            value
                        )
                    }
                    disabled={isView}
                />
            </FieldGrid>
        </StepCard>
    );

    const renderLoadStep = () => (
        <StepCard title="Load Details">
            <FieldGrid>
                <SelectField
                    label="Load Type"
                    required
                    value={
                        form.loadDetails
                            ?.loadType
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "loadType",
                            value
                        )
                    }
                    options={
                        loadTypeOptions
                    }
                    disabled={isView}
                />

                <TextField
                    label="Material Name"
                    required
                    value={
                        form.loadDetails
                            ?.materialName
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "materialName",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Material Category"
                    value={
                        form.loadDetails
                            ?.materialCategory
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "materialCategory",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Quantity"
                    type="number"
                    value={
                        form.loadDetails
                            ?.quantity
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "quantity",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Weight"
                    type="number"
                    value={
                        form.loadDetails
                            ?.weight
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "weight",
                            value
                        )
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Weight Unit"
                    value={
                        form.loadDetails
                            ?.weightUnit
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "weightUnit",
                            value
                        )
                    }
                    options={
                        weightUnitOptions
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Packaging Type"
                    value={
                        form.loadDetails
                            ?.packagingType
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "packagingType",
                            value
                        )
                    }
                    options={
                        packagingOptions
                    }
                    disabled={isView}
                />

                <TextField
                    label="Invoice Number"
                    value={
                        form.loadDetails
                            ?.invoiceNumber
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "invoiceNumber",
                            value
                        )
                    }
                    disabled={isView}
                />

                <ToggleField
                    label="E-Way Bill Required"
                    checked={Boolean(
                        form.loadDetails
                            ?.ewayBillDetails
                            ?.ewayBillRequired
                    )}
                    onChange={value =>
                        updateNested(
                            "loadDetails",
                            "ewayBillDetails",
                            "ewayBillRequired",
                            value
                        )
                    }
                    disabled={isView}
                />

                {form.loadDetails
                    ?.ewayBillDetails
                    ?.ewayBillRequired ? (
                    <>
                        <SelectField
                            label="E-Way Bill Generated By"
                            value={
                                form
                                    .loadDetails
                                    ?.ewayBillDetails
                                    ?.ewayBillGeneratedBy
                            }
                            onChange={value =>
                                updateNested(
                                    "loadDetails",
                                    "ewayBillDetails",
                                    "ewayBillGeneratedBy",
                                    value
                                )
                            }
                            options={
                                ewayBillGeneratedByOptions
                            }
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="E-Way Bill Number"
                            value={
                                form
                                    .loadDetails
                                    ?.ewayBillDetails
                                    ?.ewayBillNumber
                            }
                            onChange={value =>
                                updateNested(
                                    "loadDetails",
                                    "ewayBillDetails",
                                    "ewayBillNumber",
                                    value
                                )
                            }
                            disabled={
                                isView
                            }
                        />

                        <TextField
                            label="E-Way Bill Date"
                            type="date"
                            value={toDateInput(
                                form
                                    .loadDetails
                                    ?.ewayBillDetails
                                    ?.ewayBillDate
                            )}
                            onChange={value =>
                                updateNested(
                                    "loadDetails",
                                    "ewayBillDetails",
                                    "ewayBillDate",
                                    new Date(
                                        value
                                    ).toISOString()
                                )
                            }
                            disabled={
                                isView
                            }
                        />
                    </>
                ) : null}
            </FieldGrid>

            <div className="mt-4">
                <TextAreaField
                    label="Special Handling / Instructions"
                    value={
                        form.loadDetails
                            ?.specialHandlingInstructions
                    }
                    onChange={value =>
                        update(
                            "loadDetails",
                            "specialHandlingInstructions",
                            value
                        )
                    }
                    disabled={isView}
                />
            </div>
        </StepCard>
    );

    const renderPickupStep = () => (
        <StepCard title="Pickup Details">
            <FieldGrid>
                <SelectField
                    label="State"
                    required
                    value={
                        form.pickupDetails
                            ?.pickupStateCode
                    }
                    onChange={value => {
                        const selectedState =
                            stateRecords.find(
                                item =>
                                    String(
                                        item?.isoCode ||
                                        ""
                                    ).toUpperCase() ===
                                    String(
                                        value ||
                                        ""
                                    ).toUpperCase()
                            ) || null;

                        setForm(
                            (previous: any) => ({
                                ...previous,

                                pickupDetails:
                                {
                                    ...previous.pickupDetails,

                                    pickupState:
                                        selectedState,

                                    pickupStateCode:
                                        selectedState
                                            ?.isoCode ||
                                        "",

                                    pickupStateName:
                                        selectedState
                                            ?.name
                                            ?.en ||
                                        selectedState
                                            ?.name ||
                                        "",

                                    pickupCity:
                                        null,

                                    pickupCityName:
                                        "",

                                    pickupLocation:
                                        "",
                                },
                            })
                        );

                        fetchCities(
                            value,
                            "pickup"
                        );
                    }}
                    options={
                        stateOptions
                    }
                    disabled={
                        isView ||
                        statesLoading
                    }
                    placeholder={
                        statesLoading
                            ? "Loading states..."
                            : "Select state"
                    }
                />

                <SelectField
                    label="City"
                    required
                    value={
                        form.pickupDetails
                            ?.pickupCityName
                    }
                    onChange={value => {
                        const selectedCity =
                            pickupCityRecords.find(
                                item =>
                                    String(
                                        item?.name
                                            ?.en ||
                                        item?.name ||
                                        ""
                                    ).toLowerCase() ===
                                    String(
                                        value ||
                                        ""
                                    ).toLowerCase()
                            ) || null;

                        setForm(
                            (previous: any) => ({
                                ...previous,

                                pickupDetails:
                                {
                                    ...previous.pickupDetails,

                                    pickupCity:
                                        selectedCity,

                                    pickupCityName:
                                        value,

                                    pickupLocation:
                                        value,
                                },
                            })
                        );
                    }}
                    options={
                        pickupCityOptions
                    }
                    disabled={
                        isView ||
                        !form
                            .pickupDetails
                            ?.pickupStateCode ||
                        pickupCitiesLoading
                    }
                    placeholder={
                        pickupCitiesLoading
                            ? "Loading cities..."
                            : "Select city"
                    }
                />

                <TextField
                    label="Pickup Date and Time"
                    required
                    type="datetime-local"
                    value={toDateTimeLocal(
                        form.pickupDetails
                            ?.pickupDateTime
                    )}
                    onChange={value =>
                        update(
                            "pickupDetails",
                            "pickupDateTime",
                            new Date(
                                value
                            ).toISOString()
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Contact Name"
                    value={
                        form.pickupDetails
                            ?.pickupContactName
                    }
                    onChange={value =>
                        update(
                            "pickupDetails",
                            "pickupContactName",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Contact Number"
                    type="tel"
                    value={
                        form.pickupDetails
                            ?.pickupContactNumber
                    }
                    onChange={value =>
                        update(
                            "pickupDetails",
                            "pickupContactNumber",
                            value.replace(
                                /[^0-9]/g,
                                ""
                            )
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Pincode"
                    value={
                        form.pickupDetails
                            ?.pickupPincode
                    }
                    onChange={value =>
                        update(
                            "pickupDetails",
                            "pickupPincode",
                            value
                        )
                    }
                    disabled={isView}
                />
            </FieldGrid>

            <div className="mt-4">
                <TextAreaField
                    label="Pickup Address"
                    value={
                        form.pickupDetails
                            ?.pickupAddress
                    }
                    onChange={value =>
                        update(
                            "pickupDetails",
                            "pickupAddress",
                            value
                        )
                    }
                    disabled={isView}
                />
            </div>
        </StepCard>
    );

    const renderDeliveryStep = () => (
        <StepCard title="Delivery and Route Details">
            <FieldGrid>
                <SelectField
                    label="State"
                    required
                    value={
                        form.deliveryDetails
                            ?.deliveryStateCode
                    }
                    onChange={value => {
                        const selectedState =
                            stateRecords.find(
                                item =>
                                    String(
                                        item?.isoCode ||
                                        ""
                                    ).toUpperCase() ===
                                    String(
                                        value ||
                                        ""
                                    ).toUpperCase()
                            ) || null;

                        setForm(
                            (previous: any) => ({
                                ...previous,

                                deliveryDetails:
                                {
                                    ...previous.deliveryDetails,

                                    deliveryState:
                                        selectedState,

                                    deliveryStateCode:
                                        selectedState
                                            ?.isoCode ||
                                        "",

                                    deliveryStateName:
                                        selectedState
                                            ?.name
                                            ?.en ||
                                        selectedState
                                            ?.name ||
                                        "",

                                    deliveryCity:
                                        null,

                                    deliveryCityName:
                                        "",

                                    deliveryLocation:
                                        "",
                                },
                            })
                        );

                        fetchCities(
                            value,
                            "delivery"
                        );
                    }}
                    options={
                        stateOptions
                    }
                    disabled={
                        isView ||
                        statesLoading
                    }
                    placeholder={
                        statesLoading
                            ? "Loading states..."
                            : "Select state"
                    }
                />

                <SelectField
                    label="City"
                    required
                    value={
                        form.deliveryDetails
                            ?.deliveryCityName
                    }
                    onChange={value => {
                        const selectedCity =
                            deliveryCityRecords.find(
                                item =>
                                    String(
                                        item?.name
                                            ?.en ||
                                        item?.name ||
                                        ""
                                    ).toLowerCase() ===
                                    String(
                                        value ||
                                        ""
                                    ).toLowerCase()
                            ) || null;

                        setForm(
                            (previous: any) => ({
                                ...previous,

                                deliveryDetails:
                                {
                                    ...previous.deliveryDetails,

                                    deliveryCity:
                                        selectedCity,

                                    deliveryCityName:
                                        value,

                                    deliveryLocation:
                                        value,
                                },
                            })
                        );
                    }}
                    options={
                        deliveryCityOptions
                    }
                    disabled={
                        isView ||
                        !form
                            .deliveryDetails
                            ?.deliveryStateCode ||
                        deliveryCitiesLoading
                    }
                    placeholder={
                        deliveryCitiesLoading
                            ? "Loading cities..."
                            : "Select city"
                    }
                />

                <TextField
                    label="Expected Delivery Date and Time"
                    required
                    type="datetime-local"
                    value={toDateTimeLocal(
                        form.deliveryDetails
                            ?.expectedDeliveryDateTime
                    )}
                    onChange={value =>
                        update(
                            "deliveryDetails",
                            "expectedDeliveryDateTime",
                            new Date(
                                value
                            ).toISOString()
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Contact Name"
                    value={
                        form.deliveryDetails
                            ?.deliveryContactName
                    }
                    onChange={value =>
                        update(
                            "deliveryDetails",
                            "deliveryContactName",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Contact Number"
                    type="tel"
                    value={
                        form.deliveryDetails
                            ?.deliveryContactNumber
                    }
                    onChange={value =>
                        update(
                            "deliveryDetails",
                            "deliveryContactNumber",
                            value.replace(
                                /[^0-9]/g,
                                ""
                            )
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Pincode"
                    value={
                        form.deliveryDetails
                            ?.deliveryPincode
                    }
                    onChange={value =>
                        update(
                            "deliveryDetails",
                            "deliveryPincode",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Route Distance (KM)"
                    type="number"
                    value={
                        form.routeDetails
                            ?.routeDistanceKm
                    }
                    onChange={value =>
                        update(
                            "routeDetails",
                            "routeDistanceKm",
                            value
                        )
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Route Type"
                    value={
                        form.routeDetails
                            ?.routeType
                    }
                    onChange={value =>
                        update(
                            "routeDetails",
                            "routeType",
                            value
                        )
                    }
                    options={
                        routeTypeOptions
                    }
                    disabled={isView}
                />

                <TextField
                    label="Expected Toll Amount"
                    type="number"
                    value={
                        form.routeDetails
                            ?.expectedTollAmount
                    }
                    onChange={value =>
                        update(
                            "routeDetails",
                            "expectedTollAmount",
                            value
                        )
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Priority"
                    value={form.priority}
                    onChange={value =>
                        setForm(
                            (previous: any) => ({
                                ...previous,
                                priority:
                                    value,
                            })
                        )
                    }
                    options={
                        priorityOptions
                    }
                    disabled={isView}
                />
            </FieldGrid>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TextAreaField
                    label="Delivery Address"
                    value={
                        form.deliveryDetails
                            ?.deliveryAddress
                    }
                    onChange={value =>
                        update(
                            "deliveryDetails",
                            "deliveryAddress",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextAreaField
                    label="Remarks"
                    value={form.remarks}
                    onChange={value =>
                        setForm(
                            (previous: any) => ({
                                ...previous,
                                remarks:
                                    value,
                            })
                        )
                    }
                    disabled={isView}
                />
            </div>
        </StepCard>
    );

    const renderVehicleStep = () => (
        <StepCard title="Vehicle Requirement">
            <FieldGrid>
                <SelectField
                    label="Vehicle Type"
                    value={
                        form.vehicleRequirement
                            ?.vehicleType
                    }
                    onChange={value =>
                        update(
                            "vehicleRequirement",
                            "vehicleType",
                            value
                        )
                    }
                    options={
                        vehicleTypeOptions
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Vehicle Body Type"
                    value={
                        form.vehicleRequirement
                            ?.vehicleBodyType
                    }
                    onChange={value =>
                        update(
                            "vehicleRequirement",
                            "vehicleBodyType",
                            value
                        )
                    }
                    options={
                        vehicleBodyTypeOptions
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Vehicle Capacity"
                    value={
                        form.vehicleRequirement
                            ?.vehicleCapacity
                    }
                    onChange={value =>
                        update(
                            "vehicleRequirement",
                            "vehicleCapacity",
                            value
                        )
                    }
                    options={
                        vehicleCapacityOptions
                    }
                    disabled={isView}
                />

                <TextField
                    label="Number of Vehicles"
                    type="number"
                    value={
                        form.vehicleRequirement
                            ?.numberOfVehicles
                    }
                    onChange={value =>
                        update(
                            "vehicleRequirement",
                            "numberOfVehicles",
                            value
                        )
                    }
                    disabled={isView}
                />
            </FieldGrid>

            <div className="mt-4">
                <TextAreaField
                    label="Special Vehicle Requirement"
                    value={
                        form.vehicleRequirement
                            ?.specialVehicleRequirement
                    }
                    onChange={value =>
                        update(
                            "vehicleRequirement",
                            "specialVehicleRequirement",
                            value
                        )
                    }
                    disabled={isView}
                />
            </div>
        </StepCard>
    );

    const renderFreightStep = () => (
        <StepCard title="Freight Details">
            <FieldGrid>
                <TextField
                    label="Freight Per Ton"
                    required
                    type="number"
                    value={
                        form.freightDetails
                            ?.freightPerTon
                    }
                    onChange={value =>
                        update(
                            "freightDetails",
                            "freightPerTon",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Expected Freight"
                    required
                    type="number"
                    value={
                        form.freightDetails
                            ?.expectedFreight
                    }
                    onChange={value =>
                        update(
                            "freightDetails",
                            "expectedFreight",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Advance Amount"
                    type="number"
                    value={
                        form.freightDetails
                            ?.advanceAmount
                    }
                    onChange={value =>
                        update(
                            "freightDetails",
                            "advanceAmount",
                            value
                        )
                    }
                    disabled={isView}
                />

                <TextField
                    label="Balance Amount"
                    type="number"
                    value={
                        balanceAmount
                    }
                    onChange={() =>
                        undefined
                    }
                    disabled
                />

                <SelectField
                    label="Payment Type"
                    value={
                        form.freightDetails
                            ?.paymentType
                    }
                    onChange={value =>
                        update(
                            "freightDetails",
                            "paymentType",
                            value
                        )
                    }
                    options={
                        paymentTypeOptions
                    }
                    disabled={isView}
                />

                <SelectField
                    label="Payment Mode"
                    value={
                        form.freightDetails
                            ?.paymentMode
                    }
                    onChange={value =>
                        update(
                            "freightDetails",
                            "paymentMode",
                            value
                        )
                    }
                    options={
                        paymentModeOptions
                    }
                    disabled={isView}
                />
            </FieldGrid>
        </StepCard>
    );

    const renderRiskStep = () => (
        <StepCard title="Risk, Broker and Tracking">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                    label="Broker Required"
                    checked={Boolean(
                        form.brokerDetails
                            ?.brokerRequired
                    )}
                    onChange={value =>
                        update(
                            "brokerDetails",
                            "brokerRequired",
                            value
                        )
                    }
                    disabled={isView}
                />

                <ToggleField
                    label="Insurance Required"
                    checked={Boolean(
                        form.riskAndInsurance
                            ?.insuranceRequired
                    )}
                    onChange={value =>
                        update(
                            "riskAndInsurance",
                            "insuranceRequired",
                            value
                        )
                    }
                    disabled={isView}
                />

                <ToggleField
                    label="GPS Tracking Required"
                    checked={Boolean(
                        form
                            .trackingPreferences
                            ?.gpsTrackingRequired
                    )}
                    onChange={value =>
                        update(
                            "trackingPreferences",
                            "gpsTrackingRequired",
                            value
                        )
                    }
                    disabled={isView}
                />

                <ToggleField
                    label="POD Required"
                    checked={Boolean(
                        form
                            .trackingPreferences
                            ?.podRequired
                    )}
                    onChange={value =>
                        update(
                            "trackingPreferences",
                            "podRequired",
                            value
                        )
                    }
                    disabled={isView}
                />

                <ToggleField
                    label="Live Tracking Enabled"
                    checked={Boolean(
                        form
                            .trackingPreferences
                            ?.liveTrackingEnabled
                    )}
                    onChange={value =>
                        update(
                            "trackingPreferences",
                            "liveTrackingEnabled",
                            value
                        )
                    }
                    disabled={isView}
                />
            </div>

            <div className="mt-4">
                <FieldGrid>
                    {form.brokerDetails
                        ?.brokerRequired ? (
                        <>
                            <TextField
                                label="Broker Code"
                                value={
                                    form
                                        .brokerDetails
                                        ?.brokerCode
                                }
                                onChange={value =>
                                    update(
                                        "brokerDetails",
                                        "brokerCode",
                                        value
                                    )
                                }
                                disabled={
                                    isView
                                }
                            />

                            <TextField
                                label="Broker Name"
                                value={
                                    form
                                        .brokerDetails
                                        ?.brokerName
                                }
                                onChange={value =>
                                    update(
                                        "brokerDetails",
                                        "brokerName",
                                        value
                                    )
                                }
                                disabled={
                                    isView
                                }
                            />

                            <TextField
                                label="Broker Commission"
                                type="number"
                                value={
                                    form
                                        .brokerDetails
                                        ?.brokerCommission
                                }
                                onChange={value =>
                                    update(
                                        "brokerDetails",
                                        "brokerCommission",
                                        value
                                    )
                                }
                                disabled={
                                    isView
                                }
                            />
                        </>
                    ) : null}

                    <SelectField
                        label="Risk Type"
                        value={
                            form
                                .riskAndInsurance
                                ?.riskType
                        }
                        onChange={value =>
                            update(
                                "riskAndInsurance",
                                "riskType",
                                value
                            )
                        }
                        options={
                            riskOptions
                        }
                        disabled={isView}
                    />

                    {form
                        .riskAndInsurance
                        ?.insuranceRequired ? (
                        <TextField
                            label="Insurance Amount"
                            type="number"
                            value={
                                form
                                    .riskAndInsurance
                                    ?.insuranceAmount
                            }
                            onChange={value =>
                                update(
                                    "riskAndInsurance",
                                    "insuranceAmount",
                                    value
                                )
                            }
                            disabled={
                                isView
                            }
                        />
                    ) : null}
                </FieldGrid>
            </div>
        </StepCard>
    );

    const renderStep = () => {
        switch (step) {
            case 0:
                return renderCustomerStep();

            case 1:
                return renderLoadStep();

            case 2:
                return renderPickupStep();

            case 3:
                return renderDeliveryStep();

            case 4:
                return renderVehicleStep();

            case 5:
                return renderFreightStep();

            case 6:
                return renderRiskStep();

            default:
                return null;
        }
    };

    const buttonLabel =
        useMemo(() => {
            if (isView) {
                return step ===
                    STEPS.length - 1
                    ? "Done"
                    : `Next: ${STEPS[
                    step + 1
                    ]
                    }`;
            }

            if (
                step ===
                STEPS.length - 1
            ) {
                return isEdit
                    ? "Update Order"
                    : "Save Order";
            }

            return `Next: ${STEPS[step + 1]
                }`;
        }, [
            isEdit,
            isView,
            step,
        ]);

    return (
        <main className="relative flex h-full min-h-0 flex-col bg-background text-foreground">
            {/* <header className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={
                            closeScreen
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition hover:bg-muted"
                        title="Back"
                    >
                        <ArrowLeft
                            size={18}
                        />
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-card-foreground">
                            {title}
                        </h1>

                        {voucherNumber ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Voucher:{" "}
                                {
                                    voucherNumber
                                }
                            </p>
                        ) : null}
                    </div>
                </div>

                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    Step {step + 1}{" "}
                    of {STEPS.length}
                </span>
            </header> */}

            <div className="min-h-0 flex-1 overflow-auto p-4 pb-28">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="mb-4 overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex min-w-[760px] items-start">
                            {STEPS.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const active =
                                        index ===
                                        step;

                                    const done =
                                        index <
                                        step;

                                    return (
                                        <div
                                            key={
                                                item
                                            }
                                            className="flex flex-1 items-start"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        isView ||
                                                        index <=
                                                        step
                                                    ) {
                                                        setError(
                                                            ""
                                                        );

                                                        setStep(
                                                            index
                                                        );
                                                    }
                                                }}
                                                className="flex min-w-[74px] flex-col items-center"
                                            >
                                                <span
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition ${done
                                                        ? "border-emerald-600 bg-emerald-600 text-white"
                                                        : active
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border bg-background text-muted-foreground"
                                                        }`}
                                                >
                                                    {done ? (
                                                        <Check
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    ) : (
                                                        index +
                                                        1
                                                    )}
                                                </span>

                                                <span
                                                    className={`mt-1 text-xs font-bold ${active
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {
                                                        item
                                                    }
                                                </span>
                                            </button>

                                            {index <
                                                STEPS.length -
                                                1 ? (
                                                <div
                                                    className={`mt-4 h-0.5 flex-1 ${done
                                                        ? "bg-emerald-600"
                                                        : "bg-border"
                                                        }`}
                                                />
                                            ) : null}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {error ? (
                        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                            {error}
                        </div>
                    ) : null}

                    {message ? (
                        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {message}
                        </div>
                    ) : null}

                    {pageLoading ? (
                        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                <LoaderCircle
                                    size={34}
                                    className="animate-spin text-primary"
                                />

                                <span className="text-sm font-semibold">
                                    Loading
                                    transport
                                    order...
                                </span>
                            </div>
                        </div>
                    ) : (
                        renderStep()
                    )}
                </div>
            </div>

            <footer
                className={
                    embedded
                        ? "absolute bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur"
                        : "fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur"
                }
            >
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={back}
                        disabled={
                            step === 0 ||
                            pageLoading
                        }
                        className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg border border-primary bg-background px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft
                            size={17}
                        />

                        Back
                    </button>

                    <button
                        type="button"
                        onClick={
                            step ===
                                STEPS.length - 1
                                ? handleSave
                                : next
                        }
                        disabled={
                            pageLoading
                        }
                        className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {pageLoading ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : step ===
                            STEPS.length -
                            1 &&
                            !isView ? (
                            <Save
                                size={17}
                            />
                        ) : (
                            <ArrowRight
                                size={17}
                            />
                        )}

                        {buttonLabel}
                    </button>
                </div>
            </footer>
        </main>
    );
};

export default CreateEditTransportOrder;