(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('StatisticController', ['$scope', '$http', '$rootScope', 'socket', function ($scope, $http, $rootScope, socket) {
			moment.locale('ru')
			var vm = this;
			var reserveAuction = undefined;
			var auctionWithId = undefined;
			var auctionWithEmail = undefined;

			vm.activeAuc = false;
			vm.currentAuction = undefined;
			vm.customers = [];
			vm.pagination = {
				pageSize: 10,
				totalItems: undefined,
				currentPage:1,
				filtered: []
			}

			$http.get('/api/admin/auctionIsExist').then(function(resolve) {
				if(resolve.data.auction) {
					if(resolve.data.auction.status == 'published') {
						vm.activeAuc = true;
						auctionWithId = resolve.data.auction;
						auctionWithEmail = angular.copy(auctionWithId);
						reserveAuction = angular.copy(auctionWithId);
						getUsers()
					}
				}	
			})	

			function getUsers () {
				var users = []
				auctionWithId.lots.forEach(function(lot) {
					users.push(lot.customer)
				})
				$http.post('/api/admin/getCustomers', users).then(function(resolve) {
					auctionWithEmail.lots.forEach(function(lot, index) {
						lot.customer = resolve.data[index]
						if(Number(lot.endTrading) > Date.now())
							lot.status = "Идут торги"
						else if (Number(lot.endTrading) <= Date.now())
							lot.status = "Ожидается оплата"
					})
					vm.currentAuction = auctionWithEmail;
					vm.changePage()
				})
			}

			function showAll () {
				auctionWithId = reserveAuction;
				auctionWithEmail = angular.copy(auctionWithId);;
				getUsers();
			}

			vm.searchLots = function() {
				if(vm.query.length == 0)
					showAll();
				else {
					$http.get('api/searchLots/'+ vm.query).then(function(resolve) {
						auctionWithId.lots = resolve.data;
						auctionWithEmail.lots = angular.copy(auctionWithId.lots);
						getUsers();
					})
				}
			}
	
			vm.changePage = function () {
				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;
            	vm.pagination.totalItems = vm.currentAuction.lots.length;
                vm.pagination.filtered = vm.currentAuction.lots.slice(begin, end);
			}

			vm.changeStatus = function() {
				$http.get('/api/admin/updateAuctionStatus/'+vm.currentAuction._id).then(function(resolve) {
					vm.activeAuc = false;
				})
			}

			function updateStats (data) {
				var lots = data;
				auctionWithId.lots = [];
				vm.currentAuction.lots.forEach(function(lot) {
					lots.forEach(function(item) {
						if (item._id == lot._id)
							auctionWithId.lots.push(item)
					});
				})
				auctionWithEmail.lots = angular.copy(auctionWithId.lots);
				getUsers()
				$scope.$apply();
			}

			socket.on('update statistic', updateStats)

			$scope.$on('$destroy', function() {
				socket.off('update statistic', updateStats)
			})

		}]);

})();