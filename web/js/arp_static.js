
CP.ArpStatic = {
        
        EXT4_PANEL_ID: 'arp_static_ext4_panel',
        TCL_REQUEST: '/cgi-bin/arp_static.tcl',
        GRID_ID: 'arp_static_main_grid',
        RM_BTN_ID: 'arp_static_remove_btn',
        FORM_TYPE_ADD: 'form-add',
        FORM_TYPE_RM: 'form-remove',
		AVAILABLE_INTFS: '',
		APPLYBUTTONS: ['applyBtn', 'applyBtn2'],		// IDs of apply buttons on this page
		ARP_PREFIX: 'ip:arp:',
    
    //build the page
    init : function() {
        
	var arpPanel = Ext.create( 'CP.WebUI4.DataFormPanel', {
                    id : CP.ArpStatic.EXT4_PANEL_ID, //id is mandatory
                    trackResetOnLoad: true,
                    items : CP.ArpStatic.getPageItems(),
                    listeners: {
                        render: function( panel ){
                            CP.ArpStatic.doLoad();
                            CP.ArpStatic.afterTableSettingsApply();
                            CP.ArpStatic.afterGeneralSettingsApply();
                        }
                    }
                });
	
        //1. create the page object
        var page = {
                title : 'ARP',
                related : [{
                    page: 'tree/arp_static',
                    tab: CP.global.monitor,
                    displayName: 'Dynamic ARP'
                }],
				cluster_feature_name : "arp",
                params : {},
                submitURL : CP.ArpStatic.TCL_REQUEST,
                afterSubmit : CP.ArpStatic.doLoad,
                //2. configure the properties for the panel and add it into the page object
                panel : arpPanel
        };
        
		CP.ArpStatic.addProxyArpSection (arpPanel);
        //3. display the page
        CP.UI.updateDataPanel(page);
    },
    
	afterTableSettingsApply: function(){
		Ext.Ajax.request({
			url:'/cgi-bin/arp.tcl',
			method: 'GET',
			success: function ( response ){
				var jsonData = Ext.decode(response.responseText);
				var form = Ext.getCmp(CP.ArpStatic.EXT4_PANEL_ID).getForm();
				if(jsonData && jsonData.data){
					var cache_size = jsonData.data.cache_size;
					var validity_timeout = jsonData.data.validity_timeout;
					//Ext.getCmp('cache_size').setValue(cache_size);
					//Ext.getCmp('validity_timeout').setValue(validity_timeout);
					form.setValues([{ id: 'cache_size', value: cache_size},
									{ id: 'validity_timeout', value: validity_timeout}]);
				}
				Ext.getCmp('applyBtn').disable();
				if(!CP.ArpStatic.isOtherBtnsEnabaled('applyBtn')) {
						CP.util.clearFormInstanceDirtyFlag(form);
					}
				}
		});
	},
	
	afterGeneralSettingsApply: function(){
		Ext.Ajax.request({
			url:'/cgi-bin/arp.tcl',
			method: 'GET',
			success: function ( response ){
				var jsonData = Ext.decode(response.responseText);
				var form = Ext.getCmp(CP.ArpStatic.EXT4_PANEL_ID).getForm();
				if(jsonData && jsonData.data){
					var announce = jsonData.data.announce;
					//Ext.getCmp('announce').setValue(announce);
					/* using setValues for updating originalValue */
					form.setValues([{ id: 'announce', value: announce}]);
				}
				Ext.getCmp('applyBtn2').disable();
				if(!CP.ArpStatic.isOtherBtnsEnabaled('applyBtn2')) {
						CP.util.clearFormInstanceDirtyFlag(form);
					}
				}
		});
	},
	
    //get main structure of page items
    getPageItems: function(){
        
        //load grid store with roles data
        var arpStaticStore = Ext.create( 'CP.WebUI4.Store', {
            fields: [ 'ipaddr', 'mac', 'depends' ],
            data: {data:{}},
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.arps',
                    successProperty: 'success'
                }
            }
        });
        
        //arp static title
        var arpStaticTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'Static ARP Entries'
        };
        
        //buttons bar above table
        var buttonsBar = {
            xtype: 'cp4_btnsbar',
            items: [{
                text: 'Add',
                handler: CP.ArpStatic.addArpEntry
            },{
                text: 'Remove',
                id: CP.ArpStatic.RM_BTN_ID,
                disabled: true,
                handler: CP.ArpStatic.removeArpEntries
            }]
        };
        
        //grid columns
        var columns = [{  
            header: 'IP Address', 
            dataIndex: 'ipaddr',
            flex: 1
        },{ 
            header: 'MAC Address', 
            dataIndex: 'mac',
            flex: 1
        }];
        
        //create main table that shows all ARP static entries
        var arpStaticTable = {        
            xtype: 'cp4_grid',
            id: CP.ArpStatic.GRID_ID,
            width: 550,
            maxHeight: 120,
            multiSelect: true,
            autoScroll: true,
            store: arpStaticStore,
            columns: columns,
            listeners: {
                selectionchange: function( gridView, selections ){
                    if( selections.length == 0 ){
                        Ext.getCmp(CP.ArpStatic.RM_BTN_ID).disable();
                    } else{
                        Ext.getCmp(CP.ArpStatic.RM_BTN_ID).enable();
                    }
                },
                beforeselect: function ( gridView, selected, selections){
                    if (selected.data.depends == 'Static'){
                        return true; 
                    } else{ 
                        return false; 
                    }
                }
            }
        };
        
        //arp table title
        var arpTableTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'ARP Table Settings'
        };
        
        var cacheSize = Ext.create( 'CP.WebUI4.PositiveInt', {
			id: 'cache_size',
            name: 'cache_size',
            fieldLabel:'Maximum Entries',
            width: 190,
            allowBlank: false,
            minValue: 1024,
            maxValue: 16384,
            invalidText: 'Invalid ARP table size',
            listeners: {
		//we want to anable the apply btn on every key change of the field
                change: function ( field, newVal, oldVal) {
			if (CP.global.token != -1){ // if we have the lock
				Ext.getCmp('applyBtn').enable();
                    }
                }
            }
        });
        
        var validityTOForm = Ext.create( 'CP.WebUI4.FieldContainer', {
            width: 300,
			msgTarget: 'none',
            items: [{
            	id: 'validity_timeout',
                xtype: 'cp4_positiveint',
                name:'validity_timeout',
                fieldLabel:'Validity Timeout',
                width: 190,
                allowBlank: false,
                minValue: 60,
                maxValue: 86400,
                invalidText:'Invalid ARP validity timeout',
                listeners: {
			//we want to anable the apply btn on every key change of the field
                    change: function ( field, newVal, oldVal) {
				if (CP.global.token != -1){ // if we have the lock
					Ext.getCmp('applyBtn').enable();
                        }
                    }
                }
            },{
                xtype: 'cp4_label',
                text: 'seconds',
                margin: '2 0 0 3',
                flex: 1
            }]
        });
        
        var applyBtn = Ext.create( 'CP.WebUI4.Button', {
			id: 'applyBtn',
            text: 'Apply',
            disabled: true,
            handler: function(){
                var myparams = {};
                var cache_size = Ext.getCmp("cache_size");
                var validity_timeout = Ext.getCmp("validity_timeout");
                myparams[CP.ArpStatic.ARP_PREFIX + 'cache_size'] = cache_size.getValue();
                myparams[CP.ArpStatic.ARP_PREFIX + 'validity_timeout'] = validity_timeout.getValue();
                myparams['save'] = 1;
                myparams['apply'] = 1;
                Ext.Ajax.request({
			url: '/cgi-bin/arp_static.tcl',
			params: myparams,
			method: 'POST',
			success: function( response, options ){
				var jsonData = Ext.decode(response.responseText);
				CP.ArpStatic.afterTableSettingsApply();
                    }
                });
            }
                });

        //arp settings title
        var arpSettingsTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'ARP General Settings'
        };	

		var announce = Ext.create( 'CP.WebUI4.ComboBox', {
			id: 'announce',
        	name: 'announce',
        	fieldLabel: 'Announce Restriction Level',
        	labelWidth: 250,
        	store: [['0', '0'], ['1', '1'], ['2', '2']],
        	forceSelection: true,
        	editable: false,
        	listeners: {
        	    select: function (field){
					if(field.originalValue != field.value) {
						applyBtn2.enable();
					}
        	    }
        	}
		});

        var applyBtn2 = Ext.create( 'CP.WebUI4.Button', {
			id: 'applyBtn2',
            text: 'Apply',
            disabled: true,
            handler: function(){
				var myparams = {};
				var announceLevel = Ext.getCmp("announce");			
				myparams[CP.ArpStatic.ARP_PREFIX + 'announce'] = announceLevel.getValue();
				myparams['save'] = 1;
				myparams['apply'] = 1;
				Ext.Ajax.request({
					url: '/cgi-bin/arp_static.tcl',
					params: myparams,
					method: 'POST',
					success: function( response, options ){
						var jsonData = Ext.decode(response.responseText);
						CP.ArpStatic.afterGeneralSettingsApply();
				}
				});
            }
        });
        
        //return all objects as one array 
        return [
            arpStaticTitle,
            buttonsBar,
            arpStaticTable,
            arpTableTitle,
            cacheSize,
            validityTOForm,
            applyBtn,
            arpSettingsTitle,
            announce,
            applyBtn2
        ];
    },
    
	isOtherBtnsEnabaled: function(currBtn) {

		var btnsList = CP.ArpStatic.APPLYBUTTONS;

		for (var i = 0; i < btnsList.length; i++){
			if(btnsList[i] != currBtn) {
				if(Ext.getCmp(btnsList[i]).disabled == false) {
					return true;
				}
			}
        }
		return false;
    },
	/* Allow multi-cast addresses */
	validateMacAddress: function (val){
		var macRule = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i;
		if (!macRule.test( val )) {
			if (val.match(/[^a-fA-F0-9:]/) != null) {
				return "Must consist of only hexadecimal digits and ':'";
			}
			if (val.match(/^([^:]*:){5}[^:]*$/) == null){
				return "Must be six octets delimited by ':'";
			}
			if (val.match(/(^|:)([^:]{0,1}|[^:]{3,})(:|$)/) != null){
				return "Each octet must be two hexadecimal digits";
			}
			return "Invalid MAC Address";
		}
		return true;
	},
	
    //opens a modal window to add an entry
    addArpEntry: function(){
        
        var ipv4Address = Ext.create( 'CP.WebUI4.IPv4Field',{
            id: 'ip_addr'
        });
        
        var macAddress = Ext.create( 'CP.WebUI4.TextField',{
            id: 'mac_addr',
            fieldLabel: 'MAC Address',
            width: 300,
            allowBlank: false,
            emptyText: 'Example: 00:12:C1:1A:2B:3C',
            validator: CP.ArpStatic.validateMacAddress
        });
        
        var form = Ext.create( 'CP.WebUI4.FormPanel',{
            bodyPadding: 20,
            items: [ipv4Address, macAddress],
            buttons: [{
                xtype: 'cp4_button',
                text: 'OK',
                handler: function(){
                    //run validations
                    if( !form.getForm().isValid() ){
                        return;
                    }
                    CP.ArpStatic.saveHandler(CP.ArpStatic.FORM_TYPE_ADD);
                }
            },{
                xtype: 'cp4_button',
                text: 'Cancel',
                handler: function(){
                    modalWin.close();
                }
            }]
        });
        
        // make window and open it
        var modalWin = Ext.create( 'CP.WebUI4.ModalWin', {
        	id: 'arp_static_modal_win',
            title: 'Add Static ARP Entry',
            width: 350,
            height: 150,
            items: [ form ]
        });
        modalWin.show();
    },
    
    //removes selected entries
    removeArpEntries: function(){
        
        //display msg
        CP.WebUI4.Msg.show({
             title: 'Deleting Static ARP Entries',
             msg: 'Are you sure you want to delete ARP entries?',
             buttons: Ext.Msg.OKCANCEL,
             icon: Ext.Msg.QUESTION,
             fn: function( btn, text ){
                if( btn == 'cancel' ){
                    return;
                }
                CP.ArpStatic.saveHandler(CP.ArpStatic.FORM_TYPE_RM);
             }
         });
    },
    
    saveHandler: function( formType ){
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
        var params = pageObj.params;
        
        var sprefix = 'ip:arp:entry:static:instance:0:';
        switch (formType){
        
        case CP.ArpStatic.FORM_TYPE_RM:
            //get selected entries
            var selectedEntries = Ext.getCmp( CP.ArpStatic.GRID_ID ).getSelectionModel().getSelection();
            for (var i = 0; i < selectedEntries.length; i++){
                params[sprefix + selectedEntries[i].data.ipaddr] = '';
            }
            break;
            
        case CP.ArpStatic.FORM_TYPE_ADD:
            var ipAddr = Ext.getCmp('ip_addr').getValue();
            var macAddr = Ext.getCmp('mac_addr').getValue();
            params[sprefix + ipAddr ] = 't';
            params[sprefix + ipAddr + ':macaddr' ] = macAddr;
        }
        
        //submit form
        CP.UI.submitData( pageObj );
    },
    
    //load data and refresh page (on page load or after submit)
    doLoad: function(){
        Ext.Ajax.request({
            url: CP.ArpStatic.TCL_REQUEST,
            method: 'GET',
            success: function( jsonResult ) {			
                var arpStaticData = Ext.decode( jsonResult.responseText );    
                //refresh grid data
                var grid = Ext.getCmp( CP.ArpStatic.GRID_ID );
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read( arpStaticData );
                store.loadData( data.records );
                grid.doComponentLayout();
                
                var arpProxyGrid = Ext.getCmp('arpProxyTable');
                var arpProxyStore = arpProxyGrid.getStore();
                arpProxyStore.loadData(arpStaticData.data.proxyArpEntries);
				
				AVAILABLE_INTFS = arpStaticData.data.availInterfaces;
				
                //disable button
                Ext.getCmp( CP.ArpStatic.RM_BTN_ID ).disable();
		//disable the apply btn before any key change of the field
		Ext.getCmp('applyBtn').disable();
            }
        });
        //close modal if open
        var modalWin = Ext.getCmp( 'arp_static_modal_win' );
        if( modalWin )
        	modalWin.close();
    },
    
    // this function will add the arp proxy table
	addProxyArpSection : function (obj){
    
		var proxyArpTitle = Ext.create( 'CP.WebUI4.SectionTitle', {
		titleText: 'Proxy ARP'
		});
	
		obj.add(proxyArpTitle);
		CP.ArpStatic.addArpProxyTable(obj);
		 //add inline message
		obj.add({
			xtype: 'cp4_inlinemsg',
			text: 'Changes to Proxy ARP list will take effect on policy install.'
		});
     },
     // this function will add the arp proxy table
	addArpProxyTable: function(obj){
		
	    //grid columns
	    var columns = [{
		header: 'IP Address',
		dataIndex: 'proxyIPAddr',
		flex: 1
	    },{
		header: 'MAC Address / Interface',
		dataIndex: 'proxyMACAddrOrIntfName',
		flex: 1
	    },{
		header: 'Real IP Address',
		dataIndex: 'proxyRealIPAddr',
		flex: 1
	    }];
	    
		// the table
		var arpProxy = Ext.create( 'CP.WebUI4.GridPanel', {
		    id: 'arpProxyTable',
		    maxHeight: 120,
		    width: 550,
		    multiSelect: true,
		    store: {
			xtype: 'cp4_store',
			fields: [ 'proxyIPAddr', 'proxyMAC', 'proxyRealIPAddr' ],
			data: {},
			proxy: 'memory'
		    },
		    
		    columns: columns,
		    listeners: {
			selectionchange: function( gridView, selections ){
			    switch(selections.length){
			    case 0:
				//nothing is chosen, disable remove button
				Ext.getCmp('arpProxyRemoveButton').disable();
				return;
			    default:
				// one or more entries chosen
				Ext.getCmp('arpProxyRemoveButton').enable(); 
			    }
			}
		    }
		    
		});
		
		//Add buttons to panel
		var buttonsBar = {
			xtype: 'cp4_btnsbar',
			items: [{
			    id: 'addNewProxyArpButton',
			    text: 'Add',
			    handler: function(){
				CP.ArpStatic.proxyArpWindow(false);
				}
			},{
			    id: 'arpProxyRemoveButton',
			    text: 'Remove',
			    disabled: true,
			    handler: function(){
				function func(){
				    CP.ArpStatic.RemoveArpProxyEntry(rowSelect);
				}
				var rowSelect = arpProxy.getSelectionModel();
				var SelectArr = rowSelect.getSelection();
				if (SelectArr.length == 1){
				    var proxyArpAddress = SelectArr[0].data.proxyIPAddr;
				    CP.ArpStatic.showAlertBeforeDeleting('Deleting Proxy Arp Entry', 'Are you sure you want to delete \"' + proxyArpAddress  + '\" entry?', func, rowSelect);
				} else{
				    CP.ArpStatic.showAlertBeforeDeleting('Deleting Proxy Arp Entries', 'Are you sure you want to delete ' + SelectArr.length + ' entries?', func, rowSelect);
				}
			    }
			}]
		};

		// buttons
		obj.add(buttonsBar);
		//Add grid
		obj.add(arpProxy);
	},
	
	// this function will create the proxy arp window (when pressing add)
	proxyArpWindow : function (isEdit, rowSelect)
	{
		var form = Ext.create( 'CP.WebUI4.FormPanel', {
		id: 'proxyArpWindowForm',
		bodyStyle: 'padding:10px;',
		height: 550,
		width: 450, 
		items: [{
			xtype: 'cp4_ipv4field',
			id:'proxyIPAddress',
			name: 'proxyIPAddress',
			fieldConfig: { allowBlank: false },
			validator: function(value) {
				if (value.length == 0) {
					return 'An IPv4 address must be entered';
				}
				return true;
			}
		},
		// radio button - choose between MAC and interfacename inputs.
		{	
			xtype: "cp4_sectiontitle", 
			titleText: "Advertise IP via" 
		},
		{
			xtype: 'cp4_panel',
			items: [
			{
				xtype: 'cp4_panel',
				items: [{
					xtype: 'cp4_panel',
					layout: 'table',
					items:[{
							xtype:"cp4_radio",
							name:"proxyArpMACAddrOrInterfaceName",
							id: "proxyArpInterfaceNameField",
							boxLabel: "Interface Name",
							checked: true,
							width:95,
							listeners: {
								change: 
									function( field, isChecked ) {
										if (isChecked) {
											// Radio button for Inteface Name is checked - enable the Interface Name field.
											Ext.getCmp("proxyArpInterfaceNameValue").setDisabled(false);
											
											// Radio button for Inteface Name is checked - disable the MAC Address field.
											Ext.getCmp("proxyArpMacAddressValue").setDisabled(true);
											Ext.getCmp("proxyArpMacAddressValue").clearInvalid();
										}
										else {
											// Radio button for MAC Address is checked - enable the MAC Address field.
											Ext.getCmp("proxyArpMacAddressValue").setDisabled(false);
											
											// Radio button for MAC Address is checked - disable the Interface Name field.
											Ext.getCmp("proxyArpInterfaceNameValue").setDisabled(true);
											Ext.getCmp("proxyArpInterfaceNameValue").clearInvalid();
										}
									}
								}
							},
							{
								xtype: 'cp4_combobox',
								id:'proxyArpInterfaceNameValue',
								width: 150,
								minwidth : 120,
								style: 'margin-left:16px;',
								disabled: false,
								emptyText: 'Select...',
								triggerAction: 'all',
								forceSelection: true,
								editable: false,
								validationEvent: false,
								store: CP.ArpStatic.organizeArray(AVAILABLE_INTFS),
								validator: function(value) {
									if (Ext.getCmp("proxyArpInterfaceNameField").checked) {
										if (value.length == 0) {
											return 'An interface must be chosen.';
										}
									}		
									return true;
								}
							}]
						},
						{
							xtype: 'cp4_panel',
							layout: 'table',
							items:
								[{
									xtype:"cp4_radio",
									name:"proxyArpMACAddrOrInterfaceName",
									id: "proxyArpMacAddressField",
									boxLabel: "MAC Address"
								},
								{
									xtype: 'cp4_textfield',
									name: 'proxyArpMacAddressValue',
									id:'proxyArpMacAddressValue',
									width: 150,
									minwidth : 120,
									style: 'margin-left:20px;',
									vtype: 'mac',
									emptyText: 'Example: 00:12:C1:1A:2B:3C',
									disabled: true,
									validator: function(value) {
										if (Ext.getCmp("proxyArpMacAddressField").checked) {
											if (value.length == 0) {
												return 'A MAC Address must be entered.';
											}
										}
										return true;
									}
								}]
						}]
				}]
            },
			{	
				xtype: "cp4_sectiontitle", 
				titleText: "Cluster related configuration" 
			},
			{
				xtype: 'cp4_panel',
				layout: 'column',
				items: [{
						xtype: 'cp4_ipv4field',
						id:'proxyArpRealIPAddress',
						name: 'proxyArpRealIPAddress',
						fieldLabel: 'Real IP Address',
						fieldConfig: { allowBlank: true }
					},
					{
						xtype: 'cp4_inlinemsg',
						width: 300,
						text: 'Specify the Real IP of the advertising interface.'
					}]
			}],  
			//Save and cancel buttons
			buttons: [{
			    xtype: 'cp4_button',
			    text: 'Save',
			    handler: function(button, event)
			    {			
					var ipAddress = Ext.getCmp('proxyIPAddress');
					// validate ipAddress isn't empty
					if (!ipAddress.validate())
					{
						button.setVisible(true);
						return;
					}
					
					var interfaceName = Ext.getCmp('proxyArpInterfaceNameValue');
					var macAddress = Ext.getCmp('proxyArpMacAddressValue');
					
					var interfaceNameRadioBtn = Ext.getCmp('proxyArpInterfaceNameField');
					var macAddrRadioBtn = Ext.getCmp('proxyArpMacAddressField');
					
					// use the selected given value - whether MAC Address or Interface Name.
					if (interfaceNameRadioBtn && interfaceNameRadioBtn.checked)
					{
						if (!interfaceName.validate()) 
						{
							button.setVisible(true);
							return;
						}
						var valueToUse = interfaceName.getValue();
					}
					else if (macAddrRadioBtn && macAddrRadioBtn.checked)
					{
						if (!macAddress.validate()) 
						{
							button.setVisible(true);
							return;
						}
						var valueToUse = macAddress.getValue();
					}
					else 
					{
						// shouldn't happen - interface name radio button is checked by default.
						var valueToUse = '';
					}
					
					var realIPAddress = Ext.getCmp('proxyArpRealIPAddress');
					
					if (form.getForm().isValid()) {
						CP.ArpStatic.AddArpProxyEntry (ipAddress.getValue(), valueToUse, realIPAddress.getValue());
						Ext.getCmp('proxyArpWindowID').close();
					}
					
					return;
			    }
			},{
			    xtype: 'cp4_button',
				text: 'Cancel',
				handler: function(){
					Ext.getCmp('proxyArpWindowID').close();
				}
			}]
		});
		
		var windowTitle = 'Add New Proxy ARP Entry';

		//Modal window for add and delete
		var window = Ext.create( 'CP.WebUI4.ModalWin', {
			id: 'proxyArpWindowID',
			title: windowTitle,
			width: 410,
			height: 330,
			items: [ form ]
		});
		window.show();
	},
	
	organizeArray : function (array) {
		var newArray = [];
		for (var i = 0; i < array.length; i++){
			newArray.push([array[i],array[i]]);
		}
		return newArray;
	},
	
	// the function which stores the arp proxy information to the DB (makes POST)
	AddArpProxyEntry: function(ipAddress, macAddressOrIntfName, realIPAddress) 
	{ 
		var pageObj = CP.UI.getMyObj();
		pageObj.params = {}; //clear out old form params
		var myparams = pageObj.params;
	    
		myparams['arpProxyAddress'] = ipAddress;
		var tempMacOrIntfName = String (macAddressOrIntfName);
		if (tempMacOrIntfName.indexOf(":") !== -1)
		{
			myparams['arpProxyMacAddress'] = tempMacOrIntfName.toLowerCase();
		}
		else
		{
			myparams['arpProxyIntfName'] = tempMacOrIntfName;
		}

		myparams['arpProxyRealIPAddress'] = realIPAddress;
		
		CP.UI.submitData( pageObj );
	},
	// this function will remove a proxyArp entry from the table and DB
	RemoveArpProxyEntry: function(rowSelectl) 
	{
		var SelectArr = rowSelectl.getSelection();
		var pageObj = CP.UI.getMyObj();
		pageObj.params = {}; //clear out old form params
		var myparams = pageObj.params;
	
		for (var i = 0; i < SelectArr.length; i++){
			myparams['deleteProxyArpAddress_' + i]  = SelectArr[i].data.proxyIPAddr;
		}	
	    
		CP.UI.submitData( pageObj );
	},
	
	showAlertBeforeDeleting: function(myTitle, myMsg, startFunc, rowSelect) 
	{

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
	} // showAlertBeforeDeleting
}
