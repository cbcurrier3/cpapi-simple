
CP.Upgrade = {
		
upgradePage:{
	title:"Upgrade"
	,submitURL:"/cgi-bin/upgrade.tcl"
	,params:{}
	,panel:null
},
UploadPath: "",
Is_mds: "false",
init:function() {
	if ( !Ext.getCmp('upgrade-panel') ) {
		//create upgrade page if doesnt exist
		
		CP.Upgrade.upgradePage.panel = CP.Upgrade.createPage();
	}
	
	Ext.Ajax.request({
		url: "/cgi-bin/upgrade.tcl",
		method: "GET",
		params: {
			action: 'get_upload_path'
		},
		success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			
			if (jsonData.data.is_mds)
				CP.Upgrade.Is_mds = jsonData.data.is_mds;
			if (jsonData.data.upload_path)
				CP.Upgrade.UploadPath = jsonData.data.upload_path;
			if (CP.Upgrade.UploadPath.charAt(CP.Upgrade.UploadPath.length-1) != '/' )
				CP.Upgrade.UploadPath += "/";
		}
	});
	CP.Upgrade.upgradePage.afterSubmit = CP.Upgrade.afterSubmit;
	//show the page
	CP.UI.updateDataPanel( CP.Upgrade.upgradePage );
},

createPage: function(){
	 //Section title for table
	var tableTitle = Ext.create('CP.WebUI4.SectionTitle', {
    	titleText: 'Upgrade Packages'
	});
	
    //Buttons toolbar for table
	var buttonsBar = Ext.create('CP.WebUI4.BtnsBar',{
		items: [{
			id: 'upgrade-upload',
			text: 'Upload',
			handler: function(){
				var winObj = CP.Upgrade.getUpgradeModalWindow();
				if( !winObj ){
					return;
				}
				winObj.show();
			}
        },{
			id: 'upgrade-start-upgrade',
			text: 'Upgrade',
			disabled: true,
			handler: function(){
				var gridSM = Ext.getCmp( 'upgrade-grid' ).getSelectionModel();
	            var s = gridSM.getLastSelected();
	            
	            if (!s)
	            	return;
	            gridSM.clearSelections();
	            
	            Ext.getBody().mask("Please wait a few moments while the upgrade package is extracted...");
	            var verName = s.get('version');
	            Ext.Ajax.request({
					url: "/cgi-bin/upgrade.tcl",
					method: "POST",
					timeout: 7200000, //120 minutes for the extraction
					params: {
						action: 'extract',
						version: verName
					},
					success: function(jsonResult) {
						Ext.getBody().unmask();
						CP.Upgrade.openUpgradeModalWin(verName, null, null);
					},
					failure: function(jsonResult) {
						Ext.getBody().unmask();
					}
				});
			}
        },{
			id: 'upgrade-delete',
			text: 'Delete',
			disabled: true,
			handler: function(){
				CP.WebUI4.Msg.show({
			        title:'Delete Upgrade Package',
			        msg: 'Are you sure you want to delete the selected package?',
			        buttons: Ext.Msg.OKCANCEL,
			        icon: Ext.Msg.QUESTION,
			        fn: function(btn, text){
			            var gridSM = Ext.getCmp( 'upgrade-grid' ).getSelectionModel();
			            var s = gridSM.getLastSelected();
			            gridSM.clearSelections();

			            if (btn == "cancel" || !s)
			                return;
			            CP.Upgrade.applyHandler({
							action: 'delete',
							version: s.get('version')
						});
			            /*Ext.Ajax.request({
							url: "/cgi-bin/upgrade.tcl",
							method: "POST",
							params: {
								action: 'delete',
								version: s.get('version')
							},
							success: function(jsonResult) {
								
							}
						});*/
			        }
			    });
			}
        },{
			id: 'btn-upgrade-monitor',
			text: 'Monitor',
			hidden: true,
			listeners: {
				added: function(btn){
					Ext.Ajax.request({
						url: "/cgi-bin/upgrade.tcl",
						method: "GET",
						params: {
							action: 'is_upgrade_running'
						},
						success: function(jsonResult) {
							var jsonData = Ext.decode( jsonResult.responseText );
							
							if (jsonData.data.running == "true")
								btn.setVisible(true);
							else
								btn.setVisible(false);
						}
					});
				}
			},
			handler: function(){
				CP.Upgrade.openUpgadeMonitorWin();
			}
        }]
	});
	
	//Grid panel
	var upgradeGridPanel = Ext.create('CP.WebUI4.Panel', {
        id: "upgrade-grid-container",
        border: false
    });
	//Add grid to the padel
    CP.Upgrade.addTable( upgradeGridPanel );
    
	//Note panel
	var upgradeNotePanel = Ext.create('CP.WebUI4.inlineMsg', {
		id : 'upgrade-note-msg',
		type: 'info',
		text: 'Use this option to upgrade to major releases only. For a list of major releases please refer to the  <a href="http://downloads.checkpoint.com/dc/download.htm?ID=18761" target="_blank">upgrade map</a>.'

    });
	
	//Upgrade panel
	var upgradePanel = Ext.create('CP.WebUI4.FormPanel', {
		id: 'upgrade-wrapper-panel',
		cls: 'webui-main-panel',
		border: false,
		listeners: {
			removed: function(){
				CP.global.isUpgrading = false;
			}
		},
		items: [ tableTitle, 
		         buttonsBar,
		         upgradeGridPanel,
				 upgradeNotePanel]
	});

	return upgradePanel;
}

