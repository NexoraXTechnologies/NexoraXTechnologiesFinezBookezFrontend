import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    ProductDefaultInputs,
    ChassisFieldOptions,
} from "./DefaultInputs";

import { computeChassisEngineering } from "./chassisCalculations";
import { getLatestValuesForProduct } from "../setDefaultValue/defaultValuesStorage";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";

import Drawing from "../drawing/Drawing";

/* ===================================================
   OPTIONS
=================================================== */

const productOptions = [{ label: "Chassis", value: "chassis" }];

/* ===================================================
   DEFAULT FORM
=================================================== */

const emptyEngineeringForm = {
    selectedAccount: "",
    selectedProduct: "",

    trailerType: "",
    totalLength: "",
    totalWidth: "",
    deckHeight: "",
    payloadCapacity: "",

    mainBeamType: "",
    crossMemberCount: "",
    crossMemberType: "",
    floorType: "",
    sideRailCount: "",
    sideRailType: "",

    suspensionType: "",
    suspensionCapacity: "",
    axleCount: "",

    tyreSize: "",
    tyreBrand: "",

    kingPinType: "",
    kingPinPositionPercent: "",

    landingLegType: "",
    landingLegCapacity: "",

    steelGrade: "",
    corrosionProtection: "",
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const CreateEditEngineeringConfig = () => {
    const location = useLocation();
    const dispatch = useDispatch<any>();

    const routeState: any = location.state || {};

    const [components, setComponents] = useState<any[]>(
        Array.isArray(routeState?.components) ? routeState.components : []
    );

    const [form, setForm] = useState<any>({
        ...emptyEngineeringForm,
        ...(routeState?.form || {}),
    });

    const [selectedAccountData, setSelectedAccountData] = useState<any>(
        routeState?.selectedAccountData || null
    );

    // @ts-ignore
    const [edit, setEdit] = useState(false);
    const [addLoader, setAddLoader] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [generatedBomData, setGeneratedBomData] = useState<any>(null);


    const { accounts = [], listingLoader: accountLoading = false } =
        useSelector((state: any) => state.accountMaster || {});

    const accountOptions = useMemo(() => {
        const list =
            accounts?.items ||
            accounts?.data?.items ||
            accounts?.data ||
            accounts ||
            [];

        return (Array.isArray(list) ? list : []).map((item: any) => ({
            label: item.accountName,
            value: item.accountCode,
            data: item,
        }));
    }, [accounts]);

    /* ===================================================
       ACCOUNTS
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                limit: 200,
                offset: 0,
                accountType: "customer",
            })
        );
    }, [dispatch]);

    useEffect(() => {
        if (!form?.selectedAccount || selectedAccountData) return;

        const selected = accountOptions.find(
            (item: any) => item.value === form.selectedAccount
        );

        if (selected?.data) {
            setSelectedAccountData(selected.data);
        }
    }, [form?.selectedAccount, selectedAccountData, accountOptions]);



    /* ===================================================
       CHILD RAW PRODUCTS RETURN DATA
    =================================================== */

    useEffect(() => {
        if (!routeState?.engineeringComponentsFromChild) return;

        if (Array.isArray(routeState?.components)) {
            setComponents(routeState.components);
        }

        if (routeState?.form) {
            setForm((prev: any) => ({
                ...prev,
                ...routeState.form,
            }));
        }

        if (routeState?.selectedAccountData) {
            setSelectedAccountData(routeState.selectedAccountData);
        }
    }, [
        routeState?.engineeringComponentsFromChild,
        routeState?.components,
        routeState?.form,
        routeState?.selectedAccountData,
    ]);

    /* ===================================================
       APPLY DEFAULT VALUES
    =================================================== */

    const applyValues = (data: any) => {
        setForm((prev: any) => ({
            ...prev,

            trailerType: data?.trailerType || "",
            totalLength: data?.totalLength || "",
            totalWidth: data?.totalWidth || "",
            deckHeight: data?.deckHeight || "",
            payloadCapacity: data?.payloadCapacity || "",

            mainBeamType: data?.mainBeamType || "",
            crossMemberCount: data?.crossMemberCount || "",
            crossMemberType: data?.crossMemberType || "",
            floorType: data?.floorType || "",
            sideRailCount: data?.sideRailCount || "",
            sideRailType: data?.sideRailType || "",

            suspensionType: data?.suspensionType || "",
            suspensionCapacity: data?.suspensionCapacity || "",
            axleCount: data?.axleCount || "",

            tyreSize: data?.tyreSize || "",
            tyreBrand: data?.tyreBrand || "",

            kingPinType: data?.kingPinType || "",
            kingPinPositionPercent: data?.kingPinPositionPercent || "",

            landingLegType: data?.landingLegType || "",
            landingLegCapacity: data?.landingLegCapacity || "",

            steelGrade: data?.steelGrade || "",
            corrosionProtection: data?.corrosionProtection || "",
        }));
    };

    const handleAccountChange = (value: string) => {
        const selectedAccountObj =
            accountOptions.find((item) => item.value === value)?.data || null;

        setSelectedAccountData(selectedAccountObj);

        setForm((prev: any) => ({
            ...prev,
            selectedAccount: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            selectedAccount: "",
        }));
    };

    const handleProductChange = async (value: string) => {
        setForm((prev: any) => ({
            ...prev,
            selectedProduct: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            selectedProduct: "",
        }));

        const savedPreset = await getLatestValuesForProduct(value);

        const preset =
            savedPreset ||
            ProductDefaultInputs?.[
            value as keyof typeof ProductDefaultInputs
            ];

        if (preset) {
            setForm((prev: any) => ({
                ...prev,
                selectedProduct: value,
                ...preset,
            }));

            applyValues(preset);
        }
    };

    /* ===================================================
       CALCULATIONS
    =================================================== */

    const chassisInputs = useMemo(
        () => ({
            trailerType: form.trailerType,
            totalLength: form.totalLength,
            totalWidth: form.totalWidth,
            deckHeight: form.deckHeight,
            payloadCapacity: form.payloadCapacity,

            mainBeamType: form.mainBeamType,
            crossMemberCount: form.crossMemberCount,
            crossMemberType: form.crossMemberType,
            floorType: form.floorType,
            sideRailCount: form.sideRailCount,
            sideRailType: form.sideRailType,

            suspensionType: form.suspensionType,
            suspensionCapacity: form.suspensionCapacity,
            axleCount: form.axleCount,

            tyreSize: form.tyreSize,
            tyreBrand: form.tyreBrand,

            kingPinType: form.kingPinType,
            kingPinPositionPercent: form.kingPinPositionPercent,

            landingLegType: form.landingLegType,
            landingLegCapacity: form.landingLegCapacity,

            steelGrade: form.steelGrade,
            corrosionProtection: form.corrosionProtection,
        }),
        [form]
    );

    const calculated = useMemo(() => {
        if (form.selectedProduct !== "chassis") return null;
        return computeChassisEngineering(chassisInputs);
    }, [form.selectedProduct, chassisInputs]);

    /* ===================================================
       AUTO CALCULATED FIELDS INSIDE MODAL
    =================================================== */

    const engineeringFieldKeys = [
        "selectedAccount",
        "selectedProduct",

        "trailerType",
        "totalLength",
        "totalWidth",
        "deckHeight",
        "payloadCapacity",

        "mainBeamType",
        "crossMemberCount",
        "crossMemberType",
        "floorType",
        "sideRailCount",
        "sideRailType",

        "suspensionType",
        "suspensionCapacity",
        "axleCount",

        "tyreSize",
        "tyreBrand",

        "kingPinType",
        "kingPinPositionPercent",

        "landingLegType",
        "landingLegCapacity",

        "steelGrade",
        "corrosionProtection",
    ];

    const allEngineeringFieldsFilled = engineeringFieldKeys.every((key) => {
        return String(form?.[key] ?? "").trim() !== "";
    });

    const showAutoCalculatedFields =
        form.selectedProduct === "chassis" &&
        Boolean(calculated) &&
        allEngineeringFieldsFilled;

    const autoCalculatedValues = {
        crossMemberSpacing: calculated?.crossMemberSpacing ?? "",
        axleSpacing: calculated?.axleSpacing ?? "",
        tyreCount: calculated?.tyreCount ?? "",
        tyreDiameter: calculated?.tyreDiameter ?? "",
        tyreGap: calculated?.tyreGap ?? "",
        kingPinPositionMm: calculated?.kingPinPositionMm ?? "",
        landingLegPosition: calculated?.landingLegPosition ?? "",
        suspensionStartPosition: calculated?.suspensionStartPosition ?? "",
        mainBeamThickness: calculated?.mainBeamThickness ?? "",
        crossMemberThickness: calculated?.crossMemberThickness ?? "",
        floorPlateThickness: calculated?.floorPlateThickness ?? "",
        sideRailThickness: calculated?.sideRailThickness ?? "",
        kingPinPlateThickness: calculated?.kingPinPlateThickness ?? "",
        suspensionBracketThickness:
            calculated?.suspensionBracketThickness ?? "",
        estimatedTrailerWeight: calculated?.estimatedTrailerWeight ?? "",
        estimatedCost: calculated?.estimatedCost
            ? calculated.estimatedCost.toLocaleString("en-IN")
            : "",
    };

    const readonlyCalculatedKeys = Object.keys(autoCalculatedValues);

    const handleChange = (key: string, value: any) => {
        if (readonlyCalculatedKeys.includes(key)) return;

        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const autoCalculatedDisplayFields = [
        {
            label: "Cross Member Spacing",
            value: autoCalculatedValues.crossMemberSpacing,
            suffix: "mm",
        },
        {
            label: "Axle Spacing",
            value: autoCalculatedValues.axleSpacing,
            suffix: "mm",
        },
        {
            label: "Tyre Count",
            value: autoCalculatedValues.tyreCount,
            suffix: "",
        },
        {
            label: "Tyre Diameter",
            value: autoCalculatedValues.tyreDiameter,
            suffix: "mm",
        },
        {
            label: "Tyre Gap",
            value: autoCalculatedValues.tyreGap,
            suffix: "mm",
        },
        {
            label: "King Pin Position",
            value: autoCalculatedValues.kingPinPositionMm,
            suffix: "mm",
        },
        {
            label: "Landing Leg Position",
            value: autoCalculatedValues.landingLegPosition,
            suffix: "mm",
        },
        {
            label: "Suspension Start Position",
            value: autoCalculatedValues.suspensionStartPosition,
            suffix: "mm",
        },
        {
            label: "Main Beam Thickness",
            value: autoCalculatedValues.mainBeamThickness,
            suffix: "",
        },
        {
            label: "Cross Member Thickness",
            value: autoCalculatedValues.crossMemberThickness,
            suffix: "",
        },
        {
            label: "Floor Plate Thickness",
            value: autoCalculatedValues.floorPlateThickness,
            suffix: "",
        },
        {
            label: "Side Rail Thickness",
            value: autoCalculatedValues.sideRailThickness,
            suffix: "",
        },
        {
            label: "King Pin Plate Thickness",
            value: autoCalculatedValues.kingPinPlateThickness,
            suffix: "",
        },
        {
            label: "Suspension Bracket Thickness",
            value: autoCalculatedValues.suspensionBracketThickness,
            suffix: "",
        },
        {
            label: "Estimated Trailer Weight",
            value: autoCalculatedValues.estimatedTrailerWeight,
            suffix: "kg",
        },
        {
            label: "Estimated Cost",
            value: autoCalculatedValues.estimatedCost,
            prefix: "₹",
            suffix: "",
            highlight: true,
        },
    ];

    const modalForm = {
        ...form,
        ...(showAutoCalculatedFields ? autoCalculatedValues : {}),
    };


    /* ===================================================
       MODAL INPUT DATA
    =================================================== */

    const inputData = {
        sections: [
            {
                title: "Customer & Product",
                fields: [
                    {
                        key: "selectedAccount",
                        label: "Customer",
                        type: "select",
                        options: accountOptions,
                        placeholder: accountLoading
                            ? "Loading customers..."
                            : "Select Customer",
                        required: true,
                        onChange: handleAccountChange,
                    },
                    {
                        key: "selectedProduct",
                        label: "Product Type",
                        type: "select",
                        options: productOptions,
                        placeholder: "Select Product Type",
                        required: true,
                        onChange: handleProductChange,
                    },
                ],
            },
            {
                title: "Basic Dimensions",
                fields: [
                    {
                        key: "trailerType",
                        label: "Trailer Type",
                        type: "select",
                        options: ChassisFieldOptions.trailerType,
                        placeholder: "Select Trailer Type",
                    },
                    {
                        key: "totalLength",
                        label: "Total Length",
                        type: "number",
                        placeholder: "Enter Total Length",
                        required: true,
                    },
                    {
                        key: "totalWidth",
                        label: "Total Width",
                        type: "number",
                        placeholder: "Enter Total Width",
                        required: true,
                    },
                    {
                        key: "deckHeight",
                        label: "Deck Height",
                        type: "number",
                        placeholder: "Enter Deck Height",
                        required: true,
                    },
                    {
                        key: "payloadCapacity",
                        label: "Payload Capacity",
                        type: "select",
                        options: ChassisFieldOptions.payloadCapacity,
                        placeholder: "Select Payload Capacity",
                    },
                ],
            },
            {
                title: "Chassis Structure",
                fields: [
                    {
                        key: "mainBeamType",
                        label: "Main Beam Type",
                        type: "select",
                        options: ChassisFieldOptions.mainBeamType,
                        placeholder: "Select Main Beam Type",
                    },
                    {
                        key: "crossMemberCount",
                        label: "Cross Member Count",
                        type: "number",
                        placeholder: "Enter Cross Member Count",
                    },
                    {
                        key: "crossMemberType",
                        label: "Cross Member Type",
                        type: "select",
                        options: ChassisFieldOptions.crossMemberType,
                        placeholder: "Select Cross Member Type",
                    },
                    {
                        key: "floorType",
                        label: "Floor Type",
                        type: "select",
                        options: ChassisFieldOptions.floorType,
                        placeholder: "Select Floor Type",
                    },
                    {
                        key: "sideRailCount",
                        label: "Side Rail Count",
                        type: "number",
                        placeholder: "Enter Side Rail Count",
                    },
                    {
                        key: "sideRailType",
                        label: "Side Rail Type",
                        type: "select",
                        options: ChassisFieldOptions.sideRailType,
                        placeholder: "Select Side Rail Type",
                    },
                ],
            },
            {
                title: "Suspension Setup",
                fields: [
                    {
                        key: "suspensionType",
                        label: "Suspension Type",
                        type: "select",
                        options: ChassisFieldOptions.suspensionType,
                        placeholder: "Select Suspension Type",
                    },
                    {
                        key: "suspensionCapacity",
                        label: "Suspension Capacity",
                        type: "select",
                        options: ChassisFieldOptions.suspensionCapacity,
                        placeholder: "Select Suspension Capacity",
                    },
                    {
                        key: "axleCount",
                        label: "Axle Count",
                        type: "number",
                        placeholder: "Enter Axle Count",
                    },
                ],
            },
            {
                title: "Tyre Configuration",
                fields: [
                    {
                        key: "tyreSize",
                        label: "Tyre Size",
                        type: "select",
                        options: ChassisFieldOptions.tyreSize,
                        placeholder: "Select Tyre Size",
                    },
                    {
                        key: "tyreBrand",
                        label: "Tyre Brand",
                        type: "select",
                        options: ChassisFieldOptions.tyreBrand,
                        placeholder: "Select Tyre Brand",
                    },
                ],
            },
            {
                title: "King Pin & Landing Leg",
                fields: [
                    {
                        key: "kingPinType",
                        label: "King Pin Type",
                        type: "text",
                        placeholder: "Enter King Pin Type",
                    },
                    {
                        key: "kingPinPositionPercent",
                        label: "King Pin Position %",
                        type: "number",
                        placeholder: "Enter King Pin Position %",
                    },
                    {
                        key: "landingLegType",
                        label: "Landing Leg Type",
                        type: "select",
                        options: ChassisFieldOptions.landingLegType,
                        placeholder: "Select Landing Leg Type",
                    },
                    {
                        key: "landingLegCapacity",
                        label: "Landing Leg Capacity",
                        type: "select",
                        options: ChassisFieldOptions.landingLegCapacity,
                        placeholder: "Select Landing Leg Capacity",
                    },
                ],
            },
            {
                title: "Material Grade",
                fields: [
                    {
                        key: "steelGrade",
                        label: "Steel Grade",
                        type: "select",
                        options: ChassisFieldOptions.steelGrade,
                        placeholder: "Select Steel Grade",
                    },
                    {
                        key: "corrosionProtection",
                        label: "Corrosion Protection",
                        type: "select",
                        options: ChassisFieldOptions.corrosionProtection,
                        placeholder: "Select Corrosion Protection",
                    },
                ],
            },

        ],
    };

    /* ===================================================
       VALIDATION
    =================================================== */

    const validateForm = () => {
        const nextErrors: any = {};

        if (!form.selectedAccount) {
            nextErrors.selectedAccount = "Customer is required";
        }

        if (!form.selectedProduct) {
            nextErrors.selectedProduct = "Product Type is required";
        }

        if (!form.totalLength) {
            nextErrors.totalLength = "Total Length is required";
        }

        if (!form.totalWidth) {
            nextErrors.totalWidth = "Total Width is required";
        }

        if (!form.deckHeight) {
            nextErrors.deckHeight = "Deck Height is required";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    /* ===================================================
       SAVE => DIRECT DRAWING TABS
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setAddLoader(true);

        try {
            const selectedProductLabel =
                productOptions.find((item) => item.value === form.selectedProduct)
                    ?.label || "Product";

            const selectedAccountObj = accountOptions.find(
                (item) => item.value === form.selectedAccount
            );

            const accountName =
                selectedAccountObj?.data?.accountName ||
                selectedAccountObj?.label ||
                selectedAccountData?.accountName ||
                "";

            const bomComponents =
                Array.isArray(calculated?.bomComponents) &&
                    calculated!.bomComponents.length > 0
                    ? calculated!.bomComponents
                    : components;

            const drawingDimensions = {
                ...chassisInputs,
                ...(calculated || {}),
                trailerHeight: calculated?.trailerHeight || form.deckHeight,
                totalHeight: calculated?.totalHeight || form.deckHeight,
                pillarCount: calculated?.pillarCount || form.crossMemberCount,
            };

            const bomData = {
                selectedAccount: form.selectedAccount,
                selectedAccountData: selectedAccountObj?.data || selectedAccountData,

                accountCode: form.selectedAccount,
                accountName,

                selectedProduct: form.selectedProduct,
                selectedProductLabel,
                finishedProduct: form.selectedProduct,

                dimensions: drawingDimensions,
                calculated: calculated || {},
                estimatedWeight: calculated?.estimatedTrailerWeight,
                estimatedCost: calculated?.estimatedCost,
                components: bomComponents,
            };
            setGeneratedBomData(bomData);
            setEdit(true);

        } finally {
            setAddLoader(false);
        }
    };


    // const handleTabsClose = () => {
    //     setShowTabsModal(false);
    //     setGeneratedBomData(null);
    //     setActiveTab("Drawing");
    //     setShowModal(true);
    // };



    const renderField = (field: any) => {
        const value = modalForm?.[field.key] ?? "";
        const error = errors?.[field.key];

        const commonClass = `
        h-9 w-full rounded-md border bg-input px-3 text-sm text-foreground outline-none
        transition
        ${error ? "border-danger" : "border-border"}
        ${field.disabled ? "cursor-not-allowed bg-muted text-muted-foreground" : "focus:border-primary focus:ring-1 focus:ring-primary"}
    `;

        return (
            <div key={field.key} className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                    {field.label}
                    {field.required && <span className="text-danger">*</span>}
                </label>

                {field.type === "select" ? (
                    <select
                        disabled={field.disabled}
                        value={value}
                        onChange={(e) => {
                            if (field.onChange) {
                                field.onChange(e.target.value);
                            } else {
                                handleChange(field.key, e.target.value);
                            }
                        }}
                        className={commonClass}
                    >
                        <option value="">
                            {field.placeholder || `Select ${field.label}`}
                        </option>

                        {(field.options || []).map((option: any) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        disabled={field.disabled}
                        type={field.type || "text"}
                        value={value}
                        placeholder={field.placeholder || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className={commonClass}
                    />
                )}

                {error && (
                    <p className="text-[11px] font-medium text-danger">
                        {error}
                    </p>
                )}
            </div>
        );
    };


    return (
        <div className="bg-background text-foreground">


            {/* Main Split Layout */}
            <div className="grid h-[calc(100vh-73px)] grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
                {/* LEFT INPUT FORM */}
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border px-4 py-3">
                        <h2 className="text-sm font-bold text-foreground">
                            Input Screen Mockup
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Enter customer, product and chassis details
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                        {inputData.sections.map((section: any, sectionIndex: number) => (
                            <div
                                key={`${section.title}-${sectionIndex}`}
                                className="rounded-lg border border-border bg-muted/30 p-3"
                            >
                                <h3 className="mb-3 text-sm font-bold text-foreground">
                                    {sectionIndex + 1}. {section.title}
                                </h3>

                                <div className="grid grid-cols-1 gap-3">
                                    {section.fields.map(renderField)}
                                </div>
                            </div>
                        ))}


                        {showAutoCalculatedFields && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-black text-foreground">
                                            Auto Calculative Fields
                                        </h3>
                                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                            System generated values based on selected dimensions
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                        Auto
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {autoCalculatedDisplayFields.map((item: any) => (
                                        <div
                                            key={item.label}
                                            className={`
                        flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 shadow-sm
                        ${item.highlight
                                                    ? "border-success/20 bg-success/10"
                                                    : "border-border bg-card"
                                                }
                    `}
                                        >
                                            <p className="text-xs font-bold text-muted-foreground">
                                                {item.label}
                                            </p>

                                            <p
                                                className={`
                            shrink-0 text-right text-sm font-semibold
                            ${item.highlight ? "text-success" : "text-foreground"}
                        `}
                                            >
                                                {item.prefix || ""}
                                                {item.value || "—"}
                                                {item.value && item.suffix ? ` ${item.suffix}` : ""}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-border bg-card p-4">


                        <button
                            type="button"
                            onClick={() => {
                                setForm(emptyEngineeringForm);
                                setSelectedAccountData(null);
                                setGeneratedBomData(null);
                                setErrors({});
                                setEdit(false);
                            }}
                            className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            disabled={addLoader}
                            onClick={handleSubmit}
                            className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {addLoader ? "Generating..." : generatedBomData ? "Recalculate Drawing" : "Generate Drawing"}
                        </button>
                    </div>
                </div>

                {/* RIGHT RESULT AREA */}
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">
                                {generatedBomData?.selectedProductLabel || "Product"} - Generated Drawing
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Output / Drawing View Mockup
                            </p>
                        </div>

                        {/* <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={addLoader}
                                className="rounded-md border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-60"
                            >
                                Recalculate
                            </button>

                            <button
                                type="button"
                                className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                            >
                                Export
                            </button>
                        </div> */}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {generatedBomData ? (
                            <Drawing bomData={generatedBomData} />
                        ) : (
                            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                                <div className="max-w-sm text-center">
                                    <h3 className="text-base font-bold text-foreground">
                                        No drawing generated yet
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Fill the form on the left side and click Generate Drawing to preview Drawing, BOM, Summary and PDF here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEditEngineeringConfig;