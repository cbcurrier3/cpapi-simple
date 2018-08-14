CP.import_4 = {
    COMMUNITIES_ENABLED         : false

    ,GRID_HEIGHT                : 171
    ,POLICY_GRID_WIDTH          : 775
    ,ROUTE_GRID_WIDTH           : 650
    ,PREF_COL_WIDTH             : 75

    ,POLICY_LABELWIDTH          : 150

    ,check_user_action          : function() {
        CP.ar_util.checkBtnsbar("import_policy_btnsbar");
        CP.ar_util.checkBtnsbar("import_route_btnsbar");
        CP.ar_util.checkBtnsbar("policy_form");
        CP.ar_util.checkBtnsbar("policy_com_form");
        CP.ar_util.checkBtnsbar("route_form");
    }

//STUB:init
    ,init                       : function() {
        CP.ar_util.loadListPush("mySubmit");
        CP.import_4.defineStores();
        var import_configPanel = CP.import_4.configPanel();
        var obj = {
            title           : "Inbound Route Filters"
            ,panel          : import_configPanel
            ,submitURL      : "/cgi-bin/import_proto.tcl?instance="+ CP.ar_util.INSTANCE()
            ,params         : {}
            ,afterSubmit    : function() {
                CP.ar_util.checkWindowClose("policy_window");
                CP.ar_util.checkWindowClose("route_window");
                CP.import_4.doLoad();
            }
            ,submitFailure  : function() {
                CP.import_4.doLoad();
            }
            ,checkCmpState  : CP.import_4.check_user_action
            ,helpFile       : "import_protoHelp.html"
        };
        CP.UI.updateDataPanel(obj);
    }

//STUB:doLoad
    ,doLoad                     : function() {
        CP.ar_util.clearParams();
        CP.ar_util.loadListPush("policy_store");
        Ext.getStore("policy_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        Ext.getStore("community_store").removeAll();
        CP.ar_util.loadListPush("route_store");
        Ext.getStore("route_store").load({params: {"instance": CP.ar_util.INSTANCE()}});
        CP.ar_util.loadListPop("mySubmit");
    }

//create prefix
    ,get_prefix         : function(proto, regex, origin, as_num, push_param, value) {
        // regex needs to be in database format
        // origin needs to be in database format
            //any, incomplete, IGP, EGP
        if(proto == "") {
            return;
        } else if(push_param == null || push_param == undefined ) {
            push_param  = false;
            value       = "t";
        } else if(value == null || value == undefined) {
            value = "t";
        }

        var params      = CP.ar_util.getParams();
        var shortPREFIX = "routed:instance:"+ CP.ar_util.INSTANCE() +":import_proto";

        if(proto == "rip" || proto == "ospf2ase") {
            if(push_param) {
                params[shortPREFIX +":"+ proto]         = "t";
                params[shortPREFIX +":"+ proto +":all"] = "t";
            }
            return shortPREFIX +":"+ proto;
        }

        var id = parseInt(proto, 10);
        if(0 < id && id < 512) {
            //as-path
            if(push_param) {
                params[shortPREFIX +":bgp:id:"+ id]                                                 = value;
                params[shortPREFIX +":bgp:id:"+ id +":aspath:asregex:"+ regex]                      = value;
                params[shortPREFIX +":bgp:id:"+ id +":aspath:asregex:"+ regex +":origin:"+ origin]  = value;
            }
            return shortPREFIX +":bgp:id:"+ id +":aspath:asregex:"+ regex +":origin:"+ origin;
        } else if(511 < id && id < 1025) {
            //as
            if(push_param) {
                params[shortPREFIX +":bgp:id:"+ id]                 = value;
                params[shortPREFIX +":bgp:id:"+ id +":as:"+ as_num] = value;
            }
            return shortPREFIX +":bgp:id:"+ id +":as:"+ as_num;
        }
        return "";
    }

//STUB:defineStores
    ,defineStores               : function() {
        function proto_sortType(v) {
            switch(v) {
                case "ospf2ase":    return 1;
                    break;
                case "rip":         return 2;
                    break;
                default:
                    return 10000 + parseInt(v, 10);
            }
        }

        function route_mask_sortType(v) {
            if(v == null || v == undefined || v.length == 0) {
                return 0;
            }
            var routemask = v.split("/");
            var route   = routemask[0];
            var mask    = routemask[1];
            var o       = route.split(".");
            var retValue = 0;
            var i;
            for(i = 0; i < 4; i++) {
                retValue = 256 * parseInt(retValue, 10) + parseInt(o[i], 10);
            }
            retValue = 256 * parseInt(retValue, 10) + parseInt(mask);
            return retValue;
        }

        function filtertype_sortType(v) {
            switch(v.toLowerCase()) {
                case "exact":   return 1;
                    break;
                case "refines": return 2;
                    break;
                case "range":   return 3;
                    break;
                default:        return 0;
            }
        }

        Ext.create("CP.WebUI4.Store", {
            storeId     : "policy_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "proto"
                    ,sortType   : proto_sortType
                }
                ,"proto_mask"
                ,"regex"
                ,"origin"
                ,"as_num"
                ,"restrict"
                ,"rank"
                ,"localpref"
                ,"preference"
                ,"com_enabled"
                ,"com_list"
                ,"regex_origin"
                ,"policy_binding"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/import_proto.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "protocols"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.data_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    if(st.getCount() > 0) {
                        var rec = st.getAt(0);
                        CP.import_4.COMMUNITIES_ENABLED = (rec.data.com_enabled == "t") ? true : false;
                    }
                    CP.ar_util.loadListPop(st.storeId);
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "community_store"
            ,autoLoad   : false
            ,data       : []
            ,fields     : [
                "community"
                ,"as"
                ,"newrec"
            ]
            ,proxy      : {
                type    : "memory"
                ,reader : {
                    type    : "array"
                }
            }
        });

        Ext.create("CP.WebUI4.Store", {
            storeId     : "route_store"
            ,autoLoad   : false
            ,fields     : [
                {
                    name        : "proto"
                    ,sortType   : proto_sortType
                }
                ,"proto_mask"
                ,"regex"
                ,"origin"
                ,"as_num"
                ,{
                    name        : "route_mask"
                    ,sortType   : route_mask_sortType
                }
                ,"route"
                ,"mask"
                ,{
                    name        : "filtertype"
                    ,sortType   : filtertype_sortType
                }
                ,"between"
                ,"and"
                ,"restrict"
                ,"rank"
                ,"localpref"
                ,"preference"
                ,"policy_binding"
            ]
            ,proxy      : {
                type            : "ajax"
                ,url            : "/cgi-bin/import_proto.tcl"
                ,extraParams    : {
                    "instance"      : CP.ar_util.INSTANCE()
                    ,"option"       : "routes"
                }
                ,limitParam     : null
                ,pageParam      : null
                ,startParam     : null
                ,reader         : {
                    type            : "json"
                    ,root           : "data.data_list"
                }
            }
            ,listeners  : {
                load        : function(st, recs, success, op, eOpts) {
                    CP.ar_util.loadListPop(st.storeId);
                }
            }
        });
    }

    ,load_community_store       : function(rec) {
        var com_st = Ext.getStore("community_store");
        if(com_st) {
            if(rec == null || rec == undefined) {
                com_st.removeAll();
            } else {
                com_st.loadData( rec.data.com_list );
            }
        }
    }

    ,configPanel                : function() {
        var configPanel = Ext.create("CP.WebUI4.DataFormPanel", {
            id          : "import_configPanel"
            ,margin     : "0 24 0 24"
            ,listeners  : {
                afterrender : CP.import_4.doLoad
            }
            ,items      : [
                CP.ar_one_liners.get_one_liner("import_proto"),
                CP.import_4.get_policy_set()
                ,CP.import_4.get_route_set()
            ]
        });

        return configPanel;
    }

//STUB:policies
    ,get_policy_set             : function() {
        //btnsbar
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "import_policy_btnsbar"
            ,items  : [
                {
                    text                : "Add BGP Policy"
                    ,id                 : "import_policy_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("policy_grid").getSelectionModel().deselectAll();
                        CP.import_4.load_community_store(null);
                        CP.import_4.open_policy_window("add", 0);
                    }
                },{
                    text                : "Edit"
                    ,id                 : "import_policy_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("policy_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T;
                        if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                            T = "Configure "+ rec.data.proto_mask.replace(" Routes","") +" All Routes";
                        } else {
                            T = "Import ID "+ rec.data.proto +" All Routes";
                        }
                        CP.import_4.load_community_store(rec);
                        CP.import_4.open_policy_window(T, rec.data.proto);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("policy_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "import_policy_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("policy_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            delete_policy(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("policy_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        function delete_policy(rec) {
            var st          = Ext.getStore("policy_store");
            var params      = CP.ar_util.getParams();
            var i;

            var proto       = rec.data.proto;
            var regex       = rec.data.regex;
            var origin      = rec.data.origin;
            var as_num      = rec.data.as_num;

            var prefix      = CP.import_4.get_prefix(proto, regex, origin, as_num, true, "");
            if(prefix == "") {
                return;
            }

            //delete the individual routes
                //gets the records that use this proto
                //call their delete functions
            var recs = Ext.getStore("route_store").getRange();
            for(i = 0; i < recs.length; i++) {
                if(proto == recs[i].data.proto) {
                    CP.import_4.delete_route_record(recs[i]);
                }
            }

            //delete the policy route
            params[prefix +":all:restrict"]     = "";
            params[prefix +":all:localpref"]    = "";
            params[prefix +":all:precedence"]   = "";
            if(proto != "rip" && proto != "ospf2ase") {
                params[prefix +":all"]          = "";
                params[prefix +":localpref:"+ rec.data.localpref]   = "";
                params[prefix +":preference:"+ rec.data.preference] = "";

                params[prefix +":aspathopt"] = "";
                var com_list = rec.data.com_list;
                for(i = 0; i < com_list.length; i++) {
                    params[prefix +":aspathopt:community:"+ com_list[i].community]          = "";
                    params[prefix +":aspathopt:community:"+ com_list[i].community +":as"]   = "";
                }
            }

            st.remove(rec);
        }

        //grid
        var grid_cm = [
            {
                text            : "&#160;"
                ,align          : "left"
                ,dataIndex      : "proto"
                ,width          : 300
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Policy"
                        ,dataIndex      : "proto"
                        //,flex           : 1
                        ,width          : 300
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st, view) {
                            return CP.ar_util.rendererGeneric(rec.data.proto_mask);
                        }
                    }
                ]
            },{
                text            : "All Routes"
                ,align          : "center"
                ,width          : 100 + CP.import_4.PREF_COL_WIDTH
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Action"
                        ,dataIndex      : "restrict"
                        ,width          : 100
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st, view) {
                            var retValue = "Accept";
                            if(value == "t") {
                                retValue = "Restrict";
                            }
                            return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                        }
                    },{
                        text            : "Rank"
                        ,dataIndex      : "rank"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : CP.ar_util.rendererGeneric
                    }
                ]
            },{
                text            : "BGP Policies"
                ,width          : CP.import_4.PREF_COL_WIDTH + CP.import_4.PREF_COL_WIDTH + 150
                ,align          : "center"
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Weight"
                        ,dataIndex      : "preference"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : CP.ar_util.rendererGeneric
                    },{
                        text            : "Local Pref"
                        ,dataIndex      : "localpref"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : CP.ar_util.rendererGeneric
                    },{
                        text            : "Communities"
                        ,dataIndex      : "com_list"
                        ,width          : 150
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st, view) {
                            function formatCommunityLine(d) {
                                var com = d.community;
                                var as = d.as;
                                return ( "Community "+ String(com) +" : AS "+ String(as) );
                            }
                            var retValue;
                            if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                                retValue = "";
                            } else if(rec.data.com_enabled == "") {
                                retValue = "";
                            } else if(value.length == 0) {
                                retValue = "";
                            } else {
                                var i = 0;
                                retValue = formatCommunityLine( value[i] );
                                for(i = 1; i < value.length; i++) {
                                    retValue += "<br />"+ formatCommunityLine( value[i] );
                                }
                            }
                            return CP.ar_util.rendererGeneric(retValue);
                        }
                    }
                ]
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("import_policy_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "policy_grid"
            ,width              : CP.import_4.POLICY_GRID_WIDTH
            ,height             : CP.import_4.GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("policy_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("import_policy_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Policies for Individual Protocols"
            }
            ,btnsbar
            ,{
                    xtype       : "cp4_formpanel"
                    ,margin     : 0
                    ,padding    : 0
                    ,autoScroll : true
                    ,items      : [ grid ]
            }
        ];
    }

