/**
 * AngularDualListBox - A dual selector box in the vein of the efficient dual list box built with jquery
 * @version v0.0.15
 * @link https://github.com/killyosaur/AngularDualListBox
 * @license Creative Commons 4.0
 */
(function() {
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
angular.module("killyosaur.dualListBox").run(["$templateCache", function($templateCache) {$templateCache.put("templates/duallistboxes","<div class=\"form-group row\"><div class=col-md-6><h4><span>{{dualListBox.options.sourceTitle}}</span><small>- showing {{dualListBox.sourceFiltered.length}}</small></h4><input style=\"margin-bottom: 5px;\" class=\"filter form-control\" type=text ng-model=dualListBox.sourceFilter placeholder=Filter> <button ng-show=dualListBox.options.moveAllBtn data-type=atr class=\"btn btn-default col-md-6\" style=\"margin-bottom: 5px;\" type=button ng-click=dualListBox.move($event) ng-disabled=\"dualListBox.isControlDisabled(dualListBox.sourceFiltered.length == 0)\"><span class=\"glyphicon glyphicon-list\"></span><span class=\"glyphicon glyphicon-chevron-right\"></span></button> <button data-type=str class=\"btn btn-default\" ng-class=\"{\'col-md-6 pull-right\': dualListBox.options.moveAllBtn, \'col-md-12\': !dualListBox.options.moveAllBtn}\" style=\"margin-bottom: 5px;\" type=button ng-click=dualListBox.move($event) ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.sourceSelectedData.length || dualListBox.sourceSelectedData.length == 0)\"><span class=\"glyphicon glyphicon-chevron-right\"></span></button><select ng-style=selectionBoxStyle multiple ng-model=dualListBox.sourceSelectedData ng-options=\"item[dualListBox.options.text] for item in dualListBox.sourceFiltered = (dualListBox.sourceData | filterBy:dualListBox.sourceFilter:dualListBox.options.text)\"></select></div><div class=col-md-6><h4><span>{{dualListBox.options.destinationTitle}}</span><small>- showing {{dualListBox.destinationFiltered.length || 0}}</small></h4><input style=\"margin-bottom: 5px;\" class=\"filter form-control\" type=text ng-model=dualListBox.destinationFilter placeholder=Filter> <button data-type=stl class=\"btn btn-default\" ng-class=\"{\'col-md-6\': dualListBox.options.moveAllBtn, \'col-md-12\': !dualListBox.options.moveAllBtn}\" style=\"margin-bottom: 5px;\" type=button ng-click=dualListBox.move($event) ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.destinationSelectedData.length || dualListBox.destinationSelectedData.length == 0)\"><span class=\"glyphicon glyphicon-chevron-left\"></span></button> <button ng-show=dualListBox.options.moveAllBtn data-type=atl class=\"btn btn-default col-md-6 pull-right\" style=\"margin-bottom: 5px;\" type=button ng-click=dualListBox.move($event) ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.destinationFiltered || dualListBox.destinationFiltered.length == 0)\"><span class=\"glyphicon glyphicon-chevron-left\"></span><span class=\"glyphicon glyphicon-list\"></span></button><select ng-style=selectionBoxStyle multiple ng-model=dualListBox.destinationSelectedData ng-options=\"item[dualListBox.options.text] for item in dualListBox.destinationFiltered = (dualListBox.destinationData | filterBy:dualListBox.destinationFilter:dualListBox.options.text)\"></select></div></div>");}]);
})();