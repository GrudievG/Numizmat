(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('LotController', ['$interval', '$rootScope', '$scope', '$http', '$stateParams', '$window', 'Lightbox', 'socket', function ($interval, $rootScope, $scope, $http, $stateParams, $window, Lightbox, socket) {
			moment.locale('ru')
			var vm = this;
			var deltaBet = undefined;
			var deltaTime = undefined;
			var settings = {};

			vm.ownBet = false;
			vm.bet = undefined;
			vm.minBet = undefined;
			vm.lot = {};
			vm.imgUrls = [];
			vm.endToTrade = undefined;
			vm.available = true;

			if(!$rootScope.loggedIn) {
				vm.errorMessage = "Только авторизованные пользователи могут делать ставки. Пожалуйста, авторизуйтесь."
			} else if($rootScope.loggedIn) {
				$http.get('/api/user/' + $window.localStorage.getItem('id')).then(function(resolve) {
					if(!resolve.data.active) {
						vm.errorMessage = "Только активированные пользователи могут делать ставки. Пожалуйста, активируйте свой аккаунт."
					}
				})
			}

			$http.get('/api/getSettings').then(function(resolve) {
				settings = resolve.data
				deltaTime = settings.prolongTime;
				return $http.get('api/lot/' + $stateParams.lot_id)
			}).then(function(resolve) {
				vm.lot = resolve.data;
				if(vm.lot.customer == $window.localStorage.getItem('id')) {
					vm.ownBet = true;
				}
				resolve.data.imgIds.forEach(function(el) {
					var url = "http://res.cloudinary.com/dsimmrwjb/image/upload/" + el + ".png"
					vm.imgUrls.push(url)
				});
				checkBetStep();
				checkTime();
			});

			function checkBetStep () {
				if (vm.lot.price < 1000)
					deltaBet = settings.betSteps.fromNull;
				else if (vm.lot.price >= 1000 && vm.lot.price < 2000)
					deltaBet = settings.betSteps.fromOneMile;
				else if (vm.lot.price >= 2000 && vm.lot.price < 5000)
					deltaBet = settings.betSteps.fromTwoMile;
				else if (vm.lot.price >= 5000 && vm.lot.price < 10000)
					deltaBet = settings.betSteps.fromFiveMile;
				else if (vm.lot.price >= 10000 && vm.lot.price < 20000)
					deltaBet = settings.betSteps.fromTenMile;
				else if (vm.lot.price >= 20000 && vm.lot.price < 50000)
					deltaBet = settings.betSteps.fromTwentyMile;
				else if (vm.lot.price >= 50000 && vm.lot.price < 100000)
					deltaBet = settings.betSteps.fromFiftyMile;
				else if (vm.lot.price >= 100000 && vm.lot.price < 200000)
					deltaBet = settings.betSteps.fromOneHundredMile;
				else if (vm.lot.price >= 200000 && vm.lot.price < 500000)
					deltaBet = settings.betSteps.fromTwoHundredMile;
				else if (vm.lot.price >= 500000)
					deltaBet = settings.betSteps.fromFiveHundredMile;
				vm.bet = vm.lot.price + deltaBet;
				vm.minBet = vm.lot.price + deltaBet;
			}

			function checkTime () {
				if (Date.now() < Number(vm.lot.endTrading)) {
					vm.endToTrade = moment(new Date(Number(vm.lot.endTrading))).fromNow();
				} else if (Date.now() > Number(vm.lot.endTrading)) {
					vm.endToTrade = "Торги завершены";
					vm.available = false;
				}
			}

			var interval = $interval(checkTime, 1000);
			
			vm.openLightboxModal = function (index) {
			    Lightbox.openModal(vm.imgUrls, index);
			};

			vm.makeBet = function() {
				var currentDelta = Number(vm.lot.endTrading) - Date.now()
				socket.emit('bet up', {
					price: vm.bet,
					user_id: $window.localStorage.getItem('id'),
					user_email: $window.localStorage.getItem('user'),
					lot: vm.lot,
					tradingLot: settings.tradingLot,
					deltaTime: deltaTime,
					currentDelta: currentDelta
				})
			}

			function lotUpdate (data) {
				if(data[0]._id != $stateParams.lot_id) {
					return
				} else {
					vm.lot = data[0];
					if(vm.lot.customer == $window.localStorage.getItem('id'))
						vm.ownBet = true;
					else
						vm.ownBet = false;
					checkBetStep();
					$scope.$apply();
				}
			}

			function recountingLot (data) {
				data.forEach(function(lot) {
					if(lot._id == $stateParams.lot_id) {
						vm.lot.startTrading = lot.startTrading;
						vm.lot.endTrading = lot.endTrading;
						checkTime();
						$scope.$apply();
					}
				})
			}

			function timeUpdate (data) {
				data.forEach(function(item) {
					if(item._id == $stateParams.lot_id) {
						vm.lot = item;
						if(vm.lot.customer == $window.localStorage.getItem('id'))
							vm.ownBet = true;
						else
							vm.ownBet = false;
						checkBetStep();
					}
				})
				$scope.$apply();
			}

			function changeSets (data) {
				settings = data;
				deltaTime = settings.prolongTime;
				checkBetStep();
				$scope.$apply();
			}

			socket.on('lot update', lotUpdate)
			socket.on('recounting lots', recountingLot)
			socket.on('trading time changed', timeUpdate)
			socket.on('settings changed', changeSets)

			$scope.$on('$destroy', function() {
				socket.off('lot update', lotUpdate)
				socket.off('recounting lots', recountingLot)
				socket.off('trading time changed', timeUpdate)
				socket.off('settings changed', changeSets)
				$interval.cancel(interval)
			})

		}]);

})();