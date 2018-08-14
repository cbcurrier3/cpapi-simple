CP.perf = {

Globals:{
	GeneralText :	'Set these options to optimize appliance performance for different scenarios.'
	,MultiQText	:	'These interfaces support Multi Queue.'
	,TextOptionA:	'Best Software Blades performance. Most cores are assigned to CoreXL instances. Select if you enabled more blades than the Firewall Blade and the VPN Blade.'
	,TextOptionB:	'Best session rate for template connections. Up to 4 cores are assigned to Performance Pack. Recommended Multi Queue Interface configuration will be applied.'
	,TextOptionC:	'Best small or large packet accelerated throughput. Up to 6 cores are assigned to Performance Pack. Recommended Multi Queue Interface configuration will be applied.'
	,OptionA 	: '<b>Optimize for Software Blades</b>'
	,OptionB 	: '<b>Optimize for Session Rate</b>'
	,OptionC 	: '<b>Optimize for Packet Rate and Throughput</b>'
	,OptionD 	: '<b>Custom</b>'
	,recText	: 'Interfaces that are recommended for enabling Multi Queue are selected. Review the settings and configure otherwise if needed.'
	,notSupport : 'Multi Queue cannot be enabled on this machine. You can configure CoreXL in cpconfig or with clish commands.'
	,staticStore: ''
	,postData	: false
},

init: function() {

	var checkColumn = new Ext.ux.CheckColumn({
		/* header: 'State', */
		dataIndex: 'mq_state',
		id: 'mq_state',
		flex: 0,
		width:10,
		listeners: {
			checkchange : function(column, recordIndex, checked) {
					/* enable apply button only if we own the config-lock */
					if (!(CP.global.token<1)) {	
						Ext.getCmp('perf_apply').enable();
					} else {
                                                var record = Ext.getCmp( 'perf-table' ).getStore().getAt(recordIndex);
                                                record.set('mq_state', !record.data.mq_state);
                                        }

					/* update dirty bit page for CheckBox */
					CP.perf.updateDirtyPageforCheckBox();
				}
		}
			
	});
			
	// Column Model
    var cm = [
		checkColumn 
        ,{header: 'Interface', dataIndex: 'interface', id:'interface', flex: 0,width:210}
        /* ,{header: 'State',  dataIndex: 'mq_state', id:'mq_state', field: pool_status} */
        /*,{header: 'Pending',  dataIndex: 'pending', id:'pending'}*/
		
    ];

    var perfStaticStore = Ext.create('CP.WebUI4.Store',
                {
                    fields: [ 'interface', 'mq_state', 'pending', 'rec'],
                    data: {data:{}},
                    proxy : {
                        type : 'memory',
                        reader : {
                            type : 'json',
                            root : 'data.interfaces',
                            successProperty : 'success'
                        }
                    }
    });

    var gridP = Ext.create( 'CP.WebUI4.GridPanel',{
        id: "perf-table"
		,forceFit: true
        ,autoHeight :   true
        ,height: 150
        ,width: 220
		,margin: '0 0 0 24'
        ,store: perfStaticStore
        ,columns: cm
		,columnLines: true
        ,listeners: {
        }
    });
	
    var perfPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"perf-panel"
		,height: 800
        ,items: [
		{ 
			xtype: 'cp4_inlinemsg'
			,type       : 'info'
			,id			: 'perf_feature_enable'
			,hidden: true
			,text: ''
			,style          : "margin-top:24px;"
		},
		{ 
			xtype: 'cp4_inlinemsg'
			,type       : 'info'
			,text: CP.perf.Globals.GeneralText
			,style          : "margin-top:24px;"
		},
		{	
        	xtype: 'cp4_sectiontitle'
			,titleText: 'Performance Optimization'
		},
		/* options */
		{
			xtype:"cp4_radiogroup"
			,id: 'perf_options'
			,columns:1
			,labelWidth: 143	
			,margin: '0 0 0 24'
			,items:[{
				boxLabel: CP.perf.Globals.OptionA
				,labelStyle: 'font-weight:bold;'
				,inputValue: '1'
				,name:'selected_option'
				,width : 500
				, listeners:{
					change: function(obj, newValue, oldValue, eOpts){
						Ext.getCmp('perf_apply').enable();
						if (newValue == true)
						{
							var dataStore = CP.perf.Globals.staticStore.data;
							/* calculate core split of option A and update text */
							cores_split_text = (dataStore.num_of_cpus - dataStore.num_instances_1) + " Performance Pack. " + dataStore.num_instances_1 + " CoreXL instances";
							dataStore.num_of_instances = dataStore.num_instances_1;
							Ext.getCmp('perf_cores').setText(cores_split_text);
							Ext.getCmp('perf_slider').setValue(dataStore.num_instances_1);
							Ext.getCmp('perf_slider').setDisabled(true);
							/* updates number of queues for an interface */
							dataStore.queues = dataStore.num_of_cpus - dataStore.num_instances_1;
							/* revert to original MQ */
							CP.perf.updateOrig();
							/* no recommendation needs in Option A & D */
							Ext.getCmp('perf_mq_rec').setValue('');
							/* update dirty bit page for CheckBox */
							CP.perf.updateDirtyPageforCheckBox();
						}
					}
				}
			}
			,{ xtype: 'cp4_panel',  margin: '0 0 0 24', html: CP.perf.Globals.TextOptionA, height: 50, width: 500}
			,{
				boxLabel: CP.perf.Globals.OptionB
				,inputValue: '2'
				,name: 'selected_option'
				,width : 500
				, listeners:{
					change: function(obj, newValue, oldValue, eOpts){
						Ext.getCmp('perf_apply').enable();
						if (newValue == true)
						{
							var dataStore = CP.perf.Globals.staticStore.data;
							/* calculate core split of option B and update text */
							cores_split_text = (dataStore.num_of_cpus - dataStore.num_instances_2) + " Performance Pack. " + dataStore.num_instances_2 + " CoreXL instances";
							dataStore.num_of_instances = dataStore.num_instances_2;
							Ext.getCmp('perf_cores').setText(cores_split_text);
							Ext.getCmp('perf_slider').setValue(dataStore.num_instances_2);
							Ext.getCmp('perf_slider').setDisabled(true);
							/* updates number of queues for an interface */
							dataStore.queues = dataStore.num_of_cpus - dataStore.num_instances_1;
							/* update recommendation, only if needed */
							if (dataStore.mq_no_rec != "") {
								Ext.getCmp('perf_mq_rec').setValue(dataStore.mq_no_rec);
							} else if (CP.perf.needToRecommend() == true){
								CP.perf.updateRecommend();
								Ext.getCmp('perf_mq_rec').setValue(CP.perf.Globals.recText);
							}
							/* update dirty bit page for CheckBox */
							CP.perf.updateDirtyPageforCheckBox();

						}
					}
				}
			}
			,{ xtype: 'cp4_panel',  margin: '0 0 0 24', html: CP.perf.Globals.TextOptionB, height: 50, width: 500}
			
			,{
				boxLabel: CP.perf.Globals.OptionC
				,inputValue: '3'
				,name: 'selected_option'
				,width : 500
				, listeners:{
					change: function(obj, newValue, oldValue, eOpts){
						Ext.getCmp('perf_apply').enable();
						if (newValue == true)
						{
							var dataStore = CP.perf.Globals.staticStore.data;
							/* calculate core split of option C and update text */
							cores_split_text = (dataStore.num_of_cpus - dataStore.num_instances_3) + " Performance Pack. " + dataStore.num_instances_3 + " CoreXL instances";
							dataStore.num_of_instances = dataStore.num_instances_3;
							Ext.getCmp('perf_cores').setText(cores_split_text);
							Ext.getCmp('perf_slider').setValue(dataStore.num_instances_3);
							Ext.getCmp('perf_slider').setDisabled(true);
							/* updates number of queues for an interface */
							dataStore.queues = dataStore.num_of_cpus - dataStore.num_instances_1;
							/* update recommendation, only if needed */
							if (dataStore.mq_no_rec != "") {
								Ext.getCmp('perf_mq_rec').setValue(dataStore.mq_no_rec);
							} else if (CP.perf.needToRecommend() == true){
								CP.perf.updateRecommend();
								Ext.getCmp('perf_mq_rec').setValue(CP.perf.Globals.recText);
							}
							/* update dirty bit page for CheckBox */
							CP.perf.updateDirtyPageforCheckBox();
						}
					}
				}
			}
			,{ xtype: 'cp4_panel',  margin: '0 0 0 24', html: CP.perf.Globals.TextOptionC, height: 50, width: 500}
			
			,{
				boxLabel: CP.perf.Globals.OptionD
				,inputValue: '4'
				,name: 'selected_option'
				,width : 500
				, listeners:{
					change: function(obj, newValue, oldValue, eOpts){
						Ext.getCmp('perf_apply').enable();
						if (newValue == true)
						{
							var dataStore = CP.perf.Globals.staticStore.data;
							/* calculate core split of option D and update text */
							cores_split_text = (dataStore.num_of_cpus - dataStore.num_of_instances) + " Performance Pack. " + dataStore.num_of_instances + " CoreXL instances";
							Ext.getCmp('perf_slider').setDisabled(false);
							dataStore.num_of_instances = dataStore.original_value;
							Ext.getCmp('perf_cores').setText(cores_split_text);
							Ext.getCmp('perf_slider').setValue(dataStore.num_of_instances);
							/* updates number of queues for an interface */
							dataStore.queues = dataStore.num_of_cpus - dataStore.num_of_instances;
							/* no recommendation needs in Option A & D */
							CP.perf.updateOrig();
							Ext.getCmp('perf_mq_rec').setValue('');
							/* update dirty bit page for CheckBox */
							CP.perf.updateDirtyPageforCheckBox();
						}
					}
				}
			}]
		},
		/* Core Split */
		{	
        	xtype: "cp4_sectiontitle"
			,titleText: "Core Split"
		},
		{
		    xtype   : 'cp4_fieldcontainer'
            ,width  : 400
			,id		: 'cores_split'
			,margin: '0 0 0 24'
            ,items  : [ { xtype: 'cp4_label', text: 'Core Split:', width: 75 }
						/* slider */
					  ]
		},
		{ 
			xtype: 'cp4_sliderfield' 
			,id: 'perf_slider' 
			,titleText: 'Core Split'
			, minValue: 0
			, maxValue: 4 
			,margin: '0 0 0 104'
			, listeners:{
				change: function( slider, newValue, thumb, eOpts ){
					Ext.getCmp('perf_apply').enable();
					var staticStore = CP.perf.Globals.staticStore.data;
					cores_split_text = (staticStore.num_of_cpus - newValue) + " Performance Pack. " + newValue + " CoreXL instances";
					Ext.getCmp('perf_cores').setText(cores_split_text);
					staticStore.num_of_instances = newValue;
					
					/* updates number of queues for an interface */
					staticStore.queues = staticStore.num_of_cpus - staticStore.num_of_instances;
				}
			}
		},
		
		{ xtype: 'cp4_label', id: 'perf_cores', margin: '0 0 0 90', height: 50, width: 500}
		
		/* Multi Queue */
		,{	xtype: "cp4_sectiontitle", titleText: "Multi Queue" }
		,{ xtype: 'cp4_panel', html: CP.perf.Globals.MultiQText , height: 25, width: 500, margin: '0 0 0 24'}
		,{ xtype: 'cp4_displayfield', id: 'perf_mq_rec', margin: '0 0 0 25', height: 30, width: 700}
		,{ xtype: 'cp4_panel', height: 15}
		,gridP
		,{ xtype: 'cp4_panel', height: 20, width: 500}
		/* Apply Button */
		,{
			xtype: "cp4_button"
			,id: "perf_apply"
			,disabled: true
			,text: "Apply"
			,hideLabel: true
			,handler: CP.perf.saveHandler
        }
		,{xtype: 'cp4_textfield', id: 'checkBox_d', value: '0', hidden: true}
		]
        ,listeners: {
              render: CP.perf.doLoad
        }
    });

    var page = {
        title:"Performance Optimization"
        ,panel: perfPanel
        ,submitURL:"/cgi-bin/perf.tcl"
        ,afterSubmit: CP.perf.afterSubmit
		,submitFailure  : function() {
			CP.perf.waitMask.hide();
			/* CP.perf.doLoad(); */
        }
        ,params:{}
    };

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
		CP.perf.waitMask.show();
        Ext.Ajax.request({
            url: '/cgi-bin/perf.tcl',
            method: 'GET',
            success: function( jsonResult ){

					CP.perf.waitMask.hide();
					CP.perf.Globals.staticStore = Ext.decode( jsonResult.responseText );
					var disableMode = false;
					if ( CP.perf.Globals.staticStore.data.supported == "2" ) {
						disableMode = true;
					}
						
					if (disableMode)
					{
						CP.perf.disablePage();
					}
					else 
					{
					
					/* Save instances number, in case moving to Custom */
					CP.perf.Globals.staticStore.data.original_value = CP.perf.Globals.staticStore.data.num_of_instances;
					
					var staticStore = CP.perf.Globals.staticStore;
					staticStore.data.queues = staticStore.data.num_of_cpus - staticStore.data.num_of_instances;
					var selected_item = staticStore.data.selected_option;
					var num_of_instances = staticStore.data.num_of_instances;
					var num_of_cpus = staticStore.data.num_of_cpus;
					var min_instances_number = staticStore.data.min_instances_number;
					var max_instances_number = staticStore.data.max_instances_number;
					var cores_split_text="";
					staticStore.data.interfaces_orig = staticStore.data.interfaces;
					
					Ext.getCmp('perf_slider').setMinValue(staticStore.data.min_instances_number);
					Ext.getCmp('perf_slider').setMaxValue(staticStore.data.max_instances_number);
					Ext.getCmp('perf_slider').setValue(num_of_instances);
					cores_split_text = (num_of_cpus-num_of_instances) + " Performance Pack. " + num_of_instances + " CoreXL instances";
					Ext.getCmp('perf_cores').setText(cores_split_text);
					
					/* update dirty bit for radio buttons */
					for (i=1; i < 5 ; i++)
					{
						Ext.getCmp('perf_options').items.items[2*(i-1)].setValue(false);
						Ext.getCmp('perf_options').items.items[2*(i-1)].originalValue = false;
					}
					Ext.getCmp('perf_options').items.items[2*(selected_item-1)].setValue(true);
					Ext.getCmp('perf_options').items.items[2*(selected_item-1)].originalValue = true;
					
					Ext.getCmp('perf_slider').originalValue = num_of_instances;
					
					/* refresh grid data */
					var grid = Ext.getCmp( 'perf-table' );
					var store = grid.getStore();
					var reader = store.getProxy().getReader();
					var data = reader.read( staticStore );
					store.loadData( data.records );
					grid.doComponentLayout();
					
					store.each( function( record ){
						if (record.data.mq_state == "off")
							record.set('mq_state', false);
						else
							record.set('mq_state', true);
					});
					Ext.getCmp('perf_apply').disable();
					
					if (staticStore.data.mq_no_rec != "" && (staticStore.data.selected_option == 2 || staticStore.data.selected_option == 3)  ) {
						Ext.getCmp('perf_mq_rec').setValue(staticStore.data.mq_no_rec);
					} else {
							if (staticStore.data.selected_option == 2 || staticStore.data.selected_option == 3 ) {
								if (CP.perf.needToRecommend() == true) {
									CP.perf.updateRecommend();
									Ext.getCmp('perf_mq_rec').setValue(CP.perf.Globals.recText);
									Ext.getCmp('perf_apply').enable();
								}
							}
						
					}
					Ext.getCmp('checkBox_d').originalValue = '0';
					CP.perf.updateDirtyPageforCheckBox();

					}

					
            }, 
			failure: function(jsonResult) {
				CP.perf.waitMask.hide();
			}
        });

},

