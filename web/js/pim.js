CP.pim_4 = {
    LAST_SAVE_BUTTON            : ""

//  user control, prevent user actions when they don't have the config token or during loads/saves
    ,check_user_action          : function() {
        //buttons and button bars to test the disable state of
        CP.ar_util.checkBtnsbar("pim_global_btnsbar");
        CP.ar_util.checkBtnsbar("pim_intf_btnsbar");
        CP.ar_util.checkDisabledBtn("advanced_set_btn");
        CP.ar_util.checkDisabledBtn("view_advanced_set_btn");
        CP.ar_util.checkDisabledBtn("bootstrap_btn");
        CP.ar_util.checkDisabledBtn("view_bootstrap_btn");

        CP.ar_util.checkBtnsbar("bootstrap_crp_srp_form");
        CP.ar_util.checkBtnsbar("pim_srp_grp_btnsbar");
    }

//  INIT                        ////////////////////////////////////////////////
    ,init                       : function() {
        CP.pim_4.defineStores();
        CP.ar_util.loadListPush("mySubmit");
        var configPanel = CP.pim_4.configPanel();
        var obj = {
            title           : "PIM"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/pim.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("bootstrap_window");
                CP.ar_util.checkWindowClose("adv_options_window");
                CP.pim_4.doLoad();                
                
                // Refresh the monitor tab with the new data
                if (CP && CP.pim_monitor_4 && CP.pim_monitor_4.doLoad) {
                    CP.pim_monitor_4.doLoad();
                }                                                                               
            }
            ,submitFailure  : function() {
                CP.pim_4.doLoad();
            }
            ,checkCmpState  : CP.pim_4.check_user_action
            ,helpFile       : "pimHelp.html"
            ,cluster_feature_name: "pim"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//AJAX FUNCTIONS
    ,mySubmit               : function() {
        if( !( CP.ar_util.checkBlockActivity() ) ) {
            CP.pim_4.apply_global_params();
            CP.ar_util.mySubmit();
        }
    }
    ,get_prefix             : function() {
        return "routed:instance:"+ CP.ar_util.INSTANCE() +":pim:instance:0:af:2";
    }
    ,getMaskLength          : function(cmpString) {
        var cmp = Ext.getCmp(cmpString);
        if(cmp) {
            if(cmp.getMaskLength) {
                return cmp.getMaskLength();
            }
            return cmp.getValue();
        }
        return "";
    }
//defineStores
    ,defineStores               : function() {
        if( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["pim_intf_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }

        function sortType_intf(value) {
            if(String(value).toLowerCase().substring("lo") == 0) {
                return "zzz"+ String(value);
            }
            return value;
        }

        function sortType_ipv4addr(v) {
            var value = String(v);
            var i;
            if(value.indexOf(".") == -1) {
                return parseInt(value, 10);
            }
            var o = value.split(".");
            var retValue = parseInt(o[0], 10);
            for(i = 1; i < o.length; i++) {
                retValue *= 256;
                retValue += parseInt(o[i], 10);
            }
            return retValue;
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : sortType_intf
                }
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
            ,sorters    : [{
                property    : "intf"
                ,direction  : "ASC"
            }]
            ,listeners  : {
                load        : function(st) {
                    st.clearFilter();
                    var r;
                    while (st.findExact("intf", "pimreg0") != -1) {
                        r = st.findRecord("intf", "pimreg0");
                        if (r) { st.remove(r); }
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //pim.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "if"
                    ,sortType   : sortType_intf
                },{
                    name        : "prio"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                },{
                    name        : "virtual"
                    ,sortType   : function(value) {
                        if(value == "") {
                            return 1;
                        }
                        return 0;
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/pim.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "intf"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.pim_if_params"
                }
            }
            ,sorters    : [{
                property    : "if"
                ,direction  : "ASC"
            }]
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_srp_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "rp"
                    ,sortType   : sortType_ipv4addr
                },{
                    name        : "grp"
                    ,sortType   : function(value) {
                        var i;
                        if(value.length == 0) {
                            return 0;
                        }
                        var minAddrVal = sortType_ipv4addr(value[0].net);
                        for(i = 1; i < value.length; i++) {
                            minAddrVal = Math.min(minAddrVal, sortType_ipv4addr(value[i].net));
                        }
                        return minAddrVal;
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/pim.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "srp"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.pim_srp_mapping"
                }
            }
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_crp_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "net"
                    ,sortType   : sortType_ipv4addr
                },{
                    name        : "mask"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/pim.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "crp"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.pim_crp_params"
                }
            }
            ,listeners  : {
                load        : function(st) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pim_grp_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "net"
                    ,sortType   : sortType_ipv4addr
                },{
                    name        : "mask"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                }
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,sorters    : [
                {
                    property    : "net"
                    ,direction  : "ASC"
                },{
                    property    : "mask"
                    ,direction  : "ASC"
                }
            ]
        });
    }

//configPanel
    ,configPanel                : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "pim_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.pim_4.doLoad();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("pim"),
                CP.pim_4.global_set()
                ,CP.pim_4.interface_set()
                ,CP.pim_4.advanced_set()
                ,CP.pim_4.bootstrap_set()
            ]
        });
        return configPanel;
    }
    
    ,updateSparseModeSettingsVisibility : function() {     
        var sparse_mode_adv_settings = Ext.getCmp("sparse_mode_adv_settings");
        if(sparse_mode_adv_settings) {
            var ids = ["regsuppr-intvl", "crpadv-intvl"];
            
            var pim_dm = false;
            if (Ext.getCmp("pim-mode").getValue() == "dense") {
                pim_dm = true;
            }
            
            sparse_mode_adv_settings.setDisabled(pim_dm === true); 
            sparse_mode_adv_settings.setVisible(pim_dm === false);
            
            var d_val = sparse_mode_adv_settings.READONLY || CP.ar_util.checkBlockActivity(true);
            if (d_val) {
                var i;
                for (i = 0; i < ids.length; i++) {
                    var c = Ext.getCmp(ids[i]);
                    if (c) { c.setDisabled(true); }
                }
            }
        }        
    }
    
    ,updateStateRefreshSettingsVisiblity : function() {
        var state_refresh_adv_settings = Ext.getCmp("state_refresh_adv_settings");
        if(state_refresh_adv_settings) {
            var ids = ["state-refresh-interval", "state-refresh-ttl"];
            
            var sr_visible = false;
            if (Ext.getCmp("pim-mode").getValue() == "dense") {
                 if (Ext.getCmp("pim-state-refresh").getValue()) {
                     sr_visible = true;
                 }
            }

            state_refresh_adv_settings.setVisible(sr_visible);
            
            var sr_disabled = false;
            if (CP.ar_util.checkBlockActivity(true) ||
                    sr_visible === false) {
                sr_disabled = true;
            }

            for (i = 0; i < ids.length; i++) {
                var c = Ext.getCmp(ids[i]);
                if (c) { 
                    c.setDisabled(sr_disabled); 
                }
            }
        }        
    }

