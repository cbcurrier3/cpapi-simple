/* Configures PBR Tables and Static routes for those tables */
CP.PBR_static = {
    INSTANCE                : "default"

//Constances
    ,PBR_TABLE_MAX_ID           : 255
    ,PBR_TABLE_MAX_DYNAMIC_ID   : 252

    ,PBR_TABLE_GRID_AUTOHEIGHT  : true
    ,PBR_TABLE_GRID_HEIGHT      : "auto"
    ,PBR_TABLE_GRID_WIDTH       : 400
    ,PBR_TABLE_GRID_STYLE       : "margin:0px;"

    ,PBR_TABLE_ADD_WIDTH        : 310

    ,PBR_STATIC_GRID_AUTOHEIGHT : true
    ,PBR_STATIC_GRID_HEIGHT     : "auto"
    ,PBR_STATIC_GRID_WIDTH      : 400
    ,PBR_STATIC_GRID_STYLE      : "margin:0px;"

    ,PBR_STATIC_MODAL_HEIGHT    : 400
    ,PBR_STATIC_MODAL_WIDTH     : 450
    ,PBR_STATIC_MODAL_AUTOHEIGHT: false
    ,PBR_STATIC_MODAL_LABELWIDTH: 150

    ,PBR_GW_GRID_AUTOHEIGHT     : true
    ,PBR_GW_GRID_HEIGHT         : "auto"
    ,PBR_GW_GRID_WIDTH          : 200
    ,PBR_GW_GRID_STYLE          : "margin:0px;"

    ,OPTION_INFO_INLINEMSG      : "<b>Normal:</b> Accept and forward packets.<br>"
                                + "<b>Reject:</b> Drop packets, and send <b>unreachable</b> messages.<br>"
                                + "<b>Black Hole:</b> Drop packets, but don't send <b>unreachable</b> messages."

    ,GW_WINDOW_HEIGHT           : "auto"
    ,GW_WINDOW_AUTOHEIGHT       : true
    ,GW_WINDOW_WIDTH            : 300

//state tracking globals
    ,PBR_TABLE_NAME             : ""

//init functions
    ,init                       : function() {
        var pbrMainPanel = new CP.WebUI.DataFormPanel({
            id          : "pbrMainPanel"
            ,listeners  : {
                destroy     : function(p) {
                    CP.PBR_static = {};
                }
            }
            ,defaults   : {
                submitValue     : false
            }
        });

        //Ext.QuickTips.enable();
        CP.PBR_static.defineStores();
        CP.PBR_static.PBRTable(pbrMainPanel);
        CP.PBR_static.PBRStaticRoute(pbrMainPanel);

        var obj = {
            title           : "Policy Tables"
            ,panel          : pbrMainPanel
            ,submit         : true
            ,submitURL      : "/cgi-bin/PBR_routetable.tcl?instance=" + CP.PBR_static.INSTANCE
            ,params         : { }
            ,afterSubmit    : CP.PBR_static.afterSubmit
            ,relatedLinks   : [{
            }]
        };
        CP.UI.updateDataPanel(obj);
    }

    ,defineStores               : function() {
        var routetable_st = new Ext.data.JsonStore({
            storeId     : "routetable_st"
            ,autoSave   : false
            ,autoLoad   : true
            ,url        : "/cgi-bin/PBR_routetable.tcl?instance=" + CP.PBR_static.INSTANCE
            ,root       : "data.tables"
            ,fields     : [
                {
                    name        : "id"
                    ,sortType   : function(v) {
                        if(v == 0) {
                            return 0;
                        }
                        if(v > CP.PBR_static.PBR_TABLE_MAX_DYNAMIC_ID) {
                            return parseInt(v);
                        }
                        return parseInt(v) + 300;
                    }
                }
                ,{name  : "table_name"}
                ,{name  : "inuse"}
            ]
            ,sortInfo   : {
                field       : "id"
                ,direction  : "ASC"
            }
            ,listeners  : {
                load        : function(st, recs, options) {
                    var t = st.recordType;
                    if(-1 == st.findExact("table_name","local") ) {
                        //add the local entry, 255
                        st.add(new t({
                                table_name  : "local"
                                ,id         : 255
                                ,dirty      : true
                                ,inuse      : ""
                            })
                        );
                    }
                    if(-1 == st.findExact("table_name","main") ) {
                        //add the main entry, 254
                        st.add(new t({
                                table_name  : "main"
                                ,id         : 254
                                ,dirty      : true
                                ,inuse      : ""
                            })
                        );
                    }
                    if(-1 == st.findExact("table_name","default") ) {
                        //add the default entry, 253
                        st.add(new t({
                                table_name  : "default"
                                ,id         : 253
                                ,dirty      : true
                                ,inuse      : ""
                            })
                        );
                    }
                    //if(-1 == st.findExact("table_name","all") ) { //add the all entry, #?  is it 0? }

                    if(st.getCount() >= CP.PBR_static.PBR_TABLE_MAX_ID) {
                        Ext.getCmp("pbr_table_btn_add").disable();
                    } else {
                        Ext.getCmp("pbr_table_btn_add").enable();
                    }

                    Ext.StoreMgr.lookup("static_route_st").removeAll();
                    st.sort("id","ASC");
                    //*
                    var table_name = CP.PBR_static.PBR_TABLE_NAME;
                    if(table_name != "") {
                        var index = st.findExact("table_name",table_name);
                        Ext.getCmp("pbr_table_grid").getSelectionModel().selectRow(index,false,false);
                        //CP.PBR_static.loadStaticRouteStore(table_name);
                    }
                    CP.PBR_static.PBR_TABLE_NAME = "";
                    // */
                }
                ,remove     : function(st, rec, index) {
                    if(st.getCount() >= CP.PBR_static.PBR_TABLE_MAX_ID) {
                        Ext.getCmp("pbr_table_btn_add").disable();
                    } else {
                        Ext.getCmp("pbr_table_btn_add").enable();
                    }
                }
            }
        });

        var static_route_st = new Ext.data.JsonStore({
            storeId     : "static_route_st"
            ,autoSave   : false
            ,autoLoad   : false
            ,proxy      : new Ext.data.HttpProxy({
                    url     : "/cgi-bin/PBR_static.tcl"
                    ,method : 'GET'
                })
            ,root       : "data.static_routes"
            ,fields     : [
                {
                    name        : "netaddress"
                    ,sortType   : function(value) {
                        if(value == "default") {
                            return 0;
                        }
                        var gw_p = value.split(".");
                        var retVal = 0;
                        for(var i = 0; i < gw_p.length; i++) {
                            retVal = parseInt(retVal) * 1000 + parseInt(gw_p[i]);
                        }
                        return retVal;
                    }
                }
                ,{name  : "masklen"}
                ,{name  : "option"}
                ,{name  : "gateways"}
            ]
            ,sortInfo   : {
                field       : "netaddress"
                ,direction  : "ASC"
            }
        });

        var gateways_st = new Ext.data.JsonStore({
            storeId     : "gateways_st"
            ,autoSave   : false
            ,autoLoad   : false
            ,root       : "data.gateways"
            ,fields     : [
                {name   : "gw"}
                ,{name  : "preference"}
                //,{name  : "mtu"}
                //,{name  : "advmss"}
                //,{name  : "rtt"}
                //,{name  : "rttvar"}
                //,{name  : "window"}
                //,{name  : "cwnd"}
                //,{name  : "initcwnd"}
                //,{name  : "ssthresh"}
                ,{name  : "gw_type"}    //a - address
                                        //l - logical interface
                ,{name  : "dirty"}      //to make sure preference is stored
            ]
            ,sortInfo   : {
                field       : "preference"
                ,direction  : "ASC"
            }
        });

        var interface_st = new Ext.data.JsonStore({
            storeId     : "interface_st"
            ,autoSave   : false
            ,autoLoad   : true
            ,url        : "/cgi-bin/intf-list.tcl?instance=" + CP.PBR_static.INSTANCE
            ,root       : "data.intfs"
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(v) {
                        if(v == "lo") {
                            return 0x7fffffff; //largest int?
                        }
                    }
                }
                ,{name  : "addr"}   //to compare against various gateways
                ,{name  : "addr4_list"}
            ]
            ,sortInfo   : {
                field       : "intf"
                ,direction  : "ASC"
            }
        });
    }

    ,loadStaticRouteStore       : function(table_name) {
        var store = Ext.StoreMgr.lookup("static_route_st");
        if(store) {
            store.load({
                params      : {
                    'table_name'    : table_name
                    ,'instance'     : CP.PBR_static.INSTANCE
                }
                ,callback   : null
                ,scope      : store
                ,add        : false
            });
        }
    }

