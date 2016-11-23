(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminEditProduct', ['$http', '$stateParams', '$timeout', 'Upload', function ($http, $stateParams, $timeout, Upload) {

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

				resolve.data.props.forEach( function(prop, number) {
					vm.product.props.forEach(function (el, index) {
						if(el.meta == prop.meta) {
							el.currentValue =  prop.value
						}
					})
				})

				vm.product.availability = resolve.data.availability;
				vm.product.name = resolve.data.name;
				vm.product.main_description = resolve.data.main_description;
				vm.product.short_description = resolve.data.short_description;
				vm.product.availability = resolve.data.availability;
				vm.product.imgIds = resolve.data.imgIds;
				vm.product.price = resolve.data.price;
				vm.product.id = id;
				vm.product.category = resolve.data.category;
				vm.product.subcategory = resolve.data.subcategory;

			})

			$http.get('/api/getCategories').then(function(resolve) {
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

})();