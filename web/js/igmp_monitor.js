CP.igmp_monitor_4 = {
    init                    : function() {
        CP.igmp_monitor_4.defineStores();
        var monitorPanel = CP.igmp_monitor_4.monitorPanel();
        var obj = {
            panel   : monitorPanel
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("igmp_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//converters
    ,get_timetype           : function(t, m, f) {
        if (!m) { m = 0; }
        if (!f) { f = false; }
        var t_suffix = "";
        var t_retValue;

        if (t == 0)  { return "00s"; }
        if (t == "") { return ""; }

        if (t < 120) {
            t_retValue  = t;
            t           = 0;
            m           = 0;
            t_suffix    = "s";
        } else if (t < 3600) {
            t_retValue  = parseInt(t / 60, 10);
            t           = t % 60;
            t_suffix    = "m";
        } else if (t < 86400) {
            t_retValue  = parseInt(t / 3600, 10);
            t           = t % 3600;
            t_suffix    = "h";
        } else if (t < 604800) {
            t_retValue  = parseInt(t / 86400, 10);
            t           = t % 86400;
            t_suffix    = "d";
        } else {
            t_retValue  = parseInt(t / 604800, 10);
            t           = t % 604800;
            t_suffix    = "w";
        }
        if (m > 0) {
            t_suffix += " "+ CP.igmp_monitor_4.get_timetype(t, m - 1, false);
        }
        if (f == false && t_retValue < 10) {
            t_retValue = "0"+ String(t_retValue);
        }
        return String( t_retValue ) + t_suffix;
    }

//defineStores
    ,defineStores           : function() {
        function sortType_interface(value) {
            if (String(value).toLowerCase().indexOf("lo") == 0) {
                return "zzz"+ String(value);
            }
            return String(value);
        }
        function sortType_parseInt(value) {
            if (value == "n/a" || value == "Null") {
                return 0xFFFFFFFF;
            }
            return parseInt(value, 10);
        }
        function sortType_ipv4(value) {
            if (value == "") {
                return (256 * 256 * 256) + 255;
            }
            var o = (String(value) +".255.255.255").split(".");
            var retValue = 0;
            var i;
            for(i = 0; i < 4; i++) {
                retValue *= 256;
                retValue += parseInt(o[i], 10);
            }
            return retValue;
        }
        function sortType_statGroup(value) {
            var v = 10;
            switch(String(value).toLowerCase()) {
                case "receive summary":             v = 1;
                    break;
                case "transmit summary":            v = 2;
                    break;
                case "error ip":                    v = 3;
                    break;
                case "error igmp":                  v = 4;
                    break;
                case "error membership query":      v = 5;
                    break;
                case "error membership request":    v = 6;
                    break;
                default:
            }
            return parseInt(v, 10);
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/igmp_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
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
                var panel = Ext.getCmp("igmp_monitorPanel");
                if (panel) {
                    var igmprunning = false;
                    var gData = null;
                    var jsonData = Ext.decode(jsonResult.responseText);
                    
                    if (jsonData && jsonData.data) {
                        panel.loadRecord(jsonData);
                        gData = jsonData.data;
                    }
                    
                    if (gData) {
                        switch( String(gData.igmprunning) ) {
                            case "true":
                                igmprunning = true;
                                break;
                            default:
                        }
                    }
                    
                    rs_false    = Ext.getCmp("igmprunning_set_false");
                    rs_true     = Ext.getCmp("igmprunning_set_true");
                    if (rs_false) {  rs_false.setVisible(igmprunning == false ); }
                    if (rs_true) {   rs_true.setVisible( igmprunning == true ); }
                    var st_ids =["igmp_monitor_selector_store"
                                ,"igmp_monitor_logicals_store"
                                ,"igmp_monitor_groups_store"
                                ,"igmp_monitor_if_stats_store"
                                ,"igmp_monitor_interfaces_store"
                                ,"igmp_monitor_stats_store"];
                    var i;
                    var st;
                    if (gData) {
                        for(i = 0; i < st_ids.length; i++) {
                            st = Ext.getStore( st_ids[i] );
                            if (st && st.loadStoreArray) {
                                st.loadStoreArray(gData);
                            }
                        }
                    }
                    CP.igmp_monitor_4.filter_stores();
                } 
            }                        
        });        
        
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_selector_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "row"
                    ,sortType   : sortType_parseInt
                }
                ,"display"
                ,"set_name"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.selector_list) {
                        if (st.getCount() != data.selector_list.length) {
                            st.loadData(data.selector_list);
                        }
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_logicals_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "Intf"
                    ,sortType   : sortType_interface
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.logicals_list) {
                        if (st.getCount() != data.logicals_list.length) {
                            st.loadData(data.logicals_list);
                        }
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_groups_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "Intf"
                    ,sortType   : sortType_interface
                },{
                    name        : "Addr"
                    ,sortType   : sortType_ipv4
                },{
                    name        : "Group"
                },{
                    name        : "Age"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "Expire"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "LastReporter"
                    ,sortType   : sortType_ipv4
                },{
                    name        : "Version"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "FilterMode"
                    ,sortType   : function(value) {
                        return String(value).toLowerCase();
                    }
                },{
                    name        : "Source"
                },{
                    name        : "SourceExpire"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "V1HostExpire"
                    ,sortType   : sortType_parseInt
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.groups_list) {
                        st.loadData(data.groups_list);
                    }
                }
            }
            //,groupField : "Intf"
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_if_stats_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "Intf"
                    ,sortType   : sortType_interface
                },{
                    name        : "summaryType"
                    ,sortType   : sortType_statGroup
                }
                ,"fieldname"
                ,{
                    name        : "fieldvalue"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "row"
                    ,sortType   : sortType_parseInt
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.if_stats_list) {
                        st.loadData(data.if_stats_list);
                    }
                }
            }
            //,groupField : "Intf"
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_interfaces_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "Intf"
                    ,sortType   : sortType_interface
                }
                ,"fieldname"
                ,"fieldvalue"
                ,{
                    name        : "row"
                    ,sortType   : sortType_parseInt
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.interfaces_list) {
                        st.loadData(data.interfaces_list);
                    }
                }
            }
            //,groupField : "Intf"
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_monitor_stats_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "statGroup"
                    ,sortType   : sortType_statGroup
                }
                ,"fieldname"
                ,{
                    name        : "fieldvalue"
                    ,sortType   : sortType_parseInt
                },{
                    name        : "row"
                    ,sortType   : sortType_parseInt
                }
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,loadStoreArray: function(data) {
                var st = this;
                if (st) {
                    if (data && data.stats_list) {
                        st.loadData(data.stats_list);
                    }
                }
            }
            ,groupField : "statGroup"
            ,sorters    : [
                {
                    property    : "statGroup"
                    ,direction  : "ASC"
                },{
                    property    : "row"
                    ,direction  : "ASC"
                }
            ]
        });
    }

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "igmp_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : { afterrender: CP.igmp_monitor_4.doLoad }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IGMP Monitor"
                }
                ,CP.igmp_monitor_4.get_header_set()
                ,{
                    xtype       : "cp4_formpanel"
                    ,id         : "igmprunning_set_true"
                    ,hidden     : true
                    ,autoScroll : false
                    ,margin     : 0
                    ,items      : [
                        CP.igmp_monitor_4.get_selector_set()
                        ,{
                            xtype       : "cp4_formpanel"
                            ,layout     : "anchor"
                            ,margin     : 0
                            ,items      : [
                                CP.igmp_monitor_4.get_groups_set()
                                ,CP.igmp_monitor_4.get_if_stats_set()
                                ,CP.igmp_monitor_4.get_interfaces_set()
                                ,CP.igmp_monitor_4.get_stats_set()
                            ]
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
        CP.UI.startAutoRefresh(CP.igmp_monitor_4.autoRefreshCallback);
    }


    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.igmp_monitor_4.autoRefreshCallback(false);
    }        
        
//header
    ,get_header_set       : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmprunning_set_false"
            ,margin     : 0
            ,hidden     : false
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_label"
                    ,id         : "igmprunning_label"
                    ,hidden     : false
                    ,html       : "IGMP is inactive.<br /><br />"
                },{
                    xtype       : "cp4_button"
                    ,text       : "Refresh"
                    ,id         : "igmp_monitor_reload_btn"
                    ,disable    : function() { }
                    ,setDisabled: function() {
                        var b = this;
                        if (b && b.disabled && b.enable) {
                            b.enable();
                        }
                    }
                    ,handler    : CP.igmp_monitor_4.doReload
                }
            ]
        };
    }

