<!-- @format -->

# backend_practice

## Project Architecture

This app follows a modular, organized structure for maintainability and scalability. The main components are:

-   **app.js**: The main entry point. Sets up the Express server, middleware, routers, and error handling.
-   **/routes**: Contains route modules for different resources (e.g., `alphaRouter.js`, `betaRouter.js`, `indexRouter.js`). Each router handles a specific set of endpoints.
-   **/controllers**: Contains controller modules that implement the business logic for each resource. Controllers are called by routers.
-   **/models**: Contains data access logic and database interaction (e.g., `db.js`). Models abstract the data layer from the rest of the app.
-   **/middleware**: Contains custom middleware such as logging and error handling.
-   **/public**: Contains static assets (CSS, JS, images) served to the client.
-   **/views**: Contains EJS templates for server-side rendering of HTML pages. Includes partials for reusable layout components.
-   **/components**: (optional) Contains additional front-end components or styles for specific features.

### Request Flow

1. **Request** → **Router** (`/routes`) → **Controller** (`/controllers`) → **Model** (`/models`) → **Response**
2. Middleware (e.g., logger, errorHandler) is applied globally or per-route as needed.
3. Static files are served from `/public`.
4. Views are rendered using EJS templates from `/views`.

### Example File Structure

```
backend_practice/
├── app.js
├── package.json
├── /routes
│   └── indexRouter.js
├── /controllers
│   └── indexController.js
├── /models
│   ├── db.js
│   └── userModel.js
├── /middleware
│   ├── logger.js
│   └── errorHandler.js
├── /public
│   ├── styles.css
│   └── script.js
├── /views
│   ├── index.ejs
│   └── layout.ejs
└── /components
    ├── navbar.ejs
    └── footer.ejs
```
