CP.Overview = {

    BLADES_CONTAINER_ID: 'blades',
    BLADES_DISPLAY_WIN_ID: 'overview_blades_display_win',
    BLADE_WIDTH: 70,
    BLADE_HEIGHT: 60,
    BLADE_ANIM_DURATION: 1500,
    OVERVIEW_TCL_REQUEST: '/cgi-bin/overview.tcl',
    OVERVIEW_MAINPANEL_ID: 'overview_main_panel',
    ADD_WIDGET_BTN_ID: 'overview_add_widget_button',
    PORTAL_PANEL_ID: 'overview_portal_panel',
	PORTAL_PANEL_HEIGHT: 2050, 
 	PORTAL_PANEL_WIDTH: 940,
    BUTTON_CONTAINER_PANEL_ID: 'button_container_panel',
    MONITOR_UPDATE_FREQ: 2, // seconds, must divide 60
	NETWORK_UPDATE_FREQ: 60,
    CPU_UPDATE_TASK: null,
	NETWORK_UPDATE_TASK: null,
	SUMMARY_UPDATE_TASK: null,
	FEATURES: null,
	CLUSTER_UPDATE_TASK: null,
	SMC_TYPE: 'none',
		
init_ex: function() {

    CP.Overview.menuItemsArr = []; //holds the status of each portlet (show/hide)
    CP.Overview.btnItems = []; //holds all the items in the menu under 'add widget button'
    CP.UI.setPassExpirationMsgValues();
	
	var smartConsoleMsgBar =	Ext.create('Ext.MessageBar', {
            id: 'sc_msg_bar',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            hidden: (!CP.global.isMgmt),
            items: [{
                xtype: 'cp4_container',
                cls: 'download-text',
                html: 'Manage Software Blades using SmartConsole'
            }, {
                xtype: 'cp4_button',
                id: 'sc_download_button',
                iconCls: 'downlod-icon',
                text: 'Download Now!',
                handler: function(formType) {
                    if (CP.Overview.SMC_TYPE == "none") {

                        CP.WebUI4.Msg.show({
                            title: 'SmartConsole',
                            icon: 'webui-msg-info',
                            animEl: 'elId',
                            msg: 'SmartConsole is not available on this device.<br> Press OK to download and install relevant version from \'Gaia Software updates\' page, or cancel to stay in this page.',
                            buttons: Ext.Msg.OKCANCEL,
                            fn: function(btn, text) {
                                if (btn == 'cancel') {
                                    return;
                                }
                                CP.util.gotoPage("tree/installer");
                            }
                        });

                    } else {
                        this.removeCls('download-button-trigger-over');
                        setTimeout(function() {
                            location.href = _sstr + "/cgi-bin/download_dashboard.tcl?file=SmartConsole." + CP.Overview.SMC_TYPE;
                        }, 3000);
                    }

                }
            }]
        });
	
	var topUpdatesAndDownloadsBars =	Ext.create('CP.WebUI4.FormPanel', {
	id: 'updates_and_downloads_panel',
	items: [smartConsoleMsgBar],
	});
	
	var passExpWarnBarWidth = CP.Overview.PORTAL_PANEL_WIDTH - 20 ;
	// Explicitly create a Container
	var passExpWarnMsgBar =	Ext.create('Ext.MessageBar', {
			id: 'pass_warn_msg_bar',
				layout: {
					type: 'hbox'
				},
			hidden: ( ! CP.global.showPassWarn),
			width: passExpWarnBarWidth,
			height: 35,
			margin: '16 14 25 10',
			renderTo: Ext.getBody(),
			items: [{
					xtype: 'cp4_container',
			    	layout: 'column',
			    	items: [{
							xtype: 'cp4_panel',
                            value: '',
                            id: 'warn_image',
                            name: 'warn_image',
                            fieldLabel:' ',
                            cls:'webui-msg-warning',
                            width: 30,
                            height: 30,
                            labelWidth: 1,
                            margin: '0 2 2 2'
						},
						{
                            xtype: 'cp4_displayfield',
							cls: null,
                            value: (CP.global.showPassMsg) +'. In order to update your password use the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/chpass\');return false;">Change My Password</a> page.',
                            id: 'warn_fields',
                            name: 'warn_fields',
                            fieldLabel: '',
                            width: 550,
                            height: 30,
                            labelWidth: 500,
                            margin: '6 2 2 25'
					}]
				}]	
	});

	
	Ext.Ajax.request({
        url: CP.Overview.OVERVIEW_TCL_REQUEST +'?option=global',
        method: 'GET',
        success: function( response ){
                        var staticStore = Ext.decode( response.responseText ); 
                        CP.Overview.SMC_TYPE = staticStore.data.smcType;
			//create the portlets first
			
			var portlets = CP.Overview.createPortlets();
			//then create the menu for the button (must come after 'createPortlets').
			var btnMenu = Ext.create( 'CP.WebUI4.ButtonMenu',{
				items: CP.Overview.btnItems,
                listeners:{
        	        beforeadd: function( p, component, index, eOpts ){
        		        var x = CP.global.isMgmt;
        		        if (component.id == "overview_menuitem_smart_console" && !CP.global.isMgmt)
        			        return false;
							
						if (component.id == "overview_menuitem_network_configuration" && !CP.util.isPermittedFeature('interface'))
							return false;
						else return true;
        	        }
                }
			}); 
			
			//build main panel
			var mainPanel = Ext.create( 'CP.WebUI4.DataPanel',{
				id: CP.Overview.OVERVIEW_MAINPANEL_ID,
				margin: 10,
				listeners: {
					removed: function(){
						CP.Overview.stop_all_tasks();
					},
					destroy: function(){
						CP.Overview.stop_all_tasks();
					}					
				},
				items: [ 
					passExpWarnMsgBar,
					topUpdatesAndDownloadsBars,
					portlets,
                    {
                        //'Add Widget' button - needs to be rendered outside the portlet columns
                        xtype: 'cp4_container',
                        items: [{
                            xtype: 'cp4_container',
                            cls: 'overview-no-items',
                            margin: '0 0 10 61',
                            padding: '130 0 0 30',
                            html: 'No widgets have been selected.',
                            id: CP.Overview.BUTTON_CONTAINER_PANEL_ID,
                            hidden: true
                        }, {
                            xtype: 'cp4_button',
                            text: 'Add Widget',
                            margin: (CP.util.isIE8()) ? '0 0 0 20' : '0 0 0 91',
                            id: CP.Overview.ADD_WIDGET_BTN_ID,
                            menu: btnMenu,
                            listeners: {
                                click: CP.Overview.manageMenuIcon
                            }
                        }]
                    }]
			});
				
			//create the page object
			var page = {
				title: 'System Overview',
				panel: mainPanel
			};
		  
			//and display the page
			CP.UI.updateDataPanel( page, CP.global.overview );
			  
			//load portlets state from server
			CP.Overview.getPortletState();

			//run all actions that occures after loading
			CP.UI.afterLoading();

        },
        failure: function( response ){
            CP.WebUI4.Msg.alert( 'Error', 'getPortletState: GET operation failed' );
        }
    });
	
   

},

init : function () 
{
	CP.Overview.updatesAvailable = false;
	CP.Overview.getUpdatesAvailableState();
	if (CP.util.isPermittedFeature('backup'))
	{
		Ext.Ajax.request({
			url: "/cgi-bin/backup.tcl?operation=query-backup-progress"
			,method: "GET"
			,success: function(jsonResult) {
				var jsonData = Ext.decode(jsonResult.responseText);
				var status = decodeURIComponent(jsonData.data.status);
				if(status.search("restore") != -1) {
					var statusArr = status.split(" ");
					if (statusArr[0] == "Performing"){
						CP.util.gotoPage("tree/backup");
						return;
					}
				}
				CP.Overview.init_ex();
			}
		});	
	} else {
		CP.Overview.init_ex();
	}
},

createPortlets: function(){
    //Set default height for portlets
    var defaultHeight = 170;

    //create some portlet tools using built-in Ext4 tools
    function getTools(){
        return [{
            xtype: 'cp4_tool',
            type: 'toggle',
            qtip: 'Toggle',
            handler: function( event, toolEl, panel, tool ){
                panel.ownerCt.toggleCollapse();
           }
        }/*,{ //the setting tool is currently inactive
            xtype: 'cp4_tool',
            type: 'gear',
            qtip: 'Settings tool',
            handler: function( event, toolEl, panel, tool ){
                CP.WebUI4.Msg.alert( 'Message', 'The Settings tool was clicked.' );
            }
        }*/,{
            xtype: 'cp4_tool',
            type: 'close',
            qtip: 'Close',
            handler: function( event, toolEl, panel, tool ){
                CP.Overview.postSavedState( panel.ownerCt.getId());
            }
        }];
    }

    //Create the blades portlet
    var bladesPortlet = {
        title: 'Blades',
        id: CP.Overview.BLADES_CONTAINER_ID,
        tools: getTools(),
        permission: 'blades',
        items: [{
            xtype: 'cp4_container',
            cls: 'blades-summary-body',
            items: []
        }],
		listeners: {
    		render: CP.Overview.setSummary,				
        }
    };

    Ext.Array.each(['fw1','vpn','ips','appi','urlf','av','anti_bot','te','tx','aspm','dlp','ma'], function(item, index, allItems){
        var blade = {
            xtype: 'cp4_container',
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'middle'
            },
            items: [
                {
                    xtype: 'cp4_container',
                    cls: 'blade_image',
                    id: item.concat('_o_image'),
                    name: item.concat('_o_image')
                },
                {
                    xtype: 'cp4_label',
                    cls: 'blade_title',
                    id: item.concat('_o_title'),
                    name: item.concat('_o_title'),
                    hideLabel: true
                },
                {
                    xtype: 'form',
                    cls: 'blade_fields',
                    id: item.concat('_o_fields'),
                    items: []
                }
            ]
        };
        bladesPortlet.items[0].items.push(blade);
        if(index < allItems.length - 1){
            var separator = {
                xtype: 'menuseparator'
            };
            bladesPortlet.items[0].items.push(separator);
        }
    });
    
    this.initBladesTable();

    var monitorStore = Ext.create( 'CP.WebUI4.JsonStore',{
        fields: ['cpu', 'memory', 'packetrate', 'througput' ,'count' , 'index'],
        data: [ ]
    }); //end store
    
	var successCpuUpdateCallback =  
		function(jsonResult) {
		                var jsonData = Ext.decode(jsonResult.responseText);
		                var len = monitorStore.getCount( ) ;
						var max_sample = 60 / CP.Overview.MONITOR_UPDATE_FREQ;
						
		                if (len == max_sample) {
		                	monitorStore.each(function(rec){
								if (rec.data.index == 0){
		                			monitorStore.remove(rec);
									
									rec.data.count = max_sample-1;
									rec.data.index = max_sample-1;
		                			rec.data.memory = jsonData.data.memory;
									rec.data.cpu = jsonData.data.cpu;
									rec.data.througput = jsonData.data.througput/1024 ;
									rec.data.packetrate = jsonData.data.packetrate ;
									monitorStore.add(rec);
								} else {
		                			rec.data.index--;
									rec.data.count=rec.data.index;
		                		}
		                	});
		                }
		                else {
							var i;
							if ( len == 0 ) len = 1 ;
							i = max_sample / len ;
							var j=max_sample-1-len;
							
		                	monitorStore.each(function(rec){
								rec.data.count = j/i ;
								rec.data.index = j ;
								j++;
		                	});
		                	monitorStore.add({index:max_sample,count: len, memory: jsonData.data.memory, cpu: jsonData.data.cpu,througput: jsonData.data.througput/1024,packetrate: jsonData.data.packetrate});
		                }
						
		                var mon_chart = Ext.getCmp('memory_monitor_chart');
		                if (mon_chart) {
		                	mon_chart.redraw();
		                }
		                var mon_chart = Ext.getCmp('cpu_monitor_chart');
		                if (mon_chart) {
		                	mon_chart.redraw();
		                }
						
						var mon_chart = Ext.getCmp('packet_rate_monitor_chart');
		                if (mon_chart) {
		                	mon_chart.redraw();
		                }
						
						var mon_chart = Ext.getCmp('throughput_monitor_chart');
		                if (mon_chart) {
		                	mon_chart.redraw();
		                }
						
    };
	
	
	CP.Overview.CPU_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/monitor.tcl', 'GET', successCpuUpdateCallback,  CP.Overview.MONITOR_UPDATE_FREQ);
    Ext.TaskManager.start(CP.Overview.CPU_UPDATE_TASK);

			
	var successNetUpdateCallback =  
			function( jsonResult ){
                CP.Overview.Interfaces = Ext.decode( jsonResult.responseText );    
                //refresh grid data
                var grid = Ext.getCmp( 'net_grid' );
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read( CP.Overview.Interfaces );
                store.loadData( data.records[0].raw.data.interfaces );
                //data.records[0].raw.data is the stem
                var show_adp_column = data.records[0].raw.data.adp_demo |= data.records[0].raw.data.adp_device_present;
                var adp_column = Ext.getCmp( 'net_grid_adp_col' );
                if(adp_column) {
                    adp_column.setVisible( show_adp_column );
                }
                grid.doComponentLayout();
			};

	CP.Overview.NETWORK_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/interfaces.tcl?overview_page=t', 'GET', successNetUpdateCallback,  CP.Overview.NETWORK_UPDATE_FREQ);
	
    var portletsTitleFont = '11px Arial';
    var memMonitorPortlet = {
		title: 'Memory Monitor',
		id: 'memory_monitor',
		tools: getTools(),
		height: 300,
		layout:'fit',
		items: [{
			xtype: 'cp4_chart',
			id: 'memory_monitor_chart',
			store: monitorStore,
			axes: [{
				title: 'Memory Usage History (\%)',
				type: 'Numeric',
				fields: ['memory'],
				position: 'right',
				grid: true,
				majorTickSteps: 5,
				labelTitle: { font: portletsTitleFont },
				minimum: 0,
				maximum: 100
				}],
			series: [{
				type: 'line',
				axis: 'right',
				xField: 'count',
				yField: 'memory',
				showMarkers: false,
				smooth: true
			}]
		}]
    };
	
	
	    var packetRatePortlet = {
            title: 'Packet Rate ',
            id: 'packetRatePortlet',
            tools: getTools(),
            height: 300,
			layout:'fit',
            items: [{
            	xtype: 'cp4_chart',
            	id: 'packet_rate_monitor_chart',
            	store: monitorStore,
                axes: [{
                	title: 'Packets per second',
                	type: 'Numeric',
                    fields: ['packetrate'],
                    position: 'right',
                    grid: true,
                    majorTickSteps: 5,
					labelTitle: { font: portletsTitleFont },
					resizable: true, // draw scalable graph
					minimum: 0
                }],
                series: [{
                	type: 'line',
                	axis: 'right',
                	xField: 'count',
                	yField: 'packetrate',
                	showMarkers: false,
                	smooth: true
                }]
            }]
    };

	
	    var throughputPortlet = {
            title: 'Throughput ',
            id: 'throughputPortlet',
            tools: getTools(),
            height: 300,
			layout:'fit',
            items: [{
            	xtype: 'cp4_chart',
            	id: 'throughput_monitor_chart',
            	store: monitorStore,
                axes: [{
                	title: 'Kilo bits per second [Kbps]',
                	type: 'Numeric',
                    fields: ['througput'],
                    position: 'right',
                    grid: true,
                    majorTickSteps: 5,
					labelTitle: { font: portletsTitleFont },
					resizable: true,  // draw scalable graph
					minimum: 0
                }],
                series: [{
                	type: 'line',
                	axis: 'right',
                	xField: 'count',
                	yField: 'througput',
                	showMarkers: false,
                	smooth: true
                }]
            }]
    };
	
	
	
    var cpuMonitorPortlet = {
            title: 'CPU Monitor',
            id: 'cpu_monitor',
            tools: getTools(),
            height: 300,
            items: [{
            	xtype: 'cp4_chart',
            	id: 'cpu_monitor_chart',
            	store: monitorStore,
                axes: [{
                	title: 'CPU Usage History (\%)',
                	type: 'Numeric',
                    fields: ['cpu'],
                    position: 'right',
                    grid: true,
                    majorTickSteps: 5,
					labelTitle: { font: portletsTitleFont },
                    minimum: 0,
                    maximum: 100
                }],
                series: [{
                	type: 'line',
                	axis: 'right',
                	xField: 'count',
                	yField: 'cpu',
                	showMarkers: false,
                	smooth: true
                }]
            }]
    };

 
	function getRecordByName(name) {
		var interfaceGrid = Ext.getCmp( 'net_grid' );
		var store = interfaceGrid.getStore();
		var record;
		store.each(function(rec){
			if (rec.data.name == name) {
				record = rec;
				return;
			}
		});

		return record;
     }
	
                // Link Status Renderer
	function showLink(val, meta, record) {
		switch (record.data.type) {
			case 'pppoe':
                text = record.data.pppoe_ex.conn_status;
                switch(text) {
                    case 'Connected':
                            cls = 'link-up';
                    break;
                    case 'Connecting...':
                            cls = 'link-disabled';
                    break;
                    case 'Disconnected':
                            cls = 'link-down';
                    break;
                }
                break;
			case 'bond':
				if (record.data.state == 'on') {
					if (record.data.link_state == 'on') {
						text = 'Up';
						cls = 'link-up';
					}
					else {
						text = 'No Link';
						cls = 'link-down';
					}
				}
				else {
					text = 'Down';
					cls = 'link-disabled';
				};
				break;
	        case 'bridge':     
			case 'gre':
				if (record.data.link_state == 'Up') {
						text = 'Up';
						cls = 'link-up';
					}
					else {
						text = 'No Link';
						cls = 'link-down';
					}
				break;
			case 'aux':
			case 'loopback':
				if (record.data.state == 'on') {
		            text = 'Up';
		            cls = 'link-up';
		            break;
				}
				else {
		            text = 'Down';
		            cls = 'link-disabled';
		            break;
				}
					
			case 'vlan':
					if (record.data.state == 'off') {
		                text = 'Down';
		                cls = 'link-disabled';
		                break;
					}
				
			case 'alias':
				record = getRecordByName(record.data.depend_on);
				return showLink(val, meta, record);
				
			default:
				if (record.data.state == 'on') {
					if (record.data.link_carrier == 'link up'){
			            text = 'Up';
			            cls = 'link-up';
			            break;
					}
					else {
			            text = 'No Link';
			            cls = 'link-down';
			            break;
					}
				} else {
		            text = 'Down';
		            cls = 'link-disabled';
		            break;
				}
		}
	    if( cls == '' ){
	        return text;
	    }else{
	        return '<div class="'+ cls +'">'+ text +'</div>';
	    }
	}
	
	        // IP address renderer
	function showIP(val, meta, record) {
		if (val == undefined ) return "-";
        if (val != "" ) { 
            if (record.data.type == "loopback")
                return val;
			return val;
        }
        return "-";
    }

	function showADP(value, meta, rec, row, col, st, view) {
	    if(rec.data.adp_able) {
	        return (value == "") ? "No" : "Yes";
	    }
	    return "";
	}
	
	var cm = [
                { width: 100, header:'Name', dataIndex:'name'},
                { width: 45, header: 'SAM', id: 'net_grid_adp_col', dataIndex: 'adp_mode', hidden: true, renderer: showADP},
                { width: 100, header:'IPv4 Address', dataIndex:'v4Addr', renderer : showIP},
                { width: 125, header:'IPv6 Address', dataIndex:'v6Addr', renderer : showIP},
                { width:  50, header:'Link Status', dataIndex:'link_state' , flex : 1 , renderer : showLink },
				{ header:'Type', dataIndex:'type' , hidden: true}, 
				{ header:'Member Of', dataIndex:'depend_on', hidden: true}
    ];


	var NetworkPortlet = {
		title: 'Network Configuration',
	    id: 'network_configuration',
	    tools: getTools(),
		height: 300,
		permission: 'interface',
		listeners:	{
			afterrender: Ext.Function.bind(Ext.TaskManager.start,this,[CP.Overview.NETWORK_UPDATE_TASK])
		},
		layout: 'fit',
		items:
			[{
				xtype:'cp4_formpanel',
				layout: 'fit',
				items: [
							{
								xtype	:	'cp4_grid',
								id		:	'net_grid',
								margin: 5,
								autoScroll: true,
								sortableColumns: false,
								enableColumnHide: false,
								columns: cm,
								store: CP.Overview.Interfaces,
								listeners: {
									select: function() {CP.util.gotoPage("tree/interfaces");}
								}
							}		
				]}
			]
	};

	var SystemPortlet = {
        //System overview
        title: 'System Overview',
        id: 'sysoverview',
        tools: getTools(),
        //height: 400,
        items: [{
            xtype:'cp4_formpanel',
            id: 'ov-panel',
            header: false,
            bodyPadding: 10,
            labelWidth: 100,
            defaultType: 'cp4_displayfield',
            defaults: {
                minWidth: 420,
		labelWidth: 120,
                width: 420
            },
            items: [{
				xtype: 'cp4_panel',
				height: 40,
				width: 400, 
				columnWidth: .50,
				layout:'column',
				items: [{				
					// ~~~ LEFT COLUMN				
						xtype: 'cp4_displayfield',
						fieldLabel: '',      
						hidelabel: true,
						name: 'os_product',
						fieldCls: 'webui4-overview-portlet-title',						
						width: (CP.global.isGW) ? 228 : 255

            },{
					// ~~~ MIDDLE COLUMN
						xtype: 'cp4_displayfield',
						value: '|',
						name: 'pipelineoverview',
						fieldCls: 'webui4-overview-portlet-title',
						width: 12
            },{
						// ~~~ RIGHT COLUMN	
						xtype: 'cp4_displayfield',
						fieldLabel: '',      
						hidelabel: true,
						name: 'cpshared_version',
						fieldCls: 'webui4-overview-portlet-title-ver',						
						width: 50
			    }]
            },{
                fieldLabel: 'Kernel',
                name: 'os_kernel',
				fieldCls: 'webui4-overview-portlet-value'						

            },{
				fieldLabel: 'Edition',
                name: 'os_edition',
				hidden:(CP.util.featurePermission('sysconfig') != null )?false:true,
				autoEl: {
					tag: 'a',
					href: '#',
					onclick: 'CP.util.gotoPage(\'tree/sysconfig\', \'url\', \'config\')'
				},
				fieldCls: 'webui4-overview-portlet-value-underline'		
            },{
                fieldLabel: 'Build Number',
                name: 'os_build',
				fieldCls: 'webui4-overview-portlet-value'						
            },{
                fieldLabel: 'System Uptime',
                name: 'uptime',
				fieldCls: 'webui4-overview-portlet-value'
            },{ 
                fieldLabel: 'Software Updates',
                id: 'software_updates',
		labelWidth: 120,
                name: 'software_updates',
                                autoEl: {
                                        tag: 'a',
                                        href: '#',
                                        onclick: 'CP.util.gotoPage(\'tree/installer\', \'url\', \'config\')'
                                },
                fieldCls: 'webui4-overview-portlet-value-underline',
             listeners: {
                        afterrender: function(item) {
                                     item.tip = Ext.create( 'CP.WebUI4.ToolTip' ,{
                                     target: 'software_updates',
                             });
                        }
                }
            },{ 
                fieldLabel: 'Serial Number',
                id: 'serial',
                name: 'serial',
                hidden: true,
                listeners: {
                	change: function(fl, newVal){
                		if (newVal != "")
                			fl.show();
                	} 
                }
            },{
				xtype: 'cp4_panel',
				cls: 'platform-box',
	        	layout: {
	                type: 'vbox',
	                align: 'center',
	                pack: 'center'
	            },
	            height: 130+52+20,
	        	items: [{
		        	xtype: 'cp4_panel',
					bodyCls: (CP.global.applianceType ==  "VMware") ? 'overview-device-img-vm-cloud' : 'overview-device-img' ,
					height: 130,
					width: 220
            },{
		        	xtype:'cp4_formpanel',
					id: 'ov-panel-wind',
		        	style: "margin-top:20px;",
					items: [{
						xtype: 'cp4_displayfield',
                		fieldLabel: 'Platform',
						width: 220,
						labelwidth: 100						
            },{ 
						xtype: 'cp4_displayfield',
						label: 'Platform',
						labelwidth: 100,
						width: 220,
						value: CP.global.applianceType,
						fieldCls: 'webui4-overview-portlet-platform'
					}]
			    }]
				
            }]
            ,listeners: {
                render: CP.Overview.doLoad
            }
        }]
    };
	
	
    //array which holds all protlet objects
    var Normalportlets = [
	SystemPortlet,
	bladesPortlet,   
	NetworkPortlet,	
	cpuMonitorPortlet,
	memMonitorPortlet,   
	packetRatePortlet,
	throughputPortlet
	
       /*,
    {                      // Temporarly Closed since there is no backend support for it
            //Top Services
            title: 'Top Services',
            id: 'network',
            tools: getTools(),
            html: '&nbsp;',
            bodyStyle: 'background:url(/images/overview/topsrv.png) no-repeat center 7px #fff !important;',
            height: 390
        }*/
    ];
	
	function renderClusterMember(val, meta, record) {
		var cls = "";
		
		if(record.data.member_type == "local") {
			cls = "member-local";
		} else if(record.data.is_up) {
			cls = "member-up";
		} else {
			cls = "member-down";
		}
		
		return '<div class="'+ cls +'">'+ val +'</div>';
	}
	
	
    var cluster_cm = [
		{header: 'Member Name' ,dataIndex:'member_name', flex:1 , renderer: renderClusterMember } ,
        {header: 'IPv4 Address' ,dataIndex:'member_addr', flex:1 },
		{header: 'Model' ,dataIndex:'member_model', flex:1 },
		{header: 'Up Time' ,dataIndex:'member_uptime', flex:1 }
    ];  

	function liveResponseToMappedArray(liveResponse) {
		
		var resp_array = [];
		liveResponse = liveResponse.split("\r");

		for(var i = 0;i < liveResponse.length;i++) {
			if(i%2 == 0) {
				var member_addr = liveResponse[i].substring(("Response from node ").length,liveResponse[i].length);
			} else {
				var down_test = 'Member ' + member_addr + ' is down. See "/var/log/messages".'
				var member_response = liveResponse[i];
				
				if(member_response == down_test) {
					member_response = "";
					var m_v = {member_addr : member_addr,
							   member_response : member_response,
								is_member_up : false};
				} else {
					var m_v = {member_addr : member_addr,
							   member_response : member_response,
								is_member_up : true};
				}
				resp_array.push(m_v);
			}
		}

		return resp_array;
	}
	
	
	var successClusterUpdateCallback =  function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			var grid = Ext.getCmp( 'cluster_members_tbl' );
			if(grid) {
				var store = grid.getStore();
				if(store) {
					store.loadData(jsonData.data.cluster_members);
				
					var cluster_live_hostname = Ext.htmlDecode(jsonData.data.cluster_live_hostname);
					var cluster_live_hostname_objs = liveResponseToMappedArray(cluster_live_hostname);
								
					for(var i = 0;i < cluster_live_hostname_objs.length;i++) {
						var store_pos = store.findRecord("member_addr",cluster_live_hostname_objs[i].member_addr);
						if(store_pos) {
							store_pos.set("is_up",cluster_live_hostname_objs[i].is_member_up);
						}
					}		
					
					var cluster_live_uptime = Ext.htmlDecode(jsonData.data.cluster_live_uptime);
					var cluster_live_uptime_objs = liveResponseToMappedArray(cluster_live_uptime);
					
					for(var i = 0;i < cluster_live_uptime_objs.length;i++) {
						var store_pos = store.findRecord("member_addr",cluster_live_uptime_objs[i].member_addr);
						if(store_pos) {
							store_pos.set("member_uptime",cluster_live_uptime_objs[i].member_response);
						}
					}					
					
					var cluster_live_model = Ext.htmlDecode(jsonData.data.cluster_live_model);
					var cluster_live_model_objs = liveResponseToMappedArray(cluster_live_model);
								
					for(var i = 0;i < cluster_live_model_objs.length;i++) {
						var store_pos = store.findRecord("member_addr",cluster_live_model_objs[i].member_addr);
						if(store_pos) {
							store_pos.set("member_model",cluster_live_model_objs[i].member_response);
							store_pos.set("is_up",cluster_live_model_objs[i].is_member_up);
						}
					}
					
					var store_pos = store.findRecord("member_addr",jsonData.data.cluster_localaddr);
					if(store_pos) {
						store_pos.set("member_name",store_pos.get("member_name") + " (local)");
					}		
			
				}				
				grid.doComponentLayout();	
			}
    };		
	
		CP.Overview.CLUSTER_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/cluster_monitor.tcl',
								'GET', successClusterUpdateCallback,  10);
		
		var ClusterPortlet = {
			title: 'Cloning Group Members',
			id: 'cluster_members',
			tools: getTools(),
			height: 220,
			permission: 'cluster',
			layout: 'fit',
			listeners:	{
				afterrender: Ext.Function.bind(Ext.TaskManager.start,this,[CP.Overview.CLUSTER_UPDATE_TASK])
			},
			items:
				[{
					xtype:'cp4_formpanel',
					layout: 'fit',
					items: [
								{
									xtype	:	'cp4_grid',
									id: 'cluster_members_tbl'
									,margin: 0
									,columns: cluster_cm
									,listeners: {
										destroy: function() {
											if (CP.Overview.CLUSTER_UPDATE_TASK != null){
												Ext.TaskManager.stop(CP.Overview.CLUSTER_UPDATE_TASK);
												CP.Overview.CLUSTER_UPDATE_TASK = null;
											} 
										}		
									}
								}
					]}
				]
		};	
		
		var ClusterPortlets = [
			ClusterPortlet
		];

	
	var portlets = [];
	
	if(!CP.global.isCluster) {
		portlets = portlets.concat(Normalportlets);
	} else {		
		portlets = portlets.concat(ClusterPortlets);		
	}
	
    //create the menuItems array which builds the widgets menu according to defined portlets
    for( var i in portlets ){
        var p = portlets[i];
        if( !p || !p.id ){ // first is a "dummy portlet"	-	CHECK why do we have empty item at the start of the array !
            continue;
        }
		
	// Don't add packetrate/throughput on GW
	if (CP.global.isGW == false && (p.id == 'packetRatePortlet' || p.id == 'throughputPortlet')) 
		continue ;
	
        var pid = p.id;
        CP.Overview.btnItems[ CP.Overview.btnItems.length ] = {
            text: p.title,
            id: 'overview_menuitem_'+ pid,
            iconCls: 'overview-menu-icon',
            handler: Ext.bind( CP.Overview.postSavedState, this, [pid])
        };
    }
    
	// Partition the portlets to left and right regions
	var itemLeft = [];
	var itemRight = [];
	var counter = 0;
	for (var i in portlets){
		var p = portlets[i];
		if( !p || !p.id ){ // first is a "dummy portlet"	-	CHECK !
			continue;
		}
		
		// Don't add packetrate/throughput on none-GW
		if (CP.global.isGW == false && (p.id == 'packetRatePortlet' || p.id == 'throughputPortlet')) 
			continue ;
		
		// Don't add smartconsole widget on none-Management
		if (CP.global.isMgmt == false && (p.id == 'smart_console'))
			continue;
		
		/*
		 * portel can have permission field, permission should contain the feature which 
		 * the porlet is depend on.
		 */
		if (p.permission && p.permission != '' && !CP.util.isPermittedFeature(p.permission) /*CP.Overview.getFeature(p.permission)*/ ) {
			continue;
		}
		if ( (counter++ % 2 ) == 0){
			itemLeft.push(p);
		}
		else{
			itemRight.push(p);
		}
	}
	
    //Main overview panel with columns
    var overviewPanel = Ext.create( 'CP.WebUI4.PortalPanel',{
        title: 'Overview',
        cls: 'overview-title',
        height: CP.Overview.PORTAL_PANEL_HEIGHT,
		width: CP.Overview.PORTAL_PANEL_WIDTH,
        id: CP.Overview.PORTAL_PANEL_ID,
        defaults: { style:'padding:0px;' },
        items:[{
            items: itemLeft
        },{
            items: itemRight
        }]
    });
    return overviewPanel;
},


