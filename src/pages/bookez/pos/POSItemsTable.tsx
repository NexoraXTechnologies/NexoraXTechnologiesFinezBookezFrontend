import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptText, PackageSearch } from "lucide-react";

const toNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
};

const formatIndianNumber = (value: any) => {
    const num = toNum(value);

    return num.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
};

const tableRowMotion:any = {
    hidden: {
        opacity: 0,
        y: 8,
        filter: "blur(3px)",
    },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
        },
    },
    exit: {
        opacity: 0,
        x: -12,
        filter: "blur(3px)",
        transition: {
            duration: 0.14,
        },
    },
};

const summaryMotion:any = {
    hidden: {
        opacity: 0,
        scale: 0.96,
        y: 8,
    },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 22,
        },
    },
};

const POSItemsTable = ({ items = [] }: any) => {
    const gstLabel = (item: any) => {
        const cgst = toNum(item?.cgstPercent ?? item?.cgst);
        const sgst = toNum(item?.sgstPercent ?? item?.sgst);
        const igst = toNum(item?.igstPercent ?? item?.igst);

        if (igst > 0) return `IGST ${igst}%`;
        if (cgst > 0 || sgst > 0) return `CGST ${cgst}% + SGST ${sgst}%`;

        return "—";
    };

    const totals = useMemo(() => {
        const totalQty = items.reduce(
            (sum: number, item: any) => sum + toNum(item?.quantity ?? item?.qty),
            0
        );

        const totalGross = items.reduce(
            (sum: number, item: any) => sum + toNum(item?.gross),
            0
        );

        const totalDiscount = items.reduce(
            (sum: number, item: any) =>
                sum + toNum(item?.discountAmount ?? item?.discount),
            0
        );

        const totalTax = items.reduce(
            (sum: number, item: any) => sum + toNum(item?.taxAmount),
            0
        );

        const grandTotal = items.reduce(
            (sum: number, item: any) => sum + toNum(item?.netAmount ?? item?.net),
            0
        );

        const taxableBase = Math.max(0, totalGross - totalDiscount);

        const discountPct =
            totalGross > 0 ? (totalDiscount / totalGross) * 100 : 0;

        const taxPct = taxableBase > 0 ? (totalTax / taxableBase) * 100 : 0;

        return {
            totalQty,
            totalGross,
            totalDiscount,
            totalTax,
            grandTotal,
            discountPct,
            taxPct,
        };
    }, [items]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-border bg-gradient-to-r from-card to-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ReceiptText size={19} />
                    </div>

                    <div>
                        <h2 className="text-base font-black text-card-foreground">
                            Bill Items
                        </h2>
                        <p className="text-xs font-bold text-muted-foreground">
                            Review selected POS products before payment
                        </p>
                    </div>
                </div>

                <motion.div
                    key={items.length}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-md bg-muted px-3 py-1.5 text-right"
                >
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        Items
                    </p>
                    <p className="text-sm font-black text-foreground">
                        {items.length}
                    </p>
                </motion.div>
            </div>

            {/* Table */}
            <div className="max-h-[390px] overflow-auto">
                <table className="w-full min-w-[920px] text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                        <tr className="border-b border-border">
                            <th className="w-[46px] px-3 py-2.5 text-left text-[11px] font-black uppercase text-muted-foreground">
                                #
                            </th>

                            <th className="px-3 py-2.5 text-left text-[11px] font-black uppercase text-muted-foreground">
                                Item
                            </th>

                            <th className="px-3 py-2.5 text-left text-[11px] font-black uppercase text-muted-foreground">
                                HSN
                            </th>

                            <th className="px-3 py-2.5 text-right text-[11px] font-black uppercase text-muted-foreground">
                                Qty
                            </th>

                            <th className="px-3 py-2.5 text-left text-[11px] font-black uppercase text-muted-foreground">
                                Unit
                            </th>

                            <th className="px-3 py-2.5 text-right text-[11px] font-black uppercase text-muted-foreground">
                                Rate
                            </th>

                            <th className="px-3 py-2.5 text-right text-[11px] font-black uppercase text-muted-foreground">
                                Discount
                            </th>

                            <th className="px-3 py-2.5 text-left text-[11px] font-black uppercase text-muted-foreground">
                                GST
                            </th>

                            <th className="px-3 py-2.5 text-right text-[11px] font-black uppercase text-muted-foreground">
                                Amount
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <AnimatePresence initial={false}>
                            {items.length ? (
                                items.map((item: any, index: number) => {
                                    const qty = toNum(item?.quantity ?? item?.qty);
                                    const uom = String(item?.uomLabel || item?.uom || "-");
                                    const rate = toNum(item?.rate ?? item?.basePrice);
                                    const discount = toNum(
                                        item?.discountAmount ?? item?.discount
                                    );
                                    const net = toNum(item?.netAmount ?? item?.net);

                                    return (
                                        <motion.tr
                                            layout
                                            key={item?.id || item?.productCode || index}
                                            
                                            variants={tableRowMotion}
                                            initial="hidden"
                                            animate="show"
                                            exit="exit"
                                            className="border-b border-border transition hover:bg-muted/70"
                                        >
                                            <td className="px-3 py-2.5 font-bold text-muted-foreground">
                                                {index + 1}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <p className="max-w-[240px] truncate font-black text-card-foreground">
                                                    {item?.productName || item?.name || ""}
                                                </p>

                                                <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                                                    {item?.productCode || item?.code || ""}
                                                </p>
                                            </td>

                                            <td className="px-3 py-2.5 font-bold text-card-foreground">
                                                {item?.productHSNCode || item?.hsnCode || "-"}
                                            </td>

                                            <td className="px-3 py-2.5 text-right font-black text-foreground">
                                                {formatIndianNumber(qty)}
                                            </td>

                                            <td className="px-3 py-2.5 font-bold text-card-foreground">
                                                {uom}
                                            </td>

                                            <td className="px-3 py-2.5 text-right font-black text-foreground">
                                                ₹ {formatIndianNumber(rate)}
                                            </td>

                                            <td className="px-3 py-2.5 text-right font-black text-success">
                                                ₹ {formatIndianNumber(discount)}
                                            </td>

                                            <td className="px-3 py-2.5 font-bold text-card-foreground">
                                                <span className="rounded-md bg-muted px-2 py-1 text-xs font-black text-muted-foreground">
                                                    {gstLabel(item)}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2.5 text-right font-black text-foreground">
                                                ₹ {formatIndianNumber(net)}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <td colSpan={9} className="px-3 py-16 text-center">
                                        <div className="mx-auto flex max-w-[260px] flex-col items-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-8">
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 2.4,
                                                    ease: "easeInOut",
                                                }}
                                            >
                                                <PackageSearch
                                                    size={36}
                                                    className="mb-3 text-muted-foreground"
                                                />
                                            </motion.div>

                                            <p className="text-sm font-black text-foreground">
                                                No items added
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-muted-foreground">
                                                Add products from POS menu
                                            </p>
                                        </div>
                                    </td>
                                </motion.tr>
                            )}
                        </AnimatePresence>

                        {items.length ? (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-muted/80"
                            >
                                <td className="px-3 py-3" />

                                <td className="px-3 py-3 font-black text-card-foreground">
                                    Total
                                </td>

                                <td className="px-3 py-3" />

                                <td className="px-3 py-3 text-right font-black text-foreground">
                                    {formatIndianNumber(totals.totalQty)}
                                </td>

                                <td className="px-3 py-3" />
                                <td className="px-3 py-3" />
                                <td className="px-3 py-3" />
                                <td className="px-3 py-3" />

                                <td className="px-3 py-3 text-right font-black text-foreground">
                                    ₹ {formatIndianNumber(totals.grandTotal)}
                                </td>
                            </motion.tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            {/* Summary Cards */}
            <motion.div
                variants={{
                    hidden: {},
                    show: {
                        transition: {
                            staggerChildren: 0.06,
                        },
                    },
                }}
                initial="hidden"
                animate="show"
                className="grid gap-2 border-t border-border bg-card p-3 text-sm sm:grid-cols-4"
            >
                <motion.div
                    variants={summaryMotion}
                    className="rounded-md border border-border bg-muted/70 p-3"
                >
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        Gross
                    </p>
                    <p className="mt-1 text-sm font-black text-foreground">
                        ₹ {formatIndianNumber(totals.totalGross)}
                    </p>
                </motion.div>

                <motion.div
                    variants={summaryMotion}
                    className="rounded-md border border-border bg-muted/70 p-3"
                >
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        Discount
                    </p>
                    <p className="mt-1 text-sm font-black text-success">
                        ₹ {formatIndianNumber(totals.totalDiscount)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                        {totals.discountPct.toFixed(2)}%
                    </p>
                </motion.div>

                <motion.div
                    variants={summaryMotion}
                    className="rounded-md border border-border bg-muted/70 p-3"
                >
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        Tax
                    </p>
                    <p className="mt-1 text-sm font-black text-foreground">
                        ₹ {formatIndianNumber(totals.totalTax)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                        {totals.taxPct.toFixed(2)}%
                    </p>
                </motion.div>

                <motion.div
                    variants={summaryMotion}
                    className="relative overflow-hidden rounded-md bg-primary p-3 text-primary-foreground shadow-md shadow-primary/20"
                >
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary-foreground/10" />

                    <p className="relative text-xs font-black uppercase text-primary-foreground/60">
                        Total
                    </p>

                    <p className="relative mt-1 text-sm font-black">
                        ₹ {formatIndianNumber(totals.grandTotal)}
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default POSItemsTable;