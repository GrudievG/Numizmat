(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminController', ['$scope', '$window', '$state', '$rootScope', 'Auth', function ($scope, $window, $state, $rootScope, Auth) {

			var vm = this;

			if(!$rootScope.admin) {
				$state.go('home');
			} else if ($rootScope.admin) {
				$rootScope.showHeader = false;
				vm.admin_email = $window.localStorage.getItem('user');
			}
			

			vm.comeBack = function() {
				$rootScope.showHeader = true;
			}

			vm.logout = function() {
				Auth.logout();
				$rootScope.showHeader = true;
				$rootScope.loggedIn = Auth.isLoggedIn();
				$window.localStorage.removeItem('user');
				$window.localStorage.removeItem('id');
				$state.go('home');
			}

			$scope.$on('changeEmail', function(event, data) {
    			vm.admin_email = $window.localStorage.getItem('user');
    		});

		}]);

})();