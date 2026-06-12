const colors = ["#1f6b4d", "#315f9f", "#a5463c", "#8a5d18"];
const accountStorageKey = "kevins-games-players";
const savedGameStorageKey = "kevins-games-dominoes-current";
const pipMap = {
  0: [],
  1: ["c5"],
  2: ["c1", "c9"],
  3: ["c1", "c5", "c9"],
  4: ["c1", "c3", "c7", "c9"],
  5: ["c1", "c3", "c5", "c7", "c9"],
  6: ["c1", "c3", "c4", "c6", "c7", "c9"],
};

const state = {
  players: [],
  boneyard: [],
  board: makeEmptyBoard(),
  current: 0,
  selectedId: null,
  openerId: null,
  round: 1,
  target: 100,
  started: false,
  blockedPasses: 0,
  needsHandoff: false,
  privacyMode: true,
  challenge: null,
  rematchAvailable: false,
  lastRoster: [],
  lastSettings: null,
  sessionPlayer: null,
  gameChosen: false,
  online: {
    roomCode: "",
    lastVersion: 0,
    syncing: false,
    applyingRemote: false,
    pollTimer: null,
  },
};

const els = {
  authScreen: document.querySelector("#authScreen"),
  authMode: document.querySelector("#authMode"),
  authName: document.querySelector("#authName"),
  authPassword: document.querySelector("#authPassword"),
  authEmailRow: document.querySelector("#authEmailRow"),
  authEmail: document.querySelector("#authEmail"),
  authMessage: document.querySelector("#authMessage"),
  authSubmitBtn: document.querySelector("#authSubmitBtn"),
  gameLobby: document.querySelector("#gameLobby"),
  lobbyPlayer: document.querySelector("#lobbyPlayer"),
  chooseDominoesBtn: document.querySelector("#chooseDominoesBtn"),
  showAppQrBtn: document.querySelector("#showAppQrBtn"),
  gameHub: document.querySelector("#gameHub"),
  selectedGameName: document.querySelector("#selectedGameName"),
  openGamesList: document.querySelector("#openGamesList"),
  continueGameBtn: document.querySelector("#continueGameBtn"),
  startNewGameBtn: document.querySelector("#startNewGameBtn"),
  backToShelfBtn: document.querySelector("#backToShelfBtn"),
  signOutBtn: document.querySelector("#signOutBtn"),
  appShell: document.querySelector("#appShell"),
  playerCount: document.querySelector("#playerCount"),
  targetScore: document.querySelector("#targetScore"),
  privacyMode: document.querySelector("#privacyMode"),
  newGameBtn: document.querySelector("#newGameBtn"),
  signedInSeat: document.querySelector("#signedInSeat"),
  onlineStatus: document.querySelector("#onlineStatus"),
  onlineRoomCode: document.querySelector("#onlineRoomCode"),
  createOnlineRoomBtn: document.querySelector("#createOnlineRoomBtn"),
  joinOnlineRoomBtn: document.querySelector("#joinOnlineRoomBtn"),
  copyOnlineLinkBtn: document.querySelector("#copyOnlineLinkBtn"),
  showInviteQrBtn: document.querySelector("#showInviteQrBtn"),
  playerCredentials: document.querySelector("#playerCredentials"),
  playersList: document.querySelector("#playersList"),
  roomCode: document.querySelector("#roomCode"),
  roundLabel: document.querySelector("#roundLabel"),
  statusTitle: document.querySelector("#statusTitle"),
  boneyardCount: document.querySelector("#boneyardCount"),
  openEnds: document.querySelector("#openEnds"),
  boardScoreTotal: document.querySelector("#boardScoreTotal"),
  boardScoreHint: document.querySelector("#boardScoreHint"),
  board: document.querySelector("#board"),
  emptyBoard: document.querySelector("#emptyBoard"),
  hand: document.querySelector("#hand"),
  currentPlayer: document.querySelector("#currentPlayer"),
  turnKicker: document.querySelector("#turnKicker"),
  drawBtn: document.querySelector("#drawBtn"),
  passBtn: document.querySelector("#passBtn"),
  leftEndBtn: document.querySelector("#leftEndBtn"),
  rightEndBtn: document.querySelector("#rightEndBtn"),
  topEndBtn: document.querySelector("#topEndBtn"),
  bottomEndBtn: document.querySelector("#bottomEndBtn"),
  handoffOverlay: document.querySelector("#handoffOverlay"),
  handoffName: document.querySelector("#handoffName"),
  handoffPassword: document.querySelector("#handoffPassword"),
  handoffError: document.querySelector("#handoffError"),
  revealBtn: document.querySelector("#revealBtn"),
  challengeOverlay: document.querySelector("#challengeOverlay"),
  challengeTitle: document.querySelector("#challengeTitle"),
  challengePlayers: document.querySelector("#challengePlayers"),
  declineChallengeBtn: document.querySelector("#declineChallengeBtn"),
  acceptChallengeBtn: document.querySelector("#acceptChallengeBtn"),
  rematchOverlay: document.querySelector("#rematchOverlay"),
  rematchTitle: document.querySelector("#rematchTitle"),
  newSetupBtn: document.querySelector("#newSetupBtn"),
  rematchBtn: document.querySelector("#rematchBtn"),
  qrOverlay: document.querySelector("#qrOverlay"),
  qrKicker: document.querySelector("#qrKicker"),
  qrTitle: document.querySelector("#qrTitle"),
  qrCode: document.querySelector("#qrCode"),
  qrLink: document.querySelector("#qrLink"),
  closeQrBtn: document.querySelector("#closeQrBtn"),
};

function makeEmptyBoard() {
  return {
    spinner: null,
    left: [],
    right: [],
    top: [],
    bottom: [],
  };
}

function makeDeck() {
  const deck = [];
  for (let left = 0; left <= 6; left += 1) {
    for (let right = left; right <= 6; right += 1) {
      deck.push({ id: `${left}-${right}`, left, right });
    }
  }
  return shuffle(deck);
}

function shuffle(items) {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(accountStorageKey)) || {};
  } catch (error) {
    return {};
  }
}

