// import { Package } from "lucide-react";
// import { FormSectionCard } from "../../../../../components/SectionCards";
// import { renderField } from "../../../../../components/inputs";
// import {
//     loadTypeOptions,
//     materialCategoryOptions,
//     packagingOptions,
//     ewayBillGeneratedByOptions,
// } from "../transportOrderOptions";


// const LoadStep = ({ form, update, updateNested, units = [], products = [],isView }: any) => {

//     const unitOptions = units.map((item: any) => ({
//         label: item.unitName,
//         value: item.unitName
//     }))

//     const productOptions = products.map((item: any) => ({
//         label: item.productName,
//         value: item.productName
//     }))


//     const updateLoadField = (key: string, value: any) => {
//         if (key === "weight") {
//             update("loadDetails", "weight", String(value).replace(/[^0-9]/g, ""));
//             return;
//         }

//         update("loadDetails", key, value);
//     };

//     const updateEwayBillField = (key: string, value: any) => {
//         updateNested("loadDetails", "ewayBillDetails", key, value);
//     };

//     const handleInputChange = (key: string) => (e: any) => {
//         const value =
//             e?.target?.type === "checkbox"
//                 ? e?.target?.checked
//                 : e?.target?.value ?? "";

//         if (key.startsWith("loadDetails.ewayBillDetails.")) {
//             const ewayKey = key.replace("loadDetails.ewayBillDetails.", "");
//             updateEwayBillField(ewayKey, value);
//             return;
//         }

//         if (key.startsWith("loadDetails.")) {
//             const loadKey = key.replace("loadDetails.", "");
//             updateLoadField(loadKey, value);
//         }
//     };

//     const handleSelectChange = (key: string) => (e: any) => {
//         handleInputChange(key)(e);
//     };

//     const updateField = (key: string, value: any) => {
//         if (key.startsWith("loadDetails.ewayBillDetails.")) {
//             const ewayKey = key.replace("loadDetails.ewayBillDetails.", "");
//             updateEwayBillField(ewayKey, value);
//             return;
//         }

//         if (key.startsWith("loadDetails.")) {
//             const loadKey = key.replace("loadDetails.", "");
//             updateLoadField(loadKey, value);
//         }
//     };

//     const fieldForm = {
//         "loadDetails.loadType": form.loadDetails?.loadType || "",
//         "loadDetails.materialName": form.loadDetails?.materialName || "",
//         "loadDetails.materialCategory": form.loadDetails?.materialCategory || "",
//         "loadDetails.quantity": form.loadDetails?.quantity || "",
//         "loadDetails.weight": form.loadDetails?.weight || "",
//         "loadDetails.weightUnit": form.loadDetails?.weightUnit || "",
//         "loadDetails.packagingType": form.loadDetails?.packagingType || "",
//         "loadDetails.invoiceNumber": form.loadDetails?.invoiceNumber || "",
//         "loadDetails.specialHandlingInstructions":
//             form.loadDetails?.specialHandlingInstructions || "",

//         "loadDetails.ewayBillDetails.ewayBillRequired":
//             form.loadDetails?.ewayBillDetails?.ewayBillRequired || false,
//         "loadDetails.ewayBillDetails.ewayBillGeneratedBy":
//             form.loadDetails?.ewayBillDetails?.ewayBillGeneratedBy || "",
//         "loadDetails.ewayBillDetails.ewayBillNumber":
//             form.loadDetails?.ewayBillDetails?.ewayBillNumber || "",
//         "loadDetails.ewayBillDetails.ewayBillDate":
//             form.loadDetails?.ewayBillDetails?.ewayBillDate || "",

//     };

//     const loadFields = [
//         {
//             key: "loadDetails.loadType",
//             label: "Load Type",
//             type: "select",
//             options: loadTypeOptions,
//             mandatory: true,
//         },
//         {
//             key: "loadDetails.materialName",
//             label: "Material Name",
//             type: "select",
//             placeholder: "Enter material name",
//             options: productOptions,
//             mandatory: true,
//         },
//         {
//             key: "loadDetails.materialCategory",
//             label: "Material Category",
//             type: "select",
//             options: materialCategoryOptions,
//         },
//         {
//             key: "loadDetails.quantity",
//             label: "Quantity",
//             type: "number",
//             placeholder: "Enter quantity",
//             mandatory: true,
//         },
//         {
//             key: "loadDetails.weight",
//             label: "Weight",
//             type: "number",
//             placeholder: "Enter weight",
//             mandatory: true,
//         },
//         {
//             key: "loadDetails.weightUnit",
//             label: "Weight Unit",
//             type: "select",
//             placeholder: "KG / Ton / Quintal",
//             options: unitOptions,
//             mandatory: true,
//         },
//         {
//             key: "loadDetails.packagingType",
//             label: "Packaging Type",
//             type: "select",
//             options: packagingOptions,
//         },
//         {
//             key: "loadDetails.invoiceNumber",
//             label: "Invoice Number",
//             type: "text",
//             placeholder: "Enter invoice number",
//         },
//         {
//             key: "loadDetails.ewayBillDetails.ewayBillRequired",
//             label: "E-Way Bill Required",
//             type: "toggle",
//         },
//     ];

