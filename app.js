//import modules
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("node:path");

//import custom middleware
const logger = require(("./middleware/logger"));
const errorHandler = require("./middleware/errorHandler");

const alphaRouter = require("./routes/alphaRouter");
const betaRouter = require("./routes/betaRouter");
const indexRouter = require("./routes/indexRouter");

//use EJS as template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//serve public files
app.use(express.static(__dirname + "/public"))

//middleware
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app-level custom middleware
app.use(logger);
app.use(errorHandler);

//route routers
app.use("/alphas", alphaRouter);
app.use("/betas", betaRouter);
app.use("/", indexRouter);

//serve 404 page
app.use((req, res) => {
    res.status(404).sendFile(__dirname + "/public/404.html")
})

//get port from env file
const port = process.env.PORT || 3000;

//bootstrap server
app.listen(port, () => {
    console.log(`My first Express app!  Listening on port ${port}`)
})
