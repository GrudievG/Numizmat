(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('StoreController', ['$location', '$http', '$rootScope', '$timeout', 'Auth', function ($location, $http, $rootScope, $timeout, Auth) {

			var vm = this;

			var reserveProds = [];
			var categories = [];
			var currentCategory = 'all';
			var currentSubcategory = 'all';

			vm.products = [];
			vm.categories = [];
			vm.filters = [];
			vm.filterCat = "";
			vm.filterSubcat = "";
			vm.mode = 'pagination';
			vm.pageSizeVars = [10, 20, 40, 80, 100];
			vm.pagination = {
				currentPage: 1,
				pageSize: vm.pageSizeVars[0],
				filtered: [],
				totalItems: 0
			};
				
			$http.get('api/products').then(function(resolve) {
				vm.products = resolve.data;
				reserveProds = resolve.data;
				vm.products.forEach(function(prod) {
					if(categories.indexOf(prod.category) == -1)
						categories.push(prod.category)
				})
				vm.changePage();
				return $http.get('api/getCategories')
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
			});

			vm.showAll = function () {
				vm.filterCat = "";
				vm.filterSubcat = "";
				currentCategory = 'all';
				currentSubcategory = 'all';
				vm.products = reserveProds;
				vm.filterProds();
			};

			vm.checkScroll = function () {
				console.log(window.pageYOffset, $location.$$path)
			}

			vm.selectCat = function (category, subcategory) {
				currentCategory = 'all';
				currentSubcategory = 'all';
				if (category) {
					currentCategory = category;
					vm.filterCat = currentCategory;
				}
				if (subcategory) {
					currentSubcategory = subcategory;
					vm.filterSubcat = currentSubcategory;
				}
				if(!subcategory) {
					vm.filterSubcat = "";
				}
				vm.filterProds();
			};

			vm.changeActiveTab = function (value) {
				if(value == "block") {
					$rootScope.showAsBlocks = true;
					$rootScope.showAsList = false;
				} else if (value == "list") {
					$rootScope.showAsBlocks = false;
					$rootScope.showAsList = true;
				}
			};

			vm.filterProds = function () {

				for (var i in vm.filter) {
					if(vm.filter[i] == "< не выбрано >") {
						delete vm.filter[i]
					}
				}

				$http.post('api/filterProds', {
					query: vm.query,
					filter: vm.filter,
					category: currentCategory,
					subcategory: currentSubcategory
				}).then(function(resolve) {
					vm.products = resolve.data;
					vm.changePage();
				})
			};

			vm.changePage = function() {

				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;

                vm.pagination.totalItems = vm.products.length;

                if(vm.mode == 'pagination') {
                	vm.pagination.filtered = vm.products.slice(begin, end);
                } else {
                	vm.pagination.filtered = vm.products
                }
			};

		}]);

})();