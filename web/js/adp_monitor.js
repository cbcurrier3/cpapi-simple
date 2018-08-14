CP.adp_monitor = {
    DATA_FETCH_BUTTON_TEXT          : "Reload Data"
    ,ADP_DEVICE                     : false
    ,ADP_DEMO                       : false

    ,SUMMARY_CHART_WIDTH            : 500
    ,SUMMARY_CHART_HEIGHT           : 220

    ,INDIVIDUAL_CHART_WIDTH         : 700
    ,INDIVIDUAL_CHART_HEIGHT        : 350
    ,INDIVIDUAL_TABLE_WIDTH         : 330
    ,INDIVIDUAL_TABLE_HEIGHT        : 350

    ,ANIMATE_CHARTS                 : false
    ,slot_idx                       : 0
    ,raw_slot_idx                   : 0
    ,default_refresh_increment      : 10

    ,HSL_COLOR_SAT_INITIAL          : 100
    ,HSL_COLOR_SAT_DELTA            : 0
    ,HSL_COLOR_LEVEL_INITIAL        : 80
    ,HSL_COLOR_LEVEL_DELTA          : 20
    ,CONNECTIONS_COLOR_HUE          : 120
    ,LOADS_COLOR_HUE                : 240

    ,coreLoadDefaultRange           : [30, 60]
    ,coreConnDefaultRange           : [60, 145]

    ,adp_mon_indiv_chart_id_list    :   ["adp_mon_individual_chart_usage"
                                        ,"adp_mon_individual_chart_conn"]

    ,open_save_data_window_text     : "Get Raw SAM Data"
    ,save_data_window_title         : "Raw SAM Data"

    ,init: function() {
        Ext.require('Ext.chart.*');
        Ext.require(['Ext.Window','Ext.fx.target.Sprite','Ext.layout.container.Fit']);

        CP.adp_monitor.build_color_arrays();
        if(CP && CP.adp_monitor) {
            if(CP.adp_mon_mem == undefined ){
                CP.adp_mon_mem = {
                    memory_handled: false
                };
            }
            if(CP.adp_mon_mem.memory_handled == false) {
                CP.adp_monitor.handle_memory();
            }
        }
        CP.adp_monitor.defineStores();

        var monitorPanel = CP.adp_monitor.monitorPanel();
        var obj = {
            panel           : monitorPanel
            ,afterSubmit    : CP.adp_monitor.doLoad
            ,submitFailure  : CP.adp_monitor.doLoad
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor);
    }

    ,renderer_output: function(value, tip, align, color) {
        if(!tip)    { tip = value; }
        if(!align)  { align = "left"; }
        if(!color)  { color = "black"; }
        return '<div data-qtip="'+tip+'" style="text-align:'+align+';color:'+color+';">'+value+'</div>';
    }
    ,renderer_generic: function(value, meta, rec, row, col, st, view, tip, align, color) {
        var retValue    = value || "";
        var TIP         = tip   || retValue;
        var ALIGN       = align || "left";
        var COLOR       = color || "black";
        return CP.adp_monitor.renderer_output(value, TIP, ALIGN, COLOR);
    }

    ,safeToFixed            : function(inp, precision) {
        switch(Ext.typeOf(precision)) {
            case "number":
                precision = parseInt(precision, 10);
                break;
            default:
                precision = 0;
        }
        switch(Ext.typeOf(inp)) {
            case "number":
                break;
            case "string":
                inp = parseInt(inp, 10);
                break;
            default:
                inp = 0;
        }
        inp = Ext.Number.toFixed(inp, precision);
        return inp;
    }

    ,comma_sep_number: function(str) {
        var strSplit = str.split(".");
        var len = strSplit[0].length;
        if(len < 4) {
            return str;
        }
        var h = strSplit[0].substring(0,len-3);
        var t = strSplit[0].substring(len-3);
        var f = String( CP.adp_monitor.comma_sep_number(h) +","+ t );
        if(strSplit.length > 1) {
            f += "."+ strSplit[1];
        }
        return f;
    }

    ,build_color_arrays: function() {
        var i;
        for(i = 0; i < 4; i++) {
            CP.adp_monitor.mySummaryColorArray[i] =
                CP.adp_monitor.getColorValue(i, "connections");
        }
        for(i = 0; i < 4; i++) {
            CP.adp_monitor.mySummaryColorArray[i + 4] =
                CP.adp_monitor.getColorValue(i, "loads");
        }
        CP.adp_monitor.myIndividualColorArray[0] =
            String("hsl("+ CP.adp_monitor.CONNECTIONS_COLOR_HUE +", 100%, 100%)");
            //String("hsl("+ CP.adp_monitor.CONNECTIONS_COLOR_HUE +", 100%, 50%)");
        CP.adp_monitor.myIndividualColorArray[1] =
            String("hsl("+ CP.adp_monitor.LOADS_COLOR_HUE +", 100%, 100%)");
            //String("hsl("+ CP.adp_monitor.LOADS_COLOR_HUE +", 100%, 50%)");
    }
    ,handle_memory: function() {
        var i;
        //handle refresh increment
        CP.adp_mon_mem.refresh_increment = parseInt(CP.adp_monitor.default_refresh_increment, 10);
        CP.adp_mon_mem.REFRESH_TASK = null;

        //handle coreLoadRange
        var DefaultRange = CP.adp_monitor.coreLoadDefaultRange;
        CP.adp_mon_mem.coreLoadRange = [];
        for(i = 0; i < DefaultRange.length; i++) {
            CP.adp_mon_mem.coreLoadRange[i] = parseInt(String(DefaultRange[i]), 10);
        }
        //handle coreConnRange
        DefaultRange = CP.adp_monitor.coreConnDefaultRange;
        CP.adp_mon_mem.coreConnRange = [];
        for(i = 0; i < DefaultRange.length; i++) {
            CP.adp_mon_mem.coreConnRange[i] = parseInt(String(DefaultRange[i]), 10);
        }

        CP.adp_mon_mem.memory_handled = true;
    }

    ,defineStores: function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "adp_mon_summary_store"
            ,autoLoad   : false
            ,fields     : [
                "slot"
                ,"mode"
                ,"slotIdx"
                ,"slotRaw"
                //count of cores with connection percentages in the various ranges
                ,"slotConn" //total connections for this slot
                ,"coreCnt"
                ,"cores_list"
                //count of cores with
                ,"Range_0"
                ,"Range_1"
                ,"Range_2"
                ,"Range_3"
            ]
            ,data       : []
            ,sorters    : [
                {property: "slot", direction: "ASC"}
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "adp_mon_individual_store"
            ,autoLoad   : false
            ,fields     : [
                {           //slot index
                    name        : "slot"
                    ,sortType   : function(v) {
                        if(Ext.typeOf(v) == "number") {
                            return parseInt(v, 10);
                        }
                        return String(v);
                    }
                }
                ,{          //index into core list for this slot
                    name        : "idx"
                    ,sortType   : function(v) {
                        return parseInt(v, 10);
                    }
                }
                ,"core"     //core index
                ,"coreCnt"
                ,"Usage" //load of this core
                ,"coreLoadRaw"
                ,"Connections"  //relative to the [slotConn div coreCnt]
                ,"coreConn" //number of connections
                ,"averageConn"
                ,"averageUsage"
            ]
            ,data       : []
            ,sorters    : [
                {property: "slot", direction: "ASC"},
                {property: "Connections", direction: "ASC"}
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {
                    type        : "array"
                }
            }
            ,listeners  : {
                load        : function(store, recs, success, op, eOpts) {
                    var tp = Ext.getCmp("adp_mon_individual_chart_tabpanel");
                    var inputValue = (tp) ? tp.getActiveTab().id : "Usage";
                    CP.adp_monitor.sort_individual_chart( inputValue );
                }
            }
        });
    }

    ,monitorPanel: function() {
        var itemsArr = [];
        var el;

        el = CP.adp_monitor.get_tools_dividers();
        if(el && el.length) {
            itemsArr.push(el);
        }

        //slot summary chart
        el = CP.adp_monitor.get_summary_section();
        if(el && el.length) {
            itemsArr.push(el);
        }

        //individual core chart
        el = CP.adp_monitor.get_individual_section();
        if(el && el.length) {
            itemsArr.push(el);
        }

        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "adp_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                render          : function() {
                    if(! CP.adp_monitor.start_refresh_task() ) {
                        CP.adp_monitor.doLoad();
                    }
                }
                ,beforedestroy  : function() {
                    CP.adp_monitor.stop_refresh_task();
                }
            }
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,layout : "column"
                    ,margin : "24 0 10 0"
                    ,items  : [
                        {
                            xtype       : "cp4_button"
                            ,text       : CP.adp_monitor.DATA_FETCH_BUTTON_TEXT
                            ,id         : "adp_mon_btn_doLoad"
                            ,handler    : CP.adp_monitor.doLoad
                            ,style      : "margin-right:10px;"
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "adp_mon_demo_label"
                            ,text       : "SAM Monitor is in Demo Mode"
                            ,type       : "info"
                            ,width      : 200
                            ,hidden     : true
                            ,style      : "margin-right:10px;margin-top:0px;"
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "adp_device_present_label"
                            ,text       : "SAM Is Not Present."
                            ,type       : "info"
                            ,hidden     : true
                            ,width      : 200
                            ,style      : "margin-top:0px;"
                        }
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "adp_mon_refresh_form"
                    ,layout : "column"
                    ,margin : 0
                    ,items  : [
                        {
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Refresh Increment"
                            ,id                 : "adp_mon_refresh_incr"
                            ,value              : Ext.Number.constrain(CP.adp_mon_mem.refresh_increment, 0, 999)
                            ,labelWidth         : 155
                            ,width              : 195
                            ,minValue           : 0
                            ,maxValue           : 999
                            ,maxLength          : 3
                            ,enforceMaxLength   : true
                            ,enableKeyEvents    : true
                            ,spinDownEnabled    : false
                            ,spinUpEnabled      : false
                            ,hideTrigger        : true
                            ,allowDecimals      : false
                            ,listeners          : {
                                change              : function(num, newVal, oldVal, eOpts) {
                                    num.originalValue = newVal;
                                }
                                ,blur               : function(num, eOpts) {
                                    var newVal = Ext.getCmp("adp_mon_refresh_incr").getValue();
                                    if(!newVal) {
                                        newVal = 0;
                                        Ext.getCmp("adp_mon_refresh_incr").setValue(0);
                                    }
                                    if(newVal != CP.adp_mon_mem.refresh_increment || CP.adp_mon_mem.REFRESH_TASK === null) {
                                        CP.adp_mon_mem.refresh_increment = newVal;
                                        switch( newVal ) {
                                            case 0:
                                                CP.adp_monitor.stop_refresh_task();
                                                break;
                                            default:
                                                CP.adp_monitor.start_refresh_task();
                                        }
                                    }
                                }
                                ,beforedestroy      : function(num, eOpts) {
                                    CP.adp_monitor.stop_refresh_task();
                                }
                                ,afterrender        : function(num, eOpts) {
                                    num.fireEvent("blur");
                                }
                                ,keypress           : function(num, e, eOpts) {
                                    switch( e.getKey() ) {
                                        case e.RETURN:
                                        case e.ENTER:
                                            num.fireEvent("blur");
                                            e.stopEvent();
                                            break;
                                        default:
                                    }
                                }
                            }
                        },{
                            xtype   : "cp4_label"
                            ,text   : "seconds"
                            ,style  : "margin-top:3px;margin-left:10px;"
                        }
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "adp_active_form"
                    ,margin : 0
                    ,items  : [ itemsArr ]
                },{
                    //inline info message
                    xtype   : "cp4_inlinemsg"
                    ,type   : "related"
                    ,text   : 'Related Topics: <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/interfaces\', \'url\', \'config\');return false;">Network Interfaces</a>'
                }
            ]
        });
        return monitorPanel;
    }
    ,doLoad: function() {

        function test_removeAll_store(stId) {
            var st = Ext.getStore(stId);
            if(st) {
                st.removeAll();
            }
        }
        function test_load_store(stId, d, id) {
            var st = Ext.getStore(stId);
            if(st) {
                if(d && d[id]) {
                    st.loadData(d[id]);
                } else {
                    st.removeAll();
                }
            }
        }

        var mPanel = Ext.getCmp("adp_monitorPanel");
        if( CP.global.monitorTab == false ) {
            CP.adp_monitor.stop_refresh_task();
        } else if(mPanel) {
            mPanel.load({
                url         : "/cgi-bin/adp_monitor.tcl"
                ,method     : "GET"
                ,success    : function(p, action) {
                    var data = null;
                    if(action && action.result && action.result.data) {
                        data = action.result.data;
                    }
                    if(data !== null) {
                        var cList;
                        var connString;
                        var i,j,idx;

                        CP.adp_monitor.ADP_DEVICE = data.adp_device_present ? true : false;
                        CP.adp_monitor.ADP_DEMO = data.adp_demo ? true : false;
                        var adp_label = Ext.getCmp("adp_device_present_label");
                        if(adp_label) {
                            adp_label.setVisible(!(CP.adp_monitor.ADP_DEVICE) && !(CP.adp_monitor.ADP_DEMO));
                        }
                        var adp_demo = Ext.getCmp("adp_mon_demo_label");
                        if(adp_demo) {
                            adp_demo.setVisible( CP.adp_monitor.ADP_DEMO );
                        }
                        var adp_active = Ext.getCmp("adp_active_form");
                        if(adp_active) {
                            adp_active.setVisible( CP.adp_monitor.ADP_DEVICE || CP.adp_monitor.ADP_DEMO );
                        }
                        var adp_refresh_form = Ext.getCmp("adp_mon_refresh_form");
                        if(adp_refresh_form) {
                            adp_refresh_form.setVisible( CP.adp_monitor.ADP_DEVICE || CP.adp_monitor.ADP_DEMO );
                        }
                        if(!CP.adp_monitor.ADP_DEVICE && !CP.adp_monitor.ADP_DEMO) {
                            CP.adp_monitor.stop_refresh_task();
                        } else if(CP.adp_mon_mem.REFRESH_TASK == null) {
                            CP.adp_monitor.start_refresh_task();
                        }

                        if(mPanel.isVisible(true) && (CP.adp_monitor.ADP_DEMO || CP.adp_monitor.ADP_DEVICE)) {
                            for(i = 0; i < data.slots_list.length; i++) {
                                CP.adp_monitor.calculate_a_summary_set( data.slots_list[i] );
                            }
                            test_load_store("adp_mon_summary_store"     ,data   ,"slots_list");
                            if(CP.adp_monitor.slot_idx > -1) {
                                var foundIndex = false;
                                for(i = 0; !(foundIndex) && i < data.slots_list.length; i++) {
                                    if(data.slots_list[i].slotIdx == CP.adp_monitor.slot_idx) {
                                        CP.adp_monitor.raw_slot_idx = data.slots_list[i].slotRaw;
                                        test_load_store("adp_mon_individual_store",data.slots_list[i],"cores_list");
                                        CP.adp_monitor.set_core_axis_title();
                                        foundIndex = true;
                                        break;
                                    }
                                }
                                if(!foundIndex && data.slots_list.length > 0) {
                                    CP.adp_monitor.slot_idx     = data.slots_list[0].slotIdx;
                                    CP.adp_monitor.raw_slot_idx = data.slots_list[0].slotRaw;
                                    test_load_store("adp_mon_individual_store",data.slots_list[0],"cores_list");
                                    CP.adp_monitor.set_core_axis_title();
                                }
                            } else {
                                Ext.getStore("adp_mon_individual_store").removeAll();
                            }
                            CP.adp_monitor.doRefresh();
                        }
                    }
                }
                ,failure    : function(p, action) {
                    //test_removeAll_store("adp_mon_summary_store");
                    //test_removeAll_store("adp_mon_individual_store");
                    //CP.adp_monitor.doRefresh();
                }
            });
        }
    }

    //automatic refresh
    ,start_refresh_task: function() {
        if( CP.adp_mon_mem.REFRESH_TASK ) {
            CP.adp_monitor.stop_refresh_task();
        }
        var i = parseInt(Ext.Number.constrain(CP.adp_mon_mem.refresh_increment, 0, 999), 10);
        if( i > 0 ) {
            CP.adp_mon_mem.REFRESH_TASK = {
                interval: (i * 1000)
                ,run    : CP.adp_monitor.doLoad
            };
            Ext.TaskManager.start( CP.adp_mon_mem.REFRESH_TASK );
            return true;
        }
        return false;
    }
    ,stop_refresh_task: function() {
        if( CP.adp_mon_mem.REFRESH_TASK ) {
            Ext.TaskManager.stop( CP.adp_mon_mem.REFRESH_TASK );
            CP.adp_mon_mem.REFRESH_TASK = null;
        }
    }

    ,set_core_axis_title: function() {
        var slot_idx = CP.adp_monitor.raw_slot_idx;
        var np_slot_label = Ext.getCmp("np_slot_displayfield");
        if(np_slot_label) {
            np_slot_label.setValue( slot_idx );
        }
        CP.adp_monitor.update_average_fields();
    }
    ,update_average_fields: function() {
        var r = Ext.getStore("adp_mon_individual_store").getRange();
        var avgU = Ext.getCmp("adp_mon_table_avg_Usage");
        var avgC = Ext.getCmp("adp_mon_table_avg_averageConn");
        var U = 0;
        var U_cnt = 0;
        var C = 0;
        var C_cnt = 0;
        var i = 0;
        if (r.length > 0) {
            for(i = 0; i < r.length; i++) {
                if (Ext.typeOf(r[i].data.Usage) == "number") {
                    U += r[i].data.Usage;
                    U_cnt++;
                }
                if (Ext.typeOf(r[i].data.coreConn) == "number") {
                    C += r[i].data.coreConn;
                    C_cnt++;
                }
            }
        }
        switch(Ext.typeOf(U)) {
            case "number":
                U /= Math.max(1, U_cnt);
                break;
            default:
                U = 0;
        }
        switch(Ext.typeOf(C)) {
            case "number":
                C /= Math.max(1, C_cnt);
                break;
            default:
                C = 0;
        }
        U = String(CP.ar_util.safeToFixed(U, 2)) +"&#37;";
        if(avgU) {
            avgU.setValue( U );
        }
        C = CP.adp_monitor.comma_sep_number(String(CP.ar_util.safeToFixed(C, 2)));
        if(avgC) {
            avgC.setValue( C );
        }

        CP.adp_monitor.average_test = {
            "averageUsage": U
            ,"averageConn": C
        };
    }
    ,sort_individual_chart: function( sortField ) {
        var fixedField = "";
        switch( String(sortField).toLowerCase() ) {
            case "usage":
            case "usages":
            case "load":
            case "loads":
            case "adp_mon_usage_tab":
                fixedField = "Usage";
                break;
            case "connection":
            case "connections":
            case "adp_mon_conn_tab":
                fixedField = "Connections";
                break;
            default:
        }
        if( fixedField != "" && Ext.getStore("adp_mon_individual_store").sort(fixedField, "ASC") ) {
            CP.adp_monitor.refresh_core_chart();
        } else {
            CP.adp_monitor.refresh_core_chart();
        }
    }

    ,refreshChart: function(chartId) {
        var chart = Ext.getCmp(chartId);
        if(chart && chart.isVisible(true) && chart.hidden == false && CP.global.activeTab == "monitor") {
            try { chart.redraw(); } catch(errorCode) { }
        }
    }
    ,doRefresh: function() {
        //adjust color ranges for core load and connections bars
        //recalculate the histograms for summary chart
        CP.adp_monitor.refresh_summary_chart();
    }
    ,calculate_summary_chart_values: function() {
        var s_st = Ext.getStore("adp_mon_summary_store");
        if(!s_st) { return; }
        var recs = s_st.getRange();
        var cList;
        var i,j,idx;
        var connString;
        var loadString;
        for(i = 0; i < recs.length; i++) {
            CP.adp_monitor.calculate_a_summary_set(recs[i].data);
        }
        CP.adp_monitor.refresh_summary_chart();
    }
    ,calculate_a_summary_set: function(slot_entry) {
        var i,idx;
        var cList = slot_entry.cores_list;

        slot_entry["Range_0"] = 0;
        slot_entry["Range_1"] = 0;
        slot_entry["Range_2"] = 0;
        slot_entry["Range_3"] = 0;

        for(i = 0; i < cList.length; i++) {
            switch(slot_entry.mode) {
                case "connections":
                    idx = CP.adp_monitor.getConnRangeIndex( cList[i].Connections );
                    if(0 <= idx && idx <= 3) {
                        slot_entry["Range_"+ String(idx)]++;
                    }
                    break;
                default:
                    idx = CP.adp_monitor.getLoadRangeIndex( cList[i].coreLoadRaw );
                    if(0 <= idx && idx <= 3) {
                        slot_entry["Range_"+ String(idx)]++;
                    }
            }
        }
    }
    ,refresh_summary_chart: function() {
        CP.adp_monitor.refreshChart("adp_mon_summary_chart");
    }
    ,refresh_core_chart: function() {
        var i;
        for(i = 0; i < CP.adp_monitor.adp_mon_indiv_chart_id_list.length; i++) {
            CP.adp_monitor.refreshChart(CP.adp_monitor.adp_mon_indiv_chart_id_list[i]);
        }
        var g = Ext.getCmp("adp_mon_individual_grid");
        if(g && g.refreshIfVisible) {
            g.refreshIfVisible();
        }
    }

