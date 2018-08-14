
CP.backup = {
/* Globals */
currentRadioSelectionID: null
,schedDataIndex: 'name'
,isMgmt : false
,restoreInProgress : false
,backupLocationText : "Backups location: "
,backupDir : ""
,backupPage:{
	title:"Backup"
	,submitURL:"/cgi-bin/backup.tcl"
	,params:{}
	,panel:null
}

,showProgressPopup : function(force,is_restore) {

	Ext.Ajax.request({
		url: "/cgi-bin/backup.tcl?operation=query-backup-progress"
		,method: "GET"
		,success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				CP.backup.isMgmt = (jsonData.isMgmt == "t");
				var status = decodeURIComponent(jsonData.data.status);
				status = status.replace(/\n/g, '<br />');
				var blockUI = (jsonData.blockUI == "t") || is_restore;
				var statusArr = status.split(" ");
				
				CP.backup.backupDir=jsonData.backupDir;
				
				var BackupDirTxt = Ext.getCmp("backup_dir_txt");
				if(BackupDirTxt) {
					BackupDirTxt.setTextAndType(CP.backup.backupLocationText + jsonData.backupDir,"info");
				}
								
				if (statusArr[0] == "Performing" || force == true){
				
					if(blockUI) {
						//supress all connection failure errors
						CP.global.supress_update_msg = 1;
						CP.global.isRebooting = true;
						CP.backup.restoreInProgress = true;
					}
				
					if(CP.global.backupProgressQueryTask == undefined) {
						CP.global.backupProgressQueryTask = {
							id: 'backup-progress-task',
							run: function () {
								/* if there is a backup in progress then call finishbackupmsg after the backup process has been completed
								   otherwise (restore) call showrebootdialog */
								CP.backup.sampleBackupFinished(statusArr[2].search("backup") == -1 ? CP.backup.showRebootDialog : CP.backup.finishBackupMsg);
							},
							interval: 5*1000
						};
						Ext.TaskManager.start(CP.global.backupProgressQueryTask);
					}
				
					var grid = Ext.getCmp("backup-grid-panel");
					var p_panel;
					
					if(blockUI == false) {
						//backup popup panel
						p_panel = Ext.create('CP.WebUI4.FormPanel',{
							bodyPadding: 15,
							items : [
							{
								xtype : 'cp4_displayfield',
								id : 'current_operation_status',
								fieldLabel: 'Status',
								width:300,
								value : ''
							},{
								xtype : 'cp4_displayfield',
								id : 'current_operation_step',
								fieldLabel: 'Step',
								width:300,
								value : ''
							},{
								xtype : 'cp4_progressbar',
								id : 'current_operation_progress',
								margin : '10 0 0 0'
							}]
						});
					} else {
						//restore popup panel
						p_panel = Ext.create('CP.WebUI4.FormPanel',{
							bodyPadding: 15,
							items : [
							{
								xtype : 'cp4_displayfield',
								id : 'current_operation_status',
								fieldLabel: 'Status',
								width:300,
								value : ''
							},{
								xtype : 'cp4_displayfield',
								id : 'current_operation_step',
								fieldLabel: 'Step',
								width:300,
								value : ''
							},{
								xtype : 'cp4_displayfield',
								fieldLabel: 'Backup File:',
								width:300,
								value : jsonData.restoreFile
							},{
								xtype : 'cp4_progressbar',
								id : 'current_operation_progress',
								margin : '10 0 0 0'
							}]
						});
					}
					
					var progressWindow = Ext.create( 'CP.WebUI4.Window',{
						id: 'backup-progress-window',
						width: 400,
						header: false,
						border: false,
						closable: false,
						draggable: false,
						resizable: false,
						modal : blockUI,
						items: [p_panel]
					}).show();
					
					progressWindow.setHeight(blockUI ? 140 : 110);
					
					progressWindow.setPagePosition(grid.getEl().getX() + grid.getWidth()/2 - progressWindow.getWidth()/2,
												   grid.getEl().getY() + grid.getHeight()/2 - progressWindow.getHeight()/2);
				}
		}
	});	 

}

,init:function() {
	//create backup page if doesnt exist
	var backupPagePanel = Ext.create('CP.WebUI4.FormPanel', {
		id: 'backup-page-wrapper-panel',
		cls: 'webui-main-panel',
		border: false,
		items: [],
		listeners: {
			destroy : function() {
				var progress_window = Ext.getCmp("backup-progress-window");
				if(progress_window) {
					progress_window.close();
				}
				if (CP.global.backupProgressQueryTask != undefined) {
					Ext.TaskManager.stop(CP.global.backupProgressQueryTask);
					CP.global.backupProgressQueryTask = undefined;
				}
			}
		},
		onTabChange : function() {
			var progress_window = Ext.getCmp("backup-progress-window");
			if(progress_window) {
				progress_window.close();
			}
		}
	});
	
	/* -------- Backup Section------------ */
	var backupTitle = Ext.create('CP.WebUI4.SectionTitle', { titleText: 'Backup'});
	
	var backupButtonsBar = Ext.create('CP.WebUI4.BtnsBar',{
		items: [{
				id: 'add-backup-btn'
				,text: 'Backup'
				,margin: '0 0 0 5'
				,handler: function(){CP.backup.genericShowWindow('add-backup-btn');}
			},{
				id: 'delete-backup-btn'
				,text: 'Delete'
				,disabled: true
				,margin: '0 0 0 5'
				,handler: CP.backup.deleteBackup
			},{
				id: 'restore-backup-btn'
				,text: 'Restore'
				,disabled: true
				,margin: '0 0 0 15'
				,handler: function(){

							CP.WebUI4.Msg.show({
								title: "Backup Restoration",
								msg: "You are about to restore your system to the backed up state.<BR>This will require restarting your machine.<BR> Are you sure you want to proceed?",
								buttons: Ext.Msg.OKCANCEL,
								icon: Ext.Msg.QUESTION,
								fn: function(btn, text){
										var gridSM = Ext.getCmp( 'backup-grid-panel' ).getSelectionModel();
										var s = gridSM.getLastSelected();

										if (btn == "cancel" || !s)
											return;
										gridSM.clearSelections();

										CP.backup.restoreLocalBackup(s.data.name);
								}
							});
						}
			},{
				id: 'restore-remote-backup-btn'
				,text: 'Restore Remote Backup'
				,disabled: false
				,margin: '0 0 0 5'
				,handler: function(){CP.backup.genericShowWindow('restore-remote-backup-btn');}
			},{
				id: 'import-backup-btn'
				,text: 'Import'
				,margin: '0 0 0 15'
				,handler: CP.backup.backupImport
			},{
				id: 'export-backup-btn'
				,text: 'Export'
				,disabled: true
				,margin: '0 0 0 5'
				,handler: CP.backup.backupExport
			},{
				id: 'log-backup-btn'
				,text: 'View Logs'
				,margin: '0 0 0 15'
				,handler: function(){CP.backup.getBackupLogs();}
			},{
				id: 'latest-backups-btn'
				,text: 'View Last Backups'
				,margin: '0 0 0 15'
				,handler: function(){CP.backup.getLastBackups();}
			}
		]
	});
	var backupGrid = CP.backup.getBackupGrid();

	/* --------Scheduled Backup Section------------ */
	var scheduledBackupTitle = Ext.create('CP.WebUI4.SectionTitle', { titleText: 'Scheduled Backup', 
									margin: CP.global.isCluster ? '10 0 10 0' : '80 0 10 0'  });
	
	//Buttons toolbar for table
	var scheduledBackupButtonsBar = Ext.create('CP.WebUI4.BtnsBar',{
		items: [{
				id: 'add-scheduled-backup-btn',
				text: 'Add Scheduled Backup',
				handler: function(){CP.backup.genericShowWindow('add-scheduled-backup-btn');}
			},{
				id: 'delete-scheduled-backup-btn',
				text: 'Delete',
				disabled: true,
				handler: CP.backup.deleteScheduledBackup
			}
		]
	});
	var scheduledBackupGrid = CP.backup.getScheduledBackupGrid();
	
	var backupDirTxt = Ext.create('CP.WebUI4.inlineMsg', { 
							id : 'backup_dir_txt',
							text : CP.backup.backupLocationText
						});
	
				
	/* --------Add all components in the order of creation------------ */
	
	if(!CP.global.isCluster) {
		backupPagePanel.add(backupTitle);
		backupPagePanel.add(backupButtonsBar);
		backupPagePanel.add(backupGrid);
		backupPagePanel.add(backupDirTxt);	
	}
	backupPagePanel.add(scheduledBackupTitle);
	backupPagePanel.add(scheduledBackupButtonsBar);
	backupPagePanel.add(scheduledBackupGrid);
	
	var ScheBackupComponents = ["add-scheduled-backup-btn","delete-scheduled-backup-btn"];
	
	var msg = CP.backup.setClusterSharedFeatureMode("backup",ScheBackupComponents);

	if(msg != "") {
	    var ClusterMsg = new CP.WebUI4.inlineMsg({
	        type: "warning",
	        text: msg
	    });
		backupPagePanel.add(ClusterMsg);
	}		

	CP.backup.backupPage.panel = backupPagePanel;
	//show the page
	CP.UI.updateDataPanel( CP.backup.backupPage );
	
	CP.backup.showProgressPopup(false,false);

} /* init()  End */


	/* --------Grid creation Section------------ */
