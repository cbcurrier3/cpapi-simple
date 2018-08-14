CP.License_Fetching = {
		activated : false ,
	    license_exist: false,
	    blades_retrieve : true,	
	    EXT4_PANEL_ID:'license_proxy_settings_form',
	    license_type:0,
	    is_mgmt_module:0,
	    
	    init: function() {
		 /*** proxy settings ***/
	    	var proxy_settings = Ext.create('CP.WebUI4.DataFormPanel', { 
                 id: CP.License_Fetching.EXT4_PANEL_ID
                , labelWidth: 65
                , width:350
                , margin: '0 0 0'
                , items: [	
                          {
                          	xtype: 'cp4_container'
  							, id: 'activate_now'
  							, name: 'activate'
  							, html:'Get a license automatically from UserCenter'
  							, width: 250
  							, style: 'padding-bottom:10px;padding-left: 15px;padding-top:5px'
                          }		              
  	                     ,{
	                              //apply button
	                              xtype: 'cp4_button',
	                              margin: '3 0 0 20',
	                              id: "activate_button",                               
	                              text: 'Get License',                                
	                              handler: function(e) {
	                            	  Ext.getCmp('inlinemsg_activation').setVisible(false);
	                            	  CP.License_Fetching.activate();
	                              }
  	                      }
  	                    
	                ],listeners:{
	                	render: function(panel){
	                		Ext.Ajax.request({
                	            url: "/cgi-bin/products_info.tcl"
                	            ,method: "GET"
                	            ,success: function(jsonResult) {                	            	
                	               var jsonData = Ext.decode(jsonResult.responseText);
                	               var is_mgmt_module=0;
                	               var is_gw_module=0;
                	               if(jsonData.data.is_mgmt=="true")
                	            	   is_mgmt_module=1;
                	               if(jsonData.data.is_gw=="true")
                	            	   is_gw_module=1;
                	               CP.License_Fetching.is_mgmt_module = is_mgmt_module;
                	               CP.License_Fetching.license_type=is_mgmt_module&is_gw_module;
                	            // Always provide mgmt ip, the form is never displayed. Provide loopback if gw only
                	            //   if(is_mgmt_module==0)					
                	            //	   Ext.getCmp('management_ip').setVisible(true);
                	               Ext.Ajax.request({
	       	         	   	            url: "/cgi-bin/license.tcl"
	       	         	   	            ,method: "GET"
	       	         	   	            ,success: function(action) {	       	         	   	            	
	       	         	   	            	var jsonResult = Ext.decode(action.responseText);
	       	         	   	            	if(jsonResult.data.status=="License OK."){
	       	                            			CP.License_Fetching.license_exist = true;	  
	       	                                 }
	       	         	   	            }
       	         	   	         }); 
                	            }
                	        });
	                	}
	                }
            }); 
	    	
	    	var blades_grid = CP.util.license.createFtwBladesGrid('blades_grid', 'show_blades', 600, 300);
			blades_grid.hidden = true;
			blades_grid.getStore().on('load', 
				function(r,successfull,options) {
		        		if(r.data.length > 0)
		        			Ext.getCmp('blades_grid').setVisible(true);
		        	}
			);
	    	
	    	var license_setting = Ext.create('CP.WebUI4.DataFormPanel', {	    	
	                  id: 'license_setting_form'
	                 , margin:'0 0 0'
	                 , items: [ 
							{
							    xtype : 'cp4_sectiontitle',
							    titleText : 'License Activation',
							    margin:'24 0 10 20'
							    
							},
		                   {
			              	   xtype: "cp4_panel", 
			             	   id:'license_setting_panel', 
			             	   layout: "hbox",
			             	   margin:'0 0 0 5',
			             	  /* width: 800 ,
			             	   height: 200,*/
			             	   items: [proxy_settings, blades_grid]				
		                   }, {
							    xtype: 'cp4_panel',
							    id:'inlinemsg_activation',
							     margin:'0 0 0 20',
							    style:"padding-top:20px",
							    autoScroll:true
							  },
						     {
							    xtype: 'cp4_formpanel',
							    id:'license_container',
							    height: 35,
							    margin:'0 0 0 20',
							    autoScroll:true,
							    scrollOffset:0,
							    hidden:true							
						     }
	                 ]
	 	     });
	    	
            var page = {
                    title : 'Activating Licenses'
                    ,panel: license_setting
                    ,submit:true
                    ,submitURL:"/cgi-bin/license_activation.tcl"
                    ,params:{}
            		,beforeSubmit:CP.License_Fetching.beforeSubmit
                    ,afterSubmit:CP.License_Fetching.afterSubmit
                    ,submitFailure : CP.License_Fetching.submitFailure
                };
				
             // 3. display the page
            CP.UI.updateDataPanel(page);
		},		
		beforeSubmit:function(panel){
		},
		afterSubmit:function(messages){
			if (!messages)
				return;
			Ext.getBody().unmask();
			Ext.getCmp('inlinemsg_activation').setVisible(true);
			if(messages[0]=="Save Successful"){
				CP.License_Fetching.license_type.activated=true;
				 //license string
				 if(CP.License_Fetching.license_type == 0){
					// Always provide mgmt ip, the form is never displayed. Provide loopback if gw only
					if(messages[3])
					//	 Ext.getCmp('inlinemsg_activation').update( '<p style="color:green;">'+messages[3]+ '&nbsp <br> Please copy the below license string and run in clish on Management machine:</p>');
					 Ext.getCmp('inlinemsg_activation').update( '<p style="color:green;">'+messages[3]+ '</p>');
					 Ext.getCmp('license_container').setVisible(true);
					 Ext.getCmp('license_container').setAutoScroll(true);
					 if(messages[4] && messages[4] != "FINISHED"){
						// Always provide mgmt ip, the form is never displayed. Provide loopback if gw only
						// if(messages[2])
						//	 Ext.getCmp('license_container').update( '<p style="color:green;">cplic put '+messages[2] + '</p>'+
						 Ext.getCmp('license_container').update('<p style="color:red;">'+messages[4]+'</p>');
						 CP.License_Fetching.blades_retrieve=false;
					 }
					 else{
						 // Always provide mgmt ip, the form is never displayed. Provide loopback if gw only
						 //if(messages[2])
						 //	 Ext.getCmp('license_container').update( '<p style="color:green;">cplic put '+messages[2] + '</p>');
						 CP.License_Fetching.blades_retrieve=true;
							Ext.getStore("show_blades").load();
					 }
				 } else{	
					if(messages[3] && messages[3] != "FINISHED"){
						if(messages[2])
						 Ext.getCmp('inlinemsg_activation').update( '<p style="color:green;">'+messages[2]+'</p>'+
							 '<p style="color:red;">'+messages[3]+'</p>');
						CP.License_Fetching.blades_retrieve=false;
				    }
				    else{
				    	if(messages[2])
				    		Ext.getCmp('inlinemsg_activation').update( '<p style="color:green;">'+messages[2]+'</p>');
				    	CP.License_Fetching.blades_retrieve=true;
				    	Ext.getStore("show_blades").load();
				    }
			    }
		 }
		 CP.util.clearFormInstanceDirtyFlag(Ext.getCmp(CP.License_Fetching.EXT4_PANEL_ID).getForm());
		},
		submitFailure:function(panel){
			Ext.getBody().unmask();
			CP.License_Fetching.blades_retrieve=false;
			CP.License_Fetching.activated=false;			
		},
		saveHandler: function( mgmt_ip ){
        //get params object
	        var pageObj = CP.UI.getMyObj();
	        pageObj.params = {}; //clear out old form params
	        var params = pageObj.params;
	        params["ftw_mgmt_ip"]=mgmt_ip;
	        params["ftw_license_type"]=CP.License_Fetching.license_type;
	        //submit form
	        Ext.getBody().mask("Contacting Check Point UserCenter, please wait...");
	        CP.UI.submitData( pageObj );
		},
		fetch_and_put_lic:function(mgmt_ip) {
			CP.License_Fetching.saveHandler(mgmt_ip);
		},
		activate :function() {
			Ext.getCmp('inlinemsg_activation').setVisible(false);
			Ext.getCmp('license_container').setVisible(false);			
			var mgmt_ip="";
			 if(CP.License_Fetching.is_mgmt_module==0){
				// Always provide mgmt ip, the form is never displayed. Provide loopback if gw only
				 mgmt_ip = "127.0.0.1"
          	   /*mgmt_ip =  Ext.getCmp('management_ip').getValue();
          	   if((CP.License_Fetching.license_type==0) && (mgmt_ip=="")){
	       				Ext.getCmp('inlinemsg_activation').setVisible(true);
	       				Ext.getCmp('inlinemsg_activation').update( '<p style="color:red;"> You must provide management Server IP</p>');
	       				return;
          	   } 
          	   */
             }//is_mgmt			
      	    	CP.License_Fetching.fetch_and_put_lic(mgmt_ip);
		}
}
