CP.staticmroute_monitor_4 = {
    init                    : function() {
        CP.staticmroute_monitor_4.defineStores();
        var static_monitorPanel = CP.staticmroute_monitor_4.monitorPanel();

        var obj = {
            title           : "Static Multicast Route Monitor"
            ,panel          : static_monitorPanel
            ,params         : {}
            ,submit         : false
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("staticmroute_mon_st");
        if (store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//defineStores
    ,defineStores           : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "staticmroute_mon_st"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "active"
                    ,sortType   : function(value) {
                        if(value == "true") {
                            return 1;
                        }
                        return 2;
                    }
                }
                ,{
                    name        : "routemask"
                    ,sortType   : function(value) {
                        var i;
                        if(value == "Default") {
                            return 1;
                        }
                        var m_r = value.split("/");
                        var gw_p = m_r[0].split(".");
                        var retval = 1;
                        for(i = 0; i < gw_p.length ; i++) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,{name  : "via"}
                ,{name  : "cost"}
                ,{name  : "age"}
                ,{name  : "visible"}
                ,{name  : "cnt"}
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/staticmroute_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"pref"         : "t" //show inactive, "t" or "f"
                }                
                ,reader : {
                    type    : "json"
                    ,root   : "data.staticmroute_mon"
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
                var store = Ext.getStore("staticmroute_mon_st");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.staticmroute_mon) {
                        store.loadData(jsonData.data.staticmroute_mon);
                    } 
                }
            }
            ,sorters    :   [{property: "active",       direction: "ASC"}
                            ,{property: "routemask",    direction: "ASC"}
                            ,{property: "cnt",          direction: "ASC"}]
            ,groupField : "active"
        });
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.staticmroute_monitor_4.autoRefreshCallback);
    }
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.staticmroute_monitor_4.autoRefreshCallback(false);
    }    

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id      : "static_monitorPanel"
            ,listeners  : {
                afterrender : CP.staticmroute_monitor_4.doLoad
            }
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Static Multicast Route Monitor"
                },{
                    xtype       : "cp4_btnsbar"
                    ,items      : [
                        {
                            text        : "Reload"
                            ,disable    : function() {}
                            ,setDisabled: function(d) {
                                var c = this;
                                if (c.disabled) {
                                    c.enable();
                                }
                            }
                            ,handler    : function(b, e) {
                                CP.staticmroute_monitor_4.doReload();
                            }
                        }
                    ]
                }
                ,CP.staticmroute_monitor_4.get_grid()
            ]
        });

        return monitorPanel;
    }

//get_grid
    ,get_grid               : function() {
        var grid_grouping = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "Status: {name}"
        });

        var grid_cm = [
            {
                header          : "Route"
                ,dataIndex      : "routemask"
                ,width          : 125
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Next Hop"
                ,dataIndex      : "via"
                ,width          : 215
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Cost"
                ,dataIndex      : "cost"
                ,width          : 70
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Age"
                ,dataIndex      : "age"
                ,width          : 100
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        return {
            id                  : "staticmroute_mon_grid"
            ,xtype              : "cp4_grid"
            ,width              : 500
            ,height             : 300
            ,forceFit           : true
            ,store              : Ext.getStore("staticmroute_mon_st")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
//            ,features           : [ grid_grouping ]
        };
    }
}

