/* eslint-disable no-undef */
const config = require("./config");
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const hash = require("password-hash");
const port = config.port;
/* eslint-disable no-console */
server.listen(port, ()=>{
	console.log(`[server] Listening on port ${port}...`);
	console.log(`[server] Amount of max winners in this instance: ${config.maxWinners}`);
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/js", express.static(__dirname+"/node_modules/socket.io-client/dist"));
app.use("/css", express.static(__dirname+"/css"));

let users = [];
const questions = require("./questions_db.json");
const stdin = process.openStdin();
let started = false;
let timer;
let secondsSinceQuizStarted = 0;
let currentQuestionNo = 0;

function startQuiz() {
	started = true;
	io.emit("ready");
	io.emit("config", config);
	emitQuestion(currentQuestionNo++);
	updateTimer = setInterval(()=>{
		let u = [];
		for(let i in users){
			u.push({
				username: users[i].username,
				score: users[i].score
			});
		}
		u.sort((a,b)=>{
			return b.score-a.score;
		});
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
				for(let i in users) ranking.push({username: users[i].username, id: users[i].id, score: users[i].score});
				ranking.sort(function(a,b){
					return b.score-a.score;
				});
				io.emit("results", {
					ranking: ranking
				});
				let top = config.maxWinners <=3 ? ranking.slice(0, config.maxWinners) : ranking.slice(0,3);
				for(let i in top){
					let c = hash.generate(top[i].id);
					io.to(top[i].id).emit("winner", {
						place: Number(i)+Number(1),
						code: c
					});
					console.log(`[quiz] #${Number(i)+Number(1)}: ${users[top[i].id].username} (hash: ${c})`);
				}
				require("fs").writeFileSync(`rankdump${new Date().toISOString()}.json`, JSON.stringify(ranking));
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
		users[socket.id] = {
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
	socket.on("disconnect", () => {
		if(registered){
			delete users[socket.id];
			console.log(`[server] User disconnected: ${socket.username}`);
		} 
	});
	socket.on("answer", n =>{
		if(users[socket.id] && !users[socket.id].answered){
			users[socket.id].answered = true;
			if(questions[currentQuestionNo-1].correct == n){
				users[socket.id].score++;
				console.log(`[quiz] User ${socket.username} submitted the correct answer!`);
			}
			else console.log(`[quiz] User ${socket.username} submitted the wrong answer!`);
		}
	});
});
