import { Package } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import {
    loadTypeOptions,
    materialCategoryOptions,
    packagingOptions,
    ewayBillGeneratedByOptions,
} from "../transportOrderOptions";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";

const LoadStep = ({ form, update, updateNested }: any) => {
    const dispatch = useDispatch<any>()
    const { units = [] } = useSelector((state: any) => state.unitMaster)
    const {products=[]}=useSelector((state:any)=> state.productMaster)
    const unitOptions = units.map((item: any) => ({
        label: item.unitName ,
        value: item.unitName 
    }))

    const productOptions=products.map((item:any)=>({
        label:item.productName ,
        value:item.productName
    }))

    useEffect(() => {
        dispatch(getAllUnits({
            limit: 200,
            offset: 0
        }))
        dispatch(getAllProducts({
            limit:200,
            offset:0
        }))
    }, [dispatch])
    const updateLoadField = (key: string, value: any) => {
        if (key === "weight") {
            update("loadDetails", "weight", String(value).replace(/[^0-9]/g, ""));
            return;
        }

        update("loadDetails", key, value);
    };

    const updateEwayBillField = (key: string, value: any) => {
        updateNested("loadDetails", "ewayBillDetails", key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value =
            e?.target?.type === "checkbox"
                ? e?.target?.checked
                : e?.target?.value ?? "";

        if (key.startsWith("loadDetails.ewayBillDetails.")) {
            const ewayKey = key.replace("loadDetails.ewayBillDetails.", "");
            updateEwayBillField(ewayKey, value);
            return;
        }

        if (key.startsWith("loadDetails.")) {
            const loadKey = key.replace("loadDetails.", "");
            updateLoadField(loadKey, value);
        }
    };

    const handleSelectChange = (key: string) => (e: any) => {
        handleInputChange(key)(e);
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("loadDetails.ewayBillDetails.")) {
            const ewayKey = key.replace("loadDetails.ewayBillDetails.", "");
            updateEwayBillField(ewayKey, value);
            return;
        }

        if (key.startsWith("loadDetails.")) {
            const loadKey = key.replace("loadDetails.", "");
            updateLoadField(loadKey, value);
        }
    };

    const fieldForm = {
        "loadDetails.loadType": form.loadDetails?.loadType || "",
        "loadDetails.materialName": form.loadDetails?.materialName || "",
        "loadDetails.materialCategory": form.loadDetails?.materialCategory || "",
        "loadDetails.quantity": form.loadDetails?.quantity || "",
        "loadDetails.weight": form.loadDetails?.weight || "",
        "loadDetails.weightUnit": form.loadDetails?.weightUnit || "",
        "loadDetails.packagingType": form.loadDetails?.packagingType || "",
        "loadDetails.invoiceNumber": form.loadDetails?.invoiceNumber || "",
        "loadDetails.specialHandlingInstructions":
            form.loadDetails?.specialHandlingInstructions || "",

        "loadDetails.ewayBillDetails.ewayBillRequired":
            form.loadDetails?.ewayBillDetails?.ewayBillRequired || false,
        "loadDetails.ewayBillDetails.ewayBillGeneratedBy":
            form.loadDetails?.ewayBillDetails?.ewayBillGeneratedBy || "",
        "loadDetails.ewayBillDetails.ewayBillNumber":
            form.loadDetails?.ewayBillDetails?.ewayBillNumber || "",
        "loadDetails.ewayBillDetails.ewayBillDate":
            form.loadDetails?.ewayBillDetails?.ewayBillDate || "",

    };

    const loadFields = [
        {
            key: "loadDetails.loadType",
            label: "Load Type",
            type: "select",
            options: loadTypeOptions,
            mandatory: true,
        },
        {
            key: "loadDetails.materialName",
            label: "Material Name",
            type: "select",
            placeholder: "Enter material name",
            options:productOptions,
            mandatory: true,
        },
        {
            key: "loadDetails.materialCategory",
            label: "Material Category",
            type: "select",
            options: materialCategoryOptions,
        },
        {
            key: "loadDetails.quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Enter quantity",
        },
        {
            key: "loadDetails.weight",
            label: "Weight",
            type: "number",
            placeholder: "Enter weight",
        },
        {
            key: "loadDetails.weightUnit",
            label: "Weight Unit",
            type: "select",
            placeholder: "KG / Ton / Quintal",
            options: unitOptions,
        },
        {
            key: "loadDetails.packagingType",
            label: "Packaging Type",
            type: "select",
            options: packagingOptions,
        },
        {
            key: "loadDetails.invoiceNumber",
            label: "Invoice Number",
            type: "text",
            placeholder: "Enter invoice number",
        },
        {
            key: "loadDetails.ewayBillDetails.ewayBillRequired",
            label: "E-Way Bill Required",
            type: "toggle",
        },
    ];

    const ewayBillFields = [
        {
            key: "loadDetails.ewayBillDetails.ewayBillGeneratedBy",
            label: "E-Way Bill Generated By",
            type: "select",
            options: ewayBillGeneratedByOptions,
        },
        {
            key: "loadDetails.ewayBillDetails.ewayBillNumber",
            label: "E-Way Bill Number",
            type: "text",
            placeholder: "Enter e-way bill number",
        },
        {
            key: "loadDetails.ewayBillDetails.ewayBillDate",
            label: "E-Way Bill Date",
            type: "date",
        },
    ];

    const instructionFields = [
        {
            key: "loadDetails.specialHandlingInstructions",
            label: "Special Handling / Instructions",
            type: "textarea",
            placeholder: "Enter special handling instructions",
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
        <FormSectionCard title="Load Details" icon={<Package size={18} />}>
            {renderFields(loadFields)}

            {form.loadDetails?.ewayBillDetails?.ewayBillRequired &&
                renderFields(ewayBillFields)}

            {renderFields(instructionFields)}
        </FormSectionCard>
    );
};

export default LoadStep;