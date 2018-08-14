CP.Hosts = {
	
	SYSNAME_FORM_ID: 'hosts-panel',
	EDIT_HOST_NAME: 0,
	HOSTNAME: '',
	ipv4Width: 280,
	ipv6width: 365,

	
init: function() {

    var hostsPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
        id:"hosts-panel"
        ,labelWidth:140
        ,afterSubmit:CP.Hosts.afterSubmit
        ,defaults: {
            //maxLength: 255 
        },
        listeners: {
            render: CP.Hosts.doLoad
        }
    });
    
    var pageObj = {
        title:"Hosts"
        ,panel:hostsPanel
        ,submit:false
        ,discard:false
        ,submitURL:"/cgi-bin/hosts_dns.tcl"
        ,params:{}
        ,afterSubmit:CP.Hosts.afterSubmit
        ,helpFile:"hostsHelp.html"
    };
    
	if(!CP.global.isCluster) {
		CP.Hosts.addSysNameForm(hostsPanel,pageObj);
	}
    CP.Hosts.addDNSForm(hostsPanel,pageObj);
    CP.Hosts.addTable(hostsPanel);

	// Ask the infrastructure to show us.
	CP.UI.updateDataPanel(pageObj);
}

,setClusterSharedFeatureMode: function(feature,components) {
	
	var lock_components = false;
	var msg = "";

	if(CP.global.isClusterEnabled) {
		if(CP.global.isCluster) { //cadmin mode
			if(CP.global.LockClusterNonSharedFeatureInCAdminMode) {
				if(CP.global.isClusterFeatureShared[feature] != undefined &&
					CP.global.isClusterFeatureShared[feature] == false) {
					msg = "This feature is not configured as a cloning group synchronized feature " + 
						  "and therefore can only be controlled from single gateway's Web UI.";
					lock_components = true;
				}
			}
		} else { //normal mode
			if(CP.global.LockClusterSharedFeatureInAdminMode) {
				if(CP.global.isClusterFeatureShared[feature] != undefined &&
					CP.global.isClusterFeatureShared[feature] == true) {
					msg = "This feature is a cloning group synchronized feature. Configuration of this feature is only allowed from Cloning Group Web UI.";
					lock_components = true;
				}
			}
		}
	}
	
	if(lock_components) {
		for (var i = 0; i < components.length; i++) {	
			if(Ext.getCmp(components[i])) {
				Ext.getCmp(components[i]).locked_by_cluster_config = true;
				Ext.getCmp(components[i]).setDisabled(true);
			}
		}
	}
	
	return msg;
}

,applySysnameHandler: function(){
	var hostField = Ext.getCmp("hostname");
	var domainField = Ext.getCmp("domainname");
	var hostname = hostField.getValue();
	var domainname = domainField.getValue();
	if( hostField.isValid() && domainField.isValid() ){
		var sysparams = {} ;
		sysparams["hostname" ] = hostname;
		sysparams["domainname" ] = domainname;
		sysparams["save" ] = '1';

		Ext.Ajax.request ({
			url: "/cgi-bin/hosts_dns.tcl"
			,params: sysparams
			,method: "POST"
			,success: Ext.Function.bind( CP.Hosts.afterApply, this, [ CP.Hosts.updateSysnameData ])
		});
	}
} 


