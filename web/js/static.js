CP.static_4 = {
    GRID_PAGE_SIZE  : 25
    ,NORMAL_INFO    : "<b>Normal:</b> Accept and forward packets."
    ,REJECT_INFO    : "<b>Reject:</b> Drop packets, and send <i>unreachable</i> messages."
    ,BLACKHOLE_INFO : "<b>Black Hole:</b> Drop packets, but don't send <i>unreachable</i> messages."

    ,QuickAddInfo   : "Batch Mode can be used to configure multiple static routes in a single step."
        + "<br>Usage:<br>"
        + "&lt;Destination Network&gt;/&lt;Mask Length&gt; &lt;Next Hop Address&gt; [ \"comment\" ]<br>"
        + "Comment is optional, but must be at the end of the line and within double-quotes.<br>"
        + "For default route use \'default\' as Destination Network.<br>"
        + "e.g.:<br>"
        + "10.1.1.0/24 192.168.1.1<br>"
        + "default 192.168.1.1<br>"
        + "10.1.1.0/24 192.168.1.1 \"this is a comment\""

    ,validMainPanel     : function() {
        var f = Ext.getCmp("static_configPanel");
        return (f ? f.getForm().isValid() : false);
    }
    ,check_user_action  : function() {
        CP.ar_util.checkBtnsbar("dest_btnsbar");
        CP.ar_util.checkDisabledBtn("apply_adv_option_btn");
        CP.ar_util.checkBtnsbar("batch_btnsbar");
        CP.ar_util.checkBtnsbar("dest_form");
        CP.ar_util.checkBtnsbar("gw_form");
    }

    ,init                           : function() {
        CP.static_4.defineStores();
        var static_configPanel = CP.static_4.configPanel();
        var obj = {
            title           : "Static Routes"
            ,panel          : static_configPanel
            ,submitURL      : "/cgi-bin/static-route.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("dest_window");
                CP.ar_util.checkWindowClose("batch_window");
                CP.static_4.doLoad();
            }
            ,submitFailure  : function() {
                CP.static_4.doLoad();
            }
            ,checkCmpState  : CP.static_4.check_user_action
            ,helpFile       : 'staticHelp.html'
            ,cluster_feature_name: 'static'
        };

        CP.UI.updateDataPanel(obj, null, true);
    }

//common ColumnModel functions
    ,genericRenderer                : function(value, meta, rec, row, col, st, view) {
        return CP.ar_util.rendererSpecific(value, value, "left", "black");
    }

//defineStores
    ,defineStores                   : function() {
        if ( CP && CP.intf_state && CP.intf_state.defineStore ) {
            var grids_to_refresh_list = ["dest_grid"];
            CP.intf_state.defineStore( CP.ar_util.INSTANCE(), grids_to_refresh_list );
        }
        if (CP && CP.addr_list && CP.addr_list.initStore) {
            CP.addr_list.initStore("static");
        }

        function sort_ipv4address(value) {
            if (value == "default") {
                return 0;
            }
            var gw_p = value.split(".");
            var retval = 0;
            var i;
            for(i = 0; i < gw_p.length ; i++) {
                retval = parseInt(retval, 10) * 1000 + parseInt(gw_p[i], 10);
            }
            return retval;
        }

        var dest_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "static_dest_store"
            ,autoLoad   : true
            ,fields     : [
                {
                    name        : 'route'
                    ,sortType   : sort_ipv4address
                }
                ,{name: 'mask'}
                ,{name: 'option'}
                ,"precedence"
                ,"ping"
                ,"scopelocal"
				,{
					name: 'agw', sortType: function(value) {
						if (value.length == 0) {
							return "aaa"; // we want "none" entries to appear first
						}
						return sort_gw(value[0].gw); // sorting by the first element (if more than one exists)
					}
				}
                ,{name: 'comment'}
                ,{name: 'delete'}
            ]
            ,pageSize   : CP.static_4.GRID_PAGE_SIZE
            ,clearOnPageLoad    : true
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/static-route.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "sroutes"
                }
                ,reader         : {
                    type            : "json"
                    ,root           : "data.sroutes"
                    ,totalProperty  : "data.sroute_list_length"
                }
            }
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    var sort_gw_func = function(a, b){
                        //return -1 for a < b
                        //return 1 for a > b
                        if ( a.pref - b.pref ) {
                            return (a.pref - b.pref);
                        }
                        var aG = sort_gw(a.gw);
                        var bG = sort_gw(b.gw);
                        return (aG < bG) ? -1 : 1;
                    };

                    /*
                    if ( st.findExact("route","default") == -1 ) {
                        st.add({
                            'route'     : "default"
                            ,'mask'     : ""
                            ,'option'   : ""
                            ,'comment'  : ""
                            ,'agw'      : []
                        });
                    }
                    */
                    var r = st.getRange();
                    var i;
                    for(i = 0; i < r.length; i++) {
                        Ext.Array.sort(r[i].data.agw, sort_gw_func);
                    }
                    var g = Ext.getCmp("dest_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
            //,sorters    : [{property: "route", direction: "ASC"}]
        });

        function gw_store_has_logical_gw(st) {
            var recs = st.getRange();
            var i;
		if (!recs.length) {
		    return true;
		}
            for(i = 0; i < recs.length; i++) {
                switch( String(recs[i].data.type).toLowerCase() ) {
                    case "lname":
                    case "l":
                        return true;
                    default:
                }
            }
            return false;
        }
        function handle_ping(st) {
            var hasLogicalGW = gw_store_has_logical_gw(st);
            var ping_cmp = Ext.getCmp("ping_entry");
            if (ping_cmp) {
                ping_cmp.setDisabled(hasLogicalGW);
                if (hasLogicalGW) {
                    ping_cmp.setValue(false);
                }
            }
        }
        function sort_gw(value) {
            if (value == "loopback" || value == "lo") {
                return "z4294967296";
            }
            if (value.indexOf(".") == -1) {
                return value;
            }
            return "z"+String(sort_ipv4address(value));
        }
        Ext.create("CP.WebUI4.Store", {
            storeId     : "gw_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "gw"
                    ,sortType   : sort_gw
                }
                ,{name  : "pref"}
                ,{name  : "type"}
                ,{name  : "dirty"} //for gateways that don't have a specified pref from the tcl
                ,{name  : "newrec"}
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,sorters    : [
                {property: "pref", direction: "ASC"}
                ,{property: "gw", direction: "ASC"}
            ]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    handle_ping(st);
                }
                ,add        : function(st, recs, idx, eOpts) {
                    handle_ping(st);
                }
                ,remove     : function(st, rec, idx, eOpts) {
                    handle_ping(st);
                }
            }
        });

        var intf_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "intf_store"
            ,autoLoad   : true
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(value) {
                        if (value == "loopback" || value == "lo") {
                            return "zzz"+value;
                        }
                        return value;
                    }
                }
                ,{name  : "addr4_list"}
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
            ,sorters    :   [{property: "intf", direction: "ASC"}]
            ,listeners  : {
                load        : function(st, recs, s, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });
    }

