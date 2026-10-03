import { Bot, Context, InlineKeyboard } from "grammy";
import { randomUUID } from "node:crypto";
import { store } from "./store";
import { getVerse } from "./verse";

export const bot = new Bot(process.env.BOT_TOKEN!);

interface Draft {
  chatId: number;
  chatTitle: string;
  days: Set<number>;
  hour?: number;
  minute?: number;
  tz: string;
}
const drafts = new Map<number, Draft>(); // userId -> setup in progress

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TIMEZONES: [string, string][] = [
  ["🇪🇹 Ethiopia (EAT)", "Africa/Addis_Ababa"],
  ["🇰🇪 Kenya", "Africa/Nairobi"],
  ["🇳🇬 Nigeria", "Africa/Lagos"],
  ["🇿🇦 South Africa", "Africa/Johannesburg"],
  ["🇬🇧 London", "Europe/London"],
  ["🇦🇪 Dubai", "Asia/Dubai"],
  ["🇮🇳 India", "Asia/Kolkata"],
  ["🇺🇸 New York", "America/New_York"],
  ["🇺🇸 Los Angeles", "America/Los_Angeles"],
];

const fmtTime = (h: number, m: number) =>
  `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
const hhmm = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const daysLabel = (days: number[]) =>
  days.length === 7
    ? "Every day"
    : DAY_ORDER.filter((d) => days.includes(d)).map((d) => DAY_NAMES[d]).join(", ");

// ---------- Keyboards ----------
function daysKb(d: Draft) {
  const kb = new InlineKeyboard();
  DAY_ORDER.forEach((day, i) => {
    kb.text(`${d.days.has(day) ? "✅ " : ""}${DAY_NAMES[day]}`, `day:${day}`);
    if ((i + 1) % 4 === 0) kb.row();
  });
  kb.row().text("Every day", "days:all").text("Weekdays", "days:wk").row();
  kb.text("Next ➡️", "days:next");
  return kb;
}
function hoursKb() {
  const kb = new InlineKeyboard();
  for (let h = 0; h < 24; h++) {
    kb.text(`${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`, `hour:${h}`);
    if ((h + 1) % 4 === 0) kb.row();
  }
  return kb;
}
const minutesKb = () => {
  const kb = new InlineKeyboard();
  [0, 15, 30, 45].forEach((m) => kb.text(`:${String(m).padStart(2, "0")}`, `min:${m}`));
  return kb;
};
const tzKb = () => {
  const kb = new InlineKeyboard();
  TIMEZONES.forEach(([label, tz], i) => {
    kb.text(label, `tz:${tz}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
};
const summary = (d: Draft) =>
  `📍 <b>${d.chatTitle}</b>\n📅 ${daysLabel([...d.days])}\n⏰ ${fmtTime(d.hour!, d.minute!)}\n🌍 ${d.tz}`;

const DAYS_PROMPT = "<b>Step 1/4:</b> Which days should I post?";

// ---------- Connect a channel/group ----------
async function connect(ctx: Context, ref: number | string) {
  const userId = ctx.from!.id;
  try {
    const chat = await ctx.api.getChat(ref);

    const user = await ctx.api.getChatMember(chat.id, userId);
    if (user.status !== "creator" && user.status !== "administrator") {
      return ctx.reply("❌ You must be an admin of that chat to set this up.");
    }

    const bm = await ctx.api.getChatMember(chat.id, ctx.me.id);
    const canPost =
      chat.type === "channel"
        ? bm.status === "administrator" && bm.can_post_messages === true
        : bm.status === "administrator" || bm.status === "member";
    if (!canPost) {
      return ctx.reply(
        "❌ I can't post there yet. Add me as an <b>admin</b> with the <b>Post messages</b> permission, then try again.",
        { parse_mode: "HTML" }
      );
    }

    const title = "title" in chat && chat.title ? chat.title : String(chat.id);
    const draft: Draft = {
      chatId: chat.id,
      chatTitle: title,
      days: new Set(),
      tz: "Africa/Addis_Ababa",
    };
    drafts.set(userId, draft);

    await ctx.reply(`✅ Connected to <b>${title}</b>\n\n${DAYS_PROMPT}`, {
      parse_mode: "HTML",
      reply_markup: daysKb(draft),
    });
  } catch {
    await ctx.reply(
      "❌ I couldn't access that chat. Make sure I'm added as an admin, then forward a message from it again."
    );
  }
}

// ---------- Commands ----------
const HELP =
  "👋 <b>Daily Verse Poster</b>\n\n" +
  "I post a Bible verse to your channel or group on the days and time you choose.\n\n" +
  "<b>Setup:</b>\n" +
  "1️⃣ Add me as an <b>admin</b> of your channel (with <i>Post messages</i> permission)\n" +
  "2️⃣ <b>Forward any message</b> from the channel here, or send its @username\n" +
  "3️⃣ Pick days, time and timezone\n\n" +
  "<b>For groups:</b> add me to the group and send /connect there.\n\n" +
  "/schedules – view or delete schedules";

bot.command("start", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const payload = ctx.match;
  if (payload.startsWith("g_")) return connect(ctx, Number(payload.slice(2)));
  await ctx.reply(HELP, { parse_mode: "HTML" });
});

