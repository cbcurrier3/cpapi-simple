//bindings: interface
/**
 * @author rthirugn
 * Some conventions:
 *  var, object, function name : myVarName
 *  obecjt id's (for DOM) : my_obj
 *  strings in extjs config: 'option'
 */

CP.Interfaces = {
    //local constants
	EMPTY_VALUE: "-",
    CHECK_CHILDREN_BAD_VALUE: 'NO_RET',
    FORM_TYPE_ADD_ALIAS: 'add_alias',
    FORM_TYPE_ADD_VLAN: 'add_vlan',
    FORM_TYPE_ADD_BRIDGE: 'add_bridge',
    FORM_TYPE_ADD_BOND: 'add_bond',
    FORM_TYPE_ADD_AUX: 'add_aux',
    FORM_TYPE_ADD_VPNT : 'add_vpnt',
    FORM_TYPE_ADD_GRE : 'add_gre',
    FORM_TYPE_ADD_PPPOE : 'add_pppoe',
    FORM_TYPE_ADD_6IN4_TUNNEL : 'add_6in4',
    FORM_TYPE_EDIT: 'edit',
    FORM_TYPE_DELETE: 'delete',
    INTERFACES_MODAL_ID: 'interfaces_modal_win',
    INTERFACES_FORM_ID: 'interfaces_form',
    INTERFACES_GRID_ID: 'interfaces_grid',
    GRID_ADD_BTN_ID: 'interfaces_add_button',	
    GRID_EDIT_BTN_ID: 'interfaces_edit_button',
    GRID_DEL_BTN_ID: 'interfaces_delete_button',
    GRID_REFRESH_BTN_ID: 'interfaces_refresh_button',
    GRID_SIZE : 25,
    GRID_REFRESH_RATE : 60*1000,
    BOND_PREFIX: 'bond',
    BRIDGE_PREFIX: 'br',
    IS_IPV6_SUPPORTED: true,
    CONNECTED_INTERFACE: "",
    VPNT_INTERFACES: "",
    TUNNEL_INTERFACES: "",
    ALL_INTERFACES: "",	
    // storing the fail-open NICs in a dictionary -
    // key: master fail-open interface
    // value: slave fail-open interface - the pair of the master.
    FONIC_INTERFACES_DETAILS: {},
    REFRESH_TASK: null,
    GRID_CURRENT_SELECTION: -1,
    EDIT_BTN_PRE_REFRESH_STATE: -1,
    DEL_BTN_PRE_REFRESH_STATE: -1,
	

    //ADP/SAM Mode MTU
    ADP_MTU_MAXVALUE: 3950,
    //ADP related
    ADP_DEMO: false,
    ADP_DEVICE_PRESENT: false,
    ADP_LABEL: 'SAM',
    ADP_TAB_LABEL: 'SAM',
    ENABLE_ADP_FIELDLABEL: 'Enable SAM Mode',
    ADP_INLINE_MSG_STRING: 'Changing SAM mode will take effect on system restart.<br />Enabling SAM mode turns on HW acceleration on this port.',
    ADP_DEMO_INLINE_MSG_STRING: "SAM Support is in Demo Mode, all Ethernet Interfaces are treated as supporting SAM.  The system will not apply attempts to enable SAM mode.",
    ADP_MODE_BINDING: 'newAdpMode',
    ADP_MODE_TRUE_PARAM_VALUE: 'adp',
    ADP_MODE_FALSE_PARAM_VALUE: 'x86',
    ADP_DISPLAY_VALUE_ON: 'Yes',
    ADP_DISPLAY_VALUE_OFF: 'No',
    FirstRefresh : false,
	
    grid_refresh_func : function() {
        //load conflicting address store
        CP.addr_list.loadStore("");
	if( CP.Interfaces.FirstRefresh ) {
            CP.global.inDirectAutomaticRequestInProgress = true;
            CP.Interfaces.refreshGridOnce();
	} else {
            CP.Interfaces.FirstRefresh = true;
	}
    },

	setPagingToolbarDisabledState : function(disabled) {
		Ext.getCmp("paging_toolbar").child('#next').setDisabled(disabled);
		Ext.getCmp("paging_toolbar").child('#prev').setDisabled(disabled);
		Ext.getCmp("paging_toolbar").child('#last').setDisabled(disabled);
		Ext.getCmp("paging_toolbar").child('#first').setDisabled(disabled);
		Ext.getCmp("paging_toolbar").child('#inputItem').setDisabled(disabled);
	},

	MGMT_INTERFACE:'',
	MGMT_INTERFACE_LIST: '',

    init: function(){
        CP.intf_state.grids_to_refresh = [ CP.Interfaces.INTERFACES_GRID_ID ];
        CP.addr_list.initStore("interface");
        //get ipv6 flag
        Ext.Ajax.request({
            url: "/cgi-bin/ipv6.tcl",
            success: function( jsonResult ){
                //analyze response
                var jsonData = Ext.decode( jsonResult.responseText ); //turn ajax response into js object
                var data = jsonData.data;
                CP.Interfaces.IS_IPV6_SUPPORTED = ( data.ipv6 == 't' ) ? true : false ;
            }
        });

        //create main panel to insert to page:

        var interfacesPanel = Ext.create("CP.WebUI4.DataFormPanel",{
            id: 'interfaces-panel',
            listeners: {
                destroy : function () {
                    //destroy refresh task
                    if (CP.Interfaces.REFRESH_TASK != null) {
                        Ext.TaskManager.stop(CP.Interfaces.REFRESH_TASK);
                        CP.Interfaces.REFRESH_TASK = null;
                    }
                    CP.global.inDirectAutomaticRequestInProgress = false;
                }
            }
        });

        CP.Interfaces.addGridTopToolbar( interfacesPanel );

        //add grid to main panel
        CP.Interfaces.addGrid( interfacesPanel );

        //if RBA allow management interface conf RO/RW
        if (CP.util.isPermittedFeature('management_interface')) {
            //add management interface section
            CP.Interfaces.addMgmtIntf( interfacesPanel );
            //update management interface value
            CP.Interfaces.getMgmtInterface(interfacesPanel);
        }

        //create page object
        var page = {
            title: 'Interfaces',
            afterSubmit: CP.Interfaces.afterSubmit,
            submitFailure : CP.Interfaces.submitFailure,
            submitURL: '/cgi-bin/interfaces.tcl',
            params: {},
            helpFile: 'interfacesHelp.html',
            relatedLinks:[{
                link: 'tree/intf_bridge',
                info: 'This link is for Bridging'
            }],
            panel: interfacesPanel
        };
	


        // Ask the infrastructure to load this page
        CP.UI.updateDataPanel( page );
    }

    // refresh the grid
    ,refreshGrid: function(jsonResult) {
        // decode Json response
        var decodedJson = Ext.decode( jsonResult.responseText );
        var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );

        // keep last record selection
        var recordSelected = grid.getSelectionModel().getLastSelected();
        var editDisabled = Ext.getCmp( CP.Interfaces.GRID_EDIT_BTN_ID ).isDisabled();
        var deleteDisabled = Ext.getCmp( CP.Interfaces.GRID_DEL_BTN_ID ).isDisabled();
        CP.Interfaces.GRID_CURRENT_SELECTION = grid.getStore().indexOf(recordSelected);
        var store = grid.getStore();
        var reader = store.getProxy().getReader();
        var data = reader.read( decodedJson );

        CP.Interfaces.evaluate_adp_input(decodedJson.data);

        store.loadData( data.records );
        // update the FONIC details, in case some new information was given from the server.
        CP.Interfaces.FONIC_INTERFACES_DETAILS = decodedJson.data.fonic_state_details;
        grid.doComponentLayout();

        // restore grid selection
        if(CP.Interfaces.GRID_CURRENT_SELECTION != -1)
        {
            grid.getSelectionModel().select(CP.Interfaces.GRID_CURRENT_SELECTION, true, true);
            if(!editDisabled)
                Ext.getCmp( CP.Interfaces.GRID_EDIT_BTN_ID ).enable();
            if(!deleteDisabled)
                Ext.getCmp( CP.Interfaces.GRID_DEL_BTN_ID ).enable();
        }
    }

    ,refreshGridOnce: function() {	
		var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );
		var recordSelected = grid.getSelectionModel().getLastSelected();
		var store = grid.getStore();

		if(!store.isLoading()) {
			CP.Interfaces.GRID_CURRENT_SELECTION = store.indexOf(recordSelected);
			CP.Interfaces.EDIT_BTN_PRE_REFRESH_STATE = Ext.getCmp(CP.Interfaces.GRID_EDIT_BTN_ID).isDisabled();
			CP.Interfaces.DEL_BTN_PRE_REFRESH_STATE = Ext.getCmp(CP.Interfaces.GRID_DEL_BTN_ID).isDisabled();

			Ext.getCmp(CP.Interfaces.GRID_REFRESH_BTN_ID).setDisabled(true);
			CP.Interfaces.setPagingToolbarDisabledState(true);
			store.loadPage(store.currentPage);
		}
    }
	
	/* 
	* param - value: the value of the key: "dhcp:dhcpc:interface:<if-name>" in database (may be empty if not exist)
	* return: true if interface has dhcp state (the binding exist in database), else return false.
	* used in many functions of CP.Interfaces.
	*/
	,hasDhcpStateInDB: function (binding_value){
		return ( binding_value == "t" || binding_value == "f" );
	}


	,addMgmtIntf: function (obj){
		var managementInterfaceTitle = Ext.create("CP.WebUI4.SectionTitle",{
			titleText: 'Management Interface'
		});
		obj.add( managementInterfaceTitle );
		
		var readOnlyPermission = (CP.util.featurePermission("management_interface")!="rw")?true:false;
		var managementInterfaceSection = Ext.create("CP.WebUI4.Panel",{
			padding: 15,
			margin: '-10 0 24 0',
			items: [{
				xtype: 'cp4_displayfield',
				id: 'MgmtIntfLabel',
				name: 'mgmtIntf',
				minWidth: 250,
				width: 250,
				disabled: readOnlyPermission
			},{
				xtype: 'cp4_button',
				text: 'Set Management Interface',
				width: 160,
				handler: CP.Interfaces.mgmtIntfWindow,
				disabled: readOnlyPermission
			}]
		});
		obj.add( managementInterfaceSection );
	}

	// the window for setting the Management Interface
	,mgmtIntfWindow: function(){
        
    	Ext.create( 'CP.WebUI4.ModalWin',{
        id: "mgmtIntf-window"
        ,title: 'Management Interface'
        ,width: 350
        ,height: 140
        ,items: [{
            xtype: 'cp4_formpanel',
            bodyPadding: 10,
            items: [{
                xtype: 'cp4_combobox',
                id: 'mgmtInterface_field',
                name: 'mgmtInterface_field',
                fieldLabel: 'Management Interface',
                value:CP.Interfaces.MGMT_INTERFACE,
                typeAhead: true,
                selectOnFocus: true,
                forceSelection: true,
                width: 280,
                labelWidth: 120,
                margin: '10 0 5 15',
                allowBlank: false,
                editable: false,
                maxHeight: 225,
                store:CP.Interfaces.MGMT_INTERFACE_LIST, 
                listeners: {
                    valid: function(field){
                        if (field.getValue() != "")
                            Ext.getCmp("mgmtIntf-btn-ok").enable();
                        else
                            Ext.getCmp("mgmtIntf-btn-ok").disable();
                    }
                    ,invalid: function(){
                        Ext.getCmp("mgmtIntf-btn-ok").disable();
                    }
                }
            }],
            buttons: [{
                text: 'OK',
                id:"mgmtIntf-btn-ok",
                xtype: 'cp4_button',
                handler: function(){
                        CP.Interfaces.setMgmtIntf();
                        Ext.getCmp( 'mgmtIntf-window' ).close();
                    
                }
	            },{
	                text: 'Cancel',
	                xtype: 'cp4_button',
	                handler: function(){
	                    Ext.getCmp( 'mgmtIntf-window' ).close();
	                }
	            }]
	        }]
    	}).show();
	} 

	,setMgmtIntf: function(){
	    var FieldMgmtIntf = Ext.getCmp ('mgmtInterface_field').getValue();
	    var myparams = {};
	    myparams["mgmtInterface"] = FieldMgmtIntf;
	    myparams["apply"] = '1';
	    myparams["save"] = '1';
		if (FieldMgmtIntf == CP.Interfaces.MGMT_INTERFACE ){
			// No Change
			return;
		}

		CP.WebUI4.Msg.show({
		     title: 'Caution',
		     msg: 'You are about to change your Management Interface.'
		        + '<br>Click OK to process, Cancel to return.',
		     buttons: Ext.Msg.OKCANCEL,
		     icon:  Ext.Msg.WARNING,
		     fn: function( btn, text ){
		        if( btn == 'cancel' ){
		            return;
		        }
		        Ext.Ajax.request({
			        url: "/cgi-bin/management_interface.tcl"
			        ,method: "POST"
			        ,params: myparams
			        ,success: function(jsonResult) {
				    var jsonData = Ext.decode(jsonResult.responseText);
				    CP.UI.handleSubmit( null, jsonData );
			            CP.Interfaces.getMgmtInterface ();
			        }
			    });
		     }
 		});
	    
	}

	,getMgmtInterface: function(obj){
		Ext.Ajax.request({
	        url: "/cgi-bin/management_interface.tcl"
	        ,method: "GET"
	        ,success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				var mgmtIntf = jsonData.data.mgmtInterface;
				var mgmtIntTxt = Ext.getCmp('MgmtIntfLabel');
				CP.Interfaces.MGMT_INTERFACE = mgmtIntf
				CP.Interfaces.MGMT_INTERFACE_LIST = jsonData.data.availintfs
				mgmtIntTxt.setValue('Management Interface: '  + mgmtIntf );				
	        }
	    });

	}

    //Add section title and grid buttons bar
    ,addGridTopToolbar: function( obj ){
        //Add section title to panel
        var interfaceTitle = Ext.create("CP.WebUI4.SectionTitle",{
             titleText: 'Interfaces'
        });
        obj.add( interfaceTitle );

        /* Buttons for the  'Add'  menu */
        var aliasButton = Ext.create('Ext.Action', {
            id: 'newAlias',
            text: 'Alias',
            iconCls: 'menu_icon_alias',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_ALIAS])
        });

        var vlanButton = Ext.create('Ext.Action', {
            id: 'addVlan',
            text: "VLAN",
            iconCls: 'menu_icon_vlan',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_VLAN])
        });

        var bondButton = Ext.create('Ext.Action', {
            id: 'addBond',
            text: "Bond",
            iconCls: 'menu_icon_bond',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_BOND])
        });

        var bridgeButton = Ext.create('Ext.Action', {
            id: 'addBridge',
            text: "Bridge",
            iconCls: 'menu_icon_bridge',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_BRIDGE, CP.Interfaces.store])
        });

        var auxButton = Ext.create('Ext.Action', {
            id: 'addAux',
            text: 'Loopback',
            iconCls: 'grid_icon_loopback',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_AUX])
        });

        var vpntButton = Ext.create('Ext.Action', {
            id: 'addVpnt',
            text: 'VPN Tunnel',
            iconCls: 'grid_icon_vpnt',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_VPNT])
        });

        var pppoeButton = Ext.create('Ext.Action', {
            id: 'addPPPoE',
            text: 'PPPoE',
            iconCls: 'grid_icon_pppoe',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_PPPOE])
        });

	var greButton = Ext.create('Ext.Action', {
            id: 'addGre',
            text: 'GRE',
            iconCls: 'grid_icon_gre',
            handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_GRE])
        });

 	    var new6in4tunnelButton = Ext.create('Ext.Action', {
	        id: 'add6in4Tunnel',
	        text: '6in4 Tunnel',
	        iconCls: 'grid_icon_6in4',
	        handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL])
	    });

        /*   Create the  Add/Edit/Delete  buttons bar from the buttons we've created above   */
         var buttonsBar = Ext.create("CP.WebUI4.BtnsBar", {
            itemId: 'toolbar',
            xtype: 'toolbar',
            width: 600,
            height: 50,
            bodyPadding: 10,
            plain: true,
            style: {
                overflow: "visible"
            },
            items:  [{
                    text: 'Add',
					id : CP.Interfaces.GRID_ADD_BTN_ID,
                    menu: [aliasButton, vlanButton, bondButton, bridgeButton, auxButton,vpntButton,new6in4tunnelButton,pppoeButton]
                },{
                    id: CP.Interfaces.GRID_EDIT_BTN_ID,
                    text: 'Edit',
                    disabled: true,
                    handler: Ext.Function.bind(CP.Interfaces.buildInterfaceForm, this, [CP.Interfaces.FORM_TYPE_EDIT])
                },{
                    id: CP.Interfaces.GRID_DEL_BTN_ID,
                    text: 'Delete',
                    disabled: true,
                    handler: CP.Interfaces.openModalDelete
                },{
                    id: CP.Interfaces.GRID_REFRESH_BTN_ID,
                    text: 'Refresh',
                    disabled: false,
                    disable: function() {
                        //don't disable a refresh button because there is no config lock
                        return;
                    },
                    setDisabled: function() {
                        var b = this;
                        if (b && b.isDisabled && b.isDisabled() && b.enable) {
                            b.enable();
                        }
                    },
                    handler: CP.Interfaces.refreshGridOnce
                }
            ]
        });

        obj.add( buttonsBar );
   }



    //Create interfaces main grid
    ,addGrid: function(obj) {
        var store = Ext.create( 'CP.WebUI4.Store',{
            storeId: "interfaces_js_grid_store",
            fields: [
                {name: 'name'} ,            {name: 'binding_name'},
                {name: 'type'},             {name: 'binding_type'},
                {name: 'dhcpc'},            {name: 'binding_dhcpc'},
                {name: 'v4Addr'},           {name: 'binding_v4Addr'},
                {name: 'v6Addr'},           {name: 'binding_v6Addr'},
                {name: 'v4Mask'},           {name: 'binding_v4Mask'},
                {name: 'v6Mask'},           {name: 'binding_v6Mask'},
                {name: 'v6autoconfig'},     {name: 'binding_v6autoconfig'},
                {name: 'link_state'},       {name: 'binding_link_state'},
                {name: 'link_carrier'},     {name: 'binding_link_carrier'},
                {name: 'state'},            {name: 'binding_state'},
                {name: 'comment'} ,         {name: 'binding_comment'},
                {name: 'depend_on'},        {name: 'binding_depend_on'},
                {name: 'duplicity'},        {name: 'binding_duplicity'},
                {name: 'speed'},            {name: 'binding_speed'},
                {name: 'auto_negotiation'}, {name: 'binding_auto_negotiation'},
                {name: 'hwaddr'},           {name: 'binding_hwaddr'},
                {name: 'mtu'},              {name: 'binding_mtu'},
                {name: 'monitor_mode'},     {name: 'binding_monitor_mode'},
                {name: 'link_trap'},        {name: 'binding_link_trap'},
                {name: 'vlabel'},           {name: 'binding_vlabel'},
                {name: 'vpntid'},           {name: 'binding_vpntid'},
                {name: 'pppoeid'},          {name: 'binding_pppoeid'},
                {name: 'topology'},         {name: 'binding_topology'},				
                {name: 'gr_ports'},         {name: 'binding_gr_ports'},
                {name: 'bond_ex'},          {name: 'supported_speeds'},
                {name: 'vpnt_ex'},          {name: 'vpnt_ex'},
                {name: 'link_speed'},       {name: 'binding_link_speed'},
                {name: 'ttl'},              {name: 'binding_ttl'},
                {name: 'tunnel_dev'},       {name: 'binding_tunnel_dev'},
                {name: 'tunnel_lcl'},       {name: 'binding_tunnel_lcl'},
                {name: 'tunnel_rmt'},       {name: 'binding_tunnel_rmt'},
                {name: 'pppoe_ex'},         {name: 'pppoe_ex'},
                {name: 'fail_open'},        {name: 'binding_fail_open'},
                {name: 'adp_mode'},         {name: 'binding_adp_mode'},
                {name: 'adp_able'},         {name: 'binding_adp_able'},
                {name: 'v6lladdr'},         {name: 'binding_v6lladdr'},
                {name: 'routing_protos'},	{name: 'support_ethtool_set'}
            ],
            pageSize: CP.Interfaces.GRID_SIZE,
            clearOnPageLoad : true,
            proxy: {
                type: 'ajax',
                url : "/cgi-bin/interfaces.tcl",
                reader: {
                    type: 'json',
                    root: 'data.interfaces',
                    totalProperty : 'data.interfaces_list_length'
                }
            },
            listeners: {
				beforeload: function () {
					CP.Interfaces.setPagingToolbarDisabledState(true);
					Ext.getCmp(CP.Interfaces.GRID_REFRESH_BTN_ID).setDisabled(true);
					Ext.getCmp(CP.Interfaces.GRID_ADD_BTN_ID).setDisabled(true);
				},
                load: function(store, recs, success, eOpts) {
					CP.Interfaces.setPagingToolbarDisabledState(false);
					Ext.getCmp(CP.Interfaces.GRID_REFRESH_BTN_ID).setDisabled(false);
					if ((CP.global.token != -1) && (CP.global.pageAccessMode!="ro"))
						Ext.getCmp(CP.Interfaces.GRID_ADD_BTN_ID).setDisabled(false);
					CP.global.inDirectAutomaticRequestInProgress = false;
                    //get connected interface name for later use when editing this interface
                    CP.Interfaces.evaluate_adp_input(store.proxy.reader.jsonData.data);
                    CP.Interfaces.CONNECTED_INTERFACE = store.proxy.reader.jsonData.data.used_interface;
                    CP.Interfaces.VPNT_INTERFACES = store.proxy.reader.jsonData.data.vpnt_interfaces;
                    CP.Interfaces.TUNNEL_INTERFACES = store.proxy.reader.jsonData.data.tunnel_interfaces;
                    CP.Interfaces.FONIC_INTERFACES_DETAILS = store.proxy.reader.jsonData.data.fonic_state_details;
					CP.Interfaces.ALL_INTERFACES = store.proxy.reader.jsonData.data.all_interfaces;
					
                    // restore grid selection
                    if(CP.Interfaces.GRID_CURRENT_SELECTION != -1) {
					   var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );
					   if(grid) {
							grid.getSelectionModel().select(CP.Interfaces.GRID_CURRENT_SELECTION, true, true);
					   }
                    }
					if(CP.Interfaces.EDIT_BTN_PRE_REFRESH_STATE != -1) {
						Ext.getCmp(CP.Interfaces.GRID_EDIT_BTN_ID).setDisabled(
							CP.Interfaces.EDIT_BTN_PRE_REFRESH_STATE);
					}
					if(CP.Interfaces.DEL_BTN_PRE_REFRESH_STATE != -1) {
						Ext.getCmp(CP.Interfaces.GRID_DEL_BTN_ID).setDisabled(
							CP.Interfaces.DEL_BTN_PRE_REFRESH_STATE);
					}

					if(CP.Interfaces.REFRESH_TASK == null) {
					
						CP.Interfaces.REFRESH_TASK = {
							run: CP.Interfaces.grid_refresh_func
							,interval:CP.Interfaces.GRID_REFRESH_RATE						
						};
						
						Ext.TaskManager.start(CP.Interfaces.REFRESH_TASK);
					}
                }
            }
        });

        // Column Model
        var cm = [
            { width: 120, header:'Name', dataIndex:'name', renderer:showInterface},
            { width: 45, header:CP.Interfaces.ADP_TAB_LABEL, id: 'adp_col', dataIndex:'adp_mode', hidden:true, renderer: showADP},
            { width: 120, header:'Type', dataIndex:'type', renderer:CP.Interfaces.showType},
            { width: 115, header:'IPv4 Address', dataIndex:'v4Addr', renderer: showIP }];

        if ( CP.global.formatNotation == 'Length' ) {
            cm.push({ width: 115, header:'Mask Length', dataIndex:"v4Mask",hidden: false , renderer: CP.util.showSubnetMask_Length});
        }
        else {
            cm.push({ width: 115, header:'Subnet Mask', dataIndex:"v4Mask", hidden: false, renderer: CP.util.showSubnetMask_Length });
        }

        var refreshListeners = {
            show    : function() {
                var g = Ext.getCmp(CP.Interfaces.INTERFACES_GRID_ID);
                if (g) {
                    g.getView().refresh();
                }
            }
            ,hide   : function() {
                var g = Ext.getCmp(CP.Interfaces.INTERFACES_GRID_ID);
                if (g) {
                    g.getView().refresh();
                }
            }
        };

        cm.push(
            { width: 230, header:'IPv6 Address', dataIndex:'v6Addr', renderer: showIP },
            { width: 120, header:'IPv6 Mask Length', dataIndex:"v6Mask",hidden: false, renderer: showMask },
			{ width: 115, header:'Local', dataIndex:'vpnt_ex', hidden: true, renderer: function(value, meta, record) { return getValueFromEx(value, record, "local"); }},
			{ width: 115, header:'Remote', dataIndex:'vpnt_ex', hidden: true, renderer: function(value, meta, record) { return getValueFromEx(value, record, "remote"); }},
			{ width: 115, header:'Physical device', dataIndex:'vpnt_ex', hidden: true, renderer: function(value, meta, record) { return getValueFromEx(value, record, "dev"); }},
			{ width: 115, header:'Peer', dataIndex:'vpnt_ex', hidden: true, renderer: function(value, meta, record) { return getValueFromEx(value, record, "peer"); }},
            { width:  85, header:'Link Status', dataIndex:"link_state", renderer: CP.Interfaces.showLink_grid },
            { flex: 1, header:'Comment', dataIndex:"comment"},
            //hidden columns:
            { header:'Hardware Address', dataIndex:"hwaddr", hidden:true },
        //    { header:'Topology', dataIndex:"topology", hidden:true },			<- RETURN TO ADD TOPOLOGY
            { header:'Member Of', dataIndex:'depend_on', hidden: true},
            { header:'Link Speed', dataIndex:"speed", hidden:true, renderer:CP.Interfaces.showSpeed  },
            { header:'Duplex', dataIndex:"duplicity", hidden:true, renderer:CP.Interfaces.showDuplex  },
            { header:'MTU', dataIndex:"mtu",          hidden: true },
            { header:'IPv6 Local Link Address', dataIndex:"v6lladdr",hidden: true},
            { width: 150, header:'In Use', id:'routing_protos_col', dataIndex:'routing_protos', hidden: true, renderer:showProtos, listeners: refreshListeners }
        );

		function isEmptyObject ( obj ) {
			var name;
			for ( name in obj ) {
				return false;
			}
			return true;
		}
		
		/* Renderer for the case the value of dataIndex is an object */
		/* return the value of the given key in the given data */ 
		function getValueFromEx(data, record, key) {
			/* an empty object */
			if(isEmptyObject(data))
				return CP.Interfaces.EMPTY_VALUE;
			/* check for conditions -- non valid cases -- and return EMPTY_VALUE to indicate an error */
			if(record.data.type == "vpnt"){
				if(key == "dev" && data.type != "unnumbered")
					return CP.Interfaces.EMPTY_VALUE;
				if((key == "local" || key == "remote") && data.type != "numbered")
					return CP.Interfaces.EMPTY_VALUE;
			}
			if (data[key] == "")
				return CP.Interfaces.EMPTY_VALUE;
			return data[key];
		}
		
        function showInterface(value, meta, rec, row, col, st, view) {
            return value;
        }

        cm.push(
            { width: 150, header:'In Use', id:'routing_protos_col', dataIndex:'routing_protos', hidden: true, renderer:showProtos, listeners: refreshListeners }
        );

        var refreshListeners = {
            show    : function() {
                var g = Ext.getCmp(CP.Interfaces.INTERFACES_GRID_ID);
                if (g) {
                    g.getView().refresh();
                }
            }
            ,hide   : function() {
                var g = Ext.getCmp(CP.Interfaces.INTERFACES_GRID_ID);
                if (g) {
                    g.getView().refresh();
                }
            }
        };

        function showADP(value, meta, record, row, col, st, view) {
            if(record.data.adp_able) {
                if(value) { return CP.Interfaces.ADP_DISPLAY_VALUE_ON; }
                return CP.Interfaces.ADP_DISPLAY_VALUE_OFF;
            }
            return "";
        }

        // IP address renderer
        function showIP(val, meta, record) {
            if (val != "" ) {
                if (record.data.type == "loopback")
                    return val;
                if(record.data.type == "pppoe" && record.data.pppoe_ex.conn_status == "Connecting...")
                    return "-";
                return val;
            }
            return "-";
        }
        function showIPv4(val, meta, record) {
            if (val != "" ) {
                var m = CP.util.showSubnetMask_Length(record.data.v4Mask, meta, record);
                if(m != "") {
                    m = ((CP.global.formatNotation == 'Length') ? "/" : " / ")+ m;
                }
                if (record.data.type == "loopback")
                    return val + m;
                return val + m;
            }
            return "-";
        }
        function showIPv6(val, meta, record) {
            if (val != "" ) {
                var m = String(record.data.v6Mask);
                if(m != "") { m = "/"+ m; }
                if (record.data.type == "loopback")
                    return val + m;
                return val + m;
            }
            return "-";
        }

        // IIPv6 Mask Length
        function showMask(val, meta, record) {
            if (val != "" )
                return val;
            return "-";
        }

        function showProtos(value, meta, record) {
            var col = Ext.getCmp('routing_protos_col');
            if (col && col.isVisible() == false) {
                return value.length;
            }
            var v = "None";
            var i;
            switch ( Ext.typeOf(value) ) {
                case "string":
                    if (value != "") {
                        v = value;
                    }
                    break;
                case "array":
                    if (value.length > 0) {
                        v = value.join(",<br />");
                    }
                    break;
                default:
            }
            return v;
        }

        //Grid
        var intfsGrid = Ext.create("CP.WebUI4.GridPanel",{
            id: CP.Interfaces.INTERFACES_GRID_ID,
            //autoExpandColumn: 'comment_col',
            height: 340,
            autoScroll: true,
            store: store,
            columns: cm,
            dockedItems: [{
                xtype: 'cp4_pagingtoolbar',
                store: store,
                id: 'paging_toolbar',
                dock: 'bottom',
                displayInfo: true,
                listeners: {
                    afterrender : function () {
                        this.child('#refresh').hide();	
                    },
                    change: function () {
                            // NOTE: This clearing assumes that the Interfaces Panel 
                            // doesn't hold any components that can be changed by the user.
                            // Hence, we clear the dirty flag unconditionally here, 
                            // in order to avoid "Discard changes" message when leaving the page.
                            var interfacesPanel = Ext.getCmp('interfaces-panel');
                            CP.util.clearFormInstanceDirtyFlag(interfacesPanel.getForm());					
                    }
                }
            }],
            listeners: {
                // select row on mouse click
                selectionchange: function( gridView, selections ){
                    var deleteBtn = Ext.getCmp( CP.Interfaces.GRID_DEL_BTN_ID );
                    if (0 == selections.length){ // if no item has been selected
                        deleteBtn.disable();
                        Ext.getCmp( CP.Interfaces.GRID_EDIT_BTN_ID ).disable();
                        return;
                    }
                    //enable buttons delete and edit
                    var dataType = selections[0].data.type;
                    if( dataType == "ethernet" || dataType == "loopback" ){
                        deleteBtn.disable();
                    }
                    else{
                        deleteBtn.enable();
                    }
                    Ext.getCmp( CP.Interfaces.GRID_EDIT_BTN_ID ).enable();
                },
                //open edit dialog on row double click
                itemdblclick: {
                    scope: this,
                    fn: function( grid, rowIndex, event ){
                        CP.Interfaces.buildInterfaceForm( CP.Interfaces.FORM_TYPE_EDIT );
                    }
                },
                // stop refreshing the window and remove listeners from messageBox
                destroy: function() {
                    if (CP.Interfaces.REFRESH_TASK != null){
                        Ext.TaskManager.stop(CP.Interfaces.REFRESH_TASK);
                        CP.Interfaces.REFRESH_TASK = null;
                    }
                }
            }
        });

        //Add grid to panel
        obj.add( intfsGrid );

        obj.add( Ext.create("CP.WebUI4.inlineMsg", {
            id      : "adp_related_label"
            ,type   : "related"
            ,text   : 'Related Topics: <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/adp_monitor\', \'murl\', \'monitor\');return false;">SAM Monitor</a>'
            ,hidden : true
        }) );

        var adp_demo_label = Ext.create("CP.WebUI4.inlineMsg", {
            id      : 'adp_demo_label'
            ,type   : "info"
            ,text   : CP.Interfaces.ADP_DEMO_INLINE_MSG_STRING
            ,hidden : true
        });
        obj.add( adp_demo_label);
    }
	
    // speed renderer
    ,showSpeed: function( speed ){
                    if ( speed && speed != 'N/A')
                        return speed.substr(0, speed.length - 1) + ' ' + speed.substr(speed.length - 1) + 'bps';
                    else
                        return 'N/A';
		}
   
    // duplex renderer
    ,showDuplex: function( duplex ){
        if (duplex && duplex != 'N/A')
            return duplex.substr(0, 1).toUpperCase() + duplex.substr(1)+ ' Duplex';
        else
            return 'N/A';
    }

    // type renderer
    ,showType: function( type ){
        var text = 'unknown';
        var cls = '';
        switch( type ){
            case 'ethernet':
                text = 'Ethernet';
                cls = 'grid_icon_ethernet';
            break;
            case 'alias':
                text = 'Alias';
                cls = 'grid_icon_alias';
            break;
            case 'vlan':
                text = 'VLAN';
                cls = 'grid_icon_vlan';
            break;
	    case 'gre':
                text = 'GRE';
                cls = 'grid_icon_gre';
            break;
            case 'aux':
            case 'loopback':
                text = 'Loopback';
                cls = 'grid_icon_loopback';
            break;
            case 'bond':
                text = 'Bond';
                cls = 'grid_icon_bond';
            break;
            case 'bridge':
                text = 'Bridge';
                cls = 'grid_icon_bridge';
            break;
            //grid_icon_dialer
            case 'vpnt':
                text = 'VPN-Tunnel';
                cls = 'grid_icon_vpnt';
            break;
            case 'pppoe':
                text = 'PPPoE';
                cls = 'grid_icon_pppoe';
            break;
            case '6in4':
                text = '6in4 Tunnel';
                cls = 'grid_icon_6in4';
            break;
            case '6to4':
                text = '6to4 Tunnel';
                cls = 'grid_icon_vpnt';
            break;
            default:
                text = 'unknown';
                cls = '';
            break;
        }
        if( cls == '' ){
            return text;
        }
        else{
            return '<div class="'+ cls +'">'+ text +'</div>';
        }
     }

     // Returns the correct record from the grid based om the interface name given
    ,getRecordByName: function(name){

        var interfaceGrid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );
        var record;
        interfaceGrid.store.each( function(i) {
            if (i.data.name == name) {
                record = i;
                return;
            }
        });
        return record;
     }

    ,getFailOpenNICsPairName: function(fail_open_ports_names) {
        return fail_open_ports_names[0]+ '/' + fail_open_ports_names[1];
    }
    
    ,getFailOpenPairStatusDetails: function(potential_fonic_pair) {
        var fonic_pair_details = CP.Interfaces.FONIC_INTERFACES_DETAILS[potential_fonic_pair];
        return fonic_pair_details ? fonic_pair_details.split(";") : fonic_pair_details;
    }
    
    ,getNumOfAvailableFailOpenIntfs: function() {
        var numOfFonicIntfs = 0;
        for (var key in CP.Interfaces.FONIC_INTERFACES_DETAILS) {
            if (CP.Interfaces.FONIC_INTERFACES_DETAILS.hasOwnProperty(key)) {
                numOfFonicIntfs++;
            }
        }
        
        return numOfFonicIntfs;
    }
    
    //Update form fields before opening the modal window
    ,updateInterfaceForm: function( formType ){
        var memberOfCombo = Ext.getCmp("depend_on");
        var objList = Ext.getCmp("my-obj-mover");
        var interfaceForm = Ext.getCmp( CP.Interfaces.INTERFACES_FORM_ID );
        var interfaceGrid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );
        var intf_rec_type = interfaceGrid.store.recordType; //Create empty interface Record
        var typeField = Ext.getCmp("type");

        // Get a list of interfacs based on type
        // type - vlan : return valid interfaces for adding new VLAN
        function getInterfaces( type, loadedIntfsSelection ){
            var myArr = [];
            var ports_intf = [];
            var have_alias = [];
			var possible_interfaces = CP.Interfaces.ALL_INTERFACES.split(" ");
			
			
			if( type == "pppoe")
			{
                for(var j = 0;j < possible_interfaces.length;j++)
                    if(possible_interfaces[j] != "") {
						if(possible_interfaces[j].indexOf(":") != -1 || 
							possible_interfaces[j].indexOf("loop") == 0 || 
							possible_interfaces[j] == "lo" ||
							possible_interfaces[j].indexOf("br") == 0 ||
							possible_interfaces[j].indexOf("sit_") == 0 ||
							possible_interfaces[j].indexOf("vpnt") == 0 ||
							possible_interfaces[j].indexOf("gre") == 0 ||
							possible_interfaces[j].indexOf("pppoe") == 0)
							continue; 

                        myArr.push([possible_interfaces[j],possible_interfaces[j]]);	
					}
				return myArr;
			}			
			
			
			if(type == "ip") { //alias
                for(var j = 0;j < possible_interfaces.length;j++)
                    if(possible_interfaces[j] != "") {
						if(possible_interfaces[j].indexOf(":") != -1 || 
							possible_interfaces[j].indexOf("loop") == 0 || 
							possible_interfaces[j].indexOf("gre") == 0 || 
							possible_interfaces[j] == "lo")
							continue; 

                        myArr.push([possible_interfaces[j],possible_interfaces[j]]);	
					}
				return myArr;
			}
			
			if (type == "vlan") {
                for(var j = 0;j < possible_interfaces.length;j++)
                    if(possible_interfaces[j] != "") {
						if(possible_interfaces[j].indexOf(".") != -1 ||
							possible_interfaces[j].indexOf(":") != -1 || 
							possible_interfaces[j].indexOf("loop") == 0 || 
							possible_interfaces[j] == "lo" || 
							possible_interfaces[j].indexOf("vpnt") == 0 ||
							possible_interfaces[j].indexOf("gre") == 0 ||
							possible_interfaces[j].indexOf("sit_") == 0 || 
							possible_interfaces[j].indexOf("pppoe") == 0)
							continue; 

                        myArr.push([possible_interfaces[j],possible_interfaces[j]]);	
					}
				return myArr;
			}

			if (type == "bridge") {
                for(var j = 0;j < possible_interfaces.length;j++)
                    if(possible_interfaces[j] != "") {
						if(possible_interfaces[j].indexOf(":") != -1 || 
							possible_interfaces[j].indexOf("loop") == 0 || 
							possible_interfaces[j] == "lo" || 
							possible_interfaces[j].indexOf("vpnt") == 0 ||
							possible_interfaces[j].indexOf("gre") == 0 ||
							possible_interfaces[j].indexOf("sit_") == 0 || 
							possible_interfaces[j].indexOf("pppoe") == 0 ||
							possible_interfaces[j].indexOf("br") == 0)
							continue; 

                        myArr.push([possible_interfaces[j],possible_interfaces[j]]);	
					}
				return myArr;
			}
			
			if (type == "bond") {
                for(var j = 0;j < possible_interfaces.length;j++)
                    if(possible_interfaces[j] != "") {
						if(possible_interfaces[j].indexOf(".") != -1 ||
							possible_interfaces[j].indexOf(":") != -1 || 
							possible_interfaces[j].indexOf("loop") == 0 || 
							possible_interfaces[j] == "lo" || 
							possible_interfaces[j].indexOf("vpnt") == 0 ||
							possible_interfaces[j].indexOf("gre") == 0 ||
							possible_interfaces[j].indexOf("sit_") == 0 || 
							possible_interfaces[j].indexOf("pppoe") == 0 ||
							possible_interfaces[j].indexOf("br") == 0 || 
							possible_interfaces[j].indexOf("bond") == 0)
							continue; 

                        myArr.push([possible_interfaces[j],possible_interfaces[j]]);	
					}
				return myArr;
			}			


            if ( type == "bridge" || type == "bond" || type =="fonic" ) {
                interfaceGrid.store.each( function(i){
                    for (var j=0; j<i.data.gr_ports.length; j++)
                        ports_intf.push(i.data.gr_ports[j]);
                });
            }

            if( type == "vpnt")
            {
                var vpnt_interfaces = CP.Interfaces.VPNT_INTERFACES.split(" ");

                for(var j = 0;j < vpnt_interfaces.length;j++)
                    if(vpnt_interfaces[j] != "")
                        myArr.push([vpnt_interfaces[j],vpnt_interfaces[j]]);

                return myArr;
            }

			if( type == "fonic") {
				for(var fonic_pair in CP.Interfaces.FONIC_INTERFACES_DETAILS) {
					var fonic_intfs = fonic_pair.split('/');
					var addPair = true;
					for (var j=0; j<ports_intf.length; j++) {
						if (((ports_intf[j] == fonic_intfs[0]) || 
							(ports_intf[j] == fonic_intfs[1])) 
							&& loadedIntfsSelection != fonic_pair) {
							addPair = false;
						}
					}
					if (addPair) {
						myArr.push([fonic_pair, fonic_pair]);
					}
				} 
				return myArr;
			}



			if( type == "6in4")
			{
				var tunnel_interfaces = CP.Interfaces.TUNNEL_INTERFACES.split(" ");

				for(var j = 0;j < tunnel_interfaces.length;j++)
					if(tunnel_interfaces[j] != "")
						myArr.push([tunnel_interfaces[j],tunnel_interfaces[j]]);

				return myArr;
			}

            interfaceGrid.store.each( function(i){

                if ((type == "bond" || type == "bridge") && i.data.type == "alias")
                    have_alias.push( i.data.depend_on);

                // Cannot add alias or vlans  to aliases or aux interfaces
                if((type == "vlan" || type == "ip") && (i.data.type == "alias" || i.data.type == "aux"))
                    return;
                // Cannot add vlans over vlans or down interfaces
                if (type == "vlan" && ( i.data.type == "vlan" || i.data.type == "loopback" || i.data.state == "off" ))
                    return;
                if (type == "bridge"){
                    if ((i.data.type != "bond" && i.data.type != "vlan" &&  i.data.type != "ethernet" && i.data.type != "aux" && i.data.type != "alias")
                        || (i.data.v4Addr && i.data.v4Addr.length >0)
                        || (i.data.v6Addr && i.data.v6Addr.length >0))
                            return;
                    //exclude adp_mode true
                    if (i.data.adp_mode) {
                        return;
                    }
                    for (var j=0; j<ports_intf.length; j++) {
                        if (ports_intf[j] == i.data.name) //filter out interfaces already in the ports_intf list
                            return;
                    }
                }
                if (type == "bond"){
                    if ((i.data.type != "ethernet" )
                        || (i.data.v4Addr && i.data.v4Addr.length >0)
                        || (i.data.v6Addr && i.data.v6Addr.length >0))
                            return;
                    for (var j=0; j<ports_intf.length; j++) {
                        if (ports_intf[j] == i.data.name) //filter out interfaces already in the ports_intf list
                            return;
                    }
                }

                //if it gets to this point, add to the available list
                var intf = [i.data.name, i.data.name];
                myArr.push(intf);
            });

            if (type == "bond" || type == "bridge")
                for(var i = 0;i < myArr.length;i++)
                    for(var j = 0;j < have_alias.length;j++)
                        if(myArr[i][0] ==  have_alias[j])
                            myArr.splice(i,1);

            return myArr;
        }

        // Function: disable_ipv6_tab
        function disable_ipv6_tab () {
            if(Ext.getCmp( 'v6Addr' )) {
                Ext.getCmp( 'v6Addr' ).disable();
            }
            if(Ext.getCmp( 'v6Mask' )) {
                Ext.getCmp( 'v6Mask' ).disable();
            }
            if(Ext.getCmp( 'use_ipv6_static' )) {
                Ext.getCmp( 'use_ipv6_static' ).disable();
            }
            if(Ext.getCmp( 'obtain_ipv6_autoconfig' )) {
                Ext.getCmp( 'obtain_ipv6_autoconfig' ).disable();
            }
        }
        // Function: disable_ipv4_tab
        function disable_ipv4_tab () {
            if(Ext.getCmp( 'v4Addr' )) {
                Ext.getCmp( 'v4Addr' ).disable();
            }
            if(Ext.getCmp( 'v4Mask' )) {
                Ext.getCmp( 'v4Mask' ).disable();
            }
            if(Ext.getCmp( 'use_ipv4_static' )) {
                Ext.getCmp( 'use_ipv4_static' ).disable();
            }
            if(Ext.getCmp( 'obtain_ipv4_dhcp' )) {
                Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
            }
        }
		// Function: disable_ethernet_param_tab
        function disable_ethernet_param_tab () {
            if(Ext.getCmp( 'auto_negotiation' )) {
                Ext.getCmp( 'auto_negotiation' ).disable();
            }
            if(Ext.getCmp( 'link-speed-combo' )) {
                Ext.getCmp( 'link-speed-combo' ).disable();
            }
            if(Ext.getCmp( 'link-speed-text' )) {
                Ext.getCmp( 'link-speed-text' ).disable();
            }
            if(Ext.getCmp( 'hwaddr' )) {
                Ext.getCmp( 'hwaddr' ).disable();
            }
			if(Ext.getCmp( 'mtu' )) {
                Ext.getCmp( 'mtu' ).disable();
            }
			if(Ext.getCmp( 'monitor_mode' )) {
                Ext.getCmp( 'monitor_mode' ).disable();
            }
        }
        function setDisabled_adp_tab( Disabled ) {
            var adp_tab = Ext.getCmp( 'adp_tab' );
            if(adp_tab) {
                adp_tab.items.each( function( f ){
                    if( f.isFormField ){
                        f.setDisabled( Disabled );
                        if(f.validate) {
                            f.validate();
                        }
                    }
                });
            }
        }

        //New Aux (Loopback)
        if( formType == CP.Interfaces.FORM_TYPE_ADD_AUX ){
            typeField.setValue( CP.Interfaces.showType( 'aux' ));
            Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
            Ext.getCmp( 'obtain_ipv6_autoconfig' ).disable();
            Ext.getCmp("state").setValue(true);
	    Ext.getCmp("state").disable();
        }
        //New Alias
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_ALIAS ){
            typeField.setValue( CP.Interfaces.showType( 'alias' ));
            memberOfCombo.store.loadData( getInterfaces( 'ip' ));
            disable_ipv6_tab();
            Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
            Ext.getCmp("state").setValue(true);
            Ext.getCmp("state").disable();
        }
        //New Vlan
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_VLAN ){
            typeField.setValue( CP.Interfaces.showType( 'vlan' ));
            Ext.getCmp('state').setValue(true);
            memberOfCombo.store.loadData( getInterfaces( 'vlan' ));
        }
        //New bridge
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_BRIDGE ){
            typeField.setValue( CP.Interfaces.showType( 'bridge' ));
            Ext.getCmp('user-interface-dual').leftListStore.loadData(getInterfaces("bridge"));
            Ext.getCmp("state").setValue(true);
            Ext.getCmp("state").disable();
            Ext.getCmp('selected-fonic-pair').store.loadData(getInterfaces("fonic"));
        }
        //New bond
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_BOND ){
            typeField.setValue( CP.Interfaces.showType( 'bond' ));
	    var availifs = getInterfaces("bond");
	    Ext.getCmp('user-interface-dual').leftListStore.loadData(availifs);
            Ext.getCmp("state").setValue(true);
            Ext.getCmp("state").disable();
        }
         //New vpnt
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_VPNT ){
            typeField.setValue( CP.Interfaces.showType( 'vpnt' ));
            Ext.getCmp('vpnt_dev').store.loadData( getInterfaces( 'vpnt' ));
            Ext.getCmp( 'vpnt_type_numbered').setValue(true);
            disable_ipv6_tab();
            disable_ipv4_tab();
            Ext.getCmp("state").setValue(true);
        }
         //New PPPoE
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_PPPOE ){
            typeField.setValue( CP.Interfaces.showType( 'pppoe' ));
            Ext.getCmp('pppoe_dev').store.loadData( getInterfaces( 'pppoe' ));
            disable_ipv6_tab();
            disable_ipv4_tab();
            Ext.getCmp("state").setValue(true);
        }
	//New GRE
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_GRE ){
            typeField.setValue( CP.Interfaces.showType( 'gre' ));         
            disable_ipv6_tab();
			Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
            Ext.getCmp("state").setValue(true);
            Ext.getCmp("state").disable();
        }
         //New 6in4 Tunnel
        else if( formType == CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL ){
            typeField.setValue( CP.Interfaces.showType( '6in4' ));
            Ext.getCmp('tunnel_dev').store.loadData( getInterfaces( '6in4' ));
            Ext.getCmp("state").setValue(true);
            Ext.getCmp('tunnel_local_ip_addr').hide();
            disable_ipv4_tab();
            Ext.getCmp('obtain_ipv6_autoconfig').disable();
        }

        //Edit
        else if( formType == CP.Interfaces.FORM_TYPE_EDIT ){
            // Extract needed fields
            // last record is fetched here
            var selectedRow = interfaceGrid.getSelectionModel().getLastSelected();
            var data = selectedRow.data;
            var type = data.type;
            var form = interfaceForm.getForm();

            if (CP.Interfaces.hasDhcpStateInDB(data.dhcpc)) {
                Ext.getCmp( 'obtain_ipv4_dhcp' ).setValue(true);
            }

            var mtu_cmp = Ext.getCmp('mtu');
            var mtu_maxValue = 16000;
            if (mtu_cmp) {
                if (selectedRow.data.adp_mode) {
                    mtu_maxValue = CP.Interfaces.ADP_MTU_MAXVALUE;
                }
                mtu_cmp.setMaxValue(mtu_maxValue);
            }

            // Loads the upper part of the tabs
            form.loadRecord( selectedRow );

            // update Link Status field in a similar way to the grid
            Ext.getCmp('link_state').setValue(CP.Interfaces.showLink(0,0,selectedRow,0));

            function ifname_to_6in4_tunnel_id(ifname) {
                var underline_idx = ifname.lastIndexOf("_");
                if(underline_idx > 0) {
                    return ifname.substring(underline_idx + 1);
                } else {
                    return "";
                }
            }

            if(type == "6to4" || type == "6in4") {
                Ext.getCmp('tunnel_dev').store.loadData( getInterfaces( '6in4' ));
                Ext.getCmp('tunnel_dev').setValue(data.tunnel_dev);
                Ext.getCmp('tunnel_id').setValue(ifname_to_6in4_tunnel_id(data.name));
                Ext.getCmp('tunnel_ttl').setValue(data.ttl);
                Ext.getCmp('tunnel_local_ip_addr').setValue(data.tunnel_lcl);
                Ext.getCmp('tunnel_remote_ip_addr').setValue(data.tunnel_rmt);
                Ext.getCmp('tunnel_dev').disable();
                Ext.getCmp('tunnel_id').disable();
                Ext.getCmp('tunnel_ttl').disable();
                Ext.getCmp('tunnel_local_ip_addr').disable();
                Ext.getCmp('tunnel_remote_ip_addr').disable();
                disable_ipv4_tab();
                Ext.getCmp('obtain_ipv6_autoconfig').disable();
            }

            if(type == "pppoe") {
                Ext.getCmp('pppoeid').setValue(data.pppoeid);
                Ext.getCmp('pppoe_dev').store.loadData( getInterfaces( 'pppoe' ));
                Ext.getCmp('pppoe_dev').setValue(data.pppoe_ex.pppoe_if);
                Ext.getCmp('pppoe_user').setValue(data.pppoe_ex.pppoe_user);
                Ext.getCmp('pppoe_pass').setValue(data.pppoe_ex.pppoe_pass);
                Ext.getCmp('pppoe_peer_defaultgw').setValue(data.pppoe_ex.usepeerdgw);
                Ext.getCmp('pppoe_peerdns').setValue(data.pppoe_ex.usepeerdns);
                Ext.getCmp('link_state').setValue(data.pppoe_ex.conn_status);
                Ext.getCmp('pppoeid').disable();
                if(Ext.getCmp('ipv4_addr_mask'))
                    Ext.getCmp('ipv4_addr_mask').setLoopbackMode(true);
                if(Ext.getCmp( 'v4Mask' ) && data.pppoe_ex.conn_status != "Connecting...")
                    Ext.getCmp( 'v4Mask' ).setValue(CP.util.showSubnetMask_Length(data.v4Mask,null,null));
                disable_ipv6_tab();
                disable_ipv4_tab();
            }

            if(type == "gre") {
                //-Load Options-Ext.getCmp('gre_id').store.loadData( getInterfaces( 'gre' ));
                Ext.getCmp('v4Addr').setValue(data.v4Addr);
                Ext.getCmp('v4Mask').setValue(data.v4Mask);		
				Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
                Ext.getCmp( 'gre_id').setValue(data.vpntid);
				Ext.getCmp( 'gre_ttl').setValue(data.ttl);
				Ext.getCmp( 'gre_local_ip_addr').setValue(data.vpnt_ex.local);
                Ext.getCmp( 'gre_remote_ip_addr').setValue(data.vpnt_ex.remote);
				Ext.getCmp( 'gre_peer_ip_addr').setValue(data.vpnt_ex.peer);
				Ext.getCmp( 'v4Addr').setDisabled(true);
                Ext.getCmp( 'v4Addr').clearInvalid();
				Ext.getCmp( 'v4Mask').setDisabled(true);
                Ext.getCmp( 'v4Mask').clearInvalid();
				Ext.getCmp( 'gre_id').setDisabled(true);
                Ext.getCmp( 'gre_id').clearInvalid();
				Ext.getCmp( 'gre_ttl').setDisabled(true);
                Ext.getCmp( 'gre_ttl').clearInvalid();
				Ext.getCmp( 'gre_local_ip_addr').setDisabled(true);
                Ext.getCmp( 'gre_local_ip_addr').clearInvalid();
                Ext.getCmp( 'gre_remote_ip_addr').setDisabled(true);
                Ext.getCmp( 'gre_remote_ip_addr').clearInvalid();
				Ext.getCmp( 'gre_peer_ip_addr').setDisabled(true);
                Ext.getCmp( 'gre_peer_ip_addr').clearInvalid();

		if(data.mtu == ""){
			//If mtu == 0 -> no MTU was set. use def
			//*dynamically setting emptyText*
			Ext.getCmp('mtu').emptyText = 1476;
			Ext.getCmp('mtu').applyEmptyText();
		}
		else{
			Ext.getCmp('mtu').setValue(data.mtu);
		}
		Ext.getCmp('mtu').clearInvalid();
				
                disable_ipv6_tab();
            }
	    
            if(type == "vpnt")
            {
                Ext.getCmp('vpnt_dev').store.loadData( getInterfaces( 'vpnt' ));
                Ext.getCmp('vpnt_peer').setValue(data.vpnt_ex.peer);

                if(data.vpnt_ex.type == "numbered")
                {
                    Ext.getCmp( 'vpnt_type_numbered').setValue(true);
                    Ext.getCmp( 'vpnt_local_ip_addr').setValue(data.vpnt_ex.local);
                    Ext.getCmp( 'vpnt_remote_ip_addr').setValue(data.vpnt_ex.remote);
                }
                else
                {
                    Ext.getCmp( 'vpnt_dev').setValue(data.vpnt_ex.dev);
                    Ext.getCmp( 'vpnt_type_unnumbered').setValue(true);
                }

                Ext.getCmp('vpntid').disable();
                Ext.getCmp('vpnt_peer').disable();
                Ext.getCmp( 'vpnt_type_numbered').disable();
                Ext.getCmp( 'vpnt_type_unnumbered').disable();
                Ext.getCmp( 'vpnt_local_ip_addr').setDisabled(true);
                Ext.getCmp( 'vpnt_local_ip_addr').clearInvalid();
                Ext.getCmp( 'vpnt_remote_ip_addr').setDisabled(true);
                Ext.getCmp( 'vpnt_remote_ip_addr').clearInvalid();
                Ext.getCmp('vpnt_dev').disable();
            }

            // Load and Hides fields according to the 'type'
            if( type == "bridge" ||  type == "bond" ){
                var curr_ports = [];
                var alist = '';
				var availifs;
				
				if ( type == "bridge") {
					availifs = getInterfaces("bridge");
				} else {
					availifs = getInterfaces("bond");
				}

                for (var i = 0; i < data.gr_ports.length; i++) {
                    curr_ports.push([data.gr_ports[i], data.gr_ports[i]]);
					for(var j = 0;j < availifs.length;j++)
						if(availifs[j][0] == data.gr_ports[i]) {
							availifs.splice(j,1);
							break;
						}
				}

                if ( type == "bridge")
					Ext.getCmp('user-interface-dual').leftListStore.loadData(availifs);
                else {
                    Ext.getCmp('user-interface-dual').leftListStore.loadData(availifs);
				//	CP.Interfaces.bondIfs.availifs = availifs;
				//	CP.Interfaces.bondIfs.setupFinishes();
		}

                Ext.getCmp('user-interface-dual').rightListStore.loadData(curr_ports);

                if (type == "bridge") {
                    var bridgeGroup = Ext.getCmp('brlabel');
                    bridgeGroup.setValue(data.name.substring(CP.Interfaces.BRIDGE_PREFIX.length));
                    bridgeGroup.disable();
					
                    // fail-open info loading
                    var isBridgeFailOpenSelected = data.fail_open;
                    Ext.getCmp('fail_open_checkbox').setValue(isBridgeFailOpenSelected);
					
                    var fail_open_status = "N/A";
                    var fail_open_timeout = "N/A";
                    
                    var potential_fonic_pair = CP.Interfaces.getFailOpenNICsPairName(data.gr_ports);
                    var fonic_pair_details = CP.Interfaces.getFailOpenPairStatusDetails(potential_fonic_pair);
                    // if fonic_pair_details exists, then the selected ports are potentially 
                    // part of a fail-open bridge.
                    if (fonic_pair_details) {
                        // handle loading fail-open ports into the appropriate component.
                        // load it anyway, regardless whether it's enabled or not - in order to make sure
                        // it is filled with the last selection.
                        Ext.getCmp('selected-fonic-pair').store.loadData(getInterfaces("fonic", potential_fonic_pair));
                        // set the selected pair
                        Ext.getCmp('selected-fonic-pair').setValue(potential_fonic_pair);
                        
                        // get fonic pair status details - Open/Bypass, Timeout size.
                        fail_open_status    = fonic_pair_details[0];
                        fail_open_timeout   = fonic_pair_details[1];
                    }
                    else {
                        // even though fail open is not enabled, still needs to load fonic options. 
                        Ext.getCmp('selected-fonic-pair').store.loadData(getInterfaces("fonic"));    
                    }
                    
                    if (isBridgeFailOpenSelected) {
                        // if Fail-Open bridge is selected, then load the fail-open status details.
                        Ext.getCmp('fail_open_status').setValue(fail_open_status);
                        Ext.getCmp('fail_open_timeout').setValue(fail_open_timeout);
                    }
                    else {
                        // Else, disable the fail-open status fields
                        Ext.getCmp('fail_open_status').reset();
                        Ext.getCmp('fail_open_status').disable();
                        Ext.getCmp('fail_open_timeout').reset();
                        Ext.getCmp('fail_open_timeout').disable();
                    }
                }

                if (type == "bond"){
                    Ext.getCmp('state').disable();
                    var bondLabel = Ext.getCmp('bolabel');
                    bondLabel.setValue(data.name.substring(CP.Interfaces.BOND_PREFIX.length));
                    bondLabel.disable();

		    CP.Interfaces.bondIfs.availifs =
			CP.Interfaces.bondIfs.availifs.concat(curr_ports);

                    var modeCmp = Ext.getCmp("bond_mode");
                    if (modeCmp && data.bond_ex.mode != ""){
                        modeCmp.curr_mode = data.bond_ex.mode;
                        modeCmp.setValue({bond_mode: data.bond_ex.mode});
                    }
					/* not used anywhere, Ext.getCmp('link_monitoring') was commented */
                    //var linkMonitoring = Ext.getCmp('link_monitoring');
                    //linkMonitoring.curr_mon = data.bond_ex.mon_mode;
                    //if ( linkMonitoring.curr_mon == 'mon_arp') {
                    //    Ext.getCmp("ARP_monitoring_radio").setValue(true);
                    //    Ext.getCmp('arp_poll_interval').setValue(data.bond_ex.arp_poll);
                    //}
                    //else {
                    //    Ext.getCmp("mii_monitoring_radio").setValue(true);
                    //}

                    Ext.getCmp('mii_mon').setValue(data.bond_ex.mii_poll);
                    Ext.getCmp('lacp_rate').setValue({lacp_rate: data.bond_ex.lacp});
                    Ext.getCmp('down_delay').setValue(data.bond_ex.down_delay);
                    Ext.getCmp('up_delay').setValue(data.bond_ex.up_delay);
                    Ext.getCmp('xmit_hash_policy').setValue({xmit_hash_policy: data.bond_ex.xmit});
                    Ext.getCmp('primary_interface').setValue(data.bond_ex.primary);
                }
            }

            if(Ext.getCmp('if_topology')) {
                Ext.getCmp('if_topology').setValue(data.topology);
                if((type == "alias" || type == "6in4" || type == "loopback" || type == "aux")) {
                    Ext.getCmp('if_topology').setDisabled(true);
                }
            }
			
            if (type == "ethernet") {
                CP.Interfaces.updateLinkSpeedField(data);
            }

            if( type == "alias" || type == "loopback" || type == "vpnt" ){
                if(Ext.getCmp( 'v4Addr' )) {
                    Ext.getCmp( 'v4Addr' ).disable();
                }
                if(Ext.getCmp( 'v4Mask' )) {
                    Ext.getCmp( 'v4Mask' ).disable();
                }
                if(Ext.getCmp( 'use_ipv4_static' )) {
                    Ext.getCmp( 'use_ipv4_static' ).disable();
                }
                if(Ext.getCmp( 'obtain_ipv4_dhcp' )) {
                    Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
                }
                disable_ipv6_tab();
                if ( (type == "alias" || type == "loopback") && interfaceForm.getComponent( 'state' ) !== null ) {
                    interfaceForm.getComponent( 'state' ).disable();
                }
            } else if ( type == "aux" ) {
				if(interfaceForm.getComponent( 'state' ) !== null ) {
                    interfaceForm.getComponent( 'state' ).disable();
				}
                if(Ext.getCmp( 'obtain_ipv4_dhcp' )) {
                    Ext.getCmp( 'obtain_ipv4_dhcp' ).disable();
                }
                if(Ext.getCmp( 'obtain_ipv6_autoconfig' )) {
                    Ext.getCmp( 'obtain_ipv6_autoconfig' ).disable();
                }
            } else{
                if ( data.v6autoconfig == "on" ) {
                    if(Ext.getCmp('obtain_ipv6_autoconfig')) {
                        Ext.getCmp('obtain_ipv6_autoconfig').setValue(true);
                    }
                } else {
                    if(Ext.getCmp('use_ipv6_static')) {
                        Ext.getCmp('use_ipv6_static').setValue(true);
                    }
                }
            }

            member_of_bond = false;
            var ports_intf = [];

            interfaceGrid.store.each( function(i){
                if (i.data.type == "bond")
                {
                    for (var j=0; j<i.data.gr_ports.length; j++)
                    {
                        ports_intf.push(i.data.gr_ports[j]);
                        if (i.data.gr_ports[j] == data.name)
                            member_of_bond = true;
                    }
                }
            });

            if(member_of_bond) {
                Ext.getCmp('state').disable();
                disable_ipv6_tab();
                disable_ipv4_tab();
                disable_ethernet_param_tab();
                setDisabled_adp_tab(true);
            }

            if(type != "pppoe") {
                if(Ext.getCmp('v4Addr')) {
                    Ext.getCmp('v4Addr').setValue(data.v4Addr);
                }
                if(Ext.getCmp('v4Mask')) {
                    Ext.getCmp('v4Mask').setValue(data.v4Mask);
                }
            } else {
                if(data.pppoe_ex.conn_status != "Connecting...") {
                    if(Ext.getCmp('v4Addr')) {
                        Ext.getCmp('v4Addr').setValue(data.v4Addr);
                    }
                }
            }
            if(Ext.getCmp('v6Addr')) {
                Ext.getCmp('v6Addr').setValue(data.v6Addr);
            }
            if(Ext.getCmp('v6Mask')) {
                Ext.getCmp('v6Mask').setValue(data.v6Mask);
            }

            typeField.setValue( CP.Interfaces.showType( type ));
        }

        if(Ext.getCmp('comment')) {
            Ext.getCmp('comment').setValue(Ext.htmlDecode(Ext.getCmp('comment').getValue()));
        }
    }

    /*  link speed field is updated according to the following logic:
    *
    *   if link is up use live handler, otherwise if link is down:
    *
    *   if auto negotiation is on announce "Not supported", and if it's off use DB
    */

    ,updateLinkSpeedField: function(data) {
        var autoNeg = Ext.getCmp('auto_negotiation').getValue();
        var linkState = data.link_carrier;
        if(autoNeg == true) {
            if(linkState == "link up" && data.speed != "N/A" && data.duplicity != "N/A") {
                Ext.getCmp('link-speed-text').setValue(CP.Interfaces.showSpeed(data.speed) + ' / '+ CP.Interfaces.showDuplex(data.duplicity));
            }
            else {
                Ext.getCmp('link-speed-text').setValue("Not supported");
            }
            Ext.getCmp('link-speed-combo').hide();
            Ext.getCmp('link-speed-text').show();
        }
        else {
            if(linkState == "link up" && data.speed != "N/A" && data.duplicity != "N/A") {
                Ext.getCmp('link-speed-combo').setValue(data.speed + '/'+ data.duplicity);
            }
            else if(data.link_speed != "") {
                var speed = data.link_speed.split('/');
                Ext.getCmp('link-speed-combo').setValue(speed[0] + '/' +speed[1]);
            }
            Ext.getCmp('link-speed-combo').show();
            Ext.getCmp('link-speed-text').hide();
        }
    }

    //Create modal window for add/edit/delete, apply content and open it.
    ,openModalWindow: function( width, height, title, items, formType ){
        //create modal
        var modalWin = Ext.getCmp( CP.Interfaces.INTERFACES_MODAL_ID );
        if( !modalWin ){ //if not already exsists
            modalWin = Ext.create("CP.WebUI4.ModalWin",{
                id: CP.Interfaces.INTERFACES_MODAL_ID,
                width: width,
                height: height,
                title: title,
                items: [ items ]
            });
        }
        modalWin.setSize(width, height);
        modalWin.show();
        this.updateInterfaceForm( formType ); //must be called after! window.show()

        var tooltip_slow = Ext.create("Ext.ToolTip",{
            id: 'bond_lacp_slow_tooltip', //use this id in overview page (init function) to display the tooltip automaticaly
            target: 'bond_lacp_slow', //the button in toppanel to render this tooltip on
            anchor: 'center', //align the tooltip message to the center of button
            cls: 'webui-config-lock-qtip',
            anchorOffset: -9, //align the anchor (little triangle on top) to the left of the tooltip
            width: 200,
            html: 'Request partner to transmit LACPDUs every 30 seconds'
        });

        var tooltip_fast = Ext.create("Ext.ToolTip",{
            id: 'bond_lacp_fast_tooltip', //use this id in overview page (init function) to display the tooltip automaticaly
            target: 'bond_lacp_fast', //the button in toppanel to render this tooltip on
            anchor: 'center', //align the tooltip message to the center of button
            cls: 'webui-config-lock-qtip',
            anchorOffset: -9, //align the anchor (little triangle on top) to the left of the tooltip
            width: 200,
            html: 'Request partner to transmit LACPDUs every 1 second'
        });
        modalWin.setHeight( height );
        modalWin.setWidth( width );
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Add fields according to form type
    ,buildInterfaceForm: function( formType ){
        //Member Of combo-box
        var memberOfCombo = Ext.create("CP.WebUI4.ComboBox",{
            id        : 'depend_on',
            name      : 'depend_on',
            fieldLabel: 'Member Of',
         //   mode      : 'local',
            value     : '',
            emptyText : 'Select...',
            triggerAction: 'all',
            displayField : 'disp',
            valueField : 'intf',
            width: 200,
            forceSelection: true,
            typeAhead : true,
            //store : Ext.create("Ext.data.ArrayStore",
            store : Ext.create("Ext.data.Store",{
                storeId: 'memberStore',
                fields: [ 'intf', 'disp' ]
            })
        });

        //Member of disbplay field
        var memberOfDisplay = Ext.create("CP.WebUI4.DisplayField",{
            xtype     : 'cp4_displayfield',
            id        : 'depend_on_dispaly',
            name      : 'depend_on',
            fieldLabel: 'Member Of',
	    width     : 500
        });

        //Enable checkbox
        var enableCB = Ext.create("CP.WebUI4.Checkbox",{
            id         : 'state',
            name       : 'state',
            fieldLabel : 'Enable'
        });
        //IPv4 Notation field
        var IPv4Notation = Ext.create("CP.WebUI4.IPv4Notation",{
            cls: 'interface-field-margin',
            width: 380,
            id: 'ipv4_addr_mask',
            ipId: 'v4Addr',
            ipName: 'v4Addr',
            fieldLabel: 'IPv4 Address',
            notationId: 'v4Mask',
            notationName: 'v4Mask',
            fieldConfig: {
                allowBlank: true
            }
        });

       //IPv6 text field
        var IPv6Field = Ext.create("CP.WebUI4.IPv6Field",{
            id: 'v6Addr',
            name: 'v6Addr',
            disabled: !CP.Interfaces.IS_IPV6_SUPPORTED,
            fieldLabel: 'IPv6 address',
            cls: 'interface-field-margin',
            labelStyle: 'width:80px;'
        });
        //IPv6 Mask length field
        var IPv6MaskLengthField = Ext.create("CP.WebUI4.V6MaskLength",{
            id: 'v6Mask',
            name: 'v6Mask',
            minWidth: 150,
            disabled: !CP.Interfaces.IS_IPV6_SUPPORTED,
            fieldLabel: 'Mask length',
            cls: 'interface-field-margin',
            labelStyle: 'width:80px;'
        });

        //Enable Link Trap checkbox - to be supported in the future
        var enableLinkTrap = Ext.create("CP.WebUI4.Checkbox",{
            id        : 'link_trap',
            name      : 'link_trap',
            fieldLabel: 'Enable Link Trap'
        });

        //Comment field
        var commentField = Ext.create("CP.WebUI4.TextField",{
            name      : 'comment',
            id        : 'comment',
            fieldLabel: 'Comment',
            width     : 400,
            maxLength : 100,
            maskRe    : /[^\\]/ // ]/ //the first "// ]/" prevents the syntax highlighting from being ruined
                                // do not enable entering '\' in comment field.
                                // TODO: replace this with handling corretly HTML encoding of all text fields.
            //,autoCreate: {tag: 'input', type: 'text', size: '20', autocomplete: 'off', maxlength: '100'}
        });

        //type field
        var typeField = Ext.create("CP.WebUI4.DisplayField",{
            id        : 'type',
            name      : 'type',
            fieldLabel: 'Type',
            width     : 200
        });

        // Dual list of interfaces for bridge and bond
        var dualList = Ext.create("CP.WebUI4.DualList",{
            id: 'user-interface-dual',
            width: 400,
            height: 120,
            listHeight: 120,
            leftListStore: Ext.create("Ext.data.ArrayStore",{
                //storeId: 'available_int_store',
                fields: [ 'intf', 'disp' ]
            }),
            leftListCol: [{
                header: 'Available Interfaces',
                dataIndex: 'disp',
                renderer: CP.Interfaces.rendererADP
            }],
            rightListStore: Ext.create("Ext.data.ArrayStore",{
                //storeId: 'chosen_int_store',
                fields: ['intf', 'disp']
            }),
            rightListCol: [{
                header: 'Chosen Interfaces',
                dataIndex: 'intf',
                renderer: CP.Interfaces.rendererADP
            }]
        });

        //bridge ip field
        var bridgeIdField = Ext.create("CP.WebUI4.NumberField",{
            id        : 'brlabel',
            name      : 'brlabel',
            fieldLabel: 'Bridge Group',
            //allowBlank: false,
            minValue: 0,
            maxValue: 1024,
            width: 150,
            labelStyle: 'width:80px;'
        });

        var bondIdField = Ext.create("CP.WebUI4.NumberField",{
            id        : 'bolabel',
            name      : 'bolabel',
            fieldLabel: 'Bond Group',
            minText : "Must be an integer greater or equal to 0",
            maxText : "Must be an integer below or equal to 1024",
            minValue: 0,
            maxValue: 1024,
            width: 150,
            fieldConfig: {
                allowBlank: true
            }
        });
/*
        var bondARPollIntrval = Ext.create("CP.WebUI4.PositiveInt",{
            id        : 'arp_poll_interval',
            name      : 'arp_poll_interval',
            // fieldLabel: 'ARP Polling Interval',
            style: 'margin-left:10px',
            disabled: true,
            minValue: 0,
            emptyText: 100,
            maxValue: 5000,
            width: 50
        });
*/
        var bondDownDelay = Ext.create("CP.WebUI4.PositiveInt",{
            id        : 'down_delay',
            name      : 'down_delay',
            fieldLabel: 'Down Delay',
            minValue: 0,
            disabled: false,
            emptyText: 200,
            maxValue: 5000,
            width: 150
        });

       var bondUpDelay = Ext.create("CP.WebUI4.PositiveInt",{
            id        : 'up_delay',
            name      : 'up_delay',
            fieldLabel: 'Up Delay',
            minValue: 0,
            disabled: false,
            emptyText: 200,
            maxValue: 5000,
            width: 150
        });

       var bondMiiMon = Ext.create("CP.WebUI4.PositiveInt",{
            id        : 'mii_mon',
            name      : 'mii_mon',
            fieldLabel: 'Monitor Interval',
            //style: 'margin-left:13',
            defaultValue: 100,
            disabled: false,
            minValue: 1,
            emptyText: 100,
            maxValue: 5000,
            width: 150
        });
        var primaryOfCombo = Ext.create("CP.WebUI4.ComboBox",{
            id        : 'primary_interface',
            name      : 'depend_on',
            fieldLabel: 'Primary Interface',
            labelWidth: 150,
            value     : '',
            emptyText : 'Select...',
            displayField : 'disp',
            valueField : 'intf',
            forceSelection: true,
            typeAhead : true,
            mode: 'local',
            triggerAction: 'all',
            store : Ext.getCmp('user-interface-dual').rightListStore
        });

/////////////////////////////////////////////////////////////////
//Bond Items[]
///////////////////////////////////////////////////////////////
       // Create the lower section of the 'Bond' tab containing the radio buttons
       // Used in BondItems and appears on the page when trying to add a Bond.
        var bondTabRadioButtons = {
            xtype: 'cp4_radiogroup',
            id: 'bond_mode',
            curr_mode: 'round_robin',
            width: 475,
            height: 40,
            bodyPadding: 20,
            renderTo: Ext.getBody(),
            defaults: { name: 'bond_mode' },
            items: [{
                 id: 'bond_mode_rb'
                , boxLabel: 'Round Robin'
                , checked: true
                , height: 40
                , width: 140
                , inputValue: 'round_robin'
                ,handler: CP.Interfaces.checkedRadio_RoundRobin
                ,listeners: {
                    afterrender: function(obj, opt){
                        CP.Interfaces.checkedRadio_RoundRobin(obj, true);
                    }
                }
            },{
                id: 'bond_mode_ab'
                , boxLabel: 'Active-Backup'
                , height: 40
                , width: 140
                , inputValue: 'active_backup'
                ,handler: CP.Interfaces.checkedRadio_ActiveBackup
            },{
                 id: 'bond_mode_xor'
                , boxLabel: 'XOR'
                , height: 40
                , width: 70
                , inputValue: 'xor'
                ,handler: CP.Interfaces.checkedRadio_XOR
            },{
                 id: 'bond_mode_8023ad'
                , boxLabel: '802.3ad'
                , height: 40
                , width: 70
                , inputValue: '8023AD'
                ,handler: CP.Interfaces.checkedRadio_802
            }]
        };

        // The Bond tab. Appears on the page when trying to add a Bond.
        var BondItems = [
            bondIdField,
            {
                xtype: 'cp4_panel',
                width: 450,
                height: 120,
                items: [dualList]
            },
            {
                xtype: 'cp4_sectiontitle',
                titleText: 'Operation Mode',
                style: 'margin-top:10px;margin-bottom:5px;'
            },
            bondTabRadioButtons
        ];

        /* The Advanced tag for Bond  Add/Edit  */

        // first row
        var advancedBondTab_MediaMon = {
            xtype: 'cp4_panel',
			layout:	{
				type: 'column',
				align: 'left'
			},
            width: 250,
            items: [
                {
                    xtype: 'cp4_label'
                    ,text: 'Media Monitoring Interval  '
					,style: 'line-height:30px;'
                },
                bondMiiMon,
                {
                    xtype: 'cp4_label'
                    ,id: 'milliseconds_mii'
                    ,text: 'Milliseconds'
                    ,style: 'line-height:20px;margin-left:10px;'
                }
            ]
        };

        //second row
        //var advancedBondTab_ARP = {
        //    xtype: 'cp4_panel',
        //    layout: 'column',
        //    items:[{
        //        xtype:"cp4_radio"
        //        ,name:"ARP_monitoring_radio"
        //        ,id: "ARP_monitoring_radio"
        //        ,checked: false
        //        ,height: 19
        //        ,width : 200
        //        ,boxLabel: "ARP Polling Interval "
        //        ,handler: CP.Interfaces.checkedARPPollingInterval
        //    },
        //    bondARPollIntrval,
        //    {
        //        xtype: 'cp4_label'
        //        ,id: 'milliseconds_arp'
        //        ,disabled: true
        //        ,text: 'Milliseconds'
        //        ,style: 'margin-left:10px;'
        //    }]
        //};

        // Radio button for  'Transmit Hash Policy'
        advancedBondTab_Transmit_Radio = Ext.create('CP.WebUI4.RadioGroup', {
            id: 'xmit_hash_policy',
            fieldLabel: 'Transmit Hash Policy',
            labelWidth: 150,
            width: 500,
            bodyPadding: 10,
            defaults:{
                name: 'xmit_hash_policy',
                width : 100
            },
            items: [{
                id: 'bond_xmit_layer2',
                boxLabel: 'Layer 2',
                checked: true,
                inputValue: 'layer2'
            },{
                id: 'bond_xmit_layer3+4',
                boxLabel: 'Layer 3+4',
                inputValue: 'layer3+4'
            }]
        });

        // Radio button for  'LACP Rate'
        advancedBondTab_LACP_Radio = Ext.create('CP.WebUI4.RadioGroup', {
            id: 'lacp_rate',
            fieldLabel: 'LACP Rate',
            labelWidth: 150,
            width: 500,
            bodyPadding: 10,
            defaults:{
                name: 'lacp_rate',
                width : 100
            },
            items: [{
                id: 'bond_lacp_slow',
                boxLabel: 'Slow',
                checked: true,
                inputValue: 'slow'
            },{
                id: 'bond_lacp_fast',
                boxLabel: 'Fast',
                inputValue: 'fast'
            }]
        });

        var fonic_pair_selection = Ext.create( 'CP.WebUI4.ComboBox', {
            id: 'selected-fonic-pair',
            name: 'selected-fonic-pair',
            fiieldLabel: 'Fail Open Interfaces Pair',
            value     : '',
            emptyText : 'Select...',
            triggerAction: 'all',
            displayField : 'disp',
            valueField : 'intf',
            labelWidth: 110,
            forceSelection: true,
            editable: false,
            typeAhead : true,
            disabled: true,
            store : Ext.create("Ext.data.Store",{
                storeId: 'selectedFonicPairStore',
                fields: [ 'intf', 'disp' ]
            })
        });

        var failOpenItemsTab = [{
                xtype     : 'cp4_checkbox',
                id        : 'fail_open_checkbox',
                name      : 'fail_open_checkbox',
                boxLabel  : 'Enable Fail Open',
                labelWidth: 180,
                handler   : function(checkbox, isChecked) {
                                if (CP.Interfaces.getNumOfAvailableFailOpenIntfs() == 0 ||
                                    !isChecked) {
                                    // we don't want to disable the bridge's regular interface selection 
                                    // (i.e. - the dual list) in these cases:
                                    // 1. there aren't any fail open interfaces 
                                    // 2. the checkbox isn't checked.
                                    Ext.getCmp('selected-fonic-pair').disable();
                                    Ext.getCmp('fail_open_status').reset();
                                    Ext.getCmp('fail_open_status').disable();
                                    Ext.getCmp('fail_open_timeout').reset();
                                    Ext.getCmp('fail_open_timeout').disable();
                                    
                                    Ext.getCmp('user-interface-dual').enable();
                                }
                                else {
                                    Ext.getCmp('selected-fonic-pair').enable();
                                    Ext.getCmp('fail_open_status').enable();
                                    Ext.getCmp('fail_open_timeout').enable();
                                    
                                    Ext.getCmp('user-interface-dual').disable();
                                }
                            }
            },
            {
                xtype     : 'cp4_displayfield',
                name      : 'fail_open_status',
                id        : 'fail_open_status',
                fieldLabel : 'Fail Open Status',
                labelWidth: 160
            },
            {
                xtype     : 'cp4_displayfield',
                name      : 'fail_open_timeout',
                id        : 'fail_open_timeout',
                fieldLabel : 'Fail Open Timeout',
                labelWidth: 160
                
            },
            {
                xtype     : 'cp4_sectiontitle',
                titleText : 'Pair Selection'  
            },
            fonic_pair_selection
            ];

	// The Advanced GRE Tab	
		var advancedGREItemsTab = [{
		xtype: 'cp4_sectiontitle',
		titleText: 'Advance GRE Interface Settings',
		margin: '0 0 10 0', // This will help it stay aligned
		},{
		xtype     : 'cp4_numberfield',
		id        : 'mtu',
		name      : 'mtu',
		fieldLabel: 'MTU Value',
		minValue  : 68,
		maxValue  : 16000,
		width     : 150,
		labelWidth: 80,
		emptyText : 1476
		}];
		
	// The Extensions GRE Tab
		
        // The Advanced Bond Tab
        var advancedBondItemsTab = [{
            xtype     : 'cp4_numberfield',
            id        : 'mtu',
            name      : 'mtu',
            fieldLabel: 'MTU',
            minValue  : 68,
            maxValue  : 16000,
            width     : 180,
            emptyText : 1500
        },/*{
            xtype: 'cp4_panel'
            //,layout: 'column'
            ,layout: 'table'
            ,id: 'upper_panel'
            ,fieldLabel: 'Link Monitoring'
            ,items:[{
                xtype: 'cp4_displayfield'
                //fieldLabel: 'Link Monitoring'
            },{
                xtype: 'cp4_panel'
                ,id: 'link_monitoring'
                //,fieldLabel: 'Link Monitoring Interval'
                ,style: 'margin-top:5px'
                ,width: 250
                ,curr_mon: 'mon_mii'
                ,hideLabel: true
                ,border: false
                ,items:[
                    advancedBondTab_MediaMon    //first row
                    //advancedBondTab_ARP         //second row
                    //advancedBondTab_ARP         //second row
                ]
            }]
        },*/
		advancedBondTab_MediaMon,
		{
            xtype: 'cp4_panel',
            layout: 'table',
            border: false,
            fieldLabel: 'Down Delay',
            width: 250,
            hideLabel: false,
            items: [
                bondDownDelay,
                {
                    xtype: 'cp4_label',
                    text: 'Milliseconds',
                    style: 'line-height:20px;margin-left:10px;'
                }
            ]
        },{
            xtype: 'cp4_panel',
            layout: 'table',
            border: false,
            hideLabel: false,
            fieldLabel: 'Up Delay',
            items: [
                bondUpDelay,
                {
                    xtype: 'cp4_label',
                    text: 'Milliseconds',
                    style: 'line-height:20px;margin-left:10px;'
                }
            ]
        },
        primaryOfCombo,
        advancedBondTab_Transmit_Radio,
        advancedBondTab_LACP_Radio
        ];

///////////////////////////////////////////////////////////////////////////////////
// End BondItems
///////////////////////////////////////////////////////////////////////////////////

        /* Tabs - Build the tabs for adding/editing the interfaces */

        var modalWidth = 460;
        var modalHeight = 350;
        var tabsPanelHeight = 130;
        var modalTitle = '';
        var tabTitle = '';
        var tabLabelWidth;
        var itemsArrGenTab = [];
        var isEditBond = false;
        var isEditBridge = false;
        var isEditLB = false;
        var isEditVPN = false;
        var isEdit6in4 = false;
	var isEditGRE = false;

        var topItemsArr = [];
        if( formType == CP.Interfaces.FORM_TYPE_EDIT ){
            topItemsArr = [{
                xtype: 'cp4_displayfield',
                name     : 'link_state',
                id       : 'link_state',
                fieldLabel: 'Link Status',
                width    : 200
            }];
        };
        topItemsArr.push( typeField, enableCB, commentField );

        var itemsIpv4Tab = [{
            xtype: 'cp4_radio',
            boxLabel: 'Obtain IPv4 address automatically',
            name: 'obtain_ipv4',
            id: 'obtain_ipv4_dhcp',
            checked: false,
            hideLabel: true,
            handler: CP.Interfaces.enableIpv4Fields,
            width : 200
        },{
            xtype: 'cp4_radio',
            boxLabel: 'Use the following IPv4 address:',
            width : 300,
            name: 'obtain_ipv4',
            id: 'use_ipv4_static',
            checked: true,
            hideLabel: true,
            handler: CP.Interfaces.enableIpv4Fields
        }, IPv4Notation ];
	
        var itemsIpv6Tab = [{
            xtype: 'cp4_radio',
            boxLabel: 'Obtain IPv6 address automatically',
            name: 'obtain_ipv6',
            id: 'obtain_ipv6_autoconfig',
            disabled: !CP.Interfaces.IS_IPV6_SUPPORTED,
            hideLabel: true,
            checked: false,
            handler: CP.Interfaces.enableIpv6Fields,
            width : 200,
            onClick: function(e) {
                Ext.getCmp("v6Addr").disable();
                Ext.getCmp("v6Mask").disable();
            }
        },{
            xtype: 'cp4_radio',
            boxLabel: 'Use the following IPv6 address:',
            name: 'obtain_ipv6',
            id: 'use_ipv6_static',
            disabled: !CP.Interfaces.IS_IPV6_SUPPORTED,
            hideLabel: true,
            checked: true,
            width : 300,
            handler: CP.Interfaces.enableIpv6Fields,
            onClick: function(e) {
                Ext.getCmp("v6Addr").enable();
                Ext.getCmp("v6Mask").enable();
            }
        }, IPv6Field,
        IPv6MaskLengthField];

        //Member Of combo-box
        var VPNT_Dev_Select = Ext.create("CP.WebUI4.ComboBox",{
            id        : 'vpnt_dev',
            name      : 'vpnt_dev',
            fieldLabel: 'Physical device',
            value     : '',
            emptyText : 'Select...',
            triggerAction: 'all',
            displayField : 'disp',
            valueField : 'intf',
            width: 200,
            forceSelection: true,
            typeAhead : true,
            //store : Ext.create("Ext.data.ArrayStore",
            store : Ext.create("Ext.data.Store",{
                storeId: 'memberStore',
                fields: [ 'intf', 'disp' ]
            })
        });

        var VPNT_Items = [{
            //vpnt id field in the range of 0-32768
            xtype: 'cp4_numberfield',
            id        : 'vpntid',
            name      : 'vpntid',
            fieldLabel: 'VPN Tunnel ID',
            minValue: 0,
            maxValue: 32768,
            width: 160
        },{
            xtype: 'cp4_textfield',
            id: 'vpnt_peer',
            fieldName: 'vpnt_peer',
            fieldLabel: 'Peer',
            fieldConfig: {
                allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
            }
        },{
            xtype: 'cp4_sectiontitle',
            titleText: 'VPN Tunnel Type',
            style: 'margin-top:10px;margin-bottom:5px;'
        },{
            xtype: 'cp4_panel',
            layout: 'column',
            items: [{
                xtype: 'cp4_container',
                items: [{
                    xtype:"cp4_radio"
                    , name:"vpnt_type"
                    , id: "vpnt_type_numbered"
                    , height: 19
                    , width : 200
                    , boxLabel: "Numbered"
                    , handler: CP.Interfaces.checkedNumberedVPNT
                },{
                    xtype: 'cp4_ipv4field',
                    id: 'vpnt_local_ip_addr',
                    fieldName: 'vpnt_local_ip_addr',
                    labelWidth: 90,
                    fieldLabel: 'Local Address',
                    fieldConfig: {
                        allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
                    }
                },{
                    xtype: 'cp4_ipv4field',
                    id: 'vpnt_remote_ip_addr',
                    fieldName: 'vpnt_remote_ip_addr',
                    labelWidth: 90,
                    fieldLabel: 'Remote Address',
                    fieldConfig: {
                        allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
                    }
                }]
            },{
                xtype: 'cp4_container',
                items: [{
                    xtype:"cp4_radio"
                    , name:"vpnt_type"
                    , id: "vpnt_type_unnumbered"
                    , height: 19
                    , width : 200
                    , boxLabel: "Unnumbered"
                    , handler: CP.Interfaces.checkedUnnumberedVPNT
                },VPNT_Dev_Select
                ]
            }]
        }];

	var GRE_Items = [{
		xtype: 'cp4_sectiontitle',
		titleText: 'GRE Interface Settings',
		margin: '0 0 10 0', // This will help it stay aligned to top
		//style: 'margin-top:1px;margin-bottom:1px;'
		},{
		xtype: 'cp4_panel',
            	layout: 'column',
            	items: [{
			xtype: 'cp4_container',
			width : 210,
                	items: [{
				xtype: 'cp4_numberfield',
				id        : 'gre_id',
				name      : 'gre_id',
				fieldLabel: 'GRE Interface ID',
				labelWidth: 100,
				minValue: 1,
				maxValue: 1024,
				width: 170
				}]
				},{
			xtype: 'cp4_container',
			items: [{
				xtype: 'cp4_ipv4field',
				id: 'gre_peer_ip_addr',
				fieldName: 'gre_peer_ip_addr',
				labelWidth: 100,
				fieldLabel: 'Peer Address',
				fieldConfig: {
						allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
					}
				}]
			}]
		},{
		xtype: 'cp4_sectiontitle',
		titleText: 'GRE Tunnel Settings',
		margin: '10 0 10 0', // This will help it stay aligned
		//style: 'margin-top:1px;margin-bottom:1px;'
				},{
				xtype: 'cp4_ipv4field',
				id: 'gre_local_ip_addr',
				fieldName: 'gre_local_ip_addr',
				labelWidth: 100,
				fieldLabel: 'Local Address',
				fieldConfig: {
						allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
					}
				},{
				xtype: 'cp4_ipv4field',
				id: 'gre_remote_ip_addr',
				fieldName: 'gre_remote_ip_addr',
				labelWidth: 100,
				fieldLabel: 'Remote Address',
				fieldConfig: {
						allowBlank: true  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
					}	
			},{
			xtype: 'cp4_numberfield',
			id        : 'gre_ttl',
			name      : 'gre_ttl',
			fieldLabel: 'TTL',
				labelWidth: 100,
			minValue: 1,
			maxValue: 255,
			width: 160,
			emptyText : 255
		}];
	
        if(Ext.getCmp('ipv4_addr_mask'))
            Ext.getCmp('ipv4_addr_mask').setLoopbackMode(false);

        //Member Of combo-box
        var Tunnel_Dev_Select = Ext.create("CP.WebUI4.ComboBox",{
            id        : 'tunnel_dev',
            name      : 'tunnel_dev',
            fieldLabel: 'Interface',
            labelWidth: 90,
            value     : '',
            emptyText : 'Select...',
            triggerAction: 'all',
            displayField : 'disp',
            valueField : 'intf',
            width: 200,
            forceSelection: true,
            typeAhead : true,
            //store : Ext.create("Ext.data.ArrayStore",
            store : Ext.create("Ext.data.Store",{
                storeId: 'memberStore',
                fields: [ 'intf', 'disp' ]
            })
        });

		var tunnel_Items = [
                        Tunnel_Dev_Select,
                        {
							xtype: 'cp4_numberfield',
							id        : 'tunnel_id',
							name      : 'tunnel_id',
							fieldLabel: 'Tunnel ID',
                            labelWidth: 90,
							minValue: 2,
							maxValue: 999999,
							width: 150
						},
                        {
							xtype: 'cp4_numberfield',
							id        : 'tunnel_ttl',
							name      : 'tunnel_ttl',
							fieldLabel: 'TTL',
                            labelWidth: 90,
							minValue: 0,
							maxValue: 255,
							width: 150
						},
                        {
							xtype: 'cp4_ipv4field',
							id: 'tunnel_remote_ip_addr',
							fieldName: 'tunnel_remote_ip_addr',
							labelWidth: 90,
							fieldLabel: 'Remote Address',
							fieldConfig: {
								allowBlank: true
                            }
						},
                        {
                            xtype: 'cp4_ipv4field',
                            id: 'tunnel_local_ip_addr',
							fieldName: 'tunnel_local_ip_addr',
							labelWidth: 90,
							fieldLabel: 'Local Address',
							fieldConfig: {
								allowBlank: true
                            }
						}
        ];

        //Member Of combo-box
        var PPPoE_IF_Select = Ext.create("CP.WebUI4.ComboBox",{
            id        : 'pppoe_dev',
            name      : 'pppoe_dev',
            fieldLabel: 'Interface',
            value     : '',
            emptyText : 'Select...',
            triggerAction: 'all',
            displayField : 'disp',
            valueField : 'intf',
            width: 200,
            forceSelection: true,
            typeAhead : true,
            //store : Ext.create("Ext.data.ArrayStore",
            store : Ext.create("Ext.data.Store",{
                storeId: 'memberStore',
                fields: [ 'intf', 'disp' ]
            })
        });

        var PPPoE_Items = [{
            xtype: 'cp4_numberfield',
            id        : 'pppoeid',
            name      : 'pppoeid',
            fieldLabel: 'PPPoE ID',
            allowDecimals: false,
            minValue: 0,
            maxValue: 999,
            width: 150
        },
        PPPoE_IF_Select,
        {
            xtype: 'cp4_textfield',
            id: 'pppoe_user',
            fieldName: 'pppoe_user',
            fieldLabel: 'User Name',
            enforceMaxLength : true,
            maxLength : 127,
            fieldConfig: {
                allowBlank: true
            }
        },{
            xtype: 'cp4_password',
            id: 'pppoe_pass',
            fieldName: 'pppoe_pass',
            fieldLabel: 'Password',
            enforceMaxLength : true,
            maxLength : 127,
            fieldConfig: {
                allowBlank: true
            }
        },{
            xtype     : 'cp4_checkbox',
            name      : 'pppoe_peerdns',
            id        : 'pppoe_peerdns',
            fieldLabel: 'Use Peer DNS',
            labelWidth: 180
        },{
            xtype     : 'cp4_checkbox',
            name      : 'pppoe_peer_defaultgw',
            id        : 'pppoe_peer_defaultgw',
            fieldLabel: 'Use Peer as Default Gateway',
            labelWidth: 180
        }
        /*,{
            xtype: 'cp4_displayfield',
            name     : 'pppoe_state',
            id       : 'pppoe_state',
            fieldLabel: 'PPPoE Client Status',
            labelWidth: 180,
            margin : '10 0 0 0',
            hidden: true
        }*/
        ];

        function disableEthernertFieldIfNeeded(field){
            var selectedRow = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ).getSelectionModel().getLastSelected();
            if (selectedRow.data.support_ethtool_set && selectedRow.data.support_ethtool_set == 'false')
            {
                field.setDisabled(true);
            }
        }

        switch ( formType ) {
            //Add Aux(Loopback)
            case CP.Interfaces.FORM_TYPE_ADD_AUX:
                modalTitle = 'Add Loopback';
                Ext.getCmp('ipv4_addr_mask').setLoopbackMode(true);
            break;

            //Add alias
            case CP.Interfaces.FORM_TYPE_ADD_ALIAS:
                modalTitle = 'Add Alias';
                tabTitle = 'Alias';
                itemsArrGenTab = [ memberOfCombo ];

                // hide comment field since the system does not support it yet for aliases
                commentField.hide();
                modalHeight = 330;
            break;

            //Add vlan
            case CP.Interfaces.FORM_TYPE_ADD_VLAN:
                modalTitle = 'Add VLAN';
                tabTitle = 'VLAN';
                itemsArrGenTab = [{
                    //vlan id field in the range of 2-4094
                    xtype: 'cp4_positiveint',
                    id        : 'vlabel',
                    name      : 'vlabel',
                    fieldLabel: 'VLAN ID',
                    minValue: 2,
                    maxValue: 4094,
                    width: 150
                },
                memberOfCombo ];
            break;

            //Add Bridge
            case  CP.Interfaces.FORM_TYPE_ADD_BRIDGE:
                modalHeight = 411;
                modalWidth = 500;
                tabsPanelHeight = 188;
                modalTitle = 'Add Bridge';
                tabTitle = 'Bridge';
                itemsArrGenTab = [ bridgeIdField, {
                    xtype: 'cp4_panel',
                    width: 450,
                    height: 120,
                    items: [dualList]
                } ];
            break;

            //Add Bond
            case  CP.Interfaces.FORM_TYPE_ADD_BOND:
                  modalHeight = 450;
                  modalWidth = 500;
                  tabsPanelHeight = 230;
                  modalTitle = 'Add Bond';
                  tabTitle = 'Bond';
                  itemsArrGenTab = BondItems;
		  CP.Interfaces.bondIfs.setupBegins(dualList);
            break;

            //Add VPNT
            case  CP.Interfaces.FORM_TYPE_ADD_VPNT:
                  modalHeight = 441;
                  modalWidth = 500;
                  tabsPanelHeight = 200;
                  modalTitle = 'Add VPN Tunnel';
                  tabTitle = 'VPN Tunnel';
                  itemsArrGenTab = VPNT_Items;
            break;

            //Add GRE
            case  CP.Interfaces.FORM_TYPE_ADD_GRE:
                  modalHeight = 420; 
				modalWidth = 500;
                  tabsPanelHeight = 190; // This controls the size of the tab frame inside the window 
				modalTitle = 'Add GRE Tunnel';
				tabTitle = 'GRE Tunnel';
				itemsArrGenTab = GRE_Items;
				Ext.getCmp('ipv4_addr_mask').setLoopbackMode(true); // This will allow a 32 mask
            break;

            //Add PPPOE
            case  CP.Interfaces.FORM_TYPE_ADD_PPPOE:
                  modalHeight = 441;
                  modalWidth = 500;
                  tabsPanelHeight = 200;
                  modalTitle = 'Add PPPoE';
                  tabTitle = 'PPPoE';
                  itemsArrGenTab = PPPoE_Items;
            break;

            //Add 6in4
            case  CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL:
                  modalHeight = 441;
                  modalWidth = 500;
                  tabsPanelHeight = 200;
                  modalTitle = 'Add 6in4 Tunnel';
                  tabTitle = '6in4 Tunnel';
                  itemsArrGenTab = tunnel_Items;
            break;

            //Edit
            case CP.Interfaces.FORM_TYPE_EDIT:
                var selectedRow = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ).getSelectionModel().getLastSelected();
                var editType = selectedRow.data.type;
                modalTitle = 'Edit '+ selectedRow.data.name;
                if( editType == "ethernet" ){
                    /*
                     * This function builds store for supported link speeds.
                     * It takes results from tcl an inserts them in the value field,
                     * and it formats each value and inserts them in the display field.
                     * Format given from tcl - 10M/half or N/A, formats to 10 Mpbs / Half Duplex or leaves N/A
                     */
                    function getLinkSpeedStore(linkSpeeds){
                        var store = [];
                        for (var i = 0; i < linkSpeeds.length; i++){
                            var displayedSpeed = 'N/A';
                            if (linkSpeeds[i] != 'N/A') {
                                var format = linkSpeeds[i].split('/');
                                displayedSpeed = CP.Interfaces.showSpeed(format[0]) + ' / ' + CP.Interfaces.showDuplex(format[1]);
                            }
                            store.push([linkSpeeds[i], displayedSpeed]);
                        }
                        return store;
                    }
                    tabTitle = 'Ethernet';
                    tabLabelWidth = 110;
                    modalHeight = 374;
                    //enableLinkTrap, //not supported yet
                    itemsArrGenTab = [{
                        xtype     : 'cp4_checkbox',
                        name      : 'auto_negotiation',
                        id        : 'auto_negotiation',
                        fieldLabel: 'Auto Negotiation',
                        labelWidth:tabLabelWidth,
                        listeners : {
                            change: function(field, newValue, oldValue) {
                                var data = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ).getSelectionModel().getLastSelected().data;
                                CP.Interfaces.updateLinkSpeedField(data);
                            },
                            afterrender: disableEthernertFieldIfNeeded
                        }
                    },{
                        xtype     : 'cp4_combobox',
                        id: 'link-speed-combo',
                        name: 'link-speed-combo',
                        fieldLabel: 'Link Speed',
                        queryMode: 'local',
                        editable: false,
                        labelWidth: tabLabelWidth,
                        store: getLinkSpeedStore(selectedRow.data.supported_speeds),
                        listeners : {
                            afterrender: disableEthernertFieldIfNeeded
                        }
                    },{
                        xtype: 'cp4_displayfield',
                        id       : 'link-speed-text',
                        fieldLabel: 'Link Speed',
                        labelWidth: tabLabelWidth,
                        height   : 22,
                        width    : 300,
                        value    : 'Not supported',
                        listeners : {
                            afterrender: disableEthernertFieldIfNeeded
                        }
                    },{
                        xtype     : 'cp4_textfield',
                        name      : 'hwaddr',
                        id        : 'hwaddr',
                        fieldLabel: 'Hardware Address',
                        emptyText: '00:00:00:00:00:00',
                        labelWidth:tabLabelWidth,
                        // 'vtype mac' is defined but not enough, because
                        // the back end here is more restrictive:
                        // requires two digits per octet, and no multicast addresses.
                        // Therefore also use 'CP.Interfaces.validateHardwareAddress'
                        vtype: 'mac',
                        validator: CP.Interfaces.validateHardwareAddress
                    },{
                        xtype     : 'cp4_numberfield',
                        id        : 'mtu',
                        name      : 'mtu',
                        fieldLabel: 'MTU',
                        minValue  : 68,
                        maxValue  : 16000,
                        labelWidth:tabLabelWidth,
                        width     : 180,
                        emptyText : 1500
                    },{
                        xtype     : 'cp4_checkbox',
                        name      : 'monitor_mode',
                        id        : 'monitor_mode',
                        fieldLabel: 'Monitor Mode',
                        labelWidth:tabLabelWidth
                    }];
                }
                //Edit VLAN
                else if( editType == "vlan" ){
                    tabTitle = 'VLAN';
                    itemsArrGenTab = [{
                        xtype     : 'cp4_displayfield',
                        id        : 'vlabel',
                        name      : 'vlabel',
                        fieldLabel: 'VLAN ID',
                        width: 150
                    }, memberOfDisplay ];
                }
                //Edit Bridge
                else if (editType == "bridge"){
                    modalHeight = 435;
                    modalWidth = 500;
                    tabsPanelHeight = 188;
                    tabTitle = 'Bridge';
                    isEditBridge = true;
                    itemsArrGenTab = [ bridgeIdField, {
                        xtype: 'cp4_panel',
                        width: 450,
                        height: 120,
                        items: [dualList]
                    } ];
                }
                //Edit Bond
                else if (editType == "bond"){
                    modalHeight = 475;
                    modalWidth = 500;
                    tabsPanelHeight = 225;
                    tabTitle = 'Bond';
                    isEditBond = true;
                    itemsArrGenTab = BondItems;
		    CP.Interfaces.bondIfs.setupBegins(dualList);
                }
                else if (editType == "alias"){ //alias
                    tabTitle = 'Alias';
                    tabsPanelHeight = 103;
                    itemsArrGenTab = [ memberOfDisplay ];

                    // hide comment field since the system does not support it yet for aliases
                    commentField.hide();
                    modalHeight = 330;
                }
                else if (editType == "vpnt"){ //VPN Tunnel
                    tabTitle = 'VPN Tunnel';
                    modalHeight = 441;
                    modalWidth = 500;
                    tabsPanelHeight = 200;
                    isEditVPN = true;
                    itemsArrGenTab = [ VPNT_Items ];
                }
                else if (editType == "gre"){ //GRE Tunnel
					//modalWidth = 330;
					//tabsPanelHeight = 200;
					//tabLabelWidth = 110;
					modalWidth = 500;
					tabsPanelHeight = 175;
					modalHeight = 420;
					tabTitle = 'GRE Tunnel';
					itemsArrGenTab = GRE_Items;
					isEditGRE = true;
					Ext.getCmp('ipv4_addr_mask').setLoopbackMode(true); // This will allow a 32 mask
                }
                else if (editType == "pppoe"){ //PPPoE
                    tabTitle = 'PPPoE';
                    modalHeight = 441;
                    modalWidth = 500;
                    tabsPanelHeight = 200;
                    itemsArrGenTab = [ PPPoE_Items ];
                }
                else if (editType == "6in4"){ //6in4 tunnel
                    tabTitle = '6in4 Tunnel';
                    modalHeight = 441;
                    modalWidth = 500;
                    tabsPanelHeight = 200;
                    isEdit6in4 = true;
                    itemsArrGenTab = [ tunnel_Items ];
                }
                else if (editType == "6to4"){ //6to4 tunnel
                    tabTitle = '6to4 Tunnel';
                    modalHeight = 441;
                    modalWidth = 500;
                    tabsPanelHeight = 200;
                    itemsArrGenTab = [ tunnel_Items ];
                }
                else{ //loopback or aux
                    isEditLB = true;
                    Ext.getCmp('ipv4_addr_mask').setLoopbackMode(true);
                }
            break;
        }

        var itemsTopologyTab = [
			{
				xtype: 'cp4_combobox',
				id: 'if_topology',
				name: 'if_topology',
				fieldLabel: 'Interface Topology',	
				store:[['undefined','undefined'],['external','external'],['internal','internal']],
				width: 200,
				labelWidth: 100,
				margin: '10 0 5 15',
				editable : false,
				value : 'undefined'
			}
		];				
		
        var topology_tab = {
            id: 'topology_tab',
            title: "Topology",
            labelWidth: 130,
            labelHeight: 888,
            items: [ itemsTopologyTab ]
        };	
		
        /* build the 'tabItemsArr' (from the tabs we just built) to be placed in the form */
        var tabItemsArr = [{
            title: 'IPv4',
            id: 'ipv4_tabform',
            labelWidth: 130,
            labelHeight: 888,
            items: [ itemsIpv4Tab ]
        },{
            title: 'IPv6',
            id: 'ipv6_tabform',
            items: [ itemsIpv6Tab ]
        },{
            title: tabTitle,
            labelWidth: tabLabelWidth,
            items: [ itemsArrGenTab ]
        }];
				
       // This removes the last tab in the tab panel cause it is not needed in loopbacks
        if ( formType == CP.Interfaces.FORM_TYPE_ADD_AUX || isEditLB ){
            tabItemsArr.pop();
        }

        //Add advanced tab to bond
        if( formType == CP.Interfaces.FORM_TYPE_ADD_BOND || isEditBond == true  ){
            tabItemsArr.push({
                title: 'Advanced',
                labelWidth: 110,
                items: [ advancedBondItemsTab ]
            });
        }

	//Add advanced tab to GRE
        if( isEditGRE == true ){
            tabItemsArr.push({
                title: 'Advanced',
                labelWidth: 110,
                items: [ advancedGREItemsTab ]
            });
        }

        // Add Fail-Open tab to bridge
        if( formType == CP.Interfaces.FORM_TYPE_ADD_BRIDGE || isEditBridge == true ) {
            // check if any fail open interfaces exist - if this dictionary is empty,
            // then no fail-open interfaces information was given by the server.
            if (CP.Interfaces.getNumOfAvailableFailOpenIntfs() > 0) {
                tabItemsArr.push({
                    title: 'Fail Open',
                    id: 'fail-open-tab',
                    labelWidth: 110,
                    items: [ failOpenItemsTab ]
                });
            } 
            else {
                // Even if there aren't any fail open interfaces, show the 
                // Fail Open tab, but make it disabled, with a tooltip that 
                // explains.
                tabItemsArr.push({
                    title: 'Fail Open',
                     tabConfig: {
                        tooltip: 'There are no fail open network cards installed on the machine.'
                    },
                    id: 'fail-open-tab',
                    labelWidth: 110,
                    disabled:true,
                    items: [ failOpenItemsTab ]
                });
            }
        }
        
        // This removes the IPv4 and IPv6 tabs in the case of VPN Tunnel manipulation
        if( formType == CP.Interfaces.FORM_TYPE_ADD_VPNT || isEditVPN == true  ){
            tabItemsArr.splice(0, 2);
        }
		
        // This removes the IPv4 and IPv6 tabs in the case of 6in4 Tunnel manipulation
        if( formType == CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL || isEdit6in4 == true  ){
            tabItemsArr.splice(0, 1);
        }

	// This removes the IPv6 tab in the case of GRE Tunnel 
	if ( formType == CP.Interfaces.FORM_TYPE_ADD_GRE || isEditGRE == true ){
		tabItemsArr.splice(1, 1);
		//###array.splice(start, deleteCount[, item1[, item2[, ...]]])###
	}

        if( ( CP.Interfaces.ADP_DEVICE_PRESENT || CP.Interfaces.ADP_DEMO )
            && (formType == CP.Interfaces.FORM_TYPE_EDIT)
            && selectedRow
            && (selectedRow.data.type == "ethernet")
            && (selectedRow.data.adp_able) ) {

            var adp_tab = {
                title: CP.Interfaces.ADP_TAB_LABEL,
                id: 'adp_tab',
                items: [{
                    xtype       : 'cp4_checkbox',
                    id          : 'adp_mode',
                    name        : 'adp_mode',
                    fieldLabel  : CP.Interfaces.ENABLE_ADP_FIELDLABEL,
                    labelWidth  : 110,
                    width       : 150,
                    handler     : function(checkbox, newValue) {
                        var mtu_cmp = Ext.getCmp('mtu');
                        var mtu_maxValue = newValue ? CP.Interfaces.ADP_MTU_MAXVALUE : 16000;
                        if (mtu_cmp) {
                            mtu_cmp.setMaxValue(mtu_maxValue);
                            var mtuValue = mtu_cmp.getRawValue();
                            if (mtuValue != "") {
                                mtuValue = parseInt(mtuValue, 10);
                                mtuValue = Ext.Number.constrain(mtuValue, mtu_cmp.minValue, mtu_cmp.maxValue);
                                mtu_cmp.setValue(mtuValue);
                            }
                        }
                    }
                },{
                    xtype       : 'cp4_inlinemsg'
                    ,type       : 'info'
                    ,text       : CP.Interfaces.ADP_INLINE_MSG_STRING
                                + '<br />SAM enabled interfaces have a maximum MTU of '+ String(CP.Interfaces.ADP_MTU_MAXVALUE)
                }]
            };
            tabItemsArr.push( adp_tab );
        }
		
        //tabItemsArr.push(topology_tab); <- REMOVE COMMENT TO ADD TOPOLOGY 

        var interfaceForm = Ext.create("CP.WebUI4.FormPanel",{
            id: CP.Interfaces.INTERFACES_FORM_ID,
            bodyStyle: 'padding:10px;', 
            fieldDefaults: {
                labelWidth: 80
            },
            items: [ topItemsArr, {
                xtype: 'cp4_tabpanel',
                id: 'tab_panel',
                margin: '24 0 0 0',
                cls: 'webui-tabpanel-container',
                deferredRender: false, //all tabs will be loaded on startup and therefore all fields will be accessiable
                layoutOnTabChange: true, //layouting all fields in tab correctly
                autoScroll: true,
                plain: true,
                autoShow: true,
                bodyPadding: 10,
                activeTab: 0,
                formType: formType,
                defaults: {
                    xtype: 'cp4_panel',
                    height: tabsPanelHeight,
                    hideMode: 'offsets', // this is in order to fix the layout.
                    checkMyChildren: function() {
                        var t = this;
                        var i, c, v;
                        if (Ext.typeOf(t.items) != "object") {
                            return CP.Interfaces.CHECK_CHILDREN_BAD_VALUE;
                        }
                        for (i = 0; i < t.items.items.length; i++) {
                            c = Ext.getCmp(t.items.items[i].id);
                            if (c) {
                                v = 0;
                                if (c.validate) {
                                    v = c.validate();
                                } else if (c.isValid) {
                                    v = c.isValid();
                                } else {
                                    return CP.Interfaces.CHECK_CHILDREN_BAD_VALUE;
                                }
                                if (!v) {
                                    return this.id;
                                }
                            }
                        }
                        return "";
                    }
                },
                listeners: {
                    beforetabchange: function( tabPanel, newTabPanel, currentTabPanel ){
                        // Changed so that invalid configuration in other tabs
                        // won't prevent us from switching to them
                        return true;
                    }
                },
                items: [ tabItemsArr ]
            }],
            buttons: [{
                xtype: 'cp4_button',
                id: 'form-ok',
                text: 'OK',
                formType: formType,
                handler: function( btn ){CP.Interfaces.saveHandler( btn.formType );}
            },{
                xtype: 'cp4_button',
                id: 'form-cancel',
                text: 'Cancel',
                handler: function(){
                    Ext.getCmp( CP.Interfaces.INTERFACES_MODAL_ID ).close();
                }
            }]
        });
		
        if ((formType == CP.Interfaces.FORM_TYPE_EDIT) && (selectedRow.data.name == CP.Interfaces.CONNECTED_INTERFACE)) {
            CP.WebUI4.Msg.show({ //display message
                title: "Caution!"
                ,msg: "You are about to change the settings of an interface you are connected to.<br>Click OK to proceed, Cancel to return."
                ,animEl: 'elId'
                ,icon: 'webui-msg-warning'
                ,buttons: Ext.Msg.OKCANCEL
                ,fn: function( button, text, opt ){
                    if( button == "ok" ) {
                        //open modal window
                        CP.Interfaces.openModalWindow( modalWidth, modalHeight, modalTitle, interfaceForm, formType );
                    }
                }
            });
        } else {
            //open modal window
            CP.Interfaces.openModalWindow( modalWidth, modalHeight, modalTitle, interfaceForm, formType );
        }

        Ext.getCmp("user-interface-dual").RedoComponentLayout();

        switch(formType)
        {
            case CP.Interfaces.FORM_TYPE_ADD_ALIAS:
            case CP.Interfaces.FORM_TYPE_ADD_VLAN:
            case CP.Interfaces.FORM_TYPE_ADD_BOND:
            case CP.Interfaces.FORM_TYPE_ADD_BRIDGE:
            case CP.Interfaces.FORM_TYPE_ADD_PPPOE:
                Ext.getCmp('tab_panel').setActiveTab(2);
                break;
            case CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL:
            case CP.Interfaces.FORM_TYPE_ADD_VPNT:
            case CP.Interfaces.FORM_TYPE_ADD_GRE:
                Ext.getCmp('tab_panel').setActiveTab(0);
                break;
        }
		
        if((formType == CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL ||
			formType == CP.Interfaces.FORM_TYPE_ADD_ALIAS ||
			formType == CP.Interfaces.FORM_TYPE_ADD_AUX) 
			&& Ext.getCmp('if_topology')) {
            Ext.getCmp('if_topology').setDisabled(true);
        }			
		
    } // End of   'buildInterfaceForm'
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ,enableIpv4Fields: function( radio ){
        if( radio.getValue() == false ){
            return;
        }

        var ip = Ext.getCmp( 'v4Addr' );
        var mask = Ext.getCmp( 'v4Mask' );
        if( radio.getId() == 'use_ipv4_static' ){
            ip.enable();
            mask.enable();
        }
        else {
            ip.disable();
            mask.disable();
        }
    }

    ,enableIpv6Fields: function( radio ){
        if( radio.getValue() == false ){
            return;
        }

        var ip = Ext.getCmp( 'v6Addr' );
        var mask = Ext.getCmp( 'v6Mask' );
        if( radio.getId() == 'use_ipv6_static' ){
            ip.enable();
            mask.enable();
        }
        else {
            ip.disable();
            mask.disable();
        }
    }

    ,saveHandler: function( formType ){
        //run validations
        var isValid;
        var c = Ext.getCmp("comment");
        if (CP.Interfaces.FORM_TYPE_DELETE != formType){
            var curr_tab = Ext.getCmp('tab_panel').getActiveTab().title;
            isValid = CP.Interfaces.validateForm( formType, false, curr_tab, true );
        }else{
            isValid = CP.Interfaces.validateForm( formType);
        }
        
        if (isValid == false) {
            return;
        }
        
        if (c && c.validate && !c.validate()) {
            Ext.Msg.alert("Configuration Error", "Invalid comment.");
            return;
        }

        //get params to be posted to server
        CP.Interfaces.setChangedParams( formType );

        //submit form
        var my_obj =  CP.UI.getMyObj();//Ext.getCmp( CP.Interfaces.INTERFACES_FORM_ID ) //CP.UI.getMyObj();
        //m = my_obj.panel

        if(Ext.getCmp('form-ok'))
            Ext.getCmp('form-ok').disable();
        CP.UI.submitData(my_obj);
    }

    //Delete interface
    ,openModalDelete: function(){
        var selectedRow = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ).getSelectionModel().getLastSelected();
        var selectedIntf = selectedRow.data["name"];
        var intf_store = Ext.getStore("interfaces_js_grid_store");
        var if_recs = intf_store.getRange();
        var if_data, i;
        for(i = 0; i < if_recs.length; i++) {
            if_data = if_recs[i].data;
            if (selectedIntf != if_data["name"] && selectedIntf == if_data.depend_on) {
                CP.WebUI4.Msg.show({
                    title: 'Can\'t delete Interface '+ selectedIntf,
                    msg: 'Interface '+ selectedIntf +' has dependencies and can\'t be deleted.',
                    animEl: 'elId',
                    buttons: Ext.Msg.CANCEL,
                    icon: Ext.MessageBox.WARNING,
                    fn: function( btn, text ){
                        return;
                    }
                });
                return;
            }
        }

        var rp_column = Ext.getCmp('routing_protos_col');
        var rp = [];
        if (Ext.typeOf(selectedRow.data.routing_protos) == "array") {
            rp = selectedRow.data.routing_protos;
        }
        var msgText1 = '';
        var msgText2 = 'Are you sure you want to delete the selected interface?';
        var msgIcon = Ext.MessageBox.QUESTION;
        var msgButton = Ext.Msg.OKCANCEL;
        var foundVrrp = 0;

        if (rp.length > 0) {
            if (Ext.Array.indexOf(rp, "VRRP") > -1) {
                foundVrrp += 1;
            }
            if (Ext.Array.indexOf(rp, "VRRP IPv6") > -1) {
                foundVrrp += 2;
            }
            if (rp_column) {
                rp_column.setVisible(true);
            }
            var i = 0;
            var rpStr = "";
            if (rp.length <= 2) {
                rpStr = rp.join(" and ");
            } else {
                for(i = 0; i < (rp.length - 1); i++) {
                    rpStr += String(rp[i]) +", ";
                }
                rpStr += " and "+ rp[rp.length - 1];
            }
            if (foundVrrp) {
                msgIcon = Ext.MessageBox.WARNING;
                msgButton = Ext.Msg.CANCEL;
                switch (foundVrrp) {
                    case 1:
                        msgText2 = 'Remove VRRP manually before trying to delete this interface.';
                        break;
                    case 2:
                        msgText2 = 'Remove VRRP IPv6 manually before trying to delete this interface.';
                        break;
                    default:
                        msgText2 = 'Remove VRRP and VRRP IPv6 manually before trying to delete this interface.';
                }
            }
            var protocolString = (rp.length > 1) ? "Protocols" : "Protocol";
            msgText1 = 'This interface is used by the Dynamic Routing '+ protocolString +':<br>'
                    + rpStr +'<br><br>';
        }

        CP.WebUI4.Msg.show({
            title: 'Delete interface: '+ selectedRow.data.name,
            msg: msgText1 + msgText2,
            animEl: 'elId',
            buttons: msgButton,
            icon: msgIcon,
            fn: function( btn, text ){
                if( btn == "cancel" ){
                    return;
                }
                CP.Interfaces.saveHandler( CP.Interfaces.FORM_TYPE_DELETE );
            }
        });
    }

    ,submitFailure: function() {
        //load conflicting address store
        CP.addr_list.loadStore("");
        if(Ext.getCmp('form-ok'))
            Ext.getCmp('form-ok').enable();
    }

    ,afterSubmit: function(){
        var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID );
        if( !grid ){
            return;
        }
        //grid.store.reload();
        grid.store.load();
        //load conflicting address store
        CP.addr_list.loadStore("");
        //close modal if open
        var modalWin = Ext.getCmp( CP.Interfaces.INTERFACES_MODAL_ID );
        if( modalWin ){
            Ext.getCmp( CP.Interfaces.INTERFACES_MODAL_ID ).close();
        }

        //clear selection
        grid.getSelectionModel().clearSelections();

        //disable buttons
        Ext.getCmp( CP.Interfaces.GRID_EDIT_BTN_ID ).disable();
        Ext.getCmp( CP.Interfaces.GRID_DEL_BTN_ID ).disable();
    }

    //validate MAC addresses: a customized alternative to 'vtype:"mac"'
    ,validateHardwareAddress:function(value) {
            // A hardware address (also known as a MAC address) has the following
                // format:
                //        12 hexadecimal digits, divided into octets (2 digits each)
                //        by ':'.
                // Multicast addresses (beginning with 01:00:5E) not allowed.
                // Based on check_mac_address() in libutypes

            var vs = ''+value; // make absolutely sure it's a string
            var iha = "Invalid hardware address"; // basic error message
            if (vs.match(/^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i) == null) {
                    // invalid; let's tell the user why
                        if (vs === '') {
                           return(iha+": Must not be empty");
                        }
                        if (vs.match(/[^a-fA-F0-9:]/) != null) {
                           return(iha+": Must consist of hexadecimal digits and ':'");
                        }
                        if (vs.match(/^([^:]*:){5}[^:]*$/) == null) { // 5 ':' = 6 octets
                          return(iha+": Must be six octets delimited by ':'");
                        }
                        if (vs.match(/(^|:)([^:]{0,1}|[^:]{3,})(:|$)/) != null) {
                          return(iha+": Each octet must be two hexadecimal digits");
                        }
                        // We don't know why.  This shouldn't happen, but if it does,
                        // just give the user a plain message
                        return(iha);
            }
            if (vs.match(/^01:00:5E/i) != null) {
                    return(iha+": Cannot be multicast (starting with 01:00:5E)");
            }
            // Appears to be a valid hardware address.  Hopefully it's the one the
            // user wanted.
            return(true);
    }

    // Validate IPv4 and IPv6 address and mask
    ,validateFormAddrs: function( formType, selectedRow ){

        function maskIsEmpty(mask){return (mask == "0" || mask == "" || mask == "-" || mask == null);};

        var err_msg = "", ret_msg = [];
        var v4Addr_Cmp = Ext.getCmp("v4Addr");
        var v4Mask_Cmp = Ext.getCmp("v4Mask");
        if (v4Addr_Cmp && v4Mask_Cmp) {
            var v4Addr = v4Addr_Cmp.getValue();
            var v4Mask = v4Mask_Cmp.getValue();

            // Don't accept empty address with non empty mask
            if(!maskIsEmpty(v4Mask) && v4Addr == "") {
                err_msg = "IPv4 address is empty";
                Ext.getCmp("octet1_v4Addr").markInvalid(err_msg);
                ret_msg.push(err_msg);
            } else if (maskIsEmpty(v4Mask) && v4Addr != "") {
                // Don't accept empty mask with non empty address
                err_msg = "IPv4 mask is empty.";
                v4Mask_Cmp.markInvalid(err_msg);
                ret_msg.push(err_msg);
            } else {
                err_msg = CP.addr_list.getMatchMessage(v4Addr);
                if (err_msg != "") {
                    Ext.getCmp("octet1_v4Addr").markInvalid(err_msg);
                    ret_msg.push(err_msg);
                }
            }
        }

        if (!(formType == CP.Interfaces.FORM_TYPE_ADD_ALIAS ||
              (formType == CP.Interfaces.FORM_TYPE_EDIT &&
               (selectedRow.data.type == "alias" || selectedRow.data.type == "loopback")))){
        // Don't accept empty IPv6 address with non empty mask
            var v6Addr_Cmp = Ext.getCmp("v6Addr");
            var v6Mask_Cmp = Ext.getCmp("v6Mask");
            if (v6Addr_Cmp && v6Mask_Cmp) {
                var v6Addr = v6Addr_Cmp.getValue();
                var v6Mask = v6Mask_Cmp.getValue();
                if(v6Addr == "" && v6Mask != "0" && v6Mask != null) {
                    err_msg = "IPv6 address is empty.";
                    v6Addr_Cmp.markInvalid(err_msg);
                    ret_msg.push(err_msg);
                } else if ((v6Mask == "0" || v6Mask == null) && v6Addr != "") {
                    // Don't accept empty IPv6 mask with non empty address
                    err_msg = "IPv6 mask is empty.";
                    v6Mask_Cmp.markInvalid(err_msg);
                    ret_msg.push(err_msg);
                } else {
                    err_msg = CP.addr_list.getMatchMessage(v6Addr);
                    if (err_msg != "") {
                        v6Addr_Cmp.markInvalid(err_msg);
                        ret_msg.push(err_msg);
                    }
                }
            }
        }
        return ret_msg.join("<br>");
    }

    //Validate fields values before sending form
    ,validateForm: function( formType, isTab, tabTitle, isSaveHandler ){

        // Validates weather the minimal amount of information exists
        // in order to add the 'cmp'
        function validateMinimalInformation(cmp, expectedTitle, errMsg){
            var cmpValue = cmp.getValue();

            if(cmpValue == null || cmpValue === ""){ // Obligatory value is missing
                if( isTab == true && tabTitle == expectedTitle ){
                    cmp.setActiveError( errMsg );
                    return false; // so that it doesn't move to another tab
                }else{
                    if (isSaveHandler == true){
                        CP.WebUI4.Msg.show({ //display message
                            title: "Notice"
                            ,msg: errMsg
                            ,animEl: 'elId'
                            ,icon: 'webui-msg-warning'
                            ,buttons: Ext.Msg.OK
                        });
                        return false;
                    }
                }
            }
            return true;
        }

        if( formType == CP.Interfaces.FORM_TYPE_DELETE ){ //No new input from user - nothing to validate
            return true;
        }
        var selectedRow = CP.Interfaces.getSelectedRow(formType);
        var form = Ext.getCmp( CP.Interfaces.INTERFACES_FORM_ID );
        var memberOfCombo = Ext.getCmp( 'depend_on' );
        var vlanField = Ext.getCmp( 'vlabel' );
        var brField = Ext.getCmp( 'brlabel' );
        var myForm = form.getForm();
        var i, c, err_id, err_count = 0;
        var tabpanel = Ext.getCmp('tab_panel');
        var err_str = "The following tabs have invalid configuration: ";
        var addr_err_str = "";

        if(Ext.getCmp('mtu') && isSaveHandler) {
            //validate mtu
            var mtu_value = Ext.getCmp('mtu').getValue();

//            if(CP.Interfaces.IS_IPV6_SUPPORTED)
//            {
//                if(Ext.getCmp('mtu').getRawValue() != "" && mtu_value < 1280) {
//                    if(!confirm("The selected mtu value is below the minimal mtu value of ipv6," +
//                                    "Are you sure that you want to change the mtu value")) {
//                        return false;
//                    }
//                }
//            }
        }
        
        addr_err_str = CP.Interfaces.validateFormAddrs(formType,selectedRow); // Validate IPv4 and IPv6 address and mask
        if ( addr_err_str != "" )  {
            Ext.Msg.alert("Address Configuration Error", addr_err_str);
            return false;
        }
        
        for (i = 0; i < tabpanel.items.items.length; i++) {
            c = Ext.getCmp(tabpanel.items.items[i].id);
            err_id = "";
            if (c && c.checkMyChildren) {
                err_id = c.checkMyChildren();
            } else if (!myForm.isValid()) {
                // We didn't find a validation function for one of our tabs but found invalid configuration,
                // give a generic error string instead of letting it go through
                err_str = "One or more tabs is invalid.";
                err_count = 1;
                break;
            } else {
                err_count = 0;
                break;
            }
            if (err_id == CP.Interfaces.CHECK_CHILDREN_BAD_VALUE) {
                // We didn't get a valid output from checkMyChildren, perform standard check
                if (!myForm.isValid()) {
                    err_str = "One or more tabs is invalid.";
                    err_count = 1;
                    break;
                } else {
                    err_count = 0;
                    break;
                }
            }
            if (err_id != "") {
                err_count++;
                if (err_count == 1) {
                    err_str += Ext.getCmp(err_id).title;
                } else {
                    err_str += ", " + Ext.getCmp(err_id).title;
                }
            }
        }
        
        if (err_count > 0) {
            Ext.Msg.alert("Configuration Error", err_str);
            return false;
        }

        //add bond
        if( formType == CP.Interfaces.FORM_TYPE_ADD_BOND ){
            return validateMinimalInformation(Ext.getCmp( 'bolabel' ), 'Bond', "A bond must have a bond group number");
        }

        //add bridge
        if( formType == CP.Interfaces.FORM_TYPE_ADD_BRIDGE ){
            // validate bridge group number was filled.
            if (!validateMinimalInformation(Ext.getCmp( 'brlabel' ), 'Bridge', "A bridge must have a bridge group number")) {
                return false;
            }
        }        
        
        if( formType == CP.Interfaces.FORM_TYPE_ADD_BRIDGE ||
            (formType == CP.Interfaces.FORM_TYPE_EDIT && brField) ) {
            // validate fail-open interfaces, if required         
            var isFailOpenBridge = Ext.getCmp( 'fail_open_checkbox' ) ?  (Ext.getCmp( 'fail_open_checkbox' )).getValue() : false;
            if (isFailOpenBridge) {
                return validateMinimalInformation(Ext.getCmp('selected-fonic-pair'), 'Fail Open', "A fail open bridge must contain a pair of fail open interfaces.");
            }
                        
            return true;
        }

        //add alias or vlan
        if( formType == CP.Interfaces.FORM_TYPE_ADD_ALIAS ){
            return validateMinimalInformation(memberOfCombo, 'Alias', "An alias must be a member of an interface");
        }
        if( formType == CP.Interfaces.FORM_TYPE_ADD_VLAN ){
            return (validateMinimalInformation(vlanField, 'VLAN', "A VLAN must have a VLAN group number") &&
                    validateMinimalInformation(memberOfCombo, 'VLAN', "A VLAN must be a member of an interface") );
        }

        //edit vlan
        if( formType == CP.Interfaces.EDIT && vlanField && vlanField.getValue() == null ){
            return false;
        }

        if( formType == CP.Interfaces.FORM_TYPE_ADD_PPPOE )
        {
            var PPPoE_Id = Ext.getCmp('pppoeid');
            var PPPoE_IF = Ext.getCmp('pppoe_dev');
            var PPPoE_User = Ext.getCmp('pppoe_user');
            var PPPoE_Pass = Ext.getCmp('pppoe_pass');

            return validateMinimalInformation(PPPoE_Id, 'PPPoE', "A PPPoE client must have an ID") &&
                   validateMinimalInformation(PPPoE_IF, 'PPPoE', "A PPPoE client must have an Interface") &&
                   validateMinimalInformation(PPPoE_User, 'PPPoE', "A PPPoE client must have a user name") &&
                   validateMinimalInformation(PPPoE_Pass, 'PPPoE', "A PPPoE client must have a password");
        }

	if( formType == CP.Interfaces.FORM_TYPE_ADD_GRE )
        {
		var GRE_Id = Ext.getCmp('gre_id');
		var GRE_TTL = Ext.getCmp('gre_ttl');
		var GRE_Remote = Ext.getCmp('gre_remote_ip_addr');
		var GRE_Local = Ext.getCmp('gre_local_ip_addr');
		var GRE_Peer = Ext.getCmp('gre_peer_ip_addr');
		var v4Addr_Cmp = Ext.getCmp("v4Addr");
		var v4Mask_Cmp = Ext.getCmp("v4Mask");

		// Default TTL value is 255, if value is not found -> copy from "emptyText : 255"
		var ttlValue = GRE_TTL.getValue();
		if(ttlValue == null || ttlValue === ""){
			GRE_TTL.setValue(GRE_TTL.emptyText);
		}

           return validateMinimalInformation(v4Addr_Cmp, 'GRE', "A GRE Tunnel must have an IP") &&
		   validateMinimalInformation(v4Mask_Cmp, 'GRE', "A GRE Tunnel must have a Mask") &&
		   validateMinimalInformation(GRE_Id, 'GRE', "A GRE Tunnel must have an ID") &&
		   validateMinimalInformation(GRE_TTL, 'GRE', "A GRE Tunnel must have a TTL Value") &&
           validateMinimalInformation(GRE_Remote, 'GRE', "A GRE Tunnel must have a remote IP address") &&
		   validateMinimalInformation(GRE_Local, 'GRE', "A GRE Tunnel must have a local IP address") &&
		   validateMinimalInformation(GRE_Peer, 'GRE', "A GRE Tunnel must have a peer IP address");
        }
	
        if( formType == CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL )
        {
            var Tunnel_Id = Ext.getCmp('tunnel_id');
            var Tunnel_Dev = Ext.getCmp('tunnel_dev');
            var Tunnel_TTL = Ext.getCmp('tunnel_ttl');
            var Tunnel_Remote = Ext.getCmp('tunnel_remote_ip_addr');

            return validateMinimalInformation(Tunnel_Id, '6in4', "A 6in4 Tunnel must have an ID") &&
                   validateMinimalInformation(Tunnel_Dev, '6in4', "A 6in4 Tunnel must have an Interface") &&
                   validateMinimalInformation(Tunnel_TTL, '6in4', "A 6in4 Tunnel must have a TTL Value") &&
                   validateMinimalInformation(Tunnel_Remote, '6in4', "A 6in4 Tunnel must have a remote IP address");
        }

		if( formType == CP.Interfaces.FORM_TYPE_ADD_VPNT )
		{
			var Vpnt_Id = Ext.getCmp('vpntid');
			return validateMinimalInformation(Vpnt_Id, 'vpnt', "A VPN Tunnel must have an ID");
		}

        return true;
    }

    //Get field name from the 'binding_' field in store which was sent in the get request when page loaded
    ,addFieldToParams: function( fieldId, params, interfaceRecord, newIntfcName, value ){
        var fieldName = interfaceRecord.get( 'binding_'+ fieldId );
        var fieldValue = '';
        var form = Ext.getCmp( CP.Interfaces.INTERFACES_FORM_ID );
        if( newIntfcName ){
            var baseIntfcName = interfaceRecord.data.name;
            fieldName = fieldName.replace( baseIntfcName, newIntfcName );
            fieldValue = value;
        }
        else if( form ){
            var field = Ext.getCmp( fieldId );
            fieldValue = ( !field ) ? fieldValue : field.getValue();
        }
        params[ fieldName ] = fieldValue;
    }

    ,load_vpnt_params : function (new_vpnt,params,commentValue)
    {
        var vpnt_id = Ext.getCmp('vpntid').getValue();
        var vpnt_peer_str = Ext.getCmp('vpnt_peer').getValue();
        var is_numbered_vpnt = Ext.getCmp('vpnt_type_numbered').getValue();
        var vpnt_local_addr = Ext.getCmp('vpnt_local_ip_addr').getValue();
        var vpnt_remote_addr = Ext.getCmp('vpnt_remote_ip_addr').getValue();
        var vpnt_dev = Ext.getCmp('vpnt_dev').getValue();
        var vpnt_name = "vpnt" + vpnt_id;

        if(new_vpnt) {
            params ["newVpnt"] = vpnt_id;
        }
        params[ "vti:vpnt:" + vpnt_id  ] = "t";

        if(is_numbered_vpnt){
            params["vti:vpnt:" + vpnt_id + ":type"] = "numbered";
            params["vti:vpnt:" + vpnt_id + ":local"] = vpnt_local_addr;
            params["vti:vpnt:" + vpnt_id + ":peer"] = vpnt_peer_str;
            params["vti:vpnt:" + vpnt_id + ":remote"] = vpnt_remote_addr;
        } else {
            params["vti:vpnt:" + vpnt_id + ":type"] = "unnumbered";
            params["vti:vpnt:" + vpnt_id + ":dev"] = vpnt_dev;
            params["vti:vpnt:" + vpnt_id + ":peer"] = vpnt_peer_str;
        }

        params[ "interface:" + vpnt_name] = "t";
        if(Ext.getCmp("state").getValue())
            params[ "interface:" + vpnt_name + ":state" ] = "on";
        else
            params[ "interface:" + vpnt_name + ":state" ] = "off";
        params[ "interface:" + vpnt_name + ":vpntid" ] = vpnt_id;
        params[ "interface:" + vpnt_name + ":comments" ] = commentValue;
        if (Ext.getCmp('if_topology')){
            var interface_topology =  Ext.getCmp('if_topology').getValue();
            params[ "interface:"+ vpnt_name +":topology" ] = interface_topology;
        }				
    }

    ,load_pppoe_params : function (new_pppoe,params,commentValue)
    {
        var pppoe_id = Ext.getCmp('pppoeid').getValue();
        var pppoe_user = Ext.getCmp('pppoe_user').getValue();
        var pppoe_pass = Ext.getCmp('pppoe_pass').getValue();
        var pppoe_dev = Ext.getCmp('pppoe_dev').getValue();
        var pppoe_peerdns = Ext.getCmp('pppoe_peerdns').getValue();
        var pppoe_peer_defaultgw = Ext.getCmp('pppoe_peer_defaultgw').getValue();
        var pppoe_name = "pppoe" + pppoe_id;

        if(new_pppoe) {
            params ["newPPPoE"] = pppoe_id;
            params[ "pppoe:" + pppoe_id  ] = "t";
        }

        params[ "pppoe:" + pppoe_id  ] = "t";
        params[ "pppoe:" + pppoe_id + ":interface"] = pppoe_dev;
        params[ "pppoe:" + pppoe_id + ":username"] = pppoe_user;
        params[ "pppoe:" + pppoe_id + ":password"] = pppoe_pass;
        params[ "pppoe:" + pppoe_id + ":usepeerdns"] = (pppoe_peerdns ? "1" : "0");
        params[ "pppoe:" + pppoe_id + ":defaultroute"] = (pppoe_peer_defaultgw ? "1" : "0");

        params[ "interface:" + pppoe_name] = "t";

        if(Ext.getCmp("state").getValue()) {
            params[ "interface:" + pppoe_name + ":state" ] = "on";
            params[ "pppoe:" + pppoe_id + ":state"] = "on";
        }
        else {
            params[ "interface:" + pppoe_name + ":state" ] = "off";
            params[ "pppoe:" + pppoe_id + ":state"] = "off";
        }

        params[ "interface:" + pppoe_name + ":pppoeid" ] = pppoe_id;
        params[ "interface:" + pppoe_name + ":comments" ] = commentValue;
        if (Ext.getCmp('if_topology')){
            var interface_topology =  Ext.getCmp('if_topology').getValue();
            params[ "interface:"+ pppoe_name +":topology" ] = interface_topology;
        }				
    }

    ,load_6in4_params : function (new_6in4,params,commentValue)
    {
        var tunnel_id = Ext.getCmp('tunnel_id').getValue();
        var tunnel_dev = Ext.getCmp('tunnel_dev').getValue();
        var tunnel_ttl = Ext.getCmp('tunnel_ttl').getValue();
        var tunnel_remote = Ext.getCmp('tunnel_remote_ip_addr').getValue();
        var tunnel_name = "sit_6in4_" + tunnel_id;

        if(new_6in4) {
            params ["new6in4"] = tunnel_id;
        }
        params[ "interface:" + tunnel_name] = "t";
        if(Ext.getCmp("state").getValue()) {
            params[ "interface:" + tunnel_name + ":state" ] = "on";
        } else {
            params[ "interface:" + tunnel_name + ":state" ] = "off";
        }
        params[ "interface:" + tunnel_name + ":comments" ] = commentValue;
        params[ "interface:" + tunnel_name + ":dev" ] = tunnel_dev;
        params[ "interface:" + tunnel_name + ":remote" ] = tunnel_remote;
        params[ "interface:" + tunnel_name + ":ttl" ] = tunnel_ttl;
        params[ "interface:" + tunnel_name + ":mtu" ] = "1480";
    }

    ,load_gre_params : function (new_gre,params,commentValue)
    {
        var gre_id = Ext.getCmp('gre_id').getValue();
        var gre_ttl = Ext.getCmp('gre_ttl').getValue();
        var gre_remote = Ext.getCmp('gre_remote_ip_addr').getValue();
		var gre_local = Ext.getCmp('gre_local_ip_addr').getValue();
		var gre_peer = Ext.getCmp('gre_peer_ip_addr').getValue();
        var v4AddrValue = ( Ext.getCmp( 'v4Addr' ) ) ? Ext.getCmp( 'v4Addr' ).getValue() : '';
        var v4MaskValue = ( Ext.getCmp( 'v4Mask' ) ) ? Ext.getCmp( 'v4Mask' ).getValue() : '';
        var gre_name = "gre" + gre_id;
	
        if(new_gre) {
            params ["newGre"] = gre_id;
            params[ "gre:" + gre_id  ] = "t";
        }
		else {
			params[ "gre:" + gre_id  ] = "t";
		}
		
		params[ "gre:" + gre_id + ":ttl" ] = gre_ttl;
        params[ "gre:" + gre_id + ":local" ] = gre_local;
        params[ "gre:" + gre_id + ":remote" ] = gre_remote;
		params[ "interface:" + gre_name + ":comments" ] = commentValue;
	
		params[ "interface:" + gre_name] = "t";
		if(Ext.getCmp("state").getValue())
            params[ "interface:" + gre_name + ":state" ] = "on";
        else
            params[ "interface:" + gre_name + ":state" ] = "off";
        if (v4AddrValue != ''){
            var ipaddrFieldName = "interface:"+ gre_name +":ipaddr:"+ v4AddrValue;
            params[ ipaddrFieldName ] = "t";
            if (v4MaskValue != ''){
	        params[ ipaddrFieldName +":mask" ] = v4MaskValue; }
			if (gre_peer != ''){
	        params[ "interface:" + gre_name + ":remote" ] = gre_peer; }
        }
    }

    ,getFieldData: function( interfaceRecord, fieldId ){
        var fieldValue = '';
        var field = Ext.getCmp( fieldId );
        if( field ){
            return field.getValue();
        }
        else if( interfaceRecord ){
            return interfaceRecord.data[fieldId];
        }
        else{
            return fieldValue;
        }
    }

    // Get interface name
    ,getInterfaceNameByFormType: function( formType, selectedRow ){
        switch ( formType ) {
            case CP.Interfaces.FORM_TYPE_EDIT:
                return selectedRow.data.name;
            case CP.Interfaces.FORM_TYPE_ADD_VLAN:
                var memberOfValue = this.getFieldData( null, 'depend_on' );
                var vlanIdValue = this.getFieldData( selectedRow, 'vlabel' );
                return memberOfValue +"."+ vlanIdValue;
            case CP.Interfaces.FORM_TYPE_ADD_BRIDGE:
                var blanIdValue = ( Ext.getCmp( 'brlabel' ) ) ? Ext.getCmp( 'brlabel' ).getValue() : '';
                return "br" + blanIdValue;
            case CP.Interfaces.FORM_TYPE_ADD_BOND:
                var blanIdValue = ( Ext.getCmp( 'bolabel' ) ) ? Ext.getCmp( 'bolabel' ).getValue() : '';
                return "bond" + blanIdValue;
            case CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL:
                var tnl_id = ( Ext.getCmp( 'tunnel_id' ) ) ? Ext.getCmp( 'tunnel_id' ).getValue() : '';
                return "sit_6in4_" + tnl_id;
	    case CP.Interfaces.FORM_TYPE_ADD_GRE:
                var gre_id = ( Ext.getCmp( 'gre_id' ) ) ? Ext.getCmp( 'gre_id' ).getValue() : '';
                return "gre" + gre_id;
            // todo: implement rest of types if needed
        }
        return '';
    }

    // Update params array with IPv6 data,
    // to be sent with the request to server
    ,setIPv6ChangedParams: function( formType, params, selectedRow ){

        var v6AddrValue = this.getFieldData( selectedRow, 'v6Addr' );
        var v6MaskValue = this.getFieldData( selectedRow, 'v6Mask' );
        var v6AutoValue = this.getFieldData( selectedRow, 'obtain_ipv6_autoconfig' );
        var intrfcName = CP.Interfaces.getInterfaceNameByFormType(formType,selectedRow);

        var autoconfig = "off";
        if( v6AutoValue == true ) {
            autoconfig = "on";
            v6AddrValue = '';
            v6MaskValue = '';
        }

        switch ( formType ) {
            case CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL:
            case CP.Interfaces.FORM_TYPE_ADD_VLAN:
            case CP.Interfaces.FORM_TYPE_ADD_BRIDGE:
            case CP.Interfaces.FORM_TYPE_ADD_BOND:
                if ( autoconfig == "on" )
                    params[ "interface:" + intrfcName + ":ipv6_autoconfig" ] = autoconfig;
                if (v6AddrValue != '' && v6MaskValue != '') {
                    // Note: we do not prepare 'perfect' bindings here
                    // because the address has to be expanded on the server side
                    params[ "interface:" + intrfcName + ":ip6addr" ] = v6AddrValue + "/" + v6MaskValue;
                }
                break;
            case CP.Interfaces.FORM_TYPE_EDIT:
                var supportedTypes = new RegExp(selectedRow.data.type);
                if (supportedTypes.test("ethernet,vlan,bridge,bond,aux,6in4")) {
                    var oldAutoConfig = (selectedRow.data.v6autoconfig == "") ? "off" : selectedRow.data.v6autoconfig;
                    /* In two cases the binding "interface:$intrfcName:ipv6_autoconfig" should not be sent to the server:
                     *   - when previous state of interface was off and ipv6 autoconfig was not changed
                     *   - when interface is being disabled
                     *   - when ipv6 autoconfig was not changed
                     */
                    if (!((selectedRow.data.state == "off") && (oldAutoConfig == autoconfig)) &&
                        !((selectedRow.data.state == "on") && (params["interface:" + intrfcName + ":state"] == "off")) &&
                        oldAutoConfig != autoconfig){
                            params[ "interface:" + intrfcName + ":ipv6_autoconfig" ] = autoconfig;
                    }
                    params[ "interface:" + intrfcName + ":newV6Addr" ] = v6AddrValue;
                    params[ "interface:" + intrfcName + ":newV6Mask" ] = v6MaskValue;
                }
                break;
            case CP.Interfaces.FORM_TYPE_ADD_ALIAS:
            case CP.Interfaces.FORM_TYPE_DELETE:
                // Do nothing
                break;
        }
    }

    // Get selected row
    ,getSelectedRow: function( formType ){
        var memberOfValue = this.getFieldData( null, 'depend_on' ); //get selected interface name from combobox
        var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ); //interfaces main grid
        var selectedRow = null;

        //on edit or delete - get selected row from main grid by user selection
        if( formType == CP.Interfaces.FORM_TYPE_EDIT ||
            formType == CP.Interfaces.FORM_TYPE_DELETE ){
            selectedRow = grid.getSelectionModel().getLastSelected();
        }
        else{ //add - get selected row from store according to the selected interface name
            var store = grid.store;
            var recordNum = store.findExact( 'name', memberOfValue );
            selectedRow = store.getAt( recordNum );
        }
        return selectedRow;
    }

    //run validation and update params array,
    //to be sent with the request to server
    ,setChangedParams: function( formType ){
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
        var params = pageObj.params;
        //init arrays
        var changed_intfs = [];
        var new_vlans = [];
        var delete_vlans = [];
        var delete_alias = [];
        var delete_loopbacks = [];
        var delete_bridges = [];
        var delete_bonds = [];
	var delete_gres = [];
        var delete_vpnts = [];
        var delete_pppoes = [];
        var delete_tunnels = [];

        //get selected row
        var memberOfValue = this.getFieldData( null, 'depend_on' ); //get selected interface name from combobox
        var selectedRow = CP.Interfaces.getSelectedRow(formType);
        // if (!selectedRow) return;	// if row is undefined (doesn't exist due to an empty form) do nothing.

        //add or edit of all interfaces except bridge or bond
        if( formType != CP.Interfaces.FORM_TYPE_ADD_BRIDGE && formType != CP.Interfaces.FORM_TYPE_ADD_BOND ){
            var v4AddrValue = this.getFieldData( selectedRow, 'v4Addr' );
            var v4MaskValue = this.getFieldData( selectedRow, 'v4Mask' );
            var vlanIdValue = this.getFieldData( selectedRow, 'vlabel' );
            //get state
            var adp_modeValue = this.getFieldData( selectedRow, 'adp_mode' );
            var state = this.getFieldData( selectedRow, 'state' );
            var stateValue = ( state == true ) ? 'on' : 'off';

            if(Ext.getCmp('auto_negotiation') && Ext.getCmp('auto_negotiation').getValue() == true)
                var linkSpeedValue = this.getFieldData(selectedRow, 'link-speed-text');
            else
                var linkSpeedValue = this.getFieldData(selectedRow, 'link-speed-combo');

            var hwaddrValue = this.getFieldData( selectedRow, 'hwaddr' );
            var mtuValue = this.getFieldData( selectedRow, 'mtu' );
            var mtu_maxValue = 16000;

            if (adp_modeValue) {
                mtu_maxValue = CP.Interfaces.ADP_MTU_MAXVALUE;
            }
            if (mtuValue != "") {
                mtuValue = Ext.Number.constrain(mtuValue, 68, mtu_maxValue);
            }

            var autoNegValue = this.getFieldData( selectedRow, 'auto_negotiation' );
            autoNegValue = ( autoNegValue == true ) ? 'on' : 'off';
            var monitorModeValue = this.getFieldData( selectedRow, 'monitor_mode' );
            monitorModeValue = ( monitorModeValue == true ) ? 'on' : 'off';
            var oldDhcpcValue = this.getFieldData( selectedRow, 'dhcpc' );
        }

        if(Ext.getCmp('obtain_ipv4_dhcp'))
            var dhcpcValue = Ext.getCmp('obtain_ipv4_dhcp').getValue();
		
        var commentValue = this.getFieldData( selectedRow, 'comment' );

        //set params with values according to form type
        switch ( formType ){

            //New VPN Tunnel
            case CP.Interfaces.FORM_TYPE_ADD_VPNT:
                this.load_vpnt_params(true,params,commentValue);
            break;
            //New PPPoE
            case CP.Interfaces.FORM_TYPE_ADD_PPPOE:
                this.load_pppoe_params(true,params,commentValue);
            break;
            //New 6in4
            case CP.Interfaces.FORM_TYPE_ADD_6IN4_TUNNEL:
                this.load_6in4_params(true,params,commentValue);
            break;
			//New GRE
            case CP.Interfaces.FORM_TYPE_ADD_GRE:
                this.load_gre_params(true,params,commentValue);
            break;
            //New Aux (Loopback)
            case CP.Interfaces.FORM_TYPE_ADD_AUX:
                params[ "interface:newloopback" ] = v4AddrValue + "/" + v4MaskValue;
                var v6AddrValue = this.getFieldData( null, 'v6Addr' );
                var v6MaskValue = this.getFieldData( null, 'v6Mask' );
                if ( v6AddrValue != '' && v6MaskValue != '')
                    params[ "interface:newloopback:ipv6" ] = v6AddrValue + "/" + v6MaskValue;
                if (commentValue != '')
                    params[ "interface:newloopback:comments" ] = commentValue;

                if( Ext.getCmp("state"))
                    if(Ext.getCmp("state").getValue())
                        params[ "interface:newloopback:state" ] = "on";
                    else
                        params[ "interface:newloopback:state" ] = "off";
            break;

            //New Alias
            case CP.Interfaces.FORM_TYPE_ADD_ALIAS:
                if( memberOfValue == "lo" ){
                    params[ "interface:newloalias:"+ v4AddrValue ] = v4AddrValue + "/" + v4MaskValue;
                }
                else{
                    var newIntfcFieldName = "interface:" + memberOfValue + ":alias:"+ v4AddrValue;
                    params[ newIntfcFieldName ] = "t";
                    params[ newIntfcFieldName +":mask" ] = v4MaskValue;
                }
            break;

            //New vlan
            case CP.Interfaces.FORM_TYPE_ADD_VLAN:
                var vlanName = memberOfValue +"."+ vlanIdValue;
                var ipaddrFieldName = "interface:"+ vlanName +":ipaddr:"+ v4AddrValue;
				
		//The 'if' is for add vlan to interface isn't found in the same page, the 'else' is the original vlan addition (the interface found in the current page).
                if(!selectedRow)
                {
		    //I added manually the same values in the order of the parameters (5 parameters) as the original code to the 'params' array.
                    var fieldName = 'interface:' + vlanName;
                    params [ fieldName] = "t";
                    var depand = fieldName + ':depend_on';
		    params [ depand ] =  memberOfValue;
		    var lbl = fieldName + ':label';
		    params [ lbl ] = vlanIdValue;
		    var sts = fieldName + ':state';
		    params [ sts ] = stateValue;
		    var comm = fieldName + ':comments';
		    params [ comm ] = commentValue;
                }
                else
                {			
		    this.addFieldToParams( 'name', params, selectedRow, vlanName, 't' );
		    this.addFieldToParams( 'depend_on', params, selectedRow, vlanName, memberOfValue );
		    this.addFieldToParams( 'vlabel', params, selectedRow, vlanName, vlanIdValue );
		    this.addFieldToParams( 'state', params, selectedRow, vlanName, stateValue );
		    this.addFieldToParams( 'comment', params, selectedRow, vlanName, commentValue );
		}
				
                if (Ext.getCmp('if_topology')){
                    var interface_topology =  Ext.getCmp('if_topology').getValue();
                    params[ "interface:"+ vlanName +":topology" ] = interface_topology;
                }						
                if ( v4AddrValue != '' ) {
                    params[ ipaddrFieldName ] = "t";
                    params[ ipaddrFieldName +":mask" ] = v4MaskValue;
                }
                new_vlans.push( vlanName );

                if (dhcpcValue == true)
                    params[ "dhcp:dhcpc:interface:" + vlanName ] = "t";
            break;

            //New Bridge
            case CP.Interfaces.FORM_TYPE_ADD_BRIDGE:
                var blanIdValue = ( Ext.getCmp( 'brlabel' ) ) ? Ext.getCmp( 'brlabel' ).getValue() : '';
                var mover_arrays = Ext.getCmp('user-interface-dual').rightListStore.collect('intf');
                var v4AddrValue = ( Ext.getCmp( 'v4Addr' ) ) ? Ext.getCmp( 'v4Addr' ).getValue() : '';
                var v4MaskValue = ( Ext.getCmp( 'v4Mask' ) ) ? Ext.getCmp( 'v4Mask' ).getValue() : '';

                var bridgeName = "br" + blanIdValue;
                params ["newBridges"] = blanIdValue;
                params[ "bridging:group:" + blanIdValue ] = "t";
                params[ "interface:" + bridgeName ] = "t";
                params[ "interface:" + bridgeName + ":bridgeid" ] = blanIdValue;
                params[ "interface:" + bridgeName + ":state" ] = "on";
                params[ "interface:" + bridgeName + ":comments" ] = commentValue;

                if (Ext.getCmp('if_topology')){
                    var interface_topology =  Ext.getCmp('if_topology').getValue();
                    params[ "interface:"+ bridgeName +":topology" ] = interface_topology;
                }							
				
                if (v4AddrValue != ''){
                    var ipaddrFieldName = "interface:"+ bridgeName +":ipaddr:"+ v4AddrValue;
                    params[ ipaddrFieldName ] = "t";
                    if (v4MaskValue != '') { params[ ipaddrFieldName +":mask" ] = v4MaskValue; }
                }

                // Fail Open tab data
                var fail_open_enabled = ( Ext.getCmp( 'fail_open_checkbox' ) ) ? Ext.getCmp( 'fail_open_checkbox' ).getValue() : '' ;
                if (fail_open_enabled == true) {
                    params[ "bridging:group:" + blanIdValue + ":fail-open"] = "t";
                        
                    var selectedPair = Ext.getCmp( 'selected-fonic-pair' ).getValue();
                    var intfs = selectedPair.split('/');
                    params[ "bridging:group:" + blanIdValue + ":port:" + intfs[0] ] = "t";
                    params[ "bridging:group:" + blanIdValue + ":port:" + intfs[1] ] = "t";  
                } 
                else {
                    // regular bridge - load selected interfaces 
                for (var i=0; i<mover_arrays.length; ++i) {
                          params[ "bridging:group:" + blanIdValue + ":port:" + mover_arrays[i] ] = "t";
                          //params[ "interface:" + mover_arrays[i] + ":depend_on" ] = bridgeName; //update to member of
                }
                }

                if (dhcpcValue == true)
                    params[ "dhcp:dhcpc:interface:" + bridgeName ] = "t";
            break;

            // New Bond
            case CP.Interfaces.FORM_TYPE_ADD_BOND:
                var mtuValue = this.getFieldData( selectedRow, 'mtu' );
                var blanIdValue = ( Ext.getCmp( 'bolabel' ) ) ? Ext.getCmp( 'bolabel' ).getValue() : '';
                var mover_arrays = Ext.getCmp('user-interface-dual').rightListStore.collect('intf'); //getStore('right').collect('intf');
                var v4AddrValue = ( Ext.getCmp( 'v4Addr' ) ) ? Ext.getCmp( 'v4Addr' ).getValue() : '';
                var v4MaskValue = ( Ext.getCmp( 'v4Mask' ) ) ? Ext.getCmp( 'v4Mask' ).getValue() : '';

                var bondName = "bond" + blanIdValue;
                params ["newBonds"] = blanIdValue;
                params[ "bonding:group:" + blanIdValue ] = "t";
                params[ "interface:" + bondName ] = "t";
                params[ "interface:" + bondName + ":bondid" ] = blanIdValue;
                params[ "interface:" + bondName + ":state" ] = "on";
                params[ "interface:" + bondName + ":comments" ] = commentValue;

                if (Ext.getCmp('if_topology')){
                    var interface_topology =  Ext.getCmp('if_topology').getValue();
                    params[ "interface:"+ bondName +":topology" ] = interface_topology;
                }				
				
                if (v4AddrValue != ''){
                    var ipaddrFieldName = "interface:"+ bondName +":ipaddr:"+ v4AddrValue;
                    params[ ipaddrFieldName ] = "t";
                    if (v4MaskValue != ''){
                        params[ ipaddrFieldName +":mask" ] = v4MaskValue;
                    }
                }
                for (var i=0; i<mover_arrays.length; ++i) {
                    params[ "bonding:group:" + blanIdValue + ":port:" + mover_arrays[i] ] = "t";
                    //params[ "interface:" + mover_arrays[i] + ":depend_on" ] = bondName; // update to member of
                }
                var t = Ext.getCmp('bond_mode');
                params[ "bonding:group:" + blanIdValue + ":mode" ] = Ext.getCmp('bond_mode').curr_mode;
                params[ "bonding:group:" + blanIdValue + ":up_delay" ] = Ext.getCmp('up_delay').getValue();
                params[ "bonding:group:" + blanIdValue + ":down_delay" ] = Ext.getCmp('down_delay').getValue();
                params[ "interface:" + bondName + ":combo:new_mtu:mtu" ] = mtuValue;
                if (Ext.getCmp('mii_mon').disabled==false)
                    {params[ "bonding:group:" + blanIdValue + ":mii_interval" ] = Ext.getCmp('mii_mon').getValue();}
                //if (Ext.getCmp('arp_poll_interval').disabled==false)
                //    {params[ "bonding:group:" + blanIdValue + ":arp_p_interval" ] = Ext.getCmp('arp_poll_interval').getValue();}
                if (Ext.getCmp('lacp_rate').disabled==false){
                    var lacpVal = Ext.getCmp('lacp_rate').getValue();
                    params[ "bonding:group:" + blanIdValue + ":lacp_rate" ] = lacpVal.lacp_rate;
                }
                if (Ext.getCmp('xmit_hash_policy').disabled==false){
                    var xmitVal =  Ext.getCmp('xmit_hash_policy').getValue();
                    params[ "bonding:group:" + blanIdValue + ":xmit_hash_policy" ] = xmitVal.xmit_hash_policy;
                }
                if (Ext.getCmp('primary_interface').disabled==false)
                    {params[ "bonding:group:" + blanIdValue + ":primary" ] = Ext.getCmp('primary_interface').getValue();}

                if (dhcpcValue == true)
                    params[ "dhcp:dhcpc:interface:" + bondName ] = "t";
            break;

            //Edit
            case CP.Interfaces.FORM_TYPE_EDIT:
                var intrfcName = selectedRow.data.name;
                changed_intfs.push( intrfcName );
                this.addFieldToParams( 'comment', params, selectedRow, intrfcName, commentValue );
                if (Ext.getCmp('if_topology')){
                    var interface_topology =  Ext.getCmp('if_topology').getValue();
                    params[ "interface:"+ intrfcName +":topology" ] = interface_topology;
                }				
                if( selectedRow.data.type == "aux" ){
                    params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                    params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
                else if( selectedRow.data.type == "alias" ){
                    //=off
                    params[ "interface:"+ intrfcName +":combo:new_mtu:mtu" ] = mtuValue;
                }
                else if (selectedRow.data.type == "6in4" ){
					this.load_6in4_params(false,params,commentValue);
					this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
				}
                else if (selectedRow.data.type == "pppoe" ){
                    this.load_pppoe_params(false,params,commentValue);
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
                else if (selectedRow.data.type == "vpnt" ){
                    this.load_vpnt_params(false,params,commentValue);
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
		else if (selectedRow.data.type == "gre" ){
                    //this.load_gre_params(false,params,commentValue);
                    params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                    params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
					params[ "interface:"+ intrfcName +":combo:new_mtu:mtu" ] = mtuValue;
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
                else if( selectedRow.data.type == "vlan" ){
                    if (dhcpcValue == true && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {}
                    else if (dhcpcValue == true) {
                        params[ "dhcp:dhcpc:interface:"+intrfcName ] = "t";
                    } else {
                        if (dhcpcValue == false && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {
                            params[ "dhcp:dhcpc:interface:"+intrfcName ] = "";
                        }
                        params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                        params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
                    }
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
                else if( selectedRow.data.type == "bridge" ){
                    var blanIdValue = ( Ext.getCmp( 'brlabel' ) ) ? Ext.getCmp( 'brlabel' ).getValue() : '';
                    var mover_arrays = Ext.getCmp('user-interface-dual').rightListStore.collect('intf');
                    var prev_array = selectedRow.data.gr_ports;
                    for (var i=0; i<prev_array.length; i++)
                    {
                        var pos = prev_array[i].indexOf('.'); //if vlan
                        if (pos == -1)
                            pos = prev_array[i].indexOf(':'); //if alias
                        if (pos != -1)
                            var depend_orig =  prev_array[i].substr(0,pos);
                        else
                            var depend_orig =  prev_array[i];
                        params[ "bridging:group:" + blanIdValue + ":port:" + prev_array[i] ] = "";
                        //params[ "interface:" + prev_array[i] + ":depend_on" ] = depend_orig;
                    }

                    if ( Ext.getCmp( 'fail_open_checkbox' ) && ((Ext.getCmp( 'fail_open_checkbox')).getValue()) ) {
                        // if it's a fail open bridge, then ignore the interface selection in the dual list - 
                        // the selected interfaces will be according to the selected fonic pair.
                        params["bridging:group:" + blanIdValue + ":fail-open"] = "t";
                        var selectedPair = Ext.getCmp( 'selected-fonic-pair' ).getValue();
                        var intfs = selectedPair.split('/');
                        params[ "bridging:group:" + blanIdValue + ":port:" + intfs[0] ] = "t";
                        params[ "bridging:group:" + blanIdValue + ":port:" + intfs[1] ] = "t";
                        // Also make sure the dual list of the bridge interfaces will reflect this selection:
                        Ext.getCmp('user-interface-dual').rightListStore.removeAll();
                        Ext.getCmp('user-interface-dual').rightListStore.loadData(intfs);
                    }
                    else {
                        // it's a regular bridge.
                        params["bridging:group:" + blanIdValue + ":fail-open"] = "";
                        
                        for (var i=0; i<mover_arrays.length; i++)
                        {
                        	if (params[ "bridging:group:" + blanIdValue + ":port:" + mover_arrays[i] ])
                        	{
                        		delete params[ "bridging:group:" + blanIdValue + ":port:" + mover_arrays[i] ];
                        	}
                        	else
                        	{
                        		params[ "bridging:group:" + blanIdValue + ":port:" + mover_arrays[i] ] = "t";
                        		//params[ "interface:" + mover_arrays[i] + ":depend_on" ] = "br" + blanIdValue;
                        	}
                        }
                    }
                    if (dhcpcValue == true && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {}
                    else if (dhcpcValue == true) {
                        params[ "dhcp:dhcpc:interface:"+intrfcName ] = "t";
                    } else {
                        if (dhcpcValue == false && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {
                            params[ "dhcp:dhcpc:interface:"+intrfcName ] = "";
                        }
                        params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                        params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
                    }
                    params[ "interface:"+ intrfcName +":combo:new_mtu:mtu" ] = mtuValue;
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );
                }
                else if( selectedRow.data.type == "bond" ){
                    var blanIdValue = ( Ext.getCmp( 'bolabel' ) ) ? Ext.getCmp( 'bolabel' ).getValue() : '';
                    var mover_arrays = Ext.getCmp('user-interface-dual').rightListStore.collect('intf');
                    var prev_array = selectedRow.data.gr_ports;
                    for (var i=0; i<prev_array.length; i++)
                    {
                        params[ "bonding:group:" + blanIdValue + ":port:" + prev_array[i] ] = "";
                        //params[ "interface:" + prev_array[i] + ":depend_on" ] = "";
                    }
                    for (var i=0; i<mover_arrays.length; i++)
                    {
                        if (params[ "bonding:group:" + blanIdValue + ":port:" + mover_arrays[i] ])
                        {
                            delete params[ "bonding:group:" + blanIdValue + ":port:" + mover_arrays[i] ];
                            //delete params[ "interface:" + mover_arrays[i] + ":depend_on" ];
                        }
                        else
                        {
                            params[ "bonding:group:" + blanIdValue + ":port:" + mover_arrays[i] ] = "t";
                            //params[ "interface:" + mover_arrays[i] + ":depend_on" ] = "bond" + blanIdValue;
                        }
                    }
                    if (dhcpcValue == true && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {}
                    else if (dhcpcValue == true) {
                        params[ "dhcp:dhcpc:interface:"+intrfcName ] = "t";
                    } else {
                        if (dhcpcValue == false && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {
                            params[ "dhcp:dhcpc:interface:"+intrfcName ] = "";
                        }
                        params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                        params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
                    }
                    params[ "interface:"+ intrfcName +":combo:new_mtu:mtu" ] = mtuValue;
                    params[ "bonding:group:" + blanIdValue + ":mode" ] = Ext.getCmp('bond_mode').curr_mode;
                    params[ "bonding:group:" + blanIdValue + ":up_delay" ] = Ext.getCmp('up_delay').getValue();
                    params[ "bonding:group:" + blanIdValue + ":down_delay" ] = Ext.getCmp('down_delay').getValue();
                    if (Ext.getCmp('mii_mon').disabled==false)
                        params[ "bonding:group:" + blanIdValue + ":mii_interval" ] = Ext.getCmp('mii_mon').getValue();
                    else
                        params[ "bonding:group:" + blanIdValue + ":mii_interval" ] =  "0";
                        // if (Ext.getCmp('arp_poll_interval').disabled==false)
                        // params[ "bonding:group:" + blanIdValue + ":arp_p_interval" ] = Ext.getCmp('arp_poll_interval').getValue();
                        // else
                        // params[ "bonding:group:" + blanIdValue + ":arp_p_interval" ] = "0";
                    if (Ext.getCmp('lacp_rate').disabled==false){
                        var lacpVal = Ext.getCmp('lacp_rate').getValue();
                        params[ "bonding:group:" + blanIdValue + ":lacp_rate" ] = lacpVal.lacp_rate;
                    }
                    if (Ext.getCmp('xmit_hash_policy').disabled==false){
                        var xmitVal =  Ext.getCmp('xmit_hash_policy').getValue();
                        params[ "bonding:group:" + blanIdValue + ":xmit_hash_policy" ] = xmitVal.xmit_hash_policy;
                    }
                    if (Ext.getCmp('primary_interface').disabled==false)
                        params[ "bonding:group:" + blanIdValue + ":primary" ] = Ext.getCmp('primary_interface').getValue();
                    else
                        params[ "bonding:group:" + blanIdValue + ":primary" ] = "";
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );

                }
                else if( selectedRow.data.type == "ethernet" )
                {					
                    if (dhcpcValue == true && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {}
                    else if (dhcpcValue == true) {
						if( state == false ) {
							params[ "dhcp:dhcpc:interface:"+intrfcName ] = "f";
						} else {
							params[ "dhcp:dhcpc:interface:"+intrfcName ] = "t";
						}
                    } else {
                        if (dhcpcValue == false && CP.Interfaces.hasDhcpStateInDB(oldDhcpcValue)) {
                            params[ "dhcp:dhcpc:interface:"+intrfcName ] = "";
                        }
                        params[ "interface:"+ intrfcName +":newAddr" ] = v4AddrValue;
                        params[ "interface:"+ intrfcName +":newMask" ] = v4MaskValue;
						if (selectedRow.data.support_ethtool_set && selectedRow.data.support_ethtool_set != 'false') {
							params[ "interface:"+ intrfcName +":combo:new_auto_negotiation" ] = autoNegValue;
	                        params[ "interface:"+ intrfcName +":combo:new_link_speed" ] = linkSpeedValue;
						} else {
							params[ "interface:"+ intrfcName +":combo:new_auto_negotiation" ] = "";
	                        params[ "interface:"+ intrfcName +":combo:new_link_speed" ] = "";
						}
                        params[ "interface:"+ intrfcName +":combo:new_hwaddr:hwaddr" ] = hwaddrValue;
                        params[ "interface:"+ intrfcName +":combo:new_mtu:mtu" ] = mtuValue;
                        params[ "interface:"+ intrfcName +":combo:new_monitor_mode" ] = monitorModeValue;
                    }
                    this.addFieldToParams( 'state', params, selectedRow, intrfcName, stateValue );

                    //Save ADP
                    var adp_cmp = Ext.getCmp( 'adp_mode' );
                    if( ( CP.Interfaces.ADP_DEVICE_PRESENT || CP.Interfaces.ADP_DEMO )
                        && selectedRow && selectedRow.data.adp_able && adp_cmp) {
                        //should this be only ethernets?
                        var adpVal = Ext.getCmp( 'adp_mode' ).getValue()
                            ? CP.Interfaces.ADP_MODE_TRUE_PARAM_VALUE
                            : CP.Interfaces.ADP_MODE_FALSE_PARAM_VALUE;
                        var oldAdpVal = (selectedRow.data.adp_mode)
                            ? CP.Interfaces.ADP_MODE_TRUE_PARAM_VALUE
                            : CP.Interfaces.ADP_MODE_FALSE_PARAM_VALUE;
                        if(adpVal != oldAdpVal) {
                            params[ "interface:"+ intrfcName +":"+ CP.Interfaces.ADP_MODE_BINDING ] = adpVal;
                        }
                    }
                }
            break;

            //Delete
            case CP.Interfaces.FORM_TYPE_DELETE:
                if( selectedRow.data.type == "aux" ){
                    delete_loopbacks.push( selectedRow.data.name );
                }
                else if( selectedRow.data.type == "alias" ){
                    delete_alias.push( selectedRow.data.name );
                }
                else if( selectedRow.data.type == "vlan" ){
                    delete_vlans.push( selectedRow.data.name );
                }
                else if( selectedRow.data.type == "bridge" ){
                    delete_bridges.push( selectedRow.data.name );
                }
                else if( selectedRow.data.type == "bond" ){
                    delete_bonds.push( selectedRow.data.name );
                }
		else if( selectedRow.data.type == "gre" ){
                    delete_gres.push( selectedRow.data.name );
                }
                else if( selectedRow.data.type == "6in4" ){
                    delete_tunnels.push( selectedRow.data.name.substring(9) );	//submit only the id
                }
                else if( selectedRow.data.type == "vpnt" ){
                    delete_vpnts.push( selectedRow.data.name.substring(4) );    //submit only the id
                }
                else if( selectedRow.data.type == "pppoe" ){
                    delete_pppoes.push( selectedRow.data.name.substring(5) );   //submit only the id
                }
                else { // we will delete all interface:${intf name} bindings
                    delete_vlans.push( selectedRow.data.name );
                }
            break;
        } /////////////////    End switch

        //Add IPv6 params
        CP.Interfaces.setIPv6ChangedParams(formType,params,selectedRow);

        params['ciList']   = changed_intfs.toString();
        params['newVlans'] = new_vlans.toString();
        params['delVlans'] = delete_vlans.toString();
        params['delAlias'] = delete_alias.toString();
        params['delBridges']= delete_bridges.toString();
        params['delBonds']= delete_bonds.toString();
        params['delVpnts']= delete_vpnts.toString();
        params['delPPPoEs']= delete_pppoes.toString();
        params['delTunnels']= delete_tunnels.toString();
        params['delLoopBacks'] = delete_loopbacks.toString();
        params['delBridges']= delete_bridges.toString();
        params['delBonds']= delete_bonds.toString();
	params['delGres']= delete_gres.toString();
    },

   ////////////////////// /* Radio buttons logic */  ////////////////////////

    /* Bond Tab radio logic*/
    checkedRadio_RoundRobin: function(field, ischecked) {
        if (ischecked){
                Ext.getCmp("bond_mode_8023ad").setValue(false);
                Ext.getCmp("bond_mode_ab").setValue(false);
                Ext.getCmp("bond_mode_xor").setValue(false);
                Ext.getCmp("lacp_rate").disable();
                Ext.getCmp("xmit_hash_policy").disable();
                Ext.getCmp("bond_mode").curr_mode = 'round_robin';
                Ext.getCmp("primary_interface").disable();
		CP.Interfaces.bondIfs.update();
            }
    },

    checkedRadio_ActiveBackup: function(field, ischecked) {
        if (ischecked){
                Ext.getCmp("bond_mode_8023ad").setValue(false);
                Ext.getCmp("bond_mode_rb").setValue(false);
                Ext.getCmp("bond_mode_xor").setValue(false);
                Ext.getCmp("lacp_rate").disable();
                Ext.getCmp("xmit_hash_policy").disable() ;
                Ext.getCmp("bond_mode").curr_mode = 'active_backup';
                Ext.getCmp("primary_interface").enable();
		CP.Interfaces.bondIfs.update();
        }
    },

    checkedRadio_XOR: function(field, ischecked) {
        if (ischecked){
                Ext.getCmp("bond_mode_8023ad").setValue(false);
                Ext.getCmp("bond_mode_rb").setValue(false);
                Ext.getCmp("bond_mode_ab").setValue(false);
                Ext.getCmp("lacp_rate").disable();
                Ext.getCmp("xmit_hash_policy").enable()  ;
                Ext.getCmp("bond_mode").curr_mode = 'xor';
                Ext.getCmp("primary_interface").disable();
		CP.Interfaces.bondIfs.update();
        }
    },

    checkedRadio_802: function(field, ischecked) {
        if (ischecked){
                Ext.getCmp("bond_mode_xor").setValue(false);
                Ext.getCmp("bond_mode_rb").setValue(false);
                Ext.getCmp("bond_mode_ab").setValue(false);
                Ext.getCmp("lacp_rate").enable() ;
                Ext.getCmp("xmit_hash_policy").enable() ;
                Ext.getCmp("bond_mode").curr_mode = '8023AD';
                Ext.getCmp("primary_interface").disable();
		CP.Interfaces.bondIfs.update();
        }
    },

    /* Bond Tab radio logic*/
/*
    checkedMediaMonitoringInterval: function(field, ischecked) {
        if (ischecked){
            Ext.getCmp("arp_poll_interval").disable();
            Ext.getCmp("ARP_monitoring_radio").setValue(false);
            Ext.getCmp("mii_mon").enable();
            Ext.getCmp("milliseconds_mii").enable();
            Ext.getCmp("milliseconds_arp").disable();
            Ext.getCmp("link_monitoring").curr_mon = 'mii_mon';
        }
    },

    checkedARPPollingInterval: function(field, ischecked) {
        if (ischecked){
            Ext.getCmp("arp_poll_interval").enable();
            Ext.getCmp("mii_mon").disable();
            //Ext.getCmp("mii_monitoring_radio").setValue(false);
            Ext.getCmp("milliseconds_arp").enable();
            Ext.getCmp("milliseconds_mii").disable();
            Ext.getCmp("link_monitoring").curr_mon = 'arp_mon';
        }
    },
*/
    checkedNumberedVPNT: function(field, ischecked) {
        if (ischecked){
            Ext.getCmp("vpnt_type_unnumbered").setValue(false);
            Ext.getCmp("vpnt_local_ip_addr").enable();
            Ext.getCmp("vpnt_remote_ip_addr").enable();
            Ext.getCmp("vpnt_dev").disable();
        }
    },

    checkedUnnumberedVPNT: function(field, ischecked) {
        if (ischecked){
            Ext.getCmp("vpnt_type_numbered").setValue(false);
            Ext.getCmp("vpnt_local_ip_addr").disable();
            Ext.getCmp("vpnt_remote_ip_addr").disable();
            Ext.getCmp("vpnt_dev").enable();
        }
    },

    showLink_grid: function(val, meta, record) {
        return CP.Interfaces.showLink(val, meta, record, 1);
    },

    showLink: function(val, meta, record, with_cls) {
        var text = "";
        var cls = "";
        switch (record.data.type) {
            case 'pppoe':
                text = record.data.pppoe_ex.conn_status;
                switch(text) {
                    case 'Connected':
                            cls = 'link-up';
                    break;
                    case 'Connecting...':
                            cls = 'link-disabled';
                    break;
                    case 'Disconnected':
                            cls = 'link-down';
                    break;
                }
                break;
            case 'bond':
				if (record.data.state == 'on') {
					if (record.data.link_state == 'on') {
						text = 'Up';
						cls = 'link-up';
					}
					else {
						text = 'No Link';
						cls = 'link-down';
					}
				}
				else {
					text = 'Down';
					cls = 'link-disabled';
				};
				break;
            case 'bridge':
                if (record.data.fail_open) {
                    var potential_fonic_pair = CP.Interfaces.getFailOpenNICsPairName(record.data.gr_ports);
                    var fonic_pair_details = CP.Interfaces.getFailOpenPairStatusDetails(potential_fonic_pair);
                    if (fonic_pair_details) {
                            if (fonic_pair_details[0] == "Bypass") {
                                text = 'Bypass';
                                cls = 'link-down';
                                break;
                            } else if (fonic_pair_details[0] == "Normal") {
                                text = 'Normal';
                                cls = 'link-up';
                                break;
                            }
                    }
                }
            case 'aux':
            case 'loopback':
            case '6to4':
                if (record.data.state == 'on') {
                    text = 'Up';
                    cls = 'link-up';
                } else {
                    text = 'Down';
                    cls = 'link-disabled';
                }
                break;
			case 'gre':
            case '6in4':
                if (record.data.link_state == 'Up') {
                    text = 'Up';
                    cls = 'link-up';
                } else {
                    text = 'Down';
                    cls = 'link-disabled';
                }
                break;
            case 'vlan':
            case 'alias':
            default:
                if (record.data.state == 'on') {
                    if (record.data.link_carrier == 'link up'){
                        text = 'Up';
                        cls = 'link-up';
                        break;
                    }
                    else {
                        text = 'No Link';
                        cls = 'link-down';
                        break;
                    }
                } else {
                    text = 'Down';
                    cls = 'link-disabled';
                    break;
                }
        }
        if( cls == '' || with_cls == 0 ){
            return text;
        }else{
            return '<div class="'+ cls +'">'+ text +'</div>';
        }
    }
    ,rendererADP    : function(value, meta, record, row, col, st, view) {
        //Included for the future when we allow ADP on bridges/bonds
        var grid = Ext.getCmp( CP.Interfaces.INTERFACES_GRID_ID ); //interfaces main grid
        var i_st = grid.getStore();
        var i_rec = i_st.findRecord("name", value, 0, false, true, true);
        if(!i_rec) {
            return value;
        }
        if(i_rec.data.adp_mode) {
            return String(value) +" (<b>"+ String(CP.Interfaces.ADP_LABEL) +"</b>)";

        }
        return value;
    }
    ,evaluate_adp_input: function(data) {
        var adp_demo = (data.adp_demo) ? true : false;
        CP.Interfaces.ADP_DEMO = adp_demo;
        var adp_device = (data.adp_device_present) ? true : false;
        CP.Interfaces.ADP_DEVICE_PRESENT = adp_device;
        var adp_related = Ext.getCmp("adp_related_label");
        if(adp_related) {
            adp_related.setVisible( adp_device || adp_demo );
        }
        var adp_label = Ext.getCmp('adp_demo_label');
        if(adp_label) {
            adp_label.setVisible( adp_demo );
        }
        var adp_col = Ext.getCmp('adp_col');
        if(adp_col) {
            adp_col.setVisible( adp_device || adp_demo );
        }
    }
    // bondIfs.* There are some rules as to whether
    // ADP or non-ADP interfaces can be in a bonding group; if the bond
    // contains an ADP interface then it must:
    //		+ only contain ADP interfaces
    //		+ be in Active-Backup mode
    //		+ contain no more than eight interfaces (this one we
    //		ignore here: an error message, that the user gets when
    //		they submit the changes, is more explanatory than just
    //		mysteriously hiding all the interfaces)
    // The enforcement of these rules takes place in the CDK, but for
    // the user's sake we also enable/disable/show/hide the appropriate
    // available interfaces and bonding modes.
    // Members:
    //		adp - whether ADP mode interfaces are/were allowed
    //		availifs - what interfaces would be available of both types,
    //			including ones already used in this bond
    //		nonAdp - whether non-ADP mode interfaces are/were allowed
    //		suppress - prevents this code from running until things
    //			have been set up
    //		adpModes - what 'bond_mode' settings are allowed
    //			in ADP bonds.  A hash that contains each one
    //			that's allowed as a key & doesn't contain the
    //			others at all.
    //		setupBegins() - call it when we start setting up a new
    //			dialog
    //		setupFinishes() - call it when we're done setting up that
    //			dialog
    //		update() - call it when something has or may have changed
    ,bondIfs: {
	adp: true, nonAdp: true, availifs: [], suppress: true
	,adpModes: {'active_backup': true, 'round_robin': true, 'xor': true, '8023AD': true}
	,setupBegins: function(dualList) {
	    CP.Interfaces.bondIfs.suppress = true;
	    dualList.leftList.getSelectionModel().setSelectionMode("SINGLE");
	    dualList.rightListStore.addListener('add',
		CP.Interfaces.bondIfs.update);
	    dualList.rightListStore.addListener('remove',
		CP.Interfaces.bondIfs.update);
	}
	,setupFinishes: function() {
	    // Set values of adp & nonAdp that match the initial list of
	    // interfaces.
	    CP.Interfaces.bondIfs.adp = true;
	    CP.Interfaces.bondIfs.nonAdp = true;
	    // Now we can update.
	    CP.Interfaces.bondIfs.suppress = false;
	    CP.Interfaces.bondIfs.update();
	}
	,update: function() {
	    var bondIfs = CP.Interfaces.bondIfs;
	    if (bondIfs.suppress) return; // not ready for us yet
	    // What kinds of interfaces do we have now?  That'll be a major
	    // determiner of what kinds we can have.
	    var newAdp = true, newNonAdp = true;
	    var i, j, a;
	    var dualList = Ext.getCmp("user-interface-dual");
	    var already = {}; // interfaces on our "right side" currently
	    dualList.rightListStore.each(function(i) {
		already[i.data.intf] = true;
		a = CP.Interfaces.getRecordByName(i.data.intf).data.adp_mode;
		if (a)
		    newNonAdp = false; // it's an ADP bond
		else
		    newAdp = false; // it's a non-ADP bond
	    });

	    // And what's our "mode"?  That matters too.
	    var bmode = Ext.getCmp("bond_mode");
	    if (!(bmode.curr_mode in bondIfs.adpModes))
		newAdp = false; // can't have ADP bond in other modes

	    // Now we know what we should show.  Has it changed?
	    if (newAdp == bondIfs.adp && newNonAdp == bondIfs.nonAdp)
		return; // no change

	    // It's changed.
	    bondIfs.adp = newAdp;
	    bondIfs.nonAdp = newNonAdp;
	
	    // What mode(s) are allowed?
	    var mode_restrict =
		(!newNonAdp) && (bmode.curr_mode in bondIfs.adpModes);
	    bmode.items.each(function (i) {
		if ('inputValue' in i) {
		    if (mode_restrict && !(i.inputValue in bondIfs.adpModes))
			i.disable();
		    else
			i.enable();
		}
	    });

	    // And what interfaces are available to include on the left side?
	    var lft = [];
	    for (j = 0; j < bondIfs.availifs.length; ++j) {
		i = bondIfs.availifs[j];
		a = CP.Interfaces.getRecordByName(i[0]).data.adp_mode;
		if (already[i[0]]) continue; // no: it's on the right side
		if (a && !newAdp) continue; // no: it's an ADP interface
		if ((!a) && !newNonAdp) continue; // no: not an ADP interface
		lft.push(i);
	    }
	    dualList.leftListStore.loadData(lft);
	}
    }
}

