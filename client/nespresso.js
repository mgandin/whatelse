// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Coffees = new Meteor.Collection("coffees");
Lists = new Meteor.Collection("lists");
Selections = new Meteor.Collection("selections");

// ID of currently selected list
Session.set('list_id', null);

// ID of currently selected list
Session.set('coffee_id', null);

// When editing a list name, ID of the list
Session.set('editing_listname', null);

// When editing todo text, ID of the todo
Session.set('editing_linename', null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
Meteor.subscribe('lists', function() {
	if (!Session.get('list_id')) {
		var list = Lists.findOne({}, {
			sort : {
				timestamp : 1
			}
		});
		if (list)
			Router.setList(list._id);
	}
});

Meteor.subscribe('coffees', function() {
	if (!Session.get('coffee_id')) {
		var coffee = Coffees.findOne({}, {
			sort : {
				name : 1
			}
		});
	}
});

// Always be subscribed to the todos for the selected list.
Meteor.autosubscribe(function() {
	var list_id = Session.get('list_id');
	if (list_id) {
		Meteor.subscribe('lines', list_id);
		Meteor.subscribe('selections', list_id);
	}
});

// //////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function(selector, callbacks) {
	var ok = callbacks.ok || function() {
	};
	var cancel = callbacks.cancel || function() {
	};

	var events = {};
	events['keyup ' + selector + ', keydown ' + selector + ', focusout '
			+ selector] = function(evt) {
		if (evt.type === "keydown" && evt.which === 27) {
			// escape = cancel
			cancel.call(this, evt);

		} else if (evt.type === "keyup" && evt.which === 13
				|| evt.type === "focusout") {
			// blur/return/enter = ok/submit if non-empty
			var value = String(evt.target.value || "");
			if (value)
				ok.call(this, value, evt);
			else
				cancel.call(this, evt);
		}
	};
	return events;
};

var activateInput = function(input) {
	input.focus();
	input.select();
};

// //////// Lists //////////

Template.lists.lists = function() {
	return Lists.find({}, {
		sort : {
			timestamp : 1
		}
	});
};

