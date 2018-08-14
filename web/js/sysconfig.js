//searchKeys: edition 32bit 32-bit 64bit 64-bit

CP.SysConfig = {
    SAVE_BTN_ID: 'ipv6-save-btn',
    WARNING_MSG_ID: 'ipv6_warning_msg',
    MAIN_PANEL_ID: 'main-page-panel',
    doReboot: false,
   
    init: function(){
        var applyButton = Ext.create( 'CP.WebUI4.Button',{
            id: CP.SysConfig.SAVE_BTN_ID,
            text: 'Apply',
			margin: '15 0 0 0',
            disabled: true,
            handler: CP.SysConfig.verifyReboot
        });
    
        var mainPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
            id: CP.SysConfig.MAIN_PANEL_ID,
            buttonAlign: 'left',
            items: [{
                xtype: 'cp4_sectiontitle',
                titleText: 'IPv6 Support'
            },{
                xtype: 'cp4_radio',
                boxLabel: 'On',
                name: 'ipv6',
                id: 'ipv6_on',
                inputValue: 't',
                hideLabel: true,
                listeners: {
                    change: CP.SysConfig.enableApplyButton
                }
            },{
                xtype: 'cp4_radio',
                boxLabel: 'Off',
                name: 'ipv6',
                id: 'ipv6_off',
                inputValue: 'f',
                hideLabel: true,
                listeners: {
                    change: CP.SysConfig.enableApplyButton
                }
            },{
				xtype: 'cp4_sectiontitle',
                titleText: 'Edition'
            },{
                xtype: 'cp4_radio',
                boxLabel: '32-bit',
                name: 'edition',
                id: 'edition_32',
                inputValue: '32-bit',
                hideLabel: true,
                listeners: {
                    change: CP.SysConfig.enableApplyButton
                }
            },{
                xtype: 'cp4_radio',
                boxLabel: '64-bit',
                name: 'edition',
                id: 'edition_64',
                inputValue: '64-bit',
                hideLabel: true,
                listeners: {
                    change: CP.SysConfig.enableApplyButton
                }
            },{
                xtype: 'cp4_inlinemsg',
                id: CP.SysConfig.WARNING_MSG_ID,
                type: 'warning',
                text: 'This action will require a reboot.',
                hidden: true	
            },
			//	The three components below are hidden untill they will be implemented
			{
                xtype: 'cp4_sectiontitle',
                titleText: 'VSX Support',
                cls: 'webui-section-title webui-section-title-inner-margin',
				hidden: true	// hidden untill implementation
            },{
                xtype: 'cp4_radio',
                boxLabel: 'On',
                name: 'vsx',
                inputValue: 't',
                hideLabel: true,
                disabled: true,
				hidden: true	// hidden untill implementation
            },{
                xtype: 'cp4_radio',
                boxLabel: 'Off',
                name: 'vsx',
                inputValue: 'f',
                hideLabel: true,
                disabled: true,
				hidden: true	// hidden untill implementation
            },
                applyButton 
            ],
            listeners: {
                render: CP.SysConfig.doLoad
            }
        });
        
        var page = {
            title: 'System Configuration',
            panel: mainPanel
        };
	
        CP.UI.updateDataPanel( page );
    },
    
    
    clearMsg: function(){
        Ext.getCmp( CP.SysConfig.WARNING_MSG_ID ).setVisible( false );
        Ext.getCmp( CP.SysConfig.SAVE_BTN_ID ).disable();
    },
    
    
    enableApplyButton: function( radioField, isChecked ){
        var button = Ext.getCmp( CP.SysConfig.SAVE_BTN_ID );
        var msg = Ext.getCmp( CP.SysConfig.WARNING_MSG_ID );
	
		var radioOn = Ext.getCmp( 'ipv6_on' );
		var edition_radio_32 = Ext.getCmp( 'edition_32' );
		
        if( (radioOn.getValue() != radioOn.originalValue) || (edition_radio_32.getValue() != edition_radio_32.originalValue)){
            msg.setVisible( true );
            button.enable();
        }
        else{
            msg.setVisible( false );
            button.disable();
        }
    },
    
    
    doLoad: function( formPanel ){
        Ext.Ajax.request({
            url: '/cgi-bin/ipv6.tcl',
            method: 'GET',
            success: function( jsonResult ){
                var jsonData = Ext.decode( jsonResult.responseText );
                var data = jsonData.data;

				var radioOn = Ext.getCmp( 'ipv6_on' );
				var radioOff = Ext.getCmp( 'ipv6_off' );
				
                if( data.ipv6 == 't' ){
                    radioOn.setValue( true );
                    radioOff.setValue( false );
                }
                else{
                    radioOn.setValue( false );
                    radioOff.setValue( true );
                }
				CP.SysConfig.clearMsg();
				CP.SysConfig.saveOriginValue();
            }
        });
		Ext.Ajax.request({
            url: '/cgi-bin/edition.tcl',
            method: 'GET',
            success: function( jsonResult ){
                var jsonData = Ext.decode( jsonResult.responseText );
                var data = jsonData.data;
          
				var edition_radio_32 = Ext.getCmp( 'edition_32' );
				var edition_radio_64 = Ext.getCmp( 'edition_64' );
				
				var support = data.supported;
				
				var support32 = false;
				var support64 = false;
				
				if (support.indexOf('32-bit') >= 0){
					support32 = true;
				}
				if (support.indexOf('64-bit') >= 0){
					support64 = true;
				}
				
				if( data.edition == '32-bit' &&  support32){
                    edition_radio_32.setValue( true );
                    edition_radio_64.setValue( false );
                }
                else if( data.edition == '64-bit' && support64){
                    edition_radio_32.setValue( false );
                    edition_radio_64.setValue( true );
                }
				if(support32 == false){
					edition_radio_32.setDisabled(true);
				}
				if(support64 == false){
					edition_radio_64.setDisabled(true);
				}
				CP.SysConfig.clearMsg();
				CP.SysConfig.saveOriginValue();
            }
        });
    },
	
	saveOriginValue: function(){
		//setValue activate the check event, since this action occur after loading the data - reset flag and message
		var radioOn = Ext.getCmp( 'ipv6_on' );
		var radioOff = Ext.getCmp( 'ipv6_off' );
		var edition_radio_32 = Ext.getCmp( 'edition_32' );
		var edition_radio_64 = Ext.getCmp( 'edition_64' );
		
		radioOn.originalValue = radioOn.getValue();
        radioOff.originalValue = radioOff.getValue();
		edition_radio_32.originalValue = edition_radio_32.getValue();
        edition_radio_64.originalValue = edition_radio_64.getValue();
	},
   
    verifyReboot: function( button, event ){
	
		var radioOn = Ext.getCmp( 'ipv6_on' );
		var edition_radio_32 = Ext.getCmp( 'edition_32' );
		var editionMsg = "";
		var ipv6Msg = "";
		
		if(radioOn.getValue() != radioOn.originalValue){
			ipv6Msg = "to IPv6 state";
		}
		if(edition_radio_32.getValue() != edition_radio_32.originalValue){
			if(ipv6Msg != ""){
				editionMsg += " and";
			}
			editionMsg += " Edition";
		}
		
        CP.WebUI4.Msg.show({ 
            title: 'Reboot the System',
            msg: "Change "+ ipv6Msg + editionMsg +" will take effect in the next reboot. Do you want to reboot the machine now?",
            icon: 'webui-msg-warning',
            buttons: Ext.Msg.YESNO,
            fn: function( button, text, opt ){
                if( button == "yes" ){
                    CP.SysConfig.doReboot = true;
                }
                else{
                    CP.SysConfig.doReboot = false;
                }
                CP.SysConfig.clearMsg();
				CP.SysConfig.saveHandler();
            }
        });
    },
    
    
    saveHandler: function(){

		var radioOn = Ext.getCmp( 'ipv6_on' );
		var edition_radio_32 = Ext.getCmp( 'edition_32' );
		
		if(radioOn.getValue() != radioOn.originalValue){
			//get params to be posted to server
			CP.SysConfig.setChangedParams();
			var page = CP.UI.getMyObj();
			page.submitURL = '/cgi-bin/ipv6.tcl';
			if(page.afterSubmit == null){
				page.afterSubmit = CP.SysConfig.afterSubmit;
			}

                        if(page.submitFailure == null){
                                page.submitFailure = CP.SysConfig.submitFailure;
                        }

			//submit form
			CP.UI.applyHandler(page);
        }
		
		if(edition_radio_32.getValue() != edition_radio_32.originalValue){
			
			CP.SysConfig.setChangedParams();
			var page = CP.UI.getMyObj();
			page.submitURL = '/cgi-bin/edition.tcl';
			if(page.afterSubmit == null){
				page.afterSubmit = CP.SysConfig.afterSubmit;
			}

                        if(page.submitFailure == null){
                                page.submitFailure = CP.SysConfig.submitFailure;
                        }

			//submit form
			CP.UI.applyHandler(page);
        }
		CP.SysConfig.saveOriginValue();
    },
	
	
	//Collect the list of bindings for db set_list -
    //update params array to be sent with the request to server
    setChangedParams: function(){
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
    },
    
   
    afterSubmit: function( form, action ){
        CP.util.clearFormDirtyFlag( CP.SysConfig.MAIN_PANEL_ID ); //clear isDirty flag
		if( CP.SysConfig.doReboot == true ){
            CP.SysConfig.sendRebootRequest();
        }
    },
    
    submitFailure: function( form, action ){
        // Reload so that the UI reflects the current config for the case
        // where the request did not succeed (e.g. attempt to turn of
        // 64 bit support while ipv6 config still exists).
        CP.SysConfig.doLoad();
    },

    sendRebootRequest: function(){
        var myparams = {};
        myparams[ 'reboot' ] = '';
        Ext.Ajax.request({
            url: '/cgi-bin/ipv6.tcl',
            method: 'POST',
            params: myparams,
            success: function(){
				CP.util.rebootingWindow('Rebooting System',
									    'Please wait while system is rebooting.',
									    30000);
			
            }
        });
    }
	

} //end of CP.SysConfig
