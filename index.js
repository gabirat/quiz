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
app.use("/css", express.static(__dirname+"/css"));
let users = [];
const stdin = process.openStdin();
io.on("connection", socket =>{
	stdin.addListener("data", function(d) {
		if(d.toString().trim() === "/start"){
			socket.emit("ready");
			//TODO: implement looping over a questions array with timeouts for each question
			socket.emit("next-question", {
				content: "Test question 1",
				answers: [
					"foo", "bar", "haha", "yes"
				],
				questionNo: 1
			});
		}
	});
	let registered = false;
	socket.on("user-join", data =>{
		if(registered) return;
		socket.username = data.username;
		users[socket.username+"."+socket.id] = {
			joined: new Date(), 
			username: socket.username,
			id: socket.id,
			ip: socket.request.connection.remoteAddress,
			correctAnswers: 0,
			school: data.school
		};
		console.log(`[server] User connected: ${socket.username}`);
		console.dir(users);
		registered = true;
		socket.emit("not-ready");
	});
	socket.on("user-leave", () => {
		if(registered){
			delete users[socket.username+"."+socket.id];
			console.log(`[server] User disconnected: ${socket.username}`);
		} 
	});
});