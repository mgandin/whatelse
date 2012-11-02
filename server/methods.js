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
});
