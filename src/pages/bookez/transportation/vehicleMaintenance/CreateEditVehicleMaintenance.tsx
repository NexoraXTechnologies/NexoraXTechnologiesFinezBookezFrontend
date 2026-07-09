import {
    ArrowLeft,
    Award,
    BatteryCharging,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
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
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
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
import { createVehicleMaintenance, getVehicleMaintenanceByVoucherNumber, updateVehicleMaintenance } from "../../../../redux/slices/professionalSlice/transportation/vehicleMaintenanceEntrySlice";



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
   HELPERS
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

/* ===================================================
   COLLAPSIBLE SECTION CARD
=================================================== */

const MaintenanceSectionCard = ({
    index,
    title,
    icon,
    expanded,
    onToggle,
    children,
}: {
    index: number;
    title: string;
    icon: ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}) => {
    return (
        <div className="rounded-lg border border-border bg-card shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 ${
                    expanded ? "border-b border-border" : ""
                }`}
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {icon}
                </span>

                <span className="flex-1 text-sm font-black text-card-foreground">
                    {index}. {title}
                </span>

                {expanded ? (
                    <ChevronUp size={18} className="text-muted-foreground" />
                ) : (
                    <ChevronDown size={18} className="text-muted-foreground" />
                )}
            </button>

            {expanded && (
                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {children}
                </div>
            )}
        </div>
    );
};

/* ===================================================
   CREATE / EDIT VEHICLE MAINTENANCE
=================================================== */

const CreateEditVehicleMaintenance = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const mode = location.state?.mode || (params?.voucherNumber ? "edit" : "add");
    const isEdit = mode === "edit";

    const voucherNumber =
        location.state?.voucherNumber ||
        params?.voucherNumber ||
        "";

    const [form, setForm] = useState<any>(createInitialVehicleMaintenance());
    const [loading, setLoading] = useState(false);

    const [expandedSections, setExpandedSections] = useState<any>(
        createExpandedSectionsState
    );

    const maintenanceNumber = useMemo(
        () => voucherNumber || getVehicleMaintenanceVoucher(form),
        [form, voucherNumber]
    );

    const pageTitle =
        isEdit && maintenanceNumber
            ? `Edit ${maintenanceNumber}`
            : isEdit
            ? "Edit Vehicle Maintenance"
            : "Vehicle Maintenance";

    const pageDescription = isEdit
        ? "Update vehicle maintenance entry."
        : "Record vehicle service, PUC, insurance, permit, tyre, battery and cost details.";

    const toggleSection = (sectionKey: string) => {
        setExpandedSections((prev: any) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey],
        }));
    };

    /* ===================================================
       LOAD EDIT DATA
    =================================================== */

    const loadEntry = useCallback(async () => {
        if (!isEdit) return;

        const passedData = location.state?.maintenanceData;

        if (passedData) {
            setForm(mergeVehicleMaintenanceForm(passedData));
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
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [dispatch, isEdit, location.state?.maintenanceData, navigate, voucherNumber]);

    useEffect(() => {
        loadEntry();
    }, [loadEntry]);

    /* ===================================================
       UPDATE HELPERS
    =================================================== */

    const updateNested = (section: string, key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    };

    const updateRoot = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateField = (key: string, value: any) => {
        if (key === "remarks") {
            updateRoot("remarks", String(value || "").slice(0, REMARKS_MAX));
            return;
        }

        if (key === "status") {
            updateRoot("status", value);
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
        const value = e?.target?.value ?? "";
        updateField(key, value);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? e ?? "";
        updateField(key, value);
    };

    const updateBreakdown = (index: number, key: string, value: any) => {
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
        setForm((prev: any) => ({
            ...prev,
            breakdownDetails: [
                ...(prev.breakdownDetails || []),
                createEmptyBreakdown(),
            ],
        }));
    };

    const removeBreakdown = (index: number) => {
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

            navigate(-1);
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
        ...(isEdit && maintenanceNumber
            ? [
                  {
                      key: "maintenanceNumber",
                      label: "Voucher Number",
                      type: "text",
                      disabled: true,
                      value: maintenanceNumber,
                  },
              ]
            : []),
        {
            key: "vehicleCode",
            label: "Vehicle Code",
            type: "text",
            placeholder: "Enter vehicle code",
        },
        {
            key: "vehicleNumber",
            label: "Vehicle Number",
            type: "text",
            mandatory: true,
            placeholder: "Enter vehicle number",
        },
        {
            key: "vehicleType",
            label: "Vehicle Type",
            type: "text",
            placeholder: "Enter vehicle type",
        },
        {
            key: "driverCode",
            label: "Driver Code",
            type: "text",
            placeholder: "Enter driver code",
        },
        {
            key: "driverName",
            label: "Driver Name",
            type: "text",
            placeholder: "Enter driver name",
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
            className: "md:col-span-2 xl:col-span-3",
        },
        {
            key: "lastMaintenance.workDone",
            label: "Work Done",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-3",
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
            key: "status",
            label: "Status",
            type: "select",
            options: statusOptions,
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-3",
        },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) => {
            const finalField =
                field.key === "maintenanceNumber"
                    ? {
                          ...field,
                          value: maintenanceNumber,
                      }
                    : field;

            const finalForm =
                field.key === "maintenanceNumber"
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

    return (
        <div className="flex h-full w-full flex-col bg-card text-card-foreground shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div>
                    <h1 className="flex items-center gap-1 text-md font-bold text-card-foreground">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <span>{pageTitle}</span>
                    </h1>

                    <p className="px-2 text-sm text-muted-foreground">
                        {pageDescription}
                    </p>
                </div>

                {loading && (
                    <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        Saving...
                    </span>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4 pb-24">
                <div className="space-y-4">
                    <MaintenanceSectionCard
                        index={1}
                        title="Vehicle & Driver"
                        icon={<Truck size={17} />}
                        expanded={expandedSections.vehicleDriver}
                        onToggle={() => toggleSection("vehicleDriver")}
                    >
                        {renderFields(vehicleFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={2}
                        title="PUC Details"
                        icon={<Award size={17} />}
                        expanded={expandedSections.pucDetails}
                        onToggle={() => toggleSection("pucDetails")}
                    >
                        {renderFields(pucFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={3}
                        title="Insurance Details"
                        icon={<Shield size={17} />}
                        expanded={expandedSections.insuranceDetails}
                        onToggle={() => toggleSection("insuranceDetails")}
                    >
                        {renderFields(insuranceFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={4}
                        title="Passing Details"
                        icon={<CheckCircle size={17} />}
                        expanded={expandedSections.passingDetails}
                        onToggle={() => toggleSection("passingDetails")}
                    >
                        {renderFields(passingFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={5}
                        title="Fitness Certificate"
                        icon={<FileText size={17} />}
                        expanded={expandedSections.fitnessCertificateDetails}
                        onToggle={() =>
                            toggleSection("fitnessCertificateDetails")
                        }
                    >
                        {renderFields(fitnessFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={6}
                        title="Permit Details"
                        icon={<Clipboard size={17} />}
                        expanded={expandedSections.permitDetails}
                        onToggle={() => toggleSection("permitDetails")}
                    >
                        {renderFields(permitFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={7}
                        title="Road Tax"
                        icon={<CreditCard size={17} />}
                        expanded={expandedSections.roadTaxDetails}
                        onToggle={() => toggleSection("roadTaxDetails")}
                    >
                        {renderFields(roadTaxFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={8}
                        title="Battery Details"
                        icon={<BatteryCharging size={17} />}
                        expanded={expandedSections.batteryDetails}
                        onToggle={() => toggleSection("batteryDetails")}
                    >
                        {renderFields(batteryFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={9}
                        title="Tyre Details"
                        icon={<Disc size={17} />}
                        expanded={expandedSections.tyreDetails}
                        onToggle={() => toggleSection("tyreDetails")}
                    >
                        {renderFields(tyreFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={10}
                        title="Last Maintenance"
                        icon={<Wrench size={17} />}
                        expanded={expandedSections.lastMaintenance}
                        onToggle={() => toggleSection("lastMaintenance")}
                    >
                        {renderFields(lastMaintenanceFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={11}
                        title="Breakdown Details"
                        icon={<AlertTriangle size={17} />}
                        expanded={expandedSections.breakdownDetails}
                        onToggle={() => toggleSection("breakdownDetails")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="space-y-3">
                                {(form.breakdownDetails || []).map(
                                    (row: any, index: number) => (
                                        <div
                                            key={`breakdown-${index}`}
                                            className="rounded-lg border border-border bg-background p-3"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-black text-card-foreground">
                                                    Breakdown {index + 1}
                                                </h3>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeBreakdown(index)
                                                    }
                                                    className="rounded-md p-2 text-danger transition hover:bg-danger/10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                <InputField
                                                    label="Breakdown Date"
                                                    type="date"
                                                    value={toDateInputValue(
                                                        row.breakdownDate
                                                    )}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "breakdownDate",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Breakdown Reason"
                                                    value={row.breakdownReason}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "breakdownReason",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Breakdown Location"
                                                    value={row.breakdownLocation}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "breakdownLocation",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Trip Number"
                                                    value={row.tripNumber}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "tripNumber",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Trip From"
                                                    value={row.tripFrom}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "tripFrom",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Trip To"
                                                    value={row.tripTo}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "tripTo",
                                                            value
                                                        )
                                                    }
                                                />

                                                <InputField
                                                    label="Odometer Reading (KM)"
                                                    type="number"
                                                    value={row.odometerReading}
                                                    onChange={(value) =>
                                                        updateBreakdown(
                                                            index,
                                                            "odometerReading",
                                                            value
                                                        )
                                                    }
                                                />

                                                <label className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-card-foreground">
                                                        Repair Status
                                                    </span>

                                                    <select
                                                        value={
                                                            row.repairStatus ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateBreakdown(
                                                                index,
                                                                "repairStatus",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-10 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
                                                    >
                                                        <option value="">
                                                            Select Repair Status
                                                        </option>

                                                        {repairStatusOptions.map(
                                                            (item) => (
                                                                <option
                                                                    key={
                                                                        item.value
                                                                    }
                                                                    value={
                                                                        item.value
                                                                    }
                                                                >
                                                                    {item.label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </label>
                                            </div>
                                        </div>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={addBreakdown}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/20"
                                >
                                    <Plus size={16} />
                                    Add Breakdown
                                </button>
                            </div>
                        </div>
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={12}
                        title="Next Maintenance"
                        icon={<Calendar size={17} />}
                        expanded={expandedSections.nextMaintenance}
                        onToggle={() => toggleSection("nextMaintenance")}
                    >
                        {renderFields(nextMaintenanceFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={13}
                        title="Documents"
                        icon={<FileText size={17} />}
                        expanded={expandedSections.documents}
                        onToggle={() => toggleSection("documents")}
                    >
                        {renderFields(documentFields)}
                    </MaintenanceSectionCard>

                    <MaintenanceSectionCard
                        index={14}
                        title="Status & Remarks"
                        icon={<MessageSquare size={17} />}
                        expanded={expandedSections.remarks}
                        onToggle={() => toggleSection("remarks")}
                    >
                        {renderFields(statusFields)}

                        <p className="-mt-2 text-xs font-bold text-muted-foreground md:col-span-2 xl:col-span-3">
                            {(form.remarks || "").length}/{REMARKS_MAX}
                        </p>
                    </MaintenanceSectionCard>
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
                    onClick={handleSave}
                    disabled={loading}
                    className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
};

export default CreateEditVehicleMaintenance;

/* ===================================================
   SMALL LOCAL INPUT FOR BREAKDOWN ARRAY
=================================================== */

const InputField = ({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: string;
}) => {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-card-foreground">
                {label}
            </span>

            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
            />
        </label>
    );
};