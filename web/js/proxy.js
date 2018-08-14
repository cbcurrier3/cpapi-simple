
CP.Proxy = {

init:function() {
	var portLastValue= "";
	
	
	
	var top_panel = {
            xtype: 'cp4_fieldcontainer',
            combineErrors : false,
            items: [
			{				
				xtype:"cp4_checkbox"
				,checked:true
				,fieldLabel:""
				,width: 125
				,margin: '0 0 5 0'
				,hideLabel: false
				,boxLabel:"Use a Proxy server"
				,id         : "checkbox"
				,name       : "checkbox"
				,listeners: {
						change: function(rb, newVal, oldVal, opt) {
							if (!rb.disabled) {
								CP.Proxy.doFieldEnable(newVal);
								Ext.getCmp('applyBtn').enable();
							}
						}
						
				}
			},{
				xtype: 'cp4_domainnameAndIPv6',
				id: 'ip_id',
				//fieldName: 'IPHybridField',
				width: 365,
				margin: '0 0 5 0',
				labelWidth: 0,
				fieldConfig: { allowBlank: false },
				enableKeyEvents:true,
				listeners: {
					change: function(rb, newVal, oldVal, opt) {Ext.getCmp('applyBtn').enable();}					
				},				
				 disabled:false	
			}],
			margin: '0 0 0 0',
			paddin: '0 0 0 0'
        };
	
	
    var ProxyPanel = Ext.create('CP.WebUI4.DataFormPanel',{
        id: 'proxyPanel',
		listeners: {
			render: CP.Proxy.doLoad
		},
		items: [{
				xtype: "cp4_sectiontitle"
				,titleText: "Proxy Settings"
				
			},
			top_panel
			,{
				xtype: 'cp4_positiveint'
				,margin: '0 0 10 20'
				,id:'port'
				,width     : 180
				,allowBlank: false 
				,fieldLabel: 'Port'
				,name:'port' 
				,minValue: 1
				,maxValue: 65535	
				,enableKeyEvents: true
				,listeners: {
					change: function(rb, newVal, oldVal, opt) {	
					//we want to anable the apply btn on every key change of the field
					Ext.getCmp('applyBtn').enable();}					
				}
			},{
				xtype: 'cp4_button'				
				,text: "Apply"
				,disabled: true
				,id: 'applyBtn'				
				,hideLabel: true
				,handler: function(){
				
						if (Ext.getCmp('checkbox').checked	=== true ){
							//validate							
							var ipv_add_ = Ext.getCmp("ip_id");
							var port_ = Ext.getCmp("port");
							if (ipv_add_.getValue()==="") {
								port_.validate();
								ipv_add_.markInvalid("The field is required");
								return;
							}			
							if (Ext.getCmp('proxyPanel').getForm().isValid() === true)	{				
								CP.Proxy.saveHandler();								
								CP.Proxy.portLastValue = port_.getValue();
								this.disable();
							}
						}
						else {
							CP.Proxy.deleteHandler();	
							this.disable();							
						}
						
				}					
		}]
					
    });


    var page = {
        title:"General Settings"
		,panel:ProxyPanel
		,cluster_feature_name : "proxy"
        ,params : {}
        ,submitURL : '/cgi-bin/proxy.tcl'
        ,afterSubmit : CP.Proxy.doLoad
    };
    
    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(page);    
}

// Load table settings
,doLoad: function(formPanel) {
	Ext.Ajax.request({
        url: '/cgi-bin/proxy.tcl',
        method: 'GET',
		success: function (jsonResult){
			var jsonData = Ext.decode(jsonResult.responseText);
			var ip_n = jsonData.data.jIP;
			var port_n = jsonData.data.jPort;
			Ext.getCmp('ip_id').setValue(ip_n);
			Ext.getCmp('port').setValue(port_n);			
			if (port_n === "" && ip_n === "") {
				Ext.getCmp('checkbox').setValue(false);
			}
			else {
				Ext.getCmp('checkbox').setValue(true);
			}		
			CP.util.clearFormInstanceDirtyFlag( Ext.getCmp('proxyPanel').getForm() );
			Ext.getCmp('applyBtn').disable();
			
		}
    });
}

,doFieldEnable: function(isEnabled){
	
	var port_ = Ext.getCmp("port");
	if(isEnabled === true){
		Ext.getCmp("ip_id").enable();						
		port_.enable();
		if (CP.Proxy.portLastValue !== "" && port_.getValue() === null) {
			port_.setValue(CP.Proxy.portLastValue);
		}
	}		
	else{
		Ext.getCmp("ip_id").disable();	
		//save port num to this session, next time the user will anable the proxy
		CP.Proxy.portLastValue = port_.getValue();				
		port_.disable();
		port_.clearInvalid();
		Ext.getCmp("ip_id").clearInvalid();
	}
}


// Apply settings 
,saveHandler: function() {	
	//get params object
	var pageObj = CP.UI.getMyObj();
	pageObj.params = {}; //clear out old form params
	var params = pageObj.params;
		params["jIP"] = Ext.getCmp("ip_id").getValue();
		params["jPort"] = Ext.getCmp("port").getValue();
	//submit form
	CP.UI.submitData( pageObj );
}

,deleteHandler: function() {		
	//get params object
	var pageObj = CP.UI.getMyObj();
	pageObj.params = {}; //clear out old form params
	var params = pageObj.params;
		params["jIP"] = "";
		params["jPort"] = "";
	//submit form
	CP.UI.submitData( pageObj );
}


}

