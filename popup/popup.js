// DOM Elements
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const charCountEl = document.getElementById('charCount');
const toastEl = document.getElementById('toast');
const saveSnippetQuickBtn = document.getElementById('saveSnippetQuickBtn');
const quickSaveForm = document.getElementById('quickSaveForm');
const quickSaveNameInput = document.getElementById('quickSaveName');

// Settings Modal Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const builtInAlertsList = document.getElementById('builtInAlertsList');
const customAlertsList = document.getElementById('customAlertsList');
const alertForm = document.getElementById('alertForm');
const formTitle = document.getElementById('formTitle');
const editingAlertInput = document.getElementById('editingAlert');
const alertNameInput = document.getElementById('alertName');
const alertDisplayNameInput = document.getElementById('alertDisplayName');
const alertEmojiInput = document.getElementById('alertEmoji');
const alertBgColorInput = document.getElementById('alertBgColor');
const alertTextColorInput = document.getElementById('alertTextColor');
const alertBorderColorInput = document.getElementById('alertBorderColor');
const alertPreview = document.getElementById('alertPreview');
const saveAlertBtn = document.getElementById('saveAlertBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFile');
const alertPickerEl = document.getElementById('alertPicker');

// State
let customAlerts = {};
let builtInAlerts = {};
let snippets = [];

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
    saveSnippetQuickBtn.disabled = true;
    return;
  }

  try {
    const result = markdownServicenow.convertMarkdownToServiceNow(markdown, { customAlerts });
    outputEl.value = result;
    charCountEl.textContent = `${result.length} chars`;
    copyBtn.disabled = false;
    saveSnippetQuickBtn.disabled = false;
  } catch (error) {
    console.error('MD-SN Popup: Conversion error:', error);
    outputEl.value = `Error: ${error.message}`;
    copyBtn.disabled = true;
    saveSnippetQuickBtn.disabled = true;
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
  saveSnippetQuickBtn.disabled = true;
  quickSaveForm.classList.add('hidden');
  quickSaveNameInput.value = '';
  inputEl.focus();
}

function saveQuickSnippet() {
  const name = quickSaveNameInput.value.trim();
  if (!name) {
    quickSaveNameInput.focus();
    quickSaveNameInput.style.borderColor = '#e74c3c';
    return;
  }
  const content = outputEl.value;
  snippets.push({ id: Date.now().toString(), name, content });
  saveSnippetsToStorage();
  renderSnippetsList();
  quickSaveForm.classList.add('hidden');
  quickSaveNameInput.value = '';
  quickSaveNameInput.style.borderColor = '';
  showToast('Snippet saved!');
}

// ==================== Alert Picker ====================

function renderAlertPicker() {
  const allAlerts = { ...builtInAlerts };
  // Apply custom overrides and additions
  for (const [name, alert] of Object.entries(customAlerts)) {
    if (allAlerts[name]) {
      allAlerts[name] = { ...allAlerts[name], ...alert };
    } else {
      allAlerts[name] = { ...alert, name };
    }
  }

  alertPickerEl.innerHTML = '';
  for (const [name, alert] of Object.entries(allAlerts)) {
    const badge = document.createElement('div');
    badge.className = 'alert-badge' + (customAlerts[name] && !builtInAlerts[name] ? ' custom' : '');
    badge.innerHTML = `<span class="badge-emoji">${alert.emoji}</span><span class="badge-name">${name}</span>`;
    badge.title = `Insert ${alert.displayName || name.toUpperCase()} alert`;
    badge.addEventListener('click', () => insertAlertSyntax(name));
    alertPickerEl.appendChild(badge);
  }
}

function insertAlertSyntax(alertName) {
  const syntax = `> [!${alertName.toUpperCase()}]\n> `;
  const cursorPos = inputEl.selectionStart;
  const textBefore = inputEl.value.substring(0, cursorPos);
  const textAfter = inputEl.value.substring(inputEl.selectionEnd);

  // Add newline before if needed
  const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
  const insertion = (needsNewline ? '\n' : '') + syntax;

  inputEl.value = textBefore + insertion + textAfter;
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = cursorPos + insertion.length;
  convert();
}

// ==================== Settings Modal ====================

