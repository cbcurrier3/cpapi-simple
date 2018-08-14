CP.rip_4 = {
    init                    : function() {
        CP.rip_4.defineStores();
        var rip_configPanel = CP.rip_4.configPanel();
        var obj = {
            title           : "RIP"
            ,panel          : rip_configPanel
            ,submitURL      : "/cgi-bin/rip.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("interface_window_rip");
                CP.rip_4.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.rip_mon_4 && CP.rip_mon_4.doLoad) {
                    CP.rip_mon_4.doLoad();
                }                                                                                                               
            }
            ,submitFailure  : function() {
                CP.rip_4.doLoad();
            }
            ,checkCmpState  : CP.rip_4.check_user_action
            ,helpFile       : "ripHelp.html"
            ,cluster_feature_name: 'rip'
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("rip_global_btnsbar");
        CP.ar_util.checkBtnsbar("rip_intf_btnsbar");
        CP.ar_util.checkBtnsbar("interface_form_rip");
    }

    //defineStores
    ,defineStores           : function() {
        if( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["rip_interface_grid"];
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
                        if(value == "lo" || value == "loopback") {
                            return "zzz"+ value;
                        }
                        return value;
                    }
                }
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
                    ,"excludeType"  : "6in4 6to4 pppoe gre wrp wrpj"
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
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //rip.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "rip_intf_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "cp_interface"
                    ,sortType   : function(value) {
                        if(value == "lo" || value == "loopback") {
                            return "zzz"+ value;
                        }
                        return value;
                    }
                }
                ,"cp_version"
                ,"cp_enable"
                ,"cp_v4Addr"
                ,"cp_metric"
                ,"cp_ripin"
                ,"cp_ripout"
                ,"cp_virtual"
                ,"cp_transport"
                ,"cp_auth"
                ,"cp_simplepwd"
                ,"cp_simplepwd_existed"
                ,"md5_secret_key"
                ,"md5_secret_key_existed"
                ,"ciscomp"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/rip.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "intf"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rip_if_params"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });
    }

    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "rip_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender     : CP.rip_4.doLoad
                ,validitychange : CP.rip_4.check_user_action
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("rip"),
                CP.rip_4.get_global_set()
                ,CP.rip_4.get_interface_set()
            ]
        });
        return configPanel;
    }
    ,doLoad                 : function() {
        function loadStore(storeId, loadObj) {
            var st = Ext.getStore( storeId );
            if (st) {
                CP.ar_util.loadListPush( storeId );
                st.load(loadObj);
            }
        }

        var instance_string = CP.ar_util.INSTANCE();
        if(CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }

        var loadObj = {params: {"instance": instance_string} };
        loadStore("intf_store", loadObj);
        loadStore("rip_intf_store", loadObj);

        var p = Ext.getCmp("rip_configPanel");
        if (p) {
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/rip.tcl?option=global&instance=" + instance_string
                ,method     : "GET"
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,success    : function(p, action) {
                    if (action && action.result && action.result.data) {
                        var gData = action.result.data;

                        var update  = gData.update_interval;
                            update  = (update == "") ? 30 : update;
                        var expire  = gData.expire_interval;
                            expire  = (expire == "") ? 120 : expire;
                        var autosum = gData.auto_summarization;

                        Ext.getCmp("update_interval").validate();
                        Ext.getCmp("expire_interval").validate();
                        Ext.getCmp("autosummarization").setValue(autosum);

                        if(CP && CP.intf_state && CP.intf_state.load) {
                            CP.intf_state.load( CP.ar_util.INSTANCE() );
                        }
                    }
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }

        CP.ar_util.loadListPop("mySubmit");
    }

    ,get_global_set         : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "rip_global_set"
            ,padding    : 0
            ,margin     : 0
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                }
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "RIP Global Settings"
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,padding    : 0
                    ,margin     : "0 0 0 0"
                    ,items      : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Update Interval"
                            ,id             : "update_interval"
                            ,minValue       : 1
                            ,maxValue       : 65535
                            ,maxLength      : 5
                            ,enforceMaxLength   : true
                            ,emptyText      : "Default: 30"
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,labelWidth     : 110
                            ,width          : 200
                            ,submitValue    : false
                            ,style          : "margin-right:10px;"
                            ,validator      : function(value) {
                                var update_cmp = Ext.getCmp("update_interval");
                                var expire_cmp = Ext.getCmp("expire_interval");
                                if(!update_cmp || !expire_cmp) {
                                    return true;
                                }

                                var update = update_cmp.getRawValue();
                                var expire = expire_cmp.getRawValue();

                                if(update == "") {
                                    update = 30;
                                } else {
                                    update = parseInt(update,10);
                                }
                                if(expire == "") {
                                    expire = 180;
                                } else {
                                    expire = parseInt(expire,10);
                                }

                                if(update < update_cmp.minValue) {
                                    return "";
                                }
                                if(update > update_cmp.maxValue) {
                                    return "";
                                }
                                //update is in its valid range
                                if(update > expire
                                    && expire >= expire_cmp.minValue
                                    && expire <= expire_cmp.maxValue) {
                                    //if update > expire and expire is in its valid range
                                    return "Update Interval must be less than Expire Interval.";
                                }
                                return true;
                            }
                            ,listeners      : {
                                change          : function() {
                                    if(Ext.getCmp("expire_interval")) {
                                        Ext.getCmp("expire_interval").validate();
                                    }
                                }
                            }
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                            ,width  : 100
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,padding    : 0
                    ,margin     : "0 0 0 0"
                    ,items      : [
                        {
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Expire Interval"
                            ,id             : "expire_interval"
                            ,submitValue    : false
                            ,minValue       : 6
                            ,maxValue       : 65535
                            ,maxLength      : 5
                            ,enforceMaxLength   : true
                            ,emptyText      : "Default: 180"
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,labelWidth     : 110
                            ,width          : 200
                            ,style          : "margin-right:10px;"
                            ,validator      : function(value) {
                                var update_cmp = Ext.getCmp("update_interval");
                                var expire_cmp = Ext.getCmp("expire_interval");
                                if(!update_cmp || !expire_cmp) {
                                    return true;
                                }

                                var update = update_cmp.getRawValue();
                                var expire = expire_cmp.getRawValue();

                                if(update == "") {
                                    update = 30;
                                } else {
                                    update = parseInt(update,10);
                                }
                                if(expire == "") {
                                    expire = 180;
                                } else {
                                    expire = parseInt(expire,10);
                                }

                                if(expire < expire_cmp.minValue) {
                                    return "";
                                }
                                if(expire > expire_cmp.maxValue) {
                                    return "";
                                }
                                //expire is in its valid range
                                if(update > expire
                                    && update >= update_cmp.minValue
                                    && update <= update_cmp.maxValue) {
                                    //if update > expire and update is in its valid range
                                    return "Expire Interval must be greater than Update Interval.";
                                }
                                return true;
                            }
                            ,listeners      : {
                                change          : function() {
                                    if(Ext.getCmp("update_interval")) {
                                        Ext.getCmp("update_interval").validate();
                                    }
                                }
                            }
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:4px;"
                            ,width  : 100
                        }
                    ]
                },{
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : "Auto Summarization"
                    ,id         : "autosummarization"
                    ,labelWidth : 110
                    ,width      : 200
                    ,height     : 22
                    ,submitValue: false
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "rip_global_btnsbar"
                    ,items      : [
                        {
                            text                : "Apply Global Settings"
                            ,id                 : "rip_apply_global_settings_btn"
                            ,overrideNoToken    : false
                            ,handler2           : function(b) {
                                var params  = CP.ar_util.clearParams();
                                var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":rip";

                                var u_cmp = Ext.getCmp("update_interval");
                                var e_cmp = Ext.getCmp("expire_interval");
                                var update  = u_cmp.getRawValue();
                                var expire  = e_cmp.getRawValue();
                                params[prefix +":expireinterval"]   = expire;
                                params[prefix +":updateinterval"]   = update;

                                var autosum = (Ext.getCmp("autosummarization").getValue()) ? "" : "t"; //inverted
                                params[prefix +":noautosummary"]    = autosum;
                                CP.ar_util.mySubmit();
                            }
                            ,disabledConditions : function() {
                                var m = CP.ar_util.checkFormValid("rip_configPanel");
                                return !(m);
                            }
                        }
                    ]
                }
            ]
        };
    }

    ,get_interface_set      : function() {
        var interface_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "rip_intf_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "interface_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        Ext.getCmp("rip_interface_grid").getSelectionModel().deselectAll();
                        CP.rip_4.open_interface_window("add");
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("rip_configPanel");
                        return !(m);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "interface_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var rec = Ext.getCmp("rip_interface_grid").getSelectionModel().getLastSelected();
                        CP.rip_4.open_interface_window("Edit Interface "+ rec.data["cp_interface"]);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("rip_configPanel");
                        if (!m) {
                            return true;
                        }
                        var g = Ext.getCmp("rip_interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "interface_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("rip_interface_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        CP.ar_util.clearParams();
                        for(i = 0; i < recs.length; i++) {
                            delete_interface(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("rip_configPanel");
                        if (!m) {
                            return true;
                        }
                        var g = Ext.getCmp("rip_interface_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_interface(rec) {
            var params  = CP.ar_util.getParams();
            var intf    = rec.data["cp_interface"];
            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE() +":rip:interface:"+ intf;

            params[prefix]                                      = "";
            params[prefix +":metricout"]                        = "";
            params[prefix +":virtual"]                          = "";
            params[prefix +":noripin"]                          = "";
            params[prefix +":noripout"]                         = "";

            params[prefix +":version"]                          = "";
            params[prefix +":broadcast"]                        = "";

            params[prefix +":auth:null"]                        = "";
            params[prefix +":auth:md5"]                         = "";
            params[prefix +":auth:md5:cisco-interop"]           = "";
            params[prefix +":auth:md5:keyid:0"]                 = "";
            params[prefix +":auth:md5:keyid:0:key"]             = "";
            params[prefix +":auth:md5:keyid:0:startaccept"]     = "";
            params[prefix +":auth:md5:keyid:0:startgenerate"]   = "";
            params[prefix +":auth:md5:keyid:0:stopaccept"]      = "";
            params[prefix +":auth:md5:keyid:0:stopgenerate"]    = "";
            params[prefix +":auth:simple"]                      = "";
            params[prefix +":auth:simple:password"]             = "";
            params[prefix +":authtype"]                         = "";

            Ext.getStore("rip_intf_store").remove(rec);
        }

        var interface_cm = [
            {
                header          : "Interface"
                ,dataIndex      : "cp_interface"
                ,width          : 85
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.intf_state.renderer_output(
                        value               //value
                        ,""                 //tip
                        ,"left"             //align
                        ,"black"            //color
                        ,value              //rawvalue
                        ,"ipv4"             //family
                        ,CP.ar_util.INSTANCE()  //INSTANCE
                    );
                }
            },{
                header          : "Address"
                ,dataIndex      : "cp_v4Addr"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var VALUE = "";
                    var addr_list = value.split(" ");
                    var i;
                    if(value == "") {
                        return "";
                    }
                    if(addr_list.length == 1) {
                        VALUE = value;
                    } else {
                        VALUE = addr_list[0];
                        for(i = 1; i < addr_list.length && addr_list[i] != ""; i++) {
                            VALUE += ",<br />"+ addr_list[i];
                        }
                    }
                    var STYLE   = "white-space:pre-wrap !important;";
                    var TIP     = VALUE;
                    return CP.ar_util.rendererSpecific(VALUE, TIP, "left", "black");
                }
            },{
                header          : "Version"
                ,dataIndex      : "cp_version"
                ,width          : 70
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (value != "") ? "v"+ value : "";
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Metric"
                ,dataIndex      : "cp_metric"
                ,width          : 65
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var val = String(value);
                    var color = "black";
                    if (val == "") {
                        val = "None";
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(val, val, "center", color);
                }
            },{
                header          : "Updates"
                ,dataIndex      : "cp_ripin"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "None";
                    if(rec.data.cp_ripin && rec.data.cp_ripout) {
                        retValue = "Accept / Send";
                    } else if(rec.data.cp_ripin) {
                        retValue = "Accept";
                    } else if(rec.data.cp_ripout) {
                        retValue = "Send";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Transport"
                ,dataIndex      : "cp_transport"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "Multicast";
                    if(value) {
                        retValue = "Broadcast";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Authentication"
                ,dataIndex      : "cp_auth"
                ,width          : 95
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "None";
                    if(rec.data.cp_version == 2) {
                        switch(value.toLowerCase()) {
                            case "simple":  retValue = "Simple";    break;
                            case "md5":     retValue = "MD5";       break;
                            default:        retValue = "None";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Virtual Address"
                ,dataIndex      : "cp_virtual"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "No";
                    if(value) {
                        retValue = "Yes";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            }
        ];

        var interface_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.rip_4.check_user_action();
                }
            }
        });

        var interface_grid = {
            xtype               : "cp4_grid"
            ,id                 : "rip_interface_grid"
            ,width              : 700
            ,height             : 181
            ,forceFit           : true
            ,store              : Ext.getStore("rip_intf_store")
            ,selModel           : interface_selModel
            ,columns            : interface_cm
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

        return {
            xtype       : "cp4_formpanel"
            ,padding    : 0
            ,margin     : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "RIP Interfaces"
                }
                ,interface_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,autoScroll : true
                    ,items      : [ interface_grid ]
                }
            ]//interface items
        };
    }

    ,open_interface_window  : function(TITLE) {

        var interface_cmp;
        if(TITLE == "add") {
            TITLE = "Add Interface";
            interface_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "cp_interface_name"
                ,labelWidth     : 115
                ,width          : 460
                ,style          : "margin-left:15px;"
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,listeners      : {
                    change          : function(c, newValue, oldValue, eOpts) {
                        var rip_st = Ext.getStore("rip_intf_store");
                        if(rip_st) {
                            var r = rip_st.findRecord("cp_interface", newValue, 0, false, true, true);
                            if(r) {
                                var p = Ext.getCmp("interface_form_rip");
                                if(p) {
                                    p.loadRecord(r);
                                    return;
                                }
                            }
                        }
                        set_intf_form_cmp_value("version_entry"     ,2);
                        set_intf_form_cmp_value("metric_entry"      ,"");
                        set_intf_form_cmp_value("accept_entry"      ,true);
                        set_intf_form_cmp_value("send_entry"        ,true);
                        set_intf_form_cmp_value("virtual_entry"     ,false);
                        set_intf_form_cmp_value("transport_entry"   ,"");
                        set_intf_form_cmp_value("auth_entry"        ,"");
                        set_intf_form_cmp_value("simple_entry"      ,"");
                        set_intf_form_cmp_value("md5_entry"         ,"");
                        set_intf_form_cmp_value("ciscomp_entry"     ,false);

                        function set_intf_form_cmp_value(cmpId, value) {
                            var cmp = Ext.getCmp(cmpId);
                            if(cmp) {
                                cmp.setValue(value);
                            } else {
                                Ext.Msg.alert("??", "No Cmp "+ String(cmpId));
                            }
                        }
                    }
                }
            };
        } else {
            interface_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Interface"
                ,id             : "interface_entry"
                ,name           : "cp_interface"
                ,labelWidth     : 115
                ,width          : 460
                ,height         : 22
                ,style          : "margin-left:15px;"
            };
        }

        function interface_afterrender(p, eOpts) {
            p.form._boundItems = null;
            if(Ext.getCmp("interface_entry").getXType() == "cp4_displayfield") {
                var rec = Ext.getCmp("rip_interface_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                Ext.getCmp("interface_entry").setValue(rec.data.cp_interface);
                switch(rec.data.cp_auth) {
                    case "simple":  Ext.getCmp("auth_entry").setValue("simple");
                        break;
                    case "md5":     Ext.getCmp("auth_entry").setValue("md5");
                        break;
                    default:        Ext.getCmp("auth_entry").setValue("");
                }
                Ext.getCmp("version_entry").setValue(rec.data.cp_version);
                Ext.getCmp("version_entry").originalValue = Ext.getCmp("version_entry").getValue();
                var simple = Ext.getCmp("simple_entry");
                if (simple) {
                    simple.allowBlank =
                        rec.data.cp_simplepwd_existed ? true : false;
                    simple.emptyText =
                        rec.data.cp_simplepwd_existed ? "Key is set" : "";
                    if (simple.reset) simple.reset();
                }
                var md5 = Ext.getCmp("md5_entry");
                if (md5) {
                    md5.allowBlank =
                        rec.data.md5_secret_key_existed ? true : false;
                    md5.emptyText =
                        rec.data.md5_secret_key_existed ? "Key is set" : "";
                    if (md5.reset) md5.reset();
                }
            } else {
                Ext.getCmp("auth_entry").setValue("");
            }
            Ext.getCmp("auth_entry").fireEvent("change");
            Ext.getCmp("version_entry").fireEvent("change");
            if (p && p.chkBtns) { p.chkBtns(); }
        }

        var interface_form = {
            xtype       : "cp4_formpanel"
            ,id         : "interface_form_rip"
            ,width      : 490
            ,height     : 220
            ,autoScroll : false
            ,listeners  : {
                afterrender     : interface_afterrender
                ,validitychange : function() {
                    CP.ar_util.checkBtnsbar("interface_form_rip");
                }
            }
            ,chkBtns    : function() {
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
                    ,handler2           : function(b) {
                        interface_save();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("rip_configPanel");
                        var f = CP.ar_util.checkFormValid("interface_form_rip");
                        return !(m && f);
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            Ext.getCmp("interface_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "interface_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.checkWindowClose("interface_window_rip");
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            var i = Ext.getCmp("interface_entry");
                            if(i && i.validate) { i.validate(); }
                            var s = Ext.getCmp("simple_entry");
                            if(s && s.validate) { s.validate(); }
                            var m = Ext.getCmp("md5_entry");
                            if(m && m.validate) { m.validate(); }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype           : "tbspacer"
                    ,height         : 15
                }
                ,interface_cmp
                ,{
                    xtype       : "cp4_formpanel"
                    ,width      : 490
                    ,margin     : 0
                    ,padding    : 0
                    ,layout     : {
                        type    : "hbox"
                    }
                    ,items      :[
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Version"
                            ,id             : "version_entry"
                            ,name           : "cp_version"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : 2
                            ,store          :   [[1 ,"v1"]
                                                ,[2 ,"v2"]]
                            ,allowBlank     : false
                            ,listeners      : {
                                change          : function(combo, newV, oldV, eOpts) {
                                    var value = Ext.getCmp("version_entry").getValue();

                                    if(value == 1 || value == "1") {
                                        Ext.getCmp("auth_entry").setValue("");
                                        Ext.getCmp("auth_entry").fireEvent("change");
                                        Ext.getCmp("auth_entry").setDisabled(true);
                                        Ext.getCmp("auth_entry").setVisible(false);

                                        Ext.getCmp("transport_entry").setDisabled(true);
                                        Ext.getCmp("transport_entry").setVisible(false);
                                    } else {
                                        //show and enable
                                        Ext.getCmp("transport_entry").setDisabled(false);
                                        Ext.getCmp("transport_entry").setVisible(true);

                                        Ext.getCmp("auth_entry").setDisabled(false);
                                        Ext.getCmp("auth_entry").setVisible(true);

                                        if(Ext.getCmp("version_entry").originalValue == 1) {
                                            Ext.getCmp("transport_entry").setValue("");
                                            Ext.getCmp("auth_entry").setValue("");
                                        }
                                        Ext.getCmp("auth_entry").fireEvent("change");
                                    }
                                }
                            }
                        },{
                            //metric
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Metric"
                            ,id             : "metric_entry"
                            ,name           : "cp_metric"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,emptyText      : "None"
                            ,value          : ""
                            ,minValue       : 1
                            ,maxValue       : 16
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,getDBValue     : function() {
                                var v = String(this.getRawValue());
                                if (v == "") {
                                    return v;
                                }
                                v = parseInt(v, 10);
                                if (isNaN(v) || v < this.minValue || v > this.maxValue) {
                                    v = "";
                                }
                                return String(v);
                            }
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,width      : 490
                    ,margin     : 0
                    ,padding    : 0
                    ,layout     : {
                        type    : "hbox"
                    }
                    ,items      :[
                        {
                            //accept
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Accept Updates"
                            ,id             : "accept_entry"
                            ,name           : "cp_ripin"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,height         : 22
                            ,checked        : true
                            ,style          : "margin-left:15px;margin-right:15px;"
                        },{
                            //send
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Send Updates"
                            ,id             : "send_entry"
                            ,name           : "cp_ripout"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,height         : 22
                            ,checked        : true
                            ,style          : "margin-left:15px;margin-right:15px;"
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,width      : 490
                    ,margin     : 0
                    ,padding    : 0
                    ,layout     : {
                        type    : "hbox"
                    }
                    ,items      :[
                        {
                            //virtual
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Virtual Address"
                            ,id             : "virtual_entry"
                            ,name           : "cp_virtual"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,height         : 22
                            ,style          : "margin-left:15px;margin-right:15px;"
                        },{
                            //transport
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Transport"
                            ,id             : "transport_entry"
                            ,name           : "cp_transport"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,allowBlank     : false
                            ,store          :   [["t"   ,"Broadcast"]
                                                ,[""    ,"Multicast"]]
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : {
                        type    : "hbox"
                    }
                    ,items          : [
                        {
                            //auth
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Authentication Type"
                            ,id             : "auth_entry"
                            ,name           : "cp_auth"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,allowBlank     : false
                            ,value          : ""
                            ,store          :   [[""        ,"None"]
                                                ,["simple"  ,"Simple"]
                                                ,["md5"     ,"MD5"]]
                            ,listeners      : {
                                change          : function(combo, newV, oldV, eOpts) {
                                    var mode = Ext.getCmp("auth_entry").getValue();
                                    var simple_pass = Ext.getCmp("simple_entry");
                                    var md5_set     = Ext.getCmp("md5_set");

                                    if(simple_pass) {
                                        simple_pass.setVisible(mode == "simple");
                                        simple_pass.setDisabled(mode != "simple");
                                        simple_pass.validate();
                                        simple_pass.clearInvalid();
                                    }

                                    if(md5_set) {
                                        md5_set.setVisible(mode == "md5");
                                        md5_set.setDisabled(mode != "md5");
                                        Ext.getCmp("md5_entry").validate();
                                        Ext.getCmp("md5_entry").clearInvalid();
                                    }
                                }
                            }
                        },{
                            //simple
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "Simple Password"
                            ,id             : "simple_entry"
                            ,name           : "cp_simplepwd"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,inputType      : "password"
                            ,allowBlank     : false
                            ,maxLength      : 16
                            ,enforceMaxLength   : true
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,maskRe         : CP.ar_util.password_maskRe
                            //,stripCharsRe   : CP.ar_util.password_stripCharsRe
                            ,qtipText       : "Up to 16 characters, "
                                            + "alphanumeric and selected symbols ("
                                            + CP.ar_util.password_symbolstring
                                            + ")."
                            ,validator      : function(value) {
                                var aB = this.allowBlank;
                                var cR = CP.ar_util.password_stripCharsRe;
                                return CP.ar_util.CharsRe_validator(aB, value, cR);
                            }
                            ,listeners      : {
                                afterrender     : function(tf, eOpts) {
                                    if(tf.qtipText && tf.qtipText.length > 0) {
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
                    //md5 set
                    xtype           : "cp4_formpanel"
                    ,id             : "md5_set"
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : {
                        type    : "hbox"
                    }
                    ,items          : [
                        {
                            //md5_entry
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "MD5 Key"
                            ,id             : "md5_entry"
                            ,name           : "md5_secret_key"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,inputType      : "password"
                            ,allowBlank     : false
                            ,maxLength      : 16
                            ,enforceMaxLength   : true
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,maskRe         : CP.ar_util.password_maskRe
                            //,stripCharsRe   : CP.ar_util.password_stripCharsRe
                            ,qtipText       : "Up to 16 characters, "
                                            + "alphanumeric and selected symbols ("
                                            + CP.ar_util.password_symbolstring
                                            + ")."
                            ,validator      : function(value) {
                                var aB = this.allowBlank;
                                var cR = CP.ar_util.password_stripCharsRe;
                                return CP.ar_util.CharsRe_validator(aB, value, cR);
                            }
                            ,listeners      : {
                                afterrender     : function(tf, eOpts) {
                                    if(tf.qtipText && tf.qtipText.length > 0) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : tf.getId()
                                            ,text           : tf.qtipText
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                            }
                        },{
                            //cisco checkbox
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Cisco Compatibility"
                            ,id             : "ciscomp_entry"
                            ,name           : "ciscomp"
                            ,labelWidth     : 115
                            ,width          : 115 + 100
                            ,height         : 22
                            ,style          : "margin-left:15px;margin-right:15px;"
                        }
                    ]
                }
            ]
        };

        var interface_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "interface_window_rip"
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

        function interface_save() {
            var params = CP.ar_util.clearParams();

            var intf        = Ext.getCmp("interface_entry").getValue();
            //version independent values
            var metric      = Ext.getCmp("metric_entry").getDBValue();
            var noripin     = (Ext.getCmp("accept_entry").getValue()) ? "" : "t";
            var noripout    = (Ext.getCmp("send_entry").getValue()) ? "" : "t";
            var virtual     = (Ext.getCmp("virtual_entry").getValue()) ? "t" : "";
            //version dependent values
            var version     = Ext.getCmp("version_entry").getValue();
                version     = (version == 2 || version == "2") ? 2 : "";
            var transport   = Ext.getCmp("transport_entry").getValue();
            var auth        = Ext.getCmp("auth_entry").getValue();
            var simple_pass = Ext.getCmp("simple_entry").getValue();
            var md5         = Ext.getCmp("md5_entry").getValue();
            var ciscomp     = (Ext.getCmp("ciscomp_entry").getValue()) ? "t" : "";

            var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":rip:interface:"+ intf;
            var oprefix = ":routed:obscure:instance:"+ CP.ar_util.INSTANCE() +":rip:interface:"+ intf;
            params[prefix]                  = "t";
            params[prefix +":metricout"]    = metric;
            params[prefix +":virtual"]      = virtual;
            params[prefix +":noripin"]      = noripin;
            params[prefix +":noripout"]     = noripout;

            if(version == 2) {
                params[prefix +":version"]                          = "2";
                params[prefix +":broadcast"]                        = transport;
                params[prefix +":auth:null"]                        = "";
                params[prefix +":auth:md5"]                         = "";
                params[prefix +":auth:md5:cisco-interop"]           = "";
                params[prefix +":auth:md5:keyid:0"]                 = "";
                params[prefix +":auth:md5:keyid:0:startaccept"]     = "";
                params[prefix +":auth:md5:keyid:0:startgenerate"]   = "";
                params[prefix +":auth:md5:keyid:0:stopaccept"]      = "";
                params[prefix +":auth:md5:keyid:0:stopgenerate"]    = "";
                params[prefix +":auth:simple"]                      = "";

                switch( String(auth).toLowerCase() ) {
                    case "simple":
                        params[prefix +":authtype"]                 = "simple";
                        params[prefix +":auth:simple"]              = "t";
                        delete(params[prefix +":auth:simple:password"]);
                        if (simple_pass != "") {
                            params[oprefix +":auth:simple:password"]= simple_pass;
                        }
                        params[prefix +":auth:md5:keyid:0:key"]     = "";
                        break;
                    case "md5":
                        params[prefix +":authtype"]                 = "md5";
                        params[prefix +":auth:md5"]                 = "t";
                        params[prefix +":auth:md5:cisco-interop"]   = ciscomp;
                        params[prefix +":auth:md5:keyid:0"]         = "t";
                        delete(params[prefix +":auth:md5:keyid:0:key"]);
                        if (md5 != "") {
                            params[oprefix +":auth:md5:keyid:0:key"]= md5;
                        }
                        params[prefix +":auth:simple:password"]     = "";
                        break;
                    default:
                        params[prefix +":authtype"]                 = "null";
                        params[prefix +":auth:null"]                = "t";
                        params[prefix +":auth:simple:password"]     = "";
                        params[prefix +":auth:md5:keyid:0:key"]     = "";
                }
            } else { //version 1
                params[prefix +":version"]                          = "";
                params[prefix +":broadcast"]                        = "t";
                params[prefix +":auth:null"]                        = "t";
                params[prefix +":auth:md5"]                         = "";
                params[prefix +":auth:md5:cisco-interop"]           = "";
                params[prefix +":auth:md5:keyid:0"]                 = "";
                params[prefix +":auth:md5:keyid:0:key"]             = "";
                params[prefix +":auth:md5:keyid:0:startaccept"]     = "";
                params[prefix +":auth:md5:keyid:0:startgenerate"]   = "";
                params[prefix +":auth:md5:keyid:0:stopaccept"]      = "";
                params[prefix +":auth:md5:keyid:0:stopgenerate"]    = "";
                params[prefix +":auth:simple"]                      = "";
                params[prefix +":auth:simple:password"]             = "";
            }

            CP.ar_util.mySubmit();
        }
    }
}