//get_selector_set
    ,get_selector_set       : function() {
        var grid_cm = [
            {
                text            : "Information"
                ,dataIndex      : "row"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.display;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                select              : function(RowModel, rec, index, eOpts) {
                    main_select_change(rec.data.set_name, "show");
                }
                ,deselect           : function(RowModel, rec, index, eOpts) {
                    main_select_change(rec.data.set_name, "hide");
                }
            }
        });

        function main_select_change(set_name, change) {
            var set = Ext.getCmp(set_name);
            if (set) {
                set.setVisible(change == "show");
            }
        }

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_selector_grid"
            ,width              : 125
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 15 0 0"
            ,store              : "igmp_monitor_selector_store"
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
        };

        var logicals_cm = [
            {
                text            : "Filter Interfaces"
                ,dataIndex      : "Intf"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var logicals_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : CP.igmp_monitor_4.filter_stores
            }
        });

        var logicals_grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_logicals_grid"
            ,width              : 200
            ,height             : 181
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 15 0 0"
            ,store              : "igmp_monitor_logicals_store"
            ,columns            : logicals_cm
            ,selModel           : logicals_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,hidden             : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_monitor_selector_set"
            ,layout     : "column"
            ,margin     : 0
            ,autoScroll : true
            ,items      : [
                grid
                ,logicals_grid
                ,{
                    xtype       : "cp4_button"
                    ,text       : "Refresh"
                    ,id         : "igmp_monitor_reload_btn2"
                    ,disable    : function() { }
                    ,setDisabled: function() {
                        var b = this;
                        if (b && b.disabled && b.enable) {
                            b.enable();
                        }
                    }
                    ,handler    : CP.igmp_monitor_4.doReload
                }
            ]
        };
    }

    ,filter_stores          : function() {
        var groups_st       = Ext.getStore("igmp_monitor_groups_store");
        var interfaces_st   = Ext.getStore("igmp_monitor_interfaces_store");
        var if_stats_st     = Ext.getStore("igmp_monitor_if_stats_store");

        var show_list       = [];
        var show_all        = false;
        var i;
        var logicals_grid = Ext.getCmp("igmp_monitor_logicals_grid");
        if (logicals_grid) {
            var sm = logicals_grid.getSelectionModel();
            if (sm.getCount() != 0) {
                var recs = sm.getSelection();
                for(i = 0; i < recs.length; i++) {
                    if (recs[i].data.Intf == "All") {
                        show_all = true;
                        break;
                    }
                    show_list[show_list.length] = recs[i].data.Intf;
                }
            } else {
                show_all = true;
            }
        } else {
            show_all = true;
        }

        if (groups_st) {        groups_st.clearFilter(); }
        if (interfaces_st) {    interfaces_st.clearFilter(); }
        if (if_stats_st) {      if_stats_st.clearFilter(); }
        if (show_all) {
            return;
        }
        var filter_func = function(rec, id) {
            if (Ext.Array.indexOf(show_list, rec.data.Intf) != -1 ) {
                return true;
            }
            return false;
        };
        if (groups_st) {        groups_st.filter(filter_func); }
        if (interfaces_st) {    interfaces_st.filter(filter_func); }
        if (if_stats_st) {      if_stats_st.filter(filter_func); }
    }

