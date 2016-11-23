(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('ResetController', ['$scope', '$http', function ($scope, $http) {
			moment.locale('ru')
			var vm = this;
			vm.dropped = false;
			vm.dropPass = function() {
				vm.dropped = true;
				$http.post('/api/dropPassword', {
					email: vm.email
				}).then(function(resolve) {

				})
			}

		}]);

})();