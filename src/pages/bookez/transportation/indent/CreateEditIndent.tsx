import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardList, FileText, Flag, MapPin, Save, Truck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { renderField } from "../../../../components/inputs";
import { FormSectionCard } from "../../../../components/SectionCards";
import GoogleAddressAutocompleteWeb from "../../../../components/common/GoogleAddressAutocompleteWeb";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { getCitiesByState, getStates } from "../../../../redux/slices/professionalSlice/stateCitySlice";
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

export const indentStatusOptions = [
    { label: "Select Status", value: "" },
    { label: "Open", value: "open" },
    { label: "Partially Allocated", value: "partially_allocated" },
    { label: "Fully Allocated", value: "fully_allocated" },
    { label: "Cancelled", value: "cancelled" },
];
const getDisplayName = (name: any) => {
    if (!name) return "";
    if (typeof name === "string") return name;
    if (typeof name === "object") return name.en || name.mr || name.hi || name.gu || name.ta || name.te || name.kn || name.ml || name.pa || "";
    return String(name);
};

const normalizeText = (value: any) => String(value || "").trim().toLowerCase();

const formatDateTimeForInput = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getCustomerContactName = (account: any) =>
    account?.contactPerson ||
    account?.accountContactPerson ||
    account?.contactName ||
    account?.accountName ||
    "";

const getCustomerContactNumber = (account: any) =>
    account?.accountMobile ||
    account?.mobileNumber ||
    account?.contactNumber ||
    account?.accountContactNumber ||
    account?.mobile ||
    "";

const createEmptyPickupDetails = () => ({
    pickupLocation: "",
    pickupAddress: "",
    pickupDateTime: "",
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
    pickupPlaceId: ""
});

const createEmptyDeliveryDetails = () => ({
    deliveryLocation: "",
    deliveryAddress: "",
    expectedDeliveryDateTime: "",
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
    deliveryPlaceId: ""
});

const createInitialIndent = () => ({
    indentNumber: "AUTO",
    indentDate: new Date().toISOString().slice(0, 10),
    customer: "",
    pickupDetails: createEmptyPickupDetails(),
    deliveryDetails: createEmptyDeliveryDetails(),
    reportingDateTime: formatDateTimeForInput(new Date()),
    vehicleType: "",
    numberOfVehicles: 1,
    material: "",
    approximateWeight: "",
    weightUnit: "",
    customerRate: "",
    remarks: "",
    indentStatus: "open"
});