//Collect the list of bindings for db set_list -
//update params array to be sent with the request to server
setChangedParams: function( formType ){
    //get params object
	var i = 0;
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var params = pageObj.params;
    //params[ 'ssmtp:mailhub' ] = Ext.getCmp('server').getValue();
	//var Items = Ext.getCmp('perf_options').items.items[2*(selected_item-1)]
	var selected_option = 0;
	var Items = Ext.getCmp('perf_options').items.items;
	if (Items[0].value == true) selected_option = 1;
	else if (Items[2].value == true) selected_option = 2;
	else if (Items[4].value == true) selected_option = 3;
	else if (Items[6].value == true) selected_option = 4;
	//params[ 'selected_option' ] = selected_option;
	//params[ 'num_of_instances' ] = CP.perf.Globals.staticStore.data.num_of_instances;
	/* post only if value has changed */
	if ( CP.perf.Globals.staticStore.data.original_value != CP.perf.Globals.staticStore.data.num_of_instances) {
		params[':perf:num:instaces'] = CP.perf.Globals.staticStore.data.num_of_instances;
	}
	var grid = Ext.getCmp( 'perf-table' );
	var store = grid.getStore();
	
	store.each( function( record ){
		if (record.data.mq_state == true)
			i++;
		var inet = record.get('interface');
		var origVal = CP.perf.getOrigState(inet);
		if ( CP.perf.getOrigState(inet) != record.data.mq_state) {
			if (record.data.mq_state == false)
				params[':perf:interface:'+ inet] = "off";
			else {
				params[':perf:interface:'+ inet] = "on";
			}
		}
	});
	if (i > CP.perf.Globals.staticStore.data.mq_if_allowed) return false;
	return true;

},

