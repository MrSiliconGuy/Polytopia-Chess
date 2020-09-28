import * as http from "http";
import app from "./app";

export const server = http.createServer(app).listen(process.env.PORT);

server.on("listening", () => {
    console.info("Express server listening on port: " + process.env.PORT);
});
