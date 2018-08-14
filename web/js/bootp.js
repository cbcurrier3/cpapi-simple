CP.bootp = {
    VALIDATE_PRIMARY_ADDRESS    : false
    ,DEFAULT_WAITTIME           : 0
    ,DEFAULT_MAXHOPS            : 4

    ,init                       : function() {
        CP.bootp.defineStores();
        var bootp_configPanel = CP.bootp.configPanel();
        var obj = {
            title           : "BOOTP/DHCP"
            ,panel          : bootp_configPanel
            ,submitURL      : "/cgi-bin/bootp.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("bootp_window");
                CP.bootp.doLoad();
            }
            ,submitFailure  : function() {
                CP.bootp.doLoad();
            }
            ,checkCmpState  : CP.bootp.check_user_action
            ,helpFile       : 'bootpHelp.html'
            ,cluster_feature_name: 'bootp'
        };

        CP.UI.updateDataPanel(obj, null, true);
    }
    ,check_user_action          : function() {
        CP.ar_util.checkBtnsbar("bootp_btnsbar");
        CP.ar_util.checkBtnsbar("bootp_form");
    }

//  defineStores
    ,defineStores                   : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["bootp_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("bootpgw");
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"addr"
                ,"addrmask"
                ,"addr4_list"
                ,"addr6_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
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
                load        : function(st, recs, success, op, eOpts) {
                    var bootp_st = Ext.getStore("bootp_store");
                    if (bootp_st) {
                        CP.ar_util.loadListPush("bootp_store");
                        bootp_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
                    }
                    CP.ar_util.loadListPop("intf_store");
                }
            }
        });

        //store for primary address combo box
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_addr_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "addr4"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        //bootp.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bootp_store"
            ,autoLoad   : false
            ,fields     : [
                "state"
                ,"intf"
                ,"primary"
                ,"waittime"
                ,"maxhopcount"
                ,"RelayServers"
                ,"addr4_list"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/bootp.tcl?instance=" + CP.ar_util.INSTANCE()
                ,reader : {
                    type    : "json"
                    ,root   : "data.bootp_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop("bootp_store");
                }
            }
        });

        //relays
        Ext.create("CP.WebUI4.Store", {
            storeId     : "relay_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "relay"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                clear       : function(st, eOpts) {
                    var primary_combo = Ext.getCmp("primary_entry");
                    if (primary_combo) {
                        primary_combo.setValue("");
                        primary_combo.clearInvalid();
                    }
                }
            }
        });
    }
    ,load_relay_store               : function(rec) {
        var relay_store = Ext.getStore("relay_store");
        if (relay_store) {
            if (rec == null) {
                relay_store.removeAll();
            } else {
                relay_store.loadData( rec.data.RelayServers );
            }
        }
    }

