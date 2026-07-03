// import { MapPin, Truck } from "lucide-react";
// import { FormSectionCard, SectionCard } from "../../../../../components/SectionCards";
// import { renderField } from "../../../../../components/inputs";
// import {
// 	priorityOptions,
// 	routeTypeOptions,
// } from "../transportOrderOptions";

// const DeliveryStep = ({ form, update, setForm }: any) => {

// 	const updateDeliveryField = (key: string, value: any) => {
// 		if (key === "deliveryStateName") {
// 			update("deliveryDetails", "deliveryStateName", value);
// 			update("deliveryDetails", "deliveryStateCode", value);
// 			return;
// 		}

// 		if (key === "deliveryCityName") {
// 			update("deliveryDetails", "deliveryCityName", value);
// 			update("deliveryDetails", "deliveryLocation", value);
// 			return;
// 		}

// 		update("deliveryDetails", key, value);
// 	};

// 	const updateRouteField = (key: string, value: any) => {
// 		update("routeDetails", key, value);
// 	};

// 	const updateRootField = (key: string, value: any) => {
// 		setForm((prev: any) => ({
// 			...prev,
// 			[key]: value,
// 		}));
// 	};

// 	const handleInputChange = (key: string) => (e: any) => {
// 		const value = e?.target?.value ?? "";

// 		if (key.startsWith("deliveryDetails.")) {
// 			const deliveryKey = key.replace("deliveryDetails.", "");
// 			updateDeliveryField(deliveryKey, value);
// 			return;
// 		}

// 		if (key.startsWith("routeDetails.")) {
// 			const routeKey = key.replace("routeDetails.", "");
// 			updateRouteField(routeKey, value);
// 			return;
// 		}

// 		updateRootField(key, value);
// 	};

// 	const handleSelectChange = (key: string) => (e: any) => {
// 		handleInputChange(key)(e);
// 	};

// 	const updateField = (key: string, value: any) => {
// 		if (key.startsWith("deliveryDetails.")) {
// 			const deliveryKey = key.replace("deliveryDetails.", "");
// 			updateDeliveryField(deliveryKey, value);
// 			return;
// 		}

// 		if (key.startsWith("routeDetails.")) {
// 			const routeKey = key.replace("routeDetails.", "");
// 			updateRouteField(routeKey, value);
// 			return;
// 		}

// 		updateRootField(key, value);
// 	};

// 	const fieldForm = {
// 		"deliveryDetails.deliveryStateName":
// 			form.deliveryDetails?.deliveryStateName || "",
// 		"deliveryDetails.deliveryCityName":
// 			form.deliveryDetails?.deliveryCityName || "",
// 		"deliveryDetails.expectedDeliveryDateTime":
// 			form.deliveryDetails?.expectedDeliveryDateTime || "",
// 		"deliveryDetails.deliveryContactName":
// 			form.deliveryDetails?.deliveryContactName || "",
// 		"deliveryDetails.deliveryContactNumber":
// 			form.deliveryDetails?.deliveryContactNumber || "",
// 		"deliveryDetails.deliveryAddress":
// 			form.deliveryDetails?.deliveryAddress || "",

// 		"routeDetails.routeDistanceKm":
// 			form.routeDetails?.routeDistanceKm || "",
// 		"routeDetails.routeType":
// 			form.routeDetails?.routeType || "",
// 		"routeDetails.expectedTollAmount":
// 			form.routeDetails?.expectedTollAmount || "",

// 		priority: form.priority || "",
// 		remarks: form.remarks || "",
// 	};

// 	const deliveryFields = [
// 		{
// 			key: "deliveryDetails.deliveryStateName",
// 			label: "Delivery Location",
// 			type: "text",
// 			// mandatory: true,
// 		},
// 		{
// 			key: "deliveryDetails.deliveryStateName",
// 			label: "Delivery State",
// 			type: "text",
// 			mandatory: true,
// 		},
// 		{
// 			key: "deliveryDetails.deliveryCityName",
// 			label: "Delivery City",
// 			type: "text",
// 			mandatory: true,
// 		},
// 		{
// 			key: "deliveryDetails.expectedDeliveryDateTime",
// 			label: "Expected Delivery Date & Time",
// 			type: "datetime-local",
// 		},
// 		{
// 			key: "deliveryDetails.deliveryContactName",
// 			label: "Contact Name",
// 			type: "text",
// 		},
// 		{
// 			key: "deliveryDetails.deliveryContactNumber",
// 			label: "Contact Number",
// 			type: "number",
// 		},
// 		{
// 			key: "deliveryDetails.deliveryAddress",
// 			label: "Delivery Address",
// 			type: "textarea",
// 			className: "md:col-span-2 xl:col-span-3",
// 		},
// 	];

