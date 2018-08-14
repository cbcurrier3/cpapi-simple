CP.IMG_mgmt = {
IMG_mgmt_params:{
	remove_interval		        :	1000
    ,creation_run_interval      :   2000
    ,creation_verify_interval   :   2000
    ,exporting_run_interval     :   2000
    ,exporting_verify_interval  :   7000
    ,extracting_interval        :   7000
	,download_file				:	null
	,PIESTORE					:	null
	,isCurrentlyExporting		:	0
},

init:function() {
    //Modal window
	CP.IMG_mgmt.createModalWindow();
	
	var img_mgmtPanel = Ext.create( 'CP.WebUI4.DataFormPanel' , {
        id: "img_mgmt-panel",
		listeners: {
			removed: CP.IMG_mgmt.onRemove
		}
	});
   	
    //Add section title to panel
	var tableTitle = Ext.create( 'CP.WebUI4.SectionTitle',{
    	titleText: 'Snapshot Management'
	});
	img_mgmtPanel.add( tableTitle );
    
    CP.IMG_mgmt.addMainTable(img_mgmtPanel);

	var statsTitle = Ext.create( 'CP.WebUI4.SectionTitle',{
        titleText: 'Statistics'
    });

	img_mgmtPanel.add( statsTitle );

    var size = Ext.create( 'CP.WebUI4.Panel',{
        });
    var free = Ext.create( 'CP.WebUI4.Panel',{
        });
        
    //Pie store, you will need to change url, root and fields
    
    CP.IMG_mgmt.IMG_mgmt_params.PIESTORE = Ext.create( 'CP.WebUI4.Store',{
        fields: [ "name", "size" ]
        ,proxy: {
            type: 'ajax',
            url : '/cgi-bin/img_mgmt.tcl?operation=chart',
            reader: {
                type: 'json',
                root: 'data.pie'
            }
        }
		,listeners: {
			load : function( Store , records,  successful, operation,  eOpts ) {
				var sizeFree = records[0].data.size;
				var sizeUsed = records[1].data.size;
				var chartObj = Ext.getCmp('chartCmp');
				
				// don't display chart if no space left and no snapshot exist
				if (sizeFree == 0 && sizeUsed == 0 && chartObj) chartObj.destroy();

				
				else {  
					if (sizeFree == 0) Store.remove(records[0]);
					if (sizeUsed == 0) Store.remove(records[1]);
					if (chartObj) {
						chartObj.setVisible(true); 
						chartObj.redraw();
					}
				}
			}
        }
    });

    var chart_pie = Ext.create( 'CP.WebUI4.Panel',{
            width: 250,
            height: 150,
            id:'panel4',
            layout: 'fit',			// mandatory field , otherwise it won't be displayed
        
    		items: [{
			xtype: 'cp4_chart',
			id: 'chartCmp',
			hidden: true,
			animate: true,
			store: CP.IMG_mgmt.IMG_mgmt_params.PIESTORE,
			shadow: true,
			legend: {
				position: 'left'
			},
			theme: 'Base:gradients',
			series: [{
				type: 'pie',
				field: 'size',
				showInLegend: true,
				donut: false,
				tips: {
					trackMouse: true,
					width: 100,
					height: 28
					
					,renderer: function(storeItem, item) {
						//
						 // calculate percentage.
						 //
						var total = 0.0;
						CP.IMG_mgmt.IMG_mgmt_params.PIESTORE.each(function(rec) {
							total +=  parseFloat ( rec.get('size') );
						});
						this.setTitle(storeItem.get('name') + ': ' + Math.round(storeItem.get('size') / total * 100) + '%');
					}
				},
				highlight: {
					segment: {
						margin: 20
					}
				},
				label: {
					field: 'name',
					display: 'rotate',
					contrast: true,
					font: '12px Arial'
				}
			}]
		}]
    });

	img_mgmtPanel.add( size );
    img_mgmtPanel.add( free );
    img_mgmtPanel.add(chart_pie);
    
    Ext.Ajax.request({
            url: "/cgi-bin/img_mgmt.tcl?operation=stat"
            ,method: "GET"
            ,success: function(jsonResult) {
                var jsonData = Ext.decode(jsonResult.responseText);
                size.update("Creation of an additional image will require " +
                                        jsonData.data.statistics.size
				);
                free.update("Amount of space available for images is " +
                                        jsonData.data.statistics.free
                                );
            }
	});
    
	var obj = {
        title:"Available Images"
        ,panel:img_mgmtPanel
        ,submit:true
        ,params:{}
        ,beforeSubmit:CP.IMG_mgmt.beforeSubmit
        ,afterSubmit:CP.IMG_mgmt.afterSubmit
	};

    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);

}

,taskRegistry: {addTask:undefined,
				delTask:undefined,
				verifyTask:undefined}

,onRemove:function(){

	if (CP.IMG_mgmt.taskRegistry.addTask != undefined) {
		Ext.TaskManager.stop(CP.IMG_mgmt.taskRegistry.addTask);
		CP.IMG_mgmt.taskRegistry.addTask = undefined;
	}
	
	if (CP.IMG_mgmt.taskRegistry.delTask != undefined) {
		Ext.TaskManager.stop(CP.IMG_mgmt.taskRegistry.delTask);
		CP.IMG_mgmt.taskRegistry.delTask = undefined;
	}
	
	if (CP.IMG_mgmt.taskRegistry.verifyTask != undefined) {
		Ext.TaskManager.stop(CP.IMG_mgmt.taskRegistry.verifyTask);
		CP.IMG_mgmt.taskRegistry.verifyTask = undefined;
	}
}

