
CP.GuiClients = {
clientsPage: null,

init: function() {
	var fhaSettingsTitle = Ext.create ( 'CP.WebUI4.SectionTitle',{
		titleText: 'Security Management GUI Clients'
	});
	
	var cm = [
			  {header: 'Type', dataIndex: 'type', id:'cm_type', width: 160},
			  {header: 'Hostname / IP Address', dataIndex: 'host', id:'cm_host', width: 200}
		  ];


    cm.push({ width: 115, header:'Mask', dataIndex:"mask",hidden: false , renderer: CP.GuiClients.showSubnetMask_Length, flex: 1});

	var clientsPanel = Ext.create ( 'CP.WebUI4.DataFormPanel',{    
		id:"clients-panel"
		,items: [
			fhaSettingsTitle,
			{
				//Buttons toolbar for table
				xtype: 'cp4_btnsbar',
				items: [{
					id: 'mgmt_clients_add',
					text: 'Add',
					disabled: true,
					handler: CP.GuiClients.openModalWindowAdd
				},{
					id: 'mgmt_clients_delete',
					text: 'Delete',
					disabled: true,
					handler: function(btn, text){
						CP.WebUI4.Msg.show({
							title:'Delete Client',
							msg: 'Are you sure you want to delete the selected client?',
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.QUESTION,
							fn: function(btn, text){
								var gridSM = Ext.getCmp( 'mgmt_clients_grid' ).getSelectionModel();
								var s = gridSM.getLastSelected();
								gridSM.clearSelections();

								if (btn == "cancel")
									return;
								
								if (!s)
									return;

								CP.GuiClients.applyHandler(CP.GuiClients.clientsPage, 'delete', s.data);
							}
						});
					}
				}]
			},{
				xtype: 'cp4_inlinemsg', 
				id: 'GuiClients_connection_error',
				type: 'error',
				hidden: true, 
				text: 'Management Server cannot be reached. Check your management configuration and try again.',
				style: "padding:10px 0"
			},{			
				xtype: 'cp4_grid',
				id: 'mgmt_clients_grid',
				height: 350,
				width: 550,
				store: {
					xtype: 'cp4_jsonstore',
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/cgi-bin/mgmt_gui_clients.tcl',
						reader: {
							type: 'json',
							root: 'data.clients'
						}
					},
					fields: ['type', 'host', 'mask']
				},
				columns: cm,
				listeners: {
					selectionchange: function( gridView, selections ){
						var delBtn = Ext.getCmp("mgmt_clients_delete");
						if( selections.length == 0 ){
							delBtn.disable();
						}
						else{
							delBtn.enable();
						}
					}
				}
			}
		] 
		,listeners: {
              		render: CP.GuiClients.doLoad   
      	  }
    });
	
	CP.GuiClients.clientsPage = {
		title:"Security Management GUI Clients"
		,panel: clientsPanel
		,submitURL:"/cgi-bin/mgmt_gui_clients.tcl"
		,params:{}
		,beforeSubmit:CP.GuiClients.beforeSubmit
		,afterSubmit:CP.GuiClients.afterSubmit
	};
	
	CP.UI.updateDataPanel(CP.GuiClients.clientsPage);
},


/* running the first get to see if there is a success=false massage, that means there is no connection to the management (for example cpstop) */
doLoad: function(formPanel) {
    Ext.Ajax.request({
        url: '/cgi-bin/mgmt_gui_clients.tcl',
        method: 'GET',
        success: function( response ){
			var json = Ext.decode( response.responseText );
                        if (json.success == "false"){
							Ext.getCmp('GuiClients_connection_error').show();           
							Ext.getCmp('mgmt_clients_delete').disable();                 
                        } else {
							Ext.getCmp('mgmt_clients_add').enable();                  
						}
    	}
    });
    
},

