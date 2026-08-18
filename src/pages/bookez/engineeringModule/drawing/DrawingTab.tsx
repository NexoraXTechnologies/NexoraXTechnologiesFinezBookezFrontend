import { useEffect, useRef, useState } from "react";
import ChasisTemplate from "./templates/ChasisTemplate";

const drawingTemplates: any = {
    chassis: ChasisTemplate,
};

const DESIGN_WIDTH = 1200;
const DESIGN_HEIGHT = 520;

const DrawingTab = ({ bomData = {} }: any) => {
    const productKey = bomData?.selectedProduct;
    const TemplateComponent = drawingTemplates[productKey];

    const cardRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (!cardRef.current) return;

            const cardWidth = cardRef.current.clientWidth - 32;
            const cardHeight = cardRef.current.clientHeight - 32;

            const widthScale = cardWidth / DESIGN_WIDTH;
            const heightScale = cardHeight / DESIGN_HEIGHT;

            const nextScale = Math.min(widthScale, heightScale, 1);

            setScale(nextScale);
        };

        updateScale();

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (cardRef.current) {
            resizeObserver.observe(cardRef.current);
        }

        window.addEventListener("resize", updateScale);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateScale);
        };
    }, [bomData]);

    if (!TemplateComponent) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
                    <p className="text-sm font-extrabold text-foreground">
                        No drawing template found for{" "}
                        {bomData?.selectedProduct || "product"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Please create a drawing template for this product.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className="flex h-full w-full items-center justify-center overflow-hidden bg-card p-4 text-card-foreground"
        >
            <div
                style={{
                    width: DESIGN_WIDTH * scale,
                    height: DESIGN_HEIGHT * scale,
                }}
            >
                <div
                    style={{
                        width: DESIGN_WIDTH,
                        height: DESIGN_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                    }}
                >
                    <TemplateComponent
                        bomData={bomData}
                        hideZoom
                        fitToCard
                    />
                </div>
            </div>
        </div>
    );
};

export default DrawingTab;