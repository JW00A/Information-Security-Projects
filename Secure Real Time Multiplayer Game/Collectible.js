class Collectible {
  constructor({x, y, value, id, color }) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
    this.size = 20;
    this.color = color;
  }

  static randomType() {
    const types = [
        { value: 1, color: 'peru' },
        { value: 2, color: 'silver' },
        { value: 3, color: 'gold' }
    ];

    return types[Math.floor(Math.random() * types.length)];
  }

  spawnCollectible(collectibles, canvasWidth = 640, canvasHeight = 480) {
    const id = Date.now().toString();
    const x = Math.floor(Math.random() * (canvasWidth - this.size));
    const y = Math.floor(Math.random() * (canvasHeight - this.size));
    const { value, color } = Collectible.randomType();
    collectibles.push(new Collectible({x, y, value, id, color}))
  }
}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

