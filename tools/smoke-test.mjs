import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chromePath) {
  throw new Error("No local Chrome or Edge executable was found.");
}

const port = 9300 + Math.floor(Math.random() * 500);
const profileDir = path.join(tmpdir(), `grey-coin-chrome-${Date.now()}`);
const screenshotsDir = path.join(root, "qa");
mkdirSync(screenshotsDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1440,1000",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} while fetching ${url}`);
  }
  return response.json();
}

async function waitForEndpoint() {
  const versionUrl = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await fetchJson(versionUrl);
      return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
      return;
    }

    if (message.method && listeners.has(message.method)) {
      for (const listener of listeners.get(message.method)) listener(message.params);
    }
  });

  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("WebSocket failed.")), { once: true });
  });

  function send(method, params = {}) {
    id += 1;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  }

  function waitForEvent(method, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const list = listeners.get(method) ?? new Set();
      const timer = setTimeout(() => {
        list.delete(listener);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const listener = (params) => {
        clearTimeout(timer);
        list.delete(listener);
        resolve(params);
      };
      list.add(listener);
      listeners.set(method, list);
    });
  }

  return { opened, send, waitForEvent, close: () => ws.close() };
}

async function main() {
  await waitForEndpoint();
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("No page target available.");

  const client = connect(page.webSocketDebuggerUrl);
  await client.opened;
  await client.send("Runtime.enable");
  await client.send("Page.enable");

  const fileUrl = pathToFileURL(path.join(root, "index.html")).href;
  await Promise.all([
    client.waitForEvent("Page.loadEventFired", 15000),
    client.send("Page.navigate", { url: fileUrl }),
  ]);
  await sleep(250);

  async function evaluate(expression) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed.");
    }
    return result.result.value;
  }

  async function screenshot(name) {
    const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    writeFileSync(path.join(screenshotsDir, name), Buffer.from(result.data, "base64"));
  }

  const boot = await evaluate(`({
    title: document.title,
    startVisible: !document.querySelector("#startScreen").hidden,
    hasStartButton: !!document.querySelector("#startButton")
  })`);
  if (!boot.startVisible || !boot.hasStartButton) {
    throw new Error(`Unexpected boot state: ${JSON.stringify(boot)}`);
  }
  await screenshot("01-start.png");

  await evaluate(`
    document.querySelector(".language-select").value = "en-US";
    document.querySelector(".language-select").dispatchEvent(new Event("change", { bubbles: true }));
    true
  `);
  await sleep(80);
  const englishBoot = await evaluate(`({
    title: document.title,
    startButton: document.querySelector("#startButton").textContent,
    startKicker: document.querySelector("#startScreen .kicker").textContent,
    htmlLang: document.documentElement.lang
  })`);
  if (
    englishBoot.title !== "Review Core: Grey Coin" ||
    englishBoot.startButton !== "Start shift" ||
    !englishBoot.startKicker.includes("Autonomous") ||
    englishBoot.htmlLang !== "en-US"
  ) {
    throw new Error(`English start localization failed: ${JSON.stringify(englishBoot)}`);
  }
  await screenshot("01b-start-en.png");
  await evaluate(`
    document.querySelector(".language-select").value = "es-ES";
    document.querySelector(".language-select").dispatchEvent(new Event("change", { bubbles: true }));
    true
  `);
  await sleep(80);

  await evaluate(`document.querySelector("#startButton").click(); true`);
  await sleep(120);
  const firstCase = await evaluate(`({
    gameVisible: !document.querySelector("#gameScreen").hidden,
    channel: document.querySelector("#channelName").textContent,
    queue: document.querySelector("#queuePill").textContent,
    owner: document.querySelector("#ownerName").textContent,
    debt: document.querySelector("#channelDebt").textContent,
    clock: document.querySelector("#clockPill").textContent,
    quota: document.querySelector("#opsQuota").textContent,
    privateNotes: document.querySelectorAll("#ownerPrivateList li").length,
    evidenceNotes: document.querySelectorAll("#evidenceList li").length,
    coverBg: getComputedStyle(document.querySelector("#caseCover")).backgroundImage,
    avatarBg: getComputedStyle(document.querySelector("#ownerAvatar")).backgroundImage
  })`);
  if (
    !firstCase.gameVisible ||
    firstCase.channel !== "Cocina a Medianoche" ||
    firstCase.owner !== "Ramon Vela" ||
    !firstCase.debt.includes("12.600") ||
    !firstCase.clock.includes("Turno") ||
    !firstCase.quota.includes("72.000") ||
    firstCase.privateNotes !== 3 ||
    firstCase.evidenceNotes !== 3 ||
    !firstCase.coverBg.includes("channel-covers-focused-gpt-image-2.png") ||
    !firstCase.avatarBg.includes("owner-avatars-focused-gpt-image-2.png")
  ) {
    throw new Error(`Unexpected first case: ${JSON.stringify(firstCase)}`);
  }
  await screenshot("02-first-case.png");

  await evaluate(`
    document.querySelector(".language-select").value = "en-US";
    document.querySelector(".language-select").dispatchEvent(new Event("change", { bubbles: true }));
    true
  `);
  await sleep(80);
  const englishCase = await evaluate(`({
    channel: document.querySelector("#channelName").textContent,
    queue: document.querySelector("#queuePill").textContent,
    clock: document.querySelector("#clockPill").textContent,
    quota: document.querySelector("#opsQuota").textContent,
    receipt: document.querySelector("#receiptText").textContent,
    risk: document.querySelector("#caseRisk").textContent
  })`);
  if (
    englishCase.channel !== "Midnight Kitchen" ||
    !englishCase.queue.includes("Queue") ||
    !englishCase.clock.includes("Shift") ||
    !englishCase.quota.includes("72,000") ||
    englishCase.receipt !== "Stamp pending." ||
    !englishCase.risk.includes("low")
  ) {
    throw new Error(`English case localization failed: ${JSON.stringify(englishCase)}`);
  }
  await screenshot("02c-first-case-en.png");
  await evaluate(`
    document.querySelector(".language-select").value = "es-ES";
    document.querySelector(".language-select").dispatchEvent(new Event("change", { bubbles: true }));
    true
  `);
  await sleep(80);

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await sleep(120);
  await screenshot("02b-mobile-first-case.png");
  await client.send("Emulation.clearDeviceMetricsOverride");
  await sleep(120);

  const plan = [
    ["monetize", "demonetize", "limited", "demonetize"],
    ["demonetize", "limited", "monetize", "escalate"],
    ["escalate", "limited", "demonetize", "monetize"],
    ["escalate", "demonetize", "monetize", "demonetize"],
    ["limited", "limited", "demonetize", "monetize"],
  ];

  let capturedReceipt = false;
  for (let dayIndex = 0; dayIndex < plan.length; dayIndex += 1) {
    for (const action of plan[dayIndex]) {
      await evaluate(`document.querySelector('[data-action="${action}"]').click(); true`);
      await sleep(60);
      const verdict = await evaluate(`({
        receipt: document.querySelector("#receiptText").textContent,
        nextVisible: !document.querySelector("#nextButton").hidden,
        financeGain: document.querySelector("#financeGain").textContent,
        financePaid: document.querySelector("#financePaid").textContent
      })`);
      if (!verdict.nextVisible || !verdict.receipt.includes("Sello aceptado")) {
        throw new Error(`Decision failed: ${action} -> ${JSON.stringify(verdict)}`);
      }
      if (action === "demonetize" && !verdict.receipt.includes("Deuda convertida en ganancia")) {
        throw new Error(`Demonetize did not convert debt: ${JSON.stringify(verdict)}`);
      }
      if (!capturedReceipt) {
        await screenshot("03-first-verdict.png");
        capturedReceipt = true;
      }
      await evaluate(`document.querySelector("#nextButton").click(); true`);
      await sleep(80);
    }

    const eventState = await evaluate(`({
      eventVisible: !document.querySelector("#eventScreen").hidden,
      choices: document.querySelectorAll("#eventActions button").length
    })`);
    if (!eventState.eventVisible || eventState.choices !== 2) {
      throw new Error(`Event did not open: ${JSON.stringify(eventState)}`);
    }
    await evaluate(`document.querySelector("#eventActions button").click(); true`);
    await sleep(80);

    const expectedInterludes = [
      ["story-interlude-01.png"],
      ["story-interlude-02.png", "story-interlude-06.png"],
      ["story-interlude-03.png", "story-interlude-07.png"],
      ["story-interlude-04.png", "story-interlude-08.png"],
      ["story-interlude-05.png"],
    ];

    for (const expectedImage of expectedInterludes[dayIndex]) {
      const interludeState = await evaluate(`({
        interludeVisible: !document.querySelector("#interludeScreen").hidden,
        title: document.querySelector("#interludeTitle").textContent,
        fragments: document.querySelectorAll("#interludeList li").length,
        choices: document.querySelectorAll("#interludeActions button").length,
        imageBg: getComputedStyle(document.querySelector("#interludeImage")).backgroundImage
      })`);
      if (
        !interludeState.interludeVisible ||
        interludeState.fragments !== 3 ||
        interludeState.choices < 2 ||
        !interludeState.imageBg.includes(expectedImage)
      ) {
        throw new Error(`Interlude did not open correctly: ${expectedImage} -> ${JSON.stringify(interludeState)}`);
      }
      if (expectedImage === "story-interlude-01.png") {
        await screenshot("04-interlude.png");
        await client.send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await sleep(120);
        await screenshot("04b-mobile-interlude.png");
        const mobileInterludeScroll = await evaluate(`(() => {
          const node = document.querySelector("#interludeScreen");
          node.scrollTop = node.scrollHeight;
          return {
            scrollTop: node.scrollTop,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight,
            buttons: Array.from(document.querySelectorAll("#interludeActions button")).map((button) => button.textContent)
          };
        })()`);
        if (mobileInterludeScroll.scrollHeight > mobileInterludeScroll.clientHeight && mobileInterludeScroll.scrollTop <= 0) {
          throw new Error(`Mobile interlude is not scrollable: ${JSON.stringify(mobileInterludeScroll)}`);
        }
        await sleep(120);
        await screenshot("04c-mobile-interlude-bottom.png");
        await client.send("Emulation.clearDeviceMetricsOverride");
        await sleep(120);
      }
      if (expectedImage === "story-interlude-06.png") {
        await screenshot("04d-ceo-desk.png");
      }
      if (expectedImage === "story-interlude-08.png") {
        await screenshot("04e-compute-war.png");
      }
      await evaluate(`document.querySelector("#interludeActions button").click(); true`);
      await sleep(80);
    }

    const appealState = await evaluate(`({
      appealVisible: !document.querySelector("#appealScreen").hidden,
      title: document.querySelector("#appealTitle").textContent,
      points: document.querySelectorAll("#appealList li").length,
      imageBg: getComputedStyle(document.querySelector("#appealImage")).backgroundImage
    })`);
    if (!appealState.appealVisible || appealState.points !== 3 || !appealState.imageBg.includes("appeal-aftermath-gpt-image-2.png")) {
      throw new Error(`Appeal did not open correctly: ${JSON.stringify(appealState)}`);
    }
    if (dayIndex === 0) {
      await screenshot("05-appeal.png");
    }
    await evaluate(`document.querySelector('[data-appeal="reject"]').click(); true`);
    await sleep(80);

    const summaryState = await evaluate(`({
      summaryVisible: !document.querySelector("#summaryScreen").hidden,
      title: document.querySelector("#summaryTitle").textContent
    })`);
    if (!summaryState.summaryVisible || !summaryState.title) {
      throw new Error(`Summary did not open: ${JSON.stringify(summaryState)}`);
    }
    await evaluate(`document.querySelector("#summaryButton").click(); true`);
    await sleep(100);
    if (dayIndex === 0) {
      const edictState = await evaluate(`({
        gameVisible: !document.querySelector("#gameScreen").hidden,
        rules: document.querySelector("#ruleList").textContent
      })`);
      if (!edictState.gameVisible || !edictState.rules.includes("Edicto activo")) {
        throw new Error(`Event edict was not carried into the next day: ${JSON.stringify(edictState)}`);
      }
    }
  }

  const finalState = await evaluate(`({
    summaryVisible: !document.querySelector("#summaryScreen").hidden,
    title: document.querySelector("#summaryTitle").textContent,
    body: document.querySelector("#summaryBody").textContent,
    button: document.querySelector("#summaryButton").textContent
  })`);
  if (!finalState.summaryVisible || finalState.button !== "Reiniciar nucleo") {
    throw new Error(`Final state was not reached: ${JSON.stringify(finalState)}`);
  }
  await screenshot("06-final.png");

  client.close();
  console.log(JSON.stringify({
    ok: true,
    chromePath,
    screenshotsDir,
    finalTitle: finalState.title,
  }, null, 2));
}

try {
  await main();
} finally {
  chrome.kill();
  await Promise.race([
    new Promise((resolve) => chrome.once("exit", resolve)),
    sleep(1500),
  ]);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
      break;
    } catch {
      await sleep(250);
    }
  }
}
