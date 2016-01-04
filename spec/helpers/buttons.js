var stlBtn = {
        preventDefault: jasmine.createSpy('preventDefault for stlBtn'),
        currentTarget: {
            getAttribute: function(value) {
                return 'stl';
            }
        }
    },
    strBtn = {
        preventDefault: jasmine.createSpy('preventDefault for strBtn'),
        currentTarget: {
            getAttribute: function(value) {
                return 'str';
            }
        }
    },
    atlBtn = {
        preventDefault: jasmine.createSpy('preventDefault for atlBtn'),
        currentTarget: {
            getAttribute: function(value) {
                return 'atl';
            }
        }
    },
    atrBtn = {
        preventDefault: jasmine.createSpy('preventDefault for atrBtn'),
        currentTarget: {
            getAttribute: function(value) {
                return 'atr';
            }
        }
    };
