CP.vrrp_vmac_list = {
    initStore       : function(autoload) {
        if (!autoload) {
            autoload = false;
        }
        var st = CP.vrrp_vmac_list.getStore();
        if (st) {
            return;
        }

        Ext.create('CP.WebUI4.Store', {
            storeId     : 'vrrp_vmac_store'
            ,autoLoad   : autoload
            ,fields     : ["intf", "vrid", "vmac", "vmac_uc", "disp"]
            ,sorters    :   [{property: "vmac", direction: "ASC"}
                            ,{property: "intf", direction: "ASC"}
                            ,{property: "vrid", direction: "ASC"}]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/vrrp_vmac_list.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.vrrp_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop( st.storeId );
                }
            }
        });
    }
    ,getStore       : function() {
        var st = Ext.getStore('vrrp_vmac_store');
        if (st) {
            return st;
        }
        return null;
    }
    ,loadStore      : function() {
        var st = CP.vrrp_vmac_list.getStore();
        if (st) {
            st.load({params: {"instance": CP.ar_util.INSTANCE()}});
        }
    }
}
