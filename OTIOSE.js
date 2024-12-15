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

// Function to convert .txt content to .stats (XML format) with nested structures
function txtToStats(txtContent) {
    const lines = txtContent.split('\n');
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<stats>\n';

    // Temporary storage for building object structure
    let currentObjectName = '';
    let currentObjectFields = [];

    lines.forEach((line) => {
        if (!line.trim()) return; // Skip empty lines

        const [key, value] = line.split('=');

        if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim();

            if (StatsData.IgnoreFields.includes(trimmedKey)) {
                // Skip ignored fields
                return;
            }

            if (trimmedKey === 'Name') {
                // Close previous object if it exists
                if (currentObjectName) {
                    xmlContent += `  <object name="${currentObjectName}">\n`;
                    currentObjectFields.forEach(field => {
                        xmlContent += `    <field name="${field.name}" type="${field.type}" value="${field.value}" />\n`;
                    });
                    xmlContent += '  </object>\n';
                }

                // Start a new object
                currentObjectName = trimmedValue;
                currentObjectFields = [];
            } else {
                // Determine type of the field based on key
                let fieldType = 'StringTableFieldDefinition';

                if (!isNaN(trimmedValue)) {
                    fieldType = 'IntegerTableFieldDefinition';
                } else if (StatsData.SpellTypes.includes(trimmedKey)) {
                    fieldType = 'SpellData';
                } else if (StatsData.StatusTypes.includes(trimmedKey)) {
                    fieldType = 'StatusData';
                }

                // Add field to the current object
                currentObjectFields.push({ name: trimmedKey, type: fieldType, value: trimmedValue });
            }
        }
    });

    // Close the last object
    if (currentObjectName) {
        xmlContent += `  <object name="${currentObjectName}">\n`;
        currentObjectFields.forEach(field => {
            xmlContent += `    <field name="${field.name}" type="${field.type}" value="${field.value}" />\n`;
        });
        xmlContent += '  </object>\n';
    }

    xmlContent += '</stats>';
    return xmlContent;
}

function buildStatsHeader(rawDataList) {
    const header = {};

    rawDataList.forEach((line) => {
        const [key, value] = line.split('=');
        if (StatsData.HeaderFields.includes(key.trim())) {
            header[key.trim()] = value.trim();
        }
    });

    return header;
}

function buildStatsFooter(rawDataList) {
    return { newline: ['\n'] };
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
                const convertedStats = txtToStats(fileContent);
                const newFileName = file.name.replace(/\\.txt$/, '.stats');
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
