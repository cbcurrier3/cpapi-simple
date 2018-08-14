CP.addr_list = {
    currExcludeList : ""

    ,setCurrExclude : function(excludeProtocols) {
        if (Ext.typeOf(excludeProtocols) == "string") {
            if (excludeProtocols != "") {
                CP.addr_list.currExcludeList =
                    String(excludeProtocols).toLowerCase();
            }
        } else {
            CP.addr_list.currExcludeList = "";
        }
    }

    ,initStore      : function(excludeProtocols, load) {
        CP.addr_list.setCurrExclude(excludeProtocols);

        var st = CP.addr_list.getStore();
        if (!st) {
            st = Ext.create("CP.WebUI4.Store", {
                storeId     : "addr_list_store"
                ,autoLoad   : false
                ,fields     : ["PROTOCOL", "ADDRESS", "OTHER"]
                ,proxy      : {
                    type        : "ajax"
                    ,url        : "/cgi-bin/address_list.tcl"
                    ,extraParams: {
                        instance    : ""
                        ,protocol   : ""
                    }
                    ,limitParam : null
                    ,pageParam  : null
                    ,startParam : null
                    ,reader     : {type: "json", root: "data.addrList"}
                }
                ,listeners  : {
                    beforeLoad  : function(st, op, eOpts) {
                        CP.ar_util.loadListPush( st.storeId );
                    }
                    ,load       : function(st, recs, success, op, eOpts) {
                        if (CP.intf_state
                            && CP.intf_state.grids_to_refresh
                            && CP.intf_state.grids_to_refresh.length > 0) {

                            var gtr = CP.intf_state.grids_to_refresh;
                            var g, i;
                            for (i = 0; i < gtr.length; i++) {
                                g = Ext.getCmp( gtr[i] );
                                if (g) {
                                    g.getView().refresh();
                                }
                            }
                        }
                        CP.ar_util.loadListPop( st.storeId );
                    }
                }
            });
        }

        if (load) {
            CP.addr_list.loadStore("");
        }
    }

    ,loadStore      : function(excludeProtocols) {
        CP.addr_list.setCurrExclude(excludeProtocols);
        var st = CP.addr_list.getStore();
        if (st) {
            st.load({
                params: {
                    "instance"  : CP.ar_util.INSTANCE()
                    ,"protocol" : CP.addr_list.currExcludeList
                }
            });
        }
    }

    ,getStore       : function() {
        var st = Ext.getStore("addr_list_store");
        if (st) {
            return st;
        }
        return null;
    }

    ,findMatchIndex : function(testAddress) {
        var st = CP.addr_list.getStore();
        var i = -1;
        if (st) {
            i = st.findExact("ADDRESS", String(testAddress).toLowerCase(), 0);
        }
        return i;
    }

    ,findMatch      : function(testAddress) {
        return (CP.addr_list.findMatchIndex(testAddress) > -1);
    }

    ,getMatchMessage: function(testAddress) {
        var i = CP.addr_list.findMatchIndex(testAddress);
        if (i == -1) {
            return "";
        }
        var st = CP.addr_list.getStore();
        var r = st.getAt(i);
        if (!r) {
            return "";
        }
        return ("Address "+ String(r.data.ADDRESS).toUpperCase() +" is in use by "+ String(r.data.OTHER));
    }
}