//subnet mask / length renderer
showSubnetMask_Length: function (val, meta, record)
{
    var cidrToDecOctet=function ( nMask ){
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

    var decToCIDR=function( decVal ){
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

    if(val == "")
        return "-";

	if(CP.global.formatNotation == 'Length') { //cidr notation
        if(String(val).indexOf('.') == -1)  {
            return val;
        } else {
            var octetVals = String(val).split( '.' );

            return decToCIDR( octetVals[0] ) + decToCIDR( octetVals[1] ) +
                          decToCIDR( octetVals[2] ) + decToCIDR( octetVals[3] );
        }
    } else { //dotted notation
        if(String(val).indexOf('.') == -1 && record.data.host.indexOf(':') == -1)  {
            return cidrToDecOctet( val ) + "." + cidrToDecOctet( val - 8 ) +
                               "." +  cidrToDecOctet( val - 8 * 2 ) + "." + cidrToDecOctet( val - 8 * 3 );
        } else {
            return val;
        }
    }
},
		
openModalWindowAdd: function(){
	var modalClientsForm = Ext.create( 'CP.WebUI4.FormPanel',{
		bodyPadding: 10,
		id: 'mgmt_clients_form',
		items: [{
				xtype: 'cp4_panel'
				, bodyStyle: 'padding-top: 5px'
				, html: "Configuration of the clients that can log into the Security Management"
			},{
				xtype: 'cp4_panel'				
				, items: [{
					xtype: 'cp4_radio'
					, id: 'mgmt_clients_any_radio'
					, name: 'mgmt_gui_clients_radio'
					, style: 'margin-top: 9px; margin-bottom: 10px'	
					, width: 500
					, boxLabel: 'Any IP Address'
					, inputValue: 'any'
					, hideLabel: true
					, checked:false
				 , listeners: {
					 // setting the enabled fields on first creation
					 afterrender: function(field, ischecked) {  
						 var st = Ext.getCmp( 'mgmt_clients_grid' ).getStore();
						 var records = st.queryBy( function(record, id){
							 if (record.data.host == 'any')
									 return true;
						 });
						 if (records != null && records.getCount() > 0)
							 field.hide();
					 }
				 }
				},{
					xtype: 'cp4_radio'
					, id: 'mgmt_clients_this_radio'
					, name: 'mgmt_gui_clients_radio'
					, inputValue: 'this'
					, boxLabel: 'This machine'
					, width: 500
					, hideLabel: true				
					, checked:true
					, handler: function(field, ischecked) {
						// setting the enabled fields on each radio check / uncheck
						if (ischecked){
							var fld = Ext.getCmp("mgmt_gui_clients_ip");
							fld.enable();	
							if (fld.getValue() != "")
								fld.validate();				
						}			
						else {
							var fld = Ext.getCmp("mgmt_gui_clients_ip");
							fld.disable();
							fld.clearInvalid();
						}
					}
				},{
					xtype: 'cp4_IPHybridField',
					id: 'mgmt_gui_clients_ip',
					fieldName: 'mgmt_gui_clients_hostname',
					margin: '0 0 0 20',
					labelWidth: 80,
					width: 300,
					tooltip: 'IP address of this host',                                                  
					listeners: {
						beforerender: function(fld){
							Ext.Ajax.request({
								url: "/cgi-bin/mgmt_gui_clients.tcl"
								,method: "GET"
								,success: function(jsonResult) {
									var jsonData = Ext.decode( jsonResult.responseText );
									fld.setValue(jsonData.data.current_client_ip);
								}, 
								failure: function(jsonResult) {
								}
							});
						}
					}
				},{
					xtype: 'cp4_radio'
					, id: 'mgmt_gui_clients_net_radio'
					, name: 'mgmt_gui_clients_radio'
					, inputValue: 'network'
					, boxLabel: 'Network'
					, width: 500
					, hideLabel: true
					, checked:false
					, handler: function(field, ischecked) {
						// setting the enabled fields on each radio check / uncheck
						if (ischecked){
							var fld = Ext.getCmp("mgmt_ip_nontation");
							fld.enable();	
							if (Ext.getCmp('mgmt_gui_clients_net_ip').getValue() != "" || Ext.getCmp('mgmt_gui_clients_net_subnet').getValue() != "")
								fld.validate();				
						}			
						else {
							var fld = Ext.getCmp("mgmt_ip_nontation");
							fld.disable();
							fld.clearInvalid();
						}
					}
				},{
					xtype: 'cp4_hybridFieldCombinedMaskIP'
					, id: 'mgmt_ip_nontation'
					, margin: '0 0 10 20'
					, labelWidth: 80
					, width: 300
					, sortMaskWidth: (CP.global.formatNotation == 'Length') ? 132 : 193
					, ipId: 'mgmt_gui_clients_net_ip'
					, ipName: 'mgmt_gui_clients_ip_field'				
					, maskLengthId: 'mgmt_gui_clients_net_subnet'
					, maskLengthName: 'mgmt_gui_clients_subnet_field'
					, fieldConfig: { allowBlank: false , networkMode: true	} 
					, disabled: true
					, disabledCls: ''
					, maskOnDisable: false
				},{
					xtype: 'cp4_radio'
					, id: 'mgmt_gui_clients_range_radio'
					, name: 'mgmt_gui_clients_radio'
					, boxLabel: 'Range of IPv4 addresses:'
					, width: 500
					, inputValue: 'range'
					, hideLabel: true
					, checked:false
					, handler: function(field, ischecked) {
						// setting the enabled fields on each radio check / uncheck
						if (ischecked){
							var fld = Ext.getCmp("mgmt_gui_clients_range_first_ip");
							fld.enable();	
							if (fld.getValue() != "")
								fld.validate();				
							fld = Ext.getCmp("mgmt_gui_clients_range_last_ip");
							fld.enable();	
							if (fld.getValue() != "")
								fld.validate();				
							Ext.getCmp("mgmt_gui_clients_dash").enable();
						}			
						else {
							var fld = Ext.getCmp("mgmt_gui_clients_range_first_ip");
							fld.disable();
							fld.clearInvalid();
							fld = Ext.getCmp("mgmt_gui_clients_range_last_ip");
							fld.disable();
							fld.clearInvalid();
							Ext.getCmp("mgmt_gui_clients_dash").disable();
						}
					}
				},{
					xtype: 'cp4_panel'					
					, id: 'mgmt_gui_clients_range_panel'
					, fieldName: 'mgmt_gui_clients_range_panel'		           
					, margin: '0 0 0 8'
					, items: [{
						xtype: 'cp4_fieldcontainer',   //'cp_compositefield',
						fieldLabel: '',
						width: 296,		                
						markInvalid: function( msg ){
							var customMsg = 'The value in this field is invalid';
							Ext.form.field.Field.markInvalid.call( this, customMsg );		                    
						},
						items: [ {
							xtype: 'cp4_ipv4field',
							tooltip: 'First IP address of the range',
							lastIp: 'mgmt_gui_clients_range_last_ip',
							networkIp: 'mgmt_gui_client_ip_field_one',
							networkMask: 'mgmt_gui_client_subnet_field_one',
							id: 'mgmt_gui_clients_range_first_ip',
							fieldName: 'mgmt_gui_clients_first_ip_field',
							disabled: true,
							width: 130,
							margin: '0 5 0 5',							
							hideLabel: true,	                       
							listeners: {
								afterrender: function(){
									Ext.getCmp('mgmt_gui_clients_range_first_ip').disable();
								}
							}
						},{
							xtype: 'cp4_displayfield',
							id:"mgmt_gui_clients_dash",
							value: '-',
							width: 10,
							hideLabel: true
						},{
							xtype: 'cp4_ipv4field',
							tooltip: 'Last IP address of the DHCP range',
							firstIp: 'mgmt_gui_clients_range_first_ip',
							networkIp: 'mgmt_gui_client_ip_field_two',
							networkMask: 'mgmt_gui_client_subnet_field_one',
							hideLabel: true,
							id: 'mgmt_gui_clients_range_last_ip',
							fieldName: 'mgmt_gui_clients_last_ip_field',
							disabled: true,
							width: 130,
							margin: '0 5 0 5',
							padding: '0 0 0 15',
							hideLabel: true		                   
						}]
					}]
				}]
			}],
		//Save and cancel buttons
		buttons: [{
			id: 'clients_ok_btn',
			text: 'OK',
			xtype: 'cp4_button',
			handler: function(){
				var isValid = true;
				if(Ext.getCmp("mgmt_gui_clients_range_radio").getValue() == true){
					var valid_difference_ips = Ext.getCmp("mgmt_gui_clients_range_last_ip").ip2long() - Ext.getCmp("mgmt_gui_clients_range_first_ip").ip2long();
					if(valid_difference_ips <= 0){
						CP.WebUI4.Msg.show({
							title:'Add GUI Client'
							, msg: "The range of IPs is not valid"
							, buttons: Ext.Msg.OK
							, icon:  Ext.MessageBox.WARNING
							, animEl: 'elId'				
						});		  
						isValid = false;		  
					}
				}
				if (Ext.getCmp("mgmt_gui_clients_net_radio").getValue()== true) {
					var mgmt_gui_ip=Ext.getCmp('mgmt_gui_clients_net_ip');
					var mgmt_gui_subnet=Ext.getCmp('mgmt_gui_clients_net_subnet');
					if (mgmt_gui_ip.getValue()==="") {
						mgmt_gui_ip.markInvalid("The IP address field is required");
						isValid=false;
					}
					if (mgmt_gui_subnet.getValue()==="") {
						mgmt_gui_subnet.markInvalid("The Subnet field is required");
						isValid=false;
					}
				}
				if (Ext.getCmp("mgmt_clients_this_radio").getValue() == true) {
						thisMachineCmp=Ext.getCmp("mgmt_gui_clients_ip");
						if (thisMachineCmp.getValue()==="") {
							thisMachineCmp.markInvalid("The IP address field is required");
							isValid=false;	
						}
				}
				if(isValid){
				var form = Ext.getCmp( 'mgmt_clients_form' );
				if (form.getForm().isValid()){
					CP.GuiClients.applyHandler(CP.GuiClients.clientsPage, 'add', form.getValues());
					Ext.getCmp( 'add_clients_window' ).close();
				}
			}
			}
		},{
			text: 'Cancel',
			xtype: 'cp4_button',
			handler: function(){
				Ext.getCmp( 'add_clients_window' ).close();
			}
		}]
	});

	//Modal window for add, edit
	var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'add_clients_window',
		name: 'add_clients_window',
		width: 420,
		height: 340,
		title: 'Add GUI Client',
		items: [ modalClientsForm ]
	});
	
	modalWin.show();
},

