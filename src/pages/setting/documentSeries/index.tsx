import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getVoucherConfiguration, getVoucherConfigurationByModule, saveVoucherConfiguration } from "../../../redux/slices/professionalSlice/documentSeries";
import { SelectInput, TextInput, ToggleInput } from "../../../components/inputs";


const MODULE_LABELS: Record<string, string> = {
    salesQuotation: "Sales Quotation",
    salesOrder: "Sales Order",
    salesInvoice: "Sales Invoice",
    salesReturn: "Sales Return",
    purchaseOrder: "Purchase Order",
    grn: "GRN",
    purchaseInvoice: "Purchase Invoice",
    purchaseReturn: "Purchase Return",
};

const DEFAULT_PREFIXES_BY_MODULE: Record<
    string,
    { gst: string; nonGst: string }
> = {
    salesInvoice: {
        gst: "SINV",
        nonGst: "INV",
    },
};

const getDefaultPrefixes = (module: string) => {
    return DEFAULT_PREFIXES_BY_MODULE[module] || {
        gst: "GST",
        nonGst: "NGST",
    };
};

const sanitizePrefix = (value: string) =>
    String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9/-]/g, "");

export default function DocumentSeries() {
    const dispatch = useDispatch<any>();

    const {
        voucherConfiguration,
        loading,
        saveLoader,
    } = useSelector((state: any) => state.voucherConfiguration);
    console.log({ voucherConfiguration })
    const [modules, setModules] = useState<string[]>([]);
    const [selectedModule, setSelectedModule] = useState("salesInvoice");

    const [gstPrefix, setGstPrefix] = useState("");
    const [gstNext, setGstNext] = useState("0");
    const [gstNumberOnly, setGstNumberOnly] = useState(false);

    const [nonGstPrefix, setNonGstPrefix] = useState("");
    const [nonGstNext, setNonGstNext] = useState("0");
    const [nonGstNumberOnly, setNonGstNumberOnly] =
        useState(false);

    const [configuredModules, setConfiguredModules] = useState<Set<string>>(new Set());

    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        dispatch(getVoucherConfiguration());
    }, []);

    useEffect(() => {
        if (!voucherConfiguration?.records) return;
        setModules(Object.keys(MODULE_LABELS));
        const configured: any = new Set(voucherConfiguration.records.map((item: any) => item.module));
        setConfiguredModules(configured);
        dispatch(getVoucherConfigurationByModule(selectedModule));
    }, [voucherConfiguration]);

    useEffect(() => {
        if (!voucherConfiguration?.module) return;
        const defaults = getDefaultPrefixes(selectedModule);
        setGstPrefix(voucherConfiguration?.gst?.prefix || defaults.gst);
        setGstNext(String(voucherConfiguration?.gst?.currentNumber || 0));
        setGstNumberOnly(Boolean(voucherConfiguration?.gst?.numberOnly));
        setNonGstPrefix(
            voucherConfiguration?.nonGst?.prefix ||
            defaults.nonGst
        );

        setNonGstNext(String(voucherConfiguration?.nonGst?.currentNumber || 0));
        setNonGstNumberOnly(Boolean(voucherConfiguration?.nonGst?.numberOnly));

        setIsConfigured(configuredModules.has(selectedModule));
    }, [voucherConfiguration]);

    const gstPreview = useMemo(() => {
        return gstNumberOnly
            ? gstNext
            : `${sanitizePrefix(gstPrefix)}-${gstNext}`;
    }, [gstPrefix, gstNext, gstNumberOnly]);

    const nonGstPreview = useMemo(() => {
        return nonGstNumberOnly
            ? nonGstNext
            : `${sanitizePrefix(nonGstPrefix)}-${nonGstNext}`;
    }, [nonGstPrefix, nonGstNext, nonGstNumberOnly]);

    const handleModuleChange = (module: string) => {
        setSelectedModule(module);

        dispatch(getVoucherConfigurationByModule(module));

        setIsConfigured(configuredModules.has(module));
    };

    const handleSave = async () => {
        const payload = {
            module: selectedModule,
            gst: {
                currentNumber: Number(gstNext),
                prefix: sanitizePrefix(gstPrefix) || "GST",
                numberOnly: gstNumberOnly,
            },
            nonGst: {
                currentNumber: Number(nonGstNext),
                prefix: sanitizePrefix(nonGstPrefix) || "NGST",
                numberOnly: nonGstNumberOnly,
            },
        };

        const res = await dispatch(
            saveVoucherConfiguration(payload)
        );


        if (
            saveVoucherConfiguration.fulfilled.match(res)
        ) {
            dispatch(
                getVoucherConfigurationByModule(
                    selectedModule
                )
            );

            setConfiguredModules(prev => {
                const updated = new Set(prev);
                updated.add(selectedModule);
                return updated;
            });

            setIsConfigured(true);
        }
    };

    return (
        <div className="flex h-full flex-col bg-card">

            {/* Header */}
            <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-card-foreground">
                    Document Series Configuration
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Configure GST and Non-GST document numbering for each module.
                </p>
            </div>


            {/* Content */}
            <div className="flex-1 space-y-6 overflow-auto px-6 py-5">

                {/* Module */}
                <div className="w-72">
                    <SelectInput
                        label="Module"
                        value={selectedModule}
                        options={[
                            { label: "Select Module", value: "" },
                            ...modules.map((module) => ({
                                label: MODULE_LABELS[module] || module,
                                value: module,
                            })),
                        ]}
                        onChange={(e: any) => handleModuleChange(e.target.value)}
                    />
                </div>


                {/* GST Series */}
                <div className="
            rounded-lg
            border border-border
            bg-muted/10
            p-5
        ">
                    <h3 className="
                mb-4
                text-sm
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
            ">
                        GST Series
                    </h3>


                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        <TextInput
                            label="Prefix"
                            value={gstPrefix}
                            onChange={(e: any) =>
                                setGstPrefix(e.target.value.toUpperCase())
                            }
                        />


                        <TextInput
                            label="Next Number"
                            type="number"
                            value={gstNext}
                            onChange={(e: any) =>
                                setGstNext(
                                    e.target.value.replace(/[^0-9]/g, "")
                                )
                            }
                        />

                    </div>


                    <div className="
                mt-4
                rounded-md
                border border-primary/20
                bg-primary/5
                px-4
                py-3
                text-sm
            ">
                        <span className="font-medium text-muted-foreground">
                            Preview:
                        </span>

                        <span className="
                    ml-2
                    font-semibold
                    text-primary
                ">
                            {gstPreview}
                        </span>
                    </div>

                </div>



                {/* Non GST Series */}
                <div className="
            rounded-lg
            border border-border
            bg-muted/10
            p-5
        ">

                    <h3 className="
                mb-4
                text-sm
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
            ">
                        Non GST Series
                    </h3>


                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        <TextInput
                            label="Prefix"
                            value={nonGstPrefix}
                            onChange={(e: any) =>
                                setNonGstPrefix(
                                    e.target.value.toUpperCase()
                                )
                            }
                        />


                        <TextInput
                            label="Next Number"
                            type="number"
                            value={nonGstNext}
                            onChange={(e: any) =>
                                setNonGstNext(
                                    e.target.value.replace(/[^0-9]/g, "")
                                )
                            }
                        />

                    </div>


                    <div className="
                mt-4
                rounded-md
                border border-primary/20
                bg-primary/5
                px-4
                py-3
                text-sm
            ">
                        <span className="font-medium text-muted-foreground">
                            Preview:
                        </span>

                        <span className="
                    ml-2
                    font-semibold
                    text-primary
                ">
                            {nonGstPreview}
                        </span>
                    </div>

                </div>



                {/* Configured Message */}
                {isConfigured && (
                    <div className="
                rounded-md
                border border-blue-200
                bg-blue-50
                px-4
                py-3
                text-sm
                text-blue-700
                dark:border-blue-900
                dark:bg-blue-950/30
                dark:text-blue-300
            ">
                        Prefixes can be updated at any time. Saving again will update
                        the current document series.
                    </div>
                )}

            </div>



            {/* Footer */}
            <div className="flex justify-end border-t border-border px-6 py-4 bg-card">
                <button
                    disabled={saveLoader}
                    onClick={handleSave}
                    className="
                inline-flex
                h-10
                min-w-[140px]
                items-center
                justify-center
                rounded-md
                bg-primary
                px-6
                text-sm
                font-medium
                text-primary-foreground
                transition
                hover:bg-primary/90
                disabled:pointer-events-none
                disabled:opacity-50
            "
                >
                    {saveLoader
                        ? "Saving..."
                        : isConfigured
                            ? "Update Series"
                            : "Save Series"
                    }

                </button>

            </div>

        </div>
    );
}