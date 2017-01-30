(function() {
	'use strict';

	angular.module('numizmat').controller('ArchiveAuctionController', ['$http', '$q', function ($http, $q) {
		moment.locale('ru')
		var vm = this;
		var deffArr = [];

		vm.oneAtATime = true;
		vm.auctions = [];
		
		$http.get('api/admin/archiveAuctions').then(function(resolve) {
			var auctions = []
			resolve.data.forEach(function(item) {
				var time = Number(item.timeToStart)
				item.date = moment(time).format('LL');
				deffArr.push(getUsers(item));
			})
			
			$q.all(deffArr).then(function(results) {
				results.forEach(function(auc) {
					console.log(auc.lots)
					auc.lots = auc.lots.sort(sortByNumber);
				})
				vm.auctions = results;
			});	
		})

		function sortByNumber (a, b) {
			if (a.number > b.number) return 1;
			if (a.number < b.number) return -1;
		}

		function getUsers (item) {
			var users = []
			item.lots.forEach(function(lot) {
				if(lot.customer)
					users.push(lot.customer)
				else
					users.push(0)
			})

			return $http.post('/api/admin/getCustomers', users).then(function(resolve) {
				item.lots = item.lots.map(function(lot, index) {
					if(resolve.data[index] != 0) {
						lot.customer = resolve.data[index]
					}

					return lot;
				})
				return item;
			})
		}

	}]);

})();