,openUpgradeModalWin: function(verName, modalWin, modalForm){
	var descPanel = Ext.create( 'CP.WebUI4.Panel',{
		id: 'upgr_mw_desc'
		, bodyStyle: 'background-color:white !important'
		, hidden: true
		, bodyBorder: true
		, width: 490
		, height: 210
		, autoScroll: true
		, html: ""
	});
	var mwItems = [{
		xtype: 'cp4_panel'
		, id: 'upgr_mw_header'
		, bodyStyle: 'padding-top: 5px; padding-bottom: 10px;'
		, html: "You are about to perform an upgrade"
	},
	descPanel,
	{
		xtype: 'cp4_panel'
		, id: 'upgr_mw_btm'
		, bodyStyle: 'padding-top: 10px'
		, html: "Press OK to continue"
	}];
	
	if (modalForm){
		modalForm.setVisible(false);
		modalForm.removeAll();
		modalForm.add(mwItems);
	}
	else {
		modalForm = Ext.create( 'CP.WebUI4.FormPanel',{
			id: 'upgrade_modal_panel',
			bodyPadding: 10,
	        items: mwItems,
			buttons: [{
				xtype: 'cp4_button',
	            id: 'upgr_ok_btn',
	            text: 'OK',
	            version: verName,
	            handler: function(){
	            	CP.Upgrade.reconfigurePanel(modalForm, verName);
	            	this.setDisabled(true);
	            	
	            	var mwBtn = Ext.getCmp('upgrade-mw-btn2');
					mwBtn.setVisible(false);
	            }
	        },{
	            text: 'Cancel',
	            xtype: 'cp4_button',
	            id: 'upgrade-mw-btn2',
	            handler: function(){
	            	CP.Upgrade.afterSubmit();
	                Ext.getCmp( 'upgrade_window' ).close();
	            }
	        }]
		});
	}
	
	if (!modalWin){
		modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
	        id: 'upgrade_window',
	        name: 'upgrade_window',
	        width: 520,
	        height: 360,
	        title: 'Upgrade',
	        items: [ modalForm ]
	    });
	}
	
	Ext.Ajax.request({
		url: "/cgi-bin/upgrade.tcl",
		method: "GET",
		timeout: 7200000, //120 minutes
		params: {
			action: 'package_info'
		},
		success: function(jsonResult) {
			//var jsonData = Ext.decode( jsonResult.responseText );
			if (jsonResult.responseText){
				descPanel.setVisible(true);
				descPanel.update(Ext.htmlDecode(jsonResult.responseText));
			}
			modalForm.setVisible(true);
			modalWin.show();
			//debugger
		}
	});

}

,openUpgadeMonitorWin: function(){
	var modalMonForm = Ext.create( 'CP.WebUI4.FormPanel',{
		id: 'upgrade_modal_panel',
		bodyPadding: 10,
		items: [],
		buttons: [{
			xtype: 'cp4_button',
            id: 'upgr_ok_btn',
            text: 'OK',
            disabled: true
        }]
	});

	var modalMonWin = Ext.create( 'CP.WebUI4.ModalWin',{
        id: 'upgrade_window',
        name: 'upgrade_window',
        width: 520,
        height: 360,
        title: 'Upgrade',
        items: [ modalMonForm ]
    });
	
	CP.Upgrade.reconfigurePanel(modalMonForm, null);
	modalMonWin.show();
}

