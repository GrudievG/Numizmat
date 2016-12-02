(function() {
	'use strict';

	angular.module('numizmat').controller('AdminCreateLot', ['$http', '$state', 'Upload', '$uibModal', function ($http, $state, Upload, $uibModal) {

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

		vm.addAttr = function () {

			var modalInstance = $uibModal.open({
		      	ariaLabelledBy: 'modal-title',
		      	ariaDescribedBy: 'modal-body',
		      	templateUrl: 'attrModal.html',
		      	controller: 'CreateLotModalCtrl',
		      	controllerAs: 'modal'
		    });

		    modalInstance.result.then(function (selectedItem) {
		    	vm.lot.props.push(selectedItem)
		    }, function () {
		    	
		    });
		}

		vm.backToForm = function() {
			$http.get('/api/getAttributes').then(function(resolve) {
				vm.files = [];
				vm.lot = {
					top: false,
					price: undefined,
					photos: vm.files,
					main_description: ""
				}
				vm.lot.props = resolve.data;
			})

			vm.addProductSuccess = false;
		}
		
	}]);

	angular.module('numizmat').controller('CreateLotModalCtrl', ['$http', '$timeout', '$uibModalInstance',  function ($http, $timeout, $uibModalInstance) {
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