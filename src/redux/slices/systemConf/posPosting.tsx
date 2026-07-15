import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Banknote, Building2, CheckCircle2, Landmark, Loader2, RefreshCw, ShoppingCart, WalletCards } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SelectInput } from "../../../components/inputs";
import { clearPosPostingError, getAllPosPostings, getPosPostingAccountOptions, saveOrUpdatePosPostingAccount } from "../../../redux/slices/systemConf";

type PosPostingKey = "sales" | "cash" | "upi";
type AccountRecord = { accountCode?: string; accountName?: string;[key: string]: any };
type DropdownOption = { label: string; value: string; raw: AccountRecord };

type SavedAccountCardProps = {
    title: string;
    icon: ReactNode;
    account?: AccountRecord | null;
    saving: boolean;
};

const ACCOUNT_MASTER_ROUTE = "/bookEz/account-master";

const fadeUp: any = {
    hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 260, damping: 24 },
    },
};

const modalMotion: any = {
    hidden: { opacity: 0, scale: 0.94, y: 14, filter: "blur(5px)" },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 280, damping: 24 },
    },
    exit: { opacity: 0, scale: 0.94, y: 10, filter: "blur(4px)", transition: { duration: 0.16 } },
};

const getErrorMessage = (error: any, fallback: string) => error?.message || error?.data?.message || error?.payload?.message || fallback;

const accountDisplayName = (account?: AccountRecord | null): string => {
    if (!account) {
        return "";
    }
    const accountName = String(account?.accountName || "").trim();
    const accountCode = String(account?.accountCode || "").trim();
    if (accountName && accountCode) {
        return `${accountName} (${accountCode})`;
    }
    return accountName || accountCode;
};

const mapAccountsToOptions = (accounts: AccountRecord[] = []): DropdownOption[] =>
    (Array.isArray(accounts) ? accounts : [])
        .filter((account) => account?.accountCode)
        .map((account) => ({
            label: accountDisplayName(account) || String(account.accountCode),
            value: String(account.accountCode),
            raw: account,
        }));

