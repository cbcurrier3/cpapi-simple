//searchKeys: day motd

CP.ban_motd = {

init: function() {	
    var banMOTDPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"ban-motd-panel"
        ,items: [{	
        	xtype: "cp4_sectiontitle"
			,titleText: "Messages"
		},{
            xtype:"cp4_checkbox"
            ,checked:false
            ,fieldLabel:""
            ,hideLabel: false
            ,boxLabel:"Banner message"
            ,lableWidth:10
            ,name:"bannerStat"
            ,id:"bannerStat"
            ,value:100
            ,width:400
            ,handler: CP.ban_motd.OnCheckBannerCheckbox
	            ,listeners: {
	            	enable: CP.ban_motd.OnCheckBannerCheckbox
           	     }
        },{
            xtype:"cp4_textarea"
            ,allowBlank:true
            ,emptyText:" "
            ,fieldLabel:""
            ,hideLabel: false
            ,name:"bannerText"
            ,id:"bannerText",
            margin: '0 0 24 0'
            ,width:400
            ,height:100
            ,maxLength: 1600
            ,enableKeyEvents:true
            ,autoCreate: {tag: 'textarea', autocomplete: 'off', maxlength: '1600'}
        	//,autoRender: {tag: 'textarea', autocomplete: 'off', maxlength: '1600'}
            ,listeners: {
            	keydown : CP.ban_motd.submitOn  
      	     }
	    },{
            xtype:"cp4_checkbox"
            ,checked:false
            ,fieldLabel:""
            ,hideLabel: true
            ,boxLabel:"Message of the day"
            ,name:"motdStat"
            ,id:"motdStat"
            ,value:100
            ,width:400
            ,handler: CP.ban_motd.OnCheckBannerCheckbox
	            ,listeners: {
	            	enable: CP.ban_motd.OnCheckBannerCheckbox
           	     }
        },{
            xtype:"cp4_textarea"
            ,allowBlank:true
            ,emptyText:" "
            ,fieldLabel:""
            ,hideLabel: true
            ,name:"motdText"
            ,id:"motdText"
            ,margin: '0 0 24 0'
            ,width:400
            ,height:100
            ,enableKeyEvents:true
            ,listeners: {
            		keydown: CP.ban_motd.submitOn  
       	     }
	    },{
		xtype: 'cp4_checkbox'
		,checked:false
		,fieldLabel: ""
		,hideLabel: false
		,boxLabel: 'Show hostname on login page'
		,name: 'captionStat'
		,id: 'captionStat'
		,width:400
		,margin: '0 0 15 0'
		,listeners: {
			change: CP.ban_motd.submitOn
		}
	    },{
			xtype: "cp4_button"
			,id: "sysname_apply"
			,disabled: true
			,text: "Apply"
			,hideLabel: true
			,handler: function(){
				CP.UI.applyHandler(page);
			}
        }]
        ,listeners: {
              render: CP.ban_motd.doLoad
			  
        }
    });

    var page = {
        title:"Banner and MOTD configuration"
        ,panel: banMOTDPanel
		,cluster_feature_name : "message"
        ,submitURL:"/cgi-bin/ban-motd.tcl"
        ,afterSubmit:CP.ban_motd.afterSubmit
        ,params:{}
    };
    CP.ban_motd.SetControls();

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/ban-motd.tcl',
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
    CP.ban_motd.init();
},

OnCheckBannerCheckbox:function(form, action){
	CP.ban_motd.submitOn(form, action);
	CP.ban_motd.SetControls();
},

OnCheckMotdCheckbox:function(form, action){
	CP.ban_motd.submitOn(form, action);
	CP.ban_motd.SetControls();
},

submitOn:function(form, action){
	// enable submit button
	Ext.getCmp("sysname_apply").enable();
},

SetControls:function(){
	var TextCtl;
	var CheckBoxCtl;

	CheckBoxCtl=Ext.getCmp("bannerStat");
	TextCtl=Ext.getCmp("bannerText");
	if(!CheckBoxCtl.isDisabled())
		TextCtl.setDisabled(!CheckBoxCtl.getValue());

	CheckBoxCtl=Ext.getCmp("motdStat");
	TextCtl=Ext.getCmp("motdText");
	if(!CheckBoxCtl.isDisabled())
		TextCtl.setDisabled(!CheckBoxCtl.getValue());
}
}