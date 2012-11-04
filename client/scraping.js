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
