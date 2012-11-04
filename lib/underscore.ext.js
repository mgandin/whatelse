_.mixin({
	and : function() {
		var funcs = arguments;
		return function() {
			var args = arguments;
			return _.all(_.map(funcs, function(f) {return f.apply(this, args);}), _.identity);
		};
	},
});
