import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import * as log from "loglevel";

// Create Express server
const app = express();

// dotenv configuration
const result = dotenv.config();
if (result.error) {
    throw result.error;
}

// loglevel configuration
log.setDefaultLevel(log.levels.INFO);

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("src/public"));

export default app;
