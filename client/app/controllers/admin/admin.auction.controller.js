(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminAuctionController', ['$window', '$http', '$uibModal', function ($window, $http, $uibModal) {
			moment.locale('ru')
			var vm = this;
			var reserveCopy = undefined;
			var auction = {};
			var tradingLot = undefined; 

			vm.showAddBtn = false;
			vm.currentAuction = undefined;
			vm.superAdmin = false;
			vm.pagination = {
				pageSize: 10,
				totalItems: undefined,
				currentPage:1,
				filtered: []
			}

			function sortByNumber (a, b) {
				if (a.number > b.number) return 1;
  				if (a.number < b.number) return -1;
			}

			$http.get('/api/admin/auctionIsExist').then(function(resolve) {
				if (resolve.data.success) {
					vm.showAddBtn = true;
				} else if(resolve.data.auction) {
					auction = resolve.data.auction;
					if (resolve.data.auction.status == "new") {
						vm.publish = false;
					} else if (resolve.data.auction.status == "published") {
						vm.publish = true;
					}

					var time = Number(resolve.data.auction.timeToStart)
					var sortedLots = resolve.data.auction.lots.sort(sortByNumber)
					vm.currentAuction = {
						name: resolve.data.auction.name,
						date: moment(time).format('LLL'),
						timestamp: time,
						id: resolve.data.auction._id,
						lots: sortedLots
					}
					reserveCopy = angular.copy(vm.currentAuction);
					vm.changePage()
				}
				return $http.get('/api/admin/isSuperAdmin/' + $window.localStorage.getItem('id'))
			}).then(function(resolve) {
				if(resolve.data.success)
					vm.superAdmin = true;
			})	

			$http.get('/api/getSettings').then(function(resolve) {
				tradingLot = resolve.data.tradingLot
			})	

			function showAll () {
				vm.currentAuction.lots = reserveCopy.lots;
				vm.changePage();
			}	

			vm.searchLots = function() {
				if(vm.query.length == 0)
					showAll();
				else {
					$http.get('api/searchLots/'+ vm.query).then(function(resolve) {
						var sortedLots = resolve.data.sort(sortByNumber)
						vm.currentAuction.lots = sortedLots;
						vm.changePage();
					})
				}
			}

			vm.changePage = function () {
				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;
            	vm.pagination.totalItems = vm.currentAuction.lots.length;
                vm.pagination.filtered = vm.currentAuction.lots.slice(begin, end);
			}

			vm.changeStatus = function(boolean) {
				var status = undefined;
				if(boolean) {
					vm.publish = true;
					status = "published"
				} else {
					vm.publish = false;
					status = "new"
				}

				$http.put('/api/admin/updateAuctionStatus', {
					id: vm.currentAuction.id,
					status: status
				}).then(function(resolve) {
					var sortedLots = resolve.data.sort(sortByNumber)
					vm.currentAuction.lots = sortedLots;
					reserveCopy.lots = sortedLots;
					vm.changePage();
				})
			}

			vm.remove = function() {
				var sure = confirm("Вы уверены, что хотите удалить аукцион? Данные о лотах невозможно будет восстановить.")
				if (!sure) return
				else {
					$http.delete('api/admin/removeAuction/'+vm.currentAuction.id).then(function(resolve) {
						vm.showAddBtn = true;
						vm.currentAuction = undefined
					})
				}
			}

			vm.edit = function() {
				var modalInstance = $uibModal.open({
			      	ariaLabelledBy: 'modal-title',
			      	ariaDescribedBy: 'modal-body',
			      	templateUrl: 'editAuction.html',
			      	controller: 'EditModalCtrl',
			      	controllerAs: 'modal',
			      	resolve: {
			        	auction: function () {
			          		return vm.currentAuction;
			        	},
			        	tradingLot: function () {
			        		return tradingLot;
			        	}
			      	}
			    });

			    modalInstance.result.then(function (selectedItem) {
			      	vm.currentAuction.name = selectedItem.name;
			      	vm.currentAuction.date = moment(selectedItem.timeToStart).format('LLL');
			      	vm.currentAuction.timestamp = selectedItem.timeToStart
			      	reserveCopy = angular.copy(vm.currentAuction);
			    }, function () {
			      	vm.currentAuction.name = reserveCopy.name;
			      	vm.currentAuction.date = moment(reserveCopy.timestamp).format('LLL');
			    });
			}

			vm.removeLot = function(lot) {
				if (confirm("Вы уверены, что хотите удалить лот? Это приведёт к изменению нумерации остальных лотов")) {
					vm.currentAuction.lots.splice(vm.currentAuction.lots.indexOf(lot), 1);

					$http.post('/api/admin/removeLot', {
						lot: lot
					}).then(function(resolve) {
						var sortedLots = resolve.data.lots.sort(sortByNumber)
						vm.currentAuction.lots = sortedLots;
						reserveCopy.lots = sortedLots;
						vm.changePage();
					})
				}	
			}

		}]);


	angular
		.module('numizmat')
		.controller('EditModalCtrl', ['$http', '$uibModalInstance', 'auction', 'tradingLot', 'socket', function ($http, $uibModalInstance, auction, tradingLot, socket) {
			var modal = this;
			var currentTimestamp = auction.timestamp;

			modal.auction = auction;
			modal.datePickerOptions = {
				showWeeks: false,
				startingDay: 1
			};

			modal.dt = auction.timestamp;
			modal.timeToStart = moment(modal.dt).format('LLL');

			modal.changeValue = function () {
				modal.timeToStart = moment(modal.dt).format('LLL');
				currentTimestamp = modal.dt.getTime()
			}

			modal.save = function() {
				modal.auction.lots.forEach(function(el, i) {
					el.startTrading = currentTimestamp + (i * tradingLot);
					el.endTrading = el.startTrading + tradingLot;
				})
				var auc = {
					name: modal.auction.name,
					timeToStart: currentTimestamp,
					id: auction.id,
					lots: modal.auction.lots
				}
				
				$http.put('/api/admin/updateAuction', auc).then(function(resolve) {
					$uibModalInstance.close(auc);
					socket.emit('recount trading time', modal.auction.lots)
				})	
			}

			modal.cancel = function() {
				$uibModalInstance.dismiss();
			}

		}]);

})();