saveHandler: function( formType ){
	var value = false;
    //get params to be posted to server
    value = CP.perf.setChangedParams( formType );
	if (value == true) {
		//submit form
		CP.UI.applyHandler( CP.UI.getMyObj() );
		//CP.UI.submitData( CP.UI.getMyObj() );
		
		/* check if we have config-lock */
		if (!(CP.global.token<1)) {	
			CP.perf.waitMask.show();
			CP.perf.Globals.postData = true;
		}
	} else {
		CP.WebUI4.Msg.show({
                title: 'Multi Queue',
                msg: 'You can configure only ' + CP.perf.Globals.staticStore.data.mq_if_allowed + ' interfaces.',
                buttons: Ext.Msg.OK,
                icon: Ext.Msg.INFO
        });
	}
}



,afterSubmit:function(form, action){
    /* reload the page */
	CP.perf.waitMask.hide();
	CP.perf.doLoad();

	if (!(CP.global.token<1) && CP.perf.Globals.postData == true) {	
		CP.perf.Globals.postData = false;
		CP.perf.verifyReboot();
	}

}

,waitMask: new Ext.LoadMask(Ext.getBody(), {msg:"Please wait few moments while the data is loaded..."})

,verifyReboot: function( /*button, event */){
    CP.WebUI4.Msg.show({ 
            title: 'Reboot the System',
            msg: "New configuration will take effect in the next reboot. Do you want to reboot the machine now?",
            icon: 'webui-msg-warning',
            buttons: Ext.Msg.YESNO,
            fn: function( button, text, opt ){
                if( button == "yes" ){
					CP.perf.sendRebootRequest();
				}
            }
	});
}

