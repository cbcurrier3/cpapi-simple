function adjustPath(path) { 
	 if ( path == null || path == "" || path.search(/.tcl$/) == -1 ) { 
	 newPath = '/cgi-bin/home.tcl'; 
	 } else { 
	 var tclFile = path.substring(path.lastIndexOf("/")+1); 
	 newPath = '/cgi-bin/' + tclFile;
	    }
	    return newPath; 
}

function removeAllFramesForLogin() {
	 var path    = window.location.pathname;
	 var newPath = adjustPath(path); 
	 if (top.location != window.location || newPath != path ) {
	 window.location.pathname = newPath;
	 top.location.pathname = newPath;
	 }
	 if ( window.location.search != "" ) {
	 window.location.href=window.location.protocol + "//" + window.location.host + "/" + window.location.pathname ;
	    }
}

function checkCookie() {
	 var ExpireDate = new Date ();
	 ExpireDate.setTime(ExpireDate.getTime() + (2000));
	 document.cookie = 'cookieName=cookievalue;expires='+ExpireDate.toGMTString();
	 var cookiesenable = document.cookie.indexOf('cookieName');
	 if(cookiesenable== -1)
		 errMsgText += "<br/>Cookies not enabled.";
}

	 
function centerMainPanel(){
	var mainPanel = document.getElementById( 'webui_login_mainpanel' );
	if( !mainPanel ){
		return;
	}
	var panelHeight = 0;
	bodyHeight = document.body.clientHeight;
	if( Ext.isIE )
		panelHeight = document.documentElement.clientHeight;
	else
		panelHeight = window.innerHeight;
	var topMargin = (  panelHeight - bodyHeight) /2;
	mainPanel.style.marginTop = topMargin +"px";
}


function submitLoginForm(){
    var form = Ext.getCmp( 'webui_login_form' ).getForm();
    if( form.isValid() ){
        form.submit();
    }
}


//check if this is IE8 that runs with IE7 engine
//modules that always exists in IE8: AddToFavoritesBar, AddService
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


//We only support IE8 (or higher - in the future), Firefox, Chrome and Safari 
function isSupportedBrowser(){
    if( Ext.isIE8 || 
        isIE8WithIE7Engine() ||
        (!Ext.isGecko3 && !Ext.isGecko4 && Ext.isGecko) ||
        Ext.isChrome ||
        Ext.isSafari ){
        return true;
    }
    else{
        return false;
    }
}


