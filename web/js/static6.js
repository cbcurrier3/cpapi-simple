CP.static6 = {
    GRID_PAGE_SIZE  : 25
    ,NORMAL_INFO    : "<b>Normal:</b> Accept and forward packets."
    ,REJECT_INFO    : "<b>Reject:</b> Drop packets, and send <b>unreachable</b> messages."
    ,BLACKHOLE_INFO : "<b>Black Hole:</b> Drop packets, but don't send <b>unreachable</b> messages."

    ,DEST_LABELWIDTH    : 150
    ,GW_LABELWIDTH      : 100
    ,validMainPanel     : function() {
        var f = Ext.getCmp("static6_configPanel");
        return (f ? f.getForm().isValid() : false);
    }

// USER CONTROL                     ////////////////////////////////////////////
    ,check_user_action      : function() {
        CP.ar_util.checkDisabledBtn("apply_adv_option_btn");
        CP.ar_util.checkBtnsbar("static6_dest_btnsbar");
        CP.ar_util.checkBtnsbar("static6_dest_form");
        CP.ar_util.checkBtnsbar("static6_gw_form");
    }

//  Init                            ////////////////////////////////////////////
    ,init                           : function() {
        CP.static6.defineStores();
        var configPanel = CP.static6.configPanel();
        var obj = {
            title           : "Static Routes"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/static6.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("static6_dest_window");
                CP.static6.doLoad();
            }
            ,submitFailure  : function() {
                CP.static6.doLoad();
            }
            ,checkCmpState  : CP.static6.check_user_action
            ,helpFile       : "static6Help.html"
            ,cluster_feature_name: "static"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

    ,get_prefix                     : function(dest, mask, pushVal, value) {
        if (pushVal == null || pushVal == undefined) {
            pushVal = false;
        }
        if (value == null || value == undefined) {
            value = "";
        }

        var params  = CP.ar_util.getParams();
        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":static";
        if (dest == "default6" || dest == "Default") {
            prefix += ":default6";
            if (pushVal) {
                params[prefix]  = "t";
            }
            return prefix;
        }
        var dest_db;
        if ( String(dest).indexOf(":") != -1 ) {
            dest_db = CP.ip6convert.ip6_2_db(dest);
        } else {
            dest_db = dest;
        }
        var n_prefix = prefix +":network:v6addr:"+ dest_db;
        var m_prefix = n_prefix +":masklen:"+ mask;
        if (pushVal) {
            params[n_prefix]    = "t";
            params[m_prefix]    = value;
        }
        return m_prefix;
    }

//  defineStores                ////////////////////////////////////////////////
    ,defineStores       : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["static6_dest_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("static");
        }

        function ipv6_sortType(value) {
            return CP.ip6convert.ip6_2_db(value);
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(value) {
                        if (String(value).toLowerCase().substring("lo") == 0) {
                            return "zzz"+ String(value);
                        }
                        return value;
                    }
                }
                ,"addr6_list"
            ]
            ,sorters    :   [{ property: "intf", direction: "ASC" }]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      :CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "6in4 6to4 gre loopback"
                    ,"excludeLoopbackAddr"  : "1"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.intfs"
                }
            }
            ,listeners  : {
                load        : function() {
                    CP.ar_util.loadListPop("intf_store");
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "static6_dest_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "route"
                    ,sortType   : function(value) {
                        if (value == "default6") {
                            return 0;
                        }
                        return ipv6_sortType(value);
                    }
                }
                ,"mask"
                ,{
                    name        : "option"
                    ,sortType   : function(value) {
                        switch(value) {
                            case "reject":      return 1;
                            case "blackhole":   return 2;
                            default:            return 0;
                        }
                    }
                }
                
                ,"precedence"

                ,{
                    name        : "agw"
                    ,sortType   : function(list) {
                        if (list.length == 0) {
                            return 0;
                        }
                        return ipv6_sortType(list[0].gw);
                    }
                }
                ,"comment"
                ,"ping"
            ]
            ,pageSize   : CP.static6.GRID_PAGE_SIZE
            ,clearOnPageLoad    : true
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/static6.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.sroutes6"
                    ,totalProperty  : "data.sroute6_list_length"
                }
            }
            ,sorters    :   [{ property: "route", direction: "ASC" }]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    CP.ar_util.loadListPop("static6_dest_store");
                }
            }
        });

        function handle_ping(st) {
            var ping_cmp = Ext.getCmp("ping6_entry");
            if (ping_cmp) {
                var recs = st.getRange().length;
                ping_cmp.setDisabled(!recs);
                if (!recs) {
                    ping_cmp.setValue(false);
                }
            }
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "gw_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "gw"
                    ,sortType   : ipv6_sortType
                }
                ,"intf"
                ,"pref"
                ,"nopref"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,sorters    :   [{ property: "pref", direction: "ASC" }]
            ,listeners  : {
                load        : function(st) {
                    handle_ping(st);
                }
                ,add        : function(st) {
                    handle_ping(st);
                }
                ,remove     : function(st) {
                    handle_ping(st);
                }
            }
        });
    }
    ,load_gw_store      : function(rec) {
        var st = Ext.getStore("gw_store");
        if (st) {
            if (rec) {
                st.loadData(rec.data.agw);
            } else {
                st.removeAll();
            }
        }
    }
    ,is_an_interface    : function(test_addr) {
        //test_addr is in ipv6 notation (with colons)
        var test_32 = String(CP.ip6convert.ip6_2_db(test_addr));

        var recs = Ext.getStore("intf_store").getRange();
        var addr6_list;
        var t;
        var i;
        var j;
        for(i = 0; i < recs.length; i++) {
            addr6_list = recs[i].data.addr6_list;
            for(j = 0; j < addr6_list.length; j++) {
                t = String(addr6_list[j].addr6_raw).substring(0,32);
                if (t == test_32) {
                    return true;
                }
            }
        }
        return false;
    }