Template.lists.events({
	'mousedown .list' : function(evt) { // select list
		Router.setList(this._id);
	},
	'click .list' : function(evt) {
		// prevent clicks on <a> from refreshing the page.
		evt.preventDefault();
	},
	'click .destroy' : function() {
		Lists.remove(this._id);
	},
	'dblclick .list' : function(evt, tmpl) { // start editing list name
		Session.set('editing_listname', this._id);
		Meteor.flush(); // force DOM redraw, so we can focus the edit field
		activateInput(tmpl.find("#list-name-input"));
	}
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events(okCancelEvents('#new-list', {
	ok : function(text, evt) {
		var id = Lists.insert({
			name : text,
			timestamp: (new Date()).getTime(),
		});
		Router.setList(id);
		evt.target.value = "";
	}
}));

Template.lists.events(okCancelEvents('#list-name-input', {
	ok : function(value) {
		Lists.update(this._id, {
			$set : {
				name : value
			}
		});
		Session.set('editing_listname', null);
	},
	cancel : function() {
		Session.set('editing_listname', null);
	}
}));

Template.lists.selected = function() {
	return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function() {
	return this.name ? '' : 'empty';
};

Template.lists.editing = function() {
	return Session.equals('editing_listname', this._id);
};

// //////// Lines //////////

Template.lines.any_list_selected = function() {
	return !Session.equals('list_id', null);
};

Template.lines.events(okCancelEvents('#new-line', {
	ok : function(text, evt) {
		var tag = Session.get('tag_filter');
		Lines.insert({
			text : text,
			list_id : Session.get('list_id'),
			done : false,
			timestamp : (new Date()).getTime(),
			tags : tag ? [ tag ] : []
		});
		evt.target.value = '';
	}
}));

Template.lines.lines = function() {
	// Determine which lines to display in main pane,
	// selected based on list_id and tag_filter.

	var list_id = Session.get('list_id');
	if (!list_id) {
		return {};
	}

	var sel = {
		list_id : list_id
	};

	var selections = Selections.find(sel, {
		sort : {
			owner_id : 1
		},
		fields : {owner_id: 1}
	}).fetch();
	var ownerIds = _.uniq(_.pluck(selections, "owner_id"));

	var user = Meteor.user();
	if (user && user._id && !_.contains(ownerIds, user._id)) {
		ownerIds = _.union(ownerIds, [user._id]);
	}

	var lines = _.map(ownerIds, function(uid) {
		return {
			owner_id: uid,
			list_id: list_id,
		};
	});
	return lines;
};

Template.lines.coffees = function() {
	return Coffees.find({}, {
		sort : {
			id : 1
		}
	});
};

Template.line_item.selections = function() {

	var line = this;
	var selections = {};
	var availableCoffees = _.pluck(Coffees.find({}, {
		sort : {
			id : 1
		}
	}).fetch(), "_id");
	console.log("Available coffees " + availableCoffees);

	var user = Meteor.user();
	var list_id = line.list_id;
	var owner_id = line.owner_id;
	if (user && user._id) {
		var existingSel = {
			list_id : list_id,
			owner_id : owner_id
		};
		selections = Selections.find(existingSel, {
			sort : {
				coffee_id : 1
			}
		}).fetch() || {};

	}
	console.log("Selections " + selections);

	var selectedCoffees = _.pluck(selections, "coffee_id");
	console.log("Selected coffees " + selectedCoffees);

	var missingCoffees = _.difference(availableCoffees, selectedCoffees);
	console.log("Missing coffees " + missingCoffees);
	

	var missingSelections = _.map(missingCoffees, function(coffee_id) { return {
		list_id : list_id,
		owner_id : owner_id,
		coffee_id: coffee_id,
		quantity: 0,
	}});
	console.log("Missing selections " + missingSelections);
	
	selections = _.union(selections, missingSelections);
	console.log("Completed selections " + selections);

	return selections;
};

Template.line_item.owner = function() {
	var user = Meteor.users.findOne({
		_id : this.owner_id
	});
	var label = this.owner_id;
	if (user && user.emails) {
		label = user.emails[0].address;
	}
	return label;
};

Template.line_item.tag_objs = function() {
	var line_id = this._id;
	return _.map(this.tags || [], function(tag) {
		return {
			line_id : line_id,
			tag : tag
		};
	});
};

Template.line_item.done_class = function() {
	return this.done ? 'done' : '';
};

Template.line_item.done_checkbox = function() {
	return this.done ? 'checked="checked"' : '';
};

Template.line_item.editing = function() {
	return Session.equals('editing_itemname', this._id);
};

Template.line_item.adding_tag = function() {
	return Session.equals('editing_addtag', this._id);
};

Template.line_item.events({
});

Template.table_cell.owner = function() {
	return this.owner_id == Meteor.user()._id;
};

Template.table_cell.events({
	'click .more' : function() {
		var selection = this;
		console.log('More');
		console.log(selection);
		if(selection._id) {
			console.log("Updating selection");
			Selections.update(selection._id, {$inc: {quantity: 1}});
		} else {
			selection.quantity = 1;
			var selectionId = Selections.insert(selection);
			console.log("Inserted selection " + selectionId);
		}
	},
	'click .less' : function() {
		var selection = this;
		console.log('Less');
		console.log(selection);
		if(selection._id) {
			console.log("Updating selection");
			Selections.update(selection._id, {$inc: {quantity: -1}});
		}
	},
});

// /////// Coffees //////////

// Pick out the unique tags from all todos in current list.
Template.coffees.coffees = function() {
	return Coffees.find({}, {
		sort : {
			name : 1
		}
	});
};

Template.coffees.events({});

// //////// Tracking selected list in URL //////////

var NespressoRouter = Backbone.Router.extend({
	routes : {
		":list_id" : "main"
	},
	main : function(list_id) {
		Session.set("list_id", list_id);
	},
	setList : function(list_id) {
		this.navigate(list_id, true);
	},
});

Router = new NespressoRouter;

Meteor.startup(function() {
	Backbone.history.start({
		pushState : true
	});
});
