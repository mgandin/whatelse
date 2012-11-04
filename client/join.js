var match = window.location.hash.match(/^\#\?join\/(.*)$/);
if (match) {
	window.location.hash = '';
	var token = match[1];
	console.log("Joining " + token);
	Meteor.call('join', token, function(error, result) {
		if(error) {
			console.log("Error " + error);
		} else {
			console.log("Joined " + result);
		}
	});
}
