// Configurable timers and video
let timer = parseInt(document.getElementById("frontTimer").value);
const videoFrame = document.getElementById("bgVideo");

// Update configuration on apply
function applyConfig() {
  timer = parseInt(document.getElementById("frontTimer").value);
  loadDecks();
  const videoUrlElement = document.getElementById("videoUrl");
  if (videoUrlElement.value) {
    const embedUrl = getYoutubeEmbedUrl(
      document.getElementById("videoUrl").value
    );
    if (embedUrl) {
      videoFrame.src = embedUrl;
    }
  }
}

function getYoutubeEmbedUrl(url) {
  const videoId = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1];

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
  } else {
    alert("Invalid YouTube URL.");
  }
}

// Initial setup for deck loading and theme
window.onload = () => {
  loadDecks();
  setTheme();
};

// Async functions for deck management and Anki interaction
async function ankiConnect(action, params = {}) {
  const ankiHost = document.getElementById("ankiHost").value;
  const response = await fetch(ankiHost, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function loadDecks() {
  try {
    const decks = await ankiConnect("deckNames");
    const deckSelect = document.getElementById("deck");
    deckSelect.innerHTML = "";
    decks.forEach((deck) => {
      const option = document.createElement("option");
      option.value = deck;
      option.textContent = deck;
      deckSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading decks:", error);
  }
}

let cardIDs = [];
let cardTimeout = null;
async function startPractice() {
  const deckName = document.getElementById("deck").value;
  const filterType = document.getElementById("filter").value;
  try {
    const query = buildQuery(deckName, filterType);
    cardIDs = await ankiConnect("findCards", { query });
    if (cardIDs.length === 0) return alert("No cards found.");
    displayCard();
  } catch (error) {
    console.error("Error fetching cards:", error);
  }
}

function buildQuery(deckName, filterType) {
  let query = `deck:"${deckName}"`;
  if (filterType === "today") query += ` is:new added:1`;
  else if (filterType === "wrongToday") query += ` rated:1:1`;
  else if (filterType === "new") query += ` is:new`
  return query;
}

// Display and manage cards with timers
async function displayCard() {
  const randomIndex = Math.floor(Math.random() * cardIDs.length);
  const cardInfo = await ankiConnect("cardsInfo", {
    cards: [cardIDs[randomIndex]],
  });
  document.getElementById("kanjiDisplay").innerHTML = filterCardHtml(
    cardInfo[0].question
  );
  startLoadingBar(timer, true);
  window.clearTimeout(cardTimeout);
  cardTimeout = setTimeout(() => displayBack(cardInfo[0]), timer);
}

function displayBack(card) {
  document.getElementById("kanjiDisplay").innerHTML = filterCardHtml(
    card.answer
  );
  startLoadingBar(timer, false);
  window.clearTimeout(cardTimeout);
  cardTimeout = setTimeout(displayCard, timer);
}

function startLoadingBar(duration, isFront) {
  const loadingBar = document.getElementById("loadingBar");
  loadingBar.style.transitionDuration = `${duration}ms`;
  loadingBar.style.backgroundColor = isFront
    ? "var(--front-bar-color)"
    : "var(--back-bar-color)";
  loadingBar.style.width = "100%";
  setTimeout(() => {
    loadingBar.style.transitionDuration = "0ms";
    loadingBar.style.width = "0";
  }, duration - 100);
}

function filterCardHtml(input) {
  const imgTagRegex = /<img[^>]*>/g;
  const audioTagRegex = /\[anki:play:a:\d+\]/g;
  return input.replace(imgTagRegex, "").replace(audioTagRegex, "");
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");
  body.classList.toggle("light-mode");
  document.getElementById("themeToggle").textContent = body.classList.contains(
    "dark-mode"
  )
    ? "☀️"
    : "🌙";
}

function setTheme() {
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  document.body.classList.toggle("dark-mode", darkModeMediaQuery.matches);
  darkModeMediaQuery.addEventListener("change", (event) => {
    document.body.classList.toggle("dark-mode", event.matches);
  });
}

window.onload(() => {
  debugger;
  loadDecks();
  setTheme();
});
