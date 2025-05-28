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
  "produto2.webp",
  "produto3.webp",
  "produto4.webp",
  "produto5.webp",
  "produto6.png",
  "produto7.png",
  "produto8.png",
  "produto9.png",
  "produto10.png",
  "produto11.webp",
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
      score += 10;
      scoreElement.textContent = score;
      showCollectEffect(product);
      product.remove();

      if (score >= 200) {
        showWinScreen();
      }
    } else if (posY > containerHeight) {
      lives--;
      updateLives();
      showMissEffect(product.style.left);
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
}

function updateLives() {
  livesElement.innerHTML = "❤️".repeat(lives);
  if (lives <= 0) {
    showGameOver();
  }
}

function showGameOver() {
  clearInterval(intervalId);
  winScreen.querySelector("h1").textContent = "GAME OVER!";
  winScreen.classList.remove("hidden");
  controls.style.display = "none";
  const products = document.querySelectorAll(".product");
  products.forEach((product) => product.remove());
}

function showCollectEffect(product) {
  const effect = document.createElement("div");
  effect.className = "collect-effect";
  effect.style.left = product.style.left;
  effect.style.top = product.style.top;
  effect.textContent = "+10";
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

// Event listeners
btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", () => {
  winScreen.classList.add("hidden");
  startGame();
});
