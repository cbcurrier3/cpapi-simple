CP.ospf_monitor_4 = {
    enableColumnResize      : true

    ,MAIN_HEIGHT            : 152
    ,SUMMARY_HEIGHT         : 400
    ,INTERFACE_HEIGHT       : 130
    ,NEIGHBOR_HEIGHT        : 130
    ,DATABASE_HEIGHT        : 130
    ,ERROR_HEIGHT           : 400

    ,init                   : function() {
        CP.ospf_monitor_4.defineStores();
        var ospf_monitorPanel = CP.ospf_monitor_4.monitorPanel();

        var obj = {
            panel   : ospf_monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("ospf_monitor_ajax_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

//defineStores
    ,defineStores           : function() {

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_ajax_store"
            ,autoLoad   : false
            ,proxy      : {
                type            : "ajax"
                ,url         : "/cgi-bin/ospf2_monitor.tcl"
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
                var jsonData = Ext.decode(jsonResult.responseText);
                if (jsonData && jsonData.data) {
                    var d = jsonData.data;
                    var routed_busy = d.routed_busy ? true : false;
                    var ospf_on = d.ospf_enabled ? true : false;
                    var store_set = [{
                        sid : "ospf_monitor_summary_store"
                        ,suf: "ospfsummary"
                    },{
                        sid : "ospf_monitor_area_summary_store"
                        ,suf: "ospfsummaryarea"
                    },{
                        sid : "ospf_monitor_error_store"
                        ,suf: "errorfields"
                    },{
                        sid : "ospf_monitor_interface_store"
                        ,suf: "ospfinterfaces"
                    },{
                        sid : "ospf_monitor_neighbor_store"
                        ,suf: "ospfneighbors"
                    },{
                        sid : "ospf_monitor_database_store"
                        ,suf: "ospfdatabase"
                    },{
                        sid : "ospf_monitor_packet_store"
                        ,suf: "packetfields"
                    }];

                    var i, st;
                    for(i = 0; i < store_set.length; i++) {
                        st = Ext.getStore( store_set[i].sid );
                        if (st) {
                            st.removeAll();
                            if (d[ store_set[i].suf ] ) {
                                st.loadData( d[ store_set[i].suf ] );
                            }
                        }
                    }

                    //Ext.getCmp("ospf_monitor_summary_set").hide();
                    //Ext.getCmp("ospf_monitor_interface_set").hide();
                    //Ext.getCmp("ospf_monitor_neighbor_set").hide();
                    //Ext.getCmp("ospf_monitor_database_set").hide();
                    //Ext.getCmp("ospf_monitor_error_set").hide();

                    var busy_set    = Ext.getCmp("ospf_monitor_busy_set");
                    var content_set = Ext.getCmp("ospf_monitor_content_set");
                    var disable_set = Ext.getCmp("ospf_monitor_disabled_set");
                    if(routed_busy) {
                        if(content_set) {
                            content_set.setVisible(false);
                            content_set.setDisabled(true);
                        }
                        if(disable_set) {
                            disable_set.setVisible(false);
                            disable_set.setDisabled(true);
                        }
                        if(busy_set) {
                            busy_set.setVisible(true);
                            busy_set.setDisabled(false);
                        }
                    } else {
                        if(content_set) {
                            content_set.setVisible(ospf_on);
                            content_set.setDisabled(!ospf_on);
                        }
                        if(disable_set) {
                            disable_set.setVisible(!ospf_on);
                            disable_set.setDisabled(ospf_on);
                        }
                        if(busy_set) {
                            busy_set.setVisible(false);
                            busy_set.setDisabled(true);
                        }
                    }
                } 
            }                        
        });                
        
        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_main_store"
            ,fields     : ["monitorfield", "cnt"]
            ,proxy      : {
                type    : "ajax"
                ,url    : "/cgi-bin/ospf2_monitor.tcl?option=monitorfields&instance=" + CP.ar_util.INSTANCE()
                ,reader : {
                    type    : "json"
                    ,root   : "data.monitorfields"
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_summary_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "summary_field"
                ,"summary_value"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_area_summary_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "summaryarea_area"
                ,"area_row"
                ,"summaryarea_field"
                ,"summaryarea_value"
                ,"row"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_error_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "error_group"
                ,"error_field"
                ,"error_value"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
            ,groupField : "error_group"
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_packet_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : ["cnt", "label", "rx", "tx", "total"]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_interface_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "intf_name"
                ,"intf_address"
                ,"intf_errors"
                ,"intf_authentication_errors"
                ,"intf_hello_interval_mismatch"
                ,"intf_duplicate_router_id"
                ,"intf_dead_interval_mismatch"
                ,"intf_external_option_error"
                ,"intf_neighbor_errors"
                ,"intf_delayed_ack_count"
                ,"intf_newer_self_lsa_count"
                ,"intf_neighbor_count"
                ,"intf_lost_neighbor_count"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_neighbor_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "neighbor_id"
                ,"neighbor_priority"
                ,"neighbor_state"
                ,"neighbor_dead"
                ,"neighbor_address"
                ,"neighbor_interface"
                ,"neighbor_errors"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "ospf_monitor_database_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "database_areaid"
                ,"database_rtrlsa"
                ,"database_netlsa"
                ,"database_sumNetLSA"
                ,"database_sumASBRLSA"
                ,"database_type7LSA"
                ,"database_type9LSA"
                ,"database_subtotal"
            ]
            ,proxy      : {
                type        : "memory"
                ,reader     : {type: "array"}
            }
        });
    }

//monitorPanel
    ,monitorPanel           : function() {
        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "ospf_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.ospf_monitor_4.doLoad
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Monitor"
                },{
                    xtype       : "cp4_btnsbar"
                    ,id         : "ospf2_mon_btnbar"
                    ,items      : [
                        {
                            xtype       : "cp4_button"
                            ,id         : "ospf2_mon_reload_btn"
                            ,text       : "Reload"
                            ,disable    : function() { }
                            ,setDisabled: function(d) {
                                var b = this;
                                if (b && b.disabled && b.enable) {
                                    b.enable();
                                }
                            }
                            ,handler    : function() {
                                CP.ospf_monitor_4.doReload();
                            }
                        }
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,hidden : true
                    ,id     : "ospf_monitor_content_set"
                    ,items  : [
                        CP.ospf_monitor_4.get_monitor_field_set()
                        ,CP.ospf_monitor_4.get_summary_set()
                        ,CP.ospf_monitor_4.get_interface_set()
                        ,CP.ospf_monitor_4.get_neighbor_set()
                        ,CP.ospf_monitor_4.get_database_set()
                        ,CP.ospf_monitor_4.get_error_set()
                        ,CP.ospf_monitor_4.get_packet_set()
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,hidden : true
                    ,id     : "ospf_monitor_disabled_set"
                    ,items  : [
                        {
                            xtype       : "cp4_label"
                            ,text       : "OSPF is not configured."
                        }
                    ]
                },{
                    xtype   : "cp4_formpanel"
                    ,hidden : true
                    ,id     : "ospf_monitor_busy_set"
                    ,items  : [
                        {
                            xtype       : "cp4_label"
                            ,text       : "The routing daemon is busy. Please try again later."
                        }
                    ]
                }
            ]
        });

        return monitorPanel;
    }

    ,doLoad                     : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.ospf_monitor_4.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in 
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.ospf_monitor_4.autoRefreshCallback(false);
    }        
    
    ,render_qtip                : function(value) {
        return CP.ar_util.rendererSpecific(value, value, "left", "black");
    }
    ,render_qtip_center         : function(value) {
        return CP.ar_util.rendererSpecific(value, value, "center", "black");
    }

    ,get_monitor_field_set      : function() {
        var main_cm = [
            {
                text            : "Information"
                ,id             : "ospf_monitor_main_grid_monitorfield"
                ,dataIndex      : "monitorfield"
                ,width          : 150
                ,menuDisabled   : true
                ,sortable       : false
                ,renderer       : CP.ospf_monitor_4.render_qtip
            }
        ];

        function main_selection_change(rec, change) {
            var field = rec.data.monitorfield.toLowerCase();
            var mon_set = Ext.getCmp("ospf_monitor_"+ field +"_set");
            if(mon_set) {
                mon_set.setVisible( (change == "show") );
            }
            //field might equal:
                //"summary"
                //"interface"
                //"neighbor"
                //"database"
                //"error"
                //"packet"
        }

        var main_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect   : true
            ,mode           : "MULTI"
            ,listeners      : {
                select      : function(RowModel, rec, index, eOpts) {
                    main_selection_change(rec, "show");
                }
                ,deselect   : function(RowModel, rec, index, eOpts) {
                    main_selection_change(rec, "hide");
                }
            }
        });



        var main_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_main_grid"
            ,width              : 150
            ,height             : CP.ospf_monitor_4.MAIN_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_main_store"
            ,columns            : main_cm
            ,selModel           : main_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
            ,listeners          : {
                afterrender : function(grid, eOpts) {
                    grid.events.beforeitemmousedown.clearListeners();
                    grid.events.beforeitemdblclick.clearListeners();
                }
            }
        };

        return {
            xtype       : "cp4_formpanel"
            ,margin     : 0
            ,padding    : 0
            ,items      : [
                main_grid
            ]
        };
    }

    ,get_summary_set    : function() {
        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_summary_set"
            ,margin     : 0
            ,padding    : 0
            ,layout     : "column"
            ,hidden     : true
            ,items      : [
                CP.ospf_monitor_4.get_summary_grid()
                ,CP.ospf_monitor_4.get_area_summary_grid()
            ]
        };
    }

    ,get_summary_grid   : function() {
        var summary_cm = [
            {
                text            : 'Description'
                ,id             : "ospf_monitor_summary_grid_summary_field"
                ,width          : 225
                ,maxWidth       : 245
                ,dataIndex      : "summary_field"
                ,menuDisabled   : true
                ,sortable       : false
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : 'Value'
                ,id             : "ospf_monitor_summary_grid_summary_value"
                ,width          : 175
                ,maxWidth       : 195
                ,dataIndex      : "summary_value"
                ,menuDisabled   : true
                ,sortable       : false
                ,renderer       : CP.ospf_monitor_4.render_qtip
            }
        ];

        var summary_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_summary_grid"
            ,width              : 400
            ,height             : CP.ospf_monitor_4.SUMMARY_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_summary_store"
            ,columns            : summary_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,margin     : "0 15 0 0"
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Summary"
                }
                ,summary_grid
            ]
        };
    }

    ,get_area_summary_grid  : function() {
        var area_summary_cm = [
            {
                text            : "Area"
                ,id             : "ospf_monitor_area_summary_grid_area_row"
                ,width          : 125
                ,maxWidth       : 140
                ,dataIndex      : "area_row"
                ,menuDisabled   : true
                ,sortable       : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.summaryarea_area;
                    var color = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.summaryarea_area == rec.data.summaryarea_area) {
                            color = "grey";
                        }
                    }
                    return '<div data-qtip="'+retValue+'" style="color:'+color+';">'+retValue+'</div>';
                }
            },{
                text            : "Description"
                ,id             : "ospf_monitor_area_summary_grid_row"
                ,width          : 200
                ,maxWidth       : 225
                ,dataIndex      : "row"
                ,groupable      : false
                ,sortable       : true
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.summaryarea_field;
                    return CP.ospf_monitor_4.render_qtip(retValue);
                }
            },{
                text            : "Value"
                ,id             : "ospf_monitor_area_summary_grid_summaryarea_value"
                ,width          : 250
                ,maxWidth       : 280
                ,dataIndex      :"summaryarea_value"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            }
        ];

        var area_summary_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_area_summary_grid"
            ,width              : 575
            ,height             : CP.ospf_monitor_4.SUMMARY_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_area_summary_store"
            ,columns            : area_summary_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,margin     : 0
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Area Summary"
                }
                ,area_summary_grid
            ]
        };
    }

    ,get_interface_set  : function() {
        var interface_cm = [
            {
                text            : "Interface Name"
                ,id             : "ospf_monitor_interface_grid_intf_name"
                ,width          : 200
                ,maxWidth       : 250
                ,dataIndex      : "intf_name"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Address"
                ,id             : "ospf_monitor_interface_grid_intf_address"
                ,width          : 200
                ,maxWidth       : 250
                ,dataIndex      : "intf_address"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Total Errors"
                ,id             : "ospf_monitor_interface_grid_intf_errors"
                ,width          : 75
                ,maxWidth       : 95
                ,dataIndex      : "intf_errors"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Auth Errors"
                ,id             : "ospf_monitor_interface_grid_intf_authentication_errors"
                ,width          : 75
                ,maxWidth       : 95
                ,dataIndex      : "intf_authentication_errors"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Hello Interval Mismatch"
                ,id             : "ospf_monitor_interface_grid_intf_hello_interval_mismatch"
                ,width          : 135
                ,maxWidth       : 165
                ,dataIndex      : "intf_hello_interval_mismatch"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Dead Interval Mismatch"
                ,id             : "ospf_monitor_interface_grid_intf_dead_interval_mismatch"
                ,width          : 135
                ,maxWidth       : 165
                ,dataIndex      : "intf_dead_interval_mismatch"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Duplicate Router ID"
                ,id             : "ospf_monitor_interface_grid_intf_duplicate_router_id"
                ,width          : 120
                ,maxWidth       : 150
                ,dataIndex      : "intf_duplicate_router_id"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "External Option Error"
                ,id             : "ospf_monitor_interface_grid_intf_external_option_error"
                ,width          : 130
                ,maxWidth       : 160
                ,dataIndex      : "intf_external_option_error"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Neighbor Errors"
                ,id             : "ospf_monitor_interface_grid_intf_neighbor_errors"
                ,width          : 100
                ,maxWidth       : 125
                ,dataIndex      : "intf_neighbor_errors"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Delayed Ack Count"
                ,id             : "ospf_monitor_interface_grid_intf_delayed_ack_count"
                ,width          : 115
                ,maxWidth       : 140
                ,dataIndex      : "intf_delayed_ack_count"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Newer Self LSA Count"
                ,id             : "ospf_monitor_interface_grid_intf_newer_self_lsa_count"
                ,width          : 130
                ,maxWidth       : 160
                ,dataIndex      : "intf_newer_self_lsa_count"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Neighbor Count"
                ,id             : "ospf_monitor_interface_grid_intf_neighbor_count"
                ,width          : 100
                ,maxWidth       : 125
                ,dataIndex      : "intf_neighbor_count"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Lost Neighbor Count"
                ,id             : "ospf_monitor_interface_grid_intf_lost_neighbor_count"
                ,width          : 125
                ,maxWidth       : 155
                ,dataIndex      : "intf_lost_neighbor_count"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            }
        ];

        var interface_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_interface_grid"
            ,width              : 1655
            ,height             : CP.ospf_monitor_4.INTERFACE_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_interface_store"
            ,columns            : interface_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_interface_set"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Interfaces"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : "0 15 0 0"
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ interface_grid ]
                }
            ]
        };
    }

    ,get_neighbor_set   : function() {
        var neighbor_cm = [
            {
                text            : "Neighbor ID"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_id"
                ,width          : 100
                ,maxWidth       : 120
                ,dataIndex      : "neighbor_id"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Priority"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_priority"
                ,width          : 65
                ,maxWidth       : 80
                ,dataIndex      : "neighbor_priority"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "State"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_state"
                ,width          : 80
                ,maxWidth       : 95
                ,dataIndex      : "neighbor_state"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Dead"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_dead"
                ,width          : 65
                ,maxWidth       : 80
                ,dataIndex      : "neighbor_dead"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Address"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_address"
                ,width          : 100
                ,maxWidth       : 120
                ,dataIndex      : "neighbor_address"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Interface"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_interface"
                ,width          : 105
                ,maxWidth       : 125
                ,dataIndex      : "neighbor_interface"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Errors"
                ,id             : "ospf_monitor_neighbor_grid_neighbor_errors"
                ,width          : 65
                ,maxWidth       : 80
                ,dataIndex      : "neighbor_errors"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            }
        ];

        var neighbor_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_neighbor_grid"
            ,width              : 600
            ,height             : CP.ospf_monitor_4.NEIGHBOR_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_neighbor_store"
            ,columns            : neighbor_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_neighbor_set"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Neighbors"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : "0 15 0 0"
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ neighbor_grid ]
                }
            ]
        };
    }

    ,get_database_set   : function() {
        var database_cm = [
            {
                text            : "Area ID"
                ,id             : "ospf_monitor_database_grid_database_areaid"
                ,dataIndex      : "database_areaid"
                ,width          : 100
                ,maxWidth       : 125
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Router"
                ,id             : "ospf_monitor_database_grid_database_rtrlsa"
                ,dataIndex      : "database_rtrlsa"
                ,width          : 80
                ,maxWidth       : 100
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Network"
                ,id             : "ospf_monitor_database_grid_database_netlsa"
                ,dataIndex      : "database_netlsa"
                ,width          : 90
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Sum-Net"
                ,id             : "ospf_monitor_database_grid_database_sumNetLSA"
                ,dataIndex      : "database_sumNetLSA"
                ,width          : 90
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Sum-ASBR"
                ,id             : "ospf_monitor_database_grid_database_sumASBRLSA"
                ,dataIndex      : "database_sumASBRLSA"
                ,width          : 90
                ,maxWidth       : 110
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Type-7 External"
                ,id             : "ospf_monitor_database_grid_database_type7LSA"
                ,width          : 100
                ,maxWidth       : 125
                ,dataIndex      : "database_type7LSA"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Opaque Link Local"
                ,id             : "ospf_monitor_database_grid_database_type9LSA"
                ,width          : 120
                ,maxWidth       : 150
                ,dataIndex      : "database_type9LSA"
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            },{
                text            : "Sub Total"
                ,id             : "ospf_monitor_database_grid_database_subtotal"
                ,dataIndex      : "database_subtotal"
                ,width          : 80
                ,maxWidth       : 100
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip_center
            }
        ];

        var database_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_database_grid"
            ,width              : 775
            ,height             : CP.ospf_monitor_4.DATABASE_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_database_store"
            ,columns            : database_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_database_set"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Database"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : "0 15 0 0"
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ database_grid ]
                }
            ]
        };
    }

    ,get_error_set      : function() {
        var error_cm = [
            {
                text            : 'Description'
                ,id             : "ospf_monitor_error_grid_error_field"
                ,width          : 170
                ,maxWidth       : 220
                ,dataIndex      : "error_field"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : 'Value'
                ,id             : "ospf_monitor_error_grid_error_value"
                ,width          : 60
                ,maxWidth       : 80
                ,dataIndex      : "error_value"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            }
        ];

        var error_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_error_grid"
            ,width              : 300
            ,height             : CP.ospf_monitor_4.ERROR_HEIGHT
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_error_store"
            ,columns            : error_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
            ,features           : [
                Ext.create("Ext.grid.feature.Grouping", {
                    groupHeaderTpl  : "Group: {name}"
                })
            ]
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_error_set"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Errors"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : "0 15 0 0"
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ error_grid ]
                }
            ]
        };
    }

    ,get_packet_set     : function() {
        var packet_cm = [
            {
                text            : "Description"
                ,flex           : 10
                ,dataIndex      : "cnt"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec) {
                    var retValue = rec.data["label"];
                    return CP.ospf_monitor_4.render_qtip(retValue);
                }
            },{
                text            : "Receive"
                ,flex           : 4
                ,dataIndex      : "rx"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Transmit"
                ,flex           : 4
                ,dataIndex      : "tx"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            },{
                text            : "Total"
                ,flex           : 4
                ,dataIndex      : "total"
                ,groupable      : false
                ,sortable       : false
                ,menuDisabled   : true
                ,renderer       : CP.ospf_monitor_4.render_qtip
            }
        ];

        var packet_grid = {
            xtype               : "cp4_grid"
            ,id                 : "ospf_monitor_packet_grid"
            ,width              : 500
            ,height             : 130
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "ospf_monitor_packet_store"
            ,columns            : packet_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : CP.ospf_monitor_4.enableColumnResize
        };

        return {
            xtype       : "cp4_formpanel"
            ,id         : "ospf_monitor_packet_set"
            ,margin     : 0
            ,padding    : 0
            ,hidden     : true
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "OSPF Packets"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : "0 15 0 0"
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ packet_grid ]
                }
            ]
        };
    }
}

