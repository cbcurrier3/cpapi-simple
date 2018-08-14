CP.RR = {
// Constants                ////////////////////////////////////////////////////
    EXPORT_PROTO_TITLE      : "Route Redistributions"

    ,ALL_INTERFACES_LABEL   : "all"
    ,ALL_INET_LABEL         : "all-ipv4-routes"
    ,ALL_INET6_LABEL        : "all-ipv6-routes"
    ,BGP_DEFAULT_ORIGIN_STR : "BGP Default Origin"
    ,BGP_NO_COMM_STR        : "BGP Communities are not enabled.<br><br>Enable communities in the BGP page to configure Route Redistribution for BGP Communities."
    ,FILTERTYPE_LABEL       : "Match Type"
    ,MISC_LABEL             : "Tags"
    ,FROM_AS_LABEL          : "From BGP AS"
    ,FROM_AS_PATH_LABEL     : "From BGP AS-Path"

    ,COMMUNITIES_ENABLED    : false
    ,IPv4_MODE              : true
    ,IPv6_MODE              : false
    ,SUPPORT_OSPF3          : true
    ,SUPPORT_RIPNG          : true
    ,SUPPORT_BGP            : true
    ,BGP_AF                 : "all"

// User Control             ////////////////////////////////////////////////////
    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("RR_export_btnsbar");
        CP.ar_util.checkBtnsbar("RR_bgp_btnsbar");
        CP.ar_util.checkBtnsbar("RR_bgp_form");
        CP.ar_util.checkBtnsbar("RR_export_form");
    }

    ,checkSetDisabled       : function(cmpId, disable) {
        var cmp = Ext.getCmp(cmpId);
        if (cmp) {
            if (cmp.setDisabled) {
                cmp.setDisabled(disable);
            }
            if (disable && cmp.clearInvalid) {
                cmp.clearInvalid();
            } else if (cmp.validate) {
                cmp.validate();
            }
        }
    }

// INIT                     ////////////////////////////////////////////////////
    ,init                   : function() {
        //CP.ar_util.loadList = [];
        CP.RR.defineStores();

        var Arr = [];
        Arr.push( CP.ar_one_liners.get_one_liner("export_proto") );
        Arr.push({
                xtype : "cp4_inlinemsg"
                ,type : "warning"
                ,text : "If you have both Route Redistributions and Route Maps (via CLI) "
                      + "configured for the same protocol (e.g. OSPF), "
                      + "Route Maps will take precedence."
        });
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : CP.RR.EXPORT_PROTO_TITLE
        });

        Arr.push( CP.RR.get_export_set() );
        Arr.push( CP.RR.get_bgp_set() );

        var obj = {
            title           : CP.RR.EXPORT_PROTO_TITLE
            ,panel          : Ext.create("CP.WebUI4.DataFormPanel", {
                id          : "RR_configPanel"
                ,margin     : "0 24 0 24"
                ,items      : Arr
                ,listeners  : {
                    afterrender : function() {
                        CP.RR.doLoad();
                    }
                }
            })
            ,submitURL      : "/cgi-bin/export_proto_v6.tcl"
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("RR_bgp_window");
                CP.ar_util.checkWindowClose("RR_export_window");
                CP.RR.doLoad();
                CP.ar_util.loadListPop("mySubmit");
            }
            ,submitFailure  : function() {
                CP.RR.doLoad();
                CP.ar_util.loadListPop("mySubmit");
            }
            ,checkCmpState  : CP.RR.check_user_action
	    ,cluster_feature_name: 'redistribution'
        };
        CP.UI.updateDataPanel(obj);
    }

// AJAX                     ////////////////////////////////////////////////////
    ,getPrefix              : function() {
        return String( "routed:instance:"+ CP.ar_util.INSTANCE() );
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        CP.ar_util.loadListPush("doLoad");

        var instance_string = CP.ar_util.INSTANCE();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }

        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            intf_st.load({params: {"instance": instance_string}});
        }

        function testLoadStore(storeId, d, dStr) {
            var st = Ext.getStore(storeId);
            if (st && d && d[dStr]) {
                st.loadData( d[dStr] );
            }
        }
        Ext.Ajax.request({
            url     : String("/cgi-bin/export_proto_v6.tcl?instance="+ instance_string)
            ,method : "GET"
            ,failure: function() {
                CP.ar_util.loadListPop("doLoad");
            }
            ,success: function(response, eOpts) {
                if (response) {
                    var json = Ext.decode( response.responseText );
                    var d = json.data;

                    CP.RR.COMMUNITIES_ENABLED   = (d.communities_enabled) ? true : false;
                    CP.RR.IPv4_MODE             = (d.ipv4_mode) ? true : false;
                    CP.RR.IPv6_MODE             = (d.ipv6_mode) ? true : false;
                    CP.RR.SUPPORT_OSPF3         = (d.support_ospf3) ? CP.RR.IPv6_MODE : false;
                    CP.RR.SUPPORT_RIPNG         = (d.support_ripng) ? CP.RR.IPv6_MODE : false;
                    CP.RR.SUPPORT_BGP           = (d.support_bgp) ? true : false;
                    CP.RR.BGP_AF                = (d.bgpAF) ? String(d.bgpAF) : "all";

                    var add_btn = Ext.getCmp("RR_export_btn_add");
                    if (add_btn && add_btn.handleMenuVis) {
                        add_btn.handleMenuVis(CP.RR.IPv4_MODE,
                            CP.RR.IPv6_MODE,
                            CP.RR.SUPPORT_BGP,
                            (CP.RR.BGP_AF != "inet"),
                            CP.RR.SUPPORT_OSPF3,
                            CP.RR.SUPPORT_RIPNG);
                    }

                    var bgp_title = Ext.getCmp("RR_bgp_title");
                    if (bgp_title && bgp_title.handleVis) {
                        bgp_title.handleVis(CP.RR.SUPPORT_BGP && CP.RR.IPv4_MODE);
                    }

                    testLoadStore("RR_st_export", d, "exportList");
                    testLoadStore("RR_st_proto", d, "protoList");
                    testLoadStore("RR_st_bgp", d, "bgpList");
                    testLoadStore("RR_st_static", d, "staticList");
                    testLoadStore("RR_st_aggregate", d, "aggregateList");
                }

                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

//  defineStores            ////////////////////////////////////////////////////
    ,defineStores           : function() {
        var instance_string = CP.ar_util.INSTANCE();
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            //define stores
            var grids_to_refresh_list = ["RR_export_grid"];
            CP.intf_state.defineStore( instance_string, grids_to_refresh_list );
        }

        var static_agg_fields = [
            "r_display"
            ,{
                name        : "af"
                ,sortType   : sortType_af
            }
            ,{
                name        : "r_addr"
                ,sortType   : sortType_r_addr
            }
            ,"r_mask"
        ];

        function filterAfFunc(AF, st) {
            if (!AF) { AF = "all"; }
            switch ( String(AF).toLowerCase() ) {
                case "4":       case "ip4":     case "ipv4":
                case "inet":    case "inet4":
                    AF = "inet";
                    break;
                case "6":       case "ip6":     case "ipv6":
                case "inet6":
                    AF = "inet6";
                    break;
                default:
                    AF = "all";
            }
            if (st) {
                st.clearFilter();
                if (AF != "all") {
                    st.filter(function(rec, id) {
                        if ("all" == rec.data.af || AF == rec.data.af) {
                            return true;
                        }
                        return false;
                    });
                }
            }
        }

        // static routes resource
        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_static"
            ,autoLoad   : false
            ,data       : []
            ,fields     : static_agg_fields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "af", direction: "ASC" }
                            ,{ property: "r_addr", direction: "ASC" }
                            ,{ property: "r_mask", direction: "ASC" }]
            ,filterAF   : function(AF) {
                var st = Ext.getStore("RR_st_static");
                filterAfFunc(AF, st);
            }
        });
        // aggregate routes resource
        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_aggregate"
            ,autoLoad   : false
            ,data       : []
            ,fields     : static_agg_fields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "af", direction: "ASC" }
                            ,{ property: "r_addr", direction: "ASC" }
                            ,{ property: "r_mask", direction: "ASC" }]
            ,filterAF   : function(AF) {
                var st = Ext.getStore("RR_st_aggregate");
                filterAfFunc(AF, st);
            }
        });

        // interfaces resource
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(value) {
                        if (value == CP.RR.ALL_INTERFACES_LABEL) {
                            return "A";
                        }
                        return value;
                    }
                }
            ]
            ,proxy      : {
                type        : "ajax"
                ,url        : "/cgi-bin/intf-list.tcl"
                ,extraParams: {
                    "instance"      : instance_string
                    ,"ipVersion"    : "both"
                    ,"excludeType"  : "6in4 6to4"
                    ,"excludeLoopbackAddr"  : "1"
                }
                ,limitParam : null
                ,pageParam  : null
                ,startParam : null
                ,reader     : {
                    type            : "json"
                    ,root           : "data.intfs"
                }
            }
            ,listeners  : {
                beforeload  : function(st, op, eOpts) {
                    CP.ar_util.loadListPush( String(st.storeId) );
                }
                ,load       : function(st, recs, success, op, eOpts) {
                    if (st.findExact("intf", CP.RR.ALL_INTERFACES_LABEL) == -1) {
                        st.insert(0, {"intf"  : CP.RR.ALL_INTERFACES_LABEL});
                    }
                    CP.ar_util.loadListPop( String(st.storeId) );
                }
            }
        });

        function sortType_sProto(value) {
            var v = String(value).toLowerCase();
            var vList;
            switch ( v ) {
                case "interface":
                case "direct":      return "100000";
                case "static":      return "110000";
                case "aggregate":   return "120000";
                case "kernel":      return "125000";
                case "rip":         return "130000";
                case "ospf2":       return "140000";
                case "ospf2ase":    return "150000";
                //aspath        "2" + first 3 char of path + first 2 char of origin
                //as            300000 + AS number
                //default bgp   400000
                case "ripng":       return "410000";
                case "ospf3":       return "420000";
                case "ospf3ase":    return "430000";
                default:
            }
            if ( v == "" ) {
                return "999999";
            }
            if ( v.indexOf("bgp:aspath:asregex") == 0 ) {
                vList = v.split(":");
                if (vList.length > 5) {
                    return ( "2"+ String(vList[3]).slice(0,3) + String(vList[5]).slice(0,2) );
                }
            }
            if ( v.indexOf("bgp:as") == 0 || v.indexOf("bgp:autonomoussystem") == 0 ) {
                vList = v.split(":");
                if (vList.length > 2) {
                    return String( 300000 + parseInt(vList[2], 10) );
                }
            }
            if ( v == "default" ) {
                return "400000";
            }
        }

        function sortType_af(value) {
            var v = String(value).toLowerCase();
            switch (v) {
                case "all":
                case "both":    return 0;
                case "4":
                case "ip4":
                case "ipv4":
                case "inet":
                case "inet4":   return 4;
                case "6":
                case "ip6":
                case "ipv6":
                case "inet6":   return 6;
                default:
            }
            return 9;
        }

        function sortType_r_addr(valueRaw) {
            var value = String(valueRaw).toLowerCase();
            var v = 0;
            if (value == CP.RR.ALL_INTERFACES_LABEL) { return 0; }
            if (value == CP.RR.ALL_INET_LABEL) {       return 1; }
            if (value == CP.RR.ALL_INET6_LABEL) {      return 2; }
            if (value == "default") {                  return 3; }
            if (value == "default6") {                 return 4; }
            if (value.indexOf(".") != -1) {
                var i;
                var vList = value.split(".");
                for(i = 0; i < 4; i++) {
                    v = (256 * v) + (vList[i] ? parseInt(vList[i],10) : 0);
                }
            } else if (value.indexOf(":") != -1) {
                v = parseInt(CP.ip6convert.ip6_2_db(value),10);
            }
            return (v + 5);
        }

        function createExportStore(id) {
            var store = Ext.create("CP.WebUI4.Store", {
                storeId     : id
                ,autoLoad   : false
                ,data       : []
                ,fields     : [
                    {
                        name        : "eProto"
                        ,sortType   : sortType_sProto
                    }
                    ,{
                        name        : "sProto"
                        ,sortType   : sortType_sProto
                    }
                    ,{
                        name        : "r_addr"
                        ,sortType   : sortType_r_addr
                    }
                    ,"r_mask"
                    ,"r_sort"
                    ,{
                        name        : "af"
                        ,sortType   : sortType_af
                    }
                    ,"filtertype"
                    ,"between"
                    ,"and"
                    ,"restrict"
                    ,"metric"
                    ,"riptag"
                    ,"ospfautomatictag"
                    ,"ospfautomatictagvalue"
                    ,"ospfmanualtag"
                    ,"eP_sP_addr"
                    ,"eP_bgp"
                    ,"eP_bgp_aspath"
                    ,"eP_bgp_aspath_regex"
                ]
                ,proxy      : {
                    type        : "memory"
                    ,reader     : {type: "array"}
                }
                ,sorters    :   [{ property: "sProto", direction: "ASC" }
                                ,{ property: "eProto", direction: "ASC" }
                                ,{ property: "af", direction: "ASC" }
                                ,{ property: "r_addr", direction: "ASC" }
                                ,{ property: "r_mask", direction: "ASC" }]
            });

            return store;
        }

        var gridStore = createExportStore("RR_st_export");

        CP.RR.tempStore = createExportStore("RR_st_export_temp");


        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_proto"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "eProto"
                    ,sortType   : sortType_sProto
                }
                ,"eProtoMask"
                ,"eProtoType"
                ,"eProtoAF"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "eProto", direction: "ASC" }]
            ,getEProtoCmp: function(LABELWIDTH, DELTAWIDTH, REC, SPROTO, AF) {
                if (!LABELWIDTH) { LABELWIDTH = 100; }
                if (!DELTAWIDTH) { DELTAWIDTH = 100; }
                var proto_st = Ext.getStore("RR_st_proto");
                if (proto_st && proto_st.filterProto) {
                    proto_st.filterProto(SPROTO, AF);
                }
                if (REC && REC.data) {
                    var VALUE = REC.data.eProto;
                    return proto_st.getConstant(LABELWIDTH, DELTAWIDTH, "", VALUE);
                }
                return proto_st.getVariable(LABELWIDTH, DELTAWIDTH, "", proto_st);
            }
            ,getConstant: function(LABELWIDTH, DELTAWIDTH, STYLE, VALUE) {
                var WIDTH = LABELWIDTH + DELTAWIDTH;
                var displayValue = CP.RR.clean_proto_string(VALUE, true);

                return {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "To Protocol"
                    ,id             : "RR_export_eProto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : WIDTH
                    ,height         : 22
                    ,value          : displayValue
                    ,eProto         : VALUE
                    ,getDBValue     : function() {
                        var c = this;
                        return c.eProto;
                    }
                };
            }
            ,getVariable: function(LABELWIDTH, DELTAWIDTH, STYLE, STORE) {
                var WIDTH = LABELWIDTH + DELTAWIDTH;
                var VALUE = (STORE && STORE.getCount() == 1) ? STORE.getAt(0).data.eProto : "";

                return {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "To Protocol"
                    ,id             : "RR_export_eProto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : WIDTH
                    ,value          : VALUE
                    ,editable       : false
                    ,forceSelection : true
                    ,queryMode      : "local"
                    ,lastQuery      : ""
                    ,mode           : "local"
                    ,triggerAction  : "all"
                    ,store          : Ext.getStore("RR_st_proto")
                    ,valueField     : "eProto"
                    ,displayField   : "eProtoMask"
                    ,allowBlank     : false
                    ,style          : STYLE
                    ,getDBValue     : function() {
                        var c = this;
                        return (c.getValue() );
                    }
                    ,selectChange   : function() {
                        var c = this;
                        var vEProto = c.getDBValue();
                        if (!vEProto) { return; }

                        var riptag = Ext.getCmp("RR_export_riptag_entry");
                        if (riptag && riptag.chgState) {
                            riptag.chgState( vEProto );
                        }

                        var ospftag = Ext.getCmp("RR_export_ospftag_entry");
                        if (ospftag && ospftag.chgState) {
                            ospftag.chgState( vEProto );
                        }

                        var all4 = Ext.getCmp("RR_export_route_all4");
                        if (all4 && all4.chgState) {
                            all4.chgState( vEProto );
                        }
                        var all6 = Ext.getCmp("RR_export_route_all6");
                        if (all6 && all6.chgState) {
                            all6.chgState( vEProto );
                        }

                        var protoSt = c.getStore();
                        var protoAF = "all";
                        if (protoSt) {
                            var protoRec = protoSt.findRecord("eProto", vEProto);
                            if (protoRec) {
                                protoAF = String(protoRec.data.eProtoAF).toLowerCase();
                                switch (protoAF) {
                                    case "4":       case "ipv4":    case "ip4":
                                    case "ip":      case "inet":    case "inet4":
                                        protoAF = "inet";
                                        break;
                                    case "all":     case "both":
                                        protoAF = "all";
                                        break;
                                    default:
                                        protoAF = "inet6";
                                }
                            }
                        }
                        var static_st = Ext.getStore("RR_st_static");
                        var aggregate_st = Ext.getStore("RR_st_aggregate");
                        if (static_st && static_st.filterAF) {
                            static_st.filterAF(protoAF);
                        }
                        if (aggregate_st && aggregate_st.filterAF) {
                            aggregate_st.filterAF(protoAF);
                        }
                        var routeCmp = Ext.getCmp("RR_export_route_entry");
                        if (routeCmp) {
                            if (routeCmp.getXType() == "cp4_combobox") {
                                var route_st = routeCmp.getStore();
                                if (route_st && route_st.filterAF) {
                                    routeCmp.setValue("");
                                }
                            } else if (routeCmp.getXType() == "cp4_fieldcontainer") {
                                var addrCmp = Ext.getCmp("RR_export_route_addr");
                                if (addrCmp) {
                                    addrCmp.ipv4 = (String(protoAF) != "inet6");
                                    addrCmp.ipv6 = (String(protoAF) != "inet");
                                    var newMaxValue = (String(protoAF) != "inet") ? 128 : 32;
                                    CP.ar_util.setMaxValueLength("RR_export_route_mask", newMaxValue);
                                }
                            }
                            if (routeCmp.validate) {
                                routeCmp.validate();
                            }
                        }

                        var metricCmp = Ext.getCmp("RR_export_metric_entry");
                        if(metricCmp && metricCmp.manageMetric) {
                            metricCmp.manageMetric(vEProto);
                        }

                        var sProtoCmp = Ext.getCmp("RR_export_sProto_entry");
                        var sProtoList = sProtoCmp ? sProtoCmp.getDBValue() : ["static"];
                        var sProto = sProtoList[sProtoList.length-1];
                        var test_str = vEProto +"_"+ sProto;

                        var st = Ext.getStore("RR_st_export");
                        var rec;
                        if (st) {
                            rec = st.findRecord("r_sort", test_str);
                            if (!rec) {
                                rec = {
                                    data    : {
                                        riptag                  : ""
                                        ,ospfautomatictag       : ""
                                        ,ospfautomatictagvalue  : ""
                                        ,ospfmanualtag          : ""
                                    }
                                };
                            }
                        }

                        var f = Ext.getCmp("RR_export_form");
                        if (f) {
                            f.loadRecord(rec);
                        }
                    }
                    ,listeners      : {
                        change          : function(c) {
                            if (c && c.selectChange) {
                                c.selectChange();
                            }
                        }
                    }
                };
            }
            ,filterProto: function(sProto, af) {
                if (!sProto) { sProto = "all"; }
                if (!af) { af = "all"; }

                function pushNotIn(l, el) {
                    if ( Ext.typeOf(l) != "array" ) {
                        l = [];
                    }
                    if ( Ext.typeOf(el) == "string" ) {
                        if ( Ext.Array.indexOf(l, el) == -1 ) {
                            l.push(el);
                        }
                    }
                    return l;
                }

                //TODO - remove ripng from list once RIPng is supported
                var excludeList = [];

                if ( !( CP.RR.SUPPORT_OSPF3 ) ) {
                    excludeList = pushNotIn(excludeList, "ospf3ase");
                }

                if ( !( CP.RR.SUPPORT_RIPNG ) ) {
                    excludeList = pushNotIn(excludeList, "ripng");
                }

                switch ( String(af).toLowerCase() ) {
                    case "4":       case "ip4":     case "ipv4":
                    case "inet":    case "inet4":
                        excludeList = pushNotIn(excludeList, "ripng");
                        excludeList = pushNotIn(excludeList, "ospf3ase");
                        if (CP.RR.BGP_AF == "inet6") {
                            excludeList = pushNotIn(excludeList, "bgp");
                        }
                        break;
                    case "6":       case "ip6":     case "ipv6":
                    case "inet6":
                        excludeList = pushNotIn(excludeList, "rip");
                        excludeList = pushNotIn(excludeList, "ospf2ase");
                        if (CP.RR.BGP_AF == "inet") {
                            excludeList = pushNotIn(excludeList, "bgp");
                        }
                        break;
                    default: //all case
                }

                switch ( String(sProto).toLowerCase() ) {
                    case "interface":   case "direct":
                    case "static":      case "aggregate":
                    case "kernel":
                        break;
                    case "rip":
                        excludeList = pushNotIn(excludeList, "rip");
                        excludeList = pushNotIn(excludeList, "ripng");
                        excludeList = pushNotIn(excludeList, "ospf3ase");
                        break;
                    case "ospf2":
                    case "ospf2ase":
                        excludeList = pushNotIn(excludeList, "ospf2ase");
                        excludeList = pushNotIn(excludeList, "ripng");
                        excludeList = pushNotIn(excludeList, "ospf3ase");
                        break;
                    case "ripng":
                        excludeList = pushNotIn(excludeList, "ripng");
                        excludeList = pushNotIn(excludeList, "rip");
                        excludeList = pushNotIn(excludeList, "ospf2ase");
                        break;
                    case "ospf3":
                    case "ospf3ase":
                        excludeList = pushNotIn(excludeList, "rip");
                        excludeList = pushNotIn(excludeList, "ospf2ase");
                        excludeList = pushNotIn(excludeList, "ospf3ase");
                        break;
                    default:
                        if ( String(sProto).toLowerCase() == "default" ) {
                            excludeList = pushNotIn(excludeList, "rip");
                            excludeList = pushNotIn(excludeList, "ospf2ase");
                            excludeList = pushNotIn(excludeList, "ripng");
                            excludeList = pushNotIn(excludeList, "ospf3ase");
                        }
                    //default
                }

                var st = Ext.getStore("RR_st_proto");
                if (st) {
                    st.clearFilter();
                    if ( excludeList.length > 0 ) {
                        st.filter(function(rec, id) {
                            if ( Ext.Array.indexOf(excludeList, rec.data.eProtoType) == -1 ) {
                                return true;
                            }
                            return false;
                        });
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_bgp"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "eProto"
                    ,sortType   : sortType_sProto
                }
                ,"eProtoMask"
                ,"eProtoType"
                ,"metric"
                ,"localpref"
                ,"aspathopt"
                ,"aspathoptList2"
                ,"modaspath"
                ,"modaspathList2"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "eProto", direction: "ASC" }]
            ,loadSubStores  : function(rec) {
                var d;
                if (rec && rec.data) {
                    d = rec.data;
                } else {
                    d = {
                        "modaspath"         : 1
                        ,"aspathoptList2"   : []
                        ,"modaspathList2"   : []
                    };
                }
                var aspathopt_st = Ext.getStore("RR_st_bgp_aspathopt");
                var modaspath_st = Ext.getStore("RR_st_bgp_modaspath");
                if (aspathopt_st) { aspathopt_st.loadData(d.aspathoptList2); }
                if (modaspath_st) { modaspath_st.loadData(d.modaspathList2); }
            }
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_bgp_aspathopt"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["com", "as", "new"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "com", direction: "ASC" }
                            ,{ property: "as", direction: "ASC" }]
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "RR_st_bgp_modaspath"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["com", "as", "new"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "com", direction: "ASC" }
                            ,{ property: "as", direction: "ASC" }]
        });
    }

