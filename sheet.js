// netlify/functions/sheet.js
// This runs on Netlify's server - no CORS issues!

const WEBHOOK = "https://script.google.com/macros/s/AKfycbyFK14Y-64KdSd910G_pV1iGZLivvDHf-Dduwerq6aKJZf65o98brvlMD8z5-W4hMghmw/exec";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { action } = payload;

    if (action === "fetch") {
      // GET request to Apps Script
      const url = `${WEBHOOK}?action=fetch&date=${encodeURIComponent(payload.date)}`;
      const res = await fetch(url);
      const text = await res.text();

      // Apps Script sometimes wraps in /*O_o*/ - strip it
      const clean = text.replace(/^\/\*-secure-\s*([\s\S]*)\*\/\s*$/, "$1")
                        .replace(/^\/\*O_o\*\/\s*/, "")
                        .trim();
      const json = JSON.parse(clean);
      return { statusCode: 200, headers, body: JSON.stringify(json) };

    } else {
      // POST to Apps Script (append / update)
      const body = new URLSearchParams();
      body.append("payload", JSON.stringify(payload));

      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "follow",
      });

      const text = await res.text();
      return { statusCode: 200, headers, body: JSON.stringify({ status: "ok", raw: text }) };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: "error", message: err.message }),
    };
  }
};
