CP.IR = {
//  CONSTANTS               ////////////////////////////////////////////////////
    IMPORT_PROTO_TITLE      : "Inbound Route Filters"

    ,IPv4_MODE              : false
    ,IPv6_MODE              : false
    ,SUPPORT_RIPng          : false
    ,SUPPORT_BGP            : false
    ,COMMUNITIES_ENABLED    : false

    ,default_bgp            : 170
    ,default_rip            : 100
    ,default_ripng          : 100
    ,default_ospf2ase       : 150
    ,default_ospf3ase       : 150

    ,FILTERTYPE_LABEL       : "Match Type"
    ,RANK_QTIP              : "Rank is a feature of OSPFv2, RIP, and OSPFv3."
    ,ALL_INET_LABEL         : "all-ipv4-routes"
    ,ALL_INET6_LABEL        : "all-ipv6-routes"

//  User Control            ////////////////////////////////////////////////////
    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("IR_import_btnsbar");
        //import window
        CP.ar_util.checkBtnsbar("IR_import_form");
        CP.ar_util.checkBtnsbar("IR_import_com_form");
    }

    ,checkSetDisabled       : function(cmpId, disable) {
        var cmp = Ext.getCmp(cmpId);
        if (cmp) {
            if (cmp.setDisabled) {
                cmp.setDisabled(disable);
            }
            if (cmp.validate) {
                cmp.validate();
            }
            if (disable && cmp.clearInvalid) {
                cmp.clearInvalid();
            }
        }
    }

//  INIT                    ////////////////////////////////////////////////////
    ,init                   : function() {
        //CP.ar_util.loadList = [];
        CP.IR.defineStores();

        var Arr = [];
        Arr.push( CP.ar_one_liners.get_one_liner("import_proto") );
        Arr.push({
                xtype : "cp4_inlinemsg"
                ,type : "warning"
                ,text : "If you have both Inbound Route Filters and Route Maps (via CLI) "
                      + "configured for the same protocol (e.g. OSPF), "
                      + "Route Maps will take precedence."
        });
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : CP.IR.IMPORT_PROTO_TITLE
        });

        Arr.push( CP.IR.get_import_set() );

        var obj = {
            title           : CP.IR.IMPORT_PROTO_TITLE
            ,panel          : Ext.create("CP.WebUI4.DataFormPanel", {
                id          : "IR_configPanel"
                ,margin     : "0 24 0 24"
                ,items      : Arr
                ,listeners  : {
                    afterrender : function() {
                        CP.IR.doLoad();
                    }
                }
            })
            ,submitURL      : "/cgi-bin/import_proto_v6.tcl"
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("IR_import_window");
                CP.IR.doLoad();
                CP.ar_util.loadListPop("mySubmit");
            }
            ,submitFailure  : function() {
                CP.IR.doLoad();
                CP.ar_util.loadListPop("mySubmit");
            }
            ,checkCmpState  : CP.IR.check_user_action
            ,cluster_feature_name: "inboundfilters"
        };

        CP.UI.updateDataPanel(obj);
    }