function writeAccounts(accounts) {
  try {
    localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
  } catch (error) {
    // Local accounts are a convenience for this device; the game can still run without storage.
  }
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function accountKey(name) {
  return name.toLowerCase();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function authenticateAppPlayer() {
  const accounts = readAccounts();
  const mode = els.authMode.value;
  const name = normalizeName(els.authName.value);
  const password = els.authPassword.value;
  const email = normalizeEmail(els.authEmail.value);
  const key = accountKey(name);
  els.authName.value = name;
  els.authEmail.value = email;

  if (!name || !password) {
    els.authMessage.textContent = "Enter a login name and password.";
    return;
  }
  if (mode === "signup") {
    if (accounts[key]) {
      els.authMessage.textContent = `${name} already has an account. Sign in instead.`;
      return;
    }
    if (email && !email.includes("@")) {
      els.authMessage.textContent = "Recovery email needs an @ sign.";
      return;
    }
    accounts[key] = { name, password, email };
    writeAccounts(accounts);
  } else {
    if (!accounts[key]) {
      els.authMessage.textContent = `${name} does not have an account yet. Sign up first.`;
      return;
    }
    if (accounts[key].password !== password) {
      els.authMessage.textContent = "Password does not match.";
      els.authPassword.select();
      return;
    }
  }

  state.sessionPlayer = { ...(accounts[key] || { name, password, email }) };
  els.authPassword.value = "";
  els.authMessage.textContent = "";
  showLobby();
}

function syncAuthMode() {
  const isSignup = els.authMode.value === "signup";
  els.authEmailRow.classList.toggle("hidden", !isSignup);
  els.authSubmitBtn.textContent = isSignup ? "Create account" : "Sign in";
}

function showAuth() {
  state.sessionPlayer = null;
  state.gameChosen = false;
  els.authScreen.classList.remove("hidden");
  els.gameLobby.classList.add("hidden");
  els.gameHub.classList.add("hidden");
  els.appShell.classList.add("hidden");
  syncAuthMode();
}

function showLobby() {
  state.gameChosen = false;
  els.authScreen.classList.add("hidden");
  els.gameLobby.classList.remove("hidden");
  els.gameHub.classList.add("hidden");
  els.appShell.classList.add("hidden");
  els.lobbyPlayer.textContent = state.sessionPlayer ? `Signed in as ${state.sessionPlayer.name}` : "Signed in";
  renderLobby();
}

function chooseDominoes() {
  state.gameChosen = true;
  els.gameLobby.classList.add("hidden");
  els.gameHub.classList.remove("hidden");
  els.appShell.classList.add("hidden");
  renderGameHub();
}

function renderLobby() {
  renderGameHub();
}

function showNewGameSetup() {
  state.gameChosen = true;
  els.gameHub.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  renderSignedInSeat();
  els.playerCredentials.innerHTML = "";
  configureOnlineControls();
  render("Set the table size and start a new Dominoes game.");
}

function renderGameHub() {
  const saved = readSavedGame();
  els.selectedGameName.textContent = "Dominoes";
  els.openGamesList.innerHTML = "";
  els.continueGameBtn.disabled = !saved;

  if (!saved?.players?.length) {
    const empty = document.createElement("div");
    empty.className = "open-game empty";
    empty.innerHTML = "<strong>No open Dominoes games</strong><span>Start a new game when you are ready.</span>";
    els.openGamesList.append(empty);
    return;
  }

  const opponents = saved.players
    .map((player) => player.name)
    .filter((name) => name !== state.sessionPlayer?.name);
  const row = document.createElement("button");
  row.type = "button";
  row.className = "open-game";
  row.innerHTML = `
    <strong>${opponents.length ? opponents.join(", ") : "Dominoes table"}</strong>
    <span>Round ${saved.round || 1} · ${saved.players.length} players</span>
  `;
  row.addEventListener("click", continueSavedGame);
  els.openGamesList.append(row);
}

function onlineDatabaseURL() {
  return window.TABLE_NIGHT_ONLINE?.databaseURL?.replace(/\/$/, "") || "";
}

function onlineReady() {
  return Boolean(onlineDatabaseURL());
}

function roomEndpoint(roomCode = state.online.roomCode) {
  return `${onlineDatabaseURL()}/rooms/${encodeURIComponent(roomCode)}.json`;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function setOnlineStatus(message) {
  els.onlineStatus.textContent = message;
}

function configureOnlineControls() {
  const ready = onlineReady();
  els.createOnlineRoomBtn.disabled = !ready;
  els.joinOnlineRoomBtn.disabled = !ready;
  els.copyOnlineLinkBtn.disabled = !ready || !state.online.roomCode;
  els.showInviteQrBtn.disabled = !state.online.roomCode;
  if (!ready) {
    setOnlineStatus("Not configured");
  } else if (state.online.roomCode) {
    setOnlineStatus(`Room ${state.online.roomCode}`);
  } else {
    setOnlineStatus("Ready");
  }
}

function normalizeRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function inviteURL() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.online.roomCode);
  return url.toString();
}

function appURL() {
  if (typeof URL === "undefined") return window.location.href || "";
  const url = new URL(window.location.href || "http://localhost/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

function shareURL() {
  return state.online.roomCode && typeof URL !== "undefined" ? inviteURL() : appURL();
}

function showQRCode(title, kicker, value) {
  els.qrKicker.textContent = kicker;
  els.qrTitle.textContent = title;
  els.qrLink.textContent = value;
  const svg = qrSvg(value);
  if (svg) {
    els.qrCode.innerHTML = svg;
  } else {
    els.qrCode.innerHTML = '<div class="message">This link is too long for the built-in QR code.</div>';
  }
  els.qrOverlay.classList.remove("hidden");
}

function showAppQRCode() {
  showQRCode("Scan to get Kevin's Games", "App QR", shareURL());
}

function showInviteQRCode() {
  if (!state.online.roomCode) {
    showQRCode("Scan to get Kevin's Games", "App QR", appURL());
    return;
  }
  showQRCode(`Scan to join ${state.online.roomCode}`, "Invite QR", inviteURL());
}

function qrSvg(text) {
  const data = new TextEncoder().encode(text);
  const version = 4;
  const size = 21 + 4 * (version - 1);
  const dataCodewords = 80;
  const ecCodewords = 20;
  const capacityBits = dataCodewords * 8;
  const bits = [];
  const append = (value, length) => {
    for (let index = length - 1; index >= 0; index -= 1) {
      bits.push((value >> index) & 1);
    }
  };
  append(0b0100, 4);
  append(data.length, 8);
  data.forEach((byte) => append(byte, 8));
  if (bits.length > capacityBits - 4) return "";
  for (let index = 0; index < 4 && bits.length < capacityBits; index += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    let byte = 0;
    for (let offset = 0; offset < 8; offset += 1) byte = (byte << 1) | bits[index + offset];
    codewords.push(byte);
  }
  const pad = [0xec, 0x11];
  while (codewords.length < dataCodewords) codewords.push(pad[codewords.length % 2]);
  const allCodewords = [...codewords, ...reedSolomonRemainder(codewords, ecCodewords)];
  const stream = [];
  allCodewords.forEach((byte) => {
    for (let bit = 7; bit >= 0; bit -= 1) stream.push((byte >> bit) & 1);
  });

  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const setModule = (row, col, value, reserve = true) => {
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    modules[row][col] = Boolean(value);
    if (reserve) reserved[row][col] = true;
  };
  const addFinder = (row, col) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const yy = row + y;
        const xx = col + x;
        if (yy < 0 || xx < 0 || yy >= size || xx >= size) continue;
        const dark = y >= 0 && y <= 6 && x >= 0 && x <= 6
          && (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4));
        setModule(yy, xx, dark);
      }
    }
  };
  const addAlignment = (row, col) => {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        setModule(row + y, col + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);
  for (let index = 8; index < size - 8; index += 1) {
    setModule(6, index, index % 2 === 0);
    setModule(index, 6, index % 2 === 0);
  }
  addAlignment(26, 26);
  setModule(size - 8, 8, true);
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      reserved[8][index] = true;
      reserved[index][8] = true;
    }
  }
  for (let index = 0; index < 8; index += 1) {
    reserved[8][size - 1 - index] = true;
    reserved[size - 1 - index][8] = true;
  }

  let streamIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (const currentCol of [col, col - 1]) {
        if (reserved[row][currentCol]) continue;
        let bit = stream[streamIndex] || 0;
        if ((row + currentCol) % 2 === 0) bit ^= 1;
        modules[row][currentCol] = Boolean(bit);
        streamIndex += 1;
      }
    }
    upward = !upward;
  }

  const format = qrFormatBits(0b01, 0);
  const formatBit = (index) => (format >> index) & 1;
  for (let index = 0; index < 6; index += 1) setModule(8, index, formatBit(index));
  setModule(8, 7, formatBit(6));
  setModule(8, 8, formatBit(7));
  setModule(7, 8, formatBit(8));
  for (let index = 9; index < 15; index += 1) setModule(14 - index, 8, formatBit(index));
  for (let index = 0; index < 8; index += 1) setModule(size - 1 - index, 8, formatBit(index));
  for (let index = 8; index < 15; index += 1) setModule(8, size - 15 + index, formatBit(index));

  const scale = 8;
  const quiet = 4;
  const viewSize = (size + quiet * 2) * scale;
  const rects = [];
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) rects.push(`<rect x="${(x + quiet) * scale}" y="${(y + quiet) * scale}" width="${scale}" height="${scale}"/>`);
    });
  });
  return `<svg viewBox="0 0 ${viewSize} ${viewSize}" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fffdf8"/><g fill="#17201c">${rects.join("")}</g></svg>`;
}

