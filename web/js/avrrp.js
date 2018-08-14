//searchKeys: cluster
//Advanced VRRP for ExtJS 4

CP.avrrp_4 = {
    PAGELOCK                        : false

    ,QuickAddTitle  : "Add Multiple Monitored-Circuit Virtual Routers"
    ,QuickAddInfo   : "Batch Mode can be used to configure multiple "
                    + "monitored-circuit Virtual Routers in a single step."
                    + "<br>Usage:<br>"
                    + "&lt;Interface&gt; &lt;Mode&gt; &lt;Virtual-Router&gt; "
                    + "&lt;Priority&gt; &lt;Hello Interval&gt; &lt;Backup-Address&gt; "
                    + "&lt;Monitored-Interface&gt; &lt;Priority-Delta&gt; ...<br>"
 // + "&lt;Destination Network&gt;/&lt;Mask Length&gt; &lt;Next Hop Address&gt;<br>"
                    + "e.g.:<br>"
                    + "eth2 mc 10 100 1 1.1.1.100 eth3 10<br>"
                    + "eth0 mc 20 100 1 2.2.2.100 eth1 10 eth2 10 eth3 10<br>"

    ,check_user_action              : function() {
        CP.ar_util.checkBtnsbar("avrrp_global_btnsbar");
        CP.ar_util.checkBtnsbar("vrid_btnsbar");
        CP.ar_util.checkBtnsbar("avrrp_batch_btnsbar");
        CP.ar_util.checkBtnsbar("avrrp_vrid_form");
        CP.ar_util.checkBtnsbar("avrrp_batch_form");
        CP.ar_util.checkBtnsbar("ba_form_avrrp");
        CP.ar_util.checkBtnsbar("mi_form");
    }

    ,validMainPanel                 : function() {
        if (CP.avrrp_4.PAGELOCK) {
            return false;
        }
        var f = Ext.getCmp("avrrp_configPanel");
        return ( f ? f.getForm().isValid() : false );
    }

    ,init                           : function() {
        CP.avrrp_4.defineStores();
        var avrrp_configPanel = CP.avrrp_4.configPanel();

        var obj = {
            title           : "Advanced VRRP"
            ,panel          : avrrp_configPanel
            ,submit         : true
            ,submitURL      : "/cgi-bin/vrrp.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("avrrp_vrid_window");
                CP.ar_util.checkWindowClose("avrrp_batch_window");
                CP.avrrp_4.loadStores();
                                
                // Refresh the monitor tab with the new data
                if (CP && CP.vrrp_monitor_4 && CP.vrrp_monitor_4.doLoad) {
                    CP.vrrp_monitor_4.doLoad();
                }                                                                               
            }
            ,submitFailure  : function() {
                CP.avrrp_4.loadStores();
            }
            ,checkCmpState  : CP.avrrp_4.check_user_action
            ,helpFile       : "vrrpHelp.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//common ajax related functions
    ,mySubmit                       : function() {
        var t = CP.ar_util.checkBlockActivity();
        if (!t) {
            CP.ar_util.loadListPush("mySubmit");
            CP.UI.applyHandler( CP.UI.getMyObj() );
        }
    }
    ,getParams                      : function() {
        var myObj = CP.UI.getMyObj();
        if (myObj) {
            return (myObj.params);
        }
        return false;
    }
    ,clearParams                    : function() {
        //clear params and return reference
        var myObj = CP.UI.getMyObj();
        if (myObj) {
            myObj.params = {};
            //in case a submit occurs without the apply global settings button
            if ( CP.avrrp_4.validMainPanel() ) {
                myObj.params["coldstart"] = Ext.getCmp("coldstart").getDBValue();
                myObj.params["interface_delay"] = Ext.getCmp("interface_delay").getDBValue();
                if (Ext.getCmp("disable_vrs").getValue()) {
                    myObj.params["disable_vrs"] = "true";
                }
                //in case a submit occurs without the apply global settings button
                if (Ext.getCmp("monitorfw").getValue()) {
                    myObj.params["monitorfw"] = "true";
                }
            }
            return (myObj.params);
        }
        return false;
    }
    ,loadStores                     : function() {
        CP.ar_util.loadListPush("intf_store");
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ar_util.loadListPush("avrrp_st");
        Ext.getStore("avrrp_st").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.avrrp_4.emptyStore( Ext.getStore("backupaddrs") );
        CP.avrrp_4.emptyStore( Ext.getStore("monitored_interfaces") );
        CP.avrrp_4.emptyStore( Ext.getStore("mintf_store") );
        CP.avrrp_4.doLoad( Ext.getCmp("avrrp_configPanel") );
    }
    ,emptyStore                     : function(store) {
        if (store) { store.removeAll(); }
    }

//defineStores
    ,defineStores                   : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["vrid_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("vrrp");
        }

        var intf_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,fields     : [
                "intf"
                ,"addr"
                ,"addrmask"
                ,"addr4_list"
                ,"addr6_list"
                ,"broadcast"
                ,"type"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
                    ,"excludeType"  : "6in4 6to4 loopback gre"
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
                load        : function(st) {
                    var r = st.getRange();
                    var i;
                    for (i = 0; i < r.length; i++) {
                        if ( r[i].data.broadcast ) {
                            continue;
                        }
                        switch(String(r[i].data.type).toLowerCase()) {
                            case "ethernet":
                            case "vlan":
                            case "bond":
                                continue;
                                break;
                            default:
                                st.remove(r[i]);
                        }
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        var mcvrs = Ext.create("CP.WebUI4.Store", {
            storeId     : "avrrp_st"
            ,fields     : [
                {
                    name        : "Vrid"
                    ,sortType   : function(v) {
                        if (Ext.typeOf(v) == "number") {
                            return parseInt(v, 10);
                        }
                        return 500;
                    }
                }
                ,{name: "State"}
                ,{name: "Interface"}
                ,{name: "Mode"}
                ,{name: "Local"}
                ,{name: "InternalMode"}
                ,{name: "PrimaryIp"}
                ,{name: "Priority"}
                ,{name: "Hello_Interval"}
                ,{name: "Authentication"}
                ,{name: "Authentication_Password"}
                ,{name: "Authentication_Password_existed"}
                ,{name: "Backup_Address"}
                ,{name: "Vmac_Mode"}
                ,{name: "Static_Vmac"}
                ,{name: "Preempt_Mode"}
                ,{name: "Auto_Deactivation"}
                ,{name: "Monitor_VRRP"}
                ,{name: "Monitored_Interfaces"}
                ,{name: "delete"}
                ,{name: "new"}
                ,"bindings"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/vrrp.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.mcvrs_list"
                }
            }
            ,sorters    :   [{ property: "Vrid", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                    var grid = Ext.getCmp("vrid_grid");
                    if (grid) {
                        grid.getView().refresh();
                    }
                }
            }
        });

        var ba_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "backupaddrs"
            ,fields     : [
                {name   : "bkaddr"}    //="mcvr:vrid:" + vrid + ":addr:" + bkaddr;
                ,{name  : "newrec"}
                ,{name  : "delete"}
                ,{name  : "binding_delete"}
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        var mi_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "monitored_interfaces"
            ,fields     : [
                {name   : "minterface"}
                ,{name  : "delta_priority"}
                ,{name  : "newrec"}
                ,{name  : "binding_delta_priority"}
                ,{name  : "delete"}
                ,{name  : "binding_delete"}
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        var mintf_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "mintf_store"
            ,fields     : [
                {name   : "intf"}
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });
    }

    ,load_ba_store                  : function(rec) {
        Ext.getStore("backupaddrs").loadData(rec.data.Backup_Address);
    }
    ,load_mi_store                  : function(rec) {
        Ext.getStore("monitored_interfaces").loadData(rec.data.Monitored_Interfaces);
    }
    ,load_mintf_store               : function() {
        var mintf_store = Ext.getStore("mintf_store");
        var mi_store    = Ext.getStore("monitored_interfaces");
        var intf_store  = Ext.getStore("intf_store");
        var interface_entry = Ext.getCmp("Interface_entry");

        if ( !mintf_store || !mi_store || !intf_store || !interface_entry) {
            return;
        }

        var intf_recs = Ext.getStore("intf_store").getRange();
        var interface_val = interface_entry.getValue();
        var intf;
        var i;
        CP.avrrp_4.emptyStore( mintf_store );
        for(i = 0; i < intf_recs.length; i++) {
            intf = intf_recs[i].data.intf;
            if ( String(intf) != String(interface_val) ) {
                mintf_store.add({"intf": intf});
            }
        }
    }

//configPanel
    ,configPanel                    : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "avrrp_configPanel"
            ,labelWidth : 150
            ,trackResetOnLoad   : true
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    CP.avrrp_4.doLoad(p);
                }
                ,validitychange : function() {
                    CP.avrrp_4.check_user_action();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("avrrp"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Global Settings"
                }
                ,CP.avrrp_4.get_global_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Virtual Routers"
                }
                ,CP.avrrp_4.get_vrid_set()
                ,CP.avrrp_4.get_vrid_batch_btn_set()
                /*
                ,{
                    xtype   : "cp4_inlinemsg"
                    ,text   : 'Static NAT entries used in VRRP Configuration should be followed by a manual <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/arp_static\', \'url\', \'config\');return false;">Proxy ARP</a> configuration using the VMAC of the VRID.'
                }
                */
            ]
        });
        return configPanel;
    }

    ,doLoad             : function(p) {
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("vrrp");
        }
        CP.avrrp_4.clearParams();
        if (!p) {
            return;
        }
        CP.ar_util.loadListPush("doLoad");
        CP.ar_util.loadListPop("mySubmit");
        p.load({
            url         : ("/cgi-bin/mcvrg.tcl?instance=" + CP.ar_util.INSTANCE() )
            ,method     : "GET"
            ,failure    : function() {
                CP.ar_util.loadListPop("doLoad");
            }
            ,success    : function(p, action) {
                if (action && action.result) {
                    var gData = action.result.data;
                    var Has_Mcvr        = (gData.Has_Mcvr) ? 1 : 0;
                    var Has_Old_Config  = (gData.Has_Old_Config) ? 1 : 0;

                    var coldstart_cmp   = Ext.getCmp("coldstart");
                    var coldstart       = parseInt(gData.coldstart, 10);
                    coldstart           = ( isNaN(coldstart) ) ? "" : coldstart;
                    if (coldstart_cmp) {
                        coldstart_cmp.setValue(coldstart);
                        coldstart_cmp.originalValue = coldstart_cmp.getValue();
                    }

                    var interfacedelay_cmp   = Ext.getCmp("interface_delay");
                    var interfacedelay       = parseInt(gData.interface_delay, 10);
                    interfacedelay           = (isNaN(interfacedelay)) ? "" : interfacedelay;
                    if (interfacedelay_cmp) {
                        interfacedelay_cmp.setValue(interfacedelay);
                        interfacedelay_cmp.originalValue = interfacedelay_cmp.getValue();
                    }

                    var disable_vrs_cmp = Ext.getCmp("disable_vrs");
                    var disable_vrs     = (gData.disable_vrs) ? gData.disable_vrs : false;
                    if (disable_vrs_cmp) {
                        disable_vrs_cmp.setValue(disable_vrs);
                        disable_vrs_cmp.originalValue = disable_vrs_cmp.getValue();
                    }

                    var monitorfw_cmp = Ext.getCmp("monitorfw");
                    var monitorfw     = (gData.monitorfw) ? gData.monitorfw : false;
                    if (monitorfw_cmp) {
                        monitorfw_cmp.setValue(monitorfw);
                        monitorfw_cmp.originalValue = monitorfw_cmp.getValue();
                    }

                    if (Has_Mcvr == 1 && Has_Old_Config == 1) {
                        CP.avrrp_4.bigErrorMessage();
                    } else {
                        CP.avrrp_4.PAGELOCK = false;
                    }

                    var aam_cmp = Ext.getCmp("has_active_mode");
                    if (gData.Has_Active_Mode) {
                        aam_cmp.aam = 1;
                    }
                }
                CP.ar_util.loadListPop("doLoad");
            }
        });
    }

    ,bigErrorMessage                : function() {
        CP.avrrp_4.PAGELOCK = true;
        CP.avrrp_4.check_user_action();
        Ext.Msg.alert("Notice"
            , "Simplifed VRRP configuration is present.  "
            + "The configuration on this page is \"Read Only\".  "
            + "Use the \"Simplified VRRP Configuration\" "
            + "page to delete the configuration."
        );
    }

