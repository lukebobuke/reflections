const db = require("../db");

// Get all betas
async function getAllBetas(req, res) {
  res.json(await db.betas || []);
}

// Create a new beta
async function createBeta(req, res) {
  const { name } = req.body;
  if (!name) {
    res.status(400).send("Name is required");
    return;
  }
  const betas = db.betas || [];
  const newBeta = { id: betas.length + 1, name };
  betas.push(newBeta);
  res.status(201).json(newBeta);
}

// Get beta by ID
async function getBetaById(req, res) {
  const { betaId } = req.params;
  const beta = await db.getBetaById(Number(betaId));
  if (!beta) {
    res.status(404).send("Beta not found");
    return;
  }
  res.json(beta);
}

// Update beta by ID
async function updateBeta(req, res) {
  const { betaId } = req.params;
  const { name } = req.body;
  const betas = db.betas || [];
  const beta = betas.find(b => b.id === Number(betaId));
  if (!beta) {
    res.status(404).send("Beta not found");
    return;
  }
  if (name) beta.name = name;
  res.json(beta);
}

// Delete beta by ID
async function deleteBeta(req, res) {
  const { betaId } = req.params;
  let betas = db.betas || [];
  const index = betas.findIndex(b => b.id === Number(betaId));
  if (index === -1) {
    res.status(404).send("Beta not found");
    return;
  }
  const deleted = betas.splice(index, 1);
  res.json(deleted[0]);
}

module.exports = {
  getAllBetas,
  createBeta,
  getBetaById,
  updateBeta,
  deleteBeta
};