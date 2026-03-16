"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = getNonce;
exports.escapeHtml = escapeHtml;
exports.webviewHtmlShell = webviewHtmlShell;
function getNonce() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function escapeHtml(s) {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function webviewHtmlShell(params) {
    const nonce = getNonce();
    const csp = [
        `default-src 'none';`,
        `img-src ${params.webview.cspSource} https:;`,
        `style-src ${params.webview.cspSource} 'unsafe-inline';`,
        `script-src 'nonce-${nonce}';`,
    ].join(" ");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${params.title}</title>
  <style>
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
    h2 { margin: 0 0 12px; }
    h3 { margin: 16px 0 8px; }
    .row { margin: 10px 0; display: flex; gap: 10px; align-items: center; }
    label { min-width: 120px; }
    input, select { width: 100%; max-width: 520px; padding: 6px 8px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); }
    button { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; cursor: pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .muted { opacity: 0.8; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid var(--vscode-editorWidget-border); padding: 6px 8px; text-align: left; }
    .grid { display: grid; grid-template-columns: 120px 1fr; gap: 10px; }
    .error { color: var(--vscode-errorForeground); }
    .ok { color: var(--vscode-charts-green); }
  </style>
</head>
<body>
  ${params.body}
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    ${params.script}
  </script>
</body>
</html>`;
}
//# sourceMappingURL=webviewUtils.js.map