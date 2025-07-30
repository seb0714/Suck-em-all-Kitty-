const container = document.getElementById("container");
const playSound = new Audio();
const eatenSound = new Audio();
const bgSound = new Audio();
const gameBg = new Image();
const playerImg = new Image();

let speed = 5;
let playerScale = 0.3;
let ENEMIES = [];
let enemyObjects = []; // stores all active enemies.
let canvas, ctx;
let points = 0;
let posX = 100;
let posY = 100;
let keys = {};

// Timer and highscore
let timer = 30; // In seconds
let startTime;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let gameOver = false;
let fadeAlpha = 0;
let fadeDirection = 1;

// Mobile touch controls
let touchX = null;
let touchY = null;
let moveTouch = false;

// Load enemy paths.
for (let i = 1; i <= 49; i++) {
    ENEMIES.push("resources/images/sanrio_characters/circle_no_resize_" + i + ".png");
}

playSound.src = "resources/sounds/click.wav";
gameBg.src = "resources/images/grass.jpg";
playerImg.src = "resources/images/playerImage.png";
eatenSound.src = "resources/sounds/satisfying_pop.wav";
bgSound.src = "resources/sounds/background.mp3";

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function play() {
    // Hide container with slide-out
    container.style.display = "none";

    playSound.play();
    bgSound.play();

    // Create canvas
    canvas = document.createElement("canvas");
    canvas.classList.add("active");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Key listeners
    window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    // Touch listeners
    canvas.addEventListener("touchstart", (e) => {
        moveTouch = true;
        const t = e.touches[0];
        touchX = t.clientX;
        touchY = t.clientY;
    });
    canvas.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        touchX = t.clientX;
        touchY = t.clientY;
    });
    canvas.addEventListener("touchend", () => moveTouch = false);

    // Spawn enemies
    spawnEnemies();

    // Reset states
    points = 0;
    posX = 100;
    posY = 100;
    startTime = Date.now();
    gameOver = false;
    fadeAlpha = 0;
    fadeDirection = 1;

    // Start loop
    requestAnimationFrame(update);
}

function spawnEnemies() {
    enemyObjects = [];
    const enemyCount = Math.floor(Math.random() * 3) + 4; // 4-6 enemies

    for (let i = 1; i < enemyCount; i++) {
        const img = new Image();
        const randomNum = Math.floor(Math.random() * ENEMIES.length);
        img.src = ENEMIES[randomNum];

        enemyObjects.push({
            img: img,
            x: 0,
            y: 0,
            widthScale: 0.6,
            heightScale: 0.6
        });

        img.onload = () => {
            const enemyWidth = img.naturalWidth * 0.3;
            const enemyHeight = img.naturalHeight * 0.3;
            enemyObjects[i].x = Math.random() * (canvas.width - enemyWidth);
            enemyObjects[i].y = Math.random() * (canvas.height - enemyHeight);
        };
    }
}

function respawnEnemy(enemy) {
    const randomNum = Math.floor(Math.random() * ENEMIES.length);
    enemy.img.src = ENEMIES[randomNum];

    enemy.img.onload = () => {
        const enemyWidth = enemy.img.naturalWidth * enemy.widthScale;
        const enemyHeight = enemy.img.naturalHeight * enemy.heightScale;
        enemy.x = Math.random() * (canvas.width - enemyWidth);
        enemy.y = Math.random() * (canvas.height - enemyHeight);
    };
}

function checkCollision(px, py, pw, ph, ex, ey, ew, eh) {
    return px < ex + ew &&
           px + pw > ex &&
           py < ey + eh &&
           py + ph > ey;
}

function playEatenSound() {
    const eatenSound = new Audio("resources/sounds/satisfying_pop.wav");
    eatenSound.play();
}

