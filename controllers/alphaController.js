const db = require("../db");

// Get all alphas
async function getAllAlphas(req, res) {
  // For in-memory db, just return the array
  res.json(await db.alphas || []);
}

// Create a new alpha
async function createAlpha(req, res) {
  const { name } = req.body;
  if (!name) {
    res.status(400).send("Name is required");
    return;
  }
  const alphas = db.alphas || [];
  const newAlpha = { id: alphas.length + 1, name };
  alphas.push(newAlpha);
  res.status(201).json(newAlpha);
}

// Get alpha by ID
async function getAlphaById(req, res) {
  const { alphaId } = req.params;
  const alpha = await db.getAlphaById(Number(alphaId));
  if (!alpha) {
    res.status(404).send("Alpha not found");
    return;
  }
  res.json(alpha);
}

// Update alpha by ID
async function updateAlpha(req, res) {
  const { alphaId } = req.params;
  const { name } = req.body;
  const alphas = db.alphas || [];
  const alpha = alphas.find(a => a.id === Number(alphaId));
  if (!alpha) {
    res.status(404).send("Alpha not found");
    return;
  }
  if (name) alpha.name = name;
  res.json(alpha);
}

// Delete alpha by ID
async function deleteAlpha(req, res) {
  const { alphaId } = req.params;
  let alphas = db.alphas || [];
  const index = alphas.findIndex(a => a.id === Number(alphaId));
  if (index === -1) {
    res.status(404).send("Alpha not found");
    return;
  }
  const deleted = alphas.splice(index, 1);
  res.json(deleted[0]);
}

module.exports = {
  getAllAlphas,
  createAlpha,
  getAlphaById,
  updateAlpha,
  deleteAlpha
};