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

            var modelLength = ngModelCtrl.$modelValue.length;
            self.destinationData = new Array(modelLength);

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

        $scope.$watch('destinationData', function (newDestData) {
            updateSourceData(newDestData, self.source);
        });

        $scope.$watch('source', function (newSourceData) {
            updateSourceData(self.destinationData, newSourceData);
        }, true);

        function updateSourceData(destinationData, sourceData) {
            if (angular.isDefined(sourceData) && angular.isArray(sourceData)) {
                if (angular.isUndefined(destinationData) || destinationData.length == 0) {
                    self.sourceData = [];
                    self.sourceData = self.sourceData.concat(sourceData);
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
                if (data[i][self.options.value] === item[self.options.value]) {
                    return i;
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
                modelData = modelData.concat(self.destinationData);

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

        self.filterBy = function (filterValue) {
            var search = {};
            search[self.options.text] = filterValue;
            return search;
        };
    }
]);