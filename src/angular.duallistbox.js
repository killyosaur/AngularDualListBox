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
    '$q',
    function ($scope, $attrs, $timeout, $q) {
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
            updateSourceData(newDestData, $scope.source);
        });

        $scope.$watch('source', function (newSourceData) {
            updateSourceData($scope.destinationData, newSourceData);
        }, true);

        function updateSourceData(destinationData, sourceData) {
            if (angular.isDefined(sourceData) && angular.isArray(sourceData)) {
                if (angular.isUndefined(destinationData) || destinationData.length == 0) {
                    $scope.sourceData = [];
                    $scope.sourceData = $scope.sourceData.concat(sourceData);
                } else {
                    $scope.sourceData = grep(sourceData, function(datum) {
                        return getIndex(destinationData, datum) === -1;
                    });
                }
            } else {
                throw 'No valid data source available!';
            }
        }

        function getIndex(data, item) {
            var i = 0, length = data.length;
            for (; i < length; i++) {
                if (data[i][$scope.options.value] === item[$scope.options.value]) {
                    return i;
                }
            }
            return -1;
        }

        $scope.isControlDisabled = function (standard) {
            return (angular.isUndefined(standard) && controlDisabled()) || (standard || controlDisabled());
        }

        $scope.move = function (event) {
            event.preventDefault();
            var deferred = $q.defer();
            var button = event.currentTarget;
            $timeout(function () {
                var dataType = button.getAttribute('data-type');
                var modelData = [];
                modelData = modelData.concat($scope.destinationData);
                $scope.$apply(function() {
                    switch (dataType) {
                    case 'atr':
                        if ($scope.sourceFiltered.length >= $scope.options.maxAllBtn && confirm($scope.options.warning) ||
                            $scope.sourceFiltered.length < $scope.options.maxAllBtn) {
                            modelData = modelData.concat($scope.sourceFiltered);
                            if ($scope.sourceSelectedData) {
                                $scope.sourceSelectedData.length = 0;
                            }
                        }
                        break;
                    case 'atl':
                        if ($scope.destinationFiltered.length >= $scope.options.maxAllBtn && confirm($scope.options.warning) ||
                            $scope.destinationFiltered.length < $scope.options.maxAllBtn) {
							angular.forEach($scope.destinationFiltered, function(datum) {
								var index = getIndex(modelData, datum);
								modelData.splice(index, 1);
							});
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
                deferred.resolve(modelData);
            }, $scope.options.timeout);
            return deferred;
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
    value: 'id',                          // Optional Value field, will create a standard list box by value.
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
                var modelLength = ngModelCtrl.$modelValue.length;
                scope.destinationData = new Array(modelLength);
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
