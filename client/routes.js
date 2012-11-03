var NespressoRouter = Backbone.Router.extend({
	routes : {
		"about" : "about",
		":group_id" : "group",
		":group_id/:list_id" : "main",
	},
	about : function() {
		console.log("about");
//		$('#about').modal({});
	},
	group : function(group_id) {
		Session.set("group_id", group_id);
	},
	main : function(group_id, list_id) {
		Session.set("group_id", group_id);
		Session.set("list_id", list_id);
	},
	setGroup : function(group_id) {
		this.navigate(group_id, true);
	},
	setGroupList : function(group_id, list_id) {
		this.navigate(group_id + "/" + list_id, true);
	},
});

Router = new NespressoRouter;
