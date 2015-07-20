/**
 * Main application routes
 */

'use strict';

var path = require('path');
var errors = require('./components/errors');

module.exports = function (app) {

  app.use('/api/fruit', require('./api/fruit'));

  // All undefined asset routes should return a 404
  app.route('/:url(components|app|bower_components)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(path.join(app.get('appPath'), 'index.html'));
    });
};
