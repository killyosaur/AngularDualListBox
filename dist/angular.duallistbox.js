/**
 * angular.duallistbox
 * @version v0.0.11 - 2015-01-09
 * @author Michael Walker (killyosaur@hotmail.com)
 * @link https://github.com/killyosaur/angularduallistbox
 * @license Creative Commons Attribution-ShareAlike 4.0 International License
**/
'use strict';
angular.module('killyosaur.dualListBox', [])
.run(["$templateCache", function ($templateCache) {
    $templateCache.put("template/duallistbox/boxes.html",
"<div class=\"form-group row\">\
    <div class=\"col-md-6\">\
        <h4><span>{{options.sourceTitle}}</span><small> - showing {{sourceFiltered.length}}</small></h4>\
        <input style=\"margin-bottom: 5px;\" class=\"filter form-control\" type=\"text\" ng-model=\"sourceFilter\" placeholder=\"Filter\" />\
        <button ng-show=\"options.moveAllBtn\" data-type=\"atr\" class=\"btn btn-default col-md-6\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"isControlDisabled(sourceFiltered.length == 0)\">\
            <span class=\"glyphicon glyphicon-list\"></span><span class=\"glyphicon glyphicon-chevron-right\"></span>\
        </button>\
        <button data-type=\"str\" class=\"btn btn-default \" ng-class=\"{'col-md-6 pull-right': options.moveAllBtn, 'col-md-12': !options.moveAllBtn}\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"isControlDisabled(!sourceSelectedData.length || sourceSelectedData.length == 0)\">\
            <span class=\"glyphicon glyphicon-chevron-right\"></span>\
        </button>\
        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"sourceSelectedData\" ng-options=\"item[options.text] for item in sourceFiltered = (sourceData | filter:filterBy(sourceFilter))\"></select>\
    </div>\
    <div class=\"col-md-6\">\
        <h4><span>{{options.destinationTitle}}</span><small> - showing {{destinationFiltered.length ? destinationFiltered.length : 0}}</small></h4>\
        <input style=\"margin-bottom: 5px;\" class=\"filter form-control\" type=\"text\" ng-model=\"destinationFilter\" placeholder=\"Filter\" />\
        <button data-type=\"stl\" class=\"btn btn-default \" ng-class=\"{'col-md-6': options.moveAllBtn, 'col-md-12': !options.moveAllBtn}\"style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"isControlDisabled(!destinationSelectedData.length || destinationSelectedData.length == 0)\">\
            <span class=\"glyphicon glyphicon-chevron-left\"></span>\
        </button>\
        <button ng-show=\"options.moveAllBtn\" data-type=\"atl\" class=\"btn btn-default col-md-6 pull-right\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"isControlDisabled(!destinationFiltered || destinationFiltered.length == 0)\">\
            <span class=\"glyphicon glyphicon-chevron-left\"></span><span class=\"glyphicon glyphicon-list\"></span>\
        </button>\
        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"destinationSelectedData\" ng-options=\"item[options.text] for item in destinationFiltered = (destinationData | filter:filterBy(destinationFilter))\"></select>\
    </div>\
</div>"
    );
}])
.controller('dualListBoxController', [
    '$scope',
    '$attrs',
    '$timeout',
    function ($scope, $attrs, $timeout) {
        var self = this,
            ngModelCtrl = { $setViewValue: angular.noop },
            ngdisabled = false;

        function controlDisabled() {
            return (angular.isDefined($scope.controlDisabled) && $scope.controlDisabled()) || ngdisabled;
        }

        this.init = function (ngModelCtrl_) {
            ngModelCtrl = ngModelCtrl_;

            ngModelCtrl.$render = function () {
                self.render();
            };
        }

        //model -> UI
        this.render = function () {
            $scope.destinationData = ngModelCtrl.$modelValue;
        };

        $attrs.$observe("disabled", function(disabled) {
            ngdisabled = disabled;
        });

        $scope.$watch('destinationData', function (newDestData) {
            if (angular.isDefined($scope.source) && angular.isArray($scope.source)) {
                $scope.sourceData = [];
                angular.forEach($scope.source, function (datum) {
                    if (angular.isUndefined(newDestData) || getIndex(newDestData, datum) === -1) {
                        $scope.sourceData.push(datum);
                    }
                });
            } else {
                throw 'No valid data source available!';
            }
        });

        function getIndex(data, item) {
            var index = -1;
            angular.forEach(data, function (datum, i) {
                if (angular.toJson(datum) === angular.toJson(item)) {
                    index = i;
                }
            });
            return index;
        }

        $scope.isControlDisabled = function (standard) {
            return (angular.isUndefined(standard) && controlDisabled()) || (standard || controlDisabled());
        }

        $scope.move = function (event) {
            event.preventDefault();
            var button = event.currentTarget;
            $timeout(function () {
                var dataType = button.getAttribute('data-type');
                var modelData = [];
                modelData = modelData.concat($scope.destinationData);
                $scope.$apply(function() {
                    switch (dataType) {
                    case 'atr':
                        if ($scope.sourceData.length >= $scope.options.maxAllBtn && confirm($scope.options.warning) ||
                            $scope.sourceData.length < $scope.options.maxAllBtn) {
                            modelData = modelData ? modelData.concat($scope.sourceData) : $scope.sourceData;
                            if ($scope.sourceSelectedData) {
                                $scope.sourceSelectedData.length = 0;
                            }
                        }
                        break;
                    case 'atl':
                        if (modelData.length >= $scope.options.maxAllBtn && confirm($scope.options.warning) ||
                            modelData.length < $scope.options.maxAllBtn) {
                            modelData.splice(0);
                            if ($scope.destinationSelectedData) {
                                $scope.destinationSelectedData.length = 0;
                            }
                        }
                        break;
                    case 'str':
                        modelData = modelData ? modelData.concat($scope.sourceSelectedData) : $scope.sourceSelectedData;
                        $scope.sourceSelectedData.length = 0;
                        break;
                    case 'stl':
                        angular.forEach($scope.destinationSelectedData, function(datum) {
                            var index = getIndex($scope.destinationData, datum);
                            modelData.splice(index, 1);
                        });
                        $scope.destinationSelectedData.length = 0;
                        break;
                    }
                });

                ngModelCtrl.$setViewValue(modelData);
                ngModelCtrl.$render();
            }, $scope.options.timeout);
        };

        $scope.filterBy = function (filterValue) {
            var search = {};
            search[$scope.options.text] = filterValue;
            return search;
        };
    }
])
.constant('dualListBoxConfig', {
    text: 'name',                       // Text that is assigned to the option field.
    sourceTitle: 'Available Items',     // Title of the source list of the dual list box.
    destinationTitle: 'Selected Items', // Title of the destination list of the dual list box.
    timeout: 500,                       // Timeout for when a filter search is started.
    textLength: 45,                     // Maximum text length that is displayed in the select.
    moveAllBtn: true,                   // Whether the append all button is available.
    maxAllBtn: 500,                     // Maximum size of list in which the all button works without warning. See below.
    warning: 'Are you sure you want to move this many items? Doing so can cause your browser to become unresponsive.'
})
.directive('dualListBox', [
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
            templateUrl: "template/duallistbox/boxes.html",
            controller: 'dualListBoxController',
            link: function (scope, element, attributes, ctrls) {
                var ngModelCtrl = ctrls[0], duallistboxCtrl = ctrls[1];
                scope.sourceFilter = "";
                scope.destinationFilter = "";
                scope.destinationData = [];
                scope.sourceData = [];
                scope.options = {};
                scope.selectionBoxStyle = {
                    width: '100%',
                    height: '200px'
                }
                if (angular.isDefined(attributes.height)) {
                    scope.selectionBoxStyle.height = attributes.height;
                }

                for (var i in dualListBoxConfig) {
                    scope.options[i] = angular.isDefined(attributes[i]) ? angular.isString(dualListBoxConfig[i]) ? attributes[i] : scope.$parent.$eval(attributes[i]) : dualListBoxConfig[i];
                }

                ngModelCtrl.$viewChangeListeners.push(function () {
                    scope.$eval(attributes.ngChange);
                });

                duallistboxCtrl.init(ngModelCtrl);
            }
        }
    }
]);
