// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function() {
	return Lists.find();
});

// Coffees
Coffees = new Meteor.Collection("coffees");

Meteor.publish('coffees', function() {
	return Coffees.find();
});

// Selections
Selections = new Meteor.Collection("selections");

Meteor.publish('selections', function() {
	return Selections.find();
});

// Todos -- {text: String,
// done: Boolean,
// tags: [String, ...],
// list_id: String,
// timestamp: Number}
Lines = new Meteor.Collection("lines");

// Publish visible items for requested list_id.
Meteor.publish('lines', function(list_id) {
	return Lines.find({
		list_id : list_id
	});
});

Meteor.publish("allUserData", function() {
	return Meteor.users.find({}, {
		fields : {
			'username' : 1
		}
	});
});
