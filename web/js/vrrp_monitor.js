CP.vrrp_monitor_4 = {
    init                    : function() {
        CP.vrrp_monitor_4.defineStores();
        var vrrp_monitorPanel = CP.vrrp_monitor_4.monitorPanel();

        var obj = {
            panel   : vrrp_monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("vrrp_monitor_main_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
        
        var store = Ext.getStore("vrrp_monitor_summary_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
        
        var store = Ext.getStore("vrrp_monitor_interface_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }

        var store = Ext.getStore("vrrp_monitor_stat_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//defineStores
    ,defineStores           : function() {
        //vrrp_monitor_main_store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp_monitor_main_store"
            ,autoLoad   : false
            ,fields     : [
                "monitorfield"
                ,"cnt"
            ]
            
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/vrrp_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,reader : {
                    type    : "json"
                    ,root   : "data.monitorfields"
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
                var store = Ext.getStore("vrrp_monitor_main_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.monitorfields) {
                        store.loadData(jsonData.data.monitorfields);
                    } 
                }
            }                                    
        });

        //vrrp_monitor_summary_store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp_monitor_summary_store"
            ,autoLoad   : false
            ,fields     : [
                "summary_field"
                ,"summary_value"
                ,"cnt"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/vrrp_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                   ,"option"        : "vrrpsummary"
                }                        
                ,reader : {
                    type    : "json"
                    ,root   : "data.vrrpsummary"
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
                var store = Ext.getStore("vrrp_monitor_summary_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.vrrpsummary) {
                        store.loadData(jsonData.data.vrrpsummary);
                    } 
                }
            }                                    
            
            ,sorters    :   [{property: "cnt", direction: "ASC"}]
        });

        //vrrp_monitor_interface_store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp_monitor_interface_store"
            ,autoLoad   : false
            ,fields     : [
                "intf_cnt"
                ,"intf_intf"
                ,{
                    name        : "intf_vrid"
                    ,sortType   : function(value) {
                        if (value == "-") {
                            return 0;
                        }
                        return value;
                    }
                }
                ,"intf_na"
                ,"intf_label"
                ,"intf_value"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/vrrp_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                   ,"option"        : "vrrpinterface"
                }                                                
                ,reader : {
                    type    : "json"
                    ,root   : "data.vrrpinterface"
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
                var store = Ext.getStore("vrrp_monitor_interface_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.vrrpinterface) {
                        store.loadData(jsonData.data.vrrpinterface);
                        var grid = Ext.getCmp("vrrp_monitor_interface_grid");
                        if (grid) {
                            grid.getSelectionModel().select(0);
                        }
                    } 
                }
            }                                    
        });

        //vrrp_monitor_stat_store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp_monitor_stat_store"
            ,autoLoad   : false
            ,fields     : [
                "stats_cnt"
                ,"stats_cnt2"
                ,"stats_intf"
                ,{
                    name        : "stats_vrid"
                    ,sortType   : function(value) {
                        if (value == "-") {
                            return 0;
                        }
                        return value;
                    }
                }
                ,"stats_label"
                ,"stats_value"
                ,"stats_label2"
                ,"stats_value2"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/vrrp_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                   ,"option"        : "vrrpstats"
                }                                                
                ,reader : {
                    type    : "json"
                    ,root   : "data.vrrpstats"
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
                var store = Ext.getStore("vrrp_monitor_stat_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.vrrpstats) {
                        store.loadData(jsonData.data.vrrpstats);
                        var grid = Ext.getCmp("vrrp_monitor_stat_grid");
                        if (grid) {
                            grid.getSelectionModel().select(0);
                        }
                    } 
                }
            }                                    
        });
    } //define stores

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "vrrp_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    CP.vrrp_monitor_4.mP_afterrender();
                    CP.vrrp_monitor_4.doLoad();
                }
            }
            ,items      : [
                CP.vrrp_monitor_4.get_monitor_field_set()
                ,CP.vrrp_monitor_4.get_summary_set()
                ,CP.vrrp_monitor_4.get_interface_set()
                ,CP.vrrp_monitor_4.get_stat_set()
            ]
        });

        return monitorPanel;
    }
    ,mP_afterrender         : function() {
        Ext.getCmp("vrrp_monitor_summary_set").setVisible(false);
        Ext.getCmp("vrrp_monitor_interface_set").setVisible(false);
        Ext.getCmp("vrrp_monitor_stat_set").setVisible(false);
    }
    
    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.vrrp_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.vrrp_monitor_4.autoRefreshCallback(false);
    }        
        
