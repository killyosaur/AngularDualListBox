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