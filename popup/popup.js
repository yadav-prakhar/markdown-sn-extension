// DOM Elements
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const charCountEl = document.getElementById('charCount');
const toastEl = document.getElementById('toast');

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
    const result = markdownServicenow.convertMarkdownToServiceNow(markdown, { customAlerts });
    outputEl.value = result;
    charCountEl.textContent = `${result.length} chars`;
    copyBtn.disabled = false;
  } catch (error) {
    console.error('MD-SN Popup: Conversion error:', error);
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
  renderAlertsList();
  resetAlertForm();
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
  alertNameInput.disabled = true; // Can't change name when editing
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
  const isEditing = editingAlertInput.value !== '';

  if (!isEditing && !name) {
    showToast('Name is required');
    return null;
  }

  if (!isEditing && !/^[a-z][a-z0-9_]*$/.test(name)) {
    showToast('Name must start with a letter and contain only lowercase letters, numbers, underscore');
    return null;
  }

  if (!isEditing && name.length > 20) {
    showToast('Name must be 20 characters or less');
    return null;
  }

  if (!isEditing && !builtInAlerts[name] && customAlerts[name]) {
    showToast('A custom alert with this name already exists');
    return null;
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
    name: isEditing ? editingAlertInput.value : name,
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

// Update preview on form changes
[alertEmojiInput, alertDisplayNameInput, alertBgColorInput, alertTextColorInput, alertBorderColorInput].forEach(input => {
  input.addEventListener('input', updatePreview);
});

// Initialize
async function init() {
  // Load built-in alerts from library
  builtInAlerts = markdownServicenow.getBuiltInAlerts();

  // Load custom alerts from storage
  await loadCustomAlertsFromStorage();

  // Render alert picker
  renderAlertPicker();

  // Load saved input
  chrome.storage.local.get(['lastInput'], (result) => {
    if (result.lastInput) {
      inputEl.value = result.lastInput;
      convert();
    }
  });

  // Focus input
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
