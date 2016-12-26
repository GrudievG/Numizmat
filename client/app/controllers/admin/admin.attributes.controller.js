(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminAttributesController', ['$http', '$timeout', '$window', '$uibModal', function ($http, $timeout, $window, $uibModal) {

			var vm = this;

			vm.attribute = {
				name: "",
				meta: "",
				type: "",
				values: []
			};

			vm.alert = "";
			vm.popoverAlert = "";
			vm.inputValue = "";
			vm.attributes = [];

			$http.get("/api/getAttributes").then(function(resolve) {
				vm.attributes = resolve.data;
			})

			vm.appendValue = function () {
				if(!vm.inputValue) return;
				if(vm.attribute.values.indexOf(vm.inputValue) != -1) {
					$timeout(function() {
				        vm.popoverAlert = "Такое значение уже есть!";
				    }, 100);
			      	$timeout(function() {
			        	vm.popoverAlert = "";
			      	}, 1600);
			      	return
				}
				vm.attribute.values.push(vm.inputValue);
				vm.inputValue = "";
			}

			vm.removeValue = function (value) {
				vm.attribute.values.splice(vm.attribute.values.indexOf(value), 1)
			}

			vm.saveAttr = function () {
				vm.attribute.meta = vm.attribute.meta.toLowerCase()
				
				if(vm.attribute.type == "Выбор" && vm.attribute.values.length < 1) {
					$timeout(function() {
				        vm.alert = "Добавьте хотя бы одно значение атрибута";
				    }, 100);
			      	$timeout(function() {
			        	vm.alert = "";
			      	}, 2500);
			      	return
				}

				$http.post("/api/admin/appendAttribute", vm.attribute).then(function(resolve) {
					if (!resolve.data.success) {
						$timeout(function() {
					        vm.alert = resolve.data.message;
					    }, 100);
				      	$timeout(function() {
				        	vm.alert = "";
				      	}, 2500);
					} else {
						$http.get("/api/getAttributes").then(function(resolve) {
							vm.attributes = resolve.data;
						})
						vm.attribute = {
							name: "",
							meta: "",
							type: "",
							values: []
						};
					}
				})	
			}

			vm.editAttr = function(item) {
				var itemCopy = angular.copy(item);

				var modalInstance = $uibModal.open({
			      	ariaLabelledBy: 'modal-title',
			      	ariaDescribedBy: 'modal-body',
			      	templateUrl: 'myModalContent.html',
			      	controller: 'AttributeModalCtrl',
			      	controllerAs: 'modal',
			      	resolve: {
			        	item: function () {
			          		return item;
			        	}
			      	}
			    });

			    modalInstance.result.then(function (selectedItem) {

			    }, function () {
			    	vm.attributes[vm.attributes.indexOf(item)] = itemCopy;
			    });
			}

			vm.removeAttr = function(item) {
				$http.delete('/api/admin/removeAttr/'+item._id).then(function(resolve) {
					vm.attributes.splice(vm.attributes.indexOf(item), 1)
				})
			}
				
		}]);

		angular.module('numizmat').controller('AttributeModalCtrl', ['$http', '$timeout', '$uibModalInstance', 'item',  function ($http, $timeout, $uibModalInstance, item) {
			var modal = this;
			modal.attribute = item;
			modal.edit = false;
			modal.validForm = true;
			modal.popoverAlert = "";

			modal.appendValue = function () {
				if(!modal.inputValue) return;
				if(modal.attribute.values.indexOf(modal.inputValue) != -1) {
					$timeout(function() {
				        modal.popoverAlert = "Такое значение уже есть!";
				    }, 100);
			      	$timeout(function() {
			        	modal.popoverAlert = "";
			      	}, 1600);
			      	return
				}
				modal.attribute.values.push(modal.inputValue);
				modal.inputValue = "";
			}

			modal.removeValue = function (value) {
				modal.attribute.values.splice(modal.attribute.values.indexOf(value), 1)
			}

			modal.checkValid = function(value, index) {
				if(value.length < 1)
					modal.validForm = false;
				else {
					modal.attribute.values[index] = value;
					modal.validForm = true;
				}
			}

			modal.editSubcats = function() {
				var subcatsError = false;
				modal.errorMsg = "";
				modal.attribute.values.forEach(function(value) {
					var checkedValue = modal.attribute.values.filter(function(el) {
						return el == value
					})
					if (checkedValue.length > 1)
						subcatsError = true;
				})

				if (subcatsError) {
					$timeout(function() {
				        modal.errorMsg = "Ошибка! Найдены одинаковые подкатегории.";
				    }, 100);
			      	$timeout(function() {
			        	modal.errorMsg = "";
			      	}, 1600);
			      	return
				}
				modal.edit = false;
			}

			modal.save = function() {

				modal.attribute.meta = modal.attribute.meta.toLowerCase()
				
				if(modal.attribute.type == "Выбор" && modal.attribute.values.length < 1) {
					$timeout(function() {
				        modal.alert = "Добавьте хотя бы одно значение атрибута";
				    }, 100);
			      	$timeout(function() {
			        	modal.alert = "";
			      	}, 2500);
			      	return
				}

				$http.put('/api/admin/updateAttr/', modal.attribute).then(function(resolve) {

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