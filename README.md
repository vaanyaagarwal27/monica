# Monica

Monica is an agentic newsletter digest that runs every night, reads your AI newsletters from Gmail, and sends you a clean HTML email with plain-English summaries — no manual input required.

## What she does

1. Hits Gmail at 11 PM via cron and searches for emails from the last 24 hours
2. If nothing arrived, stops — no email sent
3. If newsletters are there, feeds the raw content to Gemini 2.5 Flash
4. Gets back up to 4 structured summaries (headline + explanation + why it matters)
5. Wraps them in a designed HTML email and sends it via Gmail SMTP

## Newsletters she reads

- **Unwind AI** — theunwindai.com
- **The Rundown** — therundown.ai
- **Ben's Bites** — bensbites.com
- **smol.ai** — news.smol.ai

She looks for emails from any of these senders in the past day using Gmail search.

## Why it's agentic

Monica runs on a cron schedule with no human in the loop. She decides whether to send based on what actually arrived in Gmail — if none of the newsletters landed that day, she exits cleanly. The only thing you do is set it up once.

## Setup

### 1. Google Cloud credentials

- Go to [Google Cloud Console](https://console.cloud.google.com), create a project
- Enable the **Gmail API**
- Create an **OAuth 2.0 Client ID** (Desktop app)
- Download the JSON and save it as `credentials.json` in the project root

### 2. Gmail App Password

You need an App Password (not your regular Gmail password) to send email via SMTP:

- Go to your Google Account → Security → 2-Step Verification → App passwords
- Generate one for "Mail" and copy the 16-character code

### 3. .env file

```
GEMINI_API_KEY=your_gemini_api_key_here
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password_here
```

Get a Gemini API key from [Google AI Studio](https://aistudio.google.com).

### 4. Install and authenticate

```bash
npm install
node auth.js
```

`auth.js` opens a Google OAuth URL, asks you to paste the authorization code, and saves `token.json`. This is a one-time step.

### 5. Run

```bash
npm start
```

### 6. Schedule it (cron)

To run Monica automatically every night at 11 PM:

```bash
crontab -e
```

Add:

```
0 23 * * * cd /path/to/monica && node monica.js >> monica.log 2>&1
```

## Files

| File | Purpose |
|---|---|
| `monica.js` | Main script — fetches, summarises, sends |
| `fetchEmails.js` | Gmail API query and body extraction |
| `auth.js` | OAuth flow, saves token.json |
| `credentials.json` | Google Cloud OAuth credentials (not committed) |
| `token.json` | Generated after first auth (not committed) |
