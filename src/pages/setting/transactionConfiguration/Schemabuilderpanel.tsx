import { Edit } from "lucide-react";
import type { ModuleSchemaData, SchemaField, SchemaSection } from "./Types";
import { BooleanBadge, Panel } from "../components/Configui";
import { isTruthyFlag, SCHEMA_SECTIONS } from "./Constants";
import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import SearchInput from "../../../components/searchInput";
import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";



type SchemaBuilderPanelProps = {
    title: string;
    description: string;
    badgeText?: string;
    schemaData: ModuleSchemaData | null;
    schemaSection: SchemaSection;
    onChangeSchemaSection: (section: SchemaSection) => void;
    fields: SchemaField[];
    totalFieldCount: number;
    schemaSearch: string;
    onChangeSchemaSearch: (value: string) => void;
    schemaLoading: boolean;
    schemaRefreshing: boolean;
    onRefresh: () => void;
    onAddField: () => void;
    onEditField: (field: SchemaField) => void;
};

const schemaColumns = [
    { key: "key", title: "Key", render: (f: SchemaField) => <span>{f.key}</span> },
    { key: "label", title: "Label", render: (f: SchemaField) => f.label || "—" },
    { key: "type", title: "Type", render: (f: SchemaField) => f.type || "—" },
    { key: "reference", title: "Reference", render: (f: SchemaField) => f.ref || "—" },
    {
        key: "isRequired",
        title: "Required",
        render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isRequired)} />,
    },
    {
        key: "isSearchable",
        title: "Searchable",
        render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isSearchable)} />,
    },
    {
        key: "isFilterable",
        title: "Filterable",
        render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isFilterable)} />,
    },
    {
        key: "isReadonly",
        title: "Readonly",
        render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isReadonly)} />,
    },
    {
        key: "isHidden",
        title: "Hidden",
        render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isHidden)} />,
    },
];

/**
 * Fully generic — everything it needs (section, fields, callbacks) comes in
 * as props, so the exact same component renders a fixed-transaction schema
 * or a custom-module schema. Parent owns the "which module am I looking at"
 * question via `schemaContext` and just re-mounts/re-fetches on change.
 */
const SchemaBuilderPanel = ({
    title,
    description,
    badgeText,
    schemaData,
    schemaSection,
    onChangeSchemaSection,
    fields,
    totalFieldCount,
    schemaSearch,
    onChangeSchemaSearch,
    schemaLoading,
    schemaRefreshing,
    onRefresh,
    onAddField,
    onEditField,
}: SchemaBuilderPanelProps) => {
    return (
        <Panel
            title={title}
            description={description}
            right={
                <div className="flex flex-wrap items-center gap-2">
                    {badgeText ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {badgeText}
                        </span>
                    ) : null}

                    {schemaData?.module?.schemaSource ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                            {schemaData.module.schemaSource} module
                        </span>
                    ) : null}

                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {totalFieldCount} Total Fields
                    </span>

                    <DataREfreshButton callBackFn={onRefresh} loading={schemaRefreshing} />

                    <DataCreateButton callBackFn={onAddField} text=" Add Field" />
                </div>
            }
        >
            {/* Header / Body / Footer section tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border p-4">
                {SCHEMA_SECTIONS.map((section) => {
                    const isActive = schemaSection === section.key;

                    return (
                        <button
                            key={section.key}
                            type="button"
                            onClick={() => onChangeSchemaSection(section.key)}
                            className={`inline-flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-semibold transition ${
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            {section.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 border-b border-border py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput search={schemaSearch} setSearch={onChangeSchemaSearch} />
                <Badge
                    count={fields.length}
                    text={`${SCHEMA_SECTIONS.find((s) => s.key === schemaSection)?.label} Fields:`}
                    varient="primary"
                />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={schemaColumns}
                    data={fields}
                    loading={!!schemaLoading}
                    emptyMessage={`No ${schemaSection} fields found. Click Add Field to create the first one.`}
                    actions={(field: SchemaField) => (
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => onEditField(field)}
                                disabled={isTruthyFlag(field.isDefault)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                                title={field.isSystemGenerated ? "System-generated field" : "Edit schema field"}
                            >
                                <Edit size={16} />
                            </button>
                        </div>
                    )}
                />
            </div>
        </Panel>
    );
};

export default SchemaBuilderPanel;