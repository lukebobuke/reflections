/** @format */

const db = require("./db");

// Function to get all users from the database
// This function interacts with the database to fetch all users.
const getAllUsers = () => db.query("SELECT * FROM users");

// Function to create a new user in the database
// This function takes user data as input and interacts with the database to create a new user.
const createUser = ({ name, email, password }) => {
	// Assume inputs are already cleaned in the controller
	return db.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *", [name, email, password]);
};

const getUserByEmail = async (email) => {
	const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
	if (!user.rows || user.rows.length === 0) {
		throw new Error("User not found");
	}
	return user.rows[0]; // returns an object with all columns as properties
};

async function getUserById(userId) {
	const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
	return result.rows[0]; // <-- must return the user object, not result
}

module.exports = { getAllUsers, createUser, getUserByEmail, getUserById };
