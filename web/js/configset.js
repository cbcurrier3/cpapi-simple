CP.Configset = {

init: function() {

    var configsetPanel = new CP.WebUI.DataFormPanel({
        id:"configset-panel"
        ,labelWidth:250
        ,items: [{
		    xtype: "cp_displayfield"
		    ,fieldLabel:"Page Description"
		    ,value:"Settings page for the operating system configuration files located in directory /config/db."
        }]	
        ,listeners: {
            render: CP.Configset.doLoad
        }
    });

    var spacer = new Ext.Spacer({width: 30, height: 15 });
    configsetPanel.add(spacer);

    CP.Configset.addComboboxConfigset(configsetPanel);

    var spacer = new Ext.Spacer({width: 30, height: 20 });
    configsetPanel.add(spacer);

    CP.Configset.addTableConfigset(configsetPanel);

    var obj = {
        title:"Configuration Sets"
        ,panel:configsetPanel
        ,submit:true
        ,submitURL:"/cgi-bin/configset.tcl"
        ,params:{}
        ,beforeSubmit:CP.Configset.beforeSubmit
        ,afterSubmit:CP.Configset.afterSubmit
//        ,helpFile:"configsetHelp.html"
    };

    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);
}

,doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/configset.tcl'
        ,method: 'GET'
	,success: function() {
	    Ext.getCmp("configfile").setValue(Ext.getCmp("configCurr").getValue());
	}
    });
}

,applyConfigset: function() {

    var configfile = Ext.getCmp("configfile").getValue();
    if(Ext.getCmp("configfile").isValid()) {

        var myparams = {} ;

        myparams["configfile" ] = configfile;
        myparams["save" ] = '1';

        Ext.Ajax.request ({
            url: "/cgi-bin/configset.tcl"
            ,params:myparams
            ,method: "POST"
            ,success: CP.Configset.afterConfigsetApply
        });
    }
} //applyConfigset

,addComboboxConfigset: function(obj) {

   var currConfig = new CP.WebUI.DisplayField({    
	id:"configCurr"
        ,name:"configCurr"
        ,fieldLabel:"Current configuration file"
    });

    var configsetComboboxStore = new Ext.data.JsonStore({
        storeId: 'configsetComboboxStore'
        ,autoSave: false
	,proxy: new Ext.data.HttpProxy({
      	    url: "/cgi-bin/configset.tcl"
	    ,method: 'GET'
	})
        ,autoLoad: true
        ,root: 'data.combosets'
        ,fields: [
            {id: 'combo_set', name: 'combo_set'}
        ]
    });

    var setComboConfig = new CP.WebUI.ComboBox({ 
	    fieldLabel:"Select another configuration file to load"
	    ,id:'configfile'
	    ,name:"configfile"
	    ,displayField: 'combo_set'
	    ,valueField: 'combo_set'
	    ,editable:false
	    ,forceSelection:true
	    ,selectOnFocus:true
	    ,triggerAction:"all"
	    ,store:configsetComboboxStore
    });

    var warnCombo = new CP.WebUI.FieldSet({
	id: "warnCombo"
	,border: false
	,labelWidth: 350
	,items: [{
	    xtype: "cp_displayfield"
	    ,id:"warnConfig"
	    ,name:"warnConfig"
	    ,fieldLabel:"Note: Changing the configuration file will require re-login."
	    ,labelSeparator: ''
	}]
    });

    var applyCombo = new CP.WebUI.Button({
        id: "configset_apply"
        ,text: "Apply"
        ,width:100
        ,hideLabel: true
        ,handler: function(){
            CP.Configset.applyConfigset();
        }
    });

    obj.add(currConfig);
    obj.add(setComboConfig);
    obj.add(warnCombo);
    obj.add(applyCombo);
}

,addTableConfigset: function(obj) {

    //Add section title to panel
    var configsetTitle = new CP.WebUI.SectionTitle({
      	titleText: 'Configuration Files'
    });

    //Add buttons to panel
    var configsetButtonsBar = new Ext.Panel({
	cls: 'webui-bbar',
	layout: 'table',
        border: false,
	layoutConfig: {columns: 2},
	items: [{
	    xtype: 'cp_button',
	    text: "Add",
	    id: "add_new_configset_entry",
	    style: 'margin-right:30px;',
	    handler: function(){ 
            	CP.Configset.addNewConfigset('Add a New Configuration File');
            }
        }, {
            xtype: 'cp_button',
            id: "configset_remove_btn",
            text: "Remove",
            disabled: true,
            handler: function() {
            	CP.Configset.showAlertBeforeDeletingConfigset(configsetRowSelect);
            }
	}]
    });

    // Local grid store
    var Configset = Ext.data.Record.create([{
        name: 'combo_set',
        type: 'string'
    }]);
    var configsetTableStore = new Ext.data.JsonStore({
        storeId: 'configsetTableStore'
        ,autoSave: false
        ,url: "/cgi-bin/configset.tcl"
        ,autoLoad: true
        ,root: 'data.combosets'
        ,fields: Configset
    });

    var set_cm = new Ext.grid.ColumnModel({
        columns: [
            {header: 'File' ,id: "file-col" ,dataIndex:"combo_set" ,width: 195
                 ,editable: false 
            }
        ]
        ,defaults: {
            sortable: true
            ,align: 'left'
        }
    });

    var configsetRowSelect = new Ext.grid.RowSelectionModel({
        id: 'configset_row_select'
        ,name: 'configset_row_select'
        ,singleSelect: false
        ,listeners: {
            rowselect: function(sm, row, rec) {
                Ext.getCmp("configset_remove_btn").enable();
            }
            ,beforerowselect: function(sm, row, keepExisting, rec ){
                if (rec.data.combo_set == "initial" || 
                    rec.data.combo_set == Ext.getCmp("configCurr").getValue()){
                    return (false);
                } else { 
                    return (true); 
                }
            }
        }
    });

    var configsetGrid = new CP.WebUI.EditorGridPanel({
        title: "Configuration Sets"
        ,id: "configset-table"
        ,autoHeight: true
        ,autoScroll: true
        ,maxHeight: 120
        ,forceFit: true
        ,width: 250 
        ,stripeRows: true
        ,header: false
        ,loadMask: true
        ,store: configsetTableStore
	,sm: configsetRowSelect
        ,cm: set_cm
        ,viewConfig: {
            forceFit: true
        }
        ,cls:'cp_grid webui-grid'
    });

    // Add title
    obj.add( configsetTitle );

    // Add buttons
    obj.add( configsetButtonsBar );

    // Add table
    obj.add( configsetGrid );
}

