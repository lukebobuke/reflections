/** @format */

const db = require("./db");

// Function to get all users from the database
// This function interacts with the database to fetch all users.
const getAllUsers = () => db.query("SELECT * FROM users");

// Function to create a new user in the database
// This function takes user data as input and interacts with the database to create a new user.
const createUser = ({ name, email }) => {
	// Assume inputs are already cleaned in the controller
	return db.query("INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *", [name, email]);
};

module.exports = { getAllUsers, createUser };