stop_all_tasks: function(){
	if (CP.Overview.CPU_UPDATE_TASK != null){
		Ext.TaskManager.stop(CP.Overview.CPU_UPDATE_TASK);
		CP.Overview.CPU_UPDATE_TASK = null;
	}
	if (CP.Overview.NETWORK_UPDATE_TASK != null){
		Ext.TaskManager.stop(CP.Overview.NETWORK_UPDATE_TASK);
		CP.Overview.NETWORK_UPDATE_TASK = null;
	}
	if (CP.Overview.SUMMARY_UPDATE_TASK != null){
		Ext.TaskManager.stop(CP.Overview.SUMMARY_UPDATE_TASK);
		CP.Overview.SUMMARY_UPDATE_TASK = null;
	}
	if (CP.Overview.CLUSTER_UPDATE_TASK != null){
		Ext.TaskManager.stop(CP.Overview.CLUSTER_UPDATE_TASK);
		CP.Overview.CLUSTER_UPDATE_TASK = null;
	}
},


doLoad: function( formPanel ){
    formPanel.getForm().load({
        url: CP.Overview.OVERVIEW_TCL_REQUEST,
        method: 'GET',
	success: function( form, action ){
	    var jsonData = Ext.decode(action.response.responseText);
            var tip=Ext.getCmp("software_updates").tip;
            tip.update("Last Update Time: " + jsonData.data.software_updates_last);
        }
    });
},