/*	"backup" grid creation	*/
,getBackupGrid: function() {
	var store = Ext.create( 'CP.WebUI4.Store',{
		fields: [ {name: 'name'}, {name: 'date'} ,{name: 'size'} ],
	    proxy: {
	        type: 'ajax',
	        url : '/cgi-bin/backup.tcl',
	        reader: {
	            type: 'json',
	            root: 'data.backups'
	        }
	    }
	});

	var cm = [
	  		{header:'Local Backup Name',	dataIndex:'name',		id:'up-c-name',		width:250,	editable:false}
	  		,{header:'Date',		dataIndex:'date',	id:'up-c-date',	width:250,	editable:false}
	  		,{header:'Size',		dataIndex:'size',		id:'up-c-size',		editable:false, flex: 1}
	  	];
	
	//Grid
	var gridP = Ext.create('CP.WebUI4.GridPanel', {		
		id: "backup-grid-panel"
		,minHeight: 150
		,maxHeight: 200
		,store: store
		,columns: cm
		
		,listeners: {
            // select row on mouse click
        	selectionchange: function( gridView, selections ){
			
				var progressWindow = Ext.getCmp("backup-progress-window");
			
				if(progressWindow) {
					return;
				}
			
                var deleteBtn = Ext.getCmp('delete-backup-btn');
                var exportBtn = Ext.getCmp('export-backup-btn');
                var restoreBtn = Ext.getCmp('restore-backup-btn');
        		if (0 == selections.length){ // if no item has been selected
        			deleteBtn.disable();
					restoreBtn.disable();
					exportBtn.disable();
        		} else {
					deleteBtn.enable();
					restoreBtn.enable();
					exportBtn.enable();
				}
            },
			resize : function () {
				var progressWindow = Ext.getCmp("backup-progress-window");
				
				if(progressWindow) {
					progressWindow.setPagePosition(this.getEl().getX() + this.getWidth()/2 - progressWindow.getWidth()/2,
												   this.getEl().getY() + this.getHeight()/2 - progressWindow.getHeight()/2);
				}
			}
        }
	});
	return gridP;
}

/*	"scheduled backup" grid creation	*/
,getScheduledBackupGrid: function(){
    var store = Ext.create( 'CP.WebUI4.JsonStore',{
		fields: ['name', 'sched_bkp_recurrence', 'sched_bkp_type'],
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/backup.tcl',
            reader: {
                type: 'json',
                root: 'data.sched_backups'
            }
        }
    });

    // Column Model
    var cm = [
        {header: "Backup Schedule Name", dataIndex: CP.backup.schedDataIndex, width:250, id:'name'}
        ,{header: 'Recurrence',  dataIndex: 'sched_bkp_recurrence', width:250, id:'sched_bkp_recurrence'}
		,{ header: 'Backup Type',  dataIndex: 'sched_bkp_type', id:'sched_bkp_type', flex: 1}
    ];
    
    function formatHours(val) {
    	if ( val.indexOf("startup") == -1){
	    	 if( CP.global.formatTime == '12-hour' ){
	             var arrSplit = val.split(" at ");            
				 return arrSplit[0] + " at " + CP.util.displayTime(arrSplit[1]);
	    	 }
    	}
    	return val;
    }

    
    var gridP = Ext.create('CP.WebUI4.GridPanel', {
        id: "schedule-backup-grid-panel"
		,minHeight: 150
		,maxHeight: 200
        ,store: store
        ,columns: cm
        ,listeners: {
            selectionchange: function( gridView, selections ){
                //set buttons
                //var editBtn = Ext.getCmp("cron-edit-job"); TODO: add edit
                var delBtn = Ext.getCmp("delete-scheduled-backup-btn");
                if( selections.length == 0 ){
                    // editBtn.disable();
                    delBtn.disable();
                }
                else{
                    // editBtn.enable();
					if(delBtn.locked_by_cluster_config != true) {
						delBtn.enable();
					}
                }
            }
            //open edit dialog on row double click
            ,itemdblclick:  {                                                              
                scope: this,                                                  
                fn: function( grid, rowIndex, event ){                   

                }
            }
        }
    });
    return gridP;
}



