/**
 * WhatsApp "Hello" Auto-Reply Bot
 * - QR in terminal
 * - Session saved locally (no re-scan)
 * - Replies to any message containing "hello"
 * - Saves sender number + message to a txt log
 */

const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

// Where we store logs
const LOG_FILE = path.join(__dirname, "messages.txt");

// Small helper: append log lines safely
function appendLog(line) {
  fs.appendFile(LOG_FILE, line + "\n", (err) => {
    if (err) console.error("Failed to write log:", err);
  });
}

// Make it a little “creative”: emoji + vibe + simple anti-spam cooldown per user
const COOLDOWN_MS = 30 * 1000; // 30 seconds
const lastReplyAt = new Map(); // number -> timestamp

function shouldReply(number) {
  const now = Date.now();
  const last = lastReplyAt.get(number) || 0;
  if (now - last < COOLDOWN_MS) return false;
  lastReplyAt.set(number, now);
  return true;
}

const client = new Client({
  authStrategy: new LocalAuth({
    // This creates a folder ".wwebjs_auth" storing your session locally
    clientId: "hello-bot",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("\nScan this QR code with WhatsApp (Linked Devices) 👇\n");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("✅ Authenticated! Session saved. Next run should auto-login.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Auth failure:", msg);
  console.error("Tip: delete the .wwebjs_auth folder and re-scan.");
});

client.on("ready", () => {
  console.log("🤖 Bot is ready and listening for messages...");
  console.log(`📝 Logging messages to: ${LOG_FILE}`);
});

// Main message handler
client.on("message", async (message) => {
  try {
    // message.from looks like: "2126xxxxxxx@c.us"
    // For groups, it can be "...@g.us"
    const isGroup = message.from.endsWith("@g.us");

    // Get a cleaner number/id
    const senderId = message.from; // chat id (group or person)
    const senderNumber = senderId.replace(/@c\.us|@g\.us/g, "");

    const text = (message.body || "").trim();
    if (!text) return;

    // Log EVERYTHING (number/chat + message + timestamp)
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] FROM:${senderId} NUMBER:${senderNumber} MSG:${text}`;
    appendLog(logLine);

    // Only auto-reply to direct chats (optional)
    // If you want it to reply in groups too, remove this check.
    if (isGroup) return;

    // Match “hello” in a forgiving way (case-insensitive, anywhere in text)
    const containsHello = /hello/i.test(text);

    if (containsHello) {
      // Basic cooldown so we don't reply 50 times to spam
      if (!shouldReply(senderNumber)) return;

      // “Creative” touch: friendly tone + tiny variation
      const replies = [
        "hello how are you doing ? 🙂",
        "hello how are you doing ? 👋🙂",
        "hello how are you doing ? hope you’re good ✨",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];

      await message.reply(reply);

      // Also log that we replied
      appendLog(`[${timestamp}] REPLIED_TO:${senderId} WITH:${reply}`);
    }
  } catch (err) {
    console.error("Handler error:", err);
  }
});

client.initialize();
