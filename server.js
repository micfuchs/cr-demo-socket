import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Channel ID where the messages should go
const CHANNEL      = "C09EV91L5L7";               // your Slack channel ID

// Tokens for each demo user (provided via environment variables when you run node)
const TOKEN_LINDA  = process.env.SLACK_TOKEN_LINDA;
const TOKEN_GINA   = process.env.SLACK_TOKEN_GINA;
const TOKEN_BOB    = process.env.SLACK_TOKEN_BOB;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function postAs(token, text) {
  const r = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: CHANNEL, text })
  });
  const data = await r.json();
  if (!data.ok) console.error("Slack error:", data);
}

app.post("/cue", async (req, res) => {
  res.status(200).send("Demo started");

  try {
    // Linda replies first
    await postAs(TOKEN_LINDA, "I can lower Mateo's hours from that week from 20 to 10 on the Agentforce project.");
    await sleep(2500);

    // Bob replies second
    await postAs(TOKEN_BOB, "Thank you Linda, I appreciate it!");
    await sleep(2500);

    // Gina closes out
    await postAs(TOKEN_GINA, "Thank you both. Our Conflict Resolution Agent will proceed with these updates.");
  } catch (e) {
    console.error("Posting failed:", e);
  }
});

app.listen(3000, () => console.log("Demo webhook listening on :3000"));
