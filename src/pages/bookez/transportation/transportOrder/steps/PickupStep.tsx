import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import {
    getCitiesByState,
    getStates,
} from "../../../../../redux/slices/professionalSlice/stateCitySlice";
import GoogleAddressAutocompleteWeb from "../../../../../components/common/GoogleAddressAutocompleteWeb";

const PickupStep = ({ form, update }: any) => {
    const dispatch = useDispatch<any>();

    const pendingStateNameRef = useRef("");
    const pendingCityNameRef = useRef("");

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

    const normalizeText = (value: any) =>
        String(value || "")
            .trim()
            .toLowerCase();

    const findStateByName = (stateNameValue: any) => {
        const cleanState = normalizeText(stateNameValue);

        return (
            states.find((item: any) => {
                const stateName = getDisplayName(item?.name || item?.stateName);

                return normalizeText(stateName) === cleanState;
            }) || null
        );
    };

    const findCityByName = (cityNameValue: any) => {
        const cleanCity = normalizeText(cityNameValue);

        return (
            cities.find((item: any) => {
                const cityName = getDisplayName(item?.name || item?.cityName);

                return normalizeText(cityName) === cleanCity;
            }) || null
        );
    };

    const currentStateCode = form.pickupDetails?.pickupStateCode || "";
    const currentStateName = form.pickupDetails?.pickupStateName || "";
    const currentCityName = form.pickupDetails?.pickupCityName || "";

    const hasCurrentStateInOptions = states.some((item: any) => {
        const stateCode = item?.isoCode || item?.stateCode || item?.code || "";

        return String(stateCode) === String(currentStateCode);
    });

    const hasCurrentCityInOptions = cities.some((item: any) => {
        const cityName = getDisplayName(item?.name || item?.cityName);

        return normalizeText(cityName) === normalizeText(currentCityName);
    });

    const stateOptions = [
        { label: "Select Pickup State", value: "" },

        ...(currentStateCode && !hasCurrentStateInOptions
            ? [
                  {
                      label: currentStateName || currentStateCode,
                      value: currentStateCode,
                      stateCode: currentStateCode,
                      stateName: currentStateName,
                      raw: form.pickupDetails?.pickupState || null,
                  },
              ]
            : []),

        ...(states || []).map((item: any) => {
            const stateCode =
                item?.isoCode || item?.stateCode || item?.code || "";

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

        ...(currentCityName && !hasCurrentCityInOptions
            ? [
                  {
                      label: currentCityName,
                      value: currentCityName,
                      cityName: currentCityName,
                      raw: form.pickupDetails?.pickupCity || null,
                  },
              ]
            : []),

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
        if (!pendingStateNameRef.current || !states?.length) return;

        const pendingStateName = pendingStateNameRef.current;
        const matchedState = findStateByName(pendingStateName);

        if (!matchedState) return;

        const stateCode =
            matchedState?.isoCode ||
            matchedState?.stateCode ||
            matchedState?.code ||
            "";

        const stateName = getDisplayName(
            matchedState?.name || matchedState?.stateName
        );

        pendingStateNameRef.current = "";

        update("pickupDetails", "pickupState", matchedState);
        update("pickupDetails", "pickupStateCode", stateCode);
        update("pickupDetails", "pickupStateName", stateName);

        if (stateCode) {
            dispatch(
                getCitiesByState({
                    stateCode,
                    searchText: "",
                }) as any
            );
        }
    }, [states, dispatch, update]);

    useEffect(() => {
        if (!pendingCityNameRef.current) return;

        const pendingCityName = pendingCityNameRef.current;

        if (!cities?.length) {
            update("pickupDetails", "pickupCityName", pendingCityName);
            return;
        }

        const matchedCity = findCityByName(pendingCityName);

        if (!matchedCity) {
            update("pickupDetails", "pickupCityName", pendingCityName);
            return;
        }

        const cityName = getDisplayName(
            matchedCity?.name || matchedCity?.cityName
        );

        pendingCityNameRef.current = "";

        update("pickupDetails", "pickupCity", matchedCity);
        update("pickupDetails", "pickupCityName", cityName || pendingCityName);
    }, [cities, update]);

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
            update("pickupDetails", "pickupState", selectedState?.raw || null);
            update("pickupDetails", "pickupCity", null);
            update("pickupDetails", "pickupCityName", "");
            update("pickupDetails", "pickupLocation", "");
            update("pickupDetails", "pickupAddress", "");

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
            const selectedCity = findCityByName(value);

            update("pickupDetails", "pickupCity", selectedCity || null);
            update("pickupDetails", "pickupCityName", value);
            update("pickupDetails", "pickupLocation", value);

            return;
        }

        update("pickupDetails", key, value);
    };

    const handleGooglePickupAddressSelect = (address: any) => {
        const selectedState =
            address.selectedState || findStateByName(address.stateName);

        const selectedCity =
            address.selectedCity || findCityByName(address.city);

        const stateCode =
            selectedState?.isoCode ||
            selectedState?.stateCode ||
            selectedState?.code ||
            "";

        const stateName =
            getDisplayName(selectedState?.name || selectedState?.stateName) ||
            address.stateName ||
            "";

        const cityName =
            getDisplayName(selectedCity?.name || selectedCity?.cityName) ||
            address.city ||
            "";

        const fullAddress = address.fullAddress || "";
        const displayLocation = fullAddress || cityName || "";

        if (!selectedState && address.stateName) {
            pendingStateNameRef.current = address.stateName;
        } else {
            pendingStateNameRef.current = "";
        }

        if (cityName) {
            pendingCityNameRef.current = cityName;
        } else {
            pendingCityNameRef.current = "";
        }

        update("pickupDetails", "pickupLocation", displayLocation);
        update("pickupDetails", "pickupAddress", fullAddress);

        update("pickupDetails", "pickupState", selectedState || null);
        update("pickupDetails", "pickupStateCode", stateCode);
        update("pickupDetails", "pickupStateName", stateName);

        update("pickupDetails", "pickupCity", selectedCity || null);
        update("pickupDetails", "pickupCityName", cityName);

        update("pickupDetails", "pickupPincode", address.pincode || "");
        update("pickupDetails", "pickupLatitude", address.lat || "");
        update("pickupDetails", "pickupLongitude", address.lng || "");
        update("pickupDetails", "pickupPlaceId", address.placeId || "");

        if (stateCode) {
            dispatch(
                getCitiesByState({
                    stateCode,
                    searchText: cityName || "",
                }) as any
            );
        }
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

    const pickupFields = [
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
            <GoogleAddressAutocompleteWeb
                label="Pickup Location"
                placeholder="Enter pickup location"
                value={form.pickupDetails?.pickupLocation || ""}
                stateRecords={states}
                cityRecords={cities}
                country="in"
                onInputChange={(value) =>
                    update("pickupDetails", "pickupLocation", value)
                }
                onSelectAddress={handleGooglePickupAddressSelect}
            />

            {renderFields(pickupFields)}
        </FormSectionCard>
    );
};

export default PickupStep;