const normalizeIndentForEdit = (data: any = {}) => ({
    ...createInitialIndent(),
    indentNumber: data?.indentNumber || data?.voucherNumber || "AUTO",
    indentDate: data?.indentDate ? String(data.indentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    customer: data?.customer || "",
    pickupDetails: {
        ...createEmptyPickupDetails(),
        ...(data?.pickupDetails || {}),
        pickupLocation: data?.pickupDetails?.pickupLocation || data?.pickupLocation || "",
        pickupAddress: data?.pickupDetails?.pickupAddress || "",
        pickupDateTime: formatDateTimeForInput(data?.pickupDetails?.pickupDateTime)
    },
    deliveryDetails: {
        ...createEmptyDeliveryDetails(),
        ...(data?.deliveryDetails || {}),
        deliveryLocation: data?.deliveryDetails?.deliveryLocation || data?.deliveryLocation || "",
        deliveryAddress: data?.deliveryDetails?.deliveryAddress || "",
        expectedDeliveryDateTime: formatDateTimeForInput(data?.deliveryDetails?.expectedDeliveryDateTime)
    },
    reportingDateTime: formatDateTimeForInput(data?.reportingDateTime),
    vehicleType: data?.vehicleType || "",
    numberOfVehicles: data?.numberOfVehicles ?? "",
    material: data?.material || "",
    approximateWeight: data?.approximateWeight ?? "",
    weightUnit: data?.weightUnit || "",
    customerRate: data?.customerRate ?? "",
    remarks: data?.remarks || "",
    indentStatus: data?.indentStatus || "draft"
});

// LOCATION BLOCK
const IndentLocationBlock = ({ type, details, states, onFieldChange, onFieldsChange }: any) => {
    const dispatch = useDispatch<any>();
    const [cities, setCities] = useState<any[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const pendingStateNameRef = useRef("");
    const pendingCityNameRef = useRef("");
    const selectingAddressRef = useRef(false);

    const isPickup = type === "pickup";
    const title = isPickup ? "Pickup" : "Delivery";
    const locationKey = isPickup ? "pickupLocation" : "deliveryLocation";
    const addressKey = isPickup ? "pickupAddress" : "deliveryAddress";
    const stateKey = isPickup ? "pickupState" : "deliveryState";
    const cityKey = isPickup ? "pickupCity" : "deliveryCity";
    const stateCodeKey = isPickup ? "pickupStateCode" : "deliveryStateCode";
    const stateNameKey = isPickup ? "pickupStateName" : "deliveryStateName";
    const cityNameKey = isPickup ? "pickupCityName" : "deliveryCityName";
    const pincodeKey = isPickup ? "pickupPincode" : "deliveryPincode";
    const latitudeKey = isPickup ? "pickupLatitude" : "deliveryLatitude";
    const longitudeKey = isPickup ? "pickupLongitude" : "deliveryLongitude";
    const placeIdKey = isPickup ? "pickupPlaceId" : "deliveryPlaceId";
    const dateTimeKey = isPickup ? "pickupDateTime" : "expectedDeliveryDateTime";
    const contactNameKey = isPickup ? "pickupContactName" : "deliveryContactName";
    const contactNumberKey = isPickup ? "pickupContactNumber" : "deliveryContactNumber";

    const stateCode = details?.[stateCodeKey] || "";
    const stateName = details?.[stateNameKey] || "";
    const cityName = details?.[cityNameKey] || "";

    const findStateByName = (stateNameValue: any) => {
        const clean = normalizeText(stateNameValue);
        return (states || []).find((item: any) => normalizeText(getDisplayName(item?.name || item?.stateName)) === clean) || null;
    };

    const findCityByName = (cityNameValue: any) => {
        const clean = normalizeText(cityNameValue);
        return (cities || []).find((item: any) => normalizeText(getDisplayName(item?.name || item?.cityName)) === clean) || null;
    };

    const hasCurrentStateInOptions = (states || []).some((item: any) => {
        const code = item?.isoCode || item?.stateCode || item?.code || "";
        return String(code) === String(stateCode);
    });

    const hasCurrentCityInOptions = (cities || []).some((item: any) => {
        const name = getDisplayName(item?.name || item?.cityName);
        return normalizeText(name) === normalizeText(cityName);
    });

    const stateOptions = [
        { label: `Select ${title} State`, value: "" },
        ...(stateCode && !hasCurrentStateInOptions ? [{
            label: stateName || stateCode,
            value: stateCode,
            stateCode,
            stateName,
            raw: details?.[stateKey] || null
        }] : []),
        ...(states || []).map((item: any) => {
            const code = item?.isoCode || item?.stateCode || item?.code || "";
            const name = getDisplayName(item?.name || item?.stateName);
            return { label: name || code, value: code, stateCode: code, stateName: name, raw: item };
        })
    ];

    const cityOptions = [
        { label: stateCode ? `Select ${title} City` : "Select state first", value: "" },
        ...(cityName && !hasCurrentCityInOptions ? [{
            label: cityName,
            value: cityName,
            cityName,
            raw: details?.[cityKey] || null
        }] : []),
        ...(cities || []).map((item: any) => {
            const name = getDisplayName(item?.name || item?.cityName);
            return { label: name, value: name, cityName: name, raw: item };
        })
    ];

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

    useEffect(() => {
        if (!pendingStateNameRef.current || !(states || []).length) return;

        const matchedState = findStateByName(pendingStateNameRef.current);
        if (!matchedState) return;

        const resolvedStateCode = matchedState?.isoCode || matchedState?.stateCode || matchedState?.code || "";
        const resolvedStateName = getDisplayName(matchedState?.name || matchedState?.stateName);

        pendingStateNameRef.current = "";

        onFieldsChange({
            [stateKey]: matchedState,
            [stateCodeKey]: resolvedStateCode,
            [stateNameKey]: resolvedStateName
        });

        if (resolvedStateCode) {
            dispatch(getCitiesByState({ stateCode: resolvedStateCode, searchText: pendingCityNameRef.current || "" }))
                .unwrap()
                .then((res: any) => {
                    const list = Array.isArray(res?.data) ? res.data : res || [];
                    setCities(Array.isArray(list) ? list : []);
                })
                .catch(() => { });
        }
    }, [states]);

    useEffect(() => {
        if (!pendingCityNameRef.current || !cities?.length) return;

        const pendingCityName = pendingCityNameRef.current;
        const matchedCity = findCityByName(pendingCityName);

        pendingCityNameRef.current = "";

        if (matchedCity) {
            onFieldsChange({
                [cityKey]: matchedCity,
                [cityNameKey]: getDisplayName(matchedCity?.name || matchedCity?.cityName) || pendingCityName
            });
        }
    }, [cities]);

    const handleAddressSelect = (address: any) => {
        selectingAddressRef.current = true;

        const selectedState = address?.selectedState || findStateByName(address?.stateName);
        const selectedCity = address?.selectedCity || findCityByName(address?.city);

        const resolvedStateCode = selectedState?.isoCode || selectedState?.stateCode || selectedState?.code || "";
        const resolvedStateName = getDisplayName(selectedState?.name || selectedState?.stateName) || address?.stateName || "";
        const resolvedCityName = getDisplayName(selectedCity?.name || selectedCity?.cityName) || address?.city || "";
        const fullAddress = address?.fullAddress || address?.formattedAddress || "";

        // IMPORTANT: full address is kept as the location display value.
        const displayLocation = fullAddress || resolvedCityName || "";

        if (!selectedState && address?.stateName) pendingStateNameRef.current = address.stateName;
        else pendingStateNameRef.current = "";

        if (resolvedCityName) pendingCityNameRef.current = resolvedCityName;
        else pendingCityNameRef.current = "";

        // One parent state update avoids autocomplete flicker.
        onFieldsChange({
            [locationKey]: displayLocation,
            [addressKey]: fullAddress,
            [stateKey]: selectedState || null,
            [stateCodeKey]: resolvedStateCode,
            [stateNameKey]: resolvedStateName,
            [cityKey]: selectedCity || null,
            [cityNameKey]: resolvedCityName,
            [pincodeKey]: address?.pincode || "",
            [latitudeKey]: address?.lat || "",
            [longitudeKey]: address?.lng || "",
            [placeIdKey]: address?.placeId || ""
        });

        if (resolvedStateCode) {
            dispatch(getCitiesByState({ stateCode: resolvedStateCode, searchText: resolvedCityName || "" }))
                .unwrap()
                .then((res: any) => {
                    const list = Array.isArray(res?.data) ? res.data : res || [];
                    setCities(Array.isArray(list) ? list : []);

                    const matchedCity = (Array.isArray(list) ? list : []).find((item: any) =>
                        normalizeText(getDisplayName(item?.name || item?.cityName)) === normalizeText(resolvedCityName)
                    );

                    if (matchedCity) {
                        onFieldsChange({
                            [cityKey]: matchedCity,
                            [cityNameKey]: getDisplayName(matchedCity?.name || matchedCity?.cityName) || resolvedCityName
                        });
                    }
                })
                .catch(() => { });
        }

        setTimeout(() => {
            selectingAddressRef.current = false;
        }, 0);
    };

    const handleLocationInputChange = (value: string) => {
        // Google autocomplete may fire input change immediately after selection.
        // Ignore that one event so the selected full address is not overwritten.
        if (selectingAddressRef.current) return;
        onFieldChange(locationKey, value);
    };

    const handleStateChange = (e: any) => {
        const value = e?.target?.value ?? "";
        const selected = stateOptions.find((item: any) => String(item?.value) === String(value));

        onFieldsChange({
            [stateCodeKey]: value,
            [stateNameKey]: selected?.stateName || "",
            [stateKey]: selected?.raw || null,
            [cityKey]: null,
            [cityNameKey]: ""
        });
    };

    const handleCityChange = (e: any) => {
        const value = e?.target?.value ?? "";
        const selected = cityOptions.find((item: any) => normalizeText(item?.value) === normalizeText(value));

        onFieldsChange({
            [cityKey]: selected?.raw || null,
            [cityNameKey]: value
        });
    };

    return (
        <div className="w-full min-w-0 rounded-md border border-border bg-background p-3">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isPickup ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
                    {isPickup ? <MapPin size={17} /> : <Flag size={17} />}
                </span>

                <div>
                    <h4 className="text-sm font-semibold text-card-foreground">{title} Details</h4>
                    <p className="text-xs text-muted-foreground">{isPickup ? "Goods pickup and reporting details" : "Goods delivery and contact details"}</p>
                </div>
            </div>

            <GoogleAddressAutocompleteWeb
                label={`${title} Location`}
                placeholder={`Search ${title.toLowerCase()} location`}
                value={details?.[locationKey] || ""}
                stateRecords={states}
                cityRecords={cities}
                country="in"
                onInputChange={handleLocationInputChange}
                onSelectAddress={handleAddressSelect}
            />

            <div className="mt-3 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                {renderField({
                    field: { key: stateCodeKey, label: "State", type: "select", options: stateOptions, mandatory: true },
                    form: details,
                    handleSelectChange: () => handleStateChange,
                    handleInputChange: () => handleStateChange
                })}

                {renderField({
                    field: { key: cityNameKey, label: "City", type: "select", options: cityOptions, disabled: !stateCode || loadingCities, mandatory: true },
                    form: details,
                    handleSelectChange: () => handleCityChange,
                    handleInputChange: () => handleCityChange
                })}

                {renderField({
                    field: { key: pincodeKey, label: "Pincode", type: "text" },
                    form: details,
                    handleInputChange: () => (e: any) => onFieldChange(pincodeKey, e?.target?.value ?? ""),
                    handleSelectChange: () => (e: any) => onFieldChange(pincodeKey, e?.target?.value ?? "")
                })}

                {renderField({
                    field: { key: dateTimeKey, label: isPickup ? "Pickup Date & Time" : "Expected Delivery Date & Time", type: "datetime-local", mandatory: true },
                    form: details,
                    handleInputChange: () => (e: any) => onFieldChange(dateTimeKey, e?.target?.value ?? ""),
                    handleSelectChange: () => (e: any) => onFieldChange(dateTimeKey, e?.target?.value ?? "")
                })}

                <div className="md:col-span-2">
                    {renderField({
                        field: { key: addressKey, label: `${title} Address`, type: "textarea", mandatory: true },
                        form: details,
                        handleInputChange: () => (e: any) => onFieldChange(addressKey, e?.target?.value ?? ""),
                        handleSelectChange: () => (e: any) => onFieldChange(addressKey, e?.target?.value ?? "")
                    })}
                </div>

                {renderField({
                    field: { key: contactNameKey, label: "Contact Person", type: "text" },
                    form: details,
                    handleInputChange: () => (e: any) => onFieldChange(contactNameKey, e?.target?.value ?? ""),
                    handleSelectChange: () => (e: any) => onFieldChange(contactNameKey, e?.target?.value ?? "")
                })}

                {renderField({
                    field: { key: contactNumberKey, label: "Contact Number", type: "text" },
                    form: details,
                    handleInputChange: () => (e: any) => onFieldChange(contactNumberKey, e?.target?.value ?? ""),
                    handleSelectChange: () => (e: any) => onFieldChange(contactNumberKey, e?.target?.value ?? "")
                })}
            </div>
        </div>
    );
};

