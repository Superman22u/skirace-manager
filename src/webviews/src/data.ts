import * as vscode from "vscode";
import { AppDataV1, emptyDataV1, Id, Player, Race, Result, Tip } from "./types";

const DATA_FILE_NAME = "skirace-data.json";

function makeId(): Id {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso(): stringBack {
  return new Date().toISOString();
}

async function ensureDir(context: vscode.ExtensionContext): Promise<void> {
  try {
    await vscode.workspace.fs.createDirectory(context.globalStorageUri);
  } catch {
    // ignore
  }
}

function dataUri(context: vscode.ExtensionContext): vscode.Uri {
  return vscode.Uri.joinPath(context.globalStorageUri, DATA_FILE_NAME);
}

export async function loadData(context: vscode.ExtensionContext): Promise<AppDataV1> {
  await ensureDir(context);
  const uri = dataUri(context);

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const raw = new TextDecoder("utf-8").decode(bytes);
    const parsed = JSON.parse(raw) as AppDataV1;
    if (!parsed || parsed.version !== 1) {
      return emptyDataV1();
    }
    return {
      version: 1,
      races: Array.isArray(parsed.races) ? parsed.races : [],
      players: Array.isArray(parsed.players) ? parsed.players : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      results: Array.isArray(parsed.results) ? parsed.results : [],
    };
  } catch {
    return emptyDataV1();
  }
}

export async function saveData(context: vscode.ExtensionContext, data: AppDataV1): Promise<void> {
  await ensureDir(context);
  const uri = dataUri(context);
  const raw = JSON.stringify(data, null, 2);
  const bytes = new TextEncoder().encode(raw);
  await vscode.workspace.fs.writeFile(uri, bytes);
}

// Races
export async function addRace(
  context: vscode.ExtensionContext,
  input: Pick<Race, "name" | "gender" | "dateISO">,
): Promise<Race> {
  const data = await loadData(context);
  const race: Race = { id: makeId(), createdAt: nowIso(), ...input };
  data.races.push(race);
  await saveData(context, data);
  return race;
}

export async function updateRace(
  context: vscode.ExtensionContext,
  id: Id,
  input: Pick<Race, "name" | "gender" | "dateISO">,
): Promise<Race | undefined> {
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

export async function deleteRace(context: vscode.ExtensionContext, id: Id): Promise<void> {
  const data = await loadData(context);
  data.races = data.races.filter((r) => r.id !== id);
  // Also remove related results and tips to keep data consistent
  data.results = data.results.filter((r) => r.raceId !== id);
  data.tips = data.tips.filter((t) => t.raceId !== id);
  await saveData(context, data);
}

// Players
export async function addPlayer(
  context: vscode.ExtensionContext,
  input: Pick<Player, "name">,
): Promise<Player> {
  const data = await loadData(context);
  const player: Player = { id: makeId(), createdAt: nowIso(), ...input };
  data.players.push(player);
  await saveData(context, data);
  return player;
}

export async function updatePlayer(
  context: vscode.ExtensionContext,
  id: Id,
  input: Pick<Player, "name">,
): Promise<Player | undefined> {
  const data = await loadData(context);
  const player = data.players.find((p) => p.id === id);
  if (!player) {
    return undefined;
  }
  player.name = input.name;
  await saveData(context, data);
  return player;
}

export async function deletePlayer(context: vscode.ExtensionContext, id: Id): Promise<void> {
  const data = await loadData(context);
  data.players = data.players.filter((p) => p.id !== id);
  // Remove tips belonging to this player
  data.tips = data.tips.filter((t) => t.playerId !== id);
  await saveData(context, data);
}

// Tipps
export async function upsertTip(
  context: vscode.ExtensionContext,
  input: Pick<Tip, "raceId" | "playerId" | "picks">,
): Promise<Tip> {
  const data = await loadData(context);
  const existing = data.tips.find((t) => t.raceId === input.raceId && t.playerId === input.playerId);
  if (existing) {
    existing.picks = input.picks;
    existing.updatedAt = nowIso();
    await saveData(context, data);
    return existing;
  }

  const tip: Tip = {
    id: makeId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  };
  data.tips.push(tip);
  await saveData(context, data);
  return tip;
}

export async function deleteTip(context: vscode.ExtensionContext, id: Id): Promise<void> {
  const data = await loadData(context);
  data.tips = data.tips.filter((t) => t.id !== id);
  await saveData(context, data);
}

// Results
export async function upsertResult(
  context: vscode.ExtensionContext,
  input: Pick<Result, "raceId" | "top5">,
): Promise<Result> {
  const data = await loadData(context);
  const existing = data.results.find((r) => r.raceId === input.raceId);
  if (existing) {
    existing.top5 = input.top5;
    existing.updatedAt = nowIso();
    await saveData(context, data);
    return existing;
  }

  const result: Result = {
    id: makeId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  };
  data.results.push(result);
  await saveData(context, data);
  return result;
}

export async function deleteResult(context: vscode.ExtensionContext, id: Id): Promise<void> {
  const data = await loadData(context);
  data.results = data.results.filter((r) => r.id !== id);
  await saveData(context, data);
}

