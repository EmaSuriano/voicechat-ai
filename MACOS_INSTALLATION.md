# macOS Installation Guide

## 🚨 Getting "App is damaged" Error?

If you see **"VoiceChat AI is damaged and can't be opened"** when trying to install the DMG, don't worry! The app isn't actually damaged - this is just macOS blocking unsigned apps for security.

## ⚡ Quick Fix (30 seconds)

1. **Install the app** by dragging it to your Applications folder
2. **Open Terminal** (Cmd+Space → type "Terminal")
3. **Copy and paste this command:**
   ```bash
   xattr -d com.apple.quarantine "/Applications/VoiceChat AI.app"
   ```
4. **Press Enter** and the app will now open normally!

## 🔄 Alternative Methods

If the Terminal command doesn't work for you:

### Method 1: System Preferences

1. Try to open the app (it will fail with error)
2. Go to **System Preferences** → **Security & Privacy** → **General**
3. Click **"Open Anyway"** next to the VoiceChat AI message
4. Confirm by clicking **"Open"** in the dialog

### Method 2: Right-click Override

1. **Right-click** the app in Applications folder
2. Select **"Open"** from the menu
3. Click **"Open"** in the security warning dialog

## ❓ Why Does This Happen?

- **Open source apps** built on GitHub Actions aren't code-signed with Apple certificates
- **macOS Gatekeeper** blocks unsigned apps by default for security
- **This is completely normal** for open-source projects without paid Apple Developer accounts

## 🔐 Is It Safe?

**Yes, absolutely!** The app is completely safe:

- ✅ **Open source** - you can review all code on GitHub
- ✅ **Built transparently** - all build steps visible in GitHub Actions
- ✅ **No malware** - the "damaged" message just means "unsigned"

## 💡 Pro Tip

This is the same process you'd use for **many popular open-source macOS apps** like:

- Homebrew-installed applications
- GitHub releases from open-source projects
- Developer tools and utilities

The quick fix is safe and widely used in the developer community! 🚀

---

**Having issues?** Feel free to [open an issue](https://github.com/EmaSuriano/voicechat-ai/issues) on GitHub.
