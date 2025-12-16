// Import the converter library
importScripts('../lib/markdown-servicenow.js');

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-markdown',
    title: 'Convert Markdown to ServiceNow',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'convert-markdown' && info.selectionText) {
    try {
      const converted = markdownServicenow.convertMarkdownToServiceNow(info.selectionText);
      
      // Send to content script to replace selection or copy to clipboard
      chrome.tabs.sendMessage(tab.id, {
        action: 'replaceSelection',
        text: converted
      }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          // Fallback: copy to clipboard
          copyToClipboard(converted);
        }
      });
    } catch (error) {
      console.error('Conversion error:', error);
    }
  }
});

// Helper to copy to clipboard (fallback)
async function copyToClipboard(text) {
  try {
    await chrome.offscreen?.createDocument?.({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy converted markdown to clipboard'
    });
  } catch (e) {
    // Document may already exist
  }
  
  // For MV3, we need to use a different approach
  chrome.storage.local.set({ clipboardText: text }, () => {
    chrome.notifications?.create?.({
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: 'Markdown Converted',
      message: 'Output copied to clipboard!'
    });
  });
}

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