,addTable: function(obj) {
	var store = Ext.create( 'CP.WebUI4.Store',{  //new Ext.data.JsonStore({
		fields: [
			{name: 'name'}
			,{name: 'version'}
			,{name: 'size'}
		],
	    proxy: {
	        type: 'ajax',
	        url : '/cgi-bin/upgrade.tcl',
	        reader: {
	            type: 'json',
	            root: 'data.packages'
	        }
	    }
	});


	var cm = [
	  		{header:'Package Name',	dataIndex:'name',		id:'up-c-name',		editable:false, flex: 1}
	  		,{header:'Version',		dataIndex:'version',	id:'up-c-version',	editable:false, flex: 1}
	  		,{header:'Size',		dataIndex:'size',		id:'up-c-size',		editable:false, flex: 1}
	  	];
	

	//Grid
	var gridP = Ext.create('CP.WebUI4.GridPanel', {		
		id: "upgrade-grid"
		,height: 340
		,store: store
		,columns: cm
		
		,listeners: {
            // select row on mouse click
        	selectionchange: function( gridView, selections ){
        		var upgrBtn = Ext.getCmp( 'upgrade-delete' );
                var deleteBtn = Ext.getCmp( 'upgrade-start-upgrade' );
                
                if (!upgrBtn || !deleteBtn)
                	return;
                
        		if (selections.length == 0){ // if no item has been selected
        			deleteBtn.disable();
        			upgrBtn.disable();
        		}
        		else {
        			deleteBtn.enable();
        			upgrBtn.enable();
        		}
            }
        }
		
	});
	
	obj.add(gridP);
},


getUpgradeModalWindow: function(){
	var modalWin = Ext.getCmp('upgrade_upload_window');
    //Create modal window only if does not exist
	if( !modalWin ){
		var upgradeMWForm = Ext.create('CP.WebUI4.FileUploadPanel', {
			id: 'upgrade_upload_mw_form',
			bodyPadding: 20,
			uploadPath: CP.Upgrade.UploadPath,
			tmpPath: '/var/log/upload',
			uploadLabel: 'Select upgrade package to upload:',
			onUploadFinished: function(){
				Ext.getBody().mask("Please wait a few moments while the package is registered...");
				Ext.Ajax.request({
					url: "/cgi-bin/upgrade.tcl",
					method: "GET",
					scope: this,
					timeout: 7200000, //120 minutes
					params: {
						action: 'get_version',
						file_name: this.originalFileName,
						file_path: CP.Upgrade.UploadPath
					},
					success: function(jsonResult) {
						Ext.getBody().unmask();
						var jsonData = Ext.decode( jsonResult.responseText );
						if (jsonData.success == "true"){
							var ver  = jsonData.data.version;
							
							CP.Upgrade.applyHandler({
								action: 'add',
								version: ver, 
								name: this.originalFileName, 
								size: this.fileSize,
								path: CP.Upgrade.UploadPath
							});
							var mwBtn = Ext.getCmp('upgrade-mw-btn');
							mwBtn.setDisabled(false);
							mwBtn.setText("Done");
							mwBtn = Ext.getCmp('upgr_ok_btn');
							mwBtn.setVisible(true);
							mwBtn.version = ver;
						}
						else{
							CP.WebUI4.Msg.show({
								title:'Upload Error',
								msg: 'Invalid upgrade package.<br/>Use this option to upgrade to major releases only.<br/> For a list of major releases please refer to the <a href="http://downloads.checkpoint.com/dc/download.htm?ID=18761" target="_blank">upgrade map</a>.',
								buttons: Ext.Msg.OK,
								icon: 'webui-msg-error'
							});
							Ext.getCmp( 'upgrade_upload_window' ).close();
						}
					},
					failure: function(jsonResult) {
						Ext.getBody().unmask();
						CP.WebUI4.Msg.show({
	    					title:'Upload Error',
							msg: 'Invalid upgrade package.<br/>Use this option to upgrade to major releases only.<br/> For a list of major releases please refer to the <a href="http://downloads.checkpoint.com/dc/download.htm?ID=18761" target="_blank">upgrade map</a>.',
	    					buttons: Ext.Msg.OK,
	    					icon: 'webui-msg-error'
	    				});
						Ext.getCmp( 'upgrade_upload_window' ).close();
					}
				});
			}, onUploadStarted: function(){
				Ext.getCmp('upgrade-mw-btn').setDisabled(true);
			},
			//Save and cancel buttons
			buttons: [{
				xtype: 'cp4_button',
				id: 'upgr_ok_btn',
				hidden: true,
				text: 'Upgrade',
				version: "",
				handler: function(){
					this.setHandler(function(){
						CP.Upgrade.reconfigurePanel(upgradeMWForm, verName);
						this.setDisabled(true);
					});
					this.setText("OK");
					this.setDisabled(true);
					
					var mwBtn = Ext.getCmp('upgrade-mw-btn');
					mwBtn.setVisible(false);
					
					Ext.getBody().mask("Please wait a few moments while the upgrade package is extracted...");
		            var verName = this.version;
		            Ext.Ajax.request({
						url: "/cgi-bin/upgrade.tcl",
						method: "POST",
						scope: this,
						timeout: 7200000, //60 minutes for the extraction
						params: {
							action: 'extract',
							version: verName
						},
						success: function(jsonResult) {
							Ext.getBody().unmask();
							this.setDisabled(false);
							mwBtn.setDisabled(false);
							CP.Upgrade.openUpgradeModalWin(verName, null, null);
							Ext.getCmp('upgrade_upload_window').close();
						},
						failure: function(jsonResult) {
							Ext.getBody().unmask();
							this.setDisabled(false);
							mwBtn.setDisabled(false);
						}
					});
				}
			},{
				xtype: 'cp4_button',
				id: 'upgrade-mw-btn',
				text: 'Cancel',
				handler: function(){
					Ext.getCmp( 'upgrade_upload_window' ).close();
				}
			}]
		});
		//Modal window for add, edit
		modalWin = Ext.create('CP.WebUI4.ModalWin', {
			id: 'upgrade_upload_window',
			name: 'upgrade_upload_window',
			width: 420,
			height: 220,
			title: 'Upgrade',
			items: [ upgradeMWForm ]
		});
	}
	return modalWin;
},

