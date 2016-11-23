(function() {
	'use strict';

	angular.module('numizmat').factory('socket', function () {

		var socket = io.connect('http://localhost:3000');
		return socket;

	});

})();