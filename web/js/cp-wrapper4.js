/**
 * Ext JS 4.0 Components - Use Ext4 to create new components
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */


// ~~~ @@ PANELS & CONTAINERS

/*
 * Panel
 */
Ext.define( 'CP.WebUI4.Panel',{     //class name
    extend: 'Ext.panel.Panel',      //the superclass been extended
    alias: 'widget.cp4_panel',       //xtype name, must start with the 'widget.' prefix
    bodyCls: 'webui4-panel-body',    //default value
    border: 0,                       
    bodyBorder: false,
    mixins: {   //add abilities to class
        //for example -
        //observable: 'Ext.util.Observable',
        //animate: 'Ext.util.Animate'
    },
     
    constructor: function( config ){ //class initialization
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    },
    
    initComponent: function(){
        this.callParent( arguments );
        //add code here if needed
        //usually add events or do any render stuff after calling to the superclass's initComponent
    }
});

Ext.define( 'CP.WebUI4.BoxComponent',{  
    extend: 'Ext.Component',      
    alias: 'widget.cp4_box',  
    initComponent: function() {
        Ext.apply(this, {
        });
        this.callParent( arguments ); //CP.WebUI.BoxComponent.superclass.initComponent.call(this);
    }
});


/*
 * Tab Panel
 */