//  configPanel
    ,configPanel                    : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "bootp_configPanel"
            ,listeners  : {
                afterrender : CP.bootp.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("bootp"),
                CP.bootp.get_bootp()
            ]

            ,onTabChange : function() {
                // We are switching to the monitor page, so refresh the monitor
                // page now.
                if (CP && CP.bootp_mon_4 && CP.bootp_mon_4.doLoad) {
                    CP.bootp_mon_4.doLoad();
                }
            }
        });
        return configPanel;
    }
    ,doLoad                         : function() {
        CP.ar_util.clearParams();
        CP.ar_util.loadListPop("mySubmit");

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("bootpgw");
        }
        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            CP.ar_util.loadListPush("intf_store");
            intf_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
        }
        Ext.getCmp("bootp_edit_btn").setDisabled(true);
        Ext.getCmp("bootp_delete_btn").setDisabled(true);
    }
    ,get_bootp                      : function() {
        var bootp_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "bootp_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "bootp_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("bootp_grid").getSelectionModel().deselectAll();
                        CP.bootp.open_bootp_window("add");
                    }
                    ,disabledConditions : function() {
                        var intf_st = Ext.getStore("intf_store");
                        return (intf_st ? intf_st.getCount() == 0 : true);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "bootp_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("bootp_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit BOOTP/DHCP Relay: "+ rec.data.intf;
                        CP.bootp.open_bootp_window(T);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("bootp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "bootp_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var recs = Ext.getCmp("bootp_grid").getSelectionModel().getSelection();
                        if (recs.length > 0) {
                            CP.ar_util.clearParams();
                            var i;
                            for(i = 0; i < recs.length; i++) {
                                delete_bootp(recs[i]);
                            }
                            CP.ar_util.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("bootp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_bootp(rec) {
            var params  = CP.ar_util.getParams();
            var intf    = rec.data.intf;
            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE()
                        + ":bootpgw:interface:"+ intf;
            params[prefix]                  = "";
            params[prefix +":primary"]      = "";
            params[prefix +":waittime"]     = "";
            params[prefix +":maxhopcount"]  = "";
            var relays = rec.data.RelayServers;
            var i;
            for(i = 0; i < relays.length; i++) {
                params[prefix +":relayto:host:"+ relays[i].relay]  = "";
            }

            Ext.getStore("bootp_store").remove(rec);
        }

        var bootp_cm = [
            {
                text            : "State"
                ,dataIndex      : "state"
                ,width          : 50
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (value == "true") {
                        value = "on";
                    } else {
                        value = "off";
                    }
                    return CP.ar_util.rendererGeneric(value);
                }
            },{
                text            : "Interface"
                ,dataIndex      : "intf"
                ,width          : 140
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
                text            : "Primary Address"
                ,dataIndex      : "primary"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    var color = "black";
                    var intf = rec.data.intf;
                    var i_st = Ext.getStore("intf_store");
                    var i;
                    if (CP.bootp.VALIDATE_PRIMARY_ADDRESS && i_st) {
                        var r = i_st.findRecord("intf", intf, 0, false, true, true);
                        var invalidPrimary = true;
                        if (r && r.data.addr4_list) {
                            var a4 = r.data.addr4_list;
                            for(i = 0; invalidPrimary && i < a4.length; i++) {
                                if (a4[i].addr4 == value) {
                                    invalidPrimary = false;
                                }
                            }
                        }
                        if (invalidPrimary) {
                            retValue = String(value) +" (Invalid)";
                            color = "red";
                        }
                    }

                    if (!retValue || retValue == "") {
                        retValue = "(automatic)";
                    }

                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Wait Time"
                ,dataIndex      : "waittime"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = String(CP.bootp.DEFAULT_WAITTIME);
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Maximum Hops"
                ,dataIndex      : "maxhopcount"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = String(CP.bootp.DEFAULT_MAXHOPS);
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Relays"
                ,dataIndex      : "RelayServers"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (rec.data.RelayServers.length == 0) {
                        return "None";
                    }
                    var relays = rec.data.RelayServers;
                    var retValue = relays[0].relay;
                    var i;
                    if (relays.length > 1) {
                        for(i = 1; i < relays.length; i++) {
                            retValue += "<br />"+ relays[i].relay;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
        ];

        var bootp_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.bootp.check_user_action();
                }
            }
        });

        var bootp_grid = {
            xtype               : "cp4_grid"
            ,id                 : "bootp_grid"
            ,width              : 630
            ,height             : 200
            ,margin             : 0
            ,padding            : 0
            ,forceFit           : true
            ,store              : Ext.getStore("bootp_store")
            ,selModel           : bootp_selModel
            ,columns            : bootp_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("bootp_edit_btn");
                    if (b) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "BOOTP/DHCP"
            }
            ,bootp_btnsbar
            ,bootp_grid
        ];
    }

    ,open_bootp_window              : function(TITLE) {
        var state_cmp =                     {
            xtype           : "cp4_checkbox"
            ,fieldLabel     : "Enable"
            ,id             : "state_entry"
            ,name           : "state"
            ,labelWidth     : 100
            ,width          : 300
            ,style          : "margin-left:15px;margin-top:15px;"
            ,height         : 22
            ,submitValue    : false
            ,checked        : true
        };

        var interface_cmp;
        if (TITLE == "add") {
            TITLE = "Add BOOTP / DHCP Relay";

            interface_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "intf"
                ,labelWidth     : 100
                ,width          : 300
                ,style          : "margin-left:15px;"
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
                        var helper_addr = String(recs[0].data.addrmask);
                        Ext.getCmp("helper_intf_addr").setValue(helper_addr);

                        var new_primary = "";
                        var b_st = Ext.getStore("bootp_store");
                        var r = null;
                        if (b_st) {
                            r = b_st.findRecord("intf", recs[0].data.intf, 0, false, true, true);
                            if (r && r.data.primary) {
                                new_primary = r.data.primary;
                            }
                        }
                        CP.bootp.load_relay_store( r );
                        Ext.getCmp("primary_entry").setValue( new_primary );
                        CP.ar_util.clearParams();
                    }
                    ,blur           : function(c, eOpts) {
                        Ext.getCmp("primary_entry").validate();
                    }
                }
            };
        } else {
            interface_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "intf"
                ,labelWidth     : 100
                ,width          : 300
                ,height         : 22
                ,style          : "margin-left:15px"
            };
        }

        var helper_intf_addr_cmp = {
            xtype           : "cp4_displayfield"
            ,fieldLabel     : " "
            ,labelSeparator : ""
            ,id             : "helper_intf_addr"
            ,labelWidth     : 100
            ,width          : 300
            ,height         : 22
            ,style          : "margin-left:15px;"
        };

        var primary_cmp = {
            xtype           : "cp4_ipv4field"
            ,fieldLabel     : "Primary Address"
            ,id             : "primary_entry"
            ,fieldConfig    : {
                name            : "primary"
                ,allowBlank     : true
            }
            ,style          : "margin-left:15px;"
        };

        function bootp_save() {
            var panel = Ext.getCmp("bootp_form");
            if (panel && !( panel.getForm().isValid() ) ) { return; }
            var params      = CP.ar_util.getParams();
            var state       = Ext.getCmp("state_entry").checked ? "t" : "";
            var intf        = Ext.getCmp("interface_entry").getValue();
            var primary     = Ext.getCmp("primary_entry").getValue();
            var waittime    = Ext.getCmp("waittime_entry").getRawValue();
            if (waittime != "") {
                waittime = Ext.Number.constrain(parseInt(waittime, 10), 0, 65535);
            }
            var maxhopcount = Ext.getCmp("maxhopcount_entry").getRawValue();
            if (maxhopcount != "") {
                maxhopcount = Ext.Number.constrain(parseInt(maxhopcount, 10), 1, 16);
            }

            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE()
                        + ":bootpgw:interface:"+ intf;

            params[prefix]                  = state;
            params[prefix +":primary"]      = primary;
            params[prefix +":waittime"]     = waittime;
            params[prefix +":maxhopcount"]  = maxhopcount;

            var recs = Ext.getStore("relay_store").getRange();

            if (recs.length == 0) {
                Ext.Msg.alert("Error", "At least one relay destination is required");
                return;
            }

            var i;
            for(i = 0; i < recs.length; i++) {
                params[prefix +":relayto:host:"+ recs[i].data.relay] = "t";
            }
            //window close done successful ajax post
            CP.ar_util.mySubmit();
        }

        function delete_relay(rec) {
            if (!(rec.data.newrec)) {
                var params  = CP.ar_util.getParams();
                var intf    = Ext.getCmp("interface_entry").getValue();

                var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE()
                            + ":bootpgw:interface:"+ intf;
                params[prefix +":relayto:host:"+ rec.data.relay]    = "";
            }
            Ext.getStore("relay_store").remove(rec);
        }

        var bootp_form = {
            xtype       : "cp4_formpanel"
            ,id         : "bootp_form"
            ,width      : 330
            ,height     : 397
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    var primary_address = "";
                    if (Ext.getCmp("interface_entry").getXType() == "cp4_displayfield") {
                        var rec = Ext.getCmp("bootp_grid").getSelectionModel().getLastSelected();
                        primary_address = String(rec.data.primary);
                        var i_rec = Ext.getStore("intf_store").findRecord(
                            "intf"
                            ,rec.data.intf
                            ,0
                            ,false
                            ,true
                            ,true
                        );
                        Ext.getCmp("helper_intf_addr").setValue(i_rec.data.addrmask);
                        p.loadRecord(rec);
                        CP.bootp.load_relay_store( rec );
                    } else {
                        CP.bootp.load_relay_store( null );
                    }
                    Ext.getCmp("primary_entry").setValue(primary_address);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("bootp_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("bootp_save_btn");
                CP.ar_util.checkDisabledBtn("bootp_cancel_btn");
                CP.ar_util.checkBtnsbar("relay_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "bootp_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        bootp_save();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("bootp_form");
                        return !(f);
                    }
                    ,listeners      : {
                        mouseover       : function() {
                            Ext.getCmp("bootp_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "bootp_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("bootp_window");
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("primary_entry").validate();
                            if (Ext.getCmp("interface_entry").validate) {
                                Ext.getCmp("interface_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                state_cmp
                ,interface_cmp
                ,helper_intf_addr_cmp
                ,primary_cmp
                ,{
                    xtype           : "cp4_formpanel"
                    ,layout         : {
                        type    : "hbox"
                    }
                    ,padding        : 0
                    ,margin         : 0
                    ,width          : 315
                    ,items          : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Wait Time"
                            ,id             : "waittime_entry"
                            ,name           : "waittime"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,style          : "margin-left:15px;margin-right:10px;"
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,emptyText      : "Default: "+ String(CP.bootp.DEFAULT_WAITTIME)
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
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                        }
                    ]
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Maximum Hops"
                    ,id                 : "maxhopcount_entry"
                    ,name               : "maxhopcount"
                    ,labelWidth         : 100
                    ,width              : 200
                    ,style              : "margin-left:15px;margin-right:10px;"
                    ,value              : ""
                    ,emptyText          : "Default: "+ String(CP.bootp.DEFAULT_MAXHOPS)
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 1
                    ,maxValue           : 16
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,listeners          : {
                        blur                : function(num, eOpts) {
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
                },{
                    xtype           : "cp4_formpanel"
                    ,margin         : "0 15 0 15"
                    ,padding        : 0
                    ,items          : [
                        {
                            xtype           : "cp4_sectiontitle"
                            ,titleText      : "Relays"
                        },{
                            xtype           : "cp4_btnsbar"
                            ,id             : "relay_btnsbar"
                            ,chkBtns        : function() {
                                CP.ar_util.checkDisabledBtn("relay_add_btn");
                                CP.ar_util.checkDisabledBtn("relay_delete_btn");
                            }
                            ,items          : [
                                {
                                    xtype               : "cp4_button"
                                    ,text               : "Add"
                                    ,id                 : "relay_add_btn"
                                    ,disabled           : true
                                    ,overrideNoToken    : false
                                    ,handler2           : function(b) {
                                        CP.bootp.add_relay_window();
                                    }
                                    ,disabledConditions : function() {
                                        var f = CP.ar_util.checkFormValid("bootp_form");
                                        return !(f);
                                    }
                                },{
                                    xtype               : "cp4_button"
                                    ,text               : "Delete"
                                    ,id                 : "relay_delete_btn"
                                    ,disabled           : true
                                    ,overrideNoToken    : false
                                    ,handler2           : function(b) {
                                        var sm = Ext.getCmp("relay_grid").getSelectionModel();
                                        var recs = sm.getSelection();
                                        if (recs.length > 0) {
                                            var i;
                                            for(i = 0; i < recs.length; i++) {
                                                delete_relay(recs[i]);
                                            }
                                        }
                                    }
                                    ,disabledConditions : function() {
                                        var f = CP.ar_util.checkFormValid("bootp_form");
                                        if ( !(f) ) { return true; }
                                        var g = Ext.getCmp("relay_grid");
                                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                                    }
                                }
                            ]
                        },{
                            xtype               : "cp4_grid"
                            ,id                 : "relay_grid"
                            ,width              : 200
                            ,margin             : "0 0 8 0"
                            ,padding            : 0
                            ,forceFit           : true
                            ,store              : Ext.getStore("relay_store")
                            ,columns            : [
                                {
                                    text            : "Relay To Server"
                                    ,dataIndex      : "relay"
                                    ,width          : 200
                                    ,menuDisabled   : true
                                    ,renderer       : CP.ar_util.rendererGeneric
                                }
                            ]
                            ,draggable          : false
                            ,enableColumnMove   : false
                            ,enableColumnResize : true
                            ,listeners          : {
                                selectionchange     : function(view, selections, eOpts) {
                                    var delete_btn  = Ext.getCmp("relay_delete_btn");
                                    if (delete_btn) {
                                        delete_btn.setDisabled( 0 == selections.length );
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };

        var bootp_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "bootp_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ bootp_form ]
        });
        bootp_window.show();
    }

    ,add_relay_window                   : function() {
        var relay_form = {
            xtype       : "cp4_formpanel"
            ,id         : "relay_form"
            ,width      : 260
            ,height     : 85
            ,autoScroll : false
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("relay_save_btn");
                CP.ar_util.checkDisabledBtn("relay_cancel_btn");
            }
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("relay_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "relay_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var relay = Ext.getCmp("relay_entry").getValue();
                        var relay_st = Ext.getStore("relay_store");
                        if (relay_st && relay_st.findExact("relay", relay) == -1) {
                            var m = CP.addr_list.getMatchMessage(relay);
                            if (m != "") {
                                Ext.Msg.alert("Error", m);
                                return;
                            }
                            relay_st.add({
                                "relay"     : relay
                                ,"newrec"   : true
                            });
                        }
                        CP.ar_util.checkWindowClose("relay_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("relay_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("relay_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "relay_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("relay_window");
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            if (Ext.getCmp("relay_entry").validate) {
                                Ext.getCmp("relay_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,defaults   : {
                style       : "margin-top:15px;margin-left:15px;margin-bottom:8px;"
            }
            ,items      : [
                {
                    xtype           : "cp4_ipv4field_ex"
                    ,id             : "relay_entry"
                    ,allowBlank                 : false
                    ,rejectZero                 : true
                    ,rejectLoopback             : true
                    ,rejectMulticast            : true
                    ,rejectGlobalBroadcast      : true
                    ,fieldConfig    : {
                        name           : "relay"
                    }
                    ,octetsConfig   :   [{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }
                                        ,{ minValue: 0, maxValue: 255 }]
                }
            ]
        };

        var relay_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "relay_window"
            ,title      : "Add Relay"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("bootp_window").getPosition();
                    win.setPosition(70 + pos[0], 115 + pos[1]);
                }
            }
            ,items      : [ relay_form ]
        });
        relay_window.show();
    }
}

