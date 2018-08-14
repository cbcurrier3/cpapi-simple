
CP.cluster_config = {

REFRESH_TASK: null,
NEXT_WIZARD_PANEL : null,
PREV_WIZARD_PANEL : [],
CURRENT_WIZARD_PANEL : null,
CURRENT_WIZARD_PANEL_CLASS : null,
FINAL_PAGE : false,
CONFIG_COLLECTOR : null,
DATA_TO_SUBMIT : {},
COMPONENTS_VALUES : {},
WIZARD_STATIC_IF_STORE : null,
SYNC_INTERFACE : "",
SHARED_FEATURES_INFO : "",
RELOAD_WEBUI : false,
LOCK_FEATURES_AFTER_CREATING_CG : false,

ClusterDBModeToHumanReadable : function (db_cluster_mode) {
	var ClusterModes = [	["static","Manually Defined"],
							["clusterxl","ClusterXL"],
							[null,null]
						];				
	var i = 0;

	while(ClusterModes[i][0] != null) {
		if(ClusterModes[i][0] == db_cluster_mode)
			return ClusterModes[i][1];
		i++;
	}
	return db_cluster_mode;
},

RestoreComponentsValues : function(panel) {
	if(panel) {
		panel.items.each(function(item) {
			if(item.getValue && item.setValue && item.getId) {
				item.setValue(CP.cluster_config.COMPONENTS_VALUES[item.getId()]);
			}
		});
		if(panel.id == CP.cluster_config.SELECT_CLUSTER_SHARED_FEATURES.id) {
			var features_store = Ext.getCmp( "shared_features_grid" ).getStore();
			for(feature in CP.cluster_config.COMPONENTS_VALUES[panel.id]) {
				var feature_record = features_store.findRecord("feature_name",feature);
				if(feature_record) {
					feature_record.set("shared",CP.cluster_config.COMPONENTS_VALUES[panel.id][feature]);
				}
			}
		}		
	}
},

ZeroComponentsValues : function(panel) {
	if(panel) {
		panel.items.each(function(item) {
			if(item.getValue && item.setValue && item.getId) {
				CP.cluster_config.COMPONENTS_VALUES[item.getId()] = undefined;
			}
		});
		if(panel.id == CP.cluster_config.SELECT_CLUSTER_SHARED_FEATURES.id) {
			CP.cluster_config.COMPONENTS_VALUES[panel.id] = undefined;
		}
	}
},

collectComponentsValues : function(panel) {
	if(panel) {
		panel.items.each(function(item) {
			if(item.getValue && item.setValue && item.getId) {
				CP.cluster_config.COMPONENTS_VALUES[item.getId()] = item.getValue();
			}
		});
		if(panel.id == CP.cluster_config.SELECT_CLUSTER_SHARED_FEATURES.id) {
			var features_store = Ext.getCmp( "shared_features_grid" ).getStore();
			features_store.clearFilter();
			CP.cluster_config.COMPONENTS_VALUES[panel.id] = {};
			features_store.each( function( record ) {
				var rd = record.data;
				CP.cluster_config.COMPONENTS_VALUES[panel.id][rd.feature_name] = rd.shared;
			});				
		}
	}
},

setCurrentPage : function(cp_class,cp,config_collector,final_page) {
	CP.cluster_config.CURRENT_WIZARD_PANEL_CLASS = cp_class;
	CP.cluster_config.CURRENT_WIZARD_PANEL = cp;
	CP.cluster_config.CONFIG_COLLECTOR = config_collector;	
	CP.cluster_config.RestoreComponentsValues(cp);
	
	CP.cluster_config.FINAL_PAGE = final_page;
	
	if(final_page == true) {
		Ext.getCmp("next_wiz_btn").setText("Finish");
	} else {
		Ext.getCmp("next_wiz_btn").setText("Next >");
	}
},

setNextPage : function(np) {
	CP.cluster_config.NEXT_WIZARD_PANEL = np;
},

setPrevPage : function(pp) {
	CP.cluster_config.PREV_WIZARD_PANEL.push(pp);
},


PASSWORD_METER_PW_FIELD_VALIDATOR : function( value ) {
	value = new String(value); // make sure it's a string
	if (value == '*'){
		return true; // special case: '*' deletes the user's password (so they can't log in with it)
	}
	if (value.length >= 6){
		return true;
	} else {
		return 'Password must be at least 6 characters long';
	}
},


FINAL_WIZARD_PAGE : {
	xtype : "cp4_formpanel",
	cls: 'wizard_center_panel',
	id: 'FINAL_WIZARD_PAGE',
    items: [
		{
			xtype: 'cp4_displayfield',
			id : 'selected_cluster_technology',
			fieldLabel: "Cloning Group Type",
			margin : '25 0 15 15',
			labelWidth: 130,
			width: 300	
		},{
			xtype: 'cp4_displayfield',
			id : 'selected_cluster_name',
			fieldLabel: "Cloning Group Name",
			margin : '25 0 15 15',
			labelWidth: 130,	
			width: 200,
      htmlEncode: true
		},{
			xtype: 'cp4_inlinemsg',
			id : 'selected_cluster_msg',
			text: 'Click Finish to complete Cloning Group configuration.<br>In order to manage this Cloning Group login with the account "cadmin".',
			margin : '25 0 15 15',
			labelWidth: 100
		}
	],
	listeners : {
		afterrender : function(p, eOpts) {
			CP.cluster_config.setCurrentPage(CP.cluster_config.FINAL_WIZARD_PAGE,this,null,true);
			CP.cluster_config.setNextPage(null);
			//UI fixes...
			Ext.getCmp('cluster_main_window').setTitle("Cloning Group Wizard Summary");
			Ext.getCmp("selected_cluster_name").setValue(CP.cluster_config.DATA_TO_SUBMIT["cluster:name"]);
			
			switch(CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"]) {
				case "create_new_cxl_cluster":
					Ext.getCmp("selected_cluster_technology").setValue("ClusterXL");
				break;
				case "create_new_static_cluster":
					Ext.getCmp("selected_cluster_technology").setValue("Manually Defined");
				break;
			
			}
		}
	},
	ConfigCollector : function() {

	},
	ConfigUnCollector : function () {
	
	}
},


SELECT_CLUSTER_SHARED_FEATURES : {
	xtype : "cp4_formpanel",
	cls: 'wizard_center_panel',
	id: 'SELECT_CLUSTER_SHARED_FEATURES',
    items: [
		{
			xtype : 'cp4_inlinemsg',
			type: 'info',
			text: 'Clone selected features to other members of the group',
			margin : '0 0 10 0',
			width: 515
		},{
			xtype : 'cp4_grid',
            id: 'shared_features_grid',
            store: {
				proxy: 'memory',
				fields: ['shared',
						 'feature_name',
						 'feature_readable_name',
						 'feature_description']
			},
			height: 205,
			width: 520,
            columns: [
				{
					xtype: 'checkcolumn',
					header: 'Shared',
					dataIndex: 'shared',
					width: 60,
					editable: true,
					editor: {
						xtype: 'checkbox',
						cls: 'x-grid-checkheader-editor'
					}
				}, {
					text     : 'Name',
					width: 135,
					dataIndex: 'feature_readable_name',
					sortable : true
				},{
					text     : 'Description',
					width: 150,
					dataIndex: 'feature_description',
					flex     : 1, 
					sortable : true
				}
			]
		}
	],
	listeners : {
		afterrender : function(p, eOpts) {
			//UI fixes...
			Ext.getCmp('cluster_main_window').setTitle("Cloning Group Shared Features");
			Ext.getCmp("shared_features_grid").getStore().loadData(CP.cluster_config.SHARED_FEATURES_INFO);		
			//general stuff
			CP.cluster_config.setCurrentPage(CP.cluster_config.SELECT_CLUSTER_SHARED_FEATURES,this,this.ConfigCollector,false);
			CP.cluster_config.setNextPage(CP.cluster_config.FINAL_WIZARD_PAGE);
		}
	},
	ConfigCollector : function() {
		var features_store = Ext.getCmp( "shared_features_grid" ).getStore();
		features_store.clearFilter();
		features_store.each( function( record ) {
			var rd = record.data;
			CP.cluster_config.DATA_TO_SUBMIT["cluster:feature:notshared:" + rd.feature_name] = (rd.shared == "1") ? "" : "t";
		});
	},
	ConfigUnCollector : function () {
		var features_store = Ext.getCmp( "shared_features_grid" ).getStore();
		features_store.clearFilter();
		features_store.each( function( record ) {
			delete CP.cluster_config.DATA_TO_SUBMIT["cluster:feature:notshared:" + record.data.feature_name];
		});
	}
},



CREATE_NEW_STATIC_CLUSTER : {
	xtype : "cp4_formpanel",
	cls: 'wizard_center_panel',
	id: 'CREATE_NEW_STATIC_CLUSTER',
    items: [
		{
			xtype: 'cp4_textfield',
			id : 'static_cluster_name',
			fieldLabel: "Cloning Group Name",
			margin : '25 0 15 15',
			labelWidth: 130,		
			maxLength : 32				
		},{
			xtype: 'cp4_combobox',
			id: 'static_cluster_localaddr',
			displayField: "display_text",
			valueField: "ipv4_address",
			fieldLabel: 'IP for cloning',
			labelWidth: 130,	
			margin : '0 0 15 15',
			editable   : false,
			allowBlank : false
		},{
			xtype:'cp4_passwordmeter',
			id:"static_cluster_user_password_meter",
			margin : '0 0 0 15',
			width: 450
		},{
			xtype : 'cp4_password',
			id: 'static_cluster_confirm_password',
			fieldLabel: 'Confirm Password',
			labelWidth: 130,	
			margin : '0 0 0 15',
			value: '',
			validator: function( value ){
				var password = Ext.getCmp("static_cluster_user_password_meter").getField();
				// checks that it matches the password field
				if ( (value == password.getValue()) || !password.isValid() ){
					if ((value.length >= 6) || (value.length == 0)){
						return true;
					} else{
						return 'Password must be at least 6 characters long';
					}
				} else {
					return ('The two passwords do not match');
				}
			}
		},{
			xtype : 'cp4_inlinemsg',
			id : 'static_cadmin_msg',
			text: 'The password is for the cadmin account, used for managing the Cloning Group'
		}
	],
	listeners : {
		beforerender : function () {
			Ext.getCmp("static_cluster_user_password_meter").getField().labelWidth = 130;
		},
		afterrender : function(p, eOpts) {
			CP.cluster_config.setCurrentPage(CP.cluster_config.CREATE_NEW_STATIC_CLUSTER,this,this.ConfigCollector,false);
			CP.cluster_config.setNextPage(CP.cluster_config.SELECT_CLUSTER_SHARED_FEATURES);
			//UI fixes...
			Ext.getCmp('static_cluster_localaddr').store =  CP.cluster_config.WIZARD_STATIC_IF_STORE;
			Ext.getCmp('cluster_main_window').setTitle("New Cloning Group");
			Ext.getCmp("static_cluster_user_password_meter").getField().labelEl.update('Password:');
			Ext.getCmp("static_cluster_user_password_meter").getField().validator = CP.cluster_config.PASSWORD_METER_PW_FIELD_VALIDATOR;
			Ext.getCmp("static_cluster_confirm_password").setValue("");
			
			var SyncInStore = CP.cluster_config.WIZARD_STATIC_IF_STORE.findRecord(
					"interface_name",CP.cluster_config.SYNC_INTERFACE);
			
			if(SyncInStore) { //select the synch interface if possible
				Ext.getCmp('static_cluster_localaddr').select(SyncInStore);
			}
		}
	},
	ConfigCollector : function() {
		CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"] = "create_new_static_cluster";
		CP.cluster_config.DATA_TO_SUBMIT["cluster:name"] = Ext.getCmp('static_cluster_name').getValue();
		CP.cluster_config.DATA_TO_SUBMIT["cluster_password"] = Ext.getCmp('static_cluster_confirm_password').getValue();
		CP.cluster_config.DATA_TO_SUBMIT["cluster_local_ip"] = Ext.getCmp('static_cluster_localaddr').getValue();
	},
	ConfigUnCollector : function () {
		delete CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster:name"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster_password"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster_local_ip"];
	}
},



CREATE_NEW_CXL_CLUSTER : {
	xtype : "cp4_formpanel",
	cls: 'wizard_center_panel',
	id : 'CREATE_NEW_CXL_CLUSTER',
    items: [
		{
			xtype: 'cp4_textfield',
			id : 'cxl_cluster_name',
			fieldLabel: "Cloning Group Name",
			margin : '25 0 15 15',
			labelWidth: 130,
			maxLength : 32			
		},{
			xtype:'cp4_passwordmeter',
			id:"cxl_user_password_meter",
			margin : '0 0 0 15',
			width: 450
		},{
			xtype : 'cp4_password',
			id: 'cxl_confirm_password',
			fieldLabel: 'Confirm Password',
			labelWidth: 130,
			margin : '0 0 0 15',
			value: '',
			validator: function( value ){
				var password = Ext.getCmp("cxl_user_password_meter").getField();
				// checks that it matches the password field
				if ( (value == password.getValue()) || !password.isValid() ){
					if ((value.length >= 6) || (value.length == 0)){
						return true;
					} else{
						return 'Password must be at least 6 characters long';
					}
				} else {
					return ('The two passwords do not match');
				}
			}
		},{
			xtype : 'cp4_inlinemsg',
			id : 'clusterxl_cadmin_msg',
			text: 'The password is for the cadmin account, used for managing the Cloning Group'
		}
	],
	listeners : {
		beforerender : function () {
			Ext.getCmp("cxl_user_password_meter").getField().labelWidth = 130;
		},	
		afterrender : function(p, eOpts) {
			CP.cluster_config.setCurrentPage(CP.cluster_config.CREATE_NEW_CXL_CLUSTER,this,this.ConfigCollector,false);
			CP.cluster_config.setNextPage(CP.cluster_config.FINAL_WIZARD_PAGE);
			//some UI fixes...
			Ext.getCmp('cluster_main_window').setTitle("ClusterXL Cloning Group");
			Ext.getCmp("cxl_user_password_meter").getField().labelEl.update('Password:');
			Ext.getCmp("cxl_user_password_meter").getField().validator = CP.cluster_config.PASSWORD_METER_PW_FIELD_VALIDATOR;
			Ext.getCmp("cxl_confirm_password").setValue("");
		}
	},
	ConfigCollector : function() {	
		CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"] = "create_new_cxl_cluster";
		CP.cluster_config.DATA_TO_SUBMIT["cluster:name"] = Ext.getCmp('cxl_cluster_name').getValue();
		CP.cluster_config.DATA_TO_SUBMIT["cluster_password"] = Ext.getCmp('cxl_confirm_password').getValue();
	},
	ConfigUnCollector : function () {
		delete CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster:name"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster_password"];
	}
},