function qrGfMultiply(left, right) {
  let value = 0;
  while (right) {
    if (right & 1) value ^= left;
    left <<= 1;
    if (left & 0x100) left ^= 0x11d;
    right >>= 1;
  }
  return value;
}

function qrGfPower(value, power) {
  let result = 1;
  for (let index = 0; index < power; index += 1) result = qrGfMultiply(result, value);
  return result;
}

function qrPolynomialMultiply(left, right) {
  const result = Array(left.length + right.length - 1).fill(0);
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] ^= qrGfMultiply(leftValue, rightValue);
    });
  });
  return result;
}

function reedSolomonRemainder(data, degree) {
  let generator = [1];
  for (let index = 0; index < degree; index += 1) {
    generator = qrPolynomialMultiply(generator, [1, qrGfPower(2, index)]);
  }
  const remainder = [...data, ...Array(degree).fill(0)];
  data.forEach((_, index) => {
    const factor = remainder[index];
    if (!factor) return;
    generator.forEach((coefficient, offset) => {
      remainder[index + offset] ^= qrGfMultiply(coefficient, factor);
    });
  });
  return remainder.slice(-degree);
}

function qrFormatBits(errorCorrectionBits, mask) {
  const data = (errorCorrectionBits << 3) | mask;
  let value = data << 10;
  const generator = 0x537;
  for (let index = 14; index >= 10; index -= 1) {
    if ((value >> index) & 1) value ^= generator << (index - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

async function createOnlineRoom() {
  if (!onlineReady()) {
    render("Online rooms need a database URL first.");
    return;
  }
  const code = makeRoomCode();
  setOnlineRoom(code);
  await pushRoomState(true);
  render(`Online room ${code} is ready.`);
}

async function joinOnlineRoom() {
  if (!onlineReady()) {
    render("Online rooms need a database URL first.");
    return;
  }
  const code = normalizeRoomCode(els.onlineRoomCode.value);
  if (!code) {
    render("Enter a room code.");
    return;
  }
  setOnlineRoom(code);
  const found = await pullRoomState(true);
  render(found ? `Joined online room ${code}.` : `Room ${code} is ready for a new game.`);
}

function setOnlineRoom(code) {
  state.online.roomCode = code;
  state.online.lastVersion = 0;
  els.onlineRoomCode.value = code;
  configureOnlineControls();
  startOnlinePolling();
}

async function copyOnlineLink() {
  if (!state.online.roomCode) {
    render("Create or join a room first.");
    return;
  }
  const link = inviteURL();
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(link);
    render("Invite link copied.");
  } else {
    render(link);
  }
}

function serializeGameState() {
  return {
    players: state.players.map((player) => ({
      name: player.name,
      score: player.score,
      hand: player.hand,
      color: player.color,
    })),
    boneyard: state.boneyard,
    board: state.board,
    current: state.current,
    selectedId: state.selectedId,
    openerId: state.openerId,
    round: state.round,
    target: state.target,
    started: state.started,
    blockedPasses: state.blockedPasses,
    privacyMode: false,
    needsHandoff: false,
    rematchAvailable: state.rematchAvailable,
    lastRoster: state.lastRoster.map((player) => ({
      name: player.name,
      email: player.email || "",
    })),
    lastSettings: state.lastSettings,
    roomCode: els.roomCode.textContent,
  };
}

function applyRemoteGame(game) {
  state.online.applyingRemote = true;
  state.players = game.players || [];
  state.boneyard = game.boneyard || [];
  state.board = game.board || makeEmptyBoard();
  state.current = game.current || 0;
  state.selectedId = game.selectedId || null;
  state.openerId = game.openerId || null;
  state.round = game.round || 1;
  state.target = game.target || 100;
  state.started = Boolean(game.started);
  state.blockedPasses = game.blockedPasses || 0;
  state.privacyMode = false;
  state.needsHandoff = false;
  state.rematchAvailable = Boolean(game.rematchAvailable);
  state.lastRoster = game.lastRoster || [];
  state.lastSettings = game.lastSettings || { target: state.target, privacyMode: false };
  els.roomCode.textContent = game.roomCode || state.online.roomCode;
  state.gameChosen = true;
  els.gameLobby.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  render(state.started ? `Online room ${state.online.roomCode}` : "Online room loaded.");
  state.online.applyingRemote = false;
}

async function pushRoomState(force = false) {
  if (!onlineReady() || !state.online.roomCode || state.online.applyingRemote) return;
  if (!force && !state.started && !state.players.length) return;
  state.online.lastVersion = Date.now();
  const payload = {
    version: state.online.lastVersion,
    updatedAt: new Date().toISOString(),
    game: serializeGameState(),
  };
  try {
    state.online.syncing = true;
    await fetch(roomEndpoint(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    configureOnlineControls();
  } catch (error) {
    setOnlineStatus("Offline");
  } finally {
    state.online.syncing = false;
  }
}

async function pullRoomState(force = false) {
  if (!onlineReady() || !state.online.roomCode || state.online.syncing) return false;
  try {
    const response = await fetch(roomEndpoint());
    const payload = await response.json();
    if (!payload?.game) return false;
    if (force || payload.version > state.online.lastVersion) {
      state.online.lastVersion = payload.version || Date.now();
      applyRemoteGame(payload.game);
    }
    configureOnlineControls();
    return true;
  } catch (error) {
    setOnlineStatus("Offline");
    return false;
  }
}

function startOnlinePolling() {
  if (state.online.pollTimer) window.clearInterval(state.online.pollTimer);
  if (!onlineReady() || !state.online.roomCode) return;
  state.online.pollTimer = window.setInterval(() => pullRoomState(), 2500);
}

function readSavedGame() {
  try {
    return JSON.parse(localStorage.getItem(savedGameStorageKey));
  } catch (error) {
    return null;
  }
}

function saveCurrentGame() {
  if (!state.started) return;
  try {
    localStorage.setItem(savedGameStorageKey, JSON.stringify({
      players: state.players,
      boneyard: state.boneyard,
      board: state.board,
      current: state.current,
      selectedId: state.selectedId,
      openerId: state.openerId,
      round: state.round,
      target: state.target,
      blockedPasses: state.blockedPasses,
      privacyMode: state.privacyMode,
      lastRoster: state.lastRoster,
      lastSettings: state.lastSettings,
      roomCode: els.roomCode.textContent,
    }));
  } catch (error) {
    // Ongoing-game save is a convenience for this device.
  }
}

function clearSavedGame() {
  try {
    localStorage.removeItem(savedGameStorageKey);
  } catch (error) {
    // Nothing to clear.
  }
}

function continueSavedGame() {
  const saved = readSavedGame();
  if (!saved) {
    renderLobby();
    return;
  }
  state.players = saved.players || [];
  state.boneyard = saved.boneyard || [];
  state.board = saved.board || makeEmptyBoard();
  state.current = saved.current || 0;
  state.selectedId = saved.selectedId || null;
  state.openerId = saved.openerId || null;
  state.round = saved.round || 1;
  state.target = saved.target || 100;
  state.started = true;
  state.blockedPasses = saved.blockedPasses || 0;
  state.privacyMode = saved.privacyMode !== false;
  state.needsHandoff = state.privacyMode;
  state.challenge = null;
  state.rematchAvailable = false;
  state.lastRoster = saved.lastRoster || [];
  state.lastSettings = saved.lastSettings || { target: state.target, privacyMode: state.privacyMode };
  els.roomCode.textContent = saved.roomCode || `LOCAL-${Math.floor(100 + Math.random() * 900)}`;
  state.gameChosen = true;
  els.gameLobby.classList.add("hidden");
  els.gameHub.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  render(`Continuing round ${state.round}.`);
}

function collectRoster() {
  const slots = [...els.playerCredentials.querySelectorAll(".credential-row")];
  const accounts = readAccounts();
  const roster = [];
  const names = new Set();

  for (const slot of slots) {
    const modeInput = slot.querySelector("[data-field='mode']");
    const nameInput = slot.querySelector("[data-field='name']");
    const passwordInput = slot.querySelector("[data-field='password']");
    const emailInput = slot.querySelector("[data-field='email']");
    const mode = modeInput.value;
    const name = normalizeName(nameInput.value);
    const password = passwordInput.value;
    const email = normalizeEmail(emailInput.value);
    nameInput.value = name;
    emailInput.value = email;

    if (!name || !password) {
      return { error: "Each player needs a name and password." };
    }
    const key = accountKey(name);
    if (names.has(key)) {
      return { error: "Each player needs a different login name." };
    }
    if (mode === "signup") {
      if (accounts[key]) {
        return { error: `${name} already has an account. Sign in instead.` };
      }
      if (email && !email.includes("@")) {
        return { error: `${name}'s recovery email needs an @ sign.` };
      }
    } else {
      if (!accounts[key]) {
        return { error: `${name} does not have an account yet. Sign up first.` };
      }
      if (accounts[key].password !== password) {
        return { error: `${name}'s password does not match this device.` };
      }
    }
    names.add(key);
    roster.push({ name, password, email: mode === "signup" ? email : accounts[key]?.email || "" });
  }

  roster.forEach((player) => {
    accounts[accountKey(player.name)] = {
      name: player.name,
      password: player.password,
      email: player.email || accounts[accountKey(player.name)]?.email || "",
    };
  });
  writeAccounts(accounts);
  return { roster };
}

function platformRoster() {
  const count = Number(els.playerCount.value);
  const player = state.sessionPlayer || { name: "Player 1", password: "", email: "" };
  const roster = [{
    name: player.name,
    password: player.password || "",
    email: player.email || "",
  }];
  for (let index = 1; index < count; index += 1) {
    roster.push({
      name: `Open seat ${index + 1}`,
      password: "",
      email: "",
    });
  }
  return roster;
}

function startPlatformGame() {
  if (state.started) {
    render("Finish this table before starting another game.");
    return;
  }
  startGame({
    roster: platformRoster(),
    target: Number(els.targetScore.value),
    privacyMode: false,
  });
}

function requestPasswordReset(row) {
  const name = normalizeName(row.querySelector("[data-field='name']").value);
  if (!name) {
    render("Enter the login name first.");
    return;
  }
  const account = readAccounts()[accountKey(name)];
  if (!account) {
    render(`${name} does not have an account yet. Sign up first.`);
    return;
  }
  if (!account.email) {
    render(`${name} does not have a recovery email saved.`);
    return;
  }
  const subject = encodeURIComponent("Kevin's Games password reset");
  const body = encodeURIComponent(`Hi ${account.name},\n\nReset your Kevin's Games password on this device before your next game.`);
  window.location.href = `mailto:${account.email}?subject=${subject}&body=${body}`;
  render(`Opening a reset email for ${account.name}.`);
}

function issueChallenge() {
  if (state.started) {
    render("Finish this table before starting another challenge.");
    return;
  }
  const login = collectRoster();
  if (login.error) {
    render(login.error);
    return;
  }
  state.challenge = {
    roster: login.roster,
    target: Number(els.targetScore.value),
    privacyMode: els.privacyMode.checked,
    accepted: login.roster.map((_, index) => index === 0),
    nextIndex: Math.min(1, login.roster.length - 1),
  };
  state.rematchAvailable = false;
  render(`${login.roster[0].name} challenged the table.`);
}

function acceptChallenge() {
  if (!state.challenge) return;
  state.challenge.accepted[state.challenge.nextIndex] = true;
  const nextIndex = state.challenge.accepted.findIndex((accepted) => !accepted);
  if (nextIndex === -1) {
    const challenge = state.challenge;
    state.challenge = null;
    startGame({
      roster: challenge.roster,
      target: challenge.target,
      privacyMode: challenge.privacyMode,
    });
    return;
  }
  state.challenge.nextIndex = nextIndex;
  render(`${state.challenge.roster[nextIndex].name}, accept the challenge.`);
}

function declineChallenge() {
  if (!state.challenge) return;
  state.challenge = null;
  render("Challenge declined.");
}

function startGame(options = null) {
  let roster;
  let target;
  let privacyMode;
  if (options?.roster) {
    roster = options.roster;
    target = options.target;
    privacyMode = options.privacyMode;
  } else {
    const count = Number(els.playerCount.value);
    const login = collectRoster();
    if (login.error) {
      render(login.error);
      return;
    }
    roster = login.roster.slice(0, count);
    target = Number(els.targetScore.value);
    privacyMode = els.privacyMode.checked;
  }
  state.target = target;
  state.privacyMode = privacyMode;
  if (state.online.roomCode) {
    state.privacyMode = false;
    els.privacyMode.checked = false;
  }
  state.players = roster.map((player, index) => ({
    name: player.name,
    password: player.password,
    score: 0,
    hand: [],
    color: colors[index],
  }));
  state.lastRoster = roster.map((player) => ({ ...player }));
  state.lastSettings = { target, privacyMode };
  state.round = 1;
  state.started = true;
  state.gameChosen = true;
  state.rematchAvailable = false;
  els.roomCode.textContent = `LOCAL-${Math.floor(100 + Math.random() * 900)}`;
  startRound();
}

function startRematch() {
  if (!state.lastRoster.length || !state.lastSettings) return;
  state.rematchAvailable = false;
  startGame({
    roster: state.lastRoster.map((player) => ({ ...player })),
    target: state.lastSettings.target,
    privacyMode: state.lastSettings.privacyMode,
  });
}

function resetToSetup() {
  state.rematchAvailable = false;
  state.challenge = null;
  state.started = false;
  state.players = [];
  state.boneyard = [];
  state.board = makeEmptyBoard();
  state.selectedId = null;
  state.openerId = null;
  state.round = 1;
  clearSavedGame();
  els.appShell.classList.add("hidden");
  els.gameHub.classList.remove("hidden");
  renderGameHub();
}

function startRound() {
  const handSize = state.players.length === 2 ? 7 : 5;
  let deck;
  let starter;
  do {
    deck = makeDeck();
    state.players.forEach((player) => {
      player.hand = deck.splice(0, handSize).sort(sortTiles);
    });
    starter = chooseStarter();
  } while (state.round === 1 && starter.tile.left !== starter.tile.right);
  state.boneyard = deck;
  state.board = makeEmptyBoard();
  state.selectedId = null;
  state.openerId = null;
  state.blockedPasses = 0;
  state.current = starter.playerIndex;
  state.openerId = state.round === 1 ? starter.tile.id : null;
  state.needsHandoff = state.privacyMode;
  render(state.round === 1
    ? `Round 1: ${state.players[state.current].name} has the opener.`
    : `Round ${state.round}: ${state.players[state.current].name} opens with any tile.`);
}

function chooseStarter() {
  let best = { playerIndex: 0, value: -1, tile: null };
  state.players.forEach((player, playerIndex) => {
    player.hand.forEach((tile) => {
      const isDouble = tile.left === tile.right;
      const value = isDouble ? 100 + tile.left : tile.left + tile.right;
      if (value > best.value) best = { playerIndex, value, tile };
    });
  });
  return best;
}

function sortTiles(a, b) {
  return b.left + b.right - (a.left + a.right) || b.left - a.left || b.right - a.right;
}

function tileValue(tile) {
  return tile.left + tile.right;
}

function currentPlayer() {
  return state.players[state.current];
}

function openEnds() {
  if (!state.board.spinner) return null;
  const opener = state.board.spinner;
  const branchEnd = (side) => {
    const branch = state.board[side];
    if (branch.length) return branch[branch.length - 1].right;
    return side === "right" ? opener.right : opener.left;
  };
  return {
    left: branchEnd("left"),
    right: branchEnd("right"),
    top: branchEnd("top"),
    bottom: branchEnd("bottom"),
  };
}

function scoringEnds() {
  if (!state.board.spinner) return null;
  const opener = state.board.spinner;
  const branchScore = (side) => {
    const branch = state.board[side];
    if (!branch.length) return side === "right" ? opener.right : opener.left;
    const endTile = branch[branch.length - 1];
    return endTile.left === endTile.right ? tileValue(endTile) : endTile.right;
  };
  return {
    left: branchScore("left"),
    right: branchScore("right"),
    top: branchScore("top"),
    bottom: branchScore("bottom"),
  };
}

function boardScore() {
  const endTotal = boardTotal();
  return endTotal > 0 && endTotal % 5 === 0 ? endTotal : 0;
}

function boardTotal() {
  if (!state.board.spinner) return 0;
  const ends = scoringEnds();
  const opener = state.board.spinner;
  const openerIsDouble = opener.left === opener.right;
  const hasLeft = state.board.left.length > 0;
  const hasRight = state.board.right.length > 0;
  const scoringSides = ["left", "right", "top", "bottom"].filter((side) => state.board[side].length > 0);
  if (!openerIsDouble) {
    return (hasLeft ? ends.left : opener.left) + (hasRight ? ends.right : opener.right);
  }
  if (scoringSides.length === 0) return tileValue(opener);
  const sideTotal = scoringSides.reduce((sum, side) => sum + ends[side], 0);
  return hasLeft && hasRight
    ? sideTotal
    : tileValue(opener) + sideTotal;
}

function playableSides() {
  if (!state.board.spinner) return [];
  const openerIsDouble = state.board.spinner.left === state.board.spinner.right;
  const sides = ["left", "right"];
  if (openerIsDouble && state.board.left.length > 0 && state.board.right.length > 0) {
    sides.push("top", "bottom");
  }
  return sides;
}

function canPlay(tile, side = "either") {
  if (!state.board.spinner) return state.openerId ? tile.id === state.openerId : true;
  const ends = openEnds();
  const sideMatch = (targetSide) => tile.left === ends[targetSide] || tile.right === ends[targetSide];
  const sides = playableSides();
  if (side === "either") return sides.some(sideMatch);
  return sides.includes(side) && sideMatch(side);
}

function playTile(tileId, side) {
  const player = currentPlayer();
  const tileIndex = player.hand.findIndex((tile) => tile.id === tileId);
  if (tileIndex < 0) return;
  const tile = player.hand[tileIndex];
  if (!canPlay(tile, side)) return;

  player.hand.splice(tileIndex, 1);
  if (!state.board.spinner) {
    state.board.spinner = { ...tile };
  } else {
    const end = openEnds()[side];
    const oriented = tile.left === end ? { left: tile.left, right: tile.right } : { left: tile.right, right: tile.left };
    state.board[side].push(oriented);
  }

  state.selectedId = null;
  state.blockedPasses = 0;
  const score = boardScore();
  if (score > 0) {
    player.score += score;
  }

  if (player.hand.length === 0) {
    finishRound(player, {
      tile,
      playScore: score,
    });
    return;
  }

  if (player.score >= state.target) {
    completeTable(`${player.name} wins the table with ${player.score} points.`);
    return;
  }

  advanceTurn(score > 0
    ? `${player.name} played ${tile.left}|${tile.right} and scored ${score}.`
    : `${player.name} played ${tile.left}|${tile.right}.`);
}

function drawTile() {
  const player = currentPlayer();
  if (hasPlayable(player) || state.boneyard.length === 0) {
    render(state.boneyard.length ? "You already have a playable tile." : "The boneyard is empty. Pass if you cannot play.");
    return;
  }
  const tile = state.boneyard.pop();
  player.hand.push(tile);
  player.hand.sort(sortTiles);
  state.blockedPasses = 0;
  render(`${player.name} drew a tile.`);
}

function passTurn() {
  const player = currentPlayer();
  if (hasPlayable(player)) {
    render("You have a playable tile.");
    return;
  }
  if (state.boneyard.length > 0) {
    render("Draw before passing.");
    return;
  }
  state.blockedPasses += 1;
  if (state.blockedPasses >= state.players.length) {
    finishRound(findLowestPipPlayer());
    return;
  }
  advanceTurn(`${player.name} passed.`);
}

function hasPlayable(player) {
  return player.hand.some((tile) => canPlay(tile));
}

function advanceTurn(message) {
  state.current = (state.current + 1) % state.players.length;
  state.needsHandoff = state.privacyMode;
  render(message);
}

function completeTable(message) {
  state.started = false;
  state.needsHandoff = false;
  state.rematchAvailable = state.players.length > 0;
  clearSavedGame();
  render(message);
  pushRoomState(true);
}

function finishRound(winner, lastPlay = null) {
  const winnerPips = handPips(winner);
  const tablePips = state.players.reduce((sum, player) => sum + handPips(player), 0);
  const points = roundToNearestFive(Math.max(0, tablePips - winnerPips));
  winner.score += points;
  const playMessage = lastPlay
    ? `${winner.name} played ${lastPlay.tile.left}|${lastPlay.tile.right}`
      + (lastPlay.playScore > 0 ? ` and scored ${lastPlay.playScore}` : "")
      + ". "
    : "";

  if (winner.score >= state.target) {
    completeTable(`${playMessage}${winner.name} wins the table with ${winner.score} points.`);
    return;
  }

  state.round += 1;
  render(`${playMessage}${winner.name} wins the round and scores ${points}. Starting next round...`);
  window.setTimeout(startRound, 1500);
}

function handPips(player) {
  return player.hand.reduce((sum, tile) => sum + tileValue(tile), 0);
}

function roundToNearestFive(value) {
  return Math.round(value / 5) * 5;
}

function findLowestPipPlayer() {
  return [...state.players].sort((a, b) => handPips(a) - handPips(b))[0];
}

function render(message = "") {
  const player = currentPlayer() || state.players[0];
  els.appShell.classList.toggle("setup-only", !state.started);
  els.roundLabel.textContent = state.started
    ? `Round ${state.round}`
    : state.players.length
      ? "Table complete"
      : "Setup";
  els.statusTitle.textContent = message || (state.started ? `${player.name}'s turn` : "Start a table");
  els.boneyardCount.textContent = state.boneyard.length;
  const ends = openEnds();
  els.openEnds.textContent = ends
    ? `L${ends.left} R${ends.right} T${ends.top} B${ends.bottom}`
    : "--";
  const playableTotal = boardTotal();
  const scoringPoints = boardScore();
  els.boardScoreTotal.textContent = playableTotal;
  els.boardScoreHint.textContent = scoringPoints > 0 ? `${scoringPoints} points` : "pips showing";
  els.currentPlayer.textContent = player?.name || "Player 1";
  els.turnKicker.textContent = state.started
    ? "Current turn"
    : state.players.length
      ? "Winner"
      : "Table setup";

  renderPlayers();
  renderBoard();
  renderHand();
  renderActions();
  renderHandoff();
  renderChallenge();
  renderRematch();
  if (state.started) saveCurrentGame();
  if (state.started || state.rematchAvailable) pushRoomState();
  renderLobby();
}

function renderPlayers() {
  els.playersList.innerHTML = "";
  state.players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = `player-row ${index === state.current && state.started ? "active" : ""}`;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.background = player.color;
    avatar.textContent = index + 1;
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = player.name;
    const meta = document.createElement("div");
    meta.className = "player-meta";
    meta.textContent = `${player.hand.length} tiles`;
    details.append(name, meta);
    const score = document.createElement("div");
    score.className = "score-pill";
    score.textContent = player.score;
    row.append(avatar, details, score);
    els.playersList.append(row);
  });
}

function renderBoard() {
  els.board.innerHTML = "";
  els.emptyBoard.classList.toggle("hidden", Boolean(state.board.spinner));
  if (!state.board.spinner) return;

  const topBranch = branchElement("top vertical", state.board.top, "top");
  const bottomBranch = branchElement("bottom vertical", state.board.bottom, "bottom");
  const middle = document.createElement("div");
  middle.className = "middle-branch";
  middle.append(
    branchElement("left", state.board.left, "left"),
    spinnerElement(),
    branchElement("right", state.board.right, "right"),
  );

  const spinnerBoard = document.createElement("div");
  spinnerBoard.className = "spinner-board";
  spinnerBoard.append(topBranch, middle, bottomBranch);
  els.board.append(spinnerBoard);
}

function renderHand() {
  els.hand.innerHTML = "";
  if (!state.started) {
    els.hand.innerHTML = state.players.length
      ? '<div class="message">Start a new table when you are ready for a rematch.</div>'
      : '<div class="message">Sign in every player to start the table.</div>';
    return;
  }
  if (state.needsHandoff) {
    els.hand.innerHTML = '<div class="message">Hand hidden until the next player is ready.</div>';
    return;
  }

  currentPlayer().hand.forEach((tile) => {
    const playable = canPlay(tile);
    const tileEl = dominoElement(tile, {
      selectable: playable,
      selected: tile.id === state.selectedId,
      muted: !playable,
    });
    tileEl.addEventListener("click", () => selectTile(tile));
    els.hand.append(tileEl);
  });
}

function renderActions() {
  const selected = currentPlayer()?.hand.find((tile) => tile.id === state.selectedId);
  const noGame = !state.started || state.needsHandoff;
  const playerCanPlay = currentPlayer() ? hasPlayable(currentPlayer()) : false;
  els.drawBtn.disabled = noGame || playerCanPlay || state.boneyard.length === 0;
  els.passBtn.disabled = noGame || playerCanPlay || state.boneyard.length > 0;
  els.leftEndBtn.disabled = noGame || !selected || !canPlay(selected, "left");
  els.rightEndBtn.disabled = noGame || !selected || !canPlay(selected, "right");
  els.topEndBtn.disabled = noGame || !selected || !canPlay(selected, "top");
  els.bottomEndBtn.disabled = noGame || !selected || !canPlay(selected, "bottom");
  if (!state.board.spinner && selected) {
    els.leftEndBtn.disabled = true;
    els.topEndBtn.disabled = true;
    els.bottomEndBtn.disabled = true;
    els.rightEndBtn.disabled = false;
    els.rightEndBtn.textContent = "Open round";
  } else {
    els.rightEndBtn.textContent = "Play right";
  }
}

function renderHandoff() {
  els.handoffOverlay.classList.toggle("hidden", !state.started || !state.needsHandoff);
  els.handoffName.textContent = currentPlayer()?.name || "Next player";
  els.handoffError.textContent = "";
  if (state.started && state.needsHandoff) {
    els.handoffPassword.value = "";
    window.setTimeout(() => els.handoffPassword.focus(), 0);
  }
}

function renderChallenge() {
  els.challengeOverlay.classList.toggle("hidden", !state.challenge);
  els.challengePlayers.innerHTML = "";
  if (!state.challenge) return;

  const challenger = state.challenge.roster[0];
  const next = state.challenge.roster[state.challenge.nextIndex];
  els.challengeTitle.textContent = `${challenger.name} challenged you to dominoes`;
  state.challenge.roster.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "challenge-row";
    const name = document.createElement("strong");
    name.textContent = player.name;
    const status = document.createElement("span");
    status.textContent = state.challenge.accepted[index] ? "Accepted" : "Pending";
    row.append(name, status);
    els.challengePlayers.append(row);
  });
  els.acceptChallengeBtn.textContent = next ? `${next.name} accepts` : "Start game";
}

