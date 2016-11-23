(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('ActivationController', ['$http', '$stateParams', 'Auth', function ($http, $stateParams, Auth) {

			var vm = this;

			var user = undefined;

			vm.verify = false;
			vm.expires = false;
			vm.allready = false;

			$http.get('api/activate/' + $stateParams.token).then(function(resolve) {
				if (resolve.data.user && !resolve.data.success) {
					user = resolve.data.user;
					vm.expires = true;
				} else if (resolve.data.active) {
					vm.allready = true;
				} else if (resolve.data.success) {
					vm.verify = true;
				}
			})

			vm.reactivate = function() {
				$http.get('/api/reactivate/' + user._id).then(function(resolve) {

				})
			}

		}]);

})();