/** @format */
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

//----------------------------------------------------------------------------------------------------
// #region render pages
//----------------------------------------------------------------------------------------------------

const renderLoginPage = (req, res) => {
	res.render("loginPage", { currentPage: "login", user: req.user });
};

const renderSignupPage = (req, res) => {
	res.render("signupPage", { currentPage: "signup", user: req.user });
};

//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Create User
// This function handles the creation of a new user. It validates the input,
// interacts with the User model to create the user, and handles any errors that may occur.
//----------------------------------------------------------------------------------------------------
const createUser = async (req, res) => {
	const name = req.body.name?.trim();
	const email = req.body.email?.trim().toLowerCase();

	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}

	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		console.log("Hashed password:", hashedPassword);
		await userModel.createUser({ name, email, password: hashedPassword });
		// Wait for user to be created, then fetch the user object
		const user = await userModel.getUserByEmail(email);
		req.session.userId = user.id;
		res.redirect("/dashboard");
	} catch (err) {
		// Improve logging for connection errors
		if (err.code === "ECONNREFUSED" || (err.message && err.message.includes("ECONNREFUSED"))) {
			console.error("Database connection refused. Is DATABASE_URL set and reachable?", err);
			return res.status(502).send("Database unavailable");
		}
		if (err.code === "23505") {
			res.status(400).send("That email already exists.");
		} else if (err.code === "23502") {
			res.status(400).send("Name and email are required.");
		} else if (err.code === "23514") {
			res.status(400).send("Invalid email format.");
		} else if (err.code === "22001") {
			res.status(400).send("Input data is too long.");
		} else if (err.code === "23503") {
			res.status(400).send("Invalid foreign key reference.");
		} else {
			console.error("Error creating user:", err);
			res.status(500).send("Internal Server Error");
		}
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Login User
// This function handles user login. It checks the provided credentials against stored user data.
// If the credentials are valid, it redirects to the user list page; otherwise, it sends an error response.
//----------------------------------------------------------------------------------------------------
const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await userModel.getUserByEmail(email);
		console.log("Login attempt for:", email, "User found:", user && user.id);
		if (!user) {
			return res.status(401).send("Invalid email or password");
		}
		if (!user.password) {
			console.error("User object missing password property:", user.email);
			return res.status(500).send("Internal Server Error");
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).send("Invalid email or password");
		}
		// If the credentials are valid, set the user ID in the session and redirect to the user home page
		req.session.userId = user.id;
		req.session.save(function (err) {
			if (err) {
				console.error("Session save error:", err);
				// fallback: still redirect but log
			}
			return res.redirect("/shards"); // or send JSON if using fetch
		});
	} catch (err) {
		console.error("Error logging in user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Update User
// This function handles the update of a user's information. It validates the input,
// interacts with the User model to update the user, and handles any errors that may occur.
// It also redirects to the user list page after a successful update.
//----------------------------------------------------------------------------------------------------
const updateUser = async (req, res) => {
	const userId = req.params.userId;
	const { name, email } = req.body;

	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}

	try {
		await userModel.updateUser(userId, { name, email });
		res.redirect("/users");
	} catch (err) {
		console.error("Error updating user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Delete User
// This function handles the deletion of a user by their ID. It interacts with the User model
// to delete the user and handles any errors that may occur. It also redirects to the user
// list page after a successful deletion.
//----------------------------------------------------------------------------------------------------
const deleteUser = async (req, res) => {
	const userId = req.params.userId;
	try {
		await userModel.deleteUser(userId);
		res.redirect("/users");
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// Export the controller functions for use in routes
module.exports = { login, createUser, updateUser, deleteUser, renderLoginPage, renderSignupPage };
