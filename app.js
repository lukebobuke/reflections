/** @format */

//import modules
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("node:path");
const session = require("express-session");
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
app.use(errorHandler);
app.use(
	session({
		secret: "your-secret-key", // use a secure secret in production
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false }, // set to true if using HTTPS
	})
);
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

//get port from env file
const port = process.env.PORT || 3000;

//bootstrap server
app.listen(port, () => {
	console.log(`My first Express app!  Listening on port ${port}`);
});
