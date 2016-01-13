describe('Controller: dualListBoxController', function(){
    var scope, control, dualListBoxConfig, injected = null;

    function fakeController($scope, $attrs, $element){
        injected = {};
        injected.$scope = $scope;
        injected.$attrs = $attrs;
        injected.$element = $element;
    }

    beforeEach(module('killyosaur.dualListBox'));
    
    beforeEach(inject(function($rootScope, $compile, $controller) {
        scope = $rootScope.$new();
        scope.fakeController = fakeController;
        scope.source = [{name: 'text', id: 1}, {name: 'text 2', id: 2}];

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
            dualListBoxConfig: dualListBoxConfig
        });

        scope.$digest();
    }));
    
    it('should set the base options, default all filters, and set source data', function(){
        expect(control.sourceFilter).toBe("");
        expect(control.destinationFilter).toBe("");
        expect(control.destinationFilter).toBe("");
        expect(control.options).toEqual(dualListBoxConfig);
        expect(control.sourceData).toEqual(scope.source);
    });
    
    describe('- no source error:', function(){
        beforeEach(function() {
            delete scope.source;
        });
        
        it('should throw an error as no source is available', inject(function($controller) {
            expect(function() {
                control = $controller('dualListBoxController', { 
                    $scope: scope,
                    $attrs: injected.$attrs,
                    dualListBoxConfig: dualListBoxConfig
                });

                scope.$digest();
            }).toThrow('No valid data source available!');
        }));
    });
    
    describe('- attributes:', function() {
        beforeEach(inject(function($compile, $controller){
            $compile('<span ng-controller="fakeController" data-source-title="a new title" data-text-length="53"></span>')(scope);

            control = $controller('dualListBoxController', { 
                $scope: scope,
                $attrs: injected.$attrs,
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
    
    describe('- render:', function(){
        it('should set destinationData based on the passed in value', function(){
            control.render([{name: 'text', id: 1}]);
            expect(control.destinationData).toEqual([{name: 'text', id: 1}]);
        });

        it('should update sourceData to remove data based on what is in destinationData', function(){
            control.render([{name: 'text', id: 1}]);
            expect(control.destinationData).toEqual([{name: 'text', id: 1}]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(1);
        });

        it('should not update sourceData when destination data is not valid', function(){
            control.render([{}]);
            expect(control.destinationData).toEqual([{}]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(2);
        });

        it('should not update sourceData when destination data is empty', function(){
            control.render([]);
            expect(control.destinationData).toEqual([]);
            scope.$digest();
            expect(control.sourceData.length).toEqual(2);
        });
    });

    describe('- move:', function () {
        var timeout;
        beforeEach(inject(function ($rootScope, $compile, $controller, $timeout) {
            timeout = $timeout;
            scope.source = JSC.array(3000, JSC.object({
                name: JSC.one_of(pickOne())
            }))();
            
            for(var i = 0; i < scope.source.length; i++) {
                scope.source[i].id = i + 1;
            }

            control = $controller('dualListBoxController', { 
                $scope: scope,
                $attrs: injected.$attrs,
                dualListBoxConfig: dualListBoxConfig
            });

            scope.$digest();
        }));

        it('move a set of items to the right with no default set for destination', function() {
            spyOn(scope, 'setViewValue').and.callThrough();
            
            var sourceSelectedData = [];
            var indices = JSC.array(25, JSC.integer(0, 2999))();

            for(var i = 0; i < 25; i++) {
                var value = scope.source[indices[i]];
                if (sourceSelectedData.indexOf(value) === -1) {
                    sourceSelectedData.push(value);
                }
            }

            control.sourceSelectedData = [].concat(sourceSelectedData);

            control.move(strBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
            expect(control.destinationData.length).toEqual(sourceSelectedData.length);
            expect(control.destinationData).toEqual(sourceSelectedData);
            expect(control.sourceSelectedData.length).toEqual(0);
            expect(scope.setViewValue).toHaveBeenCalled();
        });

        it('move a set of items to the right with default set for destination', function() {
            spyOn(scope, 'setViewValue').and.callThrough();
            
            control.render([]);
            scope.$digest();
            
            var sourceSelectedData = [];
            var indices = JSC.array(25, JSC.integer(0, 2999))();

            for(var i = 0; i < 25; i++) {
                var value = scope.source[indices[i]];
                if (sourceSelectedData.indexOf(value) === -1) {
                    sourceSelectedData.push(value);
                }
            }

            control.sourceSelectedData = [].concat(sourceSelectedData);

            control.move(strBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
            expect(control.destinationData.length).toEqual(sourceSelectedData.length);
            expect(control.destinationData).toEqual(sourceSelectedData);
            expect(control.sourceSelectedData.length).toEqual(0);
            expect(scope.setViewValue).toHaveBeenCalled();
        });

        it('move a set of items to the right with destination set to a set of items', function() {
            spyOn(scope, 'setViewValue').and.callThrough();
            var oldDestData = [];
            var value, i;
            var indices = JSC.array(25, JSC.integer(0, 2999))();

            for(i = 0; i < 25; i++) {
                value = scope.source[indices[i]];
                if (oldDestData.indexOf(value) === -1) {
                    oldDestData.push(value);
                }
            }
            
            control.render(oldDestData);
            scope.$digest();
            
            var sourceSelectedData = [];
            indices = JSC.array(15, JSC.integer(0, control.sourceData.length - 1))();

            for(i = 0; i < 15; i++) {
                value = control.sourceData[indices[i]];
                if (sourceSelectedData.indexOf(value) === -1) {
                    sourceSelectedData.push(value);
                }
            }

            control.sourceSelectedData = [].concat(sourceSelectedData);

            control.move(strBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(3000 - control.destinationData.length);
            expect(control.destinationData.length).toEqual(oldDestData.length + sourceSelectedData.length);
            expect(control.destinationData).toEqual(oldDestData.concat(sourceSelectedData));
            expect(control.sourceSelectedData.length).toEqual(0);
            expect(scope.setViewValue).toHaveBeenCalled();
        });

        it('move a set of items to the right with default set for destination and filtered source', inject(function(filterByFilter) {
            spyOn(scope, 'setViewValue').and.callThrough();

            control.render([]);
            control.sourceFilter = "Bang";
            control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
            scope.$digest();
            
            var sourceSelectedData = [];
            var indices = JSC.array(5, JSC.integer(0, control.sourceFiltered.length - 1))();

            for(var i = 0; i < 5; i++) {
                var value = control.sourceFiltered[indices[i]];
                if (sourceSelectedData.indexOf(value) === -1) {
                    sourceSelectedData.push(value);
                }
            }

            control.sourceSelectedData = [].concat(sourceSelectedData);

            control.move(strBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(3000 - sourceSelectedData.length);
            expect(control.destinationData.length).toEqual(sourceSelectedData.length);
            expect(control.destinationData).toEqual(sourceSelectedData);
            expect(control.sourceSelectedData.length).toEqual(0);
            expect(scope.setViewValue).toHaveBeenCalled();
        }));

        it('move a set of items to the right with destination set to a set of items and filtered source', inject(function(filterByFilter) {
            spyOn(scope, 'setViewValue').and.callThrough();
            var value, i;
            var oldDestData = [];
            var indices = JSC.array(25, JSC.integer(0, 2999))();

            for(i = 0; i < 25; i++) {
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

            for(i = 0; i < 5; i++) {
                value = control.sourceFiltered[indices[i]];
                if (sourceSelectedData.indexOf(value) === -1) {
                    sourceSelectedData.push(value);
                }
            }

            control.sourceSelectedData = [].concat(sourceSelectedData);

            control.move(strBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(3000 - control.destinationData.length);
            expect(control.destinationData.length).toEqual(oldDestData.length + sourceSelectedData.length);
            expect(control.destinationData).toEqual(oldDestData.concat(sourceSelectedData));
            expect(control.sourceSelectedData.length).toEqual(0);
            expect(scope.setViewValue).toHaveBeenCalled();
        }));

        it('move all items to the right with default set for destination', inject(function (filterByFilter) {
            spyOn(scope, 'setViewValue').and.callThrough();

            control.render([]);
            control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
            control.destinationFiltered = filterByFilter(control.destinationData, control.destinationFilter, control.options.text);            scope.$digest();
            scope.$digest();

            expect(control.sourceFiltered.length).toEqual(3000);

            control.move(atrBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(0);
            expect(control.destinationData.length).toEqual(3000);
            expect(control.destinationData).toEqual(scope.source);
            expect(scope.setViewValue).toHaveBeenCalled();
        }));

        xit('move all filtered items to the right with default set for destination', inject(function (filterByFilter) {
            spyOn(scope, 'setViewValue').and.callThrough();

            control.render([]);
            control.sourceFiltered = filterByFilter(control.sourceData, control.sourceFilter, control.options.text);
            scope.$digest();
            
            control.move(atrBtn);
            timeout.flush();
            timeout.verifyNoPendingTasks();
            scope.$digest();

            expect(scope.source.length).toEqual(3000);
            expect(control.sourceData.length).toEqual(0);
            expect(control.destinationData.length).toEqual(3000);
            expect(control.destinationData).toEqual(scope.source);
            expect(scope.setViewValue).toHaveBeenCalled();
        }));
    });
});