,applyDNSHandler:function() {
	var primaryFld = Ext.getCmp("primary");
	var secondaryFld = Ext.getCmp("secondary");
	var tertiaryFld = Ext.getCmp("tertiary");
	// var primaryIPV6Fld = Ext.getCmp("primary_ipv6");
	// var secondaryIPV6Fld = Ext.getCmp("secondary_ipv6");
	// var tertiaryIPV6Fld = Ext.getCmp("tertiary_ipv6");	
	var suffix = Ext.getCmp("suffix").getValue();
	var primary = primaryFld.getValue();
	var secondary = secondaryFld.getValue();
	var tertiary = tertiaryFld.getValue();
	// var primaryIPV6 = primaryIPV6Fld.getValue();
	// var secondaryIPV6 = secondaryIPV6Fld.getValue();
	// var tertiaryIPV6 = tertiaryIPV6Fld.getValue();
	var primaryErr = primaryFld.getActiveErrors();
	var secondaryErr = secondaryFld.getActiveErrors();
	var tertiaryErr = tertiaryFld.getActiveErrors();
	// var primaryIPV6Err = primaryIPV6Fld.getActiveErrors();
	// var secondaryIPV6Err = secondaryIPV6Fld.getActiveErrors();
	// var tertiaryIPV6Err = tertiaryIPV6Fld.getActiveErrors();	
	
	if( ( Ext.getCmp("suffix").isValid() || ( suffix == ""))
		&& ( primaryErr.length == 0 ||( primary == ""))
		&&( secondaryErr.length == 0 || ( secondary == "") )
		&& ( tertiaryErr.length == 0 || ( tertiary == "")) 		)
		// && ( primaryIPV6Err.length == 0 ||( primaryIPV6 == ""))
		// && ( secondaryIPV6Err.length == 0 ||( secondaryIPV6 == ""))
		// && ( tertiaryIPV6Err.length == 0 ||( tertiaryIPV6 == "")))
	{
		var sprefix = "hosts:v4:";
		var sysparams = {} ;
		
		sysparams["suffix" ] = suffix;
		sysparams["primary" ] = primary;
		sysparams["secondary" ] = secondary;
		sysparams["tertiary" ] = tertiary;
		// sysparams["primary_ipv6" ] = primaryIPV6;
		// sysparams["secondary_ipv6" ] = secondaryIPV6;
		// sysparams["tertiary_ipv6" ] = tertiaryIPV6;		
		sysparams["save" ] = '1';

		Ext.Ajax.request ({
			url: "/cgi-bin/hosts_dns.tcl"
			,params:sysparams
			,method: "POST"
			,success: Ext.Function.bind( CP.Hosts.afterApply, this, [CP.Hosts.afterDNSApply])
		});
	}
} 


,afterApply: function( callback ){
	CP.util.sendGetRequest( '/cgi-bin/hosts_dns.tcl?option=global', callback );
} 


,afterDNSApply: function( response ){
	//analyze data
	var json = Ext.decode( response.responseText );
	var jData = json.data;
	var suffix = jData.suffix;
	var primary = jData.primary;
	var secondary = jData.secondary;
	var tertiary = jData.tertiary;
	// var primary_ipv6 = jData.primary_ipv6;
	// var secondary_ipv6 = jData.secondary_ipv6;
	// var tertiary_ipv6 = jData.tertiary_ipv6;	
	//update fields
	Ext.getCmp("suffix").setValue( suffix );
	Ext.getCmp("primary").setValue( primary );
	Ext.getCmp("secondary").setValue( secondary );
	Ext.getCmp("tertiary").setValue( tertiary );
	// Ext.getCmp("primary_ipv6").setValue( primary_ipv6 );
	// Ext.getCmp("secondary_ipv6").setValue( secondary_ipv6 );
	// Ext.getCmp("tertiary_ipv6").setValue( tertiary_ipv6 );	
	Ext.getCmp("dns_apply").disable();
	//clear dirty flag
	CP.util.clearFormInstanceDirtyFlag( Ext.getCmp(CP.Hosts.SYSNAME_FORM_ID).getForm() );
}


