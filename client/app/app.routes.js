(function() {
	'use strict';

	angular
		.module('numizmat')
		.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function($stateProvider, $urlRouterProvider,  $locationProvider, $httpProvider) {

			$httpProvider.interceptors.push('AuthInterceptor');

			$urlRouterProvider.otherwise("/home");

		  	$stateProvider
		  		.state('signup', {
		      		url: "/signup",
		      		templateUrl: "/app/templates/user/user.signup.html"
		    	})
		    	.state('activation', {
		      		url: "/activation/:token",
		      		templateUrl: "/app/templates/user/user.activation.html"
		    	})
		    	.state('resetPass', {
		      		url: "/reset-password",
		      		templateUrl: "/app/templates/user/user.resetPass.html"
		    	})
		    	.state('dropPass', {
		      		url: "/reset-password/:user_id",
		      		templateUrl: "/app/templates/user/user.dropPass.html"
		    	})
		    	.state('home', {
		      		url: "/home",
		      		templateUrl: "/app/templates/user/user.home.html"
		    	})
		    	.state('auction', {
		      		url: "/auction",
		      		templateUrl: "/app/templates/user/user.auction.html"
	    		})
	    		.state('lot', {
		      		url: "/lot/:lot_id",
		      		templateUrl: "/app/templates/user/user.lot.html"
	    		})
		    	.state('store', {
		      		url: "/store",
		      		templateUrl: "/app/templates/user/user.store.html"
	    		})
	    		.state('product', {
		      		url: "/product/:product_id",
		      		templateUrl: "/app/templates/user/user.product.html"
	    		})
	    		.state('aboutUs', {
		      		url: "/aboutUs",
		      		template: "<h1>aboutUs</h1>"
		    	})
		    	.state('payments', {
		      		url: "/payments",
		      		template: "<h1>payments</h1>",
		    	})
		    	.state('rules', {
		      		url: "/rules",
		      		templateUrl: "/app/templates/user/user.rules.html",
		    	})
		    	.state('archive', {
		      		url: "/archive",
		      		template: "<h1>archive</h1>",
		    	})
		    	.state('profile', {
		      		url: "/profile",
		      		templateUrl: "/app/templates/user/user.profile.html"
		    	})
		    	.state('bets', {
		      		url: "/bets",
		      		templateUrl: "/app/templates/user/user.bets.html"
		    	})
		    	.state('basket', {
		      		url: "/basket",
		      		templateUrl: "/app/templates/user/user.basket.html"
		    	})
		    	.state('admin', {
		      		url: "/admin",
		      		templateUrl: "/app/templates/admin/admin.html"
		    	})
		    	.state('admin.profile', {
		      		url: "/profile",
		      		templateUrl: "/app/templates/user/user.profile.html"
		    	})
		    	.state('admin.users', {
		      		url: "/users",
		      		templateUrl: "/app/templates/admin/admin.users.html"
		    	})
		    	.state('admin.editUser', {
		      		url: "/edit-user-profile/:user_id",
		      		templateUrl: "/app/templates/admin/admin.editProfile.html"
		    	})
		    	.state('admin.createUser', {
		      		url: "/create-new-user",
		      		templateUrl: "/app/templates/admin/admin.createUser.html"
		    	})
		    	.state('admin.products', {
		      		url: "/products",
		      		templateUrl: "/app/templates/admin/admin.products.html"
		    	})
		    	.state('admin.editProduct', {
		      		url: "/edit-product/:product_id",
		      		templateUrl: "/app/templates/admin/admin.editProduct.html"
		    	})
		    	.state('admin.createProduct', {
		      		url: "/createProduct",
		      		templateUrl: "/app/templates/admin/admin.createProduct.html"
		    	})
		    	.state('admin.orders', {
		      		url: "/orders",
		      		templateUrl: "/app/templates/admin/admin.orders.html"
		    	})
		    	.state('admin.attributes', {
		      		url: "/attributes",
		      		templateUrl: "/app/templates/admin/admin.attributes.html"
		    	})
		    	.state('admin.categories', {
		      		url: "/categories",
		      		templateUrl: "/app/templates/admin/admin.categories.html"
		    	})
		    	.state('admin.auction', {
		      		url: "/auction",
		      		templateUrl: "/app/templates/admin/admin.auction.html"
		    	})
		    	.state('admin.createAuction', {
		      		url: "/create-auction",
		      		templateUrl: "/app/templates/admin/admin.createAuction.html"
		    	})
		    	.state('admin.createLot', {
		      		url: "/create-lot",
		      		templateUrl: "/app/templates/admin/admin.createLot.html"
		    	})
		    	.state('admin.editLot', {
		      		url: "/edit-lot/:lot_id",
		      		templateUrl: "/app/templates/admin/admin.editLot.html"
		    	})
		    	.state('admin.auctionSettings', {
		      		url: "/auction-settings",
		      		templateUrl: "/app/templates/admin/admin.auctionSettings.html"
		    	})
		    	.state('admin.statistic', {
		      		url: "/statistic",
		      		templateUrl: "/app/templates/admin/admin.statistic.html"
		    	});
		    	

		    $locationProvider.html5Mode(true);

		}]);

})();