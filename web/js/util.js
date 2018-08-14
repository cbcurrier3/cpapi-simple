/**
 * Provides singleton utility classes.
 */

//Globals - should be moved to the webui-core.js file in the future 
//when both FTW and mainframe will use the same libraries
Ext.BLANK_IMAGE_URL = _sstr + "/extjs/resources/images/default/s.gif";

//Create global objects CP and CP.WebUI for encapsulation
if(!CP) var CP={};
Ext.ns( 'CP.WebUI' );
Ext.ns( 'CP.WebUI4' );

// A place to keep all gloabl variables
CP.global = {
    //tabs
    configTab:  false            // configTab has a panel?
    ,monitorTab: false            // monitorTab has a panel?
    ,activeTab: ""                // current active tab
    ,overview: "overview" //name of overview tab
    ,config:   "config"   //name of config tab
    ,monitor:  "monitor"  //name of monitor tab
    //format definitions
    ,formatTime: '24-hour'			/*Default Value*/
    ,formatDate: 'dd-mmm-yyyy'		/*Default Value*/
    ,formatTemperature: 'Celsius'	/*Default Value*/
    ,formatNotation: 'Dotted'		/*Default Value*/
    ,token: -1                     // configLock token
    ,pageAccessMode: "rw"        // access mode of current page/treenode
    ,isRebooting: false           //flag to distinguish between initiated reboot and connection error
    ,isExportingImporting: false           //flag to suppress connection error when performing export/import operations for an image
    ,uploadImportSnapshotFromFTW: false
    ,isUpgrading: false           //flag to suppress connection error when upgrading
    ,applianceType: ''           //name of the appliance to display the correct image
    ,dispHostname:''			//hostname that is displayed in the top left corner
	,retrieveLock: false			//indicates whether the user had the lock prior to opening the Terminal from the WebUI
    ,loginCount: 0
    ,allowStatistics: -1
    ,isEA: false
    ,isMgmt: false
    ,isFTWFinished: false
    ,isIPv6On: false			// indicates whether the ipv6 is enabled on the machine (by checking the DB binding). It is possible that FTW overrides its value with true for ipv6 configuration.
	,CloningGroupName: "" //cloning group name
	,isCluster: false //is this session a cadmin session ?
	,isRealCadmin : false //is this real cadmin user or emulated one ?
	,isClusterEnabled: false //this machine have a working cluster ?
	,LockClusterSharedFeatureInAdminMode : false //should we lock shared features when in normal user mode ?
	,LockClusterNonSharedFeatureInCAdminMode : false //should we lock non-shared features when in cadmin mode ?
	,isClusterFeatureShared : {} //a list of cluster features with a shared/non-shared flag.
	,GridRefreshRate: 15 //this should be the same value as in basedb
    ,isMds: false
    ,Enter_Date_Time: 0
    ,isGW: false
	,CLUSTER_SHARED_FEATURE_NEXT_LOGIN_MSG : false
    //session
	,inDirectAutomaticRequestInProgress : false
    ,sessionTimeout: 1200000        // default session timeout - 20 minutes
    ,sessionTask : new Ext.util.DelayedTask( function(){
        CP.util.redirectToLogin();
    })
	//feedback
	,messageToDisplay: ""
	,submitterName: ""
	,submitterEmail: ""
	,submitterOrganization: ""
	,allowedFeaturesArray: null					// an array containing all of the user's allowed rba
	,allowedFeaturesPermissionsArray: null		// an array containing all of the user's allowed rba permissions
	,supress_update_msg: 0
	,g_blade_table : {
    /* Security Blades */
    0: "blades_firewall",          /* Firewall */
    1: "blades_vpn",               /* IPSEC VPN */
    2: "blades_sd",                /* IPS */
    3: "blades_anti_spam",         /* Anti-Spam and Email Security */
    4: "blades_app_control",       /* Application Control */
    5: "blades_filtering",        /* URL Filtering */
    6: "blades_av",               /* Antivirus */
    7: "blades_anti_bot",          /* Anti-Bot */
    8: "blades_emulation_local",   /* Threat Emulation Local */
    9: "blades_emulation_cloud",    /* Threat Emulation Cloud */
    10: "blades_extraction",        /* Threat Extraction */
    11: "blades_dlp",                /* Data Loss Prevention */
    12: "blades_vsx",                			/* VSX */
    13: "blades_data_awareness",   /* Data Awareness */

    /* Management Blades */
    1000: "blades_network",				/* Network Policy Management */
    1001: "blades_logging_and_status", /* Logging and Status */
    1002: "blades_monitoring",       	/* Management Monitoring */
    1003: "blades_smart_event",        /* SmartEvent */
    1004: "blades_smart_event",        /* SmartEvent Intro */
    1005: "blades_complience",               /* Compliance */
    1006: "blades_global_policy",                        /* Global Policy (PV-1) / Multi Domain */

    /* Mobility blades */
    2000: "blades_mobile_access",   /* Mobile Access */
    2001: "blades_capsule"        /* Check Point Capsule */
  }
};