//doLoad
    ,doLoad                     : function() {
        function setOriginalValue(cmpId, value) {
            var field = Ext.getCmp(cmpId);
            if(field) {
                field.setValue(value);
                field.originalValue = field.getValue();
            }
        }

        if(CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }

        CP.ar_util.loadListPush("intf_store");
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});

        var p = Ext.getCmp("pim_configPanel");
        if(p) {
            var success_func = function(p, action) {
                if (action && action.result && action.result.data) {
                    var gData = action.result.data;
                    if(!gData) { return; }
                    setOriginalValue("pim-state-mode", gData["pim-state-mode"]);
                    setOriginalValue("pim-nat-mode", gData["pim-nat-mode"]);
                    setOriginalValue("pim-mode", gData["pim-mode"]);
                    Ext.getCmp("pim-mode").fireEvent("change");
                    
                    CP.pim_4.updateSparseModeSettingsVisibility();
                    CP.pim_4.updateStateRefreshSettingsVisiblity();
                }
            };
            CP.pim_4.do_pim_global_load(p, success_func, null);
        }

        var LSB = String(CP.pim_4.LAST_SAVE_BUTTON).split("_");
        if(LSB.length > 0) {
            switch(LSB[0]) {
                case "global":
                    break;
                default:
                    CP.ar_util.loadListPush("pim_intf_store");
                    Ext.getStore("pim_intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
            }
        } else {
            CP.ar_util.loadListPush("pim_intf_store");
            Ext.getStore("pim_intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        }

        CP.ar_util.clearParams();
        CP.pim_4.LAST_SAVE_BUTTON = "";
        CP.ar_util.loadListPop("mySubmit");
    }

    ,do_pim_global_load         : function(p, success_func, failure_func) {
        //multiple areas use this tcl
        if(!p)              { return; }
        if(!success_func)   { success_func = function() {}; }
        if(!failure_func)   { failure_func = function() {}; }
        CP.ar_util.loadListPush("doLoad");
        p.load({
            url         : "/cgi-bin/pim.tcl?option=global&instance="+ CP.ar_util.INSTANCE()
            ,method     : "GET"
            ,success    : function(p, action) {
                success_func(p, action);
                CP.ar_util.loadListPop("doLoad");
            }
            ,failure    : function(p) {
                failure_func(p);
                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

//global_set
    ,global_set                 : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "PIM Global Settings"
            },{
                xtype       : "cp4_formpanel"
                ,id         : "pim_global_formpanel"
                ,height     : 54
                ,items      : [
                    {
                        xtype           : "cp4_combobox"
                        ,fieldLabel     : "PIM Protocol"
                        ,id             : "pim-mode"
                        ,name           : "pim-mode-name"
                        ,labelWidth     : 100
                        ,width          : 300
                        ,submitValue    : false
                        ,queryMode      : "local"
                        ,editable       : true
                        ,forceSelection : true
                        ,triggerAction  : "all"
                        ,value          : "sparse"
                        ,store          :   [["sparse"  ,"Sparse Mode (SM)"]
                                            ,["dense"   ,"Dense Mode (DM)"]
                                            ,["ssm"     ,"Source-Specific Multicast (SSM)"]]
                        ,listeners      : {
                            change          : function(field, newVal, oldVal, eOpts) {
                                var v = Ext.getCmp("pim-mode").getValue();
                                var refresh_cb = Ext.getCmp("pim-state-refresh");
                                if(refresh_cb) {
                                    refresh_cb.setVisible(  v == "dense" );
                                    refresh_cb.setDisabled( v != "dense" );
                                    if(v != "dense") {
                                        refresh_cb.setValue(    refresh_cb.originalValue );
                                    }
                                }
                                var bootstrap_base_set = Ext.getCmp("bootstrap_base_set");
                                if(bootstrap_base_set) {
                                    bootstrap_base_set.setDisabled(v == "dense");
                                    bootstrap_base_set.setVisible(v != "dense");
                                }
                            }
                        }
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "State Refresh"
                        ,id             : "pim-state-refresh"
                        ,labelWidth     : 100
                        ,width          : 300
                        ,height         : 22
                        ,listeners      : {
                            beforerender    : function(field, eOpts) {
                                field.setVisible(false);
                                field.setDisabled(true);
                            }
                        }
                    }
                ]
            },{
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "NAT"
                ,id             : "pim-nat-mode"
                ,labelWidth     : 100
                ,width          : 300
                ,height         : 22
                ,hidden         : true
                ,hideLabel      : true
            },{
                xtype           : "cp4_btnsbar"
                ,id             : "pim_global_btnsbar"
                ,items          : [
                    {
                        text                : "Apply"
                        ,id                 : "pim_apply_global_settings_btn"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            var interface_st = Ext.getStore("pim_intf_store");
                            var pim_mode_cmp = Ext.getCmp("pim-mode");
                            if (pim_mode_cmp && pim_mode_cmp.originalValue != pim_mode_cmp.getValue()) {
                                if (interface_st && interface_st.getCount && (interface_st.getCount() > 0)) {
                                    Ext.Msg.show({
                                        title   : "Warning"
                                        ,msg    : "PIM is running with " + pim_mode_cmp.originalValue + " mode."
                                                + "<br />Please disable PIM on all interfaces before switching mode."
                                        ,animEl : "elId"
                                        ,buttons: Ext.Msg.OK
                                    });
                                    return;
                                }
                            }

                            CP.pim_4.LAST_SAVE_BUTTON = "global";
                            CP.pim_4.mySubmit();
                        }
                        ,disabledConditions : function() {
                            var f = CP.ar_util.checkFormValid("pim_global_formpanel");
                            return !(f);
                        }
                    }
                ]
            }
        ];
    }

    ,apply_global_params        : function() {
        var params  = CP.ar_util.getParams();
        var prefix  = CP.pim_4.get_prefix();
        var mode            = Ext.getCmp("pim-mode").getValue();
        var state_refresh   = Ext.getCmp("pim-state-refresh").getValue() ? "t" : "";
        params[prefix +":mode"]             = mode;
        params[prefix +":state-refresh"]    = state_refresh;
        return true;
    }

//interface_set
    ,interface_set              : function() {
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pim_intf_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "pim_intf_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var pim_intf_st = Ext.getStore("pim_intf_store");
                        if (pim_intf_st && pim_intf_st.getCount
                            && pim_intf_st.getCount() >= 31) {
                            Ext.Msg.alert("Too Many Interfaces",
                                          "PIM cannot be configured on more"
                                          + " than 31 interfaces.");
                        }
                        else {
                            CP.pim_4.open_intf_window(null);
                        }
                    }
                    ,disabledConditions : function() {
                        var intf_st = Ext.getStore("intf_store");
                        return ( (intf_st && intf_st.getCount) ? intf_st.getCount() < 1 : true);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "pim_intf_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        //edit_intf_func
                        var sm = Ext.getCmp("pim_intf_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        CP.pim_4.open_intf_window(rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pim_intf_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "pim_intf_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("pim_intf_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        CP.ar_util.clearParams();
                        var i;
                        var delCnt = 0;
                        for(i = 0; i < recs.length; i++) {
                            delete_intf_func(recs[i]);
                            delCnt++;
                        }
                        if (delCnt > 0) {
                            CP.pim_4.LAST_SAVE_BUTTON = "interface_delete";
                            CP.pim_4.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pim_intf_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                },{
                    text                : "Delete All"
                    ,id                 : "pim_interface_btn_delete_all"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        Ext.Msg.show({
                            title   : "Warning"
                            ,msg    : "Are you sure want to delete all of the PIM interfaces?"
                                    + "<br />Press OK to continue."
                            ,animEl : "elId"
                            ,buttons: Ext.Msg.OKCANCEL
                            ,fn     : function(btn, text) {
                                if (btn == "cancel") {
                                    return;
                                }
                                CP.ar_util.clearParams();
                                var intf_st = Ext.getStore("pim_intf_store");
                                if (intf_st) {
                                    var recs = intf_st.getRange();
                                    if (recs && recs.length > 0) {
                                        var i;
                                        for(i = 0; i < recs.length; i++) {
                                            delete_intf_func(recs[i]);
                                        }
                                        CP.pim_4.LAST_SAVE_BUTTON = "interface_delete";
                                        CP.pim_4.mySubmit();
                                    }
                                }
                            }
                        });
                    }
                    ,disabledConditions : function() {
                        var interface_st = Ext.getStore("pim_intf_store");
                        return ( (interface_st && interface_st.getCount) ? interface_st.getCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_intf_func(rec) {
            var params  = CP.ar_util.getParams();

            var intf    = rec.data["if"];

            if(intf == "") {
                return;
            }

            var prefix  = CP.pim_4.get_prefix() + ":interface:"+ intf;

            params[prefix]                  = "";
            params[prefix +":drpriority"]   = "";
            params[prefix +":virtual"]      = "";
            Ext.getStore("pim_intf_store").remove(rec);
        }

        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "if"
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
                text            : "Use Virtual Address"
                ,dataIndex      : "virtual"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = value ? "Yes" : "No";
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "DR Priority"
                ,dataIndex      : "prio"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("pim_intf_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_intf_grid"
            ,width              : 600
            ,height             : 149
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("pim_intf_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("pim_intf_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "PIM Interfaces"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,autoScroll : true
                ,items      : [ grid ]
            },{
                xtype   : "cp4_inlinemsg"
                ,type   : "info"
                ,text   : CP.pim_4.INTF_LIMIT_INFO
                ,margin : "13 0 0 0"
                ,width  : 400
            }
        ];
    }

    ,open_intf_window           : function(REC) {
        var intf_cmp;
        var TITLE = "";
        if(REC == null) {
            intf_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "intf_entry"
                ,name           : "intf_entry_name"
                ,labelWidth     : 150
                ,width          : 300
                ,queryMode      : "local"
                ,lastQuery      : ""
                ,editable       : true
                ,forceSelection : true
                ,triggerAction  : "all"
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
                        var d = {
                            "prio"      : ""
                            ,"virtual"  : ""
                        };
                        var pim_intf_st = Ext.getStore("pim_intf_store");
                        if (pim_intf_st) {
                            idx = pim_intf_st.findExact("if", newValue, 0);
                            if (idx > -1) {
                                rec = pim_intf_st.findRecord("if", newValue);
                                if (rec && Ext.typeOf(rec.data) == "object") {
                                    d.prio = String(rec.data.prio);
                                    d.virtual = String(rec.data.virtual);
                                }
                            }
                            checkSetValue("virtual_entry",   d.virtual);
                            checkSetValue("prio_entry",      d.prio);
                        }
                    }
                }
            };
            TITLE = "Add Interface";
        } else {
            intf_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "intf_entry"
                ,name           : "if"
                ,labelWidth     : 150
                ,width          : 300
                ,height         : 22
            };
            TITLE = "Edit Interface - "+ REC.data["if"];
        }

        var pim_intf_form = {
            xtype       : "cp4_formpanel"
            ,id         : "pim_intf_form"
            ,width      : 330
            ,height     : 151
            ,margin     : 0
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("pim_intf_save_btn");
                CP.ar_util.checkDisabledBtn("pim_intf_cancel_btn");
            }
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();

                    if(Ext.getCmp("intf_entry").getXType() == "cp4_displayfield") {
                        var rec = Ext.getCmp("pim_intf_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                    }

                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("pim_intf_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "pim_intf_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_intf();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("pim_intf_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("pim_intf_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "pim_intf_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        Ext.getCmp("pim_intf_window").close();
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            var ids = ["intf_entry", "prio_entry"];
                            var i, c;
                            for(i = 0; i < ids.length; i++) {
                                c = Ext.getCmp(ids[i]);
                                if (c && c.validate) { c.validate(); }
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 8 15"
                    ,width      : 300
                    ,autoScroll : false
                    ,items      : [
                        intf_cmp
                        ,{
                            xtype               : "cp4_checkbox"
                            ,fieldLabel         : "Use Virtual Address"
                            ,id                 : "virtual_entry"
                            ,name               : "virtual"
                            ,labelWidth         : 150
                            ,width              : 300
                            ,height             : 22
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "DR Priority"
                            ,id                 : "prio_entry"
                            ,name               : "prio"
                            ,labelWidth         : 150
                            ,width              : 260
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,value              : ""
                            ,minValue           : 0
                            ,maxValue           : 4294967295
                            ,emptyText          : "0-4294967295"
                            ,maxLength          : 10
                            ,enforceMaxLength   : true
                        }
                    ]
                }
            ]
        };

        var pim_intf_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "pim_intf_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ pim_intf_form ]
        });
        pim_intf_window.show();

        function save_intf() {
            var panel   = Ext.getCmp("pim_intf_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }

            var params  = CP.ar_util.getParams();

            var intf    = Ext.getCmp("intf_entry").getValue();
            var virtual = Ext.getCmp("virtual_entry").getValue() ? "t" : "";
            var prio_cmp= Ext.getCmp("prio_entry");
            var prio    = "";
            if(prio_cmp) {
                prio    = prio_cmp.getRawValue();
                if(prio != "") {
                    prio = parseInt(prio, 10);
                    if(prio < prio_cmp.minValue) {
                        prio = prio_cmp.minValue;
                    } else if(prio > prio_cmp.maxValue) {
                        prio = prio_cmp.maxValue;
                    }
                }
            }

            if(intf == "") {
                return;
            }

            var prefix  = CP.pim_4.get_prefix() + ":interface:"+ intf;

            params[prefix]                  = "t";
            params[prefix +":drpriority"]   = prio;
            params[prefix +":virtual"]      = virtual;

            CP.pim_4.LAST_SAVE_BUTTON = "interface_save";
            CP.pim_4.mySubmit();
            Ext.getCmp("pim_intf_window").close();
        }
    }

//bootstrap_set
    ,bootstrap_set              : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "bootstrap_base_set"
            ,margin     : 0
            ,autoScroll : false
            ,hidden     : true
            ,disabled   : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Bootstrap and Rendezvous Point Settings"
                },{
                    xtype               : "cp4_button"
                    ,text               : "Edit Settings"
                    ,id                 : "bootstrap_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.pim_4.open_bootstrap_window(false);
                    }
                    ,handle_no_token    : function() {
                        var b = this;
                        var d = CP.ar_util.checkBlockActivity(false);
                        var v = CP.ar_util.checkBlockActivity(true);
                        if (b && b.setVisible) { b.setVisible(!v); }
                        if (b && b.disabled != d) { b.setDisabled(d); }
                        return !d;
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "View Settings"
                    ,id                 : "view_bootstrap_btn"
                    ,overrideNoToken    : false
                    ,hidden             : true
                    ,handler            : function(b) {
                        if (b && b.handle_no_token() ) {
                            CP.pim_4.open_bootstrap_window(true);
                        }
                    }
                    ,handle_no_token    : function() {
                        var b = this;
                        var v = CP.ar_util.checkBlockActivity(true);
                        if (b && b.setVisible) { b.setVisible(v); }
                        if (b && b.disabled && b.enable) { b.enable(); }
                        return true;
                    }
                    ,disable            : function() { }
                    ,setDisabled        : function(d) {
                        var b = this;
                        if (b.disabled && b.enable) {
                            b.enable();
                        }
                    }
                }
            ]
        };
    }

    ,open_bootstrap_window      : function(READONLY) {
        var bootstrap_form = {
            xtype       : "cp4_formpanel"
            ,width      : 300
            ,margin     : 0
            ,autoScroll : false
            ,defaults   : {
                disabled    : READONLY
            }
            ,items      : [
                {
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "Enable Bootstrap Router"
                    ,id             : "bootstrap-enabled"
                    ,name           : "bootstrap-enabled"
                    ,labelWidth     : 125
                    ,width          : 260
                    ,height         : 22
                },{
                    xtype           : "cp4_ipv4field"
                    ,fieldLabel     : "Local Address"
                    ,id             : "bootstrap-lcladdr"
                    ,name           : "bootstrap-lcladdr"
                    ,labelWidth     : 125
                    ,width          : 260
                    ,allowBlank     : true
                    ,fieldConfig    : {
                        allowBlank      : true
                    }
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Priority"
                    ,id                 : "bootstrap-priority"
                    ,name               : "bootstrap-priority"
                    ,labelWidth         : 125
                    ,width              : 225
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 255
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,emptyText          : "Default: 0"
                }
            ]
        };

        var crp_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pim_crp_btnsbar"
            ,hidden : READONLY
            ,items  : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Add"
                    ,id                 : "crp_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.pim_4.add_crp_group();
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "crp_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var i;
                        var sm = Ext.getCmp("pim_crp_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        for(i = 0; i < recs.length; i++) {
                            delete_crp_network(recs[i]);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pim_crp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_crp_network(rec) {
            var params      = CP.ar_util.getParams();
            var prefix      = CP.pim_4.get_prefix() +":candidaterp";
            var net         = rec.data.net;
            var n_prefix    = prefix +":network:"+ net;
            var m_prefix    = n_prefix +":masklen:"+ rec.data.mask;
            params[m_prefix]    = "";
            var st = Ext.getStore("pim_crp_store");
            st.remove(rec);
            if(st.findExact("net", net) == -1) {
                params[n_prefix]    = "";
            }
        }

        var crp_cm = [
            {
                text            : "Multicast Group"
                ,dataIndex      : "net"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.net) +"/"+ String(rec.data.mask);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var crp_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("pim_crp_btnsbar");
                }
            }
        });

        var crp_grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_crp_grid"
            ,width              : 150
            ,height             : 110
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : "pim_crp_store"
            ,columns            : crp_cm
            ,selModel           : crp_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var candidate_rp_form = {
            xtype       : "cp4_formpanel"
            ,width      : 300
            ,margin     : 0
            ,autoScroll : false
            ,items      : [
                {
                    xtype           : "cp4_sectiontitle"
                    ,titleText      : "Candidate Rendezvous Point"
                },{
                    xtype           : "cp4_checkbox"
                    ,fieldLabel     : "Enable Candidate RP"
                    ,id             : "crp-enabled"
                    ,name           : "crp-enabled"
                    ,labelWidth     : 125
                    ,width          : 260
                    ,height         : 22
                    ,disabled       : READONLY
                },{
                    xtype           : "cp4_ipv4field"
                    ,fieldLabel     : "Local Address"
                    ,id             : "crp-lcladdr"
                    ,name           : "crp-lcladdr"
                    ,labelWidth     : 125
                    ,width          : 260
                    ,allowBlank     : true
                    ,fieldConfig    : {
                        allowBlank      : true
                    }
                    ,disabled       : READONLY
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Priority"
                    ,id                 : "crp-priority"
                    ,name               : "crp-priority"
                    ,labelWidth         : 125
                    ,width              : 225
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 255
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,emptyText          : "Default: 0"
                    ,disabled           : READONLY
                }
                ,crp_btnsbar
                ,crp_grid
            ]
        };

        var srp_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pim_srp_btnsbar"
            ,hidden : READONLY
            ,items  : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Add"
                    ,id                 : "srp_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("pim_srp_grid").getSelectionModel().deselectAll();
                        CP.pim_4.open_srp_window(null);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Edit"
                    ,id                 : "srp_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function (b) {
                        var sm  = Ext.getCmp("pim_srp_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        CP.pim_4.open_srp_window(rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pim_srp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "srp_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var i;
                        var sm  = Ext.getCmp("pim_srp_grid").getSelectionModel();
                        if(sm.getCount() > 0) {
                            var recs = sm.getSelection();
                            for(i = 0; i < recs.length; i++) {
                                delete_srp_record(recs[i]);
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pim_srp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_srp_record(rec) {
            var params      = CP.ar_util.getParams();
            var prefix      = CP.pim_4.get_prefix() +":staticrp";
            var rp_prefix   = prefix +":rpaddr:"+ rec.data.rp;
            var n_prefix, m_prefix;
            var i, g;

            params[rp_prefix]   = "";
            for(i = 0; i < rec.data.grp.length; i++) {
                g = rec.data.grp[i];
                n_prefix = rp_prefix +":network:"+ g.net;
                m_prefix = n_prefix +":masklen:"+ g.mask;
                params[n_prefix]    = "";
                params[m_prefix]    = "";
            }
            Ext.getStore("pim_srp_store").remove(rec);
        }

        var srp_cm = [
            {
                text            : "Rendezvous Point"
                ,dataIndex      : "rp"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Multicast Groups"
                ,dataIndex      : "grp"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var i;
                    if(value.length > 0) {
                        retValue = value[0].net +"/"+ String(value[0].mask);
                        for(i = 1; i < value.length; i++) {
                            retValue += ",<br>"+ value[i].net +"/"+ String(value[i].mask);
                        }
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var srp_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("pim_srp_btnsbar");
                }
            }
        });

        var srp_grid = {
            xtype               : "cp4_grid"
            ,id                 : "pim_srp_grid"
            ,width              : 300
            ,height             : 164
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : "pim_srp_store"
            ,columns            : srp_cm
            ,selModel           : srp_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("srp_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        var static_rp_form = {
            xtype       : "cp4_formpanel"
            ,width      : 300
            ,margin     : 0
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Static Rendezvous Point"
                },{
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : "Enable Static RP"
                    ,id         : "staticrp-enabled"
                    ,name       : "staticrp-enabled"
                    ,labelWidth : 125
                    ,width      : 260
                    ,height     : 22
                    ,disabled   : READONLY
                }
                ,srp_btnsbar
                ,srp_grid
            ]
        };

        var bootstrap_crp_srp_form = {
            xtype       : "cp4_formpanel"
            ,id         : "bootstrap_crp_srp_form"
            ,width      : 645
            ,height     : 425
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    CP.ar_util.clearParams();
                    p.form._boundItems = null;
                    CP.ar_util.loadListPush("bootstrap_crp_srp_form");
                    p.load({
                        url         : "/cgi-bin/pim.tcl?option=global&instance=" + CP.ar_util.INSTANCE()
                        ,method     : "GET"
                        ,success    : function(p, action) {
                            if (action) {
                                var gData = action.result.data;
                                Ext.getCmp("bootstrap-lcladdr").setValue(gData["bootstrap-lcladdr"] || "");
                                Ext.getCmp("crp-lcladdr").setValue(gData["crp-lcladdr"] || "");
                            }
                            CP.ar_util.loadListPop("bootstrap_crp_srp_form");
                            if (p && p.chkBtns) { p.chkBtns(); }
                        }
                        ,failure    : function(p) {
                            CP.ar_util.loadListPop("bootstrap_crp_srp_form");
                            if (p && p.chkBtns) { p.chkBtns(); }
                        }
                    });
                    var srp_st = Ext.getStore("pim_srp_store");
                    var crp_st = Ext.getStore("pim_crp_store");
                    CP.ar_util.loadListPush("pim_srp_store");
                    if(srp_st) { srp_st.load({params: {"instance": CP.ar_util.INSTANCE()}}); }
                    CP.ar_util.loadListPush("pim_crp_store");
                    if(crp_st) { crp_st.load({params: {"instance": CP.ar_util.INSTANCE()}}); }
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("bootstrap_crp_srp_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("bootstrap_save_btn");
                CP.ar_util.checkDisabledBtn("bootstrap_cancel_btn");
                CP.ar_util.checkBtnsbar("pim_crp_btnsbar");
                CP.ar_util.checkBtnsbar("pim_srp_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "bootstrap_save_btn"
                    ,disabled           : true
                    ,hidden             : READONLY
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_bootstrap();
                    }
                    ,disabledConditions : function() {
                        var b = this;
                        var f = CP.ar_util.checkFormValid("bootstrap_crp_srp_form");
                        var no_token = CP.ar_util.checkBlockActivity(true);
                        if (b) { b.setVisible(!no_token); }
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function() {
                            Ext.getCmp("bootstrap_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "bootstrap_cancel_btn"
                    ,disabled           : true
                    ,READONLY           : READONLY
                    ,overrideNoToken    : false
                    ,handle_no_token    : function() {
                        var b = this;
                        var RO = b.READONLY; //never disable when in READONLY mode
                        var d = (RO) ? false : CP.ar_util.checkBlockActivity();
                        if (b && b.disabled != d) { b.setDisabled(d); }
                        return !d;
                    }
                    ,handler            : function(b, e) {
                        if ( b.handle_no_token() ) {
                            Ext.getCmp("bootstrap_window").close();
                            CP.ar_util.clearParams();
                        }
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            if(Ext.getCmp("bootstrap-lcladdr").validate) {
                                Ext.getCmp("bootstrap-lcladdr").validate();
                            }
                            if(Ext.getCmp("crp-lcladdr").validate) {
                                Ext.getCmp("crp-lcladdr").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 615
                    ,margin     : "15 0 15 15"
                    ,autoScroll : false
                    ,items      : [
                        bootstrap_form
                        ,{
                            xtype       : "cp4_formpanel"
                            ,width      : 615
                            ,margin     : 0
                            ,autoScroll : false
                            ,layout     : "column"
                            ,items      : [
                                candidate_rp_form
                                ,{xtype: "tbspacer", height: 15, width: 15}
                                ,static_rp_form
                            ]
                        }
                    ]
                }
            ]
        };

        var bootstrap_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "bootstrap_window"
            ,title      : "Bootstrap and Rendezvous Point Settings"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ bootstrap_crp_srp_form ]
        });
        bootstrap_window.show();

        function save_bootstrap() {
            var panel   = Ext.getCmp("bootstrap_crp_srp_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }
            var params  = CP.ar_util.getParams();
            var prefix  = CP.pim_4.get_prefix();

            var enable_bootstrap    = Ext.getCmp("bootstrap-enabled").getValue() ? "t" : "";
            var bootstrap_lcladdr   = Ext.getCmp("bootstrap-lcladdr").getValue();
            var bootstrap_lclpref   = Ext.getCmp("bootstrap-priority").getRawValue();
            params[prefix +":bootstrap"]            = enable_bootstrap;
            params[prefix +":bootstrap:lcladdr"]    = bootstrap_lcladdr;
            params[prefix +":bootstrap:priority"]   = bootstrap_lclpref;

            var enable_crp  = Ext.getCmp("crp-enabled").getValue() ? "t" : "";
            var crp_lcladdr = Ext.getCmp("crp-lcladdr").getValue();
            var crp_lclpref = Ext.getCmp("crp-priority").getRawValue();
            params[prefix +":candidaterp"]          = enable_crp;
            params[prefix +":candidaterp:lcladdr"]  = crp_lcladdr;
            params[prefix +":candidaterp:priority"] = crp_lclpref;
            var c_recs = Ext.getStore("pim_crp_store").getRange();
            var d, i, j;
            var n_prefix, m_prefix;
            for(i = 0; i < c_recs.length; i++) {
                d = c_recs[i].data;
                n_prefix = prefix +":candidaterp:network:"+ d.net;
                m_prefix = n_prefix +":masklen:"+ d.mask;
                params[n_prefix]    = "t";
                params[m_prefix]    = "t";
            }

            var enable_srp  = Ext.getCmp("staticrp-enabled").getValue() ? "t" : "";
            params[prefix +":staticrp"] = enable_srp;
            var s_recs = Ext.getStore("pim_srp_store").getRange();
            var g_list;
            for(i = 0; i < s_recs.length; i++) {
                d = s_recs[i].data;
                g_list = d.grp;
                params[prefix +":staticrp:rpaddr:"+ d.rp]   = "t";
                for(j = 0; j < g_list.length; j++) {
                    n_prefix = prefix +":staticrp:rpaddr:"+ d.rp +":network:"+ g_list[j].net;
                    m_prefix = n_prefix +":masklen:"+ g_list[j].mask;
                    params[n_prefix]    = "t";
                    params[m_prefix]    = "t";
                }
            }

            CP.pim_4.LAST_SAVE_BUTTON = "bootstrap_save";
            CP.pim_4.mySubmit();
        }
    }

    ,add_crp_group              : function() {
        var c = Ext.getCmp("crp_notation");
        if(c) { c.destroy(); }

        var crp_network = {
            xtype           : "cp4_ipv4notation"
            ,id             : "crp_notation"
            ,ipLabel        : "Multicast Group"
            ,ipId           : "crp_network_entry"
            //,notationLabel  : "Mask"
            ,notationId     : "crp_mask_entry"
            ,fieldConfig    : {
                allowBlank      : false
            }
            ,networkMode    : true
            ,listeners      : {
                afterrender     : function(n, eOpts) {
                    var net_cmp = Ext.getCmp("crp_network_entry");
                    if(net_cmp) {
                        var net_octet1 = net_cmp.octets[0];
                        if(net_octet1) {
                            net_octet1.setMinValue(224);
                            net_octet1.setMaxValue(239);
                        }
                    }
                }
            }
        };

        var crp_form = {
            xtype       : "cp4_formpanel"
            ,id         : "crp_form"
            ,width      : 340
            ,height     : 117
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("crp_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("crp_ok_btn");
                CP.ar_util.checkDisabledBtn("crp_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "crp_ok_btn"
                    ,disabled           : true
                    ,handler2           : function(b) {
                        save_crp_network();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("crp_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("crp_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "crp_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("crp_window").close();
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            if(Ext.getCmp("crp_notation").validate) {
                                Ext.getCmp("crp_notation").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 310
                    ,margin     : "15 0 8 15"
                    ,autoScroll : false
                    ,items      : [
                        crp_network
                    ]
                }
            ]
        };

        var crp_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "crp_window"
            ,title      : "Add Candidate Multicast Group"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("bootstrap_window").getPosition();
                    win.setPosition(190 + pos[0], 250 + pos[1]);
                }
            }
            ,items      : [ crp_form ]
        });
        crp_window.show();

        function save_crp_network() {
            var panel   = Ext.getCmp("crp_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }
            var network = Ext.getCmp("crp_network_entry").getValue();
            var masklen = CP.pim_4.getMaskLength("crp_mask_entry");
            var st      = Ext.getStore("pim_crp_store");
            var recs    = st.getRange();
            var d, i;
            for(i = 0; i < recs.length; i++) {
                d = recs[i].data;
                if(d.net == network && d.mask == masklen) {
                    Ext.getCmp("crp_window").close();
                }
            }
            st.add({
                net     : network
                ,mask   : masklen
            });
            Ext.getCmp("pim_crp_grid").getView().refresh();
            Ext.getCmp("crp_window").close();
        }
    }

    ,open_srp_window            : function(REC) {
        var TITLE = "";

        var srp = Ext.getCmp("srp_notation");
        if(srp) {
            srp.destroy();
        }

        var srp_cmp;
        if(REC == null) {
            TITLE = "Add Static Rendezvous Point";
            srp_cmp = {
                xtype           : "cp4_ipv4field"
                ,fieldLabel     : "Static Rendezvous Point"
                ,id             : "srp_entry"
                ,labelWidth     : 150
                ,width          : 285
                ,allowBlank     : false
                ,fieldConfig    : {
                    allowBlank      : false
                }
            };
        } else {
            TITLE = "Edit Static Rendezvous Point: "+ String(REC.data.rp);
            srp_cmp = {
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Static Rendezvous Point"
                ,id         : "srp_entry"
                ,value      : String(REC.data.rp)
                ,labelWidth : 150
                ,width      : 285
                ,height     : 22
            };
        }

        var srp_grp_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pim_srp_grp_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "srp_grp_add_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.pim_4.add_srp_grp();
                    }
                },{
                    text                : "Delete"
                    ,id                 : "srp_grp_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var sm = Ext.getCmp("srp_grp_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            delete_srp_grp(recs[i]);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("srp_grp_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_srp_grp(rec) {
            var params  = CP.ar_util.getParams();
            var prefix  = CP.pim_4.get_prefix();
            var srp_cmp = Ext.getCmp("srp_entry");
            var st      = Ext.getStore("pim_grp_store");

            if(srp_cmp.getXType() == "cp4_displayfield") {
                var srp = srp_cmp.getValue();
                var net = rec.data.net;
                var mask= rec.data.mask;

                var rp_prefix   = prefix +":staticrp:rpaddr:"+ srp;
                var n_prefix    = rp_prefix +":network:"+ net;
                var m_prefix    = n_prefix +":masklen:"+ mask;

                params[m_prefix]    = "";
                st.remove(rec);
                if(st.findExact("net",net) == -1) {
                    params[n_prefix]    = "";
                }
            } else {
                st.remove(rec);
            }
        }

        var srp_grp_cm = [
            {
                text            : "Multicast Group"
                ,dataIndex      : "net"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.net) +"/"+ String(rec.data.mask);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var srp_grp_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("pim_srp_grp_btnsbar");
                }
            }
        });

        var srp_grp_grid = {
            xtype               : "cp4_grid"
            ,id                 : "srp_grp_grid"
            ,width              : 150
            ,height             : 149
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : "pim_grp_store"
            ,columns            : srp_grp_cm
            ,selModel           : srp_grp_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var srp_grp_form = {
            xtype       : "cp4_formpanel"
            ,id         : "srp_grp_form"
            ,width      : 315
            ,height     : 281
            ,margin     : 0
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;

                    var st = Ext.getStore("pim_grp_store");
                    st.removeAll();
                    if(Ext.getCmp("srp_entry").getXType() == "cp4_displayfield") {
                        var sm  = Ext.getCmp("pim_srp_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        st.loadData(rec.data.grp);
                    }
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("srp_grp_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("srp_save_btn");
                CP.ar_util.checkDisabledBtn("srp_cancel_btn");
                CP.ar_util.checkBtnsbar("pim_srp_grp_btnsbar");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "srp_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_srp();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("srp_grp_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("srp_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "srp_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("srp_window").close();
                    }
                    ,listeners      : {
                        mouseover       : function(b, e, eOpts) {
                            if(Ext.getCmp("srp_entry").validate) {
                                Ext.getCmp("srp_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 285
                    ,margin     : "15 0 15 15"
                    ,autoScroll : false
                    ,items      : [
                        srp_cmp
                        ,srp_grp_btnsbar
                        ,srp_grp_grid
                    ]
                }
            ]
        };

        var srp_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "srp_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("bootstrap_window").getPosition();
                    win.setPosition(pos[0], pos[1] + 145);
                }
            }
            ,items      : [ srp_grp_form ]
        });
        srp_window.show();

        //save function
        function save_srp() {
            var panel   = Ext.getCmp("srp_grp_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }
            var srp_st  = Ext.getStore("pim_srp_store");
            var grp_recs= Ext.getStore("pim_grp_store").getRange();
            var srp_cmp = Ext.getCmp("srp_entry");
            var i,n,m;
            var srp_rec = srp_st.findRecord("rp", srp_cmp.getValue(), 0, false, true, true);

            if(srp_cmp.getXType() == "cp4_displayfield") {
                //edit, replace srp_rec.data.grp;
                srp_rec.data.grp = [];
                for(i = 0; i < grp_recs.length; i++) {
                    n = grp_recs[i].data.net;
                    m = grp_recs[i].data.mask;
                    srp_rec.data.grp.push({
                        net     : n
                        ,mask   : m
                    });
                }

            } else {
                //add, check for existing record, and add to it?
                if(srp_rec) {
                    //exists, extend group, how to handle duplicates?
                    var notIn;
                    for(i = 0; i < grp_recs.length; i++) {
                        notIn = true;
                        n = grp_recs[i].data.net;
                        m = grp_recs[i].data.mask;
                        for(j = 0; j < srp_rec.data.grp.length; j++) {
                            if(srp_rec.data.grp[j].net == n && srp_rec.data.grp[j].mask == m) {
                                notIn = false;
                            }
                        }
                        if(notIn) {
                            srp_rec.data.grp.push({
                                net     : n
                                ,mask   : m
                            });
                        }
                    }

                } else {
                    //doesn't exist, add
                    var grp_list = [];
                    for(i = 0; i < grp_recs.length; i++) {
                        grp_list.push({
                            net     : grp_recs[i].data.net
                            ,mask   : grp_recs[i].data.mask
                        });
                    }
                    srp_st.add({
                        rp      : srp_cmp.getValue()
                        ,grp    : grp_list
                    });
                }

            }
            Ext.getCmp("pim_srp_grid").getView().refresh();
            Ext.getCmp("srp_window").close();
        }
    }

    ,add_srp_grp                : function() {
        var c = Ext.getCmp("srp_grp_entry");
        if(c) { c.destroy(); }

        var srp_grp_cmp = {
            xtype           : "cp4_ipv4notation"
            ,id             : "srp_grp_entry"
            ,ipLabel        : "Multicast Address"
            ,ipId           : "srp_grp_net_entry"
            //,notationLabel  : "Mask"
            ,notationId     : "srp_grp_mask_entry"
            ,allowBlank     : false
            ,networkMode    : true
            ,fieldConfig    : {
                allowBlank      : false
            }
            ,listeners      : {
                afterrender     : function(n, eOpts) {
                    var net_cmp = Ext.getCmp("srp_grp_net_entry");
                    if(net_cmp) {
                        var net_octet1 = net_cmp.octets[0];
                        if(net_octet1) {
                            net_octet1.setMinValue(224);
                            net_octet1.setMaxValue(239);
                        }
                    }
                }
            }
        };

        var srp_grp_add_form = {
            xtype       : "cp4_formpanel"
            ,id         : "srp_grp_add_form"
            ,width      : 340
            ,height     : 117
            ,autoScroll : false
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("srp_grp_add_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function () {
                CP.ar_util.checkDisabledBtn("srp_grp_ok_btn");
                CP.ar_util.checkDisabledBtn("srp_grp_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "srp_grp_ok_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_srp_grp();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("srp_grp_add_form");
                        return !(f);
                    }
                    ,listeners      : {
                        mouseover       : function(b, e, eOpts) {
                            Ext.getCmp("srp_grp_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "srp_grp_cancel_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("srp_grp_add_window").close();
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            if(Ext.getCmp("srp_grp_entry").validate) {
                                Ext.getCmp("srp_grp_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 310
                    ,margin     : "15 0 8 15"
                    ,autoScroll : false
                    ,items      : [ srp_grp_cmp ]
                }
            ]
        };

        var srp_grp_add_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "srp_grp_add_window"
            ,title      : "Add Static Multicast Group"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("srp_window").getPosition();
                    win.setPosition(190 + pos[0], 100 + pos[1]);
                }
            }
            ,items      : [ srp_grp_add_form ]
        });
        srp_grp_add_window.show();

        function save_srp_grp() {
            var panel   = Ext.getCmp("srp_grp_add_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }
            var grp_st = Ext.getStore("pim_grp_store");
            var grp_recs = grp_st.getRange();
            var d, i;
            var n = Ext.getCmp("srp_grp_net_entry").getValue();
            var m = CP.pim_4.getMaskLength("srp_grp_mask_entry");
            for(i = 0; i < grp_recs.length; i++) {
                d = grp_recs[i].data;
                if(d.net == n && d.mask == m) {
                    //already exists, no need for a duplicate
                    Ext.getCmp("srp_grp_add_window").close();
                    return;
                }
            }
            grp_st.add({
                net     : n
                ,mask   : m
            });
            Ext.getCmp("srp_grp_grid").getView().refresh();
            Ext.getCmp("srp_grp_add_window").close();
        }
    }

//advanced_set
    ,advanced_set               : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "adv_options_base_set"
            ,margin     : 0
            ,autoScroll : false
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Advanced Options"
                    ,margin     : "24 0 7 0"
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,width      : 550
                    ,margin     : 0
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype               : "cp4_button"
                            ,text               : "Edit Settings"
                            ,id                 : "advanced_set_btn"
                            ,margin             : "3 8 0 0"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                CP.pim_4.open_adv_settings_window(false);
                            }
                            ,handle_no_token    : function() {
                                var b = this;
                                var d = CP.ar_util.checkBlockActivity(false);
                                var v = CP.ar_util.checkBlockActivity(true);
                                if (b && b.setVisible) { b.setVisible(!v); }
                                if (b && b.disabled != d) { b.setDisabled(d); }
                                return !d;
                            }
                        },{
                            xtype               : "cp4_button"
                            ,text               : "View Settings"
                            ,id                 : "view_advanced_set_btn"
                            ,margin             : "3 8 0 0"
                            ,disabled           : false
                            ,overrideNoToken    : false
                            ,hidden             : true
                            ,handler            : function(b) {
                                if (b && b.handle_no_token() ) {
                                    CP.pim_4.open_adv_settings_window(true);
                                }
                            }
                            ,handle_no_token    : function() {
                                var b = this;
                                var v = CP.ar_util.checkBlockActivity(true);
                                if (b && b.setVisible) { b.setVisible(v); }
                                if (b && b.disabled && b.enable) { b.enable(); }
                                return true;
                            }
                            ,disable            : function() { }
                            ,setDisabled        : function(d) {
                                var b = this;
                                if (b.disabled && b.enable) {
                                    b.enable();
                                }
                            }
                        },{
                            xtype   : "cp4_inlinemsg"
                            ,type   : "info"
                            ,text   : CP.pim_4.INFO_MESSAGE_STRING
                            ,margin : 0
                            ,width  : 400
                        }
                    ]
                }
            ]
        };
    }

    ,open_adv_settings_window  : function(READONLY) {
        var adv_labelWidth = 150;
        var general_timer_defaults = {
            xtype               : "cp4_numberfield"
            ,labelWidth         : adv_labelWidth
            ,width              : adv_labelWidth + 150
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1     //overwrite
            ,maxValue           : 16    //overwrite
            ,maxLength          : 2     //overwrite
            ,enforceMaxLength   : true  //overwrite
            ,disabled           : READONLY
        };
        var general_timer_numberfields = [
            {
                fieldLabel  : "Hello Interval"
                ,id         : "hello-timer"
                ,name       : "hello-timer"
                ,minValue   : 1
                ,maxValue   : 21845
                ,maxLength  : 5
                ,emptyText  : "Default: 30, 1-21845"
                ,style      : "margin-right:30px;"
            },{
                fieldLabel  : "Data Interval"
                ,id         : "data-intvl"
                ,name       : "data-intvl"
                ,minValue   : 11
                ,maxValue   : 3600
                ,maxLength  : 4
                ,emptyText  : "Default: 210, 11-3600"
            },{
                fieldLabel  : "Assert Interval"
                ,id         : "assert-intvl"
                ,name       : "assert-intvl"
                ,minValue   : 1
                ,maxValue   : 3600
                ,maxLength  : 4
                ,emptyText  : "Default: 180, 1-3600"
                ,style      : "margin-right:30px;"
            }
            
            /*  (Not yet supported)
            ,{
                fieldLabel  : "Assert-rate Limit"
                ,id         : "assert-limit"
                ,name       : "assert-limit"
                ,minValue   : 10
                ,maxValue   : 10000
                ,maxLength  : 5
                ,emptyText  : "Default: 10, 10-10000"
            }
            */
            
            ,{
                fieldLabel  : "Join Prune Interval"
                ,id         : "jp-intvl"
                ,name       : "jp-intvl"
                ,minValue   : 1
                ,maxValue   : 3600
                ,maxLength  : 4
                ,emptyText  : "Default: 60, 1-3600"
            },{
                fieldLabel  : "Join Prune Delay Interval"
                ,id         : "jp-delay-intvl"
                ,name       : "jp-delay-intvl"
                ,minValue   : 1
                ,maxValue   : 3600
                ,maxLength  : 4
                ,emptyText  : "Default: 5, 1-3600"
                ,style      : "margin-right:30px;margin-bottom:0px;"
            }
        ];

        var assert_rank_protocol_defaults = {
            xtype               : "cp4_numberfield"
            ,labelWidth         : adv_labelWidth
            ,width              : adv_labelWidth + 150
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 0
            ,maxValue           : 255
            ,maxLength          : 3
            ,enforceMaxLength   : true
            ,disabled           : READONLY
        };
        var assert_rank_protocol_numberfields = [
            {
                fieldLabel  : "Direct"
                ,id         : "direct"
                ,name       : "direct"
                ,emptyText  : "Default: 0, 0-255"
                ,style      : "margin-right:30px;"
            },{
                fieldLabel  : "Kernel"
                ,id         : "kernel"
                ,name       : "kernel"
                ,emptyText  : "Default: 40, 0-255"
            },{
                fieldLabel  : "Static"
                ,id         : "static"
                ,name       : "static"
                ,emptyText  : "Default: 60, 0-255"
                ,style      : "margin-right:30px;"
            },{
                fieldLabel  : "OSPF"
                ,id         : "ospf2"
                ,name       : "ospf2"
                ,emptyText  : "Default: 10, 0-255"
            },{
                fieldLabel  : "OSPF ASE"
                ,id         : "ospf2ase"
                ,name       : "ospf2ase"
                ,emptyText  : "Default: 150, 0-255"
                ,style      : "margin-right:30px;"
            },{
                fieldLabel  : "RIP"
                ,id         : "rip"
                ,name       : "rip"
                ,emptyText  : "Default: 100, 0-255"
            },{
                fieldLabel  : "BGP"
                ,id         : "bgp"
                ,name       : "bgp"
                ,emptyText  : "Default: 170, 0-255"
                ,style      : "margin-bottom:0px;"
            }
        ];

        var sparse_mode_timer_defaults = {
            xtype               : "cp4_numberfield"
            ,labelWidth         : adv_labelWidth
            ,width              : adv_labelWidth + 150
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 3600
            ,maxLength          : 4
            ,enforceMaxLength   : true
        };
        var sparse_mode_timer_numberfields = [
            {
                fieldLabel  : "Register Suppression Interval"
                ,id         : "regsuppr-intvl"
                ,name       : "regsuppr-intvl"
                ,emptyText  : "Default: 60, 60-3600"
                ,minValue   : 60
                ,style      : "margin-right:30px;margin-bottom:0px;"
                ,disabled   : READONLY
            },{
                fieldLabel  : "CRP Advertise Interval"
                ,id         : "crpadv-intvl"
                ,name       : "crpadv-intvl"
                ,emptyText  : "Default: 60, 1-3600"
                ,style      : "margin-bottom:0px;"
                ,disabled   : READONLY
            }
        ];

        var state_refresh_defaults = {
            xtype               : "cp4_numberfield"
            ,labelWidth         : adv_labelWidth
            ,width              : adv_labelWidth + 150
            ,allowBlank         : true
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 255
            ,maxLength          : 3
            ,enforceMaxLength   : true
            ,disabled           : READONLY
        };
        var state_refresh_numberfields = [
            {
                fieldLabel  : "State Refresh Interval"
                ,id         : "state-refresh-interval"
                ,name       : "state-refresh-interval"
                ,emptyText  : "Default: 60, 1-255"
                ,style      : "margin-right:30px;margin-bottom:0px;"
            },{
                fieldLabel  : "State Refresh TTL"
                ,id         : "state-refresh-ttl"
                ,name       : "state-refresh-ttl"
                ,emptyText  : "Default: none, 1-255"
                ,style      : "margin-bottom:0px;"
            }
        ];

        var adv_options_form = {
            xtype       : "cp4_formpanel"
            ,id         : "adv_options_form"
            ,width      : 662
            ,height     : 418
            ,margin     : 0
            ,autoScroll : true
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    CP.ar_util.loadListPush("adv_options_form");
                    p.load({
                        url         : "/cgi-bin/pim.tcl?option=global&instance=" + CP.ar_util.INSTANCE()
                        ,method     : "GET"
                        ,failure    : function(p) {
                            CP.ar_util.loadListPop("adv_options_form");
                            if (p && p.chkBtns) { p.chkBtns(); }
                        }
                        ,success    : function(p, action) {
                            if (action && action.result && action.result.data) {
                                CP.pim_4.updateSparseModeSettingsVisibility();
                                CP.pim_4.updateStateRefreshSettingsVisiblity();
                            }
                            CP.ar_util.loadListPop("adv_options_form");
                            if (p && p.chkBtns) { p.chkBtns(); }
                        }
                    });
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("adv_options_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("adv_options_save_btn");
                CP.ar_util.checkDisabledBtn("adv_options_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "adv_options_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        save_advanced_options();
                    }
                    ,disabledConditions : function() {
                        var b = this;
                        var no_token = CP.ar_util.checkBlockActivity(true);
                        if (b && b.setVisible) { b.setVisible(!no_token); }
                        var f = CP.ar_util.checkFormValid("adv_options_form");
                        return !(f);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("adv_options_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "adv_options_cancel_btn"
                    ,disabled           : true
                    ,READONLY           : READONLY
                    ,overrideNoToken    : false
                    ,handle_no_token    : function() {
                        var b = this;
                        var RO = b.READONLY;
                        var d = (RO) ? false : CP.ar_util.checkBlockActivity();
                        if (b && b.disabled != d) { b.setDisabled(d); }
                        return !d;
                    }
                    ,handler            : function(b) {
                        if ( b.handle_no_token() ) {
                            CP.ar_util.clearParams();
                            Ext.getCmp("adv_options_window").close();
                        }
                    }
                    ,listeners          : {
                        enable              : function(b) {
                            if (b && b.handle_no_token) { b.handle_no_token(); }
                        }
                        ,disable            : function(b) {
                            if (b && b.handle_no_token) { b.handle_no_token(); }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 630
                    ,margin     : "15 0 15 15"
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "General Timers"
                            ,margin     : "0 0 10 0"
                        },{
                            xtype       : "cp4_formpanel"
                            ,width      : 630
                            ,layout     : "column"
                            ,margin     : 0
                            ,defaults   : general_timer_defaults
                            ,items      : general_timer_numberfields
                        },{
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Assert Ranks"
                        },{
                            xtype       : "cp4_formpanel"
                            ,width      : 630
                            ,layout     : "column"
                            ,margin     : 0
                            ,defaults   : assert_rank_protocol_defaults
                            ,items      : assert_rank_protocol_numberfields
                        },{
                            xtype       : "cp4_formpanel"
                            ,id         : "sparse_mode_adv_settings"
                            ,width      : 630
                            ,margin     : 0
                            ,autoScroll : false
                            ,disabled   : true
                            ,hidden     : true
                            ,READONLY   : READONLY
                            ,items      : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Sparse Mode Timers"
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,width      : 630
                                    ,layout     : "column"
                                    ,margin     : 0
                                    ,defaults   : sparse_mode_timer_defaults
                                    ,items      : sparse_mode_timer_numberfields
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,id         : "state_refresh_adv_settings"
                            ,width      : 630
                            ,margin     : 0
                            ,autoScroll : false
                            ,hidden     : true
                            ,items      : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "State Refresh Parameters"
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,width      : 630
                                    ,layout     : "column"
                                    ,margin     : 0
                                    ,autoScroll : false
                                    ,defaults   : state_refresh_defaults
                                    ,items      : state_refresh_numberfields
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        var adv_options_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "adv_options_window"
            ,title      : "Advanced Options"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ adv_options_form ]
        });
        adv_options_window.show();

        function save_advanced_options() {
            var panel   = Ext.getCmp("adv_options_form");
            if( panel && !( panel.getForm().isValid() ) ) {
                return;
            }
            var params      = CP.ar_util.getParams();
            var prefix      = CP.pim_4.get_prefix();
            var pim_mode    = Ext.getCmp("pim-mode").getValue();
            var staterefresh= Ext.getCmp("pim-state-refresh").getValue();

            var field_list  = [
                {   id: "hello-timer",      s: "hellointerval" }
                ,{  id: "data-intvl",       s: "datainterval" }
                ,{  id: "assert-intvl",     s: "assertinterval" }
                
                /* (Not yet supported) 
                ,{  id: "assert-limit",     s: "assertlimit" }
                */
                ,{  id: "jp-intvl",         s: "joinpruneinterval" }
                ,{  id: "jp-delay-intvl",   s: "joinprunedelayinterval" }
                ,{  id: "direct",           s: "assertrank:direct" }
                ,{  id: "kernel",           s: "assertrank:kernel" }
                ,{  id: "static",           s: "assertrank:static" }
                ,{  id: "ospf2",            s: "assertrank:ospf2" }
                ,{  id: "ospf2ase",         s: "assertrank:ospf2ase" }
                ,{  id: "rip",              s: "assertrank:rip" }
                ,{  id: "bgp",              s: "assertrank:bgp" }
            ];

            var sparse_fields   = [
                {   id: "regsuppr-intvl",   s: "registersupprinterval" }
                ,{  id: "crpadv-intvl",     s: "candidaterpadvinterval" }
            ];

            var state_fields    = [
                {   id: "state-refresh-interval",   s: "state-refresh-interval" }
                ,{  id: "state-refresh-ttl",        s: "state-refresh-ttl" }
            ];

            var i;
            for(i = 0; i < field_list.length; i++) {
                push_if_dirty(
                    field_list[i].id
                    ,params
                    ,prefix +":"+ field_list[i].s
                );
            }
            for(i = 0; i < sparse_fields.length; i++) {
                push_if_dirty(
                    sparse_fields[i].id
                    ,params
                    ,prefix +":"+ sparse_fields[i].s
                );
            }
            for(i = 0; i < state_fields.length; i++) {
                push_if_dirty(
                    state_fields[i].id
                    ,params
                    ,prefix +":"+ state_fields[i].s
                );
            }

            CP.pim_4.LAST_SAVE_BUTTON = "advanced_save";
            CP.pim_4.mySubmit();

            function push_if_dirty(cmpString, params, prefix) {
                var cmp = Ext.getCmp(cmpString);
                if(cmp) {
                    var cmpValue    = cmp.getRawValue();
                    var cmpOriginal = String(cmp.originalValue);
                    switch(cmpOriginal) {
                        case null:
                        case "":    cmpOriginal = "";
                            break;
                        default:
                    }

                    if(cmpValue != cmpOriginal) {
                        params[prefix]  = cmpValue;
                        return;
                    }
                    //delete this binding in params
                    delete params[prefix];
                }
            }
        }
    }

    //moved to the bottom to make the top more readable
    ,INTF_LIMIT_INFO            : "Note: A maximum of 31 PIM interfaces can be"
                                + " configured."
    ,INFO_MESSAGE_STRING        : "Note: The default settings are based on the PIM RFCs."
                                + "<br>Changing these settings may lead to unexpected network behavior."

    //QuickTips Tooltips
    ,VIRTUAL_ADDRESS_INFO       : "<b>Use Virtual Address:</b><br>"
                                + "Specifies to enable VRRP virtual IP address on the"
                                + " specified PIM interface. This option lets you configure"
                                + " either a PIM Sprase-Mode or PIM Dense-Mode"
                                + " interface to advertise the VRRP virtual IP address if"
                                + " the router transitions to become VRRP master after a"
                                + " failover. When you enable virtual IP support for VRRP"
                                + " on a PIM interface, it establishes the neighbor"
                                + " relationship using the virtual IP if the router is a VRRP"
                                + " master. The master in the VRRP pair sends hello"
                                + " messages that include the virtual IP as the source"
                                + " address and processes PIM control messages from"
                                + " routers that neighbor the VRRP pair.<br>"
                                + "<i>Note</i> - You must use Monitored Circuit mode when configuring"
                                + " virtual IP support for any dynamic routing protocol, including"
                                + " PIM, either sparse-mode or dense-mode. Do not use VRRPv2"
                                + " when configuring virtual IP support for any dynamic routing"
                                + " protocol. &lt;42119&gt;"

    ,DR_PRIORITY_INFO           : "<b>DR Priority:</b><br>"
                                + "Specifies the dr-priority advertised in the PIM hello"
                                + " messages sent on the corresponding interface. This"
                                + " value, which has a default of 1, is used for DR"
                                + " election on a LAN. The router with the highest priority"
                                + " and the highest IP address is elected the designated"
                                + " router. To break a tie, the DR is selected on the basis"
                                + " of the highest IP address. If even one router does not"
                                + " advertise a dr-priority value in its hello messages, the"
                                + " DR election is based on the IP address."
                                + " Default value is 1."

}

