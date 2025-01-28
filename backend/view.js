class View {
  constructor(canvas_id, isTrainingMode = false) { 
    this._canvas = document.getElementById(canvas_id);
    this.ctx = this._canvas.getContext('2d');
    this._scoreElement = !isTrainingMode ? document.getElementById('score') : null;
    this._levelElement = !isTrainingMode ? document.getElementById('level') : null;
    this.isTrainingMode = isTrainingMode;

    // Background loading
    this._backgroundImage = new Image();
    this._backgroundImage.src = './sprites/bck@2x.png';

    // Doodle sprites
    this._doodleLeftSprite = new Image();
    this._doodleLeftSprite.src = './sprites/lik-left@2x.png';

    this._doodleRightSprite = new Image();
    this._doodleRightSprite.src = './sprites/lik-right@2x.png';

    // Platform spritesheet
    this._platformSpritesheet = new Image();
    this._platformSpritesheet.src = './sprites/game-tiles.png';

    // Finish line sprite (only for regular game mode)
    if (!isTrainingMode) {
      this._finishLineSprite = new Image();
      this._finishLineSprite.src = './sprites/game-tiles.png';
    }

    // Current sprite direction
    this._currentDirection = 0;
    this._hold_right = false;
    this._hold_left = false;

    // Only set up keyboard events for regular game mode
    if (!isTrainingMode) {
      this.Events();
    }
  }

  BindSetDirection(callback) {
    this.b_SetDirection = callback;
  }

  BindGetDirection(callback) {
    this.b_GetDirection = callback;
  }

  Events() {
    document.addEventListener('keydown', (evt) => {
      if (evt.key == 'ArrowLeft' || evt.key == 'ArrowRight') {
        switch (evt.key) {
          case 'ArrowLeft':
            this._hold_left = true;
            this.b_SetDirection(-1);
            break;
          case 'ArrowRight':
            this._hold_right = true;
            this.b_SetDirection(1);
            break;
        }
      }
    });

    document.addEventListener('keyup', (evt) => {
      switch (evt.key) {
        case 'ArrowLeft':
          if (!this._hold_right) {
            this.b_SetDirection(0);
          }
          this._hold_left = false;
          break;
        case 'ArrowRight':
          if (!this._hold_left) {
            this.b_SetDirection(0);
          }
          this._hold_right = false;
          break;
      }
    });
  }

  Display(model) {
    let { position, platforms, score, level, gameOver, gameWon } = model;
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Draw background image
    if (this._backgroundImage.complete) {
      this.ctx.drawImage(
        this._backgroundImage,
        0,
        0,
        this._canvas.width,
        this._canvas.height
      );
    }

    // Update score and level (only in regular game mode)
    if (!this.isTrainingMode && this._scoreElement && this._levelElement) {
      this._scoreElement.textContent = `Score: ${score}`;
      this._levelElement.textContent = `Level: ${level}`;
    }

    // Draw platforms using sprites
    for (let platform of platforms) {
      if (this._platformSpritesheet.complete) {
        const coords = Platform.SPRITE_COORDS[platform.type];
        this.ctx.drawImage(
          this._platformSpritesheet, // Spritesheet image
          coords[0], // Source X
          coords[1], // Source Y
          coords[2], // Source width
          coords[3], // Source height
          platform.x, // Destination X
          platform.y, // Destination Y
          platform.width, // Destination width
          platform.height // Destination height
        );
      }
    }

    // Draw player sprite based on direction
    let currentSprite;
    const direction = this.b_GetDirection ? this.b_GetDirection() : 0;
    
    if (direction < 0) {
      currentSprite = this._doodleLeftSprite;
    } else {
      currentSprite = this._doodleRightSprite;
    }

    if (currentSprite.complete) {
      this.ctx.drawImage(
        currentSprite,
        position.x,
        position.y,
        50,
        50
      );
    }

    // Draw finish line (only in regular game mode)
    if (!this.isTrainingMode && model._finishLine && this._finishLineSprite.complete) {
      this.ctx.drawImage(
        this._finishLineSprite,
        579,
        330,
        321,
        182,
        model._finishLine.x,
        model._finishLine.y,
        model._finishLine.width,
        model._finishLine.height
      );
    }

    // Game over screen (only in regular game mode)
    if (!this.isTrainingMode && (gameOver || gameWon)) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

      this.ctx.fillStyle = 'white';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        gameWon ? 'You Win!' : 'Game Over',
        this._canvas.width / 2,
        this._canvas.height / 2
      );

      this.ctx.font = '20px Arial';
      this.ctx.fillText(
        `Score: ${score}`,
        this._canvas.width / 2,
        this._canvas.height / 2 + 40
      );
      
      if (!gameWon) {
        this.ctx.fillText(
          `Level: ${level}`,
          this._canvas.width / 2,
          this._canvas.height / 2 + 70
        );
      }
    }
  }
}