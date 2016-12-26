(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AuctionController', ['$scope', '$http', '$rootScope', 'socket', function ($scope, $http, $rootScope, socket) {
			moment.locale('ru')
			var vm = this;
			var reserveLots = [];
			var filteredLots = [];
			var categories = [];
			var auction_id = undefined;
			var currentCategory = 'all';
			var currentSubcategory = 'all';

			vm.auctionExist = undefined;
			vm.lots = [];
			vm.filters = [];
			vm.categories = [];
			vm.mode = 'pagination';
			vm.pageSizeVars = [10, 20, 40, 80, 100];

			vm.pagination = {
				currentPage: 1,
				pageSize: vm.pageSizeVars[0],
				filtered: [],
				totalItems: 0
			}

			function sortByNumber (a, b) {
				if (a.number > b.number) return 1;
  				if (a.number < b.number) return -1;
			}

			$http.get('/api/getCurrentAuction').then(function(resolve) {
				if(resolve.data.success) {
					vm.auctionExist = 'yes';
					auction_id = resolve.data.auction._id;
					return $http.get('api/lots/' + auction_id)
				} else {
					vm.auctionExist = 'no';
					throw new Error()
				}
			}).then(function(resolve) {
				var sortedLots = resolve.data.lots.sort(sortByNumber)
				vm.lots = sortedLots;
				vm.lots.forEach(function(lot) {
					if(categories.indexOf(lot.category) == -1)
						categories.push(lot.category)
					getTradingTime(lot);
				})
				reserveLots = angular.copy(vm.lots)
				vm.changePage();
				return $http.get('api/getCategories')	
			}).then(function(resolve) {
				var cats = resolve.data.filter(function(item) {
					return categories.indexOf(item.name) != -1
				})
				vm.categories = cats
			}).catch(function(error) {
				return
			});

			$http.get('api/getAttributes').then(function(resolve) {
				vm.filters = resolve.data.filter(function(element) {
					return element.type == "Выбор"
				});
			})

			function getTradingTime (lot) {
				if(Date.now() < Number(lot.startTrading)) {
					lot.timeToStart = moment(new Date(Number(lot.startTrading))).fromNow();
				} else if (Date.now() > Number(lot.startTrading) && Date.now() < Number(lot.endTrading)) {
					lot.timeToStart = "Торги идут в данный момент"
				} else if (Date.now() > Number(lot.endTrading)) {
					lot.timeToStart = "Торги завершены"
				}
			}

			vm.showAll = function () {
				currentCategory = 'all';
				currentSubcategory = 'all';
				vm.lots = reserveLots;
				vm.changePage();
				vm.filterLots();
			}

			vm.selectCat = function (category, subcategory) {
				// $http.post('api/getFilteredLotsByCategory', {
				// 	category: category,
				// 	subcategory: subcategory
				// }).then(function(resolve) {
				// 	var sortedLots = resolve.data.sort(sortByNumber);
				// 	vm.lots = sortedLots;
				// 	vm.changePage();
				// })
				if (category) {
					currentCategory = category;
				}
				if (subcategory) {
					currentSubcategory = subcategory;
				}
				
				if(!subcategory) {
					vm.lots = reserveLots.filter(function(lot) {
						return lot.category == category
					})
					vm.changePage();
				} else {
					vm.lots = reserveLots.filter(function(lot) {
						return lot.category == category && lot.subcategory == subcategory
					})
					vm.changePage();
				}
				vm.filterLots();
				
			}

			vm.searchLots = function() {
				if(vm.query.length == 0)
					vm.showAll();
				else {
					$http.get('api/searchLots/'+vm.query).then(function(resolve) {
						var sortedLots = resolve.data.sort(sortByNumber);
						vm.lots = sortedLots;
						vm.lots.forEach(function(lot) {
							getTradingTime(lot);
						})
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
				$http.post('api/filterLots', {
					filter: vm.filter,
					auction: auction_id,
					category: currentCategory,
					subcategory: currentSubcategory
				}).then(function(resolve) {
					var sortedLots = resolve.data.sort(sortByNumber);
					vm.lots = sortedLots;
					vm.lots.forEach(function(lot) {
						getTradingTime(lot);
					})
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
				var sortedLots = data.sort(sortByNumber);
				vm.lots = sortedLots;
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