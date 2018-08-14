/**
 * ExtJS Inheritance - constructor or initComponent
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * The ability to override via constructor was added in a later version of Ext than initComponent, 
 * so all code of a certain age would have to use initComponent. 
 * These days (ExtJS 3.2), you would still override initComponent if you want to do anything AFTER! the base 
 * class initComponent is called (constructor would be too early for this), but before the component is rendered.
 * Otherwise - use the constructor. 
 * 
 * Event Handling
 * ~~~~~~~~~~~~~~
 * The preferred way to handle events (listeners) is to add them after the 
 * call to the superclass in the constructor or initComponent.
 */


// ~~~ @@ PANELS & CONTAINERS

/*
 * Panel
 */
CP.WebUI.Panel = Ext.extend( Ext.Panel,{
    constructor: function( config ){
        config = Ext.apply({
            border: false
        }, config);
        CP.WebUI.Panel.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_panel', CP.WebUI.Panel );


/*
 * Tab Panel
 */
CP.WebUI.TabPanel = Ext.extend( Ext.TabPanel,{
    constructor: function( config ){
        config = Ext.apply({
        }, config);
        CP.WebUI.TabPanel.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_tabpanel', CP.WebUI.TabPanel );


/*
 * Tree Panel
 */
CP.WebUI.TreePanel = Ext.extend( Ext.tree.TreePanel,{
    constructor: function( config ){
        config = Ext.apply({
        }, config);
        CP.WebUI.TreePanel.superclass.constructor.call(this, config);
    }
});
Ext.reg('cp_treepanel', CP.WebUI.TreePanel);


/*
 * Simple box component rendered into a single div
 */
CP.WebUI.BoxComponent = Ext.extend(Ext.BoxComponent, {
    initComponent: function() {
        Ext.apply(this, {
        });
        CP.WebUI.BoxComponent.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_box', CP.WebUI.BoxComponent);


//~~~ @@ FORM

/*
 * Form Panel
 */
CP.WebUI.FormPanel = Ext.extend( Ext.form.FormPanel,{
    constructor: function( config ){
        config = Ext.apply({
        }, config);
        CP.WebUI.FormPanel.superclass.constructor.call( this, config );
    }
});
Ext.reg('cp_formpanel', CP.WebUI.FormPanel);


/*
 * Checkbox
 */
CP.WebUI.Checkbox = Ext.extend( Ext.form.Checkbox,{
    constructor: function( config ){
        config = Ext.apply({
        }, config );
        CP.WebUI.Checkbox.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_checkbox', CP.WebUI.Checkbox );


/*
 * Checkbox Group
 */
CP.WebUI.CheckboxGroup = Ext.extend(Ext.form.CheckboxGroup, {
    initComponent: function() {
        Ext.apply(this, {
        });
        CP.WebUI.CheckboxGroup.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_checkboxgroup', CP.WebUI.CheckboxGroup);


/*
 * Radio
 */
CP.WebUI.Radio = Ext.extend(Ext.form.Radio, {
    initComponent: function() {
        Ext.apply(this, {
        });
        CP.WebUI.Radio.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_radio', CP.WebUI.Radio);


/*
 * Radio Group
 */
CP.WebUI.RadioGroup = Ext.extend( Ext.form.RadioGroup,{
    constructor: function( config ){
        config = Ext.apply({
            //bacause of a bug in ext3, RadioGroup is allways dirty.
            //to solve this override the behaviour to check sub items.
            isDirty: function(){
                if (this.disabled || !this.rendered) {
                    return false;
                }
                var dirty = false;
                if (this.getValue().getRawValue() != this.originalValue.getRawValue()) {
                    dirty = true;
                }
                return dirty;
            }
        }, config );
        CP.WebUI.RadioGroup.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_radiogroup', CP.WebUI.RadioGroup );


/*
 * ComboBox
 */
CP.WebUI.ComboBox = Ext.extend(Ext.form.ComboBox, {
    constructor: function( config ){
        config = Ext.apply({
            msgTarget: 'side',
            invalidClass: 'webui-invalid'
        }, config );
        CP.WebUI.ComboBox.superclass.constructor.call( this, config );
    }
});
Ext.reg('cp_combobox', CP.WebUI.ComboBox);


/*
 * Date Field
 */
CP.WebUI.DateField = Ext.extend(Ext.form.DateField, {
    initComponent: function() {
        Ext.apply(this, {
            
        });
        CP.WebUI.DateField.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_datefield', CP.WebUI.DateField);


/*
 * Display Field
 */
CP.WebUI.DisplayField = Ext.extend(Ext.form.DisplayField, {
    initComponent: function() {
        Ext.apply(this, {
        });
        CP.WebUI.DisplayField.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_displayfield', CP.WebUI.DisplayField);


/*
 * Fieldset
 */
CP.WebUI.FieldSet = Ext.extend( Ext.form.FieldSet,{
    initComponent: function() {
        Ext.apply( this, {
            cls: 'webui-fieldset',
            border: false
        });
        CP.WebUI.FieldSet.superclass.initComponent.call( this );
    }
});
Ext.reg( 'cp_fieldset', CP.WebUI.FieldSet );


/*
 * Label
 */
CP.WebUI.Label = Ext.extend(Ext.form.Label, {
    initComponent: function() {
        Ext.apply(this, {
        });
        CP.WebUI.Label.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_label', CP.WebUI.Label);


/*
 * Text-Area
 */
CP.WebUI.TextArea = Ext.extend(Ext.form.TextArea, {
    constructor: function( config ){
        config = Ext.apply({
            msgTarget: 'side',
            invalidClass: 'webui-invalid'
        }, config );
        CP.WebUI.TextArea.superclass.constructor.call( this, config );
    }
});
Ext.reg('cp_textarea', CP.WebUI.TextArea);


/*
 * Text Field
 */
CP.WebUI.TextField = Ext.extend( Ext.form.TextField,{
    constructor: function( config ){
        config = Ext.apply({
            msgTarget: 'side',
            invalidClass: 'webui-invalid'
        }, config );
        CP.WebUI.TextField.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_textfield', CP.WebUI.TextField );

/*
 * Password Field
 */
CP.WebUI.Password = Ext.extend( CP.WebUI.TextField,{
    constructor: function( config ){
        config = Ext.apply({
            inputType: 'password'/*,
            vtype: 'password'*/
        }, config );
        CP.WebUI.Password.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_password' , CP.WebUI.Password );


/*
 * Hidden Field
 */
CP.WebUI.HiddenField = Ext.extend( Ext.form.Hidden,{
    initComponent: function(){
        Ext.apply( this,{
        });
        CP.WebUI.HiddenField.superclass.initComponent.call( this );
    }
});
Ext.reg( 'cp_hiddenfield', CP.WebUI.HiddenField );


/*
 * Composite Field
 * Use the composite field to wrap the other fields and to display invalid message to user
 */
CP.WebUI.CompositeField = Ext.extend( Ext.form.CompositeField,{
    constructor: function( config ){
        config = Ext.apply({
            msgTarget: 'side',
            invalidClass: 'webui-invalid',
            //bacause of a bug in ext3, CompositeField is allways dirty.
            //to solve this override the behaviour to check sub items.
            isDirty: function(){
                if (this.disabled || !this.rendered) {
                    return false;
                }
                var dirty = false;
                if (this.getValue() != this.originalValue) {
                    dirty = true;
                }
                return dirty;
            }
        }, config );
        CP.WebUI.CompositeField.superclass.constructor.call( this, config );
        
        //add events for disable/enable look
        this.on({
            disable:{ scope:this, fn:CP.util.grayedOut },
            enable: { scope:this, fn:CP.util.unGrayed },
            render:{ scope:this, fn: function( compositeField ){
                if( compositeField.disabled == true ){
                    CP.util.grayedOut( compositeField );
                }
                else{
                    CP.util.unGrayed( compositeField );
                }
            }}
        });
    }
});
Ext.reg( 'cp_compositefield', CP.WebUI.CompositeField );


/*
 * Number Field
 */
CP.WebUI.NumberField = Ext.extend( Ext.form.NumberField,{
    constructor: function( config ){
        config = Ext.apply({
            msgTarget: 'side',
            invalidClass: 'webui-invalid'
        }, config);
        CP.WebUI.NumberField.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_numberfield', CP.WebUI.NumberField );


/*
 * Positive Integer Field
 * User can enter any whole number grater than 0
 */
CP.WebUI.PositiveIntField = Ext.extend( CP.WebUI.NumberField,{
    constructor: function( config ){
        config = Ext.apply({
            vtype: 'posint',
            allowDecimals: false,
            allowNegative: false
        }, config );
        CP.WebUI.PositiveIntField.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_positiveint', CP.WebUI.PositiveIntField );


/*
 * Mask Length Field
 * Any integer between 1 and 32
 */
CP.WebUI.MaskLengthField = Ext.extend( CP.WebUI.PositiveIntField,{
    constructor: function( config ){
        config = Ext.apply({
            minValue: 1,
            maxValue: 32,
            width: 25,
            maxLength: 2,
            autoCreate: { tag: 'input', type: 'text', size: '25', autocomplete: 'off', maxlength: '2' }
        }, config );
        CP.WebUI.MaskLengthField.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_masklength', CP.WebUI.MaskLengthField );


/*
 * IPv6 Mask Length Field
 * Any integer between 1 and 128
 */
CP.WebUI.V6MaskLengthField = Ext.extend( CP.WebUI.PositiveIntField,{
    constructor: function( config ){
        config = Ext.apply({
            minValue: 1,
            maxValue: 128,
            width: 25,
            maxLength: 3,
            autoCreate: { tag: 'input', type: 'text', size: '25', autocomplete: 'off', maxlength: '3' }
        }, config );
        CP.WebUI.V6MaskLengthField.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_v6masklength', CP.WebUI.V6MaskLengthField );


/*
 * Time control ---
 * has 1 textfield for the hours and 1 textfield for minutes - for manual input
 * and AM:PM selection.
 */
CP.WebUI.TimeBox = Ext.extend( CP.WebUI.CompositeField,{
    constructor: function( config ){
        //set properties by user definintions or, if none, apply defaults
        var defaultId = Ext.id();
        var boxId = 'webui_timebox_'+ defaultId;
        var boxLabel = 'Time'; //generate label
        if( config ){
            boxId = config.boxId || boxId;
            boxLabel = config.boxLabel || boxLabel;
        }
        
        //set component displat according to the selected format:
        var hoursVType = 'hours24';
        var compositeFieldWidth = 68;
        var ampmBoxIsHidden = true;
        if( CP.global.formatTime == '12-hour' ){
            hoursVType = 'hours12';
            compositeFieldWidth = 123;
            ampmBoxIsHidden = false;
        }
        
        //define fields:
        this.hours = new CP.WebUI.TextField({
            xtype: 'cp_textfield'
            , vtype: hoursVType
            , invalidClass: ''
            , value: 10
            , maxLength: 2
            , width: 24
            , hideLabel: true
            , autoCreate: {tag: 'input', type: 'text', size: '24', autocomplete: 'off', maxlength: '2'}
        });
        
        this.minutes = new CP.WebUI.TextField({
            xtype: 'cp_textfield'
            , vtype: 'minutes'
            , invalidClass: ''
            , value: 30
            , maxLength: 2
            , width: 24
            , flex: 1
            , hideLabel: true
            , autoCreate: {tag: 'input', type: 'text', size: '24', autocomplete: 'off', maxlength: '2'}
        });
        
        this.ampm = new CP.WebUI.ComboBox({
            xtype: 'cp_combobox'
            , hideLabel: true
            , mode: 'local'
            , width: 50
            , listWidth: 50
            , flex: 1
            , store: [["AM","AM"],["PM","PM"]]
            , value: 'AM'
            , forceSelection: true
            , triggerAction: 'all'
            , editable: false
            , hidden: ampmBoxIsHidden
        });
        
        //main panel
        config = Ext.apply({
            id: boxId
            , cls: 'webui-time-box field-body'
            , fieldLabel: boxLabel
            , width: compositeFieldWidth
            , height: 22
            , xtype: 'cp_compositefield'
            , items: [ this.hours,
            { 
                //seperator :
                xtype: 'cp_panel'
                , width: 10
                , height: 20
                , flex: 1
                , html: ':' 
                , style: 'padding: 3px 2px 0 2px;'
                , border: false
            }, 
            this.minutes,
            this.ampm ]
        }, config);
        CP.WebUI.TimeBox.superclass.constructor.call( this, config );
    },
    
    // ~~~ Getters ~~~
    getHoursField: function(){
        return this.hours;
    },
    
    getMinutesField: function(){
        return this.minutes;
    },
    
    getAmPmField: function(){
        return this.ampm;
    },
    
    //CompositeField has no own getValue() method, it's just a layout and error handling helper.
    //Create custom getValue method
    getValue: function(){
        var value = this.hours.getValue() +':'+ 
                    this.minutes.getValue();
        
        if( this.ampm.isVisible() == true ){
            value += ' '+ this.ampm.getValue();
        }
        return value;
    },
    
    // ~~~ Setters ~~~
    setHours: function( value ){
        return this.getHoursField().setValue( value );
    },
    
    setMinutes: function( value ){
        return this.getMinutesField().setValue( value );
    },
    
    setAmPm: function( value ){
        return this.getAmPmField().setValue( value );
    },
    
    //Create custom setValue method
    setValue: function( hours, minutes, ampm ){
        this.setHours( hours );
        this.setMinutes( minutes );
        this.setAmPm( ampm );
    }
});
Ext.reg( 'cp_timebox', CP.WebUI.TimeBox );


//~~~ @@ GRID

/*
 * Grid Panel
 */
CP.WebUI.GridPanel = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        Ext.apply(this, {
            
        });
        CP.WebUI.GridPanel.superclass.initComponent.call(this);
    }
});
Ext.reg('cp_grid', CP.WebUI.GridPanel);


/*
 * Editor Grid Panel
 */
CP.WebUI.EditorGridPanel = Ext.extend( Ext.grid.EditorGridPanel,{
    constructor: function( config ){
        config = Ext.apply({
            cls: 'webui-grid',
            stripeRows: true,
            autoScroll: true,
            loadMask: true,
            border: false,
            header: false,
            viewConfig: { forceFit:true, scrollOffset:0 } //forceFit=column widths re-proportioned at all times. scrollOffset=don't save space for scroll
        }, config);
        CP.WebUI.EditorGridPanel.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_editorgrid', CP.WebUI.EditorGridPanel );


/*
 * List View
 */
CP.WebUI.ListView = Ext.extend( Ext.list.ListView,{
    constructor: function( config ){
        config = Ext.apply({
            cls: 'webui-listview',
            emptyText: 'No items to display',
            multiSelect: true
//            autoHeight : true
        }, config );
        CP.WebUI.ListView.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_listview', CP.WebUI.ListView );


/*
 * Dual List - for future plan
 * Generate double list control with mover buttons from left list to right list and vise versa
 * Example: 
 * {
       xtype: 'cp_duallist',
       mainPanelId: 'webui_duallist11',
       width: 300,
       height: 200,
       //left
       leftListStore: new Ext.data.SimpleStore({
           fields: ["key", "value"],
           data: [['user1', 'User 1'], 
              ['user2', 'User 2']]
       }),
       leftListCOL: [{
           header: 'Selected Users',
           dataIndex: 'key'
       }],
       //right
       rightListStore: new Ext.data.SimpleStore({
           fields: ["key", "value"],
           data: [['user3', 'User 3'], 
                ['user4', 'User 4']]
       }),
       rightListCOL: [{
           header: 'Excluded Users',
           dataIndex: 'key'
       }]
    }
 */
CP.WebUI.DualList = Ext.extend( CP.WebUI.Panel,{   
    constructor: function( config ){
        this.initProperties( config );
     
        config = Ext.apply({ 
            id: this.mainPanelId,
            width: this.cmpWidth,
            height: this.cmpHeight,
            border: true,
            layout: 'hBox',
            layoutConfig: {
                type: 'hbox',
                align: 'stretch',
                pack: 'start'
            },
            defaults :{
                frame: true,
                flex: 1,
                border: true
            },
            items: [ 
            this.leftList,
            { 
                //Middle column - buttons
                xtype: 'cp_panel',
                border: false,
                width: 90,
                defaults :{
                    xtype: 'cp_button',
                    minWidth: 72
                },
                items: [{
                    text: 'Add >',
                    style: 'margin-bottom:15px;margin-top:30px;',
                    listeners: {
                        click: {                                                              
                            scope: Ext.getCmp( this.mainPanelId ),
                            fn: this.AddOrRemoveRowsByButtonClick.createDelegate( this, [true] )
                        }
                    }
                },{
                    text: '< Remove',
                    listeners: {
                        click: {                                                              
                            scope: Ext.getCmp( this.mainPanelId ),
                            fn: this.AddOrRemoveRowsByButtonClick.createDelegate( this, [false] )
                        }
                    }
                }]
            },
            this.rightList ]
        }, config );                                 
        CP.WebUI.DualList.superclass.constructor.call( this, config ); 
    }, //Eof constructor 
 

    //set properties by user definintions (passed using config) or, if none, apply defaults
    initProperties:function( config ){
        //ID's:
        this.mainPanelId = 'webui_duallist_' + Ext.id();
        //left list:
        this.leftListStore = null;
        this.leftListCOL = null;
        //right list:
        this.rightListStore = null;
        this.rightListCOL = null;
        //size:
        this.cmpWidth = 500;
        this.cmpHeight = 350;
        
        if( config ){
            this.mainPanelId = config.mainPanelId || this.mainPanelId;
            this.leftListStore = config.leftListStore || this.leftListStore;
            this.leftListCOL = config.leftListCOL || this.leftListCOL;
            this.rightListStore = config.rightListStore || this.rightListStore;
            this.rightListCOL = config.rightListCOL || this.rightListCOL;
            this.cmpWidth = config.width || this.cmpWidth;
            this.cmpHeight = config.height || this.cmpHeight;
        }
        
        this.leftList = new CP.WebUI.ListView({
            store: this.leftListStore,
            columns: this.leftListCOL,
            simpleSelect: true,
            listeners: {
                dblclick: {                                                              
                    scope: this,                                                  
                    fn: function( leftList, index, node, e ){
                        var rightList = this.rightList;                                                         
                        rightList.getStore().add( leftList.getRecord( node ));                                                        
                        leftList.getStore().remove( leftList.getRecord( node ));
                    }
                }
            }
        });
        
        this.rightList = new CP.WebUI.ListView({
            store: this.rightListStore,
            columns: this.rightListCOL,
            simpleSelect: true,
            listeners: {
                dblclick: {                                                              
                    scope: this,                                                  
                    fn: function( rightList, index, node, e ){
                        var leftList = this.leftList;
                        leftList.getStore().add( rightList.getRecord( node ));                                                        
                        rightList.getStore().remove( rightList.getRecord( node ));
                    }
                }
            }
        });
    },
    
    //move items from left list to right list and vise versa
    AddOrRemoveRowsByButtonClick: function( addRows ){  
         var leftList = this.leftList;
         var leftListStore = leftList.getStore();
         var rightList = this.rightList;
         var rightListStore = rightList.getStore();   
         if( addRows ){
             if( leftList.getSelectionCount() > 0 ){      
                 var selectedRecords = leftList.getSelectedRecords();
                 rightListStore.add( selectedRecords );
                 leftListStore.remove( selectedRecords );
             }
         }
         else if( rightList.getSelectionCount() > 0 ){  
             var selectedRecords = rightList.getSelectedRecords();
             leftListStore.add( selectedRecords );
             rightListStore.remove( selectedRecords );
         }
    },
    
    /* This function is used in order to get the stores from outside the object. 
     * @Paramter column: The column of the desired store (right/left) */
    getStore: function (column) {
    	if (column == 'left')
    		return this.leftList.getStore();
    	if (column == 'right')
    		return this.rightList.getStore();
    	
    	return null;
    }
});
Ext.reg( 'cp_duallist', CP.WebUI.DualList );



//~~~ @@ BUTTONS
    
/*
 * Simple button
 */
CP.WebUI.Button = Ext.extend( Ext.Button,{
    constructor: function( config ){
        config = Ext.apply({
            cls: 'webui-button',
            disabledClass: 'webui-button-disabled'
//            minWidth: 75
        }, config);
        CP.WebUI.Button.superclass.constructor.call( this, config );
    }
});
Ext.reg('cp_button', CP.WebUI.Button);


/*
 * buttons bar
 */
CP.WebUI.BtnsBar = Ext.extend( Ext.Panel,{
    constructor: function( config ){
        config = Ext.apply({
            cls: 'webui-bbar',
            layout: 'column',
            border: false,
            width: 300,
            defaults:{ 
                xtype: 'cp_button',
                style: 'margin-right:15px;',
                columnWidth: 0.1
            }
        }, config);
        CP.WebUI.BtnsBar.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_btnsbar', CP.WebUI.BtnsBar );


//~~~ @@ PORTAL

/*
 * Portal
 */
CP.WebUI.Portal = Ext.extend(Ext.Panel, {
    layout : 'column',
    autoScroll : true,
    cls : 'x-portal',
    defaultType : 'cp_portalcolumn',
    
    initComponent : function(){
        CP.WebUI.Portal.superclass.initComponent.call(this);
        this.addEvents({
            validatedrop:true,
            beforedragover:true,
            dragover:true,
            beforedrop:true,
            drop:true
        });
    },

    initEvents : function(){
        CP.WebUI.Portal.superclass.initEvents.call(this);
        this.dd = new CP.WebUI.Portal.DropZone(this, this.dropConfig);
    },
    
    beforeDestroy : function() {
        if(this.dd){
            this.dd.unreg();
        }
        CP.WebUI.Portal.superclass.beforeDestroy.call(this);
    }
});
Ext.reg('cp_portal', CP.WebUI.Portal);


/*
 * Portal Drop Zone
 */
CP.WebUI.Portal.DropZone = Ext.extend(Ext.dd.DropTarget, {
    constructor : function(portal, cfg){
        this.portal = portal;
        Ext.dd.ScrollManager.register(portal.body);
        CP.WebUI.Portal.DropZone.superclass.constructor.call(this, portal.bwrap.dom, cfg);
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },
    
    ddScrollConfig : {
        vthresh: 50,
        hthresh: -1,
        animate: true,
        increment: 200
    },

    createEvent : function(dd, e, data, col, c, pos){
        return {
            portal: this.portal,
            panel: data.panel,
            columnIndex: col,
            column: c,
            position: pos,
            data: data,
            source: dd,
            rawEvent: e,
            status: this.dropAllowed
        };
    },

    notifyOver : function(dd, e, data){
        var xy = e.getXY(), portal = this.portal, px = dd.proxy;

        // case column widths
        if(!this.grid){
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = portal.body.dom.clientWidth;
        if(!this.lastCW){
            this.lastCW = cw;
        }else if(this.lastCW != cw){
            this.lastCW = cw;
            portal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var col = 0, xs = this.grid.columnX, cmatch = false;
        for(var len = xs.length; col < len; col++){
            if(xy[0] < (xs[col].x + xs[col].w)){
                cmatch = true;
                break;
            }
        }
        // no match, fix last index
        if(!cmatch){
            col--;
        }

        // find insert position
        var p, match = false, pos = 0,
            c = portal.items.itemAt(col),
            items = c.items.items, overSelf = false;

        for(var len = items.length; pos < len; pos++){
            p = items[pos];
            var h = p.el.getHeight();
            if(h === 0){
                overSelf = true;
            }
            else if((p.el.getY()+(h/2)) > xy[1]){
                match = true;
                break;
            }
        }

        pos = (match && p ? pos : c.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, col, c, pos);

        if(portal.fireEvent('validatedrop', overEvent) !== false &&
           portal.fireEvent('beforedragover', overEvent) !== false){

            // make sure proxy width is fluid
            px.getProxy().setWidth('auto');

            if(p){
                px.moveProxy(p.el.dom.parentNode, match ? p.el.dom : null);
            }else{
                px.moveProxy(c.el.dom, null);
            }

            this.lastPos = {c: c, col: col, p: overSelf || (match && p) ? pos : false};
            this.scrollPos = portal.body.getScroll();

            portal.fireEvent('dragover', overEvent);

            return overEvent.status;
        }else{
            return overEvent.status;
        }

    },

    notifyOut : function(){
        delete this.grid;
    },

    notifyDrop : function(dd, e, data){
        delete this.grid;
        if(!this.lastPos){
            return;
        }
        var c = this.lastPos.c, 
            col = this.lastPos.col, 
            pos = this.lastPos.p,
            panel = dd.panel,
            dropEvent = this.createEvent(dd, e, data, col, c,
                pos !== false ? pos : c.items.getCount());

        if(this.portal.fireEvent('validatedrop', dropEvent) !== false &&
           this.portal.fireEvent('beforedrop', dropEvent) !== false){

            dd.proxy.getProxy().remove();
            panel.el.dom.parentNode.removeChild(dd.panel.el.dom);
            
            if(pos !== false){
                c.insert(pos, panel);
            }else{
                c.add(panel);
            }
            
            c.doLayout();

            this.portal.fireEvent('drop', dropEvent);

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;
            if(st){
                var d = this.portal.body.dom;
                setTimeout(function(){
                    d.scrollTop = st;
                }, 10);
            }

        }
        delete this.lastPos;
    },

    // internal cache of body and column coords
    getGrid : function(){
        var box = this.portal.bwrap.getBox();
        box.columnX = [];
        this.portal.items.each(function(c){
             box.columnX.push({x: c.el.getX(), w: c.el.getWidth()});
        });
        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg: function() {
        Ext.dd.ScrollManager.unregister(this.portal.body);
        CP.WebUI.Portal.DropZone.superclass.unreg.call(this);
    }
});


/*
 * Portal Column
 */
CP.WebUI.PortalColumn = Ext.extend( Ext.Container,{
    constructor: function( config ){
        config = Ext.apply({
            layout : 'anchor',
            //autoEl : 'div',//already defined by Ext.Component
            defaultType : 'cp_portlet'
        }, config);
        CP.WebUI.Portlet.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_portalcolumn', CP.WebUI.PortalColumn );


/*
 * Portlet widget
 */
CP.WebUI.Portlet = Ext.extend( Ext.Panel,{
    constructor: function( config ){
        config = Ext.apply({
            anchor : '100%',
            frame : true,
            collapsible : true,
            draggable : true,
            cls : 'x-portlet webui-portlet'
        }, config);
        CP.WebUI.Portlet.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_portlet', CP.WebUI.Portlet );


//~~~ @@ IP FIELDS

/*
 * IP Text Field - old component for backward compatibility, to be remove in the future when won't be in use anymore
 */
CP.WebUI.IPv4TextField = Ext.extend( CP.WebUI.TextField,{
    initComponent: function(){
        Ext.apply( this, {
            vtype: "ipv4"
        });
        CP.WebUI.IPv4TextField.superclass.initComponent.call( this );
    }
});
Ext.reg( 'cp_ipv4textfield', CP.WebUI.IPv4TextField );


/*
 * Basic IP field with 4 octets and 3 dots, imitates the ipv4 controler in windows.
 */
CP.WebUI.IPv4Field = Ext.extend( CP.WebUI.CompositeField,{
    //declare global properties
    hiddenField: null,
    octets: null,
    keypressEvent: null,
    
    constructor: function( config ){
        //set properties by user definintions or, if none, apply defaults
        var baseId = Ext.id();
        var hiddenName = '';
        var hiddenId = 'webui_ipv4field_hidden-'+ baseId;
        var compositeId = 'webui_ipv4field_composite-'+ baseId; 
        var ipFieldLabel = 'IPv4 address';
        var hideLabel = false;
        var hideInvalid = false;
        var isDisable = false;
        var allowBlank = false;
        if( config && config.fieldConfig ){
            var fieldConfig = config.fieldConfig;
            compositeId = fieldConfig.id || compositeId;
            hiddenName = fieldConfig.name || hiddenName;
            ipFieldLabel = fieldConfig.label || ipFieldLabel;
            hideLabel = fieldConfig.hideLabel || hideLabel;
            hideInvalid = fieldConfig.hideInvalid || hideInvalid;
            isDisable = fieldConfig.disabled || isDisable;
            allowBlank = fieldConfig.allowBlank || allowBlank;
            this.keypressEvent = fieldConfig.keypressEvent || null;
        }
        
        //create the octet fields
        this.octets = [];
        if( config && config.fieldConfig && config.fieldConfig.octetsConfig ){
            var octetsConfig = config.fieldConfig.octetsConfig;
            this.octets[0] = this.getOctetField( 'octet1-'+ baseId, octetsConfig[0].minVal, allowBlank, octetsConfig[0].ex, octetsConfig[0].exMsg );
            this.octets[1] = this.getOctetField( 'octet2-'+ baseId, octetsConfig[1].minVal, allowBlank, octetsConfig[1].ex, octetsConfig[1].exMsg );
            this.octets[2] = this.getOctetField( 'octet3-'+ baseId, octetsConfig[2].minVal, allowBlank, octetsConfig[2].ex, octetsConfig[2].exMsg );
            this.octets[3] = this.getOctetField( 'octet4-'+ baseId, octetsConfig[3].minVal, allowBlank, octetsConfig[3].ex, octetsConfig[3].exMsg );
        }
        else{
            this.octets[0] = this.getOctetField( 'octet1-'+ baseId, 1, allowBlank, null, '' );
            this.octets[1] = this.getOctetField( 'octet2-'+ baseId, 0, allowBlank, null, '' );
            this.octets[2] = this.getOctetField( 'octet3-'+ baseId, 0, allowBlank, null, '' );
            this.octets[3] = this.getOctetField( 'octet4-'+ baseId, 0, allowBlank, null, '' );
        }
       
        //create hidden:
        this.hiddenField = new CP.WebUI.HiddenField({
            id: hiddenId,
            name: hiddenName
        });
        
        //subclass component
        config = Ext.apply({
            //CP.WebUI.CompositeField
            cls: 'webui-ipfield',
            id: compositeId,
            fieldLabel: ipFieldLabel,
            hideLabel: hideLabel,
            preventMark: hideInvalid,
            disabled: isDisable,
            width: 141,
            height: 22,
            octets: this.octets,
            hiddenField: this.hiddenField,
            items: [ this.octets[0],
                     this.getOctetSeperator(),
                     this.octets[1],
                     this.getOctetSeperator(),
                     this.octets[2],
                     this.getOctetSeperator(),
                     this.octets[3],
                     this.hiddenField ],
            markInvalid: function( msg ){
                //By default the composite field displays the name+error of all contained fields (=octets) in the error message.
                //instead display default error message for all
                var customMsg = (msg) ? msg : 'The value in this field is invalid';
                Ext.form.Field.prototype.markInvalid.call( this, customMsg );
            },
            //extend origin setvalue of composite-field in order to copy value from the composite to its octets
            setValue: function( value ){
                this.constructor.prototype.setValue.apply( this, arguments );
                this.hiddenField.setValue( value );
                //copy value to octets
                var octet = value.split( '.' );
                this.octets[0].setValue( octet[0] );
                this.octets[1].setValue( octet[1] );
                this.octets[2].setValue( octet[2] );
                this.octets[3].setValue( octet[3] );
            },
            getValue: function(){
                return this.hiddenField.getValue();
            }
        }, config );
        CP.WebUI.IPv4Field.superclass.constructor.call( this, config );
    },

    //build dot separator
    getOctetSeperator: function(){
        return new CP.WebUI.DisplayField({
            xtype: 'cp_displayfield',
            cls: 'octet-sep',
            value: '.',
            hideLabel: true,
            width: 3
        });
    },
    
    //build octet field
    getOctetField: function( fieldId, minVal, allowBlank, ex, exMsg ){
        var newOctet = new CP.WebUI.NumberField({
            id: fieldId,
            invalidClass: '',
            cls: 'octet-field',
            regex: ex,
            regexText: exMsg,
            submitValue: false,
            hideLabel: true,
            border: false,
            enableKeyEvents: true,
            allowDecimals: false,
            allowNegative: false,
            allowBlank: allowBlank,
            minValue: minVal,
            maxValue: 255,
            maxLength: 3,
            width: 27,
            autoCreate: { tag:'input', type:'text', size: 27, autocomplete:'off', maxlength:'3' },
            listeners: {
                keydown: { scope:this, fn:this.onOctetKeydown },
                keyup:   { scope:this, fn:this.onOctetKeyup },
                change:   { scope:this, fn:this.handleBlank }
            }
        });
                
        //add keypress event if defined
        if( this.keypressEvent ){
            newOctet.on({
                keypress:{ scope:this, fn:this.keypressEvent }
            });
        }
        return newOctet;
    },
    
    //Check is blank allow - if so, check value for entire field to make sure 
    //user didn't left some octets filled and some blank
    handleBlank: function( field, e ){
        var allowBlank = field.allowBlank;
        if( allowBlank && allowBlank == 'false' ){
            return;
        }
        var fieldValue = this.getValueFromOctets();
        if( cpVTypes_ipv4Rule.test( fieldValue )){
            field.clearInvalid();
        }
        else{
            field.markInvalid();
        }
    },
    
    getValueFromOctets: function(){
        var octetArr = this.octets;
        var value = octetArr[0].getValue() +'.'+
                    octetArr[1].getValue() +'.'+
                    octetArr[2].getValue() +'.'+
                    octetArr[3].getValue();
        if( value == '...' ){ //all octets were empty
            value = '';
        }
        return value;
    },
    
    copyValToHidden: function( value ){
        this.hiddenField.setValue( value );
    },
    
    //returns the current index of the caret (int)
    getCaretPos: function( input ){
        var pos = 0;
        if( input.createTextRange ){ //IE
            var range = input.createTextRange();
            pos = range.text.length;
        } 
        else if( input.selectionEnd ){ //Mozilla
            pos = input.selectionEnd;
        }
        return pos;
    },
    
    //Sets the cursor at a given position in text.
    setCaretPos: function( input, posStart, posEnd ){
        if( input.createTextRange ){ //IE
            var range = input.createTextRange();
            range.moveStart( 'character', posStart ); 
            range.moveEnd( 'character', posEnd ); 
            range.select();
        } 
        else if( input.setSelectionRange ){ //Mozilla
            input.focus();
            input.setSelectionRange( posStart, posEnd );
        }
    },
    
    onOctetKeydown: function( field, e ){
        var keyCode = e.getKey();
        var caretPos = this.getCaretPos( field.el.dom );
        //previous octet - skip the dot separator
        var prevOctet = field.previousSibling();
            prevOctet = ( prevOctet ) ? prevOctet.previousSibling() : null;
        //next octet - skip the dot separator
        var nextOctet = field.nextSibling();
            nextOctet = ( nextOctet ) ? nextOctet.nextSibling() : null;
        
        //tab key - when pressed move to next element on page like in ip field of windows
        if( keyCode == e.TAB && nextOctet ){
            var nextOctet = field.nextSibling();
            var last = nextOctet;
            while( nextOctet ){
                last = nextOctet;
                nextOctet = nextOctet.nextSibling();
            }
            last.focus();
        }
        
        //backspace
        else if( caretPos == 0 && prevOctet && keyCode == e.BACKSPACE ){
            var prevOctetDomEl = prevOctet.el.dom;
            var valLength = prevOctetDomEl.value.length;
            this.setCaretPos( prevOctetDomEl, valLength, valLength );
        }
    },
    
    onOctetKeyup: function( field, e ){
        var keyCode = e.getKey();
        var caretPos = this.getCaretPos( field.el.dom );
        var fieldValLength = field.el.dom.value.length;
        //previous octet - skip the dot separator
        var prevOctet = field.previousSibling();
            prevOctet = ( prevOctet ) ? prevOctet.previousSibling() : null;
        //next octet - skip the dot separator
        var nextOctet = field.nextSibling();
            nextOctet = ( nextOctet ) ? nextOctet.nextSibling() : null;
     
        //left arrow
        if( caretPos == 0 && prevOctet && keyCode == e.LEFT ){
            var prevOctetDomEl = prevOctet.el.dom;
            var valLength = prevOctetDomEl.value.length;
            this.setCaretPos( prevOctetDomEl, valLength, valLength );
        }
        
        //right arrow
        else if( caretPos == fieldValLength && nextOctet && keyCode == e.RIGHT ){
            this.setCaretPos( nextOctet.el.dom, 0, 0 );
        }
        
        //period key should move to next octet like in windows
        else if( fieldValLength > 0 && nextOctet && ( keyCode == e.NUM_PERIOD || keyCode == 190 )){
            this.setCaretPos( nextOctet.el.dom, 0, 0 );
        }
        
        //move right using arrow
        else if( caretPos == 3 && nextOctet){
            var nextOctetDomEl = nextOctet.el.dom;
            if( keyCode == e.RIGHT ){
                this.setCaretPos( nextOctetDomEl, 0, 0 );
            }
            else if( keyCode != e.LEFT ){
                if( nextOctetDomEl.value.length == 3 ){
                    this.setCaretPos( nextOctetDomEl, 0, nextOctetDomEl.value.length );
                }
                nextOctet.focus();
            }
        }
        this.copyValToHidden( this.getValueFromOctets() ); //update composite field with changed value on key stroke
    }
});
Ext.reg( 'cp_ipv4field', CP.WebUI.IPv4Field );


/*
 * IPv4 Address Notation
 */
CP.WebUI.IPv4Notation = Ext.extend( Ext.Panel,{
    //declare component properties
    id: '',
    name: '',
    label: '',
    ipNotationId: '',
    ipNotationName: '',
    ipNotationLabel: '',
    isDisable: false,
    allowBlank: false,
    keypressEvent: null,
    
    constructor: function( config ){
        //init properties
        if( config && config.fieldConfig ){
            var fieldConfig = config.fieldConfig;
            this.id = fieldConfig.id || '';
            this.name = fieldConfig.name || '';
            this.label = fieldConfig.label || 'IPv4 address';
            this.ipNotationId = fieldConfig.ipNotationId || '';
            this.ipNotationName = fieldConfig.ipNotationName || '';
            this.ipNotationLabel = fieldConfig.notationLabel || '';
            this.isDisable = fieldConfig.disabled || false;
            this.allowBlank = fieldConfig.allowBlank || false;
            this.keypressEvent = fieldConfig.keypressEvent || this.keypressEvent;
        }
        
        //get fields by notation format
        var items = [];
        var ipNotationFormat = CP.global.formatNotation;
        if( ipNotationFormat == 'Length' ){ 
            items = this.addCidrNotation();
        }
        else if( ipNotationFormat == 'Dotted' ){ 
            items = this.addDottedNotation();
        }else{
			items = this.addDottedNotation();
        }

        //build container panel
        config = Ext.apply({
            layout: 'form',
            border: false,
            id: this.id + 'parent',
            ipId: this.id,
            notationId: this.ipNotationId,
            items: items
        }, config );
        CP.WebUI.IPv4Notation.superclass.constructor.call( this, config );
        
        //set and get value for dotted/cidr (convertor)
        if( ipNotationFormat == 'Dotted' ){ 
            this.manageNotationValue();
        }
    },
    
    //CIDR notation
    addCidrNotation: function(){
        var notationLabel = this.ipNotationLabel || 'Mask length';
        var enableKE = (this.keypressEvent == null) ? false : true;
        var items = [{
            fieldLabel: this.label +' &#47; '+ notationLabel,
            xtype: 'cp_compositefield',
            cls: 'webui-ipv4notation',
            width: 184,
            height: 22,
            items: [{
                xtype: 'cp_ipv4field',
                fieldConfig: {
                    hideLabel: true,
                    id: this.id,
                    name: this.name,
                    hideInvalid: true,
                    disabled: this.isDisable,
                    allowBlank: this.allowBlank,
                    keypressEvent: this.keypressEvent
                }
            },{
                xtype: 'cp_displayfield',
                value: '&#47;',
                invalidClass: '',
                width: 8,
                hideLabel: true
            },{
                id: this.ipNotationId,
                name: this.ipNotationName,
                xtype: 'cp_masklength',
                fieldLabel: notationLabel,
                invalidClass: '',
                disabled: this.isDisable,
                allowBlank: this.allowBlank,
                enableKeyEvents: enableKE,
                keypressEvent: this.keypressEvent
            }]
        }];
        return items;
    },
    
    //Dotted-decimal notation
    addDottedNotation: function(){
        var regEx = /^(0|128|192|224|240|248|252|254|255)$/;
        var msg = 'The following values are allowd: 0,128,192,224,240,248,252,254,255';
        var items = [{
            xtype: 'cp_ipv4field',
            fieldConfig: {
                id: this.id,
                name: this.name,
                label: this.label,
                disabled: this.isDisable,
                allowBlank: this.allowBlank,
                keypressEvent: this.keypressEvent
            }
        },{
            xtype: 'cp_ipv4field',
            fieldConfig: {
                id: this.ipNotationId,
                name: this.ipNotationName,
                label: this.ipNotationLabel || 'Subnet mask',
                disabled: this.isDisable,
                allowBlank: this.allowBlank,
                keypressEvent: this.keypressEvent,
                octetsConfig: [{
                    minVal: 128, 
                    ex: /^(128|192|224|240|248|252|254|255)$/, 
                    exMsg: 'The following values are allowd: 128,192,224,240,248,252,254,255'
                },{
                    minVal: 0, 
                    ex: regEx, 
                    exMsg: msg
                },{
                    minVal: 0, 
                    ex: regEx, 
                    exMsg: msg
                },{
                    minVal: 0, 
                    ex: regEx, 
                    exMsg: msg
                }]
            }
        }];
        return items;
    },
   
    disable: function(){
//        var panel = Ext.getCmp( this.getId() );
//        Ext.getCmp( panel.ipId ).disable();
//        Ext.getCmp( panel.notationId ).disable();
    },
    
    enable: function(){
//        var panel = Ext.getCmp( this.getId() );
//        Ext.getCmp( panel.ipId ).enable();
//        Ext.getCmp( panel.notationId ).enable();
    },
    
    manageNotationValue: function(){
        //get notation field
        var notationId = this.ipNotationId;
        var notationField = Ext.getCmp( notationId );
        var hidden = notationField.hiddenField;
        
        //private functions
        function setOctetVals( val1, val2, val3, val4 ){
            var octetsArr = notationField.octets;
            octetsArr[0].setValue( val1 );
            octetsArr[1].setValue( val2 );
            octetsArr[2].setValue( val3 );
            octetsArr[3].setValue( val4 );
        }
        
        function cidrToDecOctet( nMask ){
            var intMask = parseInt( nMask );
            if( isNaN( intMask )){
                return '';
            }
            if( intMask < 1 ){
                return 0;
            }
            var nCalc = 255;
            for( var nX = 7 ; nX > -1 ; nX-- ){
                if( intMask <= 0 ){
                	nCalc = nCalc << 1;
                	nCalc = 255 & nCalc;
                }
                else
                	intMask -= 1;
            }
            return nCalc;
        }
        
        function decToCIDR( decVal ){
            var num = 0;
            switch( decVal ){
                case '255':
                    num = 8;
                break;
                case '254':
                    num = 7;
                break;
                case '252':
                    num = 6;
                break;
                case '248':
                    num = 5;
                break;
                case '240':
                    num = 4;
                break;
                case '224':
                    num = 3;
                break;
                case '192':
                    num = 2;
                break;
                case '128':
                    num = 1;
                break;
                default: //'0'
                    num = 0;
                break;
            }
            return num;
        }
        
        //override setValue
        Ext.getCmp( notationId ).setValue = function( value ){
            //call parent
            this.constructor.prototype.setValue.apply( this, arguments );
            //check format
            value = value.toString();
            if( value == '' ){
                return;
            }
            if( value.indexOf('.') == -1 ){ //cidr
                //save to hidden
                hidden.setValue( value );
                
                //convert to dotteted and apply to octets:
                setOctetVals( cidrToDecOctet( value ), 
                              cidrToDecOctet( value - 8 ), 
                              cidrToDecOctet( value - 8 * 2 ), 
                              cidrToDecOctet( value - 8 * 3 ));
            }
            else{
                //if not keydown - copy to octets
                var octetVals = value.split( '.' );
                setOctetVals( octetVals[0],
                              octetVals[1],
                              octetVals[2],
                              octetVals[3] );
                
                //convert to cidr and save in hidden
                var netmask = decToCIDR( octetVals[0] ) +
                              decToCIDR( octetVals[1] ) +
                              decToCIDR( octetVals[2] ) +
                              decToCIDR( octetVals[3] );
                
                hidden.setValue( netmask );
            }
        };
        
        function convertValue(){
            var value = hidden.getValue();
            var octetVals = value.split( '.' );
            //convert to cidr and save in hidden
            var netmask = decToCIDR( octetVals[0] ) +
                          decToCIDR( octetVals[1] ) +
                          decToCIDR( octetVals[2] ) +
                          decToCIDR( octetVals[3] );
            
            hidden.setValue( netmask );
        }
        notationField.octets[0].on( 'keyup', convertValue );
        notationField.octets[1].on( 'keyup', convertValue );
        notationField.octets[2].on( 'keyup', convertValue );
        notationField.octets[3].on( 'keyup', convertValue );
    }
});
Ext.reg( 'cp_ipv4notation', CP.WebUI.IPv4Notation );


/*
 * IPv6 Text Field
 */
CP.WebUI.IPv6Field = Ext.extend( CP.WebUI.TextField,{
    initComponent: function(){
        Ext.apply( this, {
            vtype: "ipv6",
            width: 270
        });
        CP.WebUI.IPv6Field.superclass.initComponent.call( this );
    }
});
Ext.reg( 'cp_ipv6Field', CP.WebUI.IPv6Field );


//~~~ @@ INLINE ELEMENTS

/*
 * Displays an inline page message
 */
CP.WebUI.inlineMsg = Ext.extend( Ext.BoxComponent,{
    constructor: function( config ){
        var html = '<div class="msg-tl"><div class="msg-tr"><div class="msg-tc">&nbsp;</div></div></div>'+
                   '<div class="msg-ml"><div class="msg-mr"><div class="msg-mc '+ config.type +'">'+ config.text +'</div></div></div>'+
                   '<div class="msg-bl"><div class="msg-br"><div class="msg-bc">&nbsp;</div></div></div>';
        
        config = Ext.apply({
            cls: 'webui-inlinemsg',
            html: html
        }, config );
        CP.WebUI.inlineMsg.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_inlinemsg', CP.WebUI.inlineMsg );


/*
 * section title
 */
CP.WebUI.SectionTitle = Ext.extend( Ext.Panel,
{
    constructor: function( config ){
        config = Ext.apply({
            layout: 'fit'
            , border: false
            , cls: 'webui-section-title'
            , html: ( config && config.titleText ) ? '<span>'+ config.titleText +'</span>' : '<span>Please define title</span>'
        }, config);
        CP.WebUI.SectionTitle.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_sectiontitle', CP.WebUI.SectionTitle );


//~~~ @@ WINDOWS

/*
 * modal popup window
 */
CP.WebUI.ModalWin = Ext.extend( Ext.Window,{
    constructor: function( config ){
        config = Ext.apply({
            title: 'Please define title'
            , closable: true
            , draggable: true
            , resizable: false
            , modal: true
            , shadow: true
            , layout: 'fit'
            , width: 400
            , height: 300
            , bodyBorder: false
            , border: false
            , hideBorders: true
            , cls: 'webui-modal-win'
            , closeAction: 'close'
            , onEsc: function(){this.close();} //Closes window when pressing the ESC key.
        }, config);
        CP.WebUI.ModalWin.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_modalwin', CP.WebUI.ModalWin );


/*
 * Popup message window with animation
 */
CP.WebUI.MsgWindow = Ext.extend( Ext.ux.window.MessageWindow,{
    constructor: function( config ){
        config = Ext.apply({
            autoDestroy: false, //default = true
            resizable: false,
            draggable: true,
            autoHeight: false,
            autoHide: false, //default = true
            closable: true, //no close button on top right
            help: false, //no help tool
            pinOnClick: false,
            border: true,
            width: 600, //optional (can also set minWidth which = 200 by default)
            height: 400,
            html: '&nbsp;',
            bodyStyle: 'overflow:auto;',
            cls: 'webui-modal-win',
            closeAction: 'hide',
            hideAction: 'hide',
            hideFx: {
                delay: 300000, //time in milliseconds to delay the start of the effect
                mode: 'custom',//null,'standard','custom',or default ghost
                useProxy: true, //default is false to hide window instead
                callback: function (obj, el, fx) { //use callback to control the hide Fx
                    el.ghost("b", { //b=bottom
                        duration: fx.duration || 1,
                        remove: false,
                        scope: obj,
                        callback: obj.afterHide
                    });
                }
            },
            showFx: {
                duration: 0.25, //defaults to 1 second
                mode: 'standard',//null,'standard','custom',or default ghost
                useProxy: false //default is false to hide window instead
            },
            origin:{ //location of console
                pos: "br-br" //position to align to (see {@link Ext.Element#alignTo} for more details defaults to "br-br").
                /*
                el: Ext.get('myWin'), //element to align to (defaults to document)
                offX: 0.25*Ext.get('myWin').getWidth(), //amount to offset horizontally (-20 by default)
                offY: 0, //amount to offset vertically (-20 by default)
                */
            }
        }, config);
        CP.WebUI.MsgWindow.superclass.constructor.call( this, config );
    }
});
Ext.reg( 'cp_msgwin', CP.WebUI.MsgWindow );


/*
 * Terminal - console panel
 */
CP.WebUI.ConsolePanel = Ext.extend( Ext.Panel,{
     initComponent : function(){
        var Config = {
            form_method : 'POST',
            cls: 'webui-console-panel', 
            input_id : 'cursor',
            input_name : 'console_input',
            terminalConsoleId : null,
            onload : null,
            url : null
        };
        Ext.applyIf( this, Config );
    
        this.terminal = new this.anytermC( this.terminalConsoleId );
        this.terminal.initialise();
        CP.WebUI.ConsolePanel.superclass.initComponent.call( this );        
    },
  
    anytermC: function (terminalConsoleId){
        var term;
        var termbody;
        var open = false;
        var session;

        // Random sequence numbers are needed to prevent Opera from caching
        // replies

        var is_opera = navigator.userAgent.toLowerCase().indexOf("opera") != -1;
        var seqnum_val=Math.round(Math.random()*100000);
        
        function cachebust(){
          if (is_opera) {
            seqnum_val++;
            return "&x="+seqnum_val;
          } else {
            return "";
          }
        }

        // Synchronous loader is a simple function
        function sync_load( url, callback ){
            Ext.Ajax.request({
                url: '/anyterm-module?'+ url,
                method: 'GET',
                disableCaching: false, //removes the ExtJS '_dc' parameter from the request
                success: function( response ){
                    if( callback ){
                        callback( response.responseXML );
                    }
                },
                failure: function( response ){}
            });
        }


        // Receive channel:
        var disp="";
        function display(n) {

          //term.innerHTML=Sarissa.serialize(n);

          var edscr = getTextContent(n);
          var ndisp="";
          
          while (edscr!="") {
            var cmd=edscr.substr(0,1);
            edscr=edscr.substr(1);
            var cp=edscr.indexOf(":");
            var num=edscr.substr(0,cp);
            edscr=edscr.substr(cp+1);
            if (cmd=="d") {
              disp=disp.substr(num);
            } else if (cmd=="k") {
              ndisp+=disp.substr(0,num);
              disp=disp.substr(num);
            } else if (cmd=="i") {
              if (edscr.length<num) {
              }
              ndisp+=edscr.substr(0,num);
              edscr=edscr.substr(num);
            }
          }

          disp=ndisp;
          var h=ndisp.replace(/\n/g,"<br>");
          var cursor_sides = h.split("<span id=\"cursor\">");
          append_data(cursor_sides[0], cursor_sides[1], true);
        }

                function append_data(bc_data, ac_data, success){
                        var b_c = Ext.get('before_cursor');
                        var a_c = Ext.get('after_cursor');
                        Ext.DomHelper.overwrite(b_c, {tag: 'span', html: bc_data, style: 'color: #ccc; font-family: courier new, monospace !important; font-size: 13px; line-height: 1.3em'});
                        Ext.DomHelper.overwrite(a_c, {tag: 'span', html: ac_data, style: 'color: #ccc; font-family: courier new, monospace !important; font-size: 13px; line-height: 1.3em'});

                        clearInterval(this.timer);
//                        this.input_object.value = '';
                }


        function get() {
          var resXml = sync_load( 'rcv&s='+session+cachebust(), rcv );
        }

        function rcv(doc) {
          // Called asynchronously when the received document has returned
          // from the server.

          if (!open) {
            return;
          }

          var root = get_response_root(doc);
          if (!root) {
            return;
          } else if (root.tagName=="op") {
            display(root);
            get();
                  } else if (root.tagName=="error") {
            open=false;
            if (terminalConsoleId != null)
            {
                var window = Ext.getCmp(terminalConsoleId);
                window.close();
            }
          } else {
//          alert("Unrecognised response: "+root.tagName);
          }
        }


        // Transmit channel:

        var kb_buf="";
        var send_in_progress=false;

        function send() {
          send_in_progress=true;
          var url = "send&s="+session+cachebust()+"&k="+encodeURIComponent( kb_buf );
          var d = sync_load( url, send_done );
          kb_buf="";
        }

        function send_done(doc) {
          send_in_progress=false;
          // should check for errors
          if (kb_buf!="") {
            send();
          }
        }


        function maybe_send() {
          if (!send_in_progress) {
            send();
          }
        }


        function process_key (k) {
        //   return;
          kb_buf+=k;
          maybe_send();
        }


        function esc_seq(s) {
          return String.fromCharCode(27)+"["+s;
        }


        function key_ev_stop(ev) {
          ev.cancelBubble=true;
          if (ev.stopPropagation) ev.stopPropagation();
          if (ev.preventDefault)  ev.preventDefault();
        }


        this.keypress = function(ev) {
          if (!ev) var ev=window.event;

          if (ev.ctrlKey
              || (ev.which==0)
              || (ev.keyCode==8)) {
            key_ev_stop(ev);
            return false;
          }

          var kc;
          if (ev.keyCode) kc=ev.keyCode;
          if (ev.which)   kc=ev.which;
          if (ev.charCode) kc=ev.charCode;
         
        if (kc > 255)
        {
//          var k=String.fromCharCode(63);
            return false;
        }
        else
        {
            var k=String.fromCharCode(kc);
        }
        //     alert("keypress keyCode="+ev.keyCode+" which="+ev.which+
        //      " shiftKey="+ev.shiftKey+" ctrlKey="+ev.ctrlKey+" altKey="+ev.altKey);

          process_key(k);

          key_ev_stop(ev);
          return false;
        };


        this.keydown = function(ev) {
          if (!ev) var ev=window.event;

          //  alert("keydown keyCode="+ev.keyCode+" which="+ev.which+
          //    " shiftKey="+ev.shiftKey+" ctrlKey="+ev.ctrlKey+" altKey="+ev.altKey);

          var k;

          var kc=ev.keyCode;
          if (kc==33) k=esc_seq("5~");       // PgUp
          else if (kc==34) k=esc_seq("6~");  // PgDn
          else if (kc==35) k=esc_seq("4~");  // End
          else if (kc==36) k=esc_seq("1~");  // Home
          else if (kc==37) k=esc_seq("D");   // Left
          else if (kc==38) k=esc_seq("A");   // Up
          else if (kc==39) k=esc_seq("C");   // Right
          else if (kc==40) k=esc_seq("B");   // Down
          else if (kc==45) k=esc_seq("2~");  // Ins
          else if (kc==46) k=esc_seq("3~");  // Del
          else if (kc==27) k=String.fromCharCode(27); // Escape
          else if (kc==9)  k=String.fromCharCode(9);  // Tab
          else if (kc==8)  k=String.fromCharCode(127);  // Backspace
          else if (kc==112) k=esc_seq("[A");  // F1
          else if (kc==113) k=esc_seq("[B");  // F2
          else if (kc==114) k=esc_seq("[C");  // F3
          else if (kc==115) k=esc_seq("[D");  // F4
          else if (kc==116) k=esc_seq("[E");  // F5
          else if (kc==117) k=esc_seq("17~"); // F6
          else if (kc==118) k=esc_seq("18~"); // F7
          else if (kc==119) k=esc_seq("19~"); // F8
          else if (kc==120) k=esc_seq("20~"); // F9
          else if (kc==121) k=esc_seq("21~"); // F10

          else {
          
            if (!ev.ctrlKey || ev.keyCode==17) {
         //     key_ev_stop(ev);
              return true;
            }

            k=String.fromCharCode(kc-64);
          }

        //   alert("keydown keyCode="+ev.keyCode+" which="+ev.which+
        //  " shiftKey="+ev.shiftKey+" ctrlKey="+ev.ctrlKey+" altKey="+ev.altKey);

          process_key(k);

          key_ev_stop(ev);
          return false;
        };


        // Misc:



        function get_response_root(d) {
          var n = d.firstChild;
          while (n.nodeType!=1) {
            n = n.nextSibling;
            if (!n) {
              alert("Can't find root node");
            }
          }
          if (!n) {
            alert("Error: no data in response");
            return null;
          }
          if (n.tagName=="error") {
            return n;
          }
          return n;
        }

        function getTextContent(n) {
          // Note that long text nodes may be broken up into a series of
          // shorter ones!
          var t="";
          var i=n.firstChild;
          while (i) {
            t+=i.data;
            i=i.nextSibling;
          }
          return t;
        }


        // Open, close and initialisation:

        function open_term() {
          if (open) {
            alert("Connection is already open");
            return;
          }
          var d = sync_load( 'open='+ cachebust(), handleOpenResponse );
        }
        
        function handleOpenResponse( resXml ){
            var root = get_response_root( resXml );
            if( !root ){
                return null;
            } 
            else if( root.tagName == "open" ){
                open = true;
                session = root.getAttribute("s");
                get();
            } 
            else if (root.tagName == "error") {
                open = false;
            } 
            else {
                alert("Unrecognised response (root.tagName='"+root.tagName+"'): "+Sarissa.serialize( resXml ));
            }
        }

        this.close_term = function() {
          if (!open) {
//          alert("Connection is not open");
            return;
          }
          open=false;
          var d = sync_load( "close&s="+session+cachebust() );
        };

          this.initialise = function() {
          open_term();
        };



    },

    destroy: function(p){
    var term_C = this.terminal;
        term_C.close_term();
    },



    afterRender : function(){
        var wh = this.ownerCt.getSize();
        var _this = this;
        Ext.applyIf(this, wh);
        CP.WebUI.ConsolePanel.superclass.afterRender.call(this);    
       
    var term_C = this.terminal;
 
        var terminal_container = this.body.dom;
        Ext.DomHelper.append(terminal_container, {tag: 'div'});
        var terminal = Ext.get(terminal_container).last('div');
        
        Ext.DomHelper.applyStyles(terminal_container, {
            'border' : 'none',
//          'max-height' : '100%', //this.max_height
//          'max-width' : '100%', //this.max_height
            'background-color' : '#000'
        });
        
        Ext.DomHelper.applyStyles(terminal, {
//          'max-height' : '100%' //this.max_height
        });

        Ext.DomHelper.append(terminal, {tag: 'span'});
        var terminal_output = Ext.get(terminal).last('span');
        Ext.DomHelper.append(terminal, {tag: 'span', html: this.custom_prompt, id: 'before_cursor'}); 
        
        Ext.DomHelper.append(terminal, {tag: 'input', id: this.input_id, type: 'text', name: this.input_name, autocomplete: 'off'}); 
        Ext.DomHelper.append(terminal, {tag: 'span', html: this.custom_prompt, id: 'after_cursor'}); 
        var terminal_input = Ext.get(terminal).last('input');
        this.ti = terminal_input;
        
        terminal_input.applyStyles({
            'width' : '1',
            'border' : 'none',
            'background-color' : 'black',
            'padding' : '0',
            'margin' : '0',
            'cursor' : 'pointer'
        });

        terminal_input.addListener('keydown', function(e,o,t){
                        if (!term_C.keydown(e.browserEvent))
                        {
                                e.stopPropagation();
                                e.stopEvent();
                        }
        });

                terminal_input.addListener ('keypress' ,function(e){
                        term_C.keypress(e.browserEvent);
                        e.stopPropagation();
                        e.stopEvent();
                });
        
        terminal.select('span, input').each(function(o){
            o.applyStyles({
                'color' : '#ccc',
                'font' : 'normal 13px courier new, monospace !important',
                'line-height' : '1.3em'
            });
            setInputFocus();        
        });


        //Set Focus
        function setInputFocus(){
                terminal_input.focus(); 
            }
        //Attach Events`
        this.ownerCt.on('show',setInputFocus);
                this.ownerCt.on('afterlayout',setInputFocus);
        this.ownerCt.on('move',setInputFocus);
        this.ownerCt.on('resize',setInputFocus);
        this.ownerCt.on('click',setInputFocus);
    }
    
});
Ext.reg('cp_consolepanel',CP.WebUI.ConsolePanel); 

/*
 * FileUploadPanel - used to upload files to the machine. Uploads the file by multipart/form-data,
 * 	using FileUploadField to browse files and transfer. 
 * Few properties:
 * 		progressTask - task for updating progress bar. Have to be stopped on end.
 * 		state: [none | uploading | finished]
 * 		initUploadPanel - callback function that can be called when the panel is loaded or state is set to 'none'
 * 		onUploadStarted, onUploadFinished - callback functions that called when the panel state is set 
 * 			to 'uploading' or 'finished'
 * 		originalFileName - name of the uploaded file
 * 		uploadPath - path to save the file in the machine. Allowed only '/tmp' or '/var/log/upload'
 * 		tmpPath - path to the tmp file in the machine. Allowed only '/tmp' or '/var/log/upload'
 * 		fileSize - size of the uploaded file
 */
CP.WebUI.FileUploadPanel = Ext.extend(CP.WebUI.Panel, {
	uploadPanelId: 'fu_upload_panel'+Ext.id(),
	progressBarId: 'fu_progressbar',
	progressTask: null,
	state: "none",
	initUploadPanel: null,
	onUploadStarted: null,
	onUploadFinished: null,
	originalFileName: "",
	uploadPath: "/var/log/upload",
	tmpPath: "/tmp",
	fileSize: 0,
	
	cancelUpload: function(){
		if (this.progressTask) {
			Ext.TaskMgr.stop(this.progressTask);
			this.progressTask = null;
		}
	},
	
	changeState: function(jsonData, newState){
		if (newState == "none"){
			if (this.initUploadPanel != null)
				this.initUploadPanel();
			Ext.getCmp('fu_progress_wrapper').hide();
			Ext.getCmp(this.uploadPanelId).show();
		}
		else if (newState == "uploading" ){			
			if (this.onUploadStarted != null)
				this.onUploadStarted();
			Ext.getCmp(this.uploadPanelId).hide();
			Ext.getCmp('fu_progress_wrapper').show();
			this.originalFileName = jsonData.messages.fileName;
			this.fileSize = jsonData.messages.size;
			Ext.getCmp('fu_status_field').setValue("Uploading "+ jsonData.messages.fileName );
			Ext.getCmp('fu_size_field').setValue("Total Size: " + Ext.util.Format.fileSize(this.fileSize));
			var task = { run: function(){
					Ext.Ajax.request({
						url: "/cgi-bin/progress.tcl"
						,method: "GET"
						,scope: this
						,params: {task:"filesize",fileName:this.args[3]}
						,success: function(jsonResult) {
							var pbar = this.args[0];
							var sizeField = this.args[1];
							var totalSize = parseInt(this.args[2]);
							
							var jsonData = Ext.decode(jsonResult.responseText);
							if (jsonData.data.currSize){
								var cSize = parseInt(jsonData.data.currSize);
								if (cSize > 0){
									pbar.updateProgress(cSize/totalSize);
									sizeField.setValue("Uploaded: " + Ext.util.Format.fileSize(cSize));
								}
							}
						}
					});
				}
				,interval: 1000 //1 second
				,args: [Ext.getCmp(this.progressBarId), 
				        Ext.getCmp('fu_uploaded_size_field'),
				        this.fileSize,
				        jsonData.messages.tmpFileName
				]
			};
			this.progressTask = task;
			Ext.TaskMgr.start(task);
		}
		else if (newState == "finished" ){
			if (this.progressTask) {
				Ext.TaskMgr.stop(this.progressTask);
				this.progressTask = null;
			}
			Ext.getCmp(this.progressBarId).updateProgress(1);
			Ext.getCmp('fu_status_field').setValue(this.originalFileName + " was successfully uploaded" );
			Ext.getCmp('fu_uploaded_size_field').setValue("Uploaded: " + Ext.util.Format.fileSize(this.fileSize));
			if (this.onUploadFinished != null)
				this.onUploadFinished();
		}
		
		state = newState;
		this.doLayout();
	},
	constructor: function( config ){
		var uploadLabel = "";
    	if (config){
    		if (config.uploadPanelId)
    			this.uploadPanelId = config.uploadPanelId;
    		if (config.initUploadPanel)
    			this.initUploadPanel = config.initUploadPanel;
    		if (config.onUploadStarted)
    			this.onUploadStarted = config.onUploadStarted;
    		if (config.onUploadFinished)
    			this.onUploadFinished = config.onUploadFinished;
    		if (config.uploadPath)
    			this.uploadPath = config.uploadPath;
    		if (config.tmpPath)
    			this.tmpPath = config.tmpPath;
    		if (config.uploadLabel)
    			uploadLabel = config.uploadLabel;
    	}
    	
    	var uploadWrapper = new CP.WebUI.FormPanel({
    		fileUpload: true,
        	id: this.uploadPanelId,
        	border: false,
    		items:[{
				xtype: 'cp_displayfield',
				hideLabel: true,
				style: 'padding-top:8px; padding-bottom:8px',
				value: uploadLabel
			},{
        		xtype: 'cp_fileuploadfield',
        		id: 'fu_upload_field',
        		fieldId:'fu_field',
        		textFieldId: 'fu_text_field',
        		fieldName: 'upload_file_cmp'
        	},{
        		xtype: 'cp_button',
    			id: 'fu_upload_button',
    			disabled: true,
    			text: 'Upload',
    			scope: this,
    			handler: function(){
    				Ext.Ajax.request({
    					url: "/cgi-bin/upload_prep.tcl"
    					, method: "GET"
    					, scope: this
    					, params: {
    						'uploadPath': this.uploadPath
    						,'tmpPath': this.tmpPath
    					}
    					, success: function(jsonResult) {
    						var jsonData = Ext.decode(jsonResult.responseText);
    						this.changeState(jsonData,"uploading");
    					}
    				});
    				
    				uploadWrapper.getForm().submit ({
    					url: '/cgi-bin/upload.tcl'
    					, method: 'POST'
        				, scope: this
    					, success: function(form, action){
    						this.changeState(null,"finished");
    						//Ext.Msg.alert('Success', 'The file was uploaded successfully');
    					}
    					, failure: function(form, action) {
    					}
    					, timeout: '60000'
    				});
    			}
        	}]
    	});
    	var progressWrapper = new CP.WebUI.FormPanel({
			id: 'fu_progress_wrapper',
    		hidden:true,
    		hideMode:'offsets',
        	border: false,
    		items: [{
        		xtype: 'cp_progressbar',
    			id: this.progressBarId
        	},{
				xtype: 'cp_displayfield',
				id: 'fu_status_field',
				hideLabel: true,
				style: 'padding-top:8px;',
				value: 'Uploading...'
			},{
				xtype: 'cp_displayfield',
				id: 'fu_size_field',
				hideLabel: true,
				style: 'padding-top:8px;',
				fieldLabel: 'Total Size',
				value: 'Total Size: '
			},{
				xtype: 'cp_displayfield',
				hideLabel: true,
				id: 'fu_uploaded_size_field',
				style: 'padding-top:8px;',
				fieldLabel: 'Uploaded',
				value: 'Uploaded: '
			}]
    	});
        config = Ext.apply({
        	border: false,
        	items: [
        	        uploadWrapper,
        	        progressWrapper]
        }, config);
        CP.WebUI.FileUploadField.superclass.constructor.call( this, config );
    }//end of constructor
});
Ext.reg('cp_fileuploadpanel', CP.WebUI.FileUploadPanel);

CP.WebUI.FileUploadField = Ext.extend(CP.WebUI.TextField,  {

	buttonText: 'Browse...',
    fieldId: 'fu_field'+Ext.id(),
    textFieldId: 'fu_tf'+Ext.id(),
    
    /*
     * mandatory
     */
    fieldName: '',
    
    constructor: function( config ){
    	if (config && config.fieldName)
	    	this.fieldName = config.fieldName;
    	if (config && config.fieldID)
    		this.fieldId = config.fieldID;
    	if (config && config.textFieldId)
    		this.textFieldId = config.textFieldId;
    	
    	config = Ext.apply({
        	width: 230,
        	id: this.textFieldId,
        	hideLabel: true
        }, config);
    	
    	CP.WebUI.FileUploadField.superclass.constructor.call( this, config );
    },
    // private
    initComponent: function(){
    	CP.WebUI.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {webui.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'			
        );
    },

    // private
    onRender : function(ct, position){
    	CP.WebUI.FileUploadField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        this.el.dom.removeAttribute('name');
        this.createFileInput();

        this.button = new CP.WebUI.Button({
            renderTo: this.wrap,
            text: this.buttonText,
            cls: 'x-form-file-btn webui-button'
        });

        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;
    },
	
	change_upload_button_state: function(){
		Ext.getCmp('fu_upload_button').enable();
	},
	
    bindListeners: function(button_name){
        this.fileInput.on({
        	scope: this,
        	change: function(){
                var v = this.fileInput.dom.value;
                this.setValue(v);
                this.fireEvent('fileselected', this, v,this.change_upload_button_state());
            }
        });
    },

    createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.fieldId,
            name: this.fieldName,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1
        });
    },

    // private
    onResize : function(w, h){
    	CP.WebUI.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);

        var w = this.wrap.getWidth() - this.button.getEl().getWidth() - 5;
        this.el.setWidth(w);
    },

    // private
    onDestroy: function(){
    	CP.WebUI.FileUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.fileInput, this.button, this.wrap);
    },

    onDisable: function(){
    	CP.WebUI.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    },

    onEnable: function(){
    	CP.WebUI.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    },

    // private
    doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.button.setDisabled(disabled);
    }
});
Ext.reg('cp_fileuploadfield', CP.WebUI.FileUploadField);

CP.WebUI.ProgressBar = Ext.extend( Ext.ProgressBar,{
    constructor: function( config ){
        config = Ext.apply({
        }, config);
        CP.WebUI.ProgressBar.superclass.constructor.call( this, config );
    }
});
Ext.reg('cp_progressbar', CP.WebUI.ProgressBar);

CP.WebUI.PasswordMeter = Ext.extend( CP.WebUI.Password,{
    constructor: function( config ){      
        // init properties & building Items              
        this.initProperties( config );    
        
        //modify the config object   
        config = Ext.apply({                               
            id: this.fieldId,                                                                                         
            fieldLabel: this.fieldLabel,                              
            itemCls: 'password_strength_default_position',
            clsHolder: this.clsHolder,
            enableKeyEvents: true, 
            passwordStrength: 0, //number that holds the current strength. the keyup event will modified that field   
            letters: 0,
    		capitalLetters: 0,
    		digits: 0,
    		special: 0,
    		usingGroups: 0,
            listeners: {
                focus: { scope: this, fn:this.calculateStrength },
                keyup: { scope: this, fn:this.calculateStrength },
                keydown: { scope: this, fn:this.calculateStrength }
            }
        }, config);       
        CP.WebUI.PasswordMeter.superclass.constructor.call( this, config );
        
    } //eof constructor

	,initComponent: function() {
        CP.WebUI.PasswordMeter.superclass.initComponent.call(this);
        this.addListener('afterrender', this.initStyle);
    }
    

	,initStyle: function(field){
		if( field.itemStyle && field.itemStyle.indexOf( ':' ) > -1 ){
		    var fieldEl = Ext.get(field.clsHolder.getEl().findParent("div.password_strength_default_position"));
		    var list = field.itemStyle.split(':');
	        fieldEl.setStyle(list[0], list[1]);
		}
	}
	
    // init config properties
    ,initProperties: function( config ){
        this.fieldId = 'password_field_'+ Ext.id(); 
        this.fieldLabel = 'Password';
        this.calculateStrength = this.show_pass_strength;
        this.clsHolder = this; // this is used to select the component to which the strength meter should appear next to
        this.itemStyle = ''; // this is used to finetune the position and style of the strength meter in the clsHolder
        
        if( config ){
            this.fieldId = config.fieldId || this.fieldId; 
            this.fieldLabel = config.fieldLabel || this.fieldLabel;
            this.calculateStrength = config.calculateStrength || this.calculateStrength;
            this.clsHolder = config.clsHolder || this.clsHolder;
            this.itemStyle = config.itemStyle || this.itemStyle;
        }
    }                       
    
    // ~~~ Getters and Setters
    ,getPasswordStrength: function(){
        return this.passwordStrength;
    }
    
    ,setPasswordStrength: function( passwordStrength ){
        this.passwordStrength = passwordStrength;
    }           
         
    //---
    
    
	,IsCharsFromGroup: function(pass) {
		if(pass.match(/[a-z]+/))
		{
			this.letters += 1;
		}
	}
	,IsCapitalsFromGroup: function(pass) {
		if(pass.match(/[A-Z]+/))
		{
				this.capitalLetters += 1;
		}
	}
	,IsDigitsFromGroup: function(pass) {
		if(pass.match(/[0-9]+/))
		{
				this.digits += 1;
		}
	}
	,IsSpecialFromGroup: function(pass) {
		if(pass.match(/[!@#\$%\^&\*\(\)\-_=\+:;]+/i))
		{
				this.special += 1;
		}
	}
	,countGoups: function() {
		if(this.letters == 1)
		{
			this.usingGroups += 1;							
		}
		if(this.capitalLetters == 1)
		{
			this.usingGroups += 1;
		}	
		if(this.digits == 1)
		{
			this.usingGroups += 1;	
		}
		if(this.special == 1)
		{
			this.usingGroups += 1;	
		}			
	}
   //recalculate password strength
   ,show_pass_strength: function( field ){
       var new_strength = 0;
       var pass = field.getValue();
       
       if( pass.length <= 1 )
       {
    	   this.usingGroups = 0;
    	   this.letters = 0;
    	   this.capitalLetters = 0;
    	   this.digits = 0;
    	   this.special = 0;			
       }
       new_strength = pass.length - 6;
       if (new_strength < 0)
       {
    	   new_strength = new_strength * 3;
       }
       if (new_strength >10)
       { 
    	   new_strength = 10;
       }
       this.IsCharsFromGroup(pass);
       this.IsCapitalsFromGroup(pass);
       this.IsDigitsFromGroup(pass);
       this.IsSpecialFromGroup(pass);
       this.countGoups();
       if ( (this.usingGroups == 2) || (this.usingGroups == 4) )
       {
    	   new_strength = new_strength + 8;			
       }
       if (this.usingGroups == 3)
       {
    	   new_strength = new_strength + 10;
       }				
       new_strength = new_strength * this.usingGroups;
       if (pass.length <= 0) 
       {
    	   new_strength = 0;
       }
       if ( (pass.length > 0) && (new_strength < 1) )
       {
    	   new_strength = 1;
       }
       if ( (new_strength > 1) && (new_strength <= 15) )
       {
    	   new_strength = 1;				
       }
       if ( (new_strength > 15) && (new_strength <= 35) )
       {
    	   new_strength = 2;
       }
       if ( (new_strength > 35) && (new_strength <= 45) )
       {
    	   new_strength = 3;
       }
       if  (new_strength > 45) 
       {
    	   new_strength = 4;
       }

       var fieldEl = Ext.get(this.clsHolder.getEl().findParent("div.password_strength_default_position"));
       fieldEl.removeClass( 'password_strength_img_'+ this.getPasswordStrength() );
       fieldEl.addClass( 'password_strength_img_'+ new_strength );                                     
       this.setPasswordStrength( new_strength );
    }      
});
Ext.reg( 'cp_passwordmeter', CP.WebUI.PasswordMeter );
