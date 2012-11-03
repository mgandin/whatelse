// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Groups = new Meteor.Collection("groups");
Memberships = new Meteor.Collection("memberships");
Coffees = new Meteor.Collection("coffees");
Lists = new Meteor.Collection("lists");
Selections = new Meteor.Collection("selections");

// shipping fees
var shippingFees = new BigDecimal("5");
var freeShippingFeesThreshold = 200;

// ID of currently selected list
Session.set('list_id', null);

// ID of currently selected list
Session.set('coffee_id', null);

// When editing a list name, ID of the list
Session.set('editing_listname', null);

// When editing todo text, ID of the todo
Session.set('editing_linename', null);

Meteor.subscribe('memberships', function() {
});

Meteor.subscribe('groups', function() {
	if (!Session.get('group_id')) {
		var group = Groups.findOne({}, {
			sort : {
				name : 1
			}
		});
		if (group)
			Router.setGroup(group.id);
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
	var group_id = Session.get('group_id');
	if (group_id) {
		Meteor.subscribe('lists', group_id, function() {
			var list_id = Session.get('list_id');
			if(!list_id) {
				var list = Lists.findOne({}, {
					sort : {
						timestamp : 1
					}
				});
				if (list)
					Router.setGroupList(group_id, list._id);
			}
		});
	}
});

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

Template.groups.groups = function() {
	return Groups.find({}, {
		sort : {
			name : 1
		}
	});
};

Template.group.active = function() {
	return this.id == Session.get('group_id');
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
Template.body.events(okCancelEvents('#new-list', {
	ok : function(text, evt) {
		var groupId = Session.get('group_id');
		if(groupId) {
			var id = Lists.insert({
				group_id: groupId,
				name : text,
				timestamp: (new Date()).getTime(),
			});
			Router.setGroupList(groupId, id);
		}
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

var participantsIds = function() {

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

	return ownerIds;
};

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
	return pricedCoffees();
};

var totalPrice = function(selections, coffeesById) {
	var ten = new BigDecimal("10");
	return _.reduce(selections, function(total, s) { return total.add(new BigDecimal("" + s.quantity).multiply(new BigDecimal(coffeesById[s.coffee_id].price)).multiply(ten))}, BigDecimal.prototype.ZERO);
}

var totalCaps = function(selections) {
	return _.reduce(selections, function(total, s) { return total + s.quantity * 10}, 0);
}

Template.lines.total_caps = function() {

	var selections = {};
	var coffees = coffeesById();
	var list_id = Session.get('list_id');

	var sel = {
		list_id : list_id,
	};
	selections = Selections.find(sel).fetch();

	var total = totalCaps(selections, coffees);

	return total;
};

Template.lines.total_price = function() {

	var selections = {};
	var coffees = coffeesById();
	var list_id = Session.get('list_id');

	var sel = {
		list_id : list_id,
	};
	selections = Selections.find(sel).fetch();

	var caps = totalCaps(selections);
	var price = totalPrice(selections, coffees);
	if(caps < freeShippingFeesThreshold) {
		price = price.add(shippingFees);
	}

	return price;
};

Template.lines.shipping_fees = function() {
	var selections = {};
	var list_id = Session.get('list_id');

	var sel = {
		list_id : list_id,
	};
	selections = Selections.find(sel).fetch();
	var fees = BigDecimal.prototype.ZERO;
	var caps = totalCaps(selections);
	if(caps < freeShippingFeesThreshold) {
		fees = shippingFees;
	}

	return fees;
};

Template.line_item.selections = function() {

	var line = this;
	var selections = {};
	var coffees = coffeesById();
	var availableCoffees = _.keys(coffees);

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

	var selectedCoffees = _.pluck(selections, "coffee_id");

	var missingCoffees = _.difference(availableCoffees, selectedCoffees);
	
	var missingSelections = _.map(missingCoffees, function(coffee_id) { return {
		list_id : list_id,
		owner_id : owner_id,
		coffee_id: coffee_id,
		quantity: 0,
	}});
	
	selections = _.sortBy(_.union(selections, missingSelections), function(s) {return coffees[s.coffee_id].id});

	return selections;
};

var pricedCoffees = function() {
	return Coffees.find({price: {$type: 2}}, {
		sort : {
			id : 1
		}
	});
}

var coffeesById = function(coffees) {
	coffees = coffees || pricedCoffees().fetch();
	return _.reduce(coffees, function(idmap, c) {idmap[c.id] = c; return idmap}, {});
}

Template.line_item.total = function() {

	var line = this;
	var selections = {};
	var coffees = coffeesById();

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

	var total = totalPrice(selections, coffees);

	var caps = totalCaps(selections);
	if(caps < freeShippingFeesThreshold) {
		var participantCount = _.size(participantsIds());
		if(participantCount > 0) {
			var shippingFeesPerParticipant = shippingFees.divide(new BigDecimal("" + participantCount), 2, BigDecimal.prototype.ROUND_HALF_EVEN);
			total = total.add(shippingFeesPerParticipant);
		}
	}

	return total;
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

Template.table_cell.coffee = function() {
	var coffee = Coffees.findOne({id: this.coffee_id});
	return coffee && coffee.id || "";
};

Template.table_cell.events({
	'click .more-active' : function() {
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
	'click .less-active' : function() {
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
	return pricedCoffees();
};

Template.coffees.events({});

var updateCoffees = function() {
	fetchAndDiffCoffees({
		added: function(coffee) {
			console.log("Added " + coffee.id + " " + coffee.name + " = " + coffee.price);
			Coffees.insert(coffee);
		},
		removed: function(coffee) {
			console.log("Removed " + coffee.id + " " + coffee.name + " = " + coffee.price);
			Coffees.remove({id: coffee.id});
		},
		updated: function(oldCoffee, newCoffee) {
			console.log("Updated " + oldCoffee.id + " " + oldCoffee.name + " = " + oldCoffee.price + " -> " + newCoffee.price);
			Coffees.update({id: newCoffee.id}, newCoffee);
		},
		kept: function(coffee) {
			console.log("Kept " + coffee.id + " " + coffee.name + " = " + coffee.price);
		},
		diff: function(diff) {
		},
	});
}

var fetchAndDiffCoffees = function(options) {
	options = _.defaults(options || {}, {
		added: function(coffee) {
			console.log("Added " + coffee.id + " " + coffee.name + " = " + coffee.price);
		},
		removed: function(coffee) {
			console.log("Removed " + coffee.id + " " + coffee.name + " = " + coffee.price);
		},
		updated: function(oldCoffee, newCoffee) {
			console.log("Updated " + oldCoffee.id + " " + oldCoffee.name + " = " + oldCoffee.price + " -> " + newCoffee.price);
		},
		kept: function(coffee) {
			console.log("Kept " + coffee.id + " " + coffee.name + " = " + coffee.price);
		},
		diff: function(diff) {
		},
	});
	fetchCoffees(function(fetched) {
		var stored = coffeesById();
		var storedIds = _.keys(stored);
		var fetchedIds = _.pluck(fetched, "id");
		var addedIds = _.difference(fetchedIds, storedIds);
		var removedIds = _.difference(storedIds, fetchedIds);
		var keptIds = _.intersection(storedIds, fetchedIds);
		var coffeesDiff = {added: {}, removed: {}, updated: {}, kept: {}};
		_.each(addedIds, function(id) {
			var c = fetched[id];
			coffeesDiff.added[id] = c;
			options.added(c);
		});
		_.each(keptIds, function(id) {
			var storedCoffee = stored[id];
			var fetchedCoffee = fetched[id];
			if(storedCoffee.price != fetchedCoffee.price) {
				coffeesDiff.updated[id] = fetchedCoffee;
				options.updated(storedCoffee, fetchedCoffee);
			} else {
				coffeesDiff.kept[id] = storedCoffee;
				options.kept(storedCoffee);
			}
		});
		_.each(removedIds, function(id) {
			var c = stored[id];
			coffeesDiff.removed[id] = c;
			options.removed(c);
		});
		options.diff(coffeesDiff);
	});
}

var fetchCoffees = function(coffeesHandler) {
	Meteor.call('fetchNespressoIndex', function(error, result) {
		if(result) {
			var index = $.parseXML(result.content);
			var items = document.evaluate("//listeCafe/item", index, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
			var coffees = {};
			var count = items.snapshotLength;
			for (var i = 0; i < count; i++) {
			    var item = items.snapshotItem(i);
			    var id = item.getAttribute('id');
			    var name = item.getElementsByTagName('infoBulle')[0].textContent;
			    var url = item.getElementsByTagName('url')[0].getAttribute('href');
			    getCoffeePrice({id: id, name: name}, url, function(coffee) {
			    	console.log(coffee.id + ", "  + coffee.name + " = " + coffee.price + " \u20AC");
			    	coffees[coffee.id] = coffee;
			    	if(_.size(coffees) == count) {
			    		coffeesHandler(coffees);
			    	}
			    });
			}
		}
		if(error) {
			console.log(error);
		}
	});
}

var getCoffeePrice = function(coffee, url, priceHandler) {
    Meteor.call('fetchNespressoDoc', url, function(error, result) {
    	var docXml = $.parseXML(result.content);
    	var priceEl = document.evaluate("//complexePage/text[contains(text(), 'Prix')]/text()", docXml, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0);
    	if(priceEl) {
    		// \u20AC is euro unicode
    		var price = priceEl.data.match(/(?:.*\u20AC)\s*([0-9]\.[0-9]+)/)[1];
    		coffee.price = price;
    	}
    	priceHandler(coffee);
    });
}
