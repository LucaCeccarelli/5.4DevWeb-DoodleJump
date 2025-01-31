class AITrainer {
    constructor(data = null) {
        this.NUM_GAMES = 50;
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

        // Get the top 5 AIs
        const topAIs = sortedGames.slice(0, 5).map((game, index) => ({
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
        
        // Keep the top 5 AIs and create variations of them
        const topAIs = sortedGames.slice(0, 5);
        
        // Create new generation based on top performers
        this.games.forEach((game, index) => {
            if (index < 5) {
                // Keep top 5 unchanged
                game.ai = this.cloneAI(topAIs[index].ai);
            } else {
                // Create mutated version of a random top 5 AI
                const parentAI = topAIs[Math.floor(Math.random() * 5)].ai;
                game.ai = this.mutateAI(this.cloneAI(parentAI));
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
}

// Initialize the trainer when the page loads
window.addEventListener('load', () => {
    let aiData = {
        "generation": 25,
        "topAIs": [
          {
            "inputBiasVector": [
              0.8636532413155331,
              -0.27703781229197,
              0.889180375951792,
              0.30044012303812395
            ],
            "weightMatrix": [
              [
                1.0278392209660818,
                0.8913194032194309,
                -0.8637487121931149,
                -0.16533094647350452,
                -1.1782168999497968,
                0.40343487692324465
              ],
              [
                0.9713694401741798,
                -0.6523444922606265,
                -0.9862281853677939,
                0.14894796347871467,
                0.3263015098864498,
                0.1280536147837708
              ],
              [
                -0.9628187620611903,
                -0.20847001340665344,
                0.3591162954840966,
                0.5938994354224352,
                -0.1014444866375826,
                -0.5532345982878564
              ],
              [
                0.030918456070528746,
                -0.5963247011926472,
                -0.05482022556044752,
                0.7668871256436978,
                0.6850274720095797,
                -0.512908211939004
              ]
            ],
            "outputWeightMatrix": [
              [
                0.582207655486759,
                0.2599235822984985,
                0.36139060986282046,
                -0.4918848023089829
              ],
              [
                -0.39721708293306074,
                -0.839833191348377,
                0.4952769712266638,
                0.5923678513743839
              ],
              [
                -0.08179621101447854,
                0.40208647874703984,
                0.30087414324173534,
                -0.22771812767614552
              ]
            ],
            "outputBiasVector": [
              0.1118651101220674,
              -0.012874773159395697,
              -0.2775497623934987
            ]
          },
          {
            "inputBiasVector": [
              0.7407366252580521,
              -0.16610459851884524,
              1.0151014622760435,
              0.2304041799136074
            ],
            "weightMatrix": [
              [
                0.7836817079719368,
                0.968074947884846,
                -0.8637487121931149,
                0.1228282472084112,
                -1.277579335626617,
                0.37132909109793305
              ],
              [
                0.8090080587286849,
                -0.6377572635942843,
                -0.7262911521711324,
                0.12122821535827064,
                0.16270641109849163,
                0.2876040843272294
              ],
              [
                -0.7149582255483464,
                -0.3999362664147432,
                0.5254709959999876,
                0.6065698144257635,
                -0.241639563214509,
                -0.7531698956490225
              ],
              [
                -0.013782438355346708,
                -0.5476978456390792,
                -0.2582911470905369,
                0.7668871256436978,
                0.6837785235751587,
                -0.21054224554875872
              ]
            ],
            "outputWeightMatrix": [
              [
                0.39265976789519563,
                0.1136617114151667,
                0.9003707916242389,
                -0.56181806450219
              ],
              [
                -0.4409938762331047,
                -0.839833191348377,
                0.5209565845093533,
                0.6285107849808254
              ],
              [
                -0.12322143101386542,
                0.4676397543163608,
                0.28269778558599074,
                -0.258198853659828
              ]
            ],
            "outputBiasVector": [
              0.1118651101220674,
              -0.11838604884500556,
              -0.2775497623934987
            ]
          },
          {
            "inputBiasVector": [
              0.5979743207060053,
              -0.19589106375086296,
              0.889180375951792,
              0.2348936924637805
            ],
            "weightMatrix": [
              [
                0.9699710758128336,
                0.8913194032194309,
                -0.8637487121931149,
                0.05707786923855172,
                -1.0763454323396635,
                0.40343487692324465
              ],
              [
                0.9231651033766722,
                -0.7802464525195111,
                -0.8315556166281738,
                0.14894796347871467,
                0.16270641109849163,
                0.1280536147837708
              ],
              [
                -0.8823225792389524,
                -0.23348805260068728,
                0.46479194199625945,
                0.53680535015063,
                -0.241639563214509,
                -0.6681476395117995
              ],
              [
                0.14681640713891037,
                -0.5963247011926472,
                -0.05482022556044752,
                0.7668871256436978,
                0.6850274720095797,
                -0.32508378791714765
              ]
            ],
            "outputWeightMatrix": [
              [
                0.582207655486759,
                0.3145828658455541,
                0.5301732394706746,
                -0.56181806450219
              ],
              [
                -0.39721708293306074,
                -0.839833191348377,
                0.4952769712266638,
                0.5923678513743839
              ],
              [
                -0.2121044175398064,
                0.43511773063410375,
                0.30087414324173534,
                -0.22771812767614552
              ]
            ],
            "outputBiasVector": [
              0.1118651101220674,
              -0.012874773159395697,
              -0.2775497623934987
            ]
          },
          {
            "inputBiasVector": [
              0.7407366252580521,
              -0.16610459851884524,
              1.0151014622760435,
              0.29085133962000054
            ],
            "weightMatrix": [
              [
                0.9090168048529226,
                0.968074947884846,
                -0.8637487121931149,
                0.1228282472084112,
                -1.277579335626617,
                0.37132909109793305
              ],
              [
                0.8090080587286849,
                -0.6377572635942843,
                -0.6883049927512098,
                0.28045635395568047,
                0.16270641109849163,
                0.12060805030851192
              ],
              [
                -0.7149582255483464,
                -0.3999362664147432,
                0.5254709959999876,
                0.6065698144257635,
                -0.241639563214509,
                -0.7531698956490225
              ],
              [
                -0.013782438355346708,
                -0.5476978456390792,
                -0.2582911470905369,
                0.7668871256436978,
                0.6837785235751587,
                -0.21054224554875872
              ]
            ],
            "outputWeightMatrix": [
              [
                0.5820035324524173,
                0.1136617114151667,
                0.9003707916242389,
                -0.56181806450219
              ],
              [
                -0.4409938762331047,
                -0.839833191348377,
                0.5209565845093533,
                0.6285107849808254
              ],
              [
                -0.13111284215894056,
                0.4676397543163608,
                0.28269778558599074,
                -0.258198853659828
              ]
            ],
            "outputBiasVector": [
              0.1118651101220674,
              -0.11838604884500556,
              -0.2775497623934987
            ]
          },
          {
            "inputBiasVector": [
              0.7407366252580521,
              -0.16610459851884524,
              1.0151014622760435,
              0.29085133962000054
            ],
            "weightMatrix": [
              [
                0.7836817079719368,
                0.968074947884846,
                -0.8637487121931149,
                0.1228282472084112,
                -1.277579335626617,
                0.37132909109793305
              ],
              [
                0.8090080587286849,
                -0.6377572635942843,
                -0.6883049927512098,
                0.28045635395568047,
                0.16270641109849163,
                0.12060805030851192
              ],
              [
                -0.7149582255483464,
                -0.3999362664147432,
                0.5254709959999876,
                0.6065698144257635,
                -0.241639563214509,
                -0.7531698956490225
              ],
              [
                -0.013782438355346708,
                -0.5476978456390792,
                -0.2582911470905369,
                0.7668871256436978,
                0.6837785235751587,
                -0.21054224554875872
              ]
            ],
            "outputWeightMatrix": [
              [
                0.5820035324524173,
                0.1136617114151667,
                0.9003707916242389,
                -0.56181806450219
              ],
              [
                -0.4409938762331047,
                -0.839833191348377,
                0.5209565845093533,
                0.6285107849808254
              ],
              [
                -0.12322143101386542,
                0.4676397543163608,
                0.28269778558599074,
                -0.258198853659828
              ]
            ],
            "outputBiasVector": [
              0.1118651101220674,
              -0.11838604884500556,
              -0.2775497623934987
            ]
          }
        ]
      }    
    new AITrainer(aiData);
    // Or to start a new training batch :
    //new AITrainer();
});