//primary panel
    ,configPanel                    : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "static_configPanel"
            ,listeners  : {
                afterrender     : CP.static_4.doLoad
                ,validitychange : function(basic, valid, eOpts) {
                    CP.static_4.check_user_action();
                }
            }
            ,items      : [
                //CP.ar_one_liners.get_one_liner("static_routes"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IPv4 Static Routes"
                }
                ,CP.static_4.get_destination_grid_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Advanced Options"
                }
                ,CP.static_4.get_advanced_options_set()
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Batch Mode"
                }
                ,CP.static_4.get_batch_add_set()
            ]
        });
        return configPanel;
    }

    ,doLoad                         : function() {
        function loadStoreFunc(storeId, loadObj, pushId) {
            var st = Ext.getStore(storeId);
            if (st) {
                if (pushId) {
                    CP.ar_util.loadListPush(storeId);
                }
                st.load(loadObj);
            }
        }
        function loadStorePageFunc(storeId, loadObj, pushId) {
            var st = Ext.getStore(storeId);
            if (st) {
                if (pushId) {
                    CP.ar_util.loadListPush(storeId);
                }
                st.loadPage(st.currentPage);
            }
        }

        CP.ar_util.clearParams();

        var instance_string = CP.ar_util.INSTANCE();
        if (CP && CP.intf_state && CP.intf_state.load) {
            CP.intf_state.load( instance_string );
        }
        if (CP && CP.addr_list && CP.addr_list.loadStore) {
            CP.addr_list.loadStore("static");
        }

        var loadObj = { params: { "instance": instance_string } };
        loadStoreFunc("intf_store", loadObj, true);
        loadStorePageFunc("static_dest_store", loadObj, true);
        loadStoreFunc("sroute_mon_st", loadObj, false);

        if (Ext.getStore("gw_store")) {
            Ext.getStore("gw_store").removeAll();
        }

        var p = Ext.getCmp("static_configPanel");
        if (p) {
            p.form._boundItems = null;
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/static-route.tcl?instance=" + instance_string +"&option=global"
                ,method     :"GET"
                ,success    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
                ,failure    : function() {
                    CP.ar_util.loadListPop("doLoad");
                }
            });
        }
        CP.ar_util.loadListPop("mySubmit");
    }

    ,delete_dest        : function(rec) {
        var prefix  = "routed:instance:" + CP.ar_util.INSTANCE() + ":static";
        var params  = CP.ar_util.getParams();

        var route   = rec.data.route;
        var mask    = rec.data.mask;

        var net_prefix;
        var mask_prefix;
        var gw_prefix;
        var midfix;

        if (rec.data.route == "default") {
            net_prefix = prefix + ":default";
            mask_prefix = net_prefix;
        } else {
            net_prefix = prefix + ":network:" + route;
            mask_prefix = net_prefix + ":masklen:" + mask;
            //params[net_prefix] = "";
            params[mask_prefix] = "";
        }
        params["SPECIAL:"+ mask_prefix]     = "";
        params[mask_prefix +":option"]      = "";
        params[mask_prefix +":comment"]     = "";
        params[mask_prefix +":ping"]        = "";
        params[mask_prefix +":precedence"]  = "";
        params[mask_prefix +":scopelocal"]  = "";

        gw_prefix = mask_prefix + ":gateway";
        params[gw_prefix]   = "";

        var agw = rec.data.agw;
        var i;
        for(i = 0; i < agw.length; i++) {
            if (agw[i].type == "a") {
                midfix = "address:" + agw[i].gw;
            } else {
                midfix = "lname:" + agw[i].gw;
            }
            params[gw_prefix + ":" + midfix] = "";
            params[gw_prefix + ":" + midfix + ":preference"] = "";
        }

        var st = Ext.getStore("static_dest_store");
        if (st) {
            st.remove(rec);
            if (st.findExact("route", route, 0) == -1) {
                params[net_prefix] = "";
            }
        }
    }
    
