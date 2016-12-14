(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('OrdersCtrl', ['$http', '$state', '$rootScope', '$scope', '$timeout', '$window', 'socket', function ($http, $state, $rootScope, $scope, $timeout, $window, socket) {

			var vm = this;
				
			if (!$rootScope.loggedIn)
				$state.go('home')

			vm.oneAtATime = true;
			vm.orders = [];
			vm.summary = 0;

			$http.get('api/basketProducts/' + $window.localStorage.getItem('id')).then(function(resolve) {
				vm.orders = resolve.data.orders;
			});



		}]);

})();