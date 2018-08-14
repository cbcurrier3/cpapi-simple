CP.vrrp6 = {
    SUBGRID_HEIGHT          : 235
    ,LINK_LOCAL_MSG         : "At least one backup address must be link-local (fe80:0:0:0::)"

// user control
    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("vrrp6_global_btnsbar");
        CP.ar_util.checkBtnsbar("vrrp6_vrid_btnsbar");
        CP.ar_util.checkBtnsbar("vrrp6_vrid_window_form");
        CP.ar_util.checkBtnsbar("vrrp6_addr_form");
        CP.ar_util.checkBtnsbar("vrrp6_mi_form");
    }

// INIT
    ,init                   : function() {
        CP.vrrp6.defineStores( CP.ar_util.INSTANCE() );
        var configPanel = CP.vrrp6.configPanel();
        var obj = {
            title           : "IPv6 VRRP"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/vrrp6.tcl"
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("vrrp6_vrid_window");
                CP.vrrp6.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.vrrp6_monitor && CP.vrrp6_monitor.doLoad) {
                    CP.vrrp6_monitor.doLoad();
                }                                                                                                                                                               
            }
            ,submitFailure  : function() {
                CP.vrrp6.doLoad();
                CP.vrrp6.check_user_action();
            }
            ,checkCmpState  : CP.vrrp6.check_user_action
            ,helpFile       : "vrrp6.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

// STORES
    ,defineStores           : function(INSTANCE) {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            //define stores
            var grids_to_refresh_list = ["vrrp6_vrid_grid"];
            CP.intf_state.defineStore( INSTANCE, grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("vrrp");
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"type"
                ,"addr6"
                ,"addr6_raw"
                ,"mask6"
                ,"addrmask6"
                ,"addr6_list"
                ,"addr4_list"
                ,"state"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : INSTANCE
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "6in4 6to4 gre"
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
            ,sorters    :   [{ property: "intf", direction: "ASC" }
                            ,{ property: "addr6", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s) { CP.ar_util.loadListPop("intf_store"); }
                    var r = [];
                    var i;
                    var p = false;
                    for (i = 0; i < recs.length; i++) {
                        p = false;
                        switch ( Ext.typeOf(recs[i].data.state) ) {
                            case "string":
                                if (recs[i].data.state != "on") {
                                    p = true;
                                }
                                break;
                            default:
                                p = true;
                        }
                        if (p) {
                            r.push(recs[i]);
                        }
                    }
                    if (r.length > 0) {
                        st.remove(r);
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "if_inet6_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"instance"
                ,"state"
                ,"addr6_c"
                ,"addr6"
            ]
            ,sorters    : [
                { property: "intf", direction: "ASC" }
                ,{ property: "addr6", direction: "ASC" }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/read_if_inet6.tcl"
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.aList"
                }
            }
            ,loadInterface  : function() {
                var intf_cmp = Ext.getCmp("interface_entry");
                var Intf = intf_cmp ? intf_cmp.getDBValue() : "";
                var INSTANCE = CP.ar_util.INSTANCE();
                if (INSTANCE == "default") { INSTANCE = 0; }

                var filterFunct = function(rec, id) {
                    if ( String(INSTANCE) != "" && String(INSTANCE) != String(rec.data.instance) ) {
                        return false;
                    }
                    if ( String(Intf) != "" && String(Intf) != String(rec.data.intf) ) {
                        return false;
                    }
                    return true;
                };

                var st = Ext.getStore("if_inet6_store");
                if (st) {
                    st.clearFilter(true);
                    st.filter( filterFunct );
                    //"intf", String(Intf) );
                    var g = Ext.getCmp("vrrp6_addr_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                }
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    if (s) { CP.ar_util.loadListPop("if_inet6_store"); }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_st"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "interface"
                ,"vrid"
                ,"mode"
                ,"mode2"
                ,"local_vrid"
                ,"advertiseinterval"
                ,"vmac"
                ,"vmac_static"
                ,"priority"
                ,"nopreempt"
                ,"monitorvrrp"
                ,"localrx"
                ,"autodeactivation"
                ,"addr_vridlist"
                ,"mi_vridlist"
                ,"other_vridlist"
                ,"state"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [
                { property: "interface", direction: "ASC" },
                { property: "vrid", direction: "ASC" }
            ]
            ,loadSubSts : function(data) {
                function loadSubSt(st, d) {
                    if (st) {
                        st.removeAll();
                        if (d && d.length > 0) { st.loadData(d); }
                    }
                }
                CP.ar_util.clearParams();
                loadSubSt(Ext.getStore("vrrp6_st_addr"), data.addr_vridlist);
                loadSubSt(Ext.getStore("vrrp6_st_mi"), data.mi_vridlist);
                loadSubSt(Ext.getStore("vrrp6_st_other"), data.other_vridlist);
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_st_addr"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["addr","addr_c","new"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [{ property: "addr", direction: "ASC" }]
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_st_mi"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["monif","priority","new"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_st_other"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "cnt"
                ,"vrid_num" // valueField
                ,"vrid_mask" // displayField
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    : [{property: "cnt", direction: "ASC"}]
        });
    }

//AJAX
    ,getPrefix                      : function() {
        var instance_string = CP.ar_util.INSTANCE();
        return String( "routed:instance:"+ instance_string +":vrrp6" );
    }
    ,mySubmit                       : function() {
        var no_token = CP.ar_util.checkBlockActivity(true);
        if (!no_token) {
            CP.vrrp6.push_global_params();
            CP.ar_util.loadListPush("mySubmit");
            CP.UI.applyHandler( CP.UI.getMyObj() );
        }
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        var instance_string = CP.ar_util.INSTANCE();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("vrrp");
        }

        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            CP.ar_util.loadListPush("intf_store");
            intf_st.load({params: {"instance": instance_string}});
        }
        var inet6_st = Ext.getStore("if_inet6_store");
        if (inet6_st) {
            CP.ar_util.loadListPush("if_inet6_store");
            inet6_st.load();
        }

        var p = Ext.getCmp("vrrp6_configPanel");
        if (!p) { return; }
        CP.ar_util.loadListPush("doLoad");
        p.load({
            url     : "/cgi-bin/vrrp6.tcl"
            ,method : "GET"
            ,params : {
                "instance"  : instance_string
                ,"option"   : "all"
            }
            ,success: function(p, action) {
                if (action) {
                    var data = action.result.data;
                    test_load_store("vrrp6_st"     ,data   ,"interface_listdict");

                    var coldstart_cmp   = Ext.getCmp("coldstart");
                    var coldstart       = parseInt(data.coldstartdelay, 10);
                    coldstart           = ( isNaN(coldstart) ) ? "" : coldstart;
                    if (coldstart_cmp) {
                        coldstart_cmp.setValue(coldstart);
                        coldstart_cmp.originalValue = coldstart_cmp.getValue();
                    }

                    var interfacedelay_cmp   = Ext.getCmp("interface_delay");
                    var interfacedelay       = parseInt(data.interface_delay, 10);
                    interfacedelay           = (isNaN(interfacedelay)) ? "" : interfacedelay;
                    if (interfacedelay_cmp) {
                        interfacedelay_cmp.setValue(interfacedelay);
                        interfacedelay_cmp.originalValue = interfacedelay_cmp.getValue();
                    }

                }

                CP.ar_util.loadListPop("doLoad");
                CP.ar_util.loadListPop("mySubmit");
                Ext.getCmp("vrrp6_has_active_mode").aam = data.has_aam;
                function test_load_store(stId, d, id) {
                    var st = Ext.getStore(stId);
                    if (st) {
                        st.removeAll();
                        if (d && d[id]) { st.loadData(d[id]); }
                    }
                }
            }
            ,failure: function() {
                CP.ar_util.loadListPop("doLoad");
                CP.ar_util.loadListPop("mySubmit");
            }
        });
    }

// CONFIG PANEL
    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "vrrp6_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    CP.vrrp6.doLoad();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("vrrp6"),
                CP.vrrp6.global_set()
                ,CP.vrrp6.vrid_set()
            ]
        });
        return configPanel;
    }