function renderRematch() {
  els.rematchOverlay.classList.toggle("hidden", !state.rematchAvailable);
  if (state.rematchAvailable) {
    const winner = [...state.players].sort((a, b) => b.score - a.score)[0];
    els.rematchTitle.textContent = winner
      ? `${winner.name} wins. Rematch?`
      : "Play again?";
  }
}

function renderCredentials() {
  const count = Number(els.playerCount.value);
  const accounts = Object.values(readAccounts());
  const currentRows = [...els.playerCredentials.querySelectorAll(".credential-row")].map((row) => ({
    mode: row.querySelector("[data-field='mode']").value,
    name: row.querySelector("[data-field='name']").value,
    password: row.querySelector("[data-field='password']").value,
    email: row.querySelector("[data-field='email']").value,
  }));
  els.playerCredentials.innerHTML = "";

  for (let index = 0; index < count; index += 1) {
    const saved = accounts[index];
    const current = currentRows[index];
    const session = index === 0 ? state.sessionPlayer : null;
    const row = document.createElement("div");
    row.className = "credential-row";

    const title = document.createElement("div");
    title.className = "credential-title";
    title.textContent = `Player ${index + 1}`;

    const modeInput = document.createElement("select");
    modeInput.dataset.field = "mode";
    modeInput.innerHTML = `
      <option value="signin">Sign in</option>
      <option value="signup">Sign up</option>
    `;
    modeInput.value = current?.mode || (session || saved ? "signin" : "signup");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Login name";
    nameInput.autocomplete = "username";
    nameInput.dataset.field = "name";
    nameInput.value = current?.name || session?.name || saved?.name || "";

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "Password";
    passwordInput.autocomplete = "current-password";
    passwordInput.dataset.field = "password";
    passwordInput.value = current?.password || session?.password || "";

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.placeholder = "Recovery email";
    emailInput.autocomplete = "email";
    emailInput.dataset.field = "email";
    emailInput.value = current?.email || (modeInput.value === "signup" ? saved?.email || "" : "");

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "reset-btn";
    resetButton.textContent = "Forgot?";
    resetButton.addEventListener("click", () => requestPasswordReset(row));

    const syncMode = () => {
      const isSignup = modeInput.value === "signup";
      emailInput.classList.toggle("hidden", !isSignup);
      resetButton.classList.toggle("hidden", isSignup);
    };
    modeInput.addEventListener("change", syncMode);
    syncMode();

    row.append(title, modeInput, nameInput, passwordInput, emailInput, resetButton);
    els.playerCredentials.append(row);
  }
}

