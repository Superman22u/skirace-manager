import * as vscode from "vscode";
import { addPlayer, addRace, deletePlayer, deleteRace, deleteResult, deleteTip, loadData, updatePlayer, updateRace, upsertResult, upsertTip } from "../data";
import { scoreTip } from "../scoring";
import { AppDataV1, Gender } from "../types";
import { escapeHtml, webviewHtmlShell } from "./webviewUtils";

function toIsoDateOnly(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

function requireTop5(list: unknown): string[] | undefined {
  if (!Array.isArray(list)) return undefined;
  const top5 = list.map((x) => String(x ?? "").trim()).slice(0, 5);
  if (top5.length !== 5) return undefined;
  if (top5.some((s) => !s)) return undefined;
  return top5;
}

function createPanel(title: string, viewType: string): vscode.WebviewPanel {
  return vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {
    enableScripts: true,
  });
}

export class AddRacePanel {
  static show(context: vscode.ExtensionContext) {
    const panel = createPanel("Add ski race", "skiraceManager.addRace");
    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Add ski race",
      body: `
        <h2>Add ski race</h2>
        <div class="grid">
          <label for="name">Name</label>
          <input id="name" placeholder="e.g. Kitzbühel Downhill" />

          <label for="gender">Category</label>
          <select id="gender">
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>

          <label for="date">Date</label>
          <input id="date" type="date" />
        </div>
        <div class="row">
          <button id="save">Save</button>
          <span id="status" class="muted"></span>
        </div>
      `,
      script: `
        document.getElementById('date').value = new Date().toISOString().slice(0,10);
        document.getElementById('save').addEventListener('click', () => {
          vscode.postMessage({
            type: 'save',
            name: document.getElementById('name').value,
            gender: document.getElementById('gender').value,
            dateISO: document.getElementById('date').value,
          });
        });
        window.addEventListener('message', (event) => {
          const msg = event.data;
          const el = document.getElementById('status');
          if (msg.type === 'status') {
            el.textContent = msg.text;
            el.className = msg.kind === 'error' ? 'error' : 'ok';
          }
        });
      `,
    });

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type !== "save") return;
      const name = String(msg.name ?? "").trim();
      const gender = (String(msg.gender ?? "") as Gender) || "Men";
      const dateISO = toIsoDateOnly(String(msg.dateISO ?? ""));

      if (!name) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Name is required." });
        return;
      }

      await addRace(context, { name, gender, dateISO });
      panel.webview.postMessage({ type: "status", kind: "ok", text: "Race saved." });
    });
  }
}

export class AddPlayerPanel {
  static show(context: vscode.ExtensionContext) {
    const panel = createPanel("Add player", "skiraceManager.addPlayer");
    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Add player",
      body: `
        <h2>Add player</h2>
        <div class="grid">
          <label for="name">Name</label>
          <input id="name" placeholder="e.g. Rene" />
        </div>
        <div class="row">
          <button id="save">Save</button>
          <span id="status" class="muted"></span>
        </div>
      `,
      script: `
        document.getElementById('save').addEventListener('click', () => {
          vscode.postMessage({ type: 'save', name: document.getElementById('name').value });
        });
        window.addEventListener('message', (event) => {
          const msg = event.data;
          const el = document.getElementById('status');
          if (msg.type === 'status') {
            el.textContent = msg.text;
            el.className = msg.kind === 'error' ? 'error' : 'ok';
          }
        });
      `,
    });

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type !== "save") return;
      const name = String(msg.name ?? "").trim();
      if (!name) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Name is required." });
        return;
      }
      await addPlayer(context, { name });
      panel.webview.postMessage({ type: "status", kind: "ok", text: "Player saved." });
    });
  }
}