// Global set
    ,global_set             : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "IPv6 VRRP"
            },{ 
                xtype       : "cp4_inlinemsg"
                ,type       : "info"
                ,text       : "Note: Global settings for both VRRP "
                            + "and IPV6 VRRP should be identically set "
                            + "if both protocols are configured."
                ,style      : "margin-bottom:5px;"
            },{ //Cold Start Delay 
                xtype       : "cp4_formpanel" 
                ,layout     : "column" 
                ,padding    : 0 
                ,margin     : 0 
                ,items      : [ 
                    { 
                        xtype               : "cp4_numberfield" 
                        ,fieldLabel         : "Cold Start Delay" 
                        ,id                 : "coldstart" 
                        //,name               : "coldstart" 
                        ,submitValue        : false 
                        ,emptyText          : "Default: 0" 
                        ,minValue           : 0 
                        ,maxValue           : 3600 
                        ,maxLength          : 4 
                        ,enforceMaxLength   : true 
                        ,allowBlank         : true 
                        ,allowDecimals      : false 
                        ,labelWidth         : 150 
                        ,width              : 150 + 100 
                        ,style              : "margin-right:10px;" 
                        ,getDBValue         : function() { 
                            var c = this; 
                            var v = (c && c.getRawValue) ? c.getRawValue() : ""; 
                            if (v != "") { 
                                v = parseInt(v, 10); 
                                if (isNaN(v) || v < c.minValue || v > c.maxValue) { 
                                    v = ""; 
                                } else { 
                                    v = String(v); 
                                } 
                            } 
                            return v; 
                        } 
                        ,validator          : function(value) { 
                            var cs = this; 
                            if (value == "") { 
                                return true; 
                            } 
                            value = parseInt(value,10); 
                            if (isNaN(value) || value < cs.minValue || cs.maxValue < value) { 
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
            },{ //Interface Delay 
                xtype       : "cp4_formpanel" 
                ,layout     : { 
                    type    : "hbox" 
                } 
                ,padding    : 0 
                ,margin     : 0 
                ,items      : [ 
                    { 
                        xtype               : "cp4_numberfield" 
                        ,fieldLabel         : "Interface Delay" 
                        ,id                 : "interface_delay" 
                        ,name               : "interface_delay" 
                        ,submitValue        : false 
                        ,emptyText          : "Default: 0" 
                        ,minValue           : 0 
                        ,maxValue           : 3600 
                        ,maxLength          : 4 
                        ,enforceMaxLength   : true 
                        ,allowBlank         : true 
                        ,allowDecimals      : false 
                        ,labelWidth         : 150 
                        ,width              : 150 + 100 
                        ,style              : "margin-right:10px;" 
                        ,getDBValue         : function() { 
                            var c = this; 
                            var v = (c && c.getRawValue) ? c.getRawValue() : ""; 
                            if (v != "") { 
                                v = parseInt(v, 10); 
                                if (isNaN(v) || v < c.minValue || v > c.maxValue) { 
                                    v = ""; 
                                } else { 
                                    v = String(v); 
                                } 
                            } 
                            return v; 
                        } 
                        ,validator          : function(v) { 
                            var c = this; 
                            if (v == "") { 
                                return true; 
                            } 
                            v = parseInt(v, 10); 
                            if (isNaN(v) || v < c.minValue || v > c.maxValue) { 
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
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Monitor Firewall"
                ,id         : "nomonitorfw_entry"
                ,name       : "nomonitorfw"
                ,labelWidth : 150
                ,width      : 200
                ,height     : 22
                ,submitValue: false
                ,getDBValue : function() {
                    var c = Ext.getCmp("nomonitorfw_entry");
                    return ( (c.getValue() ) ? "" : "t");
                }
            },{
            //Disable All Virtual Routers 
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Disable All Virtual Routers"
                ,id         : "disable_vrs6_entry"
                ,name       : "disable_vrs6"
                ,submitValue: false
                ,labelWidth : 150
                ,width      : 200   
                ,height     : 22    
                ,getDBValue : function() {
                    var c = Ext.getCmp("disable_vrs6_entry");
                    return ( (c.getValue() ) ? "t" : ""); 
                }
            },{
                xtype       : "cp4_btnsbar"
                ,id         : "vrrp6_global_btnsbar"
                ,items      : [
                    {
                        text                : "Apply Global Settings"
                        ,id                 : "vrrp6_btn_global"
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.ar_util.clearParams();
                            CP.vrrp6.mySubmit();
                        }
                    },{
                        text                : "Refresh"
                        ,id                 : "vrrp6_refresh_btn"
                        ,overrideNoToken    : true
                        ,handler2           : function() {
                            CP.vrrp6.doLoad();
                        }
                        ,disable            : function() { }
                        ,setDisabled        : function() {
                            var b = this;
                            if (b && b.disabled) {
                                b.enable();
                            }
                        }
                    }
                ]
            },{
                id          : "vrrp6_has_active_mode"
                ,aam        : 0
            }
        ];
    }
    ,push_global_params     : function() {
        var prefix = CP.vrrp6.getPrefix();
        var params = CP.ar_util.getParams();
        var coldstartdelay = Ext.getCmp("coldstart").getDBValue();
        params[prefix +":coldstartdelay"] = coldstartdelay;
        var interface_delay = Ext.getCmp("interface_delay").getDBValue();
        params[prefix +":interfacedelay"] = interface_delay;
        var nomonitorfw = Ext.getCmp("nomonitorfw_entry").getDBValue();
        params[prefix +":nomonitorfw"] = nomonitorfw;
        var disablevrs6 = Ext.getCmp("disable_vrs6_entry").getDBValue();
        params[prefix +":disable-all-virtual-routers"] = disablevrs6;
    }

// VRID Set
    ,vrid_set               : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Virtual Routers"
        });

        function delete_vrid(params, prefix, rec) {
            var intf = rec.data["interface"];
            var vrid = rec.data.vrid;
            var iprefix = prefix +":interface:"+ intf;
            var vprefix = iprefix +":virtualrouter:"+ vrid;
            params[vprefix] = "";
            params[vprefix +":advertiseinterval"]   = "";
            params[vprefix +":localrx"]             = "";
            params[vprefix +":nopreempt"]           = "";
            params[vprefix +":monitorvrrp"]         = "";
            params[vprefix +":priority"]            = "";
            params[vprefix +":vmac"]                = "";
            params[vprefix +":vmac:static"]         = "";

            var j;
            var addrdb = "";
            //delete addresses
            var aprefix = vprefix +":address:addr:v6addr";
            var a = rec.data.addr_vridlist;
            for(j = 0; j < a.length; j++) {
                addrdb = CP.ip6convert.ip6_2_db(a[j].addr_c);
                params[aprefix +":"+ addrdb] = "";
            }

            //delete monitored interfaces
            var mprefix = vprefix +":monitor:monif";
            var m = rec.data.mi_vridlist;
            for(j = 0; j < m.length; j++) {
                params[mprefix +":"+ m[j].monif]                = "";
                params[mprefix +":"+ m[j].monif +":priority"]   = "";
            }

            var vrid_st = Ext.getStore("vrrp6_st");
            vrid_st.remove(rec);
            if ( -1 == vrid_st.findExact("interface", intf, 0) ) {
                params[iprefix]             = "";
                params[iprefix +":mode"]    = "";
            }
            return 1;
        }

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "vrrp6_vrid_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "vrrp6_vrid_btn_add"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("vrrp6_vrid_grid").getSelectionModel().deselectAll();
                        CP.vrrp6.open_vrid_window(null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "vrrp6_vrid_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var sm = Ext.getCmp("vrrp6_vrid_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        if (rec) {
                            CP.vrrp6.open_vrid_window(rec);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("vrrp6_vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "vrrp6_vrid_btn_delete"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.vrrp6.getPrefix(); // "routed:..:vrrp6"
                        var sm = Ext.getCmp("vrrp6_vrid_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs && recs.length > 0) {
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                delete_vrid(params, prefix, recs[i]);
                            }
                            CP.vrrp6.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("vrrp6_vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                },{
                    text                : "Delete All"
                    ,id                 : "vrrp6_vrid_btn_delete_all"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        Ext.Msg.show({
                            title   : "Warning"
                            ,msg    : "Are you sure want to delete all of the Virtual Routers?"
                                    + "<br />Press OK to continue."
                            ,animEl : "elId"
                            ,buttons: Ext.Msg.OKCANCEL
                            ,fn     : function(btn, text) {
                                if (btn == "cancel") {
                                    return;
                                }
                                var params = CP.ar_util.clearParams();
                                var prefix = CP.vrrp6.getPrefix(); // "routed:..:vrrp6"
                                var vrid_st = Ext.getStore("vrrp6_st");
                                if (vrid_st) {
                                    var recs = vrid_st.getRange();
                                    if (recs && recs.length > 0) {
                                        var i;
                                        for(i = 0; i < recs.length; i++) {
                                            delete_vrid(params, prefix, recs[i]);
                                        }
                                        CP.vrrp6.mySubmit();
                                    }
                                }
                            }
                        });
                    }
                    ,disabledConditions : function() {
                        var vrid_st = Ext.getStore("vrrp6_st");
                        return ( (vrid_st && vrid_st.getCount) ? vrid_st.getCount() == 0 : true);
                    }
                }
            ]
        });

        Arr.push( CP.vrrp6.vrid_grid() );

        return Arr;
    }

    ,vrid_grid              : function() {
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "interface"
                ,width          : 100
                ,minWidth       : 95
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if (row > 0) {
                        var rec_p = st.getAt(row-1);
                        if (rec_p.data["interface"] == rec.data["interface"]) {
                            color = "grey";
                        }
                    }
                    return CP.intf_state.renderer_output(
                        value
                        ,""
                        ,"left"
                        ,color
                        ,value
                        ,"ipv6"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                text            : "VRID"
                ,dataIndex      : "vrid"
                ,width          : 60
                ,minWidth       : 55
                ,maxWidth       : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "left", "black");
                }
            },{
                text            : "State"
                ,dataIndex      : "state"
                ,width          : 60
                ,minWidth       : 55
                ,maxWidth       : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value, "left", "black");
                }
            },{
                text            : "Mode"
                ,dataIndex      : "mode2"
                ,width          : 60
                ,minWidth       : 55
                ,maxWidth       : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    var tip = "";
                    switch( String(rec.data.mode2).toLowerCase() ) {
                        case "local":
                        case "own":
                            retValue = "VRRPv3";
                            tip = "VRRPv3 (Local Router)";
                            break;
                        case "backup":
                            retValue = "VRRPv3";
                            tip = "VRRPv3 (Backup Router)";
                            break;
                        default:
                            retValue = "MC";
                            tip = "Monitored Circuit";
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", "black");
                }
            },{
                text            : "VMAC Mode"
                ,dataIndex      : "vmac"
                ,width          : 75
                ,minWidth       : 70
                ,maxWidth       : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var tip = "";
                    switch(value) {
                        case "interface":
                            retValue = "Interface";
                            break;
                        case "extended":
                            retValue = "Extended";
                            break;
                        case "static":
                            retValue = "Static ("+ String(rec.data.vmac_static) + ")";
                            break;
                        default:
                            retValue = "VRRP";
                            break;
                    }
                    if (tip == "") {
                        tip = retValue;
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", "black");
                }
            },{
                text            : "Priority"
                ,dataIndex      : "priority"
                ,width          : 75
                ,minWidth       : 70
                ,maxWidth       : 85
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 100;
                        color = "grey";
                    }
                    return CP.ar_util.rendererSpecific(retValue,
                        retValue, "left", color);
                }
            },{
                text            : "Hello Interval"
                ,dataIndex      : "advertiseinterval"
                ,width          : 100
                ,minWidth       : 95
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 100;
                        color = "grey";
                    }
                    return CP.ar_util.rendererSpecific(retValue +" cs",
                        retValue +" centiseconds", "left", color);
                }
            },{
                text            : "Preempt"
                ,dataIndex      : "nopreempt"
                ,width          : 75
                ,minWidth       : 70
                ,maxWidth       : 85
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Monitor VRRP"
                ,hidden         : true
                ,dataIndex      : "monitorvrrp"
                ,width          : 100
                ,minWidth       : 95
                ,maxWidth       : 105
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
            /*
            ,{
                text            : "Accept Mode"
                ,dataIndex      : "localrx"
                ,width          : 100
                ,minWidth       : 95
                ,maxWidth       : 115
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
            // */
            ,{
                text            : "Auto-deactivation"
                ,dataIndex      : "autodeactivation"
                ,width          : 120
                ,minWidth       : 115
                ,maxWidth       : 130
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Backup Addresses"
                ,dataIndex      : "addr_vridlist"
                ,flex           : 1
                ,minWidth       : 150
                ,maxWidth       : 300
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (value.length > 0) {
                        var i = 0;
                        retValue += String(value[i].addr_c).toUpperCase();
                        for(i++; i < value.length; i++) {
                            retValue += ",<br>"+ String(value[i].addr_c).toUpperCase();
                        }
                    } else {
                        retValue = "None (Incomplete Configuration)";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                text            : "Monitored Interfaces"
                ,dataIndex      : "mi_vridlist"
                ,width          : 150
                ,minWidth       : 145
                ,maxWidth       : 160
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    function formatMonIf(intfData) {
                        var intf = CP.intf_state.format_substr(
                            intfData.monif
                            ,intfData.monif
                            ,"ipv6"
                            ,CP.ar_util.INSTANCE()
                        );
                        var prio = String(intfData.priority);
                        return String( intf + " ("+ prio +")" );
                    }

                    var retValue = "";
                    if (rec.data.mode == "monitoredcircuit") {
                        if (value.length > 0) {
                            var i = 0;
                            retValue += formatMonIf(value[i]);
                            for(i++; i < value.length; i++) {
                                retValue += ",<br>"+ formatMonIf(value[i]);
                            }
                        } else {
                            retValue = "None";
                        }
                    } else {
                        if ( row == st.findExact("mode","vrrpv3", 0) ) {
                            retValue = "VRRPv3 does not use Monitored Interfaces";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.vrrp6.check_user_action();
                }
            }
        });

        return {
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,margin     : 0
            ,items      : [{
                xtype               : "cp4_grid"
                ,id                 : "vrrp6_vrid_grid"
                ,width              : 1150
                ,height             : 249
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore("vrrp6_st")
                ,columns            : grid_cm
                ,selModel           : grid_selModel
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function() {
                        var b = Ext.getCmp("vrrp6_vrid_btn_edit");
                        if (b && b.handler) { b.handler(b); }
                    }
                }
            }]
        };
    }

