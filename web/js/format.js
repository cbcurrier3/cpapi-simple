//searchKeys: cidr

CP.format = {
        
        page: {},
        
init: function() {
    var FormatPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
        id: 'format-panel',
        items:[{
            xtype:'cp4_sectiontitle'
            ,titleText: 'Display Format'
        },{   
            //Time ~~~
            xtype: 'cp4_fieldcontainer',
            items: [{
                xtype: 'cp4_combobox'
                ,fieldLabel: 'Time',
                labelWidth: 70,
                id: 'time'
                ,name: 'time'
                ,value: CP.global.formatTime
                ,store:[['12-hour','12-hour'],['24-hour','24-hour']],
                editable: false,
                listeners: {
                    select: CP.format.onSelect
                }
            },{
                xtype: 'cp4_displayfield',
                value: '23:45',
                id: 'time_example',
                name: 'checkbox-grp',
                fieldLabel: 'Example',
                width: 200,
                labelWidth: 50,
                margin: '0 0 0 20'
            }]
        },{
            //Date ~~~
            xtype: 'cp4_fieldcontainer',
            items: [{
                xtype:'cp4_combobox'
                ,fieldLabel:'Date',
                labelWidth: 70,
                name:'date'
                ,id:'date'
                ,value: CP.global.formatDate
                ,store:[['dd/mm/yyyy','dd/mm/yyyy'],['mm/dd/yyyy','mm/dd/yyyy'],
                ['yyyy/mm/dd','yyyy/mm/dd'],['dd-mmm-yyyy','dd-mmm-yyyy']],
                editable: false,
                listeners: {
                    select: CP.format.onSelect
                }
            },{
                xtype: 'cp4_displayfield',
                id: 'date_example',
                name: 'checkbox-grp',
                fieldLabel: 'Example',
                labelWidth: 50,
                margin: '0 0 0 20'
            }]
        } /*,{
            //Temperature ~~~
            xtype: 'cp4_fieldcontainer',
            items: [{
                xtype:'cp4_combobox'
                ,fieldLabel:'Temperature',
                labelWidth: 70,
                name:'temperature'
                ,id:'temperature'
                ,value: CP.global.formatTemperature
                ,store:[['Celsius','Celsius'],['Fahrenheit','Fahrenheit']],
                editable: false,
                listeners: {
                    select: CP.format.onSelect
                }
            },{
                xtype: 'cp4_displayfield',
                id: 'temperature_example',
                name: 'checkbox-grp',
                fieldLabel: 'Example',
                margin: '0 0 0 20',
                labelWidth: 50,
                width: 200
            } ]
            
        }*/,{
            //IPv4 address ~~~
            xtype: 'cp4_fieldcontainer',
            items: [{
                xtype: 'cp4_combobox',
                fieldLabel: 'IPv4 netmask',
                labelWidth: 70,
                id: 'ipv4_notation',
                name: 'netmask',
                hiddenId: 'netmask',
                hiddenName: 'netmask',
                value: CP.global.formatNotation,
                valueField: 'netmask',
                displayField: 'displayText',
                editable: false,
                store: Ext.create('CP.WebUI4.ArrayStore',{
                    fields: [ {name: 'netmask'}, {name: 'displayText'} ],
                    data: [['Dotted','Dotted-decimal notation'],['Length','CIDR notation']]
                }),
                listeners: {
                    select: CP.format.onSelect
                }
            },{
                xtype:'cp4_displayfield'
                ,id:'netmask_example'
                ,fieldLabel: 'Example',
                labelWidth: 50,
                name:'checkbox-grp',
                margin: '0 0 0 20'
            }]
        },{
            xtype: 'cp4_button'
            ,text: 'Apply'
            ,id: 'apply'
            ,margin: '24 0 0 0'
            ,hideLabel: true
            ,disabled: true
            ,handler: function(){
                var form = Ext.getCmp( 'format-panel' );
                CP.global.formatTime = form.getForm().findField( 'time' ).getValue();
                CP.global.formatDate = form.getForm().findField( 'date' ).getValue();
                //CP.global.formatTemperature = form.getForm().findField( 'temperature' ).getValue();
                CP.global.formatNotation = form.getForm().findField( 'ipv4_notation' ).getValue();
                CP.UI.applyHandler( CP.format.page );
            }
        }]
        ,listeners: {
            render: CP.format.doLoad
        }
    });

    CP.format.page = {
        title:"Display Format"
        ,panel: FormatPanel
		,cluster_feature_name : "display-format"
        ,submit: false
        ,discard: false
        ,submitURL:"/cgi-bin/format.tcl"
        ,afterSubmit:CP.format.afterSubmit
        ,params:{}
    };

    CP.UI.updateDataPanel( CP.format.page );
    CP.format.setExamples();
},

doLoad : function ()
{
	Ext.Ajax.request({
		url: "/cgi-bin/format.tcl",
		method: 'GET',
		scope: this,
		success: function( response ) {
			var jsonData = Ext.decode( response.responseText );
			var jData = jsonData.data;
			CP.global.formatTime = jData.time;
			CP.global.formatDate = jData.date;
			CP.global.formatTemperature = jData.temperature;
			CP.global.formatNotation = jData.netmask;
			
			Ext.getCmp("time").setValue(CP.global.formatTime);
			Ext.getCmp("date").setValue(CP.global.formatDate);
			Ext.getCmp("ipv4_notation").setValue(CP.global.formatNotation);
			
			CP.format.setExamples();
			
			CP.util.clearFormInstanceDirtyFlag( Ext.getCmp('format-panel').getForm() );
		}
	});	
},

doApply: function() {
    Ext.Msg.alert('apply', 'clicked');
},

afterSubmit:function(form, action){
    //reload the page
    CP.format.init();
},

onSelect:function(form, action){
    CP.format.setExamples();
    Ext.getCmp("apply").enable();
},

setExamples:function(){
    var example;
    var field_format;
    var myval;

    //
    // Time example
    //
    example=Ext.getCmp('time_example');
    field_format=Ext.getCmp('time');
    myval=field_format.getValue();

    if (myval == "12-hour"){
        example.setValue("11:45 PM");
    }
    else
    {
        example.setValue("23:45");
    }
    
    //
    // Date example
    //
    example=Ext.getCmp('date_example');
    field_format=Ext.getCmp('date');
    myval=field_format.getValue();

    if (myval == "dd/mm/yyyy"){
        example.setValue("30/12/2010");
    }
    else if (myval == "mm/dd/yyyy"){
        example.setValue("12/30/2010");
    }
    else if (myval == "yyyy/mm/dd"){
        example.setValue("2010/12/30");
    }
    else {
        example.setValue("30-Dec-2010");
    }

    //
    // Netmask example
    //
    example=Ext.getCmp('netmask_example');
    field_format=Ext.getCmp('ipv4_notation');
    myval=field_format.getValue();

    if (myval == "Length"){
        example.setValue("24");
    }
    else
    {
        example.setValue("255.255.255.0");
    }

    //
    // Temperature example
    //
/*    example=Ext.getCmp('temperature_example');
    field_format=Ext.getCmp('temperature');
    myval=field_format.getValue();

    if (myval == "Celsius"){
        example.setValue("37 Degrees Celsius");
    }
    else
    {
        example.setValue("98.6 Degrees Fahrenheit");
    }*/
}

}
