import {
    ArrowLeft,
    Award,
    BatteryCharging,
    Calendar,
    CheckCircle,
    Clipboard,
    CreditCard,
    FileText,
    MessageSquare,
    Plus,
    Shield,
    Trash2,
    Truck,
    Wrench,
    AlertTriangle,
    Disc,
} from "lucide-react";
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { renderField } from "../../../../components/inputs";

import {
    createEmptyBreakdown,
    createInitialVehicleMaintenance,
    getVehicleMaintenanceVoucher,
    mergeVehicleMaintenanceForm,
    toVehicleMaintenancePayload,
    validateVehicleMaintenanceForm,
} from "./vehicleMaintenanceInitialState";

import {
    createVehicleMaintenance,
    getVehicleMaintenanceByVoucherNumber,
    updateVehicleMaintenance,
} from "../../../../redux/slices/professionalSlice/transportation/vehicleMaintenanceEntrySlice";

import {
    getVehicleMasterVehicles,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";

import { getProfessionalUsers } from "../../../../redux/slices/professionalSlice/professionalUserSlice";
import {
    FormSectionCard,
    SectionCard
} from "../../../../components/SectionCards";

/* ===================================================
   OPTIONS
=================================================== */

const REMARKS_MAX = 200;

const maintenanceTypeOptions = [
    { label: "Preventive", value: "Preventive" },
    { label: "Corrective", value: "Corrective" },
    { label: "Breakdown", value: "Breakdown" },
    { label: "Accident Repair", value: "Accident Repair" },
];

const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Draft", value: "draft" },
];

const permitTypeOptions = [
    { label: "National Permit", value: "National Permit" },
    { label: "State Permit", value: "State Permit" },
    { label: "All India Permit", value: "All India Permit" },
    { label: "Local Permit", value: "Local Permit" },
];

const repairStatusOptions = [
    { label: "Resolved", value: "Resolved" },
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
];

const SECTION_KEYS = [
    "vehicleDriver",
    "pucDetails",
    "insuranceDetails",
    "passingDetails",
    "fitnessCertificateDetails",
    "permitDetails",
    "roadTaxDetails",
    "batteryDetails",
    "tyreDetails",
    "lastMaintenance",
    "breakdownDetails",
    "nextMaintenance",
    "documents",
    "remarks",
];

const createExpandedSectionsState = () =>
    Object.fromEntries(
        SECTION_KEYS.map((key) => [
            key,
            key === "vehicleDriver" || key === "lastMaintenance",
        ])
    );

/* ===================================================
   COMMON HELPERS
=================================================== */

const toDateInputValue = (value: any) => {
    if (!value) return "";

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
};

const getApiRecord = (res: any) => {
    const data = res?.data || res || {};

    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.records)) return data.records[0] || null;
    if (Array.isArray(data?.data?.records)) return data.data.records[0] || null;

    return data?.data || data || null;
};

const pickValue = (...values: any[]) => {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== "" &&
            String(value).trim() !== "undefined" &&
            String(value).trim() !== "null"
        ) {
            return value;
        }
    }

    return "";
};

const getInputValue = (input: any) => {
    if (input?.target) return input.target.value;
    if (input?.value !== undefined) return input.value;
    return input;
};