// 	const routeFields = [
// 		{
// 			key: "routeDetails.routeDistanceKm",
// 			label: "Route Distance (KM)",
// 			type: "number",
// 		},
// 		{
// 			key: "routeDetails.routeType",
// 			label: "Route Type",
// 			type: "select",
// 			options: routeTypeOptions,
// 		},
// 		{
// 			key: "routeDetails.expectedTollAmount",
// 			label: "Expected Toll Amount",
// 			type: "number",
// 		},
// 		{
// 			key: "priority",
// 			label: "Priority",
// 			type: "select",
// 			options: priorityOptions,
// 		},
// 		{
// 			key: "remarks",
// 			label: "Remarks",
// 			type: "textarea",
// 			className: "md:col-span-2 xl:col-span-3",
// 		},
// 	];

// 	const renderFields = (fields: any[]) =>
// 		fields.map((field: any) =>
// 			renderField({
// 				field,
// 				form: fieldForm,
// 				handleInputChange,
// 				handleSelectChange,
// 				updateField,
// 			})
// 		);

// 	return (
// 		<div className="space-y-4">
// 			<FormSectionCard title="Delivery Details" icon={<MapPin size={18} />}>
// 				{renderFields(deliveryFields)}
// 			</FormSectionCard>

// 			<FormSectionCard title="Route Details" icon={<Truck size={18} />}>
// 				{renderFields(routeFields)}
// 			</FormSectionCard>
// 		</div>
// 	);
// };

// export default DeliveryStep;



import { MapPin, Truck } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import {
    priorityOptions,
    routeTypeOptions,
} from "../transportOrderOptions";
import { useEffect } from "react";
import {
    getCitiesByState,
    getStates,
} from "../../../../../redux/slices/professionalSlice/stateCitySlice";
import { useDispatch, useSelector } from "react-redux";

