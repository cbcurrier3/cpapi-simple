CP.dhcp6relay_mon = {
    init            : function() {
        CP.dhcp6relay_mon.defineStores();
        var dhcp6relay_monitorPanel = CP.dhcp6relay_mon.monitorPanel();
        var obj = {
            panel   : dhcp6relay_monitorPanel
            ,params : {}
        };
        CP.UI.updateDataPanel(obj, CP.global.monitor, true);
    }

    // Called by an interval timer to periodically refresh this screen
    ,autoRefreshCallback : function(sentAutomatically) {
        var store = Ext.getStore("dhcp6relay_monitor_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }

        var store = Ext.getStore("dhcp6relay_monitor_stats_store");
        if(store) {
            store.doAutoRefresh(store, sentAutomatically);
        }
    }

    ,defineStores   : function() {
        Ext.create("CP.WebUI4.Store", {
            storeId     : "dhcp6relay_monitor_store"
            ,autoLoad   : false
            ,fields     : [
                "intf"
                ,"config_applied"
                ,"state"
                ,"iclid_state"
                ,"status"
                ,"status_text"
                ,"waittime"
                ,"iclid_waittime"
                ,"ifid_flag"
                ,"iclid_ifid_flag"
                ,"ifid_hash"
                ,"linkaddr"
                ,"relayto_applied"
                ,"conf_relayto_list"
                ,"relayto_list"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/dhcp6relay_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "interfaces"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,stateParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.dhcp6relay_mon"
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
                var store = Ext.getStore("dhcp6relay_monitor_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.dhcp6relay_mon) {
                        store.loadData(jsonData.data.dhcp6relay_mon);
                    }
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "dhcp6relay_monitor_stats_store"
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
                ,url            : "/cgi-bin/dhcp6relay_monitor.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "stats"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,stateParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.dhcp6relay_stats"
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
                var store = Ext.getStore("dhcp6relay_monitor_stats_store");
                if (store) {
                    var jsonData = Ext.decode(jsonResult.responseText);
                    if (jsonData && jsonData.data && jsonData.data.dhcp6relay_stats) {
                        store.loadData(jsonData.data.dhcp6relay_stats);
                    }
                }
            }

            ,groupField : "summaryGroup"
        });
    }

    ,waitTimeRenderer : function (value, meta, rec, row, col, st, view) {
        var def_waittime = rec.data.default_waittime;
        var conf_waittime = String(value);
        var waittime_txt;
        var using_default = false;
        var color;
        var hlpValue;

        if (conf_waittime === "default") {
            using_default = true;
            waittime_txt = "default (" + def_waittime + ")";
            hlpValue = waittime_txt;
        } else {
            waittime_txt = conf_waittime + " cs";
            hlpValue = waittime_txt + " (1/100s of a second)"
        }

        /*
         * Indicate to the user if the configured value is different
         * from the currently active value.
         */
        var iclid_waittime = String(rec.data.iclid_waittime);
        if (iclid_waittime != conf_waittime) {
            using_default = false;
            if (iclid_waittime === "default") {
                iclid_waittime = "default (0)";
            } else {
                iclid_waittime = iclid_waittime + " cs";
            }

            waittime_txt = "Configured:<br>&nbsp;&nbsp;" + waittime_txt +
                    "<br>Active:<br>&nbsp;&nbsp;" + iclid_waittime;
            hlpValue = waittime_txt;
        }

        if (using_default) {
            color = "gray";
        } else {
            color = "black";
        }

        return CP.ar_util.rendererSpecific(waittime_txt, hlpValue, "left", color);
    }

    ,intfIDOptionRenderer : function (value, meta, rec, row, col, st, view) {
        var conf_ifid_flag = String(value);
        var option_txt;
        var using_default = false;
        var color;

        if (conf_ifid_flag === "0") {
            option_txt = "Off";
        } else {
            option_txt = "On";
        }

        /*
         * Indicate to the user if the configured value is different
         * from the currently active value.
         */
        var iclid_ifid_flag = String(rec.data.iclid_ifid_flag);
        if (iclid_ifid_flag !== conf_ifid_flag) {
            using_default = false;
            if (iclid_ifid_flag === "0") {
                iclid_ifid_flag = "Off";
            } else {
                iclid_ifid_flag = "On";
            }

            option_txt = "Configured:<br>&nbsp;&nbsp;" + option_txt +
                    "<br>Active:<br>&nbsp;&nbsp;" + iclid_ifid_flag;
        }

        if (using_default) {
            color = "gray";
        } else {
            color = "black";
        }

        return CP.ar_util.rendererSpecific(option_txt, option_txt, "left", color);
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
             * Relay is initializing. Yellow would be a good color
             * here, but it doesn't work on the white background
             */
            color = "orange";
        } else {
            color = status_code < 0 ? "red" : "green";
        }

        return CP.ar_util.rendererSpecific(status_text, status_text, "left", color);
    }

    ,monitorPanel   : function() {
        var dhcp6relay_mon_btnsbar = {
            xtype   : "cp4_btnsbar"
            ,items  : [
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
                    ,handler        : CP.dhcp6relay_mon.doReload
                }
            ]
        };

        var dhcp6relay_mon_cm = [
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
                ,width          : 200
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.dhcp6relay_mon.statusRenderer
            },
            {
                header          : "Wait Time"
                ,dataIndex      : "waittime"
                ,width          : 80
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.dhcp6relay_mon.waitTimeRenderer
            },
            {
                header          : "Link Address"
                ,dataIndex      : "linkaddr"
                ,width          : 275
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            },
            {
                header          : "Relay To"
                ,dataIndex      : "relayto_list"
                ,width          : 275
                ,align          : ""
                ,menuDisabled   : true
                ,renderer       : CP.dhcp6relay_mon.relayToRenderer
            },
            {
                header          : "Interface ID"
                ,dataIndex      : "ifid_flag"
                ,width          : 75
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.dhcp6relay_mon.intfIDOptionRenderer
            },
            {
                header          : "Interface ID Hash"
                ,dataIndex      : "ifid_hash"
                ,width          : 250
                ,align          : "left"
                ,menuDisabled   : true
                ,renderer       : CP.ar_util.rendererGeneric
            }
        ];

        var dhcp6relay_mon_grid = {
            xtype               : "cp4_grid"
            ,id                 : "dhcp6relay_mon_grid"
            ,width              : 800
            ,height             : 181
            ,margin             : 0
            ,store              : Ext.getStore("dhcp6relay_monitor_store")
            ,columns            : dhcp6relay_mon_cm
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
        };

        var monitorPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "dhcp6relay_monitorPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.dhcp6relay_mon.doLoad
            }
            ,items      : [
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "IPv6 DHCP Relay Monitor"
                },
                dhcp6relay_mon_btnsbar,
                {
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "Interfaces"
                },
                {
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,items      : [ dhcp6relay_mon_grid ]
                },
                CP.dhcp6relay_mon.get_stats_set()
            ]
        });
        return monitorPanel;
    }

    ,doLoad         : function() {
        // Start (or restart) the auto-refresh countdown timer.  This will
        // immediately load data for this page and then refresh it every 15
        // seconds or so (the interval is user-configurable).
        CP.UI.startAutoRefresh(CP.dhcp6relay_mon.autoRefreshCallback);
    }

    ,doReload                 : function() {
        // Manually refresh the page. Unlike the auto-refresh logic in
        // doLoad(), this function resets the countdown timer for the
        // session timeout. This prevents the user from automatically being
        // logged out due to inactivity as long as they periodically press
        // the "refresh" button.
        CP.dhcp6relay_mon.autoRefreshCallback(false);
    }

    ,get_stats_set  : function() {
        function generate_tip(rec) {
            if (!rec) {
                return "";
            }
            var tip = rec.data.summaryGroup + "<br>";
            if (rec.data.middleGroup && rec.data.middleGroup.length > 0) {
                tip += "-- " + rec.data.middleGroup + "<br>";
            }
            tip += "---- " + rec.data.fieldname + ": " + rec.data.fieldvalue;
            return tip;
        }

        var grid_cm = [
            {
                text            : "Group"
                ,dataIndex      : "row"
                ,width          : 125
                ,menuDisabled   : true
                ,renderer       : function(value, meta, rec, row, col, st, view) {
                    var retValue = rec.data.middleGroup;
                    if (retValue == "") {
                        retValue = "Overall";
                    }
                    var tip = generate_tip(rec);
                    var color = "black";
                    if (row > 0) {
                        var p_rec = st.getAt(row - 1);
                        if (p_rec.data.summaryGroup == rec.data.summaryGroup &&
                            p_rec.data.middleGroup == rec.data.middleGroup) {
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

        var grid_grp = Ext.create("Ext.grid.feature.Grouping", {
            groupHeaderTpl  : "{name}"
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "dhcp6relay_monitor_stats_grid"
            ,width              : 430
            ,height             : 490
            ,forceFit           : true
            ,autoScroll         : true
            ,margin             : 0
            ,store              : "dhcp6relay_monitor_stats_store"
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
