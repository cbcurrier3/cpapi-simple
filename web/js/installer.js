//searchKeys: cpuse
// Copyright Check Point

// PING Installer - display packages available to download, available to install, and installed packages. Initiate download, install or uninstall.

CP.Packages = {

	// Defaults	
	removeSnapTimeout: 0,
	removeSnapTimeout_max: 24, // Seconds
	snapshotToDelArray: [],
	before_snapshotToDelBtn: "",
	before_snapshotToDelRow: 0,
	snapshotJsonData: '',
	sum_all_imges_size: 0.0,
	currnet_free_space: 0,
	total_size_img: 0.0,
	new_partition_disk_size: 0.0,
	first_getData_succeeded: false,
	snapshot_grid_id: 'snapshot_grid',
	task: '',
	searchTask: '',
	searchStarted: false,
	searchTrigerred: false,
	searchCanceled: false,
	searchInvalid: false,
	install_id: 0,
	isDArunning: true,
	tableWidth: 600,
	MaxRows: 10,
	rowHeight: 24,
	session_id: Math.floor(Math.random() * 10000),
	scrollerHeight: 0,
	tableHeight: 450,//(CP.Packages.MaxRows+1)*CP.Packages.rowHeight+CP.Packages.scrollerHeight,
	packageRunning: false,
	selectedGroup: false,
	ignore_critical: false,
	found_critical: false,
	supress_update_counter: 0,
	isRebooting_counter: 0,
	is_mds: false,
	legacy_display_status: true,
	action_allowed: true,
	current_version: '',
	mds_err: 'PV-1 upgrade is not supported via WebUI',
	error_msg: 'Current user has no license to receive updates from the download center. Please configure a valid license in the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/license\');return false;">Licenses</a> page, found in the advanced mode.',
	msgsTimeStamp: 0,
	MSG_FONT_SIZE: 14,
	MSG_FONT_SIZE_BIG: 16,
	MSG_FONT_SIZE_LARGE: 14,
	connection_fail_counter: 0,
	MAX_FAILED_CONNECTIONS: 200,
	MAX_ROWS_IN_VERIFIER_RESULTS: 22,
	MAX_STRING_SIZE_IN_VERIFIER_RESULTS: 900,
	SHOWN_AND_CLOSED_MESSAGES: [],
	TOOL_TIP_MESSAGES: [],
	MACHINE_VERSION: 'N/A',
	INSTALLED_PACKAGES: [],
	INSTALLED_PACKAGES_CONTAINED: [],
	NOT_VALID_PACKAGE_NUMBER: -2,
	DISPLAY_MAJORS: true,
	DUMMY_CATEGORY_LIST: [],
	downloadingInCategory: [],
	installingInCategory: [],
	DA_VERSION: 0,
	OS_BUILD: 0,
    MAX_DOWNLOAD_RETRY: 3,
	SEARCH_PACKAGES_NO_RES_MSG: "No package was found",	
	SEARCH_TEXT_INVALID:"Please enter a valid text",
	SEARCH_PACKAGES_NO_RES_BALLOON_FLAG: 1,
	GREY_COLOR: '#98988E',
	STATIC_MESSAGE_COLOR: '#FFF29D',
	UPDATE_COMPLETE_TIMESTAMP: '',	
	CONNECTION_NO_STATE: "no_state",
	connection_error_msg: "no_state",
	
	TGZ_EXT: ".tgz",
	FULL_EXT: "_FULL.tgz",
	
	// IDs
	DOWNLOAD_BTN: 'download_button',
	MORE_DOWNLOAD_BTN: 'more_download_button',
	PAUSE_BTN:	'pause_button',
	RESUME_BTN:	'resume_button',
	INSTALL_BTN: 'install_button',
	INSTALL_BTN_TEXT: 'Install Update',
	VERIFIER_BTN_TEXT: 'Verifier',
	DELETE_BTN_TEXT: 'Delete From Disk',
	REMOVE_FROM_VIEW_TEXT: 'Remove From View',
	UNINSTALL_BTN: 'uninstall_button',
	APPLY_BTN: 'apply_button',
	LINK_TO_IMAGE_MANAGEMENT: 'link_to_image_mgmt_btn',
	I_LOG_BTN: 'install_log_button',
	U_LOG_BTN: 'uninstall_log_button',
	IF_LOG_BTN: 'install_failed_log_button',
	CHK_BTN: 'check_install_button',
	REINST_BTN: 'reinstall_button',
	DELETE_BTN: 'delete_button',
	REMOVE_FROM_VIEW_BTN: 'remove_from_view_button',
	UPGRADE_BTN: 'upgrade_button',
	REVERT_BTN: 'revert_button',
	PRIVATE_PKG_BTN: 'prv_pkg_btn',
	HELP_BTN: 'help_btn',
	EXPORT_BTN: 'export_btn',
	EXPORT_BTN_TEXT: 'Export Package',
	IMPORT_BTN: 'import_btn',
	IMPORT_BTN_TEXT: 'Import Package',
	ACTIONS_BTN: 'actions_menu_btn', 
	SEARCH_HOTFIX_IN_CLOUD: 'search_hotfixes_btn',
	SEARCH_BY_ID_COMP: 'search_combo_input',
	DA_WARNING: 'service_not_running_warning',
	DA_DISABLE_WARNING: 'service_disabled_warning',
	DESCRIPTION_PANEL: 'description_panel',
	EXT4_PANEL_ID: 'packages_panel',
	MAJORS_TAB: 'majors_tab',
	SP_TAB: 'software_patches_tab',
	GRID_ID: 'packages_grid',
	TASK: 'update_task',
	PRIV_URL: 'private_url',
	CURRENT_MSG: '',
	SP_NAME: 'Updates',
	MAJORS_NAME: 'Full Images',
	PKGS_TITLE: 'pkgs_title',
	DESC_TITLE: 'desc_title',
	CUR_VER_PANEL: 'current_version_panel',
	DYNAMIC_MSGS: 'dynamic_msgs',
	PACKAGES_CONTAINER: 'packages_container',
	PKG_PROGRESS: 'package_progress',
	MAJORS_NOT_SUPPORTED: 'majors_not_supported',
	DESC_PANEL: 'desc_panel',
	INSTALLED_HFS_WARNING: 'installed_hfs_warning',
	WAITING_WINDOW: 'waiting-window',
	FILTER_BTN: 'filter_btn',
	SHUTDOWN_PANEL: 'shutdown_panel',
	EVENT_LOG_BTN: 'event_log_btn',
	ABOUT_BTN: 'about_btn',
	UPDATE_STATUS_PANEL: 'update_status_panel',
	CHECK_FOR_UPDATE_BTN: 'check_for_update_btn',
	CHECK_FOR_UPDATE_TEXT: 'Check For Updates',
	IS_CATEGORY_COLLAPSED: new Ext.util.HashMap(),
	
	SUBMIT_URL: '/cgi-bin/installer.tcl',
	TEXT_TOO_LONG_MSG: '...<br>Text too long - see Event Log for full text.',
	
	// Packages status
	AVAILABLE_DOWNLOAD:		"1",
	DOWNLOADING: 			"2",
	AVAILABLE_INSTALL: 		"3",
	INSTALLING:				"4",
	INSTALLED:				"5",
	DOWNLOAD_FAILED:		"6",
	INSTALL_FAILED:			"7",
	UNINSTALLING:			"8",
	UNINSTALL_FAILED:		"9",
	PARTIALLY_DOWNLOADED:	"10",
	INSTALL_SKIPPED:		"11",
	INSTALL_CONTAINED:		"12",
	
	// Package types:
	TYPE_HOTFIX: 1,
	TYPE_OS: 2,
	TYPE_SELF_UPDATE: 3,
	TYPE_BUNDLE: 4,
	TYPE_MAJOR: 5,
	TYPE_REVERT: 6,
	TYPE_RELEASE: 7,
	TYPE_FULL_MINOR: 8,
	TYPE_LEGACY: 9,
	TYPE_LEGACY_MINI_WRAPPER: 10,

	// DA updates status
	UPDATES_ARE_NOT_AUTHORITHED_STATE: -2,
	CHECKING_FOR_UPDATES_STATE: -1,
	NO_UPDATES_FOUND_STATE: 0,

	// Package origin:
	PKG_ORIGIN_PRIVATE: 2,
	
	// Filter Status:
	FILTER_RECOMMENDED: 0,
	FILTER_INSTALLED: 1,
	FILTER_ALL: 2,
	
	//status icons
	INSTALLED_ICON_PATH: '../images/icons/status-icons_04.png',
	INSTALLED_WITH_ERRORS_ICON_PATH: '../images/icons/status-icons_12.png',
	INSTALLED_PENDING_REBOOT_ICON_PATH: '../images/icons/installed_pending_reboot.png',
	UNINSTALLED_PENDING_REBOOT_ICON_PATH: '../images/icons/download_pending_reboot.png',
	AVAILABLE_FOR_DOWNLOAD_ICON_PATH: '../images/icons/download.png',
	AVAILABLE_FOR_INSTALL_ICON_PATH: '../images/icons/install.png',
	DOWNLOADED_FOR_DIFFERENT_VERSION_ICON_PATH: '../images/icons/download_grey.png',
	EMPTY_ICON_PATH: '../images/icons/empty.png',
	DOWNLOAD_PAUSE_ICON_PATH: '../images/icons/pause_download.png',
	FAILURE_MESSAGE_ICON: '../images/icons/status-icons_05.png',
	WARNING_MESSAGE_ICON: '../images/icons/status-icons_09.png',
	INFORMATION_MESSAGE_ICON: '../images/icons/status-icons_06.png',
	CONTAINED_ICON: '../images/icons/grey.png',
	PROGRESS_ANIMATION_ICON_PATH: '../images/icons/progress_animation.gif',
	
	//type icons
	HOTFIX_ICON_PATH: '../images/icons/hotfix.png',
	MAJOR_ICON_PATH: '../images/icons/major.png',
	MINOR_ICON_PATH: '../images/icons/minor.png',
	
	//tag icons
	LATEST_ICON_PATH: '../images/icons/recommended_package.png',
	PACKAGE_ICON_PATH: '../images/icons/package.png',
	BANNER_RIGHT: '../images/mainframe/banner_right.png',
	BANNER_LEFT: '../images/mainframe/banner_left.png',
	
	LATEST_TAG: 'latest',
	CUMULATIVE_TAG: 'cumulative',
	CRITICAL_TAG: 'critical',
	HIGH_TAG: 'high',
	PRIVATE_TAG: 'private',
	EA_TAG: 'Early_Availability',
	BETA_TAG: 'beta',
	IMPORTANCE_TAG: 'importance',
	
	LATEST_TAG_TEXT: 'recommended for installation',
	CUMULATIVE_TAG_TEXT: 'contained in another package',
	CUMULATIVE_TAG_TEXT_GREY: 'contained in another package (grey)',
	CRITICAL_TAG_TEXT: 'critical',
	HIGH_TAG_TEXT: 'High',
	PRIVATE_TAG_TEXT: 'Private',
	EA_TAG_TEXT: 'Early Availability',
	BETA_TAG_TEXT: 'Beta',
	CONTEXT_ITEM: 'context_item_',
	
	LATEST_TAG_ICON: '<img style="vertical-align:middle" src=../images/icons/recommended_package.png>',
	LATEST_TAG_GREY_ICON: '<img style="vertical-align:middle;opacity:0.5;filter:alpha(opacity=50)"  src=../images/icons/recommended_package.png>',
	CUMULATIVE_TAG_GREY_ICON: '<img style="vertical-align:middle;opacity:0.5;filter:alpha(opacity=50)"  src=../images/icons/package.png>',
	CUMULATIVE_TAG_ICON: '<img style="vertical-align:middle"  src=../images/icons/package.png>',
	
	PRIV_PKG_DISPLAY_NAME: "",
	PRIV_PKG_FILE_NAME: "",
	PRIV_PKG_FILE_NAME_TMP: "",//TODO: add it to window close event after adding progress
	PRIV_PKG_ID: "",
	package_entered_grid: 0,
	store: Ext.create('CP.WebUI4.JsonStore',{
			autoLoad: false,
			fields: [ 
				'package_name', 
				'status', //status of the package from DB (numeric)
				'saved_status',  //holds the package status inside local veritable  
				'status_text', //status of the package from DB (text)
				'local_status_text',  //holds the local status text to display in the UI
				'dont_display_progress', //boolean var - indicates if the progress (%) should be displayed.
				'progress', 
				'pkgkey', 
				'size', 
				'pkg_type', 
				'pkg_type_modified', 
				'd_time_sec', 
				'd_time_usec', 
				'd_complete', 
				'i_complete', 
				'u_complete', 
				'i_log_file', 
				'u_log_file', 
				'available_from', 
				'downloaded_on', 
				'installed_on', 
				'description',  
				'chk_description', 
				'self_update', 
				'd_failed', 
				'i_failed', 
				'u_failed', 
				'd_failed_time', 
				'i_failed_time', 
				'u_failed_time', 
				'bundle_err',
				'check_install_res',
				'pending_reboot',
				'part_of_major',
				'check_install_success',
				'disable_upgrade',
				'self_test_res',
				'is_pkg_in_repository',
				'display_name',
				'legacy_hotfix',
				'old_state',
				'brought_version',
				'package_tags',
				'product',
				'package_parent',
				'package_child',
				'origin',
				'package_conflict',
				'installed_deps',
				'uninstalled_deps',
				'sort_index',
				'sort_group',
				'available_from_sort',
				'block_uninstall',
				'patching_failure_detected'
			],
			groupField:'pkg_type_modified',
			sorters: [{
					property: 'available_from_sort',
					direction: 'DESC'
			}],
			listeners: {
				datachanged: function() {
					var table = Ext.getCmp(CP.Packages.GRID_ID);
					if (!table)
						return;

					CP.Packages.selectionChange();
				}
			}
		})
	
	,supressFailLockMsg: function() {
		CP.global.supress_update_msg=1;
		CP.Packages.supress_update_counter++;
	}
	
	,supressUnableToConnectMsg: function() {
		CP.global.isRebooting = true;
		CP.Packages.isRebooting_counter++;
	}
	
	,unsupressFailLockMsg: function() {
		/*if (--CP.Packages.supress_update_counter <= 0) 
			CP.global.supress_update_msg = 0;*/
		CP.Packages.supress_update_counter--; 
		// do nothing...
	}
	
	,unsupressUnableToConnectMsg: function() {
		/*if (--CP.Packages.isRebooting_counter <= 0) 
			CP.global.isRebooting = false;*/
		CP.Packages.isRebooting_counter--;
		// do nothing...
	}
	
	,overrideLock: function() {
		if (CP.global.token == -1) {
			CP.global.token = 0;
			CP.util.configLock_req("override");
		}
	}
	
	,getIsMds: function() {
		Ext.Ajax.request({
			url: "/cgi-bin/upgrade.tcl",
			method: "GET",
			params: {
				action: 'get_upload_path'
			},
			success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);

				if (jsonData.data && jsonData.data.is_mds) {
					CP.Packages.is_mds = jsonData.data.is_mds;
				}
			},
			failure: function() {
				if (CP.Packages.isInPage==true) {
					setTimeout("CP.Packages.getIsMds();", 1000); // polling
				}
			}
		});
	}
	
	,getDisplayLegacyStatus: function() {
		Ext.Ajax.request({
			url: "/cgi-bin/installer_policy.tcl",
			method: "GET",
			success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				if (jsonData.data && jsonData.data.legacy_display) {
					if (jsonData.data.legacy_display == "true"){
						CP.Packages.legacy_display_status = true;
					}
					else {
						CP.Packages.legacy_display_status = false;
					}
						
				}
			},
			failure: function() {
				setTimeout("CP.Packages.getDisplayLegacyStatus();", 1000); // polling
			}
		});
	}
	
	,getMachineDetails: function() {
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: "GET",
			params: {
				get_machine_details: 1
			},
			success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				if (jsonData)
				{
					if (jsonData.cur_version != "")
						CP.Packages.MACHINE_VERSION = jsonData.cur_version;
					if (jsonData.os_build != "")
						CP.Packages.OS_BUILD = jsonData.os_build;						
				}
			},
			failure: function() {
				setTimeout("CP.Packages.getMachineDetails();", 1000); // polling
			}
		});
	}

	,getEventLogMessages: function() {
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: "GET",
			params: {
				get_event_log_messages: 1
			},
			success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				if (jsonData)
				{
					if (jsonData.msgsList) {
						CP.Packages.showEventLogMessages(jsonData.msgsList);
					}
				}
			},
			failure: function() {
				setTimeout("CP.Packages.getEventLogMessages();", 1000); // polling
			}
		});
	}

	// init: builds the page
	,init:function() {

		CP.Packages.msgsTimeStamp = 0;
		
		CP.Packages.while_updating_window_open = false;
		CP.Packages.critical_installation_window_open = false;
		CP.Packages.critical_installation_in_progress = false;
		CP.Packages.last_status = CP.Packages.AVAILABLE_DOWNLOAD;
		CP.Packages.last_progress = "0";

		if (undefined == CP.global.filterStatus)	
		{
			CP.global.filterStatus=CP.Packages.FILTER_RECOMMENDED;
		}
		Ext.define('Ext.ux.grid.column.DAProgress', {
			extend: 'Ext.grid.column.Column'
			,alias: 'widget.suprogresscolumn'
			
			,cls: 'x-progress-column-su-new'
			,progressCls: 'x-progress'
			,progressText: '{0} %'
			,constructor: function(config){
				var me = this
				,cfg = Ext.apply({}, config)
				,cls = me.progressCls;
	
				me.callParent([cfg]);
	
				// Renderer closure iterates through items creating an <img> element for each and tagging with an identifying 
				// class name x-action-col-{n}
				me.renderer = function(v, meta, record, rowIndex, colIndex, store, view) {
					//meta- tdls,style
					var text, newWidth;
					
					var status_str='';
					var color="black";
					var status="";
					switch (record.data.status) {
						case 1: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.AVAILABLE_FOR_DOWNLOAD_ICON_PATH+'> Available for Download';
						} break;
						case 2: { 
							status = "Downloading: "; 
							if (record.data.local_status_text=="Pausing Download") 
							{
								status="Pausing Download";
							}
						} break;
						case 3: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.AVAILABLE_FOR_INSTALL_ICON_PATH+'> Downloaded Successfully';
							if (record.data.local_status_text=="Initiating Install") 
							{
								status="Initiating Install";
								color="black";
							}
							if ((record.data.pending_reboot) && (record.data.pending_reboot != ""))
							{
								status='<img style="vertical-align:middle" src='+CP.Packages.UNINSTALLED_PENDING_REBOOT_ICON_PATH+'><span style="color:'+CP.Packages.GREY_COLOR+'"> Uninstalled, pending reboot</span>';
							}
							if (CP.Packages.isDownloadedForDiffVersion(record.data))
							{
								status='<img style="vertical-align:middle" src='+CP.Packages.DOWNLOADED_FOR_DIFFERENT_VERSION_ICON_PATH+'><span style="color:'+CP.Packages.GREY_COLOR+'"> Downloaded for Different Version</span>';
							}
						} break;
						case 4: 
						{ 
							status = "Installing: "; 
						} break;
						case 5: { 
							if (record.data.bundle_err=="1") {
								status='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_WITH_ERRORS_ICON_PATH+'> Installed with errors';
							} else {
								if (record.data.local_status_text=="Initiating Uninstall") 
								{
									status="Initiating Uninstall";
									color="black";
								}
								else if (record.data.self_test_res=="success") {
									status='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_ICON_PATH+'> Installed, self-test passed';
								} 
								else if (record.data.self_test_res=="failure") {
									status='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_WITH_ERRORS_ICON_PATH+'> Installed, self-test failed';
								} 
								else if (((record.data.legacy_hotfix=="1") || (record.data.legacy_hotfix=="2")) && ((record.data.part_of_major) && (record.data.part_of_major == "1"))) {
									status='<img style="vertical-align:middle" src='+CP.Packages.CONTAINED_ICON+'><span style="color:'+CP.Packages.GREY_COLOR+'"> Installed</span>';
								}
								else 
								{
										status='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_ICON_PATH+'> Installed';
								}
								
								if ((record.data.pending_reboot) && (record.data.pending_reboot != "")) {
									status='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_PENDING_REBOOT_ICON_PATH+'><span style="color:'+CP.Packages.GREY_COLOR+'"> Installed, pending reboot</span>';
								}
							}
						} break;
						case 6: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+ '> Download Failed';
						} break;
						case 7: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+ '> Install Failed';
						} break;
						case 8: 
						{ 
							if(CP.Packages.isUninstallableLegacy(record.data)){
								status='<img style="vertical-align:middle" src='+CP.Packages.PROGRESS_ANIMATION_ICON_PATH+ '> Uninstalling ';
							}else{
								status = "Uninstalling: "; 
							}	
						} break;
						case 9: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+ '> Uninstall Failed';
						} break;
						case 10: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.DOWNLOAD_PAUSE_ICON_PATH+'> Partially Downloaded';
						} break;
						case 11: { 
							status='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+ '> Install Skipped';
						} break;
						case 12: { 
							if(CP.Packages.isDeletebleStatus(record.data.old_state))
							{
								status='<img style="vertical-align:middle" src='+CP.Packages.CONTAINED_ICON+ '> <span style="color:'+CP.Packages.GREY_COLOR+'"> Downloaded, Installed As Part Of Another Package</span>';								
							}
							else
							{
								status='<img style="vertical-align:middle" src='+CP.Packages.CONTAINED_ICON+ '> <span style="color:'+CP.Packages.GREY_COLOR+'"> Installed As Part Of Another Package</span>';
							}		
						} break;
						default: { status = record.data.status; } break;
					}
						
					status_str = '<span style="color:'+color+';">'+status;
					var status_num = +record.data.status;
					// If we're not currently downloading, installing and uninstalling, return just the string for the status colum
					if ((status_num!=2 && status_num!=4 && status_num!=8) || status_num==0 || record.data.dont_display_progress == 1 || CP.Packages.isUninstallableLegacy(record.data))
					{
						if (record.data.local_status_text.length == 0) //display the final status - available for download, install failed, ...
						{
							status_str = status_str	+ '</span>';
							return status_str;
						}
						else //display the initiating..... message
						{	
							color="black";
							status_str = '<span style="color:'+color+';">'+record.data.local_status_text+ '</span>';
							return status_str;
						}
					}
					// Otherwise, keep calc and compute the progress bar, for those states (downloading, installing or uninstalling)
					//
					if (0 == (record.data.status_text.length))
					{ // If there is no textual status - use the numerical status instead
						status_str+='</span>';
					}
					else	
					{ // textual status - use it	
						status_str=record.data.status_text;
						color="black";
					}
					
					var style = '';
					
					var progress = Number(record.data.progress);
					var textClass = (progress < 55) ? 'x-progress-col-text-back' : 'x-progress-col-text-front' + (Ext.isIE6 ? '-ie6' : '');
					
					progress = Ext.isFunction(cfg.renderer) ? cfg.renderer.apply(this, arguments)||progress : progress; //this = renderer scope
					var my_text = status_str + Ext.String.format(me.progressText,Math.round(progress*100)/100);
						
					var text =  Ext.String.format('</div><div class="x-progress-col-text {0}" id="{1}">{2}</div></div>',
							  textClass, Ext.id(), my_text
							);
					//text = (progress<100) ? text.substring(0, text.length - 6) : text.substr(6);
					text = text.substring(0, text.length - 6);
					meta.tdCls += 'x-grid3-progresscol';
					meta.style = "padding:0;";
					
					return Ext.String.format(
					  '<div class="x-progress-col-wrap"><div class="x-progress-col-inner"><div class="x-progress-col-bar" style="width:{1}%;">{0}</div>' +
					  '</div></div>', text, progress-2
					);
					 
				};    
				
			}//eof constructor

			,destroy: function() {
				delete this.renderer;
				return this.callParent(arguments);
			}//eof destroy
			
		}); //eo extend
		
		var shutdown_panel= Ext.getCmp(CP.Packages.SHUTDOWN_PANEL);
		if (shutdown_panel) {
			shutdown_panel.destroy();
		}
		var waiting_window = Ext.getCmp(CP.Packages.WAITING_WINDOW);
		if (waiting_window) {
			waiting_window.destroy();
		}

		var page_items=CP.Packages.getPageItems();
		
				
		var page = {
			title: "Packages",
			afterSubmit: function(){
				var upg_table=Ext.getCmp('upgrade-grid');
				if (upg_table && upg_table.getStore())
					upg_table.getStore().load();
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
						var win=Ext.getCmp( 'upgrade_upload_window' );
						if (win)
							win.show();
					}
				});
			},
			panel: Ext.create('CP.WebUI4.DataFormPanel', {
				id: CP.Packages.EXT4_PANEL_ID,
				margin: '0 24 0 24 !important',
				autoHeight: 'true !important',
				items: [ page_items ]
			})
		}

		CP.Packages.isInPage=true;
		CP.Packages.getIsMds();
		
		CP.Packages.getDisplayLegacyStatus();
		CP.Packages.getMachineDetails();

		//show the page
		CP.UI.updateDataPanel( page );
		
		var table = Ext.getCmp(CP.Packages.GRID_ID);
		if (table) {
			table.setLoading(true);
			table.down('.headercontainer').on('sortchange', function(ct, column, direction) {
				if (column.id==CP.Packages.PKG_PROGRESS) {
					CP.Packages.store.sort('status',direction); // fix for sorting the progress column (usually it is sorted using the progress data, not the status data)
				}
				CP.Packages.selectionChange();
			});
			/*
			var pkg_category=table.getView().getHeaderCt().child('#package_category');
			if (pkg_category) {
				pkg_category.hide();
			}
			*/
		}
		
		// Creating a task that reloads the information in the packages table using an Ajax request
		/**** consider using createFrequentRequestRunnable from CP.util ****/
		CP.Packages.task = new Ext.util.DelayedTask (function() {				
			var table = Ext.getCmp(CP.Packages.GRID_ID);
				
			if (!table) {
				CP.Packages.task.delay(50);
				return;
			}
					
			CP.Packages.getData(table);
			if (CP.Packages.connection_fail_counter>CP.Packages.MAX_FAILED_CONNECTIONS) {
				CP.Packages.connection_fail_counter=0;
				conn_error_msg="Error: Failed to connect to the Gaia server";
				CP.WebUI4.Msg.show({
					closable: true,
					title: 'Connection Error',
					msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+conn_error_msg+'</span>',
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.ERROR,
					id: 'connection_error'
				});
			}
		});
		CP.Packages.task.delay(0);
	 
		// adding a listener that will stop the update task when the main panel is removed (e.g. the user leaves the page)
		page.panel.addListener("removed", function() {
			if (CP.Packages.task)
				CP.Packages.task.cancel();

			CP.Packages.isInPage=false; // We are no longer in the Status & Actions page

			// remove all suppressions
			CP.global.supress_update_msg=0;
			CP.global.isRebooting = false;
			
			//when exiting the page - destory the hidden event log window if exist
			var win = Ext.getCmp('Importatnt_message_window');
			if(win){
				win.removeAll(false);
				win.destroy();
			}
		});
	}
	
	,showPerformingSelfUpdateWindow: function(){
		var winTitle = 'Performing Update';
		var content = 'Please wait while updating the Deployment Agent.';
		var window = Ext.create('CP.WebUI4.ModalWin', {
			id: CP.Packages.WAITING_WINDOW,
			autoShow: true,
			title: winTitle,
			layout:"fit",
			autoWidth: true,
			plain: true,
			closable: false,
			autoHeight: true,
			items: [{						
				xtype: 'cp4_panel',
				id: CP.Packages.SHUTDOWN_PANEL,
				border: false,
				padding: 25,
				cls: "shutdown",
				html: content						
			}],
			listeners: {
				beforeclose: function() {
					CP.Packages.while_updating_window_open = false;					
				},
				show: function() {
					CP.Packages.while_updating_window_open = true;					
				}
			}
		}).setWidth(content.length*6+50);
	}
	
	,NewAgentWindow: function(){
		var myparams = {};
			
		var lockAlignment = (Ext.firefoxVersion) ? "top" : "center";  // (Ext.firefoxVersion==0) if not FF
		Ext.create( 'CP.WebUI4.ModalWin',{
			id: "newVersion-window",
			title: 'Check Point Upgrade Service Engine Update',
			width: 350,
			height: 250,
			closable: false,
			items: [{
				xtype: 'cp4_formpanel',
				id : 'newVersion_formpanel',
				bodyPadding: 10,
				items: [{
					xtype: 'cp4_container',
					items: [{
						xtype: 'cp4_container',
						style: 'font-size: 18px ; font-weight: bold',
						margin: '0 0 15 10',
						html: 'New Deployment Agent Available'
					},{
						xtype: 'cp4_container',
						style: 'font-size: 13px ; font-weight: normal',
						margin: '0 0 0 10',
						html: 'Before you continue with CPUSE actions, update to the latest Deployment Agent version.'
					},{
						xtype: 'cp4_container',
						style: 'font-size: 13px ; font-weight: normal',
						margin: '0 0 15 10',
						//html: 'in order to perform any action.'
						html: ''
							   
					},{
						xtype: 'cp4_container',
						layout: {
							type: 'hbox'
						},
						margin: '0 0 1 10',
						items: [{
							xtype: 'cp4_container',
							id : 'new_version_install_loading',
							html: '<img src="../images/icons/progress_animation.gif" width="25" height="25" align='+lockAlignment +' />',
							hidden : true
						},
						{
							xtype: 'cp4_container',
							id : 'new_version_install_loading_error',
							html: '<img src="../images/icons/status-icons_09.png" width="25" height="25" align='+lockAlignment +' />',
							hidden : true
						},{
							xtype: 'cp4_label',
							style: 'font-size: 13px ; font-weight: normal',
							id : 'new_version_install_loading_text',
							margin: '0 0 0 10',
							text: "Downloading (0%)",
							hidden : true
						}]
					}]
				}],
				buttons: [{
					text: 'Update',
					id:"NV-btn-install",
					xtype: 'cp4_button',
					handler: function(){
						
						CP.Packages.overrideLock();
						Ext.getCmp("NV-btn-install").disable();
						Ext.getCmp("NV-btn-cancel").disable();						
						
						if( CP.Packages.self_update_status ==CP.Packages.AVAILABLE_INSTALL ||  CP.Packages.self_update_status ==CP.Packages.INSTALL_FAILED) {
							myparams["install"] = CP.Packages.self_update;	
						}
						else{
							myparams["download"] = CP.Packages.self_update;
							myparams["download_and_install"] = CP.Packages.self_update;							
						}

						// performing the required action
						CP.Packages.supressFailLockMsg();
						Ext.Ajax.request({
							url: CP.Packages.SUBMIT_URL,
							method: "POST",
							params: myparams,
							success: function(response) {
								CP.Packages.critical_installation_in_progress = true;
								CP.Packages.last_status = CP.Packages.self_update_status.toString();
								CP.Packages.last_progress = "0";
								CP.Packages.install_id++;
								CP.Packages.connection_fail_counter=0;
								CP.Packages.unsupressFailLockMsg();
							},
							failure: function() { 
								
								CP.Packages.connection_fail_counter++;
								CP.Packages.unsupressFailLockMsg();
							}
						});
						
					}
				},{
					text: 'Cancel',
					id:"NV-btn-cancel",
					xtype: 'cp4_button',
					handler: function(){
						Ext.getCmp( 'newVersion-window' ).close();						
					}
				}]
			}],
			listeners: {
				show: function() {
					Ext.getCmp( 'new_version_install_loading' ).hide();
					Ext.getCmp( 'new_version_install_loading_error' ).hide();
					Ext.getCmp( 'new_version_install_loading_text' ).hide();	
					CP.Packages.critical_installation_window_open = true;
				},
				beforeclose: function() {
					CP.Packages.critical_installation_window_open = false;
					CP.Packages.critical_installation_in_progress = false;
				}
			}
		}).show();
		
	}

	,resumeRunning: function(res) {
		var shutdown_panel= Ext.getCmp(CP.Packages.SHUTDOWN_PANEL);
		if (shutdown_panel) {
			shutdown_panel.destroy();
		}
		var waiting_window=Ext.getCmp(CP.Packages.WAITING_WINDOW);
		if (waiting_window) {
			waiting_window.destroy();
		}
		CP.Packages.supressPopups=false;
		CP.Packages.unsupressUnableToConnectMsg();
		CP.Packages.unsupressFailLockMsg();
		if (CP.Packages.task)
			CP.Packages.task.delay(50);
		CP.Packages.handleResponse(res);
	}
	
	,pollRequest: function() {
		CP.Packages.supressFailLockMsg();
		CP.Packages.supressUnableToConnectMsg();
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'GET',
			success: function(res) {
				var poll_success=true;
				if (CP.Packages.poll_expected_res && CP.Packages.poll_expected_res!="") { // expecting a specific result from the poll
					poll_success=false;					
					var jsonData = Ext.decode(res.responseText,true);
					if (jsonData && (jsonData.poll_parameter == CP.Packages.poll_expected_res)) { 
						poll_success=true;
						CP.Packages.poll_expected_res="";
					}
				}
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
				if (poll_success) {
					CP.Packages.reboot_performed="successful";
					CP.Packages.resumeRunning(res);
				} else {
					setTimeout("CP.Packages.pollRequest()", 1000); // polling
				}
			},
			failure: function() {
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
				CP.Packages.pollRequest(); // polling
			}
		});
	}

	,initiate_da_update_check: function() {
		var update_check_task = new  Ext.util.DelayedTask (function(){
			CP.Packages.supressFailLockMsg();
			CP.Packages.supressUnableToConnectMsg();
			CP.Packages.overrideLock();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: {update_now:"1"},
				success: function(res) {
					CP.Packages.connection_fail_counter=0;
					CP.Packages.unsupressFailLockMsg();
					CP.Packages.unsupressUnableToConnectMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg();
					CP.Packages.unsupressUnableToConnectMsg();
				}
			});
		});
		update_check_task.delay(500);
	}
	
	,getData: function(table) {		
		CP.Packages.supressFailLockMsg();
		CP.Packages.supressUnableToConnectMsg();
		var myparams={session_id: CP.Packages.session_id};
		
		if(CP.Packages.PRIV_PKG_FILE_NAME!="")
		{	//Search By ID: After selection of a private package need to give the user an indication of the progress				
			 myparams = {session_id: CP.Packages.session_id,priv_pkg_name_val:CP.Packages.PRIV_PKG_FILE_NAME};
		}
		var myRequest=Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'GET',
			params: myparams,
			sentAutomaticaly: !CP.Packages.packageRunning, // only reset the session timeout if no package is running
			success: function(response) {
				CP.Packages.connection_fail_counter=0;
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
				CP.Packages.handleResponse(response);
				if (CP.Packages.first_getData_succeeded === false) {
					CP.Packages.first_getData_succeeded = true;						
				};
			},
			failure: function() { 
				CP.Packages.connection_fail_counter++;
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
			},
			callback: function() {
				if (CP.Packages.task)
					CP.Packages.task.delay(1000);
			}
		});
	}
	
	,showRebootingWindow: function(winTitle, content, myparams, pollingDelay) {
		CP.Packages.supressPopups=true;
		CP.Packages.supressFailLockMsg();
		CP.Packages.supressUnableToConnectMsg();
		CP.Packages.overrideLock();
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'POST',
			params: myparams,
			success: function() {
				CP.Packages.connection_fail_counter=0;
				if (CP.Packages.task)
					CP.Packages.task.cancel();
				CP.util.rebootingWindow(winTitle, content, pollingDelay);
			},
			failure: function() {
				CP.Packages.connection_fail_counter++;
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
			}
		});
		
	}
	
	,showWaitingWindow: function(winTitle, content, myparams, pollingDelay) {
		if (CP.Packages.task)
			CP.Packages.task.cancel();
		CP.Packages.overrideLock();
		CP.Packages.supressPopups=true;
		var shutdown_panel={
			xtype: 'cp4_panel'
			,border: false
			,padding: 25
			,cls: "shutdown"
			,html: content
			,id: CP.Packages.SHUTDOWN_PANEL
		};
		var window = Ext.getCmp(CP.Packages.WAITING_WINDOW);
		if (!window)
		{
			window = Ext.create('CP.WebUI4.ModalWin', {
				id: CP.Packages.WAITING_WINDOW
				,autoShow: true
				,title:winTitle
				,layout:"fit"
				//,width: 450
				,autoWidth: true
				,plain: true
				//,modal: true
				//,forceFit: true
				,closable: false
				//,height:160
				,autoHeight: true
				,items: [ shutdown_panel ]				
			}).setWidth(content.length*6+50);
		}
		CP.Packages.supressFailLockMsg();
		CP.Packages.supressUnableToConnectMsg();
		myparams["del_poll_parameter"]='true'; // deleting the polling parameter before showing the window
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'POST',
			params: myparams,
			success: function(response) {
				//console.log("Show waiting window res: "+response.responseText);
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
				setTimeout("CP.Packages.pollRequest()", pollingDelay);
			},
			failure: function() {
				CP.Packages.unsupressFailLockMsg();
				CP.Packages.unsupressUnableToConnectMsg();
				setTimeout("CP.Packages.pollRequest()", pollingDelay);
			}
		});
	}
	
	,selectionChange: function(selected) {
		CP.Packages.disableButtons();

		if (!selected) {
			selected = CP.Packages.getSelectedPackage();
		}
		if (!selected || !selected.data) {
			return;
		}

		if (!CP.Packages.IS_CATEGORY_COLLAPSED.get(selected.data.pkg_type_modified)) {
			CP.Packages.enableButtons(selected);
		}
				
		CP.Packages.updatePackageDescription();
	}

	,resolveUpdateStatus: function(status, last_update_time, connection_error_msg) {

		if (CP.Packages.isDArunning == false) {
			Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN).disable();
			return "Update actions disabled";
		}

		if (status == CP.Packages.UPDATES_ARE_NOT_AUTHORITHED_STATE) {			
			return "";
		}
		
		if (status == CP.Packages.CHECKING_FOR_UPDATES_STATE){ // update in progress
			Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN).disable();
			CP.Packages.UPDATE_COMPLETE_TIMESTAMP = "";
			CP.Packages.connection_error_msg = "";
			return "<img src='../images/icons/indicator.gif' height=10px width=10px> Checking for new available packages...";
		}
			
		if ( !( (CP.global.token == -1) || (CP.UI.accessMode == 'ro') ) )  { // the portal is not locked or in 'read only' mode
			Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN).enable();
		}
		else {
			Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN).disable();
		}

		if (CP.Packages.connection_error_msg != CP.Packages.CONNECTION_NO_STATE) {  // update connection_error_msg just if "check for update" performed
			CP.Packages.connection_error_msg = connection_error_msg;
		}
		
		if (status == CP.Packages.NO_UPDATES_FOUND_STATE)
		{ //update cycle completed and no new updates found
			if ( CP.Packages.UPDATE_COMPLETE_TIMESTAMP == "")
			{
				var d = new Date(last_update_time);								
				CP.Packages.UPDATE_COMPLETE_TIMESTAMP = "Last updated on: " + Ext.Date.format(d,'D M j G:i Y');
			}
			return CP.Packages.UPDATE_COMPLETE_TIMESTAMP;
		
		}
		//update cycle completed and  new updates found
		if (status == 1)
		{
			return "Found "+status +" new package";
		}
		else
		{
			return "Found "+status +" new packages";
		}
	}

	,hidePackages: function(table,package_name) {
		if (!table || !package_name)
			return;
		
		if (package_name != -1) { //if given specific package name - hide it
			var pkg_id = CP.Packages.store.findExact('package_name',package_name); 
			if (pkg_id != -1 && table.view.all.elements[pkg_id])
				table.view.all.elements[pkg_id].style.display='none';
		}	
		
		else 
		{ //otherwise find all dummy packages and hide them.
			for (var i=0; i < CP.Packages.store.getCount(); i++) { 
				var row_data=table.getStore().getAt(i).data;
				if (row_data.package_name.indexOf("DUMMY") > -1 && table.view.all.elements[i])
				{
					table.view.all.elements[i].style.display='none';
				}
			}
		}
	}
	
	,getSelectedPackage: function() {
		var table = Ext.getCmp(CP.Packages.GRID_ID);
		if (!table) {
			return;
		}
		
		var selection = table.getSelectionModel().getSelection();
		if (selection.length <= 0)
			return;
		
		return selection[0];
	}
	
	,getSelectedPackageField: function(fieldName) {
		var selected = CP.Packages.getSelectedPackage();
		if (!selected) {
			return;
		}
		
		return selected.get(fieldName);
	}
	
	,updateTable: function(table, jsonData) {
		if (jsonData && jsonData.data && jsonData.data.packages && table && (CP.Packages.store.getCount() > 0)) { // Keep "Initiating X" statuses
			if ((CP.Packages.PRIV_PKG_FILE_NAME!="") && jsonData.data.searchResGridDict && (CP.Packages.PRIV_PKG_FILE_NAME==jsonData.data.searchResGridDict.package_name) &&
					((jsonData.data.searchResGridDict.searchResEnterGridStatus==-1) || (jsonData.data.searchResGridDict.searchResEnterGridStatus==1)) ) {
				if (jsonData.data.searchResGridDict.searchResEnterGridStatus==-1) { //error in search - > close window
					Ext.getCmp('search-modal-window').close();
					CP.Packages.PRIV_PKG_FILE_NAME="";
					CP.Packages.PRIV_PKG_DISPLAY_NAME="";                   
				}
				else if (jsonData.data.searchResGridDict.searchResEnterGridStatus==1)//package will enter the grid
					CP.Packages.package_entered_grid = 1;
			}

			for (var i=0; i<jsonData.data.packages.length; i++) {
				// A private package is included in the JSON data
				if (jsonData.data.packages[i].package_name == CP.Packages.PRIV_PKG_FILE_NAME || jsonData.data.packages[i].package_name == CP.Packages.PRIV_PKG_FILE_NAME.replace(CP.Packages.TGZ_EXT,CP.Packages.FULL_EXT))
				{
					if (CP.Packages.package_entered_grid==1)
						Ext.getCmp('search-modal-window').close();     
					
					if (CP.global.filterStatus != CP.Packages.FILTER_ALL) {				
						CP.global.filterStatus = CP.Packages.FILTER_ALL;
						Ext.getCmp(CP.Packages.FILTER_BTN).menu.items.items[CP.global.filterStatus].setChecked(true,true);
						Ext.getCmp(CP.Packages.FILTER_BTN).setText("Showing "+CP.Packages.resolveFilterStatus(CP.global.filterStatus) + " packages");							
					}
				}
				
				var pkg_id = CP.Packages.store.findExact('package_name',jsonData.data.packages[i].package_name);
				if (pkg_id!=-1) {
					row_data = CP.Packages.store.getAt(pkg_id).data;
						
					if (row_data.saved_status != jsonData.data.packages[i].status)
					{ // status has changed since we saved it - clear the local status text
						row_data.local_status_text = ""; //clear the local status text var
						row_data.dont_display_progress = 0; //set the boolean display progress flag to false
					}
									
					if (row_data.local_status_text.length > 0)
					{
						jsonData.data.packages[i].status_text=row_data.local_status_text;
					}
				}
			}
		}
		
		var entered = new Array();
		CP.Packages.INSTALLED_PACKAGES = new Array();
		CP.Packages.INSTALLED_PACKAGES_CONTAINED = new Array();
		if (jsonData && jsonData.data && table) {
			CP.Packages.store.clearFilter();

			var num_rows = CP.Packages.store.getCount();
			for (var i = 0; i < jsonData.data.packages.length; i++) {
				var jsonPackage = jsonData.data.packages[i];
				var pkg_id = CP.Packages.store.findExact('package_name', jsonPackage.package_name);
				if (pkg_id == -1) { // new package
					CP.Packages.store.add(jsonPackage);
				} else { // update package 
					CP.Packages.store.getAt(pkg_id).set(jsonPackage);
				}
				
				//if the package installed - save the display name - for info card
				if ((jsonPackage.status) && (jsonPackage.status == CP.Packages.INSTALLED || jsonPackage.status == CP.Packages.UNINSTALL_FAILED)) {
					if (jsonData.data.packages[i].display_name != ""){
						if (CP.Packages.findInInstalledArray(jsonPackage.display_name) === false)
							CP.Packages.INSTALLED_PACKAGES.push(jsonPackage.display_name);
					}
					else if (CP.Packages.findInInstalledArray(jsonPackage.package_name) === false)
						CP.Packages.INSTALLED_PACKAGES.push(jsonPackage.package_name);
				}
				
				//if the package installed as part of- save the display name - for info card
				var packageStatus = jsonPackage.status;
				if (packageStatus == CP.Packages.INSTALL_CONTAINED) {
					if (jsonPackage.display_name != ""){
						if (Ext.Array.contains(CP.Packages.INSTALLED_PACKAGES_CONTAINED, jsonPackage.display_name) == false)
							CP.Packages.INSTALLED_PACKAGES_CONTAINED.push(jsonPackage.display_name);
					}
					else if (Ext.Array.contains(CP.Packages.INSTALLED_PACKAGES_CONTAINED, jsonPackage.package_name) == false)
						CP.Packages.INSTALLED_PACKAGES_CONTAINED.push(jsonPackage.package_name);
				} else if (packageStatus == CP.Packages.DOWNLOADING) {
					CP.Packages.downloadingInCategory[jsonPackage.pkg_type_modified]++;
				} else if (packageStatus == CP.Packages.INSTALLING) {
					CP.Packages.installingInCategory[jsonPackage.pkg_type_modified]++;
				}
				entered[jsonPackage.package_name] = 1;
			}
			
			//create dummy rows for the aligned categories
			
			var cat;
			for (cat in jsonData.data.categoryDict) {
				CP.Packages.downloadingInCategory[cat] = 0;
				CP.Packages.installingInCategory[cat] = 0;
				if ((cat != CP.Packages.TYPE_REVERT && cat != CP.Packages.TYPE_LEGACY && cat != CP.Packages.TYPE_LEGACY_MINI_WRAPPER && cat != CP.Packages.TYPE_SELF_UPDATE)){
					var name = "DUMMY" + cat;
					var pkg_id = CP.Packages.store.findExact('package_name',name);
					if (pkg_id == -1) { // new package
						CP.Packages.store.add({ // The dummy package must have the grouping field (currently pkg_type_modified) set to the category
							package_name: name, 
							display_name: name,
							status: 0,
							pkg_type: cat,
							pkg_type_modified: cat
						});
					}
					CP.Packages.DUMMY_CATEGORY_LIST[cat]=jsonData.data.categoryDict[cat];
					entered[name] = 1;
				}
			}

			// Remove packages that weren't in the latest response 
			for (var i = 0; i < CP.Packages.store.getCount(); i++) {
				var name = CP.Packages.store.getAt(i).get("package_name");
				if (entered[name] != 1) {
					CP.Packages.store.removeAt(i--);
				}
			}

			CP.Packages.store.sort();
			
			if (num_rows != CP.Packages.store.getCount()) { // the number of rows has changed
				CP.Packages.store.fireEvent('datachanged', CP.Packages.store);
			}
			
			CP.Packages.filterStore();
			CP.Packages.selectionChange();
			
			var desc_panel=Ext.getCmp(CP.Packages.DESCRIPTION_PANEL);
			var desc_title=Ext.getCmp(CP.Packages.DESC_TITLE);
			if (CP.Packages.store.getCount() === 0) { // no packages in table
				if (desc_panel)
					desc_panel.hide();
				if (desc_title)
					desc_title.hide();
				// disable the action buttons
				CP.Packages.disableButtons();
			} else {
				if (desc_panel)
					desc_panel.show();
				if (desc_title)
					desc_title.show();
			}

			if (CP.Packages.PRIV_PKG_FILE_NAME!="") {                                        
				var pkg_id = CP.Packages.store.findExact('package_name',CP.Packages.PRIV_PKG_FILE_NAME);
				if (pkg_id!=-1) {
					table.getSelectionModel().select(pkg_id);
				}             
			}
			
			//updateTable finished and the private package was added
			if (CP.Packages.package_entered_grid ==1) {
				CP.Packages.package_entered_grid=0;
				CP.Packages.PRIV_PKG_FILE_NAME="";
				CP.Packages.PRIV_PKG_DISPLAY_NAME="";
			}
			
			if (Ext.getCmp(CP.Packages.PACKAGES_CONTAINER)) { //fix component resize problem - the grip size doesn't  match the centre container size
				Ext.getCmp(CP.Packages.PACKAGES_CONTAINER).doLayout();
			}
		}
		table.setLoading(false);
	}
	
	,downloadSmartConsole: function() {
		location.href = _sstr+"/cgi-bin/download_dashboard.tcl?file=SmartConsole.exe";
	}

	,doDownload: function( filename ){
		location.href =  _sstr+"/cgi-bin/img_export.tcl?file="+filename;
		for (var i=0; i<CP.Packages.store.getCount(); i++) {
			if ((CP.Packages.store.getAt(i) == undefined) || (CP.Packages.store.getAt(i).data == undefined))
				continue;
			var new_package_name_table = CP.Packages.store.getAt(i).data.package_name.replace(/\.[^/.]+$/, ""); // removing the file extension
			var new_filename=filename.replace(/\.[^/.]+$/, ""); // removing the file extension
			if (new_filename==new_package_name_table) {
				// found the package in the table - remove the local status text
				CP.Packages.store.getAt(i).data.local_status_text="";
			}
		}
	}

	//IE browser cannot use indexOf function on arrays
	,findInMessageArray: function(element){
		for(var p in CP.Packages.SHOWN_AND_CLOSED_MESSAGES)
			if(CP.Packages.SHOWN_AND_CLOSED_MESSAGES[p] == element)
				return true;
		return false;
	}
	
	,findInInstalledArray: function(element){
		for(var p in CP.Packages.INSTALLED_PACKAGES)
			if(CP.Packages.INSTALLED_PACKAGES[p] == element)
				return true;
		return false;
	}
	
	,findInPopupArray: function(element){
		var counter = 0;
		for(var p in CP.Packages.TOOL_TIP_MESSAGES){
			if(CP.Packages.TOOL_TIP_MESSAGES[p].id != element)
				counter++;
		}
		return counter;
	}
	
	// find the file name is the packages list and return the suitable display name. if the file name does not exist - return empty string
	,convertFileNameToDisplayName: function(fileName){
		for (var i=0; i< CP.Packages.store.getCount(); i++) {
			var table_row_data= CP.Packages.store.getAt(i).data;
			// return the display name if exists and the file name - otherwise
			if (table_row_data.package_name == fileName) {
				if (table_row_data.display_name != "") {
					return table_row_data.display_name;
				}
				else {
					return table_row_data.package_name;
				}
			}
		}
		return "";
	}
	
	,handleResponse: function(response) {
		var table = Ext.getCmp(CP.Packages.GRID_ID);
		var jsonData = Ext.decode(response.responseText,true);
		if (!jsonData){
			if (CP.Packages.while_updating_window_open == true) { // lost connection while update window is open - most likely we restarted confd  
				CP.WebUI4.Msg.show({
					title: 'Information',
					msg: 'To continue the Deployment Agent update, you will be redirected to the login page.<br>Redirecting...',
					closable: false,
					icon: Ext.Msg.INFO					
				});
				setTimeout("CP.util.redirectToLogin()", 5000);
			} else {
				return;
			}
		}
		var i;
		
		if (jsonData.self_update_in_progress){
			if(jsonData.self_update_in_progress == "2" && CP.Packages.critical_installation_window_open == true){//already installation is in progress
				Ext.getCmp( 'newVersion-window' ).close();//close popup window if open
			}
			if (CP.Packages.while_updating_window_open == false && (jsonData.self_update_in_progress == "2" || CP.Packages.critical_installation_in_progress == false)) { // for users who did not initiate the self-update - show the "while updating" window
				CP.Packages.showPerformingSelfUpdateWindow(); // open while_updating window		
			}
		} else {
			if(CP.Packages.while_updating_window_open == true){//update is done
				CP.util.gotoPage('tree/installer');//refresh page	
			} else {
		                if (jsonData.da_updated == "1") { // for manual installations of DeploymentAgent using the rpm - we need to refresh the display
			                CP.util.gotoPage('tree/installer');
		                }
			}
		}

		CP.Packages.action_allowed = ((jsonData.no_da_actions_allowed) && (jsonData.no_da_actions_allowed != "")) ? false : true;
		CP.Packages.self_update='';
		CP.Packages.self_update_status=0;
		CP.Packages.current_version = jsonData.current_version;

		for (i=0; i<jsonData.data.packages.length; i++) {
			if (jsonData.data.packages[i].self_update==1) {
				CP.Packages.self_update=jsonData.data.packages[i].package_name;
				CP.Packages.self_update_status = jsonData.data.packages[i].status.toString();			
			}	
		}
		
		if (CP.Packages.critical_installation_in_progress == true) { // if this user initiated the self-update and it is in progress
			var package_number = CP.Packages.NOT_VALID_PACKAGE_NUMBER;
			var status = "";
			for (i=0; i<jsonData.data.packages.length; i++) { // finding the number of the installed self-update package
				if (jsonData.data.packages[i].package_name==CP.Packages.self_update)
					package_number = i;
			}
			
			if (package_number != CP.Packages.NOT_VALID_PACKAGE_NUMBER)	{
				var loadingText = Ext.getCmp("new_version_install_loading_text");
				var loadingSymbol = Ext.getCmp("new_version_install_loading");
				var loadingSymbol_Error = Ext.getCmp("new_version_install_loading_error");
				if (loadingSymbol_Error) 
				{
					loadingSymbol_Error.hide(); //just in case - some times the icon still visible
				}  
				switch (jsonData.data.packages[package_number].status.toString()) {

					case CP.Packages.AVAILABLE_DOWNLOAD: {
						if(CP.Packages.last_status.valueOf()<=CP.Packages.AVAILABLE_DOWNLOAD.valueOf()){
							CP.Packages.last_status = CP.Packages.AVAILABLE_DOWNLOAD;
							if(loadingText){
								loadingText.setText("Downloading (0%)");
								loadingText.show();
							}
							if(loadingSymbol){
								loadingSymbol.show();
							}
						}
					} break;
						
					case CP.Packages.DOWNLOADING: {
						if (CP.Packages.last_status.valueOf() == CP.Packages.DOWNLOADING.valueOf() || CP.Packages.last_status.valueOf() == CP.Packages.AVAILABLE_DOWNLOAD.valueOf() || CP.Packages.last_status.valueOf() == CP.Packages.DOWNLOAD_FAILED.valueOf()) {
							if(CP.Packages.last_progress == "0") {
								Ext.getCmp("new_version_install_loading_text").setText("Downloading (0%)");
							}
							CP.Packages.last_status = CP.Packages.DOWNLOADING;
							if (jsonData.data.packages[package_number].progress != '' && CP.Packages.last_progress.valueOf() <= jsonData.data.packages[package_number].progress.valueOf()){
								loadingText.setText("Downloading (" + jsonData.data.packages[package_number].progress + "%)" );
								CP.Packages.last_progress = jsonData.data.packages[package_number].progress;
							}
							if(loadingText){
								loadingText.show();
							}
							if(loadingSymbol){
								loadingSymbol.show();
							}
						}
					} break;
					
					case CP.Packages.AVAILABLE_INSTALL: {
						
						if (CP.Packages.last_status.valueOf() == CP.Packages.DOWNLOADING.valueOf()) {
							CP.Packages.last_status = CP.Packages.AVAILABLE_INSTALL;
							if(loadingText){
								loadingText.setText("Downloading (100%)");
								loadingText.show();
								}
							if(loadingSymbol){	
								loadingSymbol.show();
							}
						}
					} break;
					
					case CP.Packages.INSTALLING: {
						
						if (CP.Packages.last_status.valueOf() == CP.Packages.INSTALLING.valueOf() || CP.Packages.last_status.valueOf() == CP.Packages.AVAILABLE_INSTALL.valueOf() || CP.Packages.last_status.valueOf() == CP.Packages.DOWNLOADING.valueOf() ) { // sometimes the package status on the machine changes quickly and skips the available for install stage
							CP.Packages.last_status = CP.Packages.INSTALLING;
							if(loadingText){
								loadingText.setText("Installing...");
								loadingText.show();
							}
							if(loadingSymbol){
								loadingSymbol.show();
							}
						}
					} break;
					
					case CP.Packages.DOWNLOAD_FAILED:
					case CP.Packages.INSTALL_FAILED: {
						
							if (jsonData.data.packages[package_number].status.toString() == CP.Packages.DOWNLOAD_FAILED) {
								status="Download Failed - " + jsonData.data.packages[package_number].d_failed;
							} else {
								status="Installation Failed - " + jsonData.data.packages[package_number].i_failed;
							}
							if(loadingText){
								loadingText.setText(status);
								loadingText.show();
							}
							if(loadingSymbol){
								loadingSymbol.hide();
							}
							if (loadingSymbol_Error) {
								loadingSymbol_Error.show();
							}
							
							Ext.getCmp("NV-btn-cancel").setText("Close");
							Ext.getCmp("NV-btn-cancel").enable();
					} break;

					default: {  } break;
				}
			}
		}
		

		CP.Packages.popUpNewMessages(jsonData.data.messages);

		if ((jsonData.export_pkg_error!="") && (CP.Packages.session_id == jsonData.exported_session_id))
		{
			CP.WebUI4.Msg.show({
				closable: true,
				title: 'Disk Space Error',
				msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+jsonData.export_pkg_error+'</span>',
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR,
				id: 'space_check_error'
			});
		}
		if ((jsonData.ignore_critical=="1") || (jsonData.ignore_critical=="true")) {
			if (!CP.Packages.ignore_critical) {
				CP.Packages.ignore_critical=true;
				CP.Packages.store.fireEvent('datachanged', CP.Packages.store);
			}
		} else {
			if (CP.Packages.ignore_critical) {
				CP.Packages.ignore_critical=false;
				CP.Packages.store.fireEvent('datachanged', CP.Packages.store);
			}
		}

		var cur_ver_panel=Ext.getCmp(CP.Packages.CUR_VER_PANEL);
		var about_btn=Ext.getCmp(CP.Packages.ABOUT_BTN);
		CP.Packages.DA_VERSION = jsonData.da_build;
		if (cur_ver_panel)
			cur_ver_panel.update('<span style="color:#04408c; font-face=Arial; font-size: 9pt; font-weight: bold">Check Point Upgrade Service Engine (CPUSE)</span><span style="color:#4b4b4b; font-face=Arial; font-size: 9pt; font-weight: bold">&nbsp;&nbsp;|&nbsp;&nbsp'+CP.Packages.MACHINE_VERSION+' take '+ CP.Packages.OS_BUILD+ '</span>');//+'&nbsp;&nbsp;|&nbsp;&nbsp;</span><span style="color:black; font-size:'+CP.Packages.MSG_FONT_SIZE+'px">Agent Build Number: '+jsonData.da_build+'</span>');
		if(about_btn)
			about_btn.show();
		
		var dev_env_msg=Ext.getCmp('dev_env_msg');
		if (dev_env_msg) {
			if (jsonData.dev_env == 1 && CP.Packages.findInMessageArray('dev_env_msg') == false) {
				dev_env_msg.show();
			} else {
				dev_env_msg.hide();
			}
		}
		
		var status_panel = Ext.getCmp(CP.Packages.UPDATE_STATUS_PANEL);
		if (status_panel){
			status_panel.update('<span style="color:#4b4b4b; font-face=Arial; font-size: 9pt; font-weight: regular ">' + CP.Packages.resolveUpdateStatus(jsonData.update_status, jsonData.last_update_time, jsonData.connection_error_msg) +'</span>');
			status_panel.show();
		}
		
		if (jsonData.pkg_run_complete==1)
			CP.Packages.packageRunning = false;
			
		if (jsonData.pkg_run_started==1)
			CP.Packages.packageRunning = true;
					
		if (jsonData.export_download)
		{
			CP.Packages.doDownload(jsonData.export_download);
		}
		if (jsonData.download_smartconsole=="1")
		{
			CP.Packages.downloadSmartConsole();
		}
		if (jsonData.majors_not_supported=="1")
		{
			CP.Packages.DISPLAY_MAJORS = false;
		}
		else
		{
			CP.Packages.DISPLAY_MAJORS = true;
		}
		
		CP.Packages.updateTable(table,jsonData);
		if (0 == CP.Packages.IS_CATEGORY_COLLAPSED.getCount())
			{//initalize to false
				var groups = CP.Packages.store.getGroups(); //  
				for (i = 0; i < groups.length; i++)
				{
					if (CP.Packages.IS_CATEGORY_COLLAPSED[groups[i].name] == undefined)//groups[i].name = pkg type
						{
							CP.Packages.IS_CATEGORY_COLLAPSED.add(groups[i].name, false);
						}
				}
			}
		
		if (jsonData.check_install_res != "") {
			if (CP.global.token!=-1) {
				Ext.getCmp(CP.Packages.CHK_BTN).show();
			}
			var icon=(jsonData.check_install_res == "success")?'webui-msg-ok':((jsonData.check_install_res == "failure")?Ext.Msg.ERROR:Ext.Msg.WARNING);
			var textTooLong = false;
			if (jsonData.check_install_details.length > CP.Packages.MAX_STRING_SIZE_IN_VERIFIER_RESULTS)
			{
				jsonData.check_install_details =jsonData.check_install_details.substr(0,CP.Packages.MAX_STRING_SIZE_IN_VERIFIER_RESULTS);// + CP.Packages.TEXT_TOO_LONG_MSG;
				textTooLong = true;
			}
			if (jsonData.check_install_details.match(/<br>/gi).length > CP.Packages.MAX_ROWS_IN_VERIFIER_RESULTS) 
			{
				var arrayOfStrings = jsonData.check_install_details.split(/<br>/);
				jsonData.check_install_details ="";
				for (var i=0; i < CP.Packages.MAX_ROWS_IN_VERIFIER_RESULTS; i++) 
				{
					if (undefined != arrayOfStrings[i])
					{
						jsonData.check_install_details += "<br>" + arrayOfStrings[i]  ;
					}
				}
				textTooLong = true;
			}
			if (textTooLong == true) {
				jsonData.check_install_details += CP.Packages.TEXT_TOO_LONG_MSG; 
			}

			var check_install_popup=CP.WebUI4.Msg.show({
				closable: true,
				title: 'Verifier results',
				msg: jsonData.check_install_details,
				buttons: Ext.Msg.OK,
				icon: icon,
				id: 'check_install_results'
			});
			//this loop is for removing the Initiating Verify status when verifying small HF's
			for (var j = 0; j < CP.Packages.store.getCount(); j++) {
				if ((CP.Packages.store.getAt(j) == undefined) || (CP.Packages.store.getAt(j).data == undefined))
					continue;
				var pkg = CP.Packages.store.getAt(j);
				if (jsonData.check_install_filename==pkg.data.package_name) {
					// found the package in the table
					pkg.set("local_status_text","");
				}
			}
		}
		
		if (jsonData.downtime != "" && !CP.Packages.supressPopups) {
			CP.Packages.supressFailLockMsg();
			CP.Packages.supressUnableToConnectMsg();
			if (CP.Packages.task)
				CP.Packages.task.cancel();
			CP.Packages.overrideLock();
			var myparams = {};
			myparams['downtime_ack']=1;
			var winTitle = 'Installation in Progress';
			var content = 'Please wait while current web session reconnects.';
			if (jsonData.downtime == 2) { // uninstall
				winTitle = 'Uninstallation in Progress';
				//content = 'Please wait while the uninstallation process performs the required operations.';
			}
			CP.Packages.showWaitingWindow(winTitle,content,myparams,3000);
		}
		
		var reboot_popup=Ext.getCmp('rebooting_window_popup');
		var got_timeout=false;
		
		var reboot_msg='';
		if (jsonData.mgmt_upgrade=="1") {
			reboot_msg+='<span style="font-size:'+CP.Packages.MSG_FONT_SIZE_LARGE+'px; font-weight: bold">To complete the upgrade, you must reboot. Log in to the Status and Actions page, Full Images tab for status.</span>';
		} else {
			reboot_msg+='<span style="font-size:'+CP.Packages.MSG_FONT_SIZE_LARGE+'px; font-weight: bold">To complete the installation, you must reboot.</span>';
		}

		reboot_msg+='<br><span style="font-size:'+CP.Packages.MSG_FONT_SIZE_LARGE+'px; font-weight: bold">The machine will be in an unstable state until reboot is performed.</span>';
		
		if (jsonData.reboot_timeout != "")
		{
			reboot_msg=reboot_msg+'<br><br>' + jsonData.reboot_timeout + ' seconds until forced reboot.';
		}
		
		if (jsonData.reboot == "1") {
			if (!reboot_popup && !CP.Packages.supressPopups) {
				
				CP.Packages.supressFailLockMsg();
				Ext.Ajax.request({
					url: CP.Packages.SUBMIT_URL,
					method: 'POST',
					params: { reboot_ack: 1 },
					success: function() { 
						CP.Packages.connection_fail_counter=0;
						CP.Packages.unsupressFailLockMsg(); 
					},
					failure: function() { 
						CP.Packages.connection_fail_counter++;
						CP.Packages.unsupressFailLockMsg(); 
					}
				});
				if (!CP.Packages.supress_reboot_popup) {
						reboot_popup=CP.WebUI4.Msg.show({
						closable: false,
						title: 'Reboot Required',
						msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+reboot_msg+'</span>',
						buttons: ((CP.global.token == -1) || (CP.UI.accessMode == 'ro'))?{}:Ext.Msg.OKCANCEL,
						icon: Ext.Msg.QUESTION,
						id: 'rebooting_window_popup',
						fn: function(button) {
							var myparams = {};
							myparams["reboot"] = 0;
							if (button == "ok") {
								myparams["reboot"] = 1;
								CP.Packages.showRebootingWindow('Rebooting System', 'Please wait while the system reboots.',myparams,30000);
							}
							CP.Packages.supressUnableToConnectMsg();
							CP.Packages.supressFailLockMsg();
							Ext.Ajax.request({
								url: CP.Packages.SUBMIT_URL,
								method: 'POST',
								params: myparams,
								success: function() { 
									CP.Packages.connection_fail_counter=0;
									CP.Packages.unsupressFailLockMsg();
									CP.Packages.unsupressUnableToConnectMsg();
								},
								failure: function() { 
									CP.Packages.connection_fail_counter++;
									CP.Packages.unsupressFailLockMsg(); 
									CP.Packages.unsupressUnableToConnectMsg();
								}
							});						
						}
					});
				}
			}
		}
		
		if (jsonData.reboot_forced == "1") {
			if (reboot_popup) {
				reboot_popup.hide();
			}
			var myparams={};
			myparams["forced_reboot_ack"]=1;
			CP.Packages.showRebootingWindow('Rebooting System', 'Please wait while the system reboots.',myparams,30000);
		}
		
		/*
		var installed_hfs_warning=Ext.getCmp(CP.Packages.INSTALLED_HFS_WARNING);
		if (jsonData.installed_hfs != "" && (CP.Packages.installed_hfs_warning_shown != CP.Packages.install_id)) {
			var warning_str="Warning: There are installed hotfixes on this machine.<br>All changes made by those hotfixes will be lost.<br>Installed hotfixes are:<br>"+jsonData.installed_hfs+"<br>Do you want to conitnue with the installation?";
			if (!installed_hfs_warning) {
				CP.Packages.installed_hfs_warning_shown=CP.Packages.install_id;
				installed_hfs_warning=CP.WebUI4.Msg.show({
					title: 'Warning - Installed Hotfixes',
					msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+warning_str+'</span>',
					buttons: Ext.Msg.YESNO,
					icon: Ext.Msg.WARNING,
					id: CP.Packages.INSTALLED_HFS_WARNING,
					fn: function(button) {
						//CP.Packages.su_popup_shown=true;
						var myparams = {};
						myparams["installed_hfs_ack"] = "false";
						if (button == "yes") {
							myparams["installed_hfs_ack"] = "true";
						}
						CP.Packages.supressFailLockMsg();
						Ext.Ajax.request({
							url: CP.Packages.SUBMIT_URL,
							method: 'POST',
							params: myparams,
							success: function() { 
								CP.Packages.connection_fail_counter=0;
								//CP.Packages.su_popup_shown=false;
								CP.Packages.unsupressFailLockMsg();
							},
							failure: function() { 
								CP.Packages.connection_fail_counter++;
								CP.Packages.unsupressFailLockMsg(); 
							}
						});
					}
				});
			}
		}
		*/
		
		var su_popup=Ext.getCmp('self_update_popup');
		
		if (su_popup && (jsonData.remove_su_popup == "1")) {
			su_popup.close();
		}
		
		var su_msg='The Automatic Updates Agent is about to be updated.<br><br>' + jsonData.su_timeout + ' seconds remain until update will be cancelled.';
		
		if ((jsonData.self_update == "1") && !su_popup && !CP.Packages.su_popup_shown && !CP.Packages.supressPopups) {
			su_popup=CP.WebUI4.Msg.show({
				title: 'Perform Update',
				msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+su_msg+'</span>',
				buttons: Ext.Msg.OKCANCEL,
				icon: Ext.Msg.QUESTION,
				id: 'self_update_popup',
				fn: function(button) {
					CP.Packages.su_popup_shown=true;
					var myparams = {};
					myparams["self_update"] = 0;
					if (button == "ok") {
						myparams["self_update"] = 1;
						CP.Packages.poll_expected_res="success";
						CP.Packages.showWaitingWindow('Performing Update', 'Please wait while updating the Deployment Agent.',myparams,3000);
					} else {
						CP.Packages.supressFailLockMsg();
						Ext.Ajax.request({
							url: CP.Packages.SUBMIT_URL,
							method: 'POST',
							params: myparams,
							success: function(response) {
								//console.log("Self Update res: "+response.responseText);
								CP.Packages.connection_fail_counter=0;
								CP.Packages.su_popup_shown=false;
								CP.Packages.unsupressFailLockMsg();
							},
							failure: function() { 
								CP.Packages.connection_fail_counter++;
								CP.Packages.unsupressFailLockMsg(); 
							}
						});
					}
				}
			});
		}
		
		var text = Ext.encode(jsonData);
		response.responseText=text;
		if (jsonData.isDArunning == "1") {
			// DA is running
			CP.Packages.isDArunning = true;
			// hide former panels
			var DAwarning = Ext.getCmp(CP.Packages.DA_WARNING);
			if (DAwarning) {
				DAwarning.hide();
			}
			var DAdisableWarning = Ext.getCmp(CP.Packages.DA_DISABLE_WARNING);
			if (DAdisableWarning) {
				DAdisableWarning.hide();
			}
		} else {
			// DA is not running
			CP.Packages.isDArunning = false;
			CP.Packages.disableButtons();
			CP.Packages.packageRunning = false;
			var descPanel = Ext.getCmp(CP.Packages.DESCRIPTION_PANEL);
			if (descPanel) {
				descPanel.hide();
			}
			// adjust the message according to the disabled state
			var DAwarning = Ext.getCmp(CP.Packages.DA_WARNING); // get an instance of DAwarning - for showing or hiding
			if (jsonData.isDAdisabled == "1") {
				var DAdisableWarning = Ext.getCmp(CP.Packages.DA_DISABLE_WARNING);
				if (DAdisableWarning && CP.Packages.findInMessageArray('da_disable_warning_msg') == false) {
					if (DAwarning) { // hide unneccessary warning message
						DAwarning.hide();
					}
					DAdisableWarning.show();
				}
			} else {
				if (DAwarning && CP.Packages.findInMessageArray('da_warning_msg') == false) {
					DAwarning.show();
				}
			}
		}
		
		var lics_warning= Ext.getCmp('no_license_warning');
		if (lics_warning && CP.Packages.connection_error_msg && CP.Packages.connection_error_msg!="connected" && CP.Packages.connection_error_msg!=CP.Packages.CONNECTION_NO_STATE && CP.Packages.findInMessageArray('no_license_warning') == false) {
		var lics_warning_msg= Ext.getCmp('no_license_warning').items.getAt(1);
			lics_warning_msg.update(CP.Packages.connection_error_msg);
			lics_warning.show();
		} else {
			if (lics_warning)
				lics_warning.hide();
		}
		
		var pnp_exp_msg_container= Ext.getCmp('pnp_exp_msg');
		if (pnp_exp_msg_container && jsonData.pnp_license_exp && jsonData.pnp_license_exp.length > 1 && CP.Packages.findInMessageArray('pnp_exp_msg') == false) {
			var pnp_exp_msg= Ext.getCmp('pnp_exp_msg').items.getAt(1);
			pnp_exp_msg.update("CPUSE requires a valid license for downloads and updates. The trial license is currently active and will expire on "+CP.Packages.IDO_rend(jsonData.pnp_license_exp));
			pnp_exp_msg_container.show();
		} else {
			if (pnp_exp_msg_container)
			pnp_exp_msg_container.hide();
		}

		var uda_msg_container= Ext.getCmp('uda_msg');
		if (uda_msg_container && jsonData.uda_disallowed == 1 && CP.Packages.findInMessageArray('uda_msg') == false) {
			var uda_msg= Ext.getCmp('uda_msg').items.getAt(1);
			uda_msg.update("Cannot connect to the Check Point cloud - the administrator did not authorize downloads. For more information refer to sk94508");
			uda_msg_container.show();
		} else {
			if (uda_msg_container)
				uda_msg_container.hide();
		}
		
		var da_up_warning= Ext.getCmp('da_update_warning');
		
		if (da_up_warning) {
			if (CP.Packages.self_update=='') {
				da_up_warning.hide();
			} else if (CP.Packages.findInMessageArray('da_update_warning') == false) {
				da_up_warning.show();
			}
		}

		var no_actions_allowed_warning_container= Ext.getCmp('no_actions_allowed_warning');
		if (no_actions_allowed_warning_container && !CP.Packages.findInMessageArray('no_actions_allowed_warning') && !CP.Packages.action_allowed) {
			var no_actions_allowed_msg= Ext.getCmp('no_actions_allowed_warning').items.getAt(1);
			no_actions_allowed_msg.update("All actions are disabled until you perform a reboot");
			no_actions_allowed_warning_container.show();
		} else {
			if (no_actions_allowed_warning_container)
				no_actions_allowed_warning_container.hide();
		}
	}
	
	,showActionButtons: function() {
		var prv_link_btn=Ext.getCmp(CP.Packages.PRIVATE_PKG_BTN);
		var import_btn=Ext.getCmp(CP.Packages.IMPORT_BTN);
		var actions_btn=Ext.getCmp(CP.Packages.ACTIONS_BTN);
		var inst_btn=Ext.getCmp(CP.Packages.INSTALL_BTN); 
		var serach_comp = Ext.getCmp(CP.Packages.SEARCH_HOTFIX_IN_CLOUD);
		var more_download_btn=Ext.getCmp(CP.Packages.MORE_DOWNLOAD_BTN);
		var delete_btn=Ext.getCmp(CP.Packages.DELETE_BTN);
		var check_for_update_btn=Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN);
			
		if (import_btn) 
			import_btn.show();
		if (prv_link_btn)
			prv_link_btn.show();
		if (check_for_update_btn)
			check_for_update_btn.show();
		if (serach_comp)
			serach_comp.show();
				
		if ((CP.global.token == -1) || (CP.UI.accessMode == 'ro'))  // if the database is locked or ui in read only mode (monitor user), don't enable the buttons
			return;
			
		if (actions_btn) {
			actions_btn.enable();
		}
		
		if(!CP.Packages.action_allowed){
			if (prv_link_btn) 
				prv_link_btn.disable();
			if (import_btn) 
				import_btn.disable();
			if (inst_btn) 
				inst_btn.disable(); 
			if (serach_comp) 
				serach_comp.disable();
			if (more_download_btn) 
				more_download_btn.disable();
			if (delete_btn) 
				delete_btn.disable();			
			return;
		}
		 
		if (!CP.Packages.isDArunning){ // if the service is not running, don't enable any button
			actions_btn.disable();
			return;
		} 
			
				
		if (serach_comp) {
			if (!CP.Packages.packageRunning) {				
				serach_comp.enable();
			}
		}
		
		if (import_btn) {
			if (!CP.Packages.packageRunning) {
				import_btn.enable();
			}
		}
		
		if (prv_link_btn) {
			prv_link_btn.enable();
		}
		
		if(more_download_btn)
			more_download_btn.enable();
		
		if (inst_btn) {
			var pkg_type = CP.Packages.getSelectedPackageField('pkg_type_modified');
			if (!pkg_type) {
				return;
				}
			if (pkg_type === CP.Packages.TYPE_MAJOR) {
				CP.Packages.INSTALL_BTN_TEXT = 'Clean Install';
			} else {
					CP.Packages.INSTALL_BTN_TEXT = 'Install Update';
			}
			
			inst_btn.setText(CP.Packages.INSTALL_BTN_TEXT);
		}
	}
	
	,disableButtons: function() {
		var i_btn = Ext.getCmp(CP.Packages.INSTALL_BTN);
		var u_btn = Ext.getCmp(CP.Packages.UNINSTALL_BTN);
		var d_btn = Ext.getCmp(CP.Packages.DOWNLOAD_BTN);
		var p_btn = Ext.getCmp(CP.Packages.PAUSE_BTN);
		var r_btn = Ext.getCmp(CP.Packages.RESUME_BTN);
		var l_btn = Ext.getCmp(CP.Packages.LINK_TO_IMAGE_MANAGEMENT);
		var il_btn = Ext.getCmp(CP.Packages.I_LOG_BTN);
		var ul_btn = Ext.getCmp(CP.Packages.U_LOG_BTN);
		var ifl_btn = Ext.getCmp(CP.Packages.IF_LOG_BTN);
		var chk_btn=Ext.getCmp(CP.Packages.CHK_BTN);
		var reinst_btn=Ext.getCmp(CP.Packages.REINST_BTN);
		var delete_btn=Ext.getCmp(CP.Packages.DELETE_BTN);
		var remove_from_view_btn=Ext.getCmp(CP.Packages.REMOVE_FROM_VIEW_BTN);
		var upgrade_btn=Ext.getCmp(CP.Packages.UPGRADE_BTN);
		var rev_btn=Ext.getCmp(CP.Packages.REVERT_BTN);
		var prv_link_btn=Ext.getCmp(CP.Packages.PRIVATE_PKG_BTN);
		var more_download_btn=Ext.getCmp(CP.Packages.MORE_DOWNLOAD_BTN);
		var export_btn=Ext.getCmp(CP.Packages.EXPORT_BTN);
		var import_btn=Ext.getCmp(CP.Packages.IMPORT_BTN);
		var actions_btn=Ext.getCmp(CP.Packages.ACTIONS_BTN); 
		var serach_comp = Ext.getCmp(CP.Packages.SEARCH_HOTFIX_IN_CLOUD);
 
		if (serach_comp) {			
			serach_comp.disable();
		}
		
		if (actions_btn)
			actions_btn.disable();
		
		if (i_btn) {
			//i_btn.hide();
			i_btn.disable();
		}
		if (u_btn) {
			//u_btn.hide();
			u_btn.disable();
		}
		if (d_btn) {
			//d_btn.hide();
			d_btn.disable();
			d_btn.hide();
		}
		if (p_btn) {
			p_btn.hide();
			p_btn.disable();
		}
		if (r_btn) {
			r_btn.hide();
			r_btn.disable();
		}
		if (l_btn) {
			l_btn.hide();
			l_btn.disable();
		}
		if (il_btn) {
			il_btn.hide();
			il_btn.disable();
		}
		if (ul_btn) {
			ul_btn.hide();
			ul_btn.disable();
		}
		if (ifl_btn) {
			ifl_btn.hide();
			ifl_btn.disable();
		}
		if (chk_btn) {
			chk_btn.hide();
			chk_btn.disable();
		}
		if (reinst_btn) {
			reinst_btn.hide();
			reinst_btn.disable();
		}
		if (delete_btn) {
			delete_btn.hide();
		}
		if (remove_from_view_btn) {
			remove_from_view_btn.hide();
		}
		if (upgrade_btn) {
			upgrade_btn.hide();
			upgrade_btn.disable();
		}
		if (rev_btn) {
			rev_btn.hide();
		}
		if (prv_link_btn) {
			prv_link_btn.hide();
		}
		
		if (more_download_btn) {
			more_download_btn.disable();
			more_download_btn.hide();
		}
		if (export_btn) {
			export_btn.hide();
		}
		if (import_btn) {
			import_btn.disable();
		}	
		CP.Packages.showActionButtons();
	}
	
	,enableButtons: function(pkg) {
		var i_btn = Ext.getCmp(CP.Packages.INSTALL_BTN);
		var u_btn = Ext.getCmp(CP.Packages.UNINSTALL_BTN);
		var d_btn = Ext.getCmp(CP.Packages.DOWNLOAD_BTN);
		var p_btn = Ext.getCmp(CP.Packages.PAUSE_BTN);
		var r_btn = Ext.getCmp(CP.Packages.RESUME_BTN);
		var l_btn = Ext.getCmp(CP.Packages.LINK_TO_IMAGE_MANAGEMENT);
		var il_btn = Ext.getCmp(CP.Packages.I_LOG_BTN);
		var ul_btn = Ext.getCmp(CP.Packages.U_LOG_BTN);
		var ifl_btn = Ext.getCmp(CP.Packages.IF_LOG_BTN);
		var chk_btn=Ext.getCmp(CP.Packages.CHK_BTN);
		var reinst_btn=Ext.getCmp(CP.Packages.REINST_BTN);
		var delete_btn=Ext.getCmp(CP.Packages.DELETE_BTN);
		var remove_from_view_btn=Ext.getCmp(CP.Packages.REMOVE_FROM_VIEW_BTN);
		var upgrade_btn=Ext.getCmp(CP.Packages.UPGRADE_BTN);
		var rev_btn=Ext.getCmp(CP.Packages.REVERT_BTN);
		var prv_link_btn=Ext.getCmp(CP.Packages.PRIVATE_PKG_BTN);
		var more_download_btn=Ext.getCmp(CP.Packages.MORE_DOWNLOAD_BTN);
		var export_btn=Ext.getCmp(CP.Packages.EXPORT_BTN);
		var import_btn=Ext.getCmp(CP.Packages.IMPORT_BTN); 
		var serach_comp = Ext.getCmp(CP.Packages.SEARCH_HOTFIX_IN_CLOUD);
		var filter_btn = Ext.getCmp(CP.Packages.FILTER_BTN);
		var check_for_update_btn=Ext.getCmp(CP.Packages.CHECK_FOR_UPDATE_BTN);
		
		var allow_actions = ((CP.Packages.action_allowed) && !((pkg.data.pending_reboot) && (pkg.data.pending_reboot != "")));
		
		if (filter_btn) {
			filter_btn.show();
		} 
		
		if (serach_comp) {		
			serach_comp.show();
		}
		
		if (import_btn) {		
			import_btn.show();
		}
		
		if (check_for_update_btn) {		
			check_for_update_btn.show();
		}
		
		if (!CP.Packages.isDArunning) // if the service is not running, don't enable any button
			return;

		CP.Packages.showActionButtons();
	
		CP.Packages.buttonShouldAppear(pkg);
		
		if (more_download_btn && more_download_btn.appear){
			if(allow_actions){
				more_download_btn.enable();	
			}else{
				more_download_btn.disable();
			}
			more_download_btn.show();		
		}
		if (il_btn && il_btn.appear)
			il_btn.show();
		if (ul_btn && ul_btn.appear)
			ul_btn.show();
		if (ifl_btn && ifl_btn.appear)
			ifl_btn.show();
		if (chk_btn && chk_btn.appear)
			chk_btn.show();
		if (delete_btn && delete_btn.appear)
			delete_btn.show();
		if (remove_from_view_btn && remove_from_view_btn.appear)
			remove_from_view_btn.show();
		if (d_btn && d_btn.appear) {
			if(allow_actions){
				d_btn.enable();
			}	
			d_btn.show();
		}
		if (p_btn && p_btn.appear)
			p_btn.show();
		if (r_btn && r_btn.appear)
			r_btn.show();
		if (i_btn && i_btn.appear && allow_actions) {
			i_btn.enable();
		}
		if (export_btn && export_btn.appear)
			export_btn.show();
		if (upgrade_btn && upgrade_btn.appear && allow_actions)
			upgrade_btn.enable();
		if (rev_btn && rev_btn.appear)
			rev_btn.show();
		if (u_btn && u_btn.appear && allow_actions)
			u_btn.enable();
		if (reinst_btn && reinst_btn.appear)
			reinst_btn.show(); // bundle or major package, show reinstall button
		if (l_btn && l_btn.appear)
			l_btn.show();
		
		var actions_btn=Ext.getCmp(CP.Packages.ACTIONS_BTN);
		if (actions_btn)
			actions_btn.disable();
		
		if ((CP.global.token == -1) || (CP.UI.accessMode == 'ro'))  { // Don't enable buttons if UI is locked or in read only mode
			return;
		}
			
		CP.Packages.showActionButtons();
		
		if (u_btn) {
			var pkg_type = CP.Packages.getSelectedPackageField('pkg_type_modified');
			if (!pkg_type) {
				return;
			}
			if (pkg_type === CP.Packages.TYPE_MAJOR) {
					u_btn.hide();
			} else {
					u_btn.show();
				}
			}
		if (upgrade_btn) {
			var pkg_type = CP.Packages.getSelectedPackageField('pkg_type_modified');
			if (!pkg_type) {
				return;
			}
			if (pkg_type === CP.Packages.TYPE_MAJOR) {
					upgrade_btn.show();
			} else {
					upgrade_btn.hide();
				}
			}
		
		if (d_btn && d_btn.appear &&!p_btn.appear && !r_btn.appear) {
			d_btn.show();
		}
		if (more_download_btn && more_download_btn.appear &&!p_btn.appear && !r_btn.appear) {
			more_download_btn.show();
		}
		if (i_btn)
			i_btn.show();
		if (allow_actions)
		{
			if (l_btn)
				l_btn.enable();
			if (il_btn)
				il_btn.enable();
			if (ul_btn)
				ul_btn.enable();
			if (ifl_btn)
				ifl_btn.enable();
			if (chk_btn) {
				chk_btn.enable();
			}
			if (reinst_btn)
				reinst_btn.enable();
			if (delete_btn)
				delete_btn.enable();
			if (remove_from_view_btn)
				remove_from_view_btn.enable();
			if (rev_btn)
				rev_btn.enable();
			if (export_btn)
				export_btn.enable();
			if (p_btn)
				p_btn.enable();
			if (r_btn)
				r_btn.enable();	
		}
	}

	,buttonShouldAppear: function(pkg) {
		var i_btn = Ext.getCmp(CP.Packages.INSTALL_BTN);
		var u_btn = Ext.getCmp(CP.Packages.UNINSTALL_BTN);
		var d_btn = Ext.getCmp(CP.Packages.DOWNLOAD_BTN);
		var p_btn = Ext.getCmp(CP.Packages.PAUSE_BTN);
		var r_btn = Ext.getCmp(CP.Packages.RESUME_BTN);
		var l_btn = Ext.getCmp(CP.Packages.LINK_TO_IMAGE_MANAGEMENT);
		var il_btn = Ext.getCmp(CP.Packages.I_LOG_BTN);
		var ul_btn = Ext.getCmp(CP.Packages.U_LOG_BTN);
		var ifl_btn = Ext.getCmp(CP.Packages.IF_LOG_BTN);
		var chk_btn=Ext.getCmp(CP.Packages.CHK_BTN);
		var reinst_btn=Ext.getCmp(CP.Packages.REINST_BTN);
		var delete_btn=Ext.getCmp(CP.Packages.DELETE_BTN);
		var remove_from_view_btn=Ext.getCmp(CP.Packages.REMOVE_FROM_VIEW_BTN);
		var upgrade_btn=Ext.getCmp(CP.Packages.UPGRADE_BTN);
		var rev_btn=Ext.getCmp(CP.Packages.REVERT_BTN);
		var prv_link_btn=Ext.getCmp(CP.Packages.PRIVATE_PKG_BTN);
		var more_download_btn=Ext.getCmp(CP.Packages.MORE_DOWNLOAD_BTN);
		var export_btn=Ext.getCmp(CP.Packages.EXPORT_BTN);
		
		if (i_btn)
			i_btn.appear=false;
		if (u_btn)
			u_btn.appear=false;
		if (d_btn)
			d_btn.appear=false;
		if (p_btn)
			p_btn.appear=false;
		if (r_btn)
			r_btn.appear=false;
		if (l_btn)
			l_btn.appear=false;
		if (il_btn)
			il_btn.appear=false;
		if (ul_btn)
			ul_btn.appear=false;
		if (ifl_btn)
			ifl_btn.appear=false;
		if (chk_btn)
			chk_btn.appear=false;
		if (reinst_btn)
			reinst_btn.appear=false;
		if (delete_btn)
			delete_btn.appear=false;
		if (remove_from_view_btn)
			remove_from_view_btn.appear=false;
		if (upgrade_btn)
			upgrade_btn.appear=false;
		if (rev_btn)
			rev_btn.appear=false;
		if (prv_link_btn)
			prv_link_btn.appear=false;
		if (more_download_btn)
			more_download_btn.appear=false;
		if (export_btn)
			export_btn.appear=false;

		if (!CP.Packages.isDArunning) // if the service is not running, don't enable any button
			return;
		
		if (!pkg)
			return;
		
		var package_uninstalled = (pkg.data.u_log_file!="")?true:false;
		if (((pkg.data.status == CP.Packages.INSTALLED) || (pkg.data.status == CP.Packages.INSTALL_FAILED) || (pkg.data.status == CP.Packages.INSTALL_SKIPPED)) && (!pkg.data.legacy_hotfix || pkg.data.legacy_hotfix == "") && (pkg.data.i_log_file && pkg.data.i_log_file!="") && !package_uninstalled) {
			if (il_btn)
				il_btn.appear=true;
		}		
		if (((pkg.data.status == CP.Packages.AVAILABLE_INSTALL)|| (pkg.data.status == CP.Packages.UNINSTALL_FAILED)) && package_uninstalled) {
			if (ul_btn)
				ul_btn.appear=true;
		}
		if ((pkg.data.status == CP.Packages.INSTALL_FAILED) && package_uninstalled) {
			if (ifl_btn)
				ifl_btn.appear=true;
		}
		if ((((pkg.data.status == CP.Packages.AVAILABLE_INSTALL) || (pkg.data.status == CP.Packages.INSTALL_FAILED) || (pkg.data.status == CP.Packages.PARTIALLY_DOWNLOADED) || (pkg.data.status == CP.Packages.INSTALL_SKIPPED)) && ((pkg.data.pkg_type_modified == CP.Packages.TYPE_BUNDLE) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_HOTFIX) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_FULL_MINOR)))  && (!CP.Packages.isDownloadedForDiffVersion(pkg.data))){
			if (chk_btn)
				chk_btn.appear=true;
		}
		if ((pkg.data.status == CP.Packages.INSTALLED) && (pkg.data.is_pkg_in_repository) && (((pkg.data.pkg_type_modified == CP.Packages.TYPE_BUNDLE) && (pkg.data.bundle_err=="1")) || ((pkg.data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_FULL_MINOR)))) { // show Verifier button for bundles that were installed with errors
			if (chk_btn)
				chk_btn.appear=true;
		}
		if ( ((pkg.data.status == CP.Packages.AVAILABLE_DOWNLOAD) || (pkg.data.status == CP.Packages.DOWNLOAD_FAILED)) && (pkg.data.has_metadata=="1") ) {
			if (chk_btn)
				chk_btn.appear=true;
		}
		if ((pkg.data.origin == CP.Packages.PKG_ORIGIN_PRIVATE && (pkg.data.status == CP.Packages.AVAILABLE_DOWNLOAD || pkg.data.status == CP.Packages.DOWNLOAD_FAILED)) ) {
			if (remove_from_view_btn) {
				remove_from_view_btn.appear=true;
			}
		} else if (CP.Packages.isDeletebleStatus(pkg.data.status) || 
					(((pkg.data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_FULL_MINOR)) && (pkg.data.status == CP.Packages.INSTALLED)) ||
						((pkg.data.status == CP.Packages.INSTALL_CONTAINED)	&& (CP.Packages.isDeletebleStatus(pkg.data.old_state)))) {
			if (delete_btn) {
				if (pkg && pkg.data && pkg.data.is_pkg_in_repository) {
					delete_btn.appear=true;
				}
			}
		} 
		// Enabling relevant action buttons
		if (((pkg.data.status == CP.Packages.AVAILABLE_DOWNLOAD) || (pkg.data.status == CP.Packages.DOWNLOAD_FAILED)) && (pkg.data.pkg_type_modified != CP.Packages.TYPE_HOTFIX) && (pkg.data.patching_failure_detected != 1)) {
			if (d_btn && (CP.global.token != -1) && (CP.UI.accessMode != 'ro'))
				d_btn.appear=true;
		}
		
		if(((pkg.data.status == CP.Packages.AVAILABLE_DOWNLOAD) || (pkg.data.status == CP.Packages.DOWNLOAD_FAILED)) && (pkg.data.pkg_type_modified == CP.Packages.TYPE_HOTFIX) && (pkg.data.patching_failure_detected != 1)) {
			if (more_download_btn && (CP.global.token != -1) && (CP.UI.accessMode != 'ro'))
				more_download_btn.appear=true;
		}
		if (pkg.data.status == CP.Packages.PARTIALLY_DOWNLOADED) {
			if (r_btn) {
				r_btn.appear=true;
			}
		}
		if ((pkg.data.status == CP.Packages.DOWNLOADING) ) {
			if (p_btn) {
				p_btn.appear=true;
			}
		}	
		if (((pkg.data.status == CP.Packages.AVAILABLE_INSTALL) || (pkg.data.status == CP.Packages.INSTALL_FAILED) || (pkg.data.status == CP.Packages.INSTALL_SKIPPED)) && !(CP.Packages.packageRunning) && !(CP.Packages.isPackageRunning()) && (!CP.Packages.isDownloadedForDiffVersion(pkg.data))){
			if (i_btn && (CP.global.token != -1) && (CP.UI.accessMode != 'ro'))
				i_btn.appear=true;
		}
		if (((pkg.data.status == CP.Packages.AVAILABLE_INSTALL) || (pkg.data.status == CP.Packages.INSTALL_FAILED) || (pkg.data.status == CP.Packages.INSTALL_SKIPPED) || (pkg.data.status == CP.Packages.AVAILABLE_DOWNLOAD)|| (pkg.data.status == CP.Packages.DOWNLOAD_FAILED)) && (!(CP.Packages.packageRunning) && !(CP.Packages.isPackageRunning())) && (pkg.data.pkg_type_modified == CP.Packages.TYPE_HOTFIX) && (pkg.data.patching_failure_detected != 1) && (!CP.Packages.isDownloadedForDiffVersion(pkg.data))) {
			if (i_btn && (CP.global.token != -1) && (CP.UI.accessMode != 'ro'))
				i_btn.appear=true;
		}
		if ((((pkg.data.status == CP.Packages.AVAILABLE_INSTALL) || (pkg.data.status == CP.Packages.INSTALL_FAILED) || (pkg.data.status == CP.Packages.INSTALL_SKIPPED)) || ((pkg.data.status == CP.Packages.INSTALL_CONTAINED)	&& (CP.Packages.isDeletebleStatus(pkg.data.old_state)))) && !(CP.Packages.packageRunning)) {
			if (export_btn)
				export_btn.appear=true;
			if ((pkg.data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_FULL_MINOR))
			{
				if (!CP.global.redirect_to_majors && pkg.data.disable_upgrade=="0") {
					if (upgrade_btn) {
						upgrade_btn.appear=true;
					}
				}
			}
			if (pkg.data.pkg_type_modified == CP.Packages.TYPE_REVERT)
			{
				if (rev_btn)
					rev_btn.appear=true;
				if (i_btn)
					i_btn.appear=true;
			}
		}
		if(((pkg.data.legacy_hotfix=="1") || (pkg.data.legacy_hotfix=="2")) && !CP.Packages.isPartOfMajorLegacy(pkg.data) && u_btn)
		{
			u_btn.appear=true;
		}
		
		if (((pkg.data.status == CP.Packages.INSTALLED) || (pkg.data.status == CP.Packages.UNINSTALL_FAILED)) && ((pkg.data.pkg_type_modified == CP.Packages.TYPE_HOTFIX) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_BUNDLE) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_RELEASE)) && !(CP.Packages.packageRunning)) {
			if (pkg.data.pkg_type_modified == CP.Packages.TYPE_OS) { // switching the uninstall button for the link to image management button for OS upgrades
				if (l_btn)
					l_btn.appear=true;
			} else {
				if (u_btn){
					if (pkg && pkg.data && pkg.data.is_pkg_in_repository) {
						u_btn.appear=true;
					}
				}
			}
			if (export_btn)
				if (pkg && pkg.data && pkg.data.is_pkg_in_repository) {
						export_btn.appear=true;
					}
		}
		if (((pkg.data.status == CP.Packages.INSTALLED) || (pkg.data.status == CP.Packages.UNINSTALL_FAILED)) && ((pkg.data.pkg_type_modified == CP.Packages.TYPE_BUNDLE) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (pkg.data.pkg_type_modified == CP.Packages.TYPE_FULL_MINOR)) && !(CP.Packages.packageRunning)) {
			if (i_btn)
				i_btn.appear=false;
			if (reinst_btn)
				if (pkg && pkg.data && pkg.data.is_pkg_in_repository) {
						reinst_btn.appear=true; // bundle or major package, show reinstall button
					}
				
			if (export_btn)
				if (pkg && pkg.data && pkg.data.is_pkg_in_repository) {
						export_btn.appear=true;
					}
				
		}
		if ((pkg.data.status == CP.Packages.INSTALLED) && (pkg.data.pkg_type_modified == CP.Packages.TYPE_OS) && !(CP.Packages.packageRunning)) {
			if (l_btn)
				l_btn.appear=true;
		}
	}
	
	,isPackageRunning: function() {
		if (!CP.Packages.store.getCount())
			return false;
		var cur_status;
		for (var i=0; i < CP.Packages.store.getCount(); i++) {
			if ((CP.Packages.store.getAt(i) == undefined) || (CP.Packages.store.getAt(i).data == undefined))
				return false;
			cur_status = CP.Packages.store.getAt(i).data.status;
			if(CP.Packages.store.getAt(i).data.pkg_type_modified == CP.Packages.TYPE_HOTFIX){
				if ((cur_status == CP.Packages.INSTALLING) || (cur_status == CP.Packages.UNINSTALLING)|| (cur_status == CP.Packages.DOWNLOADING))
				{
					return true;
				}
			}else{
				if ((cur_status == CP.Packages.INSTALLING) || (cur_status == CP.Packages.UNINSTALLING))
				{
					return true;
				}
			}
		}
		return false;
	}
	
	,setTableHeight: function() {
		var table=Ext.getCmp(CP.Packages.GRID_ID);
		if (!table)
			return;
		var rowHeight = CP.Packages.rowHeight;
		var maxRows = CP.Packages.MaxRows;
		var curRows = CP.Packages.store.getCount();
		table.setHeight(CP.Packages.tableHeight);
	}
	
	,i_log_renderer: function(value,meta,record,rowIx,ColIx, store) {
		var package_uninstalled = (record.data.u_log_file!="")?true:false;
		if (((record.data.status == CP.Packages.INSTALLED) || (record.data.status == CP.Packages.INSTALL_SKIPPED) || ((record.data.status == CP.Packages.INSTALL_FAILED) && !package_uninstalled)) && (record.data.i_log_file!="")) 
			return 'x-grid-center-icon'; //Show the action icon
		return 'x-hide-display';  //Hide the action icon
	}

	,u_log_renderer: function(value,meta,record,rowIx,ColIx, store) {
		var package_uninstalled = (record.data.u_log_file!="")?true:false;
		if (((record.data.status == CP.Packages.AVAILABLE_INSTALL) || (record.data.status == CP.Packages.UNINSTALL_FAILED)) && package_uninstalled)
			return 'x-grid-center-icon'; //Show the action icon
		return 'x-hide-display';  //Hide the action icon
	}	

	,if_log_renderer: function(value,meta,record,rowIx,ColIx, store) {
		var package_uninstalled = (record.data.u_log_file!="")?true:false;
		if ((record.data.status == CP.Packages.INSTALL_FAILED) && package_uninstalled  && (record.data.i_log_file!=""))
			return 'x-grid-center-icon'; //Show the action icon
		return 'x-hide-display';  //Hide the action icon
	}	
	
	,getPageItems: function() {
				
		var currentVersionPanel = Ext.create('CP.WebUI4.DataFormPanel', {
			id: CP.Packages.CUR_VER_PANEL,
			cls: 'textField',
			html: '',
			margin: '0',
			width: 370,
			region: 'north'
		});
		
		// custom plugin Ext.ux.ProgressColumn example
		var progressColumn = Ext.create( 'Ext.ux.grid.column.DAProgress', {
			id: CP.Packages.PKG_PROGRESS,
			header : 'Status',
			dataIndex : 'status',
			width: 160, //180
			resizeable: false,
			fixed: true,
			//minWidth: 100,
			sortable: false,
			hideable: false,
			editable:false
		});
		
		var columns = [
			{ header: 'Type', editable: false, width: 40, fixed: true, dataIndex:'package_parent', renderer: CP.Packages.pkgParentRenderer, id: 'package_type',sortable: false, menuDisabled: true, hidden: true,hideable: false},
			{ header: 'Package', editable: false, minWidth: 100, flex: 5, fixed: false, dataIndex:'display_name', renderer: CP.Packages.packageNameRenderer, id: 'package_name',sortable: false,hideable: false },
			//{ header: 'Category', editable: false, minWidth: 60, fixed: false, resizable: true, dataIndex:'package_tags', renderer: CP.Packages.pkgTagsRenderer, id: 'package_category' },
			progressColumn,
			{ header: 'Size', editable: false, width: 70, fixed: false, dataIndex:'size', renderer: CP.Packages.fileSizeRenderer, id: 'package_size',sortable: false,hidden: true},
			{ header: 'Release date', editable: false, minWidth: 80, flex: 1, fixed: false, dataIndex:'available_from', renderer: CP.Packages.AF_rend, id: 'package_release_date',sortable: false }
		];
		
		var gridMenu = Ext.getCmp('grid_menu');
		if (!gridMenu) gridMenu = Ext.create('Ext.menu.Menu', {
			id: 'grid_menu',
			listeners: {
				click: function(menu, item, e, eOpts) {
					//console.log(item.text+" "+item.record.data.package_name);
					var id = CP.Packages.convertContextButtonIdToButtonId(item.id);				 
					var button={id:id};
					CP.Packages.buttonPressed(button,"",item.record);
					//menu.destroy();
				}
			}
		});
					
		var help_btn = {
			//text: "Help",
			id: CP.Packages.HELP_BTN,
			icon: '../images/icons/help.png',
			handler:  CP.Packages.helpButtonPressed            
		};
					
		
		var prv_link_btn = {
			text: "Add Private Hotfix",
			id: CP.Packages.PRIVATE_PKG_BTN,
			hidden: true,
			icon: '../images/icons/add.png',
			margin: 0,
			handler: CP.Packages.buttonPressed
		};
		
		var export_btn = {
			text: CP.Packages.EXPORT_BTN_TEXT,
			id: CP.Packages.EXPORT_BTN,
			hidden: true,
			icon: '../images/icons/submit.png',
			handler: CP.Packages.buttonPressed
		};
		
		var check_for_update_btn = {
			xtype: 'cp4_button',
			text: CP.Packages.CHECK_FOR_UPDATE_TEXT,
			id: CP.Packages.CHECK_FOR_UPDATE_BTN,
			hidden: true,
			width: 130,
			icon: '../images/icons/check_updates.png',
			margin: '0 5 0 0',
			handler:  CP.Packages.buttonPressed
		};
		
		var import_btn = {
			xtype: 'cp4_button',
			text: CP.Packages.IMPORT_BTN_TEXT,
			id: CP.Packages.IMPORT_BTN,
			hidden: true,
			width: 115,
			icon: '../images/icons/submit_rev.png',
			margin: '0 5 0 0',
			handler:  CP.Packages.importPressed            
		}; 
	
		var search_hotfixes_btn = {
				xtype: 'cp4_button',
		        id: CP.Packages.SEARCH_HOTFIX_IN_CLOUD,
		        text: "Add Hotfixes From The Cloud",		      
		        icon: '../images/icons/searching.png',
		        margin: '0 5 0 0',
		        hidden:true,
		        width: 180,
		        handler: function (){ CP.Packages.searchPressed(); }
		};		

		var link_btn = {
			text: "Image Management page",
			id: CP.Packages.LINK_TO_IMAGE_MANAGEMENT,
			hidden: true,
			handler: CP.Packages.buttonPressed
		};

		var i_log_btn = {
			text: "Save Install Log",
			id: CP.Packages.I_LOG_BTN,
			hidden: true,
			//iconCls: 'icon-log',
			icon: '../images/icons/show_logs.png',
			handler: function() {
					CP.Packages.showLog(CP.Packages.I_LOG_BTN); 
			}
		};
	
		var u_log_btn = {
			text: "Save Uninstall Log",
			id: CP.Packages.U_LOG_BTN,
			hidden: true,
			icon: '../images/icons/show_logs.png',
			handler: function() {
					CP.Packages.showLog(CP.Packages.U_LOG_BTN); 
			}
		};
		
		var if_log_btn = {
			text: "Save Install & Uninstall Logs",
			id: CP.Packages.IF_LOG_BTN,
			hidden: true,
			//iconCls: 'icon-log',
			handler: function() {
					CP.Packages.showLog(CP.Packages.IF_LOG_BTN); 
			}
		};
	
		var chk_btn = {
			text: CP.Packages.VERIFIER_BTN_TEXT,
			id: CP.Packages.CHK_BTN,
			hidden: true,
			icon: '../images/icons/check_install.png',
			handler: CP.Packages.buttonPressed
		};
	
		var reinst_btn = {
			text: "Reinstall",
			id: CP.Packages.REINST_BTN,
			hidden: true,
			icon: '../images/icons/install.png',
			handler: CP.Packages.buttonPressed
		};
		
		var delete_btn = {
			text: CP.Packages.DELETE_BTN_TEXT,
			id: CP.Packages.DELETE_BTN,
			hidden: true,
			icon: '../images/icons/delete.png',
			handler: CP.Packages.buttonPressed
		};

		var remove_from_view_btn = {
			text: CP.Packages.REMOVE_FROM_VIEW_TEXT,
			id: CP.Packages.REMOVE_FROM_VIEW_BTN,
			hidden: true,
			icon: '../images/icons/remove_from_view.png',
			handler: CP.Packages.buttonPressed
		};
		
		var uninstall_btn = {
		text: "Uninstall",
		id: CP.Packages.UNINSTALL_BTN,
		hidden: true,
		icon: '../images/icons/uninstall.png',
		handler: CP.Packages.buttonPressed
		};
		
		var more_download_btn ={
             id: CP.Packages.MORE_DOWNLOAD_BTN,
             text: "Download",
             hidden: true,
             icon: '../images/icons/download.png',
             handler: CP.Packages.buttonPressed
        };
			
		var DAwarning ={
			// warning message to show if the DA service is not running
			margin: '5 0 2 0',
			id: CP.Packages.DA_WARNING,
			bodyPadding: '0 6 0 6',
			bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
			layout: {
					type: 'hbox'
					},
			items: [{
					xtype: 'cp4_container',
					margin: '3 3 2 2',
					html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
				},{
					xtype: 'cp4_container',
					margin: '4 3 2 2',
					html: 'CPUSE Deployment Agent is not running. CPUSE actions are disabled. To start the CPUSE Deployment Agent, see <a href="https://supportcenter.checkpoint.com/supportcenter/portal?eventSubmit_doGoviewsolutiondetails=&solutionid=sk92449" target="_blank">sk92449</a> , or contact Check Point Technical Services.'
				},
				{ xtype: 'tbfill' },
				{
					xtype: 'cp4_tool',
					type: 'close',
					margin: '4 0 4 0',
					qtip: 'Close',
					handler: function(){
						var DAwarning= Ext.getCmp(CP.Packages.DA_WARNING);
						if(DAwarning)
							DAwarning.hide();
						CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('da_warning_msg');
					}
				}]
		};
		
		var DAdisableWarning ={
			// warning message to show if the DA service is disabled
			margin: '5 0 2 0',
			id: CP.Packages.DA_DISABLE_WARNING,
			bodyPadding: '0 6 0 6',
			bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
			layout: {
					type: 'hbox'
					},
			items: [{
					xtype: 'cp4_container',
					margin: '3 3 2 2',
					html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
				},{
					xtype: 'cp4_container',
					margin: '4 3 2 2',
					html: 'CPUSE Deployment Agent is disabled. To enable the CPUSE Deployment Agent, see <a href="https://supportcenter.checkpoint.com/supportcenter/portal?eventSubmit_doGoviewsolutiondetails=&solutionid=sk92449" target="_blank">sk92449</a> , or contact Check Point Technical Services.'
				},
				{ xtype: 'tbfill' },
				{
					xtype: 'cp4_tool',
					type: 'close',
					margin: '4 0 4 0',
					qtip: 'Close',
					handler: function(){
						var DAdisableWarning= Ext.getCmp(CP.Packages.DA_DISABLE_WARNING);
						if (DAdisableWarning)
							DAdisableWarning.hide();
						CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('da_disable_warning_msg');
					}
				}]
		};
		
		var dev_env_msg ={
			// tell the user if this is a dev environment
			margin: '5 0 2 0',
			id: 'dev_env_msg',
			bodyPadding: '0 6 0 6',
			bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			//border : false,
			hidden: true,
			layout: {
					type: 'hbox'
					},
			items: [{
					xtype: 'cp4_container',
					margin: '3 3 2 2',
					html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
				},{
					xtype: 'cp4_container',
					margin: '4 3 2 2',
					html: 'Running on Staging Download Center'
				},
				{ xtype: 'tbfill' },
				{
					xtype: 'cp4_tool',
					type: 'close',
					margin: '4 0 4 0',
					qtip: 'Close',
					handler: function(){
						var dev_env_msg= Ext.getCmp('dev_env_msg');
						if(dev_env_msg)
							dev_env_msg.hide();
						CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('dev_env_msg');
					}
				}]
		};
		
		var noLicenseWarning ={
			// warning message to show if the user has no license or connection error
			margin: '5 0 2 0',
			id: 'no_license_warning',
			bodyPadding: '0 6 0 6',
			bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
			layout: {
					type: 'hbox'
					},
			items: [{
					xtype: 'cp4_container',
					margin: '3 3 2 2',
					html: '<img style="vertical-align:center" src="../images/icons/status-icons_05.png" />'
				},{
					xtype: 'cp4_container',
					margin: '4 3 2 2',
					html: 'User has no license to receive updates from the Download Center. Please configure a valid license in the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/license\');return false;">Licenses</a> page in the Gaia Portal, Advanced View mode.'
				},
			{ 	xtype: 'tbfill' 
			},
				{
					xtype: 'cp4_tool',
					type: 'close',
					margin: '4 0 4 0',
					qtip: 'Close',
					handler: function(){
						var noLicenseWarning= Ext.getCmp('no_license_warning');
						if(noLicenseWarning)
							noLicenseWarning.hide();
						CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('no_license_warning');
					}
				}]
		};
		

		var DAUpdateWarning ={
			// warning message to show if the user has no license or connection error
			margin: '5 0 2 0',
			id: 'da_update_warning',
			bodyPadding: '0 6 0 6',
			bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			//border : false,
			hidden: true,
			layout: {
					type: 'hbox'
					},
			items: [{
					xtype: 'cp4_container',
					margin: '3 3 2 2',
					html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
				},{
					xtype: 'cp4_container',
					margin: '4 3 2 2',
					html: 'New Deployment Agent Available.  <a href="javascript:void(0);" onclick="CP.Packages.critical_installation_window_open = true;CP.Packages.NewAgentWindow();">Update Now</a>'
				},
				{ xtype: 'tbfill' },
				{
					xtype: 'cp4_tool',
					type: 'close',
					margin: '4 0 4 0',
					qtip: 'Close',
					handler: function(){
						var DAUpdateWarning= Ext.getCmp('da_update_warning');
						if(DAUpdateWarning)
							DAUpdateWarning.hide();
						CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('da_update_warning');
					}
				}]
		};
		
		var PNP_exp_msg = {
			// a message that shows the user if a PING PNP license is active and when it will expire
		margin: '5 0 2 0',
			id: 'pnp_exp_msg',
		bodyPadding: '0 6 0 6',
		bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
		layout: {
				type: 'hbox'
			},
        	items: [{
				xtype: 'cp4_container',
				//cls: 'update-text',
				margin: '3 3 2 2',
				html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
			},{
				xtype: 'cp4_container',
				//cls: 'update-text-bold',
				margin: '4 3 2 2',
				html: ''
			},
			{ xtype: 'tbfill' },
			{
				xtype: 'cp4_tool',
				type: 'close',
				//id: 'update_close_icon',
				margin: '4 0 4 0',
				qtip: 'Close',
				handler: function() {
					//close the window
					var pnp_exp_msg= Ext.getCmp('pnp_exp_msg');
					if(pnp_exp_msg)
						pnp_exp_msg.hide();
					//insert message name to array	
					CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('pnp_exp_msg');
				}
			}]
		};
		
		var uda_msg = {
			// a message that shows the user if a PING PNP license is active and when it will expire
		margin: '5 0 2 0',
			id: 'uda_msg',
		bodyPadding: '0 6 0 6',
		bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
		layout: {
				type: 'hbox'
			},
        	items: [{
				xtype: 'cp4_container',
				//cls: 'update-text',
				margin: '3 3 2 2',
				html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
			},{
				xtype: 'cp4_container',
				//cls: 'update-text-bold',
				margin: '4 3 2 2',
				html: ''
			},
			{ xtype: 'tbfill' },
			{
				xtype: 'cp4_tool',
				type: 'close',
				//id: 'update_close_icon',
				margin: '4 0 4 0',
				qtip: 'Close',
				handler: function() {
					//close the window
					var uda_msg= Ext.getCmp('uda_msg');
					if(uda_msg)
						uda_msg.hide();
					//insert message name to array	
					CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('uda_msg');
				}
			}]
		};
		
		var noActionsAllowedWarning = {
			// In case the DA pending reboot a message that no actions allowed
		margin: '5 0 2 0',
			id: 'no_actions_allowed_warning',
		bodyPadding: '0 6 0 6',
		bodyStyle: 'background:'+CP.Packages.STATIC_MESSAGE_COLOR,
			hidden: true,
		layout: {
				type: 'hbox'
			},
        	items: [{
				xtype: 'cp4_container',
				//cls: 'update-text',
				margin: '3 3 2 2',
				html: '<img style="vertical-align:center" src="../images/icons/status-icons_09.png" />'
			},{
				xtype: 'cp4_container',
				//cls: 'update-text-bold',
				margin: '4 3 2 2',
				html: 'Suppress reboot - DA actions not allowed'
			},
			{ xtype: 'tbfill' },
			{
				xtype: 'cp4_tool',
				type: 'close',
				//id: 'update_close_icon',
				margin: '4 0 4 0',
				qtip: 'Close',
				handler: function() {
					//close the window
					var noActionsAllowedWarning= Ext.getCmp('no_actions_allowed_warning');
					if(noActionsAllowedWarning)
						noActionsAllowedWarning.hide();
					//insert message name to array	
					CP.Packages.SHOWN_AND_CLOSED_MESSAGES.push('no_actions_allowed_warning');
				}
			}]
		};

		var static_msgs = Ext.create('CP.WebUI4.DataFormPanel', {
			id: 'static_msgs',
			margin: '0 0 10',
			items: [
				noLicenseWarning,
				dev_env_msg,
				PNP_exp_msg,
				DAwarning,
				DAdisableWarning,
				uda_msg,
				noActionsAllowedWarning,
				DAUpdateWarning
			]
		});
		
		var dynamic_msgs = Ext.create('CP.WebUI4.DataFormPanel', {
			id: CP.Packages.DYNAMIC_MSGS,
			items: [ ]
		});

	 var groupingFeature = Ext.create('Ext.grid.feature.Grouping',{
		enableGroupingMenu: false,
		groupHeaderTpl : '<table style="width:100%"><tr>'
				+'<td width="20%" align="left"><span style="color: #04408c; font-face=Arial; font-size: 11pt; font-weight: lighter; margin-bottom: 20px;">'
				+'{[values.name == 1 ? "Hotfixes" : values.name == 4 ? "Minor Versions (HFAs)" : values.name == 5 ? "Major Versions" : "Legacy Installed Hotfixes"]}'
				+'</span></td>'
				+'<td align="left"><span style="color: grey; font-face=Arial; font-size: 10pt; font-weight: lighter; margin-bottom: 20px;">{[CP.Packages.downloadingInCategory[[values.name]] > 0 ? (CP.Packages.downloadingInCategory[[values.name]]+" package"+((CP.Packages.downloadingInCategory[[values.name]]>1)?"s":"")+" downloading") : ""]}'
				+'{[((CP.Packages.downloadingInCategory[[values.name]] > 0) && (CP.Packages.installingInCategory[[values.name]] > 0)) ? "," : ""]}'
				+'{[CP.Packages.installingInCategory[[values.name]] > 0 ? (CP.Packages.installingInCategory[[values.name]]+" package"+((CP.Packages.installingInCategory[[values.name]]>1)?"s":"")+" installing") : ""]}'
				+'</span></td>' 
				+'<td align="right"><span style="color: black; font-face=Arial; font-size: 9pt; font-weight: lighter; margin-bottom: 20px;">' 
				+'{[(CP.Packages.DUMMY_CATEGORY_LIST[[values.name]] == 1) ? (" <img style=vertical-align:bottom src=../images/icons/status-icons_04.png>" + " Aligned with the latest version") : (((values.rows.length-1) == 0) ? "" : (" "+ ((values.rows.length-1) + " item" + (((values.rows.length-1) == 1) ? "" : "s" ))) )]}</span></td>' 
				+ '</tr></table>'
    	});
		
		
	var packagesTable = {
        xtype : 'cp4_grid',
        id : CP.Packages.GRID_ID,
	    //width : CP.Packages.tableWidth,
	    minHeight: 680,
	    style: 'border: none',
	    //maxHeight: CP.Packages.tableHeight,
	    minWidth: 350,
	    margin: 0,
	    autoHeight: true,
	    autoWidth: true,
	    autoScroll: true,
            store : CP.Packages.store,
        columns : columns,
		viewConfig: {
			loadMask: false,
			scrollToTop: Ext.emptyFn,
			onStoreLoad: Ext.emptyFn
		},
			features: [groupingFeature],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [
					{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.DOWNLOAD_BTN,
					text: "Download",
					hidden: true,
					icon: '../images/icons/download.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.PAUSE_BTN,
					text: "Pause",
					hidden: true,
					icon: '../images/icons/pause.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.RESUME_BTN,
					text: "Resume",
					hidden: true,
					icon: '../images/icons/resume.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.INSTALL_BTN,
					text: CP.Packages.INSTALL_BTN_TEXT,
					hidden: true,
					icon: '../images/icons/install.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.UPGRADE_BTN,
					text: "Upgrade",
					hidden: true,
					icon: '../images/icons/upgrade.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					id: CP.Packages.REVERT_BTN,
					text: "Revert",
					hidden: true,
					icon: '../images/icons/install.png',
					handler: CP.Packages.buttonPressed
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					autoWidth: true,
					text: 'More',
					id: CP.Packages.ACTIONS_BTN,
					menu: [
						i_log_btn,
						u_log_btn,
						if_log_btn,
						uninstall_btn,
						reinst_btn,
						link_btn,
						chk_btn,
						more_download_btn,
						delete_btn,
						remove_from_view_btn,
						export_btn											
					]
				},
				{ xtype: 'tbfill' },						
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'button', 
					margin: '0 4 0 0',
					minWidth: 60,
					hidden: false,
					autoWidth: true,
					id : CP.Packages.FILTER_BTN,	
					text: "Showing "+CP.Packages.resolveFilterStatus(CP.global.filterStatus) + " packages",
					menu: {
						items: [{
							xtype: 'menucheckitem',
							text: 'Recommended',
							value: 0,
							checked: false,
							group: 'filter',
							handler: CP.Packages.onFilterClick
						},
						{
							xtype: 'menucheckitem',
							text: 'Installed',
							value: 1,
							checked: false,
							group: 'filter',
							handler: CP.Packages.onFilterClick
						},
						{
							xtype: 'menucheckitem',
							text: 'All',
							value: 2,
							checked: false,
							group: 'filter',
							handler: CP.Packages.onFilterClick
						}]
					},
					listeners:
					{
						afterrender: function()
						{

							var button = Ext.getCmp(CP.Packages.FILTER_BTN);
							if(button && button.menu && button.menu.items)
							{
								button.setText("Showing "+CP.Packages.resolveFilterStatus(CP.global.filterStatus) + " packages");
								button.menu.items.items[CP.global.filterStatus].checked = true;
								CP.Packages.updatePackageDescription();	
							}
						}
					}
				},
				{
					xtype: 'tbseparator'
				},
				help_btn
				]
			}],
			listeners: {
				afterrender: function()
				{
					var button = Ext.getCmp(CP.Packages.FILTER_BTN);
					if(button && button.menu && button.menu.items)
					{
						button.setText("Showing "+CP.Packages.resolveFilterStatus(CP.global.filterStatus) + " packages"); //fixes button length problem
					}
				},
				itemclick: function(table, record, item, index) {
					CP.Packages.selectedGroup = false;
					CP.Packages.updatePackageDescription();

					Ext.getCmp(CP.Packages.DESCRIPTION_PANEL).items.get('Group_Descirption').hide();
				},
				selectionchange: function(selm, selected) {
					CP.Packages.selectionChange(selected[0]);
				},
				columnresize: function() {
					//CP.Packages.setTableHeight();
				},
				resize: function() {
					var table = Ext.getCmp(CP.Packages.GRID_ID);
					if (table)
					{
						var currentWidth = table.getWidth();
						table.getView().setWidth(currentWidth);
					}
				},
				scrollershow: function(scroller, orientation, eopts) {
					if (orientation=="vertical") {
						var table = Ext.getCmp(CP.Packages.GRID_ID);
						if (table) 
						{
							var row = table.getView().getNode(0);
							var row_height = Ext.get(row).getHeight();
							var num_of_rows = CP.Packages.store.getCount();
							if ((num_of_rows * row_height) < 600) //600 is the height of the grid for the packages
								scroller.hide();
						}
					}
					
					if (orientation=="horizontal") {
						CP.Packages.scrollerHeight=18;
						//CP.Packages.setTableHeight();
					}
				},
				columnshow: function( ct, column, eOpts ) {
					var table = Ext.getCmp(CP.Packages.GRID_ID);
					CP.Packages.hidePackages(table,-1); //always make sure all of the DUMMY packages are hidden when the UI status changes
				},
				columnmove: function( ct, column, fromIdx, toIdx, eOpts )
				{
					var table = Ext.getCmp(CP.Packages.GRID_ID);
					CP.Packages.hidePackages(table,-1); //always make sure all of the DUMMY packages are hidden when the UI status changes
				},
				scrollerhide: function(scroller, orientation, eopts) {
					if (orientation=="horizontal") {
						CP.Packages.scrollerHeight=0;
						//CP.Packages.setTableHeight();
					}
				},
				groupclick: function(view, node, group, e, eOpts) {
					CP.Packages.selectedGroup = true;
					this.getSelectionModel().deselectAll();
					CP.Packages.updateGroupDescription(group);
					var newVal = !CP.Packages.IS_CATEGORY_COLLAPSED.get(group);
					CP.Packages.IS_CATEGORY_COLLAPSED.replace(group,newVal);
					CP.Packages.disableButtons();
				},
				beforeitemcontextmenu: function(view, record, item, index, e) {
					var allow_actions = ((CP.Packages.action_allowed) && !((record.data.pending_reboot) && (record.data.pending_reboot != "")));
					var gridMenu = Ext.getCmp('grid_menu');
					if (!gridMenu)
						return;
					
					var table = Ext.getCmp(CP.Packages.GRID_ID);
					if (!table) {
						return;
					}
					//this is done in order to sync the right click mouse button and the selected row 
					table.getSelectionModel().select(index);
					
					e.stopEvent();
					gridMenu.removeAll();
					if ((CP.global.token == -1) || (CP.UI.accessMode == 'ro')) // don't show context menu if ui is locked or in read only mode
						return;
					var i_btn = Ext.getCmp(CP.Packages.INSTALL_BTN);
					var u_btn = Ext.getCmp(CP.Packages.UNINSTALL_BTN);
					var d_btn = Ext.getCmp(CP.Packages.DOWNLOAD_BTN);
					var p_btn = Ext.getCmp(CP.Packages.PAUSE_BTN);
					var r_btn = Ext.getCmp(CP.Packages.RESUME_BTN);
					var l_btn = Ext.getCmp(CP.Packages.LINK_TO_IMAGE_MANAGEMENT);
					var il_btn = Ext.getCmp(CP.Packages.I_LOG_BTN);
					var ul_btn = Ext.getCmp(CP.Packages.U_LOG_BTN);
					var ifl_btn = Ext.getCmp(CP.Packages.IF_LOG_BTN);
					var chk_btn=Ext.getCmp(CP.Packages.CHK_BTN);
					var reinst_btn=Ext.getCmp(CP.Packages.REINST_BTN);
					var delete_btn=Ext.getCmp(CP.Packages.DELETE_BTN);
					var remove_from_view_btn=Ext.getCmp(CP.Packages.REMOVE_FROM_VIEW_BTN);
					var upgrade_btn=Ext.getCmp(CP.Packages.UPGRADE_BTN);
					var rev_btn=Ext.getCmp(CP.Packages.REVERT_BTN);
					var prv_link_btn=Ext.getCmp(CP.Packages.PRIVATE_PKG_BTN);
					var more_download_btn=Ext.getCmp(CP.Packages.MORE_DOWNLOAD_BTN);
					var export_btn=Ext.getCmp(CP.Packages.EXPORT_BTN);
					
					CP.Packages.buttonShouldAppear(record);
					if (d_btn && d_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(d_btn.id), text: "Download", icon: '../images/icons/download.png', record: record, disabled: !allow_actions});
					}
					if (more_download_btn && more_download_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(more_download_btn.id), text: "Download", icon: '../images/icons/download.png', record: record, disabled: !allow_actions});
					}	
					if (r_btn && r_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(r_btn.id), text: "Resume", icon: '../images/icons/resume.png', record: record, disabled: !allow_actions});
					}
					if (p_btn && p_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(p_btn.id), text: "Pause", icon: '../images/icons/pause.png', record: record, disabled: !allow_actions});
					}
					if (delete_btn && delete_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(delete_btn.id), text: CP.Packages.DELETE_BTN_TEXT, icon: '../images/icons/delete.png', record: record, disabled: !allow_actions});
					}
					if (remove_from_view_btn && remove_from_view_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(remove_from_view_btn.id), text: CP.Packages.REMOVE_FROM_VIEW_TEXT, icon: '../images/icons/remove_from_view.png', record: record, disabled: !allow_actions});
					}
					if (export_btn && export_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(export_btn.id), text: CP.Packages.EXPORT_BTN_TEXT, icon: '../images/icons/submit.png', record: record});
					}
					if (u_btn && u_btn.appear) {
							gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(u_btn.id), text: "Uninstall", icon: '../images/icons/uninstall.png', record: record, disabled: !allow_actions});
					}
					if (rev_btn && rev_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(rev_btn.id), text: "Revert", icon: '../images/icons/install.png', record: record, disabled: !allow_actions});
					} 
					if (reinst_btn && reinst_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(reinst_btn.id), text: "Reinstall", icon: '../images/icons/install.png', record: record, disabled: !allow_actions});
					} 
					if (upgrade_btn && upgrade_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(upgrade_btn.id), text: "Upgrade", icon: '../images/icons/upgrade.png', record: record, disabled: !allow_actions});
					}
					if (chk_btn && chk_btn.appear) { 
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(chk_btn.id), text: CP.Packages.VERIFIER_BTN_TEXT, icon: '../images/icons/check_install.png', record: record, disabled: !allow_actions});
					}
					if (il_btn && il_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(il_btn.id), text: "Save Install Log", icon: '../images/icons/show_logs.png', record: record, disabled: !allow_actions});
					}
					if (ul_btn && ul_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(ul_btn.id), text: "Save Uninstall Log", icon: '../images/icons/show_logs.png', record: record, disabled: !allow_actions});
					}
					if (ifl_btn && ifl_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(ifl_btn.id), text: "Save Install & Uninstall Logs", icon: '../images/icons/show_logs.png', record: record, disabled: !allow_actions});
					}				
					if (i_btn && i_btn.appear) {
						gridMenu.insert(0,{id: CP.Packages.convertButtonIdToContextButtonId(i_btn.id), text: CP.Packages.INSTALL_BTN_TEXT, icon: '../images/icons/install.png', record: record, disabled: !allow_actions});
					} 
					//gridMenu.setTitle("Actions:");//"Name: "+record.data.package_name);
					//gridMenu.setWidth((record.data.package_name.length+5)*7);
					gridMenu.showAt(e.getXY());
				}
			}
		}

		
		var msgs_container = Ext.create( 'CP.WebUI4.Panel',{ //'Ext.panel.Panel',{
			title: 'Important Messages From Last 10 Min.',
			id: 'messages_container',
			cls: 'textField',
			bodyPadding: '10px,10px !important',
			//bodyBorder: 1,
			style: 'background:#fff ; border-width: 1px 1px 1px; border-style: solid; border-color: #878787 ',
			headerAsText: true,
			margin: '10,0 !important',
			height: CP.Packages.tableHeight/2,
			autoHeight: true,
			autoScroll: true,
			listeners: {
				render: function(me) {
					var header=me.header;
					header.add({ xtype: 'tbfill' });
					var myparams={};
					header.add({
						xtype: 'cp4_button',
						text: 'Save full event log',
						handler: function () {
							CP.Packages.supressFailLockMsg();
							myparams["update_log_permissions_package"]="FullEventLog"; // update log file permissions
							Ext.Ajax.request({
								url: CP.Packages.SUBMIT_URL,
								method: 'POST',
								params: myparams,
								success: function() {	
									CP.Packages.unsupressFailLockMsg();
									location.href = _sstr+"/cgi-bin/installer_policy.tcl?package=FullEventLog";
								},
								failure: function() {
									CP.Packages.unsupressFailLockMsg();
								}
							});							
						}
					});
				}
			},
			items: [dynamic_msgs ]
		});

		var descriptionPanel = Ext.create('CP.WebUI4.DataFormPanel',{
			id: CP.Packages.DESCRIPTION_PANEL,
			cls: 'textField',
			collapsible:false,
			autoScroll: true,
			autoHeight: true,
			minHeight: CP.Packages.tableHeight,
			html: '',
			region: 'center',
			margin: '10 5 0 20',
			hidden: true,
			items: [{
						xtype: 'cp4_label',
						id: 'File_name',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_label',
						id: 'File_size',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_label',
						id: 'File_type',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_label',
						id: 'File_dates',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_label',
						id: 'File_products',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_status',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_label',
						id: 'File_tags',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_Actions', 
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_description',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_parent',
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_child',  
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_conflict',  
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_installed_deps',  
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'File_uninstalled_deps',  
						margins: '0 0 0 10'
					},
					{
						xtype: 'cp4_displayfield',
						id: 'Group_Descirption',
						margins: '0 0 0 10'
					}
					]
			
				
		});
		
		var tableTitle =Ext.create('CP.WebUI4.Panel',{
			id: CP.Packages.PKGS_TITLE,
			//title: ' ',
			header: false,
			//cls: 'textField',
			//headerAsText: true,
			bodyPadding: '0 !important',
			padding: 0,
			margin: '0 0 0'
			
		});
		
		
		var descTitle = Ext.create('CP.WebUI4.DataFormPanel',{
			id: CP.Packages.DESC_TITLE,
			cls: 'textField',
			bodyPadding: '0 !important',
			padding: '0 !important',
			region: 'north',
			style: 'border-bottom: 1px solid; border-color: #878787',
			margin: '0 0 0',
			listeners: {
				beforeshow: function(){
					if (Ext.get(CP.Packages.DESC_TITLE).dom.children[0] && Ext.get(CP.Packages.DESC_TITLE).dom.children[0].style)
						Ext.get(CP.Packages.DESC_TITLE).dom.children[0].style["background-image"] = "url(../images/icons/background-image.png)";
					if (Ext.getCmp(CP.Packages.DESC_TITLE).header)
						Ext.getCmp(CP.Packages.DESC_TITLE).header.setHeight(27);
				},
				show: function(){
					Ext.getCmp(CP.Packages.DESC_TITLE).doLayout();
				}
			}
		});
		
		var desc_panel=Ext.create( 'CP.WebUI4.Panel',{//'CP.WebUI4.DataFormPanel', {
			bodyStyle: 'padding:0px;',
			bodyBorder: false,
			style: 'background-color: white; border-width: 1px; border-style: solid; border-color: #878787 ',
			id: CP.Packages.DESC_PANEL,
			region: 'east',
			split: true,
			autoScroll: true,
			cls: 'textField',
			minHeight: CP.Packages.tableHeight,
			layout: {
				type: 'border'
			},
			flex: 1,
			items: [ descTitle, descriptionPanel]
		});
		
		
		var package_panel=Ext.create( 'Ext.container.Container',{//'CP.WebUI4.DataFormPanel', {
			//title: 'Package Details',
			margin: '0',
			bodyStyle: 'padding:0px !important',
			bodyBorder: false,
			header: false,
			style: 'border-width: 1px; border-style: solid; border-color: #878787 ',
			id: CP.Packages.PACKAGES_CONTAINER,
			region: 'center',
			layout: 'fit',
			//split: true,
			//autoScroll: true,
			//collapsible:true,
			//headerAsText: true,
			//maxHeight: CP.Packages.tableHeight,
			minHeight: CP.Packages.tableHeight,
			autoWidth: true,
			flex: 2,
			items: [ packagesTable ]
		});
		
		
		var important_messages_btn=Ext.create('CP.WebUI4.Button', {
			text: 'Event log',
			id: CP.Packages.EVENT_LOG_BTN,
			margin: '10 0 0 0',
			handler: function() {
				var win = Ext.getCmp('Importatnt_message_window');
				if (!win){
					win = new Ext.Window({
						left: 0,
						top: 0,
						id: 'Importatnt_message_window',
						closeAction: 'hide',
						autoDestroy: false,
						width: 900,
						height: 600,
						autoScroll: true,
						layout: 'fit',
						items: msgs_container,
						buttons: [{
								text: 'Close',
								handler: function(){
									win.hide();
								}
							}]
					});
				}
				win.doLayout();
				win.show();
				CP.Packages.getEventLogMessages();
			}
			});

		var about_button=Ext.create('CP.WebUI4.Label', {
			html: '<span style="color: blue; font-face=Arial; font-size: 9pt; text-decoration:underline;cursor: pointer;">Hotfixes</span><span style=style="color:#4b4b4b; font-face=Arial; font-size: 9pt; font-weight: bold"> &nbsp;&nbsp;|&nbsp;&nbsp</span>',
			id: CP.Packages.ABOUT_BTN,
			padding: '0 0 0 7',
			margin: '0',
			hidden: true,
			width: 70,
			listeners: { 
				element: 'el', 
				click: function () { 
					CP.Packages.CreateAboutWindow(); 
				} 
			}
		});	

		var south_panel = Ext.create('CP.WebUI4.DataFormPanel', {
			region: 'south',
			layout: {
				type: 'hbox'
			},
			margin: '0 0 6 0 !important',
			items: [ important_messages_btn,{ xtype: 'tbfill' }]
		});

		var center_panel=Ext.create('CP.WebUI4.DataFormPanel', {
			region: 'center',
			margin: 0,//'0 10 10',
			id: 'center_panel',
			layout: 'border',
			//height: CP.Packages.tableHeight,
			defaults: {
				split: true
			},
			listeners: {
				afterrender: function(){
					this.doLayout();
				}
			},
			items: [package_panel , desc_panel]
		});
		
		var update_status_panel  = Ext.create('CP.WebUI4.DataFormPanel', {
			id: CP.Packages.UPDATE_STATUS_PANEL,
			cls: 'textField',
			html: '',
			margin: '0',
			width: 300,
			margin: '0 !important',
			padding: '0 !important'
		});
		
		var title_panel = Ext.create('CP.WebUI4.Panel', {
			layout: {
				type: 'hbox',
				align: 'middle'
			}, 
			margin: '0 0 10 0',
			items: [
					currentVersionPanel,
					about_button,
					update_status_panel,
					{ xtype: 'tbfill' },
					check_for_update_btn,
					import_btn,
					search_hotfixes_btn 
				]
		});
		
		var north_panel=Ext.create('CP.WebUI4.DataFormPanel', {
			region: 'north',
			id: 'north_panel',
			margin: '0 0 0',
			items: [static_msgs, title_panel]
		});
		
		
		var border_panel=Ext.create('CP.WebUI4.DataFormPanel', {
			//width: Ext.getBody().getViewSize().width,//2*CP.Packages.tableWidth,
			//align: 'stretch',
			height: 830,
			//autoHeight: true,
			id: 'border_panel',
			margin: 0,
			layout: 'border', //'vbox',
			items: [ north_panel, package_panel, south_panel,desc_panel ]
		});
		
		return [ border_panel ]
	}
	
	,importPressed: function()  {
		
		// throw if cancel of DA pop-up
		if (CP.Packages.self_update!='' && CP.Packages.critical_installation_window_open == false) {
			CP.Packages.NewAgentWindow();
			return;
		}
		
		var winTitle = "";
		var additionalItem = [];
		var okDisabled = false;
		
		var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
			id: 'import-modal-window',
			name: 'import-modal-window',
        		width:  450,
			height: 200,
			title: '',
			items: [{
				xtype: 'cp4_formpanel',
				id: 'additional_item_panel',
				bodyPadding: 15,
				buttons: [{
                			xtype: "cp4_button"
	                		,id:"btn-ok"
        	       			,text: "OK"
            			},{
               				xtype: "cp4_button"
	               			,id:"btn-cancel"
        	       			,text: "Cancel"
               				,handler: function (){ Ext.getCmp('import-modal-window').close(); }
            			}]
			}]
		});
		
		Ext.getCmp('import-modal-window').setHeight(200) ;
		var okButton = Ext.getCmp( 'btn-ok' );
		var cancelButton = Ext.getCmp( 'btn-cancel');
		winTitle = "Import Package";
		additionalItem = CP.Packages.getImportForm();
		okButton.disable();
		cancelButton.enable();
		Ext.getCmp('import-modal-window').setHeight(240) ;
        
		okButton.setHandler(CP.Packages.handleOK);
                        
		Ext.getCmp( 'additional_item_panel').add( additionalItem );
        
		modalWin.setTitle( winTitle );
		modalWin.show();
	}

	,searchPressed: function()  {		
		var winTitle = "";
		var additionalItem = [];
		var okDisabled = false;	
		
		CP.Packages.overrideLock();			
		var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
			id: 'search-modal-window',
			name: 'search-modal-window',
        	width:  450,
			height: 200,
			title: '',	
			viewConfig: {
				loadMask: false				
			},
			items: [{
				xtype: 'cp4_formpanel',
				id: 'additional_item_panel',
				bodyPadding: 15,
				buttons: [{
               				xtype: "cp4_button"
	               			,id:"search-btn-cancel"
        	       			,text: "Cancel"
               				,handler: function (){Ext.getCmp('search-modal-window').close();}
            			}]
			    }]
			   ,listeners: {				
				close: function(panel, eOpts){	
					Ext.getCmp('search_loading').hide();
					Ext.getCmp("search-btn-cancel").enable();
					 Ext.Ajax.request({
                         url: CP.Packages.SUBMIT_URL,
                         method: 'POST',
                         params: { reset_priv_pkg_enter_grid_status: CP.Packages.PRIV_PKG_FILE_NAME_TMP },
                         success: function() {
                        	 	
                                 CP.Packages.connection_fail_counter=0;
                                 CP.Packages.unsupressFailLockMsg();
                         },
                         failure: function() {

                                 CP.Packages.connection_fail_counter++;
                                 CP.Packages.unsupressFailLockMsg();
                         }
                 });

			}
			}		
		});
			
		winTitle = "Add Hotfixes from the cloud";
		additionalItem = CP.Packages.getSearchForm();			
		Ext.getCmp('search-modal-window').setHeight(200) ;                        
		Ext.getCmp( 'additional_item_panel').add( additionalItem );
		modalWin.setTitle( winTitle );
		modalWin.show();
	}
	
	,updateGroupDescription: function(group) {
		var desc_panel = Ext.getCmp(CP.Packages.DESCRIPTION_PANEL);
		if (!desc_panel || !desc_panel.items) {
			return;
		}

		CP.Packages.clearPackageDescription('Group_Descirption');

		var groupDescField = desc_panel.items.get('Group_Descirption');
		var group_name = "";
		groupDescField.setWidth(desc_panel.getWidth());
		switch (group) {
			case "1":
				{ // Hotfix
					group_name = 'Hotfixes';
					groupDescField.setValue("<b>Hotfixes</b> are Check Point's lightest software updates, for security fixes and feature improvement.<br><br>Hotfixes are released after issue fixes are developed and tested.<br>For more information, refer to <a href='http://supportcontent.checkpoint.com/solutions?id=sk95746' target='_blank' style='color:blue'>sk95746</a>");
				}
				break;
			case "4":
				{ // HFA
					group_name = 'HFAs';
					groupDescField.setValue("<b>HFAs</b> (or <b>H</b>ot<b>F</b>ix <b>A</b>ccumulators) are also known as <b>Minor Versions</b>.<br>Maintenance releases on top of major releases. Minor releases include the latest fixes released to customers. In the past few years, Check Point has released 3-4 minor releases per year. Some examples of minor releases would be: <a href='http://supportcontent.checkpoint.com/solutions?id=sk93448' target='_blank' style='color:blue'>R75.47</a>, <a href='http://supportcontent.checkpoint.com/solutions?id=sk90960' target='_blank' style='color:blue'>R75.46</a>, <a href='http://supportcontent.checkpoint.com/solutions?id=sk101208' target='_blank' style='color:blue'>R77.20</a>.<br>For more information, refer to <a href='http://supportcontent.checkpoint.com/solutions?id=sk95746' target='_blank' style='color:blue'>sk95746</a>");
				}
				break;
			case "5":
				{ // Major
					group_name = 'Major Version';
					groupDescField.setValue("<b>Major Version:</b> Introduces new functionalities and cutting edge innovative technologies to the market while maintaining high product quality. In the past few years Check Point has released 1-2 major releases per year. Some examples of major releases would be: <a href='http://supportcontent.checkpoint.com/solutions?id=sk92965' target='_blank' style='color:blue'>R77</a>, <a href='http://supportcontent.checkpoint.com/solutions?id=sk91140' target='_blank' style='color:blue'>R76</a>.<br>For more information, refer to <a href='http://supportcontent.checkpoint.com/solutions?id=sk95746' target='_blank' style='color:blue'>sk95746</a>");
				}
				break;
		}
		groupDescField.show();

		var desc_title = Ext.getCmp(CP.Packages.DESC_TITLE);
		if (desc_title) {
			desc_title.setTitle(group_name);
		}
		desc_title.getEl().set({'data-qtip' : group_name + " definition"});

		desc_panel.show();
	}

	,clearPackageDescription: function(field_not_to_hide) {
		var desc_panel = Ext.getCmp(CP.Packages.DESCRIPTION_PANEL);
		if (!desc_panel || !desc_panel.items) {
			return;
		}
		desc_panel.items.each(function(field) {
			if (field.getXType() == "cp4_label") {
				field.setText("", false);
			}
			if (field.getXType() == "cp4_displayfield") {
				field.setValue("");
				if (field.id != field_not_to_hide) {
					field.hide();
				}
			}
		});
		var desc_title = Ext.getCmp(CP.Packages.DESC_TITLE);
		if (desc_title) {
			desc_title.setTitle("");
		}

		Ext.getCmp(CP.Packages.DESCRIPTION_PANEL).show();
	}

	,updatePackageDescription: function() {
		var row = CP.Packages.getSelectedPackage();
		if (!row) {
			return;
		}
			
		var pkg_name ="";
		if (row.data) {
			var pkg_name=row.data.package_name;
		}
		
		if (pkg_name.indexOf("DUMMY") > -1) {//no row is selected - clean the content of description panel
			CP.Packages.clearPackageDescription();
			return;
		}
		
		var status=row.data.status;
		var status_text=row.data.status_text;
		var description=row.data.description;
		var type=row.data.pkg_type_modified;
		var chk_description=row.data.chk_description;
		var d_failure_reason=row.data.d_failed;
		var i_failure_reason=row.data.i_failed;
		var u_failure_reason=row.data.u_failed;
		var d_failure_time=row.data.d_failed_time;
		var i_failure_time=row.data.i_failed_time;
		var u_failure_time=row.data.u_failed_time;
		var requires_reboot = row.data.requires_reboot;
		var disable_upgrade = row.data.disable_upgrade;
		var additional_info = row.data.additional_info;
		
		/* REMOVED FOR MS2
		var pkg_tag = row.data.package_tags;
		var resolved_pkg_tag = CP.Packages.resolvePackageTags(pkg_tag);
		if (resolved_pkg_tag =="")
			pkg_tag="";
		else if (resolved_pkg_tag == CP.Packages.BETA_TAG_TEXT){
			pkg_tag="<b>Package Category:</b> Beta - Not for production use. Provided AS IS. Applicable warranties do not apply.<br><br>";
		}
		else if (resolved_pkg_tag == CP.Packages.EA_TAG_TEXT){
			pkg_tag="<b>Package Category:</b> Early Availability - Not recommended for production use.<br><br>";
		}
		else{
			pkg_tag="<b>Package Category:</b> "+resolved_pkg_tag+"<br><br>";
		}
		*/

		var modified_type=type; // Legacy packages use a modified type - they are marked as a regular package (HF / bundle) but with a legacy_hofix attribute - CR01468485
		if (row.data.legacy_hotfix=="1") {
			modified_type=CP.Packages.TYPE_LEGACY;
		}
		if (row.data.legacy_hotfix=="2") {
			modified_type=CP.Packages.TYPE_LEGACY_MINI_WRAPPER;
		}
		
		var full_pkg_msg = "This package is larger than usual because inconsistent files were detected on your machine";
		var is_full_pkg = (pkg_name.indexOf(CP.Packages.FULL_EXT) >= 0);
		var full_pkg_icon = "";
		if (is_full_pkg) { 
			full_pkg_icon = " <img src='../images/icons/help.png' height='12' width='12' title='"+full_pkg_msg+"'>";
		}
		
		// create the package description
		var details={
			pkg_name: row.data.legacy_hotfix?"<b>Package Name:</b> "+pkg_name+"<br><br>":"<b>File Name:</b> "+pkg_name+"<br><br>",
			size: row.data.size?"<b>Package Size:</b> "+Ext.util.Format.fileSize(row.data.size)+full_pkg_icon+"<br><br>":"",
			type: "<b>Package Type:</b> "+CP.Packages.getPkgTypeStr(modified_type)+"<br><br>",
			//REMOVED FOR MS2 pkg_tag: pkg_tag,
			rel_date: row.data.available_from?"<b>Release Date:</b> "+CP.Packages.AF_rend(row.data.available_from,"","","")+"<br><br>":"",
			downloaded_on: row.data.downloaded_on?"<b>Downloaded On:</b> "+CP.Packages.IDO_rend(row.data.downloaded_on)+"<br><br>":"",
			installed_on: row.data.installed_on?"<b>Installed On:</b> "+CP.Packages.IDO_rend(row.data.installed_on)+"<br><br>":"",
			product: (row.data.legacy_hotfix=="2")?("<b>Products:</b> "+row.data.product+"<br><br>"):(row.data.legacy_hotfix=="1"?("<b>Product:</b> "+row.data.product+"<br><br>"):""), 
			check: ""
		}
		
		if ((type == CP.Packages.TYPE_MAJOR) || (type == CP.Packages.TYPE_FULL_MINOR) || (type == CP.Packages.TYPE_REVERT))
		{
			details.size="<b>Image Size:</b> "+Ext.util.Format.fileSize(row.data.size)+"<br><br>";
		}
		
/*		var icon='';
		if (row.data.check_install_success=="1") { // success
			icon='../images/icons/status-icons_20.png';
		}
		if (row.data.check_install_success=="0") { // failure
			icon='../images/icons/status-icons_21.png';
		}
		if (row.data.check_install_success=="2") { // warning
			icon='../images/icons/status-icons_32.png';
		}
		
		if (chk_description!="" && icon!='') {
			details.check='<img src='+icon+' height="12" width="12"> '+chk_description+'<br>';
		}*/
		
		var package_parent="";
		var package_installed_parent="";
		var package_child="";
		var installed_deps = "";
		var uninstalled_deps = "";
		var package_conflict="";
		var pkg_id;
		if (type != CP.Packages.TYPE_MAJOR) //add topological data to the packages description 
		{
			for (var i=0; i< CP.Packages.store.getCount(); i++) { // convert the found file name to display name
				var table_row_data= CP.Packages.store.getAt(i).data;
				var table_row_disp_name = (table_row_data.display_name != "") ? table_row_data.display_name : table_row_data.package_name;
				if (row.data.package_parent.indexOf(table_row_data.package_name) != -1){
					if (table_row_data.display_name != "") {
						package_parent += '&bull; ' + table_row_disp_name + '<br>';
					}
					if (table_row_data.status == CP.Packages.INSTALLED || table_row_data.status == CP.Packages.UNINSTALL_FAILED) {
						if (table_row_data.display_name != "") {
							package_installed_parent = table_row_disp_name;
						}	
					}
				}
				if (row.data.package_child.indexOf(table_row_data.package_name) != -1){
					if (table_row_data.display_name != "") {
						package_child += '&bull; ' + table_row_disp_name + '<br>';
					}
				}
				if (row.data.package_conflict.indexOf(table_row_data.package_name) != -1){
					if (table_row_data.display_name != "") {
						package_conflict += '&bull; ' + table_row_disp_name + '<br>';
				}
				}
				// show uninstallation dependency only when this package and the dependant package are both installed
				if ((row.data.uninstalled_deps.indexOf(table_row_data.package_name) != -1) &&
					(table_row_data.status == CP.Packages.INSTALLED || table_row_data.status == CP.Packages.UNINSTALL_FAILED) &&
					(row.data.status == CP.Packages.INSTALLED || row.data.status == CP.Packages.UNINSTALL_FAILED)) {					
					if (table_row_data.display_name != "") {
						uninstalled_deps += '&bull; ' + table_row_disp_name + '<br>';			
					}
				}
				
			}
			// we need to search separately for installed deps (and not for uninstall deps) because uninstall deps cannot contain hotfix_id, but install deps can contain them
			if (row.data.installed_deps != "") {
				var deps_split = row.data.installed_deps.split(",");
				for (var i in deps_split) {
					var disp_name = CP.Packages.convertFileNameToDisplayName(deps_split[i]);
					if (disp_name != "") {
						installed_deps += '&bull; ' + disp_name + '<br>';
					}
					else {
						installed_deps += '&bull; ' + deps_split[i] + '<br>';
					}
				}
				
			}

			if (package_parent != "")
				package_parent = "<b>Contained in:</b><br>"+package_parent+"<br>";
			else
				package_parent = "<b>Contained in: No other packages</b><br>";
				
			if (package_child != "")
				package_child = "<b>Contains the following packages:</b><br>"+package_child+"<br>";
			else
				package_child = "<b>Contains the following packages: No other packages</b><br>";
				
			if (installed_deps != "")
				installed_deps = "<b>Installation depends on the following packages:</b><br>"+installed_deps+"<br>";
			
			if (uninstalled_deps != "")
				uninstalled_deps = "<b>Uninstallation depends on the following packages:</b><br>"+uninstalled_deps+"<br>";
			
			/* NOT FOR MS2
			if (package_conflict != "")
				package_conflict = "<b>This packages is in conflict with:</b><br>"+package_conflict+"<br>";
			else
				package_conflict = "<b>This packages is in conflict with: No other packages</b><br>";
			*/
		}
		
		var color="black";
		var status_line="";
		var status_str="";
		var status_headline="<b>Status:</b><br>";
		var failure_reason="";
		var rate="";
		
		if (status == CP.Packages.DOWNLOADING) {
			if ((row.data.cur_rate!="") && (row.data.remaining_time!="")) {
				rate="<br>Current Download Rate: "+Ext.util.Format.fileSize(row.data.cur_rate)+"/s<br>"+"Estimated Remaining Time: "+row.data.remaining_time;
			}
			else {
				rate="<br>Current Download Rate: 0.0<br>"+"Estimated Remaining Time: N/A.";
			}
			if (row.data.download_retry_counter!="") {
				rate+="<br>Download Retry Counter: "+row.data.download_retry_counter+" of "+CP.Packages.MAX_DOWNLOAD_RETRY+".<br>";
			}
		}
		
		// Updating the status description - according to each possible state:
		if (status == CP.Packages.AVAILABLE_DOWNLOAD) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.AVAILABLE_FOR_DOWNLOAD_ICON_PATH+'> The package is available for download';
		}
		if ((status == CP.Packages.PARTIALLY_DOWNLOADED) ) {
			
			if(row.data.progress == ""){ 
				row.data.progress="0";
			}
			if(row.data.cur_size == ""){
				row.data.cur_size="0";
			}
			
			status_line='<img style="vertical-align:middle" src='+CP.Packages.DOWNLOAD_PAUSE_ICON_PATH+"> Partially downloaded ("+
				row.data.progress+"% ;"+
				Ext.util.Format.fileSize(row.data.cur_size)+" / "+
				Ext.util.Format.fileSize(row.data.size)+")";
			// console.log( "UpdateDesc: status="+status+" .");
		}
		if (status == CP.Packages.DOWNLOADING) {
			status_line="The package is downloading: "+row.data.progress+"%";
		}
		if (status == CP.Packages.AVAILABLE_INSTALL) {			
			if ((row.data.pending_reboot) && (row.data.pending_reboot != "")) {
				status_line='<img style="vertical-align:middle" src='+CP.Packages.UNINSTALLED_PENDING_REBOOT_ICON_PATH+'> The package is uninstalled, pending reboot';
			}
			else if (CP.Packages.isDownloadedForDiffVersion(row.data)){
				status_line='<img style="vertical-align:middle" src='+CP.Packages.DOWNLOADED_FOR_DIFFERENT_VERSION_ICON_PATH+'> The package downloaded for different version';
			}
			else{
				status_line='<img style="vertical-align:middle" src='+CP.Packages.AVAILABLE_FOR_INSTALL_ICON_PATH+'> The package downloaded successfully';
			}
		}
		if (status == CP.Packages.INSTALLING) {
			status_line="The package is installing: "+row.data.progress+"%";
		}
		if (status == CP.Packages.INSTALLED) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_ICON_PATH+'> The package is installed';	
			if (row.data.self_test_res=="success") {
				status_line='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_ICON_PATH+'> The package is installed, self-test passed';
			}
			if (row.data.self_test_res=="failure") {
				status_line='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_WITH_ERRORS_ICON_PATH+'> The package is installed, self-test failed';
			}			
			if ((row.data.pending_reboot) && (row.data.pending_reboot != "")) {
				status_line='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_PENDING_REBOOT_ICON_PATH+'> The package is installed, pending reboot';
			}			
			if (row.data.bundle_err=="1") {
				status_line='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_WITH_ERRORS_ICON_PATH+'> The package is installed with errors';
			} 		
		}
		if (status == CP.Packages.INSTALL_FAILED) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+'> The package failed to install at '+i_failure_time;
			failure_reason='Reason of failure: '+i_failure_reason+'<br>';
		}
		if (status == CP.Packages.INSTALL_SKIPPED) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+'> The package failed a pre-install validation at '+i_failure_time;
			failure_reason='Reason of failure: '+i_failure_reason+'<br>';
		}
		if (status == CP.Packages.DOWNLOAD_FAILED) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+'> The package failed to download at '+d_failure_time;
			failure_reason='Reason of failure: '+d_failure_reason+'<br>';
		}
		if (status == CP.Packages.UNINSTALL_FAILED) {
			status_line='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+'> The package failed to uninstall at '+u_failure_time;
			failure_reason='Reason of failure: '+u_failure_reason+'<br>';
		}
		if (status == CP.Packages.INSTALL_CONTAINED) {
			if(CP.Packages.isDeletebleStatus(row.data.old_state))
			{
				status_line='<img style="vertical-align:middle" src='+CP.Packages.CONTAINED_ICON+'> Downloaded, Installed as part of another package:<br>'+ package_installed_parent;	
			}
			else
			{
				status_line='<img style="vertical-align:middle" src='+CP.Packages.CONTAINED_ICON+'> Installed as part of another package:<br>'+ package_installed_parent;
			}
		}
		
		//update the description status with the temporary initiating/resuming operation
		if (status_text.indexOf("Initiating") > -1 || status_text.indexOf("Resuming") > -1) {
			color="black";
			status_line=status_text;
			failure_reason="";
			rate="";
		}
		
		if (!Ext.isEmpty(status_line)) {
			status_str = status_headline+'<br><span style="color:'+color+';">'+status_line+rate+'</span><br>'+failure_reason + '<br>';
		}

		var important_msgs = '<b>Important Messages: </b><br>&bull; While the package is installing, the cpstop and cpstart commands are run';
		if (requires_reboot == "1") {
			important_msgs += '<br>&bull; After the package is installed, the gateway reboots';
		}

		if (disable_upgrade == "1") {
			important_msgs += '<br>&bull; Upgrade to this version from current version is prohibited. Use clean install.';
		}

		if ((additional_info) && (additional_info != "")) {
			important_msgs += '<br>&bull; <span style="color: blue;">' + additional_info + '</span><br>';
		}		
		
		var desc_panel = Ext.getCmp(CP.Packages.DESCRIPTION_PANEL);
		var decription_data = desc_panel.items;
		decription_data.each(function(field) {
			field.setWidth(desc_panel.getWidth());
			field.show();
		});
		decription_data.get('File_name').setText(details.pkg_name,false);
		decription_data.get('File_size').setText(details.size,false);
		decription_data.get('File_type').setText(details.type,false);
		decription_data.get('File_dates').setText(details.rel_date+details.downloaded_on+details.installed_on,false);
		decription_data.get('File_products').setText(details.product,false);
		decription_data.get('File_status').setValue(status_str);
		//REMOVED FOR MS2 decription_data.get('File_tags').setText(details.pkg_tag,false);
		decription_data.get('File_description').setValue("<b>Description:</b><br>"+description);
		decription_data.get('File_parent').setValue(package_parent);
		decription_data.get('File_child').setValue(package_child);
		decription_data.get('File_conflict').setValue(package_conflict);
		decription_data.get('File_installed_deps').setValue(installed_deps);
		decription_data.get('File_uninstalled_deps').setValue(uninstalled_deps);
		decription_data.get('File_Actions').setValue(important_msgs);
		if (!CP.Packages.selectedGroup) {
			decription_data.get('Group_Descirption').hide();
		}

		var package_name = CP.Packages.getSelectedPackageField('display_name');
		if (!package_name) {
			package_name = CP.Packages.getSelectedPackageField('package_name');
			if (!package_name) {
				package_name = "";
			}
		}
		var desc_title=Ext.getCmp(CP.Packages.DESC_TITLE);
		if (desc_title){
			if (package_name.indexOf("DUMMY") != -1){
				package_name = "";
			}
			desc_title.setTitle('Package Details');
			desc_title.getEl().set({'data-qtip': package_name});
		}

		desc_panel.show();
	}
	
	,getIconToMsg: function(messageNotificationType) {
		// set default message
		var icon_text_msg="";
		// In case of success message - paint green
		if (messageNotificationType == 3) {
			icon_text_msg='<img style="vertical-align:middle" src='+CP.Packages.INSTALLED_ICON_PATH+'> ';
		}
		// In case of failure message - paint red
		else if (messageNotificationType == 0) {
			icon_text_msg='<img style="vertical-align:middle" src='+CP.Packages.FAILURE_MESSAGE_ICON+'> ';
		}
		// In case of Warning message - paint orange
		else if (messageNotificationType == 1) {
			icon_text_msg='<img style="vertical-align:middle" src='+CP.Packages.WARNING_MESSAGE_ICON+'> ';
		}
		// In case of Information message
		else
		{
			icon_text_msg='<img style="vertical-align:middle" src='+CP.Packages.INFORMATION_MESSAGE_ICON+'> ';
		}
		
		return icon_text_msg;
	}
	
	,createMsg: function(dicMsg) {
		msg = Ext.create('Ext.form.Panel', {
			border: false,
			layout: {
						type: 'hbox'
					},
			items: [{
				xtype: 'textarea',
				forId: 'time_stamp_Id',
				html: "["+dicMsg.time_stamp+"]:",
				margins: '0 0 0 0',
				padding: '0',
				width: 150
			},
			{
				xtype: 'textarea',
				forId: 'message_icon',
				html: CP.Packages.getIconToMsg(dicMsg.notification_type),
				margins: '0 0 0 0',
				padding: '0 0 0 0',
				width: 20
			},
			{
				xtype: 'textarea',
				forId: 'message_id',
				html:"&nbsp;" + dicMsg.message,
				margins: '0 0 0 0',
				padding: '0 0 0 0',
				width: 660
			}]
		});
		return msg;
	}
	
	,popupMessage: function(message, time_stamp,ballon_flag,success) {
		// shows a pop-up message
		
		if (ballon_flag){
			var t = new Ext.ToolTip({
				title: '',
				style: 'background:#FFFF99',
				//style: " display: inline-block;padding: 15px;background: #fff; position: relative;max-width: 350px; margin: 0 0 0 0; -webkit-filter: drop-shadow(0 0 10px gold); -moz-filter: drop-shadow(0 0 10px gold); filter: drop-shadow(0 0 10px gold);",
				html: message,
				closable: true,
				anchor: 'bottom',
				target: CP.Packages.EVENT_LOG_BTN,
				//preventHeader: true,
				anchorOffset: 10,
				hideDelay: 150000,
				dismissDelay: 15000,
				
				listeners: {
					beforehide: function( comp) {
						comp.el.slideOut('b');
						var index = CP.Packages.findInPopupArray(comp.id);
						CP.Packages.TOOL_TIP_MESSAGES.splice(index, 1);
						return false;
					}
	}
 
			});
			
			if (CP.Packages.TOOL_TIP_MESSAGES.length > 0) {
				t.showAt([0,0]); // ensure it's rendered and visible so that it has dimensions for following calc
				var t_last = CP.Packages.TOOL_TIP_MESSAGES.pop();
				t.alignTo(t_last.el, 'bl-tl', [0, -6]);
				
				}
				else
				{
				t.showAt([0,0]); // ensure it's rendered and visible so that it has dimensions for following calc
				//t.showAt(t.el.getAlignToXY(Ext.getCmp(CP.Packages.EVENT_LOG_BTN).el, 'bl-bl', [55, -20]));
				t.alignTo(CP.Packages.EVENT_LOG_BTN, 'bl-tl', [0, -6]);
				}
			t.el.slideIn('b');
			
			CP.Packages.TOOL_TIP_MESSAGES.push(t);
			}
	}
 
	,showLog: function(button_id) {
		//download the required log - use installer_policy.tcl to get entire file
		
		selectedRowName = CP.Packages.getSelectedPackageField("package_name");
		if (!selectedRowName) {
			return;
		}
		
		var myparams = {};
		CP.Packages.supressFailLockMsg();
		myparams["update_log_permissions_package"]=selectedRowName; // update log file permissions
		if (button_id == CP.Packages.I_LOG_BTN) {
			myparams["update_log_permissions_type"]="i_log"; 
		}
		
		if (button_id == CP.Packages.U_LOG_BTN) {
			myparams["update_log_permissions_type"]="u_log";
		}

		if (button_id == CP.Packages.IF_LOG_BTN) {
			myparams["update_log_permissions_type"]="both";
		}
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'POST',
			params: myparams,
			success: function() {

				CP.Packages.unsupressFailLockMsg();
		if (button_id == CP.Packages.I_LOG_BTN) {
							location.href = _sstr+"/cgi-bin/installer_policy.tcl?package=" + selectedRowName + "&type=i_log";
		}
		
		if (button_id == CP.Packages.U_LOG_BTN) {
							location.href = _sstr+"/cgi-bin/installer_policy.tcl?package=" + selectedRowName + "&type=u_log";
		}
		
		if (button_id == CP.Packages.IF_LOG_BTN) {
							location.href = _sstr+"/cgi-bin/installer_policy.tcl?package=" + selectedRowName + "&type=i_log";
							location.href = _sstr+"/cgi-bin/installer_policy.tcl?package=" + selectedRowName + "&type=u_log";
		}
			},
			failure: function() {
				CP.Packages.unsupressFailLockMsg();
			}
		});
	}
  
	,do_install:function(selectedRow, myparams, status_text) {
			Ext.getCmp(CP.Packages.INSTALL_BTN).disable();
			Ext.getCmp(CP.Packages.REINST_BTN).disable();
			Ext.getCmp(CP.Packages.UPGRADE_BTN).disable();
			Ext.getCmp(CP.Packages.REVERT_BTN).disable();
			Ext.getCmp(CP.Packages.UNINSTALL_BTN).disable();
			CP.Packages.packageRunning = true;
			
			selectedRow.set("local_status_text",status_text); // saving the current status (text)
			selectedRow.set("saved_status",selectedRow.data.status); // saving the current status (numeric)
			selectedRow.set("dont_display_progress",1); //set the display property to false
			
			CP.Packages.updatePackageDescription();
			
			// performing the required action
			CP.Packages.supressFailLockMsg();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("do_install res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					CP.Packages.install_id++;
					CP.Packages.unsupressFailLockMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
				}
			});
	}
	
	,uninstall: function(selectedRow, myparams) {
		if (!selectedRow) {
			return;
		}
		selectedRow.set("local_status_text","Initiating Uninstall");
		selectedRow.set("saved_status",selectedRow.data.status);
		selectedRow.set("dont_display_progress",1); //set the display property to false
		CP.Packages.updatePackageDescription();
		
		// performing the required action
		CP.Packages.supressFailLockMsg();
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: "POST",
			params: myparams,
			success: function(response) {
				CP.Packages.connection_fail_counter=0;
				CP.Packages.unsupressFailLockMsg();
				//console.log("Got response: "+response.responseText);
			},
			failure: function() { 
				CP.Packages.connection_fail_counter++;
				CP.Packages.unsupressFailLockMsg(); 
			}
		});
	}

	,delPkg: function(package_name) {
		var myparams = {};
		myparams["delete_pkg"] = package_name;
		CP.Packages.supressFailLockMsg();
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: 'POST',
			params: myparams,
			success: function(response) {
				//console.log("delete res: "+response.responseText);
				CP.Packages.connection_fail_counter=0;
				CP.Packages.unsupressFailLockMsg(); 
			},
			failure: function() { 
				CP.Packages.connection_fail_counter++;
				CP.Packages.unsupressFailLockMsg(); 
			}
		});
		
	}
	
	,getSearchComp:function(){		
		var searchCPUSEStore=
		{
			xtype:'cp4_jsonstore',
			autoLoad: false,		
			fields: [ 'js_id',
					'js_text',
					'js_desc',
					'js_releaseDate'],
			proxy: {
				type: 'ajax',
				url: CP.Packages.SUBMIT_URL,			
				reader: {
					type: 'json',
					root: 'data.search'
				}
			},
			listeners: {
				beforeload: function( thisStore, operation, eOpts ) {
					thisStore.removeAll();
					if (CP.Packages.searchTrigerred){
						operation.params = {"search_polling":"true"};
						return;
					}
					
					if (!CP.Packages.searchStarted)
						return false;
					operation.params = {"search_polling":"true"};
					CP.Packages.searchStarted = false;			
				},
				load: function( thisStore, records, successful, operation, options ) {
					
					if (CP.Packages.searchTrigerred || (!CP.Packages.searchInvalid && !CP.Packages.searchCanceled && records.length == 0)){	
						if (CP.Packages.searchTrigerred){
							thisStore.removeAll();
						}
						CP.Packages.searchTask.delay(500);
						return false;
					}
					
					if(CP.Packages.searchInvalid){	
						thisStore.removeAll();							
					}
					if(CP.Packages.searchCanceled)
					{
						CP.Packages.searchCanceled=false;						
						return true;					
					}
					if (records.length > 1){
						var index = thisStore.findExact('js_desc',"finish");
						if(index !=-1)							
							thisStore.removeAt(index);						
					}
					if (records.length == 1 && records[0].data.js_id == "match" && records[0].data.js_desc == "none"){						
						thisStore.removeAll();						
						Ext.getCmp('search-btn-cancel').enable();						
						if(!CP.Packages.searchInvalid){		
							 Ext.getCmp('inlinemsg_errors').update(
									 '<span style="color:red;font-weight:bold;margin-top:5px;margin-bottom:5px;">'+
									 CP.Packages.SEARCH_PACKAGES_NO_RES_MSG+'<br> Enter full and correct package name</span><br><br></p>');
							 Ext.getCmp('inlinemsg_errors').setVisible(true);
							 Ext.getCmp(CP.Packages.SEARCH_BY_ID_COMP).enable();
						}
												 
					}
					if(!CP.Packages.searchInvalid){							
						Ext.Ajax.request({
							url: CP.Packages.SUBMIT_URL,
							method: "POST",
							params: {"reset_search_res_db":"true"},
							success: function(response) {			
											
							},
							failure: function() { 						
													
							}
						});	
					}
		
				} 
			} 
		};	
		
		CP.Packages.searchTask = new Ext.util.DelayedTask( function(){			
			var combo = Ext.getCmp(CP.Packages.SEARCH_BY_ID_COMP);	
			if(combo != undefined)
			{
				var store = combo.getStore();
				CP.Packages.searchStarted = true;					
				store.load();
			}			
		});	
		
		var serach_comp = {
			xtype: 'cp4_combobox',
			id: CP.Packages.SEARCH_BY_ID_COMP,
			name: CP.Packages.SEARCH_BY_ID_COMP,		
			emptyText: 'Search for additional hotfixes in the cloud',
			cls: 'tb_tools',   
			triggerCls: 'toppanel-search-trigger',  
			triggerAction: 'all',			
			autoSelect:false,
			displayField: 'title',
			queryMode: 'remote',
			margin:'0 10 0 0',
			minChars: 2,
			width: 380,
			height: 20,
			typeAhead: false,
			hideLabel: true,
			enableKeyEvents:true,
			loader:{
			    loadMask:false
			},
			isDirty: function(){
				return false;
			},
			store: searchCPUSEStore,
			listConfig: {
				emptyText: 'No matching items found.',
				id: 'searchCPUSEBoundlist',
				loadingText: 'Searching...',
				padding: '0 0 0 0',
				itemSelector: 'div.search-item',
				/* for displaying the number of items that were found
					pagingToolbar:  new Ext.widget('cp4_searchfooter', {				
					pageSize: 5,
					store: searchCPUSEStore,
					border: false					
				}),*/
				minWidth: 350,
				maxHeight: 350,
				width: 350,				
				getInnerTpl:
				function(){ //custom rendering template for each item	
					if(!CP.Packages.searchInvalid){						
							return '<div class="search-item" id="comment-{id}" ' 		
							+  'style="margin-left:{[values.nestLevel === 0 ? "1" : "1"]}px; color: {["#f9f9dd"]}; border:1px #ccc solid;padding:5px;">'
							+  '<table><tbody><tr>'
							+  '<td>'
							+  '<p style="text-decoration:underline; width: 350px; overflow: hidden;" title="{js_text}"><b style="color: blue;">{js_text}</b></p>'
							+  '<p style="color: black;"><span>  </span>{js_desc}</p>'
							+  '<p style="color: black;"><span>{[CP.Packages.AF_rend (values.js_releaseDate,"","","")]}</span>  </p>'
							+  '</td>'
							+  '</tr></tbody></table>'
							+  '</div>';
						
					}		
				}  
			},
			sendReguestForHotfixSearch: function(field, e){						
				CP.Packages.searchInvalid=false;
				field.disable();				
				Ext.getCmp("search-btn-cancel").disable();
				Ext.getCmp('inlinemsg_errors').setVisible(false);
				var searchString = field.getValue();				
				if(searchString && searchString.length < 1024){
					CP.Packages.searchTask.cancel();
					CP.Packages.searchStarted = false;					
					CP.Packages.searchCanceled = true;				
					CP.Packages.searchTrigerred = true;
					CP.Packages.supressFailLockMsg();								
					Ext.Ajax.request({
					url: CP.Packages.SUBMIT_URL,
					method: "POST",
					params: {"search_start":searchString},
					success: function(response) {	
						field.getStore().removeAll();
						field.getStore().load();									
						var success = true;
						var messages = "";						
						if(response.responseText!="")
						{
							success = Ext.decode(response.responseText,true).success;
							messages = Ext.decode(response.responseText,true).messages;
						}
						if(success=="false")
						{
							field.getStore().removeAll();						
							 Ext.getCmp('inlinemsg_errors').setVisible(true);
							 if(messages!="")
							 {
								 Ext.getCmp('inlinemsg_errors').update(
									 '<span style="color:red;font-weight:bold;margin-top:5px;margin-bottom:5px;">'+
									 messages[0]+'</span><br><br></p>');
							 }
							 CP.Packages.searchCanceled = true;	
							 CP.Packages.searchInvalid=true;
							 field.clearValue();
							 field.enable();
							 Ext.getCmp("search-btn-cancel").enable();								
						}else
							CP.Packages.searchStarted = true;
						
						CP.Packages.searchCanceled = false;			
						CP.Packages.connection_fail_counter=0;
						CP.Packages.unsupressFailLockMsg();					
						CP.Packages.searchTrigerred = false;						
					},
					failure: function() { 						
						CP.Packages.connection_fail_counter++;
						CP.Packages.unsupressFailLockMsg(); 						
					}
					});										
				}else{					
					field.enable();
					Ext.getCmp("search-btn-cancel").enable();				
					 Ext.getCmp('inlinemsg_errors').setVisible(true);
					 Ext.getCmp('inlinemsg_errors').update(
							 '<span style="color:red;font-weight:bold;margin-top:5px;margin-bottom:5px;">'+
							 CP.Packages.SEARCH_TEXT_INVALID+'</span><br><br></p>');
					return false;
				}			
			},
			listeners: {
				select: function(comb, rec, num){		
						this.enable();	
						Ext.getCmp("search-btn-cancel").enable();
						this.setValue(rec[0].data.js_desc);						
						CP.Packages.PRIV_PKG_DISPLAY_NAME= rec[0].data.js_desc;
						CP.Packages.PRIV_PKG_FILE_NAME_TMP = rec[0].data.js_text;	
						CP.Packages.PRIV_PKG_ID = rec[0].data.js_id;					
						CP.Packages.handleSearchCompRowClick();
				},
				
				afterrender: function(comb, eOpts){					
					Ext.QuickTips.register({ target: comb.getEl(), text: 'Enter the exact name of the hotfix to find' });					
					if (comb.inputEl && comb.inputEl.dom && comb.inputEl.dom.spellcheck){
						comb.inputEl.dom.spellcheck = false
					}
					comb.triggerWrap.on('click', 
						function(){
							if (!comb.isExpanded){								
								comb.expand();
							}
							comb.sendReguestForHotfixSearch(comb);
						});

				},				
				blur: function(field,eOpts){								
					Ext.getCmp("search-btn-cancel").enable();					
					field.enable();
					field.clearValue( );
					CP.Packages.searchStarted = false;									
					CP.Packages.searchCanceled = true;
					CP.Packages.searchTrigerred = false;
					field.getStore().removeAll();
							
				},
				specialkey: function(field, e){	
					
					// e.HOME, e.END, e.PAGE_UP, e.PAGE_DOWN,
					// e.TAB, e.ESC, arrow keys: e.LEFT, e.RIGHT, e.UP, e.DOWN
					if (e.getKey() == e.ENTER) {
						Ext.getCmp(CP.Packages.SEARCH_BY_ID_COMP).sendReguestForHotfixSearch(field, e);
					}
				},keyup:function(field, e){		
					
					 if (field.getValue() && field.getValue().length > 0) {
						 if (field.getValue().length > 1023)
							 {
							 	CP.Packages.searchInvalid=true;
							 	CP.Packages.searchCanceled = true;	
							 	Ext.getCmp('inlinemsg_errors').setVisible(true);
							 	Ext.getCmp('inlinemsg_errors').update(
									 '<span style="color:red;font-weight:bold;margin-top:5px;margin-bottom:5px;">'+
									 CP.Packages.SEARCH_TEXT_INVALID+'</span><br><br></p>');
							 }else
								 {
								 	CP.Packages.searchInvalid=false;
								 	Ext.getCmp('inlinemsg_errors').setVisible(false);	
								 }
						 							       
												       
					    }					 
				}
			},				
			//overriding onListSelectionChange function just to remove the behavior that the field is getting focus after selection
			onListSelectionChange: function(list, selectedRecords) {
				
				if (selectedRecords.length <= 0)
					return;
				
				if (!this.multiSelect) {
					Ext.defer(this.collapse, 1, this);
					}
					
				this.fireEvent('select', this, selectedRecords);
			}
		};
				
		return serach_comp;
	}

	,getSearchForm: function(){	
		var lockAlignment = (Ext.firefoxVersion) ? "top" : "center";  // (Ext.firefoxVersion==0) if not FF
		var items = [
			{
			    xtype: 'cp4_panel',
			    id:'inlinemsg_instructions',
			    width: 450,
			    autoScroll:true,
			    hidden:false,
			    margin: '5 0 10 0',
			    html:"Enter package identifier to add to your view"
			},
			CP.Packages.getSearchComp()
			,{
			    xtype: 'cp4_panel',
			    id:'inlinemsg_errors',
			    width: 450,
			    autoScroll:true,
			    hidden:true,
			    margin: '10 0 10 0'
			},
		    {
				xtype: 'cp4_container',
				id : 'search_loading',
				margin:'10 5 10 0',
				html: '<span style="color:blue;font-weight:bold;">Adding package '+ CP.Packages.PRIV_PKG_FILE_NAME_TMP + '</span> <img src="../images/icons/progress_animation.gif" width="20" height="20" align='+lockAlignment +' />',
				hidden : true
			}

		];
		var form = Ext.create( 'CP.WebUI4.Panel',{
			id: 'inner_search_form',
			height:200,
			border: false,
			items: items
		});		
		return form;
	}
	
	,resolveFilterStatus:function (filterStatus)
	{
		var button_text="";
		switch(filterStatus) 
		{
			case CP.Packages.FILTER_RECOMMENDED: button_text = "Recommended" ; break;
			case CP.Packages.FILTER_INSTALLED: button_text = "Installed" ; break;
			case CP.Packages.FILTER_ALL: button_text = "All" ; break;
			default: button_text = "Recommended" ;
		}
		return button_text;
	}
	
	,packagesStoreFilter: function(record, id) {
		
		// Don't filter dummies so empty groups will still have header
		if (record.get("package_name").indexOf("DUMMY") > -1)
			return true;
		
		var pkg_type=record.get("pkg_type_modified");
		if (pkg_type == CP.Packages.TYPE_REVERT)
			return false;
		
		if (pkg_type == CP.Packages.TYPE_SELF_UPDATE)
			return false;

		if (CP.Packages.DISPLAY_MAJORS == false && pkg_type == CP.Packages.TYPE_MAJOR)
			return false;

		if ((CP.Packages.legacy_display_status === false) && 
			((record.get("legacy_hotfix") == "1") || (record.get("legacy_hotfix") == "2")))
			return false;
			
		var status = record.get("status");
		var installed = ((status == CP.Packages.INSTALLED) || (status == CP.Packages.INSTALL_CONTAINED)
						|| (status == CP.Packages.UNINSTALL_FAILED));
		
		switch(CP.global.filterStatus) {
			case CP.Packages.FILTER_INSTALLED: {
				if (!installed)
					return false;
				break;
			}
			case CP.Packages.FILTER_AVAILABLE: {
				if (installed)
					return false;
				break;
			}
			case CP.Packages.FILTER_RECOMMENDED: {
				var tags = record.get("package_tags");
				if (CP.Packages.resolvePackageTags(tags) != CP.Packages.LATEST_TAG_TEXT)
					return false;
				break;
			}
		}
		return true;
	}
	
	,filterStore: function() {
		CP.Packages.store.clearFilter();
		CP.Packages.store.filterBy(CP.Packages.packagesStoreFilter);

		// Hide dummies
		var table = Ext.getCmp(CP.Packages.GRID_ID);
		CP.Packages.hidePackages(table,-1);
		
		if (Ext.getCmp(CP.Packages.PACKAGES_CONTAINER)) { //fix component resize problem - the grip size doesn't  match the centre container size
			Ext.getCmp(CP.Packages.PACKAGES_CONTAINER).doLayout();
		}
		
		// remove the [+] sign from empty groups' header
		var groups = CP.Packages.store.getGroups();
		var gLen = groups.length;
		for (var i = 0; i < gLen; i++)
		{
			var header_element = Ext.select('div.x-grid-group-title').elements[i];
			if (header_element && (groups[i].children.length == 1)) //the package category contains only 1 (DUMMY) package (created by DEFUALT) 
				header_element.style["backgroundImage"] = "none";
		}
		
		// ensure some row is selected - and its not a hidden dummy row
		if ((table.getSelectionModel().getSelection().length === 0) && (CP.Packages.selectedGroup === false) && table.getStore().count() > 1) {
			if (table.getStore().getAt(0).data.package_name.indexOf("DUMMY") == -1)
				table.getSelectionModel().select(0);
			else
				table.getSelectionModel().select(1);
		}
	}
	
	//when filter item selected - update the global value with the filter value
	,onFilterClick: function(item) {
		if (item){
			switch(item.value) 
			{
				case CP.Packages.FILTER_RECOMMENDED: CP.global.filterStatus=CP.Packages.FILTER_RECOMMENDED; break;
				case CP.Packages.FILTER_INSTALLED: CP.global.filterStatus=CP.Packages.FILTER_INSTALLED; break;
				case CP.Packages.FILTER_ALL: CP.global.filterStatus=CP.Packages.FILTER_ALL; break;
				default: { CP.global.filterStatus=CP.Packages.FILTER_RECOMMENDED; } break;
			}
			Ext.getCmp(CP.Packages.FILTER_BTN).setText("Showing "+CP.Packages.resolveFilterStatus(CP.global.filterStatus) + " packages");
		}
		
		CP.Packages.filterStore();
	}
	
	// handler for help button presses
	,helpButtonPressed: function(button, event, selected) {
		window.open('https://supportcenter.checkpoint.com/supportcenter/portal?eventSubmit_doGoviewsolutiondetails=&solutionid=sk92449');
	}

	// handler for button presses
	,buttonPressed: function(button, event, selected) {
		if (Ext.getCmp(button.id).disabled) {
			return;
		} 
		
		var selectedRow;
		if (button.id != CP.Packages.APPLY_BTN && button.id != CP.Packages.PRIVATE_PKG_BTN && button.id != CP.Packages.CHECK_FOR_UPDATE_BTN) {
			if (selected) {
				selectedRow = selected;
			} else {
				selectedRow = CP.Packages.getSelectedPackage();
				if (!selectedRow) {
					return;
				}
			}
		}
		
		//throw if cancel of DA pop-up
		if (CP.Packages.self_update!='' && CP.Packages.ignore_critical==false && CP.Packages.critical_installation_window_open == false) {
			CP.Packages.NewAgentWindow();
			return;
		}
		
		var myparams = {};
		var message = "";
	
		if (button.id == CP.Packages.EXPORT_BTN) {
			selectedRow.set("local_status_text","Preparing for Export <img src='../images/icons/indicator.gif' height=12px width=12px>");
			selectedRow.set("saved_status",selectedRow.data.status); // saving the current status
			//selectedRow.set("dont_display_progress",1); //set the display property to false
			CP.Packages.updatePackageDescription();
			myparams["export_pkg"] = selectedRow.data.package_name;
			myparams["exported_session_id"] = CP.Packages.session_id;
			CP.Packages.supressFailLockMsg();
			CP.Packages.supressUnableToConnectMsg();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("export res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					setTimeout("CP.Packages.unsupressFailLockMsg()",3000);
					setTimeout("CP.Packages.unsupressUnableToConnectMsg()",3000);
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
					CP.Packages.unsupressUnableToConnectMsg();
				}
			});
		}
		
		// configuring the action to do by the pressed button's id
		if ((button.id == CP.Packages.DOWNLOAD_BTN)||(button.id == CP.Packages.MORE_DOWNLOAD_BTN) || (button.id == CP.Packages.RESUME_BTN)) {
			if ((button.id == CP.Packages.DOWNLOAD_BTN) || (button.id == CP.Packages.MORE_DOWNLOAD_BTN))
				selectedRow.set("local_status_text","Initiating Download");
			else
				selectedRow.set("local_status_text","Resuming Download");
			selectedRow.set("saved_status",selectedRow.data.status);
			selectedRow.set("dont_display_progress",1); // set the display property to false

			CP.Packages.updatePackageDescription();
			
			myparams["download"] = selectedRow.data.package_name;
			
			// performing the required action
			CP.Packages.supressFailLockMsg();
			
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("download res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					CP.Packages.unsupressFailLockMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
				}
			});
		}

		// Pressing the Pause button:
		if (button.id == CP.Packages.PAUSE_BTN) {
			selectedRow.set("local_status_text","Pausing Download");
			selectedRow.set("saved_status",selectedRow.data.status);
			selectedRow.set("dont_display_progress",1); // set the display property to false
			CP.Packages.updatePackageDescription();
			
			// Notifying paused download:
			myparams["pause"] = selectedRow.data.package_name;
			// performing the required action
			CP.Packages.supressFailLockMsg();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("pause res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					CP.Packages.unsupressFailLockMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
				}
			});
		}

		if ((button.id == CP.Packages.INSTALL_BTN) || (button.id == CP.Packages.REINST_BTN) || (button.id == CP.Packages.UPGRADE_BTN) || (button.id == CP.Packages.REVERT_BTN)) {
			var myparams={};

			var btn_id=button.id;
			var status_text="Initiating Install";
			var title_text ="";
			if ((selectedRow.data.pkg_type_modified==CP.Packages.TYPE_MAJOR) || (selectedRow.data.pkg_type_modified==CP.Packages.TYPE_FULL_MINOR) || (selectedRow.data.pkg_type_modified==CP.Packages.TYPE_REVERT)) {
				var table = Ext.getCmp(CP.Packages.GRID_ID);
				if (!table)
					return;
				table.setLoading(true);
				//retrive free unpartitioned disk space and the new partition disk size
				Ext.Ajax.request({
					url: CP.Packages.SUBMIT_URL,
					method: "GET",
					params: {
						get_upgrade_details: 1
					},
					success: function(jsonResult) {
						var jsonData = Ext.decode(jsonResult.responseText);
						if (jsonData) {
							if ((jsonData.free_unpartitioned_disk_space != "") && (jsonData.new_partition_disk_size != "")) {
								CP.Packages.currnet_free_space = parseFloat(jsonData.free_unpartitioned_disk_space);
								CP.Packages.new_partition_disk_size = jsonData.new_partition_disk_size;
							}
							if ( CP.Packages.currnet_free_space < CP.Packages.new_partition_disk_size ) {
								// there is not enough unpartitioned disk space
								Ext.Ajax.request({
									// get information about the current snapshots that are saved on the machine and their sizes
									url: '/cgi-bin/img_mgmt.tcl'
									,method: "GET"
									,params: { data: "manual" }
									,success: function(jsonResult) {
										CP.Packages.snapshotJsonData= Ext.decode(jsonResult.responseText);
										CP.Packages.sum_all_imges_size=0.0;
										for (i=0; i<CP.Packages.snapshotJsonData.data.manual.length; i++) {
											CP.Packages.sum_all_imges_size+=parseFloat(CP.Packages.snapshotJsonData.data.manual[i].img_size);
										}
										table.setLoading(false);
										if ( (CP.Packages.currnet_free_space + CP.Packages.sum_all_imges_size) > CP.Packages.new_partition_disk_size) {
											// We can free enough space by deleting existing snapshots - so we open a window to handle that
											CP.Packages.CreateFreeDiskWindow(btn_id,selectedRow);
										} else {
											// We cannot free enough space to install the version, even by deleting old snapshots - so we show that to the user
											CP.Packages.showUpgradeInsufficientDiskSpaceMsg();
										}
									}
									,failure: function() {
										table.setLoading(false);
									}
								});
							} else {
								// no disk space problem
								table.setLoading(false);
								CP.Packages.showUpgradeRebootWarningMsg(btn_id,selectedRow); // After this message the upgrade/install will start
							}
						} else {
							table.setLoading(false);
						}
					},failure: function() {
						//console.log("failure: in Ext.Ajax.request :installer.tcl");
						table.setLoading(false);
					}
				});
			
				return;
			}
			else 
			{
				if ((selectedRow.data.pkg_type_modified==CP.Packages.TYPE_HOTFIX) && (selectedRow.data.status == CP.Packages.AVAILABLE_DOWNLOAD)) // the package is HF, now need to check if the package is downloaded or not
				{
					status_text="Initiating Download";
					myparams["download"] = selectedRow.data.package_name;
					myparams["download_and_install"] = selectedRow.data.package_name;			
				}
				else
				{
					myparams["install"] = selectedRow.data.package_name;
				}
				
				var snapshot_message = 'Installation cannot be undone.<br>It is recommended to save a Gaia Snapshot before you continue.';
				if (selectedRow.data.requires_reboot == "1") //prompt restart pop-up before installation
				{
					var major_message = 'Click OK to start the package installation.';
					action_txt = "upgrade";
					CP.WebUI4.Msg.show ({
						closable: false,
						title: "Package Install",
						msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+major_message+'<br/><br/><input type="checkbox" style="vertical-align:center" id="do_not_suppress_reboot_chkbox" checked="checked" onclick="CP.Packages.showSuppressRebootMsg(this, action_txt)" />The machine will automatically reboot after installation</br></br></span>',
						buttons: Ext.Msg.OKCANCEL,
						icon: Ext.Msg.WARNING,
						fn: function(button) { 
							if (button == "ok") { 
								//suppress reboot only if check box gets unchecked 
								if ( ! document.getElementById('do_not_suppress_reboot_chkbox').checked )
								{
									myparams["suppress_reboot"] = 1;
								}
								
								//check if the block_uninstall flag exist, notify the user - about taking a snapshot before proceeding with the installation
								if (selectedRow.data.block_uninstall)
								{
									var messageBox = Ext.create('CP.WebUI4.MessageBox', {
										buttonText: {
											ok: 'Continue',
											cancel: 'Cancel'
										}
									});
									messageBox.show({
										closable: false,
										title: "Warning",
										msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+snapshot_message+'</span>',
										buttons: Ext.Msg.OKCANCEL,
										icon: Ext.Msg.WARNING,
										fn: function(button) { 
											if (button == "ok") { 
												CP.Packages.do_install(selectedRow, myparams, status_text);
											} else {
												return;
											}
										}
									});
								}
								else
								{
									CP.Packages.do_install(selectedRow, myparams, status_text);
								}
							}
						}
					});
				}
				else
				{
					//check if the block_uninstall flag exist, notify the user - about taking a snapshot before proceeding with the installation			
					if (selectedRow.data.block_uninstall)
					{
						var messageBox = Ext.create('CP.WebUI4.MessageBox', {
							buttonText: {
								ok: 'Continue',
								cancel: 'Cancel'
							}
						});
						messageBox.show({
							closable: false,
							title: "Warning",
							msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+snapshot_message+'</span>',
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.WARNING,
							fn: function(button) { 
								if (button == "ok") { 
									CP.Packages.do_install(selectedRow, myparams, status_text);
								} else {
									return;
								}
							}
						});
					}
					else
					{
						CP.Packages.do_install(selectedRow, myparams, status_text);
					}
				}
			}
		}
		if (button.id == CP.Packages.UNINSTALL_BTN) {
			if (selectedRow.data.block_uninstall)
			{
				var snapshot_message_before_uninstall = "Uninstall is not allowed for this package. Use Snapshot Management to revert.";
				CP.WebUI4.Msg.show ({
					closable: false,
					title: "Warning",
					msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+snapshot_message_before_uninstall+'</span>',
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.WARNING
				});
				return;
			}
			Ext.getCmp(CP.Packages.INSTALL_BTN).disable();
			Ext.getCmp(CP.Packages.REINST_BTN).disable();
			Ext.getCmp(CP.Packages.UPGRADE_BTN).disable();
			Ext.getCmp(CP.Packages.REVERT_BTN).disable();
			Ext.getCmp(CP.Packages.UNINSTALL_BTN).disable();
			CP.Packages.packageRunning = true;
			
			var notify_uninstalled="";
			var requires_reboot_checkbox="";
			myparams["uninstall"] = selectedRow.data.package_name;
			if (selectedRow.data.bundle_contains_os=="1") { // this is a bundle that contains an os package - notify the user that the os will not be uninstalled (CR01423072)
				notify_uninstalled="Important!<br>Uninstall of this version will uninstall all changes, except for changes to the GAIA operating system itself.<br>For further information, see sk101274.";
			}
			if (CP.Packages.isUninstallableLegacy(selectedRow.data)) { 
				notify_uninstalled +="Important!<br>After you uninstall this package, it is not shown in the list of available packages.<br>";
			}
			if ((selectedRow.data.requires_reboot == "1") || CP.Packages.isUninstallableLegacy(selectedRow.data)) {
				action_txt = "uninstall";
				requires_reboot_checkbox = '<br/><br/><input type="checkbox" style="vertical-align:center" id="do_not_suppress_reboot_chkbox" checked="checked" onclick="CP.Packages.showSuppressRebootMsg(this, action_txt)" />The machine will automatically reboot after uninstallation</br></br>';
			}
			if ((notify_uninstalled!="") || (selectedRow.data.requires_reboot == "1") || CP.Packages.isUninstallableLegacy(selectedRow.data)){ 
				notify_uninstalled+= "<br>Click OK to start the package uninstallation.<br>";
				CP.WebUI4.Msg.show ({
					closable: false,
					title: "Uninstall",
					msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+notify_uninstalled+requires_reboot_checkbox+'</span>',
					buttons: Ext.Msg.OKCANCEL,
					icon: Ext.Msg.WARNING,
					fn: function(button) { 
						if (button == "ok") {
							//suppress reboot only if check box gets unchecked 
							if ((requires_reboot_checkbox!="") && ( ! document.getElementById('do_not_suppress_reboot_chkbox').checked ))
							{
								myparams["suppress_reboot"] = 1;
							} 
							CP.Packages.uninstall(selectedRow, myparams);
						} else {
							CP.Packages.packageRunning = false;
						}
					}
				});
			} else { //not a bundle that contains an os package - continue with the uninstallation
				CP.Packages.uninstall(selectedRow, myparams);
			}
		}
		
		if (button.id == CP.Packages.LINK_TO_IMAGE_MANAGEMENT) {
			CP.util.gotoPage("tree/img_mgmt");
		}
				
		if (button.id == CP.Packages.DELETE_BTN) {
			var pkg_disp=selectedRow.data.package_name;
			if (selectedRow.data.display_name != "")
				pkg_disp = selectedRow.data.display_name;

			CP.WebUI4.Msg.show({
				title: 'Delete Package',
				msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">Package '+pkg_disp+' will be deleted from the repository</span>',
				buttons: Ext.Msg.OKCANCEL,
				icon: Ext.Msg.QUESTION,
				id: 'delete_popup',
				fn: function(button) {
					if (button == "ok") {
						CP.Packages.delPkg(selectedRow.data.package_name);
					}
				}
			});
		}
		if (button.id == CP.Packages.REMOVE_FROM_VIEW_BTN) {
			CP.Packages.delPkg(selectedRow.data.package_name);
		}

		if (button.id == CP.Packages.APPLY_BTN) {
			var urlf=Ext.getCmp(CP.Packages.PRIV_URL);
			var form=Ext.getCmp('priv_url_form');
			if( !form.getForm().isValid() ){
				return;
			}
			if (!urlf || (urlf.getValue() == ""))
				return;
			var url=urlf.getValue();
			var pkg_name=CP.Packages.extractPackageFromURL(url);
			if (!pkg_name) {
				Ext.getCmp(CP.Packages.PRIV_URL).reset();
				return;
			}
			var win=Ext.getCmp('add_prv_window');
			if (win)
				win.destroy();
			
			myparams["private_url"] = pkg_name;
			
			// performing the required action
			CP.Packages.supressFailLockMsg();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("add_prv_pkg res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					CP.Packages.unsupressFailLockMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
				}
			});
		}
		
		if (button.id == CP.Packages.CHK_BTN) {
			var myparams;
			myparams["check_install_req"]=selectedRow.data.package_name;
			
			selectedRow.set("local_status_text","Initiating Verifier");
			selectedRow.set("saved_status",selectedRow.data.status);
			//selectedRow.set("dont_display_progress",1); //set the display property to false
			CP.Packages.updatePackageDescription();
			
			Ext.getCmp(CP.Packages.CHK_BTN).hide();
			CP.Packages.supressFailLockMsg();
			Ext.Ajax.request({
				url: CP.Packages.SUBMIT_URL,
				method: "POST",
				params: myparams,
				success: function(response) {
					//console.log("check install res: "+response.responseText);
					CP.Packages.connection_fail_counter=0;
					CP.Packages.unsupressFailLockMsg();
				},
				failure: function() { 
					CP.Packages.connection_fail_counter++;
					CP.Packages.unsupressFailLockMsg(); 
				}
			});
		}
		
		if(button.id == CP.Packages.CHECK_FOR_UPDATE_BTN ) {			
			CP.Packages.initiate_da_update_check();
		}
		
		if (button.id == CP.Packages.PRIVATE_PKG_BTN ) {
			CP.Packages.showAddPrivWindow();
		}
		
		if (button.id == CP.Packages.I_LOG_BTN ) {
			CP.Packages.showLog(CP.Packages.I_LOG_BTN); 
		}
		
		if (button.id == CP.Packages.U_LOG_BTN ) {
			CP.Packages.showLog(CP.Packages.U_LOG_BTN); 
		}
		
		if (button.id == CP.Packages.IF_LOG_BTN ) {
			CP.Packages.showLog(CP.Packages.IF_LOG_BTN); 
		}
	}
	
	,showSuppressRebootMsg: function(cb, action_txt) {	
		if ( ! cb.checked) {
			//Display warning message when check box gets unchecked - need to use an Ext.message and not Gaia message, Because Gaia msgbox implements a singleton and will remove any other Gaia msgbox
			Ext.MessageBox.show ({
				closable: false,
				cls: 'webui4-messagebox',
				msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">This is not a recommended option.<br>Your machine will be in an unstable state until reboot.<br>If you choose this option, make sure to manually reboot after the ' + action_txt + '. </span>',
				width: 600,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});	
		}
	}
 
	,showAddPrivWindow: function() {
		var privateURLfield = Ext.create('CP.WebUI4.TextField',{
			id: CP.Packages.PRIV_URL,
			allowBlank: false,
			regex: /.*\/.*\?.*/,
			regexText: 'The entered URL is invalid',
			width: 500,
			emptyText: "Enter URL",
			vtype: 'url'
		});

		var form = Ext.create('CP.WebUI4.FormPanel',{
			bodyPadding: 10,
			id: 'priv_url_form',
			items: [ privateURLfield ],
			buttons: [
				{
					id: CP.Packages.APPLY_BTN,
					text: "Add",
					handler: CP.Packages.buttonPressed
				},
				{
					id: 'cancel_btn',
					text: "Cancel",
					handler: function() {
						var win=Ext.getCmp('add_prv_window');
						if (win)
							win.destroy();
					}
				}
			]
		});
			
		var modalWin = Ext.create('CP.WebUI4.ModalWin',{
			id: 'add_prv_window',
			name: 'add_prv_window',
			width: 600,
			height: 120,
			title: 'Add Private Package', 
			items: [ form ]
		});
		
		if (!modalWin)
			return;
		modalWin.show();
	}
	
	,extractPackageFromURL: function(url) {
		var last_slash=url.lastIndexOf("/")+1;
		if (last_slash != -1) {
			var next_q=url.substr(last_slash).indexOf('\?');
			if (next_q != -1) {
				return url.substr(last_slash,next_q);
			}
		}
		return false;
	}
	
	//data is a key-value pair, the keys and values must match the keys and values in the DA itself!
	,resolvePackageTags :function(data) {
		var result ="";
		if (!data) {
			return "";
		}
		if (data[CP.Packages.EA_TAG] == "true") {
			result= CP.Packages.EA_TAG_TEXT;
		}
		else if (data[CP.Packages.BETA_TAG] == "true") {
			result= CP.Packages.BETA_TAG_TEXT;
		} else {
			switch(data[CP.Packages.IMPORTANCE_TAG]) {
				case CP.Packages.LATEST_TAG: result=CP.Packages.LATEST_TAG_TEXT; break;
				case CP.Packages.CUMULATIVE_TAG: result=CP.Packages.CUMULATIVE_TAG_TEXT; break;
				case CP.Packages.CRITICAL_TAG: result=CP.Packages.CRITICAL_TAG_TEXT; break;
				case CP.Packages.HIGH_TAG: result=CP.Packages.HIGH_TAG_TEXT; break;
				case CP.Packages.PRIVATE_TAG: result=CP.Packages.PRIVATE_TAG_TEXT; break;
			}
		}
		return result;
	}
	
	,resolvePackageTagsImage :function(data) {
		var result ="";
		if (!data) {
			return "";
		}
		
		switch(data) {
				case CP.Packages.LATEST_TAG_TEXT: result='<img style="vertical-align:middle" src='+CP.Packages.LATEST_ICON_PATH+'>'; break;
				case CP.Packages.CUMULATIVE_TAG_TEXT_GREY: result='<img style="vertical-align:middle;opacity:0.5;filter:alpha(opacity=50)"  src='+CP.Packages.PACKAGE_ICON_PATH+'>'; break;
				case CP.Packages.CUMULATIVE_TAG_TEXT: result='<img style="vertical-align:middle"  src='+CP.Packages.PACKAGE_ICON_PATH+'>'; break;
		}
		
		return result;
	}
	
	/*
	,pkgTagsRenderer: function(data, metadata, record, row) {
		var result = CP.Packages.resolvePackageTags(data);
		if (result != "") {
			var table=Ext.getCmp(CP.Packages.GRID_ID);
			if (table && table.getView() && table.getView().getHeaderCt()) {
				var pkg_category=table.getView().getHeaderCt().child('#package_category');
				if (pkg_category) {
					pkg_category.show();
				}	
			}
			return CP.Packages.filterInstallCritical(result, metadata, record, row);
		}
		return "";
	}
	*/

	,createSpaceString: function(num_of_spaces) {
		var result = "";
		for (var i=0; i<num_of_spaces; i++)
			result+="&nbsp;"
			
		return result;
	}

	//the function returns true if the package has a parent in the same group
	,checkIfParentVisible: function (record_data) {
		var table=Ext.getCmp(CP.Packages.GRID_ID);
		
		if(!table)
			return false;
			
		for(var i = 0; i < table.getStore().getCount(); i++) {
			var pkg = table.getStore().getAt(i).data;
			if (record_data.package_parent.indexOf(pkg.package_name) != -1 && record_data.pkg_type_modified == pkg.pkg_type_modified)
				return true;
		}
		return false;
	}

	,packageNameRenderer: function (text, metadata, record, rowIndex) {
		var pkg_name=text;
		if (text=="") { //legacy/imported package - no display name only file name
			pkg_name=record.data.package_name;
		}
		
		var resolved_pkg_tag = CP.Packages.resolvePackageTags(record.data.package_tags);
		var resolved_pkg_icon = "";
		if (resolved_pkg_tag == CP.Packages.LATEST_TAG_TEXT) //if the package is recommended add it with star icon
		{
			if((record.data.pending_reboot &&  record.data.pending_reboot!="") || (CP.Packages.isDownloadedForDiffVersion(record.data)))
			{
				resolved_pkg_icon =	CP.Packages.LATEST_TAG_GREY_ICON;
			}
			else
			{
				resolved_pkg_icon =	CP.Packages.LATEST_TAG_ICON;
			}	
			return CP.Packages.filterInstallCritical(resolved_pkg_icon + CP.Packages.createSpaceString(2) + pkg_name, metadata, record, rowIndex);
		}
		else if (record.data.package_parent == "") // the package has no parents
		{
			if (CP.Packages.isPartOfMajorLegacy(record.data) || (CP.Packages.isDownloadedForDiffVersion(record.data)) ||
				(record.data.pending_reboot &&  record.data.pending_reboot!=""))  //the package is legacy - add grey icon
				resolved_pkg_icon = CP.Packages.CUMULATIVE_TAG_GREY_ICON;
			else
				resolved_pkg_icon = CP.Packages.CUMULATIVE_TAG_ICON; //the package is CPUSE package add regular icon
			return CP.Packages.filterInstallCritical(resolved_pkg_icon + CP.Packages.createSpaceString(2) + pkg_name, metadata, record, rowIndex);
		}
		else if (record.data.package_parent != "") //the package has parents 
		{
			if (record.data.status == CP.Packages.INSTALL_CONTAINED || CP.Packages.isPartOfMajorLegacy(record.data) || (record.data.pending_reboot &&  record.data.pending_reboot!="") || (CP.Packages.isDownloadedForDiffVersion(record.data))) // the package is contained in or legacy - add grey icon
				resolved_pkg_icon = CP.Packages.CUMULATIVE_TAG_GREY_ICON;
			else
				resolved_pkg_icon = CP.Packages.CUMULATIVE_TAG_ICON; //the package is not installed or INSTALL_CONTAINED - add regular icon 
				
			if (CP.Packages.checkIfParentVisible(record.data)) // if the package has parents and they are visible add indentation  
			{
				return CP.Packages.filterInstallCritical(CP.Packages.createSpaceString(7) + resolved_pkg_icon + CP.Packages.createSpaceString(2) + pkg_name, metadata, record, rowIndex);
			}
			else
				return CP.Packages.filterInstallCritical(resolved_pkg_icon + CP.Packages.createSpaceString(2) + pkg_name, metadata, record, rowIndex);
		}
	}
	
	,filterInstallCritical: function(text, metadata, record, row) {
		var new_text=text;
		var pkg_name=text;
		if (text=="") {
			pkg_name=record.data.package_name;
		}
		new_text=pkg_name;
		if (CP.Packages.isPartOfMajorLegacy(record.data) ||(record.data.status==CP.Packages.INSTALL_CONTAINED) || (record.data.pending_reboot &&  record.data.pending_reboot!="") || (CP.Packages.isDownloadedForDiffVersion(record.data))) {
			new_text="<span style='color:"+CP.Packages.GREY_COLOR+"'>"+pkg_name+"</span>";
		}
		return new_text;
	}

	,filterInstallDownload: function(text, metadata, record, row) {
		if (text!="")
		{
			text=CP.Packages.IDO_rend(text);
		}
		return CP.Packages.filterInstallCritical(text, metadata, record, row);
	}
	
	,getPkgTypeStr: function(value) {
		var type="Unknown";
		switch(value) {
			case CP.Packages.TYPE_HOTFIX: type='Hotfix'; break;
			case CP.Packages.TYPE_OS: type='OS'; break;
			case CP.Packages.TYPE_SELF_UPDATE: type='Self Update'; break;
			case CP.Packages.TYPE_BUNDLE: type='Wrapper'; break;
			case CP.Packages.TYPE_MAJOR: type='Major Version'; break;
			case CP.Packages.TYPE_FULL_MINOR: type='Minor Version'; break;
			case CP.Packages.TYPE_REVERT: type='Revert'; break;
			case CP.Packages.TYPE_RELEASE: type='Release'; break;
			case CP.Packages.TYPE_LEGACY: type='Legacy Hotfix'; break;
			case CP.Packages.TYPE_LEGACY_MINI_WRAPPER: type='Legacy Mini Wrapper'; break;
		}
		return type;
	}
	
	,pkgTypeRenderer: function(value, metadata, record, rowIndex) {
	
		var pkg_tag = record.data.package_tags;
		var resolved_pkg_tag = CP.Packages.resolvePackageTags(pkg_tag);
		if (resolved_pkg_tag == "")
			return ""
			
		if (value == "")
			return "";
		metadata.tdAttr = 'data-qtip="This package is ' +resolved_pkg_tag + '"';
		return (CP.Packages.resolvePackageTagsImage(resolved_pkg_tag));	
		
	}
	
	,pkgParentRenderer: function(value, metadata, record, rowIndex) {
		var resolved_pkg_tag = CP.Packages.resolvePackageTags(record.data.package_tags);
		if (resolved_pkg_tag == CP.Packages.LATEST_TAG_TEXT)
		{
			metadata.tdAttr = 'data-qtip="This package is ' +CP.Packages.LATEST_TAG_TEXT + '"';
			return CP.Packages.resolvePackageTagsImage(CP.Packages.LATEST_TAG_TEXT)
		}
		if (value != "")
		{ //child
			metadata.tdAttr = 'data-qtip="This package is ' +CP.Packages.CUMULATIVE_TAG_TEXT + '"';
			return (CP.Packages.resolvePackageTagsImage(CP.Packages.CUMULATIVE_TAG_TEXT));	
		}
		return;
	}
	
	,fileSizeRenderer: function(text, metadata, record, row, col, store, view) {
		var size ="";
		if (text != "")
		{
			size=Ext.util.Format.fileSize(text, metadata, record, row, col, store, view);
			if (record.data.status==CP.Packages.INSTALL_CONTAINED)
			{
				size ="<span style='color:"+CP.Packages.GREY_COLOR+"'>" + size +"</span>";
			}
		}
		else
		{
			if ((record.data.legacy_hotfix=="1") || (record.data.legacy_hotfix=="2")) 
			{
				size ="<span style='color:"+CP.Packages.GREY_COLOR+"'>N/A</span>";
			} else {
				size = "N/A";
			}
		}
		return size;
	}

	,AF_rend: function(available_from_str, metadata, record, rowIndex) {
		// the expected format of the string is: "yyyy-mm-dd hh:mm:ss"
		var date;
		var date_str;
		var date_split;
		var time='';
		var time_str;
		var time_ending='';
		if (available_from_str=="")
			return "";
		var new_str=available_from_str.replace("  "," ");
		date_split = new_str.split(" ");
		date = date_split[0].split("-"); //  1 - month   2 - day  0 - year
		time = date_split[1].split(":");
		date_str=CP.util.dateToStr(date[2],date[1],date[0]);
		time_str=CP.util.timeToStr(time[0],time[1],time[2]);
		if (record.data && ((record.data.status==CP.Packages.INSTALL_CONTAINED) || (record.data.pending_reboot &&   record.data.pending_reboot!="") || (CP.Packages.isDownloadedForDiffVersion(record.data))))
		{
			date_str ="<span style='color:"+CP.Packages.GREY_COLOR+"'>" + date_str +"</span>";
		}
		
		return date_str;//+" "+time_str;
	}

	,IDO_rend: function(available_from_str) {
		// the expected format of the string is: "ddd mmm dd hh:mm:ss yyyy"
		var date;
		var date_str;
		var date_split;
		var time='';
		var time_str;
		var time_ending='';
		var month_names = ['Jan', 'Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var year,day,month_name,month_num;
		if (available_from_str=="")
			return "";
		var new_str=available_from_str.replace("  "," ");
		date_split = new_str.split(" "); // 0 day-text 1 mmm 2 day 3 hour 4 yyyy
		month_name=date_split[1];
		year=date_split[4];
		day = date_split[2];
		time = date_split[3];
		time=time.split(":");
		for (month_num=0; month_names[month_num]!=month_name; month_num++);
		month_num++;
		date_str=CP.util.dateToStr(day,month_num,year);
		time_str=CP.util.timeToStr(time[0],time[1],time[2]);
		return date_str+" "+time_str;
	}

	,handleOK: function(buttonId){
		var win = Ext.getCmp("import-modal-window");
		if (win != undefined)
			win.close();
	}
	
	,handleSearchComp: function(){	
		Ext.getCmp('inlinemsg_errors').setVisible(false);
		var comb = Ext.getCmp(CP.Packages.SEARCH_BY_ID_COMP);
		if (!comb.isExpanded){
			comb.expand();
		}
		comb.sendReguestForHotfixSearch(comb);
	}
	
	,handleSearchCompRowClick: function(){		
		Ext.getCmp(CP.Packages.SEARCH_BY_ID_COMP).getStore().removeAll();
		
		
		var lockAlignment = (Ext.firefoxVersion) ? "top" : "center";  // (Ext.firefoxVersion==0) if not FF
		Ext.getCmp('inlinemsg_errors').setVisible(false);
		if(CP.Packages.PRIV_PKG_DISPLAY_NAME!="")
		{
			Ext.getCmp('search_loading').update(
					'<img src="../images/icons/progress_animation.gif" margin-right="30" width="20" height="20" align='+lockAlignment +' />'+
					'<span style="color:blue;">&nbsp;&nbsp;Adding package \"'+ CP.Packages.PRIV_PKG_DISPLAY_NAME + '\" to your view...'+ 
					'</span>');
			Ext.getCmp("search-btn-cancel").disable();
		}else{			
			Ext.getCmp('search_loading').update(
					'<img src="../images/icons/progress_animation.gif" width="20" height="20" align='+lockAlignment +' />'+
					'<span style="color:blue;">&nbsp;&nbsp;Adding package '+ CP.Packages.PRIV_PKG_FILE_NAME_TMP + ' to your view...'+ 
				'</span>');
			Ext.getCmp("search-btn-cancel").disable();
		}
		
		Ext.getCmp('search_loading').show();
		Ext.Ajax.request({
			url: CP.Packages.SUBMIT_URL,
			method: "POST",
			params: {"private_url":CP.Packages.PRIV_PKG_ID},
			success: function(response) {
				CP.Packages.PRIV_PKG_FILE_NAME = CP.Packages.PRIV_PKG_FILE_NAME_TMP;
				CP.Packages.connection_fail_counter=0;
				CP.Packages.unsupressFailLockMsg();
			},
			failure: function() { 
				
				CP.Packages.connection_fail_counter++;
				CP.Packages.unsupressFailLockMsg(); 
				Ext.getCmp('search-modal-window').close();			
			}
		});
		
	}
	
	,getImportForm: function() {
		var items = [{
			xtype: "cp4_displayfield"
			,value: "Import a package from archive"
			,hideLabel:true
		}
		//,spacer
			// Enable When upload component will be upgraded to EXT4
		,{
			xtype: 'cp4_fileuploadpanel'
			, width: 320
			, id: 'upload_file'
			, uploadPath: '/var/log/upload/'
			, tmpPath: '/var/log/upload'
			, uploadLabel: 'Select the package to import:'
			, onUploadFinished: function(){
				var postParams = {trigger:"upload"};
							
				CP.Packages.poll_expected_res="import_complete";
				Ext.getCmp( 'btn-ok' ).enable();
				var window=Ext.getCmp( 'import-modal-window' );
				if (window)
					window.destroy();

				CP.Packages.showWaitingWindow('Importing package', 'Please wait while the package is imported',{upload: this.originalFileName},0);
			}
			,onUploadStarted: function(){ Ext.getCmp( 'btn-cancel' ).disable();}
		}];
		var form = Ext.create( 'CP.WebUI4.Panel',{
			id: 'mgmt_import_form',
			height:300,
			border: false,
			items: items
		});
		return form;
	} 
	
    ,showInstalledHotfixes: function(){
        var text = '<div style="padding:10px;overflow:auto;height:93%;"><br><b>Installed Hotfixes:</b><br><br><table><tbody>';
        for (var p in CP.Packages.INSTALLED_PACKAGES)
        {
            text = text + '<tr><td valign="top"> &bull;&nbsp;</td> <td valign="top">'+ CP.Packages.INSTALLED_PACKAGES[p] + '</td></tr>';
        }
		if (CP.Packages.INSTALLED_PACKAGES_CONTAINED.length > 0) {
			text +='</tbody></table> <br><br><b>Implicitly Installed Hotfixes (installed as part of another hotfix):</b><br><br><table><tbody>';
			for (var p in CP.Packages.INSTALLED_PACKAGES_CONTAINED)
			{
				text = text + '<tr><td valign="top"> &bull;&nbsp;</td> <td valign="top">'+ CP.Packages.INSTALLED_PACKAGES_CONTAINED[p] + '</td></tr>';
			}
			
		}
        return text+'</tbody></table></div>';
    }

	,showEventLogMessages: function(msgs) {
		if (msgs) {
			// clear the old messages
			Ext.getCmp(CP.Packages.DYNAMIC_MSGS).removeAll();
			
			// create the new messages and display them
			for (i = 0; i < msgs.length; i++) {
				if ((msgs[i].message == "") || (msgs[i].time_stamp == "")) {
					continue;
				}
				var msg = CP.Packages.createMsg(msgs[i]);
				if (msg){
					Ext.getCmp(CP.Packages.DYNAMIC_MSGS).insert(0, msg);
					Ext.getCmp(CP.Packages.DYNAMIC_MSGS).doLayout();
				}
			}
		}	
	}

	,popUpNewMessages: function(msgs) {
		if (msgs) {
			var newest_message_ts = 0;
			var new_msgs = [];
			var existing_messages = Ext.getCmp(CP.Packages.DYNAMIC_MSGS).items.items; // an array of DataFormPanels
			for (i = 0; i < msgs.length ; i++) {
				var msg_ts = Date.parse(msgs[i].time_stamp);
				if (msg_ts == CP.Packages.msgsTimeStamp) {
					// mark the message as new - only when it does not exist in existing_messages array
					for (j = 0; j < existing_messages.length; j++) {
						if ((existing_messages[j].form.items[0].html.indexOf(msgs[i].time_stamp) == -1) || 
									(existing_messages[j].form.items[1].html.indexOf(msgs[i].message) == -1)) {
							new_msgs.push(msgs[i]);
						}
					}
				}
				else if (msg_ts > CP.Packages.msgsTimeStamp) {
					new_msgs.push(msgs[i]);
				}
				// update the newest time stamp message
				if (newest_message_ts < msg_ts) {
					newest_message_ts = msg_ts;
				}
			}
			// popup the new messages
			for (i = 0; i < new_msgs.length; i++) {
				if (CP.Packages.msgsTimeStamp != 0) { //on page enter don't create balloon messages for the relevant messages
					CP.Packages.popupMessage(new_msgs[i].message ,new_msgs[i].time_stamp, new_msgs[i].ballon_flag);
				}
			}
			if (newest_message_ts != 0) {
				CP.Packages.msgsTimeStamp = newest_message_ts + 0.01;
			}
		}	
	}
	
    ,CreateAboutWindow: function() {
        var win = Ext.getCmp('about_window');
        if (win) {
            return;
        }
        win = Ext.create("CP.WebUI4.ModalWin",{
			id: 'about_window',
			title: 'Hotfixes Information',
			html: CP.Packages.showInstalledHotfixes(),
			bbar: [
				{
					xtype: 'label',
						text: 'Deployment Agent build: ' + CP.Packages.DA_VERSION
					},
					{
						xtype: 'tbfill'
					},
					{
						xtype: 'button',
						text: 'Close',
						style: 'border: 1px solid #8A7DEE',
					handler: function() {
						CP.Packages.INSTALLED_PACKAGES = new Array();
						CP.Packages.INSTALLED_PACKAGES_CONTAINED = new Array();
						win.destroy();
					}
				}
			]
        });
        win.setSize(450,350);
        win.show();
    }
	
	,runWaitRemoveTask: function() {
		// Run a recurring task that waits for a snapshot deletion to complete
		CP.Packages.removeSnapTimeout++;
		var img_name = CP.Packages.snapshotToDelArray[CP.Packages.snapshotToDelArray.length - 1];
		if (CP.Packages.removeSnapTimeout > CP.Packages.removeSnapTimeout_max) { //we have reached our time-out - force the operation to stop and display error
			if (Ext.getCmp('disk_space_window')) {
				CP.Packages.showCantRemoveSnaphotMsg(img_name); 
				Ext.getCmp('disk_space_window').destroy();
			}
			return;
		}
		var table=Ext.getCmp(CP.Packages.snapshot_grid_id);
		var index;
		Ext.Ajax.request({
			url: "/cgi-bin/img_mgmt.tcl"
			,method: "GET"
			,params: {custom:"status",name: img_name}
			,success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				if ( jsonData.msg == "none"|| jsonData.msg == "err") { // when the requested snapshot doesn't exist anymore, the jsonData will contain 'err'
					CP.Packages.snapshotToDelArray.pop();
					CP.Packages.removeSnapTimeout = 0;
					index = table.getStore().findExact('img_name',img_name);
					if (index != -1) { //remove the snapshot entry from the grid
						table.getStore().removeAt(index);
					}
					CP.Packages.runRemoveUpdateTask();
				} else {
					setTimeout("CP.Packages.runWaitRemoveTask();",1000);
				}
			}
			,failure: function() {
				setTimeout("CP.Packages.runWaitRemoveTask();",1000);
			}
		});
	}
	
	,runRemoveUpdateTask: function() {
		if (CP.Packages.snapshotToDelArray.length == 0) { //there are no more snapshots to remove
			if (Ext.getCmp('disk_space_window')) {
				Ext.getCmp('disk_space_window').destroy();
				CP.Packages.snapshotToDelArray.splice(0, CP.Packages.snapshotToDelArray.length); //clear the array
			}
			CP.Packages.showUpgradeRebootWarningMsg(CP.Packages.before_snapshotToDelBtn,CP.Packages.before_snapshotToDelRow);
			return;
		}
		
		// create snapshot delete request 
		var img_name = CP.Packages.snapshotToDelArray[CP.Packages.snapshotToDelArray.length - 1];
		Ext.Ajax.request({
			url: "/cgi-bin/img_mgmt.tcl"
			,method: "POST"
			,options: {img_name: img_name }
			,params: {trigger:"remove-btn", name:img_name}
			,success: function(jsonResult, options) {    
				var jsonData = Ext.decode(jsonResult.responseText);
				if (jsonData.success == "false") { // failed to delete the snapshot 
					if (Ext.getCmp('disk_space_window')) {
						CP.Packages.showCantRemoveSnaphotMsg(CP.Packages.snapshotToDelArray[CP.Packages.snapshotToDelArray.length - 1]); 
						Ext.getCmp('disk_space_window').destroy();
					}
					return;
				}
				if (jsonData.success == "true") {
					CP.Packages.runWaitRemoveTask();
				}
			}
		});
	}

	,CreateFreeDiskWindow: function(btn_id,selectedRow) {
		
		var title_lbl = Ext.create( 'CP.WebUI4.Panel',{});
		var free_space_lbl = Ext.create( 'CP.WebUI4.Panel',{ });
		var needed_space_lbl = Ext.create( 'CP.WebUI4.Panel',{ });
		var needed_space_diff_lbl = Ext.create( 'CP.WebUI4.Panel',{ });
		var space_to_remove_lbl = Ext.create( 'CP.WebUI4.Panel',{id: "space_to_remove_lbl"});
		
		title_lbl.update('<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px"><b><img src='+CP.Packages.WARNING_MESSAGE_ICON+'> There is not enough disk space for installation</b></span>');
		free_space_lbl.update("<br>Current free space :<b> " + CP.Packages.currnet_free_space +"G</b>");
		needed_space_lbl.update("Required disk space :<b> " + CP.Packages.new_partition_disk_size +"G</b>");
		var diff = CP.Packages.new_partition_disk_size - CP.Packages.currnet_free_space;
		needed_space_diff_lbl.update("<br>Please free at least :<b> " + Ext.Number.toFixed(diff ,2) + "</span>G</b> of un-partitioned disk space to complete the installation.<br><br><br>Select snapshots to delete:");
		space_to_remove_lbl.update("Disk space to free:<span style=color:red> " +Ext.Number.toFixed(diff , 2)+ "G");

		var ok_btn = {
			xtype: "cp4_button",
			id:"continue_upgrade_btn",
			text: "Delete snapshots and continue",
			handler: function() {
				//display are you sure window
				CP.WebUI4.Msg.show({
					title: 'Delete Snapshots',
					msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">Are you sure you want to delete the selected snapshots? </span>',
					buttons: Ext.Msg.OKCANCEL,
					icon: Ext.Msg.QUESTION,
					id: 'snapshot_delete_popup',
					fn: function(button) {
						if (button == "ok") {
							var table=Ext.getCmp(CP.Packages.snapshot_grid_id);
							if (!table) return;
							var tableLegnth = table.getStore().getCount();
							table.setLoading("Please wait. Deleting snapshots...");
							CP.Packages.disableRemoveSnapshotsAndContinueBtn();
							CP.Packages.snapshotToDelArray.splice(0, CP.Packages.snapshotToDelArray.length); //clear the array
							CP.Packages.before_snapshotToDelBtn = btn_id;
							CP.Packages.before_snapshotToDelRow = selectedRow;
							for (var i=0 ; i< tableLegnth ;i++) {
								if (table.getStore().getAt(i).data.deleted_state) {
									var img_name = table.getStore().getAt(i).data.img_name;
									CP.Packages.snapshotToDelArray.push(img_name);
								}
							}
							CP.Packages.runRemoveUpdateTask();
						}
						else
						{
							var disk_space_window = Ext.getCmp('disk_space_window');
							if (disk_space_window) {
								disk_space_window.destroy();
							}
						}
					}
				});
			}
		};
		var cancel_btn = {
			xtype: "cp4_button"
			,id:"btn_cancel_upgrade"
			,text: "Cancel"
			,handler: function() {
				var disk_space_window = Ext.getCmp('disk_space_window');
				if (disk_space_window) {
					disk_space_window.destroy();
				}
			}
		};

		var disk_space_window=Ext.create( 'CP.WebUI4.ModalWin',{
			id: 'disk_space_window',
			autoWidth: true,
			minHeight: 450,
			autoHeight: true,
			title: "Free Disk Space",
			hideLabel:true,
			items: [
				{
					xtype: 'cp4_formpanel',
					bodyPadding: 15,
					items: [
						title_lbl,
						free_space_lbl,
						needed_space_lbl,
						needed_space_diff_lbl,
						CP.Packages.createSnapshotGrid(),
						space_to_remove_lbl
					]
					,buttons: [ok_btn,cancel_btn]
				}
			]
		});
		CP.Packages.disableRemoveSnapshotsAndContinueBtn();
		if (disk_space_window) {
			disk_space_window.show();
		}
	}		
	
	,disableRemoveSnapshotsAndContinueBtn: function() {
		var continue_upgrade_btn = Ext.getCmp('continue_upgrade_btn');
		if (continue_upgrade_btn) {
			continue_upgrade_btn.disable();
		}
	}
	
	,enableRemoveSnapshotsAndContinueBtn: function() {
		var continue_upgrade_btn = Ext.getCmp('continue_upgrade_btn');
		if (continue_upgrade_btn) {
			continue_upgrade_btn.enable();
		}
	}

	,dateRenderer: function(serverFormat) {
		if (!serverFormat) return;
		var serverFormatArr = serverFormat.split(" ");
		var len = serverFormatArr.length;
		var i=0;

		/* remove entries with null content */
		while (i<len) {
			if (!serverFormatArr[i]) {
				serverFormatArr.splice(i,1);
				len--;
			}
			else i++;
		}

		var day	= ( len > 0 ) ? serverFormatArr[0] : ' ';
		var serverTime = ( len > 3 ) ? serverFormatArr[3] : ' ';
		var dd = ( len > 2 ) ? serverFormatArr[2] : ' ';
		var yy = ( len > 4 ) ? serverFormatArr[4] : ' ';
		var mm = ( len > 1 ) ? serverFormatArr[1] : ' ';

		switch (mm) {
			//JAN/FEB MAR/APR MAY/JUN JUL/AUG SEP/OCT NOV/DEC
			case 'Jan': mm = 1; break;
			case 'Feb': mm = 2; break;
			case 'Mar': mm = 3; break;
			case 'Apr': mm = 4; break;
			case 'May': mm = 5; break;
			case 'Jun': mm = 6; break;
			case 'Jul': mm = 7; break;
			case 'Aug': mm = 8; break;
			case 'Sep': mm = 9; break;
			case 'Oct': mm = 10;break;
			case 'Nov': mm = 11;break;
			case 'Dec': mm = 12;break;
		}

		return CP.util.dateToStr(dd,mm,yy) + " " + CP.util.displayTime(serverTime);
	}

	,createSnapshotGrid: function() {
		var store = Ext.create( 'CP.WebUI4.JsonStore',{ 
			data: CP.Packages.snapshotJsonData.data.manual,
			id: 'imgs_store',
			fields: [ 
				{name: "img_name"}, 
				{name: "img_description"},
				{name: "img_created"},
				{name: "img_size"},
				{name: "img_version"},
				{name: "img_state"}
			]
		});
		// Column Model
		CP.Packages.total_size_img=CP.Packages.currnet_free_space;
		var cm = [
			{
				xtype: 'checkcolumn',
				header: '',
				dataIndex: 'deleted_state',
				width: 35,
				editable: true,
				editor: {
					xtype: 'checkobx',
					cls: 'x-grid-checkheader-editor'
				},
				listeners: {
					checkchange: function(col, row, checked) {
						CP.Packages.total_size_img +=parseFloat ( store.getAt(row).data.img_size ) * (checked ? 1 : -1);
						var free_lbl = Ext.getCmp('space_to_remove_lbl');	
						if (CP.Packages.total_size_img > CP.Packages.new_partition_disk_size){
							free_lbl.update("Disk space to free:<span style=color:green> 0G");
							CP.Packages.enableRemoveSnapshotsAndContinueBtn();
						} else {
							var diff = CP.Packages.new_partition_disk_size - CP.Packages.total_size_img;
							free_lbl.update("Disk space to free:<span style=color:red> " +Ext.Number.toFixed(diff , 2)+ "G");
							CP.Packages.disableRemoveSnapshotsAndContinueBtn();
						}
					}
				}
			},          
			{header: "Snapshot Name", dataIndex: "img_name", minWidth:110},
			{header: "Description", dataIndex: "img_description", minWidth:160},
			{header: "Created", dataIndex: "img_created",width:130,renderer: CP.Packages.dateRenderer },
			{header: "Size", dataIndex: "img_size", width:60},
			{header: "Version", dataIndex: "img_version", minWidth:60,flex:1}
		];
			
		var wrapperPanel = Ext.create( 'CP.WebUI4.Panel',{
			items: [ 
				{
					xtype: 'cp4_grid',
					id: CP.Packages.snapshot_grid_id,
					width: 700,
					height:160,
					maxHeight: 180,
					autoScroll: true,
					autoScroll: true,
					store: store,
					columns: cm,
					defaults: {
						columnWidth: 0.5,
						border: true,
						xtype: "cp4_panel",
						bodyStyle: "padding:0 18px 0 0"
					}
				} 
			]
		});
		return wrapperPanel;
	}
	
	,showUpgradeRebootWarningMsg: function(btn_id,selectedRow) {
		var major_message ='This installs a new machine.<br>Existing OS settings and the Check Point Database will be overwritten.<br>There will be an automatic reboot.<br>Are you sure you want to continue?';
		var myparams={};
		var status_text="Initiating Install";
		var title_text ="";
			
		//major_upgrade
		if  (selectedRow.data.pkg_type_modified==CP.Packages.TYPE_REVERT) {
			title_text = "Image Revert";
			major_message='This will revert the settings on the machine to a previous state.<br>After that there will be an automatic reboot.';
		} else if (btn_id != CP.Packages.UPGRADE_BTN) {
			title_text = "Image Install";
		} else {
			title_text = "Image Upgrade";
			major_message='After this upgrade, there will be an automatic reboot.<br>(Existing OS settings and the Check Point Database are preserved.)';
		}
		CP.WebUI4.Msg.show ({
			closable: false,
			title: title_text,
			msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px">'+major_message+'</span>',
			buttons: Ext.Msg.OKCANCEL,
			icon: Ext.Msg.WARNING,
			fn: function(button) { 
				if (button == "ok") { 
					if (btn_id == CP.Packages.UPGRADE_BTN) {
						status_text="Initiating Upgrade";
						myparams["upgrade"] = selectedRow.data.package_name;
						CP.Packages.do_install(selectedRow, myparams, status_text);
					} else {
						myparams["install"] = selectedRow.data.package_name;
						CP.Packages.do_install(selectedRow, myparams, status_text);
					}
				}
			}
		});
	}

	,showUpgradeInsufficientDiskSpaceMsg: function() {
		var diff = CP.Packages.new_partition_disk_size	- CP.Packages.currnet_free_space;
		var msg =( "<br>Current free space : " + CP.Packages.currnet_free_space +"G<br>" +
				  "Required disk space : " + CP.Packages.new_partition_disk_size +"G<br>" +
				  "<br>Free at least : " + Ext.Number.toFixed(diff ,2) + "G of un-partitioned disk space to complete the installation.<br>" );
		
		CP.WebUI4.Msg.show ({
			closable: false,
			title: "Install - Insufficient Disk Space",
			msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px"> ' + msg + '</span>',
			width: 400,
			buttons: Ext.Msg.OK,
			icon: Ext.Msg.WARNING
		});
	}

	,showCantRemoveSnaphotMsg: function(reason) {
		var msg ="Could not remove snapshot: " + reason + ".<br>Use the <a href=\"javascript:void(0);\" onclick=\"CP.util.gotoPage(\'tree/img_mgmt\');return false;\">Gaia Snapshot Managment</a> page in order to clean un-partitioned disk space.";
		
		CP.WebUI4.Msg.show ({
			closable: false,
			title: "Snapshot Management",
			msg: '<span style="font-size:'+CP.Packages.MSG_FONT_SIZE+'px"> ' + msg + '</span>',
			width: 400,
			buttons: Ext.Msg.OK,
			icon: Ext.Msg.WARNING
		});
	}
	
	,convertButtonIdToContextButtonId: function(button_id) {
		return CP.Packages.CONTEXT_ITEM + button_id;
	}
	
	,convertContextButtonIdToButtonId: function(context_button_id) {
		var id = context_button_id;
		return(id.replace(CP.Packages.CONTEXT_ITEM, ""));
	}

	,isPartOfMajorLegacy: function(package_data) {
		if(!package_data)
		{
			return false;
		}
		return(((package_data.legacy_hotfix=="1") || (package_data.legacy_hotfix=="2")) && ((package_data.part_of_major) && (package_data.part_of_major == "1")));
	}
	,isDownloadedForDiffVersion: function(data) {
		if((!data) || (data.pkg_type_modified == CP.Packages.TYPE_MAJOR) || (!CP.Packages.isDeletebleStatus(data.status)))
		{
			return false;
		}
		return ((CP.Packages.current_version) && (CP.Packages.current_version != "") && (data.brought_version != "") && (CP.Packages.current_version != data.brought_version));
	}	
	,isDeletebleStatus: function(status) {
		if(!status)
		{
			return false;
		}
		return ((status == CP.Packages.INSTALL_FAILED) || (status == CP.Packages.AVAILABLE_INSTALL) || (status == CP.Packages.PARTIALLY_DOWNLOADED) || (status == CP.Packages.INSTALL_SKIPPED));
	}
	,isUninstallableLegacy: function(package_data) {
		if(!package_data)
		{
			return false;
		}
		return(((package_data.legacy_hotfix=="1") || (package_data.legacy_hotfix=="2")) && ((!package_data.part_of_major) || (package_data.part_of_major != "1")));
	}	
	