// TODO: remove this. it is unnecessary. simply put the relevant sections in handlers of the 'add' buttons
,genericShowWindow: function(pressedButtonId) {
	var winTitle = "";
	var additionalItem = [];
	var okDisabled = false;
	var addButtonHandler = null;
	var addButtonTxt = "Add";
	var height;
	var nameField =	{
			id:"new-backup-name"
			,xtype: "cp4_textfield"
			,fieldLabel: "Backup Name"
			,enableKeyEvents: true
			,allowBlank: false
			,blankText: "This field is required"
			,maxLength: 15
			,width: 239
			,validator: CP.backup.getAsciiValidator("Scheduled backup name may only contain digits, letters and underscores (_)")
			// ,listeners: {
				// validitychange: function(field,isValid){
				 // if (isValid && field.getValue() != "") Ext.getCmp("btn-ok").enable();
				  // else Ext.getCmp("btn-ok").disable();
				// }
			// }
		}
	var backupFileField =	{
			id:"new-backup-name"
			,xtype: "cp4_textfield"
			,fieldLabel: "Backup File Name"
			,enableKeyEvents: true
			,allowBlank: false
			,blankText: "This field is required"
			,width: 350
			,validator: CP.backup.getAsciiValidator("Scheduled backup name may only contain digits, letters and underscores (_)")
		}
	if (pressedButtonId == "add-backup-btn"){
		winTitle = "New Backup";
		additionalItem = CP.backup.getNewBackupItems(true);
		addButtonHandler = CP.backup.addBackup;
		addButtonTxt = "Backup";
		height = 300;
	} else if (pressedButtonId == "add-scheduled-backup-btn"){
		winTitle = "New Scheduled Backup";
		additionalItem = [nameField, CP.backup.getNewBackupItems(true), CP.backup.getNewScheduledBackupItems() ];
		addButtonHandler = CP.backup.addScheduledBackup;
		height = 450;
	} else if (pressedButtonId == "restore-remote-backup-btn"){
		winTitle = "Restore Remote Backup";
		additionalItem = [backupFileField, CP.backup.getNewBackupItems(false) ];
		addButtonHandler = CP.backup.restoreRemoteBackup;
		addButtonTxt = "Restore";
		height = 330;
	}

	var popup = Ext.getCmp('backup-modal-window');
	if( !popup ){
		popup = CP.backup.createModalWindow(addButtonHandler, addButtonTxt);
	}
	
	var cancelButton = Ext.getCmp( 'btn-cancel');
	var additionalItemPanel = Ext.getCmp( 'additional_item_panel');
	if (pressedButtonId == "add-backup-btn") Ext.getCmp('btn-ok').enable();
	additionalItemPanel.removeAll();
	additionalItemPanel.add( additionalItem );

	// Simultate a change mode to choose who is selected first
	var localRadioCmp = Ext.getCmp("new_bkp_radio_group1");
	if (localRadioCmp) {
		CP.backup.backupChangeOccurMode(localRadioCmp, "local_backup");
	} else {
		CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group2'), 'tftp_backup');
	}
	popup.setHeight(height) ;
	popup.setTitle( winTitle );
	popup.show();
}

