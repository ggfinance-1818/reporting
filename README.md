# Valyana Waters — Daily Reporting Form

Internal daily reporting tool that submits directly to Google Sheets.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to netlify.com → Add new site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click Deploy

Your live URL will be something like `https://valyana-report.netlify.app`

## Google Sheet connection

The webhook URL is already baked into `src/App.jsx`. Make sure your
Apps Script is deployed with **Execute as: Me** and **Who has access: Anyone**.
