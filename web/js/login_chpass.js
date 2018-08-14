// login_chpass.js
// Copyright: Check Point Software Technologies LTD.

function checkCookie() {
	var ExpireDate = new Date ();
	ExpireDate.setTime(ExpireDate.getTime() + (2000));
	document.cookie = 'cookieName=cookievalue;expires='+ExpireDate.toGMTString();
	var cookiesenable = document.cookie.indexOf('cookieName');
	if(cookiesenable== -1)
		errMsgText += "<br/>Cookies not enabled.";
}

function centerMainPanel(){
	var mainPanel = document.getElementById( 'webui_login_chpass_mainpanel' );
	if( !mainPanel ){
		return;
	}
	var bodyHeight = document.body.clientHeight;
	var panelHeight = mainPanel.clientHeight;
	var topMargin = ( bodyHeight - panelHeight ) /2;
	mainPanel.style.marginTop = topMargin +"px";
}

function submitLoginForm(){
	var form = Ext.getCmp( 'webui_login_chpass_form' ).getForm();
	if( form.isValid() ){
		form.submit();
	}
}

function submitLogout(){
	var loginUrl = "/" + sessionText + "/cgi-bin/login.tcl";
	document.location = loginUrl;
}

// Check if this is IE8 that runs with IE7 engine
// modules that always exists in IE8: AddToFavoritesBar, AddService
function isIE8WithIE7Engine() {
	if( !window.external )
	{
		return false;
	}
	if(( typeof( window.external.AddToFavoritesBar ) != "undefined" ) &&
	   ( typeof( window.external.AddService ) != "undefined" )){
		return true;
	}
	else{
		return false;
	}
}

// We only support IE8 (or higher - in the future), Firefox, Chrome and Safari 
function isSupportedBrowser(){
	if( Ext.isIE8 || 
	    isIE8WithIE7Engine() ||
	    Ext.isGecko ||
	    Ext.isChrome ||
	    Ext.isSafari ){
		return true;
	}
	else{
		return false;
	}
}

