document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const downloadButton = document.getElementById("downloadButton");
    const feedback = document.getElementById("feedback");

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("highlight");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("highlight");
    });

    dropArea.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropArea.classList.remove("highlight");
        const files = e.dataTransfer.files;

        if (files.length === 0) {
            feedback.textContent = "No files dropped.";
            return;
        }

        const zip = new JSZip();
        for (const file of files) {
            if (file.name.endsWith(".stats")) {
                const content = await file.text();
                const convertedContent = convertStatsToTxt(content);
                const newFileName = file.name.replace(".stats", ".txt");
                zip.file(newFileName, convertedContent);
            }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const utcTimestamp = new Date().toISOString().replace(/[-:.]/g, "");
        const zipFileName = `OTIOSE_converted_txt_${utcTimestamp}.zip`;

        downloadButton.href = URL.createObjectURL(zipBlob);
        downloadButton.download = zipFileName;
        downloadButton.style.display = "block";
        feedback.textContent = "Conversion completed. Download your files.";
    });

    function convertStatsToTxt(statsContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(statsContent, "text/xml");

        const statObjects = xmlDoc.querySelectorAll("stat_object");
        let txtContent = "";

        statObjects.forEach((statObject) => {
            const fields = statObject.querySelectorAll("field");

            fields.forEach((field) => {
                const name = field.getAttribute("name");
                const value = field.getAttribute("value");
                const type = field.getAttribute("type");

                if (name === "Name") {
                    txtContent += `new entry "${value}"\n`;
                } else if (name === "Using") {
                    txtContent += `using "${value}"\n`;
                } else {
                    txtContent += `data "${name}" "${value}"\n`;
                }
            });
            txtContent += "\n";
        });

        return txtContent.trim();
    }
});
