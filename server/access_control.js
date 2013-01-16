var superAdminId = "80629187-3d49-407b-bf64-e6acb7a7a98c";

Meteor.startup(function() {

	var isOwner = function(userId, lines) {
		lines = _.array(lines);
		return _.all(lines, function(line) {
			return !line.owner_id || line.owner_id === userId;
		});
	};

	var isSuperAdmin = function(userId, lines) {
		lines = _.array(lines);
		return _.all(lines, function(line) {
			return !line.owner_id || line.owner_id === superAdminId;
		});
	};

	var isAnyone = function() {
		return true;
	};

	var isLoggedIn = function(userId) {
		return userId;
	};

	var isListOpened = function(userId, lines) {
		lines = _.array(lines);
		var listIds = _.keys(_.groupBy(lines, function(s) {return s.list_id;}));
		var lists = Lists.find({_id: {$in: listIds}}).fetch()
		return _.all(lists, function(l) {return !l.closed});
	};

	Groups.allow({
		insert : isLoggedIn,
		update : isOwner,
		remove : isOwner,
	});

	Memberships.allow({
		insert : isLoggedIn,
		update : isLoggedIn,
		remove : isLoggedIn,
	});

	Selections.allow({
		insert : _.and(isOwner, isListOpened),
		update : _.and(isOwner, isListOpened),
		remove : _.and(isOwner, isListOpened),
	});

	Lists.allow({
		insert : isLoggedIn,
		update : isOwner,
		remove : isOwner,
	});

	Coffees.allow({
		insert : isSuperAdmin,
		update : isSuperAdmin,
		remove : isSuperAdmin,
	});

});
