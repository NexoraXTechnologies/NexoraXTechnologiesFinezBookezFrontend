import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import { getCitiesByState, getStates } from "../../../../../redux/slices/professionalSlice/stateCitySlice";


const PickupStep = ({ form, update }: any) => {
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
        { label: "Select Pickup State", value: "" },
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
            label: form.pickupDetails?.pickupStateCode
                ? "Select Pickup City"
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
        if (!form.pickupDetails?.pickupStateCode) return;

        dispatch(
            getCitiesByState({
                stateCode: form.pickupDetails.pickupStateCode,
                searchText: "",
            }) as any
        );
    }, [dispatch, form.pickupDetails?.pickupStateCode]);


    useEffect(() => {
        const customerName = form.customerDetails?.customerName || "";
        const customerMobile = form.customerDetails?.mobileNumber || "";

        if (customerName && !form.pickupDetails?.pickupContactName) {
            update("pickupDetails", "pickupContactName", customerName);
        }

        if (customerMobile && !form.pickupDetails?.pickupContactNumber) {
            update("pickupDetails", "pickupContactNumber", customerMobile);
        }
    }, [
        form.customerDetails?.customerName,
        form.customerDetails?.mobileNumber,
        form.pickupDetails?.pickupContactName,
        form.pickupDetails?.pickupContactNumber,
        update,
    ]);

    const updatePickupField = (key: string, value: any) => {
        if (key === "pickupStateCode") {
            const selectedState = stateOptions.find(
                (item: any) => String(item?.value) === String(value)
            );

            update("pickupDetails", "pickupStateCode", value);
            update("pickupDetails", "pickupStateName", selectedState?.stateName || "");
            update("pickupDetails", "pickupCityName", "");
            update("pickupDetails", "pickupLocation", "");

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

        if (key === "pickupCityName") {
            update("pickupDetails", "pickupCityName", value);
            update("pickupDetails", "pickupLocation", value);
            return;
        }

        update("pickupDetails", key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";

        if (key.startsWith("pickupDetails.")) {
            const pickupKey = key.replace("pickupDetails.", "");
            updatePickupField(pickupKey, value);
        }
    };

    const handleSelectChange = (key: string) => (e: any) => {
        handleInputChange(key)(e);
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("pickupDetails.")) {
            const pickupKey = key.replace("pickupDetails.", "");
            updatePickupField(pickupKey, value);
        }
    };

    const fieldForm = {
        "pickupDetails.pickupLocation":
            form.pickupDetails?.pickupLocation || "",
        "pickupDetails.pickupStateCode":
            form.pickupDetails?.pickupStateCode || "",
        "pickupDetails.pickupStateName":
            form.pickupDetails?.pickupStateName || "",
        "pickupDetails.pickupCityName":
            form.pickupDetails?.pickupCityName || "",
        "pickupDetails.pickupDateTime":
            form.pickupDetails?.pickupDateTime || "",
        "pickupDetails.pickupContactName":
            form.pickupDetails?.pickupContactName || "",
        "pickupDetails.pickupContactNumber":
            form.pickupDetails?.pickupContactNumber || "",
        "pickupDetails.pickupAddress":
            form.pickupDetails?.pickupAddress || "",
    };

    // const pickupFields = [
    //     {
    //         key: "pickupDetails.pickupLocation",
    //         label: "Pickup Location",
    //         placeholder: "enter pickup location",
    //         type: "text",

    //     },
    //     {
    //         key: "pickupDetails.pickupStateCode",
    //         label: "Pickup State",
    //         type: "select",
    //         options: stateOptions,
    //         mandatory: true,
    //     },
    //     {
    //         key: "pickupDetails.pickupCityName",
    //         label: "Pickup City",
    //         type: "select",
    //         options: cityOptions,
    //         mandatory: true,
    //         disabled: !form.pickupDetails?.pickupStateCode,
    //     },
    //     {
    //         key: "pickupDetails.pickupDateTime",
    //         label: "Pickup Date & Time",
    //         type: "datetime-local",
    //     },
    //     {
    //         key: "pickupDetails.pickupContactName",
    //         label: "Contact Name",
    //         type: "text",
    //     },
    //     {
    //         key: "pickupDetails.pickupContactNumber",
    //         label: "Contact Number",
    //         type: "number",
    //     },
    //     {
    //         key: "pickupDetails.pickupAddress",
    //         label: "Pickup Address",
    //         type: "textarea",
    //         className: "md:col-span-2 xl:col-span-3",
    //     },
    // ];


    const pickupFields = [
        {
            key: "pickupDetails.pickupLocation",
            label: "Pickup Location",
            placeholder: "Enter pickup location",
            type: "text",
        },
        {
            key: "pickupDetails.pickupStateCode",
            label: "Pickup State",
            type: "select",
            options: stateOptions,
            mandatory: true,
        },
        {
            key: "pickupDetails.pickupCityName",
            label: "Pickup City",
            type: "select",
            options: cityOptions,
            mandatory: true,
            disabled: !form.pickupDetails?.pickupStateCode,
        },
        {
            key: "pickupDetails.pickupDateTime",
            label: "Pickup Date & Time",
            type: "datetime-local",
        },
        {
            key: "pickupDetails.pickupContactName",
            label: "Contact Name",
            type: "text",
            placeholder: "Enter contact name",
        },
        {
            key: "pickupDetails.pickupContactNumber",
            label: "Contact Number",
            type: "number",
            placeholder: "Enter contact number",
        },
        {
            key: "pickupDetails.pickupAddress",
            label: "Pickup Address",
            type: "textarea",
            placeholder: "Enter pickup address",
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
        <FormSectionCard title="Pickup Details" icon={<MapPin size={18} />}>
            {renderFields(pickupFields)}
        </FormSectionCard>
    );
};

export default PickupStep;