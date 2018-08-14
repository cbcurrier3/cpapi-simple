
CP.HwHistory = {
        
        EXT4_PANEL_ID: 'HwHistory_ext4_panel',
        TCL_REQUEST: '/cgi-bin/hw_history.tcl',
        TCL_GRAPH_REQUEST: '/cgi-bin/hw_historyDB.tcl',
        GRID_ID: 'HwHistory_main_grid',
        
    //build the page
    init : function() {
        
        //1. create the page object
        var page = {
            title : 'Hardware Health',
            params : {},
            submitURL : CP.HwHistory.TCL_REQUEST,
            afterSubmit : CP.HwHistory.doLoad,
            //2. configure the properties for the panel and 
            //   add it into the page object
            panel : Ext.create( 'CP.WebUI4.DataFormPanel', {
                id : CP.HwHistory.EXT4_PANEL_ID , //id is mandatory
                items : CP.HwHistory.getPageItems(),
                listeners: {
                    render: CP.HwHistory.doLoad
                }
            })
        };
       
		// hide the compnent
		//Ext.getCmp("add-history-form").hide();
		
	   
        //3. display the page
        CP.UI.updateDataPanel(page, CP.global.monitor);
       
    },
	
	getPageItems: function(){

	    //load grid store with roles data
        var HwHealthStore = Ext.create( 'Ext.data.Store', {
            fields: [ 'sensor_name', 'sensor_value', 
            'sensor_status','sensor_type', 'sensor_label' ],
            data: {data:{}},
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
					root: 'data.sensor',
                    successProperty: 'success'
                }
            }
        });
        
        // A nice title.
        var HwMonitorTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'Hardware Health'
        };

        //buttons bar above table
        var buttonsBar = {
            xtype: 'cp4_btnsbar',
            items: [{
                text: 'Refresh',
				handler: function() {
				
					// reload the table
					CP.HwHistory.doLoad() ;
					
					//click_me_message
					Ext.getCmp("click_any_row").show();
				}
            }]
        };
       

	   
	   
	function ColorChange(val, p ){
	
        if(val == "Ok"){
			p.tdCls = 'icon_ok_left';
			return  '<span style="color:green;position:relative;left:20px;"> ' 
					+  val + '</span>';
			
        } else {
			if (val == "Off") {
				p.tdCls = 'icon_red_warning_left';
				return '<span style="color:red;position:relative;left:20px">'
				+ val + '</span>';
			} else {			
			p.tdCls = 'icon_warning_left';
			return '<span style="color:orange;position:relative;left:20px">'
			+ val + '</span>';
        }
        }
        return val;
    };
		
		function ValueRender(val, p, record ){
					
			
			if (record.data.sensor_type.indexOf('RPM') >= 0) {
				p.tdCls = 'icon_fan_left' ;
				return '<span style="position:relative;left:20px">' + val + '</span>';
			} else if (record.data.sensor_type.indexOf('Volt') >= 0) {
				p.tdCls = 'icon_voltage_left' ;
				return '<span style="position:relative;left:20px">' + val + '</span>';
			} else if (record.data.sensor_type.indexOf('Celsius') >= 0 ||
			 	record.data.sensor_type.indexOf('Fahrenheit') >= 0) {
				p.tdCls = 'icon_temperature_left' ;
				return '<span style="position:relative;left:20px">' + val + '</span>';
			} else if (record.data.sensor_type.indexOf('On/Off') >= 0 ) {
				p.tdCls = 'icon_power_left' ;
				return '<span style="position:relative;left:20px">' + val + '</span>';
			} else if (record.data.sensor_type.indexOf('Valid/Invalid') >= 0 ) {
				p.tdCls = 'icon_bios_sensor' ;
				return '<span style="position:relative;left:20px">' + val + '</span>';
			}
		
			return val;
	
    };
		
		
        //grid columns
        var columns = [{  
            header: 'Sensor', 
            dataIndex: 'sensor_name',
            flex: 1,
			renderer:ValueRender
        },{ 
            header: 'Value', 
            dataIndex: 'sensor_value',
            flex: 1
        },{ 
            header: 'Status', 
            dataIndex: 'sensor_status',
            flex: 1,
			renderer:ColorChange
        }];
		
		
        //create main table that shows all sensor  entries
        var HwMonitorTable = {        
            xtype: 'cp4_grid',
            id: CP.HwHistory.GRID_ID,
            width: 550,
            height: 180,
            autoScroll: true,
            store: HwHealthStore,
            columns: columns,
            clicked: false, /* a flag to indicate if a chart window about to be open (or already open) */
			listeners: {
				itemclick: function(sm , row) {
					if (typeof(row.data.sensor_label) == "number") {
						row.data.sensor_label = new String ("+" + row.data.sensor_label) ;
					}
					// show the chart.
					CP.HwHistory.FlushDynamic(row.data.sensor_label, 60 ,-(3600) , 0 , row.data.sensor_type, row.data.sensor_name);
                },
                beforeitemclick: function(){
                	/* check if we are in the process to open a chart window
                	   if yes then return false so itemclick event will not run again */
                	if (this.clicked){
                		return false;
                	}
                	else{
                		this.clicked = true;
                		return true;
                	}
                }
            }
        };
		
  

	var click_me_message = Ext.create( 'CP.WebUI4.inlineMsg' , 
	{
		id : 'click_any_row',
		type: 'warning',
		text: 'Click any row to see its history...',
		hidden: false
	});
	
	
	return  [ HwMonitorTitle,buttonsBar, HwMonitorTable,click_me_message] ;
	}	
	    //load data and refresh page (on page load or after submit)
    ,doLoad: function(){
        Ext.Ajax.request({
            url: CP.HwHistory.TCL_REQUEST,
            method: 'GET',
            success: function( jsonResult ){
                var HwMonData = Ext.decode( jsonResult.responseText );    
                //refresh grid data
                var grid = Ext.getCmp( CP.HwHistory.GRID_ID );
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read( HwMonData );
                store.loadData( data.records );
                grid.doComponentLayout();
            }
        });
    }
	
	
		 
	
	// Show the graph of the sensors 
	,FlushDynamic:function(sensor_name, number_of_points,startDate, endDate,sensor_type, sensor_desc){
	
		var myparams = {};  
		
		myparams["sensor_name"] = sensor_name; 
		myparams["number_of_points"] = number_of_points;
		myparams["start_date"] = startDate;
		myparams["end_date"] =  endDate;
		myparams["sensor_type"] = Ext.String.trim(sensor_type) ;
		myparams["sensor_label"] = sensor_desc ;
		
		Ext.getCmp("click_any_row").hide();

        Ext.Ajax.request({
            url: CP.HwHistory.TCL_GRAPH_REQUEST,
            method: 'GET',
            params:myparams,
            success: function(response, options) { 
				CP.HwHistory.handleSubmit(response, options.params);
			}
        });
	
}


