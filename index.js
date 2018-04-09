/* eslint-disable no-undef */
const config = require("./config");
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = config.port;
/* eslint-disable no-console */
server.listen(port, ()=>{
	console.log(`[server] Listening on port ${port}...`);
});
app.use(express.static(path.join(__dirname, "public")));
app.use("/js", express.static(__dirname+"/node_modules/socket.io-client/dist"));
let users = [];
io.on("connection", socket =>{
	let registered = false;
	socket.on("user-join", username =>{
		if(registered) return;
		if(username.length>25){
			username = username.slice(0,25);
		}
		socket.username = username;
		users[socket.username+"."+socket.id] = {
			joined: new Date(), 
			username: username,
			id: socket.id,
			ip: socket.request.connection.remoteAddress,
			correctAnswers: 0
		};
		console.log(`[server] New user: ${users[username+"."+socket.id]}`);
		registered = true;
	});
	socket.on("user-leave", () => {
		if(registered){
			delete users[socket.username+"."+socket.id];
			console.log(`[server] User disconnected: ${socket.username}`);
		} 
	});
});