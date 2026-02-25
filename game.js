const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const LANE_COUNT = 4;
const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;

let audioCtx = null;
let musicInterval = null;
let isMuted = false;
let beatIndex = 0;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNote(frequency, duration, type = 'square', volume = 0.1, delay = 0) {
    if (!audioCtx || isMuted) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);
    
    oscillator.start(audioCtx.currentTime + delay);
    oscillator.stop(audioCtx.currentTime + delay + duration);
}

function playDrum(type, volume = 0.15) {
    if (!audioCtx || isMuted) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'kick') {
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'snare') {
        const noise = audioCtx.createBufferSource();
        const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const noiseGain = audioCtx.createGain();
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseGain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        noise.start(audioCtx.currentTime);
        noise.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hihat') {
        const noise = audioCtx.createBufferSource();
        const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const noiseGain = audioCtx.createGain();
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 5000;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseGain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        
        noise.start(audioCtx.currentTime);
        noise.stop(audioCtx.currentTime + 0.05);
    }
}

const melodyPatterns = [
    [523, 587, 659, 698, 784, 698, 659, 587],
    [659, 523, 587, 659, 698, 784, 880, 784],
    [784, 698, 659, 587, 523, 587, 659, 698],
    [880, 784, 698, 659, 587, 659, 698, 784],
];

const bassPatterns = [
    [131, 165, 196, 165],
    [147, 175, 196, 175],
    [131, 147, 165, 147],
    [110, 131, 147, 131],
];

const chordPatterns = [
    [262, 330, 392],
    [294, 370, 440],
    [330, 392, 494],
    [262, 330, 392],
];

let currentPattern = 0;

function playBackgroundMusic() {
    if (musicInterval) clearInterval(musicInterval);
    
    beatIndex = 0;
    currentPattern = 0;
    const tempo = 150;
    const beatDuration = 60 / tempo;
    
    musicInterval = setInterval(() => {
        if (!isGameRunning || isMuted) return;
        
        const beatInBar = beatIndex % 8;
        const barNumber = Math.floor(beatIndex / 8) % 4;
        
        if (beatInBar === 0) {
            currentPattern = (currentPattern + 1) % melodyPatterns.length;
        }
        
        if (beatIndex % 4 === 0) {
            playDrum('kick', 0.2);
        }
        if (beatIndex % 4 === 2) {
            playDrum('snare', 0.15);
        }
        playDrum('hihat', 0.1);
        
        const melodyNote = melodyPatterns[currentPattern][beatInBar];
        playNote(melodyNote, beatDuration * 0.8, 'square', 0.08);
        
        if (beatInBar % 2 === 0) {
            const bassNote = bassPatterns[currentPattern][Math.floor(beatInBar / 2)];
            playNote(bassNote, beatDuration * 1.5, 'triangle', 0.12);
        }
        
        if (beatInBar === 0 || beatInBar === 4) {
            chordPatterns[currentPattern].forEach((note, i) => {
                playNote(note, beatDuration * 3, 'sine', 0.04, i * 0.01);
            });
        }
        
        if (beatInBar === 2 || beatInBar === 6) {
            playNote(melodyNote * 2, beatDuration * 0.3, 'square', 0.03);
        }
        
        beatIndex++;
    }, beatDuration * 1000);
}

function stopBackgroundMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

function playCollisionSound() {
    if (!audioCtx || isMuted) return;
    
    playDrum('kick', 0.3);
    playNote(100, 0.2, 'sawtooth', 0.2);
    playNote(80, 0.3, 'sawtooth', 0.15);
}

function playGameOverSound() {
    if (!audioCtx || isMuted) return;
    
    const notes = [392, 349, 330, 294, 262, 220];
    notes.forEach((note, i) => {
        setTimeout(() => {
            playNote(note, 0.4, 'square', 0.1);
            playNote(note / 2, 0.4, 'triangle', 0.08);
        }, i * 150);
    });
}

const car = {
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 140,
    width: 50,
    height: 80,
    speed: 7,
    color: '#ff4444'
};

let obstacles = [];
let roadLines = [];
let score = 0;
let lives = 3;
let gameSpeed = 1;
let baseGameSpeed = 3;
let isGameRunning = false;
let animationId;
let lastObstacleTime = 0;
let obstacleInterval = 1500;

let currentLevel = 1;
let levelTimer = 60;
let lastTimerUpdate = 0;
const MAX_LEVEL = 10;

