CP.Shutdown = {

init: function() {
    var shutdownPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"shutdown-panel"
        ,items: [{
        	xtype: "cp4_sectiontitle"
			,titleText: "Shut Down"
			},{
			xtype: "cp4_btnsbar"
			,items: [{
				xtype: "cp4_button"
				,text: "Halt"
				,handler: Ext.Function.bind(CP.Shutdown.verifyCommand, this, ["halt"]) //CP.Shutdown.verifyCommand.createCallback("halt")
				},{
				xtype: "cp4_button"
				,text: "Reboot"
				,handler: Ext.Function.bind(CP.Shutdown.verifyCommand, this, ["reboot"])//CP.Shutdown.verifyCommand.createCallback("reboot")
			    }]
			}]
    });

    var page = {
    		title:"System Shut Down"
    		,panel: shutdownPanel
    		,submit: false
    		,discard: false
    };

    CP.UI.updateDataPanel(page);
},

verifyCommand: function(command) 
{
	var message;
	var title;
	Ext.Ajax.request({
		url: '/cgi-bin/shutdown.tcl',
		method: 'GET',
		success: function( jsonResult ){		
			var jsonData = Ext.decode( jsonResult.responseText );
            		var BackuprestoreInProcess = jsonData.data.inProcess;
			if (command == "reboot") {							
				if ( BackuprestoreInProcess == 1 ) {	// lock exists
					title = 'Backup Operation In Progress';				
					message = 'Backup operation is currently in process and should not be interrupted.<br>Would you like to perform reboot anyway?';
				}
				else {
					title = 'Reboot the System?';	
					message = 'If you proceed with this process, your system will temporarily go down.<br>Click OK to reboot, Cancel to abort.';
				}
			}				
			
			if (command == "halt") {				
				if ( BackuprestoreInProcess == 1 ) {	// lock exists
					title = 'Backup Operation In Progress';		
					message = 'Backup operation is currently in process and should not be interrupted.<br>Would you like to halt the machine anyway?';
				}
				else {
					title = 'Halt the System?';
					message = 'If you proceed with this process, your system will go down.<br>Click OK to halt, Cancel to abort.';
				}
				
			}
			if( BackuprestoreInProcess == 1 ) {
				CP.WebUI4.Msg.show({ //display message
							title: title
							,msg: message
							,animEl: 'elId'
							,icon: 'webui-msg-warning'
							,buttons: Ext.Msg.YESNO
							,fn: function( button, text, opt ){
								if( button == "yes" )
									CP.Shutdown.sendRequest(command);
							}
					});
			} else {
				CP.WebUI4.Msg.show({ //display message
							title: title
							,msg: message
							,animEl: 'elId'
							,icon: 'webui-msg-warning'
							,buttons: Ext.Msg.OKCANCEL
							,fn: function( button, text, opt ){
								if( button == "ok" )
									CP.Shutdown.sendRequest(command);
							}
					});
			}
			
			
		}
		
	});
},

sendRequest:function(command){
	var myparams = {};
	myparams[command] = "";	
	
	Ext.Ajax.request({
		url: "/cgi-bin/shutdown.tcl"
		,method: "POST"
		,params: myparams
		,success: Ext.Function.bind(CP.Shutdown.postSuccess, this, [command]) //CP.Shutdown.postSuccess.createCallback(command)
	});

},

postSuccess:function(command) {
	
	if (command == 'reboot')
		CP.util.rebootingWindow('Rebooting System',
							    'Please wait while system is rebooting.',
								30000);
	
	if (command == 'halt')
		CP.util.redirectToLogin();
}

}
