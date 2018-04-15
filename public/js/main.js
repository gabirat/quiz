/* eslint-disable no-undef */
let submit;

$(document).ready(function(){
	let socket,
		username,
		answered = false;

	function stripHTMLTags (input) {
		return $("<div/>").text(input).html();
	}

	const QuestionDOM = { //question structure
		answers: [$("#ans0"),$("#ans1"),$("#ans2"),$("#ans3")],
		content: $($(".questionContent")[0]),
		questionNo: $($(".questionNo")[0])
	};
	
	function colorfulButtons() {
		console.log("Chnged colors");
		QuestionDOM.answers[0].css({"background": "red", "color": "white"});
		QuestionDOM.answers[1].css({"background": "rgb(173, 156, 0)", "color": "white"});
		QuestionDOM.answers[2].css({"background": "rgb(0, 49, 139)", "color": "white"});
		QuestionDOM.answers[3].css({"background": "rgb(120, 0, 136)", "color": "white"});
	}

	function register () {
		let name = stripHTMLTags($("#name").val().trim());
		let surname = stripHTMLTags($("#surname").val().trim());
		let school = $("#school").val().trim();

		username = `${name} ${surname}`;
		if (username) {
			socket = io();
			socket.emit("user-join", {
				username: username,
				school: school
			});

			socket.on("not-ready", ()=>{
				$($(".title_page")[0]).hide();
				$($(".not-ready")[0]).show();
			});

			socket.on("ready", ()=>{
				$($(".not-ready")[0]).hide();
				$($(".quiz")[0]).show();
				submit = (n)=>{
					if(!answered){
						answered = true;
						socket.emit("answer", n);
						for(let o of QuestionDOM.answers){
							o.css("background", "darkgray");
						}
						QuestionDOM.answers[n].css({"background": "white", "color": "black"});
					}
				}
				socket.on("next-question", data =>{
					colorfulButtons();
					answered = false;
					QuestionDOM.content.text(data.content);
					for(let i in QuestionDOM.answers){
						QuestionDOM.answers[i].text(data.answers[i]);
					}
					QuestionDOM.questionNo.text(`Pytanie ${data.questionNo}`);
				});
			});
		}
	}
	$("#start").on("click", ()=>{
		register();
	});
});