//VRID WINDOW
    ,open_vrid_window       : function(REC) {
        var TITLE = "";
        var data;
        if ( !REC || !(REC.data) ) {
            TITLE = "Add Virtual Router";
            data = {
                "interface"             : ""
                ,"vrid"                 : ""
                ,"mode"                 : "monitoredcircuit"    //monitoredcircuit or vrrpv3
                ,"mode2"                : ""    //monitoredcircuit, local, or backup
                ,"local_vrid"           : ""
                ,"advertiseinterval"    : ""
                ,"vmac"                 : ""
                ,"vmac_static"          : ""
                ,"priority"             : ""
                ,"nopreempt"            : true
                ,"monitorvrrp"          : ""
                ,"localrx"              : ""
                ,"autodeactivation"     : ""    //MC only
                ,"addr_vridlist"        : []
                ,"mi_vridlist"          : []    //MC only
                ,"other_vridlist"       : []
                ,"state"                : ""
            };
        } else {
            data = REC.data;
            TITLE = "Edit Virtual Router "
                  + String(data.vrid) +" on Interface "
                  + String(data["interface"]);
        }
        Ext.getStore("vrrp6_st").loadSubSts(data);

        var FormArr = [];
        var LABELWIDTH = 100;
        var WIDTH = LABELWIDTH + 145;
        var hMargin = 15;
        var colMarginStyle = "margin-left:"+ String(hMargin) +"px;";

        function generateFormRow(rowId, marginStr, Items) {
            return {
                xtype       : "cp4_formpanel"
                ,id         : rowId
                ,layout     : "column"
                ,margin     : (marginStr || "0 0 0 0")
                ,items      : Items
            };
        }

        //handle a change in intf or vrid
        /*
        function handleIntfVridChange(intf, vrid) {
            var g = Ext.getCmp("vrrp6_addr_grid");
            if (g) {
                g.getView().refresh();
            }
            var st = Ext.getStore("vrrp6_st");
            if (st) {
                var recs = st.getRange();
                var d;
                var i;
                var sameIntf = -1;
                var m = Ext.getCmp("mode_entry");
                var f = Ext.getCmp("vrrp6_vrid_window_form");
                if (intf == "") {
                    st.loadSubSts({
                        "addr_vridlist"     : []
                        ,"mi_vridlist"      : []
                        ,"other_vridlist"   : []
                    });
                    if (m) {
                        m.setValue("");
                    }
                    return;
                }
                for(i = 0; i < recs.length; i++) {
                    d = recs[i].data;
                    if (d["interface"] == intf) {
                        if (vrid != "" && d["vrid"] == vrid) {
                            st.loadSubSts(d);
                            if (f) {
                                f.loadRecord(recs[i]);
                            }
                            return;
                        }
                        sameIntf = i;
                    }
                }
                if (sameIntf > -1) {
                    d = recs[sameIntf].data;
                    st.loadSubSts({
                        "addr_vridlist"     : []
                        ,"mi_vridlist"      : []
                        ,"other_vridlist"   : d.other_vridlist
                    });
                    if (m) {
                        m.setValue(d["mode"]);
                    }
                }
            }
        }
        // */

        var interface_cmp = {
            xtype           : "cp4_displayfield"
            ,fieldLabel     : "Interface"
            ,id             : "interface_entry"
            ,name           : "interface_entry_unique_name"
            ,value          : String(data["interface"])
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,height         : 22
            ,style          : colMarginStyle
            ,getDBValue     : function() {
                var c = Ext.getCmp("interface_entry");
                var st = Ext.getStore("intf_store");
                if (c && st) {
                    var v = c.getValue();
                    if (st.findExact("intf", v, 0) > -1) {
                        return String(v);
                    }
                }
                return "";
            }
        };
        if (data["interface"] == "") {
            interface_cmp.xtype = "cp4_combobox";
            Ext.apply( interface_cmp, {
                queryMode           : "local"
                ,editable           :  true
                ,forceSelection     :  true
                ,triggerAction      :  "all"
                ,store              :  Ext.getStore("intf_store")
                ,valueField         :  "intf"
                ,displayField       :  "intf"
                ,allowBlank         :  false
                ,listeners          :  {
                    change  : function(c, newValue, oldValue, eOpts) {
                        var v = c.getValue();
                        var vrid_cmp = Ext.getCmp("vrid_entry");
                        if (vrid_cmp && vrid_cmp.validate) {
                            vrid_cmp.validate();
                        }
                        /*
                        if (vrid_cmp && vrid_cmp.getDBValue) {
                            handleIntfVridChange( newValue, vrid_cmp.getDBValue() );
                        }
                        // */
                        var primary_ip_cmp = Ext.getCmp("primary_address_entry");
                        var primary_ip = "";
                        if (primary_ip_cmp) {
                            var intf_st_lookup = Ext.getStore("intf_store").findRecord("intf", v, 0, false, false, true);
                            if (Ext.typeOf(intf_st_lookup.data.addrmask6) == "string") {
                                primary_ip = intf_st_lookup.data.addrmask6;
                            }
                            primary_ip_cmp.setValue(primary_ip);
                        }
                        CP.vrrp6.check_user_action();
                        var mode_btn = Ext.getCmp("vrrp6_adjust_mode_btn");
                        if (mode_btn) {
                            mode_btn.setDisabled( !( c.validate() ) );
                        }
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        if (g) {
                            g.getView().refresh();
                        }
                    }
                }
            });
        }

        var vrid_cmp = {
            xtype           : "cp4_displayfield"
            ,fieldLabel     : "Virtual Router"
            ,id             : "vrid_entry"
            //,name           : "vrid"
            ,value          : data["vrid"]
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,height         : 22
            ,style          : colMarginStyle
            ,getDBValue     : function() {
                var c = Ext.getCmp("vrid_entry");
                var v = "";
                if (c) {
                    v = c.getRawValue();
                    if (v != "") {
                        v = parseInt(v, 10);
                        if (v < 1 || v > 255) {
                            v = "";
                        }
                    }
                }
                return v;
            }
        };
        if (data.vrid == "") {
            vrid_cmp.xtype = "cp4_numberfield";
            Ext.apply( vrid_cmp, {
                allowBlank          : false
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 255
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,listeners          : {
                    change  : function(c, newValue, oldValue, eOpts) {
                        //may cause a new set of data to be loaded
                        var intf_cmp = Ext.getCmp("interface_entry");
                        if (intf_cmp && intf_cmp.validate) {
                            intf_cmp.validate();
                        }
                        /*
                        if (intf_cmp && intf_cmp.getDBValue) {
                            handleIntfVridChange(intf_cmp.getDBValue(), newValue);
                        }
                        // */
                        CP.vrrp6.check_user_action();
                    }
                }
                ,validator          : function() {
                    var c = this;
                    var v = parseInt(c.getRawValue(), 10);
                    if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                        return "";
                    }
                    var ci = Ext.getCmp("interface_entry");
                    var intf = ci ? ci.getValue() : "";
                    if (intf == "") {
                        return true;
                    }
                    var i;
                    var v_st = Ext.getStore("vrrp6_st");
                    if (v_st) {
                        var recs = v_st.getRange();
                        for(i = 0; i < recs.length; i++) {
                            if (recs[i].data["interface"] == intf && recs[i].data.vrid == v) {
                                return "Interface "+ String(intf) +" already has a VRID "+ String(v) +", use a different ID.";
                            }
                        }
                    }
                    return true;
                }
            });
        }
        FormArr.push( generateFormRow("vrrp6_intf_vrid_row", "15 0 0 0", [interface_cmp, vrid_cmp]) );

        var primary_ip = "";
        if (data["interface"] != "") {
            var intf_st_lookup = Ext.getStore("intf_store").findRecord("intf", data["interface"], 0, false, false, true);
            if (Ext.typeOf(intf_st_lookup.data.addrmask6) == "string") {
                primary_ip = intf_st_lookup.data.addrmask6;
            }
        }
        var address_cmp = {
            xtype       : "cp4_displayfield"
            ,fieldLabel : "Primary IP"
            ,id         : "primary_address_entry"
            ,name       : "primary_address_entry_unique"
            ,value      : primary_ip
            ,labelWidth : LABELWIDTH
            ,width      : WIDTH
            ,height     : 22
            ,style      : colMarginStyle
        };
        var state_cmp = {
            xtype       : "cp4_displayfield"
            ,fieldLabel : "State"
            ,id         : "vrid_state_entry"
            ,name       : "vrid_state_entry_unique"
            ,value      : data["state"]
            ,labelWidth : LABELWIDTH
            ,width      : WIDTH
            ,height     : 22
            ,style      : colMarginStyle
        };
        FormArr.push( generateFormRow("vrrp6_address_state_row", "0 0 0 0", [address_cmp, state_cmp]) );

        function formatModeDisplay(nV) {
            switch( String(nV).toLowerCase() ) {
                case "vrrpv3":
                    return "VRRPv3";
                case "monitoredcircuit":
                    return "Monitored Circuit";
                default:
            }
            return "None, please set.";
        }
        function formatLocalVrid(nV) {
            var v = parseInt(nV, 10);
            if (1 <= v && v <= 255) {
                return v;
            }
            return "None";
        }
        FormArr.push( generateFormRow("vrrp6_mode_local_row", "", [{
            xtype           : "cp4_combobox"
            ,fieldLabel     : "Mode"
            ,id             : "mode_entry"
            ,name           : "mode"
            ,value          : data["mode"]
            ,hidden         : true
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,allowBlank     : false
            ,editable       : true
            ,forceSelection : true
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,store          :   [["vrrpv3"          ,"VRRPv3"]
                                ,["monitoredcircuit","Monitored Circuit"]]
            ,style          : colMarginStyle
            ,getDBValue     : function() {
                var c = this;
                if (c) {
                    return String( c.getValue() ).toLowerCase();
                }
                return "";
            }
            ,validator      : function(v) {
                var md = Ext.getCmp("mode_display");
                var errorMsg = "";
                switch( String(v).toLowerCase() ) {
                    case "vrrpv3":
                    case "monitoredcircuit":
                    case "monitored circuit":
                        break;
                    default:
                        errorMsg = "No VRRP mode has been selected.";
                }

                if (errorMsg != "") {
                    if (md && md.markInvalid) {
                        md.markInvalid(errorMsg);
                    }
                    return "";
                }

                if (md && md.validate) {
                    md.validate();
                }
                if (md && md.clearInvalid) {
                    md.clearInvalid();
                }
                return true;
            }
            ,listeners      : {
                change          : function(c, newValue, oldValue, eOpts) {
                    var md = Ext.getCmp("mode_display");
                    if (md) {
                        md.setNewValue(newValue);
                    }
                    var lv = Ext.getCmp("local_vrid_entry");
                    if (lv) {
                        lv.setVisible(newValue == "vrrpv3");
                        lv.setDisabled(newValue != "vrrpv3");
                        lv.validate();
                    }
                    var g = Ext.getCmp("vrrp6_addr_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    var mi_grid_set = Ext.getCmp("vrrp6_mi_grid_set");
                    if (mi_grid_set) {
                        mi_grid_set.setVisible(newValue == "monitoredcircuit");
                    }
                    var autoDeactivate = Ext.getCmp("autodeactivation_entry");
                    if (autoDeactivate) {
                        autoDeactivate.setVisible(newValue == "monitoredcircuit");
                    }
                    c.validate();
                    CP.vrrp6.check_user_action();
                }
            }
        },{
            xtype           : "cp4_displayfield"
            ,fieldLabel     : "Mode"
            ,id             : "mode_display"
            ,value          : formatModeDisplay( data["mode"] )
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,height         : 22
            ,style          : colMarginStyle
            ,setNewValue    : function(nV) {
                var md = Ext.getCmp("mode_display");
                md.setValue( formatModeDisplay(nV) );
            }
        },{
            xtype           : "cp4_numberfield"
            ,fieldLabel     : "Local VRID"
            ,id             : "local_vrid_entry"
            ,name           : "local_vrid"
            ,value          : formatLocalVrid(data["local_vrid"])
            ,hidden         : (data["mode"] != "vrrpv3")
            ,disabled       : (data["mode"] != "vrrpv3")
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,height         : 22
            ,allowDecimals  : false
            ,allowBlank     : true
            ,minValue       : 1
            ,maxValue       : 255
            ,maxLength          : 3
            ,enforceMaxLength   : true
            ,emptyText      : "None, optional"
            ,style          : colMarginStyle
            ,setNewValue    : function(nV) {
                var lv = Ext.getCmp("local_vrid_entry");
                lv.setValue( formatLocalVrid(nV) );
            }
            ,getIsLocal     : function() {
                var l = Ext.getCmp("local_vrid_entry").getDBValue();
                var v = Ext.getCmp("vrid_entry").getDBValue();
                return (l != "" && v != "" && l == v);
            }
            ,getDBValue     : function() {
                var c = this;
                var v = "";
                if (c && c.isValid()) {
                    v = parseInt(c.getRawValue(), 10);
                    if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                        v = "";
                    }
                    var m = Ext.getCmp("mode_entry");
                    if (!m || m.getValue() != "vrrpv3") {
                        v = "";
                    }
                }
                return v;
            }
            ,listeners      : {
                change          : function(c, newValue, oldValue, eOpts) {
                    var g = Ext.getCmp("vrrp6_addr_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    CP.vrrp6.check_user_action();
                }
            }
        }]) );

        FormArr.push( generateFormRow("vrrp6_mode_btn_row", 0, [{
            xtype           : "cp4_button"
            ,id             : "vrrp6_adjust_mode_btn"
            ,text           : "Change VRRP Mode"
            //TODO - hidden button to change vrrp mode
            ,hidden         : true
            ,disabled       : (data["interface"] == "")
            ,style          : "margin-bottom:9px;"+ colMarginStyle
            ,handler        : function(b, e, eOpts) {
                var currentMode = Ext.getCmp("mode_entry").getValue();
                var currentIntf = Ext.getCmp("interface_entry").getValue();
                var msgTitle = String("Change VRRP mode for interface "+ currentIntf);
                var msgMsg = "";
                var msgMsg2 = "<br>A mode change is applied to all virtual routers on an interface.  This can lead to incorrect configurations.";
                if ( !(currentIntf) ) {
                    msgTitle = "Change VRRP mode";
                }
                switch( String(currentMode).toLowerCase() ) {
                    case "vrrpv3":
                        msgMsg = "Currently in <u>VRRPv3</u> mode."+ msgMsg2;
                        break;
                    case "monitoredcircuit":
                        msgMsg = "Currently in <u>monitored circuit</u> mode."+ msgMsg2;
                        break;
                    default:
                        msgMsg = "No VRRP mode has been selected.";
                }

                if ( !( Ext.getCmp("vrrp6_adjust_mode_window") ) ) {
                    Ext.create("CP.WebUI4.MessageBox", {
                        id          : "vrrp6_adjust_mode_window"
                        ,animEl     : "vrrp6_adjust_mode_btn"
                        ,autoDestroy: true
                        ,buttonText : {
                            ok      : "OK"
                            ,yes    : "VRRPv3"
                            ,no     : "Monitored Circuit"
                            ,cancel : "Cancel"
                        }
                    });
                }
                Ext.getCmp("vrrp6_adjust_mode_window").show({
                    title       : msgTitle
                    ,msg        : msgMsg
                    ,modal      : true
                    ,animEl     : "vrrp6_adjust_mode_btn"
                    ,minWidth   : 300
                    ,width      : 350
                    ,maxWidth   : 350
                    ,buttons    : Ext.Msg.YESNOCANCEL
                    ,fn         : function(btn, text, opt) {
                        var m_cmp = Ext.getCmp("mode_entry");
                        if (m_cmp) {
                            switch( String(btn).toLowerCase() ) {
                                case "yes":
                                    m_cmp.setValue("vrrpv3");
                                    break;
                                case "no":
                                    m_cmp.setValue("monitoredcircuit");
                                    break;
                            }
                        }
                        CP.vrrp6.check_user_action();
                    }
                });
                CP.vrrp6.check_user_action();
            }
        }]) );

        FormArr.push( generateFormRow("vrrp6_priority_advertiseinterval_row", "", [{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Priority"
            ,id                 : "priority_entry"
            ,name               : "priority"
            ,value              : data["priority"]
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,minValue           : 1
            ,maxValue           : 254
            ,maxLength          : 3
            ,enforceMaxLength   : true
            ,allowBlank         : true
            ,allowDecimals      : false
            ,emptyText          : "Default: 100"
            ,style              : colMarginStyle
            ,getDBValue     : function() {
                var c = Ext.getCmp("priority_entry");
                var v = "";
                if (c) {
                    v = c.getRawValue();
                    if (v != "") {
                        v = parseInt(v, 10);
                        if (v < c.minValue || c.maxValue < v) {
                            v = "";
                        }
                    }
                }
                return String(v);
            }
        },{
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Hello Interval"
            ,id                 : "advertiseinterval_entry"
            ,name               : "advertiseinterval"
            ,value              : data["advertiseinterval"]
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,minValue           : 1
            ,maxValue           : 4095
            ,maxLength          : 4
            ,enforceMaxLength   : true
            ,allowBlank         : true
            ,allowDecimals      : false
            ,emptyText          : "Default: 100 cs"
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = Ext.getCmp("advertiseinterval_entry");
                var v = "";
                if (c) {
                    v = c.getRawValue();
                    if (v != "") {
                        v = parseInt(v, 10);
                        if (v < c.minValue || c.maxValue < v) {
                            v = "";
                        }
                    }
                }
                return String(v);
            }
            ,qtipText           : "Hello Interval is in centiseconds."
            ,listeners          : {
                afterrender         : function(c) {
                    if (c && Ext.typeOf(c.qtipText) == "string") {
                        Ext.tip.QuickTipManager.register({
                            target          : c.getId()
                            ,text           : c.qtipText
                            ,dismissDelay   : 0
                        });
                    }
                }
            }
        }]) );

        FormArr.push( generateFormRow("vrrp6_vmac_static_row", "", [{
            xtype           : "cp4_combobox"
            ,fieldLabel     : "VMAC Mode"
            ,id             : "vmac_entry"
            ,name           : "vmac"
            ,value          : data["vmac"]
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,allowBlank     : false
            ,editable       : true
            ,forceSelection : true
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,store          :   [[""            ,"VRRP"]
                                ,["interface"   ,"Interface"]
                                ,["extended"    ,"Extended"]
                                ,["static"      ,"Static"]]
            ,style          : colMarginStyle
            ,getDBValue     : function() {
                var vmac = String( Ext.getCmp("vmac_entry").getValue() ).toLowerCase();
                return vmac;
            }
            ,listeners      : {
                select          : function(combo, recs, eOpts) {
                    var staticMac = Ext.getCmp("vmac_static_entry");
                    var m = String( combo.getValue() ).toLowerCase();
                    staticMac.setVisible( m == "static" );
                    staticMac.setDisabled(m != "static" );
                    staticMac.validate();
                }
            }
        },{
            xtype               : "cp4_textfield"
            ,fieldLabel         : "Static VMAC"
            ,id                 : "vmac_static_entry"
            ,name               : "vmac_static"
            ,value              : data["vmac_static"]
            ,disabled           : (data["vmac"] != "static")
            ,hidden             : (data["vmac"] != "static")
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,vtype              : "mac"
            ,allowBlank         : false
            ,maxLength          : 17
            ,enforceMaxLength   : true
            ,style              : colMarginStyle
            ,maskRe             : /[:0-9a-fA-F]/
            ,getDBValue         : function() {
                var vmac = Ext.getCmp("vmac_entry").getDBValue();
                var vmac_static = String( Ext.getCmp("vmac_static_entry").getValue() ).toLowerCase();
                return (vmac == "static") ? vmac_static : "";
            }
        }]) );

        FormArr.push( generateFormRow("vrrp6_preempty_autodeactivation_row", "", [{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Preempt Mode"
            ,id                 : "nopreempt_entry"
            ,name               : "nopreempt"
            ,checked            : data["nopreempt"]
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,getDBValue         : function() {
                var c = Ext.getCmp("nopreempt_entry");
                return ( (c.getValue() ) ? "" : "t");
            }
            ,style              : colMarginStyle
            ,listeners      : {
                change         : function() {
                    var monitor_vrrp = Ext.getCmp("monitorvrrp_entry");
                    var has_active_mode = Ext.getCmp("vrrp6_has_active_mode").aam;
                    if (this.getValue() == true || has_active_mode) {
                        monitor_vrrp.setValue(false);
                    } else {
                        monitor_vrrp.setValue(monitor_vrrp.originalValue);
                    }
                    monitor_vrrp.setDisabled(this.getValue() || has_active_mode);
                }
            }
        },{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Auto-deactivation"
            ,id                 : "autodeactivation_entry"
            ,name               : "autodeactivation"
            ,checked            : data["autodeactivation"]
            ,hidden             : (data["mode"] != "monitoredcircuit")
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = Ext.getCmp("autodeactivation_entry").getValue();
                var m = Ext.getCmp("mode_entry").getValue();
                return ( (m == "monitoredcircuit" && c) ? "t" : "");
            }
        }]) );

        FormArr.push( generateFormRow("vrrp6_monitorvrrp_row", "", [{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Monitor VRRP"
            ,id                 : "monitorvrrp_entry"
            ,name               : "monitorvrrp"
            ,checked            : data["monitorvrrp"]
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,hidden             : true
            ,height             : 22
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                return ( this.getValue() ? "t" : "" );
            }
            ,listeners          : {
                change  : function() {
                    var preempt = Ext.getCmp("nopreempt_entry");
                    if (this.getValue() == true) {
                        preempt.setValue(false);
                    } else {
                        preempt.setValue(preempt.originalValue);
                    }
                    preempt.setDisabled(this.getValue());
                }
            }
        }]) );

        /*
        FormArr.push( generateFormRow("vrrp6_accept_row", "", [{
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Accept Mode"
            ,id                 : "localrx_entry"
            ,name               : "localrx"
            ,checked            : data["localrx"]
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,height             : 22
            ,style              : colMarginStyle
            ,getDBValue         : function() {
                var c = Ext.getCmp("localrx_entry");
                return ( (c.getValue() ) ? "t" : "");
            }
        },{xtype: "tbspacer", width: 15, height: 22, margin: "0 0 5 0"}]) );
        // */

        var addr_grid_set = CP.vrrp6.get_addr_grid_set({width: WIDTH, style: colMarginStyle}, WIDTH);
        var mi_grid_set = CP.vrrp6.get_mi_grid_set({
            width   : WIDTH
            ,style  : colMarginStyle
            ,hidden : (data["mode"] != "monitoredcircuit")
        }, WIDTH);

        FormArr.push( generateFormRow("vrrp6_grids_row", "", [addr_grid_set, mi_grid_set]) );

        var formWidth = parseInt(parseInt( (2 * parseInt(WIDTH + hMargin, 10) ), 10) + 20, 10);
        var window_form = {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp6_vrid_window_form"
            ,width      : formWidth
            ,height     : 560
            ,padding    : 0
            ,margin     : 0
            ,autoScroll : true
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("vrrp6_vrid_btn_save");
                CP.ar_util.checkDisabledBtn("vrrp6_vrid_btn_cancel");
                CP.ar_util.checkBtnsbar("vrrp6_addr_btnsbar");
                CP.ar_util.checkBtnsbar("vrrp6_mi_btnsbar");
            }
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    if (p.chkBtns) { p.chkBtns(); }
                    var monitorvrrp_cmp = Ext.getCmp("monitorvrrp_entry");
                    var preempt_cmp = Ext.getCmp("nopreempt_entry");
                    if (monitorvrrp_cmp) {
                        var has_active_mode = Ext.getCmp("vrrp6_has_active_mode").aam;
                        monitorvrrp_cmp.originalValue = data["monitorvrrp"];
                        preempt_cmp.setDisabled(data["monitorvrrp"]);
                        preempt_cmp.original = data["nopreempt"];
                        monitorvrrp_cmp.setDisabled(data["nopreempt"] || has_active_mode);
                    }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "vrrp6_vrid_btn_save"
                    ,text               : "Save"
                    ,formBind           : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e, eOpts) {
                        vrrp6_vrid_save();
                        CP.vrrp6.check_user_action();
                    }
                    ,disabledConditions : function() {
                        var f = Ext.getCmp("vrrp6_vrid_window_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "vrrp6_vrid_btn_cancel"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e, eOpts) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("vrrp6_vrid_window");
                    }
                }
            ]
            ,items      : FormArr
        };

        var window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "vrrp6_vrid_window"
            ,title      : TITLE
            ,shadow     : false
            ,items      : window_form
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
        });
        window.show();

        function test_getDBValue(cmpId) {
            var c = Ext.getCmp(cmpId);
            if ( c && c.getDBValue ) {
                return ( c.getDBValue() );
            }
            return "";
        }

        function vrrp6_vrid_save() {
            var params = CP.ar_util.clearParams();
            var prefix = CP.vrrp6.getPrefix();
            var i,j;
            var a,b,v, recs, dArr;
            var isLocal = ( (Ext.getCmp("local_vrid_entry") ) ? Ext.getCmp("local_vrid_entry").getIsLocal() : false);

            var intf        = test_getDBValue("interface_entry");
            var mode        = test_getDBValue("mode_entry");
            var local_vrid  = test_getDBValue("local_vrid_entry");
            var vrid    = test_getDBValue("vrid_entry");
            if (vrid == "") { return; }

            var iprefix = prefix +":interface:"+ intf;
            params[iprefix]                 = "t";
            params[iprefix +":mode"]        = mode;
            params[iprefix +":local_vrid"]  = local_vrid;

            var vprefix = iprefix +":virtualrouter:"+ vrid;

            params[vprefix]                         = "t";
            params[vprefix +":advertiseinterval"]   = test_getDBValue("advertiseinterval_entry");
            params[vprefix +":autodeactivation"]    = test_getDBValue("autodeactivation_entry");
            params[vprefix +":localrx"]             = ""; //test_getDBValue("localrx_entry");
            params[vprefix +":nopreempt"]           = test_getDBValue("nopreempt_entry");
            params[vprefix +":monitorvrrp"]         = test_getDBValue("monitorvrrp_entry");
            params[vprefix +":priority"]            = test_getDBValue("priority_entry");
            params[vprefix +":vmac"]                = test_getDBValue("vmac_entry");
            params[vprefix +":vmac:static"]         = test_getDBValue("vmac_static_entry");

            //Handle Backup Addresses
            var addrPrefix = vprefix +":address:addr:v6addr:";
            //Step 1.  Delete entries in delete array
            var addr_del_btn = Ext.getCmp("vrrp6_addr_btn_delete");
            if (addr_del_btn && addr_del_btn.deleteArr) {
                dArr = addr_del_btn.deleteArr;
                if (dArr.length > 0) {
                    for(i = 0; i < dArr.length; i++) {
                        params[addrPrefix + dArr[i]] = "";
                    }
                }
            }

            //Step 2.  Add entries in the store that aren't invalid or in use
            var addr_st = Ext.getStore("vrrp6_st_addr");
            var inet_st = Ext.getStore("if_inet6_store");
            if (addr_st && inet_st) {
                inet_st.clearFilter(true);
                var inets = inet_st.getRange();
                var oU;
                recs = addr_st.getRange();
                for(i = 0; i < recs.length; i++) {
                    a = CP.ip6convert.ip6_2_db(recs[i].data.addr_c);
                    v = "t";
                    if (vrid == local_vrid) {
                        if ( !CP.vrrp6.bkaddr_inList(intf,a) ) {
                            v = "";
                        }
                    }

                    if (v == "t") {
                        oU = CP.vrrp6.bkaddr_inUse(intf, vrid, a);
                        if (oU.length > 0) {
                            v = "";
                        }
                    }
                    params[addrPrefix + a] = v;
                    /*
                    if (v == "t") {
                        oU = CP.vrrp6.bkaddr_inUse(intf, vrid, a);
                        for(j = 0; j < oU.length; j++) {
                            if (oU[j].intf && oU[j].vrid) {
                                params[prefix +":interface:"+ oU[j].intf +":virtualrouter:"+ oU[j].vrid +":address:addr:v6addr:"+ a] = "";
                            }
                        }
                    }
                    // */
                }
            }

            //Handle Monitor Interfaces
            var monPrefix = vprefix +":monitor:monif:";
            if (mode == "monitoredcircuit") {
                //Step 1.  Delete entries in delete array
                var mi_del_btn = Ext.getCmp("vrrp6_mi_btn_delete");
                if (mi_del_btn && mi_del_btn.deleteArr) {
                    dArr = mi_del_btn.deleteArr;
                    if (dArr.length > 0) {
                        for(i = 0; i < dArr.length; i++) {
                            params[monPrefix + dArr[i]]                 = "";
                            params[monPrefix + dArr[i] +":priority"]    = "";
                        }
                    }
                }
                //Step 2.  Add entries in store
                var mi_st = Ext.getStore("vrrp6_st_mi");
                if (mi_st) {
                    recs = mi_st.getRange();
                    for(i = 0; i < recs.length; i++) {
                        a = recs[i].data;
                        if (a.monif != intf) {
                            params[monPrefix + a.monif]                 = (a.monif != intf ? "t" : "");
                            params[monPrefix + a.monif +":priority"]    = (a.monif != intf ? a.priority : "");
                        }
                    }
                }
            } else {
                //Delete for all interfaces
                var intf_st = Ext.getStore("intf_store");
                if (intf_st) {
                    recs = intf_st.getRange();
                    for(i = 0; i < recs.length; i++) {
                        params[monPrefix + recs[i].data.intf]               = "";
                        params[monPrefix + recs[i].data.intf +":priority"]  = "";
                    }
                }
            }

            CP.vrrp6.mySubmit();
        }
    }

    ,valid_intf_vrid_mode       : function (mcOnly) {
        if (!mcOnly) { mcOnly = false; }
        var i = Ext.getCmp("interface_entry");
        var v = Ext.getCmp("vrid_entry");
        var m = Ext.getCmp("mode_entry");
        if (i && v && m) {
            var iV = i.validate();
            var vV = v.validate();
            var mV = m.validate();
            if (iV && vV && mV) {
                if (mcOnly && m.getValue() != "monitoredcircuit") {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

// Backup Address set //////////////////////////////////////////////////////////
    ,bkaddr_inList              : function(intf, addr32) {
        //checks if the passed db style addr is in the if_inet6_store and has the same intf
        //returns true if both match
        //returns false if not found or if the address is found on a different intf
        var inet_st = Ext.getStore("if_inet6_store");
        var recs = inet_st.getRange();
        var i;
        var foundMatch = false;
        for(i = 0; i < recs.length; i++) {
            if ( addr32 == CP.ip6convert.ip6_2_db(recs[i].data.addr6_c) ) {
                if (intf != recs[i].data.intf) {
                    return false;
                }
                foundMatch = true;
            }
        }
        return foundMatch;
    }
    ,bkaddr_inUse               : function(intf, vrid, addr) {
        //identify other interface/vrid that use the same addr
        //returns an array of objs
        //  obj = {
        //      "intf"  : otherIntf
        //      ,"vrid" : vrid on otherIntf
        //  };
        var vrrp6_st = Ext.getStore("vrrp6_st");
        var recs, d, i, j, addrs;
        var a, b;
        var retArr = [];
        a = String(addr).slice(0,32);
        if (vrrp6_st) {
            recs = vrrp6_st.getRange();
            for(i = 0; i < recs.length; i++) {
                d = recs[i].data;
                if (d["interface"] != intf || d["vrid"] != vrid) {
                    addrs = d.addr_vridlist;
                    for(j = 0; j < addrs.length; j++) {
                        if ( a == String(addrs[j].addr).slice(0,32) ) {
                            retArr.push({
                                "intf"  : d["interface"]
                                ,"vrid" : d["vrid"]
                            });
                        }
                    }
                }
            }
        }
        return retArr;
    }

    ,get_addr_grid_set          : function(def, WIDTH) {
        var btns = {
            xtype   : "cp4_btnsbar"
            ,id     : "vrrp6_addr_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "vrrp6_addr_btn_add"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var g = Ext.getCmp("vrrp6_addr_grid");
                        if (g) {
                            g.getSelectionModel().deselectAll();
                        }
                        var lv = Ext.getCmp("local_vrid_entry");
                        var isLocal = (lv) ? lv.getIsLocal() : false;
                        CP.vrrp6.open_addr_add_window(isLocal);
                    }
                    ,disabledConditions : function() {
                        return !( CP.vrrp6.valid_intf_vrid_mode(false) );
                    }
                },{
                    text                : "Edit"
                    ,id                 : "vrrp6_addr_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var lv = Ext.getCmp("local_vrid_entry");
                        var isLocal = (lv) ? lv.getIsLocal() : false;
                        CP.vrrp6.open_addr_add_window(isLocal);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.vrrp6.valid_intf_vrid_mode(false) ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrrp6_addr_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true );
                    }
                },{
                    text                : "Delete"
                    ,id                 : "vrrp6_addr_btn_delete"
                    ,disabled           : true
                    ,deleteArr          : []
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var st = Ext.getStore("vrrp6_st_addr");
                        var g = Ext.getCmp("vrrp6_addr_grid");
                        if (g) {
                            var recs = g.getSelectionModel().getSelection();
                            var i;
                            var j;

                            if( recs && recs.length ) {
                                // If there are any addresses remaining after the deletion, there must be at least
                                // one link local address.  Otherwise refuse to delete.
                                var all_recs = st.getRange();
                                if (recs.length < all_recs.length) {
                                    var remainingRecs = [];
                                    for(i = 0; i < all_recs.length; i++) {
                                        var isRemaining = true;

                                        for(j = 0; j < recs.length; j++) {
                                            if ( recs[j] == all_recs[i] ) {
                                                isRemaining = false;
                                                break;
                                            }
                                        }

                                        if ( isRemaining ) {
                                            remainingRecs.push(all_recs[i]);
                                        }
                                    }

                                    var isLinkLocalLeftOver = false;
                                    for(i = 0; i < remainingRecs.length; i++) {
                                        if (CP.util.isLinkLocal(remainingRecs[i].data.addr_c)) {
                                            isLinkLocalLeftOver = true;
                                            break;
                                        }
                                    }
    
                                   if ( ! isLinkLocalLeftOver ) {
                                        /* 
                                            There is at least one address remaining but none of the 
                                            remaining addresses are link local which is not valid
                                        */
                                        Ext.Msg.show({
                                            title   : "Cannot Remove"
                                           ,msg    : "<center>The selected item(s) cannot be removed because at least one interface must be link-local (fe80:0:0:0::).<br /><br />(Try removing the other interfaces first).</center>"
                                           ,animEl : "elId"
                                           ,buttons: Ext.Msg.OK
                                        });

                                        return;
                                    }
                                }
                            }
    
                            for(i = 0; i < recs.length; i++) {
                                a = CP.ip6convert.ip6_2_db( recs[i].data.addr_c );
                                if ( !(recs[i].data["new"]) ) {
                                    b.deleteArr.push(a);
                                }
                                st.remove(recs[i]);
                            }

                            g.getView().refresh();
                        }
                        var mode_cmp = Ext.getCmp("mode_entry");
                        if (mode_cmp && mode_cmp.validate) { mode_cmp.validate(); }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.vrrp6.valid_intf_vrid_mode(false) ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrrp6_addr_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true );
                    }
                }
            ]
        };

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp6_addr_grid"
            ,width              : WIDTH
            ,height             : CP.vrrp6.SUBGRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,store              : Ext.getStore("vrrp6_st_addr")
            ,columns            : [
                {
                    text            : "Backup Address"
                    ,dataIndex      : "addr"
                    ,menuDisabled   : true
                    ,flex           : 1
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var addr32 = String(value).slice(0,32).toLowerCase();
                        var addr_c = CP.ip6convert.db_2_ip6(addr32);

                        var color = "black";
                        var retValue = String(addr_c).toUpperCase();
                        var tip = retValue;
                        var tipExtra = "";
                        var ba_st = Ext.getStore("vrrp6_st_addr");
                        var ba_recs = ba_st.getRange();
                        var noLinkLocal = true;
                        var i;
                        for(i = 0; noLinkLocal && i < ba_recs.length; i++) {
                            var addrItem = CP.ip6convert.db_2_ip6(ba_recs[i].data.addr);
                            if (CP.util.isLinkLocal(addrItem)) {
                                noLinkLocal = false;
                            }
                        }
                        if (noLinkLocal) {
                            color = "red";
                            tipExtra = "<br />No link local address defined.  Please define one.";
                        }

                        var intf_cmp = Ext.getCmp("interface_entry");
                        var intf = (intf_cmp ? intf_cmp.getDBValue() : "");
                        var vrid_cmp = Ext.getCmp("vrid_entry");
                        var vrid = (vrid_cmp ? vrid_cmp.getDBValue() : "");

                        //if local vrid, check that is it the list for that intf
                        var isLocal = false;
                        var lv_cmp = Ext.getCmp("local_vrid_entry");
                        if (lv_cmp && color == "black") {
                            isLocal = lv_cmp.getIsLocal();
                            if (isLocal) {
                                if ( !CP.vrrp6.bkaddr_inList(intf, addr32) ) {
                                    color = "red"; //must find to be valid
                                    tipExtra = "<br />Backup address must be in the list for this interface.<br />Address will be deleted on save.";
                                }
                            }
                        }

                        //if color is still "black", check for other uses, mark blue
                        if (color == "black") {
                            var otherUses = CP.vrrp6.bkaddr_inUse(intf, vrid, addr32);
                            if (otherUses.length > 0) {
                                color = "red";
                                tipExtra = String(tipExtra) + "<br />Also in use by:";
                                for(i = 0; i < otherUses.length; i++) {
                                    tipExtra = String(tipExtra) + String("<br />&nbsp;&nbsp;Interface "+ otherUses[i].intf +" VRID "+ otherUses[i].vrid);
                                }
                                tipExtra = String(tipExtra) +"<br />Will not be saved.";
                            }
                        }
                        return CP.ar_util.rendererSpecific(retValue, tip + tipExtra, "left", color);
                    }
                }
            ]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function(view, selections, eOpts) {
                        CP.vrrp6.check_user_action();
                    }
                }
            })
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("vrrp6_addr_btn_edit");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return Ext.apply(def, {
            xtype   : "cp4_formpanel"
            ,id     : "vrrp6_addr_grid_set"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Backup Addresses"
                    ,margin     : "8 0 10 0"
                }
                ,btns
                ,grid
            ]
        });
    }

    ,open_addr_add_window       : function(isLocal) {
        var Arr = [];
        var LABELWIDTH = 100;
        var WIDTH = (LABELWIDTH + 280);

        var addr_originalValue = "";
        var addr_value = "";
        var addr_grid = Ext.getCmp("vrrp6_addr_grid");
        if (addr_grid) {
            var sm = addr_grid.getSelectionModel();
            if (sm && sm.getCount() == 1) {
                var rec = sm.getLastSelected();
                if (rec) {
                    addr_value          = rec.data.addr_c || "";
                    addr_originalValue  = rec.data.addr_c || "";
                }
            }
        }

        var addr_cmp = {
            xtype               : "cp4_combobox"
            ,fieldLabel         : "Backup Address"
            ,id                 : "vrrp6_addr_entry"
            ,name               : "vrrp6_addr_entry_unique"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,value              : addr_value
            ,originalValue      : addr_originalValue
            ,allowBlank         : false
            ,style              : "margin-left:15px;margin-top:15px;"
            ,getValues          : function() {
                var addrC = "";
                var addrD = "";
                var c = Ext.getCmp("vrrp6_addr_entry");
                if (c) {
                    addrC = c.getValue();
                    addrD = CP.ip6convert.ip6_2_db(addrC);
                    addrC = CP.ip6convert.db_2_ip6(addrD);
                }
                return [addrD,addrC];
            }
        };
        if (isLocal) {
            Ext.apply(addr_cmp, {
                editable            : true
                ,forceSelection     : true
                ,queryMode          : "local"
                ,lastQuery          : ""
                ,triggerAction      : "all"
                ,store              : Ext.getStore("if_inet6_store")
                ,valueField         : "addr6_c"
                ,displayField       : "addr6_c"
            });
        } else {
            addr_cmp.xtype = "cp4_ipv6field";
            Ext.apply(addr_cmp, {
                maxLength           : 39
                ,enforceMaxLength   : true
                ,validator          : function(v) {
                    var validIP6String = String( CP.util.isValidIPv6(v) );
                    if (validIP6String != "true") {
                        return validIP6String;
                    }
                    var v_db = String( CP.ip6convert.ip6_2_db(v) ).toLowerCase();
                    var v_ip6 = CP.ip6convert.db_2_ip6(v_db);
                    var m = CP.addr_list.getMatchMessage(v_ip6);
                    if (m != "") {
                        return m;
                    }

                    var intf = Ext.getCmp("interface_entry").getDBValue();
                    var vrid = Ext.getCmp("vrid_entry").getDBValue();
                    if (intf == "") {
                        return "Specify an Interface before trying to add a backup address.";
                    }
                    if (vrid == "") {
                        return "Specify a Virtual Router ID number before trying to add a backup address.";
                    }

                    var oU = CP.vrrp6.bkaddr_inUse(intf, vrid, v_db);
                    if (oU.length > 0) {
                        return "This backup address is already in use by another configuration.";
                    }
                    
                    if (CP.util.getIPv6AddressType(v_db) 
                            == CP.util.ADDR_TYPE_V6_LINK_LOCAL) {
                        // The value the user is editing (v_db) is a valid link 
                        // local so we have at least one.  This means
                        // we can skip the remaining validation which exists to
                        // ensure that there is at least one link local address 
                        // in the list
                        return true;                       
                    }

                    var c = Ext.getCmp("vrrp6_addr_entry");
                    var addr_orig = "";
                    if (c) {
                        addr_orig = String(c.originalValue);
                        addr_orig = String( CP.ip6convert.ip6_2_db(addr_orig) ).toLowerCase();
                    }

                    var ba_st = Ext.getStore("vrrp6_st_addr");
                    var ba_recs = ba_st.getRange();
                    var i, ba_a;

                    // See if there is a link local address in the updated list.  If not, validation fails
                    for(i = 0; i < ba_recs.length; i++) {
                        ba_a = String(ba_recs[i].data.addr).toLowerCase();

                        if ( addr_orig != "" && ba_a.indexOf(addr_orig) == 0 ) {
                            // Exclude the address the user is editing from the validation check. If the updated value
                            // is a link local address, we will have already exited the validation function above
                            continue;
                        }

                        var addrItem = CP.ip6convert.db_2_ip6(ba_a);
                        if (CP.util.isLinkLocal(addrItem)) {
                            return true;
                        }
                    }

                    return "The first backup address should be link local (fe80:0:0:0::).";
                }
            });
        }
        Arr.push(addr_cmp);

        Arr.push({
            xtype   : "cp4_inlinemsg"
            ,type   : "info"
            ,text   : CP.vrrp6.LINK_LOCAL_MSG
            ,style  : "margin-left:15px;margin-bottom:10px;"
            ,width  : WIDTH
        });

        Arr.push({xtype: "tbspacer", width: 15, height: 10});

        Ext.create("CP.WebUI4.ModalWin", {
            id          : "vrrp6_addr_window"
            ,title      : "Add Backup Address"
            ,shadow     : false
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "vrrp6_addr_form"
                ,width      : (WIDTH + 40)
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : true
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("vrrp6_addr_btn_save");
                    CP.ar_util.checkDisabledBtn("vrrp6_addr_btn_cancel");
                }
                ,listeners  : {
                    afterrender : function(p, eOpts) {
                        p.form._boundItems = null;
                        var inet6_st = Ext.getStore("if_inet6_store");
                        if (inet6_st) {
                            inet6_st.loadInterface();
                        }
                        if (p.chkBtns) { p.chkBtns(); }
                    }
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,id                 : "vrrp6_addr_btn_save"
                        ,text               : "Ok"
                        ,disabled           : true
                        ,formBind           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            var c = Ext.getCmp("vrrp6_addr_entry");
                            if (c) {
                                var addrDC = c.getValues();
                                var addr_db = addrDC[0];
                                var addr_ip = String( addrDC[1] );
                                var addr_orig = String(c.originalValue);
                                if (addr_ip != "") {
                                    if (addr_orig != "" && ( addr_orig.toLowerCase() != addr_ip.toLowerCase() ) ) {
                                        var delBtn = Ext.getCmp("vrrp6_addr_btn_delete");
                                        if (delBtn && delBtn.handler) {
                                            delBtn.handler(delBtn);
                                        }
                                    }
                                    var st = Ext.getStore("vrrp6_st_addr");
                                    if (st && st.findExact("addr_c", addr_ip) == -1) {
                                        st.add({"addr": addr_db, "addr_c": addr_ip, "new": true});
                                    }
                                }
                            }
                            var g = Ext.getCmp("vrrp6_addr_grid");
                            if (g && g.getView) {
                                g.getView().refresh();
                            }
                            CP.ar_util.checkWindowClose("vrrp6_addr_window");
                        }
                        ,disabledConditions : function() {
                            var f = Ext.getCmp("vrrp6_addr_form");
                            return !(f ? f.getForm().isValid() : false);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,id                 : "vrrp6_addr_btn_cancel"
                        ,text               : "Cancel"
                        ,overrideNoToken    : false
                        ,handler2           : function(b) {
                            CP.ar_util.checkWindowClose("vrrp6_addr_window");
                        }
                    }
                ]
                ,items      : Arr
            }]
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
                ,beforeclose: function(win, eOpts) {
                    var inet6_st = Ext.getStore("if_inet6_store");
                    if (inet6_st) {
                        inet6_st.clearFilter(true);
                    }
                    var g = Ext.getCmp("vrrp6_addr_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    var mode_cmp = Ext.getCmp("mode_entry");
                    if (mode_cmp && mode_cmp.validate) { mode_cmp.validate(); }
                    return true;
                }
            }
        });
        var win = Ext.getCmp("vrrp6_addr_window");
        if (win) { win.show(); }
    }

