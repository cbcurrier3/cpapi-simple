CP.bgp = {
    IPv6                    : true
    ,router_id_editable     : false
    ,active_protocols_msg   : ""
    ,GLOBAL_LABELWIDTH      : 200
    ,PEERGROUP_LABELWIDTH   : 110
    ,PEER_LABELWIDTH        : 200
    ,PEER_TRACE_LABELWIDTH  : 65
    ,PEER_TRACE_WIDTH       : 124

    ,EXTERNAL_PEER_GROUP_STR: "external-peer"
    ,ROUTING_PEER_GROUP_STR : "routing-peer"
    ,CONFED_PEER_GROUP_STR  : "confed"

    ,SHOW_ADV_BTN_TEXT      : "Show Advanced Settings"
    ,HIDE_ADV_BTN_TEXT      : "Hide Advanced Settings"
    ,ADV_SECTIONTITLE_MARGIN: "15 0 10 0"
    ,ADD_MESSAGE    : "Additional Configurations are subject to change based on Peer Group Type."

    ,UNICAST_MESSAGE        : ""
    ,closeWindowPG          : false
    ,closeWindowP           : false

    ,check_user_action      : function() {
        CP.ar_util.checkBtnsbar("bgp_pg_btnsbar");
        CP.ar_util.checkBtnsbar("open_peergroup_form");
        CP.ar_util.checkBtnsbar("local_sys_form");
        CP.ar_util.checkBtnsbar("add_intf_form");
        CP.ar_util.checkBtnsbar("peer_window_form");
        CP.ar_util.checkDisabledBtn("bgp_misc_apply_btn");
        CP.ar_util.checkDisabledBtn("open_local_system_btn");
    }

    ,getLclAddrWarning      : function() {
        return {
            xtype       : "cp4_inlinemsg"
            // Temporarily disabling BGP local-address feature
            ,hidden     : true
            ,text       : "Do not use Local Address with VRRP or Cluster mode.<br>"
                        + "Local Address should match an interface."
            ,width      : 495
            ,margin     : "0 0 5 0"
        };
    }

    //peer fields that are true/false ("t"/"")
    ,FieldList              :   ["peer"
                                ,"nov4unicast"
                                ,"v6unicast"
                                ,"med"
                                ,"multihop"
                                ,"no-aggregator-id"
                                ,"as-override"
                                ,"removeprivateas"
                                ,"ignorefirstashop"
                                ,"keepalivesalways"
                                ,"passive"
                                ,"nogendefault"
                                ,"route-refresh"
                                ,"graceful-restart"
                                ,"logupdown"
                                ,"analretentive"
                                ,"traceoptions:traceoptions:All"
                                ,"traceoptions:traceoptions:General"
                                ,"traceoptions:traceoptions:Keepalive"
                                ,"traceoptions:traceoptions:Normal"
                                ,"traceoptions:traceoptions:Open"
                                ,"traceoptions:traceoptions:Packets"
                                ,"traceoptions:traceoptions:Policy"
                                ,"traceoptions:traceoptions:Route"
                                ,"traceoptions:traceoptions:State"
                                ,"traceoptions:traceoptions:Task"
                                ,"traceoptions:traceoptions:Timer"
                                ,"traceoptions:traceoptions:Update" ]


    ,init                   : function() {
        CP.bgp.defineStores();
        var configPanel = CP.bgp.configPanel();
        var obj = {
            title           : "BGP"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/bgp.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("local_sys_window");
                if (CP.bgp.closeWindowPG) {
                    CP.ar_util.checkWindowClose("open_peergroup_window");
                    CP.ar_util.checkWindowClose("peer_window");
                } else if (CP.bgp.closeWindowP) {
                    CP.ar_util.checkWindowClose("peer_window");
                }
                CP.bgp.doLoad();

                // Refresh the monitor tab with the new data
                if (CP && CP.bgp_monitor_4 && CP.bgp_monitor_4.doLoad) {
                    CP.bgp_monitor_4.doLoad();
                }
            }
            ,submitFailure  : function() {
                CP.bgp.doLoad();
            }
            ,checkCmpState  : CP.bgp.check_user_action
	    ,cluster_feature_name: 'bgp'
            ,helpFile       : "bgpHelp.html"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//binding related
    ,getPeerTypePrefix          : function(AS_type) {
        var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":bgp:group_type";
        var t = (String(AS_type).length < 1) ? "" : String(AS_type).toLowerCase().charAt(0);
        switch(t) {
            case "i":
                return (prefix +":routing-peer");
            case "e":
                return (prefix +":external-peer");
            case "c":
                return (prefix +":confed");
            default:
                return "";
        }
    }
    ,getPeerGroupBindingPrefix  : function(AS_number, AS_type) {
        var prefix = CP.bgp.getPeerTypePrefix(AS_type);
        if (prefix != "") {
            prefix += ":peeras:"+ String(AS_number);
        }
        return prefix;
    }
    ,getOtherPeerGroupBindingPrefix : function(AS_number, AS_type) {
        var prefixes = [];
        var t = (String(AS_type).length < 1) ? "" : String(AS_type).toLowerCase().charAt(0);
        var types = ["i", "e", "c"];
        var i;
        for (i = 0; i < types.length; i++) {
            if (t != types[i]) {
                prefixes.push( CP.bgp.getPeerGroupBindingPrefix(AS_number, types[i]) );
            }
        }
        return prefixes;
    }

//defineStores
    ,defineStores           : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["peergroup_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("bgp");
        }

        function sortType_ipv4(value) {
            var v = String(value);
            if ( v == "") {
                return 0;
            }
            if (v.indexOf(".") == -1) {
                return parseInt(v, 10);
            }
            var retValue = 0;
            var o = v.split(".");
            var i;
            for(i = 0; i < 4; i++) {
                retValue *= 256;
                if (o[i]) { retValue += parseInt(o[i], 10); }
            }
            return retValue;
        }

        function sortPeerGroup(value) {
            var parts = String(value).split(/[. ]/);

            /* Option 1: Non-integer value (aka peergroup) */
            if (isNaN(parts[0])) {
                return 0;
            }

            /* Option 2: < 65536 AS value
             * Format: "<int>" where int is 1-65535
             */
            if (isNaN(parts[1])) {
                return parseInt(parts[0]);
            }

            /* Option 3: AS DOT
             * Format: "<int>.<int> (<AS PLAIN value>);"
             *         where int is 1-65535
             */
            return ((parseInt(parts[0]) * 65535) + parseInt(parts[1]));
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
                    ,"ipVersion"    : "both"
                    ,"excludeType"  : "6in4 6to4"
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
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //bgp.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "peergroup_store"
            ,autoLoad   : false
            ,fields     : [
                "AS"
                ,{
                    name        : "AS_grid_display"
                    ,sortType   : sortPeerGroup
                }
                ,"AS_type"
                ,"AS_type_sp"
                ,"AS_name"
                ,"AS_dirty_tracker"
                ,{
                    name        : "AS_addr"
                    ,sortType   : sortType_ipv4
                }
                ,"AS_outdelay"
                ,"AS_virtual"
                ,"AS_med"
                ,"AS_nexthopself"

                ,"Peers_list"

                ,"AS_proto_all"
                ,"AS_proto_bgp"
                ,"AS_proto_direct"
                ,"AS_proto_ospf2"
                ,"AS_proto_ospf2ase"
                ,"AS_proto_rip"
                ,"AS_proto_static"

                ,"AS_intf_all"
                ,"Intf_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bgp.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "AS"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.PeerGroups"
                }
            }
            ,noRRPeers  : function() {
                //all peers are not route reflectors
                var st = this;
                var r = st.findRecord("AS_type", "i");
                //only internal peers could be route reflectors
                if (r) {
                    var i;
                    var peers = r.data.Peers_list;
                    for(i = 0; i < peers.length; i++) {
                        switch ( String(peers[i].peer_type).toLowerCase() ) {
                            case "reflectorclient":
                            case "noclientreflect":
                                return false;
                            default:
                        }
                    }
                }
                //get here, no RR related peers found
                return true;
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    var AS_entry = Ext.getCmp("AS_entry");
                    var pg_form = Ext.getCmp("open_peergroup_form");
                    if (AS_entry && pg_form) {
                        var pg_num = AS_entry.getASNumber();
                        var adv_form = Ext.getCmp("advanced_pg_form");
                        var idx = st.findExact("AS", pg_num, 0);
                        var rec = st.getAt(idx);
                        if (rec != null) {
                            pg_form.loadRecord(rec);
                            CP.bgp.load_peer_store(rec);
                            AS_entry.Plain = rec.data.AS;
                            if (adv_form) {
                                adv_form.setVisible(    rec.data.AS_type != "e" );
                                adv_form.setDisabled(   rec.data.AS_type == "e" );
                            }
                        } else {
                            //rec came up null but window is open?  close it
                            CP.ar_util.checkWindowClose("open_peergroup_window");
                        }
                    } //if (AS_entry && pg_form)
                    CP.ar_util.loadListPop( st.storeId );
                } //load
            }
        });
        Ext.getStore("peergroup_store").sort('AS_grid_display', 'ASC');

        Ext.create("CP.WebUI4.Store", {
            storeId     : "peer_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "peer"
                    ,sortType   : sortType_ipv4
                }
                ,"peer_type"
                ,"bgpinterface"
                //all of the Advanced BGP stuff goes here
                ,"comment"
                ,"pingpeer"
                // params[binding + ":" + s ] = rec.data[s]; ??
                //Multiprotocol Capabilities
                ,"nov4unicast"                //IPv4 unicast
                ,"v6unicast"                  //IPv6 unicast
                //Local Address
                ,"lcladdr"                    //Address
                //Peer Local AS
                ,"peer-local-as"                     //Enabled
                ,"peer-local-as:as"                  //Peer Local AS Num
                ,"peer-local-as:inbound-peer-local"  //Add Peer Local AS to incoming updates
                ,"peer-local-as:outbound-local"      //Add Local AS to outgoing updates
                ,"peer-local-as:dual-peering"        //Enable Peering with Local AS
                //MED or WEIGHT
                ,"preference"                 //Weight (for internal peer)
                ,"med"                        //Med sent out
                ,"metricout"                  //Accept MED from external peer
                //Nexthop and TTL
                ,"multihop"                   //EBGP multihop
                ,"ttl"                        //TTL
                //Aggregator
                ,"no-aggregator-id"           //No aggregator ID
                //ASPATH
                ,"ascount"                    //As path prepend count
                ,"as-override"                //As override
                //Private AS
                ,"removeprivateas"            //Remove private AS
                //Timers
                ,"holdtime"                   //Holdtime
                ,"keepalive-interval"         //Keepalive = Holdtime/3
                //Needed when peering with Route Server
                ,"ignorefirstashop"           //Ignore first AS hop
                //Keepalives
                ,"keepalivesalways"           //Do keepalives always
                //Routes
                ,"keep"                       //Accept routes received from the peer
                //Always accept the tcp session from your peer
                ,"passive"                    //Passive
                //Authentication
                ,"auth:md5"                   //AuthType
                ,"auth:md5:password"          //key
                ,"auth:md5:password_existed"  //key was already present
                //Limit bgp updates sent to a peer
                ,"throttle"                   //throttle count
                //Default originate
                ,"nogendefault"               //suppress default-originate when this peer is up
                //Route refresh
                ,"route-refresh"              //route-refresh
                //Graceful Restart
                ,"graceful-restart"    //graceful-restart
                ,"graceful-restart-stalepath-time" //stalepath time
                //Logging
                ,"logupdown"                  //log bgp peer transitions
                ,"analretentive"              //log warnings
                //Traceoptions:
                ,"traceoptions:traceoptions:All"
                ,"traceoptions:traceoptions:General"
                ,"traceoptions:traceoptions:Keepalive"
                ,"traceoptions:traceoptions:Normal"
                ,"traceoptions:traceoptions:Open"
                ,"traceoptions:traceoptions:Packets"
                ,"traceoptions:traceoptions:Policy"
                ,"traceoptions:traceoptions:Route"
                ,"traceoptions:traceoptions:State"
                ,"traceoptions:traceoptions:Task"
                ,"traceoptions:traceoptions:Timer"
                ,"traceoptions:traceoptions:Update"
                //
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "as_intf_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["AS_intf_addr", "newrec"]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    var i_tester = Ext.getCmp("interface_tester");
                    if (i_tester && i_tester.validate) {
                        i_tester.validate();
                    }
                }
                ,remove     : function(st, rec, i, eOpts) {
                    st.fireEvent("load");
                }
                ,add        : function(st, recs, i, eOpts) {
                    st.fireEvent("load");
                }
            }
        });
    }
    ,load_peer_store        : function(rec) {
        var peer_store      = Ext.getStore("peer_store");
        var as_intf_store   = Ext.getStore("as_intf_store");

        if (peer_store) {
            if (rec == null) {
                peer_store.removeAll();
            } else {
                /* Ugly hack in tcl to prevent value from being parsed
                 * as an integer */
                if (rec.data.Peers_list[0] && rec.data.Peers_list[0]['peer-local-as:as']) {
                    rec.data.Peers_list[0]['peer-local-as:as']
                        = rec.data.Peers_list[0]['peer-local-as:as'].split('=')[0];
                }
                if (rec.data.Peers_list[1] && rec.data.Peers_list[1]['peer-local-as:as']) {
                    rec.data.Peers_list[1]['peer-local-as:as']
                        = rec.data.Peers_list[1]['peer-local-as:as'].split('=')[0];
                }
                peer_store.loadData(rec.data.Peers_list);
            }
        }
        if (as_intf_store) {
            if (rec == null) {
                as_intf_store.removeAll();
            } else {
                as_intf_store.loadData(rec.data.Intf_list);
            }
        }
    }

