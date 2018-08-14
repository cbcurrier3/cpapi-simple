CP.iphelper_4 = {
    init                    : function() {
        CP.iphelper_4.defineStores();
        var configPanel = CP.iphelper_4.configPanel();
        var obj = {
            title           : "IP Broadcast Helper"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/iphelper.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("add_relay_window");
                CP.iphelper_4.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.iphelper_stats_4 && CP.iphelper_stats_4.doLoad) {
                    CP.iphelper_stats_4.doLoad();
                }                                               
            }
            ,submitFailure  : function() {
                CP.iphelper_4.doLoad();
            }
            ,checkCmpState  : CP.iphelper_4.check_user_action
            ,helpFile       : "ipHelperHelp.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//  common ajax related functions
    ,check_user_action          : function() {
        CP.ar_util.checkBtnsbar("iphelper_global_btnsbar");
        CP.ar_util.checkBtnsbar("iphelper_btnsbar");
        CP.ar_util.checkBtnsbar("add_relay_form");
    }
    ,mySubmit                   : function() {
        var params  = CP.ar_util.getParams();
        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":iphelper:forwardnonlocal";
        var val     = (Ext.getCmp("fwdnonlocal").getValue()) ? "t" : "";
        params[prefix] = val;
        CP.ar_util.mySubmit();
    }

//  defineStores
    ,defineStores           : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["iphelper_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : ["intf", "addr4_list", "addr6_list"]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
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
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    st.clearFilter();
                    CP.ar_util.loadListPop("intf_store");
                }
            }
        });

        //iphelper.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "iphelper_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"port"
                ,{
                    name        : "addr"
                    ,sortType   : function(value) {
                        var gw_p = value.split(".");
                        var retval = 1;
                        var i;
                        for(i = 0; i < gw_p.length ; i++) {
                            retval = parseInt(retval, 10) * 1000 + parseInt(gw_p[i], 10);
                        }
                        return retval;
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/iphelper.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "single"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParm      : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.iphelper_data"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    st.clearFilter();
                    CP.ar_util.loadListPop("iphelper_store");
                }
            }
        });
    }

