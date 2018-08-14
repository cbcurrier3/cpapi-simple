CP.ospf3_mon = {
    INSTANCE                : function() {
        return "default";
    }
    ,enableColumnResize     : true
    ,dupColor               : "grey"
    ,OSPF3_CONFIGURED       : false

    ,header_field0          : "Description"
    ,header_field1          : "Description"
    ,header_value0          : "Value"
    ,header_value1          : "Value"

    ,init                   : function() {
        CP.ospf3_mon.defineStores();

        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "IPv6 OSPF Monitor"
        });

        Arr.push( CP.ospf3_mon.main_set() );

        Arr.push( CP.ospf3_mon.generic_set("Packets", "packet") );
        Arr.push( CP.ospf3_mon.generic_set("Events", "event") );

        Arr.push( CP.ospf3_mon.error_set() );

        Arr.push( CP.ospf3_mon.generic_set("Summary", "summary") );

        Arr.push( CP.ospf3_mon.areaSummary_set() );

        Arr.push( CP.ospf3_mon.intf_set() );

        Arr.push( CP.ospf3_mon.neighbor_set() );

        Arr.push( CP.ospf3_mon.database_set() );

        Arr.push( CP.ospf3_mon.border_set() );

        var obj = {
            panel   : Ext.create("CP.WebUI4.DataFormPanel", {
                id          : "ospf3_monitorPanel"
                ,margin     : "0 24 0 24"
                ,listeners  : {
                    afterrender : function() {
                        CP.ospf3_mon.doLoad();
                    }
                }
                ,items      : Arr
            })
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("ospf3_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores           : function() {
        function defineAStore( STOREID, FIELDS, SORTERS ) {
            if (!STOREID) {
                return;
            }
            if ( Ext.typeOf(FIELDS) != "array" || FIELDS.length < 1 ) {
                return;
            }
            Ext.create("CP.WebUI4.Store", {
                storeId     : STOREID
                ,autoLoad   : false
                ,data       : []
                ,fields     : FIELDS
                ,proxy      : {
                    type        : "memory"
                    ,reader     : {type: "array"}
                }
                ,sorters    :   SORTERS
            });
        }
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf3_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url         : "/cgi-bin/ospf3_monitor.tcl?instance="
                ,extraParams    : {
                    "instance"  : CP.ospf3_mon.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                }
            }
            
            ,doAutoRefresh : function(store, sentAutomatically) {
                var url = Ext.urlAppend(store.proxy.url, Ext.Object.toQueryString(store.proxy.extraParams));
                CP.util.doAutoRequestRunnable(
                    url, 
                    'GET',
                    store.autoRefreshSuccess,
                    sentAutomatically);
            }
            
            ,autoRefreshSuccess : function (jsonResult) {
                function testLoadStore(baseId, d) {
                     var storeId = "ospf3_mon_st_"+ baseId;
                     var key = baseId +"List";
                     var st = Ext.getStore(storeId);
                     if (st) {
                         st.removeAll();
                         if (d && d[key]) {
                             st.loadData( d[key] );
                         }
                     }
                 }
                
                var jsonData = Ext.decode(jsonResult.responseText);
                if (jsonData && jsonData.data) {
                    var d = jsonData.data;
                    var isOn = (d.isOn) ? true : false;
                    var routed_busy = d.routed_busy ? true : false;
                    CP.ospf3_mon.OSPF3_CONFIGURED = isOn;

                    var main_set = Ext.getCmp("ospf3_mon_form_Main");
                    var inactive_msg = Ext.getCmp("ospf3_mon_form_inactive");
                    var busy_msg = Ext.getCmp("ospf3_mon_form_busy");
                    if (routed_busy) {
                        if (inactive_msg && inactive_msg.setVisible) {
                            inactive_msg.setVisible(false);
                        }
                        if (main_set && main_set.setVisible) {
                            main_set.setVisible(false);
                        }
                        if (busy_msg && busy_msg.setVisible) {
                            busy_msg.setVisible(true);
                        }
                    } else {
                        if (inactive_msg && inactive_msg.setVisible) {
                            inactive_msg.setVisible(!isOn);
                        }
                        if (main_set && main_set.setVisible) {
                            main_set.setVisible(isOn);
                        }
                        if (busy_msg && busy_msg.setVisible) {
                            busy_msg.setVisible(false);
                        }
                    }

                    var i;
                    var availIds = [];

                    var main_st = Ext.getStore("ospf3_mon_st_Main");
                    if (main_st && main_st.getCount() == 0) {
                        testLoadStore("Main"    ,d);
                        if (d && d["MainList"]) {
                            for(i = 0; i < d.MainList.length; i++) {
                                availIds.push( d.MainList[i].VALUE );
                            }
                            var g = Ext.getCmp("ospf3_mon_grid_Main");
                            if (g) {
                                g.availableIds = availIds;
                            }
                        }
                    }
                    testLoadStore("packet"      ,d);
                    testLoadStore("event"       ,d);
                    testLoadStore("error"       ,d);
                    testLoadStore("summary"     ,d);
                    testLoadStore("areaSummary" ,d);
                    testLoadStore("intf"        ,d);
                    testLoadStore("neighbor"    ,d);
                    testLoadStore("database"    ,d);
                    testLoadStore("border"      ,d);
                } 
            }                        
        });                        

        defineAStore(
            "ospf3_mon_st_Main"
            ,["LABEL", "VALUE", "cnt"]
            ,[{ property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_packet"
            ,["cnt", "cnt1", "label0", "value0", "label1", "value1"]
            ,[{ property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_event"
            ,["cnt", "cnt1", "label0", "value0", "label1", "value1"]
            ,[{ property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_error"
            ,["titleCnt", "title", "cnt", "cnt1", "label0", "value0", "label1", "value1"]
            ,[{ property: "titleCnt", direction: "ASC" }, { property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_summary"
            ,["cnt", "cnt1", "label0", "value0", "label1", "value1"]
            ,[{ property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_areaSummary"
            ,["areaId", "areaCnt", "cnt", "cnt1", "label0", "value0", "label1", "value1"]
            ,[{ property: "areaCnt", direction: "ASC" }, { property: "cnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_intf"
            ,["intfCnt", "intf", "addr", "areaid", "state", "neighborcount", "drIntf", "bdrIntf", "errors"]
            ,[{ property: "intfCnt", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_neighbor"
            ,["nbrID", "priority", "nstate", "dstate", "address", "ifname", "errors"]
            ,[{ property: "nbrID", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_database"
            ,["lsatype", "lsalabel", "area", "linkid", "advrouter", "age", "seqnum", "checksum", "linkcount"]
            ,[{ property: "lsatype", direction: "ASC" },{ property: "linkid", direction: "ASC" }]
        );
        defineAStore(
            "ospf3_mon_st_border"
            ,["cnt", "routerType", "routerID", "cost", "br", "area"]
            ,[{ property: "cnt", direction: "ASC" }]
        );
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.ospf3_mon.autoRefreshCallback);
    }
    
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.ospf3_mon.autoRefreshCallback(false);
    }        

//  GRID BUILDING METHODS   ////////////////////////////////////////////////////
    ,get_a_grid             : function(baseId, WIDTH, HEIGHT, COLS, SelModelObj) {
        var escapeObj = { xtype: "cp4_label", text: ("Oops: "+ baseId) };
        //baseId should be int he form of "packet" or "event"
        if (Ext.typeOf(baseId) != "string" || baseId == "") {
            return escapeObj;
        }
        if (Ext.typeOf(HEIGHT) != "number" || HEIGHT < 100) {
            HEIGHT = 200;
        }
        if (Ext.typeOf(COLS) != "array" || COLS.length < 1) {
            WIDTH = 600;
            COLS = [
                {
                    text            : CP.ospf3_mon.header_field0
                    ,dataIndex      : "cnt"
                    ,flex           : 10
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.label0);
                        return CP.ar_util.rendererGeneric(retValue);
                    }
                },{
                    text            : CP.ospf3_mon.header_value0
                    ,dataIndex      : "value0"
                    ,flex           : 6
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.value0);
                        return CP.ar_util.rendererGeneric(retValue);
                    }
                },{
                    text            : CP.ospf3_mon.header_field1
                    ,dataIndex      : "cnt1"
                    ,flex           : 10
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.label1);
                        return CP.ar_util.rendererGeneric(retValue);
                    }
                },{
                    text            : CP.ospf3_mon.header_value1
                    ,dataIndex      : "value1"
                    ,flex           : 6
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.value1);
                        return CP.ar_util.rendererGeneric(retValue);
                    }
                }
            ];
        }

        var gridId = "ospf3_mon_grid_"+ baseId;
        var storeId = "ospf3_mon_st_"+ baseId;
        var st = Ext.getStore( storeId );
        if (!st) {
            Ext.Msg.alert("Oops, bad store!", "gridId: "+ gridId +", storeId: "+ storeId);
            return escapeObj;
        }

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : gridId
            ,width              : WIDTH
            ,height             : HEIGHT
            ,configGrid         : false
            ,hidden             : false
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : st
            ,columns            : COLS
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
        };

        if (SelModelObj) {
            grid.selModel = Ext.create("Ext.selection.RowModel", SelModelObj);
        }

        return grid;
    }

//  MAIN SET                ////////////////////////////////////////////////////
    ,main_set               : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_btnsbar"
            ,items      : [
                {
                    xtype       : "cp4_button"
                    ,text       : "Reload"
                    ,id         : "ospf3_mon_reload"
                    ,handler    : function() {
                        CP.ospf3_mon.doReload();
                    }
                    //prevent disabling button
                    ,disable    : function() { }
                    ,setDisabled: function(d) {
                        var b = this;
                        if (b && b.disabled == true) {
                            b.enable();
                        }
                    }
                }
            ]
        });

        Arr.push({
            xtype       : "cp4_label"
            ,id         : "ospf3_mon_form_inactive"
            ,text       : "OSPFv3 is not configured."
        });

        Arr.push({
            xtype       : "cp4_label"
            ,id         : "ospf3_mon_form_busy"
            ,text       : "The routing daemon is busy. Please try again later."
        });

        var grid_cm = [{
            text            : "Information"
            ,dataIndex      : "cnt"
            ,flex           : 1
            ,menuDisabled   : true
            ,renderer       : function(value, meta, rec, row, col, st, view) {
                var retValue = String(rec.data.LABEL);
                if (retValue == "") { retValue = value; }
                return CP.ar_util.rendererGeneric(retValue);
            }
        }];
        var grid_smo = {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, recs, eOpts) {
                    var i;
                    var visibleIds = [];
                    var availableIds = Ext.getCmp("ospf3_mon_grid_Main").availableIds;
                    var baseId, formId, form;
                    if (Ext.typeOf(recs) == "array" && recs.length > 0) {
                        for(i = 0; i < recs.length; i++) {
                            visibleIds.push(recs[i].data.VALUE);
                        }
                    }
                    var inList = false;
                    for(i = 0; i < availableIds.length; i++) {
                        baseId = availableIds[i];
                        formId = "ospf3_mon_form_"+ baseId;
                        form = Ext.getCmp(formId);
                        inList = (Ext.Array.indexOf(visibleIds, baseId) > -1);
                        if (form && form.isVisible() != inList) {
                            form.setVisible(inList);
                        }
                    }
                }
            }
        };

        //grid needs to be defined here to allow availableIds to be declared
        var grid = CP.ospf3_mon.get_a_grid("Main", 150, 215, grid_cm, grid_smo);
        grid.availableIds = [];
        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_Main"
            ,hidden     : true
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,items      : [ grid ]
            ,listeners  : {
                hide        : function() {
                    var g = Ext.getCmp("ospf3_mon_grid_Main");
                    var sm;
                    if (g) {
                        sm = g.getSelectionModel();
                        sm.deselectAll();
                    }
                }
            }
        });

        return Arr;
    }

    ,generic_set            : function(TITLE, baseId) {
        return [{
            xtype       : "cp4_formpanel"
            ,id         : ("ospf3_mon_form_"+ baseId)
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: TITLE }
                ,CP.ospf3_mon.get_a_grid(baseId, 500, 160, false, false)
            ]
        }];
    }

    ,error_set              : function() {
        var Arr = [];

        var WIDTH = 650;
        var HEIGHT = 300;

        var grid_cm = [
            {
                text            : "Error Group"
                ,dataIndex      : "titleCnt"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.title);
                    var color = "black";
                    if (row > 0) {
                        var p = st.getAt(row-1);
                        if (p.data.titleCnt == value) {
                            color = CP.ospf3_mon.dupColor;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : CP.ospf3_mon.header_field0
                ,dataIndex      : "cnt"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.label0);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_value0
                ,dataIndex      : "value0"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.value0);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_field1
                ,dataIndex      : "cnt1"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.label1);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_value1
                ,dataIndex      : "value1"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.value1);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_error"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Errors" }
                ,CP.ospf3_mon.get_a_grid("error", WIDTH, HEIGHT, grid_cm, false)
            ]
        });

        return Arr;
    }

    ,areaSummary_set        : function() {
        var Arr = [];

        var WIDTH = 650;
        var HEIGHT = 300;

        var grid_cm = [
            {
                text            : "Area ID"
                ,dataIndex      : "areaCnt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.areaId);
                    var color = "black";
                    if (row > 0) {
                        var p = st.getAt(row-1);
                        if (p.data.areaCnt == value) {
                            color = CP.ospf3_mon.dupColor;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                text            : CP.ospf3_mon.header_field0
                ,dataIndex      : "cnt"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.label0);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_value0
                ,dataIndex      : "value0"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.value0);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_field1
                ,dataIndex      : "cnt1"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.label1);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : CP.ospf3_mon.header_value1
                ,dataIndex      : "value1"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.value1);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_areaSummary"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Area Summary" }
                ,CP.ospf3_mon.get_a_grid("areaSummary", WIDTH, HEIGHT, grid_cm, false)
            ]
        });

        return Arr;
    }

    ,intf_set               : function() {
        var Arr = [];

        var WIDTH = 900;
        var HEIGHT = 200;

        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "intfCnt"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.intf);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Address"
                ,dataIndex      : "addr"
                ,flex           : 2
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Area ID"
                ,dataIndex      : "areaid"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "State"
                ,dataIndex      : "state"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Nbr Count"
                ,dataIndex      : "neighborcount"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "DR"
                ,dataIndex      : "drIntf"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "BDR"
                ,dataIndex      : "bdrIntf"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Errors"
                ,dataIndex      : "errors"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_intf"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Interfaces" }
                ,CP.ospf3_mon.get_a_grid("intf", WIDTH, HEIGHT, grid_cm, false)
            ]
        });

        return Arr;
    }

    ,neighbor_set           : function() {
        var Arr = [];

        var WIDTH = 800;
        var HEIGHT = 200;

        var grid_cm = [];
        var cm_parts = [
            { FLEX: 2, TEXT: "Neighbor ID", FIELD: "nbrID" },
            { FLEX: 1, TEXT: "Priority",    FIELD: "priority" },
            { FLEX: 1, TEXT: "State",       FIELD: "nstate" },
            { FLEX: 1, TEXT: "Dead",        FIELD: "dstate" },
            { FLEX: 2, TEXT: "Address",     FIELD: "address" },
            { FLEX: 1, TEXT: "Interface",   FIELD: "ifname" },
            { FLEX: 1, TEXT: "Errors",      FIELD: "errors" }
        ];
        var i;
        for(i = 0; i < cm_parts.length; i++) {
            grid_cm.push({
                text            : cm_parts[i].TEXT
                ,dataIndex      : cm_parts[i].FIELD
                ,flex           : cm_parts[i].FLEX
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            });
        }

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_neighbor"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Neighbors" }
                ,CP.ospf3_mon.get_a_grid("neighbor", WIDTH, HEIGHT, grid_cm, false)
            ]
        });
        return Arr;
    }

    ,database_set           : function() {
        var Arr = [];

        var WIDTH = 800;
        var HEIGHT = 200;

        var grid_cm = [];
        var cm_parts = [
            {
                FLEX: 7, TEXT: "Type",      FIELD: "lsatype"
                ,RENDERER: function(value, meta, rec, row, col, st, view) {
                    var retValue = String(rec.data.lsalabel);
                    var color = "black";
                    if (row > 0) {
                        var p = st.getAt(row-1);
                        if (p.data.lsatype == rec.data.lsatype && p.data.area == rec.data.area) {
                            color = CP.ospf3_mon.dupColor;
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                }
            },{
                FLEX: 3, TEXT: "Link ID",     FIELD: "linkid"
                ,RENDERER: CP.ar_util.rendererGeneric
            },{
                FLEX: 4, TEXT: "Adv Router",  FIELD: "advrouter"
                ,RENDERER: CP.ar_util.rendererGeneric
            },{
                FLEX: 2, TEXT: "Age",         FIELD: "age"
                ,RENDERER: CP.ar_util.rendererGeneric
            },{
                FLEX: 4, TEXT: "Seq Number",  FIELD: "seqnum"
                ,RENDERER: CP.ar_util.rendererGeneric
            },{
                FLEX: 4, TEXT: "Checksum",    FIELD: "checksum"
                ,RENDERER: CP.ar_util.rendererGeneric
            },{
                FLEX: 4, TEXT: "Link Count",  FIELD: "linkcount"
                ,RENDERER: CP.ar_util.rendererGeneric
            }
        ];
        var i;
        for(i = 0; i < cm_parts.length; i++) {
            grid_cm.push({
                text            : cm_parts[i].TEXT
                ,dataIndex      : cm_parts[i].FIELD
                ,flex           : cm_parts[i].FLEX
                ,menuDisabled   : true
                ,renderer       : cm_parts[i].RENDERER
            });
        }

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_database"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Database" }
                ,CP.ospf3_mon.get_a_grid("database", WIDTH, HEIGHT, grid_cm, false)
            ]
        });

        return Arr;
    }

    ,border_set             : function() {
        var Arr = [];

        var WIDTH = 700;
        var HEIGHT = 200;

        var grid_cm = [];
        var cm_parts = [
            { FLEX: 1,  TEXT: "Rt Type",    FIELD: "routerType" },
            { FLEX: 2,  TEXT: "Router ID",  FIELD: "routerID" },
            { FLEX: 1,  TEXT: "Cost",       FIELD: "cost" },
            { FLEX: 1,  TEXT: "BR Type",    FIELD: "br" },
            { FLEX: 1,  TEXT: "Area",       FIELD: "area" }
        ];

        var i;
        for(i = 0; i < cm_parts.length; i++) {
            grid_cm.push({
                text            : cm_parts[i].TEXT
                ,dataIndex      : cm_parts[i].FIELD
                ,flex           : cm_parts[i].FLEX
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value);
                    return CP.ar_util.rendererGeneric(retValue);
                }
            });
        }

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ospf3_mon_form_border"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,autoScroll : true
            ,items      : [
                { xtype: "cp4_sectiontitle", titleText: "Border Routers" }
                ,CP.ospf3_mon.get_a_grid("border", WIDTH, HEIGHT, grid_cm, false)
            ]
        });
        return Arr;
    }
}

