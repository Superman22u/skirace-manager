"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadData = loadData;
exports.saveData = saveData;
exports.addRace = addRace;
exports.updateRace = updateRace;
exports.deleteRace = deleteRace;
exports.addPlayer = addPlayer;
exports.updatePlayer = updatePlayer;
exports.deletePlayer = deletePlayer;
exports.upsertTip = upsertTip;
exports.deleteTip = deleteTip;
exports.upsertResult = upsertResult;
exports.deleteResult = deleteResult;
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
const DATA_FILE_NAME = "skirace-data.json";
function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function nowIso() {
    return new Date().toISOString();
}
async function ensureDir(context) {
    try {
        await vscode.workspace.fs.createDirectory(context.globalStorageUri);
    }
    catch {
        // ignore
    }
}
function dataUri(context) {
    return vscode.Uri.joinPath(context.globalStorageUri, DATA_FILE_NAME);
}
async function loadData(context) {
    await ensureDir(context);
    const uri = dataUri(context);
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const raw = new TextDecoder("utf-8").decode(bytes);
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1) {
            return (0, types_1.emptyDataV1)();
        }
        return {
            version: 1,
            races: Array.isArray(parsed.races) ? parsed.races : [],
            players: Array.isArray(parsed.players) ? parsed.players : [],
            tips: Array.isArray(parsed.tips) ? parsed.tips : [],
            results: Array.isArray(parsed.results) ? parsed.results : [],
        };
    }
    catch {
        return (0, types_1.emptyDataV1)();
    }
}
async function saveData(context, data) {
    await ensureDir(context);
    const uri = dataUri(context);
    const raw = JSON.stringify(data, null, 2);
    const bytes = new TextEncoder().encode(raw);
    await vscode.workspace.fs.writeFile(uri, bytes);
}
// Races
async function addRace(context, input) {
    const data = await loadData(context);
    const race = { id: makeId(), createdAt: nowIso(), ...input };
    data.races.push(race);
    await saveData(context, data);
    return race;
}
async function updateRace(context, id, input) {
    const data = await loadData(context);
    const race = data.races.find((r) => r.id === id);
    if (!race) {
        return undefined;
    }
    race.name = input.name;
    race.gender = input.gender;
    race.dateISO = input.dateISO;
    await saveData(context, data);
    return race;
}
async function deleteRace(context, id) {
    const data = await loadData(context);
    data.races = data.races.filter((r) => r.id !== id);
    // Also remove related results and tips to keep data consistent
    data.results = data.results.filter((r) => r.raceId !== id);
    data.tips = data.tips.filter((t) => t.raceId !== id);
    await saveData(context, data);
}
// Players
async function addPlayer(context, input) {
    const data = await loadData(context);
    const player = { id: makeId(), createdAt: nowIso(), ...input };
    data.players.push(player);
    await saveData(context, data);
    return player;
}
async function updatePlayer(context, id, input) {
    const data = await loadData(context);
    const player = data.players.find((p) => p.id === id);
    if (!player) {
        return undefined;
    }
    player.name = input.name;
    await saveData(context, data);
    return player;
}
async function deletePlayer(context, id) {
    const data = await loadData(context);
    data.players = data.players.filter((p) => p.id !== id);
    // Remove tips belonging to this player
    data.tips = data.tips.filter((t) => t.playerId !== id);
    await saveData(context, data);
}
// Tipps
async function upsertTip(context, input) {
    const data = await loadData(context);
    const existing = data.tips.find((t) => t.raceId === input.raceId && t.playerId === input.playerId);
    if (existing) {
        existing.picks = input.picks;
        existing.updatedAt = nowIso();
        await saveData(context, data);
        return existing;
    }
    const tip = {
        id: makeId(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        ...input,
    };
    data.tips.push(tip);
    await saveData(context, data);
    return tip;
}
async function deleteTip(context, id) {
    const data = await loadData(context);
    data.tips = data.tips.filter((t) => t.id !== id);
    await saveData(context, data);
}
// Results
async function upsertResult(context, input) {
    const data = await loadData(context);
    const existing = data.results.find((r) => r.raceId === input.raceId);
    if (existing) {
        existing.top5 = input.top5;
        existing.updatedAt = nowIso();
        await saveData(context, data);
        return existing;
    }
    const result = {
        id: makeId(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        ...input,
    };
    data.results.push(result);
    await saveData(context, data);
    return result;
}
async function deleteResult(context, id) {
    const data = await loadData(context);
    data.results = data.results.filter((r) => r.id !== id);
    await saveData(context, data);
}
//# sourceMappingURL=storage.js.map