,beforeSubmit:function(panel){}

,afterSubmit:function(form, action){}

,verifyCreationTask: function(snapName,gridName,Status,interval_ms){
	var task = { run: function(){
			var currTask = this;
			var currSnapName = this.args[0];
            
            if( typeof CP.IMG_mgmt.verifyCreationTask.counter == 'undefined' ) {
                CP.IMG_mgmt.verifyCreationTask.counter = 0;
            }
            if( typeof CP.IMG_mgmt.verifyCreationTask.mask == 'undefined' && Status == "status_export") {
                CP.IMG_mgmt.verifyCreationTask.mask = new Ext.LoadMask(Ext.get('mgmt_export_form'), {msg:"Creating tar file..."});
                CP.IMG_mgmt.verifyCreationTask.mask.show();
            }
            
            if (CP.IMG_mgmt.verifyCreationTask.counter<1) {
				CP.IMG_mgmt.verifyCreationTask.counter = 1 ; 
				Ext.Ajax.request({
					url: "/cgi-bin/img_mgmt.tcl"
					,method: "GET"
					,params: {custom:Status,name:currSnapName}
					,success: function(jsonResult) {
	                
	                    CP.IMG_mgmt.verifyCreationTask.counter = 0;
	                    
						var jsonData = Ext.decode(jsonResult.responseText);
						if ( jsonData.msg == "created" ) {
								Ext.TaskManager.stop(currTask);
								CP.IMG_mgmt.taskRegistry.verifyTask = undefined;
								
								CP.IMG_mgmt.IMG_mgmt_params.PIESTORE.load();
								
								var mainGrid = Ext.getCmp(gridName);
								/*
								 * no need the reload Store in case export is performed
								 */
								if (mainGrid != undefined && gridName != "export-grid"){
									var gridStore = mainGrid.getStore();
									gridStore.load();	
								}
								if (Status == "status_export") {
									Ext.getCmp("btn-ok").enable();
									CP.IMG_mgmt.IMG_mgmt_params.isCurrentlyExporting = 0;
									Ext.getCmp('btn_start_export').enable();
									CP.global.isExportingImporting = false;
									/*
									 * Send request to fetch session-id & path in Server
									 */
	                                CP.IMG_mgmt.verifyCreationTask.mask.hide();
									Ext.Ajax.request({
										url: "/cgi-bin/img_mgmt.tcl"
										,method: "GET"
										,params: {operation:"download",name:currSnapName}
										,success: function(jsonResult) {
											var jsonData = Ext.decode(jsonResult.responseText);
											/*
											 * update file name and set Download Button visible
											 */
											CP.IMG_mgmt.download_file = currSnapName + ".tar" ;
	                                        Ext.getCmp('download_btn').setVisible(true);
	
										}	
									});
								}
						}
	                    else if ( jsonData.msg == "err" ) { // can casued in case snapshot creaion failed in the middle of the process
	                        Ext.TaskManager.stop(currTask);
							CP.IMG_mgmt.taskRegistry.verifyTask = undefined;
							CP.IMG_mgmt.IMG_mgmt_params.PIESTORE.load();
							var mainGrid = Ext.getCmp(gridName);
							/*
							 * no need the reload Store in case export is performed
							 */
							if (mainGrid != undefined && gridName != "export-grid"){
								var gridStore = mainGrid.getStore();
								gridStore.load();	
							}
							CP.IMG_mgmt.enableBBarButtons();
	                    }
					}
					,failure: function(response, opts) {
							CP.IMG_mgmt.verifyCreationTask.counter = 0;
					}
				});          

            } // end counter check
	},
		interval: interval_ms //1 second
		,args: [snapName]
	};
	
	if (CP.IMG_mgmt.taskRegistry.verifyTask == undefined) {
        if (Status == "status_export")
            CP.global.isExportingImporting = true;
		CP.IMG_mgmt.taskRegistry.verifyTask = task;
		Ext.TaskManager.start(task);
	}
}

/*
 * snapName , gridName , Status (status / status_export)
 */