//     const ewayBillFields = [
//         {
//             key: "loadDetails.ewayBillDetails.ewayBillGeneratedBy",
//             label: "E-Way Bill Generated By",
//             type: "select",
//             options: ewayBillGeneratedByOptions,
//         },
//         {
//             key: "loadDetails.ewayBillDetails.ewayBillNumber",
//             label: "E-Way Bill Number",
//             type: "text",
//             placeholder: "Enter e-way bill number",
//         },
//         {
//             key: "loadDetails.ewayBillDetails.ewayBillDate",
//             label: "E-Way Bill Date",
//             type: "date",
//         },
//     ];

//     const instructionFields = [
//         {
//             key: "loadDetails.specialHandlingInstructions",
//             label: "Special Handling / Instructions",
//             type: "textarea",
//             placeholder: "Enter special handling instructions",
//             className: "md:col-span-2 xl:col-span-3",
//         },
//     ];

//     const renderFields = (fields: any[]) =>
//         fields.map((field: any) =>
//             renderField({
//                 field,
//                 form: fieldForm,
//                 handleInputChange,
//                 handleSelectChange,
//                 updateField,
//                 isView
//             })
//         );

//     return (
//         <FormSectionCard title="Load Details" icon={<Package size={18} />}>
//             {renderFields(loadFields)}

//             {form.loadDetails?.ewayBillDetails?.ewayBillRequired &&
//                 renderFields(ewayBillFields)}

//             {renderFields(instructionFields)}
//         </FormSectionCard>
//     );
// };

// export default LoadStep;




import { Package } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import {
    DocumentUploadInput,
    renderField,
} from "../../../../../components/inputs";

import {
    loadTypeOptions,
    packagingOptions,
    ewayBillGeneratedByOptions,
} from "../transportOrderOptions";


