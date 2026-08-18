import Magnifier from "../Magnifier";
import { buildChassisDrawingSvgHtml } from "../chassisDrawingSvgHtml";
import { computeChassisDrawingLayout } from "../chassisDrawingLayout";

const ChasisTemplate = ({ bomData = {} }: any) => {
    const layout = computeChassisDrawingLayout(bomData);

    return (
        <div className="h-full w-full bg-card text-card-foreground">
            <Magnifier
                contentWidth={layout.svgW}
                contentHeight={layout.svgH}
                minZoom={0.35}
                maxZoom={3.5}
            >
                <div
                    className="h-full w-full"
                    dangerouslySetInnerHTML={{
                        __html: buildChassisDrawingSvgHtml(bomData),
                    }}
                />
            </Magnifier>
        </div>
    );
};

export default ChasisTemplate;