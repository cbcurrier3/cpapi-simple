//searchKeys: cluster
//Simplified VRRP for ExtJS 4

CP.svrrp = {
    PAGELOCK                        : false     //if true, prevents changing of records

    ,validMainPanel                 : function() {
        var v = !(CP.svrrp.PAGELOCK);
        var f = CP.ar_util.checkFormValid("svrrp_configPanel");
        v = v && f;
        return v;
    }

    ,check_user_action              : function() {
        CP.ar_util.checkBtnsbar("svrrp_apply_global_btnsbar");
        CP.ar_util.checkBtnsbar("vrid_btnsbar");
        CP.ar_util.checkBtnsbar("vrid_form");
        CP.ar_util.checkBtnsbar("ba_form");
    }

    ,init                           : function() {
        CP.svrrp.defineStores();
        var svrrp_configPanel = CP.svrrp.configPanel();
        var obj = {
            title           : "VRRP"
            ,panel          : svrrp_configPanel
            ,submit         : true
            ,submitURL      : "/cgi-bin/mcvr.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("vrid_window");
                CP.svrrp.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.vrrp_monitor_4 && CP.vrrp_monitor_4.doLoad) {
                    CP.vrrp_monitor_4.doLoad();
                }                                                               
            }
            ,submitFailure  : function() {
                CP.svrrp.doLoad();
            }
            ,checkCmpState  : CP.svrrp.check_user_action
            ,helpFile       : "vrrpHelp.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//common ajax related functions
    ,mySubmit                       : function() {
        var t = CP.ar_util.checkBlockActivity() || !( CP.svrrp.validMainPanel() );
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
            myObj.params["coldstart"] = Ext.getCmp("coldstart").getDBValue();
            myObj.params["interface_delay"] = Ext.getCmp("interface_delay").getDBValue();
            if (Ext.getCmp("disable_vrs").getValue()) {
                myObj.params["disable_vrs"] = "true";
            }
            //in case a submit occurs without the apply global settings button
            if (Ext.getCmp("monitorfw").getValue()) {
                myObj.params["monitorfw"] = "true";
            }
            return (myObj.params);
        }
        return false;
    }

//defineStores
    ,defineStores                   : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = [];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("vrrp");
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : false
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
                    CP.ar_util.loadListPop(st.storeId);
                }
            }
        });

        var mcvrs = Ext.create("CP.WebUI4.Store", {
            storeId     : "mcvrs"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : 'vrid'
                    ,sortType   : function(v) {
                        if (Ext.typeOf(v) == "number") {
                            return parseInt(v, 10);
                        }
                        return 500;
                    }
                }
                ,{name  : 'Priority'}
                ,{name  : 'Priority_Delta'}
                ,{name  : 'Hello_Interval'}
                ,{name  : 'Authentication'}
                ,{name  : 'Authentication_Password'}
                ,{name  : 'Authentication_Password_existed'}
                ,{name  : 'Backup_Address'}
                ,{name  : 'delete'}
                ,{name  : 'new'}
                ,"preempt"
                ,"monitorvrrp"
                ,"autodeactivation"
                ,"bindings"
            ]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/mcvr.tcl?instance=" + CP.ar_util.INSTANCE()
                ,reader : {
                    type    : "json"
                    ,root   : "data.mcvrs_list"
                }
            }
            ,sorters    :   [{property: "vrid", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    CP.ar_util.loadListPop(st.storeId);
                }
            }
        });

        var ba_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "backupaddrs"
            ,autoLoad   : false
            ,fields     : [
                'bkaddr'
                ,'delete'
                ,'vmac'
                ,'vmac_static'
                ,"interface"
                ,"intf_state"
                ,"newrec"
                //,'binding_delete'       //="mcvr:vrid:" + vrid + ":addr:" + bkaddr;
                //,'binding_vmac'         //="mcvr:vrid:" + vrid + ":addr:" + bkaddr + ":vmac";
                //,'binding_vmac_static'  //="mcvr:vrid:" + vrid + ":addr:" + bkaddr + ":vmac" + ":static";
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                load        : CP.svrrp.adjust_priority_delta_maxValue
                ,remove     : CP.svrrp.adjust_priority_delta_maxValue
                ,add        : CP.svrrp.adjust_priority_delta_maxValue
            }
        });
    }

    ,load_ba_store                  : function(rec) {
        var ba_st = Ext.getStore("backupaddrs");
        if (ba_st) {
            if (rec) {
                ba_st.loadData(rec.data.Backup_Address);
            } else {
                ba_st.removeAll();
            }
        }
    }

