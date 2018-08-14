/**
 * @author amatai, rthirugn
 */

CP.UI = {

accessMode: '',
readOnlyMsgId: 'readonly-mode-msg',
readOnlyElements4: null,
formElementTypes4: [ 'cp4_checkbox', 
                     'cp4_textfield', 
                     'cp4_button', 
                     'cp4_combobox', 
                     'cp4_numberfield', 
                     'cp4_textarea', 
                     'cp4_radio',
                     'cp4_displayfield',
                     'cp4_sliderfield',
                     'cp4_label',
                     'cp4_ipv4field',
                     'cp4_radiogroup'],
					 
ftwCompleted: false,

//initialize all
init: function(){	
    CP.UI.initGlobals();
    CP.UI.gotoFTWorMainframe();
}


//initialize all global vars that both mainframe and FTW are using.
,initGlobals: function(){
    //get all formats and defined them in globals so all pages in mainframe can use it
    CP.util.getTimeFormat();

	CP.util.getIPv6Status();
    //get the global var for timeout from the web session so that the mainframe can use it
    CP.util.getWebSessionTimeout();
}

,isRequestNotCameFromFTW: function(){
	var address_arr = new Array();
	var location_str = window.location.href;
	address_arr = location_str.split('?');	//parse the current location
	
	if(address_arr)
		if(address_arr.length >= 2)
			if(address_arr[address_arr.length - 1] == "=ftw") { 
				return false;	
			}
	return true;	
}

,isCloudMode: function(){
		var address_arr = new Array();
		var location_str = window.location.href;
		address_arr = location_str.split('?');	//parse the current location
		
		if(address_arr)
			if(address_arr.length >= 2)
				if(address_arr[address_arr.length - 1] == "=cloud")
					return true;	
		return false;	
}

//Check if user already configured the system using FTW, if so go to mainframe, 
//otherwise redirect to FTW
,gotoFTWorMainframe: function(){
    // If machine isn't initialized, launch FTW; if it is, disable link
    // to FTW in topPanel.
    Ext.Ajax.request({
        url: "/cgi-bin/configured.tcl",
	method: "GET",
        success: function( jsonResult ){
            //analyze response
            var jsonData = Ext.decode( jsonResult.responseText ); //turn ajax response into js object
            var data = jsonData.data;
			
			
			if (data.grid_refresh_rate) {
				CP.global.GridRefreshRate = data.grid_refresh_rate;
			}
						
			if (data.cluster_name) {
				CP.global.CloningGroupName = decodeURIComponent(data.cluster_name);
			}
			
			if (data.isCluster && data.isCluster == "true")
				CP.global.isCluster = true;		
					
			if (data.isClusterEnabled && data.isClusterEnabled == "true")
				CP.global.isClusterEnabled = true;		
				
			if (data.isRealCadmin && data.isRealCadmin == "true")
				CP.global.isRealCadmin = true;						
				
			if (data.LockSharedClusterFeaturesInAdminMode && data.LockSharedClusterFeaturesInAdminMode == "true")
				CP.global.LockClusterSharedFeatureInAdminMode = true;	
				
			if (data.LockSharedNonClusterFeaturesInCadminMode && data.LockSharedNonClusterFeaturesInCadminMode == "true")
				CP.global.LockClusterNonSharedFeatureInCAdminMode = true;					
				
			var i = 0;

			for(i = 0;i < data.cluster_features.length;i++) {
				CP.global.isClusterFeatureShared[data.cluster_features[i].feature_name] = 
					(data.cluster_features[i].is_shared == '1');
			}
				
            //FTW
           if(!CP.global.isCluster && CP.UI.isRequestNotCameFromFTW() && !CP.UI.isCloudMode() &&
            		data.configured == 0){            	
                // go to the FTW
                location.href = _sstr + '/cgi-bin/ftw_index.tcl';
                return;
            }
            
            //Mainframe
            else{            	           	
                // link is active by default. need's to be disaled in case the Wizard has finished once.
                if (data.configured == 1 ) CP.UI.ftwCompleted = true;
                if (data.ea && data.ea != "")
                	CP.global.isEA = true;
                if (data.isMgmt && data.isMgmt == "true")
                	CP.global.isMgmt = true;
                if (data.isMds && data.isMds == "true")
                	CP.global.isMds = true;
                if (data.isGW && data.isGW == "true")
                	CP.global.isGW = true;
                if ((typeof(data.submitterName) != "undefined") && (data.submitterName))
                	CP.global.submitterName = data.submitterName;
                if ((typeof(data.submitterEmail) != "undefined") && (data.submitterEmail))
                	CP.global.submitterEmail = data.submitterEmail;
                if ((typeof(data.submitterOrganization) != "undefined") && (data.submitterOrganization))
                	CP.global.submitterOrganization = data.submitterOrganization;
                if (jsonData.data.login_count && jsonData.data.login_count != "")
             	   CP.global.loginCount = parseInt(jsonData.data.login_count,10);
                if ((typeof(jsonData.data.allow_statistics) != "undefined") && jsonData.data.allow_statistics.toString() != "")
              	   CP.global.allowStatistics = parseInt(jsonData.data.allow_statistics,10);
              //this code is duplicated in util.js
            	//please see the comments in util.js                
                if(jsonData.data.upgrade_update == "t" && CP.global.allowStatistics==1){
                	  Ext.Ajax.request ({
                          url: "/cgi-bin/update_upgrade.tcl"
                          ,params:""
                          ,method: "GET"
                          ,success: ""
                      });
                }
				CP.global.allowedFeaturesArray = data.userFeatures.split(' ');
				CP.global.allowedFeaturesPermissionsArray = data.userFeaturesPermissions.split(' ');
				
				
                CP.UI.buildMainframe();  /*finally build the mainframe - from now on all Ajax are asynchronic !!!*/
				}
        }
    });
}


,buildMainframe: function(){
    // Enable QuickTips globally
    Ext.tip.QuickTipManager.init();    
    
    //build the application main layout using the Viewport class
    Ext.create( 'Ext.Viewport',{
        layout: {
            type: 'border'
        },
        renderTo: Ext.getBody(),
        items: [ CP.WebUI4.Toppanel,
                 CP.WebUI4.Navtree,
                 CP.WebUI4.CenterPanel,
                 CP.WebUI4.StatusBar ]			
    });
    
    // Get the timer updated
//    CP.UI.clockTicker();

    // Get the config lock
    CP.util.configLock_req( 'createLockInMainframe', true );
	
	    CP.UI.afterLoading();
}


//obj=page panel object
//tab= "" or CP.global.config or CP.global.overview or CP.global.monitor
,updateDataPanel: function( obj, tab, autoRefresh ){
    var configPanel = Ext.getCmp( 'config-tab' );
    var monitorPanel = Ext.getCmp( 'monitor-tab' );
    var centerPanel = Ext.getCmp( 'centerPanel' );
    var statusBar = Ext.getCmp( 'status-bar' );
    var overviewPanel = Ext.getCmp( 'overview-panel' );

    if (!autoRefresh) {
        // The current page doesn't do auto-refresh, so turn it off.
        CP.UI.stopAutoRefresh(null);
    }

    //if not defined - set default tab
    if (!tab) {
        tab = CP.global.config;
    }

    // Remove old pane
    if (tab != CP.global.monitor) {
        this.pageObj = {};
        configPanel.removeAll(true);
    } 
    else {
        monitorPanel.removeAll(true);
    }
    overviewPanel.removeAll( true );
    
    //handle config pages
    if (tab == CP.global.config) {
        // Save the obj that we got
        this.pageObj.obj = obj;

        // Add submit related handlers
        if(obj.beforeSubmit && Ext.isFunction(obj.beforeSubmit)){
            this.pageObj.beforeSubmit = Ext.Function.bind( obj.beforeSubmit, this, [ obj.panel ]);
        }
        if(obj.afterSubmit && Ext.isFunction(obj.afterSubmit)){
            this.pageObj.afterSubmit = Ext.Function.bind( obj.afterSubmit, this, [ obj.panel ]);
        }
    }

    // Add the data panel
    if (tab == CP.global.overview) {
        // overview panel
        overviewPanel.add( obj.panel );
        overviewPanel.show();
    } 
    //config
    else if (tab == CP.global.config) {
        overviewPanel.hide();
        centerPanel.setConfigTabActive();
        configPanel.add(obj.panel);
    }
    // monitor tab
    else if (tab == CP.global.monitor) {
        /* since we don't want to check dirty page on a monitor tab,
           update pageObj only if there's no config Tab in the Page.
        */
        if (CP.global.configTab == false) {
            this.pageObj.obj = obj;
        }
        overviewPanel.hide();
		
        monitorPanel.add(obj.panel);
		// if no configuration tab than activate the monitoring tab
        if (!CP.global.configTab) {
            centerPanel.setMonitorTabActive();
        }
    }

    //related topics - when object was defined with a 'related' array containing the name of the pages from navtree
    //Example: related:[ 'Users' ]
    if( obj.related ){
        this.addRelatedTopics( obj );
    }
	
	var already_locked = false;
	obj.locked = false;
	obj.disabled_by_clustering = false;
	if(obj.cluster_feature_name) {
		if(CP.global.isClusterEnabled) {
			if(CP.global.isCluster) { //cadmin mode
				if(CP.global.LockClusterNonSharedFeatureInCAdminMode) {
					if(CP.global.isClusterFeatureShared[obj.cluster_feature_name] != undefined &&
						CP.global.isClusterFeatureShared[obj.cluster_feature_name] == false) {
						msg = "This feature is not configured as a cloning group synchronized feature " + 
							  "and therefore can only be controlled from single gateway's Web UI.";
						type = 'warning';
						this.setReadOnlyPageMode( obj, msg, type );
						already_locked = true;
						obj.disabled_by_clustering = true;
					}
				}
			} else { //normal mode
				if(CP.global.LockClusterSharedFeatureInAdminMode) {
					if(CP.global.isClusterFeatureShared[obj.cluster_feature_name] != undefined &&
						CP.global.isClusterFeatureShared[obj.cluster_feature_name] == true) {
						msg = "This feature is a cloning group synchronized feature. Configuration of this feature is only allowed from Cloning Group Web UI.";
						type = 'warning';
						this.setReadOnlyPageMode( obj, msg, type );
						already_locked = true;
						obj.disabled_by_clustering = true;
					}
				}
			}
		}
	}
	
	if(!already_locked) {
		//If in read-only mode, or user doesn't have the configuration lock - set page accordingly
		if( tab == CP.global.config && ( this.accessMode == 'ro' || CP.global.token < 1)){
			var msg = '';
			var type = 'info';
			if( this.accessMode == 'ro' ){
				msg = 'This page is currently in read-only mode.';
			}
			else if( CP.global.token < 1 ){
				msg = 'Configuration database is currently locked by another user. <a href="javascript:void(0);" onclick="CP.util.configLock_click();return false;">Click here to obtain lock</a>.';
				type = 'warning';
			}
			this.setReadOnlyPageMode( obj, msg, type );
		}
	}
    centerPanel.doLayout();
}


//If access rights for this page are read-only - display a message on the bottom
//and disable all editing elements such as buttons and text fields
,setReadOnlyPageMode: function( pageObj, msg, type ){
	if (!pageObj)
		return;
	if (msg != null){
	    var mainPagePanel = pageObj.panel;
		if(!mainPagePanel.getChildByElement(CP.UI.readOnlyMsgId)) {
	    //display message
	    var msg = new CP.WebUI4.inlineMsg({
	        id: CP.UI.readOnlyMsgId,
	        type: type,
	        text: msg
	    });
	    mainPagePanel.add( msg );
	    mainPagePanel.doLayout(); //refresh panel to show the new msg
	}
	}
    //disable Ext elements in page
    CP.UI.readOnlyElements4 = [];
    function disableByType4( type ){
        var formPanel = Ext.getCmp( pageObj.id );
        var arr = Ext.ComponentQuery.query( type, formPanel );  
        for( var i=0, el ; el=arr[i] ; i++ ){
            CP.UI.readOnlyElements4[ el.getId() ] = el.disabled;
            el.disable();
        }
    }
    for( var j=0, type ; type=CP.UI.formElementTypes4[j] ; j++ ){
        disableByType4( type );
    }
	
	pageObj.locked = true;
	if(pageObj.lock_event && Ext.typeOf(pageObj.lock_event) == "function") {
		pageObj.lock_event(true);
	}	
}


,enableReadOnlyPage: function(){
    var pageObj = CP.UI.getMyObj();
    if( !pageObj || (this && this.accessMode == "ro") || pageObj.disabled_by_clustering){
        return;
    }
    var mainPagePanel = pageObj.panel;
    if ( CP.global.token > 0 ) {
        var msgCmp = null;
        while ( msgCmp = Ext.getCmp( CP.UI.readOnlyMsgId ) ) { //loop until there are none left
            mainPagePanel.remove( msgCmp ); //remove msg
            if (msgCmp && msgCmp.destroy) { msgCmp.destroy(); }
        }
    }
    
    //enable elements
    function enableByType4( type ){
        var formPanel = Ext.getCmp( pageObj.id );
        var arr = Ext.ComponentQuery.query( type, formPanel );
        for( var i=0, el ; el=arr[i] ; i++ ){
            if( CP.UI.readOnlyElements4[ el.getId() ] == true ){
                continue;
            }
            el.enable();
        }
    }
    for( var j=0, type ; type=CP.UI.formElementTypes4[j] ; j++ ){
        enableByType4( type );
    }
    if (pageObj.checkCmpState && Ext.typeOf(pageObj.checkCmpState) == "function") {
        pageObj.checkCmpState();
    } else if (pageObj.afterSubmit && Ext.typeOf(pageObj.afterSubmit) == "function") {
        pageObj.afterSubmit();
    }
	
	pageObj.locked = false;
	if(pageObj.lock_event && Ext.typeOf(pageObj.lock_event) == "function") {
		pageObj.lock_event(false);
	}	
}


//Adds related topics to page
,addRelatedTopics: function( page ){
    var html = '';
    var tree = Ext.getCmp("cptree").getRootNode();
    var mainPagePanel = page.panel;
    var prev = false;
    for( var i=0, topic ; topic=page.related[i] ; i++ ){
        var treeNode = tree.findChild( 'url', topic.page, true );
        if( !treeNode ){
            prev = false;
            continue;
        }
        var sep = ( prev == true ) ? ',&nbsp;' : '';
        var text = ( topic.displayName ) ? topic.displayName : treeNode.raw.text;
        var cmd = "";
        if ( topic.tab ) {
            // link to a tab on same page
            var tab = topic.tab + "-tab";
            cmd = 'Ext.getCmp(\'tab-panel\').setActiveTab( \'' + tab +  '\' );';
        } else {
            // link to another page
            cmd = 'CP.util.gotoPage(\'' + topic.page + '\' );';
        }
        html += sep +'<a href="javascript:void(0);" onclick="' + cmd + 'return false;">'+ text +'</a>';
        prev = true;
    }
    if( html == '' ){
        return;
    }
    html = '<strong>Related Topics:</strong>&nbsp;'+ html;
    var msg = new CP.WebUI4.inlineMsg({
        type: 'related',
        text: html
    });
    mainPagePanel.add( msg );
    mainPagePanel.doLayout(); //refresh panel to show the new msg
}


,getMyObj:function(){
    return((this.pageObj && this.pageObj.obj) ? this.pageObj.obj : undefined);
}


/*
 * use apply button instead of submit button
 */
,applyHandler:function(page) {
    var myParams = {};

    // Call beforeSubmit, if implemented
    if(page.beforeSubmit) {
        CP.util.setCustomStatMsg("before Submit", 'true');
        if(page.beforeSubmit() == false)
            return;
    }

    // Apply parameters
    Ext.apply(myParams, page.params);
    
    // Add control parameters
    myParams.save = 1;
    myParams.apply = 1;
    
     //check if the form is valid before submitting
    if (!page.panel.getForm().isValid()) {
        CP.util.setCustomStatMsg("Current page has invalid fields. Submit cancelled", 'false');
        return;
    }
        
    // Submit
    page.panel.getForm().doAction("submit", {
        url:  page.submitURL
        ,method: "POST"
        ,params: myParams
        ,success:CP.UI.handleSubmit
        ,failure:CP.UI.handleSubmit
    });
}

,applyHandlerWithCallback:function(page, preAjax, successCallback, FailureCallback) {
    var myParams = {};

    // Call beforeSubmit, if implemented
    if(page.beforeSubmit) {
        CP.util.setCustomStatMsg("before Submit", 'true');
        if(page.beforeSubmit() == false)
            return;
    }

    // Apply parameters
    Ext.apply(myParams, page.params);
    
    // Add control parameters
    myParams.save = 1;
    myParams.apply = 1;
    
     //check if the form is valid before submitting
    if (!page.panel.getForm().isValid()) {
        CP.util.setCustomStatMsg("Current page has invalid fields. Submit cancelled", 'false');
        return;
    }
	preAjax();
    // Submit
    page.panel.getForm().doAction("submit", {
        url:  page.submitURL
        ,method: "POST"
        ,params: myParams
        ,success: function(form, action) {  successCallback(); CP.UI.handleSubmit(form, action);}
        ,failure: function(form, action) {  FailureCallback(); CP.UI.handleSubmit(form, action);}
    });
}

//send data to server using a ajax
,submitData: function( page ){
    // Call beforeSubmit, if implemented
    if( page.beforeSubmit ){
        if( page.beforeSubmit() == false )
            return;
    }
    
    // Add control parameters
    page.params[ 'save' ] = 1;
    page.params[ 'apply' ] = 1;
            
    // Submit
    Ext.Ajax.request({
        url: page.submitURL,
        method: 'POST',
        params: page.params,
        success: function( jsonResult ){
            var jsonData = Ext.decode( jsonResult.responseText );
            CP.UI.handleSubmit( null, jsonData );
        }
    });
}

,handleSubmit:function( form, action ){
    var notice = "";
    var m;
    var success;

    if (form) {
        if (action.result) {
            m = action.result.messages;
            success = action.result.success;
        } else {
            m = ["An unexpected error occurred while processing the request.  Check for errors under /var/log, including /var/log/httpd2_error_log"];
            success = "false";
        }
    } else {
        m = action.messages;
        success = action.success;
    }


    var statusBar = Ext.getCmp('status-msg');
	
    if (m) {
        for (var i = 0; i < m.length; i++) {
            notice = notice + m[i] + "\n";
        }
    }
	
    CP.util.setCustomStatMsg(notice, success );

    // call afterSubmit function to refresh page
    var as = CP.UI.getMyObj().afterSubmit;
    var submitFailure = CP.UI.getMyObj().submitFailure;
    if (as && (success == "true" || success == "half_true")) {
        as(m);
    } else {
        if (submitFailure)
            submitFailure();
    }

}
/*
,clockTicker:function(){
    function updateClock() {
            var d = new Date().format('D, d-M-Y, H:i');
            CP.util.setTime(d);
    }
    Ext.TaskMgr.start({
        run: updateClock
        ,interval: 6000
    });
}
*/



// Init all actions that occures after loading ( For the 1'st time !!! )
,isLoaded: false
,afterLoading: function(){
    if( CP.UI.isLoaded == true ){  // Not the first time - this function has already been called once
        return;
    }
    CP.UI.isLoaded = true; //call this function only once on first load
    
    // In case ftw was completed we should grey out the button on the Wizard tool bar
    //if (CP.UI.ftwCompleted == true) Ext.getCmp('ftw-link-from-wizards-menu-in-toppanel').disable();
    
    //Display custom tooltip for the configuration lock (defined in util.js)
    var confLockQtip = Ext.getCmp('config_lock_qtip');
    if( confLockQtip ){
        confLockQtip.show();
    }
    if (CP.global.loginCount <= 3){
	    // Notice that the next 2 functions are tightly related by their timing (determined by the next variables) 
	    var startDelay = 10000;			// time until the qtip is visible after page is up
	    var visibleDuration = 18000;	
	    var animationDuration = 3000;
	    
	    // Add tooltip for search hint and set it's animation
	    Ext.Function.defer( function(){
	    	// Create the 'ToolTip' element  
	        Ext.create( 'CP.WebUI4.ToolTip' ,{
	            target: 'tb_tools_search_combo_input',
	            id: 'mainframe_search_hint_qtip', 
	            anchor: 'top', //align the tooltip message to the center of button
	            defaultAlign: 'c',
	            title:  ' <img src="/images/toolbar/searching.png" width="11" height="11" align="center" />  Try me!',
	            closable: true, //display close x button 
	            closeAction: 'destroy', // close x button operation - destroys element
	            autoHide: true,
	            anchorOffset: -9, //align the anchor (little triangle on top) to the left of the tooltip
                width: (CP.util.isIE8()) ? 250 : 260,
                padding: (CP.util.isIE8()) ? 0 : 8,
	            dismissDelay: visibleDuration,	// time until qtip is removed 
	            html: 'Unable to find something? <br>You can easily find it using the new search tool.'
	        }).show(); // Show it now
	        
	        // Animate before hide
	        Ext.get( 'mainframe_search_hint_qtip' ).animate({
	            delay:  visibleDuration-animationDuration,	// time until the animation starts (from the qtip rendering)
	            duration: animationDuration,
	            opacity: 0.6,
	
	            keyframes: {
	                90: {  //from 0ms to 900ms (75%) - change opacity
	                    opacity: 0.6
	                },
	                100: {  //from 900ms to 1sec - higlight
	                    backgroundColor: '#c8d8ef'
	                }
	            }
	        });
	    }, startDelay ); // executes after 10 seconds
	    
	    // After rendering and animation destroy the qtip so it doesn't popup all the time
	    var timeOfDestruction = startDelay + visibleDuration + 300;
	    Ext.Function.defer( function(){
	        var searchQTip = Ext.getCmp('mainframe_search_hint_qtip');
	        if( searchQTip ){
	        	searchQTip.destroy();
	        }
	    }, timeOfDestruction ); 		
    }
}

//if configured - display message if user password is about to expire
,setPassExpirationMsgValues: function(){
    Ext.Ajax.request({
        url: '/cgi-bin/pass_expiration_warn.tcl',
        method: 'GET',
        scope: this,
        success: function( response ){
            var regEx = /\\r/gm; 
            var jsonData = Ext.decode( response.responseText.replace( regEx, '<br>' ));
            var jData = jsonData.data;
            if( jData.MsgStat == 'on' ){
				CP.global.showPassWarn = true
				CP.global.showPassMsg = jData.Msg	
            }
			else
			{
				CP.global.showPassWarn = false
				CP.global.showPassMsg = ""
			}
        }
    });
}

//if configured - display message of the day
,displayMsgOfTheDay: function(){
    Ext.Ajax.request({
        url: '/cgi-bin/ban-motd.tcl',
        method: 'GET',
        scope: this,
        success: function( response ){
            var regEx = /\\r/gm; 
            var jsonData = Ext.decode( response.responseText.replace( regEx, '<br>' ));
            var jData = jsonData.data;
            if( jData.motdStat == 'on' ){
                CP.WebUI4.Msg.show({
                    title: 'Message of the Day',
                    icon: 'webui-msg-info',
                    animEl: 'elId',
                    msg: jData.motdText,
                    buttons: Ext.Msg.OK
                });
            }
        }
    });
}

/*
 * Private variable
 * 
 * The TaskManager task that is called periodically to 
 * perform auto-refresh of the currently active ExtJS view
 */
,autoRefreshTask     : null


/* 
 * The owner of the current auto-refresh task.  Only
 * the owner (or a null owner) can stop the current
 * refresh task. This helps to avoid race conditions
 * if a new refresh task is set before the previous
 * refresh task is killed.
 */
,autoRefreshOwner    : null

/*
 * Public function
 * 
 * Sets up a repeating task to enable various
 * screens in the webui to auto-refresh at the 
 * standard rate.  This rate is configurable by the
 * user but cannot be less than 5 seconds.
 * 
 * Only 1 autorefresh callback is allowed at a time.  This
 * approach prevents degradation of the UI in case there
 * are views that forget to unhook from the autorefresh
 * callback when the view is closed.
 */
,startAutoRefresh:function(newRefreshCallback) {
    CP.UI.autoRefreshOwner = newRefreshCallback;

    if (CP.UI.autoRefreshTask) {
        Ext.TaskManager.stop(CP.UI.autoRefreshTask);
        CP.UI.autoRefreshTask = null;
    }

    if (newRefreshCallback) {
        CP.UI.autoRefreshTask = CP.UI.createAutoRefreshTask(newRefreshCallback);
        Ext.TaskManager.start(CP.UI.autoRefreshTask);
    } 
}

/*
 * Stops the auto-refresh for the given callback.  
 *
 * If the given callback is not the current refresh target, the
 * request is ignored.
 *
 * Pass null to this function to force auto-refresh to stop
 * regardless of the current refresh target.
 */
,stopAutoRefresh:function(currentRefreshCallback) {
    if (CP.UI.autoRefreshOwner) {
        if (!currentRefreshCallback || currentRefreshCallback == CP.UI.autoRefreshOwner) {
            CP.UI.startAutoRefresh(null);
        }
    }
}

/*
 * Private function
 *
 * Returns an object to be used as the task object to be passed
 * to the Ext.TaskManager.start() function
 */
,createAutoRefreshTask: function(autoRefreshCallback) {
    return {
        run: function() {
            autoRefreshCallback(true);
        },
        interval: CP.global.GridRefreshRate * 1000
    }
}

};
