// Copyright Check Point

CP.SUMail = {
		
	DELETE_BTN: 'delete_button',
	ADD_BTN: 'add_button',
	
	SUBMIT_URL: '/cgi-bin/installer_mail.tcl',
	
	PAGE_ID: 'su_mail_page',
	PANEL_ID: 'su_mail_panel',
	GRID_ID: 'su_mail_grid',
	NOTIFICATIONS: 'notifications_panel',
	CHECKBOXGROUP: 'checkbox_group',
	MaxRows: 5,
	
	// init: builds the page
	init:function() {
	
		Ext.Ajax.request({
            url : CP.SUMail.SUBMIT_URL,
            method : 'GET',
            success : function(jsonResult) {
                CP.SUMail.mailData = Ext.decode(jsonResult.responseText).data.maildata;
                var page = {
					id: CP.SUMail.PAGE_ID,
					title: "Software Updates Mail Notifications",
					params : {},
					submitURL : CP.SUMail.SUBMIT_URL,
					panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
						id: CP.SUMail.PANEL_ID,
						items: CP.SUMail.getPageItems()
					})			
				};
				if (CP.SUMail.mailData && CP.SUMail.mailData.mailhub && CP.SUMail.mailData.root) {
					Ext.getCmp('set_mail_msg').hide();
					Ext.getCmp(CP.SUMail.ADD_BTN).enable();
				} else {
					Ext.getCmp('set_mail_msg').show();
					Ext.getCmp(CP.SUMail.ADD_BTN).disable();
				}
                CP.UI.updateDataPanel(page);
				CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUMail.PANEL_ID).getForm());
			}
        });
		
	}
	
	,getPageItems: function() {
		var mailStore = Ext.create('CP.WebUI4.JsonStore',{
			autoLoad: true,
			fields: [ 'address', 'available', 'd_status', 'i_status' ],
			proxy: {
				type: 'ajax',
				url: CP.SUMail.SUBMIT_URL,
				reader: {
					type: 'json',
					root: 'data.mail'
				}
			},
			listeners: {
				load: function() {
					Ext.getCmp(CP.SUMail.DELETE_BTN).disable();
					var table = Ext.getCmp(CP.SUMail.GRID_ID);
					if (table) {
						var rowHeight = 23;
						var maxRows = CP.SUMail.MaxRows;
						if (table.getStore().getCount() > maxRows) {
							table.setHeight((maxRows+1)*rowHeight);
						} else {
							table.setHeight((table.getStore().getCount()+1)*rowHeight);
						}
						if (table.getStore().getCount() > 0) {
							table.getSelectionModel().select(0); // by default, selecting the first row
							table.fireEvent('itemclick',table,table.getStore().getAt(0), 0,0,0);
						}
					}
					CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUMail.PANEL_ID).getForm());
				}
			}
		});
		
		var columns = [
			{ header: 'E-mail addresses', editable:false, flex: 1, dataIndex:'address', id: 'address' }
		];
		
		var mailTable = {
            xtype : 'cp4_grid',
            id : CP.SUMail.GRID_ID,
			width : 300,
			autoHeight: true,
			autoScroll: true,
            store : mailStore,
            columns : columns,
			listeners: {
				itemclick: function(view, record, item, index, e ) {
					Ext.getCmp(CP.SUMail.DELETE_BTN).enable();
					
					// display the selected user's notifications
					var title = "Notifications for " + record.data.address;
					Ext.getCmp(CP.SUMail.NOTIFICATIONS).setTitle(title);
					Ext.getCmp(CP.SUMail.CHECKBOXGROUP).setValue({
						available: record.data.available,
						d_status: record.data.d_status,
						i_status: record.data.i_status
					});
					Ext.getCmp(CP.SUMail.NOTIFICATIONS).show();
					Ext.getCmp(CP.SUMail.CHECKBOXGROUP).show();
					
					//console.log("selected row: "+index+" Selected e-mail: "+record.data.address+" avaialble: "+record.data.available+" d_status: "+record.data.d_status+" i_status: "+record.data.i_status);
                }
			}
		};
		
		var tableTitle = Ext.create('CP.WebUI4.SectionTitle',{
			titleText: 'Mail Notifications'
		});
	
		var notificationsPanel = Ext.create('Ext.form.Panel',{
			title: 'Select address from the table',
			id: CP.SUMail.NOTIFICATIONS,
			cls: 'textField',
			width: 300,
			bodyPadding: 10,
			hidden: true,
			items: [
				{
					id: CP.SUMail.CHECKBOXGROUP,
					xtype: 'checkboxgroup',
					fieldLabel: 'Select Notifications',
					vertical: true,
					columns: 1,
					items: [
						{ boxLabel: 'New Available Packages', name: 'available', inputValue: 1 },
						{ boxLabel: 'Download Status', name: 'd_status', inputValue: 2 },
						{ boxLabel: 'Install Status', name: 'i_status', inputValue: 3 }
					],
					listeners: {
						change: function(checkboxgroup, newvalue, oldvalue, e) {
							// on each change to the checkboxes, post the data to the database
							//console.log("posting: ","address="+Ext.getCmp(CP.SUMail.GRID_ID).getSelectionModel().getLastSelected().data.address,"available="+checkboxgroup.items.items[0].getRawValue(),"d_status="+checkboxgroup.items.items[1].getRawValue(),"i_status="+checkboxgroup.items.items[2].getRawValue());
							var lastSelected = Ext.getCmp(CP.SUMail.GRID_ID).getSelectionModel().getLastSelected();
							Ext.Ajax.request({
								url : CP.SUMail.SUBMIT_URL,
								method : 'POST',
								params: {
									address: lastSelected.data.address,
									available: checkboxgroup.items.items[0].getRawValue(),
									d_status: checkboxgroup.items.items[1].getRawValue(),
									i_status: checkboxgroup.items.items[2].getRawValue()
								},
								success: function() { CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUMail.PANEL_ID).getForm()); }
							});
							lastSelected.data.available = checkboxgroup.items.items[0].getRawValue();
							lastSelected.data.d_status = checkboxgroup.items.items[1].getRawValue();
							lastSelected.data.i_status = checkboxgroup.items.items[2].getRawValue();
						}
					}
				}
			]
		});

		//Add buttons to panel
		var buttonsBar = {
			xtype: 'cp4_btnsbar',
			items: [
				{
					id: CP.SUMail.ADD_BTN,
					text: "Add",
					//disabled: true,
					handler: CP.SUMail.buttonPressed
				},
				{
					id: CP.SUMail.DELETE_BTN,
					text: "Delete",
					disabled: true,
					handler: CP.SUMail.buttonPressed
				}
			]
		};
		
		var setMailMsg = {
			id: 'set_mail_msg',
            xtype: 'cp4_inlinemsg',
            text: 'In order to configure a mail server, use the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/ssmtp\');return false;">Mail Notification</a> page, found in the advanced mode.'
        };

		return [ 
				tableTitle,
				buttonsBar,
				mailTable,
				notificationsPanel,
				setMailMsg
			]
	}
  
	,saveHandler: function() {
		var myparams = {
			address: Ext.getCmp('add_user_address').getRawValue(),
			available: Ext.getCmp('add_user_available').getRawValue(),
			d_status: Ext.getCmp('add_user_d_status').getRawValue(),
			i_status: Ext.getCmp('add_user_i_status').getRawValue()
		};
		Ext.Ajax.request({
            url : CP.SUMail.SUBMIT_URL,
            method : 'POST',
			params: myparams,
            success : function() {
				Ext.getCmp('mail_modal_win').close();
				CP.SUMail.init();
               // CP.UI.updateDataPanel(Ext.getCmp(CP.SUMail.PAGE_ID));
            }
        });
	}
	
	,addUser: function() {
		// panel that encloses all fields
        var form = Ext.create( 'CP.WebUI4.FormPanel', {
            layout: 'vbox',
			bodyPadding: 10,
            items: [
				{
					id: 'add_user_address',
					xtype: 'cp4_textfield',
					fieldLabel: 'E-mail address',
					vtype: 'email',
					allowBlank: false
				},
				{
					xtype: 'cp4_panel',
					//title: 'Select Notifications',
					//bodyPadding: 10,
					//frame: true,
					//vertical: true,
					//columns: 1,
					items: [
						{
							xtype: 'cp4_displayfield',
							value: 'Select Notifications:',
							width: 350
						},
						{
							id: 'add_user_available',
							xtype: 'cp4_checkbox',
							boxLabel: 'New Available Packages', 
							name: 'available', 
							inputValue: 1 
						},
						{
							id: 'add_user_d_status',
							xtype: 'cp4_checkbox',
							boxLabel: 'Download Status', 
							name: 'd_status', 
							inputValue: 2 
						},
						{
							id: 'add_user_i_status',
							xtype: 'cp4_checkbox',
							boxLabel: 'Install Status',
							name: 'i_status', 
							inputValue: 3 
						}
					]					
				}
			],
            buttons: [
				{
					xtype: 'cp4_button',
					text: 'OK',
					handler: function() {
						//run validations
						if( !form.getForm().isValid() ) {
							return;
						}
						CP.SUMail.saveHandler();
					}
				},{
					xtype: 'cp4_button',
					text: 'Cancel',
					handler: function() {
						modalWin.close();
					}
				}
			]
        });
        
        // make window and open it
        var modalWin = Ext.create( 'CP.WebUI4.ModalWin', {
            title: 'Add a new user address',
            id: 'mail_modal_win',
            width: 400,
            height: 210,
            items: [ form ]
        });
        
        modalWin.show();

	}
  
  	,buttonPressed: function(button, event) {
		// handler for button presses
		var table = Ext.getCmp(CP.SUMail.GRID_ID);
		if (!table) {
			return;
		}
		if (button.id == CP.SUMail.DELETE_BTN) {
			// delete the selected user
			var selectedRecord = Ext.getCmp(CP.SUMail.GRID_ID).getSelectionModel().getLastSelected();
			Ext.Ajax.request({
				url : CP.SUMail.SUBMIT_URL,
				method : 'POST',
				params: {
					delete_user: 1,
					address: selectedRecord.data.address
				}
			});
			CP.SUMail.init();
		}
		if (button.id == CP.SUMail.ADD_BTN) {
			// add a new user
			CP.SUMail.addUser();
		}
	}
}
