CP.preferences_4 = {
    IPV6_STATE                  : false
    ,VSX_STATE                  : false
    ,CLUSTER_STATE              : true
    ,PROTOCOL_RANK_LABELWIDTH   : 170
    ,PROTOCOL_RANK_WIDTH        : 320

    ,STRING_ENABLED             : "Enabled"
    ,STRING_ENABLED_RECURSIVE   : "&#160;"

    ,MAX_TRACE_SIZE_MB          : 2047

    ,PANEL1_MARGIN              : '24 24 10 0'
    ,PANEL1_MARGIN_SECOND       : '10 24 4 0'
    ,PANEL2_MARGIN_FIRST        : '24 24 10 0'
    ,PANEL2_MARGIN              : '24 24 10 0'
    //,PANEL2_MARGIN_FIRST        : '20 0 10 0'
    //,PANEL2_MARGIN              : '24 0 10 0'

    ,configPanel_resize         : 0
    ,configPanel_resize2        : 0
    ,ro_title_resize            : 0

    //Protos
    ,PROTO_LIST :   ["global"           ,"bgp"              ,"bootpgw"
                    ,"dhcp6relay"       ,"icmp"             ,"igmp"
                    ,"iphelper"         ,"kernel"           ,"mfc"
                    ,"ospf2"            ,"pbr"              ,"pim"
                    ,"rip"              ,"routerdiscovery"  ,"vrrp"
                    ,"ospf3"            ,"ripng"
                    ,"routerdiscovery6"                     ,"vrrp6"]

    ,PROTO_NAME :   ["Global"           ,"BGP"              ,"Bootp / DHCP Relay"
                    ,"IPv6 DHCP Relay"  ,"ICMP"             ,"IGMP"
                    ,"IP Broadcast Helper"                  ,"Kernel"
                    ,"MFC"              ,"OSPF"
                    ,"Policy Based Routing"              ,"PIM"
                    ,"RIP"              ,"Router Discovery" ,"VRRP"
                    ,"IPv6 OSPF"        ,"IPv6 RIPng"
                    ,"IPv6 Router Discovery"                ,"IPv6 VRRP"]

    //Kernel Options
    ,ko_id_list                 :   ["ko_routes"]
    ,ko_label_list              :   ["Kernel Routes"]
    ,KERNEL_OPTION_PREFIX       : "ko_"

    ,get_no_token                   : function() {
        return ( CP.UI && (CP.UI.accessMode == 'ro' || CP.global.token < 1 ));
    }

    ,init                           : function() {
        CP.preferences_4.configPanel_resize = 0;
        CP.preferences_4.configPanel_resize2 = 0;
        CP.preferences_4.ro_title_resize = 0;

        CP.preferences_4.defineStores();
        var configPanel = CP.preferences_4.configPanel();
        var obj = {
            title           : "Routing Options"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/preferences.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : CP.preferences_4.doLoad
            ,submitFailure  : CP.preferences_4.doLoad
            ,checkCmpState  : CP.preferences_4.check_user_action
            ,helpFile       : "preferencesHelp.html"
            ,cluster_feature_name: "routingoptions"
        };
        CP.UI.updateDataPanel(obj);
    }
    ,check_user_action              : function() {
        CP.ar_util.checkDisabledBtn("apply_routing_options_btn");
        CP.ar_util.checkDisabledBtn("reset_routing_daemon_btn");
        var i, proto, btnsbarId;
        for(i = 0; i < CP.preferences_4.PROTO_LIST.length; i++) {
            proto = CP.preferences_4.PROTO_LIST[i];
            btnsbarId = ("pref_btnsbar_"+ proto);
            CP.ar_util.checkBtnsbar(btnsbarId);
        }
    }

//STUB:defineStores
    ,defineStores                   : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "master_store"
            ,autoLoad   : false
            ,fields     : [
                "proto"
                ,"prefix"
                ,"proto_name"
                ,"proto_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/preferences.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "list"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.DataList"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    var p, i;
                    for(i = 0; i < recs.length; i++) {
                        p = String(recs[i].data.proto);
                        if (Ext.Array.indexOf(CP.preferences_4.PROTO_LIST, p) != -1) {
                            var pref_st = Ext.getStore("pref_"+ p +"_store");
                            if (pref_st) { pref_st.loadData(recs[i].data.proto_list); }
                            var pref_cmp = Ext.getCmp("pref_"+ p +"_prefix");
                            if (pref_cmp) { pref_cmp.setValue(recs[i].data.prefix); }
                        }
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });
    }

    ,configPanel                    : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "preferences_configPanel"
            ,margin     : "0 0 0 0"
            ,autoScroll : false
            ,listeners  : {
                afterrender     : CP.preferences_4.doLoad
                ,validitychange : function() {
                    CP.ar_util.checkDisabledBtn("apply_routing_options_btn");
                    CP.ar_util.checkDisabledBtn("reset_routing_daemon_btn");
                }
                /*
                ,resize                 : function() {
                    CP.preferences_4.configPanel_resize++;
                    var cPanel  = Ext.getCmp("config-tab");
                    var p       = Ext.getCmp("preferences_configPanel");
                    var p1      = Ext.getCmp("pref_panel_1");
                    var p2      = Ext.getCmp("pref_panel_2");
                    if (cPanel && p && p1 && p2) {
                        CP.preferences_4.configPanel_resize2++;
                        p2.setWidth( p1.getWidth() );
                        p2.setHeight( cPanel.getHeight() - p1.getHeight() - 2 );

                        var roST = Ext.getCmp("ro_sectiontitle");
                        if (roST) {
                            var newW = roST.getWidth();
                            var p2i = Ext.getCmp("pref_panel_2_inner");
                            if (p2i) {
                                p2i.setWidth(newW);
                                CP.preferences_4.ro_title_resize++;
                            }
                        }
                    }
                }
                // */
            }
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,id         : "pref_panel_1"
                    ,margin     : "0 0 0 24"
                    ,autoScroll : false
                    ,items      : [
                        CP.ar_one_liners.get_one_liner("route_options"),
                        CP.preferences_4.get_apply_button()
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "pref_panel_2"
                    ,margin     : "0 0 0 24"
                    ,autoScroll : true
                    ,items      : [
                        {
                            xtype       : "cp4_formpanel"
                            ,id         : "pref_panel_2_inner"
                            ,margin     : "0 0 0 0"
                            ,autoScroll : false
                            ,items      : [
                                CP.preferences_4.get_equal_cost_multipath_set()
                                ,CP.preferences_4.get_kernel_set()
                                ,CP.preferences_4.get_protocol_rank_set()
                                ,CP.preferences_4.get_router_options_set()
                                ,CP.preferences_4.get_routed_syslog_set()
                                ,CP.preferences_4.get_trace_set()
                                ,CP.preferences_4.get_trace_grids_set()
                            ]
                        }
                    ]
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "pref_panel_3"
                    ,layout     : "column"
                    ,margin     : "0 0 0 24"
                    ,autoScroll : false
                    ,items      : [
                        CP.preferences_4.get_reset_routing_daemon_button()
                       ,{
                            xtype   : "cp4_inlinemsg"
                            ,type   : "info"
                            ,text   : "Note: Do not use this button to add or remove routing options.<br>Use the apply button located at the top of this page."
                            ,margin : "24 0 0 10"
                            ,width  : 350
                        }
                    ]
                }
            ]
        });

        return configPanel;
    }

    ,doLoad                         : function() {
        function testId_setVisibleEnable(cmpId, vis) {
            var c = Ext.getCmp(cmpId);
            if (c && c.setVisibleEnable) {
                c.setVisibleEnable(vis);
            }
        }

        CP.ar_util.clearParams();
        CP.ar_util.loadListPush("master_store");
        var p = Ext.getCmp("preferences_configPanel");
        if (p) {
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url     : "/cgi-bin/preferences.tcl?instance="+ CP.ar_util.INSTANCE() +"&option=global"
                ,method : "GET"
                ,failure: function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,success: function(p, action) {
                    var d = action.result.data;
                    var ipv6_state = CP.preferences_4.IPV6_STATE = (d.ipv6_state) ? true : false;
                    CP.preferences_4.VSX_STATE = (d.vsx_state) ? true : false;
                    CP.preferences_4.CLUSTER_STATE = (d.cluster_state) ? true : false;

                    var adv_ro_set = Ext.getCmp("router_options_advanced_routing_options_set");
                    if (adv_ro_set) {
                        // override CLUSTER_STATE
                        CP.preferences_4.CLUSTER_STATE = true;
                        adv_ro_set.setVisible(CP.preferences_4.CLUSTER_STATE);
                        CP.ar_util.safeSetDisabled(adv_ro_set, !CP.preferences_4.CLUSTER_STATE);
                    }
                    var wfc_in = d.wait_for_clustering ? true : false;
                    var aam_in = d.active_active_mode ? true : false;
                    var wfc_cmp = Ext.getCmp("wait_for_clustering_entry");
                    var aam_cmp = Ext.getCmp("active_active_mode_entry");
                    
                    wfc_cmp.setValue(wfc_in);
                    wfc_cmp.originalValue = wfc_in;

                    var autoifaceflap_in = d.auto_restore_iface_routes ? true : false;
                    Ext.getCmp("auto_restore_iface_routes_entry").setValue(autoifaceflap_in);
                    Ext.getCmp("auto_restore_iface_routes_entry").originalValue = autoifaceflap_in;

                    aam_cmp.setValue(aam_in);
                    aam_cmp.originalValue = aam_in;
                    aam_cmp.hasmcvr = d.Has_Svrrp;
                    aam_cmp.hasmonvrrp = d.Has_Monvrrp;
                    CP.ar_util.safeSetDisabled(wfc_cmp, aam_in);
                    CP.ar_util.safeSetDisabled(aam_cmp, (wfc_in || d.Has_Svrrp || d.Has_Monvrrp));

                    var i, g, ko_key, ck_value, ko_cmp;
                    Ext.getCmp("trace_option_dirty").setValue("");
                    Ext.getCmp("trace_option_dirty").originalValue = "";

                    var TO_sel = Ext.getCmp("traceoption_list_selector");
                    if (TO_sel) {
                        var TO_sel_st = TO_sel.getStore();
                        if (TO_sel_st) {
                            TO_sel_st.filter(function(rec, id) {
                                var v = true;
                                if (Ext.typeOf(rec.data.field1) == "string") {
                                    switch (rec.data.field1) {
                                        case "ospf3":
                                        case "routerdiscovery6":
                                        case "dhcp6relay":
                                            v = CP.preferences_4.IPV6_STATE;
                                            break;
                                        case "vrrp6":
                                            v = (!(CP.preferences_4.VSX_STATE) && CP.preferences_4.IPV6_STATE);
                                            break;
                                        case "vrrp":
                                            v = !(CP.preferences_4.VSX_STATE);
                                            break;
                                        default:
                                    }
                                }
                                var s = Ext.getCmp("pref_"+ rec.data.field1 +"_set");
                                if (s) {
                                    s.setVisible(v);
                                }
                                return v;
                            });
                        }
                    }

                    testId_setVisibleEnable("ospf3_prec", ipv6_state);
                    testId_setVisibleEnable("ospf3ase_prec", ipv6_state);
                    testId_setVisibleEnable("bgp_ipv6_prec", ipv6_state);
                    testId_setVisibleEnable("ripng_prec", ipv6_state);

                    var ko_string   = d.kerneloptions;
                    var ko_active   = ko_string.split(",");
                    for(i = 0; i < CP.preferences_4.ko_id_list.length; i++) {
                        ko_key      = CP.preferences_4.ko_id_list[i].replace(CP.preferences_4.KERNEL_OPTION_PREFIX,"");
                        ko_cmp      = Ext.getCmp(CP.preferences_4.ko_id_list[i]);
                        //ck_value    = (ko_active.indexOf(ko_key) != -1);    //IE8 doesn't support array indexOf
                        ck_value    = (ko_string.indexOf(ko_key) != -1);
                        ko_cmp.setValue(ck_value);
                        ko_cmp.originalValue = ck_value;
                    }
                    if (CP && CP.pref_monitor_4 && CP.pref_monitor_4.get_filepath) {
                        CP.pref_monitor_4.get_filepath();
                    }
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }
        Ext.getStore("master_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ar_util.loadListPop("mySubmit");
    }

    ,disable_and_dirty              : function(field) {
        //reverse changes when disabling the form (so that navigation won't be blocked)
        if (field.getValue() != field.originalValue) {
            field.setValue( field.originalValue );
            field.validate();
        }
    }

    ,get_reset_routing_daemon_button: function() {
        return {
            xtype               : "cp4_button"
            ,text               : "Restart Routing Daemon"
            ,id                 : "reset_routing_daemon_btn"
            ,disabled           : true
            ,style              : "margin-top:24px;"
            ,overrideNoToken    : false
            ,handler2           : function(b, e) {
                var params = CP.ar_util.clearParams();
                params["ResetRouting"] = "";
                CP.ar_util.mySubmit();
            }
            ,disabledConditions : function() {
                var m = CP.ar_util.checkFormValid("preferences_configPanel");
                return !(m);
            }
        };
    }
    ,get_apply_button               : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Routing Options"
                ,id         : "ro_sectiontitle"
                ,margin     : CP.preferences_4.PANEL1_MARGIN
                /*
                ,listeners  : {
                    resize      : function() {
                        //newW is necessary since this may be called via fireEvent();
                        var newW = Ext.getCmp("ro_sectiontitle").getWidth();
                        var p2i = Ext.getCmp("pref_panel_2_inner");
                        if (p2i) {
                            p2i.setWidth(newW);
                            CP.preferences_4.ro_title_resize++;
                        }
                    }
                }
                // */
            },{
                xtype       : "cp4_btnsbar"
                ,id         : "apply_reload_reset_btnsbar"
                ,margin     : "0 0 0 0"
                ,items      : [
                    {
                        text                : "Apply"
                        ,id                 : "apply_routing_options_btn"
                        ,disabled           : true
                        ,overrideNoToken    : false
                        ,handler2           : CP.preferences_4.apply_preferences
                        ,disabledConditions : function() {
                            var m = CP.ar_util.checkFormValid("preferences_configPanel");
                            return !(m);
                        }
                    },{
                        text                : "Reload"
                        ,id                 : "reload_routing_options_btn"
                        ,disabled           : false
                        ,disable            : function() { }
                        ,setDisabled        : function() {
                            var b = this;
                            if (b && b.disabled && b.enable) {
                                b.enable();
                            }
                        }
                        ,overrideNoToken    : true
                        ,handler            : function(b,e) {
                            CP.preferences_4.doLoad();
                        }
                    }
                ]
            }
            /*
            ,{
                xtype       : "cp4_panel"
                ,margin     : CP.preferences_4.PANEL1_MARGIN_SECOND
                ,layout     : "fit"
                ,html       : '<div class="webui4-section-title" /><img src="../images/comp/section-title.gif" /></div />'
            }
            // */
        ];
    }

    ,get_equal_cost_multipath_set   : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Equal Cost Multipath"
                ,id         : "eqm_sectiontitle"
                ,margin     : CP.preferences_4.PANEL2_MARGIN_FIRST
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,defaults   : {
                    labelWidth      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                    ,width          : CP.preferences_4.PROTOCOL_RANK_WIDTH
                    ,submitValue    : false
                }
                ,items      : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Maximum Paths"
                        ,id                 : "maximumpaths"
                        ,name               : "maximumpaths"
                        ,submitValue        : false
                        ,emptyText          : "Default: 8"
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 8
                        ,maxLength          : 1
                        ,enforceMaxLength   : true
                        ,listeners          : {
                            disable             : CP.preferences_4.disable_and_dirty
                        }
                    },{
                        xtype               : "cp4_combobox"
                        ,fieldLabel         : "Path Selection Algorithm"
                        ,id                 : "nexthopselect"
                        ,name               : "nexthopselect"
                        ,submitValue        : false
                        ,emptyText          : "Default: Src-Dest Hash"
                        ,editable           : true
                        ,forceSelection     : true
                        ,queryMode          : "local"
                        ,triggerAction      : "all"
                        ,store              :   [[""                ,"Default: Src-Dest Hash"]
                                                ,["sourcedesthash"  ,"Src-Dest Hash"]
                                                //,["desthash"        ,"Dest Hash"]
                                                //,["srchash"         ,"Src Hash"]
                                                //,["roundrobin"      ,"Round Robin"]
                        ]
                        ,listeners          : {
                            disable             : CP.preferences_4.disable_and_dirty
                        }
                        //TODO - hidden
                        ,hidden             : true
                        ,hideLabel          : true
                    }
                ]
            }
        ];
    }

    ,get_kernel_set                 : function() {
        var ko_cmps = [];
        var ko_cmp, i;
        for(i = 0;
            i < CP.preferences_4.ko_id_list.length && i < CP.preferences_4.ko_label_list.length;
            i++) {
                ko_cmp = {
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : CP.preferences_4.ko_label_list[i]
                    ,id         : CP.preferences_4.ko_id_list[i]
                    ,labelWidth : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                    ,width      : CP.preferences_4.PROTOCOL_RANK_WIDTH
                    ,height     : 22
                    ,listeners          : {
                        disable             : CP.preferences_4.disable_and_dirty
                    }
                };
                ko_cmps.push(ko_cmp);
        }

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Kernel Options"
                ,id         : "ko_sectiontitle"
                ,margin     : CP.preferences_4.PANEL2_MARGIN
            }
            ,ko_cmps
            //fieldLabel  : "Kernel Routes"
            //to add additiona kernel options checkboxes, add to the two lists at the top of the file
        ];
    }

    ,get_protocol_rank_set          : function() {
        var setVisibleEnable = function(v) {
            var me = this, disa, o;
            if (me) {
                me.setVisible(v);
                disa = !v;
                disa = disa || CP.global.token < 1;
                o = CP.UI.getMyObj();
                disa = disa || (o && o.disabled_by_clustering);
                CP.ar_util.safeSetDisabled(me, disa);
                if (me.validate) { me.validate(); }
            }
        };
        var inet_protocol_rank_form = {
            xtype       : "cp4_formpanel"
            ,id         : "inet_protocol_rank_form"
            ,margin     : "0 40 0 0"
            ,defaults   : {
                labelWidth          : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                ,width              : CP.preferences_4.PROTOCOL_RANK_WIDTH
                ,submitValue        : false
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 255
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,setVisibleEnable   : setVisibleEnable
                ,getDBValue         : function() {
                    var me = this;
                    var r = "";
                    if (me && me.getRawValue() != "") {
                        r = me.getValue();
                        if (r < me.minValue || r > me.maxValue) {
                            r = "";
                        }
                    }
                    return String(r);
                }
                ,listeners          : {
                    disable             : CP.preferences_4.disable_and_dirty
                }
            }
            ,items      : [
                {
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "OSPF Routes"
                    ,id                 : "ospf2_prec"
                    ,name               : "ospf2_prec"
                    ,emptyText          : "Default: 10"
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "RIP Routes"
                    ,id                 : "rip_prec"
                    ,name               : "rip_prec"
                    ,emptyText          : "Default: 100"
                }
                ,{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "IPv4 BGP Routes"
                    ,id                 : "bgp_prec"
                    ,name               : "bgp_prec"
                    ,emptyText          : "Default: 170"
                }
                ,{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "OSPF ASE Routes"
                    ,id                 : "ospf2ase_prec"
                    ,name               : "ospf2ase_prec"
                    ,emptyText          : "Default: 150"
                }
            ]
        };

        var inet6_protocol_rank_form = {
            xtype       : "cp4_formpanel"
            ,id         : "inet6_protocol_rank_form"
            ,margin     : 0
            ,defaults   : {
                labelWidth          : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                ,width              : CP.preferences_4.PROTOCOL_RANK_WIDTH
                ,submitValue        : false
                ,allowBlank         : true
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 255
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,setVisibleEnable   : setVisibleEnable
                ,getDBValue         : function() {
                    var me = this;
                    var r = "";
                    var ipv6 = CP.preferences_4.IPV6_STATE;
                    if (ipv6 && me && me.getRawValue() != "") {
                        r = me.getValue();
                        if (r < me.minValue || r > me.maxValue) {
                            r = "";
                        }
                    }
                    return String(r);
                }
                ,listeners          : {
                    disable             : CP.preferences_4.disable_and_dirty
                }
            }
            ,items      : [
                {
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "IPv6 OSPF Routes"
                    ,id                 : "ospf3_prec"
                    ,name               : "ospf3_prec"
                    ,hidden             : true
                    ,enabled            : false
                    ,emptyText          : "Default: 10"
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "IPv6 RIPng Routes"
                    ,id                 : "ripng_prec"
                    ,name               : "ripng_prec"
                    ,hidden             : true
                    ,enabled            : false
                    ,emptyText          : "Default: 100"
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "IPv6 BGP Routes"
                    ,id                 : "bgp_ipv6_prec"
                    ,name               : "bgp_ipv6_prec"
                    ,hidden             : true
                    ,enabled            : false
                    ,emptyText          : "Default: 170"
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "IPv6 OSPF ASE Routes"
                    ,id                 : "ospf3ase_prec"
                    ,name               : "ospf3ase_prec"
                    ,hidden             : true
                    ,enabled            : false
                    ,emptyText          : "Default: 150"
                }                
            ]
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Protocol Rank"
                ,id         : "pr_sectiontitle"
                ,margin     : CP.preferences_4.PANEL2_MARGIN
            },{
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,margin     : 0
                ,items      : [inet_protocol_rank_form, inet6_protocol_rank_form]
            }
        ];
    }

    ,get_router_options_set         : function() {
        return [
            {
                xtype       : "cp4_formpanel"
                ,id         : "router_options_advanced_routing_options_set"
                ,hidden     : !(CP.preferences_4.CLUSTER_STATE)
                ,disabled   : !(CP.preferences_4.CLUSTER_STATE)
                ,margin     : 0
                ,setDisabled: function(d) {
                    if (CP.ar_util.blockActivity_ReadOnly() || CP.ar_util.blockActivity_NoToken()) {
                        d = true;
                    }
                    if (d) {
                        this.form.getFields().each(function(field) {
                            if (field && field.disable) {
                                field.disable();
                            }
                        });
                    } else {
                        this.form.getFields().each(function(field) {
                            if (field && field.enable) {
                                field.enable();
                            }
                        });
                    }
                }
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Advanced Routing Options"
                        ,id         : "router_options_sectiontitle"
                        ,margin     : CP.preferences_4.PANEL2_MARGIN
                    },{
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,items      : [
                            {
                                xtype       : "cp4_checkbox"
                                ,fieldLabel : "Wait for Clustering"
                                ,id         : "wait_for_clustering_entry"
                                ,name       : "wait_for_clustering"
                                ,labelWidth : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                                ,width      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH + 40
                                ,height     : 22
                                ,submitValue: false
                                ,listeners  : {
                                    disable     : CP.preferences_4.disable_and_dirty
                                   ,change      : function() {
                                        var aam_c = Ext.getCmp("active_active_mode_entry");
                                        if (aam_c && !aam_c.getValue()) { //mutually exclusive with active active mode
                                            aam_c.setValue(false);
                                            if (aam_c && aam_c.isDisabled() && !this.getValue()) {
                                                aam_c.setValue(aam_c.originalValue);
                                            }
                                            CP.ar_util.safeSetDisabled(aam_c, (this.getValue() || aam_c.hasmcvr || aam_c.hasmonvrrp));
                                        }
                                        if (aam_c && aam_c.getValue() && this.getValue()) {
                                            this.setValue(false);
                                        }
                                        if (aam_c && aam_c.isDisabled() && !this.getValue()) {
                                            CP.ar_util.safeSetDisabled(aam_c, (this.getValue() || aam_c.hasmcvr || aam_c.hasmonvrrp));
                                            aam_c.setValue(aam_c.originalValue);
                                        }
                                    }
                                }
                                ,margin     : "3 0 5 0"
                            },{
                                xtype       : "cp4_inlinemsg"
                                ,id         : "wait_for_clustering_inlinemsg"
                                ,type       : "info"
                                ,text       : "Wait for Clustering must be enabled only when using ClusterXL. Wait for Clustering and Active-Active Mode are mutually exclusive."
                                ,width      : 350
                                ,margin     : "0 24 5 0"
                                ,disable    : function() { }
                            }
                        ]
                    },{
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,items      : [
                            {
                                xtype       : "cp4_checkbox"
                                ,fieldLabel : "Auto Restore Iface Routes"
                                ,id         : "auto_restore_iface_routes_entry"
                                ,name       : "auto_restore_iface_routes"
                                ,labelWidth : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                                ,width      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH + 40
                                ,height     : 22
                                ,submitValue: false
                                ,listeners  : {
                                    disable     : CP.preferences_4.disable_and_dirty
                                }
                                ,margin     : "3 0 5 0"
                            },{
                                xtype       : "cp4_inlinemsg"
                                ,id         : "auto_restore_iface_routes_inlinemsg"
                                ,type       : "info"
                                ,text       : "Auto Restore Iface Routes is to avoid loss of interface routes."
                                ,width      : 350
                                ,margin     : "0 24 5 0"
                                ,disable    : function() { }
                            }
                        ]
                    },{
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,hidden     : true
                        ,items      : [
                            {
                                xtype       : "cp4_checkbox"
                                ,fieldLabel : "Active-Active Mode"
                                ,id         : "active_active_mode_entry"
                                ,name       : "active_active_mode"
                                ,labelWidth : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                                ,width      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH + 40
                                ,height     : 22
                                ,submitValue: false
                                ,listeners  : {
                                    disable     : CP.preferences_4.disable_and_dirty
                                    ,change  : function() {
                                        var wfc_c = Ext.getCmp("wait_for_clustering_entry");
                                        if (wfc_c && !wfc_c.getValue()) { //mutually exclusive with wait for clustering
                                            wfc_c.setValue(false);
                                            if (wfc_c && wfc_c.isDisabled() && !this.getValue()) {
                                                wfc_c.setValue(wfc_c.originalValue);
                                            }
                                            CP.ar_util.safeSetDisabled(wfc_c, this.getValue());
                                        }
                                        if (wfc_c && wfc_c.getValue() && this.getValue()) {
                                            this.setValue(false);
                                        }
                                        if (wfc_c && wfc_c.isDisabled() && !this.getValue()) {
                                            CP.ar_util.safeSetDisabled(wfc_c, this.getValue());
                                            wfc_c.setValue(wfc_c.originalValue);
                                        }
                                    }
                                }
                                ,margin     : "3 0 5 0"
                                ,hasmcvr    : 0
                                ,hasmonvrrp : 0
                            },{
                                xtype       : "cp4_inlinemsg"
                                ,id         : "active_active_mode_inlinemsg"
                                ,type       : "info"
                                ,text       : "<pre>Enable this option on each cluster member when using<br>"
                                            + "Gaia VRRP and require Active-Active Mode.<br>"
                                            + "Note:<br>"
                                            + "    \(1\) Only Static Routes are supported. Disable all<br>"
                                            + "          dynamic routing protocols.<br>"
                                            + "    \(2\) Only Advanced VRRP is supported. Delete all<br>"
                                            + "          Simplified VRRP configuration.<br>"
                                            + "    \(3\) VRRPv3 is not supported. Delete all VRRPv3<br>"
                                            + "          configuration.<br>"
                                            + "    \(4\) Monitor VRRP option for VRRP virtual router is<br>"
                                            + "          not supported.<br>"
                                            + "    \(5\) Active-Active Mode and Wait for Clustering are<br>"
                                            + "          mutually exclusive.<br>"
                                            + "    \(6\) Proxy ARP is not supported.<br>"
                                            + "Important: Additional firewall and SecureXL configuration<br>"
                                            + "           are required. Please refer to VRRP Admin Guide or<br>"
                                            + "           CLI help text for this command.</pre>"
                                ,width      : 350
                                ,margin     : "0 24 5 0"
                                ,disable    : function() { }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    ,get_routed_syslog_set          : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Routing Process Message Logging Options"
                ,id         : "rs_sectiontitle"
                ,margin     : CP.preferences_4.PANEL2_MARGIN
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,layout     : "column"
                ,items      : [
                    {
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Log Routed Separately"
                        ,id         : "rs_routedsyslog"
                        ,name       : "routedsyslog"
                        ,labelWidth : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                        ,width      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH + 40
                        ,margin     : "3 0 5 0"
                    },{
                        xtype       : "cp4_inlinemsg"
                        ,id         : "rs_routedsyslog_inlinemsg"
                        ,type       : "info"
                        ,text       : "If enabled, messages are saved to <b>/var/log/routed_messages</b>"
                        ,width      : 350
                        ,margin     : "0 24 5 0"
                        ,disable    : function() { }
                    }
                ]
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,layout     : "column"
                ,items      : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Maximum File Size"
                        ,id                 : "rs_routedsyslog_size"
                        ,name               : "routedsyslog_size"
                        ,labelWidth         : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                        ,width              : CP.preferences_4.PROTOCOL_RANK_WIDTH
                        ,emptyText          : "Default: 1"
                        ,submitValue        : false
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,value              : ""
                        ,minValue           : 1
                        ,maxValue           : 2047
                        ,maxLength          : 4
                        ,enforceMaxLength   : true
                        ,style              : "margin-right:15px;"
                        ,listeners          : {
                            disable             : CP.preferences_4.disable_and_dirty
                        }
                        ,getDBValue         : function() {
                            var c = this;
                            var v = this.getRawValue();
                            if (v == "") {
                                return "";
                            }
                            v = parseInt(v, 10);
                            v = Ext.Number.constrain(v, c.minValue, c.maxValue);
                            return (1048576 * v);
                        }
                    },{
                        xtype   : "cp4_label"
                        ,text   : "MB"
                        ,style  : "margin-top:4px;"
                    }
                ]
            },{
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Maximum Number of Files"
                ,id                 : "rs_routedsyslog_files"
                ,name               : "routedsyslog_files"
                ,labelWidth         : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                ,width              : CP.preferences_4.PROTOCOL_RANK_WIDTH
                ,submitValue        : false
                ,emptyText          : "Default: 10"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,value              : ""
                ,minValue           : 1
                ,maxValue           : 4294967295
                ,maxLength          : 10
                ,enforceMaxLength   : true
                ,listeners          : {
                    disable             : CP.preferences_4.disable_and_dirty
                }
                ,getDBValue         : function() {
                    var c = this;
                    var v = this.getRawValue();
                    if (v == "") {
                        return "";
                    }
                    v = parseInt(v, 10);
                    return Ext.Number.constrain(v, c.minValue, c.maxValue);
                }
            }
        ];
    }

    ,get_trace_set                  : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Trace Options"
                ,id         : "to_sectiontitle"
                ,margin     : CP.preferences_4.PANEL2_MARGIN
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,defaults   : {
                    labelWidth      : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                    ,width          : CP.preferences_4.PROTOCOL_RANK_WIDTH
                    ,submitValue    : false
                }
                ,items      : [
                    {
                        xtype   : "cp4_formpanel"
                        ,layout : "column"
                        ,width  : 400
                        ,items  : [
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Maximum Trace File Size"
                                ,id                 : "size"
                                ,name               : "size"
                                ,labelWidth         : CP.preferences_4.PROTOCOL_RANK_LABELWIDTH
                                ,width              : CP.preferences_4.PROTOCOL_RANK_WIDTH
                                ,emptyText          : "1 to "+ CP.preferences_4.MAX_TRACE_SIZE_MB
                                ,submitValue        : false
                                ,allowBlank         : false
                                ,allowDecimals      : false
                                ,value              : 1
                                ,minValue           : 1
                                ,maxValue           : CP.preferences_4.MAX_TRACE_SIZE_MB
                                ,maxLength          : String(CP.preferences_4.MAX_TRACE_SIZE_MB).length
                                ,enforceMaxLength   : true
                                ,style              : "margin-right:15px;"
                                ,listeners          : {
                                    disable             : CP.preferences_4.disable_and_dirty
                                }
                            },{
                                xtype   : "cp4_label"
                                ,text   : "MB"
                                ,style  : "margin-top:4px;"
                            }
                        ]
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Maximum Number of Trace Files"
                        ,id                 : "files"
                        ,name               : "files"
                        ,submitValue        : false
                        ,emptyText          : "1 to 4294967295"
                        ,allowBlank         : false
                        ,allowDecimals      : false
                        ,value              : 10
                        ,minValue           : 1
                        ,maxValue           : 4294967295
                        ,maxLength          : 10
                        ,enforceMaxLength   : true
                        ,listeners          : {
                            disable             : CP.preferences_4.disable_and_dirty
                        }
                    },{
                        xtype               : "cp4_combobox"
                        ,fieldLabel         : "Filter Visible Tables Below"
                        ,id                 : "traceoption_list_selector"
                        ,name               : "traceoption_list_selector_name"
                        ,allowBlank         : true
                        ,editable           : true
                        ,forceSelection     : true
                        ,lastQuery          : ""
                        ,queryMode          : "local"
                        ,triggerAction      : "all"
                        ,value              : ""
                        ,store              :   [[""                ,"Show All"]
                                                ,["global"          ,"Global"]
                                                ,["bgp"             ,"BGP"]
                                                ,["bootpgw"         ,"Bootp / DHCP Relay"]
                                                ,["dhcp6relay"      ,"IPv6 DHCP Relay"]
                                                ,["icmp"            ,"ICMP"]
                                                ,["igmp"            ,"IGMP"]
                                                ,["iphelper"        ,"IP Broadcast Helper"]
                                                ,["kernel"          ,"Kernel"]
                                                ,["mfc"             ,"MFC"]
                                                ,["ospf2"           ,"OSPF"]
                                                ,["pbr"             ,"Policy Based Routing"]
                                                ,["pim"             ,"PIM"]
                                                ,["rip"             ,"RIP"]
                                                ,["routerdiscovery" ,"Router Discovery"]
                                                ,["vrrp"            ,"VRRP"]
                                                ,["ospf3"           ,"IPv6 OSPF"]
                                                ,["ripng"           ,"IPv6 RIPng"]
                                                ,["routerdiscovery6","IPv6 Router Discovery"]
                                                ,["vrrp6"           ,"IPv6 VRRP"]
                        ]
                        ,listeners          : {
                            select      : function(combo, recs, eOpts) {
                                var proto   = Ext.getCmp("traceoption_list_selector").getValue();
                                var p_list  = CP.preferences_4.PROTO_LIST;
                                var p_cmp, i, v;
                                for(i = 0; i < p_list.length; i++) {
                                    p_cmp = Ext.getCmp("pref_"+ p_list[i] +"_set");
                                    v = (proto == "" || proto == p_list[i]);
                                    if (p_cmp) {
                                        switch (p_list[i]) {
                                            case "ospf3":
                                            case "routerdiscovery6":
                                            case "dhcp6relay":
                                                p_cmp.setVisible(v && CP.preferences_4.IPV6_STATE);
                                                break;
                                            case "vrrp6":
                                                p_cmp.setVisible(v && !(CP.preferences_4.VSX_STATE) && CP.preferences_4.IPV6_STATE);
                                                break;
                                            case "vrrp":
                                                p_cmp.setVisible(v && !(CP.preferences_4.VSX_STATE) );
                                                break;
                                            default:
                                                p_cmp.setVisible(v);
                                        }
                                    }
                                }
                                combo.originalValue = proto;
                            }
                            ,disable    : function(combo, eOpts) {
                                CP.ar_util.safeSetDisabled(combo, false);
                            }
                        }
                    }
                ]
            }
        ];
    }

    ,get_trace_grids_set            : function() {
        var TO_forms    = [];
        var temp_form, i;
        for(i = 0; i < CP.preferences_4.PROTO_LIST.length; i++) {
            temp_form   = get_trace_form(i);
            if (temp_form) {
                TO_forms.push(temp_form);
            }
        }

        function get_trace_form(j) {
            var proto       = CP.preferences_4.PROTO_LIST[j];
            var proto_name  = CP.preferences_4.PROTO_NAME[j];

            var store_id    = "pref_"+ proto +"_store";
            var grid_id     = "pref_"+ proto +"_grid";
            var form_id     = "pref_"+ proto +"_set";
            var prefix_id   = "pref_"+ proto +"_prefix";

            //1 create store
            Ext.create("CP.WebUI4.Store", {
                storeId     : store_id
                ,autoLoad   : false
                ,data       : []
                ,fields     : [
                    {
                        name        : "TO"
                        ,sortType   : function(v) {
                            if (v == "All") {
                                return "A";
                            }
                            return "B"+ v;
                        }
                    },{
                        name        : "VAL"
                        ,sortType   : function(v) {
                            if (v == "t") {
                                return 1;
                            }
                            return 2;
                        }
                    }
                    ,"dirty"
                ]
                ,proxy      : {
                    type        : "memory"
                    ,reader     : {
                        type        : "array"
                    }
                }
                ,sorters    : [{property: "TO", direction: "ASC"}]
            });

            //2 create btnsbar
            var btnsbar = {
                xtype   : "cp4_btnsbar"
                ,id     : ("pref_btnsbar_"+ proto)
                ,items  : [
                    {
                        text                : "Add"
                        ,id                 : ("pref_btn_en_"+ proto)
                        ,overrideNoToken    : false
                        ,handler2           : add_TO
                    },{
                        text                : "Remove"
                        ,id                 : ("pref_btn_di_"+ proto)
                        ,overrideNoToken    : false
                        ,handler2           : remove_TO
                    }
                ]
            };

            function refresh_all_trace_grids() {
                var i = 0;
                var pl = CP.preferences_4.PROTO_LIST;
                var g;
                for(i = 0; i < pl.length; i++) {
                    g = Ext.getCmp("pref_"+ pl[i] +"_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                }
                Ext.getCmp("trace_option_dirty").setValue("dirty");
            }

            function add_TO() {
                var grid    = Ext.getCmp(grid_id);
                var sm      = grid.getSelectionModel();
                var i;
                if (sm.getCount() > 0) {
                    var recs = sm.getSelection();
                    for(i = 0; i < recs.length; i++) {
                        recs[i].data.VAL    = "t";
                        recs[i].data.dirty  = true;
                    }
                    refresh_all_trace_grids();
                }
            }

            function remove_TO() {
                var grid    = Ext.getCmp(grid_id);
                var sm      = grid.getSelectionModel();
                if (sm.getCount() > 0) {
                    var recs = sm.getSelection();
                    for(i = 0; i < recs.length; i++) {
                        recs[i].data.VAL    = "";
                        recs[i].data.dirty  = true;
                    }
                    refresh_all_trace_grids();
                }
            }

            //3 create grid
            function VAL_RENDERER(val) {
                return '<div data-qtip="'+ val +'" style="text-align:center;" />'+ val +'</div />';
            }

            var grid_cm = [
                {
                    text            : "Options"
                    ,dataIndex      : "TO"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value) {
                        return '<div data-qtip="'+ value +'" />'+ value +'</div />';
                    }
                },{
                    text            : "&#160;"
                    ,dataIndex      : "VAL"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        if (value) {
                            return VAL_RENDERER(CP.preferences_4.STRING_ENABLED);
                        }
                        var r = st.findRecord("TO", "All", 0, false, true, true);
                        if (r && r.data.VAL != "") {
                            return VAL_RENDERER(CP.preferences_4.STRING_ENABLED_RECURSIVE);
                        }
                        var g_st = Ext.getStore("pref_global_store");
                        if (g_st) {
                            r = g_st.findRecord("TO", rec.data.TO, 0, false, true, true);
                            if (r && r.data.VAL != "") {
                                return VAL_RENDERER(CP.preferences_4.STRING_ENABLED_RECURSIVE);
                            }
                            r = g_st.findRecord("TO", "All", 0, false, true, true);
                            if (r && r.data.VAL != "") {
                                return VAL_RENDERER(CP.preferences_4.STRING_ENABLED_RECURSIVE);
                            }
                        }
                        return VAL_RENDERER("&#160;");
                    }
                }
            ];

            var grid_selModel = Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
            });

            var grid = {
                xtype               : "cp4_grid"
                ,id                 : grid_id
                ,width              : 200
                ,height             : 149
                ,margin             : 0
                ,forceFit           : true
                ,autoScroll         : true
                ,store              : Ext.getStore(store_id)
                ,columns            : grid_cm
                ,selModel           : grid_selModel
                ,draggable          : false
                ,enableColumnMove   : false
                ,enableColumnResize : true
                ,listeners          : {
                    itemdblclick        : function(grid, rec, item, index, e, eOpts) {
                        if ( CP.ar_util.checkBlockActivity() ) {
                            return;
                        }
                        switch(rec.data.VAL) {
                            case "":    rec.data.VAL = "t";
                                break;
                            case "t":   rec.data.VAL = "";
                                break;
                            default:
                        }
                        rec.data.dirty  = true;
                        refresh_all_trace_grids();
                    }
                }
            };

            return {
                xtype   : "cp4_formpanel"
                ,id     : form_id
                ,width  : 201
                ,margin : "0 20 0 0"
                ,items  : [
                    /*
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : proto_name
                    }
                    // */
                    {
                        xtype       : "cp4_formpanel"
                        ,margin     : "24 0 10 0"
                        ,items      : [
                            {
                                xtype       : "cp4_label"
                                ,cls        : "webui4-section-title span"
                                ,html       : "<span>"+ proto_name +"</span>"
                            }
                        ]
                    }
                    ,btnsbar
                    ,grid
                    ,{
                        xtype       : "cp4_displayfield"
                        ,id         : prefix_id
                        ,hidden     : true
                        ,hideLabel  : true
                    }
                ]
            };
        }

        return [{
            xtype           : "cp4_textfield"
            ,id             : "trace_option_dirty"
            ,value          : ""
            ,originalValue  : ""
            ,hideLabel      : true
            ,hidden         : true
        },{
            xtype   : "cp4_formpanel"
            ,margin : 0
            ,layout : "column"
            ,items  : [ TO_forms ]
        }];
    }

