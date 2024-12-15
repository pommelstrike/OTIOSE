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

// Function to convert .txt content to .stats using field definitions
function txtToStatsWithFields(txtContent) {
    const statObjectDefinitionId = "e2a8d59b-0e34-4a7c-bf5f-db7a2bb34cde";
    const lines = txtContent.split("\n");
    let xmlContent = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xmlContent += `<stats stat_object_definition_id="${statObjectDefinitionId}">\n`;
    xmlContent += "  <stat_objects>\n";
    xmlContent += "    <stat_object is_substat=\"false\">\n";
    xmlContent += "      <fields>\n";

    const fieldDefinitions = {
        IntegerTableFieldDefinition: [
            "Level", "AreaRadius", "ExplodeRadius", "ProjectileDelay", "Lifetime", "SurfaceRadius", "Range"
        ],
        StringTableFieldDefinition: ["SpellContainerID", "TooltipDamageList", "DescriptionParams"],
        TranslatedStringTableFieldDefinition: ["DisplayName", "Description", "ShortDescription"]
        // Add other field definitions as necessary
    };

    lines.forEach((line) => {
        if (line.trim() === "") {
            xmlContent += "      </fields>\n";
            xmlContent += "    </stat_object>\n";
            xmlContent += "    <stat_object is_substat=\"false\">\n";
            xmlContent += "      <fields>\n";
            return;
        }

        if (line.startsWith("new entry ")) {
            const value = line.slice(10).trim();
            xmlContent += `        <field name=\"Name\" type=\"NameTableFieldDefinition\" value=\"${value}\" />\n`;
        } else if (line.startsWith("data ")) {
            const parts = line.split('"');
            const fieldName = parts[1];
            const fieldValue = parts[3];

            let fieldType = "StringTableFieldDefinition"; // Default type
            if (fieldDefinitions.IntegerTableFieldDefinition.includes(fieldName)) {
                fieldType = "IntegerTableFieldDefinition";
            } else if (fieldDefinitions.TranslatedStringTableFieldDefinition.includes(fieldName)) {
                fieldType = "TranslatedStringTableFieldDefinition";
            }

            xmlContent += `        <field name=\"${fieldName}\" type=\"${fieldType}\" value=\"${fieldValue}\" />\n`;
        }
    });

    xmlContent += "      </fields>\n";
    xmlContent += "    </stat_object>\n";
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

            for (const file of files) {
                const fileContent = await file.text();
                const convertedStats = txtToStatsWithFields(fileContent);
                const newFileName = file.name.replace(/\.txt$/, '.stats');
                zip.file(newFileName, convertedStats);
            }

            zip.generateAsync({ type: 'blob' }).then((content) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = 'converted_files.zip';
                link.click();
            });
        }
    });
}

// Initialize drag-and-drop functionality
setupDragAndDrop();
