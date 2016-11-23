(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminCreateAuctionController', ['$http', '$state', function ($http, $state) {

			moment.locale('ru');
			var vm = this;
			
			vm.datePickerOptions = {
				showWeeks: false,
				startingDay: 1
			};
			vm.auctionName = "";
			vm.dt = new Date();
			vm.dateStart = moment(vm.dt).format('LLL');

			vm.changeTime = function () {
				vm.dateStart = moment(vm.dt).format('LLL');
			}

			vm.create = function() {

				$http.post('/api/admin/createAuction', {
					name: vm.auctionName,
					timeToStart: vm.dt.getTime()
				}).then(function(resolve) {

				})

				$state.go('admin.auction')
			}

			$http.get('/api/admin/auctionIsExist').then(function(resolve) {
				if (!resolve.data.success) {
					$state.go('admin.auction')
				} else if(resolve.data.success) return
			})
			


		}]);

})();