const SavedAccountCard = ({ title, icon, account, saving }: SavedAccountCardProps) => {
    const configured = !!account?.accountCode;
    return (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-md border border-border bg-muted p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-primary">{icon}</span>

                {saving ? <Loader2 size={16} className="animate-spin text-primary" /> : configured ? <CheckCircle2 size={16} className="text-success" /> : <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
            </div>

            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>

            <p className="mt-1 truncate text-sm font-semibold text-card-foreground" title={accountDisplayName(account) || "Not configured"}>
                {accountDisplayName(account) || "Not configured"}
            </p>

            <p className={`mt-1 text-[11px] font-medium ${configured ? "text-success" : "text-warning"}`}>{saving ? "Saving..." : configured ? "Configured" : "Required"}</p>
        </motion.div>
    );
};

const PosPosting = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const { posPosting, posAccountOptions, posPostingLoading, posAccountsLoading, posPostingSaveLoading, posPostingSavingKey, posPostingError } = useSelector((state: any) => state.systemConfiguration);
    const [selectedSales, setSelectedSales] = useState("");
    const [selectedCash, setSelectedCash] = useState("");
    const [selectedUpi, setSelectedUpi] = useState("");
    const isLoading = posPostingLoading || posAccountsLoading || posPostingSaveLoading;
    const loaderMessage = posPostingSaveLoading ? "Saving POS posting configuration..." : posAccountsLoading ? "Loading account masters..." : posPostingLoading ? "Loading POS posting configuration..." : "Please wait...";
    const salesOptions = useMemo(() => mapAccountsToOptions(posAccountOptions?.sales || []), [posAccountOptions?.sales]);
    const cashOptions = useMemo(() => mapAccountsToOptions(posAccountOptions?.cash || []), [posAccountOptions?.cash]);
    const bankOptions = useMemo(() => mapAccountsToOptions(posAccountOptions?.bank || []), [posAccountOptions?.bank]);
    const loadPosPosting = useCallback(
        async (showSuccess = false) => {
            try {
                await Promise.all([dispatch(getAllPosPostings({ offset: 0, limit: 100 })).unwrap(), dispatch(getPosPostingAccountOptions()).unwrap()]);
                if (showSuccess) {
                    toast.success("POS posting configuration refreshed");
                }
            } catch (error: any) {
                toast.error(getErrorMessage(error, "Failed to load POS posting configuration"));
                dispatch(clearPosPostingError());
            }
        },
        [dispatch]
    );
    useEffect(() => {
        loadPosPosting();
        return () => {
            dispatch(clearPosPostingError());
        };
    }, [dispatch, loadPosPosting]);
    useEffect(() => {
        if (!posPostingError) {
            return;
        }
        toast.error(posPostingError);
        dispatch(clearPosPostingError());
    }, [posPostingError, dispatch]);
    useEffect(() => {
        setSelectedSales(posPosting?.sales?.accountCode || "");
        setSelectedCash(posPosting?.cash?.accountCode || "");
        setSelectedUpi(posPosting?.upi?.accountCode || "");
    }, [posPosting]);
    const saveAccount = useCallback(
        async (key: PosPostingKey, account: AccountRecord) => {
            const nextCode = String(account?.accountCode || "");
            if (!nextCode) {
                toast.error("Please select a valid account");
                return;
            }
            const previousValue = key === "sales" ? selectedSales : key === "cash" ? selectedCash : selectedUpi;
            if (key === "sales") {
                setSelectedSales(nextCode);
            }
            if (key === "cash") {
                setSelectedCash(nextCode);
            }
            if (key === "upi") {
                setSelectedUpi(nextCode);
            }
            try {
                const result = await dispatch(saveOrUpdatePosPostingAccount({ key, account })).unwrap();
                toast.success(result?.message || "POS posting updated successfully");
            } catch (error: any) {
                if (key === "sales") {
                    setSelectedSales(previousValue);
                }
                if (key === "cash") {
                    setSelectedCash(previousValue);
                }
                if (key === "upi") {
                    setSelectedUpi(previousValue);
                }
                toast.error(getErrorMessage(error, "Failed to save POS posting"));
                dispatch(clearPosPostingError());
            }
        },
        [dispatch, selectedSales, selectedCash, selectedUpi]
    );
    const selectAccountByValue = useCallback(
        (key: PosPostingKey, value: string, options: DropdownOption[]) => {
            if (!value) {
                return;
            }
            const selectedOption = options.find((option) => String(option?.value || "") === String(value));
            if (!selectedOption?.raw) {
                toast.error("Please select a valid account");
                return;
            }
            saveAccount(key, selectedOption.raw);
        },
        [saveAccount]
    );
    const configuredCount = [posPosting?.sales?.accountCode, posPosting?.cash?.accountCode, posPosting?.upi?.accountCode].filter(Boolean).length;
    const accountOptionsMissing = !salesOptions.length || !cashOptions.length || !bankOptions.length;
    const controlsDisabled = posPostingLoading || posAccountsLoading || posPostingSaveLoading;
    const openAccountMaster = () => navigate(ACCOUNT_MASTER_ROUTE);
    return (
        <div className="bg-background p-3 text-foreground">
            <AnimatePresence>
                {isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <motion.div
                            variants={modalMotion}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="w-full max-w-[360px] rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-2xl"
                        >
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Loader2 size={26} className="animate-spin" />
                            </div>

                            <p className="text-sm font-semibold text-card-foreground">{loaderMessage}</p>

                            <p className="mt-1 text-xs font-normal text-muted-foreground">Do not close or refresh this page</p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="space-y-3">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-start gap-2.5">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-card-foreground transition hover:bg-muted"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-base font-semibold text-card-foreground">POS Posting</h1>

                                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">BookEZ POS</span>
                            </div>

                            <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">Configure ledger accounts used while posting POS sales and collections.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-md flex items-center border border-border bg-muted px-3 py-2 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Configured</p>

                            <p className={`text-sm font-semibold ms-2 ${configuredCount === 3 ? "text-success" : "text-warning"}`}>{configuredCount}/3</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-30 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Building2 size={20} />
                        </div>

                        <div>
                            <p className="text-base font-semibold text-card-foreground">Account Mapping</p>

                            <p className="text-xs font-normal text-muted-foreground">Select accounts used while posting POS vouchers.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <SelectInput
                            label="Sales Account"
                            name="salesAccount"
                            value={selectedSales}
                            placeholder="Select sales account"
                            options={salesOptions}
                            mandatory
                            largeData
                            batchSize={100}
                            disabled={controlsDisabled}
                            onChange={(event: any) => {
                                const value = String(event?.target?.value || "");
                                selectAccountByValue("sales", value, salesOptions);
                            }}
                        />

                        <SelectInput
                            label="Cash Account"
                            name="cashAccount"
                            value={selectedCash}
                            placeholder="Select cash account"
                            options={cashOptions}
                            mandatory
                            largeData
                            batchSize={100}
                            disabled={controlsDisabled}
                            onChange={(event: any) => {
                                const value = String(event?.target?.value || "");
                                selectAccountByValue("cash", value, cashOptions);
                            }}
                        />

                        <SelectInput
                            label="Bank / UPI Account"
                            name="upiAccount"
                            value={selectedUpi}
                            placeholder="Select bank or UPI account"
                            options={bankOptions}
                            mandatory
                            largeData
                            batchSize={100}
                            disabled={controlsDisabled}
                            onChange={(event: any) => {
                                const value = String(event?.target?.value || "");
                                selectAccountByValue("upi", value, bankOptions);
                            }}
                        />
                    </div>

                    {accountOptionsMissing ? (
                        <div className="mt-3 flex flex-col gap-3 rounded-md border border-warning/20 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={17} className="mt-0.5 shrink-0 text-warning" />

                                <div>
                                    <p className="text-sm font-medium text-card-foreground">Required account master is missing</p>

                                    <p className="mt-1 text-xs font-normal text-muted-foreground">Create the missing sales, cash or bank account before completing POS posting configuration.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={openAccountMaster}
                                className="flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                Open Account Master
                            </button>
                        </div>
                    ) : null}
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <WalletCards size={20} />
                        </div>

                        <div>
                            <p className="text-base font-semibold text-card-foreground">Saved POS Accounts</p>

                            <p className="text-xs font-normal text-muted-foreground">Current ledger accounts stored in POS posting configuration.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <SavedAccountCard title="Sales Account" icon={<WalletCards size={17} />} account={posPosting?.sales} saving={posPostingSaveLoading && posPostingSavingKey === "sales"} />

                        <SavedAccountCard title="Cash Account" icon={<Banknote size={17} />} account={posPosting?.cash} saving={posPostingSaveLoading && posPostingSavingKey === "cash"} />

                        <SavedAccountCard title="Bank / UPI Account" icon={<Landmark size={17} />} account={posPosting?.upi} saving={posPostingSaveLoading && posPostingSavingKey === "upi"} />
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-xs font-normal text-muted-foreground">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-primary" />

                        <span>Every dropdown change automatically creates or updates the POS posting configuration.</span>
                    </div>

                    <div className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${configuredCount === 3 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {posPostingSaveLoading ? <Loader2 size={15} className="animate-spin" /> : configuredCount === 3 ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}

                        {posPostingSaveLoading ? "Saving configuration..." : configuredCount === 3 ? "POS posting is ready" : "Configuration incomplete"}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PosPosting;