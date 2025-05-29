// Elementos do DOM
const gameContainer = document.getElementById("game-container");
const naty = document.getElementById("naty");
const btnStart = document.getElementById("btnStart");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const controls = document.getElementById("controls");
const scoreElement = document.getElementById("score");
const winScreen = document.getElementById("win-screen");
const btnRestart = document.getElementById("btnRestart");

// Sistema de Coleção
const btnCollection = document.getElementById("btnCollection");
const collectionScreen = document.getElementById("collection-screen");
const btnCloseCollection = document.getElementById("btnCloseCollection");
const collectionItems = document.getElementById("collection-items");
const rewardMessage = document.getElementById("reward-message");

// Variáveis do jogo
let lives = 3;
let score = 0;
let intervalId = null;
let speed = 1212; // 3 produtos por segundo (1000ms / 3)
let natyPosition = 50; // porcentagem da posição horizontal
const moveStep = 5; // pixels para mover por clique
let currentLevel = 1;
let productsCollectedInLevel = 0;

// Configurações dos níveis
const levelConfig = {
  1: { speed: 1500, productInterval: 2000, name: "Fácil" },
  2: { speed: 1212, productInterval: 1500, name: "Médio" },
  3: { speed: 800, productInterval: 1000, name: "Difícil" },
};

const productImages = [
  "produto1.webp",
  "produto2.webp",
  "produto3.webp",
  "produto4.webp",
  "produto5.webp",
  "produto6.webp",
  "produto7.webp",
  "produto8.webp",
  "produto9.webp",
  "produto10.webp",
  "produto11.webp",
  "produto12.webp",
];
let combo = 0;
let comboTimeout = null;
let powerUpActive = null;
let powerUpTimeout = null;

// Sistema de áudio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioInitialized = false;

const sounds = {
  collect: { url: "assets/sounds/collect.mp3", buffer: null },
  miss: { url: "assets/sounds/miss.mp3", buffer: null },
  powerUp: { url: "assets/sounds/powerup.mp3", buffer: null },
  gameOver: { url: "assets/sounds/gameover.mp3", buffer: null },
  win: { url: "assets/sounds/win.mp3", buffer: null },
};

// Tipos de power-ups
const powerUps = [
  {
    type: "magnet",
    icon: "🧲",
    duration: 5000,
    effect: () => {
      naty.classList.add("magnet-active");
      attractProducts();
    },
    end: () => {
      naty.classList.remove("magnet-active");
    },
  },
  {
    type: "shield",
    icon: "🛡️",
    duration: 7000,
    effect: () => {
      naty.classList.add("shield-active");
    },
    end: () => {
      naty.classList.remove("shield-active");
    },
  },
  {
    type: "double",
    icon: "2️⃣",
    duration: 10000,
    effect: () => {
      naty.classList.add("double-active");
    },
    end: () => {
      naty.classList.remove("double-active");
    },
  },
];

// Adicionar elemento de vidas ao DOM
const livesElement = document.createElement("div");
livesElement.id = "lives";
livesElement.innerHTML = "❤️".repeat(lives);
gameContainer.appendChild(livesElement);

// Lista de produtos disponíveis para coleção
const collectionProducts = [
  { id: "produto1", name: "Manteiga", image: "produto1.webp" },
  { id: "produto2", name: "L. Desnatado", image: "produto2.webp" },
  { id: "produto3", name: "L. Integral", image: "produto3.webp" },
  { id: "produto4", name: "Rq.Cremoso", image: "produto4.webp" },
  { id: "produto5", name: "Choconat", image: "produto5.webp" },
  { id: "produto6", name: "B. Graviola", image: "produto6.webp" },
  { id: "produto7", name: "Creme de Leite", image: "produto7.webp" },
  { id: "produto8", name: "Rq C. Salsa", image: "produto8.webp" },
  { id: "produto9", name: "L. Zero Lac", image: "produto9.webp" },
  { id: "produto10", name: "B. Morango", image: "produto10.webp" },
  { id: "produto11", name: "Rq. Light", image: "produto11.webp" },
  { id: "produto12", name: "Condensado", image: "produto12.webp" },
];

// Funções auxiliares
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomProduct() {
  return productImages[randomInt(0, productImages.length - 1)];
}

