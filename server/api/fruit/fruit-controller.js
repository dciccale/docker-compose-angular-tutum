/**
 * GET     /fruits              ->  index
 * POST    /fruits              ->  create
 * GET     /fruits/:id          ->  show
 * PUT     /fruits/:id          ->  update
 * DELETE  /fruits/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Fruit = require('./fruit-model');

// Get list of fruits
exports.index = function (req, res) {
  Fruit.find(function (err, fruits) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(fruits);
  });
};

// Get a single fruit by id
exports.show = function (req, res) {
  Fruit.findById(req.params.id, function (err, fruit) {
    if (err) { return handleError(res, err); }
    if (!fruit) { return res.sendStatus(404); }
    return res.json(fruit);
  });
};

// Creates a new fruit
exports.create = function (req, res) {
  Fruit.create(req.body, function(err, fruit) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(fruit);
  });
};

// Updates an existing fruit
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  Fruit.findById(req.params.id, function (err, fruit) {
    if (err) { return handleError(res, err); }
    if (!fruit) { return res.sendStatus(404); }
    var updated = _.merge(fruit, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fruit);
    });
  });
};

// Deletes a fruit
exports.destroy = function (req, res) {
  Fruit.findById(req.params.id, function (err, fruit) {
    if (err) { return handleError(res, err); }
    if (!fruit) { return res.sendStatus(404); }
    fruit.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.sendStatus(204);
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
