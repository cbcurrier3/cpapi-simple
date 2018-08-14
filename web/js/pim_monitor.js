CP.pim_monitor_4 = {
    enableColumnResize          : true
    ,SECTIONTITLE_STYLE         : "24 0 10 0"
    ,emptyGridText              : '<div data-qtip="No Records" style="vertical-align:middle; text-align:center; color:black;"><br><br>No records</div>'

    ,init                       : function() {
        CP.pim_monitor_4.defineStores();
        var monitorPanel = CP.pim_monitor_4.monitorPanel();
        var obj = {
            panel   : monitorPanel
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("pim_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//renderers
    ,renderer_inline        : function(value, tip, align, color) {
        if(!tip)    { tip = value; }
        if(!align)  { align = "left"; }
        if(!color)  { color = "black"; }
        return '<div style="float:'+align+';text-align:'+align+';display:inline;color:'+color+';" data-qtip="'+tip+'" >'+value+'</div>';
    }

//defineStores
    ,defineStores               : function() {
        function sortType_parseInt(value) {
            if(isNaN(value)) {
                return 4294967295; //highest unsigned 32 bit int
            }
            return parseInt(value, 10);
        }
                
        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/pim_monitor.tcl"
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
                var data = null;
                var pim_running = false;

                function test_load_store(stId, d, id) {
                    var st = Ext.getStore(stId);
                    if(st && d[id]) { st.loadData(d[id]); }
                }
                
                var jsonData = Ext.decode(jsonResult.responseText);
                if (jsonData && jsonData.data) {
                    data = jsonData.data;
                    pim_running = data.pim_running;
                }
                
                if(pim_running) {
                    var selector_store_cnt = 0;
                    var selector_store = Ext.getStore("pim_monitor_store_select");
                    if (selector_store) {
                        selector_store_cnt = selector_store.getCount();
                    }
                    
                    Ext.getCmp("pim_monitor_grid_selector").setVisible(true);
                    Ext.getCmp("active_pim_set").setVisible(true);
                    Ext.getCmp("pim_inactive").setVisible(false);

                    if(selector_store_cnt != data.monitorfields.length) {
                        Ext.getCmp("pim_monitor_grid_selector").getSelectionModel().deselectAll();
                        test_load_store("pim_monitor_store_select"      ,data   ,"monitorfields");
                    }
                    test_load_store("pim_monitor_store_interface"       ,data   ,"interfaces");
                    test_load_store("pim_monitor_store_vifs"            ,data   ,"vifs");
                    test_load_store("pim_monitor_store_neighbors"       ,data   ,"neighbors");
                    test_load_store("pim_monitor_store_joins"           ,data   ,"joins");
                    test_load_store("pim_monitor_store_memory"          ,data   ,"memory_list");
                    test_load_store("pim_monitor_store_timers"          ,data   ,"timers");
                    test_load_store("pim_monitor_store_stats"           ,data   ,"stats");
                    test_load_store("pim_monitor_store_sparse_boot_crp" ,data   ,"sparse_boot_crp");
                    test_load_store("pim_monitor_store_sparse_srp"      ,data   ,"sparse_srps");
                    test_load_store("pim_monitor_store_sparse_stats"    ,data   ,"sparse_stats");
                } else {
                    if(Ext.getStore("pim_monitor_store_select")) {
                        Ext.getStore("pim_monitor_store_select").removeAll();
                    }
                    Ext.getCmp("pim_monitor_grid_selector").setVisible(false);
                    Ext.getCmp("active_pim_set").setVisible(false);
                    Ext.getCmp("pim_inactive").setVisible(true);
                    Ext.getCmp("pim_monitor_grid_selector").getSelectionModel().deselectAll();
                }                
            }                        
        });        
        

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_select"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "monitorfield"
                },{
                    name        : "short_name"
                },{
                    name        : "row"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "mode"
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [
                { property: "row", direction: "ASC" }
            ]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_interface"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "row"
                ,"intf_num"
                ,"instance"
                ,"intf"
                ,"address"
                ,"genId"
                ,"status"
                ,"mode"
                ,"dr_state"
                ,"dr_addr"
                ,"dr_priority"
                ,"num_neighbors"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_vifs"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "row"
                ,"intf_num"
                ,"instance"
                ,"intf"
                ,"vif"
                ,"address"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_neighbors"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "row"
                ,"intf_num"
                ,"instance"
                ,"neighbor_num"
                ,"nbraddr"
                ,"intf"
                ,"genidcap"
                ,"genid"
                ,"dripricap"
                ,"drpri"
                ,"holdtime"
                ,"expiretime"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "instance", direction: "ASC"}
                            ,{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_joins"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Inst"
                ,"row"
                ,"src_cnt"
                ,"src_grp"
                ,"SrcAddr"
                ,"GrpAddr"
                ,"fieldname"
                ,"fieldvalue"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "Inst", direction: "ASC"}
                            ,{property: "src_cnt", direction: "ASC"}
                            ,{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_memory"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Type"
                ,"row"
                ,"Alloc"
                ,"Free"
                ,"InUse"
                ,"Init"
                ,"Size"
                ,"Usage"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_timers"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Inst"
                ,"row"
                ,"mode"
                ,"Units"
                ,"fieldname"
                ,"fieldvalue"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "Inst", direction: "ASC"}
                            ,{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_stats"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "row"
                ,"fieldname"
                ,"transmit"
                ,"receive"
                ,"txerror"
                ,"rxerror"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_sparse_boot_crp"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Inst"
                ,"type"
                ,"row"
                ,"Address"
                ,"BestPriority"
                ,"LclAddress"
                ,"Priority"
                ,"State"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    :   [{property: "Inst", direction: "ASC"}
                            ,{property: "row", direction: "ASC"}]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_sparse_srp"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Inst"
                ,"RP"
                ,"Type"
                ,"Holdtime"
                ,"Priority"
                ,"NumGroups"
                ,"ExpireTime"
                ,"Group"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            
            ,sorters    : [
                {property: "Inst", direction: "ASC"}
            ]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_monitor_store_sparse_stats"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "Inst"
                ,"t"
                ,"Title"
                ,"row"
                ,"fieldname"
                ,"fieldvalue"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [
                {property: "Inst", direction: "ASC"}
                ,{property: "t", direction: "ASC"}
                ,{property: "row", direction: "ASC"}
            ]
        });
    }