// Movimento da Naty
function moveNaty(direction) {
  const containerWidth = gameContainer.clientWidth;
  const natyWidth = naty.offsetWidth;
  const maxPosition = 100 - (natyWidth / containerWidth) * 100;

  natyPosition += direction * moveStep;
  natyPosition = Math.max(0, Math.min(maxPosition, natyPosition));

  naty.style.left = `${natyPosition}%`;
}

// Controles de movimento
btnLeft.addEventListener("mousedown", () => moveNaty(-1));
btnRight.addEventListener("mousedown", () => moveNaty(1));

// Controles touch para mobile
btnLeft.addEventListener("touchstart", (e) => {
  e.preventDefault();
  moveNaty(-1);
});

btnRight.addEventListener("touchstart", (e) => {
  e.preventDefault();
  moveNaty(1);
});

// Verificação de colisão
function checkCollision(product) {
  const natyRect = naty.getBoundingClientRect();
  const productRect = product.getBoundingClientRect();

  if (intervalId === null) return false; // Não detecta colisão se o jogo estiver parado

  return !(
    natyRect.right < productRect.left ||
    natyRect.left > productRect.right ||
    natyRect.bottom < productRect.top ||
    natyRect.top > productRect.bottom
  );
}

// Criação e animação dos produtos
function createProduct() {
  const product = document.createElement("img");
  product.src = `assets/${getRandomProduct()}`;
  product.classList.add("product");

  const containerWidth = gameContainer.clientWidth;
  const randomX = randomInt(0, containerWidth - 50);

  product.style.left = `${randomX}px`;
  product.style.top = "-50px";

  gameContainer.appendChild(product);
  return product;
}

