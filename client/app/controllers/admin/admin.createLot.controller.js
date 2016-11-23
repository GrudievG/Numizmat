(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('AdminCreateLot', ['$http', '$state', 'Upload', function ($http, $state, Upload) {

			var vm = this;
			var auction = {};
			var tradingLot = undefined; 

			$http.get('/api/admin/auctionIsExist').then(function(resolve) {
				if(resolve.data.auction) {
					auction = resolve.data.auction;
					return
				} else
					$state.go('admin.auction')
			})

			vm.processing = false;
			vm.addProductSuccess = false;
			vm.files = [];
			vm.categories = [];
			vm.subcategories = [];

			vm.lot = {
				top: false,
				photos: vm.files,
				props:[]
			}

			$http.get('/api/getAttributes').then(function(resolve) {
				vm.lot.props = resolve.data;
			})
			$http.get('/api/getCategories').then(function(resolve) {
				vm.categories = resolve.data;
			})

			$http.get('/api/getSettings').then(function(resolve) {
				tradingLot = resolve.data.tradingLot
			})

			vm.addProduct = function() {
				var arrOfLotsLength = auction.lots.length;
				vm.lot.startTrading = Number(auction.timeToStart) + (arrOfLotsLength*tradingLot);
				vm.lot.endTrading = vm.lot.startTrading + tradingLot;

				vm.processing = true;

				var upload = Upload.upload({
					url: 'api/admin/addLot',
					method: 'POST',
					data: vm.lot
				});

				upload.then(function(resolve) {
					auction = resolve.data.auction;
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
					if (el.name == vm.lot.category) {
						vm.subcategories = el.subcats;
					}
				})
			}

			vm.backToForm = function() {
				$http.get('/api/getAttributes').then(function(resolve) {
					vm.files = [];
					vm.lot = {
						top: false,
						price: undefined,
						photos: vm.files,
						short_description: "",
						main_description: ""
					}
					vm.lot.props = resolve.data;
				})

				vm.addProductSuccess = false;
			}
			
		}]);

})();