,handleSubmit:function(response, params){
	
	var graphStore = Ext.create( 'Ext.data.Store', {
		id: 'chart_store' ,
		fields: ['time', 'good', 'bad'],
		proxy: {
			type: 'memory',
			reader: {
				type: 'json',
				root: 'data.dada',
				successProperty: 'success'
			}
		}
	});
	
	var sensorHistoryData = Ext.decode( response.responseText );    
	var reader = graphStore.getProxy().getReader();
	var data = reader.read( sensorHistoryData );
		
	if (data.count == 0) {
		CP.WebUI4.Msg.show({
				title: 'Error',
				msg: "An error occurred while trying to retrieve sensor data.<br>Please check monitord is running.",
				buttons: Ext.Msg.OK,
				icon: 'webui-msg-error'
		});
		return;
	}	
		
	graphStore.loadData( data.records );
	// go over the data object and find the max&min
	var nYMax = -1000 , nYMin = 1000;
	for ( var i  = 0 ; i < data.count ; i++ ) {
		if ( data.records[i].data.good != "" && nYMax < data.records[i].data.good  )  {
			nYMax = data.records[i].data.good ;
		}
		if ( data.records[i].data.bad != "" && nYMax < data.records[i].data.bad  )  {
			nYMax = data.records[i].data.bad ;
			}
			
		if ( data.records[i].data.good != "" && nYMin > data.records[i].data.good  )  {
			nYMin = data.records[i].data.good ;
		}
		if ( data.records[i].data.bad != "" && nYMin > data.records[i].data.bad  )  {
			nYMin = data.records[i].data.bad ;
		}
		
		}
	//nYMax = (nYMax - nYMin) * 1.3 ;
	nYMax = (nYMax ) * 1.3 ;
	nYMin = 0 ; 
	var XAxisTitle , GridXMin = 0, GridXMax, GridXMajorTicks, GridXMinorTicks; 
	if (sensorHistoryData.data.SensorStartDate[0].data == -(3600*24*90)) {
		XAxisTitle = "Days" ;
		GridXMax = 90 ;
		GridXMajorTicks = 9 ;
		GridXMinorTicks = 1 ;
	}
	if (sensorHistoryData.data.SensorStartDate[0].data == -(3600*24*30)) {
		XAxisTitle = "Days" ;
		GridXMax = 30 ;
		GridXMajorTicks = 6 ;
		GridXMinorTicks = 4 ;
	}
	if (sensorHistoryData.data.SensorStartDate[0].data == -(3600*24)) {
		XAxisTitle = "Hours" ;
		GridXMax = 24 ;
		GridXMajorTicks = 6 ;
		GridXMinorTicks = 3 ;
	}
	if (sensorHistoryData.data.SensorStartDate[0].data == -(3600)) {
		XAxisTitle = "Minutes" ;
		GridXMax = 60 ;
		GridXMajorTicks = 10 ;
		GridXMinorTicks = 1 ;
	}

  /* close the old window if it is open.
	   this happen when the user change the chart time period */
	var MyWindow = Ext.getCmp('hw_monitor_chart_window');
	if (MyWindow){
		MyWindow.close();
	}

	MyWindow = Ext.create("CP.WebUI4.ModalWin", {
        id: 'hw_monitor_chart_window',
        width: 800,
        height: 600,
        minHeight: 400,
        minWidth: 550,
        title: sensorHistoryData.data.SensorLabel,
        layout: 'fit',
        listeners: {
        	beforeclose: function(){
        		/* reset the grid itemclick flag */
        		Ext.getCmp(CP.HwHistory.GRID_ID).clicked = false;
        	}
        },
        tbar: {
        		disabledCls: '',
        		itemId: 'top-bar',
        		defaults: {
        			handler: function(button) {
        				MyWindow.getComponent('top-bar').disable();
        				CP.HwHistory.FlushDynamic(params.sensor_name, button.number_of_points, button.startDate, 0 , params.sensor_type, params.sensor_label);
        			}
        		},
                items: [{
			text: '3 Months',
			name : 'botton3M',
			disabled: (-(3600*24*90)== sensorHistoryData.data.SensorStartDate[0].data),
			number_of_points: 90,
			startDate: -(3600*24*90)
		},{
			text: 'Month',
			disabled: (-(3600*30*24)== sensorHistoryData.data.SensorStartDate[0].data),
			number_of_points: 30,
			startDate: -(3600*30*24)
		},{
			text: 'Day',
			disabled: (-(3600*24)== sensorHistoryData.data.SensorStartDate[0].data),
			number_of_points: 24,
			startDate: -(3600*24)
		},{
			text: 'Hour',
			disabled: true ,
			disabled: (-(3600)== sensorHistoryData.data.SensorStartDate[0].data),
			number_of_points: 60,
			startDate: -(3600)
        }]
        },
        items: {
			xtype: 'chart',
			width: 500,
			height: 300,
			store: graphStore,
			axes: [
		{
					type: 'Numeric',
					position: 'left',
					minimum: nYMin,
					maximum: nYMax,
					fields: ['good','bad'],
					title: sensorHistoryData.data.SensorType[0].data
				},
		{
					type: 'Numeric',
					position: 'bottom',
					fields: ['time'],
					minimum: GridXMin,
					maximum: GridXMax,
					majorTickSteps: GridXMajorTicks,
					minorTickSteps: GridXMinorTicks,
					title: XAxisTitle, 
					grid: {
						even:{
							opacity: 1,
							fill: '#ddd',
							stroke: '#bbb',
							'stroke-width': 1
						}
					}
				}],
			series: [
		{
					type: 'scatter',
					axis: 'left',
					xField: 'time',
					yField: 'good',
					tips: {
						trackMouse: true,
						width: 110,
						height: 25,
						renderer: function(storeItem, item) {
							this.setTitle("Value: " + Math.round( storeItem.data.good * 100 ) / 100 ) ; 
		}
					},
					markerConfig: {
						type: 'circle',
						size: 4,
						radius: 4,
						'stroke-width': 0,
						fill: 'Green'
	}
				},{
					type: 'scatter',
					axis: 'left',
					xField: 'time',
					yField: 'bad',
					tips: {
						trackMouse: true,
						width: 110,
						height: 25,
						renderer: function(storeItem, item) {
							this.setTitle("Value: " + Math.round( storeItem.data.bad * 100 ) / 100 ) ;
			}
					},
					markerConfig: {
						type: 'cross',
						size: 4,
						radius: 4,
						'stroke-width': 0,
						fill: 'Red'
		}
	}
			
			]
				}
			});
	MyWindow.show() ;
		}
		}
		
		

	
	
