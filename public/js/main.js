/* eslint-disable no-undef */
$(document).ready(function(){
	let socket,
		username;
	function stripHTMLTags (input) {
		return $("<div/>").text(input).html();
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
			socket.on("ready", ()=>{
				document.write("todo: waiting for quiz (user: "+username);
				socket.on("next-question", data =>{
					//handle questions
				});
			});
		}
	}
	$("#start").on("click", ()=>{
		register();
	});
});