const getFullName = (user: any) =>
    [
        user?.userFirstName,
        user?.userMiddleName,
        user?.userLastName || user?.userSurname,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

const normalizeDriverUsers = (users: any[] = []) => {
    return (Array.isArray(users) ? users : [])
        .map((user: any) => {
            const customFields = user?.childUserCustomFields || {};
            const mobileNumber = String(user?.userMobileNumberHash || "").trim();
            const userType = String(user?.userType || "").toLowerCase();
            const isActive = String(user?.isUserActive || "") === "1";

            return {
                raw: user,
                driverId: mobileNumber,
                driverName: getFullName(user) || mobileNumber,
                mobileNumber,

                licenseNumber:
                    customFields?.licenseNumber ||
                    user?.licenseNumber ||
                    user?.drivingLicenseNumber ||
                    "",

                licenseExpiryDate:
                    customFields?.licenseExpiry ||
                    user?.licenseExpiryDate ||
                    user?.drivingLicenseExpiryDate ||
                    "",

                userType: user?.userType || "",
                status: customFields?.status || user?.status || "",
                isActive,
                hasParent: Boolean(user?.parentUserMobileNumber),
                isDriverType:
                    userType.includes("tax payer") ||
                    userType.includes("employee") ||
                    userType.includes("driver"),
            };
        })
        .filter((driver: any) => {
            return (
                driver.driverId &&
                driver.isActive &&
                driver.hasParent &&
                driver.isDriverType
            );
        });
};

const getRawVehicleData = (item: any = {}, mapped: any = {}) => {
    const raw =
        item?.fieldData ||
        item?.customFields ||
        item?.moduleData ||
        item?.data ||
        item?.vehicle ||
        item ||
        {};

    return {
        ...raw,
        ...mapped,
    };
};

const buildVehicleAutofillData = (selected: any, prevForm: any) => {
    const raw = selected?.rawData || {};
    const mapped = selected?.mappedVehicle || {};

    return mergeVehicleMaintenanceForm({
        ...prevForm,

        vehicleCode: pickValue(
            selected?.vehicleCode,
            mapped?.selectedVehicleId,
            mapped?.vehicleCode,
            mapped?.voucherNumber,
            raw?.vehicleCode,
            raw?.voucherNumber,
            selected?.value
        ),

        vehicleNumber: pickValue(
            selected?.vehicleNumber,
            mapped?.vehicleNumber,
            raw?.vehicleNumber,
            raw?.registrationNumber,
            prevForm?.vehicleNumber
        ),

        vehicleType: pickValue(
            selected?.vehicleType,
            mapped?.vehicleType,
            raw?.vehicleType,
            raw?.type,
            prevForm?.vehicleType
        ),

        driverCode: pickValue(
            raw?.driverCode,
            raw?.driverId,
            raw?.driver?.driverCode,
            raw?.driver?.driverId,
            prevForm?.driverCode
        ),

        driverName: pickValue(
            raw?.driverName,
            raw?.driver?.driverName,
            prevForm?.driverName
        ),

        pucDetails: {
            ...prevForm.pucDetails,
            certificateNumber: pickValue(
                raw?.pucDetails?.certificateNumber,
                raw?.puc?.certificateNumber,
                raw?.pucCertificateNumber,
                prevForm.pucDetails?.certificateNumber
            ),
            issueDate: pickValue(
                raw?.pucDetails?.issueDate,
                raw?.puc?.issueDate,
                prevForm.pucDetails?.issueDate
            ),
            expiryDate: pickValue(
                raw?.pucDetails?.expiryDate,
                raw?.puc?.expiryDate,
                raw?.puc?.validTill,
                prevForm.pucDetails?.expiryDate
            ),
        },

        insuranceDetails: {
            ...prevForm.insuranceDetails,
            insuranceCompany: pickValue(
                raw?.insuranceDetails?.insuranceCompany,
                raw?.insurance?.insuranceCompany,
                raw?.insuranceCompany,
                prevForm.insuranceDetails?.insuranceCompany
            ),
            policyNumber: pickValue(
                raw?.insuranceDetails?.policyNumber,
                raw?.insurance?.policyNumber,
                raw?.policyNumber,
                prevForm.insuranceDetails?.policyNumber
            ),
            issueDate: pickValue(
                raw?.insuranceDetails?.issueDate,
                raw?.insurance?.issueDate,
                prevForm.insuranceDetails?.issueDate
            ),
            expiryDate: pickValue(
                raw?.insuranceDetails?.expiryDate,
                raw?.insurance?.expiryDate,
                raw?.insurance?.validTill,
                prevForm.insuranceDetails?.expiryDate
            ),
        },

        passingDetails: {
            ...prevForm.passingDetails,
            passingNumber: pickValue(
                raw?.passingDetails?.passingNumber,
                raw?.passingNumber,
                prevForm.passingDetails?.passingNumber
            ),
            issueDate: pickValue(
                raw?.passingDetails?.issueDate,
                prevForm.passingDetails?.issueDate
            ),
            expiryDate: pickValue(
                raw?.passingDetails?.expiryDate,
                prevForm.passingDetails?.expiryDate
            ),
        },

        fitnessCertificateDetails: {
            ...prevForm.fitnessCertificateDetails,
            certificateNumber: pickValue(
                raw?.fitnessCertificateDetails?.certificateNumber,
                raw?.fitnessCertificateNumber,
                prevForm.fitnessCertificateDetails?.certificateNumber
            ),
            issueDate: pickValue(
                raw?.fitnessCertificateDetails?.issueDate,
                prevForm.fitnessCertificateDetails?.issueDate
            ),
            expiryDate: pickValue(
                raw?.fitnessCertificateDetails?.expiryDate,
                prevForm.fitnessCertificateDetails?.expiryDate
            ),
        },

        permitDetails: {
            ...prevForm.permitDetails,
            permitType: pickValue(
                raw?.permitDetails?.permitType,
                raw?.permitType,
                prevForm.permitDetails?.permitType
            ),
            permitNumber: pickValue(
                raw?.permitDetails?.permitNumber,
                raw?.permitNumber,
                prevForm.permitDetails?.permitNumber
            ),
            issueDate: pickValue(
                raw?.permitDetails?.issueDate,
                prevForm.permitDetails?.issueDate
            ),
            expiryDate: pickValue(
                raw?.permitDetails?.expiryDate,
                prevForm.permitDetails?.expiryDate
            ),
        },

        roadTaxDetails: {
            ...prevForm.roadTaxDetails,
            receiptNumber: pickValue(
                raw?.roadTaxDetails?.receiptNumber,
                raw?.roadTaxReceiptNumber,
                prevForm.roadTaxDetails?.receiptNumber
            ),
            paidDate: pickValue(
                raw?.roadTaxDetails?.paidDate,
                prevForm.roadTaxDetails?.paidDate
            ),
            validTill: pickValue(
                raw?.roadTaxDetails?.validTill,
                prevForm.roadTaxDetails?.validTill
            ),
        },

        batteryDetails: {
            ...prevForm.batteryDetails,
            batteryBrand: pickValue(
                raw?.batteryDetails?.batteryBrand,
                raw?.battery?.batteryBrand,
                raw?.batteryBrand,
                prevForm.batteryDetails?.batteryBrand
            ),
            batterySeriesNumber: pickValue(
                raw?.batteryDetails?.batterySeriesNumber,
                raw?.batterySeriesNumber,
                prevForm.batteryDetails?.batterySeriesNumber
            ),
            batteryInstalledDate: pickValue(
                raw?.batteryDetails?.batteryInstalledDate,
                prevForm.batteryDetails?.batteryInstalledDate
            ),
            batteryExpiryDate: pickValue(
                raw?.batteryDetails?.batteryExpiryDate,
                prevForm.batteryDetails?.batteryExpiryDate
            ),
        },

        documents: {
            ...prevForm.documents,
            insuranceCopyUrl: pickValue(
                raw?.documents?.insuranceCopyUrl,
                prevForm.documents?.insuranceCopyUrl
            ),
            pucCertificateUrl: pickValue(
                raw?.documents?.pucCertificateUrl,
                prevForm.documents?.pucCertificateUrl
            ),
            fitnessCertificateUrl: pickValue(
                raw?.documents?.fitnessCertificateUrl,
                prevForm.documents?.fitnessCertificateUrl
            ),
            permitCopyUrl: pickValue(
                raw?.documents?.permitCopyUrl,
                prevForm.documents?.permitCopyUrl
            ),
        },
    });
};

/* ===================================================
   PROPS
=================================================== */

type CreateEditVehicleMaintenanceProps = {
    embedded?: boolean;
    mode?: "add" | "edit" | "view";
    voucherNumber?: string;
    maintenanceData?: any;
    onClose?: () => void;
};

/* ===================================================
   CREATE / EDIT / VIEW VEHICLE MAINTENANCE
=================================================== */

const CreateEditVehicleMaintenance = ({
    embedded = false,
    mode: modeProp,
    voucherNumber: voucherNumberProp,
    maintenanceData: maintenanceDataProp,
    onClose,
}: CreateEditVehicleMaintenanceProps = {}) => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    // Props take priority (embedded/modal usage); router state/params
    // remain as fallback so the routed (non-embedded) usage still works.
    const mode =
        modeProp ||
        location.state?.mode ||
        (params?.voucherNumber ? "edit" : "add");

    const isEdit = mode === "edit" || mode === "view";
    const isView = mode === "view";

    const voucherNumber =
        voucherNumberProp ||
        location.state?.voucherNumber ||
        params?.voucherNumber ||
        "";

    const passedMaintenanceData =
        maintenanceDataProp !== undefined
            ? maintenanceDataProp
            : location.state?.maintenanceData;

    const { users = [] } = useSelector((state: any) => state.professionalUser || {});

    const [form, setForm] = useState<any>(createInitialVehicleMaintenance());
    const [loading, setLoading] = useState(false);

    const [vehicleOptions, setVehicleOptions] = useState<any[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [driversLoading, setDriversLoading] = useState(false);

    const [expandedSections, setExpandedSections] = useState<any>(
        createExpandedSectionsState
    );

    // Single place that decides how to "leave" the screen — closes the
    // modal when embedded, otherwise falls back to router history.
    const goBack = useCallback(() => {
        if (embedded && onClose) {
            onClose();
            return;
        }

        navigate(-1);
    }, [embedded, onClose, navigate]);

    const maintenanceNumber = useMemo(
        () => voucherNumber || getVehicleMaintenanceVoucher(form),
        [form, voucherNumber]
    );

    const driverUsers = useMemo(() => {
        const list = Array.isArray(users)
            ? users.flatMap((item: any) => {
                if (Array.isArray(item?.ChildUsers)) return item.ChildUsers;
                return item;
            })
            : [];

        return normalizeDriverUsers(list);
    }, [users]);

    const driverOptions = useMemo(() => {
        return driverUsers.map((driver: any) => {
            const status = driver?.status ? ` (${driver.status})` : "";

            return {
                label: `${driver.driverName} ${status}`,
                value: driver.driverId,
                driverCode: driver.driverId,
                driverName: driver.driverName,
                licenseNumber: driver.licenseNumber || "",
                licenseExpiryDate: driver.licenseExpiryDate || "",
                rawData: driver.raw,
            };
        });
    }, [driverUsers]);

    const finalVehicleOptions = useMemo(() => {
        const currentValue = form.vehicleCode || form.vehicleNumber || "";

        const exists = vehicleOptions.some(
            (item: any) => String(item.value) === String(currentValue)
        );

        if (!currentValue || exists) return vehicleOptions;

        return [
            {
                label: `${form.vehicleNumber || currentValue} - ${form.vehicleType || "Vehicle"
                    }`,
                value: currentValue,
                vehicleCode: form.vehicleCode || currentValue,
                vehicleNumber: form.vehicleNumber || "",
                vehicleType: form.vehicleType || "",
                rawData: form,
                mappedVehicle: form,
            },
            ...vehicleOptions,
        ];
    }, [vehicleOptions, form]);

    const finalDriverOptions = useMemo(() => {
        const currentValue = form.driverCode || "";
        const exists = driverOptions.some((item: any) => String(item.value) === String(currentValue));
        if (!currentValue || exists) return driverOptions;

        return [
            { label: `${form.driverName || currentValue} - ${currentValue}`, value: currentValue, driverCode: currentValue, driverName: form.driverName || "", rawData: form, },
            ...driverOptions,
        ];
    }, [driverOptions, form.driverCode, form.driverName]);

    const pageTitle = isEdit && maintenanceNumber ? `${isView ? "View" : "Edit"} ${maintenanceNumber}` : isEdit ? `${isView ? "View" : "Edit"} Vehicle Maintenance` : "Vehicle Maintenance";

    const pageDescription = isView ? "View vehicle maintenance entry." : isEdit ? "Update vehicle maintenance entry." : "Record vehicle service, PUC, insurance, permit, tyre, battery and cost details.";
    const toggleSection = (sectionKey: string) => { setExpandedSections((prev: any) => ({ ...prev, [sectionKey]: !prev[sectionKey], })); };

    /* ===================================================
       FETCH VEHICLES
    =================================================== */

    const fetchVehicles = useCallback(async () => {
        try {
            setVehiclesLoading(true);

            const res = await dispatch(
                getVehicleMasterVehicles({
                    requiredWeight: 0,
                    transportOrder: {},
                }) as any
            ).unwrap();

            const vehicles = Array.isArray(res?.vehicles) ? res.vehicles : [];

            const options = vehicles
                .map((vehicle: any) => {
                    const vehicleCode =
                        vehicle?.selectedVehicleId ||
                        vehicle?.vehicleCode ||
                        vehicle?.voucherNumber ||
                        vehicle?.vehicleNumber ||
                        "";

                    return {
                        label: `${vehicle?.vehicleNumber || "-"} - ${vehicle?.vehicleType || "Vehicle"
                            }`,
                        value: vehicleCode,
                        vehicleCode,
                        vehicleNumber: vehicle?.vehicleNumber || "",
                        vehicleType: vehicle?.vehicleType || "",
                        rawData: getRawVehicleData(
                            vehicle?.rawRecord || vehicle,
                            vehicle
                        ),
                        mappedVehicle: vehicle,
                    };
                })
                .filter((item: any) => item.value);

            setVehicleOptions(options);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load vehicles");
            setVehicleOptions([]);
        } finally {
            setVehiclesLoading(false);
        }
    }, [dispatch]);

    /* ===================================================
       FETCH DRIVERS USING SAME ALLOCATION STRUCTURE
    =================================================== */

    const fetchDrivers = useCallback(async () => {
        try {
            setDriversLoading(true);

            const action = dispatch(
                getProfessionalUsers({
                    page: 1,
                    limit: 500,
                    withParent: true,
                    type: "driver",
                    inputFields: [
                        "ParentUser",
                        "ChildUsers",
                        "userFirstName",
                        "userMiddleName",
                        "userLastName",
                        "userMobileNumberHash",
                        "userEmail",
                        "userDOB",
                        "userGender",
                        "userType",
                        "isUserActive",
                        "parentUserMobileNumber",
                        "childUserCustomFields.licenseNumber",
                        "childUserCustomFields.licenseExpiry",
                        "childUserCustomFields.status",
                    ],
                }) as any
            );

            if (typeof action?.unwrap === "function") {
                await action.unwrap();
            } else {
                await action;
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to load drivers");
        } finally {
            setDriversLoading(false);
        }
    }, [dispatch]);

    /* ===================================================
       LOAD EDIT / VIEW DATA
    =================================================== */

    const loadEntry = useCallback(async () => {
        if (!isEdit) return;

        if (passedMaintenanceData) {
            setForm(mergeVehicleMaintenanceForm(passedMaintenanceData));
            return;
        }

        if (!voucherNumber) return;

        try {
            setLoading(true);

            const res = await dispatch(
                getVehicleMaintenanceByVoucherNumber(voucherNumber) as any
            ).unwrap();

            const record = getApiRecord(res);

            setForm(mergeVehicleMaintenanceForm(record));
        } catch (error: any) {
            toast.error(
                error?.message || "Failed to load vehicle maintenance entry"
            );
            goBack();
        } finally {
            setLoading(false);
        }
    }, [dispatch, isEdit, passedMaintenanceData, voucherNumber, goBack]);

    useEffect(() => {
        fetchVehicles();
        fetchDrivers();
        loadEntry();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchVehicles, fetchDrivers, loadEntry]);

    /* ===================================================
       UPDATE HELPERS (guarded in view mode)
    =================================================== */

    const updateNested = (section: string, key: string, value: any) => {
        if (isView) return;

        setForm((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    const updateRoot = (key: string, value: any) => {
        if (isView) return;

        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleVehicleSelect = (input: any) => {
        if (isView) return;

        const value = getInputValue(input);

        const selected = finalVehicleOptions.find(
            (item: any) =>
                String(item.value) === String(value) ||
                String(item.vehicleCode) === String(value) ||
                String(item.vehicleNumber) === String(value)
        );

        if (!selected) {
            updateRoot("vehicleCode", value);
            return;
        }

        setForm((prev: any) => buildVehicleAutofillData(selected, prev));
    };

    const handleDriverSelect = (input: any) => {
        if (isView) return;

        const value = getInputValue(input);

        const selected = finalDriverOptions.find(
            (item: any) =>
                String(item.value) === String(value) ||
                String(item.driverCode) === String(value)
        );

        if (!selected) {
            setForm((prev: any) => ({
                ...prev,
                driverCode: value,
                driverName: "",
            }));
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            driverCode: selected.driverCode || selected.value || "",
            driverName: selected.driverName || "",
        }));
    };

    const updateField = (key: string, input: any) => {
        if (isView) return;

        const value = getInputValue(input);

        if (key === "vehicleCode") {
            handleVehicleSelect(value);
            return;
        }

        if (key === "driverCode") {
            handleDriverSelect(value);
            return;
        }

        if (key === "remarks") {
            updateRoot("remarks", String(value || "").slice(0, REMARKS_MAX));
            return;
        }

        if (key === "status") {
            updateRoot("status", value);
            return;
        }

        if (key === "tyreDetails.tyreSeriesNumbers") {
            updateNested(
                "tyreDetails",
                "tyreSeriesNumbers",
                String(value || "")
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
            );
            return;
        }

        if (key.includes(".")) {
            const [section, childKey] = key.split(".");
            updateNested(section, childKey, value);
            return;
        }

        updateRoot(key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        updateField(key, e);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        updateField(key, e);
    };

    const updateBreakdown = (index: number, key: string, value: any) => {
        if (isView) return;

        setForm((prev: any) => {
            const breakdownDetails = [...(prev.breakdownDetails || [])];

            breakdownDetails[index] = {
                ...breakdownDetails[index],
                [key]: value,
            };

            return {
                ...prev,
                breakdownDetails,
            };
        });
    };

    const addBreakdown = () => {
        if (isView) return;

        setForm((prev: any) => ({
            ...prev,
            breakdownDetails: [
                ...(prev.breakdownDetails || []),
                createEmptyBreakdown(),
            ],
        }));
    };

    const removeBreakdown = (index: number) => {
        if (isView) return;

        setForm((prev: any) => ({
            ...prev,
            breakdownDetails: (prev.breakdownDetails || []).filter(
                (_: any, i: number) => i !== index
            ),
        }));
    };

    /* ===================================================
       SAVE
    =================================================== */

    const handleSave = async () => {
        if (isView) return;

        const errors = validateVehicleMaintenanceForm(form);

        if (errors.length) {
            toast.warn(errors[0]);
            return;
        }

        try {
            setLoading(true);

            const payload = toVehicleMaintenancePayload(form);

            if (isEdit) {
                const maintenanceNo =
                    maintenanceNumber || getVehicleMaintenanceVoucher(form);

                if (!maintenanceNo) {
                    toast.warn("Maintenance number not found");
                    return;
                }

                await dispatch(
                    updateVehicleMaintenance({
                        voucherNumber: maintenanceNo,
                        payload,
                    }) as any
                ).unwrap();
            } else {
                await dispatch(createVehicleMaintenance(payload) as any).unwrap();
            }

            toast.success(
                isEdit
                    ? "Vehicle maintenance updated"
                    : "Vehicle maintenance saved"
            );

            goBack();
        } catch (error: any) {
            toast.error(error?.message || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    /* ===================================================
       FIELD FORM
    =================================================== */

    const fieldForm = {
        vehicleCode: form.vehicleCode || "",
        vehicleNumber: form.vehicleNumber || "",
        vehicleType: form.vehicleType || "",
        driverCode: form.driverCode || "",
        driverName: form.driverName || "",

        "pucDetails.certificateNumber":
            form.pucDetails?.certificateNumber || "",
        "pucDetails.issueDate": toDateInputValue(form.pucDetails?.issueDate),
        "pucDetails.expiryDate": toDateInputValue(form.pucDetails?.expiryDate),

        "insuranceDetails.insuranceCompany":
            form.insuranceDetails?.insuranceCompany || "",
        "insuranceDetails.policyNumber":
            form.insuranceDetails?.policyNumber || "",
        "insuranceDetails.issueDate": toDateInputValue(
            form.insuranceDetails?.issueDate
        ),
        "insuranceDetails.expiryDate": toDateInputValue(
            form.insuranceDetails?.expiryDate
        ),

        "passingDetails.passingNumber":
            form.passingDetails?.passingNumber || "",
        "passingDetails.issueDate": toDateInputValue(
            form.passingDetails?.issueDate
        ),
        "passingDetails.expiryDate": toDateInputValue(
            form.passingDetails?.expiryDate
        ),

        "fitnessCertificateDetails.certificateNumber":
            form.fitnessCertificateDetails?.certificateNumber || "",
        "fitnessCertificateDetails.issueDate": toDateInputValue(
            form.fitnessCertificateDetails?.issueDate
        ),
        "fitnessCertificateDetails.expiryDate": toDateInputValue(
            form.fitnessCertificateDetails?.expiryDate
        ),

        "permitDetails.permitType": form.permitDetails?.permitType || "",
        "permitDetails.permitNumber": form.permitDetails?.permitNumber || "",
        "permitDetails.issueDate": toDateInputValue(
            form.permitDetails?.issueDate
        ),
        "permitDetails.expiryDate": toDateInputValue(
            form.permitDetails?.expiryDate
        ),

        "roadTaxDetails.receiptNumber":
            form.roadTaxDetails?.receiptNumber || "",
        "roadTaxDetails.paidDate": toDateInputValue(
            form.roadTaxDetails?.paidDate
        ),
        "roadTaxDetails.validTill": toDateInputValue(
            form.roadTaxDetails?.validTill
        ),

        "batteryDetails.batteryBrand":
            form.batteryDetails?.batteryBrand || "",
        "batteryDetails.batterySeriesNumber":
            form.batteryDetails?.batterySeriesNumber || "",
        "batteryDetails.batteryInstalledDate": toDateInputValue(
            form.batteryDetails?.batteryInstalledDate
        ),
        "batteryDetails.batteryExpiryDate": toDateInputValue(
            form.batteryDetails?.batteryExpiryDate
        ),

        "tyreDetails.totalTyres": form.tyreDetails?.totalTyres || "",
        "tyreDetails.tyreBrand": form.tyreDetails?.tyreBrand || "",
        "tyreDetails.tyreSeriesNumbers": Array.isArray(
            form.tyreDetails?.tyreSeriesNumbers
        )
            ? form.tyreDetails.tyreSeriesNumbers.join(", ")
            : "",
        "tyreDetails.lastChangedDate": toDateInputValue(
            form.tyreDetails?.lastChangedDate
        ),
        "tyreDetails.nextChangeDueKm":
            form.tyreDetails?.nextChangeDueKm || "",

        "lastMaintenance.maintenanceDate": toDateInputValue(
            form.lastMaintenance?.maintenanceDate
        ),
        "lastMaintenance.maintenanceType":
            form.lastMaintenance?.maintenanceType || "",
        "lastMaintenance.serviceCenter":
            form.lastMaintenance?.serviceCenter || "",
        "lastMaintenance.billNumber": form.lastMaintenance?.billNumber || "",
        "lastMaintenance.odometerReading":
            form.lastMaintenance?.odometerReading || "",
        "lastMaintenance.issueReported":
            form.lastMaintenance?.issueReported || "",
        "lastMaintenance.workDone": form.lastMaintenance?.workDone || "",
        "lastMaintenance.amount": form.lastMaintenance?.amount || "",

        "nextMaintenance.dueDate": toDateInputValue(
            form.nextMaintenance?.dueDate
        ),
        "nextMaintenance.dueAtKm": form.nextMaintenance?.dueAtKm || "",

        "documents.insuranceCopyUrl": form.documents?.insuranceCopyUrl || "",
        "documents.pucCertificateUrl": form.documents?.pucCertificateUrl || "",
        "documents.maintenanceBillUrl":
            form.documents?.maintenanceBillUrl || "",
        "documents.fitnessCertificateUrl":
            form.documents?.fitnessCertificateUrl || "",
        "documents.permitCopyUrl": form.documents?.permitCopyUrl || "",

        status: form.status || "active",
        remarks: form.remarks || "",
    };

    /* ===================================================
       FIELD GROUPS
    =================================================== */

    const vehicleFields = [
        {
            key: "vehicleCode",
            label: "Vehicle",
            type: "select",
            options: finalVehicleOptions,
            mandatory: true,
            disabled: vehiclesLoading,
            placeholder: vehiclesLoading ? "Loading vehicles..." : "Select vehicle",
        },
        {
            key: "vehicleNumber",
            label: "Vehicle Number",
            type: "text",
            mandatory: true,
            disabled: true,
            placeholder: "Vehicle number auto filled",
        },
        {
            key: "vehicleType",
            label: "Vehicle Type",
            type: "text",
            disabled: true,
            placeholder: "Vehicle type auto filled",
        },
        {
            key: "driverCode",
            label: "Driver",
            type: "select",
            options: finalDriverOptions,
            disabled: driversLoading,
            placeholder: driversLoading ? "Loading drivers..." : "Select driver",
        },
        {
            key: "driverName",
            label: "Driver Name",
            type: "text",
            disabled: true,
            placeholder: "Driver name auto filled",
        },
    ];

    const pucFields = [
        {
            key: "pucDetails.certificateNumber",
            label: "Certificate Number",
            type: "text",
        },
        {
            key: "pucDetails.issueDate",
            label: "Issue Date",
            type: "date",
        },
        {
            key: "pucDetails.expiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const insuranceFields = [
        {
            key: "insuranceDetails.insuranceCompany",
            label: "Insurance Company",
            type: "text",
        },
        {
            key: "insuranceDetails.policyNumber",
            label: "Policy Number",
            type: "text",
        },
        {
            key: "insuranceDetails.issueDate",
            label: "Issue Date",
            type: "date",
        },
        {
            key: "insuranceDetails.expiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const passingFields = [
        {
            key: "passingDetails.passingNumber",
            label: "Passing Number",
            type: "text",
        },
        {
            key: "passingDetails.issueDate",
            label: "Issue Date",
            type: "date",
        },
        {
            key: "passingDetails.expiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const fitnessFields = [
        {
            key: "fitnessCertificateDetails.certificateNumber",
            label: "Certificate Number",
            type: "text",
        },
        {
            key: "fitnessCertificateDetails.issueDate",
            label: "Issue Date",
            type: "date",
        },
        {
            key: "fitnessCertificateDetails.expiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const permitFields = [
        {
            key: "permitDetails.permitType",
            label: "Permit Type",
            type: "select",
            options: permitTypeOptions,
        },
        {
            key: "permitDetails.permitNumber",
            label: "Permit Number",
            type: "text",
        },
        {
            key: "permitDetails.issueDate",
            label: "Issue Date",
            type: "date",
        },
        {
            key: "permitDetails.expiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const roadTaxFields = [
        {
            key: "roadTaxDetails.receiptNumber",
            label: "Receipt Number",
            type: "text",
        },
        {
            key: "roadTaxDetails.paidDate",
            label: "Paid Date",
            type: "date",
        },
        {
            key: "roadTaxDetails.validTill",
            label: "Valid Till",
            type: "date",
        },
    ];

    const batteryFields = [
        {
            key: "batteryDetails.batteryBrand",
            label: "Battery Brand",
            type: "text",
        },
        {
            key: "batteryDetails.batterySeriesNumber",
            label: "Battery Series Number",
            type: "text",
        },
        {
            key: "batteryDetails.batteryInstalledDate",
            label: "Installed Date",
            type: "date",
        },
        {
            key: "batteryDetails.batteryExpiryDate",
            label: "Expiry Date",
            type: "date",
        },
    ];

    const tyreFields = [
        {
            key: "tyreDetails.totalTyres",
            label: "Total Tyres",
            type: "number",
        },
        {
            key: "tyreDetails.tyreBrand",
            label: "Tyre Brand",
            type: "text",
        },
        {
            key: "tyreDetails.tyreSeriesNumbers",
            label: "Tyre Series Numbers",
            type: "text",
            placeholder: "Comma separated",
            className: "md:col-span-2",
        },
        {
            key: "tyreDetails.lastChangedDate",
            label: "Last Changed Date",
            type: "date",
        },
        {
            key: "tyreDetails.nextChangeDueKm",
            label: "Next Change Due (KM)",
            type: "number",
        },
    ];

    const lastMaintenanceFields = [
        {
            key: "lastMaintenance.maintenanceDate",
            label: "Maintenance Date",
            type: "date",
            mandatory: true,
        },
        {
            key: "lastMaintenance.maintenanceType",
            label: "Maintenance Type",
            type: "select",
            options: maintenanceTypeOptions,
        },
        {
            key: "lastMaintenance.serviceCenter",
            label: "Service Center",
            type: "text",
            mandatory: true,
        },
        {
            key: "lastMaintenance.billNumber",
            label: "Bill Number",
            type: "text",
        },
        {
            key: "lastMaintenance.odometerReading",
            label: "Odometer Reading (KM)",
            type: "number",
        },
        {
            key: "lastMaintenance.amount",
            label: "Amount",
            type: "number",
        },
        {
            key: "lastMaintenance.issueReported",
            label: "Issue Reported",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-1",
        },
        {
            key: "lastMaintenance.workDone",
            label: "Work Done",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-1",
        },
    ];

    const nextMaintenanceFields = [
        {
            key: "nextMaintenance.dueDate",
            label: "Due Date",
            type: "date",
        },
        {
            key: "nextMaintenance.dueAtKm",
            label: "Due at KM",
            type: "number",
        },
    ];

    const documentFields = [
        {
            key: "documents.insuranceCopyUrl",
            label: "Insurance Copy URL",
            type: "text",
        },
        {
            key: "documents.pucCertificateUrl",
            label: "PUC Certificate URL",
            type: "text",
        },
        {
            key: "documents.maintenanceBillUrl",
            label: "Maintenance Bill URL",
            type: "text",
        },
        {
            key: "documents.fitnessCertificateUrl",
            label: "Fitness Certificate URL",
            type: "text",
        },
        {
            key: "documents.permitCopyUrl",
            label: "Permit Copy URL",
            type: "text",
        },
    ];

    const statusFields = [
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-1",
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: statusOptions,
        },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) => {
            const isMaintenanceNumberField = field.key === "maintenanceNumber";

            const finalField = {
                ...field,
                ...(isMaintenanceNumberField ? { value: maintenanceNumber } : {}),
                disabled: isView || field.disabled,
            };

            const finalForm = isMaintenanceNumberField
                ? {
                    ...fieldForm,
                    maintenanceNumber,
                }
                : fieldForm;

            return (
                <Fragment key={field.key}>
                    {renderField({
                        field: finalField,
                        form: finalForm,
                        handleInputChange,
                        handleSelectChange,
                        updateField,
                    })}
                </Fragment>
            );
        });

    const breakdownFields = [
        {
            key: "breakdownDate",
            label: "Breakdown Date",
            type: "date",
        },
        {
            key: "breakdownReason",
            label: "Breakdown Reason",
            type: "text",
        },
        {
            key: "breakdownLocation",
            label: "Breakdown Location",
            type: "text",
        },
        {
            key: "tripNumber",
            label: "Trip Number",
            type: "text",
        },
        {
            key: "tripFrom",
            label: "Trip From",
            type: "text",
        },
        {
            key: "tripTo",
            label: "Trip To",
            type: "text",
        },
        {
            key: "odometerReading",
            label: "Odometer Reading (KM)",
            type: "number",
        },
        {
            key: "repairStatus",
            label: "Repair Status",
            type: "select",
            options: repairStatusOptions,
        },
    ];

    const renderBreakdownFields = (row: any, index: number) => {
        const breakdownForm = {
            breakdownDate: toDateInputValue(row?.breakdownDate),
            breakdownReason: row?.breakdownReason || "",
            breakdownLocation: row?.breakdownLocation || "",
            tripNumber: row?.tripNumber || "",
            tripFrom: row?.tripFrom || "",
            tripTo: row?.tripTo || "",
            odometerReading: row?.odometerReading || "",
            repairStatus: row?.repairStatus || "",
        };

        const updateBreakdownField = (key: string, input: any) => {
            const value = getInputValue(input);
            updateBreakdown(index, key, value);
        };

        const handleBreakdownInputChange = (key: string) => (e: any) => {
            updateBreakdownField(key, e);
        };

        const handleBreakdownSelectChange = (key: string) => (e: any) => {
            updateBreakdownField(key, e);
        };

        return breakdownFields.map((field: any) => (
            <Fragment key={`breakdown-${index}-${field.key}`}>
                {renderField({
                    field: { ...field, disabled: isView },
                    form: breakdownForm,
                    handleInputChange: handleBreakdownInputChange,
                    handleSelectChange: handleBreakdownSelectChange,
                    updateField: updateBreakdownField,
                })}
            </Fragment>
        ));
    };

    return (
        <div className="flex h-full w-full flex-col bg-card text-card-foreground shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div
                    id="vehicle-maintenance-summary"
                    className="flex items-center"
                >
                    <button
                        type="button"
                        onClick={goBack}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            {pageTitle}
                        </h1>

                        <p className=" text-sm text-muted-foreground">
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

            <div className="min-h-0 flex-1 overflow-auto p-2">
                <div className="space-y-4">
                    <SectionCard
                        index={1}
                        title="Vehicle & Driver"
                        icon={<Truck size={17} />}
                        expanded={expandedSections.vehicleDriver}
                        onToggle={() => toggleSection("vehicleDriver")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-5 gap-4">
                            {renderFields(vehicleFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={2}
                        title="PUC Details"
                        icon={<Award size={17} />}
                        expanded={expandedSections.pucDetails}
                        onToggle={() => toggleSection("pucDetails")}
                    >
                        {renderFields(pucFields)}
                    </SectionCard>

                    <SectionCard
                        index={3}
                        title="Insurance Details"
                        icon={<Shield size={17} />}
                        expanded={expandedSections.insuranceDetails}
                        onToggle={() => toggleSection("insuranceDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">
                            {renderFields(insuranceFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={4}
                        title="Passing Details"
                        icon={<CheckCircle size={17} />}
                        expanded={expandedSections.passingDetails}
                        onToggle={() => toggleSection("passingDetails")}
                    >
                        {renderFields(passingFields)}
                    </SectionCard>

                    <SectionCard
                        index={5}
                        title="Fitness Certificate"
                        icon={<FileText size={17} />}
                        expanded={expandedSections.fitnessCertificateDetails}
                        onToggle={() =>
                            toggleSection("fitnessCertificateDetails")
                        }
                    >
                        {renderFields(fitnessFields)}
                    </SectionCard>

                    <SectionCard
                        index={6}
                        title="Permit Details"
                        icon={<Clipboard size={17} />}
                        expanded={expandedSections.permitDetails}
                        onToggle={() => toggleSection("permitDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">
                            {renderFields(permitFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={7}
                        title="Road Tax"
                        icon={<CreditCard size={17} />}
                        expanded={expandedSections.roadTaxDetails}
                        onToggle={() => toggleSection("roadTaxDetails")}
                    >
                        {renderFields(roadTaxFields)}
                    </SectionCard>

                    <SectionCard
                        index={8}
                        title="Battery Details"
                        icon={<BatteryCharging size={17} />}
                        expanded={expandedSections.batteryDetails}
                        onToggle={() => toggleSection("batteryDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">
                            {renderFields(batteryFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={9}
                        title="Tyre Details"
                        icon={<Disc size={17} />}
                        expanded={expandedSections.tyreDetails}
                        onToggle={() => toggleSection("tyreDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-5 gap-4">
                            {renderFields(tyreFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={10}
                        title="Last Maintenance"
                        icon={<Wrench size={17} />}
                        expanded={expandedSections.lastMaintenance}
                        onToggle={() => toggleSection("lastMaintenance")}
                    >
                        <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">
                            {renderFields(lastMaintenanceFields)}
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={11}
                        title="Breakdown Details"
                        icon={<AlertTriangle size={17} />}
                        expanded={expandedSections.breakdownDetails}
                        onToggle={() => toggleSection("breakdownDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="space-y-4">
                                {(form.breakdownDetails || []).map((row: any, index: number) => (
                                    <div
                                        key={`breakdown-section-wrapper-${index}`}
                                        className="relative"
                                    >
                                        {!isView && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeBreakdown(index);
                                                }}
                                                className="absolute right-8 top-4  inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger/30 bg-danger/10 text-danger transition hover:bg-danger/20"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}

                                        <FormSectionCard
                                            key={`breakdown-section-${index}`}
                                            index={index + 1}
                                            title={`Breakdown ${index + 1}`}
                                            icon={<AlertTriangle size={17} />}
                                            expanded={true}
                                            onToggle={() => { }}
                                        >
                                            <div className="md:col-span-2 xl:col-span-3">
                                                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                    {renderBreakdownFields(row, index)}
                                                </div>
                                            </div>
                                        </FormSectionCard>
                                    </div>
                                ))}

                                {!isView && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={addBreakdown}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/20"
                                        >
                                            <Plus size={16} />
                                            Add Breakdown
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={12}
                        title="Documents"
                        icon={<FileText size={17} />}
                        expanded={expandedSections.documents}
                        onToggle={() => toggleSection("documents")}
                    >
                        {renderFields(documentFields)}
                    </SectionCard>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <SectionCard
                            index={13}
                            title="Next Maintenance"
                            icon={<Calendar size={17} />}
                            expanded={expandedSections.nextMaintenance}
                            onToggle={() => toggleSection("nextMaintenance")}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-2 gap-4">
                                {renderFields(nextMaintenanceFields)}
                            </div>
                        </SectionCard>

                        <SectionCard
                            index={14}
                            title="Status & Remarks"
                            icon={<MessageSquare size={17} />}
                            expanded={expandedSections.remarks}
                            onToggle={() => toggleSection("remarks")}
                        >
                            <div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-2 gap-4">
                                {renderFields(statusFields)}
                            </div>

                            <p className="-mt-2 text-xs font-bold text-muted-foreground md:col-span-2 xl:col-span-3">
                                {(form.remarks || "").length}/{REMARKS_MAX}
                            </p>
                        </SectionCard>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={loading}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                >
                    {isView ? "Close" : "Cancel"}
                </button>

                {!isView && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateEditVehicleMaintenance;