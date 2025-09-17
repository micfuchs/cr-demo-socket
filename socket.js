import pkg from "@slack/bolt";
const { App } = pkg;
import fetch from "node-fetch";

// Hardcode your channel
const CHANNEL = "C09EV91L5L7";

// User tokens (post as real users)
const TOKEN_LINDA = process.env.SLACK_TOKEN_LINDA;
const TOKEN_GINA  = process.env.SLACK_TOKEN_GINA;
const TOKEN_BOB   = process.env.SLACK_TOKEN_BOB;

// Bolt Socket Mode app
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN, // xapp-...
  token: process.env.SLACK_BOT_TOKEN,    // xoxb-...
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
  if (!data.ok) console.error("Slack error:", data);
  return data;
}

let lastTriggerTs = null;

app.event("message", async ({ event }) => {
  try {
    console.log("DEBUG event:", {
      channel: event.channel,
      text: event.text,
      subtype: event.subtype,
      user: event.user,
      ts: event.ts
    });

    if (event.channel !== CHANNEL) return;
    const text = (event.text || "").toLowerCase();
    if (!text.includes("coordinate")) return;

    if (lastTriggerTs === event.ts) return;
    lastTriggerTs = event.ts;

    // Scripted sequence (top-level posts)
    await sleep(10000); // wait before Linda starts
    await postAs(TOKEN_LINDA, "No problem.  Let’s roll back the change I just made, and we can lower Mateo’s hours on the Agentforce project for that week from 30 down to 20.");
    await sleep(10000);
    await postAs(TOKEN_BOB, "Thank you Linda, I appreciate it!");
    await sleep(10000);
    await postAs(TOKEN_GINA, "Thank you both. <@U09EXF70ZGC> please proceed with the above update for Mateo.");
  } catch (e) {
    console.error("Handler error:", e);
  }
});

(async () => {
  await app.start();
  console.log("✅ Socket mode listener running. Waiting for 'coordinate' in channel:", CHANNEL);
})();


// --- tiny HTTP health server so Render can wake this service ---
import express from "express";
const health = express();
health.get("/", (_req, res) => res.status(200).send("ok"));
const PORT = process.env.PORT || 3000;
health.listen(PORT, () => console.log("Health server listening on", PORT));