,runCreationProgressTask: function(snapName,gridName,Status,interval_ms){
	var task = { run: function(){
			var currTask = this;
			var currSnapName = this.args[0];

            if( typeof CP.IMG_mgmt.runCreationProgressTask.counter == 'undefined' ) {
                CP.IMG_mgmt.runCreationProgressTask.counter = 0;
            }
			if (CP.IMG_mgmt.runCreationProgressTask.counter < 1) {
				CP.IMG_mgmt.runCreationProgressTask.counter = 1;
				Ext.Ajax.request({
					url: "/cgi-bin/progress.tcl"
					,method: "GET"
					,params: {task:"snap"}
					,success: function(jsonResult) {
						
						CP.IMG_mgmt.runCreationProgressTask.counter = 0;
						
						var mainGrid = Ext.getCmp(gridName);
						if (mainGrid != undefined){
							var gridStore = mainGrid.getStore();
							var i = 0;
							var count = gridStore.getTotalCount();
							for (i; i< count ;i++) {
								if (gridStore.getAt(i).get("img_name") == currSnapName)
									break;
							}
							
							if (jsonResult.responseText != "100" && jsonResult.responseText != "err" && jsonResult.responseText != "0") {
								// task in grid but not completed 
								if (i < count) {
									mainGrid.setLoading(false);
									gridStore.getAt(i).set("img_state",jsonResult.responseText);
	                                // not sure if commitChanges is require
	//								gridStore.sync();
								}
								// task is NOT in grid but not completed 
								else  {
									mainGrid.setLoading(false);
									gridStore.load();	
									}
							}
							// task #i in grid completed
							else if (i < count) {
								mainGrid.setLoading(false);
								Ext.TaskManager.stop(currTask);
								CP.IMG_mgmt.taskRegistry.addTask = undefined;
								
								/*
								 * Export ended, so update the status.
								 */
								if (gridName == "export-grid") {
									gridStore.getAt(i).set("img_state","100");
	                                // not sure if commitChanges is require
									//gridStore.commitChanges();
								}
								
								/*
								 * verify task completion for add snapshot & Import
								 * for export display link for .tar download
								 */
	                            if (gridName == "export-grid") {
	                                CP.IMG_mgmt.verifyCreationTask(currSnapName,gridName,Status,CP.IMG_mgmt.IMG_mgmt_params.exporting_verify_interval);
	                            } else {
	                                CP.IMG_mgmt.verifyCreationTask(currSnapName,gridName,Status,CP.IMG_mgmt.IMG_mgmt_params.creation_verify_interval);
	                            }
	                            
							}
						}
					}
					,failure: function(jsonResult) {
						CP.IMG_mgmt.runCreationProgressTask.counter = 0;
						var gridStore = Ext.getCmp(gridName).getStore();
						Ext.getCmp(gridName).setLoading(false);
						Ext.TaskManager.stop(currTask);
						CP.IMG_mgmt.taskRegistry.addTask = undefined;
						gridStore.load();
	                    
					}
				});        
			}
            
		},
		interval: interval_ms 
		,args: [snapName]
	};
	
	if (CP.IMG_mgmt.taskRegistry.addTask == undefined) {
		CP.IMG_mgmt.taskRegistry.addTask = task;
		Ext.TaskManager.start(task);
	}
}

,runRemoveUpdateTask: function(snapName){
	Ext.getCmp("main-grid").setLoading(true, true);
	CP.IMG_mgmt.disableBBarButtons();
	var task = { run: function(){
			var currTask = this;
			var currSnapName = this.args[0];
			Ext.Ajax.request({
				url: "/cgi-bin/img_mgmt.tcl"
				,method: "GET"
				,params: {custom:"status",name:currSnapName}
				,success: function(jsonResult) {
					var jsonData = Ext.decode(jsonResult.responseText);
					if ( jsonData.msg == "none" || jsonData.msg == "err") {
							Ext.TaskManager.stop(currTask);
							CP.IMG_mgmt.taskRegistry.delTask = undefined;
							
							var mainGrid = Ext.getCmp("main-grid");
							if (mainGrid != undefined){
								var gridStore = mainGrid.getStore();
								mainGrid.setLoading(false);
								gridStore.load();	
							}
					}
					CP.IMG_mgmt.IMG_mgmt_params.PIESTORE.load();
				}
			});
		},
		interval: CP.IMG_mgmt.IMG_mgmt_params.remove_interval //1 second
		,args: [snapName]
	};
	
	if (CP.IMG_mgmt.taskRegistry.delTask == undefined) {
		CP.IMG_mgmt.taskRegistry.delTask = task;
        Ext.TaskManager.start(task);
	}
}


// The history form 
,getRevertTable: function() {

	var s = Ext.getCmp("main-grid").getSelectionModel().getLastSelected();
	
	var form = Ext.create( 'CP.WebUI4.FormPanel',{
	        id: 'add_remote_logging_form',
	        bodyPadding: 10,
			items: [{
					xtype: "cp4_displayfield"
					,value: "Reverting to the selected image will overwrite the current running configuration and settings. " +
						"Machine will be rebooted. " +
						"Please note that you have to know the image credentials to be able to login."
					,hideLabel:true
					,width:400
				},{   
					xtype: 'cp4_sectiontitle',
					titleText: 'Image Details'					
				},{   
					xtype: "cp4_displayfield",
					fieldLabel: 'Name',
					name: 'import_name',
					value:s.get("img_name")
				},{
					xtype: "cp4_displayfield",
					fieldLabel: 'Description',
					name: 'import_description'					
					,value:s.get("img_description")
					,width:400
				},{
					xtype: "cp4_displayfield",
					fieldLabel: 'Size',
					name: 'import_size'
					,value:s.get("img_size")
				},{
					xtype: "cp4_displayfield",
					fieldLabel: 'Version',
					name: 'import_version'
					,value:s.get("img_version")
			}]					
		});

	return form;
	
}

