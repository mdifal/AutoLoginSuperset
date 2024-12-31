// File: server.js (Backend API)

const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const users = [
  { username: "mdifa", password: "mdifa" },
];

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid username or password" });
  }
});

app.post("/start-login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });

    const page = await browser.newPage();

    await page.goto("http://127.0.0.1:8088/superset/welcome/", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']", username);
    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", password);

    await page.waitForSelector("input[type='submit']");
    await Promise.all([
      page.waitForNavigation({ timeout: 60000 }),
      page.click("input[type='submit']"),
    ]);

    const cookies = await page.cookies();

    const sessionCookie = cookies.find((cookie) => cookie.name === "session");

    await browser.close();

    if (sessionCookie) {
      res.cookie("session", sessionCookie.value, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        path: "/",
      });

      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Login failed." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});