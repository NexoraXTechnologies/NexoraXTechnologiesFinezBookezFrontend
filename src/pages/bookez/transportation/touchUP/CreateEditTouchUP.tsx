import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, FileText, Flag, MapPin, Package, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Select from "react-select";
import { renderField } from "../../../../components/inputs";
import { FormSectionCard } from "../../../../components/SectionCards";
import GoogleAddressAutocompleteWeb from "../../../../components/common/GoogleAddressAutocompleteWeb";
import { getCitiesByState, getStates } from "../../../../redux/slices/professionalSlice/stateCitySlice";
import { getTransportOrders } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import { createTransportTouchup, getAllTransportTouchup, updateTransportTouchup } from "../../../../redux/slices/professionalSlice/transportation/touchUpSlice";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";

const getDisplayName = (name: any) => {
    if (!name) return "";
    if (typeof name === "string") return name;
    if (typeof name === "object") return name.en || name.mr || name.hi || name.gu || name.ta || name.te || name.kn || name.ml || name.pa || "";
    return String(name);
};

const normalizeText = (value: any) => String(value || "").trim().toLowerCase();

const createEmptyLocation = () => ({
    location: "",
    address: "",
    stateCode: "",
    stateName: "",
    cityName: "",
    pincode: "",
    latitude: "",
    longitude: "",
    placeId: ""
});

const createEmptyTouchUp = () => ({
    id: `${Date.now()}-${Math.random()}`,
    touchUpId: "",
    pickupLocation: createEmptyLocation(),
    deliveryLocation: createEmptyLocation(),
    material: "",
    unit: "",
    quantity: "",
    invoiceNumber: "",
    consignor: "",
    consignee: "",
    touchUpPOD: "",
    touchUpStatus: "pending"
});

const createInitialForm = () => ({
    tripOrder: "",
    touchUps: [createEmptyTouchUp()]
});

const normalizePOD = (value: any) => {
    if (!value) return "";
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return "";
    return value;
};

const normalizeLocationForEdit = (data: any = {}) => ({
    ...createEmptyLocation(),
    location: data?.location || data?.name || data?.address || "",
    address: data?.address || data?.location || "",
    stateCode: data?.stateCode || "",
    stateName: data?.stateName || data?.state || "",
    cityName: data?.cityName || data?.city || "",
    pincode: data?.pincode || data?.postalCode || "",
    latitude: data?.latitude ?? data?.lat ?? "",
    longitude: data?.longitude ?? data?.lng ?? "",
    placeId: data?.placeId || ""
});

const normalizeTouchUp = (data: any = {}, index: number) => ({
    ...createEmptyTouchUp(),
    id: data?.id || data?._id || data?.touchUpId || `touch-up-${index}`,
    touchUpId: data?.touchUpId || "",
    pickupLocation: normalizeLocationForEdit(data?.pickupLocation),
    deliveryLocation: normalizeLocationForEdit(data?.deliveryLocation),
    material: data?.material || "",
    unit: data?.unit || "",
    quantity: data?.quantity ?? "",
    invoiceNumber: data?.invoiceNumber || "",
    consignor: data?.consignor || "",
    consignee: data?.consignee || "",
    touchUpPOD: normalizePOD(data?.touchUpPOD),
    touchUpStatus: data?.touchUpStatus || "pending"
});

const normalizeFormForEdit = (data: any = {}) => {
    const existingTouchUps = Array.isArray(data?.touchUp)
        ? data.touchUp
        : Array.isArray(data?.touchUps)
            ? data.touchUps
            : data?.pickupLocation || data?.deliveryLocation
                ? [data]
                : [];

    return {
        tripOrder: data?.tripOrder || "",
        touchUps: existingTouchUps.length ? existingTouchUps.map(normalizeTouchUp) : [createEmptyTouchUp()]
    };
};

const touchUpStatusOptions = [
    { label: "Select Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "inProgress" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" }
];

