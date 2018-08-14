CP.rdisc = {
    INTF_LABELWIDTH         : 150
    ,ADDR_LABELWIDTH        : 100

    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("rdisc_btnsbar");
        CP.ar_util.checkBtnsbar("rdisc_form");
        CP.ar_util.checkBtnsbar("rdisc_vlink_form");
    }

    ,init                   : function() {
        CP.rdisc.defineStores();
        var configPanel = CP.rdisc.configPanel();
        var obj = {
            title           : "Router Discovery"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/rdisc.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("rdisc_window");
                CP.rdisc.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.rdisc_monitor_4 && CP.rdisc_monitor_4.doLoad) {
                    CP.rdisc_monitor_4.doLoad();
                }                                                                                                               
            }
            ,submitFailure  : function() {
                CP.rdisc.doLoad();
            }
            ,checkCmpState  : CP.rdisc.check_user_action
            ,helpFile       : "rdiscHelp.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }
    ,get_prefix             : function(intf) {
        if (intf == null || intf == undefined || intf == "") {
            return "";
        }
        return "routed:instance:"+ CP.ar_util.INSTANCE() +":routerdiscovery:interface:"+ intf;
    }

//STUB:defineStores
    ,defineStores           : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["rdisc_grid"];
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
                ,"addr"
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
            ,sorters    :   [{ property: "intf", direction: "ASC" }]
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //rdisc.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"enable"
                ,"lifetime"
                ,"minadvinterval"
                ,"maxadvinterval"
                ,"addr4_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rdisc.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rdisc"
                }
            }
            ,sorters    : [
                {
                    property    : "intf"
                    ,direction  : "ASC"
                }
            ]
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "rdisc_vlink_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "addrmask4"
                ,"addr4"
                ,"advertise"
                ,"ineligible"
                ,"preference"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });
    }
    ,load_vlink_store       : function(rec) {
        var st = Ext.getStore("rdisc_vlink_store");
        if (st && rec && rec.data) {
            st.loadData(rec.data.addr4_list);
            return;
        }
        st.removeAll();
    }

//STUB:configPanel
    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "rdisc_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.rdisc.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("rdisc"),
                CP.rdisc.get_grid() //get main rdisc grid and buttons
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
        var rdisc_store = Ext.getStore("rdisc_store");
        if (rdisc_store) {
            CP.ar_util.loadListPush("rdisc_store");
            rdisc_store.load({params: {"instance": instance_string}});
        }
        CP.ar_util.loadListPop("mySubmit");
    }

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
                    ,flex   : 1
                    ,style  : "margin-top:4px;margin-left:5px;"
                }
            ]
        };
    }

