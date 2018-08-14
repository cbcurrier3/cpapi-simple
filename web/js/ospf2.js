CP.ospf2_4 = {
    MAIN_GRID_HEIGHT            : 130
    ,GLOBAL_SETTINGS_LABELWIDTH : 200
    ,AREA_SUB_GRID_WIDTH        : 245
    ,AREA_SUB_GRID_HEIGHT       : 127
    ,NoInterfaceOnBackboneAreaMsg   : "At least one interface must be configured on the Backbone Area if more than one area is going to be used."
    ,router_id_editable         : false
    ,active_protocols_msg       : ""
    ,global_values              : null

//  user access control         ////////////////////////////////////////////////
    ,check_user_action          : function() {
        CP.ar_util.checkBtnsbar("ospf2_global_btnsbar");
        CP.ar_util.checkBtnsbar("area_btnsbar");
        CP.ar_util.checkBtnsbar("interface_btnsbar");
        CP.ar_util.checkBtnsbar("vlink_btnsbar");

        CP.ar_util.checkBtnsbar("area_form");
        CP.ar_util.checkBtnsbar("area_sub_form");

        CP.ar_util.checkBtnsbar("interface_form");
        CP.ar_util.checkBtnsbar("md5i_form");

        CP.ar_util.checkBtnsbar("vlink_form");
        CP.ar_util.checkBtnsbar("md5v_form");

        var graceperiod_cmp = Ext.getCmp("graceperiod_display");
        if (graceperiod_cmp && graceperiod_cmp.checkState) {
            graceperiod_cmp.checkState();
        }
    }

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

    ,get_edited_area_id : function () {
        var area_id = Ext.getCmp("area_id_aw").getRawValue();
        if (area_id == "") {
            // New record - derive the area id from the area name
            var area_name = Ext.getCmp("area_aw").getRawValue();
            var normalized = CP.ospf2_4.normalize_area_name(area_name);
            area_id = normalized.area_id;
        }

        return area_id;
    }

    ,init                       : function() {
        /*
        Ext.Loader.setConfig({enabled: true});
        Ext.Loader.setPath("Ext.ux", "./ux");
        Ext.require([
            "Ext.ux.CheckColumn"
        ]);
        // */

        CP.ospf2_4.defineStores();
        var ospf2_configPanel = CP.ospf2_4.configPanel();
        var obj = {
            title           : "OSPFv2"
            ,panel          : ospf2_configPanel
            ,submitURL      : "/cgi-bin/ospf2.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("global_settings_window");
                CP.ar_util.checkWindowClose("area_window");
                CP.ar_util.checkWindowClose("interface_window");
                CP.ar_util.checkWindowClose("vlink_window");
                CP.ospf2_4.doLoad();

                // Refresh the monitor tab with the new data
                if (CP && CP.ospf_monitor_4 && CP.ospf_monitor_4.doLoad) {
                    CP.ospf_monitor_4.doLoad();
                }
            }
            ,submitFailure  : function() {
                CP.ospf2_4.doLoad();
            }
            ,checkCmpState  : CP.ospf2_4.check_user_action
            ,helpFile       : "ospfHelp.html"
            ,cluster_feature_name: 'ospf'
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//bad configuration handlers
    ,find_bad_configuration         : function() {
        var area_st = Ext.getStore("ospf2_area_store");
        var intf_st = Ext.getStore("ospf2_intf_store");
        var vlink_st = Ext.getStore("vlink_store");
        var i;
        if (area_st && intf_st && vlink_st) {
            var i_r = intf_st.getRange();
            var v_r = vlink_st.getRange();
            for(i = 0; i < i_r.length; i++) {
                if (area_st.findExact("area_info_area_id", i_r[i].data.area) == -1) {
                    return true;
                }
            }
            for(i = 0; i < v_r.length; i++) {
                if (intf_st.findExact("area", v_r[i].data.transitarea) == -1
                    || area_st.findExact("area_info_area_id", v_r[i].data.transitarea) == -1) {
                        return true;
                }
            }
        }
        return false;
    }
    ,delete_bad_configurations      : function() {
        var area_st = Ext.getStore("ospf2_area_store");
        var intf_st = Ext.getStore("ospf2_intf_store");
        var vlink_st = Ext.getStore("vlink_store");
        var i;
        var p_cnt = 0;
        var params = CP.ar_util.clearParams();
        var i_del = Ext.getCmp("interface_delete_btn");
        var v_del = Ext.getCmp("vlink_delete_btn");
        if (area_st && intf_st && vlink_st) {
            var i_r = intf_st.getRange();
            var v_r = vlink_st.getRange();
            for(i = 0; i < v_r.length; i++) {
                if (intf_st.findExact("area", v_r[i].data.transitarea) == -1
                    || area_st.findExact("area_info_area_id", v_r[i].data.transitarea) == -1) {
                        v_del.deleteRecord(params, v_r[i]);
                        p_cnt++;
                        vlink_st.remove(v_r[i]);
                }
            }
            for(i = 0; i < i_r.length; i++) {
                if (area_st.findExact("area_info_area_id", i_r[i].data.area) == -1) {
                    i_del.deleteRecord(params, i_r[i]);
                    p_cnt++;
                    intf_st.remove(i_r[i]);
                }
            }
        }
        if (p_cnt) {
            CP.ar_util.mySubmit();
        } else {
            CP.ar_util.clearParams();
        }
    }

//common validations
    ,validate_address_vs_mask       : function(address, mask) {
        var octet = String(address).split(".",4);
        var aLength = 0;
        var i;
        for(i = 3; i > -1 && aLength == 0; i--) {
            if (       octet[i] & 0x01) {
                aLength = (8*i) + 8;
            } else if (octet[i] & 0x02) {
                aLength = (8*i) + 7;
            } else if (octet[i] & 0x04) {
                aLength = (8*i) + 6;
            } else if (octet[i] & 0x08) {
                aLength = (8*i) + 5;
            } else if (octet[i] & 0x10) {
                aLength = (8*i) + 4;
            } else if (octet[i] & 0x20) {
                aLength = (8*i) + 3;
            } else if (octet[i] & 0x40) {
                aLength = (8*i) + 2;
            } else if (octet[i] & 0x80) {
                aLength = (8*i) + 1;
            }
        }
        if (aLength > mask) {
            Ext.Msg.alert(
                "Warning: Insufficient Mask"
                ,"Address is not covered by the provided mask."
            );
            return false;
        }
        return true;
    }
    ,setCheckBox                    : function(cmpId, value) {
        var cmp = Ext.getCmp(cmpId);
        if (cmp && value) {
            cmp.setValue(true);
            cmp.originalValue = true;
            return;
        }
        cmp.setValue(false);
        cmp.originalValue = false;
    }

//defineStores
    ,defineStores               : function() {
        CP.ospf2_4.defineAreaStores();
        CP.ospf2_4.defineInterfaceStores();
        CP.ospf2_4.defineVirtualLinkStores();
    }

    ,sortType_area              : function(value) {
        if (String(value).indexOf(".") == -1) {
            return parseInt(value, 10);
        }
        var i;
        var v = 1;
        var o = String(value).split(".");
        for(i = 0; i < o.length; i++) {
            v = v * 256 + parseInt(o[i], 10);
        }
        return v;
    }

    ,defineAreaStores           : function() {
        //ospf2_configPanel - principle area store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf2_area_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "area_info_area_id"
                    ,sortType   : CP.ospf2_4.sortType_area
                }
                ,"area_info_display_name"
                ,"area_info_sortable"
                ,"area_info_area_type"
                ,"eafcostfordefaultroutestubarea"
                ,"eafimportsummaryroutesstubarea"
                ,"eafcostfordefaultroutenssa"
                ,"eafimportsummaryroutesnssa"
                ,"eafredistributionnssa"
                ,"eaftranslatorstabilityintervalnssa"
                ,"eaftranslatorrolenssa"
                ,"eafdefaultroutetypenssa"
                ,"area_info_address_range_list"
                ,"area_info_stub_list"
                ,"area_info_type7_list"
                ,"delete"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/ospf2.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "all_areas_info"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.all_areas_info_list"
                }
            }
            ,sorters    : [{
                property    : "area_info_area_id"
                ,direction  : "ASC"
            }]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    CP.ospf2_4.load_transitarea_store();
                    CP.ar_util.loadListPop("ospf2_area_store");
                    var i_g = Ext.getCmp("interface_grid");
                    if (i_g && i_g.refresh) { i_g.refresh(); }
                    var v_g = Ext.getCmp("vlink_grid");
                    if (v_g && v_g.refresh) { v_g.refresh(); }
                }
            }
        });

        //Area Window - Address Range store, old storeId: area-ar-store-id
        Ext.create("CP.WebUI4.Store", {
            storeId     : "area_addr_range_store"
            ,autoLoad   : false
            ,fields     : [
                "area_ar_prefixmask"
                ,"area_ar_prefix"
                ,"area_ar_mask"
                ,"area_ar_restrict"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s == false) {
                        st.removeAll();
                    }
                    CP.ar_util.loadListPop("area_addr_range_store");
                }
            }
        });

        //Area Window - Stub Networks, old storeId: area-stub-networks-store-id
        Ext.create("CP.WebUI4.Store", {
            storeId     : "area_stub_store"
            ,autoLoad   : false
            ,fields     : [
                "area_stub_networks_prefixmask"
                ,"area_stub_networks_prefix"
                ,"area_stub_networks_mask"
                ,"area_stub_networks_prefixcost"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s == false) {
                        st.removeAll();
                    }
                    CP.ar_util.loadListPop("area_stub_store");
                }
            }
        });
        //needs param   "option": "option_area_stub_networks_list"
        //needs param   "area"  : $AREA

        //Area Window - Type7 Address Range Store
        Ext.create("CP.WebUI4.Store", {
            storeId     : "area_type7_store"
            ,autoLoad   : false
            ,fields     : [
                "area7_ar_prefixmask"
                ,"area7_ar_prefix"
                ,"area7_ar_mask"
                ,"area7_ar_restrict"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s == false) {
                        st.removeAll();
                    }
                    CP.ar_util.loadListPop("area_type7_store");
                }
            }
        });
    }
    ,load_Area_Window_Stores    : function(rec) {
        function loadSubStore(stId, rec, idx) {
            var st = Ext.getStore( stId );
            if (st) {
                st.removeAll();
                if ( rec && rec.data && rec.data[idx] ) {
                    st.loadData( rec.data[idx] );
                }
            }
        }

        loadSubStore("area_addr_range_store",   rec, "area_info_address_range_list");
        loadSubStore("area_stub_store",         rec, "area_info_stub_list");
        loadSubStore("area_type7_store",        rec, "area_info_type7_list");
    }

    ,defineInterfaceStores      : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["interface_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        //intf-list
        var intf_list_st = Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(value) {
                        if (String(value).toLowerCase().search("lo") == 0) {
                            return "zz" + String(value);
                        }
                        return value;
                    }
                }
                ,"isptp"
                ,"addr4_list"
                ,"addr6_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
                    ,"excludeType"  : "6in4 6to4 pppoe"
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
                return p; //if intf is not in the store, it must be a virtual route
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop("intf_store");
                }
            }
        });

        //configured interfaces for ospf
        var interface_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf2_intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "interface"
                    ,sortType   : function(value) {
                        if (String(value).toLowerCase().search("lo") == 0) {
                            return "zz" + String(value);
                        }
                        return value;
                    }
                },{
                    name        : "area"
                    ,sortType   : CP.ospf2_4.sortType_area
                }
                ,"area_name"
                ,"isptp"
                ,"hellointerval"
                ,"hellointerval_eff"
                ,"deadinterval"
                ,"deadinterval_eff"
                ,"cost"
                ,"virtualaddress"
                ,"electionpriority"
                ,"rtxinterval"
                ,"rtxinterval_eff"
                ,"passive"
                ,"subtract_authlen"
                ,"authtype"
                ,"authtype_simple_password"
                ,"authtype_simple_password_existed"
                ,"md5_list"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/ospf2.tcl?option=intf_info&instance=" + CP.ar_util.INSTANCE()
                ,reader : {
                    type    : "json"
                    ,root   : "data.sroutes"
                }
            }
            ,countNonBB : function(intf, area) {
                //returns the count of (unique) nonBackbone areas
                //returns 0 if
                    //it finds an interface on backbone
                //return value of 0 or 1 are considered valid
                //if an area string is provided with an intf string
                    //it will pretend the entry for that intf (if any) uses that area

                if (Ext.typeOf(intf) != "string" || Ext.typeOf(area) != "string" || intf == "" || area == "") {
                    intf = "";
                    area = "";
                }

                if (area === "0.0.0.0") {
                    return 0;
                }

                var st = this;
                var recs = st.getRange();
                var nonBackboneAreas = [];
                if (area != "") {
                    Ext.Array.include(nonBackboneAreas, String(area) );
                }
                var i;
                for(i = 0; i < recs.length; i++) {
                    if (intf != recs[i].data["interface"]) {
                        if (recs[i].data.area === "0.0.0.0") {
                            return 0; //found backbone
                        }
                        Ext.Array.include(nonBackboneAreas, String(recs[i].data.area) );
                    }
                }
                if (Ext.Array.indexOf(nonBackboneAreas, "0.0.0.0") > -1) {
                    return 0;
                }
                return (nonBackboneAreas.length);
            }
            ,listeners  : {
                load        : function(intf_st, recs, success, op, eOpts) {
                    if (success) {
                        /*
                        var list_st = Ext.getStore("intf_store");
                        var i;
                        var index;
                        for(i = 0; i < recs.length; i++) {
                            index = list_st.findExact("intf",recs[i].data["interface"]);
                            if (index != -1) {
                                list_st.removeAt(index);
                            }
                        }
                        // */

                        CP.ar_util.loadListPop("ospf2_intf_store");
                        var msgCmp = Ext.getCmp("interface_area_msg");
                        if (intf_st.countNonBB) {
                            var nonBB = intf_st.countNonBB("", "");
                            if (msgCmp && msgCmp.setVisible) {
                                msgCmp.setVisible(nonBB > 1); //hide if 0 or 1
                            }
                        }
                        //handle transitarea store
                        CP.ospf2_4.load_transitarea_store();
                    }
                    var v_g = Ext.getCmp("vlink_grid");
                    if (v_g && v_g.refresh) { v_g.refresh(); }
                }
            }
        });

        //md5 list store
        var interface_md5_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "interface_md5_store"
            ,autoLoad   : false
            ,fields     : [
                "md5_key_id"    //key number
                ,"key"          //key "password"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });
    }
    ,load_Interface_Window_Stores   : function(rec) {
        if (rec == null) {
            Ext.getStore("interface_md5_store").removeAll();
            return;
        }
        Ext.getStore("interface_md5_store").loadData(rec.data.md5_list);
    }

    ,defineVirtualLinkStores    : function() {
        var vlink_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "vlink_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "remoterid"
                    ,sortType   : function(value) {
                        var octet = String(value).split(".");
                        var retVal = 0;
                        var i;
                        for(i = 0; i < octet.length; i++) {
                            retVal = parseInt(retVal,10) * 256 + parseInt(octet[i],10);
                        }

                        return parseInt(retVal,10);
                    }
                },{
                    name        : "transitarea"
                    ,sortType   : CP.ospf2_4.sortType_area
                }
                ,"transitarea_display_name"
                ,"vlinks_hellointerval"
                ,"vlinks_hellointerval_eff"
                ,"vlinks_deadinterval"
                ,"vlinks_deadinterval_eff"
                ,"vlinks_rtxinterval"
                ,"vlinks_rtxinterval_eff"
                ,"vlinks_authtype"
                ,"vlinks_authtype_simple_password"
                ,"vlinks_authtype_simple_password_existed"
                ,"vlinks_md5_list"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/ospf2.tcl?option=virtual-links&instance=" + CP.ar_util.INSTANCE()
                ,reader : {
                    type    : "json"
                    ,root   : "data.vlinkslist"
                }
            }
            ,sorters    :   [{property: "remoterid", direction: "ASC"}
                            ,{property: "transitarea", direction: "ASC"}]
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        var vlink_md5_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "vlink_md5_store"
            ,autoLoad   : false
            ,fields     : [
                "md5_key_id"    //key number
                ,"key"          //key "password"
                ,"newrec"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        var transitarea_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "transitarea_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "transitarea"
                    ,sortType   : function(value) {
                        switch( Ext.typeOf(value) ) {
                            case "number":
                                return value;
                            case "string":
                                break;
                            default:
                                return (2 * 4294967295);
                        }
                        var octet = String(value).split(".");
                        var retVal = 0;
                        var i;
                        for(i = 0; i < octet.length; i++) {
                            retVal = parseInt(retVal,10) * 256 + parseInt(octet[i],10);
                        }

                        return 4294967295 + parseInt(retVal,10);
                    }
                }
                ,"transitarea_display_name"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                clear       : function(st, eOpts) {
                    CP.ar_util.checkBtnsbar("vlink_btnsbar");
                }
                ,add        : function(st, recs, index, eOpts) {
                    CP.ar_util.checkBtnsbar("vlink_btnsbar");
                }
            }
        });
    }
    ,load_transitarea_store     : function() {
        var area_st = Ext.getStore("ospf2_area_store");
        var intf_st = Ext.getStore("ospf2_intf_store");
        var transitarea_st = Ext.getStore("transitarea_store");

        if (!transitarea_st) { return; }
        transitarea_st.removeAll();
        if (!area_st || !intf_st) { return; }
        if (area_st.getCount() < 1 || intf_st.getCount() < 1) { return; }

        var a_recs = area_st.getRange();
        var ad;
        var i;
        var a;
        var t;
        var display_name;
        for(i = 0; i < a_recs.length; i++) {
            ad = a_recs[i].data;
            a = ad.area_info_area_id;
            display_name = ad.area_info_display_name;
            t = ad.area_info_area_type.toLowerCase();
            if ( (a !== "0.0.0.0") && (t == "normal") ) {
                if (intf_st.findExact("area",a) != -1) {
                    transitarea_st.add({
                        "transitarea"   : a
                        ,"transitarea_display_name" : display_name
                    });
                }
            }
        }
    }
    ,load_Vlink_Window_Stores   : function(rec) {
        if (rec == null) {
            Ext.getStore("vlink_md5_store").removeAll();
            return;
        }
        Ext.getStore("vlink_md5_store").loadData(rec.data.vlinks_md5_list);
    }

//main DataFormPanel
    ,configPanel                : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "ospf2_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    CP.ospf2_4.doLoad(p);
                }
                ,validitychange : function() {
                    CP.ospf2_4.check_user_action();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("ospf"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Global Settings"
                }
                ,CP.ospf2_4.get_global_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                }
                ,CP.ospf2_4.get_interface_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Virtual Links"
                }
                ,CP.ospf2_4.get_virtual_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Areas"
                }
                ,CP.ospf2_4.get_area_set()
            ]
        });

        return configPanel;
    }

    ,doLoad                     : function(p) {
        CP.ar_util.clearParams();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }

        CP.ar_util.loadListPush("ospf2_area_store");
        Ext.getStore("ospf2_area_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ospf2_4.load_Area_Window_Stores(null);

        CP.ar_util.loadListPush("intf_store");
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ar_util.loadListPush("ospf2_intf_store");
        Ext.getStore("ospf2_intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});

        CP.ar_util.loadListPush("vlink_store");
        Ext.getStore("vlink_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        Ext.getStore("vlink_md5_store").removeAll();

        if (!p) {
            p = Ext.getCmp("ospf2_configPanel");
        }
        if (!p) {
            return;
        }

        CP.ospf2_4.global_values = null;
        CP.ar_util.loadListPush("doLoad");

        p.load({
            url         : "/cgi-bin/ospf2.tcl?instance=" + CP.ar_util.INSTANCE() + "&option=global"
            ,method     : "GET"
            ,failure    : function() {
                CP.ar_util.loadListPop("doLoad");
            }
            ,success    : function(p, action) {
                if (action && action.result && action.result.data) {
                    var gData                = action.result.data;
                    CP.ospf2_4.global_values = action.result.data;

                    //load global values
                    setDisplayValue("routerid_display"             ,gData.routerid);
                    setDisplayValue("rfc1583compatibility_display" ,gData.rfc1583compatibility);
                    setDisplayValue("spfdelay_display"             ,gData.spfdelay);
                    setDisplayValue("spfholdtime_display"          ,gData.spfholdtime);
                    setDisplayValue("defaultaseroutecost_display"  ,gData.defaultaseroutecost);
                    setDisplayValue("defaultaseroutetype_display"  ,gData.defaultaseroutetype);
                    setDisplayValue("gracefulrestart_display"      ,gData.gracefulrestart);
                    setDisplayValue("graceperiod_display"          ,gData.graceperiod);
                    setDisplayValue("gracefulrestarthlpr_display"  ,gData.gracefulrestarthlpr);

                    var grperiod = Ext.getCmp("graceperiod_display");
                    if (grperiod) {
                        grperiod.setVisible(gData.gracefulrestart == 1);
                    }

                    CP.ospf2_4.router_id_editable =
                            gData.router_id_editable ? true : false;

                    CP.ospf2_4.active_protocols_msg =
                            gData.active_protocols_msg ?
                                    gData.active_protocols_msg : "";
                }
                CP.ar_util.loadListPop("doLoad");
            }
        });
        CP.ar_util.loadListPop("mySubmit");

        function setDisplayValue(cmpId, value) {
            var cmp = Ext.getCmp(cmpId);
            if ( cmp ) {
                cmp.setValue(value);
            }
        }
    }

//STUB:GLOBAL SECTION
    ,get_global_set             : function() {
        return [
            {
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,padding    : 0
                ,margin     : 0
                ,items      : [
                    {
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Router ID"
                        ,id             : "routerid_display"
                        ,labelWidth     : 125
                        ,width          : 300
                        ,height             : 22
                        ,style          : "margin-right:30px;"
                    }
                    ,{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "RFC 1583 Compatibility"
                        ,id             : "rfc1583compatibility_display"
                        ,labelWidth     : 125
                        ,width          : 300
                        ,height         : 22
                        ,valueToRaw     : function(value) {
                            if (value && value == 1) {
                                return "on";
                            }

                            return "off";
                        }
                    }
                ]
            },{
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
                        ,width      : 300
                        ,items      : [
                            {
                                xtype               : "cp4_displayfield"
                                ,fieldLabel         : "SPF Delay"
                                ,id                 : "spfdelay_display"
                                ,labelWidth         : 125
                                ,width              : 125 + 100
                                ,height             : 22
                                ,style              : "margin-right:10px;"
                                ,valueToRaw         : function(value) {
                                    if (!value || value.length == 0) {
                                        return "2 seconds";
                                    } else if (value == "1") {
                                        return "1 second";
                                    }

                                    return value + " seconds";
                                }
                            }
                        ]
                    }
                    ,{
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,padding    : 0
                        ,margin     : 0
                        ,width      : 300
                        ,items      : [
                            {
                                xtype               : "cp4_displayfield"
                                ,fieldLabel         : "SPF Hold Time"
                                ,id                 : "spfholdtime_display"
                                ,labelWidth         : 125
                                ,width              : 125 + 100
                                ,height             : 22
                                ,style              : "margin-right:10px;"
                                ,valueToRaw         : function(value) {
                                    if (!value || value.length == 0) {
                                        return "5 seconds";
                                    } else if (value == "1") {
                                        return "1 second";
                                    }

                                    return value + " seconds";
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
                        xtype               : "cp4_displayfield"
                        ,fieldLabel         : "Default ASE Route Cost"
                        ,id                 : "defaultaseroutecost_display"
                        ,labelWidth         : 125
                        ,width              : 150 + 100
                        ,height             : 22
                        ,style              : "margin-right:80px;"
                        ,valueToRaw         : function(value) {
                            if (!value || value.length == 0) {
                                return "1";
                            }

                            return value;
                        }
                    },{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Default ASE Route Type"
                        ,id             : "defaultaseroutetype_display"
                        ,name           : "defaultaseroutetype_name"
                        ,labelWidth     : 125
                        ,width          : 150 + 100
                        ,height         : 22
                        ,valueToRaw         : function(value) {
                            if (!value || value.length == 0) {
                                return "1";
                            }

                            return value;
                        }
                    }
                ]
            }
            ,{ // Graceful Restart
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,padding    : 0
                ,margin     : 0
                ,items      : [
                    {
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Graceful Restart"
                        ,id             : "gracefulrestart_display"
                        ,labelWidth     : 125
                        ,width          : 150 + 100
                        ,height             : 22
                        ,style          : "margin-right:80px;"
                        ,valueToRaw         : function(value) {
                            if (value && value == 1) {
                                return "on";
                            }

                            return "off";
                        }
                    },{
                        xtype               : "cp4_displayfield"
                        ,fieldLabel         : "Grace Period"
                        ,id                 : "graceperiod_display"
                        ,labelWidth         : 125
                        ,width              : 150 + 100
                        ,height             : 22
                        ,valueToRaw         : function(value) {
                            if (!value || value.length == 0) {
                                return "120 seconds";
                            } else if (value == "1") {
                                return "1 second";
                            }

                            return value + " seconds";
                        }
                    }
                ]
            },{ //Graceful Restart Helper
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Graceful Restart Helper"
                ,id             : "gracefulrestarthlpr_display"
                ,labelWidth     : 125
                ,width          : 300
                ,height             : 22
                ,valueToRaw         : function(value) {
                    if (value && value == 1) {
                        return "on";
                    }

                    return "off";
                }
            },{
                xtype           : "cp4_btnsbar"
                ,id             : "ospf2_global_btnsbar"
                ,items          : [
                    {
                        xtype               : "cp4_button"
                        ,text               : "Change Global Settings"
                        ,id                 : "ospf2_global_btn_edit"
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ospf2_4.change_global_settings();
                        }
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                            return !(m);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,text               : "Delete Broken Configurations"
                        ,id                 : "ospf2_global_btn_cleanup"
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ospf2_4.delete_bad_configurations();
                        }
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                            return !(m);
                        }
                        ,handle_no_token    : function() {
                            var b = this;
                            var d = CP.ar_util.checkBlockActivity(false);
                            var nobadconfig = !( CP.ospf2_4.find_bad_configuration() );
                            d = d || b.disabledConditions() || nobadconfig;
                            if (b && b.disabled != d) { b.setDisabled(d); }
                            if (b && b.hidden != nobadconfig) { b.setVisible(!nobadconfig); }
                            return (!d);
                        }
                    }
                ]
            }
        ];
    }

    ,get_edit_global_settings_fields      : function() {
        return {
            xtype       : "cp4_formpanel"
            ,margin     : "15 0 2 0"
            ,items      : [
                {
                    xtype           : "cp4_ipv4field_ex"
                    ,fieldLabel     : "Router ID"
                    ,id             : "edit_routerid"
                    ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,entityName     : "Router ID"
                    ,submitValue    : false
                    ,rejectZero     : false
                    ,allowBlank     : true
                    ,fieldConfig    : {submitValue : false}
                    ,disabled       : !CP.ospf2_4.router_id_editable
                }
                ,{
                    xtype: 'cp4_inlinemsg'
                    ,text: 'The Router ID is used by both BGP and OSPF.'
                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,hidden         : !CP.ospf2_4.router_id_editable
                }
                ,{
                    xtype           : "cp4_inlinemsg"
                    ,type           : "warning"
                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,text           : CP.ospf2_4.active_protocols_msg
                    ,hidden         : CP.ospf2_4.router_id_editable
                }
                ,{
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "RFC 1583 Compatibility"
                    ,id             : "edit_rfc1583compatibility"
                    ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,height         : 22
                    ,submitValue    : false
                    ,margin         : "15 0 0 0"
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
                            ,width      : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,items      : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "SPF Delay (seconds)"
                                    ,id                 : "edit_spfdelay"
                                    ,submitValue        : false
                                    ,emptyText          : "Default: 2"
                                    ,minValue           : 1
                                    ,maxValue           : 60
                                    ,maxLength          : 2
                                    ,enforceMaxLength   : true
                                    ,allowBlank         : true
                                    ,allowDecimals      : false
                                    ,labelWidth         : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                                    ,width              : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                                    ,validator          : function(value) {
                                        var d = Ext.getCmp("edit_spfdelay");
                                        var h = Ext.getCmp("edit_spfholdtime");
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
                                            var ids = ["edit_spfdelay", "edit_spfholdtime"];
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
                            ,width      : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,items      : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "SPF Hold Time (seconds)"
                                    ,id                 : "edit_spfholdtime"
                                    ,submitValue        : false
                                    ,emptyText          : "Default: 5"
                                    ,minValue           : 1
                                    ,maxValue           : 60
                                    ,maxLength          : 2
                                    ,enforceMaxLength   : true
                                    ,allowBlank         : true
                                    ,allowDecimals      : false
                                    ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                                    ,validator          : function(value) {
                                        var d = Ext.getCmp("edit_spfdelay");
                                        var h = Ext.getCmp("edit_spfholdtime");
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
                                            var ids = ["edit_spfdelay", "edit_spfholdtime"];
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
                            ,id                 : "edit_defaultaseroutecost"
                            ,labelWidth         : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                            ,width              : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
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
                            ,id             : "edit_defaultaseroutetype"
                            ,name           : "edit_defaultaseroutetype_name"
                            ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                            ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,submitValue    : false
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [[1 ,"Type 1"]
                                                ,[2 ,"Type 2"]]
                        }
                    ]
                },{
                    xtype           : "cp4_inlinemsg"
                    ,id             : "gracefulrestart_inlinemsg"
                    ,type           : "info"
                    ,text           : "OSPF Graceful Restart is incompatible with VRRP in preempt mode."
                                    + " Please disable preempt mode before configuring graceful restart."
                    ,margin         : "0 15 5 0"
                },{ // Graceful Restart
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,padding    : 0
                    ,margin     : 0
                    ,items      : [
                        {
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Graceful Restart"
                            ,id             : "edit_gracefulrestart"
                            ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                            ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,height         : 22
                            ,submitValue    : false
                            ,listeners      : {
                                change          : function(box, newVal, oldVal) {
                                    var grperiod = Ext.getCmp("edit_graceperiod");
                                    if (grperiod) {
                                        grperiod.setVisible( newVal );
                                    }
                                }
                            }
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Grace Period (seconds)"
                            ,id                 : "edit_graceperiod"
                            ,labelWidth         : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                            ,width              : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                            ,submitValue        : false
                            ,emptyText          : "Default: 120"
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 1800
                            ,maxLength          : 4
                            ,enforceMaxLength   : true
                            ,hidden             : true
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
                        }
                    ]
                },{ //Graceful Restart Helper
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "Graceful Restart Helper"
                    ,id             : "edit_gracefulrestarthlpr"
                    ,labelWidth     : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH
                    ,width          : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 120
                    ,height         : 22
                    ,submitValue    : false
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

            if (CP.ospf2_4.global_values) {
                var gData = CP.ospf2_4.global_values;

                setOriginalValue("edit_routerid", gData.routerid);

                if (gData.rfc1583compatibility == 1) {
                    setOriginalValue("edit_rfc1583compatibility" ,true);
                } else {
                    setOriginalValue("edit_rfc1583compatibility" ,false);
                }

                setOriginalValue("edit_spfdelay", gData.spfdelay);
                setOriginalValue("edit_spfholdtime", gData.spfholdtime);
                setOriginalValue("edit_defaultaseroutecost", gData.defaultaseroutecost);

                var rt_field = Ext.getCmp("edit_defaultaseroutetype");
                if (rt_field) {
                    var ase_rt_type = 1;
                    if (gData.defaultaseroutetype) {
                        ase_rt_type = gData.defaultaseroutetype;
                    }

                    rt_field.select(gData.defaultaseroutetype);
                    rt_field.originalValue = rt_field.getValue();
                }

                if (gData.gracefulrestarthlpr == 1) {
                    setOriginalValue("edit_gracefulrestarthlpr"  ,true);
                } else {
                    setOriginalValue("edit_gracefulrestarthlpr"  ,false);
                }

                if (gData.gracefulrestart == 1) {
                    setOriginalValue("edit_gracefulrestart", true);
                } else {
                    setOriginalValue("edit_gracefulrestart", false);
                }

                setOriginalValue("edit_graceperiod", gData.graceperiod)
            }
        }

        function global_settings_save() {
            var params = CP.ar_util.clearParams();
            var prefix = "routed:instance:" + CP.ar_util.INSTANCE();

            var routerid                = Ext.getCmp("edit_routerid");
            if (routerid.originalValue != routerid.getValue()) {
                params[prefix + ":routerid"]                    = routerid.getValue();
            }
            var rfc1583compatibility    = (Ext.getCmp("edit_rfc1583compatibility").getValue()) ? "" : "t";
            var spfdelay                = Ext.getCmp("edit_spfdelay").getDBValue();
            var spfholdtime             = Ext.getCmp("edit_spfholdtime").getDBValue();
            var defaultaseroutecost     = Ext.getCmp("edit_defaultaseroutecost").getDBValue();
            var defaultaseroutetype     = (Ext.getCmp("edit_defaultaseroutetype").getValue() == 2) ? 2 : "";
            var gracefulrestarthlpr     = (Ext.getCmp("edit_gracefulrestarthlpr").getValue()) ? "t" : "";
            var gracefulrestart         = "";
            var graceperiod             = "";

            if (Ext.getCmp("edit_gracefulrestart").getValue()) {
                gracefulrestart = "t";
                graceperiod = Ext.getCmp("edit_graceperiod").getDBValue();
            } else {
                gracefulrestart = "";
                graceperiod = "";
            }

            params[prefix + ":ospf2:norfc1583compatibility"]= rfc1583compatibility;
            params[prefix + ":ospf2:spfdelay"]              = spfdelay;
            params[prefix + ":ospf2:spfholdtime"]           = spfholdtime;
            params[prefix + ":ospf2:asedefaults:cost"]      = defaultaseroutecost;
            params[prefix + ":ospf2:asedefaults:type"]      = defaultaseroutetype;
            params[prefix + ":ospf2:gracefulrestarthelper"] = gracefulrestarthlpr;
            params[prefix + ":ospf2:graceful-restart"]              = gracefulrestart;
            params[prefix + ":ospf2:graceful-restart:grace-period"] = graceperiod;

            CP.ar_util.mySubmit();
            return true;
        }

        var global_settings_form = {
            xtype       : "cp4_formpanel"
            ,id         : "global_settings_form"
            ,autoScroll : false
            ,width      : CP.ospf2_4.GLOBAL_SETTINGS_LABELWIDTH + 150
            ,height     : 410
            ,listeners  : {
                afterrender     : global_settings_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("global_settings_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("global_settings_save_btn");
                CP.ar_util.checkDisabledBtn("global_settings_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "global_settings_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        return global_settings_save();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        var f = CP.ar_util.checkFormValid("global_settings_form");
                        return !(m && f);
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            Ext.getCmp("global_settings_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "global_settings_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("global_settings_window");
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            CP.ospf2_4.check_user_action();
                        }
                    }
                }
            ]
            ,items      : [
                {
                   xtype   : "cp4_formpanel"
                   ,margin : "0 0 0 15"
                   ,items  : [CP.ospf2_4.get_edit_global_settings_fields()]
                }
            ]
        };

        var global_settings_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "global_settings_window"
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

//STUB:AREA SECTION
    ,update_area_control_visibility : function(mode) {
        mode = String(mode).toLowerCase();
        
        var stub_set = Ext.getCmp("area_stub_set");
        var nssa_set = Ext.getCmp("area_nssa_set");
        var nssa_gs  = Ext.getCmp("area_type7_grid_set");

        stub_set.setVisible(    mode == "stub");
        stub_set.setDisabled(   mode != "stub");
        nssa_set.setVisible(    mode == "nssa");
        nssa_set.setDisabled(   mode != "nssa");
        nssa_gs.setVisible(     mode == "nssa");
    }

    ,get_area_set               : function() {
        var area_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "area_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "area_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("area_grid").getSelectionModel().deselectAll();
                        CP.ospf2_4.open_area_window();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        return !(m);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "area_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ospf2_4.open_area_window();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("area_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "area_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("area_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        var params = CP.ar_util.clearParams();
                        var intf_st = Ext.getStore("ospf2_intf_store");

                        /*
                         * If the backbone area is one of the areas being
                         * removed - make sure no virtual links are configured
                         * because they will stop working if backbone is
                         * turned off.
                         */
                        for(i = 0; i < recs.length; i++) {
                            if (recs[i].data.area_info_area_id === "0.0.0.0") {
                                var vlink_st = Ext.getStore("vlink_store");
                                if (vlink_st.getCount() > 0) {
                                    Ext.Msg.alert("Delete Area",
                                        "Please remove all Virtual Links " +
                                        "before deleting the backbone area.");
                                    return;
                                }
                            }
                            
                            var if_index = intf_st.findExact("area", 
                                    recs[i].data.area_info_area_id);
                                    
                            if (if_index !== -1) {
                                var intf_rec = intf_st.getAt(if_index);

                                Ext.Msg.alert("Delete Area",
                                    "Area " 
                                    + recs[i].data.area_info_display_name
                                    + " is still in use by interface " 
                                    + intf_rec.data.interface  
                                    + ".");
                                return;
                            }
                        }

                        for(i = 0; i < recs.length; i++) {
                            b.deleteRecord(params, recs[i]);
                        }

                        if (recs.length > 0) {
                            Ext.getStore("ospf2_area_store").remove(recs);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("area_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, rec) {
                        //have to load stores since the basic area store doesn't load in everything
                        CP.ospf2_4.load_Area_Window_Stores(rec);
                        var area    = rec.data.area_info_area_id;
                        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2:area:"+ area;
                        var i;

                        //clear
                        params[prefix] = "";
                        params[prefix + ":display_mode"]                        = "";
                        params[prefix +":nssa"]                                 = "";
                        params[prefix +":nssa:cost"]                            = "";
                        params[prefix +":nssa:noredistribution"]                = "";
                        params[prefix +":nssa:nosummary"]                       = "";
                        params[prefix +":nssa:type"]                            = "";
                        params[prefix +":nssa:translator:always"]               = "";
                        params[prefix +":nssa:translator:stabilityinterval"]    = "";
                        params[prefix +":stub"]                                 = "";
                        params[prefix +":stub:cost"]                            = "";
                        params[prefix +":stub:nosummary"]                       = "";

                        var recs;
                        recs = Ext.getStore("area_addr_range_store").getRange();
                        for(i = 0; i < recs.length; i++) {
                            CP.ospf2_4.delete_ar_record(recs[i], area);
                        }
                        recs = Ext.getStore("area_stub_store").getRange();
                        for(i = 0; i < recs.length; i++) {
                            CP.ospf2_4.delete_stub_record(recs[i], area);
                        }
                        recs = Ext.getStore("area_type7_store").getRange();
                        for(i = 0; i < recs.length; i++) {
                            CP.ospf2_4.delete_type7_record(recs[i], area);
                        }

                        return true;
                    }
                }
            ]
        };

        var area_cm = [
            {
                header          : "Area"
                ,dataIndex      : "area_info_display_name"
                ,menuDisabled   : true
                ,width          : 150
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererGeneric(value);
                }
            },{
                header          : "Type"
                ,dataIndex      : "area_info_area_type"
                ,menuDisabled   : true
                ,width          : 100
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var area_grid = {
            xtype               : "cp4_grid"
            ,id                 : "area_grid"
            ,width              : 250
            ,height             : CP.ospf2_4.MAIN_GRID_HEIGHT
            ,forceFit           : true
            ,store              : Ext.getStore("ospf2_area_store")
            ,columns            : area_cm
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function() {
                        CP.ar_util.checkBtnsbar("area_btnsbar");
                    }
                }
            })
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,margin             : "0 0 0 0"
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("area_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            area_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ area_grid ]
            }
        ];
    }

    //open area window
    ,open_area_window           : function() {
        CP.ar_util.clearParams();
        var area_obj;
        var TITLE;

        if (Ext.getCmp("area_grid").getSelectionModel().hasSelection()) {

            //edit
            var rec = Ext.getCmp("area_grid").getSelectionModel().getLastSelected();
            TITLE = "Edit Area " + rec.data.area_info_display_name;
            area_obj = {
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Area"
                ,id         : "area_aw"
                ,name       : "area_info_display_name"
                ,labelWidth : 150
                ,width      : 300
                ,height     : 22
                ,margin     : "15 0 5 15"
            };

        } else {

            //new
            TITLE = "Add Area";
            area_obj = {
                xtype               : "cp4_textfield"
                ,fieldLabel         : "Area"
                ,id                 : "area_aw"
                ,name               : "area_info_display_name"
                ,labelWidth         : 150
                ,width              : 300
                ,allowBlank         : false
                ,maskRe             : /[0-9\.BACKBONEbackbone]/
                ,stripCharsRe       : /[^0-9\.BACKBONEbackbone]/
                ,maxLength          : 15
                ,enforceMaxLength   : true
                ,margin             : "15 0 5 15"
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
                    var area_mode_cmp = Ext.getCmp("area_type_aw");
                    if (lwrStr === "backbone" || lwrStr === "0.0.0.0" 
                            || lwrStr === "0") {
                        /*
                         * This is the backbone area -- it cannot be a
                         * stub or NSSA area, so disable related controls.
                         */
                        area_mode_cmp.setVisible(false);
                        CP.ospf2_4.update_area_control_visibility("Normal");
                        return true;
                    } else {
                        area_mode_cmp.setVisible(true);
                        CP.ospf2_4.update_area_control_visibility(
                                area_mode_cmp.getValue());                    
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
                    var area_st = Ext.getStore("ospf2_area_store");
                    if (area_st) {
                        var area_idx = area_st.findExact("area_info_sortable", v_i);
                        if (area_idx != -1) {
                            var a_rec = area_st.getAt(area_idx);
                            var area = String(a_rec.data.area_info_display_name);
                            return ("This area already exists as "+ area);
                        }
                        return true;
                    }
                    return "Store failure.";
                }
            };
        }

        //area form function and from
        function area_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var area_sm = Ext.getCmp("area_grid").getSelectionModel();
            var rec = null;
            if (area_sm.hasSelection()) {
                //edit
                rec = area_sm.getLastSelected();
                p.loadRecord(rec);
                var this_area = rec.data.area_info_area_id;

                Ext.getCmp("area_id_aw").setValue(this_area);

                var vlink_st = Ext.getStore("vlink_store");
                if (this_area == "0.0.0.0") {
                    Ext.getCmp("area_type_aw").setVisible(false);
                    Ext.getCmp("area_type_aw").setDisabled(true);
                } else {
                    var in_vlink_use = (vlink_st.findExact("transitarea",this_area) != -1) ? true : false;
                    Ext.getCmp("area_type_aw").setVisible(!in_vlink_use);
                    Ext.getCmp("area_type_aw").setDisabled(in_vlink_use);

                    CP.ospf2_4.setCheckBox("stub_import_summary_aw", rec.data.eafimportsummaryroutesstubarea);
                    CP.ospf2_4.setCheckBox("nssa_import_summary_aw", rec.data.eafimportsummaryroutesnssa);
                    CP.ospf2_4.setCheckBox("nssa_redistribution_aw", rec.data.eafredistributionnssa);
                }
            } else {
                //new
                var default_type_str = (Ext.getCmp("defaultaseroutetype_display").getValue() == 1) ? "Type1" : "Type2";
                Ext.getCmp("nssa_default_route_type_aw").setValue( default_type_str );
                Ext.getCmp("area_id_aw").setValue("");

                //STUB Ext.getCmp("area_aw").focus();
            }
            CP.ospf2_4.load_Area_Window_Stores(rec);
            if (p && p.chkBtns) { p.chkBtns(); }
        }

        function area_save(b, e) {
            var params = CP.ar_util.getParams();
            var prefix;
            var i;
            var recs;
            var net_prefix, mask_prefix;
            var rec_restrict;

            var area_id = Ext.getCmp("area_id_aw").getRawValue();
            var display_mode = "";
            var update_display_mode = false;

            if (area_id == "") {
                // New record - derive the area id from the area name
                var area_name = Ext.getCmp("area_aw").getRawValue();
                var normalized = CP.ospf2_4.normalize_area_name(area_name);
                area_id = normalized.area_id;
                display_mode = normalized.display_mode;
                update_display_mode = true;
            }

            var area_type = Ext.getCmp("area_type_aw").getValue().toLowerCase();
            prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2:area:"+ area_id;
            params[prefix]          = "t";

            if (update_display_mode) {
                params[prefix + ":display_mode"] = display_mode;
            }

            if (area_id === "0.0.0.0") {

                //push networks:network
                recs = Ext.getStore("area_addr_range_store").getRange();
                for(i = 0; i < recs.length; i++) {
                    net_prefix  = prefix +":networks:network:"+ recs[i].data.area_ar_prefix;
                    mask_prefix = net_prefix +":masklen:"+ recs[i].data.area_ar_mask;
                    rec_restrict= (recs[i].data.area_ar_restrict) ? "t" : "";
                    params[net_prefix]                  = "";
                    params[mask_prefix]                 = "t";
                    params[mask_prefix +":restrict"]    = rec_restrict;
                }

                //push stubnets:net
                recs = Ext.getStore("area_stub_store").getRange();
                for(i = 0; i < recs.length; i++) {
                    net_prefix  = prefix +":stubnets:net:"+ recs[i].data.area_stub_networks_prefix;
                    mask_prefix = net_prefix +":masklen:"+ recs[i].data.area_stub_networks_mask;
                    params[net_prefix]              = "";
                    params[mask_prefix]             = "t";
                    params[mask_prefix +":cost"]    = recs[i].data.area_stub_networks_prefixcost;
                }
            } else {
                params[prefix +":nssa"] = (area_type == "nssa") ? "t" : "";
                params[prefix +":stub"] = (area_type == "stub") ? "t" : "";
                if (area_type != "nssa") {
                    // have it delete NSSA-specific settings
                    params["SPECIAL:"+prefix+":nssa"] = "";
                }
                if (area_type != "stub") {
                    // have it delete stub-specific settings
                    params["SPECIAL:"+prefix+":stub"] = "";
                }

                //stub stuff
                var stub_cost   = Ext.getCmp("stub_cost_aw").getValue();
                var stub_nosum  = (Ext.getCmp("stub_import_summary_aw").getValue()) ? "" : "t";

                params[prefix +":stub:cost"]                            = (area_type == "stub") ? stub_cost : "";
                params[prefix +":stub:nosummary"]                       = (area_type == "stub") ? stub_nosum : "";

                //nssa stuff
                //always or candidate
                var nssa_cost   = Ext.getCmp("nssa_cost_aw").getValue();
                var nssa_no_re  = (Ext.getCmp("nssa_redistribution_aw").getValue()) ? "" : "t";
                var nssa_no_sum = (Ext.getCmp("nssa_import_summary_aw").getValue()) ? "" : "t";
                var nssa_type   = (Ext.getCmp("nssa_default_route_type_aw").getValue() == "Type1") ? "" : "2";
                var nssa_always;
                switch(Ext.getCmp("nssa_translator_rule_aw").getValue().toLowerCase()) {
                    case "always":  nssa_always = "t";
                        break;
                    default:        nssa_always = "";
                }
                var nssa_stab   = Ext.getCmp("nssa_translator_stability_interval_aw").getValue();

                params[prefix +":nssa:cost"]                            = (area_type == "nssa") ? nssa_cost : "";
                params[prefix +":nssa:noredistribution"]                = (area_type == "nssa") ? nssa_no_re : "";
                params[prefix +":nssa:nosummary"]                       = (area_type == "nssa") ? nssa_no_sum : "";
                params[prefix +":nssa:type"]                            = (area_type == "nssa") ? nssa_type : "";
                params[prefix +":nssa:translator:always"]               = (area_type == "nssa") ? nssa_always : "";
                params[prefix +":nssa:translator:stabilityinterval"]    = (area_type == "nssa") ? nssa_stab : "";

                //push by type

                //push networks:network
                recs = Ext.getStore("area_addr_range_store").getRange();
                for(i = 0; i < recs.length; i++) {
                    net_prefix  = prefix +":networks:network:"+ recs[i].data.area_ar_prefix;
                    mask_prefix = net_prefix +":masklen:"+ recs[i].data.area_ar_mask;
                    rec_restrict= (recs[i].data.area_ar_restrict) ? "t" : "";
                    params[net_prefix]                  = "";
                    params[mask_prefix]                 = "t";
                    params[mask_prefix +":restrict"]    = rec_restrict;
                }

                //push stubnets:net
                recs = Ext.getStore("area_stub_store").getRange();
                for(i = 0; i < recs.length; i++) {
                    net_prefix  = prefix +":stubnets:net:"+ recs[i].data.area_stub_networks_prefix;
                    mask_prefix = net_prefix +":masklen:"+ recs[i].data.area_stub_networks_mask;
                    params[net_prefix]              = "";
                    params[mask_prefix]             = "t";
                    params[mask_prefix +":cost"]    = recs[i].data.area_stub_networks_prefixcost;
                }

                //push type 7
                recs = Ext.getStore("area_type7_store").getRange();
                for(i = 0; area_type == "nssa" && i < recs.length; i++) {
                    net_prefix  = prefix +":nssa:networks:network:"+ recs[i].data.area7_ar_prefix;
                    mask_prefix = net_prefix +":masklen:"+ recs[i].data.area7_ar_mask;
                    rec_restrict= (recs[i].data.area7_ar_restrict) ? "t" : "";
                    params[net_prefix]                  = "";
                    params[mask_prefix]                 = "t";
                    params[mask_prefix +":restrict"]    = rec_restrict;
                }

            }
            CP.ar_util.mySubmit();
        }

        var area_form = {
            xtype       : "cp4_formpanel"
            ,id         : "area_form"
            ,autoScroll : true
            ,height     : 400
            ,width      : 540
            ,defaults   : {
                margin      : "0 0 5 15"
            }
            ,listeners  : {
                afterrender     : area_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("area_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("area_save_btn");
                CP.ar_util.checkDisabledBtn("area_cancel_btn");
                CP.ar_util.checkBtnsbar("area_ar_btnsbar");
                CP.ar_util.checkBtnsbar("area_stub_btnsbar");
                CP.ar_util.checkBtnsbar("area_type7_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "area_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        var panel = Ext.getCmp("area_form");
                        if (panel && !( panel.getForm().isValid() ) ) { return; }
                        area_save(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("area_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("area_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "area_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("area_window");
                        CP.ar_util.clearParams();
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("area_aw").validate();
                        }
                    }
                }
            ]
            ,items      : [
                area_obj
                ,{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Area Type"
                    ,id             : "area_type_aw"
                    ,name           : "area_info_area_type"
                    ,labelWidth     : 150
                    ,width          : 150 + 100
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,editable       : true
                    ,forceSelection : true
                    ,allowBlank     : false
                    ,value          : "Normal"
                    ,store          :   ["Normal"
                                        ,"Stub"
                                        ,"NSSA"]
                    ,listeners      : {
                        select          : function(cb, recs, eOpts) {
                            var mode     = Ext.getCmp("area_type_aw").getValue();
                            CP.ospf2_4.update_area_control_visibility(mode);
                        }
                    }
                }
                ,{
                        xtype           : "cp4_displayfield"
                        ,id             : "area_id_aw"
                        ,hidden         : true
                        ,hideLabel      : true
                }
                //fields for Stub
                ,{
                    xtype       : "cp4_formpanel"
                    ,id         : "area_stub_set"
                    ,width      : 500
                    ,padding    : 0
                    ,margin     : "0 0 5 15"
                    ,items      : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Cost for Default Route"
                            ,id             : "stub_cost_aw"
                            ,name           : "eafcostfordefaultroutestubarea"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,emptyText      : "Default: "+ Ext.getCmp("defaultaseroutecost_display").getValue()
                            ,value          : ""
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Import Summary Routes"
                            ,id             : "stub_import_summary_aw"
                            ,name           : "eafimportsummaryroutesstubarea"
                            ,labelWidth     : 150
                            ,width          : 200
                            ,height         : 22
                            ,checked        : true
                        }
                    ]
                }
                //fields for NSSA
                ,{
                    xtype       : "cp4_formpanel"
                    ,id         : "area_nssa_set"
                    ,width      : 500
                    ,padding    : 0
                    ,margin     : "0 0 5 15"
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Translator Role"
                            ,id             : "nssa_translator_rule_aw"
                            ,name           : "eaftranslatorrolenssa"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,queryMode      : "local"
                            ,triggerAction  : "all"
                            ,editable       : false
                            ,allowBlank     : false
                            ,value          : "candidate"
                            ,store          :   [["candidate"   ,"Candidate"]
                                                ,["always"      ,"Always"]]
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Translator Stability Interval"
                            ,id             : "nssa_translator_stability_interval_aw"
                            ,name           : "eaftranslatorstabilityintervalnssa"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 65535
                            ,maxLength      : 5
                            ,enforceMaxLength   : true
                            ,value          : ""
                            ,emptyText      : "Default: 40"
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Import Summary Routes"
                            ,id             : "nssa_import_summary_aw"
                            ,name           : "eafimportsummaryroutesnssa"
                            ,labelWidth     : 150
                            ,width          : 200
                            ,height         : 22
                            ,checked        : true
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Default Route Type"
                            ,id             : "nssa_default_route_type_aw"
                            ,name           : "eafdefaultroutetypenssa"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,queryMode      : "local"
                            ,triggerAction  : "all"
                            ,editable       : true
                            ,forceSelection : true
                            ,allowBlank     : false
                            ,value          : "Type1"
                            ,store          :   [["Type1"   ,"Type 1"]
                                                ,["Type2"   ,"Type 2"]]
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Cost for Default Route"
                            ,id             : "nssa_cost_aw"
                            ,name           : "eafcostfordefaultroutenssa"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 16777215
                            ,maxLength      : 8
                            ,enforceMaxLength   : true
                            ,value          : ""
                            ,emptyText      : "Default: "+ String(Ext.getCmp("defaultaseroutecost_display").getValue())
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Redistribution"
                            ,id             : "nssa_redistribution_aw"
                            ,name           : "eafredistributionnssa"
                            ,labelWidth     : 150
                            ,width          : 150 + 100
                            ,height         : 22
                            ,checked        : true
                        }
                    ]
                }
                ,{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,width      : 505
                    ,autoScroll : false
                    ,padding    : 0
                    ,margin     : "0 0 5 15"
                    ,items      : [
                        CP.ospf2_4.get_area_ar_grid_set()
                        ,CP.ospf2_4.get_area_stub_grid_set()
                    ]
                }
                ,CP.ospf2_4.get_area_type7_grid_set()
            ]
        };

        var area_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "area_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    Ext.getCmp("area_type_aw").fireEvent("select");
                    win.setPosition(225,100);
                }
            }
            ,items      : [ area_form ]
        });
        area_window.show();
    }

    ,delete_ar_record                   : function(rec, area) {
        if (rec.data.newrec == true) {
            //new records and any record in a new area (textfield)
            Ext.getStore("area_addr_range_store").remove(rec);
            return;
        }
        var params      = CP.ar_util.getParams();
        var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2";
        var net_prefix  = prefix +":area:"+ area +":networks:network:"+ rec.data.area_ar_prefix;
        var mask_prefix = net_prefix +":masklen:"+ rec.data.area_ar_mask;

        params[net_prefix]                  = "";
        params[mask_prefix]                 = "";
        params[mask_prefix +":restrict"]    = "";

        Ext.getStore("area_addr_range_store").remove(rec);
    }
    ,delete_stub_record                 : function(rec, area) {
        if (rec.data.newrec == true) {
            //new records and any record in a new area (textfield)
            Ext.getStore("area_stub_store").remove(rec);
            return;
        }
        var params      = CP.ar_util.getParams();
        var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2";
        var net_prefix  = prefix +":area:"+ area +":stubnets:net:"+ rec.data.area_stub_networks_prefix;
        var mask_prefix = net_prefix +":masklen:"+ rec.data.area_stub_networks_mask;

        params[net_prefix]                  = "";
        params[mask_prefix]                 = "";
        params[mask_prefix +":cost"]        = "";

        Ext.getStore("area_stub_store").remove(rec);
    }
    ,delete_type7_record                : function(rec, area) {
        if (rec.data.newrec == true) {
            //new records and any record in a new area
            Ext.getStore("area_type7_store").remove(rec);
            return;
        }
        var params = CP.ar_util.getParams();
        var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2";
        var net_prefix = prefix +":area:"+ area +":nssa:networks:network:"+ rec.data.area7_ar_prefix;
        var mask_prefix = net_prefix +":masklen:"+ rec.data.area7_ar_mask;

        params[net_prefix]                  = "";
        params[mask_prefix]                 = "";
        params[mask_prefix +":restrict"]    = "";

        Ext.getStore("area_type7_store").remove(rec);
    }

    //shared area sub_grid generator
    ,get_area_sub_grid  : function(GRID_ID, WIDTH, HEIGHT, STORE_ID, GRID_CM, LISTENERS, SELMODEL, PLUGINS) {
        return {
            xtype               : "cp4_grid"
            ,id                 : GRID_ID
            ,width              : WIDTH
            ,height             : HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore( STORE_ID )
            ,columns            : GRID_CM
            ,selModel           : SELMODEL
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : LISTENERS
            ,plugins            : PLUGINS
        };
    }

    //shared area sub window generator for Address Range, Stub Nets, and Type 7
    ,open_area_sub_window                : function( TYPE ) {
        if (Ext.getCmp("area_sub_ipv4notation")) {
            Ext.getCmp("area_sub_ipv4notation").destroy();
        }
        var rider_obj = {
            xtype           : "cp4_checkbox"
            ,fieldLabel     : "Restrict"
            ,id             : "rider_asw"
            ,labelWidth     : rider_labelWidth
            ,width          : rider_width
            ,height         : 22
        };
        var rider_labelWidth    = (CP.global.formatNotation == "Dotted") ? 100 : 140;
        var rider_width         = rider_labelWidth + 85;
        var TITLE = "Add Address Range";
        switch(TYPE.toLowerCase()) {
            case "stub":
                TITLE = "Add Stub Network";
                rider_obj = {
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Cost"
                    ,id             : "rider_asw"
                    ,labelWidth     : rider_labelWidth
                    ,width          : rider_width
                    ,allowBlank     : true
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxValue       : 65535
                    ,maxLength      : 5
                    ,enforceMaxLength   : true
                };
                break;
            case "type7":
                TITLE = "Add Type 7 Address Range";
                break;
            default:    //restrict checkbox for address range and type7 (defined above)
        }

        function area_sub_save(b, e) {
            if (Ext.getCmp("prefix_asw").getMaskLength() > Ext.getCmp("mask_asw").getMaskLength()) {
                var msg = "Insufficient Mask Length.";
                if (CP.global.formatNotation == "Dotted") {
                    msg = "Insufficient Subnet Mask.";
                }
                Ext.Msg.alert("Warning", msg);
                return;
            }
            var prefix  = Ext.getCmp("prefix_asw").getValue();
            var mask    = Ext.getCmp("mask_asw").getMaskLength();
            var rider   = Ext.getCmp("rider_asw").getValue();
            var r_type  = Ext.getCmp("TYPE_asw").getValue().toLowerCase();

            //validate prefix against mask
            if ( !(CP.ospf2_4.validate_address_vs_mask( prefix, mask )) ) {
                return;
            }

            //at this point, prefix and mask are assumed to be valid
            var sub_store;  //store (not id) to use
            var sub_grid;
            var test_field; //name value of the prefix to test against
            var rec;
            if (r_type == "stub") {

                if (Ext.getCmp("rider_asw").getRawValue() == "") {
                    rider = "";
                } else if (rider < 1) {
                    rider = 1;
                } else if (rider > 65535) {
                    rider = 65535;
                }
                sub_store   = Ext.getStore("area_stub_store");
                sub_grid    = Ext.getCmp("area_stub_grid");
                test_field  = "area_stub_networks_prefixmask";
                if (sub_store.findExact(test_field, prefix +"/"+ mask) == -1) {
                    sub_store.add({
                        "area_stub_networks_prefixmask"     : prefix +"/"+ mask
                        ,"area_stub_networks_prefix"        : prefix
                        ,"area_stub_networks_mask"          : mask
                        ,"area_stub_networks_prefixcost"    : rider
                        ,"newrec"                           : true
                    });
                } else {
                    rec = sub_store.findRecord(test_field, prefix +"/"+ mask, 0, false, true, true);
                    rec.data.area_stub_networks_prefixcost = rider;
                }

            } else if (r_type == "type7") {

                sub_store   = Ext.getStore("area_type7_store");
                sub_grid    = Ext.getCmp("area_type7_grid");
                test_field  = "area7_ar_prefixmask";
                if (sub_store.findExact(test_field, prefix +"/"+ mask) == -1) {
                    sub_store.add({
                        "area7_ar_prefixmask"   : prefix +"/"+ mask
                        ,"area7_ar_prefix"      : prefix
                        ,"area7_ar_mask"        : mask
                        ,"area7_ar_restrict"    : rider
                        ,"newrec"               : true
                    });
                } else {
                    rec = sub_store.findRecord(test_field, prefix +"/"+ mask, 0, false, true, true);
                    rec.data.area7_ar_restrict = rider;
                }

            } else {

                sub_store   = Ext.getStore("area_addr_range_store");
                sub_grid    = Ext.getCmp("area_ar_grid");
                test_field  = "area_ar_prefixmask";
                if (sub_store.findExact(test_field, prefix +"/"+ mask) == -1) {
                    sub_store.add({
                        "area_ar_prefixmask"    : prefix +"/"+ mask
                        ,"area_ar_prefix"       : prefix
                        ,"area_ar_mask"         : mask
                        ,"area_ar_restrict"     : rider
                        ,"newrec"               : true
                    });
                } else {
                    rec = sub_store.findRecord(test_field, prefix +"/"+ mask, 0, false, true, true);
                    rec.data.area_ar_restrict = rider;
                }

            }
            sub_grid.getView().refresh();
            CP.ar_util.checkWindowClose("area_sub_window");
        }

        var area_sub_form = {
            xtype       : "cp4_formpanel"
            ,id         : "area_sub_form"
            ,autoScroll : false
            ,width      : 360
            ,height     : 150
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("area_sub_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("area_sub_save_btn");
                CP.ar_util.checkDisabledBtn("area_sub_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "area_sub_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        area_sub_save(b, e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("area_sub_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("area_sub_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "area_sub_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("area_sub_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("prefix_asw").validate();
                            Ext.getCmp("mask_asw").validate();
                            Ext.getCmp("rider_asw").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 0 15"
                    ,autoScroll : false
                    ,width      : 330
                    ,items      : [
                        {
                            xtype           : "cp4_ipv4notation"
                            ,id             : "area_sub_ipv4notation"
                            ,ipId           : "prefix_asw"
                            ,ipName         : "prefix_asw"
                            //,ipLabel        : "Address Range"
                            ,notationId     : "mask_asw"
                            ,notationName   : "mask_asw"
                            ,fieldConfig    : {
                                allowBlank  : false
                                ,disabled   : false
                            }
                            ,networkMode    : true
                        }
                        ,rider_obj
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "TYPE"
                            ,id             : "TYPE_asw"
                            ,value          : TYPE
                            ,hidden         : true
                            ,hideLabel      : true
                        }
                    ]
                }
            ]
        };

        var area_sub_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "area_sub_window"
            ,title      : TITLE
            ,shadow     : false
            ,closeAction: "destroy"
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ area_sub_form ]
        });
        area_sub_window.show();
        return;
    }

    //get ar_grid_set
    ,get_area_ar_grid_set               : function() {

        var area_ar_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "area_ar_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "area_ar_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("area_ar_grid").getSelectionModel().deselectAll();
                        CP.ospf2_4.open_area_sub_window("ar");
                    }
                },{
                    text                : "Delete"
                    ,id                 : "area_ar_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_delete_ar
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("area_ar_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function before_delete_ar() {
            var area_ar_sm = Ext.getCmp("area_ar_grid").getSelectionModel();
            var rec = area_ar_sm.getLastSelected();
            var area_id = CP.ospf2_4.get_edited_area_id();
            CP.ospf2_4.delete_ar_record(rec, area_id );
        }

        var area_ar_cm = [
            {
                header          : "Address Range"
                ,dataIndex      : "area_ar_prefix"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = rec.data.area_ar_prefix + "/" + rec.data.area_ar_mask;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Restrict"
                ,dataIndex      : "area_ar_restrict"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = (value) ? "Restrict" : "Accept" ;
                    var image;
                    /*
                    [Expert@gw-87b08f]# pwd
                        /web/htdocs2/extjs4/resources/themes/images/default/grid
                    [Expert@gw-87b08f]# ls *checked*
                        checked.gif  unchecked.gif
                        ../ is /web/htdocs2/
                        ../extjs4/resources/themes/images/default/grid/checked.gif
                        ../extjs4/resources/themes/images/default/grid/unchecked.gif
                    // */
                    if (value) {
                        image = '<img src="../extjs4/resources/themes/images/default/grid/checked.gif" />';
                    } else {
                        image = '<img src="../extjs4/resources/themes/images/default/grid/unchecked.gif" />';
                    }
                    return '<div data-qtip="'+ retValue +'" style="text-align:center;" />'+ image +'</div />';
                    //return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var area_ar_listeners = {
            itemdblclick    : function(view, rec, htmlItem, index, e, eOpts) {
                if (rec.data.area_ar_restrict) {
                    rec.data.area_ar_restrict = false;
                } else {
                    rec.data.area_ar_restrict = true;
                }
                view.refresh();
            }
        };

        var area_ar_cellEditing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit    : 2
        });

        var area_ar_grid = CP.ospf2_4.get_area_sub_grid(
            "area_ar_grid"
            ,CP.ospf2_4.AREA_SUB_GRID_WIDTH
            ,CP.ospf2_4.AREA_SUB_GRID_HEIGHT
            ,"area_addr_range_store"
            ,area_ar_cm
            ,area_ar_listeners
            ,Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : function() {
                        CP.ar_util.checkBtnsbar("area_ar_btnsbar");
                    }
                }
            })
            ,[ area_ar_cellEditing ]
        );

        return {
            xtype   : "cp4_formpanel"
            ,id     : "area_ar_grid_set"
            ,width  : 245
            ,margin : 0
            ,padding: 0
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Address Range"
                    ,margin     : "18 0 10 0"
                }
                ,area_ar_btnsbar
                ,area_ar_grid
            ]
        };
    }

    //stub grid set
    ,get_area_stub_grid_set             : function() {
        var area_stub_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "area_stub_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "area_stub_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        if (Ext.getCmp("area_stub_grid")) {
                            Ext.getCmp("area_stub_grid").getSelectionModel().deselectAll();
                        }
                        CP.ospf2_4.open_area_sub_window("stub");
                    }
                },{
                    text                : "Delete"
                    ,id                 : "area_stub_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("area_stub_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,handler2           : function(b) {
                        var area_stub_sm = Ext.getCmp("area_stub_grid").getSelectionModel();
                        if (area_stub_sm.getCount() > 0) {
                            var recs = area_stub_sm.getSelection();
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                var area_id = CP.ospf2_4.get_edited_area_id();
                                CP.ospf2_4.delete_stub_record(recs[i], area_id);
                            }
                        }
                    }
                }
            ]
        };

        var area_stub_cm = [
            {
                header          : "Stub Network"
                ,dataIndex      : "area_stub_networks_prefix"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = rec.data.area_stub_networks_prefix +"/"+ rec.data.area_stub_networks_mask;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Cost"
                ,dataIndex      : "area_stub_networks_prefixcost"
                ,width          : 80
                ,menuDisabled   : true
                ,editable       : true
                ,editor         : {
                    xtype               : "cp4_numberfield"
                    ,allowDecimals      : false
                    ,minValue           : 1
                    ,maxValue           : 65535
                    ,maxLength          : 5
                    ,enforceMaxLength   : true
                    ,listeners          : {
                        change              : function(field, newVal, oldVal, eOpts) {
                            if (newVal > field.maxValue) {
                                field.setValue( field.maxValue );
                            } else if (newVal < field.minValue) {
                                field.setValue( field.minValue );
                            }
                        }
                    }
                }
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = "";
                    if (value) {
                        retValue = value;
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var area_stub_listeners = {};

        var area_stub_cellEditing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit    : 1
        });

        var area_stub_grid = CP.ospf2_4.get_area_sub_grid(
            "area_stub_grid"
            ,CP.ospf2_4.AREA_SUB_GRID_WIDTH
            ,CP.ospf2_4.AREA_SUB_GRID_HEIGHT
            ,"area_stub_store"
            ,area_stub_cm
            ,area_stub_listeners
            ,Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : function() {
                        CP.ar_util.checkBtnsbar("area_stub_btnsbar");
                    }
                }
            })
            ,[ area_stub_cellEditing ]
        );

        return {
            xtype   : "cp4_formpanel"
            ,id     : "area_stub_grid_set"
            ,width  : 245
            ,margin : "0 0 0 15"
            ,padding: 0
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Stub Networks"
                    ,margin     : "18 0 10 0"
                }
                ,area_stub_btnsbar
                ,area_stub_grid
            ]
        };
    }

    //type7 grid set
    ,get_area_type7_grid_set            : function() {
        var area_type7_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "area_type7_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "area_type7_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        if (Ext.getCmp("area_type7_grid")) {
                            Ext.getCmp("area_type7_grid").getSelectionModel().deselectAll();
                            CP.ospf2_4.open_area_sub_window("type7");
                        }
                    }
                },{
                    text                : "Delete"
                    ,id                 : "area_type7_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_delete_type7
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("area_type7_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function before_delete_type7() {
            var area_type7_sm = Ext.getCmp("area_type7_grid").getSelectionModel();
            if (area_type7_sm.getCount() > 0) {
                var recs = area_type7_sm.getSelection();
                var i;
                for(i = 0; i < recs.length; i++) {
                    var area_id = CP.ospf2_4.get_edited_area_id();
                    CP.ospf2_4.delete_type7_record(recs[i], area_id);
                }
            }
        }

        var area_type7_cm = [
            {
                header          : "Address Range"
                ,dataIndex      : "area7_ar_prefix"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = rec.data.area7_ar_prefix + "/" + rec.data.area7_ar_mask;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Restrict"
                ,dataIndex      : "area7_ar_restrict"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st) {
                    var retValue = (value) ? "Restrict" : "Accept" ;
                    var image;
                    /*
                    [Expert@gw-87b08f]# pwd
                        /web/htdocs2/extjs4/resources/themes/images/default/grid
                    [Expert@gw-87b08f]# ls *checked*
                        checked.gif  unchecked.gif
                        ../ is /web/htdocs2/
                        ../extjs4/resources/themes/images/default/grid/checked.gif
                        ../extjs4/resources/themes/images/default/grid/unchecked.gif
                    // */
                    if (value) {
                        image = '<img src="../extjs4/resources/themes/images/default/grid/checked.gif" />';
                    } else {
                        image = '<img src="../extjs4/resources/themes/images/default/grid/unchecked.gif" />';
                    }
                    return '<div data-qtip="'+ retValue +'" style="text-align:center;" />'+ image +'</div />';
                    //return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var area_type7_listeners = {
            selectionchange : function(view, selections, eOpts) {
                var delete_btn = Ext.getCmp("area_type7_delete_btn");
                if (delete_btn) {
                    if (0 == selections.length) {
                        delete_btn.disable();
                    } else {
                        delete_btn.enable();
                    }
                }
            }
            ,itemdblclick   : function(view, rec, htmlItem, index, e, eOpts) {
                if (rec.data.area7_ar_restrict) {
                    rec.data.area7_ar_restrict = false;
                } else {
                    rec.data.area7_ar_restrict = true;
                }
                view.refresh();
            }
        };

        var area_type7_cellEditing = Ext.create("Ext.grid.plugin.CellEditing", {
            clicksToEdit    : 2
        });

        var area_type7_grid = CP.ospf2_4.get_area_sub_grid(
            "area_type7_grid"
            ,CP.ospf2_4.AREA_SUB_GRID_WIDTH
            ,CP.ospf2_4.AREA_SUB_GRID_HEIGHT
            ,"area_type7_store"
            ,area_type7_cm
            ,area_type7_listeners
            ,Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : function() {
                        CP.ar_util.checkBtnsbar("area_type7_btnsbar");
                    }
                }
            })
            ,[ area_type7_cellEditing ]
        );

        return {
            xtype       : "cp4_formpanel"
            ,id         : "area_type7_grid_set"
            ,width      : 245
            ,margin     : "0 0 5 15"
            ,padding    : 0
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Type 7 Address Range"
                    ,margin     : "18 0 10 0"
                }
                ,area_type7_btnsbar
                ,area_type7_grid
            ]
        };
    }

