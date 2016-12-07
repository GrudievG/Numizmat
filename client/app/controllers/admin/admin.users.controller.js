(function() {
	'use strict';

	angular.module('numizmat').controller('AdminUsersController', ['$http', '$window', '$uibModal', function ($http, $window, $uibModal) {

		var vm = this;
		var reserveUsers = [];

		vm.allUsers = [];
		vm.admins = [];
		vm.users = [];
		vm.arrayToShow = [];
		vm.selectAll = false;
		vm.currentArray = '';
		vm.selectedUsers = [];
		vm.pagination = {
			pageSize: 15,
			totalItems: vm.arrayToShow.length,
			currentPage:1,
			filtered: []
		}

		function rebuildUserlist () {
			vm.admins = vm.allUsers.filter(function(el) {
				return el.admin == true
			})
			vm.users = vm.allUsers.filter(function(el) {
				return el.admin == false
			})

			switch(vm.currentArray) {
				case 'all':
					vm.arrayToShow = vm.allUsers;
					break;
				case 'admins':
					vm.arrayToShow = vm.admins;
					break;
				case 'users':
					vm.arrayToShow = vm.users;
					break;
			}
		} 

		function showAll () {
			vm.allUsers = reserveUsers;
			rebuildUserlist();
			vm.changePage();
		}

		$http.get("/api/admin/users").then(function(resolve) {
			vm.allUsers = resolve.data;
			reserveUsers = angular.copy(vm.allUsers)
			vm.currentArray = 'all';
			rebuildUserlist();
			vm.changePage();
		})

		vm.searchUsers = function() {
			if(vm.query.length == 0)
				showAll();
			else {
				$http.get('api/admin/searchUsers/'+ vm.query).then(function(resolve) {
					vm.allUsers = resolve.data;
					rebuildUserlist();
					vm.changePage();
				})
			}
		}

		vm.switchArray = function (array) {
			if (array == 'all') {
				vm.currentArray = array;
				vm.arrayToShow = vm.allUsers;
				vm.switcherAdmins = false;
				vm.switcherUsers = false;
				vm.switcherAll = true;
				vm.changePage();
			} else if (array == 'admins') {
				vm.currentArray = array;
				vm.arrayToShow = vm.admins;
				vm.switcherAdmins = true;
				vm.switcherUsers = false;
				vm.switcherAll = false;
				vm.changePage();
			} else if (array == 'users') {
				vm.currentArray = array;
				vm.arrayToShow = vm.users;
				vm.switcherAdmins = false;
				vm.switcherUsers = true;
				vm.switcherAll = false;
				vm.changePage();
			}
		}

		vm.changeVar = function () {
			if (vm.selectAll) {
				vm.selectedUsers = [];
				vm.arrayToShow.forEach(function(el) {
					el.selected = true;
					vm.selectedUsers.push(el)
				})
			} else {
				vm.arrayToShow.forEach(function(el) {
					el.selected = false;
				})
				vm.selectedUsers = [];
			}
		}

		vm.changePage = function () {
			var begin = ((vm.pagination.currentPage - 1) * vm.pagination.pageSize);
        	var end = begin + vm.pagination.pageSize;

            vm.pagination.totalItems = vm.arrayToShow.length;
            vm.pagination.filtered = vm.arrayToShow.slice(begin, end);
		}

		vm.viewProfile = function(user) {
			var modalInstance = $uibModal.open({
		      	ariaLabelledBy: 'modal-title',
		      	ariaDescribedBy: 'modal-body',
		      	templateUrl: 'userProfile.html',
		      	controller: 'ProfileModalCtrl',
		      	controllerAs: 'modal',
		      	size: 'lg',
		      	resolve: {
		        	user: function () {
		          		return user;
		        	}
		      	}
		    });
		}

		vm.checkSelect = function (user) {
			if(user.selected) {
				vm.selectedUsers.push(user)
			} else 
				vm.selectedUsers.splice(vm.selectedUsers.indexOf(user), 1)
		}

		vm.changeRole = function (role) {
			vm.selectedUsers.forEach(function(el) {
				if (el.email == $window.localStorage.getItem('user')) return;
				if (el.super) return
				
				if(role == 'user') {
					el.admin = false;
				} else if(role == 'admin') {
					el.admin = true;
				}
			})
			$http.post("/api/admin/updateRoles", {users: vm.selectedUsers}).then(function(resolve) {
				vm.admins = vm.allUsers.filter(function(el) {
					return el.admin == true
				})
				vm.users = vm.allUsers.filter(function(el) {
					return el.admin == false
				})
			})
			vm.selectAll = false;
			vm.arrayToShow.forEach(function(el) {
				el.selected = false;
			})
			vm.selectedUsers = [];
		}

		vm.deleteSelectedUser = function () {
			var users = vm.selectedUsers.filter(function(el) {
				return el.email != $window.localStorage.getItem('user') && !el.super
			})
			$http.post("/api/admin/removeUsers", {users: users}).then(function(resolve) {
				users.forEach(function(el) {
					vm.allUsers.splice(vm.allUsers.indexOf(el), 1)
				});
				rebuildUserlist();
				vm.arrayToShow.forEach(function(el) {
					el.selected = false;
				})
				vm.selectAll = false;
				vm.changePage();
			});
			vm.selectedUsers = [];
		}

		vm.removeUser = function (user) {
			if(user.email == $window.localStorage.getItem('user')) return
			if (user.super) return
			
			$http.delete("/api/admin/removeUser/"+user._id).then(function(resolve) {
				vm.allUsers.splice(vm.allUsers.indexOf(user), 1);
				rebuildUserlist();
				vm.changePage();
			})
		}
		
	}]);

	angular.module('numizmat').controller('ProfileModalCtrl', ['$http', '$timeout', '$uibModalInstance', 'user', function ($http, $timeout, $uibModalInstance, user) {
		var modal = this;
		modal.user = user;

		modal.close = function() {
			$uibModalInstance.close();
		}
		
	}]);

})();