//get_global_set
    ,get_global_set                 : function() {
	var infoMsg = Ext.create('CP.WebUI4.inlineMsg', {
	    id: 'interface-delay-msg',
	    type: 'info',
	    text: ('Configure a value for Interface Delay'+
		   ' when the Preempt Mode of VRRP '+
		   ' has been turned off.')
	});
        
        return [
            { //Cold Start Delay
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
            },
            { //Interface Delay
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
            },
            { //Disable All Virtual Routers
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Disable All Virtual Routers"
                ,id         : "disable_vrs"
                //,name       : "disable_vrs"
                ,submitValue: false
                ,labelWidth : 150
                ,width      : 200
                ,height     : 22
            },{ //Monitor Firewall State
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Monitor Firewall State"
                ,id         : "monitorfw"
                //,name       : "monitorfw"
                ,submitValue: false
                ,labelWidth : 150
                ,width      : 200
                ,height     : 22
            },{
                xtype       : "cp4_btnsbar"
                ,id         : "avrrp_global_btnsbar"
                ,items      : [
                    {
                        text                : "Apply Global Settings"
                        ,id                 : "avrrp_global_btn"
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            var params = CP.avrrp_4.clearParams();
                            CP.avrrp_4.mySubmit();
                        }
                        ,disabledConditions : function() {
                            return !( CP.avrrp_4.validMainPanel() );
                        }
                    },{
                        text                : "Refresh"
                        ,id                 : "avrrp_refresh_btn"
                        ,overrideNoToken    : false
                        ,handler            : function(b) {
                            if (b && b.handle_no_token()) {
                                CP.avrrp_4.loadStores();
                            }
                        }
                        ,handle_no_token    : function() {
                            var b = this;
                            var d = CP.ar_util.loadListLength() > 0;
                            if (b && b.disabled != d) { b.setDisabled(d); }
                            return !d;
                        }
                        ,listeners          : {
                            disable             : function(btn) {
                                if (btn && btn.handle_no_token) {
                                    btn.handle_no_token();
                                }
                            }
                            ,enable             : function(btn) {
                                if (btn && btn.handle_no_token) {
                                    btn.handle_no_token();
                                }
                            }
                        }
                    }
                ]
            },{
                id      : "has_active_mode"
                ,aam    : 0
            }, infoMsg
        ];
    }

