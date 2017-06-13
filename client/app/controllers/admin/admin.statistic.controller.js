(function() {
	'use strict';

	angular.module('numizmat').controller('StatisticController', ['$window', '$scope', '$http', '$rootScope', 'socket', '$uibModal', function ($window, $scope, $http, $rootScope, socket, $uibModal) {
		moment.locale('ru')
		var vm = this;
		var reserveAuction = undefined;
		var auctionWithId = undefined;
		var auctionWithEmail = undefined;

		vm.activeAuc = false;
		vm.currentAuction = undefined;
		vm.customers = [];
		vm.superAdmin = false;
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
			return $http.get('/api/admin/isSuperAdmin/' + $window.localStorage.getItem('id'))	
		}).then(function(resolve) {
			if(resolve.data.success)
				vm.superAdmin = true;
		})	

		function getUsers () {
			var users = []
			auctionWithId.lots.forEach(function(lot) {
				if(lot.customer)
					users.push(lot.customer)
				else
					users.push(0)
			})
			$http.post('/api/admin/getCustomers', users).then(function(resolve) {
				auctionWithEmail.lots.forEach(function(lot, index) {
					if(resolve.data[index] == 0) {
						if(Number(lot.endTrading) > Date.now()) {
							lot.status = "Идут торги"
						}
						else if (Number(lot.endTrading) <= Date.now()) {
							lot.status = "Не продано"
						}
					} else {
						var split = resolve.data[index].split('@')
						lot.customer = split[0]
						if(Number(lot.endTrading) > Date.now()) {
							lot.status = "Идут торги";
						}
						else if (Number(lot.endTrading) <= Date.now()) {
							lot.status = "Ожидается оплата";
						}
					}
				})
				vm.currentAuction = auctionWithEmail;
				vm.currentAuction.lots = vm.currentAuction.lots.sort(sortByNumber);
				vm.changePage();
			})
		}

		function sortByNumber (a, b) {
 			if (a.number > b.number) return 1;
 			if (a.number < b.number) return -1;
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

		vm.viewHistory = function(lot) {
			var modalInstance = $uibModal.open({
		      	ariaLabelledBy: 'modal-title',
		      	ariaDescribedBy: 'modal-body',
		      	templateUrl: 'lotHistory.html',
		      	controller: 'HistoryModalCtrl',
		      	controllerAs: 'modal',
		      	resolve: {
		        	lot: function () {
		          		return lot;
		        	}
		      	}
		    });
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

	angular.module('numizmat').controller('HistoryModalCtrl', ['$http', '$timeout', '$uibModalInstance', 'lot', function ($http, $timeout, $uibModalInstance, lot) {
		var modal = this;
		var lotCopy = angular.copy(lot);
		lotCopy.history = lotCopy.history.reverse();
		lotCopy.autobet_history = lotCopy.autobet_history.reverse();
		modal.lot = lotCopy;

		modal.close = function() {
			$uibModalInstance.close();
		}
		
	}]);

})();