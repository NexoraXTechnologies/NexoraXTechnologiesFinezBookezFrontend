import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    X,
    Upload,
    Plus,
    RefreshCcw,
    ShoppingCart,
    Pencil,
    Trash2,
    Minus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getPosProducts } from "../../../redux/slices/professionalSlice/pos";

const toNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
};

const sanitizeDecimal = (value: any) => {
    return String(value ?? "")
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
};

const formatIndianNumber = (value: any) => {
    const num = toNum(value);

    return num.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
};

/* No fade / no blur */
const fadeUp = {
    hidden: {},
    show: {},
};

const staggerContainer = {
    hidden: {},
    show: {},
};

const cardMotion:any = {
    hidden: {},
    show: {
        transition: {
            type: "spring",
            stiffness: 280,
            damping: 24,
        },
    },
    exit: {
        scale: 0.98,
        y: -4,
        transition: {
            duration: 0.12,
        },
    },
};

const modalBackdropMotion = {
    hidden: {
        opacity: 0,
    },
    show: {
        opacity: 1,
        transition: {
            duration: 0.18,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.16,
        },
    },
};

const productPreviewMotion:any = {
    hidden: {
        scale: 0.9,
        y: 28,
        opacity: 0,
    },
    show: {
        scale: 1,
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
        },
    },
    exit: {
        scale: 0.92,
        y: 20,
        opacity: 0,
        transition: {
            duration: 0.16,
        },
    },
};