,RemoveConfigsets_Entries:function(rowSelectl) {
    var SelectArr = rowSelectl.getSelections();
    var myObj = CP.UI.getMyObj();
    var myparams = myObj.params;   

    for (var i = 0; i < SelectArr.length; i++) {
        myparams[":conf:delete:" + SelectArr[i].data.combo_set] = "t";
    }
    myparams["save" ] = '1';

    Ext.Ajax.request ({
        url: "/cgi-bin/configset.tcl"
        ,params:myparams
        ,method: "POST"
        ,success: CP.Configset.configsetsAfterSubmit
    });
} //RemoveConfigsets_Entries

// show alert before removing the entries
,showAlertBeforeDeletingConfigset: function(rowSelect) {

    CP.WebUI4.Msg.show({
        title: 'Deleting Configuration File Entries'
        ,msg: 'Are you sure you want to delete configuration entries?'
        ,buttons: Ext.Msg.YESNO
        ,fn: function(button, text, opt) {
            if (button == "yes")
                CP.Configset.RemoveConfigsets_Entries(rowSelect);
        }
        ,animEl: 'elId'
        ,icon: Ext.MessageBox.QUESTION
    });
} // showAlertBeforeDeletingConfigset

// the function which stores the configset information to the DB (makes POST)
,AddNewConfigsetEntry: function(add_set) {
    var myObj = CP.UI.getMyObj();
    var myparams = myObj.params;

    myparams[":conf:new"] = add_set;     
    myparams["apply"] = '1';
    myparams["save" ] = '1';
 
    Ext.Ajax.request ({
        url: "/cgi-bin/configset.tcl"
        ,params:myparams
        ,method: "POST"
        ,success: CP.Configset.afterSubmit
    });
} //AddNewConfigsetEntry

//add a new configset window
,addNewConfigset: function(title) {
        
        var winObj = Ext.getCmp('add_configset_window');
        
        if( !winObj ){
                CP.Configset.configsetDeclareWindow() ;
        
                var winObj = Ext.getCmp('add_configset_window');
                if( !winObj ){
                        return;
                }
        }
        
        winObj.setTitle( title );
        winObj.show();        
} //addNewConfigset

//create window
,configsetDeclareWindow: function() {

    //Add form
    var configsetForm = new CP.WebUI.FormPanel({
        bodyStyle: 'padding:10px;',
        id: 'add_configset_form',
        boxMaxHeight:150,
        items: [{
            layout: 'form',
            border: false,
            items: [{
                xtype: 'cp_textfield'
                ,fieldLabel: 'Configuration File'
                ,id: "add_configset"
                ,name: "add_configset"
                ,width: 200
            }]
        }],              
        //Save and cancel buttons
        buttons: [{
            text: 'OK',
            xtype: 'cp_button',
            handler: function(){
                if ( (Ext.getCmp("add_configset").getValue() != "" &&  
                      Ext.getCmp("add_configset").isValid()) ) {
                    CP.Configset.AddNewConfigsetEntry( Ext.getCmp('add_configset').getValue() );
                    Ext.getCmp( 'add_configset_window' ).hide();
                }
            }
        },{
            text: 'Cancel',
            xtype: 'cp_button',
            handler: function(){
                Ext.getCmp( 'add_configset_window' ).hide();
            }         
        }]
    });

    //Modal window for add
    var configsetModalWin = new CP.WebUI.ModalWin({
        id: 'add_configset_window',
        width: 500,
        height: 150,
        items: [ Ext.getCmp('add_configset_form') ]
    });
} //trapDeclareWindow

,beforeSubmit:function(panel){

}

,afterSubmit:function(form, action){
    //reload the page
    CP.Configset.init();
}

,configsetsAfterSubmit:function() {
    var configsetsGrid = Ext.getCmp("configset-table");
    var configsetsStore = configsetsGrid.getStore();
    configsetsStore.reload(configsetsStore.lastOptions);
    Ext.getCmp("configset_remove_btn").disable();
} // configsetsAfterSubmit

}