//STUB:apply!
    ,apply_preferences              : function(b, eOpts) {
        var params  = CP.ar_util.clearParams();
        var ipv6    = CP.preferences_4.IPV6_STATE;
        var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE();

        var nhs = Ext.getCmp("nexthopselect").getValue();
        if (!nhs) { nhs = ""; }
        var kernel_options = CP.preferences_4.push_kernel_options(params, prefix);
        params[prefix +":kernel"]                       = "t";
        params[prefix +":kernel:maximumpaths"]          = Ext.getCmp("maximumpaths").getRawValue();
        //Nexthop select does not exist in our Linux kernel at this time, ignore binding
        //params[prefix +":kernel:nexthopselect"]         = nhs;
        params[prefix +":kernel:options"]               = kernel_options;

        params[prefix +":ospf2:precedence"]             = Ext.getCmp("ospf2_prec").getDBValue();
        params[prefix +":rip:precedence"]               = Ext.getCmp("rip_prec").getDBValue();
        params[prefix +":bgp:precedence"]               = Ext.getCmp("bgp_prec").getDBValue();
        params[prefix +":ospf2:asedefaults:precedence"] = Ext.getCmp("ospf2ase_prec").getDBValue();

        params[prefix +":ospf3:precedence"]             = Ext.getCmp("ospf3_prec").getDBValue();
        params[prefix +":ripng:precedence"]             = Ext.getCmp("ripng_prec").getDBValue();
        params[prefix +":bgp:ipv6-precedence"]          = Ext.getCmp("bgp_ipv6_prec").getDBValue();
        params[prefix +":ospf3:asedefaults:precedence"] = Ext.getCmp("ospf3ase_prec").getDBValue();

        var wfc = (Ext.getCmp("wait_for_clustering_entry").getValue()) ? "t" : "";
        params[prefix +":router-options:wait-for-clustering"]   = wfc;

        var autoifaceflap = (Ext.getCmp("auto_restore_iface_routes_entry").getValue()) ? "t" : "";
        params[prefix +":router-options:auto-restore-iface-routes"]   = autoifaceflap;
        
        var aam = (Ext.getCmp("active_active_mode_entry").getValue()) ? "t" : "";
        params[prefix +":router-options:active-active-mode"] = aam;

        var maxFileSize = Math.min(Ext.getCmp("size").getRawValue(), CP.preferences_4.MAX_TRACE_SIZE_MB);
        maxFileSize     = Math.max(1, maxFileSize);
        params[prefix +":traceoptions:size"]            = maxFileSize * 1048576;
        params[prefix +":traceoptions:files"]           = Ext.getCmp("files").getValue();

        var rs = Ext.getCmp("rs_routedsyslog").getValue() ? "t" : "";
        var rs_size = Ext.getCmp("rs_routedsyslog_size").getDBValue();
        var rs_files = Ext.getCmp("rs_routedsyslog_files").getDBValue();
        params[prefix +":routedsyslog"]         = rs;
        params[prefix +":routedsyslog:size"]    = rs_size;
        params[prefix +":routedsyslog:files"]   = rs_files;

        var p_list  = CP.preferences_4.PROTO_LIST;
        var i;
        for(i = 0; i < p_list.length; i++) {
            CP.preferences_4.push_trace_grid(params, p_list[i]);
        }
        CP.ar_util.mySubmit();
    }

    ,push_kernel_options            : function(prefix) {
        var k_options       = "";
        var ko_key          = "";
        var ko_id           = "";
        var i;
        for(i = 0; i < CP.preferences_4.ko_id_list.length; i++) {
            ko_id   = CP.preferences_4.ko_id_list[i];
            ko_key  = ko_id.replace(CP.preferences_4.KERNEL_OPTION_PREFIX,"");
            if (Ext.getCmp(ko_id).getValue()) {
                if (k_options.length > 0) {
                    k_options += ",";
                }
                k_options += ko_key;
            }
        }
        return k_options;
    }

    ,push_trace_grid                : function(params, proto) {
        var recs    = Ext.getStore("pref_"+ proto +"_store").getRange();
        var prefix  = Ext.getCmp("pref_"+ proto +"_prefix").getValue();
        var ipv6    = CP.preferences_4.IPV6_STATE;
        var blankOut = false;
        if (ipv6 == true && Ext.Array.indexOf(proto, ["ospf3","dhcp6relay","routerdiscovery6","vrrp6"]) > -1) {
            blankOut = true;
        }
        var d, i;
        for(i = 0; i < recs.length; i++) {
            d = recs[i].data;
            if ( blankOut && ( d.dirty || d.VAL != "" ) ) {
                params[prefix +":"+ d.TO] = "";
            } else if ( recs[i].data.dirty ) {
                params[prefix +":"+ d.TO] = String(d.VAL);
            }
        }
    }
}

