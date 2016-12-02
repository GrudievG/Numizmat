(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('ArchiveOrdersController', ['$uibModal', '$http', function ($uibModal, $http) {
			moment.locale('ru')
			var vm = this;
			var ordersWithId = [];
			var ordersWithEmail = [];
			var reserveOrders = []

			vm.orders = [];
			vm.pagination = {
				currentPage: 1,
				pageSize: 15,
				filtered: [],
				totalItems: 0
			}

			$http.get('/api/admin/getArchiveOrders').then(function(resolve) {
				ordersWithId = resolve.data;
				ordersWithEmail = angular.copy(ordersWithId);
				reserveOrders = angular.copy(ordersWithId);
				getUsers();
			})

			function getUsers () {
				var users = []
				ordersWithId.forEach(function(order) {
					users.push(order.customer)
				})
				$http.post('/api/admin/getCustomers', users).then(function(resolve) {
					ordersWithEmail.forEach(function(order, index) {
						order.customer = resolve.data[index]
					})
					vm.orders = ordersWithEmail;
					vm.changePage()
				})
			}

			function showAll () {
				ordersWithId = reserveOrders;
				ordersWithEmail = angular.copy(ordersWithId);;
				getUsers();
			}

			vm.searchOrders = function() {
				if(vm.query.length == 0)
					showAll();
				else {
					$http.get('api/admin/searchArchiveOrders/'+ vm.query).then(function(resolve) {
						ordersWithId = resolve.data;
						ordersWithEmail = angular.copy(ordersWithId);
						getUsers();
					})
				}
			}

			vm.changePage = function() {
				var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
            	var end = begin + vm.pagination.pageSize;

                vm.pagination.totalItems = vm.orders.length;
            	vm.pagination.filtered = vm.orders.slice(begin, end);
			}

			vm.viewCustomer = function(customer) {
				$http.get('/api/admin/getCustomer/' + customer).then(function(resolve) {
					var user = resolve.data
					var modalInstance = $uibModal.open({
				      	ariaLabelledBy: 'modal-title',
				      	ariaDescribedBy: 'modal-body',
				      	templateUrl: 'userProfile.html',
				      	controller: 'ArchiveOrderModalCtrl',
				      	controllerAs: 'modal',
				      	resolve: {
				        	user: function () {
				          		return user;
				        	}
				      	}
				    });
				})
			}

			vm.viewOrder = function(order) {
				var modalInstance = $uibModal.open({
			      	ariaLabelledBy: 'modal-title',
			      	ariaDescribedBy: 'modal-body',
			      	templateUrl: 'order.html',
			      	controller: 'ArchiveViewOrderModalCtrl',
			      	size: 'lg',
			      	controllerAs: 'modal',
			      	resolve: {
			        	order: function () {
			          		return order;
			        	}
			      	}
			    });
			}

		}]);

		angular.module('numizmat').controller('ArchiveOrderModalCtrl', ['$uibModalInstance', 'user',  function ($uibModalInstance, user) {
			var modal = this;

			modal.user = user;

			modal.close = function () {
			    $uibModalInstance.dismiss('cancel');
			};		
		}]);

		angular.module('numizmat').controller('ArchiveViewOrderModalCtrl', ['$uibModalInstance', 'order',  function ($uibModalInstance, order) {
			var modal = this;

			modal.order = order;

			modal.close = function () {
			    $uibModalInstance.dismiss('cancel');
			};		
		}]);

})();