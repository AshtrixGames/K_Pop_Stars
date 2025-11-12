import Phaser from 'phaser';

// Friendly tweak zone:
// Change these numbers to adjust the game feel without touching the rest of the code.
const HERO_SPEED = 240;
const DEMON_SPEED = 120;
const DEMON_SPAWN_INTERVAL = 1400; // milliseconds
const HERO_SLASH_RANGE = 100;
const HERO_MAX_HEALTH = 5;
const WIN_SCORE = 30;

type PhysicsSprite = (Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite) & {
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

    // Hero sprite sheet loading
    // Idle animation (4 frames, 117px wide, 253px tall each)
    // In Vite, files in public/ folder are served from root
    // So if file is in public/assets/characters/, use: '/assets/characters/hero-idle.png'
    // OR if you import it, you can use the imported path
    this.load.spritesheet('heroIdle', '/assets/characters/hero-idle.png', {
      frameWidth: 117,
      frameHeight: 253
    });
    
    // Demon sprite sheet loading
    // Multi-row sprite sheet with animations: Idle, Move, Attack, Damage, Death, Flames
    // Each frame is approximately 16-24 pixels, we'll use 24x24 as default
    // The sprite sheet has 18 rows total with different frame counts per row
    this.load.spritesheet('demonSprite', '/assets/characters/demon.png', {
      frameWidth: 24,
      frameHeight: 24
    });
    
    // Add error handler to debug loading issues
    this.load.on('fileerror', (file: Phaser.Loader.File) => {
      console.error('❌ Failed to load file:', file.key, 'from:', file.url);
      console.error('Make sure the sprite sheet exists in assets/characters/ folder');
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('❌ Load error for:', file.key, file.url);
    });
    
    // Running animation (uncomment when you have it):
    // this.load.spritesheet('heroRun', 'assets/characters/hero-run.png', {
    //   frameWidth: 125,
    //   frameHeight: 125
    // });
    
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

    // Create idle animation if sprite sheet is loaded
    if (this.textures.exists('heroIdle')) {
      console.log('✅ heroIdle sprite sheet loaded successfully!');
      this.anims.create({
        key: 'heroIdle',
        frames: this.anims.generateFrameNumbers('heroIdle', { start: 0, end: 3 }),
        frameRate: 4, // Slow, gentle idle animation
        repeat: -1 // Loop forever
      });
    } else {
      console.warn('⚠️ heroIdle sprite sheet not found. Using placeholder square.');
      console.warn('Make sure hero-idle.png is in assets/characters/ folder');
    }

    // Create running animation if sprite sheet is loaded
    if (this.textures.exists('heroRun')) {
      this.anims.create({
        key: 'heroRun',
        frames: this.anims.generateFrameNumbers('heroRun', { start: 0, end: -1 }),
        frameRate: 10,
        repeat: -1 // Loop forever
      });
    }

    // Create demon animations if sprite sheet is loaded
    // Based on sprite sheet structure: Idle, Move, Attack, Damage, Death, Flames
    // Each row has different frame counts, so we'll use frame indices
    if (this.textures.exists('demonSprite')) {
      console.log('✅ demonSprite sprite sheet loaded successfully!');
      
      // Calculate frames per row (assuming 24x24 frames)
      const frameWidth = 24;
      const frameHeight = 24;
      const texture = this.textures.get('demonSprite');
      const textureSource = texture.source[0];
      const framesPerRow = Math.floor(textureSource.width / frameWidth);
      
      // Helper function to get frame indices for a specific row
      // Phaser loads spritesheets row by row, so we calculate frame indices based on row
      const getRowFrames = (rowIndex: number, frameCount: number) => {
        const startFrame = rowIndex * framesPerRow;
        return this.anims.generateFrameNumbers('demonSprite', { 
          start: startFrame, 
          end: startFrame + frameCount - 1 
        });
      };
      
      // Based on user-provided frame counts:
      // Row 0: Idle right (7 frames)
      // Row 1: Move right (8 frames)
      // Row 2: Attack right (6 frames)
      // Row 3: Damage right (4 frames)
      // Row 4: Death right (6 frames)
      // Row 5: Flames (7 frames)
      // Row 6: Idle left (7 frames)
      // Row 7: Move left (8 frames)
      // Row 8: Attack left (6 frames)
      // Row 9: Damage left (4 frames)
      // Row 10: Death left (6 frames)
      // Row 11: Flames (7 frames)
      
      // Idle animations (facing right)
      this.anims.create({
        key: 'demonIdleRight',
        frames: getRowFrames(0, 7),
        frameRate: 4,
        repeat: -1
      });
      
      // Move animations (facing right)
      this.anims.create({
        key: 'demonMoveRight',
        frames: getRowFrames(1, 8),
        frameRate: 10,
        repeat: -1
      });
      
      // Attack animations (facing right)
      this.anims.create({
        key: 'demonAttackRight',
        frames: getRowFrames(2, 6),
        frameRate: 12,
        repeat: 0 // Play once
      });
      
      // Damage animations (facing right)
      this.anims.create({
        key: 'demonDamageRight',
        frames: getRowFrames(3, 4),
        frameRate: 8,
        repeat: 0
      });
      
      // Death animations (facing right)
      this.anims.create({
        key: 'demonDeathRight',
        frames: getRowFrames(4, 6),
        frameRate: 6,
        repeat: 0
      });
      
      // Idle animations (facing left)
      this.anims.create({
        key: 'demonIdleLeft',
        frames: getRowFrames(6, 7),
        frameRate: 4,
        repeat: -1
      });
      
      // Move animations (facing left)
      this.anims.create({
        key: 'demonMoveLeft',
        frames: getRowFrames(7, 8),
        frameRate: 10,
        repeat: -1
      });
      
      // Attack animations (facing left)
      this.anims.create({
        key: 'demonAttackLeft',
        frames: getRowFrames(8, 6),
        frameRate: 12,
        repeat: 0
      });
      
      // Damage animations (facing left)
      this.anims.create({
        key: 'demonDamageLeft',
        frames: getRowFrames(9, 4),
        frameRate: 8,
        repeat: 0
      });
      
      // Death animations (facing left)
      this.anims.create({
        key: 'demonDeathLeft',
        frames: getRowFrames(10, 6),
        frameRate: 6,
        repeat: 0
      });
      
      // Flames animation (for projectiles)
      this.anims.create({
        key: 'demonFlames',
        frames: getRowFrames(5, 7),
        frameRate: 12,
        repeat: -1
      });
    } else {
      console.warn('⚠️ demonSprite sprite sheet not found. Using placeholder square.');
      console.warn('Make sure demon.png is in assets/characters/ folder');
    }

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
    this.updateDemonAnimations();

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.performSlash();
    }

    if (time > this.lastSpawnTime + this.currentSpawnInterval) {
      this.spawnDemon();
      this.lastSpawnTime = time;
    }
  }

  private updateDemonAnimations(): void {
    if (!this.textures.exists('demonSprite')) {
      return;
    }

    const demons = this.demons.getChildren() as PhysicsSprite[];
    demons.forEach((demon) => {
      if (!demon.active || !(demon instanceof Phaser.GameObjects.Sprite)) {
        return;
      }

      const velocity = demon.body.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      const isMoving = speed > 10; // Threshold for movement
      const facingRight = velocity.x >= 0;
      
      const demonData = demon as any;
      const wasMoving = demonData.isMoving;
      const wasFacingRight = demonData.facingRight;
      
      // Update direction if changed
      if (facingRight !== wasFacingRight) {
        demonData.facingRight = facingRight;
      }
      
      // Update movement state if changed
      if (isMoving !== wasMoving) {
        demonData.isMoving = isMoving;
      }
      
      // Only update animation if state changed or animation finished
      const currentAnim = demon.anims.currentAnim;
      const isAnimFinished = currentAnim && !demon.anims.isPlaying;
      const shouldUpdate = 
        (isMoving !== wasMoving) || 
        (facingRight !== wasFacingRight) ||
        (!currentAnim || isAnimFinished);
      
      if (shouldUpdate) {
        if (isMoving) {
          // Play move animation
          if (facingRight && this.anims.exists('demonMoveRight')) {
            demon.play('demonMoveRight');
          } else if (!facingRight && this.anims.exists('demonMoveLeft')) {
            demon.play('demonMoveLeft');
          }
        } else {
          // Play idle animation
          if (facingRight && this.anims.exists('demonIdleRight')) {
            demon.play('demonIdleRight');
          } else if (!facingRight && this.anims.exists('demonIdleLeft')) {
            demon.play('demonIdleLeft');
          }
        }
      }
    });
  }

  private handleMovement(): void {
    const body = this.hero.body;
    body.setVelocity(0);

    let isMoving = false;

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-HERO_SPEED);
      isMoving = true;
      // Flip sprite to face left
      if (this.hero instanceof Phaser.GameObjects.Sprite) {
        this.hero.setFlipX(true);
      }
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(HERO_SPEED);
      isMoving = true;
      // Face right
      if (this.hero instanceof Phaser.GameObjects.Sprite) {
        this.hero.setFlipX(false);
      }
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-HERO_SPEED);
      isMoving = true;
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(HERO_SPEED);
      isMoving = true;
    }

    body.velocity.normalize().scale(HERO_SPEED);

    // Play appropriate animation based on movement state
    if (this.hero instanceof Phaser.GameObjects.Sprite) {
      if (isMoving) {
        // Play running animation if available, otherwise just move
        if (this.anims.exists('heroRun')) {
          if (!this.hero.anims.isPlaying || this.hero.anims.currentAnim?.key !== 'heroRun') {
            this.hero.play('heroRun');
          }
        }
      } else {
        // Play idle animation when not moving
        if (this.anims.exists('heroIdle')) {
          if (!this.hero.anims.isPlaying || this.hero.anims.currentAnim?.key !== 'heroIdle') {
            this.hero.play('heroIdle');
          }
        } else if (this.anims.exists('heroRun')) {
          // Fallback: stop and show first frame
          this.hero.stop();
          if (this.textures.exists('heroRun')) {
            this.hero.setFrame(0);
          }
        }
      }
    }
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
    // Use sprite sheet if available, otherwise fall back to placeholder
    let hero: PhysicsSprite;
    if (this.textures.exists('heroIdle')) {
      hero = this.physics.add.sprite(x, y, 'heroIdle') as PhysicsSprite;
      // Start with idle animation
      if (this.anims.exists('heroIdle') && hero instanceof Phaser.GameObjects.Sprite) {
        hero.play('heroIdle');
      }
    } else if (this.textures.exists('heroRun')) {
      hero = this.physics.add.sprite(x, y, 'heroRun') as PhysicsSprite;
    } else if (this.textures.exists('heroSprite')) {
      hero = this.physics.add.image(x, y, 'heroSprite') as PhysicsSprite;
    } else {
      hero = this.physics.add.image(x, y, 'heroSquare') as PhysicsSprite;
    }
    
    // Set collision to match sprite bounds (rectangle instead of circle)
    if (this.textures.exists('heroIdle')) {
      // Scale hero down to match demon size (demons are 44x44)
      // Original hero size: 117x253, scale to match demon width: 44/117 ≈ 0.376
      const scale = 44 / 117; // Scale to match demon width (44px)
      hero.setScale(scale);
      
      // Scale the collision box proportionally (117*scale x 253*scale)
      const scaledWidth = 117 * scale;  // ≈ 44px
      const scaledHeight = 253 * scale; // ≈ 95px (taller than demons but proportional)
      hero.setSize(scaledWidth, scaledHeight);
      
      // Ensure the sprite origin is centered for proper collision alignment
      if (hero instanceof Phaser.GameObjects.Sprite || hero instanceof Phaser.GameObjects.Image) {
        hero.setOrigin(0.5, 0.5);
      }
    } else {
      // Fallback to circle for placeholder
      hero.setCircle(24);
    }
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

    // Use sprite sheet if available, otherwise fall back to placeholder
    let demon: PhysicsSprite;
    if (this.textures.exists('demonSprite')) {
      demon = this.physics.add.sprite(x, y, 'demonSprite') as PhysicsSprite;
      // Start with idle animation facing right
      if (this.anims.exists('demonIdleRight') && demon instanceof Phaser.GameObjects.Sprite) {
        demon.play('demonIdleRight');
      }
      // Set collision size to match sprite (24x24)
      demon.setSize(24, 24);
      demon.setScale(44 / 24); // Scale to match original demon size (44x44)
    } else {
      demon = this.physics.add.image(x, y, 'demonSquare') as PhysicsSprite;
      demon.setCircle(22);
    }

    // Store direction as a property on the demon
    (demon as any).facingRight = true;
    (demon as any).isMoving = false;

    this.demons.add(demon);

    const angle = Phaser.Math.Angle.Between(x, y, this.hero.x, this.hero.y);
    const velocity = this.physics.velocityFromRotation(
      angle,
      DEMON_SPEED
    );
    demon.body.setVelocity(velocity.x, velocity.y);
    
    // Update facing direction and animation based on velocity
    if (this.textures.exists('demonSprite') && demon instanceof Phaser.GameObjects.Sprite) {
      const facingRight = velocity.x >= 0;
      (demon as any).facingRight = facingRight;
      (demon as any).isMoving = true;
      
      // Play move animation in the correct direction
      if (facingRight && this.anims.exists('demonMoveRight')) {
        demon.play('demonMoveRight');
      } else if (!facingRight && this.anims.exists('demonMoveLeft')) {
        demon.play('demonMoveLeft');
      }
    }
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
    // Play death animation if sprite sheet is loaded
    if (this.textures.exists('demonSprite') && demon instanceof Phaser.GameObjects.Sprite) {
      const demonData = demon as any;
      const facingRight = demonData.facingRight !== false; // Default to right
      
      // Stop movement
      demon.body.setVelocity(0, 0);
      
      // Play death animation
      if (facingRight && this.anims.exists('demonDeathRight')) {
        demon.play('demonDeathRight');
        // Destroy after animation completes
        demon.once('animationcomplete', () => {
          demon.destroy();
        });
      } else if (!facingRight && this.anims.exists('demonDeathLeft')) {
        demon.play('demonDeathLeft');
        demon.once('animationcomplete', () => {
          demon.destroy();
        });
      } else {
        // Fallback: destroy immediately if animation doesn't exist
        demon.destroy();
      }
    } else {
      demon.destroy();
    }
    
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

