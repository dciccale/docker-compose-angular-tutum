'use strict';

var MONGO_ADDR = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
var MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || 27017;

// Development specific configuration
// ==================================
module.exports = {

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://' + MONGO_ADDR + ':' + MONGO_PORT + '/docker-angular-tutum-dev'
  },

  // If true, sample data will be feed into the database, removing all previous one
  seedDB: true
};
