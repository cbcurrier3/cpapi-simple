CP.rdisc6_monitor_4 = {
    GRID_WIDTH          : 800
    ,GRID_HEIGHT        : 300

    ,GRID_FIELD_WIDTH   : 150
    ,GRID_VALUE_WIDTH   : 90

    ,init               : function() {
        CP.rdisc6_monitor_4.defineStores();
        var monitorPanel = CP.rdisc6_monitor_4.monitorPanel();
        var obj = {
            title           : "Router Discovery"
            ,panel          : monitorPanel
            ,submit         : false
            ,params         : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("rdisc6_monitor_summary_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
        
        var store = Ext.getStore("rdisc6_monitor_intf_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }

        var store = Ext.getStore("rdisc6_monitor_stat_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
   }

    ,defineStores       : function() {
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_monitor_summary_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc6monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"param"        : "summary"
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
                var panel = Ext.getCmp("rdisc6_monitorPanel");
                if (panel) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data) {
                        panel.loadRecord(jsonData);
                    } 
                } 
            }                        
        });        
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_monitor_intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"row"
                ,"rowTitle"
                ,"field0"
                ,"value0"
                ,"field1"
                ,"value1"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc6monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"param"        : "intf"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rdisc6_mon_intf"
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
                var store = Ext.getStore("rdisc6_monitor_intf_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.rdisc6_mon_intf) {
                        store.loadData(jsonData.data.rdisc6_mon_intf);
                    } 
                }
            }                        
            
            ,sorters    : [
                {
                    property    : "intf"
                    ,direction  : "ASC"
                },{
                    property    : "row"
                    ,direction  : "ASC"
                }
            ]
            ,groupField : "intf"
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_monitor_stat_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"row"
                ,"rowTitle"
                ,"field0"
                ,"value0"
                ,"field1"
                ,"value1"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc6monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"param"        : "stats"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rdisc6_mon_stat"
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
                var store = Ext.getStore("rdisc6_monitor_stat_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.rdisc6_mon_stat) {
                        store.loadData(jsonData.data.rdisc6_mon_stat);
                    } 
                }
            }                        
            
            ,sorters    : [
                {
                    property    : "intf"
                    ,direction  : "ASC"
                },{
                    property    : "row"
                    ,direction  : "ASC"
                }
            ]
            ,groupField : "intf"
        });
    }

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "rdisc6_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.rdisc6_monitor_4.doLoad
            }
            ,items      : [
                CP.rdisc6_monitor_4.get_reload_button()
                ,CP.rdisc6_monitor_4.get_summary_set()
                ,CP.rdisc6_monitor_4.get_interfaces_set()
                ,CP.rdisc6_monitor_4.get_statistics_set()
            ]
        });
        return monitorPanel;
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.rdisc6_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.rdisc6_monitor_4.autoRefreshCallback(false);
    }        
    
    ,get_reload_button      : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Router Discovery Monitor"
            },{
                xtype       : "cp4_btnsbar"
                ,items      : [
                    {
                        text        : "Reload"
                        ,disable    : function() { }
                        ,setDisabled: function(d) {
                            var b = this;
                            if (b.disabled && b.enable) {
                                b.enable();
                            }
                        }
                        ,handler    : function(b, e) {
                            CP.rdisc6_monitor_4.doReload();
                        }
                    }
                ]
            }
        ];
    }

    ,get_summary_set        : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Summary"
            },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Router Discovery State"
                ,id         : "rdisc6_state"
                ,name       : "rdisc6_state"
                ,labelWidth : 150
                ,width      : 300
                ,height     : 22
            },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Number of Enabled Interfaces"
                ,id         : "rdisc6_n_if"
                ,name       : "rdisc6_n_if"
                ,labelWidth : 150
                ,width      : 300
                ,height     : 22
            }
        ];
    }

    ,get_grid_cm            : function() {
        return [
            {
                text            : "&#160;"
                ,dataIndex      : "rowTitle"
                ,width          : 325
                ,sortable       : false
                ,menuDisabled   : true
                ,groupable      : false
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Property"
                ,dataIndex      : "field0"
                ,width          : CP.rdisc6_monitor_4.GRID_FIELD_WIDTH
                ,sortable       : false
                ,menuDisabled   : true
                ,groupable      : false
                ,renderer       : function(v, meta, rec) {
                    var field = String(rec.data.field0);
                    var value = String(rec.data.value0);
                    var retValue = field +": "+ value;
                    return CP.ar_util.rendererSpecific(v, retValue);
                }
            },{
                text            : "Value"
                ,dataIndex      : "value0"
                ,width          : CP.rdisc6_monitor_4.GRID_VALUE_WIDTH
                ,sortable       : false
                ,menuDisabled   : true
                ,groupable      : false
                ,renderer       : function(v, meta, rec) {
                    var field = String(rec.data.field0);
                    var value = String(rec.data.value0);
                    var retValue = field +": "+ value;
                    return CP.ar_util.rendererSpecific(v, retValue);
                }
            },{
                text            : "Property"
                ,dataIndex      : "field1"
                ,width          : CP.rdisc6_monitor_4.GRID_FIELD_WIDTH
                ,sortable       : false
                ,menuDisabled   : true
                ,groupable      : false
                ,renderer       : function(v, meta, rec) {
                    var field = String(rec.data.field1);
                    var value = String(rec.data.value1);
                    var retValue = field +": "+ value;
                    return CP.ar_util.rendererSpecific(v, retValue);
                }
            },{
                text            : "Value"
                ,dataIndex      : "value1"
                ,width          : CP.rdisc6_monitor_4.GRID_VALUE_WIDTH
                ,sortable       : false
                ,menuDisabled   : true
                ,groupable      : false
                ,renderer       : function(v, meta, rec) {
                    var field = String(rec.data.field1);
                    var value = String(rec.data.value1);
                    var retValue = field +": "+ value;
                    return CP.ar_util.rendererSpecific(v, retValue);
                }
            }
        ];
    }

    ,get_interfaces_set     : function() {
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc6_monitor_intf_grid"
            ,width              : CP.rdisc6_monitor_4.GRID_WIDTH
            ,height             : CP.rdisc6_monitor_4.GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc6_monitor_intf_store")
            ,columns            : CP.rdisc6_monitor_4.get_grid_cm()
            ,columnLines        : false
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Interface: {name}"
                })
            ]
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Interfaces"
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }

    ,get_statistics_set     : function() {
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc6_monitor_stat_grid"
            ,width              : CP.rdisc6_monitor_4.GRID_WIDTH
            ,height             : CP.rdisc6_monitor_4.GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc6_monitor_stat_store")
            ,columns            : CP.rdisc6_monitor_4.get_grid_cm()
            ,columnLines        : false
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Interface: {name}"
                })
            ]
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Statistics"
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }

}

