CP.pref_monitor_4 = {
    getInstance         : function() {
        return "default";
    }

    ,default_num_lines  : 40
    ,min_num_lines      : 5
    ,max_num_lines      : 100

    ,VAR_NAME           : "var_log_routed"
    ,AREA_MIN_WIDTH     : 580
    ,AREA_WIDTH         : 582
    ,AREA_MAX_WIDTH     : 900

    ,AREA_MIN_HEIGHT    : 100
    ,AREA_HEIGHT        : 420
    ,AREA_MAX_HEIGHT    : 600

    ,init               : function() {
        CP.pref_monitor_4.defineStores();
        var monitorPanel = CP.pref_monitor_4.monitorPanel();
        var obj = {
            title           : "Routing Options"
            ,panel          : monitorPanel
            ,submit         : false
            ,params         : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor);
    }

    ,defineStores       : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "pref_mon_filepath_store"
            ,fields     : [
                {
                    name        : "inst"
                    ,sortType   : function(v) {
                        if(String(v).toLowerCase() == "default") {
                            return 0;
                        }
                        return parseInt(v,10) + 1;
                    }
                }
                ,"idx"
                ,"fp"
            ]
            ,data       : []
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
            ,sorters    : [
                {property: "inst", direction: "ASC"}
                ,{property: "idx", direction: "ASC"}
            ]
        });
    }

    ,monitorPanel       : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "pref_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    CP.pref_monitor_4.get_filepath();
                }
            }
            ,items      : [
                {
                    xtype   : "cp4_formpanel"
                    ,id     : "pref_mon_form_1"
                    ,margin : 0
                    ,items  : [
                        {
                            xtype       : "cp4_sectiontitle"
                            ,titleText  : "Trace Options Log"
                            ,listeners  : {
                                resize      : function(p, adjW, adjH, eOpts) {
                                    var h   = Ext.getCmp("pref_monitorPanel").getHeight()
                                            - Ext.getCmp("pref_mon_form_1").getHeight()
                                            - Ext.getCmp("pref_mon_form_2").getHeight();
                                    h = Math.max(h, 200);
                                    Ext.getCmp("tail_text_area").setSize(adjW, h);
                                }
                            }
                        },{
                            xtype       : "cp4_formpanel"
                            ,layout     : "column"
                            ,margin     : "0 0 5 0"
                            ,items      : [
                                {
                                    xtype           : "cp4_combobox"
                                    ,fieldLabel     : "Trace File"
                                    ,id             : "file_path"
                                    ,name           : "file_path2"
                                    ,labelWidth     : 125
                                    ,width          : 300
                                    ,queryMode      : "local"
                                    ,triggerAction  : "all"
                                    ,editable       : true
                                    ,forceSelection : true
                                    ,emptyText      : "None"
                                    ,store          : Ext.getStore("pref_mon_filepath_store")
                                    ,valueField     : "fp"
                                    ,displayField   : "fp"
                                    ,style          : "margin-right:30px;"
                                    ,allowBlank     : false
                                    ,disabled       : false
                                    ,disable        : function() { }
                                    ,setDisabled    : function(d) {
                                        var c = this;
                                        if (c.isDisabled()) {
                                            c.enable();
                                        }
                                    }
                                },
                                {
                                    xtype           : "cp4_displayfield"
                                    ,fieldLabel     : "Number of Active Trace Options"
                                    ,id             : "traceoption_count"
                                    ,name           : "traceoption_count"
                                    ,labelWidth     : 175
                                    ,width          : 250
                                    ,height         : 22
                                    ,disabled       : false
                                    ,disable        : function() { }
                                    ,setDisabled    : function(d) {
                                        var c = this;
                                        if (c.isDisabled()) {
                                            c.enable();
                                        }
                                    }
                                }
                            ]
                        },{
                            xtype       : "cp4_formpanel"
                            ,layout     : "column"
                            ,margin     : "0 0 5 0"
                            ,items      : [
                                {
                                    xtype               : "cp4_numberfield"
                                    ,fieldLabel         : "Number of lines"
                                    ,id                 : "num_lines"
                                    ,labelWidth         : 125
                                    ,width              : 200
                                    ,allowDecimals      : false
                                    ,allowBlank         : true
                                    ,value              : CP.pref_monitor_4.default_num_lines
                                    ,minValue           : CP.pref_monitor_4.min_num_lines
                                    ,maxValue           : CP.pref_monitor_4.max_num_lines
                                    ,maxLength          : String(CP.pref_monitor_4.max_num_lines).length
                                    ,enforceMaxLength   : true
                                    ,enableKeyEvents    : true
                                    ,style              : "margin-right:30px;"
                                    ,disabled           : false
                                    ,disable            : function() { }
                                    ,setDisabled        : function(d) {
                                        var c = this;
                                        if (c.isDisabled()) {
                                            c.enable();
                                        }
                                    }
                                    ,listeners          : {
                                        specialkey          : function(field, e, eOpts) {
                                            if(e.getKey() == e.ENTER) {
                                                Ext.getCmp("num_lines").fireEvent("blur");
                                                e.stopEvent();
                                                CP.pref_monitor_4.getData();
                                            }
                                        }
                                        ,blur               : function(field, eOpts) {
                                            var v = Ext.getCmp("num_lines").getRawValue();
                                            if(String(v) == "") {
                                                Ext.getCmp("num_lines").setValue(40);
                                            } else if(parseInt(v,10) < 5) {
                                                Ext.getCmp("num_lines").setValue(5);
                                            } else if(parseInt(v,10) > 100) {
                                                Ext.getCmp("num_lines").setValue(100);
                                            }
                                        }
                                    }
                                },{
                                    xtype       : "cp4_button"
                                    ,text       : "Get Tail"
                                    ,id         : "get_tail_btn"
                                    ,formBind   : true
                                    ,handler    : CP.pref_monitor_4.getData
                                    ,disabled   : false
                                    ,disable    : function() { }
                                    ,setDisabled: function(d) {
                                        var c = this;
                                        if (c.isDisabled()) {
                                            c.enable();
                                        }
                                    }
                                }
                            ]
                        },{
                            xtype           : "cp4_displayfield"
                            ,fieldLabel     : "Trace File Displayed"
                            ,id             : "file_path_display"
                            ,name           : "file_path_display"
                            ,value          : ""
                            ,labelWidth     : 125
                            ,width          : 400
                            ,height         : 22
                            //,hidden         : true
                            //,hideLabel      : true
                            ,style          : "margin-right:30px;"
                        }
                    ]
                },{
                    //TextArea
                    xtype           : "cp4_textarea"
                    ,name           : CP.pref_monitor_4.VAR_NAME
                    ,id             : "tail_text_area"
                    ,margin         : 0
                    ,height         : CP.pref_monitor_4.AREA_HEIGHT
                    ,width          : CP.pref_monitor_4.AREA_WIDTH
                    //,minHeight      : CP.pref_monitor_4.AREA_MIN_HEIGHT
                    //,maxHeight      : CP.pref_monitor_4.AREA_MAX_HEIGHT
                    //,minWidth       : CP.pref_monitor_4.AREA_MIN_WIDTH
                    //,maxWidth       : CP.pref_monitor_4.AREA_MAX_WIDTH
                    ,hideLabel      : true
                    ,inputType      : "text"
                    ,disabled       : false
                    ,disable        : function() { }
                    ,setDisabled    : function(d) {
                        var c = this;
                        if (c.isDisabled()) {
                            c.enable();
                        }
                    }
                },{
                    xtype   : "cp4_formpanel"
                    ,id     : "pref_mon_form_2"
                    ,margin : 0
                    ,items  : [
                        {
                            xtype   : "cp4_inlinemsg"
                            ,type   : "info"
                            ,text   : "Minimum Number of Lines is 5, Maximum is 100, regardless of value entered."
                            ,width  : 435
                        }
                    ]
                }
            ]
        });
        return monitorPanel;
    }

    ,get_filepath       : function() {
        var p = Ext.getCmp("pref_monitorPanel");
        if(!p) {
            return;
        }
        p.load({
            url         : "/cgi-bin/pref_monitor.tcl?instance="+ CP.pref_monitor_4.getInstance()
            ,method     : "GET"
            ,success    : function(p, action) {
                var data = action.result.data;
                var fp_st = Ext.getStore("pref_mon_filepath_store");
                if(fp_st) {
                    if(data && data.file_path_list && data.file_path_list.length > 0) {
                        fp_st.loadData( data.file_path_list );
                    } else if( fp_st.getCount() ) {
                        fp_st.removeAll();
                        Ext.getCmp("file_path").setValue("");
                    }
                }
            }
            ,failure    : function() {
                var fp_st = Ext.getStore("pref_mon_filepath_store");
                if(fp_st && fp_st.getCount()) {
                    fp_st.removeAll();
                }
                Ext.getCmp("file_path").setValue("");
            }
        });
    }

    ,getData            : function() {
        var p = Ext.getCmp("pref_monitorPanel");
        if( p && p.getForm().isValid() ) {
            var fixed_numlines = Ext.getCmp("num_lines").getRawValue();
            if(fixed_numlines == "") {
                fixed_numlines = CP.pref_monitor_4.default_num_lines;
            } else {
                var minVal = CP.pref_monitor_4.min_num_lines;
                var maxVal = CP.pref_monitor_4.max_num_lines;
                fixed_numlines = Math.max( minVal, Math.min( maxVal, fixed_numlines ) );
            }
            var filepath = Ext.getCmp("file_path").getValue();
            if(filepath == "") {
                return;
            }
            Ext.getCmp("file_path_display").setValue(filepath);

            p.load({
                url         : "/cgi-bin/read_tail.tcl"
                            + "?lines="     + fixed_numlines
                            + "&filepath="  + filepath
                            + "&var_name="  + CP.pref_monitor_4.VAR_NAME
                            + "&instance="  + CP.pref_monitor_4.getInstance()
                ,method     : "GET"
                ,success    : function() {
                    CP.pref_monitor_4.get_filepath();
                }
                ,failure    : function() {
                    Ext.getCmp("tail_text_area").setValue(
                        "Trace File \'"+ filepath +"\' does not exist." + "\n" +
                        "Enabling a Trace Option will create the file."
                    );
                    CP.pref_monitor_4.get_filepath();
                }
            });
        }
    }
}

