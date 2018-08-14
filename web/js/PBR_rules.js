/* Configures the PBR Priorities that use the Routing Tables */
CP.PBR_rules = {
    INSTANCE                        : "default"

//constants
    ,GRID_STYLE                     : "margin:0px 0px 0px 0px;"

    ,RULE_GRID_AUTOHEIGHT           : true
    ,RULE_GRID_HEIGHT               : "auto"
    ,RULE_GRID_WIDTH                : "auto"

    ,RULE_FORM_HEIGHT               : "auto"
    ,RULE_FORM_WIDTH                : 400
    ,RULE_FORM_AUTOHEIGHT           : true
    ,RULE_FORM_LABELWIDTH           : 150

    ,PRIORITY_MINIMUM               : 0
    ,PRIORITY_MAXIMUM               : 4294967295

//init function
    ,init                           : function() {
        var pbrMainPanel = new CP.WebUI.DataFormPanel({
            id          : "pbrMainPanel"
            ,listeners  : {
                destroy     : function(p) {
                    CP.PBR_rules = {};
                }
            }
            ,defaults   : {
                submitValue     : false
            }
        });

        CP.PBR_rules.defineStores();
        CP.PBR_rules.PBR_Rules_Table(pbrMainPanel);

        var obj = {
            title           : "Policy Rules"
            ,panel          : pbrMainPanel
            ,submit         : true
            ,submitURL      : "/cgi-bin/PBR_routerule.tcl?instance=" + CP.PBR_rules.INSTANCE
            ,params         : {}
            ,afterSubmit    : CP.PBR_rules.afterSubmit
            ,relatedLinks   : [{ }]
        };
        CP.UI.updateDataPanel(obj);
    }

    ,defineStores                   : function() {
        //interfaces
        var interface_st = new Ext.data.JsonStore({
            storeId     : "interface_st"
            ,autoSave   : false
            ,autoLoad   : true
            ,url        : "/cgi-bin/intf-list.tcl?instance=" + CP.PBR_rules.INSTANCE
            ,root       : "data.intfs"
            ,fields     : [
                {
                    name        : "intf"
                    ,sortType   : function(v) {
                        if(v == "lo") {
                            return 0x7fffffff; //largest int?
                        }
                    }
                }
                //,{name  : "addr"}   //to compare against various gateways
                //,{name  : "addr4_list"}
            ]
            ,sortInfo   : {
                field       : "intf"
                ,direction  : "ASC"
            }
        });

        //policy tables
        var routetable_st = new Ext.data.JsonStore({
            storeId     : "routetable_st"
            ,autoSave   : false
            ,autoLoad   : true
            ,url        : "/cgi-bin/PBR_routetable.tcl?instance=" + CP.PBR_rules.INSTANCE
            ,root       : "data.tables"
            ,fields     : [
                {
                    name        : "id"
                    ,sortType   : function(v) {
                        if(v == 0) {
                            return 0;
                        }
                        if(v > CP.PBR_rules.PBR_TABLE_MAX_DYNAMIC_ID) {
                            return parseInt(v);
                        }
                        return parseInt(v) + 300;
                    }
                }
                ,{name  : "table_name"}
                ,{name  : "inuse"}
            ]
            ,sortInfo   : {
                field       : "id"
                ,direction  : "ASC"
            }
        });

        //policy rules
        var routerule_st = new Ext.data.JsonStore({
            storeId     : "routerule_st"
            ,autoSave   : false
            ,autoLoad   : true
            ,url        : "/cgi-bin/PBR_routerule.tcl?instance=" + CP.PBR_rules.INSTANCE
            ,root       : "data.rules"
            ,fields     : [
                {name   : "priority"    ,type   : "int"}
                ,{name  : "not"}
                ,{name  : "from"}           ,{name  : "fromML"}
                ,{name  : "fromDuplicate"}
                ,{name  : "to"}             ,{name  : "toML"}
                ,{name  : "toDuplicate"}
                ,{name  : "tos"}
                ,{name  : "fwmark"}
                ,{name  : "dev"}
                ,{name  : "table"}
                ,{name  : "prohibit"}
                ,{name  : "reject"}
                ,{name  : "unreachable"}
            ]
            ,sortInfo   : {
                field       : "priority"
                ,direction  : "ASC"
            }
            ,listeners  : {
                load        : function(st, recs, options) {
                    for(var i = 0; i < recs.length; i++) {
                        recs[i].data.fromDuplicate  = recs[i].data.from;
                        recs[i].data.toDuplicate    = recs[i].data.to;
                    }
                }
            }
        });
    }

//common functions
    ,clearParams                : function() {
        //clear params and return reference
        var myObj = CP.UI.getMyObj();
        if(myObj) {
            myObj.params = {};
            return (myObj.params);
        }
        return false;
    }

    ,mySubmit                       : function() {
        CP.UI.applyHandler( CP.UI.getMyObj() );
    }

    ,afterSubmit                    : function() {
        //TODO
        Ext.getCmp("rule_grid").getSelectionModel().clearSelections();
        Ext.StoreMgr.lookup("routerule_st").reload();
        Ext.StoreMgr.lookup("routetable_st").reload();
        Ext.StoreMgr.lookup("interface_st").reload();
        
        // Refresh the monitor tab with the new data
        if (CP && CP.PBR_monitor_4 && CP.PBR_monitor_4.doLoad) {
            CP.PBR_monitor_4.doLoad();
        }                                                                                                                                                       
    }

//PBR Rules
    ,PBR_Rules_Table                : function(panel) {
        var rule_fieldset = new CP.WebUI.FieldSet({
            id          : "rule_fieldset"
            ,items      : [
                {
                    xtype       : "cp_sectiontitle"
                    ,titleText  : "Policy Rules"
                },{
                    xtype       : "cp_btnsbar"
                    ,items      : [
                        {
                            text        : "Add"
                            ,id         : "rule_btn_add"
                            ,handler    : function(b, e) {
                                rule_add();
                            }
                        },{
                            text        : "Edit"
                            ,id         : "rule_btn_edit"
                            ,disabled   : true
                            ,handler    : function(b, e) {
                                rule_edit();
                            }
                        },{
                            text        : "Delete"
                            ,id         : "rule_btn_delete"
                            ,disabled   : true
                            ,handler    : function(b, e) {
                                rule_delete();
                            }
                        }
                    ]
                }
            ]
        });

        var rule_grid_cm = getRuleGridCM();
        var rule_grid_sm = getRuleGridSM();
        var rule_grid = getRuleGrid( rule_grid_cm, rule_grid_sm );
        rule_fieldset.add(rule_grid);
        panel.add(rule_fieldset);

        //grid constructors
        function getRuleGrid( rule_grid_cm, rule_grid_sm ) {
            return new CP.WebUI.EditorGridPanel({
                id              : "rule_grid"
                ,autoScroll     : true
                ,autoHeight     : CP.PBR_rules.RULE_GRID_AUTOHEIGHT
                ,height         : CP.PBR_rules.RULE_GRID_HEIGHT
                ,width          : CP.PBR_rules.RULE_GRID_WIDTH
                ,stripeRows     : true
                ,loadMask       : true
                ,store          : Ext.StoreMgr.lookup("routerule_st")
                ,cm             : rule_grid_cm
                ,sm             : rule_grid_sm
                ,style          : CP.PBR_rules.GRID_STYLE
                ,viewConfig     : {
                    scrollOffset    : 0
                    ,forceFit       : true
                    ,emptyText      : "No Policy Rules are configured."
                }
                ,enableColumnMove: false
                ,listeners      : {
                    rowdblclick     : function(g, row, e) {
                        g.getSelectionModel().selectRow(row, false);
                        rule_edit();
                    }
                }
            });
        }//getRuleGrid

        function getRuleGridSM() {
            var sm = new Ext.grid.RowSelectionModel({
                singleSelect    : true
                ,listeners      : {
                    rowselect       : function(sm, row, rec) {
                        Ext.getCmp("rule_btn_edit").enable();
                        Ext.getCmp("rule_btn_delete").enable();
                    }
                    ,rowdeselect    : function(sm, row, rec) {
                        Ext.getCmp("rule_btn_edit").disable();
                        Ext.getCmp("rule_btn_delete").disable();
                    }
                }
            });
            return sm;
        }//getRuleGridSM

        function getRuleGridCM() {

            function qtipAndValuefunction(value) {
                return '<div qtip=\"' + value + '\">' + value + '</div>';
            }//qtipAndValuefunction

            function renderSource(value, meta, rec, row, col, st) {
                var retVal = "";
                if(rec.data.from) {
                    retVal = rec.data.from + "/" + rec.data.fromML;
                }
                return qtipAndValuefunction(retVal);
            }//renderSource

            function renderDestination(value, meta, rec, row, col, st) {
                var retVal = "";
                if(rec.data.to) {
                    retVal = rec.data.to + "/" + rec.data.toML;
                }
                return qtipAndValuefunction(retVal);
            }//renderDestination

            function renderTrueFalse(value, trueOut, falseOut) {
                if(value) {
                    return qtipAndValuefunction(trueOut);
                }
                return qtipAndValuefunction(falseOut);
            }//renderTrueFalse

            function renderTable(value, meta, rec, row, col, st) {
                var table_st = Ext.StoreMgr.lookup("routetable_st");
                var index = table_st.findExact("id",value);
                if(index > -1) {
                    var rec = table_st.getAt(index);
                    return qtipAndValuefunction(
                        rec.data.table_name + " (" + value + ")"
                    );
                }
                return qtipAndValuefunction(value);
            }

            function defaultRuleRenderer(value, meta, rec, row, col, st) {
                return qtipAndValuefunction(value);
            }//defaultRuleRenderer

            var cm = new Ext.grid.ColumnModel({
                defaults    : {
                    submitValue     : false
                }
                ,columns    : [
                    {
                        header          : "Priority"
                        ,tooltip        : "Priority"
                        ,dataIndex      : "priority"
                        ,id             : "priority_rc"
                        ,width          : 100
                        ,align          : "left"
                        ,hideable       : false
                        ,renderer       : defaultRuleRenderer
                    },{
                        header          : "Not"
                        ,tooltip        : "Not"
                        ,dataIndex      : "not"
                        ,id             : "not_rec"
                        ,width          : 60
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st) {
                            return renderTrueFalse(value, "Not", "");
                        }
                    },{
                        header          : "Source"
                        ,tooltip        : "Source"
                        ,dataIndex      : "from"
                        ,id             : "from_rc"
                        ,width          : 80
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : renderSource
                    },{
                        header          : "Destination"
                        ,tooltip        : "Destination"
                        ,dataIndex      : "to"
                        ,id             : "to_rc"
                        ,width          : 80
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : renderDestination
                    },{
                        header          : "Type of Service"
                        ,tooltip        : "Type of Service"
                        ,dataIndex      : "tos"
                        ,id             : "tos_rc"
                        ,width          : 100
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : defaultRuleRenderer
                    },{
                        header          : "Firewall Mark"
                        ,tooltip        : "Firewall Mark"
                        ,dataIndex      : "fwmark"
                        ,id             : "fwmark_rc"
                        ,width          : 90
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : defaultRuleRenderer
                    },{
                        header          : "Interface"
                        ,tooltip        : "Interface"
                        ,dataIndex      : "dev"
                        ,id             : "dev_rc"
                        ,width          : 75
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : defaultRuleRenderer
                    },{
                        header          : "Table"
                        ,tooltip        : "Table"
                        ,dataIndex      : "table"
                        ,id             : "table_rc"
                        ,width          : 80
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : renderTable
                    },{
                        header          : "Prohibit"
                        ,tooltip        : "Prohibit"
                        ,dataIndex      : "prohibit"
                        ,id             : "prohibit_rc"
                        ,width          : 75
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st) {
                            return renderTrueFalse(value, "Prohibit", "");
                        }
                    },{
                        header          : "Reject"
                        ,tooltip        : "Reject"
                        ,dataIndex      : "reject"
                        ,id             : "reject_rc"
                        ,width          : 75
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st) {
                            return renderTrueFalse(value, "Reject", "");
                        }
                    },{
                        header          : "Unreachable"
                        ,tooltip        : "Unreachable"
                        ,dataIndex      : "unreachable"
                        ,id             : "unreachable_rc"
                        ,width          : 85
                        ,align          : "center"
                        ,menuDisabled   : true
                        ,renderer       : function(value, meta, rec, row, col, st) {
                            return renderTrueFalse(value, "Unreachable", "");
                        }
                    }
                ]
            });
            return cm;

        }//getRuleGridCM

        //functions
        function rule_add() {
            Ext.getCmp("rule_grid").getSelectionModel().clearSelections();
            CP.PBR_rules.RULE_MODAL_WINDOW();
        }//rule_add

        function rule_edit() {
            CP.PBR_rules.RULE_MODAL_WINDOW();
        }//rule_edit

        function rule_delete() {
            var prefix = "routed:instance:" + CP.PBR_rules.INSTANCE + ":pbrrules:priority";
            var rec = Ext.getCmp("rule_grid").getSelectionModel().getSelected();
            var params = CP.PBR_rules.clearParams();
            if(!rec) {
                Ext.Msg.alert("Warning","No Policy Rule selected.");
                return;
            }
            params[ prefix + ":" + rec.data.priority ] = "";
            CP.PBR_rules.mySubmit();
        }//rule_delete
    }//PBR_Rule_Table

    ,RULE_MODAL_WINDOW                      : function() {
        if( !( Ext.getCmp("rule_modal_window") ) ) {
            var rule_modal_form = new CP.WebUI.FormPanel({
                id              : "rule_modal_form"
                ,padding        : 15
                ,height         : CP.PBR_rules.RULE_FORM_HEIGHT
                ,width          : CP.PBR_rules.RULE_FORM_WIDTH
                ,autoHeight     : CP.PBR_rules.RULE_FORM_AUTOHEIGHT
                ,autoScroll     : true
                ,draggable      : false
                ,labelWidth     : CP.PBR_rules.RULE_FORM_LABELWIDTH
                ,monitorValid   : true
                ,defaults       : {
                    submitValue     : false
                }
                ,listeners      : {
                    clientvalidation    : rmf_clientvalidation
                    ,afterrender        : rmf_afterrender
                }
                ,fbar           : {
                    xtype   : "toolbar"
                    ,items  : [
                        {
                            xtype       : "cp_button"
                            ,text       : "Save"
                            ,id         : "rmf_save_btn"
                            ,disabled   : true
                            ,handler    : rmf_save
                        },{
                            xtype       : "cp_button"
                            ,text       : "Cancel"
                            ,id         : "rmf_cancel_btn"
                            ,handler    : rmf_cancel
                        }
                    ]
                }
                ,items          : [
                    {
                        xtype           : "cp_numberfield"
                        ,fieldLabel     : "Priority"
                        ,name           : "priority"
                        ,id             : "priority_entry"
                        ,allowBlank     : false
                        ,allowNegative  : false
                        ,allowDecimals  : false
                        ,width          : 100
                        ,minValue       : CP.PBR_rules.PRIORITY_MINIMUM
                        ,maxValue       : CP.PBR_rules.PRIORITY_MAXIMUM
                        ,autoCreate     : {
                            tag             : "input"
                            ,type           : "text"
                            ,autocomplete   : "off"
                            ,maxlength      : "10"
                        }
                        ,validator      : function(value) {
                            var rule_st = Ext.StoreMgr.lookup("routerule_st");
                            var p_e = Ext.getCmp("priority_entry");

                            if(p_e.disabled) {
                                return true;
                            }

                            if(value < p_e.initialConfig.minValue
                              || value > p_e.initialConfig.maxValue ) {
                                return "Minimum value is "
                                    + p_e.initialConfig.minValue
                                    + ", maximum value is "
                                    + p_e.initialConfig.maxValue + ".";
                            }

                            var recs = rule_st.getRange();
                            for(var i = 0; i < recs.length; i++) {
                                if(recs[i].data.priority == value) {
                                    return "This field must be unique.";
                                }
                            }
                            return true;
                        }
                    },{
                        xtype           : "cp_displayfield"
                        ,fieldLabel     : "Priority"
                        ,id             : "priority_display"
                    },{
                        xtype           : "cp_checkbox"
                        ,fieldLabel     : 
                            '<div qtip=\"'
                            + 'This inverter applies to a number of fields.'
                            + '\">'
                            + 'Not:'
                            + '</div>'
                        ,name           : "not"
                        ,id             : "not_entry"
                        ,labelSeparator : ""
                    },{
                        xtype           : "cp_numberfield"
                        ,fieldLabel     :
                            '<div qtip=\"'
                            + 'Please know exactly the value to place here.'
                            + '\">'
                            + 'Type of Service:'
                            + '</div>'
                        ,labelSeparator : ""
                        ,name           : "tos"
                        ,id             : "tos_entry"
                        ,emptyText      : "Please know exactly the value to place here."
                        ,allowNegative  : false
                        ,allowDecimals  : false
                        ,minValue       : 0
                        ,maxValue       : 255
                        ,autoCreate     : {
                            tag             : "input"
                            ,type           : "number"
                            ,autoComplete   : "off"
                            ,maxlength      : "3"
                        }
                    },{
                        xtype           : "cp_numberfield"
                        ,fieldLabel     :
                            '<div qtip=\"'
                            + 'Please know exactly the value to place here.'
                            + '\">'
                            + 'Firewall Mark:'
                            + '</div>'
                        ,labelSeparator : ""
                        ,name           : "fwmark"
                        ,id             : "fwmark_entry"
                        ,emptyText      : "Please know exactly the value to place here."
                        ,allowNegative  : false
                        ,allowDecimals  : false
                        ,minValue       : 0
                        ,maxValue       : 255
                        ,autoCreate     : {
                            tag             : "input"
                            ,type           : "number"
                            ,autoComplete   : "off"
                            ,maxlength      : "3"
                        }
                    },{
                        xtype           : "cp_combobox"
                        ,fieldLabel     : "Interface"
                        ,id             : "dev_entry"
                        ,name           : "dev"
                        ,width          : 150
                        ,lazyRender     : true
                        ,store          : Ext.StoreMgr.lookup("interface_st")
                        ,displayField   : "intf"
                        ,valueField     : "intf"
                        ,triggerAction  : "all"
                        ,mode           : "local"
                        ,editable       : false
                        ,selectOnFocus  : true
                        ,emptyText      : "Select One"
                        ,allowBlank     : false
                    },{
                        xtype           : "cp_combobox"
                        ,fieldLabel     : "Table ID"
                        ,id             : "table_entry"
                        ,name           : "table"
                        ,width          : 150
                        ,lazyRender     : true
                        ,store          : Ext.StoreMgr.lookup("routetable_st")
                        ,displayField   : "table_name"
                        ,valueField     : "id"
                        ,triggerAction  : "all"
                        ,mode           : "local"
                        ,editable       : false
                        ,selectOnFocus  : true
                        ,emptyText      : "Select One"
                        ,allowBlank     : false
                    },{
                        xtype           : "cp_checkbox"
                        ,fieldLabel     : "Prohibit"
                        ,name           : "prohibit"
                        ,id             : "prohibit_entry"
                    },{
                        xtype           : "cp_checkbox"
                        ,fieldLabel     : "Reject"
                        ,name           : "reject"
                        ,id             : "reject_entry"
                    },{
                        xtype           : "cp_checkbox"
                        ,fieldLabel     : "Unreachable"
                        ,name           : "unreachable"
                        ,id             : "unreachable_entry"
                    },{
                        xtype           : "cp_sectiontitle"
                        ,titleText      : "Source"
                    },{
                        xtype           : "cp_ipv4notation"
                        ,width          : 360
                        ,fieldConfig    : {
                            id              : "from_entry"
                            ,name           : "from"
                            ,label          : "Source Prefix"
                            ,ipNotationId   : "fromML_entry"
                            ,ipNotationName : "fromML"
                            ,allowBlank     : true
                        }
                    },{
                        xtype           : "cp_sectiontitle"
                        ,titleText      : "Destination"
                    },{
                        xtype           : "cp_ipv4notation"
                        ,width          : 360
                        ,fieldConfig    : {
                            id              : "to_entry"
                            ,name           : "to"
                            ,label          : "Destination Prefix"
                            ,ipNotationId   : "toML_entry"
                            ,ipNotationName : "toML"
                            ,allowBlank     : true
                        }
                    },{
                        xtype           : "cp_displayfield"
                        ,fieldLabel     : "Old Source Prefix"
                        ,id             : "fromDuplicate_display"
                        ,name           : "fromDuplicate"
                        ,allowBlank     : true
                        ,hidden         : true
                        ,hideLabel      : true
                    },{
                        xtype           : "cp_displayfield"
                        ,fieldLabel     : "Old Destination Prefix"
                        ,id             : "toDuplicate_display"
                        ,name           : "toDuplicate"
                        ,allowBlank     : true
                        ,hidden         : true
                        ,hideLabel      : true
                    }
                ]
            });

            var rule_modal_window = new CP.WebUI.ModalWin({
                id              : "rule_modal_window"
                ,title          : "Add Policy Rule"
                ,width          : "auto"
                ,height         : "auto"
                ,autoHeight     : true
                ,shadow         : false
                ,closeAction    : "close"
                ,onEsc          : function() { this.close(); }
                ,listeners      : {
                    show            : function(win) {
                        win.setHeight("auto");
                        win.setWidth("auto");
                        win.setPosition(225,100);
                    }
                    ,beforeshow     : function(win) {
                        var rule_grid_sm = Ext.getCmp("rule_grid").getSelectionModel();
                        if( rule_grid_sm.hasSelection() ) {
                            //edit
                            var rec = rule_grid_sm.getSelected();
                            win.setTitle("Edit Policty Rule " + rec.data.priority);
                        }
                    }
                }
                ,items          : [ rule_modal_form ]
            });
        }
        Ext.getCmp("rule_modal_window").show();

        //functions
        //afterrender
        function rmf_afterrender(panel) {
            //set "priority_display" to the priority value if it is an edit
            var rule_grid_sm = Ext.getCmp("rule_grid").getSelectionModel();
            if( rule_grid_sm.hasSelection() ) {
                //edit
                var rec = rule_grid_sm.getSelected();
                //CP.util.hide("priority_entry");
                Ext.getCmp("priority_entry").disable();
                CP.util.show("priority_display");
                Ext.getCmp("priority_display").setValue( rec.data.priority );
                Ext.getCmp("rule_modal_form").getForm().loadRecord( rec );
                
                Ext.getCmp("from_entry").setValue( rec.data.from );
                Ext.getCmp("fromML_entry").setValue( rec.data.fromML );

                Ext.getCmp("to_entry").setValue( rec.data.to );
                Ext.getCmp("toML_entry").setValue( rec.data.toML );
            } else {
                CP.util.show("priority_entry");
                Ext.getCmp("priority_entry").enable();
                CP.util.hide("priority_display");
            }
        }

        //clientvalidation
        function rmf_clientvalidation(panel, valid) {
            valid = validate_notations(valid);
            if( valid == true ) {
                Ext.getCmp("rmf_save_btn").enable();
            } else {
                Ext.getCmp("rmf_save_btn").disable();
            }

            Ext.getCmp("priority_entry").validate();
            Ext.getCmp("table_entry").validate();
            Ext.getCmp("dev_entry").validate();
        }

        function validate_notations(valid) {
            var from_v = checkIPv4Notation(
                Ext.getCmp("from_entry")
                ,Ext.getCmp("fromML_entry")
                ,Ext.getCmp("from_entryparent")
            );

            var to_v = checkIPv4Notation(
                Ext.getCmp("to_entry")
                ,Ext.getCmp("toML_entry")
                ,Ext.getCmp("to_entryparent")
            );

            return (valid && from_v && to_v);
        }

        function checkIPv4Notation( addrCmp, maskCmp, parentCmp ) {
            //used twice, once for from/fromML and to/toML
            //can only return valid or false

            //0.
            if(addrCmp.disabled) {
                parentCmp.clearInvalid();
                addrCmp.clearInvalid();
                maskCmp.clearInvalid();
                return true;
            }

            var NT = notationType( addrCmp.getValue(), maskCmp.getValue() );

            //switch
            if(NT == 0x00) {
                addrCmp.clearInvalid();
                maskCmp.clearInvalid();
                return true;
            } else if(NT == 0x12) {
                //2.  check addr/mask coverage
                if( compareToSubnetMask( addrCmp, maskCmp ) ) {
                    addrCmp.clearInvalid();
                    maskCmp.clearInvalid();
                    return true;
                } else {
                    if(maskCmp.getXType() == "cp_masklength") {
                        addrCmp.markInvalid("Address must be within the mask length.");
                    } else {
                        addrCmp.markInvalid("Address must be covered by the subnet mask.");
                    }
                    return false;
                }
            } else {
                addrCmp.markInvalid();
                maskCmp.markInvalid();
                return false;
            }

            return true;
        }

        function notationType(addr, ml) {
            //figure out what case address/masklength is in
                // address can be empty, incomplete, complete, or out of range
                // mask can be empty, filled, or out of range
            //responses:
                // mask uses low bits 0x1, 0x2, 0x0
                    //  dd00 - mask is empty                        0x00
                    //  dd01 - mask is out of range                 0x01
                    //  dd10 - mask is in range                     0x02
                // addr uses high bits 0x4, 0x8, 0x0
                    //0 00dd - address is empty                     0x00
                    //0 01dd - address is incomplete                0x04
                    //0 10dd - address has an octet out of range    0x08
                    //1 00dd - address has a valid ipv4 address     0x10
                    //(0 11dd - has an empty octet and an octet out of range)

            var mv = 0x03;
            var av = 0x00;

            //check masklength
            if(ml == "") {
                mv = 0x00;
            } else if(ml < 1 || ml > 32) {
                mv = 0x01;
            } else if(ml >= 1 && ml <= 32) {
                mv = 0x02;
            }

            //check address
            var octets = addr.split(".",4);
            var emptyCnt = 0;
            var inCnt = 0;
            var oor = 0;
            for(var i = 0; i < 4; i++) {
                if(octets[i] == "") {
                    emptyCnt++;
                } else if(octets[i] < 0 || octets[i] > 255) {
                    oor = true;
                } else {
                    inCnt++;
                }
            }

            if(oor) {
                av = 0x08;
            } else if(inCnt == 4) {
                av = 0x10;
            } else if(emptyCnt == 4 || addr == "") {
                av = 0x00;
            } else if(emptyCnt > 0 && emptyCnt < 4) {
                av = 0x04;
            }
            return (av + mv);
        }

        function compareToSubnetMask(net, masklength) {
            //check if the mask covers the netaddress
            var Mask = "";
            var Net = net.getValue().split(".",4);
            var ml = masklength.getValue();

            if(ml == "") {
                masklength.markInvalid("This field is required.");
                return false;
            } else if(ml < 1 || ml > 32) {
                marklength.markInvalid("Minimum value is 1, maximum value is 32.");
            }
            masklength.clearInvalid();
            for(var i = 0; i < 4; i++) {
                if(ml < 0) {
                    ml = 0;
                }
                switch( ml ) {
                    case 0:     Mask = "0";         break;
                    case 1:     Mask = "128";       break;
                    case 2:     Mask = "192";       break;
                    case 3:     Mask = "224";       break;
                    case 4:     Mask = "240";       break;
                    case 5:     Mask = "248";       break;
                    case 6:     Mask = "252";       break;
                    case 7:     Mask = "254";       break;
                    case 8:     Mask = "255";       break;
                    default:    Mask = "255";
                }
                if( (Mask & (Net[i])) != Net[i] ) {
                    return false;
                }
                ml -= 8;
            }

            return true;
        }

        //buttons
        function rmf_cancel(b, e) {
            Ext.getCmp("rule_grid").getSelectionModel().clearSelections();
            Ext.getCmp("rule_modal_window").close();
        }

        function handleIPv4Bindings(addrNew, addrOld, masklength, params, prefix) {
            if(addrOld != addrNew) {
                params[ prefix + ":" + addrOld ]                = "";
                params[ prefix + ":" + addrOld + ":masklen" ]   = "";
            }

            if(addrNew != "") {
                params[ prefix + ":" + addrNew ]                = "t";
                params[ prefix + ":" + addrNew + ":masklen" ]   = masklength;
            }
        }

        function rmf_save(b, e) {
            //1.  Clear
            var params = CP.PBR_rules.clearParams();

            //2.  Get prefix
            var prefix = "routed:instance:" + CP.PBR_rules.INSTANCE;
            prefix += ":pbrrules:priority:" + Ext.getCmp("priority_entry").getValue();

            //priority
            params[ prefix ]                    = "t";
            //not
            params[ prefix + ":not" ]           = (Ext.getCmp("not_entry").getValue()) ? "t" : "";
            //from
            handleIPv4Bindings(
                Ext.getCmp("from_entry").getValue()
                ,Ext.getCmp("fromDuplicate_display").getValue()
                ,Ext.getCmp("fromML_entry").getValue()
                ,params
                ,prefix + ":from"
            );
            //to
            handleIPv4Bindings(
                Ext.getCmp("to_entry").getValue()
                ,Ext.getCmp("toDuplicate_display").getValue()
                ,Ext.getCmp("toML_entry").getValue()
                ,params
                ,prefix + ":to"
            );
            //tos
            params[ prefix + ":tos" ]           = Ext.getCmp("tos_entry").getValue();
            //fwmark
            params[ prefix + ":fwmark" ]        = Ext.getCmp("fwmark_entry").getValue();
            //dev
            params[ prefix + ":dev" ]           = Ext.getCmp("dev_entry").getValue();
            //table
            params[ prefix + ":table" ]         = Ext.getCmp("table_entry").getValue();
            //prohibit
            params[ prefix + ":prohibit" ]      = (Ext.getCmp("prohibit_entry").getValue()) ? "t" : "";
            //reject
            params[ prefix + ":reject" ]        = (Ext.getCmp("reject_entry").getValue()) ? "t" : "";
            //unreachable
            params[ prefix + ":unreachable" ]   = (Ext.getCmp("unreachable_entry").getValue()) ? "t" : "";

            Ext.getCmp("rule_grid").getSelectionModel().clearSelections();
            Ext.getCmp("rule_modal_window").close();
            CP.PBR_rules.mySubmit();
        }
    }
}

