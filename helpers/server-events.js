var events = require('events');

const bus = new events.EventEmitter();

module.exports = bus;