export class AddTipPanel {
  static async show(context: vscode.ExtensionContext) {
    const data = await loadData(context);
    const panel = createPanel("Add tipp", "skiraceManager.addTip");

    const raceOptions = data.races
      .slice()
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map((r) => `<option value="${escapeHtml(r.id)}">${escapeHtml(`${r.dateISO} — ${r.gender} — ${r.name}`)}</option>`)
      .join("");

    const playerOptions = data.players
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
      .join("");

    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Add tipp",
      body: `
        <h2>Add tipp</h2>
        <p class="muted">Pick the top 5 skiers in rank order.</p>
        <div class="grid">
          <label for="race">Race</label>
          <select id="race">${raceOptions || `<option value="">(no races yet)</option>`}</select>

          <label for="player">Player</label>
          <select id="player">${playerOptions || `<option value="">(no players yet)</option>`}</select>

          <label for="p1">Rank 1</label><input id="p1" placeholder="Skier name" />
          <label for="p2">Rank 2</label><input id="p2" placeholder="Skier name" />
          <label for="p3">Rank 3</label><input id="p3" placeholder="Skier name" />
          <label for="p4">Rank 4</label><input id="p4" placeholder="Skier name" />
          <label for="p5">Rank 5</label><input id="p5" placeholder="Skier name" />
        </div>
        <div class="row">
          <button id="save">Save</button>
          <span id="status" class="muted"></span>
        </div>
      `,
      script: `
        document.getElementById('save').addEventListener('click', () => {
          vscode.postMessage({
            type: 'save',
            raceId: document.getElementById('race').value,
            playerId: document.getElementById('player').value,
            picks: [
              document.getElementById('p1').value,
              document.getElementById('p2').value,
              document.getElementById('p3').value,
              document.getElementById('p4').value,
              document.getElementById('p5').value,
            ],
          });
        });
        window.addEventListener('message', (event) => {
          const msg = event.data;
          const el = document.getElementById('status');
          if (msg.type === 'status') {
            el.textContent = msg.text;
            el.className = msg.kind === 'error' ? 'error' : 'ok';
          }
        });
      `,
    });

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type !== "save") return;
      const raceId = String(msg.raceId ?? "");
      const playerId = String(msg.playerId ?? "");
      const picks = requireTop5(msg.picks);

      if (!raceId || !playerId) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Race and Player are required." });
        return;
      }
      if (!picks) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Please fill all 5 ranks." });
        return;
      }

      await upsertTip(context, { raceId, playerId, picks });
      panel.webview.postMessage({ type: "status", kind: "ok", text: "Tip saved." });
    });
  }
}

export class AddResultPanel {
  static async show(context: vscode.ExtensionContext) {
    const data = await loadData(context);
    const panel = createPanel("Add result", "skiraceManager.addResult");

    const raceOptions = data.races
      .slice()
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map((r) => `<option value="${escapeHtml(r.id)}">${escapeHtml(`${r.dateISO} — ${r.gender} — ${r.name}`)}</option>`)
      .join("");

    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Add result",
      body: `
        <h2>Add result</h2>
        <p class="muted">Enter the official top 5 result for a race.</p>
        <div class="grid">
          <label for="race">Race</label>
          <select id="race">${raceOptions || `<option value="">(no races yet)</option>`}</select>

          <label for="r1">Rank 1</label><input id="r1" placeholder="Skier name" />
          <label for="r2">Rank 2</label><input id="r2" placeholder="Skier name" />
          <label for="r3">Rank 3</label><input id="r3" placeholder="Skier name" />
          <label for="r4">Rank 4</label><input id="r4" placeholder="Skier name" />
          <label for="r5">Rank 5</label><input id="r5" placeholder="Skier name" />
        </div>
        <div class="row">
          <button id="save">Save</button>
          <span id="status" class="muted"></span>
        </div>
      `,
      script: `
        document.getElementById('save').addEventListener('click', () => {
          vscode.postMessage({
            type: 'save',
            raceId: document.getElementById('race').value,
            top5: [
              document.getElementById('r1').value,
              document.getElementById('r2').value,
              document.getElementById('r3').value,
              document.getElementById('r4').value,
              document.getElementById('r5').value,
            ],
          });
        });
        window.addEventListener('message', (event) => {
          const msg = event.data;
          const el = document.getElementById('status');
          if (msg.type === 'status') {
            el.textContent = msg.text;
            el.className = msg.kind === 'error' ? 'error' : 'ok';
          }
        });
      `,
    });

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type !== "save") return;
      const raceId = String(msg.raceId ?? "");
      const top5 = requireTop5(msg.top5);

      if (!raceId) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Race is required." });
        return;
      }
      if (!top5) {
        panel.webview.postMessage({ type: "status", kind: "error", text: "Please fill all 5 ranks." });
        return;
      }

      await upsertResult(context, { raceId, top5 });
      panel.webview.postMessage({ type: "status", kind: "ok", text: "Result saved." });
    });
  }
}