//get_monitor_field_set
    ,get_monitor_field_set      : function() {
        var main_cm = [
            {
                text            : "Information"
                ,dataIndex      : "cnt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.monitorfield;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }
        ];

        var main_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                select      : function(RowModel, rec, index, eOpts) {
                    var field = rec.data.monitorfield.toLowerCase();
                    switch(field) {
                        case "summary":
                                CP.vrrp_monitor_4.change_summary("show");
                            break;
                        case "interface":
                                CP.vrrp_monitor_4.change_interface("show");
                            break;
                        case "statistics":
                                CP.vrrp_monitor_4.change_stat("show");
                    }
                }
                ,deselect   : function(RowModel, rec, index, eOpts) {
                    var field = rec.data.monitorfield.toLowerCase();
                    switch(field) {
                        case "summary":
                                CP.vrrp_monitor_4.change_summary("hide");
                            break;
                        case "interface":
                                CP.vrrp_monitor_4.change_interface("hide");
                            break;
                        case "statistics":
                                CP.vrrp_monitor_4.change_stat("hide");
                    }
                }
            }
        });

        var monitor_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp_monitor_main_grid"
            ,width              : 150
            ,height             : 90
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 20 0 0"
            ,store              : Ext.getStore("vrrp_monitor_main_store")
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
            ,id         : "vrrp_monitor_field_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Monitor"
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,margin     : 0
                    ,items      : [
                        monitor_grid
                        ,{
                            xtype       : "cp4_button"
                            ,text       : "Reload"
                            ,id         : "vrrp_mon_btn_reload"
                            ,disabled   : false
                            ,disable    : function() {
                                //overwrite default disable function
                            }
                            ,setDisabled: function(d) {
                                var c = this;
                                if (c && c.enable) {
                                    c.enable();
                                }
                            }
                            ,handler    : function(b, e) {
                                CP.vrrp_monitor_4.doReload();
                            }
                            ,listeners  : {
                                disable     : function(c, eOpts) {
                                    c.setDisabled( false );
                                }
                            }
                        }
                    ]
                }
            ]
        };
    }

//summary stuff
    ,change_summary         : function(change) {
        Ext.getCmp("vrrp_monitor_summary_set").setVisible( (change == "show") );
    }
    ,get_summary_set        : function() {
        var summary_cm = [
            {
                text            : "Description"
                ,dataIndex      : "cnt"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.summary_field;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Value"
                ,dataIndex      : "summary_value"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retVal = String(value).replace(",", ", ");
                    retVal = retVal.replace("  ", " ");
                    return CP.ar_util.rendererGeneric(retVal);
                }
            }
        ];

        var summary_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp_monitor_summary_grid"
            ,width              : 400
            ,height             : 200
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("vrrp_monitor_summary_store")
            ,columns            : summary_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp_monitor_summary_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Summary"
                }
                ,summary_grid
            ]
        };
    }

//interface stuff
    ,change_interface       : function(change) {
        Ext.getCmp("vrrp_monitor_interface_set").setVisible( (change == "show") );
    }
    ,get_interface_set      : function() {
        var interface_cm = [
            {
                text            : "Interface"
                ,width          : 125
                ,dataIndex      : "intf_intf"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.intf_intf == value) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Num Active"
                ,width          : 100
                ,dataIndex      : "intf_na"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.intf_na == value) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "VRID"
                ,width          : 50
                ,dataIndex      : "intf_vrid"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.intf_vrid == value) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            }

            ,{
                text            : "Description"
                ,flex           : 5
                ,dataIndex      : "intf_cnt"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.intf_label;
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.intf_cnt == rec.data.intf_cnt) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Value"
                ,flex           : 5
                ,dataIndex      : "intf_value"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retVal = String(value).replace(",", ", ");
                    retVal = retVal.replace("  ", " ");
                    return CP.ar_util.rendererGeneric(retVal);
                }
            }
        ];

        var interface_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp_monitor_interface_grid"
            ,width              : 600
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("vrrp_monitor_interface_store")
            ,columns            : interface_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp_monitor_interface_set"
            ,listeners  : {
                show        : function() {
                    var g = Ext.getCmp("vrrp_monitor_interface_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Interfaces"
                }
                ,interface_grid
                ,{ xtype: "tbspacer", height: 15, width: 15 }
            ]
        };
    }

//stat stuff
    ,change_stat            : function(change) {
        Ext.getCmp("vrrp_monitor_stat_set").setVisible( (change == "show") );
    }
    ,get_stat_set           : function() {
        var stat_cm = [
            {
                text            : 'Interface'
                ,width          : 125
                ,dataIndex      : "stats_intf"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row>0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.stats_intf == rec.data.stats_intf) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : 'VRID'
                ,width          : 50
                ,dataIndex      : "stats_vrid"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row>0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.stats_vrid == rec.data.stats_vrid) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            }

            ,{
                text            : "Description"
                ,flex           : 5
                ,dataIndex      : "stats_cnt"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.stats_label;
                    var color = "black";
                    if (row>0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.stats_cnt == rec.data.stats_cnt) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Value"
                ,width          : 75
                ,dataIndex      : "stats_value"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retVal = String(value).replace(",", ", ");
                    retVal = retVal.replace("  ", " ");
                    return CP.ar_util.rendererGeneric(retVal);
                }
            }

            ,{
                text            : "Description"
                ,flex           : 5
                ,dataIndex      : "stats_cnt2"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.stats_label2;
                    var color = "black";
                    if (row>0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.stats_cnt == rec.data.stats_cnt) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Value"
                ,width          : 75
                ,dataIndex      : "stats_value2"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retVal = String(value).replace(",", ", ");
                    retVal = retVal.replace("  ", " ");
                    return CP.ar_util.rendererGeneric(retVal);
                }
            }
        ];

        var stat_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp_monitor_stat_grid"
            ,width              : 650
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("vrrp_monitor_stat_store")
            ,columns            : stat_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp_monitor_stat_set"
            ,listeners  : {
                show        : function() {
                    var g = Ext.getCmp("vrrp_monitor_stat_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Statistics"
                }
                ,stat_grid
                ,{ xtype: "tbspacer", height: 15, width: 15 }
            ]
        };
    }
}