,getCreationForm: function() {
    //var spacer = new Ext.Spacer({height: 20 });
	var items = [{
			xtype: "cp4_displayfield"
			,value: "Create an image of the current running system. You can revert to this image at a later time."
			,hideLabel:true
			,width: 400
		},
		{	
			 //spacer,	
			 xtype: 'tbspacer'
			,height: 15
		
		},
       
        {
			id:"tf-name"
			,xtype: "cp4_textfield"
			,fieldLabel: "Name"
			,enableKeyEvents: true
			,maxLength: 15
			,width: 220
            ,allowBlank: false
			,validator: function(value){		
				re = new RegExp(/^[a-zA-Z0-9_]+$/g);
				if (value == "" || re.test(value))
					return true;
				else
					return "Snapshot name may only contain digits, letters and underscores (_)";
			}
			,listeners: {
                validitychange: function(field,isValid){
                 if (isValid && field.getValue() != "") Ext.getCmp("btn-ok").enable();
                 else Ext.getCmp("btn-ok").disable();
                }
			}
		},{
			id:"tf-desc"
			,xtype: "cp4_textfield"
			,fieldLabel: "Description"
			,enableKeyEvents: true,
			width: 340
			,validator: function(value){		
				re = new RegExp(/^[-a-zA-Z0-9_,. ]*$/);
				if (re.test(value))
					return true;
				else
					return "Snapshot description may only contain digits, letters ,space and the following (_ - , .)";
			}
			,listeners: {
                validitychange: function(field,isValid){
                 if (isValid && field.getValue() != "") Ext.getCmp("btn-ok").enable();
                 else Ext.getCmp("btn-ok").disable();
                }
			}
		}];
	return items;
}


,doLoad: function( formPanel ){
	
	var fileName = Ext.getCmp("upload_file").originalFileName;
	var arrfileName = fileName.split(".");
	var mask = new Ext.LoadMask(Ext.get('additional_item_panel'), {msg:"Loading Image's details..."});
	mask.show();
	
    formPanel.getForm().load({
        url: "/cgi-bin/img_mgmt.tcl?operation=get_info&name="+arrfileName[0]
        ,method: 'GET'
		,success: function(jsonResult) {
			mask.hide();
			Ext.getCmp("btn-ok").enable();
		}
    });
}

,runExtracting: function(mask){
			
	var task = { run: function(){
			var currTask = this;

			Ext.Ajax.request({
				url: "/cgi-bin/progress.tcl"
				,method: "GET"
				,params: {task:"import"}
				,success: function(jsonResult) {
                                       
					if ( jsonResult.responseText == "done" ) {
							CP.global.isExportingImporting = false;
                            Ext.TaskManager.stop(currTask);
                            mask.hide();
                            Ext.getCmp("btn-ok").enable();
                            //CP.IMG_mgmt.getImportInfo();
					} else if ( jsonResult.responseText == "err" ) {
                            CP.global.isExportingImporting = false;
                            Ext.TaskManager.stop(currTask);
                            mask.hide();
                            Ext.getCmp('fu_status_field').setValue("Failed to extract file "+Ext.getCmp("upload_file").originalFileName);
                            Ext.getCmp("btn-cancel").enable();
                            
                    }
                    
				}
			});
		},
		interval: CP.IMG_mgmt.IMG_mgmt_params.extracting_interval 
		,args: []
	};
	CP.global.isExportingImporting = true;
	Ext.TaskManager.start(task);

}

,getImportInfo: function() {
	var importInfo = Ext.create( 'CP.WebUI4.FormPanel',{
							id: 'import-data',
							header: false,
							//renderTo:"additional_item_panel",
   							renderTo:'mgmt_import_form',
							bodyPadding: 15,
							defaultType: 'cp4_displayfield',
							defaults: {
								minWidth: 100,
								width: 100
							},
							items: [{
								fieldLabel: 'Name',
								name: 'import_name'
							},{
								fieldLabel: 'Description',
								name: 'import_description'
							},{
								fieldLabel: 'Size',
								name: 'import_size'
							},{
								fieldLabel: 'Version',
								name: 'import_version'
							}]
							
							,listeners: {
								render: CP.IMG_mgmt.doLoad
							}
						
						});
					
				
}

,getImportForm: function() {

    //var spacer = new Ext.Spacer({height: 20 });
	var items = [{
					xtype: "cp4_displayfield"
					,value: "Import an image from archive. You will be able to revert to this image later."
					,hideLabel:true
					,width:400
				}
				//,spacer
                // Enable When upload component will be upgraded to EXT4
				,{
					xtype: 'cp4_fileuploadpanel'
					, width: 320
					, id: 'upload_file'
					, uploadPath: '/var/log/upload/'
					, tmpPath: '/var/log/upload'
					, uploadLabel: 'Select the import file for upload:'
					, onUploadFinished: function(){
                        
                         //
                         // Wait for tar to be finished
                         //
                         
                        var postParams = {trigger:"extract"};
                        var fileName = this.originalFileName;
                        var arrfileName = fileName.split(".");
                        postParams.name = arrfileName[0];
                        
                       	var mask = new Ext.LoadMask(Ext.get('additional_item_panel'), {msg:"Extract files..."});
                        mask.show();
                        
                        Ext.Ajax.request({
                            url: "/cgi-bin/img_mgmt.tcl"
                            ,method: "POST"
                            ,params: postParams
                            ,success: function(jsonResult) {
                                var jsonData = Ext.decode( jsonResult.responseText );
                                if( jsonData.success != 'true' ){
                                    mask.hide();
                                    Ext.getCmp('fu_status_field').setValue("Failed to extract file "+Ext.getCmp("upload_file").originalFileName);
                                    Ext.getCmp("btn-cancel").enable();
                                }
                                else {
                                    CP.IMG_mgmt.runExtracting(mask);
                                }
                            }
                        });                        
                        
						
					}
					,onUploadStarted: function(){
					}
				
				}
				
				//End Data Overview
				];
    var form = Ext.create( 'CP.WebUI4.Panel',{
        id: 'mgmt_import_form',
        height:300,
		border: false,
		items: items
	});
    return form;
	//return items;
}

