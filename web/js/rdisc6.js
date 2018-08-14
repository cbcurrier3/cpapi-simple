CP.rdisc6 = {
    INTF_LABELWIDTH             : 150
    ,ADDR_LABELWIDTH            : 225
    ,MAX_ADV_INTERVAL_DEFAULT   : 600

    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("rdisc6_btnsbar");
        CP.ar_util.checkBtnsbar("rdisc6_form");
        CP.ar_util.checkBtnsbar("rdisc6_vlink_form");
    }

//STUB: init
    ,init               : function() {
        CP.rdisc6.defineStores();
        var configPanel = CP.rdisc6.configPanel();
        var obj = {
            title           : "Router Discovery"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/rdisc6.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("rdisc6_window");
                CP.rdisc6.doLoad();

                // Refresh the monitor tab with the new data
                if (CP && CP.rdisc6_monitor_4 && CP.rdisc6_monitor_4.doLoad) {
                    CP.rdisc6_monitor_4.doLoad();
                }
            }
            ,submitFailure  : function() {
                CP.rdisc6.doLoad();
            }
            ,checkCmpState  : CP.rdisc6.check_user_action
            ,helpFile       : "rdisc6Help.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }
    ,get_prefix                     : function(intf) {
        if (intf == null || intf == undefined || intf == "") {
            return "";
        }
        return "routed:instance:"+ CP.ar_util.INSTANCE() +":routerdiscovery6:interface:"+ intf;
    }

//STUB:defineStores
    ,defineStores       : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["rdisc6_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        //intf-list.tcl
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
                ,"addr4_list"
                ,"addr6"
                ,"addr6_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "loopback 6in4 6to4 vpnt pppoe gre"
                    ,"excludeLoopbackAddr"  : "1"
                    ,"excludeLL"    : 1
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.intfs"
                }
            }
            ,sorters    :   [{ property: "intf", direction  : "ASC" }]
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        // List of all enabled interfaces and related rdisc6 parameters
        // as returned from rdisc6.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"enable"
                ,"curhoplimit"
                ,"lifetime"
                ,"linkmtu"
                ,"managed"
                ,"maxadvinterval"
                ,"minadvinterval"
                ,"otherconfig"
                ,"reachabletimer"
                ,"retransmissiontimer"
                ,"addr6_list"
                ,"dns_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc6.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rdisc6"
                }
            }
            ,sorters    :   [{ property: "intf", direction: "ASC" }]
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        // List of all enabled interfaces and related rdisc6 parameters
        // as returned from rdisc6.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"addr6_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc6.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"        : "interface"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rdisc6"
                }
            }
            ,listeners  : {
                load        : function(st) {
                    var intf = Ext.getCmp("rdisc6_intf_entry").getValue();
                    var i_rec = st.findRecord("intf", intf, 0, false, true, true);
                    var st = Ext.getStore("rdisc6_vlink_store");
                    st.removeAll();

                    var addr6_list = i_rec.data.addr6_list;
                    var i;
                    for(i = 0; i < addr6_list.length; i++) {
                        st.add({
                            "addr6"                 : addr6_list[i].addr6
                            ,"addr6_raw"            : addr6_list[i].addr6_raw
                            ,"onlink_rev"           : true
                            ,"autonomous_rev"       : true
                            ,"validlifetime"        : ""
                            ,"preferredlifetime"    : ""
                        });
                    }
                }
            }
        });

        //memory
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_vlink_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "addr6"
                ,"addr6_raw"
                ,"onlink_rev"
                ,"autonomous_rev"
                ,"validlifetime"
                ,"preferredlifetime"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        //DNS
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc6_dns_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "dns"
                ,"dtype"
                ,"dns_lifetime"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,showNotifyMessage  : function() {
                var st = this;
                var msgCmp = Ext.getCmp("rdisc6_dns_life_msg");
                var maxAdvCmp = Ext.getCmp("rdisc6_maxadvinterval_entry");
                if (!msgCmp || !maxAdvCmp) {
                    return;
                }
                if (st.getCount() < 1) {
                    msgCmp.setVisible(false);
                    return;
                }
                var maxAdvVal = maxAdvCmp.getLogicalValue();
                var recs = st.getRange();
                var i, v;
                for (i = 0; i < recs.length; i++) {
                    v = recs[i].data.dns_lifetime;
                    if (!v) {
                        continue;
                    }
                    if (v < maxAdvVal || v > (2 * maxAdvVal)) {
                        msgCmp.setVisible(true);
                        return;
                    }
                }
                msgCmp.setVisible(false);
            }
            ,listeners      : {
                load        : function(st) {
                    st.showNotifyMessage();
                }
                ,datachanged: function(st) {
                    st.showNotifyMessage();
                }
            }
        });
    }
    ,load_vlink_dns_store       : function(rec) {
        var st_vlink = Ext.getStore("rdisc6_vlink_store");
        if (st_vlink) {
            if (rec) {
                st_vlink.loadData(rec.data.addr6_list);
            } else {
                st_vlink.removeAll();
            }
        }
        var st_dns = Ext.getStore("rdisc6_dns_store");
        if (st_dns) {
            if (rec) {
                st_dns.loadData(rec.data.dns_list);
            } else {
                st_dns.removeAll();
            }
            if (st_dns.showNotifyMessage) {
                st_dns.showNotifyMessage();
            }
        }
    }

//STUB:configPanel
    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "rdisc6_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.rdisc6.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("rdisc6"),
                CP.rdisc6.get_grid() //get main rdisc6 grid and buttons
            ]
        });
        return configPanel;
    }

    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        var instance_string = CP.ar_util.INSTANCE();
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }
        var intf_store = Ext.getStore("intf_store");
        if (intf_store) {
            CP.ar_util.loadListPush("intf_store");
            intf_store.load({params: {"instance": instance_string}});
        }
        var rdisc6_store = Ext.getStore("rdisc6_store");
        if (rdisc6_store) {
            CP.ar_util.loadListPush("rdisc6_store");
            rdisc6_store.load({params: {"instance": instance_string}});
        }
        var vlink_store = Ext.getStore("rdisc6_vlink_store");
        if (vlink_store) {
            vlink_store.removeAll();
        }
        CP.ar_util.loadListPop("mySubmit");
    }

//GRID RENDERERS

