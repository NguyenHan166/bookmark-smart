chrome.runtime.onInstalled.addListener(() => {
  if (!chrome.sidePanel) {
    return
  }

  chrome.sidePanel.setOptions({
    path: 'sidepanel/sidepanel.html',
    enabled: true,
  })
})

chrome.action.onClicked.addListener(async (tab) => {
  if (!chrome.sidePanel || !tab.windowId) {
    return
  }

  try {
    await chrome.sidePanel.open({ windowId: tab.windowId })
  } catch {
    // Ignore errors when the panel is already open.
  }
})
