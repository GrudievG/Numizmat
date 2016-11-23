(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('SignUpController', ['$state', '$timeout', 'Auth', function ($state, $timeout, Auth) {

			var vm = this;

			vm.countries = [
				"Украина",
				"Финлянлия",
				"Россия",
				"Польша",
				"Чехия",
				"Австрия"
			];

			vm.user = {
				email: "",
				password: "",
				name: "",
				surname: "",
				tel: "",
				country: vm.countries[0],
				region: "",
				locality: "",
				postIndex: "",
				address: "",
				admin: false,
				super: false
			}

			vm.alert = {
				show: false,
				message: ""
			}

			vm.signUpSuccess = false;

			function userExist (message) {
				$timeout(function() {
			        vm.alert.show = true;
			        vm.alert.message = message;
			      }, 100);
		      	$timeout(function() {
		        	vm.alert.show = false;
		      	}, 2500);
		      	vm.alert.message = "";
			}

			vm.submitForm = function(isValid) {

				Auth.signUp(vm.user).then(function(resolve) {
					if (!resolve.data.success) {
						userExist(resolve.data.message)
						return
					}
					vm.signUpSuccess = true;
				}, function(reject) {
					alert("Произошёл сбой! Пожалуйста, перезагрузите страницу и попробуйте снова.")
				});
			}

		}]);

})();