// Monitored Interface Set /////////////////////////////////////////////////////
    ,get_mi_grid_set            : function(def, WIDTH) {
        var btns = {
            xtype   : "cp4_btnsbar"
            ,id     : "vrrp6_mi_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "vrrp6_mi_btn_add"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        if (g) {
                            g.getSelectionModel().deselectAll();
                        }
                        CP.vrrp6.open_mi_window("", 10);
                    }
                    ,disabledConditions : function() {
                        return !( CP.vrrp6.valid_intf_vrid_mode(false) );
                    }
                },{
                    text                : "Edit"
                    ,id                 : "vrrp6_mi_btn_edit"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        if (g) {
                            var recs = g.getSelectionModel().getSelection();
                            if (recs.length == 1) {
                                CP.vrrp6.open_mi_window(recs[0].data.monif, recs[0].data.priority);
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.vrrp6.valid_intf_vrid_mode(false) ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true );
                    }
                },{
                    text                : "Delete"
                    ,id                 : "vrrp6_mi_btn_delete"
                    ,disabled           : true
                    ,deleteArr          : []
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var st = Ext.getStore("vrrp6_st_mi");
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        if (g) {
                            var recs = g.getSelectionModel().getSelection();
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                if ( !(recs[i].data["new"]) ) {
                                    b.deleteArr.push( recs[i].data.monif );
                                }
                            }
                            if (st && st.remove) {
                                st.remove(recs);
                            }
                            g.getView().refresh();
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.vrrp6.valid_intf_vrid_mode(false) ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrrp6_mi_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true );
                    }
                }
            ]
        };

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrrp6_mi_grid"
            ,width              : WIDTH
            ,height             : CP.vrrp6.SUBGRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,store              : Ext.getStore("vrrp6_st_mi")
            ,columns            : [
                {
                    text            : "Interface"
                    ,dataIndex      : "monif"
                    ,menuDisabled   : true
                    ,flex           : 1
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.monif);
                        var tip = retValue;
                        var color = "black";
                        var Intf = "";
                        var intf_cmp = Ext.getCmp("interface_entry");
                        if (intf_cmp) {
                            Intf = intf_cmp.getDBValue();
                        }
                        if (retValue == Intf) {
                            tip = retValue + "<br>Cannot monitor own interface.  This entry will be excluded on save.";
                            color = "red";
                        }
                        return CP.ar_util.rendererSpecific(retValue, tip, "left", color);
                    }
                },{
                    text            : "Delta Priority"
                    ,dataIndex      : "priority"
                    ,menuDisabled   : true
                    ,width          : 100
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.priority || "";
                        return CP.ar_util.rendererSpecific(retValue);
                    }
                }
            ]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function(view, selections, eOpts) {
                        CP.vrrp6.check_user_action();
                    }
                }
            })
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("vrrp6_mi_btn_edit");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return Ext.apply(def, {
            xtype   : "cp4_formpanel"
            ,id     : "vrrp6_mi_grid_set"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Monitored Interfaces"
                    ,margin     : "8 0 10 0"
                }
                ,btns
                ,grid
            ]
        });
    }

    ,open_mi_window             : function(intf_str, dp_value) {
        if ( !intf_str ) { intf_str = ""; }
        if ( !dp_value ) { dp_value = 10; }
        var TITLE = "Edit Monitored Interface "+ intf_str;
        var Arr = [];
        var LABELWIDTH = 150;
        var WIDTH = (LABELWIDTH + 145);

        function delta_priority_load_n_recal(intf) {
            if (!intf) {
                intf = "";
            }
            var st = Ext.getStore("vrrp6_st_mi");
            var sumDP = 0;
            var retValue = 254;
            var i;
            if (st) {
                var r = st.findRecord("monif", intf, 0, false, true, true);
                var dp_cmp = Ext.getCmp("delta_priority_entry");
                var recs = st.getRange();
                for(i = 0; i < recs.length; i++) {
                    if (intf != recs[i].data.monif) {
                        sumDP += parseInt(recs[i].data.priority, 10);
                    }
                }
                retValue = Ext.Number.constrain( (254 - parseInt(sumDP,10) ), 1, 254);
                if (dp_cmp) {
                    dp_cmp.setMaxValue( retValue );
                    if (intf != "" && r) {
                        dp_cmp.setValue( parseInt(r.data.priority, 10) );
                    } else {
                        dp_cmp.setValue( 10 );
                    }
                }
            }
            return retValue;
        }

        var monif_cmp = {
            fieldLabel      : "Monitored Interface"
            ,id             : "monif_entry"
            ,name           : "monif_entry_unique"
            ,labelWidth     : LABELWIDTH
            ,width          : WIDTH
            ,value          : intf_str
            ,allowBlank     : false
            ,style          : "margin-left:15px;margin-top:15px;"
        };
        if (intf_str != "") {
            Ext.apply(monif_cmp, {
                xtype           : "cp4_displayfield"
                ,height         : 22
            });
        } else {
            TITLE = "Add Monitored Interface";
            Ext.apply(monif_cmp, {
                xtype           : "cp4_combobox"
                ,editable       : true
                ,forceSelection : true
                ,queryMode      : "local"
                //,lastQuery      : ""
                ,triggerAction  : "all"
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,listeners      : {
                    change          : function(c, newValue, oldValue, eOpts) {
                        delta_priority_load_n_recal(newValue);
                    }
                }
                ,validator      : function(v) {
                    var i = Ext.getCmp("interface_entry").getValue();
                    if (v != "") {
                        if (i == v) {
                            return "A virtual router can\'t monitor its own interface.";
                        }
                        return true;
                    }
                    return "";
                }
            });
        }
        Arr.push(monif_cmp);

        Arr.push({
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Delta Priority"
            ,id                 : "delta_priority_entry"
            ,labelWidth         : LABELWIDTH
            ,width              : WIDTH
            ,value              : dp_value
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : delta_priority_load_n_recal(intf_str)
            ,maxLength          : 3
            ,enforceMaxLength   : true
            ,style              : "margin-left:15px;margin-bottom:15px;"
        });

        Ext.create("CP.WebUI4.ModalWin", {
            id          : "vrrp6_mi_window"
            ,title      : TITLE
            ,shadow     : false
            ,items      : [{
                xtype       : "cp4_formpanel"
                ,id         : "vrrp6_mi_form"
                ,width      : (WIDTH + 40)
                ,padding    : 0
                ,margin     : 0
                ,autoScroll : true
                ,items      : Arr
                ,chkBtns    : function() {
                    CP.ar_util.checkDisabledBtn("vrrp6_mi_btn_save");
                    CP.ar_util.checkDisabledBtn("vrrp6_mi_btn_cancel");
                }
                ,listeners  : {
                    afterrender : function(p, eOpts) {
                        p.form._boundItems = null;
                    }
                }
                ,buttons    : [
                    {
                        xtype               : "cp4_button"
                        ,id                 : "vrrp6_mi_btn_save"
                        ,text               : "Ok"
                        ,disabled           : true
                        ,formBind           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            var monif_cmp = Ext.getCmp("monif_entry");
                            var dp_cmp = Ext.getCmp("delta_priority_entry");
                            var st = Ext.getStore("vrrp6_st_mi");
                            if (st && monif_cmp && dp_cmp) {
                                var monif = monif_cmp.getValue();
                                var dp = dp_cmp.getValue();
                                var rec = st.findRecord("monif", monif, 0, false, true, true);
                                if (rec) {
                                    rec.data.priority = dp;
                                } else {
                                    st.add({"monif": monif, "priority": dp, "new": true});
                                }
                                CP.ar_util.checkWindowClose("vrrp6_mi_window");
                            }
                        }
                        ,disabledConditions : function() {
                            var f = Ext.getCmp("vrrp6_mi_form");
                            return !(f ? f.getForm().isValid() : false);
                        }
                    },{
                        xtype               : "cp4_button"
                        ,id                 : "vrrp6_mi_btn_cancel"
                        ,text               : "Cancel"
                        ,handler            : function(b) {
                            CP.ar_util.checkWindowClose("vrrp6_mi_window");
                        }
                    }
                ]
            }]
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
                ,beforeclose: function(win, eOpts) {
                    var g = Ext.getCmp("vrrp6_mi_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    return true;
                }
            }
        });
        var win = Ext.getCmp("vrrp6_mi_window");
        if (win) { win.show(); }
    }
}

