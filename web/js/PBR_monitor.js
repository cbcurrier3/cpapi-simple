CP.PBR_monitor_4 = {
    INSTANCE                : "default"
    ,enableColumnResize     : true

    ,init                   : function() {
        CP.PBR_monitor_4.defineStores();
        var monitorPanel = CP.PBR_monitor_4.monitorPanel();
        var obj = {
            panel   : monitorPanel
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        CP.PBR_monitor_4.setLoadedStoresCnt(0);
        
        var store = Ext.getStore("PBR_mon_store_main");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//renderers
    ,renderer_output        : function(value, tip, align, color) {
        if(!tip)    { tip = value; }
        if(!align)  { align = "left"; }
        if(!color)  { color = "black"; }
        return '<div data-qtip="'+tip+'" style="text-align:'+align+';color:'+color+';">'+value+'</div>';
    }
    ,renderer_generic       : function(value, meta, rec, row, col, st, view, tip, align, color) {
        var retValue    = value || "";
        var TIP         = tip   || retValue;
        var ALIGN       = align || "left";
        var COLOR       = color || "black";
        if(row > 0 && st) {
            var p_rec = st.getAt(row - 1);
            //figure out how to handle this
                //column is pretty safe to assume since columns can't be hidden or reordered
        }
        return CP.PBR_monitor_4.renderer_output(value, TIP, ALIGN, COLOR);
    }
    ,renderer_inline        : function(value, tip, align, color) {
        if(!tip)    { tip = value; }
        if(!align)  { align = "left"; }
        if(!color)  { color = "black"; }
        return '<div style="float:'+align+';text-align:'+align+';display:inline;color:'+color+';" data-qtip="'+tip+'" >'+value+'</div>';
    }

//defineStores
    ,loadedStoresCnt        : 0
    ,setLoadedStoresCnt     : function( v ) {
        if(!v) { v = 0; }
        CP.PBR_monitor_4.loadedStoresCnt = Ext.Number.constrain(v, 0, 2);
        CP.PBR_monitor_4.refresh_grids();
        return CP.PBR_monitor_4.loadedStoresCnt;
    }
    ,incrLoadedStoresCnt    : function( i ) {
        if(!i) { i = 0; }
        CP.PBR_monitor_4.loadedStoresCnt += Ext.Number.constrain(i, 0, 1);
        CP.PBR_monitor_4.refresh_grids();
        return CP.PBR_monitor_4.loadedStoresCnt;
    }
    ,refresh_grids          : function() {
        function refresh_grid(gridId) {
            var g = Ext.getCmp(gridId);
            if(g) {
                g.getView().refresh();
            }
        }
        if(CP.PBR_monitor_4.loadedStoresCnt >= 2) {
            refresh_grid("PBR_mon_grid_rule");
            refresh_grid("PBR_mon_grid_table");
        }
    }

    ,defineStores           : function() {

        Ext.create("CP.WebUI4.Store", {
            storeId     : "PBR_mon_store_main"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/PBR_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.PBR_monitor_4.INSTANCE
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
                var panel = Ext.getCmp("PBR_monitorPanel");
                if (panel) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data) {
                        var data = jsonData.data;
                        panel.loadRecord(jsonData);
                        
                        test_load_store("PBR_mon_store_table"   ,data   ,"table_list");
                        test_load_store("PBR_mon_store_rule"    ,data   ,"rule_list");

                        function test_load_store(stId, d, id) {
                            var st = Ext.getStore(stId);
                            if(st && d && d[id]) { st.loadData(d[id]); }
                        }                        
                    }
                }
            }                        
        });        
                
        Ext.create("CP.WebUI4.Store", {
            storeId     : "PBR_mon_store_rule"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Priority"
                ,"MatchLen"
                ,"SourceIP"
                ,"DestIP"
                ,"Device"
                ,"Tos"
                ,"Port"
                ,"Protocol"
                ,"Table"
                ,"RTM_type"
                ,"isEmpty"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [
                { property: "Priority", direction: "ASC" }
            ]
            ,listeners  : {
                load        : function() {
                    CP.PBR_monitor_4.incrLoadedStoresCnt(1);
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "PBR_mon_store_table"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "table_id"
                ,"table_name"
                ,"rt_cnt"
                ,"isEmpty"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [
                { property: "table_id", direction: "ASC" }
            ]
            ,listeners  : {
                load        : function() {
                    CP.PBR_monitor_4.incrLoadedStoresCnt(1);
                }
            }
        });
    }

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "PBR_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    CP.PBR_monitor_4.doLoad();
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,id         : "PBR_mon_set_monitor"
                    ,margin     : 0
                    ,autoScroll : 0
                    ,items      : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Policy Based Route Monitoring"
                        },{
                            xtype       : "cp4_button"
                            ,text       : "Reload"
                            ,handler    : function(b, e) {
                                CP.PBR_monitor_4.doReload();
                            }
                        }
                    ]
                }
                ,CP.PBR_monitor_4.get_set_table()
                ,CP.PBR_monitor_4.get_set_rule()
            ]
        });
        return monitorPanel;
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.PBR_monitor_4.autoRefreshCallback);
    }
    
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.PBR_monitor_4.autoRefreshCallback(false);
    }        

