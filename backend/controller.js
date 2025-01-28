class Controller {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._startTime = Date.now();
    this._lag = 0;
    this._fps = 60;
    this._frameDuration = 1000 / this._fps;

    this.useAi = false;

    const vecteurBiaisEntree = [0.1, 0.1, 0.1, 0.1];

    const matricePoids = [
      [0.1, 0.2, 0.5, 0.4, 0.7, 0.7],
      [0.1, 0.4, 0.5, 0.4, 0.7, 0.7],
      [-0.2, -0.2, -0.5, -0.4, -0.7, 0.7],
      [0.1, 0.4, 0.8, 0.4, 0.4, 0.4],
    ];

    const matricePoidsSortie = [
      [0.1, 0.2, 0.5, 0.4],
      [0.1, 0.4, 0.5, 0.4],
      [0.2, 0.2, 0.5, 0.4],
    ];

    const vecteurBiaisSortie = [0.1, 0.1, 0.1];

    this.ai = new AI(
      vecteurBiaisEntree,
      matricePoids,
      matricePoidsSortie,
      vecteurBiaisSortie
    );

    this._model.BindDisplay(this.Display.bind(this));
    this._view.BindSetDirection(this.SetDirection.bind(this));
    this._view.BindGetDirection(this.GetDirection.bind(this));

    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.resetGame();
        this.Update();
      });
    }
  }

  resetGame() {
    // Create a brand new Model & View
    this._model = new Model();
    this._view = new View("my_canvas");

    // Re-bind the display and direction events
    this._model.BindDisplay(this.Display.bind(this));
    this._view.BindSetDirection(this.SetDirection.bind(this));
    this._view.BindGetDirection(this.GetDirection.bind(this));

    // Reset timing
    this._startTime = Date.now();
    this._lag = 0;
  }

  Display(model) {
    this._view.Display(model);
  }

  SetDirection(newDirection) {
    this._model.direction = newDirection;
  }

  GetDirection() {
    return this._model.direction;
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
        const aiCheckbox = document.getElementById('useAICheckBox');
        if (aiCheckbox){
          this.useAi = aiCheckbox.checked; 
        } 

        // If AI is active, set direction from an AI routine (example placeholder)
        if (this.useAi) {
          this.ai.inputVector = this._model.aiInputVector();
          this._model.direction = this.ai.computeOutput();
        }

        this._model.Move(this._fps);
      }
      this._lag -= this._frameDuration;
    }

    requestAnimationFrame(this.Update.bind(this));
  }
}
