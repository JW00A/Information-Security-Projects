class Player {
  constructor({ x, y, score, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.size = 20;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up': 
        this.y -= speed; 
        break;
      case 'upleft': 
        this.y -= speed; 
        this.x -= speed;
        break;
      case 'upright': 
        this.y -= speed; 
        this.x += speed; 
        break;
      case 'down': 
        this.y += speed; 
        break;
      case 'downleft': 
        this.y += speed; 
        this.x -= speed;
        break;
      case 'downright': 
        this.y += speed; 
        this.x += speed;
        break;
      case 'left': 
        this.x -= speed; 
        break;
      case 'right': 
        this.x += speed; 
        break;
    }

    this.x = Math.max(0, Math.min(this.x, 640 - this.size));
    this.y = Math.max(0, Math.min(this.y, 480 - this.size));
  }

  collision(item) {
    return (
      this.x < item.x + item.size &&
      this.x + this.size > item.x &&
      this.y < item.y + item.size &&
      this.y + this.size > item.y
    );
  }

  calculateRank(arr) {
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${arr.length}`;
  }
}

module.exports = Player;