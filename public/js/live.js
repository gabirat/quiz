/* eslint-disable no-undef */
$(document).ready(function(){
	let socket = io();
	const QuestionDOM = {
		answers: [$("#ans0"),$("#ans1"),$("#ans2"),$("#ans3")],
		content: $($(".questionContent")[0]),
		questionNo: $($(".questionNo")[0]),
		participants: $("#participants")
	};
	socket.on("live-update", (data)=>{
		QuestionDOM.content.text(data.question.content);
		for(let i in QuestionDOM.answers){
			QuestionDOM.answers[i].text(data.question.answers[i]);
		}
		QuestionDOM.questionNo.text(`Pytanie ${data.question.questionNo}`);
		let participants = "";
		for(let i in data.participants){
			participants+=`<li>${data.participants[i].username} : ${data.participants[i].score} punktów</li>`;
		}
		QuestionDOM.participants.html(participants);
	});
});