//STUB:POLICY WINDOW
    ,get_policy_hidden_set      : function() {
            //proto     //regex     //origin    //as_num
        return {
            xtype   : "cp4_formpanel"
            ,id     : "policy_hidden_set"
            ,margin : "0 0 0 15"
            ,layout : "column"
            ,hidden : true
            ,items  : [
                {
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "proto_entry"
                    ,id             : "proto_entry"
                    ,name           : "proto"
                    ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-right:15px;"
                },{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "regex_entry"
                    ,id             : "regex_entry"
                    ,name           : "regex"
                    ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                },{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "origin_entry"
                    ,id             : "origin_entry"
                    ,name           : "origin"
                    ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                    ,style          : "margin-right:15px;"
                },{
                    xtype           : "cp4_displayfield"
                    ,fieldLabel     : "as_num_entry"
                    ,id             : "as_num_entry"
                    ,name           : "as_num"
                    ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                    ,width          : 250
                    ,height         : 22
                }
            ]
        };
    }

    ,get_policy_bgp_type_cmp    : function() {
        return {
            xtype           : "cp4_combobox"
            ,fieldLabel     : "Filter Type"
            ,id             : "bgp_type"
            ,name           : "bgp_type_name"
            ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
            ,width          : 450
            ,style          : "margin-top:15px;margin-left:15px;"
            ,allowBlank     : false
            ,editable       : false
            ,queryMode      : "local"
            ,triggerAction  : "all"
            ,emptyText      : "Select one"
            ,value          : "aspath"
            ,store          :   [["aspath"  ,"Based on AS_PATH Regular Expression (1-511)"]
                                ,["as"      ,"Based on Autonomous System Number (512-1024)"]]
            ,listeners      : {
                afterrender     : function(field, eOpts) {
                    field.fireEvent("change");
                }
                ,change         : function() {
                    var value       = Ext.getCmp("bgp_type").getValue();
                    if(value == "") { return; }
                    var id_cmp      = Ext.getCmp("id_entry");
                    var aspath_set  = Ext.getCmp("aspath_set");
                    var as_set      = Ext.getCmp("as_set");
                    var minVal      = (value == "as") ? 512 : 1;
                    var maxVal      = (value == "as") ? 1024 : 511;
                    if(aspath_set) {
                        aspath_set.setDisabled( value == "as");
                        aspath_set.setVisible(  value != "as");
                    }
                    if(as_set) {
                        as_set.setDisabled(     value != "as");
                        as_set.setVisible(      value == "as");
                    }
                    if(id_cmp) {
                        id_cmp.setMinValue( minVal );
                        CP.ar_util.setMaxValueLength("id_entry", maxVal);
                        id_cmp.validate();
                    }
                }
            }
        };
    }

    ,get_policy_proto_set       : function() {
        //ID            numberfield
        //aspath_set
            //regex     textfield
            //origin    combobox
        //as_set
            //as_num    numberfield

        function original_regex_origin() {
            var regex_d = String(Ext.getCmp("regex_display").getValue());
            var regex   = CP.ar_util.REGEX_to_DB( regex_d );
            var origin  = Ext.getCmp("origin_display").getValue();
            if(regex == "") { return ""; }
            if(origin == "") {
                return true;
            }
            if((-1 != Ext.getStore("policy_store").findExact("regex_origin", regex +"_"+ origin))) {
                return "A filter using this AS-PATH and Origin already exists.";
            }
            return true;
        }

        return {
            xtype   : "cp4_formpanel"
            ,width  : 530
            ,margin : "0 0 0 15"
            ,items  : [
                {
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Import ID"
                    ,id                 : "id_entry"
                    ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                    ,width              : 250
                    ,allowBlank         : false
                    ,minValue           : 1
                    ,maxValue           : 511
                    ,maxLength          : 4
                    ,enforceMaxLength   : true
                    ,validator          : function() {
                        var v = parseInt( Ext.getCmp("id_entry").getRawValue(), 10);
                        if(v == "" || v == 0) { return ""; }
                        if(-1 != Ext.getStore("policy_store").findExact("proto",v)) {
                            return "Must be unique";
                        }
                        return true;
                    }
                    ,listeners          : {
                        change              : function(field, newVal, oldVal, eOpts) {
                            Ext.getCmp("proto_entry").setValue(newVal);
                        }
                        ,afterrender        : function(field, eOpts) {
                            field.validate();
                            field.focus();
                        }
                    }
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "aspath_set"
                    ,width      : 530
                    ,autoScroll : false
                    ,margin     : 0
                    ,listeners  : {
                        show        : function(p, eOpts) {
                            Ext.getCmp("regex_display").validate();
                            Ext.getCmp("origin_display").validate();
                        }
                    }
                    ,items      : [
                        {
                            xtype               : "cp4_textfield"
                            ,fieldLabel         : "AS-PATH Regular Expression"
                            ,id                 : "regex_display"
                            ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                            ,width              : 530
                            ,allowBlank         : false
                            ,maskRe             : /[0-9\ \[\]\(\)\*\+\?\|\.\-\^]/
                            ,maxLength          : 428
                            ,enforceMaxLength   : true
                            ,validator      : function(v) {
                                var len = v.length;
                                if(len == 0) {
                                    return "";
                                }
                                if(len > 0) {
                                    if(v[0] == " ") {
                                        return "AS Path may not begin with whitespace.";
                                    }
                                    if(v[len -1] == " ") {
                                        return "AS Path may not end with whitespace.";
                                    }
                                }
                                //check for identical regex/origin
                                return original_regex_origin();
                            }
                            ,listeners      : {
                                blur            : function() {
                                    var value = String(Ext.getCmp("regex_display").getValue());
                                    var regex = "";
                                    if(value.length > 0) {
                                        //strip alphabet and consecutive whitespace
                                        value = CP.ar_util.REGEX_cleanUp(value);
                                        regex = CP.ar_util.REGEX_to_DB(value);
                                    }
                                    Ext.getCmp("regex_display").setValue(value);
                                    Ext.getCmp("regex_entry").setValue(regex);
                                }
                                ,afterrender    : function(field, eOpts) {
                                    field.validate();
                                }
                            }
                        },{
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Origin"
                            ,id             : "origin_display"
                            ,name           : "origin_display_name"
                            ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                            ,width          : 300
                            ,queryMode      : "local"
                            ,mode           : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,store          :   [["any"         ,"Any"]
                                                ,["IGP"         ,"IGP"]
                                                ,["EGP"         ,"EGP"]
                                                ,["incomplete"  ,"Incomplete"]]
                            ,allowBlank     : false
                            ,emptyText      : "Select One"
                            ,value          : ""
                            ,listeners      : {
                                change          : function() {
                                    var o = Ext.getCmp("origin_display").getValue();
                                    Ext.getCmp("origin_entry").setValue(o);
                                    Ext.getCmp("regex_display").validate();
                                }
                                ,afterrender    : function(field, eOpts) {
                                    field.validate();
                                }
                            }
                        }
                    ] //aspath_set, items
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "as_set"
                    ,width      : 530
                    ,autoScroll : false
                    ,margin     : 0
                    ,listeners  : {
                        show        : function(p, eOpts) {
                            Ext.getCmp("as_num_display").validate();
                        }
                    }
                    ,items      : [
                        {
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "AS Number"
                            ,id                 : "as_num_display"
                            ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                            ,width              : 250
                            ,allowBlank         : false
                            ,allowDecimals      : false
                            ,minValue           : 1
                            ,maxValue           : 65535
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                            ,listeners          : {
                                change              : function(field, newVal, oldVal, eOpts) {
                                    Ext.getCmp("as_num_entry").setValue(newVal);
                                }
                                ,afterrender        : function(field, eOpts) {
                                    field.validate();
                                }
                            }
                            ,validator          : function(v) {
                                var value = Ext.getCmp("as_num_display").getRawValue();
                                if(value == "") {
                                    return "";
                                }
                                if(Ext.getStore("policy_store").findExact("as_num",value) != -1) {
                                    return "Must be unique.";
                                }
                                return true;
                            }
                        }
                    ] //as_set, items
                }
            ]
        };
    }

    ,get_policy_action_set      : function(TYPE) {

        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "import_policy_com_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "import_policy_com_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("community_grid").getSelectionModel().deselectAll();
                        CP.import_4.open_policy_com_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "import_policy_com_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("community_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Edit Community "+ rec.data.community;
                        CP.import_4.open_policy_com_window(T);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("community_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "import_policy_com_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("community_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var st = Ext.getStore("community_store");
                        var i;
                        var p = Ext.getCmp("policy_form");
                        var d = (p ? p.comDelArr : []);
                        if (st && recs.length > 0) {
                            for(i = 0; i < recs.length; i++) {
                                d.push( String(recs[i].data.community) );
                            }
                            st.remove(recs);
                        }
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("community_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        var grid_cm = [
            {
                text            : "Community"
                ,dataIndex      : "community"
                ,width          : 150
                ,menuDisabled   : true
            },{
                text            : "AS"
                ,dataIndex      : "as"
                ,width          : 100
                ,menuDisabled   : true
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    var edit_btn    = Ext.getCmp("import_policy_com_edit_btn");
                    var delete_btn  = Ext.getCmp("import_policy_com_delete_btn");
                    if(edit_btn) {
                        edit_btn.setDisabled(   selections.length != 1 );
                    }
                    if(delete_btn) {
                        delete_btn.setDisabled( selections.length == 0 );
                    }
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "community_grid"
            ,width              : 250
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("community_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("import_policy_com_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return {
            xtype   : "cp4_formpanel"
            ,width  : 530
            ,margin : "0 0 0 15"
            ,items  : [
                {
                    xtype       : "cp4_formpanel"
                    ,id         : "bgp_set"
                    ,width      : 530
                    ,layout     : "column"
                    ,margin     : 0
                    ,listeners  : {
                        show        : function(p, eOpts) { p.setDisabled(false); }
                        ,hide       : function(p, eOpts) { p.setDisabled(true); }
                    }
                    ,items      : [
                        {
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Weight"
                            ,id                 : "preference_entry"
                            ,name               : "preference"
                            ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                            ,width              : 250
                            ,style              : "margin-right:15px;"
                            ,minValue           : 0
                            ,maxValue           : 65535
                            ,allowDecimals      : false
                            ,allowBlank         : true
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Local Pref"
                            ,id                 : "localpref_entry"
                            ,name               : "localpref"
                            ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                            ,width              : 250
                            ,style              : "margin-left:15px;"
                            ,minValue           : 0
                            ,maxValue           : 65535
                            ,allowDecimals      : false
                            ,allowBlank         : true
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                        },{
                            xtype   : "cp4_formpanel"
                            ,id     : "community_set"
                            ,width  : 530
                            ,margin : 0
                            ,hidden : !(CP.import_4.COMMUNITIES_ENABLED)
                            ,items  : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Communities"
                                }
                                ,btnsbar
                                ,grid
                            ]
                        },{
                            xtype   : "cp4_formpanel"
                            ,id     : "community_disabled_set"
                            ,width  : 530
                            ,margin : 0
                            ,hidden : !(!(CP.import_4.COMMUNITIES_ENABLED))
                            ,items  : [
                                {
                                    xtype       : "cp4_sectiontitle"
                                    ,titleText  : "Communities"
                                },{
                                    xtype       : "cp4_label"
                                    ,text       : "Communities not Enabled"
                                }
                            ]
                        }
                    ] //bgp_set items
                },{
                    xtype       : "cp4_sectiontitle"
                    ,titleText  : "All Routes"
                },{
                    xtype       : "cp4_formpanel"
                    ,width      : 530
                    ,layout     : "column"
                    ,margin     : 0
                    ,items      : [
                        {
                            xtype           : "cp4_combobox"
                            ,fieldLabel     : "Action"
                            ,id             : "restrict_entry"
                            ,name           : "restrict"
                            ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                            ,width          : 250
                            ,style          : "margin-right:15px;"
                            ,queryMode      : "local"
                            ,editable       : false
                            ,triggerAction  : "all"
                            ,value          : ""
                            ,store          :   [[""    ,"Accept"]
                                                ,["t"   ,"Restrict"]]
                            ,listeners      : {
                                change  : function() {
                                    var value = Ext.getCmp("restrict_entry").getValue();
                                    Ext.getCmp("rank_entry").setVisible(    value == "");
                                    Ext.getCmp("rank_entry").setDisabled(   value != "");
                                }
                            }
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : (Ext.typeOf( TYPE ) == "string") ? "Rank" : "Local Pref"
                            ,id                 : "rank_entry"
                            ,name               : "rank"
                            ,labelWidth         : CP.import_4.POLICY_LABELWIDTH
                            ,width              : 250
                            ,style              : "margin-left:15px;"
                            ,minValue           : 0
                            ,maxValue           : 255   //255 for rip/ospf, 65535 for bgp
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                            ,allowDecimals      : false
                            ,allowBlank         : true
                            ,listeners          : {
                                show                : function(p, eOpts) { p.setDisabled(false); }
                                ,hide               : function(p, eOpts) { p.setDisabled(true); }
                            }
                        }
                    ]
                }
            ]
        };
    }

//STUB:POLICY WINDOW
    ,open_policy_window         : function(TITLE, TYPE) {

        var bgp_type_cmp;
        var policy_hidden_set   = CP.import_4.get_policy_hidden_set();
        var policy_proto_set;
        var policy_action_set   = CP.import_4.get_policy_action_set(TYPE);

        if(TITLE == "add") {
            var TITLE           = "Add BGP Policy";
            bgp_type_cmp        = CP.import_4.get_policy_bgp_type_cmp();
            policy_proto_set    = CP.import_4.get_policy_proto_set();
        } else {
            bgp_type_cmp        = { xtype: "tbspacer", id: "bgp_type", width: 15, height: 15 };
            policy_proto_set    = {
                xtype           : "cp4_displayfield"
                ,fieldLabel     : "Policy"
                ,id             : "proto_mask_entry"
                ,name           : "proto_mask"
                ,labelWidth     : CP.import_4.POLICY_LABELWIDTH
                ,width          : 545
                ,height         : 22
                ,style          : "margin-left:15px;"
            };
        }

        function save_policy() {
            var params      = CP.ar_util.clearParams();

            var proto       = Ext.getCmp("proto_entry").getValue();
            var regex       = Ext.getCmp("regex_entry").getValue();
            var origin      = Ext.getCmp("origin_entry").getValue();
            var as_num      = Ext.getCmp("as_num_entry").getValue();

            var restrict    = Ext.getCmp("restrict_entry").getValue();
            var rank        = (restrict == "t") ? "" : Ext.getCmp("rank_entry").getRawValue();
            var localpref   = Ext.getCmp("localpref_entry").getRawValue();
            var localpref_o = Ext.getCmp("localpref_entry").originalValue;
            var lp_val      = (localpref != "") ? "t" : "";
            var preference  = Ext.getCmp("preference_entry").getRawValue();
            var preference_o= Ext.getCmp("preference_entry").originalValue;
            var pref_val    = (preference != "") ? "t" : "";

            var prefix  = CP.import_4.get_prefix(proto, regex, origin, as_num, true, "t");
            if(prefix == "") {
                Ext.Msg.alert("Warning", "Invalid Import ID supplied.");
                return;
            }

            //prefix pieces are pushed by .get_prefix
            params[prefix +":all"]          = "t";
            params[prefix +":all:restrict"] = restrict;
            if(proto == "rip" || proto == "ospf2ase") {
                params[prefix +":all:precedence"]           = rank;
            } else { //bgp policy
                params[prefix +":all:localpref"]            = rank;
                if (localpref_o != "" && localpref_o != localpref) {
                    params[prefix +":localpref:"+ localpref_o] = "";
                }
                params[prefix +":localpref:"+ localpref]    = lp_val;
                if (preference_o != "" && preference_o != preference) {
                    params[prefix +":preference:"+ preference_o] = "";
                }
                params[prefix +":preference:"+ preference]  = pref_val;

                //communities
                var recs        = Ext.getStore("community_store").getRange();
                var com_v       = (CP.import_4.COMMUNITIES_ENABLED) ? "t" : "";
                var com_prefix  = prefix +":aspathopt";
                params[com_prefix]  = com_v;
                com_prefix += ":community:";
                var i, com, as;
                var d = Ext.getCmp("policy_form").comDelArr;
                for(i = 0; i < d.length; i++) {
                    params[com_prefix + d[i] ]          = "";
                    params[com_prefix + d[i] +":as"]    = "";
                }
                for(i = 0; i < recs.length; i++) {
                    com = (com_v == "t") ? recs[i].data.community : "";
                    as  = (com_v == "t") ? recs[i].data.as : "";
                    params[com_prefix + com]            = com_v;
                    params[com_prefix + com +":as"]     = as;
                }
            }
            CP.ar_util.mySubmit();
        }

        var policy_form = {
            xtype       : "cp4_formpanel"
            ,id         : "policy_form"
            ,width      : 560
            ,height     : 444
            ,margin     : 0
            ,firstLoad  : true
            ,comDelArr  : []
            ,listeners  : {
                afterrender : function() {
                    var p = Ext.getCmp("policy_form");
                    if (!p) { return; }
                    p.form._boundItems = null;
                    CP.ar_util.clearParams();
                    var bgp_policy  = true;
                    var bgp_set     = Ext.getCmp("bgp_set");
                    var rank_cmp    = Ext.getCmp("rank_entry");
                    var rec         = null;
                    if(p.firstLoad && Ext.getCmp("bgp_type").getXType() == "tbspacer") {
                        //edit
                        rec = Ext.getCmp("policy_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                        if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                            bgp_policy = false;
                            Ext.getCmp("localpref_entry").originalValue = "";
                            Ext.getCmp("preference_entry").originalValue = "";
                        } else {
                            Ext.getCmp("localpref_entry").originalValue = rec.data.localpref;
                            Ext.getCmp("preference_entry").originalValue = rec.data.preference;
                        }
                    }
                    p.firstLoad = false;

                    if(bgp_set) {
                        bgp_set.setVisible(   bgp_policy);
                        bgp_set.setDisabled(  !bgp_policy);
                    }
                    if(rank_cmp)    {
                        CP.ar_util.setMaxValueLength("rank_entry", ( (bgp_policy) ? 65535 : 255 ) );
                        rank_cmp.validate();
                    }
                    if (p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkBtnsbar("import_policy_com_btnsbar");
                CP.ar_util.checkDisabledBtn("policy_save_button");
                CP.ar_util.checkDisabledBtn("policy_cancel_button");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "policy_save_button"
                    ,disabled           : true
                    ,formBind           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        save_policy(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = Ext.getCmp("policy_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "policy_cancel_button"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.clearParams();
                        CP.ar_util.checkWindowClose("policy_window");
                    }
                }
            ]
            ,items      : [
                bgp_type_cmp
                ,policy_hidden_set
                ,policy_proto_set
                ,policy_action_set
            ]
        };

        var policy_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "policy_window"
            ,title      : TITLE
            ,shadow     : false
            ,closeAction: "destroy"
            ,listeners  : {
                show            : function(win, eOpts) {
                    //adjust_policy_window_size();
                    win.setPosition(225,100);
                }
            }
            ,items      : [ policy_form ]
        });
        policy_window.show();

        function adjust_policy_window_size() {
            var f_height    = 84;
            var sm          = Ext.getCmp("policy_grid").getSelectionModel();

            if(sm.getCount() == 0) { //add
                if(CP.import_4.COMMUNITIES_ENABLED) {
                    //new bgp with communities
                    f_height = 364;
                } else {
                    //new bgp without communities
                    f_height = 192;
                }
            } else { //edit
                var rec = sm.getLastSelected();
                if(rec.data.proto == "rip" || rec.data.proto == "ospf2ase") {
                    f_height = 84;
                } else {
                    if(CP.import_4.COMMUNITIES_ENABLED) {
                        //edit bgp with communities
                        f_height = 283;
                    } else {
                        //edit bgp without communities
                        f_height = 111;
                    }
                }
            }

            Ext.getCmp("policy_form").setHeight(f_height );
            Ext.getCmp("policy_window").setHeight(f_height + 62);
        }
    }
//STUB:community add/edit
    ,open_policy_com_window     : function(TITLE) {
        var com_cmp;
        if(TITLE == "add") {
            TITLE = "Add Community";
            com_cmp = {
                xtype               : "cp4_numberfield"
                ,fieldLabel         : "Community"
                ,id                 : "community_entry"
                ,name               : "community"
                ,labelWidth         : 100
                ,width              : 200
                ,allowBlank         : false
                ,allowDecimals      : false
                ,minValue           : 1
                ,maxValue           : 65535
                ,maxLength          : 5
                ,enforceMaxLength   : true
            };
        } else {
            com_cmp = {
                xtype               : "cp4_displayfield"
                ,fieldLabel         : "Community"
                ,id                 : "community_entry"
                ,name               : "community"
                ,labelWidth         : 100
                ,width              : 200
                ,height             : 22
            };
        }

        var as_cmp = {
            xtype               : "cp4_numberfield"
            ,fieldLabel         : "AS Number"
            ,id                 : "com_as_entry"
            ,name               : "as"
            ,labelWidth         : 100
            ,width              : 200
            ,allowBlank         : false
            ,allowDecimals      : false
            ,minValue           : 1
            ,maxValue           : 65535
            ,maxLength          : 5
            ,enforceMaxLength   : true
        };

        function save_policy_com() {
            var com = Ext.getCmp("community_entry").getRawValue();
            var as  = Ext.getCmp("com_as_entry").getRawValue();
            if(com == "" || as == "") { return; }

            var st  = Ext.getStore("community_store");
            var rec = st.findRecord("community", com, 0, false, true, true);
            if(rec) {
                //already exists, update it
                rec.data["as"]  = as;
            } else {
                //new community
                st.add({
                    "community" : com
                    ,"as"       : as
                });
            }
            Ext.getCmp("community_grid").getView().refresh();
            CP.ar_util.checkWindowClose("policy_com_window");
        }

        var policy_com_form = {
            xtype       : "cp4_formpanel"
            ,id         : "policy_com_form"
            ,width      : 230
            ,margin     : 0
            ,listeners  : {
                afterrender : function(p, eOpts) {
                    p.form._boundItems = null;
                    if(Ext.getCmp("community_entry").getXType() == "cp4_displayfield") {
                        var rec = Ext.getCmp("community_grid").getSelectionModel().getLastSelected();
                        p.loadRecord(rec);
                        Ext.getCmp("com_as_entry").focus();
                    } else {
                        Ext.getCmp("community_entry").focus();
                    }
                    if (p.chkBtns) { p.chkBtns(); }
                }
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("policy_com_save_btn");
                CP.ar_util.checkDisabledBtn("policy_com_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Ok"
                    ,id                 : "policy_com_save_btn"
                    ,disabled           : true
                    ,formBind           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        save_policy_com(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = Ext.getCmp("policy_com_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("policy_com_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "policy_com_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("policy_com_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            if(Ext.getCmp("community_entry").validate) {
                                Ext.getCmp("community_entry").validate();
                            }
                            if(Ext.getCmp("com_as_entry").validate) {
                                Ext.getCmp("com_as_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                {
                    xtype       : "cp4_formpanel"
                    ,width      : 200
                    ,margin     : "15 0 8 15"
                    ,autoScroll : false
                    ,items      : [
                        com_cmp
                        ,as_cmp
                    ]
                }
            ]
        };

        var policy_com_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "policy_com_window"
            ,title      : TITLE
            ,shadow     : false
            ,listeners  : {
                show        : function(win, eOpts) {
                    var pos = Ext.getCmp("policy_window").getPosition();
                    var y   = 120;
                    if(Ext.getCmp("bgp_type").getXType() == "cp4_combobox") {
                        switch(Ext.getCmp("bgp_type").getValue()) {
                            case "as":      y = 173;
                                break;
                            case "aspath":  y = 200;
                                break;
                            default:        y = 120;
                        }
                    }
                    win.setPosition(300 + pos[0], y + pos[1]);
                }
            }
            ,items      : [ policy_com_form ]
        });
        policy_com_window.show();
    }

//STUB:individual routes
    ,get_route_set              : function() {
        //btnsbar
        var btnsbar = {
            xtype   : "cp4_btnsbar"
            ,id     : "import_route_btnsbar"
            ,items  : [
                {
                    text                : "Add"
                    ,id                 : "import_route_add_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        Ext.getCmp("route_grid").getSelectionModel().deselectAll();
                        CP.import_4.open_route_window("add");
                    }
                },{
                    text                : "Edit"
                    ,id                 : "import_route_edit_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        var sm = Ext.getCmp("route_grid").getSelectionModel();
                        var rec = sm.getLastSelected();
                        var T = "Configure Route "+ rec.data.route_mask +" for "+ rec.data.proto_mask;
                        CP.import_4.open_route_window(T);
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("route_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() != 1 : true);
                    }
                },{
                    text                : "Delete"
                    ,id                 : "import_route_delete_btn"
                    ,disabled           : true
                    ,overrideNoToken    : false
                    ,handler2           : function() {
                        CP.ar_util.clearParams();
                        var sm = Ext.getCmp("route_grid").getSelectionModel();
                        var recs = sm.getSelection();
                        var i;
                        for(i = 0; i < recs.length; i++) {
                            CP.import_4.delete_route_record(recs[i]);
                        }
                        CP.ar_util.mySubmit();
                    }
                    ,disabledConditions : function() {
                        var g = Ext.getCmp("route_grid");
                        return ( (g && g.getSelCount) ? g.getSelCount() == 0 : true);
                    }
                }
            ]
        };

        //grid
        var grid_cm = [
            {   //&#160; === blank (whitespace)
                text            : "&#160;" //Individual Routes
                ,width          : 325
                ,align          : "left"
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Policy"
                        ,dataIndex      : "proto"
                        ,width          : 125
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st, view) {
                            var retValue = "";
                            switch(value) {
                                case "rip":         retValue = "RIP";
                                    break;
                                case "ospf2ase":    retValue = "OSPFv2";
                                    break;
                                default:            retValue = "Import ID "+ value;
                            }
                            return CP.ar_util.rendererSpecific(retValue);
                        }
                    },{
                        text            : "Address"
                        ,dataIndex      : "route_mask"
                        ,width          : 100
                        ,menuDisabled   : true
                    },{
                        text            : "Match Type"
                        ,dataIndex      : "filtertype"
                        ,width          : 100
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st, view) {
                            var retValue = "";
                            switch(value.toLowerCase()) {
                                case "normal":
                                    retValue = "Normal";
                                    break;
                                case "exact":
                                    retValue = "Exact";
                                    break;
                                case "refines":
                                    retValue = "Refines";
                                    break;
                                case "range":
                                    retValue = "Range "+ rec.data.between +" to "+ rec.data.and;
                                    break;
                                default:
                            }
                            return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                        }
                    },{
                        text            : "Action"
                        ,dataIndex      : "restrict"
                        ,width          : 100
                        ,menuDisabled   : true
                        ,renderer       : function(value) {
                            var retValue = "Accept";
                            if(value == "t") {
                                retValue = "Restrict";
                            }
                            return CP.ar_util.rendererSpecific(retValue, retValue, "center");
                        }
                    }
                ]
            },{
                text            : "Non-BGP"
                ,width          : CP.import_4.PREF_COL_WIDTH
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Rank"
                        ,dataIndex      : "rank"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : function(value) {
                            return CP.ar_util.rendererSpecific(value, value, "center");
                        }
                    }
                ]
            },{
                text            : "BGP Policies"
                ,width          : (CP.import_4.PREF_COL_WIDTH * 2)
                ,menuDisabled   : true
                ,columns        : [
                    {
                        text            : "Weight"
                        ,dataIndex      : "preference"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : function(value) {
                            return CP.ar_util.rendererSpecific(value, value, "center");
                        }
                    },{
                        text            : "Local Pref"
                        ,dataIndex      : "localpref"
                        ,width          : CP.import_4.PREF_COL_WIDTH
                        ,menuDisabled   : true
                        ,renderer       : function(value) {
                            return CP.ar_util.rendererSpecific(value, value, "center");
                        }
                    }
                ]
            }
        ];

        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                    CP.ar_util.checkBtnsbar("import_route_btnsbar");
                }
            }
        });

        var grid = {
            xtype               : "cp4_grid"
            ,id                 : "route_grid"
            ,width              : CP.import_4.ROUTE_GRID_WIDTH
            ,height             : CP.import_4.GRID_HEIGHT
            ,margin             : 0
            ,forceFit           : true
            ,autoScroll         : true
            ,store              : Ext.getStore("route_store")
            ,columns            : grid_cm
            ,selModel           : grid_selModel
            ,draggable          : false
            ,enableColumnMove   : false
            ,enableColumnResize : true
            ,listeners          : {
                itemdblclick        : function() {
                    var b = Ext.getCmp("import_route_edit_btn");
                    if (b && b.handler) { b.handler(b); }
                }
            }
        };

        return [
            {
                xtype       : "cp4_sectiontitle"
                ,titleText  : "Fine-tuning Policies"
            }
            ,btnsbar
            ,{
                xtype       : "cp4_formpanel"
                ,margin     : 0
                ,padding    : 0
                ,autoScroll : true
                ,items      : [ grid ]
            }
        ];
    }

    ,delete_route_record        : function(rec) {
        var params      = CP.ar_util.getParams();
        var st          = Ext.getStore("route_store");

        var net         = rec.data.route;
        var mask        = rec.data.mask;
        var policy_binding  = rec.data.policy_binding;

        var net_prefix  = policy_binding +":network:"+ net;
        var mask_prefix = net_prefix +":masklen:"+ mask;

        params[mask_prefix]                 = "";
        params[mask_prefix +":filtertype"]  = "normal";
        params[mask_prefix +":normal"]      = "";
        params[mask_prefix +":exact"]       = "";
        params[mask_prefix +":refines"]     = "";
        params[mask_prefix +":range"]       = "";
        params[mask_prefix +":between"]     = "";
        params[mask_prefix +":and"]         = "";

        params[mask_prefix +":restrict"]    = "";
        params[mask_prefix +":localpref"]   = "";
        params[mask_prefix +":preference"]  = "";
        params[mask_prefix +":precedence"]  = "";

        st.remove(rec);
        //check if any other routes use this network address
        var recs = st.getRange();
        var d;
        var i;
        for(i = 0; i < recs.length; i++) {
            d = recs[i].data;
            if(d.policy_binding == policy_binding && d.route == net) {
                return;
            }
        }
        params[net_prefix]  = "";
    }

