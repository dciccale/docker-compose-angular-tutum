'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FruitSchema = new Schema({
  name: {type: String, required: true}
});

module.exports = mongoose.model('Fruit', FruitSchema);