//common functions
    ,clearParams                : function() {
        //clear params and return reference
        var myObj = CP.UI.getMyObj();
        if(myObj) {
            myObj.params = {};
            return (myObj.params);
        }
        return false;
    }

    ,mySubmit                   : function() {
        CP.UI.applyHandler( CP.UI.getMyObj() );
    }

    ,afterSubmit                : function() {
        //CP.PBR_static.PBR_TABLE_NAME
            //""        don't select a Policy Table on reload
            //#         find it and select it
            //routetable_st's reload handles the cases
        Ext.StoreMgr.lookup("routetable_st").reload();
        Ext.getCmp("pbr_static_btn_edit").gwDelArray = [];
        
        // Refresh the monitor tab with the new data
        if (CP && CP.PBR_monitor_4 && CP.PBR_monitor_4.doLoad) {
            CP.PBR_monitor_4.doLoad();
        }                                                                                                                                                       
    }

//PBR TABLE
    ,PBRTable                   : function(panel) {
        var pbrFieldSet = new CP.WebUI.FieldSet({
            id          : "pbrFieldSet"
            ,items      : [
                {
                    xtype       : "cp_sectiontitle"
                    ,titleText  : "Policy Route Tables"
                },{
                    xtype       : "cp_btnsbar"
                    ,items      : [
                        {
                            text        : "Add"
                            ,id         : "pbr_table_btn_add"
                            ,handler    : function(b, e) {
                                pbr_table_add();
                            }
                        },{
                            text        : "Delete"
                            ,id         : "pbr_table_btn_delete"
                            ,disabled   : true
                            ,handler    : function(b, e) {
                                pbr_table_delete();
                            }
                        }
                    ]
                }
            ]
        });

        function inUseRenderer(value, meta, rec, row, col, st) {
            if(value) {
                return "In Use";
            }
            return "";
        }

        var pbr_table_cm = new Ext.grid.ColumnModel({
            defaults    : {
                submitValue     : false
                ,menuDisabled   : true
                ,sortable       : false
            }
            ,columns    : [
                {
                    header      : "ID"
                    ,dataIndex  : "id"
                    ,id         : "id_pbr_table_col"
                },{
                    header      : "Table"
                    ,dataIndex  : "table_name"
                    ,id         : "table_name_pbr_table_col"
                },{
                    header      : "In Use By Rules"
                    ,dataIndex  : "inuse"
                    ,id         : "inuse_pbr_table_col"
                    ,tooltip    : "This policy can't be deleted because one or"
                                + " more Policy Rules is using this table."
                    //,renderer   : inUseRenderer
                }
            ]
        });

        var pbr_table_sm = new Ext.grid.RowSelectionModel({
            singleSelect    : true
            ,listeners      : {
                rowselect           : function(sm, row, table_rec) {
                    var sr_st = Ext.StoreMgr.lookup("static_route_st");
                    var gw_st = Ext.StoreMgr.lookup("gateways_st");
                    sr_st.removeAll();
                    gw_st.removeAll();

                    //policy table handler
                    if(table_rec.data.inuse == "") {
                        Ext.getCmp("pbr_table_btn_delete").enable();
                    } else {
                        Ext.getCmp("pbr_table_btn_delete").disable();
                    }

                    //static handler
                    if(Ext.getCmp("pbr_static_btn_edit")) {
                        Ext.getCmp("pbr_static_btn_edit").gwDelArray = [];
                        Ext.getCmp("pbr_static_grid").getSelectionModel().clearSelections();
                        CP.PBR_static.loadStaticRouteStore(table_rec.data.table_name);
                        //enable static route add button
                        Ext.getCmp("pbr_static_btn_add").enable();
                        Ext.getCmp("pbr_static_btn_edit").disable();
                        Ext.getCmp("pbr_static_btn_delete").disable();
                    }
                }
                ,rowdeselect        : function(sm, row, table_rec) {
                    Ext.getCmp("pbr_table_btn_delete").disable();
                    Ext.StoreMgr.lookup("static_route_st").removeAll();
                    Ext.StoreMgr.lookup("gateways_st").removeAll();
                    if(Ext.getCmp("pbr_static_btn_edit")) {
                        Ext.getCmp("pbr_static_btn_add").disable();
                        Ext.getCmp("pbr_static_btn_edit").disable();
                        Ext.getCmp("pbr_static_btn_delete").disable();
                    }
                }
            }
        });

        var pbr_table_grid = new CP.WebUI.EditorGridPanel({
            id              : "pbr_table_grid"
            ,autoScroll     : true
            ,autoHeight     : CP.PBR_static.PBR_TABLE_GRID_AUTOHEIGHT
            ,height         : CP.PBR_static.PBR_TABLE_GRID_HEIGHT
            ,width          : CP.PBR_static.PBR_TABLE_GRID_WIDTH
            ,stripeRows     : true
            ,loadMask       : true
            ,store          : Ext.StoreMgr.lookup("routetable_st")
            ,cm             : pbr_table_cm
            ,sm             : pbr_table_sm
            ,style          : CP.PBR_static.PBR_TABLE_GRID_STYLE
            ,viewConfig     : {
                scrollOffset    : 0
                ,forceFit       : true
                ,emptyText      : "No Policy Routes."
            }
            ,enableColumnMove: false
        });
        pbrFieldSet.add(pbr_table_grid);

        //add pbrFieldSet to panel
        panel.add(pbrFieldSet);

        //functions
        function pbr_table_add() {
            CP.PBR_static.addNewPolicyTable();
        }

        function pbr_table_delete() {
            CP.PBR_static.delete_PBR_TABLE(
                Ext.getCmp("pbr_table_grid").getSelectionModel().getSelected()
            );
        }
    }

    ,addNewPolicyTable          : function() {
        if( !Ext.getCmp("add_pbr_table_window") ) {
            var add_pbr_table_window = new CP.WebUI.ModalWin({
                id              : "add_pbr_table_window"
                ,title          : "Add Policy Table"
                ,width          : "auto"
                ,height         : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close(); }
                ,listeners      : {
                    show    : function(win) {
                        win.setPosition(225,100);
                    }
                }
                ,items          : [
                    {
                        xtype           : "cp_formpanel"
                        ,id             : "add_pbr_table_form"
                        ,padding        : 15
                        ,autoHeight     : true
                        ,height         : "auto"
                        ,width          : CP.PBR_static.PBR_TABLE_ADD_WIDTH
                        ,labelWidth     : 100
                        ,monitorValid   : true
                        ,listeners      : {
                            clientvalidation    : function(p, v) {
                                if(v) {
                                    Ext.getCmp("add_pbr_table_btn_save").enable();
                                } else {
                                    Ext.getCmp("add_pbr_table_btn_save").disable();
                                }
                            }
                            ,afterrender        : function(p) {
                                Ext.getCmp("table_name_entry").setValue("");
                                //calculate available id
                                var available_id = 1;
                                Ext.StoreMgr.lookup("routetable_st").each(function(rec) {
                                    //store is sorted by ID (starting with 1)
                                    if(available_id == rec.data.id) {
                                        available_id++;
                                    }
                                });
                                if(available_id <= CP.PBR_static.PBR_TABLE_MAX_DYNAMIC_ID) {
                                    Ext.getCmp("id_entry").setValue(available_id);
                                }
                            }
                        }
                        ,fbar           : {
                            xtype   : "toolbar"
                            ,items  : [
                                {
                                    id          : "add_pbr_table_btn_save"
                                    ,text       : "Save"
                                    ,disabled   : true
                                    ,handler    : function(b, e) {
                                        add_pbr_table_save();
                                    }
                                },{
                                    id          : "add_pbr_table_btn_cancel"
                                    ,text       : "Cancel"
                                    ,handler    : function(b, e) {
                                        Ext.getCmp("add_pbr_table_window").close();
                                    }
                                }
                            ]
                        }
                        ,items          : [
                            {
                                xtype       : "cp_textfield"
                                ,fieldLabel : "Table Name"
                                ,name       : "table_name"
                                ,id         : "table_name_entry"
                                ,allowBlank : false
                                ,validator  : function(value) {
                                    if(value == "") {
                                        return "This field is required.";
                                    }
                                    var duplicate = false;
                                    Ext.StoreMgr.lookup("routetable_st").each(function(rec) {
                                        if(value == rec.data.table_name) {
                                            duplicate = true;
                                        }
                                    });
                                    if(duplicate) {
                                        return "This field must be unique.";
                                    }
                                    var illegalCharacters = [" ", ".", ":"];
                                    for(var i = 0; i < illegalCharacters.length; i++) {
                                        if(-1 < value.indexOf(illegalCharacters[i])) {
                                            return 'This field may not include \" \", \".\", or \":\" characters.';
                                        }
                                    }
                                    return true;
                                }
                            },{
                                xtype       : "cp_displayfield"
                                ,fieldLabel : "<div qtip='This value is dynamically generated.'>ID:</div>"
                                ,labelSeparator: ""
                                ,name       : "id"
                                ,id         : "id_entry"
                            }
                        ]
                    }
                ]
            });
        }
        Ext.getCmp("add_pbr_table_window").show();

        //functions
        function add_pbr_table_save() {
            var st = Ext.StoreMgr.lookup("routetable_st");
            var t = st.recordType;
            var rec = new t({ });
            Ext.getCmp("add_pbr_table_form").getForm().updateRecord(rec);
            Ext.getCmp("add_pbr_table_window").close();
            //initiate save
            CP.PBR_static.save_PBR_TABLE(rec);
        }
    }

    ,save_PBR_TABLE             : function(table_rec) {
        //add a new PBR table
        var params = CP.PBR_static.clearParams();
        if(params != false) {
            CP.PBR_static.build_Bindings_PBR_TABLE(table_rec, params);
            CP.PBR_static.PBR_TABLE_NAME = table_rec.data.table_name;
            CP.PBR_static.mySubmit();
        }
    }

    ,build_Bindings_PBR_TABLE    : function(table_rec, params) {
        var prefix = "routed:instance:"+CP.PBR_static.INSTANCE+":pbrtables:table:"+table_rec.data.table_name;
        params[ prefix          ] = "t";
        params[ prefix + ":id"  ] = table_rec.data.id;
        return prefix;
    }

    ,delete_PBR_TABLE           : function(table_rec) {
        if(table_rec.data.inuse != "") {
            //shouldn't ever happen, but just in case
            return;
        }
        var prefix = "routed:instance:" + CP.PBR_static.INSTANCE + ":pbrtables:table:" + table_rec.data.table_name;
        var params = CP.PBR_static.clearParams();
        if(params != false) {
            params[ prefix ]            = "";
            params[ prefix + ":id" ]    = "";
            CP.PBR_static.PBR_TABLE_NAME= "";
            CP.PBR_static.mySubmit();
        }
    }

