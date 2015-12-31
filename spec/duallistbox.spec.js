describe('Directive: dualListBox', function() {
    var element, scope, compile;
   
    beforeEach(module('killyosaur.dualListBox'));
   
    beforeEach(inject(function($rootScope, $compile){
        scope = $rootScope.$new();
        
        compile = $compile;
        
        setElement([], [], '<dual-list-box ng-model="testModel" source="testSource"></dual-list-box>');
    }));

    function setElement(model, source, ele) {
        scope.testModel = model;
        scope.testSource = source;
        
        element = compile(ele)(scope);
        scope.$digest();
    }
    describe('with the bare minimum of settings as an element', function(){
        it('should generate a valid dual list box', function(){
           var isolated = element.isolateScope();
           
           expect(isolated.source).toEqual([]);
           expect(isolated.selectionBoxStyle.width).toBe('100%');
           expect(isolated.selectionBoxStyle.height).toBe('200px');
           expect(isolated.controlDisabled).toBeDefined(); 
        });
    });
    
    describe('with a height element added', function(){
        beforeEach(function(){
        setElement([], [], '<dual-list-box ng-model="testModel" source="testSource" height="300px"></dual-list-box>');
        });
        
        it('should generate a valid dual list box', function(){
           var isolated = element.isolateScope();
           
           expect(isolated.source).toEqual([]);
           expect(isolated.selectionBoxStyle.width).toBe('100%');
           expect(isolated.selectionBoxStyle.height).toBe('300px');
           expect(isolated.controlDisabled).toBeDefined(); 
        });
    })
});