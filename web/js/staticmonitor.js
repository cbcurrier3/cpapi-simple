CP.static_monitor_4 = {
    init                    : function() {
        CP.static_monitor_4.defineStores();
        var static_monitorPanel = CP.static_monitor_4.monitorPanel();

        var obj = {
            title           : "Static Route Monitor"
            ,panel          : static_monitorPanel
            ,params         : {}
            ,submit         : false
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
        var store = Ext.getStore("sroute_mon_st");
        if(store) {
            if (CP.static_monitor_4.autoLoadInProgress === true) {
                if (sentAutomatically === true) {
                    return;
                }
            }
            CP.static_monitor_4.autoLoadInProgress = true;            
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//defineStores
    ,defineStores           : function() {
        var sroute_mon_st = Ext.create("CP.WebUI4.Store", {
            storeId     : "sroute_mon_st"
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
                ,{name  : "type"}
                ,{
                    name        : "routemask"
                    ,sortType   : function(value) {
                        if(value == "Default") {
                            return 1;
                        }
                        var m_r = value.split("/");
                        var gw_p = m_r[0].split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
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
                ,url    : "/cgi-bin/staticmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"pref"         : "t" //show inactive, "t" or "f"
                }                
                ,reader : {
                    type    : "json"
                    ,root   : "data.sroute_mon"
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
                var store = Ext.getStore("sroute_mon_st");
                if (store && jsonResult && jsonResult.responseText) {
                    if (jsonResult.responseText.length > 0) {
                        var jsonData = Ext.decode(jsonResult.responseText);                           
                        if (jsonData && jsonData.data && jsonData.data.sroute_mon) {
                            store.loadData(jsonData.data.sroute_mon);
                        } 
                    }
                }
                
                CP.static_monitor_4.autoLoadInProgress = false;
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
        CP.UI.startAutoRefresh(CP.static_monitor_4.autoRefreshCallback);
    }
    
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.static_monitor_4.autoRefreshCallback(false);
    }        

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id      : "static_monitorPanel"
            ,listeners  : {
                afterrender : CP.static_monitor_4.doLoad
            }
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IPv4 Static Route Monitor"
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
                                CP.static_monitor_4.doReload();
                            }
                        }
                    ]
                }
                ,CP.static_monitor_4.get_grid()
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
            id                  : "sroute_mon_grid"
            ,xtype              : "cp4_grid"
            ,width              : 500
            ,height             : 300
            ,forceFit           : true
            ,store              : Ext.getStore("sroute_mon_st")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
//            ,features           : [ grid_grouping ]
        };
    }
}

