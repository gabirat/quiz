/* eslint-disable no-undef */
const config = require("./config");
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const fs = require("fs");
const port = config.port;
/* eslint-disable no-console */
server.listen(port, ()=>{
	console.log(`[server] Listening on port ${port}...`);
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/js", express.static(__dirname+"/node_modules/socket.io-client/dist"));
app.use("/css", express.static(__dirname+"/css"));

let users = [];
const questions = JSON.parse(fs.readFileSync("questions_db.json","utf-8"));
const stdin = process.openStdin();
const liveBoard = {
	timeRemaining: 0,
	noParticipants: 0
};

let timer;
let secondsSinceQuizStarted = 0;
let currentQuestionNo = 0;

function startQuiz() {
	io.emit("ready");
	emitQuestion(currentQuestionNo++);
	timer = setInterval(()=>{
		secondsSinceQuizStarted++;
		if(secondsSinceQuizStarted % 20 == 0)
			emitQuestion(currentQuestionNo++);
	}, 1000);
}

function emitQuestion(qNumber) {
	io.emit("next-question", {
		content: questions[qNumber].content,
		answers: questions[qNumber].answers,
		questionNo: qNumber+1
	});
}

stdin.addListener("data", function(d) {
		if(d.toString().trim() === "/start"){
			startQuiz();
		}
		if(d.toString().trim() === "/users"){
			console.dir(users);
		}
	});

io.on("connection", socket =>{
	let registered = false;
	let answered = false;
	socket.on("user-join", data =>{
		if(registered) return;
		socket.username = data.username;
		users[socket.username+"."+socket.id] = {
			joined: new Date(), 
			username: socket.username,
			id: socket.id,
			ip: socket.request.connection.remoteAddress,
			score: 0,
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
	socket.on("answer", n =>{
		if(!answered){
			answered = true;
			if(questions[0].correct == n){
				users[socket.username+"."+socket.id].score++;
				console.log(`User ${socket.username} submitted the correct answer!`);
			}
			else console.log(`User ${socket.username} submitted the wrong answer!`);
		}
	})
});