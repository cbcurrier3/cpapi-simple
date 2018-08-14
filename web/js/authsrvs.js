CP.AuthSrvs = {
        
    FORM_ADD: 'form_add_mode',
    FORM_EDIT: 'form_edit_mode',
    FORM_DEL: 'form_delete_mode',
    MODAL_WIN_ID: 'AuthSrvs_modal_window',
	TACACS_MODAL_WIN_ID: 'AuthSrvs_tacacs_modal_window',
    SERVER_STORE: null,
    SERVER_STORE_TAC: null,
	SERVER_STORE_SHELLS: null,
    myStore: null,
    nasIP: null,
    suUid: null,
    interfaces: null,
    applyState: false,
	tacacsConfChange: false, // e.g. user UID
    submitServer:"",
    submitType:"",
    NO_NAS_IP: "No NAS IP",
    DEFAULT_RADIUS_PORT: 1812,

    init:function() {
        // and go and display them
        var page = {
            title: "Authentication Servers",
            submitURL: "/cgi-bin/authsrvs.tcl",
            params: {},
            afterSubmit: CP.AuthSrvs.afterSubmit,
            panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
                id: 'authsrvs-panel',
                items: CP.AuthSrvs.getPageItems()
            })
        };

        //display the page in mainframe
        CP.UI.updateDataPanel( page );
    }

  
    ,getPageItems: function(){
        CP.AuthSrvs.createStore ();
	// store: holds the data we receive from authsrvs.tcl
        CP.AuthSrvs.SERVER_STORE = Ext.create( 'CP.WebUI4.JsonStore',{
            fields: [ 'priority',
                      'old_priority',
                      'host',
                      {name:'port', type:'int', defaultValue:'1812'},
                      'secret',
                      'timeout' ],
            proxy: {
                type: 'ajax',
                url: '/cgi-bin/authsrvs.tcl',
                reader: {
                    type: 'json',
                    root: 'data.classes[0].entries'
                }
            }
        });
        CP.AuthSrvs.SERVER_STORE_TAC = Ext.create( 'CP.WebUI4.JsonStore',{
            fields: [ 'priority',
                      'old_priority',
                      'host',
                      'secret',
					  'timeout',
					  'pass_exist',
					  'state'
                      ],
            proxy: {
                type: 'ajax',
                url: '/cgi-bin/authsrvs.tcl',
                reader: {
                    type: 'json',
                    root: 'data.classes[1].entries'
                }
            }
        });
        
		// load shells store with availshells data
        CP.AuthSrvs.SERVER_STORE_SHELLS = Ext.create('CP.WebUI4.JsonStore', {
            fields : [ 'myshell' ],
			proxy: {
                type: 'ajax',
                url: '/cgi-bin/authsrvs.tcl',
                reader: {
                    type : 'json',
                    root: 'data.classes[0].shellsList'
                }
            }
        });
		CP.AuthSrvs.SERVER_STORE_SHELLS.load(function () {Ext.getCmp("defShellBox").on('change',function () {Ext.getCmp('applyButton').enable();});});
		
        // columns
        var cols = [
            { header: 'Priority', width: 60, dataIndex: 'priority', flex:1 }
           ,{ header: 'Host Address', width: 270, dataIndex: 'host' }
           ,{ header: 'UDP Port', width: 80, dataIndex: 'port', flex:1 }
           ,{ header: 'Timeout', width: 60, dataIndex: 'timeout', flex:1 }
        ];
		
		
		// columns
        var tacacsCols = [
            { header: 'Priority', width: 60, dataIndex: 'priority', flex:1 }
           ,{ header: 'IP Address', width: 270,dataIndex: 'host' }
		   ,{ header: 'Timeout', width: 60,dataIndex: 'timeout' }
        ];
		
            
        var items = [{
            //Add section title to panel
            xtype: 'cp4_sectiontitle',
            titleText: 'RADIUS Servers'
        },{
            //Add buttons to panel
            xtype: 'cp4_btnsbar',
            items: [{
                text: 'Add',
                handler: Ext.Function.bind( CP.AuthSrvs.openModalWin, this, ['Add new RADIUS Server', CP.AuthSrvs.FORM_ADD])
            },{
                id: "authsrv-edit-btn",
                text: 'Edit',
                disabled: true,
                handler: Ext.Function.bind( CP.AuthSrvs.openModalWin, this, ['Edit RADIUS Server', CP.AuthSrvs.FORM_EDIT])
            },{
                text: "Delete",
                id: "authsrv-remove-btn",
                disabled: true,
                handler: Ext.Function.bind( CP.AuthSrvs.openModalDelete, this, ['RADIUS'])
            }]
        },{
            // the table (or 'grid' in extjs's terminology)
            xtype: 'cp4_grid',
            id: 'authsrv-grid'
            ,columns: cols
            ,store: CP.AuthSrvs.SERVER_STORE
            ,autoHeight: true
            ,autoScroll: true
            ,maxHeight: 120
            ,width: 500
            ,listeners: {
                itemdblclick: {                                                                                                              
                  fn: function( grid, rowIndex, event ){
                      var rowClicked = grid.getStore().getAt(rowIndex);
                  }
              },
              selectionchange: function(sm, row, rec) {
                  Ext.getCmp("authsrv-edit-btn").enable();
                  Ext.getCmp("authsrv-remove-btn").enable();
              }
            }
        },{
		// combobox for NAS IP-Address selection
		xtype: 'cp4_combobox',
                id: 'interfacesBox',
                name: 'interfacesBox',
                fieldLabel: 'Network Access Server (NAS)',
                labelWidth: 175,
                displayField: 'interface',
                selectOnFocus: true,
                forceSelection: true,
                editable: false,
		width: 470,
		store: CP.AuthSrvs.myStore,
                listeners: {
			change : function(){
				Ext.getCmp('applyButton').enable();
			}
		}
	},{
		// information message for the NAS IP-Address
		xtype: 'cp4_inlinemsg'
		,text: 'If no NAS IP Address was chosen, the IPv4 address that matches the host name will be used by default. Click <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/hosts_dns\');return false;">here</a> to configure the host address.'
	},{
		// spacer for better looks
		xtype: 'tbspacer'
		,height: 20
	},{	

			xtype       : "cp4_label"
           ,cls        : "webui4-section-title span"
           ,html       : "<span>"+ "RADIUS Servers Advanced Configuration" +"</span>"
	},{
			// spacer for better looks
			xtype: 'tbspacer'
			,height: 12
	},{		// combobox for default shell selection
		xtype: 'cp4_combobox',
                id: 'defShellBox',
                name: 'defShellBox',
			fieldLabel: 'RADIUS Users Default Shell',
			store: CP.AuthSrvs.SERVER_STORE_SHELLS,
            displayField: 'myshell',
                labelWidth: 175
	},{	
		// combobox for super user uid selection
		xtype: 'cp4_combobox',
                id: 'suUidBox',
                name: 'suUidBox',
                fieldLabel: 'Super User UID',
                labelWidth: 175,
                selectOnFocus: true,
                forceSelection: true,
                editable: false,
		width: 300,
		store: [['0', '0'], ['96', '96']],
                listeners: {
			change : function(){
				Ext.getCmp('applyButton').enable();
			}
		}

	},{
		// information message for the super-user-uid
		xtype: 'cp4_inlinemsg'
		,text: 'Remote users with RADIUS attribute "Super User" will login with this UID.'
	},{		
		// spacer for better looks
		xtype: 'tbspacer'
		,height: 10
	},{		
		// apply button
		xtype:'cp4_button'
		,id: "applyButton"
		,text: 'Apply'
		,disabled: true
		,handler: function ()
		{
			CP.AuthSrvs.applyHandler ();
		}
	}
	,{		
		// spacer for better looks
		xtype: 'tbspacer'
		,height: 10
	},
	{
            //Add section title to panel
            xtype: 'cp4_sectiontitle',
            titleText: 'TACACS+ configuration'
    },{
			xtype: 'cp4_checkbox',
			boxLabel:'Enable TACACS+ authentication',                   
			id: 'tacacsState',
			name: 'state',
			store: CP.AuthSrvs.SERVER_STORE_TAC,
			margin: '0 0 20 5',
			handler: function( checkbox, isChecked ) {
					
					if( checkbox.originalValue != checkbox.getValue() ){
						Ext.getCmp('applyStateButton').enable();
					}
					else{
						Ext.getCmp('applyStateButton').disable();
					}
			}
	},{		
		// apply button
		xtype:'cp4_button'
		,id: "applyStateButton"
		,text: 'Apply'
		,disabled: true
		,handler: function ()
		{
			CP.AuthSrvs.applyStateHandler ();
		}
	
	},{
            //Add section title to panel
            xtype: 'cp4_sectiontitle',
            titleText: 'TACACS+ Servers'
    },{
            //Add buttons to panel
            xtype: 'cp4_btnsbar',
            items: [{
				id:"authsrv-add-tacacs-btn",
                text: 'Add',
                handler: Ext.Function.bind( CP.AuthSrvs.openTacacsModalWin, this, ['Add new TACACS+ Server', CP.AuthSrvs.FORM_ADD])
            },{
                id: "authsrv-edit-tacacs-btn",
                text: 'Edit',
                disabled: true,
                handler: Ext.Function.bind( CP.AuthSrvs.openTacacsModalWin, this, ['Edit TACACS+ Server', CP.AuthSrvs.FORM_EDIT])
            },{
                text: "Delete",
                id: "authsrv-remove-tacacs-btn",
                disabled: true,
                handler: Ext.Function.bind( CP.AuthSrvs.openModalDelete, this, ['TACACS+'])
				
            }]
        },{
            // the table (or 'grid' in extjs's terminology)
            xtype: 'cp4_grid',
            id: 'authsrv-grid-tacacs'
            ,columns: tacacsCols
            ,store: CP.AuthSrvs.SERVER_STORE_TAC
            ,autoHeight: true
            ,autoScroll: true
			,height: 133
            ,width: 410
            ,listeners: {
                itemdblclick: {                                                                                                              
                  fn: function( grid, rowIndex, event ){
					CP.AuthSrvs.openTacacsModalWin('Edit TACACS+ Server',CP.AuthSrvs.FORM_EDIT);
                  }
              },
              selectionchange: function(sm, row, rec) {
                  Ext.getCmp("authsrv-edit-tacacs-btn").enable();
                  Ext.getCmp("authsrv-remove-tacacs-btn").enable();
              }
            }
        },{
			// spacer for better looks
			xtype: 'tbspacer'
			,height: 20
		},{	

			xtype       : "cp4_label"
			,cls        : "webui4-section-title span"
			,html       : "<span>"+ "TACACS+ Servers Advanced Configuration" +"</span>"
		},{
				// spacer for better looks
			xtype: 'tbspacer'
			,height: 12
		},{	
			// combobox for user uid selection
			xtype: 'cp4_combobox',
			id: 'tacacsUidBox',
			name: 'tacacsUidBox',
			fieldLabel: 'User UID',
			labelWidth: 175,
			selectOnFocus: true,
			forceSelection: true,
			editable: false,
			width: 300,
			store: [['0', '0'], ['96', '96']],
			listeners: {
				change : function(){
					Ext.getCmp('applyUidButton').enable();
				}
			}

		},{
			// information message for the super-user-uid
			xtype: 'cp4_inlinemsg'
			,text: 'TACACS+ users will login with this UID.'
		},{		
			// spacer for better looks
			xtype: 'tbspacer'
			,height: 10
		},{		
			// apply button
			xtype:'cp4_button'
			,id: "applyUidButton"
			,text: 'Apply'
			,disabled: true
			,handler: function ()
			{
				CP.AuthSrvs.applyTacacsHandler();
			}
        }
	];
	

	// run a query and TACACS+ data.
	CP.AuthSrvs.getTacacsData() ;
		
	CP.AuthSrvs.getInterfaceData();
        return items;
    }
    
    
    ,openModalWin: function( title, formType ){
		CP.AuthSrvs.submitServer = "RADIUS";
		CP.AuthSrvs.submitType=formType;
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: CP.AuthSrvs.MODAL_WIN_ID,
            title: title,
            width: 468,
            height: 269,
            items: [{
                xtype: 'cp4_formpanel',
                id: 'authServers_form_wrapper',
                bodyPadding: 15,
                items: [{
                    // form field: 'Priority'
                    xtype: 'cp4_numberfield',
                    id: 'authSrvs-form-field-radius-priority',
                    name: 'priority',
                    fieldLabel: 'Priority',
                    invalidText: 'Invalid priority: must be an integer in the range of (-999) to 999',
                    minValue: -999,
                    maxValue: 999,
                    value: CP.AuthSrvs.getDefaultPriority(),
                    allowBlank: false
                },{
                    // form field: 'Host': ipv4 address or host name
                    xtype: 'cp4_textfield',
                    id: 'authSrvs-form-field-radius-host',
                    name: 'host',
                    fieldLabel: 'Host',
                    vtype: 'hostnameIPv6',
                    validateOnChange: false,
                    width: 365
                },{
                    //UDP Port
                    xtype: 'cp4_positiveint',
                    id: 'authSrvs-form-field-radius-port',
                    name: 'port',
                    fieldLabel: 'UDP Port',
                    minValue: 1,
                    maxValue: 65535,
                    value: 1812,
                    allowBlank: false 
                },{
                    // form field: 'Secret'
                    xtype: 'cp4_password',
                    id: 'authSrvs-form-field-radius-secret',
                    name: 'secret',
                    fieldLabel: 'Shared Secret',
                    maxLength: 256,
                    allowBlank: false,
                    validator: function(value){
                        // can't include space or newline.
                        if (/(\s|\n)/.test(value)) {
                          return "Invalid shared secret: may not contain space or newline";
                        } 
                        return true;
                    }
                },{
                    // information message for the super-user-uid
                    xtype: 'cp4_inlinemsg'
                    ,text: 'Set this timeout, so that the sum of all RADIUS server timeouts is less than 50'
                },{
                    // spacer for better looks
                    xtype: 'tbspacer'
                    ,height: 10
                },{
                    // form field: 'Timeout'
                    xtype: 'cp4_positiveint',
                    id: 'authSrvs-form-field-radius-timeout',
                    name: 'timeout',
                    fieldLabel: 'Timeout in Seconds',
                    minValue: 1,
                    maxValue: 50,
                    value: 3
                }],
                buttons: [{
                    xtype: 'cp4_button',
                    id: 'save_btn',
                    text: 'OK',
                    handler: Ext.Function.bind( CP.AuthSrvs.saveHandler, this, [formType,'RADIUS'])
                },{
                    xtype: 'cp4_button',
                    text: 'Cancel',
                    handler: function(){
                        Ext.getCmp( CP.AuthSrvs.MODAL_WIN_ID ).close();
                    }
                }]
            }],
            listeners: {
                afterrender: function(){
                    if( formType == CP.AuthSrvs.FORM_EDIT ){
                        //on edit: load data from selected row in table to the fields in the modal window
                        var selectedRecord = Ext.getCmp( 'authsrv-grid' ).getSelectionModel().getLastSelected();
                        Ext.getCmp( 'authServers_form_wrapper' ).getForm().loadRecord( selectedRecord );
                        Ext.getCmp( 'authSrvs-form-field-radius-priority' ).disable();
                        Ext.getCmp( 'authSrvs-form-field-radius-secret' ).allowBlank = true;
                    }
                }
            }
        }).show();
    },
	
	openTacacsModalWin: function( title, formType ){
	
		CP.AuthSrvs.submitServer = "TACACS+";
		CP.AuthSrvs.submitType=formType;
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: CP.AuthSrvs.TACACS_MODAL_WIN_ID,
            title: title,
            width: 400,
            height: 205,
            items: [{
                xtype: 'cp4_formpanel',
                id: 'authServers_form_wrapper_tacacs',
                bodyPadding: 15,
                items: [{

                    // form field: 'Priority'
                    xtype: 'cp4_numberfield',
                    id: 'authSrvs-form-field-tacacs-priority',
                    name: 'priority',
                    fieldLabel: 'Priority',
                    invalidText: 'Invalid priority: must be an integer in the range of 1 to 20',
                    minValue: 1,
                    maxValue: 20,
                    value: 1,
                    allowBlank: false,
					validator: function(value){
					
						var  prevPrio = -1;
						if(formType == CP.AuthSrvs.FORM_EDIT){
							prevPrio  = Ext.getCmp( 'authsrv-grid-tacacs' ).getSelectionModel().getLastSelected().data.priority;
						}

						var prio = Ext.getCmp('authSrvs-form-field-tacacs-priority').getValue();
						var duplicate = false;
						CP.AuthSrvs.SERVER_STORE_TAC.each(function(rec){
							if(rec.get('priority') == prio && rec.get('priority') != prevPrio){
								duplicate = true;
							}
							return true;		
						},this);
						
						if(duplicate == true){
							return "This priority is used by another TACACS+ server";
						}
						return true;
					}
				
                },{
					// form field: 'Server'
					xtype: 'cp4_ipv4field',
                    id: 'authSrvs-form-field-tacacs-server',
                    name: 'host',
                    fieldLabel: 'Server',
                    width: 365

                },{
                    // form field: 'Key'
                    xtype: 'cp4_password',
                    id: 'authSrvs-form-field-tacacs-key',
                    name: 'secret',
                    fieldLabel: 'Shared Key',
					emptyText : "",
                    maxLength: 256,
                    allowBlank: false,
                    validator: function(value){
                        // can't include space or newline.
                        if (/(\s|\n|\t|\\$)/.test(value)) {
                          return "Invalid shared key: may not contain space or end with backslash";
                        } 
                        return true;
                    }
                },{
                    // form field: 'Timeout'
                    xtype: 'cp4_positiveint',
                    id: 'authSrvs-form-field-tacacs-timeout',
                    name: 'timeout',
                    fieldLabel: 'Timeout in Seconds',
                    minValue: 1,
                    maxValue: 60,
                    value: 5
                }],
                buttons: [{
                    xtype: 'cp4_button',
                    id: 'save_btn',
                    text: 'OK',
                    handler: Ext.Function.bind( CP.AuthSrvs.saveHandler, this, [formType,'TACACS+'])
                },{
                    xtype: 'cp4_button',
                    text: 'Cancel',
                    handler: function(){
                        Ext.getCmp( CP.AuthSrvs.TACACS_MODAL_WIN_ID ).close();
                    }
                }]
            }],
            listeners: {
                afterrender: function(){
                    if( formType == CP.AuthSrvs.FORM_EDIT ){
                        //on edit: load data from selected row in table to the fields in the modal window
                        var selectedRecord = Ext.getCmp( 'authsrv-grid-tacacs' ).getSelectionModel().getLastSelected();
                        Ext.getCmp( 'authServers_form_wrapper_tacacs' ).getForm().loadRecord( selectedRecord );
						Ext.getCmp( 'authSrvs-form-field-tacacs-server' ).setValue(selectedRecord.data.host); 
						Ext.getCmp( 'authSrvs-form-field-tacacs-priority' ).allowBlank= true; 
						
						var passCmp = Ext.getCmp('authSrvs-form-field-tacacs-key');
						var isPassExist = selectedRecord.data.pass_exist;
						
						if (passCmp && Ext.isIE){
							passCmp.emptyText = '';
							for (var i=0; i < isPassExist; i++) passCmp.emptyText += '*';
						} else {
							passCmp.emptyText = (isPassExist) ? "Key is set" : "";   
						}
						passCmp.reset();

                    }
                }
            }
        }).show();
    }
    
    
    // makeDefaultPriority: choose a priority number for a new server.
    // It's just a default, the user can edit and change it and so on.
    // If they don't modify it, here's the behavior they get: The new server
    // comes after all the old ones they configured (ie, it has a higher priority).
    ,getDefaultPriority: function(){
        var maxPriority = 999;
        var store = CP.AuthSrvs.SERVER_STORE;

        function checkPriority( priority ){
            var recFound = store.findExact( 'priority',priority );
            if( !recFound ){
                return priority;
            }
            else{
                return null;
            }
        }
        
        for( var i=0 ; i<=maxPriority ; i++ ){
            var priority = checkPriority( i );
            if( priority == null ){
                continue;
            }
            return priority;
        }
    }
    
    
    ,openModalDelete: function( message){
	
		CP.AuthSrvs.submitServer = message;
		CP.AuthSrvs.submitType = CP.AuthSrvs.FORM_DEL;
		if(message == 'RADIUS'){
			var selectedRecord = Ext.getCmp( 'authsrv-grid' ).getSelectionModel().getLastSelected();
			if(!selectedRecord){
				return;
			}
		}
		if(message == 'TACACS+'){
			var selectedRecord = Ext.getCmp( 'authsrv-grid-tacacs' ).getSelectionModel().getLastSelected();
			if(!selectedRecord){
				return;
			}
		}
		
        CP.WebUI4.Msg.show({
			title: 'Remove '+ message +' Server',
			msg: 'Are you sure you want to remove the selected '+message+' server?',
            icon: 'webui-msg-question',
            buttons: Ext.Msg.OKCANCEL,
            fn: function( btn, text ){
                if( btn == 'cancel' ){
                    return;
                }
                CP.AuthSrvs.saveHandler( CP.AuthSrvs.FORM_DEL , message ); 
            }
        });
    }
    
      
    ,saveHandler: function( formType , message ){
        if( formType != CP.AuthSrvs.FORM_DEL ){ 
		
				//close window after success
			var modalWin = Ext.getCmp( CP.AuthSrvs.MODAL_WIN_ID );
			if (modalWin)
			{
				//run form validations on add/edit
				if( Ext.getCmp( 'authServers_form_wrapper' ).getForm().isValid() == false ){
					return;
				}
			}
			var modalTacacslWin = Ext.getCmp( CP.AuthSrvs.TACACS_MODAL_WIN_ID );
			if (modalTacacslWin)
			{	
				//run form validations on add/edit
				if( Ext.getCmp( 'authServers_form_wrapper_tacacs' ).getForm().isValid() == false ){
					return;
				}
			}
      
        }

        //set params to be posted to server
		if(message == 'RADIUS'){
			if (!CP.AuthSrvs.setChangedParams( formType )) {
				return;
			}
		}
		if(message == 'TACACS+'){
			 CP.AuthSrvs.setTacacsChangedParams( formType );
		}
        //submit form
        CP.UI.submitData( CP.UI.getMyObj());
    }
    
    
    ,setChangedParams: function( formType ) {
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
        var params = pageObj.params;
        var paramsKey = 'authSrvs:radius';
        //get fields
        var priorityFld = Ext.getCmp( 'authSrvs-form-field-radius-priority' );
        var hostFld = Ext.getCmp( 'authSrvs-form-field-radius-host' );
        var portFld = Ext.getCmp( 'authSrvs-form-field-radius-port' );
        var secretFld = Ext.getCmp( 'authSrvs-form-field-radius-secret' );
        var timeoutFld = Ext.getCmp( 'authSrvs-form-field-radius-timeout' );
        
        switch( formType ){
            case CP.AuthSrvs.FORM_ADD: 
                //add new server
				var priority=priorityFld.getValue();
				if (CP.AuthSrvs.SERVER_STORE.findExact("priority",priority)!=-1) {
					priorityFld.markInvalid("The priority already exist");
					return false;
				}
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
                params[ serverKey ] = 't';
                params[ serverKey +':host' ] = hostFld.getValue();
				if(portFld.getValue()) {
					params[ serverKey +':port' ] = portFld.getValue();
				} else {
					params[ serverKey +':port' ] = CP.AuthSrvs.DEFAULT_RADIUS_PORT;
				}
                params[ serverKey +':secret' ] = secretFld.getValue();
                params[ serverKey +':timeout' ] = timeoutFld.getValue();
            break;
            case CP.AuthSrvs.FORM_EDIT:
                //edit exsiting server
                var selectedRecord = Ext.getCmp( 'authsrv-grid' ).getSelectionModel().getLastSelected();
                var recData = selectedRecord.data;
                var priority = recData.priority;
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
                params[ serverKey ] = 't';
                params[ serverKey +':host' ] = hostFld.getValue();
                params[ serverKey +':port' ] = portFld.getValue();
                if (secretFld.getValue() === "" && recData.old_priority !== "") {
                        params[ serverKey +':secret-from' ] = recData.old_priority;
                } else {
                        params[ serverKey +':secret' ] = secretFld.getValue();
                }
                params[ serverKey +':timeout' ] = timeoutFld.getValue();
            break;
            case CP.AuthSrvs.FORM_DEL:
                //delete server
                var selectedRecord = Ext.getCmp( 'authsrv-grid' ).getSelectionModel().getLastSelected();
                var priority = selectedRecord.data.priority;
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
                //params[ serverKey ] = '';
            break;
        }
		return true;
    }
	
	,setTacacsChangedParams: function( formType ) {
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
        var params = pageObj.params;
        var paramsKey = 'authSrvs:tacacs';
        //get fields
        var priorityFld = Ext.getCmp( 'authSrvs-form-field-tacacs-priority' );
        var hostFld = Ext.getCmp( 'authSrvs-form-field-tacacs-server' );
        var secretFld = Ext.getCmp( 'authSrvs-form-field-tacacs-key' );
		var timeoutFld = Ext.getCmp( 'authSrvs-form-field-tacacs-timeout' );
        
        switch( formType ){
            case CP.AuthSrvs.FORM_ADD: 
                //add new server
                var priority = priorityFld.getValue();
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
                params[ serverKey ] = 't';
                params[ serverKey +':host' ] = hostFld.getValue();
                params[ serverKey +':secret' ] = secretFld.getValue();
				params[ serverKey +':timeout' ] = timeoutFld.getValue();
            break;
            case CP.AuthSrvs.FORM_EDIT:
                //edit exsiting server
                var selectedRecord = Ext.getCmp( 'authsrv-grid-tacacs' ).getSelectionModel().getLastSelected();
                var recData = selectedRecord.data;
                var priority = priorityFld.getValue();
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
                params[ serverKey ] = 't';
				params[ serverKey +':oldPrio' ] = recData.old_priority;
                params[ serverKey +':host' ] = hostFld.getValue();
                if (secretFld.getValue() == "" && recData.old_priority != "") {
                        params[ serverKey +':secret-from' ] = recData.old_priority;
                } else {
                        params[ serverKey +':secret' ] = secretFld.getValue();
                }
				params[ serverKey +':timeout' ] = timeoutFld.getValue();
            break;
            case CP.AuthSrvs.FORM_DEL:
                //delete server
                var selectedRecord = Ext.getCmp( 'authsrv-grid-tacacs' ).getSelectionModel().getLastSelected();
                var priority = selectedRecord.data.priority;
                var serverKey = paramsKey +':'+ priority;
                params[ paramsKey +':-:priority' ] = priority;
            break;
        }
    }
        

    ,afterSubmit: function(form, action){
		if(CP.AuthSrvs.applyState == false && CP.AuthSrvs.tacacsConfChange == false){ 
			 
			if(CP.AuthSrvs.submitServer == "RADIUS"){
				var grid = Ext.getCmp( 'authsrv-grid' );
				grid.getStore().load();
				grid.doComponentLayout();
				Ext.getCmp( 'authsrv-edit-btn' ).disable();
				Ext.getCmp( 'authsrv-remove-btn' ).disable();
				if (CP.AuthSrvs.submitType ==  CP.AuthSrvs.FORM_ADD) {
					CP.WebUI4.Msg.show({
								title:'Add RADIUS server'
								, msg: "Please make sure you do not configure the same user names on this RADIUS server and locally"
								, buttons: Ext.Msg.OK
								, icon:  Ext.MessageBox.WARNING
								, animEl: 'elId'
							});
				}
			
			}
			if(CP.AuthSrvs.submitServer == "TACACS+"){
				var gridTacacs = Ext.getCmp( 'authsrv-grid-tacacs' );
				gridTacacs.getStore().load();
				gridTacacs.doComponentLayout();
				Ext.getCmp( 'authsrv-edit-tacacs-btn' ).disable();
				Ext.getCmp( 'authsrv-remove-tacacs-btn' ).disable();
				if (CP.AuthSrvs.submitType ==  CP.AuthSrvs.FORM_ADD) {
					CP.WebUI4.Msg.show({
								title:'Add TACACS+ server'
								, msg: "Please make sure you do not configure the same user names on this TACACS+ server and locally"
								, buttons: Ext.Msg.OK
								, icon:  Ext.MessageBox.WARNING
								, animEl: 'elId'
							});
				}
			}
			
			//close window after success
			var modalWin = Ext.getCmp( CP.AuthSrvs.MODAL_WIN_ID );
			if (modalWin)
			{
				modalWin.close();
			}
			
			var modalTacacslWin = Ext.getCmp( CP.AuthSrvs.TACACS_MODAL_WIN_ID );
			if (modalTacacslWin)
			{
				modalTacacslWin.close();
			}
		}
		CP.AuthSrvs.submitServer = "";
		CP.AuthSrvs.submitType = "";
		CP.AuthSrvs.tacacsConfChange = false;
		CP.AuthSrvs.applyState = false;	
    }
    
    // this function creates the store which holds the interfaces (curretnly interfaces which has IP) data
    ,createStore : function() {
		 CP.AuthSrvs.myStore = Ext.create( 'CP.WebUI4.JsonStore',{
			storeID: "nasIPStore",
			fields: ['interface', 'nasIP'],
			proxy: {
				type: 'ajax',
				url : '/cgi-bin/authsrvs.tcl',
				reader: {
					type: 'json',
					root: 'data.classes[0].interfaces'
				}
			}
			,autoLoad: false
			,sorters: [{
				    property : 'interface',
				    direction: 'ASC'
				  }]
		});
    }
    
	// this function fills the interfaces store with the relevant data
	,getInterfaceData : function ()
	{
		Ext.Ajax.request({
			url: '/cgi-bin/authsrvs.tcl'
			, method: 'GET'
			, success: function(response) 
			{
				var jsonData = Ext.decode(response.responseText);
				if (jsonData.data)
				{
					CP.AuthSrvs.nasIP = jsonData.data.classes[0].nasIP;
					CP.AuthSrvs.defShell = jsonData.data.classes[0].defShell;
					CP.AuthSrvs.suUid = jsonData.data.classes[0].suUid;
					CP.AuthSrvs.interfaces = jsonData.data.classes[0].interfaces;
				}

				var interfaces = [];
				var tokens;
				var nasIP = null;
				for (i = 0; i < CP.AuthSrvs.interfaces.length; i++)
				{
					tokens = CP.AuthSrvs.interfaces[i].interface.split ("-");
					if (tokens.length < 3)
					{
						interfaces.push ({interface : tokens[0] + " : " + tokens[1]});
						if (tokens[1] == CP.AuthSrvs.nasIP)
						{
							nasIP = interfaces[i].interface;
						}
					} else
					{
						interfaces.push ({interface : tokens[0] + "-" + tokens[1] + " : " + tokens[2]});
						 if (tokens[2] == CP.AuthSrvs.nasIP)
                                                {
                                                        nasIP = interfaces[i].interface;
                                                }
					}
				}
				// adding empty line to the store - for the purpose of NAS-IP deletion
				if (interfaces.length > 0)
				{
					interfaces.push ({interface : CP.AuthSrvs.NO_NAS_IP});
				}
				Ext.getCmp('interfacesBox').getStore().loadData(interfaces);
				if(!nasIP)
					nasIP = CP.AuthSrvs.NO_NAS_IP;
				Ext.getCmp('interfacesBox').setValue (nasIP);
				Ext.getCmp('defShellBox').setValue(CP.AuthSrvs.defShell);
				Ext.getCmp('suUidBox').setValue(CP.AuthSrvs.suUid);

				Ext.getCmp('applyButton').disable();
				//clear dirty flag
				CP.util.clearFormInstanceDirtyFlag(Ext.getCmp('authsrvs-panel').getForm());
				
			}		
		});
	}
	
	
	// this function fills the interfaces store with the relevant data
	,getTacacsData : function ()
	{
		Ext.Ajax.request({
			url: '/cgi-bin/authsrvs.tcl'
			, method: 'GET'
			, success: function(response) 
			{	
					var jsonData = Ext.decode(response.responseText);
					if (jsonData.data) {
						var state = jsonData.data.classes[1].state;
						var stateCheckbox = Ext.getCmp('tacacsState') ;
						if(state == "on"){
							stateCheckbox.setValue(true);
						}
						else{
							stateCheckbox.setValue( false);
						}
						stateCheckbox.originalValue  = stateCheckbox.getValue();
						Ext.getCmp('applyStateButton').disable();

						var tacacsUid = jsonData.data.classes[1].tacacsUid;
						Ext.getCmp('tacacsUidBox').setValue(tacacsUid);
						Ext.getCmp('applyUidButton').disable();
						
						CP.util.clearFormInstanceDirtyFlag(Ext.getCmp('authsrvs-panel').getForm());
					}
			}		
					
		});
	}
	
	
	// this function posts tha NAS IP-Address and Super-User-uid information
	,applyHandler:function() 
	{
		var nasIP = Ext.getCmp('interfacesBox').getValue ();
		var defShell = Ext.getCmp('defShellBox').getValue ();
		if(nasIP == CP.AuthSrvs.NO_NAS_IP)
			nasIP = "";
		var suUid = Ext.getCmp('suUidBox').getValue ();
		var tokens;
		var myparams = {};
		// if the empty field was chosen the current NAS-IP should be deleted
		if (nasIP===null || nasIP === "")
		{
			myparams['nasIP'] = "deleteIP";
		}
		else
		{
			if(nasIP) 
			{
				tokens = nasIP.split (" : ");
				if (tokens.length >= 2)
				{
					myparams['nasIP'] = tokens[1];
				}
			}
		}
		myparams['defShell'] = defShell;
		myparams['suUid'] = suUid; 
		
		myparams['save'] = '1';

		Ext.Ajax.request({
		    url: '/cgi-bin/authsrvs.tcl',
		    params: myparams,
		    method: 'POST',
		    success: function() {
			CP.AuthSrvs.getInterfaceData ();
		    }
		});
	}
    
	,applyTacacsHandler: function()
	{
	
		var myparams = {};
		var tacUid  = Ext.getCmp('tacacsUidBox');
		myparams['tacacsUid'] = tacUid.getValue ();
		myparams['save'] = '1';
	
		var page = CP.UI.getMyObj();
		page.params = {};
		page.params = myparams;
	
		CP.AuthSrvs.tacacsConfChange = true;
		
		CP.UI.submitData(page);
		
		Ext.getCmp('applyUidButton').disable();
		//clear dirty flag
		CP.util.clearFormInstanceDirtyFlag(Ext.getCmp('authsrvs-panel').getForm());	
	

	}
	
	,applyStateHandler: function()
	{
	
		var myparams = {};
		var stateCheckbox = Ext.getCmp('tacacsState') ;
		
		if(stateCheckbox.getValue() == true){
			myparams['state'] = "on";
		}
		else{
			myparams['state'] = "off";
		}
		
		myparams['save'] = '1';
		myparams['apply'] = '1';
		
		var page = CP.UI.getMyObj();
		page.params = {};
		page.params = myparams;
		
		CP.AuthSrvs.applyState = true;
		
		CP.UI.submitData(page);
		
		stateCheckbox.originalValue  = stateCheckbox.getValue();
		Ext.getCmp('applyStateButton').disable();
		//clear dirty flag
		CP.util.clearFormInstanceDirtyFlag(Ext.getCmp('authsrvs-panel').getForm());	
	}
		
} 
