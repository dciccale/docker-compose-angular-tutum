angular.module('app')
  .controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {

    $scope.fruit = [];
    $scope.newItem = {};

    function getFruit() {
      $http.get('/api/fruit')
        .success(function (fruit) {
          $scope.fruit = fruit;
        })
        .error(handleError);
    }

    function handleError() {
      console.log('there was an error accessing the api');
    }

    $scope.add = function () {
      $scope.saving = true;

      if (!$scope.newItem.name) {
        return;
      }

      $http.post('/api/fruit', angular.copy($scope.newItem))
        .success(function (fruit) {
          $scope.fruit.push(fruit);
          $scope.newItem = {};
          $scope.saving = false;
        })
        .error(function () {
          handleError();
          $scope.saving = false;
        });
    };

    $scope.remove = function (id) {
      var index = this.$index;
      $http.delete('/api/fruit/' + id)
        .success(function () {
          $scope.fruit.splice(index, 1);
        })
        .error(handleError);
    };

    $scope.startEdit = function (fruit) {
      $scope.currentEdit = angular.copy(fruit);
    };

    $scope.update = function (fruit, event, name) {
      if (!fruit.name) {
        fruit.name = $scope.currentEdit.name;
      }
      // submit also triggers blur, prevent double saving
      if (event === 'blur' && $scope.saveEvent === 'submit') {
        $scope.saveEvent = null;
        return;
      }

      $scope.saveEvent = event;
      $scope.currentEdit = null;

      $http.put('/api/fruit/' + fruit._id, fruit).error(handleError);
    };

    // Get initial data from api
    getFruit();
  }]);
