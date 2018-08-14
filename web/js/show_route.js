CP.show_route = {
    SELECT_ALL_STRING           : "Show All"
    ,SHOW_ALL_ROUTES_FIELDLABEL : "Show All Routes (Includes Hidden, Suppressed, etc.)"
    ,SHOW_ALL_ROUTES_LABELWIDTH : 270

    ,get_grid_height_equation   : function(cnt) {
        return 27 + cnt * (8 + 14);
    }

    ,calculate_view_height      : function(recs) {
        var i = 0;
        var h = 27; //height for header is 22, the rest is for buffer space
        var d;
        var state_ln_cnt = 0;
        var comment_ln_cnt = 0;
        for(i = 0; i < recs.length; i++) {
            //8 is the padding, 14 is per line of text
            d = recs[i].data;
            state_ln_cnt = d.state_count;
            comment_ln_cnt = ( String(d.rtComment).length > 0 ? 1 : 0 ) + ( String(d.rtComment2).length > 0 ? 1 : 0 );
            h += parseInt( 8 + ( 14 * Math.max(1, state_ln_cnt, comment_ln_cnt) ), 10 );
        }
        return parseInt(h, 10);
    }

    //list of protocols to dynamically generate for
    ,PROTOCOL_LIST              : [ "Direct"
                                    ,"Static"
                                    ,"BGP"
                                    ,"RIP"
                                    ,"OSPF"
                                    ,"Aggregate"
                                    ,"Kernel"
                                ]

    ,GRID_HEIGHT                : 237

    ,LEFT_COLUMN_WIDTH          : 165
    ,RIGHT_COLUMN_WIDTH         : 700

    ,init                       : function() {
        CP.show_route.GRID_HEIGHT = CP.show_route.get_grid_height_equation(1 + CP.show_route.PROTOCOL_LIST.length);
        CP.show_route.defineStores();
        var monitorPanel = CP.show_route.monitorPanel();
        var obj = {
            title   : "Show Route"
            ,panel  : monitorPanel
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("show_route_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores               : function() {
        function sortType_protocol(value) {
            switch(value) {
                case CP.show_route.SELECT_ALL_STRING:
                    return 0;
                default:
            }
            var i = Ext.Array.indexOf(CP.show_route.PROTOCOL_LIST, String(value) );
            if (i == -1) {
                return CP.show_route.PROTOCOL_LIST.length + 2;
            }
            return i + 1;
        }

        function sortType_route(rawValue) {
            var v       = "zzz";
            var value   = String(rawValue).toLowerCase();
            if (value == "127.0.0.1/32") {
                return "zzzz";
            }
            if (value == "::1/128") {
                return "zzzzz";
            }
            var vList   = value.split("/");
            var addr    = 0;
            var mask    = 0;

            if (vList.length > 1) {
                addr = String(vList[0]);
                mask = "000"+ String(vList[1]);
                mask = mask.slice(mask.length - 3);

                if (addr.indexOf(":") != -1) {
                    v = "a"+ String( CP.ip6convert.ip6_2_db(addr) ) + mask;
                } else if (addr.indexOf(".") != -1) {
                    var o = addr.split(".");
                    var o_raw = 0;
                    var o_hex = "";
                    v = "a000000000000000000000000"; //12345678
                    if (o.length > 0) {
                        var i;
                        for(i = 0; i < 4; i++) {
                            o_raw = (o.length > i ? parseInt(o[i], 10) : 0);
                            if ( isNaN(o_raw) ) { o_raw = 0; }
                            o_hex = "0"+ parseInt(o_raw, 10).toString(16);
                            v += o_hex.slice(o_hex.length - 2);
                        }
                        v += mask;
                    }
                }
            }
            //if ( !(CP.show_route.AA_sort_route) ) { CP.show_route.AA_sort_route = []; }
            //CP.show_route.AA_sort_route[ String(value) ] = v;
            return v;
        }

        var filter_list = [];
        filter_list.push({"protocol": CP.show_route.SELECT_ALL_STRING});
        var Len = CP.show_route.PROTOCOL_LIST.length;
        var i;
        for(i = 0; i < Len; i++) {
            filter_list.push({
                "protocol"  : CP.show_route.PROTOCOL_LIST[i]
            });
        }
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "show_route_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/show_route.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"        : "protocol"
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
                var jsonData = Ext.decode(jsonResult.responseText);
                if (jsonData && jsonData.data) {
                    var data = jsonData.data;

                    var vsid_col = Ext.getCmp("show_route_col_VSID");
                    var vsx_mode = (data.vsx_mode) ? true : false;
                    if (vsid_col) { vsid_col.setVisible(vsx_mode); }

                    var af_col = Ext.getCmp("show_route_col_AF");
                    var af_grid = Ext.getCmp("show_route_filter_af_grid");
                    var ipv6_state = (data.ipv6) ? true : false;
                    if (af_col) { af_col.setVisible(ipv6_state); }
                    if (af_grid) {
                        af_grid.setVisible(ipv6_state);
                        if (!ipv6_state) {
                            af_grid.getSelectionModel().deselectAll();
                        }
                    }

                    var data_st = Ext.getStore("show_route_data_st");
                    if (data_st) {
                        data_st.loadData(data.routes);
                        CP.show_route.filter_data_store();
                    }                    
                } 
            }                        
        });        

        var filter_st = Ext.create("CP.WebUI4.Store", {
            storeId     : "show_route_filter_st"
            ,fields     : [
                {
                    name        : "protocol"
                    ,sortType   : sortType_protocol
                }
            ]
            ,data       : []
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [{property: "protocol", direction: "ASC"}]
        });
        filter_st.loadData( filter_list );

        var filter_af_st = Ext.create("CP.WebUI4.Store", {
            storeId     : "show_route_filter_af_st"
            ,fields     : [
                {
                    name        : "AF"
                    ,sortType   : function(value) {
                        var v = String(value).toLowerCase();
                        switch( v ) {
                            case "all":
                                return "0";
                            case "inet":
                                return "4";
                            case "inet6":
                                return "6";
                        }
                        return String("999"+ String(value));
                    }
                }
            ]
            ,data       : []
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [{property: "AF", direction: "ASC"}]
        });
        var af_list = [{"AF": "all"}, {"AF": "inet"}, {"AF": "inet6"}];
        filter_af_st.loadData( af_list );

        Ext.create("CP.WebUI4.Store", {
            storeId     : "show_route_data_st"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "VSID"
                    ,sortType   : function(v) {
                        if ( String(v).toLowerCase() == "default" ) {
                            return 0;
                        }
                        return parseInt( String(v), 10 );
                    }
                },{
                    name        : "protocol"
                    ,sortType   : sortType_protocol
                }
                ,"AF"
                ,"rtProtocol"
                ,{
                    name        : "rtRoute"
                    ,sortType   : sortType_route
                }
                ,"rtComment"
                ,"rtComment2"
                ,"rtCode"
                ,{
                    name        : "rtActive"
                    ,sortType   : function(value) {
                        if (value == true || value == "true") {
                            return 0;
                        }
                        return 1;
                    }
                }
                ,"entry"
                ,"ActiveIndex"
                ,"NumEntries"
                ,"eprefix"
                ,"State"
                ,"state_count"
            ]
            ,data       : []
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,sorters    : [
                {
                    property    : "rtRoute"
                    ,direction  : "ASC"
                },{
                    property    : "protocol"
                    ,direction  : "ASC"
                },{
                    property    : "rtActive"
                    ,direction  : "ASC"
                }
            ]
        });
    }

    ,filter_data_store          : function() {
        var data_st = Ext.getStore("show_route_data_st");

        var dont_show_inactive = (Ext.getCmp("show_inactive").getValue()) ? false : true;
        var show_all            = false;
        var show_all_af         = false;
        var shown_protocol      = [];
        var show_af             = [];
        var sm                  = Ext.getCmp("show_route_filter_grid").getSelectionModel();
        var sm_af               = Ext.getCmp("show_route_filter_af_grid").getSelectionModel();
        var recs, i;

        if (sm.getCount() != 0) {
            recs = sm.getSelection();
            for(i = 0; i < recs.length; i++) {
                shown_protocol.push( recs[i].data.protocol);
                if (recs[i].data.protocol == CP.show_route.SELECT_ALL_STRING) {
                    show_all = true;
                    shown_protocol = [];
                    break;
                }
            }
        } else {
            show_all = true;
        }

        if (sm_af.getCount() != 0) {
            recs = sm_af.getSelection();
            for(i = 0; i < recs.length; i++) {
                show_af.push( recs[i].data.AF );
                if (recs[i].data.AF == "all") {
                    show_all_af = true;
                    show_af = [];
                    break;
                }
            }
        } else {
            show_all_af = true;
        }

        data_st.clearFilter();

        var func = function(rec, id) {
            if (dont_show_inactive && String(rec.data.rtActive).toLowerCase() == "false") {
                return false;
            }
            var sp = show_all;
            var sa = ( show_all_af || -1 < Ext.Array.indexOf(show_af, rec.data.AF) );
            var k;
            var proto_l;
            var shown_l;
            if (!sp && sa) {
                for(k = 0; (!sp) && (k < shown_protocol.length); k++) {
                    proto_l = String(rec.data.protocol).toLowerCase();
                    shown_l = String(shown_protocol[k]).toLowerCase();
                    if (proto_l.indexOf(shown_l) > -1) {
                        sp = true;
                    }
                }
            }
            return (sp && sa);
        };

        data_st.filter(func);
        Ext.getCmp("mon_routes_sectiontitle").fireEvent("resize");
    }

