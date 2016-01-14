///<reference path="../bower_components/angular/angular.js"/>
///<reference path="../bower_components/angular-mocks/angular-mocks.js"/>
///<reference path="../bower_components/JSCheck/jscheck.js"/>
///<reference path="helpers/buttons.js"/>
///<reference path="helpers/pickOne.js"/>
///<reference path="../src/app.js"/>
///<reference path="../src/dualListBoxController.js"/>
///<reference path="../src/dualListBoxConfig.js"/>
///<reference path="../src/dualListBoxFilter.js"/>
describe('Controller: dualListBoxController', function() {
    var scope, control, dualListBoxConfig, $window, injected = null;
    var windowMock = function() {
        this.confirmResult;

        this.confirm = function() {
            return this.confirmResult;
        };

        this.confirmTrue = function() {
            this.confirmResult = true;
        };

        this.confirmFalse = function() {
            this.confirmResult = false;
        };
    };

    function fakeController($scope, $attrs, $element) {
        injected = {};
        injected.$scope = $scope;
        injected.$attrs = $attrs;
        injected.$element = $element;
    }

    function removeSelectItems(dataSet, selectItems, key) {
        var result = [];
        for (var i = 0; i < dataSet.length; i++) {
            var remove = false;
            for (var j = 0; j < selectItems.length; j++) {
                if (dataSet[i][key] === selectItems[j][key]) {
                    remove = true;
                    break;
                }
            }

            if (!remove) {
                result.push(dataSet[i]);
            }
        }

        return result;
    }

    function removeDups(data, id) {
        var arr = {};

        for (var i = 0, len = data.length; i < len; i++) {
            arr[data[i][id]] = data[i];
        }

        data = new Array();
        for (var key in arr) {
            if (arr.hasOwnProperty(key)) {
                data.push(arr[key]);
            }
        }

        return data;
    }

    beforeEach(module('killyosaur.dualListBox'));

    beforeEach(inject(function($rootScope, $compile, $controller) {
        scope = $rootScope.$new();
        scope.fakeController = fakeController;

        $window = new windowMock();

        scope.source = [{ name: 'text', id: 1 }, { name: 'text 2', id: 2 }];

        $compile('<span ng-controller="fakeController"></span>')(scope);

        dualListBoxConfig = {
            text: 'name',
            value: 'id',
            sourceTitle: 'Available Items',
            destinationTitle: 'Selected Items',
            timeout: 500,
            textLength: 45,
            moveAllBtn: true,
            maxAllBtn: 500,
            warning: 'Are you sure you want to move this many items? Doing so can cause your browser to become unresponsive.'
        };

        scope.setViewValue = function(value) {
            control.render(value);
        };

        control = $controller('dualListBoxController', {
            $scope: scope,
            $attrs: injected.$attrs,
            $window: $window,
            dualListBoxConfig: dualListBoxConfig
        });

        scope.$digest();
    }));

    it('should set the base options, default all filters, and set source data', function() {
        expect(control.sourceFilter).toBe("");
        expect(control.destinationFilter).toBe("");
        expect(control.destinationFilter).toBe("");
        expect(control.options).toEqual(dualListBoxConfig);
        expect(control.sourceData).toEqual(scope.source);
    });

    describe('- no source error:', function() {
        beforeEach(function() {
            delete scope.source;
        });

        it('should throw an error as no source is available', inject(function($controller) {
            expect(function() {
                control = $controller('dualListBoxController', {
                    $scope: scope,
                    $attrs: injected.$attrs,
                    $window: $window,
                    dualListBoxConfig: dualListBoxConfig
                });

                scope.$digest();
            }).toThrow('No valid data source available!');
        }));
    });

    describe('- attributes:', function() {
        beforeEach(inject(function($compile, $controller) {
            $compile('<span ng-controller="fakeController" data-source-title="a new title" data-text-length="53"></span>')(scope);

            control = $controller('dualListBoxController', {
                $scope: scope,
                $attrs: injected.$attrs,
                $window: $window,
                dualListBoxConfig: dualListBoxConfig
            });

            scope.$digest();
        }));

        it('should change the source title', function() {
            expect(control.options.sourceTitle).toBe("a new title");
        });

        it('should change the text length', function() {
            expect(control.options.textLength).toBe(53);
        });
    });

    describe('- render:', function() {
        it('should set destinationData based on the passed in value', function() {
            control.render([{ name: 'text', id: 1 }]);
            expect(control.destinationData).toEqual([{ name: 'text', id: 1 }]);
        });

        it('should update sourceData to remove data based on what is in destinationData', function() {
            control.render([{ name: 'text', id: 1 }]);
            expect(control.destinationData).toEqual([{ name: 'text', id: 1 }]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(1);
        });

        it('should not update sourceData when destination data is not valid', function() {
            control.render([{}]);
            expect(control.destinationData).toEqual([{}]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(2);
        });

        it('should not update sourceData when destination data is empty', function() {
            control.render([]);
            expect(control.destinationData).toEqual([]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(2);
        });
    });

    describe('- move:', function() {
        var timeout, btn;
        beforeEach(inject(function($rootScope, $compile, $controller, $timeout) {
            timeout = $timeout;
            scope.source = JSC.array(3000, JSC.object({
                name: JSC.one_of(pickOne())
            }))();

            for (var i = 0; i < scope.source.length; i++) {
                scope.source[i].id = i + 1;
            }

            control = $controller('dualListBoxController', {
                $scope: scope,
                $attrs: injected.$attrs,
                $window: $window,
                dualListBoxConfig: dualListBoxConfig
            });

            scope.$digest();
        }));

        describe('set to the right no id', function() {
            beforeEach(inject(function($rootScope, $compile, $controller) {
                btn = strBtn;
                scope.source = JSC.array(3000, JSC.object({
                    name: JSC.one_of(pickOne())
                }))();

                for (var i = 0; i < scope.source.length; i++) {
                    scope.source[i].key = i + 1;
                }

                control = $controller('dualListBoxController', {
                    $scope: scope,
                    $attrs: injected.$attrs,
                    $window: $window,
                    dualListBoxConfig: dualListBoxConfig
                });

                scope.$digest();
            }));

            it('should move set with destinationData = null', function() {
                spyOn(scope, 'setViewValue').and.callThrough();

                var sourceSelectedData = [];
                var indices = JSC.array(25, JSC.integer(0, 2999))();

                for (var i = 0; i < 25; i++) {
                    var value = scope.source[indices[i]];
                    if (sourceSelectedData.indexOf(value) === -1) {
                        sourceSelectedData.push(value);
                    }
                }

                control.sourceSelectedData = [].concat(sourceSelectedData);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
                expect(control.destinationData.length).toEqual(sourceSelectedData.length);
                expect(control.destinationData).toEqual(sourceSelectedData);
                expect(control.sourceSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(sourceSelectedData);
            });
        });

        describe('set to the right', function() {
            beforeEach(function() {
                btn = strBtn;
            });

            it('should move set with destinationData = null', function() {
                spyOn(scope, 'setViewValue').and.callThrough();

                var sourceSelectedData = [];
                var indices = JSC.array(25, JSC.integer(0, 2999))();

                for (var i = 0; i < 25; i++) {
                    var value = scope.source[indices[i]];
                    if (sourceSelectedData.indexOf(value) === -1) {
                        sourceSelectedData.push(value);
                    }
                }

                control.sourceSelectedData = [].concat(sourceSelectedData);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
                expect(control.destinationData.length).toEqual(sourceSelectedData.length);
                expect(control.destinationData).toEqual(sourceSelectedData);
                expect(control.sourceSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(sourceSelectedData);
            });

            it('should move set with empty array value for destination', function() {
                spyOn(scope, 'setViewValue').and.callThrough();

                control.render([]);
                scope.$digest();

                var sourceSelectedData = [];
                var indices = JSC.array(25, JSC.integer(0, 2999))();

                for (var i = 0; i < 25; i++) {
                    var value = scope.source[indices[i]];
                    if (sourceSelectedData.indexOf(value) === -1) {
                        sourceSelectedData.push(value);
                    }
                }

                control.sourceSelectedData = [].concat(sourceSelectedData);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
                expect(control.destinationData.length).toEqual(sourceSelectedData.length);
                expect(control.destinationData).toEqual(sourceSelectedData);
                expect(control.sourceSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(sourceSelectedData);
            });

            it('should move set with destination filled with a set of data', function() {
                spyOn(scope, 'setViewValue').and.callThrough();
                var oldDestData = [];
                var value, i;
                var indices = JSC.array(25, JSC.integer(0, 2999))();

                for (i = 0; i < 25; i++) {
                    value = scope.source[indices[i]];
                    if (oldDestData.indexOf(value) === -1) {
                        oldDestData.push(value);
                    }
                }

                control.render(oldDestData);
                scope.$digest();

                var sourceSelectedData = [];
                indices = JSC.array(15, JSC.integer(0, control.sourceData.length - 1))();

                for (i = 0; i < 15; i++) {
                    value = control.sourceData[indices[i]];
                    if (sourceSelectedData.indexOf(value) === -1) {
                        sourceSelectedData.push(value);
                    }
                }

                control.sourceSelectedData = [].concat(sourceSelectedData);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000 - control.destinationData.length);
                expect(control.destinationData.length).toEqual(oldDestData.length + sourceSelectedData.length);
                expect(control.destinationData).toEqual(oldDestData.concat(sourceSelectedData));
                expect(control.sourceSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(oldDestData.concat(sourceSelectedData));
            });

            it('should move set with filtered destination', inject(function(filterByFilter) {
                spyOn(scope, 'setViewValue').and.callThrough();
                var oldDestData = [];
                var value, i;
                var indices = JSC.array(100, JSC.integer(0, 2999))();

                for (i = 0; i < 100; i++) {
                    value = scope.source[indices[i]];
                    if (oldDestData.indexOf(value) === -1) {
                        oldDestData.push(value);
                    }
                }

                control.render(oldDestData);
                control.destinationFilter = "Bang";
                control.destinationFilter = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                scope.$digest();

                var sourceSelectedData = [];
                indices = JSC.array(15, JSC.integer(0, control.sourceData.length - 1))();

                for (i = 0; i < 15; i++) {
                    value = control.sourceData[indices[i]];
                    if (sourceSelectedData.indexOf(value) === -1) {
                        sourceSelectedData.push(value);
                    }
                }

                control.sourceSelectedData = [].concat(sourceSelectedData);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000 - control.destinationData.length);
                expect(control.destinationData.length).toEqual(oldDestData.length + sourceSelectedData.length);
                expect(control.destinationData).toEqual(oldDestData.concat(sourceSelectedData));
                expect(control.sourceSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(oldDestData.concat(sourceSelectedData));
            }));

            it('should move set with destination set to empty array and source is filtered',
                inject(function(filterByFilter) {
                    spyOn(scope, 'setViewValue').and.callThrough();

                    control.render([]);
                    control.sourceFilter = "Bang";
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    scope.$digest();

                    var sourceSelectedData = [];
                    var indices = JSC.array(5, JSC.integer(0, control.sourceFiltered.length - 1))();

                    for (var i = 0; i < 5; i++) {
                        var value = control.sourceFiltered[indices[i]];
                        if (sourceSelectedData.indexOf(value) === -1) {
                            sourceSelectedData.push(value);
                        }
                    }

                    control.sourceSelectedData = [].concat(sourceSelectedData);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
                    expect(control.destinationData.length).toEqual(sourceSelectedData.length);
                    expect(control.destinationData).toEqual(sourceSelectedData);
                    expect(control.sourceSelectedData.length).toEqual(0);
                    expect(scope.setViewValue).toHaveBeenCalledWith(sourceSelectedData);
                }));

            it('should move set with destination filled with a set of data and source is filtered',
                inject(function(filterByFilter) {
                    spyOn(scope, 'setViewValue').and.callThrough();
                    var value, i;
                    var oldDestData = [];
                    var indices = JSC.array(25, JSC.integer(0, 2999))();

                    for (i = 0; i < 25; i++) {
                        value = scope.source[indices[i]];
                        if (oldDestData.indexOf(value) === -1) {
                            oldDestData.push(value);
                        }
                    }

                    control.render(oldDestData);
                    scope.$digest();

                    control.sourceFilter = "Bang";
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    scope.$digest();

                    var sourceSelectedData = [];
                    indices = JSC.array(5, JSC.integer(0, control.sourceFiltered.length - 1))();

                    for (i = 0; i < 5; i++) {
                        value = control.sourceFiltered[indices[i]];
                        if (sourceSelectedData.indexOf(value) === -1) {
                            sourceSelectedData.push(value);
                        }
                    }

                    control.sourceSelectedData = [].concat(sourceSelectedData);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(3000 - control.destinationData.length);
                    expect(control.destinationData.length).toEqual(oldDestData.length + sourceSelectedData.length);
                    expect(control.destinationData).toEqual(oldDestData.concat(sourceSelectedData));
                    expect(control.sourceSelectedData.length).toEqual(0);
                    expect(scope.setViewValue).toHaveBeenCalledWith(oldDestData.concat(sourceSelectedData));
                }));
        });

        describe('all to the right', function() {
            var filterByFilter;

            beforeEach(inject(function(_filterByFilter_) {
                btn = atrBtn;
                filterByFilter = _filterByFilter_;
            }));

            it('should move all values with empty destination',
                function() {
                    $window.confirmTrue();
                    spyOn(scope, 'setViewValue').and.callThrough();

                    control.render([]);
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    expect(control.sourceFiltered.length).toEqual(3000);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(0);
                    expect(control.destinationData.length).toEqual(scope.source.length);
                    expect(control.destinationData).toEqual(scope.source);
                    expect(scope.setViewValue).toHaveBeenCalledWith(scope.source);
                });

            it('should move all filtered items to empty destination',
                function() {
                    $window.confirmTrue();
                    spyOn(scope, 'setViewValue').and.callThrough();

                    control.render([]);
                    control.sourceFilter = 'bang';
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    var sourceFiltered = [].concat(control.sourceFiltered);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(3000 - sourceFiltered.length);
                    expect(control.sourceFiltered.length).toEqual(0);
                    expect(control.destinationData.length).toEqual(sourceFiltered.length);
                    expect(control.destinationData).toEqual(sourceFiltered);
                    expect(scope.setViewValue).toHaveBeenCalledWith(sourceFiltered);
                });

            it('should move all values with empty destination and selected items and should set selected items from the left to 0',
                function() {
                    $window.confirmTrue();
                    spyOn(scope, 'setViewValue').and.callThrough();

                    control.render([]);
                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    expect(control.sourceFiltered.length).toEqual(3000);

                    var sourceSelectedData = [];
                    var indices = JSC.array(25, JSC.integer(0, 2999))();

                    for (var i = 0; i < 25; i++) {
                        var value = scope.source[indices[i]];
                        if (sourceSelectedData.indexOf(value) === -1) {
                            sourceSelectedData.push(value);
                        }
                    }

                    control.sourceSelectedData = [].concat(sourceSelectedData);
                    expect(control.sourceSelectedData.length).toEqual(sourceSelectedData.length);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(0);
                    expect(control.sourceSelectedData.length).not.toEqual(sourceSelectedData.length);
                    expect(control.destinationData.length).toEqual(scope.source.length);
                    expect(control.destinationData).toEqual(scope.source);
                    expect(scope.setViewValue).toHaveBeenCalledWith(scope.source);
                });

            it('should move rest of values to destination',
                function() {
                    $window.confirmTrue();
                    spyOn(scope, 'setViewValue').and.callThrough();

                    var oldDestData = [];
                    var value, i;
                    var indices = JSC.array(25, JSC.integer(0, 2999))();

                    for (i = 0; i < 25; i++) {
                        value = scope.source[indices[i]];
                        if (oldDestData.indexOf(value) === -1) {
                            oldDestData.push(value);
                        }
                    }

                    control.render(oldDestData);
                    scope.$digest();

                    control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    expect(control.sourceFiltered.length).toEqual(3000 - oldDestData.length);
                    var sourceData = [].concat(control.sourceData);

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(0);
                    expect(control.destinationData.length).toEqual(scope.source.length);
                    expect(control.destinationData).toEqual(oldDestData.concat(sourceData));
                    expect(scope.setViewValue).toHaveBeenCalledWith(oldDestData.concat(sourceData));
            });

            it('should not move any values to destination',
                function () {
                $window.confirmFalse();
                spyOn(scope, 'setViewValue').and.callThrough();
                
                control.render([]);
                control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
                control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                scope.$digest();
                
                expect(control.sourceFiltered.length).toEqual(3000);
                
                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();
                
                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000);
                expect(control.destinationData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith([]);
            });

        });

        describe('set to the left', function() {
            var destinationData;

            beforeEach(function() {
                btn = stlBtn;

                var indices = JSC.array(500, JSC.integer(0, 2999))();
                destinationData = [];

                for (var i = 0; i < 500; i++) {
                    var value = scope.source[indices[i]];
                    if (destinationData.indexOf(value) === -1) {
                        destinationData.push(value);
                    }
                }

                control.render(destinationData);
                scope.$digest();
            });

            it('should move empty destination set', function() {
                spyOn(scope, 'setViewValue').and.callThrough();

                control.render([]);
                scope.$digest();

                control.destinationSelectedData = [];

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(3000);
                expect(control.destinationData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith([]);
            });

            it('should move set to source', function() {
                spyOn(scope, 'setViewValue').and.callThrough();

                var destinationSelectedData = JSC.array(5, JSC.one_of(control.destinationData))();

                destinationSelectedData = removeDups(destinationSelectedData, 'id');

                control.destinationSelectedData = [].concat(destinationSelectedData);

                var expectedDestinationData = removeSelectItems(control.destinationData, destinationSelectedData, 'id');
                var expectedSourceData = removeSelectItems(scope.source, expectedDestinationData, 'id');
                expect(control.sourceData.length).toEqual(scope.source.length - destinationData.length);

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData).toEqual(expectedSourceData);
                expect(control.sourceData.length).toEqual(expectedSourceData.length);
                expect(control.destinationData.length).toEqual(expectedDestinationData.length);
                expect(control.destinationData).toEqual(expectedDestinationData);
                expect(control.destinationSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(expectedDestinationData);
            });

            it('should move set to empty source', function() {
                spyOn(scope, 'setViewValue').and.callThrough();
                control.render(scope.source);
                scope.$digest();

                var destinationSelectedData = [];
                var indices = JSC.array(25, JSC.integer(0, control.destinationData.length - 1))();

                for (var i = 0; i < 25; i++) {
                    var value = control.destinationData[indices[i]];
                    if (destinationSelectedData.indexOf(value) === -1) {
                        destinationSelectedData.push(value);
                    }
                }

                control.destinationSelectedData = [].concat(destinationSelectedData);
                var expectedDestinationData = removeSelectItems(scope.source, destinationSelectedData, 'id');
                var expectedSourceData = removeSelectItems(scope.source, expectedDestinationData, 'id');

                control.move(btn);
                timeout.flush();
                timeout.verifyNoPendingTasks();
                scope.$digest();

                expect(scope.source.length).toEqual(3000);
                expect(control.sourceData.length).toEqual(destinationSelectedData.length);
                expect(control.destinationData.length).toEqual(3000 - destinationSelectedData.length);
                expect(control.sourceData).toEqual(expectedSourceData);
                expect(control.destinationSelectedData.length).toEqual(0);
                expect(scope.setViewValue).toHaveBeenCalledWith(expectedDestinationData);
            });

            it('should move set with empty source and destination is filtered',
                inject(function(filterByFilter) {
                    spyOn(scope, 'setViewValue').and.callThrough();

                    control.render(scope.source);
                    control.destinationFilter = "Bang";
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    var destinationSelectedData = [];
                    var indices = JSC.array(5, JSC.integer(0, control.destinationFiltered.length - 1))();

                    for (var i = 0; i < 5; i++) {
                        var value = control.destinationFiltered[indices[i]];
                        if (destinationSelectedData.indexOf(value) === -1) {
                            destinationSelectedData.push(value);
                        }
                    }

                    control.destinationSelectedData = [].concat(destinationSelectedData);
                    var expectedDestinationData = removeSelectItems(scope.source, destinationSelectedData, 'id');
                    var expectedSourceData = removeSelectItems(scope.source, expectedDestinationData, 'id');

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(expectedSourceData.length);
                    expect(control.destinationData.length).toEqual(expectedDestinationData.length);
                    expect(control.sourceData).toEqual(expectedSourceData);
                    expect(control.destinationSelectedData.length).toEqual(0);
                    expect(scope.setViewValue).toHaveBeenCalledWith(expectedDestinationData);
                }));

            it('should move set from filtered destinationData',
                inject(function(filterByFilter) {
                    spyOn(scope, 'setViewValue').and.callThrough();
                    control.destinationFilter = "Bang";
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    var destinationSelectedData = [];
                    var indices = JSC.array(5, JSC.integer(0, control.destinationFiltered.length - 1))();

                    for (var i = 0; i < 5; i++) {
                        var value = control.destinationFiltered[indices[i]];
                        if (destinationSelectedData.indexOf(value) === -1) {
                            destinationSelectedData.push(value);
                        }
                    }

                    control.destinationSelectedData = [].concat(destinationSelectedData);
                    var expectedDestinationFiltered = removeSelectItems(control.destinationFiltered, destinationSelectedData, 'id');
                    var expectedDestinationData = removeSelectItems(control.destinationData, destinationSelectedData, 'id');
                    var expectedSourceData = removeSelectItems(scope.source, expectedDestinationData, 'id');

                    control.move(btn);
                    timeout.flush();
                    timeout.verifyNoPendingTasks();
                    scope.$digest();
                    control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);
                    scope.$digest();

                    expect(scope.source.length).toEqual(3000);
                    expect(control.sourceData.length).toEqual(expectedSourceData.length);
                    expect(control.destinationData.length).toEqual(expectedDestinationData.length);
                    expect(control.sourceData).toEqual(expectedSourceData);
                    expect(control.destinationSelectedData.length).toEqual(0);
                    expect(control.destinationFiltered).toEqual(expectedDestinationFiltered);
                    expect(scope.setViewValue).toHaveBeenCalledWith(expectedDestinationData);
                }));
        });
    });
});