//  configPanel
    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "iphelper_configPanel"
            ,listeners  : {
                afterrender : CP.iphelper_4.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("iphelper"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IP Broadcast Helper"
                },{
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "Forward Non-local Packets"
                    ,id             : "fwdnonlocal"
                    ,name           : "fwdnonlocal"
                    ,submitValue    : false
                    ,labelWidth     : 150
                    ,width          : 200
                    ,height         : 22
                },{
                    xtype           : "cp4_btnsbar"
                    ,id             : "iphelper_global_btnsbar"
                    ,items          : [
                        {
                            text                : "Apply"
                            ,id                 : "iphelper_apply_global_btn"
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                CP.ar_util.clearParams();
                                CP.iphelper_4.mySubmit();
                            }
                        }
                    ]
                }
                ,CP.iphelper_4.get_iphelper_table()
            ]
        });
        return configPanel;
    }
    ,doLoad                 : function() {
        CP.ar_util.clearParams();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }

        CP.ar_util.loadListPush("intf_store");
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});

        CP.ar_util.loadListPush("iphelper_store");
        Ext.getStore("iphelper_store").load({params: {"instance": CP.ar_util.INSTANCE()}});

        CP.ar_util.loadListPop("mySubmit");
        var p = Ext.getCmp("iphelper_configPanel");
        if (!p) { return; }
        CP.ar_util.loadListPush("doLoad");
        p.load({
            url         : "/cgi-bin/iphelper.tcl?instance="+ CP.ar_util.INSTANCE() + "&option=global"
            ,method     : "GET"
            ,failure    : function() {
                CP.ar_util.loadListPop("doLoad");
            }
            ,success    : function(p, action) {
                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

//  get_iphelper_table
    ,get_iphelper_table     : function() {
        var iphelper_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "iphelper_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "iphelper_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("iphelper_grid").getSelectionModel().deselectAll();
                        CP.iphelper_4.open_relay_window("Add Relay");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "iphelper_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.iphelper_4.open_relay_window("Edit Relay");
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("iphelper_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "iphelper_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("iphelper_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            delete_relay(recs[i]);
                        }
                        CP.iphelper_4.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("iphelper_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_relay(rec) {
            var params  = CP.ar_util.getParams();
            var intf    = rec.data.intf;
            var port    = rec.data.port;
            var addr    = rec.data.addr;

            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":iphelper";
            var iprefix = prefix +":interface:"+ intf;
            var pprefix = iprefix +":udpport:"+ port;
            var aprefix = pprefix +":relayto:"+ addr;

            var st      = Ext.getStore("iphelper_store");
            st.remove(rec);
            var recs = st.getRange();

            var intf_not_found  = true; //same i
            var port_not_found  = true; //same i and p
            var addr_not_found  = true; //same i, p, and a, shouldn't happen
            var i;
            for(i = 0; i < recs.length; i++) {
                if (recs[i].data.intf == intf) {
                    intf_not_found = false;
                    if (recs[i].data.port == port) {
                        port_not_found = false;
                        if (recs[i].data.addr == addr) {
                            addr_not_found = false;
                        }
                    }
                }
            }

            if (addr_not_found) {
                params[aprefix] = "";
                if (port_not_found) {
                    params[pprefix] = "";
                    if (intf_not_found) {
                        params[iprefix] = "";
                    }
                }
            }
        }

    //renderers
        function generate_tip(rec) {
            var tag1 = "<i>";
            var tag2 = "</i>";
            var i_str = String(rec.data.intf);
            var i_str2 = CP.intf_state.format_substr(i_str, i_str, "ipv4", CP.ar_util.INSTANCE());
            var tip = "Interface "+ tag1 + i_str2 + tag2;
            if (rec.data.port) {
                tip += ", Service Port "+ tag1 + rec.data.port + tag2;
                if (rec.data.addr) {
                    tip += ", Relay to "+ tag1 + rec.data.addr + tag2;
                }
            }
            return tip;
        }

        var iphelper_cm = [
            {
                header          : "Interface"
                ,dataIndex      : "intf"
                ,width          : 130
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = generate_tip(rec);
                    var color = "black";
                    if (row > 0) {
                        var rec_p = st.getAt(row-1);
                        if (rec_p.data.intf == rec.data.intf) {
                            color = "grey";
                        }
                    }
                    return CP.intf_state.renderer_output(
                        value
                        ,tip
                        ,"left"
                        ,color
                        ,value
                        ,"ipv4"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                header          : "UDP Port"
                ,dataIndex      : "port"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    var tip = generate_tip(rec);
                    if (row > 0) {
                        var rec_p = st.getAt(row-1);
                        if (rec_p.data.intf == rec.data.intf && rec_p.data.port == rec.data.port) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, tip, "left", color);
                }
            },{
                header          : "Relay To"
                ,dataIndex      : "addr"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = generate_tip(rec);
                    return CP.ar_util.rendererSpecific(value, tip, "left", "black");
                }
            }
        ];

        var iphelper_selModel = Ext.create("Ext.selection.RowModel", {
            mode            : "MULTI"
            ,allowDeselect  : true
            ,listeners      : {
                selectionchange     : function(selModel, selection, eOpts) {
                    CP.ar_util.checkBtnsbar("iphelper_btnsbar");
                }
            }
        });

        var iphelper_grid = {
            xtype               : "cp4_grid"
            ,id                 : "iphelper_grid"
            ,width              : 400
            ,height             : 300
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("iphelper_store")
            ,columns            : iphelper_cm
            ,selModel           : iphelper_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("iphelper_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Configure Relays"
            }
            ,iphelper_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,items      : [ iphelper_grid ]
            }
        ];
    }

    ,open_relay_window          : function(TITLE) {
        if (TITLE == null || TITLE == undefined) {
            TITLE = "new";
        }

        var add_form = {
            xtype       : "cp4_formpanel"
            ,id         : "add_relay_form"
            ,autoScroll : false
            ,width      : 285
            ,height     : 139
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();

                    var sm  = Ext.getCmp("iphelper_grid").getSelectionModel();
                    if (sm.getCount() == 1) {
                        var rec = sm.getLastSelected();
                        p.loadRecord(rec);
                        Ext.getCmp("addr_entry").setValue(rec.data.addr);
                    }
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    CP.ar_util.checkBtnsbar("add_relay_form");
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("add_relay_save_btn");
                CP.ar_util.checkDisabledBtn("add_relay_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "add_relay_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        save_relay();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("add_relay_form");
                        return !(f);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("add_relay_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "add_relay_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("add_relay_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("interface_entry").validate();
                            Ext.getCmp("port_entry").validate();
                            if (Ext.getCmp("addr_entry").validate) {
                                Ext.getCmp("addr_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 8 15"
                    ,width      : 270
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype               : "cp4_combobox"
                            ,fieldLabel         : "Interface"
                            ,id                 : "interface_entry"
                            ,name               : "intf"
                            ,labelWidth         : 100
                            ,width              : 255
                            ,queryMode          : "local"
                            ,triggerAction      : "all"
                            ,lastQuery          : ""
                            ,editable           : false
                            ,store              : Ext.getStore("intf_store")
                            ,valueField         : "intf"
                            ,displayField       : "intf"
                            ,allowBlank         : false
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "UDP Port"
                            ,id                 : "port_entry"
                            ,name               : "port"
                            ,labelWidth         : 100
                            ,width              : 255
                            ,allowBlank         : false
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 65535
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                            ,validator          : function(v) {
                                var p_cmp = Ext.getCmp("port_entry");
                                if (v < p_cmp.minValue || v > p_cmp.maxValue) {
                                    return "";
                                }
                                if (v == 67 || v == 68) {
                                    return "UDP Ports 67 and 68 are reserved for DHCP.";
                                }
                                return true;
                            }
                        },{
                            xtype               : "cp4_ipv4field"
                            ,fieldLabel         : "Relay"
                            ,id                 : "addr_entry"
                            ,name               : "addr"
                            ,allowBlank         : false
                            ,fieldConfig        : {
                                fieldLabel          : "Relay"
                                ,allowBlank         : false
                            }
                        }
                    ]
                }
            ]
        };

        var add_relay_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "add_relay_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ add_form ]
        });
        add_relay_window.show();

        function save_relay() {
            var params  = CP.ar_util.clearParams();
            var intf    = Ext.getCmp("interface_entry").getValue();
            var port    = Ext.getCmp("port_entry").getValue();
            var addr    = Ext.getCmp("addr_entry").getValue();
            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":iphelper";
            var iprefix = prefix +":interface:"+ intf;
            var pprefix = iprefix +":udpport:"+ port;
            var aprefix = pprefix +":relayto:"+ addr;

            var grid    = Ext.getCmp("iphelper_grid");
            var sm      = grid.getSelectionModel();
            var st      = grid.getStore();
            var rec     = null;
            var old_i   = "";
            var old_p   = "";
            var old_a   = "";

            if (port == 67 || port == 68) {
                Ext.getCmp("port_entry").validate();
                return;
            }

            if (sm.getCount() == 1) {
                rec = sm.getLastSelected();
                old_i   = rec.data.intf;
                old_p   = rec.data.port;
                old_a   = rec.data.addr;
                rec.data.intf   = intf;
                rec.data.port   = port;
                rec.data.addr   = addr;
            } else {
                st.add({
                    "intf"  : intf
                    ,"port" : port
                    ,"addr" : addr
                });
            }

            params[iprefix] = "t";
            params[pprefix] = "t";
            params[aprefix] = "t";

            grid.getView().refresh();

            //handle cleanup
            if (rec != null) {
                iprefix = prefix +":interface:"+ old_i;
                pprefix = iprefix +":udpport:"+ old_p;
                aprefix = pprefix +":relayto:"+ old_a;

                //intf is still in use, is this intf and port in use?
                var recs = st.getRange();
                var intf_not_found  = true; //same i
                var port_not_found  = true; //same i and p
                var addr_not_found  = true; //same i, p, and a
                var i;
                for(i = 0; i < recs.length; i++) {
                    if (recs[i].data.intf == old_i) {
                        intf_not_found = false;
                        if (recs[i].data.port == old_p) {
                            port_not_found = false;
                            if (recs[i].data.addr == old_a) {
                                addr_not_found = false;
                            }
                        }
                    }
                }
                if (addr_not_found) {
                    params[aprefix] = "";
                    if (port_not_found) {
                        params[pprefix] = "";
                        if (intf_not_found) {
                            params[iprefix] = "";
                        }
                    }
                }
            }
            CP.iphelper_4.mySubmit();
        }
    }
}

