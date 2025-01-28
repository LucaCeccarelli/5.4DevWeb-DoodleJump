class AI {
  constructor(
    inputBiasVector,
    weightMatrix,
    outputWeightMatrix,
    outputBiasVector
  ) {
    this.inputBiasVector = inputBiasVector;
    this.weightMatrix = weightMatrix;
    this.outputWeightMatrix = outputWeightMatrix;
    this.outputBiasVector = outputBiasVector;
    this.inputVector = null;
  }

  // Method to normalize the output
  normalize(outputVector) {
    let max = Math.max(...outputVector);
    let index = outputVector.indexOf(max);
    return index === 0 ? -1 : index === 1 ? 1 : 0;
  }

  // Method for linear transformation
  linearTransformation(inputVector, weightMatrix, biasVector) {
    let resultVector = Array(weightMatrix.length).fill(0);

    for (let i = 0; i < weightMatrix.length; i++) {
      for (let j = 0; j < inputVector.length; j++) {
        resultVector[i] += inputVector[j] * weightMatrix[i][j];
      }
      resultVector[i] += biasVector[i];
    }

    return this.activation(resultVector);
  }

  // Method for the ReLU activation function
  activation(vector) {
    return vector.map((val) => (val < 0 ? 0 : val));
  }

  // Method to compute the final vector (output)
  computeOutput() {
    if (!this.inputVector) {
      throw new Error("inputVector is not defined!");
    }

    // First calculation (input → hidden layer)
    const hiddenVector = this.linearTransformation(
      this.inputVector,
      this.weightMatrix,
      this.inputBiasVector
    );

    // Second calculation (hidden layer → output)
    const outputVector = this.linearTransformation(
      hiddenVector,
      this.outputWeightMatrix,
      this.outputBiasVector
    );

    return this.normalize(outputVector);
  }
}
