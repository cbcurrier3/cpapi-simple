CP.ripng_mon = {
    isOn                    : 0
    ,header_label           : "Description"
    ,header_value           : "Value"
    ,grid_width             : 650

    ,init                   : function() {
        CP.ripng_mon.defineStores();

        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,titleText  : "RIPng Monitor"
        });

        Arr.push({
            xtype   : "cp4_btnsbar"
            ,items  : [
                {
                    xtype       : "cp4_button"
                    ,text       : "Reload"
                    ,id         : "ripng_mon_btn_reload"
                    ,handler    : function() {
                        CP.ripng_mon.doReload();
                    }
                    ,disable    : function() {
                        var b = this;
                        if (b && b.enable) {
                            b.enable();
                        }
                    }
                    ,setDisabled: function(d) {
                        var b = this;
                        if (b && b.enable) {
                            b.enable();
                        }
                    }
                }
            ]
        });



        Arr.push({
            xtype       : "cp4_label"
            ,id         : "ripng_mon_inactive"
            ,text       : "RIPng is inactive."
            ,hidden     : true
            ,handleIsOn : function(showSelector) {
                var c = this;
                if (c && c.setVisible) {
                    c.setVisible(!showSelector);
                }
            }
        });

        Arr.push( CP.ripng_mon.get_selector() );
        Arr.push( CP.ripng_mon.get_generic("Summary", "summary", 130) );
        Arr.push( CP.ripng_mon.get_interface() );
        Arr.push( CP.ripng_mon.get_neighbor() );
        Arr.push( CP.ripng_mon.get_generic("Packets", "packets", 100) );
        Arr.push( CP.ripng_mon.get_generic("Errors", "errors", 200) );

        var obj = {
            panel   : Ext.create("CP.WebUI4.DataFormPanel", {
                id          : "ripng_monitorPanel"
                ,margin     : "0 24 0 24"
                ,listeners  : {
                    afterrender : function() {
                        CP.ripng_mon.doLoad();
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
        var store = Ext.getStore("ripng_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.ripng_mon.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.ripng_mon.autoRefreshCallback(false);
    }        
    
    ,defineStores           : function() {
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ripng_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/ripngmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
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
                function testLoadStore(baseId, d, test) {
                    if (!test) { test = false; }
                    var storeId = "ripng_mon_st_"+ String(baseId);
                    var key = "ripng_mon_list_"+ String(baseId);
                    var st = Ext.getStore(storeId);
                    if (st) {
                        if (d && d[key]) {
                            if ( test && d[key].length == st.getCount() ) {
                                return;
                            }
                            st.removeAll();
                            if (d[key].length > 0) {
                                st.loadData(d[key]);
                            }
                        }
                    }
                }
                
                var jsonData = Ext.decode(jsonResult.responseText);
                if (jsonData && jsonData.data) {
                    var d = jsonData.data;
                    
                    CP.ripng_mon.isOn = d.ripngState;
                    var i, c;
                    var testIt = true;
                    c = Ext.getCmp("ripng_mon_inactive");
                    if (c && c.handleIsOn) { c.handleIsOn(); }
                    var ids =   ["selector"
                                ,"summary"
                                ,"target"
                                ,"neighbor"
                                ,"packets"
                                ,"errors"];
                    for(i = 0; i < ids.length; i++) {
                        testLoadStore(ids[i], d, testIt);
                        testIt = false;
                    }
                    var selector_grid = Ext.getCmp("ripng_mon_grid_selector");
                    if (selector_grid) {
                        selector_grid.handleSelectorGrid();
                    }
                }
            }                        
        });        
        
        
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
                ,sorters    : SORTERS
            });
        }

        defineAStore(
            "ripng_mon_st_selector"
            ,["LABEL", "f", "cnt"]
            ,[{ property: "cnt", direction: "ASC" }]
        );

        defineAStore(
            "ripng_mon_st_summary"
            ,[
                "value0", "label0", "unit0",
                "value1", "label1", "unit1",
                "cnt"
            ]
            ,[{ property: "cnt", direction: "ASC" }]
        );

        defineAStore(
            "ripng_mon_st_target"
            ,[
                "ripng_mon_intf",
                "ripng_mon_addr",
                "ripng_mon_metric",
                "ripng_mon_sent",
                "ripng_mon_recv",
                "ripng_mon_errors",
                "cnt"
            ]
            ,[{ property: "cnt", direction: "ASC" }]
        );

        defineAStore(
            "ripng_mon_st_neighbor"
            ,[
                "ripng_mon_addr",
                "ripng_mon_numRoutes",
                "ripng_mon_numActiveRoutes",
                "ripng_mon_numBadPackets",
                "ripng_mon_numBadRoutes",
                "cnt"
            ]
            ,[{ property: "cnt", direction: "ASC" }]
        );

        defineAStore(
            "ripng_mon_st_packets"
            ,[
                "value0", "label0", "unit0",
                "value1", "label1", "unit1",
                "cnt"
            ]
            ,[{ property: "cnt", direction: "ASC" }]
        );

        defineAStore(
            "ripng_mon_st_errors"
            ,[
                "value0", "label0", "unit0",
                "value1", "label1", "unit1",
                "cnt"
            ]
            ,[{ property: "cnt", direction: "ASC" }]
        );
    }

    ,get_selector           : function() {
        var grid_cm = [
            {
                text            : "Information"
                ,dataIndex      : "cnt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.LABEL;
                    switch (Ext.typeOf(retValue)) {
                        case "string":
                            break;
                        default:
                            retValue = value;
                    }
                    return CP.ar_util.rendererGeneric(retValue);
                }
            }
        ];

        var grid_sm = Ext.create("Ext.selection.RowModel",{
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                selectionchange : function(view, recs, eOpts) {
                    var selector_grid = Ext.getCmp("ripng_mon_grid_selector");
                    if (selector_grid) {
                        selector_grid.handleSelectorGrid();
                    }
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "ripng_mon_grid_selector"
            ,width              : 125
            ,height             : 135
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("ripng_mon_st_selector")
            ,columns            : grid_cm
            ,selModel           : grid_sm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events.beforeitemmousedown.clearListeners();
                    grid.events.beforeitemdblclick.clearListeners();
                }
            }
            ,handleSelectorGrid : function() {
                var isOn = CP.ripng_mon.isOn;
                Ext.getCmp("ripng_mon_inactive").handleIsOn(isOn);
                Ext.getCmp("ripng_mon_form_selector").handleIsOn(isOn);
                var i, j, c, s;
                var r = this.getSelectionModel().getSelection();
                var ids =   ["summary"
                            ,"target"
                            ,"neighbor"
                            ,"packets"
                            ,"errors"];
                for(i = 0; i < ids.length; i++) {
                    c = Ext.getCmp("ripng_mon_form_"+ ids[i]);
                    if (c && c.handleIsOn) {
                        s = false;
                        if (isOn) {
                            for(j = 0; j < r.length; j++) {
                                if (r[j].data.f == ids[i]) {
                                    s = true;
                                    break;
                                }
                            }
                        }
                        c.handleIsOn(s);
                    }
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ripng_mon_form_selector"
            ,hidden     : true
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,items      : [ grid ]
            ,handleIsOn : function(showMe) {
                var f = this;
                f.setVisible(showMe);
            }
            ,listeners  : {
                hide        : function() {
                    var g = Ext.getCmp("ripng_mon_grid_selector");
                    var sm;
                    if (g) {
                        sm = g.getSelectionModel();
                        sm.deselectAll();
                    }
                }
                ,show       : function() {
                    var g = Ext.getCmp("ripng_mon_grid_selector");
                    var sm;
                    if (g) {
                        sm = g.getSelectionModel();
                        sm.deselectAll();
                    }
                }
            }
        };
    }

    ,get_generic            : function(TITLE, baseId, HEIGHT) {
        switch ( Ext.typeOf(HEIGHT) ) {
            case "number":
                if (HEIGHT < 100) {
                    HEIGHT = 100;
                }
                break;
            default:
                HEIGHT = 200;
        }
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,id         : "ripng_mon_title_"+ baseId
            ,titleText  : TITLE
            ,hidden     : true
        });

        var grid_cm = [
            {
                text            : CP.ripng_mon.header_label
                ,dataIndex      : "cnt"
                ,flex           : 4
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.label0;
                    var l = rec.data.label0;
                    var v = rec.data.value0;
                    return CP.ar_util.rendererSpecific(retValue, l +" "+ v, "left", "black");
                }
            },{
                text            : CP.ripng_mon.header_value
                ,dataIndex      : "value0"
                ,width          : 65
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.value0;
                    var l = rec.data.label0;
                    var v = rec.data.value0;
                    return CP.ar_util.rendererSpecific(retValue, l +" "+ v, "left", "black");
                }
            },{
                text            : CP.ripng_mon.header_label
                ,dataIndex      : "label1"
                ,flex           : 4
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.label1;
                    var l = rec.data.label1;
                    var v = rec.data.value1;
                    return CP.ar_util.rendererSpecific(retValue, l +" "+ v, "left", "black");
                }
            },{
                text            : CP.ripng_mon.header_value
                ,dataIndex      : "value0"
                ,width          : 65
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.value1;
                    var l = rec.data.label1;
                    var v = rec.data.value1;
                    return CP.ar_util.rendererSpecific(retValue, l +" "+ v, "left", "black");
                }
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "ripng_mon_grid_"+ baseId
            ,width              : CP.ripng_mon.grid_width
            ,height             : HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("ripng_mon_st_"+ baseId)
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ripng_mon_form_"+ baseId
            ,suffixId   : baseId
            ,hidden     : true
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,items      : [ grid ]
            ,handleIsOn : function(showMe) {
                var f = this;
                var t = Ext.getCmp("ripng_mon_title_"+ f.suffixId);
                t.setVisible(showMe);
                f.setVisible(showMe);
            }
        });

        return Arr;
    }

    ,get_interface          : function() {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,id         : "ripng_mon_title_target"
            ,titleText  : "Interfaces"
            ,hidden     : true
        });

        var grid_cm = [
            {
                text            : "Interface"
                ,dataIndex      : "cnt"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.ripng_mon_intf;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "IP Address"
                ,dataIndex      : "ripng_mon_addr"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Metric"
                ,dataIndex      : "ripng_mon_metric"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Sent"
                ,dataIndex      : "ripng_mon_sent"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Received"
                ,dataIndex      : "ripng_mon_recv"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Errors"
                ,dataIndex      : "ripng_mon_errors"
                ,width          : 80
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "ripng_mon_grid_target"
            ,width              : CP.ripng_mon.grid_width
            ,height             : 100
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("ripng_mon_st_target")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ripng_mon_form_target"
            ,suffixId   : "target"
            ,hidden     : true
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,items      : [ grid ]
            ,handleIsOn : function(showMe) {
                var f = this;
                var t = Ext.getCmp("ripng_mon_title_"+ f.suffixId);
                t.setVisible(showMe);
                f.setVisible(showMe);
            }
        });

        return Arr;
    }

    ,get_neighbor           : function() {
        var Arr = [];
        Arr.push({
            xtype       : "cp4_sectiontitle"
            ,id         : "ripng_mon_title_neighbor"
            ,titleText  : "Neighbors"
            ,hidden     : true
        });

        var grid_cm = [
            {
                text            : "Neighbor"
                ,dataIndex      : "cnt"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data.ripng_mon_addr;
                    return CP.ar_util.rendererGeneric(retValue);
                }
            },{
                text            : "Total Routes"
                ,dataIndex      : "ripng_mon_numRoutes"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Active Routes"
                ,dataIndex      : "ripng_mon_numActiveRoutes"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Bad Routes"
                ,dataIndex      : "ripng_mon_numBadRoutes"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },{
                text            : "Bad Packets"
                ,dataIndex      : "ripng_mon_numBadPackets"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "ripng_mon_grid_neighbor"
            ,width              : CP.ripng_mon.grid_width
            ,height             : 100
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("ripng_mon_st_neighbor")
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        Arr.push({
            xtype       : "cp4_formpanel"
            ,id         : "ripng_mon_form_neighbor"
            ,suffixId   : "neighbor"
            ,hidden     : true
            ,margin     : 0
            ,padding    : 0
            ,autoScroll : true
            ,items      : [ grid ]
            ,handleIsOn : function(showMe) {
                var f = this;
                var t = Ext.getCmp("ripng_mon_title_"+ f.suffixId);
                t.setVisible(showMe);
                f.setVisible(showMe);
            }
        });

        return Arr;
    }
}