// */

//PBR STATIC ROUTES
    ,PBRStaticRoute             : function(panel) {
        var pbr_static_fieldset = new CP.WebUI.FieldSet({
            id      : "pbr_static_fieldset"
            ,items  : [
                {
                    xtype       : "cp_sectiontitle"
                    ,titleText  : "Policy Static Routes"
                },{
                    xtype       : "cp_btnsbar"
                    ,items      : [
                        {
                            text        : "Add"
                            ,id         : "pbr_static_btn_add"
                            ,disabled   : true
                            ,handler    : function(b, e) {
                                Ext.getCmp("pbr_static_grid").getSelectionModel().clearSelections();
                                pbr_static_addedit();
                            }
                        },{
                            text        : "Edit"
                            ,id         : "pbr_static_btn_edit"
                            ,disabled   : true
                            ,gwDelArray : []
                            ,handler    : function(b, e) {
                                pbr_static_addedit();
                            }
                        },{
                            text        : "Delete"
                            ,id         : "pbr_static_btn_delete"
                            ,disabled   : true
                            ,handler    : function(b, e) {
                                pbr_static_delete();
                            }
                        }
                    ]
                }
            ]
        });

        function showRoute(val, meta, rec, row, col, st) {
            if(val != "default") {
                if(rec.data.masklen) {
                    return val + "/" + rec.data.masklen;
                }
                return val;
            }
            return "Default"
        }

        function showNHType(val, meta, rec, row, col, st) {
            switch(val) {
                case    "blackhole":    return "Blackhole";
                case    "reject":       return "Reject";
                default:                return "Normal";
            }
        }

        function showGateways(gwArray, meta, rec, row, col, st) {
            var retText = "";
            if(gwArray == null) {
                return "";
            }
            switch(gwArray.length) {
                case 0:     return "";
                case 1:     return gwArray[0].gw;
                default:
                    return gwArray[0].gw + " (+" + (gwArray.length - 1) + " more)";
            }
        }

        function showGateways2(gwArray, meta, rec, row, col, st) {
            var retText = "";
            if(gwArray == null) {
                return "";
            }
            switch(gwArray.length) {
                case 0:     return "";
                case 1:     return gwArray[0].gw;
                default:
                    retText = gwArray[0].gw;
                    for(var i = 1; i < gwArray.length; i++) {
                        retText += "<br>" + gwArray[i].gw;
                    }
            }
            return '<div style="white-space:pre-wrap !important;">' + retText + '</div>';
        }

        var pbr_static_cm = new Ext.grid.ColumnModel({
            defaults    : {
                menuDisabled    : true
                ,submitValue    : false
                ,editable       : false
                ,sortable       : true
            }
            ,columns    : [
                {
                    header      : "Destination"
                    ,dataIndex  : "netaddress"
                    ,id         : "netaddress_pbr_static_col"
                    ,width      : 130
                    ,fixed      : true
                    ,renderer   : showRoute
                },{
                    header      : "Next Hop Type"
                    ,dataIndex  : "option"
                    ,id         : "option_pbr_static_col"
                    ,width      : 110
                    ,fixed      : true
                    ,renderer   : showNHType
                },{
                    header      : "Gateway"
                    ,dataIndex  : "gateways"
                    ,id         : "gateways_pbr_static_col"
                    ,width      : 150
                    ,fixed      : false
                    ,renderer   : showGateways
                }
            ]
        });

        var pbr_static_sm = new Ext.grid.RowSelectionModel({
            singleSelect    : true
            ,listeners      : {
                selectionchange     : function(sm) {
                    if(sm.hasSelection()) {
                        Ext.getCmp("pbr_static_btn_edit").enable();
                        Ext.getCmp("pbr_static_btn_delete").enable();
                    } else {
                        Ext.getCmp("pbr_static_btn_edit").disable();
                        Ext.getCmp("pbr_static_btn_delete").disable();
                    }
                }
            }
        });

        var pbr_static_grid = new CP.WebUI.EditorGridPanel({
            id              : "pbr_static_grid"
            ,autoScroll     : true
            ,autoHeight     : CP.PBR_static.PBR_STATIC_GRID_AUTOHEIGHT
            ,height         : CP.PBR_static.PBR_STATIC_GRID_HEIGHT
            ,width          : CP.PBR_static.PBR_STATIC_GRID_WIDTH
            ,stripeRows     : true
            ,loadMask       : true
            ,store          : Ext.StoreMgr.lookup("static_route_st")
            ,cm             : pbr_static_cm
            ,sm             : pbr_static_sm
            ,style          : CP.PBR_static.PBR_STATIC_GRID_STYLE
            ,viewConfig     : {
                scrollOffset    : 0
                ,forceFit       : true
                ,emptyText      : "Select a Policy Table to view its Static Routes."
            }
            ,enableColumnMove: false
            ,listeners      : {
                rowdblclick     : function(g, row, e) {
                    g.getSelectionModel().selectRow(row, false);
                    pbr_static_addedit();
                }
            }
        });

        pbr_static_fieldset.add(pbr_static_grid);
        panel.add(pbr_static_fieldset);

        //functions
        function pbr_static_addedit() {
            CP.PBR_static.StaticRouteModalWindow();
        }

        function pbr_static_delete() {  //delete a whole route
            //1. get myObj.params and clear them
            var params = CP.PBR_static.clearParams();
            //2. get table_rec and sr_rec
            var table_rec = Ext.getCmp("pbr_table_grid").getSelectionModel().getSelected();
            var sr_rec = Ext.getCmp("pbr_static_grid").getSelectionModel().getSelected();
            //3. if table_rec and sr_rec exist
            if(table_rec && sr_rec) {
                //state value
                CP.PBR_static.PBR_TABLE_NAME = table_rec.data.table_name;

                //make bindings
                var prefix = "routed:instance:" + CP.PBR_static.INSTANCE;
                prefix += ":pbrtables:table:" + table_rec.data.table_name;

                if(sr_rec.data.netaddress == "default") {
                    prefix += ":static:default";
                } else {
                    prefix += ":static:network:" + sr_rec.data.netaddress;
                }
                //PBR's binding handler is supposed to be able to self-recursively delete
                //so just get rid of
                params[ prefix ] = "";
                CP.PBR_static.mySubmit();
            } else {
                //else error message
                var pbr_static_delete_message = "";
                if(!table_rec) {
                    pbr_static_delete_message += "Please Select a Policy Table.";
                }
                if(!table_rec && !sr_rec) {
                    pbr_static_delete_message += "<br>";
                }
                if(!sr_rec) {
                    pbr_static_delete_message += "Please Select a Static Route Destination.";
                }
                Ext.Msg.alert("Erorr: Missing Selections",pbr_static_delete_message);
            }
        }
    }