/* Obsolete Rendering functions
	,showProgress: function( progress ) {
		// alternate renderer for progress - shows percentage of progress
		if ((progress != "100") && (progress != "0") && (progress != "")) {
			return progress + '%';
		}
		return '';
	}
	
	,showStatus: function( status ){
		// renderer function for showing the package status in a nice color
		if (status == CP.Packages.AVAILABLE_DOWNLOAD) {
			return '<span style="color:green;">Available for Download</span>';
		}
		if (status == CP.Packages.DOWNLOADING) {
			return "Downloading";
		}
		if (status == CP.Packages.AVAILABLE_INSTALL) {
			return '<span style="color:blue;">Available for Install</span>';
		}
		if (status == CP.Packages.INSTALLING) {
			return "Installing";
		}
		if (status == CP.Packages.INSTALLED) {
			return '<span style="color:purple;">Installed</span>';
		}
		if (status == CP.Packages.DOWNLOAD_FAILED) {
			return '<span style="color:red;">Download Failed</span>';
		}
		if (status == CP.Packages.INSTALL_FAILED) {
			return '<span style="color:red;">Install Failed</span>';
		}
		if (status == CP.Packages.UNINSTALLING) {
			return "Uninstalling";
		}
		if (status == CP.Packages.UNINSTALL_FAILED) {
			return '<span style="color:red;">Uninstall Failed</span>';
		}
		return '<span style="color:red;">Unknown (Error)</span>';
	}
	*/
}
