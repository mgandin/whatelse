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
			return !line.owner_id || line.owner_id === "6965a5a3-0697-413b-839c-6699bed4fece";
		});
	};

	var isAnyone = function() {
		return true;
	};

	var isListOpened = function(userId, lines) {
		lines = _.array(lines);
		var listIds = _.keys(_.groupBy(lines, function(s) {return s.list_id;}));
		var lists = Lists.find({_id: {$in: listIds}}).fetch()
		return _.all(lists, function(l) {return !l.closed});
	};

	Groups.allow({
		insert : isAnyone,
		update : isOwner,
		remove : isOwner,
	});

	Memberships.allow({
		insert : isAnyone,
		update : isAnyone,
		remove : isAnyone,
	});

	Selections.allow({
		insert : _.and(isOwner, isListOpened),
		update : _.and(isOwner, isListOpened),
		remove : _.and(isOwner, isListOpened),
	});

	Lists.allow({
		insert : isAnyone,
		update : isOwner,
		remove : isOwner,
	});

	Coffees.allow({
		insert : isSuperAdmin,
		update : isSuperAdmin,
		remove : isSuperAdmin,
	});

});
