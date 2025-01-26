class FinishLine {
    // start at 579, 330
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 321;
      this.height = 182;
    }
  }
  
  class Platform {
    static TYPES = {
      NORMAL: 'normal',
      MOVING: 'moving',
      DISAPPEARING: 'disappearing'
    };
  
    static SPRITE_COORDS = {
      [Platform.TYPES.NORMAL]: [1, 1, 57, 15],
      [Platform.TYPES.MOVING]: [1, 19, 57, 15],
      [Platform.TYPES.DISAPPEARING]: [1, 55, 57, 15]
    };
  
    constructor(x, y, type = Platform.TYPES.NORMAL) {
      this.x = x;
      this.y = y;
      this.width = 57; // Match spritesheet width
      this.height = 15; // Match spritesheet height
      this.type = type;
      this.movementDirection = Math.random() > 0.5 ? 1 : -1;
      this.touched = false;
  
      // Properties for falling animation for the platforms of type disappearing
      this.isFalling = false;
      this.fallSpeed = 0;
    }
  
    update(speed) {
      if (this.type === Platform.TYPES.MOVING && !this.isFalling) {
        this.x += speed * this.movementDirection;
  
        // Reverse direction at screen edges
        if (this.x <= 0 || this.x + this.width >= 320) {
          this.movementDirection *= -1;
        }
      }
  
      // Handle falling for disappearing platforms
      if (this.isFalling) {
        this.fallSpeed += 0.5; // Add to the fall speed a fall acceleration static value of 0.5
        this.y += this.fallSpeed;
      }
    }
  
    startFalling() {
      if (this.type === Platform.TYPES.DISAPPEARING) {
        this.isFalling = true;
      }
    }
  }
  
  class Model {
    static GRAVITY = 20;
    static JUMP_FORCE = 600;
    static SPEED = 200;
    static PLATFORM_SPEED = 200;
    static CANVAS_WIDTH = 320;
    static CANVAS_HEIGHT = 480;
  
    static MAX_JUMP_HEIGHT = Model.JUMP_FORCE / Model.GRAVITY;
    static MIN_PLATFORM_SPACING = 100;
  
    constructor() {
      // TODO : The hitbox size is the same size given when 'Drawing' the sprite
      this._hitbox = {
        width: 50,
        height: 50
      };
  
      this._direction = 0;
      this._gravitySpeed = 0;
      this._position = { x: Model.CANVAS_WIDTH / 2 - 25, y: Model.CANVAS_HEIGHT / 2 };
      this._score = 0;
      this._level = 1;
      this._platforms = this._generateInitialPlatform();
  
      const finishLineY = -10800;
      const finishLineX = 0;
      this._finishLine = new FinishLine(finishLineX, finishLineY);
  
      this._generatePlatforms();
      this._gameOver = false;
      this._gameWon = false;
      this._highestReachedY = this._position.y;
    }
  
    get position() {
      return this._position;
    }
    get platforms() {
      return this._platforms;
    }
    get score() {
      return this._score;
    }
    get level() {
      return this._level;
    }
    get gameOver() {
      return this._gameOver;
    }
    get gameWon() {
      return this._gameWon;
    }
  
    get direction() {
      return this._direction;
    }
    set direction(value) {
      this._direction = value;
    }
  
    BindDisplay(callback) {
      this.b_Display = callback;
    }
  
    _generatePlatformType(level) {
      const random = Math.random();
      if (level <= 3) return Platform.TYPES.NORMAL;
  
      if (level <= 5) {
        if (random < 0.7) return Platform.TYPES.NORMAL;
        if (random < 0.9) return Platform.TYPES.MOVING;
        return Platform.TYPES.DISAPPEARING;
      }
  
      if (random < 0.5) return Platform.TYPES.NORMAL;
      if (random < 0.8) return Platform.TYPES.MOVING;
      return Platform.TYPES.DISAPPEARING;
    }
  
    _getTargetPlatformCount() {
      // Desired platforms at level 1 and level 10
      const maxPlatformsAtLevel1 = 10;
      const minPlatformsAtLevel10 = 5;
  
      const t = (this._level - 1) / (10 - 1); // Goes from 0.0 (level 1) to 1.0 (level 10)
      const desired = maxPlatformsAtLevel1 - t * (maxPlatformsAtLevel1 - minPlatformsAtLevel10);
  
      return Math.round(desired);
    }
  
    _generateInitialPlatform() {
      const platformX = Model.CANVAS_WIDTH / 2 - 30;
      const platformY = Model.CANVAS_HEIGHT / 2;
      const platform = new Platform(platformX, platformY, Platform.TYPES.NORMAL);
  
      // Ensure the player starts on top of that platform
      this._position.x = platformX + platform.width / 2 - this._hitbox.width / 2;
      this._position.y = platformY - this._hitbox.height;
      return [platform];
    }
  
    _generatePlatforms() {
      // Remove off-screen platforms
      this._platforms = this._platforms.filter(p => p.y < Model.CANVAS_HEIGHT);
  
      // How many total platforms for the current level
      const targetCount = this._getTargetPlatformCount();
  
      // Generate new platforms until we reach target
      while (this._platforms.length < targetCount) {
        // Get highest existing platform
        let highestPlatform = this._platforms.reduce((highest, current) =>
          current.y < highest.y ? current : highest
        );
  
        // These define the feasible Y range
        let minY = Math.max(highestPlatform.y - Model.MAX_JUMP_HEIGHT, 15); // 15 -> platform height
        let maxY = highestPlatform.y - Model.MIN_PLATFORM_SPACING;
  
        // Pre-generate type only once
        const platformType = this._generatePlatformType(this._level);
  
        // fractionOfMaxSpacing goes from 0.5 at level=1 to 1.0 at level=10
        const fractionOfMaxSpacing = 0.5 + 0.5 * (Math.min(this._level, 10) / 10);
        const randomJitter = Math.random() * 0.1; // up to +10% wiggle
        const totalFraction = Math.min(1.0, fractionOfMaxSpacing + randomJitter);
  
        let newPlatformY = minY + totalFraction * (maxY - minY);
        const newPlatformX = this._calculateViableXPosition(newPlatformY);
  
        // Ensure at least 70px above old highest
        const forcedGap = 40;
        const desiredY = highestPlatform.y - forcedGap;
        if (newPlatformY > desiredY) {
          newPlatformY = desiredY;
        }
  
        const width = 57;
        const height = 15;
        this._platforms.push(new Platform(newPlatformX, newPlatformY, platformType));
      }
    }
  
    _calculateViableXPosition(platformY) {
      // Look at existing platforms and find a position that could be reachable
      const viablePlatforms = this._platforms.filter(
        p => p.y > platformY && p.y <= platformY + Model.JUMP_FORCE / Model.GRAVITY
      );
  
      if (viablePlatforms.length > 0) {
        // Choose a platform to base the new platform's X position relative to
        const referencePlatform = viablePlatforms[Math.floor(Math.random() * viablePlatforms.length)];
        const baseX = referencePlatform.x;
        const xVariation = Math.random() * 100 - 50; // +/- 50 pixels variation
  
        return Math.max(0, Math.min(Model.CANVAS_WIDTH - 60, baseX + xVariation));
      }
  
      // Fallback to random
      return Math.random() * (Model.CANVAS_WIDTH - 60);
    }
  
    Move(fps) {
      // Horizontal movement
      this._position.x += (this._direction * Model.SPEED) / fps;
  
      // Wrap around screen
      if (this._position.x < -10) this._position.x = Model.CANVAS_WIDTH;
      if (this._position.x > Model.CANVAS_WIDTH) this._position.x = -10;
  
      // Apply gravity
      this._gravitySpeed += Model.GRAVITY;
      this._position.y += this._gravitySpeed / fps;
  
      // Update platform movements
      this._platforms.forEach(platform =>
        platform.update(Model.PLATFORM_SPEED / fps)
      );
  
      // Check platform collisions
      for (let platform of this._platforms) {
        if (
          this._position.x + this._hitbox.width > platform.x &&
          this._position.x < platform.x + platform.width &&
          this._position.y + this._hitbox.height >= platform.y &&
          this._position.y + this._hitbox.height < platform.y + 10 &&
          this._gravitySpeed > 0
        ) {
          switch (platform.type) {
            case Platform.TYPES.DISAPPEARING:
              if (!platform.touched) {
                this._Jump();
                platform.touched = true;
                platform.startFalling();
              }
              break;
            default:
              this._Jump();
              break;
          }
          break;
        }
      }
  
      // Scroll platforms and generate new ones
      if (this._position.y < Model.CANVAS_HEIGHT / 2) {
        const scrollAmount = Model.CANVAS_HEIGHT / 2 - this._position.y;
        this._position.y += scrollAmount;
  
        for (let platform of this._platforms) {
          platform.y += scrollAmount;
        }
  
        if (this._finishLine) {
          this._finishLine.y += scrollAmount;
        }
  
        // Increase score and possibly level
        const scoreIncrease = Math.floor(scrollAmount);
        this._score += scoreIncrease;
        this._level = Math.floor(this._score / 1000) + 1;
  
        // Only generate more platforms if the player didn't yet win
        if (this._score < 9700) {
          this._generatePlatforms();
        } else if (this._score >= 10000) {
          this._gameWon = true;
        }
      }
  
      // Game over if fallen below screen
      if (this._position.y > Model.CANVAS_HEIGHT) {
        this._gameOver = true;
      }
  
      this.b_Display(this);
    }
  
    _Jump() {
      this._gravitySpeed = -Model.JUMP_FORCE;
    }
  }
  