/** @format */
const User = require("../models/userModel");

// Controller functions for user-related operations
// These functions handle the logic for rendering views and processing requests
// related to users. They interact with the User model to fetch or manipulate data.

// Get all users
// This function fetches all users from the database and renders the user page
const index = async (req, res) => {
	try {
		const result = await User.getAllUsers();
		const users = result.rows;
		res.render("userPage", { users, currentPage: "users" });
	} catch (err) {
		console.error("Error fetching users:", err);
		res.status(500).send("Internal Server Error");
	}
};

// Create a new user
// This function handles the creation of a new user. It validates the input,
// interacts with the User model to create the user, and handles any errors that may occur.
const create = async (req, res) => {
	const name = req.body.name?.trim();
	const email = req.body.email?.trim().toLowerCase();

	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}

	try {
		await User.createUser({ name, email });
		res.redirect("/users");
	} catch (err) {
		if (err.code === "23505") {
			res.status(400).send("That email already exists.");
		} else {
			console.error("Error creating user:", err);
			res.status(500).send("Internal Server Error");
		}
	}
};

// Get user by ID
// This function fetches a user by their ID and renders the user detail page.
const getUserById = async (req, res) => {
	const userId = req.params.userId;
	try {
		const result = await User.getUserById(userId);
		if (!result) {
			return res.status(404).send("User not found");
		}
		res.render("userDetail", { user: result });
	} catch (err) {
		console.error("Error fetching user:", err);
		res.status(500).send("Internal Server Error");
	}
};

// Update user
// This function handles the update of a user's information. It validates the input,
// interacts with the User model to update the user, and handles any errors that may occur.
// It also redirects to the user list page after a successful update.
const updateUser = async (req, res) => {
	const userId = req.params.userId;
	const { name, email } = req.body;

	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}

	try {
		await User.updateUser(userId, { name, email });
		res.redirect("/users");
	} catch (err) {
		console.error("Error updating user:", err);
		res.status(500).send("Internal Server Error");
	}
};

// Delete user
// This function handles the deletion of a user by their ID. It interacts with the User model
// to delete the user and handles any errors that may occur. It also redirects to the user
// list page after a successful deletion.
const deleteUser = async (req, res) => {
	const userId = req.params.userId;
	try {
		await User.deleteUser(userId);
		res.redirect("/users");
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).send("Internal Server Error");
	}
};

// Export the controller functions for use in routes
// This allows the functions to be imported and used in the route definitions.
module.exports = { index, create, getUserById, updateUser, deleteUser };
