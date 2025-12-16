// Get the main elements
const editor = document.getElementById('content-editor');
const viewer = document.getElementById('markdown-viewer'); 
const btnCreate = document.getElementById('btn-create');
const btnSelect = document.getElementById('btn-select');
const btnAmend = document.getElementById('btn-amend');
const btnArchive = document.getElementById('btn-archive'); 

// --- NEW LOAD MD ELEMENTS ---
const btnLoad = document.getElementById('btn-load');
const fileInput = document.getElementById('file-input');
// --- END NEW ---

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

// --- NEW LOAD MD FILE FUNCTION (for the 'Load MD' button) ---
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
// --- END NEW LOAD MD FILE FUNCTION ---


// --- SIMPLE MARKDOWN RENDERING FUNCTION (for internal preview) ---
const renderMarkdown = (markdown) => {
    // 0. Trailing Spaces for <br>: Find two or more spaces at the end of a line followed by a newline
    let html = markdown.replace(/ {2,}\n/g, '<br>');

    // 1. Horizontal Rule (HR): Three or more hyphens or underscores on a line
    html = html.replace(/^(\s*[-_]{3,}\s*)$/gim, '<hr>');

    // 2. Basic Block processing (H1, H2, H3, Blockquote)
    html = html
        .replace(/^∆ (.*$)/gim, '<blockquote>$1</blockquote>') 
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>') 
        .replace(/^### (.*$)/gim, '<h3>$1</h3>') 
        .replace(/^## (.*$)/gim, '<h2>$1</h2>') 
        .replace(/^# (.*$)/gim, '<h1>$1</h1>') 
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/^#### (\d+\.\s.*$)/gim, '<li>$1</li>');


    // 3. Simple List processing 
    let inList = false;
    const lines = html.split('\n'); 
    let processedHtml = '';
    
    lines.forEach(line => {
        if (line.trim().startsWith('- ')) { 
            if (!inList) {
                processedHtml += '<ul>';
            }
            processedHtml += '<li>' + line.substring(line.indexOf('- ') + 2) + '</li>';
            inList = true;
        } else {
            if (inList) {
                processedHtml += '</ul>';
                inList = false;
            }
            if (line.trim() !== '') {
                processedHtml += line + '\n';
            }
        }
    });

    if (inList) {
        processedHtml += '</ul>';
    }
    html = processedHtml.replace(/\n/g, ' '); 

    // 4. Inline processing (Bold/Italic)
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); 

    return html.trim(); 
};



// --- CORE LOGIC: CREATE / SMART-CLOSE / PREVIEW TOGGLE ---
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


// --- ARCHIVE LOGIC ---
const handleArchiveSave = () => {
    const logContent = editor.value.trim();

    if (editor.classList.contains('hidden') || !logContent) {
        alert("Please 'Create' the editor and enter content before archiving.");
        return;
    }
    
    // 1. Extract the first line and clean it
    const firstLine = editor.value.split('\n')[0].trim();
    let cleanedFirstLine = firstLine.replace(/^[#\s]+/, '').trim();
    
    // 2. Create filename
    let filename = cleanedFirstLine.replace(/\s+/g, '_');
    filename = filename + '.md'; 

    // FALLBACK: If the filename is empty
    if (filename.length < 5) {
         const dateSuffix = '_' + new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
         filename = 'Sovereign_Log_Entry' + dateSuffix + '.md';
    }

    // 3. Trigger the download
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


// ===============================================
// === MENU CONTENT GENERATION (The Missing Part) ===
// ===============================================

// 1. SELECT Menu 
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
createSelectMenu(); // <--- CRITICAL: Run once to populate the menu


// 2. AMEND Menu 
const createAmendMenu = () => {
    const buttons = [
        ['Copy', 'menu-button amend', 'copy'],
        ['Cut', 'menu-button amend', 'cut'], 
        ['Delete', 'menu-button amend', 'delete'],
        ['Enter', 'menu-button amend', 'enter'], 
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
createAmendMenu(); // <--- CRITICAL: Run once to populate the menu

// --- COMPLEX SELECTION LOGIC (Required by menu listeners) ---

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

// --- MENU EVENT LISTENERS (Required by menu listeners) ---

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


// --- NEW LOAD MD FILE LOGIC Listener ---

// 1. Button click triggers the hidden file input
btnLoad.addEventListener('click', () => {
    // If the editor is closed, open it first
    if (editor.classList.contains('hidden')) {
        viewer.classList.add('hidden');
        editor.classList.remove('hidden');
        btnCreate.textContent = 'Close';
    }
    // Then trigger the file selection dialog
    fileInput.click(); 
});

// 2. File selection triggers the content loading function
fileInput.addEventListener('change', loadMDFile);


// =========================================================
// === START OF TRANSFERED CORE FILE-LOADING LOGIC ===
// =========================================================

function getSlugFromHash() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

function slugToFile(slug) {
  if (!slug) return null;
  return `${slug}.md`;
}

/**
 * Handles image wrapping within <details> blocks (moved from script.js)
 */
function wrapImageBlocks() {
  const detailsList = document.querySelectorAll('details');
  detailsList.forEach(details => {
    const children = Array.from(details.children);
    for (let i = 0; i < children.length; i++) {
      if (children[i].tagName === 'IMG') {
        const blockElements = [children[i]];
        let j = i + 1;
        while (j < children.length && children[j].tagName !== 'IMG') {
          blockElements.push(children[j]);
          j++;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'md-block';
        blockElements.forEach(el => wrapper.appendChild(el));
        details.insertBefore(wrapper, blockElements[0]);
        blockElements.forEach(el => {
          if (el !== wrapper) el.remove();
        });
        i = j - 1;
      }
    }
  });
}

/**
 * Fetches and displays a Markdown file (The main file-loading routine)
 * NOTE: Assumes 'marked.js' is loaded globally in your HTML before svp.js.
 */
async function loadMarkdown(slug) {
  // Hide the editor and show the viewer area
  editor.classList.add('hidden');
  viewer.classList.remove('hidden');
  btnCreate.textContent = 'Create'; // Reset button text

  if (!slug) {
    viewer.innerHTML = `<p style="color:red;">No hash provided in URL</p>`;
    return;
  }

  // Hide any open floating menus 
  if (currentOpenMenu) {
      currentOpenMenu.classList.add('hidden');
      document.querySelectorAll('.dock-button').forEach(btn => btn.classList.remove('active'));
      currentOpenMenu = null;
  }

  const file = slugToFile(slug);
  // Show a loading message in the viewer area
  viewer.innerHTML = `<p style="color:yellow;">Loading ${file}...</p>`;

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdText = await res.text();
    
    // Use the external 'marked' library to convert MD to HTML
    // You MUST ensure marked.js is included in your HTML
    const html = marked.parse(mdText);

    // Update the viewer and run post-processing scripts
    viewer.innerHTML = html;
    wrapImageBlocks();
    
    // --- COPY BUTTON INJECTION ---
    document.querySelectorAll("pre code").forEach((block) => {
      const button = document.createElement("button");
      button.textContent = "Copy";
      button.className = "copy-btn";
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(block.innerText).then(() => {
          button.textContent = "Copied!";
          setTimeout(() => button.textContent = "Copy", 2000);
        });
      });
      // The original script injected the button before the code block's parent, 
      // which is usually correct for code blocks.
      block.parentNode.insertBefore(button, block);
    });
    
    // --- BACK TO TOP / DETAILS CLOSER INJECTION ---
    const backToTopLink = document.getElementById("back-to-top");
    if (backToTopLink) {
        backToTopLink.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            document.querySelectorAll("details").forEach(d => d.removeAttribute("open"));
        });
    }

  } catch (err) {
    viewer.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

/**
 * Generates the correct wwddyy slug based on ISO 8601. (Moved from script.js)
 */
function generateWeekSlug(date) {
    // --- 1. Calculate the Monday of the current ISO week ---
    let day = date.getDay();
    day = day === 0 ? 7 : day; // Normalize day to 1=Monday, 7=Sunday
    const mondayOffset = day - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - mondayOffset);

    // --- 2. Calculate the ISO Week Number (ww) ---
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 4);
    const diffTime = thursday.getTime() - yearStart.getTime();
    const weekNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;

    // --- 3. Format Components (wwddyy) ---
    const ww = String(weekNumber).padStart(2, '0');
    const yy = String(thursday.getFullYear()).slice(-2);
    
    // --- 4. USE STANDARD 'dd' (Day of the month for Monday) ---
    const dd = String(monday.getDate()).padStart(2, '0');

    return `${ww}${dd}${yy}`;
}

// --- NEW LISTENER FOR PRESENT MOMENT (Today's Slug) ---
document.getElementById('present-moment-link').addEventListener('click', (e) => {
    e.preventDefault(); 
    
    // 1. Calculate the correct slug for today's date.
    const currentSlug = generateWeekSlug(new Date()); 
    
    // 2. Set the hash, which will trigger the hashchange listener below.
    window.location.hash = `#${currentSlug}`;
});

// --- NEW LISTENER FOR CAPTAIN'S LOG (Static Slug) ---
document.getElementById('captains-log-link').addEventListener('click', (e) => {
    e.preventDefault(); 
    
    // Set the hash for the fixed 'captain' slug, which will trigger the hashchange listener below.
    window.location.hash = `#captain`;
});

// --- Initial load and hashchange listener (The core file-loading loop) ---
let slug = getSlugFromHash();
loadMarkdown(slug);

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
});

// =========================================================
// === END OF TRANSFERED CORE FILE-LOADING LOGIC ===
// =========================================================