//monitorPanel
    ,monitorPanel               : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "pim_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    CP.pim_monitor_4.doLoad();
                }
            }
            ,items      : [
                CP.pim_monitor_4.monitor_set()
                ,{
                    xtype       : "cp4_formpanel"
                    ,id         : "active_pim_set"
                    ,hidden     : true
                    ,margin     : 0
                    ,autoScroll : false
                    ,items      : [
                        CP.pim_monitor_4.interface_set()
                        ,CP.pim_monitor_4.vif_set()
                        ,CP.pim_monitor_4.neighbors_set()
                        ,CP.pim_monitor_4.joins_set()
                        ,CP.pim_monitor_4.memory_set()
                        ,CP.pim_monitor_4.timers_set()
                        ,CP.pim_monitor_4.statistics_set()
                        ,CP.pim_monitor_4.sparse_boot_crp_set()
                        ,CP.pim_monitor_4.sparse_srp_set()
                        ,CP.pim_monitor_4.sparse_stats_set()
                    ]
                }
            ]
        });
        return monitorPanel;
    }

    ,doLoad                     : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.pim_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.pim_monitor_4.autoRefreshCallback(false);
    }        
        
//monitor_set
    ,monitor_set                : function() {
        var grid_cm = [
            {
                text            : "Information"
                ,dataIndex      : "row"
                ,width          : 300
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var mode        = rec.data.mode;
                    switch(String(mode).toLowerCase()) {
                        case "sm":
                        case "sparse":  mode = "(Sparse Mode)";
                            break;
                        case "dm":
                        case "dense":   mode = "(Dense Mode)";
                            break;
                        case "ssm":     mode = "(SSM Mode)";
                            break;
                        default:        mode = "";
                    }
                    var retValue    = rec.data.monitorfield;
                    var tip         = rec.data.monitorfield +" "+ mode;
                    return CP.pim_monitor_4.renderer_inline(retValue, tip, "left", "black")
                        + CP.pim_monitor_4.renderer_inline(mode, tip, "right", "black");
                }
            }
        ];

        function main_select_change(short_name, change) {
            var set_name = "pim_mon_set_"+ short_name;
            var set = Ext.getCmp(set_name);
            if(set) {
                set.setVisible(change == "show");
            }
        }

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                select              : function(RowModel, rec, index, eOpts) {
                    main_select_change(rec.data.short_name, "show");
                }
                ,deselect           : function(RowModel, rec, index, eOpts) {
                    main_select_change(rec.data.short_name, "hide");
                }
                ,selectionchange    : function(RowModel, selection, eOpts) {
                    if(selection.length > 0) { CP.pim_monitor_4.doReload(); }
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_selector"
            ,width              : 350
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 15 0 0"
            ,store              : "pim_monitor_store_select"
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events.beforeitemmousedown.clearListeners();
                    grid.events.beforeitemdblclick.clearListeners();
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_monitor"
            ,margin     : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "PIM Monitor"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,layout     : "column"
                    ,items      : [
                        grid
                        ,{
                            xtype       : "cp4_button"
                            ,text       : "Reload"
                            ,id         : "refresh_monitor_fields"
                            ,margin     : "0 0 10 0"
                            ,handler    : function(b, e) {
                                CP.pim_monitor_4.doReload();
                            }
                            ,listeners  : {
                                afterrender : function(b, e) {
                                    Ext.getCmp("refresh_monitor_fields").setDisabled(false);
                                    if (b && b.getId) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : b.getId()
                                            ,text           : "Changing PIM Protocols can take time to register."
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                                ,disable    : function(b, e) {
                                    Ext.getCmp("refresh_monitor_fields").fireEvent("afterrender");
                                }
                            }
                        }
                    ]
                },{
                    xtype       : "cp4_label"
                    ,id         : "pim_inactive"
                    ,html       : "PIM is inactive.<br /><br />"
                    ,hidden     : true
                }
            ]
        };
    }

