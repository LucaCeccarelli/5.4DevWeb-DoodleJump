class AI {
  constructor(
    vecteurBiaisEntree,
    matricePoids,
    matricePoidsSortie,
    vecteurBiaisSortie
  ) {
    this.vecteurBiaisEntree = vecteurBiaisEntree;
    this.matricePoids = matricePoids;
    this.matricePoidsSortie = matricePoidsSortie;
    this.vecteurBiaisSortie = vecteurBiaisSortie;
    this._vecteurEntree = null; // Propriété privée pour stocker le vecteur d'entrée
  }

  // Setter pour vecteurEntree
  set vecteurEntree(vecteur) {
    this._vecteurEntree = vecteur;
  }

  // Getter pour vecteurEntree
  get vecteurEntree() {
    return this._vecteurEntree;
  }

  // Méthode pour normaliser la sortie
  normalize(vecteurSortie) {
    let max = Math.max(...vecteurSortie);
    let index = vecteurSortie.indexOf(max);
    return index === 0 ? -1 : index === 1 ? 1 : 0;
  }

  // Méthode pour la transformation linéaire
  transformationLineaire(vecteurEntree, matricePoids, vecteurBiais) {
    let vecteurResultat = Array(matricePoids.length).fill(0);

    for (let i = 0; i < matricePoids.length; i++) {
      for (let j = 0; j < vecteurEntree.length; j++) {
        vecteurResultat[i] += vecteurEntree[j] * matricePoids[i][j];
      }
      vecteurResultat[i] += vecteurBiais[i];
    }

    return this.activation(vecteurResultat);
  }

  // Méthode pour la fonction d'activation ReLU
  activation(vecteur) {
    return vecteur.map((val) => (val < 0 ? 0 : val));
  }

  // Méthode pour calculer le vecteur final (sortie)
  computeOutput() {
    if (!this._vecteurEntree) {
      throw new Error("vecteurEntree n'est pas défini !");
    }

    // Premier calcul (entrée → couche cachée)
    const vecteurCache = this.transformationLineaire(
      this._vecteurEntree,
      this.matricePoids,
      this.vecteurBiaisEntree
    );

    // Deuxième calcul (couche cachée → sortie)
    const vecteurSortie = this.transformationLineaire(
      vecteurCache,
      this.matricePoidsSortie,
      this.vecteurBiaisSortie
    );

    return this.normalize(vecteurSortie);
  }
}

// Exemple d'utilisation
const vecteurEntree = [
  0.9, // magnitudeVecteurRouge
  0.8, // magnitudeVecteurVert
  0.11, // magnitudeVecteurJaune
  0.02, // magnitudeVecteurBleu
  0.6, // x doodle
  0.45, // y doodle
];

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

// Instancier la classe
const neuralNetwork = new AI(
  vecteurBiaisEntree,
  matricePoids,
  matricePoidsSortie,
  vecteurBiaisSortie
);
