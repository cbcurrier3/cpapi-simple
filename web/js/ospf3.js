CP.ospf3 = {
    MAIN_GRID_HEIGHT            : 130
    ,GLOBAL_SETTINGS_LABELWIDTH : 200

//  interval defaults       notP2P      ,P2P
    ,helloIntv              : [10       ,30]
    ,deadIntv               : [40       ,120]
    ,retransmitIntv         : 5
    ,ospfCost               : 1
    ,electionPriority       : 1
    ,defaultString          : ""
    ,NoInterfaceOnBackboneAreaMsg   : "At least one interface must be configured on the Backbone Area (0.0.0.0) if more than one area is going to be used."
    ,router_id_editable     : false
    ,active_protocols_msg   : ""
    ,global_values          : null

    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("ospf3_global_btnsbar");
        CP.ar_util.checkBtnsbar("ospf3_interface_btnsbar");
        CP.ar_util.checkBtnsbar("ospf3_vlink_btnsbar");
        CP.ar_util.checkBtnsbar("ospf3_area_btnsbar");
        //btns in windows
        CP.ar_util.checkBtnsbar("intf_vlink_form");
        CP.ar_util.checkBtnsbar("ospf3_area_form");
        CP.ar_util.checkBtnsbar("ospf3_area_sub_form");
    }

    /*
     * Converts a user supplied area value into normalized form, which
     * can be stored in Gaia DB.  The display_mode value indicates what
     * display format the user prefers for this area, based on how they
     * expressed the area
     */
    ,normalize_area_name        : function(area_name) {
        area_name = String(area_name);
        var areaid = area_name;
        var mode = 0;
        var is_valid = true;

        if (area_name === "false" || area_name === false || area_name === "") {
            is_valid = false;
        } else if (String(area_name).toLowerCase() == "backbone") {
            areaid = "0.0.0.0";
        } else {
            if (area_name.indexOf(".") > 0) {
                // Dotted-quad format
                areaid = area_name;
                mode = 2;
            } else {
                // integer format
                var area_int = parseInt(area_name, 10);
                if (isNaN(area_int)) {
                    is_valid = false;
                } else if (area_int >= 0 && area_int <= 4294967295) {
                    var o1 = area_int >> 24;
                    var o2 = (area_int & 0x00FF0000) >> 16;
                    var o3 = (area_int & 0x0000FF00) >> 8;
                    var o4 = area_int & 0x000000FF;
                    areaid = "" + o1 + "." + o2 + "." + o3 + "." + o4;
                } else {
                    is_valid = false;
                }

                mode = 1;
            }
        }

        return {area_id : areaid, display_mode : mode, valid : is_valid};
    }

// INIT                     ////////////////////////////////////////////////////
    ,init                   : function() {
        CP.ospf3.defineStores( CP.ar_util.INSTANCE() );

        var Arr = [];
        Arr.push( CP.ar_one_liners.get_one_liner("ospf3") );
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "IPv6 OSPF Global Settings"
        });
        Arr.push( CP.ospf3.get_global_set() );
        Arr.push( CP.ospf3.interface_set() );
        //TODO - uncomment when allowing virtual links
        //Arr.push( CP.ospf3.vlink_set() );
        Arr.push( CP.ospf3.area_set() );

        var obj = {
            title           : "IPv6 OSPF"
            ,panel          : Ext.create("CP.WebUI4.DataFormPanel", {
                id              : "ospf3_configPanel"
                ,margin         : "0 24 0 24"
                ,listeners      : {
                    afterrender     : function(p, eOpts) {
                        p.form._boundItems = null;
                        CP.ospf3.doLoad();
                    }
                    ,validitychange : function(basic, valid, eOpts) {
                        CP.ospf3.check_user_action();
                    }
                }
                ,items      : Arr
            })
            ,submitURL      : "/cgi-bin/ospf3.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("ospf3_global_settings_window");
                CP.ar_util.checkWindowClose("intf_vlink_window");
                CP.ar_util.checkWindowClose("ospf3_area_window");
                CP.ar_util.loadListPop("mySubmit");
                CP.ospf3.doLoad();

                // Refresh the monitor tab with the new data
                if (CP && CP.ospf3_mon && CP.ospf3_mon.doLoad) {
                    CP.ospf3_mon.doLoad();
                }
            }
            ,submitFailure  : function() {
                CP.ar_util.loadListPop("mySubmit");
                CP.ospf3.doLoad();
            }
            ,checkCmpState  : CP.ospf3.check_user_action
            ,helpFile       : "ospf3.html"
            ,cluster_feature_name: "ospf3"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//bad configuration handlers
    ,find_bad_configuration : function() {
        var area_st = Ext.getStore("ospf3_st_area");
        var intf_st = Ext.getStore("ospf3_st_intf");
        var vlink_st = Ext.getStore("ospf3_st_vlink");
        var i;
        if (area_st && intf_st && vlink_st) {
            var i_r = intf_st.getRange();
            var v_r = vlink_st.getRange();
            for(i = 0; i < i_r.length; i++) {
                if (area_st.findExact("area_area", i_r[i].data.intf_area) == -1) {
                    return true;
                }
            }
            for(i = 0; i < v_r.length; i++) {
                if (intf_st.findExact("intf_area", v_r[i].data.vlink_transitarea) == -1
                    || area_st.findExact("area_area", v_r[i].data.vlink_transitarea) == -1) {
                        return true;
                }
            }
        }
        return false;
    }
    ,delete_bad_configurations  : function() {
        var area_st = Ext.getStore("ospf3_st_area");
        var intf_st = Ext.getStore("ospf3_st_intf");
        var vlink_st = Ext.getStore("ospf3_st_vlink");
        var i;
        var p_cnt = 0;
        var params = CP.ar_util.clearParams();
        var prefix = CP.ospf3.getPrefix() +":ospf3";
        var i_del = Ext.getCmp("ospf3_interface_btn_delete");
        var v_del = Ext.getCmp("ospf3_vlink_btn_delete");
        /*
         * if area store, interface store, and interface delete button exist
         * then find and delete orphaned interface entries
         */
        if (area_st && intf_st && i_del) {
            var i_r = intf_st.getRange();
            var v_r = vlink_st.getRange();
            for(i = 0; i < i_r.length; i++) {
                if (area_st.findExact("area_area", i_r[i].data.intf_area) == -1) {
                    i_del.deleteRecord(params, prefix, i_r[i], intf_st);
                    p_cnt++;
                }
            }
        }
        /*
         * if area store, interface store, vlink store, and vlink delete button exist
         * then find and delete orphaned vlink entries
         */
        if (area_st && intf_st && vlink_st && v_del) {
            for(i = 0; i < v_r.length; i++) {
                if (intf_st.findExact("intf_area", v_r[i].data.vlink_transitarea) == -1
                    || area_st.findExact("area_area", v_r[i].data.vlink_transitarea) == -1) {
                        v_del.deleteRecord(params, prefix, v_r[i], vlink_st);
                        p_cnt++;
                }
            }
        }
        if (p_cnt) {
            CP.ospf3.mySubmit();
        } else {
            CP.ar_util.clearParams();
        }
    }

//test-n-do functions
    ,testLoadStore          : function(storeId, d, c) {
        var st = Ext.getStore(storeId);
        if (st) {
            if (d && d[c]) {
                st.loadData( d[c] );
            } else {
                st.removeAll();
            }
        }
    }
    ,testSetValue           : function(cmpId, value) {
        var c = Ext.getCmp(cmpId);
        if (c && c.setValue) {
            c.setValue(value);
        }
    }
    ,testSetValueOriginal   : function(cmpId, value) {
        var c = Ext.getCmp(cmpId);
        if (c && c.setValue) {
            c.setValue(value);
            c.originalValue = value;
        }
    }
    ,testSetVisibleEnabled  : function(cmpId, vis) {
        var c = Ext.getCmp(cmpId);
        if (c) {
            if (c.setVisible)    { c.setVisible(vis); }
            if (c.setDisabled)   { c.setDisabled(!vis); }
            if (c.validate)      { c.validate(); }
        }
    }

// Define Stores
    ,defineStores           : function(INSTANCE) {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            //define stores
            var grids_to_refresh_list = ["ospf3_interface_grid"];
            CP.intf_state.defineStore( INSTANCE, grids_to_refresh_list );
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"isptp"
                ,"type"
                ,"addr6"
                ,"addr6_raw"
                ,"mask6"
                ,"addr6_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : INSTANCE
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "6in4 6to4 pppoe gre vpnt"
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
            ,isP2P      : function(intf) {
                var st = this;
                var rec = st.findRecord("intf", intf);
                var p = true;
                if (rec) {
                    p = rec.data.isptp ? true : false;
                }
                return p; //if intf is not in the store, treat it as p2p
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s) { CP.ar_util.loadListPop("intf_store"); }
                }
            }
            ,sorters    :   [{ property: "intf", direction: "ASC" }
                            ,{ property: "addr6", direction: "ASC" }]
        });

        function area_sortType(value) {
            var v = String(value);
            if ( v.indexOf(".") == -1 ) {
                return value;
            }
            var n = 0;
            var vList = v.split(".");
            var i;
            for(i = 0; i < vList.length; i++) {
                n = n * 256 + parseInt(vList[i], 10);
            }
            return n;
        }

        var areaFields = [
            {
                name        : "area_area"
                ,sortType   : area_sortType
            }
            ,{
                name        : "area_sortable"
                ,sortType   : area_sortType
            }
            ,"area_display"
            ,"area_stub"
            ,"area_stub_cost"
            ,"area_stub_nosummary"
            ,"area_stubList2"
            ,"area_networkList2"
        ];
        var area_netFields = [
            "addr"
            ,"addr_sortable"
            ,"masklen"
            ,"addrmask"
            ,"restrict"
            ,"new"
        ];
        var area_stubFields = [
            "addr"
            ,"addr_sortable"
            ,"masklen"
            ,"addrmask"
            ,"cost"
            ,"new"
        ];

        var transitFields = [{name: "area", sortType: area_sortType}];

        var intfFields = [
            "intf_intf"
            ,{ name: "intf_area", sortType: area_sortType }
            ,"isptp"
            ,"intf_area_sortable"
            ,"intf_cost"
            ,"intf_hellointerval"
            ,"intf_priority"
            ,"intf_retransmitinterval"
            ,"intf_routerdeadinterval"
            ,"intf_passive"
            ,"intf_virtual"
        ];
        var vlinkFields = [
            {
                name        : "vlink_remoterid"
                ,sortType   : area_sortType
            },{
                name        : "vlink_transitarea"
                ,sortType   : area_sortType
            }
            ,"vlink_area_sortable"
            ,"vlink_hellointerval"
            ,"vlink_retransmitinterval"
            ,"vlink_routerdeadinterval"
        ];

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_transit"
            ,autoLoad   : false
            ,data       : []
            ,fields     : transitFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "area", direction: "ASC" }]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_intf"
            ,autoLoad   : false
            ,data       : []
            ,fields     : intfFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "intf_intf", direction: "ASC" }
                            ,{ property: "intf_area", direction: "ASC" }]
            ,countNonBB : function(intf, area) {
                if (Ext.typeOf(intf) != "string" || Ext.typeOf(area) != "string" || intf == "" || area == "") {
                    intf = "";
                    area = "";
                }

                var st = this;
                var recs = st.getRange();
                var nonBackboneAreas = [];
                if (area != "") {
                    Ext.Array.include(nonBackboneAreas, String(area) );
                }
                var i;
                for(i = 0; i < recs.length; i++) {
                    if (intf != recs[i].data.intf_intf) {
                        if (recs[i].data.intf_area == "0.0.0.0") {
                            return 0; //found backbone
                        }
                        Ext.Array.include(nonBackboneAreas, String(recs[i].data.intf_area) );
                    }
                }
                if (Ext.Array.indexOf(nonBackboneAreas, "0.0.0.0") > -1) {
                    return 0;
                }
                return (nonBackboneAreas.length);
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_vlink"
            ,autoLoad   : false
            ,data       : []
            ,fields     : vlinkFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "vlink_remoterid", direction: "ASC" }
                            ,{ property: "vlink_transitarea", direction: "ASC" }]
        });

        // Area related Stores
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_area"
            ,autoLoad   : false
            ,data       : []
            ,fields     : areaFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "area_sortable", direction: "ASC" }
                            ,{ property: "area_stub", direction: "ASC" }]
            ,loadSubStores  : function(rec) {
                var d;
                if (rec && rec.data) {
                    d = rec.data;
                } else {
                    d = {
                        "area_stubList2"    : []
                        ,"area_networkList2": []
                    };
                }
                var net_st = Ext.getStore("ospf3_st_area_net");
                var stub_st = Ext.getStore("ospf3_st_area_stub");
                if (net_st)  { net_st.loadData(d.area_networkList2); }
                if (stub_st) { stub_st.loadData(d.area_stubList2); }
            }
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_area_net"
            ,autoLoad   : false
            ,data       : []
            ,fields     : area_netFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "addr_sortable", direction: "ASC" }]
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_st_area_stub"
            ,autoLoad   : false
            ,data       : []
            ,fields     : area_stubFields
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "addr_sortable", direction: "ASC" }]
        });
    }

