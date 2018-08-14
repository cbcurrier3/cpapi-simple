CP.ripng = {
    init                    : function() {
        CP.ripng.defineStores();
        var configPanel = CP.ripng.configPanel();
        var obj = {
            title           : "RIPng"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/ripng.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("ripng_window_intf");
                CP.ripng.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.ripng_mon && CP.ripng_mon.doLoad) {
                    CP.ripng_mon.doLoad();
                }                                                                                                                               
            }
            ,submitFailure  : function() {
                CP.ripng.doLoad();
            }
            ,checkCmpState  : CP.ripng.check_user_action
            ,helpFile       : "ripngHelp.html"
            ,cluster_feature_name: "ripng"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

    // AJAX Related
    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("ripng_configPanel");
        CP.ar_util.checkBtnsbar("ripng_btnsbar_intf");
        CP.ar_util.checkBtnsbar("ripng_form_intf");
    }
    ,get_prefix             : function() {
        return ("routed:instance:"+ CP.ar_util.INSTANCE() +":ripng");
    }
    ,get_ripng_reject_reason : function(rec) {
        
        /* 
         * This bitfield contains the various reasons for not targeting the 
         * interface for RIPng.  The decisions are made on a per-address 
         * basis (multiple addresses per interface).  We have to collate 
         * these rejections into a single explanation that can be displayed 
         * to the user.
         * 
         * See the "TARGET_REJECT..." macros in cprd/targets/target.h
         * for the meanings of each bit in this bitfield
         */
        var flags = rec.data.ripng_intf_reject_flags;
        
        /* Look for miscellaneous overriding reasons in order of precedence */
        if (flags & 0x1000) {
            return "The link-local broadcast address is wrong.";
        }
                      
        if (flags & 0x01 ) {
            return "The RIPng virtual address option is enabled, but this" +
                    + " interface has no IPv6 virtual address.";
        }

        if (flags & 0x02 ) {
            return "The RIPng 'virtual address' option is disabled and this" + 
                    " interface has no IPv6 physical address.";
        }
        
        if (flags & 0x020 ) {
            return "The interface is down.";
        }
                
        if (flags & 0x100 ) {
            return "This is a loopback interface.";
        }
        
        if (rec.data.ripng_intf_virtual) {
            return "No virtual link-local addresses are active for RIPng" + 
                    "  (normal if this is a backup cluster member).";
        }
        
        /* 
         * The default explanation for reasons other than the above.  
         */
        return "Not active (" + flags + "). To diagnose, go to Routing" + 
                " Options, enable logging for RIPng" +
                ", then check the log file.";                
    }

    // STORES
    ,defineStores           : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["ripng_grid_intf"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : ["intf", "addr4_list", "addr6_list"]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv6"
                    ,"excludeType"  : "6in4 6to4 pppoe vpnt gre loopback"
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

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ripng_st_intf"
            ,autoLoad   : false
            ,fields     : [
                "ripng_intf_intf"
                ,"ripng_intf_address"
                ,"ripng_intf_metricout"
                ,"ripng_intf_virtual"
                ,"ripng_intf_reject_flags"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/ripng.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.intf_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    st.clearFilter();
                    CP.ar_util.loadListPop("ripng_st_intf");
                }
            }
        });
    }

    ,configPanel            : function() {
        var Arr = [];

        Arr.push( CP.ar_one_liners.get_one_liner("ripng") );
        Arr.push( CP.ripng.get_global_set() );
        Arr.push( CP.ripng.get_intf_set() );

        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "ripng_configPanel"
            ,listeners  : {
                afterrender     : CP.ripng.doLoad
                ,validitychange : function() {
                    CP.ripng.check_user_action();
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("ripng_global_btnsbar");
            }
            ,items      : Arr
        });
        return configPanel;
    }

    ,doLoad                 : function() {
        CP.ar_util.clearParams();

        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }

        var stIds = ["intf_store", "ripng_st_intf"];
        var i;
        var st;
        for(i = 0; i < stIds.length; i++) {
            st = Ext.getStore(stIds[i]);
            CP.ar_util.loadListPush(stIds[i]);
            if (st) {
                st.load({params: {"instance": CP.ar_util.INSTANCE()}});
            }
        }
        var p = Ext.getCmp("ripng_configPanel");
        if (p) {
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/ripng.tcl?option=global&instance=" + CP.ar_util.INSTANCE()
                ,method     : "GET"
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,success    : function(p, action) {
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }
        CP.ar_util.loadListPop("mySubmit");
    }

    ,get_global_set         : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "RIPng Global Settings"
        });

        Arr.push({
            xtype   : "cp4_formpanel"
            ,id     : "ripng_global_updateinterval_set"
            ,margin : 0
            ,layout : "column"
            ,items  : [
                {
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Update Interval"
                    ,id                 : "ripng_global_updateinterval"
                    ,name               : "updateinterval"
                    ,labelWidth         : 110
                    ,width              : 300
                    ,minValue           : 1
                    ,maxValue           : 65535
                    ,maxLength          : 5
                    ,enforceMaxLength   : true
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,submitValue        : false
                    ,emptyText          : "Default: 30"
                    ,style              : "margin-right:10px;"
                    ,getFunctionalValue : function() {
                        var v = this.getRawValue();
                        if (v == "") {
                            return 30;
                        }
                        return parseInt(v, 10);
                    }
                    ,getDBValue         : function() {
                        var v = this.getRawValue();
                        if (v == "") {
                            return "";
                        }
                        v = parseInt(v, 10);
                        if (v < 1 || v > 65535) {
                            return "";
                        }
                        return String(v);
                    }
                    ,listeners          : {
                        change              : function() {
                            Ext.getCmp("ripng_global_expireinterval").validate();
                        }
                    }
                },{
                    xtype   : "cp4_label"
                    ,text   : "seconds"
                    ,style  : "margin-top:4px;"
                    ,width  : 100
                }
            ]
        });

        Arr.push({
            xtype   : "cp4_formpanel"
            ,id     : "ripng_global_expireinterval_set"
            ,margin : 0
            ,layout : "column"
            ,items  : [
                {
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Expire Interval"
                    ,id                 : "ripng_global_expireinterval"
                    ,name               : "expireinterval"
                    ,labelWidth         : 110
                    ,width              : 300
                    ,minValue           : 1
                    ,maxValue           : 65535
                    ,maxLength          : 5
                    ,enforceMaxLength   : true
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,submitValue        : false
                    ,emptyText          : "Default: 6 * Update Interval"
                    ,style              : "margin-right:10px;"
                    ,getFunctionalValue : function() {
                        var v = this.getRawValue();
                        if (v == "") {
                            v = Ext.getCmp("ripng_global_updateinterval").getFunctionalValue() * 6;
                            if (v > 65535) {
                                return 65535;
                            }
                            return v;
                        }
                        return parseInt(v, 10);
                    }
                    ,getDBValue         : function() {
                        var v = this.getRawValue();
                        if (v == "") {
                            return "";
                        }
                        v = parseInt(v, 10);
                        if (v < 1 || v > 65535) {
                            return "";
                        }
                        return String(v);
                    }
                    ,validator          : function(value) {
                        var u = Ext.getCmp("ripng_global_updateinterval").getFunctionalValue();
                        var e = this.getFunctionalValue();
                        if (e < u) {
                            return "Expire Interval must be greater than Update Interval.";
                        }
                        return true;
                    }
                },{
                    xtype   : "cp4_label"
                    ,text   : "seconds"
                    ,style  : "margin-top:4px;"
                    ,width  : 100
                }
            ]
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ripng_global_btnsbar"
            ,items  : [
                {
                    text                : "Apply"
                    ,id                 : "ripng_global_btn_save"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.ripng.get_prefix();
                        var ids =   ["updateinterval"
                                    ,"expireinterval"];
                        var i, c;
                        for(i = 0; i < ids.length; i++) {
                            c = Ext.getCmp("ripng_global_"+ ids[i]);
                            if (c) {
                                params[prefix +":"+ ids[i]] = c.getDBValue();
                            }
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        return !m;
                    }
                },{
                    text                : "Refresh"
                    ,id                 : "ripng_global_btn_reload"
                    ,overrideNoToken    : true
                    ,handler2           : function(b) {
                        CP.ripng.doLoad();
                    }
                }
            ]
        });

        return Arr;
    }

    ,get_intf_set           : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "RIPng Interfaces"
        });

        //btnbar
        Arr.push({
            xtype   : "cp4_btnsbar"
            ,id     : "ripng_btnsbar_intf"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "ripng_btn_intf_add"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var data = {
                            "ripng_intf_intf"       : ""
                            ,"ripng_intf_metricout" : ""
                        };
                        CP.ripng.open_rip_window_intf(data);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        var stCnt = (Ext.getStore("intf_store").getCount() > 0);
                        return !(m && stCnt);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ripng_btn_intf_edit"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var g = Ext.getCmp("ripng_grid_intf");
                        if (g && g.getSelCount) {
                            if (g.getSelCount() == 1) {
                                var r = g.getSelectionModel().getLastSelected();
                                CP.ripng.open_rip_window_intf(r.data);
                            } else {
                                g.getSelectionModel().deselectAll();
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        var g = Ext.getCmp("ripng_grid_intf");
                        var singleSel = ( (g &&g.getSelCount) ? g.getSelCount() == 1 : false);
                        return !(m && singleSel);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ripng_btn_intf_delete"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var i;
                        var g = Ext.getCmp("ripng_grid_intf");
                        CP.ar_util.clearParams();
                        if (g && b && b.deleteIntf) {
                            var recs = g.getSelectionModel().getSelection();
                            if (recs.length > 0) {
                                for(i = 0; i < recs.length; i++) {
                                    b.deleteIntf(recs[i].data.ripng_intf_intf);
                                }
                                CP.ar_util.mySubmit();
                            }
                        }
                    }
                    ,deleteIntf         : function(intf) {
                        var params = CP.ar_util.getParams();
                        var delete_prefix = "SPECIAL:"+ CP.ripng.get_prefix() + ":interface";
                        params[delete_prefix +":"+ String(intf)] = "";
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        var g = Ext.getCmp("ripng_grid_intf");
                        var anySel = ( (g &&g.getSelCount) ? g.getSelCount() != 0 : false);
                        return !(m && anySel);
                    }
                },{
                    text                : "Delete All"
                    ,id                 : "ripng_btn_intf_delete_all"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var i;
                        var st = Ext.getStore("ripng_st_intf");
                        var b2 = Ext.getCmp("ripng_btn_intf_delete");
                        CP.ar_util.clearParams();
                        if (st && b2 && b2.deleteIntf) {
                            var recs = st.getRange();
                            if (recs.length > 0) {
                                for(i = 0; i < recs.length; i++) {
                                    b2.deleteIntf(recs[i].data.ripng_intf_intf);
                                }
                                CP.ar_util.mySubmit();
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        var stCnt = (Ext.getStore("ripng_st_intf").getCount() > 0);
                        return !(m && stCnt);
                    }
                }
            ]
        });

        //grid: cm, selmodel, grid
        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "ripng_intf_intf"
                ,flex           : 5
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.intf_state.renderer_output(
                        value               //value
                        ,""                 //tip
                        ,"left"             //align
                        ,"black"            //color
                        ,value              //rawvalue
                        ,"ipv6"             //family
                        ,CP.ar_util.INSTANCE()  //INSTANCE
                    );
                }
            },{
                text            : "Address"
                ,dataIndex      : "ripng_intf_address"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    if (retValue == "") {
                        retValue = CP.ripng.get_ripng_reject_reason(rec);
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Metric"
                ,dataIndex      : "ripng_intf_metricout"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    if (retValue == "") {
                        retValue = "Default";
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Virtual Address"
                ,dataIndex      : "ripng_intf_virtual"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "Yes" : "No";
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ripng.check_user_action();
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "ripng_grid_intf"
            ,width              : 550
            ,height             : 181
            ,forceFit           : true
            ,store              : Ext.getStore("ripng_st_intf")
            ,selModel           : grid_selModel
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,margin             : 0
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("ripng_btn_intf_edit");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        Arr.push({
            xtype       : "cp4_formpanel"
            ,padding    : 0
            ,margin     : 0
            ,items      : [ grid ]
        });

        return Arr;
    }

    ,open_rip_window_intf   : function(DATA) {
        var TITLE = "Configure Interface";

        var Arr = [];

        Arr.push({
            xtype               : "cp4_combobox"
            ,fieldLabel         : "Interface"
            ,id                 : "ripng_intf_intf_entry"
            ,name               : "ripng_intf_intf"
            ,emptyText          : "Select One"
            ,value              : String(DATA.ripng_intf_intf)
            ,margin             : "15 0 5 15"
            ,queryMode          : "local"
            ,editable           : true
            ,forceSelection     : true
            ,triggerAction      : "all"
            ,store              : Ext.getStore("intf_store")
            ,valueField         : "intf"
            ,displayField       : "intf"
            ,allowBlank         : false
            ,listeners          : {
                change              : function(c, newValue, oldValue, eOpts) {
                    var st = Ext.getStore("ripng_st_intf");
                    var metric = Ext.getCmp("ripng_intf_metricout_entry");
                    var virtual = Ext.getCmp("ripng_intf_virtual_entry");
                    if (st) {
                        var r = st.findRecord("ripng_intf_intf", newValue, 0, false, true, true);
                        if (metric) {
                            metric.setValue(r ? r.data.ripng_intf_metricout : "");
                            if (metric.validate) {
                                metric.validate();
                            }
                        }
                        if (virtual) {
                            virtual.setValue(r ? r.data.ripng_intf_virtual : 0);
                        }
                    }
                }
            }
            ,getDBValue         : function() {
                var c = this;
                var i = "";
                if ( c.validate() ) {
                    i = c.getValue();
                }
                return i;
            }
        });

        Arr.push({
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "Metric"
            ,id                 : "ripng_intf_metricout_entry"
            ,name               : "ripng_intf_metricout"
            ,emptyText          : "Default: none"
            ,value              : String(DATA.ripng_intf_metricout)
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 16
            ,maxLength          : 2
            ,enforceMaxLength   : true
            ,getDBValue         : function() {
                var c = this;
                var i = Ext.getCmp("ripng_intf_intf_entry");
                var m = c.getRawValue();
                if (i && i.validate && i.validate()) {
                    m = parseInt(m, 10);
                    if (isNaN(m) || m < c.minValue || m > c.maxValue) {
                        m = "";
                    }
                } else {
                    m = "";
                }
                return String(m);
            }
        });

        Arr.push({
            xtype               : "cp4_checkbox"
            ,fieldLabel         : "Virtual Address"
            ,id                 : "ripng_intf_virtual_entry"
            ,name               : "ripng_intf_virtual"
            ,height             : 22
            ,value              : DATA.ripng_intf_virtual
            ,checked            : DATA.ripng_intf_virtual
            ,getDBValue         : function() {
                var c = this;
                var i = Ext.getCmp("ripng_intf_intf_entry").getRawValue();
                var v = (c.getValue() && i != "") ? "t" : "";
                return v;
            }
        });

        var window_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ripng_form_intf"
            ,width      : 340
            ,height     : 151
            ,autoScroll : false
            ,defaults   : {
                submitValue : false
                ,margin     : "0 0 5 15"
                ,labelWidth : 100
                ,width      : 300
            }
            ,items      : Arr
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.checkBtnsbar("ripng_form_intf");
                }
                ,validitychange : function() {
                    CP.ar_util.checkBtnsbar("ripng_form_intf");
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("ripng_btn_intf_save");
                CP.ar_util.checkDisabledBtn("ripng_btn_intf_cancel");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "ripng_btn_intf_save"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var params = CP.ar_util.clearParams();
                        var prefix = CP.ripng.get_prefix() +":interface";
                        var i = Ext.getCmp("ripng_intf_intf_entry").getDBValue();
                        var m = Ext.getCmp("ripng_intf_metricout_entry").getDBValue();
                        var v = Ext.getCmp("ripng_intf_virtual_entry").getDBValue();
                        params[prefix +":"+ i]                  = (i != "" ? "t" : "");
                        params[prefix +":"+ i +":metricout"]    = m;
                        params[prefix +":"+ i +":virtual"]      = v;
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        var f = CP.ar_util.checkFormValid("ripng_form_intf");
                        return !(m && f);
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("ripng_btn_intf_cancel").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "ripng_btn_intf_cancel"
                    ,text               : "Cancel"
                    ,disabled           : false
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("ripng_window_intf");
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("ripng_configPanel");
                        return !m;
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            var i;
                            var ids =   ["ripng_intf_intf_entry"
                                        ,"ripng_intf_metricout_entry"];
                            var c;
                            for (i = 0; i < ids.length; i++) {
                                c = Ext.getCmp(ids[i]);
                                if (c && c.validate) {
                                    c.validate();
                                }
                            }
                        }
                    }
                }
            ]
        };

        var window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ripng_window_intf"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ window_form ]
        });
        window.show();
    }
}

