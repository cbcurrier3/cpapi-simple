CP.igmp_4 = {
    GROUP_GRID_WIDTH            : 135
    ,LABELWIDTH                 : 150
    ,igmp_interface_allowBlank  : true
    
    ,init                       : function() {
        CP.igmp_4.defineStores();
        var igmp_configPanel = CP.igmp_4.configPanel();
        var obj = {
            title           : "IGMP"
            ,panel          : igmp_configPanel
            ,submitURL      : "/cgi-bin/igmp.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("igmp_interface_window");
                CP.igmp_4.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.igmp_monitor_4 && CP.igmp_monitor_4.doLoad) {
                    CP.igmp_monitor_4.doLoad();
                }                               
            }
            ,submitFailure  : function() {
                CP.igmp_4.doLoad();
            }
            ,checkCmpState  : CP.igmp_4.check_user_action
            ,helpFile       : "igmpHelp.html"
            ,cluster_feature_name: "igmp"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }
    ,check_user_action          : function() {
        CP.ar_util.checkBtnsbar("igmp_intf_btnsbar");
        CP.ar_util.checkBtnsbar("igmp_interface_form");
        CP.ar_util.checkBtnsbar("add_group_form");
    }

//defineStores
    ,defineStores               : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["igmp_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
                    ,"excludeType"  : "6in4 6to4 vpnt pppoe gre loopback"
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
                    var igmp_st = Ext.getStore("igmp_store");
                    var i;
                    if (igmp_st) {
                        for(i = 0; i < recs.length; i++) {
                            if (igmp_st.findExact("intf", recs[i].data.intf, 0) > -1) {
                                st.remove(recs[i]);
                            }
                        }
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //igmp.tcl - configured interfaces
        Ext.create("CP.WebUI4.Store", {
            storeId     : "igmp_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"address"
                ,"version"
                ,"lossrobustness"
                ,"queryinterval"
                ,"queryresponseinterval"
                ,"lastmemberqueryinterval"
                ,"norouteralert"
                ,"join_group_list"
                ,"static_group_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/igmp.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "interface"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.igmp_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    var intf_st     = Ext.getStore("intf_store");
                    if (intf_st) {
                        CP.ar_util.loadListPush("intf_store");
                        intf_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //local groups (aka join_group)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "join_group_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "join_group"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        //static groups (aka static_group)
        Ext.create("CP.WebUI4.Store", {
            storeId     : "static_group_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "static_group"
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
    ,load_group_stores          : function(rec) {
        var join_st     = Ext.getStore("join_group_store");
        var static_st   = Ext.getStore("static_group_store");

        if (join_st) {
            if (rec == null || rec == undefined) {
                join_st.removeAll();
            } else {
                join_st.loadData( rec.data.join_group_list );
            }
        }

        if (static_st) {
            if (rec == null || rec == undefined) {
                static_st.removeAll();
            } else {
                static_st.loadData( rec.data.static_group_list );
            }
        }
    }

//configPanel
    ,configPanel                : function() {

        var igmp_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "igmp_intf_btnsbar"
            ,items  : [
                {
                    text                : "Edit"
                    ,id                 : "igmp_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("igmp_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit IGMP on Interface "+ rec.data.intf;
                        CP.igmp_4.open_igmp_window(T);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("igmp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Reset to Default Values"
                    ,id                 : "igmp_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var sm = Ext.getCmp("igmp_grid").getSelectionModel();
                        var i;
                        if (sm.getCount() > 0) {
                            var recs = sm.getSelection();
                            var prefix = "SPECIAL:routed:instance:"
                                + CP.ar_util.INSTANCE() +":igmp:interface";
                            for(i = 0; i < recs.length; i++) {
                                params[prefix +":"+ recs[i].data.intf] = "";
                            }
                            CP.ar_util.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("igmp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var igmp_cm = [
            {
                header          : "Interface"
                ,dataIndex      : "intf"
                ,flex           : 100
                ,align          : "left"
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
                text            : "Address"
                ,dataIndex      : "address"
                ,width          : 120
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, metea, rec, row, col, st, view) {
                    var retValue = "";
                    switch (Ext.typeOf(value)) {
                        case "string":
                            if (value.indexOf(",") == -1) {
                                retValue = value;
                            } else {
                                retValue = value.replace(/,/g,"<br>");
                            }
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                header          : "Version"
                ,dataIndex      : "version"
                ,width          : 75
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "v2";
                    var color = "grey";
                    if (value != "") {
                        retValue = "v"+ value;
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                header          : "Loss Robustness"
                ,dataIndex      : "lossrobustness"
                ,width          : 125
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "2";
                    var color = "grey";
                    if (value != "") {
                        retValue = value;
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                header          : "Query Interval"
                ,dataIndex      : "queryinterval"
                ,width          : 105
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "125";
                    var color = "grey";
                    if (value != "") {
                        retValue = value;
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                header          : "Query Response Interval"
                ,dataIndex      : "queryresponseinterval"
                ,width          : 160
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "10";
                    var color = "grey";
                    if (value != "") {
                        retValue = value;
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                header          : "Last Member Query Interval"
                ,dataIndex      : "lastmemberqueryinterval"
                ,width          : 170
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = "1";
                    var color = "grey";
                    if (value != "") {
                        retValue = value;
                        color = "black";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                header          : "Router Alert"
                ,dataIndex      : "norouteralert"
                ,width          : 95
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value == "t") ? "Off" : "On";
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Local Groups"
                ,dataIndex      : "join_group_list"
                ,width          : 100
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (rec.data.join_group_list.length == 0) {
                        return "None";
                    }
                    var join_list = rec.data.join_group_list;
                    var retValue = join_list[0].join_group;
                    var i;
                    if (join_list.length > 1) {
                        for(i = 1; i < join_list.length; i++) {
                            retValue += "<br />" + join_list[i].join_group;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            },{
                header          : "Static Groups"
                ,dataIndex      : "static_group_list"
                ,width          : 100
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (rec.data.static_group_list.length == 0) {
                        return "None";
                    }
                    var static_list = rec.data.static_group_list;
                    var retValue = static_list[0].static_group;
                    var i;
                    if (static_list.length > 1) {
                        for(i = 1; i < static_list.length; i++) {
                            retValue += "<br />" + static_list[i].static_group;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", "black");
                }
            }
        ];

        var igmp_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("igmp_intf_btnsbar");
                }
            }
        });

        var igmp_grid = {
            xtype               : "cp4_grid"
            ,id                 : "igmp_grid"
            ,width              : 1150
            ,height             : 400
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("igmp_store")
            ,columns            : igmp_cm
            ,selModel           : igmp_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("igmp_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "igmp_configPanel"
            ,listeners  : {
                afterrender     : CP.igmp_4.doLoad
                ,validitychange : function() {
                    CP.igmp_4.check_user_action();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("igmp"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IGMP Interfaces"
                }
                ,igmp_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,autoScroll : true
                    ,items      : [ igmp_grid ]
                }
            ]
        });
        return configPanel;
    }

    ,doLoad                     : function() {
        if ( CP && CP.intf_state && CP.intf_state.load ) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        CP.ar_util.loadListPush("igmp_store");
        Ext.getStore("igmp_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ar_util.loadListPop("mySubmit");
    }

    ,open_igmp_window           : function(TITLE) {
        var intf_cmp;
        if (TITLE == "add") {
            TITLE = "Configure IGMP on a new Interface";
            intf_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "intf"
                ,labelWidth     : CP.igmp_4.LABELWIDTH
                ,width          : 300
                ,style          : "margin-top:15px;margin-left:15px;margin-right:15px;"
                ,queryMode      : "local"
                ,triggerAction  : "all"
                ,lastQuery      : ""
                ,editable       : false
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
            };
        } else {
            //edit
            intf_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "intf"
                ,labelWidth     : CP.igmp_4.LABELWIDTH
                ,width          : 300
                ,height         : 22
                ,style          : "margin-top:15px;margin-left:15px;margin-right:15px;"
            };
        }

    //JOIN GROUP (aka Local Groups)
        var join_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "igmp_join_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "join_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.igmp_4.add_group("join");
                    }
                },{
                    text                : "Delete"
                    ,id                 : "join_delete_btn"
                    ,margin             : "0 0 0 0"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("join_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i, grp;
                        var midfix = ":join:group:";
                        for(i = 0; i < recs.length; i++) {
                            if ( !(recs[i].data.newrec) ) {
                                grp = String(recs[i].data.join_group);
                                b.deleteArr.push(midfix + grp);
                            }
                        }
                        var st = Ext.getStore("join_group_store");
                        if (st) {
                            st.remove(recs);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("join_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteArr          : []
                    ,handleDelete       : function(params, prefix) {
                        var b = this;
                        var delArr = b.deleteArr;
                        var i;
                        for(i = 0; i < delArr.length; i++) {
                            params[prefix + delArr[i] ] = "";
                        }
                    }
                }
            ]
        };

        var join_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var delete_btn  = Ext.getCmp("join_delete_btn");
                    if (delete_btn) {
                        delete_btn.setDisabled( 0 == selections.length );
                    }
                }
            }
        });

        var join_grid = {
            xtype               : "cp4_grid"
            ,id                 : "join_grid"
            ,margin             : 0
            ,width              : CP.igmp_4.GROUP_GRID_WIDTH
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("join_group_store")
            ,columns            : [
                {
                    header          : "Local Groups"
                    ,dataIndex      : "join_group"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : CP.ar_util.rendererGeneric
                }
            ]
            ,selModel           : join_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var join_form = {
            xtype   : "cp4_formpanel"
            ,width  : CP.igmp_4.GROUP_GRID_WIDTH
            ,margin : "0 15 15 15"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Local Groups"
                }
                ,join_btnsbar
                ,join_grid
            ]
        };

    //STATIC GROUP
        var static_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "igmp_static_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "static_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.igmp_4.add_group("static");
                    }
                },{
                    text                : "Delete"
                    ,id                 : "static_delete_btn"
                    ,margin             : "0 0 0 0"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("static_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i, grp;
                        var midfix = ":static:group:";
                        for(i = 0; i < recs.length; i++) {
                            if ( !(recs[i].data.newrec) ) {
                                grp = String(recs[i].data.static_group);
                                b.deleteArr.push(midfix + grp);
                            }
                        }
                        var st = Ext.getStore("static_group_store");
                        if (st) {
                            st.remove(recs);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("static_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,deleteArr          : []
                    ,handleDelete       : function(params, prefix) {
                        var b = this;
                        var delArr = b.deleteArr;
                        var i;
                        for(i = 0; i < delArr.length; i++) {
                            params[prefix + delArr[i] ] = "";
                        }
                    }
                }
            ]
        };

        var static_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var delete_btn  = Ext.getCmp("static_delete_btn");
                    if (delete_btn) {
                        delete_btn.setDisabled( 0 == selections.length );
                    }
                }
            }
        });

        var static_grid = {
            xtype               : "cp4_grid"
            ,id                 : "static_grid"
            ,margin             : 0
            ,width              : CP.igmp_4.GROUP_GRID_WIDTH
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("static_group_store")
            ,columns            : [
                {
                    header          : "Static Groups"
                    ,dataIndex      : "static_group"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : CP.ar_util.rendererGeneric
                }
            ]
            ,selModel           : static_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var static_form = {
            xtype   : "cp4_formpanel"
            ,width  : CP.igmp_4.GROUP_GRID_WIDTH
            ,margin : "0 15 15 15"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Static Groups"
                }
                ,static_btnsbar
                ,static_grid
            ]
        };

    //window form
        var interface_form = {
            xtype       : "cp4_formpanel"
            ,id         : "igmp_interface_form"
            ,autoScroll : false
            ,width      : 330
            ,height     : 430
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    var rec = null;
                    if (Ext.getCmp("interface_entry").getXType() == "cp4_displayfield") {
                        //edit
                        rec = Ext.getCmp("igmp_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                    }
                    CP.igmp_4.load_group_stores(rec);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("igmp_interface_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("igmp_join_btnsbar");
                CP.ar_util.checkBtnsbar("igmp_static_btnsbar");
                CP.ar_util.checkDisabledBtn("interface_save_btn");
                CP.ar_util.checkDisabledBtn("interface_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "interface_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var panel = Ext.getCmp("igmp_interface_form");
                        if (panel && !(panel.getForm().isValid())) {
                            return;
                        }

                        var params = CP.ar_util.clearParams();

                        var intf                    = Ext.getCmp("interface_entry").getValue();
                        var version                 = Ext.getCmp("version_entry").getValue();
                        var lossrobustness          = Ext.getCmp("lossrobustness_entry").getValue();
                        var queryinterval           = Ext.getCmp("queryinterval_entry").getValue();
                        var queryresponseinterval   = Ext.getCmp("queryresponseinterval_entry").getValue();
                        var lastmemberqueryinterval = Ext.getCmp("lastmemberqueryinterval_entry").getValue();
                        var norouteralert           = Ext.getCmp("norouteralert_entry").getValue();
                        var j_list                  = Ext.getStore("join_group_store").getRange();
                        var s_list                  = Ext.getStore("static_group_store").getRange();

                        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":igmp:interface:"+ intf;

                        params[prefix]                              = "t";
                        params[prefix +":version"]                  = version;
                        params[prefix +":lossrobustness"]           = lossrobustness;
                        params[prefix +":queryinterval"]            = queryinterval;
                        params[prefix +":queryresponseinterval"]    = queryresponseinterval;
                        params[prefix +":lastmemberqueryinterval"]  = lastmemberqueryinterval;
                        params[prefix +":norouteralert"]            = norouteralert;

                        var i;
                        var join_del_btn    = Ext.getCmp("join_delete_btn");
                        var static_del_btn  = Ext.getCmp("static_delete_btn");
                        if (join_del_btn && join_del_btn.handleDelete) {
                            join_del_btn.handleDelete(params, prefix);
                        }
                        if (static_del_btn && static_del_btn.handleDelete) {
                            static_del_btn.handleDelete(params, prefix);
                        }
                        for(i = 0; i < j_list.length; i++) {
                            params[prefix +":join:group:"+ j_list[i].data.join_group]       = "t";
                        }
                        for(i = 0; i < s_list.length; i++) {
                            params[prefix +":static:group:"+ s_list[i].data.static_group]   = "t";
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("igmp_interface_form");
                        return !f;
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("interface_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "interface_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("igmp_interface_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            if (Ext.getCmp("interface_entry").validate) {
                                Ext.getCmp("interface_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                intf_cmp
                ,{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Version"
                    ,id             : "version_entry"
                    ,name           : "version"
                    ,labelWidth     : CP.igmp_4.LABELWIDTH
                    ,width          : 235
                    ,style          : "margin-left:15px;"
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,editable       : false
                    ,emptyText      : "v2 "
                    ,value          : ""
                    ,store          :   [[""    ,""]
                                        ,[1     ,"v1"]
                                        ,[2     ,"v2"]
                                        ,[3     ,"v3"]]
                },{
                    xtype           : "cp4_numberfield"
                    ,fieldLabel     : "Loss Robustness"
                    ,id             : "lossrobustness_entry"
                    ,name           : "lossrobustness"
                    ,labelWidth     : CP.igmp_4.LABELWIDTH
                    ,width          : 235
                    ,style          : "margin-left:15px;"
                    ,allowBlank     : CP.igmp_4.igmp_interface_allowBlank
                    ,allowDecimals  : false
                    ,minValue       : 1
                    ,maxValue       : 255
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,emptyText      : "2 "
                    ,value          : ""
                    //,value          : 2
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,width          : 300
                    ,padding        : 0
                    ,margin         : "0 15 0 15"
                    ,items          : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Query Interval"
                            ,id             : "queryinterval_entry"
                            ,name           : "queryinterval"
                            ,labelWidth     : CP.igmp_4.LABELWIDTH
                            ,width          : 235
                            ,style          : "margin-right:10px;"
                            ,allowBlank     : CP.igmp_4.igmp_interface_allowBlank
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 3600
                            ,maxLength          : 4
                            ,enforceMaxLength   : true
                            ,emptyText      : "125 "
                            ,value          : ""
                            //,value          : 125
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,width          : 300
                    ,padding        : 0
                    ,margin         : "0 15 0 15"
                    ,items          : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Query Response Interval"
                            ,id             : "queryresponseinterval_entry"
                            ,name           : "queryresponseinterval"
                            ,labelWidth     : CP.igmp_4.LABELWIDTH
                            ,width          : 235
                            ,style          : "margin-right:10px;"
                            ,allowBlank     : CP.igmp_4.igmp_interface_allowBlank
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 25
                            ,maxLength          : 2
                            ,enforceMaxLength   : true
                            ,emptyText      : "10 "
                            ,value          : ""
                            //,value          : 10
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,width          : 300
                    ,padding        : 0
                    ,margin         : "0 15 0 15"
                    ,items          : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Last Member Query Interval"
                            ,id             : "lastmemberqueryinterval_entry"
                            ,name           : "lastmemberqueryinterval"
                            ,labelWidth     : CP.igmp_4.LABELWIDTH
                            ,width          : 235
                            ,style          : "margin-right:10px;"
                            ,allowBlank     : CP.igmp_4.igmp_interface_allowBlank
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 25
                            ,maxLength          : 2
                            ,enforceMaxLength   : true
                            ,emptyText      : "1 "
                            ,value          : ""
                            //,value          : 1
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                        }
                    ]
                },{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Router Alert"
                    ,id             : "norouteralert_entry"
                    ,name           : "norouteralert"
                    ,labelWidth     : CP.igmp_4.LABELWIDTH
                    ,width          : 235
                    ,style          : "margin-left:15px;"
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,editable       : false
                    ,emptyText      : "Enabled "
                    ,value          : ""
                    ,store          :   [[""    ,"Enabled"]
                                        ,["t"   ,"Disabled"]]
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,width          : 330
                    ,margin         : 0
                    ,padding        : 0
                    ,items          : [
                        join_form
                        ,static_form
                    ]
                }
            ]
        };

        var interface_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "igmp_interface_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ interface_form ]
        });
        interface_window.show();
    }

    ,add_group                      : function(group_type) {
        var add_group_form = {
            xtype       : "cp4_formpanel"
            ,id         : "add_group_form"
            ,autoScroll : false
            ,width      : 285
            ,height     : 112
            ,defaults   : {
                style       : "left-margin:15px;"
            }
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("add_group_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("add_group_save_btn");
                CP.ar_util.checkDisabledBtn("add_group_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "add_group_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var group_type  = Ext.getCmp("group_type_entry").getValue();
                        if (group_type != "join") {
                            group_type = "static";
                        }
                        var group       = Ext.getCmp("group_entry").getValue();
                        var st          = Ext.getStore(String(group_type) +"_group_store");
                        var fieldname   = String(group_type) +"_group";
                        if (st) {
                            if (st.findExact(fieldname, group) == -1) {
                                var newRec = { "newrec": true };
                                newRec[fieldname] = group;
                                st.add(newRec);
                            }
                        }
                        var grid = Ext.getCmp(String(group_type) +"_grid");
                        if (grid) { grid.getView().refresh(); }
                        CP.ar_util.checkWindowClose("add_group_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("add_group_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("add_group_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "add_group_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("add_group_window");
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            var grp_entry = Ext.getCmp("group_entry");
                            if (grp_entry.validate) {
                                grp_entry.validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "tbspacer"
                    ,height : 15
                    ,width  : 15
                },{
                    xtype           : "cp4_ipv4field"
                    ,fieldLabel     : "Multicast Address"
                    ,id             : "group_entry"
                    ,style          : "margin-left:15px;"
                    ,fieldConfig    : {
                        fieldLabel  : "Multicast Address"
                        ,allowBlank : false
                    }
                    ,octetsConfig   : [
                        {minValue: 224, maxValue: 239}
                        ,{minValue: 0, maxValue: 255}
                        ,{minValue: 0, maxValue: 255}
                        ,{minValue: 0, maxValue: 255}
                    ]
                },{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Group Type"
                    ,id             : "group_type_entry"
                    ,name           : "group_type_entry_name"
                    ,labelWidth     : 100
                    ,width          : 255
                    ,style          : "margin-left:15px;margin-bottom:8px;"
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,editable       : false
                    ,allowBlank     : false
                    ,value          : group_type
                    ,store          :   [["join"    ,"Local Group"]
                                        ,["static"  ,"Static Group"]]
                }
            ]
        };

        var add_group_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "add_group_window"
            ,title      : "Add Multicast Group"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("igmp_interface_window").getPosition();
                    win.setPosition(pos[0], 105 + pos[1]);
                }
            }
            ,items      : [ add_group_form ]
        });
        add_group_window.show();
    }
}