,updateSysnameData: function( response ){
	var json = Ext.decode( response.responseText );
	var jData = json.data;
	if( jData && jData.hostname ){
		//analyze data
		var domainname = jData.domainname;
		var hostname = jData.hostname;
		//update fields
		Ext.getCmp( "domainname" ).setValue( domainname );
		Ext.getCmp( "hostname" ).setValue( hostname );
		Ext.getCmp( "sysname_apply" ).disable();
		CP.util.clearFormDirtyFlag( CP.Hosts.SYSNAME_FORM_ID ); //clear dirty flag
		//update mainframe
		CP.util.setHostName( hostname );
		CP.Hosts.HOSTNAME = hostname;
		CP.Hosts.hostsAfterSubmit();
	}
}


,enableSysnameApply: function(hostsPanel) {
	Ext.getCmp("sysname_apply").enable();
} 


,enableDNSApply: function(hostsPanel) {
	Ext.getCmp('dns_apply').enable();
}

,addSysNameForm: function( hostsPanel, pageObj){
	hostsPanel.add([{
		xtype:"cp4_sectiontitle",
		titleText: 'System Name'
	},{
		xtype: 'cp4_textfield'
		,fieldLabel:'Host Name'
		,name:'hostname'
		,id:'hostname'
		,allowBlank:false
		,invalidText:'Invalid Hostname.'
		,width:250
		,vtype:'hostname'
		,maxLength: 60
		,enableKeyEvents:true
		,listeners: {
			keyup: CP.Hosts.enableSysnameApply
		 }
	},{
		xtype: 'cp4_textfield'
		,fieldLabel:'Domain Name'
		,name:'domainname'
		,id:'domainname'
		,allowBlank:true
		,invalidText:'Invalid domain name.'
		,width:530
		,vtype:'domainname'
		,enableKeyEvents:true
		,maxLength: 65 // maxLength is acctually 64 and is enforced in  'cp-vtypes4.js'
		,enforceMaxLength: true  // disables keystrokes beyond maxLength
		,listeners: {
			keyup: CP.Hosts.enableSysnameApply
		 }
	},{
		xtype: 'cp4_button',
		text: "Apply",
		id: "sysname_apply",
		disabled: true,
		hideLabel: true,
		handler: CP.Hosts.applySysnameHandler
	}]);
} 


,addDNSForm: function(obj,page) {

	function AvoidIPAddr(value)
	{
		if(isNaN(parseInt(value.charAt(value.length - 1))))
			return true;
		else
			return "Invalid DNS Suffix";
	}


    var dnsForm = Ext.create( 'CP.WebUI4.Container',{ 	
        id: "dns-form",
        items: [{
            xtype:"cp4_sectiontitle"
            ,titleText: 'DNS'
        },{
            xtype: 'cp4_textfield'
            ,fieldLabel: 'DNS Suffix'
			,labelWidth :145
			,name: 'suffix'
			,id:'suffix'
			,allowBlank: true
			,invalidText: 'Invalid DNS Suffix'
			,width:365
			,margin: '0 0 15 0'
			,vtype: 'hostname'
			,enableKeyEvents:true
			,listeners: {
				   keyup: CP.Hosts.enableDNSApply  
			 }
			 ,validator  : AvoidIPAddr
		},{   
			xtype: 'cp4_panel',
			layout: 'column',
			items: [{
						xtype: 'cp4_container',
						items: [
									{
										xtype: 'cp4_IPHybridField',
										id: 'primary',
										fieldName: 'primary',
										width: CP.Hosts.ipv4Width,
										fieldLabel: 'Primary DNS Server',
										labelWidth: 145,
										width: 400,
										fieldConfig: { allowBlank: true },
										listeners: {
											   change: function(){ CP.Hosts.enableDNSApply()  }
										 }
									},{
										xtype: 'cp4_IPHybridField',
										id: 'secondary',
										fieldName: 'secondary',
										width : CP.Hosts.ipv4Width,
										fieldLabel: 'Secondary DNS Server',
										labelWidth: 145,
										width: 400,
										fieldConfig: { allowBlank: true },  
										listeners: {
											   change: function(){ CP.Hosts.enableDNSApply()  }
										 }
									},{
										xtype: 'cp4_IPHybridField',
										id: 'tertiary',
										fieldName: 'tertiary',
										width : CP.Hosts.ipv4Width,
										fieldLabel: 'Tertiary DNS Server',
										labelWidth: 145,
										width: 400,
										fieldConfig: { allowBlank: true }, 
										listeners: {
											   change: function(){ CP.Hosts.enableDNSApply()  }
										 }
									}			
							]
					}]
		},{
			xtype: 'cp4_button',
			text: "Apply",
			id: "dns_apply",
			margin: '15 0 0 0',
			disabled: true,
			hideLabel: true,
			handler: CP.Hosts.applyDNSHandler
		}]
	});
	
	obj.add(dnsForm);
	
	var DnsComponents = ["suffix","primary",
						"secondary","tertiary","dns_apply"];
	
	var msg = CP.Hosts.setClusterSharedFeatureMode("dns",DnsComponents);

	if(msg != "") {
	    var ClusterMsg = new CP.WebUI4.inlineMsg({
	        type: "warning",
	        text: msg
	    });
		obj.add(ClusterMsg);
	}
}

