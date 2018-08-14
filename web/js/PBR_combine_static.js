CP.PBR_static = {
    EDITABLE_RULE_PRIORITY      : true

    ,NORMAL_INFO        : "<b>Normal:</b> Accept and forward packets."
    ,REJECT_INFO        : "<b>Reject:</b> Drop packets, and send <i>unreachable</i> messages."
    ,BLACKHOLE_INFO     : "<b>Black Hole:</b> Drop packets, but don't send <i>unreachable</i> messages."

//Constants
    ,PBR_TABLE_MAX_ID           : 255
    ,PBR_TABLE_MIN_DYNAMIC_ID   : 1
    ,PBR_TABLE_MAX_DYNAMIC_ID   : 252

    ,PRIORITY_MINIMUM           : 1
    ,PRIORITY_MAXIMUM           : 4294967295

    ,RULES_LABELWIDTH           : 100

//state tracking globals
    ,PBR_TABLE_NAME             : ""

    ,check_user_action          : function() {
        CP.ar_util.checkDisabledBtn("pbr_apply_adv_option_btn");
        CP.ar_util.checkBtnsbar("pbr_table_btnsbar");
        CP.ar_util.checkBtnsbar("pbr_rule_btnsbar");
        CP.ar_util.checkBtnsbar("pbr_gw_btnsbar");
        CP.ar_util.checkBtnsbar("pbr_rule_form");
        CP.ar_util.checkBtnsbar("pbr_static_form");
    }

//init
    ,init                       : function() {
        CP.PBR_static.defineStores();
        CP.PBR_static.getSecureXL();
        var configPanel = CP.PBR_static.configPanel();
        var obj = {
            title           : "Policy Tables"
            ,panel          : configPanel
            ,submitURL      : "/cgi-bin/PBR_routetable.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("pbr_static_window");
                CP.ar_util.checkWindowClose("pbr_rule_window");
                CP.PBR_static.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.PBR_monitor_4 && CP.PBR_monitor_4.doLoad) {
                    CP.PBR_monitor_4.doLoad();
                }
            }
            ,submitFailure  : CP.PBR_static.doLoad
            ,checkCmpState  : CP.PBR_static.check_user_action
            ,cluster_feature_name: "pbr"
        };
        CP.UI.updateDataPanel(obj, null, true);
    }

//useful functions
    ,get_rule_prefix        : function(priority) {
        if(priority == null || priority == undefined || priority == "") {
            return "";
        }
        return "routed:instance:"+ CP.ar_util.INSTANCE() +":pbrrules:priority:"+ priority;
    }
    ,get_table_prefix       : function(table_name) {
        if(table_name == null || table_name == undefined || table_name == "") {
            return "";
        }
        return "routed:instance:"+ CP.ar_util.INSTANCE() +":pbrtables:table:"+ table_name;
    }
    ,getMaskLength          : function(cmpId) {
        var cmp = Ext.getCmp(cmpId);
        if(cmp) {
            return ((cmp.getMaskLength) ? cmp.getMaskLength() : cmp.getValue());
        }
        return "";
    }
    ,renderer_inline        : function(value, tip, align, color) {
        if(!tip)    { tip = value; }
        if(!align)  { align = "left"; }
        if(!color)  { color = "black"; }
        return '<div style="float:'+align+';text-align:'+align+';display:inline;color:'+color+';" data-qtip="'+tip+'" >'+value+'</div>';
    }

    ,count_destinations     : function(t_name, net, mask, count_all) {
        if(!count_all) { count_all = false; }
        var recs = Ext.getStore("pbr_static_dest_store").getRange();
        var count = 0;
        var i;
        for(i = 0; i < recs.length; i++) {
            if(t_name == recs[i].data.table_name) {
                if(count_all || recs[i].data.gw_listdict.length > 0) {
                    count++;
                } else if(net == recs[i].data.netaddress && mask == recs[i].data.masklen) {
                    count++;
                }
            }
        }
        return count;
    }

    ,getSecureXL                 : function() {
	    Ext.Ajax.request({
			    url: "/cgi-bin/PBR_routetable.tcl?instance="+CP.ar_util.INSTANCE()+"&option=global"
			    ,method: "GET"
			    ,success: function(response) {
	                var jsonData = Ext.decode(response.responseText);
	                var status = Ext.String.htmlDecode(jsonData.data.securexl_active);
	                Ext.getCmp("sxl_status").setValue(status);
                    var sim_cmp = Ext.getCmp("sim_entry");
                    // disable checkbox
                    if (Ext.getCmp("sxl_status").getValue() != "On") {
                        sim_cmp.setValue(false);
                        // sim_cmp.setDisabled(true);
                    }
                    var params = CP.ar_util.clearParams();
                    var sim_prefix = "pbrroute:sim:flag";
                    if (sim_cmp && sim_cmp.isValid()) {
                        params[sim_prefix] = sim_cmp.getValue() ? "1" : "";
                    }
                    CP.ar_util.mySubmit();
			    }
			    ,failure: function() {
			        Ext.Msg.alert("Error","Unable to receive data from the server.");
		        }
	    })
    }

