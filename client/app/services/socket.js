(function() {
	'use strict';

	angular.module('numizmat').factory('socket', function () {
		var socket = io.connect(window.location.origin);
		return socket;
	});

})();