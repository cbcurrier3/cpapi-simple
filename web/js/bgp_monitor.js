CP.bgp_monitor_4 = {
    MONITOR_FIELD_GRID_HEIGHT   : 107
    ,SUMMARY_GRID_HEIGHT        : 300

    //fixed number of entries, might want to use a height of 632
    //,MEMORY_GRID_HEIGHT         : 200
    ,MEMORY_GRID_HEIGHT         : 632

    //a single grouped neighbor has a height of 260, so recommend a height of 283
    //height of the group header is 29, so recommend 370 pixels (1 open and 3 closed + header + bottom border)
    //,NEIGHBORS_GRID_HEIGHT      : 200
    ,NEIGHBORS_GRID_HEIGHT      : 370

    //
    ,PEERGROUPS_GRID_HEIGHT     : 200

    ,init                       : function() {
        CP.bgp_monitor_4.defineStores();
        var monitorPanel = CP.bgp_monitor_4.monitorPanel();
        var obj = {
            panel   : monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("bgp_monitor_panel_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
        
        // Refresh the currently visible table
        var field_grid = Ext.getCmp("bgp_monitor_field_grid");
        if (field_grid) {
            var selection = field_grid.getSelectionModel().getSelection();
            if (selection && selection.length) {
                var rec = selection[0];                
                if (rec) {
                    var field = rec.data.monitorfield.toLowerCase().replace(/ /ig,"");
                    var store = Ext.getStore("bgp_monitor_"+ field +"_store");
                    if (store) {
                        store.doAutoRefresh(store, sentAutomatically);
                    }
                }
            }
        }        
    }

    ,defineStores               : function() {
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_panel_store"
            ,autoLoad   : false
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                   ,"option"        : "enabled"
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
                var jsonData = Ext.decode(jsonResult.responseText); 
                if (jsonData && jsonData.data) {

                    var bgp_on = false;
                    switch(jsonData.data.bgp_enabled) {
                        case "true":
                        case true:
                            bgp_on = true;
                            break;
                        default:
                    }

                    var enabled_set     = Ext.getCmp("bgp_mon_inactive");
                    var disabled_set    = Ext.getCmp("bgp_monitor_disabled_set");
                    if (enabled_set) {
                        enabled_set.setVisible( !bgp_on );                        
                    }
                    
                    if (disabled_set) {
                        disabled_set.setVisible( bgp_on );
                    }
                }
            }                                    
        });
                    
                    
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_field_store"
            ,autoLoad   : true
            ,fields     : [
                "monitorfield"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.monitorfields"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    st.each(function(rec) {
                        CP.bgp_monitor_4.main_selection_change(rec, "hide");
                    });
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_summary_store"
            ,autoLoad   : false
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "summary"
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
                
                var store2 = Ext.getStore("bgp_monitor_summary2_store");
                if (store) {
                    store2.doAutoRefresh(store2, sentAutomatically);
                }
            }
            
            ,autoRefreshSuccess : function (jsonResult) {
                var panel = Ext.getCmp("bgp_monitor_summary_set");
                if (panel) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data) {
                        panel.loadRecord(jsonData);
                    }
                }
            }                        
            
            ,groupField : "neighbor"
            ,sorters    : [
                {
                    property    : "neighbor"
                    ,direction  : "ASC"
                }
            ]
        });
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_summary2_store"
            ,autoLoad   : false
            ,fields     : [
                "neighbor"
                ,"field"
                ,"value"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "summary2"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.neighbors"
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
                var store = Ext.getStore("bgp_monitor_summary2_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.neighbors) {
                        store.loadData(jsonData.data.neighbors);                            
                    } 
                }
            }                        
            
            ,groupField : "neighbor"
            ,sorters    : [
                {
                    property    : "neighbor"
                    ,direction  : "ASC"
                }
            ]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_memory_store"
            ,autoLoad   : false
            ,fields     : [
                "field"
                ,"InUse"
                ,"Init"
                ,"Alloc"
                ,"Free"
                ,"Size"
                ,"Usage"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "memory"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.memoryusage"
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
                var store = Ext.getStore("bgp_monitor_memory_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.memoryusage) {
                        store.loadData(jsonData.data.memoryusage);
                    } 
                }
            }                                    
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_neighbors_store"
            ,autoLoad   : false
            ,fields     : [
                "peer"
                ,"field"
                ,"value"
                ,"lvalue"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "neighbor"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.neighbors"
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
                var store = Ext.getStore("bgp_monitor_neighbors_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.neighbors) {
                        store.loadData(jsonData.data.neighbors);
                    } 
                }
            }                                    
            
            ,groupField : "peer"
            ,sorters    : [
                {
                    property    : "peer"
                    ,direction  : "ASC"
                }
            ]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_peergroups_store"
            ,autoLoad   : false
            ,fields     : [
                "Type"
                ,"AS"
                ,"NumPeers"
                ,"NumPeersEstablished"
                ,"Proto"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "peergroup"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.peergroups"
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
                var store = Ext.getStore("bgp_monitor_peergroups_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.peergroups) {
                        store.loadData(jsonData.data.peergroups);
                    } 
                }
            }                                               
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_received_store"
            ,autoLoad   : false
            ,fields     : [
                "peer"
                ,"route"
                ,"metric"
                ,"locprf"
                ,"nexthop"
                ,"ll_nexthop"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "received"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.received"
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
                var store = Ext.getStore("bgp_monitor_received_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.received) {
                        store.loadData(jsonData.data.received);
                    } 
                }
            }                                               
            
            ,groupField : "peer"
            ,sorters    : [
                {
                    property    : "peer"
                    ,direction  : "ASC"
                }
            ]
        });
       
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bgp_monitor_advertised_store"
            ,autoLoad   : false
            ,fields     : [
                "peer"
                ,"route"
                ,"metric"
                ,"locprf"
                ,"nexthop"
                ,"ll_nexthop"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bgp_monitor.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "advertised"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.advertised"
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
                var store = Ext.getStore("bgp_monitor_advertised_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText); 
                    if (jsonData && jsonData.data && jsonData.data.advertised) {
                        store.loadData(jsonData.data.advertised);
                    } 
                }
            }                                               
            
            ,groupField : "peer"
            ,sorters    : [
                {
                    property    : "peer"
                    ,direction  : "ASC"
                }
            ]
        });
      
    }

