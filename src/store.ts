import fs from "node:fs";

export interface Schedule {
  id: string;
  ownerId: number;
  chatId: number;
  chatTitle: string;
  days: number[]; // 0 = Sunday ... 6 = Saturday
  time: string;   // "HH:mm" (24h) in the schedule's timezone
  tz: string;     // IANA timezone, e.g. "Africa/Addis_Ababa"
  lastSent?: string; // "YYYY-MM-DD HH:mm", prevents double posting
}

const FILE = "data.json";
let schedules: Schedule[] = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE, "utf8"))
  : [];

const save = () => fs.writeFileSync(FILE, JSON.stringify(schedules, null, 2));

export const store = {
  all: () => schedules,
  byOwner: (ownerId: number) => schedules.filter((s) => s.ownerId === ownerId),
  get: (id: string) => schedules.find((s) => s.id === id),
  add(s: Schedule) {
    schedules.push(s);
    save();
  },
  remove(id: string) {
    schedules = schedules.filter((s) => s.id !== id);
    save();
  },
  markSent(id: string, stamp: string) {
    const s = schedules.find((x) => x.id === id);
    if (s) {
      s.lastSent = stamp;
      save();
    }
  },
};
