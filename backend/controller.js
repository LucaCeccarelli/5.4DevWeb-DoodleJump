class Controller {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._startTime = Date.now();
    this._lag = 0;
    this._fps = 60;
    this._frameDuration = 1000 / this._fps;

    this._model.BindDisplay(this.Display.bind(this));
    this._view.BindSetDirection(this.SetDirection.bind(this));

    const startBtn = document.getElementById('startGameBtn');
    startBtn.addEventListener('click', () => {
      this.resetGame();      
      this.Update();
    });

  }

  resetGame() {
    // Create a brand new Model & View
    this._model = new Model();
    this._view = new View();

    // Re-bind the display and direction events
    this._model.BindDisplay(this.Display.bind(this));
    this._view.BindSetDirection(this.SetDirection.bind(this));

    // Reset timing
    this._startTime = Date.now();
    this._lag = 0;
  }

  Display(model) {
    this._view.Display(model);
  }

  SetDirection(newDirection) {
    // This is called by user input, but we might override it if AI is active
    const useAI = document.getElementById('useAICheckBox').checked;
    if (!useAI) {
      // Only apply user direction if AI is not active
      this._model.direction = newDirection;
    }
    // If AI is active, we ignore user input (or handle it differently).
  }

  Update() {
    let currentTime = Date.now();
    let deltaTime = currentTime - this._startTime;

    this._lag += deltaTime;
    this._startTime = currentTime;

    while (this._lag >= this._frameDuration) {
      // If the game isn't over or won, move the model
      if (!this._model.gameOver && !this._model.gameWon) {
        // Check the "Use AI" state
        const useAI = document.getElementById('useAICheckBox').checked;

        // If AI is active, set direction from an AI routine (example placeholder)
        if (useAI) {
          // Instead of user direction, you'd call your AI logic:
          //    let aiDirection = someAIlogic(this._model);
          //    this._model.direction = aiDirection;
        }

        this._model.Move(this._fps);
      }
      this._lag -= this._frameDuration;
    }

    requestAnimationFrame(this.Update.bind(this));
  }
}

const app = new Controller(new Model(), new View());