// AJAX
    ,getPrefix                      : function() {
        var instance_string = CP.ar_util.INSTANCE();
        return String( "routed:instance:"+ instance_string );
    }
    ,mySubmit                       : function() {
        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
        if ( m ) {
            CP.ar_util.mySubmit();
        } else {
            Ext.Msg.alert("Invalid Fields Detected", "Changes cannot be pushed if there are invalid fields.");
        }
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        var instance_string = CP.ar_util.INSTANCE();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }

        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            CP.ar_util.loadListPush("intf_store");
            intf_st.load({params: {"instance": instance_string}});
        }

        var p = Ext.getCmp("ospf3_configPanel");
        if (!p) { return; }

        CP.ospf3.global_values = null;
        CP.ar_util.loadListPush("doLoad");

        p.load({
            url     : "/cgi-bin/ospf3.tcl"
            ,method : "GET"
            ,params : {
                "instance"  : instance_string
            }
            ,failure: function() { }
            ,success: function(p, action) {
                if (action && action.result && action.result.data) {
                    var gData = action.result.data;

                    CP.ospf3.global_values = gData;
                    CP.ospf3.testSetValueOriginal("ospf3_routerid", gData.global_routerid);
                    CP.ospf3.testLoadStore("ospf3_st_area", gData, "areaList");
                    CP.ospf3.testLoadStore("ospf3_st_intf", gData, "intfList");
                    CP.ospf3.testLoadStore("ospf3_st_transit", gData, "transitList");
                    CP.ospf3.testLoadStore("ospf3_st_vlink", gData, "vlinkList");

                    var intf_st = Ext.getStore("ospf3_st_intf");
                    if (intf_st && intf_st.countNonBB) {
                        var nonBB = intf_st.countNonBB("", "");
                        var msgCmp = Ext.getCmp("interface_area_msg");
                        if (msgCmp && msgCmp.setVisible) {
                            msgCmp.setVisible(nonBB > 1);
                        }
                    }

                    CP.ospf3.router_id_editable =
                        gData.global_router_id_editable ? true : false;

                    CP.ospf3.active_protocols_msg =
                        gData.global_active_protocols_msg ?
                                gData.global_active_protocols_msg : "";
                }
                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

    ,isP2P                  : function(intfName) {
        //returns an index
        //0 if not P2P, or 1 if it is
        //TODO - figure this out
        var isP2P = 0;
        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            var i_rec = intf_st.findRecord("intf", intfName, 0, false, true, true);
            if (i_rec) {
                if (Ext.typeOf(i_rec.data.isptp) == "string") {
                    switch(i_rec.data.isptp) {
                        case "":
                            return 0;
                        default:
                            return 1;
                    }
                }
                var t = i_rec.data.type;
                switch ( String(t).toLowerCase() ) {
                    //put most common types first
                    case "ethernet":
                    case "loopback":
                        break;
                    case "vpnt":
                    case "vpn":
                    case "pppoe":
                        isP2P = 1;
                        break;
                    default:
                }
            }
        }
        return isP2P;
    }

    ,generateFormRow        : function(rowId, marginStr, Items) {
        return {
            xtype       : "cp4_formpanel"
            ,id         : rowId
            ,layout     : "column"
            ,defaults   : {
                submitValue : false
            }
            ,margin     : (marginStr || 0)
            ,items      : Items
        };
    }

    ,get_global_set             : function() {
        var Arr = [];

        var LABELWIDTH = 125;
        var WIDTH = LABELWIDTH + 145;
        var hMargin = 30;
        var colMarginStyle = "margin-right:"+ String(hMargin) +"px;";

        Arr.push({
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Router ID"
                    ,id             : "ospf3_routerid"
                    ,labelWidth     : LABELWIDTH
                    ,width          : WIDTH
                    ,height             : 22
                });

        Arr.push( CP.ospf3.generateFormRow("spfDelay_spfHoldTime", 0, [
            {
               xtype               : "cp4_displayfield"
               ,fieldLabel         : "SPF Delay"
               ,id                 : "ospf3_spfdelay"
               ,name               : "global_spfdelay"
               ,labelWidth         : LABELWIDTH
               ,width              : WIDTH
               ,height             : 22
               ,valueToRaw         : function(value) {
                   if (!value || value.length == 0) {
                       return "2 seconds";
                   } else if (value == "1") {
                       return "1 second";
                   }

                   return value + " seconds";
               }
            }
            ,{
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "SPF Hold Time"
                ,id                 : "ospf3_spfholdtime"
                ,name               : "global_spfholdtime"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,height             : 22
                ,valueToRaw         : function(value) {
                    if (!value || value.length == 0) {
                        return "5 seconds";
                    } else if (value == "1") {
                        return "1 second";
                    }

                    return value + " seconds";
                }
            }
          ]));

        //Default ASE Route Cost, Default ASE Route Type
        Arr.push( CP.ospf3.generateFormRow("asedefaults_cost_type", 0, [
            {
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "Default ASE Route Cost"
                ,id                 : "ospf3_asedefaults_cost"
                ,name               : "global_asedefaults_cost"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,height             : 22
                ,valueToRaw         : function(value) {
                    if (!value || value.length == 0) {
                        return "1";
                    }

                    return value;
                }
            }
            ,{
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Default ASE Route Type"
                ,id                 : "ospf3_asedefaults_type"
                ,name               : "global_asedefaults_type"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,height             : 22
                ,valueToRaw         : function(value) {
                    if (!value || value.length == 0) {
                        return "1";
                    }

                    return value;
                }
            }
        ]));

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_global_btnsbar"
            ,items  : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Change Global Settings"
                    ,id                 : "ospf3_global_btn_edit"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.change_global_settings();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete Broken Configurations"
                    ,id                 : "ospf3_global_btn_cleanup"
                    ,disabled           : true
                    ,hidden             : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.delete_bad_configurations();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                    ,handle_no_token    : function() {
                        var b = this;
                        var d = CP.ar_util.checkBlockActivity(false);
                        var nobadconfig = !( CP.ospf3.find_bad_configuration() );
                        d = d || b.disabledConditions() || nobadconfig;
                        if (b && b.disabled != d) { b.setDisabled(d); }
                        if (b && b.hidden != nobadconfig) { b.setVisible(!nobadconfig); }
                        return (!d);
                    }
                }
            ]
        });

        return Arr;
    }

    ,get_edit_global_settings_fields      : function() {
        return {
            xtype       : "cp4_formpanel"
            ,margin     : "15 0 2 0"
            ,items      : [
                {
                    xtype           : "cp4_ipv4field_ex"
                    ,fieldLabel     : "Router ID"
                    ,id             : "ospf3_edit_routerid"
                    ,labelWidth     : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH
                    ,width          : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,entityName     : "Router ID"
                    ,submitValue    : false
                    ,rejectZero     : false
                    ,allowBlank     : true
                    ,fieldConfig    : {submitValue : false}
                    ,disabled       : !CP.ospf3.router_id_editable
                }
                ,{
                    xtype: 'cp4_inlinemsg'
                    ,text: 'The Router ID is used by both BGP and OSPF.'
                    ,width          : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,hidden         : !CP.ospf3.router_id_editable
                }
                ,{
                    xtype           : "cp4_inlinemsg"
                    ,type           : "warning"
                    ,width          : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,text           : CP.ospf3.active_protocols_msg
                    ,hidden          : CP.ospf3.router_id_editable
                }
                ,{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,padding    : 0
                    ,margin     : 0
                    ,items      : [
                        {
                            xtype       : "cp4_formpanel"
                            ,layout     : "column"
                            ,padding    : 0
                            ,margin     : "0 30 0 0"
                            ,width      : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,items      : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "SPF Delay (seconds)"
                                    ,id                 : "ospf3_edit_spfdelay"
                                    ,submitValue        : false
                                    ,emptyText          : "Default: 2"
                                    ,minValue           : 1
                                    ,maxValue           : 60
                                    ,maxLength          : 2
                                    ,enforceMaxLength   : true
                                    ,allowBlank         : true
                                    ,allowDecimals      : false
                                    ,margin             : "15 0 5 0"
                                    ,labelWidth         : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH
                                    ,width              : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                                    ,validator          : function(value) {
                                        var d = Ext.getCmp("ospf3_edit_spfdelay");
                                        var h = Ext.getCmp("ospf3_edit_spfholdtime");
                                        if (d && h) {
                                            var spfdelay    = d.getFuncValue();
                                            var spfholdtime = h.getFuncValue();
                                            if (spfdelay > spfholdtime) {
                                                return "SPF Delay must be less than SPF Hold Time";
                                            }
                                        }
                                        return true;
                                    }
                                    ,getFuncValue       : function() {
                                        var c = this;
                                        var v = c.getRawValue();
                                        if (v == "") {
                                            v = 2;
                                        } else {
                                            v = parseInt(v, 10);
                                            if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                                v = 2;
                                            }
                                        }
                                        return v;
                                    }
                                    ,getDBValue         : function() {
                                        var c = this;
                                        var v = c.getRawValue();
                                        if (v != "") {
                                            v = parseInt(v, 10);
                                            if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                                v = "";
                                            }
                                        }
                                        return v;
                                    }
                                    ,listeners          : {
                                        change              : function() {
                                            var ids = ["ospf3_edit_spfdelay", "ospf3_edit_spfholdtime"];
                                            var i, c;
                                            for(i = 0; i < ids.length; i++) {
                                                c = Ext.getCmp(ids[i]);
                                                if (c && c.validate) {
                                                    c.validate();
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,layout     : "column"
                            ,padding    : 0
                            ,margin     : 0
                            ,width      : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,items      : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "SPF Hold Time (seconds)"
                                    ,id                 : "ospf3_edit_spfholdtime"
                                    ,submitValue        : false
                                    ,emptyText          : "Default: 5"
                                    ,minValue           : 1
                                    ,maxValue           : 60
                                    ,maxLength          : 2
                                    ,enforceMaxLength   : true
                                    ,allowBlank         : true
                                    ,allowDecimals      : false
                                    ,labelWidth         : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH
                                    ,width              : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                                    ,validator          : function(value) {
                                        var d = Ext.getCmp("ospf3_edit_spfdelay");
                                        var h = Ext.getCmp("ospf3_edit_spfholdtime");
                                        if (d && h) {
                                            var spfdelay    = d.getFuncValue();
                                            var spfholdtime = h.getFuncValue();
                                            if (spfdelay > spfholdtime) {
                                                return "SPF Hold Time must be greater than SPF Delay";
                                            }
                                        }
                                        return true;
                                    }
                                    ,getFuncValue       : function() {
                                        var c = this;
                                        var v = c.getRawValue();
                                        if (v == "") {
                                            v = 5;
                                        } else {
                                            v = parseInt(v, 10);
                                            if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                                v = 5;
                                            }
                                        }
                                        return v;
                                    }
                                    ,getDBValue         : function() {
                                        var c = this;
                                        var v = c.getRawValue();
                                        if (v != "") {
                                            v = parseInt(v, 10);
                                            if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                                v = "";
                                            }
                                        }
                                        return v;
                                    }
                                    ,listeners          : {
                                        change              : function() {
                                            var ids = ["ospf3_edit_spfdelay", "ospf3_edit_spfholdtime"];
                                            var i, c;
                                            for(i = 0; i < ids.length; i++) {
                                                c = Ext.getCmp(ids[i]);
                                                if (c && c.validate) {
                                                    c.validate();
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
                ,{ //Default ASE Route Cost, Default ASE Route Type
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,padding    : 0
                    ,margin     : 0
                    ,items      : [
                        {
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Default ASE Route Cost"
                            ,id                 : "ospf3_edit_defaultaseroutecost"
                            ,labelWidth         : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH
                            ,width              : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,submitValue        : false
                            ,emptyText          : "Default: 1"
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 16777215
                            ,maxLength          : 8
                            ,enforceMaxLength   : true
                            ,getDBValue         : function() {
                                var c = this;
                                var v = c.getRawValue();
                                if (v != "") {
                                    v = parseInt(v, 10);
                                    if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                        v = "";
                                    }
                                }
                                return v;
                            }
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Default ASE Route Type"
                            ,id             : "ospf3_edit_defaultaseroutetype"
                            ,labelWidth     : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH
                            ,width          : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,submitValue    : false
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [[1 ,"Type 1"]
                                                ,[2 ,"Type 2"]]
                        }
                    ]
                }
            ]
        };
    }

    ,change_global_settings   : function() {
        function global_settings_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.ar_util.clearParams();

            function setOriginalValue(cmpId, value) {
                var cmp = Ext.getCmp(cmpId);
                if (cmp) {
                    cmp.setValue(value);
                    cmp.originalValue = cmp.getValue();
                }
            }

            if (CP.ospf3.global_values) {
                var gData = CP.ospf3.global_values;

                setOriginalValue("ospf3_edit_routerid", gData.global_routerid);
                setOriginalValue("ospf3_edit_spfdelay", gData.global_spfdelay);
                setOriginalValue("ospf3_edit_spfholdtime", gData.global_spfholdtime);
                setOriginalValue("ospf3_edit_defaultaseroutecost", gData.global_asedefaults_cost);

                var rt_field = Ext.getCmp("ospf3_edit_defaultaseroutetype");
                if (rt_field) {
                    var ase_rt_type = 1;
                    if (gData.global_asedefaults_type) {
                        ase_rt_type = gData.global_asedefaults_type;
                    }
                    rt_field.select(ase_rt_type);
                    rt_field.originalValue = rt_field.getValue();
                }
            }
        }

        function global_settings_save() {
            var params = CP.ar_util.clearParams();
            var prefix = CP.ospf3.getPrefix();
            var ospf3prefix = prefix +":ospf3";

            var routerid                = Ext.getCmp("ospf3_edit_routerid");
            if (routerid.originalValue != routerid.getValue()) {
                params[prefix + ":routerid"]                    = routerid.getValue();
            }

            var spfdelay                = Ext.getCmp("ospf3_edit_spfdelay").getDBValue();
            var spfholdtime             = Ext.getCmp("ospf3_edit_spfholdtime").getDBValue();
            var defaultaseroutecost     = Ext.getCmp("ospf3_edit_defaultaseroutecost").getDBValue();
            var defaultaseroutetype     = (Ext.getCmp("ospf3_edit_defaultaseroutetype").getValue() == 2) ? 2 : "";

            params[ospf3prefix +":spfdelay"]              = spfdelay;
            params[ospf3prefix +":spfholdtime"]           = spfholdtime;
            params[ospf3prefix +":asedefaults:cost"]      = defaultaseroutecost;
            params[ospf3prefix +":asedefaults:type"]      = defaultaseroutetype;

            CP.ospf3.mySubmit();
            return true;
        }

        var global_settings_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_global_settings_form"
            ,autoScroll : false
            ,width      : CP.ospf3.GLOBAL_SETTINGS_LABELWIDTH + 150
            ,height     : 249
            ,listeners  : {
                afterrender     : global_settings_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("ospf3_global_settings_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("ospf3_global_settings_save_btn");
                CP.ar_util.checkDisabledBtn("ospf3_global_settings_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "ospf3_global_settings_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        return global_settings_save();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        var f = CP.ar_util.checkFormValid("ospf3_global_settings_form");
                        return !(m && f);
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            Ext.getCmp("ospf3_global_settings_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "ospf3_global_settings_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("ospf3_global_settings_window");
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            CP.ospf3.check_user_action();
                        }
                    }
                }
            ]
            ,items      : [
                {
                   xtype   : "cp4_formpanel"
                   ,margin : "0 0 0 15"
                   ,items  : [CP.ospf3.get_edit_global_settings_fields()]
                }
            ]
        };

        var global_settings_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ospf3_global_settings_window"
            ,title      : "Change Global Settings"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ global_settings_form ]
        });
        global_settings_window.show();
    }

// INTERFACES       ////////////////////////////////////////////////////////////
    ,interface_set          : function() {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Interfaces"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_interface_btnsbar"
            ,layout : "column"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ospf3_interface_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        if (Ext.getCmp("ospf3_area_grid").store.getCount() <= 0) {
                            Ext.Msg.alert("No Areas", "Please add an area first.");
                            return;
                        }

                        var sm = Ext.getCmp("ospf3_interface_grid").getSelectionModel();
                        sm.deselectAll();
                        CP.ospf3.open_interface_window(true, false);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ospf3_interface_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_interface_window(false, false);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ospf3_interface_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.ospf3.getPrefix() +":ospf3";
                        var intf_st = Ext.getStore("ospf3_st_intf");
                        var sm = Ext.getCmp("ospf3_interface_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs && recs.length > 0 && b.deleteRecord) {
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                b.deleteRecord(params, prefix, recs[i], intf_st);
                            }
                            CP.ospf3.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,suffixList     :   [":cost"                ,":hellointerval"
                                        ,":passive"             ,":priority"
                                        ,":retransmitinterval"  ,":routerdeadinterval"
                                        ,":virtual"]
                    ,deleteRecord   : function(params, prefix, rec, st) {
                        var intf = rec.data.intf_intf;
                        params[prefix +":interface:"+ intf +":area"] = "";

                        var area = rec.data.intf_area;
                        var areaprefix = prefix +":area:"+ area;
                        var areaintfprefix = areaprefix +":interface:"+ intf;
                        params[areaintfprefix] = "";

                        var l = this.suffixList;
                        var i;
                        for(i = 0; i < l.length; i++) {
                            params[areaintfprefix + l[i]] = "";
                        }
                        if (st) { st.remove(rec); }
                    }
                },{
                    xtype   : "cp4_inlinemsg"
                    ,id     : "interface_area_msg"
                    ,text   : CP.ospf3.NoInterfaceOnBackboneAreaMsg
                    ,type   : "warning"
                    ,hidden : true
                    ,width  : 400
                }
            ]
        });

        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "intf_intf"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    return CP.intf_state.renderer_output(
                        retValue
                        ,""
                        ,"left"
                        ,"black"
                        ,value
                        ,"ipv6"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                text            : "Area"
                ,dataIndex      : "intf_area"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.intf_area_display_name;
                    var color = "black";
                    var area_st = Ext.getStore("ospf3_st_area");
                    if ( area_st && (area_st.findExact("area_area", rec.data.intf_area) == -1) ) {
                        color = "red";
                        retValue += " (Undefined Area)";
                    }
                    return CP.ar_util.rendererSpecific(String(retValue), String(retValue), "left", color);
                }
            },{
                text            : "Hello Intv"
                ,dataIndex      : "intf_hellointerval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        var p2pIdx = CP.ospf3.isP2P(rec.data.intf_intf);
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.helloIntv[p2pIdx] );
                    }
                    return CP.ar_util.rendererSpecific( retValue + " seconds", "", "left", color);
                }
            },{
                text            : "Dead Intv"
                ,dataIndex      : "intf_routerdeadinterval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        var p2pIdx = CP.ospf3.isP2P(rec.data.intf_intf);
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.deadIntv[p2pIdx] );
                    }
                    return CP.ar_util.rendererSpecific( retValue + " seconds", "", "left", color);
                }
            },{
                text            : "Retransmit Intv"
                ,dataIndex      : "intf_retransmitinterval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.retransmitIntv );
                    }
                    return CP.ar_util.rendererSpecific( String( retValue + " seconds" ), "", "left", color);
                }
            },{
                text            : "OSPF Cost"
                ,dataIndex      : "intf_cost"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.ospfCost );
                    }
                    return CP.ar_util.rendererSpecific( retValue, "", "left", color);
                }
            },{
                text            : "Election Priority"
                ,dataIndex      : "intf_priority"
                ,width          : 112
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.electionPriority );
                    }
                    return CP.ar_util.rendererSpecific( retValue, "", "left", color);
                }
            },{
                text            : "Passive"
                ,dataIndex      : "intf_passive"
                ,width          : 68
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "Yes" : "No";
                    var tip = value ? "Passive" : "Not Passive";
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", "black");
                }
            },{
                text            : "Virtual Address"
                ,dataIndex      : "intf_virtual"
                ,width          : 108
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "Yes" : "No";
                    var tip = value ? "Virtual" : "Not Virtual";
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", "black");
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("ospf3_interface_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "ospf3_interface_grid"
                ,width              : 1000
                ,height             : CP.ospf3.MAIN_GRID_HEIGHT
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("ospf3_st_intf")
                ,columns            : grid_cm
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("ospf3_interface_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

// VIRTUAL LINKS    ////////////////////////////////////////////////////////////
    ,vlink_set              : function() {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Virtual Links"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_vlink_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ospf3_vlink_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ospf3_vlink_grid").getSelectionModel();
                        sm.deselectAll();
                        CP.ospf3.open_interface_window(true, true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var st = Ext.getStore("ospf3_st_transit");
                        if (st) {
                            return (st.getCount() < 1);
                        }
                        return true;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ospf3_vlink_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_interface_window(false, true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_vlink_grid");
                        if (g && g.getSelCount && g.getSelCount() != 1) {
                            return true;
                        }
                        var st = Ext.getStore("ospf3_st_transit");
                        if (st) {
                            return (st.getCount() < 1);
                        }
                        return true;
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ospf3_vlink_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.ospf3.getPrefix() +":ospf3";
                        var vlink_st = Ext.getStore("ospf3_st_vlink");
                        var sm = Ext.getCmp("ospf3_vlink_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs && recs.length > 0 && b.deleteRecord) {
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                b.deleteRecord(params, prefix, recs[i], vlink_st);
                            }
                            CP.ospf3.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_vlink_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,suffixList     :   [":hellointerval"
                                        ,":retransmitinterval"
                                        ,":routerdeadinterval"]
                    ,deleteRecord   : function(params, prefix, rec, st) {
                        var remoterid = rec.data.vlink_remoterid;
                        var transitarea = rec.data.vlink_transitarea;
                        var remoteprefix = prefix +":area:0.0.0.0:virtuallink:remoterid:"+ remoterid;
                        var transitprefix = remoteprefix +":transitarea:"+ transitarea;
                        params[transitprefix] = "";
                        var l = this.suffixList;
                        var i;
                        for(i = 0; i < l.length; i++) {
                            params[transitprefix + l[i] ] = "";
                        }
                        if (st) {
                            st.remove(rec);
                            if ( st.findExact("vlink_remoterid", remoterid, 0) == -1 ) {
                                params[remoteprefix] = "";
                            }
                        }
                    }
                }
            ]
        });

        var grid_cm = [
            {
                text            : "Remote Router"
                ,dataIndex      : "vlink_remoterid"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric( String(retValue) );
                }
            },{
                text            : "Transit Area"
                ,dataIndex      : "vlink_transitarea"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    var area_st = Ext.getStore("ospf3_st_area");
                    var intf_st = Ext.getStore("ospf3_st_intf");
                    if ( area_st && (area_st.findExact("area_area", rec.data.vlink_transitarea) == -1) ) {
                        color = "red";
                        retValue += " (Undefined Area)";
                    } else if ( intf_st && (intf_st.findExact("intf_area", rec.data.vlink_transitarea) ==-1) ) {
                        color = "red";
                        retValue += " (No Interface)";
                    }
                    return CP.ar_util.rendererSpecific(String(retValue), String(retValue), "left", color);
                }
            },{
                text            : "Hello Intv"
                ,dataIndex      : "vlink_hellointerval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.helloIntv[1] );
                    }
                    return CP.ar_util.rendererSpecific( retValue + " seconds", "", "left", color);
                }
            },{
                text            : "Dead Intv"
                ,dataIndex      : "vlink_routerdeadinterval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.deadIntv[1] );
                    }
                    return CP.ar_util.rendererSpecific( retValue + " seconds", "", "left", color);
                }
            },{
                text            : "Retransmit Intv"
                ,dataIndex      : "vlink_retransmitinterval"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var retValue = String(value);
                    if ( retValue == "" ) {
                        color = "grey";
                        retValue = CP.ospf3.defaultString + String( CP.ospf3.retransmitIntv );
                    }
                    return CP.ar_util.rendererSpecific( String( retValue + " seconds" ), "", "left", color);
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("ospf3_vlink_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "ospf3_vlink_grid"
                ,width              : 700
                ,height             : CP.ospf3.MAIN_GRID_HEIGHT
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("ospf3_st_vlink")
                ,columns            : grid_cm
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("ospf3_vlink_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

// Shared window for Interface and vLink        ////////////////////////////////
    ,open_interface_window  : function(newWin, vLink) {
        if ( !newWin ) { newWin = false; }
        if ( !vLink ) { vLink = false; }
        var Arr = [];

        var LABELWIDTH = 125;
        var WIDTH = LABELWIDTH + 145;
        var hMargin = 15;
        var colMarginStyle = "margin-left:"+ String(hMargin) +"px;";

        Arr.push({ xtype: "tbspacer", width: 15, height: 15, style: colMarginStyle });

        if (vLink) {

            Arr.push( CP.ospf3.generateFormRow("vlink_router_n_transit", 0, [{
                xtype           : "cp4_ipv4field"
                ,fieldLabel     : "Router"
                ,id             : "vlink_remoterid_entry"
                ,name           : "vlink_remoterid"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,submitValue    : false
                ,allowBlank     : false
                ,defaults       : { submitValue: false, allowBlank: false }
                ,fieldConfig    : { submitValue: false, allowBlank: false }
                ,octetsConfig   :   [{minValue: 0, maxValue: 255}
                                    ,{minValue: 0, maxValue: 255}
                                    ,{minValue: 0, maxValue: 255}
                                    ,{minValue: 0, maxValue: 255}]
                ,style          : colMarginStyle
            },{
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Transit Area"
                ,id             : "vlink_transitarea_entry"
                ,name           : "vlink_transitarea"
                ,emptyText      : "Select one"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,allowBlank     : false
                ,editable       : true
                ,forceSelection : true
                ,queryMode      : "local"
                ,triggerAction  : "all"
                ,store          : Ext.getStore("ospf3_st_transit")
                ,valueField     : "area"
                ,displayField   : "area"
                ,style          : colMarginStyle
            }] ) );

        } else {

            var interface_cmp = { };

            if (newWin) {
                interface_cmp = {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Interface"
                    ,id             : "intf_intf_entry"
                    //,name           : "intf_intf" //to prevent recursive load/change
                    ,emptyText      : "Select one"
                    ,labelWidth     : LABELWIDTH
                    ,width          : WIDTH
                    ,allowBlank     : false
                    ,editable       : true
                    ,forceSelection : true
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,store          : Ext.getStore("intf_store")
                    ,valueField     : "intf"
                    ,displayField   : "intf"
                    ,style          : colMarginStyle
                    ,listeners      : {
                        change          : function(c, newValue, oldValue, eOpts) {
                            var panel = Ext.getCmp("intf_vlink_form");
                            var rec = null;
                            var idx;
                            var cmp;
                            var ids = ["intf_hellointerval_entry"
                                      ,"intf_routerdeadinterval_entry"
                                      ,"intf_retransmitinterval_entry"
                                      ,"intf_cost_entry"
                                      ,"intf_passive_entry"
                                      ,"intf_virtual_entry"];
                            var ospf_if_st = Ext.getStore("ospf3_st_intf");
                            if (ospf_if_st) {
                                idx = ospf_if_st.findExact("intf_intf", newValue);
                                if (idx > -1) {
                                    rec = ospf_if_st.getAt(idx);
                                    if (rec && panel) {
                                        panel.loadRecord(rec);
                                    }
                                }
                            }
                            var area = Ext.getCmp("intf_area_entry");
                            var prio = Ext.getCmp("intf_priority_entry");
                            if (newValue.startsWith("loop")) {
                                if (Ext.typeOf(rec) == "null") {
                                    if (area) {
                                        area.setValue("0.0.0.0");
                                    }
                                    if (prio) {
                                        prio.setValue(1);
                                    }
                                }
                                if (prio) {
                                    prio.setDisabled(true);
                                }
                                ids.forEach(function(element) {
                                    cmp = Ext.getCmp(element);
                                    if (cmp) {
                                        cmp.setDisabled(true);
                                    }
                                });
                            }
                            else if (Ext.typeOf(rec) == "null") {
                                if (area) {
                                    area.setValue("0.0.0.0");
                                }
                                if (prio) {
                                    prio.setValue(1);
                                    prio.setDisabled(false);
                                }
                                ids.forEach(function(element) {
                                    cmp = Ext.getCmp(element);
                                    if (cmp) {
                                        cmp.setValue("");
                                        cmp.setDisabled(false);
                                    }
                                });
                            } else if (oldValue && oldValue.startsWith("loop")) {
                                if (prio) {
                                    prio.setDisabled(false);
                                }
                                ids.forEach(function(element) {
                                    cmp = Ext.getCmp(element);
                                    if (cmp) {
                                        cmp.setDisabled(false);
                                    }
                                });
                            }
                            if (area && area.validate) {
                                area.validate();
                            }
                        }
                    }
                };
            } else {
                interface_cmp = {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Interface"
                    ,id             : "intf_intf_entry"
                    //,name           : "intf_intf" //to prevent recursive load/change
                    ,labelWidth     : LABELWIDTH
                    ,width          : WIDTH
                    ,height         : 22
                    ,style          : colMarginStyle
                };
            }

            Arr.push( CP.ospf3.generateFormRow("intf_intf_n_area", 0, [interface_cmp,{
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Area"
                ,id             : "intf_area_entry"
                ,name           : "intf_area"
                ,emptyText      : "Select one"
                ,value          : "0.0.0.0"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,allowBlank     : false
                ,editable       : true
                ,forceSelection : true
                ,queryMode      : "local"
                ,triggerAction  : "all"
                ,store          : Ext.getStore("ospf3_st_area")
                ,valueField     : "area_area"
                ,displayField   : "area_display"
                ,style          : colMarginStyle
                ,validator      : function() {
                    var c = this;
                    var area = String( c.getValue() );
                    if (area == "") { return ""; }
                    var intf_st = Ext.getStore("ospf3_st_intf");
                    var intfCmp = Ext.getCmp("intf_intf_entry");
                    var intf = intfCmp ? intfCmp.getValue() : "";

                    var nonBB = ( (intf_st && intf_st.countNonBB) ? intf_st.countNonBB(intf, area) : 2 );
                    if (nonBB < 2) {
                        return true;
                    }
                    return CP.ospf3.NoInterfaceOnBackboneAreaMsg;
                }
            }] ) );
        }

        var name_prefix = vLink ? "vlink" : "intf";

        function hello_dead_validator(namePrefix) {
            //returns true if valid, false otherwise
            var h_cmp = Ext.getCmp(namePrefix +"_hellointerval_entry");
            var d_cmp = Ext.getCmp(namePrefix +"_routerdeadinterval_entry");
            var h = h_cmp.getDBValue(true);
            var d = d_cmp.getDBValue(true);
            return (d > h);
        }

        //Both have hello/dead interval and retransmit interval
        Arr.push( CP.ospf3.generateFormRow("hello_n_dead_intervals", 0, [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Hello Interval"
            ,id                 : name_prefix +"_hellointerval_entry"
            ,name               : name_prefix +"_hellointerval"
            ,namePrefix         : name_prefix
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,emptyText          : "Default: "+ (vLink ? "30" : "10 or 30")
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65534
            ,maxLength          : 5
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,getDBValue         : function(f) {
                //f is "return functional value"
                if (!f) { f = false; }
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    }
                }
                if (f) {
                    if (v == "") {
                        v = (c.namePrefix == "vlink" ? 30 : 10);
                    }
                    v = parseInt(v, 10);
                } else {
                    v = String(v);
                }
                return v;
            }
            ,validator          : function() {
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || c.maxValue < v) {
                        return "";
                    }
                }
                var valid = hello_dead_validator(c.namePrefix);
                if (!valid) {
                    return "Hello Interval must be less than Dead Interval.";
                }
                return true;
            }
            ,listeners          : {
                change              : function(c, newValue, oldValue, eOpts) {
                    if (c) {
                        var d = Ext.getCmp(c.namePrefix +"_routerdeadinterval_entry");
                        if (d && d.validate) {
                            d.validate();
                        }
                    }
                }
                ,blur               : function(c) { if (c && c.fireEvent) { c.fireEvent("change"); } }
            }
        },{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Dead Interval"
            ,id                 : name_prefix +"_routerdeadinterval_entry"
            ,name               : name_prefix +"_routerdeadinterval"
            ,namePrefix         : name_prefix
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,emptyText          : "Default: "+ (vLink ? "120" : "40 or 120")
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,getDBValue         : function(f) {
                //f is "return functional value"
                if (!f) { f = false; }
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    }
                }
                if (f) {
                    if (v == "") {
                        v = (c.namePrefix == "vlink" ? 120 : 40);
                    }
                    v = parseInt(v, 10);
                } else {
                    v = String(v);
                }
                return v;
            }
            ,validator          : function() {
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || c.maxValue < v) {
                        return "";
                    }
                }
                var valid = hello_dead_validator(c.namePrefix);
                if (!valid) {
                    return "Dead Interval must be greater than Hello Interval.";
                }
                return true;
            }
            ,listeners          : {
                change              : function(c, newValue, oldValue, eOpts) {
                    if (c) {
                        var h = Ext.getCmp(c.namePrefix +"_hellointerval_entry");
                        if (h && h.validate) {
                            h.validate();
                        }
                    }
                }
                ,blur               : function(c) { if (c && c.fireEvent) { c.fireEvent("change"); } }
            }
        }] ) );

        Arr.push({
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Retransmit Interval"
            ,id                 : name_prefix +"_retransmitinterval_entry"
            ,name               : name_prefix +"_retransmitinterval"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,emptyText          : "Default: 5"
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
        });

        if (!vLink) {

            //ospf cost and election priority
            Arr.push( CP.ospf3.generateFormRow("ospfcost_n_priority", 0, [{
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "OSPF Cost"
                ,id                 : "intf_cost_entry"
                ,name               : "intf_cost"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,emptyText          : "Default: 1"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 65535
                ,maxLength          : 5
                ,enforceMaxLength   : true
                ,style              : colMarginStyle
            },{
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Election Priority"
                ,id                 : "intf_priority_entry"
                ,name               : "intf_priority"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,value              : 1
                ,emptyText          : "Default: 1"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 255
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,style              : colMarginStyle
            }] ) );

            //passive and virtual address
            Arr.push( CP.ospf3.generateFormRow("", 0, [{
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Passive"
                ,id         : "intf_passive_entry"
                ,name       : "intf_passive"
                ,labelWidth : LABELWIDTH
                ,width      : WIDTH
                ,height     : 22
                ,style      : colMarginStyle
            },{
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Virtual Address"
                ,id         : "intf_virtual_entry"
                ,name       : "intf_virtual"
                ,labelWidth : LABELWIDTH
                ,width      : WIDTH
                ,height     : 22
                ,style      : colMarginStyle
            }] ) );

        }

        if ( Ext.getCmp("intf_vlink_window") ) {
            Ext.getCmp("intf_vlink_window").destroy();
        }
        var TITLE = "";
        if (vLink) {
            TITLE = newWin ? "Add Virtual Link" : "Edit Virtual Link";
        } else {
            TITLE = newWin ? "Add Interface" : "Edit Interface";
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "intf_vlink_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "intf_vlink_form"
                ,winType    : (vLink ? "vlink" : "intf")
                ,winEdit    : (newWin ? false : true)
                ,width      : ( parseInt(2 * (WIDTH + hMargin) + 25, 10) )
                ,height     : 205
                ,items      : Arr
                ,listeners  : {
                    afterrender     : function(p) {
                        p.form._boundItems = null;
                        CP.ar_util.clearParams();
                        var grid;
                        if (p.winType == "vlink") {
                            grid = Ext.getCmp("ospf3_vlink_grid");
                        } else {
                            grid = Ext.getCmp("ospf3_interface_grid");
                        }
                        if (grid) {
                            var sm = grid.getSelectionModel();
                            if (sm.getCount() == 1) {
                                var rec = sm.getLastSelected();
                                if (rec) {
                                    p.oldRec = rec;
                                    p.loadRecord(rec);
                                    if (p.winType == "vlink") {
                                        var routerid = Ext.getCmp("vlink_remoterid_entry");
                                        if (routerid) {
                                            routerid.setValue(rec.data.vlink_remoterid);
                                        }
                                    } else {
                                        var cmp;
                                        var ids = ["intf_hellointerval_entry"
                                                  ,"intf_routerdeadinterval_entry"
                                                  ,"intf_retransmitinterval_entry"
                                                  ,"intf_cost_entry"
                                                  ,"intf_passive_entry"
                                                  ,"intf_virtual_entry"
                                                  ,"intf_priority_entry"];
                                        var intf_intf = Ext.getCmp("intf_intf_entry");
                                        if (intf_intf) {
                                            intf_intf.setValue(rec.data.intf_intf);
                                            if (rec.data.intf_intf.startsWith("loop")) {
                                                ids.forEach(function(element) {
                                                    cmp = Ext.getCmp(element);
                                                    if (cmp) {
                                                        cmp.setDisabled(true);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    p.oldRec = false;
                                }
                            }
                        }
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        var p = Ext.getCmp("intf_vlink_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("intf_vlink_form_btn_save");
                    CP.ar_util.checkDisabledBtn("intf_vlink_form_btn_cancel");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,id                 : "intf_vlink_form_btn_save"
                        ,text               : "Save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            var f = Ext.getCmp("intf_vlink_form");
                            if (f && f.winType) {
                                switch (f.winType) {
                                    case "vlink":
                                        vlink_save_handler(f.oldRec);
                                        break;
                                    case "intf":
                                        intf_save_handler(f.oldRec);
                                        break;
                                    default:
                                }
                            }
                        }
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                            var f = CP.ar_util.checkFormValid("intf_vlink_form");
                            return !(m && f);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,id                 : "intf_vlink_form_btn_cancel"
                        ,text               : "Cancel"
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ar_util.clearParams();
                            CP.ar_util.checkWindowClose("intf_vlink_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("intf_vlink_window") ) {
            Ext.getCmp("intf_vlink_window").show();
        }

        function checkGetFixValue(cmpId) {
            var c = Ext.getCmp(cmpId);
            var v = "";
            var v2 = "";
            if (c) {
                v = c.getRawValue();
                if (v != "") {
                    v2 = parseInt(v, 10);
                    if (isNaN(v2) || v2 < c.minValue || v2 > c.maxValue) {
                        v2 = "";
                    }
                }
            }
            return v2;
        }

        function intf_save_handler(oldRec) {
            var st = Ext.getStore("ospf3_st_intf");
            if (!st) { return; }
            var params = CP.ar_util.clearParams();
            var prefix = CP.ospf3.getPrefix() +":ospf3";

            var intf = Ext.getCmp("intf_intf_entry").getValue();
            var area = Ext.getCmp("intf_area_entry").getValue();

            var b = Ext.getCmp("ospf3_interface_btn_delete");
            if (oldRec && b && b.deleteRecord) {
                if (oldRec.data.intf_intf != intf || oldRec.data.intf_area != area) {
                    // different interface or area, so clear the old one
                    b.deleteRecord(params, prefix, oldRec);
                }
            }

            params[prefix +":interface:"+ intf +":area"]    = area;
            params[prefix +":area:"+ area]                  = "t"; //ensure area is set (marginal case for 0.0.0.0 - backbone)
            var iprefix = prefix +":area:"+ area + ":interface:"+ intf;
            var fList = ["cost"
                        ,"priority"
                        ,"hellointerval"
                        ,"retransmitinterval"
                        ,"routerdeadinterval"];
            var i, fixedValue;
            for(i = 0; i < fList.length; i++) {
                fixedValue = checkGetFixValue("intf_"+ fList[i] +"_entry");
                if (fList[i] == "priority" && fixedValue == "") {
                    fixedValue = 1;
                }
                params[iprefix +":"+ fList[i] ] = fixedValue;
            }
            var passive_cmp = Ext.getCmp("intf_passive_entry");
            params[iprefix +":passive"] = ( passive_cmp && passive_cmp.getValue() )? "t" : "";
            var virtual_cmp = Ext.getCmp("intf_virtual_entry");
            params[iprefix +":virtual"] = ( virtual_cmp && virtual_cmp.getValue() )? "t" : "";
            CP.ospf3.mySubmit();
        }

        function vlink_save_handler(oldRec) {
            var st = Ext.getStore("ospf3_st_vlink");
            if (!st) { return; }
            var params = CP.ar_util.clearParams();
            var prefix = CP.ospf3.getPrefix() +":ospf3";

            var rid = Ext.getCmp("vlink_remoterid_entry").getValue();
            var ta = Ext.getCmp("vlink_transitarea_entry").getValue();

            var b = Ext.getCmp("ospf3_vlink_btn_delete");
            if (oldRec && b && b.deleteRecord) {
                if (oldRec.data.vlink_remoterid != rid || oldRec.data.vlink_transitarea != ta) {
                    // different routerid or transitarea
                    b.deleteRecord(params, prefix, oldRec, st);
                }
            }

            var rprefix = prefix +":area:0.0.0.0:virtuallink:remoterid:"+ rid;
            var tprefix = rprefix +":transitarea:"+ ta;
            params[rprefix] = "t";
            params[tprefix] = "t";

            var fList = ["hellointerval"
                        ,"retransmitinterval"
                        ,"routerdeadinterval"];
            var i;
            for(i = 0; i < fList.length; i++) {
                params[tprefix +":"+ fList[i] ] = checkGetFixValue("vlink_"+ fList[i] +"_entry");
            }
            CP.ospf3.mySubmit();
        }
    }

// AREAS            ////////////////////////////////////////////////////////////
    ,area_set               : function() {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Areas"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_area_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ospf3_area_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ospf3_area_grid").getSelectionModel();
                        sm.deselectAll();
                        CP.ospf3.open_area_window(true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ospf3_area_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_area_window(false);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ospf3_area_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.ospf3.getPrefix() +":ospf3";
                        var area_st = Ext.getStore("ospf3_st_area");
                        var sm = Ext.getCmp("ospf3_area_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var intf_st = Ext.getStore("ospf3_st_intf");

                        if (recs && recs.length > 0 && b.deleteRecord) {
                            var i;
                            
                            for(i = 0; i < recs.length; i++) {
                                var if_index = intf_st.findExact("intf_area", 
                                        recs[i].data.area_area);
                                        
                                if (if_index !== -1) {
                                    var intf_rec = intf_st.getAt(if_index);

                                    Ext.Msg.alert("Delete Area",
                                        "Area " 
                                        + recs[i].data.area_display
                                        + " is still in use by interface " 
                                        + intf_rec.data.intf_intf 
                                        + ".");
                                    return;
                                }
                            }
                            
                            
                            
                            for(i = 0; i < recs.length; i++) {
                                b.deleteRecord(params, prefix, recs[i], area_st);
                            }
                            CP.ospf3.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,suffixList         :   [":stub"
                                            ,":display_mode"
                                            ,":stub:cost"
                                            ,":stub:nosummary"]
                    ,deleteRecord       : function(params, prefix, rec, st) {
                        var area = rec.data.area_area;
                        var areaprefix = prefix +":area:"+ area;
                        params[areaprefix] = "";

                        var l = this.suffixList;
                        var i;
                        for(i = 0; i < l.length; i++) {
                            params[areaprefix + l[i]] = "";
                        }
                        var a;
                        var addrprefix;
                        var maskprefix;
                        l = rec.data.area_networkList2;
                        for(i = 0; i < l.length; i++) {
                            a = CP.ip6convert.ip6_2_db( l[i].addr );
                            addrprefix = areaprefix +":networks:network:v6addr:"+ a;
                            maskprefix = addrprefix +":masklen:"+ l[i].masklen;
                            params[addrprefix] = "";
                            params[maskprefix] = "";
                            params[maskprefix +":restrict"] = "";
                        }
                        l = rec.data.area_stubList2;
                        for(i = 0; i < l.length; i++) {
                            a = CP.ip6convert.ip6_2_db( l[i].addr );
                            addrprefix = areaprefix +":stubnets:net:v6addr:"+ a;
                            maskprefix = addrprefix +":masklen:"+ l[i].masklen;
                            params[maskprefix] = "";
                            params[addrprefix] = "";
                            params[maskprefix +":cost"] = "";
                        }
                        if (st) { st.remove(rec); }
                    }
                }
            ]
        });

        var grid_cm = [
            {
                text            : "Area"
                ,dataIndex      : "area_sortable"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.area_display);
                    return CP.ar_util.rendererGeneric( String(retValue) );
                }
            },{
                text            : "Type"
                ,dataIndex      : "area_stub_cost"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var stubType = ( String(rec.data.area_stub) == "1" ) ? true : false;
                    var totallyStubby = ( String(rec.data.area_stub_nosummary) == "1" ) ? true : false;
                    var costForDefaultRoute = String(rec.data.area_stub_cost);

                    var retValue = "";
                    if (stubType) {
                        retValue = "Stub";
                        if (totallyStubby) {
                            retValue = "Totally Stubby";
                        }
                        if (costForDefaultRoute != "") {
                            retValue = retValue +" (Cost "+ costForDefaultRoute +")";
                        }
                    } else {
                        retValue = "Normal";
                    }
                    return CP.ar_util.rendererGeneric( String(retValue) );
                }
            },{
                text            : "Address Ranges"
                ,dataIndex      : "area_networkList2"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var l = rec.data.area_networkList2;
                    if (l.length < 1) {
                        retValue = "None";
                    } else {
                        var i = 0;
                        retValue += String( l[i].addrmask ).toUpperCase();
                        if ( l[i].restrict ) {
                            retValue += " (Restrict)";
                        }
                        for(i = 1; i < l.length; i++) {
                            retValue += "<br/>"+ String( l[i].addrmask ).toUpperCase();
                            if ( l[i].restrict ) {
                                retValue += " (Restrict)";
                            }
                        }
                    }
                    return CP.ar_util.rendererGeneric( String(retValue) );
                }
            },{
                text            : "Stub Networks"
                ,dataIndex      : "area_stubList2"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var l = rec.data.area_stubList2;
                    if (l.length < 1) {
                        retValue = "None";
                    } else {
                        var i = 0;
                        retValue += String( l[i].addrmask ).toUpperCase();
                        if ( String( l[i].cost ) != "" ) {
                            retValue += " (Cost "+ String( l[i].cost ) +")";
                        }
                        for(i = 1; i < l.length; i++) {
                            retValue += "<br/>"+ String( l[i].addrmask ).toUpperCase();
                            if ( String( l[i].cost ) != "" ) {
                                retValue += " (Cost "+ String( l[i].cost ) +")";
                            }
                        }
                    }
                    return CP.ar_util.rendererGeneric( String(retValue) );
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("ospf3_area_btnsbar");
                }
            }
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "ospf3_area_grid"
                ,width              : 700
                ,height             : CP.ospf3.MAIN_GRID_HEIGHT
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("ospf3_st_area")
                ,columns            : grid_cm
                ,selModel           : grid_sm
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("ospf3_area_btn_edit");
                        if (b) { b.handler(b); }
                    }
                }
            }]
        });

        return Arr;
    }

    ,open_area_window       : function(newWin) {
        if ( !newWin ) { newWin = false; }
        var Arr = [];
        var LABELWIDTH = 125;
        var WIDTH = LABELWIDTH + 145;
        var hMargin = 15;
        var colMarginStyle = "margin-left:"+ String(hMargin) +"px;";
        var FORMWIDTH = (2 * WIDTH) + (2 * hMargin) + 25;

        Arr.push({ xtype   : "tbspacer", width  : 15, height : 15 });

        if ( newWin ) {

            var useIPStyleArea = true;
            Arr.push({
                xtype               : "cp4_textfield"
                ,fieldLabel         : "Area"
                ,id                 : "area_area_entry"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,allowBlank         : false
                ,maskRe             : /[0-9\.BACKBONEbackbone]/
                ,stripCharsRe       : /[^0-9\.BACKBONEbackbone]/
                ,maxLength          : 15
                ,enforceMaxLength   : true
                ,style              : colMarginStyle
                ,getAreaValue       : function() {
                    var c = this;
                    return CP.ospf3.normalize_area_name(c.getValue());
                }
                ,pushDBValue        : function(params, prefix) {
                    var c = this;
                    var normalized = c.getAreaValue();
                    if (normalized.valid === false) {
                        return false;
                    }
                    params[prefix +":area:"+ normalized.area_id] = "t";
                    params[prefix +":area:" + normalized.area_id +
                            ":display_mode"] = normalized.display_mode;

                    return true;
                }
                ,validator          : function(v) {
                    var textHint = "Area id can be \"backbone\", an integer" +
                            " (i.e. 0  - 4294967295), or IPv4 notation" +
                            " (e.g. 0.0.0.1).";

                    if (v == "") {
                        return textHint;
                    }

                    var v_i = 0;
                    var i, v_o;

                    var lwrStr = String(v).toLowerCase();
                    var stub_cmp = Ext.getCmp("area_stub_entry");
                    if (lwrStr === "backbone" || lwrStr === "0.0.0.0" 
                            || lwrStr === "0") {
                        /*
                         * This is the backbone area -- it cannot be a
                         * stub area, so disable related controls.
                         */
                        stub_cmp.setVisible(false);
                        CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", 
                                false);
                        return true;
                    } else {
                        stub_cmp.setVisible(true);
                        CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", 
                                stub_cmp.getValue() ? true : false);
                    }

                    if (/[BACKBONEbackbone]/.test(lwrStr)) {
                        return textHint;
                    }

                    if (String(v).indexOf(".") == -1) {
                        v_i = parseInt(v, 10);
                        if ( isNaN(v_i) ) {
                            return "Invalid value.";
                        }
                        if (v_i < 0) {
                            return "Minimum value is 0.";
                        }
                        if (4294967295 < v_i) {
                            return "Maximum value is 4294967295.";
                        }
                    } else {
                        var vList = String(v).split(".");
                        if (vList.length < 4) {
                            return "Missing octets.";
                        }
                        if (vList.length > 4) {
                            return "Too many octets.";
                        }
                        for(i = 0; i < vList.length; i++) {
                            v_o = parseInt(vList[i], 10);
                            if ( isNaN(v_o) ) {
                                return "Octet "+ String(i+1) +" is invalid.";
                            }
                            if (v_o < 0) {
                                return "Octet "+ String(i+1) +" has a minimum value of 0.";
                            }
                            if (255 < v_o) {
                                return "Octet "+ String(i+1) +" has a maximum value of 255.";
                            }
                            v_i = 256 * parseInt(v_i, 10) + v_o;
                        }
                    }
                    var area_st = Ext.getStore("ospf3_st_area");
                    if (area_st) {
                        var area_idx = area_st.findExact("area_sortable", v_i);
                        if (area_idx != -1) {
                            var a_rec = area_st.getAt(area_idx);
                            var area = String(a_rec.data.area_area);
                            return ("This area already exists as "+ area);
                        }
                        return true;
                    }
                    return "Store failure.";
                }
            });

        } else {

            Arr.push({
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Area"
                ,id             : "area_area_entry"
                ,name           : "area_area_unique"
                ,REALVALUE      : ""
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,height         : 22
                ,style          : colMarginStyle
                ,getAreaValue   : function() {
                    var c = this;
                    return CP.ospf3.normalize_area_name(c.getValue());
                }
                ,pushDBValue    : function(params, prefix) {
                    var c = this;
                    var normalized = c.getAreaValue();
                    if (normalized.valid === false) {
                        return false;
                    }
                    params[prefix +":area:"+ normalized.area_id] = "t";
                    params[prefix +":area:" + normalized.area_id +
                            ":display_mode"] = normalized.display_mode;
                    return true;
                }
            });

        }

        Arr.push({
            xtype               : "cp4_displayfield"
            ,fieldLabel         : "Area Type"
            ,id                 : "area_stub_df_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : (2 * WIDTH)
            ,height             : 22
            ,value              : "Normal"
            ,hidden             : true
            ,style              : colMarginStyle
        },{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Use Stub Area Type"
            ,id                 : "area_stub_entry"
            ,name               : "area_stub"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,style              : colMarginStyle
            ,handler            : function(c, checked) {
                var stub_cost = Ext.getCmp("area_stub_cost_entry");
                var stub_stub = Ext.getCmp("area_stub_nosummary_entry");
                if (stub_cost) {
                    stub_cost.setDisabled(!checked);
                    stub_cost.validate();
                }
                if (stub_stub) {
                    stub_stub.setDisabled(!checked);
                    stub_stub.validate();
                }
                CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", checked);
            }
            ,getDBValue         : function() {
                var c = this;
                return (c.getValue() ? "t" : "");
            }
            ,pushDBValue        : function(params, prefix) {
                var c = this;
                var stub_cost = Ext.getCmp("area_stub_cost_entry");
                var stub_stub = Ext.getCmp("area_stub_nosummary_entry");
                var s = c.getDBValue();
                var s_c = s ? stub_cost.getDBValue() : "";
                var s_n = s ? stub_stub.getDBValue() : "";

                params[prefix +":stub"]             = s;
                params[prefix +":stub:cost"]        = s_c;
                params[prefix +":stub:nosummary"]   = s_n;
            }
        });

        Arr.push( CP.ospf3.generateFormRow("ospf3_win_area_stubs", "", [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Cost For Default Route"
            ,id                 : "area_stub_cost_entry"
            ,name               : "area_stub_cost"
            ,width              : WIDTH
            ,labelWidth         : LABELWIDTH
            ,allowBlank         : true
            ,allowDecimals      : false
            ,emptyText          : "No default"
            ,minValue           : 1
            ,maxValue           : 16777215
            ,maxLength          : 8
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = this;
                var v = c.getRawValue();
                if (v != "") {
                    v = parseInt(v, 10);
                    if (v < c.minValue || v > c.maxValue) {
                        v = "";
                    }
                }
                return String(v);
            }
        },{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Totally Stubby"
            ,id                 : "area_stub_nosummary_entry"
            ,name               : "area_stub_nosummary"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = this;
                return (c.getValue() ? "t" : "");
            }
        }]) );

        Arr.push( CP.ospf3.generateFormRow("ospf3_area_sub_grids", "", [
            CP.ospf3.area_networks(WIDTH, "0 0 0 15"),
            CP.ospf3.area_stubnets(WIDTH, "0 0 0 15")
        ]) );

        if ( Ext.getCmp("ospf3_area_window") ) {
            Ext.getCmp("ospf3_area_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "ospf3_area_window"
            ,title      : (newWin ? "Add Area" : "Edit")
            ,shadow     : false
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "ospf3_area_form"
                ,width      : FORMWIDTH
                ,height     : 335
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : true
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("ospf3_area_form_btn_save");
                    CP.ar_util.checkDisabledBtn("ospf3_area_form_btn_cancel");
                    CP.ar_util.checkBtnsbar("ospf3_area_AR_btnsbar");
                    CP.ar_util.checkBtnsbar("ospf3_area_stub_btnsbar");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,id                 : "ospf3_area_form_btn_save"
                        ,text               : "Save"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            ospf3_area_save_handler();
                        }
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                            var f = CP.ar_util.checkFormValid("ospf3_area_form");
                            return !(m && f);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,id                 : "ospf3_area_form_btn_cancel"
                        ,text               : "Cancel"
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ar_util.clearParams();
                            CP.ar_util.checkWindowClose("ospf3_area_window");
                        }
                    }
                ]
                ,listeners  : {
                    afterrender : function(p, eOpts) {
                        p.form._boundItems = null;
                        CP.ar_util.clearParams();
                        if (p.chkBtns) { p.chkBtns(); }

                        var stub_cmp = Ext.getCmp("area_stub_entry");
                        var no_stub_cmp = Ext.getCmp("area_stub_df_entry");
                        var stub_cost_cmp = Ext.getCmp("area_stub_cost_entry");
                        var stub_stub_cmp = Ext.getCmp("area_stub_nosummary_entry");

                        var sm = Ext.getCmp("ospf3_area_grid").getSelectionModel();
                        var rec = false;
                        if (sm.getCount() == 1) {
                            rec = sm.getLastSelected();
                            p.loadRecord(rec);
                            var area = String(rec.data.area_area);
                            var area_d = String(rec.data.area_display);
                            var area_cmp = Ext.getCmp("area_area_entry");
                            if (area_cmp) {
                                area_cmp.setValue(area_d);
                                area_cmp.REALVALUE = area;
                            }
                            var title = "Edit Area "+ area_d;
                            var win = Ext.getCmp("ospf3_area_window");
                            if (win) { win.setTitle(title); }

                            var isBackbone = ( area == "0" || area == "0.0.0.0" );
                            var vlink_st = Ext.getStore("ospf3_st_vlink");
                            var inVlinkUse = vlink_st ? (vlink_st.findExact("vlink_transitarea", area) != -1) : false;
                            if (stub_cmp) {
                                if (isBackbone || inVlinkUse) {
                                    stub_cmp.setValue(false);
                                    stub_cmp.setVisible(false);
                                    stub_cmp.setDisabled(true);
                                    if (inVlinkUse) {
                                        no_stub_cmp.setValue("Normal (in use by a Virtual Link)");
                                    } else {
                                        no_stub_cmp.setValue("Normal");
                                    }
                                    no_stub_cmp.setVisible(true);
                                    CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", false);
                                } else {
                                    stub_cmp.setValue( rec.data.area_stub );
                                    stub_cmp.setVisible(true);
                                    stub_cmp.setDisabled(false);
                                    no_stub_cmp.setVisible(false);
                                    CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", rec.data.area_stub);
                                }
                            }
                        } else {
                            if (stub_cmp) { stub_cmp.setValue(false); }
                            CP.ospf3.testSetVisibleEnabled("ospf3_win_area_stubs", false);
                        }
                        var area_st = Ext.getStore("ospf3_st_area");
                        if (area_st && area_st.loadSubStores) {
                            area_st.loadSubStores(rec);
                        }

                        var AR_btn_delete = Ext.getCmp("ospf3_area_AR_btn_delete");
                        var stub_btn_delete = Ext.getCmp("ospf3_area_stub_btn_delete");
                        if (AR_btn_delete) { AR_btn_delete.deleteArr = []; }
                        if (stub_btn_delete) { stub_btn_delete.deleteArr = []; }
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        p = Ext.getCmp("ospf3_area_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,items      : Arr
            }]
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
        });
        if ( Ext.getCmp("ospf3_area_window") ) {
            Ext.getCmp("ospf3_area_window").show();
        }

        function ospf3_area_save_handler() {
            var params = CP.ar_util.clearParams();
            var prefix = CP.ospf3.getPrefix() +":ospf3";

            var area_cmp = Ext.getCmp("area_area_entry");
            var normalized = area_cmp.getAreaValue();
            if (normalized.valid === false) {
                Ext.Msg.alert("Invalid Area", "The area name is not valid.");
                return;
            }

            if (!area_cmp.pushDBValue(params, prefix)) {
                return;
            }

            var area = normalized.area_id;

            var areaprefix = prefix +":area:"+ String(area);
            
            if (area !== "0.0.0.0") {
                var stub_cmp = Ext.getCmp("area_stub_entry");
                if (stub_cmp) {
                    stub_cmp.pushDBValue(params, areaprefix);
                }
            }

            var AR_btn_delete = Ext.getCmp("ospf3_area_AR_btn_delete");
            var stub_btn_delete = Ext.getCmp("ospf3_area_stub_btn_delete");
            if ( AR_btn_delete && AR_btn_delete.handleDelete ) {
                AR_btn_delete.handleDelete(params, areaprefix);
            }
            if ( stub_btn_delete && stub_btn_delete.handleDelete ) {
                stub_btn_delete.handleDelete(params, areaprefix);
            }

            var net_st = Ext.getStore("ospf3_st_area_net");
            var stub_st = Ext.getStore("ospf3_st_area_stub");
            var recs;
            var i, a, m, nprefix, mprefix;
            if (net_st) {
                recs = net_st.getRange();
                for(i = 0; i < recs.length; i++) {
                    a = CP.ip6convert.ip6_2_db( recs[i].data.addr );
                    m = recs[i].data.masklen;
                    nprefix = areaprefix +":networks:network:v6addr:"+ a;
                    mprefix = nprefix +":masklen:"+ m;
                    params[nprefix] = "";
                    params[mprefix] = "t";
                    params[mprefix +":restrict"] = (recs[i].data.restrict ? "t" : "");
                }
            }
            if (stub_st) {
                recs = stub_st.getRange();
                for(i = 0; i < recs.length; i++) {
                    a = CP.ip6convert.ip6_2_db( recs[i].data.addr );
                    m = recs[i].data.masklen;
                    nprefix = areaprefix +":stubnets:net:v6addr:"+ a;
                    mprefix = nprefix +":masklen:"+ m;
                    params[nprefix] = "";
                    params[mprefix] = "t";
                    params[mprefix +":cost"] = String(recs[i].data.cost);
                }
            }
            CP.ospf3.mySubmit();
        }
    }

    ,open_area_sub_window       : function(TYPE, newWin) {
        if (!TYPE || String(TYPE).toLowerCase() != "stub") { TYPE = "AR"; }
        if (!newWin) { newWin = false; }
        TYPE = String(TYPE).toLowerCase();

        var subArr = [];

        var LABELWIDTH = 100;
        var WIDTH = LABELWIDTH + 85;
        var hMargin = 15;
        var colMarginStyle = "margin-left:"+ String(hMargin) +"px;";

        subArr.push({ xtype: "tbspacer", width: 15, height: 15 });

        var ipv6_width = 280;
        var sep_width = 10;
        var mask_width = 50;
        var fc_width = parseInt( (LABELWIDTH + ipv6_width + sep_width + mask_width + 25), 10);

        subArr.push({
            xtype           : "cp4_fieldcontainer"
            ,fieldLabel     : "Address Range"
            ,id             : "ospf3_area_sub_addrmask_entry"
            ,name           : "addrmask"
            ,labelWidth     : LABELWIDTH
            ,width          : fc_width
            ,margin         : "0 0 5 15"
            ,items          : [
                {
                    xtype               : "cp4_ipv6field"
                    ,fieldLabel         : "Address Prefix"
                    ,hideLabel          : true
                    ,id                 : "ospf3_area_sub_addr_entry"
                    ,name               : "addr"
                    ,disabled           : !newWin
                    ,width              : ipv6_width
                    ,margin             : 0
                    ,allowBlank         : false
                    ,maxLength          : 39
                    ,enforceMaxLength   : true
                    ,msgTarget          : "none"
                    ,listeners          : {
                        change              : function() {
                            var m = Ext.getCmp("ospf3_area_sub_mask_entry");
                            if (m && m.validate) { m.validate(); }
                        }
                    }
                    ,validator          : function(v) {
                        var a = String(v);
                        if (a == "") { return true; }
                        var m = (Ext.getCmp("ospf3_area_sub_mask_entry") ? Ext.getCmp("ospf3_area_sub_mask_entry").getRawValue() : "");
                        var aLen = CP.ip6convert.get_v6masklength(a);
                        if (aLen < 1) {
                            return ("Address of "+ a +" is invalid.");
                        }
                        if (m == "") { return true; }
                        var mLen = parseInt(m, 10);
                        if (mLen < aLen) {
                            return "Prefix exceeds mask length.";
                        }
                        return true;
                    }
                },{
                    xtype               : "cp4_label"
                    ,text               : "/"
                    ,width              : sep_width
                    ,margin             : "5 0 0 0"
                    ,style              : "text-align:center;"
                },{
                    xtype               : "cp4_v6masklength"
                    ,fieldLabel         : "Masklen"
                    ,hideLabel          : true
                    ,id                 : "ospf3_area_sub_mask_entry"
                    ,name               : "masklen"
                    ,disabled           : !newWin
                    ,width              : mask_width
                    ,margin             : 0
                    ,allowBlank         : false
                    ,value              : 64
                    ,minValue           : 0
                    ,maxValue           : 128
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,msgTarget          : "none"
                    ,listeners          : {
                        change              : function() {
                            var a = Ext.getCmp("ospf3_area_sub_addr_entry");
                            if (a && a.validate) { a.validate(); }
                        }
                    }
                    ,validator          : function(v) {
                        var m = String(v);
                        if (m == "") { return true; }
                        var a = (Ext.getCmp("ospf3_area_sub_addr_entry") ? Ext.getCmp("ospf3_area_sub_addr_entry").getRawValue() : "");
                        var mLen = parseInt(m, 10);
                        if (a == "") { return true; }
                        var aLen = CP.ip6convert.get_v6masklength(a);
                        if (mLen < aLen) {
                            return "Insufficient mask length.";
                        }
                        return true;
                    }
                }
            ]
            ,getValueObj    : function() {

                var ip6_cmp = Ext.getCmp("ospf3_area_sub_addr_entry");
                var mask_cmp = Ext.getCmp("ospf3_area_sub_mask_entry");
                if (!ip6_cmp || !mask_cmp) {
                    return false;
                }

                var addr_ip6 = ip6_cmp.getRawValue();
                var masklen = mask_cmp.getRawValue();
                if (addr_ip6 == "" || masklen == "") {
                    return false;
                }

                var addr_db = CP.ip6convert.ip6_2_db( addr_ip6 );
                var mask_padded = "000"+ String(masklen);
                mask_padded = mask_padded.slice(mask_padded.length - 3);
                var addr_sortable = String(addr_db) +"_"+ String(mask_padded);

                var obj = {
                    "addr"              : addr_ip6
                    ,"addr_sortable"    : addr_sortable
                    ,"masklen"          : parseInt(masklen, 10)
                    ,"addrmask"         : String(addr_ip6) +"/"+ String(masklen)
                };
                return obj;
            }
        });

        if (TYPE == "stub") {
            subArr.push({
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Cost"
                ,id                 : "ospf3_area_sub_rider_entry"
                ,name               : "cost"
                ,labelWidth         : LABELWIDTH
                ,width              : WIDTH
                ,emptyText          : "Default: 1"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 65535
                ,maxLength          : 5
                ,enforceMaxLength   : true
                ,margin             : "0 0 0 15"
                ,getDBValue         : function() {
                    var c = this;
                    var v = c.getRawValue();
                    if (String(v) != "") {
                        v = parseInt(v, 10);
                        if (v < c.minValue || v > c.maxValue) {
                            v = "";
                        }
                    }
                    return String(v);
                }
            });
        } else {
            subArr.push({
                xtype           : "cp4_checkbox"
                ,fieldLabel     : "Restrict"
                ,id             : "ospf3_area_sub_rider_entry"
                ,name           : "restrict"
                ,labelWidth     : LABELWIDTH
                ,width          : WIDTH
                ,height         : 22
                ,margin         : "0 0 0 15"
                ,getDBValue     : function() {
                    var c = this;
                    return c.getValue() ? 1 : "";
                }
            });
        }
        subArr.push({ xtype: "tbspacer", width: 15, height: 15 });

        if ( Ext.getCmp("ospf3_area_sub_window") ) {
            Ext.getCmp("ospf3_area_sub_window").destroy();
        }
        Ext.create("CP.WebUI4.ModalWin", {
            id          : "ospf3_area_sub_window"
            ,title      : (TYPE == "stub" ? "Add Stub Network" : "Add Address Range")
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "ospf3_area_sub_form"
                ,areaSubNew : newWin
                ,areaSubType: TYPE
                ,width      : (fc_width + 35)
                ,height     : 125
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : false
                ,items      : subArr
                ,listeners  : {
                    afterrender : function(p, eOpts) {
                        p.form._boundItems = null;
                        if (p.chkBtns) { p.chkBtns(); }
                        var rec = null;
                        if ( !(p.areaSubNew) ) {
                            var sm = null;
                            if ( String(p.areaSubType) == "stub" ) {
                                sm = Ext.getCmp("ospf3_area_stub_grid").getSelectionModel();
                            } else {
                                sm = Ext.getCmp("ospf3_area_AR_grid").getSelectionModel();
                            }
                            if (sm && sm.getCount() == 1) {
                                rec = sm.getLastSelected();
                                p.loadRecord(rec);
                            }
                        }
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                    ,validitychange : function() {
                        var p = Ext.getCmp("ospf3_area_sub_form");
                        if (p && p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("ospf3_area_sub_form_btn_save");
                    CP.ar_util.checkDisabledBtn("ospf3_area_sub_form_btn_cancel");
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,id                 : "ospf3_area_sub_form_btn_save"
                        ,text               : "Ok"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            var f = Ext.getCmp("ospf3_area_sub_form");
                            var TYPE = (f ? f.areaSubType : "AR");
                            ospf3_area_sub_save_handler(TYPE);
                        }
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                            var f = CP.ar_util.checkFormValid("ospf3_area_sub_form");
                            return !(m && f);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,id                 : "ospf3_area_sub_form_btn_cancel"
                        ,text               : "Cancel"
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ar_util.checkWindowClose("ospf3_area_sub_window");
                        }
                    }
                ]
            }]
        });
        if ( Ext.getCmp("ospf3_area_sub_window") ) {
            Ext.getCmp("ospf3_area_sub_window").show();
        }

        function ospf3_area_sub_save_handler(TYPE) {
            var st;
            var grid;
            var fieldname = "restrict";
            switch ( String(TYPE).toLowerCase() ) {
                case "stub":
                    st = Ext.getStore("ospf3_st_area_stub");
                    grid = Ext.getCmp("ospf3_area_stub_grid");
                    fieldname = "cost";
                    break;
                case "false":
                    return;
                default:
                    st = Ext.getStore("ospf3_st_area_net");
                    grid = Ext.getCmp("ospf3_area_AR_grid");
            }
            var addrmask_cmp = Ext.getCmp("ospf3_area_sub_addrmask_entry");
            if (!addrmask_cmp) { return; }
            var rider_cmp = Ext.getCmp("ospf3_area_sub_rider_entry");
            if (!rider_cmp) { return; }

            var addrmaskObj = addrmask_cmp.getValueObj();
            var addr            = addrmaskObj["addr"];
            var mask            = addrmaskObj["mask"];
            var addr_sortable   = addrmaskObj["addr_sortable"];
            var addrmask        = addrmaskObj["addrmask"];

            var value = rider_cmp.getDBValue();

            //fieldname, value, startIndex, anyMatch, caseSensitive, exactMatch
            var rec = st.findRecord("addr_sortable", addr_sortable, 0, false, false, true);
            if (rec) {
                rec.data[ fieldname ] = value;
            } else {
                var newRec = {
                    "addr"              : String(addrmaskObj.addr)
                    ,"addr_sortable"    : String(addrmaskObj.addr_sortable)
                    ,"masklen"          : String(addrmaskObj.masklen)
                    ,"addrmask"         : String(addrmaskObj.addrmask)
                    ,"new"              : true
                };
                newRec[fieldname] = String(value);
                st.add(newRec);
            }
            if (grid) { grid.getView().refresh(); }
            CP.ar_util.checkWindowClose("ospf3_area_sub_window");
        }
    }

    ,area_networks              : function(WIDTH, MARGIN) {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Address Ranges"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_area_AR_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ospf3_area_AR_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ospf3_area_AR_grid").getSelectionModel();
                        sm.deselectAll();
                        CP.ospf3.open_area_sub_window("AR", true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ospf3_area_AR_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_area_sub_window("AR", false);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_AR_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ospf3_area_AR_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ospf3_area_AR_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var st = Ext.getStore("ospf3_st_area_net");
                        var i;

                        for(i = 0; i < recs.length; i++) {
                            if ( !( recs[i].data["new"] ) ) {
                                b.deleteArr.push({
                                    "addr"      : recs[i].data.addr
                                    ,"masklen"  : recs[i].data.masklen
                                });
                            }
                            st.remove(recs[i]);
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_AR_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteArr          : []    // {addr: "addr_ip6", masklen: "masklen"}
                    ,handleDelete       : function(params, prefix) {
                        var st = Ext.getStore("ospf3_st_area_net");
                        var aprefix, mprefix;
                        var l = this.deleteArr;
                        var i, a, m;
                        for(i = 0; i < l.length; i++) {
                            a = CP.ip6convert.ip6_2_db( l[i].addr );
                            m = l[i].masklen;
                            aprefix = prefix +":networks:network:v6addr:"+ a;
                            mprefix = aprefix +":masklen:"+ m;
                            params[aprefix] = "";
                            params[mprefix] = "";
                            params[mprefix +":restrict"] = "";
                        }
                    }
                }
            ]
        });

        var grid_cm = [
            {
                text            : "Address Range"
                ,dataIndex      : "addr_sortable"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.addrmask).toUpperCase();
                    return CP.ar_util.rendererGeneric( retValue );
                }
            },{
                text            : "Restrict"
                ,dataIndex      : "restrict"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.restrict ? "Restrict" : "Accept";
                    return CP.ar_util.rendererGeneric( retValue );
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("ospf3_area_form");
                }
            }
        });

        Arr.push({
            xtype               : "cp4_grid"
            ,id                 : "ospf3_area_AR_grid"
            ,width              : WIDTH
            ,height             : 100
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("ospf3_st_area_net")
            ,columns            : grid_cm
            ,selModel           : grid_sm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("ospf3_area_AR_btn_edit");
                    if (b) { b.handler(b); }
                }
            }
        });

        return {
            xtype   : "cp4_formpanel"
            ,margin : MARGIN
            ,items  : Arr
        };
    }

    ,area_stubnets              : function(WIDTH, MARGIN) {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Stub Networks"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ospf3_area_stub_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ospf3_area_stub_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_area_sub_window("stub", true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ospf3_area_stub_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ospf3.open_area_sub_window("stub", false);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_stub_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ospf3_area_stub_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("ospf3_area_stub_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var st = Ext.getStore("ospf3_st_area_stub");
                        var i;

                        for(i = 0; i < recs.length; i++) {
                            if ( !( recs[i].data["new"] ) ) {
                                b.deleteArr.push({
                                    "addr"      : recs[i].data.addr
                                    ,"masklen"  : recs[i].data.masklen
                                });
                            }
                            st.remove(recs[i]);
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf3_configPanel");
                        if ( !m ) {
                            return true;
                        }
                        var g = Ext.getCmp("ospf3_area_stub_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteArr          : []    // {addr: "addr_ip6", masklen: "masklen"}
                    ,handleDelete       : function(params, prefix) {
                        var st = Ext.getStore("ospf3_st_area_stub");
                        var aprefix, mprefix;
                        var l = this.deleteArr;
                        var i, a, m;
                        for(i = 0; i < l.length; i++) {
                            a = CP.ip6convert.ip6_2_db( l[i].addr );
                            m = l[i].masklen;
                            aprefix = prefix +":stubnets:net:v6addr:"+ a;
                            mprefix = aprefix +":masklen:"+ m;
                            params[aprefix] = "";
                            params[mprefix] = "";
                            params[mprefix +":restrict"] = "";
                            params[mprefix +":cost"] = "";
                        }
                    }
                }
            ]
        });

        var grid_cm = [
            {
                text            : "Address Range"
                ,dataIndex      : "addr_sortable"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.addrmask).toUpperCase();
                    return CP.ar_util.rendererGeneric( retValue );
                }
            },{
                text            : "Cost"
                ,dataIndex      : "cost"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String( value );
                    var color = "";
                    if (retValue == "") {
                        color = "grey";
                        retValue = "Default: 1";
                    }
                    return CP.ar_util.rendererGeneric( retValue );
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("ospf3_area_form");
                }
            }
        });

        Arr.push({
            xtype               : "cp4_grid"
            ,id                 : "ospf3_area_stub_grid"
            ,width              : WIDTH
            ,height             : 100
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("ospf3_st_area_stub")
            ,columns            : grid_cm
            ,selModel           : grid_sm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("ospf3_area_stub_btn_edit");
                    if (b) { b.handler(b); }
                }
            }
        });

        return {
            xtype   : "cp4_formpanel"
            ,margin : (MARGIN || "0 0 0 15")
            ,items  : Arr
        };
    }
}