const CreateEditIndent = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const routeState: any = location.state || {};
    const isEdit = routeState?.mode === "edit" || Boolean(routeState?.indentData);

    const { accounts = [] } = useSelector((state: any) => state.accountMaster || {});
    const { units = [] } = useSelector((state: any) => state.unitMaster || {});
    const { products = [] } = useSelector((state: any) => state.productMaster || {});
    const { states = [] } = useSelector((state: any) => state.stateCity || {});

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(routeState?.indentData ? normalizeIndentForEdit(routeState.indentData) : createInitialIndent());

    const pageTitle = routeState?.title || (isEdit ? "Edit Indent" : "Create Indent");
    const pageDescription = routeState?.description || (isEdit ? "Update transport indent details." : "Create a transport indent for vehicle placement and goods movement.");

    useEffect(() => {
        dispatch(getAllAccounts({ accountType: "customer" }));
        dispatch(getAllUnits({ limit: 200, offset: 0 }));
        dispatch(getAllProducts({ limit: 200, offset: 0 }));
        // @ts-ignore
        dispatch(getStates());
    }, [dispatch]);

    const customerOptions = useMemo(() => [
        { label: "Select Customer", value: "" },
        ...(accounts || []).filter((item: any) => item?.accountCode).map((item: any) => ({
            label: item?.accountName || item?.accountCode,
            value: item.accountCode
        }))
    ], [accounts]);

    const unitOptions = useMemo(() => {
        const currentWeightUnit = String(form.weightUnit || "").trim();

        const options: any[] = [
            { label: "Select Weight Unit", value: "" },
            ...(units || []).map((item: any) => {
                const unitName = item?.unitName || item?.name || item?.unit || "";
                const unitCode = item?.unitCode || item?.code || "";
                const value = unitName || unitCode;

                if (!value) return null;

                const isCurrentValue =
                    currentWeightUnit &&
                    (
                        normalizeText(unitName) === normalizeText(currentWeightUnit) ||
                        normalizeText(unitCode) === normalizeText(currentWeightUnit)
                    );

                return {
                    label: unitName || unitCode,
                    value: isCurrentValue ? currentWeightUnit : value
                };
            }).filter(Boolean)
        ];

        if (currentWeightUnit && !options.some((item: any) => String(item?.value) === currentWeightUnit)) {
            options.push({ label: currentWeightUnit, value: currentWeightUnit });
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

    const updateLocationField = (section: "pickupDetails" | "deliveryDetails", key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev?.[section] || {}),
                [key]: value
            }
        }));
    };

    const updateLocationFields = (section: "pickupDetails" | "deliveryDetails", values: any) => {
        setForm((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev?.[section] || {}),
                ...values
            }
        }));
    };

    const handleInputChange = (key: string) => (e: any) => updateField(key, e?.target?.value ?? "");

    const handleSelectChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";

        if (key === "material") {
            const selectedProduct = (products || []).find((item: any) => String(item?.productName || item?.name || item?.productCode || item?.code || "") === String(value));
            const productUnit = selectedProduct?.unitName || selectedProduct?.unit || selectedProduct?.productUnit || selectedProduct?.unitCode || "";
            setForm((prev: any) => ({ ...prev, material: value, weightUnit: productUnit }));
            return;
        }

        if (key !== "customer") {
            updateField(key, value);
            return;
        }

        const selectedCustomer = (accounts || []).find((item: any) => String(item?.accountCode || "") === String(value));

        if (!selectedCustomer) {
            updateField("customer", value);
            return;
        }

        const contactName = getCustomerContactName(selectedCustomer);
        const contactNumber = getCustomerContactNumber(selectedCustomer);

        setForm((prev: any) => ({
            ...prev,
            customer: value,
            pickupDetails: {
                ...(prev?.pickupDetails || createEmptyPickupDetails()),
                pickupContactName: contactName,
                pickupContactNumber: contactNumber
            },
            deliveryDetails: {
                ...(prev?.deliveryDetails || createEmptyDeliveryDetails()),
                deliveryContactName: contactName,
                deliveryContactNumber: contactNumber
            }
        }));
    };

    const indentDetailsFields = [
        { key: "indentNumber", label: "Indent No", type: "text", disabled: true, className: "cursor-default select-none" },
        { key: "indentDate", label: "Indent Date", type: "date", mandatory: true },
        { key: "customer", label: "Customer", type: "select", options: customerOptions, mandatory: true },
        { key: "indentStatus", label: "Indent Status", type: "select", options: indentStatusOptions, mandatory: true }
    ];

    const vehicleFields = [
        { key: "vehicleType", label: "Vehicle Type", type: "select", options: vehicleTypeOptions, mandatory: true },
        { key: "numberOfVehicles", label: "Number Of Vehicles", type: "number", mandatory: true },
        { key: "reportingDateTime", label: "Reporting Date & Time", type: "datetime-local", mandatory: true }
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

    const renderFields = (fields: any[]) => fields.map((field: any) => renderField({ field, form, handleInputChange, handleSelectChange, updateField }));

    const validateForm = () => {
        if (!String(form.customer || "").trim()) {
            toast.warn("Customer is required");
            return false;
        }

        if (!String(form.pickupDetails?.pickupLocation || "").trim()) {
            toast.warn("Pickup Location is required");
            return false;
        }

        if (!String(form.deliveryDetails?.deliveryLocation || "").trim()) {
            toast.warn("Delivery Location is required");
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
        pickupDetails: {
            ...form.pickupDetails,
            pickupDateTime: form.pickupDetails?.pickupDateTime ? new Date(form.pickupDetails.pickupDateTime).toISOString() : ""
        },
        deliveryDetails: {
            ...form.deliveryDetails,
            expectedDeliveryDateTime: form.deliveryDetails?.expectedDeliveryDateTime ? new Date(form.deliveryDetails.expectedDeliveryDateTime).toISOString() : ""
        },
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
                        <div className="w-full md:col-span-2 xl:col-span-3">
                            <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
                                <IndentLocationBlock
                                    type="pickup"
                                    details={form.pickupDetails}
                                    states={states}
                                    onFieldChange={(key: string, value: any) => updateLocationField("pickupDetails", key, value)}
                                    onFieldsChange={(values: any) => updateLocationFields("pickupDetails", values)}
                                />

                                <IndentLocationBlock
                                    type="delivery"
                                    details={form.deliveryDetails}
                                    states={states}
                                    onFieldChange={(key: string, value: any) => updateLocationField("deliveryDetails", key, value)}
                                    onFieldsChange={(values: any) => updateLocationFields("deliveryDetails", values)}
                                />
                            </div>
                        </div>
                    </FormSectionCard>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <FormSectionCard title="Vehicle Requirement" icon={<Truck size={18} />}>
                            <div className="md:col-span-2 xl:col-span-3">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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