// AJAX                     ////////////////////////////////////////////////////
    ,getPrefix              : function() {
        return String( "routed:instance:"+ CP.ar_util.INSTANCE() );
    }
    ,mySubmit               : function() {
        var no_token = CP.ar_util.checkBlockActivity(false);
        if (!no_token) {
            CP.ar_util.loadListPush("mySubmit");
            CP.UI.applyHandler( CP.UI.getMyObj() );
        }
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        CP.ar_util.loadListPush("doLoad");

        var instance_string = CP.ar_util.INSTANCE();

        function testLoadStore(storeId, d, dStr) {
            var st = Ext.getStore(storeId);
            if (st && d && d[dStr]) {
                st.loadData( d[dStr] );
            }
        }
        Ext.Ajax.request({
            url     : String("/cgi-bin/import_proto_v6.tcl?instance="+ instance_string)
            ,method : "GET"
            ,failure: function() {
                CP.ar_util.loadListPop("doLoad");
            }
            ,success: function(response, eOpts) {
                if (response) {
                    var json = Ext.decode( response.responseText );
                    var d = json.data;

                    CP.IR.IPv4_MODE             = (d.ipv4_mode) ? true : false;
                    CP.IR.IPv6_MODE             = (d.ipv6_mode) ? true : false;
                    CP.IR.SUPPORT_RIPng         = (d.support_ripng) ? true : false;
                    CP.IR.SUPPORT_BGP           = (d.support_bgp) ? true : false;
                    CP.IR.BGP_AF                = (d.bgpAF) ? String(d.bgpAF) : "";
                    CP.IR.COMMUNITIES_ENABLED   = (d.communities_enabled) ? true : false;

                    var com_col = Ext.getCmp("IR_import_aspathoptList2_col");
                    if (com_col) {
                        com_col.setVisible(CP.IR.SUPPORT_BGP && CP.IR.COMMUNITIES_ENABLED);
                    }
                    var col_ids = ["IR_import_localpref_col", "IR_import_preference_col"];
                    var col;
                    var i;
                    for(i = 0; i < col_ids.length; i++) {
                        col = Ext.getCmp(col_ids[i]);
                        if (col) {
                            col.setVisible(CP.IR.SUPPORT_BGP);
                        }
                    }

                    var grid = Ext.getCmp("IR_import_grid");
                    var grid_width = 640;
                    if (CP.IR.SUPPORT_BGP) {
                        grid_width += 200;
                        if (CP.IR.COMMUNITIES_ENABLED)  {
                            grid_width += 160;
                        }
                    }
                    if (grid) {
                        grid.setWidth( grid_width );
                    }

                    var add_bgp_btn_ids = ["IR_import_btn_add_aspath", "IR_import_btn_add_as"];
                    var btn;
                    for(i = 0; i < add_bgp_btn_ids.length; i++) {
                        btn = Ext.getCmp(add_bgp_btn_ids[i]);
                        if (btn) {
                            btn.setVisible(CP.IR.SUPPORT_BGP);
                        }
                    }
                    btn = Ext.getCmp("IR_import_btn_add_inet");
                    if (btn) { btn.setVisible(CP.IR.IPv4_MODE); }
                    btn = Ext.getCmp("IR_import_btn_add_inet6");
                    if (btn) { btn.setVisible(CP.IR.IPv6_MODE); }

                    /*
                    var add_btn = Ext.getCmp("IR_import_btn_add");
                    var menu_btn = Ext.getCmp("IR_import_btn_add_menu");
                    if (add_btn && menu_btn && menu_btn.getVisBtnCnt) {
                        var vis = menu_btn.getVisBtnCnt(); //.all, .inet, .inet6, .total

                        add_btn.setVisible( vis.total );
                        menu_btn.setVisible( showAddMenu );
                    }
                    // */

                    CP.IR.default_bgp       = (d.default_bgp) || 170;
                    CP.IR.default_rip       = (d.default_rip) || 100;
                    CP.IR.default_ripng     = (d.default_ripng) || 100;
                    CP.IR.default_ospf2ase  = (d.default_ospf2ase) || 150;
                    CP.IR.default_ospf3ase  = (d.default_ospf3ase) || 150;

                    testLoadStore("IR_st_import", d, "importList");
                    testLoadStore("IR_st_proto", d, "protoList");
                }

                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

// Transformative functions     ////////////////////////////////////////////////
    ,cleanup_regex                  : function(value) {
        //string consecutive whitespace
        var r = new RegExp("  ", "g");
        value = value.replace( r, " ");
        //strip alphabet
        var i;
        for(i = 0; i < CP.ar_util.REGEX_REPLACED_SET.length; i++) {
            r = new RegExp( CP.ar_util.REGEX_REPLACED_SET[i] ,"gi" );
            value = value.replace(r, "");
        }
        return value;
    }

//  defineStores            ////////////////////////////////////////////////////
    ,defineStores           : function() {
        function sortType_IPROTO(v) {
            if (Ext.typeOf(v) != "string") {
                return 99999;
            }
            switch (v) {
                case "ospf2ase":    return 0;
                case "rip":         return 1;
                case "ospf3ase":    return 3002;
                case "ripng":       return 3003;
                default:
                    //1-1024, so 11-1034
                    var vList = v.split(":");
                    if (vList.length > 2) {
                        return ( 1000 + parseInt(vList[2], 10) );
                    }
            }
            return 9999;
        }

        function sortType_AF(v) {
            switch ( String(v).toLowerCase() ) {
                case "4":       case "ip4":              case "ipv4":
                case "inet":    case "inet4":
                    return 4;
                case "6":       case "ip6":              case "ipv6":
                case "inet6":  
                    return 6;
                case "all":     case "both":
                    return 7;
                default:
                    return 9;
            }
        }

        var proto_fields = [
            "IPROTO_D"
            ,{ name: "IPROTO",  sortType: sortType_IPROTO }
            ,{ name: "AF",      sortType: sortType_AF }
            ,"ASNUM"
            ,"REGEX"
            ,"ORIGIN"
            ,"IP_localpref"
            ,"IP_preference"
            ,{ name: "aspathoptList2", sortType: sortType_aspathoptList2 }
            ,"R_O"
        ];

        Ext.create("CP.WebUI4.Store", {
            storeId     : "IR_st_proto"
            ,autoLoad   : false
            ,data       : []
            ,fields     : proto_fields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "AF", direction: "ASC" }
                            ,{ property: "IPROTO", direction: "ASC" }]
            ,filterProto: function(AF) {
                var af = "all";
                switch ( String( sortType_AF(AF) ) ) {
                    case "4":   af = "inet";
                        break;
                    case "6":   af = "inet6";
                        break;
                    default:
                }
                var st = Ext.getStore("IR_st_proto");
                if (st) {
                    st.clearFilter();
                    if (af != "all") {
                        st.filter(function(rec, id) {
                            if ("both" == rec.data.AF || af == rec.data.AF) {
                                return true;
                            }
                            return false;
                        });
                    }
                }
            } //filterProto
            ,getProtoCmp: function(REC, TYPE, LABELWIDTH) {
                var st = this;
                if (!st) { return false; }

                var pushDBValueFunc = function(params, prefix) {
                    var c = Ext.getCmp("IR_import_proto_entry");
                    if (!c) { return false; }
                    var IPROTO = c.getIPROTO();
                    var ASNUM = c.getASNUM();
                    var REGEX = c.getREGEX();
                    var ORIGIN = c.getORIGIN();

                    var i_prefix = prefix +":"+ IPROTO;
                    params[i_prefix] = "t";
                    if (ASNUM != "") {
                        i_prefix += ":as:" + ASNUM;
                        params[i_prefix] = "t";
                    } else if (REGEX != "" && ORIGIN != "") {
                        i_prefix += ":aspath:asregex:"+ REGEX;
                        params[i_prefix] = "t";
                        i_prefix += ":origin:"+ ORIGIN;
                        params[i_prefix] = "t";
                    }

                    return i_prefix;
                };

                if (REC) {
                    //edit
                    return st.getConstant(LABELWIDTH, REC, pushDBValueFunc);
                }
                switch ( String(TYPE).toLowerCase() ) {
                    case "aspath":  //create as AS-Path Type
                        return st.getAsPathBGP(LABELWIDTH, pushDBValueFunc);
                    case "as":      //create an AS Num Type
                        return st.getAsBGP(LABELWIDTH, pushDBValueFunc);
                    default:        //inet or inet6, combobox
                }
                if (st.filterProto) {
                    st.filterProto(TYPE);
                }
                return st.getCombo(LABELWIDTH, st, pushDBValueFunc);
            } // getProtoCmp
            ,getBgpId   : function(DELTAWIDTH, MinValue, MaxValue, changeEventFunc) {
                return {
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,fieldLabel         : "BGP Policy"
                    ,id                 : "IR_import_bgp_id"
                    ,width              : DELTAWIDTH
                    ,margin             : 0
                    ,value              : ""
                    //,emptyText          : "BGP Policy ID"
                    ,emptyText          : ( String(MinValue) +"-"+ String(MaxValue) )
                    ,allowBlank         : false
                    ,allowDecimals      : false
                    ,minValue           : MinValue
                    ,maxValue           : MaxValue
                    ,maxLength          : String(MaxValue).length
                    ,enforceMaxLength   : true
                    ,msgTarget          : "none"
                    ,validator          : function(v) {
                        var c = this;
                        if (String(v) == "") {
                            return true;
                        }
                        v = parseInt(v, 10);
                        if (v < MinValue || v > MaxValue) {
                            return true;
                        }
                        var testVal = "bgp:id:"+ String(v);
                        var st = Ext.getStore("IR_st_proto");
                        if (st.findExact("IPROTO", testVal) == -1) {
                            return true;
                        }
                        return "BGP Policy ID must be unique.";
                    }
                    ,listeners          : {
                        change              : changeEventFunc
                    }
                    ,getDBValue         : function() {
                        var c = this;
                        var v = c.getRawValue();
                        return "bgp:id:"+ v;
                    }
                };
            } // getBgpId
            ,getAsPathBGP: function(LABELWIDTH, pushDBValueFunc) {
                var st = this;
                var bgpId_width = 100;
                var spacer_width = 10;
                var regex_width = 200;
                var origin_width = 100;
                var cmpWidth = LABELWIDTH + bgpId_width + (2 * spacer_width)
                    + regex_width + origin_width + 23;

                var changeEventFunc = function() {
                    var c = Ext.getCmp("IR_import_proto_entry");
                    if (c && c.validate) { c.validate(); }
                };

                var bgpIdCmp = st.getBgpId(bgpId_width, 1, 511, changeEventFunc);

                return {
                    xtype           : "cp4_fieldcontainer"
                    ,fieldLabel     : "Add BGP Policy"
                    ,id             : "IR_import_proto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : cmpWidth
                    ,value          : ""
                    ,margin         : "0 0 5 15"
                    ,getProtoType   : function() {
                        return "bgp";
                    }
                    ,getIPROTO      : function() {
                        var c = Ext.getCmp("IR_import_bgp_id");
                        if (c && c.getDBValue) {
                            return c.getDBValue();
                        }
                        return "";
                    }
                    ,getASNUM       : function() {  return ""; }
                    ,getREGEX       : function() {
                        var c = Ext.getCmp("IR_import_regex");
                        if (c && c.getDBValue) {
                            return c.getDBValue();
                        }
                        return "";
                    }
                    ,getORIGIN      : function() {
                        var c = Ext.getCmp("IR_import_origin");
                        if (c) {
                            return c.getValue();
                        }
                        return "";
                    }
                    ,pushDBValue    : pushDBValueFunc
                    ,isValid        : function() {
                        var c = this;
                        if (c) {
                            if ( c.isDisabled() ) {
                                if (c.clearInvalid) { c.clearInvalid(); }
                                return true;
                            }
                            if (c.validate) {
                                return c.validate();
                            }
                        }
                        return false;
                    }
                    ,validate       : function() {
                        var valid = true;
                        var ids = ["IR_import_bgp_id", "IR_import_regex", "IR_import_origin"];
                        var i;
                        var c;
                        var validTemp;
                        for (i = 0; i < ids.length; i++) {
                            c = Ext.getCmp( ids[i] );
                            validTemp = false;
                            if (c) {
                                if (c.isDisabled() && c.clearInvalid) {
                                    validTemp = true;
                                    c.clearInvalid();
                                } else if (c.validate) {
                                    validTemp = c.validate();
                                }
                            }
                            valid = validTemp && valid;
                        }
                        return valid;
                    }
                    ,clearInvalid   : function() {
                        var ids = ["IR_import_bgp_id", "IR_import_regex", "IR_import_origin"];
                        var i;
                        var c;
                        for (i = 0; i < ids.length; i++) {
                            c = Ext.getCmp( ids[i] );
                            if (c && c.clearInvalid) {
                                c.clearInvalid();
                            }
                        }
                    }
                    ,sharedValidator: function() {
                        var regexCmp = Ext.getCmp("IR_import_regex");
                        var originCmp = Ext.getCmp("IR_import_origin");
                        var r = (regexCmp && regexCmp.getDBValue) ? regexCmp.getDBValue() : "";
                        var o = (originCmp) ? originCmp.getValue() : "";
                        if (o == null) {
                            return "Origin must be specified";
                        }
                        r = CP.IR.cleanup_regex(r);
                        var r_db = CP.ar_util.REGEX_to_DB(r);
                        var st = Ext.getStore("IR_st_proto");
                        if (st) {
                            if (st.findExact("R_O", r_db +"_"+ o) == -1) {
                                return true;
                            }
                            return "AS-Path already exists with this origin";
                        }
                        return "Store load error.";
                    }
                    ,items          : [
                        bgpIdCmp
                        ,{ xtype: "tbspacer", width: spacer_width, height: 10 }
                        ,{
                            xtype               : "cp4_textfield"
                            ,hideLabel          : true
                            ,fieldLabel         : "AS-Path Regular Expression"
                            ,id                 : "IR_import_regex"
                            ,width              : regex_width
                            ,margin             : 0
                            ,value              : ""
                            ,emptyText          : "\'Empty\' AS-Path Regular Expression"
                            ,allowBlank         : true
                            ,maskRe             : /[0-9\(\)\[\]\{\}\*\+\?\|\,\.\_\-\^\$\\\ ]/
                            ,maxLength          : 350
                            ,enforceMaxLength   : true
                            ,msgTarget          : "none"
                            ,getDBValue         : function() {
                                var c = this;
                                var v = c.getRawValue();
                                if (v === "") {
                                    return "null";
                                }
                                v = CP.IR.cleanup_regex(v);
                                var v_db = CP.ar_util.REGEX_to_DB(v);
                                return v_db;
                            }
                            ,validator      : function(v) {
                                v = String(v);

                                var origin = Ext.getCmp("IR_import_origin");
                                var o = origin.getValue();
                                if (o == null) {
                                    return "Origin must be specified";
                                }
                                if (v == "") {
                                    return true;
                                }
                                if (v[0] == " " || v[v.length-1] == " ") {
                                    return "Can not begin or end with whitespace.";
                                }
                                if (v.indexOf("  ") != -1) {
                                    return "Sequential whitespace is not allowed.";
                                }

                                /*
                                 * Don't allow paths with just integers longer
                                 * than the max length of an AS (32 bits)
                                 */
                                if (v.length > 10 && /^[0-9]+$/.test(v)) {
                                    return "Regular expression has a max length of 10 characters when using only digits."
                                }

                                var r = this.getDBValue();
                                r = CP.IR.cleanup_regex(r);
                                var r_db = CP.ar_util.REGEX_to_DB(r);
                                var store = Ext.getStore("IR_st_proto");
                                if (store) {
                                   if (store.findExact("R_O", r_db +"_"+ o) == -1) {
                                       return true;
                                   }
                                   return "AS-PATH already exists with this origin";
                                }
                                return "Store load error.";
                            }
                            ,listeners      : {
                                change          : changeEventFunc
                            }
                        }
                        ,{ xtype: "tbspacer", width: spacer_width, height: 10 }
                        ,{
                            xtype           : "cp4_combobox"
                            ,hideLabel      : true
                            ,fieldLabel     : "Origin"
                            ,id             : "IR_import_origin"
                            ,width          : origin_width
                            ,margin         : 0
                            ,value          : "any"
                            ,emptyText      : "Origin"
                            ,allowBlank     : false
                            ,editable       : false
                            ,forceSelection : true
                            ,msgTarget      : "none"
                            ,store          :   [["any"         ,"Any"]
                                                ,["IGP"         ,"IGP"]
                                                ,["EGP"         ,"EGP"]
                                                ,["incomplete"  ,"Incomplete"]]
                            ,validator      : function(v) {
                                var regex = Ext.getCmp("IR_import_regex");
                                var r = regex.getDBValue();
                                

                                v = String(v);
                                if (v == null) {
                                    return "Origin must be specified";
                                }

                                var r = regex.getDBValue();
                                r = CP.IR.cleanup_regex(r);
                                var r_db = CP.ar_util.REGEX_to_DB(r);
                                var store = Ext.getStore("IR_st_proto");
                                if (store) {
                                   if (store.findExact("R_O", r_db +"_"+ v) == -1) {
                                       return true;
                                   }
                                   return "AS-PATH already exists with this origin";
                                }
                                return "Store load error.";
                            }
                            ,listeners      : {
                                change          : changeEventFunc
                            }
                        }
                    ]
                };
            } // getAsPathBGP
            ,getAsBGP   : function(LABELWIDTH, pushDBValueFunc) {
                var st = this;
                var bgpId_width = 100;
                var spacer_width = 10;
                var as_width = 100;
                var cmpWidth = LABELWIDTH + bgpId_width + spacer_width + as_width + 23;

                var changeEventFunc = function() {
                    var c = Ext.getCmp("IR_import_proto_entry");
                    if (c && c.validate) { c.validate(); }
                };

                var bgpIdCmp = st.getBgpId(bgpId_width, 512, 1024, changeEventFunc);

                return {
                    xtype           : "cp4_fieldcontainer"
                    ,fieldLabel     : "Add BGP Policy"
                    ,id             : "IR_import_proto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : cmpWidth
                    ,value          : ""
                    ,margin         : "0 0 5 15"
                    ,getProtoType   : function() {
                        return "bgp";
                    }
                    ,getIPROTO      : function() {
                        var c = Ext.getCmp("IR_import_bgp_id");
                        if (c && c.getDBValue) {
                            return c.getDBValue();
                        }
                        return "";
                    }
                    ,getASNUM       : function() {
                        var c = Ext.getCmp("IR_import_asnum");
                        if (c) {
                            return c.getValue();
                        }
                        return "";
                    }
                    ,getREGEX       : function() { return ""; }
                    ,getORIGIN      : function() { return ""; }
                    ,pushDBValue    : pushDBValueFunc
                    ,isValid        : function() {
                        var c = this;
                        if (c) {
                            if ( c.isDisabled() ) {
                                if (c.clearInvalid) { c.clearInvalid(); }
                                return true;
                            }
                            if (c.validate) {
                                return c.validate();
                            }
                        }
                        return false;
                    }
                    ,validate       : function() {
                        var valid = true;
                        var ids = ["IR_import_bgp_id", "IR_import_asnum"];
                        var i;
                        var c;
                        var validTemp;
                        for (i = 0; i < ids.length; i++) {
                            c = Ext.getCmp( ids[i] );
                            validTemp = false;
                            if (c) {
                                if (c.isDisabled() && c.clearInvalid) {
                                    validTemp = true;
                                    c.clearInvalid();
                                } else if (c.validate) {
                                    validTemp = c.validate();
                                }
                            }
                            valid = validTemp && valid;
                        }
                        return valid;
                    }
                    ,clearInvalid   : function() {
                        var ids = ["IR_import_bgp_id", "IR_import_asnum"];
                        var i;
                        var c;
                        for (i = 0; i < ids.length; i++) {
                            c = Ext.getCmp( ids[i] );
                            if (c && c.clearInvalid) {
                                c.clearInvalid();
                            }
                        }
                    }
                    ,items          : [
                        bgpIdCmp
                        ,{ xtype: "tbspacer", width: spacer_width, height: 10 }
                        ,{
                            xtype               : "cp4_textfield"
                            ,hideLabel          : true
                            ,fieldLabel         : "Autonomous System Number"
                            ,id                 : "IR_import_asnum"
                            ,width              : as_width
                            ,margin             : 0
                            ,value              : ""
                            ,emptyText          : "AS Number"
                            ,allowBlank         : false
                            ,maxLength          : 11
                            ,enforceMaxLength   : true
                            ,msgTarget          : "none"
                            ,getValue           : function() {
                                var value = this.getRawValue();
                                value = CP.ar_util.validateConvertToPlain(value, true);

                                return value[0];
                            }
                            ,validator          : function(v) {
                                var value = this.getRawValue();
                                value = CP.ar_util.validateConvertToPlain(value, true);
                                if (value[0] == -1) {
                                    /* Error parsing AS number */
                                    return value[1];
                                }
                                value = value[0];

                                /* Check if unique */
                                var st = Ext.getStore("IR_st_proto");
                                if (st.findExact("ASNUM", value) != -1) {
                                    return "AS Number must be unique.";
                                }

                                return true;
                            }
                        }
                    ]
                };
            } // getAsBGP
            ,getCombo   : function(LABELWIDTH, ST, pushDBValueFunc) {
                var init_values = {
                    data    : {
                        IPROTO  : ""
                        ,ASNUM  : ""
                        ,REGEX  : ""
                        ,ORIGIN : ""
                    }
                };
                if (ST && ST.getCount() == 1) {
                    init_values = ST.getAt(0);
                }

                var combo_width = (CP.IR.SUPPORT_BGP) ? (LABELWIDTH + 400) : (LABELWIDTH + 205);

                return {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Import From"
                    ,id             : "IR_import_proto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : combo_width
                    ,margin         : "0 0 5 15"
                    ,queryModel     : "local"
                    ,lastQuery      : ""
                    ,triggerAction  : "all"
                    ,editable       : false
                    ,forceSelection : true
                    ,allowBlank     : false
                    ,store          : ST
                    ,valueField     : "IPROTO"
                    ,displayField   : "IPROTO_D"
                    ,IPROTO         : init_values.data.IPROTO
                    ,ASNUM          : init_values.data.ASNUM
                    ,REGEX          : init_values.data.REGEX
                    ,ORIGIN         : init_values.data.ORIGIN
                    ,getProtoType   : function() {
                        var c = this;
                        var IPROTO = c.getIPROTO();
                        if (String(IPROTO).toLowerCase().indexOf("bgp") != -1) {
                            return "bgp";
                        }
                        return IPROTO;
                    }
                    ,getIPROTO      : function() {  var c = this;   return c.IPROTO; }
                    ,getASNUM       : function() {  var c = this;   return String(c.ASNUM); }
                    ,getREGEX       : function() {  var c = this;   return String(c.REGEX); }
                    ,getORIGIN      : function() {  var c = this;   return c.ORIGIN; }
                    ,pushDBValue    : pushDBValueFunc
                    ,selectChange   : function() {
                        var c = this;
                        var import_st = Ext.getStore("IR_st_import");
                        var v = c.getValue();
                        var rec = c.getStore().findRecord("IPROTO", v);

                        var lp_cmp = Ext.getCmp("IR_import_global_localpref_entry");
                        var wt_cmp = Ext.getCmp("IR_import_global_weight_entry");

                        if (rec) {
                            c.IPROTO = rec.data.IPROTO;
                            c.ASNUM = rec.data.ASNUM;
                            c.REGEX = rec.data.REGEX;
                            c.ORIGIN = rec.data.ORIGIN;
                            if (lp_cmp) { lp_cmp.setValue(rec.data.IP_localpref); }
                            if (wt_cmp) { wt_cmp.setValue(rec.data.IP_preference); }
                        } else {
                            c.IPROTO = "";
                            c.ASNUM = "";
                            c.REGEX = "";
                            c.ORIGIN = "";
                            if (lp_cmp) { lp_cmp.setValue(""); }
                            if (wt_cmp) { wt_cmp.setValue(""); }
                        }
                        if (import_st && import_st.loadSubStore) {
                            import_st.loadSubStore(rec);
                        }
                        var metric_ids =    ["IR_import_precedence_entry"
                                            ,"IR_import_bgp_metric_set"
                                            ,"IR_import_bgp_metric_global_set"];
                        var i, m;
                        var modifierTitle = Ext.getCmp("IR_import_modifiers_title");
                        if (modifierTitle) {
                            modifierTitle.setVisible(true);
                        }
                        for(i = 0; i < metric_ids.length; i++) {
                            m = Ext.getCmp(metric_ids[i]);
                            if (m && m.handleVisibleDisable) {
                                m.handleVisibleDisable();
                            }
                        }
                    }
                    ,listeners      : {
                        afterrender     : function(c, eOpts) {
                            var st = c.getStore();
                            if (st && st.getCount && st.getCount() == 1) {
                                var rec = st.getAt(0);
                                c.select( rec.data.IPROTO );
                            }
                        }
                        ,change         : function(c, newValue, oldValue, eOpts) {
                            if (c && c.selectChange) {
                                c.selectChange();
                            }
                        }
                    }
                };
            } // getCombo
            ,getConstant: function(LABELWIDTH, REC, pushDBValueFunc) {
                return {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Import From"
                    ,id             : "IR_import_proto_entry"
                    ,labelWidth     : LABELWIDTH
                    ,width          : (LABELWIDTH + 400)
                    //,height         : 22
                    //,autoScroll     : true
                    ,margin         : "0 0 5 15"
                    ,value          : REC.data.IPROTO_D
                    ,IPROTO         : REC.data.IPROTO
                    ,ASNUM          : REC.data.ASNUM
                    ,REGEX          : REC.data.REGEX
                    ,ORIGIN         : REC.data.ORIGIN
                    ,getProtoType   : function() {
                        var c = this;
                        var IPROTO = c.getIPROTO();
                        if (String(IPROTO).toLowerCase().indexOf("bgp") != -1) {
                            return "bgp";
                        }
                        return IPROTO;
                    }
                    ,getIPROTO      : function() {  var c = this;   return c.IPROTO; }
                    ,getASNUM       : function() {  var c = this;   return String(c.ASNUM); }
                    ,getREGEX       : function() {  var c = this;   return String(c.REGEX); }
                    ,getORIGIN      : function() {  var c = this;   return c.ORIGIN; }
                    ,pushDBValue    : pushDBValueFunc
                };
            } // getConstant
        });

        function sortType_addrmask(v) {
            switch ( String(v).toLowerCase() ) {
                case "all ipv4 routes":
                    return 0;
                case "all ipv6 routes":
                    return 1;
                case "all ipv4 & ipv6 routes":
                    return 2;
                default:
            }
            var addrmask = String(v).toLowerCase().split("/");
            var addr = addrmask[0];
            var mask = addrmask[1];
            var i;
            var retValue = 1;
            if (addr.indexOf(".") != -1) {
                var octets = addr.split(".");
                var o;
                for(i = 0; i < 4; i++) {
                    o = (octets.length > i) ? parseInt(octets[i], 10) : 0;
                    retValue = (retValue * 256) + o;
                }
            } else {
                var addr_db = "1"+ String( CP.ip6convert.ip6_2_db(addr) );
                retValue = parseInt(addr_db, 16);
            }
            retValue = (1000 * retValue) + parseInt(mask, 10);
            return retValue + 3;
        }

        function sortType_aspathoptList2(vList) {
            if (Ext.typeOf(vList) != "array") {
                return 7000000000;
            }
            var minC = 65536; var A = 0;
            var i;
            for(i = 0; i < vList.length; i++) {
                if (vList[i].com < minC) {
                    minC = vList[i].com;
                    A = vList[i].as;
                }
            }
            return parseInt(A + (100000 * minC), 10);
        }

        var import_fields = [
            "IPROTO_D"
            ,{ name: "IPROTO",  sortType: sortType_IPROTO }
            ,{ name: "AF",      sortType: sortType_AF }
            ,"ASNUM"
            ,"REGEX"
            ,"ORIGIN"
            ,"I_R_O_A"
            //All or an address
            ,{ name: "DISPLAY", sortType: sortType_addrmask }
            ,"ADDR"
            ,"MASK"
            ,"IP_localpref"
            ,"IP_preference"
            ,"filtertype"
            ,"between"
            ,"and"
            ,"restrict"
            ,"localpref"
            ,"preference"
            ,"precedence"
            ,{ name: "aspathoptList2", sortType: sortType_aspathoptList2 }
        ];

        Ext.create("CP.WebUI4.Store", {
            storeId     : "IR_st_import"
            ,autoLoad   : false
            ,data       : []
            ,fields     : import_fields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "IPROTO", direction: "ASC" }
                            ,{ property: "DISPLAY", direction: "ASC" }]
            ,loadSubStore: function(REC) {
                var dataList = [];
                if (REC && REC.data && REC.data.aspathoptList2) {
                    dataList = REC.data.aspathoptList2;
                }
                var com_st = Ext.getStore("IR_st_import_com");
                var delBtn = Ext.getCmp("IR_import_aspathopt_btn_delete");
                if (com_st) {
                    com_st.removeAll();
                    if (delBtn) { delBtn.deleteArr = []; }
                    com_st.loadData(dataList);
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "IR_st_import_com"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["com", "as", "new", "as_com"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [{ property: "as_com", direction: "ASC" }]
            ,pushDBValue: function(params, prefix) {
                //prefix should be i_prefix
                var com_en = CP.IR.COMMUNITIES_ENABLED;
                var i;
                var a_prefix = prefix +":aspathopt";
                //go through deleteArr
                var delBtn = Ext.getCmp("IR_import_aspathopt_btn_delete");
                if (delBtn && delBtn.deleteArr) {
                    var delArr = delBtn.deleteArr;
                    for(i = 0; i < delArr.length; i+= 2) {
                        var com = delArr[i];
                        var as = delArr[i+1];

                        /* Delete this comm:as pair */
                        params[a_prefix +":community:"+ com +":as:"+ as ]   = "";
                    }
                }
                var recs = Ext.getStore("IR_st_import_com").getRange();
                var d;
                var proto_cmp = Ext.getCmp("IR_import_proto_entry");
                var isBgp = (proto_cmp && proto_cmp.getProtoType)
                    ? proto_cmp.getProtoType() == "bgp" : false;
                if (isBgp) {
                    if (recs.length > 0) {
                        params[a_prefix] = com_en ? "t" : "";
                    }
                    for(i = 0; i < recs.length; i++) {
                        d = recs[i].data;
                        params[a_prefix +":community:"+ d.com +":as:"+ d.as]   = com_en ? "t" : "";
                    }
                } else if (!isBgp) {
                    params[a_prefix] = "";
                }
            }
        });
    }

//  Import set              ////////////////////////////////////////////////////
    ,get_import_set         : function() {
        var old_grid = Ext.getCmp("IR_import_grid");
        if (old_grid && old_grid.destroy) { old_grid.destroy(); }
        var Arr = [];

        function addSubBtnHandler(b, e) {
            var g = Ext.getCmp("IR_import_grid");
            if (g) {
                var sm = g.getSelectionModel();
                if (sm) {
                    sm.deselectAll();
                }
            }
            var bigB = Ext.getCmp("IR_import_btn_add_menu");
            if ( bigB && bigB.handle_no_token && bigB.handle_no_token() ) {
                var s = b.sType;
                if (!s) { return; }
                CP.IR.open_import_window(false, s);
            }
        }

        var addMenuList = [];
        var GAP = "&nbsp;&nbsp;&nbsp;&nbsp;";
        var addMenuValues = [];
        addMenuValues.push({
            text    : "Add BGP Policy Filter (Based on AS-PATH)"+ GAP
            ,sType  : "aspath"
            ,afType : "all"
        });
        addMenuValues.push({
            text    : "Add BGP Policy Filter (Based on AS)"+ GAP
            ,sType  : "as"
            ,afType : "all"
        });
        addMenuValues.push({
            text    : "Add Individual IPv4 Route Filter"+ GAP
            ,sType  : "inet"
            ,afType : "inet"
        });
        addMenuValues.push({
            text    : "Add Individual IPv6 Route Filter"+ GAP
            ,sType  : "inet6"
            ,afType : "inet6"
        });

        var i;
        for(i = 0; i < addMenuValues.length; i++) {
            addMenuList.push({
                text                : (addMenuValues[i].text)
                ,id                 : ("IR_import_btn_add_"+ addMenuValues[i].sType)
                ,sType              : (addMenuValues[i].sType)
                ,afType             : (addMenuValues[i].afType)
                ,iconCls            : "element"
                ,overrideNoToken    : false
                ,handler            : addSubBtnHandler
            });
        }

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "IR_import_btnsbar"
            ,items  : [
                /*
                {
                    text                : "Add"
                    ,id                 : "IR_import_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false                    
                    ,handler2           : function(b) {
                        var g = Ext.getCmp("IR_import_grid");
                        if (g) {
                            var sm = g.getSelectionModel();
                            if (sm) { sm.deselectAll(); }
                        }
                        CP.IR.open_import_window(false, "inet6");
                    }
                }, // Add
                // */
                {
                    text                : "Add"
                    ,xtype              : "cp4_button"
                    ,id                 : "IR_import_btn_add_menu"
                    //,hidden             : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,getVisBtnCnt       : function() {
                        var b = this;
                        var visCnt = {
                            "all"       : 0
                            ,"inet"     : 0
                            ,"inet6"    : 0
                            ,"total"    : 0
                        };
                        if (b && b.menu && b.menu.items) {
                            var mList = b.menu.items;
                            var i, m;
                            for(i = 0; i < mList.length; i++) {
                                m = mList[i];
                                if (m && m.isVisible && m.isVisible() && m.afType) {
                                    visCnt[m.afType]++;
                                    visCnt["total"]++;
                                }
                            }
                        }
                        return visCnt;
                    }
                    ,menu               : {
                        style   : { overflow: "visible" }
                        ,xtype  : "menu"
                        ,plain  : true
                        ,items  : addMenuList
                    }
                } // Add Menu
                ,{
                    text                : "Edit"
                    ,id                 : "IR_import_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var g = Ext.getCmp("IR_import_grid");
                        if (g) {
                            var sm = g.getSelectionModel();
                            if (sm) {
                                var rec = sm.getLastSelected();
                                CP.IR.open_import_window(rec, false);
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("IR_import_grid");
                        return ( (g &&g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                } // Edit
                ,{
                    text                : "Delete"
                    ,id                 : "IR_import_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var import_st = Ext.getStore("IR_st_import");
                        var g = Ext.getCmp("IR_import_grid");
                        if (import_st && g) {
                            var sm = g.getSelectionModel();
                            if (sm && sm.getCount() > 0) {
                                var recs = sm.getSelection();
                                var i;
                                var params = CP.ar_util.clearParams();
                                var prefix = CP.IR.getPrefix() +":import_proto";
                                for(i = 0; i < recs.length; i++) {
                                    b.deleteRecord(params, prefix, recs[i], import_st);
                                }
                                CP.IR.mySubmit();
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("IR_import_grid");
                        return ( (g &&g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, prefix, rec, st) {
                        var IPROTO  = String(rec.data.IPROTO);
                        var AF      = String(rec.data.AF);
                        var ASNUM   = String(rec.data.ASNUM);
                        var REGEX   = String(rec.data.REGEX);
                        var ORIGIN  = String(rec.data.ORIGIN); //do not toLowerCase this!
                        var ADDR    = String(rec.data.ADDR);
                        if (AF == "inet6" && ADDR != CP.IR.ALL_INET6_LABEL) {
                            ADDR = CP.ip6convert.ip6_2_db(ADDR);
                        }
                        var MASK    = String(rec.data.MASK);

                        var i_prefix = prefix +":"+ IPROTO;
                        if (ASNUM != "") {
                            i_prefix = i_prefix +":as:"+ ASNUM;
                        } else if (REGEX != "" && ORIGIN != "") {
                            i_prefix = i_prefix +":aspath:asregex:"+ REGEX;
                            i_prefix = i_prefix +":origin:"+ ORIGIN;
                        }

                        var delete_prefix = "";
                        if (ADDR == CP.IR.ALL_INET_LABEL ||
                            ADDR == CP.IR.ALL_INET6_LABEL ||
                            ADDR == "both") {
                            if (ASNUM == "" && REGEX == "") {
                                // Ospf2, rip, Ospf3 should always have a policy
                                // Set all routes to restricted
                                params[i_prefix + ":" + ADDR]                     = "t";
                                params[i_prefix + ":" + ADDR + ":restrict"]       = "t";
                                params[i_prefix + ":" + ADDR + ":precedence"]     = "";

                                // Recursively clean-up all route bindings
                                delete_prefix = "SPECIAL:" + i_prefix + ":network";
                                params[delete_prefix] = "";
                            } else {
                                // Recursively clean-up all policy bindings
                                delete_prefix = "SPECIAL:" + prefix + ":" + IPROTO;
                                params[delete_prefix] = "";
                            }
                        } else {
                            r_prefix = i_prefix +":network:"+ ADDR;
                            if (AF == "inet6") {
                                r_prefix = i_prefix +":network:v6addr:"+ ADDR;
                            }

                            // Recursively clean-up route bindings
                            delete_prefix = "SPECIAL:" + i_prefix + ":network";
                            if (AF == "inet6") {
                                delete_prefix = delete_prefix + ":v6addr";
                            }
                            params[delete_prefix + ":" + ADDR + ":masklen:" + MASK] = "";
                        }

                        st.remove(rec);
                    }
                } // Delete
                /*
                ,{
                    text                : "Reload"
                    ,id                 : "IR_import_btn_reload"
                    ,handler            : function(b, e) { CP.IR.doLoad(); }
                } // Reload
                // */
            ]
        });

        function colAfterrenderer(c, eOpts) {
            if (c && c.quickTipText) {
                Ext.tip.QuickTipManager.register({
                    target          : c.getId()
                    ,text           : c.quickTipText
                    ,dismissDelay   : 0
                });
            }
        }

        var grid_cm = [
            {
                text            : "From Protocol"
                ,dataIndex      : "IPROTO"
                ,flex           : 1
                //,minWidth       : 210
                ,maxWidth       : 280
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.IPROTO_D;
                    var tip = rec.data.IPROTO_D;
                    var color = "black";
                    /*
                    if (String(value).toLowerCase().indexOf("bgp:id:") != -1) {
                        var vList = String(value).toLowerCase().split(":");
                        if (vList.length > 0) {
                            retValue = "BGP Policy "+ vList[vList.length-1];
                        }
                    }
                    // */
                    if (!(rec.data.ADDR == CP.IR.ALL_INET_LABEL
                          || rec.data.ADDR == CP.IR.ALL_INET6_LABEL
                          || rec.data.ADDR == "both")) {
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", color);
                }
            },{
                text            : "Route"
                ,dataIndex      : "DISPLAY"
                ,width          : 125
                ,minWidth       : 120
                ,maxWidth       : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : CP.IR.FILTERTYPE_LABEL
                ,dataIndex      : "filtertype"
                ,width          : 100
                ,minWidth       : 100
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.filtertype);
                    var addr = String(rec.data.ADDR);
                    var mask = String(rec.data.MASK);
                    var color = "black";
                    if (mask == "") {
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
                ,minWidth       : 70
                ,maxWidth       : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    switch (value) {
                        case 5:
                            retValue = "Accept";
                            break;
                        case 6:
                            retValue = "Restrict";
                            break;
                        case 10:
                            if (CP.IR.IPv6_MODE) {
                                retValue = "Accept IPv4\nAccept IPv6";
                            } else {
                                retValue = "Accept";
                            }
                            break;
                        case 11:
                            if (CP.IR.IPv6_MODE) {
                                retValue = "Restrict IPv4\nRestrict IPv6";
                            } else {
                                retValue = "Restrict";
                            }
                            break;
                        case 12:
                            retValue = "Accept IPv4\nRestrict IPv6";
                            break;
                        case 13:
                            retValue = "Restrict IPv4\nAccept IPv6";
                            break;
                        default:
                            retValue = "Accept";
                            break;
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }
            ,{
                text            : "Rank"
                ,dataIndex      : "precedence"
                ,id             : "IR_import_rank_col"
                ,width          : 50
                ,minWidth       : 50
                ,maxWidth       : 60
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value).toLowerCase();
                    var color = "black";
                    var iP = String(rec.data.IPROTO);
                    if (iP.indexOf("bgp:id:") != -1) {
                        iP = "bgp";
                    }
                    if (iP == "bgp") {
                        retValue = "";
                        color = "gray";
                    } else if (retValue == "") {
                        var defStr = "default_" + iP;
                        if ( CP.IR[defStr] ) {
                            retValue = CP.IR[defStr];
                            color = "gray";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
                ,quickTipText   : CP.IR.RANK_QTIP
                ,listeners      : {
                    afterrender     : colAfterrenderer
                }
            }
            ,{
                text            : "Local Preference"
                ,dataIndex      : "localpref"
                ,id             : "IR_import_localpref_col"
                ,width          : 100
                ,minWidth       : 100
                ,maxWidth       : 120
                ,hidden         : true
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value).toLowerCase();
                    var defaultVal = String(rec.data.IP_localpref);
                    var color = "black";
                    var iP = String(rec.data.IPROTO);
                    if (iP.indexOf("bgp:id:") != -1) {
                        iP = "bgp";
                    }
                    if (iP != "bgp") {
                        retValue = "";
                        color = "gray";
                    } else if (iP == "bgp" && (retValue == "" || rec.data.MASK == "")) {
                        retValue = defaultVal;
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
                ,quickTipText   : "Local Preference is a feature of BGP."
                ,listeners      : {
                    afterrender     : colAfterrenderer
                }
            }
            ,{
                text            : "Weight"
                ,dataIndex      : "preference"
                ,id             : "IR_import_preference_col"
                ,width          : 50
                ,minWidth       : 50
                ,maxWidth       : 60
                ,hidden         : true
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value).toLowerCase();
                    var defaultVal = String(rec.data.IP_preference);
                    var color = "black";
                    var iP = String(rec.data.IPROTO);
                    if (iP.indexOf("bgp:id:") != -1) {
                        iP = "bgp";
                    }
                    if (iP != "bgp") {
                        retValue = "";
                        color = "gray";
                    } else if (iP == "bgp") {
                        if (retValue == "" || rec.data.MASK == "") {
                            retValue = defaultVal;
                            color = "gray";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
                ,quickTipText   : "Weight is a feature of BGP individual routes."
                ,listeners      : {
                    afterrender     : colAfterrenderer
                }
            }
            //last el in array
            ,{
                text            : "Communities"
                ,dataIndex      : "aspathoptList2"
                ,id             : "IR_import_aspathoptList2_col"
                ,width          : 90
                ,minWidth       : 90
                ,maxWidth       : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var columnCmp = Ext.getCmp("IR_import_aspathoptList2_col");
                    var retValue = "";
                    var color = "black";
                    if ( columnCmp && columnCmp.isVisible() ) {
                        var ADDR = rec.data.ADDR;
                        var isBGP = (String(rec.data.IPROTO).indexOf("bgp") == 0);
                        var i;
                        var rList = [];
                        if (CP.IR.COMMUNITIES_ENABLED && isBGP) {
                            var l = rec.data.aspathoptList2;
                            if (Ext.typeOf(l) != "array") {
                                l = [];
                            }
                            if (ADDR == CP.IR.ALL_INET_LABEL
                                || ADDR == CP.IR.ALL_INET6_LABEL
                                || ADDR == "both") {
                                color = "black";
                                retValue = "None";
                                for(i = 0; i < l.length; i ++) {
                                    rList.push(String(l[i].com) +":"+ String(l[i].as));
                                }
                                if (rList.length > 0) {
                                    retValue = rList.join("<br>");
                                }
                            } else {
                                color = "gray";
                                retValue = String(l.length) +" ";
                                if (l.length == 1) {
                                    retValue += "Community";
                                } else {
                                    retValue += "Communities";
                                }
                            }
                        } else {
                            retValue = "";
                            color = "gray";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
                ,quickTipText   : "Communities are a feature of BGP Policies.<br>"
                                + "(Information only displayed with the All routes line.)"
                ,listeners      : {
                    afterrender     : colAfterrenderer
                    ,hide           : function(c) {
                        var g = Ext.getCmp("IR_import_grid");
                        if (g) {
                            g.getView().refresh();
                        }
                    }
                    ,show           : function(c) {
                        c.fireEvent("hide");
                    }
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("IR_import_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "IR_import_grid"
                ,maxWidth           : 890
                ,height             : 400
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("IR_st_import")
                ,columns            : grid_cm
                ,columnLines        : true
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,getSelCount        : function() {
                    var g = this;
                    if (g) {
                        var sm = g.getSelectionModel();
                        if (sm.getCount) {
                            return sm.getCount();
                        }
                    }
                    return 0;
                }
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("IR_import_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

// generateFormRow              ////////////////////////////////////////////////
    ,generateFormRow            : function(rowId, marginStr, Items) {
        return {
            xtype       : "cp4_formpanel"
            ,id         : rowId
            ,layout     : "column"
            ,defaults   : {
                submitValue : false
            }
            ,margin     : (marginStr ? String(marginStr) : 0)
            ,items      : Items
        };
    }

    ,get_route_constant_cmp     : function(DATA, TYPE, LABELWIDTH, DELTAWIDTH,
                                    pushDBValueFunc, validateFunc, clearInvalidFunc) {
        return {
            xtype           : "cp4_displayfield"
            ,fieldLabel     : "Route"
            ,id             : "IR_import_route_network_entry"
            ,labelWidth     : LABELWIDTH
            ,width          : (LABELWIDTH + DELTAWIDTH)
            ,margin         : "0 0 5 15"
            ,height         : 22
            ,value          : DATA.DISPLAY
            ,ADDR           : DATA.ADDR
            ,MASK           : DATA.MASK
            ,AF             : DATA.AF
            ,getAddr        : function() {
                var c = this;
                var a = String(c ? c.ADDR : "").toLowerCase();
                if (a.indexOf(":") != -1) {
                    a = CP.ip6convert.ip6_2_db(a);
                }
                return a;
            }
            ,getMask        : function() {
                var c = this;
                return String(c ? c.MASK : "").toLowerCase();
            }
            ,getAF          : function() {
                var c = this;
                return String(c ? c.AF : "").toLowerCase();
            }
            ,pushDBValue    : pushDBValueFunc
            ,validate       : validateFunc
            ,clearInvalid   : clearInvalidFunc
        };
    }

    ,get_route_cmp              : function(REC, TYPE, LABELWIDTH) {

        function validateFunc() {
            var valid = true;
            var ids = ["IR_import_route_addr", "IR_import_route_mask", "IR_import_route_filter"];
            var i;
            var c;
            for(i = 0; i < ids.length; i++) {
                c = Ext.getCmp(ids[i]);
                if (c) {
                    if ( c.isDisabled() ) {
                        if (c.clearInvalid) { c.clearInvalid(); }
                    } else if (c.validate) {
                        valid = c.validate() && valid;
                    }
                }
            }
            return valid;
        }
        function clearInvalidFunc() {
            var ids = ["IR_import_route_addr", "IR_import_route_mask", "IR_import_route_filter"];
            var i;
            var c;
            for(i = 0; i < ids.length; i++) {
                c = Ext.getCmp(ids[i]);
                if (c && c.clearInvalid) {
                    c.clearInvalid();
                }
            }
        }
        function changeEvent() {
            var c = Ext.getCmp("IR_import_route_network_entry");
            if (c && c.validate) {
                c.validate();
            }
        }

        function pushDBValueFunc(params, prefix) {
            var c = this;
            var ADDR = c.getAddr(); //ipv6 must convert to db format
            var MASK = c.getMask();
            var AF = c.getAF();
            var r_prefix;
            var filter_cmp = Ext.getCmp("IR_import_route_filter_combo");
            var filter = filter_cmp ? filter_cmp.getValue() : "normal";

            if (ADDR == "0.0.0.0" && MASK == "0" && filter == "normal") {
                // Silently treat as all-ipv4-routes
                ADDR = CP.IR.ALL_INET_LABEL;
                MASK = "";
                AF = "all";
            } else if (ADDR == "00000000000000000000000000000000"
                       && MASK == "0" && filter == "normal") {
                ADDR = CP.IR.ALL_INET6_LABEL;
                MASK = "";
                AF = "all";
            } else if (ADDR == CP.IR.ALL_INET_LABEL 
                       || ADDR == CP.IR.ALL_INET6_LABEL) {
                AF = "all";
            }

            switch (AF) {
                case "inet":
                    r_prefix = prefix +":network:"+ ADDR;
                    break;
                case "inet6":
                    r_prefix = prefix +":network:v6addr:"+ ADDR;
                    break;
                case "both":
                    r_prefix = prefix;
                    params[r_prefix+":all-ipv4-routes"] = "t";
                    params[r_prefix+":all-ipv6-routes"] = "t";
                    return r_prefix;
                default:    //all
                    if (ADDR == CP.IR.ALL_INET_LABEL) {
                        r_prefix = prefix +":"+CP.IR.ALL_INET_LABEL;

                        // Cleanup possible all-ipv6-route bindings
                        params[prefix +":"+CP.IR.ALL_INET6_LABEL] = "";
                        params[prefix +":"+CP.IR.ALL_INET6_LABEL+":restrict"] = "";
                        params[prefix +":"+CP.IR.ALL_INET6_LABEL+":preference"] = "";
                        params[prefix +":"+CP.IR.ALL_INET6_LABEL+":precedence"] = "";
                        params[prefix +":"+CP.IR.ALL_INET6_LABEL+":localpref"] = "";
              
                    } else { 
                        r_prefix = prefix +":"+CP.IR.ALL_INET6_LABEL;

                        // Cleanup possible all-ipv4-route bindings
                        params[prefix +":"+CP.IR.ALL_INET_LABEL] = "";
                        params[prefix +":"+CP.IR.ALL_INET_LABEL+":restrict"] = "";
                        params[prefix +":"+CP.IR.ALL_INET_LABEL+":preference"] = "";
                        params[prefix +":"+CP.IR.ALL_INET_LABEL+":precedence"] = "";
                        params[prefix +":"+CP.IR.ALL_INET_LABEL+":localpref"] = "";
                    }
                    params[r_prefix] = "t";
                    return r_prefix;
            }
            //params[r_prefix] = "t";
            r_prefix += ":masklen:"+ MASK;
            params[r_prefix] = "t";
            // call filtertype's push
            if (filter_cmp && filter_cmp.pushDBValue) {
                filter_cmp.pushDBValue(params, r_prefix);
            }
            return r_prefix;
        }

        //(REC, TYPE, LABELWIDTH)
        var ip_addr_width = 250;
        var ip_sep_width = 15;
        var ip_mask_width = 50;
        var ip_mask_maxValue = 32;

        var Arr = [];
        var AFDisplay = "";

        if (REC) { // Edit form
            Arr.push(CP.IR.get_route_constant_cmp(
                         REC.data
                         ,TYPE
                         ,LABELWIDTH
                         ,(ip_addr_width + ip_sep_width + ip_mask_width)
                         ,pushDBValueFunc
                         ,validateFunc
                         ,clearInvalidFunc
            ));
            if (!(REC.data.ADDR == CP.IR.ALL_INET_LABEL
                  || REC.data.ADDR == CP.IR.ALL_INET6_LABEL
                  || REC.data.ADDR == "both")) {
                Arr.push( CP.IR.get_filter_cmp(REC, REC.data.AF, LABELWIDTH, changeEvent) );
            }
        } else if (TYPE == "inet" || TYPE == "inet6") { // Specific route
            if (TYPE == "inet") {
                AFDisplay = "IPv4";
                ip_addr_width = 110;

                ip_addr_cmp = {
                    xtype           : "cp4_ipv4field"
                    ,hideLabel      : true
                    ,fieldLabel     : "Address Prefix"
                    ,id             : "IR_import_route_addr"
                    ,height         : 22
                    ,width          : ip_addr_width
                    ,margin         : 0
                    ,msgTarget      : "none"
                    ,fieldConfig    : { allowBlank: false, submitValue: false }
                    ,octetsConfig   : [{ minValue: 0, maxValue: 255 }
                                      ,{ minValue: 0, maxValue: 255 }
                                      ,{ minValue: 0, maxValue: 255 }
                                      ,{ minValue: 0, maxValue: 255 }]
                    ,getAddr        : function() {
                        var c = this;
                        return ( c.getValue() );
                    }
                };

            } else {
                AFDisplay = "IPv6";
                ip_mask_maxValue = 128;
                ip_addr_width = 250;
                ip_addr_cmp = {
                    xtype               : "cp4_ipv6field"
                    ,hideLabel          : true
                    ,fieldLabel         : "Address Prefix"
                    ,id                 : "IR_import_route_addr"
                    ,width              : ip_addr_width
                    ,margin             : 0
                    ,allowBlank         : false
                    ,maxLength          : 39
                    ,enforceMaxLength   : false
                    ,msgTarget          : "none"
                    ,listeners          : {
                        change              : changeEvent
                    }
                    ,getAddr            : function() {
                        var c = this;
                        var v = String( c.getValue() ).toLowerCase();
                        var v_db = CP.ip6convert.ip6_2_db(v);
                        return v_db;
                    }
                    ,getMaskLength      : function() {
                        var c = this;
                        var v = c.getValue();
                        var m = CP.ip6convert.get_v6masklength(v);
                        return m;
                    }
                    ,validator          : function(v) {
                        var c = this;
                        if (!c) { return true; }
                        var a = String(v).toLowerCase();
                        if (a == "") { return true; }
                        var aLen = c.getMaskLength();
                        var mCmp = Ext.getCmp("IR_import_route_mask");
                        var m = (mCmp ? mCmp.getRawValue() : "");
                        if (m == "") { return true; }
                        var mLen = parseInt(m, 10);
                        if (mLen < aLen) {
                            return "Prefix exceeds mask length.";
                        }
                        return true;
                    }
                };
            }

            Arr.push({
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Address Family"
                ,id             : "IR_import_AF"
                ,labelWidth     : LABELWIDTH
                ,width          : (LABELWIDTH + 150)
                ,height         : 22
                ,margin         : "0 0 5 15"
                ,value          : AFDisplay
            });

            var ip_sep_cmp = {
                xtype   : "cp4_label"
               ,text   : "/"
               ,width  : ip_sep_width
               ,margin : "2 0 0 0"
               ,style  : "text-align:center;"
            };
            var ip_mask_cmp = {
                xtype               : "cp4_v6masklength"
                ,hideLabel          : true
                ,fieldLabel         : "Mask Length"
                ,id                 : "IR_import_route_mask"
                ,width              : ip_mask_width
                ,margin             : 0
                ,allowBlank         : false
                ,value              : ""
                ,minValue           : 0
                ,maxValue           : ip_mask_maxValue
                ,maxLength          : (String(ip_mask_maxValue).length)
                ,enforceMaxLength   : true
                ,msgTarget          : "none"
                ,listeners          : {
                    change              : changeEvent
                }
                ,getMask            : function() {
                    var c = this;
                    return ( c.getValue() );
                }
                ,validator          : function(mLen) {
                    if (String(mLen) == "") { return true; }
                    var a = Ext.getCmp("IR_import_route_addr");
                    var aLen = (a && a.getMaskLength) ? a.getMaskLength() : "";
                    if (aLen == "") { return true; }
                    mLen = parseInt(mLen, 10);
                    if (mLen < aLen) {
                       return "Insufficient mask length.";
                    }
                    return true;
                }
           };

           Arr.push({
               xtype           : "cp4_fieldcontainer"
               ,fieldLabel     : "Route"
               ,id             : "IR_import_route_entry"
               ,labelWidth     : LABELWIDTH
               ,width          : (LABELWIDTH + ip_addr_width + ip_sep_width + ip_mask_width + 23)
               ,height         : 22
               ,margin         : "0 0 5 15"
               ,items          : [ip_addr_cmp, ip_sep_cmp, ip_mask_cmp]
               ,AF             : TYPE
               ,getAddr        : function() {
                   var a = Ext.getCmp("IR_import_route_addr");
                   return ( a.getAddr() );
               }
               ,getMask        : function() {
                   var m = Ext.getCmp("IR_import_route_mask");
                   return ( m.getMask() );
               }
               ,getAF          : function() {
                   var c = this;
                   var AF = String(c.AF).toLowerCase();
                   switch (AF) {
                       case "inet6":
                           return "inet6";
                       case "inet":
                       default:
                           return "inet";
                   }
               }
               ,pushDBValue    : pushDBValueFunc
               ,validate       : validateFunc
               ,clearInvalid   : clearInvalidFunc
               ,isValid        : function() {
                   var c = this;
                   if (c) {
                       if ( c.isDisabled() ) {
                           if (c.clearInvalid) { c.clearInvalid(); }
                           return true;
                       }
                       if (c.validate) {
                           return c.validate();
                       }
                   }
                   return false;
               }
           });
            
            Arr.push( CP.IR.get_filter_cmp(REC, TYPE, LABELWIDTH, changeEvent) );
        } else {
            if (CP.IR.IPv6_MODE) {
                var addr_family = "All IPv4 & IPv6 Routes";
            } else {
                var addr_family = "All IPv4 Routes";
            }
            Arr.push({
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Address Family"
                ,id             : "IR_import_AF"
                ,labelWidth     : LABELWIDTH
                ,width          : (LABELWIDTH + 150)
                ,height         : 22
                ,margin         : "0 0 5 15"
                ,value          : addr_family
            });
        }
        return Arr;
    }
    ,get_filter_cmp             : function(REC, TYPE, LABELWIDTH, changeEvent) {
        function range_validator(v) {
            if (v == "") { return true; }
            var r;
            if (REC) {
                r = Ext.getCmp("IR_import_route_network_entry");
            } else {
                r = Ext.getCmp("IR_import_route_entry");
            }
            var m = r.getMask();
            v = parseInt(v, 10);
            if (v < m) { return "Range cannot be less than mask length."; }
            return true;
        }

        var filterStore;
        var range_cmp = false;
        var range_width = 0;
        var range_maxValue = 32;
        if (TYPE == "inet6") {
            range_maxValue = 128;
            if (REC && REC.data.DISPLAY == "::/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]];
            } else {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]];
            }
        } else {
            if (REC && REC.data.DISPLAY == "0.0.0.0/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]
                                ,["range"   ,"Range"]];
            } else if (REC && REC.data.DISPLAY == "::/0") {
                filterStore =   [["exact"   ,"Exact"]
                                ,["refines" ,"Refines"]];
            } else if (REC && REC.data.DISPLAY.indexOf(':') === -1) {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]
                                ,["range"   ,"Range"]];
            } else {
                filterStore =   [["exact"   ,"Exact"]
                                ,["normal"  ,"Normal"]
                                ,["refines" ,"Refines"]
                                ,["range"   ,"Range"]];
            }
        }

        var Arr = [];

        Arr.push({
            xtype           : "cp4_combobox"
            ,hideLabel      : true
            ,fieldLabel     : CP.IR.FILTERTYPE_LABEL
            ,id             : "IR_import_route_filter_combo"
            ,width          : 100
            ,value          : (REC ? REC.data.filtertype : "exact")
            ,margin         : 0
            ,store          : filterStore
            ,allowBlank     : false
            ,editable       : false
            ,forceSelection : true
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,msgTarget      : "none"
            ,listeners      : {
                change          : function(c, newValue, oldValue, eOpts) {
                    var range_cmp = Ext.getCmp("IR_import_route_range");
                    if (range_cmp) {
                        if (range_cmp.setVisible) {
                            range_cmp.setVisible( newValue == "range" );
                        }
                        if (range_cmp.setChildDisabled) {
                            range_cmp.setChildDisabled( newValue != "range" );
                        }
                        if (range_cmp.validate) {
                            range_cmp.validate();
                        }
                    }
                    changeEvent();
                }
            }
        });

        if (TYPE == "inet") {
            var range_sep_width = 25;
            var range_mLen_width = 50;
            var range_to_width = 25;
            range_width = range_sep_width + (2 * range_mLen_width) + range_to_width;

            Arr.push({
                xtype               : "cp4_fieldcontainer"
                ,hideLabel          : true
                ,id                 : "IR_import_route_range"
                ,width              : range_width
                ,margin             : 0
                ,msgTarget          : "none"
                ,hidden             : (REC ? REC.data.filtertype != "range" : true)
                ,setChildDisabled   : function(disable) {
                    var cb = Ext.getCmp("IR_import_route_filter_combo");
                    var v = cb ? cb.getValue() : "";
                    var d = cb ? cb.isDisabled() : false;
                    disable = (v != "range") || d;
                    CP.IR.checkSetDisabled("IR_import_route_between", disable);
                    CP.IR.checkSetDisabled("IR_import_route_and", disable);
                }
                ,isValid            : function() {
                    var c = this;
                    if (c) {
                        if ( c.isDisabled() ) {
                            if (c.clearInvalid) { c.clearInvalid(); }
                            return true;
                        }
                        if (c.validate) {
                            return c.validate();
                        }
                    }
                    return false;
                }
                ,clearInvalid       : function() {
                    var b = Ext.getCmp("IR_import_route_between");
                    var a = Ext.getCmp("IR_import_route_and");
                    if (b && b.clearInvalid) { b.clearInvalid(); }
                    if (a && a.clearInvalid) { a.clearInvalid(); }
                }
                ,validate           : function() {
                    var b = Ext.getCmp("IR_import_route_between");
                    var a = Ext.getCmp("IR_import_route_and");
                    var valid = (b ? b.validate() : false);
                    return ( (a ? a.validate() : false) && valid );
                }
                ,getDBValue         : function() {
                    var cb = Ext.getCmp("IR_import_route_filter_combo");
                    var isRange = (cb ? cb.getValue() == "range" : false);
                    if (!isRange) {
                        return ["", ""];
                    }
                    var bCmp = Ext.getCmp("IR_import_route_between");
                    var aCmp = Ext.getCmp("IR_import_route_and");
                    var b = (bCmp ? bCmp.getValue() : 32);
                    var a = (aCmp ? aCmp.getValue() : 32);
                    if (b < a) {
                        return [b,a];
                    }
                    return [a,b];
                }
                ,items              : [{
                    xtype               : "tbspacer"
                    ,height             : 22
                    ,width              : range_sep_width
                },{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,fieldLabel         : "Mask Length Range"
                    ,id                 : "IR_import_route_between"
                    ,value              : (REC ? REC.data.between : "")
                    ,width              : range_mLen_width
                    ,margin             : 0
                    ,msgTarget          : "none"
                    ,disabled           : (REC ? REC.data.filtertype != "range" : true)
                    ,allowBlank         : false
                    ,allowDecimals      : false
                    ,minValue           : 1
                    ,maxValue           : range_maxValue
                    ,maxLength          : String(range_maxValue).length
                    ,enforceMaxLength   : true
                    ,validator          : range_validator
                    ,listeners          : {
                        change              : changeEvent
                    }
                },{
                    xtype               : "cp4_label"
                    ,text               : "to"
                    ,style              : "text-align:center;"
                    ,margin             : "2 0 0 0"
                    ,width              : range_to_width
                },{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,fieldLabel         : "Mask Length Range"
                    ,id                 : "IR_import_route_and"
                    ,value              : (REC ? REC.data.and : "")
                    ,width              : range_mLen_width
                    ,margin             : 0
                    ,msgTarget          : "none"
                    ,disabled           : (REC ? REC.data.filtertype != "range" : true)
                    ,allowBlank         : false
                    ,allowDecimals      : false
                    ,minValue           : 1
                    ,maxValue           : range_maxValue
                    ,maxLength          : String(range_maxValue).length
                    ,enforceMaxLength   : true
                    ,validator          : range_validator
                    ,listeners          : {
                        change              : changeEvent
                    }
                }]
            });
        }

        return {
            xtype           : "cp4_fieldcontainer"
            ,fieldLabel     : CP.IR.FILTERTYPE_LABEL
            ,id             : "IR_import_route_filter"
            ,labelWidth     : LABELWIDTH
            ,width          : (LABELWIDTH + 5 + 100 + range_width + 23)
            ,margin         : "0 0 5 15"
            ,padding        : 0
            ,items          : Arr
            ,pushDBValue    : function(params, prefix) {
                //prefix the complete route
                var cb = Ext.getCmp("IR_import_route_filter_combo");
                var filtertype = cb ? cb.getValue() : "normal";
                var range = ["", ""];
                if (filtertype == "range") {
                    var range_cmp = Ext.getCmp("IR_import_route_range");
                    if (range_cmp && range_cmp.getDBValue) {
                        range = range_cmp.getDBValue();
                    }
                }
                params[prefix +":filtertype"]   = filtertype;
                params[prefix +":between"]      = range[0];
                params[prefix +":and"]          = range[1];
                params[prefix +":exact"]        = (filtertype == "exact") ? "t" : "";
                params[prefix +":refines"]      = (filtertype == "refines") ? "t" : "";
            }
            ,isValid        : function() {
                var c = this;
                if (c) {
                    if ( c.isDisabled() ) {
                        if (c.clearInvalid) { c.clearInvalid(); }
                        return true;
                    }
                    if (c.validate) {
                        return c.validate();
                    }
                }
                return false;
            }
            ,validate       : function() {
                var ids = ["IR_import_route_filter_combo", "IR_import_route_range"];
                var c, i;
                var valid = true;
                for(i = 0; i < ids.length; i++) {
                    c = Ext.getCmp(ids[i]);
                    if (c) {
                        if ( c.isDisabled() ) {
                            if (c.clearInvalid) {
                                c.clearInvalid();
                            }
                        } else if (c.validate) {
                            valid = c.validate() && valid;
                        }
                    }
                }
                return valid;
            }
            ,clearInvalid   : function() {
                var ids = ["IR_import_route_filter_combo", "IR_import_route_range"];
                var c, i;
                for(i = 0; i < ids.length; i++) {
                    c = Ext.getCmp(ids[i]);
                    if (c && c.clearInvalid) {
                        c.clearInvalid();
                    }
                }
            }
        };
    }

//  OPEN IMPORT WINDOW          ////////////////////////////////////////////////
    ,open_import_window         : function(REC, TYPE) {
        // REC := false (add) or a record (edit)
        // TYPE := aspath (add a new all), as (add a new as num), add inet route, add inet6 route

        //how to tell mode
        var notBgp = false; //ospf or rip
        var isBgp = false; //might be a bgp
        var isPolicy = false;
        var hideBgp = true;
        if (REC) {
            isPolicy = (String(REC.data.ADDR).toLowerCase() == CP.IR.ALL_INET_LABEL)
                    || (String(REC.data.ADDR).toLowerCase() == CP.IR.ALL_INET6_LABEL)
                    || (String(REC.data.ADDR).toLowerCase() == "both");
            isBgp = (String(REC.data.IPROTO).toLowerCase().indexOf("bgp") > -1);
            notBgp = !isBgp;
        } else {
            if (TYPE == "aspath" || TYPE == "as") {
                isBgp = true;
                notBgp = false;
                isPolicy = true;
                hideBgp = false;
            } else { //type == inet or inet6
                isBgp = true; //might be a bgp
                notBgp = true; //might not be a bgp
                isPolicy = false;
            }
        }

        var Arr = [];
        var rowArr2 = [];
        var rowArr3 = [];

        Arr.push({ xtype: "tbspacer", width: 15, height: 15 });

        var ActionWidth = 160;
        var TITLE = "";
        if (REC) {
            TYPE = REC.data.AF; //inet, inet6, or all
            TITLE = REC.data.IPROTO_D +" - "+ REC.data.DISPLAY;
        } else {
            switch (TYPE) {
                case "as":
                    TITLE = "Add BGP Policy Filter based on AS";
                    break;
                case "aspath":
                    TITLE = "Add BGP Policy Filter based on AS-Path";
                    break;
                case "inet":
                    TITLE = "Add IPv4 Route Filter";
                    break;
                default:
                    TITLE = "Add IPv6 Route Filter";
            }
        }
        var LABELWIDTH = 100;
        var innerFormWidth = (LABELWIDTH + 440 + 35);

        /* Filters */
        var filtertext = isPolicy ? "Policy Filter" : "Route Filter";
        Arr.push({
            xtype           : "cp4_sectiontitle"
            ,titleText      : filtertext
            ,id             : "IR_import_filter_title"
            ,width          : (innerFormWidth - 35)
            ,margin         : "0 0 10 15"
            ,hidden         : (REC ? false : false)
        });

        var st = Ext.getStore("IR_st_proto");
        var iproto_cmp = st.getProtoCmp(REC, TYPE, LABELWIDTH);
        Arr.push( iproto_cmp );

        var route_cmp = CP.IR.get_route_cmp(REC, TYPE, LABELWIDTH);
        Arr.push( route_cmp );

        var action_restrict = ( (REC ? String(REC.data.restrict) : "") != "" );

        // Set "Action" dropdown values
        var action_value = 0;
        if (TYPE == "inet" || TYPE == "inet6") {
            var ActionStore = [["5"  ,"Accept"],
                               ["6"  ,"Restrict"]];
            action_value = (REC ? REC.data.restrict : 5);
        } else if (TYPE == "as" || TYPE == "aspath" || TYPE == "both") {
            if (CP.IR.IPv6_MODE) {
                var ActionStore = [["10"   ,"Accept IPv4 & IPv6"],
                                   ["11"   ,"Restrict IPv4 & IPv6"],
                                   ["12"   ,"Accept IPv4, Restrict IPv6"],
                                   ["13"   ,"Restrict IPv4, Accept IPv6"]];
                action_value = (REC ? REC.data.restrict : 10);
            } else {
                var ActionStore = [["10"  ,"Accept"],
                                   ["11"  ,"Restrict"]];
                action_value = (REC ? REC.data.restrict : 10);
            }
        }

        /* Communities to match */
        if (CP.IR.COMMUNITIES_ENABLED && isBgp && isPolicy) {

            Arr.push({
                xtype           : "cp4_formpanel"
                ,id             : "IR_import_comm_form"
                ,layout         : "column"
                ,margin         : "0 0 5 0"
                ,padding        : 0
                ,items          : [{
                    xtype           : "cp4_label"
                    ,text           : "Communities to Match"
                    ,id             : "IR_import_communities_title"
                    ,width          : 105
                    ,margin         : "0 0 5 15"
                },
                {
                    xtype               : "cp4_grid"
                    ,id                 : "IR_import_aspathopt_grid"
                    ,width              : 150
                    ,height             : 101
                    ,margin             : "0 0 5 0"
                    ,forceFit           : true
                    ,autoScroll         : true
                    ,store              : Ext.getStore("IR_st_import_com")
                    ,columns            : [
                        {
                            text: "Community:AS", dataIndex: "as_com", flex: 1, menuDisabled: true
                            ,renderer: function(value, meta, rec, row, col, st, view) {
                                var retValue = String(rec.data.com) +":"+ String(rec.data.as);
                                return CP.ar_util.rendererGeneric(retValue);
                            }
                        }
                    ]
                    ,selModel           : Ext.create("Ext.selection.RowModel", {
                        allowDeselect       : true
                        ,mode               : "MULTI"
                        ,listeners          : {
                            selectionchange     : function(view, selections, eOpts) {
                                CP.ar_util.checkBtnsbar("IR_import_aspathopt_btnsbar");
                            }
                        }
                    })
                    ,draggable          : false
                    ,enableColumnMove   : false
                    ,enableColumnResize : true
                    ,getSelCount        : function() {
                        var g = this;
                        if (g) {
                            var sm = g.getSelectionModel();
                            if (sm.getCount) {
                                return sm.getCount();
                            }
                        }
                        return 0;
                    }
                },
                {
                    xtype   : "cp4_btnsbar"
                    ,id     : "IR_import_aspathopt_btnsbar"
                    ,style  : "margin-left:10px;margin-top:25px;"
                    ,layout : {
                        type : "column"
                    }
                    ,items  : [
                        {
                            text                : "Add"
                            ,id                 : "IR_import_aspathopt_btn_add"
                            ,disabled           : true
                            ,margin             : "0 8 5 0"
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                CP.IR.open_com_window(false);
                            }
                        },{
                            text                : "Delete"
                            ,id                 : "IR_import_aspathopt_btn_delete"
                            ,disabled           : true
                            ,deleteArr          : []
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                var sm = Ext.getCmp("IR_import_aspathopt_grid").getSelectionModel();
                                var st = Ext.getStore("IR_st_import_com");
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
                                var g = Ext.getCmp("IR_import_aspathopt_grid");
                                return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                            }
                        }
                    ]
                }]
            });
        }

        Arr.push({
            xtype           : "cp4_combobox"
            ,fieldLabel     : "Action"
            ,id             : "IR_import_restrict_entry"
            ,labelWidth     : LABELWIDTH
            ,width          : (LABELWIDTH + ActionWidth)
            ,margin         : "0 0 5 15"
            ,editable       : false
            ,forceSelection : true
            ,queryModel     : "local"
            ,triggerAction  : "all"
            ,value          : action_value
            ,store          : ActionStore
            ,getDBValue     : function() {
                var c = this;
                return c.getValue();
            }
            ,pushDBValue    : function(params, prefix) {
                var c = this;
                var v = c.getDBValue();
                // Return value is whether to print out weight/localpref
                switch (v) {
                    case "5": // Accept route
                        params[prefix +":restrict"] = "";
                        return true;
                    case "6": // Reject route
                        params[prefix +":restrict"] = "t";
                        return true;
                    case "10": // Accept IPv4, Accept IPv6
                        params[prefix +":all-ipv4-routes:restrict"] = "";
                        params[prefix +":all-ipv6-routes:restrict"] = "";
                        return true;
                    case "11": // Restrict IPv4, Restrict IPv6
                        params[prefix +":all-ipv4-routes:restrict"] = "t";
                        params[prefix +":all-ipv6-routes:restrict"] = "t";
                        return false;
                    case "12": // Accept IPv4, Restrict IPv6
                        params[prefix +":all-ipv4-routes:restrict"] = "";
                        params[prefix +":all-ipv6-routes:restrict"] = "t";
                        return true;
                    case "13": // Restrict IPv4, Accept IPv6
                        params[prefix +":all-ipv4-routes:restrict"] = "t";
                        params[prefix +":all-ipv6-routes:restrict"] = "";
                        return true;
                    default: // Restrict IPv4, Restrict IPv4
                        params[prefix +":all-ipv4-routes:restrict"] = "t";
                        params[prefix +":all-ipv6-routes:restrict"] = "t";
                        return false;
                }
            }
            ,listeners      : {
                change          : function(c) {
                    var ids =   ["IR_import_precedence_entry"
                                ,"IR_import_bgp_metric_set"
                                ,"IR_import_bgp_metric_global_set"];
                    var i, f;
                    for(i = 0; i < ids.length; i++) {
                        f = Ext.getCmp( ids[i] );
                        if (f && f.handleVisibleDisable) {
                            f.handleVisibleDisable();
                        }
                    }
                }
            }
        });


        /* Modifiers */
        var modifiers_text = isPolicy ? "Policy Default Modifiers" : "Route Modifiers";
        Arr.push({
            xtype           : "cp4_sectiontitle"
            ,titleText      : modifiers_text
            ,id             : "IR_import_modifiers_title"
            ,width          : (innerFormWidth - 35)
            ,margin         : "30 0 10 15"
            ,hidden         : (REC ? false : !isPolicy)
        });
        

        //getDBValueFunc for ranks, localpref, and weights
        function getDBValueFunc() {
            var c = this;
            if (c) {
                if (c.disabled) { return ""; }
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) { v = ""; }
                }
                return String(v);
            }
            return "";
        }
        //Rank, for rip/ospf
        if ( notBgp ) {
            Arr.push({
                xtype                   : "cp4_numberfield"
                ,fieldLabel             : "Rank"
                ,id                     : "IR_import_precedence_entry"
                ,value                  : (REC ? REC.data.precedence : "")
                ,emptyText              : "0-255"
                ,labelWidth             : LABELWIDTH
                ,width                  : (LABELWIDTH + 105)
                ,hidden                 : action_restrict
                ,disabled               : action_restrict
                ,margin                 : "0 0 5 15"
                ,allowBlank             : true
                ,allowDecimals          : false
                ,minValue               : 0
                ,maxValue               : 255
                ,maxLength              : 3
                ,enforceMaxLength       : true
                ,getDBValue             : getDBValueFunc
                ,handleVisibleDisable   : function() {
                    var c = this;
                    var p = Ext.getCmp("IR_import_proto_entry");
                    var r = Ext.getCmp("IR_import_restrict_entry");
                    var pVal = "rip";
                    var rVal = false; //accept
                    if (p && p.getProtoType) {
                        pVal = p.getProtoType();
                    }
                    if (r && r.getDBValue) {
                        rVal = r.getDBValue();
                    }
                    var vis = ((pVal == "ospf2ase") || (pVal == "rip") || (pVal == "ospf3ase"))
                               && (rVal == 5);
                    c.setVisible(vis);
                    c.setDisabled(!vis);
                    c.validate();
                    if (!vis) {
                        c.clearInvalid();
                    }
                }
                ,pushDBValue            : function(params, prefix) {
                    var p = Ext.getCmp("IR_import_proto_entry");
                    if (p && p.getProtoType && 
                        ((p.getProtoType() == "ospf2ase") || p.getProtoType() == "rip"
                          || p.getProtoType() == "ospf3ase")) {
                        var c = this;
                        var v = c.getDBValue();
                        params[prefix +":precedence"] = v;
                    }
                }
            });
        }

        var metric_width = 105;
        var localpref_width = 115;
        // Local Pref and Weight for BGP routes
        if (isBgp && !isPolicy) {
            rowArr2 = [];

            // Local Pref
            rowArr2.push({
                xtype                   : "cp4_numberfield"
                ,fieldLabel             : "Local Preference"
                ,id                     : "IR_import_localpref_entry"
                ,value                  : (REC ? REC.data.localpref : "")
                ,emptyText              : "0-4294967295"
                ,labelWidth             : LABELWIDTH
                ,width                  : (LABELWIDTH + localpref_width)
                ,hidden                 : false
                ,disabled               : action_restrict
                ,margin                 : "0 0 5 15"
                ,allowBlank             : true
                ,allowDecimals          : false
                ,minValue               : 0
                ,maxValue               : 4294967295
                ,maxLength              : 10
                ,enforceMaxLength       : true
                ,getDBValue             : getDBValueFunc
            });

            // Weight
            rowArr2.push({
                xtype                   : "cp4_numberfield"
                ,fieldLabel             : "Weight"
                ,id                     : "IR_import_preference_entry"
                ,value                  : (REC ? REC.data.preference : "")
                ,emptyText              : "0-65535"
                ,labelWidth             : LABELWIDTH
                ,width                  : (LABELWIDTH + metric_width)
                ,hidden                 : false
                ,disabled               : (action_restrict || hideBgp)
                ,margin                 : "0 0 5 95"
                ,allowBlank             : true
                ,allowDecimals          : false
                ,minValue               : 0
                ,maxValue               : 65535
                ,maxLength              : 5
                ,enforceMaxLength       : true
                ,getDBValue             : getDBValueFunc
            });

            Arr.push({
                xtype                   : "cp4_formpanel"
                ,id                     : "IR_import_bgp_metric_set"
                ,layout                 : "column"
                ,margin                 : 0
                ,padding                : 0
                ,width                  : (innerFormWidth - 35)
                ,hidden                 : (action_restrict || hideBgp)
                ,autoScroll             : false
                ,items                  : rowArr2
                ,handleVisibleDisable   : function() {
                    var c = this;
                    var p = Ext.getCmp("IR_import_proto_entry");
                    var r = Ext.getCmp("IR_import_restrict_entry");
                    var pVal = "rip";
                    var rVal = false; //accept
                    if (p && p.getProtoType) {
                        pVal = p.getProtoType();
                    }
                    if (r && r.getDBValue) {
                        rVal = r.getDBValue();
                    }
                    var vis = (pVal == "bgp") && !(rVal == 6 || rVal == 11);
                    c.setVisible(vis);
                    c.setChildDisabled(!vis);
                }
                ,setChildDisabled       : function(disable) {
                    var ids = ["IR_import_localpref_entry", "IR_import_preference_entry"];
                    var i, c;
                    for(i = 0; i < ids.length; i++) {
                        CP.IR.checkSetDisabled(ids[i], disable);
                    }
                }
                ,pushDBValue            : function(params, prefix) {
                    var l = Ext.getCmp("IR_import_localpref_entry");
                    var w = Ext.getCmp("IR_import_preference_entry");
                    var p = Ext.getCmp("IR_import_proto_entry");

                    if (p && p.getProtoType && p.getProtoType() == "bgp") {
                        var v = "";
                        if (l && l.getDBValue) {
                            v = l.getDBValue();
                        }
                        params[prefix +":localpref"] = v;

                        v = "";
                        if (w && w.getDBValue) {
                            v = w.getDBValue();
                        }
                        params[prefix +":preference"] = v;
                    }
                }
            });
        }

        //bgp - global defaults for policy only
        if ( isBgp && isPolicy) {
            rowArr3 = [{
                xtype                   : "cp4_numberfield"
                ,fieldLabel             : "Local Preference"
                ,id                     : "IR_import_global_localpref_entry"
                ,name                   : "IP_localpref"
                ,value                  : (REC ? REC.data.IP_localpref : "")
                ,originalValue          : (REC ? REC.data.IP_localpref : "")
                ,emptyText              : "0-4294967295"
                ,labelWidth             : LABELWIDTH
                ,width                  : (LABELWIDTH + localpref_width)
                ,disabled               : (REC ? false : hideBgp)
                ,margin                 : "0 0 5 15"
                ,allowBlank             : true
                ,allowDecimals          : false
                ,minValue               : 0
                ,maxValue               : 4294967295
                ,maxLength              : 10
                ,enforceMaxLength       : true
                ,getDBValue             : getDBValueFunc
            },{
                xtype                   : "cp4_numberfield"
                ,fieldLabel             : "Weight"
                ,id                     : "IR_import_global_weight_entry"
                ,name                   : "IP_preference"
                ,value                  : (REC ? REC.data.IP_preference : "")
                ,originalValue          : (REC ? REC.data.IP_preference : "")
                ,emptyText              : "0-65535"
                ,labelWidth             : LABELWIDTH
                ,width                  : (LABELWIDTH + metric_width)
                ,disabled               : (REC ? false : hideBgp)
                ,margin                 : "0 0 5 95"
                ,allowBlank             : true
                ,allowDecimals          : false
                ,minValue               : 0
                ,maxValue               : 65535
                ,maxLength              : 5
                ,enforceMaxLength       : true
                ,getDBValue             : getDBValueFunc
                ,listeners              : {
                    change                  : function(c, newVal) {
                        var df = Ext.getCmp("IR_import_preference_entry");
                        var v = String(c.getDBValue());
                        if (v == "") {
                            v = "None";
                        }
                        if (df && df.getXType() == "cp4_displayfield") {
                            df.setValue(v);
                        }
                    }
                }
            }];

            Arr.push({
                xtype                   : "cp4_formpanel"
                ,id                     : "IR_import_bgp_metric_global_set"
                ,layout                 : "column"
                ,margin                 : 0
                ,padding                : 0
                ,width                  : (innerFormWidth - 35)
                ,hidden                 : (REC ? false : hideBgp)
                ,autoScroll             : false
                ,items                  : rowArr3
                ,handleVisibleDisable   : function() {
                    var c = this;
                    var p = Ext.getCmp("IR_import_proto_entry");
                    var pVal = "rip";
                    if (p && p.getProtoType) {
                        pVal = p.getProtoType();
                    }
                    var vis = (pVal == "bgp");
                    var i,t;
                    c.setVisible(vis);
                    var form = Ext.getCmp("IR_import_comm_form");
                    if (form && form.setVisible) {
                        form.setVisible(vis);
                    }
                    c.setChildDisabled(!vis);
                    c.validate();
                }
                ,setChildDisabled       : function(disable) {
                    var ids = ["IR_import_global_localpref_entry"
                        ,"IR_import_global_weight_entry"];
                    var i, c;
                    for(i = 0; i < ids.length; i++) {
                        CP.IR.checkSetDisabled(ids[i], disable);
                    }
                }
                ,clearInvalid           : function() {
                    var ids = ["IR_import_global_localpref_entry", "IR_import_global_weight_entry"];
                    var i, c;
                    for(i = 0; i < ids.length; i++) {
                        c = Ext.getCmp(ids[i]);
                        if (c && c.clearInvalid) {
                            c.clearInvalid();
                        }
                    }
                }
                ,validate               : function() {
                    var ids = ["IR_import_global_localpref_entry", "IR_import_global_weight_entry"];
                    var i, c;
                    var valid = true;
                    for(i = 0; i < ids.length; i++) {
                        c = Ext.getCmp(ids[i]);
                        if (c) {
                            if (c.disabled) {
                                if (c.clearInvalid) { c.clearInvalid(); }
                            } else {
                                if (c.validate) { valid = c.validate() && valid; }
                            }
                        }
                    }
                    return valid;
                }
                ,pushDBValue            : function(params, prefix) {
                    var p = Ext.getCmp("IR_import_proto_entry");
                    if (p && p.getProtoType && p.getProtoType() == "bgp") {
                        var localpref_container = Ext.getCmp("IR_import_global_localpref_entry");
                        var weight_container = Ext.getCmp("IR_import_global_weight_entry");

                        if (localpref_container
                            && localpref_container.getDBValue) {
                            var localpref = localpref_container.getDBValue();
                            params[prefix +":localpref"] = localpref;
                        }

                        if (weight_container
                            && weight_container.getDBValue) {
                            var weight = weight_container.getDBValue();
                            params[prefix +":preference"] = weight;
                        }
                    }
                }
            });

            var import_st = Ext.getStore("IR_st_import");
            if (import_st && import_st.loadSubStore) {
                import_st.loadSubStore(REC);
            }
        }

        var import_form_height = 65 + (4 * 27);
        /*
        if (REC) {
            switch (REC.data.AF) {
                case "inet":
                case "inet6":
                    import_form_height += 27;
                    break;
                default:
            }
            if (String(REC.data.IPROTO).toLowerCase().indexOf("bgp") != -1) {
                import_form_height += (33 + 27); //default value title and fields
                if (CP.IR.COMMUNITIES_ENABLED) {
                    import_form_height += (33 + 35 + 100); //title, btnsbar, grid
                    import_form_height += 5; //extra 5 margin on bottom
                }
            }
        } else {
            switch (TYPE) {
                case "inet":
                case "inet6":
                    import_form_height += 27;
                    //break;
                default:
                    import_form_height += (33 + 27); //default value title and fields
                    if (CP.IR.COMMUNITIES_ENABLED) {
                        import_form_height += (33 + 35 + 100); //title, btnsbar, grid
                        import_form_height += 5; //extra 5 margin on bottom
                    }
            }
        }
        // */
        //Max height is: padding + 6*27 + 2*33 + 35 + 100
        //TODO figure out how to get the first window open to not cut off half the button bar
        //max height for ospf3:     (65) + (5*27);
        import_form_height = 65 + 6*27 + 2*33 + 35 + 100; //extra 20 is for specific routes to bgp

        if ( Ext.getCmp("IR_import_form") ) {
            Ext.getCmp("IR_import_form").destroy();
        }
        if ( Ext.getCmp("IR_import_window") ) {
            Ext.getCmp("IR_import_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "IR_import_window"
            ,title      : TITLE
            ,shadow     : false
            //,height     : (import_form_height + 34)
            ,extraClose : function() {
                CP.ar_util.clearParams();
                var delBtn = Ext.getCmp("IR_import_aspathopt_btn_delete");
                if (delBtn && delBtn.deleteArr) { delBtn.deleteArr = []; }
            }
            ,listeners  : {
                show        : function(win, eOpts) {
                    //TODO uncomment when working right
                    //var f = Ext.getCmp("IR_import_form");
                    //if (f) { f.setHeight(import_form_height); }
                    //win.setHeight(import_form_height + 34);
                    win.setPosition(225,100);
                }
                ,close      : function(win, eOpts) {
                    if (win && win.extraClose) {
                        win.extraClose();
                    }
                }
                ,destroy    : function(win, eOpts) {
                    if (win && win.extraClose) {
                        win.extraClose();
                    }
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "IR_import_form"
                ,width      : innerFormWidth
                ,height     : import_form_height
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : false
                ,items      : Arr
                ,listeners  : {
                    afterrender     : function(p, eOpts) {
                        CP.ar_util.clearParams();
                        //p.setHeight(import_form_height);
                        var ids =   ["IR_import_precedence_entry"
                                    ,"IR_import_bgp_metric_set"
                                    ,"IR_import_bgp_metric_global_set"];
                        var i, f;
                        for(i = 0; i < ids.length; i++) {
                            f = Ext.getCmp( ids[i] );
                            if (f && f.handleVisibleDisable) {
                                f.handleVisibleDisable();
                            }
                        }
                        p.form._boundItems = null;
                        if (p.chkBtns) { p.chkBtns(); }

                        if ( Ext.get("IR_import_proto_entry-bodyEl") ) {
                            Ext.get("IR_import_proto_entry-bodyEl").setStyle("overflow", "auto");
                        }
                    }
                    //community store is handled outside of this
                    ,validitychange : function() {
                        var p = Ext.getCmp("IR_import_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("IR_import_btn_save");
                    CP.ar_util.checkDisabledBtn("IR_import_btn_cancel");
                    CP.ar_util.checkBtnsbar("IR_import_aspathopt_btnsbar");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Save"
                        ,id                 : "IR_import_btn_save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            IR_import_save_handler();
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("IR_import_form");
                            return !(f);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Cancel"
                        ,id                 : "IR_import_btn_cancel"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ar_util.checkWindowClose("IR_import_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("IR_import_window") ) {
            Ext.getCmp("IR_import_window").show();
        }

        function IR_import_save_handler() {
            function pushDBValueNoReturn(cmpId, params, prefix) {
                var c = Ext.getCmp(cmpId);
                if (c && c.pushDBValue) {
                    c.pushDBValue(params, prefix);
                }
            }

            var params = CP.ar_util.clearParams();
            var prefix = CP.IR.getPrefix() +":import_proto";

            var i_prefix = "";
            var proto_cmp = Ext.getCmp("IR_import_proto_entry");
            if (proto_cmp && proto_cmp.pushDBValue) {
                i_prefix = proto_cmp.pushDBValue(params, prefix);
                if (!i_prefix) {
                    Ext.Msg.alert("bad i_prefix", "Import To push returned bad prefix");
                    return;
                }
            } else {
                Ext.Msg.alert("Component Error", "Import To Component didn't get accessed right");
                return;
            }

            var route_cmp = Ext.getCmp("IR_import_route_entry");
            var route_edit_cmp = Ext.getCmp("IR_import_route_network_entry");
            var policy = Ext.getCmp("IR_import_AF");
            var r_prefix = "";

            // Get route prefix, 3 cases
            if (route_cmp) {
                // Create new route
                r_prefix = route_cmp.pushDBValue(params, i_prefix); 
            } else if (route_edit_cmp) {
                // Edit route/policy
                r_prefix = route_edit_cmp.pushDBValue(params, i_prefix);
            } else if (policy) {
                // Create BGP Policy 

                var pfx = i_prefix + ":all-ipv4-routes";
                params[pfx] = "t";

                pfx = i_prefix + ":all-ipv6-routes";
                params[pfx] = "t";

                r_prefix = i_prefix;
            } else {
                Ext.Msg.alert("No route", "Unable to save configuration");
                return;
            }

            // Push various fields
            var i = 0;
            var cmp_ids =   ["IR_import_restrict_entry"
                            ,"IR_import_precedence_entry"
                            ,"IR_import_bgp_metric_set"
                            ,"IR_import_route_filter"];

            for (i = 0; i < cmp_ids.length; i++) {
                pushDBValueNoReturn(cmp_ids[i], params, r_prefix);
            }

            // BGP Policy Globals (default-localpref and default-weight)
            pushDBValueNoReturn("IR_import_bgp_metric_global_set", params, i_prefix);

            // Communities
            var com_st = Ext.getStore("IR_st_import_com");
            if (com_st && com_st.pushDBValue) {
                com_st.pushDBValue(params, i_prefix);
            }

            CP.IR.mySubmit();
        }
    }

//  add/edit community               ///////////////////////////////////////////
    ,open_com_window                : function(REC) {
        var TITLE = "Communities and AS Numbers to Match";

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
        Arr.push( CP.IR.generateFormRow("IR_com_row", "", [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Community"
            ,id                 : "IR_import_com_com_entry"
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
            ,id                 : "IR_import_com_as_entry"
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
        }]));

        if ( Ext.getCmp("IR_import_com_window") ) {
            Ext.getCmp("IR_import_com_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "IR_import_com_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "IR_import_com_form"
                ,width      : (15 + 2 *(15 + WIDTH) )
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
                        var p = Ext.getCmp("IR_import_com_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("IR_import_com_btn_save");
                    CP.ar_util.checkDisabledBtn("IR_import_com_btn_cancel");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Ok"
                        ,id                 : "IR_import_com_btn_save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            var delBtn = Ext.getCmp("IR_import_aspathopt_btn_delete");
                            var st = Ext.getStore("IR_st_import_com");
                            var c = Ext.getCmp("IR_import_com_com_entry").getValue();
                            var cO = Ext.getCmp("IR_import_com_com_entry").originalValue;
                            var a = Ext.getCmp("IR_import_com_as_entry").getValue();
                            var a_c = a * 100000 + c;
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
                                rec.data.as_com = a_c;
                            } else {
                                st.add({"com": c, "as": a, "new": true, "as_com": a_c});
                            }
                            var g = Ext.getCmp("IR_import_aspathopt_grid");
                            if (g) {
                                g.getView().refresh();
                            }
                            CP.ar_util.checkWindowClose("IR_import_com_window");
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("IR_import_com_form");
                            return !(f);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Cancel"
                        ,id                 : "IR_import_com_btn_cancel"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ar_util.checkWindowClose("IR_import_com_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("IR_import_com_window") ) {
            Ext.getCmp("IR_import_com_window").show();
        }
    }
}