//post portlets state to server (hide|show)
postSavedState: function( panelId ){
    var sysparams = {};
	if(panelId == 'updates_and_downloads_panel'){
		panelId = 'updates';
	}
    var panel = Ext.getCmp( panelId );
    sysparams[ panelId ] = ( panel.isVisible() == true ) ? 't' : 'f'; //if widget_id=t it will be hidden
    
    Ext.Ajax.request({
        url: CP.Overview.OVERVIEW_TCL_REQUEST,
        params: sysparams,
        method: 'POST',
        success: function( response ){
            CP.Overview.getPortletState();
        },
        failure: function( response ){
            CP.WebUI4.Msg.alert( 'Error', 'postSavedState: POST operation failed' );
        }
    });
},


//get portlets state from server (hide|show)
getPortletState: function(){
    Ext.Ajax.request({
        url: CP.Overview.OVERVIEW_TCL_REQUEST +'?option=global',
        method: 'GET',
        success: function( response ){
            CP.Overview.togglePortlet( response );
        },
        failure: function( response ){
            CP.WebUI4.Msg.alert( 'Error', 'getPortletState: GET operation failed' );
        }
    });
},


getUpdatesAvailableState: function(){
    Ext.Ajax.request({
        url: CP.Overview.OVERVIEW_TCL_REQUEST ,
        method: 'GET',
        success: function( response ){
			var json = Ext.decode( response.responseText );
			if (json.data.available_updates != ""){
				CP.Overview.updatesAvailable = true;
			}
				
        },
        failure: function( response ){
            CP.WebUI4.Msg.alert( 'Error', 'getUpdatesAvialableState: GET operation failed' );
        }
    });
},