// Transformative functions     ////////////////////////////////////////////////
    ,cleanup_regex                  : function(value) {
        //string consecutive whitespace
        var r = new RegExp("  ", "g");
        var i;
        value = value.replace( r, " ");

        //strip alphabet
        for(i = 0; i < CP.ar_util.REGEX_REPLACED_SET.length; i++) {
            r = new RegExp( CP.ar_util.REGEX_REPLACED_SET[i] ,"gi" );
            value = value.replace(r, "");
        }
        return value;
    }

    ,clean_proto_string         : function(valueRaw, eProto) {
        if (!eProto) { eProto = false; }
        var value = String(valueRaw).toLowerCase();
        var retValue = "";
        switch (value) {
            case "interface":
            case "direct":      return "Interface";
            case "static":      return "Static";
            case "aggregate":   return "Aggregate";
            case "kernel":      return "Kernel";
            case "rip":         return "RIP";
            case "ospf2ase":    if (!eProto) { return "OSPFv2 External"; }
                                return "OSPFv2";
            case "ospf2":       return "OSPFv2";
            case "ripng":       return "RIPng";
            case "ospf3ase":    if (!eProto) { return "OSPFv3 External"; }
                                return "OSPFv3";
            case "ospf3":       return "OSPFv3";
            default:
                //aspath        handled below
                //as            handled below
                //default bgp   handled below
        }
        if (value == "default") { return CP.RR.BGP_DEFAULT_ORIGIN_STR; }
        if (value.indexOf("bgp") == 0) {
            var vList = value.split(":");
            if (vList.length > 2) {
                if (vList[1] == "as" || vList[1] == "autonomoussystem") {
                    var AS_simple = CP.ar_util.convertToASDotSimple(vList[2]);
                    return ( "BGP AS "+ AS_simple );
                }
                if (vList.length > 5 && vList[1] == "aspath") {
                    var aspath_str = CP.ar_util.DB_to_REGEX( vList[3] );
                    var origin_str = String(vList[5]);
                    switch ( String(vList[5]).toLowerCase() ) {
                        case "any":         origin_str = "Any";         break;
                        case "igp":         origin_str = "IGP";         break;
                        case "egp":         origin_str = "EGP";         break;
                        case "incomplete":  origin_str = "Incomplete";  break;
                        default:
                    }
                    return ("BGP AS-Path "+ aspath_str +" ; Origin "+ origin_str);
                }
            }
        }

        if (retValue == "") {
            return valueRaw;
        }

        return retValue;
    }

    ,generateFormRow        : function(rowId, marginStr, Items) {
        return {
            xtype       : "cp4_formpanel"
            ,id         : rowId
            ,layout     : "column"
            ,defaults   : {
                submitValue : false
            }
            ,margin     : (marginStr || 0 )
            ,items      : Items
        };
    }

