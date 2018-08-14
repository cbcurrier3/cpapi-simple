
CP.Fcd = {
releasesMap: {},

init: function() {
	var fhaSettingsTitle = Ext.create ( 'CP.WebUI4.SectionTitle',{
		titleText: 'Factory Defaults'
	});
	
    var applyBtn = Ext.create ( 'CP.WebUI4.Button',{
		id: 'fcd_apply'
	 	, style: 'margin-top:10px;margin-bottom:20px;'
		, text: 'Apply'
	});
	
    var rbPanel = Ext.create ( 'CP.WebUI4.DataPanel',{
		id:"fcd-rb-panel",
    	style: 'padding-left:0px;'
	});
    
    var fcdPanel = Ext.create ( 'CP.WebUI4.DataFormPanel',{    
		id:"fcd-panel"
		,items: [
			fhaSettingsTitle,
			rbPanel,
			applyBtn
		]
	});
	CP.Fcd.doLoad(rbPanel);
	
	var page = {
		title:"Factory Defaults"
		,panel: fcdPanel
		,submitURL:"/cgi-bin/img_mgmt.tcl"
		,params:{}
    	,beforeSubmit:CP.Fcd.beforeSubmit
		,afterSubmit:CP.Fcd.afterSubmit
	};
	
	CP.UI.updateDataPanel(page);
    
    applyBtn.setHandler(Ext.Function.bind(CP.Fcd.applyHandler,this,[page]));                                                             
},

doLoad: function(formPanel){
	CP.Fcd.waitMask.show();
	Ext.Ajax.request({
		url: "/cgi-bin/img_mgmt.tcl"
		,method: "GET"
		,params: {releases:"true"}
		,success: function(jsonResult) {    
			CP.Fcd.waitMask.hide();		
			var rbArr = [];
		  	var rbHandler = function (enabledCmpID, idsArr) {
		  		var len = idsArr.length;
		  		for (var i = 0; i < len; i++) {
		  			if ( idsArr[i] != enabledCmpID ) {
		  				Ext.getCmp(idsArr[i]).setValue(false);
		  			}
		  		}		
			};

			var jsonData = Ext.decode(jsonResult.responseText);
			if (jsonData.data.fcd && jsonData.data.fcd.length > 0) {
				var len = jsonData.data.fcd.length;
				
				for (var i = 0; i < len; i++){
					var rbId = "fcd_rb_release_" + i;
					var rbLabel = "Revert to " + jsonData.data.fcd[i].img_os + " " + jsonData.data.fcd[i].img_version;
					var rbChecked = (i == 0);
                    var rb = Ext.create ( 'CP.WebUI4.Radio',{   
						id: rbId,
						name: 'fcd_rb_release',
						boxLabel:rbLabel,
						checked: rbChecked,
						hideLabel: true,
						inputValue: jsonData.data.fcd[i].img_name,
						handler: function (radiobox, checked) {
							if (checked)
								rbHandler(radiobox.getId(),rbArr);
						}
					});
					formPanel.add(rb);
					CP.Fcd.releasesMap[jsonData.data.fcd[i].img_name] = jsonData.data.fcd[i].img_name;
					rbArr[i] = rbId;
				}
				formPanel.doLayout();
			}
		}, 
		failure: function(jsonResult) {
			CP.Fcd.waitMask.hide();
		}
	});
},

applyHandler: function(page) {
	var rMsg = "The system will be rebooted and reverted to " 
		+ Ext.getCmp('fcd-panel').getForm().getValues().fcd_rb_release
		+ ". Are you sure you want to continue?";
	CP.WebUI4.Msg.show({
		title:'Factory Defaults'
			, msg: rMsg
			, buttons: Ext.Msg.YESNO
			, icon: 'webui-msg-warning'
				, fn: function(btn, text){
					if(btn == "yes"){
						CP.UI.applyHandler(page);
						CP.util.rebootingWindow('Reverting to factory defaults',
												'Please wait while system is reverting.',
												30000);
					}
				}
	});
	
},

beforeSubmit:function(panel){
	this.params.trigger = "revert-btn";
	this.params.name = CP.Fcd.releasesMap[Ext.getCmp('fcd-panel').getForm().getValues().fcd_rb_release];
},

afterSubmit:function(form, action){
}

,waitMask: new Ext.LoadMask(Ext.getBody(), {msg:"Please wait few moments while the data is loaded..."})

}
