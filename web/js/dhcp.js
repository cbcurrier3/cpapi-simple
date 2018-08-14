CP.DHCP = {
        //page globals
        EXT4_PANEL_ID: 'dhcp_ext4_panel',
        ENABLE_DHCP_APPLY_BTN_ID: 'enable_dhcp_apply_btn',
        GRID_ID: 'interface_table',
        GRID_POOL_ID: 'pools_table',
        EDIT_BTN_ID: 'dhcp_edit_interface',
        DEL_BTN_ID: 'dhcp_delete_interface',
        PSTATE_CB_ID: 'pstate',
        SELECTED_SUBNET: '',
        MODAL_WIN_ID: 'dhcp_modal_win',
        DHCP_TCL_REQUEST: '/cgi-bin/dhcp_main.tcl',
        FORM_TYPE_ADD: 'form-add',
        FORM_TYPE_EDIT: 'form-edit',
        MODAL_WIN_WIDTH: 600,
        MODAL_WIN_HEIGHT: 600,
		DEFLEASE: 43200,
		MAXLEASE: 86400,
        isLoaded: false,
				
		init: function(){ 
			//1. create the page object
			var page = {
				title: 'DHCP Server Configuration',
				params : {},
				submitURL : CP.DHCP.DHCP_TCL_REQUEST,
				afterSubmit : CP.DHCP.doLoad,
				submitFailure : CP.DHCP.submitFailure,
				//2. configure the properties for the panel and add it into the page object
				panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
					id: CP.DHCP.EXT4_PANEL_ID, //id is mandatory
					items: CP.DHCP.getPageItems(),
					listeners: {
						render: CP.DHCP.doLoad
					}
				})
			};
			//display the page
			CP.UI.updateDataPanel( page );
			
			CP.DHCP.isLoaded = true;
		},

		getPageItems: function() {

			var subnetsStore = Ext.create( 'CP.WebUI4.Store', {
				fields: [
					{name: 'netmask', type: 'string'},
					{name: 'subnet', type: 'string'},
					{name: 'state',  type: 'string',convert: function(v,rec){return (v === 'true')?'On':'Off';}}
				],
				data: {data:{}},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json',
						root: 'data.subnets',
						successProperty: 'success'
					}
				}
			});
		   
			//grid columns
			var columns =[{
				id: 'state',
				dataIndex: 'state',
				text: 'State'
			},{
				id: 'subnet',
				dataIndex: 'subnet',
				text: 'Subnet'

			},{
				id: 'netmask',
				dataIndex: 'netmask',
				text: 'Net Mask',
				flex: 1
			}];

			//add all into the items array
			var items = [{
				//Section title for table
				xtype: 'cp4_sectiontitle',
				titleText: 'DHCP Server Configuration'
			},{    
				//checkbox - enable/disable
				xtype: 'cp4_checkbox',
				width:300,
				boxLabel:'Enable DHCP Server',                   
				name: CP.DHCP.PSTATE_CB_ID,
				id: CP.DHCP.PSTATE_CB_ID,
				handler: function( checkbox, isChecked ) {
					var applyBtn = Ext.getCmp( CP.DHCP.ENABLE_DHCP_APPLY_BTN_ID );
					if( checkbox.originalValue != checkbox.getValue() ){
						applyBtn.enable();
					}
					else{
						applyBtn.disable();
					}
				} 
			},{
				//apply button
				xtype: 'cp4_button',
				margin: '14 0 0 0',
				id: CP.DHCP.ENABLE_DHCP_APPLY_BTN_ID,
				disabled: true,
				text: 'Apply',
				handler: CP.DHCP.changeServerMode
			},{
				//table section title
				xtype: 'cp4_sectiontitle',
				titleText: 'DHCP Server Subnet Configuration'
			},{
				//buttons bar
				xtype: 'cp4_btnsbar',
				items: [{
					id: 'dhcp-add-interface',
					text: 'Add',
					handler: CP.DHCP.openModalWindowAdd
				},{
					id: CP.DHCP.EDIT_BTN_ID,
					text: 'Edit',
					disabled: true,
					handler: CP.DHCP.openModalWindowEdit
				},{
					id: CP.DHCP.DEL_BTN_ID,
					text: 'Delete',
					disabled: true,
					handler: CP.DHCP.openModalWindowDelete
				}]
			},{        
				//grid
				xtype: 'cp4_grid',
				id: CP.DHCP.GRID_ID,
				width: 500,
				height: 200,
				autoScroll: true,
				store: subnetsStore,
				columns: columns,
				listeners: {
					//open edit dialog on row double click
					itemdblclick: function( grid, rowIndex, event ){
						 CP.DHCP.openModalWindowEdit();
					},
					selectionchange: function( gridView, selections ){
						//enable edit and delete buttons when selecting a row
						if (selections.length != 0) {
							Ext.getCmp( CP.DHCP.EDIT_BTN_ID ).enable();
							Ext.getCmp( CP.DHCP.DEL_BTN_ID ).enable();
						}
					}
				}
			},{
				//inline info message
				xtype: 'cp4_inlinemsg',
				text: 'In order to forward DHCP messages from another server, use the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/bootp\');return false;">DHCP Relay</a> page.'
			}];
			
			return items;
		},

		// Load DHCP Server Configuration form settings
		doLoad: function( formPanel ) {

			Ext.Ajax.request({
					url: CP.DHCP.DHCP_TCL_REQUEST,
					method: 'GET',
					success: function( jsonResult ){
						CP.DHCP.StaticData = Ext.decode( jsonResult.responseText ); 
						//var dhcpdStaticData = Ext.decode( jsonResult.responseText );    
						//refresh grid data
						var grid = Ext.getCmp( CP.DHCP.GRID_ID );
						var store = grid.getStore();
						var reader = store.getProxy().getReader();
						var data = reader.read( CP.DHCP.StaticData );
						store.loadData( data.records );
						grid.doComponentLayout();
						
						// update dhcpd process' CheckBox
						Ext.getCmp( CP.DHCP.PSTATE_CB_ID ).setValue(CP.DHCP.StaticData.data.pstate);
						var checkbox = Ext.getCmp( CP.DHCP.PSTATE_CB_ID );
						checkbox.originalValue = checkbox.getValue(); //reset original value of checkbox for dirty flag
						
						//disable apply button
						Ext.getCmp( CP.DHCP.ENABLE_DHCP_APPLY_BTN_ID ).disable(); 
						
						var modalWindow=Ext.getCmp(CP.DHCP.MODAL_WIN_ID);
						if (modalWindow) modalWindow.close();
					}
			});	
		}
		
		//change dhcp server state
		,changeServerMode: function(){
				var pageObj = CP.UI.getMyObj();
				pageObj.params = {}; //clear out old form params
				var params = pageObj.params;
				var pstateCB = Ext.getCmp( CP.DHCP.PSTATE_CB_ID );
				var pstateVal = pstateCB.getValue();
				var pstate = ( pstateVal == true ) ? 't' : '';
				
				//:dhcp:process:check t
				params["process:dhcpd"] = pstate;
				if( pstate == "t" ){
					params[":dhcp:process:check"] = "t";
				}
				Ext.getCmp( CP.DHCP.ENABLE_DHCP_APPLY_BTN_ID ).disable();
				//submit form
				CP.UI.submitData( pageObj );
		}

		/*
		 * Creates the modal window
		 * Called by handlers of add/edit 
		 */
		,getModalWindow: function( winTitle, formType ){

			var default_lease_panel = Ext.create('CP.WebUI4.Panel', {  
				width: 300,
				layout:'column',
				items: [{
								xtype     : 'cp4_positiveint',
								fieldLabel: 'Default lease',
								id: 'deflease',
								allowBlank: false ,
								defaultValue: CP.DHCP.DEFLEASE,
								emptyText: CP.DHCP.DEFLEASE, 
								name: 'deflease',
								labelWidth: 95,
								minValue: 0,
								maxValue: 4294967295,
								width: 200
						},
						{
								xtype: 'cp4_label',
								text: 'seconds',
								margin: '2 0 0 10',
								flex: 1
						}]
			});
			var max_lease_panel = Ext.create('CP.WebUI4.Panel', {  
				width: 300,
				layout:'column',
				items: [{
								xtype     : 'cp4_positiveint',
								fieldLabel: 'Maximum lease',
								id: 'maxlease',
								allowBlank: false ,
								defaultValue: CP.DHCP.MAXLEASE,
								emptyText: CP.DHCP.MAXLEASE,	
								name: 'maxlease',
								labelWidth: 95,
								minValue: 0,
								maxValue: 4294967295,
								width: 200
						},
						{
								xtype: 'cp4_label',
								text: 'seconds',
								margin: '2 0 0 10',
								flex: 1
						}]
			});
			
			var subnet_panel = Ext.create('CP.WebUI4.Panel', {  
				width: 500,
				layout:'column',
				items: [{
								xtype: 'cp4_ipv4notation',
								margin: '8 0 0 0',
								ipId: 'v4Addr',
								ipName: 'v4Addr',
								notationId: 'v4Mask',
								notationName: 'v4Mask',
								ipLabel:'Network Address',
								fieldConfig: { allowBlank: false },
								networkMode	: true
						},
						{
								xtype: 'cp4_button',
								margin: '8 0 0 0',
								id: 'fetch_subnet',
								text: 'Get from interface...',
								handler: Ext.Function.bind( CP.DHCP.openModalWindowInterfaces, this, [ 'Select interface' ])
						}]
			});
		
			var pool_panel = CP.DHCP.addPoolsTable();
			var itemsSubnet = [
				subnet_panel,	
				pool_panel,
				// Lease Configuration
				{
					xtype: 'cp4_sectiontitle',
					titleText: 'Lease Configuration',
					margin: '30 0 10 0'
				}
				,default_lease_panel
				,max_lease_panel
			]; //eof itemsSubnet
					
			// Routing Configuration
			var labelWidth = 120;
			var fieldWidth = 255;
			var itemsRoutingDNS = [{
				xtype: 'cp4_sectiontitle',
				titleText: 'Routing Configuration',
				margin: '0 0 10 0'
			},{   
				xtype: 'cp4_ipv4field',
				id: 'router',
				fieldName: 'router',
				fieldLabel: 'Default Gateway',
				fieldConfig: { allowBlank: true },  //  allowBlank to false - See comment @ 'cp4_ipv4field'
				width: fieldWidth
			},{
				xtype: 'cp4_sectiontitle',
				titleText: 'DNS Configuration'
			},{
				xtype: 'cp4_textfield'
				,fieldLabel: 'Domain Name'
				,id: 'domain'
				,name: 'domain',
				width: 234
			},{   
				xtype: 'cp4_ipv4field',
				id: 'primary',
				fieldName: 'primary',
				fieldLabel: 'Primary DNS Server',
				fieldConfig: { allowBlank: true }, //  allowBlank set to false - See comment @ 'cp4_ipv4field'
				width: fieldWidth
			},{   
				xtype: 'cp4_ipv4field',
				id: 'secondary',
				fieldName: 'secondary',
				fieldLabel: 'Secondary DNS Server',
				fieldConfig: { allowBlank: true }, //  allowBlank set to false - See comment @ 'cp4_ipv4field'
				width: fieldWidth
			},{   
				xtype: 'cp4_ipv4field',
				id: 'tertiary',
				fieldName: 'tertiary',
				fieldLabel: 'Tertiary DNS Server',
				fieldConfig: { allowBlank: true }, //  allowBlank set to false - See comment @ 'cp4_ipv4field'
				width: fieldWidth
			}]; //eof itemsRoutingDNS
		   
			var myForm = Ext.create( 'CP.WebUI4.FormPanel',{
				id: 'main_form',
				bodyPadding: 10,
				items: [{
					xtype: 'cp4_checkbox',
					boxLabel: 'Enable DHCP Subnet',                   
					name: 'istate',
					width: 300,
					id: 'istate'
				},{
					//tabpanel
					xtype: 'cp4_tabpanel',
					margin: '24 0 0 0',
					deferredRender: false, 
					layoutOnTabChange: true, 
					plain: true,
					autoShow: true,
					activeItem: 0,
					defaults: {
				xtype: 'cp4_container',
						height: 435,
						autoScroll: true,
						padding: 8
					},
					items: [{
						title: 'Subnet',
						items: [ itemsSubnet ]
					},{
						title: 'Routing & DNS',
						items: [ itemsRoutingDNS ],
						defaults: {
							labelWidth: 120
						}
					}
					/* will be enable in the future
					,{
						title: 'Windows Clients',
						disabled: true
					},{
						title: 'Boot Up',
						disabled: true
					},{
						title: 'System Setup',
						disabled: true
					}*/
					]
				}],
				buttons: [{
					xtype: 'cp4_button',
					id: 'save_btn',
					text: 'OK',
					handler: Ext.Function.bind( CP.DHCP.saveHandler, this, [ 'main_form',formType ])
				},{
					xtype: 'cp4_button',
					text: 'Cancel',
					handler: function(){
						Ext.getCmp( CP.DHCP.EDIT_BTN_ID ).enable();
						Ext.getCmp( CP.DHCP.DEL_BTN_ID ).enable();
						Ext.getCmp( CP.DHCP.MODAL_WIN_ID ).close();
					}
				}]
			}); //eof myForm
			
			//////////////////////////////////////////////////////////
		   
			var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
				id: CP.DHCP.MODAL_WIN_ID,
				width: CP.DHCP.MODAL_WIN_WIDTH,
				height: CP.DHCP.MODAL_WIN_HEIGHT,
				title: winTitle || 'DCHP Interface',
				items: [ myForm ]
			}).show();
		}


		//open window for adding dhcp on specific interface
		,openModalWindowAdd: function(){
			CP.DHCP.SELECTED_SUBNET = '';
			CP.DHCP.getModalWindow( 'Add DHCP', CP.DHCP.FORM_TYPE_ADD );
			Ext.getCmp('deflease').setValue(CP.DHCP.DEFLEASE);
			Ext.getCmp('maxlease').setValue(CP.DHCP.MAXLEASE);
			
		}

		,openModalWindowEdit: function( title ){

			Ext.getCmp( CP.DHCP.EDIT_BTN_ID ).disable();
			Ext.getCmp( CP.DHCP.DEL_BTN_ID ).disable();
			var selectedRow = Ext.getCmp( CP.DHCP.GRID_ID ).getSelectionModel().getLastSelected();
			if( !selectedRow ){
				//no selection has been made probably because there's no config-lock
				return;
			}
			CP.DHCP.SELECTED_SUBNET = selectedRow.get("subnet");
			CP.DHCP.getModalWindow( 'Edit DHCP', CP.DHCP.FORM_TYPE_EDIT );
			
			var index = CP.DHCP.getSubnetIndex(CP.DHCP.SELECTED_SUBNET);

			Ext.getCmp('v4Addr').setValue(CP.DHCP.StaticData.data.subnets[index].subnet); 
			Ext.getCmp('v4Mask').setValue(CP.DHCP.StaticData.data.subnets[index].netmask);
			
			if (CP.DHCP.StaticData.data.subnets[index].deflease)
				Ext.getCmp('deflease').setValue(CP.DHCP.StaticData.data.subnets[index].deflease);
			else 
				Ext.getCmp('deflease').setValue(CP.DHCP.DEFLEASE);

			Ext.getCmp('domain').setValue(CP.DHCP.StaticData.data.subnets[index].domain);
			
			if (CP.DHCP.StaticData.data.subnets[index].maxlease)
				Ext.getCmp('maxlease').setValue(CP.DHCP.StaticData.data.subnets[index].maxlease);
			else 
				Ext.getCmp('maxlease').setValue(CP.DHCP.MAXLEASE);

			Ext.getCmp('router').setValue(CP.DHCP.StaticData.data.subnets[index].router);
			Ext.getCmp('istate').setValue(CP.DHCP.StaticData.data.subnets[index].state);
			Ext.getCmp('primary').setValue(CP.DHCP.StaticData.data.subnets[index].dnsServerP);
			Ext.getCmp('secondary').setValue(CP.DHCP.StaticData.data.subnets[index].dnsServerS);
			Ext.getCmp('tertiary').setValue(CP.DHCP.StaticData.data.subnets[index].dnsServerT);
	
		}

		,openModalWindowDelete: function(){
			CP.WebUI4.Msg.show({
				title: 'Delete DHCP Interface',
				msg: 'Are you sure you want to delete this subnet?',
				buttons: Ext.Msg.OKCANCEL,
				icon: Ext.Msg.QUESTION,
				fn: function( buttonId, text ){
					if( buttonId == "cancel" )
						return;
					
					//get params object
					var pageObj = CP.UI.getMyObj();
					pageObj.params = {}; //clear out old form params
					var params = pageObj.params;
					
					//get parameters from selected row
					var selectedRow = Ext.getCmp( CP.DHCP.GRID_ID ).getSelectionModel().getLastSelected();
					params["dhcp:dhcpd:dynamic:"+selectedRow.get("subnet")] = "";
					params[":dhcp:dhcpd:dynamic:"+selectedRow.get("subnet")+":exist"] = "";
								
					//submit form
					CP.UI.submitData( CP.UI.getMyObj());
					Ext.getCmp( CP.DHCP.EDIT_BTN_ID ).disable();
					Ext.getCmp( CP.DHCP.DEL_BTN_ID ).disable();
				}
			});
		}


		/*
		 * addPoolsTable
		 */
		,addPoolsTable: function() {
			//store
			var store = Ext.create( 'CP.WebUI4.Store',{
				fields: [
					{name: 'start'},
					{name: 'end'},
					{name: 'type'},
					{name: 'status'}
				],
				proxy: {
					type: 'ajax',
					url : CP.DHCP.DHCP_TCL_REQUEST +'?name=pools&selected_subnet='+ CP.DHCP.SELECTED_SUBNET,
					extraParams: {name:'pools'},
					reader: {
						type: 'json',
						root: 'data.pools'
					}
				}
			});
				
			var pool_type = Ext.create( 'CP.WebUI4.ComboBox',{
				displayField: 'value',
				name: 'pool_type_value',
				valueField : 'value',
				editable   : false,
				store: Ext.create( 'CP.WebUI4.ArrayStore',{
					fields: [
						{name: 'key'},
						{name: 'value', type: 'string'}
					],
					data: [[1, 'Include'],[2, 'Exclude']]
				}) 
			});
			
			var pool_status = Ext.create( 'CP.WebUI4.ComboBox',{
				displayField: 'value',
				name: 'pool_status_value',
				valueField : 'value',
				editable   : false,
				store: Ext.create( 'CP.WebUI4.ArrayStore',{
					fields: [
						{name: 'key'},
						{name: 'value', type: 'string'}
					],
					data: [[1, 'Enable'],[2, 'Disable']]
				}) 
			});
				
			//grid columns
			var cm =[{
				header: 'Status',
				dataIndex: 'status',
				id: 'status', 
				width:	70,
				field: pool_status
			},{
				header: 'Type',
				dataIndex: 'type',
				id: 'type', 
				width:	90,
				field: pool_type
			},{
				header: 'Start',
				dataIndex: 'start',     
				id: 'start', 
				width:	100,
				field: {
					xtype: 'cp4_textfield',
					allowBlank: false
				}
			},{
				header: 'End',
				dataIndex: 'end',    
				id: 'end', 
				flex:1,
				field: {
					xtype: 'cp4_textfield',
					allowBlank: false
				}  
			}];
			
			//create cell editor for the grid
			var cellEditing = Ext.create( 'CP.WebUI4.CellEditing',{
				clicksToEdit: 1
			});
			var type = "" , status = "" , start = "" , end = "" ;			
			//Wrapper panel
			var wrapperPanel = Ext.create( 'CP.WebUI4.Panel',{
				id: 'dhcp-wrapper-panel',
				autoScroll: false,
				items: [{
					// Address Pool Configuration
					xtype: 'cp4_sectiontitle',
					titleText: 'Address Pool'
				},{
					//buttons
					xtype: 'cp4_btnsbar',
					items: [{    
						text: 'Add',
						handler: function(){
							CP.DHCP.openModalWindowRange('Add Range' , null , type , status , start , end );
						}
					},{
						text: 'Edit',    
						id: 'edit_pool',               
						disabled: true,
						handler: function( button ){
							//edit row from grid
							var grid = Ext.getCmp( CP.DHCP.GRID_POOL_ID );
							var store = grid.getStore();
							var selection = grid.getSelectionModel().getLastSelected();
							if( selection ){
								CP.DHCP.openModalWindowRange('Edit Range' , selection , type , status , start , end );
								//button.disable();
							}
						}
					},{
						text: 'Delete',    
						id: 'remove_pool',               
						disabled: true,
						handler: function( button ){
							//delete row from grid
							var grid = Ext.getCmp( CP.DHCP.GRID_POOL_ID );
							var store = grid.getStore();
							var selection = grid.getSelectionModel().getLastSelected();
							if( selection ){
								store.remove( selection );
								Ext.getCmp('edit_pool').disable();
								button.disable();
							}
						}
					}]
				},{
					//pool table
					xtype: 'cp4_grid',
					id: CP.DHCP.GRID_POOL_ID,
					margin: '0 0 14 0',
					width: 400,
					height: 120,
					maxHeight: 120,
					store: store,
					columns: cm,
					listeners: {
						selectionchange: function( gridView, selections ){
							if (selections.length != 0) {
								Ext.getCmp( 'remove_pool' ).enable();
								Ext.getCmp( 'edit_pool' ).enable();
							}
						}
						,itemdblclick: function( grid, rowIndex, event ){
						 CP.DHCP.openModalWindowRange('Edit Range' , rowIndex , type , status , start , end );
						}
					}
				},{
					//inline help
					xtype: 'cp4_inlinemsg',
					text: 'Range\'s calculation requires at least one include range.' 
				}]
			});
			
			return wrapperPanel;
		}


		,saveHandler: function( form_id,formType ){

			form = Ext.getCmp(form_id);
			if( !form || !form.getForm().isValid() ) return;
			
			//get params to be posted to server
			CP.DHCP.setChangedParams( formType );
			// Disable OK button. in case POST failed enable it in submitfailure
			var saveButton = Ext.getCmp( 'save_btn' ) ;
			if (saveButton) saveButton.disable();
			
			var obj=CP.UI.getMyObj();
			//submit form
			CP.UI.submitData( CP.UI.getMyObj());
			
			Ext.getCmp( CP.DHCP.EDIT_BTN_ID ).disable();
			Ext.getCmp( CP.DHCP.DEL_BTN_ID ).disable();
						
		}

		/*
		 * Extract the dhcp from the fields and put it into properties of an object dhcp_data
		 * Returns: true if the fields is valid, else otherwise
		 */
		 ,getDHCPToSend: function(dhcp_data) {
			/* 
			 * Params
			   params:    action:"edit", intf:dhcp_data.interface_id, subnet:dhcp_data.subnet, 
						netmask:dhcp_data.netmask , router:dhcp_data.router,
						deflease:dhcp_data.default_lease,maxlease:dhcp_data.maxlease
			 */
			var dns = "";
			var my_obj;
			var defLease = "";
			var maxLease = "";
			
			my_obj = Ext.getCmp('v4Addr');
			dhcp_data.subnet = my_obj.getValue();
			
			my_obj = Ext.getCmp('v4Mask');
			dhcp_data.netmask = my_obj.getValue();

			my_obj = Ext.getCmp('router');
			dhcp_data.router = my_obj.getValue();
			
			my_obj = Ext.getCmp('primary');
			dhcp_data.primary = my_obj.getValue();
			
			my_obj = Ext.getCmp('secondary');
			dhcp_data.secondary = my_obj.getValue();
			
			my_obj = Ext.getCmp('tertiary');
			dhcp_data.tertiary = my_obj.getValue();
			
			my_obj = Ext.getCmp('domain');
			dhcp_data.domain = my_obj.getValue();
			
			defLease = Ext.getCmp('deflease').getValue();
			dhcp_data.deflease = ( defLease ) ? defLease : 0;
			maxLease = Ext.getCmp('maxlease').getValue();
			dhcp_data.maxlease = ( maxLease ) ? maxLease : 0;
			/*
			 * Build into List Format
			 * "10.1.1.1, 10.1.1.2, 10.1.1.3"
			 */
			if (dhcp_data.primary != "" ) 
						dns = dhcp_data.primary ;
			
			if (dhcp_data.secondary != "" && dns != "") 
						dns = dns + ", " + dhcp_data.secondary ;
						
			else if (dhcp_data.secondary != "") 
						dns = dhcp_data.secondary ;
			
			if (dhcp_data.tertiary != "" && dns != "") 
						dns = dns + ", " + dhcp_data.tertiary ;
						
			else if (dhcp_data.tertiary != "") 
						dns = dhcp_data.tertiary ;
			dhcp_data.dns=dns;
			
			my_obj = Ext.getCmp('istate');
			if ( my_obj.getValue() == true ) dhcp_data.istate = "t";
			else dhcp_data.istate = "";
		}

		 
		/*
		 * Save button handlers for add actions. 
		 * Get the values, validate and send a request to add.
		 * If not valid do nothing and return.
		 */
		,setChangedParams: function( formType ){
			//get params object
			var pageObj = CP.UI.getMyObj();
			pageObj.params = {}; //clear out old form params
			var params = pageObj.params;
			//check form
			var form = Ext.getCmp( 'main_form' ).getForm();
			if( form.isValid() == false ){
				return;
			}
			//dhcp data
			var dhcp_data = {};
			CP.DHCP.getDHCPToSend( dhcp_data );

			//common params
			params["action"] = 'modify';
			params["subnet"] = dhcp_data.subnet;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet] = dhcp_data.istate;
			if (formType != CP.DHCP.FORM_TYPE_EDIT) {
				params[":dhcp:dhcpd:dynamic:"+ dhcp_data.subnet + ":exist"] = "t";
			}
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":netmask"] = dhcp_data.netmask;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":router"] = dhcp_data.router;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":deflease"] = dhcp_data.deflease;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":domain"] = dhcp_data.domain;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":maxlease"] = dhcp_data.maxlease;
			params["dhcp:dhcpd:dynamic:"+ dhcp_data.subnet +":dns"] = dhcp_data.dns;
			//get data from grid
			var store = Ext.getCmp( CP.DHCP.GRID_POOL_ID ).getStore();
			store.each(function(rec){
				if (rec.get('start')!="" && rec.get('end')!="") {
				if (rec.get('type') == "Include") {
					params["dhcp:dhcpd:dynamic:"+dhcp_data.subnet+":pool:start:"+rec.get('start')+":end"] = rec.get('end');
					if (rec.get('status') == "Enable")
						params["dhcp:dhcpd:dynamic:"+dhcp_data.subnet+":pool:start:"+rec.get('start')] = "t" ;
				}
				else {
					params["dhcp:dhcpd:dynamic:"+dhcp_data.subnet+":xpool:start:"+rec.get('start')+":end"] = rec.get('end');
					if (rec.get('status') == "Enable")
						params["dhcp:dhcpd:dynamic:"+dhcp_data.subnet+":xpool:start:"+rec.get('start')] = "t" ;
					
				}
				}
			});
		} 
		
		,getSubnetIndex: function( Subnet ){
			//CP.DHCP.StaticData.data.subnets
			var subnets = CP.DHCP.StaticData.data.subnets;

			for( var i=0 ; i<subnets.length ; i++ ){
				if (subnets[i].subnet == Subnet ) return i;
			}
			return -1;
		}
		
		,openModalWindowInterfaces: function( wintitle ){

			var interfacesStore = Ext.create( 'CP.WebUI4.Store', {
				fields: [
					{name: 'interface', type: 'string'},
					{name: 'ipv4', type: 'string'},
					{name: 'netmask',  type: 'string'},
					{name: 'if_ipv4',type:'string'}
				],
				data: {data:{}},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json',
						root: 'data.interfaces',
						successProperty: 'success'
					}
				}
			});
			
			var myForm = Ext.create( 'CP.WebUI4.FormPanel',{
				id: 'interfaces_form',
				bodyPadding: 10,
				items: [{
							xtype: 'cp4_combobox'
							,fieldLabel: "Interface"
							,name: "interface"
							,id: "interface_id"
							,displayField: "if_ipv4"
							,valueField: "if_ipv4"
							,store: interfacesStore
							,editable: false,
							allowBlank: false
						}],
				buttons: [{
					xtype: 'cp4_button',
					id: 'if_save_btn',
					text: 'OK',
					handler: function(){
						var val=Ext.getCmp('interface_id').getValue();
						if (val==undefined) {
							Ext.getCmp('interface_id').markInvalid("This field is required");
							return;
						}
						
						var rec = interfacesStore.findRecord("if_ipv4", val, 0, false, true, true);

						Ext.getCmp('v4Addr').setValue(rec.raw.ipv4); 
						Ext.getCmp('v4Mask').setValue(rec.raw.netmask);
						Ext.getCmp( 'modal_interfaces' ).close();
					}
				},{
					xtype: 'cp4_button',
					text: 'Cancel',
					handler: function(){
						Ext.getCmp( 'modal_interfaces' ).close();
					}
					
				}]
			}); //eof myForm
			
			var reader = interfacesStore.getProxy().getReader();
			var data = reader.read( CP.DHCP.StaticData );
			interfacesStore.loadData( data.records );
			
			var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
				id: 'modal_interfaces',
				width: 300,
				height: 200,
				title: wintitle || 'DCHP Interface',
				items: [ myForm ]
			}).show();
	
		}
		
		,openModalWindowRange: function( wintitle , selection , type , status , start , end ){

			var pool_type = Ext.create( 'CP.WebUI4.ComboBox',{
			    fieldLabel:   'Type',
				name: 'pool_type',
				displayField: 'value',
				valueField : 'value',
				allowBlank: false,
				labelWidth: 50,
				width: 164,
				editable   : false,
				store: Ext.create( 'CP.WebUI4.ArrayStore',{
					fields: [
						{name: 'key'},
						{name: 'value', type: 'string'}
					],
					data: [[1, 'Include'],[2, 'Exclude']]
				}) 
			});
			
			var pool_status = Ext.create( 'CP.WebUI4.ComboBox',{
				fieldLabel:   'Status',
				name: 'pool_status',
				displayField: 'value',
				valueField : 'value',
				allowBlank: false,
				labelWidth: 50,
				width: 164,
				editable   : false,
				store: Ext.create( 'CP.WebUI4.ArrayStore',{
					fields: [
						{name: 'key'},
						{name: 'value', type: 'string'}
					],
					data: [[1, 'Enable'],[2, 'Disable']]
				}) 
			});
			
			var myForm = Ext.create( 'CP.WebUI4.FormPanel',{
				id: 'range_form',
				bodyPadding: 10,
				items: [pool_type,
						pool_status,
						{
							xtype: 'cp4_ipv4field',
							id: 'start',
							fieldName: 'start',
							width : 190,
							fieldLabel: 'Start',
							labelWidth: 50,
							fieldConfig: { allowBlank: false }  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
						},
						{
							xtype: 'cp4_ipv4field',
							id: 'end',
							fieldName: 'end',
							width : 190,
							fieldLabel: 'End',
							labelWidth: 50,
							fieldConfig: { allowBlank: false }  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
						}
						],
				buttons: [{
					xtype: 'cp4_button',
					id: 'if_save_btn',
					text: 'OK',
					handler: function(){
						form = Ext.getCmp('range_form');
						if( !form || !form.getForm().isValid() ) return;
						
						type   = pool_type.getValue();
						status = pool_status.getValue();
						start  = Ext.getCmp('start').getValue();
						end    = Ext.getCmp('end').getValue();
						
						Ext.getCmp( 'modal_range' ).close();
						var grid = Ext.getCmp( CP.DHCP.GRID_POOL_ID );
						var store = grid.getStore();
						//either define a global model for the store and reuse it when inserting new record,
						//or simply use the same fields structure as defined for the store (no need to define empty fields)
						if (!selection)
							var records = store.add({ type:type , status:status ,start: start , end:end });
						else {
							selection.set('type',type);
							selection.set('status',status);
							selection.set('start',start);
							selection.set('end',end);
						}
					}
				},{
					xtype: 'cp4_button',
					text: 'Cancel',
					handler: function(){
						Ext.getCmp( 'modal_range' ).close();
					}
					
				}]
			}); //eof myForm

			if (selection) {
						pool_type.setValue(selection.data.type);
						pool_status.setValue(selection.data.status);
						Ext.getCmp('start').setValue(selection.data.start);
						Ext.getCmp('end').setValue(selection.data.end);
			}
			
			var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
				id: 'modal_range',
				width: 300,
				height: 200,
				title: wintitle || 'DCHP Interface',
				items: [ myForm ]
			}).show();
	
		}
		
		,submitFailure: function(){
			var pstateCB = Ext.getCmp( CP.DHCP.PSTATE_CB_ID );
			//var pstateVal = pstateCB.getValue();
			//pstateCB.setValue( !pstateVal );
			var saveButton = Ext.getCmp( 'save_btn' ) ;
			if (saveButton) saveButton.enable();
			
			pstateCB.setValue( pstateCB.originalValue );
		    CP.util.clearFormDirtyFlag( CP.DHCP.EXT4_PANEL_ID ); //prevent from the save changes message to appear
            Ext.getCmp( CP.DHCP.ENABLE_DHCP_APPLY_BTN_ID ).disable();
		}

}
