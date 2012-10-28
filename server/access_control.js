Meteor.startup(function() {
  var canModify = function(userId, lines) {
    return _.all(lines, function(line) {
      return !line.owner || line.owner === userId;
    });
  };

  Lines.allow({
    insert: function () { return true; },
    update: canModify,
    remove: canModify,
  });

  Lists.allow({
    insert: function () { return true; },
    update: canModify,
    remove: canModify,
  });
});
