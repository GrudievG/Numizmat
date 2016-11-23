(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('ProductController', ['$rootScope', '$http', '$stateParams', '$window', 'Lightbox', function ($rootScope, $http, $stateParams, $window, Lightbox) {

			var vm = this;

			vm.productId = $stateParams.product_id;

			vm.product = {};
			vm.imgUrls = [];
			vm.isInBasket = false;

			if(!$rootScope.loggedIn) {
				vm.errorMessage = "Только авторизованные пользователи могут добавлять товары в корзину. Пожалуйста, авторизуйтесь."
			}

			$http.get('api/product/' + $stateParams.product_id).then(function(resolve) {
				vm.product = resolve.data;
				resolve.data.imgIds.forEach(function(el) {
					var url = "http://res.cloudinary.com/dsimmrwjb/image/upload/" + el + ".png"
					vm.imgUrls.push(url)
				});
				return $http.post('api/product/isInBasket', {
					product_id: vm.product._id,
					user_id: $window.localStorage.getItem('id')
				})
			}).then(function(resolve) {
				if (resolve.data.success)
					vm.isInBasket = true;
				else return
			});

			vm.openLightboxModal = function (index) {
			    Lightbox.openModal(vm.imgUrls, index);
			};

			vm.addToBasket = function() {
				$http.put('api/product/addToBasket', {
					product: vm.product,
					user_id: $window.localStorage.getItem('id')
				}).then(function(resolve) {
					vm.isInBasket = true;
				});
			};

		}]);

})();