//Menu toggle function
togglePortlet: function( response ){
    var smallHeight = 85;
    var height = smallHeight;
    
    //analyze response
    var json = Ext.decode( response.responseText );
    var data = json.data;
    for( var i in data ){
        var portlet = Ext.getCmp( i );
        if( !portlet ){
            continue;
        }
        var status = ( data[ i ] == 't' ) ? 't' : 'f'; //t=portlet is hidden, f=visible
        if( status == 'f' ){  //f=visible
            height = CP.Overview.PORTAL_PANEL_HEIGHT;
        }
        CP.Overview.menuItemsArr[ 'overview_menuitem_'+ i ] = status; //save for later
    }

    //show odr hide the "no items" image
    var buttonContainer = Ext.get( CP.Overview.BUTTON_CONTAINER_PANEL_ID );
    if( height == smallHeight ){
        buttonContainer.show();
    }
    else{
        buttonContainer.hide();
    }

    //roll 'add widget' button up or down
    Ext.get( CP.Overview.PORTAL_PANEL_ID ).setHeight( height,{
        duration: 1000,
        scope: this
    });
    
    //show or hide portlets    
    for( var i in data ){
        var portlet = Ext.getCmp( i );
        if( !portlet ){
            continue;
        }
        if( data[ i ] == 't' ){ //t=portlet is hidden
          portlet.hide( CP.Overview.ADD_WIDGET_BTN_ID ); //hide portlet - minimize into the target button
      }
      else{ //show
          portlet.show();
      }
    }
},


