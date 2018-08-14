
CP.lldp = {

init: function() {
    var LldpPanel = new CP.WebUI.DataFormPanel({
		id:"lldp-panel"
		,items: [{
			xtype:"cp_fieldset"
			,title:""
			,width:423
			,checkboxToggle:false
			,animCollapse:true
			,border: false
			,items:[{	
	            xtype:"cp_checkbox"
	            ,checked:false
	            ,fieldLabel:""
	            ,hideLabel: true
	            ,boxLabel:"Enable LLDP"
	            ,labelWidth:10
	            ,name:"LldpStat"
				,id:"LldpStat"
	            ,value:100
	            ,listeners: {
					check: CP.lldp.OnCheckBannerCheckbox
           	    }
	        }
			/*,{
				  xtype: 'radiogroup',
				  columns: 1,
				  hideLabel: true,
				  items: [
					   {boxLabel: 'Send LLDP to all interfaces', name: 'rb-auto', inputValue: 1},
					   {boxLabel: 'Send LLDP to a single interface', name: 'rb-auto', inputValue: 2, checked: true},
					]
			}*/
			]
	     }]
        ,listeners: {
              render: CP.lldp.doLoad
          }
    });

    var page = {
        title:"Link Layer Discovery Protocol"
        ,panel: LldpPanel
        ,submit:true
        ,submitURL:"/cgi-bin/lldp.tcl"
        ,afterSubmit:CP.lldp.afterSubmit
        ,params:{}
    }

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/lldp.tcl',
        method: 'GET'
    });
},

doApply: function() {
    Ext.Msg.alert('apply', 'clicked');
},

afterSubmit:function(form, action){
    //reload the page
    CP.lldp.init();
},

OnCheckBannerCheckbox:function(form, action){
	CP.lldp.SetControls(form, action);
},

OnCheckMotdCheckbox:function(form, action){
	CP.lldp.SetControls(form, action);
},

SetControls:function(form, action){
	var TextCtl;
	var CheckBoxCtl;
	
	CheckBoxCtl=Ext.getCmp("LldpStat");
	TextCtl=Ext.getCmp("bannerText");
	TextCtl.setDisabled(!CheckBoxCtl.getValue());

	CheckBoxCtl=Ext.getCmp("motdStat");
	TextCtl=Ext.getCmp("motdText");
	TextCtl.setDisabled(!CheckBoxCtl.getValue());
	
}


}
