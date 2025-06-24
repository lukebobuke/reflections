/** @format */

const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");


// This route handles fetching all users and rendering the user page.
userRouter.get("/", userController.index);

// This route handles the creation of a new user.
userRouter.post("/", userController.create);

// This route handles fetching a user by their ID.  
userRouter.get("/:userId", userController.getUserById);

// This route handles updating a user by their ID.
userRouter.put("/:userId", userController.updateUser);

// This route handles deleting a user by their ID.
userRouter.delete("/:userId", userController.deleteUser);


module.exports = userRouter;
