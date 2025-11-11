import Phaser from 'phaser';

// Friendly tweak zone:
// Change these numbers to adjust the game feel without touching the rest of the code.
const HERO_SPEED = 240;
const DEMON_SPEED = 120;
const DEMON_SPAWN_INTERVAL = 1400; // milliseconds
const HERO_SLASH_RANGE = 100;
const HERO_MAX_HEALTH = 5;
const WIN_SCORE = 30;

type PhysicsSprite = Phaser.Physics.Arcade.Image & {
  body: Phaser.Physics.Arcade.Body;
};

export default class MainScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private hero!: PhysicsSprite;
  private demons!: Phaser.Physics.Arcade.Group;
  private lastSpawnTime = 0;
  private currentSpawnInterval = DEMON_SPAWN_INTERVAL;

  private health = HERO_MAX_HEALTH;
  private score = 0;

  private healthText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  private isGameOver = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Placeholder textures. Replace with custom sprites in assets/ when ready.
    this.createSolidTexture('heroSquare', 48, 48, 0x7bfffb);
    this.createSolidTexture('demonSquare', 44, 44, 0xff5a91);
    this.createSolidTexture('slash', 120, 120, 0xfff28f, 0.35);

    // Example asset loading (uncomment when your files are ready):
    // this.load.image('heroSprite', 'assets/characters/hero.png');
    // this.load.audio('slash-sfx', 'assets/audio/slash.mp3');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.demons) {
      this.demons.clear(true, true);
    }

    this.isGameOver = false;
    this.health = HERO_MAX_HEALTH;
    this.score = 0;
    this.currentSpawnInterval = DEMON_SPAWN_INTERVAL;
    this.lastSpawnTime = 0;

    this.hero = this.spawnHero(width * 0.2, height * 0.5);

    this.demons = this.physics.add.group();
    this.physics.add.overlap(
      this.hero,
      this.demons,
      (_hero, demon) =>
        this.handleHeroCollision(demon as Phaser.GameObjects.GameObject),
      undefined,
      this
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.actionKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.scoreText = this.add
      .text(16, 16, 'Score: 0', {
        fontSize: '20px',
        color: '#fff'
      })
      .setScrollFactor(0);

    this.healthText = this.add
      .text(16, 44, `Soul Power: ${this.health}`, {
        fontSize: '20px',
        color: '#96ffdf'
      })
      .setScrollFactor(0);

    this.hintText = this.add
      .text(width / 2, height - 32, 'Arrow Keys = Move | Space = Slash', {
        fontSize: '18px',
        color: '#ffe9ff'
      })
      .setOrigin(0.5, 0.5);
  }

  update(time: number): void {
    if (this.isGameOver) {
      return;
    }

    this.handleMovement();

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.performSlash();
    }

    if (time > this.lastSpawnTime + this.currentSpawnInterval) {
      this.spawnDemon();
      this.lastSpawnTime = time;
    }
  }

  private handleMovement(): void {
    const body = this.hero.body;
    body.setVelocity(0);

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-HERO_SPEED);
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(HERO_SPEED);
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-HERO_SPEED);
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(HERO_SPEED);
    }

    body.velocity.normalize().scale(HERO_SPEED);
  }

  private performSlash(): void {
    const slash = this.add
      .image(this.hero.x, this.hero.y, 'slash')
      .setDepth(5);
    this.time.delayedCall(120, () => slash.destroy());

    this.playOptionalSound('slash-sfx', { volume: 0.2 });

    const demons = this.demons.getChildren() as PhysicsSprite[];
    demons.forEach((demon) => {
      if (!demon.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.hero.x,
        this.hero.y,
        demon.x,
        demon.y
      );

      if (distance <= HERO_SLASH_RANGE) {
        this.onDemonDefeated(demon);
      }
    });
  }

  private spawnHero(x: number, y: number): PhysicsSprite {
    const hero = this.physics.add.image(x, y, 'heroSquare') as PhysicsSprite;
    hero.setCircle(24);
    hero.setImmovable(false);
    hero.body.setCollideWorldBounds(true);
    hero.body.setDrag(320);
    return hero;
  }

  private spawnDemon(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const edge = Phaser.Math.Between(0, 3);
    let x = Phaser.Math.Between(0, width);
    let y = Phaser.Math.Between(0, height);

    if (edge === 0) {
      x = -40;
    } else if (edge === 1) {
      x = width + 40;
    } else if (edge === 2) {
      y = -40;
    } else {
      y = height + 40;
    }

    const demon = this.physics.add.image(x, y, 'demonSquare') as PhysicsSprite;
    demon.setCircle(22);

    this.demons.add(demon);

    const angle = Phaser.Math.Angle.Between(x, y, this.hero.x, this.hero.y);
    const velocity = this.physics.velocityFromRotation(
      angle,
      DEMON_SPEED
    );
    demon.body.setVelocity(velocity.x, velocity.y);
  }

  private handleHeroCollision(demonObj: Phaser.GameObjects.GameObject): void {
    if (this.isGameOver) {
      return;
    }

    const demon = demonObj as PhysicsSprite;

    if (!demon.active) {
      return;
    }

    demon.destroy();
    this.takeDamage();
  }

  private takeDamage(): void {
    this.health -= 1;
    this.healthText.setText(`Soul Power: ${Math.max(this.health, 0)}`);

    this.cameras.main.shake(150, 0.0075);

    if (this.health <= 0) {
      this.endGame(false);
    }
  }

  private onDemonDefeated(demon: PhysicsSprite): void {
    demon.destroy();
    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);
    this.playOptionalSound('demon-pop', { volume: 0.15 });

    if (this.score % 5 === 0) {
      this.currentSpawnInterval = Math.max(
        450,
        this.currentSpawnInterval - 120
      );
    }

    if (this.score >= WIN_SCORE) {
      this.endGame(true);
    }
  }

  private endGame(playerWon: boolean): void {
    this.isGameOver = true;

    this.hero.body.setVelocity(0, 0);

    const demons = this.demons.getChildren() as PhysicsSprite[];
    demons.forEach((demon) => demon.body.setVelocity(0, 0));

    this.hintText.setVisible(false);

    const width = this.scale.width;
    const height = this.scale.height;

    const message = playerWon ? 'Victory!' : 'Soul Taken!';

    this.add
      .text(width * 0.5, height * 0.4, message, {
        fontSize: '48px',
        color: '#ffb8e7'
      })
      .setOrigin(0.5);

    this.add
      .text(
        width * 0.5,
        height * 0.55,
        'Press R to try again | Press Esc to rest',
        { fontSize: '22px', color: '#ffffff' }
      )
      .setOrigin(0.5);

    const restartKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.R
    );
    const quitKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    restartKey.once('down', () => this.scene.restart());
    quitKey.once('down', () => this.scene.stop());
  }

  private createSolidTexture(
    key: string,
    width: number,
    height: number,
    color: number,
    alpha = 1
  ): void {
    const graphics = this.add.graphics();
    graphics.setPosition(0, 0);
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(0, 0, width, height, 12);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private playOptionalSound(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ): void {
    const sound = this.sound.get(key);
    if (sound) {
      sound.play(config);
    }
  }
}