JOIN_EXISTING_CLUSTER : {
	xtype : "cp4_formpanel",
	cls: 'wizard_center_panel',
	id: 'JOIN_EXISTING_CLUSTER',
    items: [
		{
			xtype : 'cp4_ipv4field',
			id: 'join_existing_remote_cluster_member',
			fieldLabel: 'Remote Member Address',
			width: 300,
			labelWidth: 135,
			fieldConfig: { allowBlank: false }
		},{
			xtype: 'cp4_combobox',
			id: 'join_existing_localaddr',
			displayField: "display_text",
			valueField: "ipv4_address",
			fieldLabel: 'IP for cloning',
			labelWidth: 135,			
			margin : '5 0 0 0',
			editable   : false,
			allowBlank : false
		},{
			xtype : 'cp4_password',
			id: 'join_existing_password',
			fieldLabel: 'Password',
			labelWidth: 135,
			margin : '5 0 0 0',
			value: '',
			allowBlank : false
		},{
			xtype : 'cp4_inlinemsg',
			id : 'join_cluster_msg',
			text: 'Specify the cadmin account password that was defined during Cloning Group creation'
		}
	],
	listeners : {
		afterrender : function(p, eOpts) {
			CP.cluster_config.setCurrentPage(CP.cluster_config.JOIN_EXISTING_CLUSTER,this,this.ConfigCollector,true);
			CP.cluster_config.setNextPage(null);
			Ext.getCmp('join_existing_localaddr').store = CP.cluster_config.WIZARD_STATIC_IF_STORE;
			Ext.getCmp('cluster_main_window').setTitle("Join Existing Cloning Group");

			var SyncInStore = CP.cluster_config.WIZARD_STATIC_IF_STORE.findRecord(
					"interface_name",CP.cluster_config.SYNC_INTERFACE);
			
			if(SyncInStore) { //select the synch interface if possible
				Ext.getCmp('join_existing_localaddr').select(SyncInStore);
			}			
		}
	},
	ConfigCollector : function() {
		CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"] = "join_existing_static_cluster";
		CP.cluster_config.DATA_TO_SUBMIT["cluster_password"] = Ext.getCmp('join_existing_password').getValue();
		CP.cluster_config.DATA_TO_SUBMIT["cluster_local_ip"] = Ext.getCmp('join_existing_localaddr').getValue();
		CP.cluster_config.DATA_TO_SUBMIT["join_addr"] = Ext.getCmp('join_existing_remote_cluster_member').getValue();
	},
	ConfigUnCollector : function () {
		delete CP.cluster_config.DATA_TO_SUBMIT["tcl_operation"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster_password"];
		delete CP.cluster_config.DATA_TO_SUBMIT["cluster_local_ip"];
		delete CP.cluster_config.DATA_TO_SUBMIT["join_addr"];
	}
},


WIZARD_WELCOME : {
	xtype : "cp4_formpanel",
	id : 'WIZARD_WELCOME',
	border: false,
	cls: 'wizard_center_panel wizard_center_panel_welcome',
    items: [
		{
            xtype: 'cp4_box'
            , cls: 'wizard_headline_small'
            , id: 'cluster_headline'
            , html: "Welcome to the"      
        },{
            xtype: 'cp4_box'
            , cls: 'wizard_headline_big'
            , id: 'cluster_headline_big'
            , html: "Gaia Cloning Group Creation Wizard<br><br>"            
        },{	
            xtype: 'cp4_box'
			, html: "A cloning group lets you manage multiple Gaia machines from a single location.<br>\
					You're just a few steps away from using a Cloning Group.<br><br><br>"
            ,cls: 'wizard_welcome_text'
        },{
			xtype: 'cp4_radio',
			id: 'rb_create_new_cluster', 
			name: 'rb_create_or_join', 
			boxLabel: 'Create a new Cloning Group', 
			margin : '0 0 10 0',
			width:400,
			checked: true,
			inputValue: 1, 
			handler: function() {
				if(this.checked) {
					CP.cluster_config.setNextPage(CP.cluster_config.CREATE_NEW_STATIC_CLUSTER);
				}
			}			
		},{
			xtype: 'cp4_radio',
			id: 'rb_join_existing_cluster',
			name: 'rb_create_or_join', 			
			boxLabel: 'Join an existing Cloning Group', 
			margin : '0 0 10 0',
			width:400,
			checked: false,
			inputValue: 1, 
			handler: function() {
				if(this.checked) {
					CP.cluster_config.setNextPage(CP.cluster_config.JOIN_EXISTING_CLUSTER);
				}
			}
		},{
			xtype: 'cp4_radio',
			id: 'rb_create_new_cxl_cluster', 
			name: 'rb_create_or_join', 
			boxLabel: 'Cloning group follows ClusterXL', 
			margin : '0 0 10 0',
			width:400,
			checked: false,
			inputValue: 1, 
			handler: function() {
				if(this.checked) {
					CP.cluster_config.setNextPage(CP.cluster_config.CREATE_NEW_CXL_CLUSTER);
				}
			}			
		}
	],
	listeners : {
		afterrender : function(p, eOpts) {
			CP.cluster_config.setNextPage(CP.cluster_config.CREATE_NEW_STATIC_CLUSTER);
			CP.cluster_config.setCurrentPage(CP.cluster_config.WIZARD_WELCOME,this,this.ConfigCollector,false);
			Ext.getCmp('cluster_main_window').setTitle("Cloning Group Configuration Wizard");
			Ext.getCmp("wizard_back_button").setDisabled(true);
		}		
		
	},
	ConfigCollector : function() {
		//put stuff into the DATA_TO_SUBMIT array
	},
	ConfigUnCollector : function () {
		//remove stuff from the DATA_TO_SUBMIT array
	}
},


StartWizard : function()
{
	CP.cluster_config.COMPONENTS_VALUES = {};
	CP.cluster_config.setNextPage(CP.cluster_config.WIZARD_WELCOME);

    //wizard bottom bar
    var south_panel =  Ext.create( 'CP.WebUI4.Panel',{
        id: 'cluster_south_panel'
        , name: 'cluster_south_panel'	
        , region: 'south'
        , layout: 'table'
        , layoutConfig: { columns: 8 }
        , height: 47
        , cls: 'webui_toolbar'
		, style: "padding-top: 7px; background-color: #f4f4f4"
        , items: 
		[	
			{ 	xtype: 'cp4_panel', 
				width: 260
			},{
				xtype: 'cp4_button', 
				text: '< Back',
				id: 'back_wiz_btn',				
				cls: 'ftw_toolbar_btns',
				minWidth: 80 ,
				disabled : true,
				id : 'wizard_back_button',
				handler: function() {
					if(CP.cluster_config.PREV_WIZARD_PANEL.length > 0) {
						var center_panel = Ext.getCmp("cluster_center_panel");
						CP.cluster_config.ZeroComponentsValues(CP.cluster_config.CURRENT_WIZARD_PANEL);
						if(CP.cluster_config.CURRENT_WIZARD_PANEL.ConfigUnCollector)
							CP.cluster_config.CURRENT_WIZARD_PANEL.ConfigUnCollector();
						center_panel.removeAll();
						center_panel.add(CP.cluster_config.PREV_WIZARD_PANEL.pop());
						center_panel.doLayout();
					}
				}
			},{
				xtype: 'cp4_panel', 
				width: 15
			},{
				xtype: 'cp4_button',
				text: 'Next >',
				minWidth: 80,
				id: 'next_wiz_btn',
				cls: 'ftw_toolbar_btn_next',
				handler: function() {
	
					if( CP.cluster_config.CURRENT_WIZARD_PANEL.getForm().isValid() ) {
					
						CP.cluster_config.collectComponentsValues(CP.cluster_config.CURRENT_WIZARD_PANEL);
						
						if(CP.cluster_config.CONFIG_COLLECTOR) {
							CP.cluster_config.CONFIG_COLLECTOR();
						}
				
						if(CP.cluster_config.FINAL_PAGE) {
							// Add control parameters
							CP.cluster_config.DATA_TO_SUBMIT[ 'save' ] = 1;
							CP.cluster_config.DATA_TO_SUBMIT[ 'apply' ] = 1;
								
							function cluster_wizard_submit_failure(jsonData) {
								var ErrMsg = "";	
								if (jsonData.messages) {
									for (var i = 0; i < jsonData.messages.length; i++) {
										ErrMsg = ErrMsg + jsonData.messages[i] + "\n";
									}
								}
								CP.WebUI4.Msg.show({
									title: 'Error',
									msg: ErrMsg,
									buttons: Ext.Msg.OK,
									icon: 'webui-msg-error'
									});
							}
								
							Ext.getCmp("next_wiz_btn").setDisabled(true);

							Ext.Ajax.request({
								url: "/cgi-bin/cluster_config.tcl",
								method: 'POST',
								params: CP.cluster_config.DATA_TO_SUBMIT,
								success: function( jsonResult ){
									jsonData = Ext.decode( jsonResult.responseText );
									if(Ext.getCmp("next_wiz_btn")) {
										Ext.getCmp("next_wiz_btn").setDisabled(false);
									}
									if(jsonData.success == "true") {
										var wizard_window = Ext.getCmp("cluster_main_window");
										if(wizard_window) {
											wizard_window.close();
											CP.cluster_config.LOCK_FEATURES_AFTER_CREATING_CG = true;
											CP.cluster_config.afterSubmit(null,null);
										}
									} else {
										cluster_wizard_submit_failure(jsonData);
									}
								},
								failure:function( jsonResult ){ 
									if(Ext.getCmp("next_wiz_btn")) {
										Ext.getCmp("next_wiz_btn").setDisabled(false);
									}
									jsonData = Ext.decode( jsonResult.responseText );
									cluster_wizard_submit_failure(jsonData);
								}
							});
						}
				
						if(CP.cluster_config.NEXT_WIZARD_PANEL) {
							CP.cluster_config.setPrevPage(CP.cluster_config.CURRENT_WIZARD_PANEL_CLASS);
							var center_panel = Ext.getCmp("cluster_center_panel");
							center_panel.removeAll();
							center_panel.add(CP.cluster_config.NEXT_WIZARD_PANEL);
							center_panel.doLayout();
							Ext.getCmp("wizard_back_button").setDisabled(false);
						}
					}
				}
			},{ 
				xtype: 'cp4_panel', 
				width: 30 
			},{
				xtype: 'cp4_button',
				text: 'Cancel',
				cls: 'ftw_toolbar_btns',
				minWidth: 80 ,
				handler: function() {
					var wiz_window = Ext.getCmp("cluster_main_window");
					wiz_window.close();
					
				}
			}	
		]  
    });
	
	
   
    var center_panel = Ext.create( 'CP.WebUI4.Panel',{
        id: 'cluster_center_panel'
        , name: 'cluster_center_panel'
        , region: 'center'
        , layout: 'card'
        , border: true
        , width: 400
        , height: 355
        , activeItem: 0
        , items: CP.cluster_config.NEXT_WIZARD_PANEL
    });	
	
    var main_panel = Ext.create( 'CP.WebUI4.Panel',{
        id: 'cluster_main_panel'
        , name: 'cluster_main_panel'
        , layout: 'border'
	    , items: [south_panel,center_panel]
    });	
	
    var main_window = Ext.create( 'CP.WebUI4.ModalWin',{
			id: 'cluster_main_window'
			, name: 'cluster_main_window'
			, title: 'Cloning Group Configuration Wizard'
			, width: 572
			, height: 433
			, closable : false
			, items : [main_panel]
			, listeners: {
				beforerender: function() {
					CP.cluster_config.NEXT_WIZARD_PANEL = null;
					CP.cluster_config.PREV_WIZARD_PANEL = [];
					CP.cluster_config.CURRENT_WIZARD_PANEL = null;
					CP.cluster_config.FINAL_PAGE = false;
					CP.cluster_config.CONFIG_COLLECTOR = null;
					CP.cluster_config.DATA_TO_SUBMIT = {};
					CP.cluster_config.COMPONENTS_VALUES = {};
				}
			}
    });
	
	main_panel.doLayout();
    main_window.show();  
	
	Ext.Ajax.on('requestexception', function()
		{
		}
	);
},


BuildClusterSetupPage : function(formPanel,jsonData)
{

    var ClusterSetupMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterSetupMessage',
        titleText: 'Setup a New Cloning Group'
    });

	var StartClusterWizardBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Start Cloning Group Creation Wizard',
		xtype: 'cp4_button',
		margin : '0 0 0 0',
		handler: function(){
			CP.cluster_config.StartWizard();
		}
	});	
	
	var SetupPageText = Ext.create('CP.WebUI4.DisplayField',{
		id: 'SetupPageText',
		width: 470,
		margin : '0 0 15 0',
		value : "A Gaia cloning group provides the ability to manage multiple devices from a single location." + "<br/><br/>" +
				"A Gaia cloning group is currently not configured on this system."
    });	
	
	
	formPanel.add(ClusterSetupMessage);
	formPanel.add(SetupPageText);
	formPanel.add(StartClusterWizardBtn);
},

renderMemberStatus: function (MemberStatus)
{
	/* each of the member statuses in this switch should be correlated with 
	   the cluster statuses that are defined in clusterd code ! */
	   
	var cls = '<div class="';
	
	switch(MemberStatus) {
		case "Synchronization Completed":
		case "Running In ClusterXL Mode":
		case "Running In Manual Mode":
			cls += "member-status-normal";
		break;
		case "Reading Configuration":
		case "Synchronizing...":
		case "Connecting to remote member...":
			cls += "member-status-work-in-progress";
		break;
		case "Waiting for ClusterXL":
			cls += "member-status-info";
		break;
		case "Synchronization Failed":
		case "Authentication Error":
		case "Incompatible cloning group mode":
		case "Gaia version mismatch":
			cls += "member-status-error";
		break;
		default:
			cls += "member-status-normal";
		break;
	}
	
	return cls + '">' + MemberStatus + '</div>';
},

renderClusterMember: function(val, meta, record) {
	var cls = "";
	
	if(record.data.member_type == "local") {
		cls = "member-local";
	} else {
		cls = "member-up";
	} 

	return '<div class="'+ cls +'">'+ val +'</div>';
},


BuildExistingClusterPage : function(formPanel,jsonData)
{	
    var cm = [
        {header:'Member Type' ,dataIndex: 'member_type' , flex:1 , renderer: CP.cluster_config.renderClusterMember},
        {header: 'Member Address' ,dataIndex:'member_addr', flex:1 },
		{header: 'Member Name' ,dataIndex:'member_name', flex:1 }
    ];  
	
    var ClusterMembers = Ext.create( 'CP.WebUI4.JsonStore',{
		proxy: 'memory'
		,data : jsonData.data.cluster_members
        ,fields: ['member_type',
                 'member_addr',
				 'member_name']
    });  
	
    var membersGrid = Ext.create( 'CP.WebUI4.GridPanel',{
        id: 'cluster_members_tbl'
        ,height: 220
        ,width: 450
        ,store: ClusterMembers
        ,columns: cm
		,listeners: {
			destroy: function() {
				if (CP.cluster_config.REFRESH_TASK != null){
					Ext.TaskManager.stop(CP.cluster_config.REFRESH_TASK);
					CP.cluster_config.REFRESH_TASK = null;
				}
			}		
		}
    });
	
	var LeaveClusterBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Leave Cloning Group',
		xtype: 'cp4_button',
		margin : '15 0 15 0',
		handler: function() {
			CP.WebUI4.Msg.show({
				 title: 'Leaving cloning group',
				 msg: "Click 'Yes' to leave the cloning group or 'No' to keep current configuration",
				 buttons: Ext.Msg.YESNO,
				 icon: Ext.Msg.QUESTION,
				 fn: function( btn, text ){
					if( btn == 'no' ){
						return;
					}
					var pageObj = CP.UI.getMyObj();
					pageObj.params = {}; 
					var params = pageObj.params;
					params["leave_cluster"] = "t";
					CP.cluster_config.RELOAD_WEBUI = true;
					CP.UI.submitData( pageObj ); 
				 }
			 });
		}
	});
	
	var ReconfigClusterBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Re-Synchronize Cloning Group',
		xtype: 'cp4_button',
		margin : '15 0 15 15',
		handler: function(){
			var pageObj = CP.UI.getMyObj();
			pageObj.params = {}; 
			var params = pageObj.params;
			params["reconfig_cluster"] = "t";
			CP.UI.submitData( pageObj ); 
			var clusterd_status = Ext.getCmp("Member_Status");
			
			if(clusterd_status) {
				clusterd_status.setValue(CP.cluster_config.renderMemberStatus("Synchronizing..."));
			}
		}
	});	
	
	var CadminMsg = Ext.create( 'CP.WebUI4.inlineMsg', {
		type: 'info',
		text: 'In order to manage the cloning group use the account "cadmin".'
	});
	
    var ClusterViewMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterViewMessage',
        titleText: 'Cloning Group'
    });
	
	
	var ClusterModeTF = Ext.create('CP.WebUI4.DisplayField',{
		id: 'ClusterModeTF',
		width: 300,
		fieldLabel: 'Cloning Group Mode',
		labelWidth: 130,
		value : CP.cluster_config.ClusterDBModeToHumanReadable(jsonData.data.cluster_mode)
    });
	
	
	var Member_Status = Ext.create('CP.WebUI4.DisplayField',{
		id: 'Member_Status',
		width: 500,
		height : 18,
		fieldLabel: 'Member Status',
		labelWidth: 130,
		value : CP.cluster_config.renderMemberStatus(jsonData.data.clusterd_status)
    });	
	
    var ClusterMembersTitle = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterMembersTitle',
        titleText: 'Members'
    });	
	
	var RefreshBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Refresh',
		xtype: 'cp4_button',
		margin : '15 0 15 0',
		handler: function(){
			Ext.Ajax.request({
				url: '/cgi-bin/cluster_config.tcl',
				method: 'GET',
				success: function (jsonResult){			
						CP.cluster_config.refreshGrid(jsonResult);
					}
				});
		}
	});	

    var ClusterPasswordTitle = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterPasswordTitle',
        titleText: 'Cloning Group Password'
    });		
		
	var ClusterNewPassword = Ext.create('CP.WebUI4.Password', {
		id: 'ClusterNewPassword',
		fieldLabel: 'New Password',
		labelWidth: 130
	});	
	
	var ClusterNewPasswordConfirm = Ext.create('CP.WebUI4.Password', {
		id: 'ClusterNewPasswordConfirm',
		fieldLabel: 'Confirm New Password',
		labelWidth: 130,
		value: '',
		validator: function( value ){
			var password = Ext.getCmp("ClusterNewPasswordMeter").getField();
			// checks that it matches the password field
			if ( (value == password.getValue()) || !password.isValid() ){
				if ((value.length >= 6) || (value.length == 0)){
					return true;
				} else{
					return 'Password must be at least 6 characters long';
				}
			} else {
				return ('The two passwords do not match');
			}
		},
		enableKeyEvents: true,
		listeners: {
			keypress: function() { Ext.getCmp('UpdateClusterPasswordBtn').setDisabled(!this.isValid()); },
			keyup:    function() { Ext.getCmp('UpdateClusterPasswordBtn').setDisabled(!this.isValid()); }
		}		
	});		
	
	var ClusterNewPasswordMeter = Ext.create('CP.WebUI4.PasswordMeter', {
		id : 'ClusterNewPasswordMeter',
		validator : CP.cluster_config.PASSWORD_METER_PW_FIELD_VALIDATOR,
		passwordField : ClusterNewPassword,
		componentCls: 'change_pwd_strength_default_position'
	});
	
	var UpdateClusterPasswordBtn = Ext.create( 'CP.WebUI4.Button', {
		id : 'UpdateClusterPasswordBtn',
		text: 'Set new password',
		xtype: 'cp4_button',
		disabled : true,
		handler: function(){
			if(ClusterNewPasswordConfirm.isValid()) {
				var pageObj = CP.UI.getMyObj();
				pageObj.params = {}; 
				var params = pageObj.params;
				params["set_new_cadmin_pwd"] = "t";
				params["cluster_password"] = ClusterNewPasswordConfirm.getValue();
				CP.UI.submitData( pageObj ); 
				this.setDisabled(true);
			}
		}
	});	
	
	formPanel.add(ClusterViewMessage);
	formPanel.add(ClusterModeTF);
	formPanel.add(Member_Status);
	formPanel.add(LeaveClusterBtn);
	formPanel.add(ReconfigClusterBtn);
	formPanel.add(CadminMsg);
	formPanel.add(ClusterPasswordTitle);	
	formPanel.add(ClusterNewPasswordMeter);
	formPanel.add(ClusterNewPasswordConfirm);
	formPanel.add(UpdateClusterPasswordBtn);
	formPanel.add(ClusterMembersTitle);
	formPanel.add(RefreshBtn);
	formPanel.add(membersGrid);
},


BuildClusterAdminWebui : function(formPanel,jsonData)
{	
    var SharedFeaturesMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'SharedFeaturesMessage',
        titleText: 'Shared Features'
    });	

    var SharedFeaturesStore = Ext.create( 'CP.WebUI4.JsonStore',{
		proxy: 'memory'
		,data : jsonData.data.cluster_features
        ,fields: ['shared',
				 'feature_name',
                 'feature_readable_name',
				 'feature_description']
		,listeners: {
			update : function() {
				Ext.getCmp("set_shared_features_btn").setDisabled(false);
			}
		}
    });  

    var FeaturesGrid = Ext.create( 'CP.WebUI4.GridPanel',{
            id: 'shared_features_grid',
            store: SharedFeaturesStore,
			height: 300,
			width: 670,
            columns: [
				{
					xtype: 'checkcolumn',
					header: 'Shared',
					dataIndex: 'shared',
					width: 60,
					editable: true,
					editor: {
						xtype: 'checkbox',
						cls: 'x-grid-checkheader-editor'
					}
				}, {
					text     : 'Name',
					width: 135,
					dataIndex: 'feature_readable_name',
					sortable : true
				},{
					text     : 'Description',
					width: 150,
					dataIndex: 'feature_description',
					flex     : 1, 
					sortable : true
				}
			]
        });
	
	var SetSharedFeaturesBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Set Shared Features',
		xtype: 'cp4_button',
		id: 'set_shared_features_btn',
		disabled : true,
		handler: function() {
			var pageObj = CP.UI.getMyObj();
			pageObj.params = {}; 								
			var params = pageObj.params;
			var features_store = Ext.getCmp( "shared_features_grid" ).getStore();
			features_store.clearFilter();
			features_store.each( function( record ) {
				var rd = record.data;
				params["cluster:feature:notshared:" + rd.feature_name] = (rd.shared == "1") ? "" : "t";
			});
			CP.global.CLUSTER_SHARED_FEATURE_NEXT_LOGIN_MSG = true;
			CP.UI.submitData( pageObj ); 
			if(Ext.getCmp( "SharedFeatureMsg" )) {
				Ext.getCmp( "SharedFeatureMsg" ).setVisible(true);
			}
		} 
	});	
	
    var ClusterConfigurationMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterConfigurationMessage',
        titleText: 'Cloning Group'
    });	
	
    var ClusterNameField = Ext.create('CP.WebUI4.TextField',{
		id : 'ClusterNameField',
        fieldLabel: "Cloning Group Name",
		labelWidth : 130,
		value : decodeURIComponent(jsonData.data.cluster_name),
		maxLength : 32,
		listeners: {
			change : function() {
				Ext.getCmp("set_general_cluster_settings_btn").setDisabled(false);
			}
		}		
    });	
	
	var ClusterModeTF = Ext.create('CP.WebUI4.DisplayField',{
		id: 'ClusterModeTF',
		width: 300,
		margin : '0 0 15 0',
		fieldLabel: 'Cloning Group Mode',
		labelWidth : 130,
		value : CP.cluster_config.ClusterDBModeToHumanReadable(jsonData.data.cluster_mode)
    });
	
	
	var ApplyGeneralClusterSettingsBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Apply',
		xtype: 'cp4_button',
		id: 'set_general_cluster_settings_btn',
		disabled : true,
		handler: function() {
			var pageObj = CP.UI.getMyObj();
			pageObj.params = {}; 								
			var params = pageObj.params;
			var cname_field = Ext.getCmp("ClusterNameField");			
			if(cname_field && cname_field.isValid()) {
				params["cluster:name"] = cname_field.getValue();
				CP.UI.submitData( pageObj ); 
			}
		} 
	});
	
	var SharedFeatureMsg = Ext.create( 'CP.WebUI4.inlineMsg', {
		type: 'info',
		id : 'SharedFeatureMsg',
		text: 'New Cloning Group shared-features settings will take effect on next login.',
		hidden : !CP.global.CLUSTER_SHARED_FEATURE_NEXT_LOGIN_MSG
	});
	
    var ClusterPasswordTitle = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterPasswordTitle',
        titleText: 'Cloning Group Password'
    });		
		
	var ClusterNewPassword = Ext.create('CP.WebUI4.Password', {
		id: 'ClusterNewPassword',
		fieldLabel: 'New Password',
		labelWidth: 130
	});	
	
	var ClusterNewPasswordConfirm = Ext.create('CP.WebUI4.Password', {
		id: 'ClusterNewPasswordConfirm',
		fieldLabel: 'Confirm New Password',
		labelWidth: 130,
		value: '',
		validator: function( value ){
			var password = Ext.getCmp("ClusterNewPasswordMeter").getField();
			// checks that it matches the password field
			if ( (value == password.getValue()) || !password.isValid() ){
				if ((value.length >= 6) || (value.length == 0)){
					return true;
				} else{
					return 'Password must be at least 6 characters long';
				}
			} else {
				return ('The two passwords do not match');
			}
		},
		enableKeyEvents: true,
		listeners: {
			keypress: function() { Ext.getCmp('UpdateClusterPasswordBtn').setDisabled(!this.isValid()); },
			keyup:    function() { Ext.getCmp('UpdateClusterPasswordBtn').setDisabled(!this.isValid()); }
		}		
	});		
	
	var ClusterNewPasswordMeter = Ext.create('CP.WebUI4.PasswordMeter', {
		id : 'ClusterNewPasswordMeter',
		validator : CP.cluster_config.PASSWORD_METER_PW_FIELD_VALIDATOR,
		passwordField : ClusterNewPassword,
		componentCls: 'change_pwd_strength_default_position'
	});
	
	var UpdateClusterPasswordBtn = Ext.create( 'CP.WebUI4.Button', {
		id : 'UpdateClusterPasswordBtn',
		text: 'Set new password',
		xtype: 'cp4_button',
		disabled : true,
		handler: function(){
			if(ClusterNewPasswordConfirm.isValid()) {
				var pageObj = CP.UI.getMyObj();
				pageObj.params = {}; 
				var params = pageObj.params;
				params["set_new_cadmin_pwd"] = "t";
				params["cluster_password"] = ClusterNewPasswordConfirm.getValue();
				CP.UI.submitData( pageObj ); 
				this.setDisabled(true);
			}
		}
	});	
	
	formPanel.add(ClusterConfigurationMessage);
	formPanel.add(ClusterModeTF);
	formPanel.add(ClusterNameField);
	formPanel.add(ApplyGeneralClusterSettingsBtn);
	formPanel.add(ClusterPasswordTitle);	
	formPanel.add(ClusterNewPasswordMeter);
	formPanel.add(ClusterNewPasswordConfirm);
	formPanel.add(UpdateClusterPasswordBtn);	
	formPanel.add(SharedFeaturesMessage);
	formPanel.add(FeaturesGrid);
	formPanel.add(SetSharedFeaturesBtn);
	formPanel.add(SharedFeatureMsg);
},

init: function() {	
				
    var ClusterConfigPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"cluster_config_panel"
        ,items: []
		,listeners: {
			destroy: function() {
				if(CP.global.isCluster) {
					if (CP.cluster_monitor.REFRESH_TASK != null){
						Ext.TaskManager.stop(CP.cluster_monitor.REFRESH_TASK);
						CP.cluster_monitor.REFRESH_TASK = null;
					}
				}
			}
		}
    });
       
    var page = {
        title:"Cloning Group Configuration"
        ,panel: ClusterConfigPanel
        ,submitURL:"/cgi-bin/cluster_config.tcl"
        ,afterSubmit:CP.cluster_config.afterSubmit
        ,params:{}

    };
	
	if(CP.global.isCluster) {
		page.related = [{
			page: 'tree/cluster_config',
			tab: CP.global.monitor,
			displayName: 'Cloning Group Monitor'
		}];
	}
	
	
	Ext.Ajax.request({
        url: '/cgi-bin/cluster_config.tcl',
        method: 'GET',
		success: function (jsonResult){
			var jsonData = Ext.decode(jsonResult.responseText);
			
			CP.cluster_config.SHARED_FEATURES_INFO = jsonData.data.cluster_features;

			CP.cluster_config.WIZARD_STATIC_IF_STORE = Ext.create( 'CP.WebUI4.JsonStore',{
							proxy: 'memory',
							data : jsonData.data.possible_sync_ips,
							fields: ['interface_name',
								'interface_type',
								'ipv4_address',
								'is_alias',
								'display_text']
					});
			
			CP.cluster_config.SYNC_INTERFACE = jsonData.data.sync_interface;
			
			if(jsonData.data.cluster_enabled != "t") {
				CP.cluster_config.BuildClusterSetupPage(ClusterConfigPanel,jsonData);
			} else {
				if(!CP.global.isCluster) {
					CP.cluster_config.BuildExistingClusterPage(ClusterConfigPanel,jsonData);
					
					if(CP.cluster_config.LOCK_FEATURES_AFTER_CREATING_CG) {
						CP.cluster_config.LOCK_FEATURES_AFTER_CREATING_CG = false;
						CP.global.isClusterEnabled = true;
						CP.global.LockClusterSharedFeatureInAdminMode = true;
						
						for(var i = 0;i < jsonData.data.cluster_features.length;i++) {
							CP.global.isClusterFeatureShared[jsonData.data.cluster_features[i].feature_name] = true;
						}
					}					
					
					CP.cluster_config.REFRESH_TASK = CP.util.createFrequentRequestRunnable(
						'/cgi-bin/cluster_config.tcl', 'GET', CP.cluster_config.refreshGrid,  CP.global.GridRefreshRate);
					Ext.TaskManager.start(CP.cluster_config.REFRESH_TASK);
				} else {
					CP.cluster_config.BuildClusterAdminWebui(ClusterConfigPanel,jsonData);
				}
			}
			CP.UI.updateDataPanel(page,CP.global.config);
		}
    });	
},