// */

    ,StaticRouteModalWindow     : function() {
        if( !( Ext.getCmp("SR_ModalWindow") ) ) {
            var gw_cm = getGatewayCM();
            var gw_sm = getGatewaySM();
            var gw_grid = getGatewayGrid(gw_cm, gw_sm);

            var SR_Modal_form = new CP.WebUI.FormPanel({
                id              : "SR_Modal_form"
                ,padding        : 15
                ,height         : CP.PBR_static.PBR_STATIC_MODAL_HEIGHT
                ,width          : CP.PBR_static.PBR_STATIC_MODAL_WIDTH
                ,autoHeight     : CP.PBR_static.PBR_STATIC_MODAL_AUTOHEIGHT
                ,autoScroll     : true
                ,draggable      : false
                ,labelWidth     : CP.PBR_static.PBR_STATIC_MODAL_LABELWIDTH
                ,monitorValid   : true
                ,defaults       : {
                    submitValue     : false
                }
                ,listeners      : {
                    clientvalidation    : sr_clientvalidation
                    ,afterrender        : sr_afterrender
                }
                ,fbar           : {
                    xtype   : "toolbar"
                    ,items  : [
                        {
                            xtype       : "cp_button"
                            ,text       : "Save"
                            ,id         : "sr_save_btn"
                            ,disabled   : true
                            ,handler    : sr_save
                        },{
                            xtype       : "cp_button"
                            ,text       : "Cancel"
                            ,id         : "sr_cancel_btn"
                            ,handler    : sr_cancel
                        }
                    ]
                }
                ,items          : [
                    {
                        xtype           : "cp_ipv4notation"
                        ,width          : 400
                        ,fieldConfig    : {
                            id              : "netaddress_sr_entry"
                            ,name           : "netaddress"
                            ,label          : "Destination"
                            ,ipNotationId   : "masklen_sr_entry"
                            ,ipNotationName : "masklen"
                        }
                    },{
                        xtype           : "cp_displayfield"
                        ,fieldLabel     : "Destination"
                        ,id             : "default_destination"
                        ,value          : "Default"
                        ,width          : 100
                    },{
                        xtype           : "cp_combobox"
                        ,fieldLabel     : "Next Hop Type"
                        ,id             : "option_sr_entry"
                        ,name           : "option"
                        ,width          : 100
                        ,mode           : "local"
                        ,value          : ""
                        ,editable       : false
                        ,triggerAction  : "all"
                        ,store          : [ [""             ,"Normal"]
                                            ,["blackhole"   ,"Blackhole"]
                                            ,["reject"      ,"Reject"] ]
                    },{
                        xtype           : "cp_inlinemsg"
                        ,type           : "info"
                        ,id             : "option_info_inlinemsg"
                        ,style          : "margin-bottom:10px;"
                        ,text           : CP.PBR_static.OPTION_INFO_INLINEMSG
                    },{
                        xtype           : "cp_sectiontitle"
                        ,titleText      : "Add Gateway"
                        ,style          : "margin-top:20px;margin-bottom:5px;margin-right:0px;"
                    },{
                        xtype           : "cp_btnsbar"
                        ,items          : [
                            {
                                text        : "Add Gateway"
                                ,menu       : {
                                    style       : {overflow: "visible"}
                                    ,xtype      : "menu"
                                    ,plain      : true
                                    ,items      : [
                                        {
                                            text        : "IP Address"
                                            ,iconCls    : "element"
                                            ,handler    : CP.PBR_static.gwAddIPAddress
                                        },{
                                            text        : "Network Interface"
                                            ,iconCls    : "element"
                                            ,handler    : CP.PBR_static.gwAddInterface
                                        }
                                    ]
                                }
                            },{
                                xtype       : "cp_button"
                                ,text       : "Edit"
                                ,id         : "edit_a_gw_btn"
                                ,disabled   : true
                                ,handler    : CP.PBR_static.edit_a_gw
                            },{
                                xtype       : "cp_button"
                                ,text       : "Delete"
                                ,id         : "delete_a_gw_btn"
                                ,disabled   : true
                                ,handler    : delete_a_gw
                            }
                        ]
                    }
                    ,gw_grid
                ]
            });

            var SR_ModalWindow = new CP.WebUI.ModalWin({
                id              : "SR_ModalWindow"
                ,title          : "placeholder"
                ,height         : "auto"
                ,width          : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close(); }
                ,listeners      : {
                    show    : function(win) {
                        win.setPosition(225,100);
                    }
                    ,close  : function(win) {
                        Ext.getCmp("pbr_static_grid").getSelectionModel().clearSelections();
                    }
                }
                ,items          : [ SR_Modal_form ]
            });
        }
        Ext.getCmp("SR_ModalWindow").show();

        //functions
        function sr_clientvalidation(panel, valid) {
            //validation for formpanel
            var netaddress = Ext.getCmp("netaddress_sr_entry");
            var masklen = Ext.getCmp("masklen_sr_entry");

            if(validate_route(netaddress, masklen, valid)) {
                netaddress.clearInvalid();
                Ext.getCmp("sr_save_btn").enable();
            } else {
                Ext.getCmp("sr_save_btn").disable();
            }
        }

        function validate_route(netaddress, masklen, valid) {
            //1 check netaddress
            //2 check masklen
            //3 compare netaddress and masklen
                //what if netaddress is default

            if(netaddress.disabled) {
                //this is an edit, so resort to valid
                return valid;
            }

            //check netaddress
            if( fullIPv4( netaddress.getValue() ) ) {
                //netaddress has 4 values

                if(netaddress.getValue() == "0.0.0.0") {
                    //trying to copy the default route
                    netaddress.markInvalid(
                        "0.0.0.0/0 is the Default route.  "
                        + "To make changes to it, please close this window and "
                        + "open the existing Default route."
                    );
                    valid = false;
                } else {
                    if( !compareToSubnetMask( netaddress, masklen ) ) {
                        //if mask fails to cover the address
                        //masklength is marked invalid
                        if(masklen.getXType() == "cp_masklength") {
                            netaddress.markInvalid("Destination must be within the mask length.");
                        } else {
                            netaddress.markInvalid("Destination must be covered by the subnet mask.");
                        }
                        valid = false;
                    } else {
                        //only fall through that doesn't cause invalid
                        netaddress.clearInvalid();
                    }
                }
            } else {
                netaddress.markInvalid("Valid IPv4 Address expected.");
                valid = false;
            }
            return valid;
        }

        function fullIPv4( address ) {
            //are all 4 values filled with in range values?
            octets = address.split(".",4);
            for(var i = 0; i < 4; i++) {
                if(octets[i] == "" || octets < 0 || octets > 255) {
                    return false;
                }
            }
            return true;
        }

        function compareToSubnetMask(net, masklength) {
            //check if the mask covers the netaddress
            var Mask = "";
            var Net = net.getValue().split(".",4);
            var ml = masklength.getValue();

            if(ml == "") {
                masklength.markInvalid("This field is required.");
                return false;
            } else if(ml < 0 || ml > 32) {
                marklength.markInvalid();
            }
            masklength.clearInvalid();
            for(var i = 0; i < 4; i++) {
                if(ml < 0) {
                    ml = 0;
                }
                switch( ml ) {
                    case 0:     Mask = "0";         break;
                    case 1:     Mask = "128";       break;
                    case 2:     Mask = "192";       break;
                    case 3:     Mask = "224";       break;
                    case 4:     Mask = "240";       break;
                    case 5:     Mask = "248";       break;
                    case 6:     Mask = "252";       break;
                    case 7:     Mask = "254";       break;
                    case 8:     Mask = "255";       break;
                    default:    Mask = "255";
                }
                if( (Mask & (Net[i])) != Net[i] ) {
                    return false;
                }
                ml -= 8;
            }

            return true;
        }

        function sr_afterrender(p) {
            //load values
            var gw_st = Ext.StoreMgr.lookup("gateways_st");
            gw_st.removeAll();
            if(Ext.getCmp("pbr_static_grid").getSelectionModel().hasSelection()) {
                //Edit
                var rec = Ext.getCmp("pbr_static_grid").getSelectionModel().getSelected();

                Ext.getCmp("SR_Modal_form").getForm().loadRecord( rec );
                if(rec.data.gateways) {
                    gw_st.loadData(rec);
                }

                if(rec.data.netaddress == "default") {
                    //netaddress = default
                    CP.util.show("default_destination");
                    //CP.util.hide("netaddress_sr_entry");
                    //CP.util.hide("masklen_sr_entry");
                    Ext.getCmp("netaddress_sr_entry" + "parent").hide();
                    Ext.getCmp("SR_ModalWindow").setTitle("Edit Default Static Route (0.0.0.0/0)");
                } else {
                    //netaddress = is something else!
                    CP.util.hide("default_destination");
                    //CP.util.show("netaddress_sr_entry");
                    //CP.util.show("masklen_sr_entry");
                    Ext.getCmp("netaddress_sr_entry" + "parent").show();
                    Ext.getCmp("SR_ModalWindow").setTitle("Edit Static Route " + rec.data.netaddress + "/" + rec.data.masklen);
                    Ext.getCmp("netaddress_sr_entry").setValue(rec.data.netaddress);
                    Ext.getCmp("masklen_sr_entry").setValue(rec.data.masklen);
                }
                Ext.getCmp("netaddress_sr_entry").disable();
                Ext.getCmp("masklen_sr_entry").disable();
            } else {
                //New
                CP.util.hide("default_destination");
                Ext.getCmp("netaddress_sr_entry").enable();
                Ext.getCmp("masklen_sr_entry").enable();
                CP.util.show("netaddress_sr_entry");
                CP.util.show("masklen_sr_entry");
                Ext.getCmp("SR_ModalWindow").setTitle("Add Static Route");
            }
        }

        function sr_save(b, e) {
            //activate submit, might have to push table data

            //Ext.getCmp("pbr_static_btn_edit").gwDelArray

            //"SR_ModalWindow"
            //"SR_Modal_form"

            //1.  Clear myObj.params and get it
            var params = CP.PBR_static.clearParams();

            //2.  Get prefix (it will push the table if it is new)
            var table_rec = Ext.getCmp("pbr_table_grid").getSelectionModel().getSelected();
            var prefix = CP.PBR_static.build_Bindings_PBR_TABLE(table_rec, params);
            CP.PBR_static.PBR_TABLE_NAME = table_rec.data.table_name;

            //3.  Destination Values
            var netaddress      = Ext.getCmp("netaddress_sr_entry").getValue();
            var masklength      = Ext.getCmp("masklen_sr_entry").getValue();
            var option          = Ext.getCmp("option_sr_entry").getValue();
            var static_prefix   = prefix + ":static";
            var mask_prefix     = "";

            if(netaddress == "default") {
                //handle default
                mask_prefix = static_prefix + ":default";
            } else {
                //handle network address
                params[ static_prefix + ":network:" + netaddress ] = "t";
                mask_prefix = static_prefix + ":network:" + netaddress
                            + ":masklen:" + masklength;
            }
            params[ mask_prefix ] = "t";
            params[ mask_prefix + ":options" ] = option;
            var gateway_prefix = mask_prefix + ":gateway";

            //4.  handle deletes
            var DelArray = Ext.getCmp("pbr_static_btn_edit").gwDelArray;
            if(DelArray.length > 0) {
                params[ gateway_prefix ] = "";
                for(var i = 0; i < DelArray.length; i++) {
                    params[ gateway_prefix + DelArray[i] ]  = "";
                    params[ DelArray[i] ]                   = "";
                }
            }

            //5.  handle gateways
            var gw_st = Ext.StoreMgr.lookup("gateways_st");
            if(gw_st.getCount() > 0) {
                gw_st.each(function(gw_rec) {
                    params[ gateway_prefix ] = "t";
                    if( gw_rec.data.dirty || gw_rec.dirty ) {
                        var gw_prefix = gateway_prefix;
                        if(gw_rec.data.gw_type == "a") {
                            gw_prefix += ":address:" + gw_rec.data.gw;
                        } else if(gw_rec.data.gw_type == "l") {
                            gw_prefix += ":lname:" + gw_rec.data.gw;
                        }
                        params[ gw_prefix ]                 = "t";
                        params[ gw_prefix + ":preference" ] = gw_rec.data.preference;
                    }
                });
            }

            Ext.getCmp("SR_ModalWindow").close();
            CP.PBR_static.mySubmit();
        }

        function sr_cancel(b, e) {
            //clean up delArray
            Ext.getCmp("pbr_static_btn_edit").gwDelArray = [];
            Ext.getCmp("SR_ModalWindow").close();
        }

        function delete_a_gw(b, e) {
            //add a gw to the delete array, then remove for store
            var rec = Ext.getCmp("gw_grid").getSelectionModel().getSelected();
            if( Ext.getCmp("pbr_static_grid").getSelectionModel().hasSelection() ) {
                //this is an edit
                DelArray = Ext.getCmp("pbr_static_btn_edit").gwDelArray;
                //array of binding suffixes?
                var temp = "";
                if(rec.data.gw_type == "a") {
                    temp = ":address:" + rec.data.gw;
                    DelArray[DelArray.length] = temp;
                } else if(rec.data.gw_type == "l") {
                    temp = ":lname:" + rec.data.gw;
                    DelArray[DelArray.length] = temp;
                } else {
                    //?  try both?
                    temp = ":address:" + rec.data.gw;
                    DelArray[DelArray.length] = temp;
                    temp = ":lname:" + rec.data.gw;
                    DelArray[DelArray.length] = temp;
                }
            }
            Ext.getCmp("gw_grid").getStore().remove(rec);
        }

        //CONSTRUCTORS
        function getGatewayCM() {
            function basicGWRenderer(value, meta, rec, row, col, st) {
                return '<div qtip="' + value + '">' + value + '</div>';
            }

            return new Ext.grid.ColumnModel({
                defaults    : {
                    menuDisabled    : true
                    ,sortable       : true
                }
                ,columns    : [
                    {
                        header      : "Gateway"
                        ,tooltip    : "Gateway"
                        ,dataIndex  : "gw"
                        ,id         : "gw_gw_col"
                        ,width      : 100
                        ,editable   : false
                        ,renderer   : basicGWRenderer
                    },{
                        header      : "Priority"
                        ,tooltip    : "Priority"
                        ,dataIndex  : "preference"
                        ,id         : "preference_gw_col"
                        ,width      : 50
                        ,renderer   : basicGWRenderer
                    }
                ]
            });
        }

        function getGatewaySM() {
            return new Ext.grid.RowSelectionModel({
                singleSelect    : true
                ,listeners      : {
                    rowselect       : function(sm, row, rec) {
                        Ext.getCmp("edit_a_gw_btn").enable();
                        Ext.getCmp("delete_a_gw_btn").enable();
                    }
                    ,rowdeselect    : function(sm, row, rec) {
                        Ext.getCmp("edit_a_gw_btn").disable();
                        Ext.getCmp("delete_a_gw_btn").disable();
                    }
                }
            });
        }

        function getGatewayGrid(gw_cm, gw_sm) {
            return new CP.WebUI.EditorGridPanel({
                id              : "gw_grid"
                ,autoScroll     : true
                ,autoHeight     : CP.PBR_static.PBR_GW_GRID_AUTOHEIGHT
                ,height         : CP.PBR_static.PBR_GW_GRID_HEIGHT
                ,width          : CP.PBR_static.PBR_GW_GRID_WIDTH
                ,stripeRows     : true
                ,loadMask       : true
                ,store          : Ext.StoreMgr.lookup("gateways_st")
                ,cm             : gw_cm
                ,sm             : gw_sm
                ,style          : CP.PBR_static.PBR_GW_GRID_STYLE
                ,viewConfig     : {
                    scrollOffset    : 0
                    ,forceFit       : true
                    ,emptyText      : "No Gateways."
                }
                ,enableColumnMove: false
                ,listeners      : {
                    rowdblclick     : function(g, row, e) {
                        g.getSelectionModel().selectRow(row, false);
                        CP.PBR_static.edit_a_gw();
                    }
                }
            });
        }
    }