//configPanel
    ,configPanel                    : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "svrrp_configPanel"
            ,margin     : "0 24 0 24"
            ,labelWidth : 150
            ,trackResetOnLoad   : true
            ,listeners  : {
                afterrender     : function() { CP.svrrp.doLoad(); }
                ,validitychange : function() {
                    CP.svrrp.check_user_action();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("svrrp"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "VRRP Global Settings"
                }
                ,CP.svrrp.get_global_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Virtual Routers"
                }
                ,CP.svrrp.get_monitored_interfaces_set()
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

    ,doLoad             : function() {
        CP.svrrp.clearParams();
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("vrrp");
        }

        CP.ar_util.loadListPush("intf_store");
        CP.ar_util.loadListPush("mcvrs");
        CP.ar_util.loadListPop("mySubmit");

        Ext.getStore("backupaddrs").removeAll();
        Ext.getStore("intf_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        Ext.getStore("mcvrs").load({params: {"instance": CP.ar_util.INSTANCE()}});

        var p = Ext.getCmp("svrrp_configPanel");
        if (p) {
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/mcvrg.tcl?instance=" + CP.ar_util.INSTANCE()
                ,method     : "GET"
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,success    : function(p, action) {
                    var gData = action.result.data;
                    var Has_Mcvr        = (gData.Has_Mcvr) ? 1 : 0;
                    var Has_Old_Config  = (gData.Has_Old_Config) ? 1 : 0;
                    var Has_Active_Mode = (gData.Has_Active_Mode) ? 1 : 0;

                    var coldstart_cmp   = Ext.getCmp("coldstart");
                    var coldstart       = parseInt(gData.coldstart, 10);
                    coldstart           = (isNaN(coldstart)) ? "" : coldstart;
                    coldstart_cmp.setValue(coldstart);
                    coldstart_cmp.originalValue = coldstart_cmp.getValue();

                    var interfacedelay_cmp   = Ext.getCmp("interface_delay");
                    var interfacedelay       = parseInt(gData.interface_delay, 10);
                    interfacedelay           = (isNaN(interfacedelay)) ? "" : interfacedelay;
                    interfacedelay_cmp.setValue(interfacedelay);
                    interfacedelay_cmp.originalValue = interfacedelay_cmp.getValue();

                    var disable_vrs_cmp = Ext.getCmp("disable_vrs");
                    var disable_vrs     = gData.disable_vrs;
                    disable_vrs_cmp.setValue(disable_vrs);
                    disable_vrs_cmp.originalValue = disable_vrs_cmp.getValue();

                    var monitorfw_cmp = Ext.getCmp("monitorfw");
                    var monitorfw     = gData.monitorfw;
                    monitorfw_cmp.setValue(monitorfw);
                    monitorfw_cmp.originalValue = monitorfw_cmp.getValue();

                    if (Has_Mcvr == 0 && Has_Old_Config == 1) {
                        CP.svrrp.bigErrorMessage("avrrp");
                    } else if (Has_Active_Mode == 1) {
                        CP.svrrp.bigErrorMessage("active_mode");
                    } else {
                        CP.svrrp.PAGELOCK = false;
                    }
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }
    }

    ,bigErrorMessage                : function(msg) {
        CP.svrrp.PAGELOCK = true;
        CP.svrrp.check_user_action();
        if (msg === "avrrp") {
        Ext.Msg.alert("Notice"
            , "Advanced VRRP configuration is present.  "
            + "The configuration on this page is \"Read Only\".  "
            + "Use the \"Advanced VRRP Configuration\" "
            + "page to delete the configuration.  "
        );
        } else if (msg === "active_mode") {
            Ext.Msg.alert("Notice"
                , "Active-Active Mode configuration is present.  "
                + "Simplified VRRP does not operate under Active-"
                + "Active Mode. Disable Active-Active Mode under "
                + "Router Options before configuring Simplified VRRP.  "        
            );
        }
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
                ,layout     : {
                    type    : "hbox"
                }
                ,padding    : 0
                ,margin     : 0
                ,items      : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Cold Start Delay"
                        ,id                 : "coldstart"
                        ,name               : "coldstart"
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
                ,name       : "disable_vrs"
                ,submitValue: false
                ,labelWidth : 150
                ,width      : 200
                ,height     : 22
            },{ //Monitor Firewall State
                xtype       : "cp4_checkbox"
                ,fieldLabel : "Monitor Firewall State"
                ,id         : "monitorfw"
                ,name       : "monitorfw"
                ,submitValue: false
                ,labelWidth : 150
                ,width      : 200
                ,height     : 22
            },{
                xtype       : "cp4_btnsbar"
                ,id         : "svrrp_apply_global_btnsbar"
                ,items      : [
                    {
                        text                : "Apply Global Settings"
                        ,id                 : "svrrp_apply_global_btn"
                        ,overrideNoToken    : false
                        ,handler2           : function(b, e) {
                            CP.svrrp.clearParams();
                            CP.svrrp.mySubmit();
                        }
                        ,disabledConditions : function() {
                            return !( CP.svrrp.validMainPanel() );
                        }
                    },{
                        text                : "Refresh"
                        ,id                 : "svrrp_refresh_btn"
                        ,overrideNoToken    : false
                        ,handler            : function(b) {
                            if (b && b.handle_no_token()) {
                                CP.svrrp.doLoad();
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
            },infoMsg
        ];
    }

//get_monitored_interfaces_set
    ,get_monitored_interfaces_set   : function() {
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
                        Ext.getCmp("mcvr_vrid_grid").getSelectionModel().deselectAll();
                        CP.svrrp.open_vrid_window();
                    }
                    ,disabledConditions : function() {
                        return !( CP.svrrp.validMainPanel() );
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Edit"
                    ,id                 : "vrid_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        CP.svrrp.open_vrid_window();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("mcvr_vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "vrid_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var vrid_sm = Ext.getCmp("mcvr_vrid_grid").getSelectionModel();
                        CP.svrrp.clearParams();
                        var recs = vrid_sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            delete_vrid( recs[i] );
                        }
                        CP.svrrp.mySubmit();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("mcvr_vrid_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete All"
                    ,id                 : "vrid_delete_all_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
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
                                CP.svrrp.clearParams();
                                var recs = Ext.getStore("mcvrs").getRange();
                                var i;
                                for(i = 0; i < recs.length; i++) {
                                    delete_vrid( recs[i] );
                                }
                                CP.svrrp.mySubmit();
                            }
                        });
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var st = Ext.getStore("mcvrs");
                        return ( (st && st.getCount) ? st.getCount() == 0 : true);
                    }
                }
            ]
        };

        var vrid_cm = [
            {
                header          : "VRID"
                ,dataIndex      : "vrid"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Priority"
                ,dataIndex      : "Priority"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Priority Delta"
                ,dataIndex      : "Priority_Delta"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                header          : "Hello Interval"
                ,dataIndex      : "Hello_Interval"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Preempt"
                ,dataIndex      : "preempt"
                ,width          : 75
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Monitor VRRP"
                ,hidden         : true
                ,dataIndex      : "monitorvrrp"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Auto-deactivation"
                ,dataIndex      : "autodeactivation"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = (value ? "Yes" : "No");
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                header          : "Backup Addresses"
                ,dataIndex      : "Backup_Address"
                ,flex           : 1
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    function ba_line(ba) {
                        var s = [];
                        var intf = String(ba["interface"]);
                        var vmac = "";
                        var state = String(ba.intf_state);
                        if (intf) {
                            s.push( String(intf) );
                        }
                        switch(ba.vmac.toLowerCase()) {
                            case "interface":
                                vmac = "Interface";
                                break;
                            case "static":
                                vmac = "Static "+ ba.vmac_static.toUpperCase();
                                break;
                            case "extended":
                                vmac = "Extended";
                                break;
                            default:
                                vmac = "VRRP";
                        }
                        if (vmac) {
                            s.push( String(vmac) );
                        }
                        if (state) {
                            s.push( (String(state) +" State") );
                        }
                        return (String(ba.bkaddr) + " (" + s.join(", ") + ")");
                    }
                    var retText = "";
                    var i;
                    if (rec.data.Backup_Address.length > 0) {
                        var retList = [];
                        for(i = 0; i < rec.data.Backup_Address.length; i++) {
                            retList.push( ba_line(rec.data.Backup_Address[i]) );
                        }
                        retText = retList.join(",<br>");
                    }
                    return CP.ar_util.rendererSpecific(retText, retText);
                }
            }
        ];

        var vrid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.svrrp.check_user_action();
                }
            }
        });

        var vrid_grid = {
            xtype               : "cp4_grid"
            ,id                 : "mcvr_vrid_grid"
            ,width              : 820
            ,height             : 200
            ,margin             : "0 0 0 0"
            ,forceFit           : true
            ,store              : Ext.getStore("mcvrs")
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

        function delete_vrid(rec) {
            var params = CP.svrrp.getParams(); //clear out params then push certain global settings
            var mprefix = "mcvr:vrid";
            params[mprefix +":"+ rec.data.vrid] = "";
        }

        return [
            vrid_btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,autoScroll : true
                ,items      : [ vrid_grid ]
            }
        ];
    }

    ,open_vrid_window                   : function() {
        if (CP.svrrp.PAGELOCK) {
            return;
        }
        CP.svrrp.clearParams();

        var ba_btnsbar = {
            xtype       : "cp4_btnsbar"
            ,id         : "ba_btnsbar"
            ,items      : [
                {
                    text                : "Add"
                    ,id                 : "ba_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("ba_grid").getSelectionModel().deselectAll();
                        CP.svrrp.open_ba_window();
                    }
                    ,disabledConditions : function() {
                        return !( CP.svrrp.validMainPanel() );
                    }
                },{
                    text                : "Edit"
                    ,id                 : "ba_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        CP.svrrp.open_ba_window();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("ba_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "ba_delete_btn"
                    ,disabled           : true
                    ,baDelArr           : []
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var i, d;
                        var recs = Ext.getCmp("ba_grid").getSelectionModel().getSelection();
                        for(i = 0; i < recs.length; i++) {
                            d = recs[i].data;
                            if ( !(d.newrec) ) {
                                b.baDelArr.push( d.bkaddr );
                            }
                        }
                        var ba_st = Ext.getStore("backupaddrs");
                        if (ba_st) { ba_st.remove(recs); }
                        Ext.getCmp("ba_grid").getView().refresh();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("ba_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var ba_cm = [
            {
                header          : "Backup Address"
                ,dataIndex      : "bkaddr"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.ar_util.rendererSpecific(value, value);
                }
            },{
                header          : "VMAC Mode"
                ,dataIndex      : "vmac"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    switch( value.toLowerCase() ) {
                        case "interface":
                            retValue = "Interface";
                            break;
                        case "static":
                            retValue = "Static (" + rec.data.vmac_static.toUpperCase() + ")";
                            break;
                        case "extended":
                            retValue = "Extended";
                            break;
                        default:
                            retValue = "VRRP";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue);
                }
            },{
                header          : "Interface"
                ,dataIndex      : "interface"
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
                text            : "State"
                ,dataIndex      : "intf_state"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var ba_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.svrrp.check_user_action();
                }
            }
        });

        var ba_grid_width   = 500;
        var ba_height       = 127;
        var ba_longHeight   = 272;
        var ba_resizeObj = {
            minHeight           : ba_height
            ,height             : ba_height
            ,maxHeight          : ba_longHeight
            ,minWidth           : ba_grid_width
            ,width              : ba_grid_width
            ,maxWidth           : ba_grid_width
            ,handles            : "s"
            ,listeners          : {
                beforeresize        : function(r, w, h, e, eOpts) {
                    var g = r.getTarget();
                    if ( !g ) { return; }
                    e.stopEvent();
                    var newH = (h < g.longHeight) ? g.longHeight : g.shortHeight;
                    g.setHeight(newH);
                    g.setHeight(newH);
                }
            }
        };

        var ba_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ba_grid"
            ,width              : ba_grid_width
            ,height             : ba_height
            ,shortHeight        : ba_height
            ,longHeight         : ba_longHeight
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("backupaddrs")
            ,margin             : "0 0 0 15"
            ,columns            : ba_cm
            ,selModel           : ba_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("ba_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
            //,resizable          : ba_resizeObj
        };

        var vrid_form = {
            xtype       : "cp4_formpanel"
            ,id         : "vrid_form"
            ,autoScroll : true
            ,height     : 445
            ,width      : (ba_grid_width + 35)
            ,listeners  : {
                afterrender     : vrid_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("vrid_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("ba_btnsbar");
                CP.ar_util.checkDisabledBtn("vrid_save_btn");
                CP.ar_util.checkDisabledBtn("vrid_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "vrid_save_btn"
                    ,text               : "Save"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        vrid_save(b,e);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var f = CP.ar_util.checkFormValid("vrid_form");
                        return !(f);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("vrid_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "vrid_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.svrrp.clearParams();
                        CP.ar_util.checkWindowClose("vrid_window");
                    }
                    ,disabledConditions : function() {
                        return !( CP.svrrp.validMainPanel() );
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("vrid_entry").validate();
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : ba_grid_width
                    ,autoScroll : false
                    ,margin     : "15 0 0 15"
                    ,items      : [
                        get_vrid_obj()
                        ,{
                            xtype   : "cp4_formpanel"
                            ,layout : "column"
                            ,width  : ba_grid_width
                            ,margin : 0
                            ,items  : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "Priority"
                                    ,id                 : "Priority_entry"
                                    ,name               : "Priority"
                                    ,value              : 100
                                    ,labelWidth         : 100
                                    ,width              : 200
                                    ,style              : "margin-right:100px;"
                                    ,allowBlank         : false
                                    ,allowDecimals      : false
                                    ,minValue           : 1
                                    ,maxValue           : 254
                                    ,maxLength          : 3
                                    ,enforceMaxLength   : true
                                },{
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "Priority Delta"
                                    ,id                 : "Priority_Delta_entry"
                                    ,name               : "Priority_Delta"
                                    ,value              : 10
                                    ,labelWidth         : 100
                                    ,width              : 200
                                    ,allowBlank         : false
                                    ,allowDecimals      : false
                                    ,minValue           : 1
                                    ,maxValue           : 254
                                    ,maxLength          : 3
                                    ,enforceMaxLength   : true
                                    ,listeners          : {
                                        change              : CP.svrrp.adjust_priority_delta_maxValue
                                        ,focus              : CP.svrrp.adjust_priority_delta_maxValue
                                        ,spin               : CP.svrrp.adjust_priority_delta_maxValue
                                        ,blur               : CP.svrrp.adjust_priority_delta_maxValue
                                    }
                                    ,validator          : function(v) {
                                        var PDe = Ext.getCmp("Priority_Delta_entry");
                                        var value = PDe.getRawValue();
                                        if (value == "") {
                                            return "";
                                        }
                                        if (v < PDe.minValue) {
                                            return "";
                                        }
                                        if (v > PDe.maxValue) {
                                            return "Priority Delta * [Interfaces used by Backup Address] <= 254.";
                                        }
                                        return true;
                                    }
                                }
                            ]
                        },{
                            //hello interval
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Hello Interval"
                            ,id             : "Hello_Interval_entry"
                            ,name           : "Hello_Interval"
                            ,value          : 1
                            ,labelWidth     : 100
                            ,width          : 200
                            ,allowBlank     : false
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 254
                            ,maxLength      : 3
                            ,enforceMaxLength   : true
                        },{
                            xtype   : "cp4_formpanel"
                            ,layout : "column"
                            ,width  : ba_grid_width
                            ,margin : 0
                            ,items  : [
                                {
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Preempt Mode"
                                    ,id             : "preempt_mode_entry"
                                    ,name           : "preempt"
                                    ,value          : true
                                    ,checked        : true
                                    ,submitValue    : false
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,style          : "margin-right:100px;"
                                    ,height         : 22
                                    ,getDBValue     : function() {
                                        //reverse value for "nopreempt"
                                        var c = this;
                                        var v = (c.getValue() ? "" : "t");
                                        return v;
                                    }
                                    ,listeners      : {
                                        change         : function() {
                                            //this.originalValue = this.getValue();
                                            var mon_svrrp = Ext.getCmp("Monitor_Svrrp_entry");
                                            if (this.getValue() == true) {
                                                mon_svrrp.setValue(false);
                                            } else {
                                                mon_svrrp.setValue(mon_svrrp.originalValue);
                                            }
                                            mon_svrrp.setDisabled(this.getValue());
                                        }
                                    }
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Auto-deactivation"
                                    ,id             : "autodeactivation_entry"
                                    ,name           : "autodeactivation"
                                    ,submitValue    : false
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,style          : "margin-right:0px;"
                                    ,height         : 22
                                    ,getDBValue     : function() {
                                        var c = this;
                                        var v = (c.getValue() ? "t" : "");
                                        return v;
                                    }
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Monitor VRRP"
                                    ,id             : "Monitor_Svrrp_entry"
                                    ,name           : "Monitor_Svrrp"
                                    ,labelWidth     : 100
                                    ,width          : 100 + 145
                                    ,height         : 22
                                    ,hidden         : true
                                    ,style          : "margin-right:100px;"
                                    ,disabled       : true
                                    ,getDBValue     : function() {
                                        var nopreempt = Ext.getCmp("preempt_mode_entry").getDBValue();
                                        var v = "";
                                        if( this.getValue() && nopreempt) {
                                            v = "t";
                                        }
                                        return v;
                                    }
                                    ,listeners      : {
                                        change         : function() {
                                            var preempt = Ext.getCmp("preempt_mode_entry");
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
                            xtype   : "cp4_formpanel"
                            ,layout : "column"
                            ,width  : ba_grid_width
                            ,margin : 0
                            ,items  : [
                                {
                                    //authentication combobox
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Authentication"
                                    ,id             : "auth_entry"
                                    ,name           : "Authentication"
                                    ,queryMode      : "local"
                                    ,editable       : false
                                    ,triggerAction  : "all"
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,style          : "margin-right:100px;"
                                    ,store          :   [[""        ,"None"]
                                                        ,["simple"  ,"Simple"]]
                                    ,listeners      : {
                                        select          : function(combo, recs, eOpts) {
                                            if (combo.getValue() == "") {
                                                Ext.getCmp("auth_password_entry").disable();
                                                Ext.getCmp("auth_password_entry").hide();
                                            } else {
                                                Ext.getCmp("auth_password_entry").enable();
                                                Ext.getCmp("auth_password_entry").show();
                                            }
                                            Ext.getCmp("auth_password_entry").validate();
                                        }
                                    }
                                },{
                                    //simple password
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Simple Password"
                                    ,id             : "auth_password_entry"
                                    ,name           : "Authentication_Password"
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,inputType      : "password"
                                    ,hidden         : true
                                    ,disabled       : true
                                    ,allowBlank     : false
                                    ,maxLength      : 8
                                    ,enforceMaxLength   : true
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
                                }
                            ]
                        },{
                            xtype           : "cp4_sectiontitle"
                            ,titleText      : "Backup Address"
                            ,margin         : "25 0 10 0"
                        }
                        ,ba_btnsbar
                    ]
                }
                ,ba_grid
                ,{xtype: "tbspacer", height: 15, width: 400}
            ]
        };

        var vrid_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "vrid_window"
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

        function vrid_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var rec = null;
            var auth_norm = true;
            var auth = Ext.getCmp("auth_password_entry");
            if (Ext.getCmp("mcvr_vrid_grid").getSelectionModel().hasSelection()) {
                rec = Ext.getCmp("mcvr_vrid_grid").getSelectionModel().getLastSelected();
                Ext.getCmp("vrid_window").setTitle("Edit Virtual Router " + rec.data.vrid);
                p.loadRecord(rec);
                Ext.getCmp("auth_entry").select(rec.data.Authentication);
                auth_norm = (rec.data.Authentication == "");
                if (auth) {
                    var exed = rec.data.Authentication_Password_existed;
                    auth.allowBlank = exed ? true : false;
                    auth.emptyText = exed ? "Key is set" : "";
                    if (auth.reset) auth.reset();
                    if (auth.validate) auth.validate();
                }

                var preempt = Ext.getCmp("preempt_mode_entry");
                var mon_svrrp = Ext.getCmp("Monitor_Svrrp_entry");
                mon_svrrp.setValue(rec.data.monitorvrrp ? true : false);
                preempt.setValue(rec.data.preempt ? true : false);
                mon_svrrp.originalValue = mon_svrrp.getValue();
                preempt.originalValue = preempt.getValue();
                if (rec.data.preempt) {
                    mon_svrrp.setDisabled(true);
                }
                if (rec.data.monitorvrrp) {
                    preempt.setDisabled(true);
                }
            } else {
                Ext.getCmp("vrid_window").setTitle("Add Virtual Router");
                Ext.getCmp("auth_entry").select("");
            }
            if (auth) {
                auth.setDisabled(auth_norm);
                auth.setVisible(!auth_norm);
            }
            CP.svrrp.load_ba_store(rec);
            Ext.getCmp("Priority_Delta_entry").validate();
            if (p.chkBtns) { p.chkBtns(); }
        }

        function get_vrid_obj() {
            if (Ext.getCmp("mcvr_vrid_grid").getSelectionModel().hasSelection()) {
                return {
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "Virtual Router ID"
                    ,id         : "vrid_entry"
                    ,name       : "vrid"
                    ,labelWidth : 100
                    ,width      : 200
                    ,height     : 22
                };
            }
            return {
                xtype           : "cp4_numberfield"
                ,fieldLabel     : "Virtual Router ID"
                ,id             : "vrid_entry"
                ,name           : "vrid"
                ,allowBlank     : false
                ,allowDecimals  : false
                ,minValue       : 1
                ,maxValue       : 255
                ,maxLength      : 3
                ,enforceMaxLength   : true
                ,width          : 100 + 100
                ,value          : ""
                ,validator      : function(value) {
                    var vrid = Ext.getCmp("vrid_entry").getValue();
                    if (Ext.getStore("mcvrs").findExact("vrid",vrid) != -1) {
                        return "A Virtual Router with this ID already exists.";
                    }
                    return true;
                }
            };
        }

        function vrid_save() {
            var params = CP.svrrp.getParams();
            var mprefix = "mcvr:vrid";
            var vrid            = Ext.getCmp("vrid_entry").getValue();
            var Priority        = Ext.getCmp("Priority_entry").getValue();
            var Priority_Delta  = Ext.getCmp("Priority_Delta_entry").getValue();
            var Hello_Interval  = Ext.getCmp("Hello_Interval_entry").getValue();
            var preempt_value   = Ext.getCmp("preempt_mode_entry").getDBValue();
            var mon_svrrp_value = Ext.getCmp("Monitor_Svrrp_entry").getDBValue();
            var autodeact_value = Ext.getCmp("autodeactivation_entry").getDBValue();
            var Authentication  = Ext.getCmp("auth_entry").getValue();
            var Auth_Password   = Ext.getCmp("auth_password_entry").getValue();
            var ba_store        = Ext.getStore("backupaddrs");

            if ( !(Ext.getCmp("mcvr_vrid_grid").getSelectionModel().hasSelection()) ) {
                //new
                if (Ext.getStore("mcvrs").findExact("vrid",vrid) != -1) {
                    //duplicate
                    Ext.Msg.alert(
                        "Warning: Virtual Router Already Exists"
                        ,"A Virtual Router with this ID already Exists."
                    );
                    return;
                }
            }

            var vrid_prefix = mprefix + ":" + vrid;
            params[vrid_prefix] = "t";
            params[vrid_prefix +":priority"]            = Priority;
            params[vrid_prefix +":delta_priority"]      = Priority_Delta;
            params[vrid_prefix +":advertiseinterval"]   = Hello_Interval;
            params[vrid_prefix +":nopreempt"]           = preempt_value;
            params[vrid_prefix +":monitorvrrp"]         = mon_svrrp_value;
            params[vrid_prefix +":autodeactivation"]    = autodeact_value;
            switch( String(Authentication).toLowerCase() ) {
                case "simple":
                    params[vrid_prefix + ":authentication"]             = "simple";
                    var pwn = vrid_prefix + ":authentication:password";
                    delete(params[pwn]);
                    if (Auth_Password != "") {
                        var pwn2 = pwn.replace(/^mcvr:/, ":mcvr:obscure:");
                        params[pwn2]                                    = Auth_Password;
                    }
                    break;
                default:
                    params[vrid_prefix + ":authentication"]             = "";
                    params[vrid_prefix + ":authentication:password"]    = "";
            }

            var ba_prefix;
            var ba_recs = ba_store.getRange();
            var i, bae;
            var delBtn = Ext.getCmp("ba_delete_btn");
            var delArr = (delBtn && delBtn.baDelArr.length) ? delBtn.baDelArr : [];
            for(i = 0; i < delArr.length; i++) {
                ba_prefix = vrid_prefix +":addr:"+ String(delArr[i]);
                params[ba_prefix]                   = "";
                params[ba_prefix +":vmac"]          = "";
                params[ba_prefix +":vmac:static"]   = "";
            }
            for(i = 0; i < ba_recs.length; i++) {
                bae = ba_recs[i];
                ba_prefix = vrid_prefix + ":addr:" + bae.data.bkaddr;
                params[ba_prefix]                   = "t";
                params[ba_prefix +":vmac"]          = bae.data.vmac.toLowerCase();
                if (String(bae.data.vmac).toLowerCase() == "static") {
                    params[ba_prefix +":vmac:static"] = String(bae.data.vmac_static).toLowerCase();
                } else {
                    params[ba_prefix +":vmac:static"] = "";
                }
            }
            CP.svrrp.mySubmit();
        }
    }

    ,adjust_priority_delta_maxValue     : function() {
        var PDe = Ext.getCmp("Priority_Delta_entry");
        if (PDe) {
            var ba_recs = Ext.getStore("backupaddrs").getRange();
            var unique_intfs = [];
            var intf_cnt = 0;
            var intf_temp;
            var i;
            for(i = 0; i < ba_recs.length; i++) {
                intf_temp = CP.svrrp.get_masking_interface(ba_recs[i].data.bkaddr);
                switch(intf_temp) {
                    case "unmasked":
                    case "exact match":
                        break;
                    default:
                        if ( Ext.Array.indexOf(unique_intfs, intf_temp) == -1 ) {
                            unique_intfs.push(intf_temp);
                            intf_cnt++;
                        }
                }
            }
            var maxVal = Ext.Number.constrain(parseInt(254/intf_cnt, 10), 1, 254);
            PDe.setMaxValue(maxVal);
            if (PDe.getValue() > maxVal) {
                PDe.validate();
            }
        }
    }

    ,open_ba_window                     : function() {
        var ba_form = {
            xtype       : "cp4_formpanel"
            ,id         : "ba_form"
            ,width      : 287
            ,height     : 135
            ,autoScroll : false
            ,listeners  : {
                afterrender     : ba_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("ba_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("ba_save_btn");
                CP.ar_util.checkDisabledBtn("ba_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "ba_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        ba_save(b,e);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.svrrp.validMainPanel() ) ) {
                            return true;
                        }
                        var f = CP.ar_util.checkFormValid("ba_form");
                        return !(f);
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "ba_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("ba_grid").getView().refresh();
                        CP.ar_util.checkWindowClose("ba_window");
                    }
                    ,disabledConditions : function() {
                        return !( CP.svrrp.validMainPanel() );
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 0 15"
                    ,width      : 256
                    ,autoScroll : false
                    ,items      : [
                        ba_obj()
                        ,{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "VMAC Mode"
                            ,id             : "vmac_entry"
                            ,name           : "vmac"
                            ,labelWidth     : 100
                            ,width          : 255
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,allowBlank     : false
                            ,autoSelect     : true
                            ,store          :   [[""            ,"VRRP"]
                                                ,["interface"   ,"Interface"]
                                                ,["static"      ,"Static"]
                                                ,["extended"    ,"Extended"]]
                            ,listeners      : {
                                select          : function(combo, recs, eOpts) {
                                    if (combo.getValue().toLowerCase() == "static") {
                                        Ext.getCmp("vmac_static_entry").enable();
                                        Ext.getCmp("vmac_static_entry").show();
                                    } else {
                                        Ext.getCmp("vmac_static_entry").disable();
                                        Ext.getCmp("vmac_static_entry").hide();
                                    }
                                    Ext.getCmp("vmac_static_entry").validate();
                                }
                            }
                        },{
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "Static Mac Address"
                            ,id             : "vmac_static_entry"
                            ,name           : "vmac_static"
                            ,labelWidth     : 100
                            ,width          : 255
                            ,vtype          : "mac"
                            ,allowBlank     : false
                            ,maxLength      : 17
                            ,enforceMaxLength: true
                            ,maskRe         : /[:0-9a-fA-F]/
                        },{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "newrec"
                            ,id             : "newrec_entry"
                            ,name           : "newrec"
                            ,value          : ""
                            ,hidden         : true
                            ,hideLabel      : true
                        }
                    ]
                }
            ]
        };

        var ba_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "ba_window"
            ,title      : "placeholder"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("vrid_window").getPosition();
                    win.setPosition(173 + pos[0], 66 + pos[1]);
                }
            }
            ,items      : [ ba_form ]
        });
        ba_window.show();

        function ba_obj() {
            if (Ext.getCmp("ba_grid").getSelectionModel().hasSelection()) {
                return {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Backup Address"
                    ,id             : "bkaddr_entry"
                    ,name           : "bkaddr"
                    ,labelWidth     : 100
                    ,width          : 255
                    ,height         : 22
                };
            }
            return {
                xtype           : "cp4_ipv4field"
                ,id             : "bkaddr_entry"
                ,fieldConfig    : {
                    name        : "bkaddr"
                    ,allowBlank : false
                }
            };
        }

        function ba_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var ba_sm = Ext.getCmp("ba_grid").getSelectionModel();
            if (ba_sm.hasSelection()) {
                var rec = ba_sm.getLastSelected();
                Ext.getCmp("ba_window").setTitle("Edit Backup Address " + rec.data.bkaddr);
                p.loadRecord(rec);
                var nr_v = false;
                if (rec.data.newrec == true || rec.data.newrec == "true") {
                    nr_v = true;
                }
                Ext.getCmp("newrec_entry").setValue(nr_v);
                if (rec.data.vmac.toLowerCase() == "static") {
                    Ext.getCmp("vmac_static_entry").enable();
                    Ext.getCmp("vmac_static_entry").show();
                } else {
                    Ext.getCmp("vmac_static_entry").disable();
                    Ext.getCmp("vmac_static_entry").hide();
                }
            } else {
                Ext.getCmp("vrid_entry").validate();
                Ext.getCmp("ba_window").setTitle("Add Backup Address");
                Ext.getCmp("vmac_entry").select("");
                Ext.getCmp("newrec_entry").setValue("true");
                Ext.getCmp("vmac_static_entry").disable();
                Ext.getCmp("vmac_static_entry").hide();
            }
            Ext.getCmp("vmac_static_entry").validate();
            if (p.chkBtns) { p.chkBtns(); }
        }

        function ba_save() {
            var ba          = Ext.getCmp("bkaddr_entry").getValue();
            var m           = CP.addr_list.getMatchMessage(ba);
            if (m != "") {
                Ext.Msg.alert("Warning", m);
                return;
            }
            var val_retValue = CP.svrrp.validate_backup_address(ba);
            if ( val_retValue == "unmasked" || val_retValue == "exact match" ) {
                return;
            }
            var vmac        = Ext.getCmp("vmac_entry").getValue().toLowerCase();
            var vmac_static = (vmac == "static") ? Ext.getCmp("vmac_static_entry").getValue().toLowerCase() : "";
            var ba_st       = Ext.getStore("backupaddrs");
            var idx         = ba_st.findExact("bkaddr",ba);
            if (idx == -1) {
                //add
                ba_st.add({
                    "bkaddr"        : ba
                    ,"vmac"         : vmac
                    ,"vmac_static"  : vmac_static
                    ,"newrec"       : true
                    ,"interface"    : val_retValue
                    ,"intf_state"   : ""
                });
            } else {
                //edit
                var rec = ba_st.getAt(idx);
                rec.data["vmac"]        = vmac;
                rec.data["vmac_static"] = vmac_static;
            }
            Ext.getCmp("ba_grid").getView().refresh();
            CP.ar_util.checkWindowClose("ba_window");
        }
    }

    ,validate_backup_address    : function(ba) {
        //check if the ba has an interface without being exactly the same?
        var masked = CP.svrrp.get_masking_interface(ba);
        switch(masked) {
            case "unmasked":
                Ext.Msg.alert("Warning", "This Backup Address is not masked by an interface.");
                break;
            case "exact match":
                Ext.Msg.alert("Warning", "A Backup Address cannot exactly match an interface\'s address.");
                break;
        }
        return masked;
    }

    ,get_masking_interface      : function(addr) {
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
}

