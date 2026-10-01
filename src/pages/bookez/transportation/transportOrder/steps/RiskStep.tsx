import { ShieldCheck } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import { riskOptions } from "../transportOrderOptions";

// ★★★ ADDED: safely handle true/false coming from API as string or boolean
const toBoolean = (value: any): boolean => {
    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
};

const RiskStep = ({ form, update,isView }: any) => {

    const updateBrokerField = (key: string, value: any) => {

        // ★★★ UPDATED: brokerRequired must always be boolean
        if (key === "brokerRequired") {
            update("brokerDetails", key, toBoolean(value));
            return;
        }

        update("brokerDetails", key, value);
    };

    const updateRiskField = (key: string, value: any) => {

        // ★★★ UPDATED: insuranceRequired must always be boolean
        if (key === "insuranceRequired") {
            update("riskAndInsurance", key, toBoolean(value));
            return;
        }

        update("riskAndInsurance", key, value);
    };

    const updateTrackingField = (key: string, value: any) => {

        // ★★★ UPDATED: tracking checkbox values must always be boolean
        if (
            key === "gpsTrackingRequired" ||
            key === "podRequired" ||
            key === "liveTrackingEnabled"
        ) {
            update("trackingPreferences", key, toBoolean(value));
            return;
        }

        update("trackingPreferences", key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value =
            e?.target?.type === "checkbox"
                ? e?.target?.checked
                : e?.target?.value ?? "";

        if (key.startsWith("brokerDetails.")) {
            const brokerKey = key.replace("brokerDetails.", "");
            updateBrokerField(brokerKey, value);
            return;
        }

        if (key.startsWith("riskAndInsurance.")) {
            const riskKey = key.replace("riskAndInsurance.", "");
            updateRiskField(riskKey, value);
            return;
        }

        if (key.startsWith("trackingPreferences.")) {
            const trackingKey = key.replace("trackingPreferences.", "");
            updateTrackingField(trackingKey, value);
        }
    };

    const handleSelectChange = (key: string) => (e: any) => {
        handleInputChange(key)(e);
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("brokerDetails.")) {
            const brokerKey = key.replace("brokerDetails.", "");
            updateBrokerField(brokerKey, value);
            return;
        }

        if (key.startsWith("riskAndInsurance.")) {
            const riskKey = key.replace("riskAndInsurance.", "");
            updateRiskField(riskKey, value);
            return;
        }

        if (key.startsWith("trackingPreferences.")) {
            const trackingKey = key.replace("trackingPreferences.", "");
            updateTrackingField(trackingKey, value);
        }
    };

    const fieldForm = {

        // ★★★ UPDATED
        "brokerDetails.brokerRequired":
        toBoolean(form.brokerDetails?.brokerRequired),

        "brokerDetails.brokerCode":
            form.brokerDetails?.brokerCode || "",

        "brokerDetails.brokerName":
            form.brokerDetails?.brokerName || "",

        "brokerDetails.brokerCommission":
            form.brokerDetails?.brokerCommission ?? "",

        "riskAndInsurance.riskType":
            form.riskAndInsurance?.riskType || "",

        // ★★★ UPDATED
        "riskAndInsurance.insuranceRequired":
            toBoolean(
                form.riskAndInsurance?.insuranceRequired
            ),

        "riskAndInsurance.insuranceAmount":
            form.riskAndInsurance?.insuranceAmount ?? "",


        // ★★★ UPDATED
        "trackingPreferences.gpsTrackingRequired":
            toBoolean(
                form.trackingPreferences?.gpsTrackingRequired
            ),

        // ★★★ UPDATED
        "trackingPreferences.podRequired":
            toBoolean(
                form.trackingPreferences?.podRequired
            ),

        // ★★★ UPDATED
        "trackingPreferences.liveTrackingEnabled":
            toBoolean(
                form.trackingPreferences?.liveTrackingEnabled
            ),
    };

    const brokerToggleField = [
        {
            key: "brokerDetails.brokerRequired",
            label: "Broker Required",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
        },
    ];

    const brokerFields = [
        {
            key: "brokerDetails.brokerCode",
            label: "Broker Code",
            type: "text",
            placeholder: "Enter broker code",
        },
        {
            key: "brokerDetails.brokerName",
            label: "Broker Name",
            type: "text",
            placeholder: "Enter broker name",
        },
        {
            key: "brokerDetails.brokerCommission",
            label: "Broker Commission",
            type: "number",
            placeholder: "Enter broker commission",
        },
    ];

    const riskFields = [
        {
            key: "riskAndInsurance.riskType",
            label: "Risk Type",
            type: "select",
            options: riskOptions,
        },
        {
            key: "riskAndInsurance.insuranceRequired",
            label: "Insurance Required",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
        },
    ];

    const insuranceFields = [
        {
            key: "riskAndInsurance.insuranceAmount",
            label: "Insurance Amount",
            type: "number",
            placeholder: "Enter insurance amount",
        },
    ];

    const trackingFields = [
        // {
        //     key: "trackingPreferences.gpsTrackingRequired",
        //     label: "GPS Tracking Required",
        //     type: "checkbox",
        // },

        {
            key: "trackingPreferences.podRequired",
            label: "POD Required",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
        },

        // {
        //     key: "trackingPreferences.liveTrackingEnabled",
        //     label: "Live Tracking Enabled",
        //     type: "checkbox",
        // },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) =>
            renderField({
                field,
                form: fieldForm,
                handleInputChange,
                handleSelectChange,
                updateField,
                isView
            })
        );

    return (
        <FormSectionCard
            title="Risk, Broker & Tracking"
            icon={<ShieldCheck size={18} />}
        >
            {renderFields(brokerToggleField)}

            {/* ★★★ UPDATED */}
            {toBoolean(form.brokerDetails?.brokerRequired) &&
                renderFields(brokerFields)}

            {renderFields(riskFields)}

            {/* ★★★ UPDATED */}
            {toBoolean(form.riskAndInsurance?.insuranceRequired) &&
                renderFields(insuranceFields)}

            {renderFields(trackingFields)}
        </FormSectionCard>
    );
};

export default RiskStep;