const levelSettings = [
    { obstacleInterval: 1200, baseSpeed: 3.0, maxObstacles: 4, hint: '热身阶段，慢慢适应' },
    { obstacleInterval: 1000, baseSpeed: 3.3, maxObstacles: 5, hint: '障碍物开始增多' },
    { obstacleInterval: 850, baseSpeed: 3.6, maxObstacles: 5, hint: '速度逐渐提升' },
    { obstacleInterval: 700, baseSpeed: 4.0, maxObstacles: 6, hint: '中等难度开始' },
    { obstacleInterval: 600, baseSpeed: 4.3, maxObstacles: 7, hint: '障碍物更加密集' },
    { obstacleInterval: 500, baseSpeed: 4.7, maxObstacles: 8, hint: '速度明显加快' },
    { obstacleInterval: 420, baseSpeed: 5.0, maxObstacles: 9, hint: '困难模式！' },
    { obstacleInterval: 350, baseSpeed: 5.4, maxObstacles: 10, hint: '极限挑战！' },
    { obstacleInterval: 300, baseSpeed: 5.8, maxObstacles: 11, hint: '接近终点！' },
    { obstacleInterval: 250, baseSpeed: 6.2, maxObstacles: 12, hint: '最终关卡！坚持住！' }
];

const obstacleTypes = [
    { type: 'pedestrian', width: 30, height: 40, colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'], emoji: '🚶' },
    { type: 'animal', width: 35, height: 30, colors: ['#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'], emoji: '🐕' },
    { type: 'barrier', width: 70, height: 25, colors: ['#ff4757', '#2ed573', '#ffa502', '#ff6b81', '#7bed9f'], emoji: '🚧' },
    { type: 'cone', width: 25, height: 35, colors: ['#ff7f50', '#ff4757', '#ffa502', '#ff6348', '#eccc68'], emoji: '🔶' },
    { type: 'rock', width: 50, height: 45, colors: ['#778899', '#636e72', '#2d3436', '#6c5ce7', '#a29bfe'], emoji: '🪨' },
    { type: 'bird', width: 35, height: 30, colors: ['#ffd700', '#ff6b6b', '#00cec9', '#fd79a8', '#a29bfe'], emoji: '🦅' },
    { type: 'box', width: 45, height: 45, colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'], emoji: '📦' },
    { type: 'oil', width: 55, height: 25, colors: ['#2c3e50', '#34495e', '#1a1a2e', '#16213e', '#0f3460'], emoji: '🛢️' },
    { type: 'car', width: 45, height: 70, colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'], emoji: '🚗' },
    { type: 'truck', width: 55, height: 80, colors: ['#e74c3c', '#3498db', '#1abc9c', '#e67e22', '#8e44ad'], emoji: '🚛' }
];

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

for (let i = 0; i < 12; i++) {
    roadLines.push({
        y: i * 70,
        x: CANVAS_WIDTH / 2 - 3
    });
}

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

const touchUp = document.getElementById('touch-up');
const touchDown = document.getElementById('touch-down');
const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');

if (touchUp) {
    touchUp.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowUp = true; touchUp.classList.add('active'); });
    touchUp.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowUp = false; touchUp.classList.remove('active'); });
}
if (touchDown) {
    touchDown.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowDown = true; touchDown.classList.add('active'); });
    touchDown.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowDown = false; touchDown.classList.remove('active'); });
}
if (touchLeft) {
    touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; touchLeft.classList.add('active'); });
    touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; touchLeft.classList.remove('active'); });
}
if (touchRight) {
    touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; touchRight.classList.add('active'); });
    touchRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; touchRight.classList.remove('active'); });
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('victory-restart-btn').addEventListener('click', startGame);

document.getElementById('mute-btn').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🔊';
});

let selectedStartLevel = 1;

document.querySelectorAll('.level-item.selectable').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.level-item.selectable').forEach(el => {
            el.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedStartLevel = parseInt(this.dataset.level);
        document.getElementById('selected-level-text').textContent = '第' + selectedStartLevel + '关';
    });
});

document.querySelector('.level-item.selectable[data-level="1"]').classList.add('selected');

function startGame() {
    initAudio();
    document.getElementById('start-screen-full').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('level-up-screen').classList.add('hidden');
    
    car.x = CANVAS_WIDTH / 2 - car.width / 2;
    car.y = CANVAS_HEIGHT - 140;
    obstacles = [];
    score = 0;
    lives = 3;
    gameSpeed = 1;
    currentLevel = selectedStartLevel;
    levelTimer = 60;
    lastTimerUpdate = 0;
    
    applyLevelSettings();
    
    updateUI();
    isGameRunning = true;
    playBackgroundMusic();
    gameLoop();
}

