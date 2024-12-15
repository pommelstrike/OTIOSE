// OTIOSE.js

// Stats Data Definitions
const StatsData = {
    IgnoreFields: [
        "UUID", "type", "is_substat", "TranslatedStringTableFieldDefinition", "StringTableFieldDefinition",
        "NameTableFieldDefinition", "IdTableFieldDefinition", "EnumerationListTableFieldDefinition",
        "BaseClassTableFieldDefinition", "EnumerationTableFieldDefinition", "GuidObjectTableFieldDefinition",
        "CastAnimationsTableFieldDefinition", "IntegerTableFieldDefinition", "CommentTableFieldDefinition",
        "StatReferenceTableFieldDefinition", "StatusIdsTableFieldDefinition", "RootTemplateTableFieldDefinition",
        "FloatTableFieldDefinition", "DiceTableFieldDefinition"
    ],
    QuadFields: ["Proficiency Bonus Scaling", "ProficiencyBonus"],
    QuintFields: [
        "Properties", "PreviewCursor", "VerbalIntent", "SpellFlags", "SpellSchool", "HitAnimationType",
        "AnimationIntentType", "SpellStyleGroup", "DamageType", "Cooldown", "StatusPropertyFlags", "StatusGroups",
        "Rarity", "Autocast", "Weapon Group", "Weapon Properties", "Proficiency Group", "Damage Type",
        "IngredientType", "IngredientTransformType"
    ],
    SpellTypes: ["Projectile", "ProjectileStrike", "Rush", "Shout", "SpellSet", "Target", "Teleportation", "Throw", "Wall", "Zone"],
    StatusTypes: ["BOOST", "DOWNED", "EFFECT", "FEAR", "INCAPACITATED", "INVISIBLE", "KNOCKED_DOWN", "POLYMORPHED"],
    DescDisp: ["DisplayName", "Description"],
    StatTypes: ["Status", "Object", "Interrupt", "Passive", "Weapon", "Character"],
    HeaderFields: ["Name", "Using"]
};

// Helper Functions
function getFieldCount(value) {
    if (StatsData.QuintFields.includes(value)) return 5;
    if (StatsData.QuadFields.includes(value)) return 4;
    return 3;
}

function valueFilter(value) {
    return StatsData.IgnoreFields.includes(value) ? null : value;
}

function getStatType(name) {
    for (const type of StatsData.StatTypes) {
        if (name.includes(type)) {
            return type + "Data";
        }
    }
    for (const spellType of StatsData.SpellTypes) {
        if (name.includes(spellType)) {
            return "SpellData";
        }
    }
    return "Unknown";
}

function addQuotes(value) {
    return `"${value}"`;
}

// Function to convert .txt content to .stats using field definitions
function txtToStatsWithFields(txtContent) {
    const lines = txtContent.split("\n");
    const statObjectDefinitionId = "e988a674-28fe-49d2-a6ce-c5c1e0141f4c";

    let xmlContent = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xmlContent += `<stats stat_object_definition_id="${statObjectDefinitionId}">\n`;
    xmlContent += "  <stat_objects>\n";

    let currentObject = null;
    let fields = [];

    lines.forEach((line) => {
        line = line.trim();

        if (line.startsWith("new entry")) {
            // Write the previous stat object if one exists
            if (currentObject) {
                const uuid = crypto.randomUUID(); // Generate a unique UUID
                xmlContent += `    <stat_object is_substat="false">\n`;
                xmlContent += "      <fields>\n";
                xmlContent += `        <field name="UUID" type="IdTableFieldDefinition" value="${uuid}" />\n`;
                xmlContent += `        <field name="Name" type="NameTableFieldDefinition" value="${currentObject}" />\n`;
                fields.forEach((field) => {
                    xmlContent += `        <field name="${field.name}" type="${field.type}" value="${field.value}" />\n`;
                });
                xmlContent += "      </fields>\n";
                xmlContent += "    </stat_object>\n";
            }
            // Start a new stat object
            currentObject = line.split('"')[1]; // Extract the name
            fields = [];
        } else if (line.startsWith("type")) {
            const typeValue = line.split('"')[1];
            // This defines the category (e.g., "SpellData"), but it doesn't map directly to XML fields
        } else if (line.startsWith("using")) {
            const usingValue = line.split('"')[1];
            fields.push({ name: "Using", type: "BaseClassTableFieldDefinition", value: usingValue });
        } else if (line.startsWith("data")) {
            const parts = line.split('"');
            const fieldName = parts[1];
            const fieldValue = parts[3];

            // Determine the field type
            let fieldType = "StringTableFieldDefinition"; // Default type
            if (fieldName === "DisplayName" || fieldName === "Description") {
                fieldType = "TranslatedStringTableFieldDefinition";
            } else if (fieldName === "RootTemplate") {
                fieldType = "RootTemplateTableFieldDefinition";
            } else if (fieldName === "Weight") {
                fieldType = "FloatTableFieldDefinition";
            } else if (fieldName === "Rarity") {
                fieldType = "EnumerationTableFieldDefinition";
            }

            fields.push({ name: fieldName, type: fieldType, value: fieldValue });
        }
    });

    // Write the final stat object
    if (currentObject) {
        const uuid = crypto.randomUUID(); // Generate a unique UUID
        xmlContent += `    <stat_object is_substat="false">\n`;
        xmlContent += "      <fields>\n";
        xmlContent += `        <field name="UUID" type="IdTableFieldDefinition" value="${uuid}" />\n`;
        xmlContent += `        <field name="Name" type="NameTableFieldDefinition" value="${currentObject}" />\n`;
        fields.forEach((field) => {
            xmlContent += `        <field name="${field.name}" type="${field.type}" value="${field.value}" />\n`;
        });
        xmlContent += "      </fields>\n";
        xmlContent += "    </stat_object>\n";
    }

    xmlContent += "  </stat_objects>\n";
    xmlContent += "</stats>\n";

    return xmlContent;
}

// Function to handle drag-and-drop functionality
function setupDragAndDrop() {
    const dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    dropArea.addEventListener('dragover', () => {
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    dropArea.addEventListener('drop', async (e) => {
        dropArea.classList.remove('highlight');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const zip = new JSZip();
            const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, ''); // Format as YYYYMMDDTHHMMSS

            for (const file of files) {
                const fileContent = await file.text();
                const convertedStats = txtToStatsWithFields(fileContent);
                const newFileName = file.name.replace(/\.txt$/, '.stats');
                zip.file(newFileName, convertedStats);
            }

            zip.generateAsync({ type: 'blob' }).then((content) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `OTIOSE_files_${timestamp}.zip`;
                link.click();
            });
        }
    });
}

// Initialize drag-and-drop functionality
setupDragAndDrop();