//side-by-side components (typically a numberfield with seconds after it)
    ,component_with_units   : function(leftCmp, colWidth, units) {
        //leftCmp is the component on the left
        //colWidth is the width of the grouped components
        //units is a string of the units
        return {
            xtype   : "cp4_formpanel"
            ,id     : String(leftCmp.id) +"_set"
            ,layout : "column"
            ,width  : colWidth
            ,margin : 0
            ,items  : [
                leftCmp
                ,{
                    xtype   : "cp4_label"
                    ,text   : units
                    ,width  : 50
                    ,style  : "margin-top:4px;margin-left:5px;"
                }
            ]
        };
    }

//STUB:get_grid
    ,get_grid               : function() {
        function delete_rdisc(rec) {
            var params  = CP.ar_util.getParams();
            var prefix  = CP.rdisc6.get_prefix(rec.data.intf);
            if (prefix == "") {
                return;
            }
            var vlink, vprefix, i;
            for(i = 0; i < rec.data.addr6_list.length; i++) {
                vlink   = rec.data.addr6_list[i];
                vprefix = prefix +":address:v6addr:"+ String(vlink.addr6_raw).substring(0,32).toLowerCase();
                params[vprefix +":noautonomous"]        = "";
                params[vprefix +":noonlink"]            = "";
                params[vprefix +":preferredlifetime"]   = "";
                params[vprefix +":validlifetime"]       = "";
                params[vprefix]                         = "";
            }
            var dentry, dprefix;
            for (i = 0; i < rec.data.dns_list.length; i++) {
                dentry  = rec.data.dns_list[i];
                dprefix = prefix + ":" + dentry.dtype + ":" + dentry.dns;

                if (String(dentry.dtype).charAt(3) == "s") {
                    dprefix = prefix + ":" + dentry.dtype + ":" + CP.ip6convert.ip6_2_db(dentry.dns);
                }

                params[dprefix]                         = "";
                params[dprefix + ":lifetime"]           = "";
            }

            params[prefix +":configured_by_gaia"]   = "";
            params[prefix +":linkmtu"]              = "";
            params[prefix +":managed"]              = "";
            params[prefix +":otherconfig"]          = "";

            params[prefix +":curhoplimit"]          = "";
            params[prefix +":lifetime"]             = "";
            params[prefix +":maxadvinterval"]       = "";
            params[prefix +":minadvinterval"]       = "";
            params[prefix +":reachabletimer"]       = "";
            params[prefix +":retransmissiontimer"]  = "";

            params[prefix]                          = "";
            params["SPECIAL:"+ prefix]              = "";
        }

        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rdisc6_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "rdisc6_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("rdisc6_grid").getSelectionModel().deselectAll();
                        CP.rdisc6.open_rdisc6_window("Add Interface", null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "rdisc6_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rdisc6_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Configure Interface: "+ rec.data.intf;
                        CP.rdisc6.open_rdisc6_window(T, rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("rdisc6_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "rdisc6_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rdisc6_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        CP.ar_util.clearParams();
                        for(i = 0; i < recs.length; i++) {
                            delete_rdisc(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("rdisc6_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        /*
         * This function returns the values as they should be rendered in
         * the table view.  It does not necessarily return the configured
         * values because defaults are applied.
         */
        function get_adv_min_max_life(rec) {
            var max_adv;
            if (rec.data.maxadvinterval === "") {
                /* Default is 600 */
                max_adv = 600;
            } else {
                max_adv = parseInt(rec.data.maxadvinterval, 10);
            }

            var min_adv;
            if (rec.data.minadvinterval === "") {
                min_adv = parseInt(max_adv/3, 10);
            } else {
                min_adv = parseInt(rec.data.minadvinterval, 10);
            }

            var life;
            if (rec.data.lifetime === 0) {
                life = 0;            /* Disable advertisements */
            } else if (rec.data.lifetime === ""){
                life = max_adv * 3;  /* Use default value */
            } else {
                life = parseInt(rec.data.lifetime, 10);
            }

            return [min_adv, max_adv, life];
        }

        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "intf"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.intf_state.renderer_output(
                        value
                        ,value
                        ,"left"
                        ,"black"
                        ,value
                        ,"ipv6"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                text            : "Enable"
                ,dataIndex      : "enable"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "Off";
                    if (value == "true" || value) {
                        retValue = "On";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Advertise Interval"
                ,dataIndex      : "minadvinterval"
                ,width          : 160
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (rec.data.enable) {
                        var adv_arr = get_adv_min_max_life(rec);
                        var mval = adv_arr[0];
                        var Mval = adv_arr[1];
                        retValue = mval + " to " + Mval;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
                ,listeners      : {
                    afterrender     : function(c, eOpts) {
                        Ext.tip.QuickTipManager.register({
                            target          : c.getId()
                            ,text           : CP.rdisc6.ADVINTERVAL
                            ,dismissDelay   : 0
                        });
                    }
                }
            },{
                text            : "Advertisement Lifetime"
                ,dataIndex      : "lifetime"
                ,width          : 150
                ,menuDisabled   : true
                ,hidden         : false
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (rec.data.enable) {
                        var adv_arr = get_adv_min_max_life(rec);
                        retValue = adv_arr[2];
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
                ,listeners      : {
                    afterrender     : function(c, eOpts) {
                        Ext.tip.QuickTipManager.register({
                            target          : c.getId()
                            ,text           : CP.rdisc6.LIFETIME
                            ,dismissDelay   : 0
                        });
                    }
                }
            },{
                text            : "Hop Limit"
                ,dataIndex      : "curhoplimit"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (rec.data.enable) {
                        if (String(value) == "") {
                            retValue = CP.rdisc6.CURHOPLIMIT_D;
                        } else if (value == 0) {
                            retValue = "Unspecified";
                        } else {
                            retValue = value;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
                ,listeners      : {
                    afterrender     : function(c, eOpts) {
                        Ext.tip.QuickTipManager.register({
                            target          : c.getId()
                            ,text           : CP.rdisc6.CURHOPLIMIT
                            ,dismissDelay   : 0
                        });
                    }
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("rdisc6_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc6_grid"
            ,width              : 670
            ,height             : 300
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc6_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("rdisc6_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Router Discovery"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }

//STUB:open_rdisc6_window
    ,open_rdisc6_window     : function(TITLE, REC) {

        var intf_cmp;
        if (REC == null) {
            intf_cmp = {
                xtype               : "cp4_combobox"
                ,fieldLabel         : "Interface"
                ,id                 : "rdisc6_intf_entry"
                ,name               : "intf"
                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                ,width              : CP.rdisc6.INTF_LABELWIDTH + 250
                ,emptyText          : "Required"
                ,allowBlank         : false
                ,editable           : false
                ,queryMode          : "local"
                ,triggerAction      : "all"
                ,store              : Ext.getStore("intf_store")
                ,valueField         : "intf"
                ,displayField       : "intf"
                ,validator          : function() {
                    var c = this;
                    var v = c.getValue();
                    if (v == "") { return ""; }
                    var r_st = Ext.getStore("rdisc6_store");
                    if (r_st) {
                        if (r_st.findExact("intf", v) > -1) {
                            return "This interface is already configured.";
                        }
                    }
                    return true;
                }
                ,listeners          : {
                    select              : function(combo, recs, eOpts) {
                        var st = Ext.getStore("rdisc6_vlink_store");
                        st.removeAll();
                        var intf = Ext.getCmp("rdisc6_intf_entry").getValue();
                        var rdisc6_store = Ext.getStore("rdisc6_intf_store");
                        rdisc6_store.load({params: {"rdisc6_intf": intf}});
                    }
                }
            };
        } else {
            intf_cmp = {
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "Interface"
                ,id                 : "rdisc6_intf_entry"
                ,name               : "intf"
                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                ,width              : CP.rdisc6.INTF_LABELWIDTH + 250
                ,height             : 22
            };
        }

    //vlink grid
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rdisc6_vlink_btnsbar"
            ,items  : [
                {
                    text                : "Edit"
                    ,id                 : "rdisc6_vlink_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rdisc6_vlink_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Address: "+ rec.data.addr6;
                        CP.rdisc6.edit_vlink(T);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        if (!f) { return true; }
                        var g = Ext.getCmp("rdisc6_vlink_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                }
            ]
        };

        var grid_cm = [
            {
                text            : "Address"
                ,dataIndex      : "addr6"
                ,flex           : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var v = String(value).toUpperCase();
                    return CP.ar_util.rendererGeneric(v);
                }
            },{
                text            : "On-Link"
                ,dataIndex      : "onlink_rev"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "Off";
                    if (value) {
                        retValue = "On";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Autonomous"
                ,dataIndex      : "autonomous_rev"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "Off";
                    if (value) {
                        retValue = "On";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Valid Lifetime"
                ,dataIndex      : "validlifetime"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "" + CP.rdisc6.VALIDLIFETIME_D;
                    if (value || value === 0) {
                        if (value == CP.rdisc6.INFINITY) {
                            retValue = "Infinity";
                        } else {
                            retValue = value;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Preferred Lifetime"
                ,dataIndex      : "preferredlifetime"
                ,width          : 115
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "" + CP.rdisc6.PREFERREDLIFETIME_D;
                    if (value || value === 0) {
                        if (value == CP.rdisc6.INFINITY) {
                            retValue = "Infinity";
                        } else {
                            retValue = value;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("rdisc6_form");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc6_vlink_grid"
            ,width              : 530
            //,height             : 149
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc6_vlink_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("rdisc6_vlink_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        //DNS grid

        var rdisc6_dns_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rdisc6_dns_btnsbar"
            ,items  : [
                {
                    text    : "Add"
                    ,id     : "dns_add_btn"
                    ,menu   : {
                        xtype   : "menu"
                        ,style  : {overflow: "visible"}
                        ,plain  : true
                        ,items  : [
                            {
                                id          : "new_dns_server"
                                ,text       : "Server"
                                ,handler    : function(b) {
                                    Ext.getCmp("rdisc6_dns_grid").getSelectionModel().deselectAll();
                                    CP.rdisc6.open_dns_window("Add DNS Server Address", null, "dnsserver:address:v6addr");
                                }
                            },{
                                id          : "new_dns_host"
                                ,text       : "Hostname"
                                ,handler    : function(b) {
                                    Ext.getCmp("rdisc6_dns_grid").getSelectionModel().deselectAll();
                                    CP.rdisc6.open_dns_window("Add DNS Hostname", null, "dnshost:name");
                                }
                            }
                        ]
                    }
                },{
                    text                : "Edit"
                    ,id                 : "dns_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rdisc6_dns_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit DNS Entry";
                        CP.rdisc6.open_dns_window(T, rec, rec.data.dtype);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        if (!f) { return true; }
                        var g = Ext.getCmp("rdisc6_dns_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "dns_del_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,delArr             : []
                    ,handler2           : function(b) {
                        var i;
                        var sm = Ext.getCmp("rdisc6_dns_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var st = Ext.getStore("rdisc6_dns_store");
                        for (i = 0; i < recs.length; i++) {
                            if (b.pushDelArr) { b.pushDelArr(recs[i].data.dns, recs[i].data.dtype); }
                        }
                        if (st) {
                            st.remove(recs);
                        }
                    }
                    ,pushDelArr         : function(DNS, DTYPE) {
                        var b = this;
                        var dnsdb = {
                            dns     : DNS
                            ,dtype  : DTYPE
                        };
                        if (String(dnsdb.dns).indexOf(":") != -1) {
                            dnsdb.dns = CP.ip6convert.ip6_2_db(DNS);
                        }
                        if (b) {
                            if (Ext.typeOf(b.delArr) != "array") {
                                b.delArr = [];
                            }
                            if (Ext.Array.indexOf(b.delArr, dnsdb.dns) == -1) {
                                b.delArr.push(dnsdb);
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        if (!f) { return true; }
                        var g = Ext.getCmp("rdisc6_dns_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() < 1 : true);
                    }
                }
            ]
        };

        var dns_grid_cm = [
            {
                text            : "Type"
                ,dataIndex      : "dtype"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "Server";
                    if(String(value).charAt(3) == "h") {
                        retValue = "Hostname";
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Entry"
                ,dataIndex      : "dns"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Lifetime"
                ,dataIndex      : "dns_lifetime"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = 900;
                    var color = "black";
                    var maxComp = Ext.getCmp("rdisc6_maxadvinterval_entry");
                    var maxAVal;
                    if (maxComp.getRawValue() == "") {
                        maxAVal = 600;
                    } else {
                        maxAVal = maxComp.getValue();
                    }

                    if (!value) {
                        retValue = Math.floor(1.5 * maxAVal);
                        color = "gray";
                    } else if (value == CP.rdisc6.INFINITY) {
                        retValue = "Infinity";
                    } else if (value > (2 * maxAVal)) {
                        retValue = (2 * maxAVal) + "*";
                    } else if (value < maxAVal) {
                        retValue = maxAVal + "*";
                    } else {
                        retValue = value;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            }
        ];

        var dns_grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("rdisc6_form");
                }
            }
        });

        var dns_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc6_dns_grid"
            ,width              : 530
            ,height             : 127
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc6_dns_store")
            ,columns            : dns_grid_cm
            ,selModel           : dns_grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("dns_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

    //rdisc6_form
        var rdisc6_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rdisc6_form"
            ,width      : 570
            ,height     : 534
            ,margin     : 0
            ,autoScroll : true
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    var rec = null;
                    if (Ext.getCmp("rdisc6_intf_entry").getXType() == "cp4_displayfield") {
                        //edit
                        rec = Ext.getCmp("rdisc6_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                    }
                    CP.rdisc6.load_vlink_dns_store(rec);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("rdisc6_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("rdisc6_vlink_btnsbar");
                CP.ar_util.checkBtnsbar("rdisc6_dns_btnsbar");
                CP.ar_util.checkDisabledBtn("rdisc6_save_btn");
                CP.ar_util.checkDisabledBtn("rdisc6_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "rdisc6_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params              = CP.ar_util.clearParams();
                        var intf                = Ext.getCmp("rdisc6_intf_entry").getValue();
                        var prefix              = CP.rdisc6.get_prefix(intf);
                        var dnsDelBtn           = Ext.getCmp("dns_del_btn");
                        function get_raw_int(cmpId) {
                            var cmp = Ext.getCmp( cmpId );
                            if (cmp) {
                                return cmp.getRawValue();
                            }
                            return "";
                        }
                        if (prefix == "") {
                            return;
                        }

                        //checkboxes
                        var enable              = "t";
                        var linkmtu             = Ext.getCmp("rdisc6_linkmtu_entry").getValue() ? "t" : "";
                        var managed             = Ext.getCmp("rdisc6_managed_entry").getValue() ? "t" : "";
                        var otherconfig         = Ext.getCmp("rdisc6_otherconfig_entry").getValue() ? "t" : "";

                        //numbers
                        var curhoplimit         = get_raw_int("rdisc6_curhoplimit_entry");
                        var lifetime            = get_raw_int("rdisc6_lifetime_entry");
                        var maxadvinterval      = get_raw_int("rdisc6_maxadvinterval_entry");
                        var minadvinterval      = get_raw_int("rdisc6_minadvinterval_entry");
                        var reachabletimer      = get_raw_int("rdisc6_reachabletimer_entry");
                        var retransmissiontimer = get_raw_int("rdisc6_retransmissiontimer_entry");

                        params[prefix]                          = enable;
                        params[prefix +":configured_by_gaia"]   = "";
                        params[prefix +":linkmtu"]              = linkmtu;
                        params[prefix +":managed"]              = managed;
                        params[prefix +":otherconfig"]          = otherconfig;

                        params[prefix +":curhoplimit"]          = curhoplimit;
                        params[prefix +":lifetime"]             = lifetime;
                        params[prefix +":maxadvinterval"]       = maxadvinterval;
                        params[prefix +":minadvinterval"]       = minadvinterval;
                        params[prefix +":reachabletimer"]       = reachabletimer;
                        params[prefix +":retransmissiontimer"]  = retransmissiontimer;

                        //vlinks
                        var recs = Ext.getStore("rdisc6_vlink_store").getRange();
                        var vlink, vprefix, i;
                        for(i = 0; i < recs.length; i++) {
                            vlink   = recs[i].data;
                            vprefix = prefix +":address:v6addr:"+ String(vlink.addr6_raw).substring(0,32).toLowerCase();

                            params[vprefix]                         = "t";
                            params[vprefix +":noautonomous"]        = (vlink.autonomous_rev) ? "": "t";
                            params[vprefix +":noonlink"]            = (vlink.onlink_rev) ? "" : "t";
                            params[vprefix +":preferredlifetime"]   = vlink.preferredlifetime;
                            params[vprefix +":validlifetime"]       = vlink.validlifetime;
                        }

                        //dns
                        var recd = Ext.getStore("rdisc6_dns_store").getRange();
                        var dprefix, dentry;
                        if (dnsDelBtn && Ext.typeOf(dnsDelBtn.delArr) == "array" && dnsDelBtn.delArr.length > 0) {
                            for (i = 0; i < dnsDelBtn.delArr.length; i++) {
                                dprefix = prefix + ":" + dnsDelBtn.delArr[i].dtype + ":" + dnsDelBtn.delArr[i].dns;
                                params[dprefix]                 = "";
                                params[dprefix + ":lifetime"]   = "";
                            }
                        }
                        for(i = 0; i < recd.length; i++) {
                            dentry  = recd[i].data;

                            dprefix = prefix + ":" + dentry.dtype + ":" + dentry.dns;

                            if (String(dentry.dtype).charAt(3) == "s") {
                                dprefix = prefix + ":" + dentry.dtype + ":" + CP.ip6convert.ip6_2_db(dentry.dns);
                            }

                            params[dprefix]                         = "t";
                            params[dprefix + ":lifetime"]           = dentry.dns_lifetime;
                        }

                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover   : function() {
                            Ext.getCmp("rdisc6_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "rdisc6_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("rdisc6_window");
                    }
                    ,listeners          : {
                        mouseover   : function() {
                            if (Ext.getCmp("rdisc6_intf_entry").validate) {
                                Ext.getCmp("rdisc6_intf_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 533
                    ,margin : "15 0 15 15"
                    ,items  : [
                        intf_cmp
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Min. Advertise Interval"
                                ,id                 : "rdisc6_minadvinterval_entry"
                                ,name               : "minadvinterval"
                                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                                ,width              : CP.rdisc6.INTF_LABELWIDTH + 100
                                ,emptyText          : "Max / 3"
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 3
                                ,maxValue           : 1350
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                ,validator          : function() {
                                    var minCmp = Ext.getCmp("rdisc6_minadvinterval_entry");
                                    var maxCmp = Ext.getCmp("rdisc6_maxadvinterval_entry");

                                    var minVal = CP.rdisc6.MINADVINTERVAL_D;
                                    var maxVal = CP.rdisc6.MAXADVINTERVAL_D;

                                    if (minCmp) {
                                        if (minCmp.getRawValue() == "") {
                                            return true;
                                        }
                                        minVal = parseInt(minCmp.getRawValue(), 10);
                                    }
                                    if (maxCmp && maxCmp.getRawValue() != "") {
                                        maxVal = parseInt(maxCmp.getRawValue(), 10);
                                    }

                                    if (minVal < minCmp.minValue || minVal > minCmp.maxValue) {
                                        return "";
                                    }
                                    if (parseInt(0.75 * maxVal, 10) < minVal) {
                                        return "Min Advertise Interval should be less than 0.75 * Max Advertise Interval.";
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function(field, newVal, oldVal, eOpts) {
                                        Ext.getCmp("rdisc6_maxadvinterval_entry").validate();
                                        Ext.getCmp("rdisc6_lifetime_entry").validate();
                                    }
                                    ,blur               : function(field, eOpts) {
                                        field.fireEvent("change");
                                    }
                                }
                            }, 530, "seconds"
                        )
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Max. Advertise Interval"
                                ,id                 : "rdisc6_maxadvinterval_entry"
                                ,name               : "maxadvinterval"
                                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                                ,width              : CP.rdisc6.INTF_LABELWIDTH + 100
                                ,emptyText          : String(CP.rdisc6.MAX_ADV_INTERVAL_DEFAULT) + " "
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 4
                                ,maxValue           : 1800
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                ,getLogicalValue    : function() {
                                    var v = this.getValue();
                                    if (!v) {
                                        return CP.rdisc6.MAX_ADV_INTERVAL_DEFAULT;
                                    }
                                    return Ext.Number.constrain(v, this.minValue, this.maxValue);
                                }
                                /*
                                ,validator          : function() {
                                    var minCmp = Ext.getCmp("rdisc6_minadvinterval_entry");
                                    var maxCmp = Ext.getCmp("rdisc6_maxadvinterval_entry");
                                    var lifCmp = Ext.getCmp("rdisc6_lifetime_entry");

                                    var minVal = CP.rdisc6.MINADVINTERVAL_D;
                                    var maxVal = CP.rdisc6.MAXADVINTERVAL_D;
                                    var lifVal = CP.rdisc6.LIFETIME_D;

                                    if (minCmp && minCmp.getRawValue() != "") {
                                        minVal = parseInt(minCmp.getRawValue(), 10);
                                    }
                                    if (maxCmp && maxCmp.getRawValue() != "") {
                                        maxVal = parseInt(maxCmp.getRawValue(), 10);
                                    }
                                    if (lifCmp && lifCmp.getRawValue() != "") {
                                        lifVal = parseInt(lifCmp.getRawValue(), 10);
                                    }

                                    if (maxVal < maxCmp.minValue || maxVal > maxCmp.maxValue) {
                                        return "";
                                    }
                                    if (maxVal <= minVal) {
                                        return "Max Advertise Interval should be greater than Min Advertise Interval.";
                                    }
                                    if (lifVal <= maxVal && lifVal != 0) {
                                        return "Max Advertise Interval should be less than Advertisement Lifetime.";
                                    }
                                    return true;
                                }
                                // */
                                ,listeners          : {
                                    change              : function(field, newVal, oldVal, eOpts) {
                                        Ext.getCmp("rdisc6_minadvinterval_entry").validate();
                                        Ext.getCmp("rdisc6_lifetime_entry").validate();
                                    }
                                    ,blur               : function(field, eOpts) {
                                        field.fireEvent("change");
                                    }
                                }
                            }, 530, "seconds"
                        )
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Advertisement Lifetime"
                                ,id                 : "rdisc6_lifetime_entry"
                                ,name               : "lifetime"
                                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                                ,width              : CP.rdisc6.INTF_LABELWIDTH + 100
                                ,emptyText          : "Max * 3"
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 0
                                ,maxValue           : 9000
                                ,maxLength          : 10
                                ,enforceMaxLength   : true
                                ,validator          : function() {
                                    var maxCmp = Ext.getCmp("rdisc6_maxadvinterval_entry");
                                    var lifCmp = Ext.getCmp("rdisc6_lifetime_entry");

                                    var maxVal = CP.rdisc6.MAXADVINTERVAL_D;
                                    var lifVal = 0;

                                    if (maxCmp && maxCmp.getRawValue() != "") {
                                        maxVal = parseInt(maxCmp.getRawValue(), 10);
                                    }
                                    if (lifCmp) {
                                        if (lifCmp.getRawValue() == "") {
                                            return true;
                                        }
                                        lifVal = parseInt(lifCmp.getRawValue(), 10);
                                    }

                                    if (lifVal > 0 && lifVal < 5) {
                                        return "The Advertisement Lifetime should be zero (0) to not use this router as a default router." +
                                        " Or, it should be a value greater than 4."
                                    }

                                    if (lifVal <= maxVal && lifVal != 0) {
                                        return "Advertisement Lifetime should be greater than Max Advertise Interval."
                                                + " Or it should be set to zero (0) to not use this router as a default router.";
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function(field, newVal, oldVal, eOpts) {
                                        Ext.getCmp("rdisc6_minadvinterval_entry").validate();
                                        Ext.getCmp("rdisc6_maxadvinterval_entry").validate();
                                    }
                                    ,blur               : function(field, eOpts) {
                                        field.fireEvent("change");
                                    }
                                }
                            }, 530, "seconds"
                        )
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Reachable Timer"
                                ,id                 : "rdisc6_reachabletimer_entry"
                                ,name               : "reachabletimer"
                                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                                ,width              : CP.rdisc6.INTF_LABELWIDTH + 115
                                ,emptyText          : "0 "
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 0
                                ,maxValue           : 3600000
                                ,maxLength          : 7
                                ,enforceMaxLength   : true
                            }, 530, "seconds"
                        )
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Retransmission Timer"
                                ,id                 : "rdisc6_retransmissiontimer_entry"
                                ,name               : "retransmissiontimer"
                                ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                                ,width              : CP.rdisc6.INTF_LABELWIDTH + 115
                                ,emptyText          : "0 "
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 0
                                ,maxValue           : 2147483647
                                ,maxLength          : 10
                                ,enforceMaxLength   : true
                            }, 530, "seconds"
                        )
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Hop Limit"
                            ,id                 : "rdisc6_curhoplimit_entry"
                            ,name               : "curhoplimit"
                            ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                            ,width              : CP.rdisc6.INTF_LABELWIDTH + 75
                            ,emptyText          : "64 "
                            ,allowDecimals      : false
                            ,value              : ""
                            ,minValue           : 0
                            ,maxValue           : 255
                            ,maxLength          : 3
                            ,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_checkbox"
                            ,fieldLabel         : "Managed Config"
                            ,id                 : "rdisc6_managed_entry"
                            ,name               : "managed"
                            ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                            ,width              : CP.rdisc6.INTF_LABELWIDTH + 65
                            ,height             : 22
                            ,value              : false
                            ,checked            : false
                        },{
                            xtype               : "cp4_checkbox"
                            ,fieldLabel         : "Other Config Flag"
                            ,id                 : "rdisc6_otherconfig_entry"
                            ,name               : "otherconfig"
                            ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                            ,width              : CP.rdisc6.INTF_LABELWIDTH + 65
                            ,height             : 22
                            ,value              : false
                            ,checked            : false
                        },{
                            xtype               : "cp4_checkbox"
                            ,fieldLabel         : "Send MTU"
                            ,id                 : "rdisc6_linkmtu_entry"
                            ,name               : "linkmtu"
                            ,labelWidth         : CP.rdisc6.INTF_LABELWIDTH
                            ,width              : CP.rdisc6.INTF_LABELWIDTH + 65
                            ,height             : 22
                            ,value              : false
                            ,checked            : false
                        },{
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Advertise Addresses"
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "rdisc6_address_mask_msg"
                            ,text       : "Only addresses with 64-bit mask lengths should be used for IPv6 Router Discovery, otherwise hosts may not be able to properly autoconfigure their own addresses."
                        }
                        ,btnsbar
                        ,grid
                        ,{
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Advertise DNS Information"
                        }
                        ,rdisc6_dns_btnsbar
                        ,dns_grid
                        ,{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "rdisc6_dns_life_msg"
                            ,hidden     : true
                            ,text       : "* These DNS lifetimes have been altered from their configured values to fit between [Max] and <br> [2 &times; Max]. The values displayed here or in the monitor are the values sent by the routing daemon. The database values remain unchanged and may be viewed on the edit page or through the CLI."
                        }
                    ]
                }
            ]
        };

        var rdisc6_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rdisc6_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ rdisc6_form ]
        });
        rdisc6_window.show();
    }

    ,edit_vlink             : function(TITLE) {
        var vlink_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rdisc6_vlink_form"
            ,width      : 430
            ,height     : 200
            ,margin     : 0
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    var rec = Ext.getCmp("rdisc6_vlink_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("rdisc6_vlink_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("rdisc6_vlink_save_btn");
                CP.ar_util.checkDisabledBtn("rdisc6_vlink_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "rdisc6_vlink_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        var addr6_raw           = Ext.getCmp("rdisc6_addr6_raw_entry").getValue();
                        var onlink_rev          = Ext.getCmp("rdisc6_onlink_rev_entry").getValue();
                        var autonomous_rev      = Ext.getCmp("rdisc6_autonomous_rev_entry").getValue();
                        var validlifetime       = Ext.getCmp("rdisc6_validlifetime_entry").getRawValue();
                        var preferredlifetime   = Ext.getCmp("rdisc6_preferredlifetime_entry").getRawValue();
                        var rec = Ext.getStore("rdisc6_vlink_store").findRecord("addr6_raw",addr6_raw, 0, false, true, true);

                        rec.data["onlink_rev"]          = onlink_rev;
                        rec.data["autonomous_rev"]      = autonomous_rev;
                        rec.data["validlifetime"]       = validlifetime;
                        rec.data["preferredlifetime"]   = preferredlifetime;

                        Ext.getCmp("rdisc6_vlink_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("rdisc6_vlink_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        var v = CP.ar_util.checkFormValid("rdisc6_vlink_form");
                        return !(f && v);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "rdisc6_vlink_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("rdisc6_vlink_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 400
                    ,margin : "15 0 15 15"
                    ,items  : [
                        {
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Address"
                            ,id         : "rdisc6_addr6_entry"
                            ,name       : "addr6"
                            ,labelWidth : CP.rdisc6.ADDR_LABELWIDTH
                            ,width      : 500
                            ,height     : 22
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "rdisc6_addr6_raw_entry"
                            ,id         : "rdisc6_addr6_raw_entry"
                            ,name       : "addr6_raw"
                            ,labelWidth : CP.rdisc6.ADDR_LABELWIDTH
                            ,width      : 530
                            ,height     : 22
                            ,hidden     : true
                            ,hideLabel  : true
                        },{
                            xtype       : "cp4_checkbox"
                            ,fieldLabel : "Enable On-Link"
                            ,id         : "rdisc6_onlink_rev_entry"
                            ,name       : "onlink_rev"
                            ,labelWidth : CP.rdisc6.ADDR_LABELWIDTH
                            ,width      : CP.rdisc6.ADDR_LABELWIDTH + 35
                            ,height     : 22
                        },{
                            xtype       : "cp4_checkbox"
                            ,fieldLabel : "Enable Autonomous Address Configuration"
                            ,id         : "rdisc6_autonomous_rev_entry"
                            ,name       : "autonomous_rev"
                            ,labelWidth : CP.rdisc6.ADDR_LABELWIDTH
                            ,width      : CP.rdisc6.ADDR_LABELWIDTH + 35
                            ,height     : 22
                        }
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Valid Lifetime (0 - " + CP.rdisc6.INFINITY + " seconds)"
                            ,id                 : "rdisc6_validlifetime_entry"
                            ,name               : "validlifetime"
                            ,labelWidth         : CP.rdisc6.ADDR_LABELWIDTH
                            ,width              : CP.rdisc6.ADDR_LABELWIDTH + 115
                            ,emptyText          : "Default: " + CP.rdisc6.VALIDLIFETIME_D
                            ,allowDecimals      : false
                            ,value              : ""
                            ,minValue           : 0
                            ,maxValue           : CP.rdisc6.INFINITY
                            ,maxLength          : 10
                            ,enforceMaxLength   : true
                            ,validator          : function() {
                                var vlifeCmp = Ext.getCmp("rdisc6_validlifetime_entry");
                                var plifeCmp = Ext.getCmp("rdisc6_preferredlifetime_entry");

                                var vlifeVal = 2592000;
                                var plifeVal = 604800;

                                if (vlifeCmp && vlifeCmp.getRawValue().length > 0) {
                                    vlifeVal = parseInt(vlifeCmp.getRawValue(), 10);
                                }

                                if (plifeCmp && plifeCmp.getRawValue().length > 0) {
                                    plifeVal = parseInt(plifeCmp.getRawValue(), 10);
                                }

                                if (vlifeVal < plifeVal) {
                                    return "The Valid Lifetime cannot be less than the Preferred Lifetime.";
                                }

                                return true;
                            }
                            ,listeners          : {
                                change              : function(field, newVal, oldVal, eOpts) {
                                    Ext.getCmp("rdisc6_validlifetime_entry").validate();
                                }
                                ,blur               : function(field, eOpts) {
                                    field.fireEvent("change");
                                }
                            }
                        }
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Preferred Lifetime (0 - " + CP.rdisc6.INFINITY + " seconds)"
                            ,id                 : "rdisc6_preferredlifetime_entry"
                            ,name               : "preferredlifetime"
                            ,labelWidth         : CP.rdisc6.ADDR_LABELWIDTH
                            ,width              : CP.rdisc6.ADDR_LABELWIDTH + 115
                            ,emptyText          : "Default: " + CP.rdisc6.PREFERREDLIFETIME_D
                            ,allowDecimals      : false
                            ,value              : ""
                            ,minValue           : 0
                            ,maxValue           : CP.rdisc6.INFINITY
                            ,maxLength          : 10
                            ,enforceMaxLength   : true
                            ,style              : "margin-bottom:0px;"
                            ,listeners          : {
                                change              : function(field, newVal, oldVal, eOpts) {
                                    Ext.getCmp("rdisc6_validlifetime_entry").validate();
                                }
                                ,blur               : function(field, eOpts) {
                                    field.fireEvent("change");
                                }
                            }
                        }
                    ]
                }
            ]
        };

        var rdisc6_vlink_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rdisc6_vlink_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("rdisc6_window").getPosition();
                    win.setPosition(130 + pos[0], 175 + pos[1]);
                }
            }
            ,items      : [ vlink_form ]
        });
        rdisc6_vlink_window.show();
    }

    ,open_dns_window           : function(TITLE, REC, DTYPE) {
        var dns_cmp;
        var DNS_LABEL_WIDTH = 100;
        var DNS_WIDTH = DNS_LABEL_WIDTH + 300;
        var val;
        if (DTYPE.charAt(3) == "s") {
            // Validating an IPv6 address, most of this is done by cp4_ipv6field
            val = function() {
                var c = this;
                var d = c.getValue();
                if (d == "") { return ""; }
                return true;
            };
        } else {
            val = function() {
                // Validating a domain name, make sure it complies with standard
                var i;
                var c = this;
                var d = c.getValue();
                if (d == "") { return ""; }
                var dname = c.getRawValue();
                var len = dname.length;
                var isLabel = false;
                var hasChar = false;
                if (len > 126) {
                    return "Host name must consist no more than 126 characters.";
                }
                if (len < 3) {
                    return "Host name must consist of no fewer than 3 characters.";
                }

                if (!CP.ar_util.isAlnum(dname.charAt(0))) {
                    return "Host name must begin with an alphanumeric.";
                }

                for (i=0; i<len; i++) {
                    if(!hasChar) {
                        if(CP.ar_util.isAlpha(dname.charAt(i)) || dname.charAt(i) == "-") {
                            // Hostname has at least one non-number, record this
                            hasChar = true;
                        }
                    }
                    if(CP.ar_util.isAlnum(dname.charAt(i))) {
                        continue;
                    }
                    if(dname.charAt(i) == "." || dname.charAt(i) == "-") {
                        isLabel = (dname.charAt(i) == ".") ? true : isLabel;
                        if (i == len - 1) {
                            return "Host name must not end in a \'.\' .";
                        }
                        if (dname.charAt(i+1) == "." || dname.charAt(i+1) == "-") {
                            return "Host name must begin a label with an alphanumeric.";
                        }
                        continue;
                    }
                    // This character is not valid, return immediately
                    return "Host name has an invalid character.";
                }
                if (!isLabel) {
                    // There is only one label (no '.' in domain)
                    return "Host name must have at least two labels.";
                }
                if (!hasChar) {
                    // There are only numbers and '.', can't be confused with an IP address
                    return "Host name cannot be only numbers.";
                }
                return true;
            };
        }
        dns_cmp = {
            xtype           : (DTYPE.charAt(3) == "s") ? "cp4_ipv6field" : "cp4_textfield"
            ,fieldLabel     : "DNS"
            ,id             : "rdisc6_dns_entry"
            ,labelWidth     : DNS_LABEL_WIDTH
            ,width          : DNS_WIDTH
            ,emptyText      : "Required"
            ,allowBlank     : false
            ,editable       : false
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,store          : Ext.getStore("rdisc6_dns_store")
            ,value          : REC ? REC.data.dns : ""
            ,validator      : val
        };
        dns_cmp.dtype = DTYPE;
        dns_cmp.dns_old = REC ? REC.data.dns : "";

        var dns_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rdisc6_dns_form"
            ,width      : 430
            ,height     : 160
            ,margin     : 0
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("rdisc6_dns_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("rdisc6_dns_save_btn");
                CP.ar_util.checkDisabledBtn("rdisc6_dns_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "rdisc6_dns_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        var st              = Ext.getStore("rdisc6_dns_store");
                        if (!st) {
                            CP.ar_util.checkWindowClose("rdisc6_dns_window");
                            Ext.msg.alert("Error!", "DNS store not found!");
                            return;
                        }
                        var dns_old         = Ext.getCmp("rdisc6_dns_entry").dns_old;
                        var dns             = Ext.getCmp("rdisc6_dns_entry").getValue();
                        var dtype           = Ext.getCmp("rdisc6_dns_entry").dtype;
                        var dns_lifetime    = Ext.getCmp("rdisc6_dns_lifetime_entry").getRawValue();
                        var rec             = st.findRecord("dns", dns_old, 0, false, true, true);
                        var rec_new         = st.findRecord("dns", dns, 0, false, true, true);
                        var delbtn          = Ext.getCmp("dns_del_btn");


                        if (!rec) {
                            // We're adding, but check anyway if this entry is already configured
                            if (rec_new) {
                                // This address has already been configured, update the lifetime
                                rec_new.data["dns_lifetime"] = dns_lifetime;
                            } else {
                                st.add (
                                    {
                                        "dns"           : dns
                                        ,"dtype"        : dtype
                                        ,"dns_lifetime" : dns_lifetime
                                    }
                                );
                            }
                        } else if (dns == dns_old) {
                            // Did not edit the DNS entry, change only the lifetime
                            rec.data["dns_lifetime"] = dns_lifetime;
                        } else {
                            // The DNS entry has changed, need to delete the old and add the new
                            if (delbtn.pushDelArr) {
                                delbtn.pushDelArr(rec.data.dns, rec.data.dtype);
                            }
                            st.remove(rec);
                            if (rec_new) {
                                // This address has already been configured, update the lifetime
                                rec_new.data["dns_lifetime"] = dns_lifetime;
                            } else {
                                st.add (
                                    {
                                        "dns"           : dns
                                        ,"dtype"        : dtype
                                        ,"dns_lifetime" : dns_lifetime
                                    }
                                );
                            }
                        }
                        st.showNotifyMessage();

                        Ext.getCmp("rdisc6_dns_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("rdisc6_dns_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc6_form");
                        var v = CP.ar_util.checkFormValid("rdisc6_dns_form");
                        return !(f && v);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "rdisc6_dns_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("rdisc6_dns_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 400
                    ,margin : "15 0 15 15"
                    ,items  : [
                        dns_cmp
                        ,CP.rdisc6.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "DNS Lifetime"
                                ,id                 : "rdisc6_dns_lifetime_entry"
                                ,labelWidth         : DNS_LABEL_WIDTH
                                ,width              : DNS_LABEL_WIDTH + 200
                                ,emptyText          : "Max * 1.5"
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,value              : (REC ? REC.data.dns_lifetime : "")
                                ,minValue           : 0
                                ,maxValue           : 2147483647
                                ,maxLength          : 10
                                ,enforceMaxLength   : true
                                ,style              : "margin-bottom:0px;"
                            }, 400, "seconds"
                        ),{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "rdisc6_dns_edit_msg"
                            ,text       : "Adding or editing a DNS entry to have the same address / hostname as an existing entry will overwrite the preexisting entry."
                        }
                    ]
                }
            ]
        };

        var rdisc6_dns_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rdisc6_dns_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("rdisc6_window").getPosition();
                    win.setPosition(130 + pos[0], 175 + pos[1]);
                }
            }
            ,items      : [ dns_form ]
        });
        rdisc6_dns_window.show();
    }

    //Tooltips
    ,CURHOPLIMIT            : "<b>Hop Limit</b><br>"
                            + "Specifies the value placed in the <i>Cur Hop Limit</i> field in the router advertisement packet.  "
                            + "Systems use this value in the <i>Hop Count</i> field of the IP header for outgoing IP packets.  "
                            + "This value should be set to the current diameter of the Internet.  "
                            + "The value zero (0) means unspecified (by this router).  "
                            + "Default value is 64."

    ,LIFETIME               : "<b>Advertisement Lifetime</b><br>"
                            + "Specifies the value (in seconds) placed in the <i>Router Lifetime</i> field of the router advertisements packet.  "
                            + "A value of zero (0) indicates the router is not to be used as a default router.  "
                            + "Default value is 1800 seconds."

    ,LINKMTU                : "<b>Send MTU</b><br>"
                            + "Specifies whether the router advertisement packet includes MTU options.  "
                            + "Default is off."

    ,MANAGED                : "<b>Obtain Address</b><br>"
                            + "Specifies whether to perform stateful autoconfiguration to obtain addresses.  "
                            + "The <i>Managed Config</i> flag is placed in the <i>Managed Address Configuration Flag</i> field in the router advertisement packet.  "
                            + "When this flag is set to <i>on</i>, hosts perform stateful autoconfiguration to obtain addresses.  "
                            + "Default is off."

    ,OTHERCONFIG            : "<b>Obtain Other Information</b><br>"
                            + "Specifies whether to perform stateful autoconfiguration to obtain information other than addresses.  "
                            + "The <i>Other Config</i> flag is placed in the <i>Other Stateful Configuration Flag</i> field in the router advertisement packet.  "
                            + "When this flag is set to <i>on</i>, hosts perform stateful autoconfiguration to obtain additional information (excluding addresses).  "
                            + "Default is off."

    ,MAXADVINTERVAL         : "<b>Maximum Advertisement Interval</b><br>"
                            + "Specifies the minimum time (in seconds) allowed between sending unsolicited broadcast or multicast ICMPv6 router advertisements on the interface.  "
                            + "Default value is 600 seconds."

    ,MINADVINTERVAL         : "<b>Minimum Advertisement Interval</b><br>"
                            + "Specifies the maximum time (in seconds) allowed between sending unsolicited broadcast or multicast ICMPv6 router advertisements on the interface.  "
                            + "Default value is 450 seconds."

    ,ADVINTERVAL            : "<b>Advertisement Interval</b><br>"
                            + "Specifies the minimum and maximum time (in seconds) allowed between sending unsolicited broadcast or multicast ICMPv6 router advertisements on the interface.  "
                            + "Default values are 450 and 600 seconds respectively."

    ,REACHABLETIMER         : "<b>Reachable Timer</b><br>"
                            + "Specifies the time a node assumes a neighbor is reachable after having received a reachability confirmation.  "
                            + "The reachable time is placed in the <i>Reachable Time</i> field in the router advertisement packet.  "
                            + "This value is used by the <i>Neighbor Unreachability Detection</i>.  "
                            + "The value zero (0) means unspecified (by this router).  "
                            + "Default value is zero (0)."

    ,RETRANSMISSIONTIMER    : "<b>Retransmission Timer</b><br>"
                            + "Specifies the time between retransmitted Neighbor Solicitation messages if the system does not receive a response.  "
                            + "The retransmission timer is placed in the <i>Retrans Timer</i> field in the router advertisement packet.  "
                            + "Address resolution and Neighbor Unreachability Detection uses this value.  "
                            + "The value zero (0) means unspecified (by this router).  "
                            + "Default value is zero (0)."

//Default values (for the reset function)
    ,CURHOPLIMIT_D          : 64
    ,LIFETIME_D             : 1800
    ,LINKMTU_D              : ""    //off
    ,MANAGED_D              : ""    //off
    ,MAXADVINTERVAL_D       : 600
    ,MINADVINTERVAL_D       : 450
    ,OTHERCONFIG_D          : ""    //off
    ,REACHABLETIMER_D       : 0
    ,RETRANSMISSIONTIMER_D  : 0
    ,PREFERREDLIFETIME_D    : 604800
    ,VALIDLIFETIME_D        : 2592000
    ,INFINITY               : 4294967295
}
