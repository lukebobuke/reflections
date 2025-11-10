/** @format */

//import modules
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("node:path");
const compression = require("compression");
// const cors = require("cors");
const expressLayouts = require("express-ejs-layouts");

//import custom middleware
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const indexRouter = require("./routes/indexRouter");
const loginRouter = require("./routes/loginRouter");
const populateUser = require("./middleware/populateUser");
const shardRouter = require("./routes/shardRouter");
const voronoiRouter = require("./routes/voronoiRouter");
const sculptureRouter = require("./routes/sculptureRouter");
const shardController = require("./controllers/shardController");

// ----------------------------------------------------------------------------------------------------
// #region View Engine
// ----------------------------------------------------------------------------------------------------
//use EJS as template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Enable express-ejs-layouts
app.use(expressLayouts);
app.set("layout", "layout"); // looks for views/layout.ejs by default
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Static Files
// ----------------------------------------------------------------------------------------------------
//serve public files
app.use(express.static(__dirname + "/public"));
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Middleware
// ----------------------------------------------------------------------------------------------------
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	express.static(path.join(__dirname, "public"), {
		setHeaders: (res, path) => {
			res.set("Access-Control-Allow-Origin", "*");
		},
	})
);
app.use(compression());
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region App-level Middleware
// ----------------------------------------------------------------------------------------------------
//app-level custom middleware
app.use(logger);

// Replace the previous DB / session setup with the requested Pool snippet.
const session = require("express-session");
const { Pool } = require("pg"); // replaced previous pg require
let pool = null;

if (process.env.DATABASE_URL) {
	// Create a pool using DATABASE_URL and enable SSL (rejectUnauthorized: false)
	pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});

	// health log
	pool.connect()
		.then((client) => {
			client.release();
			console.log("Postgres pool connected");
		})
		.catch((err) => {
			console.error("Postgres pool connection error (will retry on demand):", err.message || err);
		});

	// use connect-pg-simple if available, otherwise fall back to MemoryStore
	let PgSession = null;
	try {
		PgSession = require("connect-pg-simple")(session);
	} catch (err) {
		console.warn("connect-pg-simple not available; falling back to MemoryStore for sessions.", err.message || err);
		PgSession = null;
	}

	if (PgSession) {
		app.use(
			session({
				store: new PgSession({
					pool: pool,
					tableName: "session",
				}),
				secret: process.env.SESSION_SECRET || "please-change-this-in-prod",
				resave: false,
				saveUninitialized: false,
				cookie: {
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 1000 * 60 * 60 * 24 * 7,
				},
			})
		);
	} else {
		console.warn("Using MemoryStore for sessions because connect-pg-simple was not available.");
		app.use(
			session({
				secret: process.env.SESSION_SECRET || "please-change-this-in-prod",
				resave: false,
				saveUninitialized: false,
			})
		);
	}
} else {
	// No DATABASE_URL provided — keep MemoryStore but warn
	console.warn(
		"NO DATABASE CONFIGURED: DATABASE_URL is not set. Using in-memory session store. Database-backed features (signup/login) will fail until DATABASE_URL is set."
	);
	app.use(
		session({
			secret: process.env.SESSION_SECRET || "please-change-this-in-prod",
			resave: false,
			saveUninitialized: false,
		})
	);
}

// Attach populateUser after session middleware
app.use(populateUser);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region Routers
// ----------------------------------------------------------------------------------------------------
//route routers
app.use("/login", loginRouter);
app.use("/api/points", voronoiRouter);
app.use("/shards", shardRouter);
app.use("/", indexRouter);
app.use("/api/sculptures", sculptureRouter);
app.get("/api/user-model", shardController.fetchUserModel);
// #endregion
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// #region 404 Handler
// ----------------------------------------------------------------------------------------------------
//serve 404 page
app.use((req, res) => {
	res.status(404).sendFile(__dirname + "/public/404.html");
});
// #endregion
// ----------------------------------------------------------------------------------------------------

//error handler middleware should be last
app.use(errorHandler);

//get port from env file
const port = process.env.PORT || 3000;

//bootstrap server
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
