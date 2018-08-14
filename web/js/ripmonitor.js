CP.rip_mon_4 = {
    GRID_HEIGHT         : 425

    ,init               : function() {
        CP.rip_mon_4.defineStores();
        var rip_monitorPanel = CP.rip_mon_4.monitorPanel();
        var obj = {
            panel   : rip_monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("rip_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//stores
    ,defineStores       : function() {
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/ripmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"        : "enabled"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                }
            }
            
            ,doAutoRefresh : function(store, sentAutomatically) {
                var url = Ext.urlAppend(store.proxy.url, Ext.Object.toQueryString(store.proxy.extraParams));
                CP.util.doAutoRequestRunnable(
                    url, 
                    'GET',
                    store.autoRefreshSuccess,
                    sentAutomatically);
            }
            
            ,autoRefreshSuccess : function (jsonResult) {
                var panel = Ext.getCmp("rip_monitorPanel");
                if (panel) {
                    var d = null;
                    var rip_on = false;
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data) {
                        d = jsonData.data;
                        rip_on = (d.rip_enabled) ? true : false;
                    }
                    
                    panel.loadRecord(jsonData);
                        
                    function safeLoadStore(storeId, data, key) {
                        var st = Ext.getStore( storeId );
                        if (st) {
                            if (data && data[key]) {
                                st.loadData(data[key]);
                            } else {
                                st.removeAll();
                            }
                        }
                    }

                    safeLoadStore("rip_monitor_store_error", d, "errorfields_list");
                    safeLoadStore("rip_monitor_store_packets", d, "packetfields_list");
                    safeLoadStore("rip_monitor_store_interfaces", d, "interface_list");
                    safeLoadStore("rip_monitor_store_neighbor", d, "neighbor_list");

                    var content_set = Ext.getCmp("rip_monitor_set_content");
                    var disable_set = Ext.getCmp("rip_monitor_set_disabled");
                    
                    if (content_set) {
                        content_set.setVisible(rip_on);
                        content_set.setDisabled(!rip_on);
                    }
                    
                    if (disable_set) {
                        disable_set.setVisible(!rip_on);
                        disable_set.setDisabled(rip_on);
                    }
                }
            }                        
        });        
        
        
        function sortType_ipv4(rawValue) {
            var value = String(rawValue);
            if(value.indexOf(".") == -1) {
                return 4294967296; //1 more than 255.255.255.255
            }
            var o = value.split(".");
            var v = 0;
            var i;
            for(i = 0; i < 4; i++) {
                v = v * 256;
                if(o[i] && !isNaN( o[i] ) ) {
                    v += parseInt(o[i], 10);
                } else {
                    v += 255;
                }
            }
            return v;
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_store_main"
            ,fields     : [
                "row"
                ,"monitorfield"
                ,"displayfield"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/ripmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "global"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.monitorfields"
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_store_error"
            ,autoLoad   : false
            ,fields     : [
                "row"
                ,"error_field"
                ,"error_value"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_store_packets"
            ,autoLoad   : false
            ,fields     : [
                "row"
                ,"packets_field"
                ,"packets_value"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_store_interfaces"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "interface"
                    ,sortType   : function(value) {
                        if(String(value).toLowerCase().indexOf("lo") == 0) {
                            return "zzz"+ String(value);
                        }
                        return String(value);
                    }
                },{
                    name        : "ipAddress"
                    ,sortType   : sortType_ipv4
                },{
                    name        : "version"
                    ,sortType   : function(value) {
                        return (String(value).toLowerCase() == "v1") ? 1 : 0;
                    }
                },{
                    name        : "verType"
                },{
                    name        : "updates"
                    ,sortType   : function(value) {
                        return (4 - value);
                    }
                },{
                    name        : "accept"
                    ,sortType   : function(value) {
                        return (String(value).toLowerCase() == "yes") ? 0 : 1;
                    }
                },{
                    name        : "send"
                    ,sortType   : function(value) {
                        return (String(value).toLowerCase() == "yes") ? 0 : 1;
                    }
                },{
                    name        : "auth_type"
                    ,sortType   : function(value) {
                        switch( String(value).toLowerCase() ) {
                            case "null":    return 0;
                            case "simple":  return 1;
                            case "md5":     return 2;
                            default:
                        }
                        return 3;
                    }
                },{
                    name        : "metric"
                    ,sortType   : function(value) { return parseInt(value, 10); }
                },{
                    name        : "sent"
                    ,sortType   : function(value) { return parseInt(value, 10); }
                },{
                    name        : "received"
                    ,sortType   : function(value) { return parseInt(value, 10); }
                },{
                    name        : "errors"
                    ,sortType   : function(value) { return parseInt(value, 10); }
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [
                {property: "interface", direction: "ASC"}
            ]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_monitor_store_neighbor"
            ,autoLoad   : false
            ,fields     : [
                "row"
                ,{
                    name        : "neighbor"
                    ,sortType   : sortType_ipv4
                }
                ,"interfaceName"
                ,{
                    name        : "interfaceAddr"
                    ,sortType   : sortType_ipv4
                }
                ,"ripVersion"   //use a renderer to throw the "v" in
                ,"ripVerType"
                ,"routes"
                ,"activeRts"
                ,"badPkts"
                ,"badRts"
                ,"auth"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [
                {property: "interfaceName", direction: "ASC"}
                ,{property: "row", direction: "ASC"}
            ]
        });
    }

    ,monitorPanel       : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "rip_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.rip_mon_4.doLoad
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "RIP Monitor"
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "rip_mon_btnsbar"
                    ,items      : [
                        {
                            text        : "Reload"
                            ,id         : "rip_mon_btn_reload"
                            ,disable    : function() {}
                            ,setDisabled: function(d) {
                                var b = this;
                                if (b.disabled) {
                                    b.enable();
                                }
                            }
                            ,handler    : function(b, e) {
                                CP.rip_mon_4.doReload();
                            }
                        }
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "rip_monitor_set_content"
                    ,hidden : true
                    ,items  : [
                        CP.rip_mon_4.get_monitor_field_set()
                        ,{
                            xtype   : "cp4_formpanel"
                            ,layout : {
                                type    : "hbox"
                            }
                            ,defaults   : {
                                width   : 225
                                ,margin : "0 15 0 0"
                            }
                            ,items  : [
                                CP.rip_mon_4.get_error_set()
                                ,CP.rip_mon_4.get_packets_set()
                                ,CP.rip_mon_4.get_summary_set()
                            ]
                        }
                        ,CP.rip_mon_4.get_interfaces_set()
                        ,CP.rip_mon_4.get_neighbors_set()
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "rip_monitor_set_disabled"
                    ,hidden : true
                    ,items  : [
                        {
                            xtype       : "cp4_label"
                            ,html       : "RIP is inactive.<br /><br />"
                        }
                    ]
                }
            ]
        });
        return monitorPanel;
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.rip_mon_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.rip_mon_4.autoRefreshCallback(false);
    }        
    
    ,get_monitor_field_set  : function() {
        var main_cm = [
            {
                header          : "Information"
                ,dataIndex      : "row"
                ,width          : 150
                ,menuDisabled   : true
                ,sortable       : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(rec.data.displayfield);
                }
            }
        ];

        var main_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                select      : function(RowModel, rec, index, eOpts) {
                    main_selection_change(rec, "show");
                }
                ,deselect   : function(RowModel, rec, index, eOpts) {
                    main_selection_change(rec, "hide");
                }
            }
        });

        function main_selection_change(rec, change) {
            var field = rec.data.monitorfield.toLowerCase();
            var mon_set = Ext.getCmp("rip_monitor_set_"+ field);
            if(mon_set) {
                mon_set.setVisible( (change == "show") );
            }
            //field might equal:
                //"error"
                //"packets"
        }

        var main_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_monitor_main_grid"
            ,width              : 150
            ,height             : 130
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("rip_monitor_store_main")
            ,columns            : main_cm
            ,selModel           : main_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,margin     : 0
            ,padding    : 0
            ,items      : [
                main_grid
            ]
        };
    }

    ,get_summary_set        : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_monitor_set_summary"
            ,width      : 350
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Summary"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,autoScroll : false
                    ,defaults   : {
                        xtype       : "cp4_displayfield"
                        ,fieldStyle : "text-align:right;width:95px;"
                        ,labelWidth : 250
                        ,width      : 350
                        ,height     : 22
                        ,disable    : function() { }
                        ,setDisabled: function(d) {
                            var c = this;
                            if (c.disabled) { c.enable(); }
                        }
                    }
                    ,items      : [
                        {
                            fieldLabel  : "Update Interval"
                            ,name       : "rip_mon_update_interval"
                        },{
                            fieldLabel  : "Expire Interval"
                            ,name       : "rip_mon_expire_interval"
                        },{
                            fieldLabel  : "Next Update In"
                            ,name       : "rip_mon_next_update"
                        },{
                            fieldLabel  : "Total Packets Sent"
                            ,name       : "rip_mon_packets_sent"
                        },{
                            fieldLabel  : "Total Packets Received"
                            ,name       : "rip_mon_packets_received"
                        },{
                            fieldLabel  : "Number of Active Interfaces"
                            ,name       : "rip_mon_num_active_intf"
                        },{
                            fieldLabel  : "Number of Interfaces Running RIPv2"
                            ,name       : "rip_mon_num_rip2_intf"
                        },{
                            fieldLabel  : "Default Metric for Routes Redistributed to RIP"
                            ,name       : "rip_mon_default_metric_for_rr"
                        },{
                            fieldLabel  : "Auto Summary"
                            ,name       : "rip_mon_autosummary"
                            ,margin     : 0
                        }
                    ]
                }
            ]
        };
    }

    ,get_error_set          : function() {
        var error_cm = [
            {
                header          : "Field"
                ,dataIndex      : "row"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    return CP.ar_util.rendererSpecific(
                        rec.data.error_field
                        ,rec.data.error_field +": "+ rec.data.error_value
                    );
                }
            },{
                header          : "Value"
                ,dataIndex      : "error_value"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    return CP.ar_util.rendererSpecific(
                        value
                        ,rec.data.error_field +": "+ rec.data.error_value
                        ,"right"
                    );
                }
            }
        ];

        var error_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_monitor_error_grid"
            ,width              : 225
            ,height             : CP.rip_mon_4.GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("rip_monitor_store_error")
            ,columns            : error_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_monitor_set_error"
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Errors"
                }
                ,error_grid
            ]
        };
    }

    ,get_packets_set        : function() {
        var packets_cm = [
            {
                header          : "Field"
                ,dataIndex      : "row"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    return CP.ar_util.rendererSpecific(
                        rec.data.packets_field
                        ,rec.data.packets_field +": "+ rec.data.packets_value
                    );
                }
            },{
                header          : "Value"
                ,dataIndex      : "packets_value"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    return CP.ar_util.rendererSpecific(
                        value
                        ,rec.data.packets_field +": "+ rec.data.packets_value
                        ,"right"
                    );
                }
            }
        ];

        var packets_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_monitor_packets_grid"
            ,width              : 225
            ,height             : CP.rip_mon_4.GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("rip_monitor_store_packets")
            ,columns            : packets_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_monitor_set_packet"
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Packets"
                }
                ,packets_grid
            ]
        };
    }

    ,get_interfaces_set     : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "interface"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data["interface"] == rec.data["interface"]) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "IP Address"
                ,dataIndex      : "ipAddress"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Version"
                ,dataIndex      : "version"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (value) {
                        retValue = String(value);
                        if (rec.data.verType) {
                            retValue += " ("+ String(rec.data.verType) +")";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
            ,{
                text            : "Updates"
                ,dataIndex      : "updates"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "None";
                    switch(value) {
                        case 3:
                            retValue = "Accept / Send";
                            break;
                        case 2:
                            retValue = "Send";
                            break;
                        case 1:
                            retValue = "Accept";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
            /*
            ,{
                text            : "Accept"
                ,dataIndex      : "accept"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Send"
                ,dataIndex      : "send"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
            /* */
            ,{
                text            : "Auth Type"
                ,dataIndex      : "auth_type"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Metric"
                ,dataIndex      : "metric"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Sent"
                ,dataIndex      : "sent"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Received"
                ,dataIndex      : "received"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Errors"
                ,dataIndex      : "errors"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_monitor_interfaces_grid"
            ,width              : 790
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("rip_monitor_store_interfaces")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_monitor_set_interface"
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                }
                ,{ xtype: "cp4_formpanel", margin: 0, autoScroll: true, items: [ grid ] }
            ]
        };
    }

    ,get_neighbors_set      : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "interfaceName"
                ,width          : 175
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "None";
                    var color = "black";
                    if (rec.data.interfaceName) {
                        retValue = String(rec.data.interfaceName);
                        if (rec.data.interfaceAddr) {
                            retValue += " ("+ String(rec.data.interfaceAddr) +")";
                        }
                        if(row > 0) {
                            var p_rec = st.getAt(row - 1);
                            if(p_rec.data.interfaceName == rec.data.interfaceName) {
                                color = "grey";
                            }
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Neighbor"
                ,dataIndex      : "row"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.neighbor;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Version"
                ,dataIndex      : "ripVersion"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(value != "") {
                        retValue = "v"+ String(value);
                        if (rec.data.ripVerType) {
                            retValue += " ("+ String(rec.data.ripVerType) +")";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Routes"
                ,dataIndex      : "routes"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Active Routes"
                ,dataIndex      : "activeRts"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Bad Packets"
                ,dataIndex      : "badPkts"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Bad Routes"
                ,dataIndex      : "badRts"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Authentication"
                ,dataIndex      : "auth"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_monitor_neighbor_grid"
            ,width              : 900
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "rip_monitor_store_neighbor"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_monitor_set_neighbor"
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Neighbors"
                }
                ,{ xtype: "cp4_formpanel", margin: 0, autoScroll: true, items: [ grid ] }
            ]
        };
    }
}

