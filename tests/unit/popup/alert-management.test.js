import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupPopup } from './_setup.js';

// Helper: add a custom alert via the real saveAlert() so it lands in the
// module-level customAlerts map inside popup.js.
function addCustomAlert(api, { name, displayName = 'MY ALERT', emoji = '🎯',
  bgColor = '#f0f0f0', textColor = '#333333', borderColor = '#666666' } = {}) {
  document.getElementById('editingAlert').value = '';
  document.getElementById('alertName').value = name;
  document.getElementById('alertDisplayName').value = displayName;
  document.getElementById('alertEmoji').value = emoji;
  document.getElementById('alertBgColor').value = bgColor;
  document.getElementById('alertTextColor').value = textColor;
  document.getElementById('alertBorderColor').value = borderColor;
  api.saveAlert({ preventDefault: vi.fn() });
}

describe('Alert Management - Rename & Duplicate', () => {
  let api;
  let alertNameInput, alertDisplayNameInput, alertEmojiInput;
  let alertBgColorInput, alertTextColorInput, alertBorderColorInput;
  let editingAlertInput, formTitle, saveAlertBtn, cancelEditBtn;
  let alertPreview, builtInAlertsList, customAlertsList;

  beforeEach(async () => {
    api = await setupPopup();

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
  });

  // ── editAlert ──────────────────────────────────────────────────────────────

  describe('editAlert - name field locking', () => {
    it('locks name field for built-in alerts', () => {
      api.editAlert('note');
      expect(alertNameInput.disabled).toBe(true);
    });

    it('unlocks name field for custom alerts', () => {
      addCustomAlert(api, { name: 'myalert' });
      api.editAlert('myalert');
      expect(alertNameInput.disabled).toBe(false);
    });

    it('populates form with correct values for built-in', () => {
      api.editAlert('note');
      expect(alertNameInput.value).toBe('note');
      expect(alertDisplayNameInput.value).toBe('NOTE');
      expect(alertEmojiInput.value).toBe('📝');
    });

    it('applies custom overrides when editing modified built-in', () => {
      // Override built-in 'note' by saving a custom entry with the same name
      document.getElementById('editingAlert').value = 'note';
      document.getElementById('alertName').value = 'note';
      document.getElementById('alertDisplayName').value = 'MY NOTE';
      document.getElementById('alertEmoji').value = '🗒️';
      document.getElementById('alertBgColor').value = '#ffffff';
      document.getElementById('alertTextColor').value = '#000000';
      document.getElementById('alertBorderColor').value = '#cccccc';
      api.saveAlert({ preventDefault: vi.fn() });

      api.editAlert('note');
      expect(alertDisplayNameInput.value).toBe('MY NOTE');
      expect(alertEmojiInput.value).toBe('🗒️');
      expect(alertNameInput.disabled).toBe(true); // still built-in
    });

    it('sets editingAlertInput to the alert name', () => {
      api.editAlert('warning');
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
      addCustomAlert(api, { name: 'myalert' });
      fillForm({ name: 'myalert', editing: 'myalert' });
      const result = api.validateAlertForm();
      expect(result).not.toBeNull();
      expect(result.name).toBe('myalert');
    });

    it('allows renaming a custom alert to a new unique name', () => {
      addCustomAlert(api, { name: 'myalert' });
      fillForm({ name: 'newalert', editing: 'myalert' });
      const result = api.validateAlertForm();
      expect(result).not.toBeNull();
      expect(result.name).toBe('newalert');
      expect(result.editingName).toBe('myalert');
    });

    it('blocks renaming to an existing custom alert name', () => {
      addCustomAlert(api, { name: 'myalert' });
      addCustomAlert(api, { name: 'other', emoji: '🔔' });
      fillForm({ name: 'other', editing: 'myalert' });
      const result = api.validateAlertForm();
      expect(result).toBeNull();
    });

    it('blocks renaming to an existing built-in name', () => {
      addCustomAlert(api, { name: 'myalert' });
      fillForm({ name: 'note', editing: 'myalert' }); // 'note' is a built-in
      const result = api.validateAlertForm();
      expect(result).toBeNull();
    });

    it('skips uniqueness check when editing a built-in alert', () => {
      fillForm({ name: 'note', displayName: 'NOTE', emoji: '📝', editing: 'note' });
      const result = api.validateAlertForm();
      expect(result).not.toBeNull();
    });

    it('validates format of new name during rename', () => {
      addCustomAlert(api, { name: 'myalert' });
      fillForm({ name: 'INVALID NAME!', editing: 'myalert' });
      const result = api.validateAlertForm();
      expect(result).toBeNull();
    });

    it('enforces 20-char limit during rename', () => {
      addCustomAlert(api, { name: 'myalert' });
      fillForm({ name: 'a_very_long_name_that_exceeds', editing: 'myalert' });
      const result = api.validateAlertForm();
      expect(result).toBeNull();
    });
  });

  // ── saveAlert - rename persistence ─────────────────────────────────────────

  describe('saveAlert - rename persistence', () => {
    function triggerSave() {
      api.saveAlert({ preventDefault: vi.fn() });
    }

    it('deletes old key when custom alert is renamed', () => {
      addCustomAlert(api, { name: 'myalert' });

      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();

      // 'renamed' should exist; verify via editAlert
      api.editAlert('renamed');
      expect(alertNameInput.value).toBe('renamed');
    });

    it('creates new key with same properties after rename', () => {
      addCustomAlert(api, { name: 'myalert', displayName: 'MY ALERT', emoji: '🎯' });

      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();

      api.editAlert('renamed');
      expect(alertDisplayNameInput.value).toBe('MY ALERT');
      expect(alertEmojiInput.value).toBe('🎯');
    });

    it('does not delete key when name is unchanged', () => {
      addCustomAlert(api, { name: 'myalert', displayName: 'MY ALERT', emoji: '🎯' });

      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'myalert';
      alertDisplayNameInput.value = 'UPDATED';
      alertEmojiInput.value = '🎯';
      triggerSave();

      api.editAlert('myalert');
      expect(alertNameInput.value).toBe('myalert');
      expect(alertDisplayNameInput.value).toBe('UPDATED');
    });

    it('calls saveCustomAlertsToStorage after rename', () => {
      addCustomAlert(api, { name: 'myalert' });
      const setCalls = chrome.storage.local.set.mock.calls.length;

      editingAlertInput.value = 'myalert';
      alertNameInput.value = 'renamed';
      alertDisplayNameInput.value = 'MY ALERT';
      alertEmojiInput.value = '🎯';
      triggerSave();

      expect(chrome.storage.local.set.mock.calls.length).toBeGreaterThan(setCalls);
    });
  });

  // ── duplicateAlert ─────────────────────────────────────────────────────────

  describe('duplicateAlert', () => {
    it('creates a copy with _copy suffix for built-in alert', () => {
      api.duplicateAlert('note');
      api.renderAlertsList();
      const dupItem = customAlertsList.querySelector('[data-name="note_copy"]');
      expect(dupItem).not.toBeNull();
    });

    it('copies all properties from source built-in alert', () => {
      api.duplicateAlert('note');
      api.editAlert('note_copy');
      expect(alertDisplayNameInput.value).toBe('NOTE');
      expect(alertEmojiInput.value).toBe('📝');
    });

    it('creates a copy with _copy suffix for custom alert', () => {
      addCustomAlert(api, { name: 'myalert', displayName: 'MY ALERT', emoji: '🎯' });
      api.duplicateAlert('myalert');
      api.renderAlertsList();
      const dupItem = customAlertsList.querySelector('[data-name="myalert_copy"]');
      expect(dupItem).not.toBeNull();
    });

    it('copies displayName from custom alert', () => {
      addCustomAlert(api, { name: 'myalert', displayName: 'MY ALERT', emoji: '🎯' });
      api.duplicateAlert('myalert');
      api.editAlert('myalert_copy');
      expect(alertDisplayNameInput.value).toBe('MY ALERT');
    });

    it('uses _copy_2 when _copy already exists', () => {
      api.duplicateAlert('note');       // creates note_copy
      api.duplicateAlert('note');       // should create note_copy_2
      api.renderAlertsList();
      const copy2 = customAlertsList.querySelector('[data-name="note_copy_2"]');
      expect(copy2).not.toBeNull();
    });

    it('increments suffix further when multiple copies exist', () => {
      api.duplicateAlert('note');       // note_copy
      api.duplicateAlert('note');       // note_copy_2
      api.duplicateAlert('note');       // note_copy_3
      api.renderAlertsList();
      const copy3 = customAlertsList.querySelector('[data-name="note_copy_3"]');
      expect(copy3).not.toBeNull();
    });

    it('truncates base name to 15 chars before adding _copy', () => {
      addCustomAlert(api, { name: 'averylongnamex', displayName: 'LONG', emoji: '🔔' });
      api.duplicateAlert('averylongnamex');
      api.renderAlertsList();
      const keys = Array.from(customAlertsList.querySelectorAll('[data-name]'))
        .map(el => el.dataset.name)
        .filter(n => n.includes('_copy'));
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(k => expect(k.length).toBeLessThanOrEqual(20));
    });

    it('merges built-in defaults with custom overrides when duplicating modified built-in', () => {
      document.getElementById('editingAlert').value = 'note';
      document.getElementById('alertName').value = 'note';
      document.getElementById('alertDisplayName').value = 'MY NOTE';
      document.getElementById('alertEmoji').value = '🗒️';
      document.getElementById('alertBgColor').value = '#ffffff';
      document.getElementById('alertTextColor').value = '#000000';
      document.getElementById('alertBorderColor').value = '#cccccc';
      api.saveAlert({ preventDefault: vi.fn() });

      api.duplicateAlert('note');
      api.editAlert('note_copy');
      expect(alertDisplayNameInput.value).toBe('MY NOTE');
      expect(alertEmojiInput.value).toBe('🗒️');
    });

    it('calls saveCustomAlertsToStorage after duplicating', () => {
      const setCalls = chrome.storage.local.set.mock.calls.length;
      api.duplicateAlert('note');
      expect(chrome.storage.local.set.mock.calls.length).toBeGreaterThan(setCalls);
    });

    it('shows a toast with the new name', () => {
      vi.useFakeTimers();
      api.duplicateAlert('note');
      const message = document.querySelector('.toast-message');
      expect(message.textContent).toBe('Duplicated as NOTE_COPY');
      vi.useRealTimers();
    });
  });

  // ── renderAlertsList ───────────────────────────────────────────────────────

  describe('renderAlertsList - duplicate button presence', () => {
    it('renders duplicate button for each built-in alert', () => {
      api.renderAlertsList();
      const dupButtons = builtInAlertsList.querySelectorAll('[data-action="duplicate"]');
      // There are 10 built-in alerts
      expect(dupButtons.length).toBe(10);
    });

    it('renders duplicate button for each custom alert', () => {
      addCustomAlert(api, { name: 'myalert' });
      addCustomAlert(api, { name: 'other', emoji: '🔔' });
      api.renderAlertsList();
      const dupButtons = customAlertsList.querySelectorAll('[data-action="duplicate"]');
      expect(dupButtons.length).toBe(2);
    });

    it('each duplicate button has the correct data-name', () => {
      api.renderAlertsList();
      const noteBtn = builtInAlertsList.querySelector('[data-action="duplicate"][data-name="note"]');
      expect(noteBtn).not.toBeNull();
    });

    it('renders edit and delete buttons alongside duplicate for custom alerts', () => {
      addCustomAlert(api, { name: 'myalert' });
      api.renderAlertsList();
      const actions = customAlertsList.querySelector('.alert-actions');
      expect(actions.querySelector('[data-action="edit"]')).not.toBeNull();
      expect(actions.querySelector('[data-action="duplicate"]')).not.toBeNull();
      expect(actions.querySelector('[data-action="delete"]')).not.toBeNull();
    });
  });
});