,doLoad: function(formPanel) {
	formPanel.load({
		url: '/cgi-bin/hosts_dns.tcl?option=global',
		method: 'GET'
		,success: function() { 
			CP.Hosts.HOSTNAME=Ext.getCmp("hostname").getValue();
		}
	});
	
	Ext.Ajax.request({
	url: '/cgi-bin/hosts_dns.tcl?option=global',
	method: 'GET',
	success: Ext.Function.bind( CP.Hosts.afterApply, this, [CP.Hosts.afterDNSApply])
	}); 
}

,addTable: function(obj) {
    // Section title
    var hostTitle = Ext.create( 'CP.WebUI4.SectionTitle',{
        titleText: 'Hosts'
    });

    //Add buttons to panel
    var buttonsBar = Ext.create( 'CP.WebUI4.BtnsBar',{
        items: [{
            text: "Add",
            id: "add_new_host_entry",
            handler: function(){ 
                CP.Hosts.addNewHost('New Host');
            }
        },{
            id: "edit_btn",
            text: "Edit",
            disabled: true,
            handler: function() {
                    CP.Hosts.EditRow();
            }
        },{
            id: "remove_btn",
            text: "Delete",
            disabled: true,
            handler: CP.Hosts.showAlertBeforeDeleting
        }]
    });
    
    // store the database
    var hostStore = Ext.create( 'CP.WebUI4.JsonStore',{
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/hosts_dns.tcl',
            reader: {
                type: 'json',
                root: 'data.hosts'
            }
        },
        fields: ['hostname',
                 'ipaddress',
                 'ipv6address']
    });

    // Column Model
    var cm = [
        {header:'Host Name' ,dataIndex: 'hostname' , vtype: 'hostname', flex:1},
        {header: 'IPv4 Address' ,dataIndex:'ipaddress',  vtype: 'ipv4', flex:1 },
        {header: 'IPv6 Address' ,dataIndex:'ipv6address', vtype: 'ipv6', flex:1 }
    ];
    
    // the table
    var gridP = Ext.create( 'CP.WebUI4.GridPanel',{
        id: "hosts_table"
        //,maxHeight: 120
        ,height: 160
        ,width: 550
        ,store: hostStore
        ,columns: cm
        ,listeners: {
            selectionchange: function( gridView, selections ){
                //set buttons
                var editBtn = Ext.getCmp("edit_btn");
                var delBtn = Ext.getCmp("remove_btn");
                if( selections.length == 0 ){
                    editBtn.disable();
                    delBtn.disable();
                }
                else{
                    var hname = selections[0].data.hostname;
                    if( hname == "localhost" || hname == CP.Hosts.HOSTNAME ){
                        editBtn.disable();
                        delBtn.disable();
                        return;
                    }
					if(editBtn.locked_by_cluster_config != true)
						editBtn.enable();
					if(delBtn.locked_by_cluster_config != true)
						delBtn.enable();
                }
            }
            //open edit dialog on row double click
            ,itemdblclick:  {                                                              
                scope: this,                                                  
                fn: function( grid, rowIndex, event ){
                    CP.Hosts.EditRow();

                }
            }
        }
    });
    

    obj.add( hostTitle );
    obj.add( buttonsBar ); // buttons
    obj.add( gridP ); //Add grid
	
	var HostsComponents = ["add_new_host_entry","edit_btn","remove_btn"];
	
	var msg = CP.Hosts.setClusterSharedFeatureMode("hosts",HostsComponents);

	if(msg != "") {
	    var ClusterMsg = new CP.WebUI4.inlineMsg({
	        type: "warning",
	        text: msg
	    });
		obj.add(ClusterMsg);
	}	
}  


