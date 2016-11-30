(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminCreateProduct', ['$http', 'Upload', function ($http, Upload) {

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

})();