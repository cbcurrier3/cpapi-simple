CP.dhcp6relay = {
    DEFAULT_WAITTIME    : 0
    ,DEFAULT_IFID       : "On"

    ,init                   : function () {
        CP.dhcp6relay.defineStores();
        var dhcp6relay_configPanel = CP.dhcp6relay.configPanel();
        var obj = {
            title                   : "IPv6 DHCP Relay"
            ,panel                  : dhcp6relay_configPanel
            ,submitURL              : "/cgi-bin/dhcp6relay.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params                 : {}
            ,afterSubmit            : function() {
                CP.ar_util.checkWindowClose("dhcp6relay_window");
                CP.dhcp6relay.doLoad();
            }
            ,submitFailure          : function() {
                CP.dhcp6relay.doLoad();
            }
            ,checkCmpState          : CP.dhcp6relay.check_user_action
            ,helpFile               : "dhcp6relayHelp.html"
            ,cluster_feature_name   : "dhcp6relay"
        };

        CP.UI.updateDataPanel(obj, null, true);
    }
    ,check_user_action      : function () {
        CP.ar_util.checkBtnsbar("dhcp6relay_btnsbar");
        CP.ar_util.checkBtnsbar("dhcp6relay_form");
    }
    ,defineStores           : function() {
        if (CP && CP.intf_state && CP.intf_state.defineStore) {
            var grids_to_refresh_list = ["dhcp6relay_grid"];
            CP.intf_state.defineStore(CP.ar_util.INSTANCE(), grids_to_refresh_list);
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("dhcp6relay");
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"addr6"
                ,"addrmask6"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "loopback 6in4 6to4 vpnt pppoe gre"
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
                    var dhcp6relay_st = Ext.getStore("dhcp6relay_store");
                    if (dhcp6relay_st) {
                        CP.ar_util.loadListPush("dhcp6relay_store");
                        dhcp6relay_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
                    }
                    CP.ar_util.loadListPop("intf_store");
                }
            }
        });

        //dhcp6relay.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "dhcp6relay_store"
            ,autoLoad   : false
            ,fields     : [
                "state"
                ,"intf"
                ,"ifid"
                ,"waittime"
                ,"relays"
            ]
            ,proxy      : {
                type        : "ajax"
                ,url        : "/cgi-bin/dhcp6relay.tcl?instance=" + CP.ar_util.INSTANCE()
                ,reader     : {
                    type        : "json"
                    ,root       : "data.dhcp6relay"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop("dhcp6relay_store");
                }
            }
        });

        //relays
        Ext.create("CP.WebUI4.Store", {
            storeId     : "dhcp6relay_relay_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "relay"
              //  ,"newrec"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            /*,listeners  : {
                clear       : function(st, eOpts) {
                    var primary;
                }
            }*/
        });
    }
    ,load_relay_store       : function(rec) {
        var relay_store = Ext.getStore("dhcp6relay_relay_store");
        if (relay_store) {
            if (rec == null) {
                relay_store.removeAll();
            } else {
                relay_store.loadData(rec.data.relays);
            }
        }
    }
    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "dhcp6relay_configPanel"
            ,listeners  : {
                afterrender : CP.dhcp6relay.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("dhcp6relay"),
                CP.dhcp6relay.get_dhcp6relay()
            ]

            ,onTabChange : function() {
                // We are switching to the monitor page, so refresh the monitor
                // page now.
                if (CP && CP.dhcp6relay_mon && CP.dhcp6relay_mon.doLoad) {
                    CP.dhcp6relay_mon.doLoad();
                }
            }
        });
        return configPanel;
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        CP.ar_util.loadListPop("mySubmit");

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load(CP.ar_util.INSTANCE());
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("dhcp6relay");
        }
        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            CP.ar_util.loadListPush("intf_store");
            intf_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
        }
        Ext.getCmp("dhcp6relay_edit_btn").setDisabled(true);
        Ext.getCmp("dhcp6relay_delete_btn").setDisabled(true);
    }
    ,get_dhcp6relay         : function() {
        function delete_dhcp6relay(rec) {
            var params  = CP.ar_util.getParams();
            var intf    = rec.data.intf;
            var prefix  = "routed:instance:" + CP.ar_util.INSTANCE() + ":dhcp6relay:interface:" + intf;

            params[prefix]                         = "";
            params[prefix + ":no-interface-id"]    = "";
            params[prefix + ":waittime"]           = "";

            var relays = rec.data.relays;
            var i;
            for (i = 0; i < relays.length; i++) {
                params[prefix + ":relayto:host:v6addr:" + CP.ip6convert.ip6_2_db(relays[i].relay)] = "";
            }

            // This line can go away. It is just here to ease transition from
            // the obsolete "interface-id" binding which never reached
            // Hugo GA
            params[prefix + ":interface-id"]    = "";

            Ext.getStore("dhcp6relay_store").remove(rec);
        }

        var dhcp6relay_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "dhcp6relay_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "dhcp6relay_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("dhcp6relay_grid").getSelectionModel().deselectAll();
                        CP.dhcp6relay.open_dhcp6relay_window("add");
                    }
                    ,disabledConditions : function() {
                        var intf_st = Ext.getStore("intf_store");
                        return (intf_st ? intf_st.getCount == 0 : true);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "dhcp6relay_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("dhcp6relay_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit IPv6 DHCP Relay: " + rec.data.intf;
                        CP.dhcp6relay.open_dhcp6relay_window(T);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("dhcp6relay_grid");
                        return ((g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "dhcp6relay_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var recs = Ext.getCmp("dhcp6relay_grid").getSelectionModel().getSelection();
                        if (recs.length > 0) {
                            CP.ar_util.clearParams();
                            var i;
                            for (i = 0; i < recs.length; i++) {
                                delete_dhcp6relay(recs[i]);
                            }
                            CP.ar_util.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("dhcp6relay_grid");
                        return ((g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var dhcp6relay_cm = [
            {
                text            : "State"
                ,dataIndex      : "state"
                ,width          : 50
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (String(value) == "true") {
                        value = "on";
                    } else {
                        value = "off";
                    }
                    return CP.ar_util.rendererGeneric(value);
                }
            },
            {
                text            : "Interface"
                ,dataIndex      : "intf"
                ,width          : 120
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
            },
            {
                text            : "Interface-ID"
                ,dataIndex      : "ifid"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "gray";
                    if (retValue == "true") {
                        retValue = "On";
                    } else {
                        retValue = "Off";
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },
            {
                text            : "Wait Time"
                ,dataIndex      : "waittime"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    value = String(value);
                    var color = "black";
                    if (value == "") {
                        value = String(CP.dhcp6relay.DEFAULT_WAITTIME);
                        color = "gray";
                    }

                    /* Value is in centiseconds (1/100th of a second) */
                    value = value + " cs";
                    var hlpValue = value + " (1/100s of a second)"
                    return CP.ar_util.rendererSpecific(value, hlpValue, "left", color);
                }
            },
            {
                text            : "Relays"
                ,dataIndex      : "relays"
                ,width          : 275
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (rec.data.relays.length == 0) {
                        return "None";
                    }
                    var relays = rec.data.relays;
                    var relay_list = [];
                    var i;

                    for (i = 0; i < relays.length; i++) {
                        relay_list.push(String(relays[i].relay));
                    }

                    var retValue = relay_list.join("<br>");
                    /*var retValue = relays[0].relay;
                    if (relays.length > 1) {
                        for (i = 1; i < relays.length; i++) {
                            retValue += "<br>" + relays[i].relay;
                        }
                    }*/
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
        ];

        var dhcp6relay_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function(view, selections, eOpts) {
                    CP.dhcp6relay.check_user_action();
                }
            }
        });

        var dhcp6relay_grid = {
            xtype               : "cp4_grid"
            ,id                 : "dhcp6relay_grid"
            ,width              : 550
            ,height             : 200
            ,margin             : 0
            ,padding            : 0
            ,forceFit           : true
            ,store              : Ext.getStore("dhcp6relay_store")
            ,selModel           : dhcp6relay_selModel
            ,columns            : dhcp6relay_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("dhcp6relay_edit_btn");
                    if (b) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "IPv6 DHCP Relay"
            }
            ,dhcp6relay_btnsbar
            ,dhcp6relay_grid
        ];
    }
    ,open_dhcp6relay_window : function(TITLE) {
        var interface_cmp;

        var state_cmp =                     {
            xtype           : "cp4_checkbox"
            ,fieldLabel     : "Enable"
            ,id             : "dhcp6relay_state_entry"
            ,name           : "state"
            ,labelWidth     : 100
            ,width          : 300
            ,style          : "margin-left:15px;margin-top:15px;"
            ,height         : 22
            ,submitValue    : false
            ,checked        : true
        };

        if (TITLE == "add") {
            TITLE = "Add IPv6 DHCP Relay";
            interface_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "dhcp6relay_interface_entry"
                ,name           : "intf"
                ,labelWidth     : 100
                ,width          : 300
                ,style          : "margin-left:15px"
                ,queryMode      : "local"
                ,forceSelection : true
                ,triggerAction  : "all"
                ,lastQuery      : ""
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,listeners      : {
                    select          : function(c, recs, eOpts) {
                        var helper_addr = String(recs[0].data.addrmask6);
                        Ext.getCmp("helper_intf_addr6").setValue(helper_addr);

                        var new_waittime    = "";
                        var new_ifid        = "";
                        var d_st = Ext.getStore("dhcp6relay_store");
                        var r = null;
                        if (d_st) {
                            r = d_st.findRecord("intf", recs[0].data.intf, 0, false, true, true);

                            if (r) {
                                if (r.data.waittime) {
                                    new_waittime = r.data.waittime;
                                }
                                if (r.data.ifid) {
                                    new_ifid = r.data.ifid;
                                }
                                Ext.getCmp("dhcp6relay_ifid_entry").setValue(new_ifid);
                                Ext.getCmp("dhcp6relay_waittime_entry").setValue(new_waittime);
                            } else {
                                // this interface has no config, set ifid true by default
                                Ext.getCmp("dhcp6relay_ifid_entry").setValue(true);
                            }
                        }
                        CP.dhcp6relay.load_relay_store(r);
                        CP.ar_util.clearParams();
                    }
                    /*,blur           : function(c, eOpts) {
                        Ext.getCmp("")
                    }*/
                }
            };
        } else {
            interface_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "dhcp6relay_interface_entry"
                ,name           : "intf"
                ,labelWidth     : 100
                ,width          : 300
                ,height         : 22
                ,style          : "margin-left:15px"
            };
        }

        var helper_intf_addr6_cmp = {
            xtype           : "cp4_displayfield"
            ,fieldLabel     : " "
            ,labelSeparator : ""
            ,id             : "helper_intf_addr6"
            ,labelWidth     : 100
            ,width          : 300
            ,height         : 22
            ,style          : "margin-left:15px;"
        };

        var interface_id_cmp = {
            xtype           : "cp4_checkbox"
            ,fieldLabel     : "Send Interface-ID"
            ,id             : "dhcp6relay_ifid_entry"
            ,name           : "ifid"
            ,labelWidth     : 100
            ,width          : 300
            ,style          : "margin-left:15px;margin-right:10px;"
            ,height         : 22
            ,value          : false
            ,checked        : false
        };

        var waittime_cmp = {
            xtype           : "cp4_numberfield"
            ,fieldLabel     : "Wait Time"
            ,id             : "dhcp6relay_waittime_entry"
            ,name           : "waittime"
            ,labelWidth     : 100
            ,width          : 200
            ,style          : "margin-left:15px;margin-right:10px;"
            ,allowBlank     : true
            ,allowDecimals  : false
            ,emptyText      : "Default: " + String(CP.dhcp6relay.DEFAULT_WAITTIME)
            ,value          : ""
            ,minValue       : 0
            ,maxValue       : 65535
            ,maxLength      : 5
            ,enforceMaxLength   : true
            ,listeners      : {
                blur            : function(num, eOpts) {
                    var value = num.getRawValue();
                    if (value == "") {
                        return;
                    }
                    value = parseInt(value, 10);
                    if (value < num.minValue) {
                        num.setValue(num.minValue);
                    } else if (value > num.maxValue) {
                        num.setValue(num.maxValue);
                    }
                }
            }
        };

        function dhcp6relay_save() {
            var panel = Ext.getCmp("dhcp6relay_form");
            if (panel && !(panel.getForm().isValid())) { return; }

            var relayDelBtn = Ext.getCmp("dhcp6relay_relay_delete_btn");

            var params      = CP.ar_util.getParams();

            var state       = Ext.getCmp("dhcp6relay_state_entry").checked ? "t" : "";
            var intf        = Ext.getCmp("dhcp6relay_interface_entry").getValue();
            var ifid        = Ext.getCmp("dhcp6relay_ifid_entry").getValue();
            var waittime    = Ext.getCmp("dhcp6relay_waittime_entry").getRawValue();

            if (waittime != "") {
                waittime = Ext.Number.constrain(parseInt(waittime, 10), 0, 65535);
            }

            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":dhcp6relay:interface:" + intf;

            params[prefix]                      = state;
            params[prefix + ":no-interface-id"] = ifid ? "" : "t";
            params[prefix + ":waittime"]        = waittime;

            // This line can go away. It is just here to ease transition from
            // the obsolete "interface-id" binding which never reached
            // Hugo GA
            params[prefix + ":interface-id"]    = "";

            var recs = Ext.getStore("dhcp6relay_relay_store").getRange();

            if (recs.length == 0) {
                Ext.Msg.alert("Error", "At least one relay destination is required");
                return;
            }

            var i;
            if (relayDelBtn && Ext.typeOf(relayDelBtn.delArr) == "array" && relayDelBtn.delArr.length > 0) {
                for (i = 0; i < relayDelBtn.delArr.length; i++) {
                    params[prefix + ":relayto:host:v6addr:" + relayDelBtn.delArr[i]] = "";
                }
            }
            for (i = 0; i < recs.length; i++) {
                params[prefix + ":relayto:host:v6addr:" + CP.ip6convert.ip6_2_db(recs[i].data.relay)] = "t";
            }
            CP.ar_util.mySubmit();
        }

        var dhcp6relay_relay_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function(view, selections, eOpts) {
                    var delete_btn = Ext.getCmp("dhcp6relay_relay_delete_btn");
                    if (delete_btn) {
                        delete_btn.setDisabled(selections.length == 0);
                    }
                }
            }
        });

        var dhcp6relay_relay_grid = {
            xtype               : "cp4_grid"
            ,id                 : "dhcp6relay_relay_grid"
            ,width              : 275
            ,margin             : "0 0 8 0"
            ,padding            : 0
            ,forceFit           : true
            ,store              : Ext.getStore("dhcp6relay_relay_store")
            ,selModel           : dhcp6relay_relay_selModel
            ,columns            : [
                {
                    text            : "Relay To Server"
                    ,dataIndex      : "relay"
                    ,width          : 275
                    ,menuDisabled   : true
                    ,renderer       : CP.ar_util.rendererGeneric
                }
            ]
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var dhcp6relay_form = {
            xtype       : "cp4_formpanel"
            ,id         : "dhcp6relay_form"
            ,width      : 330
            ,height     : 372
            ,autoScroll : false
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    if (Ext.getCmp("dhcp6relay_interface_entry").getXType() == "cp4_displayfield") {
                        var rec = Ext.getCmp("dhcp6relay_grid").getSelectionModel().getLastSelected();
                        var i_rec = Ext.getStore("intf_store").findRecord(
                            "intf"
                            ,rec.data.intf
                            ,0
                            ,false
                            ,true
                            ,true
                        );
                        Ext.getCmp("helper_intf_addr6").setValue(i_rec.data.addrmask6);
                        p.loadRecord(rec);
                        CP.dhcp6relay.load_relay_store(rec);
                    } else {
                        CP.dhcp6relay.load_relay_store(null);
                    }
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("dhcp6relay_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("dhcp6relay_save_btn");
                CP.ar_util.checkDisabledBtn("dhcp6relay_cancel_btn");
                CP.ar_util.checkBtnsbar("dhcp6relay_relay_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "dhcp6relay_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        dhcp6relay_save();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("dhcp6relay_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("dhcp6relay_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "dhcp6relay_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("dhcp6relay_window");
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            if (Ext.getCmp("dhcp6relay_interface_entry").validate) {
                                Ext.getCmp("dhcp6relay_interface_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                state_cmp
                ,interface_cmp
                ,helper_intf_addr6_cmp
                ,interface_id_cmp
                ,{
                    xtype           : "cp4_formpanel"
                    ,layout         : {
                        type    : "hbox"
                    }
                    ,padding        : 0
                    ,margin         : 0
                    ,width          : 315
                    ,items          : [
                        waittime_cmp
                        ,{
                            xtype       : "cp4_label"
                            ,text       : "centiseconds"
                            ,style      : "margin-top:4px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,margin         : "0 15 0 15"
                    ,padding        : 0
                    ,items          : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Relays"
                        },{
                            xtype       : "cp4_btnsbar"
                            ,id         : "dhcp6relay_relay_btnsbar"
                            ,chkBtns    : function() {
                                CP.ar_util.checkDisabledBtn("dhcp6relay_relay_add_btn");
                                CP.ar_util.checkDisabledBtn("dhcp6relay_relay_delete_btn");
                            }
                            ,items      : [
                                {
                                    xtype               : "cp4_button"
                                    ,text               : "Add"
                                    ,id                 : "dhcp6relay_relay_add_btn"
                                    ,disabled           : true
                                    ,overrideNoToken    : false
                                    ,handler2           : function(b) {
                                        CP.dhcp6relay.add_relay_window();
                                    }
                                    ,disabledConditions : function() {
                                        var f = CP.ar_util.checkFormValid("dhcp6relay_form");
                                        return !f;
                                    }
                                },{
                                    xtype               : "cp4_button"
                                    ,text               : "Delete"
                                    ,id                 : "dhcp6relay_relay_delete_btn"
                                    ,disabled           : true
                                    ,overrideNoToken    : false
                                    ,handler2           : function(b) {
                                        var i;
                                        var sm = Ext.getCmp("dhcp6relay_relay_grid").getSelectionModel();
                                        var recs = sm.getSelection();
                                        var st = Ext.getStore("dhcp6relay_relay_store");
                                        if (b.pushDelArr) {
                                            for (i = 0; i < recs.length; i++) {
                                                b.pushDelArr(recs[i].data.relay);
                                            }
                                        }
                                        if (st) {
                                            st.remove(recs);
                                        }
                                    }
                                    ,pushDelArr         : function(relay) {
                                        var b = this;
                                        var relaydb = CP.ip6convert.ip6_2_db(relay);

                                        if (b) {
                                            if (Ext.typeOf(b.delArr) != "array") {
                                                b.delArr = [];
                                            }
                                            if (Ext.Array.indexOf(b.delArr, relaydb) == -1) {
                                                b.delArr.push(relaydb);
                                            }
                                        }
                                    }
                                    ,disabledConditions : function() {
                                        var f = CP.ar_util.checkFormValid("dhcp6relay_form");
                                        if (!f) { return true; }
                                        var g = Ext.getCmp("dhcp6relay_relay_grid");
                                        return ((g && g.getSelCount) ? g.getSelCount() == 0 : true);
                                    }
                                }
                            ]
                        }
                        ,dhcp6relay_relay_grid
                    ]
                }
            ]
        };

        var dhcp6relay_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "dhcp6relay_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225, 100);
                }
            }
            ,items      : [ dhcp6relay_form ]
        });
        dhcp6relay_window.show();
    }
    ,add_relay_window       : function() {
        var dhcp6relay_relay_form = {
            xtype       : "cp4_formpanel"
            ,id         : "dhcp6relay_relay_form"
            ,width      : 405
            ,height     : 85
            ,autoscroll : false
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("dhcp6relay_relay_save_btn");
                CP.ar_util.checkDisabledBtn("dhcp6relay_relay_cancel_btn");
            }
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("dhcp6relay_relay_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "dhcp6relay_relay_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var relay = Ext.getCmp("dhcp6relay_relay_entry").getValue();
                        var relay_st = Ext.getStore("dhcp6relay_relay_store");
                        if (relay_st && relay_st.findExact("relay", relay) == -1) {
                            var m = CP.addr_list.getMatchMessage(relay);
                            if (m != "") {
                                Ext.Msg.alert("Warning", m);
                                return;
                            }
                            relay_st.add({
                                "relay" : relay
                            });
                        }
                        CP.ar_util.checkWindowClose("dhcp6relay_relay_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("dhcp6relay_relay_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("dhcp6relay_relay_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "dhcp6relay_relay_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("dhcp6relay_relay_window");
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            if (Ext.getCmp("dhcp6relay_relay_entry").validate) {
                                Ext.getCmp("dhcp6relay_relay_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,defaults   : {
                style       : "margin-top:15px;margin-left:15px;margin-botton:8px;"
            }
            ,items      : [
                {
                    xtype           : "cp4_ipv6field"
                    ,fieldLabel     : "Relay To"
                    ,id             : "dhcp6relay_relay_entry"
                    ,name           : "relay"
                    ,labelWidth     : 50
                    ,width          : 350
                    ,emptyText      : "Required"
                    ,allowBlank     : false
                    ,validator      : function(v) {
                        if (v == "") {
                            return "";
                        }

                        var valid = String(CP.util.isValidIPv6Ex(
                                v,
                                false,   //rejectBlank,
                                true,    //rejectZero,
                                false,   //rejectLoopback,
                                true,    //rejectMulticast,
                                true,    //rejectLinkLocal,
                                false)); // requireLinkLocal

                        if (valid != "true") {
                            // This will be the validation error message
                            return valid;
                        }

                        var m = CP.addr_list.getMatchMessage(v);
                        if (m != "") {
                            return m;
                        }

                        return true;
                    }
                }
            ]
        };

        var dhcp6relay_relay_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "dhcp6relay_relay_window"
            ,title      : "Add Relay"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("dhcp6relay_window").getPosition();
                    win.setPosition(70 + pos[0], 115 + pos[1]);
                }
            }
            ,items      : [ dhcp6relay_relay_form ]
        });
        dhcp6relay_relay_window.show();
    }
}
