Meteor.startup(function() {

	var isOwner = function(userId, lines) {
		return _.all(lines, function(line) {
			return !line.owner_id || line.owner_id === userId;
		});
	};

	var isSuperAdmin = function(userId, lines) {
		return _.all(lines, function(line) {
			return !line.owner_id || line.owner_id === "6965a5a3-0697-413b-839c-6699bed4fece";
		});
	};

	var isAnyone = function() {
		return true;
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
		insert : isAnyone,
		update : isOwner,
		remove : isOwner,
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
