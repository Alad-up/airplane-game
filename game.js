const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 在文件顶部添加图片加载代码
const playerImg = new Image();
playerImg.src = 'images/sesshomaru.png'; // 确保图片保存在正确的位置

// 添加图片加载错误处理
playerImg.onerror = () => {
    console.error('飞机图片加载失败！');
};

// 玩家飞机
const player = {
    x: canvas.width / 2 - 40,  // 调整居中位置
    y: canvas.height - 120,    // 离底部稍远一些
    width: 80,                 // 加大宽度
    height: 100,               // 加大高度以适应头像比例
    speed: 5,
    img: playerImg,
    shootCooldown: 0,  // 发射冷却计时器
    shootInterval: 500  // 发射间隔(毫秒)，500ms = 0.5秒，一秒两发
};

// 子弹数组
let bullets = [];
// 敌机数组
let enemies = [];
// 分数
let score = 0;

// 控制键盘状态
const keys = {};

// 监听键盘按下
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // 防止空格键滚动页面
    if (e.key === ' ') {
        e.preventDefault();
    }
});

// 监听键盘释放
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 在键盘控制代码后添加触摸控制
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const shootBtn = document.getElementById('shootBtn');

// 触摸控制状态
const touchControls = {
    left: false,
    right: false,
    shoot: false
};

// 添加触摸事件监听
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.left = true;
});

leftBtn.addEventListener('touchend', () => {
    touchControls.left = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.right = true;
});

rightBtn.addEventListener('touchend', () => {
    touchControls.right = false;
});

shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.shoot = true;
});

shootBtn.addEventListener('touchend', () => {
    touchControls.shoot = false;
});

// 创建子弹
function createBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y + 10,  // 从头像上方稍低位置发射
        width: 5,
        height: 10,
        speed: 7
    });
}

// 在文件顶部添加敌机图片加载代码
const enemyImages = [
    new Image(),
    new Image(),
    new Image()
];

// 设置敌机图片源
enemyImages[0].src = 'images/enemy1.png';  // 黑发女生
enemyImages[1].src = 'images/enemy2.png';  // 背影男生
enemyImages[2].src = 'images/enemy3.png';  // 戴口罩男生

// 添加图片加载错误处理
enemyImages.forEach((img, index) => {
    img.onload = () => {
        console.log(`敌机图片 ${index + 1} 加载成功！`);
    };
    img.onerror = () => {
        console.error(`敌机图片 ${index + 1} 加载失败！`);
    };
});

// 修改创建敌机函数
function createEnemy() {
    if (Math.random() < 0.08) {
        const weights = [0.3, 0.3, 0.4]; // 黑发女生30%, 背影男生30%, 口罩男生40%
        const random = Math.random();
        let selectedIndex = 0;
        let sum = 0;
        
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random < sum) {
                selectedIndex = i;
                break;
            }
        }

        // 添加调试信息
        console.log(`生成敌机类型: ${selectedIndex + 1}`);
        
        const selectedImg = enemyImages[selectedIndex];
        
        // 检查图片是否正确加载
        if (!selectedImg.complete || !selectedImg.naturalHeight) {
            console.error(`敌机图片 ${selectedIndex + 1} 未正确加载`);
        }

        enemies.push({
            x: Math.random() * (canvas.width - 50),
            y: -50,
            width: 50,
            height: 50,
            speed: 2 + Math.random(),
            img: selectedImg,
            type: selectedIndex + 1  // 添加类型标记
        });
    }
}

// 在文件顶部添加音效对象
const explosionSound = new Audio();
explosionSound.src = 'sounds/explosion.mp3';  // 爆炸音效文件
explosionSound.volume = 0.3;  // 设置音量为30%

// 在文件顶部添加不同的音效对象
const soundEffects = {
    explosion1: new Audio('sounds/explosion1.mp3'),  // 黑发女生击杀音效
    explosion2: new Audio('sounds/explosion2.mp3'),  // 背影男生击杀音效
    explosion3: new Audio('sounds/explosion3.mp3')   // 口罩男生击杀音效
};

// 设置所有音效的音量
Object.values(soundEffects).forEach(sound => {
    sound.volume = 0.3;  // 设置音量为30%
});

// 更新游戏状态
function update() {
    // 更新发射冷却时间
    if (player.shootCooldown > 0) {
        player.shootCooldown -= 16; // 假设游戏运行在60fps，每帧约16ms
    }

    // 移动玩家飞机（同时支持键盘和触摸）
    if ((keys['ArrowLeft'] || keys['a'] || keys['A'] || touchControls.left) && player.x > 0) {
        player.x -= player.speed;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D'] || touchControls.right) && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // 检查是否可以发射子弹（同时支持键盘和触摸）
    if ((keys[' '] || touchControls.shoot) && player.shootCooldown <= 0) {
        createBullet();
        player.shootCooldown = player.shootInterval; // 重置冷却时间
    }

    // 更新子弹位置
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });

    // 创建和更新敌机
    createEnemy();
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        // 检测子弹击中敌机
        let isHit = false;
        bullets = bullets.filter(bullet => {
            if (collision(bullet, enemy)) {
                score += 10;
                isHit = true;
                
                // 根据敌机类型播放对应音效
                const soundEffect = soundEffects[`explosion${enemy.type}`];
                if (soundEffect) {
                    soundEffect.currentTime = 0;  // 重置音频播放位置
                    soundEffect.play().catch(error => {
                        console.log(`音效 ${enemy.type} 播放失败:`, error);
                    });
                }
                
                return false;
            }
            return true;
        });

        if (isHit) {
            return false;
        }

        return enemy.y < canvas.height;
    });
}

// 碰撞检测
function collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制玩家飞机
    if (playerImg.complete) {
        try {
            ctx.save();
            
            // 添加圆形裁剪,使头像呈现圆形
            ctx.beginPath();
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;
            const radius = Math.min(player.width, player.height) / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
            
            // 添加发光效果
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 15;
            
            // 绘制图片
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
            
            ctx.restore();
        } catch (error) {
            console.error('绘制图片时出错：', error);
            // 使用默认样式
            ctx.fillStyle = 'blue';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    } else {
        // 使用默认样式
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // 绘制子弹
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // 绘制敌机
    enemies.forEach(enemy => {
        if (enemy.img && enemy.img.complete) {
            try {
                ctx.save();
                ctx.beginPath();
                const centerX = enemy.x + enemy.width / 2;
                const centerY = enemy.y + enemy.height / 2;
                const radius = Math.min(enemy.width, enemy.height) / 2;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.clip();
                
                ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
                
                // 添加调试信息（可选）
                // ctx.fillStyle = 'white';
                // ctx.fillText(`Type: ${enemy.type}`, enemy.x, enemy.y);
                
                ctx.restore();
            } catch (error) {
                console.error('绘制敌机图片出错：', error, '敌机类型：', enemy.type);
                ctx.fillStyle = 'green';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        } else {
            console.error('敌机图片未加载完成，类型：', enemy.type);
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // 只显示分数
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`分数: ${score}`, 10, 30);
}

// 修改游戏主循环
let gameLoopId;
function gameLoop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 修改音量控制功能
document.addEventListener('keydown', (e) => {
    // 增加音量（向上箭头）
    if (e.key === 'ArrowUp') {
        Object.values(soundEffects).forEach(sound => {
            sound.volume = Math.min(1, sound.volume + 0.1);
        });
    }
    // 减小音量（向下箭头）
    if (e.key === 'ArrowDown') {
        Object.values(soundEffects).forEach(sound => {
            sound.volume = Math.max(0, sound.volume - 0.1);
        });
    }
});

// 开始游戏
gameLoop();