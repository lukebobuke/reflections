//import mongoose
const mongoose = require("mongoose");

// Example:
// const alphaSchema = new mongoose.Schema({...});
const alphaSchema = new mongoose.Schema({
    // define your schema here
});

// export the model
module.exports = mongoose.model("Alpha", alphaSchema);