/*  A javascript to keep a central store and helper functions
*
*       CP.intf_state.renderer_output(value, tip, align, color, rawvalue, family, INSTANCE);
*           -- more specific renderer, allows a user to more strongly control the renderer
*
*       CP.intf_state.renderer_generic(value, meta, rec, row, col, st, view, align, color, family, INSTANCE);
*           -- generic grid renderer
*
*       CP.intf_state.format_substr(value, rawvalue, family, INSTANCE);
*           -- checks rawvalue, doesn't do tips, doesn't do color
*
*       CP.intf_state.load(instance);
*           -- Will load the store (creating if necessary)
*
*       CP.intf_state.getStore(instance);
*           -- Will return the store (creating if necessary)
*
*       CP.intf_state.defineStore(instance, grids_to_refresh);
*           -- Will define it (actually it just passes the call onto getStore(...))
*           -- Also sets the list of grids to refresh after a load
**/
CP.intf_state = {
//internal helper functions (although I guess they can be used externally
    get_state_value     : function(rawvalue, family, INSTANCE) {
        //returns "up", "down", or "missing"
        var up_value        = "up";
        var down_value      = "down";
        var missing_value   = "missing";
        var conn_value      = "connecting";

        var if_s_st = CP.intf_state.getStore(INSTANCE, true);
        if(!if_s_st) {
            return up_value;    //basically do no changes
        }
        var familyMask = CP.intf_state.format_familyMask(family);

        var r = if_s_st.findRecord("interface", rawvalue, 0, false, true, true);
        if(r) {
            var STATE = parseInt(r.data.state, 10);
            if(isNaN(STATE)) { return down_value; }
            if(STATE & familyMask) {
                return up_value;
            } else if(STATE & (4 * familyMask)) {
                return conn_value;
            }
            return down_value;
        }
        return missing_value;
    }
    ,format_familyMask  : function(fam) {
        //return a bit mask to & against the state

        function IE_indexOf_fix( family_list, fam2 ) {
            for(var i = 0; i < family_list.length; i++) {
                if(family_list[i] === fam2) {
                    return i;
                }
            }
            return -1;
        }

        //very important to alternate ordering
        //put in duplicates of a column's value if necessary to maintain the pattern
        var numTypes = 2;
                            //ipv4 col (1)  //ipv6 col (2)
        var family_list =   ["0x01"         ,"0x02"
                            ,"ipv4"         ,"ipv6"
                            ,"ip"           ,"ip6"
                            ,"ip4"          ,"ip6"
                            ,"inet"         ,"inet6"
                            ,"inet4"        ,"inet6"
                            ,"4"            ,"6"];
        if(!fam) {
            return 1; //ipv4's bitmask
        } else {
            var fam2 = String(fam).toLowerCase();
            var idx = -1;
            var indexOfErr;
            try {
                //IE8 doesn't always support [list].indexOf( ... );
                idx = family_list.indexOf( fam2 );
            } catch(indexOfErr) {
                idx = IE_indexOf_fix( family_list, fam2 );
            }
            if( idx == -1 ) {
                return 1; //0x01
            } else {
                return (idx % numTypes) + 1; //(0|1) + 1, so 0x01 or 0x02
            }
        }
        return 1;
    }
    ,get_string_value   : function(state, valueIn) {
        //return an adjusted value string based on state
        var up_suffix       = "";
        var down_suffix     = " (Down)";
        var missing_suffix  = " (Missing)";
        var conn_suffix     = " (Connecting)";

        switch( String(state).toLowerCase() ) {
            case "down":        return valueIn + down_suffix;       break;
            case "missing":     return valueIn + missing_suffix;    break;
            case "up":          return valueIn + up_suffix;         break;
            case "connecting":  return valueIn + conn_suffix;       break;
            default:
        }
        return valueIn;
    }
    ,get_string_color   : function(state) {
        //return the color string for a state
        var up_color        = "black";
        var down_color      = "red";
        var missing_color   = "blue";
        var conn_color      = "gray";

        switch( String(state).toLowerCase() ) {
            case "down":        return down_color;      break;
            case "missing":     return missing_color;   break;
            //case "connecting":  return conn_color;      break;
            default:            return up_color;
        }
        return "black";
    }

//full renderers with tip, color, and alignment
    ,renderer_output    : function(value, tip, align, color, rawvalue, family, INSTANCE) {
        //tip: recommend empty string ("")
        //rawvalue: logical interface name, empty string ("") will skip the special formatting
        var retValue = value;

        if(rawvalue != "" && !rawvalue) { rawvalue = retValue; }
        if(!align) {    align   = "left"; }
        if(!color) {    color   = "black"; }
        if(rawvalue != "") {
            var state   = CP.intf_state.get_state_value(rawvalue, family, INSTANCE);
            retValue    = CP.intf_state.get_string_value(state, retValue);
            if(color == "black") {
                color   = CP.intf_state.get_string_color(state);
            }
        }
        if(!(tip) || tip == "") { tip     = retValue; }
        return CP.ar_util.rendererSpecific(retValue, tip, align, color);
    }
    ,renderer_generic   : function(value, meta, rec, row, col, st, view, align, color, family, INSTANCE) {
        var RAWVALUE    = String(value);
        var VALUE       = String(value);
        //var TIP         = String(value);
        return CP.intf_state.renderer_output(VALUE, "", align, color, RAWVALUE, family, INSTANCE);
    }

//simplier formatting functions, more useful for lists
    ,format_both        : function(value, rawvalue, family, INSTANCE) {
        //color and string, no mouse over tip or alignment
        var state   = CP.intf_state.get_state_value(rawvalue, family, INSTANCE);
        var str     = CP.intf_state.get_string_value(state, value);
        var color   = CP.intf_state.get_string_color(state);
        return '<div style="text-align:left;color='+ color +';" >'+ str +'</div>';
    }
    ,format_substr      : function(value, rawvalue, family, INSTANCE) {
        var state   = CP.intf_state.get_state_value(rawvalue, family, INSTANCE);
        var str     = CP.intf_state.get_string_value(state, value);
        return str;
    }
    ,format_color       : function(value, rawvalue, family, INSTANCE) {
        var state   = CP.intf_state.get_state_value(rawvalue, family, INSTANCE);
        var color   = CP.intf_state.get_string_color(state);
        return color;
    }

//store control functions
    ,load               : function(INSTANCE) {
        if(!INSTANCE) { INSTANCE = "default"; }
        var if_s_st = CP.intf_state.getStore(INSTANCE, false);
        if(if_s_st) {
            CP.ar_util.loadListPush( if_s_st.storeId );
            if_s_st.load({
                params      : {
                    "instance"  : INSTANCE
                }
            });
        }
    }
    ,getStore           : function(INSTANCE, AUTOLOAD) {
        if(!INSTANCE) { INSTANCE = "default"; }
        if(!AUTOLOAD) { AUTOLOAD = false; }
        var if_s_st = Ext.getStore("intf_state_store");
        if(!if_s_st) {
            return Ext.create("CP.WebUI4.Store", {
                storeId     : "intf_state_store"
                ,autoLoad   : AUTOLOAD
                ,fields     : [
                    "interface"
                    ,"type"
                    ,"state"
                ]
                ,proxy      : {
                    type            : "ajax"
                    ,url            : "/cgi-bin/intf_state_list.tcl"
                    ,extraParams    : {
                        "instance"      : INSTANCE
                    }
                    ,limitParam     : null
                    ,pageParam      : null
                    ,startParam     : null
                    ,reader         : {
                        type            : "json"
                        ,root           : "data.intfs"
                    }
                }
                ,listeners  : {
                    load        : function(st, recs, success, op, eOpts) {
                        if(CP.intf_state.grids_to_refresh.length > 0) {
                            var gtr = CP.intf_state.grids_to_refresh;
                            var g;
                            for(var i = 0; i < gtr.length; i++) {
                                g = Ext.getCmp( gtr[i] );
                                if(g) {
                                    g.getView().refresh();
                                }
                            }
                        }
                        CP.ar_util.loadListPop( st.storeId );
                    }
                }
            });
        }
        return if_s_st;
    }
    ,defineStore        : function(INSTANCE, GRIDS_TO_REFRESH) {
        if(!INSTANCE) { INSTANCE = "default"; }
        if(!GRIDS_TO_REFRESH) {
            CP.intf_state.grids_to_refresh = [];
        } else if(GRIDS_TO_REFRESH.length > 0) {
            CP.intf_state.grids_to_refresh = GRIDS_TO_REFRESH;
        } else {
            CP.intf_state.grids_to_refresh = [];
        }
        return CP.intf_state.getStore(INSTANCE, true);
    }
    ,grids_to_refresh   : []
}

