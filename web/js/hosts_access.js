CP.HostsAccess = {
hostsPage: null,

init: function() {
	var fhaSettingsTitle = Ext.create ( 'CP.WebUI4.SectionTitle',{
		titleText: 'Allowed Hosts'
	});
	
	var cm = [
			  {header: 'Type', dataIndex: 'host_type', id:'cm_type', width: 100},
			  {header: 'IP Address', dataIndex: 'host_addr', id:'cm_host', width: 300},
			  {header: 'Netmask', dataIndex: 'host_mask', id:'cm_mask', flex: 1}
		  ];
	
	var hostsPanel = Ext.create ( 'CP.WebUI4.DataFormPanel',{    
		id:"hosts-panel"
		,items: [
			fhaSettingsTitle,
			{
				//Buttons toolbar for table
				xtype: 'cp4_btnsbar',
				items: [{
					id: 'allowed_hosts_add',
					text: 'Add',
					handler: CP.HostsAccess.openModalWindowAdd
				},{
					id: 'allowed_hosts_delete',
					text: 'Delete',
					disabled: true,
					handler: function(btn, text){
						CP.WebUI4.Msg.show({
							title:'Delete Host',
							msg: 'Are you sure you want to delete the selected Host?',
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.QUESTION,
							fn: function(btn, text){
								var gridSM = Ext.getCmp( 'allowed_hosts_grid' ).getSelectionModel();
								var s = gridSM.getLastSelected();
								gridSM.clearSelections();

								if (btn == "cancel")
									return;
								
								if (!s)
									return;

								CP.HostsAccess.applyHandler(CP.HostsAccess.hostsPage, 'delete', s.data);
							}
						});
					}
				}]
			},{
				xtype: 'cp4_grid',
				id: 'allowed_hosts_grid',
				height: 350,
				width: 550,
				store: {
					xtype: 'cp4_jsonstore',
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/cgi-bin/hosts_access.tcl',
						reader: {
							type: 'json',
							root: 'data.hosts'
						}
					},
					fields: ['host_type', 'host_addr', 'host_mask']
				},
				columns: cm,
				listeners: {
					selectionchange: function( gridView, selections ){
						var delBtn = Ext.getCmp("allowed_hosts_delete");
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
	});
	
	CP.HostsAccess.hostsPage = {
		title:"Allowed Hosts"
		,panel: hostsPanel
		,cluster_feature_name : "host-access"
		,submitURL:"/cgi-bin/hosts_access.tcl"
		,params:{}
		,beforeSubmit:CP.HostsAccess.beforeSubmit
		,afterSubmit:CP.HostsAccess.afterSubmit
	};
	
	CP.UI.updateDataPanel(CP.HostsAccess.hostsPage);
},

openModalWindowAdd: function(){
	var modalHostsForm = Ext.create( 'CP.WebUI4.FormPanel',{
		bodyPadding: 10,
		id: 'allowed_hosts_form',
		items: [{
				xtype: 'cp4_panel'
				, bodyStyle: 'padding-top: 5px'
				, html: "Configuration of the hosts that can log into this machine"
			},{
				xtype: 'cp4_panel'				
				, items: [{
					xtype: 'cp4_radio'
					, id: 'allowed_hosts_any_radio'
					, name: 'allowed_hosts_radio'
					, style: 'margin-top: 9px; margin-bottom: 10px'	
					, width: 500
					, boxLabel: 'Any IP Address'
					, inputValue: 'any'
					, hideLabel: true
					, checked:false
				 , listeners: {
					 // setting the enabled fields on first creation
					 afterrender: function(field, ischecked) {  
						 var st = Ext.getCmp( 'allowed_hosts_grid' ).getStore();
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
					, id: 'allowed_hosts_this_radio'
					, name: 'allowed_hosts_radio'
					, inputValue: 'this'
					, boxLabel: 'Host'
					, width: 500
					, hideLabel: true
					, checked:true
					, handler: function(field, ischecked) {
						// setting the enabled fields on each radio check / uncheck
						if (ischecked){
							var fld = Ext.getCmp("allowed_hosts_ip");
							fld.enable();	
							if (fld.getValue() != "")
								fld.validate();
						}
						else {
							var fld = Ext.getCmp("allowed_hosts_ip");
							fld.disable();
							fld.clearInvalid();
						}
					}
				},{
					xtype: 'cp4_IPHybridField',
					id: 'allowed_hosts_ip',
					fieldName: 'allowed_hosts_hostname',
					margin: '0 0 0 20',
					labelWidth: 80,
					width: 300,
					tooltip: 'IP address of this host',                                                  
					listeners: {
						beforerender: function(fld){
							Ext.Ajax.request({
								url: "/cgi-bin/hosts_access.tcl"
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
					, id: 'allowed_hosts_net_radio'
					, name: 'allowed_hosts_radio'
					, inputValue: 'network'
					, boxLabel: 'Network'
					, width: 500
					, hideLabel: true
					, checked:false
					, handler: function(field, ischecked) {
						// setting the enabled fields on each radio check / uncheck
						if (ischecked){
							var fld = Ext.getCmp("allowed_hosts_ip_nontation");
							fld.enable();	
							if (Ext.getCmp('allowed_hosts_net_ip').getValue() != "" || Ext.getCmp('allowed_hosts_net_subnet').getValue() != "")
								fld.validate();
						}
						else {
							var fld = Ext.getCmp("allowed_hosts_ip_nontation");
							fld.disable();
							fld.clearInvalid();
						}
					}
				},{
					xtype: 'cp4_hybridFieldCombinedMaskIP'
					, id: 'allowed_hosts_ip_nontation'
					, margin: '0 0 10 20'
					, labelWidth: 80
					, width: 300
					, ipId: 'allowed_hosts_net_ip'
					, ipName: 'allowed_hosts_ip_field'
					, maskLengthId: 'allowed_hosts_net_subnet'
					, maskLengthName: 'allowed_hosts_subnet_field'
					, fieldConfig: { allowBlank: false , networkMode: true	} 
					, disabled: true
					, disabledCls: ''
					, maskOnDisable: false
				}]
			}],
		//Save and cancel buttons
		buttons: [{
			id: 'hosts_ok_btn',
			text: 'OK',
			xtype: 'cp4_button',
			handler: function(){
				var form = Ext.getCmp( 'allowed_hosts_form' );
				if (form.getForm().isValid()){
                                        allValues = form.getValues()
                                        if (allValues.allowed_hosts_ip_field == "" || allValues.allowed_hosts_subnet_field == ""){
                                                Ext.Msg.alert("Error","Network not valid")
                                                return
                                        }
					CP.HostsAccess.applyHandler(CP.HostsAccess.hostsPage, 'add', form.getValues());
					Ext.getCmp( 'add_hosts_window' ).close();
				}
			}
		},{
			text: 'Cancel',
			xtype: 'cp4_button',
			handler: function(){
				Ext.getCmp( 'add_hosts_window' ).close();
			}
		}]
	});

	//Modal window for add, edit
	var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'add_hosts_window',
		name: 'add_hosts_window',
		width: 420,
		height: 340,
		title: 'Add Host',
		items: [ modalHostsForm ]
	});
	
	modalWin.show();
},

applyHandler: function(page, reqAction, allValues ) {
	if (reqAction == 'delete'){
		allValues.allowed_hosts_hostname = allValues.host_addr;
		allValues.allowed_hosts_ip_field = allValues.host_addr;
		allValues.allowed_hosts_subnet_field = allValues.host_mask;
		allValues.allowed_hosts_radio = (allValues.host_mask == "")? 'this': 'network';
	}
	var values = {action:reqAction,
			allowed_hosts_radio: allValues.allowed_hosts_radio
	};
	if (values.allowed_hosts_radio == 'this'){
		values = Ext.apply({
			allowed_hosts_hostname: allValues.allowed_hosts_hostname
		}, values);
	}
	else if (values.allowed_hosts_radio == 'network'){
		values = Ext.apply({
			allowed_hosts_ip_field: allValues.allowed_hosts_ip_field,
			allowed_hosts_subnet_field: allValues.allowed_hosts_subnet_field
		}, values);
	}
	page.params = values;
	CP.UI.applyHandler(page);
},

beforeSubmit:function(panel){
},

afterSubmit:function(){
	Ext.Ajax.request({
		url: "/cgi-bin/hosts_access.tcl"
		,method: "GET"
		,success: function(jsonResult) {
			var jsonData = Ext.decode( jsonResult.responseText );
			//refresh grid data
			var grid = Ext.getCmp( 'allowed_hosts_grid');
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