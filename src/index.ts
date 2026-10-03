import "dotenv/config"; // must stay the first import
import { bot } from "./bot";
import { startScheduler } from "./scheduler";

bot.catch((err) => console.error("Bot error:", err.error));

startScheduler();
bot.start({ onStart: (me) => console.log(`🤖 @${me.username} is running`) });
