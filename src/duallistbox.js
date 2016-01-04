angular.module('killyosaur.dualListBox').directive('dualListBox', [
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

                ngModelCtrl.$render = function(){
                    duallistboxCtrl.render(ngModelCtrl.$modelValue);
                };
                
                scope.setViewValue = function(modelData){
                    ngModelCtrl.$setViewValue(modelData);
                    ngModelCtrl.$render();
                }
            }
        }
    }
]);