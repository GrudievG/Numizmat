(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminProductsController', ['$http', '$timeout', '$window', function ($http, $timeout, $window) {

			var vm = this;
			var reserveProds = [];

			vm.allProducts = [];
			vm.availables = [];
			vm.reserved = [];
			vm.arrayToShow = [];
			vm.selectAll = false;
			vm.currentArray = '';
			vm.selectedProds = [];
			vm.pagination = {
				pageSize: 10,
				totalItems: vm.arrayToShow.length,
				currentPage:1,
				filtered: []
			}
			vm.noveltyCount = undefined;

			function rebuildProdlist () {
				vm.availables = vm.allProducts.filter(function(el) {
					return el.availability == true
				})
				vm.reserved = vm.allProducts.filter(function(el) {
					return el.availability == false
				})

				switch(vm.currentArray) {
					case 'all':
						vm.arrayToShow = vm.allProducts;
						break;
					case 'availables':
						vm.arrayToShow = vm.availables;
						break;
					case 'reserved':
						vm.arrayToShow = vm.reserved;
						break;
				}
			} 

			function showAll () {
				vm.allProducts = reserveProds;
				rebuildProdlist();
				vm.changePage();
			}

			$http.get('/api/products').then(function(resolve) {
				vm.allProducts = resolve.data;
				reserveProds = angular.copy(vm.allProducts)
				vm.currentArray = 'all';
				rebuildProdlist();
				vm.changePage();
			})

			$http.get('/api/getSettings').then(function(resolve) {
				if(resolve.data.noveltyCount) 
					vm.noveltyCount = resolve.data.noveltyCount
				else
					vm.noveltyCount = 1;
			})

			vm.changeNoveltyCount = function() {
				if(vm.noveltyCount) {
					vm.alert = false
					$http.post('/api/admin/changeNoveltyCount', {
						noveltyCount: vm.noveltyCount
					}).then(function(resolve) {})
				} else
					vm.alert = true
			}

			vm.searchProds = function() {
				if(vm.query.length == 0)
					showAll();
				else {
					$http.get('api/searchProds/'+ vm.query).then(function(resolve) {
						vm.allProducts = resolve.data;
						rebuildProdlist();
						vm.changePage();
					})
				}
			}


			vm.switchArray = function (array) {
				if (array == 'all') {
					vm.currentArray = array;
					vm.arrayToShow = vm.allProducts;
					vm.switcherAvailables = false;
					vm.switcherReserved = false;
					vm.switcherAll = true;
					vm.changePage();
				} else if (array == 'availables') {
					vm.currentArray = array;
					vm.arrayToShow = vm.availables;
					vm.switcherAvailables = true;
					vm.switcherReserved = false;
					vm.switcherAll = false;
					vm.changePage();
				} else if (array == 'reserved') {
					vm.currentArray = array;
					vm.arrayToShow = vm.reserved;
					vm.switcherAvailables = false;
					vm.switcherReserved = true;
					vm.switcherAll = false;
					vm.changePage();
				}
			}

			vm.changeVar = function () {
				if (vm.selectAll) {
					vm.selectedProds = [];
					vm.arrayToShow.forEach(function(el) {
						el.selected = true;
						vm.selectedProds.push(el)
					})
				} else {
					vm.arrayToShow.forEach(function(el) {
						el.selected = false;
					})
					vm.selectedProds = [];
				}
			}

			vm.changePage = function () {
				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;

                vm.pagination.totalItems = vm.arrayToShow.length;
                vm.pagination.filtered = vm.arrayToShow.slice(begin, end);
			}

			vm.checkSelect = function (product) {
				if(product.selected)
					vm.selectedProds.push(product)
				else 
					vm.selectedProds.splice(vm.selectedProds.indexOf(product), 1)
			}

			vm.changeRole = function (role) {

				vm.selectedProds.forEach(function(el) {					
					if(role == 'no') {
						el.availability = false;
					} else if(role == 'yes') {
						el.availability = true;
					}
				})

				$http.post("/api/admin/changeAvailability", vm.selectedProds).then(function(resolve) {
					vm.availables = vm.allProducts.filter(function(el) {
						return el.availability == true
					})
					vm.reserved = vm.allProducts.filter(function(el) {
						return el.availability == false
					})
				})

				vm.selectAll = false;
				vm.arrayToShow.forEach(function(el) {
					el.selected = false;
				})
				vm.selectedProds = [];
			}

			vm.deleteSelectedProds = function () {
				var prods = vm.selectedProds;
				$http.post("/api/admin/removeProds", vm.selectedProds).then(function(resolve) {
					prods.forEach(function(el) {
						vm.allProducts.splice(vm.allProducts.indexOf(el), 1)
					});
					rebuildProdlist();
					vm.arrayToShow.forEach(function(el) {
						el.selected = false;
					})
					vm.selectAll = false;
					vm.changePage();
				});
				vm.selectedProds = [];
			}

			vm.removeProd = function (product) {	
				$http.post("/api/admin/removeProduct/", product).then(function(resolve) {
					vm.allProducts.splice(vm.allProducts.indexOf(product), 1);
					rebuildProdlist();
					vm.changePage();
				})
			}

		}]);

})();