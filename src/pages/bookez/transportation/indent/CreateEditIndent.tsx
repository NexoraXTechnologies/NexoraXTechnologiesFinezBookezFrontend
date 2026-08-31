import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardList, FileText, MapPin, Save, Truck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { renderField } from "../../../../components/inputs";
import { FormSectionCard } from "../../../../components/SectionCards";
import GoogleAddressAutocompleteWeb from "../../../../components/common/GoogleAddressAutocompleteWeb";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { createIndent, updateTransportIndent } from "../../../../redux/slices/professionalSlice/transportation/intendSlice";

const vehicleTypeOptions = [
    { label: "Mini Truck", value: "Mini Truck" },
    { label: "Pick Up", value: "Pick Up" },
    { label: "LCV", value: "LCV" },
    { label: "MCV", value: "MCV" },
    { label: "HCV", value: "HCV" },
    { label: "Trailer", value: "Trailer" },
    { label: "Container", value: "Container" },
    { label: "Tipper", value: "Tipper" }
];

const indentStatusOptions = [
    { label: "Select Status", value: "" },
    { label: "Draft", value: "draft" },
    { label: "Open", value: "open" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" }
];

const createInitialIndent = () => ({
    indentNumber: "AUTO",
    indentDate: new Date().toISOString().slice(0, 10),
    customer: "",
    pickupLocation: "",
    deliveryLocation: "",
    reportingDateTime: "",
    vehicleType: "",
    numberOfVehicles: "",
    material: "",
    approximateWeight: "",
    weightUnit: "",
    customerRate: "",
    remarks: "",
    indentStatus: "draft"
});

const normalizeIndentForEdit = (data: any = {}) => ({
    ...createInitialIndent(),
    indentNumber: data?.indentNumber || data?.voucherNumber || "AUTO",
    indentDate: data?.indentDate ? String(data.indentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    customer: data?.customer || "",
    pickupLocation: data?.pickupLocation || "",
    deliveryLocation: data?.deliveryLocation || "",
    reportingDateTime: data?.reportingDateTime ? String(data.reportingDateTime).slice(0, 16) : "",
    vehicleType: data?.vehicleType || "",
    numberOfVehicles: data?.numberOfVehicles ?? "",
    material: data?.material || "",
    approximateWeight: data?.approximateWeight ?? "",
    weightUnit: data?.weightUnit || "",
    customerRate: data?.customerRate ?? "",
    remarks: data?.remarks || "",
    indentStatus: data?.indentStatus || "draft"
});

const CreateEditIndent = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const routeState: any = location.state || {};
    const isEdit = routeState?.mode === "edit" || Boolean(routeState?.indentData);

    const { accounts = [] } = useSelector((state: any) => state.accountMaster || {});
    const { units = [] } = useSelector((state: any) => state.unitMaster || {});
    const { products = [] } = useSelector((state: any) => state.productMaster || {});

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(routeState?.indentData ? normalizeIndentForEdit(routeState.indentData) : createInitialIndent());

    const pageTitle = routeState?.title || (isEdit ? "Edit Indent" : "Create Indent");
    const pageDescription = routeState?.description || (isEdit ? "Update transport indent details." : "Create a transport indent for vehicle placement and goods movement.");

    useEffect(() => {
        dispatch(getAllAccounts({ accountType: "customer" }));
        dispatch(getAllUnits({ limit: 200, offset: 0 }));
        dispatch(getAllProducts({ limit: 200, offset: 0 }));
    }, [dispatch]);

    const customerOptions = useMemo(() => [
        { label: "Select Customer", value: "" },
        ...(accounts || []).filter((item: any) => item?.accountCode).map((item: any) => ({
            label: item?.accountName || item?.accountCode,
            value: item.accountCode
        }))
    ], [accounts]);

    const unitOptions = useMemo(() => {
    const options: any[] = [
        { label: "Select Weight Unit", value: "" },
        ...(units || []).map((item: any) => {
            const unitName = item?.unitName || item?.name || item?.unit || "";
            const unitCode = item?.unitCode || item?.code || "";
            const value = unitName || unitCode;
            if (!value) return null;
            return { label: unitName || unitCode, value };
        }).filter(Boolean)
    ];

    if (form.weightUnit) {
        const matchedUnit = options.find((item: any) => String(item?.value || "").toLowerCase() === String(form.weightUnit).toLowerCase());

        if (matchedUnit && String(matchedUnit.value) !== String(form.weightUnit)) {
            options.push({ label: matchedUnit.label, value: form.weightUnit });
        } else if (!matchedUnit) {
            options.push({ label: form.weightUnit, value: form.weightUnit });
        }
    }

    return options;
}, [units, form.weightUnit]);

    const productOptions = useMemo(() => [
        { label: "Select Material", value: "" },
        ...(products || []).map((item: any) => {
            const productName = item?.productName || item?.name || "";
            const productCode = item?.productCode || item?.code || "";
            if (!productName && !productCode) return null;
            return { label: productName || productCode, value: productName || productCode };
        }).filter(Boolean)
    ], [products]);

    const updateField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
    const handleInputChange = (key: string) => (e: any) => updateField(key, e?.target?.value ?? "");
    const handleSelectChange = (key: string) => (e: any) => updateField(key, e?.target?.value ?? "");

    const handlePickupAddressSelect = (address: any) => {
        const fullAddress = address?.fullAddress || address?.formattedAddress || address?.city || "";
        updateField("pickupLocation", fullAddress);
    };

    const handleDeliveryAddressSelect = (address: any) => {
        const fullAddress = address?.fullAddress || address?.formattedAddress || address?.city || "";
        updateField("deliveryLocation", fullAddress);
    };

    const indentDetailsFields = [
        { key: "indentNumber", label: "Indent No", type: "text", disabled: true },
        { key: "indentDate", label: "Indent Date", type: "date", mandatory: true },
        { key: "customer", label: "Customer", type: "select", options: customerOptions, mandatory: true },
        { key: "indentStatus", label: "Indent Status", type: "select", options: indentStatusOptions, mandatory: true }
    ];

    const reportingFields = [
        { key: "reportingDateTime", label: "Reporting Date & Time", type: "datetime-local", mandatory: true }
    ];

    const vehicleFields = [
        { key: "vehicleType", label: "Vehicle Type", type: "select", options: vehicleTypeOptions, mandatory: true },
        { key: "numberOfVehicles", label: "Number Of Vehicles", type: "number", mandatory: true }
    ];

    const materialFields = [
        { key: "material", label: "Material", type: "select", options: productOptions, mandatory: true },
        { key: "approximateWeight", label: "Approximate Weight", type: "number" },
        { key: "weightUnit", label: "Weight Unit", type: "select", options: unitOptions },
        { key: "customerRate", label: "Customer Rate", type: "number" }
    ];

    const additionalFields = [
        { key: "remarks", label: "Remarks", type: "textarea", className: "md:col-span-2 xl:col-span-3" }
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) =>
            renderField({ field, form, handleInputChange, handleSelectChange, updateField })
        );

    const validateForm = () => {
        if (!String(form.customer || "").trim()) {
            toast.warn("Customer is required");
            return false;
        }

        if (!String(form.pickupLocation || "").trim()) {
            toast.warn("Pickup Location is required");
            return false;
        }

        if (!String(form.deliveryLocation || "").trim()) {
            toast.warn("Delivery Location is required");
            return false;
        }

        if (!form.reportingDateTime) {
            toast.warn("Reporting Date & Time is required");
            return false;
        }

        if (!form.vehicleType) {
            toast.warn("Vehicle Type is required");
            return false;
        }

        if (!form.numberOfVehicles || Number(form.numberOfVehicles) <= 0) {
            toast.warn("Valid Number Of Vehicles is required");
            return false;
        }

        if (!String(form.material || "").trim()) {
            toast.warn("Material is required");
            return false;
        }

        return true;
    };

    const toPayload = () => ({
        indentNumber: form.indentNumber || "AUTO",
        indentDate: form.indentDate,
        customer: String(form.customer || "").trim(),
        pickupLocation: String(form.pickupLocation || "").trim(),
        deliveryLocation: String(form.deliveryLocation || "").trim(),
        reportingDateTime: form.reportingDateTime ? new Date(form.reportingDateTime).toISOString() : "",
        vehicleType: form.vehicleType,
        numberOfVehicles: Number(form.numberOfVehicles || 0),
        material: String(form.material || "").trim(),
        approximateWeight: Number(form.approximateWeight || 0),
        weightUnit: String(form.weightUnit || "").trim(),
        customerRate: Number(form.customerRate || 0),
        remarks: String(form.remarks || "").trim(),
        indentStatus: form.indentStatus
    });

    const persistIndent = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const payload = toPayload();

            if (isEdit) {
                const voucherNumber = routeState?.indentData?.voucherNumber || routeState?.indentData?.indentNumber || form.indentNumber;
                await dispatch(updateTransportIndent({ voucherNumber, payload })).unwrap();
                toast.success("Indent updated successfully");
            } else {
                await dispatch(createIndent(payload)).unwrap();
                toast.success("Indent created successfully");
            }

            navigate(-1);
        } catch (error: any) {
            toast.error(error?.message || "Failed to save Indent");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex items-center">
                    <button type="button" onClick={() => navigate(-1)} className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20" title="Go back">
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">{pageTitle}</h1>
                        <p className="text-sm text-muted-foreground">{pageDescription}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-3 pb-28 sm:p-2">
                <div className="space-y-4">
                    <FormSectionCard title="Indent Details" icon={<ClipboardList size={18} />}>
                        {renderFields(indentDetailsFields)}
                    </FormSectionCard>

                    <FormSectionCard title="Pickup & Delivery" icon={<MapPin size={18} />}>
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                                <div className="rounded-md border border-border bg-background p-3">
                                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <MapPin size={17} />
                                        </span>

                                        <div>
                                            <h4 className="text-sm font-semibold text-card-foreground">Pickup Details</h4>
                                            <p className="text-xs text-muted-foreground">Select goods pickup location</p>
                                        </div>
                                    </div>

                                    <GoogleAddressAutocompleteWeb
                                        label="Pickup Location"
                                        placeholder="Search pickup location"
                                        value={form.pickupLocation || ""}
                                        country="in"
                                        onInputChange={(value: string) => updateField("pickupLocation", value)}
                                        onSelectAddress={handlePickupAddressSelect}
                                    />
                                </div>

                                <div className="rounded-md border border-border bg-background p-3">
                                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <MapPin size={17} />
                                        </span>

                                        <div>
                                            <h4 className="text-sm font-semibold text-card-foreground">Delivery Details</h4>
                                            <p className="text-xs text-muted-foreground">Select goods delivery location</p>
                                        </div>
                                    </div>

                                    <GoogleAddressAutocompleteWeb
                                        label="Delivery Location"
                                        placeholder="Search delivery location"
                                        value={form.deliveryLocation || ""}
                                        country="in"
                                        onInputChange={(value: string) => updateField("deliveryLocation", value)}
                                        onSelectAddress={handleDeliveryAddressSelect}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                                {renderFields(reportingFields)}
                            </div>
                        </div>
                    </FormSectionCard>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <FormSectionCard title="Vehicle Requirement" icon={<Truck size={18} />}>
                            <div className="md:col-span-2 xl:col-span-3">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {renderFields(vehicleFields)}
                                </div>
                            </div>
                        </FormSectionCard>

                        <FormSectionCard title="Material Details" icon={<FileText size={18} />}>
                            <div className="md:col-span-2 xl:col-span-3">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {renderFields(materialFields)}
                                </div>
                            </div>
                        </FormSectionCard>
                    </div>

                    <FormSectionCard title="Additional Details" icon={<CalendarDays size={18} />}>
                        <div className="md:col-span-2 xl:col-span-3">
                            {renderFields(additionalFields)}
                        </div>
                    </FormSectionCard>
                </div>
            </main>

            <footer className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <button type="button" onClick={() => navigate(-1)} disabled={loading} className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60">
                    Cancel
                </button>

                <button type="button" onClick={persistIndent} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
                    <Save size={17} />
                    {loading ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
            </footer>
        </div>
    );
};

export default CreateEditIndent;