/* -------- "Split Screen" modal window items creation Section------------ */
/*	Returns items Relevant for the backup "split screen" such as:     backup name, backup type, ip, password....	*/
/*	Note that this is used by scheduled backup as it needs the same info	*/
,getNewBackupItems: function(hasLocalOperation) {
	/* The next 4 functions are private functions used to create the fields of the new window */
	var genericGetFunction =  
			function(id_in, label, filedType) {
				var cmp = Ext.getCmp(id_in);
				if (cmp) return cmp;
				
				var toReturn = 
					Ext.create( filedType, {
						id: id_in,
						fieldName: id_in,
						fieldLabel: label,
						fieldConfig: {allowBlank: false}
					});
				return toReturn;
			};

	var getIPv4 =
		function(id_in, label) {
			return genericGetFunction(id_in, label, 'CP.WebUI4.IPv4Field')
		};
		
	var getTextField =
		function(id_in, label) {
			return genericGetFunction(id_in, label, 'CP.WebUI4.TextField')
		};
		
	var getPassword =
		function(id_in, label) {
			return genericGetFunction(id_in, label, 'CP.WebUI4.Password')
		};
	
	var itemsToReturn = [{
			xtype: 'cp4_sectiontitle',
			titleText: 'Backup Type'
		},{
			xtype: 'cp4_panel',
			layout: 'column',
			items:[
				{		// ~~~ LEFT COLUMN
					xtype: 'cp4_panel',
					id:'new_bkp_type_panel',
					columnWidth: 0.25,
					items: [ 
						(!hasLocalOperation) ? {width:0} :
						{
							xtype: 'cp4_radio',
							boxLabel: 'This appliance',
							width: 100,							
							name: 'new_bkp_radio_group', 
							id: 'new_bkp_radio_group1',
							checked: true,
							inputValue: 1, 
							handler: function(){ CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group1'), 'local_backup'); }
						},{
							xtype: 'cp4_radio',
							boxLabel: 'Management', 
							width: 100,
							name: 'new_bkp_radio_group',
							id: 'new_bkp_radio_group5',
							inputValue: 5, 
							disabled : CP.backup.isMgmt,
							listeners: {
								afterrender: function(){
								   Ext.QuickTips.init();
								   Ext.QuickTips.register({
									 target: 'new_bkp_radio_group5',
									 text: 'Backup will be sent to the Security Management server managing this gateway.',
									 width: 200,
									 dismissDelay: 10000
								   }) ;
								}
							},
							handler: function(){ CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group5'), 'mgmt_backup'); }
						},{
							xtype: 'cp4_radio',
							boxLabel: 'SCP server',
							width: 100,
							name: 'new_bkp_radio_group', 
							id: 'new_bkp_radio_group3',
							inputValue: 3, 
							handler: function(){ CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group3'), 'scp_backup');	}
						},{
							xtype: 'cp4_radio',
							boxLabel: 'FTP server',
							width: 100,
							name: 'new_bkp_radio_group', 
							id: 'new_bkp_radio_group4',
							inputValue: 4, 
							handler: function(){ CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group4'), 'ftp_backup'); }
						},{
							xtype: 'cp4_radio',
							boxLabel: 'TFTP server', 
							name: 'new_bkp_radio_group', 
							id: 'new_bkp_radio_group2',
							checked: (hasLocalOperation) ? false : true,
							width: 100, // for IE8
							inputValue: 2, 
							handler: function(){ CP.backup.backupChangeOccurMode(Ext.getCmp('new_bkp_radio_group2'), 'tftp_backup'); }
						}]
				},{
				// ~~~ MIDDLE COLUMN
					xtype: 'cp4_panel',
					width: 10,
					height: 110,
					cls: 'cron-job-seperator',
					html: '&nbsp;'
				},{		// ~~~ RIGHT COLUMN
					xtype: 'cp4_panel',
					columnWidth: 0.74,
					items:[{
							xtype: 'cp4_panel',
							id: 'local_backup', /*these ids are used by the TCL. do not change.*/
							hidden: true,
							style: 'line-height:20px;text-align:center;',
							html: '<br>The backup will be made to this appliance.<br><br>In order for the backup to be effective<br>you should copy the file outside the machine'
						},{
							xtype: 'cp4_panel',
							id: 'tftp_backup',
							hidden: true,
							items: [getIPv4('tftp_id', 'IP Address')]
						},{
							xtype: 'cp4_panel',
							id: 'scp_backup',
							hidden: true,
							items: [getIPv4('scp_id', 'IP Address'),	
									getTextField('scp_user_id','User name'), 
									getPassword('scp_pass_id','Password'),
									Ext.apply(getTextField('scp_upload_path_id','Upload Path'), {
										allowBlank : false,
										vtype:'remotepath',
										vtypeText: 'Upload path must start with a slash followed by alphanumeric, dot, hyphen or underscore characters and end with a slash'
										})
									]
						},{
							xtype: 'cp4_panel',
							id: 'ftp_backup',
							hidden: true,
							items: [getIPv4('ftp_id', 'IP Address'), 
									getTextField('ftp_user_id','User name'), 
									getPassword('ftp_pass_id','Password'),
									Ext.apply(getTextField('ftp_upload_path_id','Upload Path*'), {
										allowBlank : false,
										vtype:'remotepath',
										vtypeText: 'Upload path must start with a slash followed by alphanumeric, dot, hyphen or underscore characters and end with a slash'
										}),{
											 xtype: 'cp4_displayfield',
											 width: 260,
                                             value: '* You should use full server side path to remote directory, e.g. /var/log/CPbackup/backups/',
                                             hideLabel: true
                                             }
									]
						},{
							xtype: 'cp4_panel',
							id: 'mgmt_backup',
							hidden: true,
							items: [getTextField('mgmt_user_id','User name'), getPassword('mgmt_pass_id','Password'),
									{
										 xtype: 'cp4_displayfield',
										 value: 'Please provide SCP Credentials<br>(Default shell should be bash)',
										 hideLabel: true
									}]
						}
					]
				}]
			}]
	return itemsToReturn;
}

/*	Returns items Relevant for the scheduled backup "split screen" such as:    hour, day, month...	*/
,getNewScheduledBackupItems: function(){
    //list of months combo
	var createComboCheckBox = function(id_in, label_in, store_in){
		var toReturn =  
			Ext.create( 'CP.WebUI4.ComboCheckBox',{
				id: id_in,
				// name: id_in,
				fieldLabel: label_in,
				width: 200,
				maxHeight: 200,
				labelWidth: 80,
				store: store_in
			});
		return  toReturn;
	}
	
	
    var monthsLC = createComboCheckBox('months_lc', 'Month', 
					[   [1, 'January'],[2, 'February'], [3, 'March'],[4, 'April'], [5, 'May'],[6, 'June'], [7, 'July'],
				  [8, 'August'], [9, 'September'],[10, 'October'], [11, 'November'],[12, 'December'] ]
				  );
	

    //list of days in months combo
    var dayOfMonthLC = createComboCheckBox('days_of_month_lc', 'Days of Month', 
					[[1, '1'],[2, '2'],[3, '3'],[4, '4'],[5, '5'],[6, '6'],[7, '7'],[8, '8'],[9, '9'],
                [10, '10'],[11, '11'],[12, '12'],[13, '13'],[14, '14'],[15, '15'],[16, '16'],[17, '17'],
                [18, '18'],[19, '19'],[20, '20'],[21, '21'],[22, '22'],[23, '23'],[24, '24'],[25, '25'],
                [26, '26'],[27, '27'],[28, '28'],[29, '29'],[30, '30'],[31, '31']]
				);

    //list of days in week combo
    var dayOfWeekLC = createComboCheckBox('day_of_week_lc', 'Days of Week', 
					[[0, 'Sunday'], [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday']]
					);


	var itemsToReturn = [{
		xtype: 'cp4_sectiontitle',
		titleText: 'Backup Schedule'
	},{
		xtype: 'cp4_panel',
		layout: 'column',
		items:[{
			xtype: 'cp4_panel',
			columnWidth: 0.25,
			items: [{
			// ~~~ LEFT COLUMN
				xtype: 'cp4_radio',
				boxLabel: 'Daily',
				width: 100, // for IE8				
				name: 'cb_custwidth', 
				id: 'cb_custwidth1',
				checked: true,
				inputValue: 1, 
				handler: function(){ CP.backup.scheduleBackupChangeOccurMode(Ext.getCmp('cb_custwidth1'), 'add_daily_occur_panel'); }
			},{
				xtype: 'cp4_radio',
				boxLabel: 'Weekly', 
				name: 'cb_custwidth',
				id: 'cb_custwidth2',
				width: 100, // for IE8
				inputValue: 2, 
				handler: function(){ CP.backup.scheduleBackupChangeOccurMode(Ext.getCmp('cb_custwidth2'), 'add_weekly_occur_panel'); }
			},{
				xtype: 'cp4_radio',
				boxLabel: 'Monthly', 
				name: 'cb_custwidth', 
				id: 'cb_custwidth3',
				width: 100, // for IE8
				inputValue: 3, 
				handler: function(){ CP.backup.scheduleBackupChangeOccurMode(Ext.getCmp('cb_custwidth3'), 'add_monthly_occur_panel'); }
			}]
		},{
		// ~~~ MIDDLE COLUMN
			xtype: 'cp4_panel',
			width: 10,
			height: 80,
			cls: 'cron-job-seperator',
			html: '&nbsp;'
		},{
		// ~~~ RIGHT COLUMN
			xtype: 'cp4_panel',
			columnWidth: 0.74,
			items:[{
				xtype: 'cp4_panel',
				id: 'add_daily_occur_panel',
				items: [{
					xtype: 'cp4_timebox',
					id: 'day_job',
					labelWidth: 80,
					width: 200
				}]
			},{
				xtype: 'cp4_panel',
				id: 'add_weekly_occur_panel',
				hidden: true,
				items: [{
						xtype: 'cp4_timebox',
						id: 'week_job',
						labelWidth: 80,
						height: 22,
						width: 200
					},
					dayOfWeekLC ]
			},{
				xtype: 'cp4_panel',
				id: 'add_monthly_occur_panel',
				hidden: true,
				items: [{
					xtype: 'cp4_timebox',
					id: 'month_job',
					labelWidth: 80,
					height: 22,
					width: 200
					},
					dayOfMonthLC, 
					monthsLC ]
			}]
		}]
	}]

    return itemsToReturn; //modalWin;
}

,createModalWindow: function(addButtonHandlerFunc, buttonTxt){
	var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'backup-modal-window',
		name: 'backup-modal-window',
		width:  450,
		items: [{
			xtype: 'cp4_formpanel',
			id: 'additional_item_panel',
			bodyPadding: 13,
			buttons: [{
				xtype: "cp4_button"
				,id:"btn-ok"
				,text: buttonTxt
				// ,disabled: true
				,handler: addButtonHandlerFunc
			},{
				xtype: "cp4_button"
				,id:"btn-cancel"
				,text: "Cancel"
				,handler: function (){ Ext.getCmp('backup-modal-window').close(); }
			}]
		}]
	});
	
	return modalWin;
}

,disableBackupGridButtons: function(){
	Ext.getCmp('add-backup-btn').disable();
	Ext.getCmp('restore-backup-btn').disable();
	Ext.getCmp('delete-backup-btn').disable();
	Ext.getCmp('export-backup-btn').disable();
	Ext.getCmp('restore-remote-backup-btn').disable();
	Ext.getCmp('import-backup-btn').disable();	
}
,enableBackupGridButtons: function(){
	Ext.getCmp('add-backup-btn').enable();
	Ext.getCmp('restore-remote-backup-btn').enable();
	Ext.getCmp('import-backup-btn').enable();	
}


/*	Add Section	*/
/*	Adds a backup	*/
/*	The function posts the relevant information in order to start a backup.	*/
/*	It also creates and starts a task responsible to prevent usage of the backup 	*/
/*	as only one backup can be performed each time.	*/
,addBackup: function(){
	//var backupName = Ext.getCmp('new-backup-name').getValue();
	var backupDetails = {};
    if (!CP.backup.getBackupDetailsToSend(backupDetails)) {
        return;
    }
	
	Ext.getCmp('backup-modal-window').close();
	CP.backup.disableBackupGridButtons();
	
	Ext.Ajax.request({
		url: "/cgi-bin/backup.tcl"
		,method: "POST"
		,params:{   jAction: "add_bkp",jBackupType: backupDetails.backupType,
					/*jBackupName: backupName,*/ jIPaddress: backupDetails.ip, jUserName: backupDetails.user, jPassword: backupDetails.password,
					jUploadPath : backupDetails.upload_path
				}
		,success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			CP.util.setStatusMsg( jsonData );
			if ( jsonData.success == "true" ) {
				CP.global.backupProgressQueryTask = {
					id: 'backup-progress-task',
					run: function () {CP.backup.sampleBackupFinished(CP.backup.finishBackupMsg)},
					interval: 5*1000
				};
				Ext.TaskManager.start(CP.global.backupProgressQueryTask);
				CP.backup.showProgressPopup(true,false);
			} else {
				Ext.getCmp("backup-grid-panel").setLoading(false);
				Ext.getCmp('add-backup-btn').enable();
			}
		}
	});
}

/*	Adds a scheduled backup	*/
/*	The function simply prepares arguments for 'applyHandlerWithCallback' which is called last.	*/
/*	Arguments are variabls sent as well as callback functions	*/
,addScheduledBackup: function(){
	/*	The next 3 private functions are callbacks to be performed by 'applyHandlerWithCallback'	*/
	var onSuccess = function(){
		gridPanel = Ext.getCmp("schedule-backup-grid-panel");
		gridPanel.setLoading(false);
		gridPanel.getStore().load();
		CP.backup.enableBackupGridButtons();
	}
	var onFailure = function(){
		Ext.getCmp("schedule-backup-grid-panel").setLoading(false);
		alert("Failed creating scheduled backup");
		CP.backup.enableBackupGridButtons();
	}
	var preCall = function(){
		Ext.getCmp('backup-modal-window').close();
		Ext.getCmp("schedule-backup-grid-panel").setLoading("Please wait while adding scheduled backup...");
		CP.backup.disableBackupGridButtons();
	}
	
	/*	Flow Start  */
	var backupNameCmp = Ext.getCmp('new-backup-name');
	var backupName = backupNameCmp.getValue();
	if ( "" == backupName || "" != backupNameCmp.getActiveError()){
		if ("" == backupName) backupNameCmp.markInvalid("This field is required");
		return false;
	}
	var backupDetails = {};
    if (!CP.backup.getBackupDetailsToSend(backupDetails)) {
        return;
    }
	var schedBackupDetails = {};
    if (!CP.backup.getScheduledBackupDetailsToSend(schedBackupDetails)) {
        return;
    }
	
	/* Check that a backup of the same name already exists */
	var scheduleGridStore = Ext.getCmp("schedule-backup-grid-panel").getStore();
	var backupNameRow = scheduleGridStore.findExact(CP.backup.schedDataIndex, backupName);
	if (-1 != backupNameRow) {
		CP.WebUI4.Msg.show({
			title: "Failed to add backup",
			msg: "A scheduled backup by that name already exists.",
			buttons: Ext.Msg.OKCANCEL
		});
		return;
	}
	
	CP.backup.backupPage.params = {   jAction: 'add_scheduled_bkp',  jBackupType: backupDetails.backupType,
					jBackupName: backupName, jIPaddress: backupDetails.ip, jUserName: backupDetails.user, jPassword: backupDetails.password,
					jUploadPath : backupDetails.upload_path,
					/* Schedule backup section*/
					hours:schedBackupDetails.hours, minutes:schedBackupDetails.minutes, 
                    daysinmonth:schedBackupDetails.daysinmonth, months:schedBackupDetails.months, daysinweek:schedBackupDetails.daysinweek
				}
	CP.UI.applyHandlerWithCallback(CP.backup.backupPage, preCall, onSuccess, onFailure);
}

,restoreBackup: function(jParams, msg){
	Ext.Ajax.request({
		url: "/cgi-bin/backup.tcl"
		,method: "POST"
		,params: jParams
		,success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			CP.util.setStatusMsg( jsonData );
			if (jsonData.success != "false") {
			CP.global.backupProgressQueryTask = {
				id: 'backup-progress-task',
				run: function () {CP.backup.sampleBackupFinished(CP.backup.showRebootDialog)},
				interval: 5*1000
			};
			Ext.TaskManager.start(CP.global.backupProgressQueryTask);
			CP.backup.showProgressPopup(true,true);
		}
		}
	});
}

,restoreLocalBackup: function(backupToRestore){
	CP.backup.disableBackupGridButtons();
	var ajaxRestoreParams = {   jAction: "restore_bkp",	jBackupName: backupToRestore	};
	CP.backup.restoreBackup(ajaxRestoreParams, "Please wait while restoring local backup...");
}


,restoreRemoteBackup: function(){
	var backupNameCmp = Ext.getCmp('new-backup-name');
	var backupName = backupNameCmp.getValue();
	if ( "" == backupName || "" != backupNameCmp.getActiveError()){
			if ("" == backupName) backupNameCmp.markInvalid("This field is required");
			return false;
	}

	var backupDetails = {};
    if (!CP.backup.getBackupDetailsToSend(backupDetails)) {
        return;
    }
	CP.backup.disableBackupGridButtons();
	Ext.getCmp('backup-modal-window').close();
	
	var ajaxRestoreParams = {   jAction: 'restore_remote_bkp', jBackupType: backupDetails.backupType, 
					jBackupName: backupName, jIPaddress: backupDetails.ip, jUserName: backupDetails.user, 
					jPassword: backupDetails.password , jUploadPath : backupDetails.upload_path }
	
	CP.backup.restoreBackup(ajaxRestoreParams, "Please wait while restoring remote backup...");
}

,showRebootDialog: function(){

	if (CP.global.backupProgressQueryTask != undefined) {
		Ext.TaskManager.stop(CP.global.backupProgressQueryTask);
		CP.global.backupProgressQueryTask = undefined;
	}
	if(Ext.getCmp( 'backup-progress-window' ))
		Ext.getCmp( 'backup-progress-window' ).close();
		
	if(CP.backup.restoreInProgress) {
		CP.util.rebootingWindow('Rebooting System',
								'Please wait while system is rebooting.',
							  30000);
	}
}

,finishBackupMsg: function(){

	var BackupSummery = "Backup has finished successfully.<br>";

	Ext.Ajax.request({
		url: "/cgi-bin/backup.tcl?operation=query-backup-progress"
		,method: "GET"
		,success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			
			var LastBackupTime = jsonData.lastBackupTime;
			var lastBackupAddr = jsonData.lastBackupAddr;
			var lastBackupType = jsonData.lastBackupType;
			var lastBackupFile = jsonData.lastBackupFile;
	
			var m = Math.floor((LastBackupTime/60));
			var s = Math.floor((LastBackupTime%60));		
			var time_word = "minutes";
			
			if(m == 0)
				time_word = "seconds";
			
			var minutes = (m < 10) ? "0" + m : m;
			var seconds = (s < 10) ? "0" + s : s;

			LastBackupTime = minutes + ":" + seconds;
			
			BackupSummery = BackupSummery + "<br>Backup has finished after " + LastBackupTime + " " + time_word +  "<br>";
			if(lastBackupType != "local") {
				BackupSummery = BackupSummery + "<br>Backup server:" + lastBackupAddr + "<br>";
			}
			if (lastBackupType == "mgmt") {
				lastBackupType = "Management";
			}
			BackupSummery = BackupSummery + "<br>Backup type:" + lastBackupType + "<br>";
			BackupSummery = BackupSummery + "<br>Backup file saved to:" + lastBackupFile + "<br>";
			
			Ext.getCmp( 'backup-progress-window' ).close();	
			
			CP.WebUI4.Msg.show({
				title: "Finished backup",
				msg: BackupSummery,
				buttons: Ext.Msg.OK
			});			
			
			CP.backup.enableBackupGridButtons();
		}
	});
}
/*	Delete Section	*/
/*	Removes a "backup" or a "scheduled backup"	*/
/*	The function simply prepares arguments for 'applyHandlerWithCallback' which is called last.	*/
/*	Arguments are variabls sent as well as callback functions	*/
,genericDelete: function(gridPanelID, msgTitle, msgText,  errMsg, action){
	var onSuccess = function(){
		gridPanel = Ext.getCmp(gridPanelID);
		gridPanel.setLoading(false);
		gridPanel.getStore().load();
		CP.backup.enableBackupGridButtons();
	}
	var onFailure = function(){
		Ext.getCmp(gridPanelID).setLoading(false);
		alert(errMsg);
		CP.backup.enableBackupGridButtons();
	}
	
	var preCall = function(){
		Ext.getCmp(gridPanelID).setLoading("Please wait while deleting...");
		CP.backup.disableBackupGridButtons();
	}
	
	CP.WebUI4.Msg.show({
		title: msgTitle,
		msg: msgText,
		buttons: Ext.Msg.OKCANCEL,
		icon: Ext.Msg.QUESTION,
		fn: function(btn, text){
			var gridSM = Ext.getCmp( gridPanelID ).getSelectionModel();
			var s = gridSM.getLastSelected();
			gridSM.clearSelections();

			if (btn == "cancel" || !s)
				return;
			
			gridSM.clearSelections();
			Ext.getCmp('restore-backup-btn').disable();
			Ext.getCmp('delete-backup-btn').disable();
			Ext.getCmp('export-backup-btn').disable();
			
			CP.backup.backupPage.params = { jAction: action, jBackupName: s.data.name }
			CP.UI.applyHandlerWithCallback(CP.backup.backupPage, preCall, onSuccess, onFailure);
		}
	});
}

/*	Removes a "backup" - the function simply calls 'genericDelete' with the right arguments	*/
,deleteBackup: function(){
	var gridPanelID = 'backup-grid-panel';
	var msgTitle = 'Delete Backup'
	var msgText = 'Are you sure you want to delete the selected backup?'
	var errMsg = 'Backup deletion failed';
	
	Ext.getCmp('delete-backup-btn').disable();
	CP.backup.genericDelete(gridPanelID, msgTitle, msgText,  errMsg, 'delete_bkp');
}
/*	Removes a "scheduled backup" - the function simply calls 'genericDelete' with the right arguments	*/
,deleteScheduledBackup: function(){
	var gridPanelID = 'schedule-backup-grid-panel';
	var msgTitle = 'Delete Scheduled Backup'
	var msgText = 'Are you sure you want to delete the scheduled backup?'
	var errMsg = 'Backup deletion failed';
	
	Ext.getCmp('delete-scheduled-backup-btn').disable();
	CP.backup.genericDelete(gridPanelID, msgTitle, msgText,  errMsg, 'delete_sched_bkp');
}

,backupImport: function(){
	var winID = 'backup-import-modal-window';
	var modalWin = Ext.getCmp(winID);
	if( !modalWin ){
		var backupMWForm = Ext.create('CP.WebUI4.FileUploadPanel', {
			id: 'backup_upload_mw_form',
			bodyPadding: 20,
			uploadPath: CP.backup.backupDir,
			tmpPath: '/var/log/upload',
			uploadLabel: 'Select backup package to upload:',
			onUploadFinished: function(){
				Ext.getCmp( winID ).close();
				Ext.getCmp('restore-backup-btn').disable();
				Ext.getCmp('delete-backup-btn').disable();
				Ext.getCmp('export-backup-btn').disable();
				Ext.getCmp('backup-grid-panel').getStore().load();
				
			}, onUploadStarted: function(){
				Ext.getCmp('backup-mw-btn').setDisabled(true);
			},
			//Save and cancel buttons
			buttons: [{
				xtype: 'cp4_button',
				id: 'backup-mw-btn',
				text: 'Cancel',
				handler: function(){
					Ext.getCmp( winID ).close();
				}
			}]
		});
		
		modalWin = Ext.create('CP.WebUI4.ModalWin', {
			id: winID,
			name: winID,
			width: 420,
			height: 220,
			title: 'Backup',
			items: [ backupMWForm ]
		});
	}
	modalWin.show();
}

,backupExport: function() {
	var s = Ext.getCmp("backup-grid-panel").getSelectionModel().getLastSelected();
	if (!s)
		return;
	
	var fName = s.get("name");
	var fSize = s.get("size");
	
	if (!fName || !fSize)
		return;
	
	CP.WebUI4.Msg.show({
        title:'Export Backup',
        msg: 'You are about to export backup file ' + fName +
        	' and download it to your computer ('+ fSize +').<br>' +
        	'Are you sure you want to continue?',
        buttons: Ext.Msg.OKCANCEL,
        icon: Ext.Msg.QUESTION,
        fn: function(btn, text){
            if (btn == "cancel")
                return;

		Ext.getBody().mask("Please wait a few moments while the backup package is exported...");
		Ext.Ajax.request({
			url: "/cgi-bin/backup.tcl",
			method: "POST",
			scope: this,
			params: {
				jAction: 'export_bkp',
				file_name: s.get("name")
			},
			success: function(jsonResult) {
				setTimeout(function(){
					Ext.getBody().unmask();
					location.href =  _sstr+"/cgi-bin/img_export.tcl?is_backup=true&file="+s.get("name");
				}, 5000); // wait seconds to complete all conflock requests
			},
			failure: function(jsonResult) {
				Ext.getBody().unmask();
			}
		});
		
        }
    });
}

// TODO: refactore bothe sample jobs to call same code with parameters.

/*	The function samples the backend in order to see if the backup has finished and user can access grid	*/
/*	When the backup has finished it allows access and stops the sampling task	*/
,sampleBackupFinished: function(finishMsg){
	Ext.Ajax.request({
		url: "/cgi-bin/backup.tcl?operation=query-backup-progress"
		,method: "GET"
		,failure : function() {
			if(CP.backup.restoreInProgress) {
				CP.backup.showRebootDialog();				
			}
		}
		,success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			var status = decodeURIComponent(jsonData.data.status);
			status = status.replace(/\n/g, '<br />');
			var statusArr = status.split(" ");
			if (statusArr[0] != "Performing"){
				
				if (CP.global.backupProgressQueryTask != undefined) {
					Ext.TaskManager.stop(CP.global.backupProgressQueryTask);
					CP.global.backupProgressQueryTask = undefined;
				}
				
				CP.backup.enableBackupGridButtons();
				Ext.getCmp('backup-grid-panel').getStore().load();

				if (finishMsg && (-1 == status.search("fail"))){
					finishMsg();
				} else {
					if(CP.backup.restoreInProgress) {
						CP.global.supress_update_msg = 0;
						CP.global.isRebooting = false;
						CP.backup.restoreInProgress = false;
					}
			
					CP.WebUI4.Msg.show({
						title: "Failure",
						msg: status,
						buttons: Ext.Msg.OK
					});
					
					Ext.getCmp( 'backup-progress-window' ).close();
				}
			} else {
				var grid = Ext.getCmp("backup-grid-panel");
				var progress = 99;
				var current_operation_status = Ext.getCmp("current_operation_status");
				
				CP.backup.disableBackupGridButtons();
				
				
				/*	the backup status live handler return status in the following format:
					type-of-operation@operation-current-status@progress */
				
				statusArr = status.split("@");
				
				if(statusArr[0] && current_operation_status) {
					current_operation_status.setValue(statusArr[0]);
				}

				if(statusArr.length < 2)
					progress = (statusArr[1] == undefined) ? 0 : statusArr[1];
				else {
					var current_operation_step = Ext.getCmp("current_operation_step");
				
					if(current_operation_step) {
						current_operation_step.setValue(statusArr[1]);
					}
					progress = (statusArr[2] == undefined) ? 0 : statusArr[2];
				}
				
				var current_operation_progress = Ext.getCmp("current_operation_progress");
				
				if(current_operation_progress) {
					if(progress == 0) {
						current_operation_progress.hide();
					} else {
						current_operation_progress.show();
						current_operation_progress.updateProgress(progress/100);
						current_operation_progress.setText(progress + "%");
					}
				}
			}
		}
	});
}

