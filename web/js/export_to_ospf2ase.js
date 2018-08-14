/**
 * @author rbahadur
 */

CP.export_to_ospf2ase = {

init:function() {

    var export_to_ospf2asePanel = new CP.WebUI.DataFormPanel({
        id:"export_to_ospf2ase-panel",
        listeners: {
		    render: CP.export_to_ospf2ase.doLoad
		}
    });




    CP.export_to_ospf2ase.load_interface_global(export_to_ospf2asePanel);

    CP.export_to_ospf2ase.load_interface_table(export_to_ospf2asePanel);

    var spacer = new Ext.Spacer({width: 30, height: 50});
    export_to_ospf2asePanel.add(spacer);

    CP.export_to_ospf2ase.load_static_global(export_to_ospf2asePanel);
    CP.export_to_ospf2ase.load_static_table(export_to_ospf2asePanel);
 

    var obj = {
        title:"Redistribute Routes to OSPF External"
        ,panel:export_to_ospf2asePanel
        ,submit:true
        ,submitURL:"/cgi-bin/export_to_ospf2ase.tcl"
        ,params:{}
        ,beforeSubmit:CP.export_to_ospf2ase.beforeSubmit
        ,afterSubmit:CP.export_to_ospf2ase.afterSubmit
        ,helpFile:"export_to_ospf2aseHelp.html"
        ,relatedLinks:[{
            link:"tree/export_to_ospf2ase"
            ,info:"This link is for exporting routes to OSPF External"
        }]
    };
    
    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);
    CP.util.setSubmitOn();
}

,load_interface_global: function(panel) {

	/*
	alert("entering load_interface_global");
	*/

	var allIntfsConfig = new CP.WebUI.FieldSet({

        title: "Redistribute All Interfaces"
        ,padding: 15
        ,width: 550
	,collapsed:true
	,collapsible:true
        ,id: "interface-form"
	//	,height: 15
        ,autoHeight: true
        ,layout: 'column'
        ,defaults: {
            columnWidth: 0.5
            ,layout: 'form'
            ,border: false
            ,xtype: 'panel'
            ,bodyStyle: 'padding:0 18px 0 0'
        }
        ,items: [{

            // left column
            defaults: {anchor: '100%'}
            ,items: [{
            xtype: "cp_textfield"
            ,fieldLabel: "Metric"
            ,name: "allintfs-metric"
            ,id: "allintfs-metric"
            ,minValue:1
	    ,maxValue:16777215
	    }]
	 },
           {
            // right column
            defaults: {anchor: '100%'}
            ,items: [{
	    xtype: "cp_checkbox"
            ,checked: false
            ,fieldLabel: "Enable"
            ,name: "allintfs"
            ,id: "allintfs"
            ,value:""
	    }]

	 }]
	});

	panel.add(allIntfsConfig);
       
    }

,load_static_global: function(panel) {

	var allStaticsConfig = new CP.WebUI.FieldSet({

        title: "Redistribute All Static Routes"
        ,padding: 15
        ,width: 550
        ,id: "static-form"
	,collapsible: true
	,collapsed: true
        ,autoHeight: true
        ,layout: 'column'
        ,defaults: {
            columnWidth: 0.5
            ,layout: 'form'
            ,border: false
            ,xtype: 'panel'
            ,bodyStyle: 'padding:0 18px 0 0'
        }
        ,items: [{
            // left column
            defaults: {anchor: '100%'}
            ,items: [{
            xtype: "cp_textfield"
            ,fieldLabel: "Metric"
            ,name: "allstatics-metric"
            ,id: "allstatics-metric"
            ,minValue:1
	    ,maxValue:16777215
	    }]
	 },
           {
            // right column
            defaults: {anchor: '100%'}
            ,items: [{
	    xtype: "cp_checkbox"
            ,checked: false
            ,fieldLabel: "Enable"
            ,name: "allstatics"
            ,id: "allstatics"
            ,value:""
	    }]

	 }]
	});

	panel.add(allStaticsConfig);

}

,doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/export_to_ospf2ase.tcl?option=global',
        method: 'GET',
        sucess: function() {}
    });
}

