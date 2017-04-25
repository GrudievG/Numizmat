(function() {
	'use strict';

	angular
		.module('numizmat')
		.controller('HomeController', ['$rootScope', '$scope', '$http', '$interval', function ($rootScope, $scope, $http, $interval) {
			moment.locale('ru')
			var vm = this;
			var timestamp = undefined;
			var interval = undefined;

			vm.days = undefined;
			vm.hours = undefined;
			vm.minutes = undefined;
			vm.seconds = undefined;
			vm.auctionName = "";
			vm.active = undefined;
			vm.products = [];
			vm.topLots = [];

			$http.get('/api/getPublicAuction').then(function(resolve) {
				if(resolve.data.success) {
					vm.active = 'yes';
					vm.auctionName = resolve.data.auction.name;
					var time = Number(resolve.data.auction.timeToStart);

					vm.auctionTime = moment(time).format('LLL');
					console.log(Date.now() > time)
					var top = resolve.data.auction.lots.filter(function(lot) {
						return lot.top == true
					});
					top.forEach(function(lot) {
						if(Date.now() < Number(lot.startTrading)) {
							lot.timeToStart = moment(new Date(Number(lot.startTrading))).fromNow();
						} else if (Date.now() > Number(lot.startTrading) && Date.now() < Number(lot.endTrading)) {
							lot.timeToStart = "Торги идут в данный момент"
						} else if (Date.now() > Number(lot.endTrading)) {
							lot.timeToStart = "Торги завершены"
						}
					})
					vm.topLots = top;
					timestamp = Number(resolve.data.auction.timeToStart)
					if (timestamp > Date.now()) {
						updateTimer(timestamp);
						interval = $interval(function() {
							updateTimer(timestamp);
							if (getTimeRemaining(timestamp).total <= 1000) {
						    	$interval.cancel(interval);
						   	}
						}, 1000)
					} else {
						vm.days = 0;
						vm.hours = 0;
						vm.minutes = 0;
						vm.seconds = 0;
					}
				} else {
					vm.active = 'no'
				}
			})

			$http.get('/api/getNewProds').then(function(resolve) {
				vm.products = resolve.data.reverse();
			})

			function getTimeRemaining (timestamp) {
				var delta = timestamp - Date.now();
				var seconds = Math.floor( (delta/1000) % 60 );
			  	var minutes = Math.floor( (delta/1000/60) % 60 );
			  	var hours = Math.floor( (delta/(1000*60*60)) % 24 );
			  	var days = Math.floor( delta/(1000*60*60*24) );
			  	return {
			   		'total': delta,
			   		'days': days,
			   		'hours': hours,
			   		'minutes': minutes,
			   		'seconds': seconds
			  	};
			}

			function updateTimer (timestamp) {
				vm.days = getTimeRemaining(timestamp).days;
				vm.hours = getTimeRemaining(timestamp).hours;
				vm.minutes = getTimeRemaining(timestamp).minutes;
				vm.seconds = getTimeRemaining(timestamp).seconds;
			}

			$scope.$on('$destroy', function() {
				$interval.cancel(interval);
			})

		}]);

})();