,doDownload: function( formType ){
	location.href =  _sstr+"/cgi-bin/img_export.tcl?file="+CP.IMG_mgmt.download_file;
}

,getExportForm: function() {

    var storeExport = Ext.create( 'CP.WebUI4.JsonStore',{
        autoLoad: false,
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/img_mgmt.tcl?operation=export',
            reader: {
                type: 'json',
                root: 'data.manual'
            }
        }
        ,fields: ["img_name" , {name:"img_state",type:'int'}]
		,listeners: {
            load: function( store, records, options ) {
				var i = 0;
				var count = store.getTotalCount();
				for (i; i< count ;i++) {
					if (store.getAt(i).get("img_state") != 100) {
						CP.IMG_mgmt.runCreationProgressTask(store.getAt(i).get("img_name"),"export-grid","status_export",CP.IMG_mgmt.IMG_mgmt_params.exporting_run_interval);
						break;
					}
                    Ext.getCmp('fu_status_field').setValue();
					//Ext.getCmp("btn-ok").enable();
				}
			}
        }
    });

    function displayProgress(val){
        var id = Ext.id();
        if( val == 100 ){ //proccess completed display success icon instead
            return '<div class="icon-ok-grid-progress"></div>';
        }
        else{
            var origVal = val;
            val = val / 100;
            
            var progBar = Ext.getCmp( CP.IMG_mgmt.progCurrentId );
            if( progBar ){
                progBar.updateText( origVal +'%' );
                progBar.updateProgress( val );
                return;
            }
            else{
                CP.IMG_mgmt.progCurrentId = id; //save for later
                Ext.Function.defer( function(){
                    var bar = new Ext.ProgressBar({
                        height: 18,
                        animate:    false,
                        text:   origVal + "%",
                        renderTo: id,
                        value: val
                    });
                },25);
            }
        }
        return (Ext.String.format('<div id="{0}"></div>', id));
    }
    
    // Column Model
	var cm =  [
            //{header: "Name"			,dataIndex: "img_name"			,editable:false},
            {
                header : "Status",
                dataIndex : "img_state",
                sortable: false,
                menuDisabled:true,
                flex:1,
                renderer: displayProgress
//              todo add to renderer =>  textPst : "%", // string added to the end of the cell value (defaults to "%")
//                actionEvent: "click" // click event (defaults to "dblclick")
            }
        ];
	var gridPExport = Ext.create( 'CP.WebUI4.GridPanel',{
		id:"export-grid"
        ,autoHeight: false
        ,height:50
        ,maxHeight: 120
        ,width: 300
        ,store: storeExport
        ,columns: cm
    });
	
    //var spacer = new Ext.Spacer({height: 20 });
	var form = Ext.create( 'CP.WebUI4.Panel',{
		id: 'mgmt_export_form',
        height:170,
		labelWidth: 70,
		border: false,
		items: [{
					xtype: "cp4_displayfield"
					,value: "Export and download an existing image."
					,hideLabel:true
				},
				//spacer,
				gridPExport,
				{
					xtype: "cp4_button"
					,id	 : "btn_start_export"
					,text: "Start Export"
					,disabled: false
					,handler: function (){ 
											//supress failure errors
											CP.global.supress_update_msg = 1;
											var postParams = {trigger:"export-btn"};
											Ext.getCmp('btn_start_export').disable();
											CP.IMG_mgmt.IMG_mgmt_params.isCurrentlyExporting = 1;
											var s = Ext.getCmp("main-grid").getSelectionModel().getLastSelected();
											postParams.name = s.get("img_name");
											
											Ext.getCmp("export-grid").getStore().removeAll(true);	
											
                                            func = Ext.Function.bind(
                                                                    CP.IMG_mgmt.runCreationProgressTask,
                                                                    this,
                                                                    [postParams.name,"export-grid","status_export",CP.IMG_mgmt.IMG_mgmt_params.exporting_run_interval]
                                                                    ); 
									
											/*
											 * Send Ajax request to start the export process
											*/
											Ext.Ajax.request({
												url: "/cgi-bin/img_mgmt.tcl"
												,method: "POST"
												,params: postParams
												,success: function(jsonResult) {    
													var jsonData = Ext.decode(jsonResult.responseText);
													if (jsonData.success == "false") {
														CP.util.setStatusMsg( jsonData );
                                                        Ext.getCmp("btn-ok").enable();
														Ext.getCmp('btn_start_export').enable();
														CP.IMG_mgmt.IMG_mgmt_params.isCurrentlyExporting = 0;
													}

													if (jsonData.success == "true" && func != null){
														func();
													}
												}
												,failure: function(jsonResult) {
													Ext.getCmp('btn_start_export').enable();
													CP.IMG_mgmt.IMG_mgmt_params.isCurrentlyExporting = 0;
												}
											});
											
											//Ext.getCmp('export-grid').getStore().reload();										
										}
				}
				,
				{
					xtype: 'cp4_button',
					id: 'download_btn',
					margin: '0 0 0 15',
					hidden : true,
					text: 'Download',
					handler: CP.IMG_mgmt.doDownload

				}	
				]
	});
	return form;
}