,getLastBackups: function(){
	var LatestBackupsGridPanel = CP.backup.getLatestBackupsGrid();
	var modWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'latest_backups_window',
		name: 'latest_backups_window',
		title: 'Last backups'
	});
	modWin.add(LatestBackupsGridPanel);
	modWin.show();
	LatestBackupsGridPanel.doComponentLayout();
	modWin.doComponentLayout();
	modWin.setSize(LatestBackupsGridPanel.getWidth() + 10,LatestBackupsGridPanel.getHeight() + 32);
	modWin.center();
}

,getLatestBackupsGrid: function() {

	function renderBackupDate(val, meta, record) {
		var rv = '<div style="text-align:center">';
	
		if(val == "") {
			return rv + "N/A";
		} else {
			val = val.split("@");
			var date = CP.util.displayDate(val[0]);
			var time = CP.util.displayTime(val[1].replace(/\-/g,':'));
			return rv + date + " " + time;
		}
		
		rv += '</div>';
		
		return rv;
	}
	
	function renderBackupType(val, meta, record) {
		if(val == "mgmt")
			return "Management";
		else
			return val;
	}	

	var store = Ext.create( 'CP.WebUI4.Store',{
		fields: [ {name: 'backup_type'} , {name : 'newest'} , {name: 'backup_date'} , {name: 'backup_file'}],
	    proxy: {
	        type: 'ajax',
	        url : '/cgi-bin/backup.tcl',
	        reader: {
	            type: 'json',
	            root: 'data.latest_backups'
	        }
	    },
		listeners: {
			load : function () {
				var jsonData = this.getProxy().getReader().rawData;
				var grid = Ext.getCmp("latest_backups_grid_panel");
				
				if(grid) {
					var recordIndex = this.findRecord('backup_type',jsonData.lastBackupType);
					if(recordIndex) {
						recordIndex.set("newest","Yes");
					}
				}
			}
	    }
	});
	
	var cm = [
	  		{header:'Backup Type',	dataIndex:'backup_type',id:'backup_type',width:80, renderer:renderBackupType},
			{header: 'Latest?',dataIndex: 'newest',width: 50},
			{header:'Date',	dataIndex:'backup_date',id:'backup_date',width:150, renderer:renderBackupDate },
			{header:'Backup File',	dataIndex:'backup_file',id:'backup_file',width:380, flex: 1,editor: {xtype: 'textfield'} }
	  	];

	var gridP = Ext.create('CP.WebUI4.GridPanel', {		
		id: "latest_backups_grid_panel"
		,store: store
		,width:  630
		,height: 205
		,plugins: [
			Ext.create('Ext.grid.plugin.CellEditing', {
				clicksToEdit: 1
				,listeners: { 
					validateedit : function() {
						return false;
					},
					beforeedit : function(e) {
						if(e.value == "") {
							return false;
						}
					}
				}
			})
		]
		,columns: cm
		,selType: 'cellmodel'
		,scroll : false
		,renderTo: Ext.getBody()
	});
	return gridP;
}

