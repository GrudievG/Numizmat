(function() {
	'use strict';

	angular
		.module('numizmat')
		.directive('appHeader', ['$window', '$rootScope', '$state', '$timeout', 'Auth', 'AuthToken', function ($window, $rootScope, $state, $timeout, Auth, AuthToken) {

		    return {
		    	restrict: 'E',
		    	replace: true,
		    	templateUrl: '/app/directives/header.template.html',
		    	scope: {},
		    	link: function (scope, el, attr) {
		    		if($window.localStorage.getItem('user')) {
		    			var split = $window.localStorage.getItem('user').split('@')
			    		scope.user = split[0];
		    		}
		    		scope.$on('changeEmail', function(event, data) {
		    			scope.user = $window.localStorage.getItem('user');
		    		});

			        scope.dynamicPopover = {
					    loginTemplateUrl: 'loginPopoverTemplate.html',
					    userTemplateUrl: 'userPopoverTemplate.html'
					};

					scope.loginData = {
						email: "",
						password: ""
					}

					scope.alert = {
						show: false,
						message: ""
					};

					function alertTrigger (message) {
						$timeout(function() {
					        scope.alert.show = true;
					        scope.alert.message = message;
					      }, 100);
				      	$timeout(function() {
				        	scope.alert.show = false;
				      	}, 2500);
				      	scope.alert.message = "";
					}

					scope.doLogin = function() {

						Auth.login(scope.loginData).success(function(data) {
							if(data.success) {
								
								if(data.admin) {
									$rootScope.admin = true;
								}
								else {
									$rootScope.admin = false;
								}
								
								AuthToken.setToken(data.accessToken);

								scope.user = data.email;
								$window.localStorage.setItem('user', data.email);
								$window.localStorage.setItem('id', data.id);
								$rootScope.loggedIn = Auth.isLoggedIn();
								scope.loginData = {
									email: "",
									password: ""
								};
								$state.go('home');
							} else
								alertTrigger(data.message)		
						});
					};

					scope.doLogout = function() {
						Auth.logout();
						$rootScope.loggedIn = Auth.isLoggedIn();
						$window.localStorage.removeItem('user');
						$window.localStorage.removeItem('id');
						scope.user = {};
						$state.go('home');
					};
			    }
		    }
		}]);
})();