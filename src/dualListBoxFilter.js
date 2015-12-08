app.filter('filterBy', ['$filter', function($filter){
	return function(items, value, prop) {
		var search = {};
		if (prop) {
			search[prop] = value;
		} else {
			search = value;
		}
		
		return $filter('filter')(items, search);
	}
}]);