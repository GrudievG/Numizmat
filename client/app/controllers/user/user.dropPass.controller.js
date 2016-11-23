(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('DropController', ['$stateParams', '$state', '$http', '$timeout', function ($stateParams, $state, $http, $timeout) {
			moment.locale('ru')
			var vm = this;

			vm.updating = false;

			$http.get('/api/checkUpdating/'+ $stateParams.user_id).then(function(resolve) {
				if(resolve.data.success) {
					vm.updating = true;
				}
			})

			vm.errorMessage = "";

			vm.changePass = function() {
				if(vm.newPassOne != vm.newPassTwo) {
					$timeout(function() {
				        vm.errorMessage = "Пароли в полях 1 и 2 не совпадают.";
				      }, 100);
			      	$timeout(function() {
			        	vm.errorMessage = "";
			      	}, 2500);
				} else {
					$http.post('/api/updatePassword', {
						pass: vm.newPassTwo,
						user_id: $stateParams.user_id
					}).then(function(resolve) {
						$state.go('home')
					})
				}
			}

			
		}]);

})();