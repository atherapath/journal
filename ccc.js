// Get the main elements
const editor = document.getElementById('content-editor');
const viewer = document.getElementById('markdown-viewer'); 
const btnCreate = document.getElementById('btn-create');
const btnSelect = document.getElementById('btn-select');
const btnAmend = document.getElementById('btn-amend');
const btnArchive = document.getElementById('btn-archive'); // NEW ARCHIVE BUTTON REFERENCE

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


// --- SIMPLE MARKDOWN RENDERING FUNCTION ---
const renderMarkdown = (markdown) => {
    // 1. Basic Block processing (H1, H2, H3)
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3
        .replace(/^## (.*$)/gim, '<h2>$1</h2>') // h2
        .replace(/^# (.*$)/gim, '<h1>$1</h1>') // h1
        .replace(/\n/g, '<br>'); 

    // 2. Simple List processing (Must happen before inline tags)
    let inList = false;
    const lines = html.split('<br>');
    let processedHtml = '';
    
    lines.forEach(line => {
        if (line.trim().startsWith('- ')) {
            if (!inList) {
                processedHtml += '<ul>';
                inList = true;
            }
            processedHtml += '<li>' + line.substring(line.indexOf('- ') + 2) + '</li>';
        } else {
            if (inList) {
                processedHtml += '</ul>';
                inList = false;
            }
            processedHtml += line + '<br>'; 
        }
    });

    if (inList) {
        processedHtml += '</ul>';
    }
    html = processedHtml;

    // 3. Inline processing (Bold/Italic)
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *italic*

    return html;
};


// --- CORE LOGIC: CREATE / SMART-CLOSE / PREVIEW TOGGLE ---
btnCreate.addEventListener('click', () => {
    
    if (editor.classList.contains('hidden')) {
        // --- ACTION: CREATE (Open Editor) ---
        
        // 1. Ensure the viewer is hidden
        viewer.classList.add('hidden');
        viewer.innerHTML = '';

        // 2. Show the editor
        editor.classList.remove('hidden');
        
        // 3. Update button text
        btnCreate.textContent = 'Close';
        
    } else {
        // --- ACTION: CLOSE (Smart Check) ---
        
        const logContent = editor.value.trim();
        
        // 1. Auto-close any floating menu 
        if (currentOpenMenu) {
            currentOpenMenu.classList.add('hidden');
            currentOpenMenu = null;
            document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
        }
        
        if (logContent.length > 0) {
            // --- Content Exists: Switch to Preview Mode ---
            
            // a. Render the content
            const htmlContent = renderMarkdown(logContent);
            viewer.innerHTML = htmlContent;
            
            // b. Hide editor, Show viewer
            editor.classList.add('hidden');
            viewer.classList.remove('hidden');

            // c. Update button text
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


// --- ARCHIVE LOGIC (Now bound to a dedicated dock button) ---
const handleArchiveSave = () => {
    const logContent = editor.value.trim();

    if (editor.classList.contains('hidden') || !logContent) {
        alert("Please 'Create' the editor and enter content before archiving.");
        return;
    }
    
    // We want to archive the content as seen in the text editor, not the previewer.

    // 1. Extract the first line
    const firstLine = logContent.split('\n')[0].trim();
    
    // 2. Replace ALL spaces with underscores
    let filename = firstLine.replace(/\s+/g, '_');
    
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


// --- MENU CONTENT GENERATION ---

// 1. SELECT Menu (Untouched)
const createSelectMenu = () => {
    const buttons = [
        ['Line', 'menu-button', 'selectLine'], 
        ['Left', 'menu-button nav', 'moveLeft'],
        ['Right', 'menu-button nav', 'moveRight'],
        ['Block', 'menu-button', 'selectBlock'],
        ['Word', 'menu-button', 'selectWord'],
        ['All', 'menu-button', 'selectAll'], 
    ];

    selectMenu.innerHTML = ''; 
    buttons.forEach(data => {
        const button = document.createElement('button');
        button.textContent = data[0];
        button.className = data[1];
        button.dataset.action = data[2];
        selectMenu.appendChild(button);
    });
};
createSelectMenu(); 


// 2. AMEND Menu (Archive button removed from this list)
const createAmendMenu = () => {
    const buttons = [
        ['Copy', 'menu-button amend', 'copy'],
        ['Cut', 'menu-button amend', 'cut'], 
        ['Delete', 'menu-button amend', 'delete'],
        ['Enter', 'menu-button amend', 'enter'], 
        // Archive removed here
    ];

    amendMenu.innerHTML = '';
    buttons.forEach(data => {
        const button = document.createElement('button');
        button.textContent = data[0];
        button.className = data[1];
        button.dataset.command = data[2];
        amendMenu.appendChild(button);
    });
};
createAmendMenu(); 


// --- COMPLEX SELECTION LOGIC (Untouched) ---

const getLine = (text, position) => {
    const lines = text.split('\n');
    let cumulativeLength = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length;
        if (position >= cumulativeLength && position <= cumulativeLength + lineLength + 1) {
            return { start: cumulativeLength, end: cumulativeLength + lineLength, lineNumber: i, lineText: lines[i] };
        }
        cumulativeLength += lineLength + 1;
    }
    return null;
};
const handleMovement = (direction) => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const isSelected = start !== end;
    const text = editor.value;
    let newStart = start;
    let newEnd = end;
    if (direction === 'Left' || direction === 'Right') {
        if (isSelected) {
            if (direction === 'Left') {
                newEnd = Math.max(start, end - 1);
            } else {
                newEnd = Math.min(text.length, end + 1);
            }
        } else {
            newStart = direction === 'Left' ? Math.max(0, start - 1) : Math.min(text.length, start + 1);
            newEnd = newStart;
        }
    }
    editor.selectionStart = newStart;
    editor.selectionEnd = newEnd;
    focusEditor();
};
const handleSelectLine = () => {
    const text = editor.value;
    const pos = editor.selectionStart;
    const lineInfo = getLine(text, pos);
    if (lineInfo) {
        editor.selectionStart = lineInfo.start;
        editor.selectionEnd = lineInfo.end;
    }
    focusEditor();
};
const handleSelectBlock = () => {
    const text = editor.value;
    const pos = editor.selectionStart;
    let blockStart = pos;
    while (blockStart > 0) {
        if (text[blockStart - 1] === '\n' && (blockStart - 2 < 0 || text[blockStart - 2] === '\n')) {
            blockStart = blockStart;
            break;
        }
        blockStart--;
    }
    let blockEnd = pos;
    while (blockEnd < text.length) {
        if (text[blockEnd] === '\n' && (blockEnd + 1 >= text.length || text[blockEnd + 1] === '\n')) {
            break;
        }
        blockEnd++;
    }
    editor.selectionStart = blockStart;
    editor.selectionEnd = blockEnd;
    focusEditor();
};
const handleSelectWord = () => {
    const text = editor.value;
    const pos = editor.selectionStart;
    let wordStart = pos;
    let wordEnd = pos;
    while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
        wordStart--;
    }
    while (wordEnd < text.length && /\S/.test(text[wordEnd])) {
        wordEnd++;
    }
    editor.selectionStart = wordStart;
    editor.selectionEnd = wordEnd;
    focusEditor();
};

// --- MENU EVENT LISTENERS ---

// 1. SELECT Menu Handler
btnSelect.addEventListener('click', () => {
    if (!editor.classList.contains('hidden')) { 
        toggleMenu(selectMenu, btnSelect);
    }
});

selectMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'moveLeft':
        case 'moveRight':
            handleMovement(action.replace('move', ''));
            break;
        case 'selectLine':
            handleSelectLine();
            break;
        case 'selectBlock':
            handleSelectBlock();
            break;
        case 'selectWord':
            handleSelectWord();
            break;
        case 'selectAll':
            editor.select();
            focusEditor();
            break;
    }
});


// 2. AMEND Menu Handler
btnAmend.addEventListener('click', () => {
    if (!editor.classList.contains('hidden')) { 
        toggleMenu(amendMenu, btnAmend);
    }
});

amendMenu.addEventListener('click', (e) => {
    const command = e.target.dataset.command;
    if (!command) return;

    if (command === 'enter') {
        // --- RELIABLE NEWLINE INSERTION LOGIC ---
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const newline = '\n'; 
        
        editor.value = editor.value.substring(0, start) + newline + editor.value.substring(end);
        
        editor.selectionStart = start + newline.length;
        editor.selectionEnd = editor.selectionStart;

    } else {
        // Standard copy/cut/delete
        document.execCommand(command);
    }
    
    if (command === 'copy' || command === 'cut') {
        alert(`Selection ${command} to clipboard!`);
    }
    
    focusEditor();
});


// --- NEW LINE MACRO (The "Tiny Snippet") ---
editor.addEventListener('input', () => {
    const searchPhrase = /New line/gi; 
    const replacement = '\n'; 

    const originalValue = editor.value;
    const newValue = originalValue.replace(searchPhrase, replacement);

    if (originalValue !== newValue) {
        
        const lengthDifference = originalValue.length - newValue.length;
        const currentCursorPos = editor.selectionStart;
        
        editor.value = newValue;
        
        editor.selectionStart = currentCursorPos - lengthDifference;
        editor.selectionEnd = editor.selectionStart;
    }
});
