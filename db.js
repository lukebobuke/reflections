
const alphas = [
  { id: 1, name: "Alpha One" },
  { id: 2, name: "Alpha Two" },
  { id: 3, name: "Alpha Three" },
];

const betas = [
    {id: 1, name: "Beta One"},
    {id: 2, name: "Beta Two"},
    {id: 3, name: "Beta Three"}
]

async function getAlphaById(alphaId) {
  return alphas.find(alpha => alpha.id === alphaId);
};

async function getBetaById(betaId) {
    return betas.find(beta => beta.id === betaId)
};

module.exports = { getAlphaById, getBetaById };