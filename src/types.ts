export type Gender = "Mens 223322" | "Women";

export type Id = string;

export type Race = {
  id: Id;
  name: string;
  gender: Gender;
  dateISO: string; // YYYY-MM-DD
  createdAt: string; // ISO datetime
};

export type Player = {
  id: Id;
  name: string;
  createdAt: string; // ISO datetime
};

export type Tip = {
  id: Id;
  raceId: Id;
  playerId: Id;
  picks: string[]; // rank 1..5, length 5
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

export type Result = {
  id: Id;
  raceId: Id;
  top5: string[]; // rank 1..5, length 5
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

export type AppDataV1 = {
  version: 1;
  races: Race[];
  players: Player[];
  tips: Tip[];
  results: Result[];
};

export const emptyDataV1 = (): AppDataV1 => ({
  version: 1,
  races: [],
  players: [],
  tips: [],
  results: [],
});

