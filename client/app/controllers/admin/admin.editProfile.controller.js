(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminEditProfileController', ['$window', '$rootScope', '$timeout', '$http', '$stateParams', 'Auth', function ($window, $rootScope, $timeout, $http, $stateParams, Auth) {

			var vm = this;

			var userId = $stateParams.user_id;
			var url = "/api/user/" + userId;
			var userEmail = "";

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

				userEmail = resolve.data.email;
			});

			vm.editForm = function() {

				var objectToSend = {
					currentEmail: userEmail,
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
							if(userId == $window.localStorage.getItem('id')) {
								$window.localStorage.setItem('user', vm.user.email);
								$rootScope.$broadcast('changeEmail', {email: vm.user.email});

								var dataToRereshToken = {
									accessToken: $window.localStorage.getItem('accessToken'),
									user: vm.user.email
								}

								Auth.refreshToken(dataToRereshToken).then(function(resolve) {

									if(resolve.data.success) {

										$window.localStorage.setItem('accessToken', resolve.data.accessToken);
										$rootScope.loggedIn = Auth.isLoggedIn();
										
									} else {
										$rootScope.loggedIn = Auth.isLoggedIn();
									}
										
								});
							}
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