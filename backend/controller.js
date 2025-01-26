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
    }
  
    Display(model) {
      this._view.Display(model);
    }
  
    SetDirection(newDirection) {
      this._model.direction = newDirection;
    }
  
    Update() {
      let currentTime = Date.now();
      let deltaTime = currentTime - this._startTime;
  
      this._lag += deltaTime;
      this._startTime = currentTime;
  
      while (this._lag >= this._frameDuration) {
        // Once the game is either over or won, the game stops moving
        if (!this._model.gameOver && !this._model.gameWon) {
          this._model.Move(this._fps);
        }
        this._lag -= this._frameDuration;
      }
  
      requestAnimationFrame(this.Update.bind(this));
    }
  }
  
  // Initialize and start the game
  const app = new Controller(new Model(), new View());
  app.Update();
  