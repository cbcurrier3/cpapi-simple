CP.vrrp6_monitor = {
    dupColor                : "grey"
    ,init                   : function() {
        CP.vrrp6_monitor.defineStores();
        var obj = {
            panel   : CP.vrrp6_monitor.monitorPanel()
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("vrrp6_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,aboveTheSame           : function(st, rec, row, params) {
        if(row == 0) { return false; }
        if(params.length > 0) {
            var prev = st.getAt(row - 1);
            var i;
            var p;
            for(i = 0; i < params.length; i++) {
                p = params[i];
                if(prev.data[p] != rec.data[p]) {
                    return false;
                }
            }
        }
        return true;
    }

    ,defineStores           : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/vrrp6_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }                        
                ,reader : {
                    type    : "json"
                    ,root   : "data.vrrpsummary"
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
                function testLoadStore(storeId, d, dStr) {
                    var st = Ext.getStore(storeId);
                    if(st && d && d[dStr]) {
                        st.loadData( d[dStr] );
                    }
                }

                function testSetVisible(cmpId, vis) {
                    var c = Ext.getCmp(cmpId);
                    if(c) {
                        c.setVisible(vis);
                    }
                }
                
                var jsonData = Ext.decode(jsonResult.responseText); 
                if (jsonData && jsonData.data) {
                    var d = jsonData.data;
                    var isOn = d.isOn;

                    testSetVisible("vrrp6_mon_not_running", !isOn);
                    testSetVisible("vrrp6_mon_grid_main", isOn);
                    testSetVisible("vrrp6_mon_set_grids", isOn);

                    testLoadStore("vrrp6_mon_summary_store", d, "summaryList");
                    testLoadStore("vrrp6_mon_intf_store", d, "intfList");
                    testLoadStore("vrrp6_mon_stat_store", d, "statList");
                } 
            }                                    
        });
                
        var main_store = Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_mon_main_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "gridType"
                    ,sortType   : function(value) {
                        var v = String(value).toLowerCase();
                        switch(v) {
                            case "summary":
                                return 0;
                            case "intf":
                                return 1;
                            case "stat":
                                return 2;
                        }
                    }
                }
                ,"gridLabel"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "gridType", direction: "ASC" }]
            ,getPossible: function() {
                var st = this;
                if (!st) { return []; }
                var r = st.getRange();
                var ids = [];
                var i;
                for(i = 0; i < r.length; i++) {
                    if (r[i] && r[i].data && r[i].data.gridType) {
                        ids.push(r[i].data.gridType);
                    }
                }
                return ids;
            }
        });
        var main_store_data =   [{"gridType": "summary", "gridLabel": "Summary"}
                                ,{"gridType": "intf", "gridLabel": "Interfaces"}
                                ,{"gridType": "stat", "gridLabel": "Statistics"}];
        main_store.loadData( main_store_data );

        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_mon_summary_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "cnt"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                }
                ,"label0"
                ,"value0"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "cnt", direction: "ASC" }]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_mon_intf_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "cnt"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                },{
                    name        : "intf"
                    ,sortType   : function(value) {
                        if(String(value).indexOf("lo") == 0) {
                            return String("zzzz") + String(value);
                        }
                        return String(value);
                    }
                },{
                    name        : "vrid"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                }
                ,"flagsI"
                ,{
                    name        : "nVridI"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                },{
                    name        : "nActiveI"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                }
                ,"label0"
                ,"value0"
                ,"label1"
                ,"value1"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "intf", direction: "ASC" }
                            ,{ property: "vrid", direction: "ASC" }
                            ,{ property: "cnt", direction: "ASC" }]
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "vrrp6_mon_stat_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                {
                    name        : "cnt"
                    ,sortType   : function(value) {
                        return parseInt(value, 10);
                    }
                },{
                    name        : "intf"
                    ,sortType   : function(value) {
                        if(String(value).indexOf("lo") == 0) {
                            return String("zzzz") + String(value);
                        }
                        return String(value);
                    }
                },{
                    name        : "vrid"
                    ,sortType   : function(value) {
                        if (value == "") { return 0; }
                        return parseInt(value, 10);
                    }
                }
                ,"label0"
                ,"value0"
                ,"label1"
                ,"value1"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,sorters    :   [{ property: "intf", direction: "ASC" }
                            ,{ property: "vrid", direction: "ASC" }
                            ,{ property: "cnt", direction: "ASC" }]
        });
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.vrrp6_monitor.autoRefreshCallback);
    }
    
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.vrrp6_monitor.autoRefreshCallback(false);
    }        
   
    ,monitorPanel           : function() {
        var Arr = [];
        var Arr2 = [];

        Arr.push( CP.vrrp6_monitor.main_set() );
        Arr2.push( CP.vrrp6_monitor.summary_set() );
        Arr2.push( CP.vrrp6_monitor.intf_set() );
        Arr2.push( CP.vrrp6_monitor.stat_set() );
        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "vrrp6_mon_set_grids"
            ,margin     : 0
            ,hidden     : true
            ,items      : Arr2
        });

        return Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "vrrp6_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.vrrp6_monitor.doLoad
            }
            ,items      : Arr
        });
    }

    ,main_set               : function() {
        var Arr = [];

        function testSetVisible(suffix, vis) {
            var cmpId = "vrrp6_mon_set_"+ String(suffix).toLowerCase();
            var c = Ext.getCmp( cmpId );
            if(c) {
                c.setVisible(vis);
            }
        }

        Arr.push({
            xtype               : "cp4_grid"
            ,forceFit           : true
            ,autoScroll         : true
            ,draggable          : false
            ,enableColumnMove   : false
            ,configGrid         : false
            ,enableColumnResize : true
            /*
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
            // */
            //specific
            ,id                 : "vrrp6_mon_grid_main"
            ,width              : 150
            ,height             : 90
            ,margin             : "0 20 0 0"
            ,store              : Ext.getStore("vrrp6_mon_main_store")
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
                ,listeners      : {
                    selectionchange : function(RowModel, recs, eOpts) {
                        var st = Ext.getStore("vrrp6_mon_main_store");
                        var possibleIds = st.getPossible();
                        var visibleIds = [];
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            visibleIds.push(recs[i].data.gridType);
                        }
                        for(i = 0; i < possibleIds.length; i++) {
                            testSetVisible( possibleIds[i], Ext.Array.indexOf(visibleIds, possibleIds[i]) > -1 );
                        }
                    }
                }
            })
            ,columns            : [{
                text            : "Information"
                ,dataIndex      : "gridType"
                ,flex           : 80
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.gridLabel;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }]
        });

        Arr.push({
            xtype       : "cp4_button"
            ,text       : "Reload"
            ,id         : "vrrp6_mon_btn_reload"
            ,disabled   : false
            ,disable    : function() {
                //overwrite default disable function
            }
            ,setDisabled: function(d) {
                var c = this;
                if (c && c.enable) {
                    c.enable();
                }
            }
            ,handler    : CP.vrrp6_monitor.doReload
            ,listeners  : {
                disable     : function(c, eOpts) {
                    c.setDisabled( false );
                }
            }
        });

        Arr.push({
            xtype       : "cp4_inlinemsg"
            ,id         : "vrrp6_mon_not_running"
            ,type       : "info"
            ,hidden     : true
            ,text       : "IPv6 VRRP is not running."
            ,width      : 300
            ,margin     : "0 0 0 20"
        });

        return [{
            xtype       : "cp4_sectiontitle"
            ,titleText  : "IPv6 VRRP Monitor"
        },{
            xtype       : "cp4_formpanel"
            ,layout     : "column"
            ,margin     : 0
            ,items      : Arr
        }];
    }

    ,summary_set            : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Summary"
        });

        Arr.push({
            xtype               : "cp4_grid"
            ,forceFit           : true
            ,autoScroll         : true
            ,draggable          : false
            ,enableColumnMove   : false
            ,configGrid         : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events["beforeitemmousedown"].clearListeners();
                    grid.events["beforeitemdblclick"].clearListeners();
                }
            }
            //specific
            ,id                 : "vrrp6_mon_grid_summary"
            ,width              : 400
            ,height             : 152
            ,margin             : 0
            ,store              : Ext.getStore("vrrp6_mon_summary_store")
            ,selModel           : Ext.create("Ext.selection.RowModel", {
                allowDeselect   : true
                ,mode           : "MULTI"
            })
            ,columns            : [{
                text            : "Description"
                ,dataIndex      : "cnt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.label0;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            },{
                text            : "Value"
                ,dataIndex      : "value0"
                ,width          : 140
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.value0;
                    return CP.ar_util.rendererSpecific(retValue);
                }
            }]
        });

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp6_mon_set_summary"
            ,margin     : 0
            ,hidden     : true
            ,items      : Arr
        };
    }

    ,intf_set               : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Interfaces"
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,margin     : 0
            ,items      : [{
                xtype               : "cp4_grid"
                ,forceFit           : true
                ,autoScroll         : true
                ,draggable          : false
                ,enableColumnMove   : false
                ,configGrid         : false
                ,enableColumnResize : true
                ,listeners          : {
                    afterrender : function(grid, eOpts) {
                        grid.events["beforeitemmousedown"].clearListeners();
                        grid.events["beforeitemdblclick"].clearListeners();
                    }
                }
                //specific
                ,id                 : "vrrp6_mon_grid_intf"
                ,width              : 800
                ,height             : parseInt( (30 + 14 * 21), 10)
                ,margin             : 0
                ,store              : Ext.getStore("vrrp6_mon_intf_store")
                ,selModel           : Ext.create("Ext.selection.RowModel", {
                    allowDeselect   : true
                    ,mode           : "MULTI"
                })
                ,columns            : [{
                    text            : "Interface"
                    ,dataIndex      : "intf"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.intf;
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "Num VR"
                    ,dataIndex      : "nVridI"
                    ,width          : 75
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var nVrid = rec.data.nVridI;
                        var nActive = rec.data.nActiveI;
                        var retValue = String(nVrid);
                        if(nVrid != nActive) {
                            retValue += " ("+ String(nActive) +")";
                        }
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "Flags"
                    ,dataIndex      : "flagsI"
                    ,width          : 130
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.flagsI;
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        if (retValue == "") {
                            retValue = "None";
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "VR"
                    ,dataIndex      : "vrid"
                    ,width          : 60
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.vrid;
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf", "vrid"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "Description"
                    ,dataIndex      : "cnt"
                    ,width          : 135
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.label0;
                        return CP.ar_util.rendererSpecific(retValue);
                    }
                },{
                    text            : "Value"
                    ,dataIndex      : "value0"
                    ,flex           : 3
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = String(rec.data.value0);
                        var color = "black";
                        if (retValue.toLowerCase() == "none") {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        switch ( String(rec.data.units).toLowerCase() ) {
                            case "s":
                                if (retValue == "") {
                                    break;
                                }
                                if (retValue == "1") {
                                    retValue = retValue +" second";
                                } else {
                                    retValue = retValue +" seconds";
                                }
                                break;
                            case "cs":
                                if (retValue == "") {
                                    break;
                                }
                                retValue = String(Ext.Number.toFixed(parseInt(retValue, 10) / 100, 2) );
                                if (retValue == "1.00") {
                                    retValue = retValue +" second";
                                } else {
                                    retValue = retValue +" seconds";
                                }
                                break;
                            default:
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                }]
            }]
        });

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp6_mon_set_intf"
            ,margin     : 0
            ,hidden     : true
            ,items      : Arr
        };
    }

    ,stat_set               : function() {
        var Arr = [];

        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "Statistics"
        });

        Arr.push({
            xtype       : "cp4_formpanel"
            ,autoScroll : true
            ,margin     : 0
            ,items      : [{
                xtype               : "cp4_grid"
                ,forceFit           : true
                ,autoScroll         : true
                ,draggable          : false
                ,enableColumnMove   : false
                ,configGrid         : false
                ,enableColumnResize : true
                ,listeners          : {
                    afterrender : function(grid, eOpts) {
                        grid.events["beforeitemmousedown"].clearListeners();
                        grid.events["beforeitemdblclick"].clearListeners();
                    }
                }
                //specific
                ,id                 : "vrrp6_mon_grid_stat"
                ,width              : 450
                ,height             : 324
                ,margin             : 0
                ,store              : Ext.getStore("vrrp6_mon_stat_store")
                ,selModel           : Ext.create("Ext.selection.RowModel", {
                    allowDeselect   : true
                    ,mode           : "MULTI"
                })
                ,columns            : [{
                    text            : "Interface"
                    ,dataIndex      : "intf"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.intf;
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "VR"
                    ,dataIndex      : "vrid"
                    ,width          : 60
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.vrid;
                        var color = "";
                        if( CP.vrrp6_monitor.aboveTheSame(st, rec, row, ["intf", "vrid"]) ) {
                            color = CP.vrrp6_monitor.dupColor;
                        }
                        if (retValue == "") {
                            retValue = rec.data.intf;
                        }
                        return CP.ar_util.rendererSpecific(retValue, retValue, "left", color);
                    }
                },{
                    text            : "Description"
                    ,dataIndex      : "cnt"
                    ,flex           : 1
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.label0;
                        return CP.ar_util.rendererSpecific(retValue);
                    }
                },{
                    text            : "Value"
                    ,dataIndex      : "value0"
                    ,width          : 100
                    ,menuDisabled   : true
                    ,renderer       : function(value, meta, rec, row, col, st, view) {
                        var retValue = rec.data.value0;
                        return CP.ar_util.rendererSpecific(retValue);
                    }
                }]
            }]
        });

        return {
            xtype       : "cp4_formpanel"
            ,id         : "vrrp6_mon_set_stat"
            ,margin     : 0
            ,hidden     : true
            ,items      : Arr
        };
    }
}

