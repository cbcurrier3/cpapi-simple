
CP.cdm = {

init: function() {	
    	var CdmPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"cdm-panel"
        ,items: 
	[{	
            	xtype: "cp4_sectiontitle"
	    	,titleText: "Core Dump Configuration"
	},{

		xtype		:	"cp4_checkbox"
            	,checked	:	false
            	,fieldLabel	:	""
            	,hideLabel	: 	false
            	,boxLabel	:	"Enable Core Dumps"
            	,labelWidth	:	50
            	,width		:	200
            	,name		:	"enable_checkbox"
        	,id		:	"enable_checkbox"
      		,value		:	1
		,listeners	: 	{
						change: CP.cdm.enableOrDisableInput
					}
        },{
		xtype		:	'cp4_dataformpanel'
		,layout		: 
		{
			type	: 	'hbox'
		}
		,name		:	'total_form'
		,id		:	'total_form'
		,width		:	300
		,items		: 	[{
		
					xtype		:	"cp4_positiveint"
					,width		: 	180
					,fieldLabel	: 	'Total space limit'
					,labelWidth	:	120
					,name		:	'total'
					,id		:	'total'
					,allowBlank	:	false
					,minValue	: 	1
					,maxValue	: 	99999
					,listeners	:	{
								change: CP.cdm.enableApply
								}
					},{
					xtype		:	'cp4_label'
					,text		:	'MB'
					,margin		:	'2 0 0 3'
					,flex		:	1
					}]
	
	},{
		xtype		:	'cp4_dataformpanel'
		,layout		:
		{
			type	:	'hbox'
		}
		,name		:	'per_exec_form'
		,id		:	'per_exec_form'
		,width		:	300
		,items		:	[{
			
					xtype		:	"cp4_positiveint"
					,width		:	180
					,fieldLabel	:	'Dumps per process'
					,labelWidth	:	120
					,name		:	'per_exec'
					,id		:	'per_exec'
					,allowBlank	:	false
					,minValue	:	1
					,maxValue	:	99999
					,listeners	:	{
								change: CP.cdm.enableApply
							}
					}]
	},{
	     	xtype		: 	"cp4_button"
	     	,id		: 	"apply_button"
	     	,disabled	: 	true
	     	,text		: 	"Apply"
	     	,hideLabel	:	 true
	     	,handler	: 	function() 
					{
	     					CP.cdm.saveHandler();
					}
        },{
		xtype		:	'cp4_inlinemsg'
		,text		:	'Core dumps are kept in /var/log/dump/usermode'
	}]
        ,listeners: 
	{
        	render : CP.cdm.doLoad
        }
    });

    var page = {
        title		:	"Core dump manager configuration"
        ,panel		: 	CdmPanel
        ,params		:	{}
	,submitURL	:	'/cgi-bin/cdm.tcl'
    };

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {   
	formPanel.load({
	url: '/cgi-bin/cdm.tcl',
	method: 'GET',
		success: function (jsonResult) {
			CP.cdm.enableOrDisableInput();
			Ext.getCmp('apply_button').disable();
		}
    	});
},

enableApply: function()
{
	Ext.getCmp('apply_button').enable();
},

enableOrDisableInput: function()
{
	if (!Ext.getCmp("enable_checkbox").getValue())
	{
		Ext.getCmp("total").disable();
		Ext.getCmp("per_exec").disable();
	} else if(!Ext.getCmp("enable_checkbox").isDisabled())
	{
		Ext.getCmp("total").enable();
		Ext.getCmp("per_exec").enable();
	}
	CP.cdm.enableApply();
},

saveHandler: function() {
	var pageObj = CP.UI.getMyObj();
	pageObj.params = {};
	pageObj.params["total"] = Ext.getCmp("total").getValue();
	pageObj.params["per_exec"] = Ext.getCmp("per_exec").getValue();
	if (Ext.getCmp("enable_checkbox").getValue())
	{
		pageObj.params["enable"] = "1";
	}
	else
	{
		pageObj.params["enable"] = "0";
	}
	CP.UI.submitData( pageObj );

	Ext.getCmp('apply_button').disable();
	CP.util.clearFormDirtyFlag('cdm-panel');
	CP.util.clearFormDirtyFlag('total_form');
	CP.util.clearFormDirtyFlag('per_exec_form');
}

}
