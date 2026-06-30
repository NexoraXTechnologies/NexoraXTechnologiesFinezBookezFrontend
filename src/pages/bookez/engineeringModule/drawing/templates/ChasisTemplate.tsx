import Magnifier from "../Magnifier";
import { buildChassisDrawingSvgHtml } from "../chassisDrawingSvgHtml";
import { computeChassisDrawingLayout } from "../chassisDrawingLayout";

const ChasisTemplate = ({ bomData = {} }: any) => {
    const layout = computeChassisDrawingLayout(bomData);
   
    return (
        <Magnifier
            contentWidth={layout.svgW}
            contentHeight={layout.svgH}
            minZoom={0.35}
            maxZoom={3.5}
        >
           

            <div
               
                dangerouslySetInnerHTML={{
                    __html: buildChassisDrawingSvgHtml(bomData),
                }}
            />
        </Magnifier>
    );
};

export default ChasisTemplate;