applyHandler: function(page, reqAction, allValues ) {
	if (reqAction == 'delete'){
		allValues.mgmt_gui_clients_hostname = allValues.host;
		allValues.mgmt_gui_clients_ip_field = allValues.host;
		allValues.mgmt_gui_clients_subnet_field = allValues.mask;
		allValues.mgmt_gui_clients_radio = (allValues.mask == "")? 'this': 'network';
	}
	//var allValues = Ext.getCmp( 'mgmt_clients_form' ).getValues();
	var values = {action:reqAction,
			mgmt_gui_clients_radio: allValues.mgmt_gui_clients_radio
	};
	if (values.mgmt_gui_clients_radio == 'this'){
		values = Ext.apply({
			mgmt_gui_clients_hostname: allValues.mgmt_gui_clients_hostname
		}, values);
	}
	else if (values.mgmt_gui_clients_radio == 'network'){
		values = Ext.apply({
			mgmt_gui_clients_ip_field: allValues.mgmt_gui_clients_ip_field,
			mgmt_gui_clients_subnet_field: allValues.mgmt_gui_clients_subnet_field
		}, values);
	}
	else if (values.mgmt_gui_clients_radio == 'range'){
		values = Ext.apply({
			mgmt_gui_clients_first_ip_field: allValues.mgmt_gui_clients_first_ip_field,
			mgmt_gui_clients_last_ip_field: allValues.mgmt_gui_clients_last_ip_field
		}, values);
	}
	page.params = values;
	CP.UI.applyHandler(page);
},

beforeSubmit:function(panel){
},

afterSubmit:function(){
	Ext.Ajax.request({
		url: "/cgi-bin/mgmt_gui_clients.tcl"
		,method: "GET"
		,success: function(jsonResult) {
			var jsonData = Ext.decode( jsonResult.responseText );
			//refresh grid data
			var grid = Ext.getCmp( 'mgmt_clients_grid');
			var store = grid.getStore();
			var reader = store.getProxy().getReader();
			var data = reader.read( jsonData );
			store.loadData( data.records );
			grid.doComponentLayout();
		}, 
		failure: function(jsonResult) {
		}
	});
}
}