// Main grid
//,addTable: function(obj) {
,load_interface_table: function(panel) {

    var ospf2ase_if_store = new Ext.data.JsonStore({
        storeId: 'export_to_ospf2aseifs'
        ,autoSave: false
        ,root: 'data.intfs'
        ,url: "/cgi-bin/export_to_ospf2ase.tcl?option=intf"
        ,autoLoad: true
        ,fields: [
            {name: 'intf'}
            ,{name: 'delete'}
            ,{name: 'binding_delete'}
            ,{name: 'metric'}
        ]
    });


    // Checkbox column for the grid
    var disable_box = new Ext.ux.grid.CheckColumn({
        header: "Delete", dataIndex: "delete", width: 55
        ,id: "delete"
        ,renderer: function(v, p, rec) {
            p.css += ' x-grid3-check-col-td'; 
            return String.format('<div class="x-grid3-check-col{0} {1}">&#160;</div>', v ? '-on' : '', this.createId());
        }
    });

    // Column Model
    var if_cm = new Ext.grid.ColumnModel({
        columns: [
            {header:'Interface' ,dataIndex: 'intf'
                ,id: 'intf' ,editable: true, width: 60
            }
            ,{header: 'Metric' ,width:200 ,dataIndex: "metric"
                ,id: 'metric' ,editable: true, width: 80, editable: true
            ,editor: new CP.WebUI.NumberField( { minValue: 1 ,maxValue: 16777215 })
            }
	    ,disable_box
        ]
        ,defaults: {
            sortable: true
            ,align: 'left'
            ,width: 125
        }
    });


    // Store for Logical interfaces
    var intf_store = new Ext.data.JsonStore({
         storeId: 'logicals'
         ,autoSave: false
         ,root: 'data.intfs'
         ,url: "/cgi-bin/intf-list.tcl"
         ,autoLoad: true
         ,fields: [ {name: 'intf'} ]
    });

    function logical_renderer(combo) {
        return function(value) {
            var rec = combo.findRecord(combo.valueField, value);
            return rec ? rec.get(combo.displayField) : combo.valueNotFoundText;
        }
    }

    // handler for redistributing interface to OSPF external
    function redistribute_interface_to_ospf2ase() {
        var ospf2aseif = ospf2ase_if_store.recordType;
        var r = new ospf2aseif({ });

        var logical = new CP.WebUI.ComboBox( {
            lazyRender: true
            ,store: intf_store
            ,displayField: "intf"
            ,valueField: "intf"
            ,triggerAction: "all"
            ,mode: "local"
            ,editable: false
            ,selectOnFocus: true
        }); 

        if_cm.getColumnById("intf").setEditor(logical);
        if_cm.getColumnById("intf").renderer = logical_renderer(logical);

        r.data['new'] = true;
        r.markDirty();
        gridP.stopEditing();
        ospf2ase_if_store.insert(0, r);
        gridP.startEditing(0, 0);
    }

    var gridP = new CP.WebUI.EditorGridPanel({
        title: "Redistribute Individual Interfaces"
        ,id: "export_to_ospf2ase-iftable"
        ,autoHeight: true
        ,autoScroll: true
        ,maxHeight: 120
        ,forceFit: true
        ,width: 550
        ,stripeRows: true
        ,header:false 
        ,loadMask: true
        ,store: ospf2ase_if_store
        ,cm: if_cm
        ,viewConfig: {
            forceFit: true
        }
        ,plugins: [disable_box]
        ,iconCls: "silk-grid"
        ,tbar: [{
            xtype: "tbspacer"
            ,width: 20
            }
            ,{
            xtype: "tbtext"
            }, '->',{
            text: "Redistribute Individual Interface(s)"
            ,iconCls: "silk-add"
            ,handler: redistribute_interface_to_ospf2ase
        }]
    });


    /* add interface grid */
    //    obj.add(gridP);
    panel.add(gridP);
    }