,EditRow:function() {
	CP.Hosts.EDIT_HOST_NAME = 1; // Edit
	CP.Hosts.changeHost('Edit Host');
}


,RemoveHosts_Entries:function() {
	var selectedRow = Ext.getCmp( 'hosts_table' ).getSelectionModel().getLastSelected();
	if( !selectedRow ){
		//no selection has been made
		return;
	}
	var v4prefix = "hosts:v4:";
	var v6sprefix = "hosts:v6:";
	var myparams = {};
	myparams[v4prefix + selectedRow.data.hostname ] = "";
	myparams[v4prefix + selectedRow.data.hostname + ":address" ] = "";
	myparams[v6sprefix + selectedRow.data.hostname ] = "";
	myparams[v6sprefix + selectedRow.data.hostname + ":address" ] = "";
	myparams["save" ] = '1';
	
	Ext.Ajax.request ({
			url: "/cgi-bin/hosts_dns.tcl"
			,params:myparams
			,method: "POST"
			,success: CP.Hosts.hostsAfterSubmit
	});
	////submit form
	//CP.UI.submitData( CP.UI.getMyObj());
} 

// show alert before removing the entries
,showAlertBeforeDeleting: function() {
	CP.WebUI4.Msg.show({
		title: 'Deleting Hosts Entries'
		,msg: 'Are you sure you want to delete hosts entries?'
		,buttons: Ext.Msg.YESNO
		,fn: function(button, text, opt) {
			if (button == "yes")
				CP.Hosts.RemoveHosts_Entries();
		}
		,icon: Ext.Msg.QUESTION
	});
} 


// the function which stores the host information to the DB (makes POST)
,AddNewHostEntry:function(host_name, ipv4_addr, ipv6_addr){
	var myparams = {} ;
	var v4prefix = "hosts:v4:";
	var v6prefix = "hosts:v6:";
	var hostExist = 0;
	var store = (Ext.getCmp('hosts_table')).getStore();
	if ( CP.Hosts.EDIT_HOST_NAME != 1){
		store.each(function(rec) {
			var rec_host = rec.get('hostname'); 
			if ( host_name == rec_host ){
				CP.WebUI4.Msg.show({
				   title: 'Error',
				   msg: 'Host name exists',
				   buttons: Ext.Msg.OK,
				   icon: 'webui-msg-error'
				});
				hostExist = 1;
				return;
			}
		});
	}
	if (hostExist == 1 ){
		return;
	}

	myparams[v4prefix + host_name ] = 't';
	myparams[v4prefix + host_name + ":address" ] = ipv4_addr;
	myparams[v6prefix + host_name ] = 't';
	myparams[v6prefix + host_name + ":address" ] = ipv6_addr;
	myparams["apply"] = '1';
	myparams["save" ] = '1';
		
	Ext.Ajax.request ({
		url: "/cgi-bin/hosts_dns.tcl"
		,params:myparams
		,method: "POST"
		,success: CP.Hosts.hostsAfterSubmit
	});
}

