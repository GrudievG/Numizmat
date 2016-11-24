(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminCategoriesController', ['$http', '$timeout', '$window', '$uibModal', function ($http, $timeout, $window, $uibModal) {

			var vm = this;

			vm.category = {
				name: "",
				subcats: []
			};

			vm.alert = "";
			vm.inputValue = "";
			vm.categories = [];

			$http.get("/api/getCategories").then(function(resolve) {
				vm.categories = resolve.data
			})

			vm.appendValue = function () {
				if(!vm.inputValue) return;
				vm.category.subcats.push(vm.inputValue);
				vm.inputValue = "";
			}

			vm.removeValue = function (value) {
				vm.category.subcats.splice(vm.category.subcats.indexOf(value), 1)
			}

			vm.saveCat = function () {
				$http.post("/api/admin/appendCategory", vm.category).then(function(resolve) {
					if (!resolve.data.success) {
						$timeout(function() {
					        vm.alert = resolve.data.message;
					    }, 100);
				      	$timeout(function() {
				        	vm.alert = "";
				      	}, 2500);
					} else {
						$http.get("/api/getCategories").then(function(resolve) {
							vm.categories = resolve.data
						})
						vm.category = {
							name: "",
							subcats: []
						};
					}
				})	
			}

			vm.editCat = function(item) {
				var itemCopy = angular.copy(item);

				var modalInstance = $uibModal.open({
			      	ariaLabelledBy: 'modal-title',
			      	ariaDescribedBy: 'modal-body',
			      	templateUrl: 'modalAddCat.html',
			      	controller: 'CategoryModalCtrl',
			      	controllerAs: 'modal',
			      	resolve: {
			        	item: function () {
			          		return item;
			        	}
			      	}
			    });

			    modalInstance.result.then(function (selectedItem) {

			    }, function () {
			    	vm.categories[vm.categories.indexOf(item)] = itemCopy;
			    });
			}

			vm.removeCat = function(item) {
				$http.delete('/api/admin/removeCategory/'+item._id).then(function(resolve) {
					vm.categories.splice(vm.categories.indexOf(item), 1)
				})
			}
				
		}]);

		angular.module('numizmat').controller('CategoryModalCtrl', ['$http', '$timeout', '$uibModalInstance', 'item',  function ($http, $timeout, $uibModalInstance, item) {
			var modal = this;
			modal.category = item;

			modal.appendValue = function () {
				if(!modal.inputValue) return;
				modal.category.subcats.push(modal.inputValue);
				modal.inputValue = "";
			}

			modal.removeValue = function (value) {
				modal.category.subcats.splice(modal.category.subcats.indexOf(value), 1)
			}

			modal.save = function() {
				$http.put('/api/admin/updateCategory', modal.category).then(function(resolve) {
					if(!resolve.data.success) {
						$timeout(function() {
				        	modal.alert = resolve.data.message;
					    }, 100);
				      	$timeout(function() {
				        	modal.alert = "";
				      	}, 2500);
				      	return
					} else if (resolve.data.success) {
						$uibModalInstance.close();
					}
				})
			}

			modal.cancel = function () {
			    $uibModalInstance.dismiss('cancel');
			};		
		}]);

})();