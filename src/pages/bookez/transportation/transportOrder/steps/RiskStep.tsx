import { ShieldCheck } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import { riskOptions } from "../transportOrderOptions";

const RiskStep = ({ form, update }: any) => {
    const updateBrokerField = (key: string, value: any) => {
        update("brokerDetails", key, value);
    };

    const updateRiskField = (key: string, value: any) => {
        update("riskAndInsurance", key, value);
    };

    const updateTrackingField = (key: string, value: any) => {
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
        "brokerDetails.brokerRequired":
            form.brokerDetails?.brokerRequired || false,
        "brokerDetails.brokerCode":
            form.brokerDetails?.brokerCode || "",
        "brokerDetails.brokerName":
            form.brokerDetails?.brokerName || "",
        "brokerDetails.brokerCommission":
            form.brokerDetails?.brokerCommission || "",

        "riskAndInsurance.riskType":
            form.riskAndInsurance?.riskType || "",
        "riskAndInsurance.insuranceRequired":
            form.riskAndInsurance?.insuranceRequired || false,
        "riskAndInsurance.insuranceAmount":
            form.riskAndInsurance?.insuranceAmount || "",

        "trackingPreferences.gpsTrackingRequired":
            form.trackingPreferences?.gpsTrackingRequired || false,
        "trackingPreferences.podRequired":
            form.trackingPreferences?.podRequired || false,
        "trackingPreferences.liveTrackingEnabled":
            form.trackingPreferences?.liveTrackingEnabled || false,
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
        {
            key: "trackingPreferences.gpsTrackingRequired",
            label: "GPS Tracking Required",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
        },
        {
            key: "trackingPreferences.podRequired",
            label: "POD Required",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
        },
        {
            key: "trackingPreferences.liveTrackingEnabled",
            label: "Live Tracking Enabled",
            type: "checkbox",
            // className: "md:col-span-2 xl:col-span-3",
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
        <FormSectionCard title="Risk, Broker & Tracking" icon={<ShieldCheck size={18} />}>
            {renderFields(brokerToggleField)}

            {form.brokerDetails?.brokerRequired && renderFields(brokerFields)}

            {renderFields(riskFields)}

            {form.riskAndInsurance?.insuranceRequired &&
                renderFields(insuranceFields)}

            {renderFields(trackingFields)}
        </FormSectionCard>
    );
};

export default RiskStep;