function openSettingsModal() {
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

function renderAlertsList() {
  // Built-in alerts
  builtInAlertsList.innerHTML = '';
  for (const [name, defaultAlert] of Object.entries(builtInAlerts)) {
    const isModified = customAlerts[name] !== undefined;
    const alert = isModified ? { ...defaultAlert, ...customAlerts[name] } : defaultAlert;

    const item = document.createElement('div');
    item.className = 'alert-item' + (isModified ? ' modified' : '');
    item.innerHTML = `
      <span class="alert-emoji">${alert.emoji}</span>
      <span class="alert-name">${name.toUpperCase()}</span>
      <span class="alert-actions">
        <button type="button" data-action="edit" data-name="${name}" title="Edit">✏️</button>
        <button type="button" data-action="duplicate" data-name="${name}" title="Duplicate">📋</button>
        ${isModified ? `<button type="button" data-action="reset" data-name="${name}" title="Reset to default">↩️</button>` : ''}
      </span>
    `;
    builtInAlertsList.appendChild(item);
  }

  // Custom alerts (non built-in)
  customAlertsList.innerHTML = '';
  const customOnlyAlerts = Object.entries(customAlerts).filter(([name]) => !builtInAlerts[name]);

  if (customOnlyAlerts.length === 0) {
    customAlertsList.innerHTML = '<span class="no-custom-alerts">No custom alerts yet</span>';
  } else {
    for (const [name, alert] of customOnlyAlerts) {
      const item = document.createElement('div');
      item.className = 'alert-item';
      item.innerHTML = `
        <span class="alert-emoji">${alert.emoji}</span>
        <span class="alert-name">${alert.displayName || name.toUpperCase()}</span>
        <span class="alert-actions">
          <button type="button" data-action="edit" data-name="${name}" title="Edit">✏️</button>
          <button type="button" data-action="duplicate" data-name="${name}" title="Duplicate">📋</button>
          <button type="button" data-action="delete" data-name="${name}" title="Delete">🗑️</button>
        </span>
      `;
      customAlertsList.appendChild(item);
    }
  }

  // Add event listeners
  document.querySelectorAll('.alert-item button').forEach(btn => {
    btn.addEventListener('click', handleAlertAction);
  });
}

function handleAlertAction(e) {
  const action = e.target.dataset.action;
  const name = e.target.dataset.name;

  if (action === 'edit') {
    editAlert(name);
  } else if (action === 'reset') {
    resetBuiltInAlert(name);
  } else if (action === 'delete') {
    deleteCustomAlert(name);
  } else if (action === 'duplicate') {
    duplicateAlert(name);
  }
}

function editAlert(name) {
  const isBuiltIn = builtInAlerts[name] !== undefined;
  const defaultAlert = builtInAlerts[name] || {};
  const customAlert = customAlerts[name] || {};
  const alert = { ...defaultAlert, ...customAlert };

  formTitle.textContent = isBuiltIn ? `Edit ${name.toUpperCase()}` : `Edit Custom Alert`;
  editingAlertInput.value = name;
  alertNameInput.value = name;
  alertNameInput.disabled = isBuiltIn; // Custom alerts can be renamed; built-ins cannot
  alertDisplayNameInput.value = alert.displayName || name.toUpperCase();
  alertEmojiInput.value = alert.emoji || '';
  alertBgColorInput.value = alert.backgroundColor || '#f0f0f0';
  alertTextColorInput.value = alert.textColor || '#333333';
  alertBorderColorInput.value = alert.borderColor || '#666666';
  saveAlertBtn.textContent = 'Save Changes';
  cancelEditBtn.classList.remove('hidden');
  updatePreview();
}

function resetAlertForm() {
  formTitle.textContent = 'Add New Alert';
  editingAlertInput.value = '';
  alertNameInput.value = '';
  alertNameInput.disabled = false;
  alertDisplayNameInput.value = '';
  alertEmojiInput.value = '';
  alertBgColorInput.value = '#f0f0f0';
  alertTextColorInput.value = '#333333';
  alertBorderColorInput.value = '#666666';
  saveAlertBtn.textContent = 'Add Alert';
  cancelEditBtn.classList.add('hidden');
  updatePreview();
}

function updatePreview() {
  const emoji = alertEmojiInput.value || '🎯';
  const displayName = alertDisplayNameInput.value || 'ALERT';
  const bgColor = alertBgColorInput.value;
  const textColor = alertTextColorInput.value;
  const borderColor = alertBorderColorInput.value;

  alertPreview.style.backgroundColor = bgColor;
  alertPreview.style.color = textColor;
  alertPreview.style.borderLeftColor = borderColor;
  alertPreview.querySelector('.preview-content').innerHTML =
    `${emoji} <strong>${displayName}:</strong> Sample text`;
}

function validateAlertForm() {
  const name = alertNameInput.value.trim().toLowerCase();
  const displayName = alertDisplayNameInput.value.trim();
  const emoji = alertEmojiInput.value.trim();
  const editingName = editingAlertInput.value;
  const isBuiltIn = editingName !== '' && !!builtInAlerts[editingName];

  if (!name) {
    showToast('Name is required');
    return null;
  }

  // Format, length, and uniqueness checks apply to new alerts and custom renames
  if (!isBuiltIn) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      showToast('Name must start with a letter and contain only lowercase letters, numbers, underscore');
      return null;
    }

    if (name.length > 20) {
      showToast('Name must be 20 characters or less');
      return null;
    }

    // Only check uniqueness when name actually changes
    if (name !== editingName && (builtInAlerts[name] || customAlerts[name])) {
      showToast('An alert with this name already exists');
      return null;
    }
  }

  if (!displayName) {
    showToast('Display name is required');
    return null;
  }

  if (!emoji) {
    showToast('Emoji is required');
    return null;
  }

  return {
    name,
    editingName,
    displayName,
    emoji,
    backgroundColor: alertBgColorInput.value,
    textColor: alertTextColorInput.value,
    borderColor: alertBorderColorInput.value
  };
}