function showGameOver() {
    gameOver = true;

    // Save highscore
    if (points > highScore) {
        highScore = points;
        localStorage.setItem("highScore", highScore);
    }

    fadeAlpha = 0;
    fadeDirection = 1;

    function drawGameOver() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Black overlay
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Game over text
        ctx.font = `${Math.floor(canvas.width * 0.12)}px Poppins`;
        ctx.fillStyle = `rgba(255,0,0,${fadeAlpha})`;
        const msg = "GAME OVER";
        ctx.fillText(msg, (canvas.width - ctx.measureText(msg).width) / 2, canvas.height / 2 - 100);

        // Current score
        ctx.font = `${Math.floor(canvas.width * 0.06)}px Poppins`;
        ctx.fillStyle = `rgba(255,255,255,${fadeAlpha})`;
        const scoreText = "Score: " + points;
        ctx.fillText(scoreText, (canvas.width - ctx.measureText(scoreText).width) / 2, canvas.height / 2 + 300);

        // Highscore
        const highText = "Highscore: " + highScore;
        ctx.fillText(highText, (canvas.width - ctx.measureText(highText).width) / 2, canvas.height / 2 + 120);

        // Fade logic
        if (fadeDirection === 1) {
            fadeAlpha += 0.03;
            if (fadeAlpha >= 1) {
                fadeAlpha = 1;
                fadeDirection = 0;
                setTimeout(() => fadeDirection = -1, 1000);
            }
        } else if (fadeDirection === -1) {
            fadeAlpha -= 0.03;
            if (fadeAlpha <= 0) {
                fadeAlpha = 0;
                // Show container again with slide
                document.body.removeChild(canvas);

                container.style.display = "block";
                container.style.opacity = "0";
                container.style.transition = "transform 0.6s ease, opacity 0.6s ease";
                const dir = Math.random() < 0.5 ? "-100%" : "100%";
                container.style.transform = `translateX(${dir})`;
                setTimeout(() => {
                    container.style.opacity = "1";
                    container.style.transform = "translateX(0)";
                }, 50);
                return;
            }
        }

        requestAnimationFrame(drawGameOver);
    }

    requestAnimationFrame(drawGameOver);
}

function update() {
    if (gameOver) return;

    // Timer
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, timer - elapsed);

    if (remaining <= 0) {
        showGameOver();
        return;
    }

    // Movement (touch or keyboard)
    if (moveTouch && touchX !== null && touchY !== null) {
        if (touchY < posY) posY -= speed;
        if (touchY > posY) posY += speed;
        if (touchX < posX) posX -= speed;
        if (touchX > posX) posX += speed;
    } else {
        if (keys["w"] || keys["arrowup"]) posY -= speed;
        if (keys["s"] || keys["arrowdown"]) posY += speed;
        if (keys["a"] || keys["arrowleft"]) posX -= speed;
        if (keys["d"] || keys["arrowright"]) posX += speed;
    }

    const playerWidth = playerImg.naturalWidth * playerScale;
    const playerHeight = playerImg.naturalHeight * playerScale;

    // Clamp player
    posX = Math.max(0, Math.min(posX, canvas.width - playerWidth));
    posY = Math.max(0, Math.min(posY, canvas.height - playerHeight));

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(gameBg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, posX, posY, playerWidth, playerHeight);

    // Enemies
    enemyObjects.forEach(enemy => {
        const enemyWidth = enemy.img.naturalWidth * enemy.widthScale;
        const enemyHeight = enemy.img.naturalHeight * enemy.heightScale;

        if (checkCollision(posX, posY, playerWidth, playerHeight, enemy.x, enemy.y, enemyWidth, enemyHeight)) {
            points++;
            speed++;
            playerScale += 0.001;
            playEatenSound();
            respawnEnemy(enemy);
        }
        ctx.drawImage(enemy.img, enemy.x, enemy.y, enemyWidth, enemyHeight);
    });

    // Score
    ctx.font = `${Math.floor(canvas.width * 0.04)}px Poppins`;
    ctx.fillStyle = "Crimson";
    ctx.fillText(points, 40, 100);

    // Timer display
    ctx.font = `${Math.floor(canvas.width * 0.03)}px Poppins`;
    ctx.fillStyle = "Black";
    const text = remaining.toFixed(1);
    ctx.fillText(text, (canvas.width - ctx.measureText(text).width) / 2, 100);

    requestAnimationFrame(update);
}
