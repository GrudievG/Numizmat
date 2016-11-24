(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AuctionController', ['$scope', '$http', '$rootScope', 'socket', function ($scope, $http, $rootScope, socket) {
			moment.locale('ru')
			var vm = this;
			vm.notExist = true;

			var reserveLots = []
			var categories = [];

			vm.lots = [];
			vm.filters = [];
			vm.categories = [];
			vm.mode = 'pagination';

			vm.pagination = {
				currentPage: 1,
				pageSize: 4,
				filtered: [],
				totalItems: 0
			}
				
			$http.get('api/lots').then(function(resolve) {
				if (resolve.data.success) {
					vm.notExist = false;
					reserveLots = resolve.data.auction.lots;
					vm.lots = resolve.data.auction.lots;
					vm.lots.forEach(function(lot) {
						if(categories.indexOf(lot.category) == -1)
							categories.push(lot.category)
						if(Date.now() < Number(lot.startTrading)) {
							lot.timeToStart = moment(new Date(Number(lot.startTrading))).fromNow();
						} else if (Date.now() > Number(lot.startTrading) && Date.now() < Number(lot.endTrading)) {
							lot.timeToStart = "Торги идут в данный момент"
						} else if (Date.now() > Number(lot.endTrading)) {
							lot.timeToStart = "Торги завершены"
						}
					})
					vm.changePage();
					return $http.get('api/getCategories')
				}	
			}).then(function(resolve) {
				var cats = resolve.data.filter(function(item) {
					return categories.indexOf(item.name) != -1
				})
				vm.categories = cats
			});

			$http.get('api/getAttributes').then(function(resolve) {
				vm.filters = resolve.data.filter(function(element) {
					return element.type == "Выбор"
				});
			})

			vm.showAll = function () {
				vm.lots = reserveLots;
				vm.changePage();
			}

			vm.selectCat = function (category, subcategory) {
				$http.post('api/getFilteredLotsByCategory', {
					category: category,
					subcategory: subcategory
				}).then(function(resolve) {
					vm.lots = resolve.data
					vm.changePage();
				})
			}

			vm.searchLots = function() {
				if(vm.query.length == 0)
					vm.showAll();
				else {
					$http.get('api/searchLots/'+vm.query).then(function(resolve) {
						vm.lots = resolve.data
						vm.changePage();
					})
				}
			}

			vm.changeActiveTab = function (value) {
				if(value == "block") {
					$rootScope.showAsBlocks = true;
					$rootScope.showAsList = false;
				} else if (value == "list") {
					$rootScope.showAsBlocks = false;
					$rootScope.showAsList = true;
				}
			}

			vm.filterLots = function () {
				for (var i in vm.filter) {
					if(vm.filter[i] == "< не выбрано >") {
						delete vm.filter[i]
					}
				}
				$http.post('api/filterLots', vm.filter).then(function(resolve) {
					vm.lots = resolve.data
					vm.changePage();
				})
			};

			vm.changePage = function() {
				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;

                vm.pagination.totalItems = vm.lots.length;
                if(vm.mode == 'pagination')
                	vm.pagination.filtered = vm.lots.slice(begin, end);
                else
                	vm.pagination.filtered = vm.lots
			}

			function recount(data) {
				vm.lots = data;
				vm.lots.forEach(function(lot) {
					if(Date.now() < Number(lot.startTrading)) {
						lot.timeToStart = moment(new Date(Number(lot.startTrading))).fromNow();
					} else if (Date.now() > Number(lot.startTrading) && Date.now() < Number(lot.endTrading)) {
						lot.timeToStart = "Торги идут в данный момент"
					} else if (Date.now() > Number(lot.endTrading)) {
						lot.timeToStart = "Торги завершены"
					}
				})
				vm.changePage();
				$scope.$apply()
			}

			socket.on('recounting lots', recount)
			socket.on('trading time changed', recount)

			$scope.$on('$destroy', function() {
				socket.off('recounting lots', recount)
				socket.off('trading time changed', recount)
			})

		}]);

})();