// */

    ,gwAddIPAddress             : function(b, e) {
        if(!(Ext.getCmp("add_ip_gw_window"))) {
            var add_ip_gw_window = new CP.WebUI.ModalWin({
                id              : "add_ip_gw_window"
                ,title          : "Add IP Gateway"
                ,width          : "auto"
                ,height         : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close() }
                ,listeners      : {
                    show    : function(win) {
                        win.setHeight("auto");
                        win.setWidth("auto");
                        win.setPosition(225,100);
                    }
                }
                ,items          : [
                    {
                        xtype           : "cp_formpanel"
                        ,id             : "add_ip_gw_form"
                        ,height         : CP.PBR_static.GW_WINDOW_HEIGHT
                        ,autoHeight     : CP.PBR_static.GW_WINDOW_AUTOHEIGHT
                        ,width          : CP.PBR_static.GW_WINDOW_WIDTH
                        ,draggable      : false
                        ,monitorValid   : true
                        ,padding        : 15
                        ,listeners      : {
                            clientvalidation    : function(p, v) {
                                if(validateAddIPGW(v)) {
                                    Ext.getCmp("save_ip_gw_btn").enable();
                                } else {
                                    Ext.getCmp("save_ip_gw_btn").disable();
                                }
                            }
                            ,afterrender        : function(p) {
                                Ext.getCmp("preference_ip_entry").setValue(CP.PBR_static.getMinPriority());
                            }
                        }
                        ,fbar           : {
                            xtype           : "toolbar"
                            ,items          : [
                                {
                                    xtype       : "cp_button"
                                    ,text       : "Save"
                                    ,id         : "save_ip_gw_btn"
                                    ,disabled   : true
                                    ,handler    : save_ip_gw_add
                                },{
                                    xtype       : "cp_button"
                                    ,text       : "Cancel"
                                    ,id         : "cancel_ip_gw_btn"
                                    ,handler    : function(b, e) {
                                        Ext.getCmp("add_ip_gw_window").close();
                                    }
                                }
                            ]
                        }
                        ,items          : [
                            {
                                xtype           : "cp_ipv4field"
                                ,fieldConfig    : {
                                    id          : "gw_ip_entry"
                                    ,name       : "gw"
                                    ,label      : "Gateway"
                                }
                            },{
                                xtype           : "cp_displayfield"
                                ,fieldLabel     : "gw_type"
                                ,id             : "gw_type_ip_entry"
                                ,name           : "gw_type"
                                ,hidden         : true
                                ,hideLabel      : true
                                ,value          : "a"
                            },{
                                xtype           : "cp_combobox"
                                ,fieldLabel     : "Priority"
                                ,id             : "preference_ip_entry"
                                ,name           : "preference"
                                ,triggerAction  : "all"
                                ,editable       : false
                                ,mode           : "local"
                                ,listClass      : "x-combo-list-small"
                                ,width          : 70
                                ,store          : [ 1, 2, 3, 4, 5, 6, 7, 8 ]
                                ,allowBlank     : false
                            }
                        ]
                    }
                ]
            });
        }
        Ext.getCmp("add_ip_gw_window").show();

        //functions
        function save_ip_gw_add(b, e) {
            var gw_st = Ext.StoreMgr.lookup("gateways_st");
            var t = gw_st.recordType;
            var r = new t({});
            Ext.getCmp("add_ip_gw_form").getForm().updateRecord(r);
            r.data.dirty = true;
            gw_st.add(r);
            r.markDirty();
            Ext.getCmp("add_ip_gw_window").close();
        }

        function validateAddIPGW(v) {
            var gw_ip = Ext.getCmp("gw_ip_entry");
            //check for uniqueness
            //can't equal the destination route
            if(!(gw_ip.validate())) {
                gw_ip.markInvalid("Valid IPv4 Address expected.");
                return false;
            }
            if(gw_ip.getValue() == Ext.getCmp("netaddress_sr_entry").getValue()) {
                gw_ip.markInvalid("Gateway Address can't equal the Destination.");
                return false;
            }
            //can't equal the exact address of any addresses in the interface store
            var matchesIntf = false;
            var i;
            Ext.StoreMgr.lookup("interface_st").each(function(r) {
                for(i = 0; i < r.data.addr4_list.length; i++) {
                    if(gw_ip.getValue() == r.data.addr4_list[i].addr4) {
                        matchesIntf = true;
                        gw_ip.markInvalid("Gateway Address can't equal an interface.");
                    }
                }
            });
            if(matchesIntf) {
                return false;
            }
            //else gw_ip is fine, so return the original valid value
            gw_ip.clearInvalid();
            return v;
        }
    }
