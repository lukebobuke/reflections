/** @format */
// Import modules, middleware, routers, and database connection.
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("node:path");
const cors = require("cors");
const db = require("./models/db");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const indexRouter = require("./routes/indexRouter");
const loginRouter = require("./routes/loginRouter");
const shardRouter = require("./routes/shardRouter");
const populateUser = require("./middleware/populateUser");
const session = require("express-session");

// ----------------------------------------------------------------------------------------------------
// #region Port Setup
// ----------------------------------------------------------------------------------------------------
// Get port from env file
const port = process.env.PORT || 3000;
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region View Engine
// ----------------------------------------------------------------------------------------------------
// Use EJS as template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Static Files
// ----------------------------------------------------------------------------------------------------
// Serve public files
app.use(express.static(__dirname + "/public"));
// ----------------------------------------------------------------------------------------------------
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region DB Test Connection
// ----------------------------------------------------------------------------------------------------
// This is a test connection to the database. It connects to the database and runs a simple query to check if the connection is successful.
// If successful, it logs the current date and time from the database.
db.pool
	.connect()
	.then((client) => {
		return client
			.query("SELECT NOW()")
			.then((res) => {
				console.log("Connected to the database:", res.rows);
				client.release();
			})
			.catch((err) => {
				console.error("Error executing query:", err);
				client.release();
			});
	})
	.catch((err) => {
		console.error("Error connecting to the database:", err);
	});
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Middleware
// ----------------------------------------------------------------------------------------------------
// Middleware: CORS, JSON parsing, URL encoding, and static files with CORS headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	express.static(path.join(__dirname, "public"), {
		setHeaders: (res, path) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
		},
	})
);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Session Configuration
// ----------------------------------------------------------------------------------------------------
// Configure sessions
app.use(
	session({
		secret: "your-secret-key", // change this to something secure
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false }, // set to true if using HTTPS
	})
);

// Session middleware must come BEFORE populateUser!
app.use(populateUser);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region App-level Middleware
// ----------------------------------------------------------------------------------------------------
// App-level custom middleware: logger and error handler
app.use(logger);
app.use(errorHandler);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Routers
// ----------------------------------------------------------------------------------------------------
// Use routers: The loginRouter handles all requests to /login
app.use("/login", loginRouter);
app.use("/shards", shardRouter);
app.use("/", indexRouter);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region 404 Handler
// ----------------------------------------------------------------------------------------------------
// Serve 404 page
app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, "public", "404.html")); // Fixed path concatenation
});
// #endregion
// ----------------------------------------------------------------------------------------------------

// Bootstrap server: Start listening and handle startup errors
app.listen(port, () => {
	console.log(`My first Express app! Listening on port ${port}`);
}).on("error", (err) => {
	console.error("Failed to start server:", err); // Added error handling for server startup
});
