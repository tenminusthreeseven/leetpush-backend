import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/push", async (req, res) => {
  const {
    title = "leetcode",
    code,
    language = "codes",
    token,
    repo,
  } = req.body;

  // 🔐 Validation
  if (!code) {
    return res.status(400).send("No code provided");
  }

  if (!token || !repo) {
    return res.status(400).send("Missing GitHub token or repo");
  }

  // 📁 Create folder from LeetCode problem name
  const problemFolder = title
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  // 🧠 Detect file extension only
  const safeLang = language.toLowerCase();
  let fileExt = "txt";

  if (safeLang.includes("cpp") || safeLang.includes("c++")) fileExt = "cpp";
  else if (safeLang === "c") fileExt = "c";
  else if (safeLang.includes("python")) fileExt = "py";
  else if (safeLang.includes("java") && !safeLang.includes("javascript")) fileExt = "java";
  else if (safeLang.includes("javascript")) fileExt = "js";
  else if (safeLang.includes("kotlin")) fileExt = "kt";
  else if (safeLang.includes("swift")) fileExt = "swift";

  // 📄 Final GitHub path
  const path = `${problemFolder}/solution.${fileExt}`;
  const content = Buffer.from(code).toString("base64");

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  try {
    let sha = null;

    // 🔁 Check if file exists
    try {
      const existing = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "LeetPush",
        },
      });
      sha = existing.data.sha;
    } catch {
      // File does not exist — OK
    }

    // 🚀 Push to GitHub
    const response = await axios.put(
      url,
      {
        message: `Add solution for ${title}`,
        content,
        sha,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "LeetPush",
        },
      }
    );

    console.log("✅ GitHub push success:", response.status);
    res.send("Pushed successfully");
  } catch (err) {
    console.error("❌ GitHub API ERROR");
    console.error("STATUS:", err.response?.status);
    console.error("DATA:", err.response?.data || err.message);

    res.status(500).send("GitHub push failed");
  }
});

/* ✅ IMPORTANT: Cloud-compatible port handling */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 LeetPush backend running on port ${PORT}`);
});