const POS = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<any>();

    const selectedCustomer = location?.state?.selectedCustomer || null;

    const { productLoader, products } = useSelector((state: any) => state.pos);

    const [searchText, setSearchText] = useState("");
    const [selectedId, setSelectedId] = useState<any>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [previewProduct, setPreviewProduct] = useState<any>(null);

    const [qtyText, setQtyText] = useState("1");
    const [priceText, setPriceText] = useState("");
    const [discountText, setDiscountText] = useState("");
    const [cgstText, setCgstText] = useState("");
    const [sgstText, setSgstText] = useState("");
    const [igstText, setIgstText] = useState("");

    const allProducts = useMemo(() => {
        return (products || []).map((p: any) => ({
            id: String(p?.productCode ?? p?._id ?? ""),
            code: String(p?.productCode ?? ""),
            name: String(p?.productName ?? ""),
            price: p?.sellingPrice ?? 0,
            raw: p,
        }));
    }, [products]);

    const fetchProducts = useCallback(async () => {
        try {
            await dispatch(
                getPosProducts({
                    search: "",
                    productType: "",
                    offset: 0,
                    limit: 200,
                })
            ).unwrap();
        } catch (error: any) {
            toast.error(error?.message || "Failed to load products");
        }
    }, [dispatch]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const selectedProduct = useMemo(() => {
        return allProducts.find((p: any) => p.id === selectedId) || null;
    }, [allProducts, selectedId]);

    const cartMap = useMemo(() => {
        const map = new Map();
        cart.forEach((item) => map.set(item.id, item));
        return map;
    }, [cart]);

    const qty = useMemo(() => {
        const q = Math.floor(toNum(qtyText));
        return q > 0 ? q : 1;
    }, [qtyText]);

    const price = toNum(priceText);
    const discountPercent = toNum(discountText);
    const cgstPercent = toNum(cgstText);
    const sgstPercent = toNum(sgstText);
    const igstPercent = toNum(igstText);

    const discountAmount = (price * discountPercent) / 100;
    const priceAfterDiscount = price - discountAmount;

    let taxAmount = 0;

    if (igstPercent > 0) {
        taxAmount = (priceAfterDiscount * igstPercent) / 100;
    } else {
        taxAmount =
            (priceAfterDiscount * cgstPercent) / 100 +
            (priceAfterDiscount * sgstPercent) / 100;
    }

    const finalUnitPrice = priceAfterDiscount + taxAmount;
    const finalTotal = finalUnitPrice * qty;

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + toNum(item.netAmount), 0);
    }, [cart]);

    const cartGross = useMemo(() => {
        return cart.reduce((sum, item) => sum + toNum(item.gross), 0);
    }, [cart]);

    const cartTax = useMemo(() => {
        return cart.reduce((sum, item) => sum + toNum(item.taxAmount), 0);
    }, [cart]);

    const cartDiscount = useMemo(() => {
        return cart.reduce((sum, item) => sum + toNum(item.discountAmount), 0);
    }, [cart]);

    const filteredProducts = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        if (!q) return allProducts;

        return allProducts.filter((p: any) => {
            const name = String(p.name || "").toLowerCase();
            const code = String(p.code || "").toLowerCase();

            return name.includes(q) || code.includes(q);
        });
    }, [allProducts, searchText]);

    const onSelect = useCallback(
        (product: any) => {
            setSelectedId(product.id);

            const inCart = cartMap.get(product.id);

            if (inCart) {
                setQtyText(String(inCart.qty ?? 1));
                setPriceText(
                    String(inCart.basePrice ?? inCart.price ?? toNum(product.price))
                );
                setDiscountText(String(inCart.discountPercent ?? ""));
                setCgstText(String(inCart.cgstPercent ?? ""));
                setSgstText(String(inCart.sgstPercent ?? ""));
                setIgstText(String(inCart.igstPercent ?? ""));
                return;
            }

            setQtyText("1");
            setPriceText(String(toNum(product.price)));
            setDiscountText("");
            setCgstText("");
            setSgstText("");
            setIgstText("");
        },
        [cartMap]
    );

    const onMinus = () => {
        setQtyText(String(Math.max(1, qty - 1)));
    };

    const onPlus = () => {
        setQtyText(String(qty + 1));
    };

    const onQtyChange = (value: any) => {
        const clean = String(value ?? "").replace(/[^\d]/g, "");
        setQtyText(clean);
    };

    const buildCartPayload = () => {
        if (!selectedProduct) return null;

        const gross = price * qty;

        const discountAmountPerUnit = (price * discountPercent) / 100;
        const discountTotal = discountAmountPerUnit * qty;
        const priceAfterDiscount = price - discountAmountPerUnit;

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (igstPercent > 0) {
            igstAmount = (priceAfterDiscount * igstPercent) / 100;
        } else {
            cgstAmount = (priceAfterDiscount * cgstPercent) / 100;
            sgstAmount = (priceAfterDiscount * sgstPercent) / 100;
        }

        const totalCgstAmount = cgstAmount * qty;
        const totalSgstAmount = sgstAmount * qty;
        const totalIgstAmount = igstAmount * qty;
        const totalTaxAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;

        const netAmount =
            (priceAfterDiscount + cgstAmount + sgstAmount + igstAmount) * qty;

        return {
            id: selectedProduct.id,
            code: selectedProduct.code,
            name: selectedProduct.name,
            raw: selectedProduct.raw,
            imageUrl: selectedProduct.raw?.imageUrl || "",

            basePrice: price,
            discountPercent,
            cgstPercent,
            sgstPercent,
            igstPercent,
            price: finalUnitPrice,
            qty,

            sOrderNumber: null,
            productCode: selectedProduct.code,
            productName: selectedProduct.name,
            productType: selectedProduct.raw?.productType || "",
            productDescription: selectedProduct.raw?.productDescription || "",
            productHSNCode: selectedProduct.raw?.productHSNCode || "",
            quantity: qty,
            uom: selectedProduct.raw?.unit || selectedProduct.raw?.unitName || "",
            rate: price,

            gross,
            discount: discountPercent,
            discountAmount: discountTotal,

            cgst: cgstPercent,
            cgstAmount: totalCgstAmount,

            sgst: sgstPercent,
            sgstAmount: totalSgstAmount,

            igst: igstPercent,
            igstAmount: totalIgstAmount,

            taxAmount: totalTaxAmount,
            netAmount,

            from_date: new Date().toISOString(),
            to_date: new Date().toISOString(),
        };
    };

    const onAdd = () => {
        const payload = buildCartPayload();

        if (!payload) {
            toast.error("Please select product");
            return;
        }

        setCart((prev) => {
            const index = prev.findIndex((x) => x.id === payload.id);

            if (index >= 0) {
                const next = [...prev];
                next[index] = payload;
                return next;
            }

            return [...prev, payload];
        });

        toast.success(`${payload.productName} added to cart`);
    };

    const quickAdd = (item: any) => {
        setSelectedId(item.id);

        const inCart = cartMap.get(item.id);

        const basePrice = inCart?.basePrice ?? toNum(item.price);
        const nextQty = inCart ? toNum(inCart.qty) + 1 : 1;

        const product = item;
        const discount = toNum(inCart?.discountPercent ?? 0);
        const cgst = toNum(inCart?.cgstPercent ?? 0);
        const sgst = toNum(inCart?.sgstPercent ?? 0);
        const igst = toNum(inCart?.igstPercent ?? 0);

        const gross = basePrice * nextQty;
        const discountAmountPerUnit = (basePrice * discount) / 100;
        const discountTotal = discountAmountPerUnit * nextQty;
        const priceAfterDiscount = basePrice - discountAmountPerUnit;

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (igst > 0) {
            igstAmount = (priceAfterDiscount * igst) / 100;
        } else {
            cgstAmount = (priceAfterDiscount * cgst) / 100;
            sgstAmount = (priceAfterDiscount * sgst) / 100;
        }

        const totalCgstAmount = cgstAmount * nextQty;
        const totalSgstAmount = sgstAmount * nextQty;
        const totalIgstAmount = igstAmount * nextQty;
        const totalTaxAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;

        const netAmount =
            (priceAfterDiscount + cgstAmount + sgstAmount + igstAmount) * nextQty;

        const payload = {
            id: product.id,
            code: product.code,
            name: product.name,
            raw: product.raw,
            imageUrl: product.raw?.imageUrl || "",

            basePrice,
            discountPercent: discount,
            cgstPercent: cgst,
            sgstPercent: sgst,
            igstPercent: igst,
            price: netAmount / nextQty,
            qty: nextQty,

            sOrderNumber: null,
            productCode: product.code,
            productName: product.name,
            productType: product.raw?.productType || "",
            productDescription: product.raw?.productDescription || "",
            productHSNCode: product.raw?.productHSNCode || "",
            quantity: nextQty,
            uom: product.raw?.unit || product.raw?.unitName || "",
            rate: basePrice,

            gross,
            discount,
            discountAmount: discountTotal,

            cgst,
            cgstAmount: totalCgstAmount,

            sgst,
            sgstAmount: totalSgstAmount,

            igst,
            igstAmount: totalIgstAmount,

            taxAmount: totalTaxAmount,
            netAmount,

            from_date: new Date().toISOString(),
            to_date: new Date().toISOString(),
        };

        setCart((prev) => {
            const index = prev.findIndex((x) => x.id === payload.id);

            if (index >= 0) {
                const next = [...prev];
                next[index] = payload;
                return next;
            }

            return [...prev, payload];
        });

        setQtyText(String(nextQty));
        setPriceText(String(basePrice));
        setDiscountText(String(discount || ""));
        setCgstText(String(cgst || ""));
        setSgstText(String(sgst || ""));
        setIgstText(String(igst || ""));
    };

    const quickMinus = (item: any) => {
        const cartItem = cartMap.get(item.id);

        if (!cartItem) return;

        if (toNum(cartItem.qty) <= 1) {
            onRemove(item);
            return;
        }

        const nextQty = toNum(cartItem.qty) - 1;

        setSelectedId(item.id);
        setQtyText(String(nextQty));
        setPriceText(String(cartItem.basePrice ?? cartItem.rate ?? 0));
        setDiscountText(String(cartItem.discountPercent ?? cartItem.discount ?? ""));
        setCgstText(String(cartItem.cgstPercent ?? cartItem.cgst ?? ""));
        setSgstText(String(cartItem.sgstPercent ?? cartItem.sgst ?? ""));
        setIgstText(String(cartItem.igstPercent ?? cartItem.igst ?? ""));

        const basePrice = toNum(cartItem.basePrice ?? cartItem.rate);
        const discount = toNum(cartItem.discountPercent ?? cartItem.discount);
        const cgst = toNum(cartItem.cgstPercent ?? cartItem.cgst);
        const sgst = toNum(cartItem.sgstPercent ?? cartItem.sgst);
        const igst = toNum(cartItem.igstPercent ?? cartItem.igst);

        const gross = basePrice * nextQty;
        const discountAmountPerUnit = (basePrice * discount) / 100;
        const discountTotal = discountAmountPerUnit * nextQty;
        const priceAfterDiscount = basePrice - discountAmountPerUnit;

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (igst > 0) {
            igstAmount = (priceAfterDiscount * igst) / 100;
        } else {
            cgstAmount = (priceAfterDiscount * cgst) / 100;
            sgstAmount = (priceAfterDiscount * sgst) / 100;
        }

        const totalCgstAmount = cgstAmount * nextQty;
        const totalSgstAmount = sgstAmount * nextQty;
        const totalIgstAmount = igstAmount * nextQty;
        const totalTaxAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount;

        const netAmount =
            (priceAfterDiscount + cgstAmount + sgstAmount + igstAmount) * nextQty;

        setCart((prev) =>
            prev.map((x) =>
                x.id === item.id
                    ? {
                        ...x,
                        qty: nextQty,
                        quantity: nextQty,
                        gross,
                        discountAmount: discountTotal,
                        cgstAmount: totalCgstAmount,
                        sgstAmount: totalSgstAmount,
                        igstAmount: totalIgstAmount,
                        taxAmount: totalTaxAmount,
                        netAmount,
                    }
                    : x
            )
        );
    };

    const onRemove = (item: any) => {
        setCart((prev) => {
            const updated = prev.filter((p) => p.id !== item.id);

            if (selectedId === item.id) {
                if (updated.length > 0) {
                    const lastItem = updated[updated.length - 1];

                    setSelectedId(lastItem.id);
                    setQtyText(String(lastItem.qty ?? 1));
                    setPriceText(String(lastItem.basePrice ?? lastItem.price ?? 0));
                    setDiscountText(String(lastItem.discountPercent ?? ""));
                    setCgstText(String(lastItem.cgstPercent ?? ""));
                    setSgstText(String(lastItem.sgstPercent ?? ""));
                    setIgstText(String(lastItem.igstPercent ?? ""));
                } else {
                    setSelectedId(null);
                    setQtyText("1");
                    setPriceText("");
                    setDiscountText("");
                    setCgstText("");
                    setSgstText("");
                    setIgstText("");
                }
            }

            return updated;
        });

        toast.success("Item removed");
    };

    const hasUnsavedChanges = useMemo(() => {
        if (!selectedProduct) return false;

        const inCart = cart.find((p) => p.id === selectedProduct.id);
        if (!inCart) return false;

        return (
            toNum(inCart.qty) !== toNum(qty) ||
            toNum(inCart.basePrice) !== toNum(price) ||
            toNum(inCart.discountPercent) !== toNum(discountPercent) ||
            toNum(inCart.cgstPercent) !== toNum(cgstPercent) ||
            toNum(inCart.sgstPercent) !== toNum(sgstPercent) ||
            toNum(inCart.igstPercent) !== toNum(igstPercent)
        );
    }, [
        cart,
        selectedProduct,
        qty,
        price,
        discountPercent,
        cgstPercent,
        sgstPercent,
        igstPercent,
    ]);

    const onNext = () => {
        if (!cart.length) {
            toast.error("Please add product");
            return;
        }

        if (hasUnsavedChanges) {
            toast.error("Please click Update Item before payment");
            return;
        }

        navigate("/bookEz/pos/payment", {
            state: {
                payload: cart,
                selectedCustomer,
            },
        });
    };

    return (
        <div className=" w-full overflow-hidden bg-background p-3 text-foreground">
            {/* TOP BAR */}
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-md border border-primary bg-primary px-3.5 text-sm font-black text-primary-foreground shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                        All
                        <span className="ml-2 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-xs">
                            {allProducts.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="h-9 rounded-md border border-border bg-card px-3.5 text-sm font-black text-card-foreground shadow-sm transition hover:scale-[1.02] hover:bg-muted active:scale-[0.98]"
                    >
                        Added
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            {cart.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="h-9 rounded-md border border-border bg-card px-3.5 text-sm font-black text-card-foreground shadow-sm transition hover:scale-[1.02] hover:bg-muted active:scale-[0.98]"
                    >
                        Total
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            ₹{formatIndianNumber(cartTotal)}
                        </span>
                    </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={fetchProducts}
                        className="flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-black text-card-foreground shadow-sm transition hover:bg-muted"
                    >
                        <RefreshCcw size={15} />
                        Refresh
                    </motion.button>

                    <div className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-card px-3 shadow-sm sm:w-[320px]">
                        <Search size={16} className="text-muted-foreground" />

                        <input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search Product"
                            className="h-full w-full bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                        />

                        <AnimatePresence>
                            {searchText ? (
                                <motion.button
                                    key="clear-search"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    type="button"
                                    onClick={() => setSearchText("")}
                                    className="rounded p-0.5 hover:bg-muted"
                                >
                                    <X size={16} className="text-muted-foreground" />
                                </motion.button>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* MAIN */}
            <div className="grid grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1fr_390px]">
                {/* PRODUCTS */}
                <div className="h-full min-h-0 overflow-y-auto pr-1">
                    {productLoader ? (
                        <div className="flex h-[420px] items-center justify-center rounded-md border border-border bg-card shadow-sm">
                            <div className="text-center">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                                <p className="text-sm font-black text-muted-foreground">
                                    Loading products...
                                </p>
                            </div>
                        </div>
                    ) : filteredProducts.length ? (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.map((item: any) => {
                                    const isSelected = item.id === selectedId;
                                    const isAdded = cartMap.has(item.id);
                                    const addedQty = cartMap.get(item.id)?.qty ?? 1;

                                    return (
                                        <motion.div
                                            layout
                                            key={item.id || item.code}
                                            variants={cardMotion}
                                            initial="hidden"
                                            animate="show"
                                            exit="exit"
                                            onClick={() => setPreviewProduct(item)}
                                            whileHover={{
                                                y: -4,
                                                scale: 1.01,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 320,
                                                    damping: 18,
                                                },
                                            }}
                                            className={`group cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl ${isSelected
                                                ? "border-primary shadow-primary/20 ring-2 ring-primary/25"
                                                : isAdded
                                                    ? "border-success shadow-success/20 ring-2 ring-success/25"
                                                    : "border-border hover:border-primary/40"
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewProduct(item);
                                                }}
                                                className="relative block h-[120px] w-full overflow-hidden bg-muted"
                                            >
                                                {item.raw?.imageUrl ? (
                                                    <img
                                                        src={item.raw.imageUrl}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover opacity-100 transition duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-background">
                                                        <Upload
                                                            size={30}
                                                            className="text-muted-foreground"
                                                        />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-30 transition group-hover:opacity-20" />

                                                <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-1 text-xs font-black text-slate-800 shadow-md backdrop-blur">
                                                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
                                                    Available
                                                </span>

                                                {isAdded ? (
                                                    <motion.span
                                                        initial={{ scale: 0.8 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute left-2 top-2 rounded-md bg-success px-2 py-1 text-xs font-black text-white shadow-md"
                                                    >
                                                        Added {addedQty}
                                                    </motion.span>
                                                ) : null}
                                            </button>

                                            <div className="p-3">
                                                <div className="mb-2.5 flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="line-clamp-1 text-sm font-black text-card-foreground">
                                                            {item.name || "—"}
                                                        </h3>

                                                        <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                                                            {item.code || "No Code"}
                                                        </p>
                                                    </div>

                                                    <p className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-black text-foreground">
                                                        ₹{formatIndianNumber(item.price)}
                                                    </p>
                                                </div>

                                                {isAdded ? (
                                                    <div className="grid grid-cols-[36px_1fr_36px] gap-1.5">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                quickMinus(item);
                                                            }}
                                                            className="flex h-9 items-center justify-center rounded-md border border-border bg-card font-black text-card-foreground transition hover:bg-muted"
                                                        >
                                                            <Minus size={15} />
                                                        </motion.button>

                                                        <motion.button
                                                            whileTap={{ scale: 0.97 }}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelect(item);
                                                            }}
                                                            className="h-9 rounded-md border border-border bg-muted text-sm font-black text-foreground transition hover:bg-primary/10"
                                                        >
                                                            Add More ({addedQty})
                                                        </motion.button>

                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                quickAdd(item);
                                                            }}
                                                            className="flex h-9 items-center justify-center rounded-md bg-primary font-black text-primary-foreground transition hover:opacity-90"
                                                        >
                                                            <Plus size={15} />
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <motion.button
                                                        whileTap={{ scale: 0.97 }}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            quickAdd(item);
                                                        }}
                                                        className="flex cursor-pointer h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-black text-primary-foreground shadow-sm transition hover:shadow-md hover:opacity-95"
                                                    >
                                                        <Plus size={15} />
                                                        Add to Cart
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="flex h-[420px] items-center justify-center rounded-md border border-dashed border-border bg-card shadow-sm">
                            <div className="text-center">
                                <Search
                                    size={38}
                                    className="mx-auto mb-3 text-muted-foreground"
                                />
                                <p className="text-base font-black text-card-foreground">
                                    No products found
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ORDER SUMMARY */}
                <motion.div
                    layout
                    initial={{ x: 20 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="h-full min-h-0 overflow-y-auto pr-1"
                >
                    <div className="flex min-h-full flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm">
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between border-b border-border bg-gradient-to-r from-card to-muted/40 px-3 py-3">
                            <div>
                                <h2 className="text-base font-black text-card-foreground">
                                    Order Summary
                                </h2>

                                <p className="text-xs font-bold text-muted-foreground">
                                    {cart.length} item(s) selected
                                </p>
                            </div>

                            <motion.p
                                initial={{ x: 8 }}
                                animate={{ x: 0 }}
                                className="rounded-md bg-muted px-2 py-1 text-xs font-black text-foreground"
                            >
                                #POS-{new Date().getTime().toString().slice(-6)}
                            </motion.p>
                        </div>

                        {/* Edit Selected Item */}
                        <AnimatePresence>
                            {selectedProduct ? (
                                <motion.div
                                    key="selected-product-editor"
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="shrink-0 overflow-hidden border-b border-border"
                                >
                                    <div className="p-3">
                                        <div className="mb-2.5 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase text-muted-foreground">
                                                    Edit Selected Item
                                                </p>

                                                <h3 className="mt-0.5 line-clamp-1 text-sm font-black text-card-foreground">
                                                    {selectedProduct.name}
                                                </h3>
                                            </div>

                                            <div className="rounded-md bg-muted px-2.5 py-1.5 text-right">
                                                <p className="text-xs font-black uppercase text-muted-foreground">
                                                    Total
                                                </p>

                                                <p className="text-sm font-black text-foreground">
                                                    ₹{formatIndianNumber(finalTotal)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                value={priceText}
                                                onChange={(e) =>
                                                    setPriceText(sanitizeDecimal(e.target.value))
                                                }
                                                placeholder="Rate"
                                                className="h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                            />

                                            <input
                                                value={discountText}
                                                onChange={(e) =>
                                                    setDiscountText(sanitizeDecimal(e.target.value))
                                                }
                                                placeholder="Disc %"
                                                className="h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                            />

                                            <input
                                                value={cgstText}
                                                disabled={toNum(igstText) > 0}
                                                onChange={(e) => {
                                                    const value = sanitizeDecimal(e.target.value);
                                                    setCgstText(value);
                                                    if (toNum(value) > 0) setIgstText("");
                                                }}
                                                placeholder="CGST %"
                                                className="h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                                            />

                                            <input
                                                value={sgstText}
                                                disabled={toNum(igstText) > 0}
                                                onChange={(e) => {
                                                    const value = sanitizeDecimal(e.target.value);
                                                    setSgstText(value);
                                                    if (toNum(value) > 0) setIgstText("");
                                                }}
                                                placeholder="SGST %"
                                                className="h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                                            />

                                            <input
                                                value={igstText}
                                                disabled={toNum(cgstText) > 0 || toNum(sgstText) > 0}
                                                onChange={(e) => {
                                                    const value = sanitizeDecimal(e.target.value);
                                                    setIgstText(value);
                                                    if (toNum(value) > 0) {
                                                        setCgstText("");
                                                        setSgstText("");
                                                    }
                                                }}
                                                placeholder="IGST %"
                                                className="h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                                            />

                                            <div className="grid h-9 grid-cols-[32px_1fr_32px] overflow-hidden rounded-md border border-border">
                                                <button
                                                    type="button"
                                                    onClick={onMinus}
                                                    className="bg-muted text-sm font-black text-foreground"
                                                >
                                                    -
                                                </button>

                                                <input
                                                    value={qtyText}
                                                    onChange={(e) => onQtyChange(e.target.value)}
                                                    className="w-full bg-input text-center text-sm font-black text-foreground outline-none"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={onPlus}
                                                    className="bg-muted text-sm font-black text-foreground"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            type="button"
                                            onClick={onAdd}
                                            className="mt-2.5 h-9 w-full cursor-pointer rounded-md bg-primary text-sm font-black text-primary-foreground transition hover:opacity-90"
                                        >
                                            Update Item
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        {/* Cart Items */}
                        <div className="shrink-0 border-b border-border p-3">
                            <div className="max-h-[350px] min-h-[150px] overflow-y-auto pr-1">
                                {cart.length ? (
                                    <motion.div layout className="space-y-2">
                                        <AnimatePresence initial={false}>
                                            {cart.map((item) => (
                                                <motion.div
                                                    layout
                                                    key={item.id}
                                                    initial={{ x: 24, scale: 0.96 }}
                                                    animate={{ x: 0, scale: 1 }}
                                                    exit={{ x: -24, scale: 0.96 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 260,
                                                        damping: 22,
                                                    }}
                                                    className="rounded-md border border-border bg-card p-2.5 shadow-sm transition hover:border-primary/40 hover:bg-muted/30"
                                                >
                                                    <div className="flex gap-2.5">
                                                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                                            {item?.imageUrl ? (
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.productName}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <Upload
                                                                        size={18}
                                                                        className="text-muted-foreground"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="line-clamp-1 text-sm font-black text-card-foreground">
                                                                        {item.productName || item.name}
                                                                        <span className="ml-1 text-muted-foreground">
                                                                            ({item.qty})
                                                                        </span>
                                                                    </p>

                                                                    <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                                                                        Price: ₹
                                                                        {formatIndianNumber(item.basePrice)}
                                                                    </p>
                                                                </div>

                                                                <div className="flex gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onSelect(item)}
                                                                        className="text-muted-foreground transition hover:text-foreground"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onRemove(item)}
                                                                        className="text-muted-foreground transition hover:text-danger"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                ) : (
                                        <div className="flex h-full min-h-[250px] items-center justify-center text-center">
                                            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-10 py-12">
                                                <ShoppingCart
                                                    size={42}
                                                    className="mx-auto mb-3 text-muted-foreground"
                                                />

                                                <p className="text-sm font-black text-foreground">
                                                    No item added
                                                </p>

                                            <p className="mt-1 text-xs font-bold text-muted-foreground">
                                                Add products from the menu
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <motion.div layout className="shrink-0 p-3">
                            <div className="rounded-md border border-border p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-bold text-muted-foreground">
                                        Subtotal
                                    </span>

                                    <span className="font-black text-foreground">
                                        ₹{formatIndianNumber(cartGross)}
                                    </span>
                                </div>

                                <div className="mt-1.5 flex justify-between">
                                    <span className="font-bold text-muted-foreground">
                                        Taxes
                                    </span>

                                    <span className="font-black text-foreground">
                                        ₹{formatIndianNumber(cartTax)}
                                    </span>
                                </div>

                                <div className="mt-1.5 flex justify-between">
                                    <span className="font-bold text-muted-foreground">
                                        Discount
                                    </span>

                                    <span className="font-black text-success">
                                        -₹{formatIndianNumber(cartDiscount)}
                                    </span>
                                </div>

                                <div className="my-2 border-t border-border" />

                                <div className="flex justify-between text-base">
                                    <span className="font-black text-card-foreground">
                                        Total Payment
                                    </span>

                                    <span className="font-black text-foreground">
                                        ₹{formatIndianNumber(cartTotal)}
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={onNext}
                                disabled={!cart.length}
                                className="mt-2 h-10 w-full cursor-pointer rounded-md bg-primary text-sm font-black text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                            >
                                Confirm Payment
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            <ProductPreviewModal {...{ quickAdd, previewProduct, cartMap, setPreviewProduct }} />
        </div>
    );
};

const ProductPreviewModal = ({ quickAdd, previewProduct, cartMap, setPreviewProduct }: any) => {
    if (!previewProduct) return null;
    const item = previewProduct;
    const isAdded = cartMap.has(item.id);
    const addedQty = cartMap.get(item.id)?.qty ?? 0;

    return (
        <AnimatePresence>
            <motion.div
                variants={modalBackdropMotion}
                initial="hidden"
                animate="show"
                exit="exit"
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setPreviewProduct(null)}
            >
                <motion.div
                    variants={productPreviewMotion}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
                >
                    <div className="relative h-[260px] overflow-hidden bg-muted">
                        {item.raw?.imageUrl ? (
                            <motion.img
                                initial={{ scale: 1.08 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.35 }}
                                src={item.raw.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-background">
                                <Upload size={48} className="text-muted-foreground" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        <button
                            type="button"
                            onClick={() => setPreviewProduct(null)}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
                        >
                            <X size={18} />
                        </button>

                        {isAdded ? (
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute left-3 top-3 rounded-md bg-success px-3 py-1.5 text-xs font-black text-white shadow-md"
                            >
                                Added {addedQty}
                            </motion.div>
                        ) : (
                            <div className="absolute left-3 top-3 rounded-md bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800 shadow-md">
                                Available
                            </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-xs font-black uppercase tracking-wide text-white/70">
                                Product Preview
                            </p>

                            <h2 className="mt-1 line-clamp-2 text-2xl font-black text-white">
                                {item.name || "—"}
                            </h2>

                            <p className="mt-1 text-sm font-bold text-white/80">
                                {item.code || "No Code"}
                            </p>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="mb-4 grid grid-cols-2 gap-3">
                            <div className="rounded-md border border-border bg-muted/70 p-3">
                                <p className="text-xs font-black uppercase text-muted-foreground">
                                    Price
                                </p>
                                <p className="mt-1 text-base font-black text-foreground">
                                    ₹{formatIndianNumber(item.price)}
                                </p>
                            </div>

                            <div className="rounded-md border border-border bg-muted/70 p-3">
                                <p className="text-xs font-black uppercase text-muted-foreground">
                                    HSN
                                </p>
                                <p className="mt-1 text-base font-black text-foreground">
                                    {item.raw?.productHSNCode || "—"}
                                </p>
                            </div>

                            <div className="rounded-md border border-border bg-muted/70 p-3">
                                <p className="text-xs font-black uppercase text-muted-foreground">
                                    Unit
                                </p>
                                <p className="mt-1 text-base font-black text-foreground">
                                    {item.raw?.unit || item.raw?.unitName || "—"}
                                </p>
                            </div>

                            <div className="rounded-md border border-border bg-muted/70 p-3">
                                <p className="text-xs font-black uppercase text-muted-foreground">
                                    Type
                                </p>
                                <p className="mt-1 text-base font-black text-foreground">
                                    {item.raw?.productType || "—"}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 rounded-md border border-border bg-muted/50 p-3">
                            <p className="text-xs font-black uppercase text-muted-foreground">
                                Description
                            </p>

                            <p className="mt-1 text-sm font-bold leading-6 text-card-foreground">
                                {item.raw?.productDescription ||
                                    "No description available"}
                            </p>
                        </div>

                        {/* <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item);
                                        setPreviewProduct(null);
                                    }}
                                    className="h-11 rounded-md border border-border bg-card text-sm font-black text-card-foreground transition hover:bg-muted"
                                >
                                    Edit Details
                                </motion.button> */}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={() => {
                                quickAdd(item);
                                setPreviewProduct(null);
                            }}
                            className="flex cursor-pointer w-full h-11 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-95">
                            <Plus size={17} />
                            Add to Cart
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default POS;