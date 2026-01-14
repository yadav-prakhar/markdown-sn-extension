// Import the converter library
try {
  importScripts('../lib/markdown-servicenow.js');
  console.log('MD-SN Background: Library loaded successfully');
  console.log('MD-SN Background: markdownServicenow available:', typeof markdownServicenow);
} catch (error) {
  console.error('MD-SN Background: Failed to load library:', error);
}

// Create context menu
function setupContextMenu() {
  console.log('MD-SN Background: Setting up context menu...');
  chrome.contextMenus.removeAll(() => {
    try {
      chrome.contextMenus.create({
        id: 'convert-markdown',
        title: 'Convert Markdown to ServiceNow',
        contexts: ['selection'],
        documentUrlPatterns: ['*://*.service-now.com/*', '*://*.servicenow.com/*']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('MD-SN Background: Context menu creation error:', chrome.runtime.lastError);
        } else {
          console.log('MD-SN Background: Context menu created successfully');
        }
      });
    } catch (error) {
      console.error('MD-SN Background: Error creating context menu:', error);
    }
  });
}

// Create context menu on install and startup
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenu();
});

// Also create on service worker start
setupContextMenu();

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('MD-SN Background: Context menu clicked', info.menuItemId);
  if (info.menuItemId === 'convert-markdown' && info.selectionText) {
    // Send message to content script to convert the actual selection
    // (info.selectionText doesn't preserve newlines properly)
    chrome.tabs.sendMessage(tab.id, {
      action: 'convertSelection'
    }, (response) => {
      // Suppress expected "no receiving end" error - happens when no frame has selection
      // This is normal when selection is lost before message arrives
      if (chrome.runtime.lastError) {
        console.log('MD-SN Background: No frame handled selection (selection may have been lost)');
      } else if (response?.success) {
        console.log('MD-SN Background: Selection converted successfully');
      } else {
        console.log('MD-SN Background: Conversion response:', response);
      }
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convert') {
    try {
      const result = markdownServicenow.convertMarkdownToServiceNow(message.text);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});