const TouchUpLocationBlock = ({ type, label, location, states, onFieldChange }: any) => {
    const dispatch = useDispatch<any>();
    const [cities, setCities] = useState<any[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const stateCode = location?.stateCode || "";
    const cityName = location?.cityName || "";

    const findStateByName = (stateNameValue: any) => {
        const clean = normalizeText(stateNameValue);
        return (states || []).find((item: any) => normalizeText(getDisplayName(item?.name || item?.stateName)) === clean) || null;
    };

    useEffect(() => {
        if (!stateCode) {
            setCities([]);
            return;
        }

        let active = true;
        setLoadingCities(true);

        dispatch(getCitiesByState({ stateCode, searchText: "" }))
            .unwrap()
            .then((res: any) => {
                if (!active) return;
                const list = Array.isArray(res?.data) ? res.data : res || [];
                setCities(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (active) setCities([]);
            })
            .finally(() => {
                if (active) setLoadingCities(false);
            });

        return () => {
            active = false;
        };
    }, [dispatch, stateCode]);

    const hasCurrentCityInOptions = cities.some((item: any) => normalizeText(getDisplayName(item?.name || item?.cityName)) === normalizeText(cityName));

    const stateOptions = [
        { label: `Select ${label} State`, value: "" },
        ...(states || []).map((item: any) => {
            const code = item?.isoCode || item?.stateCode || item?.code || "";
            const name = getDisplayName(item?.name || item?.stateName);
            return { label: name || code, value: code, stateName: name };
        })
    ];

    const cityOptions = [
        { label: stateCode ? `Select ${label} City` : "Select state first", value: "" },
        ...(cityName && !hasCurrentCityInOptions ? [{ label: cityName, value: cityName }] : []),
        ...cities.map((item: any) => {
            const name = getDisplayName(item?.name || item?.cityName);
            return { label: name, value: name };
        })
    ];

    const handleAddressSelect = (address: any) => {
        const matchedState = findStateByName(address?.stateName);
        const resolvedStateCode = matchedState?.isoCode || matchedState?.stateCode || matchedState?.code || "";
        const resolvedStateName = getDisplayName(matchedState?.name || matchedState?.stateName) || address?.stateName || "";
        const resolvedCityName = address?.city || "";
        const fullAddress = address?.fullAddress || address?.formattedAddress || "";

        onFieldChange("location", fullAddress || resolvedCityName || "");
        onFieldChange("address", fullAddress);
        onFieldChange("stateCode", resolvedStateCode);
        onFieldChange("stateName", resolvedStateName);
        onFieldChange("cityName", resolvedCityName);
        onFieldChange("pincode", address?.pincode || "");
        onFieldChange("latitude", address?.lat || "");
        onFieldChange("longitude", address?.lng || "");
        onFieldChange("placeId", address?.placeId || "");
    };

    const handleStateChange = (e: any) => {
        const value = e?.target?.value ?? "";
        const selected = stateOptions.find((item: any) => String(item.value) === String(value));

        onFieldChange("stateCode", value);
        onFieldChange("stateName", selected?.stateName || "");
        onFieldChange("cityName", "");
    };

    const handleCityChange = (e: any) => onFieldChange("cityName", e?.target?.value ?? "");

    return (
        <div className="w-full min-w-0 rounded-md border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${type === "pickup" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
                    {type === "pickup" ? <MapPin size={17} /> : <Flag size={17} />}
                </span>

                <div>
                    <h4 className="text-sm font-semibold text-card-foreground">{label} Details</h4>
                    <p className="text-xs text-muted-foreground">{type === "pickup" ? "Goods pickup location" : "Goods delivery location"}</p>
                </div>
            </div>

            <GoogleAddressAutocompleteWeb
                label={`${label} Location`}
                placeholder={`Search ${label.toLowerCase()} location`}
                value={location?.location || ""}
                country="in"
                onInputChange={(value: string) => onFieldChange("location", value)}
                onSelectAddress={handleAddressSelect}
            />

            <div className="mt-3 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                {renderField({
                    field: { key: "stateCode", label: `${label} State`, type: "select", options: stateOptions },
                    form: location,
                    handleSelectChange: () => handleStateChange,
                    handleInputChange: () => handleStateChange
                })}

                {renderField({
                    field: { key: "cityName", label: `${label} City`, type: "select", options: cityOptions, disabled: !stateCode || loadingCities },
                    form: location,
                    handleSelectChange: () => handleCityChange,
                    handleInputChange: () => handleCityChange
                })}

                {/* {renderField({
                    field: { key: "pincode", label: `${label} Pincode`, type: "text" },
                    form: location,
                    handleInputChange: () => (e: any) => onFieldChange("pincode", e?.target?.value ?? ""),
                    handleSelectChange: () => (e: any) => onFieldChange("pincode", e?.target?.value ?? "")
                })} */}

                <div />

                <div className="md:col-span-2">
                    {renderField({
                        field: { key: "address", label: `${label} Address`, type: "textarea" },
                        form: location,
                        handleInputChange: () => (e: any) => onFieldChange("address", e?.target?.value ?? ""),
                        handleSelectChange: () => (e: any) => onFieldChange("address", e?.target?.value ?? "")
                    })}
                </div>
            </div>
        </div>
    );
};

