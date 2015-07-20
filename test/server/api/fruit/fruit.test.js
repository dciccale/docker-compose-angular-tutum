'use strict';

var request = require('supertest');
var expect = require('chai').expect;

var app = require('../../../../server/app');

describe('GET /api/fruit', function() {
  it('should respond with JSON array', function (done) {
    request(app)
      .get('/api/fruit')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.be.instanceof(Array);
        done();
      });
  });
});
