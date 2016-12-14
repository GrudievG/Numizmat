(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('BetsController', ['$scope', '$state', '$http', '$window', '$rootScope', function ($scope, $state, $http, $window, $rootScope) {
			moment.locale('ru')
			if(!$rootScope.loggedIn) 
				$state.go('home')
			var vm = this;
			var bets = undefined;

			vm.exist = false;
			vm.activeAuc = false;
			vm.bets = undefined;
			vm.sum = 0;

			$http.get('/api/getPublicAuction').then(function(resolve) {
				if(resolve.data.success)
					vm.activeAuc = true;
			})

			$http.get('/api/getUserBets/'+$window.localStorage.getItem('id')).then(function(resolve) {
				if(resolve.data.length > 0) {
					vm.exist = true;
					bets = resolve.data;
					bets.forEach(function(item) {
						if (item.lot.customer == $window.localStorage.getItem('id')) {
							item.leader = true;
							vm.sum += item.price
						} else 
							item.leader = false;
						if(Number(item.lot.endTrading) > Date.now())
							item.status = "Идут торги"
						else
							item.status = "Торги окончены"
					})
					vm.bets = bets;
				} else return					
			})	

		}]);

})();