CP.util = function(){
    return {
        
    //provides a way to copy modified records from
    //a grid to an object that can be POST-ed as part of form submission
    //From each record of the grid, it adds only those properties for
    //which another property of name "binding_" prefixed exists.
    copyStoreToForm: function(params, grid){
        var st = grid.getStore();
        var b = "binding_";
        var l = b.length;
        var myparams = params;

        st.each(function(){
            var r = this;
            if(r.dirty){
                if(typeof r.data == "object") {
                    for(var p in r.data) {
                        if(p.indexOf(b) == 0) {
                            s = p.substring(l,p.length);
                            myparams[r.data[p]] = r.data[s];
                        }
                    }
                }
            }
        });
    }
    
    //print messages to the status-bar
    ,setStatusMsg: function( jsonData ){
        var statusBar = Ext.getCmp( 'status-bar' );
        var successMode = jsonData.success;
        var messages = jsonData.messages;
		
		if(!CP.global.isCluster) {
			for( var i=0, msg; msg=messages[i] ; i++ ){
				statusBar.setStatusMessage( msg, successMode );
			}
		} else {
			var combined_cluster_response = (successMode == "false")  ?  "Cloning Configuration Error</br>" : "";
			
			for( var i=0, msg; msg=messages[i] ; i++ ){
				combined_cluster_response = combined_cluster_response + msg + "</br>"
			}
			statusBar.setStatusMessage( combined_cluster_response, successMode );
		}
		
		if(CP.global.isCluster && (successMode == "false" || successMode == "half_true") ) {
    	    CP.WebUI4.Msg.show({
                title: 'Error',
                msg: "An error occurred while applying configuration change to all cloning group members <br> Please check the status bar history",
                buttons: Ext.Msg.OK,
                icon: 'webui-msg-error'
            });
		}
    }
    
    //print a custom messages to the status-bar
    ,setCustomStatMsg: function( msg, successMode ){
        var customJson = {"success":successMode,"messages":[msg]};
        CP.util.setStatusMsg( customJson );
    }
    
    ,hide: function( fieldId ){
        var field = Ext.getCmp( fieldId );
        var fieldEl = el.getEl();
        field.hide();
        if( fieldEl )
            fieldEl.up('.x-form-item').setDisplayed(false);
    }
    
    ,show: function(fieldId){
        var field = Ext.getCmp( fieldId );
        var fieldEl = el.getEl();
        field.show();
        if( fieldEl )
            fieldEl.up('.x-form-item').setDisplayed(true);
    }
    
    //Update the host name on the left in toppanel
    //if longer than 18 chars cut and add ellipsis + tooltip
    ,setHostName: function(host){
        var charLimit = 18;
        var shortHostName = host;
        if( shortHostName.length > charLimit ){
            shortHostName = host.substring( 0, charLimit ) +'...'; //cut long names
        }
        var panel = Ext.get( 'top_west_hostname' );  
        panel.update( shortHostName );
        panel.dom.title = host;
        CP.global.dispHostname = shortHostName;
    }
    
    ,setTime: function(val){
        Ext.getCmp("tb_info_date_time").setValue(val);
    }
    
    //a little debugging helper; not for use in production code.
    //It takes a JavaScript object and returns a string that represents
    //it in the form name1:value1,name2:value2,....  So you can
    //see what's in the object.  For example, repHash(["one","two"])
    //returns    "0:one,1:two"
    ,repHash:function(hsh) {
        var parts = [];
        for (var k in hsh) {
           parts.push(k+":"+hsh[k]);
        }
        return(parts.join(","));
    }
    
    //clear isDirty flag
    ,clearFormDirtyFlag: function( formId ){
        var form = Ext.getCmp( formId );
        if( !form ){
            return;
        }
        form.items.each( function( f ){
            if( f.isFormField ){
                f.originalValue = f.getValue();
            }
        });
    }
    
    ,clearFormInstanceDirtyFlag: function( form ){
    	if( !form ){
    		return;
    	}
    	form.getFields().each( function( f ){
    		f.originalValue = f.getValue();
    	});
    }
    
    //for displaying a disabled field with a light-gray border
    ,grayedOut: function( component ){
        component.addClass( 'webui-disabled' );
    }
    
    //displaying an enabled field with a dark-gray border
    ,unGrayed: function( component ){
        component.removeClass( 'webui-disabled' );
    }
    
    //save time formats in global variables to be used from anywhere in the application
    ,getTimeFormat: function(){
        Ext.Ajax.request({
            url: "/cgi-bin/format.tcl",
            method: 'GET',
            scope: this,
            success: function( response ) {
                var jsonData = Ext.decode( response.responseText );
                var jData = jsonData.data;
                CP.global.formatTime = jData.time;
                CP.global.formatDate = jData.date;
                CP.global.formatTemperature = jData.temperature;
                CP.global.formatNotation = jData.netmask;
            }
        });
    }
    
	,getIPv6Status: function(){
		Ext.Ajax.request({
			url: '/cgi-bin/ipv6.tcl',
			method: 'GET',
			success: function( jsonResult ){
				var jsonData = Ext.decode( jsonResult.responseText );
				var data = jsonData.data;
				if( data.ipv6 == 't' ){
					CP.global.isIPv6On = true;
				} else {
					CP.global.isIPv6On = false;
				}
			}
		});
	}
	,setIPv6Status: function(val){
		CP.global.isIPv6On=val;
	}
	
	,countIPV6ForUniqueIPComp: function(id,ip_xtype){
		var items=[];
		items=Ext.ComponentMgr.get(id).query(ip_xtype);
		var items_len=items.length;
		
		for(var i=0;i<items_len;i++)
		{
			if(items[i].isIPv6)
					return true;
		}
		return false;
	}
	
	,countIPV6: function(id){		
		if(CP.util.countIPV6ForUniqueIPComp(id,'cp4_IPHybridField')==true)
		{
			CP.util.setIPv6ConfiguredFlag(true);
			
			return true;
		}
		if(CP.util.countIPV6ForUniqueIPComp(id,'cp4_domainnameAndIPv6')==true)
		{
			CP.util.setIPv6ConfiguredFlag(true);
			return true;
		}
		return false;
		
	}
	
	,getIPv6ConfiguredFlag: function(){	
		return  ftw.isIPV6Configure;
	}
	
	,setIPv6ConfiguredFlag: function(value){	
		 ftw.isIPV6Configure = value;
	}
	
    //save web session timeout in a global variable to be used from anywhere in the application
    //the get value is in minutes - so we need to multiply
   ,getWebSessionTimeout: function(){
       Ext.Ajax.request({
           url: "/cgi-bin/general_settings.tcl",
           method: 'GET',
           scope: this,
           success: function( response ) {
               var jsonData = Ext.decode( response.responseText );
               var jData = jsonData.data;
               CP.global.sessionTimeout = jData.web_session_timeout;
               CP.global.sessionTimeout = CP.global.sessionTimeout * 60000 -2000;
           }
       });
   }
    
    //centrelized get
    ,sendGetRequest: function( url, successCallback, paramsObj ){
        Ext.Ajax.request({
            url: url,
            method: 'GET',
            scope: this,
            params: paramsObj,
            success: function( response, options ){
                successCallback( response, options );
            },
            failure: function( response, options ){
                CP.util.setStatusMsg( response, options );
            }
        });
    }
    
    
    
    //When user click the configuration lock on the top toolbar display a confirmation message
    ,configLock_click: function(){
        CP.WebUI4.Msg.show({
            title: 'Configuration Lock',
            msg: 'Are you sure you want to override the lock?',
            buttons: Ext.Msg.YESNO,
            icon: Ext.Msg.QUESTION,
            fn: function(button, text, opt) {
                if (button == "yes"){
                    CP.util.configLock_req("override");
                }
            }
        });
    }
    
    //When user click the configuration unlock on the top toolbar display a confirmation message
    ,configUnlock_click: function(){
        CP.WebUI4.Msg.show({
            title: 'Configuration Lock'
            ,msg: 'Do you want to release the lock on the database?'
            ,buttons: Ext.Msg.YESNO
            ,icon: Ext.Msg.QUESTION
            ,fn: function(button, text, opt) {
                if (button == "yes"){
                    CP.util.configLock_req("releaseLock");
                    CP.UI.setReadOnlyPageMode( CP.UI.getMyObj(),'Configuration database is currently locked by another user. <a href="javascript:void(0);" onclick="CP.util.configLock_click();return false;">Click here to obtain lock</a>.' , 'warning' );
                }
            }
        });
    }

    
    //Send request for configuration lock
    ,configLock_req: function( type, noAlert){
	
		if(CP.global.isCluster) {
			CP.global.token = 1;
			if ('createLockInMainframe' == type){
				CP.UI.displayMsgOfTheDay();
			}
			return;
		}
	
        //set request url
        var url = '/cgi-bin/conflock.tcl?option=';
        switch( type ){
			// 'createLockInMainframe' is similar to 'create' but also handles the mainframe's first load.
			case "createLockInMainframe": 
            case "create":
                url += "createLock";
            break;
            case "checkLockInFTW":
               url += 'checkLockInFTW';
            break;
            case "override":
                url += 'createLock_or';
            break;
            case "update":
                url += 'updateLock&token='+ CP.global.token;
            break;
			case "releaseLock":
            url += 'releaseLock&token='+ CP.global.token;
            break;
            default:
                url += 'checkLock&token='+ CP.global.token;
            break;
        }
        
        //send request
        Ext.Ajax.request({
            url: url,
            method: 'GET',
			  /*This property was previously set to 'false' in order to remove ExtJS's '_dc' (caching related) parameter from the request sent to the server
			  This was done since the server had trouble interperting the address and failed to respond to the request. This does not happen anymore.
			  This property is now set to 'true' since IE8 (!) failed to update from the server after the 1st request (304 result) - which is unacceptable
			  since changes can be made to the DB without aquiring the lock*/	
            disableCaching: true,
            success: function( response ){
                var jsonData = Ext.decode( response.responseText );     
                var lockedBy = 'another user';
                var lockedFrom = '';				
				if (type == "checkLockInFTW"  )
				{
					var usr = jsonData.lock_user? "User "+jsonData.lock_user : 'Another user';
					var is_lock_taken = jsonData.lock;

					if (is_lock_taken == 1 )
					{
						var handleLock = function()
						{
							CP.WebUI4.Msg.show(
							{ 
							title:"Configuration Lock Present", 
							msg: usr +" is currently logged in to the system. If you choose to continue, you risk losing previous settings. \
							Continue anyway?", 
							buttons: Ext.Msg.OKCANCEL,
							icon: 'webui-msg-warning',
							cls: 'msg_floating',
							fn: function( button, text, opt )
								{
									if( button != "ok" ){
										// exit   
										CP.util.redirectToLogin(true);
									}
									// otherwise do nothing - once user continues FTW the values will be overriden.											
								}								
							});
						}
						
						Ext.Ajax.request(
						{
							url: '/cgi-bin/image.tcl',
							method: 'GET',
							params: {appType:'true'},
							success: function(response)
							{
								var jsonData = Ext.decode(response.responseText);

								if (jsonData.data.wizardStarted == "true")
								{
									return;
								}
								
								handleLock();
							},
							failure: function()
							{
								handleLock();
							}
						});

					}
					
					return;	
				}
                else if( type == "create" || type == "createLockInMainframe" || type == "releaseLock" || type == "override" ||  jsonData.result == -1 ){
                    CP.global.token = jsonData.result;
                    if (!noAlert && jsonData.message){
                        CP.WebUI4.Msg.show({ 
                            title:"Configuration Lock Error", 
                            msg:jsonData.message, 
                            buttons: Ext.Msg.OK,
                            icon: 'webui-msg-error'
                        });
                    }
                    else if( type == 'override'){
                        //accuired lock was successful - enable the page
                        CP.UI.enableReadOnlyPage();
                    }
                    if (Ext.typeOf(CP.ar_util.callChkCmpState) == "function") {
                        CP.ar_util.callChkCmpState();
                    }
                    if ( jsonData.user ){
                        lockedBy = "<span class=\'highlighted\'>" + jsonData.user + "</span>";
                    }
                    var tdInfoLock = Ext.getCmp("tb_info_lock");
                    var btnScratchPad = Ext.getCmp( 'toppanel_scratchpad_btn' );
                    var btnViewMode = Ext.getCmp( 'webui_tree_viewmode_btn' );
					var btnFeedBack = Ext.getCmp( 'toppanel_feedback_btn' );
					var btnTacacsEnable = Ext.getCmp( 'tacaca_enable_btn' );
					if ('createLockInMainframe' == type){
					    CP.UI.setPassExpirationMsgValues();
					    if (jsonData.result != -1 && CP.global.isEA && (CP.global.loginCount > 0) && (CP.global.loginCount % 5 == 0)){
							CP.WebUI4.Toppanel.openFeedbackPanel();
						} else if (CP.global.allowStatistics == -1) {
							CP.WebUI4.Msg.show({
					            title: 'Help Check Point Improve Software Updates',
					            msg: 'Click Yes to send device data to help us recommend available downloads and installations.',
					            buttons: Ext.Msg.YESNO,
					            icon: Ext.Msg.QUESTION,
					            fn: function(button, text, opt) {
					            	var val = "0";
					                if (button == "yes"){
					                	val = "1";
					                }
					                Ext.Ajax.request({
					                    url: "/cgi-bin/configured.tcl",
					                    method: 'GET',
					                    params: {allow_statistics:val},
					                    success: function( response, options ){					                    	
					                    	//this code is duplicated from mainframe.js
					                    	//the reason is because here we want the gw to send info when ever uset approves
					                    	//and in mainframe we want gw to keep and try sending in case of failure up to 10 tries
					                    	var jsonData = Ext.decode( response.responseText ); 
					                    	var data = jsonData.data;
					                    	 if(data.upgrade_update == "t" && data.allow_statistics==1){
					                    		 Ext.Ajax.request ({
					                                 url: "/cgi-bin/update_upgrade.tcl"
					                                 ,params:""
					                                 ,method: "GET"
					                                 ,success: ""
					                             });
					                    	 }
					                    },
					                    failure: function( response, options ){
					                    }
					                });
					                
					            }
					        });
						} else { //if configured - display message of the day
							CP.UI.displayMsgOfTheDay();
						}
					}
                    // We always have to destroy the lock's qtip element (except for the 1'st time) 
                    var configLockQtip = Ext.getCmp( 'config_lock_qtip' );
                    if (configLockQtip){ // if it's not the 1'st time we open the webUI 
                        configLockQtip.destroy();
                    }
                    
                    if((type != "releaseLock" && CP.global.token == -1) || (type ==  "releaseLock" && CP.global.token != -1)){
                        tdInfoLock.setIconCls("btn_lock_no");
                        tdInfoLock.setDisabled(false);
                        tdInfoLock.setHandler(CP.util.configLock_click);
                        //disable buttons in toolbar
                        if (btnScratchPad) btnScratchPad.disable();
                        btnViewMode.disable();
                        if (btnFeedBack)
                        	btnFeedBack.disable();
						if (btnTacacsEnable)
							btnTacacsEnable.disable() ;
						
						var lockAlignment = (Ext.firefoxVersion) ? "top" : "center";  // (Ext.firefoxVersion==0) if not FF
						if (!Ext.getCmp('webui_terminal_console_win')){ // do not show ToolTip as long as the terminal object exists
							// Database is locked by another user
							Ext.create( 'CP.WebUI4.ToolTip' ,{
								target: 'tb_info_lock', //the button in toppanel to render this tooltip on
								id: 'config_lock_qtip', //use this id in mainframe page (init function) to display the tooltip automaticaly
								anchor: 'top', //align the tooltip message to the center of button
								defaultAlign: 'c',
								title: 'Configuration Locked',
								closable: true, //display close x button
								autoHide: true,
								dismissDelay: 25000, //auto hide after 10 seconds
								anchorOffset: -9, //align the anchor (little triangle on top) to the left of the tooltip
								width: 222,
								padding: (CP.util.isIE8()) ? 0 : 8,
								html: 'The configuration database is currently locked by ' + lockedBy +/* lockedFrom + */'. Click the lock icon (  <img src="../images/toolbar/read-cloured-black.png" width="9" height="12" align='+lockAlignment +' />  ) above to obtain lock.'
							}).show();
						}
                    } else {
                        tdInfoLock.setIconCls("btn_lock");
                        tdInfoLock.setHandler(CP.util.configUnlock_click);
                        //enable buttons in toolbar
                        if (btnScratchPad) btnScratchPad.enable();
                        btnViewMode.enable();
                        if (btnFeedBack)
                        	btnFeedBack.enable();
						if (btnTacacsEnable)
							btnTacacsEnable.enable() ;

    
                        // Database is locked by us
                        Ext.create( 'CP.WebUI4.ToolTip' ,{
                            target: 'tb_info_lock', //the button in toppanel to render this tooltip on
                            id: 'config_lock_qtip', //use this id in mainframe page (init function) to display the tooltip automaticaly
                            autoHide: true,
                            dismissDelay: 3000, //auto hide after 10 seconds
                            html: 'Configuration lock acquired'
                        });
                    }
                }
            },
            failure: function( response ){
            	if (!noAlert) {
	                CP.WebUI4.Msg.show({
	                   title: 'Error',
	                   msg: 'Failed to acquire the lock',
	                   buttons: Ext.Msg.OK,
	                   icon: 'webui-msg-error'
	                });
            	}
            }
        });
    }
    
    //Find a specific node in the navtree (usually by its name in the tree),
    //and simulate a click on it to display the page
    ,gotoPage: function( findByValue, findByName, tabName ){
        var tree = Ext.getCmp( 'cptree' );
        var rootTree = tree.getRootNode();
        var findByName = ( !findByName ) ? 'url' : findByName;
        var treeNode = rootTree.findChild( findByName, findByValue, true );
        if(CP.WebUI4.Navtree.handleDirtyPage( treeNode ))
			CP.WebUI4.Navtree.transferPage(treeNode);
        
        if( tabName ){
            //if a tab name was defind switch to it
            Ext.getCmp("tab-panel").setActiveTab( tabName +'-tab' );
        }
    }
    
    //Redirects user back to the login page
    ,redirectToLogin: function(show_redir_msg){
    	if (show_redir_msg){
	    	CP.WebUI4.Msg.show({
	            title: 'Redirecting',
	            msg: 'Redirecting to login page...',
	            closable: false,
	            icon: Ext.Msg.INFO,
	            fn: function(button, text, opt) {
	            }
	        });
    	}
        var loginUrl = _sstr + "/cgi-bin/login.tcl";
        document.location = loginUrl;
    }
    
	//Redirects user back to about:blank
	//in case no connectivity after reboot/revert show this message to the user
	,rebootTimeout:function(){
		CP.WebUI4.Msg.show({
            title: 'No Response from Server',
            msg: 'No Response from server. It could be that the IP address of the machine changed. Please connect again manually to Portal.',
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.WARNING,
            fn: function(button, text, opt) {
				document.location = "about:blank";
            }
        });
		
	}
	
	//recursively try to reconnect to login page
	,connectToLogin:function(){
		Ext.Ajax.request({
				url: "/cgi-bin/conflock.tcl?option=releaseLock&token="+ CP.global.token
				,timeout : 1000
				,success: function(){
					CP.util.redirectToLogin(true);
				}
				,failure: CP.util.connectToLogin
			});
	}
    /*This session timer is supposed to keep track of the time the user is connected through the portal*/
	/*This time is also monitored by the apache, however, in pages where there are frequent requests being sent*/
	/* this timer is needed in order to initiat disconnection.*/
    ,startSessionTimer:function(){
        CP.global.sessionTask.delay(CP.global.sessionTimeout);
    }
    
    /*
     * Performs an AJAX request in way that doesn't reset the session timeout
     * timer.  This is needed for auto-refresh tasks so that the user session will
     * still time out even when the auto-refresh keeps happening.
     */
    ,doAutoRequestRunnable: function(reqUrl, reqMethod, successCallback, autoSend){
        if (autoSend) {
            autoSend = true;
        } else {
            autoSend = false;            
        }
        
        Ext.Ajax.request({
            url: reqUrl,
            method: reqMethod,
            sentAutomaticaly: autoSend, /*non-ExtJs - used to preserve the session timeout. caught in 'webui-core.js'*/
            success: function(jsonResult) {
                if (!CP.WebUI4.Toppanel.suspendNetInteraction){
                    successCallback(jsonResult);
                }
            }
        });
    }
 
	/*This function returns a component ready to binded by the 'Ext.TaskManager.start' to a thread which will be ran at fixed intervals.
	  This function is created in order to dictate all behaviour common to threads sending automatic requests to the server.*/
	,createFrequentRequestRunnable: function(reqUrl, reqMethod, successCallback, reqInterval){
		return {
			run: function() {
					Ext.Ajax.request({
					url: reqUrl,
					method: reqMethod,
					sentAutomaticaly: true, /*non-ExtJs - used to preserve the session timeout. caught in 'webui-core.js'*/
					success: function(jsonResult) {
								if (!CP.WebUI4.Toppanel.suspendNetInteraction){
									successCallback(jsonResult);
								}
							}
				});
			}, 
			interval: reqInterval*1000
		}
	}
    /*
     * Gets hours, minutes and seconds and returns a string representing time according to the format
     */
    ,timeToStr:function(hours, minutes, seconds){
    	if ( (typeof(hours) == "undefined") || (typeof(minutes) == "undefined") )
    		return "";

    	var timeStr = "";
    	var ampm = "";
    	
    	if (CP.global.formatTime == "12-hour" && hours > 12){
    		hours -= 12;
    		if (hours == 12)
    			ampm = " AM"; //originally was 24
    		else
    			ampm = " PM";
    	}
    	else if (CP.global.formatTime == "12-hour"){
    		if (hours == 12)
    			ampm = " PM";
    		else
    			ampm = " AM";
    		
    		if (hours == 0)
    			hours = 12;
    	}
    	hours = new String(hours);
    	if (hours.length == 1)
    		hours = "0" + hours;

    	minutes = new String(minutes);
    	if (minutes.length == 1)
    		minutes = "0" + minutes;

    	timeStr = hours + ":" + minutes;
    	
		if (typeof(seconds) != "undefined"){
			seconds = new String(seconds);
			if (seconds.length == 1)
				seconds = "0" + seconds;
			timeStr += ":" + seconds;
		}
		if (ampm != "")
			timeStr += ampm;
    	return timeStr;
    }
    
    /*
     * Gets time in 24-hour format and converts it according to the format defined in the system.
     * Returns: formatted time
     */
    ,displayTime:function(timeStr){
    	if (typeof(timeStr) != "undefined"){
	    	var timeArr = new String(timeStr).split(":");
	    	var hr, min, sec;
	    	if ( (timeArr.length >= 1) && (typeof(timeArr[0]) != "undefined") )
	    		hr = parseInt(timeArr[0], 10);
	    	if ( (timeArr.length >= 2) && (typeof(timeArr[1]) != "undefined") )
	    		min = parseInt(timeArr[1], 10);
	    	if ( (timeArr.length >= 3) && (typeof(timeArr[2]) != "undefined") )
	    		sec = parseInt(timeArr[2], 10);
	    	
	    	return CP.util.timeToStr(hr, min, sec);
    	}
    	return "";
    }
    
    /*
     * Gets day, month and year and returns a string representing date according to the format
     */
    ,dateToStr:function (day, month, year)
    {
    	if ( (typeof(day) == "undefined") || (typeof(month) == "undefined") || (typeof(year) == "undefined") )
    		return "";
    	
        var dateStr = "";
        // add '0' to the month and day if it's value is 1-9. i.e., 6 -> 06
        day = new String(day);
        if (day.length == 1)
        {
        	day = "0" + day;
        }
        month = new String(month);
        if (month.length == 1)
        {
        	month = "0" + month;
        }
        // set the date according to the format
        if (CP.global.formatDate == "yyyy/mm/dd")
        {
        	dateStr = new String(year) + '/' + month + '/' + day;
        }
        else if (CP.global.formatDate == "mm/dd/yyyy")
        {
        	dateStr = month + '/' + day + '/' + new String(year);
        }
        else if (CP.global.formatDate == "dd/mm/yyyy")
        {
        	dateStr = day + '/' + month + '/' + new String(year);
        }
        else if (CP.global.formatDate == "dd-mmm-yyyy")
        {
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            dateStr = day + '-' + months[parseInt(month, 10) - 1] + '-' + new String(year);
        }
        return dateStr;
    }
    
    /*
     * Gets date in format yyyy-mm-dd and converts it according to the format defined in the system.
     * Returns: formatted date
     */
    ,displayDate:function(dateStr){
    	if (typeof(dateStr) != "undefined"){
	    	var dateArr = new String (dateStr).split("-");
	    	
	    	var year, day, month;
	    	if ( (dateArr.length >= 1) && (typeof(dateArr[0]) != "undefined") )
	    		year = parseInt(dateArr[0], 10);
	    	if ( (dateArr.length >= 2) && (typeof(dateArr[1]) != "undefined") )
	    		month = parseInt(dateArr[1], 10);
	    	if ( (dateArr.length >= 3) && (typeof(dateArr[2]) != "undefined") )
	    		day = parseInt(dateArr[2], 10);
	    	
	    	
	    	return CP.util.dateToStr(day, month, year);
    	}
    	return "";
    },
	
	isPermittedFeature: function(featureName) {
		var featuresArr = CP.global.allowedFeaturesArray;
		if  (featuresArr == null){
			return false;
		}
		if (featuresArr[0] == "MRMA_ALL" ) return true;
		for( var i=0 ; i < featuresArr.length ; i++ ){
			if (featuresArr[i] == featureName) return true;
			else if (featuresArr[i] == "MRMA_ALL") return true;
		}
		return false;
    },
	// retuns "ro" or "rw"  or null on failure.
	featurePermission: function(featureName){
		var featuresArr = CP.global.allowedFeaturesArray;
		
		if (!featuresArr) return null; // no feature is permitted

		if (!CP.util.isPermittedFeature(featureName)) return null;
				
		for( var i=0 ; i < featuresArr.length ; i++ ){
			if (featuresArr[i] == featureName) return CP.global.allowedFeaturesPermissionsArray[i];
		}

		if (featuresArr[0] == "MRMA_ALL")
			return CP.global.allowedFeaturesPermissionsArray[0];
		else
			return null;
	},
	
 
   /**methods**/   
	rebootingWindow:function(winTitle,content,sendAfter){
		CP.global.isRebooting = true ;
		var height = 100;
		var window = Ext.create('CP.WebUI4.ModalWin', {
			id: "modal-window-reboot"
			,title:winTitle
			,layout:"fit"
			,width: 400
			,plain: true
			,modal: true
			,forceFit: true
			,closable: false
			,height:height
			//,autoHeight: true
			,items: [{
				xtype: 'cp4_panel'
				,border: false
				,padding: 25
				,cls: "shutdown"
				,html: content
				,id: "rebooting-panel"
			}]
			
		});
		window.show();
		
		setTimeout("CP.util.connectToLogin()", sendAfter);
		setTimeout("CP.util.rebootTimeout()", 960000); // 16 minutes
	},

	/* 
		Internet Explorer has some compatability issues and is inconsistent with the "Ext.isVersion" API.
		There are times that IE8 return 8 and some other times when it returns 7. Same goes for IE9.
		That's why we'll identify IE8 by it's documentMode. The document mode may be inconsistent too but
		when it's smaller than 9 we can be sure that it is not a working IE9.
		Because of the fact that we are supporting only IE8 and above, every IE browser that has documentMode that is smaller than 9
		will return true, otherwise will return false.
	*/
	isIE8:function(){
		
		if (Ext.isIE && document.documentMode && document.documentMode < 9)
		{
			return true;
		}
		return false;
		
	},

	isValidHostName: function(val){

		var len = val.length;
		if(len >= 64) {
			return "host name must consist of up to 64 characters";
		}

		for(var i=0; i<len; i++) {
			if(i == 0 || i == len-1) {
				if(val.charAt(i) == '-' || val.charAt(i) == '.') {
					return "host name must not begin or end with '-' or '.'";
				}
			}
			if(!((val.charAt(i) >= 'a' && val.charAt(i) <= 'z') ||
				(val.charAt(i) >= 'A' && val.charAt(i) <= 'Z') ||
				(val.charAt(i) >= '0' && val.charAt(i) <= '9') ||
				(val.charAt(i) == '-' || val.charAt(i) == '.')
				)) {
					return "invalid characters for host name";
			}
		}		
		return true;
	},
	
    /*
     * Validates an IPv4 address value, presumably provided by user input.
     */	
    isValidIPv4Ex: function(val, entityType, rejectBlank, rejectZeroFirstOctet, rejectLoopback, rejectMulticast, rejectGlobalBroadcast) {
        var incompleteMsg = "The " + entityType + " value is incomplete";

        if (!val || val == "" || val == "...") {
            if (rejectBlank) {
                return "The " + entityType + " cannot be blank";
            } 
            return true;
        }

        val = String(val);

        var octetArr = val.split('.');

        /* Check for too many octets */
        if (octetArr.length > 4) {
            return "The " + entityType + " value contains more than 3 '.' separators";
        }

        /* 
         * Perform all validations on the first octet before the
         * second, etc.
         *
         * In practice this seems to result in the most intuitive behavior
         * for the user.
         */

        /* First octet validation */
        if (octetArr.length > 0) {
            if (!octetArr[0] || octetArr[0] == "") {
                if (octetArr.length == 4 && octetArr[1] == "" && octetArr[2] == "" && octetArr[3] == "") {
                    return incompleteMsg;
                }

                return "The first field of the " + entityType + " cannot be blank";
            }
 
            var minValue;
            if (rejectZeroFirstOctet) {
                minValue = 1;
            } else {
                minValue = 0;
            }

            var ival = parseInt(octetArr[0]);
            if (isNaN(ival) || ival < minValue || ival > 255) {
                return "The " + entityType + " must start with a value between " + minValue + " and 255";
            }

            if (rejectMulticast) {
                if (ival > 223 && ival < 240) {
                    return "The value cannot be a multicast address";
                }
            }

            if (rejectLoopback) {
                if (ival == 127) {
                    return "The value cannot be a loopback address";
                }
            }
        }

        /* Second octet validation */
        if (octetArr.length > 1) {
            if (!octetArr[1] || octetArr[1] == "") {
                if (octetArr[2] == "" && octetArr[3] == "") {
                    return incompleteMsg;
                }
    
                return "The second field of the " + entityType + " cannot be blank";
            }
 
            var ival = parseInt(octetArr[1]);
            if (isNaN(ival) || ival < 0 || ival > 255) {
                return "The second field of the " + entityType + " is not valid.  It must be between 0 and 255";
            }
        }
    
        /* Third octet validation */
        if (octetArr.length > 2) {
            if (!octetArr[2] || octetArr[2] == "") {
                if (octetArr[3] == "") {
                    return incompleteMsg;
                }
    
                return "The third field of the " + entityType + " cannot be blank";
            }

            var ival = parseInt(octetArr[2]);
            if (isNaN(ival) || ival < 0 || ival > 255) {
                return "The third field of the " + entityType + " is not valid.  It must be between 0 and 255";
            }
        }
    
        /* Fourth octet validation */
        if (octetArr.length > 3) {
            if (!octetArr[3] || octetArr[3] == "") {
                return incompleteMsg;
            }

            var ival = parseInt(octetArr[3]);
            if (isNaN(ival) || ival < 0 || ival > 255) {
                return "The fourth field of the " + entityType + " is not valid.  It must be between 0 and 255";
            }
        }

        /* Check for missing octets */
        if (octetArr.length < 4) {
        	return incompleteMsg;
        }

        if (rejectGlobalBroadcast) {
            if (octetArr[0] == "255" && octetArr[1] == "255" && octetArr[2] == "255" && octetArr[3] == "255") {
                return "The value cannot be 255.255.255.255";
            }
        }

        return true;
    },
    
    /*
     * function: getIPv6AddressType()
     * 
     * Detects if the given IPv6 address is link-local, site-local, or other.
     * 
     * There are various types of "other" addresses but currently we only need
     * to check if an IPv6 address is link-local site-local, or not.
     * 
     * The provided IP address is expected to be in a format 
     * resulting from a call to CP.ip6convert.ip6_2_db()
     * 
     * Return values:
     *          CP.util.ADDR_TYPE_OTHER (0)
     *          CP.util.ADDR_TYPE_V6_LINK_LOCAL (1),
     *          CP.util.ADDR_TYPE_V6_SITE_LOCAL (2),
     * 
     * When modifying the behavior of this function, please update the tcl
     * version in validate.tcl to remain consistent so that WebUI and clish
     * behave in a consistent manner.
     */
    ADDR_TYPE_OTHER: 0,
    ADDR_TYPE_V6_LINK_LOCAL: 1,
    ADDR_TYPE_V6_SITE_LOCAL: 2,
    getIPv6AddressType: function(dbValue) {
        var retval = CP.util.ADDR_TYPE_OTHER;
        
        /* 
         * For link-local or site-local, the first 10 bits will match "fe80"
         * But, it is expensive to convert from string to number so we'll just
         * do the comparisons using strings 
         */
        if (dbValue && dbValue.length > 4) {
            /* Should already be in lowercase but make sure */
            dbValue = dbValue.toLowerCase();
            
            if (dbValue.charAt(0) == 'f' && dbValue.charAt(1) == 'e') {
                /* First 8 bits match, now look at the next 2 */
                var chVal = dbValue.charAt(2);
                
                /* Anything between FE80 and FEBF is link-local or site-local */
                if (chVal >= '8' && chVal <= 'b') {                    
                    if (dbValue.substr(0,16) == "fe80000000000000") {
                        /* Link local is anything within fe80::/64 */
                        retval = CP.util.ADDR_TYPE_V6_LINK_LOCAL;
                    } else {
                        /* 
                         * Site local is anything within fe80::/10 other 
                         * than link-local 
                         */
                        retval = CP.util.ADDR_TYPE_V6_SITE_LOCAL;
                    }
                }
            }
        }
        
        return retval;
    },
       
    /*
     * Validates an IPv6 address value, presumably provided by user input.
     * 
     * When modifying the behavior of this function, please update the tcl
     * version in validate.tcl to remain consistent so that WebUI and clish
     * behave in a consistent manner.
     */ 
    isValidIPv6Ex: function(val, rejectBlank, rejectZero, rejectLoopback, 
            rejectMulticast, rejectLinkLocal, requireLinkLocal) {
        
        if (!val || val == "") {
            if (rejectBlank) {
                return "The IPv6 address cannot be blank";
            }
            return true;
        }

        val = String(val).toLowerCase();
        if ((':'==val[0] && ':'!=val[1]) 
                ||  (':'==val[val.length-1] && ':'!=val[val.length-2])) {
            return "A single colon is not allowed in the begining or end of " 
                    + "the IPv6 address";
        }

        if (-1!=val.indexOf(':::')) {
            return "The IPv6 address has three consecutive colons (:::)";
        }        

        if (val.indexOf('::') != val.lastIndexOf('::')) {
            return "The IPv6 address has more than one occurence of " 
                    + "consecutive colons (::)";
        }
        
        var fieldArr = val.split(':');
        if (fieldArr.length == 1 && -1==val.indexOf('::')) {
            return "The IPv6 address is incomplete.  Please enter 8 groups of " 
                    + "16-bit hexadecimal values separated by colons (:)";
        }

        if (fieldArr.length>8){
            return "The IPv6 address has too many fields." 
                    + "  Enter no more than 8 fields";
        }

        if (fieldArr.length!=8 && -1==val.indexOf('::')){
            return "The IPv6 address has too few fields." 
                    + "  Enter 8 fields or '::'";
        }

        for (var i=0; i<fieldArr.length; i++) {
            var currField = fieldArr[i];
                
            if ("" != currField) {
                if (currField.length > 4) {
                    return "Address field number " + (i+1) + " has too many " 
                            + "characters";
                }
                
                for (var j=0; j < currField.length; j++) {
                    var hexaDigit = currField.charAt(j).toLowerCase();
                    var hexaDigitCode = hexaDigit.charCodeAt();
                    if (!((0<=hexaDigit && 9>=hexaDigit)
                            || ((hexaDigitCode >= 'a'.charCodeAt())
                                    &&(hexaDigitCode<='f'.charCodeAt())) )) {
                        return "Address field number " + (i+1) 
                                + " contains invalid characters";
                    }
                }
            }
        }

        var dbValue = CP.ip6convert.ip6_2_db(val);
        if (rejectMulticast) {
            if (dbValue.length > 1 && dbValue.substr(0,2) == "ff") {
                return "The value cannot be an IPv6 multicast address";
            }
        }

        if (rejectZero) {
            if (dbValue == "00000000000000000000000000000000") {
                return "The IPv6 address cannot be unspecified or zero";
            }
        }

        if (rejectLoopback) {
            if (dbValue == "00000000000000000000000000000001") {
                return "The value cannot be an IPv6 loopback address";
            }
        }
        
        var addrType = CP.util.getIPv6AddressType(dbValue);
        
        if (addrType == CP.util.ADDR_TYPE_V6_SITE_LOCAL) {
            /*
             * Unconditionally reject site local address values.
             * 
             * We have no logic which understands site-local, and 
             * site-local addresses have been formally deprecated per 
             * RFC4291 and RFC3879. 
             */
            return "The value cannot be an IPv6 site-local address";                
        } else if (addrType == CP.util.ADDR_TYPE_V6_LINK_LOCAL) {
            if (rejectLinkLocal) {
                return "The value cannot be an IPv6 link-local address";
            }
            
            /* 
             * This check came from the validation logic in vrrp6.js for
             * backup addresses.  But I suspect it applies to link-local 
             * addresses in general, so it has been moved to here.
             */
            var badlinklocal = "fe800000000000000000000000000000";            
            if (dbValue == badlinklocal) {
                return "FE80:: is an invalid link-local address"                
            }
        } else {
            if (requireLinkLocal) {
                return "IPv6 link local addresses must have FE80::/64 " 
                        + "as a prefix";
            }
        }
    
        return true;
    },
    
    /*
     * Normalized the given value and then determines if it represents
     * a link-local address. 
     * 
     * If the caller already has a normalized value
     * then for efficiency avoid this function and call getIPv6AddressType()
     * directly instead.
     */
    isLinkLocal: function(rawValue) {
        var normalizedValue = CP.ip6convert.ip6_2_db(rawValue);
        var addrType = CP.util.getIPv6AddressType(normalizedValue);
        return addrType == CP.util.ADDR_TYPE_V6_LINK_LOCAL;
    },
  
	isValidIPv4: function(val){
        return CP.util.isValidIPv4Ex(val, "address", true, true, false, false, false); 
	},
	
	isValidIPv6: function(val){
        return CP.util.isValidIPv6Ex(val, false, false, false, false, false, false);
	},
	
	//subnet mask / length renderer
	showSubnetMask_Length: function (val, meta, record)
	{
		function cidrToDecOctet( nMask ){
			var intMask = parseInt( nMask );
			if( isNaN( intMask )){
				return '';
			}
			if( intMask < 1 ){
				return 0;
			}
			var nCalc = 255;
			for( var nX = 7 ; nX > -1 ; nX-- ){
				if( intMask <= 0 ){
					nCalc = nCalc << 1;
					nCalc = 255 & nCalc;
				}
				else
					intMask -= 1;
			}
			return nCalc;
		}

		function decToCIDR( decVal ){
			var num = 0;
			switch( decVal ){
				case '255':
					num = 8;
				break;
				case '254':
					num = 7;
				break;
				case '252':
					num = 6;
				break;
				case '248':
					num = 5;
				break;
				case '240':
					num = 4;
				break;
				case '224':
					num = 3;
				break;
				case '192':
					num = 2;
				break;
				case '128':
					num = 1;
				break;
				default: //'0'
					num = 0;
				break;
			}
			return num;
		}

		if(val == "")
			return "-";

		if(CP.global.formatNotation == 'Length') { //cidr notation
			if(String(val).indexOf('.') == -1)  {
				return val;
			} else {
				var octetVals = String(val).split( '.' );

				return decToCIDR( octetVals[0] ) + decToCIDR( octetVals[1] ) +
							  decToCIDR( octetVals[2] ) + decToCIDR( octetVals[3] );
			}
		} else { //dotted notation
			if(String(val).indexOf('.') == -1)  {
				return cidrToDecOctet( val ) + "." + cidrToDecOctet( val - 8 ) +
								   "." +  cidrToDecOctet( val - 8 * 2 ) + "." + cidrToDecOctet( val - 8 * 3 );
			} else {
				return val;
			}
		}
	}
	
	
    };
}();