// */

    ,gwAddInterface             : function(b, e) {
        if(!(Ext.getCmp("add_intf_gw_window"))) {
            var add_intf_gw_window = new CP.WebUI.ModalWin({
                id              : "add_intf_gw_window"
                ,title          : "Add Interface Gateway"
                ,width          : "auto"
                ,height         : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close() }
                ,listeners      : {
                    show    : function(win) {
                        win.setHeight("auto");
                        win.setWidth("auto");
                        win.setPosition(225,100);
                    }
                }
                ,items          : [
                    {
                        xtype           : "cp_formpanel"
                        ,id             : "add_intf_gw_form"
                        ,height         : CP.PBR_static.GW_WINDOW_HEIGHT
                        ,autoHeight     : CP.PBR_static.GW_WINDOW_AUTOHEIGHT
                        ,width          : CP.PBR_static.GW_WINDOW_WIDTH
                        ,draggable      : false
                        ,monitorValid   : true
                        ,padding        : 15
                        ,listeners      : {
                            clientvalidation    : function(p, v) {
                                if(v) {
                                    Ext.getCmp("save_intf_gw_btn").enable();
                                } else {
                                    Ext.getCmp("save_intf_gw_btn").disable();
                                }
                            }
                            ,afterrender        : function(p) {
                                Ext.getCmp("preference_intf_entry").setValue(CP.PBR_static.getMinPriority());
                            }
                        }
                        ,fbar           : {
                            xtype           : "toolbar"
                            ,items          : [
                                {
                                    xtype       : "cp_button"
                                    ,text       : "Save"
                                    ,id         : "save_intf_gw_btn"
                                    ,disabled   : true
                                    ,handler    : save_intf_gw_add
                                },{
                                    xtype       : "cp_button"
                                    ,text       : "Cancel"
                                    ,id         : "cancel_intf_gw_btn"
                                    ,handler    : function(b, e) {
                                        Ext.getCmp("add_intf_gw_window").close();
                                    }
                                }
                            ]
                        }
                        ,items          : [
                            {
                                xtype           : "cp_combobox"
                                ,fieldLabel     : "Interface"
                                ,id             : "gw_intf_entry"
                                ,name           : "gw"
                                ,lazyRender     : true
                                ,store          : Ext.StoreMgr.lookup("interface_st")
                                ,displayField   : "intf"
                                ,valueField     : "intf"
                                ,triggerAction  : "all"
                                ,mode           : "local"
                                ,editable       : false
                                ,selectOnFocus  : true
                                ,emptyText      : "Select One"
                                ,allowBlank     : false
                                ,width          : 141
                            },{
                                xtype           : "cp_displayfield"
                                ,fieldLabel     : "gw_type"
                                ,id             : "gw_type_intf_entry"
                                ,name           : "gw_type"
                                ,hidden         : true
                                ,hideLabel      : true
                                ,value          : "l"
                            },{
                                xtype           : "cp_combobox"
                                ,fieldLabel     : "Priority"
                                ,id             : "preference_intf_entry"
                                ,name           : "preference"
                                ,triggerAction  : "all"
                                ,editable       : false
                                ,mode           : "local"
                                ,listClass      : "x-combo-list-small"
                                ,width          : 70
                                ,store          : [ 1, 2, 3, 4, 5, 6, 7, 8 ]
                                ,allowBlank     : false
                            }
                        ]
                    }
                ]
            });
        }
        Ext.getCmp("add_intf_gw_window").show();

        //functions
        function save_intf_gw_add() {
            var gw_st = Ext.StoreMgr.lookup("gateways_st");
            var t = gw_st.recordType;
            var r = new t({});
            Ext.getCmp("add_intf_gw_form").getForm().updateRecord(r);
            r.data.dirty = true;
            gw_st.add(r);
            r.markDirty();
            Ext.getCmp("add_intf_gw_window").close();
        }
    }