//TOOLS - DIVIDERS//////////////////////////////////////////////////////////////
    ,get_tools_dividers: function() {
        var slider_labelWidth = 150;
        var number_width = 38;
        var divLabelWidth = 50;
        var divFontString = "text-align:center;" //+"font-weight:bold;";
        var divMarginString = "margin-top:4px;margin-left:10px;margin-right:10px;";

        var lowLabel = {
            xtype       : "cp4_label"
            ,text       : "Low"
            ,width      : divLabelWidth
            ,style      : "background-color:#00E600;"+ divFontString + divMarginString
        };
        var midLabel = {
            xtype       : "cp4_label"
            ,text       : "Medium"
            ,width      : divLabelWidth
            ,style      : "background-color:#E6E600;"+ divFontString + divMarginString
        };
        var hiLabel = {
            xtype       : "cp4_label"
            ,text       : "High"
            ,width      : divLabelWidth
            ,style      : "background-color:#E60000;"+ divFontString + divMarginString
        };
        var percentLabel = {
            xtype       : "cp4_label"
            ,text       : "%"
            ,width      : 13
            ,style      : "text-align:right;margin-top:4px;"
        };

        //coreConn range sliders
        var coreConnDivider = {
            xtype       : "cp4_formpanel"
            ,id         : "coreConnSlider"
            ,layout     : "column"
            ,getValues  : function() {
                var arr = [];
                var d, i;
                for(i = 0; Ext.getCmp("coreConnDiv"+ String(i)); i++) {
                    d = Ext.getCmp("coreConnDiv"+ String(i));
                    arr.push(d.getValue());
                }
                return arr;
            }
            ,adjustDiv  : function() {
                CP.adp_mon_mem.coreConnRange = Ext.getCmp("coreConnSlider").getValues();
                CP.adp_monitor.refresh_core_chart();
            }
            ,items      : [
                {
                    xtype       : "cp4_label"
                    //,text       : "Connection Range Divisions (Green):"
                    ,text       : "Connection Range Divisions:"
                    ,width      : slider_labelWidth
                    ,style      : "margin-top:4px;"
                }
                ,lowLabel
                ,{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,id                 : "coreConnDiv0"
                    ,value              : CP.adp_mon_mem.coreConnRange[0]
                    ,width              : number_width
                    ,emptyText          : "0 "
                    ,enableKeyEvents    : true
                    ,spinDownEnabled    : false
                    ,spinUpEnabled      : false
                    ,hideTrigger        : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 999
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,getFixedValue      : function() {
                        var v = Ext.getCmp("coreConnDiv0").getRawValue();
                        if(v == "") {
                            v = 0;
                        }
                        return parseInt(v, 10);
                    }
                    ,listeners          : {
                        change      : function(num, newVal, oldVal, eOpts) {
                            num.originalValue = newVal;
                        }
                        ,blur       : function(num, eOpts) {
                            Ext.getCmp("coreConnSlider").adjustDiv();
                        }
                        ,keypress   : function(num, e, eOpts) {
                            switch( e.getKey() ) {
                                case e.RETURN:
                                case e.ENTER:
                                    num.fireEvent("blur");
                                    e.stopEvent();
                                    break;
                                default:
                            }
                        }
                    }
                }
                ,percentLabel
                ,midLabel
                ,{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,id                 : "coreConnDiv1"
                    ,value              : CP.adp_mon_mem.coreConnRange[1]
                    ,width              : number_width
                    ,emptyText          : "999 "
                    ,enableKeyEvents    : true
                    ,spinDownEnabled    : false
                    ,spinUpEnabled      : false
                    ,hideTrigger        : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 999
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,getFixedValue      : function() {
                        var v = Ext.getCmp("coreConnDiv1").getRawValue();
                        if(v == "") {
                            v = 999;
                        }
                        return parseInt(v, 10);
                    }
                    ,listeners          : {
                        change      : function(num, newVal, oldVal, eOpts) {
                            num.originalValue = newVal;
                        }
                        ,blur       : function(num, eOpts) {
                            Ext.getCmp("coreConnSlider").adjustDiv();
                        }
                        ,keypress   : function(num, e, eOpts) {
                            switch( e.getKey() ) {
                                case e.RETURN:
                                case e.ENTER:
                                    num.fireEvent("blur");
                                    e.stopEvent();
                                    break;
                                default:
                            }
                        }
                    }
                }
                ,percentLabel
                ,hiLabel
            ]
        };

        //Core Load range sliders
        var coreLoadDivider = {
            xtype       : "cp4_formpanel"
            ,id         : "coreLoadSlider"
            ,layout     : "column"
            ,getValues  : function() {
                var arr = [];
                var d, i;
                for(i = 0; Ext.getCmp("coreLoadDiv"+ String(i)); i++) {
                    d = Ext.getCmp("coreLoadDiv"+ String(i));
                    arr.push(d.getValue());
                }
                return arr;
            }
            ,adjustDiv  : function() {
                CP.adp_mon_mem.coreLoadRange = Ext.getCmp("coreLoadSlider").getValues();
                CP.adp_monitor.refresh_core_chart();
                CP.adp_monitor.calculate_summary_chart_values();
            }
            ,items      : [
                {
                    xtype       : "cp4_label"
                    //,text       : "Usage Range Divisions (Blue):"
                    ,text       : "Usage Range Divisions:"
                    ,width      : slider_labelWidth
                    ,style      : "margin-top:4px;"
                }
                ,lowLabel
                ,{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,id                 : "coreLoadDiv0"
                    ,value              : CP.adp_mon_mem.coreLoadRange[0]
                    ,width              : number_width
                    ,emptyText          : "0 "
                    ,enableKeyEvents    : true
                    ,spinDownEnabled    : false
                    ,spinUpEnabled      : false
                    ,hideTrigger        : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 100
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,getFixedValue      : function() {
                        var v = Ext.getCmp("coreLoadDiv0").getRawValue();
                        if(v == "") {
                            v = 0;
                        } else if(parseInt(v, 10) > 100) {
                            v = 100;
                        }
                        return parseInt(v, 10);
                    }
                    ,listeners          : {
                        change      : function(num, newVal, oldVal, eOpts) {
                            num.originalValue = newVal;
                        }
                        ,blur       : function(num, eOpts) {
                            Ext.getCmp("coreLoadSlider").adjustDiv();
                        }
                        ,keypress   : function(num, e, eOpts) {
                            switch( e.getKey() ) {
                                case e.RETURN:
                                case e.ENTER:
                                    num.fireEvent("blur");
                                    e.stopEvent();
                                    break;
                                default:
                            }
                        }
                    }
                }
                ,percentLabel
                ,midLabel
                ,{
                    xtype               : "cp4_numberfield"
                    ,hideLabel          : true
                    ,id                 : "coreLoadDiv1"
                    ,value              : CP.adp_mon_mem.coreLoadRange[1]
                    ,width              : number_width
                    ,emptyText          : "100 "
                    ,enableKeyEvents    : true
                    ,spinDownEnabled    : false
                    ,spinUpEnabled      : false
                    ,hideTrigger        : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 100
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                    ,getFixedValue      : function() {
                        var v = Ext.getCmp("coreLoadDiv1").getRawValue();
                        if(v == "") {
                            v = 100;
                        } else if(parseInt(v, 10) > 100) {
                            v = 100;
                        }
                        return parseInt(v, 10);
                    }
                    ,listeners          : {
                        change      : function(num, newVal, oldVal, eOpts) {
                            num.originalValue = newVal;
                        }
                        ,blur       : function(num, eOpts) {
                            Ext.getCmp("coreLoadSlider").adjustDiv();
                        }
                        ,keypress   : function(num, e, eOpts) {
                            switch( e.getKey() ) {
                                case e.RETURN:
                                case e.ENTER:
                                    num.fireEvent("blur");
                                    e.stopEvent();
                                    break;
                                default:
                            }
                        }
                    }
                }
                ,percentLabel
                ,hiLabel
            ]
        };

        return [coreLoadDivider, coreConnDivider];
    }

    ,mySummaryColorArray    : [ "hsl(120, 100%, 80%)",
                                "hsl(120, 100%, 60%)",
                                "hsl(120, 100%, 40%)",
                                "hsl(120, 100%, 20%)",
                                "hsl(240, 100%, 80%)",
                                "hsl(240, 100%, 60%)",
                                "hsl(240, 100%, 40%)",
                                "hsl(240, 100%, 20%)",
                                "#a66111"]

    ,myIndividualColorArray : [ "hsl(120, 100%, 50%)",
                                "hsl(240, 100%, 50%)",
                                "hsl(120, 100%, 60%)",
                                "hsl(240, 100%, 60%)",
                                "hsl(120, 100%, 40%)",
                                "hsl(240, 100%, 40%)",
                                "hsl(120, 100%, 20%)",
                                "hsl(240, 100%, 20%)",
                                "#a66111"]

    ,hslToRgb: function(h0, s0, l0) {
        var h = (h0/360.0), s = (s0/100.0), l = (l0/100.0);
        var r = 0, g = 0, b = 0;
        if(s == 0) {
            r = g = b = l;
        } else {
            function hue2rgb(p, q, t) {
                if(t < 0)   t += 1;
                if(t > 1)   t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return  [parseInt((r * 255), 10)
                ,parseInt((g * 255), 10)
                ,parseInt((b * 255), 10)];
    }

    ,getLoadColor: function(idx, oldColor) {
        return CP.adp_monitor.getColorValue(idx, "load", String(oldColor).toLowerCase() );
    }
    ,getConnColor: function(idx, oldColor) {
        return CP.adp_monitor.getColorValue(idx, "connection", String(oldColor).toLowerCase() );
    }
    ,getColorValue: function(idx, mode, oldColor) {
        var hslArr = CP.adp_monitor.getColorValueHSL(idx, mode);
        var rgb = CP.adp_monitor.hslToRgb(hslArr[0], hslArr[1], hslArr[2]);
        return String( "rgb("+ rgb[0] +", "+ rgb[1] +", "+ rgb[2] +")" );
    }
    ,getColorValueHSL: function(idx, mode) {
        function getHue(idx, mode) {
            switch(idx) {
                case 0:     //green
                    return "120";
                case 1:     //yellow
                    return "60";
                case 2:     //red
                    return "0";
                default:
            }
            //purple
            return "300";
        }
        function getSaturation(idx, mode) {
            return "100";
        }
        function getLevel(idx, mode) {
            return "45";
        }
        var h = getHue(idx, mode),
            s = getSaturation(idx, mode),
            l = getLevel(idx, mode);
        return [h, s, l];
        //return "hsl("+ h +", "+ s +"%, "+ l +"%)";
    }
    ,getColorMode: function(colorString) {
        var colorMode = "";
        switch( Ext.typeOf( colorString ) ) {
            case "string":
                if( colorString.toLowerCase().indexOf("rgb") >= 0 ) {
                    colorMode = CP.adp_monitor.getColorModeRGB( colorString );
                } else {
                    colorMode = CP.adp_monitor.getColorModeHSL( colorString );
                }
                break;
            default:
                //??
        }
        return colorMode;
    }
    ,getColorModeHSL: function(colorString) {
        var cpy = String(colorString).toLowerCase();
        cpy = cpy.replace("hsl(","");
        cpy = cpy.replace(")","");
        cpy = cpy.replace(/ /g,"");
        cpy = cpy.replace(/%/g,"");
        var hsl = cpy.split(",");
        var h = parseInt(hsl[0], 10);
        switch(h) {
            case CP.adp_monitor.CONNECTIONS_COLOR_HUE:
                return "connections";
                break;
            case CP.adp_monitor.LOADS_COLOR_HUE:
                return "loads";
                break;
            default:
        }
        return "";
    }
    ,getColorModeRGB: function(colorString) {
        //given a color string, parse it to to figure out which mode originally generated it
        //return "connections" if green tone (r == b), or "loads" if blue tone (r == g)
        var cpy = String(colorString);
        cpy = cpy.replace("rgb(","");
        cpy = cpy.replace(")","");
        cpy = cpy.replace(/ /g, "");
        var rgb = cpy.split(",");
        var r = parseInt(rgb[0], 10),
            g = parseInt(rgb[1], 10),
            b = parseInt(rgb[2], 10);
        if(r == b) {
            return "connections";
        } else if(r == g) {
            return "loads";
        }
        //else return based on highest value
        if(g > b) {
            return "connections";
        } else if(b > g) {
            return "loads";
        }
        //?
        return "";
    }

    ,getRangeIndex: function(value, RANGE) {
        var i = 0;
        for(i = 0; i < RANGE.length; i++) {
            if(value <= RANGE[i]) {
                return i;
            }
        }
        return RANGE.length;
    }
    ,getLoadRangeIndex: function(loadVal) {
        var RANGE = Ext.getCmp("coreLoadSlider").getValues();
        return CP.adp_monitor.getRangeIndex(loadVal, RANGE);
    }
    ,getConnRangeIndex: function(connVal) {
        var RANGE = Ext.getCmp("coreConnSlider").getValues();
        return CP.adp_monitor.getRangeIndex(connVal, RANGE);
    }

    ,getLoadSummaryString: function(coreCnt, index) {
        var RANGE = Ext.getCmp("coreLoadSlider").getValues();
        var lowU = 25;
        var highU = RANGE[index];
        var coreString = String(coreCnt)+ " Cores";
        switch(index) {
            case 0:
                return String(coreString +"<br>(Usage <= "+ highU +"&#37;)");
                break;
            case RANGE.length:
                highU = RANGE[RANGE.length - 1];
                return String(coreString +"<br>(Usage > "+ highU +"&#37;)");
                break;
            default:
                if(index <= 0) {
                    return String(coreString +" in this Load Range");
                }
                lowU = RANGE[index - 1];
                return String(coreString +"<br>(Usage > "+ lowU +"&#37;, <= "+ highU +"&#37;)");
        }
        return String(coreString +" in this Load Range");
    }
    ,getConnSummaryString: function(coreCnt, index) {
        var RANGE = Ext.getCmp("coreConnSlider").getValues();
        var lowU = 25;
        var highU = RANGE[index];
        var coreString = String(coreCnt)+ " Cores";
        switch(index) {
            case 0:
                return String(coreString +"<br>(Connections <= "+ highU +"&#37;)");
                break;
            case RANGE.length:
                highU = RANGE[RANGE.length - 1];
                return String(coreString +"<br>(Connections > "+ highU +"&#37;)");
                break;
            default:
                if(index <= 0) {
                    return String(coreString +" in this Connections Range");
                }
                lowU = RANGE[index - 1];
                return String(coreString +"<br>(Connections > "+ lowU +"&#37;, <= "+ highU +"&#37;)");
        }
        return String(coreString +" in this Connections Range");
    }

//override chart theme for axis/////////////////////////////////////////////////
    ,override_chart_axis_theme: function(chart) {
        var fontString = "bold 12px arial, Arial, helvetica, Helvetica, sans-serif, Sans-serif"
        chart.themeAttrs.axisTitleBottom.font = fontString;
        chart.themeAttrs.axisTitleLeft.font = fontString;
        chart.themeAttrs.axisTitleRight.font = fontString;
        chart.themeAttrs.axisTitleTop.font = fontString;
    }

//SLOT SUMMARY SECTION//////////////////////////////////////////////////////////
    ,get_summary_section: function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "SAM (Security Acceleration Module) Usage Summary"
            }
            ,CP.adp_monitor.get_summary_chart()
            ,{
                xtype       : "cp4_inlinemsg"
                ,text       : "Click a NP column above to load it into the Detailed Core Chart below."
                ,width      : 400
            }
        ];
    }
    ,get_summary_chart: function() {
        return {
            xtype       : "cp4_chart"
            ,id         : "adp_mon_summary_chart"
            ,width      : CP.adp_monitor.SUMMARY_CHART_WIDTH
            ,height     : CP.adp_monitor.SUMMARY_CHART_HEIGHT
            ,style      : "background:#fff"
            ,animate    : CP.adp_monitor.ANIMATE_CHARTS
            ,store      : Ext.getStore("adp_mon_summary_store")
            //,legend     : { position: "right" }
            ,axes       : [{
                type        : "Category"
                ,position   : "bottom"
                ,fields     : ["slot"]
            },{
                type        : "Numeric"
                ,position   : "left"
                ,fields     :   ["Range_0"
                                ,"Range_1"
                                ,"Range_2"]
                ,title      : "Number of Cores"
                ,grid       : true
            }]
            ,listeners  : {
                beforerender    : function(chart, eOpts) {
                    CP.adp_monitor.override_chart_axis_theme(chart);
                }
                ,afterrender    : function(chart, eOpts) {
                    chart.themeAttrs.colors = CP.adp_monitor.mySummaryColorArray;
                    CP.adp_monitor.refresh_summary_chart();
                }
            }
            ,series     : [{
                type        : "column"
                ,axis       : "left"
                ,xField     : "slot"
                ,yField     :   ["Range_0"
                                ,"Range_1"
                                ,"Range_2"
                                ,"Range_3"]
                ,stacked    : true
                ,groupGutter: 0
                ,gutter     : 66
                ,highlight  : false
                ,renderer   : function(sprite, record, attr, index, store) {
                    var rec = null;
                    var chart = null;
                    var series = null;
                    var seriesItems = [];
                    var yFieldCnt = 4;
                    var colorStr = "";

                    try {
                        if(sprite && sprite.surface) {
                            chart = Ext.getCmp(sprite.surface.id);
                            series = chart.series.items[0];
                            seriesItems = series.items;
                            rec = seriesItems[index].storeItem;
                            yFieldCnt = series.yField.length;
                        } else {
                            //max index is 4 * slots - 1
                            var i = index % 8;
                            var m = (i < 4) ? "connections" : "loads";
                            colorStr = CP.adp_monitor.getColorValue(i%4, m);
                        }
                    } catch(errorIndex) {
                        return attr;
                    }

                    var colorIdx = index % yFieldCnt;
                    var oldMode = "";
                    oldMode = CP.adp_monitor.getColorMode( String(attr.fill) );

                    if(rec && oldMode != "") {
                        switch(rec.data.mode) {
                            case "loads":
                            case "connections":
                                colorStr = CP.adp_monitor.getColorValue(colorIdx, rec.data.mode);
                                break;
                            default:
                        }

                        try {
                            attr["stroke"] = "rgb(255, 255, 255)";
                            attr["stroke-width"] = 0;
                            sprite["stroke-width"] = 5;
                        } catch(errorIndex) {
                        }

                    } else {
                        attr["stroke"] = "rgb(255, 255, 255)";
                        attr["stroke-width"] = 0;
                    }

                    if(colorStr.length > 0) {
                        attr["fill"] = colorStr;
                    }
                    return attr;
                }
                ,tips       : {
                    trackMouse  : true
                    ,width      : 200
                    ,height     : 40
                    ,mouseOffset: [ -100, 0 ]
                    ,renderer   : function(storeItem, item) {
                        var v = item.value[1];
                        var titleString = "";
                        var attr = item.attr;
                        var colorArray = item.series.colorArrayStyle;
                        var range_index = Ext.Array.indexOf(colorArray, attr.fill);

                        switch(storeItem.data.mode) {
                            case "connections":
                                titleString = CP.adp_monitor.getConnSummaryString(v, range_index);
                                break;
                            case "loads":
                                titleString = CP.adp_monitor.getLoadSummaryString(v, (range_index % 4) );
                                break;
                            default:
                                titleString = String(v) +" Cores";
                        }
                        this.setTitle(titleString);
                    }
                }
                ,listeners  : {
                    "itemmouseup"   : function(item) {
                        var i_st        = Ext.getStore("adp_mon_individual_store");
                        if(!i_st) { return; }
                        i_st.loadData(item.storeItem.data.cores_list);
                        CP.adp_monitor.slot_idx = item.storeItem.data.slotIdx;
                        CP.adp_monitor.raw_slot_idx = item.storeItem.data.slotRaw;
                        CP.adp_monitor.set_core_axis_title();
                    }
                }
            }]
        };
    }