function saveAlert(e) {
  e.preventDefault();
  const alert = validateAlertForm();
  if (!alert) return;

  // When a custom alert is renamed, remove the old key
  if (alert.editingName && alert.editingName !== alert.name) {
    delete customAlerts[alert.editingName];
  }

  customAlerts[alert.name] = {
    displayName: alert.displayName,
    emoji: alert.emoji,
    backgroundColor: alert.backgroundColor,
    textColor: alert.textColor,
    borderColor: alert.borderColor
  };

  saveCustomAlertsToStorage();
  renderAlertsList();
  renderAlertPicker();
  resetAlertForm();
  convert(); // Re-convert with new alerts
  showToast('Alert saved!');
}

function resetBuiltInAlert(name) {
  if (customAlerts[name]) {
    delete customAlerts[name];
    saveCustomAlertsToStorage();
    renderAlertsList();
    renderAlertPicker();
    convert();
    showToast(`${name.toUpperCase()} reset to default`);
  }
}

function deleteCustomAlert(name) {
  if (customAlerts[name] && !builtInAlerts[name]) {
    delete customAlerts[name];
    saveCustomAlertsToStorage();
    renderAlertsList();
    renderAlertPicker();
    convert();
    showToast('Alert deleted');
  }
}

function duplicateAlert(name) {
  const defaultAlert = builtInAlerts[name] || {};
  const customAlert = customAlerts[name] || {};
  const source = { ...defaultAlert, ...customAlert };

  const base = name.slice(0, 15);
  let candidate = `${base}_copy`;
  let i = 2;
  while (builtInAlerts[candidate] || customAlerts[candidate]) {
    candidate = `${base}_copy_${i++}`;
  }

  customAlerts[candidate] = {
    displayName: source.displayName || name.toUpperCase(),
    emoji: source.emoji || '📋',
    backgroundColor: source.backgroundColor || '#f0f0f0',
    textColor: source.textColor || '#333333',
    borderColor: source.borderColor || '#666666'
  };

  saveCustomAlertsToStorage();
  renderAlertsList();
  renderAlertPicker();
  convert();
  showToast(`Duplicated as ${candidate.toUpperCase()}`);
}

// ==================== Import/Export ====================

function exportAlerts() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    alerts: customAlerts
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'alert-types.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Alerts exported!');
}

function importAlerts() {
  importFileInput.click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      if (!data.version || !data.alerts) {
        showToast('Invalid file format');
        return;
      }

      // Validate and merge alerts
      let imported = 0;
      for (const [name, alert] of Object.entries(data.alerts)) {
        if (typeof name === 'string' && typeof alert === 'object') {
          customAlerts[name] = {
            displayName: alert.displayName || name.toUpperCase(),
            emoji: alert.emoji || '📋',
            backgroundColor: alert.backgroundColor || '#f0f0f0',
            textColor: alert.textColor || '#333333',
            borderColor: alert.borderColor || '#666666'
          };
          imported++;
        }
      }

      saveCustomAlertsToStorage();
      renderAlertsList();
      renderAlertPicker();
      convert();
      showToast(`Imported ${imported} alert(s)!`);
    } catch (error) {
      console.error('MD-SN Popup: Import error:', error);
      showToast('Failed to import file');
    }
  };
  reader.readAsText(file);
  importFileInput.value = ''; // Reset for next import
}