//monitorPanel
    ,monitorPanel                       : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "bgp_monitorPanel"
            ,margin     : "0 24 0 24"
            ,padding    : 0
            ,listeners  : {
                afterrender : CP.bgp_monitor_4.doLoad
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Monitor"
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "bgp_monitor_enabled_set"
                    ,items      : [
                        {
                            xtype       : "cp4_label"
                            ,html       : "<div />BGP is inactive.</div />"
                            ,id         : "bgp_mon_inactive"
                        },{
                            xtype       : "cp4_btnsbar"
                            ,style      : "margin-top:8px;"
                            ,items      : [
                                {
                                    xtype       : "cp4_button"
                                    ,text       : "Reload"
                                    ,id         : "bgp_mon_btn_reload"
                                    ,disable    : function() { }
                                    ,setDisabled: function(d) {
                                        var b = this;
                                        if (b.disabled) {
                                            b.enable();
                                        }
                                    }
                                    ,handler    : function(b, e) {
                                        CP.bgp_monitor_4.doReload();
                                    }
                                }
                            ]
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "bgp_monitor_disabled_set"
                    ,items      : [
                        CP.bgp_monitor_4.get_monitor_field_set()
                        ,CP.bgp_monitor_4.get_summary_set()
                        ,CP.bgp_monitor_4.get_memory_set()
                        ,CP.bgp_monitor_4.get_neighbors_set()
                        ,CP.bgp_monitor_4.get_peergroups_set()
                        ,CP.bgp_monitor_4.get_received_set()
                        ,CP.bgp_monitor_4.get_advertised_set()
                    ]
                }
            ]
        });
        return monitorPanel;
    }

    ,doLoad                             : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.bgp_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.bgp_monitor_4.autoRefreshCallback(false);
    }        
        
    ,main_selection_change              : function(rec, change) {
        var field = rec.data.monitorfield.toLowerCase().replace(/ /ig,"");
        var mon_set = Ext.getCmp("bgp_monitor_"+ field +"_set");
        if (mon_set) {
            mon_set.setVisible( (change == "show") );
        }
    }

    ,genericRenderer                    : function(value) {
        var retValue = String(value).replace(/,/g, ", ");
        retValue = retValue.replace(/  /g, " ");
        return  CP.ar_util.rendererGeneric(retValue);
    }

    ,nexthopRenderer                    : function(value, metaData, record, roIndex, colIndex, store) {
        var retValue = String(value).replace(/,/g, ", ");
        retValue = retValue.replace(/  /g, " ");
        
        var ll_nexthop = record.data.ll_nexthop;
        if (ll_nexthop && ll_nexthop.length > 0) {
            retValue += "<br>(link-local: " + ll_nexthop + ")";
        } 

        return  CP.ar_util.rendererGeneric(retValue);
    }

    ,renderNeighborUpdates              : function(value) {
        var tableMarkup = "";
        var totalWidth;

        if ( value ) {
            var listLen = value.length;
            if ( listLen ) {
                var maxRt = 14;
                var maxNH = 14;
                var maxComm = 11;

                for (var index = 0; index < listLen; index++) {
                    var rowObj = value[index];
        
                    var route = rowObj['route'];
                    if (route && route.length > maxRt ) {
                        maxRt = route.length;
                    }

                    var nexthop = rowObj['nexthop'];
                    if (nexthop && nexthop.length > maxNH) {
                        maxNH = nexthop.length;
                    }

                    var communities = rowObj['communities'];
                    if (communities && communities.length > maxComm) {
                        maxComm = communities.length;
                    }
                }

                // The font is variable width so this is not a perfect approach
                maxRt *= 6;
                maxNH *= 6;
                maxComm *= 6;

                totalWidth = maxRt + 140 + maxNH + maxComm;
                if (totalWidth > 718) {
                    totalWidth = 718;
                    maxComm = totalWidth - maxRt - 140 - maxNH;
                }
                
                var v4Header = "<tr>"
                             + "<th width='" + maxRt + "px'>IPv4 Route</th>"
                             + "<th width='70px'>MED</th>"
                             + "<th width='70px'>LocalPref</th>"
                             + "<th width='" + maxNH + "px'>Nexthop</th>"
                             + "<th width='" + maxComm + "px'>Communities</th>"
                             + "</tr>\n";
                
                var v6Header = "<tr>"
                             + "<th width='" + maxRt + "px'>IPv6 Route</th>"
                             + "<th width='70px'>MED</th>"
                             + "<th width='70px'>LocalPref</th>"
                             + "<th width='" + maxNH + "px'>Nexthop</th>"
                             + "<th width='" + maxComm + "px'>Communities</th>"
                             + "</tr>\n";

                var currentType = "";
                // The list must be sorted from IPv4 routes to IPv6 routes
                for (var index = 0; index < listLen; index++) {
                    var rtype = value[index]['family'];
                    if (rtype != currentType) {
                        if (rtype == 'inet') {
                            tableMarkup += v4Header;
                        }
                        else {
                            if (currentType == 'inet') {
                                // Add empty row to separate v4 from v6 routes
                                tableMarkup += "<tr height='6px'></tr>\n";
                            }
                            tableMarkup += v6Header;
                        }
                        currentType = rtype;
                    }
                
                    tableMarkup += "<tr>";

                    var rowObj = value[index];
                    var route = rowObj['route'];
                    var med = rowObj['med'];
                    var localpref = rowObj['localpref'];
                    var nexthop = rowObj['nexthop'];
                    var communities = rowObj['communities'];
                    var bad = rowObj['bad'];

                    tableMarkup += "<td>" + route + "</td>";
                    tableMarkup += "<td>" + med + "</td>";
                    tableMarkup += "<td>" + localpref + "</td>";
                    tableMarkup += "<td>" + nexthop + "</td>";
                    tableMarkup += "<td style='width: " + maxComm
                        + "px; word-wrap: break-word; white-space: normal;'>"
                        + communities + "</td>";

                    tableMarkup += "</tr>\n";
                }
            }
        }

        return "<table style='table-layout: fixed;' width='"
            + totalWidth + "px'>" + tableMarkup + "</table>";
    }

    ,neighborValueRenderer              : function(value, meta, record) {
        var label = record.get("field");
        var retValue;

        if ( label == "Updates Advertised" || label == "Updates Received" ) {
            var lvalue = record.get("lvalue");
            retValue = CP.bgp_monitor_4.renderNeighborUpdates(lvalue);
            // The qtip doesn't work correctly with an embedded table
            // so don't use rendererGeneric()
            return retValue;
        } else {
            retValue = String(value).replace(/,/g, ", ");
            retValue = retValue.replace(/  /g, " ");
        }

        return  CP.ar_util.rendererGeneric(retValue);
    }

    ,get_monitor_field_set              : function() {
        var grid_cm = [
            {
                header          : "Information"
                ,dataIndex      : "monitorfield"
                ,width          : 100
                ,menuDisabled   : true
                ,sortable       : false
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                select      : function(RowModel, rec, index, eOpts) {
                    CP.bgp_monitor_4.main_selection_change(rec, "show");
                }
                ,deselect   : function(RowModel, rec, index, eOpts) {
                    CP.bgp_monitor_4.main_selection_change(rec, "hide");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_field_grid"
            ,width              : 150
            ,height             : CP.bgp_monitor_4.MONITOR_FIELD_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_field_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
        }

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_field_set"
            ,margin     : 0
            ,padding    : 0
            ,items      : [ grid ]
        };
    }

    ,get_summary_set                    : function() {
        var grid_cm = [
            {
                header          : "Field"
                ,dataIndex      : "field"
                ,width          : 130
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Value"
                ,dataIndex      : "value"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_summary_grid"
            ,width              : 300
            ,height             : CP.bgp_monitor_4.SUMMARY_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_summary2_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Peer: {name}"
                })
            ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_summary_set"
            ,margin     : 0
            ,padding    : 0
            ,listeners  : {
                show        : function(p, eOpts) {                    
                    var store = Ext.getStore("bgp_monitor_summary_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_summary_store");
                    if (store) {
                        store.removeAll();
                    }
                    var store = Ext.getStore("bgp_monitor_summary2_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Summary"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,defaults   : {
                        labelWidth  : 150
                        ,width      : 200
                        ,height     : 22
                        ,disable    : function() { return; }
                        ,setDisabled: function(d) { if (this.isDisabled()) { this.enable(); } return; }
                    }
                    ,items      : [
                        {
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Weight"
                            ,id         : "weight_summary"
                            ,name       : "weight"
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Rank"
                            ,id         : "rank_summary"
                            ,name       : "rank"
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Default Metric"
                            ,id         : "metric_summary"
                            ,name       : "metric"
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "ECMP"
                            ,id         : "ecmp_summary"
                            ,name       : "ECMP"
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "IGP Synchronization"
                            ,id         : "DoIGPSync_summary"
                            ,name       : "DoIGPSync"
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,get_memory_set                     : function() {
        var grid_cm = [
            {
                header          : "Field"
                ,dataIndex      : "field"
                ,flex           : 1
                ,menuDisabled   : true
                ,align          : "left"
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "In Use"
                ,dataIndex      : "InUse"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Init"
                ,dataIndex      : "Init"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Alloc"
                ,dataIndex      : "Alloc"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Free"
                ,dataIndex      : "Free"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Size"
                ,dataIndex      : "Size"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Usage"
                ,dataIndex      : "Usage"
                ,width          : 60
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_memory_grid"
            ,width              : 600
            ,height             : CP.bgp_monitor_4.MEMORY_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_memory_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_memory_set"
            ,margin     : 0
            ,padding    : 0
            ,listeners  : {
                show        : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_memory_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_memory_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Memory Usage"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,get_neighbors_set                  : function() {
        var grid_cm = [
            {
                header          : "Field"
                ,dataIndex      : "field"
                ,width          : 200
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Value"
                ,dataIndex      : "value"
                ,width          : 730
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.neighborValueRenderer
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_neighbors_grid"
            ,width              : 700
            ,height             : CP.bgp_monitor_4.NEIGHBORS_GRID_HEIGHT
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_neighbors_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Peer: {name}"
                })
            ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_neighbors_set"
            ,margin     : 0
            ,padding    : 0
            ,listeners  : {
                show        : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_neighbors_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_neighbors_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Neighbors"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,get_peergroups_set                 : function() {
        var grid_cm = [
            {
                header          : "AS"
                ,dataIndex      : "AS"
                ,width          : 60
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Type"
                ,dataIndex      : "Type"
                ,width          : 90
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value ) {
                    var retValue = String(value);
                    if (String(value).toLowerCase() == "routing") {
                        return CP.bgp_monitor_4.genericRenderer("Internal");
                    }
                    return CP.bgp_monitor_4.genericRenderer(value);
                }
            },{
                header          : "Peers"
                ,dataIndex      : "NumPeers"
                ,width          : 80
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Peers Established"
                ,dataIndex      : "NumPeersEstablished"
                ,width          : 150
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Protocol"
                ,dataIndex      : "Proto"
                ,width          : 100
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retvalue = "";
                    if (Ext.typeOf(value) == "string" && value.length > 0) {
                        var proto_list = Ext.Array.sort(
                            Ext.Array.clean( String(value).split("|") ) );
                        retvalue = proto_list.join(", ");
                    }
                    return CP.bgp_monitor_4.genericRenderer(retvalue);
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_peergroups_grid"
            ,width              : 500
            ,height             : CP.bgp_monitor_4.PEERGROUPS_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_peergroups_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_peergroups_set"
            ,margin     : 0
            ,padding    : 0
            ,listeners  : {
                show        : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_peergroups_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_peergroups_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Peer Groups"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,get_received_set                    : function() {
        var grid_cm = [
            {
                header          : "Route"
                ,dataIndex      : "route"
                ,width          : 200
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "MED"
                ,dataIndex      : "metric"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "LocalPref"
                ,dataIndex      : "locprf"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Nexthop"
                ,dataIndex      : "nexthop"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.nexthopRenderer
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_received_grid"
            ,width              : 650
            ,height             : CP.bgp_monitor_4.SUMMARY_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_received_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Peer: {name}"
                })
            ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_monitor_received_set"
            ,margin     : 0
            ,padding    : 0
            ,listeners  : {
                show        : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_received_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_received_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Received"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
                }
            ]
        };
    }

    ,get_advertised_set                  : function() {
        var grid_cm = [
            {
                header          : "Route"
                ,dataIndex      : "route"
                ,width          : 200
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "MED"
                ,dataIndex      : "metric"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "LocalPref"
                ,dataIndex      : "locprf"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.genericRenderer
            },{
                header          : "Nexthop"
                ,dataIndex      : "nexthop"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : CP.bgp_monitor_4.nexthopRenderer
            }
        ];
        
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_monitor_advertised_grid"
            ,width              : 650
            ,height             : CP.bgp_monitor_4.SUMMARY_GRID_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("bgp_monitor_advertised_store")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Peer: {name}"
                })
            ]
        };

        return {
            xtype               : "cp4_formpanel"
            ,id                 : "bgp_monitor_advertised_set"
            ,margin             : 0
            ,padding            : 0
            ,listeners          : {
                show            : function (p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_advertised_store");
                    if (store) {
                        store.doAutoRefresh(store, false);
                    }
                }
                ,hide           : function(p, eOpts) {
                    var store = Ext.getStore("bgp_monitor_advertised_store");
                    if (store) {
                        store.removeAll();
                    }
                }
            }
            ,items              : [
                {
                    xtype           : "cp4_sectiontitle"
                    ,titleText      : "BGP Advertised"
                },{
                    xtype           : "cp4_formpanel"
                    ,margin         : 0
                    ,padding        : 0
                    ,autoScroll     : true
                    ,items          : [ grid ]
                }
            ]
        };
    }
}

//# sourceURL=bgp_monitor.js
