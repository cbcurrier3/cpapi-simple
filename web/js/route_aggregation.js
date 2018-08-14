CP.route_agg_4 = {
    GRID_PAGE_SIZE                  : 25
    ,init                           : function() {
        CP.route_agg_4.defineStores();
        var route_agg_configPanel = CP.route_agg_4.configPanel();
        var obj = {
            title           : "Route Aggregation"
            ,panel          : route_agg_configPanel
            ,submitURL      : "/cgi-bin/route_aggregation.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("ra_window");
                CP.route_agg_4.afterSubmit();
            }
            ,submitFailure  : function() {
                CP.route_agg_4.submitFailure();
            }
            ,checkCmpState  : CP.route_agg_4.check_user_action
            ,helpFile       : "RouteAggregationHelp.html"
            ,cluster_feature_name: 'aggregate'
        };
        CP.UI.updateDataPanel(obj);
    }

    ,check_user_action              : function() {
        CP.ar_util.checkBtnsbar("ra_btnsbar");
        CP.ar_util.checkBtnsbar("ra_form");
        CP.ar_util.checkBtnsbar("c_form");
    }

//common ajax related functions
    ,afterSubmit                    : function() {
        Ext.getStore("data_store").removeAll();
        CP.ar_util.loadListPush("ra_store");
        var ra_st = Ext.getStore("ra_store");
        if (ra_st) {
            ra_st.loadPage(ra_st.currentPage, {params: {"instance": CP.ar_util.INSTANCE()}});
        }
        CP.ar_util.loadListPop("mySubmit");
    }
    ,submitFailure  : function() {
        CP.ar_util.loadListPush("ra_store");
        var ra_st = Ext.getStore("ra_store");
        if (ra_st) {
            ra_st.loadPage(ra_st.currentPage, {params: {"instance": CP.ar_util.INSTANCE()}});
        }
        CP.ar_util.loadListPop("mySubmit");
    }
    
    ,getMaskLength                  : function(cmpId) {
        var cmp = Ext.getCmp(cmpId);
        if(cmp) {
            if(cmp.getMaskLength) {
                return cmp.getMaskLength();
            }
            return cmp.getValue();
        }
        return "";
    }

