import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#12002f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MainScene]
};

// Hint for young collaborators:
// If you want to change the window size, tweak GAME_WIDTH/GAME_HEIGHT above.
// The scene uses these values too, so the play area always matches.
new Phaser.Game(config);

