import { Truck } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import {
    vehicleBodyTypeOptions,
    vehicleCapacityOptions,
    vehicleTypeOptions,
} from "../transportOrderOptions";

const VehicleStep = ({ form, update }: any) => {
    // const updateVehicleField = (key: string, value: any) => {
    // 	update("vehicleRequirement", key, value);
    // };

    const updateVehicleField = (key: string, value: any) => {
        if (key === "numberOfVehicles") {
            const cleanValue = String(value || "").replace(/[^0-9]/g, "");

            update("vehicleRequirement", key, cleanValue);
            return;
        }

        update("vehicleRequirement", key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value = e?.target?.value ?? "";

        if (key.startsWith("vehicleRequirement.")) {
            const vehicleKey = key.replace("vehicleRequirement.", "");
            updateVehicleField(vehicleKey, value);
        }
    };

    const handleSelectChange = (key: string) => (e: any) => {
        handleInputChange(key)(e);
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("vehicleRequirement.")) {
            const vehicleKey = key.replace("vehicleRequirement.", "");
            updateVehicleField(vehicleKey, value);
        }
    };

    const fieldForm = {
        "vehicleRequirement.vehicleType":
            form.vehicleRequirement?.vehicleType || "",

        "vehicleRequirement.vehicleBodyType":
            form.vehicleRequirement?.vehicleBodyType || "",

        "vehicleRequirement.vehicleCapacity":
            form.vehicleRequirement?.vehicleCapacity || "",

        "vehicleRequirement.numberOfVehicles":
            form.vehicleRequirement?.numberOfVehicles || "",

        "vehicleRequirement.specialVehicleRequirement":
            form.vehicleRequirement?.specialVehicleRequirement || "",
    };

    const vehicleFields = [
        {
            key: "vehicleRequirement.vehicleType",
            label: "Vehicle Type",
            type: "select",
            options: vehicleTypeOptions,
        },
        {
            key: "vehicleRequirement.vehicleBodyType",
            label: "Vehicle Body Type",
            type: "select",
            options: vehicleBodyTypeOptions,
        },
        {
            key: "vehicleRequirement.vehicleCapacity",
            label: "Vehicle Capacity",
            type: "select",
            options: vehicleCapacityOptions,
        },
        {
            key: "vehicleRequirement.numberOfVehicles",
            label: "Number of Vehicles",
            type: "number",
            placeholder: "Enter number of vehicles",
        },
        {
            key: "vehicleRequirement.specialVehicleRequirement",
            label: "Special Vehicle Requirement",
            type: "textarea",
            placeholder: "Enter special vehicle requirement",
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
        <FormSectionCard title="Vehicle Requirement" icon={<Truck size={18} />}>
            {renderFields(vehicleFields)}
        </FormSectionCard>
    );
};

export default VehicleStep;