//  configPanel                     ////////////////////////////////////////////
    ,configPanel        : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "static6_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender     : CP.static6.doLoad
                ,resize         : function() {
                    var w = Math.max( Ext.getCmp("static6_configPanel").getWidth(), 700);
                    w = Math.min(w, 900);
                    var grid = Ext.getCmp("static6_dest_grid");
                    if (grid) {
                        grid.setWidth( w );
                    }
                }
                ,validitychange : function() {
                    CP.static6.check_user_action();
                }
            }
            ,items      : [
                //CP.ar_one_liners.get_one_liner("static_routes_6"),
                CP.static6.get_destination_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Advanced Options"
                }
                //copied code over from static.js
                ,CP.static6.get_advanced_options_set()
            ]
        });
        return configPanel;
    }

    ,doLoad             : function() {
        CP.ar_util.clearParams();
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("static");
        }

        CP.ar_util.loadListPush("intf_store");
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});

        CP.ar_util.loadListPush("static6_dest_store");
        var dest_st = Ext.getStore("static6_dest_store");
        if (dest_st) {
            dest_st.loadPage(dest_st.currentPage, {params: {"instance": CP.ar_util.INSTANCE()}});
        }
        Ext.getStore("gw_store").removeAll();
        var p = Ext.getCmp("static6_configPanel");
        if (p) {
            p.form._boundItems = null;
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/static6.tcl?instance=" + CP.ar_util.INSTANCE() +"&option=global"
                ,method     :"GET"
                ,success    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }

        CP.ar_util.loadListPop("mySubmit");
    }

    ,get_destination_set: function() {
        function delete_dest(rec) {
            var params  = CP.ar_util.getParams();
            var dest    = rec.data.route;
            var mask    = rec.data.mask;
            var gw_agw  = rec.data.agw;

            var prefix  = CP.static6.get_prefix(dest, mask, true, "");

            params["SPECIAL:"+ prefix]      = "";
            params[prefix]                  = "";
            params[prefix +":option"]       = "";
            params[prefix +":comment"]      = "";
            params[prefix +":ping"]         = "";
            params[prefix +":precedence"]   = "";

            var i;
            var gData;
            var gw_addr;
            var g_prefix    = prefix +":gateway";
            var gw_prefix   = g_prefix +":address:v6addr";
            params[g_prefix]= "";
            if (gw_agw.length > 0) {
                for(i = 0; i < gw_agw.length; i++) {
                    gData = gw_agw[i];
                    gw_addr = CP.ip6convert.ip6_2_db(gData.gw);
                    params[gw_prefix +":"+ gw_addr]                 = "";
                    params[gw_prefix +":"+ gw_addr +":preference"]  = "";
                    params[gw_prefix +":"+ gw_addr +":interface"]   = "";
                }
            }
            var dest_st = Ext.getStore("static6_dest_store");
            if (dest_st) {
                dest_st.remove(rec);
                if (dest_st.findExact("route", dest, 0) == -1) {
                    var n_prefix = String(prefix).replace(":masklen:"+ mask, "");
                    params[n_prefix]    = "";
                }
            }
        }

        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "static6_dest_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "static6_dest_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("static6_dest_grid").getSelectionModel().deselectAll();
                        CP.static6.open_dest_window("Add Destination Route", null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "static6_dest_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("static6_dest_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Destination Route: ";
                        if (rec.data.route == "default6") {
                            T += "Default";
                        } else {
                            T += rec.data.route.toUpperCase() +"/"+ rec.data.mask;
                        }
                        CP.static6.open_dest_window(T, rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("static6_dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "static6_dest_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("static6_dest_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        CP.ar_util.clearParams();
                        for(i = 0; i < recs.length; i++) {
                            delete_dest(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("static6_dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                },{
                    text                : "Delete All"
                    ,id                 : "static6_dest_delete_all_btn"
                    ,hidden             : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        Ext.Msg.show({
                            title   : "Delete all static routes?"
                            ,msg    : "Are you sure you want to delete all configured static routes?"
                                    + "  This may cause connectivity issues."
                            ,animEl : "elId"
                            ,buttons: Ext.Msg.OKCANCEL
                            ,icon   : Ext.MessageBox.QUESTION
                            ,fn     : function(btn, text) {
                                if (btn == "cancel") {
                                    return;
                                }
                                var i;
                                var st = Ext.getStore("static6_dest_store");
                                if (st) {
                                    var recs = st.getRange();
                                    for(i = 0; i < recs.length; i++) {
                                        delete_dest(recs[i]);
                                    }
                                }
                                CP.ar_util.mySubmit();
                            }
                        });
                    }
                }
            ]
        };

        function get_gw_slash_intf(data) {
            var retValue = String(data.gw).toUpperCase();
            if ( String(data.gw).toLowerCase().indexOf("fe80") == 0 ) {
                retValue += " / "+ CP.intf_state.format_substr(
                    data.intf
                    ,data.intf
                    ,"ipv6"
                    ,CP.ar_util.INSTANCE()
                );
            }
            if (data.pref) {
                retValue += " ("+ data.pref +")";
            } else {
                retValue += " (None)";
            }
            return retValue;
        }

        var grid_cm = [
            {
                header          : "Destination"
                ,dataIndex      : "route"
                ,width          : 230
                ,maxWidth       : 230
                ,minWidth       : 230
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (value == "default6") {
                        retValue = "Default";
                    } else {
                        retValue = value.toUpperCase() +"/"+ String(rec.data.mask);
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                header          : "Next Hop Type"
                ,dataIndex      : "option"
                ,width          : 100
                ,maxWidth       : 100
                ,minWidth       : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value) {
                        case "blackhole":   retValue = "Blackhole";
                            break;
                        case "reject":      retValue = "Reject";
                            break;
                        default:            retValue = "Normal";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                } 
            },{
                text            : "Rank"
                ,dataIndex      : "precedence"
                ,width          : 50
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 60;
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }                
            },{
                header          : "Gateways (Priority)"
                ,dataIndex      : "agw"
                ,width          : 230
                ,maxWidth       : 230
                ,minWidth       : 230
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (value.length == "") {
                        return "None";
                    }
                    value.sort(function(a,b) {
                        return parseInt(a.pref,10) - parseInt(b.pref,10);
                    });

                    var gwList = [];
                    var i;
                    for(i = 0; i < value.length; i++) {
                        gwList.push( get_gw_slash_intf( value[i] ) );
                    }
                    var retValue = gwList.join("<br>");
                    return CP.ar_util.rendererSpecific(retValue);
                }
              
            },{
                header          : "Ping6"
                ,dataIndex      : "ping"
                ,menuDisabled   : true
                ,width          : 50
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (String(value).toLowerCase() == "true") ? "Yes" : "No";
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Comment"
                ,dataIndex      : "comment"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value);
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("static6_dest_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "static6_dest_grid"
            ,width              : 700
            ,height             : 281
            ,margin             : 0
            ,forceFit           : false
            ,autoScroll         : true
            ,store              : Ext.getStore("static6_dest_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,dockedItems        : [{
                xtype               : "cp4_pagingtoolbar"
                ,store              : Ext.getStore("static6_dest_store")
                ,id                 : "static6_dest_paging_toolbar"
                ,dock               : "bottom"
                ,displayInfo        : true
                ,listeners          : {
                    afterrender         : function() {
                        this.child("#refresh").hide();
                    }
                    ,change             : function() {
                        var pgtb = Ext.getCmp("static6_dest_paging_toolbar");
                        if (pgtb && pgtb.items && pgtb.items.map && pgtb.items.map.inputItem) {
                            var page_field = pgtb.items.map.inputItem;
                            page_field.originalValue = page_field.getValue();
                        }
                    }
                }
            }]
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("static6_dest_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "IPv6 Static Routes"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,autoScroll : true
                ,draggable  : false
                ,items      : [ grid ]
            }
        ];
    }

//STUB: open_dest_window
    ,get_variable_notation      : function() {

        function valid_and_unique_destination() {
            var r_raw   = Ext.getCmp("route_entry").getRawValue();
            var r_db    = String(CP.ip6convert.ip6_2_db( r_raw ));
            var r_ml    = CP.ip6convert.get_v6masklength(r_db);
            var m       = Ext.getCmp("mask_entry").getRawValue();
            var i;

            if (r_raw == "" || m == "") {
                return true;
            }
            m = parseInt(m, 10);

            //check valid (masked)
            if (r_ml > m) {
                return "unmasked";
            }

            //check uniqueness
            var recs = Ext.getStore("static6_dest_store").getRange();
            var data;
            if (parseInt(r_ml, 10) == 0) {
                return "default";
            }
            for(i = 0; i < recs.length; i++) {
                data = recs[i].data;
                if (r_db == CP.ip6convert.ip6_2_db(data.route) && data.mask == m) {
                    return "duplicate";
                }
            }

            if (CP.static6.is_an_interface(r_raw)) {
                return "intf";
            }

            return true;
        }

        return {
            xtype       : "cp4_fieldcontainer"
            ,fieldLabel : "Destination / Mask Length"
            ,labelWidth : CP.static6.DEST_LABELWIDTH
            ,width      : 518
            ,id         : "route_fc_entry"
            ,items      : [
                {
                    xtype               : "cp4_ipv6field"
                    ,fieldLabel         : "Destination"
                    ,hideLabel          : true
                    ,id                 : "route_entry"
                    ,name               : "route"
                    ,width              : 280
                    ,style              : "margin-right:5px;"
                    ,maskRe             : /[0-9a-fA-F:]/
                    ,stripCharsRe       : /[^0-9a-fA-F:]/
                    ,maxLength          : 39
                    ,enforceMaxLength   : true
                    ,msgTarget          : "none"
                    ,listeners          : {
                        change              : function() {
                            Ext.getCmp("mask_entry").validate();
                        }
                        ,blur               : function(field) {
                            var v = field.getValue();
                            var v2 = v.replace(/[^0-9a-fA-F:]/g, "");
                            if (v != v2) {
                                field.setValue(v2);
                                if (field.validate) { field.validate(); }
                            }
                        }
                        ,afterrender        : function(field, eOpts) {
                            field.validate();
                            field.focus();
                        }
                    }
                    ,validator          : function(v) {
                        var value = Ext.getCmp("route_entry").getRawValue();
                        if (value == "") {
                            return "This field is required.";
                        }
                        var v2 = value.replace(/[^0-9a-fA-F:]/g, "");
                        if (value != v2) {
                            return "Invalid characters.";
                        }
                        /*
                        var v_ip6 = String(v2).toLowerCase();
                        var m = CP.addr_list.getMatchMessage(v_ip6);
                        if (m != "") {
                            return m;
                        }
                        // */
                        switch( valid_and_unique_destination() ) {
                            case "duplicate":
                                return "This destination already exists.";
                            case "unmasked":
                                return "Address exceeds mask length.";
                            case "default":
                                return "0:: is the Default route.  Please edit the existing entry.";
                            case "intf":
                                return "This address shouldn\'t exactly match an interface.";
                            default:
                                return true;
                        }
                    }
                },{
                    xtype               : "cp4_label"
                    ,text               : "/"
                    ,width              : 10
                    ,style              : "margin-top:2px;"
                },{
                    xtype               : "cp4_v6masklength"
                    ,fieldLabel         : "Mask Length"
                    ,hideLabel          : true
                    ,labelWidth         : 5
                    ,labelSeparator     : ""
                    ,id                 : "mask_entry"
                    ,name               : "mask"
                    ,width              : 50
                    ,allowDecimals      : false
                    ,value              : 64
                    ,minValue           : 1
                    ,maxValue           : 128
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,msgTarget          : "none"
                    ,listeners          : {
                        change              : function() {
                            Ext.getCmp("route_entry").validate();
                        }
                    }
                    ,validator          : function(v) {
                        var value = Ext.getCmp("mask_entry").getRawValue();
                        if (value == "") {
                            return "This field is required.";
                        }
                        switch( valid_and_unique_destination() ) {
                            case "unmasked":
                                return "Insufficient mask length.";
                            default:
                                return true;
                        }
                    }
                }
            ]
        };
    }
    ,get_constant_notation      : function(REC) {

        var route_mask = (REC.data.route == "default6")
            ? "Default" : String(REC.data.route).toUpperCase() +"/"+ String(REC.data.mask);

        return {
            xtype   : "cp4_fieldcontainer"
            ,id     : "route_fc_entry"
            ,items  : [
                {
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Destination"
                    ,id                 : "route_mask_entry"
                    ,labelWidth         : CP.static6.DEST_LABELWIDTH
                    ,width              : CP.static6.DEST_LABELWIDTH + 250
                    ,height             : 22
                    ,value              : route_mask
                },{
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Destination"
                    ,id                 : "route_entry"
                    ,name               : "route"
                    ,labelWidth         : CP.static6.DEST_LABELWIDTH
                    ,width              : CP.static6.DEST_LABELWIDTH + 250
                    ,hidden             : true
                    ,hideLabel          : true
                },{
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Mask Length"
                    ,id                 : "mask_entry"
                    ,name               : "mask"
                    ,labelWidth         : CP.static6.DEST_LABELWIDTH
                    ,width              : CP.static6.DEST_LABELWIDTH + 45
                    ,hidden             : true
                    ,hideLabel          : true
                }
            ]
        };
    }

    ,open_dest_window           : function(TITLE, REC) {

        var notationCmp;
        if (REC == null) {
            notationCmp = CP.static6.get_variable_notation();
        } else {
            notationCmp = CP.static6.get_constant_notation(REC);
        }

        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "static6_gw_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "static6_gw_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("static6_gw_grid").getSelectionModel().deselectAll();
                        CP.static6.open_gw_window("Add Gateway", null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "static6_gw_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("static6_gw_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Gateway: "+ rec.data.gw;
                        var delBtn = Ext.getCmp("static6_gw_delete_btn");
                        if (delBtn && delBtn.pushDelArr) {
                            delBtn.pushDelArr(rec.data.gw);
                        }
                        CP.static6.open_gw_window(T, rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("static6_gw_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "static6_gw_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,delArr             : []
                    ,handler2           : function(b) {
                        var i;
                        var sm = Ext.getCmp("static6_gw_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var st = Ext.getStore("gw_store");
                        for(i = 0; i < recs.length; i++) {
                            if (b.pushDelArr) { b.pushDelArr(recs[i].data.gw); }
                        }
                        if (st) {
                            st.remove(recs);
                        }
                    }
                    ,pushDelArr         : function(gw) {
                        var b = this;
                        var gwdb = gw;
                        if (String(gwdb).indexOf(":") != -1) {
                            gwdb = CP.ip6convert.ip6_2_db(gw);
                        }
                        if (b) {
                            if (Ext.typeOf(b.delArr) != "array") {
                                b.delArr = [];
                            }
                            if (Ext.Array.indexOf(b.delArr, gw) == -1) {
                                b.delArr.push(gwdb);
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("static6_gw_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        /*
        function delete_gw(rec) {
            var st      = Ext.getStore("gw_store");
            if (rec.data.newrec) {
                st.remove(rec);
                return;
            }
            var params  = CP.ar_util.getParams();

            var dest    = Ext.getCmp("route_entry").getValue();
            var mask    = Ext.getCmp("mask_entry").getValue();
            var prefix  = CP.static6.get_prefix(dest, mask, false, "t");
            var gw_addr = CP.ip6convert.ip6_2_db(rec.data.gw);

            var gw_prefix   = prefix +":gateway:address:v6addr:"+ gw_addr;
            params[gw_prefix]                   = "";
            params[gw_prefix +":preference"]    = "";
            params[gw_prefix +":interface"]     = "";

            st.remove(rec);
        }
        // */

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("static6_gw_btnsbar");
                }
            }
        });

        var grid_cm = [
            {
                header          : "Gateway"
                ,dataIndex      : "gw"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value).toUpperCase();
                    if ( String(value).toLowerCase().indexOf("fe80") == 0 ) {
                        retValue += " / "+ rec.data.intf;
                        return CP.intf_state.renderer_output(
                            retValue
                            ,retValue
                            ,"left"
                            ,"black"
                            ,rec.data.intf
                            ,"ipv6"
                            ,CP.ar_util.INSTANCE()
                        );
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                header          : "Priority"
                ,dataIndex      : "pref"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (value) {
                        return CP.ar_util.rendererSpecific(value);
                    } else {
                        return CP.ar_util.rendererSpecific("None", "None");
                    }
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "static6_gw_grid"
            ,width              : 530
            ,height             : 149
            ,margin             : 0
            ,forceFit           : false
            ,autoScroll         : true
            ,store              : Ext.getStore("gw_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("static6_gw_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        function dest_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.ar_util.clearParams();
            var rec = null;
            if (Ext.getCmp("route_entry").getXType() == "cp4_displayfield") {
                //edit
                rec = Ext.getCmp("static6_dest_grid").getSelectionModel().getLastSelected();
                var ping_cmp = Ext.getCmp("ping6_entry");
                if (ping_cmp && rec.data.agw.length) {
                    ping_cmp.setDisabled(false);
                }
                p.loadRecord(rec);
            }
            Ext.getCmp("option_entry").fireEvent("change");
            CP.static6.load_gw_store(rec);
            Ext.getCmp("comment_entry").setValue(
                Ext.htmlDecode( Ext.getCmp('comment_entry').getValue() )
            );
            if (p.chkBtns) { p.chkBtns(); }
        }

        function save_dest() {
            var panel = Ext.getCmp("static6_dest_form");
            if (panel && !( panel.getForm().isValid() ) ) { return; }
            var params  = CP.ar_util.getParams();
            var i;

            var dest    = Ext.getCmp("route_entry").getValue();
            var mask    = Ext.getCmp("mask_entry").getValue();
            var option  = Ext.getCmp("option_entry").getValue();
            var comment = Ext.getCmp("comment_entry").getValue();
            var ping = Ext.getCmp("ping6_entry").getValue();
            var precedence = Ext.getCmp("precedence_entry").getValue();

            //mask prefix
            var prefix  = CP.static6.get_prefix(dest, mask, true, "t");
            var ping_val = "";
            if (ping && (option == "")) {
                ping_val = "t";
            }
            params[prefix +":option"]   = option;
            params[prefix +":comment"]  = comment;
            params[prefix +":ping"] = ping_val;
            params[prefix +":precedence"] = precedence;
            var delBtn      = Ext.getCmp("static6_gw_delete_btn");
            var st          = Ext.getStore("gw_store");
            var recs        = st.getRange();
            var gData;
            var g_prefix    = prefix +":gateway";
            var gw_prefix   = g_prefix +":address:v6addr";
            var gw_addr;
            params[g_prefix]= "";
            if (delBtn && Ext.typeOf(delBtn.delArr) == "array" && delBtn.delArr.length > 0) {
                for(i = 0; i < delBtn.delArr.length; i++) {
                    gw_addr = delBtn.delArr[i];
                    params[gw_prefix +":"+ gw_addr]                 = "";
                    params[gw_prefix +":"+ gw_addr +":preference"]  = "";
                    params[gw_prefix +":"+ gw_addr +":interface"]   = "";
                }
            }
            if (recs.length > 0) {
                params[g_prefix]= (option == "") ? "t" : "";
                for(i = 0; i < recs.length; i++) {
                    gData = recs[i].data;
                    gw_addr = CP.ip6convert.ip6_2_db(gData.gw);
                    params[gw_prefix +":"+ gw_addr]                 = (option == "")
                        ? "t" : "";
//                    params[gw_prefix +":"+ gw_addr +":preference"]  = (option == "")
//                        ? Math.max(1, gData.pref) : "";
                    params[gw_prefix +":"+ gw_addr +":preference"]  = (option == "")
                        ? gData.pref : "";
                    params[gw_prefix +":"+ gw_addr +":interface"]   = (option == "")
                        ? gData.intf : "";
                }
            }
            CP.ar_util.mySubmit();
        }
        
        var PING_QTIP_TEXT  = "Ping IPv6 next hop gateways to determine reachability.";
        
        var dest_form = {
            xtype       : "cp4_formpanel"
            ,id         : "static6_dest_form"
            ,width      : 560
            ,height     : 473
            ,margin     : 0
            ,listeners  : {
                afterrender     : dest_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("static6_dest_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("static6_dest_save_btn");
                CP.ar_util.checkDisabledBtn("static6_dest_cancel_btn");
                CP.ar_util.checkBtnsbar("static6_gw_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "static6_dest_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_dest();
                    }
                    ,disabledConditions : function() {
                        var f = Ext.getCmp("static6_dest_form");
                        return f ? !(f.getForm().isValid()) : true;
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "static6_dest_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("static6_dest_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,margin : "15 0 15 15"
                    ,width  : 530
                    ,items  : [
                        notationCmp
                        ,{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Next Hop Type"
                            ,id             : "option_entry"
                            ,name           : "option"
                            ,labelWidth     : CP.static6.DEST_LABELWIDTH
                            ,width          : CP.static6.DEST_LABELWIDTH + 100
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""            ,"Normal"]
                                                ,["blackhole"   ,"Blackhole"]
                                                ,["reject"      ,"Reject"]]
                            ,listeners      : {
                                change          : function(field, newVal, oldVal, eOpts) {
                                    var v = Ext.getCmp("option_entry").getValue();
                                    Ext.getCmp("gw_set").setVisible( String(v) == "" );
                                }
                            }
                        },{
                            xtype   : "cp4_inlinemsg"
                            ,type   : "info"
                            ,text   : CP.static6.NORMAL_INFO +"<br />"
                                    + CP.static6.REJECT_INFO +"<br />"
                                    + CP.static6.BLACKHOLE_INFO
                            ,style  : "margin-bottom:10px;"
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Rank"
                            ,id             : "precedence_entry"
                            ,name           : "precedence"
                            ,labelWidth     : CP.static6.DEST_LABELWIDTH
                            ,width          : CP.static6.DEST_LABELWIDTH + 100
                            ,value              : ""
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,submitValue        : false
                            ,minValue           : 0
                            ,maxValue           : 255
                            ,maxLength          : 3
                            ,emptyText          : "Default: 60"
                            ,enforceMaxLength   : true                            
                        },{
                                
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "Comment"
                            ,id             : "comment_entry"
                            ,name           : "comment"
                            ,labelWidth     : CP.static6.DEST_LABELWIDTH
                            ,width          : 530
                            ,maxLength          : 100
                            ,enforceMaxLength   : true
                            ,maskRe         : CP.ar_util.comment_maskRe
                            ,stripCharsRe   : CP.ar_util.comment_stripCharsRe
                        },{
                            xtype   : "cp4_formpanel"
                            ,id     : "gw_set"
                            ,items  : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Add Gateway"
                                },{
                                    xtype       : "cp4_checkbox"
                                    ,fieldLabel : "Ping6"
                                    ,id         : "ping6_entry"
                                    ,name       : "ping"
                                    ,labelWidth : 100
                                    ,width      : 200
                                    ,height     : 22
                                    ,submitValue: false
                                    ,disabled   : true
                                    ,value      : ""
                                    ,qtipText   : PING_QTIP_TEXT
                                    ,listeners  : {
                                        afterrender     : function(cb, eOpt) {
                                            if (cb.qtipText && cb.qtipText.length > 0) {
                                                Ext.tip.QuickTipManager.register({
                                                    target          : cb.getId()
                                                    ,text           : cb.qtipText
                                                    ,dismissDelay   : 0
                                                });
                                            }
                                        }
                                    }
                                },btnsbar
                                ,grid
                            ]
                        }
                    ]
                }
            ]
        };

        var dest_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "static6_dest_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ dest_form ]
        });
        dest_window.show();
    }

//STUB: open_gw_window
    ,handle_intf_visibility : function(addr) {
        var gw = Ext.getCmp("gw_entry");
        switch (Ext.typeOf(addr)) {
            case "string":
                break;
            default:
                addr = (gw ? gw.getRawValue() : "00000000000000000000000000000000");
        }
        var addr_db = addr;
        if (String(addr_db).indexOf(":") != -1) {
            addr_db = CP.ip6convert.ip6_2_db(addr);
        }
        var vis = String(addr_db).toLowerCase().indexOf("fe80000000000000") == 0;
        var i_cmp = Ext.getCmp("intf_entry");
        if (i_cmp) {
            i_cmp.setVisible(vis);
            i_cmp.setDisabled(!vis);
            i_cmp.validate();
        }
        return vis;
    }

    ,open_gw_window         : function(TITLE, REC) {
        var intf_hidden_disabled = (REC ? !(CP.static6.handle_intf_visibility(REC.data.gw)) : true);
        var gw_cmp = {
            xtype               : "cp4_ipv6field"
            ,fieldLabel         : "Gateway Address"
            ,id                 : "gw_entry"
            ,name               : "gw"
            ,labelWidth         : 100
            ,width              : 400
            ,allowBlank         : false
            ,allowDecimals      : false
            ,maskRe             : /[0-9a-fA-F:]/
            ,stripCharsRe       : /[^0-9a-fA-F:]/
            ,value              : (REC ? REC.data.gw : "")
            ,originalValue      : (REC ? REC.data.gw : "")
            ,maxLength          : 39
            ,enforceMaxLength   : true
            ,listeners          : {
                change              : function(field, newVal, oldVal, eOpts) {
                    CP.static6.handle_intf_visibility(newVal);
                }
                ,blur               : function(field) {
                    var v = field.getValue();
                    var v2 = v.replace(/[^0-9a-fA-F:]/g, "");
                    if (v != v2) {
                        field.setValue(v2);
                        if (field.validate) { field.validate(); }
                    }
                }
            }
            ,validator          : function(value) {
                var v       = Ext.getCmp("gw_entry").getRawValue();
                if (v == "") {
                    return "";
                }
                var v2 = v.replace(/[^0-9a-fA-F:]/g, "");
                if (v != v2) {
                    return "Invalid characters.";
                }
                var v_db    = CP.ip6convert.ip6_2_db(v);
                var v_ip6   = CP.ip6convert.db_2_ip6(v_db);

                var m = CP.addr_list.getMatchMessage(v_ip6);
                if (m != "") {
                    return m;
                }
                //shouldn't equal ::/
                if (v_db == "00000000000000000000000000000000") {
                    return "0:: is not a valid gateway address.";
                }

                //shouldn't be an interface
                if (CP.static6.is_an_interface(v_ip6)) {
                    return "Gateway shouldn\'t exactly match an interface.";
                }

                //shouldn't be a destination
                var d = Ext.getCmp("route_entry").getRawValue();
                if (v_db == CP.ip6convert.ip6_2_db(d)) {
                    return "Gateway shouldn\'t exactly match a destination.";
                }
                if (Ext.getStore("static6_dest_store").findExact("route",v_ip6) != -1) {
                    return "Gateway shouldn\'t exactly match a destination.";
                }

                return true;
            }
        };

        function gw_afterrender(p, eOpts) {
            p.form._boundItems = null;
            /*
            if (Ext.getCmp("gw_entry").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("static6_gw_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                CP.static6.handle_intf_visibility(rec.data.gw);
            } else {
                //add
                CP.static6.handle_intf_visibility("");
                var max_pref = Math.min((Ext.getStore("gw_store").max("pref") || 0) + 1, 8);
                Ext.getCmp("pref_entry").setValue(max_pref);
                Ext.getCmp("gw_entry").validate();
                Ext.getCmp("gw_entry").focus();
            }
            // */
            var ids = ["gw_entry","intf_entry","pref_entry"];
            var c, i;
            for (i=0; i < ids.length; i++) {
                c = Ext.getCmp(ids[i]);
                if (c) {
                    if (c.validate) {
                        c.validate();
                    }
                    if (c.isDisabled() && c.clearInvalid) {
                        c.clearInvalid();
                    }
                }
            }
            CP.static6.handle_intf_visibility();
            if (p.chkBtns) { p.chkBtns(); }
        }

        function save_gw() {
            var gw      = String(Ext.getCmp("gw_entry").getValue()).toLowerCase();
            var gw_old  = String(Ext.getCmp("gw_entry").originalValue);
            var gw_test = CP.ip6convert.ip6_2_db(gw);
            var rec_gw_test = "";
            var gw_clean= CP.ip6convert.db_2_ip6(gw_test);
            var intf    = (gw_test.indexOf("fe80000000000000") == 0)
                                    ? Ext.getCmp("intf_entry").getValue() : "";
            var pref    = Ext.getCmp("pref_entry").getValue();
            var st      = Ext.getStore("gw_store");
            st.sort({property:"pref",direction:"DESC"});
            var recs    = st.getRange();
            var i;

            if (gw_old != "") {
                gw_test = CP.ip6convert.ip6_2_db(gw_old);
                for(i = 0; i < recs.length; i++) {
                    rec_gw_test = CP.ip6convert.ip6_2_db(String(recs[i].data.gw).toLowerCase());
                    if ( gw_test == rec_gw_test ) {
                        recs[i].data.gw = CP.ip6convert.db_2_ip6( CP.ip6convert.ip6_2_db(gw) );
                        recs[i].data.intf = intf;
                        recs[i].data.pref = pref;
                        return;
                    }
                }
            }
            gw_test = CP.ip6convert.ip6_2_db(gw);
            for(i = 0; i < recs.length; i++) {
                rec_gw_test = CP.ip6convert.ip6_2_db(String(recs[i].data.gw).toLowerCase());
                if ( gw_test == rec_gw_test ) {
                    recs[i].data.intf = intf;
                    recs[i].data.pref = pref;
                    return;
                }
            }
            st.add({
                "gw"        : gw_clean
                ,"intf"     : intf
                ,"pref"     : pref
                ,"newrec"   : true
            });
        }

        function getValidPref() {
            var i, recs = Ext.getStore("gw_store").getRange();
            var availablePref = [1,2,3,4,5,6,7,8];
            if (!recs.length) { return 1; }
            for(i = 0; i < recs.length; i++) {
                availablePref[recs[i].data.pref-1] = -1;
            }
            for(i = 0; i < 8; i++) {
                if (availablePref[i] != -1) {
                    return availablePref[i];
                }
            }
            return 1;
        }

        var static6_gw_form = {
            xtype       : "cp4_formpanel"
            ,id         : "static6_gw_form"
            ,width      : 430
            ,height     : 146
            ,margin     : 0
            ,listeners  : {
                afterrender     : gw_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("static6_gw_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("static6_gw_save_btn");
                CP.ar_util.checkDisabledBtn("static6_gw_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "static6_gw_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_gw();
                        Ext.getCmp("static6_gw_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("static6_gw_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("static6_gw_form", false);
                        return !f;
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "static6_gw_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("static6_gw_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,margin : "15 0 15 15"
                    ,width  : 400
                    ,items  : [
                        gw_cmp
                        ,{
                            xtype               : "cp4_combobox"
                            ,fieldLabel         : "Interface"
                            ,id                 : "intf_entry"
                            ,name               : "intf"
                            ,labelWidth         : 100
                            ,width              : 300
                            ,value              : (REC ? REC.data.intf : "")
                            ,allowBlank         : false
                            ,editable           : false
                            ,queryMode          : "local"
                            ,triggerAction      : "all"
                            ,store              : Ext.getStore("intf_store")
                            ,valueField         : "intf"
                            ,displayField       : "intf"
                            ,hidden             : intf_hidden_disabled
                            ,disabled           : intf_hidden_disabled
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Priority"
                            ,id                 : "pref_entry"
                            ,name               : "pref"
                            ,labelWidth         : 100
                            ,width              : 180
                            ,style              : "margin-bottom:0px;"
                            ,allowBlank         : true
                            ,allowDecimals      : false
//                            ,value              : (REC ? REC.data.pref : getValidPref())
                            ,value              : REC ? REC.data.pref : ""
                            ,recId              : (REC ? REC.id : "")
                            ,minValue           : 1
                            ,maxValue           : 8
                            ,maxLength          : 1
                            ,enforceMaxLength   : true
                            ,emptyText          : "None"
                            ,validator          : function(value) {
                                if (value === "") {
                                    return true;
                                }

                                var oldId   = this.recId;
                                var recs    = Ext.getStore("gw_store").getRange();
                                var gw      = Ext.getCmp("gw_entry").getValue();
                                var i, ret = true;


                                var bad_val = "Priority already in use, please choose a different value";
                                for (i = 0; i < recs.length; i++) {
                                    if (recs[i].data.pref === "") {
                                        continue;
                                    }
                                    if (oldId != recs[i].id &&
                                        String(gw).toLowerCase() != String(recs[i].data.gw).toLowerCase() &&
                                        value == recs[i].data.pref) {
                                        return bad_val;
                                    }
                                }
                                return ret;
                            }
                        }
                    ]
                }
            ]
        };

        var static6_gw_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "static6_gw_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("static6_dest_window").getPosition();
                    win.setPosition(130 + pos[0], 94 + pos[1]);
                }
            }
            ,items      : [ static6_gw_form ]
        });
        static6_gw_window.show();
    }
    ,get_advanced_options_set   : function() {
        return [
            {
                xtype   : "cp4_formpanel"
                ,layout : "column"
                ,margin : 0
                ,padding: 0
                ,items  : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Ping Interval"
                        ,id                 : "pinginterval_entry"
                        ,name               : "pinginterval"
                        ,labelWidth         : 100
                        ,width              : 200
                        ,value              : ""
                        ,emptyText          : "Default: 10"
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,submitValue        : false
                        ,minValue           : 1
                        ,maxValue           : 100
                        ,maxLength          : 3
                        ,enforceMaxLength   : true
                        ,qtipText           : "Seconds between ping attempts."
                        ,listeners          : {
                            afterrender         : function(cb, eOpt) {
                                if (cb.qtipText && cb.qtipText.length > 0) {
                                    Ext.tip.QuickTipManager.register({
                                        target          : cb.getId()
                                        ,text           : cb.qtipText
                                        ,dismissDelay   : 0
                                    });
                                }
                            }
                        }
                    },{
                        xtype   : "cp4_label"
                        ,text   : "seconds"
                        ,style  : "margin-left:10px;margin-top:4px;"
                    }
                ]
            },{
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Ping Count"
                ,id                 : "pingcount_entry"
                ,name               : "pingcount"
                ,labelWidth         : 100
                ,width              : 200
                ,value              : ""
                ,emptyText          : "Default: 3"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,submitValue        : false
                ,minValue           : 1
                ,maxValue           : 100
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,qtipText           : "Number of unanswered pings before a gateway is declared down."
                ,listeners          : {
                    afterrender         : function(cb, eOpt) {
                        if (cb.qtipText && cb.qtipText.length > 0) {
                            Ext.tip.QuickTipManager.register({
                                target          : cb.getId()
                                ,text           : cb.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
            },{
                xtype               : "cp4_button"
                ,text               : "Apply"
                ,id                 : "apply_adv_option_btn"
                ,qtipText           : "Only Applies Valid Intervals and Count"
                ,overrideNoToken    : false
                ,handler2           : function(b, e) {
                    var params          = CP.ar_util.clearParams();
                    var ping_prefix     = "routed:instance:"+ CP.ar_util.INSTANCE() +":ping";
                    var interval_cmp    = Ext.getCmp("pinginterval_entry");
                    var count_cmp       = Ext.getCmp("pingcount_entry");

                    if (interval_cmp && interval_cmp.isValid() && !(interval_cmp.isDisabled()) ) {
                        params[ping_prefix +":pinginterval"]= interval_cmp.getRawValue();
                    }
                    if (count_cmp && count_cmp.isValid() && !(count_cmp.isDisabled()) ) {
                        params[ping_prefix +":pingcount"]   = count_cmp.getRawValue();
                    }
                    CP.ar_util.mySubmit();
                }
                ,disabledConditions : function() {
                    return !( CP.static6.validMainPanel() );
                }
                ,listeners          : {
                    mouseover           : function(b, e, eOpts) {
                        var interval_cmp    = Ext.getCmp("pinginterval_entry");
                        var count_cmp       = Ext.getCmp("pingcount_entry");
                        if (interval_cmp && interval_cmp.validate) {
                            interval_cmp.validate();
                        }
                        if (count_cmp && count_cmp.validate) {
                            count_cmp.validate();
                        }
                    }
                    ,afterrender        : function(b, eOpts) {
                        if (b.qtipText && b.qtipText.length > 0) {
                            Ext.tip.QuickTipManager.register({
                                target          : b.getId()
                                ,text           : b.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
            }
        ];
    }
}