// ==================== Storage ====================

function saveCustomAlertsToStorage() {
  chrome.storage.local.set({ customAlertTypes: customAlerts });
}

function loadCustomAlertsFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customAlertTypes'], (result) => {
      customAlerts = result.customAlertTypes || {};
      resolve();
    });
  });
}

function saveSnippetsToStorage() {
  chrome.storage.local.set({ snippets });
}

function loadSnippetsFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['snippets'], (result) => {
      snippets = result.snippets || [];
      resolve();
    });
  });
}

// ==================== Snippets ====================

function renderSnippetsList() {
  const snippetsList = document.getElementById('snippetsList');
  snippetsList.innerHTML = '';

  if (snippets.length === 0) {
    snippetsList.innerHTML = '<span class="no-snippets">No snippets yet</span>';
    return;
  }

  for (const snippet of snippets) {
    const item = document.createElement('div');
    item.className = 'snippet-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'snippet-name';
    nameEl.textContent = snippet.name;

    const actionsEl = document.createElement('span');
    actionsEl.className = 'snippet-actions';

    for (const [action, label, title] of [['insert', '▶', 'Insert'], ['edit', '✏️', 'Edit'], ['delete', '🗑️', 'Delete']]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.action = action;
      btn.dataset.id = snippet.id;
      btn.title = title;
      btn.textContent = label;
      actionsEl.appendChild(btn);
    }

    item.appendChild(nameEl);
    item.appendChild(actionsEl);
    snippetsList.appendChild(item);
  }

  snippetsList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', handleSnippetAction);
  });
}

function handleSnippetAction(e) {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;

  if (action === 'edit') {
    editSnippet(id);
  } else if (action === 'delete') {
    deleteSnippet(id);
  } else if (action === 'insert') {
    const snippet = snippets.find(s => s.id === id);
    if (snippet) {
      insertSnippetIntoInput(snippet.content);
      switchToTab('Converter');
    }
  }
}

function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (!snippet) return;

  const snippetFormTitle = document.getElementById('snippetFormTitle');
  const editingSnippetInput = document.getElementById('editingSnippet');
  const snippetNameInput = document.getElementById('snippetName');
  const snippetContentInput = document.getElementById('snippetContent');
  const saveSnippetBtn = document.getElementById('saveSnippetBtn');
  const cancelSnippetEditBtn = document.getElementById('cancelSnippetEditBtn');

  snippetFormTitle.textContent = 'Edit Snippet';
  editingSnippetInput.value = id;
  snippetNameInput.value = snippet.name;
  snippetContentInput.value = snippet.content;
  saveSnippetBtn.textContent = 'Save Changes';
  cancelSnippetEditBtn.classList.remove('hidden');
}

function resetSnippetForm() {
  const snippetFormTitle = document.getElementById('snippetFormTitle');
  const editingSnippetInput = document.getElementById('editingSnippet');
  const snippetNameInput = document.getElementById('snippetName');
  const snippetContentInput = document.getElementById('snippetContent');
  const saveSnippetBtn = document.getElementById('saveSnippetBtn');
  const cancelSnippetEditBtn = document.getElementById('cancelSnippetEditBtn');

  snippetFormTitle.textContent = 'Add New Snippet';
  editingSnippetInput.value = '';
  snippetNameInput.value = '';
  snippetContentInput.value = '';
  saveSnippetBtn.textContent = 'Add Snippet';
  cancelSnippetEditBtn.classList.add('hidden');
}

function saveSnippet(e) {
  e.preventDefault();

  const editingSnippetInput = document.getElementById('editingSnippet');
  const snippetNameInput = document.getElementById('snippetName');
  const snippetContentInput = document.getElementById('snippetContent');

  const name = snippetNameInput.value.trim();
  const content = snippetContentInput.value.trim();
  const editingId = editingSnippetInput.value;

  if (!name) {
    showToast('Snippet name is required');
    return;
  }

  if (!content) {
    showToast('Snippet content is required');
    return;
  }

  if (editingId) {
    const idx = snippets.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      snippets[idx] = { id: editingId, name, content };
    }
  } else {
    snippets.push({ id: Date.now().toString(), name, content });
  }

  saveSnippetsToStorage();
  renderSnippetsList();
  resetSnippetForm();
  showToast('Snippet saved!');
}