// License-related utilities
CP.util.license = {
	machine_epoch: 0,
	
	set_machine_epoch: function(val) {
		var epoch_str= val;
		var epoch_str = epoch_str.replace(/'/g, ''); //remove surounding '  
		CP.util.license.machine_epoch = Number(epoch_str);
	},
	
	createBladesGrid: function(gridId, storeId, width, height) {
		var grid_cols = [
			{header: "Blade Name",cls: 'summary-column', flex: 1.5, renderer: CP.util.license.render_blade, dataIndex: 'Name', sortable: true,hideable: false},
			//{header: "State",cls: 'summary-column', flex: 1, dataIndex: 'Activation', sortable: true, hideable: false, draggable: false},
			{header: "Status",cls: 'summary-column', flex: 1, renderer: CP.util.license.render_status, dataIndex: 'Entitlement', sortable: true,hideable: false},
			{header: "Expiration",cls: 'summary-column', flex: 1, renderer: CP.util.license.render_exp, dataIndex: 'Expiration', sortable: true,hideable: false},
			{header: "Additional Info",cls: 'summary-column', flex: 1,  renderer: CP.util.license.render_impact, dataIndex: 'Impact', sortable: true,hideable: false}
		];
		
		var ftw_grid_cols = [
			{header: "Blade",cls: 'summary-column', flex: 2.5, renderer: CP.util.license.render_blade, dataIndex: 'Name', sortable: false,hideable: false},
			{header: "Status",cls: 'summary-column', flex: 1.3, renderer: CP.util.license.render_status, dataIndex: 'Entitlement', sortable: false,hideable: false},
			{header: "Expiration",cls: 'summary-column', flex: 1, renderer: CP.util.license.render_exp, dataIndex: 'Expiration', sortable: false,hideable: false}
		];

		var jstore = Ext.create( 'CP.WebUI4.Store',{ 
			storeId: storeId,
			proxy: {
				type: 'memory',
				reader: {
						root: 'Blades',
						type: 'xml',
						record: 'Blade'
					}
			},
			fields: [
        {name: 'Id', type: 'string', mapping: '@Id'},
        {name: 'GUI_Order', type: 'number'},
        {name: 'Name', type: 'string'},
        {name: 'Activation', type: 'string'},
        {name: 'Entitlement', type: 'string'},
        {name: 'Expiration', type: 'string'},
        {name: 'Quota_used', type: 'number' },
        {name: 'Quota_total', type: 'number' },
        {name: 'Impact', type: 'string'}
			],
			autoLoad: false
		});	
		
		var blades_grid;
		
		if ( gridId =="blades_grid" ) { 
			// WebUI
			blades_grid = Ext.create('CP.WebUI4.GridPanel', {
				id: gridId,				
				store: jstore,
				columns: grid_cols,
				bodyBorder : true,
				border: false,
				viewConfig: {
				forceFit: true,
					scrollOffset:0
				}, 
				height: height,
				width: width		
			});
		}
		else { //FTW
			blades_grid = Ext.create('CP.WebUI4.GridPanel', {
				id: gridId,
				store: jstore,
				columns: ftw_grid_cols,
				cls: 'blades-grid' ,
				bodyBorder : false,
				border: false,
				viewConfig: {
					forceFit: true,
					scrollOffset:0
				}, 
				height: height,
				width: width		
			});
		
		}
		
		jstore.sorters.add(new Ext.util.Sorter({
			sorterFn: function(a, b){

				var sortByStatus = function(a , b){					
					var final_status_values = {
						'Entitled': 2, /* green */
						'Available': 2, /* green */
						'About To Expire': 1, /* yellow */
						'Quota Warning': 1, /* yellow */
						'About To Expire , Quota Warning': 1, /* yellow */
						'Not Entitled': 0, /* red */
						'Quota Exceeded': 0, /* red */
						'Expired': 0, /* red */
						'N/A': 0 /* red */
					};

					var a_final_status = CP.util.license.get_final_status(a);
					var b_final_status = CP.util.license.get_final_status(b);
										
					if(final_status_values[a_final_status] < final_status_values[b_final_status]) return -1;
					if(final_status_values[a_final_status] > final_status_values[b_final_status]) return 1;
					return 0;				
				}

				var sortByGUI_Order = function(a , b ){
					if(parseInt(a.data.GUI_Order) < parseInt(b.data.GUI_Order)) return -1;
					if(parseInt(a.data.GUI_Order) > parseInt(b.data.GUI_Order)) return 1;
					return 0;
				};

				ans = sortByStatus (a,b);
				if (ans == 0)
					ans =  sortByGUI_Order ( a,b);

        return ans;
			}
		}));
		
		return blades_grid;
	},
	
	/*************** Custom Blades Grid column renderers ********************/
	get_blade_icon_cls: function(blade_id) {
		var icon_cls = "blades_unknown";
		if (CP.global.g_blade_table[blade_id])
			return CP.global.g_blade_table[blade_id];
		
		return icon_cls;
	},

	// Custom function used for desc renderer
	render_blade: function( val, meta, rec ) {
		var rc = '<span>' + val + '</span>';
		var icon_cls = CP.util.license.get_blade_icon_cls(rec.data.Id);
		if (icon_cls != "") {
				rc = '<div class="' + icon_cls + '" style="padding-left:20px; line-height: 20px;">' + val + '</div>';
		} else {
			icon_cls = "blades_unknown";
			rc = '<div class="' + icon_cls + '" style="padding-left:20px; line-height: 20px;">' + val + '</div>';
		}
		
		return rc;
	},
	
	render_impact: function(val, meta, rec) {
		meta.tdAttr = 'data-qtip="' + val + '"';
        return val;	
	},
	
	addToImpact: function(record, msg) {
		//add msg to the Impact, but only once
		if (record.data.Impact.indexOf(msg)== -1 ) {
			record.data.Impact= record.data.Impact=="" ? msg : (msg +"<br>" +record.data.Impact);
		}		
	},	
	
	// exp - expiration date.
	check_near_expiration: function(exp, days_threshold){	
		
		var now = Number(CP.util.license.machine_epoch);
		if (exp == 0 || now ==0)
			return false;
		
		var near_expiration = false;
		var expired = false;
		exp = Number(exp);
		
		if (exp < now) {
			expired = true;
		} else {
			var ndays = ((exp-now) / (24*60*60));
			if (ndays <= days_threshold)
					near_expiration = true;		
		}			
		return near_expiration;
	},	

	// return 0 = not exeeded, 1= about to exeed , 2=exeeded
	check_quota_about_to_exceed: function(Quota_used, Quota_total){	
		if (Quota_used == 0 || Quota_total == 0 || Quota_total == -1)
			return 0;
		
		var ans = 0;
		var perc = (Quota_used * 100) / Quota_total;
		
		if (perc >= 90 && perc <= 100) {
			ans = 1;
		}
		else if (perc > 100) {
			ans = 2;
		}
		return ans;
	},	

	
	// Custom function used for exp renderer
	// need to decide if we want to add exp_message as written in /tmp/blades.xml
	render_exp: function( val, metaData, record ) {
		var rc = "";
		var date_str = "";

		if ( record.data.Entitlement == "Not Entitled" || record.data.Entitlement == "N/A" ) {
			date_str = "";
		} 
		else if (val) {
			if (val != "0") {
				// convert unix timestamp (time_t) to milliseconds
				var d = new Date(val * 1000);
				date_str = CP.util.dateToStr(d.getDate(), d.getMonth()+1, d.getFullYear());
				
				if ( record.data.Entitlement == "Evaluation" ) 
					date_str = date_str + " (evaluation)"
			} else {
				date_str = "Never";
			}
		}
	
		rc = '<div>' + date_str + '</div>';
		return rc;
	},
	
	get_final_status: function (record) {
	
		finalStatus = '';
		
        if ( record.data.Activation == "Off" ){
				return 'Available';
		}
		
		if( record.data.Entitlement == 'Entitled' || record.data.Entitlement == 'Evaluation' ){
			
			finalStatus = 'Entitled';
			 									
			// for real licenses calculate the expiration date to be "30 days and less"
			// for eval licenses calculate the expiration date to be "7 days and less"
			if( (record.data.Entitlement == 'Entitled' && CP.util.license.check_near_expiration(record.data.Expiration , 30 )) ||
				(record.data.Entitlement == 'Evaluation' && CP.util.license.check_near_expiration(record.data.Expiration , 7 ))){ 
				finalStatus = 'About To Expire';
			}
			
			var quota_string = '';
			if (record.data.Quota_total > 0){
				quota_string = "Quota: " + record.data.Quota_used + "/" + record.data.Quota_total;
			} else if(record.data.Quota_total == -1){				
				quota_string = "Quota: " + record.data.Quota_used + "/Unlimited";
			}
			
			var check_exeeded_quota = CP.util.license.check_quota_about_to_exceed(record.data.Quota_used, record.data.Quota_total);
			
			//deal with quota only on MOB, Capsule & TE cloud blades
			if( record.data.Id == "2000" || record.data.Id == "2001" || record.data.Id == "9" ) {
				
				/*add quota info*/
				if( record.data.Id == "9" )
					quota_string = quota_string + " Files";
				else
					quota_string = quota_string + " Users";			
												
												
				if (check_exeeded_quota == 1 ){
		
					if (finalStatus == "About To Expire")
						finalStatus = 'About To Expire , Quota Warning';
					else
						finalStatus = 'Quota Warning' ;
		
				}
			}
			
			// Contract enforcement CCB for R80.10 - only for APPI (4), URLF (5) and Content Awareness (13)
			// show massage when 'About To Expire'
			if (Ext.Array.contains([4,5,13], parseInt(record.data.Id))) {
				if (finalStatus.indexOf('About To Expire') !== -1){
					var msg_strings = {
						4: 'Application Control blade will be deactivated. All policy rules using it will be affected.',
						5: 'URL Filtering blade will be deactivated. All policy rules using it will be affected.',
						13: 'Content Awareness blade will be deactivated . All policy rules using  it will be affected.'
					};
					CP.util.license.addToImpact(record, msg_strings[record.data.Id]);
				}
			}

			if (check_exeeded_quota == 2 )				 
					finalStatus = 'Quota Exceeded'; 
			
			
			if(quota_string != '')
				CP.util.license.addToImpact(record, quota_string );
		}
		
		if(finalStatus == '')
			finalStatus = record.data.Entitlement;
		
		return finalStatus;
	
	},
	
	//rendering status but also other relative fields - like "Impact"
	render_status: function( val, metaData, record ) {
		
		var final_status_icons = {
			'Entitled': 'v_status',
			'About To Expire': 'about_to_expire_status',
			'Quota Warning': 'quota_warning_status',
			'About To Expire , Quota Warning': 'about_to_expire_status',
			'Not Entitled': 'no_license_status',
			'Quota Exceeded': 'quota_exceeded_status',
			'Expired': 'expired_status',
			'N/A': 'n_a_status',
			'Available': 'available_status'
		};
		
		var finalStatus = CP.util.license.get_final_status(record);
		
			
		return '<div class="' + final_status_icons[finalStatus] + '" style="padding-left:20px; line-height: 20px;">' + finalStatus + '</div>';		

	},
	
	filter_status: function (record) {
		var entitlement = record.data.Entitlement ;
		var active = record.data.Activation ;
		if ( entitlement && ( entitlement == 'Expired' || entitlement == 'Not Entitled' || entitlement == 'N/A' ) &&
			 active && (active == 'Off') )
				return false;
		
		return true;	
	},
	
	loadBlades: function(store_id) {
		Ext.Ajax.request({
			url: '/cgi-bin/getBlades.tcl',
			method: 'GET',	
			success: function(response, options) {
				var xmlResponse = response.responseXML;	
				var status = Ext.DomQuery.selectValue('Status', xmlResponse);
				if (status != "0") {
					Ext.getCmp('inlinemsg_activation').update( '<p style="color:black;">Activated successfully. Failed to load blade information.</p>');
					Ext.getCmp('inlinemsg_activation').setVisible(true);				
					var statusMsg = Ext.DomQuery.selectValue('StatusMsg', xmlResponse);
					return;
				}
				
				var bladesXml = Ext.DomQuery.select('Blades', xmlResponse);
				Ext.getStore(store_id).loadRawData(bladesXml);					
				Ext.getStore(store_id).clearFilter();
				Ext.getStore(store_id).filterBy(CP.util.license.filter_status);	
			},
			failure: function(response, options) {
			  // handle request failure 
				Ext.getCmp('inlinemsg_activation').update( '<p style="color:black;">Activated successfully. Failed to load blade information.</p>');
				Ext.getCmp('inlinemsg_activation').setVisible(true);
			}
		});
	}
	
 };