//get_vrid_set
    ,get_vrid_set                   : function() {
        var vrid_btnsbar = {
            xtype       : "cp4_btnsbar"
            ,id         : "vrid_btnsbar"
            ,items      : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Add"
                    ,id                 : "vrid_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("vrid_grid").getSelectionModel().deselectAll();
                        CP.avrrp_4.open_vrid_window();
                    }
                    ,disabledConditions : function() {
                        return !( CP.avrrp_4.validMainPanel() );
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Edit"
                    ,id                 : "vrid_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.avrrp_4.open_vrid_window();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "vrid_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var rec;
                        var vrid_sm = Ext.getCmp("vrid_grid").getSelectionModel();

                        if (vrid_sm.getCount() > 0) {
                            Ext.Msg.show({
                                title   : "Warning"
                                ,msg    : "Are you sure want to delete this Virtual Router?"
                                        + "<br />Press OK to continue."
                                ,animEl : "elId"
                                ,buttons: Ext.Msg.OKCANCEL
                                ,fn     : function(btn, text) {
                                    if (btn == "cancel") {
                                        return;
                                    }
                                    var i;
                                    CP.avrrp_4.clearParams();
                                    recs = vrid_sm.getSelection();
                                    for(i = 0; i < recs.length; i++) {
                                        delete_vrid(recs[i]);
                                    }
                                    CP.avrrp_4.mySubmit();
                                }
                            });
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete All"
                    ,id                 : "vrid_delete_all_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var st = Ext.getStore("avrrp_st");
                        if (st && st.getCount && st.getCount() > 0) {
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
                                    var i;
                                    CP.avrrp_4.clearParams();
                                    var recs = Ext.getStore("avrrp_st").getRange();
                                    for(i = 0; i < recs.length; i++) {
                                        delete_vrid(recs[i]);
                                    }
                                    CP.avrrp_4.mySubmit();
                                }
                            });
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var st = Ext.getStore("avrrp_st");
                        return ( (st && st.getCount) ? st.getCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_vrid(rec) {
            var params = CP.avrrp_4.getParams();
            var i;
            var vrid_store = Ext.getStore("avrrp_st");

            var intf = rec.data.Interface;
            var vrid = rec.data.Vrid;

            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":vrrp";
            var intf_prefix = prefix + ":interface:" + intf;
            var vrid_prefix = intf_prefix + ":virtualrouter:" + vrid;

            params[intf_prefix + ":local_vrid"]                 = "";
            //blank this vrid
            params[vrid_prefix]                                 = "";
            params[vrid_prefix + ":advertiseinterval"]          = "";
            params[intf_prefix + ":authentication"]             = "";
            params[intf_prefix + ":authentication:password"]    = "";
            params[vrid_prefix + ":authentication"]             = "";
            params[vrid_prefix + ":authentication:password"]    = "";
            params[vrid_prefix + ":autodeactivation"]           = "";
            params[vrid_prefix + ":nopreempt"]                  = "";
            params[vrid_prefix + ":monitorvrrp"]                = "";
            params[vrid_prefix + ":priority"]                   = "";
            params[vrid_prefix + ":vmac"]                       = "";
            params[vrid_prefix + ":vmac:static"]                = "";
            //blank backup addresses and monitored interfaces
            var bkaddr;
            for(i = 0; i < rec.data.Backup_Address.length; i++) {
                bkaddr = rec.data.Backup_Address[i].bkaddr;
                params[vrid_prefix + ":address:addr:" + bkaddr] = "";
            }
            var mi;
            for(i = 0; i < rec.data.Monitored_Interfaces.length; i++) {
                mi = rec.data.Monitored_Interfaces[i].minterface;
                params[vrid_prefix + ":monitor:monif:" + mi]                = "";
                params[vrid_prefix + ":monitor:monif:" + mi + ":priority"]  = "";
            }

            //remove rec
            vrid_store.remove(rec);
            //check if any remaining record uses this interface.
            if (-1 == vrid_store.findExact("Interface", intf)) {
                //not found, blank bindings;
                params[intf_prefix] = "";
                params[intf_prefix + ":mode"] = "";
            }
        }

        var vrid_cm = [
            {
                text            : "VRID"
                ,dataIndex      : "Vrid"
                ,width          : 60
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Interface"
                ,dataIndex      : "Interface"
                ,width          : 125
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value;
                    if (value != "" && rec.data.PrimaryIp != "") {
                        retValue += " (" + rec.data.PrimaryIp + ")";
                    }
                    return CP.intf_state.renderer_output(
                        retValue
                        ,retValue
                        ,"left"
                        ,"black"
                        ,value
                        ,"ipv4"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                header          : "VRRP Mode"
                ,dataIndex      : "Vmac_Mode"
                ,width          : 75
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var vmac = "VRRP";
                    switch(String(value).toLowerCase()) {
                        case "interface":   vmac = "Interface";
                            break;
                        case "static":
                            vmac = "Static<br>&nbsp;&nbsp;&nbsp;"
                                + "(" + String(rec.data.Static_Vmac).toUpperCase() + ")";
                            break;
                        case "extended":    vmac = "Extended";
                            break;
                        default:
                    }
                    return CP.ar_util.rendererSpecific(vmac, vmac, "left", "black");
                }
            },{
                text            : "Priority"
                ,dataIndex      : "Priority"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = "100";
                        color = "grey";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Hello Interval"
                ,dataIndex      : "Hello_Interval"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = "1";
                        color = "grey";
                    }
                    if (retValue == "1") {
                        retValue = String(retValue) + " second";
                    } else {
                        retValue = String(retValue) + " seconds";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Preempt"
                ,dataIndex      : "Preempt_Mode"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Auto-deactivation"
                ,dataIndex      : "Auto_Deactivation"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Monitor VRRP"
                ,hidden         : true
                ,dataIndex      : "Monitor_VRRP"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Backup Addresses"
                ,dataIndex      : "Backup_Address"
                ,width          : 125
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retText = "";
                    var i;
                    if (rec.data.Backup_Address.length > 0) {
                        retText = rec.data.Backup_Address[0].bkaddr;
                        if (rec.data.Backup_Address.length > 1) {
                            for(i = 1; i < rec.data.Backup_Address.length; i++) {
                                retText += ",<br />" + rec.data.Backup_Address[i].bkaddr;
                            }
                        }
                    } else {
                        retText = "None";
                    }
                    return CP.ar_util.rendererSpecific(retText, retText, "left", "black");
                }
            },{
                header          : "Monitored Interfaces"
                ,dataIndex      : "Monitored_Interfaces"
                ,flex           : 1
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    function mi_line(mi) {
                        var dp = (mi.delta_priority == "") ? 10 : mi.delta_priority;
                        var mi_value = mi.minterface +" (Priority Delta "+ String(dp) +")";
                        var rawvalue = mi.minterface;
                        return CP.intf_state.format_substr(
                            mi_value
                            ,rawvalue
                            ,"ipv4"
                            ,CP.ar_util.INSTANCE()
                        );
                    }

                    var retText = "";
                    var i;
                    if (rec.data.Monitored_Interfaces.length > 0) {
                        retText = mi_line(rec.data.Monitored_Interfaces[0]);
                        if (rec.data.Monitored_Interfaces.length > 1) {
                            for(i = 1; i < rec.data.Monitored_Interfaces.length; i++) {
                                retText += ",<br />" + mi_line(rec.data.Monitored_Interfaces[i]);
                            }
                        }
                    } else {
                        retText = "None";
                    }
                    return CP.ar_util.rendererSpecific(retText, retText, "left", "black");
                }
            },{
                header          : "State"
                ,dataIndex      : "State"
                ,width          : 125
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var vrid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("vrid_btnsbar");
                }
            }
        });

        var vrid_grid = {
            xtype               : "cp4_grid"
            ,id                 : "vrid_grid"
            ,width              : 1100
            ,height             : 200
            ,margin             : 0
            ,forceFit           : true
            ,store              : Ext.getStore("avrrp_st")
            ,columns            : vrid_cm
            ,selModel           : vrid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("vrid_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            vrid_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ vrid_grid ]
            }
        ];
    }

    ,get_masking_interface          : function(addr) {
        //check if the addr has an interface without being exactly the same?
        var intfs = Ext.getStore("intf_store").getRange();
        var addr4_list;
        var i, j, k;
        var mask, masklen;
        var o = addr.split(".");
        var addr_int = 0;
        for(i = 0; i < 4; i++) {
            addr_int = 256 * addr_int + parseInt(o[i], 10);
        }
        var intf_int;
        for(i = 0; i < intfs.length; i++) {
            addr4_list = intfs[i].data.addr4_list;
            for(j = 0; j < addr4_list.length; j++) {
                if (addr == addr4_list[j].addr4) {
                    //exact match is bad
                    return "exact match";
                }
                //check for masked (without exact)
                masklen = addr4_list[j].mask4;
                if (masklen < 32) { //32 can't be masked without an exact match
                    mask = Math.pow(2, 32 - masklen); //divide with this
                    intf_int = 0;
                    o = addr4_list[j].addr4.split(".");
                    for(k = 0; k < 4; k++) {
                        intf_int = 256 * intf_int + parseInt(o[k], 10);
                    }
                    if ( parseInt(addr_int/mask, 10) == parseInt(intf_int/mask, 10) ) {
                        return String(intfs[i].data.intf);
                    }
                }
            }
        }
        return "unmasked";
    }

    ,open_vrid_window               : function() {
        if (CP.avrrp_4.PAGELOCK) {
            return;
        }
        CP.avrrp_4.clearParams();

        var grid_width = 245;
        var grid_height = 137;
        var ba_mi_resizeObj = {
            minHeight           : grid_height
            ,height             : grid_height
            ,maxHeight          : grid_height * 2
            ,minWidth           : grid_width
            ,width              : grid_width
            ,maxWidth           : grid_width
            ,handles            : "s"
            ,listeners          : {
                beforeresize        : function(r, w, h, e, eOpts) {
                    var g1 = Ext.getCmp("ba_grid_avrrp");
                    var g2 = Ext.getCmp("mi_grid");
                    if ( (!g1) || (!g2) ) { return; }
                    e.stopEvent();
                    var newH = (h < g1.longHeight) ? g1.longHeight : g1.shortHeight;
                    g1.setHeight(newH);
                    g2.setHeight(newH);
                }
            }
        };

        //Backup Address Column
        var ba_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ba_grid_avrrp"
            ,width              : grid_width
            ,height             : grid_height
            ,shortHeight        : grid_height
            ,longHeight         : grid_height * 2
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 15 0 15"
            ,store              : Ext.getStore("backupaddrs")
            ,columns            : [
                {
                    header          : "Backup Address"
                    ,dataIndex      : "bkaddr"
                    ,menuDisabled   : true
                    ,flex           : 1
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(value);
                        var tip = "";
                        var color = "black";
                        switch ( CP.avrrp_4.get_masking_interface(retValue) ) {
                            case "unmasked":
                                color = "red";
                                if (retValue != "") {
                                    tip = "<br>";
                                }
                                tip += "This Backup Address is not masked by an interface."
                                    + "<br>This entry will not be saved.";
                                break;
                            case "exact match":
                                color = "red";
                                if (retValue != "") {
                                    tip = "<br>";
                                }
                                tip += "A Backup Address cannot exactly match an interface\'s address."
                                    + "<br>This entry will not be saved.";
                                break;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue + tip, "left", color);
                    }
                }
            ]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function(view, selections, eOpts) {
                        CP.ar_util.checkBtnsbar("avrrp_vrid_form");
                    }
                }
            })
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("ba_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
            //,resizable          : ba_mi_resizeObj
        };

        var ba_column = {
            xtype   : "cp4_formpanel"
            ,id     : "ba_column"
            ,width  : 275
            ,margin : 0
            ,padding: "0 15 0 15"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Backup Addresses"
                    ,margin     : "14 0 10 0"
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "vrid_ba_btnsbar"
                    ,items      : [
                        {
                            text                : "Add"
                            ,id                 : "ba_add_btn"
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                Ext.getCmp("ba_grid_avrrp").getSelectionModel().deselectAll();
                                CP.avrrp_4.open_ba_window("");
                            }
                            ,disabledConditions : function() {
                                return !( CP.avrrp_4.validMainPanel() );
                            }
                        },{
                            text                : "Edit"
                            ,id                 : "ba_edit_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                var sm = Ext.getCmp("ba_grid_avrrp").getSelectionModel();
                                if (sm) {
                                    var r = sm.getLastSelected();
                                    if (r) {
                                        var t = "Edit Backup Address: "+ String(r.data.bkaddr);
                                        CP.avrrp_4.open_ba_window(t);
                                    }
                                }
                            }
                            ,disabledConditions : function() {
                                if ( !( CP.avrrp_4.validMainPanel() ) ) {
                                    return true;
                                }
                                var g = Ext.getCmp("ba_grid_avrrp");
                                return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                            }
                        },{
                            text                : "Delete"
                            ,id                 : "ba_delete_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                var ba_sm = Ext.getCmp("ba_grid_avrrp").getSelectionModel();
                                var i;
                                var recs = ba_sm.getSelection();
                                var ba_st = Ext.getStore("backupaddrs");
                                ba_st.remove(recs);
                            }
                            ,disabledConditions : function() {
                                if ( !( CP.avrrp_4.validMainPanel() ) ) {
                                    return true;
                                }
                                var g = Ext.getCmp("ba_grid_avrrp");
                                return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                            }
                        }
                    ]
                }
            ]
        };

        //Monitored Interfaces Column
        var mi_grid = {
            xtype               : "cp4_grid"
            ,id                 : "mi_grid"
            ,width              : grid_width
            ,height             : grid_height
            ,shortHeight        : grid_height
            ,longHeight         : grid_height * 2
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : "0 0 0 15"
            ,store              : Ext.getStore("monitored_interfaces")
            ,columns            : [
                {
                    header          : "Monitored Interfaces"
                    ,dataIndex      : "minterface"
                    ,width          : 145
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
                    header          : "Priority Delta"
                    ,dataIndex      : "delta_priority"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = value;
                        var color = "black";
                        if (retValue == "") {
                            retValue = "10";
                            color = "gray";
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                }
            ]
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect       : true
                ,mode               : "MULTI"
                ,listeners          : {
                    selectionchange     : function() {
                        CP.ar_util.checkBtnsbar("avrrp_vrid_form");
                    }
                }
            })
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("mi_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
            //,resizable          : ba_mi_resizeObj
        };

        var mi_column = {
            xtype   : "cp4_formpanel"
            ,id     : "mi_column"
            ,width  : 260
            ,margin : 0
            ,padding: "0 0 0 15"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Monitored Interfaces"
                    ,margin     : "14 0 10 0"
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "vrid_mi_btnsbar"
                    ,items      : [
                        {
                            text                : "Add"
                            ,id                 : "mi_add_btn"
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                var ic = Ext.getCmp("Interface_entry");
                                Ext.getCmp("mi_grid").getSelectionModel().deselectAll();
                                if (ic && ic.getXType() == "cp4_combobox" &&
                                    !(ic.isDisabled()) ) {
                                        //ic is a combobox and enabled
                                        //then show a message with ok/cancel
                                        Ext.Msg.show({
                                            title   : "Warning"
                                            ,msg    : "Adding a Monitored Interface "
                                                    + "will lock the Interface for "
                                                    + "this Virtual Route."
                                                    + "<br />Press OK to continue."
                                            ,animEl : "elId"
                                            ,buttons: Ext.Msg.OKCANCEL
                                            ,icon   : Ext.MessageBox.QUESTION
                                            ,fn     : function(btn, text) {
                                                if (btn == "cancel") {
                                                    return;
                                                }
                                                Ext.getCmp("Interface_entry").disable();
                                                CP.avrrp_4.open_mi_window();
                                            }
                                        });
                                } else {
                                    CP.avrrp_4.open_mi_window();
                                }
                            }
                            ,disabledConditions : function() {
                                if ( !( CP.avrrp_4.validMainPanel() ) ) {
                                    return true;
                                }
                                var intf_cmp = Ext.getCmp("Interface_entry");
                                var i = (intf_cmp ? intf_cmp.getValue() : "");
                                switch ( Ext.typeOf(i) ) {
                                    case "undefined":
                                    case "null":
                                    case "whitespace":
                                        i = "";
                                        break;
                                    case "boolean":
                                        if (!i) {
                                            i = "";
                                        }
                                        break;
                                    default:
                                }
                                return (i == "");
                            }
                        },{
                            text                : "Edit"
                            ,id                 : "mi_edit_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b) {
                                CP.avrrp_4.open_mi_window();
                            }
                            ,disabledConditions : function() {
                                if ( !( CP.avrrp_4.validMainPanel() ) ) {
                                    return true;
                                }
                                var g = Ext.getCmp("mi_grid");
                                return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                            }
                        },{
                            text                : "Delete"
                            ,id                 : "mi_delete_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                var mi_sm = Ext.getCmp("mi_grid").getSelectionModel();
                                var i;
                                var recs = mi_sm.getSelection();
                                var mi_st = Ext.getStore("monitored_interfaces");
                                mi_st.remove(recs);
                            }
                            ,disabledConditions : function() {
                                if ( !( CP.avrrp_4.validMainPanel() ) ) {
                                    return true;
                                }
                                var g = Ext.getCmp("mi_grid");
                                return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                            }
                        }
                    ]
                }
            ]
        };

        //main form
        //dynamic components
        var Vrid_obj;       var Interface_obj;
        if (Ext.getCmp("vrid_grid").getSelectionModel().hasSelection()) {
            //edit = cp4_displayfield and cp4_displayfield
            Vrid_obj = {
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Virtual Router ID"
                ,id         : "Vrid_entry"
                ,name       : "Vrid"
                ,labelWidth : 100
                ,width      : 100 + 145
                ,height     : 22
                ,style      : "margin-left:15px;"
            };
            Interface_obj = {
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Interface"
                ,id         : "Interface_entry"
                ,name       : "Interface"
                ,labelWidth : 100
                ,width      : 100 + 145
                ,height     : 22
                ,style      : "margin-left:15px;margin-right:15px;"
            };
        } else {
            //new - cp4_numberfield and cp4_combobox
            Vrid_obj = {
                xtype           : "cp4_numberfield"
                ,fieldLabel     : "Virtual Router ID"
                ,id             : "Vrid_entry"
                ,name           : "Vrid"
                ,labelWidth     : 100
                ,width          : 100 + 145
                ,allowBlank     : false
                ,allowDecimals  : false
                ,minValue       : 1
                ,maxValue       : 255
                ,maxLength      : 3
                ,enforceMaxLength   : true
                ,style          : "margin-left:15px;"
                ,validator      : function(value) {
                    var intf = Ext.getCmp("Interface_entry").getValue();
                    var Vrid = Ext.getCmp("Vrid_entry").getValue();
                    var rec = Ext.getStore("avrrp_st").getRange();
                    var i;
                    for(i = 0; i < rec.length; i++) {
                        if (rec[i].data.Interface == intf && rec[i].data.Vrid == Vrid) {
                            return "This VRID is already in use on this interface.";
                        }
                    }
                    return true;
                }
            };
            Interface_obj = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "Interface_entry"
                ,name           : "Interface"
                ,labelWidth     : 100
                ,width          : 100 + 145
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("intf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,style          : "margin-left:15px;margin-right:15px;"
                ,listeners      : {
                    select          : function(combo, recs, eOpts) {
                        var intf = combo.getValue();
                        var intf_store = Ext.getStore("intf_store");
                        var index = intf_store.findExact("intf",intf);
                        if (index != -1) {
                            var rec = intf_store.getAt(index);
                            Ext.getCmp("PrimaryIp_entry").setValue(rec.data.addrmask);
                        }
                        CP.avrrp_4.check_user_action();
                        Ext.getCmp("Vrid_entry").validate();
                    }
                }
            };
        }

        function vrid_afterrender(p, eOpts) {
            if (p && p.form) { p.form._boundItems = null; }
            var params = CP.avrrp_4.clearParams();

            var vrid_sm = Ext.getCmp("vrid_grid").getSelectionModel();
            if (vrid_sm.hasSelection()) {
                //edit
                var rec = vrid_sm.getLastSelected();
                p.loadRecord(rec);
                //load available interfaces for the monitored interface store

                Ext.getCmp("avrrp_vrid_window").setTitle(
                    "Edit Virtual Router " + rec.data.Vrid
                    + " on Interface " + rec.data.Interface
                );

                if (rec.data.newrec) {
                    Ext.getCmp("newrec_entry").setValue(true);
                } else {
                    Ext.getCmp("newrec_entry").setValue(false);
                }

                var aam_cmp = Ext.getCmp("has_active_mode"); 
                var preempt = Ext.getCmp("Preempt_Mode_entry");
                var monitor_vrrp = Ext.getCmp("Monitor_VRRP_entry");
                monitor_vrrp.originalValue = monitor_vrrp.getValue();
                preempt.originalValue = preempt.getValue();
                if (rec.data.Preempt_Mode || aam_cmp.aam) {
                    monitor_vrrp.setDisabled(true);
                }
                if (rec.data.Monitor_VRRP) {
                    preempt.setDisabled(true);
                }

                var staticVMAC = Ext.getCmp("Static_Vmac_entry");
                var isStatic = (String(rec.data.Vmac_Mode).toLowerCase() == "static");
                if (staticVMAC) {
                    staticVMAC.setVisible( isStatic );
                    staticVMAC.setDisabled( !isStatic );
                }
                var simple = Ext.getCmp("Authentication_Password_entry");
                var isSimple = (String(rec.data.Authentication).toLowerCase() == "simple");
                if (simple) {
                    simple.setVisible( isSimple );
                    simple.setDisabled( !isSimple );
                    var exed = rec.data.Authentication_Password_existed;
                    simple.allowBlank = exed ? true : false;
                    simple.emptyText = exed ? "Key is set" : "";
                    simple.reset();
                    simple.validate();
                }

                CP.avrrp_4.load_ba_store(rec);
                CP.avrrp_4.load_mi_store(rec);
                CP.avrrp_4.load_mintf_store();
                var i, a, b;
                var bkaddrs = rec.data.Backup_Address;
                b   = "routed:instance:"+ CP.ar_util.INSTANCE() +":vrrp"
                    + ":interface:"+ rec.data.Interface +":virtualrouter:"
                    + rec.data.Vrid +":address:addr:";
                for(i = 0; i < bkaddrs.length; i++) {
                    a = bkaddrs[i].bkaddr;
                    params[b + a] = "";
                }
                var mon_intfs = rec.data.Monitored_Interfaces;
                b   = "routed:instance:"+ CP.ar_util.INSTANCE() +":vrrp"
                    + ":interface:"+ rec.data.Interface +":virtualrouter:"
                    + rec.data.Vrid +":monitor:monif:";
                var mi;
                for(i = 0; i < mon_intfs.length; i++) {
                    mi = mon_intfs[i].minterface;
                    params[b + mi]              = "";
                    params[b + mi +":priority"] = "";
                }
            } else {
                //new
                Ext.getCmp("avrrp_vrid_window").setTitle("Add New Virtual Router");
                Ext.getCmp("newrec_entry").setValue(true);
                Ext.getCmp("Preempt_Mode_entry").setValue(true);
                Ext.getCmp("Auto_Deactivation_entry").setValue(false);
		Ext.getCmp("Monitor_VRRP_entry").setDisabled(true);
                Ext.getCmp("Static_Vmac_entry").hide();
                Ext.getCmp("Static_Vmac_entry").disable();
                Ext.getCmp("Authentication_Password_entry").hide();
                Ext.getCmp("Authentication_Password_entry").disable();

                //disable add monitored interfaces button until an Interface is selected
                Ext.getCmp("mi_add_btn").disable();

                CP.avrrp_4.emptyStore( Ext.getStore("backupaddrs") );
                CP.avrrp_4.emptyStore( Ext.getStore("monitored_interfaces") );
                CP.avrrp_4.emptyStore( Ext.getStore("mintf_store") );
            }

            if (p && p.chkBtns) { p.chkBtns(); }
        }

        function vrid_save() {
            var vrid_sm = Ext.getCmp("vrid_grid").getSelectionModel();
            var params = CP.avrrp_4.getParams();

            var vrid = Ext.getCmp("Vrid_entry").getValue();
            var intf = Ext.getCmp("Interface_entry").getValue();
            //the following variables are named by their binding suffix
            var local_vrid          = "";   //should we bother supporting VRRPv2 in legacy?
            var mode                = "monitoredcircuit";
            var advertiseinterval   = Ext.getCmp("Hello_Interval_entry").getValue();
            var autodeactivation    = Ext.getCmp("Auto_Deactivation_entry").getValue();
            var authentication      = String(Ext.getCmp("Authentication_entry").getValue()).toLowerCase();
            var password            = "";
            switch(authentication) {
                case "simple":
                    password        = Ext.getCmp("Authentication_Password_entry").getDBValue();
                    break;
                default:
                    authentication  = "";
            }
            var preempt             = Ext.getCmp("Preempt_Mode_entry").getValue();
            var priority            = Ext.getCmp("Priority_entry").getDBValue();
            var monitor_vrrp        = false;
            var vmac                = String(Ext.getCmp("Vmac_Mode_entry").getValue()).toLowerCase();
            var vmac_static         = "";
            if (vmac == "static") {
                vmac_static = String(Ext.getCmp("Static_Vmac_entry").getDBValue()).toLowerCase();
            }

            if (!preempt) {
                monitor_vrrp = Ext.getCmp("Monitor_VRRP_entry").getValue();
            }

            if (!(vrid_sm.hasSelection())) {
                //new
                if (Ext.getStore("avrrp_st").findExact("vrid",vrid) != -1) {
                    //duplicate
                    Ext.Msg.alert(
                        "Warning: Virtual Router Already Exists"
                        ,"A Virtual Router with this ID already Exists."
                    );
                    return;
                }
                Ext.getStore("avrrp_st").add({
                    "State"                     : ""
                    ,"Vrid"                     : vrid
                    ,"Interface"                : intf
                    ,"PrimaryIp"                : Ext.getCmp("PrimaryIp_entry").getValue()
                    ,"Mode"                     : mode
                    ,"Local"                    : local_vrid
                    ,"Priority"                 : priority
                    ,"Hello_Interval"           : advertiseinterval
                    ,"Authentication"           : authentication
                    ,"Authentication_Password"  : password
                    ,"Vmac_Mode"                : vmac
                    ,"Static_Vmac"              : vmac_static
                    ,"Preempt_Mode"             : preempt
                    ,"Monitor_VRRP"             : monitor_vrrp
                    ,"Auto_Deactivation"        : autodeactivation
                    ,"Backup_Address"           : []
                    ,"Monitored_Interfaces"     : []
                });
                Ext.getCmp("vrid_grid").getView().refresh();
            }

            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":vrrp";
            var intf_prefix = prefix + ":interface:" + intf;
            params[intf_prefix] = "t";
            params[intf_prefix + ":local_vrid"] = local_vrid;   //local_vrid
            params[intf_prefix + ":mode"]       = mode;

            var vr_prefix = intf_prefix + ":virtualrouter:" + vrid;
            params[vr_prefix] = "t";
            params[vr_prefix + ":advertiseinterval"]= advertiseinterval;
            params[vr_prefix + ":autodeactivation"] = autodeactivation ? "t" : "";
            params[intf_prefix + ":authentication"]             = authentication;
            var pwn = intf_prefix + ":authentication:password";
            delete(params[pwn]);
            if (password != "" || authentication == "") {
                pwn = pwn.replace(/^routed:/, ":routed:obscure:");
                params[pwn]                                     = password;
            }
            params[vr_prefix + ":authentication"]               = "";
            params[vr_prefix + ":authentication:password"]      = "";
            params[vr_prefix + ":nopreempt"]        = preempt ? "" : "t";
            params[vr_prefix + ":monitorvrrp"] = monitor_vrrp ? "t" : "";
            params[vr_prefix + ":priority"]         = priority;
            params[vr_prefix + ":vmac"]             = vmac;
            params[vr_prefix + ":vmac:static"]      = vmac_static;

            var ba = Ext.getStore("backupaddrs").getRange();
            var mi = Ext.getStore("monitored_interfaces").getRange();
            var ba_prefix = vr_prefix + ":address:addr";
            var mi_prefix = vr_prefix + ":monitor:monif";
            var i, v, dp;
            for(i = 0; i < ba.length; i++) {
                switch ( CP.avrrp_4.get_masking_interface(ba[i].data.bkaddr) ) {
                    case "unmasked":
                    case "exact match":
                        v = false;
                        break;
                    default:
                        v = true;
                }
                params[ba_prefix +":"+ ba[i].data.bkaddr] = (v ? "t" : "");
            }
            for(i = 0; i < mi.length; i++) {
                v = (intf != mi[i].data.minterface);
                dp = mi[i].data.delta_priority;
                params[mi_prefix +":"+ mi[i].data.minterface]               = (v ? "t" : "");
                params[mi_prefix +":"+ mi[i].data.minterface +":priority"]  = (v ? dp : "");
            }
            Ext.getCmp("ba_grid_avrrp").getSelectionModel().deselectAll();
            Ext.getCmp("mi_grid").getSelectionModel().deselectAll();

            //closed afterSubmit or on submitFailure
            CP.avrrp_4.mySubmit();
        }

        var vrid_form = {
            xtype       : "cp4_formpanel"
            ,id         : "avrrp_vrid_form"
            ,width      : 560
            ,height     : 468
            ,padding    : 0
            ,margin     : 0
            ,autoScroll : true
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("vrid_ba_btnsbar");
                CP.ar_util.checkBtnsbar("vrid_mi_btnsbar");
                CP.ar_util.checkDisabledBtn("vrid_save_btn");
                CP.ar_util.checkDisabledBtn("vrid_cancel_btn");
            }
            ,listeners  : {
                afterrender     : vrid_afterrender
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "vrid_save_btn"
                    ,text               : "Save"
                    ,formBind           : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        vrid_save(b,e);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("avrrp_vrid_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("vrid_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "vrid_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.avrrp_4.clearParams();
                        CP.ar_util.checkWindowClose("avrrp_vrid_window");
                    }
                    ,disabledConditions : function() {
                        return !( CP.avrrp_4.validMainPanel() );
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            //validate no allowBlanks
                            Ext.getCmp("Vrid_entry").validate();
                            Ext.getCmp("Interface_entry").validate();
                            Ext.getCmp("Static_Vmac_entry").validate();
                            Ext.getCmp("Authentication_Password_entry").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "newrec"
                    ,id         : "newrec_entry"
                    ,name       : "newrec"
                    ,hidden     : true
                    ,hideLabel  : true
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,width      : 540
                    ,autoScroll : false
                    ,padding    : 0
                    ,margin     : "15 0 0 0"
                    ,items      : [
                        //VRID and Interface
                        Interface_obj
                        ,Vrid_obj
                        //State and PrimaryIp
                        ,{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "VRRP State"
                            ,id         : "State_entry"
                            ,name       : "State"
                            ,labelWidth : 100
                            ,width      : 100 + 145
                            ,height     : 22
                            ,style      : "margin-left:15px;margin-right:15px;"
                        },{
                            xtype       : "cp4_displayfield"
                            ,fieldLabel : "Primary IP"
                            ,id         : "PrimaryIp_entry"
                            ,name       : "PrimaryIp"
                            ,labelWidth : 100
                            ,width      : 100 + 145
                            ,height     : 22
                            ,style      : "margin-left:15px;"
                        }
                        //Priority and Hello_Interval
                        ,{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Priority"
                            ,id             : "Priority_entry"
                            ,name           : "Priority"
                            ,labelWidth     : 100
                            ,width          : 100 + 145
                            ,value          : ""
                            ,emptyText      : "Default: 100"
                            ,minValue       : 1
                            ,maxValue       : 254
                            ,maxLength      : 3
                            ,enforceMaxLength   : true
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,getDBValue     : function() {
                                var c = this;
                                var v = c.getRawValue();
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
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Hello Interval"
                            ,id             : "Hello_Interval_entry"
                            ,name           : "Hello_Interval"
                            ,labelWidth     : 100
                            ,width          : 100 + 145
                            ,value          : ""
                            ,emptyText      : "Default: 1"
                            ,minValue       : 1
                            ,maxValue       : 255
                            ,maxLength      : 3
                            ,enforceMaxLength   : true
                            ,allowBlank     : true
                            ,allowDecimals  : false
                            ,style          : "margin-left:15px;"
                            ,getDBValue     : function() {
                                var c = this;
                                var v = c.getRawValue();
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
                        }
                        //Preempt Mode and Auto-Deactivation
                        ,{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Preempt Mode"
                            ,id             : "Preempt_Mode_entry"
                            ,name           : "Preempt_Mode"
                            ,labelWidth     : 100
                            ,width          : 100 + 145
                            ,height         : 22
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,listeners      : {
                                change         : function() {
                                    var monitor_vrrp = Ext.getCmp("Monitor_VRRP_entry");
                                    var aam = Ext.getCmp("has_active_mode").aam;
                                    if (this.getValue() == true || aam) {
                                        monitor_vrrp.setValue(false);
                                    } else {
                                        monitor_vrrp.setValue(monitor_vrrp.originalValue);
                                    }
                                    monitor_vrrp.setDisabled(this.getValue() || aam);
                                }
                            }
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Auto-deactivation"
                            ,id             : "Auto_Deactivation_entry"
                            ,name           : "Auto_Deactivation"
                            ,labelWidth     : 100
                            ,width          : 100 + 145
                            ,height         : 22
                            ,style          : "margin-left:15px;"
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Monitor VRRP"
                            ,id             : "Monitor_VRRP_entry"
                            ,name           : "Monitor_VRRP"
                            //,disabled       : true
                            ,hidden         : true
                            ,labelWidth     : 100
                            ,width          : 100 + 145
                            ,height         : 22
                            ,style          : "margin-left:15px;margin-right:15px;"
                            ,listeners      : {
                                change         : function() {
                                    var preempt = Ext.getCmp("Preempt_Mode_entry");
                                    if (this.getValue() == true) {
                                        preempt.setValue(false);
                                    } else {
                                        preempt.setValue(preempt.originalValue);
                                    }
                                    preempt.setDisabled(this.getValue());
                                }
                            }
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "vmac_auth_subform"
                    ,layout     : "column"
                    ,width      : 540
                    ,height     : 54
                    ,autoScroll : true
                    ,padding    : 0
                    ,margin     : "0 0 0 0"
                    ,items      : [
                        {
                            xtype       : "cp4_formpanel"
                            ,width      : 275
                            ,height     : 54
                            ,autoScroll : false
                            ,padding    : 0
                            ,margin     : 0
                            ,items      : [ //VMAC Mode and its Static Mac
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "VMAC Mode"
                                    ,id             : "Vmac_Mode_entry"
                                    ,name           : "Vmac_Mode"
                                    ,labelWidth     : 100
                                    ,width          : 100 + 145
                                    ,allowBlank     : false
                                    ,editable       : false
                                    ,value          : ""
                                    ,queryMode      : "local"
                                    ,triggerAction  : "all"
                                    ,store          :   [[""            ,"VRRP"]
                                                        ,["interface"   ,"Interface"]
                                                        ,["static"      ,"Static"]
                                                        ,["extended"    ,"Extended"]]
                                    ,style          : "margin-left:15px;"
                                    ,listeners      : {
                                        select          : function(combo, recs, eOtps) {
                                            var StaticMAC = Ext.getCmp("Static_Vmac_entry");
                                            var notStatic = String(combo.getValue()).toLowerCase() != "static";
                                            StaticMAC.setVisible( !notStatic );
                                            StaticMAC.setDisabled( notStatic );
                                            StaticMAC.validate();
                                        }
                                    }
                                },{
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Static VMAC"
                                    ,id             : "Static_Vmac_entry"
                                    ,name           : "Static_Vmac"
                                    ,labelWidth     : 100
                                    ,width          : 100 + 145
                                    ,vtype          : "mac"
                                    ,allowBlank     : false
                                    ,style          : "margin-left:15px;"
                                    ,maxLength      : 17
                                    ,enforceMaxLength: true
                                    ,maskRe         : /[:0-9a-fA-F]/
                                    ,getDBValue     : function() {
                                        var c = this;
                                        var v = String(c.getRawValue()).toLowerCase();
                                        var m = String(Ext.getCmp("Vmac_Mode_entry").getValue()).toLowerCase();
                                        if (m != "static") {
                                            v = "";
                                        }
                                        if (v != "" && v.length != 17) {
                                            v = "";
                                        }
                                        return v;
                                    }
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,width      : 260
                            ,height     : 54
                            ,autoScroll : false
                            ,padding    : 0
                            ,margin     : 0
                            ,items      : [ //Auth and its Password
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Authentication"
                                    ,id             : "Authentication_entry"
                                    ,name           : "Authentication"
                                    ,labelWidth     : 100
                                    ,width          : 100 + 145
                                    ,allowBlank     : false
                                    ,editable       : false
                                    ,value          : ""
                                    ,queryMode      : "local"
                                    ,triggerAction  : "all"
                                    ,store          :   [[""        ,"None"]
                                                        ,["simple"  ,"Simple"]]
                                    ,style          : "margin-left:15px;"
                                    ,listeners      : {
                                        select          : function(c, recs, eOtps) {
                                            var simple = Ext.getCmp("Authentication_Password_entry");
                                            var isSimple = (String(c.getValue()).toLowerCase() == "simple");
                                            if (simple) {
                                                simple.setVisible( isSimple );
                                                simple.setDisabled( !isSimple );
                                                simple.validate();
                                            }
                                        }
                                    }
                                },{
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Password"
                                    ,id             : "Authentication_Password_entry"
                                    ,name           : "Authentication_Password"
                                    ,labelWidth     : 100
                                    ,width          : 100 + 145
                                    ,allowBlank     : false
                                    ,maxLength      : 8
                                    ,enforceMaxLength   : true
                                    ,inputType      : "password"
                                    ,style          : "margin-left:15px;"
                                    ,maskRe         : /[^\\ ]/
                                    ,stripCharsRe   : /[\\ ]/
                                    ,qtipText       : "Up to 8 characters, no spaces of \'\\\'."
                                    ,listeners      : {
                                        afterrender     : function(tf, eOpts) {
                                            if (tf.qtipText && tf.qtipText.length > 0) {
                                                Ext.tip.QuickTipManager.register({
                                                    target          : tf.getId()
                                                    ,text           : tf.qtipText
                                                    ,dismissDelay   : 0
                                                });
                                            }
                                        }
                                    }
                                    ,getDBValue     : function() {
                                        var c = this;
                                        var s = Ext.getCmp("Authentication_entry");
                                        if (String(s.getValue()).toLowerCase() == "simple") {
                                            return ( c.getRawValue() );
                                        }
                                        return "";
                                    }
                                }
                            ]
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,layout     : "column"
                    ,width      : 540
                    //,autoScroll : false
                    ,padding    : 0
                    ,margin     : "0 0 0 0"
                    ,items      : [
                        //BA and MI columns
                        ba_column
                        ,mi_column
                        ,ba_grid
                        ,mi_grid
                        //,{xtype: "tbspacer", height: 15, width: 500}
                    ]
                }
            ]
        };

        var vrid_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "avrrp_vrid_window"
            ,title      : "placeholder"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ vrid_form ]
        });
        vrid_window.show();
    }

//add a Backup Address window
    ,open_ba_window                 : function(TITLE) {
        if (!TITLE) {
            TITLE = "Add Backup Address";
        }
        var ba_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ba_form_avrrp"
            ,width      : 265
            ,autoScroll : false
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("ba_save_btn");
                CP.ar_util.checkDisabledBtn("ba_cancel_btn");
            }
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    var sm = Ext.getCmp("ba_grid_avrrp").getSelectionModel();
                    var bk_cmp = Ext.getCmp("bkaddr_entry");
                    if (sm.getCount() == 1) {
                        var rec = sm.getLastSelected();
                        if (rec.data.bkaddr != "") {
                            bk_cmp.setValue(rec.data.bkaddr);
                            bk_cmp.originalValue = rec.data.bkaddr;
                        }
                    }
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "ba_save_btn"
                    ,text               : "Ok"
                    ,formBind           : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        ba_save(b,e);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("ba_form_avrrp");
                        return !( f ? f.getForm().isValid() : false);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("ba_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "ba_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("ba_window_avrrp");
                    }
                    ,disabledConditions : function() {
                        return !( CP.avrrp_4.validMainPanel() );
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            if (Ext.getCmp("bkaddr_entry").validate) {
                                Ext.getCmp("bkaddr_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 245
                    ,margin     : "15 0 8 15"
                    ,items      : [
                        {
                            xtype           : "cp4_ipv4field"
                            ,id             : "bkaddr_entry"
                            ,originalValue  : ""
                            ,fieldConfig    : {
                                name        : "bkaddr"
                                ,allowBlank : false
                            }
                        }
                    ]
                }
            ]
        };

        var ba_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ba_window_avrrp"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("avrrp_vrid_window").getPosition();
                    win.setPosition(285 + pos[0], 222 + pos[1]);
                }
            }
            ,items      : [ ba_form ]
        });
        ba_window.show();

        function ba_save() {
            var ba_grid = Ext.getCmp("ba_grid_avrrp");
            var ba_sm = ba_grid.getSelectionModel();
            var ba_store = Ext.getStore("backupaddrs");
            var ba_cmp = Ext.getCmp("bkaddr_entry");
            var bkaddr = ba_cmp.getValue();
            var oldbk = ba_cmp.originalValue;
            var oldrec = false;
            var idx = -1;
            var m = CP.addr_list.getMatchMessage(bkaddr);
            if (m != "") {
                Ext.Msg.alert("Warning", m);
                return;
            }
            switch ( CP.avrrp_4.get_masking_interface(bkaddr) ) {
                case "unmasked":
                    Ext.Msg.alert("Warning"
                        ,"This Backup Address is not masked by an interface.");
                    return;
                case "exact match":
                    Ext.Msg.alert("Warning"
                        ,"A Backup Address cannot exactly match an interface\'s address.");
                    return;
            }

            if (oldbk != "" && oldbk != bkaddr) {
                oldrec = ba_store.findRecord("bkaddr", oldbk);
                if (oldrec) {
                    ba_store.remove(oldrec);
                }
            }
            if (bkaddr != "") {
                idx = ba_store.findExact("bkaddr", bkaddr);
                if (idx == -1) {
                    ba_store.add({
                        "bkaddr"    : bkaddr
                        ,"newrec"   : true
                    });
                }
            }
            ba_grid.getView().refresh();
            CP.ar_util.checkWindowClose("ba_window_avrrp");
        }
    }