function renderSignedInSeat() {
  if (!els.signedInSeat) return;
  const playerName = state.sessionPlayer?.name || "Player 1";
  const seatCount = Number(els.playerCount.value);
  els.signedInSeat.innerHTML = `
    <strong>${playerName}</strong>
    <span>${seatCount - 1} open ${seatCount === 2 ? "seat" : "seats"}</span>
  `;
}

function selectTile(tile) {
  if (!canPlay(tile)) return;
  state.selectedId = state.selectedId === tile.id ? null : tile.id;
  render(`${currentPlayer().name}, choose an end for ${tile.left}|${tile.right}.`);
}

function dominoElement(tile, options = {}) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = [
    "domino",
    options.horizontal ? "horizontal" : "",
    options.selectable ? "selectable" : "",
    options.selected ? "selected" : "",
    options.muted ? "muted" : "",
  ]
    .filter(Boolean)
    .join(" ");
  el.setAttribute("aria-label", `Domino ${tile.left} ${tile.right}`);
  el.innerHTML = `
    ${halfMarkup(tile.left)}
    <div class="divider"></div>
    ${halfMarkup(tile.right)}
  `;
  return el;
}

function branchElement(className, tiles, side) {
  const branch = document.createElement("div");
  branch.className = `branch ${className}`;
  const displayTiles = side === "left" || side === "top"
    ? [...tiles].reverse().map(flipTile)
    : tiles;
  displayTiles.forEach((tile) => {
    const branchIsHorizontal = side === "left" || side === "right";
    const isDouble = tile.left === tile.right;
    branch.append(dominoElement(tile, { horizontal: isDouble ? !branchIsHorizontal : branchIsHorizontal }));
  });
  return branch;
}