// BGP SET (for each BGP AS)            ////////////////////////////////////////
    ,get_bgp_set                : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "BGP Redistribution Settings"
            ,id         : "RR_bgp_title"
            ,hidden     : true
            ,handleVis  : function(visible) {
                var ids = ["RR_bgp_title", "RR_bgp_btnsbar", "RR_bgp_grid_form"];
                var c,i;
                for(i = 0; i < ids.length; i++) {
                    c = Ext.getCmp(ids[i]);
                    if (c && c.setVisible) {
                        c.setVisible(visible);
                    }
                }
            }
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "RR_bgp_btnsbar"
            ,hidden : true
            ,items  : [
                {
                    text                : "Edit"
                    ,id                 : "RR_bgp_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var grid = Ext.getCmp("RR_bgp_grid");
                        if (grid) {
                            var sm = grid.getSelectionModel();
                            if (sm && sm.getCount() == 1) {
                                var rec = sm.getLastSelected();
                                if (rec) {
                                    CP.RR.open_bgp_window(rec);
                                }
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("RR_bgp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                } // Edit
                ,{
                    text                : "Reset"
                    ,id                 : "RR_bgp_btn_reset"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.RR.getPrefix() +":export_proto";
                        var bgp_st = Ext.getStore("RR_st_bgp");
                        var grid = Ext.getCmp("RR_bgp_grid");
                        if (grid) {
                            var sm = grid.getSelectionModel();
                            if (sm) {
                                var recs = sm.getSelection();
                                if (recs && recs.length > 0 && b.deleteRecord) {
                                    var i;
                                    for(i = 0; i < recs.length; i++) {
                                        b.deleteRecord(params, prefix, recs[i], bgp_st);
                                    }
                                    CP.ar_util.mySubmit();
                                }
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("RR_bgp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, prefix, rec, st) {
                        var eP = rec.data.eProto;
                        var ePprefix = prefix +":"+ String(eP);
                        params[ePprefix +":metric"] = "";
                        params[ePprefix +":localpref"] = "";

                        params[ePprefix +":aspathopt"] = "";
                        var i;
                        var l = rec.data.aspathoptList2;
                        for(i = 0; i < l.length; i++) {
                            params[ePprefix +":aspathopt:community:"+ l[i].com +":as:"+ l[i].as]  = "";
                        }

                        params[ePprefix +":modaspath"] = "";
                        l = rec.data.modaspathList2;
                        for(i = 0; i < l.length; i++) {
                            params[ePprefix +":modaspath:community:"+ l[i].com +":as:"+ l[i].as]  = "";
                        }
                    }
                } // Reset
            ]
        });

        var grid_cm = [
            {
                text            : "To BGP"
                ,dataIndex      : "eProto"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = CP.RR.clean_proto_string(value, true);
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "MED"
                ,dataIndex      : "metric"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Local Preference"
                ,dataIndex      : "localpref"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Communities to Match"
                ,dataIndex      : "aspathopt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (CP.RR.COMMUNITIES_ENABLED) {
                        var l = rec.data.aspathoptList2;
                        if (l && l.length > 0) {
                            var i = 0;
                            retValue = ""+ l[i].com +":"+ l[i].as;
                            for(i = 1; i < l.length; i ++) {
                                retValue += "<br/>"+ l[i].com +":"+ l[i].as;
                            }
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Communities to Append"
                ,dataIndex      : "modaspath"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (CP.RR.COMMUNITIES_ENABLED) {
                        if (rec.data.modaspath) {
                            var l = rec.data.modaspathList2;
                            if (l && l.length > 0) {
                                var i = 0;
                                retValue = ""+ l[i].com +":"+ l[i].as;
                                for(i = 1; i < l.length; i ++) {
                                    retValue += "<br/>"+ l[i].com +":"+ l[i].as;
                                }
                            }
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("RR_bgp_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "RR_bgp_grid_form"
            ,hidden     : true
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "RR_bgp_grid"
                ,width              : 650
                ,height             : 150
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("RR_st_bgp")
                ,columns            : grid_cm
                ,columnLines        : false
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("RR_bgp_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

    ,open_bgp_window            : function(REC) {
        var Arr = [];

        Arr.push({ xtype: "tbspacer", width: 15, height: 15 });

        var bgp_st = Ext.getStore("RR_st_bgp");
        if (bgp_st) { bgp_st.loadSubStores(REC); }

        var AS_NUM = String(REC.data.eProto).replace("bgp:as:", "");
        var TITLE = ("BGP AS "+ AS_NUM +" Redistribution Settings");

        var LABELWIDTH = 100;
        var WIDTH = LABELWIDTH + 170;
        var hMargin = 15;
        var colMarginStyle = "margin-left:"+ String(hMargin) +"px;";

        Arr.push({
            xtype               : "cp4_displayfield"
            ,fieldLabel         : "BGP AS"
            ,id                 : "RR_bgp_as_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,value              : AS_NUM
            ,submitValue        : false
            ,style              : colMarginStyle
        });

        var bgp_metric_maxValue = 4294967295;
        var bgp_localPref_maxValue = 4294967295;
        Arr.push( CP.RR.generateFormRow("RR_bgp_metric_localpref", "", [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : '<div data-qtip="Multi-Exit Discriminator">MED:</div>'
            ,labelSeparator     : ""
            ,id                 : "RR_bgp_metric_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,value              : (REC.data.metric)
            ,submitValue        : false
            ,emptyText          : "No Default, 0-" + String(bgp_metric_maxValue)
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 0
            ,maxValue           : bgp_metric_maxValue
            ,maxLength          : String(bgp_metric_maxValue).length
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    } else {
                        v = String(v);
                    }
                }
                return v;
            }
        },{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Local Preference"
            ,id                 : "RR_bgp_localpref_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,value              : (REC.data.localpref)
            ,submitValue        : false
            ,emptyText          : "No Default, 0-" + String(bgp_localPref_maxValue)
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 0
            ,maxValue           : bgp_localPref_maxValue
            ,maxLength          : String(bgp_localPref_maxValue).length
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    } else {
                        v = String(v);
                    }
                }
                return v;
            }
        }]) );

        if (CP.RR.COMMUNITIES_ENABLED) {
            var aspathopt_set = {
                xtype   : "cp4_formpanel"
                ,id     : "RR_bgp_aspathopt_set"
                ,width  : WIDTH
                ,margin : "0 0 0 15"
                ,items  : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Match AS Numbers to Communities"
                        ,margin     : "19 0 10 0"
                    },{
                        xtype       : "cp4_btnsbar"
                        ,id         : "RR_bgp_aspathopt_btnsbar"
                        ,handleSave : function(params, prefix) {
                            var comOn = CP.RR.COMMUNITIES_ENABLED;
                            var del_btn = Ext.getCmp("RR_bgp_aspathopt_btn_delete");
                            var delArr = del_btn ? del_btn.deleteArr : [];
                            var st = Ext.getStore("RR_st_bgp_aspathopt");

                            var i;
                            for(i = 0; i < delArr.length; i++) {
                                params[prefix +":community:"+ delArr[i] +":as:"+ delArr[i+1]] = "";
                            }
                            params[prefix] = comOn ? "t" : "";
                            if (st && st.getCount() > 0) {
                                var recs = st.getRange();
                                var com;
                                var as;
                                for(i = 0; i < recs.length; i++) {
                                    com = recs[i].data.com;
                                    as = recs[i].data.as;
                                    as = comOn ? (recs[i].data.as) : "";
                                    params[prefix]                                 = comOn ? "t" : "";
                                    params[prefix +":community:"+ com +":as:"+ as] = comOn ? "t" : "";
                                }
                            }
                        }
                        ,items      : [
                            {
                                text                : "Add"
                                ,id                 : "RR_bgp_aspathopt_btn_add"
                                ,disabled           : true
                                ,overrideNoToken    : false
                                ,handler2           : function(b, e) {
                                    CP.RR.open_com_window("aspathopt", false);
                                }
                            },{
                                text                : "Delete"
                                ,id                 : "RR_bgp_aspathopt_btn_delete"
                                ,disabled           : true
                                ,deleteArr          : []
                                ,overrideNoToken    : false
                                ,handler2           : function(b, e) {
                                    var sm = Ext.getCmp("RR_bgp_aspathopt_grid").getSelectionModel();
                                    var st = Ext.getStore("RR_st_bgp_aspathopt");
                                    var recs = sm.getSelection();
                                    var i, d;
                                    for(i = 0; i < recs.length; i++) {
                                        d = recs[i].data;
                                        if ( !(d["new"]) ) {
                                            b.pushCom(d.com, d.as);
                                        }
                                    }
                                    if (st) { st.remove(recs); }
                                }
                                ,pushCom            : function(com, as) {
                                    var b = this;
                                    b.deleteArr.push(com);
                                    b.deleteArr.push(as);
                                }
                                ,disabledConditions : function() {
                                    var sm = Ext.getCmp("RR_bgp_aspathopt_grid").getSelectionModel();
                                    return (sm ? sm.getCount() == 0 : true);
                                }
                            }
                        ]
                    },{
                        xtype               : "cp4_grid"
                        ,id                 : "RR_bgp_aspathopt_grid"
                        ,width              : WIDTH
                        ,height             : 100
                        ,margin             : 0
                        ,forceFit           : true
                        ,autoScroll         : true
                        ,store              : Ext.getStore("RR_st_bgp_aspathopt")
                        ,columns            : [
                            {
                                text: "Community", dataIndex: "com", flex: 1, menuDisabled: true
                                ,renderer: CP.ar_util.rendererGeneric
                            },{
                                text: "AS", dataIndex: "as", flex: 1, menuDisabled: true
                                ,renderer: CP.ar_util.rendererGeneric
                            }
                        ]
                        ,selModel           : Ext.create("Ext.selection.RowModel", {
                            allowDeselect       : true
                            ,mode               : "MULTI"
                            ,listeners          : {
                                selectionchange     : function(view, selections, eOpts) {
                                     CP.ar_util.checkBtnsbar("RR_bgp_aspathopt_btnsbar");
                                }
                            }
                        })
                        ,draggable          : false
                        ,enableColumnMove   : false
                        ,enableColumnResize : true
                    }
                ]
            };
            var modaspath_set = {
                xtype   : "cp4_formpanel"
                ,id     : "RR_bgp_modaspath_set"
                ,width  : WIDTH
                ,margin : "0 0 0 15"
                ,items  : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Append AS Numbers to Communities"
                        ,margin     : "19 0 10 0"
                    },{
                        xtype       : "cp4_btnsbar"
                        ,id         : "RR_bgp_modaspath_btnsbar"
                        ,layout     : "column"
                        ,handleSave : function(params, prefix) {
                            var comOn = CP.RR.COMMUNITIES_ENABLED;
                            var del_btn = Ext.getCmp("RR_bgp_modaspath_btn_delete");
                            var delArr = del_btn ? del_btn.deleteArr : [];
                            var st = Ext.getStore("RR_st_bgp_modaspath");

                            var i;
                            for(i = 0; i < delArr.length; i++) {
                                params[prefix +":community:"+ delArr[i] +":as:"+ delArr[i+1]] = "";
                            }
                            if (st) {
                                var recs = st.getRange();
                                var com;
                                var as;

                                for(i = 0; i < recs.length; i++) {
                                    com = recs[i].data.com;
                                    as = comOn ? recs[i].data.as : "";
                                    params[prefix]                                 = comOn ? "t" : "";
                                    params[prefix +":community:"+ com +":as:"+ as] = comOn ? "t" : "";
                                }
                            }
                        }
                        ,items      : [
                            {
                                text                : "Add"
                                ,id                 : "RR_bgp_modaspath_btn_add"
                                ,disabled           : true
                                ,overrideNoToken    : false
                                ,handler2           : function(b, e) {
                                    CP.RR.open_com_window("modaspath", false);
                                }
                            },{
                                text                : "Delete"
                                ,id                 : "RR_bgp_modaspath_btn_delete"
                                ,disabled           : true
                                ,deleteArr          : []
                                ,overrideNoToken    : false
                                ,handler2           : function(b, e) {
                                    var sm = Ext.getCmp("RR_bgp_modaspath_grid").getSelectionModel();
                                    var st = Ext.getStore("RR_st_bgp_modaspath");
                                    var recs = sm.getSelection();
                                    var i, d;
                                    for(i = 0; i < recs.length; i++) {
                                        d = recs[i].data;
                                        if ( !(d["new"]) ) {
                                            b.pushCom(d.com, d.as);
                                        }
                                    }
                                    if (st) { st.remove(recs); }
                                }
                                ,pushCom            : function(com, as) {
                                    var b = this;
                                    b.deleteArr.push(com);
                                    b.deleteArr.push(as);
                                }
                                ,disabledConditions : function() {
                                    var g = Ext.getCmp("RR_bgp_modaspath_grid");
                                    return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                                }
                            }
                        ]
                    },{
                        xtype               : "cp4_grid"
                        ,id                 : "RR_bgp_modaspath_grid"
                        ,width              : WIDTH
                        ,height             : 100
                        ,margin             : 0
                        ,forceFit           : true
                        ,autoScroll         : true
                        ,store              : Ext.getStore("RR_st_bgp_modaspath")
                        ,columns            : [
                            {
                                text: "Community", dataIndex: "com", flex: 1, menuDisabled: true
                                ,renderer: CP.ar_util.rendererGeneric
                            },{
                                text: "AS", dataIndex: "as", flex: 1, menuDisabled: true
                                ,renderer: CP.ar_util.rendererGeneric
                            }
                        ]
                        ,selModel           : Ext.create("Ext.selection.RowModel", {
                            allowDeselect       : true
                            ,mode               : "MULTI"
                            ,listeners          : {
                                selectionchange     : function(view, selections, eOpts) {
                                    CP.ar_util.checkBtnsbar("RR_bgp_modaspath_btnsbar");
                                }
                            }
                        })
                        ,draggable          : false
                        ,enableColumnMove   : false
                        ,enableColumnResize : true
                    }
                ]
            };

            Arr.push( CP.RR.generateFormRow("RR_bgp_com", "", [aspathopt_set, modaspath_set]) );
        } else {
            /* Communities not enabled */
            var msg =  {
                xtype            : "cp4_displayfield"
                ,fieldLabel      : ""
                ,hideEmptyLabel  : false
                ,id              : "RR_export_community_msg"
                ,labelWidth      : LABELWIDTH
                ,width           : WIDTH * 2
                ,height          : 22
                ,style           : colMarginStyle
                ,value           : CP.RR.BGP_NO_COMM_STR
            };

            Arr.push(msg);
        }

        function RR_bgp_save_handler() {
            var params = CP.ar_util.clearParams();

            var as_num = String( Ext.getCmp("RR_bgp_as_entry").getValue() );
            var metric = Ext.getCmp("RR_bgp_metric_entry").getDBValue();
            var localpref = Ext.getCmp("RR_bgp_localpref_entry").getDBValue();

            var prefix = CP.RR.getPrefix() +":export_proto:bgp:as:"+ as_num;
            params[prefix] = "t";
            params[prefix +":metric"] = metric;
            params[prefix +":localpref"] = localpref;

            var aspathopt_btns = Ext.getCmp("RR_bgp_aspathopt_btnsbar");
            if (aspathopt_btns && aspathopt_btns.handleSave) {
                aspathopt_btns.handleSave(params, prefix +":aspathopt");
            }
            var modaspath_btns = Ext.getCmp("RR_bgp_modaspath_btnsbar");
            if (modaspath_btns && modaspath_btns.handleSave) {
                modaspath_btns.handleSave(params, prefix +":modaspath");
            }
            CP.ar_util.mySubmit();
        }

        if ( Ext.getCmp("RR_bgp_window") ) {
            Ext.getCmp("RR_bgp_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "RR_bgp_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "RR_bgp_form"
                ,width      : (2*(15 + WIDTH) + 20)
                ,height     : 300
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : false
                ,items      : Arr
                ,listeners  : {
                    afterrender     : function(p, eOpts) {
                        p.form._boundItems = null;
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        var p = Ext.getCmp("RR_bgp_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("RR_bgp_btn_save");
                    CP.ar_util.checkDisabledBtn("RR_bgp_btn_cancel");
                    CP.ar_util.checkBtnsbar("RR_bgp_aspathopt_btnsbar");
                    CP.ar_util.checkBtnsbar("RR_bgp_modaspath_btnsbar");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Save"
                        ,id                 : "RR_bgp_btn_save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            RR_bgp_save_handler();
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("RR_bgp_form");
                            return !f;
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Cancel"
                        ,id                 : "RR_bgp_btn_cancel"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ar_util.clearParams();
                            CP.ar_util.checkWindowClose("RR_bgp_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("RR_bgp_window") ) {
            Ext.getCmp("RR_bgp_window").show();
        }
    }

// open add/edit community window
    ,open_com_window            : function(TYPE, REC) {
        //TYPE := aspathopt | modaspath
        var TITLE = "AS Numbers and Communities to "+ ( (TYPE == "aspathopt") ? "Match" : "Append" );
        var comValue = "";
        var asValue = "";
        if (REC) {
            comValue = REC.data.com;
            asValue = REC.data.as;
            TITLE += ": Community "+ String(comValue);
        }

        var LABELWIDTH = 100;
        var WIDTH = LABELWIDTH + 100;
        var Arr = [];

        Arr.push({ xtype: "tbspacer", width: 15, height: 15 });
        Arr.push( CP.RR.generateFormRow("RR_com_row", "", [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Community"
            ,id                 : "RR_com_com_entry"
            ,value              : comValue
            ,originalValue      : comValue
            ,emptyText          : "1-65535"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,margin             : "0 0 0 15"
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
        },{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "AS Number"
            ,id                 : "RR_com_as_entry"
            ,value              : asValue
            ,emptyText          : "1-65535"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,margin             : "0 0 0 15"
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
        }]) );

        if ( Ext.getCmp("RR_com_window") ) {
            Ext.getCmp("RR_com_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "RR_com_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "RR_com_form"
                ,width      : (2*(15 + WIDTH) + 20)
                ,height     : 92
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : false
                ,items      : Arr
                ,listeners  : {
                    afterrender     : function(p, eOpts) {
                        p.form._boundItems = null;
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        var p = Ext.getCmp("RR_com_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("RR_com_btn_save");
                    CP.ar_util.checkDisabledBtn("RR_com_btn_cancel");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Ok"
                        ,id                 : "RR_com_btn_save"
                        ,disabled           : true
                        ,communityType      : ( (TYPE == "aspathopt") ? "aspathopt" : "modaspath" )
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            var t = b.communityType;
                            var delBtn = Ext.getCmp("RR_bgp_"+ t +"_btn_delete");
                            var st = Ext.getStore("RR_st_bgp_"+ t);
                            var c = Ext.getCmp("RR_com_com_entry").getValue();
                            var cO = Ext.getCmp("RR_com_com_entry").originalValue;
                            var a = Ext.getCmp("RR_com_as_entry").getValue();
                            var rec = false;
                            if (cO != "") {
                                rec = st.findRecord("com", cO, 0, false, true, true);
                            }
                            if (rec) {
                                if (c != cO && delBtn && delBtn.pushCom) {
                                    delBtn.pushCom(cO);
                                    rec.data.com = c;
                                }
                                rec.data.as = a;
                            } else {
                                st.add({"com": c, "as": a, "new": true});
                            }
                            var g = Ext.getCmp("RR_bgp_"+ t +"_grid");
                            if (g) {
                                g.getView().refresh();
                            }
                            CP.ar_util.checkWindowClose("RR_com_window");
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("RR_com_form");
                            return !f;
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Cancel"
                        ,id                 : "RR_com_btn_cancel"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ar_util.checkWindowClose("RR_com_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("RR_com_window") ) {
            Ext.getCmp("RR_com_window").show();
        }
    }

// EXPORT SET (main redistributions)    ////////////////////////////////////////
    ,get_export_set             : function() {
        var Arr = [];

        function addSourceProtoHandler(b, e) {
            var bigB = Ext.getCmp("RR_export_btn_add");
            if (bigB && bigB.handle_no_token() ) {
                var s = b.sType;
                var a = b.aType;
                if (a == "bgp") {
                    a = CP.RR.BGP_AF || "all";
                }
                if (!s) { return; }
                CP.RR.open_export_window(false, s, a);
            }
        }
        var menuItemListeners = {
            afterrender : function(c) {
                var qtipText = "";
                if (c.qtipText) {
                    switch ( String(c.qtipText) ) {
                        case "all":
                            qtipText = "Supports IPv4 and IPv6";
                            break;
                        case "4":
                            qtipText = "Supports IPv4";
                            break;
                        case "6":
                            qtipText = "Supports IPv6";
                            break;
                        case "bgp":
                            qtipText = "Supports IPv4";
                            break;
                        default:
                            qtipText = String(c.qtipText);
                    }
                }
                if (qtipText != "") {
                    Ext.tip.QuickTipManager.register({
                        target          : c.getId()
                        ,text           : qtipText
                        ,dismissDelay   : 0
                    });
                }
            }
        };

        var addMenuList = [];
        var GAP = "&nbsp;&nbsp;&nbsp;&nbsp;";
        var addMenuValues = [];
        //TODO - 
        var aggAType = "inet";
        var bgpAType = "bgp";

        addMenuValues.push({
            text    : "Interface"+ GAP
            ,sType  : "direct"
            ,aType  : "all"
            ,tipType: "Redistribute Interface Routes to another protocol (IPv4/IPv6)."
        });
        addMenuValues.push({
            text    : "Static"+ GAP
            ,sType  : "static"
            ,aType  : "all"
            ,tipType: "Redistribute Static Routes to another protocol (IPv4/IPv6)."
        });
        //TODO - check the aType
        addMenuValues.push({
            text    : "Aggregate"+ GAP
            ,sType  : "aggregate"
            ,aType  : aggAType
            ,tipType: "Redistribute Aggregate Routes to another protocol (IPv4)."
        });
        addMenuValues.push({
            text    : "Kernel"+ GAP
            ,sType  : "kernel"
            ,aType  : "all"
            ,tipType: "Redistribute Kernel Routes to another protocol (IPv4/IPv6)."
        });
        addMenuValues.push({
            text    : "RIP"+ GAP
            ,sType  : "rip"
            ,aType  : "inet"
            ,tipType: "Redistribute RIP Routes to another protocol (IPv4)."
        });
        addMenuValues.push({
            text    : "OSPFv2"+ GAP
            ,sType  : "ospf2"
            ,aType  : "inet"
            ,tipType: "Redistribute OSPFv2 Routes to another protocol (IPv4)."
        });
        addMenuValues.push({
            text    : "OSPFv2 External"+ GAP
            ,sType  : "ospf2ase"
            ,aType  : "inet"
            ,tipType: "Redistribute OSPFv2 External Routes to another protocol (IPv4)."
        });
        //TODO - when bgp supports ipv6 change the aType value 
        addMenuValues.push({
            text    : "BGP Based on AS-Path"+ GAP
            ,sType  : "bgp:aspath"
            ,aType  : bgpAType
            ,tipType: "Redistribute BGP Routes based on regular expression described AS-Paths (IPv4/IPv6)."
        });
        addMenuValues.push({
            text    : "BGP Based on AS"+ GAP
            ,sType  : "bgp:autonomoussystem"
            ,aType  : bgpAType
            ,tipType: "Redistribute BGP Routes from specific BGP Autonomous Systems (IPv4/IPv6)."
        });
        addMenuValues.push({
            text    : CP.RR.BGP_DEFAULT_ORIGIN_STR + GAP
            ,sType  : "default"
            ,aType  : bgpAType
            ,tipType: "Define a custom policy for which routes are redistributed to an AS, "
                    + "default is to only redistribute routes attached to an interface (BGP)."
        });
        addMenuValues.push({
            text    : "RIPng"+ GAP
            ,sType  : "ripng"
            ,aType  : "inet6"
            ,tipType: "Redistribute RIPng Routes to another protocol (IPv6)."
        });
        addMenuValues.push({
            text    : "OSPFv3"+ GAP
            ,sType  : "ospf3"
            ,aType  : "inet6"
            ,tipType: "Redistribute OSPFv3 Routes to another protocol (IPv6)."
        });
        addMenuValues.push({
            text    : "OSPFv3 External"+ GAP
            ,sType  : "ospf3ase"
            ,aType  : "inet6"
            ,tipType: "Redistribute OSPFv3 External Routes to another protocol (IPv6)."
        });

        var i;
        var add_ids = [];
        for(i = 0; i < addMenuValues.length; i++) {
            add_ids.push("RR_export_btn_add_"+ addMenuValues[i].sType);
            addMenuList.push({
                text        : String(addMenuValues[i].text)
                ,id         : String("RR_export_btn_add_"+ addMenuValues[i].sType)
                ,sType      : String(addMenuValues[i].sType)
                ,aType      : String(addMenuValues[i].aType)
                ,qtipText   : String(addMenuValues[i].tipType)
                ,iconCls    : "element"
                ,handler    : addSourceProtoHandler
                ,listeners  : menuItemListeners
            });
        }

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "RR_export_btnsbar"
            ,items  : [
                {
                    text                : "Add Redistribution From"
                    ,id                 : "RR_export_btn_add"
                    ,menu_ids           : add_ids
                    ,disabled           : true
                    ,handleMenuVis      : function(v4, v6, bgp, bgpV6, ospf3, ripng) {
                        var b = this;
                        var m, i, a, s;
                        var vis;
                        for(i = 0; i < b.menu_ids.length; i++) {
                            m = Ext.getCmp(b.menu_ids[i]);
                            if (m) {
                                a = m.aType ? String(m.aType) : "all";
                                s = m.sType;
                                if (a == "bgp") {
                                    a = CP.RR.BGP_AF;
                                }
                                switch (a) {
                                    case "inet":    a = v4;     break;
                                    case "inet6":   a = v6;     break;
                                    default:        a = true;
                                }
                                if (s.indexOf("bgp") > -1 || s == "default") {
                                    vis = bgp;
                                } else if (s == "ospf3" || s == "ospf3ase") {
                                    vis = ospf3 && (ripng || (bgp && bgpV6) );
                                } else if (s == "ripng") {
                                    vis = ripng && (ospf3 || (bgp && bgpV6) );
                                } else {
                                    vis = true;
                                }
                                m.setVisible(vis && a);
                            }
                        }
                    }
                    ,overrideNoToken    : false
                    ,menu               : {
                        style   : { overflow: "visible" }
                        ,xtype  : "menu"
                        ,plain  : true
                        ,items  : addMenuList
                    }
                } // Add
                ,{
                    text                : "Edit"
                    ,id                 : "RR_export_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var grid = Ext.getCmp("RR_export_grid");
                        if (!grid) { return; }
                        var sm = grid.getSelectionModel();
                        if (!sm) { return; }
                        if (sm.getCount() == 1) {
                            var rec = sm.getLastSelected();
                            CP.RR.open_export_window(rec, rec.data.sProto, rec.data.af);
                        }
                    }
                    ,disabledConditions : function() {
                        var sm = Ext.getCmp("RR_export_grid").getSelectionModel();
                        return (sm ? sm.getCount() != 1 : true);
                    }
                } // Edit
                ,{
                    text                : "Delete"
                    ,id                 : "RR_export_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.RR.getPrefix() +":export_proto";
                        var proto_st = Ext.getStore("RR_st_export");
                        var temp_proto_st = Ext.getStore("RR_st_export_temp");
                        var grid = Ext.getCmp("RR_export_grid");
                        if (grid) {
                            var sm = grid.getSelectionModel();
                            if (sm && temp_proto_st) {
                                /*
                                 * Removing individual records from a data
                                 * store via remove() is very slow and causes
                                 * serious performance issues when there are
                                 * more than 1000 records or so. This
                                 * temp_proto_st logic is a work-around that
                                 * avoids calling st.remove() and uses
                                 * removeAll(), add instead.
                                 */
                                temp_proto_st.removeAll();

                                /*
                                 * The list of records that will remain
                                 * after the delete is performed.
                                 */
                                var unsel_records = [];

                                /*
                                 * The list of records to be deleted
                                 */
                                var sel_records = [];

                                proto_st.each(function(r){
                                    if (sm.isSelected(r)) {
                                        sel_records.push(r.copy());
                                    } else {
                                        unsel_records.push(r.copy());
                                    }
                                });

                                temp_proto_st.add(unsel_records);

                                if (sel_records.length > 0 && b.deleteRecord) {
                                    var i;
                                    for(i = 0; i < sel_records.length; i++) {
                                        b.deleteRecord(params, prefix,
                                                sel_records[i], temp_proto_st);
                                    }

                                    proto_st.removeAll();
                                    proto_st.add(unsel_records);
                                    CP.ar_util.mySubmit();
                                }
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var sm = Ext.getCmp("RR_export_grid").getSelectionModel();
                        return (sm ? sm.getCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, prefix, rec, st) {
                        var i;
                        var eP = rec.data.eProto;
                        var eP_prefix = prefix +":"+ eP;

                        var sP;
                        var sP_long = rec.data.sProto;
                        var sP_list = [];
                        if (String(sP_long).indexOf("bgp") != -1) {
                            sP_list.push("bgp");
                            if (String(sP_long).indexOf("bgp:aspath") != -1) {
                                sP_list.push("bgp:aspath");
                                var sP_split = sP_long.split(":");
                                sP_list.push("bgp:aspath:asregex:"+ sP_split[3]);
                                sP_list.push("bgp:aspath:asregex:"+ sP_split[3]
                                    +":origin:"+ sP_split[5]);
                            }
                        }
                        sP_list.push(sP_long);
                        var sP_long_prefix = eP_prefix +":proto:"+ sP_long;

                        var r_addr = String(rec.data.r_addr);
                        var r_mask = String(rec.data.r_mask);
                        var addr_prefix = "";
                        var mask_prefix = "";
                        if (r_mask == "") {
                            if (r_addr == CP.RR.ALL_INET_LABEL
                                || r_addr == CP.RR.ALL_INET6_LABEL || r_addr == "default" || r_addr == "default6") {
                                addr_prefix = sP_long_prefix +":"+ r_addr;
                            } else if (sP_long == "direct") {
                                //direct, but a specific interface
                                addr_prefix = sP_long_prefix +":interface:"+ r_addr;
                            }
                            mask_prefix = addr_prefix;
                        } else {
                            var inet6midfix = "";
                            if (rec.data.af == "inet6") {
                                inet6midfix = "v6addr:";
                                r_addr = CP.ip6convert.ip6_2_db(r_addr);
                            }
                            addr_prefix = sP_long_prefix +":network:" + inet6midfix + r_addr;
                            mask_prefix = addr_prefix +":masklen:"+ r_mask;
                        }
                        params[addr_prefix]                 = "";
                        params[mask_prefix]                 = "";
                        params[mask_prefix +":metric"]      = "";
                        params[mask_prefix +":restrict"]    = "";
                        if (r_mask != "" || rec.data.filtertype != "") {
                            params[mask_prefix +":filtertype"]  = "delete";
                        }
                        params[mask_prefix +":between"]     = "";
                        params[mask_prefix +":and"]         = "";
                        params[mask_prefix +":exact"]       = "";
                        params[mask_prefix +":refines"]     = "";

                        if (st) {
                            var eP_sP_addr          = rec.data.eP_sP_addr;
                            var r_sort              = rec.data.r_sort;
                            var eP_bgp_aspath_regex = rec.data.eP_bgp_aspath_regex;
                            var eP_bgp_aspath       = rec.data.eP_bgp_aspath;
                            var eP_bgp              = rec.data.eP_bgp;
                            var REGEX = eP_bgp_aspath_regex.replace( (eP_bgp_aspath +"_"), "");

                            if (addr_prefix != mask_prefix) {
                                //check for same eP, sP, and addr
                                if (st.find("eP_sP_addr", eP_sP_addr, 0, true, false, false) != -1) {
                                    //found match with the same network
                                    return;
                                }
                            }

                            //check for same eP and sP
                            if (st.findExact("r_sort", r_sort, 0) != -1) {
                                return;
                            }
                            params[sP_long_prefix +":riptag"]               = "";
                            params[sP_long_prefix +":ospfautomatictag"]     = "";
                            params[sP_long_prefix +":ospfautomatictagvalue"]= "";
                            params[sP_long_prefix +":ospfmanualtag"]        = "";
                            if (eP == sP) {
                                return;
                            }
                            params[sP_long_prefix]                          = "";

                            if (st.findExact("eP_bgp_aspath_regex", eP_bgp_aspath_regex, 0) != -1) {
                                return;
                            }
                            params[eP_prefix +":proto:bgp:aspath:asregex:"+ REGEX] = "";
                            if (st.findExact("eP_bgp_aspath", eP_bgp_aspath, 0) != -1) {
                                return;
                            }
                            params[eP_prefix +":proto:bgp:aspath"] = "";
                            if (st.findExact("eP_bgp", eP_bgp, 0) != -1) {
                                return;
                            }
                            params[eP_prefix +":proto:bgp"] = "";
                            if (st.findExact("eProto", eP, 0) != -1) {
                                return;
                            }
                            switch (eP) {
                                case "rip":         case "ripng":
                                case "ospf2ase":    case "ospf3ase":
                                    return;
                                default:
                            }
                            params[eP_prefix] = "";
                        }
                    }
                } // Delete
                /*
                ,{
                    text            : "Reload"
                    ,id             : "RR_export_btn_reload"
                    ,handler        : function(b, e) { CP.RR.doLoad(); }
                } // Reload
                // */
            ]
        });

        var grid_cm = [
            {
                text            : "To Protocol"
                ,dataIndex      : "eProto"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = CP.RR.clean_proto_string(value, true);
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "From Protocol"
                ,dataIndex      : "sProto"
                ,width          : 210
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = CP.RR.clean_proto_string(value);
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Route"
                ,dataIndex      : "r_addr"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    if (retValue == CP.RR.ALL_INTERFACES_LABEL) {
                        retValue = "All Interfaces";
                    } else if (retValue == CP.RR.ALL_INET_LABEL) {
                        retValue = "All IPv4 Routes";
                    } else if (retValue == CP.RR.ALL_INET6_LABEL) {
                        retValue = "All IPv6 Routes";
                    } else if (retValue == "default") {
                        retValue = "Default";
                    } else if (retValue == "default6") {
                        retValue = "Default6";
                    } else if ( String(rec.data.r_mask) != "" ) {
                        retValue += ( "/"+ String(rec.data.r_mask) );
                        retValue = retValue.toUpperCase();
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : CP.RR.FILTERTYPE_LABEL
                ,dataIndex      : "filtertype"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.filtertype);
                    var rMask = String(rec.data.r_mask);
                    var sP = String(rec.data.sProto);
                    var color = "black";
                    if (retValue == "" || rMask == ""
                        || (sP == "direct" || sP == "static" || sP == "aggregate") ) {
                            color = "gray";
                            retValue = "n/a";
                    } else {
                        var h = retValue.charAt(0).toUpperCase();
                        var t = (retValue.length > 1) ? retValue.substr(1) : "";
                        retValue = String(h) + String(t);
                        if (String(rec.data.filtertype) == "range") {
                            var b = String(rec.data.between);
                            var a = String(rec.data.and);
                            retValue += " ("+ b +" to "+ a +")";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Action"
                ,dataIndex      : "restrict"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "Restrict" : "Accept";
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Metric"
                ,dataIndex      : "metric"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        //retValue = "Unspecified";
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : CP.RR.MISC_LABEL
                ,dataIndex      : "riptag"
                ,flex           : 1
                ,menuDisabled   : true
                ,qTipText       : "<b>Tags</b> is a feature of only certain redistributions.<br>"
                                + "&#8226; Redistributions to <i>RIP</i> from <i>OSPFv2</i>,<br>"
                                + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                                + "<i>OSPFv2 External</i>, and <i>BGP</i><br>"
                                + "&#8226; Redistributions to <i>OSPFv2</i> from <i>BGP</i>."
                ,listeners      : {
                    afterrender     : function(c, eOpts) {
                        if (c && Ext.typeOf(c.qTipText) == "string") {
                            Ext.tip.QuickTipManager.register({
                                target          : c.getId()
                                ,text           : c.qTipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (rec.data.eProto == "rip") {
                        if (rec.data.riptag != "") {
                            retValue = "RIP Tag: "+ String(rec.data.riptag);
                        }
                    } else if (rec.data.eProto == "ospf2ase") {
                        var sP = rec.data.sProto;
                        if (String(sP).indexOf("bgp:") != -1) {
                            var tag_list = [];
                            if (rec.data.ospfautomatictag) {
                                tag_list.push("Automatic Tag Enabled");
                            }
                            if (rec.data.ospfautomatictagvalue != "") {
                                if (!rec.data.ospfautomatictag) {
                                    tag_list.push("Automatic Tag Disabled");
                                }
                                tag_list.push("Arbitrary Tag: "+ rec.data.ospfautomatictagvalue);
                            }
                            if (rec.data.ospfmanualtag != "") {
                                tag_list.push("Manual Tag: "+ rec.data.ospfmanualtag);
                            }
                            if (tag_list.length > 0) {
                                retValue = tag_list.join("<br>");
                            }
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("RR_export_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "RR_export_grid"
                ,width              : 900
                ,height             : 400
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("RR_st_export")
                ,columns            : grid_cm
                ,columnLines        : true
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("RR_export_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

// redistribution config window ////////////////////////////////////////////////
    ,exportWIDTH                : 545

    ,get_sProto_cmp             : function(LABELWIDTH, DELTAWIDTH, REC, SPROTO) {
        var Arr = [];
        var WIDTH = CP.RR.exportWIDTH;
        var MARGIN = 0;

        var valueDisplay = CP.RR.clean_proto_string( (REC ? REC.data.sProto : SPROTO), false);
        if (!REC) {
            switch (SPROTO) {
                case "bgp:autonomoussystem":
                    return {
                        xtype           : "cp4_combobox"
                        ,fieldLabel     : CP.RR.FROM_AS_LABEL
                        ,id             : "RR_export_sProto_entry"
                        ,labelWidth     : LABELWIDTH
                        ,width          : (LABELWIDTH + 150)
                        ,value          : ""
                        ,sProto         : SPROTO
                        ,allowBlank     : false
                        ,editable       : false
                        ,forceSelection : true
                        ,queryMode      : "local"
                        ,triggerAction  : "all"
                        ,store          : Ext.getStore("RR_st_bgp")
                        ,valueField     : "eProto"
                        ,displayField   : "eProtoMask"
                        ,getDBValue     : function() {
                            var c = this;
                            var v = c.getValue(); //eProto field has "bgp:as:#"
                            var vList = String(v).split(":");
                            v = vList[vList.length-1];
                            var retList = [("bgp"), ("bgp:autonomoussystem:"+ v)];
                            return retList;
                        }
                        ,listeners      : {
                            change          : function() {
                                var eProtoCmp = Ext.getCmp("RR_export_eProto_entry");
                                if (eProtoCmp && eProtoCmp.selectChange) {
                                    eProtoCmp.selectChange();
                                }
                            }
                        }
                    };
                case "bgp:aspath":
                    return {
                        xtype           : "cp4_fieldcontainer"
                        ,fieldLabel     : CP.RR.FROM_AS_PATH_LABEL
                        ,id             : "RR_export_sProto_entry"
                        ,labelWidth     : LABELWIDTH
                        ,width          : (LABELWIDTH + 330)
                        ,height         : 22
                        ,value          : ""
                        ,sProto         : SPROTO
                        ,getValue       : function() {
                            var c = this;
                            return (c.value || "");
                        }
                        ,getDBValue     : function() {
                            var regex = Ext.getCmp("RR_export_sProto_regex").getDBValue();
                            var origin = Ext.getCmp("RR_export_sProto_origin").getValue();
                            var retList = [("bgp")
                                ,("bgp:aspath")
                                ,("bgp:aspath:asregex:"+ regex)
                                ,("bgp:aspath:asregex:"+ regex +":origin:"+ origin)];
                            return retList;
                        }
                        ,sharedValidator: function(regex, origin) {
                            if (regex == "" || origin == "") {
                                return true;
                            }
                            var exportProto = Ext.getCmp("RR_export_eProto_entry").getValue();
                            var recs = Ext.getStore("RR_st_export").getRange();
                            var i,j, rec, sProtoParts, recRegex, recOrigin;

                            for(i = 0; i < recs.length; i++) {
                                rec = recs[i].data;
                                if (rec.eProto != exportProto) {
                                    // Other export protocol, continue
                                    continue;
                                }

                                sProtoParts = (rec.sProto).split(':');

                                for (j = 0; j < sProtoParts.length; j++) {
                                    if (sProtoParts[j] == "asregex") {
                                        break;
                                    }
                                }
                                if (j >= sProtoParts.length - 1) {
                                    // Not an asregex policy
                                    continue;
                                }

                                recRegex = sProtoParts[j+1];

                                if (recRegex == regex) {
                                    for (j = 0; j < sProtoParts.length; j++) {
                                        if (sProtoParts[j] == "origin") {
                                            break;
                                        }
                                    }
                                    if (j < sProtoParts.length - 1) {
                                        recOrigin = sProtoParts[j+1];
                                        if (recOrigin == origin) {
                                            // Same origin, ok
                                            continue;
                                        }
                                    }

                                    return "This regular expression is already in "
                                           + "use to this protocol with a different origin.";
                                }
                            }
                            return true;
                        }
                        ,validate       : function() {
                            var regex = Ext.getCmp("RR_export_sProto_regex");
                            var origin = Ext.getCmp("RR_export_sProto_origin");
                            var regexValid = true;
                            var originValid = true;
                            if (regex) {
                                if (regex.validate) {
                                    regexValid = regex.validate();
                                }
                                if (regex.isDisabled() && regex.clearInvalid) {
                                    regex.clearInvalid();
                                    regexValid = true;
                                }
                            }
                            if (origin) {
                                if (origin.validate) {
                                    originValid = origin.validate();
                                }
                                if (origin.isDisabled() && origin.clearInvalid) {
                                    origin.clearInvalid();
                                    originValid = true;
                                }
                            }
                            return (regexValid && originValid);
                        }
                        ,items          : [{
                            xtype           : "cp4_textfield"
                            ,hideLabel      : true
                            ,fieldLabel     : "AS-Path Regular Expression"
                            ,id             : "RR_export_sProto_regex"
                            ,width          : 200
                            ,value          : ""
                            ,emptyText      : "AS-Path Regular Expression"
                            ,allowBlank     : false
                            ,maskRe         : /[0-9\(\)\[\]\{\}\*\+\?\|\,\.\_\-\^\$\\\ ]/
                            ,margin         : MARGIN
                            ,msgTarget      : "none"
                            ,getDBValue     : function() {
                                var c = this;
                                var v = c.getValue();
                                v = CP.RR.cleanup_regex(v);
                                var v_db = CP.ar_util.REGEX_to_DB(v);
                                return v_db;
                            }
                            ,validator      : function(value) {
                                for (var i = 0; i < value.length; ++i) {
                                    // maskRe isn't applied to copy-paste,
                                    // so apply it here to be sure.
                                    if (!this.maskRe.test(value.charAt(i))) {
                                        return "Invalid character(s) in "
                                            + "regular expression.";
                                    }
                                }

                                /*
                                 * Don't allow paths with just integers longer
                                 * than the max length of an AS (32 bits)
                                 */
                                if (value.length > 10 && /^[0-9]+$/.test(value)) {
                                    return "Regular expression has a max length of 10 characters when using only digits."
                                }

                                value = CP.RR.cleanup_regex(value);
                                if (value == "") {
                                    // Empty: not allowed, but a different
                                    // part of the code will present the
                                    // error message for it, not here.
                                    return true;
                                }

                                try {
                                    new RegExp(value, 'i');
                                } catch (err) {
                                    return String(err);
                                }

                                var regex = CP.ar_util.REGEX_to_DB(value);
                                var origin = Ext.getCmp("RR_export_sProto_origin").getValue();
                                var sP_cmp = Ext.getCmp("RR_export_sProto_entry");
                                if (sP_cmp && sP_cmp.sharedValidator) {
                                    return sP_cmp.sharedValidator(regex, origin);
                                }
                                return "";
                            }
                            ,listeners      : {
                                change          : function(c, newValue, oldValue, eOpts) {
                                    var p = Ext.getCmp("RR_export_sProto_entry");
                                    if (p && p.validate) {
                                        p.validate();
                                    }
                                    var eProtoCmp = Ext.getCmp("RR_export_eProto_entry");
                                    if (eProtoCmp && eProtoCmp.selectChange) {
                                        eProtoCmp.selectChange();
                                    }
                                }
                            }
                        },{
                            xtype: "tbspacer", width: 5, height: 5, margin: 0
                        },{
                            xtype           : "cp4_combobox"
                            ,hideLabel      : true
                            ,fieldLabel     : "Origin"
                            ,id             : "RR_export_sProto_origin"
                            ,width          : 100
                            ,value          : ""
                            ,allowBlank     : false
                            ,emptyText      : "Origin"
                            ,margin         : "0 0 0 0"
                            ,queryMode      : "local"
                            ,editable       : true
                            ,forceSelection : true
                            ,triggerAction  : "all"
                            ,msgTarget      : "none"
                            ,store          :   [["any"         ,"Any"]
                                                ,["IGP"         ,"IGP"]
                                                ,["EGP"         ,"EGP"]
                                                ,["incomplete"  ,"Incomplete"]]
                            ,validator      : function(value) {
                                if (value == "") { return true; }
                                var regex = Ext.getCmp("RR_export_sProto_regex").getDBValue();
                                var origin = Ext.getCmp("RR_export_sProto_origin").getValue();
                                var sP_cmp = Ext.getCmp("RR_export_sProto_entry");
                                if (sP_cmp && sP_cmp.sharedValidator) {
                                    return sP_cmp.sharedValidator(regex, origin);
                                }
                                return "";
                            }
                            ,listeners      : {
                                change          : function(c, newValue, oldValue, eOpts) {
                                    var p = Ext.getCmp("RR_export_sProto_entry");
                                    if (p && p.validate) {
                                        p.validate();
                                    }
                                    var eProtoCmp = Ext.getCmp("RR_export_eProto_entry");
                                    if (eProtoCmp && eProtoCmp.selectChange) {
                                        eProtoCmp.selectChange();
                                    }
                                }
                            }
                        }]
                    };
                default:
            }
        }
        return {
            xtype           : "cp4_fieldcontainer"
            ,fieldLabel     : "From Protocol"
            ,id             : "RR_export_sProto_entry"
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,height         : 22
            ,value          : ( (REC && REC.data) ? REC.data.sProto : SPROTO )
            ,sProto         : SPROTO
            ,getValue       : function() {
                var c = this;
                return ( c  && c.value ? c.value : "" );
            }
            ,getDBValue     : function() {
                var c = this;
                var retList = [""];
                if (c.value) {
                    if (c.sProto == "bgp:aspath") {
                        var vList = c.value.split(":");
                        //bgp:aspath:asregex:lq45ql:origin:any
                        var r = String( CP.ar_util.REGEX_to_DB( vList[3] ) );
                        var o = String( vList[5] );
                        retList = [("bgp")
                            ,("bgp:aspath")
                            ,("bgp:aspath:asregex:"+ r)
                            ,("bgp:aspath:asregex:"+ r +":origin:"+ o)];
                    } else if (c.sProto == "bgp:autonomoussystem") {
                        retList = [("bgp"), (c.value)];
                    } else {
                        retList = [(c.value)];
                    }
                }
                return retList;
            }
            ,items          : [{
                xtype           : "cp4_displayfield"
                ,hideLabel      : true
                ,fieldLabel     : ""
                ,id             : "RR_export_sProto_display"
                ,width          : 200
                ,value          : valueDisplay
                ,margin         : MARGIN
            }]
        };
    }
    ,get_filter_cmp             : function(LABELWIDTH, REC, SPROTO, AF, MSGTARGET) {
        var filterStore;
        if (!MSGTARGET) { MSGTARGET = "side"; }
        var range_cmp = false;
        var display = "";
        if (REC) {
            display = "" + REC.data.r_addr + "/" + REC.data.r_mask;
        }
        if (SPROTO == "ripng" || SPROTO == "ospf3" || SPROTO == "ospf3ase") {
            if (REC && display == "::/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]];
            } else {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]];
            }
        } else {
            if (REC && display == "0.0.0.0/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]
                                ,["range"   ,"Range"]];
            } else if (REC && display == "::/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]];
            } else if (REC && display.indexOf(':') === -1) {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]
                                ,["range"   ,"Range"]];
            } else {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]];
            }
            range_cmp = {
                xtype               : "cp4_fieldcontainer"
                ,hideLabel          : true
                ,fieldLabel         : ""
                ,id                 : "RR_export_filtertype_range"
                //,labelWidth         : LABELWIDTH
                ,width              : (50 + 30 + 50)
                ,margin             : "0 0 0 5"
                ,msgTarget          : "none"
                ,hidden             : (REC ? REC.data.filtertype != "range" : true)
                ,setChildDisabled   : function(disable) {
                    var cb = Ext.getCmp("RR_export_filtertype_combo");
                    var v = cb ? cb.getValue() : "";
                    var d = cb ? cb.isDisabled() : false;
                    disable = (v != "range") || d;
                    CP.RR.checkSetDisabled("RR_export_filtertype_between", disable);
                    CP.RR.checkSetDisabled("RR_export_filtertype_and", disable);
                }
                ,validate           : function() {
                    var valid = Ext.getCmp("RR_export_filtertype_between").validate();
                    valid = Ext.getCmp("RR_export_filtertype_and").validate() && valid;
                    return valid;
                }
                ,getDBValue         : function() {
                    if ( Ext.getCmp("RR_export_filtertype_combo").getValue() != "range" ) {
                        return ["",""];
                    }
                    var b = Ext.getCmp("RR_export_filtertype_between").getValue();
                    var a = Ext.getCmp("RR_export_filtertype_and").getValue();
                    if (b < a) {
                        return [b,a];
                    }
                    return [a,b];
                }
                ,sharedValidator    : function(v) {
                    var mCmp = Ext.getCmp("RR_export_route_entry");
                    var m = 32;
                    if (mCmp && mCmp.getMask) { m = mCmp.getMask(); }
                    if (m == "") {
                        m = 32;
                    } else {
                        m = parseInt(m, 10);
                    }

                    if (v > 32) {
                        return true;
                    }
                    if (v < m) {
                        return "Range cannot be less than the Masklength";
                    }
                    if (v < 1) {
                        return true;
                    }
                    return true;
                }
                ,items              : [
                    {
                        xtype               : "cp4_numberfield"
                        ,hideLabel          : true
                        ,fieldLabel         : "Between Masklength"
                        ,id                 : "RR_export_filtertype_between"
                        ,value              : (REC ? REC.data.between : "")
                        ,width              : 50
                        ,disabled           : (REC ? REC.data.filtertype != "range" : true)
                        ,margin             : 0
                        ,allowBlank         : false
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 32
                        ,maxLength          : 2
                        ,enforceMaxLength   : true
                        ,msgTarget          : "none"
                        ,validator          : function(v) {
                            return Ext.getCmp("RR_export_filtertype_range").sharedValidator(v);
                        }
                    },{
                        xtype               : "cp4_label"
                        ,text               : "to"
                        ,style              : "text-align:center;"
                        ,margin             : "2 0 0 0"
                        ,width              : 25
                    },{
                        xtype               : "cp4_numberfield"
                        ,hideLabel          : true
                        ,fieldLabel         : "And Masklength"
                        ,id                 : "RR_export_filtertype_and"
                        ,value              : (REC ? REC.data.and : "")
                        ,width              : 50
                        ,disabled           : (REC ? REC.data.filtertype != "range" : true)
                        ,margin             : 0
                        ,allowBlank         : false
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 32
                        ,maxLength          : 2
                        ,enforceMaxLength   : true
                        ,msgTarget          : "none"
                        ,validator          : function(v) {
                            return Ext.getCmp("RR_export_filtertype_range").sharedValidator(v);
                        }
                    }
                ]
            };
        }

        var filtertype_cmp = {
            xtype           : "cp4_combobox"
            ,hideLabel      : true
            ,fieldLabel     : CP.RR.FILTERTYPE_LABEL
            ,id             : "RR_export_filtertype_combo"
            //,labelWidth     : LABELWIDTH
            ,width          : 100
            ,value          : (REC ? REC.data.filtertype : "exact")
            ,disabled       : (REC ? REC.data.r_addr == CP.RR.ALL_INET_LABEL : false)
            ,margin         : "0 0 0 0"
            ,store          : filterStore
            ,editable       : false
            ,forceSelection : true
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,msgTarget      : "none"
            ,validator      : function() {
                var c = this;
                var v = c.getValue();
                var routeCmp;
                if (REC) {
                    routeCmp = Ext.getCmp("RR_export_route_entry");
                } else {
                    routeCmp = Ext.getCmp("RR_export_route_route");
                }

                var ipMode = (routeCmp && routeCmp.getIPMode) ? routeCmp.getIPMode() : "";
                if (v == "range" && ipMode == "inet6") {
                    return (CP.RR.FILTERTYPE_LABEL +" of Range requires an IPv4 Prefix");
                }
                return true;
            }
            ,listeners      : {
                change          : function(c, newValue, oldValue, eOpts) {
                    var range = Ext.getCmp("RR_export_filtertype_range");
                    if (range) {
                        range.setVisible(newValue == "range");
                        range.setChildDisabled(newValue != "range");
                        Ext.getCmp("RR_export_btn_save").disabledConditions();
                    }
                }
            }
        };

        var filterArr = [];
        filterArr.push(filtertype_cmp);
        if (range_cmp) { filterArr.push(range_cmp); }

        var filterObj = {
            xtype               : "cp4_fieldcontainer"
            ,fieldLabel         : CP.RR.FILTERTYPE_LABEL
            ,id                 : "RR_export_filtertype_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : (LABELWIDTH + 5 + 100 + (range_cmp ? (50 + 30 + 50) : 0) + 23)
            ,margin             : "0 0 5 15"
            ,padding            : 0
            ,items              : filterArr
            ,msgTarget          : MSGTARGET
            ,setChildDisabled   : function(disable) {
                CP.RR.checkSetDisabled("RR_export_filtertype_combo", disable);
                var range = Ext.getCmp("RR_export_filtertype_range");
                if (range) { range.setChildDisabled(disable); }
            }
            ,validate           : function() {
                var ids = ["RR_export_filtertype_combo", "RR_export_filtertype_range"];
                var i, cmp;
                var valid = true;
                for(i = 0; i < ids.length; i++) {
                    cmp = Ext.getCmp( ids[i] );
                    if (cmp && cmp.validate) {
                        valid = cmp.validate() && valid;
                    } else {
                        valid = false;
                    }
                }
                return valid;
            }
            ,pushDBValue        : function(params, prefix) {
                //prefix is through route (e.g. ..:all or ..:masklen:#)
                var sProtoCmp = Ext.getCmp("RR_export_sProto_entry");
                var sProto = ["static"];
                if (sProtoCmp && sProtoCmp.getDBValue) {
                    sProto = sProtoCmp.getDBValue();
                }
                switch ( sProto[sProto.length-1] ) {
                    case "":        case "interface":   case "direct":
                    case "static":  case "aggregate":
                        return;
                    default:
                }
                var routeCmp = Ext.getCmp("RR_export_route_entry");
                var route = (routeCmp && routeCmp.getDBValue) ? routeCmp.getDBValue() : [""];
                switch ( route[route.length-1] ) {
                    case "":                case "all":                    case "default":
                    case "default6":        case CP.RR.ALL_INET_LABEL:     case CP.RR.ALL_INET6_LABEL:
                        return;
                    default:
                }

                var filtertype = Ext.getCmp("RR_export_filtertype_combo");
                var range = Ext.getCmp("RR_export_filtertype_range");

                var f = filtertype.getValue();
                var r = ["",""];
                if (f == "range" && range && range.getDBValue) {
                    r = range.getDBValue();
                }
                params[prefix +":filtertype"]   = f;
                params[prefix +":exact"]        = (f == "exact" ? "t" : "");
                params[prefix +":refines"]      = (f == "refines" ? "t" : "");
                params[prefix +":between"]      = r[0];
                params[prefix +":and"]          = r[1];
            }
        };

        return filterObj;
    }
    ,get_route_cmp              : function(LABELWIDTH, DELTAWIDTH, REC, SPROTO, AF) {
        //return a component to config or display the route (all or an indiv.)
        // !REC == new
        var WIDTH = CP.RR.exportWIDTH;
        var MARGIN = 0;
        var routeArr = [];
        var route_label = "";

        if (REC) {

            var rA = String(REC.data.r_addr);
            if (rA == CP.RR.ALL_INET_LABEL) {
                rA = "All IPv4 Routes";
            } else if (rA == CP.RR.ALL_INET6_LABEL) {
                rA = "All IPv6 Routes";
            } else if (rA == "default" || rA == "default6") {
                var h = rA.charAt(0).toUpperCase();
                var t = (rA.length > 1) ? rA.substr(1) : "";
                rA = String(h) + String(t);
            } else if (SPROTO != "direct") {
                rA = String(rA).toUpperCase();
            }
            var rM = String(REC.data.r_mask);
            var rD = rA + (rM ? ("/"+ rM) : "");
            switch (SPROTO) {
                case "interface":       case "direct":
                    route_label = "Interface";
                    break;
                case "static":
                    route_label = "Static Route";
                    break;
                case "aggregate":
                    route_label = "Aggregate Route";
                    break;
                default:
                    route_label = "Route";
            }

            routeArr = [{
                xtype           : "cp4_displayfield"
                ,fieldLabel     : route_label
                ,id             : "RR_export_route_entry"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,height         : 22
                ,margin         : "0 0 5 15"
                ,value          : rD
                ,sProto         : SPROTO
                ,af             : AF
                ,r_addr         : String(REC.data.r_addr)
                ,r_mask         : String(REC.data.r_mask)
                ,getAddr        : function() {
                    var c = this;
                    return String(c.r_addr);
                }
                ,getMask        : function() {
                    var c = this;
                    return String(c.r_mask);
                }
                ,getIPMode      : function() {
                    c = this;
                    return (c.af);
                }
                ,getDBValue     : function() {
                    var c = this;
                    var Arr = [];
                    var rA = c.getAddr();
                    var rM = c.getMask();
                    var prefix = "network:";
                    if (rA.indexOf(":") != -1) {
                        rA = CP.ip6convert.ip6_2_db(rA);
                        prefix = "network:v6addr:";
                    }
                    if (c.sProto == "direct") {
                        prefix = "interface:";
                    }
                    if (rA == CP.RR.ALL_INET_LABEL
                        || rA == CP.RR.ALL_INET6_LABEL || rA == "default" || rA == "default6") {
                        return [rA];
                    }
                    Arr.push( prefix + rA );
                    if (rM && rM != "") {
                        Arr.push( prefix + rA +":masklen:"+ rM );
                    }
                    return Arr;
                }
            }];

            switch (SPROTO) {
                case "":
                case "interface":
                case "direct":
                case "static":
                case "aggregate":
                    break;
                default:
                    if (SPROTO != "default" && rM != "") {
                        routeArr.push( CP.RR.get_filter_cmp(LABELWIDTH, REC, SPROTO, AF, "side") );
                    }
            }
            return routeArr;

        }

        if (SPROTO == "interface") { SPROTO = "direct"; }
        if (SPROTO == "direct" 
            || SPROTO == "static"
            || SPROTO == "aggregate") {
            //for search usage
            //,store          : Ext.getStore("RR_st_direct")
            //,store          : Ext.getStore("RR_st_static")
            //,store          : Ext.getStore("RR_st_aggregate")

            //just a combobox
            var stId = "RR_st_" + SPROTO;
            var comboField = "r_display";
            switch (SPROTO) {
                case "direct":
                    stId = "intf_store";
                    comboField = "intf";
                    route_label = "Interface";
                    break;
                case "static":
                    route_label = "Static Route";
                    break;
                case "aggregate":
                    route_label = "Aggregate Route";
                    break;
                default:
                    route_label = "Route";
            }
            var st = Ext.getStore(stId);
            if (st && st.filterAF) {
                st.filterAF(AF);
            }
            return {
                xtype           : "cp4_combobox"
                ,fieldLabel     : route_label
                ,id             : "RR_export_route_entry"
                ,labelWidth     : LABELWIDTH
                ,width          : (LABELWIDTH + 150)
                ,value          : ""
                ,store          : st
                ,emptyText      : "Select one"
                ,allowBlank     : false
                ,editable       : false
                ,forceSelection : true
                ,triggerAction  : "all"
                ,queryMode      : "local"
                ,mode           : "local"
                ,lastQuery      : ""
                ,margin         : "0 0 5 15"
                ,valueField     : comboField
                ,displayField   : comboField
                ,sProto         : SPROTO
                ,af             : AF
                ,getIPMode      : function() {
                    c = this;
                    return (c.af);
                }
                ,getAddr        : function() {
                    var c = this;
                    var v = String(c.getValue());
                    if (v == "") { return ""; }
                    if (c.sProto == "static" ||
                        c.sProto == "aggregate" ||
                        v.toLowerCase() == "all") {
                        v = v.toLowerCase();
                    }
                    var vList = v.split("/");
                    return (vList[0]);
                }
                ,getMask        : function() {
                    var c = this;
                    var v = String( c.getValue() ).toLowerCase();
                    if (v == "") { return ""; }
                    var vList = v.split("/");
                    if (vList.length > 1) {
                        return (vList[1]);
                    }
                    return "";
                }
                ,getDBValue     : function() {
                    var c = this;
                    var rA = c.getAddr();
                    var rM = c.getMask();
                    if (rA == "all ipv4 routes"
                        || rA == "all ipv6 routes"
                        || rA == "default" || rA == "default6") {
                        return [rA.replace(/ /g, '-')];
                    }
                    switch (c.sProto) {
                        case "direct":
                            return [("interface:"+ rA)];
                        default:
                    }
                    var prefix = "";
                    if (String(rA).indexOf(":") != -1) {
                        rA = String( CP.ip6convert.ip6_2_db(rA) );
                        prefix = "v6addr:";
                    }
                    return  [("network:"+ prefix + rA)
                            ,("network:"+ prefix + rA +":masklen:"+ rM)];
                }
            };
        }
        else if (SPROTO == "default") {
            //always All
            return {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Route"
                ,id             : "RR_export_route_entry"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,height         : 22
                ,margin         : MARGIN
                ,value          : "All IPv4 Routes"
                ,getAddr        : function() {
                    return CP.RR.ALL_INET_LABEL;
                }
                ,getMask        : function() {
                    return "";
                }
                ,getDBValue     : function() {
                    return [CP.RR.ALL_INET_LABEL];
                }
            };
        }
        else {
            // All checkbox and Route/filtertype
            var fc_items = [];
            var all4_checked = false;
            var all6_checked = false;
            var fc_labelwidth = 80;
            var support4 = (String(AF) != "inet6");
            var support6 = (String(AF) != "inet") && CP.RR.IPv6_MODE;

            if (support4 && (SPROTO == "rip"
                || SPROTO == "ospf2"
                || SPROTO == "ospf2ase"
                || SPROTO == "bgp:autonomoussystem"
                || SPROTO == "bgp:aspath"
                || SPROTO == "kernel")) {
                fc_items.push({
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : "All IPv4 Routes"
                    ,id         : "RR_export_route_all4"
                    ,checked    : all4_checked
                    ,value      : all4_checked
                    ,labelWidth : fc_labelwidth
                    ,width      : ( fc_labelwidth + 75 )
                    ,height     : 22
                    ,margin     : "0 0 5 0"
                    ,handler    : function(c , checked) {
                        var route = Ext.getCmp("RR_export_route_route");
                        var filter_set = Ext.getCmp("RR_export_filtertype_entry");
                        var restrict = Ext.getCmp("RR_export_restrict_entry");
                        if (route) {
                            if (route.setChildDisabled) {
                                var all6 = Ext.getCmp("RR_export_route_all6");
                                if (!(all6 && all6.getValue())) {
                                    route.setChildDisabled(checked);
                                    if (filter_set && filter_set.setChildDisabled) {
                                        filter_set.setChildDisabled(checked);
                                    }
                                    if (restrict) {
                                        restrict.setValue("");
                                        if (restrict.setDisabled) {
                                            restrict.setDisabled(checked);
                                        }
                                    }
                                } 
                            }
                            if (route && route.validate) {
                                route.validate();
                            }
                        }
                    }
                    ,chgState   : function(eProto) {
                        if (!eProto) { eProto = "no"; }
                        var c = this;
                        c.validate();

                        // Simplify bgp string
                        if (eProto.lastIndexOf("bgp:as:", 0) === 0) {
                            eProto = "bgp";
                        }
                        switch (eProto) {
                            case "rip":
                            case "ospf2":
                            case "ospf2ase":
                            case "bgp":
                            case "kernel":
                                c.setDisabled(false);
                                c.setVisible(true);
                                c.setValue("");
                                break;
                            default:
                                c.setDisabled(true);
                                c.setVisible(false);
                                c.setValue("");
                        }
                    }
                });
            }
            if (support6 && (SPROTO == "ripng"
                || SPROTO == "ospf3"
                || SPROTO == "ospf3ase"
                || SPROTO == "bgp:autonomoussystem"
                || SPROTO == "bgp:aspath"
                || SPROTO == "kernel")) {
                fc_items.push({
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : "All IPv6 Routes"
                    ,id         : "RR_export_route_all6"
                    ,checked    : all6_checked
                    ,value      : all6_checked
                    ,labelWidth : fc_labelwidth
                    ,width      : ( fc_labelwidth + 75 )
                    ,height     : 22
                    ,margin     : "0 0 5 0"
                    ,handler    : function(c , checked) {
                        var route = Ext.getCmp("RR_export_route_route");
                        var filter_set = Ext.getCmp("RR_export_filtertype_entry");
                        var restrict = Ext.getCmp("RR_export_restrict_entry");
                        if (route) {
                            if (route.setChildDisabled) {
                                var all4 = Ext.getCmp("RR_export_route_all4");
                                if (!(all4 && all4.getValue())) {
                                    route.setChildDisabled(checked);
                                    if (filter_set && filter_set.setChildDisabled) {
                                        filter_set.setChildDisabled(checked);
                                    }
                                    if (restrict) {
                                        restrict.setValue("");
                                        if (restrict.setDisabled) {
                                            restrict.setDisabled(checked);
                                        }
                                    }
                                }
                            }
                            if (route && route.validate) {
                                route.validate();
                            }
                        }
                    }
                    ,chgState   : function(eProto) {
                        if (!eProto) { eProto = "no"; }
                        var c = this;
                        c.validate();

                        // Simplify bgp string
                        if (eProto.lastIndexOf("bgp:as:", 0) === 0) {
                            eProto = "bgp";
                        }
                        switch (eProto) {
                            case "ripng":
                            case "ospf3":
                            case "ospf3ase":
                            case "bgp":
                            case "kernel":
                                c.setDisabled(false);
                                c.setVisible(true);
                                c.setValue("");
                                break;
                            default:
                                c.setDisabled(true);
                                c.setVisible(false);
                                c.setValue("");
                        }
                    }
                });
            }
            var ip_addr_cmp = false;
            var ip_addr_width = 250;
            var ip_sep_width = 10;
            var ip_mask_width = 50;
            var ip_mask_maxValue = 32;

            var support4 = (String(AF) != "inet6");
            var support6 = (String(AF) != "inet") && CP.RR.IPv6_MODE;
            var maskRegex;
            var stripRegex;
            if (support4 && support6) {
                ip_mask_maxValue = 128;
                maskRegex   = /[0-9A-Fa-f:.]/;
                stripRegex  = /[^0-9A-Fa-f:.]/;
            } else if (support4 && !support6) {
                ip_addr_width = 110;
                maskRegex   = /[0-9.]/;
                stripRegex  = /[^0-9.]/;
            } else if (!support4 && support6) {
                ip_mask_maxValue = 128;
                maskRegex   = /[0-9A-Fa-f:]/;
                stripRegex  = /[^0-9A-Fa-f:]/;
            }

            ip_addr_cmp = {
                xtype               : "cp4_textfield"
                ,hideLabel          : true
                ,fieldLabel         : "Address Prefix"
                ,id                 : "RR_export_route_addr"
                ,width              : ip_addr_width
                ,submitValue        : false
                ,allowBlank         : false
                ,maxLength          : 39
                ,enforceMaxLength   : true
                ,msgTarget          : "none"
                ,maskRe             : maskRegex
                ,stripCharsRe       : stripRegex
                ,ipv4               : support4
                ,ipv4Octets         :   [{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }]
                ,ipv6               : support6
                ,listeners          : {
                    change              : function() {
                        var m_cmp = Ext.getCmp("RR_export_route_mask");
                        if (m_cmp && m_cmp.validate) {
                            m_cmp.validate();
                        }
                        var rng_cmp = Ext.getCmp("RR_export_filtertype_combo");
                        if (rng_cmp && rng_cmp.validate) {
                            rng_cmp.validate();
                        }
                    }
                    ,blur               : function(c) {
                        c.fireEvent("change");
                    }
                }
                ,getIPMode          : function() {
                    var c = this;
                    var v = String( c.getValue() ).toLowerCase();
                    var t = (c.ipv4 ? 1 : 0) + (c.ipv6 ? 2 : 0);
                    var expectedMsg = "Field expects valid IPv4 or IPv6 Prefix";
                    switch ( String(t) ) {
                        case "0":
                            return "Field does not support IPv4 or IPv6";
                        case "1":
                            expectedMsg = "Field expects valid IPv4 Prefix";
                            break;
                        case "2":
                            expectedMsg = "Field expects valid IPv6 Prefix";
                            break;
                        default:
                            t = 3;
                    }

                    if (v == "") { return expectedMsg; }
                    var hasDot = v.indexOf(".") > -1;
                    var hasCol = v.indexOf(":") > -1;
                    var hasHex = v.indexOf("a") > -1 || v.indexOf("b") > -1
                            || v.indexOf("c") > -1 || v.indexOf("d") > -1
                            || v.indexOf("e") > -1 || v.indexOf("f") > -1;
                    var is4 = hasDot && !(hasHex || hasCol);
                    var is6 = hasCol && !hasDot;
                    if (is4 && c.ipv4) {
                        return "4";
                    }
                    if (is6 && c.ipv6) {
                        return "6";
                    }
                    return expectedMsg;
                }
                ,getAddr            : function() {
                    var c = this;
                    return ( c.getValue() );
                }
                ,getMaskLength      : function() {
                    var c = this;
                    var m = c.getIPMode();
                    if ( !( c.isValid() ) ) {
                        return -1;
                    }
                    var v = c.getValue();
                    if (m == "4") {
                        var i, j, k;
                        var vList = v.split(".");
                        var v_i;
                        for(i = 3; i >= 0; i--) {
                            k = 1;
                            for(j = 8; j > 0; j--) {
                                v_i = parseInt(vList[i], 10);
                                if (v_i & k) {
                                    return ( (8 * i) + j);
                                }
                                k = k * 2;
                            }
                        }
                        return 0;
                    }
                    if (m == "6") {
                        return CP.ip6convert.get_v6masklength(v);
                    }
                    return 0;
                }
                ,validator          : function(v) {
                    var c = this;
                    var m = c.getIPMode();
                    if (m != "4" && m != "6") {
                        return m;
                    }
                    var i;
                    var msg = "";
                    var msgs = [];
                    if (m == "4") {
                        var vList = v.split(".");
                        var v_i;
                        var o = c.ipv4Octets;
                        if (vList.length != 4) {
                            return "Invalid IPv4 prefix";
                        }
                        for(i = 0; i < vList.length; i++) {
                            v_i = parseInt(vList[i], 10);
                            if ( isNaN(v_i) ) {
                                msgs.push("Octet "+ String(i+1)
                                    +" is invalid");
                            } else if (v_i < o[i].minValue) {
                                msgs.push("Octet "+ String(i+1)
                                    +" has a minimum value of "+ String(o[i].minValue) );
                            } else if (o[i].maxValue < v_i) {
                                msgs.push("Octet "+ String(i+1)
                                    +" has a maximum value of "+ String(o[i].maxValue) );
                            }
                        }
                        if (msgs.length > 0) {
                            msg = msgs.join("<br>Address Prefix: ");
                            return msg;
                        }
                    } else if (m == "6") {
                        msg = String( CP.util.isValidIPv6(v) );
                        if (msg != "true") {
                            return msg;
                        }
                    }
                    return true;
                }
            }

            var fc_width = ip_addr_width + ip_sep_width + ip_mask_width + 23;
            fc_items.push({
                xtype       : "cp4_fieldcontainer"
                ,fieldLabel : "Address Range"
                ,id         : "RR_export_route_route"
                ,labelWidth : fc_labelwidth
                ,width      : (fc_labelwidth + fc_width)
                ,margin     : MARGIN
                ,msgTarget  : "side"
                ,setChildDisabled: function(disable) {
                    var a = Ext.getCmp("RR_export_route_addr");
                    var m = Ext.getCmp("RR_export_route_mask");
                    if (a) {
                        if (a.setDisabled) { a.setDisabled(disable); }
                        if (a.validate) { a.validate(); }
                    }
                    if (m) {
                        if (m.setDisabled) { m.setDisabled(disable); }
                        if (m.validate) { m.validate(); }
                    }
                }
                ,getIPMode  : function() {
                    var raw = Ext.getCmp("RR_export_route_addr").getIPMode();
                    switch (raw) {
                        case "4":   return "inet";
                        case "6":   return "inet6";
                        default:
                    }
                    return "";
                }
                ,getAddr    : function() {
                     return ( Ext.getCmp("RR_export_route_addr").getValue() );
                 }
                 ,getMask    : function() {
                     return ( Ext.getCmp("RR_export_route_mask").getValue() );
                 }
                 ,getDBValue : function() {
                     var a = Ext.getCmp("RR_export_route_addr").getValue();
                     var prefix = "";
                     if ( String(a).indexOf(":") != -1 ) {
                         a = CP.ip6convert.ip6_2_db(a);
                         prefix = "v6addr:";
                     }
                     var m = Ext.getCmp("RR_export_route_mask").getValue();
                     var filter = Ext.getCmp("RR_export_filtertype_combo").getValue();
                     if (filter == "normal" && m == 0) {
                         if (a == "0.0.0.0") {
                             return [CP.RR.ALL_INET_LABEL];
                         }
                         else if (a == "00000000000000000000000000000000") {
                             return [CP.RR.ALL_INET6_LABEL];
                         }
                     }

                     var aBind = "network:"+ prefix + a;
                     var mBind = aBind +":masklen:"+ m;
                     return [aBind,mBind];
                 }
                 ,clearInvalid: function() {
                     var a = Ext.getCmp("RR_export_route_addr");
                     var m = Ext.getCmp("RR_export_route_mask");
                     if (a && a.clearInvalid) {
                         a.clearInvalid();
                     }
                     if (m && m.clearInvalid) {
                         m.clearInvalid();
                     }
                 }
                 ,validate   : function() {
                     var c = this;
                     var a = Ext.getCmp("RR_export_route_addr");
                     var m = Ext.getCmp("RR_export_route_mask");
                     var aValid = true;
                     var mValid = true;
                     if (a) {
                         if (a.validate) {
                             aValid = a.validate();
                         }
                         if (a.isDisabled() && a.clearInvalid) {
                             aValid = true;
                             a.clearInvalid();
                         }
                     }
                     if (m) {
                         if (m.validate) {
                             mValid = m.validate();
                         }
                         if (m.isDisabled() && m.clearInvalid) {
                             mValid = true;
                             m.clearInvalid();
                         }
                     }
                     return ( (c.disabled) || (aValid && mValid) );
                 }
                 ,items      : [
                     ip_addr_cmp
                     ,{
                         xtype               : "cp4_label"
                         ,text               : "/"
                         ,width              : ip_sep_width
                         ,margin             : "2 0 0 0"
                         ,style              : "text-align:center;"
                     },{
                          xtype               : "cp4_v6masklength"
                         ,fieldLabel         : "Mask Length"
                         ,hideLabel          : true
                         ,id                 : "RR_export_route_mask"
                         ,width              : ip_mask_width
                         ,margin             : "0 0 5 0"
                         ,disabled           : all4_checked
                         ,allowBlank         : false
                         ,value              : ""
                         ,minValue           : 0
                         ,maxValue           : ip_mask_maxValue
                         ,maxLength          : (String(ip_mask_maxValue).length)
                         ,enforceMaxLength   : true
                         ,msgTarget          : "none"
                         ,listeners          : {
                             change              : function() {
                                 var ids = ["RR_export_route_addr", "RR_export_filtertype_entry"];
                                 var i, c;
                                 for(i = 0; i < ids.length; i++) {
                                     c = Ext.getCmp(ids[i]);
                                     if (c && c.validate) {
                                         c.validate();
                                      }
                                 }
                             }
                         }
                         ,validator          : function(v) {
                             var m = String(v);
                             if (m == "") { return true; }
                             var a = Ext.getCmp("RR_export_route_addr");
                             var a_mode = (a ? a.getIPMode() : "");
                             if (a_mode == "") {
                                 return "Invalid prefix.";
                             }
                             var maxV = (a_mode == "6") ? 128 : 32;
                             var aLen = (a ? a.getMaskLength() : "");
                             var mLen = parseInt(m, 10);
                             if (m > maxV) {
                                 return ("The maximum value for this field is "+ String(maxV) );
                             }
                             if (a == "") { return true; }
                             if (mLen < aLen) {
                                 return "Insufficient mask length.";
                             }
                             return true;
                         }
                     }
                 ]
            });

            var filterObj = CP.RR.get_filter_cmp(fc_labelwidth, REC, SPROTO, AF, "side");
            filterObj.margin = "0 0 5 0";
            fc_items.push( filterObj );

            var range_width = 0;
            if (SPROTO != "ripng" && SPROTO != "ospf3" && SPROTO != "ospf3ase") {
                range_width = (50 + 30 + 50);
            }
            var route_super_width = LABELWIDTH + 5 + Math.max(
                 (fc_labelwidth + 75),
                 (fc_labelwidth + ip_addr_width + ip_sep_width + ip_mask_width + 23 + 23),
                 (fc_labelwidth + 5 + 100 + range_width + 23 + 23)
            );
            route_super_width = Ext.Number.constrain(route_super_width, LABELWIDTH + 75, WIDTH);

            routeArr = [{
                 xtype           : "cp4_fieldcontainer"
                 ,fieldLabel     : "Route"
                 ,id             : "RR_export_route_entry"
                 ,labelWidth     : LABELWIDTH
                 ,width          : route_super_width
                 ,margin         : "0 0 0 15"
                 ,items          : [{
                     xtype           : "cp4_formpanel"
                     ,items          : fc_items
                 }]
                 ,validate       : function() {
                     var ids = ["RR_export_route_route", "RR_export_filtertype_entry"];
                     var cmp, i;
                     var valid = true;
                     for(i = 0; i < ids.length; i++) {
                         cmp = Ext.getCmp( ids[i] );
                         if (cmp && cmp.validate) {
                             valid = cmp.validate() && valid;
                         } else {
                             valid = false;
                         }
                     }
                     return valid;
                 }
                 ,getIPMode      : function() {
                     c = this;
                     var all4 = Ext.getCmp("RR_export_route_all4");
                     var all6 = Ext.getCmp("RR_export_route_all6");
                     if (all4) {
                         if (all6) {
                             return "both";
                         }
                         else {
                             return "inet";
                         }
                     } 
                     else {
                         if (all6) {
                             return "inet6";
                         }
                         else {
                             return "";
                         }
                     }
                 }
                 ,getAddr        : function() {
                     var c = this;

                     var all4 = Ext.getCmp("RR_export_route_all4");
                     var all6 = Ext.getCmp("RR_export_route_all6");
                     if (all4 && all4.getValue()) {
                         if (all6 && all6.getValue()) {
                             return "both";
                         }
                         else {
                             return  CP.RR.ALL_INET_LABEL;
                         }
                     }
                     else {
                         if (all6) {
                             return CP.RR.ALL_INET6_LABEL;
                         }
                         else {
                             return ( Ext.getCmp("RR_export_route_route").getAddr() );
                         }

                     }
                 }
                 ,getMask        : function() {
                     var c = this;
                     var all4 = Ext.getCmp("RR_export_route_all4");
                     var all6 = Ext.getCmp("RR_export_route_all6");

                     if ((all4 && all4.getValue())
                         || (all6 && all6.getValue())) {
                         return "";
                     }
                     return ( Ext.getCmp("RR_export_route_route").getMask() );
                 }
                 ,getDBValue     : function() {

                     var all4 = Ext.getCmp("RR_export_route_all4");
                     var all6 = Ext.getCmp("RR_export_route_all6");
                     if (all4 && all4.getValue()) {
                         if (all6 && all6.getValue()) {
                             return [CP.RR.ALL_INET_LABEL, CP.RR.ALL_INET6_LABEL];
                         }
                         else {
                             return [CP.RR.ALL_INET_LABEL];
                         }
                     }
                     else {
                         if (all6 && all6.getValue()) {
                             return [CP.RR.ALL_INET6_LABEL];
                         }
                         else {
                             return ( Ext.getCmp("RR_export_route_route").getDBValue() );
                         }
                     }
                 }
            }];

            return routeArr;
        }
    }
    ,get_restrict_cmp           : function(LABELWIDTH, DELTAWIDTH, REC, VISIBLE) {
        var Value = REC ? REC.data.restrict : "";
        if (!VISIBLE) {
            VISIBLE = false;
        }

        return {
            xtype           : "cp4_combobox"
            ,fieldLabel     : "Action"
            ,id             : "RR_export_restrict_entry"
            ,labelWidth     : LABELWIDTH
            ,width          : (LABELWIDTH + DELTAWIDTH)
            ,hidden         : !VISIBLE
            ,editable       : true
            ,forceSelection : true
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,qTipText       : "Selecting <i>Restrict</i> may cause this entry to be deleted on save."
            ,value          : Value
            ,store          :   [[""    ,"Accept"]
                                ,["1"   ,"Restrict"]]
            ,getDBValue     : function() {
                var c = this;
                return (c.getValue() == 1 ? true : false);
            }
            ,listeners      : {
                afterrender     : function(c) {
                    if (c && Ext.typeOf(c.qTipText) == "string") {
                        Ext.tip.QuickTipManager.register({
                            target          : c.getId()
                            ,text           : c.qTipText
                            ,dismissDelay   : 0
                        });
                    }
                }
                ,blur           : function(c) {
                    var m = Ext.getCmp("RR_export_metric_entry");
                    if (m && m.manageVisible) { m.manageVisible(); }
                }
                ,change         : function(c) {
                    if (c) {
                        c.fireEvent("blur");
                    }
                }
            }
        };
    }
    ,export_metric_cmp_MaxValue : 4294967295
    ,get_metric_cmp             : function(LABELWIDTH, DELTAWIDTH, REC, SPROTO) {
        var MinValue = 0;
        var MaxValue = CP.RR.export_metric_cmp_MaxValue;
        var AllowBlank = true;
        var Value = "";
        var ExportProto = "";
        if (REC) {
            Value = REC.data.metric;
            ExportProto = REC.data.eProto;
            switch (ExportProto) {
                case "rip":
                    switch (SPROTO) {
                        case "direct":
                        case "interface":
                        case "rip":
                            AllowBlank = true;
                            break;
                        case "static":
                        case "aggregate":
                        case "kernel":
                        case "ospf2":
                        case "ospf2ase":
                        case "bgp:aspath":
                        case "bgp:autonomoussystem":
                            AllowBlank = false;
                            break;
                        case "ospf3":
                        case "ospf3ase":
                            //AllowBlank = false;
                            break;
                        default:
                    } // switch (SPROTO)
                case "ripng":
                    MinValue = 1;
                    MaxValue = 16;
                    break;
                case "ospf2":
                case "ospf2ase":
                case "ospf3":
                case "ospf3ase":
                    MinValue = 1;
                    MaxValue = 16777215;
                    break;
                default:
            }
        }
        return {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Metric"
            ,id                 : "RR_export_metric_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : (LABELWIDTH + DELTAWIDTH)
            ,value              : Value
            ,allowBlank         : AllowBlank
            ,allowDecimals      : false
            ,minValue           : MinValue
            ,maxValue           : MaxValue
            ,maxLength          : (String(MaxValue).length)
            ,enforceMaxLength   : true
            ,sProto             : SPROTO
            ,getDBValue         : function() {
                var c = this;
                var v = c.getRawValue();
                var action_cmp = Ext.getCmp("RR_export_restrict_entry");
                var reject = (action_cmp && action_cmp.getDBValue) ? action_cmp.getDBValue() : false;
                if (reject) {
                    v = "";
                } else if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    } else {
                        v = String(v);
                    }
                }
                return v;
            }
            ,manageVisible      : function() {
                var c = this;
                var action_cmp = Ext.getCmp("RR_export_restrict_entry");
                var reject = (action_cmp && action_cmp.getDBValue) ? action_cmp.getDBValue() : false;
                if (c) {
                    if (c.setVisible)   { c.setVisible(!reject); }
                    if (c.setDisabled)  { c.setDisabled(reject); }
                    if (c.validate)     { c.validate(); }
                }
            }
            ,manageMetric       : function(eProto) {
                if (!eProto) {
                    eProto = Ext.getCmp("RR_export_eProto_entry").getValue();
                }
                var c = this;
                if (!c) { return; }
                var MinValue = 0;
                var MaxValue = CP.RR.export_metric_cmp_MaxValue;
                if (eProto == "rip" || eProto == "ripng") {
                    MinValue = 1;
                    MaxValue = 16;
                } else if (eProto.indexOf("ospf") == 0) {
                    MinValue = 1;
                    MaxValue = 16777215;
                }
                c.setMinValue(MinValue);
                c.initialConfig.minValue = MinValue;
                c.setMaxValue(MaxValue);
                c.initialConfig.maxValue = MaxValue;
                c.maxLength = String(MaxValue).length;
                if (c.inputEl && c.inputEl.dom) {
                    c.inputEl.dom.maxLength = String(MaxValue).length;
                }
                var AllowBlank = true;
                if (eProto == "rip" || eProto == "ripng") {
                    switch (c.sProto) {
                        case "direct":
                        case "interface":
                        case "rip":
                            AllowBlank = true;
                            break;
                        case "static":
                        case "aggregate":
                        case "kernel":
                        case "ospf2":
                        case "ospf2ase":
                        case "bgp:aspath":
                        case "bgp:autonomoussystem":
                            AllowBlank = false;
                            break;
                        case "ospf3":
                        case "ospf3ase":
                            //AllowBlank = false;
                            break;
                        default:
                            if ( String(c.sProto).indexOf("bgp:") != -1 ) {
                                AllowBlank = false;
                            }
                    } // switch (c.sProto)
                }
                c.allowBlank = AllowBlank;
                if (c.manageVisible) {
                    c.manageVisible();
                } else {
                    c.validate();
                }
            }
        };
    }

    ,open_export_window         : function(REC, SPROTO, AF) {
        if (!SPROTO) { return; } //can't open a window without knowing the source type
        if (SPROTO == "interface") { SPROTO = "direct"; }

        if (!AF) { AF = "inet"; }
        switch ( String(AF).toLowerCase() ) {
            case "6":   case "ip6":     case "ipv6":    case "inet6":
                AF = "inet6";
                break;
            case "all": case "both":
                AF = "all";
                break;
            default:
                AF = "inet";
        }

        var TITLE = "";
        var fixedSProto = CP.RR.clean_proto_string(SPROTO, false);
        if (REC) {
            TITLE = "Edit Redistribution from ";
            if (REC.data.r_addr == CP.RR.ALL_INET_LABEL) {
                TITLE += "All IPv4 "+ fixedSProto +" Routes";
            } else if (REC.data.r_addr == CP.RR.ALL_INET6_LABEL) {
                TITLE += "All IPv6 "+ fixedSProto +" Routes";
            } else if (REC.data.r_addr == "default") {
                TITLE += fixedSProto +"\'s Default Route";
            } else if (REC.data.r_addr == "default6") {
                TITLE += fixedSProto +"\'s Default6 Route";
            } else {
                TITLE += fixedSProto +" Route "+ String(REC.data.r_addr).toUpperCase();
                if (REC.data.r_mask != "") {
                    TITLE += "/"+ String(REC.data.r_mask);
                }
            }
        } else {
            var titleSuffix = fixedSProto;
            switch (SPROTO) {
                case "bgp:autonomoussystem":
                    titleSuffix = "BGP Based on AS";
                    break;
                case "bgp:aspath":
                    titleSuffix = "BGP Based on AS-Path";
                    break;
                default:
            }
            TITLE = "Add Redistribution from "+ titleSuffix;
        }
        var Arr = [];
        Arr.push({ xtype: "tbspacer", width: 15, height: 15 });
        //LABELWIDTH, DELTAWIDTH, REC, SPROTO, AF
        var LABELWIDTH = 100;
        var DELTAWIDTH = 150;
        var eProto_cmp = Ext.getStore("RR_st_proto").getEProtoCmp(LABELWIDTH,
            DELTAWIDTH, REC, SPROTO, AF);
        eProto_cmp.margin = "0 0 5 15";
        var sProto_cmp = CP.RR.get_sProto_cmp(LABELWIDTH, DELTAWIDTH, REC, SPROTO);
        sProto_cmp.margin = "0 0 5 15";
        var route_cmp = CP.RR.get_route_cmp(LABELWIDTH, DELTAWIDTH, REC, SPROTO, AF);
        route_cmp.margin = "0 0 5 15";

        Arr.push(eProto_cmp, sProto_cmp, route_cmp);

        var visible_restrict = true;
        switch (SPROTO) {
            case "direct":
            case "static":
            case "aggregate":
                visible_restrict = false;
                break;
            default:
                if (REC && (REC.data.r_addr == CP.RR.ALL_INET_LABEL
                    || REC.data.r_addr == CP.RR.ALL_INET6_LABEL)) {
                    visible_restrict = false;
                }
        }
        if (SPROTO != "default") {
            var restrict_cmp = CP.RR.get_restrict_cmp(LABELWIDTH, DELTAWIDTH, REC, visible_restrict);
            restrict_cmp.margin = "0 0 5 15";
            Arr.push(restrict_cmp);
        }

        var metric_cmp = CP.RR.get_metric_cmp(LABELWIDTH, DELTAWIDTH, REC, SPROTO);
        metric_cmp.margin = "0 0 5 15";
        Arr.push(metric_cmp);

        var sProtoLC = String(SPROTO).toLowerCase();
        var startsWithBGP = (sProtoLC.indexOf("bgp:") > -1);
        var EPROTO = "";
        if (REC && REC.data) {
            EPROTO = REC.data.eProto;
        }
        var ripOrNew = (EPROTO == "" || EPROTO == "rip") ? true : false;
        var ospfOrNew = (EPROTO == "" || EPROTO == "ospf2ase") ? true : false;

        if ( ripOrNew && (sProtoLC == "ospf2" || sProtoLC == "ospf2ase" || startsWithBGP) ) {
            Arr.push({
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "RIP Tag"
                ,id                 : "RR_export_riptag_entry"
                ,name               : "riptag"
                ,submitValue        : false
                ,labelWidth         : LABELWIDTH
                ,width              : (LABELWIDTH + DELTAWIDTH)
                ,value              : (REC && REC.data ? REC.data.riptag : "")
                ,emptyText          : "Optional, 1-65535"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 65535
                ,maxLength          : 5
                ,enforceMaxLength   : true
                ,disabled           : (EPROTO != "rip")
                ,hidden             : (EPROTO != "rip")
                ,chgState           : function(eProto) {
                    if (!eProto) { eProto = "no"; }
                    var c = this;
                    c.setDisabled(eProto != "rip");
                    c.validate();
                    c.setVisible(eProto == "rip");
                }
                ,margin             : "0 0 5 15"
                ,pushDBValue        : function(params, eProto, prefix) {
                    //prefix = "...:proto:sProto"
                    var c = this;
                    var v = (eProto == "rip") ? c.getRawValue() : "";
                    if (v != "") {
                        v = parseInt(v, 10);
                        if (v < c.minValue || v > c.maxValue) {
                            v = "";
                        } else {
                            v = String(v);
                        }
                    }
                    params[prefix +":riptag"] = v;
                    return v;
                }
            });
        }
        if ( ospfOrNew && startsWithBGP ) {
            var ospf_auto_tag_cb = (REC && REC.data) ? REC.data.ospfautomatictag : "";
            var ospf_auto_tag_val = (REC && REC.data) ? REC.data.ospfautomatictagvalue : "";
            var ospf_manual_tag_val = (REC && REC.data) ? REC.data.ospfmanualtag : "";

            Arr.push({
                xtype       : "cp4_formpanel"
                ,id         : "RR_export_ospftag_entry"
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : false
                ,width      : (2 * (15 + LABELWIDTH) + 80 + DELTAWIDTH + 30)
                ,disabled   : (EPROTO != "ospf2ase")
                ,hidden     : (EPROTO != "ospf2ase")
                ,chgState   : function(eProto) {
                    if (!eProto) { eProto = "no"; }
                    var c = this;
                    c.setDisabled(eProto != "ospf2ase");
                    c.validate();
                    c.setVisible(eProto == "ospf2ase");
                }
                ,validate   : function() {
                    var valid = true;
                    var arb = Ext.getCmp("RR_export_ospfautomatictagvalue");
                    var man = Ext.getCmp("RR_export_ospfmanualtag");
                    valid = arb.validate() && valid;
                    valid = man.validate() && valid;
                    return valid;
                }
                ,pushDBValue: function(params, eProto, prefix) {
                    //prefix = "...:proto:sProto"
                    var auto_cb = "";
                    var auto_val = "";
                    var man_val = "";
                    if (eProto == "ospf2ase") {
                        auto_cb = Ext.getCmp("RR_export_ospfautomatictag").getDBValue();
                        auto_val = Ext.getCmp("RR_export_ospfautomatictagvalue").getDBValue();
                        man_val = Ext.getCmp("RR_export_ospfmanualtag").getDBValue();
                    }
                    params[prefix +":ospfautomatictag"] = auto_cb;
                    params[prefix +":ospfautomatictagvalue"] = auto_val;
                    params[prefix +":ospfmanualtag"] = man_val;
                }
                ,items      : [
                    CP.RR.generateFormRow("RR_export_ospf_automatic", "", [
                        {
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Automatic Tag"
                            ,id             : "RR_export_ospfautomatictag"
                            ,name           : "ospfautomatictag"
                            ,submitValue    : false
                            ,value          : ospf_auto_tag_cb
                            ,checked        : ospf_auto_tag_cb
                            ,labelWidth     : LABELWIDTH
                            ,width          : (LABELWIDTH + DELTAWIDTH)
                            ,margin         : "0 0 5 15"
                            ,getDBValue     : function() {
                                var c = this;
                                return (c.getValue() ? "t" : "");
                            }
                            ,qtipText       : "If enabled, use arbitrary tag to help generate the automatic tag value."
                            ,listeners      : {
                                afterrender     : function(c, eOpt) {
                                    if (c.qtipText && c.qtipText.length > 0) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : c.getId()
                                            ,text           : c.qtipText
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                            }
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Arbitrary Tag"
                            ,id                 : "RR_export_ospfautomatictagvalue"
                            ,name               : "ospfautomatictagvalue"
                            ,submitValue        : false
                            ,value              : ospf_auto_tag_val
                            ,emptyText          : "Optional, 1-4095"
                            ,labelWidth         : 75
                            ,width              : 205
                            ,margin             : "0 0 5 15"
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 4095
                            ,maxLength          : 4
                            ,enforceMaxLength   : true
                            ,getDBValue         : function() {
                                var c = this;
                                var v = c.getRawValue();
                                if (v != "") {
                                    v = parseInt(v, 10);
                                    if (v < c.minValue || v > c.maxValue) {
                                        v = "";
                                    } else {
                                        v = String(v);
                                    }
                                }
                                return v;
                            }
                            ,qtipText           : "Arbitrary tag is only used if automatic tag is enabled."
                            ,listeners          : {
                                afterrender         : function(c, eOpt) {
                                    if (c.qtipText && c.qtipText.length > 0) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : c.getId()
                                            ,text           : c.qtipText
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                            }
                        }
                    ])
                    ,{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Manual Tag"
                        ,id                 : "RR_export_ospfmanualtag"
                        ,name               : "ospfmanualtag"
                        ,submitValue        : false
                        ,value              : ospf_manual_tag_val
                        ,emptyText          : "Optional, 1-2147483647"
                        ,labelWidth         : LABELWIDTH
                        ,width              : (LABELWIDTH + DELTAWIDTH)
                        ,margin             : "0 0 0 15"
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 2147483647
                        ,maxLength          : 10
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getRawValue();
                            if (v != "") {
                                v = parseInt(v, 10);
                                if (v < c.minValue || v > c.maxValue) {
                                    v = "";
                                } else {
                                    v = String(v);
                                }
                            }
                            return v;
                        }
                    }
                    ,{
                            xtype       : "cp4_inlinemsg"
                            ,text       : "The Manual Tag value will take precedence over the Automatic Tag value when both are configured."
                            ,width      : 2 * (LABELWIDTH + DELTAWIDTH)
                            ,margin     : "12 0 0 15"
                    }
                ]
            });
        }

        function RR_export_save_handler() {
            var params = CP.ar_util.clearParams();
            var prefix = CP.RR.getPrefix();
            var export_st = Ext.getStore("RR_st_export");
            var i;

            var eProto = Ext.getCmp("RR_export_eProto_entry").getDBValue();
            var eProtoPrefix = prefix +":export_proto:"+ eProto;
            params[eProtoPrefix] = "t";

            var sProtoList = Ext.getCmp("RR_export_sProto_entry").getDBValue();
            var sProto = "";
            for(i = 0; i < sProtoList.length; i++) {
                sProto = sProtoList[i];
                params[eProtoPrefix +":proto:"+ sProto] = "t";
            }
            var sProtoPrefix = eProtoPrefix +":proto:"+ sProto;

            var riptag = Ext.getCmp("RR_export_riptag_entry");
            if (riptag && riptag.pushDBValue) {
                riptag.pushDBValue(params, eProto, sProtoPrefix);
            }
            var ospftag = Ext.getCmp("RR_export_ospftag_entry");
            if (ospftag && ospftag.pushDBValue) {
                ospftag.pushDBValue(params, eProto, sProtoPrefix);
            }

            var routeList = Ext.getCmp("RR_export_route_entry").getDBValue();
            // If its a network route (rather than all4/all6), we only care about the masklength prefix
            if (routeList && routeList[0] && routeList[1] 
                && routeList[0].indexOf("network") != -1) {
                routeList = [ routeList[1] ];
            }

            var route = "";
            for(i = 0; i < routeList.length; i++) {
                route = routeList[i];
                params[sProtoPrefix +":"+ route] = "t";

                var routePrefix = sProtoPrefix +":"+ route;

                // Add filtertype
                var filtertypeCmp = Ext.getCmp("RR_export_filtertype_entry");
                if (filtertypeCmp) {
                    if (!(route == CP.RR.ALL_INET_LABEL
                        || route == CP.RR.ALL_INET6_LABEL
                        || route == "default" || route == "default6")) {
                        if (filtertypeCmp.pushDBValue) {
                            filtertypeCmp.pushDBValue(params, routePrefix);
                        }
                    }
                }

                // Add metric
                var metric = Ext.getCmp("RR_export_metric_entry").getDBValue();
                params[routePrefix +":metric"] = metric;

                // Add restrict
                var restrictCmp = Ext.getCmp("RR_export_restrict_entry");
                if (restrictCmp) {
                    var restrict = restrictCmp.getDBValue();
                    if (route == CP.RR.ALL_INET_LABEL
                        || route == CP.RR.ALL_INET6_LABEL || route == "default" || route == "default6") {
                        if (restrict) {
                            params[routePrefix] = "";
                        }
                    } else {
                        switch (sProto) {
                            case "direct":
                            case "static":
                            case "aggregate":
                                var addr = Ext.getCmp("RR_export_route_entry").getAddr();
                                var mask = Ext.getCmp("RR_export_route_entry").getMask();
                                var e_s_a = eProto +"_"+ sProtoList[sProtoList.length-1] +"_"+ addr;
                                var n = "";
                                if (restrict) {
                                    if (routeList.length > 1 && export_st) {
                                        var xr = export_st.getRange();
                                        for(i = 0; n == "" && i < xr.length; i++) {
                                            if (xr[i].data.eP_sP_addr == e_s_a
                                                && xr[i].data.r_mask != mask) {
                                                n = "t";
                                            }
                                        }
                                        if (n == "") {
                                            for(i = 0; i < routeList.length; i++) {
                                                params[sProtoPrefix +":"+ routeList[i]] = "";
                                            }
                                        }
                                    }
                                    params[routePrefix] = "";
                                }
                                params[routePrefix +":restrict"]= "";
                                break;
                            default:
                                params[routePrefix +":restrict"]= (restrict ? "t" : "");
                        }
                    }
                }
            }

            CP.ar_util.mySubmit();
        }

        if ( Ext.getCmp("RR_export_window") ) {
            Ext.getCmp("RR_export_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "RR_export_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "RR_export_form"
                ,width      : (35 + CP.RR.exportWIDTH)
                ,height     : 356
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : true
                ,items      : Arr
                ,listeners  : {
                    afterrender     : function(p, eOpts) {
                        p.form._boundItems = null;
                        var proto_st = Ext.getStore("RR_st_proto");
                        var proto_cmp = Ext.getCmp("RR_export_eProto_entry");
                        if (proto_st && proto_st.getCount() == 1) {
                            if (proto_cmp && proto_cmp.selectChange) {
                                proto_cmp.selectChange();
                            }
                        }
                        var m = Ext.getCmp("RR_export_metric_entry");
                        if (m && m.manageVisible) { m.manageVisible(); }
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        var p = Ext.getCmp("RR_export_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("RR_export_btn_save");
                    CP.ar_util.checkDisabledBtn("RR_export_btn_cancel");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Save"
                        ,id                 : "RR_export_btn_save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            RR_export_save_handler();
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("RR_export_form");
                            return !f;
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Cancel"
                        ,id                 : "RR_export_btn_cancel"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ar_util.clearParams();
                            CP.ar_util.checkWindowClose("RR_export_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("RR_export_window") ) {
            Ext.getCmp("RR_export_window").show();
        }
    }
}

