class AITrainer {
    constructor(data = null) {
        this.NUM_GAMES = 50;
        this.NUM_TOP_AI = 10;
        this.MUTATION_RATE = 0.1;
        this.MUTATION_RANGE = 0.2;
        this.generation = 0;
        this.games = [];
        this.bestScore = 0;
        this.isTraining = false;
        this.animationFrameId = null; // Add this to track the animation frame
        
        // Threshold for how many consecutive frames without a score increase
        // will result in marking the game as not active.
        this.MAX_NO_SCORE_INCREASE_FRAMES = 300;

        this.initializeGames();
        this.setupEventListeners();

        if (data) {
            this.loadAIsFromJSON(data);
        }
    }

    loadAIsFromJSON(data) {
        this.generation = data.generation;
        document.getElementById('generation').textContent = this.generation;

        this.games.forEach((game, index) => {
            if (index < data.topAIs.length) {
                const aiData = data.topAIs[index];

                game.ai = new AI(
                    aiData.inputBiasVector,
                    aiData.weightMatrix,
                    aiData.outputWeightMatrix,
                    aiData.outputBiasVector
                );
            } else {
                game.ai = this.createAI();
            }
        });

        console.log(`Loaded AI generation ${this.generation}`);
    }
    
    initializeGames() {
        const container = document.getElementById('gamesContainer');
        container.innerHTML = '';
        
        for (let i = 0; i < this.NUM_GAMES; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'game-wrapper';
            
            const stats = document.createElement('div');
            stats.className = 'game-stats';
            stats.id = `stats-${i}`;
            stats.textContent = 'Score: 0';
            
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 480;
            canvas.id = `canvas-${i}`;
            
            wrapper.appendChild(stats);
            wrapper.appendChild(canvas);
            container.appendChild(wrapper);
            
            const model = new Model();
            const view = new View(`canvas-${i}`, true);
            const ai = this.createAI();
            
            model.BindDisplay((modelState) => {
                view.Display(modelState);
            });
            
            // Initialize additional tracking properties:
            // - `lastScore`: last recorded score
            // - `noScoreIncreaseCounter`: tracks how many frames we've gone without a score increase
            this.games.push({
                model,
                view,
                ai,
                score: 0,
                isActive: true,
                lastScore: 0,
                noScoreIncreaseCounter: 0
            });
        }
    }

    logTopAIs() {
        // Sort games by score in descending order
        const sortedGames = [...this.games].sort((a, b) => b.score - a.score);

        // Get the top this.NUM_TOP_AI AIs
        const topAIs = sortedGames.slice(0, this.NUM_TOP_AI).map((game, index) => ({
            inputBiasVector: game.ai.inputBiasVector,
            weightMatrix: game.ai.weightMatrix,
            outputWeightMatrix: game.ai.outputWeightMatrix,
            outputBiasVector: game.ai.outputBiasVector
        }));

        // Create the JSON structure
        const aiData = {
            generation: this.generation,
            topAIs: topAIs
        };

        // Log the JSON object
        console.log(JSON.stringify(aiData, null, 2));
    }
    
