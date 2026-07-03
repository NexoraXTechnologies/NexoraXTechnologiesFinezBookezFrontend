import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import {
    BarChart3,
    Database,
    Eye,
    Filter,
    ListChecks,
    Loader2,
    MessageSquareText,
    Phone,
    ShieldCheck,
    X,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion"
import {
    requestDbAccess,
    getDbAccessRequests,
    getDbAccessRequestById,
} from "../../../redux/slices/userExplorer";

import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";
import SearchInput from "../../../components/searchInput";
import Pagination from "../../../components/pagination";
import { DataREfreshButton } from "../../../components/buttons";

import { getProfessionalUser } from "../../../redux/slices/professionalSlice/professionalUserSlice";

import Tabs from "./tabs";
import { getAreaDashboard } from "../../../redux/slices/professionalSlice/dashboard/registerDashboard";
import { SelectInput } from "../../../components/inputs";
import {
    getCitiesByState,
    getStates,
} from "../../../redux/slices/professionalSlice/stateCitySlice";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const UserExplorer = ({ onAccessSuccess }: any) => {
    const dispatch = useDispatch<any>();

    const {
        requestLoading,
        accessRequestsLoading,
        accessRequests,
        accessRequestsPagination,
    } = useSelector((state: any) => state.dbAccess);

    const { registerDashboardData, registerDashboardLoading } = useSelector(
        (state: any) => state.registerDashboard
    );

    const { states = [] } = useSelector((state: any) => state.stateCity || {});

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [activePageTab, setActivePageTab] = useState("listing");

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);
    const [showDashboardFilter, setShowDashboardFilter] = useState(false);

    const [selectedStateCities, setSelectedStateCities] = useState<any[]>([]);

    const [dashboardFilters, setDashboardFilters] = useState<any>({
        dbNumbers: [],
        cities: [],
        states: [],
        period: "",
    });

    const [form, setForm] = useState({
        parentMobileNumber: "",
        requestMessage: "Need DB access for support and troubleshooting.",
    });

    const [errors, setErrors] = useState<any>({});

    const dashboardFilterRef = useRef<HTMLDivElement | null>(null);

    const requestTableData = Array.isArray(accessRequests)
        ? accessRequests
        : accessRequests?.records && Array.isArray(accessRequests.records)
            ? accessRequests.records
            : accessRequests?.requests && Array.isArray(accessRequests.requests)
                ? accessRequests.requests
                : [];

    const totalRequests =
        accessRequestsPagination?.totalDocs ?? requestTableData.length ?? 0;

    const getFullName = (row: any) => {
        return (
            [row?.firstName, row?.middleName, row?.lastName]
                .filter(Boolean)
                .join(" ") || "-"
        );
    };

    const resetForm = () => {
        setForm({
            parentMobileNumber: "",
            requestMessage: "Need DB access for support and troubleshooting.",
        });
        setErrors({});
    };

    const openRequestModal = () => {
        resetForm();
        setShowRequestModal(true);
    };

    const closeRequestModal = () => {
        setShowRequestModal(false);
        resetForm();
    };

    const handleChange = (key: string, value: string) => {
        if (key === "parentMobileNumber") {
            value = value.replace(/\D/g, "").slice(0, 10);
        }

        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!form.parentMobileNumber) {
            newErrors.parentMobileNumber = "Mobile number is required";
        } else if (form.parentMobileNumber.length !== 10) {
            newErrors.parentMobileNumber = "Enter valid 10 digit mobile number";
        }

        if (!form.requestMessage.trim()) {
            newErrors.requestMessage = "Request message is required";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const fetchDbAccessRequests = async () => {
        await dispatch(
            getDbAccessRequests({
                offset: localOffset,
                limit: localLimit,
                status: "ACCEPTED",
                search: debouncedSearch,
            }) as any
        );
    };

    const fetchDbAccessRequestsWithParams = async ({
        offset = localOffset,
        limit = localLimit,
        searchValue = debouncedSearch,
    }: any = {}) => {
        await dispatch(
            getDbAccessRequests({
                offset,
                limit,
                status: "ACCEPTED",
                search: searchValue,
            }) as any
        );
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const userRes = await dispatch(
                getProfessionalUser({
                    number: form.parentMobileNumber,
                }) as any
            ).unwrap();

            const users = userRes?.users || userRes?.user || userRes || {};

            const listRes = await dispatch(
                getDbAccessRequests({
                    offset: 0,
                    limit: 100,
                    status: "ACCEPTED",
                    search: "",
                }) as any
            ).unwrap();

            const requestList =
                listRes?.records ||
                listRes?.requests ||
                listRes?.accessRequests ||
                [];

            const alreadyExists = requestList?.some((item: any) => {
                return (
                    String(item?.parentMobileNumber) ===
                    String(form.parentMobileNumber)
                );
            });

            if (alreadyExists) {
                toast.warning(
                    "Access request already exists for this mobile number"
                );

                setSearch(form.parentMobileNumber);
                setDebouncedSearch(form.parentMobileNumber);
                setLocalOffset(0);
                setActivePageTab("listing");

                await fetchDbAccessRequestsWithParams({
                    offset: 0,
                    limit: localLimit,
                    searchValue: form.parentMobileNumber,
                });

                closeRequestModal();
                return;
            }

            const res = await dispatch(
                requestDbAccess({
                    parentMobileNumber: form.parentMobileNumber,
                    requestMessage: form.requestMessage,
                    firstName: users?.userFirstName || users?.firstName || "",
                    middleName:
                        users?.userMiddleName || users?.middleName || "",
                    lastName: users?.userLastName || users?.lastName || "",
                    userEmail: users?.userEmail || users?.email || "",
                    userAddress: users?.userAddress || users?.address || "",
                    authTokenDigest: users?.authTokenDigest || "",
                    state: userRes?.users?.state,
                    city: userRes?.users?.city,
                } as any)
            ).unwrap();

            toast.success(
                res?.message || "Database access request sent successfully"
            );

            setSearch(form.parentMobileNumber);
            setDebouncedSearch(form.parentMobileNumber);
            setLocalOffset(0);
            setActivePageTab("listing");

            await fetchDbAccessRequestsWithParams({
                offset: 0,
                limit: localLimit,
                searchValue: form.parentMobileNumber,
            });

            closeRequestModal();

            if (onAccessSuccess) {
                onAccessSuccess(form.parentMobileNumber);
            }
        } catch (err: any) {
            if (err?.status === 409) {
                toast.warning(err?.message || "Access request already exists");

                setSearch(form.parentMobileNumber);
                setDebouncedSearch(form.parentMobileNumber);
                setLocalOffset(0);
                setActivePageTab("listing");

                await fetchDbAccessRequestsWithParams({
                    offset: 0,
                    limit: localLimit,
                    searchValue: form.parentMobileNumber,
                });

                closeRequestModal();
                return;
            }

            toast.error(
                err?.message ||
                err?.data?.message ||
                "Failed to request database access"
            );
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);

            await fetchDbAccessRequestsWithParams({
                offset: 0,
                limit: localLimit,
                searchValue: debouncedSearch,
            });

            setLocalOffset(0);
            toast.success("DB access request list refreshed");
        } catch (err: any) {
            toast.error(err?.message || "Refresh failed");
        } finally {
            setRefreshing(false);
        }
    };

    const handleViewRequest = (row: any) => {
        if (row?.status !== "ACCEPTED") {
            return toast.warn("Request not approved yet. Cannot view details.");
        }

        setSelectedRequest(row);
    };

    const multiValueToArray = (value: any) => {
        if (!Array.isArray(value)) return [];
        return value.map((item: any) => item.value).filter(Boolean);
    };

    const handleDashboardFilterChange = (key: string, value: any) => {
        setDashboardFilters((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const fetchAreaDashboard = async () => {
        try {
            await dispatch(
                getAreaDashboard({
                    dbNumbers: multiValueToArray(dashboardFilters.dbNumbers),
                    cities: multiValueToArray(dashboardFilters.cities),
                    states: multiValueToArray(dashboardFilters.states),
                    period: dashboardFilters.period,
                    modules: [],
                }) as any
            ).unwrap();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.data?.message ||
                "Failed to fetch area dashboard"
            );
        }
    };

    const clearDashboardFilters = () => {
        setDashboardFilters({
            dbNumbers: [],
            cities: [],
            states: [],
            period: "",
        });

        setSelectedStateCities([]);
    };

    const handleStateChange = async (value: any) => {
        const selectedStates = value || [];

        handleDashboardFilterChange("states", selectedStates);
        handleDashboardFilterChange("cities", []);
        setSelectedStateCities([]);

        const stateCodes = selectedStates
            .map((item: any) => item?.stateCode)
            .filter(Boolean);

        if (!stateCodes.length) return;

        try {
            let allCities: any[] = [];

            for (const stateCode of stateCodes) {
                const res = await dispatch(
                    getCitiesByState({ stateCode }) as any
                ).unwrap();

                const cityList =
                    res?.cities || res?.data || res?.records || res || [];

                if (Array.isArray(cityList)) {
                    allCities = [...allCities, ...cityList];
                }
            }

            const uniqueCities = Array.from(
                new Map(
                    allCities.map((city: any) => {
                        const cityName =
                            city?.name?.en ||
                            city?.cityName ||
                            city?.name ||
                            city?.label ||
                            city?.city ||
                            "";

                        return [cityName, city];
                    })
                ).values()
            ).filter((city: any) => {
                return (
                    city?.name?.en ||
                    city?.cityName ||
                    city?.name ||
                    city?.label ||
                    city?.city
                );
            });

            setSelectedStateCities(uniqueCities);
        } catch (err: any) {
            toast.error(
                err?.message || err?.data?.message || "Failed to fetch cities"
            );
        }
    };

    const pageTabs = [
        {
            key: "listing",
            label: "Listing",
            icon: <ListChecks size={16} />,
        },
        {
            key: "dashboard",
            label: "Dashboard",
            icon: <BarChart3 size={16} />,
        },
    ];

    const requestColumns = [
        {
            key: "requestId",
            title: "Request ID",
            render: (row: any) => (
                <span className="font-semibold text-card-foreground">
                    {row?.requestId || "-"}
                </span>
            ),
        },
        {
            key: "parentMobileNumber",
            title: "Mobile",
        },
        {
            key: "name",
            title: "Name",
            render: (row: any) => (
                <span className="font-semibold text-card-foreground">
                    {getFullName(row)}
                </span>
            ),
        },
        {
            key: "requestMessage",
            title: "Request Message",
            type: "readMoreText",
            render: (row: any) => (
                <span className="text-muted-foreground">
                    {row?.requestMessage || "-"}
                </span>
            ),
        },
        {
            key: "userEmail",
            title: "Email",
            render: (row: any) => row?.userEmail || "-",
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => {
                const status = row?.status || "PENDING";

                return (
                    <span
                        className={`
                            rounded px-3 py-1 text-xs font-bold uppercase
                            ${status === "ACCEPTED"
                                ? "bg-success/10 text-success"
                                : status === "REJECTED"
                                    ? "bg-danger/10 text-danger"
                                    : "bg-muted text-muted-foreground"
                            }
                        `}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            key: "createdOn",
            title: "Requested At",
            type: "date",
        },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!showDashboardFilter) return;

            const target = event.target as HTMLElement;

            if (
                target.closest(".dashboard-select__menu") ||
                target.closest(".dashboard-select__option") ||
                target.closest(".dashboard-select__control")
            ) {
                return;
            }

            if (
                dashboardFilterRef.current &&
                !dashboardFilterRef.current.contains(target)
            ) {
                setShowDashboardFilter(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDashboardFilter]);

    useEffect(() => {
        if (selectedRequest) return;

        fetchDbAccessRequests();
    }, [localOffset, localLimit, debouncedSearch, selectedRequest]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!selectedRequest?.requestId) return;

        dispatch(
            getDbAccessRequestById({
                requestId: selectedRequest.requestId,
            }) as any
        )
            .unwrap()
            .catch((err: any) => {
                toast.error(
                    err?.message ||
                    err?.data?.message ||
                    "Failed to fetch request details"
                );
            });
    }, [selectedRequest?.requestId, dispatch]);

    useEffect(() => {
        if (activePageTab !== "dashboard") return;

        dispatch(getStates() as any);
        fetchAreaDashboard();
    }, [activePageTab]);

    const dbNumberOptions = requestTableData
        ?.map((item: any) => ({
            label: `${item?.parentMobileNumber || "-"} ${getFullName(item) !== "-" ? `- ${getFullName(item)}` : ""
                }`,
            value: item?.parentMobileNumber,
        }))
        ?.filter((item: any) => item?.value);

    const uniqueDbNumberOptions: any = Array.from(
        new Map(dbNumberOptions.map((item: any) => [item.value, item])).values()
    );

    const stateOptions = Array.isArray(states)
        ? states.map((item: any) => ({
            label: item?.name?.en || "-",
            value: item?.name?.en || "",
            stateCode: item?.isoCode || "",
        }))
        : [];

    const cityOptions = Array.isArray(selectedStateCities)
        ? selectedStateCities.map((item: any) => ({
            label: item?.name?.en || item?.label || item?.city || "-",
            value: item?.name?.en || item?.value || item?.city || "",
        }))
        : [];

    const periodOptions = [
        { label: "Today", value: "today" },
        { label: "Yesterday", value: "yesterday" },
        { label: "This Week", value: "this_week" },
        { label: "Last Week", value: "last_week" },
        { label: "This Month", value: "this_month" },
        { label: "Last Month", value: "last_month" },
        { label: "This Year", value: "this_year" },
        { label: "Last Year", value: "last_year" },
    ];

    const disabled = false;

    const reactSelectStyles: any = useMemo(
        () => ({
            control: (base: any, state: any) => ({
                ...base,
                minHeight: "32px",
                height: "32px",
                borderRadius: "0.2rem",
                borderColor: state.isFocused
                    ? "var(--primary)"
                    : "var(--border)",
                boxShadow: state.isFocused
                    ? "0 0 0 1px var(--primary)"
                    : "none",
                backgroundColor: disabled ? "var(--muted)" : "var(--input)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 200ms",
                opacity: disabled ? 0.7 : 1,
                "&:hover": {
                    borderColor: "var(--primary)",
                },
            }),

            valueContainer: (base: any) => ({
                ...base,
                minHeight: "30px",
                height: "30px",
                padding: "0 8px",
                flexWrap: "nowrap",
                overflowX: "auto",
                overflowY: "hidden",
            }),

            input: (base: any) => ({
                ...base,
                margin: 0,
                padding: 0,
                color: "var(--foreground)",
                fontSize: "14px",
            }),

            singleValue: (base: any) => ({
                ...base,
                color: "var(--foreground)",
                fontSize: "14px",
            }),

            placeholder: (base: any) => ({
                ...base,
                color: "var(--muted-foreground)",
                fontSize: "14px",
            }),

            indicatorsContainer: (base: any) => ({
                ...base,
                height: "30px",
            }),

            dropdownIndicator: (base: any) => ({
                ...base,
                padding: "4px",
                color: "var(--muted-foreground)",
                "&:hover": {
                    color: "var(--primary)",
                },
            }),

            clearIndicator: (base: any) => ({
                ...base,
                padding: "4px",
                color: "var(--muted-foreground)",
                "&:hover": {
                    color: "var(--danger)",
                },
            }),

            indicatorSeparator: () => ({
                display: "none",
            }),

            menu: (base: any) => ({
                ...base,
                zIndex: 9999,
                fontSize: "14px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                overflow: "hidden",
            }),

            menuList: (base: any) => ({
                ...base,
                backgroundColor: "var(--card)",
                padding: "4px",
                maxHeight: "280px",
                overflowY: "auto",
            }),

            menuPortal: (base: any) => ({
                ...base,
                zIndex: 9999,
            }),

            option: (base: any, state: any) => ({
                ...base,
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                cursor: "pointer",
                borderRadius: "0.25rem",
                backgroundColor: state.isSelected
                    ? "var(--primary)"
                    : state.isFocused
                        ? "var(--muted)"
                        : "var(--card)",
                color: state.isSelected
                    ? "var(--primary-foreground)"
                    : "var(--card-foreground)",
                "&:active": {
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                },
            }),

            noOptionsMessage: (base: any) => ({
                ...base,
                color: "var(--muted-foreground)",
                fontSize: "14px",
            }),

            multiValue: (base: any) => ({
                ...base,
                height: "22px",
                minHeight: "22px",
                borderRadius: "0.2rem",
                backgroundColor: "var(--primary)",
                margin: "2px",
            }),

            multiValueLabel: (base: any) => ({
                ...base,
                padding: "2px 6px",
                color: "var(--primary-foreground)",
                fontSize: "12px",
                fontWeight: 700,
            }),

            multiValueRemove: (base: any) => ({
                ...base,
                color: "var(--primary-foreground)",
                cursor: "pointer",
                borderRadius: "0 0.2rem 0.2rem 0",
                "&:hover": {
                    backgroundColor: "var(--danger)",
                    color: "var(--danger-foreground)",
                },
            }),
        }),
        [disabled]
    );

    const dashboardData = registerDashboardData || {};

    const moduleLabelMap: any = {
        salesQuotation: "Sales Quotation",
        salesOrder: "Sales Order",
        salesInvoice: "Sales Invoice",
        salesInvoiceReturn: "Sales Return",
        receipt: "Receipt",
        purchaseOrder: "Purchase Order",
        grn: "GRN",
        purchaseInvoice: "Purchase Invoice",
        purchaseReturn: "Purchase Return",
        payment: "Payment",
    };

    const formatAmount = (value: any) => {
        const amount = Number(value || 0);

        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        }

        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        }

        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(2)}K`;
        }

        return `₹${amount}`;
    };

    const formatFullAmount = (value: any) => {
        return Number(value || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });
    };

    const moduleSummaryData = Object.entries(moduleLabelMap)
        .map(([key, label]: any) => {
            const item = dashboardData?.[key];

            return {
                key,
                module: label,
                count: Number(item?.totalCount || 0),
                amount: Number(item?.totalAmount || 0),
                records: Array.isArray(item?.details)
                    ? item.details.length
                    : 0,
                details: Array.isArray(item?.details) ? item.details : [],
            };
        })
        .filter((item: any) => item.count > 0 || item.amount > 0);

    const totalBusinesses = Number(dashboardData?.totalBusinesses || 0);

    const totalTransactions = moduleSummaryData.reduce(
        (sum: number, item: any) => sum + Number(item.count || 0),
        0
    );

    const totalAmount = moduleSummaryData.reduce(
        (sum: number, item: any) => sum + Number(item.amount || 0),
        0
    );

    const topAmountModule = [...moduleSummaryData].sort(
        (a: any, b: any) => Number(b.amount || 0) - Number(a.amount || 0)
    )?.[0];
    
    const pieColors = [
        "var(--primary, #4f46e5)",
        "var(--success, #16a34a)",
        "var(--warning, #f59e0b)",
        "var(--danger, #dc2626)",
        "var(--info, #0ea5e9)",
        "var(--secondary, #64748b)",
        "#8b5cf6",
        "#06b6d4",
        "#f97316",
        "#22c55e",
    ];

    if (selectedRequest) {
        return <Tabs {...{ selectedRequest, setSelectedRequest }} />;
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        visible: (index: number) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                delay: index * 0.06,
                duration: 0.35,
                ease: "easeOut",
            },
        }),
    };

    const chartVariants = {
        hidden: { opacity: 0, y: 14 },
        visible: (index: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: index * 0.08,
                duration: 0.4,
                ease: "easeOut",
            },
        }),
    };

    const summaryCards = [
        {
            title: "Businesses",
            value: totalBusinesses,
            helper: "Total active businesses",
            badge: "Count",
            icon: <Database size={17} />,
        },
        {
            title: "Transactions",
            value: totalTransactions,
            helper: "Total entries across all modules",
            badge: "Count",
            icon: <ListChecks size={17} />,
        },
        {
            title: "Total Value",
            value: formatFullAmount(totalAmount),
            helper: "Combined amount of all modules",
            badge: "Amount",
            icon: <BarChart3 size={17} />,
        },
        {
            title: "Highest Value Module",
            value: topAmountModule?.module || "-",
            helper: topAmountModule?.amount
                ? `Amount: ${formatFullAmount(topAmountModule?.amount)}`
                : "No module data found",
            badge: "Top Amount",
            icon: <ShieldCheck size={17} />,
        },
    ];
    return (
        <div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
            {/* ================= PAGE TABS ================= */}
            <div className="mb-4 flex w-full items-center gap-2 rounded border border-border bg-background/70 p-2">
                {pageTabs.map((tab: any) => {
                    const isActive = activePageTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActivePageTab(tab.key)}
                            className={`
                                flex cursor-pointer items-center gap-2 rounded px-4 py-2 text-sm font-bold transition
                                ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ================= LISTING TAB ================= */}
            {activePageTab === "listing" && (
                <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-start gap-3">
                            <Badge
                                {...{
                                    count: totalRequests,
                                    text: "Total Requests:",
                                }}
                            />
                        </div>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            {/* <SearchInput {...{ search, setSearch }} /> */}

                            <DataREfreshButton
                                {...{
                                    callBackFn: handleRefresh,
                                    loading: refreshing,
                                }}
                            />

                            <button
                                type="button"
                                onClick={openRequestModal}
                                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                            >
                                <ShieldCheck size={16} />
                                Request Access
                            </button>
                        </div>
                    </div>

                    <DataTable
                        columns={requestColumns}
                        data={requestTableData}
                        loading={accessRequestsLoading}
                        emptyMessage="No DB access request found"
                        actions={(row: any) => (
                            <div className="flex items-center gap-2">
                                <button
                                    id="user-explorer-view-button"
                                    onClick={() => handleViewRequest(row)}
                                    className="cursor-pointer rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        )}
                    />

                    {accessRequestsPagination?.totalDocs > 0 && (
                        <Pagination
                            {...{
                                localLimit,
                                selectCb: (e: any) => {
                                    setLocalLimit(Number(e.target.value));
                                    setLocalOffset(0);
                                },
                                preDisabled:
                                    !accessRequestsPagination?.hasPrevPage,
                                nextDisabled:
                                    !accessRequestsPagination?.hasNextPage,
                                setLocalOffset,
                                pagination: accessRequestsPagination,
                            }}
                        />
                    )}
                </>
            )}

            {/* ================= DASHBOARD TAB ================= */}
            {activePageTab === "dashboard" && (
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
                    <div
                        ref={dashboardFilterRef}
                        className="relative rounded border border-border bg-background/70 p-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-black text-card-foreground">
                                    Dashboard
                                </h2>

                                <p className="text-xs font-medium text-muted-foreground">
                                    View analytics by DB number, city, state and
                                    period.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDashboardFilter((prev) => !prev)
                                    }
                                    className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-card px-4 text-xs font-black text-card-foreground transition hover:bg-muted"
                                >
                                    <Filter size={14} />
                                    Filter
                                </button>

                                <button
                                    type="button"
                                    onClick={fetchAreaDashboard}
                                    disabled={registerDashboardLoading}
                                    className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded bg-primary px-4 text-xs font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {registerDashboardLoading ? (
                                        <>
                                            <Loader2
                                                size={15}
                                                className="animate-spin"
                                            />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 size={15} />
                                            Refresh
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {showDashboardFilter && (
                            <div className="absolute right-4 top-[72px] z-50 w-[min(720px,calc(100vw-2rem))] rounded border border-border bg-card p-4 shadow-2xl">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-black text-card-foreground">
                                            Dashboard Filters
                                        </h3>

                                        <p className="text-xs font-medium text-muted-foreground">
                                            Select filters and apply.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDashboardFilter(false)
                                        }
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-muted"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-card-foreground">
                                            States
                                        </label>

                                        <Select
                                            isMulti
                                            classNamePrefix="dashboard-select"
                                            isDisabled={disabled}
                                            value={dashboardFilters.states}
                                            onChange={handleStateChange}
                                            options={stateOptions}
                                            placeholder="Select States"
                                            styles={reactSelectStyles}
                                            closeMenuOnSelect={false}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-card-foreground">
                                            Cities
                                        </label>

                                        <Select
                                            isMulti
                                            classNamePrefix="dashboard-select"
                                            isDisabled={disabled}
                                            value={dashboardFilters.cities}
                                            onChange={(value: any) =>
                                                handleDashboardFilterChange(
                                                    "cities",
                                                    value || []
                                                )
                                            }
                                            options={cityOptions}
                                            placeholder="Select Cities"
                                            styles={reactSelectStyles}
                                            closeMenuOnSelect={false}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-card-foreground">
                                            DB Numbers
                                        </label>

                                        <Select
                                            isMulti
                                            classNamePrefix="dashboard-select"
                                            isDisabled={disabled}
                                            value={dashboardFilters.dbNumbers}
                                            onChange={(value: any) =>
                                                handleDashboardFilterChange(
                                                    "dbNumbers",
                                                    value || []
                                                )
                                            }
                                            options={uniqueDbNumberOptions}
                                            placeholder="Select DB Numbers"
                                            styles={reactSelectStyles}
                                            closeMenuOnSelect={false}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    </div>

                                    <SelectInput
                                        label="Period"
                                        value={dashboardFilters.period}
                                        placeholder="Select Period"
                                        onChange={(e: any) =>
                                            handleDashboardFilterChange(
                                                "period",
                                                e?.target?.value
                                            )
                                        }
                                        options={periodOptions}
                                    />
                                </div>

                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={clearDashboardFilters}
                                        disabled={registerDashboardLoading}
                                        className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-card px-4 text-xs font-black text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <X size={14} />
                                        Clear
                                    </button>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await fetchAreaDashboard();
                                            setShowDashboardFilter(false);
                                        }}
                                        disabled={registerDashboardLoading}
                                        className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded bg-primary px-4 text-xs font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {registerDashboardLoading ? (
                                            <>
                                                <Loader2
                                                    size={15}
                                                    className="animate-spin"
                                                />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <BarChart3 size={15} />
                                                Apply
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {registerDashboardLoading ? (
                        <div className="flex h-40 items-center justify-center gap-2 rounded border border-border bg-background text-sm font-bold text-muted-foreground">
                            <Loader2 size={18} className="animate-spin" />
                            Loading dashboard...
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {/* ================= COMPACT SUMMARY CARDS ================= */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    {summaryCards.map((card: any, index: number) => (
                                        <motion.div
                                            key={card.title}
                                            custom={index}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            whileHover={{
                                                y: -3,
                                                scale: 1.015,
                                                transition: { duration: 0.2 },
                                            }}
                                            className="group relative overflow-hidden rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                                        >
                                            <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-all duration-300 group-hover:bg-primary/10" />

                                            <div className="relative flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                                                            {card.title}
                                                        </p>

                                                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                                                            {card.badge}
                                                        </span>
                                                    </div>

                                                    <h2 className="truncate text-xl font-black text-card-foreground">
                                                        {card.value}
                                                    </h2>

                                                    <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                                                        {card.helper}
                                                    </p>
                                                </div>

                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                                                    {card.icon}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                            {/* ================= AMOUNT / COUNT CHARTS ================= */}
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                <motion.div
                                    custom={0}
                                    variants={chartVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{ y: -2 }}
                                    className="rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-black text-card-foreground">
                                                Module-wise Amount
                                            </h2>

                                            <p className="text-xs font-medium text-muted-foreground">
                                                Total amount by module.
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <BarChart3 size={16} />
                                        </div>
                                    </div>

                                    <div className="h-[285px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={moduleSummaryData}>
                                                <CartesianGrid strokeDasharray="3 3" />

                                                <XAxis
                                                    dataKey="module"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                    angle={-25}
                                                    textAnchor="end"
                                                    height={75}
                                                />

                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(value: any) => formatAmount(value)}
                                                />

                                                <Tooltip
                                                    formatter={(value: any) => [
                                                        formatFullAmount(value),
                                                        "Amount",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="amount"
                                                    name="Amount"
                                                    radius={[6, 6, 0, 0]}
                                                    fill="var(--primary)"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                <motion.div
                                    custom={1}
                                    variants={chartVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{ y: -2 }}
                                    className="rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-black text-card-foreground">
                                                Module-wise Count
                                            </h2>

                                            <p className="text-xs font-medium text-muted-foreground">
                                                Total records by module.
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                                            <ListChecks size={16} />
                                        </div>
                                    </div>

                                    <div className="h-[285px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={moduleSummaryData}>
                                                <CartesianGrid strokeDasharray="3 3" />

                                                <XAxis
                                                    dataKey="module"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                    angle={-25}
                                                    textAnchor="end"
                                                    height={75}
                                                />

                                                <YAxis tick={{ fontSize: 10 }} />

                                                <Tooltip
                                                    formatter={(value: any) => [
                                                        Number(value || 0),
                                                        "Count",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="count"
                                                    name="Count"
                                                    radius={[6, 6, 0, 0]}
                                                    fill="var(--success)"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            </div>

                            {/* ================= MODULE SUMMARY + PIE ================= */}
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                                <motion.div
                                    custom={2}
                                    variants={chartVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{ y: -2 }}
                                    className="rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md xl:col-span-2"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-black text-card-foreground">
                                                Module Summary
                                            </h2>

                                            <p className="text-xs font-medium text-muted-foreground">
                                                Count, records and amount summary by module.
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <BarChart3 size={16} />
                                        </div>
                                    </div>

                                    <div className="h-[315px] w-full rounded-lg border border-border bg-card p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={moduleSummaryData}>
                                                <CartesianGrid strokeDasharray="3 3" />

                                                <XAxis
                                                    dataKey="module"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                    angle={-25}
                                                    textAnchor="end"
                                                    height={80}
                                                />

                                                <YAxis
                                                    yAxisId="left"
                                                    tick={{ fontSize: 10 }}
                                                    allowDecimals={false}
                                                />

                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(value: any) => formatAmount(value)}
                                                />

                                                <Tooltip
                                                    formatter={(value: any, name: any) => {
                                                        if (name === "Amount") {
                                                            return [formatFullAmount(value), "Amount"];
                                                        }

                                                        return [Number(value || 0), name];
                                                    }}
                                                />

                                                <Legend wrapperStyle={{ fontSize: 11 }} />

                                                <Bar
                                                    yAxisId="left"
                                                    dataKey="count"
                                                    name="Count"
                                                    radius={[6, 6, 0, 0]}
                                                    fill="var(--primary)"
                                                />

                                                <Bar
                                                    yAxisId="left"
                                                    dataKey="records"
                                                    name="Records"
                                                    radius={[6, 6, 0, 0]}
                                                    fill="var(--success)"
                                                />

                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="amount"
                                                    name="Amount"
                                                    stroke="var(--danger)"
                                                    strokeWidth={3}
                                                    dot={{ r: 3 }}
                                                    activeDot={{ r: 5 }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                <motion.div
                                    custom={3}
                                    variants={chartVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{ y: -2 }}
                                    className="rounded-lg border border-border bg-background p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-black text-card-foreground">
                                                Amount Share
                                            </h2>

                                            <p className="text-xs font-medium text-muted-foreground">
                                                Module-wise amount distribution.
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Database size={16} />
                                        </div>
                                    </div>

                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={moduleSummaryData}
                                                    dataKey="amount"
                                                    nameKey="module"
                                                    innerRadius={48}
                                                    outerRadius={82}
                                                    paddingAngle={3}
                                                >
                                                    {moduleSummaryData.map((entry: any, index: number) => (
                                                        <Cell
                                                            key={`cell-${entry.key}`}
                                                            fill={pieColors[index % pieColors.length]}
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip
                                                    formatter={(value: any) => [
                                                        formatFullAmount(value),
                                                        "Amount",
                                                    ]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-2 flex flex-col gap-1.5">
                                        {moduleSummaryData.slice(0, 5).map((item: any, index: number) => (
                                            <motion.div
                                                key={item.key}
                                                initial={{ opacity: 0, x: 8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: 0.25 + index * 0.05,
                                                    duration: 0.25,
                                                }}
                                                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted/60"
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                pieColors[index % pieColors.length],
                                                        }}
                                                    />

                                                    <span className="truncate font-bold text-card-foreground">
                                                        {item.module}
                                                    </span>
                                                </div>

                                                <span className="shrink-0 font-black text-muted-foreground">
                                                    {formatAmount(item.amount)}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= REQUEST ACCESS MODAL ================= */}
            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Database size={22} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold">
                                        Request DB Access
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Enter user mobile number and request
                                        message.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeRequestModal}
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-card-foreground">
                                    Parent Mobile Number{" "}
                                    <span className="text-danger">*</span>
                                </label>

                                <div
                                    className={`flex items-center gap-3 rounded-lg border bg-input px-3 py-2.5 transition ${errors.parentMobileNumber
                                            ? "border-danger"
                                            : "border-border focus-within:border-primary"
                                        }`}
                                >
                                    <Phone
                                        size={18}
                                        className="text-muted-foreground"
                                    />

                                    <input
                                        type="text"
                                        value={form.parentMobileNumber}
                                        onChange={(e) =>
                                            handleChange(
                                                "parentMobileNumber",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter 10 digit mobile number"
                                        className="w-full bg-transparent text-sm font-medium text-card-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                </div>

                                {errors.parentMobileNumber && (
                                    <p className="text-xs font-medium text-danger">
                                        {errors.parentMobileNumber}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-card-foreground">
                                    Request Message{" "}
                                    <span className="text-danger">*</span>
                                </label>

                                <div
                                    className={`flex gap-3 rounded-lg border bg-input px-3 py-2.5 transition ${errors.requestMessage
                                            ? "border-danger"
                                            : "border-border focus-within:border-primary"
                                        }`}
                                >
                                    <MessageSquareText
                                        size={18}
                                        className="mt-0.5 text-muted-foreground"
                                    />

                                    <textarea
                                        value={form.requestMessage}
                                        onChange={(e) =>
                                            handleChange(
                                                "requestMessage",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter request message"
                                        rows={4}
                                        className="w-full resize-none bg-transparent text-sm font-medium text-card-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                </div>

                                {errors.requestMessage && (
                                    <p className="text-xs font-medium text-danger">
                                        {errors.requestMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeRequestModal}
                                disabled={requestLoading}
                                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={requestLoading}
                                onClick={handleSubmit}
                                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {requestLoading ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Requesting...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        Request Access
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserExplorer;