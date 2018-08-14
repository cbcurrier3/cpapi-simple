CP.SNMP = {
        
tablesData: {},
globalData: {},
old_read_community: '',
old_write_community: '',
pollingFrequency: '',
trapUser: '',

init: function() {

    var snmpPanel = Ext.create( 'CP.WebUI4.DataFormPanel', {
        id: 'snmp-panel',
        autoScroll: true,
        listeners: {
            render: CP.SNMP.doLoad
        }
    });

    CP.SNMP.addGeneralSettingsSection(snmpPanel);
    CP.SNMP.add_snmp_addresses_section(snmpPanel);
    CP.SNMP.addV1_V2_Settings_section(snmpPanel);
    CP.SNMP.addV3_USMSection(snmpPanel);
	CP.SNMP.addEnabledTrapsSection(snmpPanel);
    CP.SNMP.addTrapReceiversSection(snmpPanel);
	CP.SNMP.addCustomTrapsSection(snmpPanel);
   
    var obj = {
        title: 'SNMP',
        panel: snmpPanel,
        submitURL: '/cgi-bin/snmpd.tcl',
        params: {},
		cluster_feature_name : "snmp",
        afterSubmit: CP.SNMP.loadTablesData,
		lock_event : function (locked) {	
			if(Ext.getCmp('addrTable')) {
				if(Ext.getCmp('addrTable').rendered) {
					Ext.getCmp('addrTable').getSelectionModel().setLocked(locked);
				}
			}
		},
//      helpFile:"snmpHelp.html",
        relatedLinks:[{
            link: 'tree/snmpd',
            info: 'This link is for snmp'
        }]
    };

    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);
},

// this function will add the fields for SNMP general settings
addGeneralSettingsSection: function(obj){
    
    var generalTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
        titleText: 'SNMP General Settings'
    });
    
    var status = Ext.create( 'CP.WebUI4.Checkbox', {
        id: 'agentStatus',
        name: 'agentStatus',
        fieldLabel: 'Enable SNMP Agent',
        labelWidth: 110,
        handler: function( checkbox, checked ){
            CP.SNMP.disableEnableAll(!checked);
            CP.SNMP.enableGeneralSettingsApply(true);
        }
    });
    
    var version = Ext.create( 'CP.WebUI4.ComboBox', {
        id: 'snmp_ver',
        name: 'snmp_ver',
        fieldLabel: 'Version',
        labelWidth: 110,
        store: [['v1/v2/v3', 'v1 / v2 / v3 (any)'], ['v3-Only', 'v3-Only']],
        forceSelection: true,
        editable: false,
        listeners: {
            select: function (){
                CP.SNMP.enableGeneralSettingsApply(true);
            }
        }
    });
    
    var location = Ext.create( 'CP.WebUI4.TextArea', {
        id: 'location',
        name: 'location',
        fieldLabel: 'SNMP Location String',
        labelWidth: 110,
        width: 400,
        height: 50,
        maxLength: 127,
        listeners: {
            change: function( field, newVal, oldVal ){
                CP.SNMP.enableGeneralSettingsApply(true);
            }
        }
    });
    
    var contact = Ext.create( 'CP.WebUI4.TextArea', {
        id: 'contact',
        name: 'contact',
        fieldLabel: 'SNMP Contact String',
        labelWidth: 110,
        width: 400,
        height: 50,
        maxLength: 127,
        listeners: {
            change: function( field, newVal, oldVal ){
                CP.SNMP.enableGeneralSettingsApply(true);
            }
        }
    });
    
    var apply = Ext.create( 'CP.WebUI4.Button', {
        id: 'applyGeneralSettings',
	disabled: true,
        text: 'Apply',
        handler: CP.SNMP.applyGeneralSettingsHandler
    });
    
    // add the title and the fields to the main panel
    obj.add (generalTitle);
    obj.add (status);
    obj.add (version);
    obj.add (location);
    obj.add (contact);
    obj.add (apply);
},

// this function will add the fields for SNMP Custom Traps
addCustomTrapsSection : function (obj)
{    
	var CustomTrapsTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
    	titleText: 'Custom Traps'
	});
		
    //grid columns
    var columns = [{
        header: 'Name',
        dataIndex: 'CT_Name',
		width: 110
    },{
        header: 'OID',
        dataIndex: 'CT_OID',
		width: 160
    },{
        header: 'Operator',
        dataIndex: 'CT_OP',
        width: 90
    },{
        header: 'Threshold',
        dataIndex: 'CT_Threshold',
        width: 70
    },{
        header: 'Frequency',
        dataIndex: 'CT_Freq',
        width: 70
    },{
        header: 'Message',
        dataIndex: 'CT_Msg',
        flex: 1
    }];
    
	// the table
	var CustomTrapsTable = Ext.create( 'CP.WebUI4.GridPanel', {
	    id: 'CustomTrapsTable',
		height: 300,
	    width: 800,
	    store: {
	        xtype: 'cp4_store',
	        fields: [ 'CT_Name', 'CT_OID', 'CT_OP','CT_Threshold','CT_Freq','CT_Msg' ],
			sorters: ['CT_Name'],
	        data: {},
	        proxy: 'memory'
	    },
	    columns: columns,
	    listeners: {
	        beforeselect: function(){
                return Ext.getCmp('agentStatus').getValue();
            },
	        selectionchange: function( gridView, selections ){
	            switch(selections.length){
	            case 0: //nothing is chosen, disable both buttons
	                Ext.getCmp('delete_custom_trap_btn').disable();
	                Ext.getCmp('edit_custom_trap_btn').disable();
	                return;
	            case 1: //only one chosen, can delete and edit
	                Ext.getCmp('edit_custom_trap_btn').enable();
                    Ext.getCmp('delete_custom_trap_btn').enable();
                    return;
	            }
	        }
	    } 
	});
	
	//Add buttons to panel
	var buttonsBar = {
		xtype: 'cp4_btnsbar',
		items: [{
			id: 'add_custom_trap_btn',
			text: 'Add',
			handler: function(){
				CP.SNMP.CustomTrapWindow(false);
			}
		},{
			id: 'edit_custom_trap_btn',
			text: 'Edit',
			disabled: true,
			handler: function() {
				CP.SNMP.CustomTrapWindow(true, CustomTrapsTable.getSelectionModel());
			}
		},{
			id: 'delete_custom_trap_btn',
			text: 'Remove',
			disabled: true,
			handler: function() {
				function func(){
					Ext.Ajax.request({
						url: '/cgi-bin/snmp_monitor.tcl',
						method : 'POST',
						params: {
								Operation : "delete_custom_trap",
								CT_Name : SelectArr[0].data.CT_Name
						},
						success: function( response ) {
							var jsonData = Ext.decode(response.responseText);
							CP.util.setStatusMsg( jsonData );
							CP.SNMP.loadCustomTrapsData();
						}
					});
				}
				var rowSelect = CustomTrapsTable.getSelectionModel();
				var SelectArr = rowSelect.getSelection();
				if (SelectArr.length == 1){
					var TrapName = SelectArr[0].data.CT_Name;
					CP.SNMP.showAlertBeforeDeleting('Deleting Custom Trap', 'Are you sure you want to delete \"' + TrapName  + '\" trap?', func, rowSelect);
				}
			}
		}]
	};
	
	var ClearTrapInterval = {
		xtype : 'cp4_numberfield',
		id: 'clear_trap_interval',
		fieldLabel: 'Clear Trap Interval',
		minValue: 1,
		maxValue: 3600,
		listeners: {
			afterrender: function () {
				Ext.create( 'CP.WebUI4.ToolTip' ,{
					target: 'clear_trap_interval',
					html: 'An integer indicating time between clear trap packets, in seconds.',
					dismissDelay:0
				});
			}
		}		
	};
	
	var ClearTypeRetries = {
		xtype : 'cp4_numberfield',
		id: 'clear_trap_retries',
		fieldLabel: 'Clear Trap Retries',
		minValue: 1,
		maxValue: 100,
		listeners: {
			afterrender: function () {
				Ext.create( 'CP.WebUI4.ToolTip' ,{
					target: 'clear_trap_retries',
					html: 'An integer indicating number of clear trap packets to send.',
					dismissDelay:0
				});
			}
		}			
	};
	
	var ClearTrapSaveBtn = {
		xtype:'cp4_button',
		id : 'ClearTrapSaveBtn',
	    text: 'Apply',
		handler: function () {
			
			if(	!Ext.getCmp("clear_trap_interval").validate() || 
				!Ext.getCmp("clear_trap_retries").validate()) {
				return;
			}
			
			Ext.getCmp("ClearTrapSaveBtn").setDisabled(true);
			
			Ext.Ajax.request({
				url: '/cgi-bin/snmp_monitor.tcl',
				method : 'POST',
				params: {
					Operation : "set_clear_trap",
					ClearTrapInterval : Ext.getCmp("clear_trap_interval").getValue(),
					ClearTrapRetries : Ext.getCmp("clear_trap_retries").getValue(),
				},
				success: function( response ) {
					var jsonData = Ext.decode(response.responseText);
					Ext.getCmp("ClearTrapSaveBtn").setDisabled(false);
					CP.util.setStatusMsg( jsonData );				
				},
				failure : function (response) {
					Ext.getCmp("ClearTrapSaveBtn").setDisabled(false);
				}
			});
			
			Ext.getCmp("clear_trap_interval").originalValue = Ext.getCmp("clear_trap_interval").getValue();
			Ext.getCmp("clear_trap_retries").originalValue = Ext.getCmp("clear_trap_retries").getValue();
		}
	};
	
	var CustomTrapsSettings = Ext.create( 'CP.WebUI4.FieldSet', {
	    id: 'CustomTrapsSettings',
	    name: 'CustomTrapsSettings',
	    style: 'border: 0; padding: 0',
		items: [CustomTrapsTitle,buttonsBar,CustomTrapsTable,ClearTrapInterval,ClearTypeRetries,ClearTrapSaveBtn]
	});		
	
	obj.add(CustomTrapsSettings);
},

CustomTrapWindow : function (isEdit, rowSelect){
    
	var form = Ext.create( 'CP.WebUI4.FormPanel', {
	    id: 'CustomTrapWindowForm',
	    bodyStyle: 'padding:10px;',
		items: [{
		    xtype: 'cp4_textfield',
		    id: 'ct_name',
		    fieldLabel: 'Trap Name',
			regex: /^[A-Za-z0-9_-]+$/,
            regexText: 'Invalid Name. A custom trap name contains only letters, numbers or _-',
		    allowBlank: false,
		    maxLength: 128,
			validator: function(value)
			{
				var customTrapsStore = Ext.getCmp('CustomTrapsTable').getStore();
				if (customTrapsStore && customTrapsStore.find('CT_Name',value,0,false,true,true) != -1) {
					return 'custom trap already exists!';
				}
				return true;
			}
		},{
		    xtype: 'cp4_textfield',
		    id: 'ct_oid',
		    fieldLabel: 'OID',
		    allowBlank: false,
		    maxLength: 128
		},{
		    xtype: 'cp4_combobox',
		    id: 'ct_op',
		    fieldLabel: 'Operator',
		    store: ['Equal', 'Not_Equal', 'Less_Than','Greater_Than','Changed'],
		    forceSelection: true,
		    editable: false,
		    allowBlank: false,
		    listeners: {
				render: function () {
					Ext.getCmp("ct_threshold").old_threshold = undefined;
				},
		        change: function (Cmp,newValue, oldValue, eOpts){
		            if(newValue == "Changed") {
						var old_threshold = Ext.getCmp("ct_threshold").getValue();
						Ext.getCmp("ct_threshold").setValue("change");
						Ext.getCmp("ct_threshold").setDisabled(true);
						Ext.getCmp("ct_threshold").old_threshold = old_threshold;
					} else {
						Ext.getCmp("ct_threshold").setDisabled(false);
						if(Ext.getCmp("ct_threshold").old_threshold != undefined) {
							Ext.getCmp("ct_threshold").setValue(Ext.getCmp("ct_threshold").old_threshold);
							Ext.getCmp("ct_threshold").old_threshold = undefined;
							if(!Ext.getCmp("ct_threshold").isValid()) {
								Ext.getCmp("ct_threshold").clearInvalid();
							}
						}
					}
		        }
		    }
		},{
		    xtype: 'cp4_textfield',
		    id: 'ct_threshold',
		    fieldLabel: 'Threshold',
		    allowBlank: false,
		    maxLength: 128
		},{
		    xtype: 'cp4_textfield',
		    id: 'ct_freq',
		    fieldLabel: 'Frequency',
		    allowBlank: false,
			vtype: 'posint',
		    maxLength: 128,
			listeners: {
				afterrender: function () {
					Ext.create( 'CP.WebUI4.ToolTip' ,{
						target: 'ct_freq',
						html: 'The polling interval in seconds, expressed as a positive integer, The daemon polls each monitored OID at the specified interval. ',
						dismissDelay:0
					});
				}
			}
		},{
		    xtype: 'cp4_textfield',
		    id: 'ct_msg',
		    fieldLabel: 'Message',
			regex: /^[A-Za-z0-9 ,\\.!%_-]+$/,
            regexText: 'Invalid message. A custom trap message contains letters, numbers, spaces or _-!%.,',
		    allowBlank: false,
		    maxLength: 128
		}],  
		//Save and cancel buttons
		buttons: [{
		    xtype: 'cp4_button',
		    text: 'Save',
			handler: function(){ //todo : add validation to all fields !
			
				if( !Ext.getCmp("ct_name").validate() ||
					!Ext.getCmp("ct_oid").validate() ||
					!Ext.getCmp("ct_op").validate() ||
					!Ext.getCmp("ct_threshold").validate() ||
					!Ext.getCmp("ct_freq").validate() ||
					!Ext.getCmp("ct_msg").validate() ) {
					return;
				}
			
				var ct_name = Ext.getCmp("ct_name").getValue();
				var ct_oid = Ext.getCmp("ct_oid").getValue();
				var ct_op = Ext.getCmp("ct_op").getValue();
				var ct_threshold = Ext.getCmp("ct_threshold").getValue();
				var ct_freq = Ext.getCmp("ct_freq").getValue();
				var ct_msg = Ext.getCmp("ct_msg").getValue();
								
			    Ext.Ajax.request({
					url: '/cgi-bin/snmp_monitor.tcl',
					method : 'POST',
					params: {
							Operation : "add_custom_trap",
							 CT_Name : ct_name,
							 CT_OID : ct_oid,
							 CT_OP : ct_op,
							 CT_Threshold : ct_threshold,
							 CT_Freq : ct_freq,
							 CT_Msg : ct_msg
							},
					success: function( response ) {
						var jsonData = Ext.decode(response.responseText);
						CP.SNMP.loadCustomTrapsData();

						if (CP.SNMP.ProblemSendingCustomTraps())
						{
							jsonData.messages[0]+=". Note: Custom traps cannot be sent because neither community nor trap user are defined.";
						}

						CP.util.setStatusMsg( jsonData );
					}
				});
				
				Ext.getCmp('CustomTrapWindow').close();
			}
		},{
		    xtype: 'cp4_button',
			text: 'Cancel',
			handler: function(){
				Ext.getCmp('CustomTrapWindow').close();
			}
		}]
	});
	
	var windowTitle = 'Add New Custom Trap';

	
	// determine if this is Add or Edit
	if (isEdit){
		// we cannot set the ip of the receiver - if somebody want to change it, he will need to delete it
		var SelectArr = rowSelect.getSelection();
		windowTitle = 'Edit Custom Trap';

		Ext.getCmp("ct_name").setDisabled(true);
		Ext.getCmp("ct_name").setValue(SelectArr[0].data.CT_Name);
		Ext.getCmp("ct_oid").setValue(SelectArr[0].data.CT_OID);
		Ext.getCmp("ct_op").setValue(SelectArr[0].data.CT_OP);
		Ext.getCmp("ct_threshold").setValue(SelectArr[0].data.CT_Threshold);
		Ext.getCmp("ct_freq").setValue(SelectArr[0].data.CT_Freq);
		Ext.getCmp("ct_msg").setValue(SelectArr[0].data.CT_Msg);
	} else {
		Ext.getCmp("ct_name").setDisabled(false);
	}
	

	//Modal window for add, edit, delete
	var window = Ext.create( 'CP.WebUI4.ModalWin', {
		id: 'CustomTrapWindow',
		title: windowTitle,
		items: [ form ]
	});
	window.show();
},

ProblemSendingCustomTraps: function()
{
	if (Ext.getCmp('CustomTrapsTable').getStore().count() == 0) /* if no custom traps configured */
	{
		return false;
	}
	
	if (Ext.getCmp('snmp_ver').getValue() == "v3-Only")
	{
		return Ext.getCmp('trapUser').getValue() == null;
	}
	
	/* v1 /v2 /v3 (any) */
	return Ext.getCmp('roCommunityString').getValue() == "" && Ext.getCmp('rwCommunityString').getValue() == "" && Ext.getCmp('trapUser').getValue() == null;
},


// this function will add the fields for SNMP trap receivers
addTrapReceiversSection : function (obj){
    
	var trapsTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
    	titleText: 'Trap Receivers Settings'
	});
	
	obj.add(trapsTitle);
	CP.SNMP.addTrapReceiversTable(obj);
},

// this function will add the trap receivers table
addTrapReceiversTable: function(obj){
	
    //grid columns
    var columns = [{
        header: 'IP Address',
        dataIndex: 'trap_r'
    },{
        header: 'Version',
        dataIndex: 't_ver',
        width: 70
    },{
        header: 'Community String',
        dataIndex: 't_comm',
        flex: 1
    }];
    
	// the table
	var trapReceivers = Ext.create( 'CP.WebUI4.GridPanel', {
	    id: 'trapReceiversTable',
	    maxHeight: 120,
	    width: 350,
	    multiSelect: true,
	    store: {
	        xtype: 'cp4_store',
	        fields: [ 'trap_r', 't_ver', 't_comm' ],
	        data: {},
	        proxy: 'memory'
	    },
	    columns: columns,
	    listeners: {
	        beforeselect: function(){
                return Ext.getCmp('agentStatus').getValue();
            },
	        selectionchange: function( gridView, selections ){
	            switch(selections.length){
	            case 0:
	                //nothing is chosen, disable both buttons
	                Ext.getCmp('receiversRemove_button').disable();
	                Ext.getCmp('receiversEditButton').disable();
	                return;
	            case 1:
	                //only one chosen, can delete and edit
	                Ext.getCmp('receiversEditButton').enable();
                    Ext.getCmp('receiversRemove_button').enable();
                    return;
	            default:
	                //multiple chosen, can delete but not edit
                    Ext.getCmp('receiversRemove_button').enable(); 
                    Ext.getCmp('receiversEditButton').disable();
	            }
	        }
	    }
	});
	
	//Add buttons to panel
	var buttonsBar = {
	        xtype: 'cp4_btnsbar',
	        items: [{
	            id: 'add_new_trap_receiver',
	            text: 'Add',
	            handler: function(){
                    CP.SNMP.receiverSectionWindow(false);
                }
	        },{
	            id: 'receiversEditButton',
	            text: 'Edit',
	            disabled: true,
	            handler: function(){
	                CP.SNMP.receiverSectionWindow(true, trapReceivers.getSelectionModel());
	            }
	        },{
	            id: 'receiversRemove_button',
	            text: 'Remove',
	            disabled: true,
	            handler: function(){
	                function func(){
	                    CP.SNMP.RemoveTrapReceivers(rowSelect);
	                }
	                var rowSelect = trapReceivers.getSelectionModel();
	                var SelectArr = rowSelect.getSelection();
	                if (SelectArr.length == 1){
	                    var receiverName = SelectArr[0].data.trap_r;
	                    CP.SNMP.showAlertBeforeDeleting('Deleting Trap Receiver Entry', 'Are you sure you want to delete \"' + receiverName  + '\" entry?', func, rowSelect);
	                } else{
	                    CP.SNMP.showAlertBeforeDeleting('Deleting Trap Receivers Entries', 'Are you sure you want to delete ' + SelectArr.length + ' entries?', func, rowSelect);
	                }
	            }
	        }]
	};

	// buttons
	obj.add(buttonsBar);
	//Add grid
	obj.add(trapReceivers);
},

// this function will create the trap receivers window (when pressing add / edit) for the receivers section
receiverSectionWindow : function (isEdit, rowSelect){
    
	var form = Ext.create( 'CP.WebUI4.FormPanel', {
	    id: 'receiverSectionWindowForm',
	    bodyStyle: 'padding:10px;',
		maxHeight: 150,
		items: [{
		    xtype: 'cp4_IPHybridField',
		    id:'receiverIPAddress',
		    name: 'receiverIPAddress'
		},{
		    xtype: 'cp4_combobox',
		    id: 'receiverVersion',
			name: 'receiver_Version',
		    fieldLabel: 'Version',
		    store: ['v1', 'v2', 'v3'],
		    forceSelection: true,
		    editable: false,
		    allowBlank: false,
		    listeners: {
		        render: function (){
		            CP.SNMP.enableDisableReceiverCommunity();
		        },
		        select: function (){
		            CP.SNMP.enableDisableReceiverCommunity();
		        }
		    }
		},{
		    xtype: 'cp4_textfield',
		    id: 'receiverCommunityString',
		    name: 'receiverCommunityString',
		    fieldLabel: 'Community String',
            regex: /^[A-Za-z0-9!&_-]+$/,
            regexText: 'Community names can not contain spaces or special characters',
		    allowBlank: false,
		    maxLength: 128
		}],  
		//Save and cancel buttons
		buttons: [{
		    xtype: 'cp4_button',
		    text: 'Save',
			handler: function(){
			    
				var ipAddress = Ext.getCmp('receiverIPAddress');
				var community = Ext.getCmp('receiverCommunityString');
				var version = Ext.getCmp('receiverVersion');
				
				if (form.getForm().isValid()){
					CP.SNMP.SetTrapReceiverEntry (ipAddress.getValue(), community.getValue(), version.getValue());
					Ext.getCmp('receiversWindow').close();
				}
			}
		},{
		    xtype: 'cp4_button',
			text: 'Cancel',
			handler: function(){
				Ext.getCmp('receiversWindow').close();
			}
		}]
	});
	
	var windowTitle = 'Add New Trap Receiver';
	// determine if this is Add or Edit
	if (isEdit){
		// we cannot set the ip of the receiver - if somebody want to change it, he will need to delete it
		var SelectArr = rowSelect.getSelection();
		windowTitle = 'Edit Trap Receiver';
		Ext.getCmp('receiverIPAddress').setValue(SelectArr[0].data.trap_r);
		Ext.getCmp('receiverIPAddress').disable();
		// if the receiver version is v3 than we'll show empty text as the commnity string
		if (SelectArr[0].data.t_ver == 'v3'){
			Ext.getCmp ('receiverCommunityString').setValue ('');
		} else{
			Ext.getCmp ('receiverCommunityString').setValue (SelectArr[0].data.t_comm);
		}
		Ext.getCmp ('receiverVersion').setValue(SelectArr[0].data.t_ver);
	}

	//Modal window for add, edit, delete
	var window = Ext.create( 'CP.WebUI4.ModalWin', {
		id: 'receiversWindow',
		title: windowTitle,
		width: 410,
		height: 170,
		items: [ form ]
	});
	window.show();
},

// show alert before removing the entries
showAlertBeforeDeleting: function(myTitle, myMsg, startFunc, rowSelect) {

    CP.WebUI4.Msg.show({
        title: myTitle,
        msg: myMsg,
        buttons: Ext.Msg.YESNO,
        fn: function(button, text, opt) {
            if (button == 'yes')
                startFunc();
        },
        icon: 'webui-msg-question'
    });
}, // showAlertBeforeDeletingTrap
	
// this function will remove a trap receiver entry from the table and DB
RemoveTrapReceivers: function(rowSelectl) {
    var SelectArr = rowSelectl.getSelection();
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var myparams = pageObj.params;
    
    for (var i = 0; i < SelectArr.length; i++){
       myparams['snmp:trap_rcv:' + SelectArr[i].data.trap_r + ':bool'] = '';
    }
    
    CP.UI.submitData( pageObj );
},

// the function which stores the trap information to the DB (makes POST)
SetTrapReceiverEntry: function(trap_r, t_comm, t_ver) {
    
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var myparams = pageObj.params;
    
    myparams['newTrap_r'] = trap_r;
    // if the receiver version is 'v3' than no community needs to be inserted
    if (t_ver == 'v3'){
        myparams['snmp:trap_rcv:' + trap_r + ':community'] = '';
    } else{
        myparams['snmp:trap_rcv:' + trap_r + ':community'] = t_comm;
    }
    myparams['snmp:trap_rcv:' + trap_r + ':version'] = t_ver;
 
    CP.UI.submitData( pageObj );
},

// this function perform the POST for creating a new usm user or editing an existing one
SetUSM_UserEntry: function(userName, secLvl, permission, authKey, privKey, privProtocol, authProtocol, isEdit) {
    
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var myparams = pageObj.params;
    
    myparams['adduser'] = userName;
    myparams['adduser:seclvl'] = secLvl;
    myparams['adduser:permission'] = permission;
    myparams['adduser:authkey'] = authKey;       
    myparams['adduser:privkey'] = privKey;
    myparams['adduser:privacyProtocol'] = privProtocol;	       
	myparams['adduser:authenticationProtocol'] = authProtocol;	
    myparams['userMarker'] = '';
    // if we are editing existing user mark it
    if (isEdit){
        myparams['editMarker'] = '';
    }
    
    CP.UI.submitData( pageObj );
},

postEnabledTraps : function (newTraps, oldTraps){
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var myparams = pageObj.params;
	
	for (var i = 0; i < newTraps.getCount(); i++){
	    var trap = newTraps.getAt(i).data.trapName;
	    if ( oldTraps.find('trapName', trap, null, null, null, true) == -1 ){
	        myparams['traps:' + trap] = 'on';
	    }
	}
	for (var i = 0; i < oldTraps.getCount(); i++){
	    var trap = oldTraps.getAt(i).data.trapName;
	    if (newTraps.find('trapName', trap, null, null, null, true) == -1){
	        myparams['traps:' + trap] = 'off';
	    }
	}

	CP.UI.submitData( pageObj );
},

// this function will add the fields for SNMP trap receivers
addEnabledTrapsSection : function(obj){
    
	var enabledTrapsTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
    	titleText: 'Enabled Traps'
	});
	
	obj.add(enabledTrapsTitle);
	CP.SNMP.addEnableTrapsTable(obj);
},

// this function will add the trap receivers table
addEnableTrapsTable: function(obj) {
	
    // Columns
    var columns = [{
        header: 'Trap Name',
        dataIndex: 'trapName',
		flex: 1
    }];
	
    
	// the table
    var enabledTraps = Ext.create( 'CP.WebUI4.GridPanel', {
        id: 'enabledTrapsTable',
        autoScroll: true,
        maxHeight: 120,
        width: 350,
        store: {
            xtype: 'cp4_store',
            fields: [ 'trapName' ],
            data: {},
            proxy: 'memory'
        },
        columns: columns
    });
    enabledTraps.getSelectionModel().setLocked(true);
	
	//Add buttons to panel
	var buttonsBar = {
	        xtype: 'cp4_btnsbar',
	        items: [{
	            xtype: 'cp4_button',
	            id: 'set_enabled_traps_button',
	            text: 'Set',
	            handler: function(){ 
	                CP.SNMP.enabledTrapsSectionWindow();
	            }
	        }]
	};

    var trapUser = CP.SNMP.getTrapUserComboBox();
    var pollingFrequency = CP.SNMP.getPollingFrequency();

	// buttons
	obj.add(buttonsBar);
	//Add grid
	obj.add(enabledTraps);
	
	obj.add(trapUser);
	obj.add(pollingFrequency);
	obj.add(CP.SNMP.addTrapUserApplyButton());
},

addTrapUserApplyButton: function(){
	var button = {
	        xtype:'cp4_button',
	        id: 'trapUserApplyButton',
		disabled: true,
	        text: 'Apply',
	        handler: CP.SNMP.applyTrapUserHandler
	};
	return button;
},

getTrapUserComboBox: function (){
	
	var trapUser = {
	        xtype: 'cp4_combobox',
	        id: 'trapUser',
			name: 'trap_user',
	        fieldLabel: 'Trap User',
	        store : Ext.getCmp('v3USMTable').getStore(),
	        displayField: 'userName',
	        maxHeight: 225,
	        listeners:{
	            select: function (){
	                CP.SNMP.enableTrapUserApply(true);
	            }
	        },
	        forceSelection: true,
	        editable: false
	};
		
	return trapUser;
},

getPollingFrequency: function (){
	
	var pollingFrequency = {
	        xtype: 'cp4_positiveint',
	        id: 'pollingFrequency',
	        fieldLabel: 'Polling Frequency',
                minValue: 1,
                maxValue: 864000,	// 10 days in seconds. If this value is going to be updated, please update also 
									// 1) Qualifier for polling-frequency command (in cli_snmp.h)
									// 2) SNMP_MAX_TRAPS_POLLING_FREQ definition (in snmp_cdk.c)
	        listeners: {
	            change: function (){
	                CP.SNMP.enableTrapUserApply(true);
	            }
	        }
	};

	return pollingFrequency;
},	

// this function creates the window for the enbaled traps section
enabledTrapsSectionWindow: function(){
	
    var rightStore = Ext.getCmp('enabledTrapsTable').getStore();
    var leftStore = Ext.create( 'CP.WebUI4.Store',{
        fields: [ 'trapName' ],
        data: CP.SNMP.tablesData.allTraps,
        proxy: 'memory'
    });
    var tempStore = Ext.create( 'CP.WebUI4.Store',{
        fields: [ 'trapName' ],
        data: {},
        proxy: 'memory'
    });
    for (var i = 0; i < rightStore.getCount(); i++){
        tempStore.add(rightStore.getAt(i));
    }
    
    for (var i = 0; i < rightStore.getCount(); i++){
        var trap = rightStore.getAt(i).data.trapName;
        var index = leftStore.find('trapName', trap, null, null, null, true);
        leftStore.removeAt(index);
    }
    
    var dualList = Ext.create( 'CP.WebUI4.DualList', {
        id: 'traps_duallist',
        listHeight: 230,
        //left
        leftListStore: leftStore,
        leftListCol: [{
            text: 'Disabled Traps',
            dataIndex: 'trapName'
        }],
        //right
        rightListStore: rightStore,
        rightListCol: [{
            text: 'Enabled Traps',
            dataIndex: 'trapName'
        }]
    });
    
	var form = Ext.create( 'CP.WebUI4.FormPanel',{
		bodyStyle: 'padding:10px;',
		id: 'enabledTrapsSectionWindowForm',
		items: [dualList],
		//Save and cancel buttons
		buttons: [{
		    xtype: 'cp4_button',
			text: 'Save',
			handler: function(){
				CP.SNMP.postEnabledTraps(rightStore, tempStore);
				Ext.getCmp( 'enabledTrapsWindow' ).close();
			}
		},{
		    xtype: 'cp4_button',
			text: 'Cancel',
			handler: function(){
				Ext.getCmp( 'enabledTrapsWindow' ).close();
			}			
		}]
	});

	//Modal window for add, edit, delete
	var modalWindow = Ext.create( 'CP.WebUI4.ModalWin', {
		id: 'enabledTrapsWindow',
		title: 'Add New Trap Receiver',
		width: 535,
		height: 330,
		items: [ form ]
	});
	modalWindow.show();
},

// this function will create the snmp addresses section
add_snmp_addresses_section: function(obj){

	var snmp_address = Ext.create( 'CP.WebUI4.SectionTitle', {
		titleText: 'Agent Interfaces'
	});
	var snmp_zero_interfaces_msg = Ext.create( 'CP.WebUI4.inlineMsg',{
		id: 'snmp_zero_interfaces_msg',
		type: 'warning',
		hidden: true,
		text: 'at least one interface must be selected'
	});
	obj.add(snmp_address);
	CP.SNMP.add_snmp_addresses_table(obj);
	obj.add(snmp_zero_interfaces_msg);
},


add_snmp_addresses_table: function(obj){

    var sm = Ext.create('CP.WebUI4.CheckboxModel', {
        listeners: {
            selectionchange: function( thisCM, setArray, index){
                var setArr = "";
                var delArr = "";
				var setCount = 0;
                for (var i=0; i<thisCM.store.data.length; i++) {
                    if (thisCM.isSelected(i)) {
                        var tmpObj = thisCM.store.getAt(i);
                        setArr = setArr + " " + thisCM.store.getAt(i).data.t_bind_intf;
						setCount++;
                    } else {
                        delArr = delArr + " " + thisCM.store.getAt(i).data.t_bind_intf;
                    }
                }
				
				if(setCount > 0) {
					Ext.getCmp("snmp_zero_interfaces_msg").setVisible(false);
					if ( thisCM.getCount() == thisCM.store.data.length ) {
						CP.SNMP.eachChangeInAgentAdresses(delArr, setArr);
					} else {
						CP.SNMP.eachChangeInAgentAdresses(setArr, delArr);
					}
				} else {
					Ext.getCmp("snmp_zero_interfaces_msg").setVisible(true);
				}
            }
        }
    });
	
        // store the database
    var store = Ext.create( 'CP.WebUI4.Store', {
        fields: [ 't_bind_selected', 't_bind_intf', 't_bind_addr' ],
        data: {},
        proxy: 'memory',

        listeners: {
            datachanged: function( thisStore, options ){
                thisStore.each( function( record ){
			var tbl = Ext.getCmp('addrTable');
			if (record.data.t_bind_selected == "1")
				sm.select(record, true, true);
                });

            } //eof datachanged
		}

    });
	
    // Columns
    var columns = [{
        header: 'Interface',
        dataIndex: 't_bind_intf',
        flex: 1,
		renderer:  function renderFeaturesListBrief( value, meta, record) {			
			if(value != "" && record.data.t_bind_addr != "") {
				return value + "\t\t[" + ("" + record.data.t_bind_addr).replace(" "," , ") + "]";
			}
			return value;
		}
    }];
	
    var addrTable = Ext.create('CP.WebUI4.GridPanel', {
        id: 'addrTable',
        width: 350,
        maxHeight: 120,
        store: store,
        selModel: sm,
        columns: columns,
        columnLines: true,
        listeners:{
            beforeselect: function(){
                return Ext.getCmp('agentStatus').getValue();
            },
            beforedeselect: function(){
                return Ext.getCmp('agentStatus').getValue();
			}
        }
    });
	
   obj.add(addrTable);

},


// this function will create the V1 / V2 section
addV1_V2_Settings_section: function(obj){

	var generalTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
        	titleText: 'V1 / V2 Settings'
    	});
	var v1V2Settings = Ext.create( 'CP.WebUI4.FieldSet', {
	    id: 'v1V2Settings',
	    name: 'v1V2Settings',
	    style: 'border: 0; padding: 0',
		items: [generalTitle,
		{		    
		    xtype: 'cp4_textfield',
		    id: 'roCommunityString',
		    name: 'roCommunityString',
		    fieldLabel: 'Read Only Community String',
		    labelWidth: 155,
		    maxLength: 128,
		    regex: /^[A-Za-z0-9!&_-]+$/,
		    regexText: 'Community names can not contain spaces or special characters',
		    listeners: {
		        change: function( field ){
		            if (field.isValid()){
                        CP.SNMP.enable_V1_V2_SettingsApply(true);
                    }
		        },
		        validitychange: function( field, isValid ){
                    CP.SNMP.enable_V1_V2_SettingsApply(isValid);
                }
		    }
		},{
		    xtype: 'cp4_textfield',
		    id: 'rwCommunityString',
		    name: 'rwCommunityString',
		    fieldLabel: 'Read-Write Community String',
		    labelWidth: 155,
		    maxLength: 128,
		    regex: /^[A-Za-z0-9!&_-]+$/,
		    regexText: 'Community names can not contain spaces or special characters',
		    listeners: {
		        change: function( field ){
		            if (field.isValid()){
		                CP.SNMP.enable_V1_V2_SettingsApply(true);
		            }
		        },
		        validitychange: function( field, isValid ){
		            CP.SNMP.enable_V1_V2_SettingsApply(isValid);
		        }
		    }
		},{
		    xtype: 'cp4_button',
		    id: 'V1_V2_apply_button',
		    disabled: true,
		    text: 'Apply',
		    handler: CP.SNMP.applyV1_V2SettingsHandler
		}]
	});	
    
	// add the title and the fields to the main panel
	obj.add(v1V2Settings);
},

// this function will add the fields for SNMP trap receivers
addV3_USMSection: function(obj){
    
	var V3_USMTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
    	titleText: 'V3 - User-Based Security Model (USM)'
	});
	
	obj.add(V3_USMTitle);
	CP.SNMP.addV3_USMTable(obj);
},

// this function will add the trap receivers table
addV3_USMTable: function(obj){
	
	// store the database
    var store = Ext.create( 'CP.WebUI4.Store', {
        fields: [ 'userName', 'securityLevel', 'privateProtocol', 'authenticationProtocol' ],
        data: {},
        proxy: 'memory'
    });
	
    // Columns
    var columns = [{
        header: 'User Name',
        dataIndex: 'userName',
        flex: 1
    },{
        header: 'Security Level',
        dataIndex: 'securityLevel',
        flex: 1
	},{
        header: 'Privacy Protocol',
        dataIndex: 'privateProtocol',
        flex: 1
    },{
        header: 'Authentication Protocol',
        dataIndex: 'authenticationProtocol',
        flex: 1
    }];
	
	// the table
    var v3USMTable = Ext.create( 'CP.WebUI4.GridPanel', {
        id: 'v3USMTable',
        maxHeight: 120,
        width: 600,
        store: store,
        columns: columns,
        listeners: {
            beforeselect: function(){
                return Ext.getCmp('agentStatus').getValue();
            },
            selectionchange: function( gridView, selections ){
                switch(selections.length){
                case 0:
                    //nothing is chosen, disable both buttons
                    Ext.getCmp('USM_User_remove_button').disable();
                    Ext.getCmp('usm_user_EditButton').disable();
                    return;
                case 1:
                    //only one chosen, can delete and edit
                    Ext.getCmp('USM_User_remove_button').enable();
                    Ext.getCmp('usm_user_EditButton').enable();
                    return;
                default:
                    //multiple chosen, can delete but not edit
                    Ext.getCmp('USM_User_remove_button').enable(); 
                    Ext.getCmp('usm_user_EditButton').disable();
                }
            }
        }
    });
	
	//Add buttons to panel
	var buttonsBar = {
	        xtype: 'cp4_btnsbar',
	        items: [{
	            xtype: 'cp4_button',
	            id: 'add_usm_user_trap',
	            text: 'Add',
	            handler: function() {
	                CP.SNMP.v3UsmSectionWindow(false);
                }
	        },{
	            xtype: 'cp4_button',
	            id: 'usm_user_EditButton',
	            text: 'Edit',
	            disabled: true,
	            handler: function() {
	                CP.SNMP.v3UsmSectionWindow(true, v3USMTable.getSelectionModel());
	            }
	        },{
	            xtype: 'cp4_button',
	            id: 'USM_User_remove_button',
	            text: 'Remove',
	            disabled: true,
	            handler: function(){
	                function func(){
	                    CP.SNMP.RemoveV3_USM_User(rowSelect);
	                }
	                var rowSelect = v3USMTable.getSelectionModel();
	                var SelectArr = rowSelect.getSelection();
	                if (SelectArr.length == 1){
	                    var userName = SelectArr[0].data.userName;
	                    CP.SNMP.showAlertBeforeDeleting('Deleting USM User Entry', 'Are you sure you want to delete \"' + userName + '\" entry?', func, rowSelect);
	                } else{
	                    CP.SNMP.showAlertBeforeDeleting('Deleting USM User Entries', 'Are you sure you want to delete ' +  SelectArr.length + ' entries?', func, rowSelect);
	                }
	            }
	        }]
	};
    
	// buttons
	obj.add(buttonsBar);
	//Add grid
	obj.add(v3USMTable);
},

// this function will add the window (when pressing add / edit) for the v3 - usm section
v3UsmSectionWindow: function(isEdit, rowSelect){
	
	var form = Ext.create( 'CP.WebUI4.FormPanel', {
		bodyStyle: 'padding:10px;',
		id: 'v3USMSectionWindowForm',
		labelWidth: 140,
		maxHeight: 320,
		items: [{
		    xtype: 'cp4_textfield',
		    id: 'v3UserName',
		    name: 'v3UserName',
		    fieldLabel: 'User Name',
		    allowBlank: false,
		    // does not use vtype 'username' because snmp allows ponly 31 characters and not 32
		    maskRe: /[-_.a-zA-Z0-9]/,
		    validator: function(value){
		        var unRule = /^[a-zA-Z][-_.a-zA-Z0-9]{0,30}$/;
		        var errorMsg = 'Username must begin with a letter and cannot exceed 31 characters. Please use alphanumerics, "-", "_", and "."';
		        return (unRule.test(value) ? true : errorMsg);
		    }
		},{
		    xtype: 'cp4_combobox',
		    id: 'v3SecurityLevel',
			name: 'security_level',
		    fieldLabel: 'Security Level',
		    store: ['authPriv', 'authNoPriv'],
		    forceSelection: true,
		    editable: false,
		    allowBlank: false,
		    listeners: {
		        select: function (){
		            if (Ext.getCmp('v3SecurityLevel').getValue () == 'authNoPriv'){
		                Ext.getCmp('v3Privacy').validate();
		                Ext.getCmp('v3Privacy').disable();
						Ext.getCmp('v3PrivacyProtocol').disable();
		            } else{
		                Ext.getCmp ('v3Privacy').enable();
						Ext.getCmp('v3PrivacyProtocol').enable();
						Ext.getCmp('v3AuthenticationProtocol').enable();
		            }
		        }
		    }
		},{
                    xtype: 'cp4_combobox',
                    id: 'v3permission',
					name: 'user_permissions',
                    fieldLabel: 'User Permissions',
                    store: ['read-only', 'read-write'],
                    forceSelection: true,
                    editable: false,
                    allowBlank: false,
                    listeners: {
                        select: function (){
                        }
                    }

		},{
		    xtype: 'cp4_combobox',
		    id: 'v3AuthenticationProtocol',
			name: 'autentication_protocol',
		    fieldLabel: 'Authentication Protocol',
		    store: ['MD5', 'SHA1'],
		    forceSelection: true,
		    editable: false,
		    allowBlank: true
		},{
		    xtype: 'cp4_password',
		    id: 'v3Authentication',
		    name:'v3Authentication',
		    fieldLabel: 'Authentication Passphrase',
		    validator: function(value){
		        // if we are in Add than it must have at least 8 characters
		        if (!isEdit && value.length >= 8){
		            return true;
		        }
		        // if we are in edit than we permit blank (keeping the old password) or at least 8 characters
		        if (isEdit && ((value.length >= 8) || (value.length == 0))){
		            return true;
		        }
		        
		        if (!isEdit){
		            return 'Password should be at least 8 characters';
		        }
		        return 'New password should be at least 8 characters. To keep the old password use empty line.';
		    }
		},{
		    xtype: 'cp4_combobox',
		    id: 'v3PrivacyProtocol',
			name: 'privacy_protocol',
		    fieldLabel: 'Privacy Protocol',
		    store: ['DES', 'AES'],
		    forceSelection: true,
		    editable: false,
		    allowBlank: true
		},{
		    xtype: 'cp4_password',
		    id: 'v3Privacy',
		    name: 'v3Privacy',
		    fieldLabel: 'Privacy Passphrase',
		    validator: function(value){
		        // if we are Adding new user than it must have at least 8 characters
		        if (!isEdit && (Ext.getCmp('v3SecurityLevel').getValue() == 'authPriv') && (value.length < 8)){
		            return 'Password should be at least 8 characters';
		        }
		        
		        // edit user //
		        // if we are in edit, than we permit blank (keeping the old password) only if the security level was authPriv (otherwise it don't have password)
		        // if it was authNoPriv or you want to set new password to authPriv than it must have at least 8 characters
		        if (isEdit){
		            var initialSecurityLevel = rowSelect.getSelection()[0].data.securityLevel;
		            // if the securitylevel was authPriv and remaind authPriv
		            if (initialSecurityLevel == 'authPriv' && Ext.getCmp('v3SecurityLevel').getValue() == 'authPriv'
		                && (value.length > 0) && (value.length < 8)){
		                return 'New password should be at least 8 characters. To keep the old password use empty line.';
		            }
											
		            // if the securitylevel was authNoPriv and was set to authPriv
		            if (initialSecurityLevel == 'authNoPriv' && Ext.getCmp('v3SecurityLevel').getValue() == 'authPriv'
		                && value.length < 8){
		                return 'Password should be at least 8 characters';
		            }
		        }
		        return true;
		    }
		}],	  
		//Save and cancel buttons
		buttons: [{
		    xtype: 'cp4_button',
			text: 'Save',
			handler: function(){

				var userName = Ext.getCmp('v3UserName');
				var securityLevel = Ext.getCmp('v3SecurityLevel');
				var authenticationPhrase = Ext.getCmp('v3Authentication');
				var privacyPhrase = Ext.getCmp('v3Privacy');
				var permission = Ext.getCmp('v3permission');
				var privacyProtocol = Ext.getCmp('v3PrivacyProtocol');
				var authenticationProtocol = Ext.getCmp('v3AuthenticationProtocol');

				if (form.getForm().isValid()){
					if (Ext.getCmp ('v3Privacy').disabled){
						privacyPhrase.setValue ('');
					}
					if (isEdit){
						CP.SNMP.SetUSM_UserEntry (userName.getValue(), securityLevel.getValue(), permission.getValue(), authenticationPhrase.getValue(), privacyPhrase.getValue(), privacyProtocol.getValue(), authenticationProtocol.getValue(), true);
					} else{
						CP.SNMP.SetUSM_UserEntry (userName.getValue(), securityLevel.getValue(), permission.getValue(), authenticationPhrase.getValue(), privacyPhrase.getValue(), privacyProtocol.getValue(), authenticationProtocol.getValue(),false);
					}
					Ext.getCmp( 'v3USMWindow' ).close();
				}
			}
		},{
		    xtype: 'cp4_button',
			text: 'Cancel',
			handler: function(){
				Ext.getCmp( 'v3USMWindow' ).close();
			}
		}]
	});

	var windowTitle = 'Add New USM User';
	// determine if this is Add or Edit
	if (isEdit){
		// we cannot set the ip of the receiver - if somebody want to change it, simply delete it
		var SelectArr = rowSelect.getSelection();
		windowTitle = 'Edit USM User';
		Ext.getCmp ('v3UserName').setValue(SelectArr[0].data.userName);
		Ext.getCmp ('v3UserName').disable();
		Ext.getCmp ('v3SecurityLevel').setValue (SelectArr[0].data.securityLevel);
		Ext.getCmp ('v3permission').setValue (SelectArr[0].data.permission);
		if (SelectArr[0].data.securityLevel == 'authNoPriv'){
			Ext.getCmp ('v3Privacy').disable();
		}
	}
	
	//Modal window for add, edit, delete
	var window = Ext.create( 'CP.WebUI4.ModalWin', {
		id: 'v3USMWindow',
		title: windowTitle,
		width: 410,
		height: 320,
		items: [ form ]
	});
	
	window.show();
},

// this function will remove a usm user entry from the table and DB
RemoveV3_USM_User: function(rowSelectl){
    var SelectArr = rowSelectl.getSelection();
    
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var myparams = pageObj.params;
   
    for (var i = 0; i < SelectArr.length; i++){
        myparams['snmp:v3:user:' + SelectArr[i].data.userName + ':deluser'] = 't';
    }
    myparams['userMarker'] = '';
    
    CP.UI.submitData( pageObj );
    CP.SNMP.aftertrapUserApply();
},

// this funtion will be initiated when pressing the apply button in the general settings section
// - it will post the inserted information and refresh the display of the section
applyGeneralSettingsHandler:function() {

	var agent = Ext.getCmp('agentStatus').getValue();
	var version = Ext.getCmp('snmp_ver').getValue();
	var location = Ext.getCmp('location').getValue();
	var contact = Ext.getCmp('contact').getValue();
	
	// if v1 / v2 / v3 (any) was chosen - change it to v1/v2/v3 which is the value in the DB
	if (version != 'v3-Only'){
		version = 'v1/v2/v3';
	}
  
	var myparams = {} ;
	// we will apply all of the fields in the section only if the the agent is on - otherwise only the agent status will be posted
	myparams['agentStatus'] = agent;
	if (agent){
		// validate the fields only the agent in turned on - otherwise we don't send additional information
		if (Ext.getCmp('location').validate() && Ext.getCmp('contact').validate()){
		    myparams['snmp_ver'] = version;
		    myparams['location'] = location;
		    myparams['contact'] = contact;
		    // sending the old community string to the tcl inorder to store it incase the agent is changing version from "v1 / v2 / v3 - any" to "v3-Only"
		    myparams['old_read_community'] = CP.SNMP.old_read_community;
		    myparams['old_write_community'] = CP.SNMP.old_write_community;
		} else{
			return;
		}
	}
	
	myparams['save'] = '1';

	Ext.Ajax.request({
	    url: '/cgi-bin/snmpd.tcl',
	    params: myparams,
	    method: 'POST',
	    success: function( response, options ){
			var jsonData = Ext.decode(response.responseText);
			CP.util.setStatusMsg( jsonData, options );
			CP.SNMP.afterGeneralSettingsApply();
	    }
	});
},

// this funtion will be initiated when pressing the apply button in the enabled traps section
// - it will post the inserted information and refresh the display of the section
applyTrapUserHandler:function() {

	var myparams = {} ;
	myparams['trapUser'] = Ext.getCmp('trapUser').getValue();
	myparams['pollingFrequency'] = Ext.getCmp('pollingFrequency').getValue();
	
	myparams['apply'] = '1';
	myparams['save'] = '1';

	Ext.Ajax.request ({
	    url: '/cgi-bin/snmpd.tcl',
	    params: myparams,
	    method: 'POST',
	    success: function() {
	        CP.SNMP. aftertrapUserApply ();
	    }
	});
},

eachChangeInAgentAdresses:function(ipToSet, ipToDel) {
        var myparams = {} ;
       	myparams['snmp:del_bind_if'] = ipToDel;
		myparams['snmp:bind_if'] = ipToSet;
        myparams['apply'] = '1';
        myparams['save'] = '1';
        Ext.Ajax.request ({
            url: '/cgi-bin/snmpd.tcl',
            params: myparams,
            method: 'POST'
        });


},


// this funtion will be initiated when pressing the apply button in the v1 / v2 settings section
// - it will post the inserted information and refresh the display of the section
applyV1_V2SettingsHandler:function() {

	var myparams = {} ;
	myparams = CP.SNMP.getChangedParamsCommunity();

	Ext.Ajax.request ({
	    url: '/cgi-bin/snmpd.tcl',
	    params: myparams,
	    method: 'POST',
	    success: function( response, options ){
			var jsonData = Ext.decode(response.responseText);
	        CP.SNMP.setCommunity();
	        CP.SNMP.afterV1_V2_SettingsApply();

			if (CP.SNMP.ProblemSendingCustomTraps())
			{
				jsonData.messages[0]+=". Note: Custom traps cannot be sent because neither community nor trap user are defined.";
			}

			CP.util.setStatusMsg( jsonData, options );
	    }
	});
},

// this function will be initiated after a successfull POST in the general settings section
// it will set the fields inside the section
afterGeneralSettingsApply:function(){

    Ext.Ajax.request({
        url: '/cgi-bin/snmpd.tcl?option=global',
        method: 'GET',
        success: function(response){
            var jsonData = Ext.decode(response.responseText);
            if (jsonData.data){
                if (jsonData.data.agentStatus){
                    Ext.getCmp('agentStatus').setValue (jsonData.data.agentStatus);
                    if (jsonData.data.agentStatus == 'on'){
                        CP.SNMP.disableEnableAll(false);
                    } else{
                        CP.SNMP.disableEnableAll(true);
                    }
                }
                if (jsonData.data.snmp_ver){
                    if (jsonData.data.snmp_ver == 'v1/v2/v3'){
                        CP.SNMP.ShowOrHideV1_V2_Section(true);
                    } else{
                        Ext.getCmp ('snmp_ver').setValue(jsonData.data.snmp_ver);
                        CP.SNMP.ShowOrHideV1_V2_Section(false);
                    }
                }
                if (jsonData.data.location){
                    Ext.getCmp('location').setValue(jsonData.data.location);
                }
                if (jsonData.data.contact){
                    Ext.getCmp('contact').setValue(jsonData.data.contact);
                }
                CP.SNMP.enableGeneralSettingsApply(false);
            }
        }
    });

	if (CP.SNMP.areAllOtherFieldsNotDirty("applyGeneralSettings") == true)
		CP.util.clearFormInstanceDirtyFlag( Ext.getCmp('snmp-panel').getForm() );
},

enableGeneralSettingsApply: function(isDirty){
	if (isDirty){
		Ext.getCmp ("applyGeneralSettings").enable ();
	} else{
		Ext.getCmp ("applyGeneralSettings").disable ();
	}
},

enable_V1_V2_SettingsApply: function(isDirty){
	if (isDirty){
		Ext.getCmp ("V1_V2_apply_button").enable ();
	} else{
		Ext.getCmp ("V1_V2_apply_button").disable ();
	}
},

enableTrapUserApply: function(isDirty){
	if (isDirty){
		Ext.getCmp ("trapUserApplyButton").enable ();
	} else{
		Ext.getCmp ("trapUserApplyButton").disable ();
	}
},

// this function will be initiated after a successfull POST in the v1 / v2 settings section
// it will set the field inside the section
afterV1_V2_SettingsApply:function(){

    Ext.Ajax.request({
        url: '/cgi-bin/snmpd.tcl?option=global',
        method: 'GET',
        success: function(response){
            var jsonData = Ext.decode(response.responseText);
            if (jsonData.data){
                if (jsonData.data.roCommunityString){
                    Ext.getCmp ('roCommunityString').setValue(jsonData.data.roCommunityString);
                }			
                if (jsonData.data.rwCommunityString){
                    Ext.getCmp ('rwCommunityString').setValue(jsonData.data.rwCommunityString);
                }			
            }
            CP.SNMP.enable_V1_V2_SettingsApply (false);
        }
    });

	if (CP.SNMP.areAllOtherFieldsNotDirty("V1_V2_apply_button") == true)
		CP.util.clearFormInstanceDirtyFlag( Ext.getCmp('snmp-panel').getForm() );
},

aftertrapUserApply:function(){

    Ext.Ajax.request({
        url: '/cgi-bin/snmpd.tcl?option=global',
        method: 'GET',
        success: function(response){
            var jsonData = Ext.decode(response.responseText);
            if (jsonData.data){
                // retrieving trap user
                if (jsonData.data.trapUser){
                    Ext.getCmp('trapUser').setValue(jsonData.data.trapUser);
                } else{
                    Ext.getCmp('trapUser').setValue('');
                }
                // retrieving polling frequency
                if (jsonData.data.pollingFrequency){
                    Ext.getCmp('pollingFrequency').setValue(jsonData.data.pollingFrequency);
                } else{
                    Ext.getCmp('pollingFrequency').setValue('');
                }
                CP.SNMP.saveEnabledTrapsSection();
            }
            CP.SNMP.enableTrapUserApply(false);
        }
    });

	if (CP.SNMP.areAllOtherFieldsNotDirty("trapUserApplyButton") == true)
 		CP.util.clearFormInstanceDirtyFlag( Ext.getCmp('snmp-panel').getForm() );
},

// hide or show V1_V2 section according to the agent's version in the DB
ShowOrHideV1_V2_Section: function(isVisible){
	if (isVisible){
		Ext.getCmp('v1V2Settings').expand(true);
		if (Ext.getCmp('agentStatus').getValue()){
			Ext.getCmp('roCommunityString').enable();
		}
	} else{
		Ext.getCmp ('v1V2Settings').collapse(true);
		Ext.getCmp ('roCommunityString').disable();
	}
},

// this function enables or disables all of the fields according to the input
disableEnableAll: function(isDisabled){
	if (isDisabled){
		Ext.getCmp('addrTable').getSelectionModel().setLocked(true);
		Ext.getCmp('snmp_ver').disable();
		Ext.getCmp('location').disable();
		Ext.getCmp('contact').disable();
		Ext.getCmp('roCommunityString').disable();
		Ext.getCmp('rwCommunityString').disable();
		Ext.getCmp('add_usm_user_trap').disable();
		Ext.getCmp('v3USMTable').getSelectionModel().deselectAll();
		Ext.getCmp('V1_V2_apply_button').disable();
		Ext.getCmp('applyGeneralSettings').disable();

		Ext.getCmp('trapReceiversTable').getSelectionModel().deselectAll();
		Ext.getCmp('add_new_trap_receiver').disable();
		Ext.getCmp('set_enabled_traps_button').disable();
		Ext.getCmp('trapUser').disable();
		Ext.getCmp('pollingFrequency').disable();
		Ext.getCmp('trapUserApplyButton').disable();
		
	} else{
		Ext.getCmp('addrTable').getSelectionModel().setLocked(false);
		Ext.getCmp('snmp_ver').enable();
		Ext.getCmp('location').enable();
		Ext.getCmp('contact').enable();
		Ext.getCmp('roCommunityString').enable();
		Ext.getCmp('rwCommunityString').enable();
		Ext.getCmp('add_usm_user_trap').enable();

		if (CP.SNMP.old_read_community != Ext.getCmp('roCommunityString').getValue() || 
			CP.SNMP.old_write_community != Ext.getCmp('rwCommunityString').getValue()){
			CP.SNMP.enable_V1_V2_SettingsApply (true);
		} else{
			CP.SNMP.enable_V1_V2_SettingsApply (false);
		}
		
		Ext.getCmp('add_new_trap_receiver').enable();
		Ext.getCmp('set_enabled_traps_button').enable();
		Ext.getCmp('trapUser').enable();
		Ext.getCmp('pollingFrequency').enable();
		if (CP.SNMP.trapUser != Ext.getCmp('trapUser').getValue() || CP.SNMP.pollingFrequency != Ext.getCmp('pollingFrequency').getValue()){
			Ext.getCmp ('trapUserApplyButton').enable();
		}
	}
},

// this function will disable the trap receiver community field when v3 is selected and will enable it when v1 or v2 are selected
enableDisableReceiverCommunity: function (){
	if (Ext.getCmp('receiverVersion').getValue() == 'v3'){
		Ext.getCmp('receiverCommunityString').clearInvalid();
		Ext.getCmp('receiverCommunityString').disable();
	} else{
		Ext.getCmp('receiverCommunityString').enable();
	}
},

// Collect the community list of bindings for db set_list
getChangedParamsCommunity: function(){
    var myparams = {};

    // Community Values
    var oldcomm = Ext.getCmp('roCommunityString').getValue();

    // Read Community String
    if (oldcomm == '') {
	myparams['snmp:community:' + CP.SNMP.old_read_community + ':disable'] = 't';
    } else if (oldcomm != '' && CP.SNMP.old_read_community != '') {
    	myparams['new_read_community'] = oldcomm;
    } else if (oldcomm != '' && CP.SNMP.old_read_community == '') {
    	myparams['brand_new_read_community'] = oldcomm;
    }
    
    myparams ['old_read_community'] = CP.SNMP.old_read_community;

    var oldrwcomm = Ext.getCmp('rwCommunityString').getValue();

    // Read-Write Community String
    if (oldrwcomm == '') {
	myparams['snmp:writecommunity:' + CP.SNMP.old_write_community + ':disable'] = 't';
    } else if (oldrwcomm != '' && CP.SNMP.old_write_community != '') {
    	myparams['new_write_community'] = oldrwcomm;
    } else if (oldrwcomm != '' && CP.SNMP.old_write_community == '') {
    	myparams['brand_new_write_community'] = oldrwcomm;
    }
    
    myparams ['old_write_community'] = CP.SNMP.old_write_community;

    myparams['save'] = '1';
    return myparams;
},

areAllOtherFieldsNotDirty: function(fieldEx)
{
	var list = new Array("applyGeneralSettings", "V1_V2_apply_button", "trapUserApplyButton");
	for ( i =0; i<list.length; i++)
	{
		if (list[i] == fieldEx)
			continue;
		if (Ext.getCmp(list[i]).isDisabled() == false)
			return false;
	}
	return true;
},

// this funtion will load the whole page whenever accessed (from a different page)
doLoad: function(formPanel) {
    // get the information for snmp traps and store it in global variables
    // (all of the available traps and the traps that are currently enabled)
    CP.SNMP.loadTablesData();
	CP.SNMP.loadCustomTrapsData();
    
    formPanel.load({
        url: '/cgi-bin/snmpd.tcl?option=global',
        method: 'GET',
        success: function(){
            if (Ext.getCmp('snmp_ver').getValue() == 'v1/v2/v3'){
                CP.SNMP.ShowOrHideV1_V2_Section(true);
            } else{
                CP.SNMP.ShowOrHideV1_V2_Section(false);
            }
            
            // if the agent is disabled or the checkbox is disabled (meaning we're in read only mode), all of the fields will be disabled
            var agentStatus = Ext.getCmp ('agentStatus');
            if (agentStatus.getValue() && !agentStatus.isDisabled()){
                CP.SNMP.disableEnableAll (false);
            } else{
                CP.SNMP.disableEnableAll (true);
            }
            
            CP.SNMP.setCommunity();
            CP.SNMP.saveEnabledTrapsSection();
            CP.SNMP.enableGeneralSettingsApply(false);
            CP.SNMP.enable_V1_V2_SettingsApply(false);
            CP.SNMP.enableTrapUserApply(false);
        }
    });
},

saveEnabledTrapsSection: function(){
	CP.SNMP.pollingFrequency = Ext.getCmp('pollingFrequency').getValue();
	CP.SNMP.trapUser = Ext.getCmp('trapUser').getValue();
},

setCommunity: function(){
	CP.SNMP.old_read_community = Ext.getCmp('roCommunityString').getValue();
	CP.SNMP.old_write_community = Ext.getCmp('rwCommunityString').getValue();
},

loadCustomTrapsData : function () {
    Ext.Ajax.request({
        url: '/cgi-bin/snmp_monitor.tcl',
        method: 'GET',
        success: function(response){
			var snmp_monitor_data = Ext.decode(response.responseText).data;
            var CustomTrapsGrid = Ext.getCmp('CustomTrapsTable');
            CustomTrapsGrid.getStore().loadData(snmp_monitor_data.custom_traps_list);
            CustomTrapsGrid.doComponentLayout();
			Ext.getCmp("clear_trap_retries").setValue(snmp_monitor_data.ClearTrapRetries);
			Ext.getCmp("clear_trap_interval").setValue(snmp_monitor_data.ClearTrapInterval);
        }       
    });	
},

loadTablesData: function() {
    Ext.Ajax.request({
        url: '/cgi-bin/snmpd.tcl',
        method: 'GET',
        success: function(response){
            CP.SNMP.tablesData = Ext.decode(response.responseText).data;
            
            var receiversGrid = Ext.getCmp('trapReceiversTable');
            receiversGrid.getStore().loadData(CP.SNMP.tablesData.trapReceivers);
            receiversGrid.doComponentLayout();
            
            var usersGrid = Ext.getCmp('v3USMTable');
            usersGrid.getStore().loadData(CP.SNMP.tablesData.users);

            var addressTable = Ext.getCmp('addrTable');
			var lock_status = addressTable.getSelectionModel().isLocked();
			addressTable.getSelectionModel().setLocked(false);
            addressTable.getStore().loadData(CP.SNMP.tablesData.agents);
			addressTable.getSelectionModel().setLocked(lock_status);
			
            usersGrid.doComponentLayout();
            Ext.getCmp('trapUser').setValue(CP.SNMP.trapUser);
            
            var trapsGrid = Ext.getCmp('enabledTrapsTable');
            trapsGrid.getStore().loadData(CP.SNMP.tablesData.enabledTraps);
            trapsGrid.doComponentLayout();
        }       
    });
}
}