const DeliveryStep = ({ form, update, setForm }: any) => {
    const dispatch = useDispatch<any>();

    const { states = [], cities = [] } = useSelector(
        (state: any) => state.stateCity || {}
    );

    const getDisplayName = (name: any) => {
        if (!name) return "";

        if (typeof name === "string") return name;

        if (typeof name === "object") {
            return (
                name.en ||
                name.mr ||
                name.hi ||
                name.gu ||
                name.ta ||
                name.te ||
                name.kn ||
                name.ml ||
                name.pa ||
                ""
            );
        }

        return String(name);
    };

    const stateOptions = [
        { label: "Select Delivery State", value: "" },
        ...(states || []).map((item: any) => {
            const stateCode =
                item?.isoCode ||
                item?.stateCode ||
                item?.code ||
                "";

            const stateName = getDisplayName(item?.name || item?.stateName);

            return {
                label: stateName || stateCode,
                value: stateCode,
                stateCode,
                stateName,
                raw: item,
            };
        }),
    ];

    const cityOptions = [
        {
            label: form.deliveryDetails?.deliveryStateCode
                ? "Select Delivery City"
                : "Select state first",
            value: "",
        },
        ...(cities || []).map((item: any) => {
            const cityName = getDisplayName(item?.name || item?.cityName);

            return {
                label: cityName,
                value: cityName,
                cityName,
                raw: item,
            };
        }),
    ];

    useEffect(() => {
        // @ts-ignore
        dispatch(getStates() as any);
    }, [dispatch]);

    useEffect(() => {
        if (!form.deliveryDetails?.deliveryStateCode) return;

        dispatch(
            getCitiesByState({
                stateCode: form.deliveryDetails.deliveryStateCode,
                searchText: "",
            }) as any
        );
    }, [dispatch, form.deliveryDetails?.deliveryStateCode]);

    const updateDeliveryField = (key: string, value: any) => {
        if (key === "deliveryStateCode") {
            const selectedState = stateOptions.find(
                (item: any) => String(item?.value) === String(value)
            );

            update("deliveryDetails", "deliveryStateCode", value);
            update(
                "deliveryDetails",
                "deliveryStateName",
                selectedState?.stateName || ""
            );
            update("deliveryDetails", "deliveryCityName", "");
            update("deliveryDetails", "deliveryLocation", "");

            if (value) {
                dispatch(
                    getCitiesByState({
                        stateCode: value,
                        searchText: "",
                    }) as any
                );
            }

            return;
        }

        if (key === "deliveryCityName") {
            update("deliveryDetails", "deliveryCityName", value);
            return;
        }

        update("deliveryDetails", key, value);
    };

    const updateRouteField = (key: string, value: any) => {
        update("routeDetails", key, value);
    };

    const updateRootField = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";

        if (key.startsWith("deliveryDetails.")) {
            const deliveryKey = key.replace("deliveryDetails.", "");
            updateDeliveryField(deliveryKey, value);
            return;
        }

        if (key.startsWith("routeDetails.")) {
            const routeKey = key.replace("routeDetails.", "");
            updateRouteField(routeKey, value);
            return;
        }

        updateRootField(key, value);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        handleInputChange(key)(e);
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("deliveryDetails.")) {
            const deliveryKey = key.replace("deliveryDetails.", "");
            updateDeliveryField(deliveryKey, value);
            return;
        }

        if (key.startsWith("routeDetails.")) {
            const routeKey = key.replace("routeDetails.", "");
            updateRouteField(routeKey, value);
            return;
        }

        updateRootField(key, value);
    };


    useEffect(() => {
        const customerName = form.customerDetails?.customerName || "";
        const customerMobile = form.customerDetails?.mobileNumber || "";

        if (customerName && !form.deliveryDetails?.deliveryContactName) {
            update("deliveryDetails", "deliveryContactName", customerName);
        }

        if (customerMobile && !form.deliveryDetails?.deliveryContactNumber) {
            update("deliveryDetails", "deliveryContactNumber", customerMobile);
        }
    }, [
        form.customerDetails?.customerName,
        form.customerDetails?.mobileNumber,
        form.deliveryDetails?.deliveryContactName,
        form.deliveryDetails?.deliveryContactNumber,
        update,
    ]);

    const fieldForm = {
        "deliveryDetails.deliveryLocation":
            form.deliveryDetails?.deliveryLocation || "",

        "deliveryDetails.deliveryStateCode":
            form.deliveryDetails?.deliveryStateCode || "",

        "deliveryDetails.deliveryStateName":
            form.deliveryDetails?.deliveryStateName || "",

        "deliveryDetails.deliveryCityName":
            form.deliveryDetails?.deliveryCityName || "",

        "deliveryDetails.expectedDeliveryDateTime":
            form.deliveryDetails?.expectedDeliveryDateTime || "",

        "deliveryDetails.deliveryContactName":
            form.deliveryDetails?.deliveryContactName || "",

        "deliveryDetails.deliveryContactNumber":
            form.deliveryDetails?.deliveryContactNumber || "",

        "deliveryDetails.deliveryAddress":
            form.deliveryDetails?.deliveryAddress || "",

        "routeDetails.routeDistanceKm":
            form.routeDetails?.routeDistanceKm || "",

        "routeDetails.routeType":
            form.routeDetails?.routeType || "",

        "routeDetails.expectedTollAmount":
            form.routeDetails?.expectedTollAmount || "",

        priority: form.priority || "",
        remarks: form.remarks || "",
    };

    const deliveryFields = [
        {
            key: "deliveryDetails.deliveryLocation",
            label: "Delivery Location",
            type: "text",
            placeholder: "Enter delivery location",
        },
        {
            key: "deliveryDetails.deliveryStateCode",
            label: "Delivery State",
            type: "select",
            options: stateOptions,
            mandatory: true,
        },
        {
            key: "deliveryDetails.deliveryCityName",
            label: "Delivery City",
            type: "select",
            options: cityOptions,
            mandatory: true,
            disabled: !form.deliveryDetails?.deliveryStateCode,
        },
        {
            key: "deliveryDetails.expectedDeliveryDateTime",
            label: "Expected Delivery Date & Time",
            type: "datetime-local",
        },
        {
            key: "deliveryDetails.deliveryContactName",
            label: "Contact Name",
            type: "text",
            placeholder: "Enter contact name",
        },
        {
            key: "deliveryDetails.deliveryContactNumber",
            label: "Contact Number",
            type: "number",
            placeholder: "Enter contact number",
        },
        {
            key: "deliveryDetails.deliveryAddress",
            label: "Delivery Address",
            type: "textarea",
            placeholder: "Enter delivery address",
            className: "md:col-span-2 xl:col-span-3",
        },
    ];

    const routeFields = [
        {
            key: "routeDetails.routeDistanceKm",
            label: "Route Distance (KM)",
            type: "number",
        },
        {
            key: "routeDetails.routeType",
            label: "Route Type",
            type: "select",
            options: routeTypeOptions,
        },
        {
            key: "routeDetails.expectedTollAmount",
            label: "Expected Toll Amount",
            type: "number",
        },
        {
            key: "priority",
            label: "Priority",
            type: "select",
            options: priorityOptions,
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-3",
        },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) =>
            renderField({
                field,
                form: fieldForm,
                handleInputChange,
                handleSelectChange,
                updateField,
            })
        );

    return (
        <div className="space-y-4">
            <FormSectionCard title="Delivery Details" icon={<MapPin size={18} />}>
                {renderFields(deliveryFields)}
            </FormSectionCard>

            <FormSectionCard title="Route Details" icon={<Truck size={18} />}>
                {renderFields(routeFields)}
            </FormSectionCard>
        </div>
    );
};

export default DeliveryStep;