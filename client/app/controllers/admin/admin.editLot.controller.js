(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminEditLot', ['$http', '$stateParams', '$timeout', 'Upload', function ($http, $stateParams, $timeout, Upload) {

			var vm = this;
			var id = $stateParams.lot_id;
			vm.processing = false;
			vm.addProductSuccess = false;
			vm.properties = []
			vm.files = [];
			vm.categories = [];
			vm.subcategories = [];
			vm.alert = "";

			vm.lot = {
				photos: vm.files,
				props:[]
			}

			$http.get('/api/getAttributes').then(function(resolve) {
				vm.lot.props = resolve.data;
			})

			$http.get('/api/lot/'+id).then(function(resolve) {
				resolve.data.props.forEach( function(prop, number) {
					vm.lot.props.forEach(function (el, index) {
						if(el.meta == prop.meta) {
							el.currentValue =  prop.value
						}
					})
				})

				vm.lot.availability = resolve.data.availability;
				vm.lot.name = resolve.data.name;
				vm.lot.main_description = resolve.data.main_description;
				vm.lot.short_description = resolve.data.short_description;
				vm.lot.availability = resolve.data.availability;
				vm.lot.imgIds = resolve.data.imgIds;
				vm.lot.price = resolve.data.price;
				vm.lot.id = id;
				vm.lot.category = resolve.data.category;
				vm.lot.subcategory = resolve.data.subcategory;
				vm.lot.top = resolve.data.top;
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
					if (el.name == vm.lot.category) {
						vm.subcategories = el.subcats;
					}
				})
			}

			vm.removePhoto = function (index) {
				vm.lot.imgIds.splice(index, 1)
			}

			vm.updateLot = function() {
				if(vm.lot.imgIds.length == 0 || vm.lot.imgIds == 0) {
					vm.lot.imgIds = 0;
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
					url: 'api/admin/updateLot',
					method: 'POST',
					data: vm.lot
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