,needToRecommend: function(){
	var Store = CP.perf.Globals.staticStore.data.interfaces_orig;
	var len = Store.length;
	var i = 0;
	var rc = false;
	
	for (i = 0; i < len; i++)
	{
		if (Store[i].rec == "on")
		{
			rc = true;
		}
	}
	return rc;
}

,getOrigState: function(inet){
	var i;
	var OrigStore = CP.perf.Globals.staticStore.data.interfaces_orig;
	var len = OrigStore.length;
	for (i = 0; i < len; i++)
	{
		if ( OrigStore[i].interface == inet ) 
		{
			if (OrigStore[i].mq_state == "on") return true;
			else return false;
		}
	}
}

,updateMQstate: function(inet, state){
	var store = Ext.getCmp( 'perf-table' ).getStore();
	store.each( function( record ){
		if (record.data.interface == inet) {
			record.set('mq_state', state);
		}
	});
}

,updateRecommend: function(){
	var i;
	var OrigStore = CP.perf.Globals.staticStore.data.interfaces_orig;
	var len = OrigStore.length;
	for (i = 0; i < len; i++)
	{
		if ( OrigStore[i].rec == "on" ) val = true;
		else val = false;
		CP.perf.updateMQstate(OrigStore[i].interface, val);
	}
}

