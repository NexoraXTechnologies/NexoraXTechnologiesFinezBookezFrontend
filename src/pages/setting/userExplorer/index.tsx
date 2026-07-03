import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Database,
    Eye,
    Loader2,
    MessageSquareText,
    Phone,
    ShieldCheck,
    X,
} from "lucide-react";
import { toast } from "react-toastify";

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

import {
    getProfessionalUser,
} from "../../../redux/slices/professionalSlice/professionalUserSlice";

import Tabs from "./tabs";

const UserExplorer = ({ onAccessSuccess }: any) => {
    const dispatch = useDispatch<any>();

    const {
        requestLoading,
        accessRequestsLoading,
        accessRequests,
        accessRequestsPagination,
    } = useSelector((state: any) => state.dbAccess);

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const [form, setForm] = useState({
        parentMobileNumber: "",
        requestMessage: "Need DB access for support and troubleshooting.",
    });

    const [errors, setErrors] = useState<any>({});

    const requestTableData = Array.isArray(accessRequests)
        ? accessRequests
        : accessRequests?.records && Array.isArray(accessRequests.records)
            ? accessRequests.records
            : accessRequests?.requests && Array.isArray(accessRequests.requests)
                ? accessRequests.requests
                : [];

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
                    middleName: users?.userMiddleName || users?.middleName || "",
                    lastName: users?.userLastName || users?.lastName || "",
                    userEmail: users?.userEmail || users?.email || "",
                    userAddress: users?.userAddress || users?.address || "",
                    authTokenDigest: users?.authTokenDigest || "",
                } as any)
            ).unwrap();

            toast.success(
                res?.message || "Database access request sent successfully"
            );

            setSearch(form.parentMobileNumber);
            setDebouncedSearch(form.parentMobileNumber);
            setLocalOffset(0);

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

    if (selectedRequest) {
        return <Tabs {...{ selectedRequest, setSelectedRequest }} />;
    }

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            {/* ================= HEADER ================= */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-start gap-3">
                    <Badge
                        {...{
                            count:
                                accessRequestsPagination?.totalDocs ??
                                requestTableData.length ??
                                0,
                            text: "Total Requests:",
                        }}
                    />
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <button
                        type="button"
                        onClick={openRequestModal}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                    >
                        <ShieldCheck size={16} />
                        Request Access
                    </button>
                </div>
            </div>

            {/* ================= TABLE ================= */}
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

            {/* ================= PAGINATION ================= */}
            {accessRequestsPagination?.totalDocs > 0 && (
                <Pagination
                    {...{
                        localLimit,
                        selectCb: (e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        },
                        preDisabled: !accessRequestsPagination?.hasPrevPage,
                        nextDisabled: !accessRequestsPagination?.hasNextPage,
                        setLocalOffset,
                        pagination: accessRequestsPagination,
                    }}
                />
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
                                        Enter user mobile number and request message.
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