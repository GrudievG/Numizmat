(function() {
	'use strict';

	angular
		.module('authService', []);

	angular
		.module('authService')
		.factory('Auth', ['$http', '$q', 'AuthToken', function ($http, $q, AuthToken) {

			var authFactory = {};

			authFactory.signUp = function(data) {
				return $http.post('/api/signup', data);
			}

			authFactory.login = function(data) {
				return $http.post('/api/login', {
					email: data.email,
					password: data.password
				});
			};

			authFactory.logout = function() {
				AuthToken.setToken();
			};

			authFactory.isLoggedIn = function() {
				if (AuthToken.getToken())
					return true;
				else
					return false;
			};

			authFactory.refreshToken = function(data) {
				return $http.post('/api/refresh', data);
			}

			return authFactory

		}])

		.factory('AuthToken', ['$window', function ($window) {

			var authTokenFactory = {};

			authTokenFactory.getToken = function() {
				return $window.localStorage.getItem('accessToken');
			}

			authTokenFactory.setToken = function(accessToken) {
				if (accessToken) {
					$window.localStorage.setItem('accessToken', accessToken);
				}
				else
					$window.localStorage.removeItem('accessToken');
			};


			return authTokenFactory

		}])

		.factory('AuthInterceptor', ['$q', '$location', '$window', '$rootScope', 'AuthToken', function ($q, $location, $window, $rootScope, AuthToken) {

			var interceptorFactory = {};

			interceptorFactory.request = function(config) {

				var token = AuthToken.getToken();

				// if the token exists, add it to the header as x-access-token
				if (token)
					config.headers['x-access-token'] = token;
					config.headers['current-user'] = $window.localStorage.getItem('user');

				return config;
			};

			interceptorFactory.responseError = function(response) {
				if (response.status == 403) {
					AuthToken.setToken();
					$rootScope.showHeader = true;
					// $location.path("/home")
				}

				return $q.reject(response);
			};

			return interceptorFactory;

		}]);

})();