function displayLoginChpassForm(){
    
    // vtype for password
    Ext.apply( Ext.form.VTypes,{
        password: function( v ){
            if (!v.length) return true;
            return /^.{6,}$/i;
        },
        passwordText: "Invalid Password",
        passwordMask: /./
    });
    
    new Ext.Panel({
        xtype: 'panel',
        id: 'webui_login_chpass_mainpanel',
        cls: 'webui_login_mainpanel',
        width: 686,
        height: 296,
        renderTo: Ext.getBody(),
        border: false,
        items: [{
			xtype: 'panel',
			layout: 'hbox',	
			width: 686,	
			height: 296,
			id: 'webui_login_hbox',
			name: 'webui_login_hbox', 
			cls: 'webui_login_hbox',  
			border: false,						
			items: [{
				// hbox left side - placeholder -------------
				xtype: 'container',
				width: 279
			},{
				// hbox right side	-------------------------
				xtype: 'form',
				layout: 'form',
				id: 'webui_login_chpass_form',
				name: 'webui_login_chpass_form',
				cls: 'webui_login_form',
				url: formAction,
				method: 'post',
				defaultType: 'textfield',
				border: false,
				standardSubmit: true,
				labelWidth: 120,
				height: 276,
				width: 387,
				defaults: { 
					width: 170, 
					maxLength: 32
				},
				items: [{
					xtype: 'displayfield',
					id: 'chpass-msg-text',
                			itemCls: 'webui_login_chpass_banner',
					value: 'Please Change Your Password',
					hideLabel: true,
					width: 311
				},{
					xtype: 'label',
					fieldLabel: 'User Name',
					text: userNameText,
					itemCls: 'webui-login-label',
					width: 170
				},{
					vtype: 'password',
					inputType: 'password',
					fieldLabel: 'Old Password',
					id: 'oldPass',
					name: 'oldPass',
					itemCls: 'webui-login-label',
					width: 170,
					enableKeyEvents: true,
					listeners: {
						keypress: function( field, e ){
							if( e.getKey() == e.ENTER ){
								submitLoginForm();
							}
						}
					}
				},{
					vtype: 'password',
					inputType: 'password',
					fieldLabel: 'New Password',
					id: 'newPass',
					name: 'newPass',
					itemCls: 'webui-login-label',
					width: 170,
					enableKeyEvents: true,
					listeners: {
						keypress: function( field, e ){
							Ext.getCmp('pass_strength').show_pass_strength(e);
							if( e.getKey() == e.ENTER ){
								submitLoginForm();
							}
						},
						focus: function(e) {
							Ext.getCmp('pass_strength').show_pass_strength(e);
						},
						keyup: function(e) {
							Ext.getCmp('pass_strength').show_pass_strength(e);
						}
					}
				},{
					vtype: 'password',
					inputType: 'password',
					fieldLabel: 'Confirm Password',
					id: 'newPass2',
					name: 'newPass2',
					itemCls: 'webui-login-label',
					width: 170,
					enableKeyEvents: true,
					listeners: {
						keypress: function( field, e ){
							if( e.getKey() == e.ENTER ){
								submitLoginForm();
							}
						}
					}
				},{
					xtype:'panel',
					layout: 'column',
					width: 300,
					border: false,
					items: [{
							xtype: 'panel'
							, columnWidth: 0.4
							, layout: 'form'
							, border: false
							, items: [{
							   xtype: 'label',
							   fieldLabel: 'Password Strength',
							   text: "",
							   itemCls: 'webui-login-label'
							}]
						},{
							xtype: 'panel'
							, columnWidth: 0.6
							, border: false
							, id: 'pass_strength'
							, name: 'pass_strength'
							, style: 'margin-left:15px;'
							, width: 140
							, height: 25
							, password_strength: 0
							, letters : 0
							, capitalLetters : 0
							, digits : 0
							, special : 0
							, usingGroups : 0
							, IsCharsFromGroup: function() {
									var pass=Ext.getCmp('newPass').getValue();
									if(pass.match(/[a-z]+/))
									{
											this.letters += 1;
									}
							}
							, IsCapitalsFromGroup: function() {
									var pass=Ext.getCmp('newPass').getValue();
									if(pass.match(/[A-Z]+/))
									{
													this.capitalLetters += 1;
									}
							}
							, IsDigitsFromGroup: function() {
									var pass=Ext.getCmp('newPass').getValue();
									if(pass.match(/[0-9]+/))
									{
													this.digits += 1;
									}
							}
							, IsSpecialFromGroup: function() {
									var pass=Ext.getCmp('newPass').getValue();
									if(pass.match(/[!@#\$%\^&\*\(\)\-_=\+:;]+/i))
									{
													this.special += 1;
									}
							}
							, countGoups: function() {
									if(this.letters == 1)
									{
											this.usingGroups += 1;
									}
									if(this.capitalLetters == 1)
									{
											this.usingGroups += 1;
									}
									if(this.digits == 1)
									{
											this.usingGroups += 1;
									}
									if(this.special == 1)
									{
											this.usingGroups += 1;
									}
							}
							, show_pass_strength: function(e) {
									var pass=Ext.getCmp('newPass').getValue();
									var new_strength = 0;

									if( pass.length <= 1 )
									{
											this.usingGroups = 0;
											this.letters = 0;
											this.capitalLetters = 0;
											this.digits = 0;
											this.special = 0;
									}
									new_strength = pass.length - 6;
									 if (new_strength < 0)
									{
											new_strength = new_strength * 3;
									}
									if (new_strength >10)
									{
											new_strength = 10;
									}
									this.IsCharsFromGroup();
									this.IsCapitalsFromGroup();
									this.IsDigitsFromGroup();
									this.IsSpecialFromGroup();
									this.countGoups();
									if ( (this.usingGroups == 2) || (this.usingGroups == 4) )
									{
											new_strength = new_strength + 8;
									}
									if (this.usingGroups == 3)
									{
											new_strength = new_strength + 10;
									}
									new_strength = new_strength * this.usingGroups;
									if (pass.length <= 0)
									{
											new_strength = 0;
									}
									if ( (pass.length > 0) && (new_strength < 1) )
									{
											new_strength = 1;
									}
									if ( (new_strength > 1) && (new_strength <= 15) )
									{
											new_strength = 1;
									}
									if ( (new_strength > 15) && (new_strength <= 35) )
									{
											new_strength = 2;
									}
									if ( (new_strength > 35) && (new_strength <= 45) )
									{
											new_strength = 3;
									}
									if  (new_strength > 45)
									{
											new_strength = 4;
									}
									this.removeClass('password_strength_img_' + this.password_strength);
									this.addClass('password_strength_img_' + new_strength);
									this.password_strength = new_strength;
							}
						}]
				},{
					xtype: 'panel'
					, layout: 'form'
					, border: false
					, width: 320
					, style: 'padding-left: 120px;'
					, buttons: [{
						text: 'Set Password',
						id: 'login-btn',
						name: 'button.login.users.home',
						handler: submitLoginForm
					},{
						text: 'Cancel',
						id: 'cancel-btn',
						name: 'cancel-btn',
						style: 'padding-left:20px;',
						handler: submitLogout
					}]
				},{
                xtype: 'label',
                text: errMsgText,
                id: 'login-error',
                cls: 'login_chpass-error',
                width: 300 					
				}]
			}]
		}]
	});
    
    // Remove ext class from button to display it as a regular button 
    Ext.getCmp( 'login-btn' ).removeClass( 'x-btn' );
    Ext.getCmp( 'cancel-btn').removeClass( 'x-btn' );
    // Center form in screen everytime the window gets resized
    Ext.EventManager.onWindowResize( centerMainPanel );
    // Focus on first textfield when the login page first loads
    Ext.getCmp( 'oldPass' ).focus();

    centerMainPanel();
    checkCookie();
}

function displayLoginChpassErrorForm(){
 
    new Ext.Panel({
        xtype: 'panel',
        id: 'webui_login_chpass_mainpanel',
        cls: 'webui_login_mainpanel',
        width: 686,
        height: 296,		
        renderTo: Ext.getBody(),
        border: false,
        items: [{  
			xtype: 'panel',
			layout: 'hbox',	
			width: 686,	
			height: 296,
			id: 'webui_login_hbox',
			name: 'webui_login_hbox', 
			cls: 'webui_login_hbox',  
			border: false,						
			items: [{		
				// hbox left side - placeholder -------------
				xtype: 'container',
				id:"placeholder",
				width: 279
			},{
				// hbox right side	-------------------------
				 xtype: 'form',
				layout: 'form',
				id: 'webui_login_chpass_form',
				name: 'webui_login_chpass_form',
				cls: 'webui_login_form',
				url: formAction,
				method: 'post',
				defaultType: 'textfield',
				border: false,
				height: 276,
				width: 387,
				standardSubmit: true,			
				labelWidth: 90,
				defaults: { 
					maxLength: 32
				},
				items: [{				
					xtype: 'displayfield',
					id: 'chpass-msg-text',
					itemCls: 'webui_login_chpass_banner',
					value: 'Unable to Change Your Password',
					hideLabel: true,
					width: 311
				},{
					xtype: 'label',
					text: errMsgText,
					id: 'login-error',
					cls: 'login_chpass-error',
					width: 280 
				}],
				buttons: [{
					text: 'Cancel',
					id: 'cancel-btn',
					name: 'cancel-btn',
					handler: submitLogout
				 },{
					text: 'Continue to Web UI',
					id: 'login-btn',
					name: 'button.login.users.home',
					handler: submitLoginForm,
					style: 'margin-right:15px;'
				 }]
			 }]
		 }] 
    });
    
    // Remove ext class from button to display it as a regular button 
    // since we don't have images to use
    Ext.getCmp( 'login-btn' ).removeClass( 'x-btn' ); 
    Ext.getCmp( 'cancel-btn').removeClass( 'x-btn' );
    // Center form in screen everytime the window gets resized
    Ext.EventManager.onWindowResize( centerMainPanel );
    // Focus on submit button
    Ext.getCmp( 'login-btn' ).focus();
 
    centerMainPanel();
    checkCookie();
}

function updateLogin(){
    Ext.getCmp( 'webui_login_chpass_mainpanel' ).hide();
    displayLoginChpassForm();
}

function displayUnsupportedBrowserPage(){
	// Browser not supported display an appropriate message
        var msg = 'The browser you are currently using is not supported by Gaia Portal.<br/>'+
                  'It\'s recommended to use a most recent version of one of these supported '+
                  'browsers: Internet Explorer, Firefox, Chrome, Safari.<br/>'+
                  'If you want to proceed anyway, <a href="#" onclick="updateLogin();return false;">click here</a>';
        
        new Ext.Panel({
            id: 'webui_login_chpass_mainpanel_unsupported',
            cls: 'webui_login_mainpanel webui-not-supported-msg',
            width: 400,
            height: 100,
            renderTo: Ext.getBody(),
            border: false,
            html: msg
        });
        // Center form in screen everytime the window gets resized
        Ext.EventManager.onWindowResize( centerMainPanel );
        centerMainPanel();
        return;
}

function buildLoginChpassPage(){
 	if( isSupportedBrowser() == false ){
		displayUnsupportedBrowserPage();
	}
	else if(isLoginChpassErrorPage == 1){
		displayLoginChpassErrorForm();
	}
	else{
		displayLoginChpassForm(); 
	}
}

Ext.onReady( buildLoginChpassPage );

