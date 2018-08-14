
CP.netaccess = {

init: function() {	
    var NetAccessPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"netaccess-panel"
        ,items: [{	
        	xtype: "cp4_sectiontitle"
			,titleText: "Network Access"
		},{
            xtype:"cp4_checkbox"
            ,checked:false
            ,fieldLabel:""
            ,hideLabel: false
            ,boxLabel:"Enable Telnet"
            ,lableWidth:10
            ,width:100
            ,name:"telnetStat"
            ,id:"telnetStat"
            ,value:100
            ,handler: CP.netaccess.OnCheckTelnetCheckbox
        },{
			xtype: "cp4_button"
			,id: "sysname_apply"
			,disabled: true
			,text: "Apply"
			,hideLabel: true
			,handler: function(){				
				if( Ext.getCmp("telnetStat").checked ) 	{
					// Telnet is not secure! display a warning
					CP.WebUI4.Msg.show({ //display message
							title: 'Enabling Telnet'
							,msg: "Telnet is an insecure protocol.<br>Are you sure you want to enable it anyway?"
							,animEl: 'elId'
							,icon: 'webui-msg-warning'
							,buttons: Ext.Msg.YESNO
							,fn: function( button, text, opt ){
								if( button == "yes" )
									CP.UI.applyHandler(page);
							}
					});
				}else {	//disabling the Telnet protocol			
					CP.UI.applyHandler(page);
				}
			}
        }]
        ,listeners: {
              render: CP.netaccess.doLoad
        }
    });

    var page = {
        title:"Network Access configuration"
        ,panel: NetAccessPanel
		,cluster_feature_name : "net-access"
        ,submitURL:"/cgi-bin/netaccess.tcl"
        ,afterSubmit:CP.netaccess.afterSubmit
        ,params:{}
    };

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/netaccess.tcl',
        method: 'GET',
        success: function (){
    		Ext.getCmp("sysname_apply").disable();
    	}
    });
},

doApply: function() {
    Ext.Msg.alert('apply', 'clicked');
},

afterSubmit:function(form, action){
    //reload the page
    CP.netaccess.init();
},

OnCheckTelnetCheckbox:function(form, action){
	CP.netaccess.submitOn(form, action);
},


submitOn:function(form, action){
	// enable submit button
	Ext.getCmp("sysname_apply").enable();
}

}

