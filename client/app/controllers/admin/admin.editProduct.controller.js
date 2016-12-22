(function() {
	'use strict';

	angular.module('numizmat').controller('AdminEditProduct', ['$http', '$stateParams', '$timeout', 'Upload', '$uibModal', function ($http, $stateParams, $timeout, Upload, $uibModal) {

		var vm = this;
		var id = $stateParams.product_id;
		vm.processing = false;
		vm.addProductSuccess = false;
		vm.properties = []
		vm.files = [];
		vm.categories = [];
		vm.subcategories = [];
		vm.alert = "";

		vm.product = {
			photos: vm.files,
			props:[]
		}

		$http.get('/api/getAttributes').then(function(resolve) {
			vm.product.props = resolve.data;
		})

		$http.get('/api/product/'+id).then(function(resolve) {

			resolve.data.current.props.forEach( function(prop, number) {
				vm.product.props.forEach(function (el, index) {
					if(el.meta == prop.meta) {
						el.currentValue =  prop.value
					}
				})
			})

			vm.product.availability = resolve.data.current.availability;
			vm.product.name = resolve.data.current.name;
			vm.product.main_description = resolve.data.current.main_description;
			vm.product.availability = resolve.data.current.availability;
			vm.product.imgIds = resolve.data.current.imgIds;
			vm.product.price = resolve.data.current.price;
			vm.product.id = id;
			vm.product.category = resolve.data.current.category;
			vm.product.subcategory = resolve.data.current.subcategory;
			vm.product.year = resolve.data.current.year;

			return $http.get('/api/getCategories')
		}).then(function(resolve) {
			vm.categories = resolve.data;
			vm.getSubCat();
		})

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

		vm.removePhoto = function (index) {
			vm.product.imgIds.splice(index, 1)
		}

		vm.addAttr = function () {

			var modalInstance = $uibModal.open({
		      	ariaLabelledBy: 'modal-title',
		      	ariaDescribedBy: 'modal-body',
		      	templateUrl: 'attrModal.html',
		      	controller: 'EditProdModalCtrl',
		      	controllerAs: 'modal'
		    });

		    modalInstance.result.then(function (selectedItem) {
		    	vm.product.props.push(selectedItem)
		    }, function () {
		    	
		    });
		}

		vm.addProduct = function() {

			if(vm.product.imgIds.length == 0 || vm.product.imgIds == 0) {
				vm.product.imgIds = 0;
				if(vm.files.length == 0) {
					$timeout(function() {
				        vm.alert = "Добавьте хотя бы одно фото.";
				    }, 100);
			      	$timeout(function() {
			        	vm.alert = "";
			      	}, 2500);
			      	return
				}
			}

			vm.processing = true;

			var upload = Upload.upload({
				url: 'api/admin/changeProduct',
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
		
	}]);

	angular.module('numizmat').controller('EditProdModalCtrl', ['$http', '$timeout', '$uibModalInstance',  function ($http, $timeout, $uibModalInstance) {
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