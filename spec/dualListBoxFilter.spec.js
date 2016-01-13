describe('Filter: filterBy', function(){
    var filterByFilter;
    var list;

    beforeEach(module('killyosaur.dualListBox'));

    beforeEach(inject(function(_filterByFilter_){
        filterByFilter = _filterByFilter_;
        list = [
            {
                id: 1,
                name: 'A Name for an Item',
                type: 'A type 1',
                value: 'test value'
            },
            {
                id: 2,
                name: 'A Name for an Item test',
                type: 'A type 2',
                value: 'Value for this item'
            },
            {
                id: 3,
                name: 'Another Name for an Item',
                type: 'A type 1',
                value: 'a test value'
            },
            {
                id: 4,
                name: 'A Name',
                type: 'A type 1',
                value: 'some value to use for the units'
            },
            {
                id: 5,
                name: 'A valid name',
                type: 'A type 2',
                value: 'some value for unit testing'
            },
        ]
    }));

    it('should be able to search a value', function(){
        var result = filterByFilter(list, 'test');
        expect(result.length).toEqual(4);
    });
   
    it('should be able to search a value by a property', function(){
        var result = filterByFilter(list, 'test', 'name');
        expect(result.length).toEqual(1); 
    });
   
    it('should error if not an array', function() {
        var result = filterByFilter('test');
        expect(result).toBe('test');
    });
      
    it('should error if no value is provided', function() {
        var result = filterByFilter(list);
        expect(result.length).toEqual(5);
    });
});