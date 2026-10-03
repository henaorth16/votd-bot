# 📖 Daily Verse Poster Telegram Bot (`votd-bot`)

A scheduled Telegram bot built with [TypeScript](https://www.typescriptlang.org/) and [grammY](https://grammy.dev/) that automatically posts the Daily Bible Verse (የዕለቱ የመጽሐፍ ቅዱስ ቃል) to Telegram channels and groups according to customized schedules and timezones.

---

## ✨ Features

- **Automated Verse Delivery**: Periodically posts daily scriptures, including Ethiopian calendar dates, liturgical occasions, scripture text, references, and full chapter links.
- **Multi-Chat Scheduling**: Schedule verse deliveries across multiple channels and groups independently.
- **Interactive Setup Wizard**: Guided 4-step setup right inside Telegram using inline keyboard buttons:
  1. Days of the week (custom selection, weekdays, or every day)
  2. Hour (24-hour format)
  3. Minutes (`:00`, `:15`, `:30`, `:45`)
  4. Timezone selection (Ethiopia, Kenya, South Africa, London, New York, etc.)
- **Channel & Group Support**:
  - **Channels**: Forward any post from your channel or send its `@username` to connect.
  - **Groups**: Add the bot to your group and type `/connect`.
  - **Admin Security**: Verifies user admin rights before allowing schedule setup.
- **Management & Instant Testing**:
  - `/schedules` command to list all active schedules.
  - **🧪 Send test now** button to test verse delivery immediately.
  - **🗑 Delete** button to remove a schedule instantly.
- **Duplicate Prevention**: Tracks `lastSent` timestamps to ensure verses are never posted twice in the same minute window.
- **Lightweight Storage**: Zero-dependency JSON storage (`data.json`).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Telegram Bot Framework**: [grammY](https://grammy.dev/)
- **Environment Management**: `dotenv`
- **Execution & Development**: `tsx`

---

## 📋 Prerequisites

1. **Node.js** (v20 or higher recommended) & `npm`
2. **Telegram Bot Token**: Created via [@BotFather](https://t.me/BotFather) on Telegram.
3. **Verse API (VOTD_URL)**: An API endpoint that returns daily verse data in JSON format.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/henaorth16/votd-bot.git
cd votd-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Telegram Bot token obtained from @BotFather
BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# Verse of the Day API endpoint
VOTD_URL=https://your-api.com/api/votd
```

#### Expected `VOTD_URL` Response Format

The bot expects the `VOTD_URL` endpoint to return a JSON response matching this structure:

```json
{
  "status": "success",
  "data": {
    "date": {
      "gregorian": "2026-10-03",
      "ethiopian": {
        "formattedAm": "መስከረም 23 2019"
      }
    },
    "liturgical": {
      "occasion": "Sunday",
      "occasionAm": "እሑድ"
    },
    "verse": {
      "book": "ዮሐንስ",
      "reference": "ዮሐንስ 3:16",
      "text": "እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና..."
    },
    "url": "https://example.com/verse"
  }
}
```

---

## 💻 Running the Bot

### Development Mode (with hot-reload)

```bash
npm run dev
```

### Production Build & Run

```bash
# Compile TypeScript to JavaScript in dist/
npm run build

# Start the compiled bot
npm start
```

When started successfully, the console will show:
```text
⏰ Scheduler started
🤖 @YourBotUsername is running
```

---

## 🤖 Bot Commands & Usage

| Command | Description |
| :--- | :--- |
| `/start` | Starts the bot and displays instructions for connecting channels/groups. |
| `/help` | Displays help message and setup guide. |
| `/connect` | Used inside a group chat to link the group with the bot. |
| `/schedules` | Lists all your active schedules with **Send test now** and **Delete** options. |
| `/cancel` | Cancels any ongoing setup wizard. |

---

## 📲 How to Connect a Channel or Group

### Connecting a Channel
1. Add your bot as an **Administrator** in your channel with **"Post messages"** permission enabled.
2. In a private chat with the bot, either:
   - **Forward any message** from your channel to the bot, or
   - Send your channel's public handle (e.g. `@MyChannelName`).
3. Follow the 4-step inline wizard to choose posting days, time, and timezone.

### Connecting a Group
1. Add the bot to your Telegram group.
2. Send `/connect` inside the group chat.
3. Click the provided button **"⚙️ Set up daily verse"** to finish configuring the schedule in private chat.

---

## 📁 Project Structure

```text
├── src/
│   ├── index.ts        # Entry point: initializes bot & starts scheduler
│   ├── bot.ts          # Grammy bot instance, commands, and wizard handlers
│   ├── scheduler.ts    # Background cron loop checking scheduled posting times
│   ├── store.ts        # JSON persistence layer (data.json)
│   └── verse.ts        # Fetches and formats verses from VOTD API
├── .env.example        # Template for required environment variables
├── data.json           # Saved schedules (generated automatically, git-ignored)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript compiler settings
└── README.md           # Documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
