const BOMTab = ({ bomData = {} }: any) => {
    const d = bomData?.dimensions || {};
    const isChassis = bomData?.finishedProduct === "chassis";

    const totalLength = Number(d.totalLength || 9200);
    const totalHeight = Number(
        d.totalHeight || d.deckHeight || d.trailerHeight || 1600
    );

    const sheetThickness = Number(d.sheetThickness || 2.5);

    const components = bomData?.components || [];
    const totalWeight =
        bomData?.estimatedWeight ||
        bomData?.calculated?.estimatedTrailerWeight ||
        308.63;

    const rows = components.map((item: any, index: number) => [
        String(index + 1),
        item.product || item.productName || "-",
        item.unit || "-",
        item.qty || item.quantity || "-",
        item.amount || "-",
    ]);

    const totalCost = components.reduce(
        (sum: number, item: any) => sum + Number(item.amount || 0),
        0
    );

    return (
        <div className="h-full overflow-y-auto px-4 pb-10 text-foreground">
            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    Bill of Materials
                </h2>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="grid min-h-12 grid-cols-[8%_27%_30%_12%_23%] bg-muted/50">
                        {["#", "Part Name", "Unit", "Qty", "Amount"].map(
                            (header) => (
                                <div
                                    key={header}
                                    className="flex items-center justify-center border-r border-border px-2 py-3 text-center text-xs font-semibold text-muted-foreground last:border-r-0"
                                >
                                    {header}
                                </div>
                            )
                        )}
                    </div>

                    {rows.length > 0 ? (
                        rows.map((row: any[], rowIndex: number) => (
                            <div
                                key={rowIndex}
                                className="grid min-h-12 grid-cols-[8%_27%_30%_12%_23%] border-t border-border bg-card transition hover:bg-muted/50"
                            >
                                {row.map((cell, cellIndex) => (
                                    <div
                                        key={cellIndex}
                                        className="flex items-center justify-center border-r border-border px-2 py-3 text-center text-xs font-medium text-foreground last:border-r-0"
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="p-5 text-center text-sm font-medium text-muted-foreground">
                            No BOM components available
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">
                        Total Weight
                    </span>
                    <span className="text-base font-semibold text-primary">
                        {totalWeight} kg
                    </span>
                </div>
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    Summary
                </h2>

                <Info label="Total Length (A)" value={`${totalLength} mm`} />
                <Info
                    label={isChassis ? "Deck Height (B)" : "Total Height (B)"}
                    value={`${totalHeight} mm`}
                />

                {isChassis ? (
                    <>
                        <Info
                            label="Cross Member Spacing"
                            value={`${d.crossMemberSpacing ||
                                bomData?.calculated?.crossMemberSpacing ||
                                "-"
                                } mm`}
                        />
                        <Info
                            label="Axle Spacing"
                            value={`${d.axleSpacing ||
                                bomData?.calculated?.axleSpacing ||
                                "-"
                                } mm`}
                        />
                        <Info label="Payload" value={d.payloadCapacity || "-"} />
                        <Info label="Steel Grade" value={d.steelGrade || "-"} />
                    </>
                ) : (
                    <>
                        <Info
                            label="Total Height (B)"
                            value={`${totalHeight} mm`}
                        />
                        <Info label="Material" value="Mild Steel (MS)" />
                        <Info
                            label="Sheet Thickness"
                            value={`${sheetThickness} mm`}
                        />
                    </>
                )}

                <Info label="Total Weight" value={`${totalWeight} kg`} />

                <div className="mt-4 flex items-center justify-between rounded-xl border border-success/20 bg-success/10 px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">
                        Estimated Cost
                    </span>

                    <div className="text-right">
                        <div className="text-base font-semibold text-success">
                            ₹ {totalCost.toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                            Excluding Tax
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Info = ({ label, value }: any) => (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
        <span className="text-sm font-medium text-muted-foreground">
            {label}
        </span>
        <span className="text-right text-sm font-semibold text-foreground">
            {value}
        </span>
    </div>
);

export default BOMTab;