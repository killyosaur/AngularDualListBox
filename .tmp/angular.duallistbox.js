var app = angular.module('killyosaur.dualListBox', []);
app.directive('dualListBox', [
    'dualListBoxConfig',
    function (dualListBoxConfig) {
        return {
            restrict: 'AE',
            require: ['^ngModel', '^dualListBox'],
            scope: {
                source: '=',
                controlDisabled: '&'
            },
            replace: true,
            templateUrl: "templates/duallistboxes",
            controller: 'dualListBoxController',
            controllerAs: 'dualListBox',
            link: function (scope, element, attributes, ctrls) {
                var ngModelCtrl = ctrls[0], duallistboxCtrl = ctrls[1];
                scope.selectionBoxStyle = {
                    width: '100%',
                    height: '200px'
                }
                if (angular.isDefined(attributes.height)) {
                    scope.selectionBoxStyle.height = attributes.height;
                }

                ngModelCtrl.$viewChangeListeners.push(function () {
                    scope.$eval(attributes.ngChange);
                });
    
                var modelLength = ngModelCtrl.$modelValue.length;
                duallistboxCtrl.destinationData = new Array(modelLength);

                duallistboxCtrl.init(ngModelCtrl);
            }
        }
    }
]);
app.constant('dualListBoxConfig', {
    text: 'name',                       // Text that is assigned to the option field.
    value: 'id',                          // Optional Value field, will create a standard list box by value.
    sourceTitle: 'Available Items',     // Title of the source list of the dual list box.
    destinationTitle: 'Selected Items', // Title of the destination list of the dual list box.
    timeout: 500,                       // Timeout for when a filter search is started.
    textLength: 45,                     // Maximum text length that is displayed in the select.
    moveAllBtn: true,                   // Whether the append all button is available.
    maxAllBtn: 500,                     // Maximum size of list in which the all button works without warning. See below.
    warning: 'Are you sure you want to move this many items? Doing so can cause your browser to become unresponsive.'
});
app.controller('dualListBoxController', [
    '$scope',
    '$attrs',
    '$timeout',
    '$q',
    'dualListBoxConfig',
    function ($scope, $attrs, $timeout, $q, dualListBoxConfig) {
        var self = this,
            ngModelCtrl = { $setViewValue: angular.noop },
            ngdisabled = false;

        function grep(elems, callback, inv) {
            var retVal,
                ret = [],
                i = 0,
                length = elems.length;
            inv = !!inv;

            // Go through the array, only saving the items
            // that pass the validator function
            for ( ; i < length; i++ ) {
                retVal = !!callback( elems[ i ], i );
                if ( inv !== retVal ) {
                    ret.push( elems[ i ] );
                }
            }

            return ret;
        }

        function controlDisabled() {
            return (angular.isDefined($scope.controlDisabled) && $scope.controlDisabled()) || ngdisabled;
        }

        self.init = function (ngModelCtrl_) {
            ngModelCtrl = ngModelCtrl_;

            ngModelCtrl.$render = function () {
                self.render();
            };
        };

        //model -> UI
        self.render = function () {
            self.destinationData = ngModelCtrl.$modelValue;
        };

        self.sourceFilter = "";
        self.destinationFilter = "";
        self.sourceData = [];
        self.options = {};
        for (var i in dualListBoxConfig) {
            self.options[i] = angular.isDefined($attrs[i]) ? 
                angular.isString(dualListBoxConfig[i]) ? 
                    $attrs[i] : $scope.$parent.$eval($attrs[i])
                : dualListBoxConfig[i];
        }

        $attrs.$observe("disabled", function(disabled) {
            ngdisabled = disabled;
        });

        $scope.$watchGroup([function() { return self.destinationData; }, function() { return $scope.source; }], function (newData) {
            updateSourceData(newData[0], newData[1]);
        });

        function updateSourceData(destinationData, sourceData) {
            if (angular.isDefined(sourceData) && angular.isArray(sourceData)) {
                if (angular.isUndefined(destinationData) || destinationData.length == 0) {
                    self.sourceData = [];
                    self.sourceData = self.sourceData.concat(sourceData);
                } else {
                    self.sourceData = grep(sourceData, function(datum) {
                        return getIndex(destinationData, datum) === -1;
                    });
                }
            } else {
                throw 'No valid data source available!';
            }
        }

        function getIndex(data, item) {
            var i = 0, length = data.length;
            if (!data || data.length === 0) return -1;
            
            if (item.hasOwnProperty(self.options.value)) {
                for (; i < length; i++) {
                    if (data[i][self.options.value] === item[self.options.value]) {
                        return i;
                    }
                }
            } else {
                for (; i < length; i++) {
                    var isEqual = false;
                    for (var j in item) {
                        if (data[i].hasOwnProperty(j) && item.hasOwnProperty(j)) {
                            isEqual = data[i][j] === item[j];
                        }
                    }
                    if(isEqual) {
                        return i;
                    }
                }
            }
            return -1;
        }

        self.isControlDisabled = function (standard) {
            return (angular.isUndefined(standard) && controlDisabled()) || (standard || controlDisabled());
        }

        self.move = function (event) {
            event.preventDefault();
            var deferred = $q.defer();
            var button = event.currentTarget;
            $timeout(function () {
                var dataType = button.getAttribute('data-type');
                var modelData = [];
                if(self.destinationData) {
                    modelData = modelData.concat(self.destinationData);
                }

                switch (dataType) {
                case 'atr':
                    if (self.sourceFiltered.length >= self.options.maxAllBtn && confirm(self.options.warning) ||
                        self.sourceFiltered.length < self.options.maxAllBtn) {
                        modelData = modelData.concat(self.sourceFiltered);
                        if (self.sourceSelectedData) {
                            self.sourceSelectedData.length = 0;
                        }
                    }
                    break;
                case 'atl':
                    if (self.destinationFiltered.length >= self.options.maxAllBtn && confirm(self.options.warning) ||
                        self.destinationFiltered.length < self.options.maxAllBtn) {
                        angular.forEach(self.destinationFiltered, function(datum) {
                            var index = getIndex(modelData, datum);
                            modelData.splice(index, 1);
                        });
                        if (self.destinationSelectedData) {
                            self.destinationSelectedData.length = 0;
                        }
                    }
                    break;
                case 'str':
                    modelData = modelData ? modelData.concat(self.sourceSelectedData) : self.sourceSelectedData;
                    self.sourceSelectedData.length = 0;
                    break;
                case 'stl':
                    angular.forEach(self.destinationSelectedData, function(datum) {
                        var index = getIndex(self.destinationData, datum);
                        modelData.splice(index, 1);
                    });
                    self.destinationSelectedData.length = 0;
                    break;
                }

                ngModelCtrl.$setViewValue(modelData);
                ngModelCtrl.$render();
                deferred.resolve(modelData);
            }, self.options.timeout);
            return deferred;
        };
    }
]);
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