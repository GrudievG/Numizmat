(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('LotController', ['$interval', '$timeout', '$location', '$rootScope', '$scope', '$http', '$stateParams', '$window', 'Lightbox', 'socket', '$uibModal', function ($interval, $timeout, $location, $rootScope, $scope, $http, $stateParams, $window, Lightbox, socket, $uibModal) {
			moment.locale('ru')
			var vm = this;
			var deltaBet = undefined;
			var deltaTime = undefined;
			var settings = {};
			var redirect = undefined;
			vm.togglePopover = false;
			vm.toggleMobilePopover = false;
			vm.ownBet = false;
			vm.bet = undefined;
			vm.minBet = undefined;
			vm.lot = {};
			vm.imgUrls = [];
			vm.endToTrade = undefined;
			vm.available = true;
			vm.prevId = undefined;
			vm.nextId = undefined;
			vm.lotsCount = undefined;

			if(!$rootScope.loggedIn) {
				vm.errorMessage = "Только авторизованные пользователи могут делать ставки. Пожалуйста, авторизуйтесь."
			} else if($rootScope.loggedIn) {
				$http.get('/api/user/' + $window.localStorage.getItem('id')).then(function(resolve) {
					if(!resolve.data.active) {
						vm.errorMessage = "Только активированные пользователи могут делать ставки. Пожалуйста, активируйте свой аккаунт."
					}
				})
			}

			$http.get('/api/getCurrentAuction').then(function(resolve) {
				vm.lotsCount = resolve.data.auction.lots.length;
			});

			$http.get('/api/getSettings').then(function(resolve) {
				settings = resolve.data
				deltaTime = settings.prolongTime;
				return $http.get('api/lot/' + $stateParams.lot_id)
			}).then(function(resolve) {
				vm.lot = resolve.data.current;
				vm.prevId = resolve.data.prev_id;
				vm.nextId = resolve.data.next_id;
				if(vm.lot.customer == $window.localStorage.getItem('id')) {
					vm.ownBet = true;
				}
				resolve.data.current.imgIds.forEach(function(el) {
					var url = "http://res.cloudinary.com/dsimmrwjb/image/upload/" + el + ".png"
					vm.imgUrls.push(url)
				});
				if(vm.lot.bets == 0) {
					checkBetStep();
					vm.bet = vm.lot.price;
					vm.minBet = vm.lot.price;
				} else {
					checkBetStep();
				}
				checkTime();
				if (Date.now() < Number(vm.lot.endTrading)) 
					redirect = $interval(checkRedirect, 1000);
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
					if(Math.floor((vm.lot.endTrading - Date.now()) / 1000) > 60)
						vm.endToTrade = moment(new Date(Number(vm.lot.endTrading))).fromNow();
					else 
						vm.endToTrade = "Через " + Math.floor((vm.lot.endTrading - Date.now()) / 1000) + " секунд"
				} else {
					vm.endToTrade = "Торги завершены";
					vm.available = false;
					$interval.cancel(interval)
				}
			}

			function checkRedirect () {
				if (Date.now() >= Number(vm.lot.endTrading)) {
					$interval.cancel(redirect)
					$timeout(function() {
						if(vm.lot.number === vm.lotsCount) {
							$location.path('/congrats')
						} else {
							$location.path('/lot/'+vm.nextId)
						}
					}, 1500)
				}
			}

			var interval = $interval(checkTime, 1000);
			
			vm.openLightboxModal = function (index) {
			    Lightbox.openModal(vm.imgUrls, index);
			};

			vm.configAutobet = function () {
				var modalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: 'autobetModal.html',
                    controller: 'AutobetModalCtrl',
                    controllerAs: 'modal',
					resolve: {
                    	lot: vm.lot,
						minBet: vm.minBet,
						user: function () {
                            return $window.localStorage.getItem('id');
						}
					}
                });

				modalInstance.result.then(function(resolve) {
                    var currentDelta = Number(vm.lot.endTrading) - Date.now();
					if (vm.lot.autobet && vm.lot.autobet.customer_id === $window.localStorage.getItem('id')) {
						console.log('Customer equals!')
						socket.emit('update:autoBet:price', {
                            lot: vm.lot,
							autobet: resolve
						});
					} else {
                        socket.emit('bet up', {
                            price: vm.lot.price + deltaBet,
                            user_id: $window.localStorage.getItem('id'),
                            user_email: $window.localStorage.getItem('user'),
                            lot: vm.lot,
                            tradingLot: settings.tradingLot,
                            deltaTime: deltaTime,
                            currentDelta: currentDelta,
                            time: moment().format('LLL'),
                            autobet: resolve
                        });
					}
				}, function(reject) {

				});
			};

			vm.makeBet = function() {
                var modalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: 'confirmationModal.html',
                    controller: 'ConfirmModalCtrl',
                    controllerAs: 'modal'
                });
                modalInstance.result.then(function () {
                    var currentDelta = Number(vm.lot.endTrading) - Date.now();
                    socket.emit('bet up', {
                        price: vm.bet,
                        user_id: $window.localStorage.getItem('id'),
                        user_email: $window.localStorage.getItem('user'),
                        lot: vm.lot,
                        tradingLot: settings.tradingLot,
                        deltaTime: deltaTime,
                        currentDelta: currentDelta,
                        time: moment().format('LLL')
                    });
                }, function () {
                    return;
                });
            };

			vm.viewHistory = function (lot) {
				var modalInstance = $uibModal.open({
			      	ariaLabelledBy: 'modal-title',
			      	ariaDescribedBy: 'modal-body',
			      	templateUrl: 'lotHistory.html',
			      	controller: 'HistoryModalCtrl',
			      	controllerAs: 'modal',
			      	resolve: {
			        	lot: function () {
			          		return lot;
			        	}
			      	}
			    });
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
					vm.autobet = vm.minBet;
					$scope.$apply();
				}
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

			function changeSets (data) {
				settings = data;
				deltaTime = settings.prolongTime;
				checkBetStep();
				$scope.$apply();
			}

			function sendEmail (data) {
				$http.post('/api/sendEmail', data).then(function(resolve) {
					console.log(resolve.data)
				})
			}

			socket.on('lot update', lotUpdate);
			socket.on('trading time changed', timeUpdate);
			socket.on('recounting lots', recountingLot);
			socket.on('settings changed', changeSets);
			socket.on('send email', sendEmail);

			$scope.$on('$destroy', function() {
				socket.off('lot update', lotUpdate);
				socket.off('trading time changed', timeUpdate);
				socket.off('recounting lots', recountingLot);
				socket.off('settings changed', changeSets);
				socket.off('send email', sendEmail);
				$interval.cancel(interval);
				$interval.cancel(redirect);
			});

		}])
		.controller('ConfirmModalCtrl', [ '$uibModalInstance', function($uibModalInstance) {
			var modal = this;

			modal.confirm = function () {
				$uibModalInstance.close();
			};

			modal.cancel = function () {
				$uibModalInstance.dismiss('cancel');
			};

		}])
        .controller('AutobetModalCtrl', [ '$uibModalInstance', '$timeout', 'lot', 'minBet', 'user', function($uibModalInstance, $timeout, lot, minBet, user) {
            var modal = this;

            modal.price = lot.price;
            modal.minBet = minBet;
            console.log(lot);

			if (lot.autobet && lot.autobet.customer_id === user) {
            	modal.ownBet = lot.autobet.price;
                modal.autoBet = modal.ownBet;
			} else {
                modal.autoBet = minBet;
			}

            modal.ok = function () {
				if (lot.autobet && modal.autoBet === lot.autobet.price) {
					$timeout(() => {
						modal.errorMessage = "Вы не можете установить автоповышение до этой суммы. Такая автоставка уже существует"
					}, 100);
					$timeout(() => {
						modal.errorMessage = "";
					}, 2100);
				} else {
                    $uibModalInstance.close(modal.autoBet);
				}

            };

            modal.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }]);;

})();