Groups = new Meteor.Collection("groups");

Meteor.publish('groups', function() {
	var groupIds = _.pluck(Memberships.find({
		user_id: this.userId()
	}).fetch(), 'group_id')
	return Groups.find({
		id: {
			$in: groupIds
		}
	});
});

Memberships = new Meteor.Collection("memberships");

Meteor.publish('memberships', function() {
	return Memberships.find({
		user_id: this.userId()
	});
});

// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function(group_id) {
	return Lists.find({
		group_id: group_id
	});
});

// Coffees
Coffees = new Meteor.Collection("coffees");

Meteor.publish('coffees', function() {
	return Coffees.find();
});

// Selections
Selections = new Meteor.Collection("selections");

Meteor.publish('selections', function(list_id) {
	return Selections.find({
		list_id : list_id
	});
});

Meteor.publish("allUserData", function() {
	return Meteor.users.find({}, {
		fields : {
			'username' : 1,
			'emails' : 1,
		}
	});
});
