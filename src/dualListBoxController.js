app.controller('dualListBoxController', [
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
]);