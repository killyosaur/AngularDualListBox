/**
 * angular.duallistbox
 * @version v0.0.2 - 2014-12-29
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
        <button ng-show=\"options.moveAllBtn\" data-type=\"atr\" class=\"btn btn-default col-md-6\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"sourceFiltered.length == 0\">\
            <span class=\"glyphicon glyphicon-list\"></span><span class=\"glyphicon glyphicon-chevron-right\"></span>\
        </button>\
        <button data-type=\"str\" class=\"btn btn-default \" ng-class=\"{'col-md-6 pull-right': options.moveAllBtn, 'col-md-12': !options.moveAllBtn}\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"!sourceSelectedData.length || sourceSelectedData.length == 0\">\
            <span class=\"glyphicon glyphicon-chevron-right\"></span>\
        </button>\
        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"sourceSelectedData\" ng-options=\"item[options.text] for item in sourceFiltered = (sourceData | filter:filterBy(sourceFilter))\"></select>\
    </div>\
    <div class=\"col-md-6\">\
        <h4><span>{{options.destinationTitle}}</span><small> - showing {{destinationFiltered.length ? destinationFiltered.length : 0}}</small></h4>\
        <input style=\"margin-bottom: 5px;\" class=\"filter form-control\" type=\"text\" ng-model=\"destinationFilter\" placeholder=\"Filter\" />\
        <button dat-type=\"stl\" class=\"btn btn-default \" ng-class=\"{'col-md-6': options.moveAllBtn, 'col-md-12': !options.moveAllBtn}\"style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"!destinationSelectedData.length || destinationSelectedData.length == 0\">\
            <span class=\"glyphicon glyphicon-chevron-left\"></span>\
        </button>\
        <button ng-show=\"options.moveAllBtn\" data-type=\"atl\" class=\"btn btn-default col-md-6 pull-right\" style=\"margin-bottom: 5px;\" type=\"button\" ng-click=\"move($event)\" ng-disabled=\"!destinationFiltered || destinationFiltered.length == 0\">\
            <span class=\"glyphicon glyphicon-chevron-left\"></span><span class=\"glyphicon glyphicon-list\"></span>\
        </button>\
        <select ng-style=\"selectionBoxStyle\" multiple=\"multiple\" ng-model=\"destinationSelectedData\" ng-options=\"item[options.text] for item in destinationFiltered = (destinationData | filter:filterBy(destinationFilter))\"></select>\
    </div>\
</div>"
    );
}])
.directive('dualListBox', [
    '$compile',
    '$timeout',
    '$filter',
    function ($compile, $timeout, $filter) {
        return {
            restrict: 'AE',
            require: '^ngModel',
            scope: { sourceData: "=" },
            replace: true,
            templateUrl: "template/duallistbox/boxes.html",
            link: function (scope, element, attributes, ngModelCtrl) {
                scope.sourceFilter = "";
                scope.destinationFilter = "";
                scope.destinationData = [];
                scope.options = {
                    uri: '',                            // JSON file that can be opened for the data.
                    text: 'name',                       // Text that is assigned to the option field.
                    sourceTitle: 'Available Items',     // Title of the source list of the dual list box.
                    destinationTitle: 'Selected Items', // Title of the destination list of the dual list box.
                    timeout: 500,                       // Timeout for when a filter search is started.
                    textLength: 45,                     // Maximum text length that is displayed in the select.
                    moveAllBtn: true,                   // Whether the append all button is available.
                    maxAllBtn: 500,                     // Maximum size of list in which the all button works without warning. See below.
                    warning: 'Are you sure you want to move this many items? Doing so can cause your browser to become unresponsive.'
                };
                scope.selectionBoxStyle = {
                    width: '100%',
                    height: '200px'
                }
                if (attributes.height) {
                    scope.selectionBoxStyle.height = attributes.height;
                }
                for (var i in scope.options) {
                    if (i == "uri" && attributes.source) {
                        scope.options.uri = attributes.source;
                    } else if(attributes[i]) {
                        scope.options[i] = attributes[i];
                    }
                }

                //model -> UI
                ngModelCtrl.$render = function () {
                    scope.destinationData = ngModelCtrl.$viewValue;
                };

                scope.$watch('destinationData', function () {
                    if (angular.isDefined(scope.destinationData) && scope.destinationData.length > 0) {
                        angular.forEach(scope.destinationData, function (datum) {
                            var index = scope.sourceData.indexOf(datum);
                            if (index > -1)
                                scope.sourceData.splice(index, 1);
                        });
                    }
                });

                scope.move = function (event) {
                    event.preventDefault();
                    var button = event.currentTarget;
                    var dataType = button.getAttribute('data-type');
                    var modelData = scope.destinationData;
                    switch (dataType) {
                        case 'atr':
                            if (scope.sourceData.length >= scope.options.maxAllBtn && confirm(scope.options.warning) ||
                                scope.sourceData.length < scope.options.maxAllBtn) {
                                $timeout(function () {
                                    modelData = modelData ? modelData.concat(scope.sourceData) : scope.sourceData;
                                }, options.timeout);
                            }
                            break;
                        case 'atl':
                            if (modelData.length >= scope.options.maxAllBtn && confirm(scope.options.warning) ||
                                modelData.length < scope.options.maxAllBtn) {
                                $timeout(function () {
                                    scope.sourceData = scope.sourceData.concat(modelData);
                                    modelData.splice(0);
                                }, options.timeout);
                            }
                            if (modelData.length > 0) {
                                throw 'Move timed out before operation could complete';
                            }
                            break;
                        case 'str':
                            modelData = modelData ? modelData.concat(scope.sourceSelectedData) : scope.sourceSelectedData;
                            break;
                        case 'stl':
                            scope.sourceData = scope.sourceData.concat(scope.destinationSelectedData);
                            angular.forEach(scope.destinationSelectedData, function (datum) {
                                var index = scope.destinationData.indexOf(datum);
                                modelData.splice(index, 1);
                            });
                            break;
                    }

                    ngModelCtrl.$setViewValue(modelData);
                    ngModelCtrl.$render();
                };

                scope.filterBy = function (filterValue) {
                    var search = {};
                    search[scope.options.text] = filterValue;
                    return search;
                };
            }
        }
    }
]);
