/* eslint-disable no-undef */
$(document).ready(function(){
	let socket,
		username;
	function stripHTMLTags (input) {
		return $("<div/>").text(input).html();
	}
	function validateUsername () {
		username = stripHTMLTags($("#username").val().trim());
		if (username) {
			socket = io();
			socket.emit("user-join", username);
			socket.on("ready", ()=>{
				document.write("todo: waiting for quiz");
			});
		}
	}
	$("#login").on("click", ()=>{
		validateUsername();
	});
});