,handleOK: function(buttonId){
	var s = Ext.getCmp("main-grid").getSelectionModel().getLastSelected();
	
	var postParams = {trigger:buttonId};
	var func = null;
    
	if (buttonId == "remove-btn")
	{
		postParams.name = s.get("img_name");
        func = Ext.Function.bind(
                                 CP.IMG_mgmt.runRemoveUpdateTask,
                                 this,
                                 [postParams.name]
                                 ); 
	}
	else if (buttonId == "revert-btn")
	{
		postParams.name = s.get("img_name");
	}
	else if (buttonId == "new-image-btn")
	{
		postParams.name = Ext.getCmp("tf-name").getValue();
		if (Ext.getCmp("tf-desc").getValue() != "")
			postParams.additional = Ext.getCmp("tf-desc").getValue();
        func = Ext.Function.bind(
                                 CP.IMG_mgmt.runCreationProgressTask,
                                 this,
                                 [postParams.name,"main-grid","status",CP.IMG_mgmt.IMG_mgmt_params.creation_run_interval]
                                 ); 
        Ext.getCmp("main-grid").setLoading(true, true);
    	CP.IMG_mgmt.disableBBarButtons();
	}
	else if (buttonId == "import-btn")
	{
		var fileName = Ext.getCmp("upload_file").originalFileName;
		var arrfileName = fileName.split(".");
		postParams.name = arrfileName[0];
        func = Ext.Function.bind(
                                 CP.IMG_mgmt.runCreationProgressTask,
                                 this,
                                 [postParams.name,"main-grid","status",CP.IMG_mgmt.IMG_mgmt_params.creation_run_interval]
                                 ); 
	}
	else if (buttonId == "export-btn")
	{
		// Meanwhile Close the window
		var win = Ext.getCmp("img-mgmt-modal-window");
		if (win != undefined) win.close();
		//enable failure errors
		CP.global.supress_update_msg = 0;
		return;
	}
	Ext.getCmp("main-grid").getSelectionModel().clearSelections();
	
	Ext.Ajax.request({
		url: "/cgi-bin/img_mgmt.tcl"
		,method: "POST"
		,params: postParams
		,success: function(jsonResult) {  
			var jsonData = Ext.decode(jsonResult.responseText);
      if (jsonData.success == "false") {
				Ext.getCmp("main-grid").setLoading(false);
			  CP.util.setStatusMsg( jsonData );
        CP.IMG_mgmt.enableBBarButtons();
      }
			if (jsonData.success == "true" && func != null){
				func();
			}
			if (buttonId == "revert-btn" && jsonData.success == "true") {
									CP.util.rebootingWindow('Reverting System',
														    'Please wait while system is reverting.',
														    30000);
			}
		}
	});
	var win = Ext.getCmp("img-mgmt-modal-window");
	if (win != undefined)
		win.close();
}

