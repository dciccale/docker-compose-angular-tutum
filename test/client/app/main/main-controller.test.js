describe('main', function () {
  'use strict';

  var $rootScope, $scope, $httpBackend;

  beforeEach(module('app'));
  beforeEach(module('app/main/main.html'));

  beforeEach(inject(function (_$rootScope_, _$httpBackend_, $controller) {
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;

    $httpBackend.expectGET('/api/fruit').respond(['Banana', 'Kiwi', 'Clementine', 'Plum']);

    $scope = $rootScope.$new();
    $controller('MainCtrl', {$scope: $scope});
    $scope.$digest();
  }));

  describe('main tests', function () {
    it('should have a list of fruit', function () {
      $httpBackend.flush();
      expect($scope.fruit.length).to.equal(4);
    });
  });
});