bot.command("help", (ctx) => ctx.reply(HELP, { parse_mode: "HTML" }));

bot.command("connect", async (ctx) => {
  if (ctx.chat.type === "private" || ctx.chat.type === "channel") {
    return ctx.reply("Send /connect inside the group you want to connect.");
  }
  const kb = new InlineKeyboard().url(
    "⚙️ Set up daily verse",
    `https://t.me/${ctx.me.username}?start=g_${ctx.chat.id}`
  );
  await ctx.reply("Tap the button below to choose days and time (group admins only).", {
    reply_markup: kb,
  });
});

bot.command("cancel", (ctx) => {
  drafts.delete(ctx.from!.id);
  return ctx.reply("Cancelled. Send /start to begin again.");
});

bot.command("schedules", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const list = store.byOwner(ctx.from!.id);
  if (!list.length) return ctx.reply("You have no schedules yet. Send /start to create one.");
  for (const s of list) {
    const [h, m] = s.time.split(":").map(Number);
    await ctx.reply(
      `📍 <b>${s.chatTitle}</b>\n📅 ${daysLabel(s.days)}\n⏰ ${fmtTime(h, m)} (${s.tz})`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text("🧪 Send test now", `test:${s.id}`)
          .text("🗑 Delete", `del:${s.id}`),
      }
    );
  }
});

// ---------- Private-chat messages: forwarded post or @username ----------
const pm = bot.chatType("private");

pm.on("message", async (ctx, next) => {
  const origin = ctx.msg.forward_origin;
  if (origin?.type === "channel") return connect(ctx, origin.chat.id);
  return next();
});

pm.on("message:text", async (ctx) => {
  const t = ctx.msg.text.trim();
  if (t.startsWith("@")) return connect(ctx, t);
  await ctx.reply(
    "Forward a message from your channel, or send its @username. Send /help for instructions."
  );
});

// ---------- Button presses ----------
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  // Edit the message, ignoring Telegram's "message is not modified" error
  const edit = async (text: string, kb?: InlineKeyboard) => {
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
    } catch (e: any) {
      if (!String(e?.description ?? e).includes("not modified")) throw e;
    }
  };

  // Actions on saved schedules
  if (data.startsWith("del:") || data.startsWith("test:")) {
    await ctx.answerCallbackQuery();
    const [action, id] = data.split(":");
    const s = store.get(id);
    if (!s || s.ownerId !== userId) return edit("That schedule no longer exists.");
    if (action === "del") {
      store.remove(id);
      return edit("🗑 Schedule deleted.");
    }
    try {
      await ctx.api.sendMessage(s.chatId, await getVerse(), { parse_mode: "HTML" });
      return ctx.reply("✅ Test verse sent!");
    } catch (e) {
      console.error(e);
      return ctx.reply("❌ Couldn't send the test verse. Check my admin permissions.");
    }
  }

  // Setup wizard
  const d = drafts.get(userId);
  if (!d) {
    await ctx.answerCallbackQuery();
    return edit("This setup expired. Send /start to begin again.");
  }

  if (data === "days:next" && d.days.size === 0) {
    return ctx.answerCallbackQuery({ text: "Pick at least one day", show_alert: true });
  }
  await ctx.answerCallbackQuery();

  if (data.startsWith("day:")) {
    const day = Number(data.slice(4));
    d.days.has(day) ? d.days.delete(day) : d.days.add(day);
    return edit(DAYS_PROMPT, daysKb(d));
  }
  if (data === "days:all") {
    d.days = new Set([0, 1, 2, 3, 4, 5, 6]);
    return edit(DAYS_PROMPT, daysKb(d));
  }
  if (data === "days:wk") {
    d.days = new Set([1, 2, 3, 4, 5]);
    return edit(DAYS_PROMPT, daysKb(d));
  }
  if (data === "days:next") {
    return edit("<b>Step 2/4:</b> At what hour?", hoursKb());
  }
  if (data.startsWith("hour:")) {
    d.hour = Number(data.slice(5));
    return edit("<b>Step 3/4:</b> And the minutes?", minutesKb());
  }
  if (data.startsWith("min:")) {
    d.minute = Number(data.slice(4));
    return edit("<b>Step 4/4:</b> Choose your timezone", tzKb());
  }
  if (data.startsWith("tz:")) {
    d.tz = data.slice(3);
    return edit(
      `Please confirm:\n\n${summary(d)}`,
      new InlineKeyboard().text("✅ Save", "save").text("❌ Cancel", "cancel")
    );
  }
  if (data === "cancel") {
    drafts.delete(userId);
    return edit("Cancelled. Send /start to begin again.");
  }
  if (data === "save") {
    store.add({
      id: randomUUID(),
      ownerId: userId,
      chatId: d.chatId,
      chatTitle: d.chatTitle,
      days: [...d.days],
      time: hhmm(d.hour!, d.minute!),
      tz: d.tz,
    });
    const text = `🎉 <b>Saved!</b>\n\n${summary(d)}\n\nWant another time (e.g. evening)? Just forward a message again.\nManage schedules with /schedules.`;
    drafts.delete(userId);
    return edit(text);
  }
});
