/**
 * Directive that places focus on the element it is applied to when the
 * expression it binds to evaluates to true
 */
angular.module('app')
  .directive('inputFocus', ['$timeout', function ($timeout) {
    'use strict';

    return function (scope, elem, attrs) {
      scope.$watch(attrs.inputFocus, function (newVal) {
        if (newVal) {
          $timeout(function () {
            elem[0].focus();
          }, 0, false);
        }
      });
    };
  }]);
