/* eslint-disable no-undef */
let submit;
let lateJoin = false;
let timer;
let time;
let timeToAnswer;
$(document).ready(function () {
	let socket,
		username,
		answered = false;
	let locked = false;

	function stripHTMLTags(input) {
		return $("<div/>").text(input).html();
	}

	const QuestionDOM = { //question structure
		answers: [$("#ans0"), $("#ans1"), $("#ans2"), $("#ans3")],
		content: $($(".questionContent")[0]),
		questionNo: $($(".questionNo")[0])
	};

	function colorfulButtons() {
		QuestionDOM.answers[0].css({ "background": "red", "color": "white" });
		QuestionDOM.answers[1].css({ "background": "rgb(173, 156, 0)", "color": "white" });
		QuestionDOM.answers[2].css({ "background": "rgb(0, 49, 139)", "color": "white" });
		QuestionDOM.answers[3].css({ "background": "rgb(120, 0, 136)", "color": "white" });
	}

	function register() {
		let name = stripHTMLTags($("#name").val().trim());
		let surname = stripHTMLTags($("#surname").val().trim());
		let school = $("#school").val().trim();

		username = `${name} ${surname}`;
		if (username && !locked) {
			locked = true;
			socket = io();
			socket.emit("user-join", {
				username: username,
				school: school
			});
			submit = (n) => {
				if (!answered) {
					answered = true;
					socket.emit("answer", n);
					for (let o of QuestionDOM.answers) {
						o.css("background", "darkgray");
					}
					QuestionDOM.answers[n].css({ "background": "white", "color": "black" });
				}
			};
			socket.on("not-ready", () => {
				$($(".title_page")[0]).hide();
				$($(".not-ready")[0]).show();
			});

			socket.on("already-started", () => {
				lateJoin = true;
				$($(".title_page")[0]).hide();
				$($(".already-started")[0]).show();
			});

			socket.on("ready", () => {
				$($(".not-ready")[0]).hide();
				$($(".quiz")[0]).show();
			});

			socket.on("config", (cfg) => {
				timeToAnswer = cfg.timeToAnswer;
			});

			socket.on("next-question", data => {
				time = timeToAnswer;
				clearInterval(timer);
				if (lateJoin) {
					$($(".already-started")[0]).hide();
					$($(".quiz")[0]).show();
				}
				colorfulButtons();
				answered = false;
				QuestionDOM.content.text(data.content);
				for (let i in QuestionDOM.answers) {
					QuestionDOM.answers[i].text(data.answers[i]);
				}
				QuestionDOM.questionNo.text(`Pytanie ${data.questionNo}`);
				$("#timer").html(time--);
				timer = setInterval(() => {
					$("#timer").html(time--);
				}, 1000);
			});
			socket.on("results", (data) => {
				$($(".quiz")[0]).hide();
				$("#results-page").show();
				$("#first").html(`${data.ranking[0].username} : ${data.ranking[0].score}`);
				if (data.ranking[1]) $("#second").html(`${data.ranking[1].username} : ${data.ranking[1].score}`);
				if (data.ranking[2]) $("#third").html(`${data.ranking[2].username} : ${data.ranking[2].score}`);
			});
			socket.on("winner", data => {
				$("#results-page").hide();
				if (data.place == 1) {
					$("body").addClass("gold");
					$("#win-first").show();
					$($("#win-first > .secretHash")[0]).html(`Twój kod wygranej: ${data.code}`)
				}
				if (data.place == 2) {
					$("body").addClass("silver");
					$("#win-second").show();
					$($("#win-second > .secretHash")[0]).html(`Twój kod wygranej: ${data.code}`)
				}
				if (data.place == 3) {
					$("body").addClass("bronze");
					$("#win-third").show();
					$($("#win-third > .secretHash")[0]).html(`Twój kod wygranej: ${data.code}`)
				}
			});
		}
	}
	$("#start").on("click", () => {
		if ($("#gdpr").prop("checked") && $("#name").val() && $("#surname").val()) {
			register();
		}
		else {
			alert("Wypełnij wszystkie pola!");
		}
	});
});