Ext.define( 'CP.WebUI4.TabPanel',{  
    extend: 'Ext.tab.Panel',      
    alias: 'widget.cp4_tabpanel',
    componentCls: 'webui4-tabpanel',
    bodyCls: 'webui4-tabpanel-body',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Tree Panel
 */
Ext.define( 'CP.WebUI4.TreePanel',{  
    extend: 'Ext.tree.Panel',      
    alias: 'widget.cp4_treepanel',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Container Panel
 * Simple component rendered into a single div, or any other html tag
 * using the autoEl config.
 * Use this panel as a replacment to the cp_box component in Ext 3
 */
Ext.define( 'CP.WebUI4.Container',{  
    extend: 'Ext.container.Container',      
    alias: 'widget.cp4_container',
    border: 0,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Grid Panel
 * Please note that Ext 4 replaces Ext.ListView with the default Ext.grid.Panel so
 * they become the same
 */
Ext.define( 'CP.WebUI4.GridPanel',{  
    extend: 'Ext.grid.Panel',      
    alias: 'widget.cp4_grid',
    cls: 'webui4-grid',
    minHeight: 89,
    border: 0,
	margin: '0 0 15 0',
    bodyBorder: true,
    autoScroll: true,
    viewConfig: { 
        stripeRows: true
    },
    configGrid: true, //grid requires RW permission and valid token
    listeners: {
        //When in read only mode disable the possibility to select any row or double click it
        beforeitemmousedown: function( gridView, record, itemEl, index, event ){
            var g = this;
            var configGrid = (g ? g.configGrid : true);
            if( configGrid && CP.UI && (CP.UI.accessMode == 'ro' || CP.global.token < 1 
				|| (CP.UI.getMyObj()!=undefined && CP.UI.getMyObj().disabled_by_clustering==true))){
                return false;
            }
            else{
                return true;
            }
        },
        beforeitemdblclick: function( view, record, htmlElement, index, e, options ){
            var g = this;
            var configGrid = (g ? g.configGrid : true);
            if( configGrid && CP.UI && (CP.UI.accessMode == 'ro' || CP.global.token < 1 
				|| (CP.UI.getMyObj()!=undefined && CP.UI.getMyObj().disabled_by_clustering==true))){
                return false;
            }
            else{
                return true;
            }
        },
		afterlayout: function()
		{
            var height = this.height || 0;
            height = Ext.Array.max([height, this.minHeight]);
			if (this.getHeight() < height)
			{
				this.setHeight(height);
			}
        }
    },
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
    ,getSelCount        : function() {
        var g = this;
        if (g && g.getSelectionModel) {
            var sm = g.getSelectionModel();
            return ( (sm && sm.getCount) ? sm.getCount() : 0 );
        }
        return 0;
    }
});


/*
 * Form Panel
 */
Ext.define( 'CP.WebUI4.FormPanel',{  
    extend: 'Ext.form.Panel',      
    alias: 'widget.cp4_formpanel', 
    componentCls: 'webui4-formpanel',
    bodyCls: 'webui4-formpanel-body',
    border: 0,
    bodyBorder: false,
    listeners: {
    	actioncomplete : function(form, action, eOpts){
	    	if (action.type == 'load'){
	    		CP.util.clearFormInstanceDirtyFlag(form);
	    	}
    	}
    },
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Page with simple panel and no forms, only define unified margin using css.
 * For grids and pages that do not contains form fields
 */
Ext.define( 'CP.WebUI4.DataPanel',{     
    extend: 'CP.WebUI4.Container',      
    alias: 'widget.cp4_datapanel',      
    componentCls: 'webui4-datapanel',
    bodyCls: 'webui4-datapanel-body',
    margin: '0 24 24',
        
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 *  Page with simple form panel to contain form fields
 */
Ext.define( 'CP.WebUI4.DataFormPanel',{     
    extend: 'CP.WebUI4.FormPanel',      
    alias: 'widget.cp4_dataformpanel',      
    componentCls: 'webui4-datapanel',
    trackResetOnLoad: true,
    labelWidth: 100,
    margin: '0 24 24',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


//~~~ @@ GRID

/*
 * Display Field
 */
Ext.define( 'CP.WebUI4.CellEditing',{  
    extend: 'Ext.grid.plugin.CellEditing',      
    alias: 'widget.cp4_cellediting',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});
/*
 * slider Field
 */
Ext.define( 'CP.WebUI4.SliderField',{
    extend: 'Ext.slider.Single',
    alias: 'widget.cp4_sliderfield',
    msgTarget: 'side',
    labelWidth: 100,
    width: 200, //msgTarget side will gradually shrink a displayfield if no default width is supplied

    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});



//~~~ @@ FORM FIELDS

/*
 * Display Field
 */
Ext.define( 'CP.WebUI4.DisplayField',{  
    extend: 'Ext.form.field.Display',      
    alias: 'widget.cp4_displayfield', 
    msgTarget: 'side',
    labelWidth: 100,
    width: 200, //msgTarget side will gradually shrink a displayfield if no default width is supplied
		htmlEncode: false,
		
    constructor: function( config ){
    	config = Ext.apply({
    		isDirty : function(){
    			return false;
    		}
        }, config);
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Checkbox
 */
Ext.define( 'CP.WebUI4.Checkbox',{  
    extend: 'Ext.form.field.Checkbox',      
    alias: 'widget.cp4_checkbox',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * CheckboxModel
 */
Ext.define( 'CP.WebUI4.CheckboxModel',{
    extend: 'Ext.selection.CheckboxModel',
    alias: 'widget.cp4_checkboxmodel',

    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Radio
 */
Ext.define( 'CP.WebUI4.Radio',{  
    extend: 'Ext.form.field.Radio',      
    alias: 'widget.cp4_radio',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Radio Group
 */
Ext.define( 'CP.WebUI4.RadioGroup',{  
    extend: 'Ext.form.RadioGroup',      
    alias: 'widget.cp4_radiogroup',
	msgTarget: 'side',
    invalidCls: 'webui4-invalid',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    } //eof constructor
});


/*
 * ComboBox
 */
Ext.define( 'CP.WebUI4.ComboBox',{  
    extend: 'Ext.form.field.ComboBox',      
    alias: 'widget.cp4_combobox',
    queryMode: 'local',
    msgTarget: 'side',
    invalidCls: 'webui4-invalid',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        var baseId = config.id || ('cp4_combobox'+ Ext.id());
        config.id = baseId;
        config.name = config.name || (baseId +'_unique_name'); //so that IE7 doesn't render the drop down menu in a weird place
        this.callParent([config]);
    }
});

/*
 * ComboCheckBox
 * A combobox containing checkbox items for multiple choice.
 */
Ext.define( 'CP.WebUI4.ComboCheckBox',{  
    extend: 'CP.WebUI4.ComboBox',      
    alias: 'widget.cp4_combocheckbox',
    multiSelect: true,
    editable: false,
    listConfig: {
        baseCls: 'webui4-combocheck',
        itemCls: 'webui4-combocheck-item'
    },
    invalidCls: 'webui4-invalid',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Date Field
 */
Ext.define( 'CP.WebUI4.DateField',{  
    extend: 'Ext.form.field.Date',      
    alias: 'widget.cp4_datefield',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Fieldset
 * group sets of fields and add a title and a collapsiblle element
 * IMPORTANT: Don't use it as a container!
 */
Ext.define( 'CP.WebUI4.FieldSet',{  
    extend: 'Ext.form.FieldSet',      
    alias: 'widget.cp4_fieldset',
    cls: 'webui4-fieldset',
    margin: '24 0 10 0',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Label
 */
Ext.define( 'CP.WebUI4.Label',{  
    extend: 'Ext.form.Label',      
    alias: 'widget.cp4_label',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * HTML Editor field
 * generates a textarea field with a toolbar for rich editing (bold, colors, etc...)
 */
Ext.define( 'CP.WebUI4.HtmlEditor',{  
    extend: 'Ext.form.field.HtmlEditor',      
    alias: 'widget.cp4_htmleditor',
    setValue: function(value) { 
			return this.callParent([Ext.String.htmlEncode(value)]);
		},
		getValue: function() {
			return Ext.String.htmlDecode(this.callParent(arguments));
		},
		
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Text-Area
 */
Ext.define( 'CP.WebUI4.TextArea',{  
    extend: 'Ext.form.field.TextArea',      
    alias: 'widget.cp4_textarea',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Text Field
 */
Ext.define( 'CP.WebUI4.TextField',{  
    extend: 'Ext.form.field.Text',      
    alias: 'widget.cp4_textfield',
    msgTarget: 'side',
    invalidCls: 'webui4-invalid',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Password Field
 */
Ext.define( 'CP.WebUI4.Password',{  
    extend: 'CP.WebUI4.TextField',      
    alias: 'widget.cp4_password',
    fieldLabel: 'Password',
    inputType: 'password',
    vtype: 'password',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Hidden Field
 */
Ext.define( 'CP.WebUI4.Hidden',{  
    extend: 'Ext.form.field.Hidden',      
    alias: 'widget.cp4_hiddenfield',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Field Container
 * The CompositeField from Ext 3 was replaced by this one.
 * Display a group of fields in one row with a label using an 'hbox' layout as default
 */
Ext.define( 'CP.WebUI4.FieldContainer',{  
    extend: 'Ext.form.FieldContainer',      
    alias: 'widget.cp4_fieldcontainer',
    layout: 'hbox',
    msgTarget: 'side',
    combineErrors: true,
        
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Number Field
 */
Ext.define( 'CP.WebUI4.NumberField',{  
    extend: 'Ext.form.field.Number',      
    alias: 'widget.cp4_numberfield',
    msgTarget: 'side',
    invalidCls: 'webui4-invalid', //Ext adds '-field' at the end so look for 'webui4-invalid-field' in css file
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Positive Integer Field
 * User can enter any whole number grater than 0
 */
Ext.define( 'CP.WebUI4.PositiveInt',{  
    extend: 'CP.WebUI4.NumberField',      
    alias: 'widget.cp4_positiveint',
    msgTarget: 'side',
    invalidCls: 'webui4-invalid', //Ext adds '-field' at the end so look for 'webui4-invalid-field' in css file
    allowDecimals: false,
    minValue: 1, //prevents negative numbers
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Mask Length Field
 * Any integer between 1 and 32
 */
Ext.define( 'CP.WebUI4.MaskLength',{  
    extend: 'CP.WebUI4.PositiveInt',      
    alias: 'widget.cp4_masklength',
    minValue: 1,
    maxValue: 32,
    width: 25,
    maxLength: 2,
    enforceMaxLength: true,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config to apply user definitions
        this.callParent([config]);
		
		if (config){
			/* Add event handler function - if defined - to this component */
			this.changeValueEventHandler = config.changeValueEventHandler || null;
			
			/* Add an event with its event handler if defined by the component's user */
			if( this.changeValueEventHandler ){
				this.on({	change: { scope:this, fn:this.changeValueEventHandler }	});
			}
		}
		
    }

    ,getMaskLength: function() {
        //here so that the same function can be used for a subnet mask and this
        return this.getValue();
    }
});


/*
 * IPv6 Mask Length Field
 * Any integer between 1 and 128
 */
Ext.define( 'CP.WebUI4.V6MaskLength',{  
    extend: 'CP.WebUI4.MaskLength',      
    alias: 'widget.cp4_v6masklength',
    maxValue: 128,
    width: 30,
    maxLength: 3,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Time control ---
 * has 1 textfield for the hours and 1 textfield for minutes - for manual input
 * and AM:PM selection.
 * */
Ext.define( 'CP.WebUI4.TimeBox',{
    extend: 'CP.WebUI4.FieldContainer',      
    alias: 'widget.cp4_timebox',
    id: 'webui_timebox_'+ Ext.id(),
    cls: 'webui-time-box field-body',
    fieldLabel: 'Time',
	layoutConfig:
	{
		pack: 'center',
		align: 'middle'
    },
 
    constructor: function( config ){
        //set component displat according to the selected format:
        var hoursVType = 'hours24';
        var ampmBoxIsHidden = true;        
        if( CP.global.formatTime == '12-hour' ){
            hoursVType = 'hours12';
            this.width = 200;
            ampmBoxIsHidden = false;
        }
        
        //define fields:
        this.hours = Ext.create( 'CP.WebUI4.TextField',{
            vtype: hoursVType
       //     , invalidCls: ''
			, msgTarget: "none"
            , value: 10
			, enforceMaxLength: true
            , maxLength: 2
            , width: 24
        });
        
        this.minutes = Ext.create( 'CP.WebUI4.TextField',{
            vtype: 'minutes'
        //    , invalidCls: ''
			, msgTarget: "none"
            , value: 30
			, enforceMaxLength: true
            , maxLength: 2
            , width: 24
        });
        
        this.ampm = Ext.create( 'CP.WebUI4.ComboBox',{
            displayField: 'key',
            valueField : 'value',
            store: Ext.create( 'CP.WebUI4.ArrayStore',{
                fields: ['key','value'],
                data: [['AM', 'AM'],['PM', 'PM']]
            }),
            value: 'AM',
//            , forceSelection: true
            editable: false,
            hidden: ampmBoxIsHidden,
            width:50,
            padding: '0 0 0 3'
        });
        
        //main panel
        this.items = [ 
            this.hours,
            { 
                //seperator :
                xtype: 'cp4_displayfield',
                width: 7,
                height: 20,
                value: ':',
				margin: '0 0 0 2'
            }, 
            this.minutes,
            this.ampm 
        ]; //eof items
        
        //add items to the config object
        Ext.apply( this, config );
        
        this.callParent([config]);
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
    },
	
	validate: function(){
		return (this.hours.validate() && this.minutes.validate());
    }
});


/*
 * Dual List
 * Generate double list control with mover buttons from left list to right list and vise versa
 * Example: 
 * {
        xtype: 'cp4_duallist',
        id: 'my_duallist',
        //left
        leftListStore: Ext.create( 'CP.WebUI4.JsonStore',{
             fields: [ 'name' ],
             data: [{id:'user4', name:'User 4'}]
         }),
        leftListCol: [{
            text: 'Available Users',
            dataIndex: 'name'
        }],
        //right
        rightListStore: rightStore,
        rightListCol: [{
            text: 'Users with Role',
            dataIndex: 'name'
        }]
   }
 */  
Ext.define( 'CP.WebUI4.DualList',{  
    extend: 'CP.WebUI4.Panel',      
    alias: 'widget.cp4_duallist',
    id: 'webui_duallist_'+ Ext.id(),
    layout: 'hbox',
    width: 500,
    
    constructor: function( config ){
        //set properties by user definintions or, if none, apply defaults
        this.initProperties( config );
        
        //get dual list id to pass to handler
        var dualListId = ( config && config.id ) ? config.id : this.id; 
        
        var add_margin_top =  this.listHeight/3 - 10;
        var add_margin_bottom =  10;
        var remove_add_margin_zero =  0;       
        
        var add_margin_string = new String(add_margin_top) + ' ' +  new String(remove_add_margin_zero) + ' ' +  new String(add_margin_bottom) + ' ' + new String(remove_add_margin_zero); 
        var remove_margin_string = new String(remove_add_margin_zero) + ' ' +  new String(remove_add_margin_zero) + ' ' +  new String(remove_add_margin_zero) + ' ' + new String(remove_add_margin_zero);
        
        //define items structure
        this.items = [ 
            this.leftList,           
        { 
            //Middle column - buttons
            xtype: 'cp4_panel',           
            flex:0,
            width: 72,
            height: this.listHeight, 
            margin: 10,
            defaults :{
               xtype: 'cp4_button',
               minWidth: 72                
            },
            items: [{
                id: (dualListId + '_addBtn'),
                text: 'Add >',                
                width: 72,
                margin: add_margin_string,
                handler: Ext.Function.bind( this.AddOrRemoveRowsByButtonClick, this, [true, dualListId]) 
            },{
                id: (dualListId + '_removeBtn'),
                text: '< Remove',               
                margin: remove_margin_string,
                width: 72,
                handler: Ext.Function.bind( this.AddOrRemoveRowsByButtonClick, this, [false, dualListId])
            }]
        },
            this.rightList 
        ]; //eof items
        
        //add items to the config object
        Ext.apply( this, config );
        
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }, //eof constructor
    
    //set properties by user definintions (passed using config) or, if none, apply defaults
    initProperties:function( config ){
        //left list:
        this.leftListStore = null;
        this.leftListCol = null;
        //right list:
        this.rightListStore = null;
        this.rightListCol = null;
        this.listHeight = 288;
        
        //override with config
        if( config ){
            this.leftListStore = config.leftListStore || this.leftListStore;
            this.leftListCol = config.leftListCol || this.leftListCol;
            this.rightListStore = config.rightListStore || this.rightListStore;
            this.rightListCol = config.rightListCol || this.rightListCol;
            this.listHeight = config.listHeight || this.listHeight;
        }
        
        //left list
        this.leftList = Ext.create( 'CP.WebUI4.GridPanel',{
            store: this.leftListStore,
            flex: 1,
            height: this.listHeight,
            columnLines: true,
            multiSelect: true,
            autoScroll: true,
            columns: {
                defaults: { flex: 1 },
                items: this.leftListCol
            },
            viewConfig: {
                stripeRows: true
            },
            listeners: {
                itemdblclick: {                                                              
                    scope: this,                                                  
                    fn: function( leftList, index, node, e ){
                        var rightList = this.rightList;                                                         
                        rightList.getStore().add( leftList.getRecord( node ));                                                        
                        leftList.getStore().remove( leftList.getRecord( node ));
                    }
                }
            }
        });
        
        //right list
        this.rightList = Ext.create( 'CP.WebUI4.GridPanel',{
            store: this.rightListStore,
            flex: 1,
            height: this.listHeight,
            columnLines: true,
            multiSelect: true,
            autoScroll: true,
            columns: {
                defaults: { flex: 1 },
                items: this.rightListCol
            },
            viewConfig: {
                stripeRows: true
            },
            listeners: {
                itemdblclick: {                                                              
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
		
	//use this function if scrollbars are missing.	
 	RedoComponentLayout : function ()
	{
		this.leftList.doComponentLayout();
		this.rightList.doComponentLayout();
	},   
	
    //move items from left list to right list and vise versa
    AddOrRemoveRowsByButtonClick: function( addRows, dualListId ){  
         var dualListCmp = Ext.getCmp( dualListId );
         var leftList = dualListCmp.leftList;
         var leftListStore = leftList.getStore();
         var rightList = dualListCmp.rightList;
         var rightListStore = rightList.getStore();
         var leftSelRecords = leftList.getSelectionModel().getSelection();
         var rightSelRecords = rightList.getSelectionModel().getSelection();
         
         //move items from left to right
         if( addRows ){
             if( leftSelRecords.length > 0 ){      
                 rightListStore.add( leftSelRecords );
                 leftListStore.remove( leftSelRecords );
             }
         }
         //move items from right to left
         else if( rightSelRecords.length > 0 ){  
             leftListStore.add( rightSelRecords );
             rightListStore.remove( rightSelRecords );
         }
    },

    // costum disable and enable functions (uasabilty as in other components - see sencha docs)
    disable: function(silent){
        // disable buttons
        Ext.getCmp(this.id + '_addBtn').disable(silent);
        Ext.getCmp(this.id + '_removeBtn').disable(silent);
        // lock selection in lists
        this.leftList.getSelectionModel().setLocked(true);
        this.rightList.getSelectionModel().setLocked(true);
        // disable firing events
        this.leftList.suspendEvents();
        this.rightList.suspendEvents();
    },
    
    enable: function(silent){
        // enable buttons
        Ext.getCmp(this.id + '_addBtn').enable(silent);
        Ext.getCmp(this.id + '_removeBtn').enable(silent);
        // unlock selection in lists
        this.leftList.getSelectionModel().setLocked(false);
        this.rightList.getSelectionModel().setLocked(false);
        // enable firing events
        this.leftList.resumeEvents();
        this.rightList.resumeEvents();
    }
});


//~~~ @@ BUTTONS, TOOLBARS & MENUS

/*
 * Simple button
 */
Ext.define( 'CP.WebUI4.Button',{  
    extend: 'Ext.button.Button',      
    alias: 'widget.cp4_button', 
    cls: 'webui4-button',
    disabledCls: 'webui4-button-disabled',
    minWidth: 60,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }

    //optional default enable/disable criteria
    // pre-existing pages do not need to be changed to function, just to take advantage
    // declare as "false" in the component definition to use
    ,overrideNoToken: true
    ,handle_no_token: function() {
        var b = this;
        var d = CP.ar_util.checkBlockActivity(false); //check token value and look for readonly
        d = d || b.disabledConditions();
        if (b && b.disabled != d) { b.setDisabled(d); }
        return (!d);
    }
    ,disabledConditions: function() {
        //overwrite to supply additional unique criteria for a disabled button
        //for example, grid.getSelectionModel().getCount() != 1 (for edit)
        return false;
    }
    ,handler: function(b, e) {
        //existing pages that have a defined handler function don't utilize this feature
        if ( b.overrideNoToken || b.handle_no_token() ) {
            b.handler2(b, e);
        }
    }
    ,handler2: function(b, e) {
        //overwrite this in the component definition to utilize
    }
    // Easy conversion to use new feature
    // 1.  Change "handler:" to "handler2:"
    // 2.  Add "overrideNoToken: false" to obj
    // 3.  (optional) define "disabledConditions: function()" for extra cases
    //          where the button should be disabled
    //          e.g. number of rows selected in a grid (below is example of disabled when 0 or 2+ selections
    //
    //          disabledConditions: function() {
    //              var g = Ext.getCmp( gridId );
    //              if (g) {
    //                  var sm = g.getSelectionModel();
    //                  return (sm ? sm.getCount() != 1 : true);
    //              }
    //              return true; //if the grid doesn't exist, disable the button anyway
    //          }
});


/*
 * MessageBar
 */
Ext.define( 'Ext.MessageBar',{
    extend: 'CP.WebUI4.Panel',
    alias: 'widget.cp4_message_bar',
    anchor: '100%',
    cls: 'webui4-bar',
    frameHeader: false
});

/*
 * buttons bar
 */
Ext.define( 'CP.WebUI4.BtnsBar',{  
    extend: 'CP.WebUI4.Panel',      
    alias: 'widget.cp4_btnsbar', 
    cls: 'webui-bbar',
//    layout: {
//        type: 'hbox',       // Arrange child items horizontally
//        align: 'stretch',   // Each takes up full width
//        pack: 'start'
//    },
    defaults:{ 
        xtype: 'cp4_button', 
        margin: '0 8 0 0',
        minWidth: 60
    },
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
    //activate handle_no_token check on all child buttons that don't override (default is to override)
    ,chkBtns: function() {
        var btnsbar = this;
        var arr = Ext.ComponentQuery.query("cp4_button", btnsbar);
        var i, el;
        for(i = 0; el = arr[i]; i++) {
            if ( !(el.overrideNoToken) && el.handle_no_token ) {
                el.handle_no_token();
            }
        }
    }
});


/*
 * Toolbar
 */
Ext.define( 'CP.WebUI4.Toolbar',{  
    extend: 'Ext.toolbar.Toolbar',      
    alias: 'widget.cp4_toolbar',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Menu
 */
Ext.define( 'CP.WebUI4.Menu',{  
    extend: 'Ext.menu.Menu',      
    alias: 'widget.cp4_menu',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Button menu with no constrain
 */
Ext.define( 'CP.WebUI4.ButtonMenu',{  
    extend: 'CP.WebUI4.Menu',      
    alias: 'widget.cp4_btnmenu',
    bodyCls: 'webui4-btnmenu-body',
    defaultType: 'cp4_button',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});

Ext.define( 'CP.WebUI4.Image',{     //class name
    extend: 'Ext.panel.Panel',      //the superclass been extended
    alias: 'widget.cp4_Image', //xtype name, must start with the 'widget.' prefix
    frame: false
	, header: false
    , border: false
    , isHidden: function() { return (this.hidden); }
	, maskDisabled: false
});

//~~~ @@ IP FIELDS

/*
 * IPv6 Text Field
 */
Ext.define( 'CP.WebUI4.IPv6Field',{  
    extend: 'CP.WebUI4.TextField',      
    alias: 'widget.cp4_ipv6field',
    vtype: 'ipv6',
    width: 350,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * IPv6 Text Field with extended validation
 */
Ext.define( 'CP.WebUI4.IPv6ExField',{
    extend: 'CP.WebUI4.TextField',
    alias: 'widget.cp4_ipv6field_ex',
    width: 350,

    constructor: function( config ) {
        if( config ) {
            this.rejectZero = config.rejectZero || false;
            this.rejectLoopback = config.rejectLoopback || false;
            this.rejectMulticast = config.rejectMulticast || false;
            this.rejectLinkLocal = config.rejectLinkLocal || false;
            this.requireLinkLocal = config.requireLinkLocal || false;
            this.extraValidation = config.extraValidation || null;
        }

        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
    ,validator          : function(ip6) {
        var msg = true;
        if (ip6 && ip6 != "") {
            msg = CP.util.isValidIPv6Ex(
                    ip6,
                    !this.allowBlank,
                    this.rejectZero,
                    this.rejectLoopback,
                    this.rejectMulticast,
                    this.rejectLinkLocal,
                    this.requireLinkLocal);


            if (msg == true) {
                if (this.extraValidation) {
                    msg = this.extraValidation(ip6);
                }
            }
        }

        /*
         * Return value should be boolean true, or a string 
         * containing an error message 
         */
        return msg;
    }
});

/*
 * Hidden field to hold IP address as a string, as created
 * from concantenation of the individual octet fields
 */
Ext.define( 'CP.WebUI4.HiddenIPAddressField', {
	extend: 'CP.WebUI4.TextField',
        hidden:true,
        getErrors : function(value) {
            var ipv4cmp = this.ownerCt;
            if (ipv4cmp) {
                var msg = CP.util.isValidIPv4Ex(
                    value, 
                    ipv4cmp.entityName,
                    !ipv4cmp.allowBlank, 
                    ipv4cmp.rejectZeroFirstOctet,
                    ipv4cmp.rejectLoopback,
                    ipv4cmp.rejectMulticast, 
                    ipv4cmp.rejectGlobalBroadcast);

                if (msg == true && this.extraValidation) {
                    msg = this.extraValidation(value);
                }

                if (msg != true) {
                    return [msg];
                }
            }

            return [];
        }
});

/*
 *
 * Basic IP field with 4 octets and 3 dots, imitates the ipv4 controler in windows.
 */
Ext.define( 'CP.WebUI4.IPv4Field',{  
	extend: 'CP.WebUI4.FieldContainer',      
	alias: 'widget.cp4_ipv4field',
	componentCls: 'webui4-ipfield',
	id: 'webui_ipv4field_'+ Ext.id(), 
	fieldLabel: 'IPv4 Address',
	invalidCls: 'webui4-ipfield-invalid',
	height: 22,
	keyupCallback : null,
	
	//do not remove validate or clearInvalid, they are used extensively in the Advanced Routing pages.
	validate: function() {
		//allows the ipv4field to have ".validate()" called on it
		var i;
		var valid = true;
		for(i = 0; i < 4; i++) {
			if( this.octets[i] && this.octets[i].validate ) {
			    valid = this.octets[i].validate() && valid;
			} else {
			    valid = false;
			}
		}
		if(this.isDisabled()) { return true; }
		return valid;
	},
	clearInvalid: function() {
		var i;
		for(i = 0; i < 4; i++) {
			if(this.octets[i]) {
				if(this.octets[i].clearInvalid) {
					this.octets[i].clearInvalid();
				}
			}
		}
		return;
	},
	getMaskLength: function() {
		//returns the minimum masklength of this 32 bit number
		var i;
		var j;
		var k;
		for(i = 3; i >= 0; i--) {
			k = 1;
			for(j = 8; j > 0; j--) {
				if(this.octets[i].getValue() & k) {
					return (8 * i) + j;
				}
				k = k * 2;
			}
		}
		return 0;
	},

	constructor: function( config ){
		//set properties by user definintions or, if none, apply defaults
		if (!config.width)
			config.width = 235;

		var baseId = config.id || Ext.id();
		var hiddenName = '';
		var hiddenId = 'webui_ipv4field_hidden_'+ baseId;
		var allowBlank = false;
		var disabled = false;
		this.hasFocus = true; /* changed only here and in the focus and blur events*/

		if( config ){
			hiddenName = config.fieldName || hiddenName;
			/* Add event handlers if supplied by the component's user */
			this.keypressEvent = config.keypressEvent || null;
			this.changeValueEventHandler = config.changeValueEventHandler || null;
			if( config.fieldConfig ){
				var fieldConfig = config.fieldConfig;
				allowBlank = fieldConfig.allowBlank || allowBlank;
				disabled = fieldConfig.disabled || disabled;
			}
			this.keyupCallback = config.keyupCallback || null;
		}
		
		/* 
			A function to validate each of the octets in an ipv4 field .
			The function must return either "true" or an error string in case of an error.
			Only the octet responsible for causing the error must return the string in order to avoid duplicities.
			This validation function is responsible only for handling the conbination of:
				1. Cases of missing fields
				2. Cases where (allowBlank == true)
			The  'this.ownerCt.hasFocus'  property was added in order to avoid displaying an error while the user
			is writing an address. It is changed during the 'ipv4field' (!) blur and focus events.
			
			IMPORTANT: In order to avoid duplicities the convention is that in case there is an error of an empty field
						it is to be returned through the first empty octet from the left (result of firstEmptyOctetID).
						This convention exists so that all octets will agree on the error handling algorithm.
			
		*/

		function validateOctet(){
			/* Returns the first empty octet (1,2,3 or 4) or undefined*/
			function firstEmptyOctetID(cmp){
					for(var i=0; i<4; i++){
						if (cmp.octets[i].value == null) {
							return (i+1); 
						}
					}
			}
			/* returns true - when some octets are empty but not the last ones or all*/
			function hasEmptyNonePrefixOctets(cmp){ 
				var isPrefix = true;
				for(var i=0; i<4; i++){
					if (cmp.octets[i].value == null) {
						isPrefix = false;
					} else {
						if (isPrefix == false){
							return true;  //true
						}
					}
				}
				return false;
			}
			
			function allEmptyOctets(cmp){
				for(var i=0; i<4; i++){
					if (cmp.octets[i].value != null) {
						return false;
					}
				}
				return true;
			}
			/*	Set Variables	*/
			var errMsg = "Missing fields";
			var ipv4cmp = this.ownerCt;
			var thisOctet = this;
			var firstEmptyID = firstEmptyOctetID(ipv4cmp);
			/*	Main Starts Here	*/
			if (ipv4cmp.octets[0].allowBlank == true ){ // handling (allowBlank==true) cases. we check octets[0] because they all have the same allowBlank. 
				if (!this.ownerCt.hasFocus && !allEmptyOctets(ipv4cmp)){ /*validate in case we don't have focus - different behaviour for a empty suffix*/
					if (thisOctet.itemId == firstEmptyID) {
						return errMsg; /* This octet is the first empty octet so it is the one to return the error*/
					}
					else { /* This octet is not the first empty octet so it is not the one to return the error*/
						/* call the validate function of the octet responsible of returning the error */
						if (firstEmptyID) ipv4cmp.octets[firstEmptyID-1].validate()
						return true;
					}
				}
				/* We either have focus or all fields are empty (which is allowed since (ipv4cmp.octets[0].allowBlank == true ) )*/
				if (hasEmptyNonePrefixOctets(ipv4cmp) && !allEmptyOctets(ipv4cmp) && (thisOctet.itemId == firstEmptyOctetID(ipv4cmp)) ){
					/* This octet is the first empty octet so it is the one to return the error */
					return errMsg;
				} else {
				        return true;
				}
			}
			return true; //the validate function exists only to handle the allowBlank property - return true otherwise
		} 

        if (!this.hasOwnProperty("octets")) {
		    //create the octet fields (for display only)
		    this.octets = [];
		    if( config && config.octetsConfig ){ // Use input  'config.octetsConfig'  definition given by the user to the C'tor.
			    var octetsConfig = config.octetsConfig;
			    this.octets[0] = this.getOctetField( Ext.apply( octetsConfig[0], { id:'octet1_'+ baseId, itemId:1, fieldId:'octet1_'+ baseId, order:'first', allowBlank:allowBlank, disabledCls: '', disabled:disabled, cls2:'isfirst' }));
			    this.octets[1] = this.getOctetField( Ext.apply( octetsConfig[1], { id:'octet2_'+ baseId, itemId:2, fieldId:'octet2_'+ baseId, order:'second',allowBlank:allowBlank, disabledCls: '', disabled:disabled }));
			    this.octets[2] = this.getOctetField( Ext.apply( octetsConfig[2], { id:'octet3_'+ baseId, itemId:3, fieldId:'octet3_'+ baseId, order:'third',allowBlank:allowBlank, disabledCls: '', disabled:disabled }));
			    this.octets[3] = this.getOctetField( Ext.apply( octetsConfig[3], { id:'octet4_'+ baseId, itemId:4, fieldId:'octet4_'+ baseId, order:'fourth',allowBlank:allowBlank, disabledCls: '', disabled:disabled, cls2:'islast' }));
		    }
		    else{ // Default definition for the  'cp4_ipv4field'  octets
			    this.octets[0] = this.getOctetField({ id:'octet1_'+ baseId, itemId:1, fieldId:'octet1_'+ baseId, minValue:1, maxValue: 255, validator: this.validateOctet, order:'first', allowBlank:allowBlank, disabledCls: '', disabled:disabled, cls2:'isfirst' });
			    this.octets[1] = this.getOctetField({ id:'octet2_'+ baseId, itemId:2, fieldId:'octet2_'+ baseId, minValue:0, maxValue: 255, validator: this.validateOctet, order:'second', allowBlank:allowBlank, disabledCls: '', disabled:disabled });
			    this.octets[2] = this.getOctetField({ id:'octet3_'+ baseId, itemId:3, fieldId:'octet3_'+ baseId, minValue:0, maxValue: 255, validator: this.validateOctet, order:'third', allowBlank:allowBlank, disabledCls: '', disabled:disabled });
			    this.octets[3] = this.getOctetField({ id:'octet4_'+ baseId, itemId:4, fieldId:'octet4_'+ baseId, minValue:0, maxValue: 255, validator: this.validateOctet, order:'fourth', allowBlank:allowBlank, disabledCls: '', disabled:disabled, cls2:'islast' });
		    }
        }
	   
        if (!this.hasOwnProperty("hiddenField")) {
		    //create hidden field (hold and bind the true value of field to be send to server)
		    this.hiddenField = Ext.create( 'CP.WebUI4.Hidden',{ 
			    id: hiddenId,
			    name: hiddenName,
			    value:""
		    });
        }
		
		//build items
		this.items = [ 
			this.octets[0],
			this.getOctetSeperator(),
			this.octets[1],
			this.getOctetSeperator(),
			this.octets[2],
			this.getOctetSeperator(),
			this.octets[3],
			this.hiddenField 
		];
		
		//call the superclass's constructor and pass config
		//to apply user definitions
		this.callParent([config]);
	}, //eof constructor
	
	//build dot separator
	getOctetSeperator: function(){
		return Ext.create( 'CP.WebUI4.DisplayField',{
			value: '.',
			cls: 'octet-sep',
			width: 3
		});
	},
	
	//build octet field
	getOctetField: function( config ){
		//set field configuration
		var fieldConfig = Ext.apply( config,{ 
			cls: 'octet-field '+ ( config.cls2 || ''),
			msgTarget: 'qtip',
			invalidCls: 'webui4-octet-invalid-field',
			minText: ((config.minValue) ? 'The minimum value for '+ config.order +' octet is {0}'  :  null),
			maxText: ((config.maxValue) ? 'The maximum value for '+ config.order +' octet is {0}'  :  null),
			blankText: 'The '+ config.order +' octet field is required',
			submitValue: false,
			allowDecimals: false,
			hideTrigger: true, //hide the spinner buttons
			hideLabel: true,
			enableKeyEvents: true,
			enforceMaxLength: true,
			maxLength: 3,
			width: 25,
			height: 22,
			minValue: config.minValue,
			maxValue: config.maxValue,
			listeners: {
				blur:	{scope:this, 
						fn:function(){	
							this.hasFocus = false;
							for (var i=0; i<4; i++) {this.octets[i].validate();}
						}
				},
				focus:	{scope:this, 
						fn:function(){	
							this.hasFocus = true;
						}
				},
				keydown: { scope:this, fn:this.onOctetKeydown },
				keyup:   { scope:this, fn:this.onOctetKeyup }
			}
		});
		
		//create octet field
		var newOctet = Ext.create( 'CP.WebUI4.NumberField', fieldConfig );
				
		/* Add events with their event handlers - if defined by the component's user - to this octet's event list */
		if( this.keypressEvent ){
			newOctet.on({	keypress:{ scope:this, fn:this.keypressEvent }	});
		}
		if( this.changeValueEventHandler ){
			newOctet.on({	change: { scope:this, fn:this.changeValueEventHandler }	});
		}
		
		return newOctet;
	},

	//add setValue method to field-container 
	//in order to copy value to the hidden field and all the octets
	setValue: function( value ){
		//copy value to octets
		if( value != "" && ( !value || typeof(value) != 'string' ) ) {
			// when value == "" it is considered invalid
			return;
		}
		//save in hidden
		this.hiddenField.setValue( value );
		//display in octets
		var octet = value.split( '.' );
		var i,o;
		for (i = 0; i < 4; i++) {
			//safe way to set the value
			o = (octet && octet.length > i) ? octet[i] : "";
			this.octets[i].setValue(o);
		}
	},
	
	//add getValue method
	getValue: function(){
		return this.hiddenField.getValue();
	},
	ip2long :function(){    	
		with(Math){
			var i;
			var num = 0 ;
			for(i=3;  i >= 0; i--)
			{	
				num += ((parseInt(this.octets[i].value) % 256) * pow(256, (3 - i)));
			}	
		}    
		return(num);
	},
	claculateSubnet: function(value){
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
		 var subnet_bytes = this.getValue().split('.');
			subnet_bytes[0] = cidrToDecOctet( value );
			subnet_bytes[1] = cidrToDecOctet( value - 8 );
			subnet_bytes[2] = cidrToDecOctet( value - 8 * 2 );
			subnet_bytes[3] = cidrToDecOctet( value - 8 * 3 );
			
			return subnet_bytes[0] +'.'+
					subnet_bytes[1] +'.'+
					subnet_bytes[2] +'.'+
					subnet_bytes[3];
	},
	findNetworkIP : function(value){
		var myip_bytes = this.getValue().split('.');
		var subnet_bytes = "";
		if( value.indexOf('.') == -1 ){
			subnet_bytes = this.getValue().split('.');
			//convert to dotteted and apply to subnet:
			subnet_bytes = this.claculateSubnet(value);
		} else {
			subnet_bytes = value.split('.');
		}
		subnet_bytes = subnet_bytes.split('.');
		var netIpStr = this.getValue().split('.');
		for(var i=0;  i<=3 ; i++){	
			netIpStr[i] = (parseInt(myip_bytes[i]) & 0xff)&(subnet_bytes[i] & 0xff);
		} 
		return netIpStr[0] +'.'+
				netIpStr[1] +'.'+
				netIpStr[2] +'.'+
				netIpStr[3];    
	},
	isIpInNetwork : function(networkIp, networkMaskIP){
		if(this.isInSubnet( networkIp, networkMaskIP)){
			 return true;
		}
		else{
			 return false;
		}
	 },
	 isInSubnet : function(networkIp_field, networkMaskIP){
		 var myip_bytes = this.getValue().split('.');
		 var dotted_subnet = networkMaskIP.split('.');
		 var netIpStr = this.getValue().split('.');
		 for(var i=0;  i<=3 ; i++){	
			netIpStr[i] = (parseInt(myip_bytes[i]) & 0xff)&(dotted_subnet[i] & 0xff);
		}  
		netIpStr = netIpStr[0] +'.'+
					netIpStr[1] +'.'+
					netIpStr[2] +'.'+
					netIpStr[3];
		 if (networkIp_field == netIpStr) { 
				 return true;
		 }
		 else{
				 return false;
		 }
	},
	//add getValue method
	getValueFromOctets: function(){
		var octetArr = this.octets;
		var octet1Val = octetArr[0].getValue();
		var octet2Val = octetArr[1].getValue();
		var octet3Val = octetArr[2].getValue();
		var octet4Val = octetArr[3].getValue();
		
		octet1Val = ( octet1Val == null ) ? '' : octet1Val;
		octet2Val = ( octet2Val == null ) ? '' : octet2Val;
		octet3Val = ( octet3Val == null ) ? '' : octet3Val;
		octet4Val = ( octet4Val == null ) ? '' : octet4Val;
		
		if( octet1Val.length == 0 &&
			octet2Val.length == 0 && 
			octet3Val.length == 0 &&
			octet4Val.length == 0 ){
			return ''; //all octets are empty
		}
		
		return octet1Val +'.'+
			   octet2Val +'.'+
			   octet3Val +'.'+
			   octet4Val;
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
		var caretPos = this.getCaretPos( field.inputEl.dom );
		//previous octet - skip the dot separator
		var prevOctet = field.previousSibling();
			prevOctet = ( prevOctet ) ? prevOctet.previousSibling() : null;
		//next octet - skip the dot separator
		var nextOctet = field.nextSibling();
			nextOctet = ( nextOctet ) ? nextOctet.nextSibling() : null;
			
		//tab - when pressed move to next element on page like in ip field of windows
		if( keyCode == e.TAB  ){
			if( e.shiftKey ){
				var prevOctet = field.previousSibling();
				var last = field;
				while( prevOctet ){
					last = prevOctet;
					prevOctet = prevOctet.previousSibling();
				}
				last.focus();
			} else{
				var nextOctet = field.nextSibling().nextSibling();
				var last = field;
				while( nextOctet ){
					last = nextOctet;
					nextOctet = nextOctet.nextSibling().nextSibling();
				}
				last.focus();
			}
		}
		
		//backspace
		else if( caretPos == 0 && prevOctet && keyCode == e.BACKSPACE ){
			var prevOctetDomEl = prevOctet.inputEl.dom;
			var valLength = prevOctetDomEl.value.length;
			this.setCaretPos( prevOctetDomEl, valLength, valLength );
		}
	},
	
	onOctetKeyup: function( field, e ){
		var keyCode = e.getKey();
		var caretPos = this.getCaretPos( field.inputEl.dom );
		var fieldValLength = field.inputEl.dom.value.length;
		//previous octet - skip the dot separator
		var prevOctet = field.previousSibling();
			prevOctet = ( prevOctet ) ? prevOctet.previousSibling() : null;
		//next octet - skip the dot separator
		var nextOctet = field.nextSibling();
			nextOctet = ( nextOctet ) ? nextOctet.nextSibling() : null;
		   
		if( keyCode == e.TAB ){
			var prevOctet = field.previousSibling();
			var last = field;
			while( prevOctet ){
				last = prevOctet;
				prevOctet = prevOctet.previousSibling();
			}
			last.focus(true);
		}       
		
		//left arrow
		else if( caretPos == 0 && prevOctet && keyCode == e.LEFT ){
			var prevOctetDomEl = prevOctet.inputEl.dom;
			var valLength = prevOctetDomEl.value.length;
			this.setCaretPos( prevOctetDomEl, valLength, valLength );
		}
		
		//right arrow
		else if( caretPos == fieldValLength && nextOctet && keyCode == e.RIGHT ){
			this.setCaretPos( nextOctet.inputEl.dom, 0, 0 );
		}
		
		//period and space key should move to next octet and highlight it (like in windows)
		else if( fieldValLength > 0 && nextOctet &&
				( keyCode == e.NUM_PERIOD || keyCode == 190 || keyCode == e.SPACE)){
			nextOctet.focus(true);
		}
		
		//move to next octet when current octete is full and a key is pressed
		else if( caretPos == 3 && nextOctet && !e.isNavKeyPress() ){
			nextOctet.focus(true);
		}
		this.hiddenField.setValue( this.getValueFromOctets() ); //update field with changed value on key stroke
		

		if(this.keyupCallback != null)	{this.keyupCallback();}
		
	}
});


/*
 *
 * Basic IP field with 4 octets and 3 dots, imitates the ipv4 controler in windows.
 */
Ext.define( 'CP.WebUI4.IPv4ExField',{  
    extend: 'CP.WebUI4.IPv4Field',      
    alias: 'widget.cp4_ipv4field_ex',
    //do not remove validate or clearInvalid, they are used extensively in the Advanced Routing pages.
    validate: function() {
        if (this.isDisabled()) {
            return true; 
        }
        var valid = this.callParent(arguments);
        if (valid) {
            valid = this.hiddenField.validate();
        }
        return valid;
    },
    clearInvalid: function() {
        this.hiddenField.clearInvalid();
        return this.callParent(arguments);
    },
    constructor: function( config ){
		var baseId = config.id || Ext.id();
		var hiddenName = '';
		var hiddenId = 'webui_ipv4field_hidden_'+ baseId;
		var allowBlank = config.allowBlank || false;
        var disabled = config.disabled || false;

        config.customExtension = true;

        this.rejectZeroFirstOctet = true;
        this.entityName = "address";

        this.rejectGlobalBroadcast = config.rejectGlobalBroadcast || false;
        this.rejectMulticast = config.rejectMulticast || false;
        this.rejectLoopback = config.rejectLoopback || false;

        if (config.hasOwnProperty('rejectZero')) {
            this.rejectZeroFirstOctet = config.rejectZero;
        } 

        if (config.hasOwnProperty('entityName')) {
            this.entityName = config.entityName;
        }

        this.octets = [];
        this.octets[0] = this.getOctetField({ id:'octet1_'+ baseId, itemId:1, minValue:1, maxValue: 255, fieldId:'octet1_'+ baseId, order:'first',  disabledCls: '', disabled:disabled, cls2:'isfirst' });
        this.octets[1] = this.getOctetField({ id:'octet2_'+ baseId, itemId:2, minValue:0, maxValue: 255, fieldId:'octet2_'+ baseId, order:'second', disabledCls: '', disabled:disabled });
        this.octets[2] = this.getOctetField({ id:'octet3_'+ baseId, itemId:3, minValue:0, maxValue: 255, fieldId:'octet3_'+ baseId, order:'third',  disabledCls: '', disabled:disabled });
        this.octets[3] = this.getOctetField({ id:'octet4_'+ baseId, itemId:4, minValue:0, maxValue: 255, fieldId:'octet4_'+ baseId, order:'fourth', disabledCls: '', disabled:disabled, cls2:'islast' });

        //create hidden field (hold and bind the true value of field to be send to server)
        this.hiddenField = Ext.create( 'CP.WebUI4.HiddenIPAddressField',{ 
            id: hiddenId,
            name: hiddenName,
            value:"",
            extraValidation : config && config.extraValidation ? config.extraValidation : null
        });

        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    } //eof constructor
});

/*
 * IPv4 Address Notation
 */
Ext.define( 'CP.WebUI4.IPv4Notation',{  
	extend: 'CP.WebUI4.Container',      
	alias: 'widget.cp4_ipv4notation',
	networkMode: false,
	loopbackMode: false,

	setLoopbackMode : function(val) {
		this.loopbackMode = val;
	},

	//do not remove validate or clearInvalid, they are used extensively in the Advanced Routing pages.
	validate: function() {
		var valid = true;
		var ip_Id = this.ipId;
		var notation_Id = this.notationId;
		if(ip_Id && Ext.getCmp(ip_Id).validate) {
			valid = Ext.getCmp(ip_Id).validate() && valid;
		}
		if(notation_Id && Ext.getCmp(notation_Id).validate) {
			valid = Ext.getCmp(notation_Id).validate() && valid;
		}

		if(this.isDisabled()) { return true; }
		return valid;
	},
	clearInvalid: function() {
		var ip_Id = this.ipId;
		var notation_Id = this.notationId;
		if(ip_Id) {
			var ip = Ext.getCmp(ip_Id);
			if(ip && ip.clearInvalid) {
				ip.clearInvalid();
			}
		}
		if(notation_Id) {
			var note = Ext.getCmp(notation_Id);
			if(note && note.clearInvalid) {
				note.clearInvalid();
			}
		}
		return;
	},

	constructor: function( config ){ 
		//set properties by user definintions or, if none, apply defaults
		if( config ){
			this.ipId = config.ipId || '';
			this.ipName = config.ipName || '';
			this.ipLabel = config.ipLabel || 'IPv4 address';
			this.notationId = config.notationId || '';
			this.notationName = config.notationName || '';
			this.notationLabel = config.notationLabel || '';
			this.labelWidth = config.labelWidth || 100;
			this.width = config.width || 235;
			this.keypressEvent = config.keypressEvent || null;
			this.changeValueEventHandler = config.changeValueEventHandler || null;
			this.networkMode = config.networkMode || false;
			if( config.fieldConfig ){
				var fieldConfig = config.fieldConfig;
				this.fieldAllowBlank = fieldConfig.allowBlank || false;
				this.fieldDisabled = fieldConfig.disabled || false;
			}

		        if (config.hasOwnProperty('advancedValidation')) {
		            this.advancedValidation =
		                    config.advancedValidation === true ? true : false;
		        } else {
		            this.advancedValidation = false;
		        }

		        this.rejectGlobalBroadcast = config.rejectGlobalBroadcast || false;
		        this.rejectMulticast = config.rejectMulticast || false;
		        this.rejectLoopback = config.rejectLoopback || false;

		        if (config.hasOwnProperty('rejectZero')) {
		            this.rejectZeroFirstOctet = config.rejectZero;
		        } else {
		            this.rejectZeroFirstOctet = true;
		        }

		        if (config.hasOwnProperty('entityName')) {
		            this.entityName = config.entityName;
		        } else {
		            this.entityName = "address";
		        }

                        if (config.hasOwnProperty('extraValidation')) {
                            this.extraValidation = config.extraValidation;
                        } else {
                            this.extraValidation = null;
                        }
		}
	
		//get fields by notation format
		var ipNotationFormat = CP.global.formatNotation;
		if( ipNotationFormat == 'Length' ){ 
			this.items = this.addCidrNotation();
		}
		else if( ipNotationFormat == 'Dotted' ){
			this.items = this.addDottedNotation();
		}
	
		//call the superclass's constructor and pass config
		//to apply user definitions
		this.callParent([config]);
		
		//set and get value for dotted/cidr (convertor)
		if( ipNotationFormat == 'Dotted' ){ 
			this.manageNotationValue();
		}
	}, //eof constructor

	//CIDR notation
	addCidrNotation: function(){
                var ip_field;

                if (this.advancedValidation === true) {
                    ip_field = {
                        xtype: 'cp4_ipv4field_ex',
                        msgTarget: 'qtip',
                        id: this.ipId,
                        itemId: "ipId",
                        fieldName: this.ipName,
                        hideLabel: true,
                        keypressEvent: this.keypressEvent,
                        changeValueEventHandler: this.changeValueEventHandler,
                        width: 113,
                        rejectGlobalBroadcast : this.rejectGlobalBroadcast,
                        rejectMulticast       : this.rejectMulticast,
                        rejectLoopback        : this.rejectLoopback,
                        rejectZeroFirstOctet  : this.rejectZeroFirstOctet,
                        entityName            : this.entityName,
                        extraValidation       : this.extraValidation,

                        fieldConfig: {
                                allowBlank: this.fieldAllowBlank,
                                disabled: this.fieldDisabled
                        }
                    };
                } else {
                    ip_field = {
                        xtype: 'cp4_ipv4field',
                        msgTarget: 'qtip',
                        id: this.ipId,
                        itemId: "ipId",
                        fieldName: this.ipName,
                        hideLabel: true,
                        keypressEvent: this.keypressEvent,
                        changeValueEventHandler: this.changeValueEventHandler,
                        width: 113,
                        fieldConfig: {
                                allowBlank: this.fieldAllowBlank,
                                disabled: this.fieldDisabled
                        }
                    };
                }

		var notationLabel = this.notationLabel || 'Mask length';
		var enableKE = (this.keypressEvent == null) ? false : true;
		var items = [{
			fieldLabel: this.ipLabel +' &#47; '+ notationLabel,
			xtype: 'cp4_fieldcontainer',
			width: 310,
			labelWidth: 140,
			items: [
			  ip_field
			  ,{
				xtype: 'cp4_container',
				html: '&#47;',
				cls: 'octet-sep',
				width: 8,
				autoEl: { tag: 'div' }
			  },{
				xtype: 'cp4_masklength',
				msgTarget: 'qtip',
				minText: 'The minimum value for the mask field is 1',
				maxText: 'The maximum value for the mask field is 32',
				blankText: 'The mask field is required',
				hideTrigger: true, //hide the spinner buttons
				id: this.notationId,
				itemId: "notationId",
				name: this.notationName,
				allowBlank: this.fieldAllowBlank,
				disabled: this.fieldDisabled,
				enableKeyEvents: enableKE,
				keypressEvent: this.keypressEvent,
				changeValueEventHandler: this.changeValueEventHandler,
				width: 25,
				validator: function()
				{
					var maskLength = this.getValue();
					var minimalMaskOfAddress = Ext.getCmp(this.ownerCt.ownerCt.ipId).getMaskLength();
					var networkMode = Ext.getCmp(this.ownerCt.ownerCt.id).networkMode;
					var loopbackMode = Ext.getCmp(this.ownerCt.ownerCt.id).loopbackMode;
					if (!minimalMaskOfAddress || !maskLength)
					{
						return true;
					}
					
					if (networkMode == true && maskLength < minimalMaskOfAddress)
					{
						return "Invalid mask: for this network address, minimal mask is " + minimalMaskOfAddress;
					}
					else if (networkMode == false && maskLength >= minimalMaskOfAddress)
					{
						if (loopbackMode && maskLength == 32)
						{
							return true;
						}
						
						return "Invalid mask: for this IP address, mask length should be less than " + minimalMaskOfAddress;
					}

					return true;
				}
			}]
		}];
		return items;
	},
		
	//Dotted-decimal notation
	addDottedNotation: function(){
		var msgPrefix = 'The following values are allowed for the';
		var msgPostfix = 'octet: 128,192,224,240,248,252,254,255';
		
		var ip_field;
                if (this.advancedValidation === true) {
                    ip_field = {
                       xtype: 'cp4_ipv4field_ex',
                       id: this.ipId,
                       itemId: "ipId",
                       fieldName: this.ipName,
                       fieldLabel: this.ipLabel,
                       labelWidth:this.labelWidth,
                       width: this.width,
                       keypressEvent: this.keypressEvent,
                       changeValueEventHandler: this.changeValueEventHandler,
                       rejectGlobalBroadcast : this.rejectGlobalBroadcast,
                       rejectMulticast       : this.rejectMulticast,
                       rejectLoopback        : this.rejectLoopback,
                       rejectZeroFirstOctet  : this.rejectZeroFirstOctet,
                       entityName            : this.entityName,
                       extraValidation       : this.extraValidation,
                       fieldConfig: {
                               allowBlank: this.fieldAllowBlank,
                               disabled: this.fieldDisabled
                       }
                       ,keyupCallback : reValidate
                    };
                } else {
                    ip_field = {
                       xtype: 'cp4_ipv4field',
                       id: this.ipId,
                       itemId: "ipId",
                       fieldName: this.ipName,
                       fieldLabel: this.ipLabel,
                       labelWidth:this.labelWidth,
                       width: this.width,
                       keypressEvent: this.keypressEvent,
                       changeValueEventHandler: this.changeValueEventHandler,
                       fieldConfig: {
                               allowBlank: this.fieldAllowBlank,
                               disabled: this.fieldDisabled
                       }
                       ,keyupCallback : reValidate
                    };
                }
				
		function validateMaskDecOctet( value ){ 
			// Receives a string containing a dotted notation address / mask
			// Returns an integer representing the address / mask.
			function dottedToInt (dottedStr){
				var octetValsArr = dottedStr.split( '.' );
				// treat an empty field as if it doesn't exist but the rest do
				for (i=0; i<=3; i++){
					octetValsArr[i] = (octetValsArr[i] == "") ? "0" : octetValsArr[i];
				}
				var intIpAddr = parseInt( octetValsArr[0] * Math.pow(2,24))+
								  parseInt( octetValsArr[1] * Math.pow(2,16))+
								  parseInt( octetValsArr[2] * Math.pow(2,8))+
								  parseInt( octetValsArr[3] );
				return intIpAddr;
			};
			function buildMsg(octet){
				return (msgPrefix + " " + octet.order + " " + msgPostfix);
			}
			function isNotValidOctet(octet){
				var arr = new Array(0, 128, 192, 224, 240, 248, 252, 254, 255);
				var startIdx = (octet.order == "first") ? 1 : 0; 
				for (var k=startIdx; k < arr.length; k++){
					if (arr[k] == octet.value){return false;}
				}
				return true;
			}
			// Checks that all octets are valid mask octets.
			// This does not guaranty that the mask itself is valid
			function isValidOctets(octetArr){
				for (var t=0; t<=3; t++){
					if (isNotValidOctet(octetArr[t])){
						return (false);
					}
				}
				return true;
			}
			function hasErr(octet){
				if (octet.getActiveError() != "") {return true;}
				return false;
			}

			function errorsExist(octet, octetsArr, notationFieldCmp){
				if (octet.getActiveError() != "") {return true;}
				for (var i=0; i<=3; i++){
					if (hasErr(octetsArr[i])){return true;}
				}
				return false;
			}
			
			function clearInvalidOctetFields(octetsArr){
				octetsArr[0].clearInvalid();
				octetsArr[1].clearInvalid();
				octetsArr[2].clearInvalid();
				octetsArr[3].clearInvalid();
			}
			
			var notationFieldCmp = Ext.getCmp( this.ownerCt.id );
			var notationValue = notationFieldCmp.getValueFromOctets();
			var ipv4Cmp = Ext.getCmp(this.ownerCt.ownerCt.ipId);
			var ipv4Value = ipv4Cmp.getValue();
			var octetsArr = notationFieldCmp.octets;
			/************		Main Starts here		******************/
			// If no value has been filled its considered valid
			if (notationValue == "" ){
				return true;
			} 
					   
			// If empty value exists the field is considered valid
			var octetValsArr = notationValue.split( '.' );
			for (var i=0; i<=3; i++){
				if (octetValsArr[i] == ""){return true;}
			}
			
			if(isValidOctets(octetsArr) == true){
				// an error exists but this is not the octet to display the message
				if (!hasErr(this) && errorsExist(this, octetsArr, notationFieldCmp)) {
					this.clearInvalid();
					return true;
				}
				// Extract "int values" for bitwise operations. (e.g.  192.0.0.0 == 3221225472)
				var intMask = dottedToInt(notationValue);
				var intIpv4Addr = dottedToInt(ipv4Value);
				var NetworkMode = Ext.getCmp(this.ownerCt.ownerCt.id).networkMode;
				var loopbackMode = Ext.getCmp(this.ownerCt.ownerCt.id).loopbackMode;
							
				if(loopbackMode && (0xFFFFFFFF == intMask))  {
					clearInvalidOctetFields(octetsArr); 
					notationFieldCmp.unsetActiveError();
					notationFieldCmp.doComponentLayout();
					return true;
				}                
							
				// Validates whether the masked IP address is zero or not
				if(NetworkMode == false){
					if (!((intIpv4Addr | intMask) & (~intMask))) {
						return 'Invalid Mask: Masked IPV4 address is zero';
					}
				} else {
					if (((intIpv4Addr | intMask) & (~intMask)) != 0) {
						return 'Invalid Mask: Masked IPV4 address is not zero';
					}
				}
				
		
				// Validates the Mask contains continuous 1's
				intMask = ~intMask + 1; //reverse mask and add 1 - if value is valid intMask should be a power of 2.
				if(((intMask-1) & intMask) != 0){ //should return true if it is a power of 2
					return 'Invalid mask: Mask is not continuous bitwise';
				}
				
				// Since we've made it this far all fields are valid so clear them all
				clearInvalidOctetFields(octetsArr); 
				notationFieldCmp.unsetActiveError();
				notationFieldCmp.doComponentLayout();
				return true;
			} 
			else{ // Some octet is invalid so lets return its error message (without marking this octet) 
				// If this octet is not valid mark it and return the error message
				if (isNotValidOctet(this)){
					return buildMsg(this)
				} else {
					return true
				}
			}
		};
		
		function reValidate() {
			if(this.ownerCt.xtype == "cp4_ipv4notation")
			{
				var MyId = this.id;
				var i;
				var j;
					
				for(i = 0;i < this.ownerCt.items.length;i++)
					if(this.ownerCt.items.items[i].id != MyId && 
						(this.ownerCt.items.items[i].xtype == "cp4_ipv4field"
                                                || this.ownerCt.items.items[i].xtype == "cp4_ipv4field_ex"))
					{
						if(this.ownerCt.items.items[i].getValue() != "")
							for(j = 0;j < this.ownerCt.items.items[i].octets.length;j++)
								this.ownerCt.items.items[i].octets[j].validate();
						
					}
			}
		}
		
		var items = [
	            ip_field
		,{
			xtype: 'cp4_ipv4field',
			id: this.notationId,
			itemId: "notationId",
			fieldName: this.notationName,
			fieldLabel: this.ipNotationLabel || 'Subnet mask',
                    	labelWidth: this.labelWidth,
                        width: this.width,
			keypressEvent: this.keypressEvent,
			changeValueEventHandler: this.changeValueEventHandler,
			fieldConfig: {
				allowBlank: this.fieldAllowBlank,
				disabled: this.fieldDisabled
			},
			octetsConfig: [{
				validator: validateMaskDecOctet,
				minValue:0,
				maxValue: 255

			},{
				validator: validateMaskDecOctet,
				minValue:0,
				maxValue: 255
			},{
				validator: validateMaskDecOctet,
				minValue:0,
				maxValue: 255
			},{
				validator: validateMaskDecOctet,
				minValue:0,
				maxValue: 255
			}]
		}];
		return items;
	},
	
	manageNotationValue: function(){
		//get notation field
		var notationId = this.notationId;
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
		
		//override setValue - 
		//translate cidr value from server into dotted and vise versa
		Ext.getCmp( notationId ).setValue = function( value ){
			//check format
			value = value.toString();
			if( value == '' ){
				setOctetVals("","","","");
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


//~~~ @@ DATA

/*
 * Data model
 * don't define a data model unless its for the entire application (not per page)
 * because it will stay in memory and will not be removed when moving to a new page
 */
Ext.define( 'CP.WebUI4.DataModel',{  
    extend: 'Ext.data.Model',      
    alias: 'widget.cp4_datamodel',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Store
 */
Ext.define( 'CP.WebUI4.Store',{  
    extend: 'Ext.data.Store',      
    alias: 'widget.cp4_store',
    autoLoad: true,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Array Store
 */
Ext.define( 'CP.WebUI4.ArrayStore',{  
    extend: 'Ext.data.ArrayStore',      
    alias: 'widget.cp4_arraystore',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Json Store
 */
Ext.define( 'CP.WebUI4.JsonStore',{  
    extend: 'Ext.data.JsonStore',      
    alias: 'widget.cp4_jsonstore',
    autoLoad: true,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Tree Store
 * to be used with tree panel
 */
Ext.define( 'CP.WebUI4.TreeStore',{  
    extend: 'Ext.data.TreeStore',      
    alias: 'widget.cp4_treestore',
    autoLoad: true,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


//~~~ @@ PORTAL

/*
 * Portal Drop Zone
 */
Ext.define( 'Ext.app.PortalDropZone',{
    extend: 'Ext.dd.DropTarget',
    
    constructor: function( portal, cfg ){
        this.portal = portal;
        Ext.dd.ScrollManager.register( portal.body );
        Ext.app.PortalDropZone.superclass.constructor.call( this, portal.body, cfg );
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },
        
    ddScrollConfig: {
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
    
    notifyOver: function( dd, e, data){
        var xy = e.getXY(); 
        var portal = this.portal;
        var proxy = dd.proxy;
        
        // case column widths
        if( !this.grid ){
            this.grid = this.getGrid();
        }
        
        // handle case scroll where scrollbars appear during drag
        var portalWidth = portal.body.dom.clientWidth;
        if( !this.lastCW ){
            this.lastCW = portalWidth;
        }
        else if( this.lastCW != portalWidth ){
            this.lastCW = portalWidth;
            this.grid = this.getGrid();
        }
        
        // determine column
        var col = 0;
        var c = 0;
        var colX = this.grid.columnX;
        var cxLength = colX.length;
        var match = false;
        
        for( cxLength ; col<cxLength ; col++){
            c = colX[col].x + colX[col].w;
            if( xy[0]<c ){
                match = true;
                break;
            }
        }
        
        // no match, fix last index
        if( !match ){
            col--;
        }
        
        // find insert position
        var i,
        pos = 0,
        r = 0, 
        l = false,
        k = portal.items.getAt(col),
        items = k.items.items,
        overSelf = false;
        cxLength = items.length;
        
        for( cxLength ; pos<cxLength ; pos++){
            i = items[ pos ];
            r = i.el.getHeight();
            if( r === 0 ){
                overSelf = true;
            }
            else if((i.el.getY()+(r/2))>xy[1]){
                l = true;
                break;
            }
        }
        
        pos = ( l && i ? pos : k.items.getCount() ) + ( overSelf ? -1 : 0 );
        var overEvent = this.createEvent(dd,e,data,col,k,pos);
        
        if( portal.fireEvent("validatedrop", overEvent) !== false && 
            portal.fireEvent("beforedragover", overEvent) !== false ){
            
            // make sure proxy width is fluid
            proxy.getProxy().setWidth("auto");
            
            if( i ){
                proxy.moveProxy(i.el.dom.parentNode,l?i.el.dom:null);
            }
            else{
                proxy.moveProxy(k.el.dom,null);
            }
            this.lastPos = { c:k, col:col, p:overSelf || ( l && i ) ? pos : false };
            this.scrollPos = portal.body.getScroll();
            portal.fireEvent("dragover", overEvent);
            return overEvent.status;
        }
        else{
            return overEvent.status;
        }
    },
        
    notifyOut: function(){
        delete this.grid;
    },
    
    notifyDrop: function( dd, e, data ){
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
            
            panel.el.dom.style.display = '';
            
            if( pos !== false ){
                c.insert( pos, panel );
            }
            else{
                c.add( panel );
            }
            dd.proxy.hide();
            this.portal.fireEvent( 'drop', dropEvent );
            var scrollTop = this.scrollPos.top;
            if( scrollTop ){
                var i = this.portal.body.dom;
                setTimeout( function(){i.scrollTop=scrollTop;}, 10 );
            }

        }
        delete this.lastPos;
        return true;
    },
    
    //internal cache of body and column coords
    getGrid: function(){
        var box = this.portal.body.getBox();
        box.columnX = [];
        this.portal.items.each(function(c){
             box.columnX.push({x: c.el.getX(), w: c.el.getWidth()});
        });
        return box;
    },
    
    //unregister the dropzone from ScrollManager
    unreg:function(){
        Ext.dd.ScrollManager.unregister( this.portal.body );
        Ext.app.PortalDropZone.superclass.unreg.call( this );
    }
});


/*
 * Tools
 */
Ext.define( 'CP.WebUI4.Tool',{
    extend: 'Ext.panel.Tool',
    alias: 'widget.cp4_tool',
    baseCls: 'webui4-tool',
    width: 16,
    height: 16,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Portlet
 */
Ext.define( 'Ext.Portlet',{
    extend: 'CP.WebUI4.Panel',
    alias: 'widget.cp4_portlet',
    layout: 'fit',
    anchor: '100%',
    cls: 'x-portlet webui4-portlet',        
    frame: true,
    frameHeader: false,
    animCollapse: true,
    draggable: true,
    doClose: function(){
        this.el.animate({
            opacity: 0,
            callback: function(){
                this.fireEvent( 'close', this );
                this[ this.closeAction ]();
            },
            scope:this
        });
    }
});


/*
 * Portal Column
 */
Ext.define( 'Ext.PortalColumn',{
    extend: 'CP.WebUI4.Panel',
    alias: 'widget.cp4_portalcolumn',
    layout: { type:'anchor' },
    defaultType: 'cp4_portlet',
    cls: 'x-portal-column',
    style: {height: '100%'}
    //autoHeight: true
});


/*
 * Portal Panel
 */
Ext.define( 'CP.WebUI4.PortalPanel',{
    extend: 'CP.WebUI4.Panel',
    alias: 'widget.cp4_portalpanel',
    cls: 'x-portal',
    bodyCls: 'webui4-portal-body',
    defaultType: 'cp4_portalcolumn',
    componentLayout: 'body', //no title
    autoScroll: true,
    bodyStyle: 'border:0 none;',
    layout: 'column',
    
    initComponent: function(){
        this.callParent();

        this.addEvents({
            validatedrop: true,
            beforedragover: true,
            dragover: true,
            beforedrop: true,
            drop: true
        });
        this.on( 'drop', this.doLayout, this );
    },
    
    
    beforeLayout: function(){
        var b = this.layout.getLayoutItems();
        var a = b.length;
        var c = 0;
        var d;
        
        for( ; c<a ; c++){
            d = b[c];
            d.columnWidth = 1/a;
            d.removeCls(['x-portal-column-first', 'x-portal-column-last']);
        }
        b[0].addCls( 'x-portal-column-first' );
        b[a-1].addCls( 'x-portal-column-last' );
        return this.callParent( arguments );
    },

        
    initEvents: function(){
        this.callParent();
        this.dd = Ext.create( 'Ext.app.PortalDropZone', this, this.dropConfig );
    },
    
    beforeDestroy: function(){
        if( this.dd ){
            this.dd.unreg();
        }
        CP.WebUI4.PortalPanel.superclass.beforeDestroy.call( this );
    }
});


//~~~ @@ DRAW COMPONENTS

/*
 * Draw component
 */
Ext.define( 'CP.WebUI4.Draw',{  
    extend: 'Ext.draw.Component',      
    alias: 'widget.cp4_draw',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


//~~~ @@ CHARTS

/*
 * Chart
 */
Ext.define( 'CP.WebUI4.Chart',{  
    extend: 'Ext.chart.Chart',      
    alias: 'widget.cp4_chart',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


//~~~ @@ WINDOWS

/*
 * ToolTip
 */
Ext.define( 'CP.WebUI4.ToolTip',{  
    extend: 'Ext.tip.ToolTip',      
    alias: 'widget.cp4_tooltip',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});

/*
 * Message Box (alert/warning/info/error)
 */
Ext.define( 'CP.WebUI4.MessageBox',{  
    extend: 'Ext.window.MessageBox',      
    alias: 'widget.cp4_messagebox',
    alternateClassName: 'CP.WebUI4.Msg',
    componentCls: 'webui4-messagebox',
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }

//create a singleton to work with
}, function() {
    CP.WebUI4.Msg = new this();
});


/*
 * modal popup window
 */
Ext.define( 'CP.WebUI4.ModalWin',{  
    extend: 'Ext.window.Window',      
    alias: 'widget.cp4_modalwin',
    cls: 'webui4-modal-win',
    layout: 'fit',
    border: 0,
    resizable: false,
    bodyBorder: true,
    modal: true,
    constrain: true,  
    ghost: null,
    
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});

/*
 * normal popup window
 */
Ext.define( 'CP.WebUI4.Window',{  
    extend: 'Ext.window.Window',      
    alias: 'widget.cp4_window',
    cls: 'webui4-modal-win',

    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});


/*
 * Terminal - console panel
 */
Ext.define( 'CP.WebUI4.ConsolePanel',{
    extend: 'CP.WebUI4.Panel',
    alias: 'widget.cp4_consolepanel',
    cls: 'webui-console-panel', 
    form_method: 'POST',
    input_id: 'cursor',
    input_name: 'console_input',
    custom_prompt: '',
    onload: null,
    url: null,
    overrideLock: true,
    cgiPrefix: '',
    beforeClose: null,
    rows: 25,
    cols: 80,

    initComponent: function(){
        this.callParent( arguments );
        //add code here if needed
        //usually add events or do any render stuff after calling to the superclass's initComponent

        this.terminal = new this.anytermC( this.terminalConsoleId , this.cgiPrefix, this.beforeClose, this.rows, this.cols );
		
		var haveLock = !(CP.global.token < 1);
		if (haveLock && this.overrideLock){ // we have the lock. we should remember this and release it.
			CP.global.retrieveLock = true;
			CP.util.configLock_req("releaseLock", true /*noAlert*/);
		}
		
        this.terminal.initialise();
    },
  
    anytermC: function (terminalConsoleId, prefix, beforeClose, rows, cols){
        var term;
        var termbody;
        var open = false;
	var GermanAltGrOn = false;

        // Random sequence numbers are needed to prevent Opera from caching
        // replies

        var is_opera = navigator.userAgent.toLowerCase().indexOf("opera") != -1;
        var seqnum_val=Math.round(Math.random()*100000);
        
        function cachebust(){
            if (is_opera) {
                seqnum_val++;
                return "&x="+seqnum_val;
            } 
            else {
                return "";
            }
        }

        // Synchronous loader is a simple function
        function sync_load( s_url, s_params, callback ){
            Ext.Ajax.request({
                url: prefix + '/anyterm-module?'+ s_url,
		timeout: 20000, // 20 seconds for request
                method: 'POST',
                params: s_params,
				  /*This property, when set to false, removes ExtJS's '_dc' (caching related) parameter from the request sent to the server
				  This is done since the server sometimes has trouble interperting the address and failes to respond to the request.
				  Notice that setting this property to 'false' causes IE8 (!) to fail to update from the server after the 1st request (304 result) - 
				  which is unacceptable in many situations in which we need a result from the server. a similar problem occured in 'util.js' concerning the conflock*/	
                disableCaching: false, 
                success: function( response ){
                    if( callback ){
                        callback( response.responseXML );
                    }
                },
                failure: function( response ){
			// retry
			setTimeout(function(){sync_load( s_url, s_params, callback )}, 5000);
		}
            });
        }

        // Receive channel:
        var disp="";
        function display(n){
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
                } 
                else if (cmd=="k") {
                    ndisp+=disp.substr(0,num);
                    disp=disp.substr(num);
                } 
                else if (cmd=="i") {
                    if (edscr.length<num) {}
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
            Ext.core.DomHelper.overwrite(b_c, {tag: 'span', html: bc_data, style: 'color: #ccc; font-family: courier new, monospace !important; font-size: 13px; line-height: 1.3em'});
            Ext.core.DomHelper.overwrite(a_c, {tag: 'span', html: ac_data, style: 'color: #ccc; font-family: courier new, monospace !important; font-size: 13px; line-height: 1.3em'});

            clearInterval(this.timer);
//                        this.input_object.value = '';
        }

        function get() {
            var resXml = sync_load( 'rcv'+cachebust(), {}, rcv );
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
            } 
            else if (root.tagName=="op") {
                display(root);
                get();
            } 
            else if (root.tagName=="error") {
                open=false;
                if (beforeClose){
                	beforeClose();
                }
                if (terminalConsoleId != null)
                {
                    var modal = Ext.getCmp(terminalConsoleId);
                    modal.close();
                }
            } 
            else {
//          alert("Unrecognised response: "+root.tagName);
            }
        }

        // Transmit channel:
        var kb_buf="";
        var send_in_progress=false;

        function send() {
            send_in_progress=true;
            var params = {
                k: encodeURIComponent(kb_buf)
            };
            var d = sync_load( 'send'+cachebust(), params, send_done );
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
				 
        if (kc > 255 )
        {	
//          var k=String.fromCharCode(63);
            return false;
        }
        else
        {
            var k=String.fromCharCode(kc);
        }
          process_key(k);

          key_ev_stop(ev);
          return false;
        };

        this.keydown = function(ev) {
          if (!ev) var ev=window.event;

          var k;
          var kc=ev.keyCode;
	  var isChrome = !!window.chrome;  // Chrome 1+
	  if(Ext.firefoxVersion && ev.altKey)	{	
				return true;			// exit for FF because he deals with ALT GR in keypress event
			}
	  if ((isChrome && ev.ctrlKey ) || 
		 ( Ext.isIE && ev.altKey) ) {  	// Appears to be Alt Gr except for IE8. 
			
			GermanAltGrOn = true; // Support German altGR key (or alt) 
		}
		  
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
          else if (kc==32)  k=String.fromCharCode(32);  // Space
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
          else if (kc==81 && GermanAltGrOn)  { k=String.fromCharCode(64);  // @ 
								GermanAltGrOn = false; }
          else if (kc==219 && GermanAltGrOn)  { k=String.fromCharCode(92);  // '\'
								GermanAltGrOn = false; }
          else if (kc==226 && GermanAltGrOn)  { k=String.fromCharCode(124);  // '|'
								GermanAltGrOn = false; }
          else if (kc==187 && GermanAltGrOn)  { k=String.fromCharCode(126);  // ~
								GermanAltGrOn = false; }
          else if (kc==55 && GermanAltGrOn)  { k=String.fromCharCode(123);  // {
								GermanAltGrOn = false; }
          else if (kc==48 && GermanAltGrOn)  { k=String.fromCharCode(125);  // }
								GermanAltGrOn = false; }
          else if (kc==56 && GermanAltGrOn)  { k=String.fromCharCode(91);  // [
								GermanAltGrOn = false; }
          else if (kc==57 && GermanAltGrOn)  { k=String.fromCharCode(93);  // ]
								GermanAltGrOn = false; }
          else if (kc==50 && GermanAltGrOn)  { k=String.fromCharCode(178);  // ²
								GermanAltGrOn = false; }
          else if (kc==51 && GermanAltGrOn)  { k=String.fromCharCode(179);  // ³
								GermanAltGrOn = false; }
          else {	
            if (!ev.ctrlKey || ev.keyCode==16 ||ev.keyCode==17 || ev.keyCode==18) {
							if (GermanAltGrOn)  { 	 // return true and exit 
								GermanAltGrOn = false;
							}; 
							return true;
            }
			else if (GermanAltGrOn)  { 	 // return true and exit 
								GermanAltGrOn = false;
							}; 
           	if(kc >63 ) {
				k=String.fromCharCode(kc-64); 
			}			
          }

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
        function open_term(rows, cols) {
          if (open) {
            alert("Connection is already open");
            return;
          }
          var params = {
                rows: rows,
                cols: cols
          };
          var d = sync_load( 'open' + cachebust(), params, handleOpenResponse );
        }
        
        function handleOpenResponse( resXml ){
            var root = get_response_root( resXml );
            if( !root ){
                return null;
            } 
            else if( root.tagName == "open" ){
                open = true;
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
        	CP.WebUI4.Toppanel.suspendNetInteraction = false;
			if (CP.global.retrieveLock == true){ // if we had the lock try to restore it
				CP.global.retrieveLock = false; // first mark false in case  'configLock_req'  fails
				CP.util.configLock_req("create", true /*noAlert*/);
			}	
			if (!open) {
				return;
			}
			open=false;
			var d = sync_load( 'close' + cachebust(), {});
		};

          this.initialise = function() {
          open_term(rows, cols);
        };
    },

    destroy: function(p){
    var term_C = this.terminal;
        term_C.close_term();
    },

    afterRender : function(){
//        var wh = this.ownerCt.getSize();
//        var _this = this;
//        Ext.applyIf(this, wh);
        CP.WebUI4.ConsolePanel.superclass.afterRender.call(this);    
       
        var term_C = this.terminal;
        var terminal_container = this.body;
        
        Ext.core.DomHelper.append(terminal_container, {tag: 'div'});
        var terminal = Ext.get(terminal_container).last('div');
        
        Ext.core.DomHelper.append(terminal, {tag: 'span'});
        var terminal_output = Ext.get(terminal).last('span');
        Ext.core.DomHelper.append(terminal, {tag: 'span', html: this.custom_prompt, id: 'before_cursor'}); 
        
        Ext.core.DomHelper.append(terminal, {tag: 'input', id: this.input_id, type: 'text', name: this.input_name, autocomplete: 'off'}); 
        Ext.core.DomHelper.append(terminal, {tag: 'span', html: this.custom_prompt, id: 'after_cursor'}); 
        
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
            if (!term_C.keydown(e.browserEvent)){
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
        });

        //Set Focus
        function setInputFocus(){
            terminal_input.focus(); 
        }
        
        //Attach Events to window - set focus to display cursor
        var win = Ext.getCmp( this.terminalConsoleId );
        win.on( 'show', setInputFocus ); //on window show
        
        var winHtmlEl = Ext.get( this.terminalConsoleId );
        winHtmlEl.on( 'click', setInputFocus ); //on window click
    }
});


/*
 * PagingToolbar
 */
Ext.define( 'CP.WebUI4.PagingToolbar',{  
    extend: 'Ext.toolbar.Paging',      
    alias: 'widget.cp4_pagingtoolbar',
    requires: ['Ext.toolbar.Paging'],

    constructor : function(config){
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    },

    getPageData : function(){
        var store = this.store,
            totalCount = store.getTotalCount();

        return {
            total : totalCount,
            currentPage : store.currentPage,
            pageCount : totalCount === 0 ? 1 :
                        Math.ceil(totalCount / store.pageSize),
            fromRecord: ((store.currentPage - 1) * store.pageSize) + 1,
            toRecord: Math.min(store.currentPage * store.pageSize, totalCount)
        };
    }
});


Ext.define('CP.WebUI4.SearchFooter', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.cp4_searchfooter',
    requires: ['Ext.toolbar.TextItem', 'Ext.form.field.Number'],


    
    displayInfo: false,

    
    prependButtons: false,

    
//    displayMsg : 'Displaying {0} - {1} of {2}',

    
    emptyMsg : 'No data to display',

    
    beforePageText : 'Found',

    
    foundText : 'Found {0} item{1}',
    notFoundText : 'No items found',

    
//    firstText : 'First Page',

    
//    prevText : 'Previous Page',

    
//    nextText : 'Next Page',

    
//    lastText : 'Last Page',

    
//    refreshText : 'Refresh',

    
//    inputItemWidth : 30,

    
    getPagingItems: function() {
        var me = this;

        return [//{
//            itemId: 'first',
//            tooltip: me.firstText,
//            overflowText: me.firstText,
//            iconCls: Ext.baseCSSPrefix + 'tbar-page-first',
//            disabled: true,
//            handler: me.moveFirst,
//            scope: me
//        },{
//            itemId: 'prev',
//            tooltip: me.prevText,
//            overflowText: me.prevText,
//            iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
//            disabled: true,
//            handler: me.movePrevious,
//            scope: me
//        },
//        '-',
//        me.beforePageText,
        {
//            xtype: 'numberfield',
//            itemId: 'inputItem',
//            name: 'inputItem',
//            cls: Ext.baseCSSPrefix + 'tbar-page-number',
//            allowDecimals: false,
//            minValue: 1,
//            hideTrigger: true,
//            enableKeyEvents: true,
//            selectOnFocus: true,
//            submitValue: false,
//            width: me.inputItemWidth,
//            margins: '-1 2 3 2',
//            listeners: {
//                scope: me,
//                keydown: me.onPagingKeyDown,
//                blur: me.onPagingBlur
//            }
//        },{
            xtype: 'tbtext',
            itemId: 'afterTextItem',
            text: Ext.String.format(me.foundText, 1, "")
//        },
//        '-',
//        {
//            itemId: 'next',
//            tooltip: me.nextText,
//            overflowText: me.nextText,
//            iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
//            disabled: true,
//            handler: me.moveNext,
//            scope: me
//        },{
//            itemId: 'last',
//            tooltip: me.lastText,
//            overflowText: me.lastText,
//            iconCls: Ext.baseCSSPrefix + 'tbar-page-last',
//            disabled: true,
//            handler: me.moveLast,
//            scope: me
        }
        ];
    },

    initComponent : function(){
        var me = this,
            pagingItems = me.getPagingItems(),
            userItems   = me.items || me.buttons || [];

        if (me.prependButtons) {
            me.items = userItems.concat(pagingItems);
        } else {
            me.items = pagingItems.concat(userItems);
        }
        delete me.buttons;

        if (me.displayInfo) {
            me.items.push('->');
            me.items.push({xtype: 'tbtext', itemId: 'displayItem'});
        }

        me.callParent();

        me.addEvents(
            
            'change',

            
            'beforechange'
        );
        me.on('afterlayout', me.onLoad, me, {single: true});

        me.bindStore(me.store || 'ext-empty-store', true);
    },
    
    updateInfo : function(){
        var me = this,
            displayItem = me.child('#displayItem'),
            store = me.store,
            pageData = me.getPageData(),
            count, msg;

        if (displayItem) {
//            count = store.getCount();
//            if (count === 0) {
                msg = me.emptyMsg;
//            } else {
//                msg = Ext.String.format(
//                    me.displayMsg,
//                    pageData.fromRecord,
//                    pageData.toRecord,
//                    pageData.total
//                );
//            }
            displayItem.setText(msg);
            me.doComponentLayout();
        }
    },

    
    onLoad : function(){
        var me = this,
            pageData,
            currPage,
            pageCount,
            afterText;

        if (!me.rendered) {
            return;
        }

        pageData = me.getPageData();
        currPage = pageData.currentPage;
	total = pageData.total;
        pageCount = pageData.pageCount;
	var plural = ""
	if (total > 1)
		plural = "s"
	if (total > 0)
	        afterText = Ext.String.format(me.foundText, total, plural);
	else 
		afterText = me.noFoundText;

        me.child('#afterTextItem').setText(afterText);
//        me.child('#inputItem').setValue(currPage);
//        me.child('#first').setDisabled(currPage === 1);
//        me.child('#prev').setDisabled(currPage === 1);
//        me.child('#next').setDisabled(currPage === pageCount);
//        me.child('#last').setDisabled(currPage === pageCount);
//        me.child('#refresh').enable();
        me.updateInfo();
        me.fireEvent('change', me, pageData);
    },

    
    getPageData : function(){
        var store = this.store,
            totalCount = store.getTotalCount();

        return {
            total : totalCount,
            currentPage : store.currentPage,
            pageCount: Math.ceil(totalCount / store.pageSize),
            fromRecord: ((store.currentPage - 1) * store.pageSize) + 1,
            toRecord: Math.min(store.currentPage * store.pageSize, totalCount)

        };
    },

    
    onLoadError : function(){
        if (!this.rendered) {
            return;
        }
//        this.child('#refresh').enable();
    },

/*    
    readPageFromInput : function(pageData){
        var v = this.child('#inputItem').getValue(),
            pageNum = parseInt(v, 10);

        if (!v || isNaN(pageNum)) {
            this.child('#inputItem').setValue(pageData.currentPage);
            return false;
        }
        return pageNum;
    },

    onPagingFocus : function(){
        this.child('#inputItem').select();
    },

    
    onPagingBlur : function(e){
        var curPage = this.getPageData().currentPage;
        this.child('#inputItem').setValue(curPage);
    },

    
    onPagingKeyDown : function(field, e){
        var me = this,
            k = e.getKey(),
            pageData = me.getPageData(),
            increment = e.shiftKey ? 10 : 1,
            pageNum;

        if (k == e.RETURN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum !== false) {
                pageNum = Math.min(Math.max(1, pageNum), pageData.pageCount);
                if(me.fireEvent('beforechange', me, pageNum) !== false){
                    me.store.loadPage(pageNum);
                }
            }
        } else if (k == e.HOME || k == e.END) {
            e.stopEvent();
            pageNum = k == e.HOME ? 1 : pageData.pageCount;
            field.setValue(pageNum);
        } else if (k == e.UP || k == e.PAGEUP || k == e.DOWN || k == e.PAGEDOWN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum) {
                if (k == e.DOWN || k == e.PAGEDOWN) {
                    increment *= -1;
                }
                pageNum += increment;
                if (pageNum >= 1 && pageNum <= pageData.pages) {
                    field.setValue(pageNum);
                }
            }
        }
    },

*/    
    beforeLoad : function(){
//        if(this.rendered && this.refresh){
//            this.refresh.disable();
//        }
    },

/*    
    doLoad : function(start){
        if(this.fireEvent('beforechange', this, o) !== false){
            this.store.load();
        }
    },

    
    moveFirst : function(){
        if (this.fireEvent('beforechange', this, 1) !== false){
            this.store.loadPage(1);
        }
    },

    
    movePrevious : function(){
        var me = this,
            prev = me.store.currentPage - 1;

        if (prev > 0) {
            if (me.fireEvent('beforechange', me, prev) !== false) {
                me.store.previousPage();
            }
        }
    },

    
    moveNext : function(){
        var me = this,
            total = me.getPageData().pageCount,
            next = me.store.currentPage + 1;

        if (next <= total) {
            if (me.fireEvent('beforechange', me, next) !== false) {
                me.store.nextPage();
            }
        }
    },

    
    moveLast : function(){
        var me = this,
            last = me.getPageData().pageCount;

        if (me.fireEvent('beforechange', me, last) !== false) {
            me.store.loadPage(last);
        }
    },

    
    doRefresh : function(){
        var me = this,
            current = me.store.currentPage;

        if (me.fireEvent('beforechange', me, current) !== false) {
            me.store.loadPage(current);
        }
    },

*/    
    bindStore : function(store, initial){
        var me = this;

        if (!initial && me.store) {
            if(store !== me.store && me.store.autoDestroy){
                me.store.destroyStore();
            }else{
                me.store.un('beforeload', me.beforeLoad, me);
                me.store.un('load', me.onLoad, me);
                me.store.un('exception', me.onLoadError, me);
            }
            if(!store){
                me.store = null;
            }
        }
        if (store) {
            store = Ext.data.StoreManager.lookup(store);
            store.on({
                scope: me,
                beforeload: me.beforeLoad,
                load: me.onLoad,
                exception: me.onLoadError
            });
        }
        me.store = store;
    },

    
    unbind : function(store){
        this.bindStore(null);
    },

    
    bind : function(store){
        this.bindStore(store);
    },

    
    onDestroy : function(){
        this.bindStore(null);
        this.callParent();
    }
});

//~~~ @@ INLINE ELEMENTS

/*
 * Displays an inline page message
 */
Ext.define( 'CP.WebUI4.inlineMsg',{  
    extend: 'CP.WebUI4.Container',      
    alias: 'widget.cp4_inlinemsg',
    cls: 'webui-inlinemsg',

    constructor: function( config ){
        var type = 'info'; //posibble values are: 'warning', 'info', 'related', or any other type definde in the css
        var text = '';
		
        if( config ){
            type = config.type || type;
            text = config.text || text;
        }

        this.callParent([config]);
		this.setTextAndType(text,type);
    },

	setTextAndType : function( text,type ) {
        var html =  '<div class="webui-inlinemsg-inner '+ type +'">'+ text +'</div>';


        this.update(html);
	}
});

/*
 * Displays an inline page message if cluster is enabled and we logging from non-cadmin user
 */
Ext.define( 'CP.WebUI4.ClusterFeatureMessage',{  
    extend: 'CP.WebUI4.Container',   
    alias: 'widget.cp4_cluster_feature_message',
    cls: 'webui-inlinemsg',
	style  : "margin-bottom:10px;",
    
    constructor: function( config ){
        var type = 'warning'; //posibble values are: 'warning', 'info', 'related', or any other type definde in the css
        var text = 'This feature is a cluster controlled feature' + "</br>" +
					"Any changes made would be local to this cluster member only." + "</br>" +
					"The changes may be overwritten by cluster configuration.";
		
        if( config ){
            type = config.type || type;
            text = config.text || text;
        }
        this.html = '<div class="msg-tl"><div class="msg-tr"><div class="msg-tc">&nbsp;</div></div></div>'+
                    '<div class="msg-ml"><div class="msg-mr"><div class="msg-mc '+ type +'">'+ text +'</div></div></div>'+
                    '<div class="msg-bl"><div class="msg-br"><div class="msg-bc">&nbsp;</div></div></div>';
        
		if(CP.global.isClusterEnabled && !CP.global.isCluster)
        this.callParent([config]);
		else {
			this.html = "";
        this.callParent([config]);
    }
    }
});



Ext.define( 'CP.WebUI4.DynamicInlineMsg',{  
    extend: 'CP.WebUI4.Container',      
    alias: 'widget.cp4_dynamicInlinemsg',
    cls: 'webui-inlinemsg',

    constructor: function( config ){

		this.type = 'info'; //posibble values are: 'warning', 'info', 'related', or any other type definde in the css
		this.text ='';

        if( config ){
           this.type = config.type || this.type;
           this.text = config.text || this.text;
        }
		
		this.html = '<div class="msg-tl"><div class="msg-tr"><div class="msg-tc">&nbsp;</div></div></div>'+
		'<div class="msg-ml"><div class="msg-mr"><div class="msg-mc '+ this.type +'">'+ this.text +'</div></div></div>'+
		'<div class="msg-bl"><div class="msg-br"><div class="msg-bc">&nbsp;</div></div></div>';

        this.callParent([config]);
    },
	
	// ~~~ Getters ~~~
    getTextField: function(){
        return this.text;
    },

	// ~~~ Setters ~~~
    setText: function( value ){                 
		this.text = value;                                   
		this.html = '<div class="msg-tl"><div class="msg-tr"><div class="msg-tc">&nbsp;</div></div></div>'+
		'<div class="msg-ml"><div class="msg-mr"><div class="msg-mc '+ this.type +'">'+ this.text +'</div></div></div>'+
		'<div class="msg-bl"><div class="msg-br"><div class="msg-bc">&nbsp;</div></div></div>';
		this.update(this.html);                        
    }
});

/*
 * section title
 */
Ext.define( 'CP.WebUI4.SectionTitle',{  
    extend: 'CP.WebUI4.Panel',      
    alias: 'widget.cp4_sectiontitle',
    cls: 'webui4-section-title',
    layout: 'fit',
    
    constructor: function( config ){
        this.html = ( config && config.titleText ) ? '<span>'+ config.titleText +'</span>' : '<span>Please define title</span>';
        this.callParent([config]);
    }
});



//~~~ @@ CUSTOM FORM FIELDS

/*
 * FileUploadPanel - used to upload files to the machine. Uploads the file by multipart/form-data,
 *  using FileUploadField to browse files and transfer. 
 * Few properties:
 *      progressTask - task for updating progress bar. Have to be stopped on end.
 *      state: [none | uploading | finished]
 *      initUploadPanel - callback function that can be called when the panel is loaded or state is set to 'none'
 *      onUploadStarted, onUploadFinished - callback functions that called when the panel state is set 
 *          to 'uploading' or 'finished'
 *      originalFileName - name of the uploaded file
 *      uploadPath - path to save the file in the machine. Allowed only '/tmp' or '/var/log/upload'
 *      tmpPath - path to the tmp file in the machine. Allowed only '/tmp' or '/var/log/upload'
 *      fileSize - size of the uploaded file
 */
Ext.define('CP.WebUI4.FileUploadPanel', {
	extend: 'CP.WebUI4.Panel',
	alias: 'widget.cp4_fileuploadpanel',
    uploadPanelId: 'fu_upload_panel'+Ext.id(),
    progressBarId: 'fu_progressbar',
    progressTask: null,
    initUploadPanel: null,
    onUploadStarted: null,
    onUploadFinished: null,
    originalFileName: "",
    uploadPath: "/var/log/upload",
    tmpPath: "/tmp",
    fileSize: 0,
    
    cancelUpload: function(){
        if (this.progressTask) {
            Ext.TaskManager.stop(this.progressTask);
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
        else if (newState == "uploading" && this.state != "finished" ){         
        	this.originalFileName = jsonData.messages.fileName;
        	this.fileSize = jsonData.messages.size;
            if (this.onUploadStarted != null){
                var res = this.onUploadStarted();
                if (res == false){
                	this.cancelUpload();
                	return;
                }
            }
            Ext.getCmp(this.uploadPanelId).hide();
            Ext.getCmp('fu_progress_wrapper').show();
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
            Ext.TaskManager.start(task);
        }
        else if (newState == "finished" && this.state == "uploading"){
            if (this.progressTask) {
                Ext.TaskManager.stop(this.progressTask);
                this.progressTask = null;
            }
            Ext.getCmp(this.progressBarId).updateProgress(1);
            Ext.getCmp('fu_status_field').setValue(this.originalFileName + " was successfully uploaded" );
            Ext.getCmp('fu_uploaded_size_field').setValue("Uploaded: " + Ext.util.Format.fileSize(this.fileSize));
            if (this.onUploadFinished != null)
                this.onUploadFinished();
        }
        else {
        	return false;
        }
        
        this.state = newState;
        this.doLayout();
        return true;
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
        this.state = "none";
        var uploadWrapper = Ext.create( 'CP.WebUI4.FormPanel', {
            id: this.uploadPanelId,
            bodyPadding: 15,
            items:[{
                xtype: 'cp4_displayfield',
                id: 'display_file_name',
                hideLabel: true,
                width: 300,
                value: uploadLabel
            },{
            	xtype: 'filefield',
                id: 'fu_upload_field',
                name: 'photo-path',
                hideLabel: true,
                width: 300,
                buttonText: 'Browse...',
/*                buttonConfig: {
                    cls: 'webui4-button'
                },*/
                listeners: {
                	change: function(fld, val){
                		var newVal = fld.value.replace(/^C:\\fakepath\\/i, '');
                		fld.setRawValue(newVal);
                	}
                }
            },{
                xtype: 'cp4_button',
                id: 'fu_upload_button',
                //disabled: true,
                hidden:false,
                text: 'Import',
                scope: this,
                listeners: {
                    select: function(fileuploadpanelID) {                   	
                    	CP.global.uploadImportSnapshotFromFTW = true;                    	
                        this.handler(fileuploadpanelID);                       
                        
                    }
                },
                handler: function(fileuploadpanelID){                	
                	if (!Ext.getCmp('fu_upload_field').getValue())
                	{
                		 CP.global.uploadImportSnapshotFromFTW = false;
                		return;
                	}
					var cmp = null;				
					if(CP.global.uploadImportSnapshotFromFTW)
						cmp = Ext.getCmp(fileuploadpanelID);
					else
						cmp=this;   
					CP.global.uploadImportSnapshotFromFTW = false;
                    Ext.Ajax.request({
                        url: "/cgi-bin/upload_prep.tcl"
                        , method: "GET"
                        , scope: cmp
                        , params: {
                            'uploadPath': cmp.uploadPath
                            ,'tmpPath': cmp.tmpPath
                        }
                        , success: function(jsonResult) {
                            var jsonData = Ext.decode(jsonResult.responseText);
			    if (jsonData.success == true)
			    	cmp.changeState(jsonData,"uploading");		                               	
			    else {
				    CP.WebUI4.Msg.show({
					title:'Upload Error'
					, msg: jsonData.messages[0] +
						"<br/><br/>The session will be terminated. Press OK to proceed."
					, buttons: Ext.Msg.OK
					, icon:  Ext.Msg.ERROR
					, animEl: 'elId'
					, fn: function(){
						CP.util.redirectToLogin();	
					}
				    });	
			    }
                        }
			, failure: function(jsonResult) {
				    CP.WebUI4.Msg.show({
					title:'Upload Error'
					, msg: jsonData.messages[0] +
						"<br/><br/>The session will be terminated. Press OK to proceed."
					, buttons: Ext.Msg.OK
					, icon:  Ext.Msg.ERROR
					, animEl: 'elId'
					, fn: function(){
						CP.util.redirectToLogin();	
					}
				    });	
			}
                    });
                    
                    uploadWrapper.getForm().submit ({
                        url: '/cgi-bin/upload.tcl'
                        , method: 'POST'
                        , scope: cmp
                        , success: function(form, action){
							var rVal = cmp.changeState(null,"finished");
                           
                            // if for some reason result of upload_prep arrives after the file upload was finished
                            // try to finish it every second until success - waiting for upload_prep
			    var jsonData = Ext.decode(action.response.responseText);
			    if (jsonData.success == true && !rVal){
	                            var task = {
	                            	scope: cmp,
	                        	    run: function(){
	                        	    	var retVal = cmp.changeState(null,"finished"); 	
	                        	    	if (retVal)
	                        	    		Ext.TaskManager.stop(task);
	                        	    },
	                        	    interval: 1000 //1 second
	                        	}
	                        	Ext.TaskManager.start(task);
                            }
                            //Ext.Msg.alert('Success', 'The file was uploaded successfully');
                        }
                        , failure: function(form, action) {
                        }
                        , timeout: '3600000' // 60 minutes
                    });
                }
            }]
        });
		
		var UploadField = Ext.getCmp("fu_upload_field");
		
		if(UploadField) {
			if(!Ext.isIE) {
				Ext.apply(UploadField,{
						buttonConfig: {
							cls: 'webui4-button'
						}
					});
			} else {
				Ext.apply(UploadField,{
						buttonConfig: {
							style : ''
						}
					});
			}
		}
		
        var progressWrapper = Ext.create( 'CP.WebUI4.FormPanel', {
            id: 'fu_progress_wrapper',
            hidden:true,
            hideMode:'offsets',
            bodyPadding: 15,
            items: [{
                xtype: 'cp4_progressbar',
                id: this.progressBarId
            },{
                xtype: 'cp4_displayfield',
                id: 'fu_status_field',
                hideLabel: true,
                width: 300,
                value: 'Uploading...'
            },{
                xtype: 'cp4_displayfield',
                id: 'fu_size_field',
                hideLabel: true,
                width: 300,
                fieldLabel: 'Total Size',
                value: 'Total Size: '
            },{
                xtype: 'cp4_displayfield',
                hideLabel: true,
                id: 'fu_uploaded_size_field',
                width: 300,
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
        
        //add items to the config object
        Ext.apply( this, config );
        
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }//end of constructor
});

Ext.define( 'CP.WebUI4.ProgressBar', {
	extend: 'Ext.ProgressBar',
    alias: 'widget.cp4_progressbar',
    constructor: function( config ){
    	//add items to the config object
        Ext.apply( this, config );
        
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    }
});

/**
 * PasswordMeter - Displays a bar indicating the strength of a password.
 * It wraps a password field and displays the strength of the input password.
 * Parameters:
 *      passwordField - The password field which this component wraps around.
 *      The component is responsible for displaying the field. If none given
 *      the component will create a default password field and display it.
 *      You can get this field by using 'getField' function on the component.
 *
 *      calculateStrength - The function that calculates the strength of the password.
 *      Its signature is 'calculateStrength(value)' where the value is the current inputed
 *      password. The function must return a number between 0 (empty field) to 4 (very strong password).
 *      If none given a default function is used.
 */
Ext.define( 'CP.WebUI4.PasswordMeter',{  
    extend: 'CP.WebUI4.Container',      
    alias: 'widget.cp4_passwordmeter',  
    componentCls: 'password_strength_default_position',
    passwordStrength: 0,
    
    constructor: function( config ){
        
        // init properties & building Items              
        this.initProperties( config ); 
        
        // define structure and action
        this.items = [this.passwordField];
        
        //add items to the config object
        Ext.apply( this, config );
        
        //call the superclass's constructor and pass config
        //to apply user definitions
        this.callParent([config]);
    },
    
    // init config properties
    initProperties: function( config ){
        this.calculateStrength = this.showPassStrength;
        
        // override with config
        if( config ){
            this.calculateStrength = config.calculateStrength || this.calculateStrength;
        }
        
        if ( !config || !config.passwordField ){
            this.passwordField = Ext.create( 'CP.WebUI4.Password' );
        } else {
            this.passwordField = config.passwordField;
        }
    },
    
    initComponent: function(){
        this.callParent( arguments );
        
        // add events 
        this.passwordField.addListener('change', function(field, newVal, oldVal){this.calculateStrength(newVal);}, this);
    },
    
    // returns the wrapped password field
    getField: function(){
        return this.passwordField;
    },
    
    // ~~~ Getters and Setters
    getPasswordStrength: function(){
        return this.passwordStrength;
    },
    
    setPasswordStrength: function( passwordStrength ){
        this.removeCls('password_strength_img_' + this.passwordStrength);
        this.addCls('password_strength_img_' + passwordStrength);
        this.passwordStrength = passwordStrength;
    },
    
    // recalculate password strength
    showPassStrength: function( value ){
        
        var newStrength = value.length - 6; 
        if (newStrength < 0){
            newStrength = newStrength * 3;
        }
        if (newStrength > 10){
            newStrength = 10;
        }
        
        var groups = 0;
        if (value.match(/[a-z]+/)){
            groups++;
        }
        if (value.match(/[A-Z]+/)){
            groups++;
        }
        if (value.match(/[0-9]+/)){
            groups++;
        }
        if (value.match(/[!@#\$%\^&\*\(\)\-_=\+:;]+/i)){
            groups++;
        }
        
        switch (groups){
        case 2:
        case 4:
            newStrength += 8;
            break;
        case 3:
            newStrength += 10;
        }
        newStrength *= groups;
        
        if (value.length == 0){
            newStrength = 0;
        } else if (newStrength <= 15){
            newStrength = 1;
        } else if (newStrength <= 35){
            newStrength = 2;
        } else if (newStrength <= 45){
            newStrength = 3;
        } else{
            newStrength = 4;
        }
        
        this.setPasswordStrength( newStrength );
     }
});

/*
	The 'cp4_IPHybridField' is an extention of a  TextField which can contain both IPv4 and IPv6 addresses.
	It has error handeling determined by the address entered (distinction through ':' or '.')
	and is affected whether IPv6 support is turned on.
	It can receive 'allowBlank' flag and an 'IPandMaskValidator' function which is used  for further validation
	when it is part of 'cp4_hybridFieldCombinedMaskIP' component (and therefor it's value affects the entire
	component's validity)
*/

Ext.define( 'CP.WebUI4.IPHybridField',{
    extend: 'CP.WebUI4.TextField',      
    alias: 'widget.cp4_IPHybridField',
	invalidCls: 'webui4-ipfield-invalid',
	validateOnChange: false,
	validateOnBlur: true,
	msgTarget: 'side',
	fieldLabel: 'IP Address',
	maskRe: /[0-9A-Fa-f:.]/,
    width: 350,
	allowBlank: true,
	
	isIPv4: false,
	isIPv6: false,
	IPv4Only: false,
	IPv6Only: false,
	maxLength: 39,
    enforceMaxLength: true,
    constructor: function( config ){
        //call the superclass's constructor and pass config
        //to apply user definitions
		this.hasFocus = true;
		if (config){
			if (config.fieldConfig){
				if (config.fieldConfig.IPandMaskValidator) this.IPandMaskValidator = config.fieldConfig.IPandMaskValidator;
				if (config.fieldConfig.allowBlank) this.allowBlank = config.fieldConfig.allowBlank;
				if (false == CP.global.isIPv6On){
					this.maskRe = /[0-9.]/;
					this.isIPv4 = true;
					this.maxLength=15;
				}
				if (undefined != config.fieldConfig.IPv6Only){
					if (true == config.fieldConfig.IPv6Only){
						this.maskRe = /[0-9A-Fa-f:]/;
						this.IPv6Only = true;
						this.isIPv6 = true;
						this.fieldLabel = 'IPv6 Address';
					} // else defaults to   [0-9A-Fa-f:.]
				}
				
			}
			this.name = (config.fieldName) ? config.fieldName : '';
			this.id = (config.id) ? config.id : '';
		}
        this.callParent([config]);
    },
	
	validator: function () {
		var val = this.getValue().toLowerCase();
		var hasDot =  (-1 != val.indexOf('.'));
		var hasColon = (-1 != val.indexOf(':'));
		var hasHexadecimal = (-1 != val.indexOf('a')) || (-1 != val.indexOf('b')) || (-1 != val.indexOf('c')) || (-1 != val.indexOf('d')) || (-1 != val.indexOf('e')) || (-1 != val.indexOf('f'));
		
		if (!this.IPv4Only && !this.IPv6Only){
			this.isIPv4 = hasDot;
			this.isIPv6 = (hasColon || hasHexadecimal);
		}
		
		if (false == CP.global.isIPv6On && this.isIPv6){
			return "IPv6 support is off";
		}
		if (this.isIPv4 && this.isIPv6){
			return "Field cannot be resolved to IPv4 or IPv6";
		}
		if ("" == val){
			if (false == this.allowBlank) return "This field is required";
			else return true;
		}
		if (!this.isIPv4 && !this.isIPv6) {;
			return "Invalid address";
		}
		if (this.isIPv4){
			res = CP.util.isValidIPv4(this.getValue());
		} else if (this.isIPv6){
			res = CP.util.isValidIPv6(this.getValue());
		}
		if (true != res) return res;
		if (this.IPandMaskValidator) return this.IPandMaskValidator();
		return true;
	},
	
	dottedToInt: function(){
		dottedStr = this.getValue();
		if (!dottedStr) return null;
		var octetValsArr = dottedStr.split( '.' );
		// check that the array is an array of integers
		for (i=0; i<=3; i++){
			if (octetValsArr[i] == "" || !((0<=octetValsArr[i])&&(255>=octetValsArr[i]))) return null;
		}
		var intIpAddr = parseInt( octetValsArr[0] * Math.pow(2,24))+
						  parseInt( octetValsArr[1] * Math.pow(2,16))+
						  parseInt( octetValsArr[2] * Math.pow(2,8))+
						  parseInt( octetValsArr[3] );
		return intIpAddr;
	}
});

/*
	The 'cp4_maskLengthHybridField' is an extention of TextField which can contain both IPv4 dotted notation (255.255.0.0) address
	or a mask length for an IPv4/IPv6 addresses.
	It is assumed that the component is contained within a 'cp4_hybridFieldCombinedMaskIP' component it has error handeling (IPv4/IPv6) is
	determined by the containing component. (which is determined by the address type entered in the 'cp4_IPHybridField' component)
	It receives a 'IPandMaskValidator' function which is used for further validation as a part of 'cp4_hybridFieldCombinedMaskIP' component
	(and therefor it's value affects the entire component's validity)
*/

Ext.define( 'CP.WebUI4.MaskLengthHybridField',{
    extend: 'CP.WebUI4.TextField',      
    alias: 'widget.cp4_maskLengthHybridField',
	invalidCls: 'webui4-ipfield-invalid',
	msgTarget: 'side',
	fieldLabel: (CP.global.formatNotation == 'Dotted') ? 'Subnet' : 'Mask Length',
	maskRe: (CP.global.formatNotation == 'Dotted') ? /[0-9.]/ : /[0-9]/,
	validateOnChange: false,
	validateOnBlur: true,
    width: 100,
    maxLength: 15,
    enforceMaxLength: true,
    
    constructor: function( config ){
		this.hasFocus = true;
		if (config){
			if (config.fieldConfig){
				if (config.fieldConfig.IPandMaskValidator) this.IPandMaskValidator = config.fieldConfig.IPandMaskValidator;
				if (config.fieldConfig.IPv6Only){
					this.maxLength=3;
					this.maskRe=/[0-9]/;
				}
				this.networkMode = config.fieldConfig.networkMode;
			}
			this.name = (config.id) ? config.id : '';
			this.name = (config.fieldName) ? config.fieldName : '';
		}
        this.callParent([config]);
    }
	
	,validator: function(){
		var res=true;
		var containerCmp = this.ownerCt;
		var ipCmp = containerCmp.items.items[0];
		if ("" != ipCmp.getValue() && "" != this.getValue()){
			if (ipCmp.isIPv4) {
				res =  this.isValidIPv4Mask();
			} else if (ipCmp.isIPv6){
				res = this.isValidIPv6Mask();
			}
			if ((true==res) && this.IPandMaskValidator) {
				this.clearInvalid();
				res = this.IPandMaskValidator();
			}
		}
		return res;
	}
	
	,getMaskLen: function(){
		var i=0;
		var val = this.getValue();
		if (-1 == val.indexOf('.')) {
			return val;
		} else {
			val = (1+ ~this.dottedToInt());
			while (Math.floor(val)){
			
				val/=2;
				i++;
			}
			return 33-i;
		}
	}
	
	,dottedToInt: function(){
		dottedStr = this.getValue();
		if (!dottedStr) return null;
		var octetValsArr = dottedStr.split( '.' );
		// check that the array is an array of integers
		for (i=0; i<=3; i++){
			if (octetValsArr[i] == "" || !((0<=octetValsArr[i])&&(255>=octetValsArr[i]))) return null;
		}
		var intIpAddr = parseInt( octetValsArr[0] * Math.pow(2,24))+
						  parseInt( octetValsArr[1] * Math.pow(2,16))+
						  parseInt( octetValsArr[2] * Math.pow(2,8))+
						  parseInt( octetValsArr[3] );
		return intIpAddr;
	}
	
	,isValidIPv4Mask: function(){
		var val = this.getValue();
		if (CP.global.formatNotation == 'Dotted'){
		
			var octetValsArr = val.split( '.' );
			if (4!=octetValsArr.length){
				return 'Invalid Number of octets';
			}
			for (var i=0; i<=3; i++){
				if (octetValsArr[i] == "" || (!(0<=octetValsArr[i] && 255>=octetValsArr[i]))){
					return  "Invalid IPv4 Value";
				}
			}
			var intMask = this.dottedToInt();
			// Validates the Mask contains continuous 1's
			intMask = ~intMask + 1; //reverse mask and add 1 - if value is valid intMask should be a power of 2.
			if(((intMask-1) & intMask) != 0){ //should return true if it is a power of 2
				return 'Invalid mask: Mask is not continuous bitwise';
			}
			
		} else { // CIDR
			if (!(0<=val && 32>=val)) {
				return  "Invalid Mask length";
			}
		}
		return true
	}
	
	,isValidIPv6Mask: function(){
		var val = this.getValue()
		if (-1 != val.indexOf('.')){
			return 'Invalid mask length.<br>IPv6 mask range is 0-128.';
		}
		var maskLen = parseInt(val);
		
		var maxMaskLen = (this.networkMode) ? 128 : 127;
		
		if (!((0<maskLen)&&(maxMaskLen>=maskLen))){		
			return 'Invalid mask length.<br>IPv6 mask range should be 1-' +maxMaskLen+ '.';
		}
		return true;
	}
});

/*
	The 'cp4_hybridFieldCombinedMaskIP' container component is a combination of an IP address component and an IP address mask component
	(cp4_maskLengthHybridField and cp4_IPHybridField).
	It is assumed that both components are responsible for their own validity and displaying its own errors and that after their
	own validity checks they call uppon the validation function of the container component (validateIPandMask) which is passed
	to them through the constructor. The convention is that all errors emerging from 'validateIPandMask' are displayed on the
	mask length component (cp4_maskLengthHybridField).
*/

Ext.define( 'CP.WebUI4.IPandMaskHybridField',{
	extend: 'CP.WebUI4.Container',      
	alias: 'widget.cp4_hybridFieldCombinedMaskIP',
	networkMode: false,
	loopbackMode: false,
	maskAndIPIsIPv4: false,
	maskAndIPIsIPv6: false,
    width: 600,
    constructor: function( config ){
		this.ipId = (config.ipId) ? config.ipId   :   'maskIP_HybridField_' + Ext.id();
		this.maskLengthId = (config.maskLengthId) ? config.maskLengthId   :  'IPHybridFieldMask_' + Ext.id();
		var netMod = (config.fieldConfig.networkMode || false /*default*/);
		var maskMaxLength=(CP.global.formatNotation == 'Length') ? 3 : 15;
		this.items = 	[	{
								xtype: 'cp4_IPHybridField',
								id: this.ipId,
								fieldName: (config.ipName) ? config.ipName  :  'maskIP_IPHybridField',
								width: (config.width) ? config.width : 365,
								labelWidth: (config.labelWidth) ? config.labelWidth : 145,
								fieldConfig: { 
									IPandMaskValidator: this.validateIPandMask,
									IPv6Only: config.fieldConfig.IPv6Only
								},
								enableKeyEvents:true
							},{
								xtype: 'cp4_maskLengthHybridField',
								id: this.maskLengthId,
								maxLength : maskMaxLength,
								fieldName: (config.maskLengthName) ? config.maskLengthName  :  'maskLength_IPHybridField',
								width: (config.sortMaskWidth) ? config.sortMaskWidth : 365,
								labelWidth: (config.labelWidth) ? config.labelWidth : 145,
								fieldConfig: { 
									IPandMaskValidator: this.validateIPandMask,
									IPv6Only: config.fieldConfig.IPv6Only,
									networkMode: netMod
								}
							}
									
						]
		this.networkMode = netMod;
        this.callParent([config]);
    },
		
	/* This method is planed to run in order to validate the combination of the IP address and its mask
		therefor it should not assume anything about the current object ('this').*/
	validateIPandMask: function(){
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

		function displayErr(hybridField, msg){
			hybridField.setActiveError(msg);
			hybridField.doComponentLayout();
			return msg;
		}

		
		function convertToFullAddressRepresentation (ip){
		
			var len = ip.length;
			if (':'==ip[0]&&':'==ip[1]) ip = ip.substring(1, len);
			if (':'==ip[len-2]&&':'==ip[len-1]) ip = ip.substring(0, len-1);
				
			var fieldArr = ip.split(':');
			var numMissingColons = 8-fieldArr.length;			
			var newAddress = "";
			if (numMissingColons){
				for (var i=0; i<fieldArr.length; i++){
					if (""==fieldArr[i]){
						for (var j=0; j<=numMissingColons; j++){
							newAddress += "0:";
						}
					} else {
						newAddress += (i==fieldArr.length-1) ? fieldArr[i] : fieldArr[i]+":";
					}
				}
			} else
			{
				return ip;
			}
			return newAddress;
		}
	
		function getFieldIntegerRepresentation(hexaStr, len){
		
			var intVal=0;
			var currPower = len; //TODO: tie to the 'i' value
			for (var i=0; i<len; i++){
				var curr = hexaStr.charAt(i);
				curr = (0<=curr && curr<=9) ? curr : (10 + (curr.charCodeAt() - 'a'.charCodeAt()));
				intVal += curr * Math.pow(16, (--currPower));
			}
			return intVal;
		}
		
		function getFieldHexaRepresentation(intRepresentation){
			var hexaRepresentation="";
			var currPower = Math.floor(Math.log(intRepresentation)/Math.log(16)) ;
			var len = currPower;
			
			for (var i=0; i<=len; i++){
				var currInt = (intRepresentation & (~(Math.pow(16, currPower)-1)));
				var currCharInt = currInt / Math.pow(16, (currPower--)); /*current char representation*/
				var curr = currCharInt.toString();
				curr = (0<=currCharInt && currCharInt<=9) ? curr : String.fromCharCode((('a'.charCodeAt()) + currCharInt - 10));
				intRepresentation -= currInt;
				hexaRepresentation += curr;
			}
			return (""==hexaRepresentation) ? "0" : hexaRepresentation;
		}
		
		function IPv6AddressIsZero(ip){
			ipArr = ip.split(":");
			for (var i=0; i<ipArr.length; i++) if ("0" != ipArr[i]) return false;
			return true;
		}
		
		function errIsContainerErr(err, errArray){
			for (var i=0; i<errArray.length; i++){
				if (-1 != err.indexOf(errArray[i])) return true;
			}
			return false;
		}
	
		var errArray = ['Invalid Mask: Masked IPV4 address is zero',
					'Invalid Mask: Masked IPV4 address is not zero',
					'Invalid Mask: Masked IPv6 address is not zero',
					'Invalid Mask: Masked IPv6 address is zero',
					'Both fields are required'
					];

		/* Main Starts Here*/
		var err=true;
		var ipCmp = ('cp4_IPHybridField' == this.xtype ) ? this : this.ownerCt.items.items[0];
		var ip = ipCmp.getValue();
		var maskLenCmp = ('cp4_maskLengthHybridField' == this.xtype ) ? this :   this.ownerCt.items.items[1];
		var maskLen = maskLenCmp.getMaskLen();
		if ('cp4_IPHybridField'==this.xtype ){
			maskLenCmp.validate();
			return true;
		}
		if ("" != (err = maskLenCmp.getActiveError())){
			if ('cp4_maskLengthHybridField'==this.xtype && !errIsContainerErr(err, errArray)){
				return err;
			}
		}

		this.maskAndIPIsIPv4 = ipCmp.isIPv4;
		this.maskAndIPIsIPv6 = ipCmp.isIPv6;
		
		var intMask = ~(Math.pow(2,32-maskLen)-1);
		
		var networkMode = this.ownerCt.networkMode;
		var loopbackMode = this.ownerCt.loopbackMode;
		
		
		var maskedIP = "";
		
		if (ipCmp.isIPv4) {
			var intIpv4Addr = ipCmp.dottedToInt(); 
			// Validates whether the masked IP address is zero or not
			if(networkMode == false){
				if (!((intIpv4Addr | intMask) & (~intMask))) {
					return displayErr(maskLenCmp, errArray[0]);
				}
			} else {
				if (((intIpv4Addr | intMask) & (~intMask)) != 0) {
					return displayErr(maskLenCmp,errArray[1]);
				}
			}
			return true;
		} else if (ipCmp.isIPv6) {
			ip = convertToFullAddressRepresentation(ip);
			ipArr = ip.split(':');
			var i=0;
			for (i=0; i<8; i++){
				if (maskLen>16){
					maskLen -= 16;
					maskedIP += "0:";
				} else {
					var intFieldVal = getFieldIntegerRepresentation(ipArr[i], ipArr[i].length);
					intFieldVal = (intFieldVal & (Math.pow(2, 16-maskLen)-1));
					var MaskedIPRepresentation = getFieldHexaRepresentation(intFieldVal);
					maskedIP += MaskedIPRepresentation + ((i==7) ? "" : ":");
					i++;
					break;
				}
			}
			for (; i<8; i++){
				maskedIP += (i==7) ? ipArr[i]  :  ipArr[i] + ":";
			}
		}
		var isZero = IPv6AddressIsZero(maskedIP);
		if (networkMode && !isZero){
			return displayErr(maskLenCmp,errArray[2]);
		} else if (!networkMode && isZero){
			return displayErr(maskLenCmp,errArray[3]);
		}
		return true;
	},
	clearInvalid: function () {
		var ipCmp=Ext.getCmp(this.ipId);
		var maskLengthCmp=Ext.getCmp(this.maskLengthId); 
		ipCmp.clearInvalid();
		maskLengthCmp.clearInvalid();
	},
	validate: function () {
		if(this.isDisabled()) { return true; }
		var ipCmp=Ext.getCmp(this.ipId);
		var maskLengthCmp=Ext.getCmp(this.maskLengthId); 
		if (!(ipCmp.validate() && maskLengthCmp.validate())) {return false;}
		return true;
	}
		
});



Ext.define( 'CP.WebUI4.DomainnameAndIPv6',{
	extend: 'CP.WebUI4.TextField',       
	alias: 'widget.cp4_domainnameAndIPv6',
	constructor: function( config ){
		if (false == CP.global.isIPv6On){ // prevent ipv6 addresses from being entered
			this.maskRe = /[^:]/ ;
		}
		this.callParent([config]);
	}
	,disabled:true
	,validateOnChange: false
	,validateOnBlur: true
	,isIPv4OrDomain: false
	,isIPv6:false
	
	,validator: function (){
		var val = this.getValue();
		if (val!="" && -1!=val.indexOf(":")) {
			this.isIPv6=true;
			this.isIPv4OrDomain = false;
			return CP.util.isValidIPv6(val);
		} else if (val == ""){
			return true;
		} else {
			this.isIPv6 = false;
			this.isIPv4OrDomain = true;
			if(CP.util.isValidIPv4(val) != true && CP.util.isValidHostName(val) != true) {
				return "invalid IPv4 address or host name";
			}
			return true;
		}
	}
});

/*
 * Fix for CR01521811. This fix comes from:
 *    http://stackoverflow.com/questions/7564527/grid-panel-scrollbars-in-extjs-4-not-working
 *
 * From the author:  "The problem with this is the scroll listener is attached
 * to the div element on the afterrender event, but then if the scrollbar is
 * not needed after a layout operation the div element is removed from the dom.
 * Then, when it's needed again it's added back, but only if enough time has 
 * passed the garbage collection makes extjs recreate the div node and this 
 * time it's added to the dom without attaching the scroll listener again."
 */
Ext.override(Ext.grid.Scroller, {
    onAdded: function() {
        this.callParent(arguments);
        var me = this;
        if (me.scrollEl) {
            me.mun(me.scrollEl, 'scroll', me.onElScroll, me);
            me.mon(me.scrollEl, 'scroll', me.onElScroll, me);
        }
    }
});

/*
 * do html encoding for validtion error tooltip 
 */
Ext.form.field.Base.override({
  setActiveErrors: function(errors) {
    this.callOverridden([Ext.Array.map(errors,Ext.String.htmlEncode)]);
  },
  setActiveError: function(msg) {
    this.callOverridden([Ext.String.htmlEncode(msg)])
  }
});
