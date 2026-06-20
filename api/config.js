// Vercel Serverless Function — Config API
// Token lưu an toàn trong Environment Variables, không bao giờ lộ ra browser

const GITHUB_REPO = "hadfreelancer-ctrl/shb-dashboard";
const CONFIG_FILE = "config.json";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: "GITHUB_TOKEN not configured in Environment Variables" });
  }

  const ghHeaders = {
    "Authorization": `token ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // GET — Load config
  if (req.method === "GET") {
    try {
      const r = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_FILE}`,
        { headers: ghHeaders }
      );
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");

      if (r.status === 404) return res.json({ ok: true, config: {} });

      const data = await r.json();
      const content = Buffer.from(data.content, "base64").toString("utf8");
      return res.json({ ok: true, config: JSON.parse(content) });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // POST — Save config
  if (req.method === "POST") {
    try {
      const config = req.body;
      if (!config) return res.status(400).json({ ok: false, error: "Missing config" });

      const existing = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_FILE}`,
        { headers: ghHeaders }
      );
      let sha;
      if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
      }

      const content = Buffer.from(JSON.stringify(config, null, 2)).toString("base64");
      const body = {
        message: `Update dashboard config - ${new Date().toLocaleString("vi-VN")}`,
        content,
        ...(sha ? { sha } : {}),
      };

      const result = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${CONFIG_FILE}`,
        { method: "PUT", headers: ghHeaders, body: JSON.stringify(body) }
      );

      if (result.ok) {
        return res.json({ ok: true, savedAt: new Date().toISOString() });
      } else {
        const err = await result.json();
        return res.status(500).json({ ok: false, error: err.message });
      }
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
