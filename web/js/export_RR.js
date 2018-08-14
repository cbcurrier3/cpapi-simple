/* Route Redistribution for ExtJS 4
        Notes:
            -- Utilizes store filtering for the "to_proto" combobox.
            ---- to prevent the combobox from clearing the filters of the bound store
                    set the public property "lastQuery" to "" as if it were a configOption
                    (search for ',get_variable_proto_cmp' for an example

            -- Does not check for if a particular entry exists already.
                    Most entries are pretty simple, there isn't much reason to tell the user
                    to close a window when by the time a duplicate can be detected the only
                    changable field is generally the metric.  To support this, save actions
                    try to be robust.
**/

CP.export_4 = {
    INSTANCE                    : "default"
    ,LAST_PUSH                  : ""
    ,LAST_PUSH_PROTO            : ""

    ,default_proto_type         : "rip"

//Shared Globals
    ,MAX_GRID_HEIGHT            : 149           //(22 header) + (1 bottom border) + (21 per row * 6 rows)
                                                //149 (6 rows)
    ,enableColumnResize         : true
    ,COMMUNITY_GRID_HEIGHT      : 86
    ,TO_PROTOCOL_LABEL          : "To Protocol"
    ,GRID_GROUP_TPL             : "To {name}"

    ,LABELWIDTH                 : 125

    //columns
    ,TO_PROTO_WIDTH             : 110
    ,FROM_PROTO_WIDTH           : 215
    ,METRIC_WIDTH               : 75
    ,ACTION_WIDTH               : 75
    ,MATCHTYPE_WIDTH            : 100
    ,MISC_WIDTH                 : 150

//Interface Globals
    ,ALL_INTERFACE_LABEL        : "All"
    ,INTERFACE_GRID_WIDTH       : 400
//Static Globals
    ,ALL_STATIC_LABEL           : "All"
    ,STATIC_GRID_WIDTH          : 400
//Aggregate Globals
    ,ALL_AGGREGATE_LABEL        : "All"
    ,AGGREGATE_GRID_WIDTH       : 400
//RIP Globals
    ,ALL_RIP_LABEL              : "All"
    ,RIP_GRID_WIDTH             : 575
//OSPF2 Globals
    ,ALL_OSPF2_LABEL            : "All"
    ,OSPF2_GRID_WIDTH           : 725
//OSPF2ASE Globals
    ,ALL_OSPF2ASE_LABEL         : "All"
    ,OSPF2ASE_GRID_WIDTH        : 725
//AS_PATH Globals
    ,ALL_AS_PATH_LABEL          : "All"
    ,AS_PATH_GRID_WIDTH         : 725
//AS Globals
    ,ALL_AS_LABEL               : "All"
    ,AS_GRID_WIDTH              : 725

//DEFAULT BGP
    ,BGP_DEFAULT_GRID_WIDTH     : 360
    ,BGP_SHARED_GRID_WIDTH      : 600

    ,MAX_EXPORT_WIDTH           : function() {
        return Math.max(
            CP.export_4.INTERFACE_GRID_WIDTH
            ,CP.export_4.STATIC_GRID_WIDTH
            ,CP.export_4.AGGREGATE_GRID_WIDTH
            ,CP.export_4.RIP_GRID_WIDTH
            ,CP.export_4.OSPF2_GRID_WIDTH
            ,CP.export_4.OSPF2ASE_GRID_WIDTH
            ,CP.export_4.ASPATH_GRID_WIDTH
            ,CP.export_4.AS_GRID_WIDTH
        );
    }

    ,COMMUNITIES_LIST_WIDTH     : 160

    ,PROTO_LIST                 : [
        {
            storeId     : "export_interface_store"
            ,lp         : "direct"
            ,src_proto  : "direct"
        },{
            storeId     : "export_static_store"
            ,lp         : "static"
            ,src_proto  : "static"
        },{
            storeId     : "export_aggregate_store"
            ,lp         : "aggregate"
            ,src_proto  : "aggregate"
        },{
            storeId     : "export_rip_store"
            ,lp         : "rip"
            ,src_proto  : "rip"
        },{
            storeId     : "export_ospf2_store"
            ,lp         : "ospf2"
            ,src_proto  : "ospf2"
        },{
            storeId     : "export_ospf2ase_store"
            ,lp         : "ospf2ase"
            ,src_proto  : "ospf2ase"
        },{
            storeId     : "export_default_bgp_store"
            ,lp         : "default"
            ,src_proto  : "default"
        },{
            storeId     : "export_as_path_store"
            ,lp         : "as_path"
            ,src_proto  : "bgp"
        },{
            storeId     : "export_as_store"
            ,lp         : "as"
            ,src_proto  : "bgp"
        }
    ]

    ,SAME_PROTO_n_REGEX_diff_ORIGIN     : "This regular expression is already in "
                                        + "use to this protocol with a different origin."

////////////////////////////////////////////////////////////////////////////////
//STUB:init
    ,init                       : function() {
        CP.export_4.defineStores();
        var export_configPanel = CP.export_4.configPanel();
        var obj = {
            title           : "Route Redistribution"
            ,panel          : export_configPanel
            ,submitURL      : "/cgi-bin/export_RR.tcl?instance="+ CP.export_4.INSTANCE
            ,params         : {}
            ,afterSubmit    : CP.export_4.afterSubmit
            ,submitFailure  : CP.export_4.afterSubmit
            ,helpFile       : "export_protoHelp.html"
        };
        CP.UI.updateDataPanel(obj);
    }

//renderers
    ,renderer_output            : function(value, tip, align, color) {
        if(!tip) {      tip = value; }
        if(!align) {    align = "left"; }
        if(!color) {    color = "black"; }
        return '<div data-qtip="'+tip+'" style="text-align:'+align+';color:'+color+';white-space:pre-wrap !important;">'+value+'</div>';
    }
    ,renderer_generic           : function(value, meta, rec, row, col, st, view) {
        var retValue = (value === null) ? "" : value;
        return CP.export_4.renderer_output(retValue, retValue, "left", "black");
    }

//STUB:AJAX FUNCTIONS
    ,mySubmit                   : function() {
        if(CP.export_4.get_no_token()) {
            //if locked, skip push and reload
            CP.export_4.afterSubmit();
        } else {
            CP.export_4.set_active_middle_proto_bindings();
            CP.UI.applyHandler( CP.UI.getMyObj() );
        }
    }
    ,afterSubmit                : function() {
        CP.export_4.doLoad();
    }
    ,getParams                      : function() {
        var myObj = CP.UI.getMyObj();
        if(myObj) {
            return (myObj.params);
        }
        return false;
    }
    ,clearParams                    : function() {
        var myObj = CP.UI.getMyObj();

        if(myObj) {
            myObj.params = {};
            return (myObj.params);
        } else {
            return false;
        }
    }
    ,get_no_token                       : function() {
        //returns true if accessMode is read only or the token is -1 or 0
        return (CP.UI && (CP.UI.accessMode == 'ro' || CP.global.token < 1));
    }
    ,set_active_middle_proto_bindings   : function() {
        CP.export_4.filter_to_proto(0);

        var prefix = "routed:instance:"+ CP.export_4.INSTANCE +":export_proto";
        var protos = Ext.getStore("protocols_store").getRange();
        var proto;
        var params = CP.export_4.getParams();
        var i;
        var j;

        for(i = 0; i < protos.length; i++) {
            proto = protos[i].data.proto;
            if(proto == "rip" || proto == "ospf2ase" || proto == CP.export_4.LAST_PUSH_PROTO) {
                params[prefix +":"+ proto]  = "t";
            } else {
                params[prefix +":"+ proto]  = "";
            }
            for(j = 0; j < CP.export_4.PROTO_LIST.length; j++) {
                if(CP.export_4.PROTO_LIST[j].src_proto != proto) {
                    params[prefix +":"+ proto +":proto:"+ CP.export_4.PROTO_LIST[j].src_proto ] = "";
                }
            }
            for(j = 0; j < CP.export_4.PROTO_LIST.length; j++) {
                if( CP.export_4.PROTO_LIST[j].lp == CP.export_4.LAST_PUSH && proto == CP.export_4.LAST_PUSH_PROTO ) {
                    params[prefix +":"+ proto] = "t";
                    params[prefix +":"+ proto +":proto:"+ CP.export_4.PROTO_LIST[j].src_proto ] = "t";
                } else if( Ext.getStore( CP.export_4.PROTO_LIST[j].storeId ).findExact("proto", proto) > -1 ) {
                    params[prefix +":"+ proto] = "t";
                    params[prefix +":"+ proto +":proto:"+ CP.export_4.PROTO_LIST[j].src_proto ] = "t";
                }
            }
        }
    }

//REGEX related
    ,REGEX_SPECIAL_SET  : "()[]{}*+?|,._-^$ <>"
    ,REGEX_REPLACED_SET : "abcdefghijklmnopqrstuvwxyz"

    ,DB_to_REGEX                    : function(db) {
        var retValue = String(db);
        for(var i = 0; i < CP.export_4.REGEX_SPECIAL_SET.length; i++) {
            var r = new RegExp( CP.export_4.REGEX_REPLACED_SET[i] ,"g" );
            retValue = retValue.replace( r, CP.export_4.REGEX_SPECIAL_SET[i] );
        }
        return retValue;
    }
    ,REGEX_to_DB                    : function(regex) {
        var retValue = String(regex);
        for(var i = 0; i < CP.export_4.REGEX_SPECIAL_SET.length; i++) {
            var r = new RegExp( "\\" + CP.export_4.REGEX_SPECIAL_SET[i] ,"g" );
            retValue = retValue.replace( r, CP.export_4.REGEX_REPLACED_SET[i] );
        }
        return retValue;
    }

    ,cleanup_regex                  : function(value) {
        //string consecutive whitespace
        var r = new RegExp("  ", "g");
        value = value.replace( r, " ");

        //strip alphabet
        for(var i = 0; i < CP.export_4.REGEX_REPLACED_SET.length; i++) {
            r = new RegExp( CP.export_4.REGEX_REPLACED_SET[i] ,"gi" );
            value = value.replace(r, "");
        }
        return value;
    }

//STUB:STORE RELATED
    ,proto_mask_sortType        : function(value) {
        if(value == "OSPF") {
            return 1;
        } else if(value == "RIP") {
            return 2;
        }
        return 3 + parseInt( value.replace("BGP AS",""), 10);
    }
    ,defineStores               : function() {
        //protocols that can be exported to (export_proto.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "protocols_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"
                ,{
                    name        : "proto_mask"  //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "proto"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.protos"
                }
            }
            ,sortOnFilter   : false
            ,listeners      : {
                load            : CP.export_4.shared_load_listener
            }
        });

        //need a copy of the above store for the BGP only protocols
        //OR, when the add button is clicked, do a load on the protocols_store and remove all invalid records

        CP.export_4.defineStores_interface();
        CP.export_4.defineStores_static();
        CP.export_4.defineStores_aggregate();
        CP.export_4.defineStores_rip();
        CP.export_4.defineStores_ospf2();
        CP.export_4.defineStores_ospf2ase();
        CP.export_4.defineStores_default_bgp();
        CP.export_4.defineStores_as_path();
        CP.export_4.defineStores_as();
    }
    ,filter_to_proto            : function(mode) {
        //mode:
            //0 - all (clearFilters)
            //1 - filter out rip
            //2 - filter out ospf2ase
            //3 - filter out ospf2ase and rip
            //4 - filter out ospf2ase, rip, and all already configured BGPs
        var st = Ext.getStore("protocols_store");

        st.clearFilter();
        switch(mode) {
            case 1:
                st.filter(function(rec, id) {
                    if(rec.data.proto == "rip") {
                        return false;
                    }
                    return true;
                });
                break;
            case 2:
                st.filter(function(rec, id) {
                    if(rec.data.proto == "ospf2ase") {
                        return false;
                    }
                    return true;
                });
                break;
            case 3:
                st.filter(function(rec, id) {
                    if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                        return false;
                    }
                    return true;
                });
                break;
            case 4:
                st.filter(function(rec, id) {
                    if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                        return false;
                    }
                    if(Ext.getStore("export_default_bgp_store").findExact("proto",rec.data.proto) != -1) {
                        return false;
                    }
                    return true;
                });
                break;
            default:
        }
    }
    ,shared_load_listener           : function() {
        var protocols_store = Ext.getStore("protocols_store");
        var export_default_bgp_store = Ext.getStore("export_default_bgp_store");

        if(protocols_store.getCount() > 0) {
            //control add button for default bgp routes
            if(export_default_bgp_store) {
                var non_def_BGP_cnt = 0;
                var recs = protocols_store.getRange();
                var p;
                for(var i = 0; i < recs.length; i++) {
                    p = recs[i].data.proto;
                    if(p == "rip" || p == "ospf2ase") {
                        //do nothing
                    } else if( export_default_bgp_store.findExact("proto", p) == -1) {
                        non_def_BGP_cnt++;
                    }
                }
                Ext.getCmp("bgp_def_add_btn").setDisabled( non_def_BGP_cnt < 1 );
            }
        }
    }

    ,defineStores_interface     : function() {
        if( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["ir_grid"];
            CP.intf_state.defineStore( CP.export_4.INSTANCE, grids_to_refresh_list );
        }

        //existing interfaces (intf-list.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_INTERFACE_LABEL) {
                            return "A";
                        }
                        if(value == "lo" || value == "loopback") {
                            return "zzz"+ value;
                        }
                        return value;
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"ipVersion"    : "ipv4"
                    ,"excludeType"  : "6in4 6to4 loopback"
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
                load        : function(st, recs, success, op, eOpts) {
                    if(st.findExact("intf", CP.export_4.ALL_INTERFACE_LABEL) == -1) {
                        st.insert(0, {"intf"  : CP.export_4.ALL_INTERFACE_LABEL});
                    }
                }
            }
        });

        //configured interfaces (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_interface_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                },{
                    name        : "intf"         //interface (or "All Interfaces")
                    ,sortType   : function(value) {
                        if(value == "lo" || value == "loopback") {
                            return "ZZZZ";
                        }
                        if(value == CP.export_4.ALL_INTERFACE_LABEL) {
                            return "a";
                        }
                        return value;
                    }
                }
                ,"metric"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "interface"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.intfs"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });

    }

    ,defineStores_static        : function() {
        //existing static routes (static-route.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "static_list_store"
            ,fields     : [
                "routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/static-route.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.sroutes"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    if(st.findExact("routemask", CP.export_4.ALL_STATIC_LABEL) == -1) {
                        st.insert(0, {
                            "routemask" : CP.export_4.ALL_STATIC_LABEL
                            ,"route"    : CP.export_4.ALL_STATIC_LABEL
                            ,"mask"     : ""
                        });
                    }
                }
            }
        });

        //configured statics (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_static_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "static"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.statics"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_aggregate     : function() {
        //existing aggregate-routes (route_aggregation.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "aggregate_list_store"
            ,fields     : [
                {
                    name        : 'aggregationprefix'
                    ,sortType   : function(value) {
                        if(value == "default") {
                            return 0;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,'aggregationmask'
                ,'aggregationprefixmask'
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/route_aggregation.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.aggregation"
                }
            }
            ,sorters    : [
                {
                    property    : "aggregationprefix"
                    ,direction  : "ASC"
                }
            ]
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    if(st.findExact("routemask", CP.export_4.ALL_AGGREGATE_LABEL) == -1) {
                        st.insert(0, {
                            "aggregationprefixmask" : CP.export_4.ALL_AGGREGATE_LABEL
                            ,"aggregationprefix"    : CP.export_4.ALL_AGGREGATE_LABEL
                            ,"aggregationmask"      : ""
                        });
                    }
                }
            }
        });

        //configured redistributed aggregate routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_aggregate_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "aggregate"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.aggregates"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_rip           : function() {
        //configured redistributed rip routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_rip_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
                ,"filtertype"
                ,"between"
                ,"and"
                ,"restrict"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "rip"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rips"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_ospf2         : function() {
        //configured redistributed ospf2 routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_ospf2_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
                ,"filtertype"
                ,"between"
                ,"and"
                ,"restrict"
                ,"riptag"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "ospf2"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.ospf2s"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_ospf2ase      : function() {
        //configured redistributed ospf2ase routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_ospf2ase_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
                ,"filtertype"
                ,"between"
                ,"and"
                ,"restrict"
                ,"riptag"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "ospf2ase"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.ospf2ases"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_default_bgp   : function() {
        //configured redistributed ospf2ase routes (export_RR.tcl)
        //must be enabled
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_default_bgp_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "proto"
                    ,sortType   : function(v) {
                        var value = v.replace("bgp:as:","");
                        return parseInt(value, 10);
                    }
                },{
                    name        : "proto_mask"
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"all"              //prefix + ":all"
                ,"metric"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "just_default_bgp"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.default_bgps"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
            ,listeners  : {
                load        : CP.export_4.shared_load_listener
            }
        });

        //all bgps will have the following
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_shared_bgp_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "proto"
                    ,sortType   : function(v) {
                        var value = v.replace("bgp:as:","");
                        return parseInt(value, 10);
                    }
                },{
                    name        : "proto_mask"
                    ,sortType   : CP.export_4.proto_mask_sortType
                },{
                    name    :"med"          //prefix + ":metric"
                    ,type   : "int"         //Multi-Exit Discriminator
                },{
                    name    : "localpref"   //prefix + ":localpref"
                    ,type   : "int"         //Assigns a BGP local preference to the imported route.
                }
                ,"com_enabled"      //no push, just a fetch
                ,"match_list"       //prefix + ":aspathopt:community"
                ,"append_enable"    //prefix + ":modaspath"
                ,"append_list"      //prefix + ":modaspath:community"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "communities"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.shared_bgps"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "community_match_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "community"
                ,"as"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "community_append_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "community"
                ,"as"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });
    }
    ,load_community_stores      : function(rec) {
        var match_store     = Ext.getStore("community_match_store");
        var append_store    = Ext.getStore("community_append_store");
        if(rec == null || rec == undefined) {
            if(match_store) {
                match_store.removeAll();
            }
            if(append_store) {
                append_store.removeAll();
            }
        } else {
            if(match_store) {
                match_store.loadData( rec.data.match_list );
            }
            if(append_store) {
                append_store.loadData( rec.data.append_list );
            }
        }
    }

    ,defineStores_as_path       : function() {
        //configured redistributed as_path routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_as_path_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"regex_origin_proto"
                ,"regex"        //raw db version
                ,"origin"       //origin
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
                ,"filtertype"
                ,"between"
                ,"and"
                ,"restrict"
                ,"riptag"
                ,"ospfautomatictag"
                ,"ospfautomatictagvalue"
                ,"ospfmanualtag"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "as_path"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.as_paths"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

    ,defineStores_as            : function() {
        //configured bgp peer groups (bgp.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "as_store"
            ,autoLoad   : true
            ,fields     : [
                {
                    name    : "AS"
                    ,type   : "int"
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bgp.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "ASLIST"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.ASLIST"
                }
            }
            ,sorters    : [{
                property    : "AS"
                ,direction  : "ASC"
            }]
        });

        //configured redistributed as routes (export_RR.tcl)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "export_as_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"         //protocol
                ,{
                    name        : "proto_mask"   //pretty form of protocol
                    ,sortType   : CP.export_4.proto_mask_sortType
                }
                ,"as_proto"
                ,{
                    name        : "as"
                    ,type       : "int"
                }
                ,"routemask"
                ,{
                    name        : "route"
                    ,sortType   : function(value) {
                        if(value == CP.export_4.ALL_STATIC_LABEL) {
                            return 0;
                        }
                        if(value == "default") {
                            return 1;
                        }
                        var gw_p = value.split(".");
                        var retval = 1;
                        for( var i = 0; i < gw_p.length ; i++ ) {
                            retval = parseInt(retval) * 1000 + parseInt(gw_p[i]);
                        }
                        return retval;
                    }
                }
                ,"mask"
                ,"metric"
                ,"filtertype"
                ,"between"
                ,"and"
                ,"restrict"
                ,"riptag"
                ,"ospfautomatictag"
                ,"ospfautomatictagvalue"
                ,"ospfmanualtag"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/export_RR.tcl"
                ,extraParams    : {
                    "instance"      : CP.export_4.INSTANCE
                    ,"option"       : "as"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.as_list"
                }
            }
            ,sorters    : [{
                property    : "proto_mask"
                ,direction  : "ASC"
            }]
        });
    }