//get_set_rules
    ,get_set_rule           : function() {
        var grid_cm = [
            {
                text            : "Policy Priority"
                ,dataIndex      : "Priority"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : CP.PBR_monitor_4.renderer_generic
            },{
                text            : "Table ID or RTM Type"
                ,dataIndex      : "Table"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    if(String(value) == String(0)) {
                        retValue = rec.data.RTM_type;
                    } else {
                        var r = Ext.getStore("PBR_mon_store_table").findRecord("table_id",value,0, false, true, true);
                        if(r) {
                            retValue = String(value) +": "+ String(r.data.table_name);
                        }
                    }
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            },{
                text            : "Match: From"
                ,dataIndex      : "SourceIP"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value) ? value : "";
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            },{
                text            : "Match: To"
                ,dataIndex      : "DestIP"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value) ? value : "";
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            },{
                text            : "Match: Interface"
                ,dataIndex      : "Device"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value) ? value : "";
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            },{
                text            : "Match: Port"
                ,dataIndex      : "Port"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value) ? value : "";
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            },{
                text            : "Match: Protocol"
                ,dataIndex      : "Protocol"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value) ? String(value) : "";
                    switch (retValue) {
                        case "1":
                            retValue = "ICMP (1)";
                            break;
                        case "6":
                            retValue = "TCP (6)";
                            break;
                        case "17":
                            retValue = "UDP (17)";
                            break;
                        default:
                    }
                    return CP.PBR_monitor_4.renderer_output(retValue);
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "PBR_mon_grid_rule"
            ,width              : 850
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "PBR_mon_store_rule"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.PBR_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "PBR_mon_set_rule"
            ,margin     : 0
            ,autoScroll : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Policy Rules"
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "Number of Policy Rules"
                    ,id         : "PBR_mon_rule_cnt"
                    ,name       : "rule_cnt"
                    ,labelWidth : 150
                    ,width      : 200
                    ,height     : 22
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,autoScroll : false
                    ,items      : [ grid ]
                }
            ]
        };
    }

//get_set_table
    ,get_set_table          : function() {
        var grid_cm = [
            {
                text            : "Table ID"
                ,dataIndex      : "table_id"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.PBR_monitor_4.renderer_generic
            },{
                text            : "Table Name"
                ,dataIndex      : "table_name"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : CP.PBR_monitor_4.renderer_generic
            },{
                text            : "Number of Routes"
                ,dataIndex      : "rt_cnt"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : CP.PBR_monitor_4.renderer_generic
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "PBR_mon_grid_table"
            ,width              : 400
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "PBR_mon_store_table"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.PBR_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "PBR_mon_set_table"
            ,margin     : 0
            ,autoScroll : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Action Tables"
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "Number of Action Tables"
                    ,id         : "PBR_mon_table_cnt"
                    ,name       : "table_cnt"
                    ,labelWidth : 150
                    ,width      : 200
                    ,height     : 22
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,autoScroll : false
                    ,items      : [ grid ]
                }
            ]
        };
    }
}