,updateOrig: function(){
	var i;
	var OrigStore = CP.perf.Globals.staticStore.data.interfaces_orig;
	var len = OrigStore.length;
	for (i = 0; i < len; i++)
	{
		if ( OrigStore[i].mq_state == "on" ) val = true;
		else val = false;
		CP.perf.updateMQstate(OrigStore[i].interface, val);
	}
}

,updateDirtyPageforCheckBox: function(){
	var store = Ext.getCmp( 'perf-table' ).getStore();
	var flag = 0;
	store.each( function( record ){
		if ( record.data.mq_state != CP.perf.getOrigState(record.data.interface) )
		{
			flag = 1;
		}
		Ext.getCmp('checkBox_d').setValue('1');
	});
	if (flag == 1) Ext.getCmp('checkBox_d').setValue('1');
	else Ext.getCmp('checkBox_d').setValue('0');
}

,disablePage: function(){
	Ext.getCmp('perf_feature_enable').update('<div class="msg-tl"><div class="msg-tr"><div class="msg-tc">&nbsp;</div></div></div>'+
		'<div class="msg-ml"><div class="msg-mr"><div class="msg-mc '+ 'warning' +'">'+ CP.perf.Globals.notSupport +'</div></div></div>'+
		'<div class="msg-bl"><div class="msg-br"><div class="msg-bc">&nbsp;</div></div></div>');
	Ext.getCmp('perf_feature_enable').setVisible(true);
			
	Ext.getCmp('perf_slider').setDisabled(true);
	for (i=1; i < 5 ; i++)
	{
		Ext.getCmp('perf_options').items.items[2*(i-1)].setDisabled(true);
	}
}

,sendRebootRequest: function(){
        var myparams = {};
        myparams[ ':reboot' ] = '';
        Ext.Ajax.request({
            url: '/cgi-bin/perf.tcl',
            method: 'POST',
            params: myparams,
            success: function(){
				CP.util.rebootingWindow('Rebooting System',
									    'Please wait while system is rebooting.',
									    30000);
            }
        });
    }

} /* end of CP.perf */