//STUB:INTERFACE SECTION
    ,get_interface_set          : function() {
        var interface_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "interface_btnsbar"
            ,layout : "column"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "interface_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        if (Ext.getCmp("area_grid").store.getCount() <= 0) {
                            Ext.Msg.alert("No Areas", "Please add an area first.");
                            return;
                        }

                        Ext.getCmp("interface_grid").getSelectionModel().deselectAll();
                        CP.ar_util.clearParams();
                        CP.ospf2_4.open_interface_window("add");
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "interface_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var params = CP.ar_util.clearParams();
                        var sm = Ext.getCmp("interface_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        CP.ospf2_4.open_interface_window("Edit Interface "+ rec.data["interface"]);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "interface_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var params = CP.ar_util.clearParams();
                        var sm = Ext.getCmp("interface_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            b.deleteRecord(params, recs[i]);
                        }
                        if (recs.length > 0) {
                            Ext.getStore("ospf2_intf_store").remove(recs);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, rec) {
                        var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2";
                        var i;
                        var area = rec.data.area;
                        var intf = rec.data["interface"];

                        /*
                        if (Ext.getStore("vlink_store").findExact("transitarea", area) != -1) {
                            //check if there is another interface that will still cover this
                            if (CP.ospf2_4.get_count_intf_using_area(area) < 2) {
                                return false;
                            }
                        }
                        // */

                        //clear the interface's area
                        params[prefix +":interface:"+ intf +":area"] = "";
                        //prefix for most config values
                        var aprefix = prefix +":area:"+ area +":interface:"+ intf;

                        params[aprefix +":cost"]                = "";
                        params[aprefix +":hellointerval"]       = "";
                        params[aprefix +":passive"]             = "";
                        params[aprefix +":priority"]            = "";
                        params[aprefix +":retransmitinterval"]  = "";
                        params[aprefix +":routerdeadinterval"]  = "";
                        params[aprefix +":virtual"]             = "";
                        params[aprefix +":subtract-authlen"]    = "";

                        params[aprefix +":authtype"]            = "";
                        params[aprefix +":auth:null"]           = "";
                        params[aprefix +":auth:simple"]         = "";
                        params[aprefix +":auth:simple:password"]= "";
                        params[aprefix +":auth:md5"]            = "";
                        for(i = 0; i < rec.data.md5_list.length; i++) {
                            CP.ospf2_4.delete_md5_iw(
                                rec.data.md5_list[i].md5_key_id
                                ,area
                                ,intf
                            );
                        }
                        return true;
                    }
                },{
                    xtype   : "cp4_inlinemsg"
                    ,id     : "interface_area_msg"
                    ,text   : CP.ospf2_4.NoInterfaceOnBackboneAreaMsg
                    ,type   : "warning"
                    ,hidden : true
                    ,width  : 400
                }
            ]
        };

        var interface_cm = [
            {
                header          : "Interface"
                ,dataIndex      : "interface"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.intf_state.renderer_output(
                        value
                        ,value
                        ,"left"
                        ,"black"
                        ,value
                        ,"ipv4"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                header          : "Area"
                ,dataIndex      : "area"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.area_name;
                    var tipExtra = "";
                    var color = "black";
                    var intf_st = Ext.getStore("ospf2_intf_store");
                    var area_st = Ext.getStore("ospf2_area_store");
                    if (intf_st && intf_st.countNonBB && intf_st.countNonBB("","") > 1) {
                        color = "red";
                        retValue += "*";
                        tipExtra = "<br />"+ CP.ospf2_4.NoInterfaceOnBackboneAreaMsg;
                    }
                    if (area_st.findExact("area_info_area_id", value) == -1) {
                        color = "red";
                        retValue += " (Undefined Area)";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue + tipExtra, "left", color);
                }
            },{
                header          : "Hello Interval"
                ,dataIndex      : "hellointerval"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.hellointerval_eff) != "") {
                            retValue = String(rec.data.hellointerval_eff);
                        } else {
                            retValue = rec.data.isptp ? 30 : 10;
                        }
                    }
                    var suffix = (parseInt(retValue, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "Dead Interval"
                ,dataIndex      : "deadinterval"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.deadinterval_eff) != "") {
                            retValue = String(rec.data.deadinterval_eff);
                        } else {
                            retValue = rec.data.isptp ? 120 : 40;
                        }
                    }
                    var suffix = (parseInt(retValue, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "Retransmit Interval"
                ,dataIndex      : "rtxinterval"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.rtxinterval_eff) != "") {
                            retValue = String(rec.data.rtxinterval_eff);
                        } else {
                            retValue = 5;
                        }
                    }
                    var suffix = (parseInt(value, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "Election Priority"
                ,dataIndex      : "electionpriority"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        retValue = 1;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "OSPF Cost"
                ,dataIndex      : "cost"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        retValue = 1;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : "Use Virtual Address"
                ,dataIndex      : "virtualaddress"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "No";
                    if (value) {
                        retValue = "Yes";
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Authentication"
                ,dataIndex      : "authtype"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var v = String(value).toLowerCase();
                    var color = "black";
                    switch (v) {
                        case "md5":
                            var keycnt = rec.data.md5_list.length;
                            v = "MD5";
                            if (keycnt > 0) {
                                v += " ("+ keycnt +" key"+ (keycnt > 1 ? "s)" : ")");
                            }
                            break;
                        case "simple":
                            v = "Simple";
                            break;
                        default:
                            v = "None";
                            color = "grey";
                    }
                    return CP.ar_util.rendererSpecific(v, v, "left", color);
                }
            }
        ];

        var interface_grid = {
            xtype               : "cp4_grid"
            ,id                 : "interface_grid"
            ,width              : 1000
            ,height             : CP.ospf2_4.MAIN_GRID_HEIGHT
            ,forceFit           : true
            ,store              : Ext.getStore("ospf2_intf_store")
            ,columns            : interface_cm
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function() {
                        CP.ar_util.checkBtnsbar("interface_btnsbar");
                    }
                }
            })
            ,refresh            : function() {
                var g = this;
                if (g && g.getView) {
                    var v = g.getView();
                    if (v && v.refresh) {
                        v.refresh();
                    }
                }
            }
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,margin             : 0
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("interface_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            interface_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ interface_grid ]
            }
        ];
    }

    ,get_count_intf_using_area  : function(area) {
        //rec is the interface rec that I am counting the "area sibilings" of.
        var cnt = 0;
        var recs = Ext.getStore("ospf2_intf_store").getRange();

        var i;
        for(i = 0; i < recs.length; i++) {
            if (recs[i].data.area == area) {
                cnt++;
            }
        }
        return cnt;
        //cnt values:
            //0  - shouldn't ever occur
            //1  - only this rec (the param) uses the area, so it can't be deleted in the case of a vlink
            //2+ - at least 1 other interface entry is using this area
    }

    ,open_interface_window      : function(TITLE) {
        var interface_cmp;
        if (TITLE == "add") {
            TITLE = "Add Interface";
            interface_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "interface_iw"
                ,name           : "interface_unique"
                ,labelWidth     : 115
                ,width          : 125 + 175
                ,queryMode      : "local"
                ,editable       : true
                ,forceSelection : true
                ,triggerAction  : "all"
                ,style          : "margin-right:15px;"
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,listeners      : {
                    change          : function(c, newValue, oldValue, eOpts) {
                        function checkSetValue(cmpId, value) {
                            if (!value) { value = ""; }
                            var cmp = Ext.getCmp(cmpId);
                            if (cmp) {
                                if (cmp.setValue) {
                                    cmp.setValue(value);
                                } else if (cmp.setRawValue) {
                                    cmp.setRawValue(value);
                                }
                                if (cmp.validate) {
                                    cmp.validate();
                                }
                            }
                        }
                        var rec, idx;
                        rec = {
                            data    : {
                                "area"                      : "0.0.0.0"
                                ,"hellointerval"            : ""
                                ,"deadinterval"             : ""
                                ,"cost"                     : ""
                                ,"virtualaddress"           : ""
                                ,"electionpriority"         : "1"
                                ,"rtxinterval"              : ""
                                ,"passive"                  : ""
                                ,"subtract_authlen"         : ""
                                ,"authtype"                 : ""
                                ,"authtype_simple_password" : ""
                                ,"authtype_simple_password_existed" : ""
                                ,"md5_list"                 : []
                            }
                        };
                        if (newValue.startsWith("loop")) {
                            var auth_cmp = Ext.getCmp("authtype_iw");
                            if (auth_cmp) {
                                auth_cmp.value == "None";
                            }
                            toggleIntfFields(true);
                        } else if (oldValue && oldValue.startsWith("loop")) {
                            toggleIntfFields(false);
                        }
                        var if_st = Ext.getStore("ospf2_intf_store");
                        if (if_st) {
                            idx = if_st.findExact("interface", newValue, 0);
                            if (idx > -1) {
                                rec = if_st.findRecord("interface", newValue);
                            }
                        }

                        var f = Ext.getCmp("interface_form");
                        if (f && f.loadRecord) {
                            f.loadRecord(rec);
                        }
                        CP.ospf2_4.load_Interface_Window_Stores( rec );
                        var area_cmp = Ext.getCmp("area_iw");
                        if (area_cmp && area_cmp.validate) { area_cmp.validate(); }
                    }
                }
            };
        } else {
            //edit
            interface_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "interface_iw"
                ,name           : "interface"
                ,labelWidth     : 115
                ,width          : 125 + 175
                ,height         : 17
                ,style          : "margin-right:15px;"
            };
        }

        var md5_btnsbar_iw = {
            xtype   : "cp4_btnsbar"
            ,id     : "md5_iw_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "md5_iw_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("md5_grid_iw").getSelectionModel().deselectAll();
                        CP.ospf2_4.open_md5_iw_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "md5_iw_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_open_md5_iw_window
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("md5_grid_iw");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "md5_iw_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_delete_md5_iw
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("md5_grid_iw");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function before_open_md5_iw_window() {
            var md5_sm_iw = Ext.getCmp("md5_grid_iw").getSelectionModel();
            if (md5_sm_iw.getCount() == 1) {
                var rec = md5_sm_iw.getLastSelected();
                CP.ospf2_4.open_md5_iw_window("Edit MD5 Entry " + rec.data.md5_key_id);
            }
        }

        function before_delete_md5_iw() {
            var md5i_sm = Ext.getCmp("md5_grid_iw").getSelectionModel();
            if (md5i_sm.getCount() == 1) {
                var rec = md5i_sm.getLastSelected();
                if (!(rec.data.newrec)) {
                    CP.ospf2_4.delete_md5_iw(
                        rec.data.md5_key_id
                        ,Ext.getCmp("area_iw").getValue()
                        ,Ext.getCmp("interface_iw").getValue()
                    );
                }
                Ext.getStore("interface_md5_store").remove(rec);
            }
        }

        var md5_cm_iw = [
            {
                header          : "MD5 Key ID"
                ,dataIndex      : "md5_key_id"
                ,width          : 100
                ,sortable       : true
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "MD5 Secret"
                ,dataIndex      : "key"
                ,width          : 200
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "••••••••••••••••";
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var md5_grid_iw = {
            xtype               : "cp4_grid"
            ,id                 : "md5_grid_iw"
            ,margin             : 0
            ,width              : 300
            ,height             : 127
            ,autoScroll         : true
            ,forceFit           : true
            ,store              : Ext.getStore("interface_md5_store")
            ,columns            : md5_cm_iw
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var edit_btn    = Ext.getCmp("md5_iw_edit_btn");
                    var delete_btn  = Ext.getCmp("md5_iw_delete_btn");
                    if (0 == selections.length) {
                        edit_btn.disable();
                        delete_btn.disable();
                    } else {
                        edit_btn.enable();
                        delete_btn.enable();
                    }
                }
                ,itemdblclick       : before_open_md5_iw_window
            }
        };

        function toggleIntfFields(newValue) {
            var cmp;
            var fields = ["hello_iw", "dead_iw", "rtxinterval_iw",
                          "cost_iw", "electionpriority_iw",
                          "passive_iw", "virtualaddress_iw",
                          "subtract_authlen_iw", "authtype_iw"];

            fields.forEach(function(element) {
                cmp = Ext.getCmp(element);
                if (cmp) {
                    cmp.setDisabled(newValue);
                }
            });
        }

        function interface_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var rec = null;
            var area_cmp = Ext.getCmp("area_iw");
            if (area_cmp) {
                area_cmp.originalValue = "";
            }
            if (Ext.getCmp("interface_iw").getXType() == "cp4_displayfield") {
                //edit
                rec = Ext.getCmp("interface_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);

                if (Ext.getCmp("interface_iw").getValue().startsWith("loop")) {
                    toggleIntfFields(true);
                }
                Ext.getCmp("virtualaddress_iw").setValue(   String(rec.data.virtualaddress) );
                Ext.getCmp("passive_iw").setValue(          String(rec.data.passive) );

                var area = rec.data.area;
                var vlink_st = Ext.getStore("vlink_store");

                var area_cnt = (CP.ospf2_4.get_count_intf_using_area(area) == 1) ? true : false;
                //if true: only 1 interface uses this area
                var in_vlink_use = (vlink_st.findExact("transitarea",area) != -1) ? true : false;
                //if true: 1+ vlinks use this area
                if (area_cmp) {
                    area_cmp.setDisabled(in_vlink_use && area_cnt);
                    area_cmp.originalValue = rec.data.area;
                }

                // password: needed, or already set?
                var passex = rec.data.authtype_simple_password_existed;
                var passob = Ext.getCmp("simple_pass_iw");
                if (passob) {
                    passob.allowBlank = passex ? true : false;
                    passob.emptyText = passex ? "Key is set" : "";
                    if (passob.reset) passob.reset();
                    if (passob.validate) passob.validate();
                }
            }
            CP.ospf2_4.load_Interface_Window_Stores( rec );
            Ext.getCmp("md5_grid_iw").getView().refresh();
            if (p && p.chkBtns) { p.chkBtns(); }
        }

        var interface_form_obj = {
            xtype       : "cp4_formpanel"
            ,id         : "interface_form"
            ,autoScroll : true
            ,height     : 468
            ,width      : 647
            ,listeners  : {
                afterrender     : interface_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("interface_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("interface_save_btn");
                CP.ar_util.checkDisabledBtn("interface_cancel_btn");
                CP.ar_util.checkBtnsbar("md5_iw_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "interface_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        interface_save(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("interface_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("interface_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "interface_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("interface_window");
                        CP.ar_util.clearParams();
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            if (Ext.getCmp("interface_iw").validate) {
                                Ext.getCmp("interface_iw").validate();
                            }
                            Ext.getCmp("area_iw").validate();
                            Ext.getCmp("hello_iw").validate();
                            Ext.getCmp("dead_iw").validate();
                            Ext.getCmp("rtxinterval_iw").validate();
                            Ext.getCmp("cost_iw").validate();
                            Ext.getCmp("electionpriority_iw").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,id         : "interface_inner_form"
                    ,width      : 615
                    ,margin     : "15 0 15 15"
                    ,autoScroll : false
                    ,defaults   : {
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,width      : 615
                        ,autoScroll : false
                    }
                    ,items      : [
                        { //interface, area
                            items   : [
                                interface_cmp      //id: "interface_iw", name: "interface"
                                ,{
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Area"
                                    ,id             : "area_iw"
                                    ,name           : "area"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 175
                                    ,mode           : "local"
                                    ,editable       : true
                                    ,forceSelection : true
                                    ,triggerAction  : "all"
                                    ,store          : Ext.getStore("ospf2_area_store")
                                    ,value          : "0.0.0.0"
                                    ,valueField     : "area_info_area_id"
                                    ,displayField   : "area_info_display_name"
                                    ,allowBlank     : false
                                    ,validator      : function() {
                                        var c = this;
                                        var area = String( c.getValue() );
                                        if (area == "") {
                                            return "";
                                        }
                                        var intf_st = Ext.getStore("ospf2_intf_store");
                                        var intfCmp = Ext.getCmp("interface_iw");
                                        var intf = intfCmp ? intfCmp.getValue() : "";

                                        var nonBB = ( (intf_st && intf_st.countNonBB) ? intf_st.countNonBB(intf, area) : 2 );
                                        if (nonBB < 2) {
                                            return true;
                                        }
                                        return CP.ospf2_4.NoInterfaceOnBackboneAreaMsg;
                                    }
                                }
                            ]
                        },{ //hello, dead
                            layout  : {
                                type    : "hbox"
                            }
                            ,items  : [
                                {
                                    xtype   : "cp4_formpanel"
                                    ,layout : "column"
                                    ,width  : 315
                                    ,items  : [
                                        {
                                            xtype           : "cp4_numberfield"
                                            ,fieldLabel     : "Hello Interval"
                                            ,id             : "hello_iw"
                                            ,name           : "hellointerval"
                                            ,emptyText      : "Default: 10 or 30"
                                            ,value          : ""
                                            ,minValue       : 1
                                            ,maxValue       : 65535
                                            ,maxLength      : 5
                                            ,enforceMaxLength   : true
                                            ,allowBlank     : true
                                            ,allowDecimals  : false
                                            ,labelWidth     : 115
                                            ,width          : 125 + 115
                                            ,style          : "margin-right:10px;"
                                            ,getDefValue    : function() {
                                                var if_st = Ext.getStore("intf_store");
                                                var intf = Ext.getCmp("interface_iw").getValue();
                                                if ( if_st && if_st.isP2P && if_st.isP2P(intf) ) {
                                                    return 30;
                                                }
                                                return 10;
                                            }
                                            ,listeners      : {
                                                change          : function() {
                                                    var d = Ext.getCmp("dead_iw");
                                                    if (d && d.validate) {
                                                        d.validate();
                                                    }
                                                }
                                                ,blur           : function() {
                                                    var d = Ext.getCmp("dead_iw");
                                                    if (d && d.validate) {
                                                        d.validate();
                                                    }
                                                }
                                            }
                                            ,validator      : function(value) {
                                                var h_cmp = Ext.getCmp("hello_iw");
                                                var hello = h_cmp ? h_cmp.getRawValue() : "";
                                                if (hello == "") {
                                                    hello = 10;
                                                    if (h_cmp && h_cmp.getDefValue) {
                                                        hello = h_cmp.getDefValue();
                                                    }
                                                } else {
                                                    hello = parseInt(hello, 10);
                                                }

                                                var d_cmp = Ext.getCmp("dead_iw");
                                                var dead = d_cmp ? d_cmp.getRawValue() : "";
                                                if (dead == "") {
                                                    dead = 40;
                                                    if (d_cmp && d_cmp.getDefValue) {
                                                        dead = d_cmp.getDefValue();
                                                    }
                                                } else {
                                                    dead = parseInt(dead, 10);
                                                }

                                                if (hello >= dead) {
                                                    return "Hello Interval must be less than Dead Interval";
                                                }

                                                var c = this;
                                                var v = c.getValue();
                                                if (value != "" && (v < c.minValue || c.maxValue < v) ) {
                                                    return "";
                                                }

                                                return true;
                                            }
                                        },{
                                            xtype   : "cp4_label"
                                            ,text   : "seconds"
                                            ,style  : "margin-top:4px;"
                                        }
                                    ]
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,layout : "column"
                                    ,width  : 300
                                    ,items  : [
                                        {
                                            xtype           : "cp4_numberfield"
                                            ,fieldLabel     : "Dead Interval"
                                            ,id             : "dead_iw"
                                            ,name           : "deadinterval"
                                            ,emptyText      : "Default: 40 or 120"
                                            ,value          : ""
                                            ,minValue       : 1
                                            ,maxValue       : 65535
                                            ,maxLength      : 5
                                            ,enforceMaxLength   : true
                                            ,allowBlank     : true
                                            ,allowDecimals  : false
                                            ,labelWidth     : 115
                                            ,width          : 125 + 115
                                            ,style          : "margin-right:10px;"
                                            ,getDefValue    : function() {
                                                var if_st = Ext.getStore("intf_store");
                                                var intf = Ext.getCmp("interface_iw").getValue();
                                                if ( if_st && if_st.isP2P && if_st.isP2P(intf) ) {
                                                    return 120;
                                                }
                                                return 40;
                                            }
                                            ,listeners      : {
                                                change          : function() {
                                                    var h = Ext.getCmp("hello_iw");
                                                    if (h && h.validate) {
                                                        h.validate();
                                                    }
                                                }
                                                ,blur           : function() {
                                                    var h = Ext.getCmp("hello_iw");
                                                    if (h && h.validate) {
                                                        h.validate();
                                                    }
                                                }
                                            }
                                            ,validator      : function(value) {
                                                var h_cmp = Ext.getCmp("hello_iw");
                                                var hello = h_cmp ? h_cmp.getRawValue() : "";
                                                if (hello == "") {
                                                    hello = 10;
                                                    if (h_cmp && h_cmp.getDefValue) {
                                                        hello = h_cmp.getDefValue();
                                                    }
                                                } else {
                                                    hello = parseInt(hello, 10);
                                                }

                                                var d_cmp = Ext.getCmp("dead_iw");
                                                var dead = d_cmp ? d_cmp.getRawValue() : "";
                                                if (dead == "") {
                                                    dead = 40;
                                                    if (d_cmp && d_cmp.getDefValue) {
                                                        dead = d_cmp.getDefValue();
                                                    }
                                                } else {
                                                    dead = parseInt(dead, 10);
                                                }

                                                if (hello >= dead) {
                                                    return "Dead Interval must be greater than Hello Interval";
                                                }

                                                var c = this;
                                                var v = c.getValue();
                                                if (value != "" && (v < c.minValue || c.maxValue < v) ) {
                                                    return "";
                                                }

                                                return true;
                                            }
                                        },{
                                            xtype   : "cp4_label"
                                            ,text   : "seconds"
                                            ,style  : "margin-top:4px;"
                                        }
                                    ]
                                }
                            ]
                        },{ //Retransmit
                            items   : [
                                {
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "Retransmit Interval"
                                    ,id             : "rtxinterval_iw"
                                    ,name           : "rtxinterval"
                                    ,emptyText      : "Default: 5"
                                    ,value          : ""
                                    ,minValue       : 1
                                    ,maxValue       : 65535
                                    ,maxLength      : 5
                                    ,enforceMaxLength   : true
                                    ,allowBlank     : true
                                    ,allowDecimals  : false
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,style          : "margin-right:10px;"
                                },{
                                    xtype   : "cp4_label"
                                    ,text   : "seconds"
                                    ,style  : "margin-top:4px;"
                                }
                            ]
                        },{ //cost, election
                            items   : [
                                {
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "OSPF Cost"
                                    ,id             : "cost_iw"
                                    ,name           : "cost"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,emptyText      : "Default: 1"
                                    ,value          : ""
                                    ,minValue       : 1
                                    ,maxValue       : 65535
                                    ,maxLength      : 5
                                    ,enforceMaxLength   : true
                                    ,allowDecimals  : false
                                    ,allowBlank     : true
                                    ,style          : "margin-right:75px;"
                                },{
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "Election Priority"
                                    ,id             : "electionpriority_iw"
                                    ,name           : "electionpriority"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,emptyText      : "Default: 1"
                                    ,value          : 1
                                    ,minValue       : 0
                                    ,maxValue       : 255
                                    ,maxLength      : 3
                                    ,enforceMaxLength   : true
                                    ,allowDecimals  : false
                                    ,allowBlank     : true
                                }
                            ]
                        },{
                            items   : [
                                {
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Passive"
                                    ,id             : "passive_iw"
                                    ,name           : "passive"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 175
                                    ,height         : 22
                                    ,style          : "margin-right:15px;"
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Use Virtual Address"
                                    ,id             : "virtualaddress_iw"
                                    ,name           : "virtualaddress"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 125
                                    ,height         : 22
                                }
                            ]
                        },{
                            items   : [
                                {
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Subtract Authlen"
                                    ,id             : "subtract_authlen_iw"
                                    ,name           : "subtract_authlen"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 175
                                    ,height         : 22
                                    ,style          : "margin-right:15px;"
                                }
                            ]
                        },{
                            items   : [
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Authentication Type"
                                    ,id             : "authtype_iw"
                                    ,name           : "authtype"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,mode           : "local"
                                    ,editable       : true
                                    ,forceSelection : true
                                    ,triggerAction  : "all"
                                    ,value          : ""
                                    ,style          : "margin-right:75px;margin-bottom:0px;"
                                    ,store          :   [[""        ,"None"]
                                                        ,["simple"  ,"Simple"]
                                                        ,["md5"     ,"MD5"]]
                                    ,listeners      : {
                                        change          : function() {
                                            var mode = this.value.toLowerCase();
                                            var simple_pass = Ext.getCmp("simple_pass_iw");
                                            var md5_set_iw  = Ext.getCmp("md5_set_iw");

                                            simple_pass.setVisible( mode == "simple");
                                            simple_pass.setDisabled(mode != "simple");
                                            simple_pass.validate();
                                            md5_set_iw.setVisible(  mode == "md5");
                                            md5_set_iw.setDisabled( mode != "md5");

                                            //var f_height = (mode == "md5") ? 415 : 200;
                                            //var f_height = Ext.getCmp("interface_inner_form").getHeight() + 35;
                                            var f_height = (mode == "md5") ? 391 : 187;
                                            var i_form  = Ext.getCmp("interface_form");
                                            var i_win   = Ext.getCmp("interface_window");
                                            if (i_win && i_form && false) {
                                                //TODO figure out why the initial open seems to screw up
                                                i_form.setHeight(f_height);
                                                i_win.setHeight(f_height + 40 + 2 + 20 + 15);
                                            }
                                        }
                                    }
                                },{
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Simple Password"
                                    ,id             : "simple_pass_iw"
                                    ,name           : "authtype_simple_password"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 175
                                    ,inputType      : "password"
                                    ,maxLength      : 8
                                    ,enforceMaxLength   : true
                                    ,allowBlank     : false
                                    ,style          : "margin-bottom:0px;"
                                    ,maskRe         : /[^\\ ]/
                                    ,stripCharsRe   : /[\\ ]/
                                    ,qtipText       : "Up to 8 characters, no spaces or \'\\\'."
                                    ,listeners      : {
                                        afterrender     : function(tf, eOpts) {
                                            if (tf.qtipText && tf.qtipText.length > 0) {
                                                Ext.tip.QuickTipManager.register({
                                                    target          : tf.getId()
                                                    ,text           : tf.qtipText
                                                    ,dismissDelay   : 0
                                                });
                                            }
                                        }
                                    }
                                }
                            ]
                        },{
                            xtype           : "cp4_formpanel"
                            ,layout         : "anchor"
                            ,width          : 300
                            ,autoScroll     : false
                            ,id             : "md5_set_iw"
                            ,margin         : 0
                            ,items          : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "MD5 List"
                                    ,margin     : "18 0 10 0"
                                }
                                ,md5_btnsbar_iw
                                ,md5_grid_iw
                            ]
                        }
                    ]
                }
            ]
        };
        var interface_form = Ext.create("CP.WebUI4.FormPanel", interface_form_obj);

        var interface_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "interface_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                    Ext.getCmp("authtype_iw").fireEvent("change");
                }
            }
            ,items      : [ interface_form ]
        });
        interface_window.sequenceFx();
        interface_window.show();
        interface_window.syncFx();

        function interface_save() {
            var params = CP.ar_util.getParams();
            var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2";
            var i;
            var areaCmp             = Ext.getCmp("area_iw");
            var area                = String(areaCmp.getValue());
            var old_area            = areaCmp.originalValue;
            var intfCmp             = Ext.getCmp("interface_iw");
            var intf                = intfCmp.getValue();

            //keep areachange_prefix empty unless we have an area change
            var areachange_prefix = "";

            var areaOV;
            var area_recs = Ext.getStore("ospf2_area_store").getRange();
            for(i = 0; i < area_recs.length; i++) {
                areaOV = String(area_recs[i].data.area_info_area_id);
                if (area != areaOV) {
                    params["SPECIAL:"+ prefix + ":area:" + areaOV +":interface:"+ intf] = "";
                }
            }
            if (old_area != "" && area != old_area) {
                areachange_prefix = "SPECIAL:"+ CP.ar_util.INSTANCE() +":areachange:auth";
            }

            //param to tell the interface which area it is on
            params[prefix +":interface:"+ intf +":area"] = area;
            //prefix for most config values
            var aprefix = prefix +":area:"+ area +":interface:"+ intf;

            var cost                = Ext.getCmp("cost_iw").getRawValue();
            var hellointerval       = Ext.getCmp("hello_iw").getRawValue();
            var passive             = (Ext.getCmp("passive_iw").getValue()) ? "t" : "";
            var priority            = Ext.getCmp("electionpriority_iw").getValue();
            var retransmitinterval  = Ext.getCmp("rtxinterval_iw").getRawValue();
            var routerdeadinterval  = Ext.getCmp("dead_iw").getRawValue();
            var virtual             = (Ext.getCmp("virtualaddress_iw").getValue()) ? "t" : "";
            var subtract_authlen    = (Ext.getCmp("subtract_authlen_iw").getValue()) ? "t" : "";

            var authtype            = Ext.getCmp("authtype_iw").getValue().toLowerCase();
            if (authtype == "") {
                authtype = "null";
            }
            var md5_recs            = Ext.getStore("interface_md5_store").getRange();

            params[aprefix +":cost"]                = cost;
            params[aprefix +":hellointerval"]       = hellointerval;
            params[aprefix +":passive"]             = passive;
            params[aprefix +":priority"]            = priority;
            params[aprefix +":retransmitinterval"]  = retransmitinterval;
            params[aprefix +":routerdeadinterval"]  = routerdeadinterval;
            params[aprefix +":virtual"]             = virtual;
            params[aprefix +":subtract-authlen"]    = subtract_authlen;

            params[aprefix +":authtype"] = authtype;
            switch(authtype) {
                case "md5":
                    params[aprefix +":auth:null"]           = "";
                    params[aprefix +":auth:simple"]         = "";
                    params[aprefix +":auth:simple:password"]= "";
                    params[aprefix +":auth:md5"]            = "t";
                    var md5_prefix = aprefix +":auth:md5:keyid";
                    var r;
                    for(i = 0; i < md5_recs.length; i++) {
                        r = md5_recs[i].data;
                        params[md5_prefix +":"+ r.md5_key_id]           = "t";
                        var n = md5_prefix +":"+ r.md5_key_id +":key";
                        var n2 = n.replace(/^routed:/, ":routed:obscure:");
                        delete(params[n]);
                        if (r.key != "") {
                            params[n2]                                  = r.key;
                        } else if (areachange_prefix != "") {
                            params[areachange_prefix +":"+ r.md5_key_id] =
                                intf +"_"+ old_area +"_"+ area +"_"+ r.md5_key_id;
                        }
                    }
                    break;
                case "simple":
                    params[aprefix +":auth:null"]           = "";
                    params[aprefix +":auth:simple"]         = "t";
                    var n = aprefix +":auth:simple:password";
                    var n2 = n.replace(/^routed:/, ":routed:obscure:");
                    var v = Ext.getCmp("simple_pass_iw").getValue();
                    delete(params[n]);
                    if (v != "") {
                        params[n2]                          = v;
                    } else if (areachange_prefix != "") {
                        params[areachange_prefix +":simple"] =
                            intf +"_"+ old_area +"_"+ area +"_simple";
                    }
                    params[aprefix +":auth:md5"]            = "";
                    for(i = 0; i < md5_recs.length; i++) {
                        CP.ospf2_4.delete_md5_iw(
                            md5_recs[i].data.md5_key_id
                            ,area
                            ,intf
                        );
                    }
                    break;
                default:
                    params[aprefix +":auth:null"]   = "t";
                    params[aprefix +":auth:simple"] = "";
                    params[aprefix +":auth:simple:password"] = "";
                    params[aprefix +":auth:md5"]    = "";
                    for(i = 0; i < md5_recs.length; i++) {
                        CP.ospf2_4.delete_md5_iw(
                            md5_recs[i].data.md5_key_id
                            ,area
                            ,intf
                        );
                    }
            }
            CP.ar_util.mySubmit();
        }
    }

    ,open_md5_iw_window         : function(TITLE) {
        var md5_labelWidth  = 100;
        var md5_width       = 235;
        var md5_key_id_cmp;
        if (TITLE == "add") {
            TITLE = "Add MD5 Entry";
            md5_key_id_cmp = { //numberfield
                xtype           : "cp4_numberfield"
                ,fieldLabel     : "MD5 Key ID"
                ,id             : "md5_key_id_md5i" //md5i = md5 for interface
                ,name           : "md5_key_id"
                ,labelWidth     : md5_labelWidth
                ,width          : md5_width
                ,minValue       : 1
                ,maxValue       : 255
                ,maxLength      : 3
                ,enforceMaxLength   : true
                ,allowBlank     : false
                ,allowDecimals  : false
                ,style          : "margin-left:15px;margin-right:15px;"
                ,validator      : function(v) {
                    var value = Ext.getCmp("md5_key_id_md5i").getValue();
                    if (value == "") {
                        return "";
                    }
                    value = parseInt(value,10);
                    if (Ext.getStore("interface_md5_store").findExact("md5_key_id", value) > -1) {
                        return "MD5 Key ID must be unique.";
                    }
                    return true;
                }
            };
        } else {
            md5_key_id_cmp = { //displayfield
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "MD5 Key ID"
                ,id             : "md5_key_id_md5i"
                ,name           : "md5_key_id"
                ,labelWidth     : md5_labelWidth
                ,width          : md5_width
                ,height         : 18
                ,style          : "margin-left:15px;margin-right:15px;"
            };
        }

        function md5i_afterrender(p, eOpts) {
            p.form._boundItems = null;
            if (Ext.getCmp("md5_key_id_md5i").getXType() == "cp4_numberfield") {
                //add
                Ext.getCmp("key_md5i").blankText = "This field is required"; // blankText is not the same as emptyText, whee
                Ext.getCmp("key_md5i").validate();
                Ext.getCmp("md5_key_id_md5i").focus();
            } else {
                //edit
                var rec = Ext.getCmp("md5_grid_iw").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                Ext.getCmp("key_md5i").blankText = "'Cancel' to leave this key unchanged"; // blankText is not the same as emptyText, whee
                Ext.getCmp("key_md5i").validate();
                Ext.getCmp("key_md5i").focus();
            }
            if (p.chkBtns) { p.chkBtns(); }
        }

        var md5i_form = {
            xtype       : "cp4_formpanel"
            ,id         : "md5i_form"
            ,autoScroll : false
            ,listeners  : {
                afterrender     : md5i_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("md5i_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("md5i_save_btn");
                CP.ar_util.checkDisabledBtn("md5i_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "md5i_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        md5i_save(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("md5i_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("md5i_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "md5i_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("md5i_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("key_md5i").validate();
                            Ext.getCmp("md5_key_id_md5i").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "tbspacer"
                    ,height     : 15
                }
                ,md5_key_id_cmp
                ,{
                    xtype       : "cp4_textfield"
                    ,fieldLabel : "MD5 Key"
                    ,id         : "key_md5i"
                    ,name       : "key"
                    ,labelWidth : md5_labelWidth
                    ,width      : md5_width
                    ,inputType  : "password"
                    ,allowBlank : false
                    ,maxLength  : 16
                    ,enforceMaxLength   : false
                    ,style      : "margin-left:15px;margin-right:15px;"
                    ,maskRe         : /[^\\ ]/
                    ,stripCharsRe   : /[\\ ]/
                    ,qtipText       : "Up to 16 characters, no spaces or \'\\\'."
                    ,listeners      : {
                        afterrender     : function(tf, eOpts) {
                            if (tf.qtipText && tf.qtipText.length > 0) {
                                Ext.tip.QuickTipManager.register({
                                    target          : tf.getId()
                                    ,text           : tf.qtipText
                                    ,dismissDelay   : 0
                                });
                            }
                        }
                    }
                },{
                    xtype       : "tbspacer"
                    ,height     : 15
                }
            ]
        };

        function md5i_save() {
            if (Ext.getCmp("md5_key_id_md5i").getXType() == "cp4_numberfield") {
                Ext.getStore("interface_md5_store").add({
                    "md5_key_id"    : Ext.getCmp("md5_key_id_md5i").getValue()
                    ,"key"          : Ext.getCmp("key_md5i").getValue()
                    ,"newrec"       : true
                });
            } else {
                var rec = Ext.getCmp("md5_grid_iw").getSelectionModel().getLastSelected();
                rec.data.key = Ext.getCmp("key_md5i").getValue();
            }
            Ext.getCmp("md5_grid_iw").getView().refresh();
            CP.ar_util.checkWindowClose("md5i_window");
        }

        var md5i_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "md5i_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ md5i_form ]
        });
        md5i_window.show();
    }

//DELETE MD5 (for interface and vlink)
    ,delete_md5                 : function(params, prefix) {
        params[prefix]                      = "";
        params[prefix +":key"]              = "";
        /*
        params[prefix +":startaccept"]      = "";
        params[prefix +":startgenerate"]    = "";
        params[prefix +":stopaccept"]       = "";
        params[prefix +":stopgenerate"]     = "";
        */
    }
    ,delete_md5_iw              : function(md5_key_id, area, intf) {
        var params  = CP.ar_util.getParams();
        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":ospf2:area:"
                    + area +":interface:"+ intf
                    + ":auth:md5:keyid:"+ md5_key_id;
        CP.ospf2_4.delete_md5(params, prefix);
    }
    ,delete_md5_vw              : function(md5_key_id, remoterid, transitarea) {
        var params  = CP.ar_util.getParams();
        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE()
                    + ":ospf2:area:0.0.0.0:virtuallink:remoterid:"
                    + remoterid +":transitarea:"+ transitarea
                    + ":auth:md5:keyid:"+ md5_key_id;
        CP.ospf2_4.delete_md5(params, prefix);
    }

//STUB:VIRTUAL SECTION
    ,get_virtual_set            : function() {
        var vlink_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "vlink_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "vlink_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var area_st = Ext.getStore("ospf2_area_store");
                        if (area_st.findExact("area_info_area_id",
                                    "0.0.0.0") == -1) {
                            Ext.Msg.alert("No Areas", "Please add area \"Backbone\" first.");
                            return;
                        }

                        Ext.getCmp("vlink_grid").getSelectionModel().deselectAll();
                        CP.ar_util.clearParams();
                        CP.ospf2_4.open_vlink_window("add");
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        return !m;
                    }
                },{
                    text                : "Edit"
                    ,id                 : "vlink_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var sm = Ext.getCmp("vlink_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var rr = String(rec.data.remoterid);
                        var ta = String(rec.data.transitarea_display_name);
                        var d_b = Ext.getCmp("vlink_delete_btn");
                        if ( d_b && d_b.deleteRecord(params, rec) ) {
                            CP.ospf2_4.open_vlink_window("Edit Virtual Link "+ rr +" via "+ ta);
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("vlink_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "vlink_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var sm = Ext.getCmp("vlink_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            b.deleteRecord(params, recs[i]);
                        }
                        if (recs.length > 0) {
                            Ext.getStore("vlink_store").remove(recs);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ospf2_configPanel");
                        if (!m) { return true; }
                        var g = Ext.getCmp("vlink_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteRecord       : function(params, rec) {
                        var remoterid   = rec.data.remoterid;
                        var transitarea = rec.data.transitarea;
                        var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE()
                                        + ":ospf2:area:0.0.0.0:virtuallink:remoterid:"
                                        + remoterid;
                        var ta_prefix   = prefix +":transitarea:"+ transitarea;
                        var i;

                        params[prefix]      = "";
                        params[ta_prefix]   = "";

                        params[ta_prefix +":hellointerval"]         = "";
                        params[ta_prefix +":retransmitinterval"]    = "";
                        params[ta_prefix +":routerdeadinterval"]    = "";

                        params[ta_prefix +":authtype"]              = "";
                        params[ta_prefix +":auth:simple"]           = "";
                        params[ta_prefix +":auth:simple:password"]  = "";
                        params[ta_prefix +":auth:md5"]              = "";
                        params[ta_prefix +":auth:null"]             = "";

                        for(i = 0; i < rec.data.vlinks_md5_list.length; i++) {
                            CP.ospf2_4.delete_md5_vw(
                                rec.data.vlinks_md5_list[i].md5_key_id
                                ,remoterid
                                ,transitarea
                            );
                        }
                        return true;
                    }
                }
            ]
        };

        var vlink_cm = [
            {
                header          : 'Remote Router ID'
                ,dataIndex      : "remoterid"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : 'Transit Area'
                ,dataIndex      : "transitarea"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.transitarea_display_name;
                    var color = "black";
                    var area_st = Ext.getStore("ospf2_area_store");
                    var intf_st = Ext.getStore("ospf2_intf_store");
                    if ( area_st.findExact("area_info_area_id", value) == -1 ) {
                        color = "red";
                        retValue += " (Undefined Area)";
                    } else if ( intf_st.findExact("area", value) == -1 ) {
                        color = "red";
                        retValue += " (No Interface)";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : 'Hello Interval'
                ,dataIndex      : "vlinks_hellointerval"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.vlinks_hellointerval_eff) != "") {
                            retValue = String(rec.data.vlinks_hellointerval_eff);
                        } else {
                            retValue = 30;
                        }
                    }
                    var suffix = (parseInt(value, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : 'Dead Interval'
                ,dataIndex      : "vlinks_deadinterval"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.vlinks_deadinterval_eff) != "") {
                            retValue = String(rec.data.vlinks_deadinterval_eff);
                        } else {
                            retValue = 120;
                        }
                    }
                    var suffix = (parseInt(value, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                header          : 'Retransmit Interval'
                ,dataIndex      : "vlinks_rtxinterval"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        color = "grey";
                        if (String(rec.data.vlinks_rtxinterval_eff) != "") {
                            retValue = String(rec.data.vlinks_rtxinterval_eff);
                        } else {
                            retValue = 5;
                        }
                    }
                    var suffix = (parseInt(value, 10) == 1) ? " second" : " seconds";
                    retValue = retValue + suffix;
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            }
        ];

        var vlink_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vlink_grid"
            ,width              : 600
            ,height             : CP.ospf2_4.MAIN_GRID_HEIGHT
            ,forceFit           : true
            ,store              : Ext.getStore("vlink_store")
            ,columns            : vlink_cm
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function() {
                        CP.ar_util.checkBtnsbar("vlink_btnsbar");
                    }
                }
            })
            ,refresh            : function() {
                var g = this;
                if (g && g.getView) {
                    var v = g.getView();
                    if (v && v.refresh) {
                        v.refresh();
                    }
                }
            }
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,margin             : 0
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("vlink_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            vlink_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ vlink_grid ]
            }
        ];
    }

    ,open_vlink_window              : function(TITLE) {

        function get_variable_remoterid() {
            return {
                xtype           : "cp4_ipv4field"
                ,fieldLabel     : "Remote Router ID"
                ,id             : "remoterid_vw"
                ,name           : "remoterid"
                ,labelWidth     : 115
                ,width          : 115 + 135 // 250
                ,style          : "margin-right:50px;" //300 "width"
                ,allowBlank     : false
                ,fieldConfig    : {
                    allowBlank  : false
                }
                ,octetsConfig   : [{ minValue: 0 }, {}, {}, {}]
            };
        }
        function get_constant_remoterid() {
            return {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Remote Router ID"
                ,id             : "remoterid_vw"
                ,name           : "remoterid"
                ,labelWidth     : 115
                ,width          : 300
                ,height         : 22
            };
        }

        function get_variable_transitarea() {
            return {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Transit Area"
                ,id             : "transitarea_vw"
                ,name           : "transitarea"
                ,labelWidth     : 115
                ,width          : 300
                ,queryMode      : "local"
                ,editable       : true
                ,forceSelection : true
                ,triggerAction  : "all"
                ,store          : Ext.getStore("transitarea_store")
                ,valueField     : "transitarea"
                ,displayField   : "transitarea_display_name"
                ,allowBlank     : false
                ,style          : "margin-left:15px;"
                ,validator      : function(value) {
                    var c = this;
                    value = String(value);
                    if (this.getStore) {
                        var st = this.getStore();
                        if (st.getCount() < 1) {
                            return "No Areas in Store.";
                        }
                    }
                    return (value != "");
                }
            };
        }
        function get_constant_transitarea() {
            return {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Transit Area"
                ,id             : "transitarea_vw"
                ,name           : "transitarea"
                ,labelWidth     : 115
                ,width          : 150 + 150
                ,height         : 22
                ,style          : "margin-left:15px;"
            };
        }

        var remoterid_vw;
        var transitarea_vw;
        if (TITLE == "add") {
            //new needs ipv4field and combobox
            TITLE = "Add Virtual Link";
            remoterid_vw    = get_variable_remoterid();
            transitarea_vw  = get_variable_transitarea();
        } else {
            //edit, pair of displayfields
            remoterid_vw    = get_variable_remoterid();
            transitarea_vw  = get_variable_transitarea();
        }

        var md5_btnsbar_vw = {
            xtype   : "cp4_btnsbar"
            ,id     : "md5_vw_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "md5_vw_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("md5_grid_vw").getSelectionModel().deselectAll();
                        CP.ospf2_4.open_md5_vw_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "md5_vw_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_open_md5_vw_window
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("md5_grid_vw");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "md5_vw_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_delete_md5_vw
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("md5_grid_vw");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function before_open_md5_vw_window() {
            var md5_sm_vw = Ext.getCmp("md5_grid_vw").getSelectionModel();
            if (md5_sm_vw.getCount() == 1) {
                var rec = md5_sm_vw.getLastSelected();
                CP.ospf2_4.open_md5_vw_window("Edit MD5 Entry " + rec.data.md5_key_id);
            }
        }

        function before_delete_md5_vw() {
            var md5v_sm = Ext.getCmp("md5_grid_vw").getSelectionModel();
            if (md5v_sm.getCount() == 1) {
                var rec = md5v_sm.getLastSelected();
                if (!(rec.data.newrec)) {
                    CP.ospf2_4.delete_md5_vw(
                        rec.data.md5_key_id
                        ,Ext.getCmp("remoterid_vw").getValue()
                        ,Ext.getCmp("transitarea_vw").getValue()
                    );
                }
                Ext.getStore("vlink_md5_store").remove(rec);
            }
        }

        var md5_cm_vw = [
            {
                header          : "MD5 Key ID"
                ,dataIndex      : "md5_key_id"
                ,width          : 100
                ,sortable       : true
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "MD5 Secret"
                ,dataIndex      : "key"
                ,width          : 200
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "••••••••••••••••";
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var md5_grid_vw = {
            xtype               : "cp4_grid"
            ,id                 : "md5_grid_vw"
            ,width              : 300
            ,autoScroll         : true
            ,forceFit           : true
            ,store              : Ext.getStore("vlink_md5_store")
            ,columns            : md5_cm_vw
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,margin             : 0
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var edit_btn    = Ext.getCmp("md5_vw_edit_btn");
                    var delete_btn  = Ext.getCmp("md5_vw_delete_btn");
                    if (0 == selections.length) {
                        edit_btn.disable();
                        delete_btn.disable();
                    } else {
                        edit_btn.enable();
                        delete_btn.enable();
                    }
                }
                ,itemdblclick       : before_open_md5_vw_window
            }
        };

        function vlink_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var rec = null;
            var sm  = Ext.getCmp("vlink_grid").getSelectionModel();
            var remoteridCmp = Ext.getCmp("remoterid_vw");
            if (remoteridCmp) {
                remoteridCmp.originalValue = "";
            }
            var transitCmp = Ext.getCmp("transitarea_vw");
            if (transitCmp) {
                transitCmp.originalValue = "";
            }

            //if (Ext.getCmp("remoterid_vw").getXType() == "cp4_displayfield") {
            if (sm.getCount() == 1) {
                //edit
                rec = sm.getLastSelected();
                p.loadRecord(rec);

                if (remoteridCmp) {
                    remoteridCmp.setValue(    rec.data.remoterid );
                    remoteridCmp.originalValue = rec.data.remoterid;
                }
                if (transitCmp) {
                    transitCmp.originalValue = rec.data.transitarea;
                }

                var passex = rec.data.vlinks_authtype_simple_password_existed;
                var passob = Ext.getCmp("simple_pass_vw");
                if (passob) {
                    passob.allowBlank = passex ? true : false;
                    passob.emptyText = passex ? "Key is set" : "";
                    if (passob.reset) passob.reset();
                    if (passob.validate) passob.validate();
                }
            }
            CP.ospf2_4.load_Vlink_Window_Stores(rec);
            Ext.getCmp("md5_grid_vw").getView().refresh();

            Ext.getCmp("hello_vw").validate();
            Ext.getCmp("dead_vw").validate();
            Ext.getCmp("rtxinterval_vw").validate();
            if (p.chkBtns) { p.chkBtns(); }
        }

        var vlink_form = {
            xtype       : "cp4_formpanel"
            ,id         : "vlink_form"
            ,autoScroll : true
            ,height     : 345
            ,width      : 647
            ,listeners  : {
                afterrender     : vlink_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("vlink_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("vlink_save_btn");
                CP.ar_util.checkDisabledBtn("vlink_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "vlink_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        vlink_save(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("vlink_form");
                        return !f;
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("vlink_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "vlink_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("vlink_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("remoterid_vw").validate();
                            Ext.getCmp("transitarea_vw").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,autoScroll : false
                    ,width      : 615
                    ,margin     : "15 0 0 15"
                    ,defaults   : {
                        xtype       : "cp4_formpanel"
                        ,autoScroll : false
                        ,width      : 615
                        ,layout     : "column"
                        ,margin     : 0
                        ,padding    : 0
                    }
                    ,items      : [
                        {
                            items   : [
                                remoterid_vw
                                ,transitarea_vw
                            ]
                        },{
                            items   : [
                                {
                                    xtype       : "cp4_formpanel"
                                    ,layout     : {
                                        type    : "hbox"
                                    }
                                    ,padding    : 0
                                    ,margin     : 0
                                    ,width      : 315
                                    ,items      : [
                                        {
                                            xtype           : "cp4_numberfield"
                                            ,fieldLabel     : "Hello Interval"
                                            ,id             : "hello_vw"
                                            ,name           : "vlinks_hellointerval"
                                            ,emptyText      : "Default: 30"
                                            ,value          : ""
                                            ,minValue       : 1
                                            ,maxValue       : 65535
                                            ,maxLength      : 5
                                            ,enforceMaxLength   : true
                                            ,allowBlank     : true
                                            ,allowDecimals  : false
                                            ,labelWidth     : 115
                                            ,width          : 125 + 115
                                            ,style          : "margin-right:10px;"
                                            ,validator      : function(value) {
                                                var h_cmp = Ext.getCmp("hello_vw");
                                                var hello = h_cmp ? h_cmp.getRawValue() : "";
                                                if (hello == "") {
                                                    hello = 30;
                                                } else {
                                                    hello = parseInt(hello, 10);
                                                }

                                                var d_cmp = Ext.getCmp("dead_vw");
                                                var dead = d_cmp ? d_cmp.getRawValue() : "";
                                                if (dead == "") {
                                                    dead = 120;
                                                } else {
                                                    dead = parseInt(dead, 10);
                                                }

                                                if (hello >= dead) {
                                                    return "Hello Interval must be less than Dead Interval";
                                                }

                                                var c = this;
                                                var v = c.getValue();
                                                if (value != "" && (v < c.minValue || c.maxValue < v) ) {
                                                    return "";
                                                }

                                                return true;
                                            }
                                        },{
                                            xtype   : "cp4_label"
                                            ,text   : "seconds"
                                            ,style  : "margin-top:4px;"
                                        }
                                    ]
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,layout     : {
                                        type    : "hbox"
                                    }
                                    ,padding    : 0
                                    ,margin     : 0
                                    ,width      : 300
                                    ,items      : [
                                        {
                                            xtype           : "cp4_numberfield"
                                            ,fieldLabel     : "Dead Interval"
                                            ,id             : "dead_vw"
                                            ,name           : "vlinks_deadinterval"
                                            ,emptyText      : "Default: 120"
                                            ,value          : ""
                                            ,minValue       : 1
                                            ,maxValue       : 65535
                                            ,maxLength      : 5
                                            ,enforceMaxLength   : true
                                            ,allowBlank     : true
                                            ,allowDecimals  : false
                                            ,labelWidth     : 115
                                            ,width          : 125 + 115
                                            ,style          : "margin-right:10px;"
                                            ,validator      : function(value) {
                                                var h_cmp = Ext.getCmp("hello_vw");
                                                var hello = h_cmp ? h_cmp.getRawValue() : "";
                                                if (hello == "") {
                                                    hello = 30;
                                                } else {
                                                    hello = parseInt(hello, 10);
                                                }

                                                var d_cmp = Ext.getCmp("dead_vw");
                                                var dead = d_cmp ? d_cmp.getRawValue() : "";
                                                if (dead == "") {
                                                    dead = 120;
                                                } else {
                                                    dead = parseInt(dead, 10);
                                                }

                                                if (hello >= dead) {
                                                    return "Dead Interval must be greater than Hello Interval";
                                                }

                                                var c = this;
                                                var v = c.getValue();
                                                if (value != "" && (v < c.minValue || c.maxValue < v) ) {
                                                    return "";
                                                }

                                                return true;
                                            }
                                        },{
                                            xtype   : "cp4_label"
                                            ,text   : "seconds"
                                            ,style  : "margin-top:4px;"
                                        }
                                    ]
                                }
                            ]
                        },{
                            items   : [
                                {
                                    xtype           : "cp4_numberfield"
                                    ,fieldLabel     : "Retransmit Interval"
                                    ,id             : "rtxinterval_vw"
                                    ,name           : "vlinks_rtxinterval"
                                    ,emptyText      : "Default: 5"
                                    ,value          : ""
                                    ,minValue       : 1
                                    ,maxValue       : 65535
                                    ,maxLength      : 5
                                    ,enforceMaxLength   : true
                                    ,allowBlank     : true
                                    ,allowDecimals  : false
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,style          : "margin-right:10px;"
                                },{
                                    xtype   : "cp4_label"
                                    ,text   : "seconds"
                                    ,style  : "margin-top:4px;"
                                }
                            ]
                        },{
                            items   : [
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Authentication Type"
                                    ,id             : "authtype_vw"
                                    ,name           : "vlinks_authtype"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 115
                                    ,mode           : "local"
                                    ,editable       : false
                                    ,triggerAction  : "all"
                                    ,value          : ""
                                    ,style          : "margin-right:75px;"
                                    ,store          :   [[""        ,"None"]
                                                        ,["simple"  ,"Simple"]
                                                        ,["md5"     ,"MD5"]]
                                    ,listeners      : {
                                        select          : function() {
                                            var mode = Ext.getCmp("authtype_vw").getValue().toLowerCase();
                                            var simple_pass = Ext.getCmp("simple_pass_vw");
                                            var md5_set_vw  = Ext.getCmp("md5_set_vw");

                                            simple_pass.setVisible(     mode == "simple");
                                            simple_pass.setDisabled(    mode != "simple");
                                            simple_pass.validate();
                                            md5_set_vw.setVisible(      mode == "md5");
                                            md5_set_vw.setDisabled(     mode != "md5");

                                            var f_height = ((mode == "md5") ? 320 : 135);
                                            var f_form  = Ext.getCmp("vlink_form");
                                            var f_win   = Ext.getCmp("vlink_window");
                                            if (f_form && f_win && false) {
                                                f_form.setHeight(f_height);
                                                f_win.setHeight(f_height + 40 + 2 + 22);
                                            }
                                        }
                                    }
                                },{
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Simple Password"
                                    ,id             : "simple_pass_vw"
                                    ,name           : "vlinks_authtype_simple_password"
                                    ,labelWidth     : 115
                                    ,width          : 125 + 175
                                    ,inputType      : "password"
                                    ,allowBlank     : false
                                    ,maxLength      : 8
                                    ,enforceMaxLength   : true
                                    ,maskRe         : /[^\\ ]/
                                    ,stripCharsRe   : /[\\ ]/
                                    ,qtipText       : "Up to 8 characters, no spaces or \'\\\'."
                                    ,listeners      : {
                                        afterrender     : function(tf, eOpts) {
                                            if (tf.qtipText && tf.qtipText.length > 0) {
                                                Ext.tip.QuickTipManager.register({
                                                    target          : tf.getId()
                                                    ,text           : tf.qtipText
                                                    ,dismissDelay   : 0
                                                });
                                            }
                                        }
                                    }
                                }
                            ]
                        },{
                            xtype           : "cp4_formpanel"
                            ,layout         : "anchor"
                            ,width          : 300
                            ,height         : 175
                            ,autoScroll     : false
                            ,id             : "md5_set_vw"
                            ,margin         : 0
                            ,items          : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "MD5 List"
                                    ,margin     : "18 0 10 0"
                                }
                                ,md5_btnsbar_vw
                                ,md5_grid_vw
                            ]
                        }
                    ]
                }
            ] //vlink_form's items
        };

        var vlink_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "vlink_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    Ext.getCmp("authtype_vw").fireEvent("select");
                    win.setPosition(225,100);
                }
            }
            ,items      : [ vlink_form ]
        });
        vlink_window.show();

        function vlink_save() {
            //routed:instance:default:ospf2:area:0.0.0.0:virtuallink:remoterid:107.7.7.7:transitarea:7
            var params  = CP.ar_util.getParams();
            var remoterid   = Ext.getCmp("remoterid_vw").getValue();
            var transitarea = Ext.getCmp("transitarea_vw").getValue();
            var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE()
                            + ":ospf2:area:0.0.0.0:virtuallink:remoterid:"
                            + remoterid;
            var ta_prefix   = prefix +":transitarea:"+ transitarea;

            var remoterid0  = Ext.getCmp("remoterid_vw").originalValue;
            var transit0    = Ext.getCmp("transitarea_vw").originalValue;
            var vlinkchange_prefix = "";

            if (remoterid != remoterid0 || transitarea != transit0) {
                vlinkchange_prefix = "SPECIAL:"+ CP.ar_util.INSTANCE() +":vlinkchange:auth";
            }

            params[prefix]      = "t";
            params[ta_prefix]   = "t";

            var hellointerval       = Ext.getCmp("hello_vw").getRawValue();
            var retransmitinterval  = Ext.getCmp("rtxinterval_vw").getRawValue();
            var routerdeadinterval  = Ext.getCmp("dead_vw").getRawValue();

            params[ta_prefix +":hellointerval"]         = hellointerval;
            params[ta_prefix +":retransmitinterval"]    = retransmitinterval;
            params[ta_prefix +":routerdeadinterval"]    = routerdeadinterval;

            var authtype    = Ext.getCmp("authtype_vw").getValue().toLowerCase();
            var md5_recs    = Ext.getStore("vlink_md5_store").getRange();

            params[ta_prefix +":authtype"]  = authtype;
            switch(authtype) {
                case "md5":
                    params[ta_prefix +":auth:null"]             = "";
                    params[ta_prefix +":auth:simple"]           = "";
                    params[ta_prefix +":auth:simple:password"]  = "";
                    params[ta_prefix +":auth:md5"]              = "t";
                    var md5_prefix = ta_prefix +":auth:md5:keyid";
                    var r;
                    for(i = 0; i < md5_recs.length; i++) {
                        r = md5_recs[i].data;
                        params[md5_prefix +":"+ r.md5_key_id]           = "t";
                        var n = md5_prefix +":"+ r.md5_key_id +":key";
                        var n2 = n.replace(/^routed:/, ":routed:obscure:");
                        delete(params[n]);
                        if (r.key != "") {
                            params[n2]                                  = r.key;
                        } else if (vlinkchange_prefix != "") {
                            params[vlinkchange_prefix +":"+ r.md5_key_id] =
                                remoterid0 +"_"+ remoterid +"_"+ transit0 +"_"+ transitarea +"_"+ r.md5_key_id;
                        }
                    }
                    break;
                case "simple":
                    params[ta_prefix +":auth:null"]             = "";
                    params[ta_prefix +":auth:simple"]           = "t";
                    var n = ta_prefix +":auth:simple:password";
                    var n2 = n.replace(/^routed:/, ":routed:obscure:");
                    var v = Ext.getCmp("simple_pass_vw").getValue();
                    delete(params[n]);
                    if (v != "") {
                        params[n2]                               = v;
                    } else if (vlinkchange_prefix != "") {
                        params[vlinkchange_prefix +":simple"] =
                            remoterid0 +"_"+ remoterid +"_"+ transit0 +"_"+ transitarea +"_simple";
                    }
                    params[ta_prefix +":auth:md5"]              = "";
                    for(i = 0; i < md5_recs.length; i++) {
                        CP.ospf2_4.delete_md5_vw(
                            md5_recs[i].data.md5_key_id
                            ,remoterid
                            ,transitarea
                        );
                    }
                    break;
                default:
                    params[ta_prefix +":auth:null"]             = "t";
                    params[ta_prefix +":auth:simple"]           = "";
                    params[ta_prefix +":auth:simple:password"]  = "";
                    params[ta_prefix +":auth:md5"]              = "";
                    for(i = 0; i < md5_recs.length; i++) {
                        CP.ospf2_4.delete_md5_vw(
                            md5_recs[i].data.md5_key_id
                            ,remoterid
                            ,transitarea
                        );
                    }
            }
            CP.ar_util.mySubmit();
        }

    }

    ,open_md5_vw_window         : function(TITLE) {
        var md5_labelWidth  = 100;
        var md5_width       = 235;
        var md5_key_id_cmp;
        if (TITLE == "add") {
            TITLE = "Add MD5 Entry";
            md5_key_id_cmp = { //numberfield
                xtype           : "cp4_numberfield"
                ,fieldLabel     : "MD5 Key ID"
                ,id             : "md5_key_id_md5v"
                ,name           : "md5_key_id"
                ,labelWidth     : md5_labelWidth
                ,width          : md5_width
                ,minValue       : 1
                ,maxValue       : 255
                ,maxLength      : 3
                ,enforceMaxLength   : true
                ,allowBlank     : false
                ,allowDecimals  : false
                ,style          : "margin-left:15px;margin-right:15px;"
                ,validator      : function(v) {
                    var value = Ext.getCmp("md5_key_id_md5v").getValue();
                    if (value == "") {
                        return "";
                    }
                    value = parseInt(value,10);
                    if (Ext.getStore("vlink_md5_store").findExact("md5_key_id", value) > -1) {
                        return "MD5 Key ID must be unique.";
                    }
                    return true;
                }
            };
        } else {
            md5_key_id_cmp = { //displayfield
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "MD5 Key ID"
                ,id             : "md5_key_id_md5v"
                ,name           : "md5_key_id"
                ,labelWidth     : md5_labelWidth
                ,width          : md5_width
                ,height         : 18
                ,style          : "margin-left:15px;margin-right:15px;"
            };
        }

        function md5v_afterrender(p, eOpts) {
            p.form._boundItems = null;
            if (Ext.getCmp("md5_key_id_md5v").getXType() == "cp4_numberfield") {
                //add
                Ext.getCmp("key_md5v").blankText = "This field is required"; // blankText is not the same as emptyText, whee
                Ext.getCmp("key_md5v").validate();
                Ext.getCmp("md5_key_id_md5v").validate();
                Ext.getCmp("md5_key_id_md5v").focus();
            } else {
                //edit
                var rec = Ext.getCmp("md5_grid_vw").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                Ext.getCmp("key_md5v").blankText = "'Cancel' to leave this key unchanged"; // blankText is not the same as emptyText, whee
                Ext.getCmp("key_md5v").validate();
                Ext.getCmp("key_md5v").focus();
            }
            if (p.chkBtns) { p.chkBtns(); }
        }

        var md5v_form = {
            xtype       : "cp4_formpanel"
            ,id         : "md5v_form"
            ,autoScroll : false
            ,listeners  : {
                afterrender     : md5v_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("md5v_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("md5v_save_btn");
                CP.ar_util.checkDisabledBtn("md5v_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "md5v_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        md5v_save(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("md5v_form");
                        return !f;
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "md5v_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("md5v_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "tbspacer"
                    ,height     : 15
                }
                ,md5_key_id_cmp
                ,{
                    xtype       : "cp4_textfield"
                    ,fieldLabel : "MD5 Key"
                    ,id         : "key_md5v"
                    ,name       : "key"
                    ,labelWidth : md5_labelWidth
                    ,width      : md5_width
                    ,inputType  : "password"
                    ,allowBlank : false
                    ,maxLength  : 16
                    ,enforceMaxLength   : false
                    ,style      : "margin-left:15px;margin-right:15px;"
                    ,maskRe         : /[^\\ ]/
                    ,stripCharsRe   : /[\\ ]/
                    ,qtipText       : "Up to 16 characters, no spaces or \'\\\'."
                    ,listeners      : {
                        afterrender     : function(tf, eOpts) {
                            if (tf.qtipText && tf.qtipText.length > 0) {
                                Ext.tip.QuickTipManager.register({
                                    target          : tf.getId()
                                    ,text           : tf.qtipText
                                    ,dismissDelay   : 0
                                });
                            }
                        }
                    }
                },{
                    xtype       : "tbspacer"
                    ,height     : 15
                }
            ]
        };

        function md5v_save() {
            if (Ext.getCmp("md5_key_id_md5v").getXType() == "cp4_numberfield") {
                Ext.getStore("vlink_md5_store").add({
                    "md5_key_id"    : Ext.getCmp("md5_key_id_md5v").getValue()
                    ,"key"          : Ext.getCmp("key_md5v").getValue()
                    ,"newrec"       : true
                });
            } else {
                var rec = Ext.getCmp("md5_grid_vw").getSelectionModel().getLastSelected();
                rec.data.key = Ext.getCmp("key_md5v").getValue();
            }
            Ext.getCmp("md5_grid_vw").getView().refresh();
            CP.ar_util.checkWindowClose("md5v_window");
        }

        var md5v_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "md5v_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ md5v_form ]
        });
        md5v_window.show();
    }
}

