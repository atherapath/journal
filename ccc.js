

// Get the main elements
const editor = document.getElementById('content-editor');
const btnCreate = document.getElementById('btn-create');
const btnSelect = document.getElementById('btn-select');
const btnAmend = document.getElementById('btn-amend');

const selectMenu = document.getElementById('select-menu');
const amendMenu = document.getElementById('amend-menu');

// State to track which menu is open
let currentOpenMenu = null;

// Get references for the new small-btn elements
const starBtn = document.getElementById('star-btn');
const hyphenBtn = document.getElementById('hyphen-btn');

// Function to handle the insertion of a special character
// NOTE: This reuses the reliable insertion logic currently only found inside the AMEND menu 'enter' command.
const handleSpecialCharInsertion = (char) => {
    if (editor.classList.contains('hidden')) {
        alert("Please 'Create' a text editor first.");
        return;
    }
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    
    // Insert the character by rebuilding the text
    editor.value = editor.value.substring(0, start) + char + editor.value.substring(end);
    
    // Move the cursor position after the inserted character
    editor.selectionStart = start + char.length;
    editor.selectionEnd = editor.selectionStart;

    focusEditor();
};

/// Variable to track the timer for a long press
let pressTimer;
// Define the duration for a long press (e.g., 500 milliseconds = 0.5 seconds)
const LONG_PRESS_DURATION = 500; 

// --- START: Define a reusable function to clear the timer and prevent default ---
const cancelPress = (e) => {
    if (pressTimer) {
        clearTimeout(pressTimer);
    }
    pressTimer = null;
    // VERY IMPORTANT: Stop the default behavior that dismisses the keyboard
    if (e && e.cancelable) {
        e.preventDefault();
    }
};

// --- END: Define a reusable function to clear the timer and prevent default ---


// 1. TOUCH START (REPLACES MOUSE DOWN)
starBtn.addEventListener('touchstart', (e) => {
    // Prevent the default touch-hold behavior (context menu, keyboard dismissal)
    e.preventDefault(); 
    e.stopPropagation();

    // Clear any previous timer just in case
    cancelPress(null);
    
    // Start the timer for a long press
    pressTimer = setTimeout(() => {
        handleSpecialCharInsertion('★'); // LONG PRESS: Insert the decorative star
        cancelPress(e); // Cancel timer and prevent default immediately after action
    }, LONG_PRESS_DURATION);
}, { passive: false }); // { passive: false } allows us to use preventDefault inside the listener


// 2. TOUCH END (REPLACES MOUSE UP)
starBtn.addEventListener('touchend', (e) => {
    // If the touch lifted AND the timer is still running, it was a short press.
    if (pressTimer) {
        clearTimeout(pressTimer);
        handleSpecialCharInsertion('*'); // SHORT PRESS: Insert the Markdown asterisk
    }
    cancelPress(e);
}, { passive: false });


// 3. TOUCH CANCEL (REPLACES MOUSE LEAVE) - Important if finger slides off or an interrupt occurs
starBtn.addEventListener('touchcancel', (e) => {
    cancelPress(e);
});


// We keep the mouse listeners for desktop/mouse fallback, but simplify them:

starBtn.addEventListener('mousedown', (e) => {
    cancelPress(null);
    pressTimer = setTimeout(() => {
        handleSpecialCharInsertion('★');
        cancelPress(e);
    }, LONG_PRESS_DURATION);
});

starBtn.addEventListener('mouseup', (e) => {
    if (pressTimer) {
        handleSpecialCharInsertion('*');
    }
    cancelPress(e);
});

starBtn.addEventListener('mouseleave', cancelPress);



hyphenBtn.addEventListener('click', () => {
    handleSpecialCharInsertion('-');
});

// --- UTILITY FUNCTIONS ---

// Function to safely focus the editor
const focusEditor = () => {
    if (!editor.classList.contains('hidden')) {
        editor.focus();
    }
};

// Function to toggle a floating menu
const toggleMenu = (menuElement, associatedButton) => {
    // If we click the button for the menu that is already open, close it.
    if (menuElement === currentOpenMenu) {
        menuElement.classList.add('hidden');
        currentOpenMenu = null;
        associatedButton.classList.remove('active'); 
    } else {
        // Close the currently open menu, if any
        if (currentOpenMenu) {
            currentOpenMenu.classList.add('hidden');
            // Remove 'active' class from all dock buttons
            document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
        }
        
        // Open the new menu
        menuElement.classList.remove('hidden');
        currentOpenMenu = menuElement;
        associatedButton.classList.add('active');
    }

    focusEditor();
};


// --- CORE LOGIC: CREATE (EDITOR TOGGLE) ---
btnCreate.addEventListener('click', () => {
    editor.classList.toggle('hidden');
    
    // Auto-close any floating menu when editor is closed
    if (editor.classList.contains('hidden')) {
        if (currentOpenMenu) {
            currentOpenMenu.classList.add('hidden');
            currentOpenMenu = null;
        }
        document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
        btnCreate.textContent = 'Create';
    } else {
        btnCreate.textContent = 'Close';
    }

    focusEditor();
});


// --- MENU CONTENT GENERATION ---

