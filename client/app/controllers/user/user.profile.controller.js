(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('ProfileController', ['$window', '$state', '$rootScope', '$timeout', '$http', function ($window, $state, $rootScope, $timeout, $http) {

			var vm = this;

			if(!$rootScope.loggedIn) 
				$state.go('home')

			vm.formEdit = false;
			vm.changePassword = false;

			vm.errorMessage = "";

			vm.user = {
				email: "",
				name: "",
				surname: "",
				tel: null,
				country: "",
				region: "",
				locality: "",
				postIndex: "",
				address: ""
			};
			vm.objToChangePass = {
				currentPass: "",
				newPassOne: "",
				newPassTwo: ""
			};
		
			var url = "/api/user/" + $window.localStorage.getItem('id');

			$http.get(url).then(function(resolve) {
				vm.user = {
					email:resolve.data.email,
					name: resolve.data.name,
					surname: resolve.data.surname,
					tel: resolve.data.tel,
					country: resolve.data.country,
					region: resolve.data.region,
					locality: resolve.data.locality,
					postIndex: resolve.data.postIndex,
					address: resolve.data.address
				}
			});

			vm.editForm = function() {

				var objectToSend = {
					currentEmail: $window.localStorage.getItem('user'),
					email:vm.user.email,
					name: vm.user.name,
					surname: vm.user.surname,
					tel: vm.user.tel,
					country: vm.user.country,
					region: vm.user.region,
					locality: vm.user.locality,
					postIndex: vm.user.postIndex,
					address: vm.user.address
				}

				if(!vm.formEdit)
					vm.formEdit = true;
				else {
					$http.put(url, objectToSend).then(function(resolve) {
						if(!resolve.data.success) {
							$timeout(function() {
						        vm.errorMessage = resolve.data.message;
						      }, 100);
					      	$timeout(function() {
					        	vm.errorMessage = "";
					      	}, 2500);
						} else {
							$window.localStorage.setItem('user', vm.user.email);
							$rootScope.$broadcast('changeEmail', {email: vm.user.email})
							vm.formEdit = false;
						}
					});
				}
			};

			vm.changePass = function() {
				if(!vm.changePassword)
					vm.changePassword = true;
				else {
					if (vm.objToChangePass.newPassOne != vm.objToChangePass.newPassTwo) {
						$timeout(function() {
					        vm.errorMessage = "Пароли в полях 2 и 3 не совпадают.";
					      }, 100);
				      	$timeout(function() {
				        	vm.errorMessage = "";
				      	}, 2500);
					} else {
						$http.put(url + '/changePass', vm.objToChangePass).then(function(resolve) {
							if(!resolve.data.success) {
								$timeout(function() {
							        vm.errorMessage = resolve.data.message;
							      }, 100);
						      	$timeout(function() {
						        	vm.errorMessage = "";
						      	}, 2500);
						    } else {
						    	vm.changePassword = false;
						    	vm.objToChangePass = {
									currentPass: "",
									newPassOne: "",
									newPassTwo: ""
								};
						    	vm.changePassSuccess = true;
						    }
						});
					}
				}
			};

			vm.cancelChanges = function(config) {
				if (config == "password") {
					vm.changePassword = false;
					vm.objToChangePass = {
						currentPass: "",
						newPassOne: "",
						newPassTwo: ""
					};
				} else if (config == "profile") {
					$http.get(url).then(function(resolve) {
						vm.user = {
							email:resolve.data.email,
							name: resolve.data.name,
							surname: resolve.data.surname,
							tel: resolve.data.tel,
							country: resolve.data.country,
							region: resolve.data.region,
							locality: resolve.data.locality,
							postIndex: resolve.data.postIndex,
							address: resolve.data.address
						}
					});
					vm.formEdit = false;
				}
			};

		}]);

})();