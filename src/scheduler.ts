import { bot } from "./bot";
import { store } from "./store";
import { getVerse } from "./verse";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nowIn(tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    day: WEEKDAYS.indexOf(get("weekday")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

let running = false;

async function tick() {
  if (running) return; // don't overlap with a slow previous tick
  running = true;
  try {
    let verse: string | null = null;

    for (const s of store.all()) {
      const now = nowIn(s.tz);
      const stamp = `${now.date} ${now.time}`;
      if (!s.days.includes(now.day) || s.time !== now.time || s.lastSent === stamp) continue;

      // Mark first so a slow/failed send can't trigger repeats within the same minute
      store.markSent(s.id, stamp);

      try {
        verse ??= await getVerse(); // fetch once per tick
        await bot.api.sendMessage(s.chatId, verse, { parse_mode: "HTML" });
      } catch (e) {
        console.error(`Failed to post to ${s.chatTitle}:`, e);
        bot.api
          .sendMessage(
            s.ownerId,
            `⚠️ I couldn't post to <b>${s.chatTitle}</b>. Please check that I'm still an admin with permission to post.`,
            { parse_mode: "HTML" }
          )
          .catch(() => {});
      }
    }
  } finally {
    running = false;
  }
}

export function startScheduler() {
  setInterval(() => tick().catch(console.error), 30_000);
  console.log("⏰ Scheduler started");
}
