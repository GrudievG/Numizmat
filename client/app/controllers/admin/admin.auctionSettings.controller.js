(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('SettingsController', ['$interval', '$http', 'socket', function ($interval, $http, socket) {
			moment.locale('ru')
			var vm = this;
			var settings = {};
			var auction = undefined;
			vm.edit = true;

			$http.get('/api/getSettings').then(function(resolve) {

				if(resolve.data.tradingLot >= 3600000 && resolve.data.tradingLot % 3600000 == 0) {
					vm.timeCount = "hour";
					vm.timeToTradeLot = resolve.data.tradingLot / 3600000;
				} else if(resolve.data.tradingLot >= 60000 && resolve.data.tradingLot % 60000 == 0) {
					vm.timeCount = "minute";
					vm.timeToTradeLot = resolve.data.tradingLot / 60000;
				} else {
					vm.timeCount = "second";
					vm.timeToTradeLot = resolve.data.tradingLot / 1000;
				}
				if(resolve.data.prolongTime >= 3600000 && resolve.data.prolongTime % 3600000 == 0) {
					vm.prolongCount = "hour";
					vm.timeToProlong = resolve.data.prolongTime / 3600000;
				} else if(resolve.data.prolongTime >= 60000 && resolve.data.prolongTime % 60000 == 0) {
					vm.prolongCount = "minute";
					vm.timeToProlong = resolve.data.prolongTime / 60000;
				} else {
					vm.prolongCount = "second";
					vm.timeToProlong = resolve.data.prolongTime / 1000;
				}

				vm.fromNull = resolve.data.betSteps.fromNull;
				vm.fromOneMile = resolve.data.betSteps.fromOneMile;
				vm.fromTwoMile = resolve.data.betSteps.fromTwoMile;
				vm.fromFiveMile = resolve.data.betSteps.fromFiveMile;
				vm.fromTenMile = resolve.data.betSteps.fromTenMile;
				vm.fromTwentyMile = resolve.data.betSteps.fromTwentyMile;
				vm.fromFiftyMile = resolve.data.betSteps.fromFiftyMile;
				vm.fromOneHundredMile = resolve.data.betSteps.fromOneHundredMile;
				vm.fromTwoHundredMile = resolve.data.betSteps.fromTwoHundredMile;
				vm.fromFiveHundredMile = resolve.data.betSteps.fromFiveHundredMile;		
			})

			function checkTime () {
				if(Number(auction.timeToStart) < Date.now()) {
					vm.edit = false;
				}
			}

			$http.get('/api/admin/auctionIsExist').then(function(resolve) {
				if(!resolve.data.auction)
					return
				else {
					auction = resolve.data.auction;
					checkTime();
					$interval(checkTime, 1000);
				}
			})

			vm.check = function(param) {
				if (!vm.timeToTradeLot || !vm.timeToProlong || !vm.timeCount || !vm.prolongCount || !vm.fromNull || !vm.fromOneMile || !vm.fromTwoMile || !vm.fromFiveMile || !vm.fromTenMile || !vm.fromTwentyMile || !vm.fromFiftyMile || !vm.fromOneHundredMile || !vm.fromTwoHundredMile || !vm.fromFiveHundredMile )
					return

				if(vm.timeCount == "hour")
					settings.tradingLot = vm.timeToTradeLot * 3600000;
				else if(vm.timeCount == "minute")
					settings.tradingLot = vm.timeToTradeLot * 60000;
				else if(vm.timeCount == "second")
					settings.tradingLot = vm.timeToTradeLot * 1000;
				if (vm.prolongCount == "hour")
					settings.prolongTime = vm.timeToProlong * 3600000;
				else if(vm.prolongCount == "minute")
					settings.prolongTime = vm.timeToProlong * 60000;
				else if(vm.prolongCount == "second")
					settings.prolongTime = vm.timeToProlong * 1000;

				settings.betSteps = {
					fromNull: vm.fromNull,
					fromOneMile:vm.fromOneMile,
					fromTwoMile:vm.fromTwoMile,
					fromFiveMile:vm.fromFiveMile,
					fromTenMile:vm.fromTenMile,
					fromTwentyMile:vm.fromTwentyMile,
					fromFiftyMile:vm.fromFiftyMile,
					fromOneHundredMile:vm.fromOneHundredMile,
					fromTwoHundredMile:vm.fromTwoHundredMile,
					fromFiveHundredMile:vm.fromFiveHundredMile
				}

				$http.post('/api/admin/saveSettings', settings).then(function(resolve) {
					if(param == 'tradingLot')
						socket.emit('recount trading time')
					else if(param == 'prolongTime' || param == 'betSteps')
						socket.emit('change settings')
				})
			}

		}]);

})();