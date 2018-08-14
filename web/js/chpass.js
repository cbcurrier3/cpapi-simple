CP.Chpass = {
    // let a user change their own password

init: function() {
    var newPwd = Ext.create( 'CP.WebUI4.Password', {
        id: 'new1'
        ,name: 'new1'
        , fieldLabel: 'New Password'
        , allowBlank:true
        , invalidText: 'Invalid new password.'
        , tooltip: 'The password is case sensitive'
        , maskRe: /([a-zA-Z0-9!@#\$%\^&\*\(\)\-_=\+:;\.])/   // alphanumeric and special allowedd_L'
        , blankText: 'Enter a password.'
        , maxLength: 128
        , labelWidth: 120
        , maxLengthText: 'The maximum length for the password is 128.'
    });
    
    var chpassPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
	    id:"chpass-panel"
	    ,labelWidth: 150
        ,items: [{
        	xtype: 'cp4_sectiontitle',
        	titleText: 'Change Password'
        },{
			 // have them enter their old password (without it they're
			 // not allowed to set a new one)
			  xtype: 'cp4_password'
			  ,fieldLabel:'Old Password'
			  ,id:'old'
			  ,name: 'old'
			  ,allowBlank:true
			  ,invalidText:'Invalid current password.'
			  ,maxlLength: 128
			  , labelWidth: 120
        },{
			xtype: 'cp4_passwordmeter',
			componentCls: 'change_pwd_strength_default_position',
			id:"chpass_passwd_meter",
			passwordField: newPwd
		},{
			xtype: 'cp4_password'
			, id: 'new2'
			,name: 'new2'
			, fieldLabel: 'Confirm New Password'				
			, maskRe: /([a-zA-Z0-9!@#\$%\^&\*\(\)\-_=\+:;\.])/   // alphanumeric and special allowed
			, compareWith: 'new1'
			, blankText: 'Confirm New Password.'
			, allowBlank: false
			, labelWidth: 120
			, maxLength: 128
			, maxLengthText: 'The maximum length for the confirm password is 128.'	
			, enableKeyEvents: true
			, listeners: { 
				keypress: CP.Chpass.enableApplyBtn,
				keyup:    CP.Chpass.enableApplyBtn
			}
		}],
        listeners: {
    		render: CP.Chpass.doLoad
    	}
    });
	
	var applyBtn = Ext.create( 'CP.WebUI4.Button',{
		id: 'pass_apply'
	 	, margin: '10 0 0 0'
		, text: 'Apply'
	 	, disabled: true
		, handler: function(e) {
			Ext.getCmp('pass_apply').disable();
		}
	});
	
	chpassPanel.add(applyBtn);	
	
    var page = {
        title:"Change Current User's Password"
        ,panel: chpassPanel
        ,submitURL:"/cgi-bin/chpass.tcl"
    	,params:{}
		,afterSubmit:CP.Chpass.afterSubmit
    };

    CP.UI.updateDataPanel(page);
    applyBtn.setHandler(Ext.Function.bind(CP.UI.applyHandler, this,[page]));
},

doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/chpass.tcl',
        method: 'GET'
    });
}

,afterSubmit:function(form, action){
    //reload the page
    CP.Chpass.init();
}

,enableApplyBtn: function() {
    if ( Ext.getCmp('new2').isValid(true) == true ) {
        Ext.getCmp('pass_apply').enable();
    } else {
        Ext.getCmp('pass_apply').disable();
    }
}

}
