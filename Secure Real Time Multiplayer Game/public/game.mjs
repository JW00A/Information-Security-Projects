import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let localPlayer;
const otherPlayers = {};
const otherCollectibles = {};

const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key] = true;
});

document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

function tick() {
    setInterval(() => {
        const speed = 10;
        let dir;

        if ((keys['ArrowUp'] || keys['w']) && (keys['ArrowLeft'] || keys['a'])) {
            dir = 'upleft'
        } else if ((keys['ArrowUp'] || keys['w']) && (keys['ArrowRight'] || keys['d'])) {
            dir = 'upright'
        } else if ((keys['ArrowDown'] || keys['s']) && (keys['ArrowLeft'] || keys['a'])) {
            dir = 'downleft'
        } else if ((keys['ArrowDown'] || keys['s']) && (keys['ArrowRight'] || keys['d'])) {
            dir = 'downright'
        } else if (keys['ArrowUp'] || keys['w']) {
            dir = 'up'
        } else if (keys['ArrowRight'] || keys['d']) {
            dir = 'right'
        } else if (keys['ArrowDown'] || keys['s']) {
            dir = 'down'
        } else if (keys['ArrowLeft'] || keys['a']) {
            dir = 'left'
        }

        if (dir && localPlayer) {
            localPlayer.movePlayer(dir, speed);
            socket.emit('move', { dir, speed })
        }
    }, 50); 
}
tick();

socket.on('init', ({ players, collectibles }) => {
    for (const id in players) {
        const data = players[id];
        if (id === socket.id) {
            localPlayer = new Player(data);
        } else {
            otherPlayers[id] = new Player(data);
        }
    }

    for (const collectible of collectibles) {
        otherCollectibles[collectible.id] = new Collectible(collectible);
    }
});

socket.on('state', updatedPlayers => {
    for (const id in updatedPlayers) {
        if (id === socket.id) {
            localPlayer = new Player(updatedPlayers[id]);
        } else {
            otherPlayers[id] = new Player(updatedPlayers[id]);
        }
    }

    if (localPlayer) {
        document.getElementById('score-display').textContent = `Score: ${localPlayer.score}`;
        document.getElementById('rank-display').textContent = localPlayer.calculateRank(Object.values(updatedPlayers));
    }
})

socket.on('collectibles', updated => {
    for (const id in otherCollectibles) {
        delete otherCollectibles[id];
    }

    for (const c of updated) {
        otherCollectibles[c.id] = new Collectible(c);
    }
});

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const item of Object.values(otherCollectibles)) {
        context.fillStyle = item.color || 'gold';
        context.fillRect(item.x, item.y, item.size, item.size);
    }

    for (const player of Object.values(otherPlayers)) {
        context.fillStyle = 'blue';
        context.fillRect(player.x, player.y, player.size, player.size);
    }

    if (localPlayer) {
        context.fillStyle = 'green';
        context.fillRect(localPlayer.x, localPlayer.y, localPlayer.size, localPlayer.size);
    }

    requestAnimationFrame(render);
}
render();