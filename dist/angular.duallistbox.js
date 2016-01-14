/**
 * AngularDualListBox - A dual selector box in the vein of the efficient dual list box built with jquery
 * @version v0.0.17
 * @link https://github.com/killyosaur/AngularDualListBox
 * @license CC-BY-SA-4.0
 */
(function() {
angular.module('killyosaur.dualListBox', []);
angular.module('killyosaur.dualListBox').directive('dualListBox', [
    function () {
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
                };

                if (angular.isDefined(attributes.height)) {
                    scope.selectionBoxStyle.height = attributes.height;
                }

                ngModelCtrl.$viewChangeListeners.push(function () {
                    scope.$eval(attributes.ngChange);
                });

                var modelLength = ngModelCtrl.$modelValue.length;
                duallistboxCtrl.destinationData = new Array(modelLength);

                ngModelCtrl.$render = function(){
                    duallistboxCtrl.render(ngModelCtrl.$modelValue);
                };

                scope.setViewValue = function(modelData){
                    ngModelCtrl.$setViewValue(modelData);
                    ngModelCtrl.$render();
                };
            }
        };
    }
]);
angular.module('killyosaur.dualListBox').constant('dualListBoxConfig', {
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
angular.module('killyosaur.dualListBox').controller('dualListBoxController', [
    '$scope',
    '$attrs',
    '$timeout',
    '$window',
    'dualListBoxConfig',
    function ($scope, $attrs, $timeout, $window, dualListBoxConfig) {
        var self = this,
            ngdisabled = false;
        
        function removeData(destinationData, dataToRemove) {
            var dataToReturn = [];
            for (var x = 0; x < destinationData.length; x++) {
                var index = getIndex(dataToRemove, destinationData[x]);
                if (index === -1) {
                    dataToReturn.push(destinationData[x]);
                }
            }

            return dataToReturn;
        }

        function controlDisabled() {
            return (angular.isDefined($scope.controlDisabled) && $scope.controlDisabled()) || ngdisabled;
        }

        //model -> UI
        self.render = function (modelValue) {
            self.destinationData = modelValue;
        };

        self.sourceFilter = "";
        self.destinationFilter = "";
        self.sourceData = [];
        self.options = {};
        for (var i in dualListBoxConfig) {
            if (dualListBoxConfig.hasOwnProperty(i)) {
                self.options[i] = angular.isDefined($attrs[i]) ?
                    angular.isString(dualListBoxConfig[i]) ?
                    $attrs[i] : $scope.$parent.$eval($attrs[i])
                    : dualListBoxConfig[i];
            }
        }

        $attrs.$observe("disabled", function(disabled) {
            ngdisabled = disabled;
        });

        $scope.$watchGroup([function() { return self.destinationData; }, function() { return $scope.source; }], function (newData) {
            updateSourceData(newData[0], newData[1]);
        });

        function updateSourceData(destinationData, sourceData) {
            if (angular.isDefined(sourceData) && angular.isArray(sourceData)) {
                if (angular.isUndefined(destinationData) || destinationData.length === 0) {
                    self.sourceData = [];
                    self.sourceData = self.sourceData.concat(sourceData);
                } else {
                    self.sourceData = removeData(sourceData, destinationData);
                }
            } else {
                throw 'No valid data source available!';
            }
        }

        function getIndex(data, item) {
            var ind = 0, length = data.length;

            if (item.hasOwnProperty(self.options.value)) {
                for (; ind < length; ind++) {
                    if (data[ind][self.options.value] === item[self.options.value]) {
                        return ind;
                    }
                }
            } else {
                for (; ind < length; ind++) {
                    var isEqual = false;
                    for (var j in item) {
                        if (data[ind].hasOwnProperty(j) && item.hasOwnProperty(j)) {
                            isEqual = data[ind][j] === item[j];
                        }
                    }
                    if(isEqual) {
                        return ind;
                    }
                }
            }
            return -1;
        }

        self.isControlDisabled = function (standard) {
            return (angular.isUndefined(standard) && controlDisabled()) || (standard || controlDisabled());
        };

        self.move = function (event) {
            event.preventDefault();
            var button = event.currentTarget;
            $timeout(function () {
                var dataType = button.getAttribute('data-type');
                var modelData = [];
                if(self.destinationData) {
                    modelData = modelData.concat(self.destinationData);
                }

                switch (dataType) {
                case 'atr':
                    if (self.options.maxAllBtn === 0 ||
                        (self.sourceFiltered.length >= self.options.maxAllBtn &&
                        $window.confirm(self.options.warning) ||
                        self.sourceFiltered.length < self.options.maxAllBtn)) {
                        modelData = modelData.concat(self.sourceFiltered);
                        if (self.sourceSelectedData) {
                            self.sourceSelectedData.length = 0;
                        }
                    }
                    break;
                case 'atl':
                    if (self.options.maxAllBtn === 0 ||
                        (self.destinationFiltered.length >= self.options.maxAllBtn &&
                        $window.confirm(self.options.warning) ||
                        self.destinationFiltered.length < self.options.maxAllBtn)) {
                        modelData = removeData(self.destinationData, self.destinationFiltered);
                        if (self.destinationSelectedData) {
                            self.destinationSelectedData.length = 0;
                        }
                    }
                    break;
                case 'str':
                    modelData = modelData.concat(self.sourceSelectedData);
                    self.sourceSelectedData.length = 0;
                    break;
                case 'stl':
                    modelData = removeData(self.destinationData, self.destinationSelectedData);
                    self.destinationSelectedData.length = 0;
                    break;
                }

                $scope.setViewValue(modelData);
            }, self.options.timeout);
        };
    }
]);
angular.module('killyosaur.dualListBox').filter('filterBy', ['$filter', function($filter){
	return function(items, value, prop) {
		var search = {};
		if (prop) {
			search[prop] = value;
		} else {
			search = value;
		}
		
		return $filter('filter')(items, search);
	};
}]);
angular.module("killyosaur.dualListBox").run(["$templateCache", function($templateCache) {$templateCache.put("templates/duallistboxes","<div class=\"form-group row\">\r\n    <div class=\"col-md-6\">\r\n        <h4><span>{{dualListBox.options.sourceTitle}}</span><small> - showing {{dualListBox.sourceFiltered.length}}</small></h4>\r\n        <input style=\"margin-bottom: 5px\" class=\"filter form-control\" type=\"text\" ng-model=\"dualListBox.sourceFilter\" placeholder=\"Filter\">\r\n        <button ng-show=\"dualListBox.options.moveAllBtn\" data-type=\"atr\" class=\"btn btn-default col-md-6\" style=\"margin-bottom: 5px\" type=\"button\" ng-click=\"dualListBox.move($event)\" ng-disabled=\"dualListBox.isControlDisabled(dualListBox.sourceFiltered.length == 0)\">\r\n            <span class=\"glyphicon glyphicon-list\"></span><span class=\"glyphicon glyphicon-chevron-right\"></span>\r\n        </button>\r\n        <button data-type=\"str\" class=\"btn btn-default\" ng-class=\"{\'col-md-6 pull-right\': dualListBox.options.moveAllBtn, \'col-md-12\': !dualListBox.options.moveAllBtn}\" style=\"margin-bottom: 5px\" type=\"button\" ng-click=\"dualListBox.move($event)\" ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.sourceSelectedData.length || dualListBox.sourceSelectedData.length == 0)\">\r\n            <span class=\"glyphicon glyphicon-chevron-right\"></span>\r\n        </button>\r\n        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"dualListBox.sourceSelectedData\" ng-options=\"item[dualListBox.options.text] for item in dualListBox.sourceFiltered = (dualListBox.sourceData | filterBy:dualListBox.sourceFilter:dualListBox.options.text)\"></select>\r\n    </div>\r\n    <div class=\"col-md-6\">\r\n        <h4><span>{{dualListBox.options.destinationTitle}}</span><small> - showing {{dualListBox.destinationFiltered.length || 0}}</small></h4>\r\n        <input style=\"margin-bottom: 5px\" class=\"filter form-control\" type=\"text\" ng-model=\"dualListBox.destinationFilter\" placeholder=\"Filter\">\r\n        <button data-type=\"stl\" class=\"btn btn-default\" ng-class=\"{\'col-md-6\': dualListBox.options.moveAllBtn, \'col-md-12\': !dualListBox.options.moveAllBtn}\" style=\"margin-bottom: 5px\" type=\"button\" ng-click=\"dualListBox.move($event)\" ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.destinationSelectedData.length || dualListBox.destinationSelectedData.length == 0)\">\r\n            <span class=\"glyphicon glyphicon-chevron-left\"></span>\r\n        </button>\r\n        <button ng-show=\"dualListBox.options.moveAllBtn\" data-type=\"atl\" class=\"btn btn-default col-md-6 pull-right\" style=\"margin-bottom: 5px\" type=\"button\" ng-click=\"dualListBox.move($event)\" ng-disabled=\"dualListBox.isControlDisabled(!dualListBox.destinationFiltered || dualListBox.destinationFiltered.length == 0)\">\r\n            <span class=\"glyphicon glyphicon-chevron-left\"></span><span class=\"glyphicon glyphicon-list\"></span>\r\n        </button>\r\n        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"dualListBox.destinationSelectedData\" ng-options=\"item[dualListBox.options.text] for item in dualListBox.destinationFiltered = (dualListBox.destinationData | filterBy:dualListBox.destinationFilter:dualListBox.options.text)\"></select>\r\n    </div>\r\n</div>");}]);
})();