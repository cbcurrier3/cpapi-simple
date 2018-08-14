
CP.GeneraSettings = {

init:function() {
		
    var GeneralPanel = Ext.create('CP.WebUI4.DataFormPanel',{
        id: "general_settings_panel",
		listeners: {
			render: CP.GeneraSettings.doLoad
		}
    });
	
	CP.GeneraSettings.addTable(GeneralPanel);

    var page = {
        title:"General Settings"
		,panel:GeneralPanel
		,cluster_feature_name : "http"
        ,params : {}
        ,submitURL : '/cgi-bin/general_settings.tcl'
        ,afterSubmit : CP.GeneraSettings.doLoad
    };
    
    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(page);    
}

// Load table settings
,doLoad: function(formPanel) {
	Ext.Ajax.request({
        url: '/cgi-bin/general_settings.tcl',
        method: 'GET',
		success: function (jsonResult){
			var jsonData = Ext.decode(jsonResult.responseText);
			Ext.getCmp('Inactivity_timeout').setValue(jsonData.data.Inactivity_timeout);
			Ext.getCmp('web_session_timeout').setValue(jsonData.data.web_session_timeout);
			Ext.getCmp('web_grid_refresh_rate').setValue(jsonData.data.web_grid_refresh_rate);
			if(jsonData.data.web_grid_refresh_rate)
				CP.global.GridRefreshRate = jsonData.data.web_grid_refresh_rate; //update the global variable
			//clean dirty flag
			Ext.getCmp('Inactivity_timeout').originalValue = jsonData.data.Inactivity_timeout;
			Ext.getCmp('web_session_timeout').originalValue = jsonData.data.web_session_timeout;
			Ext.getCmp('web_grid_refresh_rate').originalValue = jsonData.data.web_grid_refresh_rate;
			
			Ext.getCmp('general_settings_apply').disable();
		}
    });
}

/* Main Grid */ 
,addTable: function(obj) {
    // Title section
	var cliTitle = Ext.create('CP.WebUI4.SectionTitle', {
    	titleText: 'Command Line Shell'
    });
	
	// Inactivity period field section
    var InactivityTimeoutForm = Ext.create('CP.WebUI4.Panel', {  
		width: 300,
		layout:'column',
        items: [{
						xtype     : 'cp4_positiveint',
						width     : 190,
						fieldLabel: 'Inactivity Timeout',
						name:'Inactivity_timeout' ,
						id:'Inactivity_timeout' ,
						allowBlank: false ,                 
						minValue: 1,
						maxValue: 720,
						listeners: {
								change : CP.GeneraSettings.enableApply
						}
						},{
						xtype: 'cp4_label',
						text: 'minutes',
						margin: '2 0 0 10',
						flex: 1
				}]
	});
	
	
    var webUITitle = Ext.create('CP.WebUI4.SectionTitle', {
		titleText: 'Web UI'
	});	
    
    // Web session timeout field section
    var WebSessionTimeoutForm = Ext.create('CP.WebUI4.Panel', { 
        width     : 300,
		layout:'column',
        items: [{
                xtype     : 'cp4_positiveint',
                width     : 190,
				fieldLabel: 'Inactivity Timeout',
                name:'web_session_timeout', 
                id:'web_session_timeout',       
                allowBlank: false ,                 
                minValue: 1,
                maxValue: 720,
		        listeners: {// on change - make the "apply" button accessible
		            change :  CP.GeneraSettings.enableApply 		                 		
		        }		        
         	},{
				xtype: 'cp4_label',
				text: 'minutes',
				margin: '2 0 0 10',
				flex: 1
			},{
                xtype     : 'cp4_positiveint',
                width     : 190,
				fieldLabel: 'Table Refresh',
                name:'web_grid_refresh_rate', 
                id:'web_grid_refresh_rate',       
                allowBlank: false ,                 
                minValue: 10,
                maxValue: 240,
		        listeners: {// on change - make the "apply" button accessible
		            change :  CP.GeneraSettings.enableApply 		                 		
		        }		        
         	},{
				xtype: 'cp4_label',
				text: 'seconds',
				margin: '2 0 0 10',
				flex: 1
			}
		
		]
    });     
	
	
	
    
    // Apply button section
    var applyBtn = Ext.create('CP.WebUI4.Button', {
		name: 'apply'
		,id: 'general_settings_apply'
		,text: "Apply"
		,disabled: true
	    ,hideLabel: true
		,handler: function(){
				if ( Ext.getCmp("Inactivity_timeout").isValid() &&
						Ext.getCmp("web_session_timeout").isValid()	&& 
						Ext.getCmp("web_grid_refresh_rate").isValid() ){	
					CP.GeneraSettings.saveHandler();
					CP.global.sessionTimeout = Ext.getCmp("web_session_timeout").value * 60000 -5000; /*Apply settings as of now*/
					CP.util.startSessionTimer(); /*Start a new session timer*/
				}
		}
	});
	
	// Add sections to the table
	obj.add(cliTitle);				// Nice Title dividing line
	obj.add(InactivityTimeoutForm);	
	obj.add(webUITitle);			// Nice Title dividing line
	obj.add(WebSessionTimeoutForm);	
	obj.add({
		xtype: 'cp4_inlinemsg',
		text: 'The table refresh rate specifies the refresh rate (in seconds)<br>in which some tables in the Web-UI are refreshed.',
		margin: '0 0 10 0'
	});
	
	
	obj.add(applyBtn);	

}	/* Main Grid -  End  */


	/*	Helper Methods	*/

,enableApply: function(GeneralPanel) {
    Ext.getCmp('general_settings_apply').enable();
}
	
// Apply settings 
,saveHandler: function() {	

	//get params object
	var pageObj = CP.UI.getMyObj();
	pageObj.params = {}; //clear out old form params
	var params = pageObj.params;
        
	params["inactto:default"] = Ext.getCmp("Inactivity_timeout").getValue();
	params["httpd:toutsession"] = Ext.getCmp("web_session_timeout").getValue();
	params["webui:grid_refresh_rate"] = Ext.getCmp("web_grid_refresh_rate").getValue();

	//submit form
	CP.UI.submitData( pageObj );
}

}