// */

    ,edit_a_gw                  : function(b, e) {
        if( !( Ext.getCmp("edit_a_gw_window") ) ) {
            var edit_a_gw_window = new CP.WebUI.ModalWin({
                id              : "edit_a_gw_window"
                ,title          : "Edit Gateway"
                ,width          : "auto"
                ,height         : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close() }
                ,listeners      : {
                    show    : function(win) {
                        win.setHeight("auto");
                        win.setWidth("auto");
                        win.setPosition(225,100);
                    }
                }
                ,items          : [
                    {
                        xtype           : "cp_formpanel"
                        ,id             : "edit_a_gw_form"
                        ,height         : CP.PBR_static.GW_WINDOW_HEIGHT
                        ,autoHeight     : CP.PBR_static.GW_WINDOW_AUTOHEIGHT
                        ,width          : CP.PBR_static.GW_WINDOW_WIDTH
                        ,draggable      : false
                        ,monitorValid   : true
                        ,padding        : 15
                        ,listeners      : {
                            clientvalidation    : function(p, v) {
                                if(v) {
                                    Ext.getCmp("save_gw_edit_btn").enable();
                                } else {
                                    Ext.getCmp("save_gw_edit_btn").disable();
                                }
                            }
                            ,afterrender        : edit_gw_afterrender
                        }
                        ,fbar           : {
                            xtype           : "toolbar"
                            ,items          : [
                                {
                                    xtype       : "cp_button"
                                    ,text       : "Save"
                                    ,id         : "save_gw_edit_btn"
                                    ,disabled   : true
                                    ,handler    : save_gw_edit
                                },{
                                    xtype       : "cp_button"
                                    ,text       : "Cancel"
                                    ,id         : "cancel_gw_edit_btn"
                                    ,handler    : function(b, e) {
                                        Ext.getCmp("edit_a_gw_window").close();
                                    }
                                }
                            ]
                        }
                        ,items          : [
                            {
                                xtype           : "cp_displayfield"
                                ,fieldLabel     : "Gateway"
                                ,id             : "gw_edit_entry"
                                ,name           : "gw"
                            },{
                                xtype           : "cp_displayfield"
                                ,fieldLabel     : "gw_type"
                                ,id             : "gw_type_edit_entry"
                                ,name           : "gw_type"
                                ,hidden         : true
                                ,hideLabel      : true
                            },{
                                xtype           : "cp_combobox"
                                ,fieldLabel     : "Priority"
                                ,id             : "preference_edit_entry"
                                ,name           : "preference"
                                ,triggerAction  : "all"
                                ,editable       : false
                                ,mode           : "local"
                                ,listClass      : "x-combo-list-small"
                                ,width          : 70
                                ,store          : [ 1, 2, 3, 4, 5, 6, 7, 8 ]
                                ,allowBlank     : false
                            }
                        ]
                    }
                ]
            });
        }
        Ext.getCmp("edit_a_gw_window").show();

        //functions
        function edit_gw_afterrender(p) {
            var gw_rec = Ext.getCmp("gw_grid").getSelectionModel().getSelected();
            Ext.getCmp("edit_a_gw_form").getForm().loadRecord( gw_rec );
        }

        function save_gw_edit(b, e) {
            var r = Ext.getCmp("gw_grid").getSelectionModel().getSelected();
            Ext.getCmp("edit_a_gw_form").getForm().updateRecord(r);
            r.data.dirty = true;
            r.markDirty();
            Ext.getCmp("edit_a_gw_window").close();
        }
    }
// */

    ,getMinPriority             : function() {
        var minPriority = 1;
        var gw_recs = Ext.StoreMgr.lookup("gateways_st").getRange();
        for(var i = 0; i < gw_recs.length; i++) {
            if(gw_recs[i].data.preference >= minPriority) {
                minPriority = gw_recs[i].data.preference + 1;
            }
            if(minPriority > 7) {
                return 8;
            }
        }
        return minPriority;
    }
}