//INDIVIDUAL CORE SECTION///////////////////////////////////////////////////////
    ,get_individual_section: function() {
        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Detailed Core Information"
                //,margin     : "10 0 10 0"
            },{
                xtype       : "cp4_displayfield"
                ,fieldLabel : "NP Number"
                ,id         : "np_slot_displayfield"
                ,labelWidth : 100
                ,width      : 150
                ,height     : 22
            },{
                xtype       : "cp4_tabpanel"
                ,id         : "adp_mon_individual_chart_tabpanel"
                ,width      : CP.adp_monitor.INDIVIDUAL_CHART_WIDTH + 15
                ,defaults   : {
                    xtype       : "cp4_panel"
                    ,autoScroll : true
                    ,height     : CP.adp_monitor.INDIVIDUAL_CHART_HEIGHT + 15
                }
                ,listeners  : {
                    tabchange   : function(tabpanel, newCard, oldCard, eOpts) {
                        var save_win = Ext.getCmp("save_data_window");
                        var id = newCard.getId();
                        if (id != "adp_mon_table_tab") {
                            if (save_win && save_win.close) {
                                save_win.close();
                            }
                        }
                    }
                }
                ,items      : [
                    {
                        title       : "Usage"
                        ,id         : "adp_mon_usage_tab"
                        ,items      : [
                            CP.adp_monitor.get_individual_chart_usage()
                        ]
                        ,listeners  : {
                            activate    : function(tab, eOpts) {
                                CP.adp_monitor.sort_individual_chart("Usage");
                            }
                        }
                    },{
                        title       : "Connections"
                        ,id         : "adp_mon_conn_tab"
                        ,items      : [
                            CP.adp_monitor.get_individual_chart_conn()
                        ]
                        ,listeners  : {
                            activate    : function(tab, eOpts) {
                                CP.adp_monitor.sort_individual_chart("Connections");
                            }
                        }
                    },{
                        title       : "Table"
                        ,id         : "adp_mon_table_tab"
                        ,items      : [
                            {
                                xtype   : "cp4_formpanel"
                                ,layout : "column"
                                ,items  : [
                                    CP.adp_monitor.get_individual_grid()
                                    ,{
                                        xtype   : "cp4_formpanel"
                                        ,layout : "vbox"
                                        ,padding: "15 0 0 15"
                                        ,width  : CP.adp_monitor.INDIVIDUAL_CHART_WIDTH
                                                - CP.adp_monitor.INDIVIDUAL_TABLE_WIDTH
                                        ,height : CP.adp_monitor.INDIVIDUAL_TABLE_HEIGHT
                                        ,items  : [
                                            {
                                                xtype       : "cp4_displayfield"
                                                ,fieldLabel : "Average Usage"
                                                ,id         : "adp_mon_table_avg_Usage"
                                                ,labelWidth : 150
                                                ,width      : 250
                                                ,height     : 22
                                            },{
                                                xtype       : "cp4_displayfield"
                                                ,fieldLabel : "Average Connections"
                                                ,id         : "adp_mon_table_avg_averageConn"
                                                ,labelWidth : 150
                                                ,width      : 250
                                                ,height     : 22
                                            },{
                                                xtype       : "tbspacer"
                                                ,width      : 15
                                                ,flex       : 1
                                            },{
                                                xtype       : "cp4_formpanel"
                                                ,layout     : "hbox"
                                                ,height     : 22
                                                ,width      : CP.adp_monitor.INDIVIDUAL_CHART_WIDTH
                                                            - CP.adp_monitor.INDIVIDUAL_TABLE_WIDTH
                                                            - 15
                                                ,items      : [
                                                    {
                                                        xtype       : "tbspacer"
                                                        ,height     : 10
                                                        ,flex       : 1
                                                    },{
                                                        xtype       : "cp4_button"
                                                        ,text       : CP.adp_monitor.open_save_data_window_text
                                                        ,handler    : function(b, e) {
                                                            CP.adp_monitor.save_data_window();
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                        ,listeners  : {
                            activate    : function(tab, eOpts) {
                                var g = Ext.getCmp("adp_mon_individual_grid");
                                if(g && g.refreshIfVisible) {
                                    g.refreshIfVisible();
                                }
                            }
                        }
                    }
                ]
            }
        ];
    }

//Tab Panel contents
    ,get_individual_chart_usage: function() {
        return {
            xtype       : "cp4_chart"
            ,id         : "adp_mon_individual_chart_usage"
            ,hidden     : false
            ,width      : CP.adp_monitor.INDIVIDUAL_CHART_WIDTH
            ,height     : CP.adp_monitor.INDIVIDUAL_CHART_HEIGHT
            ,style      : "background:#fff"
            ,animate    : CP.adp_monitor.ANIMATE_CHARTS
            ,store      : Ext.getStore("adp_mon_individual_store")
            ,axes       : [{
                type        : "Category"
                ,position   : "bottom"
                ,fields     : ["core"]
                ,title      : "Core"
                //,label      : { renderer: function(v) { return ""; } }
            },{
                type        : "Numeric"
                ,position   : "left"
                ,fields     : ["Usage"]
                ,title      : "Core Usage"
                ,grid       : true
                ,minimum    : 0
                ,maximum    : 100
                ,steps      : 10
                ,adjustMinimumByMajorUnit: false
                ,adjustMaximumByMajorUnit: false
                ,label      : {
                    renderer    : function(v) {
                        return String(v)+ "&#37;";
                    }
                }
            }]
            ,listeners  : {
                beforerender    : function(chart, eOpts) {
                    CP.adp_monitor.override_chart_axis_theme(chart);
                }
            }
            ,series     : [{
                type        : "column"
                ,axis       : "left"
                ,xField     : "core"
                ,yField     : ["Usage"]
                ,gutter     : 40
                ,groupGutter: 0
                ,tipTimeout : 0
                ,tips       : CP.adp_monitor.get_individual_chart_tip_obj
                ,renderer   : function(sprite, record, attr, index, store) {
                    //sprite - series.items[index].sprite
                    //rec - storeItem, storeItem.index is the index into the store's records
                        //rec is wrong, it is doing store.getAt(index)
                        //and index can get out of range
                    //attr - series.items[index].attr
                    //index - index into the series.items
                    //store - looks accurate

                    //Solution to incorrect record:
                        //sprite -> surface (chart) -> series -> items -> 0 -> items [index] -> storeItem
                        //this should get me the true storeItem

                    //What I really need is a way to tell which yField is being used.
                        //Connections
                        //or
                        //Loads
                        //Solution to determine connections v. loads.
                            //alternate color codes,
                            //then index into color array mod 2 gives connections (0) or load (1)

                    var rec = null;
                    var chart = null;
                    var series = null;
                    var seriesItems = [];

                    try {
                        chart = Ext.getCmp(sprite.surface.id);
                        series = chart.series.items[0];
                        seriesItems = series.items;
                        rec = seriesItems[index].storeItem;
                    } catch(errorIndex) {
                        return attr;
                    }

                    var testValue = "";
                    var colorStr = "";
                    var colorIdx = 0;
                    var oldColor = String(attr.fill);
                    var type = CP.adp_monitor.getColorMode(oldColor);

                    if(rec) {
                        testValue = rec.data["coreLoadRaw"];
                        colorIdx = CP.adp_monitor.getLoadRangeIndex( testValue );
                        colorStr = CP.adp_monitor.getLoadColor(colorIdx, oldColor);
                    }

                    if( colorStr.length > 0 ) {
                        attr.fill = colorStr;
                    }
                    return attr;
                }
            }]
        };
    }
    ,get_individual_chart_conn: function() {
        return {
            xtype       : "cp4_chart"
            ,id         : "adp_mon_individual_chart_conn"
            ,hidden     : false
            ,width      : CP.adp_monitor.INDIVIDUAL_CHART_WIDTH
            ,height     : CP.adp_monitor.INDIVIDUAL_CHART_HEIGHT
            ,style      : "background:#fff"
            ,animate    : CP.adp_monitor.ANIMATE_CHARTS
            ,store      : Ext.getStore("adp_mon_individual_store")
            ,axes       : [{
                type        : "Category"
                ,position   : "bottom"
                ,fields     : ["core"]
                ,title      : "Core"
                //,label      : { renderer: function(v) { return ""; } }
            },{
                type        : "Numeric"
                ,position   : "left"
                ,fields     : ["coreConn"]
                ,title      : "Core Connections"
                ,grid       : true
                ,minimum    : 0
                ,label      : {
                    renderer    : function(v) {
                        return CP.adp_monitor.comma_sep_number(String(v));
                    }
                }
            }]
            ,listeners  : {
                beforerender    : function(chart, eOpts) {
                    CP.adp_monitor.override_chart_axis_theme(chart);
                }
            }
            ,series     : [{
                type        : "column"
                ,axis       : "left"
                ,xField     : "core"
                ,yField     : ["coreConn"]
                ,gutter     : 40
                ,groupGutter: 0
                ,tipTimeout : 0
                ,tips       : CP.adp_monitor.get_individual_chart_tip_obj
                ,renderer   : function(sprite, record, attr, index, store) {
                    var rec = null;
                    var chart = null;
                    var series = null;
                    var seriesItems = [];

                    try {
                        chart = Ext.getCmp(sprite.surface.id);
                        series = chart.series.items[0];
                        seriesItems = series.items;
                        rec = seriesItems[index].storeItem;
                    } catch(errorIndex) {
                        return attr;
                    }

                    var testValue = "";
                    var colorStr = "";
                    var colorIdx = 0;
                    var oldColor = String(attr.fill);
                    var type = CP.adp_monitor.getColorMode(oldColor);

                    if(rec) {
                        testValue = rec.data["Connections"];
                        colorIdx = CP.adp_monitor.getConnRangeIndex( testValue );
                        colorStr = CP.adp_monitor.getConnColor(colorIdx, oldColor);
                    }

                    if( colorStr.length > 0 ) {
                        attr.fill = colorStr;
                    }
                    return attr;
                }
            },{
                type        : "line"
                ,xField     : "core"
                ,yField     : ["averageConn"]
                ,showMarkers: false
                ,tipTimeout : 0
                ,tips       : {
                    trackMouse  : true
                    ,width      : 200
                    ,mouseOffset: [ -200, -55 ]
                    ,renderer   : function(storeItem, item) {
                        var a_raw = storeItem.get('averageConn');
                        var a = CP.adp_monitor.comma_sep_number( String(
                            CP.ar_util.safeToFixed(a_raw, 2) ) );
                        this.setTitle("Avg. Connections: "+ a);
                    }
                }
            }]
        };
    }
    ,get_individual_chart_tip_obj: {
        trackMouse  : true
        ,width      : 250
        ,height     : 53
        ,mouseOffset: [ -200, 0 ]
        ,renderer   : function(storeItem, item) {
            var titleString = "";

            var i;
            var v = item.value[1];

            var core_index = storeItem.data.core;
            var coreString = "Core "+ String(core_index);

            var bullet = String(" &#8226; ");
            var connBullet = bullet + String(storeItem.get('Connections')) +"&#37; Relative Connections";
            var connRawBullet = bullet + String(storeItem.get('coreConn')) +" Connections";

            var loadRaw = String(storeItem.get('coreLoadRaw'));
            var connRaw = CP.adp_monitor.comma_sep_number(String(storeItem.get('coreConn')));
            var connAvg = CP.adp_monitor.comma_sep_number(String(storeItem.get('averageConn')));
            titleString = coreString +"<br>"
                        + bullet + loadRaw +"&#37; Usage"+"<br>"
                        + bullet + connRaw +" Connections (Avg. "+ connAvg +")";

            this.setTitle(titleString);
        }
    }

    ,get_individual_grid: function() {

        function get_text_div(str, tip) {
            var retVal;
            var s   = "float:right;"
                    + "text-align:right;"
                    + "display:inline;";
            retVal = '<div data-qtip="'+tip+'" style="'+ s +'">'+ str +'&nbsp;&nbsp;</div>';
            return retVal;
        }

        function get_range_div(idx, tip) {
            var retVal;
            var bg = "#000000";
            var str = "";
            switch( String(idx) ) {
                case "0":   bg = "#00E600"; str = "Low";    break;
                case "1":   bg = "#E6E600"; str = "Medium"; break;
                case "2":   bg = "#E60000"; str = "High";   break;
            }
            if(str == "") { return ""; }
            var s   = "float:right;"
                    + "text-align:center;"
                    + "display:inline;"
                    + "width:45px;"
                    + "background-color:"+ bg +";";
            retVal = '<div data-qtip="'+tip+'" style="'+ s +'">'+ str +'</div>';
            return retVal;
        }

        var individual_grid_cm = [
            {
                text            : "Core"
                ,dataIndex      : "core"
                ,width          : 65
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = String(value) +"&nbsp;&nbsp;";
                    return CP.adp_monitor.renderer_output(retValue, retValue, "right", "black");
                }
            },{
                text            : "Usage"
                ,dataIndex      : "Usage"
                ,width          : 120
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = String( CP.ar_util.safeToFixed(value, 2) +"&#37;");
                    var i = CP.adp_monitor.getLoadRangeIndex( rec.data["Usage"] );
                    var dLeft = get_text_div(tip, tip);
                    var dRight = get_range_div(i, tip);
                    return String( dRight + dLeft );
                }
            },{
                text            : "Connections"
                ,dataIndex      : "coreConn"
                ,flex           : 1
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = CP.adp_monitor.comma_sep_number( String(value) );
                    var i = CP.adp_monitor.getConnRangeIndex( rec.data["Connections"] );
                    var dLeft = get_text_div(tip, tip);
                    var dRight = get_range_div(i, tip);
                    return String( dRight + dLeft );
                }
            }
        ];

        return {
            xtype               : "cp4_grid"
            ,id                 : "adp_mon_individual_grid"
            ,width              : CP.adp_monitor.INDIVIDUAL_TABLE_WIDTH
            ,height             : CP.adp_monitor.INDIVIDUAL_TABLE_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : Ext.getStore("adp_mon_individual_store")
            ,columns            : individual_grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,refreshIfVisible   : function() {
                var g = Ext.getCmp("adp_mon_individual_grid");
                if(g && g.isVisible()) {
                    g.getView().refresh();
                }
                CP.adp_monitor.update_average_fields();
            }
        };
    }

// Save Data Button ////////////////////////////////////////////////////////////
    ,save_data_window: function(b, e) {
        var detailed_tab_panel = Ext.getCmp("adp_mon_individual_chart_tabpanel");
        if (detailed_tab_panel) {
            var curr_tab = detailed_tab_panel.getActiveTab();
            var curr_id = (curr_tab && curr_tab.getId) ? curr_tab.getId() : "unknown";
            if (curr_id != "adp_mon_table_tab") {
                return;
            }
        } else {
            return;
        }

        //stop refresh, if it is running
        CP.adp_monitor.stop_refresh_task();

        var WIDTH = 550;
        var save_data_form = {
            xtype       : "cp4_formpanel"
            ,id         : "save_data_form"
            ,width      : (WIDTH + 40)
            ,autoScroll : true
            ,listeners  : {
                afterrender     : function(p, eOpts) {
                    p.form._boundItems = null;
                    var canGen = Ext.isGecko || Ext.isChrome || Ext.isSafari;
                    var gen_btn = Ext.getCmp("adp_mon_generate_txt_btn");
                    if(gen_btn) {
                        gen_btn.setVisible(true);
                        gen_btn.isDisabled(false);
                    }
                    var txt_info = Ext.getCmp("adp_mon_textarea_info");
                    if(txt_info) {
                        txt_info.setVisible( true );
                    }
                    var txt_area = Ext.getCmp("adp_mon_data_field");
                    if(txt_area) {
                        txt_area.setValue(CP.adp_monitor.create_comma_separated_file_text("\t"));
                        if(txt_info) {
                            txt_area.setWidth( txt_info.getWidth() );
                        }
                    }
                }
            }
            ,buttons    : [
                {
                    xtype       : "cp4_button"
                    ,id         : "save_data_btn_cancel"
                    ,text       : "Close"
                    ,handler    : function(b, e) {
                        Ext.getCmp("save_data_window").close();
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,height     : 400
                    ,width      : WIDTH
                    ,margin     : "15 0 13 15"
                    ,layout     : "vbox"
                    ,items      : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Character Separated Data as Plaintext"
                            ,margin     : "0 0 5 0"
                            ,width      : (WIDTH - 1)
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Separation Character"
                            ,id             : "adp_mon_char_sep"
                            ,name           : "adp_mon_char_sep_unique_name"
                            ,labelWidth     : 150
                            ,width          : 300
                            ,mode           : "local"
                            ,editable       : false
                            ,forceSelection : true
                            ,triggeraction  : "all"
                            ,value          : "\t"
                            ,store          :   [[",","Comma (,)"]
                                                ,["\t","Tab (\t)"]]
                            ,listeners      : {
                                change          : function(cb, newValue, oldValue, eOpts) {
                                    var txt_area = Ext.getCmp("adp_mon_data_field");
                                    if(txt_area) {
                                        txt_area.setValue(CP.adp_monitor.create_comma_separated_file_text(newValue));
                                    }
                                }
                            }
                        },{
                            xtype       : "cp4_button"
                            ,id         : "adp_mon_generate_txt_btn"
                            ,text       : "Generate and Download a Textfile"
                            ,margin     : "0 0 5 0"
                            ,hidden     : false
                            ,handler    : function(b,e) {
                                CP.adp_monitor.create_textfile_download();
                            }
                            ,disable    : function() { }
                            ,setDisabled: function() {
                                var b = this;
                                if (b && b.enable) {
                                    b.enable();
                                }
                            }
                            ,qtipText   : "Not supported in all browsers."
                            ,listeners  : {
                                afterrender     : function(c) {
                                    if(c.qtipText && c.qtipText.length > 0) {
                                        Ext.tip.QuickTipManager.register({
                                            target          : c.getId()
                                            ,text           : c.qtipText
                                            ,dismissDelay   : 0
                                        });
                                    }
                                }
                            }
                        },{
                            xtype       : "cp4_label"
                            ,text       : "Character Separated Data as Plaintext"
                            ,width      : '100%'
                            ,height     : 14
                        },{
                            xtype       : "cp4_textarea"
                            ,id         : "adp_mon_data_field"
                            ,hideLabel  : true
                            ,margin     : 0
                            ,flex       : 1
                            ,width      : (WIDTH - 5)
                            ,margin     : "0 0 2 0"
                        },{
                            xtype       : "cp4_inlinemsg"
                            ,id         : "adp_mon_textarea_info"
                            ,text       : "If your browser does not support javascript generated textfiles, you can copy and paste information above."
                            ,margin     : 0
                            ,hidden     : false
                            ,width      : '100%'
                        }
                    ]
                }
            ]
        };

        var save_data_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "save_data_window"
            ,title      : CP.adp_monitor.save_data_window_title
            ,shadow     : false
            ,modal      : true
            ,listeners  : {
                close       : function(win, eOpts) {
                    //continue the refresh task if it has an incr greater than 0
                    CP.adp_monitor.start_refresh_task();
                }
                ,show       : function(win, eOpts) {
                    win.center();
                }
                ,hide       : function(win, eOpts) {
                    win.show();
                }
            }
            ,items      : [ save_data_form ]
        });
        save_data_window.show();
    }

//create a textfile for download////////////////////////////////////////////////
    ,create_textfile_download: function() {
        //doesn't work in IE
        try {
            var textfileStr = CP.adp_monitor.create_comma_separated_file_text(
                (Ext.getCmp("adp_mon_char_sep") ? Ext.getCmp("adp_mon_char_sep").getValue() : ",")
            );
            var l = "data:text/octet-stream,"+ encodeURIComponent( textfileStr );
            window.open(l, "_blank");
            //document.location = l;
            CP.adp_monitor.test_doc = document;
        } catch(indexOfErr) {
            //do nothing?
        }
    }

//create a comma (and newline) separated string for the excel file//////////////
    ,create_comma_separated_file_text: function(sc) {
        if(!sc) {
            sc_cmp = Ext.getCmp("adp_mon_char_sep");
            if(sc_cmp) {
                sc = sc_cmp.getValue() || ",";
            } else {
                sc = ",";
            }
        }
        var st = Ext.getStore("adp_mon_summary_store");
        var i = 0, j = 0;
        var r = st.getRange();
        var cl;
        var str = "NP"+sc+"Core"+sc+"Usage"+sc+"Avg Usage"+sc+"Connections"+sc+"Avg Connections";
        var np,core,usage,uAvg,conn,cAvg;

        for(i = 0; r && i < r.length; i++) {
            cl = r[i].data.cores_list;
            for(j = 0; cl && j < cl.length; j++) {
                np      = String( cl[j].slot );
                core    = String( cl[j].core );
                usage   = String( CP.ar_util.safeToFixed(cl[j].Usage,2) ) +"%";
                uAvg    = String( CP.ar_util.safeToFixed(cl[j].averageUsage,2) ) +"%";
                conn    = String( cl[j].coreConn );
                cAvg    = String( CP.ar_util.safeToFixed(cl[j].averageConn,2) );
                if(np != "" && core != "" && usage != "" && uAvg != "" && conn != "" && cAvg != "") {
                    str += String("\n"+ np +sc+ core +sc+ usage +sc+ uAvg +sc+ conn +sc+ cAvg);
                }
            }
        }
        return str;
    }
}