,getBackupLogs: function(){
	var logGridPanel = CP.backup.getLogGrid();
	var modWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'backup-log-window',
		name: 'backup-log-window',
		title : 'Backup Logs',
		width:  750,
		height: 450,
		items: [
			logGridPanel
			,{
				xtype: 'cp4_formpanel',
				id: 'log_buttons',
				bodyPadding: 150,
				buttons: [{
					xtype: "cp4_button"
					,id:"close-log"
					,text: "Close"
					,handler: function (){ Ext.getCmp('backup-log-window').close(); }
				}]
			}
		]
	});
	modWin.show();
	logGridPanel.doComponentLayout( )
	
}

,getLogGrid: function() {
	var store = Ext.create( 'CP.WebUI4.Store',{
		fields: [ {name: 'date_and_time'}, {name: 'location'} ,{name: 'address'} ,{name: 'status'} ,{name: 'details'} ],
	    proxy: {
	        type: 'ajax',
	        url : '/cgi-bin/backup.tcl?operation=get-logs',
			extraParams: {name:'log'},
	        reader: {
	            type: 'json',
	            root: 'data.log'
	        }
	    }
	});

	var cm = [
	  		{header:'Device Date and Time',	dataIndex:'date_and_time',		id:'log-date-time',		width:145,	editable:false , renderer:decodeURIComponent}
	  		,{header:'Location',		dataIndex:'location',	id:'log-location',	width:75,	editable:false, renderer:decodeURIComponent}
	  		,{header:'IP Address',		dataIndex:'address',		id:'log-address', width:75, editable:false, renderer:decodeURIComponent}
			,{header:'Status',		dataIndex:'status',	id:'log-status',	width:75,	editable:false, renderer:decodeURIComponent}
			,{header:'Details',		dataIndex:'details',	id:'log-details',	width:250,	editable:false, flex: 1, renderer:decodeURIComponent}
	  	];

	//Grid
	var gridP = Ext.create('CP.WebUI4.GridPanel', {		
		id: "log-grid-panel"
		,minHeight: 400
		,minWidth: 700
		,store: store
		,columns: cm
		
	});
	return gridP;
}