// defineStores
    ,defineStores               : function() {
        if( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["pbr_static_dest_grid", "pbr_rule_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("pbrstatic");
        }

        function ipv4_sortType(v) {
            if(v == undefined || v == "") {
                return String(4294967296);
            }
            var o = v.split(".");
            var retValue = 1;
            var i;
            for(i = 0; i < o.length; i++) {
                retValue = retValue * 256 + parseInt(o[i], 10);
            }
            return String(retValue);
        }
        function gw_sortType(v) {
            if(v.indexOf(".") == -1) {
                return v;
            }
            return "z"+ String(ipv4_sortType(v));
        }

        function table_id_sortType(v) {
            if(v == undefined) {
                return 4294967296;
            }
            if(v == "") {
                return 0;
            }
            if(v == 0) {
                return 1;
            }
            if(v > CP.PBR_static.PBR_TABLE_MAX_DYNAMIC_ID) {
                return parseInt(v, 10);
            }
            return parseInt(v, 10) + 300;
        }

        //intf-list.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : true
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(v) {
                        if(v == undefined) {
                            return 4294967296;
                        }
                        if(v == "") {
                            return "A";
                        }
                        if(String(v).toLowerCase().substring(0,2) == "lo") {
                            return "zzz"+ String(v);
                        }
                        return "A"+ v;
                    }
                }
                ,"intf_mask"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/intf-list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"ipVersion"    : "ipv4"
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
                load        : function(st, recs, success, eOpts) {
                    st.each(function(rec) {
                        if(rec.data.intf != "") {
                            rec.data.intf_mask = rec.data.intf;
                        }
                    });
                    st.sort("intf", "ASC");

                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //PBR_routetable.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "routetable_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "table_id"
                    ,sortType   : table_id_sortType
                }
                ,"table_name"
                ,"hasRoute"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/PBR_routetable.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "table"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.tables"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                    st.clearFilter();
                }
            }
        });

        //PBR_static.tcl
        Ext.create("CP.WebUI4.Store", {
            storeId     : "pbr_static_dest_store"
            ,autoLoad   : false
            ,fields     : [
                "table_name"
                ,"table_id"
                ,"inuse"
                ,"protocol_list"
                ,{
                    name        : "netaddress"
                    ,sortType   : function(value) {
                        if(String(value).toLowerCase() == "default") {
                            return 0;
                        }
                        return ipv4_sortType(value);
                    }
                }
                ,"masklen"
                ,{
                    name        : "option"
                    ,sortType   : function(value) {
                        switch(String(value).toLowerCase()) {
                            case "":            return 0;
                            case "reject":      return 1;
                            case "blackhole":   return 2;
                            default:
                                break;
                        }
                        return 10;
                    }
                }
                ,"gw_listdict"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/PBR_routetable.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "table"
                    ,"script"       : "static"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.tables"
                }
            }
            ,sorters    : [{property: "table_id", direction: "ASC"},{property: "netaddress", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, success, eOpts) {
                    var r = st.getRange();
                    var i;
                    var pbr_static_dest_sort_func = function(a, b) {
                        if(a.preference - b.preference) {
                            return (a.preference - b.preference);
                        }
                        var aG = gw_sortType(a.gw);
                        var bG = gw_sortType(b.gw);
                        return (aG < bG) ? -1 : 1;
                    };
                    for(i = 0; i < r.length; i++) {
			if (Ext.typeOf(r[i].data.gw_listdict) == 'array') {
                            Ext.Array.sort(r[i].data.gw_listdict, pbr_static_dest_sort_func);
			}
                    }
                    var grid = Ext.getCmp("pbr_static_dest_grid");
                    if(grid) {
                        grid.getView().refresh();
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        //loaded from a dest record
        Ext.create("CP.WebUI4.Store", {
            storeId     : "pbr_static_gw_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "gw"
                    ,sortType   : gw_sortType
                }
                ,"preference"
                ,"gw_type"
                ,"mtu"
                ,"advmss"
                ,"rtt"
                ,"rttvar"
                ,"window"
                ,"cwnd"
                ,"initcwnd"
                ,"ssthresh"
            ]
            ,proxy      : {
                type            : "memory"
                ,reader         : {
                    type            : "array"
                }
            }
            ,sorters    : [{
                property    : "preference"
                ,direction  : "ASC"
            }]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "routerule_store"
            ,autoLoad   : false
            ,fields     : [
                {name: "priority", type: "int"}
                ,"not"
                ,{name: "from", sortType: ipv4_sortType}
                ,"fromML"
                //,"fromDuplicate"    //don't need, afterrender pre-fills params with a blanking
                ,{name:"to", sortType: ipv4_sortType}
                ,"toML"
                //,"toDuplicate"      //don't need, afterrender pre-fills params with a blanking
                ,"tos"
                ,"fwmark"
                ,"dev"
                ,"port"
                ,"protocol"
                ,"table"
                ,"table_name"
                ,"prohibit"
                ,"reject"
                ,"unreachable"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/PBR_routerule.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "rules"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.rules"
                }
            }
            ,sorters    : [{property: "priority", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, success, eOpts) {
                    // enable/disable sim flag
                    var rule_count = Ext.getStore("routerule_store").getRange().length;
                    if (rule_count == 0 || Ext.getCmp("sxl_status").getValue() != "On") {
                        Ext.getCmp("sim_entry").setDisabled(true);
                    } else {
                        if (CP.global.token > -1) {
                            Ext.getCmp("sim_entry").setDisabled(false);
                        }
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "pbr_ports_store"
            ,autoLoad   : false
            ,fields     : [
                "PORT"
                ,"PROTO"
                ,"STR"
                ,"STR2"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/PBR_routerule.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "ports"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.ports"
                }
            }
            ,sorters    : [{property: "PORT", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, success, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });
    }

    ,configPanel            : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "pbr_static_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.PBR_static.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("pbr_static"),
                CP.PBR_static.get_pbr_tables_static()
                ,CP.PBR_static.get_pbr_rules()
                ,CP.PBR_static.get_advanced_options_set()
            ]
        });
        return configPanel;
    }

    ,doLoad                 : function() {
        function getStoreCallLoad(stId, PARAMS) {
            if (!PARAMS) {
                PARAMS = {"instance": CP.ar_util.INSTANCE()};
            }
            var st = Ext.getStore(stId);
            if (st && st.load) {
                if (st.removeAll) {
                    st.removeAll();
                }
                CP.ar_util.loadListPush( stId );
                st.load({params: PARAMS});
            }
        }

        CP.ar_util.clearParams();
        if(CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( CP.ar_util.INSTANCE() );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.loadStore("pbrstatic");
        }

        getStoreCallLoad("pbr_ports_store",       {"instance": CP.ar_util.INSTANCE(), "option": "ports"});
        getStoreCallLoad("routetable_store",      {"instance": CP.ar_util.INSTANCE()});
        getStoreCallLoad("routerule_store",       {"instance": CP.ar_util.INSTANCE(), "option": "rules"});
        getStoreCallLoad("pbr_static_dest_store", {"instance": CP.ar_util.INSTANCE(), "script": "static"});
        var p = Ext.getCmp("pbr_static_configPanel");
        if (p) {
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/PBR_routetable.tcl?instance="+ CP.ar_util.INSTANCE()
                              +"&option=global"
                ,method     : "GET"
                ,success    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }
        CP.ar_util.loadListPop( "mySubmit" );
    }

    ,get_pbr_tables_static      : function() {
        function delete_pbr_table(rec) {
            var inuse   = rec.data.inuse;
            var t_name  = rec.data.table_name;
            var net     = rec.data.netaddress;
            var mask    = rec.data.masklen;
            var params  = CP.ar_util.getParams();
            var prefix  = CP.PBR_static.get_table_prefix(t_name);
            if(prefix == "") { return 0; }
            var s_prefix= prefix +":static";
            var n_prefix= "";
            var m_prefix= "";
            if(String(net).toLowerCase() == "default") {
                n_prefix= s_prefix +":default";
                m_prefix= n_prefix;
            } else {
                n_prefix= s_prefix +":network:"+ net;
                m_prefix= n_prefix +":masklen:"+ rec.data.masklen;
            }

            var gw_prefix   = "";
            var i           = 0;
            var gws = rec.data.gw_listdict;
            params[prefix]  = "t";
            for(i = 0; i < gws.length; i++) {
                gw_prefix = m_prefix +":gateway:"+ gws[i].gw_type +":"+ gws[i].gw;
                params[gw_prefix +":mtu"]        = "";
                params[gw_prefix +":advmss"]     = "";
                params[gw_prefix +":rtt"]        = "";
                params[gw_prefix +":rttvar"]     = "";
                params[gw_prefix +":window"]     = "";
                params[gw_prefix +":cwnd"]       = "";
                params[gw_prefix +":initcwnd"]   = "";
                params[gw_prefix +":ssthresh"]   = "";
                params[gw_prefix +":preference"] = "";
                params[gw_prefix] = "";
            }
            params[m_prefix +":gateway"] = "";
            params[m_prefix +":option"] = "";
            params[m_prefix] = "";
            var st = Ext.getStore("pbr_static_dest_store");
            if(st) {
                st.remove(rec);
                if(String(net).toLowerCase() != "default") {
                    var recs = st.getRange();
                    var d;
                    for(i = 0; i < recs.length; i++) {
                        d = recs[i].data;
                        if(d.table_name == t_name && d.netaddress == net) {
                            return 1;
                        }
                    }
                    //no matching table_name and netaddress, so push "" to the n_prefix
                    params[n_prefix] = "";
                }
            }
            return 1;
        }

        function before_delete_pbr_table() {
            var sm = Ext.getCmp("pbr_static_dest_grid").getSelectionModel();
            var recs = sm.getSelection();
            CP.ar_util.clearParams();
            var t_name,n,m,i;
            var push_count = 0;
            var r_len = recs.length;
            for(i = 0; i < r_len; i++) {
                t_name = recs[i].data.table_name;
                n = recs[i].data.netaddress;
                m = recs[i].data.masklen;
                if(recs[i].data.inuse == "" || CP.PBR_static.count_destinations(t_name, n, m, true) > 1) {
                    push_count += delete_pbr_table(recs[i]);
                }
            }
            if(push_count > 0) {
                CP.ar_util.mySubmit();
            }
            if(r_len > push_count) {
                Ext.Msg.alert("Warning","One or more of the selected static routes represents the last routing protocol<br>for a table that is in use.  Those records were preserved.");
            }
        }

        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pbr_table_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "pbr_table_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.PBR_static.open_pbr_static_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "pbr_table_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("pbr_static_dest_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var title = "";
                        if(rec.data.netaddress == "default") {
                            title = "Edit Default Static Route on Table "+ rec.data.table_name;
                        } else {
                            var d = rec.data.netaddress +"/"+ rec.data.masklen;
                            title = "Edit Static Route "+ d +" on Table "+ rec.data.table_name;
                        }
                        CP.PBR_static.open_pbr_static_window(title);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pbr_static_dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "pbr_table_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : before_delete_pbr_table
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pbr_static_dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                    ,qtipText   : "Can\'t delete the last routing protocol for a table that is in use.  Reject and Blackhole routes do not route."
                    ,listeners  : {
                        afterrender : function(b, eOpts) {
                            Ext.tip.QuickTipManager.register({
                                target          : b.getId()
                                ,text           : b.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
            ]
        };

        var grid_cm = [
            {
                text            : "Table Id"
                ,dataIndex      : "table_id"
                ,width          : 90
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.table_id == rec.data.table_id) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(value, value, "left", color);
                }
            },{
                text            : "Table"
                ,dataIndex      : "table_name"
                ,width          : 150
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = value;
                    var color       = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.table_id == rec.data.table_id) {
                            color = "grey";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : "Destination"
                ,dataIndex      : "netaddress"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var tip = "";
                    var color = "black";
                    switch(String(value).toLowerCase()) {
                        case "default":     retValue = "Default";
                                            tip = retValue;
                            break;
                        case "":            retValue = "None";
                                            tip = "Not a route.";
                            break;
                        default:
                            retValue = String(value) +"/"+ String(rec.data.masklen);
                            tip = retValue;
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", color);
                }
            },{
                text            : "Next Hop"
                ,dataIndex      : "option"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    switch(value) {
                        case "blackhole":   retValue = "Blackhole";
                            break;
                        case "reject":      retValue = "Reject";
                            break;
                        case "":            retValue = "Normal";
                            break;
                        default:
                            break;
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Gateways"
                ,dataIndex      : "gw_listdict"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    function append_gw(gw, gw_type) {
                        if(gw_type == "lname") {
                            return CP.intf_state.format_substr(
                                gw
                                ,gw
                                ,"ipv4"
                                ,CP.ar_util.INSTANCE()
                            );
                        }
                        return gw;
                    }
                    var i;
                    var retValue = "";
                    var gws = rec.data.gw_listdict;
                    if(value == null || gws.length < 1) {
                        retValue = "None";
                    } else {
                        retValue = append_gw(gws[0].gw, gws[0].gw_type);
                        if(gws.length > 1) {
                            for(i = 1; i < gws.length; i++) {
                                retValue += "<br>"+ append_gw(gws[i].gw, gws[i].gw_type);
                            }
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "In Use by Rules"
                ,dataIndex      : "inuse"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var v = value;
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row-1);
                        if(p_rec.data.table_id == rec.data.table_id) {
                            color = "grey";
                        }
                    }
                    if(color == "black" && String(value).indexOf(",") != -1) {
                        v = value.replace(/, /g,"<br />");
                    }
                    var tip = value;
                    return CP.ar_util.rendererSpecific(v, tip, "left", color);
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function() {
                    CP.ar_util.checkBtnsbar("pbr_table_btnsbar");
                }
            }
        });

        var gridHeight = 181;
        var gridWidth = 760;
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pbr_static_dest_grid"
            ,width              : gridWidth
            ,height             : gridHeight
            ,shortHeight        : gridHeight
            ,longHeight         : gridHeight * 2
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : "pbr_static_dest_store"
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("pbr_table_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Action Tables"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,autoScroll : true
                ,margin     : 0
                ,items      : [ grid ]
            }
        ];
    }

