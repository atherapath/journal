// Get the main elements
const editor = document.getElementById('content-editor');
const viewer = document.getElementById('markdown-viewer'); 
const btnCreate = document.getElementById('btn-create');
const btnSelect = document.getElementById('btn-select');
const btnAmend = document.getElementById('btn-amend');
const btnArchive = document.getElementById('btn-archive'); 

// NEW: Load MD elements
const btnLoad = document.getElementById('btn-load');
const fileInput = document.getElementById('file-input');
// END NEW

const selectMenu = document.getElementById('select-menu');
const amendMenu = document.getElementById('amend-menu');

// State to track which menu is open
let currentOpenMenu = null;

// --- UTILITY FUNCTIONS ---

// Function to safely focus the editor
const focusEditor = () => {
    if (!editor.classList.contains('hidden')) {
        editor.focus();
    }
};

// Function to toggle a floating menu
const toggleMenu = (menuElement, associatedButton) => {
    if (editor.classList.contains('hidden')) {
        alert("Please 'Create' the editor first to use this menu.");
        return;
    }
    
    // If we click the button for the menu that is already open, close it.
    if (menuElement === currentOpenMenu) {
        menuElement.classList.add('hidden');
        currentOpenMenu = null;
        associatedButton.classList.remove('active'); 
    } else {
        // Close the currently open menu, if any
        if (currentOpenMenu) {
            currentOpenMenu.classList.add('hidden');
            document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
        }
        
        // Open the new menu
        menuElement.classList.remove('hidden');
        currentOpenMenu = menuElement;
        associatedButton.classList.add('active');
    }

    focusEditor();
};


/**
 * Loads content from a selected .md file into the text area.
 * This is triggered by the 'change' event on the hidden file input.
 */
const loadMDFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Safety check for file type
    if (file.name.split('.').pop().toLowerCase() !== 'md') {
        alert('Please select a valid Markdown (.md) file.');
        event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        
        // 1. Load content into the editor
        editor.value = content;
        
        // 2. Ensure editor is visible and update the create button text
        if (editor.classList.contains('hidden')) {
            viewer.classList.add('hidden');
            editor.classList.remove('hidden');
        }
        btnCreate.textContent = 'Close';
    };

    // Read the file as text
    reader.readAsText(file);
    
    // Reset the input value so the change event fires even if the same file is selected next time
    event.target.value = '';
    
    focusEditor();
};


// --- SIMPLE MARKDOWN RENDERING FUNCTION (NOW USES TRAILING SPACES FOR <BR>) ---
const renderMarkdown = (markdown) => {
    // 0. Trailing Spaces for <br>: Find two or more spaces at the end of a line followed by a newline
    // We do this first so the spaces aren't consumed by other rules.
    let html = markdown.replace(/ {2,}\n/g, '<br>');

    // 1. Horizontal Rule (HR): Three or more hyphens or underscores on a line
    html = html.replace(/^(\s*[-_]{3,}\s*)$/gim, '<hr>');

    // 2. Basic Block processing (H1, H2, H3, Blockquote)
    html = html
        .replace(/^∆ (.*$)/gim, '<blockquote>$1</blockquote>') // Blockquotes (Your custom Delta symbol)
        .replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3
        .replace(/^## (.*$)/gim, '<h2>$2</h2>') // h2
        .replace(/^# (.*$)/gim, '<h1>$1</h1>'); // h1

    // 3. Simple List processing (Must happen before inline tags)
    // NOTE: This must handle the remaining newline characters, \n, to correctly split lines.
    let inList = false;
    // We split on \n instead of <br> now!
    const lines = html.split('\n'); 
    let processedHtml = '';
    
    lines.forEach(line => {
        // Handle list items:
        if (line.trim().startsWith('- ')) { 
            if (!inList) {
                processedHtml += '<ul>';
            }
            // Add list item and a newline for the next split iteration
            processedHtml += '<li>' + line.substring(line.indexOf('- ') + 2) + '</li>';
            inList = true;
        } else {
            if (inList) {
                processedHtml += '</ul>';
                inList = false;
            }
            // Only add a line if it's not a list item, and replace the structural newlines
            // with a simple space or nothing to prevent unwanted <br>
            if (line.trim() !== '') {
                processedHtml += line + '\n';
            }
        }
    });

    if (inList) {
        processedHtml += '</ul>';
    }
    // Final cleanup: Replace remaining single newlines with spaces to prevent gaps
    html = processedHtml.replace(/\n/g, ' '); 

    // 4. Inline processing (Bold/Italic)
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *italic*

    return html.trim(); // Trim final whitespace
};



// --- CORE LOGIC: CREATE / SMART-CLOSE / PREVIEW TOGGLE (Untouched) ---
btnCreate.addEventListener('click', () => {
    
    if (editor.classList.contains('hidden')) {
        // --- ACTION: CREATE (Open Editor) ---
        viewer.classList.add('hidden');
        viewer.innerHTML = '';
        editor.classList.remove('hidden');
        btnCreate.textContent = 'Close';
        
    } else {
        // --- ACTION: CLOSE (Smart Check) ---
        
        const logContent = editor.value.trim();
        
        if (currentOpenMenu) {
            currentOpenMenu.classList.add('hidden');
            currentOpenMenu = null;
            document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
        }
        
        if (logContent.length > 0) {
            // --- Content Exists: Switch to Preview Mode ---
            const htmlContent = renderMarkdown(logContent);
            viewer.innerHTML = htmlContent;
            editor.classList.add('hidden');
            viewer.classList.remove('hidden');
            btnCreate.textContent = 'Create'; 

        } else {
            // --- No Content: Close Editor Only ---
            editor.classList.add('hidden');
            viewer.classList.add('hidden');
            btnCreate.textContent = 'Create';
        }
    }

    focusEditor();
});


// --- ARCHIVE LOGIC (FILENAME FIX APPLIED HERE) ---
const handleArchiveSave = () => {
    const logContent = editor.value.trim();

    if (editor.classList.contains('hidden') || !logContent) {
        alert("Please 'Create' the editor and enter content before archiving.");
        return;
    }
    
    // 1. Extract the first line
    const firstLine = logContent.split('\n')[0].trim();
    
    // NEW STEP: Remove leading Markdown hashes (#) and spaces
    let cleanedFirstLine = firstLine.replace(/^[#\s]+/, '').trim();
    
    // 2. Replace ALL spaces with underscores
    let filename = cleanedFirstLine.replace(/\s+/g, '_');
    
    // 3. Append the required extension
    filename = filename + '.md'; 

    // FALLBACK: If the filename is empty
    if (filename.length < 5) {
         const dateSuffix = '_' + new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
         filename = 'Sovereign_Log_Entry' + dateSuffix + '.md';
    }

    // 4. Trigger the download using the trusted Blob method
    const blob = new Blob([logContent], {type: 'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; 
    document.body.appendChild(a);
    
    a.click(); 
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Markdown Log prepared for download. Look for '${filename}' in your Downloads folder.`);
};

// Bind the Archive function to the new dock button
btnArchive.addEventListener('click', handleArchiveSave);


// --- MENU CONTENT GENERATION (Untouched) ---

// 1. SELECT Menu (Untouched)
const createSelectMenu = () => {
    const buttons = [
        ['Line', 'menu-button', 'selectLine'], 
        ['Left', 'menu-button nav', 'moveLeft'],
        ['Right', 'menu-button nav', 'moveRight'],
        ['Block', 'menu-button', 'selectBlock