const TouchUpCard = ({ index, touchUp, totalTouchUps, states, productOptions, unitMasterOptions, updateTouchUpField, updateTouchUpLocation, removeTouchUp, handlePODChange }: any) => {
    const materialOptions = useMemo(() => {
        const options = [...(productOptions || [])];

        if (touchUp?.material && !options.some((item: any) => String(item?.value) === String(touchUp.material))) {
            options.push({ label: touchUp.material, value: touchUp.material });
        }

        return options;
    }, [productOptions, touchUp?.material]);

    const resolvedUnitOptions = useMemo(() => {
        const options = [...(unitMasterOptions || [])];

        if (touchUp?.unit) {
            const matchedUnit = options.find((item: any) => String(item?.value || "").toLowerCase() === String(touchUp.unit).toLowerCase());

            if (matchedUnit && String(matchedUnit.value) !== String(touchUp.unit)) {
                options.push({ label: matchedUnit.label, value: touchUp.unit });
            } else if (!matchedUnit) {
                options.push({ label: touchUp.unit, value: touchUp.unit });
            }
        }

        return options;
    }, [unitMasterOptions, touchUp?.unit]);

    const materialFields = [
        { key: "material", label: "Material", type: "select", options: materialOptions, mandatory: true },
        { key: "unit", label: "Unit", type: "select", options: resolvedUnitOptions, mandatory: true },
        { key: "quantity", label: "Quantity", type: "number", mandatory: true },
        { key: "invoiceNumber", label: "Invoice Number", type: "text" }
    ];

    const partyFields = [
        { key: "consignor", label: "Consignor", type: "text" },
        { key: "consignee", label: "Consignee", type: "text" },
        { key: "touchUpStatus", label: "Touch Up Status", type: "select", options: touchUpStatusOptions, mandatory: true }
    ];

    const handleInputChange = (key: string) => (e: any) => updateTouchUpField(index, key, e?.target?.value ?? "");
    const handleSelectChange = (key: string) => (e: any) => updateTouchUpField(index, key, e?.target?.value ?? "");

    const renderTouchUpFields = (fields: any[]) => fields.map((field: any) => renderField({
        field,
        form: touchUp,
        handleInputChange,
        handleSelectChange,
        updateField: (key: string, value: any) => updateTouchUpField(index, key, value)
    }));

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-md border border-border bg-background">
            <div className="flex w-full items-center justify-between border-b border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>

                    <div>
                        <h3 className="text-sm font-bold text-card-foreground">
                            {touchUp?.touchUpId ? `${touchUp.touchUpId}` : `Touch Up ${index + 1}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">Pickup, delivery, material and POD details</p>
                    </div>
                </div>

                {totalTouchUps > 1 && (
                    <button type="button" onClick={() => removeTouchUp(index)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-danger transition hover:bg-danger/10">
                        <Trash2 size={14} /> Remove
                    </button>
                )}
            </div>

            <div className="flex w-full flex-col gap-4 p-3">
                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                    <TouchUpLocationBlock type="pickup" label="Pickup" location={touchUp.pickupLocation} states={states} onFieldChange={(key: string, value: any) => updateTouchUpLocation(index, "pickupLocation", key, value)} />
                    <TouchUpLocationBlock type="delivery" label="Delivery" location={touchUp.deliveryLocation} states={states} onFieldChange={(key: string, value: any) => updateTouchUpLocation(index, "deliveryLocation", key, value)} />
                </div>

                <div className="w-full rounded-md border border-border bg-card p-3">
                    <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <Package size={17} className="text-primary" />
                        <h4 className="text-sm font-semibold text-card-foreground">Material Details</h4>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{renderTouchUpFields(materialFields)}</div>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                    <div className="w-full rounded-md border border-border bg-card p-3">
                        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                            <FileText size={17} className="text-primary" />
                            <h4 className="text-sm font-semibold text-card-foreground">Party & Status</h4>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">{renderTouchUpFields(partyFields)}</div>
                    </div>

                    <div className="w-full rounded-md border border-border bg-card p-3">
                        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                            <Upload size={17} className="text-primary" />
                            <h4 className="text-sm font-semibold text-card-foreground">Touch Up POD</h4>
                        </div>

                        {!touchUp.touchUpPOD ? (
                            <label className="flex min-h-[86px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-4 py-3 text-center transition hover:border-primary/40 hover:bg-primary/5">
                                <Upload size={20} className="text-primary" />
                                <span className="text-xs font-semibold text-card-foreground">Upload POD</span>
                                <span className="text-[11px] text-muted-foreground">PDF, PNG, JPG, JPEG</span>
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf" className="hidden" onChange={e => handlePODChange(index, e)} />
                            </label>
                        ) : (
                            <div className="flex min-h-[86px] w-full items-center justify-between rounded-md border border-success/20 bg-success/5 px-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <FileText size={18} className="shrink-0 text-success" />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-card-foreground">POD Attached</p>
                                        <p className="text-[11px] text-muted-foreground">Existing POD</p>
                                    </div>
                                </div>

                                <button type="button" onClick={() => updateTouchUpField(index, "touchUpPOD", "")} className="rounded-md p-2 text-danger transition hover:bg-danger/10">
                                    <X size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateEditTouchUP = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const routeState: any = location.state || {};
    const isEdit = routeState?.mode === "edit" || Boolean(routeState?.touchUpData);

    const { states = [] } = useSelector((state: any) => state.stateCity || {});
    const { transportOrders = [] } = useSelector((state: any) => state.transportOrder || {});
    const { transportTouchups = [] } = useSelector((state: any) => state.transportTouchup || {});
    const { products = [] } = useSelector((state: any) => state.productMaster || {});
    const { units = [] } = useSelector((state: any) => state.unitMaster || {});

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(routeState?.touchUpData ? normalizeFormForEdit(routeState.touchUpData) : createInitialForm());

    const pageTitle = routeState?.title || (isEdit ? "Edit Touch Up" : "Create Touch Up");
    const pageDescription = routeState?.description || (isEdit ? "Update touch up points for this transport order." : "Create pickup or delivery touch up against a transport trip order.");

    const productOptions = useMemo(() => {
        return [
            { label: "Select Material", value: "" },
            ...(products || [])
                .map((product: any) => {
                    const productName = product?.productName || product?.name || "";
                    const productCode = product?.productCode || product?.code || "";

                    if (!productName && !productCode) return null;

                    return {
                        label: productCode && productName ? `${productName}` : productName || productCode,
                        value: productCode || productName
                    };
                })
                .filter(Boolean)
        ];
    }, [products]);

    const unitMasterOptions = useMemo(() => [
        { label: "Select Unit", value: "" },
        ...(units || []).map((item: any) => {
            const unitName = item?.unitName || item?.name || item?.unit || "";
            const unitCode = item?.unitCode || item?.code || "";
            const value = unitName || unitCode;
            if (!value) return null;
            return { label: unitName || unitCode, value };
        }).filter(Boolean)
    ], [units]);

    useEffect(() => {
        // @ts-ignore
        dispatch(getStates());
        dispatch(getAllProducts({ limit: 200, offset: 0 }));
        dispatch(getAllUnits({ limit: 200, offset: 0 }));
        dispatch(getTransportOrders({ limit: 200, offset: 0, status: "open" }));
        dispatch(getAllTransportTouchup({ limit: 500, offset: 0, search: "" }));
    }, [dispatch]);

    // RESOLVE BACKEND STATE NAME TO STATE CODE FOR EDIT PREFILL
    useEffect(() => {
        if (!isEdit || !states?.length) return;

        setForm((prev: any) => {
            let changed = false;

            const resolveLocationState = (locationData: any) => {
                if (!locationData || locationData?.stateCode || !locationData?.stateName) return locationData;

                const matchedState = states.find((item: any) => {
                    const stateName = getDisplayName(item?.name || item?.stateName);
                    return normalizeText(stateName) === normalizeText(locationData.stateName);
                });

                const stateCode = matchedState?.isoCode || matchedState?.stateCode || matchedState?.code || "";
                if (!stateCode) return locationData;

                changed = true;
                return { ...locationData, stateCode };
            };

            const touchUps = (prev.touchUps || []).map((touchUp: any) => ({
                ...touchUp,
                pickupLocation: resolveLocationState(touchUp?.pickupLocation),
                deliveryLocation: resolveLocationState(touchUp?.deliveryLocation)
            }));

            return changed ? { ...prev, touchUps } : prev;
        });
    }, [isEdit, states]);

    const usedTransportOrders = useMemo(() => {
        return new Set(
            (transportTouchups || [])
                .map((item: any) => item?.tripOrder)
                .filter(Boolean)
                .map((value: any) => String(value))
        );
    }, [transportTouchups]);

    const transportOrderOptions = useMemo(() => {
        const currentEditOrder = isEdit ? String(form.tripOrder || "") : "";

        const options = (transportOrders || [])
            .map((order: any) => {
                const value = order?.transportOrderNumber || order?.voucherNumber || "";
                if (!value) return null;

                const alreadyUsed = usedTransportOrders.has(String(value));
                const isCurrentEditOrder = isEdit && String(value) === currentEditOrder;
                const disabled = alreadyUsed && !isCurrentEditOrder;

                return {
                    label: `${value} - ${order?.customerDetails?.customerName || order?.customerName || "-"}${disabled ? " (Touch Up Created)" : ""}`,
                    value,
                    isDisabled: disabled
                };
            })
            .filter(Boolean) as any[];

        if (form.tripOrder && !options.some((item: any) => String(item?.value) === String(form.tripOrder))) {
            options.unshift({ label: form.tripOrder, value: form.tripOrder, isDisabled: false });
        }

        return options;
    }, [transportOrders, usedTransportOrders, form.tripOrder, isEdit]);

    const selectedOrderOption = transportOrderOptions.find((item: any) => item?.value === form.tripOrder) || null;

    const updateField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

    const updateTouchUpField = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const touchUps = [...(prev.touchUps || [])];
            touchUps[index] = { ...touchUps[index], [key]: value };
            return { ...prev, touchUps };
        });
    };

    const updateTouchUpLocation = (index: number, locationKey: "pickupLocation" | "deliveryLocation", key: string, value: any) => {
        setForm((prev: any) => {
            const touchUps = [...(prev.touchUps || [])];
            touchUps[index] = { ...touchUps[index], [locationKey]: { ...(touchUps[index]?.[locationKey] || {}), [key]: value } };
            return { ...prev, touchUps };
        });
    };

    const addTouchUp = () => setForm((prev: any) => ({ ...prev, touchUps: [...(prev.touchUps || []), createEmptyTouchUp()] }));

    const removeTouchUp = (index: number) => {
        if ((form.touchUps || []).length <= 1) {
            toast.warn("At least one Touch Up is required");
            return;
        }

        setForm((prev: any) => ({ ...prev, touchUps: (prev.touchUps || []).filter((_: any, i: number) => i !== index) }));
    };

    const handlePODChange = (index: number, e: any) => {
        const file = e?.target?.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => updateTouchUpField(index, "touchUpPOD", reader.result || "");
        reader.onerror = () => toast.error("Failed to read POD file");
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        if (!String(form.tripOrder || "").trim()) {
            toast.warn("Transport Order is required");
            return false;
        }

        if (!Array.isArray(form.touchUps) || !form.touchUps.length) {
            toast.warn("At least one Touch Up is required");
            return false;
        }

        return true;
    };

    const toPayload = () => ({
        tripOrder: String(form.tripOrder || "").trim(),
        touchUp: (form.touchUps || []).map((touchUp: any) => ({
            ...(touchUp?.touchUpId ? { touchUpId: touchUp.touchUpId } : {}),
            pickupLocation: { ...(touchUp.pickupLocation || {}) },
            deliveryLocation: { ...(touchUp.deliveryLocation || {}) },
            material: String(touchUp.material || "").trim(),
            unit: String(touchUp.unit || "").trim(),
            quantity: Number(touchUp.quantity || 0),
            invoiceNumber: String(touchUp.invoiceNumber || "").trim(),
            consignor: String(touchUp.consignor || "").trim(),
            consignee: String(touchUp.consignee || "").trim(),
            touchUpPOD: touchUp.touchUpPOD || "",
            touchUpStatus: touchUp.touchUpStatus || "pending"
        }))
    });

    const persistTouchUp = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const payload = toPayload();

            if (isEdit) {
                const transportTouchupNumber = routeState?.touchUpData?.transportTouchupNumber || routeState?.transportTouchupNumber;

                if (!transportTouchupNumber) {
                    toast.warn("Transport Touch Up number not found");
                    return;
                }

                await dispatch(updateTransportTouchup({ voucherNumber: transportTouchupNumber, payload })).unwrap();
                toast.success("Touch Up updated successfully");
            } else {
                await dispatch(createTransportTouchup(payload)).unwrap();
                toast.success("Touch Up created successfully");
            }

            navigate(-1);
        } catch (error: any) {
            toast.error(error?.message || "Failed to save Touch Up");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex items-center">
                    <button type="button" onClick={() => navigate(-1)} className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20">
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
                    <FormSectionCard title="Transport Order" icon={<ClipboardList size={18} />}>
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="flex w-full items-end gap-3">
                                <div className="min-w-0 flex-1">
                                    <label className="mb-1 block text-sm font-medium text-card-foreground">
                                        Transport Order <span className="text-danger">*</span>
                                    </label>

                                    <Select
                                        value={selectedOrderOption}
                                        options={transportOrderOptions}
                                        placeholder="Select Transport Order"
                                        isSearchable
                                        isOptionDisabled={(option: any) => option?.isDisabled === true}
                                        onChange={(option: any) => updateField("tripOrder", option?.value || "")}
                                        classNamePrefix="rs"
                                    />
                                </div>

                                <div className="flex h-10 shrink-0 items-center rounded-md border border-primary/20 bg-primary/5 px-3 text-xs font-medium text-primary">
                                    <MapPin size={14} className="mr-2 shrink-0" />
                                    {(form.touchUps || []).length} Touch Up {(form.touchUps || []).length === 1 ? "Point" : "Points"}
                                </div>
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard title="Touch Up Points" icon={<MapPin size={18} />}>
                        <div className="w-full min-w-0 md:col-span-2 xl:col-span-3">
                            <div className="mb-3 flex w-full items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-card-foreground">Route Touch Ups</h3>
                                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                            {(form.touchUps || []).length} {(form.touchUps || []).length === 1 ? "Point" : "Points"}
                                        </span>
                                    </div>

                                    <p className="mt-0.5 text-xs text-muted-foreground">Add multiple touch up points against the transport order.</p>
                                </div>

                                <button type="button" onClick={addTouchUp} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
                                    <Plus size={15} /> Add Touch Up
                                </button>
                            </div>

                            <div className="flex w-full flex-col gap-4">
                                {(form.touchUps || []).map((touchUp: any, index: number) => (
                                    <TouchUpCard
                                        key={touchUp.id || touchUp.touchUpId || index}
                                        index={index}
                                        touchUp={touchUp}
                                        totalTouchUps={form.touchUps.length}
                                        states={states}
                                        productOptions={productOptions}
                                        unitMasterOptions={unitMasterOptions}
                                        updateTouchUpField={updateTouchUpField}
                                        updateTouchUpLocation={updateTouchUpLocation}
                                        removeTouchUp={removeTouchUp}
                                        handlePODChange={handlePODChange}
                                    />
                                ))}
                            </div>

                            <button type="button" onClick={addTouchUp} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 text-xs font-semibold text-primary transition hover:bg-primary/10">
                                <Plus size={15} /> Add Another Touch Up
                            </button>
                        </div>
                    </FormSectionCard>
                </div>
            </main>

            <footer className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <button type="button" onClick={() => navigate(-1)} disabled={loading} className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60">
                    Cancel
                </button>

                <button type="button" onClick={persistTouchUp} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
                    <Save size={17} />
                    {loading ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
            </footer>
        </div>
    );
};

export default CreateEditTouchUP;