//END OF STORES
////////////////////////////////////////////////////////////////////////////////

//STUB:CONFIG PANEL
    ,configPanel                : function() {
        var export_configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "export_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.export_4.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("export_proto"),
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,items      : [
                        CP.export_4.export_interface()
                        ,CP.export_4.export_static()
                        ,CP.export_4.export_aggregate()
                        ,CP.export_4.export_rip()
                        ,CP.export_4.export_ospf2()
                        ,CP.export_4.export_ospf2ase()
                        ,CP.export_4.export_as_path()
                        ,CP.export_4.export_as()
                        ,CP.export_4.export_default_bgp()
                        ,CP.export_4.export_shared_bgp()
                    ]
                }
            ]
        });
        return export_configPanel;
    }

//STUB:DOLOAD
    ,doLoad                     : function() {
        if(CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.export_4.INSTANCE );
        }
        CP.export_4.clearParams();
            //protocols
        Ext.getStore("protocols_store").load({params: {"instance": CP.export_4.INSTANCE}});
            //default bgp
        Ext.getStore("export_default_bgp_store").load({params: {"instance": CP.export_4.INSTANCE}});    //necessary since there is a comparison listener
        switch(CP.export_4.LAST_PUSH) {
            case "direct":
            case "interface":   Ext.getStore("export_interface_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "static":      Ext.getStore("export_static_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "aggregate":   Ext.getStore("export_aggregate_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "rip":         Ext.getStore("export_rip_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "ospf2":       Ext.getStore("export_ospf2_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "ospf2ase":    Ext.getStore("export_ospf2ase_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "default":     //do nothing else
                break;
            case "shared":      Ext.getStore("export_shared_bgp_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "as_path":     Ext.getStore("export_as_path_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            case "as":          Ext.getStore("export_as_store").load({params: {"instance": CP.export_4.INSTANCE}});
                break;
            default:
                    //interface stores
                Ext.getStore("export_interface_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //static stores
                Ext.getStore("export_static_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //aggregate stores
                Ext.getStore("export_aggregate_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //rip stores
                Ext.getStore("export_rip_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //ospf2 stores
                Ext.getStore("export_ospf2_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //ospf2ase stores
                Ext.getStore("export_ospf2ase_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //default_bgp
                //Ext.getStore("export_default_bgp_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //shared_bgp
                Ext.getStore("export_shared_bgp_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //as_path stores
                Ext.getStore("export_as_path_store").load({params: {"instance": CP.export_4.INSTANCE}});
                    //as stores
                Ext.getStore("export_as_store").load({params: {"instance": CP.export_4.INSTANCE}});
        }
        CP.export_4.LAST_PUSH       = "";
        CP.export_4.LAST_PUSH_PROTO = "";
    }

////////////////////////////////////////////////////////////////////////////////
//common functions for the routes
    ,manage_metric              : function(to_proto) {
        var metricCmp       = Ext.getCmp("metric");
        if(!metricCmp)          { return; }
        var newMax          = 16777215;
        var newAllowBlank   = true;
        if(!to_proto) {
            if(Ext.getCmp("to_proto")) {
                to_proto = Ext.getCmp("to_proto").getValue();
            }
            if(!to_proto) { return };
        }
        if(to_proto == "rip") {
            newMax          = 16;
        }
        metricCmp.setMaxValue(newMax);
        metricCmp.initialConfig.maxValue = newMax;
        metricCmp.maxLength = String(newMax).length;
        if(metricCmp.enforceMaxLength) {
            metricCmp.inputEl.dom.maxLength = String(newMax).length;
        }
        metricCmp.enforceMaxLength = true;
        metricCmp.validate();

        var from_proto_cmp  = Ext.getCmp("from_proto");
        if(!from_proto_cmp)     { return; }
        var from_proto      = from_proto_cmp.getValue();
        if(from_proto == "")    {
            //do nothing
            //return;
        } else if(to_proto == "rip") {
            //TODO - figure out which to/from proto combos are allowBlank: false
            var no_metric = true;
            var yes_metric = false;
            //use the rip needs metric logic as the comments in xpand suggest?
            var use_rip_needs_metric = true;

            switch( String(from_proto).toLowerCase() ) {
                case "direct":
                case "interface":
                case "rip":
                    newAllowBlank = no_metric;
                    break;
                case "static":
                    var from_static = Ext.getCmp("from_static");
                    if(from_static && String(from_static.getValue()).toLowerCase() == "default") {
                        newAllowBlank = (use_rip_needs_metric ? yes_metric : no_metric);
                        break;
                    }
                    newAllowBlank = (use_rip_needs_metric ? yes_metric : yes_metric);
                    break;
                case "aggregate":
                case "ospf2":
                case "ospf2ase":
                    newAllowBlank = (use_rip_needs_metric ? yes_metric : yes_metric);
                    break;
                case "as":
                case "as_path":
                    //xpand doesn't properly test for the two bgp protocols yet
                    //but based on a rather specific comment, looks like this should be required
                    newAllowBlank = (use_rip_needs_metric ? yes_metric : no_metric);
                    break;
                default:
            }
        }
        metricCmp.allowBlank = newAllowBlank;
        metricCmp.validate();
    }

    ,get_from_proto_cmp         : function() {
        return {
            xtype           : "cp4_textfield"
            ,hideLabel      : true
            ,hidden         : true
            ,id             : "from_proto"
            ,width          : 250
        };
    }
    ,set_from_proto             : function(proto_string) {
        //assume proto_string is valid?
        var from_proto = Ext.getCmp("from_proto");
        if(from_proto) {
            from_proto.setValue(proto_string);
        }
    }
        //CP.export_4.get_variable_proto_cmp();
        //CP.export_4.get_constant_proto_cmp();
    ,get_variable_proto_cmp     : function() {
        return {
            xtype           : "cp4_formpanel"
            ,margin         : 0
            ,padding        : 0
            ,width          : 280
            ,items          : [
                {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : CP.export_4.TO_PROTOCOL_LABEL
                    ,id             : "to_proto"
                    ,name           : "proto"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;margin-right:15px;"
                    ,queryMode      : "local"
                    ,lastQuery      : ""
                    ,mode           : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,store          : Ext.getStore("protocols_store")
                    ,valueField     : "proto"
                    ,displayField   : "proto_mask"
                    ,allowBlank     : false
                    ,listeners      : {
                        select          : function(combo, recs, eOpts) {
                            var to_proto = Ext.getCmp("to_proto").getValue();

                            CP.export_4.manage_metric(to_proto);

                            var riptag      = Ext.getCmp("riptag");
                            if(riptag) {
                                riptag.setDisabled( to_proto != "rip" );
                                riptag.setVisible( to_proto == "rip" );
                            }

                            //code for ospf tags
                            var ospf_tags   = Ext.getCmp("ospf_tag_form");
                            if(ospf_tags) {
                                ospf_tags.setDisabled( to_proto != "ospf2ase" );
                                ospf_tags.setVisible( to_proto == "ospf2ase" );
                            }

                            var regex_display = Ext.getCmp("regex_display");
                            var origin_entry = Ext.getCmp("origin_entry");
                            if(regex_display) {
                                regex_display.validate();
                                origin_entry.validate();
                            }
                        }
                    }
                }
                ,CP.export_4.get_from_proto_cmp()
            ]
        };
    }

    ,get_constant_proto_cmp     : function() {
        //returns formpanel
        return {
            xtype           : "cp4_formpanel"
            ,margin         : 0
            ,padding        : 0
            ,width          : 280
            ,items          : [
                {
                    //display       (what is seen)
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : CP.export_4.TO_PROTOCOL_LABEL
                    ,id             : "to_proto_mask"
                    ,name           : "proto_mask"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-left:15px;margin-right:15px;"
                },{
                    //"true" value  (used in bindings)
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "true proto"
                    ,id             : "to_proto"
                    ,name           : "proto"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;margin-right:15px;"
                    ,hidden         : true
                    ,hideLabel      : true
                }
                ,CP.export_4.get_from_proto_cmp()
            ]
        };
    }

    ,get_variable_notation_cmp  : function() {
        var n = Ext.getCmp("export_ipv4notation");
        if(n) { n.destroy(); }
        var r_cmp = Ext.getCmp("route_entry");
        if(r_cmp) { r_cmp.destroy(); }
        var m_cmp = Ext.getCmp("mask_entry");
        if(m_cmp) { m_cmp.destroy(); }

        var nCmp;
        if(CP.global.formatNotation) {
            if(CP.global.formatNotation == "Length") {
                nCmp = {
                    xtype           : "cp4_ipv4notation"
                    ,id             : "export_ipv4notation"
                    //fieldlabel of route
                    //,ipLabel        : "From Address"
                    ,ipId           : "route_entry"
                    ,ipName         : "route"
                    //fieldlabel of mask
                    //,notationLabel  : "Mask"
                    ,notationId     : "mask_entry"
                    ,notationName   : "mask"
                    ,fieldConfig    : {
                        allowBlank  : false
                    }
                    ,networkMode    : true
                    //figure out how to entirely overwrite the fieldLabel
                    //figure out how to set labelWidth to 125
                };
            } else if(CP.global.formatNotation && CP.global.formatNotation == "Dotted") {
                nCmp = {
                    xtype           : "cp4_ipv4notation"
                    ,id             : "export_ipv4notation"
                    //fieldlabel of route
                    //,ipLabel        : "From Address"
                    ,ipId           : "route_entry"
                    ,ipName         : "route"
                    //fieldlabel of mask
                    //,notationLabel  : "Subnet Mask"
                    ,notationId     : "mask_entry"
                    ,notationName   : "mask"
                    ,fieldConfig    : {
                        allowBlank  : false
                    }
                    ,networkMode    : true
                    //figure out how to set labelWidth to 125
                    //figure out how to make sure the width is sufficient to support that
                };
            }
        } else {
            nCmp = { //generic version
                xtype           : "cp4_ipv4notation"
                ,id             : "export_ipv4notation"
                ,ipId           : "route_entry"
                ,ipName         : "route"
                ,notationId     : "mask_entry"
                ,notationName   : "mask"
                ,fieldConfig    : {
                    allowBlank  : false
                }
                ,networkMode    : true
            };
        }

        return {
            xtype       : "cp4_formpanel"
            ,id         : "notation_form"
            ,margin     : 0
            ,listeners  : {
                disable         : function(p, eOpts) {
                    Ext.getCmp("route_entry").validate();
                    Ext.getCmp("mask_entry").validate();
                }
                ,enable         : function(p, eOpts) { p.fireEvent("disable"); }
                ,afterrender    : function(p, eOpts) {
                    var i;
                    var r = Ext.getCmp("route_entry");
                    var m = Ext.getCmp("mask_entry");
                    var func = function() {
                        Ext.getCmp("route_entry").validate();
                        Ext.getCmp("mask_entry").validate();
                        if(Ext.getCmp("between_entry")) {   Ext.getCmp("between_entry").validate(); }
                        if(Ext.getCmp("and_entry")) {       Ext.getCmp("and_entry").validate(); }
                    }
                    for(i = 0; i < r.octets.length; i++) {
                        r.octets[i].addListener("blur", func);
                        r.octets[i].addListener("change", func);
                    }
                    if(m.getXType() == "cp4_masklength") {
                        m.addListener("blur", func);
                        m.addListener("change", func);
                    } else {
                        if(m.octets) {
                            for(i = 0; i < m.octets.length; i++) {
                                m.octets[i].addListener("blur", func);
                                m.octets[i].addListener("change", func);
                            }
                        }
                    }
                }
            }
            ,items      : [ nCmp ]
        };
    }

    ,get_constant_notation_cmp  : function(fieldLabelValue) {
        var r_cmp = Ext.getCmp("route_entry");
        if(r_cmp) { r_cmp.destroy(); }
        var m_cmp = Ext.getCmp("mask_entry");
        if(m_cmp) { m_cmp.destroy(); }

        return {
            xtype   : "cp4_formpanel"
            ,id     : "notation_form"
            ,width  : 250
            ,margin : 0
            ,items  : [
                {
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : fieldLabelValue
                    ,id         : "routemask_entry"
                    ,name       : "routemask"
                    ,labelWidth : CP.export_4.LABELWIDTH
                    ,width      : 250
                    ,height     : 22
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "route_entry"
                    ,id         : "route_entry"
                    ,name       : "route"
                    ,labelWidth : CP.export_4.LABELWIDTH
                    ,width      : 250
                    ,height     : 22
                    ,hidden     : true
                    ,hideLabel  : true
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "mask_entry"
                    ,id         : "mask_entry"
                    ,name       : "mask"
                    ,labelWidth : CP.export_4.LABELWIDTH
                    ,width      : 250
                    ,height     : 22
                    ,hidden     : true
                    ,hideLabel  : true
                }
            ]
        }
    }

    ,getMaskLength          : function(cmpString) {
        //Ext.getCmp("mask_entry").getMaskLength();
        //Ext.getCmp("mask_entry").getValue();
        var c = Ext.getCmp(cmpString);
        if(c) {
            return c.getMaskLength ? c.getMaskLength() : c.getValue();
        }
        return "";
    }

        //CP.export_4.get_ospf_tag_form()
            //"ospfautomatictag_entry"
            //"ospfautomatictagvalue_entry"
            //"ospfmanualtag_entry"
    ,get_ospf_tag_form          : function(mode) {
        //mode == "as" or "as_path"
        var ospf_show_listener;
        var as_show_listener        = function(p, eOpts) {
            //as_proto
            var from_bgp    = String(Ext.getCmp("from_bgp").getValue());
            var to_proto    = String(Ext.getCmp("to_proto").getValue());
            var as_proto    = String(from_bgp + to_proto);
            var ospf_f      = Ext.getCmp("ospf_tag_form");
            var rec;
            var st          = Ext.getStore("export_as_store");
            if(to_proto == "ospf2ase") {
                rec = st.findRecord("as_proto", as_proto, 0, false, true, true);
                if(rec) { ospf_f.loadRecord(rec); }
            }
        }

        var as_path_show_listener   = function(p, eOpts) {
            //regex_origin_proto
            var regex       = String(Ext.getCmp("regex_entry").getValue());
            var origin      = String(Ext.getCmp("origin_entry").getValue());
            var to_proto    = String(Ext.getCmp("to_proto").getValue());

            if(regex == "" || origin == "" || to_proto != "ospf2ase") {
                return;
            }

            var regex_origin_proto  = String(regex + origin + to_proto);
            var ospf_f  = Ext.getCmp("ospf_tag_form");
            var st      = Ext.getStore("export_as_path_store");
            var rec = st.findRecord("regex_origin_proto", regex_origin_proto, 0, false, true, true);
            if(rec) {
                ospf_f.loadRecord(rec);
            }
        }

        if(mode == "as") {
            ospf_show_listener  = as_show_listener;
        } else if(mode == "as_path") {
            ospf_show_listener  = as_path_show_listener;
        }

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_tag_form"
            ,layout     : "column"
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : false
            ,width      : 545
            ,listeners  : {
                show        : ospf_show_listener
            }
            ,items      : [
                {
                    xtype               : "cp4_checkbox"
                    ,fieldLabel         : "Enable Automatic Tag"
                    ,id                 : "ospfautomatictag_entry"
                    ,name               : "ospfautomatictag"
                    ,labelWidth         : CP.export_4.LABELWIDTH
                    ,width              : 250
                    ,height             : 22
                    ,style              : "margin-left:15px;margin-right:15px;"
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Arbitrary Tag"
                    ,id                 : "ospfautomatictagvalue_entry"
                    ,name               : "ospfautomatictagvalue"
                    ,labelWidth         : CP.export_4.LABELWIDTH
                    ,width              : 250
                    ,style              : "margin-left:15px;"
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 4095
                    ,maxLength          : 4
                    ,enforceMaxLength   : true
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Manual Tag"
                    ,id                 : "ospfmanualtag_entry"
                    ,name               : "ospfmanualtag"
                    ,labelWidth         : CP.export_4.LABELWIDTH
                    ,width              : 250
                    ,style              : "margin-left:15px;"
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 1
                    ,maxValue           : 2147483647
                    ,maxLength          : 10
                    ,enforceMaxLength   : true
                }
            ]
        };
    }

////////////////////////////////////////////////////////////////////////////////
//STUB:INTERFACE
    ,export_interface           : function() {
        var interface_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "ir_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("ir_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(0);
                        CP.export_4.open_interface_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "ir_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_interface_window
                },{
                    text        : "Delete"
                    ,id         : "ir_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_interface
                }
            ]
        };

        function before_open_interface_window() {
            var sm = Ext.getCmp("ir_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                var T = "Edit Redistribution of "+ rec.data.intf +" to "+ rec.data.proto_mask;
                CP.export_4.open_interface_window(T);
            }
        }

        function before_delete_interface() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("ir_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_interface(recs[i]);
                }
                CP.export_4.LAST_PUSH = "direct";
                CP.export_4.mySubmit();
            }
        }

        function delete_interface(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var from_intf   = rec.data.intf;
            var metric      = rec.data.metric;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:direct";

            if(from_intf == CP.export_4.ALL_INTERFACE_LABEL) {
                params[prefix +":all"]          = "";
                params[prefix +":all:metric"]   = "";
            } else {
                params[prefix +":interface:"+ from_intf]            = "";
                params[prefix +":interface:"+ from_intf +":metric"] = "";
            }
            Ext.getStore("export_interface_store").remove(rec);
            if(Ext.getStore("export_interface_store").findExact("proto",to_proto) == -1) {
                params[prefix]  = "";
            }
        }

        var interface_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "From Interface"
                ,dataIndex      : "intf"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var rawvalue = (value == CP.export_4.ALL_INTERFACE_LABEL) ? "" : String(value);
                    return CP.intf_state.renderer_output(
                        String(value)
                        ,String(value)
                        ,"left"
                        ,"black"
                        ,rawvalue
                        ,"ipv4"
                        ,CP.export_4.INSTANCE
                    );
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value == "") ? "" : value;
                    return CP.export_4.renderer_generic(retValue, meta, rec, row, col, st, view);
                }
            }
        ];

        var interface_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("ir_add_btn");
                    var e_btn = Ext.getCmp("ir_edit_btn");
                    var d_btn = Ext.getCmp("ir_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var interface_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ir_grid"
            ,width              : CP.export_4.INTERFACE_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_interface_store")
            ,columns            : interface_cm
            ,selModel           : interface_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_interface_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_interface_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute Interfaces"
                }
                ,interface_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ interface_grid ]
                }
            ]
        };
    }

    ,open_interface_window      : function(TITLE) {
        var intf_cmp;
        var proto_cmp;
        if(TITLE == "add") {

            TITLE = "Redistribute Interface";
            intf_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "From Interface"
                ,id             : "from_intf"
                ,name           : "intf"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,style          : "margin-left:15px;margin-right:15px;"
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
            };
            proto_cmp = CP.export_4.get_variable_proto_cmp();

        } else {

            intf_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "From Interface"
                ,id             : "from_intf"
                ,name           : "intf"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;margin-right:15px;"
            };
            proto_cmp = CP.export_4.get_constant_proto_cmp();

        }

        function ir_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("interface");

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("ir_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                CP.export_4.manage_metric(rec.data.proto);

                if(rec.data.metric == "") {
                    Ext.getCmp("metric").setRawValue("");
                }
                Ext.getCmp("metric").validate();

            } else {
                //add
                Ext.getCmp("to_proto").validate();
                Ext.getCmp("from_intf").validate();
                CP.export_4.manage_metric(CP.export_4.default_proto_type);
                Ext.getCmp("metric").validate();

            }
        }

        var ir_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ir_form"
            ,width      : 280
            ,autoScroll : false
            ,listeners  : {
                afterrender : ir_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "ir_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("ir_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        ir_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        //TODO UNCOMMENT
                        //Ext.getStore("protocols_store").load();
                        Ext.getCmp("ir_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,proto_cmp
                ,intf_cmp
                ,{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Metric"
                    ,id             : "metric"
                    ,name           : "metric"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,allowBlank     : true
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxLength      : 8
                    ,enforceMaxLength   : true
                    ,style          : "margin-left:15px;margin-right:15px;"
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                }
            ]
        };

        var ir_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ir_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ ir_form ]
        });
        ir_window.show();

        function ir_save() {
            var params = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var from_intf   = Ext.getCmp("from_intf").getValue();
            var metric      = Ext.getCmp("metric").getRawValue();

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;
            var prefix      = p_prefix +":proto:direct";

            params[prefix]  = "t";

            if(from_intf == CP.export_4.ALL_INTERFACE_LABEL) {
                params[prefix +":all"]          = "t";
                params[prefix +":all:metric"]   = metric;
            } else {
                params[prefix +":interface:"+ from_intf]            = "t";
                params[prefix +":interface:"+ from_intf +":metric"] = metric;
            }
            Ext.getCmp("ir_window").close();
            CP.export_4.LAST_PUSH = "direct";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

////////////////////////////////////////////////////////////////////////////////
//STUB:STATIC
    ,export_static              : function() {
        var static_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "sr_add_btn"
                    ,handler    : function(b, e) {
                        if(CP.export_4.get_no_token()) { return; }
                        Ext.getCmp("sr_grid").getSelectionModel().deselectAll();
                        CP.export_4.filter_to_proto(0);
                        CP.export_4.open_static_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "sr_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_static_window
                },{
                    text        : "Delete"
                    ,id         : "sr_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_static
                }
            ]
        };

        function before_open_static_window() {
            var sm = Ext.getCmp("sr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                var T = "Edit Redistribution of "+ rec.data.routemask +" to "+ rec.data.proto_mask;
                CP.export_4.open_static_window(T);
            }
        }

        function before_delete_static() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("sr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_static(recs[i]);
                }
                CP.export_4.LAST_PUSH = "static";
                CP.export_4.mySubmit();
            }
        }

        function delete_static(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:static";

            var s_prefix    = "";
            if(route == CP.export_4.ALL_STATIC_LABEL) {
                s_prefix    = prefix +":all";
            } else if(route == "default") {
                s_prefix    = prefix +":default";
            } else {
                params[prefix +":network:"+ route]  = "";
                s_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[s_prefix]                = "";
            params[s_prefix +":metric"]     = "";
            params[s_prefix +":exact"]      = "";
            //params[s_prefix +":filtertype"] = "";

            Ext.getStore("export_static_store").remove(rec);
            if(Ext.getStore("export_static_store").findExact("proto",to_proto) == -1) {
                params[prefix]  = "";
            }
        }

        var static_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "From Static Route"
                ,dataIndex      : "routemask"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            }
        ];

        var static_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("sr_add_btn");
                    var e_btn = Ext.getCmp("sr_edit_btn");
                    var d_btn = Ext.getCmp("sr_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var static_grid = {
            xtype               : "cp4_grid"
            ,id                 : "sr_grid"
            ,width              : CP.export_4.STATIC_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_static_store")
            ,columns            : static_cm
            ,selModel           : static_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_static_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_static_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute Static Routes"
                }
                ,static_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ static_grid ]
                }
            ]
        };
    }

    ,open_static_window         : function(TITLE) {
        var static_cmp;
        var proto_cmp;
        if(TITLE == "add") {

            TITLE = "Redistribute Static Route";
            static_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "From Static Route"
                ,id             : "from_static"
                ,name           : "routemask"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,style          : "margin-left:15px;margin-right:15px;"
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("static_list_store")
                ,valueField     : "routemask"
                ,displayField   : "routemask"
                ,allowBlank     : false
                ,listeners      : {
                    change          : function(cb, newVal, oldVal, eOpts) {
                        CP.export_4.manage_metric();
                    }
                }
            };
            proto_cmp = CP.export_4.get_variable_proto_cmp();

        } else {

            static_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "From Static Route"
                ,id             : "from_static"
                ,name           : "routemask"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;margin-right:15px;"
            };
            proto_cmp = CP.export_4.get_constant_proto_cmp();

        }

        function sr_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("static");

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("sr_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                CP.export_4.manage_metric(rec.data.proto);

                if(rec.data.metric == "") {
                    Ext.getCmp("metric").setRawValue("");
                }
                Ext.getCmp("metric").validate();

            } else {
                //add
                Ext.getCmp("to_proto").validate();
                Ext.getCmp("from_static").validate();
                CP.export_4.manage_metric(CP.export_4.default_proto_type);
                Ext.getCmp("metric").validate();
            }
        }

        var sr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "sr_form"
            ,width      : 280
            ,autoScroll : false
            ,listeners  : {
                afterrender : sr_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "sr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("sr_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        sr_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        //TODO UNCOMMENT
                        //Ext.getStore("protocols_store").load();
                        Ext.getCmp("sr_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,proto_cmp
                ,static_cmp
                ,{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Metric"
                    ,id             : "metric"
                    ,name           : "metric"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,allowBlank     : true
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxLength      : 8
                    ,enforceMaxLength   : true
                    ,style          : "margin-left:15px;margin-right:15px;"
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                }
            ]
        };

        var sr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "sr_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ sr_form ]
        });
        sr_window.show();

        function sr_save() {
            var params = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var routemask   = Ext.getCmp("from_static").getValue() + "/";
                routemask   = routemask.split("/");
            var route       = routemask[0];
            var mask        = routemask[1];
            var metric      = Ext.getCmp("metric").getRawValue();

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:static";

            var s_prefix    = "";
            if(route == CP.export_4.ALL_STATIC_LABEL) {
                s_prefix    = prefix +":all";
            } else if(route == "default" || route == "Default") {
                s_prefix    = prefix +":default";
            } else {
                params[prefix +":network:"+ route] = "t";
                s_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
                params[s_prefix +":exact"]      = "t";
            }
            params[prefix]                  = "t";
            params[s_prefix]                = "t";
            params[s_prefix +":metric"]     = metric;
            //TODO, only do for network?
            //params[s_prefix +":exact"]      = "t";

            params[s_prefix +":filtertype"] = "exact";
            Ext.getCmp("sr_window").close();
            CP.export_4.LAST_PUSH = "static";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

////////////////////////////////////////////////////////////////////////////////
//STUB:AGGREGATE
    ,export_aggregate           : function() {
        var aggregate_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "ar_add_btn"
                    ,handler    : function(b, e) {
                        if(CP.export_4.get_no_token()) { return; }
                        Ext.getCmp("ar_grid").getSelectionModel().deselectAll();
                        CP.export_4.filter_to_proto(0);
                        CP.export_4.open_aggregate_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "ar_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_aggregate_window
                },{
                    text        : "Delete"
                    ,id         : "ar_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_aggregate
                }
            ]
        };

        function before_open_aggregate_window() {
            var sm = Ext.getCmp("ar_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                var T = "Edit Redistribution of "+ rec.data.routemask +" to "+ rec.data.proto_mask;
                CP.export_4.open_aggregate_window(T);
            }
        }

        function before_delete_aggregate() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("ar_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_aggregate(recs[i]);
                }
                CP.export_4.LAST_PUSH = "aggregate";
                CP.export_4.mySubmit();
            }
        }

        function delete_aggregate(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:aggregate";

            var a_prefix    = "";
            if(route == CP.export_4.ALL_AGGREGATE_LABEL) {
                a_prefix    = prefix +":all";
            } else if(route == "default") {
                a_prefix    = prefix +":default";
            } else {
                params[prefix +":network:"+ route]  = "";
                a_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[a_prefix]                = "";
            params[a_prefix +":metric"]     = "";
            params[a_prefix +":exact"]      = "";
            //params[a_prefix +":filtertype"] = "";

            Ext.getStore("export_aggregate_store").remove(rec);
            if(Ext.getStore("export_aggregate_store").findExact("proto",to_proto) == -1) {
                params[prefix]  = "";
            }
        }

        var aggregate_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "From Aggregate Route"
                ,dataIndex      : "routemask"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            }
        ];

        var aggregate_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("ar_add_btn");
                    var e_btn = Ext.getCmp("ar_edit_btn");
                    var d_btn = Ext.getCmp("ar_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var aggregate_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ar_grid"
            ,width              : CP.export_4.AGGREGATE_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_aggregate_store")
            ,columns            : aggregate_cm
            ,selModel           : aggregate_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_aggregate_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_aggregate_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute Aggregate Routes"
                }
                ,aggregate_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ aggregate_grid ]
                }
            ]
        };
    }

    ,open_aggregate_window         : function(TITLE) {
        var aggregate_cmp;
        var proto_cmp;
        if(TITLE == "add") {

            TITLE = "Redistribute Aggregate Route";
            aggregate_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "From Aggregate Route"
                ,id             : "from_aggregate"
                ,name           : "routemask"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,style          : "margin-left:15px;margin-right:15px;"
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("aggregate_list_store")
                ,valueField     : "aggregationprefixmask"
                ,displayField   : "aggregationprefixmask"
                ,allowBlank     : false
            };
            proto_cmp = CP.export_4.get_variable_proto_cmp();

        } else {

            aggregate_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "From Aggregate Route"
                ,id             : "from_aggregate"
                ,name           : "routemask"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;margin-right:15px;"
            };
            proto_cmp = CP.export_4.get_constant_proto_cmp();

        }

        function ar_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("aggregate");

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("ar_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                CP.export_4.manage_metric(rec.data.proto);

                if(rec.data.metric == "") {
                    Ext.getCmp("metric").setRawValue("");
                }
                Ext.getCmp("metric").validate();

            } else {
                //add
                Ext.getCmp("to_proto").validate();
                Ext.getCmp("from_aggregate").validate();
                CP.export_4.manage_metric(CP.export_4.default_proto_type);
                Ext.getCmp("metric").validate();
            }
        }

        var ar_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ar_form"
            ,width      : 280
            ,autoScroll : false
            ,listeners  : {
                afterrender : ar_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "ar_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("ar_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        ar_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        //TODO UNCOMMENT
                        //Ext.getStore("protocols_store").load();
                        Ext.getCmp("ar_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,proto_cmp
                ,aggregate_cmp
                ,{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Metric"
                    ,id             : "metric"
                    ,name           : "metric"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,allowBlank     : true
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxLength      : 8
                    ,enforceMaxLength   : true
                    ,style          : "margin-left:15px;margin-right:15px;"
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                }
            ]
        };

        var ar_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ar_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ ar_form ]
        });
        ar_window.show();

        function ar_save() {
            var params = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var routemask   = Ext.getCmp("from_aggregate").getValue() + "/";
                routemask   = routemask.split("/");
            var route       = routemask[0];
            var mask        = routemask[1];
            var metric      = Ext.getCmp("metric").getRawValue();

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:aggregate";

            var a_prefix    = "";
            if(route == CP.export_4.ALL_AGGREGATE_LABEL) {
                a_prefix    = prefix +":all";
            } else if(route == "default" || route == "Default") {
                a_prefix    = prefix +":default";
            } else {
                params[prefix +":network:"+ route] = "t";
                a_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[prefix]                  = "t";
            params[a_prefix]                = "t";
            params[a_prefix +":metric"]     = metric;
            params[a_prefix +":exact"]      = "t";
            params[a_prefix +":filtertype"] = "exact";
            Ext.getCmp("ar_window").close();
            CP.export_4.LAST_PUSH = "aggregate";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

////////////////////////////////////////////////////////////////////////////////
//STUB:RIP
    ,export_rip                 : function() {
        var rip_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "rr_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("rr_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(1);
                        CP.export_4.add_rip_window();
                    }
                },{
                    text        : "Edit"
                    ,id         : "rr_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_rip_window
                },{
                    text        : "Delete"
                    ,id         : "rr_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_rip
                }
            ]
        };

        function before_open_rip_window() {
            var sm = Ext.getCmp("rr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                CP.export_4.edit_rip_window(rec);
            }
        }

        function before_delete_rip() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("rr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_rip(recs[i]);
                }
                CP.export_4.LAST_PUSH = "rip";
                CP.export_4.mySubmit();
            }
        }

        function delete_rip(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:rip";

            var r_prefix    = "";
            if(route == CP.export_4.ALL_AGGREGATE_LABEL) {
                r_prefix    = prefix +":all";
            } else if(route == "default") {
                r_prefix    = prefix +":default";
            } else {
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[r_prefix]                = "";
            params[r_prefix +":metric"]     = "";
            params[r_prefix +":config"]     = "";
            params[r_prefix +":exact"]      = "";
            params[r_prefix +":refines"]    = "";
            params[r_prefix +":between"]    = "";
            params[r_prefix +":and"]        = "";
            params[r_prefix +":restrict"]   = "";

            Ext.getStore("export_rip_store").remove(rec);
            if(Ext.getStore("export_rip_store").findExact("proto",to_proto) == -1) {
                params[prefix]  = "";
            } else {
                //at least one other entry still goes to this proto
                var recs = Ext.getStore("export_rip_store").getRange();
                var d;
                for(var i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if(d.proto == to_proto && d.route == route) {
                        //found another entry that is same proto, same route
                        return;
                    }
                }
                //did not find a same proto, same route, blank it
                params[prefix +":network:"+ route]  = "";
            }
        }

        var rip_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "RIP Route"
                ,dataIndex      : "routemask"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Action"
                ,dataIndex      : "restrict"
                ,width          : CP.export_4.ACTION_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.restrict == "t") {
                        retValue = "Restrict";
                    } else {
                        retValue = "Accept";
                    }
                    return CP.export_4.renderer_output(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.metric != "") {
                        retValue = rec.data.metric;
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "filtertype"
                ,width          : CP.export_4.MATCHTYPE_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case "normal":
                            retValue = "Normal";
                            break;
                        case "exact":
                            retValue = "Exact";
                            break;
                        case "refines":
                            retValue = "Refines";
                            break;
                        case "range":
                            retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                            break;
                        default:
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var rip_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("rr_add_btn");
                    var e_btn = Ext.getCmp("rr_edit_btn");
                    var d_btn = Ext.getCmp("rr_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var rip_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rr_grid"
            ,width              : CP.export_4.RIP_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_rip_store")
            ,columns            : rip_cm
            ,selModel           : rip_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_rip_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_rip_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute RIP Routes"
                }
                ,rip_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ rip_grid ]
                }
            ]
        };
    }

    ,add_rip_window             : function() {
        var notationCmp = CP.export_4.get_variable_notation_cmp();

        function rr_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("rip");

            Ext.getCmp("filtertype_entry").fireEvent("select");
            Ext.getCmp("to_proto").validate();
            Ext.getCmp("metric").validate();
        }

        var rr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rr_form"
            ,width      : 560
            ,height     : 254
            ,autoScroll : true
            ,listeners  : {
                afterrender             : rr_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "rr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("rr_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        rr_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("rr_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,CP.export_4.get_variable_proto_cmp()
                ,{//all rip
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "All RIP Routes"
                    ,id             : "all_route_cb"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-left:15px;"
                    ,listeners      : {
                        change          : function(checkbox, newVal, oldVal, eOpts) {
                            //enable/disable ipv4notation, matchtype, range
                            Ext.getCmp("individual_rr").setVisible(!newVal);
                            Ext.getCmp("individual_rr").setDisabled(newVal);
                            Ext.getCmp("route_entry").setDisabled(newVal);
                            Ext.getCmp("notation_form").setDisabled(newVal);
                            Ext.getCmp("mask_entry").setDisabled(newVal);
                            Ext.getCmp("filtertype_entry").setDisabled(newVal);
                            Ext.getCmp("between_entry").setDisabled(newVal);
                            Ext.getCmp("and_entry").setDisabled(newVal);
                        }
                    }
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "individual_rr"
                    ,items  : [
                        {
                            xtype   : "cp4_formpanel"
                            ,margin : "0 0 0 15"
                            ,items  : [ notationCmp ]
                        },{ //matchtype, filtertype
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Match Type"
                            ,id             : "filtertype_entry"
                            ,name           : "filtertype"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : "normal"
                            ,store          :   [["normal"  ,"Normal"]
                                                ,["exact"   ,"Exact"]
                                                ,["refines" ,"Refines"]
                                                ,["range"   ,"Range"]]
                            ,listeners      : {
                                select          : function(c, recs, eOpts) {
                                    var combo = Ext.getCmp("filtertype_entry");
                                    if(combo && combo.getValue().toLowerCase() == "range") {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(false);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(false);
                                        Ext.getCmp("range_set").setVisible(true);
                                    } else {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(true);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(true);
                                        Ext.getCmp("range_set").setVisible(false);
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_formpanel"
                            ,id             : "range_set"
                            ,width          : 545
                            ,margin         : 0
                            ,padding        : 0
                            ,layout         : "column"
                            ,items          : [
                                { //between
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "From Mask Length"
                                    ,id             : "between_entry"
                                    ,name           : "between"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-left:15px;margin-right:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = -1; }
                                        if(a == "") { a = 32; }

                                        if(b < m) {
                                            return "From Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(b > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        if(b > a) {
                                            return "From Mask Length must be less than or equal to To Mask Length.";
                                        }

                                        return true;
                                    }
                                },{//and
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "To Mask Length"
                                    ,id             : "and_entry"
                                    ,name           : "and"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-left:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = m; }
                                        if(a == "") { a = -1; }

                                        if(a < m) {
                                            return "To Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(a < b) {
                                            return "To Mask Length must be greater than or equal to From Mask Length.";
                                        }

                                        if(a > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        return true;
                                    }
                                }
                            ]
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 560
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;margin-bottom:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;margin-bottom:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                }
            ]
        };

        var rr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rr_window"
            ,title      : "Redistribute RIP Route"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ rr_form ]
        });
        rr_window.show();

        function rr_save() {
            var params      = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var all_cb      = Ext.getCmp("all_route_cb").getValue();
            var route       = Ext.getCmp("route_entry").getValue();
            var mask        = CP.export_4.getMaskLength("mask_entry");

            var metric      = Ext.getCmp("metric").getRawValue();
            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = Ext.getCmp("between_entry").getValue();
            var and         = Ext.getCmp("and_entry").getValue();
            //restrict
            var restrict_raw    = Ext.getCmp("restrict_entry").getValue();
            //accept for ...:all is opposite of restrict_raw
            var accept_all      = (restrict_raw == "t") ? "" : "t";
            //restrict for ...:network:...:restrict
            var restrict        = restrict_raw

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:rip";

            var r_prefix    = "";

            if(all_cb) {
                //all
                r_prefix    = prefix +":all";

                params[r_prefix]            = accept_all;
                params[r_prefix +":config"] = "t";
                params[r_prefix +":metric"] = (accept_all == "t") ? metric : "";

            } else {
                if(route == "" || mask == "") {
                    return;
                }
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
                params[prefix +":network:"+ route]  = "t";
                params[r_prefix]                    = "t";
                params[r_prefix +":filtertype"]     = filtertype;
                params[r_prefix +":restrict"]       = restrict;
                params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;

                params[r_prefix +":refines"]        = "";
                params[r_prefix +":exact"]          = "";
                params[r_prefix +":"+ filtertype]   = "t";
                params[r_prefix +":normal"]         = "";
                params[r_prefix +":range"]          = "";

                if(filtertype == "range") {
                    params[r_prefix +":between"]    = between;
                    params[r_prefix +":and"]        = and;
                } else {
                    params[r_prefix +":between"]    = "";
                    params[r_prefix +":and"]        = "";
                }

            }

            Ext.getCmp("rr_window").close();
            CP.export_4.LAST_PUSH = "rip";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

    ,edit_rip_window            : function(REC) {
        if(REC == null) {
            return;
        } else if(REC.data.routemask == CP.export_4.ALL_RIP_LABEL) {
            CP.export_4.edit_rip_window_all(REC);
        } else {
            CP.export_4.edit_rip_window_net(REC);
        }
    }

    ,edit_rip_window_all        : function(REC) {
        var TITLE = "Edit Redistribution of All RIP Routes to "+ REC.data.proto_mask;
        var rr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rr_form_all"
            ,width      : 560
            ,height     : 119
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("rip");
                    var rec = Ext.getCmp("rr_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "rr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("rr_form_all");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save ...:all
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        //var from_rip    = "all";

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var accept      = (Ext.getCmp("restrict_entry").getValue() == "t") ? "" : "t";

                        var r_prefix    = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:rip:all";

                        params[r_prefix]            = accept;
                        params[r_prefix +":config"] = "t";
                        params[r_prefix +":metric"] = (accept == "t") ? metric : "";

                        Ext.getCmp("rr_window_all").close();
                        CP.export_4.LAST_PUSH = "rip";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("rr_window_all").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Route"
                            ,id             : "from_rip"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;margin-bottom:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;margin-bottom:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                }
            ]
        };

        var rr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rr_window_all"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ rr_form ]
        });
        rr_window.show();
    }

    ,edit_rip_window_net        : function(REC) {
        var TITLE = "Edit Redistribution of "+ REC.data.routemask +" to "+ REC.data.proto_mask;
        var rr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rr_form_net"
            ,width      : 560
            ,height     : 173
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("rip");
                    var rec = Ext.getCmp("rr_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                    Ext.getCmp("filtertype_entry").fireEvent("select");
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "rr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("rr_form_net");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save ...:all
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        var routemask   = Ext.getCmp("from_rip").getValue() +"/";
                            routemask   = routemask.split("/");
                        var route       = routemask[0];
                        var mask        = routemask[1];

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                        var between     = Ext.getCmp("between_entry").getValue();
                        var and         = Ext.getCmp("and_entry").getValue();
                        var restrict    = Ext.getCmp("restrict_entry").getValue();

                        var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                                        + ":export_proto:" + to_proto
                                        + ":proto:rip:network:" + route;
                        var r_prefix    = prefix +":masklen:"+ mask;

                        params[prefix]              = "t";
                        params[r_prefix]            = "t";
                        params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;
                        params[r_prefix +":filtertype"]     = filtertype;
                        params[r_prefix +":restrict"]       = restrict;

                        params[r_prefix +":refines"]        = "";
                        params[r_prefix +":exact"]          = "";
                        params[r_prefix +":"+ filtertype]   = "t";
                        params[r_prefix +":normal"]         = "";
                        params[r_prefix +":range"]          = "";

                        if(filtertype == "range") {
                            params[r_prefix +":between"]    = between;
                            params[r_prefix +":and"]        = and;
                        } else {
                            params[r_prefix +":between"]    = "";
                            params[r_prefix +":and"]        = "";
                        }

                        Ext.getCmp("rr_window_net").close();
                        CP.export_4.LAST_PUSH = "rip";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("rr_window_net").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "RIP Route"
                            ,id             : "from_rip"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    //matchtype, filtertype
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        select          : function(c, recs, eOpts) {
                            var combo = Ext.getCmp("filtertype_entry");
                            if(combo && combo.getValue().toLowerCase() == "range") {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(false);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(false);
                                Ext.getCmp("range_set").setVisible(true);
                            } else {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(true);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(true);
                                Ext.getCmp("range_set").setVisible(false);
                            }
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_rip").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = -1; }
                                if(a == "") { a = 32; }

                                if(b < m) {
                                    return "From Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(b > 32) {
                                    return "Maximum value is 32.";
                                }

                                if(b > a) {
                                    return "From Mask Length must be less than or equal to To Mask Length.";
                                }

                                return true;
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_rip").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = m; }
                                if(a == "") { a = -1; }

                                if(a < m) {
                                    return "To Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(a < b) {
                                    return "To Mask Length must be greater than or equal to From Mask Length.";
                                }

                                if(a > 32) {
                                    return "Maximum value is 32.";
                                }

                                return true;
                            }
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;margin-bottom:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;margin-bottom:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                }
            ]
        };

        var rr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rr_window_net"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ rr_form ]
        });
        rr_window.show();
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:OSPF2
    ,export_ospf2                 : function() {
        var ospf2_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "or_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("or_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(2);
                        CP.export_4.add_ospf2_window();
                    }
                },{
                    text        : "Edit"
                    ,id         : "or_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_ospf2_window
                },{
                    text        : "Delete"
                    ,id         : "or_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_ospf2
                }
            ]
        };

        function before_open_ospf2_window() {
            var sm = Ext.getCmp("or_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                CP.export_4.edit_ospf2_window(rec);
            }
        }

        function before_delete_ospf2() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("or_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_ospf2(recs[i]);
                }
                CP.export_4.LAST_PUSH = "ospf2";
                CP.export_4.mySubmit();
            }
        }

        function delete_ospf2(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:ospf2";

            var r_prefix    = "";
            if(route == CP.export_4.ALL_AGGREGATE_LABEL) {
                r_prefix    = prefix +":all";
            } else if(route == "default") {
                r_prefix    = prefix +":default";
            } else {
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[r_prefix]                = "";
            params[r_prefix +":config"]     = "";
            params[r_prefix +":metric"]     = "";
            params[r_prefix +":exact"]      = "";
            params[r_prefix +":refines"]    = "";
            params[r_prefix +":between"]    = "";
            params[r_prefix +":and"]        = "";
            params[r_prefix +":restrict"]   = "";

            Ext.getStore("export_ospf2_store").remove(rec);
            if(Ext.getStore("export_ospf2_store").findExact("proto",to_proto) == -1) {
                params[prefix]              = "";
                params[prefix +":riptag"]   = "";
            } else {
                //at least one other entry still goes to this proto
                var recs = Ext.getStore("export_ospf2_store").getRange();
                var d;
                for(var i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if(d.proto == to_proto && d.route == route) {
                        //found another entry that is same proto, same route
                        return;
                    }
                }
                //did not find a same proto, same route, blank it
                params[prefix +":network:"+ route]  = "";
            }
        }

        var ospf2_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "OSPF Route"
                ,dataIndex      : "routemask"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Action"
                ,dataIndex      : "restrict"
                ,width          : CP.export_4.ACTION_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.restrict == "t") {
                        retValue = "Restrict";
                    } else {
                        retValue = "Accept";
                    }
                    return CP.export_4.renderer_output(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.metric != "") {
                        retValue = rec.data.metric;
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "filtertype"
                ,width          : CP.export_4.MATCHTYPE_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case "normal":
                            retValue = "Normal";
                            break;
                        case "exact":
                            retValue = "Exact";
                            break;
                        case "refines":
                            retValue = "Refines";
                            break;
                        case "range":
                            retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                            break;
                        default:
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Tags"
                ,dataIndex      : "riptag"
                ,width          : CP.export_4.MISC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.proto == "rip") {
                        if(rec.data.riptag != "") {
                            //find out if this is the highest rip record
                            var st = Ext.getStore("export_ospf2_store");
                            var rip_rec = st.findRecord("proto","rip", 0, false, true, true);
                            if(rip_rec.id == rec.id) {
                                retValue = "RIP Tag: " + rec.data.riptag;
                            }
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var ospf2_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : false
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("or_add_btn");
                    var e_btn = Ext.getCmp("or_edit_btn");
                    var d_btn = Ext.getCmp("or_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var ospf2_grid = {
            xtype               : "cp4_grid"
            ,id                 : "or_grid"
            ,width              : CP.export_4.OSPF2_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_ospf2_store")
            ,columns            : ospf2_cm
            ,selModel           : ospf2_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_ospf2_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_ospf2_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute OSPF Routes"
                }
                ,ospf2_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ ospf2_grid ]
                }
            ]
        };
    }

    ,add_ospf2_window          : function() {
        var notationCmp = CP.export_4.get_variable_notation_cmp();

        function or_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("ospf2");

            Ext.getCmp("filtertype_entry").fireEvent("select");
            Ext.getCmp("to_proto").fireEvent("select");
            Ext.getCmp("to_proto").validate();
            Ext.getCmp("metric").validate();

            var rip_rec = Ext.getStore("export_ospf2_store").findRecord("proto","rip", 0, false, true, true);
            if(rip_rec != null) {
                Ext.getCmp("riptag").setValue(rip_rec.data.riptag);
            }
        }

        var or_form = {
            xtype       : "cp4_formpanel"
            ,id         : "or_form"
            ,width      : 562
            ,height     : 281
            ,autoScroll : true
            ,listeners  : {
                afterrender : or_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "or_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("or_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        or_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("or_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,CP.export_4.get_variable_proto_cmp()
                ,{//all ospf2
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "All OSPF Routes"
                    ,id             : "all_route_cb"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-left:15px;"
                    ,listeners      : {
                        change          : function(checkbox, newVal, oldVal, eOpts) {
                            //enable/disable ipv4notation, matchtype, range
                            Ext.getCmp("individual_or").setVisible(!newVal);
                            Ext.getCmp("individual_or").setDisabled(newVal);
                            Ext.getCmp("route_entry").setDisabled(newVal);
                            Ext.getCmp("mask_entry").setDisabled(newVal);
                            Ext.getCmp("notation_form").setDisabled(newVal);
                            Ext.getCmp("filtertype_entry").setDisabled(newVal);
                            Ext.getCmp("between_entry").setDisabled(newVal);
                            Ext.getCmp("and_entry").setDisabled(newVal);
                        }
                    }
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "individual_or"
                    ,margin : "0 0 0 15"
                    ,width  : 530
                    ,items  : [
                        notationCmp
                        ,{ //matchtype, filtertype
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Match Type"
                            ,id             : "filtertype_entry"
                            ,name           : "filtertype"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : "normal"
                            ,store          :   [["normal"  ,"Normal"]
                                                ,["exact"   ,"Exact"]
                                                ,["refines" ,"Refines"]
                                                ,["range"   ,"Range"]]
                            ,listeners      : {
                                select          : function(c, recs, eOpts) {
                                    var combo = Ext.getCmp("filtertype_entry");
                                    if(combo && combo.getValue().toLowerCase() == "range") {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(false);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(false);
                                        Ext.getCmp("range_set").setVisible(true);
                                    } else {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(true);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(true);
                                        Ext.getCmp("range_set").setVisible(false);
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_formpanel"
                            ,id             : "range_set"
                            ,width          : 545
                            ,margin         : 0
                            ,padding        : 0
                            ,layout         : "column"
                            ,items          : [
                                { //between
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "From Mask Length"
                                    ,id             : "between_entry"
                                    ,name           : "between"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-right:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = -1; }
                                        if(a == "") { a = 32; }

                                        if(b < m) {
                                            return "From Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(b > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        if(b > a) {
                                            return "From Mask Length must be less than or equal to To Mask Length.";
                                        }

                                        return true;
                                    }
                                },{//and
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "To Mask Length"
                                    ,id             : "and_entry"
                                    ,name           : "and"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-left:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = m; }
                                        if(a == "") { a = -1; }

                                        if(a < m) {
                                            return "To Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(a < b) {
                                            return "To Mask Length must be greater than or equal to From Mask Length.";
                                        }

                                        if(a > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        return true;
                                    }
                                }
                            ]
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 560
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                    ,allowDecimals  : false
                    ,allowBlank     : true
                }
            ]
        };

        var or_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "or_window"
            ,title      : "Redistribute OSPF Route"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ or_form ]
        });
        or_window.show();

        function or_save() {
            var params      = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var all_cb      = Ext.getCmp("all_route_cb").getValue();
            var route       = Ext.getCmp("route_entry").getValue();
            var mask        = CP.export_4.getMaskLength("mask_entry");

            var metric      = Ext.getCmp("metric").getRawValue();
            var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = Ext.getCmp("between_entry").getValue();
            var and         = Ext.getCmp("and_entry").getValue();
            //restrict
            var restrict_raw    = Ext.getCmp("restrict_entry").getValue();
            //accept for ...:all is opposite of restrict_raw
            var accept_all      = (restrict_raw == "t") ? "" : "t";
            //restrict for ...:network:...:restrict
            var restrict        = restrict_raw

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:ospf2";

            var r_prefix    = "";

            if(all_cb) {
                //all
                r_prefix    = prefix +":all";

                params[r_prefix]            = accept_all;
                params[r_prefix +":metric"] = (accept_all == "t") ? metric : "";
                params[r_prefix +":config"] = "t";
                params[prefix +":riptag"]   = riptag;

            } else {
                if(route == "" || mask == "") {
                    return;
                }
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
                params[prefix +":network:"+ route]  = "t";
                params[r_prefix]                    = "t";
                params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;
                params[prefix +":riptag"]           = riptag;
                params[r_prefix +":filtertype"]     = filtertype;
                params[r_prefix +":restrict"]       = restrict;

                params[r_prefix +":refines"]        = "";
                params[r_prefix +":exact"]          = "";
                params[r_prefix +":"+ filtertype]   = "t";
                params[r_prefix +":normal"]         = "";
                params[r_prefix +":range"]          = "";

                if(filtertype == "range") {
                    params[r_prefix +":between"]    = between;
                    params[r_prefix +":and"]        = and;
                } else {
                    params[r_prefix +":between"]    = "";
                    params[r_prefix +":and"]        = "";
                }

            }

            Ext.getCmp("or_window").close();
            CP.export_4.LAST_PUSH = "ospf2";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

    ,edit_ospf2_window            : function(REC) {
        if(REC == null) {
            return;
        } else if(REC.data.routemask == CP.export_4.ALL_OSPF2_LABEL) {
            CP.export_4.edit_ospf2_window_all(REC);
        } else {
            CP.export_4.edit_ospf2_window_net(REC);
        }
    }

    ,edit_ospf2_window_all        : function(REC) {
        var TITLE = "Edit Redistribution of All OSPF Routes to "+ REC.data.proto_mask;
        var or_form = {
            xtype       : "cp4_formpanel"
            ,id         : "or_form_all"
            ,width      : 560
            ,height     : 146
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("ospf2");
                    var rec = Ext.getCmp("or_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                    Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                    Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "or_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("or_form_all");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save ...:all
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        //var from_ospf2    = "all";

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
                        var accept      = (Ext.getCmp("restrict_entry").getValue() == "t") ? "" : "t";

                        var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                                        + ":export_proto:" + to_proto + ":proto:ospf2";
                        var r_prefix    = prefix +":all";

                        params[r_prefix]            = accept;
                        params[r_prefix +":metric"] = (accept == "t") ? metric : "";
                        params[r_prefix +":config"] = "t";
                        params[prefix +":riptag"]   = riptag;

                        Ext.getCmp("or_window_all").close();
                        CP.export_4.LAST_PUSH = "ospf2";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("or_window_all").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "OSPF Route"
                            ,id             : "from_ospf2"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,allowDecimals  : false
                    ,allowBlank     : true
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                    ,width          : 15
                }
            ]
        };

        var or_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "or_window_all"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ or_form ]
        });
        or_window.show();
    }

    ,edit_ospf2_window_net        : function(REC) {
        var TITLE = "Edit Redistribution of "+ REC.data.routemask +" to "+ REC.data.proto_mask;
        var or_form = {
            xtype       : "cp4_formpanel"
            ,id         : "or_form_net"
            ,width      : 560
            ,height     : 200
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("ospf2");
                    var rec = Ext.getCmp("or_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                    Ext.getCmp("filtertype_entry").fireEvent("select");
                    Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                    Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "or_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("or_form_net");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save a network
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        var routemask   = Ext.getCmp("from_ospf2").getValue() +"/";
                            routemask   = routemask.split("/");
                        var route       = routemask[0];
                        var mask        = routemask[1];

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
                        var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                        var between     = Ext.getCmp("between_entry").getValue();
                        var and         = Ext.getCmp("and_entry").getValue();
                        var restrict    = Ext.getCmp("restrict_entry").getValue();

                        var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                                        + ":export_proto:" + to_proto + ":proto:ospf2";
                        var r_net_prefix= prefix + ":network:" + route;
                        var r_prefix    = r_net_prefix +":masklen:"+ mask;

                        params[prefix +":riptag"]           = riptag;

                        params[r_net_prefix]                = "t";
                        params[r_prefix]                    = "t";
                        params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;

                        params[r_prefix +":filtertype"]     = filtertype;
                        params[r_prefix +":restrict"]       = restrict;

                        params[r_prefix +":refines"]        = "";
                        params[r_prefix +":exact"]          = "";
                        params[r_prefix +":"+ filtertype]   = "t";
                        params[r_prefix +":normal"]         = "";
                        params[r_prefix +":range"]          = "";

                        if(filtertype == "range") {
                            params[r_prefix +":between"]    = between;
                            params[r_prefix +":and"]        = and;
                        } else {
                            params[r_prefix +":between"]    = "";
                            params[r_prefix +":and"]        = "";
                        }

                        Ext.getCmp("or_window_net").close();
                        CP.export_4.LAST_PUSH = "ospf2";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("or_window_net").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "OSPF Route"
                            ,id             : "from_ospf2"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    //matchtype, filtertype
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        select          : function(c, recs, eOpts) {
                            var combo = Ext.getCmp("filtertype_entry");
                            if(combo && combo.getValue().toLowerCase() == "range") {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(false);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(false);
                                Ext.getCmp("range_set").setVisible(true);
                            } else {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(true);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(true);
                                Ext.getCmp("range_set").setVisible(false);
                            }
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_ospf2").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = -1; }
                                if(a == "") { a = 32; }

                                if(b < m) {
                                    return "From Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(b > 32) {
                                    return "Maximum value is 32.";
                                }

                                if(b > a) {
                                    return "From Mask Length must be less than or equal to To Mask Length.";
                                }

                                return true;
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_ospf2").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = m; }
                                if(a == "") { a = -1; }

                                if(a < m) {
                                    return "To Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(a < b) {
                                    return "To Mask Length must be greater than or equal to From Mask Length.";
                                }

                                if(a > 32) {
                                    return "Maximum value is 32.";
                                }

                                return true;
                            }
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,allowDecimals  : false
                    ,allowBlank     : true
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                    ,width          : 15
                }
            ]
        };

        var or_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "or_window_net"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ or_form ]
        });
        or_window.show();
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:OSPF2ASE
    ,export_ospf2ase              : function() {
        var ospf2ase_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "xr_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("xr_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(2);
                        CP.export_4.add_ospf2ase_window();
                    }
                },{
                    text        : "Edit"
                    ,id         : "xr_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_ospf2ase_window
                },{
                    text        : "Delete"
                    ,id         : "xr_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_ospf2ase
                }
            ]
        };

        function before_open_ospf2ase_window() {
            var sm = Ext.getCmp("xr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                CP.export_4.edit_ospf2ase_window(rec);
            }
        }

        function before_delete_ospf2ase() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("xr_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_ospf2ase(recs[i]);
                }
                CP.export_4.LAST_PUSH = "ospf2ase";
                CP.export_4.mySubmit();
            }
        }

        function delete_ospf2ase(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:ospf2ase";

            var r_prefix    = "";
            if(route == CP.export_4.ALL_AGGREGATE_LABEL) {
                r_prefix    = prefix +":all";
            } else if(route == "default") {
                r_prefix    = prefix +":default";
            } else {
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
            }
            params[r_prefix]                = "";
            params[r_prefix +":metric"]     = "";
            params[r_prefix +":config"]     = "";
            params[r_prefix +":exact"]      = "";
            params[r_prefix +":refines"]    = "";
            params[r_prefix +":between"]    = "";
            params[r_prefix +":and"]        = "";
            params[r_prefix +":restrict"]   = "";

            Ext.getStore("export_ospf2ase_store").remove(rec);
            if(Ext.getStore("export_ospf2ase_store").findExact("proto",to_proto) == -1) {
                params[prefix]              = "";
                params[prefix +":riptag"]   = "";
            } else {
                //at least one other entry still goes to this proto
                var recs = Ext.getStore("export_ospf2ase_store").getRange();
                var d;
                for(var i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if(d.proto == to_proto && d.route == route) {
                        //found another entry that is same proto, same route
                        return;
                    }
                }
                //did not find a same proto, same route, blank it
                params[prefix +":network:"+ route]  = "";
            }
        }

        var ospf2ase_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "OSPF External Route"
                ,dataIndex      : "routemask"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Action"
                ,dataIndex      : "restrict"
                ,width          : CP.export_4.ACTION_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.restrict == "t") {
                        retValue = "Restrict";
                    } else {
                        retValue = "Accept";
                    }
                    return CP.export_4.renderer_output(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.metric != "") {
                        retValue = rec.data.metric;
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "filtertype"
                ,width          : CP.export_4.MATCHTYPE_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case "normal":
                            retValue = "Normal";
                            break;
                        case "exact":
                            retValue = "Exact";
                            break;
                        case "refines":
                            retValue = "Refines";
                            break;
                        case "range":
                            retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                            break;
                        default:
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Tags"
                ,dataIndex      : "riptag"
                ,width          : CP.export_4.MISC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.proto == "rip") {
                        if(rec.data.riptag != "") {
                            //find out if this is the highest rip record
                            var st = Ext.getStore("export_ospf2ase_store");
                            var rip_rec = st.findRecord("proto","rip", 0, false, true, true);
                            if(rip_rec.id == rec.id) {
                                retValue = "RIP Tag: " + rec.data.riptag;
                            }
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var ospf2ase_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("xr_add_btn");
                    var e_btn = Ext.getCmp("xr_edit_btn");
                    var d_btn = Ext.getCmp("xr_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var ospf2ase_grid = {
            xtype               : "cp4_grid"
            ,id                 : "xr_grid"
            ,width              : CP.export_4.OSPF2ASE_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_ospf2ase_store")
            ,columns            : ospf2ase_cm
            ,selModel           : ospf2ase_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_ospf2ase_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_ospf2ase_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute OSPF External Routes"
                }
                ,ospf2ase_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ ospf2ase_grid ]
                }
            ]
        };
    }

    ,add_ospf2ase_window       : function() {
        var notationCmp = CP.export_4.get_variable_notation_cmp();

        function xr_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("ospf2ase");

            Ext.getCmp("filtertype_entry").fireEvent("select");
            Ext.getCmp("to_proto").fireEvent("select");
            Ext.getCmp("to_proto").validate();
            Ext.getCmp("metric").validate();

            var rip_rec = Ext.getStore("export_ospf2ase_store").findRecord("proto","rip", 0, false, true, true);
            if(rip_rec != null) {
                Ext.getCmp("riptag").setValue(rip_rec.data.riptag);
            }
        }

        var xr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "xr_form"
            ,width      : 562
            ,height     : 281
            ,autoScroll : true
            ,listeners  : {
                afterrender : xr_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "xr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("xr_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        xr_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("xr_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,CP.export_4.get_variable_proto_cmp()
                ,{//all ospf2ase
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "All OSPF Ex Routes"
                    ,id             : "all_route_cb"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-left:15px;"
                    ,listeners      : {
                        change          : function(checkbox, newVal, oldVal, eOpts) {
                            //enable/disable ipv4notation, matchtype, range
                            Ext.getCmp("individual_xr").setVisible(!newVal);
                            Ext.getCmp("individual_xr").setDisabled(newVal);
                            Ext.getCmp("route_entry").setDisabled(newVal);
                            Ext.getCmp("mask_entry").setDisabled(newVal);
                            Ext.getCmp("notation_form").setDisabled(newVal);
                            Ext.getCmp("filtertype_entry").setDisabled(newVal);
                            Ext.getCmp("between_entry").setDisabled(newVal);
                            Ext.getCmp("and_entry").setDisabled(newVal);
                        }
                    }
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "individual_xr"
                    ,items  : [
                        {
                            xtype   : "cp4_formpanel"
                            ,margin : "0 0 0 15"
                            ,items  : [ notationCmp ]
                        },{ //matchtype, filtertype
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Match Type"
                            ,id             : "filtertype_entry"
                            ,name           : "filtertype"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : "normal"
                            ,store          :   [["normal"  ,"Normal"]
                                                ,["exact"   ,"Exact"]
                                                ,["refines" ,"Refines"]
                                                ,["range"   ,"Range"]]
                            ,listeners      : {
                                select          : function(c, recs, eOpts) {
                                    var combo = Ext.getCmp("filtertype_entry");
                                    if(combo && combo.getValue().toLowerCase() == "range") {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(false);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(false);
                                        Ext.getCmp("range_set").setVisible(true);
                                    } else {
                                        Ext.getCmp("between_entry").validate();
                                        Ext.getCmp("between_entry").setDisabled(true);
                                        Ext.getCmp("and_entry").validate();
                                        Ext.getCmp("and_entry").setDisabled(true);
                                        Ext.getCmp("range_set").setVisible(false);
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_formpanel"
                            ,id             : "range_set"
                            ,width          : 545
                            ,margin         : 0
                            ,padding        : 0
                            ,layout         : "column"
                            ,items          : [
                                { //between
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "From Mask Length"
                                    ,id             : "between_entry"
                                    ,name           : "between"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-left:15px;margin-right:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("and_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = -1; }
                                        if(a == "") { a = 32; }

                                        if(b < m) {
                                            return "From Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(b > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        if(b > a) {
                                            return "From Mask Length must be less than or equal to To Mask Length.";
                                        }

                                        return true;
                                    }
                                },{//and
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "To Mask Length"
                                    ,id             : "and_entry"
                                    ,name           : "and"
                                    ,labelWidth     : CP.export_4.LABELWIDTH
                                    ,width          : 250
                                    ,style          : "margin-left:15px;"
                                    ,allowDecimals  : false
                                    ,allowBlank     : false
                                    ,value          : 32
                                    ,minValue       : 0
                                    ,maxValue       : 32
                                    ,maxLength      : 2
                                    ,enforceMaxLength   : true
                                    ,listeners      : {
                                        validitychange  : function(num, isValid, eOpts) {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,change         : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                        ,blur           : function() {
                                            Ext.getCmp("between_entry").validate();
                                        }
                                    }
                                    ,validator      : function() {
                                        var b = Ext.getCmp("between_entry").getValue();
                                        var a = Ext.getCmp("and_entry").getValue();
                                        var m = CP.export_4.getMaskLength("mask_entry");

                                        if(m == "") { m = 0; }
                                        if(b == "") { b = m; }
                                        if(a == "") { a = -1; }

                                        if(a < m) {
                                            return "To Mask Length must be greater than or equal to the Mask Length.";
                                        }

                                        if(a < b) {
                                            return "To Mask Length must be greater than or equal to From Mask Length.";
                                        }

                                        if(a > 32) {
                                            return "Maximum value is 32.";
                                        }

                                        return true;
                                    }
                                }
                            ]
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 560
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,allowDecimals  : false
                    ,allowBlank     : true
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                }
            ]
        };

        var xr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "xr_window"
            ,title      : "Redistribute OSPF External Route"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ xr_form ]
        });
        xr_window.show();

        function xr_save() {
            var params      = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var all_cb      = Ext.getCmp("all_route_cb").getValue();
            var route       = Ext.getCmp("route_entry").getValue();
            var mask        = CP.export_4.getMaskLength("mask_entry");

            var metric      = Ext.getCmp("metric").getRawValue();
            var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = Ext.getCmp("between_entry").getValue();
            var and         = Ext.getCmp("and_entry").getValue();
            //restrict
            var restrict_raw    = Ext.getCmp("restrict_entry").getValue();
            //accept for ...:all is opposite of restrict_raw
            var accept_all      = (restrict_raw == "t") ? "" : "t";
            //restrict for ...:network:...:restrict
            var restrict        = restrict_raw

            var p_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:ospf2ase";

            var r_prefix    = "";

            if(all_cb) {
                //all
                r_prefix    = prefix +":all";

                params[r_prefix]            = accept_all;
                params[r_prefix +":metric"] = (accept_all == "t") ? metric : "";
                params[r_prefix +":config"] = "t";
                params[prefix +":riptag"]   = riptag;

            } else {
                if(route == "" || mask == "") {
                    return;
                }
                r_prefix    = prefix +":network:"+ route +":masklen:"+ mask;
                params[prefix +":network:"+ route]  = "t";
                params[r_prefix]                    = "t";
                params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;
                params[prefix +":riptag"]           = riptag;
                params[r_prefix +":filtertype"]     = filtertype;
                params[r_prefix +":restrict"]       = restrict;

                params[r_prefix +":refines"]        = "";
                params[r_prefix +":exact"]          = "";
                params[r_prefix +":"+ filtertype]   = "t";
                params[r_prefix +":normal"]         = "";
                params[r_prefix +":range"]          = "";

                if(filtertype == "range") {
                    params[r_prefix +":between"]    = between;
                    params[r_prefix +":and"]        = and;
                } else {
                    params[r_prefix +":between"]    = "";
                    params[r_prefix +":and"]        = "";
                }

            }

            Ext.getCmp("xr_window").close();
            CP.export_4.LAST_PUSH = "ospf2ase";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

    ,edit_ospf2ase_window         : function(REC) {
        if(REC == null) {
            return;
        } else if(REC.data.routemask == CP.export_4.ALL_OSPF2ASE_LABEL) {
            CP.export_4.edit_ospf2ase_window_all(REC);
        } else {
            CP.export_4.edit_ospf2ase_window_net(REC);
        }
    }

    ,edit_ospf2ase_window_all     : function(REC) {
        var TITLE = "Edit Redistribution of All OSPF External Routes to "+ REC.data.proto_mask;
        var xr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "xr_form_all"
            ,width      : 560
            ,height     : 146
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("ospf2ase");
                    var rec = Ext.getCmp("xr_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                    Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                    Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "xr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("xr_form_all");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save ...:all
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        //var from_ospf2ase    = "all";

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
                        var accept      = (Ext.getCmp("restrict_entry").getValue() == "t") ? "" : "t";

                        var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:ospf2ase";
                        var r_prefix    = prefix + ":all";

                        params[r_prefix]            = accept;
                        params[r_prefix +":metric"] = (accept == "t") ? metric : "";
                        params[r_prefix +":config"] = "t";
                        params[prefix +":riptag"]   = riptag;

                        Ext.getCmp("xr_window_all").close();
                        CP.export_4.LAST_PUSH = "ospf2ase";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("xr_window_all").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "OSPF External Route"
                            ,id             : "from_ospf2ase"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,allowDecimals  : false
                    ,allowBlank     : true
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                    ,width          : 15
                }
            ]
        };

        var xr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "xr_window_all"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ xr_form ]
        });
        xr_window.show();
    }

    ,edit_ospf2ase_window_net     : function(REC) {
        var TITLE = "Edit Redistribution of "+ REC.data.routemask +" to "+ REC.data.proto_mask;
        var xr_form = {
            xtype       : "cp4_formpanel"
            ,id         : "xr_form_net"
            ,width      : 560
            ,height     : 200
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.export_4.set_from_proto("ospf2ase");
                    var rec = Ext.getCmp("xr_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    CP.export_4.manage_metric(rec.data.proto);

                    if(rec.data.metric == "") {
                        Ext.getCmp("metric").setRawValue("");
                    }
                    Ext.getCmp("metric").validate();
                    Ext.getCmp("filtertype_entry").fireEvent("select");
                    Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                    Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "xr_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        var panel = Ext.getCmp("xr_form_net");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        //save a network
                        var params      = CP.export_4.clearParams();
                        var to_proto    = Ext.getCmp("to_proto").getValue();
                        var routemask   = Ext.getCmp("from_ospf2ase").getValue() +"/";
                            routemask   = routemask.split("/");
                        var route       = routemask[0];
                        var mask        = routemask[1];

                        var metric      = Ext.getCmp("metric").getRawValue();
                        var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getValue() : "";
                        var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                        var between     = Ext.getCmp("between_entry").getValue();
                        var and         = Ext.getCmp("and_entry").getValue();
                        var restrict    = Ext.getCmp("restrict_entry").getValue();

                        var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                                        + ":export_proto:" + to_proto
                                        + ":proto:ospf2ase";
                        var r_net_prefix= prefix +":network:" + route;
                        var r_prefix    = r_net_prefix +":masklen:"+ mask;

                        params[prefix +":riptag"]           = riptag;

                        params[r_net_prefix]                = "t";
                        params[r_prefix]                    = "t";
                        params[r_prefix +":metric"]         = (restrict == "t") ? "" : metric;
                        params[r_prefix +":filtertype"]     = filtertype;
                        params[r_prefix +":restrict"]       = restrict;

                        params[r_prefix +":refines"]        = "";
                        params[r_prefix +":exact"]          = "";
                        params[r_prefix +":"+ filtertype]   = "t";
                        params[r_prefix +":normal"]         = "";
                        params[r_prefix +":range"]          = "";

                        if(filtertype == "range") {
                            params[r_prefix +":between"]    = between;
                            params[r_prefix +":and"]        = and;
                        } else {
                            params[r_prefix +":between"]    = "";
                            params[r_prefix +":and"]        = "";
                        }

                        Ext.getCmp("xr_window_net").close();
                        CP.export_4.LAST_PUSH = "ospf2ase";
                        CP.export_4.mySubmit();
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("xr_window_net").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        CP.export_4.get_constant_proto_cmp()
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "OSPF External Route"
                            ,id             : "from_ospf2ase"
                            ,name           : "routemask"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        }
                    ]
                },{
                    //matchtype, filtertype
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        select          : function(c, recs, eOpts) {
                            var combo = Ext.getCmp("filtertype_entry");
                            if(combo && combo.getValue().toLowerCase() == "range") {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(false);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(false);
                                Ext.getCmp("range_set").setVisible(true);
                            } else {
                                Ext.getCmp("between_entry").validate();
                                Ext.getCmp("between_entry").setDisabled(true);
                                Ext.getCmp("and_entry").validate();
                                Ext.getCmp("and_entry").setDisabled(true);
                                Ext.getCmp("range_set").setVisible(false);
                            }
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_ospf2ase").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = -1; }
                                if(a == "") { a = 32; }

                                if(b < m) {
                                    return "From Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(b > 32) {
                                    return "Maximum value is 32.";
                                }

                                if(b > a) {
                                    return "From Mask Length must be less than or equal to To Mask Length.";
                                }

                                return true;
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var routemask = Ext.getCmp("from_ospf2ase").getValue() + "/";
                                    routemask = routemask.split("/");
                                var m = routemask[1];

                                if(m == "") { m = 0; }
                                if(b == "") { b = m; }
                                if(a == "") { a = -1; }

                                if(a < m) {
                                    return "To Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(a < b) {
                                    return "To Mask Length must be greater than or equal to From Mask Length.";
                                }

                                if(a > 32) {
                                    return "Maximum value is 32.";
                                }

                                return true;
                            }
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "RIP Tag"
                    ,id             : "riptag"
                    ,name           : "riptag"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,style          : "margin-left:15px;"
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,allowDecimals  : false
                    ,allowBlank     : true
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                    ,width          : 15
                }
            ]
        };

        var xr_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "xr_window_net"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ xr_form ]
        });
        xr_window.show();
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:DEFAULT_BGP
    ,export_default_bgp         : function() {
        var bgp_default_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "bgp_def_add_btn"
                    ,handler    : function(b, e) {
                        //Ext.getCmp("bgp_default_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(4);
                        CP.export_4.open_default_bgp_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "bgp_def_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_default_bgp_window
                },{
                    text        : "Delete"
                    ,id         : "bgp_def_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_default_bgp
                }
            ]
        };

        function before_open_default_bgp_window() {
            var sm = Ext.getCmp("bgp_default_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() == 1) {
                var rec = sm.getLastSelected();
                var T = "Edit Redistribution of BGP Originated Default Route to "+ (rec.data.proto_mask.replace("BGP ", ""));
                CP.export_4.open_default_bgp_window(T);
            }
        }

        function before_delete_default_bgp() {
            var recs = Ext.getCmp("bgp_default_grid").getSelectionModel().getSelection();
            if(CP.export_4.get_no_token()) { return; }
            if(recs.length > 0) {
                CP.export_4.clearParams();
                for(var i = 0; i < recs.length; i++) {
                    delete_default_bgp(recs[i]);
                }
                CP.export_4.LAST_PUSH = "default";
                CP.export_4.mySubmit();
            }
        }

        function delete_default_bgp(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;

            var prefix      = "routed:instance:" + CP.export_4.INSTANCE
                            + ":export_proto:" + to_proto + ":proto:default";

            params[prefix]                  = "";
            params[prefix +":all"]          = "";
            params[prefix +":all:metric"]   = "";

            Ext.getStore("export_default_bgp_store").remove(rec);
        }

        var bgp_default_cm = [
            {
                header          : "BGP AS"
                ,dataIndex      : "proto_mask"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.export_4.renderer_generic(value.replace("BGP ", ""), meta, rec, row, col, st, view);
                }
            },{
                header          : "Redistribute"
                ,dataIndex      : "all"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value == false || value == "false") ? "Disabled" : "Enabled";
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            }
        ];

        var bgp_default_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("bgp_def_add_btn");
                    var e_btn = Ext.getCmp("bgp_def_edit_btn");
                    var d_btn = Ext.getCmp("bgp_def_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var bgp_default_grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_default_grid"
            ,width              : CP.export_4.BGP_DEFAULT_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_default_bgp_store")
            ,columns            : bgp_default_cm
            ,selModel           : bgp_default_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_default_bgp_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_bgp_default_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute BGP Originated Default Route to BGP"
                }
                ,bgp_default_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ bgp_default_grid ]
                }
            ]
        };
    }

    ,open_default_bgp_window    : function(TITLE) {
        var proto_cmp;
        if(TITLE == "add") {

            TITLE = "Redistribute BGP Originated Default Route";
            proto_cmp = CP.export_4.get_variable_proto_cmp();

        } else {

            proto_cmp = CP.export_4.get_constant_proto_cmp();

        }

        function def_bgp_afterrender(p, eOpts) {
            p.form._boundItems = null;

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("bgp_default_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                if(rec.data.metric == "") {
                    Ext.getCmp("metric_fixed").setRawValue("");
                }

            } else {
                //add
                Ext.getCmp("to_proto").validate();

            }
            Ext.getCmp("metric_fixed").validate();
        }

        var def_bgp_form = {
            xtype       : "cp4_formpanel"
            ,id         : "def_bgp_form"
            ,width      : 400
            ,autoScroll : false
            ,listeners  : {
                afterrender : def_bgp_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "def_bgp_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("def_bgp_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        def_bgp_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("def_bgp_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,width          : 15
                    ,height         : 15
                }
                ,proto_cmp
                ,{
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "Redistribute"
                    ,id             : "all_entry"
                    ,name           : "all"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-left:15px;"
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Metric"
                    ,id             : "metric_fixed" //called fixed because the maxValue doesn't change
                    ,name           : "metric"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,allowBlank     : true
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxValue       : 16777215
                    ,maxLength      : 8
                    ,enforceMaxLength   : true
                    ,style          : "margin-left:15px;"
                },{
                    xtype           : "tbspacer"
                    ,height         : 10
                    ,width          : 15
                }
            ]
        };

        var def_bgp_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "def_bgp_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                        Ext.getCmp("metric_fixed").focus();
                    } else {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ def_bgp_form ]
        });
        def_bgp_window.show();

        function def_bgp_save() {
            var params = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var all         = (Ext.getCmp("all_entry").getValue()) ? "t" : "";
            var metric      = Ext.getCmp("metric_fixed").getRawValue();

            var prefix      = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto +":proto:default";

            params[prefix]                  = "t";
            params[prefix +":all"]          = all;
            params[prefix +":all:metric"]   = metric;

            Ext.getCmp("def_bgp_window").close();
            CP.export_4.LAST_PUSH = "default";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:SHARED_BGP
    ,export_shared_bgp          : function() {
        var bgp_shared_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Edit"
                    ,id         : "bgp_sha_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_shared_bgp_window
                },{
                    text        : "Reset"
                    ,id         : "bgp_sha_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_shared_bgp
                }
            ]
        };

        function before_open_shared_bgp_window() {
            var sm = Ext.getCmp("bgp_shared_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() == 1) {
                var rec = sm.getLastSelected();
                var T = rec.data.proto_mask +" Redistribution Settings";
                CP.export_4.open_shared_bgp_window(T);
            }
        }

        function before_delete_shared_bgp() {
            CP.export_4.clearParams();
            var sm = Ext.getCmp("bgp_shared_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_shared_bgp(recs[i]);
                }
                CP.export_4.LAST_PUSH = "shared";
                CP.export_4.mySubmit();
            }
        }

        function delete_shared_bgp(rec) {
            var params      = CP.export_4.getParams();
            var to_proto    = rec.data.proto;
            var prefix      = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            params[prefix +":metric"]       = "";
            params[prefix +":localpref"]    = "";
            params[prefix +":aspathopt"]    = "";

            var com;
            var as;
            var i;
            //match_list
            for(i = 0; i < rec.data.match_list.length; i++) {
                com = rec.data.match_list[i].community;
                as  = rec.data.match_list[i].as;
                params[prefix +":aspathopt:community:"+ com]        = "";
                params[prefix +":aspathopt:community:"+ com +":as"] = "";
            }

            params[prefix +":modaspath"]    = "";
            //append_list
            for(i = 0; i < rec.data.append_list.length; i++) {
                com = rec.data.append_list[i].community;
                as  = rec.data.append_list[i].as;
                params[prefix +":modaspath:community:"+ com]        = "";
                params[prefix +":modaspath:community:"+ com +":as"] = "";
            }

            Ext.getStore("export_shared_bgp_store").remove(rec);
        }

        var bgp_shared_cm = [
            {
                header          : "BGP AS"
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.export_4.renderer_generic(value.replace("BGP ", ""), meta, rec, row, col, st, view);
                }
            },{
                header          : "MED"
                ,dataIndex      : "med"
                ,width          : 65
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Local Preference"
                ,dataIndex      : "localpref"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "Communities to Match"
                ,dataIndex      : "match_list"
                ,width          : CP.export_4.COMMUNITIES_LIST_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(!rec.data.com_enabled || rec.data.com_enabled == "false") {
                        retValue = (row == 0) ? "" : "";
                    } else if(value.length == 0) {
                        retValue = "";
                    } else {
                        retValue = "Community "+ value[0].community +" : AS "+ value[0].as;
                        for(var i = 1; i < value.length; i++) {
                            retValue += "<br>Community "+ value[i].community +" : AS "+ value[i].as;
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Communities to Append"
                ,dataIndex      : "append_list"
                ,width          : CP.export_4.COMMUNITIES_LIST_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(!rec.data.com_enabled || rec.data.com_enabled == "false") {
                        retValue = "";
                    } else if(!rec.data.append_enable || rec.data.append_enable == "false") {
                        retValue = "";
                    } else if(value.length == 0) {
                        return "";
                    } else {
                        var retValue = "Community "+ value[0].community +" : AS "+ value[0].as;
                        for(var i = 1; i < value.length; i++) {
                            retValue += "<br>Community "+ value[i].community +" : AS "+ value[i].as;
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var bgp_shared_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var e_btn = Ext.getCmp("bgp_sha_edit_btn");
                    var d_btn = Ext.getCmp("bgp_sha_delete_btn");
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var bgp_shared_grid = {
            xtype               : "cp4_grid"
            ,id                 : "bgp_shared_grid"
            ,width              : CP.export_4.BGP_SHARED_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_shared_bgp_store")
            ,columns            : bgp_shared_cm
            ,selModel           : bgp_shared_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_shared_bgp_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_bgp_shared_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "BGP Redistribution Settings"
                }
                ,bgp_shared_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ bgp_shared_grid ]
                }
            ]
        };
    }

    ,open_shared_bgp_window     : function(TITLE) {
        //always an edit
        var proto_cmp = CP.export_4.get_constant_proto_cmp();
        var med_cmp = {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : '<div data-qtip="Multi-Exit Discriminator" />MED:</div />'
            ,labelSeparator     : ""
            ,id                 : "med_entry"
            ,name               : "med"
            ,labelWidth         : CP.export_4.LABELWIDTH
            ,width              : 250
            ,style              : "margin-left:15px;"
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 0
            ,maxValue           : 4294967295
            ,maxLength          : 10
            ,enforceMaxLength   : true
            ,listeners          : {
                blur                : function(field, eOpts) {
                    var value = field.getRawValue();
                    if(value == "") {
                        return;
                    }
                    if(value < 0) {
                        field.setValue(0);
                    }
                    if(value > 4294967295) {
                        field.setValue(4294967295);
                    }
                }
            }
        };
        var localpref_cmp = {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Local Preference"
            ,id                 : "localpref_entry"
            ,name               : "localpref"
            ,labelWidth         : CP.export_4.LABELWIDTH
            ,width              : 250
            ,style              : "margin-left:15px;"
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 0
            ,maxValue           : 4294967295
            ,maxLength          : 10
            ,enforceMaxLength   : true
            ,listeners          : {
                blur                : function(field, eOpts) {
                    var value = field.getRawValue();
                    if(value == "") {
                        return;
                    }
                    if(value < 0) {
                        field.setValue(0);
                    }
                    if(value > 4294967295) {
                        field.setValue(4294967295);
                    }
                }
            }
        };

        //communities stuff
        var match_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,handler    : function(b, e) {
                        CP.export_4.open_community_add_window("match");
                    }
                },{
                    text        : "Delete"
                    ,id         : "match_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_match
                }
            ]
        };

        function before_delete_match() {
            var sm = Ext.getCmp("match_grid").getSelectionModel();
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_match(recs[i]);
                }
            }
        }

        function delete_match(rec) {
            if(!(rec.data.newrec)) {
                var params = CP.export_4.getParams();

                var to_proto    = Ext.getCmp("to_proto").getValue();
                var prefix      = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":aspathopt";
                var community   = rec.data.community;
                var as          = rec.data.as;

                params[prefix +":community:"+ community]        = "";
                params[prefix +":community:"+ community +":as"] = "";
            }
            var match_st = Ext.getStore("community_match_store");
            match_st.remove(rec);
            if(match_st.getCount() < 1) {
                params[prefix]                                  = "";
            }
        }

        var match_cm = [
            {
                header          : "Community"
                ,dataIndex      : "community"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "AS"
                ,dataIndex      : "as"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            }
        ];

        var match_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpt) {
                    var delete_btn = Ext.getCmp("match_delete_btn");
                    if(delete_btn) {
                        delete_btn.setDisabled(selections.length == 0);
                    }
                }
            }
        });

        var match_grid = {
            xtype               : "cp4_grid"
            ,id                 : "match_grid"
            ,width              : 200
            ,height             : CP.export_4.COMMUNITY_GRID_HEIGHT
            ,margin             : "0 0 5 0"
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("community_match_store")
            ,columns            : match_cm
            ,selModel           : match_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
        };

        var append_enable_cmp = {
            xtype       : "cp4_checkbox"
            ,fieldLabel : "Append AS/Community Pairs to Routes"
            ,id         : "append_enable_entry"
            ,name       : "append_enable"
            ,labelWidth : 200
            ,width      : 250
            ,height     : 22
            ,listeners  : {
                change      : function(checkbox, newVal, oldVal, eOpts) {
                    var v = Ext.getCmp("append_enable_entry").getValue();
                    Ext.getCmp("append_form").setVisible( v );
                    var f_width = (v) ? 560 : 280;
                    Ext.getCmp("shared_form").setWidth( f_width );
                    Ext.getCmp("shared_window").setWidth( f_width + 12 );
                }
            }
        };

        var append_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,handler    : function(b, e) {
                        CP.export_4.open_community_add_window("append");
                    }
                },{
                    text        : "Delete"
                    ,id         : "append_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_append
                }
            ]
        };

        function before_delete_append() {
            var sm = Ext.getCmp("append_grid").getSelectionModel();
            if(sm.getCount() > 0) {
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_append(recs[i]);
                }
            }
        }

        function delete_append(rec) {
            if(!(rec.data.newrec)) {
                var params = CP.export_4.getParams();

                var to_proto    = Ext.getCmp("to_proto").getValue();
                var prefix      = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":modaspath";
                var community   = rec.data.community;
                var as          = rec.data.as;

                params[prefix +":community:"+ community]        = "";
                params[prefix +":community:"+ community +":as"] = "";
            }
            var append_st = Ext.getStore("community_append_store");
            append_st.remove(rec);
        }

        var append_cm = [
            {
                header          : "Community"
                ,dataIndex      : "community"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "AS"
                ,dataIndex      : "as"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            }
        ];

        var append_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpt) {
                    var delete_btn = Ext.getCmp("append_delete_btn");
                    if(delete_btn) {
                        delete_btn.setDisabled(selections.length == 0);
                    }
                }
            }
        });

        var append_grid = {
            xtype               : "cp4_grid"
            ,id                 : "append_grid"
            ,width              : 200
            ,height             : CP.export_4.COMMUNITY_GRID_HEIGHT
            ,margin             : "0 0 5 0"
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("community_append_store")
            ,columns            : append_cm
            ,selModel           : append_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
        };

        var append_form = {
            xtype       : "cp4_formpanel"
            ,id         : "append_form"
            ,width      : 250
            ,margin     : "0 0 5 15"
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "AS Numbers and Communities to Append"
                }
                ,append_btnsbar
                ,append_grid
            ]
        };

        var match_form = {
            xtype       : "cp4_formpanel"
            ,id         : "match_form"
            ,width      : 250
            ,margin     : "0 15 5 15"
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "AS Numbers and Communities to Match"
                }
                ,match_btnsbar
                ,match_grid
                ,append_enable_cmp
            ]
        };

    //SHARED_FORM
        function shared_afterrender(p, eOpts) {
            p.form._boundItems = null;

            CP.export_4.clearParams();
            var rec = Ext.getCmp("bgp_shared_grid").getSelectionModel().getLastSelected();
            CP.export_4.load_community_stores(rec);
            p.loadRecord(rec);
            Ext.getCmp("match_form").setVisible( rec.data.com_enabled );
            Ext.getCmp("communities_not_enabled").setVisible( rec.data.com_enabled == "false" );
            if(rec.data.med == "") {
                Ext.getCmp("med_entry").setRawValue("");
            }
            if(rec.data.localpref == "") {
                Ext.getCmp("localpref_entry").setRawValue("");
            }
        }

        var shared_form = {
            xtype       : "cp4_formpanel"
            ,id         : "shared_form"
            ,width      : 560
            ,margin     : 0
            ,autoScroll : false
            ,listeners  : {
                afterrender : shared_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,text       : "Save"
                    ,id         : "shared_save_btn"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("shared_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        save_shared(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("shared_window").close();
                    }
                }
            ]
            ,items      : [
                { xtype: "tbspacer", width: 15, height: 15 }
                ,proto_cmp
                ,med_cmp
                ,localpref_cmp
                ,{
                    xtype       : "cp4_formpanel"
                    ,id         : "communities_not_enabled"
                    ,margin     : "0 15 0 15"
                    ,items      : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "AS Numbers and Communities to Match"
                        },{
                            xtype   : "cp4_label"
                            ,text   : "Communities not Enabled"
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,width      : 560
                    ,autoScroll : false
                    ,margin     : 0
                    ,layout     : "column"
                    ,items      : [
                        match_form
                        ,append_form
                    ]
                }
            ]
        };

        var shared_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "shared_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    Ext.getCmp("append_enable_entry").fireEvent("change");
                    var rec = Ext.getCmp("bgp_shared_grid").getSelectionModel().getLastSelected();
                    var f_height = (rec.data.com_enabled == "false") ? 179 : 302;
                    Ext.getCmp("shared_form").setHeight(f_height);
                    Ext.getCmp("shared_window").setHeight(f_height + 62);
                    win.setPosition(225,100);
                }
            }
            ,items      : [ shared_form ]
        });
        shared_window.show();

        function save_shared() {
            var params = CP.export_4.getParams();
            var i;

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var prefix      = "routed:instance:"+ CP.export_4.INSTANCE
                            + ":export_proto:"+ to_proto;

            var med         = Ext.getCmp("med_entry").getRawValue();
            var localpref   = Ext.getCmp("localpref_entry").getRawValue();

            params[prefix]                  = "t";
            params[prefix +":metric"]       = med;
            params[prefix +":localpref"]    = localpref;

            var match_prefix    = prefix +":aspathopt";
            params[match_prefix]                                = "";
            var recs = Ext.getStore("community_match_store").getRange();
            var com;
            var as;
            for(i = 0; i < recs.length; i++) {
                params[match_prefix]                            = "t";
                com = recs[i].data.community;
                as  = recs[i].data.as;
                params[match_prefix +":community:"+ com]        = "t";
                params[match_prefix +":community:"+ com +":as"] = as;
            }

            var append_prefix   = prefix +":modaspath";
            var append_enabled  = (Ext.getCmp("append_enable_entry").getValue()) ? "t" : "";
            params[append_prefix]   = append_enabled;
            if(append_enabled != "") {
                params[match_prefix]                            = "t";
            }
            recs = Ext.getStore("community_append_store").getRange();
            for(i = 0; i < recs.length; i++) {
                com = recs[i].data.community;
                as  = (append_enabled == "") ? "" : recs[i].data.as;
                params[append_prefix +":community:"+ com]       = append_enabled;
                params[append_prefix +":community:"+ com +":as"]= as;
            }

            Ext.getCmp("shared_window").close();
            CP.export_4.LAST_PUSH = "shared";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }

    ,open_community_add_window  : function(mode) {
        var TITLE = (mode == "match") ? "Add AS and Community Match" : "Add AS and Community to Append";
        var mode_cmp = {
            xtype       : "cp4_displayfield"
            ,fieldLabel : "mode"
            ,id         : "community_mode"
            ,value      : mode
            ,hidden     : true
            ,hideLabel  : true
        };

        var community_cmp = {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Community ID"
            ,id                 : "community_entry"
            ,labelWidth         : CP.export_4.LABELWIDTH
            ,width              : 250
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
        };
        var as_cmp = {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "AS Number"
            ,id                 : "as_entry"
            ,labelWidth         : CP.export_4.LABELWIDTH
            ,width              : 250
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
        };

        function com_add_afterrender(p, eOpts) {
            p.form._boundItems = null;
            Ext.getCmp("community_entry").focus();
        }

        var com_add_form = {
            xtype       : "cp4_formpanel"
            ,id         : "com_add_form"
            ,width      : 280
            ,margin     : 0
            ,autoScroll : false
            ,listeners  : {
                afterrender : com_add_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,text       : "Ok"
                    ,id         : "com_add_save_btn"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("com_add_form");
                        save_com_add(b,e);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("com_add_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,id         : "com_add_cancel_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("com_add_window").close();
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("as_entry").validate();
                            Ext.getCmp("community_entry").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 250
                    ,margin     : "15 0 8 15"
                    ,autoScroll : false
                    ,items      : [
                        mode_cmp
                        ,community_cmp
                        ,as_cmp
                    ]
                }
            ]
        };

        var com_add_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "com_add_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("shared_window").getPosition();
                    var x   = (Ext.getCmp("community_mode").getValue() == "match") ? 0 : 280;
                    win.setPosition(x + pos[0], 50 + pos[1]);
                }
            }
            ,items      : [ com_add_form ]
        });
        com_add_window.show();

        function save_com_add() {
            var mode        = Ext.getCmp("community_mode").getValue();
            if(mode == "") {
                Ext.getCmp("com_add_window").close();
                return;
            }
            var com_st_id   = "community_"+ mode +"_store";

            var com_st = Ext.getStore( com_st_id );

            var com = Ext.getCmp("community_entry").getRawValue();
            var as  = Ext.getCmp("as_entry").getRawValue();

            if(com_st.findExact("community", com) == -1) {
                com_st.add({
                    "community" : com
                    ,"as"       : as
                    ,"newrec"   : true
                });
            } else {
                var rec = com_st.findRecord("community", com, 0, false, true, true);
                rec.data.as = as;
            }
            Ext.getCmp(mode + "_grid").getView().refresh();
            Ext.getCmp("com_add_window").close();
        }
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:AS_PATH
    ,export_as_path             : function() {
        var as_path_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "as_path_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("as_path_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(0);
                        CP.export_4.open_as_path_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "as_path_edit_btn"
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        before_open_as_path_window("edit");
                    }
                },{
                    text        : "Delete"
                    ,id         : "as_path_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_as_path
                },{
                    text        : "Add (Reuse Path)"
                    ,id         : "as_path_reuse_btn"
                    ,disabled   : true
                    ,handler    : function(b, e) {
                        before_open_as_path_window("reuse");
                    }
                }
            ]
        };

        function before_open_as_path_window(mode) {
            if(CP.export_4.get_no_token()) { return; }
            var sm = Ext.getCmp("as_path_grid").getSelectionModel();
            if(sm.getCount() == 1) {
                CP.export_4.filter_to_proto(0);
                CP.export_4.open_as_path_window(mode);
            }
        }

        function before_delete_as_path() {
            var sm = Ext.getCmp("as_path_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                CP.export_4.clearParams();
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_as_path(recs[i]);
                }
                CP.export_4.LAST_PUSH = "as_path";
                CP.export_4.mySubmit();
            }
        }

        function delete_as_path(rec) {
            var params  = CP.export_4.getParams();

            var regex_origin_proto  = rec.data.regex_origin_proto;
            var to_proto    = rec.data.proto;
            var regex       = rec.data.regex;
            var origin      = rec.data.origin;
            var route       = rec.data.route;
            var mask        = rec.data.mask;

            var short_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":proto:bgp";
            var asp_prefix      = short_prefix +":aspath";
            var prefix          = asp_prefix +":asregex:"+ regex;
            var oprefix         = prefix + ":origin:"+ origin;

            if(route == CP.export_4.ALL_AS_PATH_LABEL) {
                params[oprefix +":all"]             = "";
                params[oprefix +":all:restrict"]    = "";
                params[oprefix +":metric"]          = "";
                params[oprefix +":all:metric"]      = "";
            } else {
                var rprefix = oprefix +":network:"+ route +":masklen:"+ mask;
                params[rprefix]                 = "";
                params[rprefix +":metric"]      = "";
                params[rprefix +":between"]     = "";
                params[rprefix +":and"]         = "";
                params[rprefix +":restrict"]    = "";
                params[rprefix +":exact"]       = "";
                params[rprefix +":refines"]     = "";
                params[rprefix +":normal"]      = "";
                params[rprefix +":range"]       = "";
            }
            var st = Ext.getStore("export_as_path_store");
            st.remove(rec);
            if(st.findExact("regex_origin_proto", regex_origin_proto) == -1) {
                params[oprefix]                             = "";
                params[oprefix +":riptag"]                  = "";
                params[oprefix +":ospfautomatictag"]        = "";
                params[oprefix +":ospfautomatictagvalue"]   = "";
                params[oprefix +":ospfmanualtag"]           = "";
                if( (st.findExact("regex_origin_proto", regex+"any"+to_proto) == -1)
                    || (st.findExact("regex_origin_proto", regex+"incomplete"+to_proto) == -1)
                    || (st.findExact("regex_origin_proto", regex+"EGP"+to_proto) == -1)
                    || (st.findExact("regex_origin_proto", regex+"IGP"+to_proto) == -1) ) {
                        params[prefix]  = "";
                }
            } else {
                //at least one other entry still goes to this proto
                var recs = st.getRange();
                var d;
                for(var i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if(d.regex_origin_proto == regex_origin_proto && d.route == route) {
                        //found another entry that is same proto, same regex, same origin, same route
                        return;
                    }
                }
                //did not find a same proto, same route, blank it
                params[oprefix +":network:"+ route] = "";
            }
            if(st.findExact("proto",to_proto) == -1) {
                params[asp_prefix] = ""; //...proto:bgp:aspath
            }
        }

        var as_path_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "AS Path; Origin; Route"
                ,dataIndex      : "regex_origin_proto"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var regex       = CP.export_4.DB_to_REGEX( rec.data.regex );
                    var origin      = rec.data.origin;
                    switch(origin) {
                        case "any":         origin = "Any";
                            break;
                        case "incomplete":  origin = "Incomplete";
                    }
                    var routemask   = rec.data.routemask;

                    var retValue    = regex +"; Origin: "+ origin +"; Route: "+ routemask;
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Action"
                ,dataIndex      : "restrict"
                ,width          : CP.export_4.ACTION_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.restrict == "t") {
                        retValue = "Restrict";
                    } else {
                        retValue = "Accept";
                    }
                    return CP.export_4.renderer_output(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.metric != "") {
                        retValue = rec.data.metric;
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "filtertype"
                ,width          : CP.export_4.MATCHTYPE_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case "normal":
                            retValue = "Normal";
                            break;
                        case "exact":
                            retValue = "Exact";
                            break;
                        case "refines":
                            retValue = "Refines";
                            break;
                        case "range":
                            retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                            break;
                        default:
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Tags"
                ,dataIndex      : "riptag"
                ,width          : CP.export_4.MISC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = "";
                    var this_proto  = rec.data.regex_origin_proto;
                    var st          = Ext.getStore("export_as_path_store");
                    var first_rec   = st.findRecord("regex_origin_proto",this_proto,0,false,true,true);
                    if(first_rec.id == rec.id) {
                        if(rec.data.proto == "rip") {
                            if(rec.data.riptag != "") {
                                retValue = "RIP Tag: " + rec.data.riptag;
                            }
                        } else if(rec.data.proto == "ospf2ase") {
                            retValue = "Automatic Tag "+ ((rec.data.ospfautomatictag) ? "Enabled" : "Disabled");
                            if(rec.data.ospfautomatictagvalue != ""){
                                retValue += "<br />Arbitrary Tag: "+ rec.data.ospfautomatictagvalue;
                            }
                            if(rec.data.ospfmanualtag != "") {
                                retValue += "<br />Manual Tag: "+ rec.data.ospfmanualtag;
                            }
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var as_path_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : false
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("as_path_add_btn");
                    var e_btn = Ext.getCmp("as_path_edit_btn");
                    var d_btn = Ext.getCmp("as_path_delete_btn");
                    var r_btn = Ext.getCmp("as_path_reuse_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(r_btn) { r_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var as_path_grid = {
            xtype               : "cp4_grid"
            ,id                 : "as_path_grid"
            ,width              : CP.export_4.AS_PATH_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_as_path_store")
            ,columns            : as_path_cm
            ,selModel           : as_path_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : function() {
                    before_open_as_path_window("edit");
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_as_path_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute BGP Routes Based on AS Path"
                }
                ,as_path_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ as_path_grid ]
                }
            ]
        };
    }

    ,open_as_path_window        : function(TITLE) {
        //cases:    fields:     regex       origin      to_proto    route
            //
            //add   :           textfield   combobox    combobox    editable
            //reuse :           display     display     combobox    editable
            //edit  :           display     display     display     display

        var proto_cmp;
        var all_cmp;
        var notationCmp;
        var regex_cmp;  //what is seen
        var origin_cmp;
        var regex_db_string = "";

        if(TITLE == "add" || TITLE == "reuse") {
            proto_cmp   = CP.export_4.get_variable_proto_cmp();
            notationCmp = CP.export_4.get_variable_notation_cmp();
            all_cmp     = {
                xtype           : "cp4_checkbox"
                ,fieldLabel     : "All Routes"
                ,id             : "all_entry"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;"
                ,listeners      : {
                    change          : function() {
                        var val = Ext.getCmp("all_entry").getValue();
                        Ext.getCmp("network_set").setVisible( !val );
                        Ext.getCmp("network_set").setDisabled( val );
                        Ext.getCmp("notation_form").setDisabled(val);
                    }
                }
            };
        } else {
            proto_cmp   = CP.export_4.get_constant_proto_cmp();
            notationCmp = CP.export_4.get_constant_notation_cmp("BGP Route");
            all_cmp     = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "BGP Route"
                ,id             : "all_entry"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;"
                ,value          : "All"
            };
        }

        if(TITLE == "add") {
            TITLE = "Redistribute BGP Route Based on AS Path";
            regex_cmp   = {
                xtype           : "cp4_textfield"
                ,fieldLabel     : "AS Path RegEx"
                ,id             : "regex_display"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 530
                ,allowBlank     : false
                ,maskRe         : /[0-9\ \[\]\(\)\*\+\?\|\.\-\^]/
                ,validator      : function(v) {
                    var len = v.length;
                    if(len == 0) {
                        return "";
                    }
                    if(len > 0) {
                        if(v[0] == " ") {
                            return "AS Path may not begin with whitespace.";
                        }
                        if(v[len -1] == " ") {
                            return "AS Path may not end with whitespace.";
                        }
                    }

                    var regex_db = CP.export_4.REGEX_to_DB(CP.export_4.cleanup_regex(v));
                    var origin = Ext.getCmp("origin_entry").getValue();
                    var recs = Ext.getStore("export_as_path_store").getRange();
                    var proto = Ext.getCmp("to_proto").getValue();
                    if(proto == "") {
                        return true;
                    }
                    if(origin == "") {
                        return true;
                    }
                    for(var i = 0; i < recs.length; i++) {
                        if(recs[i].data.proto == proto) {
                            if(recs[i].data.regex == regex_db) {
                                if(recs[i].data.origin != origin) {
                                    return CP.export_4.SAME_PROTO_n_REGEX_diff_ORIGIN;
                                }
                            }
                        }
                    }
                    return true;
                }
                ,listeners      : {
                    change          : function() {
                        var value = String(Ext.getCmp("regex_display").getValue());
                        var regex = "";
                        if(value.length > 0) {
                            //strip alphabet and consecutive whitespace
                            value = CP.export_4.cleanup_regex(value);
                            regex = CP.export_4.REGEX_to_DB(value);
                        }
                        Ext.getCmp("regex_display").setValue(value);
                        Ext.getCmp("regex_entry").setValue(regex);

                        Ext.getCmp("origin_entry").validate();
                        Ext.getCmp("to_proto").validate();
                        var origin      = String(Ext.getCmp("origin_entry").getValue());
                        var to_proto    = String(Ext.getCmp("to_proto").getValue());
                        var riptag  = Ext.getCmp("riptag");
                        var ospf_f  = Ext.getCmp("ospf_tag_form");

                        if(regex == "" || origin == "" || (to_proto != "rip" && to_proto != "ospf2ase") ) {
                            riptag.setValue("");
                            riptag.setRawValue("");
                            Ext.getCmp("ospfautomatictag_entry").setValue(false);
                            Ext.getCmp("ospfautomatictagvalue_entry").setValue("");
                            Ext.getCmp("ospfautomatictagvalue_entry").setRawValue("");
                            Ext.getCmp("ospfmanualtag_entry").setValue("");
                            Ext.getCmp("ospfmanualtag_entry").setRawValue("");
                            return;
                        }

                        var regex_origin_proto  = String(regex + origin + to_proto);

                        var st      = Ext.getStore("export_as_path_store");
                        var rec = st.findRecord("regex_origin_proto", regex_origin_proto, 0, false, true, true);
                        if(rec) {
                            riptag.setValue(rec.data.riptag);
                            ospf_f.loadRecord(rec);
                        } else {
                            riptag.setValue("");
                            riptag.setRawValue("");
                            Ext.getCmp("ospfautomatictag_entry").setValue(false);
                            Ext.getCmp("ospfautomatictagvalue_entry").setValue("");
                            Ext.getCmp("ospfautomatictagvalue_entry").setRawValue("");
                            Ext.getCmp("ospfmanualtag_entry").setValue("");
                            Ext.getCmp("ospfmanualtag_entry").setRawValue("");
                        }
                    }
                    ,afterrender    : function(field, eOpts) {
                        field.validate();
                    }
                }
            };
            origin_cmp  = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Origin"
                ,id             : "origin_entry"
                ,name           : "origin"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,queryMode      : "local"
                ,mode           : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          :   [["any"         ,"Any"]
                                    ,["IGP"         ,"IGP"]
                                    ,["EGP"         ,"EGP"]
                                    ,["incomplete"  ,"Incomplete"]]
                ,allowBlank     : false
                ,value          : ""
                ,validator      : function(v) {
                    var regex       = String(Ext.getCmp("regex_entry").getValue());
                    var origin      = String(Ext.getCmp("origin_entry").getValue());
                    var to_proto    = String(Ext.getCmp("to_proto").getValue());
                    if(origin == "") {
                        return "";
                    }
                    if(to_proto == "" || regex == "") {
                        return true;
                    }
                    //check if there is a matching regex and proto with a different origin,
                    var regex_db = CP.export_4.REGEX_to_DB(regex);
                    var recs = Ext.getStore("export_as_path_store").getRange();
                    for(var i = 0; i < recs.length; i++) {
                        if(recs[i].data.proto == to_proto) {
                            if(recs[i].data.regex == regex_db) {
                                if(recs[i].data.origin != origin) {
                                    return CP.export_4.SAME_PROTO_n_REGEX_diff_ORIGIN;
                                }
                            }
                        }
                    }
                    return true;
                }
                ,listeners      : {
                    afterrender     : function(field, eOpts) {
                        field.validate();
                    }
                    ,select         : function(c, recs, eOpts) {
                        Ext.getCmp("regex_display").validate();
                        Ext.getCmp("to_proto").validate();
                        var regex       = String(Ext.getCmp("regex_entry").getValue());
                        var origin      = String(Ext.getCmp("origin_entry").getValue());
                        var to_proto    = String(Ext.getCmp("to_proto").getValue());

                        var riptag  = Ext.getCmp("riptag");
                        var ospf_f  = Ext.getCmp("ospf_tag_form");

                        Ext.getCmp("regex_display").validate();

                        if(regex == "" || origin == "" || (to_proto != "rip" && to_proto != "ospf2ase") ) {
                            riptag.setValue("");
                            riptag.setRawValue("");
                            Ext.getCmp("ospfautomatictag_entry").setValue(false);
                            Ext.getCmp("ospfautomatictagvalue_entry").setValue("");
                            Ext.getCmp("ospfautomatictagvalue_entry").setRawValue("");
                            Ext.getCmp("ospfmanualtag_entry").setValue("");
                            Ext.getCmp("ospfmanualtag_entry").setRawValue("");
                            return;
                        }

                        var regex_origin_proto  = String(regex + origin + to_proto);

                        var st      = Ext.getStore("export_as_path_store");
                        var rec = st.findRecord("regex_origin_proto", regex_origin_proto, 0, false, true, true);
                        if(rec) {
                            riptag.setValue(rec.data.riptag);
                            ospf_f.loadRecord(rec);
                        } else {
                            riptag.setValue("");
                            riptag.setRawValue("");
                            Ext.getCmp("ospfautomatictag_entry").setValue(false);
                            Ext.getCmp("ospfautomatictagvalue_entry").setValue("");
                            Ext.getCmp("ospfautomatictagvalue_entry").setRawValue("");
                            Ext.getCmp("ospfmanualtag_entry").setValue("");
                            Ext.getCmp("ospfmanualtag_entry").setRawValue("");
                        }
                    }
                }
            };
        } else {
            var rec = Ext.getCmp("as_path_grid").getSelectionModel().getLastSelected();
            regex_db_string         = rec.data.regex;
            var regex_display_string= CP.export_4.DB_to_REGEX(regex_db_string);
            var origin_display      = rec.data.origin;
            switch(origin_display) {
                case "any":         origin_display = "Any";
                    break;
                case "incomplete":  origin_display = "Incomplete";
                    break;
                default:
            }

            if(TITLE == "reuse") {
                TITLE   = "Redistribute BGP Route Based on AS Path "
                        + regex_display_string +" with Origin "+ origin_display;
            } else {
                TITLE   = "Edit Redistribution of BGP Route "+ rec.data.routemask +" AS Path "
                        + regex_display_string +" with Origin "+ origin_display
                        +" into "+ rec.data.proto_mask;
            }
            regex_cmp   = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Based on AS Path"
                ,id             : "regex_display"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 530
                ,height         : 22
                ,value          : regex_display_string
            };
            origin_cmp  = {
                xtype   : "cp4_formpanel"
                ,items  : [
                    {
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Origin"
                        ,id             : "origin_display"
                        ,labelWidth     : CP.export_4.LABELWIDTH
                        ,width          : 530
                        ,height         : 22
                        ,value          : origin_display
                    },{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "origin_entry"
                        ,id             : "origin_entry"
                        ,name           : "origin"
                        ,labelWidth     : CP.export_4.LABELWIDTH
                        ,width          : 530
                        ,height         : 22
                        ,value          : rec.data.origin
                        ,hidden         : true
                        ,hideLabel      : true
                    }
                ]
            };
        }

        var regex_origin_set = {   //containing set for regex and origin
            xtype   : "cp4_formpanel"
            ,id     : "regex_origin_set"
            ,width  : 530
            ,margin : "0 0 0 15"
            ,items  : [
                regex_cmp
                ,origin_cmp
                ,{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "regex_entry"
                    ,id             : "regex_entry"
                    ,name           : "regex"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 530
                    ,value          : regex_db_string
                    ,hidden         : true
                    ,hideLabel      : true
                }
            ]
        };

        var network_set = {
            xtype   : "cp4_formpanel"
            ,id     : "network_set"
            ,width  : 530
            ,margin : "0 0 0 15"
            ,padding: 0
            ,items  : [
                notationCmp
                ,{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        select          : function() {
                            var value = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                            Ext.getCmp("range_set").setVisible( value == "range" );
                            Ext.getCmp("range_set").setDisabled( value != "range" );
                            Ext.getCmp("between_entry").validate();
                            Ext.getCmp("and_entry").validate();
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 530
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var m = CP.export_4.getMaskLength("mask_entry");

                                if(m == "") { m = 0; }
                                if(b == "") { b = -1; }
                                if(a == "") { a = 32; }

                                if(b < m) {
                                    return "From Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(b > 32) {
                                    return "Maximum value is 32.";
                                }

                                if(b > a) {
                                    return "From Mask Length must be less than or equal to To Mask Length.";
                                }

                                return true;
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var m = CP.export_4.getMaskLength("mask_entry");

                                if(m == "") { m = 0; }
                                if(b == "") { b = m; }
                                if(a == "") { a = -1; }

                                if(a < m) {
                                    return "To Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(a < b) {
                                    return "To Mask Length must be greater than or equal to From Mask Length.";
                                }

                                if(a > 32) {
                                    return "Maximum value is 32.";
                                }

                                return true;
                            }
                        }
                    ]
                }
            ]
        };

        function as_path_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("as_path");

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("as_path_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                if(rec.data.route != CP.export_4.ALL_AS_PATH_LABEL) {
                    Ext.getCmp("all_entry").setValue("");
                }
                Ext.getCmp("all_entry").setVisible( rec.data.route == CP.export_4.ALL_AS_PATH_LABEL );
                Ext.getCmp("network_set").setDisabled( rec.data.route == CP.export_4.ALL_AS_PATH_LABEL );
                Ext.getCmp("network_set").setVisible( rec.data.route != CP.export_4.ALL_AS_PATH_LABEL );
                Ext.getCmp("filtertype_entry").fireEvent("select");

                Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                Ext.getCmp("ospf_tag_form").setVisible( rec.data.proto == "ospf2ase" );
                Ext.getCmp("ospf_tag_form").setDisabled( rec.data.proto != "ospf2ase" );

                CP.export_4.manage_metric(rec.data.proto);

                if(rec.data.metric == "") {
                    Ext.getCmp("metric").setRawValue("");
                }
                Ext.getCmp("restrict_entry").fireEvent("change");

            } else {
                //add or reuse
                Ext.getCmp("filtertype_entry").fireEvent("select");
                Ext.getCmp("all_entry").fireEvent("change");
                Ext.getCmp("to_proto").validate();
                Ext.getCmp("to_proto").fireEvent("select");
                CP.export_4.manage_metric(CP.export_4.default_proto_type);
                Ext.getCmp("metric").validate();

            }
        }

        var as_path_form = {
            xtype       : "cp4_formpanel"
            ,id         : "as_path_form"
            ,width      : 560
            ,height     : 365
            ,autoScroll : false
            ,listeners  : {
                afterrender : as_path_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "as_path_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("as_path_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        as_path_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("as_path_window").close();
                    }
                }
            ]
            ,items      : [
                { xtype: "tbspacer", width: 15, height: 15 }
                ,proto_cmp
                ,regex_origin_set
                ,all_cmp
                ,network_set
                ,{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{ //riptag
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "RIP Tag"
                    ,id                 : "riptag"
                    ,name               : "riptag"
                    ,labelWidth         : CP.export_4.LABELWIDTH
                    ,width              : 250
                    ,style              : "margin-left:15px;"
                    ,minValue           : 1
                    ,maxValue           : 65535
                    ,allowDecimals      : false
                    ,allowBlank         : true
                    ,maxLength          : 5
                    ,enforceMaxLength   : true
                    ,listeners          : {
                        show                : function(field, eOpts) {
                            var regex       = String(Ext.getCmp("regex_entry").getValue());
                            var origin      = String(Ext.getCmp("origin_entry").getValue());
                            var to_proto    = String(Ext.getCmp("to_proto").getValue());
                            if(regex == "" || origin == "" || to_proto != "rip") {
                                return;
                            }

                            var regex_origin_proto  = String(regex + origin + to_proto);

                            var riptag  = Ext.getCmp("riptag");
                            var st      = Ext.getStore("export_as_path_store");
                            var rec = st.findRecord("regex_origin_proto", regex_origin_proto, 0, false, true, true);
                            if(rec) { riptag.setValue(rec.data.riptag); }
                        }
                    }
                }
                ,CP.export_4.get_ospf_tag_form("as_path")
            ]
        };

        var as_path_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "as_path_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() != "cp4_displayfield") {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ as_path_form ]
        });
        as_path_window.show();

        function as_path_save() {
            var params = CP.export_4.clearParams();

            var to_proto    = Ext.getCmp("to_proto").getValue();
            var regex       = Ext.getCmp("regex_entry").getValue();
            var origin      = Ext.getCmp("origin_entry").getValue();

            if(to_proto == "" || regex == "" || origin == "") {
                return;
            }

            var all         = Ext.getCmp("all_entry").getValue();
            var net         = Ext.getCmp("route_entry").getValue();
            var mask        = CP.export_4.getMaskLength("mask_entry");

            var metric      = Ext.getCmp("metric").getRawValue();
            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = (filtertype == "range") ? Ext.getCmp("between_entry").getValue() : "";
            var and         = (filtertype == "range") ? Ext.getCmp("and_entry").getValue() : "";

            var restrict    = Ext.getCmp("restrict_entry").getValue(); //"t" == restrict, "" == accept

            var ospfautotag = (Ext.getCmp("ospfautomatictag_entry").getValue()) ? "t" : "";
            var ospfautoval = (to_proto == "ospf2ase") ? Ext.getCmp("ospfautomatictagvalue_entry").getRawValue() : "";
            if(ospfautotag == "") {
                ospfautoval = "";
            }
            var ospfmantag  = (to_proto == "ospf2ase") ? Ext.getCmp("ospfmanualtag_entry").getRawValue() : "";
            var riptag      = (to_proto == "rip") ? Ext.getCmp("riptag").getRawValue() : "";

            var short_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":proto:bgp";
            var asp_prefix      = short_prefix +":aspath";
            var prefix          = asp_prefix +":asregex:"+ regex;
            var oprefix         = prefix +":origin:"+ origin;

            params[asp_prefix]                          = "t";
            params[prefix]                              = "t";
            params[oprefix]                             = "t";
            params[oprefix +":riptag"]                  = riptag;
            params[oprefix +":ospfautomatictag"]        = ospfautotag;
            params[oprefix +":ospfautomatictagvalue"]   = ospfautoval;
            params[oprefix +":ospfmanualtag"]           = ospfmantag;

            if(all == CP.export_4.ALL_AS_PATH_LABEL || all == true) {
                //all
                params[oprefix +":all"]             = "t";
                params[oprefix +":all:restrict"]    = restrict;
                params[oprefix +":metric"]          = (restrict == "t") ? "" : metric;
                params[oprefix +":all:metric"]      = (restrict == "t") ? "" : metric;

            } else {
                //individual route
                var rprefix = oprefix +":network:"+ net +":masklen:"+ mask;
                params[oprefix +":network:"+ net]   = "t";
                params[rprefix]                     = "t";
                params[rprefix +":metric"]          = (restrict == "t") ? "" : metric;
                params[rprefix +":restrict"]        = restrict;

                params[rprefix +":refines"]         = "";
                params[rprefix +":exact"]           = "";
                params[rprefix +":normal"]          = "";
                params[rprefix +":range"]           = "";

                params[rprefix +":filtertype"]      = filtertype;
                params[rprefix +":"+ filtertype]    = "t";
                params[rprefix +":between"]         = between;
                params[rprefix +":and"]             = and;
            }

            Ext.getCmp("as_path_window").close();
            CP.export_4.LAST_PUSH = "as_path";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }
////////////////////////////////////////////////////////////////////////////////
//STUB:AS
    ,export_as                  : function() {
        var as_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    text        : "Add"
                    ,id         : "as_add_btn"
                    ,handler    : function(b, e) {
                        Ext.getCmp("as_grid").getSelectionModel().deselectAll();
                        if(CP.export_4.get_no_token()) { return; }
                        CP.export_4.filter_to_proto(0);
                        CP.export_4.open_as_window("add");
                    }
                },{
                    text        : "Edit"
                    ,id         : "as_edit_btn"
                    ,disabled   : true
                    ,handler    : before_open_as_window
                },{
                    text        : "Delete"
                    ,id         : "as_delete_btn"
                    ,disabled   : true
                    ,handler    : before_delete_as
                }
            ]
        };

        function before_open_as_window() {
            var sm = Ext.getCmp("as_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                var rec = sm.getLastSelected();
                var T   = "Edit Redistribution of BGP AS "+ rec.data.as +", "
                        + rec.data.routemask +" to "+ rec.data.proto_mask;
                CP.export_4.open_as_window(T);
            }
        }

        function before_delete_as() {
            var sm = Ext.getCmp("as_grid").getSelectionModel();
            if(CP.export_4.get_no_token()) { return; }
            if(sm.getCount() > 0) {
                CP.export_4.clearParams();
                var recs = sm.getSelection();
                for(var i = 0; i < recs.length; i++) {
                    delete_as(recs[i]);
                }
                CP.export_4.LAST_PUSH = "as";
                CP.export_4.mySubmit();
            }
        }

        function delete_as(rec) {
            var params = CP.export_4.getParams();

            var to_proto    = rec.data.proto;
            var from_as     = rec.data.as;
            var route       = rec.data.route;
            var mask        = rec.data.mask;
            var as_proto    = rec.data.as_proto;

            var short_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":proto:bgp";
            var prefix          = short_prefix +":autonomoussystem:"+ from_as;

            if(route == CP.export_4.ALL_AS_LABEL) {
                //All
                params[prefix +":all"]          = "";
                params[prefix +":metric"]       = ""; //rip and ospf2ase all metric
                params[prefix +":all:metric"]   = ""; //bgp all metric
                params[prefix +":all:restrict"] = "";
            } else {
                var net_prefix  = prefix +":network:"+ route;
                var mask_prefix = net_prefix +":masklen:"+ mask;
                params[mask_prefix] = "";
                params[mask_prefix +":metric"]      = "";
                params[mask_prefix +":between"]     = "";
                params[mask_prefix +":and"]         = "";
                params[mask_prefix +":restrict"]    = "";
                params[mask_prefix +":normal"]      = "";
                params[mask_prefix +":range"]       = "";
                params[mask_prefix +":exact"]       = "";
                params[mask_prefix +":refines"]     = "";
            }
            var export_as_store = Ext.getStore("export_as_store");
            export_as_store.remove(rec);
            if(export_as_store.findExact("as_proto",as_proto) == -1) {
                params[prefix]                              = "";
                params[prefix +":ospfautomatictag"]         = "";
                params[prefix +":ospfautomatictagvalue"]    = "";
                params[prefix +":ospfmanualtag"]            = "";
                params[prefix +":riptag"]                   = "";
            } else {
                //at least one other entry still goes to this proto
                var recs = export_as_store.getRange();
                var d;
                for(var i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if(d.as_proto == as_proto && d.route == route) {
                        //found another rec with the same as, proto, and route (different masklength)
                        return;
                    }
                }
                //did not find
                params[net_prefix]  = "";
            }
        }

        var as_cm = [
            {
                header          : CP.export_4.TO_PROTOCOL_LABEL
                ,dataIndex      : "proto_mask"
                ,width          : CP.export_4.TO_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : CP.export_4.renderer_generic
            },{
                header          : "BGP Route"
                ,dataIndex      : "as"
                ,width          : CP.export_4.FROM_PROTO_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "AS "+ rec.data.as +"; "+ rec.data.routemask;
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Action"
                ,dataIndex      : "restrict"
                ,width          : CP.export_4.ACTION_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.restrict == "t") {
                        retValue = "Restrict";
                    } else {
                        retValue = "Accept";
                    }
                    return CP.export_4.renderer_output(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "metric"
                ,width          : CP.export_4.METRIC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.metric != "") {
                        retValue = rec.data.metric;
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Match Type"
                ,dataIndex      : "filtertype"
                ,width          : CP.export_4.MATCHTYPE_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch(value.toLowerCase()) {
                        case "normal":
                            retValue = "Normal";
                            break;
                        case "exact":
                            retValue = "Exact";
                            break;
                        case "refines":
                            retValue = "Refines";
                            break;
                        case "range":
                            retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                            break;
                        default:
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            },{
                header          : "Tags"
                ,dataIndex      : "riptag"
                ,width          : CP.export_4.MISC_WIDTH
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = "";
                    var this_proto  = rec.data.as_proto;
                    var st          = Ext.getStore("export_as_store");
                    var first_rec   = st.findRecord("as_proto",this_proto,0,false,true,true);
                    if(first_rec.id == rec.id) {
                        if(rec.data.proto == "rip") {
                            if(rec.data.riptag != "") {
                                retValue = "RIP Tag: " + rec.data.riptag;
                            }
                        } else if(rec.data.proto == "ospf2ase") {
                            retValue = "Automatic Tag "+ ((rec.data.ospfautomatictag) ? "Enabled" : "Disabled");
                            if(rec.data.ospfautomatictagvalue != ""){
                                retValue += "<br />Arbitrary Tag: "+ rec.data.ospfautomatictagvalue;
                            }
                            if(rec.data.ospfmanualtag != "") {
                                retValue += "<br />Manual Tag: "+ rec.data.ospfmanualtag;
                            }
                        }
                    }
                    return CP.export_4.renderer_output(retValue);
                }
            }
        ];

        var as_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : false
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var no_token = CP.export_4.get_no_token();
                    var a_btn = Ext.getCmp("as_add_btn");
                    var e_btn = Ext.getCmp("as_edit_btn");
                    var d_btn = Ext.getCmp("as_delete_btn");
                    if(a_btn) { a_btn.setDisabled( no_token ); }
                    if(e_btn) { e_btn.setDisabled( no_token || selections.length != 1); }
                    if(d_btn) { d_btn.setDisabled( no_token || selections.length == 0); }
                }
            }
        });

        var as_grid = {
            xtype               : "cp4_grid"
            ,id                 : "as_grid"
            ,width              : CP.export_4.AS_GRID_WIDTH
            ,height             : CP.export_4.MAX_GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("export_as_store")
            ,columns            : as_cm
            ,selModel           : as_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.export_4.enableColumnResize
            ,listeners          : {
                itemdblclick        : before_open_as_window
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "export_as_set"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Redistribute BGP Routes Based on AS"
                }
                ,as_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ as_grid ]
                }
            ]
        };
    }

    ,open_as_window             : function(TITLE) {
        var proto_cmp;
        var bgp_cmp;
        var all_cmp;
        var notationCmp;
        if(TITLE == "add") {
            //add
            TITLE       = "Redistribute BGP Route Based on AS";
            //"to_proto"
            proto_cmp   = CP.export_4.get_variable_proto_cmp();
            //"notation_form"
            notationCmp = CP.export_4.get_variable_notation_cmp();
            bgp_cmp     = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "From BGP AS"
                ,id             : "from_bgp"
                ,name           : "as"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,style          : "margin-left:15px;"
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("as_store")
                ,valueField     : "AS"
                ,displayField   : "AS"
                ,allowBlank     : false
                ,listeners      : {
                    select          : function(c, recs, eOpts) {
                        var from_bgp    = String(Ext.getCmp("from_bgp").getValue());
                        var to_proto    = String(Ext.getCmp("to_proto").getValue());
                        var as_proto    = String(from_bgp + to_proto);
                        var riptag      = Ext.getCmp("riptag");
                        var ospf_f      = Ext.getCmp("ospf_tag_form");
                        var rec;
                        var st          = Ext.getStore("export_as_store");
                        if(to_proto == "rip" || to_proto == "ospf2ase") {
                            rec = st.findRecord("as_proto", as_proto, 0, false, true, true);
                            if(rec) {
                                riptag.setValue(rec.data.riptag);
                                ospf_f.loadRecord(rec);
                            } else {
                                riptag.setValue("");
                                riptag.setRawValue("");
                                Ext.getCmp("ospfautomatictag_entry").setValue(false);
                                Ext.getCmp("ospfautomatictagvalue_entry").setValue("");
                                Ext.getCmp("ospfautomatictagvalue_entry").setRawValue("");
                                Ext.getCmp("ospfmanualtag_entry").setValue("");
                                Ext.getCmp("ospfmanualtag_entry").setRawValue("");
                            }
                        }
                    }
                }
            };
            all_cmp     = {
                xtype           : "cp4_checkbox"
                ,fieldLabel     : "All Routes"
                ,id             : "all_entry"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;"
                ,listeners      : {
                    change          : function() {
                        var val = Ext.getCmp("all_entry").getValue();
                        Ext.getCmp("network_set").setVisible( !val );
                        Ext.getCmp("network_set").setDisabled( val );
                        Ext.getCmp("notation_form").setDisabled(val);
                    }
                }
            };

        } else {//edit

            //"to_proto"
            proto_cmp   = CP.export_4.get_constant_proto_cmp();
            //"notation_form"
            notationCmp = CP.export_4.get_constant_notation_cmp("BGP Route");
            bgp_cmp     = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "From BGP AS"
                ,id             : "from_bgp"
                ,name           : "as"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;"
            };
            all_cmp     = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "BGP Route"
                ,id             : "all_entry"
                ,labelWidth     : CP.export_4.LABELWIDTH
                ,width          : 250
                ,height         : 22
                ,style          : "margin-left:15px;"
                ,value          : "All"
            };

        }

        var network_set = {
            xtype   : "cp4_formpanel"
            ,id     : "network_set"
            ,width  : 530
            ,margin : "0 0 0 15"
            ,padding: 0
            ,items  : [
                notationCmp
                ,{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : CP.export_4.LABELWIDTH
                    ,width          : 250
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        select          : function() {
                            var value = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                            Ext.getCmp("range_set").setVisible( value == "range" );
                            Ext.getCmp("range_set").setDisabled( value != "range" );
                            Ext.getCmp("between_entry").setDisabled( value != "range" );
                            Ext.getCmp("between_entry").validate();
                            Ext.getCmp("and_entry").setDisabled( value != "range" );
                            Ext.getCmp("and_entry").validate();
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 530
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,listeners      : {
                        disable         : function() {
                            Ext.getCmp("between_entry").validate();
                            Ext.getCmp("and_entry").validate();
                        }
                    }
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var m = CP.export_4.getMaskLength("mask_entry");

                                if(m == "") { m = 0; }
                                if(b == "") { b = -1; }
                                if(a == "") { a = 32; }

                                if(b < m) {
                                    return "From Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(b > 32) {
                                    return "Maximum value is 32.";
                                }

                                if(b > a) {
                                    return "From Mask Length must be less than or equal to To Mask Length.";
                                }

                                return true;
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,value          : 32
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,blur           : function() {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b = Ext.getCmp("between_entry").getValue();
                                var a = Ext.getCmp("and_entry").getValue();
                                var m = CP.export_4.getMaskLength("mask_entry");

                                if(m == "") { m = 0; }
                                if(b == "") { b = m; }
                                if(a == "") { a = -1; }

                                if(a < m) {
                                    return "To Mask Length must be greater than or equal to the Mask Length.";
                                }

                                if(a < b) {
                                    return "To Mask Length must be greater than or equal to From Mask Length.";
                                }

                                if(a > 32) {
                                    return "Maximum value is 32.";
                                }

                                return true;
                            }
                        }
                    ]
                }
            ]
        };

        function as_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.export_4.set_from_proto("as");

            if(Ext.getCmp("to_proto").getXType() == "cp4_displayfield") {
                //edit
                var rec = Ext.getCmp("as_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                if(rec.data.route != CP.export_4.ALL_AS_LABEL) {
                    Ext.getCmp("all_entry").setValue("");
                }
                Ext.getCmp("all_entry").setVisible( rec.data.route == CP.export_4.ALL_AS_LABEL );
                Ext.getCmp("network_set").setDisabled( rec.data.route == CP.export_4.ALL_AS_LABEL );
                Ext.getCmp("network_set").setVisible( rec.data.route != CP.export_4.ALL_AS_LABEL );
                Ext.getCmp("filtertype_entry").fireEvent("select");

                Ext.getCmp("riptag").setVisible( rec.data.proto == "rip" );
                Ext.getCmp("riptag").setDisabled( rec.data.proto != "rip" );
                Ext.getCmp("ospf_tag_form").setVisible( rec.data.proto == "ospf2ase" );
                Ext.getCmp("ospf_tag_form").setDisabled( rec.data.proto != "ospf2ase" );

                CP.export_4.manage_metric(rec.data.proto);

                if(rec.data.metric == "") {
                    Ext.getCmp("metric").setRawValue("");
                }
                Ext.getCmp("restrict_entry").fireEvent("change");

            } else {
                //add
                Ext.getCmp("filtertype_entry").fireEvent("select");
                Ext.getCmp("all_entry").fireEvent("change");
                Ext.getCmp("to_proto").validate();
                Ext.getCmp("to_proto").fireEvent("select");
                Ext.getCmp("from_bgp").validate();
                CP.export_4.manage_metric(CP.export_4.default_proto_type);
                Ext.getCmp("metric").validate();

            }
        }

        var as_form = {
            xtype       : "cp4_formpanel"
            ,id         : "as_form"
            ,width      : 560
            ,height     : 305
            ,autoScroll : false
            ,listeners  : {
                afterrender : as_afterrender
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "as_save_btn"
                    ,text       : "Save"
                    ,formBind   : true
                    ,disabled   : true
                    ,handler    : function(b,e) {
                        var panel = Ext.getCmp("as_form");
                        if(panel && !( panel.getForm().isValid() ) ) { return; }
                        as_save(b,e);
                    }
                },{
                    xtype       : "cp4_button"
                    ,text       : "Cancel"
                    ,handler    : function(b, e) {
                        Ext.getCmp("as_window").close();
                    }
                }
            ]
            ,items      : [
                { xtype: "tbspacer", width: 15, height: 15 }
                ,{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [ proto_cmp, bgp_cmp ]
                }
                ,all_cmp
                ,network_set
                ,{
                    xtype           : "cp4_formpanel"
                    ,width          : 545
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,items          : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change          : function() {
                                    var vis = (Ext.getCmp("restrict_entry").getValue() == "") ? true : false;
                                    var metric_cmp = Ext.getCmp("metric");
                                    if(metric_cmp) {
                                        metric_cmp.setVisible(vis);
                                        metric_cmp.setDisabled(!vis);
                                        metric_cmp.validate();
                                    }
                                }
                            }
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric"
                            ,name           : "metric"
                            ,labelWidth     : CP.export_4.LABELWIDTH
                            ,width          : 250
                            ,allowBlank     : true
                            ,style          : "margin-left:15px;"
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,allowDecimals  : false
                            ,allowBlank     : true
                        }
                    ]
                },{ //riptag
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "RIP Tag"
                    ,id                 : "riptag"
                    ,name               : "riptag"
                    ,labelWidth         : CP.export_4.LABELWIDTH
                    ,width              : 250
                    ,style              : "margin-left:15px;"
                    ,minValue           : 1
                    ,maxValue           : 65535
                    ,allowDecimals      : false
                    ,allowBlank         : true
                    ,maxLength          : 5
                    ,enforceMaxLength   : true
                    ,listeners          : {
                        show                : function(field, eOpts) {
                            var from_bgp    = String(Ext.getCmp("from_bgp").getValue());
                            var to_proto    = String(Ext.getCmp("to_proto").getValue());
                            var as_proto    = String(from_bgp + to_proto);
                            var riptag      = Ext.getCmp("riptag");
                            var rec;
                            var st          = Ext.getStore("export_as_store");
                            if(to_proto == "rip" && from_bgp != "") {
                                rec = st.findRecord("as_proto", as_proto, 0, false, true, true);
                                if(rec) { riptag.setValue(rec.data.riptag); }
                            }
                        }
                    }
                }
                ,CP.export_4.get_ospf_tag_form("as")
            ]
        };

        var as_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "as_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    if(Ext.getCmp("to_proto").getXType() != "cp4_displayfield") {
                        //STUB Ext.getCmp("to_proto").expand();
                    }
                }
            }
            ,items      : [ as_form ]
        });
        as_window.show();

        function as_save() {
            var params      = CP.export_4.clearParams();
            var to_proto    = Ext.getCmp("to_proto").getValue();
            var from_bgp    = Ext.getCmp("from_bgp").getValue();
            var all         = Ext.getCmp("all_entry").getValue();
            var net         = Ext.getCmp("route_entry").getValue();
            var mask        = CP.export_4.getMaskLength("mask_entry");

            var metric      = Ext.getCmp("metric").getRawValue();
            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = (filtertype == "range") ? Ext.getCmp("between_entry").getValue() : "";
            var and         = (filtertype == "range") ? Ext.getCmp("and_entry").getValue() : "";

            var restrict_raw    = Ext.getCmp("restrict_entry").getValue(); //"t" == restrict, "" == accept
            var accept_all      = (restrict_raw == "t") ? "" : "t";
            var restrict        = restrict_raw;

            var ospfautotag = (Ext.getCmp("ospfautomatictag_entry").getValue()) ? "t" : "";
            var ospfautoval = (to_proto == "ospf2ase") ? Ext.getCmp("ospfautomatictagvalue_entry").getRawValue() : "";
            if(ospfautotag == "") {
                ospfautoval = "";
            }
            var ospfmantag  = (to_proto == "ospf2ase") ? Ext.getCmp("ospfmanualtag_entry").getRawValue() : "";
            var riptag                  = (to_proto == "rip") ? Ext.getCmp("riptag").getRawValue() : "";

            var short_prefix    = "routed:instance:"+ CP.export_4.INSTANCE
                                + ":export_proto:"+ to_proto +":proto:bgp";
            var prefix          = short_prefix +":autonomoussystem:"+ from_bgp;

            params[prefix]                              = "t";
            params[prefix +":riptag"]                   = riptag;
            params[prefix +":ospfautomatictag"]         = ospfautotag;
            params[prefix +":ospfautomatictagvalue"]    = ospfautoval;
            params[prefix +":ospfmanualtag"]            = ospfmantag;

            if(all == "All" || all == true) {
                //all
                params[prefix +":all"]          = "t";
                params[prefix +":all:restrict"] = restrict_raw;
                if(to_proto == "rip" || to_proto == "ospf2ase") {
                    params[prefix +":metric"]   = (restrict_raw == "t") ? "" : metric;
                    params[prefix +":all:metric"]=(restrict_raw == "t") ? "" : metric;
                } else {
                    params[prefix +":all:metric"]   = metric; //this is the ONLY time they are inconsistent
                }

            } else {
                //individual route
                var rprefix = prefix +":network:"+ net +":masklen:"+ mask;
                params[prefix +":network:"+ net]    = "t";
                params[rprefix]                     = "t";
                params[rprefix +":metric"]          = (restrict == "t") ? "" : metric;
                params[rprefix +":restrict"]        = restrict;

                params[rprefix +":refines"]         = "";
                params[rprefix +":exact"]           = "";
                params[rprefix +":normal"]          = "";
                params[rprefix +":range"]           = "";

                params[rprefix +":filtertype"]      = filtertype;
                params[rprefix +":"+ filtertype]    = "t";
                params[rprefix +":between"]         = between;
                params[rprefix +":and"]             = and;

            }

            Ext.getCmp("as_window").close();
            CP.export_4.LAST_PUSH = "as";
            CP.export_4.LAST_PUSH_PROTO = to_proto;
            CP.export_4.mySubmit();
        }
    }
//end of file
}

