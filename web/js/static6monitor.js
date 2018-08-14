CP.static6_monitor_4 = {
    init                    : function() {
        CP.static6_monitor_4.defineStores();
        var monitorPanel = CP.static6_monitor_4.monitorPanel();
        var obj = {
            title           : "Static Routes"
            ,panel          : monitorPanel
            ,submit         : false
            ,params         : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }
    
    /* 
     * CR02012282 reports that auto-load causes issues on slow machines. Don't 
     * auto-refresh if the previous auto-refresh hasn't finshed yet.
     */
    ,autoLoadInProgress : false

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("static6_monitor_store");
        if(store) {
            if (CP.static6_monitor_4.autoLoadInProgress === true) {
                if (sentAutomatically === true) {
                    return;
                }
            }
            CP.static6_monitor_4.autoLoadInProgress = true;
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores           : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "static6_monitor_store"
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
                ,"type"
                ,{
                    name        : "routemask"
                    ,sortType   : function(value) {
                        if(value == "Default") {
                            return 0;
                        }
                        var m_r = value.split("/");

                        var addr = CP.ip6convert.ip6_2_db(m_r[0]);
                        return parseInt(addr, 16);
                    }
                }
                ,"via"
                ,"cost"
                ,"age"
                ,"visible"
                ,"cnt"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/static6monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"pref"         : "t" //show inactive, "t" or "f"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.sroute6_mon"
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
                var store = Ext.getStore("static6_monitor_store");
                if (store && jsonResult && jsonResult.responseText) {
                    if (jsonResult.responseText.length > 0) {
                        var jsonData = Ext.decode(jsonResult.responseText);                       
                        if (jsonData && jsonData.data && jsonData.data.sroute6_mon) {
                            store.loadData(jsonData.data.sroute6_mon);
                        }
                    }
                }
                
                CP.static6_monitor_4.autoLoadInProgress = false;                
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
        CP.UI.startAutoRefresh(CP.static6_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.static6_monitor_4.autoRefreshCallback(false);
    }    

    ,monitorPanel                   : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "static6_monitorPanel"
            ,listeners  : {
                afterrender : CP.static6_monitor_4.doLoad
            }
            ,margin     : "0 24 0 24"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IPv6 Static Route Monitor"
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
                                CP.static6_monitor_4.doReload();
                            }
                        }
                    ]
                }
                ,CP.static6_monitor_4.get_grid()
            ]
        });
        return monitorPanel;
    }

    ,get_grid                       : function() {
        var grid_cm = [
            {
                text            : "Route"
                ,dataIndex      : "routemask"
                ,width          : 230
                ,resizable      : false
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Next Hop"
                ,dataIndex      : "via"
                ,width          : 270
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Cost"
                ,dataIndex      : "cost"
                ,width          : 100
                ,resizable      : false
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Age"
                ,dataIndex      : "age"
                ,width          : 100
                ,resizable      : false
                ,menuDisabled   : true
                ,hideable       : false
                ,groupable      : false
                ,sortable       : false
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "static6_monitor_grid"
            ,width              : 700
            ,height             : 300
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("static6_monitor_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Status: {name}"
                })
            ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [ grid ]
        };
    }
}

