import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Alert Management - Rename & Duplicate', () => {
  let customAlerts, builtInAlerts;
  let alertNameInput, alertDisplayNameInput, alertEmojiInput;
  let alertBgColorInput, alertTextColorInput, alertBorderColorInput;
  let editingAlertInput, formTitle, saveAlertBtn, cancelEditBtn;
  let alertPreview, builtInAlertsList, customAlertsList;

  let showToast, saveCustomAlertsToStorage, renderAlertPicker, convert, resetAlertForm;
  let editAlert, validateAlertForm, saveAlert, duplicateAlert, renderAlertsList;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast" class="hidden"><span class="toast-message"></span></div>
      <div id="builtInAlertsList"></div>
      <div id="customAlertsList"></div>
      <form id="alertForm">
        <h3 id="formTitle">Add New Alert</h3>
        <input type="hidden" id="editingAlert" value="" />
        <input type="text" id="alertName" />
        <input type="text" id="alertDisplayName" />
        <input type="text" id="alertEmoji" />
        <input type="color" id="alertBgColor" value="#f0f0f0" />
        <input type="color" id="alertTextColor" value="#333333" />
        <input type="color" id="alertBorderColor" value="#666666" />
        <div id="alertPreview"><span class="preview-content"></span></div>
        <button id="saveAlertBtn">Add Alert</button>
        <button id="cancelEditBtn" class="hidden">Cancel</button>
      </form>
    `;

    alertNameInput = document.getElementById('alertName');
    alertDisplayNameInput = document.getElementById('alertDisplayName');
    alertEmojiInput = document.getElementById('alertEmoji');
    alertBgColorInput = document.getElementById('alertBgColor');
    alertTextColorInput = document.getElementById('alertTextColor');
    alertBorderColorInput = document.getElementById('alertBorderColor');
    editingAlertInput = document.getElementById('editingAlert');
    formTitle = document.getElementById('formTitle');
    saveAlertBtn = document.getElementById('saveAlertBtn');
    cancelEditBtn = document.getElementById('cancelEditBtn');
    alertPreview = document.getElementById('alertPreview');
    builtInAlertsList = document.getElementById('builtInAlertsList');
    customAlertsList = document.getElementById('customAlertsList');

    builtInAlerts = {
      note: { name: 'note', displayName: 'NOTE', emoji: '📝', textColor: '#325d7a', backgroundColor: '#eaf2f8', borderColor: '#5b8def' },
      warning: { name: 'warning', displayName: 'WARNING', emoji: '⚠️', textColor: '#7c5e10', backgroundColor: '#faf3d1', borderColor: '#d4a72c' },
    };
    customAlerts = {};

    showToast = vi.fn();
    saveCustomAlertsToStorage = vi.fn();
    renderAlertPicker = vi.fn();
    convert = vi.fn();
    resetAlertForm = vi.fn();

    editAlert = function(name) {
      const isBuiltIn = builtInAlerts[name] !== undefined;
      const defaultAlert = builtInAlerts[name] || {};
      const customAlert = customAlerts[name] || {};
      const alert = { ...defaultAlert, ...customAlert };

      formTitle.textContent = isBuiltIn ? `Edit ${name.toUpperCase()}` : `Edit Custom Alert`;
      editingAlertInput.value = name;
      alertNameInput.value = name;
      alertNameInput.disabled = isBuiltIn;
      alertDisplayNameInput.value = alert.displayName || name.toUpperCase();
      alertEmojiInput.value = alert.emoji || '';
      alertBgColorInput.value = alert.backgroundColor || '#f0f0f0';
      alertTextColorInput.value = alert.textColor || '#333333';
      alertBorderColorInput.value = alert.borderColor || '#666666';
      saveAlertBtn.textContent = 'Save Changes';
      cancelEditBtn.classList.remove('hidden');
    };

    validateAlertForm = function() {
      const name = alertNameInput.value.trim().toLowerCase();
      const displayName = alertDisplayNameInput.value.trim();
      const emoji = alertEmojiInput.value.trim();
      const editingName = editingAlertInput.value;
      const isBuiltIn = editingName !== '' && !!builtInAlerts[editingName];

      if (!name) {
        showToast('Name is required');
        return null;
      }

      if (!isBuiltIn) {
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
          showToast('Name must start with a letter and contain only lowercase letters, numbers, underscore');
          return null;
        }

        if (name.length > 20) {
          showToast('Name must be 20 characters or less');
          return null;
        }

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

      return { name, editingName, displayName, emoji,
        backgroundColor: alertBgColorInput.value,
        textColor: alertTextColorInput.value,
        borderColor: alertBorderColorInput.value
      };
    };

    saveAlert = function(e) {
      e.preventDefault();
      const alert = validateAlertForm();
      if (!alert) return;

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
      renderAlertPicker();
      resetAlertForm();
      convert();
      showToast('Alert saved!');
    };

    duplicateAlert = function(name) {
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
      renderAlertPicker();
      convert();
      showToast(`Duplicated as ${candidate.toUpperCase()}`);
    };

    renderAlertsList = function() {
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

      customAlertsList.innerHTML = '';
      const customOnlyAlerts = Object.entries(customAlerts).filter(([n]) => !builtInAlerts[n]);
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
    };
  });

  // ── editAlert ──────────────────────────────────────────────────────────────

  describe('editAlert - name field locking', () => {
    it('locks name field for built-in alerts', () => {
      editAlert('note');
      expect(alertNameInput.disabled).toBe(true);
    });

    it('unlocks name field for custom alerts', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      editAlert('myalert');
      expect(alertNameInput.disabled).toBe(false);
    });

    it('populates form with correct values for built-in', () => {
      editAlert('note');
      expect(alertNameInput.value).toBe('note');
      expect(alertDisplayNameInput.value).toBe('NOTE');
      expect(alertEmojiInput.value).toBe('📝');
    });

    it('applies custom overrides when editing modified built-in', () => {
      customAlerts['note'] = { displayName: 'MY NOTE', emoji: '🗒️', backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc' };
      editAlert('note');
      expect(alertDisplayNameInput.value).toBe('MY NOTE');
      expect(alertEmojiInput.value).toBe('🗒️');
      expect(alertNameInput.disabled).toBe(true); // still locked — it's a built-in
    });

    it('sets editingAlertInput to the alert name', () => {
      editAlert('warning');
      expect(editingAlertInput.value).toBe('warning');
    });
  });

  // ── validateAlertForm ──────────────────────────────────────────────────────

  describe('validateAlertForm - rename validation', () => {
    function fillForm({ name = 'myalert', displayName = 'MY ALERT', emoji = '🎯', editing = '' } = {}) {
      alertNameInput.value = name;
      alertDisplayNameInput.value = displayName;
      alertEmojiInput.value = emoji;
      editingAlertInput.value = editing;
    }

    it('allows saving a custom alert with the same name (no rename)', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'myalert', editing: 'myalert' });
      const result = validateAlertForm();
      expect(result).not.toBeNull();
      expect(result.name).toBe('myalert');
      expect(showToast).not.toHaveBeenCalled();
    });

    it('allows renaming a custom alert to a new unique name', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'newalert', editing: 'myalert' });
      const result = validateAlertForm();
      expect(result).not.toBeNull();
      expect(result.name).toBe('newalert');
      expect(result.editingName).toBe('myalert');
    });

    it('blocks renaming to an existing custom alert name', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      customAlerts['other'] = { displayName: 'OTHER', emoji: '🔔', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'other', editing: 'myalert' });
      const result = validateAlertForm();
      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('An alert with this name already exists');
    });

    it('blocks renaming to an existing built-in name', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'note', editing: 'myalert' }); // 'note' is a built-in
      const result = validateAlertForm();
      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('An alert with this name already exists');
    });

    it('skips uniqueness check when editing a built-in alert', () => {
      fillForm({ name: 'note', displayName: 'NOTE', emoji: '📝', editing: 'note' });
      const result = validateAlertForm();
      expect(result).not.toBeNull(); // built-in name collision allowed (same name)
    });

    it('validates format of new name during rename', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'INVALID NAME!', editing: 'myalert' });
      const result = validateAlertForm();
      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('lowercase letters'));
    });

    it('enforces 20-char limit during rename', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      fillForm({ name: 'a_very_long_name_that_exceeds', editing: 'myalert' });
      const result = validateAlertForm();
      expect(result).toBeNull();
      expect(showToast).toHaveBeenCalledWith('Name must be 20 characters or less');
    });
  });

  // ── saveAlert - rename persistence ─────────────────────────────────────────

  describe('saveAlert - rename persistence', () => {
    function triggerSave() {
      saveAlert({ preventDefault: vi.fn() });
    }

    it('deletes old key when custom alert is renamed', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();
      expect(customAlerts['myalert']).toBeUndefined();
    });

    it('creates new key with same properties after rename', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();
      expect(customAlerts['renamed']).toBeDefined();
      expect(customAlerts['renamed'].displayName).toBe('MY ALERT');
      expect(customAlerts['renamed'].emoji).toBe('🎯');
    });

    it('does not delete key when name is unchanged', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'myalert';
      alertDisplayNameInput.value = 'UPDATED';
      alertEmojiInput.value = '🎯';
      triggerSave();
      expect(customAlerts['myalert']).toBeDefined();
      expect(customAlerts['myalert'].displayName).toBe('UPDATED');
    });

    it('calls saveCustomAlertsToStorage after rename', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();
      expect(saveCustomAlertsToStorage).toHaveBeenCalled();
    });
  });

  // ── duplicateAlert ─────────────────────────────────────────────────────────

  describe('duplicateAlert', () => {
    it('creates a copy with _copy suffix for built-in alert', () => {
      duplicateAlert('note');
      expect(customAlerts['note_copy']).toBeDefined();
    });

    it('copies all properties from source built-in alert', () => {
      duplicateAlert('note');
      expect(customAlerts['note_copy'].displayName).toBe('NOTE');
      expect(customAlerts['note_copy'].emoji).toBe('📝');
      expect(customAlerts['note_copy'].backgroundColor).toBe('#eaf2f8');
      expect(customAlerts['note_copy'].textColor).toBe('#325d7a');
      expect(customAlerts['note_copy'].borderColor).toBe('#5b8def');
    });

    it('creates a copy with _copy suffix for custom alert', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#aabbcc', textColor: '#111', borderColor: '#222' };
      duplicateAlert('myalert');
      expect(customAlerts['myalert_copy']).toBeDefined();
      expect(customAlerts['myalert_copy'].displayName).toBe('MY ALERT');
      expect(customAlerts['myalert_copy'].backgroundColor).toBe('#aabbcc');
    });

    it('uses _copy_2 when _copy already exists', () => {
      customAlerts['note_copy'] = { displayName: 'NOTE COPY', emoji: '📝', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      duplicateAlert('note');
      expect(customAlerts['note_copy_2']).toBeDefined();
    });

    it('increments suffix further when multiple copies exist', () => {
      customAlerts['note_copy'] = { displayName: 'NOTE COPY', emoji: '📝', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      customAlerts['note_copy_2'] = { displayName: 'NOTE COPY 2', emoji: '📝', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      duplicateAlert('note');
      expect(customAlerts['note_copy_3']).toBeDefined();
    });

    it('truncates base name to 15 chars before adding _copy', () => {
      customAlerts['averylongnamethatexceeds'] = { displayName: 'LONG', emoji: '🔔', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      duplicateAlert('averylongnamethatexceeds');
      const keys = Object.keys(customAlerts).filter(k => k.includes('_copy'));
      expect(keys.length).toBe(1);
      expect(keys[0].length).toBeLessThanOrEqual(20);
    });

    it('merges built-in defaults with custom overrides when duplicating modified built-in', () => {
      customAlerts['note'] = { displayName: 'MY NOTE', emoji: '🗒️', backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc' };
      duplicateAlert('note');
      expect(customAlerts['note_copy'].displayName).toBe('MY NOTE');
      expect(customAlerts['note_copy'].emoji).toBe('🗒️');
      expect(customAlerts['note_copy'].backgroundColor).toBe('#fff');
    });

    it('calls saveCustomAlertsToStorage after duplicating', () => {
      duplicateAlert('note');
      expect(saveCustomAlertsToStorage).toHaveBeenCalled();
    });

    it('shows a toast with the new name', () => {
      duplicateAlert('note');
      expect(showToast).toHaveBeenCalledWith('Duplicated as NOTE_COPY');
    });
  });

  // ── renderAlertsList ───────────────────────────────────────────────────────

  describe('renderAlertsList - duplicate button presence', () => {
    it('renders duplicate button for each built-in alert', () => {
      renderAlertsList();
      const dupButtons = builtInAlertsList.querySelectorAll('[data-action="duplicate"]');
      expect(dupButtons.length).toBe(Object.keys(builtInAlerts).length);
    });

    it('renders duplicate button for each custom alert', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      customAlerts['other'] = { displayName: 'OTHER', emoji: '🔔', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      renderAlertsList();
      const dupButtons = customAlertsList.querySelectorAll('[data-action="duplicate"]');
      expect(dupButtons.length).toBe(2);
    });

    it('each duplicate button has the correct data-name', () => {
      renderAlertsList();
      const noteBtn = builtInAlertsList.querySelector('[data-action="duplicate"][data-name="note"]');
      expect(noteBtn).not.toBeNull();
    });

    it('renders edit and delete buttons alongside duplicate for custom alerts', () => {
      customAlerts['myalert'] = { displayName: 'MY ALERT', emoji: '🎯', backgroundColor: '#f0f0f0', textColor: '#333', borderColor: '#666' };
      renderAlertsList();
      const item = customAlertsList.querySelector('[data-name="myalert"]');
      // The parent span has all buttons
      const actions = customAlertsList.querySelector('.alert-actions');
      expect(actions.querySelector('[data-action="edit"]')).not.toBeNull();
      expect(actions.querySelector('[data-action="duplicate"]')).not.toBeNull();
      expect(actions.querySelector('[data-action="delete"]')).not.toBeNull();
    });
  });
});