//configPanel
    ,configPanel            : function() {
        return Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "bgp_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender     : CP.bgp.doLoad
                ,validitychange : CP.bgp.check_user_action
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("bgp")
                ,CP.bgp.get_global_and_misc_set()
                ,CP.bgp.get_peergroup_grid()
            ]
        });
    }

    ,mySubmit               : function(closePG, closeP) {
        if ( !( CP.ar_util.checkBlockActivity() ) && CP.ar_util.checkFormValid("bgp_configPanel") ) {
            CP.bgp.closeWindowPG  = (closePG ? true : false);
            CP.bgp.closeWindowP   = (closeP ? true : false);

            var params = CP.ar_util.getParams();
            var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":bgp:group_type";
            params[prefix +":external-peer"] = CP.bgp.EXTERNAL_PEER_GROUP_STR;
            params[prefix +":routing-peer"]  = CP.bgp.ROUTING_PEER_GROUP_STR;
            params[prefix +":confed"]        = CP.bgp.CONFED_PEER_GROUP_STR;

            CP.ar_util.mySubmit();
        }
    }

    ,globalSettingsSubmit               : function() {
        if ( !( CP.ar_util.checkBlockActivity() ) && CP.ar_util.checkFormValid("bgp_configPanel") ) {
            CP.bgp.closeWindowPG  = false;
            CP.bgp.closeWindowP   = false;

            var params = CP.ar_util.getParams();
            var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":bgp:group_type";
            params[prefix +":external-peer"] = CP.bgp.EXTERNAL_PEER_GROUP_STR;
            params[prefix +":routing-peer"]  = CP.bgp.ROUTING_PEER_GROUP_STR;
            params[prefix +":confed"]        = CP.bgp.CONFED_PEER_GROUP_STR;

            CP.ar_util.mySubmit();
        }
    }


    ,doLoad                 : function() {
        CP.ar_util.clearParams();
        //handle various loads
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("bgp");
        }
        var intf_st = Ext.getStore("intf_store");
        if (intf_st) {
            CP.ar_util.loadListPush("intf_store");
            intf_st.load({params: {"instance": CP.ar_util.INSTANCE()}});
        }

        if (CP.bgp.UNICAST_MESSAGE != "") {
            CP.bgp.UNICAST_MESSAGE = "";
        } else {
            var peergroup_store = Ext.getStore("peergroup_store");
            if (peergroup_store) {
                CP.ar_util.loadListPush("peergroup_store");
                peergroup_store.load({params: {"instance": CP.ar_util.INSTANCE()}});
            }

            var p = Ext.getCmp("bgp_configPanel");
            if (p) {
                CP.ar_util.loadListPush("doLoad");
                p.load({
                    url         : "/cgi-bin/bgp.tcl?option=global&instance="+ CP.ar_util.INSTANCE()
                    ,method     : "GET"
                    ,failure    : function() {
                        CP.ar_util.loadListPop("doLoad");
                    }
                    ,success    : function(p, action) {
                        function load_set_value(cmpId, value) {
                            var cmp = Ext.getCmp(cmpId);
                            if (cmp) {
                                cmp.setValue(value);
                                cmp.originalValue = cmp.getRawValue();
                            }
                        }

                        if (action && action.result && action.result.data) {
                            var gData   = action.result.data;
                            var ASNum_Plain = gData.ASNum_Plain;
                            var Confed_Plain  = gData.confederation_Plain;
                            var Domain_Plain  = gData.routingdomain_Plain;

                            /* Hack in tcl to prevent value from being parsed
                             * as an integer */
                            var ASNum_Dot = gData.ASNum_Dot.split('=')[0];
                            var Confed_Dot  = gData.confederation_Dot.split('=')[0];
                            var Domain_Dot = gData.routingdomain_Dot.split('=')[0];

                            CP.bgp.IPv6 = (gData.ipv6 ? true : false);
                            CP.bgp.router_id_editable = (gData.router_id_editable ? true : false);
                            CP.bgp.active_protocols_msg = (gData.active_protocols_msg ? gData.active_protocols_msg : "");

                            var Un_form = Ext.getCmp("unconfigured_form");
                            var LAS_form= Ext.getCmp("las_form");
                            var CON_form= Ext.getCmp("con_form");
                            var state   = 0x0;
                            state = state | ((ASNum_Plain  == 0) ? 0x0 : 0x1);
                            state = state | ((Confed_Plain == 0) ? 0x0 : 0x2);
                            if (state == 0x3) { state = 0x0; }

                            Un_form.setVisible(     state == 0x0 );
                            LAS_form.setVisible(    state == 0x1 );
                            CON_form.setVisible(    state == 0x2 );
                            Ext.getCmp("ASNum").Plain = ASNum_Plain;
                            Ext.getCmp("ASNum").Dot = ASNum_Dot;
                            Ext.getCmp("confederation_display").Plain = Confed_Plain;
                            Ext.getCmp("confederation_display").Dot = Confed_Dot;
                            Ext.getCmp("routingdomain_display").Plain = Domain_Plain;
                            Ext.getCmp("routingdomain_display").Dot = Domain_Dot;

                            Ext.getCmp("peergroup_form").setVisible( state != 0x0 );

                            Ext.getCmp("pg_confed_add_btn").setVisible( state == 0x2 );
                            Ext.getCmp("pg_add_btn").setVisible( state != 0x2 );

                            //manual loads (to enforce originalValue)
                            Ext.getCmp("routerid_display").setValue(gData.routerid);
                            Ext.getCmp("clusterid_display").setValue(gData.clusterid);
                            Ext.getCmp("defaultgateway").setValue(gData.defaultgateway);

                            load_set_value("defaultmetric"  ,gData.defaultmetric);
                            load_set_value("reusebelow"     ,gData.reusebelow);
                            load_set_value("suppressabove"  ,gData.suppressabove);
                            load_set_value("reachdecay"     ,gData.reachdecay);
                            load_set_value("unreachdecay"   ,gData.unreachdecay);
                            load_set_value("maxflap"        ,gData.maxflap);
                            load_set_value("keephistory"    ,gData.keephistory);
                            load_set_value("pinginterval"   ,gData.pinginterval);
                            load_set_value("pingcount"      ,gData.pingcount);

                            load_set_value("dosync"         ,gData.dosync);
                            load_set_value("communities"    ,gData.communities);
                            load_set_value("ecmp_bgp"       ,gData.ecmp);
                            load_set_value("gr_restart_time",gData.gr_restart_time);
                            load_set_value("gr_sel_def_time",gData.gr_sel_def_time);
                            load_set_value("dampenflap_on"  ,gData.dampenflap_on);
                            Ext.getCmp("dampenflap_set").setVisible( gData.dampenflap_on != "" );
                        }
                        var pg_grid = Ext.getCmp("peergroup_grid");
                        if (pg_grid) {
                            pg_grid.getView().refresh();
                        }
                        CP.ar_util.loadListPop("doLoad");
                    }
                });
            }
        }
        CP.bgp.closeWindowPG  = false;
        CP.bgp.closeWindowP   = false;
        CP.ar_util.loadListPop("mySubmit");
    }

    ,get_global_and_misc_set         : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "bgp_global_set"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                }
            }
            ,items      : [
                CP.bgp.get_local_AS_set()
                ,CP.bgp.get_misc_set()
                ,{
                    xtype               : "cp4_button"
                    ,text               : "Apply"
                    ,id                 : "bgp_misc_apply_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.bgp.get_misc_settings();
                        CP.bgp.mySubmit(true, true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        return !m;
                    }
                }
            ]
        };
    }

    ,get_edit_router_id      : function() {
        return {
            xtype       : "cp4_formpanel"
            ,margin : "15 0 2 0"
            ,items      : [
                {
                   xtype           : "cp4_sectiontitle"
                   ,titleText      : "Router ID and Cluster ID"
                   ,width          : CP.bgp.GLOBAL_LABELWIDTH + 120
                   ,margin         : "0 0 10 0"
                }
                ,{
                   xtype           : "cp4_ipv4field_ex"
                   ,fieldLabel     : "Router ID"
                   ,id             : "edit_routerid"
                   ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                   ,width          : CP.bgp.GLOBAL_LABELWIDTH + 135
                   ,entityName     : "Router ID"
                   ,submitValue    : false
                   ,entityName     : "Router ID"
                   ,rejectZero     : false
                   ,allowBlank     : true
                   ,fieldConfig    : {submitValue : false}
                   ,disabled       : !CP.bgp.router_id_editable
                }
                ,{
                    xtype: 'cp4_inlinemsg'
                    ,text: 'The Router ID is used by both BGP and OSPF.'
                    ,width          : CP.bgp.GLOBAL_LABELWIDTH + 114
                    ,hidden         : !CP.bgp.router_id_editable
                }
                ,{
                    xtype               : "cp4_inlinemsg"
                    ,type               : "warning"
                    ,width              : CP.bgp.GLOBAL_LABELWIDTH + 120
                    ,text               : CP.bgp.active_protocols_msg
                    ,hidden             : CP.bgp.router_id_editable
                }
            ]
        };
    }

    ,get_edit_cluster_id        : function() {
         return {
             xtype           : "cp4_ipv4field_ex"
             ,fieldLabel     : "Cluster ID for Route Reflectors"
             ,id             : "edit_clusterid"
             ,margin : "15 0 2 0"
             ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
             ,width          : CP.bgp.GLOBAL_LABELWIDTH + 135
             ,entityName     : "Cluster ID"
             ,submitValue    : false
             ,rejectZero     : false
             ,allowBlank     : true
             ,fieldConfig    : {
                submitValue     : false
             }
             ,getDBValue     : function() {
                var c = this;
                var v = c.getValue();
                if (v == "0.0.0.0") {
                    return "false";
                }
                return v;
             }
         };
    }

    ,get_edit_autonomous_system_id      : function() {

        function radio_change(cmpId, disable) {
            var cmp = Ext.getCmp( cmpId );
            if (cmp) {
                cmp.setDisabled( disable );
                cmp.validate();
                if (disable) {
                    cmp.clearInvalid();
                }
            }
        }

        return {
            xtype   : "cp4_formpanel"
            ,margin : "0 0 0 0"
            ,items  : [
               {
                   xtype           : "cp4_sectiontitle"
                   ,titleText      : "Autonomous System"
                   ,width          : CP.bgp.GLOBAL_LABELWIDTH + 120
               }

               ,{
                    xtype   : "cp4_formpanel"
                    ,layout : "column"
                    ,margin : "15 0 2 0"
                    ,items  : [
                        {
                            xtype       : "cp4_radio"
                            ,id         : "unconfigured_radio"
                            ,name       : "local_sys_rb"
                            ,inputValue : 0
                            ,width      : 15
                            ,height     : 22
                            ,style      : "margin-right:4px;"
                            ,listeners  : {
                                change      : function(rb, newVal, oldVal, eOpts) {
                                    if (newVal) {
                                        radio_change("ASNum_conf"           ,newVal);
                                        radio_change("confederation_conf"   ,newVal);
                                        radio_change("confederation_loop"   ,newVal);
                                        radio_change("routingdomain_conf"   ,newVal);
                                        radio_change("routingdomain_loop"   ,newVal);
                                        Ext.getCmp("local_sys_msg").setVisible(true);
                                    }
                                }
                            }
                        },{
                            xtype       : "cp4_label"
                            ,text       : "Unconfigured"
                            ,style      : "margin-left:0px;margin-top:5px;"
                        }
                    ]
                }
                ,{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,margin         : "0 0 2 0"
                    ,items          : [
                        {
                            xtype       : "cp4_radio"
                            ,id         : "ASNum_radio"
                            ,name       : "local_sys_rb"
                            ,inputValue : 1
                            ,width      : 15
                            ,style      : "margin-right:4px;"
                            ,listeners  : {
                                change      : function(rb, newVal, oldVal, eOpts) {
                                    if (newVal) {
                                        radio_change("ASNum_conf"           ,!newVal);
                                        radio_change("confederation_conf"   ,newVal);
                                        radio_change("confederation_loop"   ,newVal);
                                        radio_change("routingdomain_conf"   ,newVal);
                                        radio_change("routingdomain_loop"   ,newVal);
                                        Ext.getCmp("local_sys_msg").setVisible(true);
                                    }
                                }
                            }
                        },{
                            xtype               : "cp4_label"
                            ,text               : "Local Autonomous System Number:"
                            ,width              : CP.bgp.GLOBAL_LABELWIDTH - 3
                            ,style              : "margin-left:0px;margin-top:4px;margin-right:5px;"
                        },{
                            xtype               : "cp4_textfield"
                            ,fieldLabel         : "Local Autonomous System Number"
                            ,id                 : "ASNum_conf"
                            ,name               : "ASNum_conf"
                            ,hideLabel          : true
                            ,width              : 93
                            ,minLength          : 1
                            ,maxLength          : 11
                            ,enforceMaxLength   : true
                            ,allowBlank         : true
                            ,listeners          : {
                                change              : function(num, newVal, oldVal, eOpts) {
                                    Ext.getCmp("local_sys_msg").setVisible(true);
                                }
                            }
                            ,validator          : function() {
                                var value = this.getRawValue();
                                var result = CP.ar_util.validateConvertToPlain(value);

                                if (result[0] == -1) {
                                    /* Error parsing AS number */
                                    return result[1];
                                }

                                if (result[0] == 23456) {
                                    /* Cannot set to AS TRANS value */
                                    return "AS number cannot be set to 23456 (AS TRANS).";
                                }

                                /* Passed all tests */
                                return true;
                            }
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,margin         : "0 0 2 0"
                    ,items          : [
                        {
                            xtype       : "cp4_radio"
                            ,id         : "confederation_radio"
                            ,name       : "local_sys_rb"
                            ,inputValue : 2
                            ,width      : 15
                            ,style      : "margin-right:4px;"
                            ,listeners  : {
                                change      : function(rb, newVal, oldVal, eOpts) {
                                    if (newVal) {
                                        radio_change("ASNum_conf"           ,newVal);
                                        radio_change("confederation_conf"   ,!newVal);
                                        radio_change("confederation_loop"   ,!newVal);
                                        radio_change("routingdomain_conf"   ,!newVal);
                                        radio_change("routingdomain_loop"   ,!newVal);
                                        Ext.getCmp("local_sys_msg").setVisible(true);
                                    }
                                }
                            }
                        },{
                            xtype       : "cp4_formpanel"
                            ,items      : [
                                {
                                    xtype       : "cp4_formpanel"
                                    ,bodyBorder : true
                                    ,border     : true
                                    ,bodyPadding: 4
                                    ,style      : "margin-bottom:2px;"
                                    ,items      : [
                                        {
                                            xtype   : "cp4_formpanel"
                                            ,layout : "column"
                                            ,items  : [
                                                {
                                                    xtype               : "cp4_label"
                                                    ,text               : "Confederation Identifier:"
                                                    ,width              : CP.bgp.GLOBAL_LABELWIDTH - 10
                                                },{
                                                    xtype               : "cp4_textfield"
                                                    ,fieldLabel         : "Confederation Identifier"
                                                    ,id                 : "confederation_conf"
                                                    ,name               : "confederation_conf"
                                                    ,hideLabel          : true
                                                    ,width              : 93
                                                    ,minLength          : 1
                                                    ,maxLength          : 11
                                                    ,enforceMaxLength   : true
                                                    ,allowBlank         : true
                                                    ,listeners          : {
                                                        change              : function() {
                                                            var lsm = Ext.getCmp("local_sys_msg");
                                                            if (lsm) { lsm.setVisible(true); }
                                                        }
                                                    }
                                                    ,validator          : function() {
                                                        var value = this.getRawValue();
                                                        var result = CP.ar_util.validateConvertToPlain(value);

                                                        if (result[0] == -1) {
                                                            /* Error parsing AS number */
                                                            return result[1];
                                                        }

                                                        if (result[0] == 23456) {
                                                            /* Cannot set to AS TRANS value */
                                                            return "Confederation Identifier cannot be set to 23456 (AS TRANS).";
                                                        }

                                                        /* Passed all tests */
                                                        return true;
                                                    }
                                                }
                                            ]
                                        },{
                                            xtype               : "cp4_numberfield"
                                            ,fieldLabel         : "Loops Permitted in AS Path"
                                            ,id                 : "confederation_loop"
                                            ,name               : "confederation_loop"
                                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH - 15
                                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 83
                                            ,value              : 1
                                            ,minValue           : 1
                                            ,maxValue           : 10
                                            ,maxLength          : 2
                                            ,enforceMaxLength   : true
                                            ,allowDecimals      : false
                                            ,allowBlank         : true
                                            ,emptyText          : "1 "
                                            ,margin             : 0
                                        }
                                    ]
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,bodyBorder : true
                                    ,border     : 2
                                    ,bodyPadding: 4
                                    ,style      : "margin-bottom:2px;"
                                    ,items      : [
                                        {
                                            xtype   : "cp4_formpanel"
                                            ,layout : "column"
                                            ,items  : [
                                                {
                                                    xtype               : "cp4_label"
                                                    ,text               : "Routing Domain Identifier:"
                                                    ,width              : CP.bgp.GLOBAL_LABELWIDTH - 10
                                                },{
                                                    xtype               : "cp4_textfield"
                                                    ,fieldLabel         : "Routing Domain Identifier"
                                                    ,id                 : "routingdomain_conf"
                                                    ,name               : "routingdomain_conf"
                                                    ,hideLabel          : true
                                                    ,width              : 93
                                                    ,minLength          : 1
                                                    ,maxLength          : 11
                                                    ,enforceMaxLength   : true
                                                    ,allowBlank         : true
                                                    ,listeners          : {
                                                        change              : function() {
                                                            var lsm = Ext.getCmp("local_sys_msg");
                                                            if (lsm) { lsm.setVisible(true); }
                                                        }
                                                    }
                                                    ,validator          : function() {
                                                        var value = this.getRawValue();
                                                        var result = CP.ar_util.validateConvertToPlain(value);

                                                        if (result[0] == -1) {
                                                            /* Error parsing AS number */
                                                            return result[1];
                                                        }

                                                        /* Passed all tests */
                                                        return true;
                                                    }
                                                }
                                            ]
                                        },{
                                            xtype               : "cp4_numberfield"
                                            ,fieldLabel         : "Loops Permitted in AS Path"
                                            ,id                 : "routingdomain_loop"
                                            ,name               : "routingdomain_loop"
                                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH - 15
                                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 83
                                            ,value              : 1
                                            ,minValue           : 1
                                            ,maxValue           : 10
                                            ,maxLength          : 2
                                            ,enforceMaxLength   : true
                                            ,allowDecimals      : false
                                            ,allowBlank         : true
                                            ,emptyText          : "1 "
                                            ,margin             : 0
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
                //old confederation_loop location
                ,{
                    xtype               : "cp4_inlinemsg"
                    ,id                 : "local_sys_msg"
                    ,type               : "warning"
                    ,text               : "Changing the AS will result in deletion of all associated BGP, Route Redistribution and Inbound Route Filter configurations."
                    ,margin             : "10 20 5 0"
                    ,hidden             : true
                }
            ]
        };
    }

    ,get_local_AS_set       : function() {
        return {
            xtype       : "cp4_formpanel"
            ,items      : [
                {
                    xtype           : "cp4_sectiontitle"
                    ,titleText      : "BGP Global Settings"
                }
                ,{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Router ID"
                    ,id             : "routerid_display"
                    ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                    ,width          : CP.bgp.GLOBAL_LABELWIDTH + 135
                    ,height             : 22
                    ,value              : "Unconfigured"
                }
               ,{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Cluster ID for Route Reflectors"
                    ,id             : "clusterid_display"
                    ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                    ,width          : CP.bgp.GLOBAL_LABELWIDTH + 135
                    ,height             : 22
                    ,value              : "Unconfigured"
                }
                ,CP.bgp.get_local_system()
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,layout     : "column"
                    ,items      : [
                        {
                            xtype               : "cp4_button"
                            ,text               : "Change Global Settings"
                            ,id                 : "open_local_system_btn"
                            ,style              : "margin-right:10px;"
                            ,overrideNoToken    : false
                            ,handler2           : function(b, e) {
                                CP.bgp.open_local_system_config();
                            }
                            ,disabledConditions : function() {
                                var m = CP.ar_util.checkFormValid("bgp_configPanel");
                                return !m;
                            }
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "unconfig_inlinemsg"
                            ,hidden     : true //show if system turns out to be unconfigured
                            ,type       : "info"
                            ,text       : "Configure the Local System Identification first."
                            ,width      : 300
                            ,style      : "margin-top:0px;"
                        }
                    ]
                }
            ]
        };
    }

    ,get_local_system           : function() {
        var unconfigured_form = {
            xtype   : "cp4_formpanel"
            ,id     : "unconfigured_form"
            ,hidden : true
            ,listeners  : {
                show        : function(p, eOpts) {
                    var unconfig_inline = Ext.getCmp("unconfig_inlinemsg");
                    if (unconfig_inline && unconfig_inline.setVisible) {
                        unconfig_inline.setVisible(true);
                    }
                }
                ,hide       : function(p, eOpts) {
                    var unconfig_inline = Ext.getCmp("unconfig_inlinemsg");
                    if (unconfig_inline && unconfig_inline.setVisible) {
                        unconfig_inline.setVisible(false);
                    }
                }
            }
            ,items  : [
                {
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Local System Identifier"
                    ,id                 : "unconfigured_display"
                    ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                    ,width              : CP.bgp.GLOBAL_LABELWIDTH + 85
                    ,height             : 22
                    ,value              : "Unconfigured"
                }
            ]
        };

        var las_form = {
            xtype       : "cp4_formpanel"
            ,id         : "las_form"
            ,hidden     : true
            ,items      : [
                {
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Local Autonomous System Number"
                    ,id                 : "ASNum"
                    ,name               : "ASNum"
                    ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                    ,width              : CP.bgp.GLOBAL_LABELWIDTH + 150
                    ,height             : 22
                    ,Plain              : 0
                    ,Dot                : ""
                }
            ]
        };

        var con_form = {
            xtype   : "cp4_formpanel"
            ,id     : "con_form"
            ,hidden : true
            ,items  : [
                {
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,margin         : 0
                    ,padding        : 0
                    ,items          : [
                       {
                            xtype               : "cp4_displayfield"
                            ,fieldLabel         : "Confederation Identifier"
                            ,id                 : "confederation_display"
                            ,name               : "confederation"
                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 150
                            ,height             : 12
                            ,Plain              : 0
                            ,Dot                : ""
                        },{
                            xtype               : "cp4_displayfield"
                            ,fieldLabel         : "Number of Loops Permitted in AS Path"
                            ,id                 : "confederation_loop_display"
                            ,name               : "confederation_loop"
                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 30
                            ,height             : 22
                        }
                    ]
                },{
                    xtype           : "cp4_formpanel"
                    ,layout         : "column"
                    ,margin         : 0
                    ,padding        : 0
                    ,items          : [
                        {
                            xtype               : "cp4_displayfield"
                            ,fieldLabel         : "Routing Domain Identifier"
                            ,id                 : "routingdomain_display"
                            ,name               : "routingdomain"
                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 150
                            ,height             : 22
                            ,Plain              : 0
                            ,Dot                : ""
                        },{
                            xtype               : "cp4_displayfield"
                            ,fieldLabel         : "Number of Loops Permitted in AS Path"
                            ,id                 : "routingdomain_loop_display"
                            ,name               : "routingdomain_loop"
                            ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                            ,width              : CP.bgp.GLOBAL_LABELWIDTH + 30
                            ,height             : 22
                        }
                    ]
                }
            ]
        };

        return [
            unconfigured_form
            ,las_form
            ,con_form
        ];
    }

    ,open_local_system_config   : function() {
        function local_sys_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.ar_util.clearParams();

            // Router and Cluster ID
            var routerID    = Ext.getCmp("routerid_display").getRawValue();
            var clusterID   = Ext.getCmp("clusterid_display").getRawValue();
            Ext.getCmp("edit_routerid").setValue(routerID);
            Ext.getCmp("edit_clusterid").setValue(clusterID);

            var LAS         = Ext.getCmp("ASNum").Plain;
            var CON         = Ext.getCmp("confederation_display").Plain;
            var state       = 0x0;
            state           = state | ((LAS == 0) ? 0x0 : 0x1);
            state           = state | ((CON == 0) ? 0x0 : 0x2);
            switch(state) {
                case 1:     //LAS
                    if (LAS > 65535) {
                        LAS = Ext.getCmp("ASNum").Dot;
                    }
                    Ext.getCmp("ASNum_conf").setRawValue(LAS);
                    break;
                case 2:     //confederation
                    var CON_loop    = Ext.getCmp("confederation_loop_display").getRawValue();
                    var RDI         = Ext.getCmp("routingdomain_display").Plain;
                    var RDI_loop    = Ext.getCmp("routingdomain_loop_display").getRawValue();
                    if (CON > 65535) {
                        CON = Ext.getCmp("confederation_display").Dot;
                    }
                    if (RDI > 65535) {
                        RDI = Ext.getCmp("routingdomain_display").Dot;
                    }
                    Ext.getCmp("confederation_conf").setValue(CON);
                    Ext.getCmp("confederation_loop").setValue(CON_loop);
                    Ext.getCmp("routingdomain_conf").setValue(RDI);
                    Ext.getCmp("routingdomain_loop").setValue(RDI_loop);
                    break;
                default:    //neither
                    state = 0;
            }

            Ext.getCmp("unconfigured_radio").setValue(state);
            Ext.getCmp("local_sys_msg").setVisible(false);
        }

        function radio_change(cmpId, disable) {
            var cmp = Ext.getCmp( cmpId );
            if (cmp) {
                cmp.setDisabled( disable );
                cmp.validate();
                if (disable) {
                    cmp.clearInvalid();
                }
            }
        }

        function clear_pg_number(params, pg_num) {
            if (pg_num) {
                params["SPECIAL:peeras:aeic:"+ String(pg_num)] = "";
            }
        }

        function las_save(params, prefix, pg_recs) {
            var ASNum       = Ext.getCmp("ASNum_conf").getRawValue();
            var result = CP.ar_util.validateConvertToPlain(ASNum);
            ASNum = result[0];

            if (ASNum == -1) {
                /* Error parsing AS Number */
                return;
            }

            params[prefix +":autonomoussystem"]             = ASNum;

            // Clear previous iBGP
            clear_pg_number(params, Ext.getCmp("ASNum").Plain);

            // Clear any eBGP groups that equal new AS number and eBGP peers
            // with Peer Local AS set to the new AS number
            clear_pg_number(params, ASNum);

            params[prefix +":confederation"]                = "";
            params[prefix +":confederation:loops"]          = "";
            params[prefix +":routingdomain"]                = "";
            params[prefix +":routingdomain:loops"]          = "";

            var i;
            // Deconfigure all iBGP and confederation groups
            for(i = 0; i < pg_recs.length; i++) {
                if (pg_recs[i].data.AS_type == "c" || pg_recs[i].data.AS_type == "i") {
                    CP.bgp.delete_peergroup_params(pg_recs[i]);
                }
            }
        }

        function con_save(params, prefix, pg_recs) {
            var CON         = Ext.getCmp("confederation_conf").getRawValue();
            var result = CP.ar_util.validateConvertToPlain(CON);
            CON = result[0];

            if (CON == -1) {
                /* Error parsing Confederation value */
                return;
            }

            var CON_loop    = Ext.getCmp("confederation_loop").getRawValue();
            CON_loop = Ext.Number.constrain( ((CON_loop == "") ? 1 : parseInt(CON_loop, 10)), 1, 10);

            var RDI         = Ext.getCmp("routingdomain_conf").getRawValue();
            var result = CP.ar_util.validateConvertToPlain(RDI);
            RDI = result[0];

            if (RDI == -1) {
                /* Error parsing Routing Domain Value */
                return;
            }

            var RDI_loop    = Ext.getCmp("routingdomain_loop").getRawValue();
            RDI_loop = Ext.Number.constrain( ((RDI_loop == "") ? 1 : parseInt(RDI_loop, 10)), 1, 10);

            params[prefix +":autonomoussystem"]             = "";
            params[prefix +":confederation"]                = CON;
            params[prefix +":confederation:loops"]          = CON_loop;
            params[prefix +":routingdomain"]                = RDI;
            params[prefix +":routingdomain:loops"]          = RDI_loop;

            // Clear previous iBGP
            clear_pg_number(params, Ext.getCmp("ASNum").Plain);

            // Clear any eBGP groups that equal new Confederation number and eBGP peers
            // with Peer Local AS set to the new Confederation number
            clear_pg_number(params, CON);


            var i;
            // Deconfigure all iBGP and confederation groups
            for(i = 0; i < pg_recs.length; i++) {
                if (pg_recs[i].data.AS_type == "c" || pg_recs[i].data.AS_type == "i") {
                    CP.bgp.delete_peergroup_params(pg_recs[i]);
                }
            }
        }

        function unconfig_save(params, prefix, pg_recs) {
            params[prefix +":autonomoussystem"]             = "";
            clear_pg_number(params, Ext.getCmp("ASNum_conf").getRawValue());
            clear_pg_number(params, Ext.getCmp("ASNum_conf").originalValue);

            params[prefix +":confederation"]                = "";
            params[prefix +":confederation:loops"]          = "";
            params[prefix +":routingdomain"]                = "";
            params[prefix +":routingdomain:loops"]          = "";

            //deconfigure all Peer Groups
            var i;
            for(i = 0; i < pg_recs.length; i++) {
                CP.bgp.delete_peergroup_params(pg_recs[i]);
            }
        }

        function local_sys_save() {
            var params  = CP.ar_util.getParams();
            var prefix  = "routed:instance:"+ CP.ar_util.INSTANCE();
            var state   = parseInt( Ext.getCmp("unconfigured_radio").getGroupValue() , 10);
            var pg_recs = Ext.getStore("peergroup_store").getRange();
            switch(state) {
                case 1:     las_save(params, prefix, pg_recs);
                    break;
                case 2:     con_save(params, prefix, pg_recs);
                    break;
                default:    unconfig_save(params, prefix, pg_recs);
            }

            params["option"] = "global"
                    
            if (CP.bgp.get_global_settings(params) === false) {
                return false;
            }

            CP.bgp.globalSettingsSubmit();
            return true;
        }

        var local_sys_form = {
            xtype       : "cp4_formpanel"
            ,id         : "local_sys_form"
            ,autoScroll : false
            ,width      : CP.bgp.GLOBAL_LABELWIDTH + 150
            ,height     : 452
            ,listeners  : {
                afterrender     : local_sys_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("local_sys_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("local_sys_save_btn");
                CP.ar_util.checkDisabledBtn("local_sys_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "local_sys_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        return local_sys_save();
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        var f = CP.ar_util.checkFormValid("local_sys_form");
                        return !(m && f);
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            Ext.getCmp("local_sys_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "local_sys_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("local_sys_window");
                    }
                    ,listeners  : {
                        mouseover   : function() {
                            CP.bgp.check_user_action();
                        }
                    }
                }
            ]
            ,items      : [
                {
                   xtype   : "cp4_formpanel"
                   ,margin : "0 0 0 15"
                   ,items  : [
                       CP.bgp.get_edit_router_id()
                       ,CP.bgp.get_edit_cluster_id()
                       ,CP.bgp.get_edit_autonomous_system_id()
                 ]}
            ]
        };

        var local_sys_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "local_sys_window"
            ,title      : "Change Global Settings"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ local_sys_form ]
        });
        local_sys_window.show();
    }

    ,get_misc_set           : function() {
        return [
            {
                xtype           : "cp4_sectiontitle"
                ,titleText      : "Miscellaneous Settings"
            },{
                xtype           : "cp4_formpanel"
                ,layout         : "column"
                ,items          : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Default MED"
                        ,id                 : "defaultmetric"
                        ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                        ,width              : CP.bgp.GLOBAL_LABELWIDTH + 95
                        ,style              : "margin-right:15px;"
                        ,submitValue        : false
                        ,minValue           : 0
                        ,maxValue           : 4294967295
                        ,maxLength          : 10
                        ,enforceMaxLength   : true
                        ,allowBlank         : true
                        ,allowDecimals      : false
                    },{
                        xtype           : "cp4_ipv4field_ex"
                        ,fieldLabel     : "Default Gateway"
                        ,id             : "defaultgateway"
                        ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                        ,width          : CP.bgp.GLOBAL_LABELWIDTH + 135
                        ,submitValue    : false
                        ,allowBlank     : true
                        ,fieldConfig    : {
                            submitValue     : false
                        }
                        ,listeners      : {
                            afterrender     : function(f, eOpts) {
                                var validate_func = function() {
                                    var p = Ext.getCmp("defaultgateway");
                                    if (p && p.validate) {
                                        p.validate();
                                    }
                                };
                                var i;
                                if (f && f.octets && f.validate) {
                                    for(i = 0; i < f.octets.length; i++) {
                                        f.octets[i].addListener("blur", validate_func);
                                        f.octets[i].addListener("change", validate_func);
                                    }
                                }
                            }
                            ,beforedestroy  : function(f, eOpts) {
                                f.events.afterrender.clearListeners();
                            }
                        }
                    }
                ]
            },{
                xtype           : "cp4_formpanel"
                ,layout         : "column"
                ,items          : [
                    {
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "Enable IGP Synchronization"
                        ,id             : "dosync"
                        ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                        ,width          : CP.bgp.GLOBAL_LABELWIDTH + 95
                        ,style          : "margin-right:15px;"
                        ,height         : 22
                        ,submitValue    : false
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "Enable Communities"
                        ,id             : "communities"
                        ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                        ,width          : CP.bgp.GLOBAL_LABELWIDTH + 95
                        ,height         : 22
                        ,submitValue    : false
                    }
                ]
            },{
                xtype           : "cp4_checkbox"
                ,fieldLabel     : "Enable ECMP"
                ,id             : "ecmp_bgp"
                ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                ,width          : CP.bgp.GLOBAL_LABELWIDTH + 95
                ,style          : "margin-right:15px;"
                ,height         : 22
                ,submitValue    : false
            },{
                xtype           : "cp4_formpanel"
                ,layout         : "column"
                ,defaults       : {
                    xtype           : "cp4_numberfield"
                    ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                    ,width          : CP.bgp.GLOBAL_LABELWIDTH + 95
                    ,height         : 22
                    ,submitValue    : false
                    ,allowBlank     : true
                    ,minValue       : 60
                    ,maxValue       : 4095
                    ,maxLength      : 4
                    ,dbSuffix       : "gr_filler"
                    ,pushDBValue    : function(params, prefix) {
                        var c = this;
                        var v = this.getRawValue();
                        if (v != "") {
                            v = parseInt(v, 10);
                            if (isNaN(v) || v < c.minValue || v > c.maxValue) {
                                v = "";
                            }
                        }
                        params[prefix +":"+ c.dbSuffix] = v;
                    }
                }
                ,items          : [
                    {
                        fieldLabel      : "Graceful Restart Time"
                        ,id             : "gr_restart_time"
                        ,dbSuffix       : "graceful-restart-restart-time"
                        ,style          : "margin-right:15px;"
                        ,minValue       : 1
                        ,maxValue       : 4095
                        ,enforceMaxLength: true
                        ,maxLength      : 4
                        ,emptyText      : "Default: 360"
                    },{
                        fieldLabel      : "Graceful Restart Selection Deferral Time"
                        ,id             : "gr_sel_def_time"
                        ,dbSuffix       : "graceful-restart-selection-deferral-time"
                        ,minValue       : 60
                        ,maxValue       : 4095
                        ,enforceMaxLength: true
                        ,maxLength      : 4
                        ,emptyText      : "Default: 360"
                    }
                ]
            },{
                xtype           : "cp4_checkbox"
                ,fieldLabel     : "Enable Weighted Route Dampening"
                ,id             : "dampenflap_on"
                ,labelWidth     : CP.bgp.GLOBAL_LABELWIDTH
                ,width          : CP.bgp.GLOBAL_LABELWIDTH + 95
                ,height         : 22
                ,submitValue    : false
                ,listeners      : {
                    change          : function(box, newVal, oldVal) {
                        var dampenflap_set = Ext.getCmp("dampenflap_set");
                        if (dampenflap_set) {
                            dampenflap_set.setVisible( newVal );
                        }
                    }
                }
            },{
                xtype       : "cp4_formpanel"
                ,id         : "dampenflap_set"
                ,hidden     : true
                ,listeners  : {
                    hide        : function(p, eOpts) {
                        Ext.getCmp("reusebelow").setValue("");
                        Ext.getCmp("suppressabove").setValue("");
                        Ext.getCmp("reachdecay").setValue("");
                        Ext.getCmp("unreachdecay").setValue("");
                        Ext.getCmp("maxflap").setValue("");
                        Ext.getCmp("keephistory").setValue("");
                    }
                    ,show       : function(p, eOpts) {
                        function reset_cmp(cmpId) {
                            var cmp = Ext.getCmp( cmpId );
                            if ( cmp ) {
                                cmp.setValue( cmp.originalValue );
                            }
                        }
                        reset_cmp("reusebelow");
                        reset_cmp("suppressabove");
                        reset_cmp("reachdecay");
                        reset_cmp("unreachdecay");
                        reset_cmp("maxflap");
                        reset_cmp("keephistory");
                    }
                }
                ,items      : [
                    {
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,margin     : 0
                        ,defaults   : {
                            style       : "margin-left:15px;margin-right:15px;"
                        }
                        ,maxWidth   : 857
                        ,items      : [
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Reuse below Metric"
                                ,id                 : "reusebelow"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,emptyText          : "Default: 2"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 1
                                ,maxValue           : 32
                                ,maxLength          : 2
                                ,enforceMaxLength   : true
                                ,validator          : function(v) {
                                    var msg = "";
                                    var rb  = Ext.getCmp("reusebelow").getRawValue();
                                    var sa  = Ext.getCmp("suppressabove").getRawValue();

                                    if (rb == "") { rb = 2; }    else { rb = parseInt(rb,10); }
                                    if (sa == "") { sa = 3; }    else { sa = parseInt(sa,10); }

                                    if (rb >= sa) {
                                        msg +="This value must be less than the Suppress above Metric.";
                                    }

                                    if (msg == "") { return true; }
                                    return msg;
                                }
                                ,listeners          : {
                                    change              : function(num, newVal, oldVal, eOpts) {
                                        if (Ext.getCmp("suppressabove")) {
                                            Ext.getCmp("suppressabove").validate();
                                        }
                                    }
                                }
                            },{
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Suppress above Metric"
                                ,id                 : "suppressabove"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,emptyText          : "Default: 3"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 2
                                ,maxValue           : 32
                                ,maxLength          : 2
                                ,enforceMaxLength   : true
                                ,validator          : function(v) {
                                    var msg = "";
                                    var rb  = Ext.getCmp("reusebelow").getRawValue();
                                    var sa  = Ext.getCmp("suppressabove").getRawValue();
                                    var mf  = Ext.getCmp("maxflap").getRawValue();

                                    if (rb == "") { rb = 2; }    else { rb = parseInt(rb,10); }
                                    if (sa == "") { sa = 3; }    else { sa = parseInt(sa,10); }
                                    if (mf == "") { mf = 16; }   else { mf = parseInt(mf,10); }

                                    if (rb >= sa) {
                                        msg +="This value must be greater than the Reuse below Metric.";
                                    }
                                    if (sa >= mf) {
                                        if (msg != "") { msg += "\n"; }
                                        msg +="This value must be less than the Max Flap Metric.";
                                    }

                                    if (msg == "") { return true; }
                                    return msg;
                                }
                                ,listeners          : {
                                    change              : function(num, newVal, oldVal, eOpts) {
                                        if (Ext.getCmp("reusebelow")) {
                                            Ext.getCmp("reusebelow").validate();
                                        }
                                        if (Ext.getCmp("maxflap")) {
                                            Ext.getCmp("maxflap").validate();
                                        }
                                    }
                                }
                            },{
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Max Flap Metric"
                                ,id                 : "maxflap"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,style              : "margin-left:15px;"
                                ,emptyText          : "Default: 16"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 3
                                ,maxValue           : 64
                                ,maxLength          : 2
                                ,enforceMaxLength   : true
                                ,validator          : function(v) {
                                    var msg = "";
                                    var sa  = Ext.getCmp("suppressabove").getRawValue();
                                    var mf  = Ext.getCmp("maxflap").getRawValue();

                                    if (sa == "") { sa = 3; }    else { sa = parseInt(sa,10); }
                                    if (mf == "") { mf = 16; }   else { mf = parseInt(mf,10); }

                                    if (sa >= mf) {
                                        msg +="This value must be greater than Suppress above Metric.";
                                    }

                                    if (msg == "") { return true; }
                                    return msg;
                                }
                                ,listeners          : {
                                    change              : function(num, newVal, oldVal, eOpts) {
                                        if (Ext.getCmp("suppressabove")) {
                                            Ext.getCmp("suppressabove").validate();
                                        }
                                    }
                                }
                            }
                        ]
                    },{
                        xtype       : "cp4_formpanel"
                        ,layout     : "column"
                        ,margin     : 0
                        ,defaults   : {
                            style       : "margin-left:15px;margin-right:15px;"
                        }
                        ,maxWidth   : 857
                        ,items      : [
                            {
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Reachable Decay Time"
                                ,id                 : "reachdecay"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,emptyText          : "Default: 300"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 1
                                ,maxValue           : 900
                                ,maxLength          : 3
                                ,enforceMaxLength   : true
                                ,validator          : function(v) {
                                    var lo  = Ext.getCmp("reachdecay").getRawValue();
                                    var hi  = Ext.getCmp("unreachdecay").getRawValue();
                                    if (lo == "") { lo = 300; } else { lo = parseInt(lo,10); }
                                    if (hi == "") { hi = 900; } else { hi = parseInt(hi,10); }
                                    if (lo > hi) {
                                        return ("This value must be less than or "
                                                +"equal to Unreachable Decay Time.");
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function(num, newVal, oldVal, eOpts) {
                                        var other = Ext.getCmp("unreachdecay");
                                        if (other) { other.validate(); }
                                    }
                                }
                            },{
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Unreachable Decay Time"
                                ,id                 : "unreachdecay"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,emptyText          : "Default: 900"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 1
                                ,maxValue           : 2700
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                                ,validator          : function(v) {
                                    var lo  = Ext.getCmp("reachdecay").getRawValue();
                                    var hi  = Ext.getCmp("unreachdecay").getRawValue();
                                    if (lo == "") { lo = 300; } else { lo = parseInt(lo,10); }
                                    if (hi == "") { hi = 900; } else { hi = parseInt(hi,10); }
                                    if (lo > hi) {
                                        return ("This value must be greater than "
                                            +"or equal to Reachable Decay Time.");
                                    }
                                    return true;
                                }
                                ,listeners          : {
                                    change              : function(num, newVal, oldVal, eOpts) {
                                        var other = Ext.getCmp("reachdecay");
                                        if (other) { other.validate(); }
                                    }
                                }
                            },{
                                xtype               : "cp4_numberfield"
                                ,fieldLabel         : "Keep History Time"
                                ,id                 : "keephistory"
                                ,labelWidth         : 150
                                ,width              : 255
                                ,style              : "margin-left:15px;"
                                ,emptyText          : "Default: 1800"
                                ,submitValue        : false
                                ,allowBlank         : true
                                ,allowDecimals      : false
                                ,minValue           : 2
                                ,maxValue           : 5400
                                ,maxLength          : 4
                                ,enforceMaxLength   : true
                            }
                        ]
                    }
                ]
            },{
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,margin     : 0
                ,defaults   : {
                    style       : "margin-right:15px;"//margin-left:15px;
                }
                ,maxWidth   : 857
                ,items      : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Ping Interval"
                        ,id                 : "pinginterval"
                        ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                        ,width              : CP.bgp.GLOBAL_LABELWIDTH + 95
                        ,emptyText          : "Default: 2"
                        ,submitValue        : false
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 60
                        ,maxLength          : 3
                        ,enforceMaxLength   : true
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Ping Count"
                        ,id                 : "pingcount"
                        ,labelWidth         : CP.bgp.GLOBAL_LABELWIDTH
                        ,width              : CP.bgp.GLOBAL_LABELWIDTH + 95
                        ,emptyText          : "Default: 3"
                        ,submitValue        : false
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 10
                        ,maxLength          : 3
                        ,enforceMaxLength   : true
                    }
                ]
            }
        ];
    }
    
    ,handle_ipv4field         : function (cmpId, params, binding) {
        //octet1_
        var i;
        for(i = 1; i < 5; i++) {
            if ( !(Ext.getCmp("octet"+ i +"_"+ cmpId).isValid()) ) {
                return;
            }
        }
        if ( Ext.getCmp("webui_ipv4field_hidden_"+ cmpId).isDirty() ) {
            params[binding] = Ext.getCmp( cmpId ).getValue();
        }
    }

    ,get_global_settings     : function(params) {
        var clusterid_cmp = Ext.getCmp("edit_clusterid");
        if (clusterid_cmp) {
            var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE();
            var clusterid = clusterid_cmp.getDBValue();
            var push_clusterid = false;
            var pg_st = Ext.getStore("peergroup_store");

            if ( clusterid == "false" ) {
                Ext.Msg.alert("Error", "Cluster ID can\'t be 0.0.0.0.");
                return false;
            } else if ( clusterid != "" || (pg_st && pg_st.noRRPeers && pg_st.noRRPeers() ) ) {
                //clusterid is non-empty or there are no RR related peers
                params[prefix +":bgp:clusterid"] = clusterid;
            } else {
                Ext.Msg.alert("Error",
                    "The Cluster ID cannot be deleted because one or more Route "
                    +"Reflector Client peers exists.<br>Remove those peers before "
                    +"deleting the Cluster ID.");
                return false;
            }
        }

        CP.bgp.handle_ipv4field("edit_routerid"         ,params ,prefix +":routerid");
        return true;        
    }

    ,get_misc_settings      : function() {
        function handle_numberfield(cmpId, params, binding) {
            var cmp = Ext.getCmp( cmpId );
            if (cmp && cmp.isValid() && cmp.isDirty()) {
                params[binding] = cmp.getRawValue();
            }
        }

        function handle_checkbox(cmpId, params, binding) {
            var cmp = Ext.getCmp( cmpId );
            if (cmp && cmp.isDirty()) {
                params[binding] = (cmp.getValue()) ? "t" : "";
            }
        }

        var params      = CP.ar_util.getParams();
        var prefix      = "routed:instance:"+ CP.ar_util.INSTANCE();

        CP.bgp.handle_ipv4field("defaultgateway"   ,params ,prefix +":bgp:gendefault:gateway");

        handle_numberfield("defaultmetric"  ,params ,prefix +":bgp:defaultmetric");

        handle_checkbox("dosync"            ,params ,prefix +":bgp:dosync");
        handle_checkbox("communities"       ,params ,prefix +":bgp:communities");
        handle_checkbox("ecmp_bgp"          ,params ,prefix +":bgp:ecmp");
        handle_checkbox("dampenflap_on"     ,params ,prefix +":dampenflap:on");

        handle_numberfield("reusebelow"     ,params ,prefix +":dampenflap:reusebelow");
        handle_numberfield("suppressabove"  ,params ,prefix +":dampenflap:suppressabove");
        handle_numberfield("reachdecay"     ,params ,prefix +":dampenflap:reachdecay");
        handle_numberfield("unreachdecay"   ,params ,prefix +":dampenflap:unreachdecay");
        handle_numberfield("maxflap"        ,params ,prefix +":dampenflap:maxflap");
        handle_numberfield("keephistory"    ,params ,prefix +":dampenflap:keephistory");
        handle_numberfield("pinginterval"   ,params ,prefix +":bgp:pinginterval");
        handle_numberfield("pingcount"      ,params ,prefix +":bgp:pingcount");

        var graceful_restart_list = ["gr_restart_time"
                                    ,"gr_sel_def_time"];
        var c, i, id;
        for(i = 0; i < graceful_restart_list.length; i++) {
            id = graceful_restart_list[i];
            c = Ext.getCmp(id);
            if (c && c.pushDBValue) {
                c.pushDBValue(params, prefix +":bgp");
            }
        }
    }

//push peergroup
    ,delete_peergroup_params    : function(pg_rec) {
        if (pg_rec == null) {
            return;
        }
        var params  = CP.ar_util.getParams();
        var prefix  = CP.bgp.getPeerGroupBindingPrefix(pg_rec.data.AS, pg_rec.data.AS_type);
        if (prefix == "") { return; }
        var i;

        params["SPECIAL:peeras:aeic:"+ String(pg_rec.data.AS)] = "";
        //params[pg_rec.data.AS +"_binding"]          = prefix;
        params[prefix]                              = "";
        params[prefix +":lcladdr"]                  = "";
        params[prefix +":outdelay"]                 = "";
        params[prefix +":virtual"]                  = "";
        params[prefix +":metricout"]                = "";
        params[prefix +":next-hop-self"]            = "";

        params[prefix +":proto:protocol:all"]       = "";
        params[prefix +":proto:protocol:bgp"]       = "";
        params[prefix +":proto:protocol:direct"]    = "";
        params[prefix +":proto:protocol:ospf2"]     = "";
        params[prefix +":proto:protocol:ospf2ase"]  = "";
        params[prefix +":proto:protocol:rip"]       = "";
        params[prefix +":proto:protocol:static"]    = "";

        params[prefix +":interface:all"]            = "";
        var i_recs = Ext.getStore("intf_store").getRange();
        for(i = 0; i < i_recs.length; i++) {
            params[prefix +":interface:address:"+ i_recs[i].data.intf] = "";
        }

        CP.bgp.load_peer_store(pg_rec);
        var peer_recs = Ext.getStore("peer_store").getRange();
        for(i = 0; i < peer_recs.length; i++) {
            CP.bgp.delete_peer_params(params, prefix, peer_recs[i]);
        }

        Ext.getStore("peergroup_store").remove(pg_rec);
    }

//push peer
    ,delete_peer_params         : function(params, prefix, peer_rec) {
        var rr_prefix   = prefix +":rrclient:"+ peer_rec.data.peer_type;
        var peer_prefix = rr_prefix +":peer:"+ peer_rec.data.peer;
        var p;
        for(p in peer_rec.data) {
            CP.bgp.push_peer_param(params, peer_prefix, p, "");
        }
        params[peer_prefix +":holdtime"]            = "";
        params[peer_prefix +":keepalive-interval"]  = "";
        params[peer_prefix +":ping"]                = "";
        Ext.getStore("peer_store").remove(peer_rec);
        if (Ext.getStore("peer_store").getCount() < 1) {
            params[rr_prefix]                       = "";
        }
    }

    ,push_peer_param            : function(params, peer_prefix, field, value) {
        switch(field) {
            case "peer":                params[peer_prefix] = value;
                                        break;
            case "pingpeer":            params[peer_prefix +":ping"] = value;
                                        break;
            case "peer_enable":         break;
            case "peer_binding":        break;
            case "peer_type":           break;
            case "peer_delete":         break;
            case "peer_dirty":          break;
            case "newrec":              break;
            case "holdtime":            break; //skip and handle after
            case "keepalive-interval":  break; //skip and handle after
            default:
                params[peer_prefix +":"+ field] = value;
        }
    }

//peergroup grid
    ,get_peergroup_grid         : function() {
        var peergroup_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "bgp_pg_btnsbar"
            ,items  : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Add"
                    ,id                 : "pg_confed_add_btn"
                    ,overrideNoToken    : false
                    ,handler2            : function(b, e) {
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        return !m;
                    }
                    ,menu               : {
                        style   : { overflow: "visible" }
                        ,xtype  : "menu"
                        ,plain  : true
                        ,items  : [
                            {
                                text        : "Add Confederation Peer Group"
                                ,id         : "pg_add_btn_confed"
                                ,iconCls    : "element"
                                ,handler    : function() {
                                    Ext.getCmp("peergroup_grid").getSelectionModel().deselectAll();
                                    CP.bgp.open_peergroup_window("add_confed");
                                }
                            },{
                                text        : "Add External Peer Group"
                                ,id         : "pg_add_btn_ext"
                                ,iconCls    : "element"
                                ,hidden     : !(CP.bgp.IPv6)
                                ,handler    : function() {
                                    Ext.getCmp("peergroup_grid").getSelectionModel().deselectAll();
                                    CP.bgp.open_peergroup_window("add");
                                }
                            }
                        ]
                    }
                }
                ,{
                    xtype               : "cp4_button"
                    ,text               : "Add"
                    ,id                 : "pg_add_btn"
                    ,overrideNoToken    : false
                    ,handler2            : function(b, e) {
                        Ext.getCmp("peergroup_grid").getSelectionModel().deselectAll();
                        CP.bgp.open_peergroup_window("add");
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        return !m;
                    }
                }
                ,{
                    xtype               : "cp4_button"
                    ,text               : "Edit"
                    ,id                 : "pg_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {

                        var sm = Ext.getCmp("peergroup_grid").getSelectionModel();
                        var rec = sm.getLastSelected();

                        var AS_type         = rec.data.AS_type;
                        if (AS_type == "p") {
                            Ext.Msg.alert("Read-Only Peer Group",
                                    "This is part of a custom external peer" +
                                    " group and must be edited using the" +
                                    " command line interface.");
                            return;
                        } else if (AS_type == "c") {
                            var T = "Edit Confederation " + rec.data.AS_grid_display +" Peer Group";
                            CP.bgp.open_peergroup_window(T);
                        } else {
                            var T = "Edit AS " + rec.data.AS_grid_display +" Peer Group";
                            CP.bgp.open_peergroup_window(T);
                        }
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        if (!m) {
                            return true;
                        }
                        var g = Ext.getCmp("peergroup_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "pg_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var i;
                        var sm = Ext.getCmp("peergroup_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs.length > 0) {
                            CP.ar_util.clearParams();
                            for(i = 0; i < recs.length; i++) {
                                CP.bgp.delete_peergroup_params(recs[i]);
                            }
                            CP.bgp.mySubmit(true, true);
                        }

                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        if (!m) {
                            return true;
                        }
                        var g = Ext.getCmp("peergroup_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var peergroup_cm = [
            {
                text            : "Peer Group"
                ,dataIndex      : "AS_grid_display"
                ,width          : 160
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Group Type"
                ,dataIndex      : "AS_type_sp"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    return CP.ar_util.rendererSpecific(value, value, "center");
                }
            },{
                text            : "Local Address"
                ,dataIndex      : "AS_addr"
                // Temporarily disabling BGP local-address feature
                ,hidden         : true
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value) {
                    var retValue = String(value).toLowerCase();
                    var color = "black";
                    if (retValue.indexOf(":") > -1 && !(CP.bgp.IPv6) ) {
                        retValue += " (IPv6 is not enabled)";
                        color = "red";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Peers"
                ,dataIndex      : "Peers_list"
                ,width          : 180
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    function addPeerText(p) {
                        var oVal = String(p.peer).toLowerCase();
                        var v = oVal;
                        var s = false;
                        if (v.indexOf("v6addr:") != -1) {
                            var rVal = v.replace("v6addr:", "");
                            v = CP.ip6convert.db_2_ip6(rVal);
                            v = v.toUpperCase();
                            if ( !(CP.bgp.IPv6) ) {
                                v += " (Need to delete)";
                                s = true;
                            } else if (String(p.bgpinterface) != ""
                                && CP.util.getIPv6AddressType(rVal) == CP.util.ADDR_TYPE_V6_LINK_LOCAL) {
                                    v += " via "+ String(p.bgpinterface);
                            }
                        }
                        if (!s) {
                            switch( String(p.peer_type).toLowerCase() ) {
                                case "reflectorclient":
                                    v += " (Reflector Client)";
                                    break;
                                case "noclientreflect":
                                    v += " (No Client Reflector)";
                                    break;
                                default:
                            }
                        }
                        return v;
                    }

                    var retValue = "None";
                    if (value.length > 0) {
                        var i = 0;
                        retValue = addPeerText( value[i] );
                        for(i = 1; i < value.length; i++) {
                            retValue += "<br />"+ addPeerText( value[i] );
                        }
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Description"
                ,dataIndex      : "AS_name"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var peergroup_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("bgp_pg_btnsbar");
                }
            }
        });

        var peergroup_grid = {
            xtype               : "cp4_grid"
            ,id                 : "peergroup_grid"
            ,width              : 750
            ,height             : 181
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("peergroup_store")
            ,columns            : peergroup_cm
            ,selModel           : peergroup_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("pg_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return {
            xtype   : "cp4_formpanel"
            ,id     : "peergroup_form"
            ,items  : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Peer Groups"
                }
                ,peergroup_btnsbar
                ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ peergroup_grid ]
                }
            ]
        };
    }

    ,open_peergroup_window      : function(TITLE) {
        var AS_entry;
        var AS_type_sp = {
            xtype   : "cp4_formpanel"
            ,layout : "column"
            ,margin : 0
            ,items  : [
                {
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Peer Group Type"
                    ,id                 : "AS_type_sp_entry"
                    ,name               : "AS_type_sp"
                    ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                    ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                    ,height             : 22
                    ,value              : ""
                },{
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Peer Group Type"
                    ,id                 : "AS_type_entry"
                    ,name               : "AS_type"
                    ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                    ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                    ,height             : 22
                    ,value              : ""
                    ,hidden             : true
                }
            ]
        };

        if (TITLE == "add") {
            /* External/Internal Peer Group, i.e not a confederation peer group */
            TITLE = "Add Peer Group";

            AS_entry = {
                xtype               : "cp4_textfield"
                ,fieldLabel         : "Peer AS Number"
                ,id                 : "AS_entry"
                ,name               : "AS"
                ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                ,allowDecimals      : true
                ,value              : ""
                ,maxLength          : 11
                ,enforceMaxLength   : true
                ,getASNumber        : function() {
                    var value = this.getRawValue();
                    var result = CP.ar_util.validateConvertToPlain(value);
                    return result[0];
                }
                ,validator          : function(v) {
                    var pg_st = Ext.getStore("peergroup_store");
                    var value = this.getRawValue();
                    var result = CP.ar_util.validateConvertToPlain(value);

                    if (result[0] == -1) {
                        return result[1];
                    }
                    value = result[0];

                    if (pg_st && -1 != pg_st.findExact("AS", value)) {
                        return "This peer group already exists.";
                    }

                    // Make sure the external AS ID doesn't match our
                    // confederation ID if it is set
                    var CON = Ext.getCmp("confederation_display").Plain;
                    if (CON != "" && CON == value) {
                        return "The external peer group's AS Number cannot match the Confederation ID.";
                    }

                    // Make sure the external AS ID doesn't match our routing
                    // domain id since it is external if it is set
                    var RDI = Ext.getCmp("routingdomain_display").getRawValue();
                    if (RDI != "" && parseInt(RDI, 10) == value) {
                        return "The external peer group's AS Number cannot match our Routing Domain ID.";
                    }
                    return true;
                }
                ,listeners          : {
                    change              : function(num, newVal, oldVal, eOpts) {
                        var value       = this.getRawValue();
                        var result = CP.ar_util.validateConvertToPlain(value);
                        if (result[0] == -1) {
                            /* Error parsing AS number */
                            return;
                        }
                        value = result[0];

                        var ASNum       = Ext.getCmp("ASNum").Plain;

                        var adv_form    = Ext.getCmp("advanced_pg_form");
                        var peer_grid   = Ext.getCmp("peer_grid");

                        var vis         = Ext.getCmp("AS_entry").validate();
                        var advVis      = vis;

                        var AS_t_e      = Ext.getCmp("AS_type_entry");
                        var AS_t_sp     = Ext.getCmp("AS_type_sp_entry");

                        if (ASNum == value) {
                            AS_t_e.setValue("i");
                            AS_t_sp.setValue("Internal");
                        } else {
                            AS_t_e.setValue("e");
                            AS_t_sp.setValue("External");
                            advVis = false;
                        }
                        if (peer_grid) {
                            peer_grid.setDisabled(!vis);
                        }
                        if (adv_form) {
                            adv_form.setVisible( advVis );
                            adv_form.setDisabled( !advVis );
                        }
                    }
                    ,afterrender        : function(num, eOpts) {
                        num.validate();
                    }
                }
            };
        } else if (TITLE == "add_confed") {
            TITLE = "Add Confederation Peer Group";

            AS_entry = {
                xtype               : "cp4_textfield"
                ,fieldLabel         : "Routing Domain ID"
                ,id                 : "AS_entry"
                ,name               : "AS"
                ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                ,allowDecimals      : true
                ,value              : ""
                ,maxLength          : 11
                ,enforceMaxLength   : true
                ,getASNumber        : function() {
                    var value = this.getRawValue();
                    var result = CP.ar_util.validateConvertToPlain(value);
                    return result[0];
                }
                ,validator          : function(v) {
                    var pg_st = Ext.getStore("peergroup_store");
                    var value = this.getRawValue();
                    var result = CP.ar_util.validateConvertToPlain(value);

                    if (result[0] == -1) {
                        return result[1];
                    }
                    value = result[0];

                    if (pg_st && -1 != pg_st.findExact("AS", value)) {
                        return "This peer group already exists.";
                    }

                    return true;
                }
                ,listeners          : {
                    change              : function(num, newVal, oldVal, eOpts) {
                        var value       = this.getRawValue();
                        var ASNum       = Ext.getCmp("ASNum").Plain;
                        var adv_form    = Ext.getCmp("advanced_pg_form");
                        var peer_grid   = Ext.getCmp("peer_grid");

                        var vis         = Ext.getCmp("AS_entry").validate();
                        var advVis      = vis;

                        var AS_t_e      = Ext.getCmp("AS_type_entry");
                        var AS_t_sp     = Ext.getCmp("AS_type_sp_entry");

                        AS_t_e.setValue("c");
                        AS_t_sp.setValue("Confederation");

                        if (peer_grid) {
                            peer_grid.setDisabled(!vis);
                        }
                        if (adv_form) {
                            adv_form.setVisible( advVis );
                            adv_form.setDisabled( !advVis );
                        }
                    }
                    ,afterrender        : function(num, eOpts) {
                        num.validate();
                    }
                }
            };
        } else if (TITLE.indexOf("Confederation") != -1) {
            /* Editing Confederation */
            AS_entry = {
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "Routing Domain ID"
                ,id                 : "AS_entry"
                ,name               : "AS_grid_display"
                ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                ,height             : 22
                ,Plain              : 0
                ,Dot                : ""
                ,getASNumber        : function() {
                    return this.Plain;
                }
            };
        } else {
            /* Editing Peer Group */
            AS_entry = {
                xtype               : "cp4_formpanel"
                ,id                 : "AS_entry_form"
                ,items              : [
                    {
                        xtype               : "cp4_displayfield"
                        ,fieldLabel         : "Peer AS Number"
                        ,id                 : "AS_entry"
                        ,name               : "AS_grid_display"
                        ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                        ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 150
                        ,height             : 22
                        ,Plain              : 0
                        ,Dot                : ""
                        ,getASNumber        : function() {
                             return this.Plain;
                        }
                    }
                ]
            };
        }

        function open_peergroup_ar(p, eOpts) {
            function setValueOriginal(id, v) {
                var c = Ext.getCmp(id);
                if (c) {
                    c.setValue(v);
                    if (c.getRawValue) {
                        v = c.getRawValue();
                    } else if (c.getValue) {
                        v = c.getValue();
                    }
                    c.originalValue = v;
                }
            }

            p.form._boundItems = null;
            CP.ar_util.clearParams();
            var adv_form = Ext.getCmp("advanced_pg_form");
            var rec = null;

            if (Ext.getCmp("AS_entry").getXType() == "cp4_displayfield") {
                //edit
                rec = Ext.getCmp("peergroup_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                if (adv_form) {
                    adv_form.setVisible(    rec.data.AS_type != "e" );
                    adv_form.setDisabled(   rec.data.AS_type == "e" );
                }
                Ext.getCmp("AS_dirty_tracker").setValue(rec.data.AS_dirty_tracker);
                Ext.getCmp("AS_entry").Plain = rec.data.AS;

            } else {
                //add
                setValueOriginal("AS_name", "");
                setValueOriginal("AS_proto_all", true);
                setValueOriginal("AS_intf_all", true);
                setValueOriginal("AS_addr", "");

                var vis = true;
                if (adv_form) {
                    adv_form.setVisible( vis );
                    adv_form.setDisabled( !vis );
                }
                Ext.getCmp("AS_entry").fireEvent("change");
                Ext.getCmp("AS_dirty_tracker").setValue(true);
            }
            CP.bgp.load_peer_store(rec);
            if (p.chkBtns) { p.chkBtns(); }
        }

        function get_tricky_fields_isValid() {
            var retValue = true;
            var i_tester = Ext.getCmp("interface_tester");
            if (i_tester && i_tester.validate) {
                retValue = i_tester.validate() && retValue;
                CP.bgp.test_i_t_val = i_tester.validate();
            }
            var p_tester = Ext.getCmp("protocol_tester");
            if (p_tester && p_tester.validate) {
                retValue = p_tester.validate() && retValue;
                CP.bgp.test_p_t_val = p_tester.validate();
            }
            CP.bgp.test_combined_val = retValue;
            return retValue;
        }

        function dirtyWindow() {
            function fixValue(v) {
                switch( Ext.typeOf(v) ) {
                    case "null":
                    case "undefined":
                        v = "";
                        break;
                    default:
                }
                return String(v);
            }
            var dt = Ext.getCmp("AS_dirty_tracker");
            if ( dt && dt.getValue && dt.getValue() ) {
                return true;
            }
            var ids =   ["AS_addr"              ,"AS_name"
                        ,"AS_virtual"           ,"AS_outdelay"
                        ,"AS_med"               ,"AS_nexthopself"
                        ,"AS_intf_all"          ,"AS_proto_all"
                        ,"AS_proto_bgp"         ,"AS_proto_direct"
                        ,"AS_proto_rip"         ,"AS_proto_static"
                        ,"AS_proto_ospf2"       ,"AS_proto_ospf2ase"];
            var i, c, o, v;
            for(i = 0; i < ids.length; i++) {
                c = Ext.getCmp(ids[i]);
                v = 0; o = 0;
                if (c) {
                    if (c.xtype == "cp4_checkbox") {
                        v = String( c.getValue() );
                        o = c.originalValue ? "true" : "false";
                    } else {
                        v = fixValue( c.getRawValue() );
                        o = fixValue( c.originalValue );
                    }
                }
                if (v != o) {
                    return true;
                }
            }
            return false;
        }

        function save_peergroup(closeWindow, clearTheParams) {
            if (closeWindow == null) {
                closeWindow = true;
            }
            if (clearTheParams == null) {
                clearTheParams = true;
            }
            var params = (clearTheParams ? CP.ar_util.clearParams() : CP.ar_util.getParams());
            if (!closeWindow && !dirtyWindow() ) {
                return true;
            }
            var i;
            CP.bgp.get_misc_settings();

            var AS              = Ext.getCmp("AS_entry").getASNumber();
            if (AS == -1) {
                /* Error parsing AS number */
                return false;
            }

            var AS_type         = Ext.getCmp("AS_type_entry").getValue();

            var prefix          = CP.bgp.getPeerGroupBindingPrefix(AS, AS_type);
            if (prefix == "") { return false; }
            var typePrefix      = CP.bgp.getPeerTypePrefix(AS_type);
            var other_prefixes  = CP.bgp.getOtherPeerGroupBindingPrefix(AS, AS_type);

            var AS_name         = Ext.getCmp("AS_name").getRawValue();
            var lcladdr         = "";
            if ( Ext.getCmp("AS_addr") ) {
                lcladdr         = Ext.getCmp("AS_addr").getDBValue();
            }
            var metricout       = Ext.getCmp("AS_med").getRawValue();
            var next_hop_self   = (Ext.getCmp("AS_nexthopself").getValue()) ? "t" : "";
            var outdelay        = Ext.getCmp("AS_outdelay").getRawValue();
            var virtual         = (Ext.getCmp("AS_virtual").getValue()) ? "t" : "";

            for(i = 0; i < other_prefixes.length; i++) {
                params[other_prefixes[i]]           = "";
            }
            params[typePrefix]                      = "t";
            params[prefix]                          = "t";
            params[prefix +":name"]                 = AS_name;
            params[prefix +":lcladdr"]              = lcladdr;
            params[prefix +":outdelay"]             = outdelay;
            params[prefix +":virtual"]              = virtual;

            if (AS_type != "e") {
                params[prefix +":metricout"]            = metricout;
                params[prefix +":next-hop-self"]        = next_hop_self;
                //interfaces
                var all_interfaces  = (Ext.getCmp("AS_intf_all").getValue()) ? "t" : "";
                params[prefix +":interface:all"] = all_interfaces;
                //pre clear interfaces
                var intf_recs = Ext.getStore("intf_store").getRange();
                for(i = 0; i < intf_recs.length; i++) {
                    params[prefix +":interface:address:"+ intf_recs[i].data.intf] = "";
                }
                //push enabled ones
                if (all_interfaces == "") {
                    intf_recs = Ext.getStore("as_intf_store").getRange();
                    for(i = 0; i < intf_recs.length; i++) {
                        params[prefix +":interface:address:"+ intf_recs[i].data.AS_intf_addr]   = "t";
                    }
                }
                //protocols
                var all_protocols   = (Ext.getCmp("AS_proto_all").getValue()) ? "t" : "";
                var proto_bgp       = "";
                var proto_direct    = "";
                var proto_rip       = "";
                var proto_static    = "";
                var proto_ospf2     = "";
                var proto_ospf2ase  = "";
                if (all_protocols == "") {
                    proto_bgp       = (Ext.getCmp("AS_proto_bgp").getValue())       ? "t" : "";
                    proto_direct    = (Ext.getCmp("AS_proto_direct").getValue())    ? "t" : "";
                    proto_rip       = (Ext.getCmp("AS_proto_rip").getValue())       ? "t" : "";
                    proto_static    = (Ext.getCmp("AS_proto_static").getValue())    ? "t" : "";
                    proto_ospf2     = (Ext.getCmp("AS_proto_ospf2").getValue())     ? "t" : "";
                    proto_ospf2ase  = (Ext.getCmp("AS_proto_ospf2ase").getValue())  ? "t" : "";
                }
                params[prefix +":proto:protocol:all"]       = all_protocols;
                params[prefix +":proto:protocol:bgp"]       = proto_bgp;
                params[prefix +":proto:protocol:direct"]    = proto_direct;
                params[prefix +":proto:protocol:rip"]       = proto_rip;
                params[prefix +":proto:protocol:static"]    = proto_static;
                params[prefix +":proto:protocol:ospf2"]     = proto_ospf2;
                params[prefix +":proto:protocol:ospf2ase"]  = proto_ospf2ase;
            }

            if ( !(CP.bgp.IPv6) ) {
                //delete ipv6 peers since ipv6 is not currently enabled
                var peer_recs = Ext.getStore("peer_store").getRange();
                var peer_str;
                for(i = 0; i < peer_recs.length; i++) {
                    peer_str = String(peer_recs[i].data.peer);
                    if (peer_str.indexOf("v6addr:") > -1) {
                        CP.bgp.delete_peer_params(params, prefix, peer_recs[i]);
                    }
                }
            }

            if (Ext.getCmp("AS_dirty_tracker")) {
                Ext.getCmp("AS_dirty_tracker").setValue(false);
            }
            CP.bgp.mySubmit(closeWindow, closeWindow);
            return true;
        }

        function add_peer_function(ver) {
            Ext.getCmp("peer_grid").getSelectionModel().deselectAll();
            var AS_c = Ext.getCmp("AS_entry");
            if ( AS_c && AS_c.getASNumber() != "") {
                if ( AS_c.getXType() != "cp4_displayfield" && !(AS_c.isDisabled()) ) {
                    Ext.Msg.show({
                        title   : "Warning"
                        ,msg    : "Adding a peer will lock the Peer AS Number."
                        ,animEl : "elId"
                        ,buttons: Ext.Msg.OKCANCEL
                        ,icon   : Ext.MessageBox.QUESTION
                        ,fn     : function(btn, text) {
                            if (btn == "cancel") {
                                return;
                            }
                            Ext.getCmp("AS_entry").disable();
                            if ( save_peergroup(false) ) {
                                //have to save
                                CP.bgp.open_peer_window("add", ver);
                            }
                        }
                    });
                } else {
                    if ( save_peergroup(false) ) {
                        CP.bgp.open_peer_window("add", ver);
                    }
                }
            }
        }

        var open_peergroup_form = {
            xtype           : "cp4_formpanel"
            ,id             : "open_peergroup_form"
            ,width          : 532
            ,height         : 405
            ,autoScroll     : true
            ,trackResetOnLoad: true
            ,listeners      : {
                afterrender     : open_peergroup_ar
                ,validitychange : CP.bgp.check_user_action
            }
            ,chkBtns        : function() {
                CP.ar_util.checkBtnsbar("bgp_peer_btnsbar");
                CP.ar_util.checkBtnsbar("bgp_intf_btnsbar");
                CP.ar_util.checkDisabledBtn("open_peergroup_save_btn");
                CP.ar_util.checkDisabledBtn("open_peergroup_cancel_btn");
            }
            ,buttons        : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "open_peergroup_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        save_peergroup(true);
                    }
                    ,disabledConditions : function() {
                        var m = CP.ar_util.checkFormValid("bgp_configPanel");
                        var f = CP.ar_util.checkFormValid("open_peergroup_form");
                        var t = get_tricky_fields_isValid();
                        return !(m && f && t);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("open_peergroup_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "open_peergroup_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("open_peergroup_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            CP.ar_util.checkDisabledBtn("open_peergroup_save_btn");
                        }
                    }
                }
            ]
            ,items          : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 500
                    ,autoScroll : false
                    ,margin     : "15 0 0 15"
                    ,items      : [
                        AS_entry        //basic items
                        ,AS_type_sp
                        ,{
                            xtype               : "cp4_checkbox"
                            ,hideLabel          : true
                            ,hidden             : true
                            ,id                 : "AS_dirty_tracker"
                            ,name               : "AS_dirty_tracker"
                            ,value              : false
                        },{
                            xtype               : "cp4_textfield"
                            ,fieldLabel         : "Description"
                            ,id                 : "AS_name"
                            ,name               : "AS_name"
                            ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                            ,width              : Ext.Number.constrain(
                                                    CP.bgp.PEERGROUP_LABELWIDTH + 400, 400, 495)
                            ,maxLength          : 100
                            ,enforceMaxLength   : true
                            ,maskRe             : CP.ar_util.comment_maskRe
                            ,stripCharsRe       : CP.ar_util.comment_stripCharsRe
                        },{
                            xtype               : "cp4_checkbox"
                            ,hidden             : true
                            ,fieldLabel         : "Virtual Address"
                            ,id                 : "AS_virtual"
                            ,name               : "AS_virtual"
                            ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                            ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                            ,height             : 22
                            ,qtipText           : "A valid local address is required "
                                                + "if virtual address is true."
                            ,listeners          : {
                                afterrender         : function(cb, eOpts) {
                                    if (cb.qtipText) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : cb.getId()
                                            ,text           : cb.qtipText
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                                ,change             : function(cb, newVal, oldVal, eOpts) {
                                    /*
                                    var nV = Ext.getCmp("AS_virtual").getValue();
                                    var PG_addr = Ext.getCmp("AS_addr");
                                    var i;
                                    if (PG_addr && PG_addr.octets && PG_addr.octets.length > 3) {
                                        for(i = 0; i < 4; i++) {
                                            PG_addr.octets[i].allowBlank = !nV;
                                        }
                                        if (PG_addr.validate) {
                                            PG_addr.validate();
                                        }
                                    }
                                    CP.ar_util.checkDisabledBtn("open_peergroup_save_btn");
                                    // */
                                }
                            }
                        },{
                            //switch to cp4_IPHybridField after intensive testing
                            xtype               : "cp4_textfield"
                            // Temporarily disabling BGP local-address feature
                            ,hidden             : true
                            ,fieldLabel         : "Local Address"
                            ,id                 : "AS_addr"
                            ,name               : "AS_addr"
                            ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                            ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 250
                            ,submitValue        : false
                            ,maxLength          : 39
                            ,enforceMaxLength   : true
                            ,maskRe             : /[0-9A-Fa-f:.]/
                            ,stripCharsRe       : /[^0-9A-Fa-f:.]/
                            ,getDBValue         : function() {
                                var c = this;
                                if ( !( c.validate() ) ) {
                                    return "";
                                }
                                var v = String( c.getValue() ).toLowerCase();
                                var octets, i;
                                var hasDot = v.indexOf(".") > -1;
                                var hasCol = v.indexOf(":") > -1;
                                var hasHex = v.indexOf("a") > -1 || v.indexOf("b") > -1
                                        || v.indexOf("c") > -1 || v.indexOf("d") > -1
                                        || v.indexOf("e") > -1 || v.indexOf("f") > -1;
                                var is4 = hasDot && !hasHex && !hasCol; //has a dot, but no colon or hex
                                var is6 = hasCol && !hasDot; //has a colon, but no dot
                                if (is4) {
                                    octets = v.split(".");
                                    for(i = 0; i < octets.length; i++) {
                                        if (octets[i] != "") {
                                            octets[i] = String( parseInt(octets[i], 10) );
                                        }
                                    }
                                    v = octets.join(".");
                                } else if (is6) {
                                    if ( !(CP.bgp.IPv6) ) {
                                        //clean out because ipv6 is not supported
                                        return "";
                                    }
                                    v = CP.ip6convert.ip6_2_db(v);
                                    v = CP.ip6convert.db_2_ip6(v);
                                } else {
                                    v = "";
                                }
                                return v;
                            }
                            ,validator          : function(rawValue) {
                                var c = this;
                                var v = String(rawValue).toLowerCase();
                                if (v == "") { return true; }
                                var hasDot = v.indexOf(".") > -1;
                                var hasCol = v.indexOf(":") > -1;
                                var hasHex = v.indexOf("a") > -1 || v.indexOf("b") > -1
                                        || v.indexOf("c") > -1 || v.indexOf("d") > -1
                                        || v.indexOf("e") > -1 || v.indexOf("f") > -1;
                                var is4 = hasDot && !hasHex && !hasCol; //has a dot, but no colon or hex
                                var is6 = hasCol && !hasDot; //has a colon, but no dot
                                var octets, i, j, pgs, pg, peers, peer;
                                var r = "Local Address is not a valid IPv4 or IPv6 address.";
                                if (is4) {
                                    r = String( CP.util.isValidIPv4Ex(v,
                                            "address",
                                            false,  // Blank value allowed
                                            true,   // reject zero in first octet
                                            false,  // loopback addresses are allowed
                                            true,   // reject multicast
                                            true    // reject global broadcast (255.255.255.255)
                                            ));
                                } else if (is6) {
                                    if ( !(CP.bgp.IPv6) ) {
                                        return "IPv6 is not enabled.";
                                    }
                                    r = String( CP.util.isValidIPv6Ex(v,
                                            false, // Blank value allowed
                                            true,  // reject zero
                                            false, // reject loopback
                                            true,  // reject multicast
                                            true,  // reject link-local
                                            false  // validation of link-local is n.a
                                            ));
                                }
                                if (r != "true") {
                                    return r;
                                }
                                var AS = "";
                                if ( Ext.getCmp("AS_entry") ) {
                                    AS = Ext.getCmp("AS_entry").getASNumber();
                                }
                                var pg_st = Ext.getStore("peergroup_store");
                                pgs = pg_st.getRange();
                                var v2 = v;
                                if (is6) {
                                    v2 = CP.ip6convert.ip6_2_db(v);
                                    v = CP.ip6convert.db_2_ip6(v2);
                                    v2 = "v6addr:"+ String(v2);
                                }

                                for(i = 0; i < pgs.length; i++) {
                                    pg = pgs[i].data;
                                    peers = pg.Peers_list;
                                    if (AS != pg.AS && v == pg.AS_addr) {
                                        return "Address is already in use as a "
                                            +"local address for peer group "
                                            + String(pg.AS) +".";
                                    }
                                    //check individual peers
                                    for(j = 0; j < peers.length; j++) {
                                        if (AS != pg.AS) {
                                            peer = String(peers[j].lcladdr);
                                            if (peer == v || peer == v2) {
                                                return "Address is already in use as a "
                                                    +"local address for peer group "
                                                    + String(pg.AS) +".";
                                            }
                                        }
                                        peer = String(peers[j].peer);
                                        if (peer == v || peer == v2) {
                                            return "Address is in use as a peer in "
                                                +"peer group "+ String(pg.AS) +".";
                                        }
                                    }
                                }
                                return true;
                            }
                        }
                        ,CP.bgp.getLclAddrWarning()
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Out Delay"
                            ,id                 : "AS_outdelay"
                            ,name               : "AS_outdelay"
                            ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                            ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 85
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 0
                            ,maxValue           : 65535
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                        }
                        //peer grid
                        ,{
                            xtype   : "cp4_formpanel"
                            ,id     : "peer_form"
                            ,width  : 500
                            ,margin : 0
                            ,items  : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Peers"
                                    ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                                },{
                                    xtype   : "cp4_btnsbar"
                                    ,id     : "bgp_peer_btnsbar"
                                    ,items  : [
                                        {
                                            text                : "Add Peer"
                                            ,id                 : "peer_add_btn"
                                            ,overrideNoToken    : false
                                            //,handler2: function(b) {add_peer_function("4");}
                                            ,disabledConditions : function() {
                                                var AS = Ext.getCmp("AS_entry").isValid();
                                                var m =CP.ar_util.checkFormValid("bgp_configPanel");
                                                var f =CP.ar_util.checkFormValid("open_peergroup_form");
                                                var t =get_tricky_fields_isValid();
                                                return !(AS && m && f && t);
                                            }
                                            ,menu               : {
                                                style   : { overflow: "visible" }
                                                ,xtype  : "menu"
                                                ,plain  : true
                                                ,items  : [
                                                    {
                                                        text        : "Add IPv4 Peer"
                                                        ,id         : "peer_add_btn_4"
                                                        ,iconCls    : "element"
                                                        ,handler    : function() {
                                                            var b = Ext.getCmp("peer_add_btn");
                                                            if (b && b.handle_no_token() ) {
                                                                add_peer_function("4");
                                                            }
                                                        }
                                                    },{
                                                        text        : "Add IPv6 Peer"
                                                        ,id         : "peer_add_btn_6"
                                                        ,iconCls    : "element"
                                                        ,hidden     : !(CP.bgp.IPv6)
                                                        ,handler    : function() {
                                                            var b = Ext.getCmp("peer_add_btn");
                                                            if (b && b.handle_no_token() ) {
                                                                if (CP.bgp.IPv6) {
                                                                    add_peer_function("6");
                                                                }
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        },{
                                            text                : "Edit"
                                            ,id                 : "peer_edit_btn"
                                            ,disabled           : true
                                            ,overrideNoToken    : false
                                            ,handler2           : function(b) {
                                                var sm = Ext.getCmp("peer_grid").getSelectionModel();
                                                var rec = sm.getLastSelected();
                                                var peer_str = String(rec.data.peer).toLowerCase();
                                                var af = "4";
                                                if (peer_str.indexOf("v6addr:") != -1) {
                                                    af = "6";
                                                    peer_str = peer_str.replace("v6addr:", "");
                                                    peer_str = CP.ip6convert.db_2_ip6(peer_str);
                                                    peer_str = peer_str.toUpperCase();
                                                    if ( !(CP.bgp.IPv6) ) {
                                                        return;
                                                    }
                                                }
                                                var as_str =String(Ext.getCmp("AS_entry").getASNumber() );
                                                var T = "Edit Peer "+ peer_str +" on AS"+ as_str;
                                                if ( save_peergroup(false) ) {
                                                    CP.bgp.open_peer_window( T, af );
                                                }
                                            }
                                            ,disabledConditions : function() {
                                                var AS = Ext.getCmp("AS_entry").isValid();
                                                var m =CP.ar_util.checkFormValid("bgp_configPanel");
                                                var f =CP.ar_util.checkFormValid("open_peergroup_form");
                                                var t =get_tricky_fields_isValid();
                                                if ( !(AS && m && f && t) ) {
                                                    return true;
                                                }
                                                var g = Ext.getCmp("peer_grid");
                                                if (g && g.getSelCount && g.getSelCount() != 1) {
                                                    return true;
                                                }
                                                var sm = g.getSelectionModel();
                                                var rec = sm.getLastSelected();
                                                var peer_str = String(rec.data.peer).toLowerCase();
                                                if (!(CP.bgp.IPv6)&&peer_str.indexOf("v6addr:")>-1) {
                                                    //ipv6 disabled and this is an ipv6 peer
                                                    return true;
                                                }
                                                return false;
                                            }
                                        },{
                                            text                : "Delete"
                                            ,id                 : "peer_delete_btn"
                                            ,disabled           : true
                                            ,overrideNoToken    : false
                                            ,handler2           : function(b) {
                                                var params  = CP.ar_util.clearParams();
                                                var prefix  = CP.bgp.getPeerGroupBindingPrefix(
                                                    Ext.getCmp("AS_entry").getASNumber()
                                                    ,Ext.getCmp("AS_type_entry").getValue()
                                                );
                                                if (prefix == "") { return; }
                                                Ext.getCmp("AS_dirty_tracker").setValue(true);

                                                var sm = Ext.getCmp("peer_grid").getSelectionModel();
                                                var recs = sm.getSelection();
                                                var i;
                                                for(i = 0; i < recs.length; i++) {
                                                    CP.bgp.delete_peer_params(params,prefix,recs[i]);
                                                }
                                                //don't close window, don't clearParams
                                                save_peergroup(false, false);
                                            }
                                            ,disabledConditions : function() {
                                                var AS = Ext.getCmp("AS_entry").isValid();
                                                var m =CP.ar_util.checkFormValid("bgp_configPanel");
                                                var f =CP.ar_util.checkFormValid("open_peergroup_form");
                                                var t =get_tricky_fields_isValid();
                                                if ( !(AS && m && f && t) ) {
                                                    return true;
                                                }
                                                var g = Ext.getCmp("peer_grid");
                                                return ( (g && g.getSelCount)
                                                    ? g.getSelCount() == 0 : true);
                                            }
                                        }
                                    ]
                                },{
                                    xtype               : "cp4_grid"
                                    ,id                 : "peer_grid"
                                    ,width              : 500
                                    ,height             : 96
                                    ,margin             : 0
                                    ,forceFit           : true
                                    ,autoScroll         : true
                                    ,store              : Ext.getStore("peer_store")
                                    ,columns            : [
                                        {
                                            text            : "Peer"
                                            ,dataIndex      : "peer"
                                            ,width          : 180
                                            ,menuDisabled   : true
                                            ,renderer       : function(value, meta, rec) {
                                                var v = String(value).toLowerCase();
                                                var retValue = v;
                                                var color = "black";
                                                var vSuf = "";
                                                var tSuf = "";
                                                var bgp_i = "";
                                                if (retValue.indexOf("v6addr:") != -1) {
                                                    var dbValue = retValue.replace("v6addr:", "");
                                                    retValue = CP.ip6convert.db_2_ip6(dbValue);

                                                    if ( !(CP.bgp.IPv6) ) {
                                                        color = "red";
                                                        vSuf = " (Need to delete)";
                                                        tSuf = " (IPv6 is not enabled, "
                                                            +"this configuration should be deleted)";
                                                    } else {
                                                        var valid = CP.util.isValidIPv6Ex(
                                                                retValue,
                                                                true,   // rejectBlank,
                                                                true,   // rejectZero,
                                                                true,   // rejectLoopback,
                                                                true,   // rejectMulticast,
                                                                false,  // rejectLinkLocal,
                                                                false); // requireLinkLocal

                                                        if (String(valid) == "true") {
                                                            var addrType = CP.util.getIPv6AddressType(dbValue);
                                                            if (addrType == CP.util.ADDR_TYPE_V6_LINK_LOCAL) {
                                                                bgp_i = String(rec.data.bgpinterface);

                                                                retValue = retValue.toUpperCase();
                                                                if (bgp_i != "") {
                                                                    retValue += " via "+ bgp_i;
                                                                } else {
                                                                    color = "red";
                                                                    retValue += " (missing Outgoing "
                                                                        + "Interface)";
                                                                }
                                                            }
                                                        } else {
                                                            // bad address
                                                            color = "red";
                                                            vSuf = " (Bad Address)";

                                                            // The 'valid' variable will contain
                                                            // the error description
                                                            tSuf = " (" + valid + ")";
                                                        }
                                                    }
                                                }
                                                return CP.ar_util.rendererSpecific(
                                                    retValue + vSuf, retValue + tSuf,
                                                    "left", color);
                                            }
                                        },{
                                            text            : "Peer Type"
                                            ,dataIndex      : "peer_type"
                                            ,width          : 115
                                            ,menuDisabled   : true
                                            ,renderer       : function(value) {
                                                var retValue = "None";
                                                switch( String(value).toLowerCase() ) {
                                                    case "reflectorclient":
                                                        retValue = "Reflector Client";
                                                        break;
                                                    case "noclientreflect":
                                                        retValue = "No Client Reflector";
                                                        break;
                                                    default:
                                                }
                                                return CP.ar_util.rendererGeneric(retValue);
                                            }
                                        },{
                                            text            : "Ping"
                                            ,dataIndex      : "pingpeer"
                                            ,width          : 25
                                            ,menuDisabled   : true
                                            ,renderer       : function(value) {
                                                var retValue = "No";
                                                if (String(value) == "true") {
                                                    retValue = "Yes";
                                                }
                                                return CP.ar_util.rendererGeneric(retValue);
                                            }
                                        },{
                                            text            : "Comment"
                                            ,dataIndex      : "comment"
                                            ,flex           : 1
                                            ,menuDisabled   : true
                                            ,renderer       : CP.ar_util.rendererGeneric
                                        }
                                    ]
                                    ,selModel           : Ext.create("Ext.selection.RowModel", {
                                        allowDeselect   : true
                                        ,mode           : "MULTI"
                                        ,listeners      : {
                                            selectionchange     : function(view, selections, eOpts) {
                                                CP.ar_util.checkBtnsbar("bgp_peer_btnsbar");
                                            }
                                        }
                                    })
                                    ,draggable          : false
                                    ,enableColumnMove   : false
                                    ,enableColumnResize : true
                                    ,listeners          : {
                                        itemdblclick        : function() {
                                            var b = Ext.getCmp("peer_edit_btn");
                                            if (b && b.handler) { b.handler(b); }
                                        }
                                    }
                                } //peer_grid
                            ]
                        }
                        //advanced
                        ,{
                            xtype   : "cp4_formpanel"
                            ,id     : "advanced_pg_form"
                            ,margin : 0
                            ,items  : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Advanced Settings"
                                    ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                                },{
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "MED"
                                    ,id                 : "AS_med"
                                    ,name               : "AS_med"
                                    ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                                    ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 95
                                    ,allowBlank         : true
                                    ,allowDecimals      : false
                                    ,minValue           : 0
                                    ,maxValue           : 4294967295
                                    ,maxLength          : 10
                                    ,enforceMaxLength   : true
                                },{
                                    xtype               : "cp4_checkbox"
                                    ,fieldLabel         : "Next Hop Self"
                                    ,id                 : "AS_nexthopself"
                                    ,name               : "AS_nexthopself"
                                    ,labelWidth         : CP.bgp.PEERGROUP_LABELWIDTH
                                    ,width              : CP.bgp.PEERGROUP_LABELWIDTH + 95
                                    ,height             : 22
                                },{
                                    //validator for protocols
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Protocol Tester"
                                    ,id             : "protocol_tester"
                                    ,labelWidth     : 300
                                    ,width          : 400
                                    ,value          : ""
                                    ,allowBlank     : true
                                    //TODO
                                    ,hideLabel      : true
                                    ,hidden         : true
                                    ,validator      : function() {
                                        var msg = "At least one IGP protocol must be enabled.";
                                        var igp_list =  ["AS_proto_all"
                                                        ,"AS_proto_bgp"
                                                        ,"AS_proto_direct"
                                                        ,"AS_proto_rip"
                                                        ,"AS_proto_static"
                                                        ,"AS_proto_ospf2"
                                                        ,"AS_proto_ospf2ase"];
                                        var cb;
                                        var i;
                                        for(i = 0; i < igp_list.length; i++) {
                                            cb = Ext.getCmp(igp_list[i]);
                                            if (cb && cb.getValue && cb.getValue()) {
                                                Ext.getCmp(igp_list[0]).clearInvalid();
                                                return true;
                                            }
                                        }
                                        Ext.getCmp(igp_list[0]).markInvalid(msg);
                                        return "";
                                    }
                                    ,listeners      : {
                                        disabled        : function(f, eOpts) {
                                            Ext.getCmp("AS_proto_all").clearInvalid();
                                        }
                                    }
                                },{
                                    //validator for interfaces
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "Interface Tester"
                                    ,id             : "interface_tester"
                                    ,labelWidth     : 300
                                    ,width          : 400
                                    ,value          : ""
                                    ,allowBlank     : true
                                    //TODO
                                    ,hideLabel      : true
                                    ,hidden         : true
                                    ,validator      : function() {
                                        var all_intf = Ext.getCmp("AS_intf_all");
                                        if (all_intf && all_intf.isDisabled()) {
                                            return true;
                                        }
                                        var as_i_st = Ext.getStore("as_intf_store");
                                        var all_i_v = (all_intf && all_intf.getValue()) ? true : false;
                                        var as_i_v = (as_i_st && as_i_st.getCount() > 0) ? true : false;
                                        if (all_i_v || as_i_v) {
                                            Ext.getCmp("AS_intf_all").clearInvalid();
                                            return true;
                                        }
                                        var msg = "At least one interface must be enabled.";
                                        Ext.getCmp("AS_intf_all").markInvalid(msg);
                                        return "";
                                    }
                                    ,listeners      : {
                                        disabled        : function(f, eOpts) {
                                            Ext.getCmp("AS_intf_all").clearInvalid();
                                        }
                                    }
                                },{
                                    xtype           : "cp4_sectiontitle"
                                    ,titleText      : "Enable Protocols"
                                    ,margin         : CP.bgp.ADV_SECTIONTITLE_MARGIN
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "All IGP Protocols"
                                    ,id             : "AS_proto_all"
                                    ,name           : "AS_proto_all"
                                    ,labelWidth     : CP.bgp.PEERGROUP_LABELWIDTH
                                    ,width          : CP.bgp.PEERGROUP_LABELWIDTH + 36
                                    ,height         : 22
                                    ,msgTarget      : "side"
                                    ,listeners      : {
                                        change          : function(cb, newVal, oldVal, eOpts) {
                                            Ext.getCmp("single_protocol_form").setVisible( !newVal );
                                            cb.fireEvent("blur");
                                        }
                                        ,blur           : function() {
                                            var p_tester = Ext.getCmp("protocol_tester");
                                            if (p_tester && p_tester.validate) {
                                                p_tester.validate();
                                            }
                                        }
                                    }
                                },{
                                    xtype           : "cp4_formpanel"
                                    ,id             : "single_protocol_form"
                                    //comment out this line for single column
                                    ,layout         : "column"
                                    ,margin         : "0 0 0 40"
                                    ,defaults       : {
                                        xtype           : "cp4_checkbox"
                                        ,labelWidth     : 60
                                        ,width          : 150
                                        ,height         : 22
                                        ,listeners          : {
                                            change              : function(cb, newVal, oldVal, eOpts) {
                                                cb.fireEvent("blur");
                                            }
                                            ,blur           : function() {
                                                var p_tester = Ext.getCmp("protocol_tester");
                                                if (p_tester && p_tester.validate) {
                                                    p_tester.validate();
                                                }
                                            }
                                        }
                                    }
                                    ,items          : [
                                        {
                                            fieldLabel  : "BGP"
                                            ,id         : "AS_proto_bgp"
                                            ,name       : "AS_proto_bgp"
                                        },{
                                            fieldLabel  : "Direct"
                                            ,id         : "AS_proto_direct"
                                            ,name       : "AS_proto_direct"
                                        },{
                                            fieldLabel  : "RIP"
                                            ,id         : "AS_proto_rip"
                                            ,name       : "AS_proto_rip"
                                        },{
                                            fieldLabel  : "Static"
                                            ,id         : "AS_proto_static"
                                            ,name       : "AS_proto_static"
                                        },{
                                            fieldLabel  : "OSPF"
                                            ,id         : "AS_proto_ospf2"
                                            ,name       : "AS_proto_ospf2"
                                        },{
                                            fieldLabel  : "OSPF ASE"
                                            ,id         : "AS_proto_ospf2ase"
                                            ,name       : "AS_proto_ospf2ase"
                                        }
                                    ]
                                },{
                                    xtype           : "cp4_sectiontitle"
                                    ,titleText      : "Enabled Interfaces"
                                    ,margin         : CP.bgp.ADV_SECTIONTITLE_MARGIN
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "All Interfaces"
                                    ,id             : "AS_intf_all"
                                    ,name           : "AS_intf_all"
                                    ,labelWidth     : CP.bgp.PEERGROUP_LABELWIDTH
                                    ,width          : CP.bgp.PEERGROUP_LABELWIDTH + 36
                                    ,height         : 22
                                    ,msgTarget      : "side"
                                    ,listeners      : {
                                        change          : function(cb, newVal, oldVal, eOpts) {
                                            Ext.getCmp("single_interface_form").setVisible( !newVal );
                                            var i_tester = Ext.getCmp("interface_tester");
                                            if (i_tester && i_tester.validate) {
                                                i_tester.validate();
                                            }
                                        }
                                        ,blur           : function() {
                                            var i_tester = Ext.getCmp("interface_tester");
                                            if (i_tester && i_tester.validate) {
                                                i_tester.validate();
                                            }
                                        }
                                    }
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,id     : "single_interface_form"
                                    ,items  : [
                                        {
                                            xtype   : "cp4_btnsbar"
                                            ,id     : "bgp_intf_btnsbar"
                                            ,items  : [
                                                {
                                                    text                : "Add"
                                                    ,id                 : "bgp_intf_btn_add"
                                                    ,overrideNoToken    : false
                                                    ,handler2           : CP.bgp.add_intf_window
                                                    ,disabledConditions : function() {
                                                        var m = CP.ar_util.checkFormValid(
                                                            "bgp_configPanel");
                                                        return !m;
                                                    }
                                                },{
                                                    text                : "Delete"
                                                    ,id                 : "intf_delete_btn"
                                                    ,disabled           : true
                                                    ,overrideNoToken    : false
                                                    ,handler2           : function() {
                                                        var g = Ext.getCmp("intf_grid");
                                                        var sm = g.getSelectionModel();
                                                        var recs = sm.getSelection();
                                                        var as_intf_st = Ext.getStore("as_intf_store");
                                                        if (recs.length > 0) {
                                                            as_intf_st.remove(recs);
                                                            var AS_dt = Ext.getCmp("AS_dirty_tracker");
                                                            if (AS_dt) {
                                                                AS_dt.setValue(true);
                                                            }
                                                        }
                                                    }
                                                    ,disabledConditions : function() {
                                                        var m = CP.ar_util.checkFormValid(
                                                            "bgp_configPanel");
                                                        if (!m) {
                                                            return true;
                                                        }
                                                        var g = Ext.getCmp("intf_grid");
                                                        return ( (g && g.getSelCount)
                                                            ? g.getSelCount() == 0 : true);
                                                    }
                                                }
                                            ]
                                        },{
                                            xtype               : "cp4_grid"
                                            ,id                 : "intf_grid"
                                            ,width              : 200
                                            ,margin             : "0 0 5 0"
                                            ,forceFit           : true
                                            ,autoScroll         : true
                                            ,store              : Ext.getStore("as_intf_store")
                                            ,columns            : [
                                                {
                                                    text            : "Enabled Interfaces"
                                                    ,dataIndex      : "AS_intf_addr"
                                                    ,width          : 100
                                                    ,menuDisabled   : true
                                                    ,renderer       : function(value, meta, rec) {
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
                                                }
                                            ]
                                            ,selModel           : Ext.create("Ext.selection.RowModel", {
                                                allowDeselect   : true
                                                ,mode           : "MULTI"
                                                ,listeners      : {
                                                    selectionchange     : function() {
                                                        CP.ar_util.checkBtnsbar("bgp_intf_btnsbar");
                                                    }
                                                }
                                            })
                                            ,draggable          : false
                                            ,enableColumnMove   : false
                                            ,enableColumnResize : true
                                        }
                                    ]
                                }
                            ]
                        }// end of advanced settings
                    ]
                }
            ]
        };

        var open_peergroup_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "open_peergroup_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ open_peergroup_form ]
        });
        open_peergroup_window.show();

        function push_peer_record(params, prefix, peer_rec, AS_type) {
            var rr_type     = (AS_type == "i") ? peer_rec.data.peer_type : "none";
            var rr_prefix   = prefix +":rrclient:"+ rr_type;
            var peer_prefix = rr_prefix +":peer:"+ peer_rec.data.peer;
            var value;
            params[rr_prefix] = "t";
            var p;
            for(p in peer_rec.data) {
                if (peer_rec.data[p] == null || peer_rec.data[p] == undefined) {
                    value = "";
                } else if (Ext.Array.indexOf(CP.bgp.FieldList, p) != -1) {
                    value = (peer_rec.data[p]) ? "t" : "";
                } else {
                    value = peer_rec.data[p];
                }
                CP.bgp.push_peer_param(params, peer_prefix, p, value);
            }
            var holdtime    = peer_rec.data.holdtime;
            var keepalive   = peer_rec.data["keepalive-interval"];
            if (holdtime != "" || keepalive != "") {
                var h = (holdtime != "")    ? holdtime : 180;
                var k = (keepalive != "")   ? keepalive : 60;
                params[peer_prefix +":keepalive-interval"] = keepalive;
                if (h >= k * 3) {
                    params[peer_prefix +":holdtime"] = holdtime;
                } else {
                    params[peer_prefix +":holdtime"] = k * 3;
                }
            }
        }
    } //end of pg window

    ,add_intf_window            : function() {
        var add_intf_form = {
            xtype       : "cp4_formpanel"
            ,id         : "add_intf_form"
            ,autoScroll : false
            ,width      : 285
            ,height     : 92
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    if (p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("add_intf_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("add_intf_save_btn");
                CP.ar_util.checkDisabledBtn("add_intf_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "add_intf_save_btn"
                    ,text               : "Ok"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        var intf = Ext.getCmp("interface_entry").getValue();
                        var as_intf_st = Ext.getStore("as_intf_store");
                        if (as_intf_st.findExact("AS_intf_addr",intf) == -1) {
                            as_intf_st.add({
                                "AS_intf_addr"  : intf
                                ,"newrec"       : true
                            });
                            Ext.getCmp("AS_dirty_tracker").setValue(true);
                        }
                        CP.ar_util.checkWindowClose("add_intf_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("add_intf_form");
                        var i = (Ext.getCmp("interface_entry").getValue() != "");
                        return !(f && i);
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("add_intf_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,id                 : "add_intf_cancel_btn"
                    ,text               : "Cancel"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("add_intf_window");
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
                {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Interface"
                    ,id             : "interface_entry"
                    ,name           : "intf"
                    ,labelWidth     : 100
                    ,width          : 255
                    ,margin         : 15
                    ,queryMode      : "local"
                    ,triggerAction  : "all"
                    ,lastQuery      : ""
                    ,editable       : false
                    ,store          : Ext.getStore("intf_store")
                    ,valueField     : "intf"
                    ,displayField   : "intf"
                    ,allowBlank     : false
                }
            ]
        };

        var add_intf_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "add_intf_window"
            ,title      : "Enable Interface"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("open_peergroup_window").getPosition();
                    win.setPosition(229 + pos[0], 258 + pos[1]);
                }
            }
            ,items      : [ add_intf_form ]
        });
        add_intf_window.show();
    }

