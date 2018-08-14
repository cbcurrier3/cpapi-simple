CP.iphelper_stats_4 = {
    INSTANCE                : "default"
    ,enableColumnResize     : true

    ,LABELWIDTH             : 225
    ,WIDTH                  : 300
    ,GRID_WIDTH             : 795

    ,init                   : function() {
        CP.iphelper_stats_4.defineStores();
        var monitorPanel = CP.iphelper_stats_4.monitorPanel();
        var obj = {
            panel   : monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("iphelper_monitor_stats_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
        
        var store = Ext.getStore("iphelper_monitor_services_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores           : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "iphelper_monitor_services_store"
            ,autoLoad   : false
            ,fields     : [
                "port"
                ,"row"
                ,"rowTitle"
                ,"field0"
                ,"value0"
                ,"field1"
                ,"value1"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/iphelpermonitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.iphelper_stats_4.INSTANCE
                    ,"param"       : "services"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.iph_mon_service"
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
                var store = Ext.getStore("iphelper_monitor_services_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.iph_mon_service) {
                        store.loadData(jsonData.data.iph_mon_service);
                    } 
                }
            }            
            
            ,groupField : "port"
            ,sorters    : [
                {
                    property    : "port"
                    ,direction  : "ASC"
                },{
                    property    : "row"
                    ,direction  : "ASC"
                }
            ]
        });
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "iphelper_monitor_stats_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/iphelpermonitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.iphelper_stats_4.INSTANCE
                    ,"param"       : "stats"
                }
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
                var store = Ext.getStore("iphelper_monitor_stats_store");
                if (store) {
                    var panel = Ext.getCmp("iphelper_monitorPanel");
                    if (panel) {
                        var jsonData = Ext.decode(jsonResult.responseText);
                        if (jsonData && jsonData.data) {
                            panel.loadRecord(jsonData);
                        } 
                    } 
                }
            }            
        });
        
    }

    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "iphelper_monitorPanel"
            ,listeners  : {
                afterrender : CP.iphelper_stats_4.doLoad
            }
            ,items      : [
                CP.iphelper_stats_4.get_reload_section()
                ,CP.iphelper_stats_4.get_stats_section()
                ,CP.iphelper_stats_4.get_services_section()
            ]
        });
        return monitorPanel;
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.iphelper_stats_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.iphelper_stats_4.autoRefreshCallback(false);
    }    

    ,get_reload_section     : function () {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "IP Broadcast Helper Monitor"
            },{
                xtype       : "cp4_btnsbar"
                ,items      : [
                    {
                        xtype       : "cp4_button"
                        ,text       : "Reload"
                        ,handler    : function(b, e) {
                            CP.iphelper_stats_4.doReload();
                        }
                    }
                ]
            },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "IP Broadcast Helper State"
                ,id         : "Flag_On"
                ,name       : "Flag_On"
                ,labelWidth : CP.iphelper_stats_4.LABELWIDTH
                ,width      : CP.iphelper_stats_4.WIDTH
                ,height     : 22
            }
        ];
    }

    ,get_stats_section      : function () {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Statistics"
            },{
                xtype       : "cp4_formpanel"
                ,width      : 630
                ,layout     : "column"
                ,defaults   : {
                    labelWidth  : CP.iphelper_stats_4.LABELWIDTH
                    ,width      : CP.iphelper_stats_4.WIDTH
                    ,height     : 22
                    ,style      : "margin-right:15px;"
                }
                ,items      : [
                    {
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Total Packets In"
                        ,id         : "PacketsIn"
                        ,name       : "PacketsIn"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Total Packets Out"
                        ,id         : "PacketsOut"
                        ,name       : "PacketsOut"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Total Bytes In"
                        ,id         : "BytesIn"
                        ,name       : "BytesIn"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Total Bytes Out"
                        ,id         : "BytesOut"
                        ,name       : "BytesOut"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "No Configuration Rule for Packets"
                        ,id         : "BadIntf"
                        ,name       : "BadIntf"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Incoming Packets Not from Attached Host"
                        ,id         : "RemHost"
                        ,name       : "RemHost"
                    },{
                        xtype       : "cp4_displayfield"
                        ,fieldLabel : "Packets Cannot be Sent On Same Subnet"
                        ,id         : "SameIf"
                        ,name       : "SameIf"
                    }
                ]
            }
        ];
    }

    ,render_qtip            : function(value) {
        return '<div data-qtip="'+ value +'" />'+ value +'</div />';
    }

    ,get_services_section   : function () {
        function emptyRenderer() {
            return "";
        }

        var services_cm = [
            {
                header          : ""
                ,dataIndex      : "row"
                ,width          : 25
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : function() {
                    return "";
                }
            },{
                header          : "Interface"
                ,dataIndex      : "rowTitle"
                ,width          : 150
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : CP.iphelper_stats_4.render_qtip
            },{
                header          : "Field"
                ,dataIndex      : "field0"
                ,width          : 120
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : CP.iphelper_stats_4.render_qtip
            },{
                header          : "Value"
                ,dataIndex      : "value0"
                ,width          : 90
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : CP.iphelper_stats_4.render_qtip
            },{
                header          : "Field"
                ,dataIndex      : "field1"
                ,width          : 120
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : CP.iphelper_stats_4.render_qtip
            },{
                header          : "Value"
                ,dataIndex      : "value1"
                ,width          : 90
                ,menuDisabled   : true
                ,hideable       : false
                ,sortable       : false
                ,renderer       : CP.iphelper_stats_4.render_qtip
            }
        ];

        var services_grid = {
            xtype               : "cp4_grid"
            ,id                 : "iphelper_monitor_services_grid"
            ,width              : CP.iphelper_stats_4.GRID_WIDTH
            ,height             : 300
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("iphelper_monitor_services_store")
            ,columns            : services_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.iphelper_stats_4.enableColumnResize
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Service Port: {name}"
                })
            ]
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Services"
            },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Forwarding Of Non-local Packets"
                ,id         : "Flag_FwdNonlocal"
                ,name       : "Flag_FwdNonlocal"
                ,labelWidth : CP.iphelper_stats_4.LABELWIDTH
                ,width      : CP.iphelper_stats_4.WIDTH
                ,height     : 22
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,autoScroll : true
                ,items      : [ services_grid ]
            }
        ];
    }
}

