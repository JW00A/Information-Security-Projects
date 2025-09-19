const Player = require('./Player.js');
const Collectible = require('./Collectible.js');

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

let players = {};
let collectibles = [];

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.use('/public', express.static(process.cwd() + '/public', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));
app.use('/assets', express.static(process.cwd() + '/assets', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);
io.on('connection', s => {
  const id = s.id;
  players[id] = new Player({ x: 100, y: 100, score: 0, id });

  s.emit('init', { players, collectibles });

  s.on('move', ({ dir, speed }) => {
    const player = players[id];
    player.movePlayer(dir, speed);

    let collected = false;

    for (let i = collectibles.length - 1; i >= 0; i--) {
      const item = collectibles[i];
      if (player.collision(item)) {
        player.score += item.value;
        collectibles.splice(i, 1);
        collected = true;
      }
    }

    if (collected) {
      const c = new Collectible({});
      c.spawnCollectible(collectibles, 640, 480);
      collected = false;
    }

    io.emit('state', players);
    io.emit('collectibles', collectibles);
  });

  s.on('disconnect', () => {
    delete players[id];
    io.emit('state', players);
  })
});


function spawnCollectibles() {
  const c = new Collectible({});
  c.spawnCollectible(collectibles, 640, 480);
  io.emit('collectibles', collectibles);
}
spawnCollectibles();

module.exports = app; // For testing
