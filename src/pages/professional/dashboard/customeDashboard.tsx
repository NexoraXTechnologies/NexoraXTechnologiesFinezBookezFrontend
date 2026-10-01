import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCustomDashboardPreview, createCustomDashboardCard, fetchCustomDashboardBuilderOptions, fetchCustomDashboardCards, fetchCustomDashboardFields, fetchCustomDashboardModules, previewCustomDashboardCard } from "../../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice";
import { EmptyData, pageAnimation } from "./dashboardShared";
import { ArrowUpRight, Eye, LayoutDashboard, Loader2, Plus, Save, X } from "lucide-react";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { CHART_COLORS, CompactWidgetCard } from "../../../components/dashboardComp";
import { TextInput, SelectInput, TextArea } from "../../../components/inputs";
/* ===================================================
   CUSTOM DASHBOARD VIEW - ADDED ONLY
=================================================== */
const formatCustomDashboardValue = (value: any, displayConfig: any = {}) => {
    const numericValue = Number(value || 0);
    const decimalPlaces = Number.isInteger(Number(displayConfig?.decimalPlaces))
        ? Number(displayConfig.decimalPlaces)
        : 2;
    if (displayConfig?.format === "currency") {
        const currency = displayConfig?.currency || "INR";
        try {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency,
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(numericValue);
        } catch {
            return `${displayConfig?.prefix || "₹"}${numericValue.toLocaleString("en-IN")}`;
        }
    }
    if (displayConfig?.format === "percentage" || displayConfig?.format === "percent") {
        return `${numericValue.toFixed(decimalPlaces)}%`;
    }
    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(numericValue);
    return `${displayConfig?.prefix || ""}${formatted}${displayConfig?.suffix || ""}`;
};
const normalizeCustomChartData = (result: any) => {
    if (Array.isArray(result?.data)) {
        return result.data.map((item: any) => ({
            label: item?.label ?? item?.name ?? "-",
            value: Number(item?.value || 0),
        }));
    }
    if (Array.isArray(result?.labels) && Array.isArray(result?.series)) {
        return result.labels.map((label: any, index: number) => ({
            label,
            value: Number(result.series[index] || 0),
        }));
    }
    return [];
};
const normalizeTableData = (result: any) => {
    return {
        header: Array.isArray(result?.header) ? result.header : [],
        body: Array.isArray(result?.body) ? result.body : [],
    };
};

