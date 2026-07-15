// 获取canvas和context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏变量
let score = 0;
let health = 3;
let gameTime = 60;
let gameActive = true;
let enemies = [];
let bullets = [];
let particles = [];

// 玩家对象
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    color: '#FFD700'
};

// 鼠标位置
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// 敌人类
class Enemy {
    constructor() {
        this.radius = Math.random() * 15 + 10;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height / 2 - this.radius * 2) + this.radius;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = `hsl(${Math.random() * 60 + 0}, 100%, 50%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 敌人眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 子弹类
class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * 7;
        this.vy = Math.sin(angle) * 7;
        this.radius = 5;
        this.speed = 7;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 子弹轨迹光效
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx, this.y - this.vy);
        ctx.stroke();
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }
}

// 粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.life = 30;
        this.maxLife = 30;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // 重力
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 鼠标事件监听
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// 点击事件 - 射击
canvas.addEventListener('click', () => {
    if (gameActive) {
        const bullet = new Bullet(player.x, player.y, mouseX, mouseY);
        bullets.push(bullet);
    }
});

// 绘制玩家
function drawPlayer() {
    // 计算玩家指向鼠标的角度
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle);

    // 玩家身体
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // 炮口
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(player.width / 2, -5, 15, 10);

    ctx.restore();

    // 玩家中心点
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

// 检查碰撞
function checkCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

// 创建爆炸粒子
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// 更新游戏
function update() {
    if (!gameActive) return;

    // 更新敌人
    enemies.forEach((enemy, index) => {
        enemy.update();

        // 检查子弹与敌人的碰撞
        bullets.forEach((bullet, bulletIndex) => {
            if (checkCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                // 敌人被击中
                createExplosion(enemy.x, enemy.y, enemy.color);
                enemies.splice(index, 1);
                bullets.splice(bulletIndex, 1);
                score += 10;
                updateScore();

                // 每击中5个敌人生成新敌人
                if (enemies.length === 0) {
                    for (let i = 0; i < 3; i++) {
                        enemies.push(new Enemy());
                    }
                }
            }
        });

        // 检查敌人与玩家的碰撞
        if (checkCollision(enemy.x, enemy.y, enemy.radius, player.x, player.y, player.width / 2)) {
            createExplosion(player.x, player.y, '#FF6347');
            health--;
            enemies.splice(index, 1);
            updateHealth();

            if (health <= 0) {
                endGame();
            }
        }
    });

    // 更新子弹
    bullets.forEach((bullet, index) => {
        bullet.update();
        if (bullet.isOutOfBounds()) {
            bullets.splice(index, 1);
        }
    });

    // 更新粒子
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// 绘制游戏
function draw() {
    // 清空canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制玩家
    drawPlayer();

    // 绘制敌人
    enemies.forEach(enemy => enemy.draw());

    // 绘制子弹
    bullets.forEach(bullet => bullet.draw());

    // 绘制粒子
    particles.forEach(particle => particle.draw());

    // 绘制瞄准准心
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 更新生命显示
function updateHealth() {
    document.getElementById('health').textContent = health;
}

// 更新时间显示
function updateTime() {
    document.getElementById('time').textContent = gameTime;
}

// 游戏结束
function endGame() {
    gameActive = false;
    const gameOverDiv = document.getElementById('gameOver');
    const title = document.getElementById('gameOverTitle');
    const finalScore = document.getElementById('finalScore');

    if (health <= 0) {
        title.textContent = '💔 游戏结束';
        title.style.color = '#ff6b6b';
    } else if (gameTime <= 0) {
        title.textContent = '⏰ 时间到了';
        title.style.color = '#FFD700';
    } else {
        title.textContent = '🎉 胜利';
        title.style.color = '#90EE90';
    }

    finalScore.textContent = score;
    gameOverDiv.style.display = 'block';
}

// 游戏时间倒计时
setInterval(() => {
    if (gameActive && gameTime > 0) {
        gameTime--;
        updateTime();

        if (gameTime <= 0) {
            endGame();
        }
    }
}, 1000);

// 初始化敌人
for (let i = 0; i < 3; i++) {
    enemies.push(new Enemy());
}

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 启动游戏
gameLoop();