function deleteSnippet(id) {
  snippets = snippets.filter(s => s.id !== id);
  saveSnippetsToStorage();
  renderSnippetsList();
  showToast('Snippet deleted');
}

function insertSnippetIntoInput(content) {
  const cursorPos = inputEl.selectionStart;
  const textBefore = inputEl.value.substring(0, cursorPos);
  const textAfter = inputEl.value.substring(inputEl.selectionEnd);

  const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
  const insertion = (needsNewline ? '\n' : '') + content;

  inputEl.value = textBefore + insertion + textAfter;
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = cursorPos + insertion.length;
  convert();
}

// Event listeners
inputEl.addEventListener('input', debounce(convert, 150));
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// Settings modal event listeners
settingsBtn.addEventListener('click', openSettingsModal);
closeModalBtn.addEventListener('click', closeSettingsModal);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});
alertForm.addEventListener('submit', saveAlert);
cancelEditBtn.addEventListener('click', resetAlertForm);
importBtn.addEventListener('click', importAlerts);
exportBtn.addEventListener('click', exportAlerts);
importFileInput.addEventListener('change', handleImportFile);

// Top-level tab switching
function switchToTab(name) {
  ['Converter', 'Alerts', 'Snippets'].forEach(n => {
    document.getElementById(`tab${n}`).classList.toggle('active', n === name);
    document.getElementById(`panel${n}`).classList.toggle('hidden', n !== name);
  });
}
document.getElementById('tabConverter').addEventListener('click', () => switchToTab('Converter'));
document.getElementById('tabAlerts').addEventListener('click', () => switchToTab('Alerts'));
document.getElementById('tabSnippets').addEventListener('click', () => switchToTab('Snippets'));

// Snippet form event listeners
document.getElementById('snippetForm').addEventListener('submit', saveSnippet);
document.getElementById('cancelSnippetEditBtn').addEventListener('click', resetSnippetForm);

// Quick save snippet event listeners
saveSnippetQuickBtn.addEventListener('click', () => {
  quickSaveForm.classList.remove('hidden');
  quickSaveNameInput.value = '';
  quickSaveNameInput.style.borderColor = '';
  quickSaveNameInput.focus();
});
document.getElementById('quickSaveConfirmBtn').addEventListener('click', saveQuickSnippet);
document.getElementById('quickSaveCancelBtn').addEventListener('click', () => {
  quickSaveForm.classList.add('hidden');
  quickSaveNameInput.value = '';
  quickSaveNameInput.style.borderColor = '';
});
quickSaveNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveQuickSnippet();
  if (e.key === 'Escape') {
    quickSaveForm.classList.add('hidden');
    quickSaveNameInput.value = '';
    quickSaveNameInput.style.borderColor = '';
  }
});

// Update preview on form changes
[alertEmojiInput, alertDisplayNameInput, alertBgColorInput, alertTextColorInput, alertBorderColorInput].forEach(input => {
  input.addEventListener('input', updatePreview);
});

// Initialize
async function init() {
  builtInAlerts = markdownServicenow.getBuiltInAlerts();
  await loadCustomAlertsFromStorage();
  await loadSnippetsFromStorage();

  renderAlertPicker();
  renderAlertsList();
  renderSnippetsList();

  chrome.storage.local.get(['lastInput'], (result) => {
    if (result.lastInput) {
      inputEl.value = result.lastInput;
      convert();
    }
  });

  inputEl.focus();
}

// Save input when popup closes
window.addEventListener('blur', () => {
  if (inputEl.value) {
    chrome.storage.local.set({ lastInput: inputEl.value });
  }
});

// Start
init();

if (typeof globalThis !== 'undefined') {
  globalThis.__mdSn_popup = { debounce, convert, showToast, copyToClipboard, clearAll, saveQuickSnippet, renderAlertPicker, insertAlertSyntax, validateAlertForm, saveAlert, editAlert, resetAlertForm, resetBuiltInAlert, duplicateAlert, deleteCustomAlert, renderAlertsList, exportAlerts, handleImportFile, saveCustomAlertsToStorage, loadCustomAlertsFromStorage, saveSnippetsToStorage, loadSnippetsFromStorage, renderSnippetsList, editSnippet, saveSnippet, deleteSnippet, insertSnippetIntoInput, switchToTab, openSettingsModal, closeSettingsModal };
}