const formatProductTypeLabel = (
    value: any
) => {
    const text =
        String(value || "")
            .trim();

    if (!text) return "";

    const normalizedText =
        text
            .replace(
                /[_-]+/g,
                " "
            )
            .replace(
                /([a-z])([A-Z])/g,
                "$1 $2"
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    const knownLabels: Record<string, string> = {
        finishedgoods:
            "Finished Goods",

        rawmaterial:
            "Raw Material",

        semifinishedgoods:
            "Semi Finished Goods",

        consumablegoods:
            "Consumable Goods",

        tradinggoods:
            "Trading Goods",

        service:
            "Service",
    };

    const normalizedKey =
        normalizedText
            .replace(
                /\s+/g,
                ""
            )
            .toLowerCase();

    if (
        knownLabels[
        normalizedKey
        ]
    ) {
        return knownLabels[
            normalizedKey
        ];
    }

    return normalizedText
        .split(" ")
        .filter(Boolean)
        .map(
            (word) =>
                word
                    .charAt(0)
                    .toUpperCase() +
                word
                    .slice(1)
                    .toLowerCase()
        )
        .join(" ");
};

const LoadStep = ({
    form,
    update,
    updateNested,
    units = [],
    products = [],
    isView,
}: any) => {
    /* ===================================================
       OPTIONS
    =================================================== */

    const unitOptions = units.map((item: any) => ({
        label: item.unitName,
        value: item.unitName,
    }));

    const productOptions = products.map((item: any) => ({
        label: item.productName,
        value: item.productName,
        raw: item,
    }));
    /* ===================================================
       E-WAY BILL VALUES
    =================================================== */

    const ewayBillDetails =
        form.loadDetails?.ewayBillDetails || {};

    const ewayBillRequired =
        ewayBillDetails?.ewayBillRequired === true ||
        ewayBillDetails?.ewayBillRequired === "true";

    const ewayBillGeneratedBy = String(
        ewayBillDetails?.ewayBillGeneratedBy || "customer"
    )
        .trim()
        .toLowerCase();

    const isGeneratedByTransporter =
        ewayBillGeneratedBy === "transporter";

    const isGeneratedByCustomer =
        ewayBillGeneratedBy === "customer";

    const isGeneratedByBroker =
        ewayBillGeneratedBy === "broker";

    /*
     * Customer and Broker must provide:
     * 1. E-Way Bill Number
     * 2. E-Way Bill Date
     * 3. E-Way Bill PDF/Image
     */
    const shouldShowManualEWayBillFields =
        ewayBillRequired &&
        (isGeneratedByCustomer || isGeneratedByBroker);

    /*
     * Special Handling / Instructions will show when:
     *
     * 1. E-Way Bill Required is disabled
     * OR
     * 2. E-Way Bill Required is enabled and Transporter is selected
     */
    const shouldShowSpecialHandling =
        !ewayBillRequired ||
        (ewayBillRequired && isGeneratedByTransporter);

    /* ===================================================
       UPDATE HELPERS
    =================================================== */

    const updateLoadField = (
        key: string,
        value: any
    ) => {
        if (key === "weight") {
            update(
                "loadDetails",
                "weight",
                String(value).replace(
                    /[^0-9]/g,
                    ""
                )
            );

            return;
        }

        update(
            "loadDetails",
            key,
            value
        );
    };

    const updateEwayBillField = (
        key: string,
        value: any
    ) => {
        updateNested(
            "loadDetails",
            "ewayBillDetails",
            key,
            value
        );
    };


    const handleProductSelect = (
        productName: string
    ) => {
        const selectedProduct =
            products.find(
                (item: any) =>
                    String(
                        item?.productName ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    String(
                        productName ||
                        ""
                    )
                        .trim()
                        .toLowerCase()
            );

        updateLoadField(
            "materialName",
            productName
        );

        /*
         * Auto-fill Material Category from the
         * selected product's Product Type.
         */
        const rawProductType =
            selectedProduct?.productType ||
            selectedProduct?.productCategory ||
            selectedProduct?.category ||
            selectedProduct?.materialCategory ||
            "";

        const formattedProductType =
            formatProductTypeLabel(
                rawProductType
            );

        updateLoadField(
            "materialCategory",
            formattedProductType
        );

    };

    /* ===================================================
       CLEAR MANUAL E-WAY BILL DATA
    =================================================== */

    const clearManualEWayBillData = () => {
        updateEwayBillField(
            "ewayBillNumber",
            ""
        );

        updateEwayBillField(
            "ewayBillDate",
            ""
        );

        updateEwayBillField(
            "ewayBillDocument",
            null
        );

        updateEwayBillField(
            "ewayBillDocuments",
            []
        );
    };

    /* ===================================================
       E-WAY BILL REQUIRED TOGGLE
    =================================================== */

    const handleEwayBillRequiredChange = (
        value: any
    ) => {
        const checked =
            value === true ||
            value === "true";

        updateEwayBillField(
            "ewayBillRequired",
            checked
        );

        /*
         * When E-Way Bill is disabled:
         *
         * - Hide Generated By
         * - Clear Generated By
         * - Clear manual E-Way Bill information
         * - Show Special Handling / Instructions
         */
        if (!checked) {
            updateEwayBillField(
                "ewayBillGeneratedBy",
                ""
            );

            clearManualEWayBillData();
        }
    };

    /* ===================================================
       E-WAY BILL GENERATED BY CHANGE
    =================================================== */

    const handleGeneratedByChange = (
        value: any
    ) => {
        const normalizedValue =
            String(value || "")
                .trim()
                .toLowerCase();

        updateEwayBillField(
            "ewayBillGeneratedBy",
            value
        );

        /*
         * Transporter generates the E-Way Bill during
         * the LR creation flow.
         *
         * Therefore manual number, date and upload
         * values are not required.
         */
        if (
            normalizedValue ===
            "transporter"
        ) {
            clearManualEWayBillData();
            return;
        }

        /*
         * Customer and Broker use manual E-Way Bill details.
         * Special Handling is hidden for these selections.
         */
        if (
            normalizedValue === "customer" ||
            normalizedValue === "broker"
        ) {
            updateLoadField(
                "specialHandlingInstructions",
                ""
            );
        }
    };

    /* ===================================================
       INPUT CHANGE
    =================================================== */

    const handleInputChange =
        (key: string) =>
            (e: any) => {
                const value =
                    e?.target?.type === "checkbox"
                        ? e?.target?.checked
                        : e?.target?.value ?? "";

                if (
                    key ===
                    "loadDetails.ewayBillDetails.ewayBillRequired"
                ) {
                    handleEwayBillRequiredChange(
                        value
                    );

                    return;
                }

                if (
                    key ===
                    "loadDetails.ewayBillDetails.ewayBillGeneratedBy"
                ) {
                    handleGeneratedByChange(
                        value
                    );

                    return;
                }

                if (
                    key.startsWith(
                        "loadDetails.ewayBillDetails."
                    )
                ) {
                    const ewayKey =
                        key.replace(
                            "loadDetails.ewayBillDetails.",
                            ""
                        );

                    updateEwayBillField(
                        ewayKey,
                        value
                    );

                    return;
                }

                if (
                    key.startsWith(
                        "loadDetails."
                    )
                ) {
                    const loadKey =
                        key.replace(
                            "loadDetails.",
                            ""
                        );

                    updateLoadField(
                        loadKey,
                        value
                    );
                }
            };

    /* ===================================================
       SELECT CHANGE
    =================================================== */

    const handleSelectChange =
        (key: string) =>
            (e: any) => {
                const value =
                    e?.target?.value ??
                    e ??
                    "";


                /* ===================================================
       MATERIAL NAME

       Auto-fill Material Category using the selected
       product's productType.
    =================================================== */

                if (
                    key ===
                    "loadDetails.materialName"
                ) {
                    handleProductSelect(
                        value
                    );

                    return;
                }

                if (
                    key ===
                    "loadDetails.ewayBillDetails.ewayBillGeneratedBy"
                ) {
                    handleGeneratedByChange(
                        value
                    );

                    return;
                }

                handleInputChange(
                    key
                )({
                    target: {
                        value,
                    },
                });
            };

    /* ===================================================
       DIRECT FIELD UPDATE
    =================================================== */

    const updateField = (
        key: string,
        value: any
    ) => {



        if (
            key ===
            "loadDetails.materialName"
        ) {
            handleProductSelect(
                value
            );

            return;
        }


        if (
            key ===
            "loadDetails.ewayBillDetails.ewayBillRequired"
        ) {
            handleEwayBillRequiredChange(
                value
            );

            return;
        }

        if (
            key ===
            "loadDetails.ewayBillDetails.ewayBillGeneratedBy"
        ) {
            handleGeneratedByChange(
                value
            );

            return;
        }

        if (
            key.startsWith(
                "loadDetails.ewayBillDetails."
            )
        ) {
            const ewayKey =
                key.replace(
                    "loadDetails.ewayBillDetails.",
                    ""
                );

            updateEwayBillField(
                ewayKey,
                value
            );

            return;
        }

        if (
            key.startsWith(
                "loadDetails."
            )
        ) {
            const loadKey =
                key.replace(
                    "loadDetails.",
                    ""
                );

            updateLoadField(
                loadKey,
                value
            );
        }
    };

    /* ===================================================
       UPLOAD E-WAY BILL
    =================================================== */

    const handleEWayBillDocumentChange = (
        documents: any[]
    ) => {
        const normalizedDocuments =
            Array.isArray(documents)
                ? documents
                : [];

        const firstDocument =
            normalizedDocuments[0] ||
            null;

        /*
         * Keep both properties for compatibility:
         *
         * ewayBillDocuments = array
         * ewayBillDocument  = single selected document
         */
        updateEwayBillField(
            "ewayBillDocuments",
            normalizedDocuments
        );

        updateEwayBillField(
            "ewayBillDocument",
            firstDocument
        );
    };

    /* ===================================================
       FIELD FORM
    =================================================== */

    const fieldForm = {
        "loadDetails.loadType":
            form.loadDetails?.loadType ||
            "",

        "loadDetails.materialName":
            form.loadDetails?.materialName ||
            "",

        "loadDetails.materialCategory":
            form.loadDetails?.materialCategory ||
            "",

        "loadDetails.quantity":
            form.loadDetails?.quantity ||
            "",

        "loadDetails.weight":
            form.loadDetails?.weight ||
            "",

        "loadDetails.weightUnit":
            form.loadDetails?.weightUnit ||
            "",

        "loadDetails.packagingType":
            form.loadDetails?.packagingType ||
            "",

        "loadDetails.invoiceNumber":
            form.loadDetails?.invoiceNumber ||
            "",

        "loadDetails.specialHandlingInstructions":
            form.loadDetails
                ?.specialHandlingInstructions ||
            "",

        "loadDetails.ewayBillDetails.ewayBillRequired":
            ewayBillRequired,

        "loadDetails.ewayBillDetails.ewayBillGeneratedBy":
            ewayBillDetails
                ?.ewayBillGeneratedBy ||
            "",

        "loadDetails.ewayBillDetails.ewayBillNumber":
            ewayBillDetails
                ?.ewayBillNumber ||
            "",

        "loadDetails.ewayBillDetails.ewayBillDate":
            ewayBillDetails
                ?.ewayBillDate ||
            "",
    };

    /* ===================================================
       LOAD FIELDS
    =================================================== */

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
            options: productOptions,
            mandatory: true,
        },
        {
            key: "loadDetails.materialCategory",
            label: "Material Category",
            type: "text",
            placeholder: "Auto-filled from selected product",
            disabled: true,
        },
        {
            key: "loadDetails.quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Enter quantity",
            mandatory: true,
        },
        {
            key: "loadDetails.weight",
            label: "Weight",
            type: "number",
            placeholder: "Enter weight",
            mandatory: true,
        },
        {
            key: "loadDetails.weightUnit",
            label: "Weight Unit",
            type: "select",
            placeholder: "KG / Ton / Quintal",
            options: unitOptions,
            mandatory: true,
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

    /* ===================================================
       GENERATED BY FIELD
    =================================================== */

    const generatedByFields = [
        {
            key: "loadDetails.ewayBillDetails.ewayBillGeneratedBy",
            label: "E-Way Bill Generated By",
            type: "select",
            options: ewayBillGeneratedByOptions,
            mandatory: true,
        },
    ];

    /* ===================================================
       CUSTOMER / BROKER E-WAY BILL FIELDS
    =================================================== */

    const manualEWayBillFields = [
        {
            key: "loadDetails.ewayBillDetails.ewayBillNumber",
            label: "E-Way Bill Number",
            type: "text",
            placeholder: "Enter e-way bill number",
            // mandatory: true,
        },
        {
            key: "loadDetails.ewayBillDetails.ewayBillDate",
            label: "E-Way Bill Date",
            type: "date",
            // mandatory: true,
        },
    ];

    /* ===================================================
       SPECIAL HANDLING FIELD
    =================================================== */

    const instructionFields = [
        {
            key: "loadDetails.specialHandlingInstructions",
            label: "Special Handling / Instructions",
            type: "textarea",
            placeholder: "Enter special handling instructions",
            className: "md:col-span-2 xl:col-span-3",
        },
    ];

    /* ===================================================
       FIELD RENDERER
    =================================================== */

    const renderFields = (
        fields: any[]
    ) =>
        fields.map(
            (field: any) =>
                renderField({
                    field,
                    form: fieldForm,
                    handleInputChange,
                    handleSelectChange,
                    updateField,
                    isView,
                })
        );

    /* ===================================================
       UI
    =================================================== */

    return (
        <FormSectionCard
            title="Load Details"
            icon={
                <Package size={18} />
            }
        >
            {/* EXISTING LOAD FIELDS */}
            {renderFields(
                loadFields
            )}

            {/* E-WAY BILL ENABLED — SHOW GENERATED BY */}
            {ewayBillRequired &&
                renderFields(
                    generatedByFields
                )}

            {/* CUSTOMER / BROKER — NUMBER AND DATE */}
            {shouldShowManualEWayBillFields &&
                renderFields(
                    manualEWayBillFields
                )}

            {/* CUSTOMER / BROKER — E-WAY BILL UPLOAD */}
            {shouldShowManualEWayBillFields && (
                <div className="md:col-span-2 xl:col-span-3">
                    <div className="rounded-lg border border-border bg-background p-4">
                        <DocumentUploadInput
                            label="Upload E-Way Bill (PDF / Image)"
                            value={
                                Array.isArray(
                                    ewayBillDetails
                                        ?.ewayBillDocuments
                                )
                                    ? ewayBillDetails
                                        .ewayBillDocuments
                                    : ewayBillDetails
                                        ?.ewayBillDocument
                                        ? [
                                            ewayBillDetails
                                                .ewayBillDocument,
                                        ]
                                        : []
                            }
                            multiple={false}
                            placeholder="Pick PDF or Image"
                            description="Upload the E-Way Bill provided by the customer or broker."
                            allowedText="Allowed: PDF, PNG, JPG, JPEG"
                            disabled={isView}
                            onChange={
                                handleEWayBillDocumentChange
                            }
                        />
                    </div>
                </div>
            )}

            {/*
                SPECIAL HANDLING WILL SHOW WHEN:

                1. E-Way Bill Required is disabled
                OR
                2. E-Way Bill Required is enabled
                   and Transporter is selected
            */}
            {shouldShowSpecialHandling &&
                renderFields(
                    instructionFields
                )}
        </FormSectionCard>
    );
};

export default LoadStep;