manageMenuIcon: function(){
    var menuItemsArr = CP.Overview.menuItemsArr;
    for( var i in menuItemsArr ){
        var menuItem = Ext.getCmp( i );
        if( !menuItem ){
            continue;
        }
        if( menuItemsArr[ i ] == 't' ){ //hide icon
            menuItem.setIconCls( 'overview-no-icon' );
        }
        else{ //show
            menuItem.setIconCls( 'overview-menu-icon' );
        }
    }
},

/********** blades *****************/

initBladesTable:function()
{

        this.blades_table = {
//                           0          1         2              3          4             5             6
//             xml name : [index,printed name, image item, fields item, chart item, enable image, disable image ]
                 'fw':   [1,'Firewall','fw1_o_title','fw1_o_image','fw1_o_fields','fw1_o_chart','fw-on','fw-off']
                ,'vpn':  [2,'IPSec VPN','vpn_o_title','vpn_o_image','vpn_o_fields','vpn_o_chart','vpn-on','vpn-off']
                ,'ips':  [3,'IPS','ips_o_title','ips_o_image','ips_o_fields','ips_o_chart','ips-on','ips-off']
                ,'av':   [4,'Anti-Virus','av_o_title','av_o_image','av_o_fields','av_o_chart','av-on','av-off']
                ,'urlf': [5,'URL Filtering','urlf_o_title','urlf_o_image','urlf_o_fields','urlf_o_chart','urlf-on','urlf-off']
                ,'aspm': [6,'Anti-Spam and Mail','aspm_o_title','aspm_o_image','aspm_o_fields','aspm_o_chart','aspm-on','aspm-off']
                ,'dlp':  [7,'Data Loss Prevention','dlp_o_title','dlp_o_image','dlp_o_fields','dlp_o_chart','dlp-on','dlp-off']
                ,'appi': [8,'Application Control','appi_o_title','appi_o_image','appi_o_fields','appi_o_chart','app_cont-on','app_cont-off']
                ,'anti_bot': [9,'Anti-Bot','anti_bot_o_title','anti_bot_o_image','anti_bot_o_fields','anti_bot_o_chart','anti_bot-on','anti_bot-off']
                ,'cvpn': [10,'Mobile Access','ma_o_title','ma_o_image','ma_o_fields','ma_o_chart','ma-on','ma-off']
                ,'ThreatEmulation': [11,'Threat Emulation','te_o_title','te_o_image','te_o_fields','te_o_chart','te-on','te-off']
                ,'Scrub': [12,'Threat Extraction','tx_o_title','tx_o_image','tx_o_fields','tx_o_chart','tx-on','tx-off']
       };


},

