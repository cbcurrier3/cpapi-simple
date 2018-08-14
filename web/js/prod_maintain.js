
CP.PMaintain = {
mPage: null,
ucLink: null,
mgmt_mac: "",
serial:"",
ledDescription:'Appliance location LED is located on the front panel of the appliance and can be used to identify the appliance.<br>Current State: ',
ledValue: null,
init: function() {
	var pmTitle = Ext.create ( 'CP.WebUI4.SectionTitle',{
		titleText: 'Maintenance Commands'
	});
    
    var mPanel = Ext.create ( 'CP.WebUI4.DataFormPanel',{    
		id:"maint-panel"
		,hidden:true
		,timeout: 300 //5 minutes for the submit to complete
		,url: '/cgi-bin/prod_maintain.tcl'
		,items: [
			pmTitle,
			{
				xtype: 'cp4_panel',
				layout: 'hbox',
				height: 50,
				padding: "5 0 5 0",
				items: [{
					xtype: 'cp4_button',
					text: 'Start Appliance Services',
					width: 150,
					handler: function(){
						CP.WebUI4.Msg.show({
		                    title:'Start Appliance Services',
		                    msg: 'You are about to start all Check Point processes and applications.<br>Are you sure you want to continue?',
		                    buttons: Ext.Msg.OKCANCEL,
		                    icon: Ext.Msg.QUESTION,
		                    fn: function(btn, text){
		                        if (btn == "cancel")
		                            return;

		                        CP.PMaintain.applyHandler({action:'start'});
		                    }
		                });
					}
				},{
					xtype: 'cp4_panel',
					html: 'This function will start all Check Point processes and applications running on the appliance.',
					padding: 5,
					flex:1
				}]
			},{
				xtype: 'cp4_panel',
				layout: 'hbox',
				height: 50,
				padding: "5 0 5 0",
				items: [{
					xtype: 'cp4_button',
					text: 'Stop Appliance Services',
					width: 150,
					handler: function(){
						CP.WebUI4.Msg.show({
		                    title:'Stop Appliance Services',
		                    msg: 'You are about to stop all Check Point processes and applications.<br>Are you sure you want to continue?',
		                    buttons: Ext.Msg.OKCANCEL,
		                    icon: Ext.Msg.QUESTION,
		                    fn: function(btn, text){
		                        if (btn == "cancel")
		                            return;

		                        CP.PMaintain.applyHandler({action:'stop'});
		                    }
		                });
					}
				},{
					xtype: 'cp4_panel',
					html: 'This function will terminate all Check Point processes and applications running on the appliance.',
					padding: 5,
					flex:1
				}]
			},{
				xtype: 'cp4_panel',
				layout: 'hbox',
				height: 50,
				padding: "5 0 5 0",
				items: [{
					xtype: 'cp4_button',
					text: 'Restart Appliance Services',
					width: 150,
					handler: function(){
						CP.WebUI4.Msg.show({
		                    title:'Restart Appliance Services',
		                    msg: 'You are about to restart all Check Point processes and applications.<br>Are you sure you want to continue?',
		                    buttons: Ext.Msg.OKCANCEL,
		                    icon: Ext.Msg.QUESTION,
		                    fn: function(btn, text){
		                        if (btn == "cancel")
		                            return;

		                        CP.PMaintain.applyHandler({action:'restart'});
		                    }
		                });
					}
				},{
					xtype: 'cp4_panel',
					html: 'This function will restart all Check Point processes and applications running on the appliance.',
					padding: 5,
					flex:1
				}]
			},{
				xtype: 'cp4_panel',
				layout: 'hbox',
				height: 50,
				padding: "5 0 5 0",
				items: [{
					xtype: 'cp4_button',
					id: 'led_button',
					name: 'led_button',
					text: 'Turn On Location LED',
					width: 150,
					handler: function(){					
						
						if(CP.PMaintain.ledValue == "on")
							CP.PMaintain.applyHandler({action:'lcd',location_led:'off'});							
						else							
							CP.PMaintain.applyHandler({action:'lcd',location_led:'on'});						
					}		                       
		            
				},{
					xtype: 'cp4_panel',
					id: 'ledDescription_panel',
					name: 'ledDescription_panel',
					html: null,
					padding: '0 5 5 5',
					flex:1
					
				}]
			},
			{
				xtype: 'cp4_panel',
				id: 'link_panel',
				hidden: true,
				layout: 'hbox',
				height: 50,
				padding: "5 0 0 0",
				items: [{
					xtype: 'cp4_button',
					id: 'link_button',
					width: 150,
					margin: "4 0 6 0",
					handler: function(){
						CP.WebUI4.Toppanel.post_to_url(CP.PMaintain.ucLink, 
								{
									SN: CP.PMaintain.serial,
									MACAddress: CP.PMaintain.mgmt_mac
								},
								"POST",true);
					}
				},{
					xtype: 'cp4_panel',
					html: 'Go to Check Point User Center in order to create a Service Request, search Technical Knowledge Base, <br>access the Download Center, manage your Accounts & Products, get the latest Check Point News Update.',
					padding: 5,
					flex:1
				}],
				listeners:{
					afterrender: function(cmp, opt){
					    mPanel.load({
					    	method: 'GET',
					    	success: function(form, action){
					    		if (action.result.data.model)
					    			Ext.getCmp('link_button').setText(action.result.data.model + " Home Page");
					    		else
					    			Ext.getCmp('link_button').setText("Home Page");
					    			
					    		if (action.result.data.link){
					    			CP.PMaintain.ucLink = action.result.data.link;
					    			Ext.getCmp('link_panel').setVisible(true);
					    		}
								
								if (!action.result.data.hw_indicator || action.result.data.hw_indicator != "yes"){
									
									Ext.getCmp('led_button').setVisible(false);
									Ext.getCmp('ledDescription_panel').setVisible(false);						
								
								}
																
								if(action.result.data.location_led && action.result.data.location_led == "on"){
									CP.PMaintain.ledValue = action.result.data.location_led;
									Ext.getCmp('led_button').setText("Turn Off Location LED");
									
								}
								else
									CP.PMaintain.ledValue = 'off';
								
								Ext.getCmp('ledDescription_panel').update(CP.PMaintain.ledDescription + CP.PMaintain.ledValue,null,null,null);
								
					    		mPanel.show();
					    		
					    		CP.PMaintain.mgmt_mac = action.result.data.mgmt_mac;
					    		CP.PMaintain.serial = action.result.data.serial;
					    	}
					    });
					}
				}
			}
		]
	});
	
    CP.PMaintain.mPage = {
		title:"Maintenance Commands"
		,panel: mPanel
		,submitURL:"/cgi-bin/prod_maintain.tcl"
		,params:{}
    	,beforeSubmit:CP.PMaintain.beforeSubmit
		,afterSubmit:CP.PMaintain.afterSubmit
		,submitFailure:CP.PMaintain.submitFailure
	};
	
	CP.UI.updateDataPanel(CP.PMaintain.mPage);
},

applyHandler: function(values) {

	CP.PMaintain.mPage.params = values;
	CP.UI.applyHandler(CP.PMaintain.mPage);
},

waitMask: new Ext.LoadMask(Ext.getBody(), {msg:"Please wait few moments while the action performed..."}),

beforeSubmit:function(panel){
	CP.PMaintain.waitMask.show();
},

afterSubmit:function(){
	
	if(CP.PMaintain.mPage.params.action == "lcd"){
		
		if(CP.PMaintain.ledValue == "on"){
			CP.PMaintain.ledValue = "off" ;
			Ext.getCmp('led_button').setText('Turn On Location LED');			
		}
		else{
			CP.PMaintain.ledValue = "on" ;
			Ext.getCmp('led_button').setText('Turn Off Location LED');									
		}
						
		Ext.getCmp('ledDescription_panel').update(CP.PMaintain.ledDescription + CP.PMaintain.ledValue,null,null,null);	
	
	}
	
	CP.PMaintain.waitMask.hide();
	
},
submitFailure:function(){
	CP.PMaintain.waitMask.hide();
}

}