termBeforeCloseHandler: function(){
	CP.global.isUpgrading = false;
	Ext.Ajax.request({
		url: "/cgi-bin/upgrade.tcl",
		method: "GET",
		params: {
			action: 'upgrade_status'
		},
		success: function(jsonResult) {
			var jsonData = Ext.decode( jsonResult.responseText );
			var componentsStatus;
			var i = 0;
			componentsStatus = [];
			CP.Upgrade.afterSubmit();
			if (jsonData.data.components.length == 0)
				return;
			if (jsonData.data.status == "success"){
				/*componentsStatus[i++] = {
						xtype: 'cp4_panel'
						, bodyStyle: 'padding-top: 5px; padding-bottom: 10px;'
						, html: "The upgrade completed successfully, system reboot is required. <br><br>Press 'Reboot' to reboot now or 'Done' to reboot later"
				};*/
				Ext.Ajax.request({
            		url: "/cgi-bin/shutdown.tcl"
            		,method: "POST"
            		,params: { reboot:"" }
            		,success: function(){
            			CP.util.rebootingWindow('Rebooting System',
							    'Please wait while system is rebooting.',
								30000);
            		}
            	});
			}
			else if (jsonData.data.status == "partial"){
				componentsStatus[i++] = {
					xtype: 'cp4_panel'
					, bodyStyle: 'padding-top: 5px; padding-bottom: 5px;'
					, html: "The upgrade has encoutered several errors."
				};
				componentsStatus[i++] = {
			    	xtype: 'cp4_container',
			    	id: 'download_link',
					html: '</br>Download Log File</br>',
					style: "color:blue;",
					bodyStyle: "color:blue;",
					autoEl: { 
						tag: 'a', 
						href: _sstr + "/cgi-bin/download_dashboard.tcl?file=" + jsonData.data.logFile,
						style: "text-align:center"
					}
			    };
				componentsStatus[i++] = {
					xtype: 'cp4_panel'
					, bodyStyle: 'padding-top: 5px; padding-bottom: 10px;'
					, html: "You may check what went wrong in the log file and revert to snapshot of the system later."
				};
			}
			else {
				componentsStatus[i++] = {
					xtype: 'cp4_panel'
					, bodyStyle: 'text-align:center; padding-top: 5px; padding-bottom: 5px;'
					, html: "The upgrade failed."
				};
				componentsStatus[i++] = {
			    	xtype: 'cp4_panel',
			    	id: 'download_link',
					html: '</br>Download Log File</br>',
					style: "color:blue;",
					bodyStyle: "color:blue;",
					autoEl: { 
						tag: 'a', 
						href: _sstr + "/cgi-bin/download_dashboard.tcl?file=" + jsonData.data.logFile,
						style: "text-align:center"
					}
			    };
			}
			if (jsonData.data.status != "success"){
				for (var j in jsonData.data.components){
					componentsStatus[i++] = {
							xtype: 'cp4_panel'
							, bodyStyle: 'padding-top: 5px'
							, html: "&nbsp&nbsp&nbsp&nbsp" + jsonData.data.components[j].name + ": " + jsonData.data.components[j].status
					};
				}
			}
			var upgradeFinConfirm = Ext.create( 'CP.WebUI4.FormPanel',{
				id: 'upgrade_confirm_panel',
				bodyPadding: 10,
				autoScroll:true,
		        items: componentsStatus,
				buttons: [{
					xtype: 'cp4_button',
		            id: 'upgr_ok_btn',
		            text: 'Reboot',
		            hidden: (jsonData.data.status != "success"),
		            handler: function(){
		            	Ext.getCmp( 'upgrade_status_confirm' ).close();
		            	Ext.Ajax.request({
		            		url: "/cgi-bin/shutdown.tcl"
		            		,method: "POST"
		            		,params: { reboot:"" }
		            		,success: function(){
		            			CP.util.rebootingWindow('Rebooting System',
									    'Please wait while system is rebooting.',
										30000);
		            		}
		            	});
		            }
		        },{
		            text: 'Done',
		            xtype: 'cp4_button',
		            handler: function(){
		            	CP.Upgrade.afterSubmit();
		                Ext.getCmp( 'upgrade_status_confirm' ).close();
		            }
		        }]
			});
			
			var mWindow = Ext.create('CP.WebUI4.ModalWin', {
				id: 'upgrade_status_confirm',
				name: 'upgrade_status_confirm',
				width: 350,
				title: 'Upgrade Finished',
				items: [ upgradeFinConfirm ]
			});
			
			mWindow.show();
		}
	});
},