setBladeItems:function(blade_data,blade_params){

        var bladeName= blade_params[1];
        var bladeImageItem=blade_params[3];
        var blade_image=Ext.getCmp(bladeImageItem);
        var bladeTitleItem=blade_params[2];
        var blade_title=Ext.getCmp(bladeTitleItem);
        blade_title.setText(bladeName);
        var bladeImage;
        if (blade_data.is_enabled == 1)
        {
                var bladeFieldsItem=blade_params[4];
                var bladeChartsItem=blade_params[5];
                bladeImage=blade_params[6];
                if (blade_data.fields )
                {
                        var fields_text = [];
                        var have_fields = 0;
                        for ( var lable in blade_data.fields)
                        {
                                have_fields = 1;
                                var field_to_add = {
                                    xtype: 'displayfield',
                                    fieldLabel: lable,
                                    value: blade_data.fields[lable]
                                };
                                fields_text.push(field_to_add);
                        }
                        if (have_fields == 1)
                        {
                                blade_fields=Ext.getCmp(bladeFieldsItem);
                                blade_fields.removeAll();
                                blade_fields.add(fields_text); 
                        }
                }
        }
        else
        {
                bladeImage=blade_params[7]
        }
        if (blade_image)
        {
		blade_image.removeCls(blade_params[6],blade_params[7]);
		blade_image.addCls(bladeImage);
        }
},

    setSummary: function() {
        // reset all blades summery as disabled
	Ext.Object.each(CP.Overview.blades_table, function(key, value, object){
		CP.Overview.setBladeItems({is_enabled:0},value);
		return true;
	});

	// get summery off available blades
	var successSummaryCallback =
            function(response) {
                var blades_table = CP.Overview.blades_table;
                var jsonData = Ext.decode(response.responseText);
                if (jsonData.data) {
                    if (jsonData.data.blades) {
                        for (i = 0; i < jsonData.data.blades.length; i++) {
                            if (blades_table[jsonData.data.blades[i].name]) {
                                blade_params = blades_table[jsonData.data.blades[i].name];
                                CP.Overview.setBladeItems(jsonData.data.blades[i], blade_params)
                            }
                        }
                    }
                Ext.getCmp(CP.Overview.BLADES_CONTAINER_ID).doLayout();
                }
            };
        CP.Overview.SUMMARY_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/blades-summary.tcl', 'GET', successSummaryCallback, 15);
        Ext.TaskManager.start(CP.Overview.SUMMARY_UPDATE_TASK);
    }
 
}
 
