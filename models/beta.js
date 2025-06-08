// Import mongoose
const mongoose = require("mongoose");

const betaSchema = new mongoose.Schema({
    // define your schema here
});

// Export the model
module.exports = mongoose.model("Beta", betaSchema);