,load_static_table: function(panel) {

    /*
     * Redistribution of Static Routes 
     */

    var ospf2ase_static_store = new Ext.data.JsonStore({
        storeId: 'export_to_ospf2ase_sroutes'
        ,autoSave: false
        ,root: 'data.sroutes'
        ,url: "/cgi-bin/export_to_ospf2ase.tcl?option=sroutes"
        ,autoLoad: true
        ,fields: [
            {name: 'route'}
            ,{name: 'mask'}
            ,{name: 'metric'} ,{name: 'binding_metric'}
            ,{name: 'delete'} ,{name: 'binding_delete'}
        ]
    });


    /* display of route/mask */
    function showRoute(val, meta, record) {
        if (val != "default") {
            return val + "/" + record.data.mask;
        }
        return val;
    }

    // Checkbox column for the grid
    var disable_box = new Ext.ux.grid.CheckColumn({
        header: "Delete", dataIndex: "delete", width: 55
        ,id: "delete"
        ,renderer: function(v, p, rec) {
		//	    if (rec.data.route == "default") {
		// return "";
		//}
	    p.css += ' x-grid3-check-col-td'; 
            return String.format('<div class="x-grid3-check-col{0} {1}">&#160;</div>', v ? '-on' : '', this.createId());
        }
    });

    /* Create cm model with the necessary headers */
    var sroute_cm = new Ext.grid.ColumnModel({
	    columns: [
    {header:'Route' ,dataIndex: 'route', renderer: showRoute 
                ,id: 'route' ,editable: true
            }
            ,{header: 'Metric' ,width:200 ,dataIndex: "metric"
                ,id: 'metric' ,editable: true, width: 80, editable: true
	      ,editor: new CP.WebUI.NumberField( { minValue: 1 ,maxValue: 16777215 })
            }
    ,disable_box
        ]
        ,defaults: {
            sortable: true
            ,align: 'left'
            ,width: 125
        }
    });

    // Store for Static Routes
    var static_route_store = new Ext.data.JsonStore({
         storeId: 'static_routes'
         ,autoSave: false
         ,root: 'data.sroutes'
         ,url: "/cgi-bin/static-route.tcl"
         ,autoLoad: true
         ,fields: [ {name: 'route'} 
		    ,{name: 'mask'}
		    ,{name: 'routemask'}
	 ]
    });


    // renderer to display configured routes
    function static_route_renderer(combo) {
	return function(value) {
            var rec = combo.findRecord(combo.valueField, value)
            return rec ? rec.get(combo.displayField) : combo.valueNotFoundText;
           }
    }


    function showRoute1(val, meta, record) {
	//alert("mask is =" + record.data.mask);
        if (val != "default") {
	alert("mask is =" + record.data.mask);
            return val + "/" + record.data.mask;
        }
        return val;
    }
    // handler for redistributing interface to OSPF external
    function redistribute_static_to_ospf2ase() {

	//	alert("No 1: entered redistribute_static_to_ospf2ase");

        var ospf2asestatic = ospf2ase_static_store.recordType;
        var r = new ospf2asestatic({ });

        var static_route = new CP.WebUI.ComboBox( {
            lazyRender: true
            ,store: static_route_store
            ,displayField: "routemask" 
            ,valueField: "routemask"
	    //,valueField: "mask"
            ,triggerAction: "all"
            ,mode: "local"
            ,editable: false
            ,selectOnFocus: true
        }); 

        sroute_cm.getColumnById("route").setEditor(static_route);
	sroute_cm.getColumnById("route").renderer = static_route_renderer(static_route);

        r.data['new'] = true;
        r.markDirty();
        gridP.stopEditing();
	ospf2ase_static_store.insert(0, r);
        gridP.startEditing(0, 0);
    }

    var gridP = new CP.WebUI.EditorGridPanel({
        title: "Redistribute Static Routes"
        ,id: "export_to_ospf2ase-statictable"
        ,autoHeight: true
        ,autoScroll: true
        ,maxHeight: 120
        ,forceFit: true
        ,width: 550
        ,stripeRows: true
        ,header:false 
        ,loadMask: true
        ,store: ospf2ase_static_store
        ,cm: sroute_cm
        ,viewConfig: {
            forceFit: true
        }
        ,plugins: [disable_box]
        ,iconCls: "silk-grid"
        ,tbar: [{
            xtype: "tbspacer"
            ,width: 20
            }
            ,{
            xtype: "tbtext"
            }, '->',{
            text: "Redistribute Individual Static Route(s)"
            ,iconCls: "silk-add"
            ,handler: redistribute_static_to_ospf2ase
        }]
    });

    //    obj.add(gridP);
    panel.add(gridP);
}