function displayLoginForm(){
    var year = new Date().getFullYear();
    
    //vtype for password
    Ext.apply( Ext.form.VTypes,{
        password: function( v ){
            if (!v.length) return true;
            return /^.{6,}$/i;
        },
        passwordText: "Invalid Password",
        passwordMask: /./
    });
	
	/* Return a string that would fit nicely to the login screen with a scroll bar */
	function restructureString(str, lineLength){
		var maximalWordSize = 20
		for (var b=lineLength; b<str.length; b+=lineLength){
			var lowerBound = maximalWordSize;
			while (str.substring(b, b+1) != ' ' && lowerBound-- ) {b--;}
			str = str.substring(0,b)+"<br>"+str.substring(b,str.length);
		}
		return str
	};
	
	/* Constants */
	var restructureBannerText = false; // set to true if the message is not in the right format (upgrade issue)
	var lineMaxLength = 50;
	var lineMaxNumber = 3;
	if(typeof bannerMsgText ==  'undefined' )
                bannerMsgText = "";
	var text = bannerMsgText;

	/* login.tcl sometimes returns <br> instead of '\n' so we replace them first*/
	var textArr = text.split('<br>');
	for (var i=0; i < textArr.length; i++){
		/* Check if the string fits the format we require in Gaia */
		if (textArr[i].length > lineMaxLength || i > lineMaxNumber){
			text="";
			restructureBannerText = true;
			for (var k=0; k < textArr.length; k++) {text+=restructureString(textArr[k], lineMaxLength-10)+"<br>";}
			break;
		}
	}
	/* Create the Banner variable */
	if (restructureBannerText){
		var banMsg =
			new Ext.form.DisplayField({
        id: 'banner-msg-text',
        cls: 'banner-msg-text',
        value: text,  // the little offset is to fit the scroll bar
				autoScroll: true,
				readOnly: true,
        hideLabel: true,             
				//width: 320,
				height: 72
      });
	}else{
		var banMsg =
			new Ext.form.DisplayField({
        id: 'banner-msg-text',
				cls: 'banner-msg-text',	
        value: bannerMsgText.substring( 0, 150 ),
				//width: 320,
				height: 72,
        hideLabel: true              
      });
	}
	
	var banMsgWrap = {
		xtype: 'container',
		cls: 'banner-msg-wrapper',
		layout: {
			type: 'hbox'
		},
		items: [{
			xtype: 'container',
			width: 21,
			height: 16,
			cls: (bannerMsgText === '' ? '' : 'info_icon')
		},
		banMsg],
	};

    new Ext.Panel({
        xtype: 'panel',
        id: 'webui_login_mainpanel',
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
				// hbox left side
				xtype: 'container',
				width: 279,
				items: [{
					xtype: 'container',
					layout: {
						type: 'hbox',
						pack: 'center',
						align: 'center'
					},
					id:	'version_toolbar',
					cls: 'login_toolbar webui_version_hbox',
					items: [{
						xtype: 'displayfield',	
						id:	'version_toolbar_portal',
						value: "&nbsp;Gaia Portal",
					},{
						xtype: 'displayfield',
						id: 'login-version',
						value: version + '&nbsp;'
					}]
				},{
					xtype: 'displayfield',
					id: 'hostname_caption_id',
					//cls: 'webui_version_hbox',
					value: hostname,
					hidden: false,
					hideLabel: true,
					listeners: {
						beforerender: function(){
							if (this.value == "") {
								this.hidden=true;
							}
							else {
								this.hidden=false;
							}
						}
					}
				}]	
			},{
				// hbox right side
				xtype: 'form',
				layout: 'form',
				id: 'webui_login_form',
				name: 'webui_login_form',
				cls: 'webui_login_form',
				url: formAction,
				method: 'post',
				defaultType: 'textfield',
				border: false,
				standardSubmit: true,
				labelWidth: 70,
				height: 276,
				width: 387,
				defaults: {
					maxLength: 32
				},
				items: [
				banMsgWrap,{
					fieldLabel: 'Username',
					id: 'txtUserName',
					name: 'userName',
					itemCls: 'webui-login-label',
					width: 262,
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
					fieldLabel: 'Password',
					id: 'txtPwd',
					name: 'userPass',
					itemCls: 'webui-login-label',
					width: 262,
					maxLength: 128,
					enableKeyEvents: true,
					listeners: {
						keypress: function( field, e ){
							if( e.getKey() == e.ENTER ){
								submitLoginForm();
							}
						}
					}
				},{
					xtype: 'container'
					, height: 60
					,items: [{
						xtype: 'label',
						text: errMsgText,
						id: 'login-error',
						cls: 'login-error'
					}]	
				},{
					xtype: 'toolbar',
					//padding: '0',
					//width: 330,
					cls: 'login_toolbar',
					items: [
						'->',
					{
						 id: 'login_button'
						,xtype: 'button'
						, name: 'button.login.users.home'
						, cls: 'login_button'
						, iconCls: 'login_button_icon'
						, iconAlign: 'right'
						, text: 'LOGIN'
						, width: 110
						, handler: submitLoginForm
					}]
				
				}]
			}]
        }]
    });
    
    Ext.EventManager.onWindowResize( centerMainPanel ); //center form in screen everytime the window get resized
    Ext.getCmp( 'txtUserName' ).focus(); //focus on user name textfield when the login page first reloaded

    centerMainPanel();
    checkCookie();
    
    
    // @@ ~~ tooltip
    /*new Ext.BoxComponent({
        id: 'webui_login_logo_panel',
        cls: 'webui_login_logo_panel',
        html: '&nbsp;',
        width: 174,
        height: 53,
        renderTo: Ext.getBody()
    });
    
    var tooltip = new Ext.ToolTip({
        target: 'webui_login_logo_panel',
        cls: 'webui-login-html5-qtip',
        autoHide: true,
        dismissDelay: 1000,
        anchor: 'top',
        html: 'Powered by HTML5'
    });
    Ext.QuickTips.init();
    tooltip.show();
    */
}


function updateLogin(){
    Ext.getCmp( 'webui_login_mainpanel' ).hide();
    displayLoginForm();
}


function buildLoginPage(){
    //if browser not supported display an appropriate message
    if( isSupportedBrowser() == false ){
        var msg = 'The browser you are currently using is not supported by Gaia Portal.<br/>'+
                  'It\'s recommended to use a most recent version of one of these supported '+
                  'browsers: Internet Explorer, Firefox(5 or newer), Chrome, Safari.<br/>'+
                  'If you want to proceed anyway, <a href="#" onclick="updateLogin();return false;">click here</a>';
        
        new Ext.Panel({
            id: 'webui_login_mainpanel',
            cls: 'webui-not-supported-msg',
            width: 400,
            height: 100,
            renderTo: Ext.getBody(),
            border: false,
            html: msg
        });
        Ext.EventManager.onWindowResize( centerMainPanel ); //center form in screen everytime the window get resized
        centerMainPanel();
        return;
    }
    displayLoginForm();
}
Ext.onReady( buildLoginPage );
