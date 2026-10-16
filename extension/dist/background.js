chrome.runtime.onInstalled.addListener(({reason:e})=>{e===chrome.runtime.OnInstalledReason.INSTALL&&chrome.tabs.create({url:chrome.runtime.getURL("welcome.html")})});
