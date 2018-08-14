/*
 * @@ ~~~ status bar of application ~~~
 * has massge section + icon, more details button to display the entire log, 
 * and submit and discard buttons that probably will remove in the future
 */
CP.WebUI4.StatusBar = Ext.create( 'CP.WebUI4.Container',{
    cls: 'webui-statusbar',
    layout: 'hbox',
    region: 'south',
    id: 'status-bar',
    height: 30,
    logConsoleMsg: '',
    messageBarWidth: 740,
    
    items: [{
        //Left column - status messages
        xtype: 'cp4_panel',
        cls: 'webui-status-left', 
        id: 'statusbar_message_panel',
        items: [{
            xtype: 'cp4_toolbar',
            id: 'statusbar_message_div',
            cls: 'stat-msg',
            layout: 'hbox',
            items: [{
                //icon+text
                xtype: 'cp4_displayfield',
                id: 'status-msg',
                style: 'background-position:14px center;',
                statusType: 'ok',
                padding: '8 0 0 36',
                flex: 1,
                height: 30,
                getClsByStatusType: function(){ 
						return (this.statusType =='ok') ? 'webui-statusbar-msg-txt-ok' : 'webui-statusbar-msg-txt-err'; 
						},
                setStatusType: function( type ){ this.statusType = type; }
            },{
                //button
                xtype: 'cp4_button',
                id: 'webui-statusbar-logs-btn',
                cls: 'open-logs-btn',        
                scale: 'small',
                margin: '2 0 2 0',
                width: 18,
                maxWidth: 18,
                height: 21
            }]
        }]
    },{
        //Right column - empty space
        xtype: 'cp4_panel',
        flex: 1
    }],
    
    
    listeners:{
        render: function(){
            Ext.getCmp( 'statusbar_message_panel' ).setWidth( this.messageBarWidth );
            Ext.getCmp( 'webui-statusbar-logs-btn' ).setHandler( this.logConsoleHandler );
        }
    }


   ,logConsoleHandler: function(){
        var logsBtn = Ext.getCmp( 'webui-statusbar-logs-btn' );
        var logConsoleWin = Ext.getCmp( 'log_console_win' );
        if( logConsoleWin ){ //console was created already - toggle between open/close states
		if( logConsoleWin.isVisible() ){
                logConsoleWin.hide();
				logsBtn.removeCls('close-logs-btn');
                logsBtn.addCls('open-logs-btn');            
			}
            else{
                logConsoleWin.show();
				logsBtn.removeCls('open-logs-btn');
                logsBtn.addCls('close-logs-btn');
            }
            return;
        }
       
        var logWin = Ext.create( 'CP.WebUI4.ModalWin',{
            id: 'log_console_win',
            title: 'Status bar history',
            cls: 'webui-status-console',
            animateTarget: 'statusbar_message_div',
            draggable: false,
            closable: false,
            shadow: false,
            modal: false,
            bodyBorder: false,
            border: 0,
            width: CP.WebUI4.StatusBar.messageBarWidth,
            height: 390,
            listeners: {
                afterrender: function( win ){
                    win.alignTo( Ext.get( 'statusbar_message_div' ), 'bl-tl', [0, 2]);
                }
            }
        }).show();        
		logsBtn.removeCls('open-logs-btn');
		logsBtn.addCls('close-logs-btn');
        logWin.update( CP.WebUI4.StatusBar.logConsoleMsg );
    }
	
	
    ,setStatusMessage: function( msg, mode ){
        CP.util.sendGetRequest( '/cgi-bin/time.tcl', this.updateLogMsg, {msg:msg, mode:mode} );
    }
    
    ,updateLogMsg: function( response, options ){
        //analize data	
        var msg = options.params.msg;
        var final_msg = Ext.String.trim(msg).replace(/\r?\n/g, '<br />');
        var mode = options.params.mode;
        var jsonData = Ext.decode( response.responseText );
        var jData = jsonData.data;
        var isSuccess = ( jsonData.success == 'false' || mode == 'false' || mode == 'half_true') ? false : true ;
        var currDate = CP.util.displayDate(jData.clock_date);
        var currTime =  CP.util.displayTime(jData.clock_time);
        //set message
        var updateMsg = currDate +'&nbsp;'+ currTime +' :: '+ final_msg;
        var msgMaxLength = 150;
        var shortMsg = ( updateMsg.length > msgMaxLength ) ? updateMsg.substring( 0, msgMaxLength ) +'...' : updateMsg;
        
        //update bar
        var sbox = Ext.getCmp('status-msg');
        var msgClass = ( isSuccess == false ) ? 'webui-statusbar-msg-txt-err' : sbox.getClsByStatusType();
        sbox.setValue( shortMsg );
		
		if(CP.global.isCluster) {
			sbox.removeCls( 'webui-statusbar-msg-txt-cluster-half-ok' );
			if(mode == "half_true") {
				msgClass = 'webui-statusbar-msg-txt-cluster-half-ok';
			}
		}
		
        sbox.removeCls( 'webui-statusbar-msg-txt-err' );
        sbox.removeCls( 'webui-statusbar-msg-txt-ok' );
        sbox.addCls( msgClass );
        
        //update log messages window
        var sb = CP.WebUI4.StatusBar;
        sb.logConsoleMsg = '<div class="'+ msgClass +'">'+ updateMsg +'</div>'+ sb.logConsoleMsg;
    	var logWin = Ext.getCmp( 'log_console_win' );
    	if( logWin ){
    	    logWin.update( sb.logConsoleMsg );
    	}
    
    	//popup message on error
    	if( isSuccess == false && !CP.global.isCluster){
    	    CP.WebUI4.Msg.show({
                title: 'Error',
                msg: final_msg,
                buttons: Ext.Msg.OK,
                icon: 'webui-msg-error'
            });
    	}
    }

});