//monitorPanel
    ,monitorPanel               : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "show_route_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.show_route.doLoad
            }
            ,items      : [
                CP.show_route.get_show_route_layout()
            ]
        });
        return monitorPanel;
    }

    ,doLoad                     : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.show_route.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.show_route.autoRefreshCallback(false);
    }        
        
    ,get_show_route_layout      : function() {
        var filter_grid = CP.show_route.get_filter_grid();
        var filter_af_grid = CP.show_route.get_filter_af_grid();
        var data_grid   = CP.show_route.get_data_grid();

        var items = [
            {
                xtype       : "cp4_formpanel"
                ,id         : "show_route_top_form"
                ,margin     : 0
                ,autoScroll : false
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Routing Monitor"
                        ,id         : "mon_routes_sectiontitle"
                        ,listeners  : {
                            resize      : function(p, adjW, adjH, eOpts) {
                                var data_st     = Ext.getStore("show_route_data_st");
                                var data_g      = Ext.getCmp("show_route_data_grid");
                                var data_set    = Ext.getCmp("data_grid_set");
                                var filter_set  = Ext.getCmp("filter_grid_set");
                                var mon_tab     = Ext.getCmp("monitor-tab");
                                var top_form    = Ext.getCmp("show_route_top_form");
                                var h           = CP.show_route.GRID_HEIGHT;
                                if (top_form && filter_set && data_set && data_g) {
                                    var mon_tab_h   = CP.show_route.GRID_HEIGHT;
                                    if (mon_tab) {
                                        mon_tab_h   = mon_tab.getHeight() - 3;
                                    }
                                    var possible_w  = top_form.getWidth();
                                    var necessary_w = filter_set.getWidth() + data_set.getWidth();
                                    if (necessary_w <= possible_w) {
                                        //can fit side-by-side
                                        if (top_form) {
                                            h = mon_tab_h - top_form.getHeight();
                                        }
                                    }
                                    if (data_set)    { data_set.setHeight(h); }
                                    if (data_g)      { data_g.setHeight(h); }
                                }
                            }
                        }
                    },{
                        xtype           : "cp4_button"
                        ,text           : "Reload"
                        ,id             : "show_route_reload_btn"
                        ,disable        : function() { }
                        ,setDisabled    : function(d) {
                            var b = this;
                            if (b.disabled && b.enable) {
                                b.enable();
                            }
                        }
                        ,handler        : CP.show_route.doReload
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : CP.show_route.SHOW_ALL_ROUTES_FIELDLABEL
                        ,id             : "show_inactive"
                        ,labelWidth     : CP.show_route.SHOW_ALL_ROUTES_LABELWIDTH
                        ,width          : 400
                        ,height         : 22
                        ,style          : "margin-top:5px;"
                        ,checked        : false
                        ,listeners      : {
                            afterrender     : function(field, eOpts) {
                                Ext.getCmp("show_inactive").setDisabled(false);
                            }
                            ,disable        : function(field, eOpts) {
                                Ext.getCmp("show_inactive").fireEvent("afterrender");
                            }
                            ,change         : function(field, newVal, oldVal, eOpts) {
                                field.originalValue = newVal;
                                CP.show_route.filter_data_store();
                            }
                        }
                    }
                ]
            },{
                xtype       : "cp4_formpanel"
                ,id         : "show_route_column_set"
                ,layout     : "column"
                //,width      : (CP.show_route.LEFT_COLUMN_WIDTH + 15) + (CP.show_route.RIGHT_COLUMN_WIDTH + 20)
                ,items      : [
                    {
                        xtype       : "cp4_formpanel"
                        ,id         : "filter_grid_set"
                        ,width      : (CP.show_route.LEFT_COLUMN_WIDTH + 15)
                        ,margin     : 0
                        ,padding    : 0
                        ,items      : [ filter_grid, filter_af_grid ]
                    },{
                        xtype       : "cp4_formpanel"
                        ,id         : "data_grid_set"
                        ,autoScroll : false
                        ,margin     : 0
                        ,padding    : 0
                        ,width      : (CP.show_route.RIGHT_COLUMN_WIDTH + 2)
                        ,items      : [ data_grid ]
                    }
                ]
            }
        ];
        
        if (CP.global.isCluster) {
            // This user is "cadmin", who might expect to see the routes
            // for *all* members of the "cloning group" simultaneously.
            // But that's not what they get.  Let them know.
            items.push({
                xtype: "cp4_inlinemsg"
                ,type: "info"
                ,text: ("This page displays routes for this node only,"+
                        " and not for the entire cloning group.")
            });
        }

        return items;
    }

    ,get_filter_af_grid         : function() {
        return {
            xtype               : "cp4_grid"
            ,id                 : "show_route_filter_af_grid"
            ,hidden             : true
            ,width              : CP.show_route.LEFT_COLUMN_WIDTH
            ,height             : 93
            ,margin             : "0 0 15 0"
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("show_route_filter_af_st")
            ,columns            : [{
                text            : "Filter Address Family"
                ,dataIndex      : "AF"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    switch ( retValue.toLowerCase() ) {
                        case "all":
                            retValue = "Show All";
                            break;
                        case "inet":
                        case "inet4":
                        case "ip4":
                        case "ipv4":
                        case "4":
                            retValue = "IPv4";
                            break;
                        case "inet6":
                        case "ip6":
                        case "ipv6":
                        case "6":
                            retValue = "IPv6";
                            break;
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
            }]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : CP.show_route.filter_data_store
                }
            })
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
    }

    ,get_filter_grid            : function() {

        return {
            xtype               : "cp4_grid"
            ,id                 : "show_route_filter_grid"
            ,width              : CP.show_route.LEFT_COLUMN_WIDTH
            ,height             : CP.show_route.GRID_HEIGHT
            ,margin             : "0 0 15 0"
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("show_route_filter_st")
            ,columns            : [{
                text            : "Filter Protocols"
                ,dataIndex      : "protocol"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = value;
                    switch(String(value).toLowerCase()) {
                        case CP.show_route.SELECT_ALL_STRING:
                            break;
                        case "direct":              retValue = "Direct";
                            break;
                        case "static":              retValue = "Static";
                            break;
                        case "rip":                 retValue = "RIP";
                            break;
                        case "ripng":               retValue = "RIPNG";
                            break;
                        case "bgp":                 retValue = "BGP";
                            break;
                        case "bgp_default":         retValue = "BGP Default";
                            break;
                        case "ospf":                retValue = "OSPF";
                            break;
                        case "ospf_intra_area":     retValue = "OSPF";
                            break;
                        case "ospf2_ase":           retValue = "OSPF External";
                            break;
                        case "ospf_nssa":           retValue = "OSPF NSSA";
                            break;
                        case "ospf3_ase":           retValue = "OSPF3 External";
                            break;
                        case "aggregate":           retValue = "Aggregate";
                            break;
                        case "kernel":              retValue = "Kernel";
                            break;
                        default:                    retValue = String(value);
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
            }]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : CP.show_route.filter_data_store
                }
            })
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
    }

    ,get_data_grid              : function() {
        function column_show_hide_handler() {
            var g = Ext.getCmp("show_route_data_grid");
            if (g) {
                g.getView().refresh();
            }
        }
        var data_cm = [
            {
                text            : "VSID"
                ,id             : "show_route_col_VSID"
                ,dataIndex      : "VSID"
                ,width          : 50
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var c = Ext.getCmp("show_route_col_VSID");
                    var retValue = String(value);
                    if (!c || c.isVisible() == false) {
                        return retValue;
                    }
                    retValue = (retValue.toLowerCase() == "default") ? "Default" : retValue;
                    return CP.ar_util.rendererGeneric( retValue );
                }
                ,listeners      : {
                    show            : column_show_hide_handler
                    ,hide           : column_show_hide_handler
                }
            },{
                text            : "Protocol"
                ,dataIndex      : "protocol"
                ,width          : 100
                ,menuDisabled   : true
                ,hideable       : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.rtProtocol);
                    var tip = "";
                    switch ( String(rec.data.protocol).toLowerCase() ) {
                        case "ripng":
                            retValue = "RIPng";
                            break;
                        case "ospf_intra_area":
                            retValue = "OSPF";
                            tip = "OSPF Intra Area";
                            break;
                        case "ospf_inter_area":
                            retValue = "OSPF IA";
                            tip = "OSPF Inter Area";
                            break;
                        case "ospf2_ase":
                            retValue = "OSPF Ex";
                            tip = "OSPF External";
                            break;
                        case "ospf_nssa":
                            retValue = "OSPF NSSA";
                            break;
                        case "ospf3_ase":
                            retValue = "OSPFv3 Ex";
                            tip = "OSPFv3 External";
                            break;
                        default:
                    }
                    if (tip == "") {
                        tip = retValue;
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip);
                }
            },{
                text            : "AF"
                ,id             : "show_route_col_AF"
                ,dataIndex      : "AF"
                ,width          : 50
                ,menuDisabled   : true
                ,qtipText       : "Address Family"
                ,listeners      : {
                    afterrender     : function(c, eOpts) {
                        if (c.qtipText && c.qtipText.length > 0) {
                            Ext.tip.QuickTipManager.register({
                                target          : c.getId()
                                ,text           : c.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.AF);
                    switch ( retValue.toLowerCase() ) {
                        case "inet":
                        case "inet4":
                        case "ip4":
                        case "ipv4":
                        case "4":
                            retValue = "IPv4";
                            break;
                        case "inet6":
                        case "ip6":
                        case "ipv6":
                        case "6":
                            retValue = "IPv6";
                            break;
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
            },{
                text            : "Route"
                ,dataIndex      : "rtRoute"
                ,width          : 110
                ,menuDisabled   : true
                ,hideable       : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.rtRoute;
                    switch( String(rec.data.AF).toLowerCase() ) {
                        case "inet":
                            break;
                        case "inet6":
                            retValue = String(retValue).toUpperCase().replace( /\./g , ":");
                            break;
                        default:
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
            },{
                text            : "Description"
                ,id             : "show_route_col_rtComment"
                ,dataIndex      : "rtComment"
                ,flex           : 1
                ,menuDisabled   : true
                ,hideable       : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.rtComment);
                    var extraComment = String(rec.data.rtComment2);
                    var c = Ext.getCmp("show_route_col_rtComment");
                    if (c && c.isVisible() && extraComment != "") {
                        if (retValue != "") { retValue += "<br />"; }
                        retValue += "&nbsp;&nbsp;&nbsp;&nbsp;"+ extraComment;
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
                ,listeners      : {
                    show            : column_show_hide_handler
                    ,hide           : column_show_hide_handler
                }
            },{
                text            : "State"
                ,id             : "show_route_col_State"
                ,dataIndex      : "State"
                ,width          : 85
                ,align          : "left"
                ,menuDisabled   : true
                ,hideable       : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value).split(",");
                    var c = Ext.getCmp("show_route_col_State");
                    if (!c || c.isVisible() == false) {
                        if (retValue.length == 0) {
                            retValue = [""];
                        }
                        return CP.ar_util.rendererGeneric( retValue[0] );
                    }
                    retValue = retValue.join(",<br>");
                    return CP.ar_util.rendererGeneric( retValue );
                }
                ,listeners      : {
                    show            : column_show_hide_handler
                    ,hide           : column_show_hide_handler
                }
            }
        ];

        var data_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
        });

        return {
            xtype               : "cp4_grid"
            ,id                 : "show_route_data_grid"
            ,width              : CP.show_route.RIGHT_COLUMN_WIDTH
            ,height             : CP.show_route.GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("show_route_data_st")
            ,columns            : data_cm
            ,selModel           : data_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
            //group?
        };
    }
}

