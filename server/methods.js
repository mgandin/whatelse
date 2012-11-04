Meteor.methods({
	fetchNespressoIndex : function() {
		var result = Meteor.http.get("http://www.nespresso.com/index.php?id=205&flux=xml", {});
		return result;
	},
	fetchNespressoDoc : function(docRelativeUrl) {
		var fullUrl = "http://www.nespresso.com/" + docRelativeUrl;
		var result = Meteor.http.get(fullUrl, {});
		return result;
	},
	invite : function(groupId, email) {
		var group = Groups.findOne({id: groupId});
		if (group) {
		    var token = group._id;
			var url = Meteor.absoluteUrl('#?join/' + token);
			Email.send({
				to : email,
				from : Meteor.accounts.emailTemplates.from,
				subject : "What else - Invitation to join group " + group.name,
				text : url,
			});
		}
	},
	join : function(token) {
		var group = Groups.findOne({_id: token});
		var userId = this.userId();
		if (group && userId) {
			console.log("Joining " + userId + " to " + group.id);
			Memberships.insert({group_id: group.id, user_id: userId});
			return "ok";
		}
		return "error";
	},
});