reconfigurePanel: function(panel, verName) {
	CP.global.isUpgrading = true;
	panel.removeAll();
	if (verName != null) {
		Ext.Ajax.request({
			url: "/cgi-bin/upgrade.tcl",
			method: "POST",
			params: {
				action: 'start',
				version: verName
			},
			success: function(jsonResult) {
				panel.add([
				           Ext.create( 'CP.WebUI4.ConsolePanel',{
				        	   id: 'upgrade_term',
				        	   cgiPrefix: '/cgi-bin',
				        	   terminalConsoleId: 'upgrade_window',
				        	   overrideLock: false,
				        	   beforeClose: CP.Upgrade.termBeforeCloseHandler,
				        	   rows: 14,
				        	   cols: 60,
				        	   width: 490,
				        	   height: 240
				           })
				 ]);
			}
		});
	}
	else {
		panel.add([
		           Ext.create( 'CP.WebUI4.ConsolePanel',{
		        	   id: 'upgrade_term',
		        	   cgiPrefix: '/cgi-bin',
		        	   terminalConsoleId: 'upgrade_window',
		        	   overrideLock: false,
		        	   beforeClose: CP.Upgrade.termBeforeCloseHandler,
		        	   rows: 14,
		        	   cols: 60,
		        	   width: 490,
		        	   height: 240
		           })
		 ]);
	}
	panel.on({
		destroy: function(pnl, opts){
			CP.global.isUpgrading = false;
			CP.Upgrade.afterSubmit();
		}
	});
},

applyHandler: function(values ) {
	CP.Upgrade.upgradePage.params = values;
	CP.UI.applyHandler(CP.Upgrade.upgradePage);
},

afterSubmit: function(){
	Ext.getCmp( 'upgrade-grid').getStore().load();
	Ext.Ajax.request({
		url: "/cgi-bin/upgrade.tcl",
		method: "GET",
		params: {
			action: 'is_upgrade_running'
		},
		success: function(jsonResult) {
			var jsonData = Ext.decode( jsonResult.responseText );
			
			var btn = Ext.getCmp('btn-upgrade-monitor');
			if (!btn)
				return;
			
			if (jsonData.data.running == "true")
				btn.setVisible(true);
			else
				btn.setVisible(false);
		}
	});
}
}
