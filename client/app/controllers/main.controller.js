(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('MainController', ['$window', '$rootScope', 'Auth', function ($window, $rootScope, Auth) {

			var vm = this;

			$rootScope.showHeader = true;
			$rootScope.showAsBlocks = true;
			$rootScope.showAsList = false;

			var dataToRereshToken = {
				accessToken: $window.localStorage.getItem('accessToken'),
				user: $window.localStorage.getItem('user')
			}

			Auth.refreshToken(dataToRereshToken).then(function(resolve) {
				if(resolve.data.success) {
					if (resolve.data.admin) {
						$rootScope.admin = true;
					} else 
						$rootScope.admin = false;
					$window.localStorage.setItem('accessToken', resolve.data.accessToken);
					$rootScope.loggedIn = Auth.isLoggedIn();
				} else 
					$rootScope.loggedIn = Auth.isLoggedIn();
				}, function(reject) {
					$rootScope.loggedIn = Auth.isLoggedIn();
				}
			);

			$rootScope.$on('$stateChangeStart', function() {				
				$rootScope.loggedIn = Auth.isLoggedIn();
			})

		}]);

})();