// history main grid
,addMainTable: function(obj) {
	var showWindow = function(buttonId) {
		var winTitle = "";
		var additionalItem = [];
		var okDisabled = false;
		
		var popup = Ext.getCmp('img-mgmt-modal-window');
		if( !popup ){
			popup = CP.IMG_mgmt.createModalWindow();
		}
		
		Ext.getCmp('img-mgmt-modal-window').setHeight(200) ;
		
		var okButton = Ext.getCmp( 'btn-ok' );
		var cancelButton = Ext.getCmp( 'btn-cancel');
		
		Ext.getCmp( 'additional_item_panel').removeAll();
		if (buttonId == "remove-btn") {
			winTitle = "Delete Image";
			okButton.enable();
            
		}
		else if (buttonId == "revert-btn") {
			winTitle = "Revert";
			additionalItem = CP.IMG_mgmt.getRevertTable();
			okButton.enable();
			
			Ext.getCmp('img-mgmt-modal-window').setHeight(300) ;
		}
		else if (buttonId == "new-image-btn")
		{
			winTitle = "New Image";
			additionalItem = CP.IMG_mgmt.getCreationForm();
			okButton.disable();
		}
		else if (buttonId == "import-btn")
		{
			winTitle = "Import Image";
			additionalItem = CP.IMG_mgmt.getImportForm();
			okButton.disable();
			cancelButton.enable();
			Ext.getCmp('img-mgmt-modal-window').setHeight(220) ;
		}
		else if (buttonId == "export-btn")
		{
            var s = Ext.getCmp("main-grid").getSelectionModel().getLastSelected();
			winTitle = "Export Image (" +s.get("img_name") + ")";
			additionalItem = CP.IMG_mgmt.getExportForm();
			okButton.disable();
			if( CP.IMG_mgmt.IMG_mgmt_params.isCurrentlyExporting){
				Ext.getCmp('btn_start_export').disable();
			}
			cancelButton.enable();
			Ext.getCmp('btn-cancel').setText("Hide");
			Ext.getCmp('img-mgmt-modal-window').setHeight(260) ;
		}
        okButton.setHandler( 
                            Ext.Function.bind(
                                 CP.IMG_mgmt.handleOK,
                                 this,
                                 [buttonId]
                            )
        );
                        
		Ext.getCmp( 'additional_item_panel').add( additionalItem );
        
		popup.setTitle( winTitle );
		popup.show();

	};
   
var store = Ext.create( 'CP.WebUI4.JsonStore',{

        proxy: {
            type: 'ajax',
            url: '/cgi-bin/img_mgmt.tcl',
            reader: {
                type: 'json',
                root: 'data.manual'
            }
        },
        fields: [
            {name: "img_name"} 
            ,{name: "img_description"}
            ,{name: "img_created"} 
			,{name: "img_size"} 
            ,{name: "img_version"}
            ,{name: "img_state"}
        ]
		,listeners: {
			beforeload: function( store, records, options ){
				CP.IMG_mgmt.disableBBarButtons();
			},
            load: function( store, records, options ) {
				var i = 0;
				var count = store.getTotalCount();
				for (i; i< count ;i++) {
					if (store.getAt(i).get("img_state") != 100) {
				        Ext.getCmp("main-grid").setLoading(true, true);
						CP.IMG_mgmt.runCreationProgressTask(store.getAt(i).get("img_name"),"main-grid","status",CP.IMG_mgmt.IMG_mgmt_params.creation_run_interval );
						break;
					}
				}
				if ((i == count) && (CP.global.token != -1)){
					CP.IMG_mgmt.enableBBarButtons();
					CP.UI.setReadOnlyPageMode(CP.UI.getMyObj(), null);
					CP.UI.enableReadOnlyPage();
				}
				else if ((i < count) && (CP.global.token == -1))
					CP.UI.setReadOnlyPageMode(CP.UI.getMyObj(), null);
			}
        }
    });
    
    function displayProgress(val){

        var id = Ext.id();
        if( val == 100 ){ //proccess completed display success icon instead
            return '<div class="icon-ok-grid-progress"></div>';
        }
        else{
            var origVal = val;
            val = val / 100;
            
            var progBar = Ext.getCmp( CP.IMG_mgmt.progCurrentId );
            if( progBar ){
                progBar.updateText( origVal +'%' );
                progBar.updateProgress( val );
                return;
            }
            else{
                CP.IMG_mgmt.progCurrentId = id; //save for later
                Ext.Function.defer( function(){
                    var bar = new Ext.ProgressBar({
                        height: 18,
                        animate:    false,
                        text:   origVal + "%",
                        renderTo: id,
                        value: val
                    });
                },25);
            }
        }
        return (Ext.String.format('<div id="{0}"></div>', id));
    }
	
    // Column Model
	var cm =  [
             {header: "Name"			,dataIndex: "img_name"			,width:110}
            ,{header: "Description"		,dataIndex: "img_description"	,flex:1}
			,{header: "Created"			,dataIndex: "img_created"		,width:140
				  ,renderer: function(serverFormat){
						var serverFormatArr = serverFormat.split(" ");
						var len = serverFormatArr.length;
						var i=0;

						/* remove entries with null content */
						while (i<len) {
							if (!serverFormatArr[i]) {
								serverFormatArr.splice(i,1);
								len--;
							}
							else i++;
						}

						var day		   = ( len > 0 ) ? serverFormatArr[0] : ' ';
						var serverTime     = ( len > 3 ) ? serverFormatArr[3] : ' ';
						var dd		   = ( len > 2 ) ? serverFormatArr[2] : ' ';
						var yy		   = ( len > 4 ) ? serverFormatArr[4] : ' ';
						var mm		   = ( len > 1 ) ? serverFormatArr[1] : ' ';

						switch (mm){
							//JAN/FEB MAR/APR MAY/JUN JUL/AUG SEP/OCT NOV/DEC
							case 'Jan': mm = 1; break;
							case 'Feb': mm = 2; break;
							case 'Mar': mm = 3; break;
							case 'Apr': mm = 4; break;
							case 'May': mm = 5; break;
							case 'Jun': mm = 6; break;
							case 'Jul': mm = 7; break;
							case 'Aug': mm = 8; break;
							case 'Sep': mm = 9; break;
							case 'Oct': mm = 10;break;
							case 'Nov': mm = 11;break;
							case 'Dec': mm = 12;break;
						}
					
						return CP.util.dateToStr(dd,mm,yy) + " " + CP.util.displayTime(serverTime);
						
				}
			}
			,{header: "Size"			,dataIndex: "img_size"			,width:60}
			,{header: "Version"			,dataIndex: "img_version"		,width:60}
			//,progressColumn --> replace by the following
            ,{
                header : "State",
                dataIndex : "img_state",
                sortable: false,
                menuDisabled:true,
				width:100,
                renderer: displayProgress,
                listeners: {
                render: function(){

            }
            }
//              todo add to renderer =>  textPst : "%", // string added to the end of the cell value (defaults to "%")
//                actionEvent: "click" // click event (defaults to "dblclick")
            }            
            
        ];
	
    var gridP = Ext.create( 'CP.WebUI4.GridPanel',{
	id:"main-grid"
	,height:120
        ,maxHeight: 120
        ,store: store
        ,columns: cm
		//,sm: rowSelect
        ,listeners: {
            selectionchange: function(sm, row, rec) {
            	//check that new-image-btn is not disabled, that can happen if we 
            	//don't have conflock or if image is created now
            	if (!Ext.getCmp("new-image-btn").isDisabled()){
                    Ext.getCmp("remove-btn").enable();
                    Ext.getCmp("revert-btn").enable();
                    Ext.getCmp("export-btn").enable();
            	}
            }

        }
		,defaults: {
            columnWidth: 0.5
            ,layout: "form"
            ,border: false
            ,xtype: "cp4_panel"
            ,bodyStyle: "padding:0 18px 0 0"
        }
    });
	
    //Add buttons to panel
    var buttonsBar = Ext.create( 'CP.WebUI4.BtnsBar',{
		layout : 'hbox',
		width : 380,
		items: [{
			id: "new-image-btn",
			text: "New",
			handler: 
            Ext.Function.bind(
                                 showWindow,
                                 this,
                                 ["new-image-btn"]
                            )
		},{
			id: "revert-btn",
			text: "Revert",
			disabled: true,
			handler: 
                        Ext.Function.bind(
                                 showWindow,
                                 this,
                                 ["revert-btn"]
                            )
		},{
			id: "remove-btn",
			text: "Delete",
			disabled: true,
			handler: function(){
				CP.WebUI4.Msg.show({
					title:'Delete Image',
					msg: 'Are you sure you want to delete the selected image?',
					buttons: Ext.Msg.OKCANCEL,
					icon: 'webui-msg-question',
					fn: function(btn, text){
						if (btn == "cancel")
							return;
						
						var s = Ext.getCmp("main-grid").getSelectionModel().getLastSelected();
						Ext.getCmp("main-grid").getSelectionModel().deselectAll();
						
						if (!s)
							return;
						var img_name = s.get("img_name");
						
						Ext.Ajax.request({
							url: "/cgi-bin/img_mgmt.tcl"
							,method: "POST"
							,params: {trigger:"remove-btn", name:img_name}
							,success: function(jsonResult) {    
								var jsonData = Ext.decode(jsonResult.responseText);
								if (jsonData.success == "false") {
			                                            CP.util.setStatusMsg( jsonData );
                                                                }
								if (jsonData.success == "true"){
									CP.IMG_mgmt.runRemoveUpdateTask(img_name);
								}
							}
						});
					}
				});
			}
		},{
			id: "import-btn",
			text: "Import",
			disabled: false,
			handler: 
                           Ext.Function.bind(
                                 showWindow,
                                 this,
                                 ["import-btn"]
                            )
			
		},{
			id: "export-btn",
			text: "Export",
			disabled: true,
			handler: 
                            Ext.Function.bind(
                                 showWindow,
                                 this,
                                 ["export-btn"]
                            )
		}]
    });
	
    var buttonsBarWrapper = Ext.create( 'CP.WebUI4.Panel',{
        layout : 'hbox',
		items: [buttonsBar,{
			id : 'hlp_icon',
			height : 21,			
			xtype : 'cp4_panel',
			listeners: {
				afterrender: function() {
					Ext.create( 'CP.WebUI4.ToolTip' ,{
						target: 'hlp_icon',
						html: 'For information about snapshot management refer to <a href="https://supportcenter.checkpoint.com/supportcenter/portal?eventSubmit_doGoviewsolutiondetails=&solutionid=sk98068">sk98068.</a>',
						height : 40,
						dismissDelay:0
					});
				}
			},
			html : '<img style=\"vertical-align: bottom; margin-top:5px !important\" src=\"../../images/comp/modals/tooltip.png\" width="16" height="16"/>'
		}]
	});
	
	obj.add( buttonsBarWrapper );
	
	//Add grid to panel
	obj.add(gridP);
},

