(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('BasketController', ['$http', '$state', '$rootScope', '$scope', '$timeout', '$window', 'socket', function ($http, $state, $rootScope, $scope, $timeout, $window, socket) {

			var vm = this;
				
			if(!$rootScope.loggedIn) {
				$state.go('home')
			} else if($rootScope.loggedIn) {
				$http.get('/api/user/' + $window.localStorage.getItem('id')).then(function(resolve) {
					if(!resolve.data.active) {
						vm.errorMessage = "Только активированные пользователи могут оформлять заказы. Пожалуйста, активируйте свой аккаунт."
					}
				})
			}
			vm.oneAtATime = true;
			vm.products = [];
			vm.orders = [];
			vm.productsSelected = [];
			vm.selectAll = false;
			vm.confirmOrder = false;
			vm.summary = 0;
			vm.orderComment = "";
			vm.confirmMsg = false;
			vm.soldItems = undefined;

			$http.get('api/basketProducts/' + $window.localStorage.getItem('id')).then(function(resolve) {
				vm.products = resolve.data.basket;
				vm.orders = resolve.data.orders;
			});

			vm.recalculateSum = function() {
				vm.summary = 0;
				vm.productsSelected = [];
				vm.products.forEach(function(el) {
					if(el.selected) {
						vm.summary += el.price;
						vm.productsSelected.push(el);
					}
				});
			};

			vm.changeVar = function() {
				if (vm.selectAll) {
					vm.products.forEach(function(el) {
						el.selected = true;
					})
					vm.recalculateSum();
				} else {
					vm.products.forEach(function(el) {
						el.selected = false;
					})
					vm.recalculateSum();
				}
			}

			vm.removeItem = function(id) {
				$http.put('api/product/removeFromBasket',{
					user_id: $window.localStorage.getItem('id'),
					product_id: id
				}).then(function(resolve) {
					vm.products.forEach(function(el) {
						if(el._id == id) {
							vm.products.splice(vm.products.indexOf(el), 1)
						}
					})
					vm.recalculateSum();
				})
			}

			vm.confirm = function () {
				vm.confirmOrder = true;
			}

			vm.backToBasket = function () {
				vm.confirmOrder = false;
				vm.confirmMsg = false;
				vm.orderComment = "";
			}

			vm.createOrder = function () {
				var soldItems = angular.copy(vm.productsSelected)
				var date = new Date();
				var orderDate = String(date.getDate()) + String(date.getMonth()+1) + String(date.getFullYear());
				var order = {
					user_id: $window.localStorage.getItem('id'),
					items: vm.productsSelected,
					comment: vm.orderComment,
					price: vm.summary,
					date: orderDate
				}
				
				$http.post("api/createOrder", order).then(function(resolve) {
					if (resolve.data.success) {
						vm.confirmMsg = true;
						vm.orderComment = "";
						vm.products = resolve.data.basket;
						vm.orders = resolve.data.orders;
						vm.selectAll = false;
						vm.changeVar();
						socket.emit('buy monets', soldItems)
					} else if(!resolve.data.success) {
						$timeout(function() {
							vm.soldItems = resolve.data.soldItems
						}, 200)
						$timeout(function() {
							vm.soldItems = undefined;
						}, 2500)
					}
				})
			}

			function changeAvailability (monets) {
				monets.forEach(function(monet) {
					vm.products = vm.products.map(function(item) {
						if(item._id == monet._id) {
							item.availability = false;
							return item
						} else 
							return item
					})
				})
			}

			socket.on('change availability', changeAvailability)

			$scope.$on('$destroy', function() {
				socket.off('change availability', changeAvailability)
			})

		}]);

})();