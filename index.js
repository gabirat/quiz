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
const questions = require("./questions_db.json");
const stdin = process.openStdin();
let started = false;
const liveBoard = {
	timeRemaining: 0,
	noParticipants: 0
};
let timer;
let secondsSinceQuizStarted = 0;
let currentQuestionNo = 0;

function startQuiz() {
	started = true;
	io.emit("ready");
	emitQuestion(currentQuestionNo++);
	updateTimer = setInterval(()=>{
		let u = [];
		for(let i in users){
			u.push({
				username: users[i].username,
				score: users[i].score
			});
		}
		io.emit("live-update", {
			question: {
				content: questions[currentQuestionNo-1].content,
				answers: questions[currentQuestionNo-1].answers,
				questionNo: currentQuestionNo
			},
			participants: [...u]
		});
	}, 1000);
	timer = setInterval(()=>{
		secondsSinceQuizStarted++;
		if(secondsSinceQuizStarted % Number(config.timeToAnswer) == 0){
			if(currentQuestionNo === questions.length){
				clearInterval(timer);
				clearInterval(updateTimer);
				let ranking = [];
				for(let i in users) ranking.push({username: users[i].username, score: users[i].score});
				ranking.sort(function(a,b){
					return b.score-a.score;
				});
				console.log(ranking);
				io.emit("results", {
					ranking: ranking
				});
			}
			else emitQuestion(currentQuestionNo++);
		}
	}, 1000);
}

function emitQuestion(qNumber) {
	for(let i in users){
		users[i].answered = false;
	}
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
	socket.on("user-join", data =>{
		if(registered) return;
		socket.username = data.username;
		users[socket.username+"."+socket.id] = {
			joined: new Date(), 
			username: socket.username,
			id: socket.id,
			ip: socket.request.connection.remoteAddress,
			score: 0,
			answered: false,
			school: data.school
		};
		console.log(`[server] User connected: ${socket.username}`);
		console.dir(users);
		registered = true;
		if(!started)
			socket.emit("not-ready");
		else
			socket.emit("already-started");
	});
	socket.on("user-leave", () => {
		if(registered){
			delete users[socket.username+"."+socket.id];
			console.log(`[server] User disconnected: ${socket.username}`);
		} 
	});
	socket.on("answer", n =>{
		if(!users[socket.username+"."+socket.id].answered){
			users[socket.username+"."+socket.id].answered = true;
			if(questions[currentQuestionNo-1].correct == n){
				users[socket.username+"."+socket.id].score++;
				console.log(`User ${socket.username} submitted the correct answer!`);
			}
			else console.log(`User ${socket.username} submitted the wrong answer!`);
		}
	});
});