const CustomDashboardCard = ({ card }: { card: any }) => {
    const result = card?.result || {};
    const displayConfig = card?.displayConfig || {};
    const chartData = normalizeCustomChartData(result);
    const moduleLabel = card?.dataSource?.module || "BookEZ";
    if (card?.executionError) {
        return (
            <div className="rounded-2xl border border-danger/30 bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-black text-foreground">
                            {card?.cardName || "Dashboard Card"}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-muted-foreground">{moduleLabel}</p>
                    </div>
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[10px] font-black text-danger">
                        Error
                    </span>
                </div>
                <p className="mt-3 text-xs font-bold text-danger">
                    {card?.executionError?.message || "Failed to load card data"}
                </p>
            </div>
        );
    }
    if (card?.cardType === "stat") {
        return (
            <div className="group relative min-h-[138px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-110" />
                <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                                {card?.cardName || "Metric"}
                            </p>
                            <p className="mt-1 truncate text-[10px] font-bold text-primary">
                                {moduleLabel}
                            </p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="truncate text-[28px] font-black leading-none tracking-tight text-foreground">
                            {formatCustomDashboardValue(result?.value, displayConfig)}
                        </p>
                        <p className="mt-2 truncate text-[11px] font-medium text-muted-foreground">
                            {card?.description || "Live dashboard metric"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    // This section is for bar chart card type
    if (card?.cardType === "barChart") {
        return (
            <CompactWidgetCard title={card?.cardName || "Bar Chart"} accent="sales">
                {!chartData.length ? (
                    <EmptyData />
                ) : (
                    <div className="h-[300px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout={chartData.length > 5 ? "vertical" : "horizontal"}
                                margin={{ top: 12, right: 18, left: chartData.length > 5 ? 32 : 0, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                                {chartData.length > 5 ? (
                                    <>
                                        <XAxis type="number" axisLine={false} tickLine={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            width={120}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} />
                                    </>
                                )}
                                <Tooltip
                                    formatter={(value: any) =>
                                        formatCustomDashboardValue(value, displayConfig)
                                    }
                                />
                                <Bar dataKey="value" fill="#f97316" radius={[8, 8, 8, 8]} maxBarSize={44} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CompactWidgetCard>
        );
    }
    // This section is for line chart card type
    if (card?.cardType === "lineChart") {
        return (
            <CompactWidgetCard title={card?.cardName || "Line Chart"} accent="receivable">
                {!chartData.length ? (
                    <EmptyData />
                ) : (
                    <div className="h-[300px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(value: any) =>
                                        formatCustomDashboardValue(value, displayConfig)
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CompactWidgetCard>
        );
    }
    // This section is for pie chart card type
    if (card?.cardType === "pieChart") {
        return (
            <CompactWidgetCard title={card?.cardName || "Pie Chart"} accent="purchase">
                {!chartData.length ? (
                    <EmptyData />
                ) : (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    stroke="var(--card)"
                                    strokeWidth={3}
                                >
                                    {chartData.map((item: any, index: number) => (
                                        <Cell
                                            key={`${item.label}-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) =>
                                        formatCustomDashboardValue(value, displayConfig)
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CompactWidgetCard>
        );
    }
    // Section for table card type
    if (card?.cardType === "table") {
        const { header, body } = normalizeTableData(result);
        return (
            <CompactWidgetCard title={card?.cardName || "Table"} accent="sales">
                {!header.length || !body.length ? (
                    <EmptyData text="No table data available" />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                        <div className="max-h-[360px] overflow-auto">
                            <table className="w-full min-w-[600px] border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-muted">
                                    <tr>
                                        {header.map((item: any) => (
                                            <th
                                                key={item?.key}
                                                className="whitespace-nowrap border-b border-border px-4 py-3 text-[11px] font-black uppercase tracking-wide text-muted-foreground"
                                            >
                                                {item?.label || "-"}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {body.map((row: any, rowIndex: number) => (
                                        <tr
                                            key={rowIndex}
                                            className="border-b border-border last:border-b-0 hover:bg-muted/30"
                                        >
                                            {header.map((item: any) => {
                                                const value = row?.[item?.key];
                                                return (
                                                    <td
                                                        key={`${rowIndex}-${item?.key}`}
                                                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-foreground"
                                                    >
                                                        {value !== null && typeof value === "object"
                                                            ? JSON.stringify(value)
                                                            : String(value ?? "-")}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CompactWidgetCard>
        );
    }
    return <EmptyData text="Unsupported dashboard card type" />;
};
const getBuilderOptionValue = (item: any) => {
    if (typeof item === "string") return item;
    return item?.value || item?.key || item?.module || item?.field || "";
};
const getBuilderOptionLabel = (item: any) => {
    if (typeof item === "string") return item;
    return item?.label || item?.name || item?.module || item?.field || item?.value || "";
};
const normalizeApiArray = (value: any, keys: string[] = []) => {
    if (Array.isArray(value)) return value;
    for (const key of keys) {
        if (Array.isArray(value?.[key])) return value[key];
    }
    if (Array.isArray(value?.data)) return value.data;
    return [];
};
const getFieldByName = (fields: any[], fieldName: string) => {
    return fields.find((item: any) => String(item?.field || "") === String(fieldName || ""));
};

const makeTableFieldKey = (label: string) => {
    return String(label || "")
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((word, index) => {
            const lower = word.toLowerCase();

            if (index === 0) {
                return lower;
            }

            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
};
const toSelectOptions = (items: any[] = []) => {
    return (items || []).map((item: any) => ({
        label: getBuilderOptionLabel(item),
        value: getBuilderOptionValue(item),
    }));
};

const CustomDashboardView = () => {
    const dispatch = useDispatch();
    const {
        customDashboardCards,
        customDashboardBuilderOptions,
        customDashboardModules,
        customDashboardFields,
        customDashboardPreview,
        customDashboardLoading,
        customDashboardBuilderLoading,
        customDashboardModulesLoading,
        customDashboardFieldsLoading,
        customDashboardPreviewLoading,
        customDashboardCreateLoading,
        customDashboardError,
    } = useSelector((state: any) => state.professionalDashboard);

    const [showBuilder, setShowBuilder] = useState(false);
    const [localError, setLocalError] = useState("");
    const [filters, setFilters] = useState<any[]>([]);
    const [form, setForm] = useState({
        cardName: "",
        description: "",
        cardType: "stat",
        sourceType: "mongo",
        module: "",
        operation: "count",
        field: "" as any,
        groupByField: "",
        aggregateOperation: "count",
        aggregateField: "",
        format: "number",
        currency: "INR",
        prefix: "",
        decimalPlaces: 0,
    });

    const cardTypes = useMemo(
        () => normalizeApiArray(customDashboardBuilderOptions, ["cardTypes", "dashboardCardTypes"]),
        [customDashboardBuilderOptions]
    );

    const dataSources = useMemo(
        () => normalizeApiArray(customDashboardBuilderOptions, ["dataSources", "dashboardDataSources"]),
        [customDashboardBuilderOptions]
    );

    const operations = useMemo(
        () => normalizeApiArray(customDashboardBuilderOptions, ["operations", "dashboardOperations"]),
        [customDashboardBuilderOptions]
    );

    const modules = useMemo(
        () => normalizeApiArray(customDashboardModules, ["modules"]),
        [customDashboardModules]
    );

    const fields = useMemo(
        () => normalizeApiArray(customDashboardFields, ["fields"]),
        [customDashboardFields]
    );

    const filterableFields = useMemo(
        () => fields.filter((item: any) => item?.filterable !== false),
        [fields]
    );

    const groupableFields = useMemo(
        () => fields.filter((item: any) => item?.groupable === true),
        [fields]
    );

    const fieldsForOperation = useMemo(() => {
        if (form.operation === "count") return fields;
        return fields.filter((item: any) => {
            if (!Array.isArray(item?.operations)) return true;
            return item.operations.includes(form.operation);
        });
    }, [fields, form.operation]);

    const aggregateFields = useMemo(() => {
        if (form.aggregateOperation === "count") return [];
        return fields.filter((item: any) => {
            if (!Array.isArray(item?.operations)) return false;
            return item.operations.includes(form.aggregateOperation);
        });
    }, [fields, form.aggregateOperation]);

    const fallbackCardTypes = [
        { label: "Number Card", value: "stat" },
        { label: "Table", value: "table" },
        { label: "Bar Chart", value: "barChart" },
        { label: "Line Chart", value: "lineChart" },
        { label: "Pie Chart", value: "pieChart" },
    ];

    const fallbackOperations = [
        { label: "Count", value: "count" },
        { label: "Sum", value: "sum" },
        { label: "Average", value: "avg" },
        { label: "Minimum", value: "min" },
        { label: "Maximum", value: "max" },
        { label: "List", value: "list" },
        { label: "Group By", value: "groupBy" },
    ];

    const aggregateOperationOptions = [
        { label: "Count", value: "count" },
        { label: "Sum", value: "sum" },
        { label: "Average", value: "avg" },
        { label: "Minimum", value: "min" },
        { label: "Maximum", value: "max" },
    ];

    const formatOptions = [
        { label: "Number", value: "number" },
        { label: "Currency", value: "currency" },
        { label: "Percentage", value: "percentage" },
    ];

    const displayedCardTypes = cardTypes.length ? toSelectOptions(cardTypes) : fallbackCardTypes;
    const displayedDataSources = dataSources.length
        ? toSelectOptions(dataSources)
        : [{ label: "BookEZ", value: "mongo" }];
    const displayedOperations = operations.length ? toSelectOptions(operations) : fallbackOperations;
    const moduleOptions = toSelectOptions(modules);
    const fieldOptions = fieldsForOperation.map((item: any) => ({
        label: item?.label || item?.field,
        value: item?.field,
    }));
    const tableFieldOptions = fields.map((item: any) => ({
        label: item?.label || item?.field,
        value: item?.field,
    }));
    const groupableFieldOptions = groupableFields.map((item: any) => ({
        label: item?.label || item?.field,
        value: item?.field,
    }));
    const aggregateFieldOptions = aggregateFields.map((item: any) => ({
        label: item?.label || item?.field,
        value: item?.field,
    }));
    const filterFieldOptions = filterableFields.map((item: any) => ({
        label: item?.label || item?.field,
        value: item?.field,
    }));

    const totalCustomCards = Array.isArray(customDashboardCards)
        ? customDashboardCards.length
        : 0;

    const statCards = useMemo(() => {
        return (customDashboardCards || []).filter((card: any) => card?.cardType === "stat");
    }, [customDashboardCards]);

    const otherCards = useMemo(() => {
        return (customDashboardCards || []).filter((card: any) => card?.cardType !== "stat");
    }, [customDashboardCards]);

    const getCardGridClass = (card: any) => {
        if (card?.cardType === "table") return "xl:col-span-12";
        if (card?.cardType === "lineChart") return "xl:col-span-8";
        if (card?.cardType === "barChart") return "xl:col-span-6";
        if (card?.cardType === "pieChart") return "xl:col-span-4";
        return "xl:col-span-6";
    };

    useEffect(() => {
        dispatch(fetchCustomDashboardBuilderOptions() as any);
        dispatch(fetchCustomDashboardModules("mongo") as any);
        dispatch(
            fetchCustomDashboardCards({
                offset: 0,
                limit: 100,
            }) as any
        );
    }, [dispatch]);

    useEffect(() => {
        if (!modules.length) return;

        const currentExists = modules.some(
            (item: any) => getBuilderOptionValue(item) === form.module
        );

        if (!currentExists) {
            const firstModule = getBuilderOptionValue(modules[0]);

            setForm((previous) => ({
                ...previous,
                module: firstModule,
                field: "",
                groupByField: "",
                aggregateField: "",
            }));
        }
    }, [modules, form.module]);

    useEffect(() => {
        if (!form.module) return;

        dispatch(
            fetchCustomDashboardFields({
                sourceType: form.sourceType,
                module: form.module,
            }) as any
        );
    }, [dispatch, form.sourceType, form.module]);

    useEffect(() => {
        if (form.operation === "count") {
            const hasFieldValue = Array.isArray(form.field)
                ? form.field.length > 0
                : Boolean(form.field);

            if (hasFieldValue) {
                setForm((previous) => ({
                    ...previous,
                    field: "",
                }));
            }

            return;
        }

        if (
            form.cardType === "table" &&
            form.operation === "list"
        ) {
            if (!fields.length) return;

            const currentFields = Array.isArray(form.field)
                ? form.field
                : form.field
                    ? [form.field]
                    : [];

            const allowedFields = new Set(
                fields.map((item: any) => item?.field)
            );

            const validFields = currentFields.filter(
                (fieldName: string) =>
                    allowedFields.has(fieldName)
            );

            if (
                JSON.stringify(currentFields) !==
                JSON.stringify(validFields)
            ) {
                setForm((previous) => ({
                    ...previous,
                    field: validFields,
                }));
            }

            return;
        }

        if (!fieldsForOperation.length) return;

        const valid = fieldsForOperation.some(
            (item: any) => item?.field === form.field
        );

        if (!valid) {
            setForm((previous) => ({
                ...previous,
                field: fieldsForOperation[0]?.field || "",
            }));
        }
    }, [
        fields,
        fieldsForOperation,
        form.operation,
        form.field,
        form.cardType,
    ]);

    useEffect(() => {
        if (form.operation !== "groupBy") return;
        if (!groupableFields.length) return;

        const valid = groupableFields.some(
            (item: any) => item?.field === form.groupByField
        );

        if (!valid) {
            setForm((previous) => ({
                ...previous,
                groupByField: groupableFields[0]?.field || "",
            }));
        }
    }, [groupableFields, form.operation, form.groupByField]);

    useEffect(() => {
        if (
            form.operation !== "groupBy" ||
            form.aggregateOperation === "count"
        ) {
            return;
        }

        if (!aggregateFields.length) return;

        const valid = aggregateFields.some(
            (item: any) => item?.field === form.aggregateField
        );

        if (!valid) {
            setForm((previous) => ({
                ...previous,
                aggregateField: aggregateFields[0]?.field || "",
            }));
        }
    }, [
        aggregateFields,
        form.operation,
        form.aggregateOperation,
        form.aggregateField,
    ]);

    const updateForm = (key: string, value: any) => {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const handleTextChange = (key: string) => (event: any) => {
        updateForm(key, event?.target?.value ?? "");
    };

    const handleSelectChange = (key: string) => (event: any) => {
        updateForm(key, event?.target?.value ?? "");
        dispatch(clearCustomDashboardPreview());
    };

    const resetBuilder = () => {
        setFilters([]);
        setLocalError("");
        dispatch(clearCustomDashboardPreview());

        setForm((previous) => ({
            ...previous,
            cardName: "",
            description: "",
            cardType: "stat",
            operation: "count",
            field: "",
            groupByField: "",
            aggregateOperation: "count",
            aggregateField: "",
            format: "number",
            currency: "INR",
            prefix: "",
            decimalPlaces: 0,
        }));
    };

    const openBuilder = () => {
        resetBuilder();
        setShowBuilder(true);
    };

    const closeBuilder = () => {
        resetBuilder();
        setShowBuilder(false);
    };

    const handleSourceTypeChange = (sourceType: string) => {
        setForm((previous) => ({
            ...previous,
            sourceType,
            module: "",
            field: "",
            groupByField: "",
            aggregateField: "",
        }));

        setFilters([]);
        dispatch(clearCustomDashboardPreview());
        dispatch(fetchCustomDashboardModules(sourceType) as any);
    };

    const handleModuleChange = (module: string) => {
        setForm((previous) => ({
            ...previous,
            module,
            field: "",
            groupByField: "",
            aggregateField: "",
        }));

        setFilters([]);
        dispatch(clearCustomDashboardPreview());
    };

    const addFilter = () => {
        const firstField = filterableFields[0];
        if (!firstField) return;

        const firstOperator =
            Array.isArray(firstField?.operators) &&
                firstField.operators.length
                ? firstField.operators[0]
                : "eq";

        setFilters((previous) => [
            ...previous,
            {
                field: firstField.field,
                operator: firstOperator,
                value: "",
                value2: "",
            },
        ]);
    };

    const updateFilter = (
        index: number,
        key: string,
        value: any
    ) => {
        setFilters((previous) =>
            previous.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                if (key === "field") {
                    const fieldConfig = getFieldByName(
                        filterableFields,
                        value
                    );

                    const operator =
                        Array.isArray(fieldConfig?.operators) &&
                            fieldConfig.operators.length
                            ? fieldConfig.operators[0]
                            : "eq";

                    return {
                        ...item,
                        field: value,
                        operator,
                        value: "",
                        value2: "",
                    };
                }

                return {
                    ...item,
                    [key]: value,
                };
            })
        );
    };

    const removeFilter = (index: number) => {
        setFilters((previous) =>
            previous.filter(
                (_, itemIndex) => itemIndex !== index
            )
        );
    };

    const castFilterValue = (
        value: any,
        fieldConfig: any
    ) => {
        if (fieldConfig?.type === "number") {
            const numberValue = Number(value);

            return Number.isFinite(numberValue)
                ? numberValue
                : value;
        }

        if (fieldConfig?.type === "boolean") {
            return String(value).toLowerCase() === "true";
        }

        return value;
    };

    const normalizeFiltersForPayload = () => {
        return filters.map((filter: any) => {
            const fieldConfig = getFieldByName(
                fields,
                filter.field
            );

            if (!filter.field || !filter.operator) {
                throw new Error(
                    "Complete all filter fields before previewing."
                );
            }

            if (filter.operator === "between") {
                if (
                    filter.value === "" ||
                    filter.value2 === ""
                ) {
                    throw new Error(
                        `Both values are required for ${fieldConfig?.label || filter.field
                        }.`
                    );
                }

                return {
                    field: filter.field,
                    operator: filter.operator,
                    value: [
                        castFilterValue(
                            filter.value,
                            fieldConfig
                        ),
                        castFilterValue(
                            filter.value2,
                            fieldConfig
                        ),
                    ],
                };
            }

            if (
                ["in", "notIn"].includes(
                    filter.operator
                )
            ) {
                const values = String(
                    filter.value || ""
                )
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) =>
                        castFilterValue(
                            item,
                            fieldConfig
                        )
                    );

                if (!values.length) {
                    throw new Error(
                        `Enter at least one value for ${fieldConfig?.label || filter.field
                        }.`
                    );
                }

                return {
                    field: filter.field,
                    operator: filter.operator,
                    value: values,
                };
            }

            if (filter.value === "") {
                throw new Error(
                    `Value is required for ${fieldConfig?.label || filter.field
                    }.`
                );
            }

            return {
                field: filter.field,
                operator: filter.operator,
                value: castFilterValue(
                    filter.value,
                    fieldConfig
                ),
            };
        });
    };

    const buildPayload = () => {
        if (!form.cardName.trim()) {
            throw new Error("Card name is required.");
        }

        if (!form.module) {
            throw new Error("Module is required.");
        }

        const queryConfig: any = {
            operation: form.operation,
            filters: normalizeFiltersForPayload(),
        };

        // ★ TABLE + LIST SUPPORTS MULTIPLE FIELDS
        if (
            form.cardType === "table" &&
            form.operation === "list"
        ) {
            const selectedFields = Array.isArray(form.field)
                ? form.field
                : form.field
                    ? [form.field]
                    : [];

            if (!selectedFields.length) {
                throw new Error(
                    "Select at least one field for the table."
                );
            }

            queryConfig.fields = selectedFields.map(
                (fieldName: string) => {
                    const fieldConfig = getFieldByName(
                        fields,
                        fieldName
                    );

                    const label =
                        fieldConfig?.label ||
                        fieldName;

                    return {
                        field: fieldName,
                        key: makeTableFieldKey(label),
                        label,
                    };
                }
            );
        } else if (form.operation !== "count") {
            if (!form.field) {
                throw new Error(
                    "Field is required for selected operation."
                );
            }

            queryConfig.field = form.field;
        }

        if (form.operation === "groupBy") {
            if (!form.groupByField) {
                throw new Error(
                    "Group By field is required."
                );
            }

            queryConfig.groupByField =
                form.groupByField;

            queryConfig.aggregate = {
                operation:
                    form.aggregateOperation,
            };

            if (
                form.aggregateOperation !==
                "count"
            ) {
                if (!form.aggregateField) {
                    throw new Error(
                        "Aggregate field is required."
                    );
                }

                queryConfig.aggregate.field =
                    form.aggregateField;
            }
        }

        return {
            cardName: form.cardName.trim(),
            description: form.description.trim(),
            cardType: form.cardType,
            dataSource: {
                sourceType:
                    form.sourceType,
                module:
                    form.module,
            },
            queryConfig,
            displayConfig: {
                format:
                    form.format,
                currency:
                    form.currency,
                prefix:
                    form.prefix,
                decimalPlaces:
                    Number(
                        form.decimalPlaces || 0
                    ),
            },
            layout: {
                x: 0,
                y: 0,
                w:
                    form.cardType === "stat"
                        ? 3
                        : 6,
                h:
                    form.cardType === "stat"
                        ? 2
                        : 4,
            },
        };
    };

    const handlePreview = async () => {
        try {
            setLocalError("");

            const payload =
                buildPayload();

            const action =
                await dispatch(
                    previewCustomDashboardCard(
                        payload
                    ) as any
                );

            if (
                previewCustomDashboardCard.rejected.match(
                    action
                )
            ) {
                setLocalError(
                    // @ts-ignore
                    action?.payload?.message ||
                    "Preview failed."
                );
            }
        } catch (error: any) {
            setLocalError(
                error?.message ||
                "Invalid card configuration."
            );
        }
    };

    const handleSave = async () => {
        try {
            setLocalError("");

            const payload =
                buildPayload();

            const action =
                await dispatch(
                    createCustomDashboardCard(
                        payload
                    ) as any
                );

            if (
                createCustomDashboardCard.fulfilled.match(
                    action
                )
            ) {
                await dispatch(
                    fetchCustomDashboardCards({
                        offset: 0,
                        limit: 100,
                    }) as any
                );

                closeBuilder();
                return;
            }

            // @ts-ignore
            setLocalError(
                action?.payload?.message ||
                "Failed to save dashboard card."
            );
        } catch (error: any) {
            setLocalError(
                error?.message ||
                "Failed to save dashboard card."
            );
        }
    };

    const renderFilterValueInput = (
        filter: any,
        index: number
    ) => {
        const fieldConfig = getFieldByName(
            fields,
            filter.field
        );

        const inputType =
            fieldConfig?.type === "number"
                ? "number"
                : fieldConfig?.type === "date"
                    ? "date"
                    : "text";

        if (filter.operator === "between") {
            return (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TextInput
                        label=""
                        type={inputType}
                        value={filter.value}
                        onChange={(event: any) =>
                            updateFilter(
                                index,
                                "value",
                                event?.target?.value
                            )
                        }
                        placeholder="From"
                    />

                    <TextInput
                        label=""
                        type={inputType}
                        value={filter.value2}
                        onChange={(event: any) =>
                            updateFilter(
                                index,
                                "value2",
                                event?.target?.value
                            )
                        }
                        placeholder="To"
                    />
                </div>
            );
        }

        if (fieldConfig?.type === "boolean") {
            return (
                <SelectInput
                    label=""
                    value={filter.value}
                    options={[
                        {
                            label: "Select value",
                            value: "",
                        },
                        {
                            label: "True",
                            value: "true",
                        },
                        {
                            label: "False",
                            value: "false",
                        },
                    ]}
                    onChange={(event: any) =>
                        updateFilter(
                            index,
                            "value",
                            event?.target?.value
                        )
                    }
                    placeholder="Select value"
                />
            );
        }

        return (
            <TextInput
                label=""
                type={inputType}
                value={filter.value}
                onChange={(event: any) =>
                    updateFilter(
                        index,
                        "value",
                        event?.target?.value
                    )
                }
                placeholder={
                    ["in", "notIn"].includes(
                        filter.operator
                    )
                        ? "Value 1, Value 2, Value 3"
                        : "Enter value"
                }
            />
        );
    };

    return (
        <motion.div
            key="custom-dashboard"
            variants={pageAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
        >
            <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-foreground">
                                Custom Dashboard
                            </h1>
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
                                {totalCustomCards} {totalCustomCards === 1 ? "Card" : "Cards"}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                            Build a flexible dashboard from live BookEZ data and keep your most important metrics on top.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openBuilder}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <Plus size={17} />
                        Add Custom Card
                    </button>
                </div>
            </div>

            {customDashboardLoading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
                    <div className="text-center">
                        <Loader2 size={28} className="mx-auto animate-spin text-primary" />
                        <p className="mt-2 text-xs font-bold text-muted-foreground">
                            Loading custom dashboard...
                        </p>
                    </div>
                </div>
            ) : customDashboardError && !customDashboardCards?.length ? (
                <div className="rounded-2xl border border-danger/30 bg-card p-5 text-center text-sm font-bold text-danger">
                    {customDashboardError}
                </div>
            ) : !customDashboardCards?.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutDashboard size={24} />
                    </div>
                    <h2 className="mt-3 text-base font-black text-foreground">
                        No custom cards yet
                    </h2>
                    <p className="mx-auto mt-1 max-w-md text-xs font-medium text-muted-foreground">
                        Create your first custom dashboard card from BookEZ data.
                    </p>
                    <button
                        type="button"
                        onClick={openBuilder}
                        className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground"
                    >
                        <Plus size={15} />
                        Create First Card
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {statCards.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {statCards.map((card: any) => (
                                <CustomDashboardCard
                                    key={card?.cardCode || card?._id}
                                    card={card}
                                />
                            ))}
                        </div>
                    )}

                    {otherCards.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                            {otherCards.map((card: any) => (
                                <div
                                    key={card?.cardCode || card?._id}
                                    className={getCardGridClass(card)}
                                >
                                    <CustomDashboardCard card={card} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showBuilder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm">
                    <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Plus size={18} />
                                </div>

                                <div>
                                    <h2 className="text-base font-black text-foreground">
                                        Add Custom Card
                                    </h2>

                                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                        Configure the card, preview it and save.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeBuilder}
                                className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] xl:overflow-hidden">
                            <div className="space-y-4 p-4 xl:overflow-y-auto">
                                <section className="rounded-xl border border-border bg-card p-4">
                                    <div className="mb-3">
                                        <p className="text-sm font-black text-foreground">
                                            Card Details
                                        </p>

                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Basic card information and visualization type.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <TextInput
                                            label="Card Name"
                                            mandatory
                                            value={form.cardName}
                                            onChange={handleTextChange(
                                                "cardName"
                                            )}
                                            placeholder="Customer Wise Sales"
                                        />

                                        <SelectInput
                                            label="Card Type"
                                            mandatory
                                            value={form.cardType}
                                            options={displayedCardTypes}
                                            onChange={handleSelectChange(
                                                "cardType"
                                            )}
                                            placeholder="Select card type"
                                        />

                                        <div className="md:col-span-2">
                                            <TextArea
                                                label="Description"
                                                value={form.description}
                                                onChange={handleTextChange(
                                                    "description"
                                                )}
                                                placeholder="Optional description"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-border bg-card p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-foreground">
                                                Data Selection
                                            </p>

                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Select the BookEZ module, operation and field.
                                            </p>
                                        </div>

                                        {(customDashboardModulesLoading ||
                                            customDashboardFieldsLoading) && (
                                                <Loader2
                                                    size={17}
                                                    className="animate-spin text-primary"
                                                />
                                            )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <SelectInput
                                            label="Data Source"
                                            value={form.sourceType}
                                            options={
                                                displayedDataSources
                                            }
                                            onChange={(event: any) =>
                                                handleSourceTypeChange(
                                                    event?.target?.value ||
                                                    ""
                                                )
                                            }
                                            placeholder="Select data source"
                                        />

                                        <SelectInput
                                            label="Module"
                                            mandatory
                                            value={form.module}
                                            options={moduleOptions}
                                            onChange={(event: any) =>
                                                handleModuleChange(
                                                    event?.target?.value ||
                                                    ""
                                                )
                                            }
                                            disabled={
                                                customDashboardModulesLoading ||
                                                !moduleOptions.length
                                            }
                                            placeholder={
                                                customDashboardModulesLoading
                                                    ? "Loading modules..."
                                                    : "Select module"
                                            }
                                        />

                                        <SelectInput
                                            label="Operation"
                                            mandatory
                                            value={form.operation}
                                            options={
                                                displayedOperations
                                            }
                                            onChange={handleSelectChange(
                                                "operation"
                                            )}
                                            placeholder="Select operation"
                                        />

                                        {form.operation !==
                                            "count" && (
                                                <SelectInput
                                                    label="Field"
                                                    mandatory
                                                    value={form.field}
                                                    options={
                                                        form.cardType === "table" &&
                                                            form.operation === "list"
                                                            ? tableFieldOptions
                                                            : fieldOptions
                                                    }
                                                    isMulti={
                                                        form.cardType === "table" &&
                                                        form.operation === "list"
                                                    }
                                                    onChange={handleSelectChange(
                                                        "field"
                                                    )}
                                                    disabled={
                                                        customDashboardFieldsLoading ||
                                                        !(form.cardType === "table" &&
                                                            form.operation === "list"
                                                            ? tableFieldOptions.length
                                                            : fieldOptions.length)
                                                    }
                                                    placeholder={
                                                        customDashboardFieldsLoading
                                                            ? "Loading fields..."
                                                            : form.cardType === "table" &&
                                                                form.operation === "list"
                                                                ? "Select fields"
                                                                : "Select field"
                                                    }
                                                />
                                            )}
                                    </div>

                                    {form.operation ===
                                        "groupBy" && (
                                            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                                <p className="mb-3 text-xs font-black uppercase tracking-wide text-primary">
                                                    Group Configuration
                                                </p>

                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                    <SelectInput
                                                        label="Group By Field"
                                                        mandatory
                                                        value={
                                                            form.groupByField
                                                        }
                                                        options={
                                                            groupableFieldOptions
                                                        }
                                                        onChange={handleSelectChange(
                                                            "groupByField"
                                                        )}
                                                        placeholder="Select group field"
                                                    />

                                                    <SelectInput
                                                        label="Aggregate Operation"
                                                        value={
                                                            form.aggregateOperation
                                                        }
                                                        options={
                                                            aggregateOperationOptions
                                                        }
                                                        onChange={handleSelectChange(
                                                            "aggregateOperation"
                                                        )}
                                                        placeholder="Select aggregate"
                                                    />

                                                    <SelectInput
                                                        label="Aggregate Field"
                                                        mandatory={
                                                            form.aggregateOperation !==
                                                            "count"
                                                        }
                                                        value={
                                                            form.aggregateField
                                                        }
                                                        options={
                                                            aggregateFieldOptions
                                                        }
                                                        onChange={handleSelectChange(
                                                            "aggregateField"
                                                        )}
                                                        disabled={
                                                            form.aggregateOperation ===
                                                            "count" ||
                                                            !aggregateFieldOptions.length
                                                        }
                                                        placeholder={
                                                            form.aggregateOperation ===
                                                                "count"
                                                                ? "Not required"
                                                                : "Select aggregate field"
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                </section>

                                <section className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-black text-foreground">
                                                Filters
                                            </p>

                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Add optional conditions using allowed operators.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addFilter}
                                            disabled={
                                                !filterableFields.length
                                            }
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Plus size={14} />
                                            Add Filter
                                        </button>
                                    </div>

                                    {!filters.length ? (
                                        <div className="mt-3 rounded-lg border border-dashed border-border bg-background/50 px-4 py-4 text-center text-xs font-medium text-muted-foreground">
                                            No filters added. All matching records will be used.
                                        </div>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            {filters.map(
                                                (filter: any, index: number) => {
                                                    const fieldConfig = getFieldByName(fields, filter.field);

                                                    const availableOperators = Array.isArray(fieldConfig?.operators) ? fieldConfig.operators.map((operator: string) => ({
                                                        label: operator, value: operator,
                                                    })
                                                    ) : [];

                                                    return (
                                                        <div key={index}
                                                            className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_160px_1fr_auto] md:items-end"
                                                        >
                                                            <SelectInput
                                                                label="Field"
                                                                value={filter.field}
                                                                options={filterFieldOptions}
                                                                onChange={(event: any) =>
                                                                    updateFilter(                                                                        index,
                                                                        "field",
                                                                        event
                                                                            ?.target
                                                                            ?.value ||
                                                                        ""
                                                                    )
                                                                }
                                                                placeholder="Select field"
                                                            />

                                                            <SelectInput
                                                                label="Operator"
                                                                value={
                                                                    filter.operator
                                                                }
                                                                options={
                                                                    availableOperators
                                                                }
                                                                onChange={(
                                                                    event: any
                                                                ) =>
                                                                    updateFilter(
                                                                        index,
                                                                        "operator",
                                                                        event
                                                                            ?.target
                                                                            ?.value ||
                                                                        ""
                                                                    )
                                                                }
                                                                placeholder="Operator"
                                                            />

                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-card-foreground">
                                                                    Value
                                                                </label>

                                                                {renderFilterValueInput(
                                                                    filter,
                                                                    index
                                                                )}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeFilter(
                                                                        index
                                                                    )
                                                                }
                                                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-danger/20 bg-danger/5 text-danger transition hover:bg-danger/10"
                                                                title="Remove filter"
                                                            >
                                                                <X
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-xl border border-border bg-card p-4">
                                    <div className="mb-3">
                                        <p className="text-sm font-black text-foreground">
                                            Display Format
                                        </p>

                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Configure how numeric values appear.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <SelectInput
                                            label="Format"
                                            value={form.format}
                                            options={formatOptions}
                                            onChange={handleSelectChange(
                                                "format"
                                            )}
                                            placeholder="Select format"
                                        />

                                        <TextInput
                                            label="Currency"
                                            value={form.currency}
                                            onChange={handleTextChange(
                                                "currency"
                                            )}
                                            disabled={
                                                form.format !==
                                                "currency"
                                            }
                                            placeholder="INR"
                                        />

                                        <TextInput
                                            label="Prefix"
                                            value={form.prefix}
                                            onChange={handleTextChange(
                                                "prefix"
                                            )}
                                            placeholder="₹"
                                        />

                                        <TextInput
                                            label="Decimal Places"
                                            type="number"
                                            value={
                                                form.decimalPlaces
                                            }
                                            onChange={(
                                                event: any
                                            ) =>
                                                updateForm(
                                                    "decimalPlaces",
                                                    Number(
                                                        event
                                                            ?.target
                                                            ?.value ||
                                                        0
                                                    )
                                                )
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                </section>

                                {(localError ||
                                    customDashboardError) && (
                                        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs font-bold text-danger">
                                            {localError ||
                                                customDashboardError}
                                        </div>
                                    )}
                            </div>

                            <aside className="border-t border-border bg-muted/20 p-4 xl:overflow-y-auto xl:border-l xl:border-t-0">
                                <div className="sticky top-0 space-y-3">
                                    <div>
                                        <p className="text-sm font-black text-foreground">
                                            Live Preview
                                        </p>

                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Preview executes without saving the card.
                                        </p>
                                    </div>

                                    {customDashboardBuilderLoading ? (
                                        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-border bg-card">
                                            <Loader2
                                                size={26}
                                                className="animate-spin text-primary"
                                            />
                                        </div>
                                    ) : !customDashboardPreview ? (
                                        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-border bg-card p-5">
                                            <div className="text-center">
                                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <Eye
                                                        size={
                                                            22
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-3 text-sm font-black text-foreground">
                                                    Preview your card
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Configure the card and click Preview.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <CustomDashboardCard
                                            card={
                                                customDashboardPreview
                                            }
                                        />
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={
                                                handlePreview
                                            }
                                            disabled={
                                                customDashboardPreviewLoading
                                            }
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {customDashboardPreviewLoading ? (
                                                <Loader2
                                                    size={
                                                        15
                                                    }
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Eye
                                                    size={
                                                        15
                                                    }
                                                />
                                            )}
                                            Preview
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleSave
                                            }
                                            disabled={
                                                customDashboardCreateLoading
                                            }
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {customDashboardCreateLoading ? (
                                                <Loader2
                                                    size={
                                                        15
                                                    }
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Save
                                                    size={
                                                        15
                                                    }
                                                />
                                            )}
                                            Save Card
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default CustomDashboardView;