function applyLevelSettings() {
    const settings = levelSettings[currentLevel - 1];
    obstacleInterval = settings.obstacleInterval;
    baseGameSpeed = settings.baseSpeed;
}

function gameLoop(timestamp = 0) {
    if (!isGameRunning) return;
    
    update(timestamp);
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    if (keys.ArrowLeft && car.x > 10) {
        car.x -= car.speed;
    }
    if (keys.ArrowRight && car.x < CANVAS_WIDTH - car.width - 10) {
        car.x += car.speed;
    }
    if (keys.ArrowUp) {
        gameSpeed = Math.min(gameSpeed + 0.02, 3);
    }
    if (keys.ArrowDown) {
        gameSpeed = Math.max(gameSpeed - 0.02, 0.5);
    }
    
    if (lastTimerUpdate === 0) {
        lastTimerUpdate = timestamp;
    }
    
    if (timestamp - lastTimerUpdate >= 1000) {
        levelTimer--;
        lastTimerUpdate = timestamp;
        
        if (levelTimer <= 0) {
            levelUp();
        }
        
        updateUI();
    }
    
    roadLines.forEach(line => {
        line.y += baseGameSpeed * gameSpeed;
        if (line.y > CANVAS_HEIGHT) {
            line.y = -20;
        }
    });
    
    const settings = levelSettings[currentLevel - 1];
    if (timestamp - lastObstacleTime > obstacleInterval / gameSpeed) {
        const maxObs = settings.maxObstacles || 5;
        const obstaclesToCreate = Math.min(
            Math.floor(Math.random() * 2) + 1,
            maxObs - obstacles.length
        );
        for (let i = 0; i < obstaclesToCreate; i++) {
            createObstacle();
        }
        lastObstacleTime = timestamp;
    }
    
    obstacles.forEach((obstacle, index) => {
        obstacle.y += (baseGameSpeed + obstacle.speed) * gameSpeed;
        
        if (obstacle.y > CANVAS_HEIGHT) {
            obstacles.splice(index, 1);
            score += 10 * currentLevel;
            updateUI();
        }
    });
    
    checkCollisions();
}

function levelUp() {
    if (currentLevel >= MAX_LEVEL) {
        victory();
        return;
    }
    
    currentLevel++;
    levelTimer = 60;
    applyLevelSettings();
    
    const settings = levelSettings[currentLevel - 1];
    document.getElementById('new-level').textContent = currentLevel;
    document.getElementById('level-hint').textContent = settings.hint;
    document.getElementById('level-up-screen').classList.remove('hidden');
    
    playLevelUpSound();
    
    isGameRunning = false;
    setTimeout(() => {
        document.getElementById('level-up-screen').classList.add('hidden');
        isGameRunning = true;
        lastTimerUpdate = 0;
        gameLoop();
    }, 2000);
}

function playLevelUpSound() {
    if (!audioCtx || isMuted) return;
    
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
        setTimeout(() => {
            playNote(note, 0.2, 'square', 0.1);
            playNote(note / 2, 0.2, 'triangle', 0.08);
        }, i * 100);
    });
}

function victory() {
    isGameRunning = false;
    stopBackgroundMusic();
    
    document.getElementById('victory-score').textContent = score;
    document.getElementById('victory-screen').classList.remove('hidden');
    
    playVictorySound();
}

