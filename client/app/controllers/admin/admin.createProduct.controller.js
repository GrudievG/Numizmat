(function() {
	'use strict';

	angular.module('numizmat').controller('AdminCreateProduct', ['$http', 'Upload', '$uibModal', function ($http, Upload, $uibModal) {

		var vm = this;

		vm.processing = false;
		vm.addProductSuccess = false;
		vm.files = [];
		vm.categories = [];
		vm.subcategories = [];

		vm.product = {
			availability: true,
			photos: vm.files,
			props:[]
		}

		$http.get('/api/getAttributes').then(function(resolve) {
			vm.product.props = resolve.data;
		})

		$http.get('/api/getCategories').then(function(resolve) {
			vm.categories = resolve.data;
		})

		vm.addProduct = function() {
			vm.processing = true;

			var upload = Upload.upload({
				url: 'api/admin/addProduct',
				method: 'POST',
				data: vm.product
			});

			upload.then(function(resolve) {
				vm.processing = false;
				vm.addProductSuccess = true;
			}, function(reject) {
				console.log("reject", reject)
			})
		}

		vm.check = function () {
			vm.files.forEach(function(el) {
				if (el == null) {
					vm.files.splice(vm.files.indexOf(el), 1)
				}
			})
		}

		vm.getSubCat = function() {
			vm.categories.forEach(function(el) {
				if (el.name == vm.product.category) {
					vm.subcategories = el.subcats;
				}
			})
		}

		vm.addAttr = function () {

			var modalInstance = $uibModal.open({
		      	ariaLabelledBy: 'modal-title',
		      	ariaDescribedBy: 'modal-body',
		      	templateUrl: 'attrModal.html',
		      	controller: 'CreateProdModalCtrl',
		      	controllerAs: 'modal'
		    });

		    modalInstance.result.then(function (selectedItem) {
		    	vm.product.props.push(selectedItem)
		    }, function () {
		    	
		    });
		}

		vm.backToForm = function() {
			$http.get('/api/getAttributes').then(function(resolve) {
				vm.files = [];
				vm.product = {
					availability: true,
					price: undefined,
					photos: vm.files,
					main_description: ""
				}
				vm.product.props = resolve.data;
			})

			vm.addProductSuccess = false;
		}
		
	}]);

	angular.module('numizmat').controller('CreateProdModalCtrl', ['$http', '$timeout', '$uibModalInstance',  function ($http, $timeout, $uibModalInstance) {
		var modal = this;
		modal.attribute = {
			name: "",
			meta: "",
			type: "",
			values: []
		};


		modal.appendValue = function () {
			if(!modal.inputValue) return;
			modal.attribute.values.push(modal.inputValue);
			modal.inputValue = "";
		}

		modal.removeValue = function (value) {
			modal.attribute.values.splice(modal.attribute.values.indexOf(value), 1)
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

			$http.post("/api/admin/appendAttribute", modal.attribute).then(function(resolve) {
				if (!resolve.data.success) {
					$timeout(function() {
				        modal.alert = resolve.data.message;
				    }, 100);
			      	$timeout(function() {
			        	modal.alert = "";
			      	}, 2500);
				} else if (resolve.data.success) {
					$uibModalInstance.close(modal.attribute);
					modal.attribute = {
						name: "",
						meta: "",
						type: "",
						values: []
					};
				}
			})	
		}

		modal.cancel = function () {
		    $uibModalInstance.dismiss('cancel');
		};		
	}]);

})();