//interface_set
    ,interface_set              : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "instance"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.instance == rec.data.instance) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    if(retValue == "0") {
                        retValue = "Default (0)";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Interface"
                ,dataIndex      : "intf_num"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = rec.data.intf;
                    //var tip         = "Instance "+ rec.data.instance +", Interface "+ rec.data.intf;
                    return CP.ar_util.rendererSpecific(retValue, retValue);
                }
            },{
                text            : "Status"
                ,dataIndex      : "status"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "State"
                ,dataIndex      : "dr_state"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "Mode"
                ,dataIndex      : "mode"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var tip;
                    switch(String(value).toLowerCase()) {
                        case "sparse":  retValue = "Sparse";
                                        tip = retValue;
                            break;
                        case "dense":   retValue = "Dense";
                                        tip = retValue;
                            break;
                        case "ssm":     retValue = "SSM";
                                        tip = "Source-Specific Multicast";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "center", "black");
                }
            },{
                text            : "DR Address"
                ,dataIndex      : "dr_addr"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "DR Priority"
                ,dataIndex      : "dr_priority"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "Neighbors"
                ,dataIndex      : "num_neighbors"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_interface"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_interface"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"interface"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//vif_set
    ,vif_set              : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "intf"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "VIF ID"
                ,dataIndex      : "vif"
                ,width          : 95
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "left", "black");
                }
            },{
                text            : "PIM IP Address"
                ,dataIndex      : "address"
                ,width          : 550
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "left", "black");
                }
            }
        ];
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_vifs"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_vifs"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"vifs"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Virtual Interfaces"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype   : "cp4_inlinemsg"
                    ,type   : "info"
                    ,text   : "Note:Virtual Interface (VIF) ID 0 is reserved for the PIM Register interface."
                    ,margin : "0 0 10 0"
                    ,width  : 400

                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }



//neighbors_set
    ,neighbors_set              : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "instance"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.instance == rec.data.instance) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    if(retValue == "0") {
                        retValue = "Default (0)";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Neighbor"
                ,dataIndex      : "nbraddr"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Interface"
                ,dataIndex      : "intf"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "DR Priority"
                ,dataIndex      : "drpri"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "GenId"
                ,dataIndex      : "genid"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "Holdtime"
                ,dataIndex      : "holdtime"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            },{
                text            : "Expire Time"
                ,dataIndex      : "expiretime"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_neighbors"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_neighbors"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"neighbors"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Neighbors"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//joins_set
    ,joins_set                  : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "Inst"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.Inst == rec.data.Inst) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    switch(retValue) {
                        case "-1":      retValue = "";
                            break;
                        case "0":       retValue = "Default (0)";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Src Addr, Grp Addr"
                ,dataIndex      : "src_cnt"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.src_cnt == rec.data.src_cnt) {
                            color = "grey";
                        }
                    }
                    var SrcAddr = String(rec.data.SrcAddr);
                    if (SrcAddr == "0.0.0.0") {
                        SrcAddr = "n/a";
                    }
                    var GrpAddr = String(rec.data.GrpAddr);
                    var retValue = "";
                    if(SrcAddr != "") {
                        retValue = String(SrcAddr) +", "+ String(GrpAddr);
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 290
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_joins"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_joins"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"joins"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Joins"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//memory_set
    ,memory_set                 : function() {
        var grid_cm = [
            {
                text            : "Type"
                ,dataIndex      : "row"
                ,width          : 30
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.Type;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                text            : "In Use"
                ,dataIndex      : "InUse"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Init"
                ,dataIndex      : "Init"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Alloc"
                ,dataIndex      : "Alloc"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Free"
                ,dataIndex      : "Free"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Size"
                ,dataIndex      : "Size"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Usage"
                ,dataIndex      : "Usage"
                ,width          : 20
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_memory"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_memory"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"memory"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Memory"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//timers_set
    ,timers_set                 : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "Inst"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.Inst == rec.data.Inst) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    switch(retValue) {
                        case "-1":      retValue = "";
                            break;
                        case "0":       retValue = "Default (0)";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Timer Type"
                ,dataIndex      : "mode"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    var modeText = "";
                    switch(String(rec.data.mode).toLowerCase()) {
                        case "g":   modeText = "General Timer";
                            break;
                        case "d":   modeText = "Dense Mode Timer";
                            break;
                        case "s":   modeText = "Sparse Mode Timer";
                            break;
                        default:
                    }
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.mode == rec.data.mode) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(modeText, modeText, align, color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 340
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = String(value);
                    var suffix      = "";
                    var suffix2     = "";
                    if(retValue == "-1") {
                        retValue    = "Inactive";
                    } else {
                        switch(rec.data.Units) {
                            case "s":   suffix  = "s";
                                        suffix2 = " seconds";
                                break;
                            default:
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue + suffix, retValue + suffix2, "left", "black");
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_timers"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_timers"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"timers"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Timers"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//statistics_set
    ,statistics_set             : function() {
        var w = 150;
        function stat_renderer(value, meta, rec, row, col, st, view) {
            var retValue = String(value);
            var tip = retValue;
            if(retValue == "") {
                retValue = "n/a";
                tip = "Value is not tracked.";
            }
            return CP.ar_util.rendererSpecific(retValue, tip, "center", "black");
        }

        var grid_cm = [
            {
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 180
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                text            : "Transmit"
                ,dataIndex      : "transmit"
                ,width          : w
                ,menuDisabled   : true
                ,renderer       : stat_renderer
            },{
                text            : "Received"
                ,dataIndex      : "receive"
                ,width          : w
                ,menuDisabled   : true
                ,renderer       : stat_renderer
            },{
                text            : "Tx Errors"
                ,dataIndex      : "txerror"
                ,width          : w
                ,menuDisabled   : true
                ,renderer       : stat_renderer
            },{
                text            : "Rx Errors"
                ,dataIndex      : "rxerror"
                ,width          : w
                ,menuDisabled   : true
                ,renderer       : stat_renderer
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_stats"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_stats"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"stats"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Statistics"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,sparse_boot_crp_set    : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "Inst"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.Inst == rec.data.Inst) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    switch(retValue) {
                        case "-1":      retValue = "";
                            break;
                        case "0":       retValue = "Default (0)";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Type"
                ,dataIndex      : "type"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.type == rec.data.type) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Address"
                ,dataIndex      : "Address"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Priority"
                ,dataIndex      : "BestPriority"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Local Address"
                ,dataIndex      : "LclAddress"
                ,width          : 135
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Local Priority"
                ,dataIndex      : "Priority"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "State"
                ,dataIndex      : "State"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_sparse_boot_crp"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_sparse_boot_crp"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"sparse_boot_crp"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Bootstrap and Candidate RP"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,sparse_srp_set    : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "Inst"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.Inst == rec.data.Inst) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    switch(retValue) {
                        case "-1":      retValue = "";
                            break;
                        case "0":       retValue = "Default (0)";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "RP Address"
                ,dataIndex      : "RP"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    var retValue = value;
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Type"
                ,dataIndex      : "Type"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "center";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    var retValue = "";
                    switch(value) {
                        case "active":      retValue = "Active";
                            break;
                        case "bootstrap":   retValue = "Bootstrap";
                            break;
                        case "candidate":
                        case "crp":         retValue = "Candidate";
                            break;
                        case "static":
                        case "srp":         retValue = "Static";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Holdtime"
                ,dataIndex      : "Holdtime"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "center";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value) +"s";
                    var tip = String(value) +" seconds";
                    return CP.ar_util.rendererSpecific(retValue, tip, align, color);
                }
            },{
                text            : "Priority"
                ,dataIndex      : "Priority"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "center";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Expire Time"
                ,dataIndex      : "ExpireTime"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "center";
                    var color = "black";
                    var retValue = value;
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Number of Groups"
                ,dataIndex      : "NumGroups"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "center";
                    var color = "black";
                    var retValue = value;
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.RP == rec.data.RP) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Group"
                ,dataIndex      : "Group"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_sparse_srp"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_sparse_srp"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"sparse_srp"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Bootstrap and Static RP"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,sparse_stats_set       : function() {
        var grid_cm = [
            {
                text            : "Instance"
                ,dataIndex      : "Inst"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.Inst == rec.data.Inst) {
                            color = "grey";
                        }
                    }
                    var retValue = String(value);
                    switch(retValue) {
                        case "-1":      retValue = "";
                            break;
                        case "0":       retValue = "Default (0)";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Type"
                ,dataIndex      : "t"
                ,width          : 250
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.t == rec.data.t) {
                            color = "grey";
                        }
                    }
                    var retValue = String(rec.data.Title);
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 250
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var align = "left";
                    var color = "black";
                    var retValue = String(rec.data.fieldname);
                    return CP.ar_util.rendererSpecific(retValue, retValue, align, color);
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 190
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_monitor_grid_sparse_stats"
            ,width              : 780
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "pim_monitor_store_sparse_stats"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.pim_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "pim_mon_set_"+"sparse_stats"
            ,margin     : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Sparse-Mode Statistics"
                    ,margin     : CP.pim_monitor_4.SECTIONTITLE_STYLE
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }
}

