/**
 * @author amatai
 */

if(!_sstr) 
 var _sstr="";

// bacause of a bug in extjs on chrome we exclude it. SSL_SECURE_URL is relevant to IE only  
if (Ext.isIE) { 
	Ext.SSL_SECURE_URL  = "https://" + document.location.hostname + urlContext + 
                                _sstr + "/extjs/resources/images/default/s.gif";
}

//~~~ @@ Handle Ext.Ajax section ~~~

//Fires before the ajax request is made
Ext.Ajax.on( 'beforerequest', function(conn, opt) {
    // prepend the session string to all URLs
    opt.url = _sstr + opt.url;

    // update lock timer if we hold it
    if (CP.global.token != -1 && opt.url.indexOf("conflock.tcl") == -1) {
		if (CP.global.supress_update_msg == 1 || CP.global.isUpgrading == true) {
			CP.util.configLock_req("update",true);
		} else {
			CP.util.configLock_req("update");
		}
    }
	/*Set the session timer to ignore requesets sent automaticaly ()*/
	var conflockUpdate = (opt.url.indexOf("updateLock") != -1 && opt.url.indexOf("conflock.tcl") != -1);
	// We ignore conflockUpdate since it is sent with every request and does not indicate if it was initiated by the user (and not automaticaly).
	// This request is always be followed by another request.
	var ignore = ((true == opt.sentAutomaticaly) || conflockUpdate || CP.global.inDirectAutomaticRequestInProgress); 
	if (!ignore){
		CP.util.startSessionTimer(); 	// start the session timer
	}

    if (opt.method == "POST" ) {
        if (CP.global.token == -1 &&  opt.url.indexOf("cg_mgmt.tcl") == -1 && opt.url.indexOf("anyterm-module") == -1 && !CP.WebUI4.Toppanel.suspendNetInteraction) {  // if CP.WebUI4.Toppanel.suspendNetInteraction=TRUE meaning the terminal window is running. in this case we don't want to get "config locked" msg.
              CP.WebUI4.Msg.show({
                title: 'Configuration Locked',
                msg: 'The configuration database is currently locked by another user.<br>Click the lock icon in the toolbar to obtain the lock.',
                buttons: Ext.Msg.OK,
                icon: 'webui-msg-info'
             });
            return false;
        }
	if (CP.UI && CP.UI.accessMode == 'ro' && opt.override_ro !== true) {
		CP.WebUI4.Msg.show({
			title: 'Configuration Locked',
			msg: 'This page is currently in read-only mode, the requested action cannot be performed.',
			buttons: Ext.Msg.OK,
			icon: 'webui-msg-info'});
		return false;
	}

    }
}); 


//interceptor for success 
//An interceptor is created for the callback of the ajax requst.
//Inside the interceptor we check the response header:
//if the header is from the login page we end the session.
Ext.Ajax.on( 'requestcomplete', function( conn, response, optionsConfig, options ){
         
    var responseTxt = response.responseText;
    if( responseTxt.indexOf('<meta name="others" content="WEBUI LOGIN PAGE"  />') > -1 ) {
        //in case of session timeout the server will returns the login page -
        //redirect user back to the login page.
        /* debugger; */
        CP.util.redirectToLogin();
        return false;
    }
    //unlock tree after ajax completed
    CP.WebUI4.Navtree.enableTree();
    return true;
});


//interceptor for failure
Ext.Ajax.on( 'requestexception', function( conn, response, optionsConfig, options ){
    if( !response.responseText && CP.global.isRebooting == false && CP.global.isUpgrading == false
		&& CP.global.isExportingImporting == false ){ //connection error
        //empty response - display message and then redirect back to login page to get 404.
        CP.WebUI4.Msg.show({
            title: 'Connection Error',
            icon: 'webui-msg-error',
            msg: 'Unable to connect to the server. Press OK to reconnect.',
            buttons: Ext.Msg.OK,
            fn: function( btn, text ){
                CP.util.redirectToLogin();
            }
        });
        return false;
    }
    //unlock tree after ajax completed
    CP.WebUI4.Navtree.enableTree();
    return true;
});


//~~~ @@ Other Interceptors ~~~

//~~~ @@ Ext 4 ~~~

//there was a problem with the menu - the original doConstrain calculate y wrong, 
//and cause the menu to appear far away from the component (button / toolbar button / table header menu).
//and so I had to cancel this function.
//recheck this in the future
//Ext.menu.Menu.prototype.doConstrain = Ext.emptyFn;





// This causes the portlets in the  'overview.js'  page to be rendered again and resized to fit the page.
// 'doLayout'  rerenders the panel component holding the portlets.
// 'doResize'  is sent to  'window.setTimeout'  since on the time  'window.onresize'  is called the window
//		has not yet been acctually resized (only began to).
//		Another know problem is resizing with the mouse cursur which causes multiple 

window.onresize =  function() {
	var treePanel = Ext.getCmp("cptree");
        if( treePanel )
                 var currPage = treePanel.selectionUrl;
        else
                var currPage = "";
	if (currPage != "" && currPage != "tree/overview"){
		return; // avoid rendering when not on overview page
	}	
	
	/*function to be called after the window is resized*/
	var doResize = function(){
								var overviewPanel = Ext.getCmp(CP.Overview.PORTAL_PANEL_ID);
								if(overviewPanel)
									overviewPanel.doLayout();	
								CP.global.overviewResizing = false;
							}
							
	if ( ! CP.global.overviewResizing) { /*avoid scheduling too many resizes*/
		window.setTimeout(doResize, (CP.util.isIE8()) ? 1000 : 300);
		CP.global.overviewResizing = true
	}
};





