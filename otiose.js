// File: OTIOSE - Optimized Translation for Instantaneous Output with Seamless Efficiency

// Import required libraries
import { create } from 'xmlbuilder2'; // XML builder library

// Function to handle .txt to .stats conversion
function txtToStats(txtContent) {
    // Parse .txt content line by line
    const lines = txtContent.split('\n');

    // Initialize XML structure
    const xmlDoc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('stats');

    lines.forEach((line) => {
        // Skip empty lines
        if (!line.trim()) return;

        // Parse key-value pairs (assuming format: key=value)
        const [key, value] = line.split('=');

        if (key && value) {
            xmlDoc.ele('entry', { key: key.trim(), value: value.trim() });
        }
    });

    // Convert the XML structure to a string
    const statsContent = xmlDoc.end({ prettyPrint: true });

    return statsContent;
}

// Drag-and-drop UI setup
export function setupDragAndDrop() {
    const dropArea = document.getElementById('drop-area');

    // Prevent default behaviors for drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    // Highlight on dragover
    dropArea.addEventListener('dragover', () => {
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    // Handle file drop
    dropArea.addEventListener('drop', (e) => {
        dropArea.classList.remove('highlight');
        const files = e.dataTransfer.files;

        if (files.length) {
            const file = files[0];
            const reader = new FileReader();

            reader.onload = () => {
                const convertedStats = txtToStats(reader.result);
                handleDownload(`${file.name.replace(/\\.txt$/, '')}.stats`, convertedStats);
            };

            reader.readAsText(file);
        }
    });
}

// For Vercel or browser-based, handle file downloads
export function handleDownload(filename, content) {
    const blob = new Blob([content], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export { txtToStats };