// 1. SELECT Menu (Cursor Movement, Line/Block/Word Selection)
const createSelectMenu = () => {
    // Button data: [text, class, actionName]
    const buttons = [
        ['Line', 'menu-button', 'selectLine'], 
        ['Left', 'menu-button nav', 'moveLeft'],
        ['Right', 'menu-button nav', 'moveRight'],
        ['Block', 'menu-button', 'selectBlock'],
        ['Word', 'menu-button', 'selectWord'],
        ['All', 'menu-button', 'selectAll'], 
    ];

    selectMenu.innerHTML = ''; // Clear previous buttons
    buttons.forEach(data => {
        const button = document.createElement('button');
        button.textContent = data[0];
        button.className = data[1];
        button.dataset.action = data[2];
        selectMenu.appendChild(button);
    });
};
createSelectMenu(); 

// 2. AMEND Menu (Copy, Cut, Delete, Enter)
const createAmendMenu = () => {
    // Button data: [text, class, command]
    const buttons = [
        ['Copy', 'menu-button amend', 'copy'],
        ['Cut', 'menu-button amend', 'cut'], 
        ['Delete', 'menu-button amend', 'delete'],
        ['Enter', 'menu-button amend', 'enter'], // <<< ADDED ENTER BUTTON
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


// --- COMPLEX SELECTION LOGIC (Line/Block/Word) ---

// Helper to find the line info at a given position (cursor)
const getLine = (text, position) => {
    const lines = text.split('\n');
    let cumulativeLength = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length;
        if (position >= cumulativeLength && position <= cumulativeLength + lineLength + 1) {
            return {
                start: cumulativeLength,
                end: cumulativeLength + lineLength,
                lineNumber: i,
                lineText: lines[i]
            };
        }
        cumulativeLength += lineLength + 1;
    }
    return null;
};

// Helper to find the start/end of a line by its index
const getLineStartEnd = (text, lineNumber) => {
    const lines = text.split('\n');
    let start = 0;
    for (let i = 0; i < lineNumber; i++) {
        start += lines[i].length + 1;
    }
    const end = start + lines[lineNumber].length;
    return { start, end };
}

// Function to move the selection/cursor left/right
const handleMovement = (direction) => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const isSelected = start !== end;
    const text = editor.value;

    let newStart = start;
    let newEnd = end;

    if (direction === 'Left' || direction === 'Right') {
        // Standard single character movement or extension of selection
        if (isSelected) {
            // Extend/Contract selection 
            if (direction === 'Left') {
                newEnd = Math.max(start, end - 1);
            } else {
                newEnd = Math.min(text.length, end + 1);
            }
        } else {
            // No selection, just move cursor
            newStart = direction === 'Left' ? Math.max(0, start - 1) : Math.min(text.length, start + 1);
            newEnd = newStart;
        }
    }

    // Apply the new selection/cursor position
    editor.selectionStart = newStart;
    editor.selectionEnd = newEnd;
    focusEditor();
};


// Function to select the entire line at the cursor
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

// Function to select the whole paragraph/block of text (defined by line breaks)
const handleSelectBlock = () => {
    const text = editor.value;
    const pos = editor.selectionStart;

    // Find the start of the current block
    let blockStart = pos;
    while (blockStart > 0) {
        if (text[blockStart - 1] === '\n' && (blockStart - 2 < 0 || text[blockStart - 2] === '\n')) {
            blockStart = blockStart; // Keep cursor just after line break
            break;
        }
        blockStart--;
    }
    
    // Find the end of the current block
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

// Function to select the word at the cursor
const handleSelectWord = () => {
    const text = editor.value;
    const pos = editor.selectionStart;
    let wordStart = pos;
    let wordEnd = pos;

    // Find word start
    while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
        wordStart--;
    }

    // Find word end
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
    if (editor.classList.contains('hidden')) {
        alert("Please 'Create' a text editor first.");
        return;
    }
    toggleMenu(selectMenu, btnSelect);
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


// 2. AMEND Menu Handler (Includes Enter button logic)
btnAmend.addEventListener('click', () => {
    if (editor.classList.contains('hidden')) {
        alert("Please 'Create' a text editor first.");
        return;
    }
    toggleMenu(amendMenu, btnAmend);
});

amendMenu.addEventListener('click', (e) => {
    const command = e.target.dataset.command;
    if (!command) return;

    if (command === 'enter') {
        // --- RELIABLE NEWLINE INSERTION LOGIC ---
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const newline = '\n'; // This is the actual line break character
        
        // Insert the newline character by rebuilding the text
        editor.value = editor.value.substring(0, start) + newline + editor.value.substring(end);
        
        // Move the cursor position after the new line
        editor.selectionStart = start + newline.length;
        editor.selectionEnd = editor.selectionStart;

    } else {
        // Execute the native browser command (copy, cut, delete)
        document.execCommand(command);
    }
    
    if (command === 'copy' || command === 'cut') {
        alert(`Selection ${command} to clipboard!`);
    }
    
    focusEditor();
});


// --- NEW LINE MACRO (The "Tiny Snippet") ---
editor.addEventListener('input', () => {
    // We use a regex to look for "New line" (case-insensitive, globally)
    const searchPhrase = /New line/gi; 
    const replacement = '\n'; // This is the actual line break character

    const originalValue = editor.value;
    const newValue = originalValue.replace(searchPhrase, replacement);

    // Only update the editor if a substitution was made
    if (originalValue !== newValue) {
        
        // This calculates where the cursor should go after replacement
        const lengthDifference = originalValue.length - newValue.length;
        const currentCursorPos = editor.selectionStart;
        
        // Update the value
        editor.value = newValue;
        
        // Set the cursor position to where it should be after the replacement
        // This is complex, but generally moves the cursor back by the length of the removed text
        editor.selectionStart = currentCursorPos - lengthDifference;
        editor.selectionEnd = editor.selectionStart;
    }
});
