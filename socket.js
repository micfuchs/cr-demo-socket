import pkg from "@slack/bolt";
const { App } = pkg;
import fetch from "node-fetch";
import express from "express";

// ====== CONFIG ======
const CHANNEL = "C09EV91L5L7"; // target channel ID

// Real-user tokens (post as real humans)
const TOKEN_LINDA = process.env.SLACK_TOKEN_LINDA;
const TOKEN_GINA  = process.env.SLACK_TOKEN_GINA;
const TOKEN_BOB   = process.env.SLACK_TOKEN_BOB;

// Bolt app in Socket Mode (bot token + app-level token)
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN, // xapp-***
  token: process.env.SLACK_BOT_TOKEN,    // xoxb-*** (bot token)
  socketMode: true
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postAs(token, text) {
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ channel: CHANNEL, text })
  });
  const data = await res.json();
  if (!data.ok) console.error("❌ chat.postMessage error (user token):", data);
  return data;
}

let lastTriggerTs = null;

// ====== EVENT HANDLER ======
app.event("message", async ({ event, client, logger }) => {
  try {
    logger.info({
      tag: "incoming_event",
      channel: event.channel,
      text: event.text,
      subtype: event.subtype,
      user: event.user,
      ts: event.ts
    });

    // Only react in our channel and when the message includes 'coordinate'
    if (event.channel !== CHANNEL) return;
    const text = (event.text || "").toLowerCase();
    if (!text.includes("coordinate")) return;

    // simple de-dupe guard
    if (lastTriggerTs === event.ts) return;
    lastTriggerTs = event.ts;

    logger.info({ tag: "script_start" });

    // 1) Linda
    await sleep(8000);
    logger.info({ tag: "post_linda" });
    await postAs(
      TOKEN_LINDA,
      "No problem.  Let’s roll back the change I just made, and we can lower Mateo’s hours on the Agentforce project for that week from 30 down to 20."
    );

    // 2) Bob
    await sleep(5000);
    logger.info({ tag: "post_bob" });
    await postAs(TOKEN_BOB, "Thank you Linda, I appreciate it!");

    // 3) Gina (mentioning your bot ID is fine, but it does not make it post)
    await sleep(5000);
    logger.info({ tag: "post_gina" });
    await postAs(
      TOKEN_GINA,
      "Thank you both. <@U09EXF70ZGC> please proceed with the above update for Mateo."
    );

    // 4) Bot (the app) posts final confirmation using Slack SDK
    await sleep(3000);
    logger.info({ tag: "post_bot_start" });

    const botRes = await client.chat.postMessage({
      channel: CHANNEL,
      text: "✅ Got it — I’ll reallocate the work and notify Mateo so he’s aware of the change."
      // Optional branding:
      // username: "Certinia Staffing Agent",
      // icon_emoji: ":white_check_mark:"
    });

    if (!botRes.ok) {
      logger.error({ tag: "post_bot_error", botRes });
    } else {
      logger.info({ tag: "post_bot_ok", ts: botRes.ts });
    }

  } catch (e) {
    console.error("Handler error:", e);
  }
});

// ====== STARTUP: verify bot identity + join channel ======
(async () => {
  await app.start();
  console.log("✅ Socket mode listener running. Waiting for 'coordinate' in channel:", CHANNEL);

  try {
    // Verify which user the bot token belongs to
    const auth = await app.client.auth.test({ token: process.env.SLACK_BOT_TOKEN });
    console.log("ℹ️ auth.test:", auth); // expect user_id like U09EXF70ZGC for your bot
  } catch (e) {
    console.error("auth.test failed:", e);
  }

  // Ensure bot is in the channel (public channels only; will fail gracefully if already joined)
  try {
    const joinRes = await app.client.conversations.join({
      token: process.env.SLACK_BOT_TOKEN,
      channel: CHANNEL
    });
    console.log("ℹ️ conversations.join:", joinRes.ok ? "joined or already in" : joinRes.error);
  } catch (e) {
    console.log("ℹ️ conversations.join (likely already in or private):", e.data?.error || e.message);
  }
})();

// --- tiny HTTP health server so Render can wake this service ---
const health = express();
health.get("/", (_req, res) => res.status(200).send("ok"));
const PORT = process.env.PORT || 3000;
health.listen(PORT, () => console.log("Health server listening on", PORT));