createModalWindow: function(){
	
    var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
		id: 'img-mgmt-modal-window',
		name: 'img-mgmt-modal-window',
        width:  450,
		height: 200,
		title: '',
		closable: false,
		items: [{
			xtype: 'cp4_formpanel',
			id: 'additional_item_panel',
			bodyPadding: 15,
			buttons: [{
                xtype: "cp4_button"
                ,id:"btn-ok"
                ,text: "OK"
            },{
                xtype: "cp4_button"
                ,id:"btn-cancel"
                ,text: "Cancel"
                ,handler: function (){ 
					Ext.getCmp('img-mgmt-modal-window').close(); 
					//enable failure errors
					CP.global.supress_update_msg = 0;
					}
            }]
		}]
	});
    
	return modalWin;
},

disableBBarButtons: function(){
		Ext.getCmp('new-image-btn').disable();
		Ext.getCmp('revert-btn').disable();
		Ext.getCmp('remove-btn').disable();
		Ext.getCmp('import-btn').disable();
		Ext.getCmp('export-btn').disable();
},

enableBBarButtons: function(){
		Ext.getCmp('new-image-btn').enable();
		Ext.getCmp('import-btn').enable();
		if (Ext.getCmp("main-grid").getSelectionModel().hasSelection()){
			Ext.getCmp('revert-btn').enable();
			Ext.getCmp('remove-btn').enable();
			Ext.getCmp('export-btn').enable();
		}
	}


}
