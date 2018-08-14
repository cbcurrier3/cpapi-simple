CP.staticmroute = {
    validMainPanel     : function() {
        var f = Ext.getCmp("static_configPanel");
        return (f ? f.getForm().isValid() : false);
    }
    ,check_user_action  : function() {
        CP.ar_util.checkBtnsbar("dest_btnsbar");
        CP.ar_util.checkBtnsbar("staticmroute_dest_form");
        CP.ar_util.checkBtnsbar("gw_form");
    }

    ,init                           : function() {
        CP.staticmroute.defineStores();
        var static_configPanel = CP.staticmroute.configPanel();
        var obj = {
            title           : "Static Multicast Routes"
            ,panel          : static_configPanel
            ,submitURL      : "/cgi-bin/staticmroute.tcl?instance=" + CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("staticmroute_dest_window");
                CP.staticmroute.doLoad();
                
                // Refresh the monitor tab with the new data
                if (CP && CP.staticmroute_monitor_4 
                        && CP.staticmroute_monitor_4.doLoad) {
                    CP.staticmroute_monitor_4.doLoad();
                }                                                                                               
            }
            ,submitFailure  : function() {
                CP.staticmroute.doLoad();
            }
            ,checkCmpState  : CP.staticmroute.check_user_action
            ,helpFile       : 'staticHelp.html'
            ,cluster_feature_name: 'static-mroute'
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
            var grids_to_refresh_list = ["staticmroute_grid"];
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
		
        function sort_gw(value) {
            if (value == "loopback" || value == "lo") {
                return "z4294967296";
            }
            if (value.indexOf(".") == -1) {
                return value;
            }
            return "z"+String(sort_ipv4address(value));
        }
		
        var dest_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "dest_store"
            ,autoLoad   : true
            ,fields     : [
                {
                    name        : 'route'
                    ,sortType   : sort_ipv4address
                }
                ,{name: 'mask'}
                ,"precedence"
                ,{name: 'agw'}
                ,{name: 'delete'}
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/staticmroute.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "staticmroutes"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.staticmroutes"
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

                    if ( st.findExact("route","default") == -1 ) {
                        st.add({
                            'route'     : "default"
                            ,'mask'     : ""
                            ,'agw'      : []
                        });
                    }
                    var r = st.getRange();
                    var i;
                    for(i = 0; i < r.length; i++) {
                        Ext.Array.sort(r[i].data.agw, sort_gw_func);
                    }
                    var g = Ext.getCmp("staticmroute_grid");
                    if (g) {
                        g.getView().refresh();
                    }
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
            ,sorters    : [
                {property: "route", direction: "ASC"}
            ]
        });

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
/*            ,listeners  : {
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
*/
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
                    ,"excludeType"  : "6in4 6to4 gre"
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
                afterrender     : CP.staticmroute.doLoad
                ,validitychange : function(basic, valid, eOpts) {
                    CP.staticmroute.check_user_action();
                }
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("staticmroute"),
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Static Multicast Routes"
                }
                ,CP.staticmroute.get_destination_grid_set()
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
        loadStoreFunc("dest_store", loadObj, true);
        loadStoreFunc("sroute_mon_st", loadObj, false);

        if (Ext.getStore("gw_store")) {
            Ext.getStore("gw_store").removeAll();
        }

        var p = Ext.getCmp("static_configPanel");
        if (p) {
            p.form._boundItems = null;
            CP.ar_util.loadListPush("doLoad");
            p.load({
                url         : "/cgi-bin/staticmroute.tcl?instance=" + instance_string +"&option=global"
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
    
    , delete_dest       : function(rec) {
        var prefix  = "routed:instance:" + CP.ar_util.INSTANCE() + ":static-mroute";
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
            params[mask_prefix] = "";
        }
        params["SPECIAL:"+ mask_prefix]     = "";
        params[mask_prefix +":precedence"]  = "";

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

        var st = Ext.getStore("dest_store");
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
                        Ext.getCmp("staticmroute_grid").getSelectionModel().deselectAll();
                        CP.staticmroute.open_staticmroute_dest_window();
                    }
                    ,disabledConditions : function() {
                        return !( CP.staticmroute.validMainPanel() );
                    }
                },{
                    text                : "Edit"
                    ,id                 : "dest_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.staticmroute.open_staticmroute_dest_window();
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("staticmroute_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "dest_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b) {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("staticmroute_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        if (recs.length == 1) {

                            if (recs[0].data.agw.length == 0) {
                                CP.staticmroute.delete_dest(recs[0]);
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
                                        CP.staticmroute.delete_dest(recs[0]);
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
                                        CP.staticmroute.delete_dest(recs[i]);
                                    }
                                    CP.ar_util.mySubmit();
                                }
                            });

                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
                            return true;
                        }
                        var g = Ext.getCmp("staticmroute_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
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

        var staticmroute_grid = {
            xtype               : "cp4_grid"
            ,id                 : "staticmroute_grid"
            ,width              : 600
            ,height             : 149
            ,forceFit           : true
            ,store              : Ext.getStore("dest_store")
            ,columns            : dest_cm
            ,selModel           : dest_selModel
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
            ,staticmroute_grid
        ];
    }

    ,open_staticmroute_dest_window                   : function() {
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
                        return !( CP.staticmroute.validMainPanel() );
                    }
					,handler: function(b, e) {
                                    var btn = Ext.getCmp("gw_add_btn");
                                    if (btn && btn.handle_no_token && btn.handle_no_token() ) {
                                        Ext.getCmp("gw_grid").getSelectionModel().deselectAll();
                                        CP.staticmroute.open_gw_window("a");
                                    }
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
                                CP.staticmroute.open_gw_window( String("e"+ r.data.type) );
                            }
                        }
                    }
                    ,disabledConditions : function() {
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
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
//                        var d_rec = Ext.getCmp("staticmroute_grid").getSelectionModel().getLastSelected();
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
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
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
            var staticmroute_grid = Ext.getCmp("staticmroute_grid");
            var dest_sm = staticmroute_grid.getSelectionModel();

            if (dest_sm.hasSelection()) {
                //edit
                var rec = dest_sm.getLastSelected();
                panel.loadRecord(rec);
                var gws = rec.data.agw;
                Ext.getStore("gw_store").loadData(gws);

                Ext.getCmp("route_display_entry").show();
                Ext.getCmp("route_entry").hide();
                Ext.getCmp("mask_entry").hide();
                Ext.getCmp("route_entry").disable();
                Ext.getCmp("mask_entry").disable();
                Ext.getCmp("dest_ipv4notation_set").setVisible(false);
                Ext.getCmp("dest_ipv4notation_set").setDisabled(true);

                if (rec.data.route == "default") {
                    Ext.getCmp("route_display_entry").setValue("Default");
                } else {
                    Ext.getCmp("route_display_entry").setValue(
                        rec.data.route +"/"+ rec.data.mask
                    );
                }

                var dest_window = Ext.getCmp("staticmroute_dest_window");
                dest_window.setTitle(
                    "Edit Destination Route: " + 
                    Ext.getCmp("route_display_entry").getValue());
                
            } else {
                //new
                Ext.getCmp("route_display_entry").setVisible(false);
                Ext.getCmp("route_display_entry").setDisabled(true);
                Ext.getCmp("route_entry").show();
                Ext.getCmp("mask_entry").show();
                Ext.getCmp("dest_ipv4notation_set").setVisible(true);
                Ext.getCmp("dest_ipv4notation_set").setDisabled(false);

                Ext.getStore("gw_store").removeAll();
                
                var dest_window = Ext.getCmp("staticmroute_dest_window");
            }
            if (panel.chkBtns) {
                panel.chkBtns();
            }
        }

        var dest_form = {
            xtype       : "cp4_formpanel"
            ,id         : "staticmroute_dest_form"
            ,autoScroll : false
			,height		: 330
            ,width      : 410  //410
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
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("staticmroute_dest_form");
                        if (f) {
                            return !f.getForm().isValid();
                        } else {
                            return true;
                        }
                        //return f ? !(f.getForm().isValid()) : true;
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
                        CP.ar_util.checkWindowClose("staticmroute_dest_window");
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
                                    xtype           : "cp4_ipv4notation"
                                    ,id             : "dest_ipv4notation"
                                    ,ipId           : "route_entry"
                                    ,ipName         : "route"
                                    ,ipLabel        : "Destination"
                                    ,notationId     : "mask_entry"
                                    ,notationName   : "mask"
                                    //,notationLabel  : ""
                                    ,allowBlank     : false
                                    ,fieldConfig    : {
                                        allowBlank      : false
                                    }
                                    ,networkMode    : true
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,id         : "gw_set"
                            ,margin     : 0
                            ,autoScroll : false
                            ,items      : [
                                {
                                    xtype           : "cp4_sectiontitle"
                                    ,titleText      : "Add Gateway"
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
                                                CP.ar_util.checkBtnsbar("staticmroute_dest_form");
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

        var staticmroute_dest_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "staticmroute_dest_window"
            ,title      : "Add Destination Route"
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ dest_form ]
        });
        Ext.getCmp("staticmroute_dest_window").show();

        function dest_save(b, e) {
            var params = CP.ar_util.getParams();
            var gw_st = Ext.getStore("gw_store");
            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":static-mroute";
            var mask_prefix;
            var gw_prefix;
            var selected_rec = null;
            var route;
            var mask;

            if (Ext.getCmp("staticmroute_grid").getSelectionModel().hasSelection()) {
                selected_rec = Ext.getCmp("staticmroute_grid").getSelectionModel().getLastSelected();
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
            } else {
                params[prefix + ":network:" + route] = "t";
                mask_prefix = prefix + ":network:" + route + ":masklen:" + mask;
            }
            params[mask_prefix] = "t";
            var prec_cmp = Ext.getCmp("precedence_entry");
            if (prec_cmp && prec_cmp.isValid()) {
                params[mask_prefix +":precedence"] = prec_cmp.getRawValue();
            }

            gw_prefix = mask_prefix + ":gateway";
            params[gw_prefix] = "t";
            var gw_recs = gw_st.getRange();
            var gw, i;
            var del_btn = Ext.getCmp("gw_delete_btn");
            var dArr = (del_btn ? del_btn.delArr : [] );
            for(i = 0; i < dArr.length; i++) {
                params[gw_prefix +":"+ dArr[i] ]                = "";
                params[gw_prefix +":"+ dArr[i] +":preference"]  = "";
            }
            
            var nexthop_ok = false;
            if (route == "default") {
                nexthop_ok = true;
            }
            
            for(i = 0; i < gw_recs.length; i++) {
                nexthop_ok = true;
                if (gw_recs[i].data.dirty) {
                    gw = gw_recs[i];
                    params[gw_prefix + ":address:" + gw.data.gw]                = "t";
                    params[gw_prefix + ":address:" + gw.data.gw + ":preference"]= gw.data.pref;
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
                            
                            CP.staticmroute.delete_dest(selected_rec);
                            CP.ar_util.mySubmit();
                        }
                    });                    
                }
                
                return;
            }
            
            CP.ar_util.mySubmit();
        }

        function validate_route(route, mask) {
            var i;
            var d_recs = Ext.getStore("dest_store").getRange();
            var r_octet = route.split(".",4);
            if (r_octet[0] > 223 && r_octet[0] < 240) {
                Ext.Msg.alert("Error"
                              ,"Destination cannot be multicast address");
                return false;
            }
            for(i = 0; i < d_recs.length; i++) {
                if (route == d_recs[i].data.route && mask == d_recs[i].data.mask) {
                    Ext.Msg.alert(
                        "Error: Destionation Route Already Exists."
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
            var prefix = "routed:instance:" + CP.ar_util.INSTANCE() + ":static-mroute";
            var mask_prefix;
            var gw_prefix;

            if (d_rec.data.route == "default") {
                mask_prefix = prefix + ":default";
            } else {
                mask_prefix = prefix + ":network:" + d_rec.data.route + ":masklen:" + d_rec.data.mask;
            }

            gw_prefix = mask_prefix + ":gateway:address:" + rec.data.gw;
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
                    ,octetsConfig   : [{
                        minValue    : 1
                        ,maxValue   : 255
                        ,validator  : function(value) {
                            if (value > 223 && value < 240) {
                                return 'IP Address is multicast';
                            } else {
                                return true;
                            }
                        }
                    },{ //second octet nothing to override
                    },{ //third octet nothing to override
                    },{ //last octet nothing to override
                    }]
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
                        if ( !( CP.staticmroute.validMainPanel() ) ) {
                            return true;
                        }
                        var f = Ext.getCmp("gw_form");
                        if (f) {
                            return !(f.getForm().isValid());
                        } else {
                            return true;
                        }
                        //return !(f ? f.getForm().isValid() : false);
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
                            ,width          : 160
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
                    var pos = Ext.getCmp("staticmroute_dest_window").getPosition();
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

            var r_octet = gw.split(".",4);
            //check if the gw is a broadcast address
            if (r_octet[0] == 255 && r_octet[0] == r_octet[1] &&
                r_octet[1] == r_octet[2] && r_octet[2] == r_octet[3]) {
                Ext.Msg.alert("Error"
                              ,"Gateway cannot be broadcast address");
                return false;
            }

            //check if the gw is an exact match on an interface address
            if (Ext.getCmp("gw_entry").xtype == "cp4_ipv4field") {
                var m = CP.addr_list.getMatchMessage(gw);
                if (m != "") {
                    Ext.Msg.alert("Warning", m);
                    return;
                }
            }
            switch( CP.staticmroute.check_exact_intf_list_match(gw) ) {
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
                var d_rec = Ext.getCmp("staticmroute_grid").getSelectionModel().getLastSelected();
                if (oldRec && d_rec) {
                    var prefix = "routed:instance:"+ CP.ar_util.INSTANCE() +":static-mroute";
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
    }

    ,check_exact_intf_list_match    : function(testAddr) {
        //return values
            // -2   invalid testAddr
            // -1   intf store not found
            //  1   testAddr exactly matches an interface in the list
            //  0   testAddr does not exactly match any interface
        var if_st = Ext.getStore("intf_store");
        var a4_list;
        if (testAddr == null || testAddr == "") {
            return -2;
        }
        if (!if_st) {
            return -1;
        }
        if ( if_st.findExact("intf",testAddr,0) > -1 ) {
            return 0; //testAddr is exact match of an intf name, which is fine
        }
        var intfs = if_st.getRange();
        var i = 0; var j = 0;
        for(i = 0; intfs && i < intfs.length; i++) {
            a4_list = intfs[i].data.addr4_list;
            for(j = 0; a4_list && j < a4_list.length; j++) {
                if (testAddr == a4_list[j].addr4) {
                    return 1;
                }
            }
        }
        return 0;
    }

}

