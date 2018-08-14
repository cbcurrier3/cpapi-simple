CP.bootp_mon_4 = {
    init                    : function() {
        CP.bootp_mon_4.defineStores();
        var bootp_monitorPanel = CP.bootp_mon_4.monitorPanel();
        var obj = {
            panel   : bootp_monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("bootp_monitor_store");
        if (store) {
            store.doAutoRefresh(store, sentAutomatically);
        }

        var store = Ext.getStore("bootp_monitor_stats_store");
        if (store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores           : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "bootp_monitor_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"config_applied"
                ,"state"
                ,"iclid_state"
                ,"status"
                ,"status_text"
                ,"default_maxhop"
                ,"maxhop"
                ,"iclid_maxhop"
                ,"default_waittime"
                ,"waittime"
                ,"iclid_waittime"
                ,"p_addr"
                ,"iclid_p_addr"
                ,"g_addr"
                ,"relayto_applied"
                ,"conf_relayto_list"
                ,"relayto_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bootpmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "interfaces"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,stateParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.bootp_mon"
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
                var store = Ext.getStore("bootp_monitor_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.bootp_mon) {
                        store.loadData(jsonData.data.bootp_mon);
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "bootp_monitor_stats_store"
            ,autoLoad   : false
            ,fields     : [
                "row"
                ,"summaryGroup"
                ,"middleGroup"
                ,"fieldname"
                ,"fieldvalue"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/bootpmonitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "stats"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,stateParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.bootp_stats"
                }
            }
            ,groupField : "summaryGroup"
            ,doAutoRefresh : function(store, sentAutomatically) {
                var url = Ext.urlAppend(store.proxy.url, Ext.Object.toQueryString(store.proxy.extraParams));
                CP.util.doAutoRequestRunnable(
                    url,
                    'GET',
                    store.autoRefreshSuccess,
                    sentAutomatically);
           }
            ,autoRefreshSuccess : function (jsonResult) {
                var store = Ext.getStore("bootp_monitor_stats_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.bootp_stats) {
                        store.loadData(jsonData.data.bootp_stats);
                    }
                }
            }
        });
    }

    ,maxHopCountRenderer : function (value, meta, rec, row, col, st, view) {
        var maxhop_txt;
        var conf_maxhop = String(value);
        var using_default = false;
        var color;

        if (conf_maxhop === "default") {
            using_default = true;
            maxhop_txt = "default (" + rec.data.default_maxhop + " hops)";
        } else {
            maxhop_txt = conf_maxhop + " hops";
        }

        /*
         * Indicate to the user if the configured value is different
         * from the currently active value.
         */
        var iclid_maxhop = String(rec.data.iclid_maxhop);
        if (iclid_maxhop !== conf_maxhop) {
            using_default = false;
            if (iclid_maxhop === "default") {
                iclid_maxhop
                    = "default ("+ rec.data.default_maxhop +" hops)";
            } else {
                iclid_maxhop = iclid_maxhop + " hops";
            }

            maxhop_txt = "Configured:<br>&nbsp;&nbsp;" + maxhop_txt +
                    "<br>Active:<br>&nbsp;&nbsp;" + iclid_maxhop;
        }

        if (using_default) {
            color = "gray";
        } else {
            color = "black";
        }

        return CP.ar_util.rendererSpecific(maxhop_txt, maxhop_txt, "left", color);
    }

    ,waitTimeRenderer : function (value, meta, rec, row, col, st, view) {
        var def_waittime = rec.data.default_waittime;
        var conf_waittime = String(value);
        var waittime_txt;
        var using_default = false;
        var color;

        if (conf_waittime === "default") {
            using_default = true;
            waittime_txt = "default (" + def_waittime + ")";
        } else {
            waittime_txt = conf_waittime + " seconds";
        }

        /*
         * Indicate to the user if the configured value is different
         * from the currently active value.
         */
        var iclid_waittime = String(rec.data.iclid_waittime);
        if (iclid_waittime !== conf_waittime) {
            using_default = false;
            if (iclid_waittime === "default") {
                iclid_waittime = "default (0)";
            } else {
                iclid_waittime = iclid_waittime + " seconds";
            }

            waittime_txt = "Configured:<br>&nbsp;&nbsp;" + waittime_txt +
                    "<br>Active:<br>&nbsp;&nbsp;" + iclid_waittime;
        }

        if (using_default) {
            color = "gray";
        } else {
            color = "black";
        }

        return CP.ar_util.rendererSpecific(waittime_txt, waittime_txt, "left", color);
    }

    ,primaryAddressRenderer : function (value, meta, rec, row, col, st, view) {
        var addr_txt;
        var conf_addr = String(value);
        var using_default = false;
        var color;

        if (conf_addr === "default") {
            using_default = true;
            addr_txt = "(automatic)";
        } else {
            addr_txt = conf_addr;
        }

        /*
         * Indicate to the user if the configured value is different
         * from the currently active value.
         */
        var iclid_addr = String(rec.data.iclid_p_addr);
        if (iclid_addr !== conf_addr) {
            using_default = false;

            if (iclid_addr == "default") {
                iclid_addr = "(automatic)";
            }

            addr_txt = "Configured:<br>&nbsp;&nbsp;" + addr_txt +
                    "<br>Active:<br>&nbsp;&nbsp;" + iclid_addr;
        }

        if (using_default) {
            color = "gray";
        } else {
            color = "black";
        }

        return CP.ar_util.rendererSpecific(addr_txt, addr_txt, "left", color);
    }

    ,relayToRenderer : function (value, meta, rec, row, col, st, view) {
        var conf_relayto = String(rec.data.conf_relayto_list);
        var iclid_relayto = String(value);
        var applied = rec.data.relayto_applied;
        var relay_text;

        if (conf_relayto.length == 0) {
            conf_relayto = "(None)";
        }

        if (iclid_relayto.length == 0) {
            iclid_relayto = "(None)";
        }

        var re = new RegExp(',', 'g');
        if (applied) {
            relay_text = String(conf_relayto);
            relay_text = String(relay_text).replace(re, '<br>');
        } else {
            relay_text = "Configured:<br>&nbsp;&nbsp;" + String(conf_relayto) +
                    "<br><br>Active:<br>&nbsp;&nbsp;" + String(iclid_relayto);
            relay_text = String(relay_text).replace(re, '<br>&nbsp;&nbsp;');
        }

        return CP.ar_util.rendererGeneric(relay_text);
    }

    ,statusRenderer : function (value, meta, rec, row, col, st, view) {
        var error;
        var color;
        var status_code = rec.data.status;
        var status_text;
        var bad_state = false;

        var conf_state = rec.data.state;
        var iclid_state = rec.data.iclid_state;

        if (rec.data.config_applied === 0) {
            bad_state = true;
            status_text = "The updated configuration has not" +
                    " yet taken effect.<br><br>";
        } else {
            status_text = "";
        }

        if (conf_state !== iclid_state) {
            bad_state = true;
            status_text = status_text +
                    "Configured: " + conf_state +
                    "<br>Active: " + iclid_state +
                    "<br><br>";
        }

        status_text += value;

        if (bad_state === true) {
            color = "red";
        } else if (status_code === -8) {
            /*
             * Bootp is initializing. Yellow would be a good color
             * here, but it doesn't work on the white background
             */
            color = "orange";
        } else {
            color = status_code < 0 ? "red" : "green";
        }

        return CP.ar_util.rendererSpecific(status_text, status_text, "left", color);
    }

    ,monitorPanel           : function() {
        var bootp_mon_btnsbar = {
            xtype               : "cp4_btnsbar"
            ,items              : [
                {
                    xtype           : "cp4_button"
                    ,text           : "Reload"
                    ,disable        : function() { }
                    ,setDisabled    : function(d) {
                        var b = this;
                        if (b && b.disabled && b.enable) {
                            b.enable();
                        }
                    }
                    ,handler        : CP.bootp_mon_4.doReload
                }
            ]
        };

        var bootp_mon_cm = [
            {
                header          : "Interface"
                ,dataIndex      : "intf"
                ,width          : 100
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },
            {
                header          : "Status"
                ,dataIndex      : "status_text"
                ,width          : 175
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bootp_mon_4.statusRenderer
            },
            {
                header          : "Wait Time"
                ,dataIndex      : "waittime"
                ,width          : 125
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bootp_mon_4.waitTimeRenderer
            },
            {
                header          : "Max Hop Count"
                ,dataIndex      : "maxhop"
                ,width          : 115
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bootp_mon_4.maxHopCountRenderer
            },
            {
                header          : "Primary Address"
                ,dataIndex      : "p_addr"
                ,width          : 120
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bootp_mon_4.primaryAddressRenderer
            },
            {
                header          : "Gateway Address"
                ,dataIndex      : "g_addr"
                ,width          : 120
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },
            {
                header          : "Relay To"
                ,dataIndex      : "relayto_list"
                ,width          : 120
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.bootp_mon_4.relayToRenderer
            }
        ];

        var bootp_mon_grid = {
            xtype               : "cp4_grid"
            ,id                 : "bootp_mon_grid"
            ,width              : 775
            ,height             : 181
            ,margin             : 0
            ,forceFit           : true
            ,store              : Ext.getStore("bootp_monitor_store")
            ,columns            : bootp_mon_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "bootp_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.bootp_mon_4.doLoad
            }
            ,items      : [
                {
                    xtype               : "cp4_sectiontitle"
                    ,titleText          : "BOOTP/DHCP Relay Monitor"
                }
                ,bootp_mon_btnsbar
                ,{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                },{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,autoScroll : true
                    ,items      : [ bootp_mon_grid ]
                }
                ,CP.bootp_mon_4.get_stats_set()
            ]
        });
        return monitorPanel;
    }
    ,doLoad                 : function() {
        // Start (or restart) the auto-refresh countdown timer
        // This will immediately load data for bootp_monitor_store and
        // bootp_monitor_stats_store and then refresh them every 15
        // seconds or so (the interval is user-configurable)
        CP.UI.startAutoRefresh(CP.bootp_mon_4.autoRefreshCallback);
    }
    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.bootp_mon_4.autoRefreshCallback(false);
    }
    ,get_stats_set          : function() {
        function generate_tip(rec) {
            if(!rec) {
                return "";
            }
            var tip = rec.data.summaryGroup +"<br>";
            if(rec.data.middleGroup && rec.data.middleGroup.length > 0) {
                tip += "-- "+ rec.data.middleGroup +"<br>";
            }
            tip += "---- "+ rec.data.fieldname +": "+ rec.data.fieldvalue;
            return tip;
        }

        var grid_cm = [
            {
                text            : "Group"
                ,dataIndex      : "row"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue    = rec.data.middleGroup;
                    if(retValue == "") {
                        retValue = "Overall";
                    }
                    var tip         = generate_tip(rec);
                    var color       = "black";
                    if(row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if(p_rec.data.summaryGroup == rec.data.summaryGroup
                            && p_rec.data.middleGroup == rec.data.middleGroup) {
                                color = "white";
                        }
                    }
                    return CP.ar_util.rendererSpecific(retValue, tip, "left", color);
                }
            },{
                text            : "Description"
                ,dataIndex      : "fieldname"
                ,width          : 200
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = generate_tip(rec);
                    return CP.ar_util.rendererSpecific(value, tip, "left", "black");
                }
            },{
                text            : "Value"
                ,dataIndex      : "fieldvalue"
                ,width          : 100
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var tip = generate_tip(rec);
                    return CP.ar_util.rendererSpecific(value, tip, "left", "black");
                }
            }
        ];

        var grid_grp = Ext.create("Ext.grid.feature.Grouping", {groupHeaderTpl: "{name}"});

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "bootp_monitor_stats_grid"
            ,width              : 430
            ,height             : 490
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "bootp_monitor_stats_store"
            ,columns            : grid_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,features           : [ grid_grp ]
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Statistics"
            },{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }
}

