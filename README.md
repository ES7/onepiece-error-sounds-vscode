# 🏴‍☠️ One Piece Error Sounds — VS Code Extension

> A VS Code extension that plays One Piece character's Haki sounds based on error severity — Luffy for warnings, Katakuri for errors, and Shanks for fatal failures.

---

## 🎯 Inspiration

Inspired by the viral **"FAAAAA" terminal error sound** meme — where developers set up their terminal to dramatically react to errors. Instead of a random scream, why not let One Piece characters react based on *how bad* the error actually is?

---

## 🔊 Sound Categories

| Sound | Character | Severity | Triggers |
|---|---|---|---|
|  Luffy | Monkey D. Luffy | Warning | `warning`, `warn`, `deprecated` |
|  Katakuri | Charlotte Katakuri | Error | `error`, `failed`, `cannot`, `not recognized` |
|  Shanks | Red-Haired Shanks | Fatal | `fatal`, `critical`, `panic` |

---

## 📁 Project Structure

```
onepiece-error-sounds-vscode/
├── .vscode/
│    └── launch.json          # F5 debug config with proposed API flag
├── media/
│    ├── luffy.wav            # Warning sound
│    ├── katakuri.wav         # Error sound
│    └── shanks.wav           # Fatal sound
├── src/
│    └── extension.ts         # Main extension logic
│    └── types.d.ts           # Type declarations for external modules
├── package.json              # Extension manifest & metadata
├── package-lock.json         # Dependency lock file
└── tsconfig.json             # TypeScript compiler config
```

---

## ⚙️ How It Works

```
VS Code Extension
├── Terminal Listener (Proposed API — F5 only)
│   ├── OSC 633;C → start collecting output
│   ├── OSC 633;D → classify collected text
│   └── Text → shanks / katakuri / luffy
│
├── Exit Code Listener (Stable API — VSIX too)
│   ├── exit 0 → silence
│   ├── exit 1 → katakuri (800ms delay)
│   └── exit 2+ → shanks (800ms delay)
│
├── Diagnostics Listener (Stable API — VSIX too)
│   ├── Error severity → katakuri / shanks
│   └── Warning severity → luffy
│
└── Test Command
    └── Ctrl+Shift+P → "One Piece: Test Sounds"
```

---

## 🚀 Getting Started

### Prerequisites
- VS Code `^1.90.0`
- Node.js
- npm

### Installation & Run

```bash
# 1. Clone the repo
git clone https://github.com/ES7/onepiece-error-sounds-vscode.git
cd onepiece-error-sounds-vscode

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Press F5 in VS Code to launch Extension Development Host
```

A new VS Code window will open with the extension active. Test it from there.

---

### Build & Install as VSIX — For Daily Use
 
If you want to install the extension permanently (or share it), build a `.vsix` package.
 
**Step 1 — Install vsce (VS Code Extension packager):**
```bash
npm install -g @vscode/vsce
```
 
**Step 2 — Compile and package:**
```bash
npm run compile
vsce package
```
 
This creates `onepiece-error-sounds-0.0.1.vsix` in your project folder.
 
**Step 3 — Install in VS Code:**
```
Ctrl+Shift+P → "Extensions: Install from VSIX" → select the .vsix file
```
 
Or via terminal:
```bash
code --install-extension onepiece-error-sounds-0.0.1.vsix
```
 
> ⚠️ **Note:** VSIX mode uses exit code detection only (not terminal text). For full keyword-based classification, use F5 dev mode.
 
---
 
### Made Changes? Rebuild Like This:
 
```bash
# 1. Make your changes in src/extension.ts
 
# 2. Recompile
npm run compile
 
# 3. Repackage
vsce package
 
# 4. Reinstall
code --install-extension onepiece-error-sounds-0.0.1.vsix
 
# 5. Restart VS Code
```
 
---

## 🧪 Testing the Sounds

### From Command Palette
```
Ctrl+Shift+P → "One Piece: Test Sounds" → Pick a character
```

### From Terminal (in Extension Development Host window)

```powershell
# Luffy — warning
echo deprecated warning

# Katakuri — error
asdasda                  # command not found
npm run build            # if build fails

# Shanks — fatal
git status               # outside a git repo (fatal: not a git repository)
```

---

## ⚠️ Known Limitations

| Feature | F5 Dev Mode | VSIX Install |
|---|---|---|
| Terminal text classification | ✅ | ❌ |
| Exit code detection | ✅ | ✅ |
| Editor diagnostics (squiggles) | ✅ | ✅ |
| Test command | ✅ | ✅ |

Terminal text reading uses a **proposed API** (`terminalDataWriteEvent`) which only works in F5 development mode. For full functionality, run the extension from source using F5.

---

## 🛠️ Built With

- TypeScript
- VS Code Extension API
- PowerShell `Media.SoundPlayer` for audio playback

---

## 📄 Article

Read the full build journey, bugs faced, and lessons learned:
👉 [Medium Article](https://medium.com/@sayedebad.777/i-built-a-vs-code-extension-that-plays-one-piece-sounds-on-errors-heres-everything-i-learned-3b3673225432)

---

## 📜 License

MIT