//window related
    ,get_table_cmp              : function(TYPE, form_width, form_labelWidth) {
        if(Ext.getCmp("table_name_entry")) {
            Ext.getCmp("table_name_entry").destroy();
        }
        var table_name_label    = "Table Name";
        if(TYPE == "add") {
            return {
                xtype           : "cp4_combobox"
                ,fieldLabel     : table_name_label
                ,id             : "table_name_entry"
                ,name           : "table_name"
                ,labelWidth     : form_labelWidth
                ,width          : form_width
                ,queryMode      : "local"
                //,lastQuery      : ""
                ,mode           : "local"
                ,editable       : true  //allows typing
                ,forceSelection : false //allows typing
                ,triggerAction  : "all"
                ,store          : Ext.getStore("routetable_store")
                ,valueField     : "table_name"
                ,displayField   : "table_name"
                ,allowBlank     : false
                ,maxLength      : 64
                ,enforceMaxLength: true
                ,maskRe         : /[a-zA-Z0-9]/     // ]/
                ,stripCharsRe   : /[^a-zA-Z0-9]/    // ]/
                ,emptyText      : "Select an existing table or enter a new table name."
                ,qtipText       : "Select an existing table or enter a new table name."
                                + "<br>The first character cannot be a number."
                ,validator      : function(v) {
                    var t_cmp = Ext.getCmp("table_name_entry");
                    if( !t_cmp ) {
                        return "";
                    }
                    var value = t_cmp.getValue();
                    if(value == null || String(value).length == 0) { return ""; }
                    switch(String(value[0])) {
                        case "0":   case "1":   case "2":   case "3":   case "4":
                        case "5":   case "6":   case "7":   case "8":   case "9":
                            return "The first character cannot be a number.";
                        default:
                            break;
                    }
                    return true;
                }
                ,enableKeyEvents: true
                ,listeners      : {
                    afterrender     : function(combo, eOpts) {
                        if(combo.qtipText) {
                            Ext.tip.QuickTipManager.register({
                                target          : combo.getId()
                                ,text           : combo.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                    ,beforedestroy  : function(combo, e, eOpts) {
                        Ext.tip.QuickTipManager.unregister(combo.getId());
                        combo.clearListeners();
                    }
                    ,keypress       : function(combo, e, eOpts) {
                        var keyCode = e.getKey();
                        switch(keyCode) {
                            case e.HOME:    //move insertion point to far left
                                combo.selectText(0,0);
                                e.stopEvent();
                                break;
                            case e.END:     //move insertion point to the end
                                var L = String(combo.getRawValue()).length;
                                combo.selectText(L,L);
                                e.stopEvent();
                                break;
                            default:
                                break;
                        }
                    }
                }
            };
        }
        return {
            xtype       : "cp4_displayfield"
            ,fieldLabel : table_name_label
            ,id         : "table_name_entry"
            ,name       : "table_name"
            ,labelWidth : form_labelWidth
            ,width      : form_width
            ,height     : 22
        };
    }
    ,get_dest_cmp               : function(TYPE, form_width, form_labelWidth) {
        if(Ext.getCmp("pbr_static_dest_set")) {
            Ext.getCmp("pbr_static_dest_set").destroy();
        }
        if(Ext.getCmp("pbr_static_net_entry")) {
            Ext.getCmp("pbr_static_net_entry").destroy();
        }
        if(Ext.getCmp("pbr_static_mask_entry")) {
            Ext.getCmp("pbr_static_mask_entry").destroy();
        }
        if(TYPE == "add") {
            return {
                xtype       : "cp4_formpanel"
                ,id         : "pbr_static_dest_set"
                ,width      : form_width
                ,autoScroll : false
                ,margin     : 0
                ,items      : [
                    {
                        xtype       : "cp4_checkbox"
                        ,fieldLabel : "Default Route"
                        ,id         : "dest_default_entry"
                        ,labelWidth : form_labelWidth
                        ,width      : form_width
                        ,height     : 22
                        ,value      : false
                        ,listeners  : {
                            change      : function(box, newVal, oldVal, eOpts) {
                                var n = Ext.getCmp("pbr_static_dest_ipv4notation");
                                if(n) {
                                    n.setDisabled(newVal);
                                    n.setVisible(!newVal);
                                    if(n.validate) { n.validate(); }
                                    if(newVal && n.clearInvalid) {
                                        n.clearInvalid();
                                    }
                                }
                            }
                        }
                    },{
                        xtype           : "cp4_ipv4notation"
                        ,id             : "pbr_static_dest_ipv4notation"
                        ,ipId           : "pbr_static_net_entry"
                        ,ipLabel        : "Destination"
                        ,notationId     : "pbr_static_mask_entry"
                        //,notationLabel  : ""
                        ,allowBlank     : false
                        ,fieldConfig    : {
                            allowBlank      : false
                        }
                        ,networkMode    : true
                        ,listeners      : {
                            beforerender    : function() {
                                var p = Ext.getCmp("pbr_static_dest_ipv4notation");
                                var n = Ext.getCmp("pbr_static_net_entry");
                                var m = Ext.getCmp("pbr_static_mask_entry");
                                if(p && n && m) {
                                    if(CP.global.formatNotation == "Dotted") {
                                        p.width         = 275;
                                        n.width         = 275;
                                        n.labelWidth    = 140;
                                        m.width         = 275;
                                        m.labelWidth    = 140;
                                    } else {
                                        p.width         = 310;
                                        n.width         = 113;
                                        n.labelWidth    = 0;
                                        m.width         = 25;
                                        m.labelWidth    = 0;
                                    }
                                }
                            }
                            ,beforedestroy  : function(p, eOpts) {
                                p.events.beforerender.clearListeners();
                            }
                        }
                    }
                ]
            };
        }
        return {
            xtype       : "cp4_formpanel"
            ,id         : "pbr_static_dest_set"
            ,width      : form_width
            ,autoScroll : false
            ,margin     : 0
            ,items      : [
                {
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "Destination"
                    ,id         : "dest_display"
                    ,labelWidth : form_labelWidth
                    ,width      : form_width
                    ,height     : 22
                },{
                    xtype       : "cp4_displayfield"
                    ,hideLabel  : true
                    ,hidden     : true
                    ,id         : "pbr_static_net_entry"
                    ,name       : "netaddress"
                    ,width      : form_width
                },{
                    xtype       : "cp4_displayfield"
                    ,hideLabel  : true
                    ,hidden     : true
                    ,id         : "pbr_static_mask_entry"
                    ,name       : "masklen"
                    ,width      : form_width
                }
            ]
        };
    }
    ,get_dest_value             : function() {
        //returns an array
        if( !(Ext.getCmp("pbr_static_dest_set")) ) { return ["",""]; }
        if(Ext.getCmp("dest_default_entry")) {
            if(Ext.getCmp("dest_default_entry").getValue()) {
                return ["default",""];
            }
        }
        var m = (Ext.getCmp("pbr_static_mask_entry").getMaskLength)
            ? Ext.getCmp("pbr_static_mask_entry").getMaskLength()
            : Ext.getCmp("pbr_static_mask_entry").getValue();
        if(Ext.getCmp("pbr_static_net_entry").getMaskLength) {
            if(Ext.getCmp("pbr_static_net_entry").getMaskLength() > m) {
                return ["",""];
            }
        }
        return [
            String(Ext.getCmp("pbr_static_net_entry").getValue()).toLowerCase()
            ,m
        ];
    }
//open window
    ,open_pbr_static_window     : function(TYPE) {
        var form_width  = 440;
        var form_labelWidth = 140;
        var table_cmp   = CP.PBR_static.get_table_cmp(TYPE, form_width, form_labelWidth);
        var dest_cmp    = CP.PBR_static.get_dest_cmp(TYPE, form_width, form_labelWidth);
        var TITLE       = (TYPE == "add")
            ? "Add Policy Table with Static Route"
            : TYPE;

        var qtipFunc = function(col, eOpts) {
            if(col.qtipText) {
                Ext.tip.QuickTipManager.register({
                    target          : col.getId()
                    ,text           : col.qtipText
                    ,dismissDelay   : 0
                });
            }
        };

        var gw_set = {
            xtype       : "cp4_formpanel"
            ,id         : "gw_set"
            ,width      : form_width
            ,autoScroll : false
            ,margin     : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Add Gateway"
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "pbr_gw_btnsbar"
                    ,items      : [
                        {
                            text                : "Add Gateway"
                            ,id                 : "pbr_gw_add_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,menu               : {
                                style               : {overflow: "visible"}
                                ,xtype              : "menu"
                                ,plain              : true
                                ,items              : [
                                    {
                                        text    : "IP Address"
                                        ,iconCls: "element"
                                        ,handler: function(b, e) {
                                            CP.PBR_static.open_gw_window("address", 0);
                                        }
                                    },{
                                        text    : "Network Interfaces"
                                        ,iconCls: "element"
                                        ,handler: function(b, e) {
                                            CP.PBR_static.open_gw_window("lname", 0);
                                        }
                                    }
                                ]
                            }
                        },{
                            xtype               : "cp4_button"
                            ,text               : "Edit"
                            ,id                 : "pbr_gw_edit_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function() {
                                var sm = Ext.getCmp("pbr_static_gw_grid").getSelectionModel();
                                if(sm.getCount() == 1) {
                                    var rec = sm.getLastSelected();
                                    CP.PBR_static.open_gw_window( String(rec.data.gw_type).toUpperCase(), rec );
                                }
                            }
                            ,disabledConditions : function() {
                                var g = Ext.getCmp("pbr_static_gw_grid");
                                return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                            }
                        },{
                            xtype               : "cp4_button"
                            ,text               : "Delete"
                            ,id                 : "pbr_gw_delete_btn"
                            ,disabled           : true
                            ,overrideNoToken    : false
                            ,handler2           : function(b) {
                                var sm = Ext.getCmp("pbr_static_gw_grid").getSelectionModel();
                                var i;
                                if(sm.getCount() > 0) {
                                    var recs = sm.getSelection();
                                    for(i = 0; i < recs.length; i++) {
                                        b.delete_gw(recs[i]);
                                    }
                                }
                                var gw_c = Ext.getCmp("option_entry");
                                if(gw_c && gw_c.validate) {
                                    gw_c.validate();
                                }
                            }
                            ,delete_gw          : function(rec) {
                                var params  = CP.ar_util.getParams();
                                if(Ext.getCmp("table_name_entry").getXType() == "cp4_displayfield") {
                                    var t_name  = Ext.getCmp("table_name_entry").getValue();
                                    var dest_v  = CP.PBR_static.get_dest_value();
                                    if(dest_v[0] == "") { return; }
                                    var net     = dest_v[0];
                                    var mask    = dest_v[1];
                                    var prefix  = CP.PBR_static.get_table_prefix(t_name);
                                    if(prefix == "") { return; }
                                    if(net == "default") {
                                        prefix += ":static:"+ net +":gateway:"+ rec.data.gw_type +":"+ rec.data.gw;
                                    } else {
                                        prefix += ":static:network:"+ net +":masklen:"+ mask +":gateway:"+ rec.data.gw_type +":"+ rec.data.gw;
                                    }
                                    params[prefix]                  = "";
                                    params[prefix +":preference"]   = "";
                                }
                                Ext.getStore("pbr_static_gw_store").remove(rec);
                            }
                            ,disabledConditions : function() {
                                var g = Ext.getCmp("pbr_static_gw_grid");
                                return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                            }
                        }
                    ]
                },{
                    xtype               : "cp4_grid"
                    ,id                 : "pbr_static_gw_grid"
                    ,width              : 200
                    //,width              : form_width
                    //,height             : 250
                    ,height             : 149
                    ,forceFit           : true
                    ,autoScroll         : true
                    ,margin             : 0
                    ,store              : "pbr_static_gw_store"
                    ,columns            : [
                        {
                            text            : "Gateway"
                            ,dataIndex      : "gw"
                            ,width          : 125
                            ,menuDisabled   : true
                            ,renderer       : function(value, meta, rec, row, col, st, view) {
                                if(rec.data.gw_type == "lname") {
                                    return CP.intf_state.renderer_output(
                                        value
                                        ,""
                                        ,"left"
                                        ,"black"
                                        ,value
                                        ,"ipv4"
                                        ,CP.ar_util.INSTANCE()
                                    );
                                }
                                return CP.ar_util.rendererSpecific(value, value, "left", "black");
                            }
                            ,qtipText       : "Gateway"
                            ,listeners      : {
                                afterrender     : qtipFunc
                            }
                        },{
                            text            : "Priority"
                            ,dataIndex      : "preference"
                            ,width          : 70
                            ,menuDisabled   : true
                            ,renderer       : function(value, meta, rec, row, col, st, view) {
                                return CP.ar_util.rendererSpecific(value, value, "center", "black");
                            }
                            ,qtipText       : "Priority"
                            ,listeners      : {
                                afterrender     : qtipFunc
                            }
                        }
                    ]
                    ,selModel           : Ext.create("Ext.selection.RowModel", {
                        mode            : "MULTI"
                        ,allowDeselect  : true
                        ,listeners      : {
                            selectionchange : function() {
                                CP.ar_util.checkBtnsbar("pbr_gw_btnsbar");
                            }
                        }
                    })
                    ,draggable          : false
                    ,enableColumnMove   : false
                    ,enableColumnResize : true
                    ,listeners          : {
                        itemdblclick        : function() {
                            var b = Ext.getCmp("pbr_gw_edit_btn");
                            if (b && b.handler) { b.handler(b); }
                        }
                    }
                }
            ]
        };

        var pbr_static_form = {
            xtype       : "cp4_formpanel"
            ,id         : "pbr_static_form"
            ,width      : form_width + 33
            ,height     : 520    // height of "Add Policy Table..." popup window
            ,margin     : 0
            ,autoScroll : true
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    if(Ext.getCmp("dest_display")) {
                        var sm  = Ext.getCmp("pbr_static_dest_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        p.loadRecord(rec);
                        if(String(rec.data.netaddress).toLowerCase() == "default") {
                            Ext.getCmp("dest_display").setValue("Default");
                        } else {
                            Ext.getCmp("dest_display").setValue(
                                rec.data.netaddress +"/"+ rec.data.masklen
                            );
                        }
                        Ext.getStore("pbr_static_gw_store").loadData(rec.data.gw_listdict);
                    } else if(Ext.getCmp("dest_default_entry")) {
                        Ext.getCmp("dest_default_entry").setValue(false);
                        Ext.getStore("pbr_static_gw_store").removeAll();
                    }
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("pbr_static_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("pbr_gw_btnsbar");
                CP.ar_util.checkDisabledBtn("pbr_static_save_btn");
                CP.ar_util.checkDisabledBtn("pbr_static_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "pbr_static_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        function push_gw(params, prefix, d, del) {
                            if(!del) { del = false; }
                            var g_prefix = prefix +":"+ d.gw_type +":"+ d.gw;
                            params[g_prefix]                = (del == false) ? "t" : "";
                            params[g_prefix +":preference"] = (del == false) ? d.preference : "";
                            params[g_prefix +":mtu"]        = (del == false) ? d.mtu : "";
                            params[g_prefix +":advmss"]     = (del == false) ? d.advmss : "";
                            params[g_prefix +":rtt"]        = (del == false) ? d.rtt : "";
                            params[g_prefix +":rttvar"]     = (del == false) ? d.rttvar : "";
                            params[g_prefix +":window"]     = (del == false) ? d.window : "";
                            params[g_prefix +":cwnd"]       = (del == false) ? d.cwnd : "";
                            params[g_prefix +":initcwnd"]   = (del == false) ? d.initcwnd : "";
                            params[g_prefix +":ssthresh"]   = (del == false) ? d.ssthresh : "";
                        }

                        var params  = CP.ar_util.getParams();
                        var t_name  = Ext.getCmp("table_name_entry").getValue();
                        var d       = CP.PBR_static.get_dest_value();
                        if(d[0] == "") {
                            Ext.Msg.alert("Insufficient Mask Length.","Insufficient Mask Length.");
                            return;
                        }
                        var net     = d[0];
                        var mask    = d[1];

                        var option  = Ext.getCmp("option_entry").getValue();
                        var prefix  = CP.PBR_static.get_table_prefix(t_name);
                        if(prefix == "") {
                            return;
                        }

                        params[prefix]  = "t";
                        var n_prefix;
                        var m_prefix;
                        if(net == "default") {
                            n_prefix = prefix +":static:default";
                            m_prefix = n_prefix;
                        } else {
                            n_prefix = prefix +":static:network:"+ net;
                            m_prefix = n_prefix +":masklen:"+ mask;
                            params[n_prefix]        = "t";
                        }
                        params[m_prefix]            = "t";
                        params[m_prefix +":option"] = option;
                        var recs = Ext.getStore("pbr_static_dest_store").getRange();
                        var rec = null;
                        var i;
                        if(Ext.getCmp("table_name_entry").getXType() != "cp4_displayfield") {
                            for(i = 0; i < recs.length; i++) {
                                if(recs[i].data.table_name      == t_name
                                    && recs[i].data.netaddress  == net
                                    && recs[i].data.masklen     == mask) {
                                        rec = recs[i];
                                        break;
                                }
                            }
                        }
                        var gws = Ext.getStore("pbr_static_gw_store").getRange();
                        var gws_cnt = gws.length + (rec == null ? 0 : rec.data.gw_listdict.length);
                        switch(option) {
                            case "":
                            case "reject":
                            case "blackhole":
                                var del = !(option == "");
                                params[m_prefix +":gateway"]    = (gws_cnt > 0) ? "t" : "";
                                if(rec != null) {
                                    for(i = 0; i < rec.data.gw_listdict.length; i++) {
                                        push_gw(params, m_prefix +":gateway", rec.data.gw_listdict[i], del);
                                    }
                                }
                                for(i = 0;i < gws.length; i++) {
                                    push_gw(params, m_prefix +":gateway", gws[i].data, del);
                                }
                                break;
                            default:
                                return;
                        }

                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("pbr_static_form");
                        return !f;
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            var c_btn = Ext.getCmp("pbr_static_cancel_btn");
                            if(c_btn) {
                                c_btn.fireEvent("mouseover");
                            }
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "pbr_static_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("pbr_static_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            var n = Ext.getCmp("pbr_static_dest_ipv4notation");
                            if(n && n.validate) {
                                n.validate();
                            }
                            var t = Ext.getCmp("table_name_entry");
                            if(t && t.validate) {
                                t.validate();
                            }
                            var gw_c = Ext.getCmp("option_entry");
                            if(gw_c && gw_c.validate) {
                                gw_c.validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : form_width
                    ,margin     : "15 0 15 15"
                    ,autoScroll : false
                    ,items      : [
                        table_cmp
                        ,{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Table ID"
                            ,id             : "table_id_entry"
                            ,name           : "table_id"
                            ,value          : "Assigned By System"
                            ,labelWidth     : form_labelWidth
                            ,width          : form_width
                            ,height         : 22
                        }
                        ,dest_cmp
                        ,{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Next Hop Type"
                            ,id             : "option_entry"
                            ,name           : "option"
                            ,labelWidth     : form_labelWidth
                            ,width          : form_labelWidth + 100
                            ,mode           : "local"
                            ,editable       : true
                            ,forceSelection : true
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""            ,"Normal"]
                                                ,["blackhole"   ,"Blackhole"]
                                                ,["reject"      ,"Reject"]]
                            ,listeners      : {
                                change          : function(cb, newVal, oldVal, eOpts) {
                                    if(Ext.getCmp("option_entry")) {
                                        var v = Ext.getCmp("option_entry").getValue();
                                        var set = Ext.getCmp("gw_set");
                                        if(set) { set.setVisible(v == ""); }
                                    }
                                }
                            }
                            ,validator      : function() {
                                var gw_st = Ext.getStore("pbr_static_gw_store");
                                var msg = "Normal next hop type requires at least one gateway.";
                                var v = Ext.getCmp("option_entry").getValue();
                                if(v == "blackhole" || v == "reject") {
                                    return true;
                                }
                                if(gw_st && gw_st.getCount() > 0) {
                                    return true;
                                }
                                return msg;
                            }
                        },{
                            xtype           : "cp4_inlinemsg"
                            ,type           : "info"
                            ,text           : CP.PBR_static.NORMAL_INFO + "<br>"
                                            + CP.PBR_static.REJECT_INFO + "<br>"
                                            + CP.PBR_static.BLACKHOLE_INFO
                        }
                        ,gw_set
                    ]
                }
            ]
        };

        var pbr_static_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "pbr_static_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ pbr_static_form ]
        });
        pbr_static_window.show();
    }

    ,open_gw_window         : function(GW_TYPE, GW_REC) {
        var gw_cmp = null;
        var gw_type = String(GW_TYPE);
        var gw_labelWidth   = 150;
        var gw_width        = 305;
        var gw_data;
        var TITLE;

        if (GW_REC) {
            TITLE = "Edit Gateway ";
            gw_data = GW_REC.data;
        } else {
            TITLE = "Add Gateway ";
            gw_data = {
                "gw"            : ""
                ,"preference"   : 1
                ,"gw_type"      : GW_TYPE
                ,"mtu"          : ""
                ,"advmss"       : ""
                ,"rtt"          : ""
                ,"rttvar"       : ""
                ,"window"       : ""
                ,"cwnd"         : ""
                ,"initcwnd"     : ""
                ,"ssthresh"     : ""
            };
        }

        switch(gw_type) {
            case "ADDRESS":
            case "address":
                TITLE += "Address";
                gw_cmp = {
                    xtype           : "cp4_ipv4field"
                    ,fieldLabel     : "Gateway Address"
                    ,id             : "pbr_gw_entry"
                    ,value          : gw_data.gw
                    ,originalValue  : gw_data.gw
                    ,labelWidth     : gw_labelWidth
                    ,width          : gw_labelWidth + 135
                    ,allowBlank     : false
                    ,fieldConfig    : {
                        allowBlank      : false
                    }
                    ,listeners      : {
                        afterrender     : function(f) {
                            var v = f.originalValue;
                            f.setValue(v);
                        }
                    }
                };
                break;
            case "LNAME":
            case "lname":
                TITLE += "Interface";
                gw_cmp = {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Gateway Interface"
                    ,id             : "pbr_gw_entry"
                    ,name           : "gw"
                    ,value          : gw_data.gw
                    ,originalValue  : gw_data.gw
                    ,labelWidth     : gw_labelWidth
                    ,width          : gw_width
                    ,mode           : "local"
                    ,editable       : true
                    ,forceSelection : true
                    ,triggerAction  : "all"
                    ,store          : Ext.getStore("intf_store")
                    ,valueField     : "intf"
                    ,displayField   : "intf"
                    ,allowBlank     : false
                };
                break;
            /*
            case "ADDRESS":
            case "LNAME":
                TITLE = "Edit Gateway "+ (gw_type == "ADDRESS" ? "Address" : "Interface");
                gw_cmp = {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Gateway "+ (gw_type == "ADDRESS" ? "Address" : "Interface")
                    ,id             : "pbr_gw_entry"
                    ,name           : "gw"
                    ,labelWidth     : gw_labelWidth
                    ,width          : gw_width
                    ,height         : 22
                };
                break;
            */
            default: //shouldn't happen
                return;
        }

        var pbr_static_gw_form = {
            xtype       : "cp4_formpanel"
            ,id         : "pbr_static_gw_form"
            ,width      : gw_width + 33
            //,height     :
            ,margin     : 0
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    /*
                    if(Ext.getCmp("pbr_gw_entry").getXType() == "cp4_displayfield") {
                        var sm  = Ext.getCmp("pbr_static_gw_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        p.loadRecord(rec);
                    }
                    */
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("pbr_static_gw_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("pbr_static_gw_ok_btn");
                CP.ar_util.checkDisabledBtn("pbr_static_gw_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "pbr_static_gw_ok_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var g_val = Ext.getCmp("pbr_gw_entry").getValue();
                        var og_val = Ext.getCmp("pbr_gw_entry").originalValue;
                        var p_val = Ext.getCmp("preference_entry").getValue();

                        var advmss_val  = Ext.getCmp("advmss_entry").getRawValue();
                        var mtu_val     = Ext.getCmp("mtu_entry").getRawValue();
                        var cwnd_val    = Ext.getCmp("cwnd_entry").getRawValue();
                        var initcwnd_val= Ext.getCmp("initcwnd_entry").getRawValue();
                        var rtt_val     = Ext.getCmp("rtt_entry").getRawValue();
                        var rttvar_val  = Ext.getCmp("rttvar_entry").getRawValue();
                        var ssthresh_val= Ext.getCmp("ssthresh_entry").getRawValue();
                        var window_val  = Ext.getCmp("window_entry").getRawValue();

                        var st = Ext.getStore("pbr_static_gw_store");
                        var idx = st.findExact("gw",g_val);
                        var oidx = -1;
                        if (og_val != "") {
                            oidx = st.findExact("gw",og_val);
                        }
                        var rec = idx > -1 ? st.getAt(idx) : false;
                        var orec;

                        //cases
                        //  idx     oidx        Case
                        //  -1      -1          brand new gw, add it
                        //  -1      >           changing gw.   Delete old, add new
                        //  >       -1          adding a new gw, but it matches existing one.  edit old record
                        //  >       >           edit idx gw, matches new.  remove old, edit match.
                        //  same    >           same, edit match

                        if (oidx > -1 && og_val != g_val) {
                            orec = st.getAt(oidx);
                            Ext.getCmp("pbr_gw_delete_btn").delete_gw(orec);
                        }

                        if(idx == -1) {
                            var g_type;
                            switch(Ext.getCmp("pbr_gw_entry").getXType()) {
                                case "cp4_combobox":
                                    g_type = "lname";
                                    break;
                                case "cp4_ipv4field":
                                    g_type = "address";
                                    var m = CP.addr_list.getMatchMessage(g_val);
                                    if (m != "") {
                                        Ext.Msg.alert("Warning", m);
                                        return;
                                    }
                                    break;
                                default:
                                    return;
                            }
                            st.add({
                                gw          : g_val
                                ,gw_type    : g_type
                                ,preference : p_val
                                ,advmss     : advmss_val
                                ,mtu        : mtu_val
                                ,cwnd       : cwnd_val
                                ,initcwnd   : initcwnd_val
                                ,rtt        : rtt_val
                                ,rttvar     : rttvar_val
                                ,ssthresh   : ssthresh_val
                                ,window     : window_val
                            });
                        } else {
                            //might still be an add, but it matches an existing gateway
                            rec.data.preference = p_val;
                            rec.data.advmss     = advmss_val;
                            rec.data.mtu        = mtu_val;
                            rec.data.cwnd       = cwnd_val;
                            rec.data.initcwnd   = initcwnd_val;
                            rec.data.rtt        = rtt_val;
                            rec.data.rttvar     = rttvar_val;
                            rec.data.ssthresh   = ssthresh_val;
                            rec.data.window     = window_val;
                        }
                        st.sort();
                        var grid = Ext.getCmp("pbr_static_gw_grid");
                        if(grid) { grid.getView().refresh(); }
                        CP.ar_util.checkWindowClose("pbr_static_gw_window");
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("pbr_static_gw_form");
                        return !f;
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            var cancel_btn = Ext.getCmp("pbr_static_gw_cancel_btn");
                            if(cancel_btn) { cancel_btn.fireEvent("mouseover"); }
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "pbr_static_gw_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("pbr_static_gw_window");
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            var g = Ext.getCmp("pbr_gw_entry");
                            if(g && g.validate) { g.validate(); }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 8 15"
                    ,autoScroll : false
                    ,width      : gw_width
                    ,items      : [
                        gw_cmp
                        ,{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Priority"
                            ,id                 : "preference_entry"
                            ,name               : "preference"
                            ,value              : gw_data.preference
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_labelWidth + 65
                            ,allowBlank         : false
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 8
                            ,maxLength          : 1
                            ,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Advanced MSS"
                            ,id                 : "advmss_entry"
                            ,name               : "advmss"
                            ,value              : gw_data.advmss
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Congestion Window"
                            ,id                 : "cwnd_entry"
                            ,name               : "cwnd"
                            ,value              : gw_data.cwnd
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Initial Congestion Window"
                            ,id                 : "initcwnd_entry"
                            ,name               : "initcwnd"
                            ,value              : gw_data.initcwnd
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "MTU"
                            ,id                 : "mtu_entry"
                            ,name               : "mtu"
                            ,value              : gw_data.mtu
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "RTT"
                            ,id                 : "rtt_entry"
                            ,name               : "rtt"
                            ,value              : gw_data.rtt
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "RTT-variance"
                            ,id                 : "rttvar_entry"
                            ,name               : "rttvar"
                            ,value              : gw_data.rttvar
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Slow-Start Threshold"
                            ,id                 : "ssthresh_entry"
                            ,name               : "ssthresh"
                            ,value              : gw_data.ssthresh
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Window"
                            ,id                 : "window_entry"
                            ,name               : "window"
                            ,value              : gw_data.window
                            ,labelWidth         : gw_labelWidth
                            ,width              : gw_width
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,hidden             : true
                            ,hideLabel          : true
                            ,minValue           : 0
                            //,maxValue           : 255
                            //,maxLength          : 3
                            //,enforceMaxLength   : true
                        }
                    ]
                }
            ]
        };

        var pbr_static_gw_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "pbr_static_gw_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("pbr_static_window").getPosition();
                    win.setPosition(pos[0] + 135, pos[1] + 120);
                }
                ,beforeclose: function(win, eOpts) {
                    var gw_c = Ext.getCmp("option_entry");
                    if(gw_c && gw_c.validate) {
                        gw_c.validate();
                    }
                }
            }
            ,items      : [ pbr_static_gw_form ]
        });
        pbr_static_gw_window.show();
    }

    ,pbr_rule_port_helper_filter: function(proto) {
        var st = Ext.getStore("pbr_ports_store");
        switch (Ext.typeOf(proto)) {
            case "number":
            case "string":
                proto = String(proto);
                break;
            default:
                proto = "";
        }
        switch (proto) {
            case "6": //TCP
            case "17": //UDP
                break;
            default:
                st.clearFilter();
                return;
        }
        st.filterBy(function(rec, id) {
            var arr = String(rec.data.PROTO).split(",");
            if (Ext.Array.indexOf(arr, proto) == -1) {
                return false;
            }
            return true;
        });
    }

    ,pbr_rule_port_helper       : function(mode, val) {
        // PORT
        // PROTO that support it (empty, "6", "17", or "6,17"
        // STR
        // STR2 (STR with (PORT) at the end)
        switch (Ext.typeOf(mode)) {
            case "number":
                switch (mode) {
                    case 1: // map for renderer
                        CP.PBR_static.pbr_rule_port_helper_filter("");
                        break;
                    case 2: // validate
                        break;
                    case 3: // get value
                        break;
                    default:
                        mode = 0;
                }
                break;
            default:
                mode = 0;
        }
        if (mode == 0) {
            return;
        }
        switch (Ext.typeOf(val)) {
            case "number":
                val = String(val);
                break;
            case "string":
                break;
            default:
                val = "";
        }
        if (val == "") {
            return "";
        }

        var i, p_i, p_s, p_si;
        var st = Ext.getStore("pbr_ports_store");
        var recs = st.getRange();

        for(i = 0; i < recs.length; i++) {
            p_i = String(recs[i].data.PORT);
            p_s = recs[i].data.STR;
            p_si = recs[i].data.STR2;
            if (val == p_i ||
                String(val).toLowerCase() == String(p_s).toLowerCase() ||
                String(val).toLowerCase() == String(p_si).toLowerCase()) {

                if (mode == 1) {
                    return p_si;
                }
                if (mode == 3) {
                    return p_i;
                }
                return true;
            }
        }

        if (mode == 1) {
            return val;
        }

        //loop through valid port range of 1..65535
        for (i = 1; i <= 65535; i++) {
            if (String(i) == val) {
                switch (mode) {
                    case 3:
                        return val;
                    default:
                        return true;
                }
            }
        }
        if (mode == 3) {
            return "";
        }
        return Ext.getCmp("port_entry").qtipText;
    }

    ,get_pbr_rules              : function() {
        function delete_rule(rec) {
            var params  = CP.ar_util.getParams();
            var prefix  = CP.PBR_static.get_rule_prefix(rec.data.priority);
            if(prefix == "") {
                return 0;
            }

            params[prefix]                  = "";
            params[prefix +":table"]        = "";
            params[prefix +":prohibit"]     = "";
            params[prefix +":unreachable"]  = "";
            params[prefix +":dev"]          = "";

            var from    = rec.data.from;
            var to      = rec.data.to;

            if(to != "") {
                params[prefix +":to:"+ to]                  = "";
                params[prefix +":to:"+ to +":masklen"]      = "";
            }
            if(from != "") {
                params[prefix +":from:"+ from]              = "";
                params[prefix +":from:"+ from +":masklen"]  = "";
            }

            return 1;
        }

        //btnsbar
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "pbr_rule_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "pbr_rule_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        Ext.getCmp("pbr_rule_grid").getSelectionModel().deselectAll();
                        CP.PBR_static.open_rule_window("Add Policy Rule", null);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "pbr_rule_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("pbr_rule_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Policy: "+ rec.data.priority;
                        delete_rule(rec);
                        CP.PBR_static.open_rule_window(T, rec);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pbr_rule_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "pbr_rule_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("pbr_rule_grid").getSelectionModel();
                        CP.ar_util.clearParams();
                        var i;
                        var recs = sm.getSelection();
                        var rules_to_delete = 0;
                        for (i = 0; i < recs.length; i++) {
                            rules_to_delete += delete_rule(recs[i]);
                        }
                        if (rules_to_delete > 0) {
                            var sim_cmp = Ext.getCmp("sim_entry");
                            var rule_count = Ext.getStore("routerule_store").getRange().length;
                            if (rules_to_delete == rule_count) { // check if delete all rules
                                // disable and clear sim flag
                                if (Ext.getCmp("sxl_status").getValue() == "On") {
                                    var params = CP.ar_util.getParams();
                                    var sim_prefix = "pbrroute:sim:flag";
                                    sim_cmp.setValue(false);
                                    sim_cmp.setDisabled(true);
                                    params[sim_prefix] = "";
                                }
                            }
                            CP.ar_util.mySubmit();
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("pbr_rule_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        //grid
        var grid_cm = [
            {
                text            : "Policy Priority"
                ,dataIndex      : "priority"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Action"
                ,dataIndex      : "prohibit"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(rec.data.prohibit != "") {
                        retValue = "Prohibit";
                    } else if(rec.data.reject != "") {
                        retValue = "Reject";
                    } else if(rec.data.unreachable != "") {
                        retValue = "Unreachable";
                    } else if(rec.data.table != "") {
                        var table_id    = rec.data.table;
                        retValue = "Table "+ table_id;
                        if (rec.data.table_name != "") {
                            retValue += ": "+ rec.data.table_name;
                        }
                    } else {
                        retValue = "Main Table";
                    }

                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Interface"
                ,dataIndex      : "dev"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    return CP.intf_state.renderer_output(
                        value
                        ,""
                        ,"left"
                        ,"black"
                        ,value
                        ,"ipv4"
                        ,CP.ar_util.INSTANCE()
                    );
                }
            },{
                text            : "Source"
                ,dataIndex      : "from"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(value) {
                        retValue = value +"/"+ rec.data.fromML;
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Destination"
                ,dataIndex      : "to"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    if(value) {
                        retValue = value +"/"+ rec.data.toML;
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Service Port"
                ,dataIndex      : "port"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = CP.PBR_static.pbr_rule_port_helper(1, String(value));
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Protocol"
                ,dataIndex      : "protocol"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    switch (retValue) {
                        case "1":
                            retValue = "ICMP (1)";
                            break;
                        case "6":
                            retValue = "TCP (6)";
                            break;
                        case "17":
                            retValue = "UDP (17)";
                            break;
                        default:
                            break;
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function() {
                    CP.ar_util.checkBtnsbar("pbr_rule_btnsbar");
                }
            }
        });

        var gridHeight = 181;
        var gridWidth = 760;
        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "pbr_rule_grid"
            ,width              : gridWidth
            ,height             : gridHeight
            ,shortHeight        : gridHeight
            ,longHeight         : gridHeight * 2
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("routerule_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick    : function() {
                    var b = Ext.getCmp("pbr_rule_edit_btn");
                    if (b) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Policy Rules"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [
                    grid
                ]
            }
        ];
    }

    ,open_rule_window           : function(TITLE, REC) {
        function clean_up_component(cmpId) {
            var cmp = Ext.getCmp( cmpId );
            if(cmp) {
                cmp.destroy();
            }
        }
        clean_up_component("pbr_rule_form");
        clean_up_component("pbr_rule_window");
        clean_up_component("from_route_entry");
        clean_up_component("from_entry");
        clean_up_component("fromML_entry");
        clean_up_component("to_route_entry");
        clean_up_component("to_entry");
        clean_up_component("toML_entry");

        var isEditValue = !(REC == null);
        var priority_cmp;
        if(REC == null || CP.PBR_static.EDITABLE_RULE_PRIORITY) {
            priority_cmp = {
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Priority"
                ,id                 : "priority_entry"
                ,name               : "priority"
                ,originalValue      : ((REC && REC.data) ? REC.data.priority : -1)
                ,isEdit             : isEditValue
                ,labelWidth         : 101
                ,width              : 101 + 115
                ,style              : "margin-left:36px;"
                ,allowBlank         : false
                ,allowDecimals      : false
                ,value              : ""
                ,minValue           : CP.PBR_static.PRIORITY_MINIMUM
                ,maxValue           : CP.PBR_static.PRIORITY_MAXIMUM
                ,maxLength          : 10
                ,enforceMaxLength   : true
                ,validator          : function() {
                    var p = Ext.getCmp("priority_entry");
                    if( p.isEdit && !(p.isDirty()) ) { return true; }
                    var p_val = p.getRawValue();
                    if (p_val == "") {
                        return "";
                    } else if (p_val == "32766" || p_val == "32767") {
                        return "Priority " + p_val + " is reserved.";
                    }
                    var rule_st = Ext.getStore("routerule_store");
                    if(rule_st.findExact("priority", parseInt(p_val, 10) ) != -1) {
                        return "This priority is already in use.";
                    }
                    return true;
                }
            };
        } else {
            priority_cmp = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Priority"
                ,id             : "priority_entry"
                ,name           : "priority"
                ,originalValue  : ((REC && REC.data) ? REC.data.priority : -1)
                ,isEdit         : isEditValue
                ,labelWidth     : 101
                ,width          : 101 + 115
                ,style          : "margin-left:36px;"
                ,height         : 22
            };
        }

        function handle_radio_change() {
            var table_radio = Ext.getCmp("table_radio").getValue();
            var default_radio = Ext.getCmp("default_radio").getValue();

            var table_entry = Ext.getCmp("table_entry");
            if (table_entry) {
                table_entry.setDisabled(!table_radio);
                if (table_radio) {
                    table_entry.validate();
                } else {
                    table_entry.clearInvalid();
                }
            }

            var dev_en = Ext.getCmp("dev_enable");
            var from_en = Ext.getCmp("from_enable");
            var to_en = Ext.getCmp("to_enable");
            var port_en = Ext.getCmp("port_enable");
            var protocol_en = Ext.getCmp("protocol_enable");

            // to_enable and dev_enable are only for table_radio and default_radio
            if (table_radio || default_radio) {
                dev_en.setDisabled(false);
                to_en.setDisabled(false);
            } else {
                dev_en.setDisabled(true);
                to_en.setDisabled(true);
                dev_en.setValue(false);
                to_en.setValue(false);
            }
            from_en.setDisabled(false);
            port_en.setDisabled(false);
            protocol_en.setDisabled(false);

            // the rest are always supposed to be visible/enabled
            Ext.getCmp("pbr_rule_match_set").setVisible(true);

            dev_en.fireEvent("change");
            from_en.fireEvent("change");
            to_en.fireEvent("change");
            port_en.fireEvent("change");
            protocol_en.fireEvent("change");
        }

        function handle_match_cb() {
            var v = Ext.getCmp("to_enable").getValue();
            v = Ext.getCmp("from_enable").getValue() || v;
            v = Ext.getCmp("dev_enable").getValue() || v;
            v = Ext.getCmp("port_enable").getValue() || v;
            v = Ext.getCmp("protocol_enable").getValue() || v;

            if(v) {
                Ext.getCmp("a_match_in_use").setValue("inuse");
            } else {
                Ext.getCmp("a_match_in_use").setValue("");
            }
            Ext.getCmp("a_match_in_use").validate();
        }

        function validate_rules() {
            function validate_cmp(cmpId) {
                var cmp = Ext.getCmp(cmpId);
                if(cmp && cmp.validate) {
                    cmp.validate();
                }
            }
            validate_cmp("priority_entry");
            validate_cmp("dev_entry");
            validate_cmp("table_entry");
            validate_cmp("to_route_entry");
            validate_cmp("from_route_entry");
            validate_cmp("port_entry");
            validate_cmp("protocol_entry");
        }

        var pbr_rule_form = {
            xtype       : "cp4_formpanel"
            ,id         : "pbr_rule_form"
            ,width      : 380
            ,height     : 450
            ,margin     : 0
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;

                    var p_cmp = Ext.getCmp("priority_entry");
                    if(p_cmp.isEdit) {
                        var rec = Ext.getCmp("pbr_rule_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                        p_cmp.setValue(rec.data.priority);
                        p_cmp.originalValue = p_cmp.getValue();
                        p_cmp.validate();

                        var prohibit    = rec.data.prohibit;
                        var unreachable = rec.data.unreachable;
                        var table       = rec.data.table;
                        var radio_value = "";
                        if(prohibit != "") {
                            radio_value = "prohibit";
                        } else if(unreachable != "") {
                            radio_value = "unreachable";
                        } else if(table != "") {
                            radio_value = "table";
                        } else {
                            radio_value = "table_main";
                        }
                        Ext.getCmp("prohibit_radio").setValue(radio_value);

                        Ext.getCmp("dev_enable").setValue(rec.data.dev != "");
                        Ext.getCmp("dev_entry").setValue(rec.data.dev);

                        Ext.getCmp("from_enable").setValue(rec.data.from != "");
                        Ext.getCmp("from_entry").setValue(rec.data.from);
                        Ext.getCmp("fromML_entry").setValue(rec.data.fromML);

                        Ext.getCmp("to_enable").setValue(rec.data.to != "");
                        Ext.getCmp("to_entry").setValue(rec.data.to);
                        Ext.getCmp("toML_entry").setValue(rec.data.toML);

                        Ext.getCmp("port_enable").setValue(rec.data.port != "");
                        if (rec.data.port != "") {
                            var port_value = CP.PBR_static.pbr_rule_port_helper(1, rec.data.port);
                            Ext.getCmp("port_entry").setValue(port_value);
                        } else {
                            Ext.getCmp("port_entry").setValue("");
                        }

                        Ext.getCmp("protocol_enable").setValue(rec.data.protocol != "");
                        var protocol_value = rec.data.protocol;
                        CP.PBR_static.pbr_rule_port_helper_filter(protocol_value);
                        switch (protocol_value) {
                            case 1:
                            case 6:
                            case 17:
                                Ext.getCmp("protocol_entry").setValue(protocol_value);
                                break;
                            default:
                                Ext.getCmp("protocol_entry").setRawValue(protocol_value);
                        }

                    } else {
                        p_cmp.focus();
                        Ext.getCmp("table_radio").setValue(true);
                        CP.PBR_static.pbr_rule_port_helper_filter("");
                    }
                    handle_radio_change();

                    Ext.getCmp("dev_enable").clearInvalid();
                    var f   = Ext.getCmp("from_entry");
                    var fML = Ext.getCmp("fromML_entry");
                    if(f && f.clearInvalid) { f.clearInvalid(); }
                    if(fML && fML.clearInvalid) { fML.clearInvalid(); }
                    var t   = Ext.getCmp("to_entry");
                    var tML = Ext.getCmp("toML_entry");
                    if(t && t.clearInvalid) { t.clearInvalid(); }
                    if(tML && tML.clearInvalid) { tML.clearInvalid(); }
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
                ,validitychange : function() {
                    var p = Ext.getCmp("pbr_rule_form");
                    if (p && p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("pbr_rule_save_btn");
                CP.ar_util.checkDisabledBtn("pbr_rule_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "pbr_rule_save_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var params      = CP.ar_util.getParams();

                        var priority    = Ext.getCmp("priority_entry").getRawValue();
                        var prefix      = CP.PBR_static.get_rule_prefix(priority);
                        if(prefix == "") {
                            return;
                        }

                        var table       = "";
                        var dev         =  (Ext.getCmp("dev_entry").getValue()) || "";
                        if(Ext.getCmp("dev_enable").getValue() == false) {
                            dev         = "";
                        }
                        var port        = Ext.getCmp("port_entry").getDBValue();
                        var protocol    = Ext.getCmp("protocol_entry").getDBValue();

                        var toOld       = Ext.getCmp("to_old").getValue();
                        var to          = Ext.getCmp("to_entry").getValue();
                        var toML        = Ext.getCmp("toML_entry").getMaskLength();
                        var toML_fixed  = Ext.getCmp("to_entry").getMaskLength();
                        if(to == "" || toML == "" || toML < toML_fixed || Ext.getCmp("to_enable").getValue() == false) {
                            to      = "";
                            toML    = "";
                        }

                        var fromOld     = Ext.getCmp("from_old").getValue();
                        var from        = Ext.getCmp("from_entry").getValue();
                        var fromML      = Ext.getCmp("fromML_entry").getMaskLength();
                        var fromML_fixed= Ext.getCmp("from_entry").getMaskLength();
                        if(from == "" || fromML == "" || fromML < fromML_fixed || Ext.getCmp("from_enable").getValue() == false) {
                            from    = "";
                            fromML  = "";
                        }

                        var radio_value = Ext.getCmp("table_radio").getGroupValue();
                        switch(radio_value) {
                            case "prohibit":
                            case "unreachable": table = "t";
                                break;
                            case "table":       table = Ext.getCmp("table_entry").getValue();
                                break;
                            case "table_main": table = "";
                                break;
                            default:
                                return;
                        }

                        params[prefix +":prohibit"]                         = "";
                        params[prefix +":unreachable"]                      = "";
                        params[prefix +":table"]                            = "";
                        params[prefix +":tname"]                            = "";

                        params[prefix]                                      = "t";
                        if (table != "") {
                            params[prefix +":"+ radio_value]                = table;
                        }

                        if(radio_value == "prohibit" || radio_value == "unreachable") {
                            params[prefix +":dev"]                          = "";
                        } else {
                            //only ever allowed for table
                            params[prefix +":dev"]                          = dev;
                        }
                        params[prefix +":port"]     = port;
                        params[prefix +":protocol"] = protocol;

                        //Source old
                        if(fromOld != "" && fromOld != from) {
                            params[prefix +":from:"+ fromOld]               = "";
                            params[prefix +":from:"+ fromOld +":masklen"]   = "";
                        }
                        //Source new
                        if(from != "" && fromML != "") {
                            params[prefix +":from:"+ from]                  = "t";
                            params[prefix +":from:"+ from +":masklen"]      = fromML;
                        }
                        //Destination old
                        if(toOld != "" && (toOld != to ||
                                           radio_value == "prohibit" ||
                                           radio_value == "unreachable")) {
                            params[prefix +":to:"+ toOld]                   = "";
                            params[prefix +":to:"+ toOld +":masklen"]       = "";
                        }
                        //Destination new
                        if(to != "" && toML != "" && (radio_value == "table" ||
                                                      radio_value == "table_main")) {
                            params[prefix +":to:"+ to]                      = "t";
                            params[prefix +":to:"+ to +":masklen"]          = toML;
                        }

                        // sim flag
                        var sim_cmp = Ext.getCmp("sim_entry");
                        // check if secureXL is on
                        if (Ext.getCmp("sxl_status").getValue() == "On") {
                            sim_cmp.setDisabled(false);
                        }

                        CP.PBR_static.pbr_rule_port_helper_filter("");
                        //CP.ar_util.checkWindowClose("pbr_rule_window");
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var f = CP.ar_util.checkFormValid("pbr_rule_form");
                        return !f;
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "pbr_rule_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.PBR_static.pbr_rule_port_helper_filter("");
                        CP.ar_util.checkWindowClose("pbr_rule_window");
                    }
                }
            ]
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,width  : 350
                    ,height : 458
                    ,margin : "15 0 5 15"
                    ,items  : [
                        priority_cmp
                        ,{
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Action"
                            ,style      : "margin-top:0px;"
                            ,margin     : "10 0 10 0"
                        },{
                            xtype   : "cp4_formpanel"
                            ,items  : [
                                {
                                    xtype       : "cp4_formpanel"
                                    ,layout     : "column"
                                    ,items      : [
                                        {
                                            xtype       : "cp4_radio"
                                            //,boxLabel   : "Prohibit"
                                            ,id         : "prohibit_radio"
                                            ,name       : "action_rb"
                                            ,inputValue : "prohibit"
                                            ,width      : 31
                                            ,style      : "margin-right:5px;"
                                            ,height     : 22
                                        },{
                                            xtype       : "cp4_label"
                                            ,text       : "Prohibit"
                                            ,width      : 100
                                            ,style      : "margin-top:4px;"
                                        }
                                    ]
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,layout     : "column"
                                    ,items      : [
                                        {
                                            xtype       : "cp4_radio"
                                            //,boxLabel   : "Unreachable"
                                            ,id         : "unreachable_radio"
                                            ,name       : "action_rb"
                                            ,inputValue : "unreachable"
                                            ,width      : 31
                                            ,style      : "margin-right:5px;"
                                            ,height     : 22
                                        },{
                                            xtype       : "cp4_label"
                                            ,text       : "Unreachable"
                                            ,width      : 100
                                            ,style      : "margin-top:4px;"
                                        }
                                    ]
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,width      : 350
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items      : [
                                        {
                                            xtype       : "cp4_radio"
                                            ,id         : "default_radio"
                                            ,name       : "action_rb"
                                            ,inputValue : "table_main"
                                            ,width      : 31
                                            ,style      : "margin-right:5px;"
                                            ,height     : 22
                                            ,listeners  : {
                                                change      : function(rb, newVal, oldVal, eOpts) {
                                                    handle_radio_change();
                                                }
                                            }
                                        },{
                                            xtype       : "cp4_label"
                                            ,text       : "Table:"
                                            ,width      : 108
                                            ,style      : "margin-top:4px;"
                                        },{
                                            xtype       : "cp4_label"
                                            ,text       : "Main Table"
                                            ,width      : 200
                                            ,style      : "margin-top:5px;"
                                        }
                                    ]
                                },{
                                    xtype       : "cp4_formpanel"
                                    ,width      : 350
                                    //,layout     : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items      : [
                                        {
                                            xtype       : "cp4_radio"
                                            //,boxLabel   : "Table:"
                                            ,id         : "table_radio"
                                            ,name       : "action_rb"
                                            ,inputValue : "table"
                                            ,width      : 31
                                            ,style      : "margin-right:5px;"
                                            ,height     : 22
                                            ,listeners  : {
                                                change      : function(rb, newVal, oldVal, eOpts) {
                                                    handle_radio_change();
                                                }
                                            }
                                        },{
                                            xtype       : "cp4_label"
                                            ,text       : "Table:"
                                            ,width      : 100
                                            ,style      : "margin-top:4px;"
                                        },{
                                            xtype               : "cp4_combobox"
                                            ,id                 : "table_entry"
                                            ,name               : "table"
                                            ,hideLabel          : true
                                            ,flex               : 1
                                            ,allowBlank         : false
                                            ,editable           : true
                                            ,forceSelection     : true
                                            ,queryMode          : "local"
                                            ,triggerAction      : "all"
                                            ,store              : Ext.getStore("routetable_store")
                                            ,valueField         : "table_id"
                                            ,displayField       : "table_name"
                                            ,style              : "margin-left:5px;"
                                            ,qtipText           : "Action Tables with at least one complete route."
                                            ,listeners          : {
                                                afterrender         : function(combo, eOpts) {
                                                    if(combo.qtipText) {
                                                        Ext.tip.QuickTipManager.register({
                                                            target          : combo.getId()
                                                            ,text           : combo.qtipText
                                                            ,dismissDelay   : 0
                                                        });
                                                    }
                                                }
                                                ,beforedestroy      : function(combo, eOpts) {
                                                    Ext.tip.QuickTipManager.unregister(combo.getId());
                                                    combo.events.afterrender.clearListeners();
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,id         : "pbr_rule_match_set"
                            ,items      : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Match"
                                    ,style      : "margin-top:0px;"
                                    ,margin     : "10 0 10 0"
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,width  : 350
                                    ,height : 27
                                    //,layout : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items  : [
                                        {
                                            xtype               : "cp4_checkbox"
                                            ,fieldLabel         : "Configure Interface"
                                            ,hideLabel          : true
                                            ,id                 : "dev_enable"
                                            //,labelWidth         : 125
                                            //,width              : 162
                                            ,width              : 31
                                            ,style              : "margin-right:5px;"
                                            ,height             : 22
                                            ,value              : false
                                            ,msgTarget          : "side"
                                            ,listeners          : {
                                                change              : function() {
                                                    if(!Ext.getCmp("dev_enable")) { return; }
                                                    var v = Ext.getCmp("dev_enable").getValue();
                                                    Ext.getCmp("dev_entry").setDisabled(!v);
                                                    if(v) {
                                                        Ext.getCmp("dev_entry").validate();
                                                    } else {
                                                        Ext.getCmp("dev_entry").clearInvalid();
                                                    }
                                                    handle_match_cb();
                                                    validate_rules();
                                                }
                                                ,blur               : function() {
                                                    Ext.getCmp("a_match_in_use").validate();
                                                }
                                            }
                                        },{
                                            xtype               : "cp4_combobox"
                                            ,fieldLabel         : "Interface"
                                            ,id                 : "dev_entry"
                                            ,labelWidth         : CP.PBR_static.RULES_LABELWIDTH
                                            ,flex               : 1
                                            ,value              : ""
                                            ,allowBlank         : false
                                            ,editable           : true
                                            ,forceSelection     : true
                                            ,queryMode          : "local"
                                            ,triggerAction      : "all"
                                            ,store              : Ext.getStore("intf_store")
                                            ,valueField         : "intf"
                                            ,displayField       : "intf_mask"
                                            ,qtipText           : "Inbound Interface"
                                            ,listeners          : {
                                                afterrender         : function(f, eOpts) {
                                                    if (f.qtipText) {
                                                        Ext.tip.QuickTipManager.register({
                                                            target          : f.getId()
                                                            ,text           : f.qtipText
                                                            ,dismissDelay   : 0
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,width  : 350
                                    ,height : (String(CP.global.formatNotation).toLowerCase() == "length") ? 27 : 54
                                    //,layout : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items  : [
                                        {
                                            xtype               : "cp4_checkbox"
                                            ,fieldLabel         : "Configure Source"
                                            ,hideLabel          : true
                                            ,id                 : "from_enable"
                                            //,labelWidth         : 125
                                            //,width              : 162
                                            ,width              : 31
                                            ,style              : "margin-right:5px;"
                                            ,height             : 22
                                            ,value              : false
                                            ,msgTarget          : "side"
                                            ,listeners          : {
                                                change              : function() {
                                                    if(!Ext.getCmp("from_enable")) { return; }
                                                    var v = Ext.getCmp("from_enable").getValue();
                                                    var from_e = Ext.getCmp("from_entry");
                                                    var fromML_e = Ext.getCmp("fromML_entry");
                                                    if(from_e && fromML_e) {
                                                        from_e.setDisabled(!v);
                                                        fromML_e.setDisabled(!v);
                                                        if(v) {
                                                            from_e.validate();
                                                            fromML_e.validate();
                                                        } else {
                                                            from_e.clearInvalid();
                                                            fromML_e.clearInvalid();
                                                        }
                                                    }
                                                    handle_match_cb();
                                                    validate_rules();
                                                }
                                                ,blur               : function() {
                                                    Ext.getCmp("a_match_in_use").validate();
                                                }
                                            }
                                        },{
                                            xtype           : "cp4_ipv4notation"
                                            ,ipLabel        : "Source"
                                            ,id             : "from_route_entry"
                                            ,ipId           : "from_entry"
                                            ,notationId     : "fromML_entry"
                                            ,networkMode    : true
                                            ,allowBlank     : false
                                            ,fieldConfig    : {
                                                allowBlank      : false
                                            }
                                        }
                                    ]
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,width  : 350
                                    ,height : (String(CP.global.formatNotation).toLowerCase() == "length") ? 27 : 54
                                    //,layout : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items  : [
                                        {
                                            xtype               : "cp4_checkbox"
                                            ,fieldLabel         : "Configure Destination"
                                            ,hideLabel          : true
                                            ,id                 : "to_enable"
                                            //,labelWidth         : 125
                                            //,width              : 162
                                            ,width              : 31
                                            ,style              : "margin-right:5px;"
                                            ,height             : 22
                                            ,value              : false
                                            ,msgTarget          : "side"
                                            ,listeners          : {
                                                change              : function() {
                                                    if(!Ext.getCmp("to_enable")) { return; }
                                                    var v = Ext.getCmp("to_enable").getValue();
                                                    Ext.getCmp("to_entry").setDisabled(!v);
                                                    Ext.getCmp("toML_entry").setDisabled(!v);
                                                    if(v) {
                                                        Ext.getCmp("to_entry").validate();
                                                        Ext.getCmp("toML_entry").validate();
                                                    } else {
                                                        Ext.getCmp("to_entry").clearInvalid();
                                                        Ext.getCmp("toML_entry").clearInvalid();
                                                    }
                                                    handle_match_cb();
                                                    validate_rules();
                                                }
                                                ,blur               : function() {
                                                    Ext.getCmp("a_match_in_use").validate();
                                                }
                                            }
                                        },{
                                            xtype           : "cp4_ipv4notation"
                                            ,ipLabel        : "Destination"
                                            ,id             : "to_route_entry"
                                            ,ipId           : "to_entry"
                                            ,notationId     : "toML_entry"
                                            ,networkMode    : true
                                            ,allowBlank     : false
                                            ,fieldConfig    : {
                                                allowBlank      : false
                                            }
                                        }
                                    ]
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,width  : 350
                                    ,height : 27
                                    //,layout : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items  : [
                                        {
                                            xtype               : "cp4_checkbox"
                                            ,fieldLabel         : "Configure Port"
                                            ,hideLabel          : true
                                            ,id                 : "port_enable"
                                            //,labelWidth         : 125
                                            //,width              : 162
                                            ,width              : 31
                                            ,style              : "margin-right:5px;"
                                            ,height             : 22
                                            ,value              : false
                                            ,msgTarget          : "side"
                                            ,listeners          : {
                                                change              : function() {
                                                    if(!Ext.getCmp("to_enable")) { return; }
                                                    var v = Ext.getCmp("port_enable").getValue();
                                                    Ext.getCmp("port_entry").setDisabled(!v);
                                                    if(v) {
                                                        Ext.getCmp("port_entry").validate();
                                                    } else {
                                                        Ext.getCmp("port_entry").clearInvalid();
                                                    }
                                                    handle_match_cb();
                                                    validate_rules();
                                                }
                                                ,blur               : function() {
                                                    Ext.getCmp("a_match_in_use").validate();
                                                }
                                            }
                                        },{
                                            xtype               : "cp4_combobox"
                                            ,fieldLabel         : "Service Port"
                                            ,id                 : "port_entry"
                                            ,name               : "port"
                                            ,labelWidth         : CP.PBR_static.RULES_LABELWIDTH
                                            ,flex               : 1
                                            ,queryMode          : "local"
                                            ,mode               : "local"
                                            ,lastQuery          : ""
                                            ,editable           : true
                                            ,forceSelection     : false
                                            ,triggerAction      : "all"
                                            ,allowBlank         : false
                                            ,store              : Ext.getStore("pbr_ports_store")
                                            ,valueField         : "PORT"
                                            ,displayField       : "STR2"
                                            ,qtipText           : "Port must be selected from the pull down menu or an integer in the range of 1..65535."
                                            ,qtipText2          : "List filtered by protocol selection."
                                            ,listeners          : {
                                                afterrender         : function(f, eOpts) {
                                                    if (f.qtipText) {
                                                        Ext.tip.QuickTipManager.register({
                                                            target          : f.getId()
                                                            ,text           : f.qtipText +"<br>"+ f.qtipText2
                                                            ,dismissDelay   : 0
                                                        });
                                                    }
                                                }
                                            }
                                            ,getDBValue         : function() {
                                                if ( !(Ext.getCmp("port_enable").getValue()) ) {
                                                    return "";
                                                }
                                                var v = CP.PBR_static.pbr_rule_port_helper(3, this.getRawValue());
                                                return v;
                                            }
                                            ,validator          : function(v) {
                                                return CP.PBR_static.pbr_rule_port_helper(2, v);
                                            }
                                        }
                                    ]
                                },{
                                    xtype   : "cp4_formpanel"
                                    ,width  : 350
                                    ,height : 27
                                    //,layout : "column"
                                    ,layout     : {
                                        type        : "hbox"
                                    }
                                    ,items  : [
                                        {
                                            xtype               : "cp4_checkbox"
                                            ,fieldLabel         : "Configure Protocol"
                                            ,hideLabel          : true
                                            ,id                 : "protocol_enable"
                                            //,labelWidth         : 125
                                            //,width              : 162
                                            ,width              : 31
                                            ,style              : "margin-right:5px;"
                                            ,height             : 22
                                            ,value              : false
                                            ,msgTarget          : "side"
                                            ,listeners          : {
                                                change              : function() {
                                                    if(!Ext.getCmp("to_enable")) { return; }
                                                    var v = Ext.getCmp("protocol_enable").getValue();
                                                    Ext.getCmp("protocol_entry").setDisabled(!v);
                                                    if(v) {
                                                        Ext.getCmp("protocol_entry").validate();
                                                        CP.PBR_static.pbr_rule_port_helper_filter(
                                                            Ext.getCmp("protocol_entry").getDBValue()
                                                        );
                                                    } else {
                                                        Ext.getCmp("protocol_entry").clearInvalid();
                                                        CP.PBR_static.pbr_rule_port_helper_filter("");
                                                    }
                                                    handle_match_cb();
                                                    validate_rules();
                                                }
                                                ,blur               : function() {
                                                    Ext.getCmp("a_match_in_use").validate();
                                                }
                                            }
                                        },{
                                            xtype               : "cp4_combobox"
                                            ,fieldLabel         : "Protocol"
                                            ,id                 : "protocol_entry"
                                            ,name               : "protocol"
                                            ,labelWidth         : CP.PBR_static.RULES_LABELWIDTH
                                            ,flex               : 1
                                            ,queryMode          : "local"
                                            ,mode               : "local"
                                            ,editable           : true
                                            ,forceSelection     : false
                                            ,triggerAction      : "all"
                                            ,store              :   [["1"   ,"ICMP (1)"]
                                                                    ,["6"   ,"TCP (6)"]
                                                                    ,["17"  ,"UDP (17)"]]
                                            ,qtipText           : "Protocol must be ICMP, TCP, UDP, or an integer value in the range of 1..255."
                                            ,listeners          : {
                                                afterrender         : function(f, eOpts) {
                                                    if (f.qtipText) {
                                                        Ext.tip.QuickTipManager.register({
                                                            target          : f.getId()
                                                            ,text           : f.qtipText
                                                            ,dismissDelay   : 0
                                                        });
                                                    }
                                                }
                                                ,change             : function(cb, newValue, oldValue, eOpts) {
                                                    CP.PBR_static.pbr_rule_port_helper_filter(cb.getDBValue());
                                                }
                                            }
                                            ,getDBValue         : function() {
                                                if ( !(Ext.getCmp("protocol_enable").getValue()) ) {
                                                    return "";
                                                }
                                                var v = String(this.getValue()).toLowerCase();
                                                switch (v) {
                                                    case "icmp":
                                                    case "icmp (1)":
                                                        return "1";
                                                    case "tcp":
                                                    case "tcp (6)":
                                                        return "6";
                                                    case "udp":
                                                    case "udp (17)":
                                                        return "17";
                                                    default:
                                                        break;
                                                }
                                                return v;
                                            }
                                            ,validator          : function(v) {
                                                var errMessage = this.qtipText;
                                                if (v == "") {
                                                    return errMessage;
                                                }
                                                v = String(v).toLowerCase();
                                                switch (v) {
                                                    case "icmp":
                                                    case "icmp (1)":
                                                    case "tcp":
                                                    case "tcp (6)":
                                                    case "udp":
                                                    case "udp (17)":
                                                        return true;
                                                    default:
                                                        break;
                                                }
                                                if (v != String(parseInt(v, 10)) ) {
                                                    return errMessage;
                                                }
                                                v = parseInt(v, 10);
                                                if (v < 1 || 255 < v) {
                                                    return errMessage;
                                                }
                                                return true;
                                            }
                                        }
                                    ]
                                },{
                                    xtype           : "cp4_displayfield"
                                    ,fieldLabel     : "to_old"
                                    ,id             : "to_old"
                                    ,name           : "to"
                                    ,hideLabel      : true
                                    ,hidden         : true
                                },{
                                    xtype           : "cp4_displayfield"
                                    ,fieldLabel     : "from_old"
                                    ,id             : "from_old"
                                    ,name           : "from"
                                    ,hideLabel      : true
                                    ,hidden         : true
                                },{
                                    xtype           : "cp4_textfield"
                                    ,fieldLabel     : "checkbox_test"
                                    ,id             : "a_match_in_use"
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,value          : ""
                                    ,allowBlank     : false
                                    ,hideLabel      : true
                                    ,hidden         : true
                                    ,validator      : function() {
                                        var v = Ext.getCmp("a_match_in_use").getValue();
                                        var msg = "At least one match feature must be used.";
                                        var enable_list =   ["to_enable"
                                                            ,"from_enable"
                                                            ,"dev_enable"
                                                            ,"port_enable"
                                                            ,"protocol_enable"];
                                        var i, c;
                                        for (i = 0; i < enable_list.length; i++) {
                                            c = Ext.getCmp(enable_list[i]);
                                            if (c) {
                                                if (v != "" || c.isDisabled()) {
                                                    c.clearInvalid();
                                                } else {
                                                    c.markInvalid(msg);
                                                }
                                            }
                                        }
                                        return (v != "");
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        var pbr_rule_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "pbr_rule_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ pbr_rule_form ]
        });
        pbr_rule_window.show();
    } //open_rule_window

    ,get_advanced_options_set   : function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Advanced Options"
            },{
                xtype       : "cp4_formpanel"
                ,layout     : "column"
                ,margin     : 0
                ,padding    : 0
                ,items  : [
                    {
                       xtype       : "cp4_checkbox"
                       ,fieldLabel : "PBR Route Lookup"
                       ,id         : "sim_entry"
                       ,name       : "sim_flag"
                       ,labelWidth : 100
                       ,width      : 100
                       ,value      : false
                       ,disabled   : true
                       ,qtipText   : "Force PBR route lookup"
                       ,width      : 150
                       ,listeners  : {
                           afterrender      : function(cb, eOpt) {
                                if (cb.qtipText && cb.qtipText.length > 0) {
                                   Ext.tip.QuickTipManager.register({
                                       target          : cb.getId()
                                       ,text           : cb.qtipText
                                       ,dismissDelay   : 0
                                   });
                                }
                           }
                       }
                    },{
                        xtype       : "cp4_inlinemsg"
                        ,id         : "sim_entry_info"
                        ,type       : "info"
                        ,text       : "Set PBR rule to intentionally cause same packets to traverse the gateway more than once. SecureXL must be on and at least one rule must be created to enable this field."
                        ,width      : 350
                        ,margin     : "0 24 0 0"
                        ,disable    : function() { }
                   }
                ]
	        },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "SecureXL Status"
                ,id         : "sxl_status"
                ,labelWidth : 100
                ,width      : 300
                ,value      : ""
                ,listeners  : {
                    enable      : function(box, eOpts) {
                        var rule_count = Ext.getStore("routerule_store").getRange().length;
                        if (rule_count == 0 || Ext.getCmp("sxl_status").getValue() != "On") {
                            Ext.getCmp("sim_entry").setDisabled(true);
                        } else {
                            if (CP.global.token > -1) {
                                Ext.getCmp("sim_entry").setDisabled(false);
                            }
                        }
                    }
                }
            },{
                xtype               : "cp4_button"
                ,text               : "Apply"
                ,id                 : "pbr_apply_adv_option_btn"
                ,qtipText           : "Apply options"
                ,overrideNoToken    : false
                ,handler2           : function(b, e) {
                    CP.PBR_static.getSecureXL();
                }
            }
        ];
    } //get_advanced_options_set
}