//defineStores
    ,defineStores                   : function() {
        //json store of routes
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ra_store"
            ,fields     : [
                {
                    name        : 'aggregationprefix'
                    ,sortType   : function(value) {
                        if(value == "default") {
                            return 0;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        var i;
                        for(i = 0; i < gw_p.length ; i++) {
                            retval = parseInt(retval, 10) * 1000 + parseInt(gw_p[i], 10);
                        }
                        return retval;
                    }
                }
                ,'aggregationmask'
                ,'aggregationprefixmask'
                ,'aggregation_rank'
                ,'aggregation_weight'
                ,'aggregation_asp_truncate'
                ,'aggregationcontributingdata'
            ]
            ,pageSize   : CP.route_agg_4.GRID_PAGE_SIZE
            ,clearOnPageLoad    : true
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/route_aggregation.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.aggregation"
                    ,totalProperty  : "data.list_length"
                }
            }
            ,sorters    :   [{ property: "aggregationprefix", direction: "ASC" }]
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //memory store for "aggregationcontributingdata"
        Ext.create("CP.WebUI4.Store", {
            storeId     : "data_store"
            ,autoLoad   : false
            ,fields     : [
                "acd_protocol"
                ,{
                    name        : "acd_network"
                    ,sortType   : function(value) {
                        if (value === "loopback" || value === "lo") {
                            return "ZZZZZZZZ";
                        }
                        if (value.indexOf(".") == -1) {
                            return value;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        var i;
                        for (i = 0; i < gw_p.length ; i++) {
                            retval = retval * 1000 + parseInt(gw_p[i], 10);
                        }
                        return retval;
                    }
                }
                ,{
                    name        : "acd_masklen"
                    ,sortType   : function(value) {
                        if (value === "") {
                            return 0;
                        }
                        else {
                            return parseInt(value, 10);
                        }
                    }
                }
                ,{
                    name        : "acd_route_all"
                    ,sortType   : function(value) {
                        if (value === "true") {
                            return 0;
                        }
                        else {
                            return 1;
                        }
                    }
                }
                ,"acd_matchtype"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,sorters    : [
                {
                    property    : "acd_protocol"
                    ,direction  : "ASC"
                },{
                    property    : "acd_route_all"
                    ,direction  : "ASC"
                },{
                    property    : "acd_network"
                    ,direction  : "ASC"
                },{
                    property    : "acd_masklen"
                    ,direction  : "ASC"
                }
            ]
        });
    }
    ,load_data_store                    : function(rec) {
        if(rec == null) {
            Ext.getStore("data_store").removeAll();
        } else {
            Ext.getStore("data_store").loadData(rec.data.aggregationcontributingdata);
        }
    }

//configPanel
    ,configPanel                        : function() {
        var ra_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "ra_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ra_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        Ext.getCmp("ra_grid").getSelectionModel().deselectAll();
                        CP.route_agg_4.open_ra_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ra_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ra_grid").getSelectionModel();
                        if (sm.getCount() == 1) {
                            var rec = sm.getLastSelected();
                            var T = "Edit Aggregate Route "+ rec.data.aggregationprefix
                                +"/"+ rec.data.aggregationmask;
                            CP.route_agg_4.open_ra_window( T );
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("ra_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ra_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("ra_grid").getSelectionModel();
                        if (sm.getCount() > 0) {
                            var recs = sm.getSelection();
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                b.delete_ra(recs[i]);
                            }
                            CP.ar_util.mySubmit();
                        }
                    }
                    ,delete_ra          : function(rec) {
                        var params = CP.ar_util.getParams();
                        var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":aggregate";
                        var addr = rec.data.aggregationprefix;
                        var a_prefix = prefix +":"+ addr;
                        var m_prefix = a_prefix +":masklen:"+ rec.data.aggregationmask;

                        params[m_prefix] = "";
                        params[m_prefix +":brief"]      = "";
                        params[m_prefix +":precedence"] = "";
                        params[m_prefix +":preference"] = "";

                        //delete contributing routes
                        var d = rec.data.aggregationcontributingdata;
                        var acd_proto_binding;
                        var acd_net_binding;
                        var acd_mask_binding;
                        var i;
                        for(i = 0; i < d.length; i++) {
                            acd_proto_binding   = m_prefix +":proto:"+ d[i].acd_protocol;
                            var allPrefix = "all-ipv4-routes";
                            params[acd_proto_binding]                   = "";
                            params[acd_proto_binding +":"+allPrefix]           = "";
                            params[acd_proto_binding +":"+allPrefix+":refines"]   = "";
                            params[acd_proto_binding +":"+allPrefix+":exact"]     = "";

                            if(d[i].acd_network) {
                                acd_net_binding     = acd_proto_binding +":network:"+ d[i].acd_network;
                                params[acd_net_binding]                 = "";
                                if(d[i].acd_masklen) {
                                    acd_mask_binding    = acd_net_binding +":masklen:"+ d[i].acd_masklen;

                                    params[acd_mask_binding]            = "";
                                    params[acd_mask_binding +":refines"]= "";
                                    params[acd_mask_binding +":exact"]  = "";
                                }
                            }
                        }

                        var ra_st = Ext.getStore("ra_store");
                        if (ra_st) {
                            ra_st.remove(rec);
                            if (ra_st.findExact("aggregationprefix", addr) == -1) {
                                params[a_prefix] = "";
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("ra_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var ra_cm = [
            {
                header          : "Address"
                ,dataIndex      : "aggregationprefix"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = "";
                    if(value != "" && rec.data.aggregationmask != "") {
                        retValue = value +"/"+ rec.data.aggregationmask;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue);
                }
            },{
                header          : "Rank"
                ,dataIndex      : "aggregation_rank"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 130;
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "Weight"
                ,dataIndex      : "aggregation_weight"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 0;
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "AS Path Truncate"
                ,dataIndex      : "aggregation_asp_truncate"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "Truncate" : "";
                    return CP.ar_util.rendererSpecific(retValue, retValue);
                }
            },{
                header          : "Contributing Protocols"
                ,dataIndex      : "aggregationcontributingdata"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var contribList = rec.data.aggregationcontributingdata;
                    var retValue = contribList.length;
                    var retTip = "";
                    var tipTemp;
                    var i;

                    if (retValue > 0) {
                        for (i = 0; i < contribList.length; i++) {
                            tipTemp = "";
                            if (retTip.length > 0) {
                                tipTemp = "<br />";
                            }

                            switch (contribList[i].acd_protocol) {
                                case "all":
                                    tipTemp += "All Protocols, ";
                                    break;
                                case "direct":
                                    tipTemp += "Direct, ";
                                    break;
                                case "static":
                                    tipTemp += "Static, ";
                                    break;
                                case "aggregate":
                                    tipTemp += "Aggregate, ";
                                    break;
                                case "ospf2":
                                    tipTemp += "OSPF2, ";
                                    break;
                                case "ospf2ase":
                                    tipTemp += "OSPF2ASE, ";
                                    break;
                                case "rip":
                                    tipTemp += "RIP, ";
                                    break;
                                case "bgp":
                                    tipTemp += "BGP, ";
                                    break;
                                default:
                                    continue;
                            }

                            // All Routes or a specific route
                            if (contribList[i].acd_route_all === "true") {
                                tipTemp += "All IPv4 Routes";
                            }
                            else if (contribList[i].acd_network != ""
                                     && contribList[i].acd_masklen != "") {
                                tipTemp += contribList[i].acd_network + "/"
                                           + contribList[i].acd_masklen;
                            }

                            // nothing, "Refines", or "Exact"
                            if (contribList[i].acd_matchtype == "refines") {
                                tipTemp += ", Refines";
                            }
                            else if (contribList[i].acd_matchtype == "exact") {
                                tipTemp += ", Exact";
                            }
                            retTip += tipTemp;
                        }

                        return CP.ar_util.rendererSpecific(retTip);
                    }
                    return CP.ar_util.rendererSpecific("No protocols");
                }
            }
        ];

        var ra_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.route_agg_4.check_user_action();
                }
            }
        });

        var ra_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ra_grid"
            ,width              : 585
            ,height             : 300
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("ra_store")
            ,columns            : ra_cm
            ,selModel           : ra_selModel
            ,dockedItems        : [{
                xtype               : "cp4_pagingtoolbar"
                ,store              : Ext.getStore("ra_store")
                ,id                 : "ra_grid_paging_toolbar"
                ,dock               : "bottom"
                ,displayInfo        : true
                ,listeners          : {
                    afterrender         : function() {
                        this.child("#refresh").hide();
                    }
                    ,change             : function() {
                        var pgtb = Ext.getCmp("ra_grid_paging_toolbar");
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
                    var b = Ext.getCmp("ra_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        var panel = Ext.create("CP.WebUI4.DataFormPanel", {
            id      : "route_agg_configPanel"
            ,items  : [
                CP.ar_one_liners.get_one_liner("route_agg"),
                {
                    xtype           : "cp4_sectiontitle"
                    ,titleText      : "Route Aggregation"
                }
                ,ra_btnsbar
                ,{
                    xtype           : "cp4_formpanel"
                    ,autoScroll     : true
                    ,margin         : 0
                    ,padding        : 0
                    ,items          : [ ra_grid ]
                }
            ]
        });
        return panel;
    }

    ,open_ra_window                         : function(TITLE) {
        var notation_cmp;
        if(TITLE == "add") {
            TITLE = "Add Aggregate Route";
            if(Ext.getCmp("address_ipv4notation")) {
                Ext.getCmp("address_ipv4notation").destroy();
            }
            notation_cmp = {
                xtype           : "cp4_ipv4notation"
                ,id             : "address_ipv4notation"
                ,ipId           : "route_entry"
                ,fieldLabel     : "Address"
                ,notationId     : "mask_entry"
                ,advancedValidation     : true
                ,allowBlank             : false
                ,rejectZero             : true
                ,rejectLoopback         : true
                ,rejectMulticast        : true
                ,rejectGlobalBroadcast  : true
                ,fieldConfig    : {
                    allowBlank  : false
                }
                ,networkMode    : true
            };
        } else {
            notation_cmp = {
                xtype           : "cp4_formpanel"
                ,margin         : 0
                ,padding        : 0
                ,items          : [
                    {
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Address"
                        ,id             : "address_entry"
                        ,name           : "aggregationprefixmask"
                        ,labelWidth     : 100
                        ,width          : 300
                        ,height         : 22
                    },{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "route_entry"
                        ,id             : "route_entry"
                        ,name           : "aggregationprefix"
                        ,labelWidth     : 100
                        ,hidden         : true
                        ,hideLabel      : true
                    },{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "mask_entry"
                        ,id             : "mask_entry"
                        ,name           : "aggregationmask"
                        ,labelWidth     : 100
                        ,hidden         : true
                        ,hideLabel      : true
                    }
                ]
            };
        }

        var contributing_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "c_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "c_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        Ext.getCmp("c_grid").getSelectionModel().deselectAll();
                        CP.route_agg_4.add_c_window();
                    }
                },{
                    text                : "Edit"
                    ,id                 : "c_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("c_grid").getSelectionModel();
                        if(sm.getCount() > 0) {
                            var rec = sm.getLastSelected();
                            if (rec.data.acd_route_all === "true") {
                                sm.deselectAll();
                            }
                            else {
                                CP.route_agg_4.edit_c_window();
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("c_grid");
                        if (g && g.getSelCount) {
                            if (g.getSelCount() != 1) {
                                return true;
                            }
                            var r = g.getSelectionModel().getLastSelected();
                            if (r) {
                                if (r.data.acd_route_all === "true") {
                                    return true;
                                }
                            }
                            else {
                                return true;
                            }
                        }
                        else {
                            return true;
                        }
                        return false;
                    }
                },{
                    text                : "Delete"
                    ,id                 : "c_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("c_grid").getSelectionModel();
                        if(sm.getCount() > 0) {
                            var recs = sm.getSelection();
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                b.delete_contribution(recs[i]);
                            }
                        }
                        Ext.getCmp("ra_save_btn").handle_no_token();
                    }
                    ,delete_contribution: function(rec) {
                        if (rec.data.newrec == true) {
                            Ext.getStore("data_store").remove(rec);
                            return;
                        }

                        var params  = CP.ar_util.getParams();
                        var addr = Ext.getCmp("route_entry").getValue();
                        var mask = CP.route_agg_4.getMaskLength("mask_entry");

                        var prefix     = "routed:instance:"
                                         + CP.ar_util.INSTANCE() + ":aggregate";
                        var a_prefix   = prefix + ":" + addr;
                        var m_prefix   = a_prefix + ":masklen:" + mask;

                        var protocol   = rec.data.acd_protocol;
                        var network    = rec.data.acd_network;
                        var masklen    = rec.data.acd_masklen;
                        var route_all  = rec.data.acd_route_all;

                        var proto_p    = m_prefix + ":proto:" + protocol;

                        if (route_all === "true") {
                            var allPrefix = "all-ipv4-routes";
                            params[proto_p + ":" + allPrefix]              = "";
                            params[proto_p + ":" + allPrefix + ":refines"] = "";
                            params[proto_p + ":" + allPrefix + ":exact"]   = "";
                            params[proto_p + ":" + allPrefix + ":none"]    = "";
                        } else {
                            var net_p   = proto_p + ":network:" + network;
                            var mask_p  = net_p + ":masklen:" + masklen;

                            params[net_p]                = "";
                            params[mask_p]               = "";
                            params[mask_p + ":none"]     = "";
                            params[mask_p + ":exact"]    = "";
                            params[mask_p + ":refines"]  = "";
                        }

                        Ext.getStore("data_store").remove(rec);
                        if (Ext.getStore("data_store")
                               .findExact("acd_protocol", protocol) == -1) {
                            params[proto_p] = "";
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("c_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var c_cm = [
            {
                header          : "Protocol"
                ,dataIndex      : "acd_protocol"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case    "all":          retValue = "All";       break;
                        case    "direct":       retValue = "Direct";    break;
                        case    "static":       retValue = "Static";    break;
                        case    "aggregate":    retValue = "Aggregate"; break;
                        case    "ospf2":        retValue = "OSPF2";     break;
                        case    "ospf2ase":     retValue = "OSPF2ASE";  break;
                        case    "rip":          retValue = "RIP";       break;
                        case    "bgp":          retValue = "BGP";       break;
                        default:
                            return '<div qtip="Invalid" style="background-color:#ff7777;">Invalid</div>';
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                header          : "Contribution"
                ,dataIndex      : "acd_network"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";

                    if (value === "") {
                        retValue = "All IPv4 Routes";
                    }
                    else {
                        retValue = value + "/" + rec.data.acd_masklen;
                    }

                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "acd_matchtype"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";

                    if (rec.data.acd_route_all === "true") {
                        return CP.ar_util.rendererSpecific(retValue, retValue);
                    }

                    switch (value.toLowerCase()) {
                        case "exact":   retValue = "Exact";
                            break;
                        case "refines": retValue = "Refines";
                            break;
                        case "none":    retValue = "None";
                            break;
                        default:        retValue = "";
                    }

                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            }
        ];

        var c_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.route_agg_4.check_user_action();
                }
            }
        });

        var contributing_grid = {
            xtype               : "cp4_grid"
            ,id                 : "c_grid"
            ,width              : 350
            ,height             : 200
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("data_store")
            ,columns            : c_cm
            ,selModel           : c_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("c_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        var ra_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ra_form"
            ,width      : 380
            ,height     : 512
            ,autoScroll : true
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();

                    var rec = null;
                    var sm = Ext.getCmp("ra_grid").getSelectionModel();
                    if(sm.getCount() > 0) {
                        //edit
                        rec = sm.getLastSelected();
                        p.loadRecord(rec);
                        Ext.getCmp("asp_truncate_entry").setValue( rec.data.aggregation_asp_truncate );
                    }
                    CP.route_agg_4.load_data_store(rec);
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("ra_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("c_btnsbar");
                CP.ar_util.checkDisabledBtn("ra_save_btn");
                CP.ar_util.checkDisabledBtn("ra_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "ra_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        if(Ext.getCmp("route_entry").getXType() != "cp4_displayfield") {
                            var aML         = Ext.getCmp("route_entry").getMaskLength();
                            var mML         = CP.route_agg_4.getMaskLength("mask_entry");
                            if(aML > mML) {
                                var msg = "Insufficient Mask Length.";
                                if(CP.global.formatNotation && CP.global.formatNotation == "Dotted") {
                                    msg = "Insufficient Subnet Mask.";
                                }
                                Ext.Msg.alert("Warning", msg);
                                return;
                            }
                        }

                        var params      = CP.ar_util.getParams();
                        var address     = Ext.getCmp("route_entry").getValue();
                        var masklen     = CP.route_agg_4.getMaskLength("mask_entry");
                        var precedence  = Ext.getCmp("rank_entry").getRawValue();
                        if(isNaN(precedence) || parseInt(precedence, 10) < 0 || parseInt(precedence, 10) > 255) {
                            precedence = "";
                        }
                        var preference  = Ext.getCmp("weight_entry").getRawValue();
                        if(isNaN(preference) || parseInt(preference, 10) < 0 || parseInt(preference, 10) > 65535) {
                            preference = "";
                        }
                        var brief       = (Ext.getCmp("asp_truncate_entry").getValue()) ? "t" : "";

                        var prefix      = "routed:instance:" + CP.ar_util.INSTANCE() +":aggregate";
                        var a_prefix    = prefix + ":" + address;
                        var m_prefix    = a_prefix + ":masklen:" + masklen;

                        params[a_prefix]                 = "t";
                        params[m_prefix]                 = "t";
                        params[m_prefix + ":brief"]      = brief;
                        params[m_prefix + ":precedence"] = precedence;
                        params[m_prefix + ":preference"] = preference;

                        var recs = Ext.getStore("data_store").getRange();
                        var proto_p;
                        var net_p;
                        var mask_p;
                        var d, i;
                        for (i = 0; i < recs.length; i++) {
                            d = recs[i].data;
                            proto_p = m_prefix + ":proto:" + d.acd_protocol;
                            params[proto_p] = "t";

                            if (d.acd_route_all === "true") {
                                params[proto_p + ":all-ipv4-routes"] = "t";
                            } else {
                                net_p   = proto_p + ":network:" + d.acd_network;
                                mask_p  = net_p + ":masklen:" + d.acd_masklen;

                                params[net_p]                = "t";
                                params[mask_p]               = "t";
                                params[mask_p + ":none"]     = "";
                                params[mask_p + ":refines"]  = "";
                                params[mask_p + ":exact"]    = "";

                                switch (d.acd_matchtype.toLowerCase()) {
                                    case "refines":
                                        params[mask_p + ":refines"]  = "t";
                                        break;
                                    case "exact":
                                        params[mask_p + ":exact"]    = "t";
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }

                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("ra_form");
                        if (!f) return(true); // invalid form
                        var recs = Ext.getStore("data_store").getRange();
                        if (recs.length <= 0) return(true); // no protocols
                        return(false); // ok
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("ra_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "ra_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler            : function(b) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("ra_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            if(Ext.getCmp("route_entry").getXType() != "cp4_displayfield") {
                                Ext.getCmp("route_entry").validate();
                                Ext.getCmp("mask_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "cp4_formpanel"
                    ,width          : 350
                    ,margin         : "15 0 0 15"
                    ,autoScroll     : false
                    ,items          : [
                        notation_cmp
                        ,{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Rank"
                            ,id             : "rank_entry"
                            ,name           : "aggregation_rank"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,minValue       : 0
                            ,maxValue       : 255
                            ,maxLength      : 3
                            ,enforceMaxLength   : true
                            ,value          : ""
                            ,emptyText      : "Default: 130"
                            ,submitEmptyText: false
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Weight"
                            ,id             : "weight_entry"
                            ,name           : "aggregation_weight"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,minValue       : 0
                            ,maxValue       : 65535
                            ,maxLength      : 5
                            ,enforceMaxLength   : true
                            ,value          : ""
                            ,emptyText      : "Default: 0"
                            ,submitEmptyText: false
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "AS Path Truncate"
                            ,id             : "asp_truncate_entry"
                            ,name           : "aggregation_asp_truncate"
                            ,labelWidth     : 100
                            ,width          : 180
                            ,value          : false
                        },{
                            xtype           : "cp4_sectiontitle"
                            ,titleText      : "Contributing Protocol"
                        }
                        ,contributing_btnsbar
                        ,contributing_grid
                        ,{
                            xtype          : "cp4_inlinemsg"
                            ,type           : "info"
                            ,text: ("You must configure at least one"+
                                    " contributing protocol.")
                        }
                    ]
                }
            ]
        };

        var ra_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ra_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ ra_form ]
        });
        ra_window.show();
    }

    ,add_c_window                       : function() {
        if(Ext.getCmp("network_ipv4notation")) {
            Ext.getCmp("network_ipv4notation").destroy();
        }

        var c_form = {
            xtype       : "cp4_formpanel"
            ,id         : "c_form"
            ,width      : 345
            ,height     : 195
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("c_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("c_save_btn");
                CP.ar_util.checkDisabledBtn("c_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "c_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var st          = Ext.getStore("data_store");
                        var protocol    = Ext.getCmp("protocol_entry")
                                              .getValue();
                        var route_all   = "";
                        var network     = "";
                        var masklen     = "";
                        var matchtype   = "";

                        if (Ext.getCmp("all_entry").getValue()) {
                            route_all = "true";
                        }
                        else {
                            network   = Ext.getCmp("network_entry").getValue();
                            masklen   = CP.route_agg_4
                                          .getMaskLength("masklen_entry");
                            matchtype = Ext.getCmp("matchtype_entry")
                                           .getValue();

                            if (Ext.getCmp("network_entry").getMaskLength()
                                > CP.route_agg_4
                                    .getMaskLength("masklen_entry")) {
                                var msg = "Insufficient Mask Length.";

                                if (CP.global.formatNotation
                                    && CP.global.formatNotation == "Dotted") {
                                    msg = "Insufficient Subnet Mask.";
                                }

                                Ext.Msg.alert("Warning", msg);
                                return;
                            }
                        }

                        var recs = st.getRange();
                        var d, i;
                        for (i = 0; i < recs.length; i++) {
                            d = recs[i].data;
                            if (d.acd_protocol == protocol) {
                                if (route_all === "true") {
                                    if (d.acd_route_all === route_all) {
                                        CP.ar_util.checkWindowClose("c_window");
                                        return;
                                    }
                                } else if (d.acd_network == network
                                           && d.acd_masklen == masklen) {
                                    recs[i].data.acd_matchtype = matchtype;
                                    Ext.getCmp("c_grid").getView().refresh();
                                    CP.ar_util.checkWindowClose("c_window");
                                    return;
                                }
                            }
                        }

                        Ext.getStore("data_store").add({
                            "acd_protocol"      : protocol
                            ,"acd_network"      : network
                            ,"acd_masklen"      : masklen
                            ,"acd_route_all"    : route_all
                            ,"acd_matchtype"    : matchtype
                            ,"newrec"           : true
                        });
                        Ext.getCmp("c_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("c_window");
                        Ext.getCmp("ra_save_btn").handle_no_token();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("c_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("c_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "c_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.checkWindowClose("c_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("protocol_entry").validate();
                            Ext.getCmp("network_entry").validate();
                            Ext.getCmp("masklen_entry").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 0 15"
                    ,autoScroll : false
                    ,width      : 315
                    ,items      : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Protocol"
                            ,id             : "protocol_entry"
                            ,name           : "acd_protocol"
                            ,labelWidth     : 125
                            ,width          : 225
                            ,allowBlank     : false
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [["all"         ,"All"]
                                                ,["direct"      ,"Direct"]
                                                ,["static"      ,"Static"]
                                                ,["aggregate"   ,"Aggregate"]
                                                ,["ospf2"       ,"OSPF2"]
                                                ,["ospf2ase"    ,"OSPF2ASE"]
                                                ,["rip"         ,"RIP"]
                                                ,["bgp"         ,"BGP"]]
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Contribute All IPv4 Routes"
                            ,id             : "all_entry"
                            ,name           : "acd_route_all"
                            ,labelWidth     : 125
                            ,width          : 300
                            ,value          : false
                            ,listeners      : {
                                change          : function(checkbox, newVal, oldVal, eOpts) {
                                    var net         = Ext.getCmp("network_entry");
                                    var mask        = Ext.getCmp("masklen_entry");
                                    var matchtype   = Ext.getCmp("matchtype_entry");

                                    net.setDisabled(newVal);
                                    mask.setDisabled(newVal);
                                    matchtype.setDisabled(newVal);

                                    Ext.getCmp("network_ipv4notation").setVisible(!newVal);
                                    matchtype.setVisible(!newVal);

                                    net.validate();
                                    mask.validate();
                                }
                            }
                        },{
                            xtype           : "cp4_ipv4notation"
                            ,id             : "network_ipv4notation"
                            ,labelWidth     : 125
                            ,width          : 315
                            ,ipId           : "network_entry"
                            //,ipLabel        : "Address"
                            ,ipName         : "acd_network"
                            ,notationId     : "masklen_entry"
                            ,notationName   : "acd_masklen"
                            ,fieldConfig    : {
                                allowBlank  : false
                            }
                            ,networkMode    : true
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Match Type"
                            ,id             : "matchtype_entry"
                            ,name           : "acd_matchtype"
                            ,labelWidth     : 125
                            ,width          : 225
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : "none"
                            ,allowBlank     : false
                            ,store          :   [["none"        ,"None"]
                                                ,["refines"     ,"Refines"]
                                                ,["exact"       ,"Exact"]]
                        }
                    ]
                }
            ]
        };

        CP.route_agg_4.show_c_window(c_form, "Add Contribution Setting");
    }

    ,edit_c_window                      : function() {
        //edit
        var c_form = {
            xtype       : "cp4_formpanel"
            ,id         : "c_form"
            ,width      : 345
            ,height     : 195
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    var rec = Ext.getCmp("c_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    Ext.getCmp("network_masklen_entry").setValue(
                        rec.data.acd_network +"/"+ rec.data.acd_masklen
                    );

                    var protocol_cap = "";
                    switch(rec.data.acd_protocol) {
                        case    "all":          protocol_cap = "All";       break;
                        case    "direct":       protocol_cap = "Direct";    break;
                        case    "static":       protocol_cap = "Static";    break;
                        case    "aggregate":    protocol_cap = "Aggregate"; break;
                        case    "ospf2":        protocol_cap = "OSPF2";     break;
                        case    "ospf2ase":     protocol_cap = "OSPF2ASE";  break;
                        case    "rip":          protocol_cap = "RIP";       break;
                        case    "bgp":          protocol_cap = "BGP";       break;
                        default:                                            break;
                    }
                    Ext.getCmp("protocol_entry").setValue(protocol_cap);
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("c_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("c_save_btn");
                CP.ar_util.checkDisabledBtn("c_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "c_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var matchtype   = Ext.getCmp("matchtype_entry").getValue();

                        var rec = Ext.getCmp("c_grid").getSelectionModel().getLastSelected();
                        rec.data.acd_matchtype = matchtype;
                        Ext.getCmp("c_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("c_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("c_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("c_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "c_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.checkWindowClose("c_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            //none (here in case it needs to overwrite)
                            return;
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 0 15"
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Protocol"
                            ,id             : "protocol_entry"
                            ,labelWidth     : 125
                            ,width          : 225
                            ,height         : 22
                        },{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Address"
                            ,id             : "network_masklen_entry"
                            ,labelWidth     : 125
                            ,width          : 225
                            ,height         : 22
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Match Type"
                            ,id             : "matchtype_entry"
                            ,name           : "acd_matchtype"
                            ,labelWidth     : 125
                            ,width          : 225
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [["none"        ,"None"]
                                                ,["refines"     ,"Refines"]
                                                ,["exact"       ,"Exact"]]
                        }
                    ]
                }
            ]
        };
        CP.route_agg_4.show_c_window(c_form, "Change Match Type");
    }

    ,show_c_window                      : function(c_form, TITLE) {
        var c_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "c_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("ra_window").getPosition();
                    win.setPosition(pos[0], pos[1]);
                }
                ,destroy    : function(win, eOpts) {
                    var form = Ext.getCmp("c_form");
                    if(form) {
                        form.destroy();
                    }
                }
            }
            ,items      : [ c_form ]
        });
        c_window.show();
    }

}

