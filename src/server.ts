import express from "express";
import * as http from "http";

const app = express();
export const server = http.createServer(app).listen(process.env.PORT);

app.use("/", express.static(__dirname + "/"));

server.on("listening", () => {
    console.info("Express server listening on port: " + process.env.PORT);
});