refreshGrid: function(jsonResult) {
	var jsonData = Ext.decode(jsonResult.responseText);
	var grid = Ext.getCmp( 'cluster_members_tbl' );
	var clusterd_status = Ext.getCmp("Member_Status");
	
	if(clusterd_status) {
		clusterd_status.setValue(CP.cluster_config.renderMemberStatus(jsonData.data.clusterd_status));
	}
	
	if(grid) {
		var store = grid.getStore();
		if(store) {
			store.loadData(jsonData.data.cluster_members);
		}
		grid.doComponentLayout();
		if(jsonData.data.cluster_members.length > 1) {
			if(Ext.getCmp( 'join_cluster_btn'))
				Ext.getCmp( 'join_cluster_btn').setDisabled(true);
			if(Ext.getCmp( 'set_cadmin_pwd_btn'))
				Ext.getCmp( 'set_cadmin_pwd_btn').setDisabled(true);				
		}		
	}

	for(var i = 0;i < jsonData.data.cluster_features.length;i++) {	
		CP.global.isClusterFeatureShared[jsonData.data.cluster_features[i].feature_name] = 
			(jsonData.data.cluster_features[i].shared == '1');
	}
},
	

afterSubmit:function(form, action){
	if(CP.cluster_config.RELOAD_WEBUI) {
		location.reload();
	} else {
		CP.cluster_config.init();
	}
}

}