/* Returns a function that functions as a validator function - 
	Receives one parameter and returns either true or an error message */
,getAsciiValidator: function(errMsg){
	return function(value){
			re = new RegExp(/^[a-zA-Z0-9_]+$/g);
			if (value == "" || re.test(value))
				return true;
			else
				return errMsg;
		}
}


,getBackupDetailsToSend: function(details) {
	var result = 0;
    //details.job_name = Ext.getCmp('new-backup-name').getValue();
	var firstRadioCmp = Ext.getCmp('new_bkp_radio_group1')
    if (firstRadioCmp && firstRadioCmp.getValue()) {
		details.backupType = "local";
		result = 1;
    } else {
		// TODO: try to make all ip fields the same
		if (Ext.getCmp('new_bkp_radio_group2').getValue()){
			details.backupType = "tftp";
			if(Ext.getCmp('tftp_id').validate())
				details.ip = Ext.getCmp('tftp_id').getValue();
			result = details.ip;
		}
		if (Ext.getCmp('new_bkp_radio_group3').getValue()) {
			details.backupType = "scp";
			if(Ext.getCmp('scp_id').validate())
				details.ip = Ext.getCmp('scp_id').getValue();
			if(Ext.getCmp('scp_user_id').validate())
				details.user = Ext.getCmp('scp_user_id').getValue();
			if(Ext.getCmp('scp_pass_id').validate())
				details.password = Ext.getCmp('scp_pass_id').getValue();
			if(Ext.getCmp('scp_upload_path_id').validate())
				details.upload_path = Ext.getCmp('scp_upload_path_id').getValue();
			result = (details.user && details.password && details.upload_path && details.ip);
		} else if (Ext.getCmp('new_bkp_radio_group4').getValue()) {
			details.backupType = "ftp";
			if(Ext.getCmp('ftp_id').validate())
				details.ip = Ext.getCmp('ftp_id').getValue();
			if(Ext.getCmp('ftp_user_id').validate())
				details.user = Ext.getCmp('ftp_user_id').getValue();
			if(Ext.getCmp('ftp_pass_id').validate())	
				details.password = Ext.getCmp('ftp_pass_id').getValue();
			if(Ext.getCmp('ftp_upload_path_id').validate())
				details.upload_path = Ext.getCmp('ftp_upload_path_id').getValue();
			result = (details.user && details.password && details.upload_path && details.ip);
		} else if (Ext.getCmp('new_bkp_radio_group5').getValue()) {
			details.backupType = "mgmt";
			details.user = Ext.getCmp('mgmt_user_id').getValue();
			details.password = Ext.getCmp('mgmt_pass_id').getValue();
			result = (details.user && details.password);
		}
    }
    return result;
}