async function initAudio() {
  if (audioInitialized) return;

  try {
    await audioContext.resume();

    const loadSound = async (soundName) => {
      try {
        const response = await fetch(sounds[soundName].url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sounds[soundName].buffer = audioBuffer;
      } catch (error) {
        console.log(`Erro ao carregar som ${soundName}:`, error);
      }
    };

    // Carrega todos os sons
    await Promise.all(Object.keys(sounds).map(loadSound));
    audioInitialized = true;
  } catch (error) {
    console.log("Erro ao inicializar áudio:", error);
  }
}

function playSound(soundName) {
  if (!audioInitialized || !sounds[soundName].buffer) return;

  try {
    const source = audioContext.createBufferSource();
    source.buffer = sounds[soundName].buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (error) {
    console.log(`Erro ao tocar som ${soundName}:`, error);
  }
}

function animateProduct(product) {
  let posY = -50;
  const containerHeight = gameContainer.clientHeight;
  let rotationAngle = 0;

  function animate() {
    if (!product.isConnected) return;

    posY += 5;
    rotationAngle += 2;
    product.style.top = `${posY}px`;
    product.style.transform = `rotate(${rotationAngle}deg)`;

    if (checkCollision(product)) {
      const points = powerUpActive === "double" ? 20 : 10;
      score += points * (combo || 1);
      scoreElement.textContent = score;
      updateCombo();
      showComboEffect();
      showCollectEffect(product, points);
      playSound("collect");
      product.remove();

      if (score >= 1000) {
        playSound("win");
        showWinScreen();
      }
    } else if (posY > containerHeight) {
      if (powerUpActive !== "shield") {
        lives--;
        updateLives();
        showMissEffect(product.style.left);
        playSound("miss");
        combo = 0;
      }
      product.remove();
    } else {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function dropProduct() {
  const product = createProduct();
  animateProduct(product);
  createPowerUp();
}

function updateLives() {
  livesElement.innerHTML = "❤️".repeat(lives);
  if (lives <= 0) {
    showGameOver();
  }
}

function showGameOver() {
  clearInterval(intervalId);
  intervalId = null;
  playSound("gameOver");
  winScreen.querySelector("h1").textContent = "GAME OVER!";
  winScreen.classList.remove("hidden");
  controls.style.display = "none";

  // Remove produtos restantes e para todas as animações
  const products = document.querySelectorAll(".product, .power-up");
  products.forEach((product) => product.remove());
}

function showCollectEffect(product, points) {
  const effect = document.createElement("div");
  effect.className = "collect-effect";

  // Efeito especial baseado nos pontos
  if (combo >= 3) {
    effect.innerHTML = `
      <div class="points">+${points}</div>
      <div class="stars">✨✨✨</div>
    `;
  } else {
    effect.textContent = `+${points}`;
  }

  effect.style.left = product.style.left;
  effect.style.top = product.style.top;
  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);

  checkLevelProgress();
}

function showMissEffect(position) {
  const effect = document.createElement("div");
  effect.className = "miss-effect";
  effect.style.left = position;
  effect.style.bottom = "0";
  effect.textContent = "-❤️";
  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
}

// Funções do sistema de coleção
function loadCollection() {
  const collection = JSON.parse(localStorage.getItem("natyCollection")) || [];
  return collection;
}

function saveCollection(collection) {
  localStorage.setItem("natyCollection", JSON.stringify(collection));
}

function addToCollection(productId) {
  const collection = loadCollection();
  if (!collection.includes(productId)) {
    collection.push(productId);
    saveCollection(collection);
  }
}

function getRandomUnownedProduct() {
  const collection = loadCollection();
  const unownedProducts = collectionProducts.filter(
    (product) => !collection.includes(product.id)
  );

  if (unownedProducts.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * unownedProducts.length);
  return unownedProducts[randomIndex];
}

function updateCollectionDisplay() {
  const collection = loadCollection();
  collectionItems.innerHTML = "";

  collectionProducts.forEach((product) => {
    const isOwned = collection.includes(product.id);
    const itemElement = document.createElement("div");
    itemElement.className = "collection-item";

    if (isOwned) {
      itemElement.innerHTML = `
        <img src="assets/${product.image}" alt="${product.name}">
        <div class="item-name">${product.name}</div>
      `;
    } else {
      itemElement.innerHTML = `
        <img src="assets/closed.webp" alt="Bloqueado">
        <div class="item-name">???</div>
      `;
    }

    collectionItems.appendChild(itemElement);
  });
}

// Função para mostrar o nível atual
function showLevelMessage() {
  const levelMsg = document.createElement("div");
  levelMsg.className = "level-message";
  levelMsg.textContent = `Nível ${currentLevel}: ${levelConfig[currentLevel].name}`;
  gameContainer.appendChild(levelMsg);
  setTimeout(() => levelMsg.remove(), 2000);
}

// Função para verificar progresso do nível
function checkLevelProgress() {
  productsCollectedInLevel++;
  if (productsCollectedInLevel >= 10) {
    if (currentLevel < 3) {
      currentLevel++;
      productsCollectedInLevel = 0;
      showLevelMessage();
      updateGameSpeed();
      showLevelUpEffect();
    }
  }
}

// Função para atualizar velocidade do jogo
function updateGameSpeed() {
  speed = levelConfig[currentLevel].speed;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = setInterval(
      dropProduct,
      levelConfig[currentLevel].productInterval
    );
  }
}

// Efeito de subida de nível
function showLevelUpEffect() {
  const effect = document.createElement("div");
  effect.className = "level-up-effect";
  effect.innerHTML = `
    <div class="stars">⭐⭐⭐</div>
    <div>NÍVEL ${currentLevel}!</div>
    <div class="subtitle">Você está ficando melhor!</div>
  `;
  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 3000);
}

// Inicialização do jogo
function startGame() {
  // Inicia o jogo imediatamente
  startGameLogic();

  // Carrega o áudio em background se ainda não foi inicializado
  if (!audioInitialized) {
    initAudio().catch((error) => {
      console.log("Erro ao carregar áudio:", error);
    });
  }
}

function startGameLogic() {
  // Limpa qualquer intervalo existente
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Remove produtos restantes da partida anterior
  const products = document.querySelectorAll(".product, .power-up");
  products.forEach((product) => product.remove());

  // Reseta o estado do jogo
  btnStart.style.display = "none";
  controls.style.display = "flex";
  winScreen.classList.add("hidden");
  rewardMessage.classList.add("hidden");
  score = 0;
  lives = 3;
  combo = 0;
  scoreElement.textContent = "0";
  updateLives();

  // Inicia a queda de produtos
  currentLevel = 1;
  productsCollectedInLevel = 0;
  showLevelMessage();
  intervalId = setInterval(
    dropProduct,
    levelConfig[currentLevel].productInterval
  );
}

// Tela de vitória
function showWinScreen() {
  clearInterval(intervalId);
  intervalId = null;
  playSound("win");

  if (score >= 1000) {
    const reward = getRandomUnownedProduct();
    if (reward) {
      addToCollection(reward.id);
      rewardMessage.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <img src="assets/${reward.image}" alt="${reward.name}" class="w-24 h-24 object-contain">
          <div>Você ganhou um item novo: <span class="text-yellow-500">${reward.name}</span> ! Abra sua coleção no menu lateral!</div>
        </div>
      `;
      rewardMessage.classList.remove("hidden");
    } else {
      rewardMessage.textContent = "Você já possui todos os itens da coleção!";
      rewardMessage.classList.remove("hidden");
    }
  }

  winScreen.classList.remove("hidden");
  controls.style.display = "none";

  // Remove produtos restantes e para todas as animações
  const products = document.querySelectorAll(".product, .power-up");
  products.forEach((product) => product.remove());
}

function createPowerUp() {
  if (Math.random() < 0.1) {
    // 10% de chance
    const powerUp = document.createElement("div");
    const randomPowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];

    powerUp.className = "power-up";
    powerUp.textContent = randomPowerUp.icon;
    powerUp.dataset.type = randomPowerUp.type;

    const containerWidth = gameContainer.clientWidth;
    const randomX = randomInt(0, containerWidth - 50);

    powerUp.style.left = `${randomX}px`;
    powerUp.style.top = "-50px";

    gameContainer.appendChild(powerUp);
    animatePowerUp(powerUp, randomPowerUp);
  }
}

function animatePowerUp(powerUp, powerUpData) {
  let posY = -50;
  const containerHeight = gameContainer.clientHeight;

  function animate() {
    if (!powerUp.isConnected) return;

    posY += 3;
    powerUp.style.top = `${posY}px`;

    if (checkCollision(powerUp, naty)) {
      activatePowerUp(powerUpData);
      powerUp.remove();
      playSound("powerUp");
    } else if (posY > containerHeight) {
      powerUp.remove();
    } else {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function activatePowerUp(powerUpData) {
  if (powerUpActive) {
    clearTimeout(powerUpTimeout);
    powerUps.find((p) => p.type === powerUpActive).end();
  }

  powerUpActive = powerUpData.type;
  powerUpData.effect();

  showPowerUpEffect(powerUpData.icon);
  playSound("powerUp");

  powerUpTimeout = setTimeout(() => {
    powerUpData.end();
    powerUpActive = null;
  }, powerUpData.duration);
}

function showPowerUpEffect(icon) {
  const effect = document.createElement("div");
  effect.className = "power-up-effect";
  effect.textContent = `${icon} ATIVADO!`;
  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 2000);
}

function attractProducts() {
  const products = document.querySelectorAll(".product");
  const natyRect = naty.getBoundingClientRect();
  const natyCenter = {
    x: natyRect.left + natyRect.width / 2,
    y: natyRect.bottom,
  };

  products.forEach((product) => {
    const productRect = product.getBoundingClientRect();
    const productCenter = {
      x: productRect.left + productRect.width / 2,
      y: productRect.top + productRect.height / 2,
    };

    const angle = Math.atan2(
      natyCenter.y - productCenter.y,
      natyCenter.x - productCenter.x
    );
    const distance = Math.hypot(
      natyCenter.x - productCenter.x,
      natyCenter.y - productCenter.y
    );

    if (distance < 200) {
      const speed = (200 - distance) / 20;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      product.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  });
}

function updateCombo() {
  combo++;
  if (comboTimeout) clearTimeout(comboTimeout);

  comboTimeout = setTimeout(() => {
    combo = 0;
  }, 2000);
}

function showComboEffect() {
  if (combo > 1) {
    const effect = document.createElement("div");
    effect.className = "combo-effect";
    effect.textContent = `COMBO x${combo}!`;
    gameContainer.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
  }
}

// Event listeners
btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", () => {
  winScreen.classList.add("hidden");
  startGame();
});

// Event listeners para o sistema de coleção
btnCollection.addEventListener("click", () => {
  updateCollectionDisplay();
  collectionScreen.classList.remove("hidden");
});

btnCloseCollection.addEventListener("click", () => {
  collectionScreen.classList.add("hidden");
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa a coleção se necessário
  if (!localStorage.getItem("natyCollection")) {
    saveCollection([]);
  }

  // Pré-carrega o áudio em background quando a página carrega
  initAudio().catch((error) => {
    console.log("Erro ao carregar áudio:", error);
  });
});