//groups
    ,get_groups_set         : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "Intf"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if (p_rec.data.Intf == rec.data.Intf) {
                            color = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Group"
                ,dataIndex      : "Addr"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.Group +": "+ rec.data.Addr;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Last Reporter"
                ,dataIndex      : "LastReporter"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Version"
                ,dataIndex      : "Version"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (value == "") { return ""; }
                    var retValue = "v"+ String(value);
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Age"
                ,dataIndex      : "Age"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var retValue2 = "";
                    if (value != "") {
                        retValue = CP.igmp_monitor_4.get_timetype(value, 1, true);
                        retValue2 = CP.igmp_monitor_4.get_timetype(value, 2, true);
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "center");
                }
            },{
                text            : "Expire"
                ,dataIndex      : "Expire"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var retValue2 = "";
                    if (value != "") {
                        retValue = CP.igmp_monitor_4.get_timetype(value, 1, true);
                        retValue2 = CP.igmp_monitor_4.get_timetype(value, 2, true);
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "center");
                }
            },{
                text            : "Filter Mode"
                ,dataIndex      : "FilterMode"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (value != "") { retValue = value; }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Source"
                ,dataIndex      : "Source"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (value != "") { retValue = value; }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Source Expire"
                ,dataIndex      : "SourceExpire"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    var retValue2 = value;
                    if (value != "" && value != "n/a" && value != "Null") {
                        retValue = CP.igmp_monitor_4.get_timetype(value, 1, true);
                        retValue2 = CP.igmp_monitor_4.get_timetype(value, 2, true);
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "center");
                }
            }
        ];

        var grid_grouping = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "Interface: {name}"
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_groups_grid"
            ,width              : 1000
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "igmp_monitor_groups_store"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            //,features           : [ grid_grouping ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_monitor_groups_set"
            //,margin     : "0 15 0 0"
            ,margin     : 0
            ,autoScroll : false
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Groups"
                },{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,margin     : 0
                    ,items      : [ grid ]
                }
            ]
        };
    }