export class ShowTipResultsPanel {
  static async show(context: vscode.ExtensionContext) {
    const data = await loadData(context);
    const panel = createPanel("Tipp results", "skiraceManager.showTipResults");

    const races = data.races.slice().sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const players = data.players.slice().sort((a, b) => a.name.localeCompare(b.name));

    const resultByRaceId = new Map(data.results.map((r) => [r.raceId, r]));
    const tipsByRaceId = new Map<string, typeof data.tips>();
    for (const tip of data.tips) {
      const arr = tipsByRaceId.get(tip.raceId) ?? [];
      arr.push(tip);
      tipsByRaceId.set(tip.raceId, arr);
    }

    const sections = races.map((race) => {
      const result = resultByRaceId.get(race.id);
      const tips = (tipsByRaceId.get(race.id) ?? []).slice();

      const rows = players.map((p) => {
        const tip = tips.find((t) => t.playerId === p.id);
        const points = tip && result ? scoreTip(tip.picks, result.top5) : 0;
        const status = !tip ? "No tip" : !result ? "Waiting result" : "Scored";
        return `<tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${points}</td>
          <td class="muted">${escapeHtml(status)}</td>
        </tr>`;
      });

      const top5Text = result
        ? result.top5.map(escapeHtml).join(", ")
        : "<span class='muted'>(no result yet)</span>";

      return `
        <h3>${escapeHtml(`${race.dateISO} — ${race.gender} — ${race.name}`)}</h3>
        <div class="muted" style="margin: 6px 0 10px;">Result top 5: ${top5Text}</div>
        <table>
          <thead><tr><th>Player</th><th>Points</th><th>Status</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
        <div style="height: 18px;"></div>
      `;
    });

    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Tipp results",
      body: `
        <h2>Tipp results</h2>
        <p class="muted">Scoring: 3 points for correct rank, 1 point if the name is in top 5 but wrong rank, 0 otherwise.</p>
        ${sections.join("") || `<p class="muted">No races yet.</p>`}
      `,
      script: `// no-op`,
    });
  }
}

