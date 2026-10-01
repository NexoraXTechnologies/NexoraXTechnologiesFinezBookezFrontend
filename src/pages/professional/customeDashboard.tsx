import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCustomDashboardPreview, createCustomDashboardCard, fetchCustomDashboardBuilderOptions, fetchCustomDashboardCards, fetchCustomDashboardFields, fetchCustomDashboardModules, previewCustomDashboardCard } from "../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice";
import { EmptyData, pageAnimation } from "./ProfessionalDashboard";
import { Eye, LayoutDashboard, Loader2, Plus, Save, X } from "lucide-react";
import { CHART_COLORS, CompactWidgetCard } from "../../components/dashboardComp";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
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


const normalizeTableRows = (result: any) => {
    if (Array.isArray(result?.rows)) return result.rows;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.values)) {
        return result.values.map((item: any) => {
            if (item && typeof item === "object" && !Array.isArray(item)) return item;
            return { value: item };
        });
    }
    return [];
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
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[48px] bg-primary/5" />
                <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                                {card?.cardName}
                            </p>
                            <p className="mt-1 text-[10px] font-bold text-primary">{moduleLabel}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
                            Number
                        </span>
                    </div>
                    <p className="mt-5 text-3xl font-black tracking-tight text-foreground">
                        {formatCustomDashboardValue(result?.value, displayConfig)}
                    </p>
                    {card?.description && (
                        <p className="mt-2 line-clamp-2 text-xs font-semibold text-muted-foreground">
                            {card.description}
                        </p>
                    )}
                </div>
            </div>
        );
    }
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
    if (card?.cardType === "table") {
        const rows = normalizeTableRows(result);
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return (
            <CompactWidgetCard title={card?.cardName || "Table"} accent="sales">
                {!rows.length ? (
                    <EmptyData />
                ) : (
                    <div className="max-h-[320px] overflow-auto rounded-xl border border-border">
                        <table className="w-full min-w-[600px] border-collapse text-left">
                            <thead className="sticky top-0 z-10 bg-muted">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row: any, index: number) => (
                                    <tr key={index} className="border-t border-border hover:bg-muted/30">
                                        {columns.map((column) => (
                                            <td
                                                key={column}
                                                className="px-3 py-2 text-xs font-semibold text-foreground"
                                            >
                                                {typeof row[column] === "object"
                                                    ? JSON.stringify(row[column])
                                                    : String(row[column] ?? "-")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
        field: "",
        groupByField: "",
        aggregateOperation: "count",
        aggregateField: "",
        format: "number",
        currency: "INR",
        prefix: "",
        decimalPlaces: 0,
    });

    const cardTypes = useMemo(
        () =>
            normalizeApiArray(customDashboardBuilderOptions, [
                "cardTypes",
                "dashboardCardTypes",
            ]),
        [customDashboardBuilderOptions]
    );
    const dataSources = useMemo(
        () =>
            normalizeApiArray(customDashboardBuilderOptions, [
                "dataSources",
                "dashboardDataSources",
            ]),
        [customDashboardBuilderOptions]
    );
    const operations = useMemo(
        () =>
            normalizeApiArray(customDashboardBuilderOptions, [
                "operations",
                "dashboardOperations",
            ]),
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
            if (form.field) {
                setForm((previous) => ({ ...previous, field: "" }));
            }
            return;
        }
        if (!fieldsForOperation.length) return;
        const valid = fieldsForOperation.some((item: any) => item?.field === form.field);
        if (!valid) {
            setForm((previous) => ({
                ...previous,
                field: fieldsForOperation[0]?.field || "",
            }));
        }
    }, [fieldsForOperation, form.operation, form.field]);

    useEffect(() => {
        if (form.operation !== "groupBy") return;
        if (!groupableFields.length) return;
        const valid = groupableFields.some((item: any) => item?.field === form.groupByField);
        if (!valid) {
            setForm((previous) => ({
                ...previous,
                groupByField: groupableFields[0]?.field || "",
            }));
        }
    }, [groupableFields, form.operation, form.groupByField]);

    useEffect(() => {
        if (form.operation !== "groupBy" || form.aggregateOperation === "count") return;
        if (!aggregateFields.length) return;
        const valid = aggregateFields.some((item: any) => item?.field === form.aggregateField);
        if (!valid) {
            setForm((previous) => ({
                ...previous,
                aggregateField: aggregateFields[0]?.field || "",
            }));
        }
    }, [aggregateFields, form.operation, form.aggregateOperation, form.aggregateField]);

    const updateForm = (key: string, value: any) => {
        setForm((previous) => ({ ...previous, [key]: value }));
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
        const firstOperator = Array.isArray(firstField?.operators) && firstField.operators.length
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

    const updateFilter = (index: number, key: string, value: any) => {
        setFilters((previous) =>
            previous.map((item, itemIndex) => {
                if (itemIndex !== index) return item;
                if (key === "field") {
                    const fieldConfig = getFieldByName(filterableFields, value);
                    const operator = Array.isArray(fieldConfig?.operators) && fieldConfig.operators.length
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
                return { ...item, [key]: value };
            })
        );
    };

    const removeFilter = (index: number) => {
        setFilters((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    };

    const castFilterValue = (value: any, fieldConfig: any) => {
        if (fieldConfig?.type === "number") {
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : value;
        }
        if (fieldConfig?.type === "boolean") {
            return String(value).toLowerCase() === "true";
        }
        return value;
    };

    const normalizeFiltersForPayload = () => {
        return filters.map((filter: any) => {
            const fieldConfig = getFieldByName(fields, filter.field);
            if (!filter.field || !filter.operator) {
                throw new Error("Complete all filter fields before previewing.");
            }
            if (filter.operator === "between") {
                if (filter.value === "" || filter.value2 === "") {
                    throw new Error(`Both values are required for ${fieldConfig?.label || filter.field}.`);
                }
                return {
                    field: filter.field,
                    operator: filter.operator,
                    value: [
                        castFilterValue(filter.value, fieldConfig),
                        castFilterValue(filter.value2, fieldConfig),
                    ],
                };
            }
            if (["in", "notIn"].includes(filter.operator)) {
                const values = String(filter.value || "")
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) => castFilterValue(item, fieldConfig));
                if (!values.length) {
                    throw new Error(`Enter at least one value for ${fieldConfig?.label || filter.field}.`);
                }
                return {
                    field: filter.field,
                    operator: filter.operator,
                    value: values,
                };
            }
            if (filter.value === "") {
                throw new Error(`Value is required for ${fieldConfig?.label || filter.field}.`);
            }
            return {
                field: filter.field,
                operator: filter.operator,
                value: castFilterValue(filter.value, fieldConfig),
            };
        });
    };

    const buildPayload = () => {
        if (!form.cardName.trim()) throw new Error("Card name is required.");
        if (!form.module) throw new Error("Module is required.");
        const queryConfig: any = {
            operation: form.operation,
            filters: normalizeFiltersForPayload(),
        };
        if (form.operation !== "count") {
            if (!form.field) throw new Error("Field is required for selected operation.");
            queryConfig.field = form.field;
        }
        if (form.operation === "groupBy") {
            if (!form.groupByField) throw new Error("Group By field is required.");
            queryConfig.groupByField = form.groupByField;
            queryConfig.aggregate = {
                operation: form.aggregateOperation,
            };
            if (form.aggregateOperation !== "count") {
                if (!form.aggregateField) throw new Error("Aggregate field is required.");
                queryConfig.aggregate.field = form.aggregateField;
            }
        }
        return {
            cardName: form.cardName.trim(),
            description: form.description.trim(),
            cardType: form.cardType,
            dataSource: {
                sourceType: form.sourceType,
                module: form.module,
            },
            queryConfig,
            displayConfig: {
                format: form.format,
                currency: form.currency,
                prefix: form.prefix,
                decimalPlaces: Number(form.decimalPlaces || 0),
            },
            layout: {
                x: 0,
                y: 0,
                w: form.cardType === "stat" ? 3 : 6,
                h: form.cardType === "stat" ? 2 : 4,
            },
        };
    };

    const handlePreview = async () => {
        try {
            setLocalError("");
            const payload = buildPayload();
            const action = await dispatch(previewCustomDashboardCard(payload) as any);
            if (previewCustomDashboardCard.rejected.match(action)) {
                //@ts-ignore
                setLocalError(action?.payload?.message || "Preview failed.");
            }
        } catch (error: any) {
            setLocalError(error?.message || "Invalid card configuration.");
        }
    };

    const handleSave = async () => {
        try {
            setLocalError("");
            const payload = buildPayload();
            const action = await dispatch(createCustomDashboardCard(payload) as any);
            if (createCustomDashboardCard.fulfilled.match(action)) {
                await dispatch(
                    fetchCustomDashboardCards({
                        offset: 0,
                        limit: 100,
                    }) as any
                );
                closeBuilder();
                return;
            }
            setLocalError(action?.payload?.message || "Failed to save dashboard card.");
        } catch (error: any) {
            setLocalError(error?.message || "Failed to save dashboard card.");
        }
    };

    const renderFilterValueInput = (filter: any, index: number) => {
        const fieldConfig = getFieldByName(fields, filter.field);
        const inputType = fieldConfig?.type === "number"
            ? "number"
            : fieldConfig?.type === "date"
                ? "date"
                : "text";
        if (filter.operator === "between") {
            return (
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type={inputType}
                        value={filter.value}
                        onChange={(event) => updateFilter(index, "value", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        placeholder="From"
                    />
                    <input
                        type={inputType}
                        value={filter.value2}
                        onChange={(event) => updateFilter(index, "value2", event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        placeholder="To"
                    />
                </div>
            );
        }
        if (fieldConfig?.type === "boolean") {
            return (
                <select
                    value={filter.value}
                    onChange={(event) => updateFilter(index, "value", event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                    <option value="">Select value</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }
        return (
            <input
                type={inputType}
                value={filter.value}
                onChange={(event) => updateFilter(index, "value", event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={["in", "notIn"].includes(filter.operator) ? "Value 1, Value 2, Value 3" : "Enter value"}
            />
        );
    };

    const fallbackCardTypes = [
        { label: "Number Card", value: "stat" },
        { label: "Table", value: "table" },
        { label: "Bar Chart", value: "barChart" },
        { label: "Line Chart", value: "lineChart" },
        { label: "Pie Chart", value: "pieChart" },
    ];
    const fallbackOperations = ["count", "sum", "avg", "min", "max", "list", "groupBy"];
    const displayedCardTypes = cardTypes.length ? cardTypes : fallbackCardTypes;
    const displayedDataSources = dataSources.length
        ? dataSources
        : [{ label: "BookEZ", value: "mongo" }];
    const displayedOperations = operations.length ? operations : fallbackOperations;
    const totalCustomCards = Array.isArray(customDashboardCards)
        ? customDashboardCards.length
        : 0;

    return (
        <motion.div
            key="custom-dashboard"
            variants={pageAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
        >
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <LayoutDashboard size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-foreground">Custom Dashboard</h1>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                                    {totalCustomCards} {totalCustomCards === 1 ? "Card" : "Cards"}
                                </span>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm font-semibold leading-5 text-muted-foreground">
                                Build the dashboard you need from live BookEZ data and save each view as a reusable card.
                            </p>
                        </div>
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
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
                    <div className="text-center">
                        <Loader2 size={30} className="mx-auto animate-spin text-primary" />
                        <p className="mt-3 text-sm font-bold text-muted-foreground">Loading custom dashboard...</p>
                    </div>
                </div>
            ) : customDashboardError && !customDashboardCards?.length ? (
                <div className="rounded-2xl border border-danger/30 bg-card p-6 text-center text-sm font-bold text-danger">
                    {customDashboardError}
                </div>
            ) : !customDashboardCards?.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <LayoutDashboard size={28} />
                    </div>
                    <h2 className="mt-4 text-lg font-black text-foreground">No custom cards yet</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-muted-foreground">
                        Create your first card and choose exactly which BookEZ data you want to see.
                    </p>
                    <button
                        type="button"
                        onClick={openBuilder}
                        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground"
                    >
                        <Plus size={16} />
                        Create First Card
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {customDashboardCards.map((card: any) => (
                        <CustomDashboardCard key={card?.cardCode || card?._id} card={card} />
                    ))}
                </div>
            )}

            {showBuilder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm md:p-5">
                    <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Add Custom Card</h2>
                                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                        Choose your data, configure the result, preview it and then save.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeBuilder}
                                className="cursor-pointer rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] xl:overflow-hidden">
                            <div className="space-y-5 p-5 xl:overflow-y-auto">
                                <section className="rounded-2xl border border-border bg-card p-4">
                                    <div className="mb-4">
                                        <p className="text-sm font-black text-foreground">1. Card Details</p>
                                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                            Give the card a clear name and choose how it should appear.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Card Name *</label>
                                            <input
                                                value={form.cardName}
                                                onChange={(event) => updateForm("cardName", event.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                placeholder="Customer Wise Sales"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Description</label>
                                            <input
                                                value={form.description}
                                                onChange={(event) => updateForm("description", event.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                placeholder="Optional description"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                        {displayedCardTypes.map((item: any) => {
                                            const value = getBuilderOptionValue(item);
                                            const active = form.cardType === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => updateForm("cardType", value)}
                                                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-black transition ${active
                                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                                        }`}
                                                >
                                                    {getBuilderOptionLabel(item)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-border bg-card p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-foreground">2. Data Selection</p>
                                            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                                Module and fields are loaded directly from your dashboard APIs.
                                            </p>
                                        </div>
                                        {(customDashboardModulesLoading || customDashboardFieldsLoading) && (
                                            <Loader2 size={18} className="animate-spin text-primary" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Data Source</label>
                                            <select
                                                value={form.sourceType}
                                                onChange={(event) => handleSourceTypeChange(event.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                            >
                                                {displayedDataSources.map((item: any) => (
                                                    <option key={getBuilderOptionValue(item)} value={getBuilderOptionValue(item)}>
                                                        {getBuilderOptionLabel(item)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Module *</label>
                                            <select
                                                value={form.module}
                                                onChange={(event) => handleModuleChange(event.target.value)}
                                                disabled={customDashboardModulesLoading || !modules.length}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {!modules.length && <option value="">No modules available</option>}
                                                {modules.map((item: any) => (
                                                    <option key={getBuilderOptionValue(item)} value={getBuilderOptionValue(item)}>
                                                        {getBuilderOptionLabel(item)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Operation *</label>
                                            <select
                                                value={form.operation}
                                                onChange={(event) => {
                                                    updateForm("operation", event.target.value);
                                                    dispatch(clearCustomDashboardPreview());
                                                }}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                            >
                                                {displayedOperations.map((item: any) => (
                                                    <option key={getBuilderOptionValue(item)} value={getBuilderOptionValue(item)}>
                                                        {getBuilderOptionLabel(item)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {form.operation !== "count" && (
                                            <div>
                                                <label className="mb-1.5 block text-xs font-black text-foreground">Field *</label>
                                                <select
                                                    value={form.field}
                                                    onChange={(event) => updateForm("field", event.target.value)}
                                                    disabled={customDashboardFieldsLoading || !fieldsForOperation.length}
                                                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {!fieldsForOperation.length && <option value="">No fields available</option>}
                                                    {fieldsForOperation.map((item: any) => (
                                                        <option key={item.field} value={item.field}>
                                                            {item.label || item.field}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {form.operation === "groupBy" && (
                                        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                            <p className="mb-3 text-xs font-black uppercase tracking-wide text-primary">
                                                Group Configuration
                                            </p>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-black text-foreground">Group By Field</label>
                                                    <select
                                                        value={form.groupByField}
                                                        onChange={(event) => updateForm("groupByField", event.target.value)}
                                                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary"
                                                    >
                                                        {!groupableFields.length && <option value="">No groupable fields</option>}
                                                        {groupableFields.map((item: any) => (
                                                            <option key={item.field} value={item.field}>
                                                                {item.label || item.field}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-black text-foreground">Aggregate Operation</label>
                                                    <select
                                                        value={form.aggregateOperation}
                                                        onChange={(event) => updateForm("aggregateOperation", event.target.value)}
                                                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary"
                                                    >
                                                        <option value="count">Count</option>
                                                        <option value="sum">Sum</option>
                                                        <option value="avg">Average</option>
                                                        <option value="min">Minimum</option>
                                                        <option value="max">Maximum</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-black text-foreground">Aggregate Field</label>
                                                    <select
                                                        value={form.aggregateField}
                                                        onChange={(event) => updateForm("aggregateField", event.target.value)}
                                                        disabled={form.aggregateOperation === "count" || !aggregateFields.length}
                                                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {form.aggregateOperation === "count" ? (
                                                            <option value="">Not required for count</option>
                                                        ) : !aggregateFields.length ? (
                                                            <option value="">No aggregate fields</option>
                                                        ) : (
                                                            aggregateFields.map((item: any) => (
                                                                <option key={item.field} value={item.field}>
                                                                    {item.label || item.field}
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-border bg-card p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-black text-foreground">3. Filters</p>
                                            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                                Add optional conditions using only the operators allowed by each field.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addFilter}
                                            disabled={!filterableFields.length}
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Plus size={14} />
                                            Add Filter
                                        </button>
                                    </div>
                                    {!filters.length ? (
                                        <div className="mt-4 rounded-xl border border-dashed border-border bg-background/50 px-4 py-5 text-center text-xs font-bold text-muted-foreground">
                                            No filters added. The card will use all matching records.
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {filters.map((filter: any, index: number) => {
                                                const fieldConfig = getFieldByName(fields, filter.field);
                                                const availableOperators = Array.isArray(fieldConfig?.operators)
                                                    ? fieldConfig.operators
                                                    : [];
                                                return (
                                                    <div
                                                        key={index}
                                                        className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-background p-3 md:grid-cols-[1fr_160px_1fr_auto] md:items-center"
                                                    >
                                                        <select
                                                            value={filter.field}
                                                            onChange={(event) => updateFilter(index, "field", event.target.value)}
                                                            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
                                                        >
                                                            {filterableFields.map((item: any) => (
                                                                <option key={item.field} value={item.field}>
                                                                    {item.label || item.field}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={filter.operator}
                                                            onChange={(event) => updateFilter(index, "operator", event.target.value)}
                                                            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
                                                        >
                                                            {availableOperators.map((operator: string) => (
                                                                <option key={operator} value={operator}>
                                                                    {operator}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {renderFilterValueInput(filter, index)}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFilter(index)}
                                                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-danger/20 bg-danger/5 text-danger transition hover:bg-danger/10"
                                                            title="Remove filter"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-border bg-card p-4">
                                    <div className="mb-4">
                                        <p className="text-sm font-black text-foreground">4. Display Format</p>
                                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                            Control how numeric values are displayed in the card.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Format</label>
                                            <select
                                                value={form.format}
                                                onChange={(event) => updateForm("format", event.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-primary"
                                            >
                                                <option value="number">Number</option>
                                                <option value="currency">Currency</option>
                                                <option value="percentage">Percentage</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Currency</label>
                                            <input
                                                value={form.currency}
                                                onChange={(event) => updateForm("currency", event.target.value)}
                                                disabled={form.format !== "currency"}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
                                                placeholder="INR"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Prefix</label>
                                            <input
                                                value={form.prefix}
                                                onChange={(event) => updateForm("prefix", event.target.value)}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                                                placeholder="₹"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-black text-foreground">Decimal Places</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={form.decimalPlaces}
                                                onChange={(event) => updateForm("decimalPlaces", Number(event.target.value))}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {(localError || customDashboardError) && (
                                    <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-xs font-bold text-danger">
                                        {localError || customDashboardError}
                                    </div>
                                )}
                            </div>

                            <aside className="border-t border-border bg-muted/20 p-5 xl:overflow-y-auto xl:border-l xl:border-t-0">
                                <div className="sticky top-0 space-y-4">
                                    <div>
                                        <p className="text-sm font-black text-foreground">Live Preview</p>
                                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                            Preview executes the current configuration without saving it.
                                        </p>
                                    </div>
                                    {customDashboardBuilderLoading ? (
                                        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
                                            <Loader2 size={28} className="animate-spin text-primary" />
                                        </div>
                                    ) : !customDashboardPreview ? (
                                        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6">
                                            <div className="text-center">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                    <Eye size={24} />
                                                </div>
                                                <p className="mt-4 text-sm font-black text-foreground">Preview your card</p>
                                                <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
                                                    Select the module, field and operation, then click Preview.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <CustomDashboardCard card={customDashboardPreview} />
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={handlePreview}
                                            disabled={customDashboardPreviewLoading}
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {customDashboardPreviewLoading ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                            Preview
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={customDashboardCreateLoading}
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {customDashboardCreateLoading ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Save size={16} />
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