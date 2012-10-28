// if the database is empty on server start, create some sample data.
Meteor.startup(function() {
	if (Coffees.find().count() === 0) {
		var data = [ {
			name : "Ristretto",
			id : "ristretto",
			price : "0.36",
		}, {
			name : "Roma",
			id : "roma",
			price : "0.33",
		}, {
			name : "Vivalto",
			id : "vivalto",
			price : "0.34",
		}, ];

		for ( var i = 0; i < data.length; i++) {
			var coffee = data[i];
			var coffee_id = Coffees.insert(coffee);
		}
	}
});
