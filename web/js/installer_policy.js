// Copyright Check Point

// PING Installer - display packages available to download, available to install, and installed packages. Initiate download, install or uninstall.

CP.SUPolicy = {
	
	DEBUG: false,
	
	isDArunning: false,
	DAwarning_shown: false,
	
	UI_Changed: true,
	
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

	SUBMIT_URL: "/cgi-bin/installer_policy.tcl",
	
	// init: builds the page
	init:function() {
	
		var title = {
			xtype: "cp4_sectiontitle",
			titleText: "Software Deployment Policy"
		};

		var d_editBtn = Ext.create('CP.WebUI4.Button',{
			tooltip: 'Click to edit Download Scheduling',
			id: CP.SUPolicy.D_EDIT_BTN,
			icon: '../images/icons/edit.gif',
			width: 20,
			height: 20,
			padding: '0 0 0 0',
			hidden: true,
			handler: CP.SUPolicy.buttonPressed
		});

		var d_btn = Ext.create('Ext.container.Container', {
			padding: '23 0 0 5',
			items: [ d_editBtn ]
		});
					
		var buttonsBar = {
			xtype: 'cp4_btnsbar',
			items: [
				{
					id: CP.SUPolicy.SAVE_BTN,
					text: "Apply",
					disabled: true,
					handler: CP.SUPolicy.buttonPressed
				}
			]
		};
		
		var D_radio = {
			id: CP.SUPolicy.D_RADIO_ID,
			xtype: "cp4_radiogroup",
			fieldLabel: "Download Hotfixes",
			labelWidth: 143,
			columns: 1,
			width: 220,
			items: [
				{
					id: 'd_manual',
					boxLabel: "Manually",
					inputValue: CP.SUPolicy.MANUAL,
					name: CP.SUPolicy.D_RADIO/*,
					listeners: {
						change: function(radiogroup, newvalue, oldvalue, e) {
							if (newvalue && !oldvalue && (!CP.SUPolicy.DONT_SUBMIT)) {
								CP.SUPolicy.submitData(true);
							}
						}
					}*/

				},
				{
					id: 'd_schedule',
					boxLabel: "Scheduled",
					inputValue: CP.SUPolicy.SCHEDULE,
					name: CP.SUPolicy.D_RADIO,
					listeners: {
						change: function(radio, newvalue, oldvalue, e) {
							var editBtn = Ext.getCmp(CP.SUPolicy.D_EDIT_BTN);
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
							if (CP.SUPolicy.D_SCHEDULE_LOADED) {
								// schedule was loaded from database, don't open the schedule window this time
								CP.SUPolicy.D_SCHEDULE_LOADED = false;
								return;
							}
							if (newvalue) {
								// open a schedule window
								CP.SUPolicy.scheduleWindow(CP.SUPolicy.D_RADIO);
							}
						}
					}
				},
				{
					id: 'd_automatic',
					boxLabel: "Automatic",
					inputValue: CP.SUPolicy.AUTOMATIC,
					name: CP.SUPolicy.D_RADIO/*,
					listeners: {
						change: function(radiogroup, newvalue, oldvalue, e) {
							if (newvalue && !oldvalue && (!CP.SUPolicy.DONT_SUBMIT)) {
								CP.SUPolicy.submitData(true);
							}
						}
					}*/

				}
			],
			listeners: {
				change: function() {
					CP.SUPolicy.enableSaveButton();
				}
			}
		};	
		
		var D_msg = {
			xtype: 'cp4_container',
			id: 'd_msg',
			html: CP.SUPolicy.D_SCHEDULE,
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
					if (!CP.SUPolicy.DONT_SUBMIT) {
						CP.SUPolicy.submitData(false);
					}
				}
			}*/
		});
		
		var GWstat_cb = Ext.create('CP.WebUI4.Checkbox', {
			boxLabel: "Send download and installation data of Software Updates to Check Point",
			id: 'gwstat_cb',
			listeners: {
				change: function() {
					CP.SUPolicy.enableSaveButton();
				}
			}
		});
			
		var autoDownload_cb = Ext.create('CP.WebUI4.Checkbox', {
			boxLabel: "Periodically update new Deployment Agent version (recommended)",
			id: 'auto_download_cb',
			listeners: {
				change: function() {
					CP.SUPolicy.enableSaveButton();
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
					CP.SUPolicy.enableSaveButton();
				}
			}
		});
		
		var checkForUpdatesStatusPanel = Ext.create('CP.WebUI4.DisplayField', {
			value: CP.SUPolicy.CHECK_FOR_UPDATES_PERIOD_DEFAULT + ' hours',
			width: 100,
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
							CP.SUPolicy.enableSaveButton();
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
							CP.SUPolicy.enableSaveButton();
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
							CP.SUPolicy.enableSaveButton();
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
		
		var policyPanel = Ext.create('CP.WebUI4.DataFormPanel',{
			id: "policy_panel",
			labelWidth: 150,
			height: 700,
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
				buttonsBar
			],
			listeners: {
				render: CP.SUPolicy.doLoad
			}
		});
		
		var page = {
			id: 'policy_page',
			title: "Updates Policy Editor",
			panel: policyPanel,
			submit:true,
			discard:false,
			submitURL: CP.SUPolicy.SUBMIT_URL,
			afterSubmit: CP.SUPolicy.afterSubmit,
			params:{}
		};
		
		CP.UI.updateDataPanel(page);
		
	} // end of function init
	
	,afterSubmit: function(form, action) {
		//reload the page
		CP.SUPolicy.doLoad(Ext.getCmp("policy_panel"));
	}
	
	,updateMessage: function(data) {
		var d_hoursPreZero = (data.d_hours < 10)?"0":"";
		var d_minutesPreZero = (data.d_minutes < 10)?"0":"";

		if (data.d_radio == CP.SUPolicy.SCHEDULE) {			
			var type = "Every Day, at ";
			
			CP.SUPolicy.D_SCHED_TYPE = data.d_stype;
			CP.SUPolicy.D_SCHED_HOURS = d_hoursPreZero + parseInt(data.d_hours, 10);
			CP.SUPolicy.D_SCHED_MINUTES = d_minutesPreZero + parseInt(data.d_minutes, 10);
			
			CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_HOURS + ":" + CP.SUPolicy.D_SCHED_MINUTES;
			if (data.d_stype == "weekly") {
				type = "Every Week, on ";
				switch (data.d_weekdays) {
					case 0: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Sunday" } break; 
					case 1: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Monday" } break; 
					case 2: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Tuesday" } break; 
					case 3: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Wednesday" } break; 
					case 4: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Thursday" } break; 
					case 5: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Friday" } break; 
					case 6: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Saturday" } break;
					default: { CP.SUPolicy.D_SCHED_WEEKDAYS = data.d_weekdays } break;
				}
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_WEEKDAYS + ", at " + CP.SUPolicy.D_SCHED_HOURS + ":" + CP.SUPolicy.D_SCHED_MINUTES;
			}
			if (data.d_stype == "monthly") {
				type = "Every Month, on the ";
				CP.SUPolicy.D_SCHED_MONTHDAYS = data.d_monthdays;
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
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_MONTHDAYS + postfix + ", at " + CP.SUPolicy.D_SCHED_HOURS + ":" + CP.SUPolicy.D_SCHED_MINUTES;
			}
			if (data.d_stype == "singular") {
				type = "Once, at "
				CP.SUPolicy.D_SCHED_MONTHDAYS = data.d_monthdays;
				CP.SUPolicy.D_SCHED_YEAR = data.d_year;
				switch (data.d_months) {
					case 1: { CP.SUPolicy.D_SCHED_MONTHS = "January" } break; 
					case 2: { CP.SUPolicy.D_SCHED_MONTHS = "February" } break; 
					case 3: { CP.SUPolicy.D_SCHED_MONTHS = "March" } break; 
					case 4: { CP.SUPolicy.D_SCHED_MONTHS = "April" } break; 
					case 5: { CP.SUPolicy.D_SCHED_MONTHS = "May" } break; 
					case 6: { CP.SUPolicy.D_SCHED_MONTHS = "June" } break; 
					case 7: { CP.SUPolicy.D_SCHED_MONTHS = "July" } break; 
					case 8: { CP.SUPolicy.D_SCHED_MONTHS = "August" } break; 
					case 9: { CP.SUPolicy.D_SCHED_MONTHS = "September" } break; 
					case 10: { CP.SUPolicy.D_SCHED_MONTHS = "October" } break; 
					case 11: { CP.SUPolicy.D_SCHED_MONTHS = "November" } break; 
					case 12: { CP.SUPolicy.D_SCHED_MONTHS = "December" } break;
				}
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_MONTHS + " " + CP.SUPolicy.D_SCHED_MONTHDAYS + ", on " + CP.SUPolicy.D_SCHED_YEAR + ", at " + CP.SUPolicy.D_SCHED_HOURS + ":" + CP.SUPolicy.D_SCHED_MINUTES;
			}
		}
		Ext.getCmp('d_msg').update(CP.SUPolicy.D_SCHEDULE);
	}
	
	,doLoad: function(formPanel) {
		// Load the policy configuration from the database
		CP.SUPolicy.D_SCHEDULE_LOADED = true;
		
		CP.SUPolicy.DONT_SUBMIT=true;
		formPanel.load({
			url: CP.SUPolicy.SUBMIT_URL,
			method: 'GET',
			success: function (form,action) {
				var info = Ext.decode(action.response.responseText);
				if (info.data.d_radio == CP.SUPolicy.SCHEDULE) {
					CP.SUPolicy.D_SCHEDULE_TIME = true;
					Ext.getCmp('d_msg').show();
				} else {
					CP.SUPolicy.D_SCHEDULE_LOADED = false;
					CP.SUPolicy.D_SCHEDULE_TIME = false;
					Ext.getCmp('d_msg').hide();
				}
				
				//Ext.getCmp('do_dl').setValue(info.data.legacy_display); //do_dl = displayOptions_display_legacy (removed due to CR01476179)
				Ext.getCmp('gwstat_cb').setValue(info.data.gw_stat);
				Ext.getCmp('force_maj_cb').setValue(info.data.force_maj);
				Ext.getCmp('auto_download_cb').setValue(info.data.auto_download);
				Ext.getCmp('st_proc').setValue(info.data.sanity_proc);
				Ext.getCmp('st_pi').setValue(info.data.sanity_install_policy);
				Ext.getCmp('st_na').setValue(info.data.sanity_network_access);
				CP.SUPolicy.DONT_SUBMIT=false;
				CP.SUPolicy.updateMessage(info.data);
				
				var checkForUpdatesPeriodSlider = Ext.getCmp('check_for_updates_period_slider');
				if (info.data.check_for_updates_status == CP.SUPolicy.CHECK_FOR_UPDATES_DISABLED) {
					checkForUpdatesPeriodSlider.setValue(0);
				} else if (info.data.check_for_updates_period != "" && info.data.check_for_updates_status != "") {
					checkForUpdatesPeriodSlider.setValue(info.data.check_for_updates_period / 3600);
				}
				
				Ext.getCmp(CP.SUPolicy.SAVE_BTN).disable();
			},
			failure: function() {
				console.log("Loading of policy data failed!");
			}
		});
	}
	
	,onSaveAdd: function(button, event) {
		// save the schedule data
		button.removeListener('click',CP.SUPolicy.onSaveAdd);
		var winObj = Ext.getCmp('add_job_window');
		
		var scheduling = {};
		if (!winObj || !CP.SUPolicy.getSchedulingToSend(scheduling)) {
			button.addListener('click',CP.SUPolicy.onSaveAdd);
			return;
		}
		
		// save the scheduling data
		var type = "Every Day, at ";
		var weekdays = "";
		var monthdays = "";
		var months = "";
		
		var hoursPreZero = (scheduling.hours < 10)?"0":"";
		var minutesPreZero = (scheduling.minutes < 10)?"0":"";

		if (button.schedule == CP.SUPolicy.D_RADIO) {
			CP.SUPolicy.D_SCHEDULE_LOADED = false;
			
			CP.SUPolicy.D_SCHED_TYPE = scheduling.type;
			CP.SUPolicy.D_SCHED_HOURS = hoursPreZero + scheduling.hours;
			CP.SUPolicy.D_SCHED_MINUTES = minutesPreZero + scheduling.minutes;	
			
			if (scheduling.type == "weekly") {
				type = "Every Week, on ";
				switch (scheduling.daysinweek) {
					case 0: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Sunday" } break; 
					case 1: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Monday" } break; 
					case 2: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Tuesday" } break; 
					case 3: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Wednesday" } break; 
					case 4: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Thursday" } break; 
					case 5: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Friday" } break; 
					case 6: { CP.SUPolicy.D_SCHED_WEEKDAYS = "Saturday" } break; 
				}
			}
			else if (scheduling.type == "monthly") {
				type = "Every Month, on the ";
				CP.SUPolicy.D_SCHED_MONTHDAYS = scheduling.daysinmonth;
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
				CP.SUPolicy.D_SCHED_MONTHDAYS = scheduling.daysinmonth.toString();
				/*var len = scheduling.daysinmonth.length;
				for (i=0;i<len;i++) {
					monthdays = monthdays + scheduling.daysinmonth[i];
				}*/
				
				/*len = scheduling.months.length;
				for (i=0;i<len;i++) {*/
				switch (scheduling.months) {
					case 1: { CP.SUPolicy.D_SCHED_MONTHS = "January" } break; 
					case 2: { CP.SUPolicy.D_SCHED_MONTHS = "February" } break; 
					case 3: { CP.SUPolicy.D_SCHED_MONTHS = "March" } break; 
					case 4: { CP.SUPolicy.D_SCHED_MONTHS = "April" } break; 
					case 5: { CP.SUPolicy.D_SCHED_MONTHS = "May" } break; 
					case 6: { CP.SUPolicy.D_SCHED_MONTHS = "June" } break; 
					case 7: { CP.SUPolicy.D_SCHED_MONTHS = "July" } break; 
					case 8: { CP.SUPolicy.D_SCHED_MONTHS = "August" } break; 
					case 9: { CP.SUPolicy.D_SCHED_MONTHS = "September" } break; 
					case 10: { CP.SUPolicy.D_SCHED_MONTHS = "October" } break; 
					case 11: { CP.SUPolicy.D_SCHED_MONTHS = "November" } break; 
					case 12: { CP.SUPolicy.D_SCHED_MONTHS = "December" } break; 
					//case ",": { months = months + ", " } break; 
				}
				//}
				//CP.SUPolicy.D_SCHED_MONTHS = scheduling.months;
				CP.SUPolicy.D_SCHED_YEAR = scheduling.year.toString();
			}
			if (scheduling.type == "weekly") {
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_WEEKDAYS + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "monthly") {
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_MONTHDAYS + postfix + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "singular") {
				CP.SUPolicy.D_SCHEDULE = type + CP.SUPolicy.D_SCHED_MONTHS + " " + CP.SUPolicy.D_SCHED_MONTHDAYS + ", on " + CP.SUPolicy.D_SCHED_YEAR + ", at " + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			else if (scheduling.type == "daily") {
				CP.SUPolicy.D_SCHEDULE = type + hoursPreZero + scheduling.hours + ":" + minutesPreZero + scheduling.minutes;
			}
			Ext.getCmp('d_msg').update(CP.SUPolicy.D_SCHEDULE);
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
			result = ( CP.SUPolicy.getTimeFromBox('day_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_weekly').getValue()) {
			//weekly 
			scheduling.type = "weekly";
			scheduling.daysinweek = Ext.getCmp('day_of_week_lc').getValue();
			if ((scheduling.daysinweek == undefined) || (scheduling.daysinweek < 0) || (scheduling.daysinweek > 6))
				result = false;
			result = ( CP.SUPolicy.getTimeFromBox('week_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_monthly').getValue()) {
			//monthly
			scheduling.type = "monthly";
			//scheduling.months = Ext.getCmp('months_lc').getValue();
			//result = (result && scheduling.months);
			scheduling.daysinmonth = Ext.getCmp('days_of_month_lc').getValue();
			result = (result && scheduling.daysinmonth);
			result = ( CP.SUPolicy.getTimeFromBox('month_job', scheduling) && result );
		}
		else if (Ext.getCmp('cb_singular').getValue()) {
			//singular
			scheduling.type = "singular";
			if (!(Ext.getCmp('singular_date').validate()))
				return false;
			result = ( CP.SUPolicy.getTimeFromBox('singular_job', scheduling) && result );
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
		// display the schecdule window
		var title = "";
		
		if (radiogroup == CP.SUPolicy.D_RADIO) {
			title = "Schedule Downloads";
		}
		
		var winObj = CP.SUPolicy.getModalWindow(radiogroup);
		if( !winObj ) {
			return;
		}
		CP.SUPolicy.insertTime(radiogroup);
		
		Ext.getCmp(CP.SUPolicy.OK_BTN).addListener('click',CP.SUPolicy.onSaveAdd);
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
										CP.SUPolicy.changeOccurMode(Ext.getCmp('cb_daily'), 'add_daily_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Weekly', 
									name: 'cb_custwidth',
									id: 'cb_weekly',
									inputValue: 2, 
									handler: function() {
										CP.SUPolicy.changeOccurMode(Ext.getCmp('cb_weekly'), 'add_weekly_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Monthly', 
									name: 'cb_custwidth', 
									id: 'cb_monthly',
									inputValue: 3, 
									handler: function() {
										CP.SUPolicy.changeOccurMode(Ext.getCmp('cb_monthly'), 'add_monthly_occur_panel');
									}
								},{
									xtype: 'cp4_radio',
									boxLabel: 'Once', 
									name: 'cb_custwidth', 
									id: 'cb_singular',
									inputValue: 4, 
									handler: function() {
										CP.SUPolicy.changeOccurMode(Ext.getCmp('cb_singular'), 'singular_panel');
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
					id: CP.SUPolicy.OK_BTN,
					text: 'OK',
					xtype: 'cp4_button',
					schedule: schedule_type
					// handler will be added later
				},{
					id: CP.SUPolicy.CANCEL_BTN,
					text: 'Cancel',
					xtype: 'cp4_button',
					handler: function() {
						Ext.getCmp('add_job_window').close();
						CP.SUPolicy.doLoad(Ext.getCmp("policy_panel"));
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
		Ext.getCmp(CP.SUPolicy.OK_BTN).schedule = schedule_type;
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

				if ((schedule_type == CP.SUPolicy.D_RADIO) && (CP.SUPolicy.D_SCHEDULE_TIME)) { // download schedule was loaded, put the correct times in
					// setting the preceding zero for the loaded time's hours and minutes fields
					var hoursPreZero = (CP.SUPolicy.D_SCHED_HOURS < 10)?"0":"";
					var minutesPreZero = (CP.SUPolicy.D_SCHED_MINUTES < 10)?"0":"";
					
					if (CP.SUPolicy.D_SCHED_TYPE == 'daily') {
						Ext.getCmp('day_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUPolicy.D_SCHED_HOURS, 10));
						Ext.getCmp('day_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10));
					}

					if (CP.SUPolicy.D_SCHED_TYPE == 'weekly') {
						Ext.getCmp('day_of_week_lc').setValue(CP.SUPolicy.getWeekdayNum(CP.SUPolicy.D_SCHED_WEEKDAYS));
						Ext.getCmp('week_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUPolicy.D_SCHED_HOURS, 10));
						Ext.getCmp('week_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_weekly').setValue(true);
					}
					if (CP.SUPolicy.D_SCHED_TYPE == 'monthly') {
						Ext.getCmp('days_of_month_lc').setValue(parseInt(CP.SUPolicy.D_SCHED_MONTHDAYS, 10));
						Ext.getCmp('month_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUPolicy.D_SCHED_HOURS, 10));
						Ext.getCmp('month_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_monthly').setValue(true);
					}				
					if (CP.SUPolicy.D_SCHED_TYPE == 'singular') {
						var dateF = Ext.getCmp('singular_date');
						var newDate = CP.SUPolicy.getMonthNum(CP.SUPolicy.D_SCHED_MONTHS)+'/'+CP.SUPolicy.D_SCHED_MONTHDAYS+'/'+CP.SUPolicy.D_SCHED_YEAR;
						dateF.setValue(newDate);
						Ext.getCmp('singular_job').getHoursField().setValue(hoursPreZero + parseInt(CP.SUPolicy.D_SCHED_HOURS, 10));
						Ext.getCmp('singular_job').getMinutesField().setValue(minutesPreZero + parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10));
						Ext.getCmp('cb_daily').setValue(false);
						Ext.getCmp('cb_singular').setValue(true);
					}
				} else
				
				// setting the preceding zero for the current time's hours and minutes fields
				var hoursPreZero = (cur_time[0] < 10)?"0":"";
				var minutesPreZero = (cur_time[1] < 10)?"0":"";
				
				if (!((schedule_type == CP.SUPolicy.D_RADIO) && CP.SUPolicy.D_SCHEDULE_TIME && (CP.SUPolicy.D_SCHED_TYPE == 'daily')) && !((schedule_type == CP.SUPolicy.I_RADIO) && CP.SUPolicy.I_SCHEDULE_TIME && (CP.SUPolicy.I_SCHED_TYPE == 'daily'))) {
					// setting the time boxes to show the current time
					Ext.getCmp('day_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('day_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				
				if (!((schedule_type == CP.SUPolicy.D_RADIO) && CP.SUPolicy.D_SCHEDULE_TIME && (CP.SUPolicy.D_SCHED_TYPE == 'monthly')) && !((schedule_type == CP.SUPolicy.I_RADIO) && CP.SUPolicy.I_SCHEDULE_TIME && (CP.SUPolicy.I_SCHED_TYPE == 'monthly'))) {
					Ext.getCmp('days_of_month_lc').setValue(cur_date[2]);
					Ext.getCmp('month_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('month_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				var dateF = Ext.getCmp('singular_date');
				var curDate = cur_date[1]+'/'+cur_date[2]+'/'+cur_date[0];
				if (!((schedule_type == CP.SUPolicy.D_RADIO) && CP.SUPolicy.D_SCHEDULE_TIME && (CP.SUPolicy.D_SCHED_TYPE == 'singular')) && !((schedule_type == CP.SUPolicy.I_RADIO) && CP.SUPolicy.I_SCHEDULE_TIME && (CP.SUPolicy.I_SCHED_TYPE == 'singular'))) {
					dateF.setValue(curDate);
					Ext.getCmp('singular_job').getHoursField().setValue(hoursPreZero + cur_time[0]);
					Ext.getCmp('singular_job').getMinutesField().setValue(minutesPreZero + cur_time[1]);
				}
				dateF.setMinValue(curDate); // don't allow setting dates before today
				var maxDate=new Date(curDate);
				maxDate.setFullYear(maxDate.getFullYear() + 50); // don't allow setting dates that are more than 50 years from today
				dateF.setMaxValue(maxDate);
				if (!((schedule_type == CP.SUPolicy.D_RADIO) && CP.SUPolicy.D_SCHEDULE_TIME && (CP.SUPolicy.D_SCHED_TYPE == 'weekly')) && !((schedule_type == CP.SUPolicy.I_RADIO) && CP.SUPolicy.I_SCHEDULE_TIME && (CP.SUPolicy.I_SCHED_TYPE == 'weekly'))) {
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
		var page = Ext.getCmp("policy_panel").getForm();
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
			myparams["check_for_updates_status"] = CP.SUPolicy.CHECK_FOR_UPDATES_ENABLED;
		} else {
			myparams["check_for_updates_status"] = CP.SUPolicy.CHECK_FOR_UPDATES_DISABLED;
		}

		if (policyChanged) {	
			
			myparams["d_radio"]=page.getValues()[CP.SUPolicy.D_RADIO];
			
			// assigning the schedule parameters for the tcl
			if (page.getValues()[CP.SUPolicy.D_RADIO]==CP.SUPolicy.SCHEDULE) {
				myparams["d_stype"]=CP.SUPolicy.D_SCHED_TYPE;
				switch (CP.SUPolicy.D_SCHED_TYPE) {
					case "weekly": { myparams["d_weekdays"]=CP.SUPolicy.getWeekdayNum(CP.SUPolicy.D_SCHED_WEEKDAYS) } break;
					case "monthly": { myparams["d_monthdays"]=CP.SUPolicy.D_SCHED_MONTHDAYS } break;
					case "singular": { 
						myparams["d_monthdays"]=CP.SUPolicy.D_SCHED_MONTHDAYS;
						myparams["d_months"]=CP.SUPolicy.getMonthNum(CP.SUPolicy.D_SCHED_MONTHS);
						myparams["d_year"]=CP.SUPolicy.D_SCHED_YEAR;
					} break;
				}
				myparams["d_minutes"]=parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10);
				myparams["d_hours"]=parseInt(CP.SUPolicy.D_SCHED_HOURS, 10);
			}	
		}
		
		Ext.Ajax.request({
			url: CP.SUPolicy.SUBMIT_URL,
			method: "POST",
			params: myparams,
			success: function() {
				CP.SUPolicy.popupMessage("Policy Settings Saved",1500);
				if (page.getValues()[CP.SUPolicy.D_RADIO] == CP.SUPolicy.SCHEDULE) {
					CP.SUPolicy.D_SCHEDULE_TIME = true;
				} else {
					CP.SUPolicy.D_SCHEDULE_TIME = false;
				}
				CP.util.clearFormInstanceDirtyFlag(page); 
			}
		});
		
		var data = {
			d_radio: page.getValues()[CP.SUPolicy.D_RADIO],
			d_stype: CP.SUPolicy.D_SCHED_TYPE,
			d_weekdays: CP.SUPolicy.D_SCHED_WEEKDAYS,
			d_monthdays: CP.SUPolicy.D_SCHED_MONTHDAYS,
			d_months: CP.SUPolicy.D_SCHED_MONTHS,
			d_year: CP.SUPolicy.D_SCHED_YEAR,
			d_minutes: parseInt(CP.SUPolicy.D_SCHED_MINUTES, 10),
			d_hours: parseInt(CP.SUPolicy.D_SCHED_HOURS, 10)
		};
		CP.SUPolicy.updateMessage(data);
	}
  
	,enableSaveButton: function() {
		Ext.getCmp(CP.SUPolicy.SAVE_BTN).enable();
	}
	
  	,buttonPressed: function(button, event) {
		// handler for button presses
		
		if (button.id == CP.SUPolicy.SAVE_BTN) {
			Ext.getCmp(CP.SUPolicy.SAVE_BTN).disable();
			CP.SUPolicy.submitData(true);
		}
		
		if (button.id == CP.SUPolicy.D_EDIT_BTN) {
			CP.SUPolicy.D_SCHEDULE_TIME = true;
			CP.SUPolicy.scheduleWindow(CP.SUPolicy.D_RADIO);
			Ext.getCmp(CP.SUPolicy.SAVE_BTN).enable();
		}
		
		if (button.id == CP.SUPolicy.DISCARD_BTN) {
			CP.SUPolicy.doLoad(Ext.getCmp("policy_panel"));
		}
		
		if (button.id == CP.SUPolicy.EXPORT_BTN) {
			location.href = _sstr+"/cgi-bin/download_dashboard.tcl?file=policy.xml";
		}
	}
}