function spinnerElement() {
  const slot = document.createElement("div");
  slot.className = "spinner-slot";
  const openerIsDouble = state.board.spinner.left === state.board.spinner.right;
  slot.append(dominoElement(state.board.spinner, { horizontal: !openerIsDouble }));
  return slot;
}

function flipTile(tile) {
  return { left: tile.right, right: tile.left };
}

function halfMarkup(value) {
  return `<div class="half">${pipMap[value].map((pos) => `<span class="pip ${pos}"></span>`).join("")}</div>`;
}

els.authMode.addEventListener("change", syncAuthMode);
els.authSubmitBtn.addEventListener("click", authenticateAppPlayer);
els.authPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.authSubmitBtn.click();
});
els.chooseDominoesBtn.addEventListener("click", chooseDominoes);
els.showAppQrBtn.addEventListener("click", showAppQRCode);
els.continueGameBtn.addEventListener("click", continueSavedGame);
els.startNewGameBtn.addEventListener("click", showNewGameSetup);
els.backToShelfBtn.addEventListener("click", showLobby);
els.signOutBtn.addEventListener("click", showAuth);
els.newGameBtn.addEventListener("click", startPlatformGame);
els.createOnlineRoomBtn.addEventListener("click", createOnlineRoom);
els.joinOnlineRoomBtn.addEventListener("click", joinOnlineRoom);
els.copyOnlineLinkBtn.addEventListener("click", copyOnlineLink);
els.showInviteQrBtn.addEventListener("click", showInviteQRCode);
els.closeQrBtn.addEventListener("click", () => els.qrOverlay.classList.add("hidden"));
els.playerCount.addEventListener("change", () => {
  renderSignedInSeat();
  if (els.playerCredentials.children.length) renderCredentials();
});
els.drawBtn.addEventListener("click", drawTile);
els.passBtn.addEventListener("click", passTurn);
els.leftEndBtn.addEventListener("click", () => state.selectedId && playTile(state.selectedId, "left"));
els.rightEndBtn.addEventListener("click", () => state.selectedId && playTile(state.selectedId, "right"));
els.topEndBtn.addEventListener("click", () => state.selectedId && playTile(state.selectedId, "top"));
els.bottomEndBtn.addEventListener("click", () => state.selectedId && playTile(state.selectedId, "bottom"));
els.revealBtn.addEventListener("click", () => {
  const player = currentPlayer();
  if (player?.password && els.handoffPassword.value !== player.password) {
    els.handoffError.textContent = "Password does not match.";
    els.handoffPassword.select();
    return;
  }
  state.needsHandoff = false;
  render(`${currentPlayer().name}'s turn.`);
});
els.acceptChallengeBtn.addEventListener("click", acceptChallenge);
els.declineChallengeBtn.addEventListener("click", declineChallenge);
els.rematchBtn.addEventListener("click", startRematch);
els.newSetupBtn.addEventListener("click", resetToSetup);

els.handoffPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.revealBtn.click();
});

renderSignedInSeat();
render("Sign in to choose a game.");
showAuth();

if (typeof URL !== "undefined") {
  const inviteRoom = normalizeRoomCode(new URL(window.location.href || "http://localhost/").searchParams.get("room") || "");
  if (inviteRoom) {
    els.onlineRoomCode.value = inviteRoom;
  }
}
configureOnlineControls();

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Offline support is best-effort when the app is opened from a local file.
    });
  });
}