//add a Monitored Interface - check that it doesn't match the Interface_entry value
    ,open_mi_window                 : function() {
        var minterface_obj;
        var mi_sm = Ext.getCmp("mi_grid").getSelectionModel();
        if (mi_sm.hasSelection()) {
            //edit
            minterface_obj = {
                xtype       : "cp4_displayfield"
                ,fieldLabel : "Interface"
                ,id         : "minterface_entry"
                ,name       : "minterface"
                ,labelWidth : 100
                ,width      : 255
                ,height     : 22
            };
        } else {
            //new
            //TODO this is the place to filter the combobox's store
            CP.avrrp_4.load_mintf_store();
            minterface_obj = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Interface"
                ,id             : "minterface_entry"
                ,name           : "minterface"
                ,labelWidth     : 100
                ,width          : 255
                ,queryMode      : "local"
                ,editable       : false
                ,triggerAction  : "all"
                ,store          : Ext.getStore("mintf_store")
                ,valueField     : "intf"
                ,displayField   : "intf"
                ,allowBlank     : false
                ,listeners      : {
                    change          : function(c, newValue, oldValue, eOpts) {
                        var v = c.getValue();
                        var dp = Ext.getCmp("delta_priority_entry");
                        if (dp && dp.adjustMaxValue) {
                            dp.adjustMaxValue(v);
                            if (dp.validate) {
                                dp.validate();
                            }
                        }
                    }
                }
            };
        }

        var mi_form = {
            xtype       : "cp4_formpanel"
            ,id         : "mi_form"
            ,width      : 288
            ,autoScroll : false
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("mi_save_btn");
                CP.ar_util.checkDisabledBtn("mi_cancel_btn");
            }
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    var mi_sm = Ext.getCmp("mi_grid").getSelectionModel();
                    var mintf = "";
                    if (mi_sm.hasSelection()) {
                        var rec = mi_sm.getLastSelected();
                        p.loadRecord(rec);
                        mintf = rec.data.minterface;
                        Ext.getCmp("mi_window").setTitle("Edit Monitored Interface");
                    } else {
                        Ext.getCmp("mi_window").setTitle("Add Monitored Interface");
                    }
                    var dpe = Ext.getCmp("delta_priority_entry");
                    if (dpe && dpe.adjustMaxValue) {
                        dpe.adjustMaxValue(mintf);
                    }
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "mi_save_btn"
                    ,text               : "Ok"
                    ,formBind           : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        mi_save(b,e);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("mi_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("mi_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "mi_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("mi_window");
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            if (Ext.getCmp("minterface_entry").getXType() == "cp4_combobox") {
                                Ext.getCmp("minterface_entry").validate();
                            }
                            Ext.getCmp("delta_priority_entry").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 256
                    ,margin     : "15 0 8 15"
                    ,items      : [
                        minterface_obj
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Priority Delta"
                            ,id                 : "delta_priority_entry"
                            ,name               : "delta_priority"
                            ,labelWidth         : 100
                            ,width              : 190
                            ,allowBlank         : true
                            ,emptyText          : "Default: 10"
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 254
                            ,value              : 10
                            ,maxLength          : 3
                            ,enforceMaxLength   : true
                            ,validator          : function(v) {
                                var c = this;
                                if ( v == "" ) { return true; }
                                if ( v < c.minValue || v > c.adjustMaxValue(false) ) {
                                    return "";
                                }
                                return true;
                            }
                            ,adjustMaxValue     : function(intf) {
                                var c = this;
                                switch ( Ext.typeOf(intf) ) {
                                    case "string":
                                        break;
                                    default:
                                        intf = Ext.getCmp("minterface_entry").getValue();
                                }
                                var usedDP = 0;
                                var mi_st = Ext.getStore("monitored_interfaces");
                                var recs = mi_st.getRange();
                                var i, t;
                                for(i = 0; i < recs.length; i++) {
                                    if (recs[i].data.minterface != intf) {
                                        t = recs[i].data.delta_priority;
                                        if ( isNaN(t) ) {
                                            t = 10;
                                        }
                                        usedDP += parseInt(t, 10);
                                    }
                                }
                                var newMaxValue = Ext.Number.constrain( (254 - usedDP), 1, 254);
                                if (c.maxValue != newMaxValue) {
                                    c.setMaxValue( newMaxValue );
                                }
                                return newMaxValue;
                            }
                        }
                    ]
                }
            ]
        };

        var mi_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "mi_window"
            ,title      : "placeholder"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("avrrp_vrid_window").getPosition();
                    win.setPosition(pos[0], 222 + pos[1]);
                    //STUB Ext.getCmp("minterface_entry").expand();
                }
            }
            ,items      : [ mi_form ]
        });
        mi_window.show();

        function mi_save() {
            var minterface      = Ext.getCmp("minterface_entry").getValue();
            var delta_priority  = Ext.getCmp("delta_priority_entry").getRawValue();
            var mi_grid = Ext.getCmp("mi_grid");
            var mi_st = Ext.getStore("monitored_interfaces");
            var rec = mi_st.findRecord("minterface", minterface);
            if ( rec ) {
                rec.data.delta_priority = delta_priority;
            } else {
                mi_st.add({
                    "minterface"        : minterface
                    ,"delta_priority"   : delta_priority
                    ,"newrec"           : true
                });
            }

            mi_grid.getView().refresh();
            CP.ar_util.checkWindowClose("mi_window");
        }
    }

    ,get_vrid_batch_btn_set         : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Batch Mode"
            },{
                xtype       : "cp4_btnsbar"
                ,id         : "avrrp_batch_btnsbar"
                ,items      : [
                    {
                        xtype               : "cp4_button"
                        ,text               : CP.avrrp_4.QuickAddTitle
                        ,id                 : "avrrp_batch_btn"
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.avrrp_4.add_vrid_batch_window(b, e);
                        }
                        ,disabledConditions : function() {
                            return !( CP.avrrp_4.validMainPanel() );
                        }
                    }
                ]
            }
        ];
    }

    ,add_vrid_batch_window          : function() {
        if (CP.avrrp_4.PAGELOCK) { return; }

        var avrrp_batch_form = {
            xtype       : "cp4_formpanel"
            ,id         : "avrrp_batch_form"
            ,width      : 690
            //,height     :
            ,margin     : 0
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("avrrp_batch_save_btn");
                CP.ar_util.checkDisabledBtn("avrrp_batch_cancel_btn");
            }
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p && p.chkBtns) { p.chkBtns(); }
                    CP.avrrp_4.clearParams();
                }
                ,validitychange : function(p) {
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "avrrp_batch_save_btn"
                    ,disabled           : true
                    ,formBind           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        var params = CP.avrrp_4.clearParams();
                        params["qavrs"] = Ext.getCmp("batch_textarea").getValue();
                        //closed afterSubmit or on submitFailure
                        CP.avrrp_4.mySubmit();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.avrrp_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("avrrp_batch_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "avrrp_batch_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.avrrp_4.clearParams();
                        CP.ar_util.checkWindowClose("avrrp_batch_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 8 15"
                    ,width      : 660
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype       : "cp4_textarea"
                            ,hideLabel  : true
                            ,id         : "batch_textarea"
                            ,width      : 660
                            ,height     : 140
                            ,allowBlank : false
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,type       : "info"
                            ,text       : CP.avrrp_4.QuickAddInfo
                        }
                    ]
                }
            ]
        };

        var avrrp_batch_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "avrrp_batch_window"
            ,title      : CP.avrrp_4.QuickAddTitle
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(175,100);
                }
            }
            ,items      : [ avrrp_batch_form ]
        });
        avrrp_batch_window.show();
    }
}