function playVictorySound() {
    if (!audioCtx || isMuted) return;
    
    const melody = [523, 659, 784, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((note, i) => {
        setTimeout(() => {
            playNote(note, 0.3, 'square', 0.1);
            playNote(note / 2, 0.3, 'triangle', 0.06);
        }, i * 120);
    });
}

let lastZone = -1;

function createObstacle() {
    const typeIndex = Math.floor(Math.random() * obstacleTypes.length);
    const obstacleType = obstacleTypes[typeIndex];
    
    const roadWidth = CANVAS_WIDTH - 30;
    const zoneCount = 5;
    const zoneWidth = roadWidth / zoneCount;
    
    let zone;
    do {
        zone = Math.floor(Math.random() * zoneCount);
    } while (zone === lastZone && Math.random() > 0.3);
    lastZone = zone;
    
    const zoneStart = 15 + zone * zoneWidth;
    const zoneEnd = zoneStart + zoneWidth - obstacleType.width;
    const x = zoneStart + Math.random() * Math.max(0, zoneEnd - zoneStart);
    
    const colorIndex = Math.floor(Math.random() * obstacleType.colors.length);
    
    obstacles.push({
        x: x,
        y: -obstacleType.height,
        width: obstacleType.width,
        height: obstacleType.height,
        type: obstacleType.type,
        color: obstacleType.colors[colorIndex],
        emoji: obstacleType.emoji,
        speed: Math.random() * 3 + currentLevel * 0.3
    });
}

function checkCollisions() {
    const carHitbox = {
        x: car.x + 5,
        y: car.y + 5,
        width: car.width - 10,
        height: car.height - 10
    };
    
    obstacles.forEach((obstacle, index) => {
        if (rectCollision(carHitbox, obstacle)) {
            obstacles.splice(index, 1);
            lives--;
            playCollisionSound();
            updateUI();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function draw() {
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#636e72';
    ctx.fillRect(0, 0, 10, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#dfe6e9';
    roadLines.forEach(line => {
        ctx.fillRect(line.x, line.y, 6, 40);
    });
    
    drawCar();
    
    obstacles.forEach(obstacle => {
        drawObstacle(obstacle);
    });
}

function drawCar() {
    const x = car.x;
    const y = car.y;
    const w = car.width;
    const h = car.height;
    
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#ff4757');
    gradient.addColorStop(0.5, '#ff6b81');
    gradient.addColorStop(1, '#ee5a24');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h);
    ctx.lineTo(x + 5, y + h - 20);
    ctx.lineTo(x + 8, y + 25);
    ctx.lineTo(x + 12, y + 15);
    ctx.lineTo(x + w/2, y + 5);
    ctx.lineTo(x + w - 12, y + 15);
    ctx.lineTo(x + w - 8, y + 25);
    ctx.lineTo(x + w - 5, y + h - 20);
    ctx.lineTo(x + w - 5, y + h);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 18);
    ctx.lineTo(x + w/2, y + 10);
    ctx.lineTo(x + w - 15, y + 18);
    ctx.lineTo(x + w - 18, y + 35);
    ctx.lineTo(x + 18, y + 35);
    ctx.closePath();
    ctx.fill();
    
    const windowGradient = ctx.createLinearGradient(x + 15, y + 18, x + w - 15, y + 35);
    windowGradient.addColorStop(0, '#74b9ff');
    windowGradient.addColorStop(0.5, '#0984e3');
    windowGradient.addColorStop(1, '#74b9ff');
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.moveTo(x + 17, y + 20);
    ctx.lineTo(x + w/2, y + 12);
    ctx.lineTo(x + w - 17, y + 20);
    ctx.lineTo(x + w - 20, y + 33);
    ctx.lineTo(x + 20, y + 33);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(x + 8, y + h - 5, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 8, y + h - 5, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 38, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 10, y + 38, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + h - 8, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 3, y + h - 8, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#636e72';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + h - 8, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 3, y + h - 8, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h - 8);
    ctx.lineTo(x + 3, y + h - 16);
    ctx.moveTo(x + w - 3, y + h - 8);
    ctx.lineTo(x + w - 3, y + h - 16);
    ctx.stroke();
    
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h - 25);
    ctx.lineTo(x + 6, y + h - 30);
    ctx.lineTo(x + 6, y + h - 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 2, y + h - 25);
    ctx.lineTo(x + w - 6, y + h - 30);
    ctx.lineTo(x + w - 6, y + h - 20);
    ctx.closePath();
    ctx.fill();
}

function drawObstacle(obstacle) {
    ctx.save();
    
    ctx.shadowColor = obstacle.color;
    ctx.shadowBlur = 10;
    
    const gradient = ctx.createRadialGradient(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2,
        0,
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2,
        Math.max(obstacle.width, obstacle.height) / 2
    );
    gradient.addColorStop(0, obstacle.color);
    gradient.addColorStop(1, shadeColor(obstacle.color, -30));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(obstacle.x - 2, obstacle.y - 2, obstacle.width + 4, obstacle.height + 4, 5);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.font = `bold ${Math.min(obstacle.width, obstacle.height)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obstacle.emoji, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    
    ctx.restore();
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

function updateUI() {
    document.getElementById('level-value').textContent = currentLevel;
    document.getElementById('timer-value').textContent = levelTimer;
    document.getElementById('score-value').textContent = score;
    document.getElementById('speed-value').textContent = gameSpeed.toFixed(1);
    
    let heartsHTML = '';
    for (let i = 0; i < lives; i++) {
        heartsHTML += '❤️';
    }
    document.getElementById('lives-value').textContent = heartsHTML || '💔';
}

function gameOver() {
    isGameRunning = false;
    stopBackgroundMusic();
    playGameOverSound();
    cancelAnimationFrame(animationId);
    
    document.getElementById('final-level').textContent = currentLevel;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

draw();