//if_stats
    ,get_if_stats_set           : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "Intf"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color   = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.Intf == rec.data.Intf) {
                            color   = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Summary Type"
                ,dataIndex      : "summaryType"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color   = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.summaryType == rec.data.summaryType) {
                            color   = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row-1);
                        if (p_rec.data.row == rec.data.row) {
                            color = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "left", color);
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    return CP.ar_util.rendererSpecific(value, retValue2, "left", "black");
                }
            }
        ];

        var grid_grouping = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "Interface: {name}"
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_if_stats_grid"
            ,width              : 500
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "igmp_monitor_if_stats_store"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            //,features           : [ grid_grouping ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_monitor_if_stats_set"
            //,margin     : "0 15 0 0"
            ,margin     : 0
            ,autoScroll : false
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interface Statistics"
                }
                ,grid
            ]
        };
    }

//interfaces
    ,get_interfaces_set         : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "Intf"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if (p_rec.data.Intf == rec.data.Intf) {
                            color = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 250
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if (p_rec.data.row == rec.data.row) {
                            color = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "left", color);
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldvalue;
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "left", "black");
                }
            }
        ];

        var grid_grouping = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "Interface: {name}"
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_interfaces_grid"
            ,width              : 500
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "igmp_monitor_interfaces_store"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            //,features           : [ grid_grouping ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_monitor_interfaces_set"
            //,margin     : "0 15 0 0"
            ,margin     : 0
            ,autoScroll : false
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                }
                ,grid
            ]
        };
    }

//stats
    ,get_stats_set              : function() {
        var grid_cm = [
            {
                text            : "Description"
                ,dataIndex      : "row"
                ,width          : 250
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldname;
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "left", "black");
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.fieldvalue;
                    var retValue2 = rec.data.fieldname +": "+ rec.data.fieldvalue;
                    return CP.ar_util.rendererSpecific(retValue, retValue2, "left", "black");
                }
            }
        ];

        var grid_grouping = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "{name}"
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_monitor_stats_grid"
            ,width              : 375
            ,height             : 400
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "igmp_monitor_stats_store"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [ grid_grouping ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_monitor_stats_set"
            //,margin     : "0 15 0 0"
            ,margin     : 0
            ,autoScroll : false
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Statistics"
                }
                ,grid
            ]
        };
    }
}

