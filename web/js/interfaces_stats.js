CP.InterfacesMonitor = {

	REFRESH_RATE: 10000 // in milliseconds
	,setIntervalId: null
	,static_interface_store_init: false
	
	,init: function(){		
		CP.InterfacesMonitor.defineStores();
		var panel = CP.InterfacesMonitor.monitorPanel();
		
		//create page object
		var page = {
			title: 'Interfaces Monitor'
			,params: {}
			,panel: panel
			,submit : false
		};

		// Ask the infrastructure to load this page
		CP.UI.updateDataPanel(page, CP.global.monitor);
		
		if(Ext.getCmp("checkbox_refresh").getValue() == true) {
			CP.InterfacesMonitor.setIntervalId = window.setInterval(function() {
				Ext.getStore("intfs").load();
			}, CP.InterfacesMonitor.REFRESH_RATE);
		}
	}

	//defineStores
	,defineStores : function() {
		var reader = new Ext.data.JsonReader({
			root: 'data.interfaces'
			,idProperty: 'name'
			//,totalProperty: 'total'
		});

		var intfStore = Ext.create( 'CP.WebUI4.ArrayStore',{
			storeId: 'static_interface_store',
			fields: ['name'],
			proxy: {
			type: 'memory',
			reader: {
				type: 'array',
				successProperty: 'success'
			}}
		});

		var store = Ext.create('CP.WebUI4.Store', {
			storeId: 'intfs'
			,autoSave: false
			,proxy: {
				type: "ajax"
				,url: "/cgi-bin/interfaces_stats.tcl"
				,reader: reader
			}
			,listeners: {
				load: function(store,records,options) {
					Ext.getCmp("label_last_refresh").setText("Last refresh: " + (new Date()));
					CP.InterfacesMonitor.filterStore();
					if (CP.InterfacesMonitor.static_interface_store_init==false) {
						intfStore.removeAll();
						for (var i=0;i<store.data.getCount();i++) {
							intfStore.add([[store.getAt(i).data.name]]);
						}
						CP.InterfacesMonitor.static_interface_store_init=true;
					}
				}
			}
			,fields: [
				{name: 'name'},
				{name: 'state'},
				{name: 'link_state'},
				{name: 'type'},
				{name: 'comment'},
				{name: 'lname'},
				{name: 'v4Addr'},
				{name: 'v4Mask'},
				{name: 'depend_on'},
				{name: 'Rbytes'},
				{name: 'Rpackets'},
				{name: 'Rerrors'},
				{name: 'Rdrop'},
				{name: 'Rfifo'},
				{name: 'Rframe'},
				{name: 'Rcompressed'},
				{name: 'Rmulticast'},
				{name: 'Tbytes'},
				{name: 'Tpackets'},
				{name: 'Terrors'},
				{name: 'Tdrop'},
				{name: 'Tfifo'},
				{name: 'Tcolls'},
				{name: 'Tcarrier'},
				{name: 'Tcompressed'}
			]
			//,groupField:'depend_on'
			//,sortInfo: { field: 'name', direction: 'ASC' }
		});
	}
	
	//monitorPanel
    ,monitorPanel : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id : "interfaces_monitorPanel"
			,listeners: {
				destroy: function() {
					clearInterval(CP.InterfacesMonitor.setIntervalId);
				}
			}
            ,items : [
				{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Network Interfaces Monitor"
					,disable: function() {
						//don't disable because there is no config lock
					}
                },{
					xtype:"cp4_checkbox"
					,disable: function() {
						//don't disable because there is no config lock
					}
					,checked: false
					,fieldLabel: ""
					,margin: '20 0 20 0'
					,hideLabel: false
					,boxLabel: ("Refresh data every " + (CP.InterfacesMonitor.REFRESH_RATE/1000) + " seconds")
					,id: "checkbox_refresh"
					,name: "checkbox_refresh"
					,listeners: {
						change: function(rb, newVal, oldVal, opt) {
							if(newVal == true) {
								// Start reloading the data every REFRESH_RATE milliseconds
								CP.InterfacesMonitor.setIntervalId = window.setInterval(function() {
									Ext.getStore("intfs").load();
								}, CP.InterfacesMonitor.REFRESH_RATE);
							} else {
								// Stop the repeating reloading of data
								clearInterval(CP.InterfacesMonitor.setIntervalId);
							}
						}
					}
				},{
                    xtype       : "cp4_btnsbar"
                    ,items      : [
                        {
                            text        : "Refresh"
                            ,disable    : function() {}
                            ,handler : function(b, e) {
                                var store = Ext.getStore("intfs");
                                if(store) {
                                    store.load();
                                }
                            }
                        },{
                            text        : "Advanced View"
                            ,disable    : function() {}
                            ,handler : function(b, e) {
								// Switch between Basic view and Advanced view (hide/show some of the columns of the monitor grid)
								if(this.text == "Advanced View") {
									this.setText("Basic View");
								} else {
									this.setText("Advanced View");
								}

								var GridColumns = Ext.getCmp("monitor_grid").columns;
								
								for(var i = 0;i < GridColumns.length;i++) {
									if(GridColumns[i].advanceViewOnly == true) {
										GridColumns[i].setVisible(!GridColumns[i].isVisible());
									}
								}
                            }
                        }
                    ]
                },{
					xtype: "cp4_label"
					,text: "Last refresh: N/A"
					,id: "label_last_refresh"
					,disable: function() {
						//don't disable because there is no config lock
					}
				}
                ,CP.InterfacesMonitor.get_grid()
				,CP.InterfacesMonitor.filterPanel()
            ]
        });

        return monitorPanel;
    }
	
	//filterPanel
	,filterPanel : function()
	{
		var filterPanel = {
			xtype: "cp4_panel"
			,items: [
				{
					xtype: "cp4_label"
					,text: "Filters:"
					,disable: function() {
						//don't disable because there is no config lock
					}
				},{
					xtype: "cp4_combobox"
					,fieldLabel: "Interface name"
					,editable: false
					,id: "combobox_interface_filter"
					,name: "combobox_interface_filter"
					,displayField: "name"
					,valueField: "name"
					,disable: function() {
						//don't disable because there is no config lock
					}
					,value: ""
					,store: Ext.getStore("static_interface_store")
					,listConfig: {
                        loadingText: null,
                        loadMask: false
                    } 
				},{
					xtype: "cp4_combobox"
					,fieldLabel: "Type"
					,editable: false
					,id: "combobox_type_filter"
					,name: "combobox_type_filter"
					,disable: function() {
						//don't disable because there is no config lock
					}
					,value: "all"
					,store: [
						["all", "All"], 
						["ethernet", "Ethernet"], 
						["alias", "Alias"], 
						["vlan", "VLAN"], 
						["loopback", "Loopback"], 
						["bond", "Bond"], 
						["bridge", "Bridge"], 
						["vpnt", "VPN Tunnel"], 
						["pppoe", "PPPoE"], 
						["6in4", "6in4 Tunnel"], 
						["6to4", "6to4 Tunnel"], 
						["gre", "GRE Tunnel"]
					]
				},{
					xtype: "cp4_button"
					,text: "Filter"
					,margin: '0 10 0 0'
					,disable: function() {
						//don't disable because there is no config lock
					}
					,handler: function(b, e) {
						CP.InterfacesMonitor.filterStore();
					}
				},{
					xtype: "cp4_button"
					,text: "Clear Selections"
					,disable: function() {
						//don't disable because there is no config lock
					}
					,handler: function(b, e) {
						Ext.getCmp("combobox_interface_filter").setValue("");
						Ext.getCmp("combobox_interface_filter").applyEmptyText();
						//Ext.getCmp("combobox_interface_filter").getPicker().getSelectionModel().doMultiSelect([], false);
						Ext.getCmp("combobox_type_filter").setValue("all");
					}
				}
			]
		};
		
		return filterPanel;
	}
	
	// Filter the store by the filter parameters set by the user
	,filterStore: function() {
		Ext.getStore("intfs").filterBy(function(record, id) {
			var interfaceNameFilter = Ext.getCmp("combobox_interface_filter").getValue();
			var linkTypeFilter = Ext.getCmp("combobox_type_filter").getValue();
			var recordName = record.get("name");
			var recordType = record.get("type");

			// Handle additional loopback devices (listed as -aux- type)
			if(linkTypeFilter == 'loopback' && recordType == 'aux' && recordName.substr(0,4) == 'loop')
			{
				recordType = 'loopback';
			}
			
			if(interfaceNameFilter != "" && interfaceNameFilter != recordName)
			{
				return false;
			}
			if(linkTypeFilter != "all" && recordType != linkTypeFilter)
			{
				return false;
			}
			
			return true;
		});
	}
	
	// Prepare and return the grid
	,get_grid : function() {
        var grid_cm = [
		{
			header: "Name"
			,dataIndex: "name"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Type"
			,dataIndex: "type"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,renderer: CP.InterfacesMonitor.showType
		},{
			header: "Comment"
			,dataIndex: "comment"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		} /*,{
			header: "IPv4 Address"
			,dataIndex: "v4Addr"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: (CP.global.formatNotation == 'Length' ? "Mask Length" : "Subnet Mask")
			,dataIndex: "v4Mask"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,renderer: CP.util.showSubnetMask_Length
		},{
			header: "Member of"
			,dataIndex: "depend_on"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		}*/,{
			header: "Rbytes"
			,dataIndex: "Rbytes"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Rpackets"
			,dataIndex: "Rpackets"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Rerrors"
			,dataIndex: "Rerrors"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Rdrop"
			,dataIndex: "Rdrop"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Rfifo"
			,dataIndex: "Rfifo"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Rframe"
			,dataIndex: "Rframe"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Rcompressed"
			,dataIndex: "Rcompressed"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Rmulticast"
			,dataIndex: "Rmulticast"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Tbytes"
			,dataIndex: "Tbytes"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Tpackets"
			,dataIndex: "Tpackets"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Terrors"
			,dataIndex: "Terrors"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Tdrop"
			,dataIndex: "Tdrop"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
		},{
			header: "Tfifo"
			,dataIndex: "Tfifo"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Tcolls"
			,dataIndex: "Tcolls"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Tcarrier"
			,dataIndex: "Tcarrier"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		},{
			header: "Tcompressed"
			,dataIndex: "Tcompressed"
			,width: 125
			,menuDisabled: true
			,hideable: false
			,groupable: false
			,sortable: true
			,hidden: true
			,advanceViewOnly : true
		}
        ];

        return Ext.create('CP.WebUI4.GridPanel', {
            xtype: "cp4_grid"
			,id: "monitor_grid"
			,name: "monitor_grid"
            ,height: 350
			,autoScroll: true
            ,store: Ext.getStore("intfs")
            ,columns: grid_cm
        });
    }
	
	// Renderer for the "Type" field in the grid
	,showType: function( type ){
        var text = 'unknown';
        var cls = '';
        switch( type ){
            case 'ethernet':
                text = 'Ethernet';
                cls = 'grid_icon_ethernet';
            break;
            case 'alias':
                text = 'Alias';
                cls = 'grid_icon_alias';
            break;
            case 'vlan':
                text = 'VLAN';
                cls = 'grid_icon_vlan';
            break;
            case 'aux':
            case 'loopback':
                text = 'Loopback';
                cls = 'grid_icon_loopback';
            break;
            case 'bond':
                text = 'Bond';
                cls = 'grid_icon_bond';
            break;
            case 'bridge':
                text = 'Bridge';
                cls = 'grid_icon_bridge';
            break;
            //grid_icon_dialer
            case 'vpnt':
                text = 'VPN-Tunnel';
                cls = 'grid_icon_vpnt';
            break;
            case 'pppoe':
                text = 'PPPoE';
                cls = 'grid_icon_pppoe';
            break;
            case '6in4':
                text = '6in4 Tunnel';
                cls = 'grid_icon_6in4';
            break;
            case '6to4':
                text = '6to4 Tunnel';
                cls = 'grid_icon_vpnt';
            break;
            case 'gre':
                text = 'GRE';
                cls = 'grid_icon_gre';
            break;
            default:
                text = 'unknown';
                cls = '';
            break;
        }
        if( cls == '' ){
            return text;
        }
        else{
            return '<div class="'+ cls +'">'+ text +'</div>';
        }
     }
}