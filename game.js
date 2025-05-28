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

// Variáveis do jogo
let lives = 3;
let score = 0;
let intervalId = null;
let speed = 1212; // 3 produtos por segundo (1000ms / 3)
let natyPosition = 50; // porcentagem da posição horizontal
const moveStep = 5; // pixels para mover por clique
const productImages = [
  "produto1.webp",
  "produto2.png",
  "produto3.png",
  "produto4.webp",
  "produto5.webp",
  "produto6.png",
  "produto7.png",
  "produto8.png",
  "produto9.png",
  "produto10.png",
  "produto11.webp",
  "produto12.png",
];
let combo = 0;
let comboTimeout = null;
let powerUpActive = null;
let powerUpTimeout = null;

// Sons do jogo
const sounds = {
  collect: new Audio("assets/sounds/collect.mp3"),
  miss: new Audio("assets/sounds/miss.mp3"),
  powerUp: new Audio("assets/sounds/powerup.mp3"),
  gameOver: new Audio("assets/sounds/gameover.mp3"),
  win: new Audio("assets/sounds/win.mp3"),
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
      sounds.collect.play();
      product.remove();

      if (score >= 1000) {
        sounds.win.play();
        showWinScreen();
      }
    } else if (posY > containerHeight) {
      if (powerUpActive !== "shield") {
        lives--;
        updateLives();
        showMissEffect(product.style.left);
        sounds.miss.play();
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
  sounds.gameOver.play();
  winScreen.querySelector("h1").textContent = "GAME OVER!";
  winScreen.classList.remove("hidden");
  controls.style.display = "none";
  const products = document.querySelectorAll(".product");
  products.forEach((product) => product.remove());
}

function showCollectEffect(product, points) {
  const effect = document.createElement("div");
  effect.className = "collect-effect";
  effect.style.left = product.style.left;
  effect.style.top = product.style.top;
  effect.textContent = `+${points}`;
  gameContainer.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
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

// Inicialização do jogo
function startGame() {
  btnStart.style.display = "none";
  controls.style.display = "flex";
  score = 0;
  lives = 3;
  scoreElement.textContent = "0";
  updateLives();
  intervalId = setInterval(dropProduct, speed);
}

// Tela de vitória
function showWinScreen() {
  clearInterval(intervalId);
  winScreen.classList.remove("hidden");
  controls.style.display = "none";

  // Remove produtos restantes
  const products = document.querySelectorAll(".product");
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
      sounds.powerUp.play();
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