export class ManageDataPanel {
  static async show(context: vscode.ExtensionContext) {
    const data = await loadData(context);
    const panel = createPanel("Manage data", "skiraceManager.manageData");

    const initialDataJson = escapeHtml(JSON.stringify(data));

    panel.webview.html = webviewHtmlShell({
      webview: panel.webview,
      title: "Manage data",
      body: `
        <h2>Manage data</h2>
        <p class="muted">Edit or delete players, races, tips, and results.</p>
        <div id="status" class="muted"></div>

        <h3>Players</h3>
        <div id="players"></div>

        <h3>Races</h3>
        <div id="races"></div>

        <h3>Tips</h3>
        <div id="tips"></div>

        <h3>Results</h3>
        <div id="results"></div>

        <script id="initial-data" type="application/json">${initialDataJson}</script>
      `,
      script: `
        const statusEl = document.getElementById('status');
        let state = JSON.parse(document.getElementById('initial-data').textContent);

        function setStatus(kind, text) {
          statusEl.textContent = text || '';
          statusEl.className = kind === 'error' ? 'error' : kind === 'ok' ? 'ok' : 'muted';
        }

        function renderPlayers() {
          if (!state.players.length) {
            document.getElementById('players').innerHTML = '<p class="muted">(no players yet)</p>';
            return;
          }
          const rows = state.players
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(p => \`<tr>
              <td>\${p.name}</td>
              <td>
                <button data-action="edit-player" data-id="\${p.id}">Edit</button>
                <button data-action="delete-player" data-id="\${p.id}">Delete</button>
              </td>
            </tr>\`)
            .join('');
          document.getElementById('players').innerHTML = \`
            <table>
              <thead><tr><th>Name</th><th>Actions</th></tr></thead>
              <tbody>\${rows}</tbody>
            </table>
          \`;
        }

        function renderRaces() {
          if (!state.races.length) {
            document.getElementById('races').innerHTML = '<p class="muted">(no races yet)</p>';
            return;
          }
          const rows = state.races
            .slice()
            .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
            .map(r => \`<tr>
              <td>\${r.dateISO}</td>
              <td>\${r.gender}</td>
              <td>\${r.name}</td>
              <td>
                <button data-action="edit-race" data-id="\${r.id}">Edit</button>
                <button data-action="delete-race" data-id="\${r.id}">Delete</button>
              </td>
            </tr>\`)
            .join('');
          document.getElementById('races').innerHTML = \`
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Name</th><th>Actions</th></tr></thead>
              <tbody>\${rows}</tbody>
            </table>
          \`;
        }

        function renderTips() {
          if (!state.tips.length) {
            document.getElementById('tips').innerHTML = '<p class="muted">(no tips yet)</p>';
            return;
          }
          const raceById = new Map(state.races.map(r => [r.id, r]));
          const playerById = new Map(state.players.map(p => [p.id, p]));
          const rows = state.tips
            .slice()
            .map(t => {
              const race = raceById.get(t.raceId);
              const player = playerById.get(t.playerId);
              const raceLabel = race ? \`\${race.dateISO} — \${race.gender} — \${race.name}\` : '(missing race)';
              const playerLabel = player ? player.name : '(missing player)';
              const picks = (t.picks || []).join(', ');
              return \`<tr>
                <td>\${raceLabel}</td>
                <td>\${playerLabel}</td>
                <td>\${picks}</td>
                <td>
                  <button data-action="delete-tip" data-id="\${t.id}">Delete</button>
                </td>
              </tr>\`;
            })
            .join('');
          document.getElementById('tips').innerHTML = \`
            <table>
              <thead><tr><th>Race</th><th>Player</th><th>Picks</th><th>Actions</th></tr></thead>
              <tbody>\${rows}</tbody>
            </table>
          \`;
        }

        function renderResults() {
          if (!state.results.length) {
            document.getElementById('results').innerHTML = '<p class="muted">(no results yet)</p>';
            return;
          }
          const raceById = new Map(state.races.map(r => [r.id, r]));
          const rows = state.results
            .slice()
            .map(r => {
              const race = raceById.get(r.raceId);
              const raceLabel = race ? \`\${race.dateISO} — \${race.gender} — \${race.name}\` : '(missing race)';
              const top5 = (r.top5 || []).join(', ');
              return \`<tr>
                <td>\${raceLabel}</td>
                <td>\${top5}</td>
                <td>
                  <button data-action="delete-result" data-id="\${r.id}">Delete</button>
                </td>
              </tr>\`;
            })
            .join('');
          document.getElementById('results').innerHTML = \`
            <table>
              <thead><tr><th>Race</th><th>Top 5</th><th>Actions</th></tr></thead>
              <tbody>\${rows}</tbody>
            </table>
          \`;
        }

        function renderAll() {
          renderPlayers();
          renderRaces();
          renderTips();
          renderResults();
        }

        document.body.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLButtonElement)) return;
          const action = target.getAttribute('data-action');
          const id = target.getAttribute('data-id');
          if (!action || !id) return;

          if (action === 'edit-player') {
            const player = state.players.find(p => p.id === id);
            if (!player) return;
            const name = prompt('Player name', player.name);
            if (!name) return;
            vscode.postMessage({ type: 'updatePlayer', id, name });
          } else if (action === 'delete-player') {
            if (!confirm('Delete this player and all their tips?')) return;
            vscode.postMessage({ type: 'deletePlayer', id });
          } else if (action === 'edit-race') {
            const race = state.races.find(r => r.id === id);
            if (!race) return;
            const name = prompt('Race name', race.name);
            if (!name) return;
            const gender = prompt('Category (Men/Women)', race.gender);
            if (!gender) return;
            const dateISO = prompt('Date (YYYY-MM-DD)', race.dateISO);
            if (!dateISO) return;
            vscode.postMessage({ type: 'updateRace', id, name, gender, dateISO });
          } else if (action === 'delete-race') {
            if (!confirm('Delete this race, its tips and its results?')) return;
            vscode.postMessage({ type: 'deleteRace', id });
          } else if (action === 'delete-tip') {
            if (!confirm('Delete this tip?')) return;
            vscode.postMessage({ type: 'deleteTip', id });
          } else if (action === 'delete-result') {
            if (!confirm('Delete this result?')) return;
            vscode.postMessage({ type: 'deleteResult', id });
          }
        });

        window.addEventListener('message', (event) => {
          const msg = event.data;
          if (msg.type === 'status') {
            setStatus(msg.kind, msg.text);
          } else if (msg.type === 'data') {
            state = msg.data;
            renderAll();
          }
        });

        renderAll();
      `,
    });

    panel.webview.onDidReceiveMessage(async (msg: any) => {
      const type = msg?.type;
      try {
        if (type === "updatePlayer") {
          const id = String(msg.id ?? "");
          const name = String(msg.name ?? "").trim();
          if (!id || !name) throw new Error("Player id and name are required.");
          await updatePlayer(context, id, { name });
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Player updated." });
        } else if (type === "deletePlayer") {
          const id = String(msg.id ?? "");
          if (!id) throw new Error("Player id is required.");
          await deletePlayer(context, id);
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Player deleted." });
        } else if (type === "updateRace") {
          const id = String(msg.id ?? "");
          const name = String(msg.name ?? "").trim();
          const gender = (String(msg.gender ?? "") as Gender) || "Men";
          const dateISO = toIsoDateOnly(String(msg.dateISO ?? ""));
          if (!id || !name) throw new Error("Race id and name are required.");
          await updateRace(context, id, { name, gender, dateISO });
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Race updated." });
        } else if (type === "deleteRace") {
          const id = String(msg.id ?? "");
          if (!id) throw new Error("Race id is required.");
          await deleteRace(context, id);
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Race deleted." });
        } else if (type === "deleteTip") {
          const id = String(msg.id ?? "");
          if (!id) throw new Error("Tip id is required.");
          await deleteTip(context, id);
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Tip deleted." });
        } else if (type === "deleteResult") {
          const id = String(msg.id ?? "");
          if (!id) throw new Error("Result id is required.");
          await deleteResult(context, id);
          panel.webview.postMessage({ type: "status", kind: "ok", text: "Result deleted." });
        } else {
          return;
        }

        // After every mutation, send fresh data
        const updated = await loadData(context);
        panel.webview.postMessage({ type: "data", data: sanitizeDataForWebview(updated) });
      } catch (err: any) {
        panel.webview.postMessage({
          type: "status",
          kind: "error",
          text: err?.message || "Unexpected error.",
        });
      }
    });
  }
}

function sanitizeDataForWebview(data: AppDataV1): AppDataV1 {
  // Currently just returns the data; kept for future shape changes / migrations.
  return data;
}
