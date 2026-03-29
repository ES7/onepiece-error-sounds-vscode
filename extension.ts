import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';

let lastPlayedTime = 0;
const COOLDOWN = 3000;

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

function classify(text: string): 'shanks' | 'katakuri' | 'luffy' | null {
    const t = text.toLowerCase();
    if (t.includes('fatal') || t.includes('critical') || t.includes('panic')) return 'shanks';
    if (t.includes('error') || t.includes('failed') || t.includes('not recognized') || t.includes('cannot') || t.includes('exception') || t.includes('commandnotfound')) return 'katakuri';
    if (t.includes('warning') || t.includes('warn') || t.includes('deprecated')) return 'luffy';
    return null;
}

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

    // Tracks what the terminal text listener already classified
    // So exit code listener doesn't override it
    let lastTerminalLevel: 'shanks' | 'katakuri' | 'luffy' | null = null;
    let lastTerminalTime = 0;

    // ── 1. Terminal text listener (proposed API, F5 mode) ─────────────────────
    const onDidWriteTerminalData = (vscode.window as any).onDidWriteTerminalData;
    if (typeof onDidWriteTerminalData === 'function') {
        console.log('[One Piece] ✅ Terminal data API available');
        let buffer = '';
        let collecting = false;

        context.subscriptions.push(
            onDidWriteTerminalData((e: any) => {
                const raw = e.data;

                if (raw.includes('\u001b]633;C')) {
                    collecting = true;
                    buffer = '';
                }

                if (collecting && !raw.includes('\u001b]633;C') && !raw.includes('\u001b]633;D')) {
                    buffer += raw;
                }

                if (collecting && raw.includes('\u001b]633;C')) {
                    const afterC = raw.split('\u001b]633;C')[1] || '';
                    if (afterC) buffer += afterC;
                }

                if (raw.includes('\u001b]633;D')) {
                    collecting = false;
                    const beforeD = raw.split('\u001b]633;D')[0] || '';
                    if (beforeD && !beforeD.includes('\u001b]633;C')) buffer += beforeD;

                    const clean = buffer
                        .replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, '')
                        .replace(/\x1B\][^\x07]*\x07/g, '')
                        .replace(/\r\n|\r|\n/g, ' ')
                        .trim();
                    buffer = '';

                    if (!clean) return;

                    console.log(`[One Piece] Terminal: "${clean.substring(0, 100)}"`);
                    const level = classify(clean);

                    // Save what text listener found — exit code listener will respect this
                    lastTerminalLevel = level;
                    lastTerminalTime = Date.now();

                    if (level) trigger(level);
                }
            })
        );
    }

    // ── 2. Exit code listener ─────────────────────────────────────────────────
    // Only fires if text listener didn't already handle it
    const onDidEndTerminalShellExecution = (vscode.window as any).onDidEndTerminalShellExecution;
    if (typeof onDidEndTerminalShellExecution === 'function') {
        console.log('[One Piece] ✅ Shell exit code API available');
        context.subscriptions.push(
            onDidEndTerminalShellExecution((e: any) => {
                const exitCode = e.exitCode;
                console.log(`[One Piece] Exit code: ${exitCode}`);
                if (exitCode === undefined || exitCode === 0) return;

                // Wait 800ms so text listener can classify first
                // Text classification is more accurate (fatal=shanks, error=katakuri etc)
                setTimeout(() => {
                    // If text listener classified within last 1.5s, skip exit code
                    if (Date.now() - lastTerminalTime < 1500 && lastTerminalLevel !== null) {
                        console.log(`[One Piece] Text handled as ${lastTerminalLevel} — skipping exit code`);
                        return;
                    }
                    // Text found nothing — fallback to exit code
                    console.log(`[One Piece] No text match — using exit code ${exitCode}`);
                    if (exitCode >= 2) trigger('shanks');
                    else trigger('katakuri');
                }, 800);
            })
        );
    }

    // ── 3. Editor diagnostics ─────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics((e) => {
            let played = false;
            for (const uri of e.uris) {
                if (played) break;
                for (const d of vscode.languages.getDiagnostics(uri)) {
                    if (played) break;
                    if (d.severity === vscode.DiagnosticSeverity.Error) {
                        trigger(classify(d.message) ?? 'katakuri');
                        played = true;
                    } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
                        trigger('luffy');
                        played = true;
                    }
                }
            }
        })
    );

    // ── 4. Test command ───────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.commands.registerCommand('onepieceErrors.test', async () => {
            const pick = await vscode.window.showQuickPick(
                ['🟢 luffy (warning)', '🟡 katakuri (error)', '🔴 shanks (fatal)'],
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