//STUB: get_grid
    ,get_grid               : function() {
        //btnsbar
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rdisc_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "rdisc_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        Ext.getCmp("rdisc_grid").getSelectionModel().deselectAll();
                        CP.rdisc.open_rdisc_window("Add Interface", null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "rdisc_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("rdisc_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Configure Interface: "+ rec.data.intf;
                        CP.rdisc.open_rdisc_window(T, rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("rdisc_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "rdisc_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("rdisc_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            delete_rdisc(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("rdisc_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_rdisc(rec) {
            var params  = CP.ar_util.getParams();
            var intf    = rec.data.intf;
            var prefix  = CP.rdisc.get_prefix(intf);
            if (prefix == "") {
                return;
            }
            var vlink, vprefix, i;
            for(i = 0; i < rec.data.addr4_list.length; i++) {
                vlink   = rec.data.addr4_list[i];
                vprefix = prefix +":address:"+ vlink.addr4;
                params[vprefix +":advertise"]   = "";
                params[vprefix +":ignore"]      = "";
                params[vprefix +":ineligible"]  = "";
                params[vprefix +":preference"]  = "";
                params[vprefix]                 = "";
            }
            params[prefix]                          = "";
            params["SPECIAL:"+ prefix]              = "";
            params[prefix +":minadvinterval"]       = "";
            params[prefix +":maxadvinterval"]       = "";
            params[prefix +":lifetime"]             = "";
            params[prefix +":configured_by_gaia"]   = "";
        }

        function get_adv_min_max_life(rec) {
            var mval = parseInt(rec.data.minadvinterval, 10) || 0;
            if (isNaN(mval)) {
                mval = 0;
            }
            var Mval = parseInt(rec.data.maxadvinterval, 10) || 600;
            var life = parseInt(rec.data.lifetime, 10) || 0;
            if (isNaN(life)) {
                life = 0;
            }
            var min_max = parseInt((Mval * 3) / 4, 10);
            if (!mval) {
                mval = min_max
            } else if (mval > Mval) {
                mval = Mval;
            }
            mval = Math.max(3, mval);
            if (!life) {
                life = Mval * 3;
            } else if (life < Mval) {
                life = Mval;
            }
            return [mval, Mval, life];
        }

        //grid
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
                        ,"ipv4"
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
                text            : "Advertisement Interval"
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
            },{
                text            : "Advertisement Lifetime"
                ,dataIndex      : "lifetime"
                ,width          : 160
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if (rec.data.enable) {
                        var adv_arr = get_adv_min_max_life(rec);
                        retValue = adv_arr[2];
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
                    CP.ar_util.checkBtnsbar("rdisc_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc_grid"
            ,width              : 600
            ,height             : 300
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("rdisc_edit_btn");
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
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }

//STUB: open_rdisc_window
    ,open_rdisc_window          : function(TITLE, REC) {

        var intf_cmp;
        if (REC == null) {
            intf_cmp = {
                xtype               : "cp4_combobox"
                ,fieldLabel         : "Interface"
                ,id                 : "rdisc_intf_entry"
                ,name               : "intf"
                ,labelWidth         : CP.rdisc.INTF_LABELWIDTH
                ,width              : CP.rdisc.INTF_LABELWIDTH + 200
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
                    var r_st = Ext.getStore("rdisc_store");
                    if (r_st) {
                        if (r_st.findExact("intf", v) > -1) {
                            return "This interface is already configured.";
                        }
                    }
                    return true;
                }
                ,listeners          : {
                    select              : function(combo, recs, eOpts) {
                        var intf = Ext.getCmp("rdisc_intf_entry").getValue();
                        var i_rec = Ext.getStore("intf_store").findRecord("intf", intf, 0, false, true, true);
                        var st = Ext.getStore("rdisc_vlink_store");
                        st.removeAll();

                        var addr4_list = i_rec.data.addr4_list;
                        var i;
                        for(i = 0; i < addr4_list.length; i++) {
                            st.add({
                                "addrmask4"     : addr4_list[i].addrmask4
                                ,"addr4"        : addr4_list[i].addr4
                                ,"advertise"    : true
                                ,"ineligible"   : ""
                                ,"preference"   : ""
                            });
                        }
                    }
                }
            };
        } else {
            intf_cmp = {
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "Interface"
                ,id                 : "rdisc_intf_entry"
                ,name               : "intf"
                ,labelWidth         : CP.rdisc.INTF_LABELWIDTH
                ,width              : CP.rdisc.INTF_LABELWIDTH + 150
                ,height             : 22
            };
        }

        //vlink grid
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rdisc_vlink_btnsbar"
            ,items  : [
                {
                    text                : "Edit"
                    ,id                 : "rdisc_vlink_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rdisc_vlink_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Address: "+ rec.data.addrmask4;
                        CP.rdisc.edit_vlink(T);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc_form");
                        if (!f) { return true; }
                        var g = Ext.getCmp("rdisc_vlink_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                }
            ]
        };

        var grid_cm = [
            {
                text            : "Address"
                ,dataIndex      : "addrmask4"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Advertise"
                ,dataIndex      : "advertise"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "No";
                    if (value) {
                        retValue = "Yes";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Preference"
                ,dataIndex      : "preference"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value || 0;
                    if (rec.data.ineligible) {
                        retValue = "";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            },{
                text            : "Eligibility"
                ,dataIndex      : "ineligible"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "Eligible";
                    if (value) {
                        retValue = "Ineligible";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "SINGLE"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("rdisc_form");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "rdisc_vlink_grid"
            ,width              : 440
            //,height             : 149
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("rdisc_vlink_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("rdisc_vlink_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        //rdisc_form
        var rdisc_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rdisc_form"
            ,width      : 470
            ,height     : 350
            ,margin     : 0
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    var rec = null;
                    if (Ext.getCmp("rdisc_intf_entry").getXType() == "cp4_displayfield") {
                        //edit
                        rec = Ext.getCmp("rdisc_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                    }
                    CP.rdisc.load_vlink_store(rec);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("rdisc_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("rdisc_save_btn");
                CP.ar_util.checkDisabledBtn("rdisc_cancel_btn");
                CP.ar_util.checkBtnsbar("rdisc_vlink_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "rdisc_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        save_rdisc(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover   : function() {
                            Ext.getCmp("rdisc_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "rdisc_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("rdisc_window");
                    }
                    ,listeners          : {
                        mouseover   : function() {
                            if (Ext.getCmp("rdisc_intf_entry").validate) {
                                Ext.getCmp("rdisc_intf_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 440
                    ,margin : "15 0 15 15"
                    ,items  : [
                        intf_cmp
                        ,CP.rdisc.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Min. Advertise Interval"
                                ,id                 : "rdisc_minadvinterval_entry"
                                ,name               : "minadvinterval"
                                ,labelWidth         : CP.rdisc.INTF_LABELWIDTH
                                ,width              : CP.rdisc.INTF_LABELWIDTH + 100
                                ,emptyText          : "Max * (3/4) "
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 3
                                ,maxValue           : 1799
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                /*
                                ,validator          : function() {
                                    var minCmp = Ext.getCmp("rdisc_minadvinterval_entry");
                                    var maxCmp = Ext.getCmp("rdisc_maxadvinterval_entry");

                                    var minVal = minCmp ? minCmp.getRawValue() : "";
                                    var maxVal = maxCmp ? maxCmp.getRawValue() : 600;

                                    if (maxVal == "") {
                                        maxVal = 600;
                                    } else {
                                        maxVal = parseInt(maxVal, 10);
                                        if (isNaN(maxVal) || maxVal < maxCmp.minValue || maxVal > maxCmp.maxValue) {
                                            maxVal = 600;
                                        }
                                    }

                                    if (minVal == "") {
                                        minVal = parseInt((maxVal * 3) / 4, 10);
                                    } else {
                                        minVal = parseInt(minVal, 10);
                                        if (isNaN(minVal)) {
                                            minVal = parseInt((maxVal * 3) / 4, 10);
                                        } else if (minVal < minCmp.minValue) {
                                            minVal = minCmp.minValue;
                                        } else if (minVal > minCmp.maxValue) {
                                            minVal = minCmp.maxValue;
                                        }
                                    }

                                    if (minCmp && minCmp.getRawValue() != "") {
                                        minVal = parseInt(minCmp.getRawValue(), 10);
                                    }
                                    if (maxCmp && maxCmp.getRawValue() != "") {
                                        maxVal = parseInt(maxCmp.getRawValue(), 10);
                                    }

                                    if (minVal < 3 || minVal > 1799) { return ""; }
                                    if (minVal > maxVal) {
                                        return "Min Advertise Interval should not be greater than Max Advertise Interval.";
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function() {
                                        Ext.getCmp("rdisc_maxadvinterval_entry").validate();
                                        Ext.getCmp("rdisc_lifetime_entry").validate();
                                    }
                                }
                                // */
                            }, 440, "seconds"
                        )
                        ,CP.rdisc.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Max. Advertise Interval"
                                ,id                 : "rdisc_maxadvinterval_entry"
                                ,name               : "maxadvinterval"
                                ,labelWidth         : CP.rdisc.INTF_LABELWIDTH
                                ,width              : CP.rdisc.INTF_LABELWIDTH + 100
                                ,emptyText          : "600 "
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 4
                                ,maxValue           : 1800
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                /*
                                ,listeners          : {
                                    change              : function() {
                                        Ext.getCmp("rdisc_minadvinterval_entry").validate();
                                        Ext.getCmp("rdisc_lifetime_entry").validate();
                                    }
                                }
                                // */
                            }, 440, "seconds"
                        )
                        ,CP.rdisc.component_with_units(
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Advertisement Lifetime"
                                ,id                 : "rdisc_lifetime_entry"
                                ,name               : "lifetime"
                                ,labelWidth         : CP.rdisc.INTF_LABELWIDTH
                                ,width              : CP.rdisc.INTF_LABELWIDTH + 100
                                ,emptyText          : "Max * 3"
                                ,allowDecimals      : false
                                ,value              : ""
                                ,minValue           : 5
                                ,maxValue           : 9000
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                /*
                                ,validator          : function() {
                                    var maxCmp = Ext.getCmp("rdisc_maxadvinterval_entry");
                                    var lifCmp = Ext.getCmp("rdisc_lifetime_entry");

                                    var maxVal = maxCmp ? maxCmp.getRawValue() : "600";
                                    var lifVal = lifCmp ? lifCmp.getRawValue() : "";

                                    if (maxVal != "") {
                                        maxVal = parseInt(maxVal, 10);
                                    } else {
                                        maxVal = 600;
                                    }
                                    if (lifVal != "") {
                                        lifVal = parseInt(lifCmp.getRawValue(), 10);
                                    } else {
                                        lifVal = maxVal * 3;
                                    }

                                    if (lifVal < 5 || lifVal > 9000) { return ""; }
                                    if (lifVal <= maxVal) {
                                        return  "Advertisement Lifetime should be larger "
                                                + "than Maximum Advertisement Interval "
                                                + "(recommended Max*3).";
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function() {
                                        Ext.getCmp("rdisc_minadvinterval_entry").validate();
                                        Ext.getCmp("rdisc_maxadvinterval_entry").validate();
                                    }
                                }
                                // */
                            }, 440, "seconds"
                        )
                        ,{
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Advertise Addresses"
                        }
                        ,btnsbar
                        ,grid
                    ]
                }
            ]
        };

        var rdisc_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rdisc_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ rdisc_form ]
        });
        rdisc_window.show();

        function save_rdisc() {
            var params  = CP.ar_util.clearParams();
            var intf    = Ext.getCmp("rdisc_intf_entry").getValue();
            var prefix  = CP.rdisc.get_prefix(intf);
            if (prefix == "") {
                return;
            }

            var enable          = "t";
            var minadvinterval  = Ext.getCmp("rdisc_minadvinterval_entry").getRawValue();
            var maxadvinterval  = Ext.getCmp("rdisc_maxadvinterval_entry").getRawValue();
            var lifetime        = Ext.getCmp("rdisc_lifetime_entry").getRawValue();

            params[prefix]                          = enable;
            params[prefix +":minadvinterval"]       = minadvinterval;
            params[prefix +":maxadvinterval"]       = maxadvinterval;
            params[prefix +":lifetime"]             = lifetime;
            params[prefix +":configured_by_gaia"]   = "";

            var recs = Ext.getStore("rdisc_vlink_store").getRange();
            var vlink, vprefix, i;
            for(i = 0; i < recs.length; i++) {
                vlink   = recs[i].data;
                vprefix = prefix +":address:"+ vlink.addr4;
                params[vprefix]                 = "t";
                params[vprefix +":advertise"]   = (vlink.advertise) ? "t" : "";
                params[vprefix +":ignore"]      = (vlink.advertise) ? "" : "t";
                params[vprefix +":ineligible"]  = (vlink.ineligible) ? "t" : "";
                params[vprefix +":preference"]  = (vlink.ineligible) ? "" : vlink.preference;
            }

            CP.ar_util.mySubmit();
        }
    }

    ,edit_vlink                 : function(TITLE) {
        function handle_preference_visibility(ineligible_raw) {
            var ineligible  = (ineligible_raw) ? true : false;
            var pref_cmp    = Ext.getCmp("rdisc_preference_entry");
            if (pref_cmp) {
                pref_cmp.setVisible(!ineligible);
                pref_cmp.setDisabled(ineligible);
            }
        }

        var vlink_form = {
            xtype       : "cp4_formpanel"
            ,id         : "rdisc_vlink_form"
            ,width      : 235
            ,height     : 173
            ,margin     : 0
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    var rec = Ext.getCmp("rdisc_vlink_grid").getSelectionModel().getLastSelected();
                    p.loadRecord(rec);
                    handle_preference_visibility(rec.data.ineligible);
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("rdisc_vlink_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("rdisc_vlink_save_btn");
                CP.ar_util.checkDisabledBtn("rdisc_vlink_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "rdisc_vlink_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var addr4       = Ext.getCmp("rdisc_addr4_entry").getValue();
                        var advertise   = Ext.getCmp("rdisc_advertise_entry").getValue();
                        var ineligible  = Ext.getCmp("rdisc_ineligible_entry").getValue();
                        var preference  = Ext.getCmp("rdisc_preference_entry").getRawValue();
                        var vlink_store = Ext.getStore("rdisc_vlink_store");
                        var rec = vlink_store.findRecord("addr4", addr4, 0, false, true, true);
                        rec.data["advertise"]   = advertise;
                        rec.data["ineligible"]  = ineligible;
                        rec.data["preference"]  = (ineligible == "true") ? "" : preference;
                        Ext.getCmp("rdisc_vlink_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("rdisc_vlink_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("rdisc_form");
                        var v = CP.ar_util.checkFormValid("rdisc_vlink_form");
                        return !(f && v);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("rdisc_vlink_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 205
                    ,margin : "15 0 15 15"
                    ,items  : [
                        {
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Address"
                            ,id         : "rdisc_addrmask4_entry"
                            ,name       : "addrmask4"
                            ,labelWidth : CP.rdisc.ADDR_LABELWIDTH
                            ,width      : 205
                            ,height     : 22
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "addr4_entry"
                            ,id         : "rdisc_addr4_entry"
                            ,name       : "addr4"
                            ,labelWidth : CP.rdisc.ADDR_LABELWIDTH
                            ,width      : 205
                            ,height     : 22
                            ,hidden     : true
                            ,hideLabel  : true
                        },{
                            xtype       : "cp4_checkbox"
                            ,fieldLabel : "Advertise"
                            ,id         : "rdisc_advertise_entry"
                            ,name       : "advertise"
                            ,labelWidth : CP.rdisc.ADDR_LABELWIDTH
                            ,width      : 205
                            ,height     : 22
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Eligibility"
                            ,id             : "rdisc_ineligible_entry"
                            ,name           : "ineligible"
                            ,labelWidth     : CP.rdisc.ADDR_LABELWIDTH
                            ,width          : 205
                            ,queryMode      : "local"
                            ,mode           : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [[""        ,"Eligible"]
                                                ,["true"    ,"Ineligible"]]
                            ,allowBlank     : false
                            ,listeners      : {
                                change          : function() {
                                    var ineligible_raw = Ext.getCmp("rdisc_ineligible_entry").getValue();
                                    handle_preference_visibility(ineligible_raw);
                                }
                            }
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Preference"
                            ,id                 : "rdisc_preference_entry"
                            ,name               : "preference"
                            ,labelWidth         : CP.rdisc.ADDR_LABELWIDTH
                            ,width              : 205
                            ,emptyText          : "0 "
                            ,allowDecimals      : false
                            ,minValue           : 0
                            ,maxValue           : 2147483647
                            ,maxLength          : 10
                            ,enforceMaxLength   : true
                            ,style              : "margin-bottom:0px;"
                        }
                    ]
                }
            ]
        };

        var rdisc_vlink_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "rdisc_vlink_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("rdisc_window").getPosition();
                    win.setPosition(235 + pos[0], 25 + pos[1]);
                }
            }
            ,items      : [ vlink_form ]
        });
        rdisc_vlink_window.show();
    }
}

