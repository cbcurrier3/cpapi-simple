CP.Demo = {

init:function() {
    var demoPanel = new CP.WebUI.DataFormPanel({
        id:"demo-panel"
        ,labelWidth:125
        ,items:[{
            xtype:"cp_displayfield"
            ,fieldLabel:"Display Field"
            ,value:"A text only field, not submitted"
        },{
            xtype:"cp_textfield"
            ,allowBlank:true
            ,emptyText:"Optional field.."
            ,fieldLabel:"Field Label"
            ,id:"field-id"
            ,name:"field-name"
            ,width:150
        },{
            xtype:"cp_textfield"
            ,allowBlank:false
            ,blankText:"Custom error message on empty"
            ,emptyText:"Required value here..."
            ,fieldLabel:"Required Field"
            ,id:"req-id"
            ,name:"field-name"
            ,width:150
        },{
            xtype:"cp_textfield"
            ,allowBlank:true
            ,disabled:true
            ,fieldLabel:"Disabled Field with Value"
            ,name:"field-name"
            ,value:"150"
            ,width:150
        },{
            xtype:"cp_textarea"
            ,allowBlank:true
            ,emptyText:"Enter text here..."
            ,fieldLabel:"Some TextArea"
            ,name:"field-name"
            ,width:300
            ,height:75
        },{
            xtype:"cp_textfield"
            ,fieldLabel:"Get IPv4"
            ,vtype:"ip"
        },{
            xtype:"cp_numberfield"
            ,fieldLabel:"Port Number"
            ,allowDecimals:false
          //  ,minValue:8
          //  ,maxValue:30
	    ,vtype: "port"	
        },{
            xtype:"cp_checkbox"
            ,checked:true
            ,fieldLabel:"Check Box"
            ,name:"my-checkbox"
            ,value:100
        },{
            xtype:"cp_checkboxgroup"
            ,fieldLabel:"Check Box Group"
            ,width:300
            ,allowBlank:false
            ,blankText:"One checkbox MUST be checked"
            ,columns:2
            ,value:"One"
            ,items:[{
                fieldLabel:"One"
                ,value:"One"
                ,name:"checkbox-grp"
            },{
                fieldLabel:"Two"
                ,value:"Two"
                ,name:"checkbox-grp"
            },{
                fieldLabel:"Three"
                ,value:"Three"
                ,name:"checkbox-grp"
            },{
                fieldLabel:"Four"
                ,value:"Four"
                ,name:"checkbox-grp"
            }]
        },{
            xtype:"cp_radio"
            ,fieldLabel:"Radio Button"
            ,value:100
        },{
            xtype:"cp_radiogroup"
            ,fieldLabel:"Radio Group"
            ,value:100
            ,width:400
            ,columns:2
            ,items:[{
                fieldLabel:"One"
                ,value:"One"
                ,name:"my-radio"
            },{
                fieldLabel:"Two"
                ,value:"Two"
                ,name:"my-radio"
            },{
                fieldLabel:"Three"
                ,value:"Three"
                ,name:"my-radio"
            },{
                fieldLabel:"Four"
                ,value:"Four"
                ,name:"my-radio"
            }]
        },{
            xtype:"cp_combobox"
            ,fieldLabel:"Select List"
            ,mode:"local"
            ,value:"warn"
            ,store:[["alert","Alert"],["warn","Warning"],["notice","Notice"],
                    ["local0","Local 0"],["local1","Local 1"]]
        },{
            xtype:"cp_timefield"
            ,fieldLabel:"Time Field"
        },{
            xtype:"cp_datefield"
            ,fieldLabel:"Date Field"
        },{
            xtype:"cp_fieldset"
            ,title:"Grouped Items"
            ,width:450
            ,checkboxToggle:true
            ,animCollapse:true
            ,items:[{
                xtype:"cp_textfield"
                ,fieldLabel:"Item 1"
                ,name:"item-1"
            }, {
                xtype:"cp_textfield"
                ,fieldLabel:"Item 2"
                ,name:"item-2"
            }, {
                xtype:"cp_textfield"
                ,fieldLabel:"Item 3"
                ,name:"item-3"
            }]
        }]
    });

    CP.Demo.addTable(demoPanel);

    var obj = {
        title:"Demo Feature"
        ,panel:demoPanel
        ,submit:true
        ,submitURL:"/cgi-bin/demo.tcl"
        ,params:{}
        ,beforeSubmit:CP.Demo.beforeSubmit
        ,afterSubmit:CP.Demo.afterSubmit
        ,helpFile:"demoHelp.html"
    };
    
    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);
}
,addTable: function(obj) {

    // Data
    var intfTable = {
      interface: [{
         name:'eth0',
         type:'ethernet',
         hwAddr:'0A:3B:23:73:AB:D0',
         "binding_hwAddr":"interface:eth0:hwAddr",
         ip:'1.1.1.1',
         mask:24,
         state: true
       }, {
         name:'eth1',
         type:'ethernet',
         hwAddr:'0A:3B:23:73:AB:D0',
         "binding_hwAddr":"interface:eth1:hwAddr",
         ip:'10.2.2.2',
          mask:24,
         state:false
       },{
         name:'ser0',
         type:'serial',
         hwAddr:'0A:3B:23:73:AB:D0',
         "binding_hwAddr":"interface:ser0:hwAddr",
         ip:'5.5.5.5',
         mask:28,
         state:false
       }
    ]};

    var store = new Ext.data.JsonStore({
        storeId: 'interfaces',
        autoSave: false,
        //writer: writer,
        //proxy: proxy,
        root: 'interface',
        //idProperty: 'name',
        fields: [
            {name: 'name'},
            {name: 'type'},
            {name: 'ip'},
            {name: 'mask'},
            {name: 'hwAddr'},
            {name: "binding_hwAddr"},
            {name: 'state',type:"bool"}
        ]
    });

    store.loadData(intfTable);

    // Column Model
    var cm = new Ext.grid.ColumnModel({
        columns: [
            new Ext.grid.RowNumberer({header: 'No.'}),
            {id:'name',header:'Interface',dataIndex:'name'},
            {header: 'Type', dataIndex: 'type'},
            {header: 'Hardware Address', dataIndex: 'hwAddr', width: 160, editable:true, editor: new Ext.form.TextField({})},
            {header: 'IPAddress/Mask', width:150, dataIndex:"ip", editable: false},
            {header:"State", dataIndex:"state"}
        ],
        defaults: {
            sortable: true,
            align: 'center'
        }
    });

    //Paging Toolbar
    var pgBar = new Ext.PagingToolbar({
        pageSize:25
        ,store:store
        ,displayInfo:true
    });

    var gridP = new Ext.grid.EditorGridPanel({
        title: "Interfaces"
        ,id: "intf-table"
        ,height: 150
        ,width: 520
        ,stripeRows: true
        ,loadMask: true
        ,store: store
        ,cm: cm
        ,viewConfig: {
            forceFit: true
        }
        ,bbar:pgBar
    });

    obj.add(gridP);
}

,beforeSubmit:function(panel){
    var myObj = CP.UI.getMyObj();
    var grid = Ext.getCmp("intf-table");
    myObj.params = {};
    CP.util.copyStoreToForm(myObj.params, grid);
}

,afterSubmit:function(form, action){
}
}