//PEER WINDOW
    ,get_peer_type_combo_cmp    : function(pg_type) {
        if (!CP.bgp.rr_type_is_configurable()) {
            return CP.bgp.get_peer_type_constant_cmp(pg_type);
        }

        return {
            xtype               : "cp4_combobox"
            ,fieldLabel         : "Peer Type"
            ,id                 : "peer_type_entry"
            ,name               : "peer_type"
            ,labelWidth         : CP.bgp.PEER_LABELWIDTH
            ,width              : CP.bgp.PEER_LABELWIDTH + 130
            ,allowBlank         : false
            ,queryModel         : "local"
            ,editable           : false
            ,triggerAction      : "all"
            ,value              : "none"
            ,store              :   [["none"                ,"None"]
                                    ,["reflectorclient"     ,"Reflector Client"]
                                    ,["noclientreflect"     ,"No Client Reflector"]]
        };
    }
    ,get_peer_type_constant_cmp : function(pg_type) {
        return {
            xtype       : "cp4_formpanel"
            ,hidden     : (pg_type != "i")
            ,hideLabel  : (pg_type != "i")
            ,items      : [
                {
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Peer Type"
                    ,id                 : "peer_type_display"
                    ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                    ,width              : CP.bgp.PEER_LABELWIDTH + 110
                    ,height             : 22
                    ,value              : "None"
                },{
                    xtype               : "cp4_displayfield"
                    ,fieldLabel         : "Peer Type"
                    ,id                 : "peer_type_entry"
                    ,name               : "peer_type"
                    ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                    ,width              : CP.bgp.PEER_LABELWIDTH + 110
                    ,height             : 22
                    ,value              : "none"
                    ,hidden             : true
                    ,hideLabel          : true
                    ,listeners          : {
                        change              : function(df, newVal, oldVal, eOpts) {
                            var peer_type_display = Ext.getCmp("peer_type_display");
                            if (peer_type_display) {
                                switch(newVal) {
                                    case "reflectorclient":
                                        peer_type_display.setValue("Reflector Client");
                                        break;
                                    case "noclientreflect":
                                        peer_type_display.setValue("No Client Reflector");
                                        break;
                                    default:
                                        peer_type_display.setValue("None");
                                }
                            }
                        }
                    }
                }
            ]
        };
    }

    ,get_peer_advanced_settings_form    : function(pg_type, af, mode) {
        //pg_type is used to set "hidden :" to true or false
        function multiprotocol_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Multiprotocol Capabilities"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype       : "cp4_formpanel"
                        ,id         : "unicast_form"
                        ,layout     : "column"
                        ,defaults   : {
                            xtype       : "cp4_radio"
                            ,name       : "unicast_radio_set"
                            ,labelWidth : 100
                            ,width      : 100 + 25
                            ,height     : 22
                            ,style      : "margin-left:0px;margin-right:0px;"
                        }
                        ,setValues  : function(rec) {
                            var v4 = (rec && rec.data.nov4unicast) ? 0 : 1;
                            var v6 = (rec && rec.data.v6unicast)? 2 : 0;
                            var v = v4 + v6;
                            var c = Ext.getCmp("unicast_ipv4");
                            c.setValue(v);
                        }
                        ,getValues  : function() {
                            var c = Ext.getCmp("unicast_ipv4");
                            var g = c.getGroupValue();
                            return g;
                        }
                        ,getIPv4UnicastValue:   function() {
                            var c = this;
                            var g = c.getValues();
                            var v = (g & 1);
                            return (v ? "" : "t"); //return invert
                        }
                        ,getIPv6UnicastValue:   function() {
                            var c = this;
                            var g = c.getValues();
                            var v = (g & 2);
                            return (v ? "t" : ""); //return normal
                        }
                        ,items      : [
                            {
                                fieldLabel  : "IPv4 Unicast Only"
                                ,id         : "unicast_ipv4"
                                ,inputValue : 1
                                ,style      : "margin-left:0px;margin-right:50px;"
                            },{
                                fieldLabel  : "IPv6 Unicast Only"
                                ,id         : "unicast_ipv6"
                                ,inputValue : 2
                                ,style      : "margin-left:0px;margin-right:50px;"
                            },{
                                fieldLabel  : "Both IPv4 and IPv6"
                                ,id         : "unicast_both"
                                ,inputValue : 3
                            }
                        ]
                    }
                ]
            };
        }

        function localaddress_set(af) {
            var addr_cmp;
            if (String(af).indexOf("6") == -1) {
                addr_cmp = {
                    xtype           : "cp4_ipv4field_ex"
                    ,fieldLabel     : "Local Address"
                    ,id             : "lcladdr_peer"
                    ,name           : "lcladdr"
                    ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                    ,width          : CP.bgp.PEER_LABELWIDTH + 135
                    ,allowBlank                 : true
                    ,rejectZero                 : true
                    ,rejectLoopback             : false
                    ,rejectMulticast            : true
                    ,rejectGlobalBroadcast      : true
                    ,fieldConfig    : {
                        fieldLabel      : "Local Address"
                    }
                    ,getDBValue     : function() {
                        var c = this;
                        var v = "";
                        if ( c.validate() ) {
                            v = c.getValue();
                        }
                        return v;
                    }
                    ,getCleanValue  : function() {
                        var c = this;
                        return c.getValue();
                    }
                    ,listeners      : {
                        afterrender     : function(f, eOpts) {
                            var valid_change_func = function(f, isV, eOpts) {
                                Ext.getCmp("adv_peer_invalid_target").validate();
                            };
                            var i;
                            if (f && f.validate) {
                                if (f.octets) {
                                    for(i = 0; i < f.octets.length; i++) {
                                        f.octets[i].addListener("validitychange", valid_change_func);
                                    }
                                }
                                if (f.hiddenField) {
                                    f.hiddenField.addListener("validitychange", valid_change_func);
                                }
                            }
                        }
                        ,beforedestroy  : function(f, eOpts) {
                            f.events.afterrender.clearListeners();
                        }
                    }
                };
            } else {
                addr_cmp = {
                    xtype               : "cp4_ipv6field_ex"
                    ,fieldLabel         : "Local Address"
                    ,id                 : "lcladdr_peer"
                    ,name               : "lcladdr"
                    ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                    ,width              : CP.bgp.PEER_LABELWIDTH + 275
                    ,allowBlank                 : true
                    ,rejectZero                 : true
                    ,rejectLoopback             : false
                    ,rejectMulticast            : true
                    ,rejectLinkLocal            : true
                    ,value              : ""
                    ,maxLength          : 39
                    ,enforceMaxLength   : true
                    ,getDBValue         : function() {
                        var c = this;
                        var ip6 = "";
                        if ( c.isValid() ) {
                            ip6 = c.getValue();
                        }
                        var v = CP.ip6convert.ip6_2_db(ip6);
                        v = String(v).toLowerCase();
                        return ip6;
                    }
                    ,getCleanValue      : function() {
                        var c = this;
                        var v = String(c.getRawValue()).toLowerCase();
                        var v2 = CP.ip6convert.ip6_2_db(v);
                        v = CP.ip6convert.db_2_ip6(v2);
                        return v;
                    }
                };
            }

            return {
                xtype       : "cp4_formpanel"
                // Temporarily disabling BGP local-address feature
                ,hidden     : true
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Local Address"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    }
                    ,addr_cmp
                    ,CP.bgp.getLclAddrWarning()
                ]
            };
        }

        function weight_set() {
            //not for external
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Weight"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Weight"
                        ,id                 : "preference_peer"
                        ,name               : "preference"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 85
                        ,allowDecimals      : false
                        ,minValue           : 0
                        ,maxValue           : 65535
                        ,emptyText          : "0-65535"
                        ,maxLength          : 5
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getRawValue();
                            if (v != "") {
                                v = Ext.Number.constrain(parseInt(v, 10),
                                    c.minValue, c.maxValue);
                            }
                            return v;
                        }
                    }
                ]
            };
        }

        function peerlocalas_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                       xtype         : "cp4_sectiontitle"
                       ,titleText    : "Peer Local AS"
                       ,margin       : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                       xtype         : "cp4_checkbox"
                       ,fieldLabel   : "Enable Peer Local AS"
                       ,id           : "peer_local_as"
                       ,name         : "peer-local-as"
                       ,labelWidth   : CP.bgp.PEER_LABELWIDTH
                       ,width        : CP.bgp.PEER_LABELWIDTH + 100
                       ,height       : 22
                       ,getDBValue   : function () {
                           var enabled = this.getValue() ? "t" : "";
                           return enabled;
                       }
                       ,listeners  : {
                           change      : function(check, newVal, oldVal, eOpts) {
                               Ext.getCmp("peer_local_as_options").setVisible(newVal);
                               Ext.getCmp("peer_local_as_options").setDisabled(!newVal);
                               Ext.getCmp("peer_local_as_as").validate();
                           }
                       }
                    },{
                        xtype               : "cp4_formpanel"
                        ,id                 : "peer_local_as_options"
                        ,margin             : 0
                        ,hidden             : true
                        ,disabled           : true
                        ,items              : [
                            {
                                xtype               : "cp4_textfield"
                                ,fieldLabel         : "Peer Local AS"
                                ,id                 : "peer_local_as_as"
                                ,name               : "peer-local-as:as"
                                ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                                ,width              : CP.bgp.PEER_LABELWIDTH + 100
                                ,disabled           : true
                                ,minLength          : 1
                                ,maxLength          : 11
                                ,enforceMaxLength   : true
                                ,localAS            : Ext.getCmp("ASNum")
                                ,ConfedID           : Ext.getCmp("confederation_display")
                                ,PeerAS             : Ext.getCmp("AS_entry")
                                ,getDBValue         : function() {
                                    if (Ext.getCmp("peer_local_as").getDBValue() == "") {
                                        return "";
                                    }

                                    var value = this.getRawValue();
                                    var result = CP.ar_util.validateConvertToPlain(value);

                                    return result[0];
                                }
                                ,validator          : function(val) {
                                    if (Ext.getCmp("peer_local_as").getDBValue() == "") {
                                        /* Peer Local AS is not enabled */
                                        return true;
                                    }

                                    var value = this.getRawValue();
                                    var result = CP.ar_util.validateConvertToPlain(value);

                                    if (result[0] == -1) {
                                        return result[1];
                                    }
                                    value = result[0];

                                    if (this.localAS) {
                                        if (value == this.localAS.Plain) {
                                            return "Peer Local AS cannot be equal to the Local AS.";
                                        }
                                    }
                                    if (this.ConfedID) {
                                        if (value == this.ConfedID.Plain) {
                                            return "Peer Local AS cannot be equal to the Confederation identifier.";
                                        }
                                    }
                                    if (this.PeerAS) {
                                        if (value == this.PeerAS.getASNumber()) {
                                            return "Peer Local AS cannot be equal to the remote peer's AS number.";
                                        }
                                    }
                                    if (value == 23456) {
                                        return "Peer Local AS cannot be set to 23456 (AS TRANS).";
                                    }

                                    return true;
                                }
                            },{
                                xtype         : "cp4_checkbox"
                                ,fieldLabel   : "Prepend Peer Local AS on inbound updates from peer"
                               ,id           : "peer_local_as_inbound_peer_local"
                                ,name         : "peer-local-as:inbound-peer-local"
                                ,labelWidth   : CP.bgp.PEER_LABELWIDTH
                                ,width        : CP.bgp.PEER_LABELWIDTH + 100
                                ,height       : 22
                                ,checked      : true
                                ,getDBValue   : function() {
                                    if (Ext.getCmp("peer_local_as").getDBValue() == "") {
                                        return "";
                                    }
                                    return (this.getValue() ? "t" : "");
                                }
                             },{
                                xtype         : "cp4_checkbox"
                                ,fieldLabel   : "Prepend systemwide Local AS on outbound updates to peer"
                                ,id           : "peer_local_as_outbound_local"
                                ,name         : "peer-local-as:outbound-local"
                                ,labelWidth   : CP.bgp.PEER_LABELWIDTH
                                ,width        : CP.bgp.PEER_LABELWIDTH + 100
                                ,height       : 22
                                ,checked      : true
                                ,getDBValue   : function() {
                                    if (Ext.getCmp("peer_local_as").getDBValue() == "") {
                                        return "";
                                    }
                                    return (this.getValue() ? "t" : "");
                                }
                             },{
                                xtype         : "cp4_checkbox"
                                ,fieldLabel   : "Allow peering with the Local AS"
                                ,id           : "peer_local_as_dual_peering"
                                ,name         : "peer-local-as:dual-peering"
                                ,labelWidth   : CP.bgp.PEER_LABELWIDTH
                                ,width        : CP.bgp.PEER_LABELWIDTH + 100
                                ,height       : 22
                                ,getDBValue   : function() {
                                    if (Ext.getCmp("peer_local_as").getDBValue() == "") {
                                        return "";
                                    }
                                    return (this.getValue() ? "t" : "");
                                }
                            }
                        ]
                    }
                ]
            };
        }

        function med_set(               pg_type) {
            //for external
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "MED"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_checkbox"
                        ,fieldLabel         : "Accept MED from External Peer"
                        ,id                 : "med_peer"
                        ,name               : "med"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 100
                        ,height             : 22
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "MED Sent Out"
                        ,id                 : "metricout_peer"
                        ,name               : "metricout"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 100
                        ,allowDecimals      : false
                        ,minValue           : 0
                        ,maxValue           : 4294967295
                        ,maxLength          : 10
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getRawValue();
                            if (v != "") {
                                v = Ext.Number.constrain(parseInt(v, 10),
                                    c.minValue, c.maxValue);
                            }
                            return v;
                        }
                    }
                ]
            };
        }

        function nexthop_set(           pg_type) {
            //for external
            return {
                xtype       : "cp4_formpanel"
                ,id                 : "multihop_peer_panel"
                ,margin     : 0
                ,padding    : 0
                ,handleState    : function() {
                    /* Multihop and TTL are N.A. for IPv6 link-local peers */
                    var peer_entry = Ext.getCmp("peer_entry");
                    var peer = peer_entry.getDBValue();
                    var isLinkLocal = peer.indexOf("v6addr:fe80000000000000") >= 0;

                    var c = this;
                    c.setVisible(!isLinkLocal);

                    var multihop = Ext.getCmp("multihop_peer");
                    if (multihop) {
                        multihop.setDisabled(isLinkLocal);
                        multihop.validate();
                    }

                    var ttl     = Ext.getCmp("ttl_peer");
                    if (ttl) {
                        ttl.setDisabled(isLinkLocal);
                        ttl.validate();
                    }
                }
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Next Hop and Time To Live"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_checkbox"
                        ,fieldLabel         : "EBGP Multihop"
                        ,id                 : "multihop_peer"
                        ,name               : "multihop"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 55
                        ,height             : 22
                        ,checked            : false
                        ,getDBValue         : function() {
                            var c = this;
                            var v;

                            /*
                             * This control is N.A. for link-local peers.
                             * But, it is possible for the user to enter a
                             * value in this control before specifying whether
                             * or not the peer is link local.  So, return an
                             * empty value if the control is disabled.
                             */
                            if (c.isDisabled()) {
                                v = "";
                            } else {
                                v  = c.getValue() ? "t" : "";
                            }
                            return v;
                        }
                       ,listeners          : {
                            change              : function(chk, newVal, oldVal, eOpts) {
                                var ttl_peer_cmp = Ext.getCmp("ttl_peer");
                                if (ttl_peer_cmp) {
                                    var v = String(newVal).toLowerCase();
                                    if (v == "true" || v == "1" || v == "t") {
                                        v = true;
                                    } else {
                                        v = false;
                                    }
                                    ttl_peer_cmp.setDisabled(!v);
                                    ttl_peer_cmp.validate();
                                    if (!v) { ttl_peer_cmp.clearInvalid(); }
                                }
                            }
                        }
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Time To Live"
                        ,id                 : "ttl_peer"
                        ,name               : "ttl"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 75
                        ,value              : ""
                        ,disabled           : true
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 255
                        ,maxLength          : 3
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var m_cmp = Ext.getCmp("multihop_peer");
                            var m = m_cmp ? m_cmp.getValue() : false;
                            var v = m ? c.getRawValue() : "";
                            if (v != "") {
                                v = parseInt(v, 10);
                                if (isNaN(v)) {
                                    v = "";
                                } else {
                                    v = Ext.Number.constrain(v, c.minValue, c.maxValue);
                                }
                            }
                            return v;
                        }
                    }
                ]
            };
        }

        function aggregator_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Aggregator"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_checkbox"
                        ,fieldLabel         : "No Aggregator ID"
                        ,id                 : "no-aggregator-id_peer"
                        ,name               : "no-aggregator-id"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 55
                        ,height             : 22
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function aspath_set() {
            //not for internal
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "ASPATH"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "AS Path Prepend Count"
                        ,id                 : "ascount_peer"
                        ,name               : "ascount"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 75
                        ,allowDecimals      : false
                        ,minValue           : 1
                        ,maxValue           : 25
                        ,maxLength          : 2
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getRawValue();
                            if (v != "") {
                                v = Ext.Number.constrain(parseInt(v, 10),
                                    c.minValue, c.maxValue);
                            }
                            return v;
                        }
                    },{
                        xtype               : "cp4_checkbox"
                        ,fieldLabel         : "AS Override"
                        ,id                 : "as-override_peer"
                        ,name               : "as-override"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 55
                        ,height             : 22
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function private_as_set() {
            //for external
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Private AS"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_checkbox"
                        ,fieldLabel         : "Remove Private AS"
                        ,id                 : "removeprivateas_peer"
                        ,name               : "removeprivateas"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 55
                        ,height             : 22
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function timers_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Timers"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Keep Alive Timer"
                        ,id                 : "keepalive-interval_peer"
                        ,name               : "keepalive-interval"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 150
                        ,allowDecimals      : false
                        ,emptyText          : "Default: 60 seconds"
                        ,minValue           : 0         //2
                        ,maxValue           : 21845
                        ,maxLength          : 5
                        ,enforceMaxLength   : true
                        ,validator          : function() {
                            var k = Ext.getCmp("keepalive-interval_peer").getRawValue();
                            var h = Ext.getCmp("holdtime_peer").getRawValue();
                            if (k == "") { k = 60; } else { k = parseInt(k,10); }
                            if (h == "") { h = 180; } else { h = parseInt(h,10); }

                            if (k == 1) {
                                return "Keep Alive should be empty, 0, or 2..21845.";
                            }
                            if (k == 0) {
                                if (h != 0) {
                                    return "Keep Alive can only be 0 if Hold Time is also 0.";
                                }
                                return true;
                            }

                            if (h < 3 * k) {
                                return  "Keep Alive should be at most (Hold Time/3)."
                                        + "  Leave empty to apply the default value.";
                            }
                            return true;
                        }
                        ,listeners          : {
                            change              : function(num, newVal, oldVal, eOpts) {
                                Ext.getCmp("holdtime_peer").validate();
                            }
                        }
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Hold Time"
                        ,id                 : "holdtime_peer"
                        ,name               : "holdtime"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 150
                        ,allowDecimals      : false
                        ,emptyText          : "Default: 180 seconds"
                        ,minValue           : 0         //6
                        ,maxValue           : 65535
                        ,maxLength          : 5
                        ,enforceMaxLength   : true
                        ,validator          : function() {
                            var k = Ext.getCmp("keepalive-interval_peer").getRawValue();
                            var h = Ext.getCmp("holdtime_peer").getRawValue();
                            if (k == "") { k = 60; } else { k = parseInt(k,10); }
                            if (h == "") { h = 180; } else { h = parseInt(h,10); }

                            if (h == 0) {
                                if (k != 0) {
                                    return "Hold Time can only be 0 if Keep Alive is also 0.";
                                }
                                return true;
                            }
                            if (h > 0 && h < 6) {
                                return "Hold Time should be empty, 0, or 6..65535.";
                            }

                            if (h < 3 * k) {
                                return  "Hold Time should be at least (Keep Alive*3)."
                                        + "  Leave empty to apply the default value.";
                            }
                            return true;
                        }
                        ,listeners          : {
                            change              : function(num, newVal, oldVal, eOpts) {
                                Ext.getCmp("keepalive-interval_peer").validate();
                            }
                        }
                    }
                ]
            };
        }

        function peering_w_rs_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Needed when Peering with Route Server"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "Ignore First AS Hop"
                        ,id             : "ignorefirstashop_peer"
                        ,name           : "ignorefirstashop"
                        ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                        ,width          : CP.bgp.PEER_LABELWIDTH + 100
                        ,height         : 22
                        ,getDBValue     : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function keepalive_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Keep Alive"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "Keep Alive Always"
                        ,id             : "keepalivesalways_peer"
                        ,name           : "keepalivesalways"
                        ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                        ,width          : CP.bgp.PEER_LABELWIDTH + 100
                        ,height         : 22
                        ,getDBValue     : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function routes_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Routes"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype           : "cp4_combobox"
                        ,fieldLabel     : "Accept Routes Received From the Peer"
                        ,id             : "keep_peer"
                        ,name           : "keep"
                        ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                        ,width          : CP.bgp.PEER_LABELWIDTH + 100
                        ,allowBlank     : false
                        ,queryModel     : "local"
                        ,editable       : false
                        ,triggerAction  : "all"
                        ,value          : ""
                        ,store          :   [[""        ,"All"]
                                            ,["none"    ,"None"]]
                    }
                ]
            };
        }

        function alwaysaccept_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Allows Accept TCP Sessions from your Peer"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype           : "cp4_checkbox"
                        ,fieldLabel     : "Passive"
                        ,id             : "passive_peer"
                        ,name           : "passive"
                        ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                        ,width          : CP.bgp.PEER_LABELWIDTH + 100
                        ,height         : 22
                        ,getDBValue     : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function auth_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Authentication"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype           : "cp4_combobox"
                        ,fieldLabel     : "Authentication Type"
                        ,id             : "auth_md5_peer"
                        ,name           : "auth:md5"
                        ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                        ,width          : CP.bgp.PEER_LABELWIDTH + 100
                        ,allowBlank     : false
                        ,queryModel     : "local"
                        ,editable       : false
                        ,triggerAction  : "all"
                        ,value          : ""
                        ,store          :   [[""    ,"None"]
                                            ,["t"   ,"MD5"]]
                        ,listeners      : {
                            select          : function(c, recs, eOpts) {
                                var v = Ext.getCmp("auth_md5_peer").getValue().toLowerCase();
                                var pass = Ext.getCmp("auth_md5_password_peer");
                                if (pass) {
                                    pass.setDisabled( v == "" );
                                    pass.setVisible( v != "" );
                                    if (pass.validate) pass.validate();
                                }
                            }
                        }
                        ,getDBValue     : function() {
                            var c = this;
                            var v = c.getValue();
                            return v;
                        }
                    },{
                        xtype               : "cp4_textfield"
                        ,fieldLabel         : "Password"
                        ,id                 : "auth_md5_password_peer"
                        ,name               : "auth:md5:password"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 150
                        ,maxLength          : 80
                        ,enforceMaxLength   : true
                        ,disabled           : true
                        ,inputType          : "password"
                        ,qtipText       : "Up to 80 characters, "
                                        + "alphanumeric and selected symbols ("
                                        + CP.ar_util.password_symbolstring
                                        + ")."
                        ,getDBValue     : function() {
                            var c = this;
                            var p = Ext.getCmp("auth_md5_peer").getDBValue();
                            var v = (p == "") ? "" : c.getValue();
                            return v;
                        }
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
                            ,change         : function(me, newVal, oldVal, eOpts) {
                                if (this.passExisted) {
                                    this.passExisted = false;
                                    this.emptyText = [ "" ]; // Brackets are needed for some reason
                                    this.applyEmptyText();
                                }
                            }
                        }
                        ,validator      : function() {
                            if (this.hidden) {
                                this.setDisabled(true);
                                return true;
                            }

                            var value = this.getDBValue();
                            if (this.getDBValue() == "" && !this.passExisted) {
                                return "Password cannot be blank.";
                            }

                            var validRegex = /^[0-9a-zA-Z\`\~\!\@\#\%\^\&\*\(\)\{\[\}\]\:\;\,\.\_\-\+\=]*$/;
                            if (!(validRegex.test(value))) {
                                return "Invalid characters in password. See mouseover text for valid characters.";
                            }
                            return true;
                        }
                    }
                ]
            };
        }

        function throttle_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Limit BGP Updates Send to a Peer"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Throttle Count"
                        ,id                 : "throttle_peer"
                        ,name               : "throttle"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 85
                        ,allowDecimals      : false
                        ,minValue           : 0
                        ,maxValue           : 65535
                        ,maxLength          : 5
                        ,enforceMaxLength   : true
                    }
                ]
            };
        }

        function default_originate_set( pg_type) {
            //for external
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,titleText  : "Default Originate"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Suppress Default-Originate"
                        ,id         : "nogendefault_peer"
                        ,name       : "nogendefault"
                        ,labelWidth : CP.bgp.PEER_LABELWIDTH
                        ,width      : CP.bgp.PEER_LABELWIDTH + 50
                        ,height     : 22
                        ,getDBValue : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function route_refresh_set(mode) {

            function common_unicast(suffix) {
                var peer        = Ext.getCmp("peer_entry").getDBValue();
                var peeras      = Ext.getCmp("AS_entry").getASNumber();
                var peeras_type = String( Ext.getCmp("AS_type_entry").getValue() );
                var rr_type     = (peeras_type == "i") ? peeras_type : "none";
                var prefix      = CP.bgp.getPeerGroupBindingPrefix(peeras, peeras_type);
                if (prefix == "") { return; }
                var rr_prefix   = prefix +":rrclient:"+ rr_type;
                var peer_prefix = rr_prefix +":peer:"+ peer;

                if ( peer != "" ) {
                    if ( String(peer).indexOf("v6addr") != -1 ) {
                        peer = String(peer).replace("v6addr:", "");
                        peer = CP.ip6convert.db_2_ip6(peer);
                    }

                    //unicast_message is the command to run
                    if ( peeras_type == "i" ) {
                        var cmd = "set bgp internal peer "
                                + peer + " send-route-refresh "
                                + suffix;
                    } else {
                        var cmd = "set bgp external remote-as " + peeras
                                + " peer " + peer + " send-route-refresh "
                                + suffix;
                    }

                    CP.bgp.UNICAST_MESSAGE  = cmd;

                    var params = CP.ar_util.clearParams();
                    params[peer_prefix +":route-refresh"]   = "t";
                    params[ CP.bgp.UNICAST_MESSAGE ]      = CP.global.token;
                    CP.bgp.mySubmit(false, false);
                }
            }

            function req_IPv4_Uni(b, e)       { common_unicast("request ipv4 unicast"); }
            function req_IPv6_Uni(b, e)       { common_unicast("request ipv6 unicast"); }
            function req_IPv4_IPv6_Uni(b, e)  { common_unicast("request all unicast"); }
            function send_IPv4_Uni(b, e)      { common_unicast("route-update ipv4 unicast"); }
            function send_IPv6_Uni(b, e)      { common_unicast("route-update ipv6 unicast"); }
            function send_IPv4_IPv6_Uni(b, e) { common_unicast("route-update all unicast"); }

            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Route Refresh"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Route Refresh"
                        ,id         : "route-refresh_peer"
                        ,name       : "route-refresh"
                        ,labelWidth : CP.bgp.PEER_LABELWIDTH
                        ,width      : CP.bgp.PEER_LABELWIDTH + 50
                        ,height     : 22
                        ,listeners  : {
                            change      : function(check, newVal, oldVal, eOpts) {
                                Ext.getCmp("rr_btnsbar").setVisible(newVal);
                            }
                        }
                        ,getDBValue : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    },{
                        xtype       : "cp4_formpanel"
                        ,id         : "rr_btnsbar"
                        ,layout     : "column"
                        ,margin     : 0
                        ,hidden     : true
                        ,defaults   : {
                            width               : 226
                            ,overrideNoToken    : false
                            ,disabledConditions : function() {
                                var b = this;
                                var e = b.editPeer;
                                var m = CP.ar_util.checkFormValid("bgp_configPanel");
                                var p = CP.ar_util.checkFormValid("open_peergroup_form");
                                var f = CP.ar_util.checkFormValid("peer_window_form");
                                return !(e && m && p && f);
                            }
                        }
                        ,chkBtns    : function() {
                            var ids =   ["rr_req_4"     ,"rr_send_4"
                                        ,"rr_req_6"     ,"rr_send_6"
                                        ,"rr_req_4-6"   ,"rr_send_4-6"];
                            var i, b;
                            for(i = 0; i < ids.length; i++) {
                                CP.ar_util.checkDisabledBtn( ids[i] );
                            }
                        }
                        ,items      : [
                            {
                                xtype       : "cp4_inlinemsg"
                                ,type       : "info"
                                ,text       : "Manual refresh buttons are unavailable on unsaved peers."
                                ,style      : "margin-top:5px;margin-bottom:10px;"
                                ,width      : 500
                                ,hidden     : (mode != "add")
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Request IPv4 Unicast Routes"
                                ,id         : "rr_req_4"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 4 12"
                                ,handler2   : req_IPv4_Uni
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Send IPv4 Unicast Route Update"
                                ,id         : "rr_send_4"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 4 12"
                                ,handler2   : send_IPv4_Uni
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Request IPv6 Unicast Routes"
                                ,id         : "rr_req_6"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 4 12"
                                ,handler2   : req_IPv6_Uni
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Send IPv6 Unicast Route Update"
                                ,id         : "rr_send_6"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 4 12"
                                ,handler2   : send_IPv6_Uni
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Request IPv4-IPv6 Unicast Routes"
                                ,id         : "rr_req_4-6"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 0 12"
                                ,handler2   : req_IPv4_IPv6_Uni
                            },{
                                xtype       : "cp4_button"
                                ,text       : "Send IPv4-IPv6 Unicast Route Update"
                                ,id         : "rr_send_4-6"
                                ,editPeer   : (mode != "add")
                                ,disabled   : (mode == "add")
                                ,margin     : "0 12 0 12"
                                ,handler2   : send_IPv4_IPv6_Uni
                            }
                        ]
                    }
                ]
            };
        }

        function graceful_restart_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Graceful Restart"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Graceful Restart"
                        ,id         : "graceful-restart_peer"
                        ,name       : "graceful-restart"
                        ,labelWidth : CP.bgp.PEER_LABELWIDTH
                        ,width      : CP.bgp.PEER_LABELWIDTH + 55
                        ,height     : 22
                        ,getDBValue : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                        ,listeners          : {
                            change              : function(num, newVal, oldVal, eOpts) {
                                Ext.getCmp("graceful-restart-notice").setVisible(newVal);
                            }
                        }
                    },{
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Stalepath Time"
                        ,id                 : "graceful-restart-stalepath-time_peer"
                        ,name               : "graceful-restart-stalepath-time"
                        ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                        ,width              : CP.bgp.PEER_LABELWIDTH + 85
                        ,allowDecimals      : false
                        ,minValue           : 60
                        ,maxValue           : 65535
                        ,maxLength          : 5
                        ,enforceMaxLength   : true
                        ,getDBValue         : function() {
                            var c = this;
                            var v = c.getRawValue();
                            if (v != "") {
                                v = Ext.Number.constrain(parseInt(v, 10),
                                    c.minValue, c.maxValue);
                            }
                            return v;
                        }
                    },{
                        xtype               : 'cp4_inlinemsg'
                        ,id                 : "graceful-restart-notice"
                        ,text               : 'BGP Graceful Restart must also be configured on the remote peer.'
                        ,hidden             : true
                    }
                ]
            };
        }

        function logging_set() {
            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 500
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Logging"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    },{
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Log BGP Peer Transitions"
                        ,id         : "logupdown_peer"
                        ,name       : "logupdown"
                        ,labelWidth : CP.bgp.PEER_LABELWIDTH
                        ,width      : CP.bgp.PEER_LABELWIDTH + 55
                        ,height     : 22
                        ,getDBValue : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    },{
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Log Warnings"
                        ,id         : "analretentive_peer"
                        ,name       : "analretentive"
                        ,labelWidth : CP.bgp.PEER_LABELWIDTH
                        ,width      : CP.bgp.PEER_LABELWIDTH + 55
                        ,height     : 22
                        ,getDBValue : function() {
                            var c = this;
                            var v = c.getValue() ? "t" : "";
                            return v;
                        }
                    }
                ]
            };
        }

        function trace_options_set() {

            function get_trace_option( traceType ) {
                return {
                    xtype       : "cp4_checkbox"
                    ,fieldLabel : ((traceType == "Keepalive") ? "Keep Alive" : traceType )
                    ,id         : "traceoptions_traceoptions_"+ traceType +"_peer"
                    ,name       : "traceoptions:traceoptions:"+ traceType
                    ,labelWidth : CP.bgp.PEER_TRACE_LABELWIDTH
                    ,width      : CP.bgp.PEER_TRACE_WIDTH
                    ,height     : 22
                    ,getDBValue : function() {
                        var c = this;
                        var v = c.getValue() ? "t" : "";
                        return v;
                    }
                };
            }

            var trace_list = {
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,width      : 499
                ,margin     : 0
                ,padding    : 0
                ,items      : [
                    get_trace_option("All")
                    ,get_trace_option("General")
                    ,get_trace_option("Keepalive")
                    ,get_trace_option("Normal")
                    ,get_trace_option("Open")
                    ,get_trace_option("Packets")
                    ,get_trace_option("Policy")
                    ,get_trace_option("Route")
                    ,get_trace_option("State")
                    ,get_trace_option("Task")
                    ,get_trace_option("Timer")
                    ,get_trace_option("Update")
                ]
            };

            return {
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,width      : 499
                ,items      : [
                    {
                        xtype       : "cp4_sectiontitle"
                        ,width      : 499
                        ,titleText  : "Trace Options"
                        ,margin     : CP.bgp.ADV_SECTIONTITLE_MARGIN
                    }
                    ,trace_list
                ]
            };
        }

        var adv_list = [];

        var af_id = String(af).indexOf("6") == -1 ? "4" : "6";

        adv_list.push( multiprotocol_set(af_id) );

        adv_list.push( localaddress_set(af_id) );
        if (pg_type != "e") {
            adv_list.push( weight_set() );
        }
        if (pg_type == "e") {
            adv_list.push( peerlocalas_set() );
            adv_list.push( med_set() );
            adv_list.push( nexthop_set() );
        }
        adv_list.push( aggregator_set() );
        if (pg_type != "i") {
            adv_list.push( aspath_set() );
        }
        if (pg_type == "e") {
            adv_list.push( private_as_set() );
        }
        adv_list.push( timers_set() );
        adv_list.push( peering_w_rs_set() );
        adv_list.push( keepalive_set() );
        adv_list.push( routes_set() );
        adv_list.push( alwaysaccept_set() );
        if (String(af).indexOf("6") == -1) {
            adv_list.push( auth_set() );
        }
        adv_list.push( throttle_set() );
        if (pg_type == "i" || pg_type == "e") {
            adv_list.push( default_originate_set() );
        }
        adv_list.push( route_refresh_set(mode) );
        adv_list.push( graceful_restart_set() );
        adv_list.push( logging_set() );
        adv_list.push( trace_options_set() );

        return {
            xtype   : "cp4_formpanel"
            ,id     : "peer_adv_settings_set"
            ,width  : 500
            ,margin : 0
            ,hidden : true
            ,listeners  : {
                hide            : function(panel, eOpts) {
                    this.disable();
                    Ext.getCmp("lcladdr_peer").validate();
                    var invalidTextBox = Ext.getCmp("adv_peer_invalid_target");
                    invalidTextBox.setValue("");
                }
                ,show           : function(panel, eOpts) {
                    this.enable();
                    Ext.getCmp("lcladdr_peer").validate();
                }
                ,validitychange : function(fieldAncestor, isV, eOpts) {
                    var invalidTextBox = Ext.getCmp("adv_peer_invalid_target");
                    if (isV) {
                        invalidTextBox.setValue("");
                    } else {
                        invalidTextBox.setValue("error");
                    }
                }
            }
            ,items  : adv_list
        };
    } //get_peer_advanced_settings_form

    ,ipv4_peer_entry_validation    : function(value) {
        var msg = CP.addr_list.getMatchMessage(value);
        if (msg != "") {
            return msg;
        }

        var intf_st = Ext.getStore("intf_store");
        var intf_name = String( CP.ar_util.getInterfaceByIp(intf_st, value) );
        if (intf_name != "false") {
            return "Address is used by an interface";
        }

        //check all peergroups
        var peergroups = Ext.getStore("peergroup_store").getRange();
        var peers;
        var i;
        var j;
        for(i = 0; i < peergroups.length; i++) {
            peers = peergroups[i].data.Peers_list;
            if (peergroups[i].data.AS_addr == value) {
                return "Address is used as a local address for a Peer Group.";
            }

            for(j = 0; j < peers.length; j++) {
                if (peers[j].peer == value) {
                    return "This peer already exists";
                }
            }
        }

        return true;
    }
    ,open_peer_window           : function(TITLE, af) {
        if (Ext.typeOf(af) == "undefined" || Ext.typeOf(af) == "null") {
            af = "4";
        } else {
            if (Ext.typeOf(af) != "string") {
                af = String(af);
            }
            if (af.indexOf("6") != -1) {
                af = "6";
            } else {
                af = "4";
            }
        }
        var pg_type = Ext.getCmp("AS_type_entry").getRawValue();
        var peer_cmp;       //ipv4field or displayfield
        var peer_type_cmp;  //combobox or displayfield
        var mode = "edit";
        if (TITLE == "add") {
            TITLE = "Add Peer";
            mode = "add";
            if (af == "4") {
                TITLE = "Add IPv4 Peer";
                peer_cmp = {
                    xtype   : "cp4_formpanel"
                    ,items  : [
                        {
                            xtype           : "cp4_ipv4field_ex"
                            ,fieldLabel     : "Peer"
                            ,id             : "peer_entry"
                            ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                            ,width          : CP.bgp.PEER_LABELWIDTH + 135
                            ,allowBlank                 : false
                            ,rejectZero                 : true
                            ,rejectLoopback             : true
                            ,rejectMulticast            : true
                            ,rejectGlobalBroadcast      : true
                            ,extraValidation : CP.bgp.ipv4_peer_entry_validation
                            ,fieldConfig    : {
                                fieldLabel      : "Peer"
                            }
                            ,getDBValue     : function() {
                                var c = this;
                                var v = c.getValue();
                                return v;
                            }
                        }
                    ]
                };
            } else {
                TITLE = "Add IPv6 Peer";
                peer_cmp = {
                    xtype               : "cp4_ipv6field_ex"
                    ,fieldLabel         : "Peer"
                    ,id                 : "peer_entry"
                    ,labelWidth         : CP.bgp.PEER_LABELWIDTH
                    ,width              : CP.bgp.PEER_LABELWIDTH + 275
                    ,allowBlank                 : false
                    ,rejectZero                 : true
                    ,rejectLoopback             : true
                    ,rejectMulticast            : true
                    ,rejectLinkLocal            : false
                    ,requireLinkLocal           : false
                    ,value              : ""
                    ,maxLength          : 39
                    ,enforceMaxLength   : true
                    ,getDBValue         : function() {
                        var c = this;
                        var ip6 = c.getValue();
                        var v = CP.ip6convert.ip6_2_db(ip6);
                        v = String(v).toLowerCase();
                        return ("v6addr:"+ v);
                    }
                    ,listeners          : {
                        change              : function() {
                            var bgp_intf = Ext.getCmp("bgpinterface");
                            if (bgp_intf && bgp_intf.handleState) { bgp_intf.handleState(); }

                            var multihop = Ext.getCmp("multihop_peer_panel");
                            if (multihop && multihop.handleState) { multihop.handleState(); }
                        }
                    }
                    ,extraValidation          : function(ip6) {
                        var v = CP.ip6convert.ip6_2_db(ip6);
                        var vClean = CP.ip6convert.db_2_ip6(v);
                        var m = CP.addr_list.getMatchMessage(vClean);
                        if (m != "") {
                            return m;
                        }
                        var intf_st = Ext.getStore("intf_store");
                        var intf_name = String( CP.ar_util.getInterfaceByIp(intf_st, vClean) );
                        if (intf_name != "false") {
                            return ("Address is used by interface "+ intf_name +".");
                        }
                        v = "v6addr:"+ String(v).toLowerCase();
                        var pg_st = Ext.getStore("peergroup_store");
                        if (pg_st) {
                            var pgs = pg_st.getRange();
                            var peers;
                            var i, j;
                            for(i = 0; i < pgs.length; i++) {
                                if (pgs[i].data.AS_addr == vClean) {
                                    return "Address is in use as a local address by a Peer Group.";
                                }
                                peers = pgs[i].data.Peers_list;
                                for(j = 0; j < peers.length; j++) {
                                    if (peers[j].peer == v) {
                                        return "This peer already exists.";
                                    }
                                    if (peers[j].lcladdr == vClean) {
                                        return "Address is in use as a local address for a peer.";
                                    }
                                }
                            }
                        }
                        return true;
                    }
                };
            }
            peer_type_cmp = CP.bgp.get_peer_type_combo_cmp(pg_type); //hidden if pg_type != "i"
        } else {
            peer_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Peer"
                ,id             : "peer_entry"
                ,name           : "peer"
                ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                ,width          : CP.bgp.PEER_LABELWIDTH + 135
                ,height         : 22
                ,afValue        : af
                ,getDBValue     : function() {
                    var c = this;
                    var a = c.afValue;
                    var v = c.getValue();
                    if (String(a) == "6") {
                        v = ( "v6addr:"+ CP.ip6convert.ip6_2_db(v) );
                    }
                    v = String(v).toLowerCase();
                    return v;
                }
            };
            peer_type_cmp = CP.bgp.get_peer_type_constant_cmp(pg_type); //hidden if pg_type != "i"
        }

        var adv_set = CP.bgp.get_peer_advanced_settings_form(pg_type, af, mode);
        //adv_set's id: "peer_adv_settings_set"

        function peer_window_afterrender(p, eOpts) {
            p.form._boundItems = null;
            var rec = null;

            if (Ext.getCmp("peer_entry").getXType() == "cp4_displayfield") {
                //edit
                rec = Ext.getCmp("peer_grid").getSelectionModel().getLastSelected();
                if (rec) {
                    p.loadRecord( rec );
                    var peer_str = String(rec.data.peer);
                    var lcladdr_str = String(rec.data.lcladdr);
                    var af = "4";
                    if (peer_str.indexOf("v6addr:") != -1) {
                        af = "6";
                        peer_str = peer_str.replace("v6addr:", "");
                        peer_str = CP.ip6convert.db_2_ip6(peer_str);
                        peer_str = peer_str.toUpperCase();
                    }
                    /*
                    if (af == "6") {
                        if (lcladdr_str.indexOf("v6addr:") != -1) {
                            lcladdr_str = lcladdr_str.replace("v6addr:", "");
                            lcladdr_str = CP.ip6convert.db_2_ip6(lcladdr_str);
                            lcladdr_str = lcladdr_str.toUpperCase();
                        } else {
                            lcladdr_str = "";
                        }
                    } else if (af == "4") {
                        if (lcladdr_str.indexOf("v6addr:") != -1) {
                            lcladdr_str = "";
                        }
                    } else {
                        lcladdr_str = "";
                    }
                    // */
                    Ext.getCmp("peer_entry").setValue( peer_str );
                    Ext.getCmp("lcladdr_peer").setValue( lcladdr_str );
                    var pass = Ext.getCmp("auth_md5_password_peer");
                    if (pass) {
                        var exed = rec.data['auth:md5:password_existed'];
                        if (exed) {
                            pass.emptyText = "Key is set";
                            pass.passExisted = true;
                        }
                        if (!exed) {
                            pass.passExisted = false;
                        }
                        if (pass.reset) pass.reset();
                    }
                }
            }

            var uni_form = Ext.getCmp("unicast_form");
            if (uni_form) {
                /* Only exists when IPv6 is enabled */
                uni_form.setValues(rec);
            }

            if ( Ext.getCmp("auth_md5_peer") ) {
                Ext.getCmp("auth_md5_peer").fireEvent("select");
            }
            var bgp_intf = Ext.getCmp("bgpinterface");
            if (bgp_intf && bgp_intf.handleState) { bgp_intf.handleState(); }

            var multihop = Ext.getCmp("multihop_peer_panel");
            if (multihop && multihop.handleState) { multihop.handleState(); }

            //window sizing is handled in the window's show listener
            if (p.chkBtns) { p.chkBtns(); }
        }

        var peer_save_btn = {
            xtype               : "cp4_button"
            ,text               : "Save"
            ,id                 : "peer_save_btn"
            ,disabled           : true
            ,overrideNoToken    : false
            ,handler2           : function(b, e) {
                CP.bgp.save_peer();
            }
            ,disabledConditions : function() {
                var m = CP.ar_util.checkFormValid("bgp_configPanel");
                var f = CP.ar_util.checkFormValid("peer_window_form");
                return !(m && f);
            }
            ,listeners  : {
                mouseover   : function(b, e) {
                    Ext.getCmp("peer_cancel_btn").fireEvent("mouseover");
                }
            }
        };

        //SIZE CHANGING FUNCTION
        function set_adv_btn_to_hide(b, adv_form) {
            //make big
            adv_form.setVisible(true);
            b.setText( CP.bgp.HIDE_ADV_BTN_TEXT );

            var form_height = 400; //desired body
            //Ext.getCmp("peer_window_form").setHeight(form_height);
        }
        function set_adv_btn_to_show(b, adv_form) {
            var invalidTextBox = Ext.getCmp("adv_peer_invalid_target");
            if (!invalidTextBox.isValid()) {
                //check if anything on the page is invalid, if so, don't shrink
                return;
            }
            //make small
            adv_form.setVisible(false);
            b.setText( CP.bgp.SHOW_ADV_BTN_TEXT );

            var form_height = 150; //desired body
            //Ext.getCmp("peer_window_form").setHeight(form_height);
        }

        var adv_btnsbar = {
            xtype   : "cp4_fieldcontainer"
            ,id     : "adv_peer_btnsbar"
            ,width  : 160
            ,items  : [
                {
                    xtype   : "cp4_button"
                    ,id     : "adv_peer_btn"
                    ,text   : CP.bgp.SHOW_ADV_BTN_TEXT
                    ,disable: function() { }
                    ,setDisabled: function(d) {
                        var b = this;
                        if (b.disabled) {
                            b.enable();
                        }
                    }
                    ,handler: function(b, e) {
                        var adv_form = Ext.getCmp("peer_adv_settings_set");
                        if (adv_form) {
                            if ( b.getText() == CP.bgp.SHOW_ADV_BTN_TEXT ) {
                                set_adv_btn_to_hide(b, adv_form);
                            } else {
                                set_adv_btn_to_show(b, adv_form);
                            }
                        }
                    }
                },{
                    xtype       : "cp4_textfield"
                    ,id         : "adv_peer_invalid_target"
                    ,hideLabel  : true
                    ,hidden     : true
                    ,width      : 0
                    ,validator  : function() {
                        if (this.getValue() == "error") {
                            return "One or more advanced settings is invalid.";
                        }
                        return true;
                    }
                }
            ]
        };

        var peer_window_form = {
            xtype       : "cp4_formpanel"
            ,id         : "peer_window_form"
            ,width      : 533
            ,height     : 350
            ,bodyBorder : false
            ,border     : 0
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,pollForChanges : true
            ,pollInterval   : 100
            ,listeners  : {
                afterrender     : peer_window_afterrender
                ,validitychange : function() {
                    var p = Ext.getCmp("peer_window_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                    var a = CP.ar_util.checkFormValid("peer_adv_settings_set");
                    if (!a) {
                        var f = Ext.getCmp("peer_adv_settings_set");
                        var b = Ext.getCmp("adv_peer_btn");
                        set_adv_btn_to_hide(b, f);
                    }
                }
                ,resize         : function(p, adjW, adjH, eOpts) {
                    /*
                    var win_h = Ext.getCmp("peer_window_form").getHeight();
                    if (adjH == undefined) {
                        win_h += 10;
                    }
                    var win_tb = Ext.getCmp("peer_window").getDockedComponent(0);
                    if (win_tb) {
                        win_h += win_tb.getHeight();
                    } else {
                        win_h += 22;
                    }
                    win_h += 12;
                    Ext.getCmp("peer_window").setHeight(win_h);
                    // */
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("peer_save_btn");
                CP.ar_util.checkDisabledBtn("peer_cancel_btn");
                CP.ar_util.checkBtnsbar("rr_btnsbar");
            }
            ,buttons    : [
                peer_save_btn
                ,{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "peer_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("peer_window");
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("lcladdr_peer").validate();
                            //CP.bgp.check_user_action();
                            var p = Ext.getCmp("peer_window_form");
                            if (p && p.chkBtns) { p.chkBtns(); }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 500
                    ,margin     : "15 0 0 15"
                    ,autoScroll : false
                    ,items      : [
                        peer_cmp
                        ,peer_type_cmp
                        ,{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Outgoing Interface"
                            ,id             : "bgpinterface"
                            ,name           : "bgpinterface"
                            ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                            ,width          : CP.bgp.PEER_LABELWIDTH + 130
                            ,queryMode      : "local"
                            ,triggerAction  : "all"
                            ,lastQuery      : ""
                            ,editable       : false
                            ,store          : Ext.getStore("intf_store")
                            ,valueField     : "intf"
                            ,displayField   : "intf"
                            ,allowBlank     : false
                            ,hidden         : true
                            ,disabled       : true
                            ,handleState    : function() {
                                var c = this;
                                var peer_entry = Ext.getCmp("peer_entry");
                                var peer = peer_entry.getDBValue();
                                var d = (peer.indexOf("v6addr:fe80000000000000") != 0);
                                c.setDisabled(d);
                                c.setVisible(!d);
                                c.validate();
                            }
                            ,getDBValue     : function() {
                                var c = this;
                                var v = "";
                                if ( !(c.disabled) ) {
                                    v = c.getValue();
                                }
                                return v;
                            }
                        },{
                            xtype       : "cp4_textfield"
                            ,fieldLabel : "Comment"
                            ,id         : "comment_peer"
                            ,name       : "comment"
                            ,labelWidth : CP.bgp.PEER_LABELWIDTH
                            ,width      : 495
                            ,maxLength          : 100
                            ,enforceMaxLength   : true
                            ,maskRe             : CP.ar_util.comment_maskRe
                            ,stripCharsRe       : CP.ar_util.comment_stripCharsRe
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Ping"
                            ,id             : "pingpeer_cb"
                            ,name           : "pingpeer"
                            ,labelWidth     : CP.bgp.PEER_LABELWIDTH
                            ,width          : 495
                            ,submitValue    : false
                        }
                        ,adv_btnsbar
                        ,adv_set
                    ]
                }
            ]
        };

        var peer_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "peer_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("open_peergroup_window").getPosition();
                    win.setPosition(544 + pos[0], pos[1]);
                    var b = Ext.getCmp("adv_peer_btn");
                    var adv_form = Ext.getCmp("peer_adv_settings_set");
                    //set_adv_btn_to_show(b, adv_form);
                }
            }
            ,items      : [ peer_window_form ]
        });
        peer_window.show();
    }

    /*
     * Returns 1 if the BGP peer can be a route reflector client.
     */
    ,rr_type_is_configurable    : function() {

        // Possible values for pg_type are "c", "i", or "e"
        var pg_type = Ext.getCmp("AS_type_entry").getValue();
        if (pg_type == "e") {
            // Route reflectors are N.A. for EBGP
            return 0;
        }

        if (pg_type == "c") {
            // Route reflectors are N.A. unless the peer group's routing domain
            // matches our routing domain
            var our_routing_domain = Ext.getCmp("routingdomain_display").getRawValue();
            var pg_routing_domain = Ext.getCmp("AS_entry").getASNumber();
            if (our_routing_domain != pg_routing_domain) {
                return 0;
            }
        }

        var clusterId = Ext.getCmp("clusterid_display").getValue();
        if ( clusterId  == "") {
            return 0;
        }

        /* Peer can be a route reflector client */
        return 1;
     }

    ,save_peer                  : function(b, e) {
        function getCmpDBValue(id) {
            var c = Ext.getCmp(id);
            var v = "";
            if (c && c.getDBValue) { v = c.getDBValue(); }
            return v;
        }

        if (!Ext.getCmp("peer_entry").validate()) {
            return;
        }

        var params  = CP.ar_util.clearParams();
        var AS      = Ext.getCmp("AS_entry").getASNumber();
        var AS_type = Ext.getCmp("AS_type_entry").getValue();
        var typePrefix = CP.bgp.getPeerTypePrefix(AS_type);
        var prefix  = CP.bgp.getPeerGroupBindingPrefix(AS, AS_type);
        if (prefix == "") { return; }

        var peer    = Ext.getCmp("peer_entry").getDBValue();
        var rr_type;

        if (CP.bgp.rr_type_is_configurable()) {
             rr_type = Ext.getCmp("peer_type_entry").getValue();
        } else {
             rr_type = "none";
        }

        var rr_prefix = prefix +":rrclient:"+ rr_type;
        var p_prefix = rr_prefix +":peer:"+ peer;

        var bgpinterface            = getCmpDBValue("bgpinterface");
        var comment                 = Ext.getCmp("comment_peer").getValue();
        var ping                    = Ext.getCmp("pingpeer_cb").getValue() ? "t" : "";

        var nov4unicast;
        var v6unicast;
        var uni_form = Ext.getCmp("unicast_form");
        if (uni_form) {
            /* Only exists when IPv6 is enabled */
            nov4unicast = uni_form.getIPv4UnicastValue();
            v6unicast = uni_form.getIPv6UnicastValue();
        } else {
            nov4unicast = "";
            v6unicast = "";
        }

        var lcladdr                 = getCmpDBValue("lcladdr_peer");
        var peer_localas                  = getCmpDBValue("peer_local_as");
        var peer_localas_as               = getCmpDBValue("peer_local_as_as");
        var peer_localas_inboundpeerlocal = getCmpDBValue("peer_local_as_inbound_peer_local");
        var peer_localas_outboundlocal    = getCmpDBValue("peer_local_as_outbound_local");
        var peer_localas_dualpeering      = getCmpDBValue("peer_local_as_dual_peering");
        var noaggregatorid          = getCmpDBValue("no-aggregator-id_peer");
        var holdtime                = Ext.getCmp("holdtime_peer").getRawValue();
        var keepaliveinterval       = Ext.getCmp("keepalive-interval_peer").getRawValue();

        var h = (holdtime           != "") ? holdtime           : 180;
        var k = (keepaliveinterval  != "") ? keepaliveinterval  : 60;
        if ( parseInt(h, 10) < 3 * parseInt(k, 10) ) {
            holdtime = 3 * parseInt(k, 10);
        }

        var ignorefirstashop        = getCmpDBValue("ignorefirstashop_peer");
        var keepalivesalways        = getCmpDBValue("keepalivesalways_peer");
        var keep                    = Ext.getCmp("keep_peer").getValue();
        var passive                 = getCmpDBValue("passive_peer");
        var auth_md5                = getCmpDBValue("auth_md5_peer");
        var auth_md5_password       = getCmpDBValue("auth_md5_password_peer");
        var throttle                = Ext.getCmp("throttle_peer").getRawValue();
        var routerefresh            = getCmpDBValue("route-refresh_peer");
        var graceful_restart        = getCmpDBValue("graceful-restart_peer");
        var grh_stalepath_time      = getCmpDBValue("graceful-restart-stalepath-time_peer");
        var logupdown               = getCmpDBValue("logupdown_peer");
        var analretentive           = getCmpDBValue("analretentive_peer");

        var trace_All       = getCmpDBValue("traceoptions_traceoptions_All_peer");
        var trace_General   = getCmpDBValue("traceoptions_traceoptions_General_peer");
        var trace_Keepalive = getCmpDBValue("traceoptions_traceoptions_Keepalive_peer");
        var trace_Normal    = getCmpDBValue("traceoptions_traceoptions_Normal_peer");
        var trace_Open      = getCmpDBValue("traceoptions_traceoptions_Open_peer");
        var trace_Packets   = getCmpDBValue("traceoptions_traceoptions_Packets_peer");
        var trace_Policy    = getCmpDBValue("traceoptions_traceoptions_Policy_peer");
        var trace_Route     = getCmpDBValue("traceoptions_traceoptions_Route_peer");
        var trace_State     = getCmpDBValue("traceoptions_traceoptions_State_peer");
        var trace_Task      = getCmpDBValue("traceoptions_traceoptions_Task_peer");
        var trace_Timer     = getCmpDBValue("traceoptions_traceoptions_Timer_peer");
        var trace_Update    = getCmpDBValue("traceoptions_traceoptions_Update_peer");

        //variables that might be automatically ignored (because they are always hidden)
        var preference      = (AS_type == "e") ? "" : getCmpDBValue("preference_peer");
        var med             = (AS_type != "e") ? "" : getCmpDBValue("med_peer");
        var metricout       = (AS_type != "e") ? "" : getCmpDBValue("metricout_peer");
        var multihop        = (AS_type != "e") ? "" : getCmpDBValue("multihop_peer");
        var ttl             = (multihop == "") ? "" : getCmpDBValue("ttl_peer");
        var ascount         = (AS_type == "i") ? "" : getCmpDBValue("ascount_peer");
        var asoverride      = (AS_type != "e") ? "" : getCmpDBValue("as-override_peer");
        var removeprivateas = (AS_type != "e") ? "" : getCmpDBValue("removeprivateas_peer");
        var nogendefault    = !(AS_type == "i" || AS_type == "e") ? "" : getCmpDBValue("nogendefault_peer");

        params[typePrefix]                                          = "t";
        params[prefix]                                              = "t";
        params[rr_prefix]                                           = "t";
        params[p_prefix]                                            = "t";
        params[p_prefix +":bgpinterface"]                           = bgpinterface;
        params[p_prefix +":comment"]                                = comment;
        params[p_prefix +":ping"]                                   = ping;
        params[p_prefix +":nov4unicast"]                            = nov4unicast;
        params[p_prefix +":v6unicast"]                              = v6unicast;
        params[p_prefix +":lcladdr"]                                = lcladdr;
        if (peer_localas == "") {
            params[p_prefix +":peer-local-as"]                           = "";
            params[p_prefix +":peer-local-as:as"]                        = "";
            params[p_prefix +":peer-local-as:inbound-peer-local"]                 = "";
            params[p_prefix +":peer-local-as:outbound-local"]                = "";
            params[p_prefix +":peer-local-as:dual-peering"]            = "";
        } else {
            params[p_prefix +":peer-local-as"]                           = peer_localas;
            params[p_prefix +":peer-local-as:as"]                        = peer_localas_as;
            params[p_prefix +":peer-local-as:inbound-peer-local"]        = peer_localas_inboundpeerlocal;
            params[p_prefix +":peer-local-as:outbound-local"]            = peer_localas_outboundlocal;
            params[p_prefix +":peer-local-as:dual-peering"]              = peer_localas_dualpeering;
        }
        params[p_prefix +":preference"]                             = preference;
        params[p_prefix +":med"]                                    = med;
        params[p_prefix +":metricout"]                              = metricout;
        params[p_prefix +":multihop"]                               = multihop;
        params[p_prefix +":ttl"]                                    = ttl;
        params[p_prefix +":no-aggregator-id"]                       = noaggregatorid;
        params[p_prefix +":as-override"]                            = asoverride;
        params[p_prefix +":ascount"]                                = ascount;
        params[p_prefix +":removeprivateas"]                        = removeprivateas;
        params[p_prefix +":holdtime"]                               = holdtime;
        params[p_prefix +":keepalive-interval"]                     = keepaliveinterval;
        params[p_prefix +":ignorefirstashop"]                       = ignorefirstashop;
        params[p_prefix +":keepalivesalways"]                       = keepalivesalways;
        params[p_prefix +":keep"]                                   = keep;
        params[p_prefix +":passive"]                                = passive;
        params[p_prefix +":auth:md5"]                               = auth_md5;
        var opp = p_prefix +":auth:md5:password";
        delete(params[opp]);
        if (auth_md5_password != "" || auth_md5 == "") {
            // password goes under a different prefix where it gets encrypted
            opp = opp.replace(/^routed:/, ":routed:obscure:");
            params[opp]                                             = auth_md5_password;
        }
        params[p_prefix +":throttle"]                               = throttle;
        params[p_prefix +":nogendefault"]                           = nogendefault;
        params[p_prefix +":route-refresh"]                          = routerefresh;
        params[p_prefix +":graceful-restart"]                       = graceful_restart;
        params[p_prefix +":graceful-restart-stalepath-time"]        = grh_stalepath_time;
        params[p_prefix +":logupdown"]                              = logupdown;
        params[p_prefix +":analretentive"]                          = analretentive;
        params[p_prefix +":traceoptions:traceoptions:All"]          = trace_All;
        params[p_prefix +":traceoptions:traceoptions:General"]      = trace_General;
        params[p_prefix +":traceoptions:traceoptions:Keepalive"]    = trace_Keepalive;
        params[p_prefix +":traceoptions:traceoptions:Normal"]       = trace_Normal;
        params[p_prefix +":traceoptions:traceoptions:Open"]         = trace_Open;
        params[p_prefix +":traceoptions:traceoptions:Packets"]      = trace_Packets;
        params[p_prefix +":traceoptions:traceoptions:Policy"]       = trace_Policy;
        params[p_prefix +":traceoptions:traceoptions:Route"]        = trace_Route;
        params[p_prefix +":traceoptions:traceoptions:State"]        = trace_State;
        params[p_prefix +":traceoptions:traceoptions:Task"]         = trace_Task;
        params[p_prefix +":traceoptions:traceoptions:Timer"]        = trace_Timer;
        params[p_prefix +":traceoptions:traceoptions:Update"]       = trace_Update;

        CP.bgp.mySubmit(false, true);
    }
}

