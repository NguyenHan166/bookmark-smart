chrome.action.onClicked.addListener(async () => {
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('app/app.html'),
      type: 'popup',
      width: 1120,
      height: 760,
      focused: true,
    })
  } catch {
    // Ignore errors when the browser blocks opening a window.
  }
})
