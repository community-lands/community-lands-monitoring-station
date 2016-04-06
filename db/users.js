var settings = require('../helpers/settings')

var records = [
    { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', emails: [ { value: 'jack@example.com' } ] }
  , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', emails: [ { value: 'jill@example.com' } ] }
];

if (settings.getSharedSecret()) {
  shared = {
    id: records.length + 2,
    username: settings.getSharedUsername() || 'community',
    password: settings.getSharedSecret(),
    displayName: 'Community Account',
    emails: [ { value: 'community@example.com' } ]
  };
  records.push(shared);
}

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    var match = null;
    var community = null;
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        match = record;
        break;
      } else if (record.username == 'community') {
        community = record;
      }
    }
    if (match == null && community != null) {
      //Make a "new" user based on the community user
      match = JSON.parse(JSON.stringify(community));
      match.username = username
    }
    return cb(null, match);
  });
}
