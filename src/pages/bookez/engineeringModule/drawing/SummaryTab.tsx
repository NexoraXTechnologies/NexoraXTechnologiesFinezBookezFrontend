const SummaryTab = ({ bomData = {} }: any) => {
    const d = bomData?.dimensions || {};
    const c = bomData?.calculated || {};
    const isChassis = bomData?.finishedProduct === "chassis";

    const totalLength = Number(d.totalLength || 9200);
    const totalHeight = Number(
        d.totalHeight || d.deckHeight || d.trailerHeight || 1600
    );

    const pillarCount = Number(d.pillarCount || d.crossMemberCount || 7);
    const pillarSpacing = Number(
        d.pillarSpacing || c.crossMemberSpacing || 1250
    );
    const pillarWidth = Number(d.pillarWidth || 60);
    const topRailHeight = Number(d.topRailHeight || 150);
    const bottomRailHeight = Number(d.bottomRailHeight || 150);
    const sheetThickness = Number(d.sheetThickness || 2.5);

    const sheetHeight = totalHeight - topRailHeight - bottomRailHeight;

    const totalWeight =
        bomData?.estimatedWeight || c.estimatedTrailerWeight || 308.63;

    const estimatedCost =
        bomData?.estimatedCost ||
        c.estimatedCost ||
        bomData?.components?.reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0
        ) ||
        12450;

    return (
        <div className="h-full overflow-y-auto px-4 pb-10 text-foreground">
            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    Engineering Summary
                </h2>

                <Info label="Product" value={bomData?.selectedProduct || "-"} />
                <Info label="Account" value={bomData?.accountName || "-"} />
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    Dimensions
                </h2>

                <Info label="Total Length (A)" value={`${totalLength} mm`} />

                {isChassis ? (
                    <>
                        <Info
                            label="Total Width"
                            value={`${d.totalWidth || "-"} mm`}
                        />
                        <Info label="Deck Height" value={`${totalHeight} mm`} />
                        <Info
                            label="Cross Member Count"
                            value={String(d.crossMemberCount || "-")}
                        />
                        <Info
                            label="Cross Member Spacing"
                            value={`${c.crossMemberSpacing || "-"} mm`}
                        />
                        <Info
                            label="Axle Count"
                            value={String(d.axleCount || "-")}
                        />
                        <Info
                            label="Axle Spacing"
                            value={`${c.axleSpacing || "-"} mm`}
                        />
                        <Info
                            label="Tyre Count"
                            value={String(c.tyreCount || "-")}
                        />
                        <Info
                            label="King Pin Position"
                            value={`${c.kingPinPositionMm || "-"} mm`}
                        />
                        <Info
                            label="Main Beam Thickness"
                            value={c.mainBeamThickness || "-"}
                        />
                        <Info
                            label="Floor Plate Thickness"
                            value={c.floorPlateThickness || "-"}
                        />
                    </>
                ) : (
                    <>
                        <Info
                            label="Total Height (B)"
                            value={`${totalHeight} mm`}
                        />
                        <Info
                            label="Pillar Count"
                            value={String(pillarCount)}
                        />
                        <Info
                            label="Pillar Spacing (C)"
                            value={`${pillarSpacing} mm`}
                        />
                        <Info
                            label="Pillar Width"
                            value={`${pillarWidth} mm`}
                        />
                        <Info
                            label="Top Rail Height (D)"
                            value={`${topRailHeight} mm`}
                        />
                        <Info
                            label="Bottom Rail Height (E)"
                            value={`${bottomRailHeight} mm`}
                        />
                        <Info
                            label="Sheet Thickness"
                            value={`${sheetThickness} mm`}
                        />
                        <Info
                            label="Sheet Clear Height"
                            value={`${sheetHeight} mm`}
                        />
                    </>
                )}
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    Cost & Weight
                </h2>

                <Info
                    label="Total Components"
                    value={String(bomData?.components?.length || 0)}
                />
                <Info label="Total Weight" value={`${totalWeight} kg`} />
                <Info
                    label="Estimated Cost"
                    value={`₹ ${Number(estimatedCost || 0).toLocaleString(
                        "en-IN"
                    )}.00`}
                />
                <Info label="Tax Status" value="Excluding Tax" />

                <div className="mt-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3">
                    <h3 className="text-sm font-semibold text-success">
                        Ready for Approval
                    </h3>
                    <p className="mt-1 text-sm font-normal leading-5 text-muted-foreground">
                        Drawing, BOM and engineering summary are generated from
                        input dimensions.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Info = ({ label, value }: any) => {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
            <span className="flex-1 text-sm font-medium text-muted-foreground">
                {label}
            </span>

            <span className="flex-1 text-right text-sm font-semibold text-foreground">
                {value}
            </span>
        </div>
    );
};

export default SummaryTab;