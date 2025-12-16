// DOM Elements
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const charCountEl = document.getElementById('charCount');
const toastEl = document.getElementById('toast');

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Convert markdown to ServiceNow format
function convert() {
  const markdown = inputEl.value.trim();
  
  if (!markdown) {
    outputEl.value = '';
    charCountEl.textContent = '0 chars';
    copyBtn.disabled = true;
    return;
  }
  
  try {
    const result = markdownServicenow.convertMarkdownToServiceNow(markdown);
    outputEl.value = result;
    charCountEl.textContent = `${result.length} chars`;
    copyBtn.disabled = false;
  } catch (error) {
    outputEl.value = `Error: ${error.message}`;
    copyBtn.disabled = true;
  }
}

// Show toast notification
function showToast(message = 'Copied to clipboard!') {
  const toastMessage = toastEl.querySelector('.toast-message');
  toastMessage.textContent = message;
  
  toastEl.classList.remove('hidden');
  // Force reflow
  toastEl.offsetHeight;
  toastEl.classList.add('show');
  
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 300);
  }, 2000);
}

// Copy to clipboard
async function copyToClipboard() {
  const text = outputEl.value;
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (error) {
    // Fallback for older browsers
    outputEl.select();
    document.execCommand('copy');
    showToast('Copied to clipboard!');
  }
}

// Clear all
function clearAll() {
  inputEl.value = '';
  outputEl.value = '';
  charCountEl.textContent = '0 chars';
  copyBtn.disabled = true;
  inputEl.focus();
}

// Event listeners
inputEl.addEventListener('input', debounce(convert, 150));
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// Load saved input on popup open
chrome.storage.local.get(['lastInput'], (result) => {
  if (result.lastInput) {
    inputEl.value = result.lastInput;
    convert();
  }
});

// Save input when popup closes
window.addEventListener('blur', () => {
  if (inputEl.value) {
    chrome.storage.local.set({ lastInput: inputEl.value });
  }
});

// Focus input on load
inputEl.focus();
