import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';

let lastPlayedTime = 0;
const COOLDOWN = 3000;

// ─── Sound Player ─────────────────────────────────────────────────────────────

function playSound(filePath: string, label: string) {
    const now = Date.now();
    if (now - lastPlayedTime < COOLDOWN) return;
    lastPlayedTime = now;

    if (!fs.existsSync(filePath)) {
        console.error(`[One Piece] NOT FOUND: ${filePath}`);
        return;
    }

    console.log(`[One Piece] 🔊 ${label}`);
    const safePath = filePath.replace(/\\/g, '/');
    const command = `powershell -NoProfile -Command "(New-Object Media.SoundPlayer '${safePath}').PlaySync()"`;
    exec(command, (error, _stdout, stderr) => {
        if (error) console.error(`[One Piece] ${error.message}`);
        if (stderr) console.error(`[One Piece] ${stderr}`);
    });
}

// ─── Command Classifier ───────────────────────────────────────────────────────

// 🔴 SHANKS — Infrastructure / DevOps / System level
// Server down, cluster issue, infra broke = most dangerous
const SHANKS_COMMANDS = [
    'docker', 'docker-compose',
    'kubectl', 'terraform', 'ansible', 'helm',
    'kill', 'taskkill', 'shutdown', 'reboot',
];

// 🟡 KATAKURI — Code / Build / Test failures
// Build broke, tests failed, compile error = medium severity
const KATAKURI_COMMANDS = [
    // JavaScript / Node
    'node', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
    'jest', 'vitest', 'mocha', 'jasmine', 'cypress', 'playwright',
    // TypeScript
    'tsc', 'ts-node',
    // Python
    'python', 'python3', 'pip', 'pip3', 'pytest', 'poetry', 'pipenv',
    'uvicorn', 'gunicorn', 'flask', 'django-admin',
    // Rust
    'cargo', 'rustc',
    // Go
    'go',
    // Java / JVM
    'java', 'javac', 'mvn', 'gradle', 'kotlin',
    // C / C++
    'gcc', 'g++', 'clang', 'make', 'cmake',
    // Git
    'git',
    // Build tools
    'vite', 'webpack', 'rollup', 'esbuild', 'parcel',
    // Testing
    'dotnet', 'phpunit', 'rspec', 'flutter',
    // Package managers
    'composer', 'gem', 'bundle',
    // Database
    'psql', 'mysql', 'mongo',
    // Shell scripts
    'bash', 'sh',
];

// 🟢 LUFFY — Everything else
// Unknown commands, typos, minor mistakes = easy/recoverable

function classifyCommand(cmd: string): 'shanks' | 'katakuri' | 'luffy' {
    if (!cmd) return 'luffy';

    // Extract base command — first word, strip full path
    const baseCmd = cmd.trim().toLowerCase().split(/\s+/)[0].replace(/^.*[/\\]/, '');

    for (const s of SHANKS_COMMANDS) {
        if (baseCmd === s) return 'shanks';
    }

    for (const k of KATAKURI_COMMANDS) {
        if (baseCmd === k) return 'katakuri';
    }

    // Unknown command = Luffy
    return 'luffy';
}

// ─── Activate ─────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {

    const sounds = {
        luffy:    context.asAbsolutePath('media/luffy.wav'),
        katakuri: context.asAbsolutePath('media/katakuri.wav'),
        shanks:   context.asAbsolutePath('media/shanks.wav'),
    };

    console.log('[One Piece] Activated 🚀');

    function trigger(level: 'shanks' | 'katakuri' | 'luffy') {
        playSound(sounds[level], level);
    }

    // ── 1. Shell execution listener (STABLE API) ──────────────────────────────
    // Fires when terminal command finishes
    // Check: what command ran + exit code != 0 = play sound
    const onDidEndTerminalShellExecution = (vscode.window as any).onDidEndTerminalShellExecution;

    if (typeof onDidEndTerminalShellExecution === 'function') {
        console.log('[One Piece] ✅ Shell integration API available');
        context.subscriptions.push(
            onDidEndTerminalShellExecution((e: any) => {
                const exitCode = e.exitCode;
                const cmd = e.execution?.commandLine?.value ?? '';

                console.log(`[One Piece] "${cmd}" → exit: ${exitCode}`);

                if (exitCode === undefined || exitCode === 0) return;

                const level = classifyCommand(cmd);
                console.log(`[One Piece] → ${level}`);
                trigger(level);
            })
        );
    } else {
        console.warn('[One Piece] ⚠️ Shell integration not available');
    }

    // ── 2. Editor diagnostics — RED errors only ───────────────────────────────
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics((e) => {
            let played = false;
            for (const uri of e.uris) {
                if (played) break;
                for (const d of vscode.languages.getDiagnostics(uri)) {
                    if (played) break;
                    if (d.severity === vscode.DiagnosticSeverity.Error) {
                        console.log(`[One Piece] Editor error → katakuri`);
                        trigger('katakuri');
                        played = true;
                    }
                }
            }
        })
    );

    // ── 3. Test command ───────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('onepieceErrors.test', async () => {
            const pick = await vscode.window.showQuickPick(
                ['luffy (unknown cmd)', 'katakuri (build/code)', 'shanks (infra/docker)'],
                { placeHolder: 'Pick a sound to test' }
            );
            if (!pick) return;
            lastPlayedTime = 0;
            if (pick.includes('luffy'))    trigger('luffy');
            if (pick.includes('katakuri')) trigger('katakuri');
            if (pick.includes('shanks'))   trigger('shanks');
        })
    );

    vscode.window.showInformationMessage('One Piece Error Sounds activated! 🏴‍☠️');
}

export function deactivate() {}