,beforeSubmit:function(panel){
    var myObj = CP.UI.getMyObj();

    var grid = Ext.getCmp("export_to_ospf2ase-iftable");
    CP.export_to_ospf2ase.getChangedIfParams(myObj.params, grid);

    var grid = Ext.getCmp("export_to_ospf2ase-statictable");
    CP.export_to_ospf2ase.getChangedStaticParams(myObj.params, grid);
}

,afterSubmit:function(form, action){
    CP.export_to_ospf2ase.init();
}

// Collect the list of bindings for db set_list

,getChangedIfParams:function(params, grid) {
    var st = grid.getStore();
    var b = "binding_";
    var l = b.length;
    var myparams = params;
    var prefix = "ipsrd:instance:default:export_proto:ospf2ase:proto:direct";
 
    st.each(function(){
        var r = this;
        if (r.dirty){
            if (typeof r.data == "object") {

                r.data.binding_delete = prefix + ":interface:" + r.data.intf;
                r.data.binding_metric = prefix + ":interface:" + r.data.intf + ":metric";

                // take care of delete entries first
                if (r.data['delete']) {
                    myparams[r.data.binding_delete] = "";
                    return;
                }

                // create "if" node binding
                if (r.data['new']) {
                    if (!r.data.intf) {
                        return;
                    }
                    myparams[prefix + ":interface:" + r.data.intf] = "t";
                }

                for(var p in r.data) {
                    if (p.indexOf(b) == 0) {
                        s = p.substring(l,p.length);
                        if (s == "delete") {
                            myparams[r.data[p]] = (r.data[s])?"":"t";
                        } else {
                            myparams[r.data[p]] = r.data[s];
			}
		    }
                }
            }
        }
    });
}

// get changed list of static routes
,getChangedStaticParams:function(params, grid) {
    var st = grid.getStore();
    var b = "binding_";
    var l = b.length;
    var myparams = params;
    var prefix = "ipsrd:instance:default:export_proto:ospf2ase:proto:static";
 
    st.each(function(){
        var r = this;
        if (r.dirty){
            if (typeof r.data == "object") {

		/* if not delete then it might be new */
		if (!r.data['delete'] & r.data['new']) {
		    var route_mask = r.data.route.split("/");

		    if (route_mask[0] == "default") {
			alert("entered binding set for default route");
			r.data.binding_metric = prefix + ":default:metric";
		    } else {
			r.data.binding_metric = prefix + ":network:" + route_mask[0] + ":masklen:" + route_mask[1] + ":metric";
		    }
		}

                // take care of delete entries first
                if (r.data['delete']) {
		    if (r.data.route == "default") {
			r.data.binding_delete = prefix + ":default";
		    } else {
			r.data.binding_delete = prefix +  ":network:" + r.data.route + ":masklen:" + r.data.mask;
		    }

                    myparams[r.data.binding_delete] = "";
                    return;
                }


                // create "route" node binding
                if (r.data['new']) {
                    if (!r.data.route) {
                        return;
                    }
		    if (route_mask[0] == "default") {
			//alert ("setting my params route for default");
			myparams[prefix + ":default"] = "t";
			myparams[prefix + ":default:filtertype"] = "exact";
		    } else {
			//alert("setting my params route for " + route_mask[0]);
			myparams[prefix + ":network:" + route_mask[0] + ":masklen:" + route_mask[1]] = "t";
			myparams[prefix + ":network:" + route_mask[0] + ":masklen:" + route_mask[1] + ":filtertype"] = "exact";

		    }

		}

                for(var p in r.data) {
		    //alert("entering for var p routine");
                    if (p.indexOf(b) == 0) {
                        s = p.substring(l,p.length);
                        if (s == "delete") {
                            myparams[r.data[p]] = (r.data[s])?"":"t";
                        } else {
                            myparams[r.data[p]] = r.data[s];
			}
		    }
                }
            }
        }
    });
}

}