//STUB:open route
    ,getMaskLength              : function(cmpId) {
        var cmp = Ext.getCmp(cmpId);
        if(cmp) {
            if(cmp.getMaskLength) {
                return cmp.getMaskLength();
            }
            return cmp.getValue();
        }
        return "";
    }
    ,get_variable_notation_cmp  : function() {
        var notation_cmp;
        if(CP.global.formatNotation) {
            if(CP.global.formatNotation == "Length") {
                notation_cmp = {
                    xtype           : "cp4_ipv4notation"
                    ,id             : "notation_cmp"
                    //fieldlabel of route
                    //,ipLabel        : "Address"
                    ,ipId           : "route_entry"
                    ,ipName         : "route"
                    //fieldlabel of mask
                    //,notationLabel  : "Mask"
                    ,notationId     : "mask_entry"
                    ,notationName   : "mask"
                    ,fieldConfig    : {
                        allowBlank  : false
                    }
                    ,networkMode    : true
                    //figure out how to entirely overwrite the fieldLabel
                    //figure out how to set labelWidth to 125
                };
            } else if(CP.global.formatNotation && CP.global.formatNotation == "Dotted") {
                notation_cmp = {
                    xtype           : "cp4_ipv4notation"
                    ,id             : "notation_cmp"
                    //fieldlabel of route
                    //,ipLabel        : "Address"
                    ,ipId           : "route_entry"
                    ,ipName         : "route"
                    //fieldlabel of mask
                    //,notationLabel  : "Subnet Mask"
                    ,notationId     : "mask_entry"
                    ,notationName   : "mask"
                    ,fieldConfig    : {
                        allowBlank  : false
                    }
                    ,networkMode    : true
                    //figure out how to set labelWidth to 125
                    //figure out how to make sure the width is sufficient to support that
                };
            }
        } else {    //generic version
            notation_cmp = {
                xtype           : "cp4_ipv4notation"
                ,id             : "notation_cmp"
                ,ipId           : "route_entry"
                ,ipName         : "route"
                ,notationId     : "mask_entry"
                ,notationName   : "mask"
                ,fieldConfig    : {
                    allowBlank  : false
                }
                ,networkMode    : true
            };
        }

        return {
            xtype       : "cp4_formpanel"
            ,id         : "notation_form"
            ,items      : [ notation_cmp ]
            ,listeners  : {
                disable         : function(p, eOpts) {
                    Ext.getCmp("route_entry").validate();
                    Ext.getCmp("mask_entry").validate();
                }
                ,enable         : function(p, eOpts) { p.fireEvent("disable"); }
                ,afterrender    : function(p, eOpts) {
                    var i;
                    var r = Ext.getCmp("route_entry");
                    var m = Ext.getCmp("mask_entry");
                    var func = function() {
                        Ext.getCmp("route_entry").validate();
                        Ext.getCmp("mask_entry").validate();
                        if(Ext.getCmp("between_entry")) {   Ext.getCmp("between_entry").validate(); }
                        if(Ext.getCmp("and_entry")) {       Ext.getCmp("and_entry").validate(); }
                    }
                    for(i = 0; i < r.octets.length; i++) {
                        r.octets[i].addListener("blur", func);
                        r.octets[i].addListener("change", func);
                    }
                    if(m.getXType() == "cp4_masklength") {
                        m.addListener("blur", func);
                        m.addListener("change", func);
                    } else {
                        if(m.octets) {
                            for(i = 0; i < m.octets.length; i++) {
                                m.octets[i].addListener("blur", func);
                                m.octets[i].addListener("change", func);
                            }
                        }
                    }
                }
            }
        };
    }
    ,get_constant_notation_cmp  : function(fieldLabelValue) {
        return {
            xtype   : "cp4_formpanel"
            ,id     : "notation_form"
            ,width  : 250
            ,margin : "0 0 0 0"
            ,items  : [
                {
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : fieldLabelValue
                    ,id         : "route_mask_entry"
                    ,name       : "route_mask"
                    ,labelWidth : 100
                    ,width      : 250
                    ,height     : 22
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "route_entry"
                    ,id         : "route_entry"
                    ,name       : "route"
                    ,labelWidth : 100
                    ,width      : 250
                    ,height     : 22
                    ,hidden     : true
                    ,hideLabel  : true
                },{
                    xtype       : "cp4_displayfield"
                    ,fieldLabel : "mask_entry"
                    ,id         : "mask_entry"
                    ,name       : "mask"
                    ,labelWidth : 100
                    ,width      : 250
                    ,height     : 22
                    ,hidden     : true
                    ,hideLabel  : true
                }
            ]
        }
    }

    ,open_route_window          : function(TITLE) {
        var n_cmp = Ext.getCmp("notation_form");
        if(n_cmp) { n_cmp.destroy(); }
        var r_cmp = Ext.getCmp("route_entry");
        var m_cmp = Ext.getCmp("mask_entry");
        if(r_cmp) { r_cmp.destroy(); }
        if(m_cmp) { m_cmp.destroy(); }

        var policy_selector_cmp;
        var notationCmp;

        if(TITLE == "add") {
            TITLE = "Add Route";
            policy_selector_cmp = {
                xtype           : "cp4_combobox"
                ,fieldLabel     : "Policy"
                ,id             : "policy_binding_entry"
                ,name           : "policy_binding_entry_name"
                ,labelWidth     : 100
                ,width          : 430
                ,style          : "margin-top:15px;margin-left:15px;margin-right:15px;"
                ,allowBlank     : false
                ,queryMode      : "local"
                ,triggerAction  : "all"
                ,store          : Ext.getStore("policy_store")
                ,valueField     : "policy_binding"
                ,displayField   : "proto_mask"
                ,listeners      : {
                    afterrender     : function(f, eOpts) {
                        f.validate();
                    }
                    ,select         : function(f, recs, eOpts) {
                        var proto       = recs[0].data.proto;
                        Ext.getCmp("proto_entry").setValue(proto);
                        show_hide_rank_weight_preference();
                    }
                }
            };
            notationCmp = CP.import_4.get_variable_notation_cmp();
        } else {
            policy_selector_cmp = {
                xtype   : "cp4_formpanel"
                ,width  : 460
                ,margin : "15 15 0 15"
                ,items  : [
                    {
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Policy"
                        ,id             : "protocol_mask"
                        ,name           : "proto_mask"
                        ,labelWidth     : 100
                        ,width          : 530
                        ,height         : 22
                    },{
                        xtype           : "cp4_displayfield"
                        ,fieldLabel     : "Protocol"
                        ,id             : "policy_binding_entry"
                        ,name           : "policy_binding"
                        ,labelWidth     : 100
                        ,width          : 530
                        ,height         : 22
                        ,hidden         : true
                        ,hideLabel      : true
                    }
                ]
            };
            notationCmp = CP.import_4.get_constant_notation_cmp("Route");
        }

        var network_set = {
            xtype   : "cp4_formpanel"
            ,id     : "network_set"
            ,width  : 430
            ,margin : "0 0 0 15"
            ,padding: 0
            ,items  : [
                notationCmp
                ,{
                    xtype           : "cp4_combobox"
                    ,fieldLabel     : "Match Type"
                    ,id             : "filtertype_entry"
                    ,name           : "filtertype"
                    ,labelWidth     : 100
                    ,width          : 200
                    ,queryMode      : "local"
                    ,editable       : false
                    ,triggerAction  : "all"
                    ,value          : "normal"
                    ,store          :   [["normal"  ,"Normal"]
                                        ,["exact"   ,"Exact"]
                                        ,["refines" ,"Refines"]
                                        ,["range"   ,"Range"]]
                    ,listeners      : {
                        afterrender     : function(f, eOpts) { f.validate(); }
                        ,select         : function() {
                            var value = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
                            Ext.getCmp("range_set").setVisible( value == "range" );
                            Ext.getCmp("range_set").setDisabled( value != "range" );
                            Ext.getCmp("between_entry").validate();
                            Ext.getCmp("and_entry").validate();
                        }
                    }
                },{
                    xtype           : "cp4_formpanel"
                    ,id             : "range_set"
                    ,width          : 430
                    ,margin         : 0
                    ,padding        : 0
                    ,layout         : "column"
                    ,listeners      : {
                        show            : function(p, eOpts) {
                            Ext.getCmp("between_entry").validate();
                            Ext.getCmp("and_entry").validate();
                        }
                    }
                    ,items          : [
                        { //between
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "From Mask Length"
                            ,id             : "between_entry"
                            ,name           : "between"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,style          : "margin-right:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                                ,change         : function(num, newVal, oldVal, eOpts) {
                                    Ext.getCmp("and_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var b       = Ext.getCmp("between_entry");
                                var b_value = b.getRawValue();
                                var m       = CP.import_4.getMaskLength("mask_entry");
                                var a       = Ext.getCmp("and_entry").getRawValue();
                                if(a == "") { a = 32; }

                                b.setMinValue(Math.max(0, m));
                                CP.ar_util.setMaxValueLength("between_entry", Math.min(32, a) );
                                if(Math.max(0, m) <= b_value && b_value <= Math.min(32, a)) {
                                    return true;
                                }
                                return "";
                            }
                        },{//and
                            xtype           : "cp4_numberfield"
                            ,fieldLabel     : "To Mask Length"
                            ,id             : "and_entry"
                            ,name           : "and"
                            ,labelWidth     : 100
                            ,width          : 200
                            ,style          : "margin-left:15px;"
                            ,allowDecimals  : false
                            ,allowBlank     : false
                            ,minValue       : 0
                            ,maxValue       : 32
                            ,maxLength      : 2
                            ,enforceMaxLength   : true
                            ,listeners      : {
                                validitychange  : function(num, isValid, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                                ,change         : function(num, newVal, oldVal, eOpts) {
                                    Ext.getCmp("between_entry").validate();
                                }
                            }
                            ,validator      : function() {
                                var a       = Ext.getCmp("and_entry");
                                var a_value = a.getRawValue();
                                var m       = CP.import_4.getMaskLength("mask_entry");
                                var b       = Ext.getCmp("between_entry").getRawValue();
                                b = Math.max(b, m, 0);

                                a.setMinValue(b);
                                if( b <= a_value && a_value <= 32) {
                                    return true;
                                }
                                return "";
                            }
                        }
                    ]
                }
            ]
        };

        function show_hide_rank_weight_preference() {
            var proto       = Ext.getCmp("proto_entry").getValue();
            var restrict    = (Ext.getCmp("restrict_entry").getValue() == "t" || proto == "");
            var bgp_proto   = !(proto == "rip" || proto == "ospf2ase");
            var rank_cmp    = Ext.getCmp("rank_entry");
            var bgp_cmp     = Ext.getCmp("bgp_weight_set");
            if(rank_cmp) {
                rank_cmp.setDisabled(   bgp_proto || restrict);
                rank_cmp.setVisible(    (!bgp_proto) && (!restrict));
            }
            if(bgp_cmp) {
                bgp_cmp.setDisabled(    (!bgp_proto) || restrict);
                bgp_cmp.setVisible(     bgp_proto && (!restrict));
            }
        }

        function route_afterrender(p, eOpts) {
            p.form._boundItems = null;
            CP.ar_util.clearParams();

            if(Ext.getCmp("policy_binding_entry").getXType() == "cp4_displayfield") {
                var rec = Ext.getCmp("route_grid").getSelectionModel().getLastSelected();
                p.loadRecord(rec);
                show_hide_rank_weight_preference();

            } else {
                var rank_cmp    = Ext.getCmp("rank_entry");
                var bgp_cmp     = Ext.getCmp("bgp_weight_set");
                if(rank_cmp) {
                    rank_cmp.setDisabled(   true);
                    rank_cmp.setVisible(    false);
                }
                if(bgp_cmp) {
                    bgp_cmp.setDisabled(    true);
                    bgp_cmp.setVisible(     false);
                }
            }
            Ext.getCmp("filtertype_entry").fireEvent("select");
            if (p.chkBtns) { p.chkBtns(); }
        }

        var route_form = {
            xtype       : "cp4_formpanel"
            ,id         : "route_form"
            ,width      : 460
            ,height     : 244
            ,autoScroll : false
            ,listeners  : {
                afterrender : route_afterrender
            }
            ,chkBtns    : function() {
                CP.ar_util.checkDisabledBtn("route_save_btn");
                CP.ar_util.checkDisabledBtn("route_cancel_btn");
            }
            ,buttons    : [
                {
                    xtype               : "cp4_button"
                    ,text               : "Save"
                    ,id                 : "route_save_btn"
                    ,disabled           : true
                    ,formBind           : true
                    ,overrideNoToken    : false
                    ,handler2           : function(b,e) {
                        save_route(b,e);
                    }
                    ,disabledConditions : function() {
                        var f = Ext.getCmp("route_form");
                        return !(f ? f.getForm().isValid() : false);
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            Ext.getCmp("route_cancel_btn").fireEvent("mouseover");
                        }
                    }
                },{
                    xtype               : "cp4_button"
                    ,text               : "Cancel"
                    ,id                 : "route_cancel_btn"
                    ,overrideNoToken    : false
                    ,handler2           : function(b, e) {
                        CP.ar_util.checkWindowClose("route_window");
                    }
                    ,listeners  : {
                        mouseover   : function(b, e, eOpts) {
                            if(Ext.getCmp("policy_binding_entry").validate) {
                                Ext.getCmp("policy_binding_entry").validate();
                            }
                            if(Ext.getCmp("route_entry").validate) {
                                Ext.getCmp("route_entry").validate();
                            }
                            if(Ext.getCmp("mask_entry").validate) {
                                Ext.getCmp("mask_entry").validate();
                            }
                        }
                    }
                }
            ]
            ,items      : [
                policy_selector_cmp
                ,network_set
                ,{
                    xtype   : "cp4_formpanel"
                    ,layout : "column"
                    ,items  : [
                        {
                            xtype               : "cp4_combobox"
                            ,fieldLabel         : "Action"
                            ,id                 : "restrict_entry"
                            ,name               : "restrict"
                            ,labelWidth         : 100
                            ,width              : 200
                            ,style              : "margin-left:15px;"
                            ,queryMode          : "local"
                            ,editable           : false
                            ,triggerAction      : "all"
                            ,value              : ""
                            ,store              :   [[""    ,"Accept"]
                                                    ,["t"   ,"Restrict"]]
                            ,listeners          : {
                                select  : function() {
                                    show_hide_rank_weight_preference();
                                }
                            }
                        },{
                            xtype               : "cp4_displayfield"
                            ,fieldLabel         : "proto_entry"
                            ,id                 : "proto_entry"
                            ,name               : "proto"
                            ,labelWidth         : 100
                            ,width              : 200
                            ,height             : 22
                            ,style              : "margin-left:30px;"
                            ,hidden             : true
                            ,hideLabel          : true
                        }
                    ]
                },{
                    xtype               : "cp4_numberfield"
                    ,fieldLabel         : "Rank"
                    ,id                 : "rank_entry"
                    ,name               : "rank"
                    ,labelWidth         : 100
                    ,width              : 200
                    ,style              : "margin-left:15px;"
                    ,allowBlank         : true
                    ,allowDecimals      : false
                    ,minValue           : 0
                    ,maxValue           : 255
                    ,maxLength          : 3
                    ,enforceMaxLength   : true
                },{
                    xtype       : "cp4_formpanel"
                    ,id         : "bgp_weight_set"
                    ,width      : 430
                    ,margin     : "0 0 0 15"
                    ,layout     : "column"
                    ,items      : [
                        {
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Weight"
                            ,id                 : "preference_entry"
                            ,name               : "preference"
                            ,labelWidth         : 100
                            ,width              : 200
                            ,style              : "margin-right:15px;"
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 0
                            ,maxValue           : 65535
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                        },{
                            xtype               : "cp4_numberfield"
                            ,fieldLabel         : "Local Pref"
                            ,id                 : "localpref_entry"
                            ,name               : "localpref"
                            ,labelWidth         : 100
                            ,width              : 200
                            ,style              : "margin-left:15px;"
                            ,allowBlank         : true
                            ,allowDecimals      : false
                            ,minValue           : 0
                            ,maxValue           : 65535
                            ,maxLength          : 5
                            ,enforceMaxLength   : true
                        }
                    ]
                }
            ]
        };

        var route_window = Ext.create("CP.WebUI4.ModalWin", {
            id          : "route_window"
            ,title      : TITLE
            ,shadow     : false
            ,closeAction: "destroy"
            ,listeners  : {
                show            : function(win, eOpts) {
                    win.setPosition(225,100);
                }
            }
            ,items      : [ route_form ]
        });
        route_window.show();

        function save_route() {
            var params      = CP.ar_util.clearParams();

            var proto       = Ext.getCmp("proto_entry").getValue();
            var net         = Ext.getCmp("route_entry").getValue();
            var mask        = CP.import_4.getMaskLength("mask_entry");
            if(Ext.getCmp("route_entry").getMaskLength) { //if true, ipv4notation
                var net_ml = Ext.getCmp("route_entry").getMaskLength();
                if(net_ml > mask) {
                    Ext.Msg.alert("Warning.","Insufficient mask.");
                    return;
                }
            }

            var restrict    = Ext.getCmp("restrict_entry").getValue();
            var precedence  = Ext.getCmp("rank_entry").getRawValue();       //rip and ospf only
            var preference  = Ext.getCmp("preference_entry").getRawValue();
            var localpref   = Ext.getCmp("localpref_entry").getRawValue();

            var filtertype  = Ext.getCmp("filtertype_entry").getValue().toLowerCase();
            var between     = Ext.getCmp("between_entry").getRawValue();
            var and         = Ext.getCmp("and_entry").getRawValue();

            var net_prefix  = Ext.getCmp("policy_binding_entry").getValue() +":network:"+ net;
            var mask_prefix = net_prefix +":masklen:"+ mask;

            params[net_prefix]  = "t";
            params[mask_prefix] = "t";

            params[mask_prefix +":restrict"]    = restrict;
            params[mask_prefix +":localpref"]   = "";
            params[mask_prefix +":preference"]  = "";
            params[mask_prefix +":precedence"]  = "";
            if(restrict != "t") {
                if(proto == "rip" || proto == "ospf2ase") {
                    params[mask_prefix +":precedence"]  = precedence;
                } else {
                    params[mask_prefix +":localpref"]   = localpref;
                    params[mask_prefix +":preference"]  = preference;
                }
            }

            params[mask_prefix +":normal"]      = "";
            params[mask_prefix +":exact"]       = "";
            params[mask_prefix +":refines"]     = "";
            params[mask_prefix +":range"]       = "";
            params[mask_prefix +":between"]     = "";
            params[mask_prefix +":and"]         = "";
            params[mask_prefix +":filtertype"]  = filtertype;
            switch(filtertype) {
                case "exact":
                    params[mask_prefix +":exact"]   = "t";
                    break;
                case "refines":
                    params[mask_prefix +":refines"] = "t";
                    break;
                case "range":
                    params[mask_prefix +":between"] = between;
                    params[mask_prefix +":and"]     = and;
                    break;
                default:
            }
            CP.ar_util.mySubmit();
        }
    }
}

