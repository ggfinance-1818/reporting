// netlify/functions/sheet.js
// Runs on Netlify's server — no CORS issues calling Google from here

const WEBHOOK = "https://script.google.com/macros/s/AKfycbyFK14Y-64KdSd910G_pV1iGZLivvDHf-Dduwerq6aKJZf65o98brvlMD8z5-W4hMghmw/exec";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: HEADERS });
  }

  try {
    const payload = await req.json();
    const { action } = payload;

    if (action === "fetch") {
      // GET to Apps Script so we can read the response
      const url = `${WEBHOOK}?action=fetch&date=${encodeURIComponent(payload.date)}`;
      const gas = await fetch(url, { redirect: "follow" });
      const text = await gas.text();

      // Strip any GAS security wrapper like /*O_o*/
      const clean = text
        .replace(/^\/\*O_o\*\/\s*/, "")
        .replace(/^\/\*-secure-[\s\S]*?\*\/\s*/, "")
        .trim();

      const json = JSON.parse(clean);
      return new Response(JSON.stringify(json), { status: 200, headers: HEADERS });

    } else {
      // append or update — POST to Apps Script
      const body = new URLSearchParams();
      body.append("payload", JSON.stringify(payload));

      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "follow",
      });

      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: HEADERS });
    }

  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
};

export const config = { path: "/api/sheet" };