//destination set (button bar, grid.Panel)
    ,get_destination_grid_set       : function() {
        var dest_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "dest_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "dest_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("dest_grid").getSelectionModel().deselectAll();
                        CP.static_4.open_dest_window();
                    }
                    ,disabledConditions : function() {
                        return !( CP.static_4.validMainPanel() );
                    }
                },{
                    text                : "Edit"
                    ,id                 : "dest_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.static_4.open_dest_window();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "dest_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("dest_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs.length == 1) {

                            if (recs[0].data.agw.length == 0) {
                                CP.static_4.delete_dest(recs[0]);
                                CP.ar_util.mySubmit();
                            } else {
                                var rm = String(recs[0].data.route) +"/"+ String(recs[0].data.mask);
                                if (String(recs[0].data.route).toLowerCase() == "default") {
                                    rm = "Default";
                                }

                                Ext.Msg.show({
                                    title   : "Delete " + rm + " route?"
                                    ,msg    : "Are you sure you want to delete the selected route?  "
                                            + "This may cause connectivity issues."
                                    ,animEl : "elId"
                                    ,buttons: Ext.Msg.OKCANCEL
                                    ,icon   : Ext.MessageBox.QUESTION
                                    ,fn     : function(btn, text) {
                                        if (btn == "cancel") {
                                            return;
                                        }
                                        CP.static_4.delete_dest(recs[0]);
                                        CP.ar_util.mySubmit();
                                    }
                                });
                            }

                        } else if (recs.length > 1) {

                            Ext.Msg.show({
                                title   : "Delete multiple routes?"
                                ,msg    : "Are you sure you want to delete the selected routes?  "
                                        + "This may cause connectivity issues."
                                ,animEl : "elId"
                                ,buttons: Ext.Msg.OKCANCEL
                                ,icon   : Ext.MessageBox.QUESTION
                                ,fn     : function(btn, text) {
                                    if (btn == "cancel") {
                                        return;
                                    }
                                    var i;
                                    for(i = 0; i < recs.length; i++) {
                                        CP.static_4.delete_dest(recs[i]);
                                    }
                                    CP.ar_util.mySubmit();
                                }
                            });

                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("dest_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
                /*
                ,{
                    text                : "Delete All"
                    ,id                 : "dest_delete_all_btn"
                    ,hidden             : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        Ext.Msg.show({
                            title   : "Delete all static routes?"
                            ,msg    : "Are you sure you want to delete all configured static routes?  "
                                    + "This may cause connectivity issues."
                            ,animEl : "elId"
                            ,buttons: Ext.Msg.OKCANCEL
                            ,icon   : Ext.MessageBox.QUESTION
                            ,fn     : function(btn, text) {
                                if (btn == "cancel") {
                                    return;
                                }
                                var st = Ext.getStore("static_dest_store");
                                if (st) {
                                    var recs = st.getRange();
                                    var i;
                                    for(i = 0; i < recs.length; i++) {
                                        CP.static_4.delete_dest(recs[i]);
                                    }
                                }
                                CP.ar_util.mySubmit();
                            }
                        });
                    }
                    ,disabledConditions : function() {
                        var b = this;
                        if ( !( b.isVisible() ) ) { return true; }
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var st = Ext.getStore("static_dest_store");
                        return (st ? st.getCount() > 0 : true);
                    }
                }
                // */
            ]
        };

        var dest_cm = [
            {
                header          : "Destination Address"
                ,dataIndex      : "route"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    if (value != "default") {
                        var retValue = value + "/" + rec.data.mask;
                        return CP.ar_util.rendererSpecific(retValue, retValue);
                    }
                    return CP.ar_util.rendererSpecific("Default", "Default");
                }
            },{
                header          : "Next Hop Type"
                ,dataIndex      : "option"
                ,width          : 110
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue;
                    switch(value) {
                        case "blackhole":   retValue = "Blackhole";
                            break;
                        case "reject":      retValue = "Reject";
                            break;
                        default:            retValue = "Normal";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                text            : "Rank"
                ,dataIndex      : "precedence"
                ,width          : 50
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    var color = "black";
                    if (retValue == "") {
                        retValue = 60;
                        color = "gray";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", color);
                }
            },{
                text            : "Local Scope"
                ,dataIndex      : "scopelocal"
                ,menuDisabled   : true
                ,width          : 85
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = value ? "On" : "Off";
                    if (String(rec.data.route).toLowerCase() == "default") {
                        retValue = "N/A";
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Gateways (Priority)"
                ,dataIndex      : "agw"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = "";
                    var tip = "";
                    if (value == null || rec.data.agw.length < 1) {
                        return CP.ar_util.rendererSpecific("None", "None", "left", "gray");
                    }
                    var gw_list = rec.data.agw;
                    var v = "";
                    var p = "";
                    var show_pref = true;
                    var i;
                    for(i = 0; i < gw_list.length; i++) {
                        p = (show_pref )? ( (gw_list[i].pref) ? (" ("+ String(gw_list[i].pref) +")") : " (None)" ) : "";
                        if (CP.intf_state && gw_list[i].type == "l") {
                            v = gw_list[i].gw;
                            retValue += CP.intf_state.format_both(
                                String(v) + p
                                ,String(v)
                                ,"ipv4"
                                ,CP.ar_util.INSTANCE()
                            );
                            tip += CP.intf_state.format_substr(
                                String(v) + p
                                ,String(v)
                                ,"ipv4"
                                ,CP.ar_util.INSTANCE()
                            ) + "<br>";
                        } else {
                            v = '<div style="text-align:left;color=black;" >'+ gw_list[i].gw + p +'</div>';
                            retValue += v;
                            tip += gw_list[i].gw + p +"<br>";
                        }
                    }
                    return '<div data-qtip="'+ tip +'" >'+ retValue +'</div>';
                }
            },{
                header          : "Ping"
                ,dataIndex      : "ping"
                ,menuDisabled   : true
                ,width          : 50
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = (String(value).toLowerCase() == "true") ? "Yes" : "No";
                    return CP.ar_util.rendererSpecific(retValue, retValue, "center", "black");
                }
            },{
                header          : "Comment"
                ,dataIndex      : "comment"
                ,menuDisabled   : true
                ,flex           : 1
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var dest_selModel = Ext.create("Ext.selection.RowModel", {
            mode            : "MULTI"
            ,allowDeselect  : true
            ,listeners      : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("dest_btnsbar");
                }
            }
        });

        var dest_grid = {
            xtype               : "cp4_grid"
            ,id                 : "dest_grid"
            ,width              : 820
            //,height             : 181
            ,height             : 281
            ,forceFit           : true
            ,store              : Ext.getStore("static_dest_store")
            ,columns            : dest_cm
            ,selModel           : dest_selModel
            ,dockedItems        : [{
                xtype               : "cp4_pagingtoolbar"
                ,store              : Ext.getStore("static_dest_store")
                ,id                 : "static_dest_paging_toolbar"
                ,dock               : "bottom"
                ,displayInfo        : true
                ,listeners          : {
                    afterrender         : function() {
                        this.child("#refresh").hide();
                    }
                    ,change             : function() {
                        var pgtb = Ext.getCmp("static_dest_paging_toolbar");
                        if (pgtb && pgtb.items && pgtb.items.map && pgtb.items.map.inputItem) {
                            var page_field = pgtb.items.map.inputItem;
                            page_field.originalValue = page_field.getValue();
                        }
                    }
                }
            }]
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("dest_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            dest_btnsbar
            ,dest_grid
        ];
    }

    ,open_dest_window                   : function() {
        CP.ar_util.clearParams();
        if (Ext.getCmp("dest_ipv4notation")) {
            Ext.getCmp("dest_ipv4notation").destroy();
        }

        function static_gw_renderer(value, meta, rec, row, col, st, view) {
            if (rec && rec.data && rec.data.type == "l") {
                return CP.intf_state.renderer_output(
                    String(value)
                    ,String(value)
                    ,"left"
                    ,"black"
                    ,String(value)
                    ,"ipv4"
                    ,CP.ar_util.INSTANCE()
                );
            }
            return CP.ar_util.rendererSpecific(value, value, "left", "black");
        }

        var gw_btnsbar = {
            xtype           : "cp4_btnsbar"
            ,id             : "static_gw_btnsbar"
            ,items          : [
                {
                    text                : "Add Gateway"
                    ,id                 : "gw_add_btn"
                    ,overrideNoToken    : false
                    ,disabledConditions : function() {
                        return !( CP.static_4.validMainPanel() );
                    }
                    ,menu               : {
                        style   : {overflow: "visible"}
                        ,xtype  : "menu"
                        ,plain  : true
                        ,items  : [
                            {
                                text    : "IP Address"
                                ,iconCls: "element"
                                ,handler: function(b, e) {
                                    var btn = Ext.getCmp("gw_add_btn");
                                    if (btn && btn.handle_no_token && btn.handle_no_token() ) {
                                        Ext.getCmp("gw_grid").getSelectionModel().deselectAll();
                                        CP.static_4.open_gw_window("a");
                                    }
                                }
                            },{
                                text    : "Network Interface"
                                ,iconCls: "element"
                                ,handler: function(b, e) {
                                    var btn = Ext.getCmp("gw_add_btn");
                                    if (btn && btn.handle_no_token && btn.handle_no_token() ) {
                                        Ext.getCmp("gw_grid").getSelectionModel().deselectAll();
                                        CP.static_4.open_gw_window("l");
                                    }
                                }
                            }
                        ]
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Edit"
                    ,id                 : "gw_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        var sm = Ext.getCmp("gw_grid").getSelectionModel();
                        if (sm.getCount() == 1) {
                            var r = sm.getLastSelected();
                            if (r) {
                                CP.static_4.open_gw_window( String("e"+ r.data.type) );
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("gw_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Delete"
                    ,id                 : "gw_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,delArr             : []
                    ,handler2           : function(b, e) {
                        var recs = Ext.getCmp("gw_grid").getSelectionModel().getSelection();
                        var d_rec = Ext.getCmp("dest_grid").getSelectionModel().getLastSelected();
                        var i,m;
                        for(i = 0; i < recs.length; i++) {
                            if (recs[i].data.newrec != true) {
                                switch( String(recs[i].data.type).toLowerCase() ) {
                                    case "a":
                                    case "address":
                                        m = "address:";
                                        break;
                                    default:
                                        m = "lname:";
                                }
                                m += String(recs[i].data.gw);
                                if (Ext.Array.indexOf(b.delArr, m) == -1) {
                                    Ext.Array.include(b.delArr, m);
                                }
                                //gw_delete(recs[i], d_rec);
                            }
                        }
                        Ext.getStore("gw_store").remove(recs);
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("gw_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function dest_afterrender(panel, eOpts) {
            panel.form._boundItems = null;
            CP.ar_util.clearParams();

            var gw_btn_del = Ext.getCmp("gw_delete_btn");
            if (gw_btn_del) {
                gw_btn_del.delArr = [];
            }
            var dest_grid = Ext.getCmp("dest_grid");
            var dest_sm = dest_grid.getSelectionModel();
            var j;
            if (dest_sm.hasSelection()) {
                //edit
                var rec = dest_sm.getLastSelected();
                var comment_decoded = Ext.htmlDecode(rec.data.comment);
                panel.loadRecord(rec);
                var gws = rec.data.agw;
                Ext.getStore("gw_store").loadData(gws);
                var ping_cmp = Ext.getCmp("ping_entry");
                if (ping_cmp) {
                    var hasLogicalGW = false;
		    if (!gws.length) {
	    	        hasLogicalGW = true;
		    } else {
                        for(j = 0; j < gws.length; j++) {
                            if (gws[j].type == "l") {
                                hasLogicalGW = true;
                                break;
                            }
                        }
		    }
                    if ( hasLogicalGW ) {
                        ping_cmp.setValue( false );
                    }
                    ping_cmp.setDisabled( hasLogicalGW );
                }

                Ext.getCmp("route_display_entry").show();
                Ext.getCmp("route_entry").hide();
                Ext.getCmp("mask_entry").hide();
                Ext.getCmp("route_entry").disable();
                Ext.getCmp("mask_entry").disable();
                Ext.getCmp("dest_ipv4notation_set").setVisible(false);
                Ext.getCmp("dest_ipv4notation_set").setDisabled(true);
                Ext.getCmp("comment_entry").setValue(comment_decoded);

                var is_default_route = (String(rec.data.route).toLowerCase() == "default");
                Ext.getCmp("scopelocal_entry").setVisible(!is_default_route);
                Ext.getCmp("scopelocal_entry").setDisabled(is_default_route);
                if (rec.data.scopelocal) {
                    Ext.getCmp("scopelocal_entry").baseval = true;
                }

                if (rec.data.route == "default") {
                    Ext.getCmp("route_display_entry").setValue("Default");
                } else {
                    Ext.getCmp("route_display_entry").setValue(
                        rec.data.route +"/"+ rec.data.mask
                    );
                }

                Ext.getCmp("dest_window").setTitle(
                    "Edit Destination Route: "+ Ext.getCmp("route_display_entry").getValue()
                );
            } else {
                //new
                Ext.getCmp("option_entry").setValue("");
                Ext.getCmp("route_display_entry").setVisible(false);
                Ext.getCmp("route_display_entry").setDisabled(true);
                Ext.getCmp("route_entry").show();
                Ext.getCmp("mask_entry").show();
                Ext.getCmp("dest_ipv4notation_set").setVisible(true);
                Ext.getCmp("dest_ipv4notation_set").setDisabled(false);
                Ext.getCmp("scopelocal_entry").setVisible(true);
                Ext.getCmp("scopelocal_entry").setDisabled(false);
                Ext.getCmp("comment_entry").setValue("");
                Ext.getStore("gw_store").removeAll();
            }
            Ext.getCmp("option_entry").fireEvent("change");
            if (panel.chkBtns) {
                panel.chkBtns();
            }
        }

        var PING_QTIP_TEXT  = "Ping next hop gateways to determine reachability.<br>"
                            + "Ping is incompatible with interface gateways.";

        var dest_form = {
            xtype       : "cp4_formpanel"
            ,id         : "dest_form"
            ,autoScroll : false
            ,height     : 532
            ,width      : 410
            ,pollForChanges : true
            ,pollInterval   : 200
            ,listeners  : {
                afterrender : dest_afterrender
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("static_gw_btnsbar");
                CP.ar_util.checkDisabledBtn("dest_save_btn");
                CP.ar_util.checkDisabledBtn("dest_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "dest_save_btn"
                    ,text               : "Save"
                    ,formBind           : true  //should enable/disable based on formpanel's validity
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : dest_save
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("dest_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("dest_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "dest_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("dest_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            var dest_cmp = Ext.getCmp("dest_ipv4notation");
                            var prec_cmp = Ext.getCmp("precedence_entry");
                            if (Ext.getCmp("route_display_entry").isDisabled()) {
                                if (dest_cmp && dest_cmp.validate) {
                                    dest_cmp.validate();
                                }
                            }
                            if (prec_cmp && prec_cmp.validate) {
                                prec_cmp.validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 380
                    ,margin     : "15 0 0 15"
                    ,autoScroll : false
                    ,items      : [
                        {
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Destination"
                            ,id             : "route_display_entry"
                            ,width          : "auto"
                            ,value          : "Default"
                            ,height         : 22
                        },{
                            xtype           : "cp4_formpanel"
                            ,id             : "dest_ipv4notation_set"
                            ,items          : [
                                {
                                    xtype                  : "cp4_ipv4notation"
                                    ,id                    : "dest_ipv4notation"
                                    ,ipId                  : "route_entry"
                                    ,ipName                : "route"
                                    ,ipLabel               : "Destination"
                                    ,notationId            : "mask_entry"
                                    ,notationName          : "mask"
                                    //,notationLabel         : ""
                                    ,advancedValidation    : true
                                    ,allowBlank            : false
                                    ,rejectGlobalBroadcast : true
                                    ,rejectMulticast       : true
                                    ,fieldConfig           : {
                                        allowBlank      : false
                                    }
                                    ,networkMode           : true
                                }
                            ]
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Next Hop Type"
                            ,id             : "option_entry"
                            ,name           : "option"
                            ,mode           : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""            ,"Normal"]
                                                ,["blackhole"   ,"Blackhole"]
                                                ,["reject"      ,"Reject"]]
                            ,listeners      : {
                                change          : function(cb, newVal, oldVal, eOpts) {
                                    Ext.getCmp("gw_set").setVisible(
                                        Ext.getCmp("option_entry").getValue() == ""
                                    );
                                }
                            }
                        },{
                            xtype           : "cp4_inlinemsg"
                            ,type           : "info"
                            ,text           : CP.static_4.NORMAL_INFO + "<br>"
                                            + CP.static_4.REJECT_INFO + "<br>"
                                            + CP.static_4.BLACKHOLE_INFO
                            ,style          : "margin-bottom:10px;"
                        },{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Rank"
                            ,id             : "precedence_entry"
                            ,name           : "precedence"
                            ,width          : 200
                            ,value              : ""
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,submitValue        : false
                            ,minValue           : 0
                            ,maxValue           : 255
                            ,maxLength          : 3
                            ,emptyText          : "Default: 60"
                            ,enforceMaxLength   : true
                        },{
                            xtype           : "cp4_checkbox"
                            ,fieldLabel     : "Local Scope"
                            ,id             : "scopelocal_entry"
                            ,name           : "scopelocal"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,height         : 22
                            ,submitValue    : false
                            ,hidden         : true
                            ,disabled       : true
                            ,baseval        : false
                            ,listeners      : {
                                change          : function(cmp, newVal, oldVal, eOpts) {
                                    if ((cmp.baseval == true) && (oldVal == true) && (newVal == false)) {
                                        Ext.Msg.alert("Warning: "
                                            , "For correct order of operation, please remove the route with "
                                            + "Local Scope option first then add the route without Local Scope "
                                            + "option.");
                                        cmp.setValue('on');
                                    }
                                }
                            }
                            ,getDBValue     : function() {
                                var c = this;
                                var v = c.getValue() ? "t" : "";
                                return v;
                            }
                        },{
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "Comment"
                            ,id             : "comment_entry"
                            ,name           : "comment"
                            ,width          : 380
                            ,maxLength          : 100
                            ,enforceMaxLength   : true
                            ,maskRe         : CP.ar_util.comment_maskRe
                            ,stripCharsRe   : CP.ar_util.comment_stripCharsRe
                        },{
                            xtype       : "cp4_formpanel"
                            ,id         : "gw_set"
                            ,margin     : 0
                            ,autoScroll : false
                            ,items      : [
                                {
                                    xtype           : "cp4_sectiontitle"
                                    ,titleText      : "Add Gateway"
                                },{
                                    xtype           : "cp4_checkbox"
                                    ,fieldLabel     : "Ping"
                                    ,id             : "ping_entry"
                                    ,name           : "ping"
                                    ,labelWidth     : 100
                                    ,width          : 200
                                    ,height         : 22
				    ,disabled       : true
                                    ,submitValue    : false
                                    ,value          : ""
                                    ,qtipText       : PING_QTIP_TEXT
                                    ,listeners      : {
                                        afterrender     : function(cb, eOpt) {
                                            if (cb.qtipText && cb.qtipText.length > 0) {
                                                Ext.tip.QuickTipManager.register({
                                                    target          : cb.getId()
                                                    ,text           : cb.qtipText
                                                    ,dismissDelay   : 0
                                                });
                                            }
                                        }
                                        ,change         : function(cb, newVal, oldVal, eOpts) {
                                            var st = Ext.getStore("gw_store");
                                            if (newVal == true) {
                                                if ( st && (st.findExact("type","l",0) != -1) ) {
                                                    cb.setValue(false);
                                                    cb.setDisabled(true);
                                                }
                                            }
                                        }
                                    }
                                }
                                ,gw_btnsbar
                                ,{
                                    xtype               : "cp4_grid"
                                    ,id                 : "gw_grid"
                                    ,width              : 280
                                    ,height             : 127
                                    ,forceFit           : true
                                    ,autoScroll         : true
                                    ,store              : Ext.getStore("gw_store")
                                    ,margin             : 0
                                    ,columns            : [
                                        {
                                            header          : "Gateway"
                                            ,dataIndex      : "gw"
                                            ,width          : 200
                                            ,menuDisabled   : true
                                            ,renderer       : static_gw_renderer
                                        },{
                                            header          : "Priority"
                                            ,dataIndex      : "pref"
                                            ,width          : 70
                                            ,menuDisabled   : true
                                            ,renderer       : function(value) {
                                                if (value) {
                                                    return CP.ar_util.rendererSpecific(value, value, "center", "black");
                                                } else {
                                                    return CP.ar_util.rendererSpecific("None", "None", "center", "black");
                                                }
                                            }
                                        }
                                    ]
                                    ,selModel           : Ext.create("Ext.selection.RowModel", {
                                        mode            : "MULTI"
                                        ,allowDeselect  : true
                                        ,listeners      : {
                                            selectionchange : function(view, selections, eOpts) {
                                                CP.ar_util.checkBtnsbar("dest_form");
                                            }
                                        }
                                    })
                                    ,draggable          : false
                                    ,enableColumnMove   : false
                                    ,enableColumnResize : true
                                    ,listeners          : {
                                        itemdblclick        : function() {
                                            var b = Ext.getCmp("gw_edit_btn");
                                            if (b && b.handler) { b.handler(b); }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        var dest_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "dest_window"
            ,title      : "Add Destination Route"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ dest_form ]
        });
        Ext.getCmp("dest_window").show();

        function dest_save(b, e) {
            var params = CP.ar_util.getParams();
            var gw_st = Ext.getStore("gw_store");
            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":static";
            var mask_prefix;
            var gw_prefix;
            var selected_rec = null;

            var route;
            var mask;
            var option = Ext.getCmp("option_entry").getValue();
            var comment = Ext.getCmp("comment_entry").getValue();
            var scopelocal = Ext.getCmp("scopelocal_entry").getDBValue();

            if (Ext.getCmp("dest_grid").getSelectionModel().hasSelection()) {
                selected_rec = Ext.getCmp("dest_grid").getSelectionModel().getLastSelected();
                route = selected_rec.data.route;
                mask = selected_rec.data.mask;
            } else {
                route = Ext.getCmp("route_entry").getValue();
                mask = Ext.getCmp("mask_entry").getMaskLength();

                //check for valid route
                if ( !validate_route(route, mask) ) {
                    return;
                }

                //check for valid mask
                var routeML = Ext.getCmp("route_entry").getMaskLength();
                var maskML = Ext.getCmp("mask_entry").getMaskLength();
                if (routeML > maskML) {
                    var msg = "Insufficient Mask Length.";
                    if ("Dotted" == CP.global.formatNotation) {
                        msg = "Insufficient Subnet Mask.";
                    }
                    Ext.Msg.alert("Warning",msg);
                    return;
                }
            }

            if (route == "default") {
                mask_prefix = prefix + ":default";
                scopelocal = "";
            } else {
                params[prefix + ":network:" + route] = "t";
                mask_prefix = prefix + ":network:" + route + ":masklen:" + mask;
            }
            params[mask_prefix] = "t";
            params[mask_prefix + ":option"] = option;
            params[mask_prefix + ":comment"] = comment;
            params[mask_prefix + ":scopelocal"] = scopelocal;

            var prec_cmp = Ext.getCmp("precedence_entry");
            var ping_cmp = Ext.getCmp("ping_entry");
            if (prec_cmp && prec_cmp.isValid()) {
                params[mask_prefix +":precedence"] = prec_cmp.getRawValue();
            }
            if (ping_cmp && ping_cmp.isValid()) {
                params[mask_prefix +":ping"] = (option == "" && ping_cmp.getValue()) ? "t" : "";
            }

            gw_prefix = mask_prefix + ":gateway";
            params[gw_prefix] = (option == "") ? "t" : "";
            var gw_recs = gw_st.getRange();
            var gw, i;
            var del_btn = Ext.getCmp("gw_delete_btn");
            var dArr = (del_btn ? del_btn.delArr : [] );
            for(i = 0; i < dArr.length; i++) {
                params[gw_prefix +":"+ dArr[i] ]                = "";
                params[gw_prefix +":"+ dArr[i] +":preference"]  = "";
            }
            
            var nexthop_ok;            
            switch(Ext.getCmp("option_entry").getValue()) {
                case "blackhole": 
                    nexthop_ok = true;
                    break;
                    
                case "reject":    
                    nexthop_ok = true;
                    break;
                    
                default:
                    if (route == "default") {
                        nexthop_ok = true;
                    } else {
                        nexthop_ok = false;
                    }
                    break;
            }
            
            for(i = 0; i < gw_recs.length; i++) {
                nexthop_ok = true;
                if (gw_recs[i].data.dirty) {
                    gw = gw_recs[i];
                    if (gw.data.type == "a") {
                        params[gw_prefix + ":address:" + gw.data.gw]                = (option != "") ? "" : "t";
                        params[gw_prefix + ":address:" + gw.data.gw + ":preference"]= (option != "") ? "" : gw.data.pref;
                    } else if (gw.data.type == "l") {
                        params[gw_prefix + ":lname:" + gw.data.gw]                  = (option != "") ? "" : "t";
                        params[gw_prefix + ":lname:" + gw.data.gw + ":preference"]  = (option != "") ? "" : gw.data.pref;
                        params[mask_prefix +":ping"] = ""; //no pings on dest with logical gw
                    }
                }
            }
            
            if (nexthop_ok === false) {                
                if (selected_rec === null) {
                    /* Don't allow the user to add a route without a next hop */
                    Ext.Msg.alert("Add Route", 
                            "At least one next hop gateway must be specified.");
                } else {                    
                    /* 
                     * Require the existing route to be deleted if all next 
                     * hops have been removed 
                     * */
                    Ext.Msg.show({
                        title   : "Edit Route"
                        ,msg    : "No next hop gateways are defined." +
                                  " Saving changes will delete this static route."
                        ,animEl : "elId"
                        ,buttons: Ext.Msg.OKCANCEL
                        ,icon   : Ext.MessageBox.QUESTION
                        ,fn     : function(btn, text) {
                            if (btn == "cancel") {
                                return;
                            }
                            
                            CP.static_4.delete_dest(selected_rec);
                            CP.ar_util.mySubmit();
                        }
                    });                    
                }
                
                return;
            }
            
            CP.ar_util.mySubmit();
        }

        function validate_route(route, mask) {
            var d_recs = Ext.getStore("static_dest_store").getRange();
            for(i = 0; i < d_recs.length; i++) {
                if (route == d_recs[i].data.route && mask == d_recs[i].data.mask) {
                    Ext.Msg.alert(
                        "Warning: Destionation Route Already Exists."
                        ,"Address must be unique."
                    );
                    return false;
                }
            }
            return true;
        }

        function validate_mask(route, mask, maskType) {
            var octet = route.split(".",4);
            var rLength = 0;
            var i;
            for(i = 3; i > -1 && rLength == 0; i--) {
                if (       octet[i] & 0x01) {
                    rLength = (8*i) + 8;
                } else if (octet[i] & 0x02) {
                    rLength = (8*i) + 7;
                } else if (octet[i] & 0x04) {
                    rLength = (8*i) + 6;
                } else if (octet[i] & 0x08) {
                    rLength = (8*i) + 5;
                } else if (octet[i] & 0x10) {
                    rLength = (8*i) + 4;
                } else if (octet[i] & 0x20) {
                    rLength = (8*i) + 3;
                } else if (octet[i] & 0x40) {
                    rLength = (8*i) + 2;
                } else if (octet[i] & 0x80) {
                    rLength = (8*i) + 1;
                }
            }

            if (rLength > mask) {
                var title = "";
                var msg = "";
                if (maskType == "cp4_masklength") {
                    title = "Warning: Insufficient mask length.";
                    msg = "Address requires a mask length of at least " + rLength + ".";
                } else {
                    title = "Warning: Insufficient subnet mask.";
                    msg = "Address requires a subnet mask of at least "
                        + length_to_subnet(rLength) + "."
                        + length_to_subnet(rLength - 8) + "."
                        + length_to_subnet(rLength - 16) + "."
                        + length_to_subnet(rLength - 24);
                }
                Ext.Msg.alert(title, msg);
                return false;
            }

            return true;
        }

        function length_to_subnet(rLength) {
            switch(rLength) {
                case 0:     return 0;
                case 1:     return 128;
                case 2:     return 192;
                case 3:     return 224;
                case 4:     return 240;
                case 5:     return 248;
                case 6:     return 252;
                case 7:     return 254;
                default:
            }
            if (rLength > 7) {
                return 255;
            }
            return 0;
        }

        function gw_delete(rec, d_rec) {
            var params = CP.ar_util.getParams();
            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":static";
            var mask_prefix;
            var gw_prefix;

            if (d_rec.data.route == "default") {
                mask_prefix = prefix + ":default";
            } else {
                mask_prefix = prefix + ":network:" + d_rec.data.route + ":masklen:" + d_rec.data.mask;
            }
            if (rec.data.type == "a") {
                gw_prefix = mask_prefix + ":gateway:address:" + rec.data.gw;
            } else if (rec.data.type == "l") {
                gw_prefix = mask_prefix + ":gateway:lname:" + rec.data.gw;
            }
            params[gw_prefix] = "";
            params[gw_prefix + ":preference"] = "";
        }
    }

    ,open_gw_window                         : function(info) {
        var gw_obj; //obj to use for the gw
        var TITLE;
        switch(info) {
            case "ea":
            case "a":   //add a new address, need ipv4field
                TITLE = (info == "a") ? "Add IP Address Gateway" : "Edit Gateway";
                info = "a"; //used lower down in the type component and gw_mode
                gw_obj = {
                    xtype           : "cp4_ipv4field"
                    ,id             : "gw_entry"
                    ,fieldConfig    : {
                        name        : "gw"
                        ,allowBlank : false
                    }
                    ,gw_mode        : info
                };
                break;
            case "el":
            case "l":   //add a new logical interface, need combobox
                TITLE = (info == "l") ? "Add Logical Interface Gateway" : "Edit Gateway";
                info = "l";
                gw_obj = {
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Logical Interface"
                    ,id             : "gw_entry"
                    ,name           : "gw"
                    ,labelWidth     : 100
                    ,width          : 255
                    ,mode           : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,store          : Ext.getStore("intf_store")
                    ,valueField     : "intf"
                    ,displayField   : "intf"
                    ,allowBlank     : false
                    ,gw_mode        : info
                };
                break;
            case "e":   //edit existing gw, need displayfield
                TITLE = "Edit Gateway";
                gw_obj = {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "Gateway"
                    ,id             : "gw_entry"
                    ,name           : "gw"
                    ,labelWidth     : 100
                    ,width          : 255
                    ,height         : 22
                    ,gw_mode        : info
                };
                break;
            default:    //should not occur
                return;
        }

        var gw_form = {
            xtype           : "cp4_formpanel"
            ,id             : "gw_form"
            ,width          : 285
            ,height         : 120
            ,autoScroll     : false
            ,pollForChanges : true
            ,pollInterval   : 200
            ,listeners      : {
                afterrender     : gw_afterrender
            }
            ,chkBtns        : function() {
                CP.ar_util.checkDisabledBtn("gw_save_btn");
                CP.ar_util.checkDisabledBtn("gw_cancel_btn");
            }
            ,buttons        : [
                {
                    xtype               : "cp4_button"
                    ,id                 : "gw_save_btn"
                    ,text               : "Ok"
                    ,formBind           : true
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : gw_save
                    ,disabledConditions : function() {
                        if ( !( CP.static_4.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("gw_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners          : {
                        mouseover           : function(b, e, eOpts) {
                            Ext.getCmp("gw_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "gw_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("gw_window");
                    }
                    ,listeners          : {
                        mouseover   : function(b, e, eOpts) {
                            var gw_e = Ext.getCmp("gw_entry");
                            if (gw_e.getXType() != "cp4_displayfield") {
                                gw_e.validate();
                            }
                            Ext.getCmp("pref_entry").validate();
                        }
                    }
                }
            ]
            ,items          : [
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : "15 0 0 15"
                    ,width      : 265
                    ,items      : [
                        gw_obj
                        ,{
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "Priority"
                            ,id             : "pref_entry"
                            ,name           : "pref"
                            ,labelWidth     : 100
                            ,width          : 175
                            ,emptyText      : "None"
                            ,allowBlank     : true 
                            ,allowDecimals  : false
                            ,minValue       : 1
                            ,maxValue       : 8
                            ,maxLength      : 1
                            ,enforceMaxLength   : true
                        },{
                            //used as a panel validator
                            xtype           : "cp4_textfield"
                            ,fieldLabel     : "type_entry"
                            ,id             : "type_entry"
                            ,name           : "type"
                            ,value          : info
                            ,hidden         : true
                            ,hideLabel      : true
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

        var gw_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "gw_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("dest_window").getPosition();
                    win.setPosition(125 + pos[0], 120 + pos[1]);
                }
            }
            ,items      : [ gw_form ]
        });
        gw_window.show();

        function gw_afterrender(p, eOpts) {
            p.form._boundItems = null;

            var gw_sm = Ext.getCmp("gw_grid").getSelectionModel();
            if (gw_sm.hasSelection()) {
                var rec = gw_sm.getLastSelected();
                p.loadRecord(rec);
                var nr_v = "false";
                if (rec.data.newrec == true || rec.data.newrec == "true") {
                    nr_v = "true";
                }
                Ext.getCmp("newrec_entry").setValue(nr_v);
                Ext.getCmp("gw_entry").setValue(rec.data.gw);
                Ext.getCmp("gw_entry").originalValue = rec.data.gw;
            } else {
                Ext.getCmp("newrec_entry").setValue("true");
                Ext.getCmp("gw_entry").originalValue = "";
            }
            if (p.chkBtns) { p.chkBtns(); }
        }

        function gw_save(b, e) {
            var params = CP.ar_util.getParams();
            var gw_grid = Ext.getCmp("gw_grid");
            var gw = Ext.getCmp("gw_entry").getValue();
            var oldGW = Ext.getCmp("gw_entry").originalValue;
            var pref = Ext.getCmp("pref_entry").getRawValue();
            var type = Ext.getCmp("type_entry").getValue();

            if (gw == "" || gw == null) { return; }
            if (pref != "") {
                pref = Ext.Number.constrain(pref, 1, 8);
            }

            //check if the gw is an exact match on an interface address
            if (Ext.getCmp("gw_entry").xtype == "cp4_ipv4field") {
                if (gw == "255.255.255.255") {
                    Ext.Msg.alert("Warning", "Static Routes should not define a gateway using the broadcast address (255.255.255.255).");
                    return;
                }
                var m = CP.addr_list.getMatchMessage(gw);
                if (m != "") {
                    Ext.Msg.alert("Warning", m);
                    return;
                }
            }
            switch( CP.static_4.check_exact_intf_list_match(gw) ) {
                case 1: //gw does match an addr in the intf_list
                    Ext.Msg.alert("Warning"
                        ,"Gateway addresses can not exactly match the address of an interface.");
                    return;
                case -1://intf_list store was not found
                    Ext.Msg.alert("Warning"
                        ,"Unable to bring up the list of interfaces.");
                    return;
                case -2://gw is empty string or null
                    Ext.Msg.alert("Warning"
                        ,"Invalid gateway.");
                    return;
                default:
                    //gw doesn't match an addr in the intf_list (or is a string match of an intf name)
            }

            var gw_st   = Ext.getStore("gw_store");
            var i       = gw_st.findExact("gw",gw);

            //handle old gateway
            if (oldGW != "" && oldGW != gw) {
                //blank out oldGW
                var oldRec = gw_st.findRecord("gw",oldGW);
                var d_rec = Ext.getCmp("dest_grid").getSelectionModel().getLastSelected();
                if (oldRec && d_rec) {
                    var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":static";
                    var midfix = (d_rec.data.route == "default")
                        ? ":default"
                        : ":network:"+ d_rec.data.route +":masklen:"+ d_rec.data.mask;
                    var typeSp = (type == "a") ? "address" : "lname";
                    var del_prefix = prefix + midfix +":gateway:"+ typeSp +":"+ oldGW;
                    params[del_prefix] = "";
                    params[del_prefix +":preference"] = "";
                    gw_st.remove(oldRec);
                }
            }

            if (i == -1) {
                //add
                //if ( !(validate_gw(gw, type)) ) { return; }
                Ext.getStore("gw_store").add({
                    "gw"        : gw
                    ,"pref"     : pref
                    ,"type"     : type
                    ,"dirty"    : true
                    ,"newrec"   : true
                });
            } else {
                //edit
                var rec = gw_st.getAt(i);
                if (rec) {
                    rec.data["pref"] = pref;
                    rec.data.dirty = true;
                }
            }

            gw_grid.getView().refresh();
            gw_st.sort();
            CP.ar_util.checkWindowClose("gw_window");
        }

        /*
        function validate_gw(gw, type) {
            if (Ext.getStore("gw_store").findExact("gw",gw) != -1) {
                Ext.Msg.alert(
                    "Warning: Gateway Already Exists."
                    ,"This gateway already exists for this route."
                );
                return false;
            }

            var intfs = Ext.getStore("intf_store").getRange();
            var addr4_list;
            var i, j;
            for(i = 0; i < intfs.length; i++) {
                addr4_list = intfs[i].data.addr4_list;
                for(j = 0; j < addr4_list.length; j++) {
                    if (addr4_list[j].addr4 == gw) {
                        Ext.Msg.alert(
                            "Warning: Gateway Exactly Matches an Interface"
                            ,"Gateways can't exactly match the address of an interface or the alias of an interface."
                        );
                        return false;
                    }
                }
            }

            return true;
        }
        // */
    }

    ,check_exact_intf_list_match    : function(testAddr) {
        //return values
            // -2   invalid testAddr
            // -1   intf store not found
            //  1   testAddr exactly matches an interface in the list
            //  0   testAddr does not exactly match any interface
        var if_st = Ext.getStore("intf_store");
        if (testAddr == null || testAddr == "") {
            return -2;
        }
        if ( !(if_st) ) {
            return -1;
        }
        if ( if_st.findExact("intf",testAddr,0) > -1 ) {
            return 0; //testAddr is exact match of an intf name, which is fine
        }
        var intfs = if_st.getRange();
        var i = 0; var j = 0;
        for(i = 0; intfs && i < intfs.length; i++) {
            var a4_list = intfs[i].data.addr4_list;
            for(j = 0; a4_list && j < a4_list.length; j++) {
                if (testAddr == a4_list[j].addr4) {
                    return 1;
                }
            }
        }
        return 0;
    }

//batch mode
    ,get_batch_add_set              : function() {
        var batch_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "batch_btnsbar"
            ,items  : [
                {
                    text                : "Add Multiple Static Routes"
                    ,id                 : "static_open_batch_btn"
                    ,overrideNoToken    : false
                    ,disabledConditions : function() {
                        return !( CP.static_4.validMainPanel() );
                    }
                    ,handler2           : function open_batch_window(b, e) {
                        CP.ar_util.clearParams();
                        var batch_form = {
                            xtype       : "cp4_formpanel"
                            ,id         : "batch_form"
                            ,style      : "padding-top:15px;"
                            ,defaults   : {
                                style       : "margin-left:15px;margin-right:15px;"
                            }
                            ,autoScroll : false
                            ,listeners  : {
                                afterrender : function(p, eOpts) {
                                    p.form._boundItems = null;
                                    if (p.chkBtns) { p.chkBtns(); }
                                }
                            }
                            ,chkBtns    : function() {
                                CP.ar_util.checkDisabledBtn("batch_save_btn");
                                CP.ar_util.checkDisabledBtn("batch_cancel_btn");
                            }
                            ,buttons    : [
                                {
                                    xtype               : "cp4_button"
                                    ,id                 : "batch_save_btn"
                                    ,text               : "Save"
                                    ,formBind           : true
                                    ,disabled           : true
                                    ,overrideNoToken    : false
                                    ,handler2           : function batch_save(b, e) {
                                        var params = CP.ar_util.clearParams();
                                        var qaroutes = Ext.getCmp("qaroutes_entry").getValue();
                                        var qaoption;
                                        switch(Ext.getCmp("qaoption_entry").getValue()) {
                                            case "blackhole":   qaoption = "Blackhole";
                                                break;
                                            case "reject":      qaoption = "Reject";
                                                break;
                                            default:            qaoption = "Normal";
                                        }
                                        params["qaroutes"] = qaroutes;
                                        params["qaoption"] = qaoption;
                                        CP.ar_util.mySubmit();
                                    }
                                    ,disabledConditions : function() {
                                        if ( !( CP.static_4.validMainPanel() ) ) {
                                            return true;
                                        }
                                        var f = Ext.getCmp("batch_form");
                                        return !(f ? f.getForm().isValid() : false);
                                    }
                                },{
                                    xtype               : "cp4_button"
                                    ,id                 : "batch_cancel_btn"
                                    ,text               : "Cancel"
                                    ,overrideNoToken    : false
                                    ,handler2           : function(b, e) {
                                        CP.ar_util.checkWindowClose("batch_window");
                                    }
                                }
                            ]
                            ,items      : [
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Next Hop Type"
                                    ,id             : "qaoption_entry"
                                    ,name           : "qaoption"
                                    ,mode           : "local"
                                    ,editable       : false
                                    ,triggerAction  : "all"
                                    ,value          : ""
                                    ,store          :   [[""            ,"Normal"]
                                                        ,["blackhole"   ,"Blackhole"]
                                                        ,["reject"      ,"Reject"]]
                                },{
                                    xtype           : "cp4_textarea"
                                    ,id             : "qaroutes_entry"
                                    ,name           : "qaroutes"
                                    ,height         : 140   // 8 rows
                                    ,width          : 400   //55 cols
                                    ,allowBlank     : false
                                    ,hideLabel      : true
                                    ,value          : ""
                                },{
                                    xtype           : "cp4_inlinemsg"
                                    ,type           : "info"
                                    ,text           : CP.static_4.QuickAddInfo
                                }
                            ]
                        };

                        var batch_window = Ext.create("CP.WebUI4.ModalWin", {
                            id          : "batch_window"
                            ,title      : "Add Multiple Routes"
                            ,shadow     : false
                            ,listeners  : {
                                show        : function(win, eOpts) {
                                    win.setPosition(225,100);
                                }
                            }
                            ,items      : [ batch_form ]
                        });
                        batch_window.show();
                    }
                }
            ]
        };
        return [ batch_btnsbar ];
    }

    ,get_advanced_options_set   : function() {
        return [
            {
                xtype   : "cp4_formpanel"
                ,layout : "column"
                ,margin : 0
                ,padding: 0
                ,items  : [
                    {
                        xtype               : "cp4_numberfield"
                        ,fieldLabel         : "Ping Interval"
                        ,id                 : "pinginterval_entry"
                        ,name               : "pinginterval"
                        ,labelWidth         : 100
                        ,width              : 200
                        ,value              : ""
                        ,emptyText          : "Default: 10"
                        ,allowBlank         : true
                        ,allowDecimals      : false
                        ,submitValue        : false
                        ,minValue           : 1
                        ,maxValue           : 100
                        ,maxLength          : 3
                        ,enforceMaxLength   : true
                        ,qtipText           : "Seconds between ping attempts."
                        ,listeners          : {
                            afterrender         : function(cb, eOpt) {
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
                        xtype   : "cp4_label"
                        ,text   : "seconds"
                        ,style  : "margin-left:10px;margin-top:4px;"
                    }
                ]
            },{
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Ping Count"
                ,id                 : "pingcount_entry"
                ,name               : "pingcount"
                ,labelWidth         : 100
                ,width              : 200
                ,value              : ""
                ,emptyText          : "Default: 3"
                ,allowBlank         : true
                ,allowDecimals      : false
                ,submitValue        : false
                ,minValue           : 1
                ,maxValue           : 100
                ,maxLength          : 3
                ,enforceMaxLength   : true
                ,qtipText           : "Number of unanswered pings before a gateway is declared down."
                ,listeners          : {
                    afterrender         : function(cb, eOpt) {
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
                xtype               : "cp4_button"
                ,text               : "Apply"
                ,id                 : "apply_adv_option_btn"
                ,qtipText           : "Only Applies Valid Intervals and Count"
                ,overrideNoToken    : false
                ,handler2           : function(b, e) {
                    var params          = CP.ar_util.clearParams();
                    var ping_prefix     = "routed:instance:"+ CP.ar_util.INSTANCE() +":ping";
                    var interval_cmp    = Ext.getCmp("pinginterval_entry");
                    var count_cmp       = Ext.getCmp("pingcount_entry");

                    if (interval_cmp && interval_cmp.isValid() && !(interval_cmp.isDisabled()) ) {
                        params[ping_prefix +":pinginterval"]= interval_cmp.getRawValue();
                    }
                    if (count_cmp && count_cmp.isValid() && !(count_cmp.isDisabled()) ) {
                        params[ping_prefix +":pingcount"]   = count_cmp.getRawValue();
                    }
                    CP.ar_util.mySubmit();
                }
                ,disabledConditions : function() {
                    return !( CP.static_4.validMainPanel() );
                }
                ,listeners          : {
                    mouseover           : function(b, e, eOpts) {
                        var interval_cmp    = Ext.getCmp("pinginterval_entry");
                        var count_cmp       = Ext.getCmp("pingcount_entry");
                        if (interval_cmp && interval_cmp.validate) {
                            interval_cmp.validate();
                        }
                        if (count_cmp && count_cmp.validate) {
                            count_cmp.validate();
                        }
                    }
                    ,afterrender        : function(b, eOpts) {
                        if (b.qtipText && b.qtipText.length > 0) {
                            Ext.tip.QuickTipManager.register({
                                target          : b.getId()
                                ,text           : b.qtipText
                                ,dismissDelay   : 0
                            });
                        }
                    }
                }
            }
        ];
    }
}

