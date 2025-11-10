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

// Replace the previous unconditional DB / session setup with a guarded version.

const session = require("express-session");
const pg = require("pg");
let pool = null;

const databaseUrl =
	process.env.DATABASE_URL ||
	(process.env.PGHOST
		? `postgres://${encodeURIComponent(process.env.PGUSER || "postgres")}:${encodeURIComponent(process.env.PGPASSWORD || "")}@${
				process.env.PGHOST
		  }:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "reflections"}`
		: undefined);

if (databaseUrl) {
	// Only require connect-pg-simple when we actually will use it (avoids MODULE_NOT_FOUND if not installed)
	let PgSession;
	try {
		PgSession = require("connect-pg-simple")(session);
	} catch (err) {
		console.warn("connect-pg-simple not available; falling back to MemoryStore for sessions.", err.message || err);
		PgSession = null;
	}

	// create pool
	pool = new pg.Pool({
		connectionString: databaseUrl,
		ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
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

	if (PgSession) {
		// Use PG-backed session store
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
		// fallback to MemoryStore if PgSession couldn't be loaded
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
	// No DB configured — do not attempt to connect. Use MemoryStore and warn clearly.
	console.warn(
		"NO DATABASE CONFIGURED: databaseUrl is not set. Using in-memory session store. Database-backed features (signup/login) will fail until DATABASE_URL is set."
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
