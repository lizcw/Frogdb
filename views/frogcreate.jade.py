extend layout
block content
    h1
        | Edit frog details
    if message
        p= message
    form#frog-edit.ui-responsive(action='/frogs/update',method='POST')  
        fieldset(legend='Edit')
        div.control-group  
            label(for='frogid') Frog ID:
            div.controls
                input#frogid(type='text', name='frogid' value='#{frog.frogid}')
        div.control-group  
            label(for='tankid') Tank ID:
            div.controls
                input#tankid(type='number', pattern="[0-9]{1,2}" name='tankid' value='#{frog.tankid}')
        div.control-group 
            label(for='qen') QEN
            div.controls
                select#qen(name='qen', selected='#{frog.qen}')
                    each qen,i in qenlist
                        option(value='#{qen}') #{qen}
        div.control-group
            label(for='gender') Gender
            div.controls
              input#gender-1(type='radio', name='gender', value='female', checked=frog.gender=="female")
              label(for='gender-1') Female
              input#gender-2(type='radio', name='gender', value='male', checked=frog.gender=="male")
              label(for='gender-2') Male
        div.control-group
            label(for='species') Species
            div.controls
                input#species-1(type='radio', name='species', value='X.borealis', checked='checked')
                label(for='species-1') X.borealis
                input#species-2(type='radio', name='species', value='X.laevis')
                label(for='species-2') X.laevis
        div.control-group 
            label(for='aec') AEC
            div.controls
                input#aec(type='text',name='aec',value='#{frog.aec}')        
        div.control-group 
            label(for='location') Current Location
            div.controls
                select#location(name='location',selected='#{frog.location}')
                    option(value='Stored in AIBN Animal House') Stored in AIBN Animal House
                    option(value='Disposed of at AIBN Animal House') Disposed of at AIBN Animal House
                    option(value='Disposed of at Otto Hirschfeld Animal House') Disposed of at Otto Hirschfeld Animal House
                    option(value='Other') Other
        div.control-group 
            label(for='condition') Oocytes Condition
            div.controls
                input#condition(type='text', name='condition', data-clear-btn='true', value='#{frog.condition}')
        div.control-group 
            label(for='comments') General Remarks
            div.controls
                textarea#comments(cols='40', rows='3',name='comments').
                    #{frog.comments}
        
        input#id(type='hidden', value='#{frog._id}', name='id')
        input(type='submit', value='Save', class='btn btn-success')
    
    