var match = window.location.hash.match(/^\#\?join\/(.*)$/);
if (match) {
	window.location.hash = '';
	var token = match[1];
	console.log("Detected join token " + token);
	Session.set("join", token);
}

Meteor.autosubscribe(function() {
	var token = Session.get('join');
	var user = Meteor.user();
	if (token && user) {
		console.log("Joining " + token);
		Meteor.call('join', token, function(error, result) {
			if (error) {
				console.log("Error " + error);
			} else {
				console.log("Joined " + result);
				if(result) {
					Router.setGroup(result);
				}
			}
			Session.set("join", null);
		});
	}
});