    stopTraining() {
        this.isTraining = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    startTraining() {
        // Stop any existing training first
        this.stopTraining();
        
        this.isTraining = true;
        this.generation++;
        document.getElementById('generation').textContent = this.generation;
        
        // Reset all games
        this.games.forEach((game, index) => {
            game.model = new Model();
            game.model.BindDisplay((modelState) => {
                game.view.Display(modelState);
            });
            game.score = 0;
            game.isActive = true;
            game.lastScore = 0;
            game.noScoreIncreaseCounter = 0;
        });
        
        this.updateGames();
    }
    
    setupEventListeners() {
        const startBtn = document.getElementById('startTrainingBtn');
        const backBtn = document.getElementById('backToGameBtn');
        
        startBtn.addEventListener('click', () => {
            this.startTraining();
        });
        
        backBtn.addEventListener('click', () => {
            this.stopTraining(); // Ensure we stop training before navigating away
            window.location.href = 'index.html';
        });
    }
    
    updateGames() {
        if (!this.isTraining) return;
        
        let allGamesDone = true;
        let totalScore = 0;
        let activeGames = 0;
        
        this.games.forEach((game, index) => {
            if (game.isActive) {
                // Provide inputs to AI and get its output
                game.ai.inputVector = game.model.aiInputVector();
                game.model.direction = game.ai.computeOutput();
                
                // Update the model
                game.model.Move(60);
                
                // Update score
                game.score = game.model.score;
                document.getElementById(`stats-${index}`).textContent = `Score: ${game.score}`;
                
                // Check if the game is over or won
                if (game.model.gameOver || game.model.gameWon) {
                    game.isActive = false;
                } else {
                    // Check if the score has increased
                    if (game.score > game.lastScore) {
                        // Reset the counter if there was a score increase
                        game.lastScore = game.score;
                        game.noScoreIncreaseCounter = 0;
                    } else {
                        // Increment the counter if no score increase
                        game.noScoreIncreaseCounter++;
                        
                        // Deactivate the game if too many consecutive frames without a score increase
                        if (game.noScoreIncreaseCounter > this.MAX_NO_SCORE_INCREASE_FRAMES) {
                            game.isActive = false;
                        }
                    }
                }
                
                totalScore += game.score;
                activeGames++;
                allGamesDone = false;
            }
        });
        
        // Compute average score across active games
        const averageScore = activeGames > 0 ? Math.round(totalScore / activeGames) : 0;
        document.getElementById('averageScore').textContent = averageScore;
        
        // Update best score
        const currentBestScore = Math.max(...this.games.map(g => g.score));
        if (currentBestScore > this.bestScore) {
            this.bestScore = currentBestScore;
            document.getElementById('bestScore').textContent = this.bestScore;
        }
        
        // If all games finished, evolve and start next generation
        if (allGamesDone) {
            this.logTopAIs();
            this.evolveAIs();
            setTimeout(() => this.startTraining(), 1000);
        } else {
            // Continue animation
            this.animationFrameId = requestAnimationFrame(() => this.updateGames());
        }
    }

    createAI() {
        // Create random weights and biases for new AI
        const inputBiasVector = Array(4).fill(0).map(() => Math.random() * 2 - 1);
        const weightMatrix = Array(4).fill(0).map(() => 
            Array(6).fill(0).map(() => Math.random() * 2 - 1)
        );
        const outputWeightMatrix = Array(3).fill(0).map(() => 
            Array(4).fill(0).map(() => Math.random() * 2 - 1)
        );
        const outputBiasVector = Array(3).fill(0).map(() => Math.random() * 2 - 1);
        
        return new AI(inputBiasVector, weightMatrix, outputWeightMatrix, outputBiasVector);
    }
    
    evolveAIs() {
        // Sort games by score
        const sortedGames = [...this.games].sort((a, b) => b.score - a.score);
        
        // Keep the top this.NUM_TOP_AI AIs and create variations of them
        const topAIs = sortedGames.slice(0, this.NUM_TOP_AI);
        
        // Create new generation based on top performers
        this.games.forEach((game, index) => {
            if (index < this.NUM_TOP_AI) {
                // Keep top this.NUM_TOP_AI unchanged
                game.ai = this.cloneAI(topAIs[index].ai);
            } else {
                // Create mutated version of a random top this.NUM_TOP_AI AI
                const parentAI = topAIs[Math.floor(Math.random() * this.NUM_TOP_AI)].ai;
                const parentAITwo = topAIs[Math.floor(Math.random() * this.NUM_TOP_AI)].ai;
                let childAI = this.child(parentAI, parentAITwo);

                game.ai = this.mutateAI(this.cloneAI(childAI));
            }
        });
    }
    
    cloneAI(ai) {
        return new AI(
            [...ai.inputBiasVector],
            ai.weightMatrix.map(row => [...row]),
            ai.outputWeightMatrix.map(row => [...row]),
            [...ai.outputBiasVector]
        );
    }
    
    mutateAI(ai) {
        const mutateValue = (value) => {
            if (Math.random() < this.MUTATION_RATE) {
                return value + (Math.random() * 2 - 1) * this.MUTATION_RANGE;
            }
            return value;
        };
        
        // Mutate input bias vector
        ai.inputBiasVector = ai.inputBiasVector.map(mutateValue);
        
        // Mutate weight matrix
        ai.weightMatrix = ai.weightMatrix.map(row => row.map(mutateValue));
        
        // Mutate output weight matrix
        ai.outputWeightMatrix = ai.outputWeightMatrix.map(row => row.map(mutateValue));
        
        // Mutate output bias vector
        ai.outputBiasVector = ai.outputBiasVector.map(mutateValue);
        
        return ai;
    }

    child(parentOne, parentTwo) {
      console.log(parentOne.outputBiasVector[0]);
      return new AI(
        parentOne.inputBiasVector.map((val, i) => (val + parentTwo.inputBiasVector[i]) / 2),
        parentOne.weightMatrix.map((row, i) => 
          row.map((val, j) => (val + parentTwo.weightMatrix[i][j]) / 2)),
        parentOne.outputWeightMatrix.map((row, i) => 
          row.map((val, j) => (val + parentTwo.outputWeightMatrix[i][j]) / 2)),  
        parentOne.outputBiasVector.map((val, i) => (val + parentTwo.outputBiasVector[i]) / 2)
      )     
  }
}

// Initialize the trainer when the page loads
window.addEventListener('load', () => {  
    new AITrainer();
});
