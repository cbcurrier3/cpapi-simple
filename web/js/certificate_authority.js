CP.CA = {
	/*	Globals		*/
	GLOBAL_LABELWIDTH: 200,
	GLOBAL_TEXTWIDTH: 400,
	
init: function() {
    var caPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id: 'ca_panel'
        ,items: [{
        	xtype: "cp4_sectiontitle"
			,titleText: "Certificate Authority"
			},{
				xtype               : "cp4_displayfield"
				,fieldLabel         : "Certificate Authority Status"
				,id                 : "ca_status"
				,labelWidth         : CP.CA.GLOBAL_LABELWIDTH
				,width              : CP.CA.GLOBAL_LABELWIDTH + CP.CA.GLOBAL_TEXTWIDTH
				,height             : 22
				,disabled			: true
				,value              : ""
			},{
				xtype               : "cp4_displayfield"
				,fieldLabel         : "Security Management DN"
				,id                 : "ca_mgmt_dn"
				,labelWidth         : CP.CA.GLOBAL_LABELWIDTH
				,width              : CP.CA.GLOBAL_LABELWIDTH + CP.CA.GLOBAL_TEXTWIDTH
				,height             : 22
				,disabled			: true
				,value              : ""
			},{
				xtype               : "cp4_displayfield"
				,fieldLabel         : "Fingerprint"
				,id                 : "ca_fingerprint"
				,labelWidth         : CP.CA.GLOBAL_LABELWIDTH
				,width              : CP.CA.GLOBAL_LABELWIDTH + CP.CA.GLOBAL_TEXTWIDTH
				,height             : 22
				,disabled			: true
				,value              : ""
			},{
				xtype: 'cp4_button'
				,id: 'ca_reset'
				,text: 'Reset'
				,disabled: true
				,handler: CP.CA.verifyResetCA
			}
		]
    });
	
    var page = {
    		title:"Certificate Authority"
    		,panel: caPanel
			,params : {}
			,submitURL : '/cgi-bin/certificate_authority.tcl'
            ,afterSubmit : CP.CA.getDataAndLoad
    };
	
	CP.CA.getDataAndLoad();	

    CP.UI.updateDataPanel(page);
},

getDataAndLoad: function(){
	Ext.Ajax.request({
			url: '/cgi-bin/certificate_authority.tcl'
			, method: 'GET'
			, success: function(response) {
							CP.CA.loadDataToFields(response);
							CP.CA.enableFields();
			}
			,failure: function() {Ext.Msg.alert("Error","Unable to receive data from the server.");}
	});
},

sendDataAndReload: function(){
	
	//get params object
	var pageObj = CP.UI.getMyObj();
	pageObj.params = {}; //clear out old form params
	var params = pageObj.params;
	params["operation"] = "reset";
	
	CP.UI.submitData( pageObj );
},

loadDataToFields: function(response){
	var jsonData = Ext.decode(response.responseText);
	var status = Ext.String.htmlDecode(jsonData.data.status);
	Ext.getCmp('ca_status').setValue( (status=="true") ? "Established" : "Not Established");
	var mgmt_dn = Ext.String.htmlDecode(jsonData.data.mgmt_dn);
	Ext.getCmp('ca_mgmt_dn').setValue(mgmt_dn);
	var fingerprint = Ext.String.htmlDecode(jsonData.data.fingerprint);
	Ext.getCmp('ca_fingerprint').setValue(fingerprint);
},
verifyResetCA: function(){
	CP.WebUI4.Msg.show({ //display message
					title: "Certificate Authority Reset"
					,msg: "Are you sure you want to reset the Certificate Authority?"
					,animEl: 'elId'
					,icon: 'webui-msg-warning'
					,buttons: Ext.Msg.OKCANCEL
					,fn: function( button, text, opt ){
						if( button == "ok" )
							CP.CA.resetCA();
					}
					});
},
resetCA: function(){
    // Ext.getCmp('ca_reset').disable();
	CP.CA.disableFields();
    CP.CA.sendDataAndReload();
},

enableFields: function(){
	var itemsArr = Ext.getCmp('ca_panel').items
	var perm = CP.util.featurePermission("certificate_authority");
	for (i=0; i<itemsArr.length; i++) {
			if (("ca_reset" != itemsArr.items[i].id) || (("rw" == perm)&&(-1 != CP.global.token))){
				itemsArr.items[i].enable();
			}
	}
},

disableFields: function(){
	var itemsArr = Ext.getCmp('ca_panel').items
	for (i=0; i<itemsArr.length; i++) {
		if (itemsArr.items[i].xtype == 'cp4_sectiontitle'){
			continue;
		}
		if (itemsArr.items[i].xtype == 'cp4_displayfield'){
			itemsArr.items[i].setValue("");
		}
		itemsArr.items[i].disable();
	}
}

}

