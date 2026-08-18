import { useState } from "react";

import SummaryTab from "./SummaryTab";
import PDFTab from "./PDFTab";
import DrawingTab from "./DrawingTab";
import BOMTab from "./BOMTab";

const tabs = ["Drawing", "BOM", "Summary", "Export"];

const Drawing = ({ bomData = {} }: any) => {
    const [activeTab, setActiveTab] = useState("Drawing");

    return (
        <div className="flex h-full w-full flex-col bg-card text-card-foreground">
            {/* Tabs */}
            <div className="shrink-0 border-b border-border bg-card">
                <div className="grid grid-cols-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex h-12 items-center justify-center text-sm font-semibold transition ${
                                activeTab === tab
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {tab}

                            {activeTab === tab ? (
                                <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-primary" />
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden p-3">
                <div className="h-full overflow-hidden rounded-md border border-border bg-card">
                    {activeTab === "Drawing" && (
                        <DrawingTab bomData={bomData} />
                    )}

                    {activeTab === "BOM" && (
                        <BOMTab bomData={bomData} />
                    )}

                    {activeTab === "Summary" && (
                        <SummaryTab bomData={bomData} />
                    )}

                    {activeTab === "Export" && (
                        <PDFTab bomData={bomData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Drawing;