//add a new host window
,addNewHost:function( title) {
	CP.Hosts.EDIT_HOST_NAME = 0;
	CP.Hosts.changeHost(title);
}

,changeHost:function( title) { 
	CP.Hosts.declareWindow();
	if ( CP.Hosts.EDIT_HOST_NAME == 1 ){
		var selectedRow = Ext.getCmp( 'hosts_table' ).getSelectionModel().getLastSelected();
		if( !selectedRow ){
			//no selection has been made 
			return;
		}
		var hname = selectedRow.data.hostname;
        if( hname == "localhost" || hname == CP.Hosts.HOSTNAME ){
			//edit localhost is forbiden
            return;
        }
		Ext.getCmp('host_name').setValue(selectedRow.data.hostname);
		Ext.getCmp('ip_addr').setValue(selectedRow.data.ipaddress);
		Ext.getCmp('ipv6_addr').setValue(selectedRow.data.ipv6address);
		Ext.getCmp('host_name').disable();
	}
	var winObj = Ext.getCmp('add_host_window');
	winObj.setTitle( title );
	winObj.show();
} 


//create window
,declareWindow: function() {
	//Add form
	var form = Ext.create( 'CP.WebUI4.FormPanel',{
		bodyStyle: 'padding:10px;',
		id: 'add_host_form',
		boxMaxHeight: 150,
		items: [{
			xtype: 'cp4_textfield'
			,fieldLabel: 'Host Name'
			,id: "host_name"
			,name: "host_name"
			,width: 200
			,vtype: "hostname"
			,allowBlank : false
		},{
			xtype: 'cp4_ipv4field',
			id: 'ip_addr',
			fieldName: 'ip_addr',
			fieldConfig: { allowBlank: true }
		},{
			xtype: 'cp4_ipv6field',
			id: 'ipv6_addr',
			name: 'ipv6_addr',
			fieldLabel: 'IPv6 Address',
			llabelWidth: 80
		},{
			xtype: 'cp4_displayfield',
			id: 'error',
			width: 250,
			msgTarget: 'under'
		}],
		//Save and cancel buttons
		buttons: [{
			text: 'OK',
			xtype: 'cp4_button',
			handler: function(){
				if( !Ext.getCmp( 'add_host_form' ).getForm().isValid()){
					return;
				}
				var hostName = Ext.getCmp("host_name").getValue();
				var ipAddr = Ext.getCmp("ip_addr").getValue();
				var ipv6 = Ext.getCmp('ipv6_addr').getValue();
				
				// At least one IP is set
				// if IP is set its valid
				if(  hostName != ""  && ( ipAddr != "" || ipv6 != "" )){
					CP.Hosts.AddNewHostEntry( hostName, ipAddr, ipv6 );
					Ext.getCmp( 'add_host_window' ).close();
					CP.Hosts.EDIT_HOST_NAME = 0;
				} else{
					Ext.getCmp('error').markInvalid('IPv4 address or IPv6 address is required');
				}
			}
		},{
			text: 'Cancel',
			xtype: 'cp4_button',
			handler: function(){
				Ext.getCmp( 'add_host_window' ).close();
			}
		}]
	});

	//Modal window for add
	var modalWin = new CP.WebUI4.ModalWin({
		id: 'add_host_window',
		width: 500,
		height: 190,
		items: [ form ]
	});
}


,hostsAfterSubmit:function(jsonResult) {
    var hostsGrid = Ext.getCmp("hosts_table");
    var hostsStore = hostsGrid.getStore();
    hostsStore.load(hostsStore.lastOptions);
    Ext.getCmp("remove_btn").disable();
    Ext.getCmp("edit_btn").disable();
	var jsonData = Ext.decode(jsonResult.responseText);
	CP.util.setStatusMsg(jsonData);
} 

,afterSubmit:function(form, action){
	//reload the page
	CP.Hosts.init();
} 

} //CP.Hosts
