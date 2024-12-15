// Revised JavaScript for .stats to .txt Conversion
document.getElementById("drop-area").addEventListener("drop", async (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const output = [];

    for (const file of files) {
        if (file.name.endsWith(".stats")) {
            const content = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, "application/xml");

            const statObjects = xmlDoc.getElementsByTagName("stat_object");
            for (const statObject of statObjects) {
                const fields = statObject.getElementsByTagName("field");
                const entry = {};

                for (const field of fields) {
                    const name = field.getAttribute("name");
                    const value = field.getAttribute("value");
                    const type = field.getAttribute("type");

                    if (name === "Name") {
                        entry.name = value;
                    } else if (name === "Using") {
                        entry.using = mapUUIDToClassName(value); // Convert UUID to class name.
                    } else if (name !== "UUID") {
                        // Exclude UUID entirely.
                        entry.data = entry.data || [];
                        entry.data.push({ name, value, type });
                    }
                }

                // Format the entry into .txt syntax.
                const formattedEntry = formatToTXT(entry);
                output.push(formattedEntry);
            }
        }
    }

    // Generate .txt file for download.
    const txtBlob = new Blob([output.join("\n")], { type: "text/plain;charset=utf-8" });
    const downloadLink = document.getElementById("downloadButton");
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);
    downloadLink.href = URL.createObjectURL(txtBlob);
    downloadLink.download = `OTIOSE_converted_${timestamp}.txt`;
    downloadLink.style.display = "block";
    document.getElementById("feedback").textContent = "Conversion complete. Download your file below!";
});

// Helper: Map UUIDs to class names (example logic).
function mapUUIDToClassName(uuid) {
    const uuidMapping = {
        "c565700c-fcf7-4d1a-ab5a-ba01a31b73f4": "MAG_EndGame_HalfPlate",
        "52656f91-a0d2-42b6-8eaa-2da9a0b671f9": "UNI_DarkUrge_Bhaal_Cloak",
        // Add more mappings as needed.
    };
    return uuidMapping[uuid] || uuid;
}

// Helper: Format entry to .txt syntax.
function formatToTXT(entry) {
    const lines = [];

    // Add the new entry line.
    lines.push(`new entry "${entry.name}"`);

    // Add the type line if available.
    if (entry.type) {
        lines.push(`type "${entry.type}"`);
    }

    // Add the using line.
    if (entry.using) {
        lines.push(`using "${entry.using}"`);
    }

    // Add data fields.
    if (entry.data) {
        entry.data.forEach((field) => {
            lines.push(`data "${field.name}" "${field.value}"`);
        });
    }

    // Return the formatted entry as a string.
    return lines.join("\n");
}

// Prevent default drag behavior for cleaner UI.
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.getElementById("drop-area").addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
});
