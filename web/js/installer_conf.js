// Copyright Check Point

// PING Installer - display packages available to download, available to install, and installed packages. Initiate download, install or uninstall.

CP.SUConf = {
	
	DEBUG: false,
	
	isDArunning: false,
	DAwarning_shown: false,
	
	SAVE_BTN: 'save_button',
	CANCEL_BTN: 'cancel_button',
	DISCARD_BTN: 'discard_button',
	EXPORT_BTN: 'export_button',
	IMPORT_BTN: 'import_button',
	START_BTN: 'start_button',
	STOP_BTN: 'stop_button',
	OK_BTN: 'ok_button',
	D_EDIT_BTN: 'd_edit_button',
	
	// Download and Install schedueling information
	D_RADIO: 'd_radio',
	D_RADIO_ID: 'd_radio_id',
	
	D_SCHED_TYPE: '',
	
	D_SCHED_WEEKDAYS: '', 
	
	D_SCHED_MONTHDAYS: '',
	
	D_SCHED_MONTHS: '',
	
	D_SCHED_HOURS: '',
	
	D_SCHED_MINUTES: '',
	
	D_SCHED_YEAR: '',
	
	D_SCHEDULE: '',
	
	AUTOMATIC: 	"automatic",
	MANUAL: 	"manual",
	SCHEDULE:	"schedule",
	
	CHECK_FOR_UPDATES_DISABLED: "disabled",
	CHECK_FOR_UPDATES_ENABLED: "enabled",
	CHECK_FOR_UPDATES_PERIOD_DEFAULT: 3, // by default, the check for updates period is 3 hours
	
	D_SCHEDULE_LOADED:	false,
	
	D_SCHEDULE_TIME: false,
	
	DONT_SUBMIT: false,

	POLICY_SUBMIT_URL: "/cgi-bin/installer_policy.tcl",
	
	// Mail notification variables
	DELETE_BTN: 'delete_button',
	ADD_BTN: 'add_button',
	
	MAIL_SUBMIT_URL: '/cgi-bin/installer_mail.tcl',
	
	PAGE_ID: 'su_mail_page',
	PANEL_ID: 'conf_panel',
	GRID_ID: 'su_mail_grid',
	NOTIFICATIONS: 'notifications_panel',
	CHECKBOXGROUP: 'checkbox_group',
	MaxRows: 5,

	
	// init: builds the page
	init:function() {
	
		var title = {
			xtype: "cp4_sectiontitle",
			titleText: "Software Deployment Policy"
		};
	
		var d_editBtn = Ext.create('CP.WebUI4.Button',{
			tooltip: 'Click to edit Hotfix Download Scheduling',
			id: CP.SUConf.D_EDIT_BTN,
			icon: '../images/icons/edit.gif',
			width: 20,
			height: 20,
			padding: '0 0 0 0',
			hidden: true,
			handler: CP.SUConf.buttonPressed
		});

		var d_btn = Ext.create('Ext.container.Container', {
			padding: '23 0 0 5',
			items: [ d_editBtn ]
		});
					
		var buttonsBar = {
			xtype: 'cp4_btnsbar',
			items: [
				{
					id: CP.SUConf.SAVE_BTN,
					text: "Apply",
					handler: CP.SUConf.buttonPressed
				}
			]
		};
		
		var D_radio = {
			id: CP.SUConf.D_RADIO_ID,
			xtype: "cp4_radiogroup",
			fieldLabel: "Download Hotfixes",
			labelWidth: 143,
			columns: 1,
			width: 220,
			items: [
				{
					id: 'd_manual',
					boxLabel: "Manually",
					inputValue: CP.SUConf.MANUAL,
					name: CP.SUConf.D_RADIO/*,
					listeners: {
						change: function(radiogroup, newvalue, oldvalue, e) {
							if (newvalue && !oldvalue && (!CP.SUConf.DONT_SUBMIT)) {
								CP.SUConf.submitData(true);
							}
						}
					}*/

				},
				{
					id: 'd_schedule',
					boxLabel: "Scheduled",
					inputValue: CP.SUConf.SCHEDULE,
					name: CP.SUConf.D_RADIO,
					listeners: {
						change: function(radio, newvalue, oldvalue, e) {
							var editBtn = Ext.getCmp(CP.SUConf.D_EDIT_BTN);
							if (editBtn) {
								if (newvalue) {
									editBtn.show();
								} else {
									editBtn.hide();
								}
							}
							var d_msg = Ext.getCmp('d_msg');
							if (d_msg) {
								if (newvalue) {
									d_msg.show();
								} else {
									d_msg.hide();
								}
							}
							if (CP.SUConf.D_SCHEDULE_LOADED) {
								// schedule was loaded from database, don't open the schedule window this time
								CP.SUConf.D_SCHEDULE_LOADED = false;
								return;
							}
							if (newvalue) {
								// open a schedule window
								CP.SUConf.scheduleWindow(CP.SUConf.D_RADIO);
							}
						}
					}
				},
				{
					id: 'd_automatic',
					boxLabel: "Automatic",
					inputValue: CP.SUConf.AUTOMATIC,
					name: CP.SUConf.D_RADIO/*,
					listeners: {
						change: function(radiogroup, newvalue, oldvalue, e) {
							if (newvalue && !oldvalue && (!CP.SUConf.DONT_SUBMIT)) {
								CP.SUConf.submitData(true);
							}
						}
					}*/

				}
			],
			listeners: {
				change: function() {
					CP.SUConf.enableSaveButton();
				}
			}
		};
			
		var D_msg = {
			xtype: 'cp4_container',
			id: 'd_msg',
			html: CP.SUConf.D_SCHEDULE,
			hidden: true,
			width: 220,
			padding: '25 0 0 5'
		};
		
		var D_box = Ext.create('Ext.container.Container', {
			layout: { type: 'hbox' },
			width: 800,
			items: [ D_radio, d_btn, D_msg ]
		});
				
		var Conf_title = {
			xtype: "cp4_sectiontitle",
			titleText: "Additional Configuration"
		};
		
		var ForceMajors = Ext.create('CP.WebUI4.Checkbox', {
			boxLabel: "Ignore CRs conflict on upgrade of Full Images",
			id: 'force_maj_cb'/*,
			listeners: {
				change: function(cb, newValue, oldValue, e) {
					if (!CP.SUConf.DONT_SUBMIT) {
						CP.SUConf.submitData(false);
					}
				}
			}*/
		});
		
		var GWstat_cb = Ext.create('CP.WebUI4.Checkbox', {
			boxLabel: "Send download and installation data of Software Updates to Check Point",
			id: 'gwstat_cb',
			listeners: {
				change: function() {
					CP.SUConf.enableSaveButton();
				}
			}
		});
		
		var autoDownload_cb = Ext.create('CP.WebUI4.Checkbox', {
			boxLabel: "Periodically update new Deployment Agent version (recommended)",
			id: 'auto_download_cb',
			listeners: {
				change: function() {
					CP.SUConf.enableSaveButton();
				}
			}
		});
		
		var checkForUpdatesPeriodSlider = Ext.create('Ext.slider.Single', {
			id: 'check_for_updates_period_slider',
			fieldLabel: 'Check for updates period',
			margin: '0 10 0 0',
			height: '20px',
			width: 500,
			labelWidth: 140,
			value: 3,
			minValue: 0,
			maxValue: 240,
			increment: 1,
			tipText: function(obj) {
				if (obj.value == 0) {
					return "Disabled";
				}
				var days = Math.floor(obj.value / 24);
				var days_plural = days > 1 ? "s" : "";
				var hours = obj.value % 24;
				var hours_plural = hours > 1 ? "s" : "";
				if (days > 0) {
					if (hours != 0) {
						return (days + ' day' + days_plural + ' and ' + hours + ' hour' + hours_plural);
					} else {
						return (days + ' day' + days_plural);
					}
				}
				return hours + " hour" + hours_plural;
			},
			listeners: {
				change: function(obj, newValue) {
					var checkForUpdatesStatusPanel = Ext.getCmp('check_for_updates_status_panel');
					if (newValue == 0) {
						checkForUpdatesStatusPanel.setValue('Disabled');
						checkForUpdatesStatusPanel.setFieldStyle('color: red');
					} else {
						var days = Math.floor(newValue / 24);
						var days_plural = days > 1 ? "s" : "";
						var hours = newValue % 24;
						var hours_plural = hours > 1 ? "s" : "";
						if (days > 0) {
							if (hours != 0) {
								checkForUpdatesStatusPanel.setValue(days + ' day' + days_plural + ' and ' + hours + ' hour' + hours_plural);
							} else {
								checkForUpdatesStatusPanel.setValue(days + ' day' + days_plural);
							}
						} else {
							checkForUpdatesStatusPanel.setValue(hours + " hour" + hours_plural);
						}
						checkForUpdatesStatusPanel.setFieldStyle('color: black');
					}
					CP.SUConf.enableSaveButton();
				}
			}
		});
		
		var checkForUpdatesStatusPanel = Ext.create('CP.WebUI4.DisplayField', {
			value: CP.SUConf.CHECK_FOR_UPDATES_PERIOD_DEFAULT + ' hours',
			id: 'check_for_updates_status_panel',
			listeners: {
				disable: function() {
					var checkForUpdatesPeriodSlider = Ext.getCmp('check_for_updates_period_slider');
					if (checkForUpdatesPeriodSlider) {
						checkForUpdatesPeriodSlider.disable();
					}
				},
				enable: function() {
					var checkForUpdatesPeriodSlider = Ext.getCmp('check_for_updates_period_slider');
					if (checkForUpdatesPeriodSlider) {
						checkForUpdatesPeriodSlider.enable();
					}
				}
			}
		});
		
		var checkForUpdatesPeriod = Ext.create('CP.WebUI4.FieldContainer', {
			margin: '8 0 8 0',
			padding: '3 0 3 0',
		    items: [
				checkForUpdatesPeriodSlider,
				checkForUpdatesStatusPanel
			]
		});

		// this is a panel that contains the three self-test checkboxes
		var sanityTests_cbg = {
			xtype: 'cp4_panel',
			items: [
				{ 
					xtype: 'cp4_checkbox',
					boxLabel: 'Verify that primary Check Point processes are running', 
					name: 'st', 
					inputValue: '1', 
					id: 'st_proc',
					listeners: {
						change: function() {
							CP.SUConf.enableSaveButton();
						}
					}
				},
				{ 
				xtype: 'cp4_checkbox',
					boxLabel: 'Verify that the initial gateway policy is installed', 
					name: 'st', 
					inputValue: '2', 
					id: 'st_pi',
					listeners: {
						change: function() {
							CP.SUConf.enableSaveButton();
						}
					}
				},
				{ 
				xtype: 'cp4_checkbox',
					boxLabel: 'Verify network link up', 
					name: 'st', 
					inputValue: '3', 
					id: 'st_na',
					listeners: {
						change: function() {
							CP.SUConf.enableSaveButton();
						}
					}
				}
			],
			listeners: {
				afterrender: function(sender, opts) {
					// disable the panel with the checkboxes if there is configuration lock or if the ui is in ready only mode
					if (CP.UI.accessMode == 'ro') {
						sender.disabled = true;
					}
				}
			}
		};

		// this is the panel that contains the self tests label and checkboxes
		var sanityTestsPanel = Ext.create('CP.WebUI4.FormPanel', {
			margin: '8 0 8 0',
		    layout: {
		        type: 'hbox'
		    },
		    items: [{
		    	xtype: 'cp4_label',
		        text: 'Self Tests to perform:',
				margins: '0 43 0 0'
		    },
			sanityTests_cbg
			]
		});
				
		var mailStore = Ext.create('CP.WebUI4.JsonStore',{
			autoLoad: true,
			fields: [ 'address', 'available', 'd_status', 'i_status' ],
			proxy: {
				type: 'ajax',
				url: CP.SUConf.MAIL_SUBMIT_URL,
				reader: {
					type: 'json',
					root: 'data.mail'
				}
			},
			listeners: {
				load: function() {
					Ext.getCmp(CP.SUConf.DELETE_BTN).disable();
					var table = Ext.getCmp(CP.SUConf.GRID_ID);
					if (table) {
						var rowHeight = 23;
						var maxRows = CP.SUConf.MaxRows;
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
					CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUConf.PANEL_ID).getForm());
				}
			}
		});
		
		var columns = [
			{ header: 'E-mail addresses', editable:false, flex: 1, dataIndex:'address', id: 'address' }
		];
		
		var mailTable = {
            xtype : 'cp4_grid',
            id : CP.SUConf.GRID_ID,
			width : 300,
			autoHeight: true,
			autoScroll: true,
            store : mailStore,
            columns : columns,
			listeners: {
				itemclick: function(view, record, item, index, e ) {
					Ext.getCmp(CP.SUConf.DELETE_BTN).enable();
					
					// display the selected user's notifications
					var title = "Notifications for " + record.data.address;
					Ext.getCmp(CP.SUConf.NOTIFICATIONS).setTitle(title);
					Ext.getCmp(CP.SUConf.CHECKBOXGROUP).setValue({
						available: record.data.available,
						d_status: record.data.d_status,
						i_status: record.data.i_status
					});
					Ext.getCmp(CP.SUConf.NOTIFICATIONS).show();
					Ext.getCmp(CP.SUConf.CHECKBOXGROUP).show();
					
					//console.log("selected row: "+index+" Selected e-mail: "+record.data.address+" avaialble: "+record.data.available+" d_status: "+record.data.d_status+" i_status: "+record.data.i_status);
                }
			}
		};
		
		var tableTitle = Ext.create('CP.WebUI4.SectionTitle',{
			titleText: 'Mail Notifications'
		});
	
		var notificationsPanel = Ext.create('Ext.form.Panel',{
			title: 'Select address from the table',
			id: CP.SUConf.NOTIFICATIONS,
			cls: 'textField',
			width: 300,
			bodyPadding: 10,
			hidden: true,
			items: [
				{
					id: CP.SUConf.CHECKBOXGROUP,
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
							//console.log("posting: ","address="+Ext.getCmp(CP.SUConf.GRID_ID).getSelectionModel().getLastSelected().data.address,"available="+checkboxgroup.items.items[0].getRawValue(),"d_status="+checkboxgroup.items.items[1].getRawValue(),"i_status="+checkboxgroup.items.items[2].getRawValue());
							var lastSelected = Ext.getCmp(CP.SUConf.GRID_ID).getSelectionModel().getLastSelected();
							Ext.Ajax.request({
								url : CP.SUConf.MAIL_SUBMIT_URL,
								method : 'POST',
								params: {
									address: lastSelected.data.address,
									available: checkboxgroup.items.items[0].getRawValue(),
									d_status: checkboxgroup.items.items[1].getRawValue(),
									i_status: checkboxgroup.items.items[2].getRawValue()
								},
								success: function() { CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUConf.PANEL_ID).getForm()); }
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
		var mail_buttonsBar = {
			xtype: 'cp4_btnsbar',
			items: [
				{
					id: CP.SUConf.ADD_BTN,
					text: "Add",
					//disabled: true,
					handler: CP.SUConf.buttonPressed
				},
				{
					id: CP.SUConf.DELETE_BTN,
					text: "Delete",
					disabled: true,
					handler: CP.SUConf.buttonPressed
				}
			]
		};
		
		var setMailMsg = {
			id: 'set_mail_msg',
			xtype: 'cp4_inlinemsg',
			text: 'In order to configure a mail server, use the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/ssmtp\');return false;">Mail Notification</a> page, found in the advanced view mode.'
		};

 		var policyPanel = Ext.create('CP.WebUI4.DataFormPanel',{
			id: CP.SUConf.PANEL_ID,
			labelWidth: 150,
			//height: 700,
			items: [
				title,
				D_box,
				//I_box, (removed due to CR01562836)
				//Conf_title,
				//ForceMajors,
				//displayOptions_cbg, (removed due to CR01476179)
				GWstat_cb,
				sanityTestsPanel,
				autoDownload_cb,
				checkForUpdatesPeriod,
				buttonsBar,
				tableTitle,
				mail_buttonsBar,
				mailTable,
				notificationsPanel,
				setMailMsg
			],
			listeners: {
				render: CP.SUConf.doLoad
			}
		});

		var page = {
			id: CP.SUConf.PAGE_ID,
			title: "Software Updates Configuration",
			panel: policyPanel,
			submit:true,
			discard:false,
			submitURL: CP.SUConf.POLICY_SUBMIT_URL,
			afterSubmit: CP.SUConf.afterSubmit,
			params:{}
		};

		Ext.Ajax.request({
			url : CP.SUConf.MAIL_SUBMIT_URL,
			method : 'GET',
			success : function(jsonResult) {
				CP.SUConf.mailData = Ext.decode(jsonResult.responseText).data.maildata;
				if (CP.SUConf.mailData && CP.SUConf.mailData.mailhub && CP.SUConf.mailData.root) {
					Ext.getCmp('set_mail_msg').hide();
					Ext.getCmp(CP.SUConf.ADD_BTN).enable();
				} else {
					Ext.getCmp('set_mail_msg').show();
					Ext.getCmp(CP.SUConf.ADD_BTN).disable();
				}
				CP.UI.updateDataPanel(page);
				CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.SUConf.PANEL_ID).getForm());
			}
		});
	} // end of function init
	
	,afterSubmit: function(form, action) {
		//reload the page
		CP.SUConf.doLoad(Ext.getCmp(CP.SUConf.PANEL_ID));
	}
	
	,updateMessage: function(data) {
		var d_hoursPreZero = (data.d_hours < 10)?"0":"";
		var i_hoursPreZero = (data.i_hours < 10)?"0":"";
		var d_minutesPreZero = (data.d_minutes < 10)?"0":"";
		var i_minutesPreZero = (data.i_minutes < 10)?"0":"";

		if (data.d_radio == CP.SUConf.SCHEDULE) {			
			var type = "Every Day, at ";
			
			CP.SUConf.D_SCHED_TYPE = data.d_stype;
			CP.SUConf.D_SCHED_HOURS = d_hoursPreZero + parseInt(data.d_hours, 10);
			CP.SUConf.D_SCHED_MINUTES = d_minutesPreZero + parseInt(data.d_minutes, 10);
			
			CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_HOURS + ":" + CP.SUConf.D_SCHED_MINUTES;
			if (data.d_stype == "weekly") {
				type = "Every Week, on ";
				switch (data.d_weekdays) {
					case 0: { CP.SUConf.D_SCHED_WEEKDAYS = "Sunday" } break; 
					case 1: { CP.SUConf.D_SCHED_WEEKDAYS = "Monday" } break; 
					case 2: { CP.SUConf.D_SCHED_WEEKDAYS = "Tuesday" } break; 
					case 3: { CP.SUConf.D_SCHED_WEEKDAYS = "Wednesday" } break; 
					case 4: { CP.SUConf.D_SCHED_WEEKDAYS = "Thursday" } break; 
					case 5: { CP.SUConf.D_SCHED_WEEKDAYS = "Friday" } break; 
					case 6: { CP.SUConf.D_SCHED_WEEKDAYS = "Saturday" } break;
					default: { CP.SUConf.D_SCHED_WEEKDAYS = data.d_weekdays } break;
				}
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_WEEKDAYS + ", at " + CP.SUConf.D_SCHED_HOURS + ":" + CP.SUConf.D_SCHED_MINUTES;
			}
			if (data.d_stype == "monthly") {
				type = "Every Month, on the ";
				CP.SUConf.D_SCHED_MONTHDAYS = data.d_monthdays;
				var postfix = 'th';
				if (data.d_monthdays % 10 == 1) {
					postfix = 'st';
				}
				if (data.d_monthdays % 10 == 2) {
					postfix = 'nd';
				}
				if (data.d_monthdays % 10 == 3) {
					postfix = 'rd';
				}
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_MONTHDAYS + postfix + ", at " + CP.SUConf.D_SCHED_HOURS + ":" + CP.SUConf.D_SCHED_MINUTES;
			}
			if (data.d_stype == "singular") {
				type = "Once, at "
				CP.SUConf.D_SCHED_MONTHDAYS = data.d_monthdays;
				CP.SUConf.D_SCHED_YEAR = data.d_year;
				switch (data.d_months) {
					case 1: { CP.SUConf.D_SCHED_MONTHS = "January" } break; 
					case 2: { CP.SUConf.D_SCHED_MONTHS = "February" } break; 
					case 3: { CP.SUConf.D_SCHED_MONTHS = "March" } break; 
					case 4: { CP.SUConf.D_SCHED_MONTHS = "April" } break; 
					case 5: { CP.SUConf.D_SCHED_MONTHS = "May" } break; 
					case 6: { CP.SUConf.D_SCHED_MONTHS = "June" } break; 
					case 7: { CP.SUConf.D_SCHED_MONTHS = "July" } break; 
					case 8: { CP.SUConf.D_SCHED_MONTHS = "August" } break; 
					case 9: { CP.SUConf.D_SCHED_MONTHS = "September" } break; 
					case 10: { CP.SUConf.D_SCHED_MONTHS = "October" } break; 
					case 11: { CP.SUConf.D_SCHED_MONTHS = "November" } break; 
					case 12: { CP.SUConf.D_SCHED_MONTHS = "December" } break;
				}
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_MONTHS + " " + CP.SUConf.D_SCHED_MONTHDAYS + ", on " + CP.SUConf.D_SCHED_YEAR + ", at " + CP.SUConf.D_SCHED_HOURS + ":" + CP.SUConf.D_SCHED_MINUTES;
			}
		}
		Ext.getCmp('d_msg').update(CP.SUConf.D_SCHEDULE);
	}
	
	,doLoad: function(formPanel) {
		// Load the policy configuration from the database
		CP.SUConf.D_SCHEDULE_LOADED = true;
		
		CP.SUConf.DONT_SUBMIT=true;
		formPanel.load({
			url: CP.SUConf.POLICY_SUBMIT_URL,
			method: 'GET',
			success: function (form,action) {
				var info = Ext.decode(action.response.responseText);
				if (info.data.d_radio == CP.SUConf.SCHEDULE) {
					CP.SUConf.D_SCHEDULE_TIME = true;
					Ext.getCmp('d_msg').show();
				} else {
					CP.SUConf.D_SCHEDULE_LOADED = false;
					CP.SUConf.D_SCHEDULE_TIME = false;
					Ext.getCmp('d_msg').hide();
				}
				
				//Ext.getCmp('do_dl').setValue(info.data.legacy_display); //do_dl = displayOptions_display_legacy (removed due to CR01476179)
				Ext.getCmp('gwstat_cb').setValue(info.data.gw_stat);
				Ext.getCmp('force_maj_cb').setValue(info.data.force_maj);
				Ext.getCmp('auto_download_cb').setValue(info.data.auto_download);
				Ext.getCmp('st_proc').setValue(info.data.sanity_proc);
				Ext.getCmp('st_pi').setValue(info.data.sanity_install_policy);
				Ext.getCmp('st_na').setValue(info.data.sanity_network_access);
				CP.SUConf.DONT_SUBMIT=false;
				
				CP.SUConf.updateMessage(info.data);
				var checkForUpdatesPeriodSlider = Ext.getCmp('check_for_updates_period_slider');
				if (info.data.check_for_updates_status == CP.SUConf.CHECK_FOR_UPDATES_DISABLED) {
					checkForUpdatesPeriodSlider.setValue(0);
				} else if (info.data.check_for_updates_period != "" && info.data.check_for_updates_status != "") {
					checkForUpdatesPeriodSlider.setValue(info.data.check_for_updates_period / 3600);
				}
				
				Ext.getCmp(CP.SUConf.SAVE_BTN).disable();		
				
			},
			failure: function() {
				console.log("Loading of policy data failed!");
			}
		});
	}
	
	,onSaveAdd: function(button, event) {
		// save the schedule data
		button.removeListener('click',CP.SUConf.onSaveAdd);
		var winObj = Ext.getCmp('add_job_window');
		
		var scheduling = {};
		if (!winObj || !CP.SUConf.getSchedulingToSend(scheduling)) {
			button.addListener('click',CP.SUConf.onSaveAdd);
			return;
		}
		
		// save the scheduling data
		var type = "Every Day, at ";
		var weekdays = "";
		var monthdays = "";
		var months = "";
		
		var hoursPreZero = (scheduling.hours < 10)?"0":"";
		var minutesPreZero = (scheduling.minutes < 10)?"0":"";

		if (button.schedule == CP.SUConf.D_RADIO) {
			CP.SUConf.D_SCHEDULE_LOADED = false;
			
			CP.SUConf.D_SCHED_TYPE = scheduling.type;
			CP.SUConf.D_SCHED_HOURS = hoursPreZero + scheduling.hours;
			CP.SUConf.D_SCHED_MINUTES = minutesPreZero + scheduling.minutes;	
			
			if (scheduling.type == "weekly") {
				type = "Every Week, on ";
				switch (scheduling.daysinweek) {
					case 0: { CP.SUConf.D_SCHED_WEEKDAYS = "Sunday" } break; 
					case 1: { CP.SUConf.D_SCHED_WEEKDAYS = "Monday" } break; 
					case 2: { CP.SUConf.D_SCHED_WEEKDAYS = "Tuesday" } break; 
					case 3: { CP.SUConf.D_SCHED_WEEKDAYS = "Wednesday" } break; 
					case 4: { CP.SUConf.D_SCHED_WEEKDAYS = "Thursday" } break; 
					case 5: { CP.SUConf.D_SCHED_WEEKDAYS = "Friday" } break; 
					case 6: { CP.SUConf.D_SCHED_WEEKDAYS = "Saturday" } break; 
				}
			}
			else if (scheduling.type == "monthly") {
				type = "Every Month, on the ";
				CP.SUConf.D_SCHED_MONTHDAYS = scheduling.daysinmonth;
				var postfix = 'th';
				if (scheduling.daysinmonth % 10 == 1) {
					postfix = 'st';
				}
				if (scheduling.daysinmonth % 10 == 2) {
					postfix = 'nd';
				}
				if (scheduling.daysinmonth % 10 == 3) {
					postfix = 'rd';
				}
			}
			else if (scheduling.type == "singular") {
				type = "Once, at "
				CP.SUConf.D_SCHED_MONTHDAYS = scheduling.daysinmonth.toString();
				switch (scheduling.months) {
					case 1: { CP.SUConf.D_SCHED_MONTHS = "January" } break; 
					case 2: { CP.SUConf.D_SCHED_MONTHS = "February" } break; 
					case 3: { CP.SUConf.D_SCHED_MONTHS = "March" } break; 
					case 4: { CP.SUConf.D_SCHED_MONTHS = "April" } break; 
					case 5: { CP.SUConf.D_SCHED_MONTHS = "May" } break; 
					case 6: { CP.SUConf.D_SCHED_MONTHS = "June" } break; 
					case 7: { CP.SUConf.D_SCHED_MONTHS = "July" } break; 
					case 8: { CP.SUConf.D_SCHED_MONTHS = "August" } break; 
					case 9: { CP.SUConf.D_SCHED_MONTHS = "September" } break; 
					case 10: { CP.SUConf.D_SCHED_MONTHS = "October" } break; 
					case 11: { CP.SUConf.D_SCHED_MONTHS = "November" } break; 
					case 12: { CP.SUConf.D_SCHED_MONTHS = "December" } break; 
					//case ",": { months = months + ", " } break; 
				}
				//}
				//CP.SUConf.D_SCHED_MONTHS = scheduling.months;
				CP.SUConf.D_SCHED_YEAR = scheduling.year.toString();
			}
			if (scheduling.type == "weekly") {
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_WEEKDAYS + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "monthly") {
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_MONTHDAYS + postfix + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "singular") {
				CP.SUConf.D_SCHEDULE = type + CP.SUConf.D_SCHED_MONTHS + " " + CP.SUConf.D_SCHED_MONTHDAYS + ", on " + CP.SUConf.D_SCHED_YEAR + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "daily") {
				CP.SUConf.D_SCHEDULE = type + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			Ext.getCmp('d_msg').update(CP.SUConf.D_SCHEDULE);
			Ext.getCmp('d_msg').show();
		}
		
		winObj.close();
	}
	
	,getSchedulingToSend: function(scheduling) {
		var result = true;
		
		scheduling.type = "all";
		scheduling.hours = "all";
		scheduling.minutes = "all";
		scheduling.daysinmonth = 0;
		scheduling.months = 0;
		scheduling.daysinweek = "all";
		scheduling.year = 0;
		
		if (Ext.getCmp('cb_daily').getValue()) {
			//daily
			scheduling.type = "daily";
			result = ( CP.SUConf.getTimeFromBox('day_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_weekly').getValue()) {
			//weekly 
			scheduling.type = "weekly";
			scheduling.daysinweek = Ext.getCmp('day_of_week_lc').getValue();
			if ((scheduling.daysinweek == undefined) || (scheduling.daysinweek < 0) || (scheduling.daysinweek > 6))
				result = false;
			result = ( CP.SUConf.getTimeFromBox('week_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_monthly').getValue()) {
			//monthly
			scheduling.type = "monthly";
			//scheduling.months = Ext.getCmp('months_lc').getValue();
			//result = (result && scheduling.months);
			scheduling.daysinmonth = Ext.getCmp('days_of_month_lc').getValue();
			result = (result && scheduling.daysinmonth);
			result = ( CP.SUConf.getTimeFromBox('month_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_singular').getValue()) {
			//singular
			scheduling.type = "singular";
			if (!(Ext.getCmp('singular_date').validate()))
				return false;
			result = ( CP.SUConf.getTimeFromBox('singular_job', scheduling) && result );
			scheduling.daysinmonth = Ext.getCmp('singular_date').getValue().getDate();
			result = (result && scheduling.daysinmonth);
			scheduling.months = Ext.getCmp('singular_date').getValue().getMonth()+1; // the +1 is to adjust 0-11 months to 1-12
			result = (result && scheduling.months);
			scheduling.year = Ext.getCmp('singular_date').getValue().getFullYear();
			result = (result && scheduling.year);
		}
		
		return result;
	}

	
	,getTimeFromBox: function( timeBoxId, scheduling ) {
		var timeField = Ext.getCmp( timeBoxId );
		//hours	
		var hoursField = timeField.getHoursField();
		var result = hoursField.validate();
		scheduling.hours = parseInt( hoursField.getValue(), 10 );
		
		//AM:PM
		var ampmField = timeField.getAmPmField();
		if ( ampmField.getValue() == "PM")
			scheduling.hours = (scheduling.hours + 12)%24;
		else if ( ampmField.getValue() != "AM")
			result = false;
		
		//minutes
		var minField = timeField.getMinutesField();
		result = ( minField.validate() && result);
		scheduling.minutes = parseInt( minField.getValue(), 10 );
		
		return result;
	}

	
	,scheduleWindow: function(radiogroup) {
		// display the schedule window
		var title = "";
		
		if (radiogroup == CP.SUConf.D_RADIO) {
			title = "Schedule Downloads";
		}
		
		var winObj = CP.SUConf.getModalWindow(radiogroup);
		if( !winObj ) {
			return;
		}
		CP.SUConf.insertTime(radiogroup);
		
		Ext.getCmp(CP.SUConf.OK_BTN).addListener('click',CP.SUConf.onSaveAdd);
		winObj.setTitle( title );
		winObj.show();
		
	}
 
	,getModalWindow: function(schedule_type) {
		var modalWin = Ext.getCmp('add_job_window');
		// Create modal window only if does not exist
		if( !modalWin ) {
			//list of days in months combo
			var dayOfMonthLC = Ext.create('CP.WebUI4.ComboCheckBox',{
				id: 'days_of_month_lc',
				name: 'days_of_month_lc',
				fieldLabel: 'Day of Month',
				width: 200,
				hideOnSelect: false,
				maxHeight: 200,
				beforeBlur: Ext.emptyFn,
				editable: false,
				idProperty: 'id',
				multiSelect: false,//true,
				store: Ext.create('CP.WebUI4.ArrayStore',{
					fields:[ {name:'id',type:'int'}, 'privGroup'],
					data:[
						[1, '1'],[2, '2'],[3, '3'],[4, '4'],[5, '5'],[6, '6'],[7, '7'],[8, '8'],[9, '9'],
						[10, '10'],[11, '11'],[12, '12'],[13, '13'],[14, '14'],[15, '15'],[16, '16'],[17, '17'],[18, '18'],[19, '19'],
						[20, '20'],[21, '21'],[22, '22'],[23, '23'],[24, '24'],[25, '25'],[26, '26'],[27, '27'],[28, '28'],[29, '29'],
						[30, '30'],[31, '31']
					]
				}),
				valueField:'id',
				displayField:'privGroup'
			});
			
			//list of days in week combo
			var dayOfWeekLC = Ext.create('CP.WebUI4.ComboCheckBox',{
				id: 'day_of_week_lc',
				name: 'day_of_week_lc',
				fieldLabel: 'Day of Week',
				width: 200,
				hideOnSelect: false,
				maxHeight: 200,
				beforeBlur: Ext.emptyFn,
				editable: false,
				idProperty: 'id',
				multiSelect: false,//true,
				store: Ext.create('CP.WebUI4.ArrayStore',{
					fields:[ {name:'id',type:'int'}, 'privGroup'],
					data:[
						[0, 'Sunday'],
						[1, 'Monday'],
						[2, 'Tuesday'],
						[3, 'Wednesday'],
						[4, 'Thursday'],
						[5, 'Friday'],
						[6, 'Saturday']
					]
				}),
				valueField:'id',
				displayField:'privGroup'
			});
			
			var today = new Date();  // defaults to today

			var dateF = {
				id: 'singular_date',
				xtype: 'datefield',
				anchor: '100%',
				fieldLabel: 'Date',
				name: 'to_date',
				format: 'd-m-Y',
				//minValue: today,
				value: today
			}
			
			var daily_timebox = { // time
									xtype: 'cp4_timebox',
									id: 'day_job',
									width: 200
								};
			var weekly_timebox = { // time
									xtype: 'cp4_timebox',
									id: 'week_job',
									width: 200
								};
			var monthly_timebox = { // time
									xtype: 'cp4_timebox',
									id: 'month_job',
									width: 200
								};
			var singular_timebox = { // time
									xtype: 'cp4_timebox',
									id: 'singular_job',
									width: 200
								};
			
			//Add form
			var policyForm = Ext.create('CP.WebUI4.FormPanel',{
				bodyPadding: 10,
				id: 'policy_form',
				items: [{
					layout: 'column',
					items:[
						{
							// ~~~ LEFT COLUMN
							xtype: 'cp4_panel',
							columnWidth: .20,
							bodyPadding: 10,
							items: [
								{
									xtype: 'cp4_radio',
									boxLabel: 'Daily', 
									name: 'cb_custwidth', 
									checked: true,
									id: 'cb_daily',
									inputValue: 1, 
									handler: function() {
										CP.SUConf.changeOccurMode(Ext.getCmp('cb_daily'), 'add_daily_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Weekly', 
									name: 'cb_custwidth',
									id: 'cb_weekly',
									inputValue: 2, 
									handler: function() {
										CP.SUConf.changeOccurMode(Ext.getCmp('cb_weekly'), 'add_weekly_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Monthly', 
									name: 'cb_custwidth', 
									id: 'cb_monthly',
									inputValue: 3, 
									handler: function() {
										CP.SUConf.changeOccurMode(Ext.getCmp('cb_monthly'), 'add_monthly_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Once', 
									name: 'cb_custwidth', 
									id: 'cb_singular',
									inputValue: 4, 
									handler: function() {
										CP.SUConf.changeOccurMode(Ext.getCmp('cb_singular'), 'singular_panel');
									}
								}
							]
						},{
							// ~~~ MIDDLE COLUMN
							xtype: 'cp4_panel',
							width: 10,
							height: 110,
							cls: 'cron-job-seperator',
							html: '&nbsp;'
						},{
							// ~~~ RIGHT COLUMN
							xtype: 'cp4_panel',
							columnWidth: .76,
							bodyPadding: 10,
							items:[
								{
									xtype: 'cp4_panel',
									id: 'add_daily_occur_panel',
									bodyPadding: 10,
									items: [ daily_timebox ]
								},{
									xtype: 'cp4_panel',
									id: 'add_weekly_occur_panel',
									bodyPadding: 10,
									hidden: true,
									items: [
										weekly_timebox,
										dayOfWeekLC // day of week
									]
								},{
									xtype: 'cp4_panel',
									id: 'add_monthly_occur_panel',
									bodyPadding: 10,
									hidden: true,
									items: [
										monthly_timebox,
										dayOfMonthLC // day of month
									]
								},{
									xtype: 'cp4_panel',
									id: 'singular_panel',
									bodyPadding: 10,
									hidden: true,
									items: [
										singular_timebox,
										dateF
									]
								}
							]
						}
					]
				}],
				//Save and cancel buttons
				buttons: [{
					id: CP.SUConf.OK_BTN,
					text: 'OK',
					xtype: 'cp4_button',
					schedule: schedule_type
					// handler will be added later
				},{
					id: CP.SUConf.CANCEL_BTN,
					text: 'Cancel',
					xtype: 'cp4_button',
					handler: function() {
						Ext.getCmp('add_job_window').close();
						CP.SUConf.doLoad(Ext.getCmp(CP.SUConf.PANEL_ID));
					}
				}]
			});
			
			//Modal window for add, edit
			modalWin = Ext.create('CP.WebUI4.ModalWin',{
				id: 'add_job_window',
				name: 'add_job_window',
				width: 500,
				height: 200,
				title: '', // title will be added later
				items: [ policyForm ]
			});

			//default selection
			Ext.getCmp('cb_daily').setValue(true);
		}
		Ext.getCmp(CP.SUConf.OK_BTN).schedule = schedule_type;
		return modalWin;
	}
	
	,insertTime: function(schedule_type) {
		Ext.Ajax.request({ // Getting the machine's current time
			url: '/cgi-bin/time.tcl',
			method: 'GET',
			success: function(response) {
				Ext.getCmp('day_job').getHoursField().allowBlank = false;
				Ext.getCmp('day_job').getMinutesField().allowBlank = false;
				Ext.getCmp('week_job').getHoursField().allowBlank = false;
				Ext.getCmp('week_job').getMinutesField().allowBlank = false;
				Ext.getCmp('month_job').getHoursField().allowBlank = false;
				Ext.getCmp('month_job').getMinutesField().allowBlank = false;
				Ext.getCmp('singular_job').getHoursField().allowBlank = false;
				Ext.getCmp('singular_job').getMinutesField().allowBlank = false;

				var jsonData = Ext.decode(response.responseText);
				var cur_time = (jsonData.data.clock_time).split(":"); // hour:minute:second
				var cur_date = (jsonData.data.clock_date).split("-"); // year-month-day

				if ((schedule_type == CP.SUConf.D_RADIO) && (CP.SUConf.D_SCHEDULE_TIME)) { // download schedule was loaded, put the correct times in
					// setting the preceding zero for the loaded time's hours and minutes fields
					var hoursPreZero = (CP.SUConf.D_SCHED_HOURS < 10)?"0":"";
					var minutesPreZero = (CP.SUConf.D_SCHED_MINUTES < 10)?"0":"";
					
					if (CP.SUConf.D_SCHED_TYPE == 'daily') {
						Ext.getCmp('day_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUConf.D_SCHED_HOURS, 10));
						Ext.getCmp('day_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUConf.D_SCHED_MINUTES, 10));
					}

					if (CP.SUConf.D_SCHED_TYPE == 'weekly') {
						Ext.getCmp('day_of_week_lc').setValue(CP.SUConf.getWeekdayNum(CP.SUConf.D_SCHED_WEEKDAYS));
						Ext.getCmp('week_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUConf.D_SCHED_HOURS, 10));
						Ext.getCmp('week_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUConf.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_weekly').setValue(true);
					}
					if (CP.SUConf.D_SCHED_TYPE == 'monthly') {
						Ext.getCmp('days_of_month_lc').setValue(parseInt(CP.SUConf.D_SCHED_MONTHDAYS, 10));
						Ext.getCmp('month_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUConf.D_SCHED_HOURS, 10));
						Ext.getCmp('month_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUConf.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_monthly').setValue(true);
					}				
					if (CP.SUConf.D_SCHED_TYPE == 'singular') {
						var dateF = Ext.getCmp('singular_date');
						var newDate = CP.SUConf.getMonthNum(CP.SUConf.D_SCHED_MONTHS)+'/'+CP.SUConf.D_SCHED_MONTHDAYS+'/'+CP.SUConf.D_SCHED_YEAR;
						dateF.setValue(newDate);
						Ext.getCmp('singular_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUConf.D_SCHED_HOURS, 10));
						Ext.getCmp('singular_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUConf.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_singular').setValue(true);
					}
				}
				
				// setting the preceding zero for the current time's hours and minutes fields
				var hoursPreZero = (cur_time[0] < 10)?"0":"";
				var minutesPreZero = (cur_time[1] < 10)?"0":"";
				
				if (!((schedule_type == CP.SUConf.D_RADIO) && CP.SUConf.D_SCHEDULE_TIME && (CP.SUConf.D_SCHED_TYPE == 'daily')) && !((schedule_type == CP.SUConf.I_RADIO) && CP.SUConf.I_SCHEDULE_TIME && (CP.SUConf.I_SCHED_TYPE == 'daily'))) {
					// setting the time boxes to show the current time
					Ext.getCmp('day_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('day_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				
				if (!((schedule_type == CP.SUConf.D_RADIO) && CP.SUConf.D_SCHEDULE_TIME && (CP.SUConf.D_SCHED_TYPE == 'monthly')) && !((schedule_type == CP.SUConf.I_RADIO) && CP.SUConf.I_SCHEDULE_TIME && (CP.SUConf.I_SCHED_TYPE == 'monthly'))) {
					Ext.getCmp('days_of_month_lc').setValue(cur_date[2]);
					Ext.getCmp('month_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('month_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				var dateF = Ext.getCmp('singular_date');
				var curDate = cur_date[1]+'/'+cur_date[2]+'/'+cur_date[0];
				if (!((schedule_type == CP.SUConf.D_RADIO) && CP.SUConf.D_SCHEDULE_TIME && (CP.SUConf.D_SCHED_TYPE == 'singular')) && !((schedule_type == CP.SUConf.I_RADIO) && CP.SUConf.I_SCHEDULE_TIME && (CP.SUConf.I_SCHED_TYPE == 'singular'))) {
					dateF.setValue(curDate);
					Ext.getCmp('singular_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('singular_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				dateF.setMinValue(curDate); // don't allow setting dates before today
				var maxDate=new Date(curDate);
				maxDate.setFullYear(maxDate.getFullYear() + 50); // don't allow setting dates that are more than 50 years from today
				dateF.setMaxValue(maxDate);
				if (!((schedule_type == CP.SUConf.D_RADIO) && CP.SUConf.D_SCHEDULE_TIME && (CP.SUConf.D_SCHED_TYPE == 'weekly')) && !((schedule_type == CP.SUConf.I_RADIO) && CP.SUConf.I_SCHEDULE_TIME && (CP.SUConf.I_SCHED_TYPE == 'weekly'))) {
					Ext.getCmp('day_of_week_lc').setValue(dateF.getValue().getDay());
					Ext.getCmp('week_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('week_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
			}
		});
	}

	,changeOccurMode: function( oCB, panelId ) {
		if( oCB.getValue() == false ) {
			return;
		}
		//Hide all
		Ext.getCmp( 'add_daily_occur_panel' ).hide();
		Ext.getCmp( 'add_weekly_occur_panel' ).hide();
		Ext.getCmp( 'add_monthly_occur_panel' ).hide();
		Ext.getCmp( 'singular_panel' ).hide();
		//Show selected
		Ext.getCmp( panelId ).show();
	}


 
	,popupMessage: function(message, title, delay) {
		// shows a pop-up message
		CP.util.setCustomStatMsg(message,true);
	}
	
	,getMonthNum: function(monthStr) {
		var ret="";
		switch (monthStr) {
			case "January": { ret = "1" } break;
			case "February": { ret = "2" } break;
			case "March": { ret = "3" } break;
			case "April": { ret = "4" } break;
			case "May": { ret = "5" } break;
			case "June": { ret = "6" } break;
			case "July": { ret = "7" } break;
			case "August": { ret = "8" } break;
			case "September": { ret = "9" } break;
			case "October": { ret = "10" } break;
			case "November": { ret = "11" } break;
			case "December": { ret = "12" } break;
		}
		return ret;
	}
	
	,getWeekdayNum: function(weekdayStr) {
		var ret = "";
		switch (weekdayStr) {
			case "Sunday": { ret = "0" } break;
			case "Monday": { ret = "1" } break;
			case "Tuesday": { ret = "2" } break;
			case "Wednesday": { ret = "3" } break;
			case "Thursday": { ret = "4" } break;
			case "Friday": { ret = "5" } break;
			case "Saturday": { ret = "6" } break;
			default: { ret = "0" } break;
		}
		return ret;
	}
	
	,submitData: function(policyChanged) {
		var page = Ext.getCmp(CP.SUConf.PANEL_ID).getForm();
		if (!page) {
			return;
		}
		var myparams = {};
		//myparams["legacy_display"] = Ext.getCmp('do_dl').getValue(); (removed due to CR01476179)
		myparams["gwstat"] = Ext.getCmp('gwstat_cb').getValue();
		myparams["force_maj"] = Ext.getCmp('force_maj_cb').getValue();
		myparams["auto_download"] = Ext.getCmp('auto_download_cb').getValue();
		myparams["sanity_proc"] = Ext.getCmp('st_proc').getValue();
		myparams["sanity_install_policy"] = Ext.getCmp('st_pi').getValue();
		myparams["sanity_network_access"] = Ext.getCmp('st_na').getValue();
		var check_for_updates_period_hours = Ext.getCmp('check_for_updates_period_slider').getValue();
		if (check_for_updates_period_hours != 0) {
			myparams["check_for_updates_period"] = check_for_updates_period_hours * 3600;
			myparams["check_for_updates_status"] = CP.SUConf.CHECK_FOR_UPDATES_ENABLED;
		} else {
			myparams["check_for_updates_status"] = CP.SUConf.CHECK_FOR_UPDATES_DISABLED;
		}
		
		if (policyChanged) {
			
			myparams["d_radio"]=page.getValues()[CP.SUConf.D_RADIO];
			
			// assigning the schedule parameters for the tcl
			if (page.getValues()[CP.SUConf.D_RADIO]==CP.SUConf.SCHEDULE) {
				myparams["d_stype"]=CP.SUConf.D_SCHED_TYPE;
				switch (CP.SUConf.D_SCHED_TYPE) {
					case "weekly": { myparams["d_weekdays"]=CP.SUConf.getWeekdayNum(CP.SUConf.D_SCHED_WEEKDAYS) } break;
					case "monthly": { myparams["d_monthdays"]=CP.SUConf.D_SCHED_MONTHDAYS } break;
					case "singular": { 
						myparams["d_monthdays"]=CP.SUConf.D_SCHED_MONTHDAYS;
						myparams["d_months"]=CP.SUConf.getMonthNum(CP.SUConf.D_SCHED_MONTHS);
						myparams["d_year"]=CP.SUConf.D_SCHED_YEAR;
					} break;
				}
				myparams["d_minutes"]=parseInt(CP.SUConf.D_SCHED_MINUTES, 10);
				myparams["d_hours"]=parseInt(CP.SUConf.D_SCHED_HOURS, 10);
			}
		}
		
		Ext.Ajax.request({
			url: CP.SUConf.POLICY_SUBMIT_URL,
			method: "POST",
			params: myparams,
			success: function() {
				CP.SUConf.popupMessage("Policy Settings Saved",1500);
				if (page.getValues()[CP.SUConf.D_RADIO] == CP.SUConf.SCHEDULE) {
					CP.SUConf.D_SCHEDULE_TIME = true;
				} else {
					CP.SUConf.D_SCHEDULE_TIME = false;
				}
				CP.util.clearFormInstanceDirtyFlag(page); 
			}
		});
		
		var data = {
			d_radio: page.getValues()[CP.SUConf.D_RADIO],
			d_stype: CP.SUConf.D_SCHED_TYPE,
			d_weekdays: CP.SUConf.D_SCHED_WEEKDAYS,
			d_monthdays: CP.SUConf.D_SCHED_MONTHDAYS,
			d_months: CP.SUConf.D_SCHED_MONTHS,
			d_year: CP.SUConf.D_SCHED_YEAR,
			d_minutes: parseInt(CP.SUConf.D_SCHED_MINUTES, 10),
			d_hours: parseInt(CP.SUConf.D_SCHED_HOURS, 10)
		};
		CP.SUConf.updateMessage(data);
	}
  
  	,buttonPressed: function(button, event) {
		// handler for button presses
		if (button.id == CP.SUConf.SAVE_BTN) {
			Ext.getCmp(CP.SUConf.SAVE_BTN).disable();
			CP.SUConf.submitData(true);
		}
		
		if (button.id == CP.SUConf.D_EDIT_BTN) {
			CP.SUConf.D_SCHEDULE_TIME = true;
			Ext.getCmp(CP.SUConf.SAVE_BTN).enable();
			CP.SUConf.scheduleWindow(CP.SUConf.D_RADIO);
		}
				
		if (button.id == CP.SUConf.DISCARD_BTN) {
			CP.SUConf.doLoad(Ext.getCmp(CP.SUConf.PANEL_ID));
		}
		
		if (button.id == CP.SUConf.EXPORT_BTN) {
			location.href = _sstr+"/cgi-bin/download_dashboard.tcl?file=policy.xml";
		}
		
		var table = Ext.getCmp(CP.SUConf.GRID_ID);
		if (!table) {
			return;
		}
		if (button.id == CP.SUConf.DELETE_BTN) {
			// delete the selected user
			var selectedRecord = Ext.getCmp(CP.SUConf.GRID_ID).getSelectionModel().getLastSelected();
			Ext.Ajax.request({
				url : CP.SUConf.MAIL_SUBMIT_URL,
				method : 'POST',
				params: {
					delete_user: 1,
					address: selectedRecord.data.address
				},
				success : function() {
					Ext.getCmp(CP.SUConf.GRID_ID).getStore().load();
					if (Ext.getCmp(CP.SUConf.GRID_ID).getStore().data.length == 1) //we removed the last entry
					{
						Ext.getCmp(CP.SUConf.NOTIFICATIONS).hide(); 
					}
				}
			});
		}
		if (button.id == CP.SUConf.ADD_BTN) {
			// add a new user
			CP.SUConf.addUser();
		}
	}
	
	,enableSaveButton: function() {
		Ext.getCmp(CP.SUConf.SAVE_BTN).enable();
	}
	
	,saveHandler: function() {
		var myparams = {
			address: Ext.getCmp('add_user_address').getRawValue(),
			available: Ext.getCmp('add_user_available').getRawValue(),
			d_status: Ext.getCmp('add_user_d_status').getRawValue(),
			i_status: Ext.getCmp('add_user_i_status').getRawValue()
		};
		Ext.Ajax.request({
            url : CP.SUConf.MAIL_SUBMIT_URL,
            method : 'POST',
			params: myparams,
            success : function() {
				Ext.getCmp('mail_modal_win').close();
				Ext.getCmp(CP.SUConf.GRID_ID).getStore().load();
               // CP.UI.updateDataPanel(Ext.getCmp(CP.SUConf.PAGE_ID));
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
						CP.SUConf.saveHandler();
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
	
}