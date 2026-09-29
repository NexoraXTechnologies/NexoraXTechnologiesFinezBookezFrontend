export const buildPdfPreviewHtml = (base64: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
    width: 100%;
    height: 100%;
    background: #fff;
    overflow: hidden;
}

#wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #fff;
    padding: 10px;
}

#pdf-canvas {
    display: block;
}

#error {
    padding: 16px;
    color: #DC2626;
    font: 14px sans-serif;
}
</style>
</head>

<body>
<div id="wrap">
    <canvas id="pdf-canvas"></canvas>
</div>

<script>
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

try {
    const raw = atob("${base64}");
    const bytes = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: bytes }).promise
        .then(function(pdf) {
            return pdf.getPage(1);
        })
        .then(async function(page) {
            const wrap = document.getElementById("wrap");
            const finalCanvas = document.getElementById("pdf-canvas");
            const finalCtx = finalCanvas.getContext("2d");

            // ⭐ UPDATED - render high resolution first
            const scanScale = Math.min((window.devicePixelRatio || 1) * 2, 4);
            const scanViewport = page.getViewport({ scale: scanScale });

            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

            tempCanvas.width = Math.ceil(scanViewport.width);
            tempCanvas.height = Math.ceil(scanViewport.height);

            tempCtx.fillStyle = "#FFFFFF";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            await page.render({
                canvasContext: tempCtx,
                viewport: scanViewport
            }).promise;

            // ⭐ UPDATED - find actual report content bounds
            const imageData = tempCtx.getImageData(
                0,
                0,
                tempCanvas.width,
                tempCanvas.height
            );

            const data = imageData.data;

            let minX = tempCanvas.width;
            let minY = tempCanvas.height;
            let maxX = 0;
            let maxY = 0;
            let foundContent = false;

            // Skip pixels for performance
            const step = 3;

            for (let y = 0; y < tempCanvas.height; y += step) {
                for (let x = 0; x < tempCanvas.width; x += step) {
                    const index = (y * tempCanvas.width + x) * 4;

                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const a = data[index + 3];

                    // Anything visibly different from white counts as report content
                    if (
                        a > 10 &&
                        (r < 245 || g < 245 || b < 245)
                    ) {
                        foundContent = true;

                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            // Fallback to complete page if bounds cannot be detected
            if (!foundContent) {
                minX = 0;
                minY = 0;
                maxX = tempCanvas.width;
                maxY = tempCanvas.height;
            }

            // ⭐ UPDATED - keep safe whitespace around actual report
            const safePadding = Math.round(scanScale * 18);

            minX = Math.max(0, minX - safePadding);
            minY = Math.max(0, minY - safePadding);
            maxX = Math.min(tempCanvas.width, maxX + safePadding);
            maxY = Math.min(tempCanvas.height, maxY + safePadding);

            const cropWidth = Math.max(maxX - minX, 1);
            const cropHeight = Math.max(maxY - minY, 1);

            const availableWidth = Math.max(
                (wrap.clientWidth || 900) - 20,
                1
            );

            const availableHeight = Math.max(
                (wrap.clientHeight || 700) - 20,
                1
            );

            // ⭐ UPDATED - fit all detected report content, never crop it
            const fitScale = Math.min(
                availableWidth / cropWidth,
                availableHeight / cropHeight
            );

            const cssWidth = Math.floor(cropWidth * fitScale);
            const cssHeight = Math.floor(cropHeight * fitScale);

            const outputScale = Math.min(
                window.devicePixelRatio || 1,
                3
            );

            finalCanvas.width = Math.max(
                Math.floor(cssWidth * outputScale),
                1
            );

            finalCanvas.height = Math.max(
                Math.floor(cssHeight * outputScale),
                1
            );

            finalCanvas.style.width = cssWidth + "px";
            finalCanvas.style.height = cssHeight + "px";

            finalCtx.setTransform(
                outputScale,
                0,
                0,
                outputScale,
                0,
                0
            );

            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = "high";

            finalCtx.fillStyle = "#FFFFFF";
            finalCtx.fillRect(
                0,
                0,
                cssWidth,
                cssHeight
            );

            finalCtx.drawImage(
                tempCanvas,
                minX,
                minY,
                cropWidth,
                cropHeight,
                0,
                0,
                cssWidth,
                cssHeight
            );
        })
        .catch(function(error) {
            document.body.innerHTML =
                '<div id="error">' +
                ((error && error.message) ||
                    "Unable to render PDF preview") +
                "</div>";
        });

} catch (error) {
    document.body.innerHTML =
        '<div id="error">' +
        ((error && error.message) ||
            "Unable to render PDF preview") +
        "</div>";
}
</script>

</body>
</html>
`;