/*
 * Extract the scheduling from the fields and put it into properties of an object scheduling
 * Returns: true if the field is valid, else otherwise
 */
 // TODO: make an infrastructure function that suites both backup and cron job (as this is taken from there)
,getScheduledBackupDetailsToSend: function(details) {
	var result = 1;
	
    details.hours = "all";
    details.minutes = "all";
    details.daysinmonth = "all";
    details.months = "all";
    details.daysinweek = "all";
    details.startup = "0";
    
    function sorter(a,b){
        return a-b;
    }
    
	if (Ext.getCmp('cb_custwidth1').getValue()) {
        //daily
        result = ( CP.backup.getTimeFromBox('day_job', details) && result );
    }
    else if (Ext.getCmp('cb_custwidth2').getValue()) {
        //weekly 
        details.daysinweek = Ext.getCmp('day_of_week_lc').getValue().sort(sorter).join(',');
		if(details.daysinweek == "") {
			Ext.getCmp('day_of_week_lc').markInvalid("This field is required");
		}
        result = (result && details.daysinweek);
        result = ( CP.backup.getTimeFromBox('week_job', details) && result );
    }
    else if (Ext.getCmp('cb_custwidth3').getValue()) {
        //monthly
        details.months = Ext.getCmp('months_lc').getValue().sort(sorter).join(',');
		if(details.months == "") {
			Ext.getCmp('months_lc').markInvalid("This field is required");
		}		
        result = (result && details.months);
        details.daysinmonth = Ext.getCmp('days_of_month_lc').getValue().sort(sorter).join(',');
		if(details.daysinmonth == "") {
			Ext.getCmp('days_of_month_lc').markInvalid("This field is required");
		}				
        result = (result && details.daysinmonth);
        result = ( CP.backup.getTimeFromBox('month_job', details) && result );
    }
    
    return result;
}

,getTimeFromBox: function( timeBoxId, scheduling ){
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
    scheduling.minutes = minField.getValue();
    
    return result;
}

/*	Change functions	*/
/*	
	The following two functions are responsible for hiding all other components in the "split screen"
	and showing the one whose radio button was chosen.
	One exists for 'backup' and one for 'scheduled backup'
*/
,backupChangeOccurMode: function( oCB, panelId ){
	if( oCB.getValue() == false) {return;}
	//Hide all	
	if (cmp = Ext.getCmp( 'local_backup' )) cmp.hide();
	if (cmp = Ext.getCmp( 'tftp_backup' )) cmp.hide();
	if (cmp = Ext.getCmp( 'scp_backup' )) cmp.hide();
	if (cmp = Ext.getCmp( 'ftp_backup' )) cmp.hide();
	if (cmp = Ext.getCmp( 'mgmt_backup' )) cmp.hide();
	//Show selected
	if( panelId ){
		CP.backup.currentRadioSelectionID = panelId;
		Ext.getCmp( panelId ).show();
	}
}
,scheduleBackupChangeOccurMode: function( oCB, panelId ){
	if( oCB.getValue() == false){return;}	
	//Hide all
	Ext.getCmp( 'add_daily_occur_panel' ).hide();
	Ext.getCmp( 'add_weekly_occur_panel' ).hide();
	Ext.getCmp( 'add_monthly_occur_panel' ).hide();
	//Show selected
	if( panelId ){
		// CP.backup.currentRadioSelectionID = panelId;
		Ext.getCmp( panelId ).show();
	}
}

,setClusterSharedFeatureMode: function(feature,components) {
	
	var lock_components = false;
	var msg = "";

	if(CP.global.isClusterEnabled) {
		if(CP.global.isCluster) { //cadmin mode
			if(CP.global.LockClusterNonSharedFeatureInCAdminMode) {
				if(CP.global.isClusterFeatureShared[feature] != undefined &&
					CP.global.isClusterFeatureShared[feature] == false) {
					msg = "This feature is not configured as a cloning group synchronized feature " + 
						  "and therefore can only be controlled from single gateway's Web UI.";
					lock_components = true;
				}
			}
		} else { //normal mode
			if(CP.global.LockClusterSharedFeatureInAdminMode) {
				if(CP.global.isClusterFeatureShared[feature] != undefined &&
					CP.global.isClusterFeatureShared[feature] == true) {
					msg = "This feature is a cloning group synchronized feature. Configuration of this feature is only allowed from Cloning Group Web UI.";
					lock_components = true;
				}
			}
		}
	}
	
	if(lock_components) {
		for (var i = 0; i < components.length; i++) {	
			if(Ext.getCmp(components[i])) {
				Ext.getCmp(components[i]).locked_by_cluster_config = true;
				Ext.getCmp(components[i]).setDisabled(true);
			}
		}
	}
	
	return msg;
}

}
