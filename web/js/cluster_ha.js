CP.Cluster = {

init: function() {
	
	var fhaSettingsTitle = Ext.create('CP.WebUI4.SectionTitle',{
		titleText: 'Full High Availability Cluster'
	});

	var fhaRemoveTitle = Ext.create('CP.WebUI4.SectionTitle',{
		titleText: 'Remove Peer From Cluster'
	});
	var fhaClusterInfo = Ext.create('CP.WebUI4.SectionTitle',{
		titleText: 'Cluster information'
	});
	
	var clusterPanel = Ext.create('CP.WebUI4.DataFormPanel', {
		id:"cluster-panel"
		,items: [
		    fhaClusterInfo			
			,{
				xtype:"cp4_displayfield"
				,id:'cluster_type'
				,name: 'clusterType'
                ,fieldLabel:"Cluster Type"
                	  ,labelWidth : 70
                      ,width      : 255

			},fhaSettingsTitle
			,{
		 		xtype: 'cp4_inlinemsg',
		 		type: 'info',
				text: 'Configure this machine as part of a cluster.Verify SYNC interfaces on each cluster member are connected .'
		 	}
			,{
				xtype: 'cp4_button',
				id: 'cluster_enable',
	            name: 'clusterEnable',
				style: 'margin-top:10px;',
				text: 'Make this machine the primary member of a cluster.',
				disabled:true,
				handler: function(btn, evt){
					var pageObj = CP.UI.getMyObj();
				    pageObj.params = {}; //clear out old form params
				    pageObj.params = {save:1};
				    pageObj.params.apply = 1;
				    pageObj.params.clusterEnable = true;
					CP.Cluster.waitMask.show();
					CP.UI.submitData( pageObj );
				}				
		    }
			,fhaRemoveTitle
			,{
		 		xtype: 'cp4_inlinemsg',
		 		type: 'info',
				text: 'Removing the peer results in a Stand Alone machine. Before removing the peer, go to SmartConsole and right-click on the Cluster member that you wish to remove. Use the \"Where Used\" option to understand how the peer is currently used, and the implications of removing it.'
		 	},{
		 		xtype: 'cp4_button',
				id: 'fha_remove',
				style: 'margin-top:10px;',
				text: 'Remove Peer',
				disabled:true,
				 handler: function(btn, evt){
                     var pageObj = CP.UI.getMyObj();
                     pageObj.params = {}; //clear out old form params
                     pageObj.params = {save:1};
                     pageObj.params.apply = 1;
                     pageObj.params.clusterDeletePeer = true;
					 CP.Cluster.waitMask.show();
                     CP.UI.submitData( pageObj );
             }
			}
		],
		listeners: {
			render: CP.Cluster.doLoad
		}
	});
	
	var page = {
		title:"Cluser"
		,panel: clusterPanel
	    , submit:true
		,submitURL:"/cgi-bin/full_ha.tcl"
		,params:{}
	    ,beforeSubmit:CP.Cluster.beforeSubmit
		,afterSubmit:CP.Cluster.afterSubmit
		,submitFailure : CP.Cluster.submitFailure
	};
	
	CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel){
	Ext.Ajax.request({
        url: '/cgi-bin/full_ha.tcl'
        , method: 'GET'
        , success: function(response) {        	
        	var jsonData = Ext.decode(response.responseText);
            if (jsonData.data.is_fullHA == "true") {
            	Ext.getCmp('fha_remove').setDisabled(false);
            	Ext.getCmp('cluster_enable').setDisabled(true);
            } else{
            	Ext.getCmp('fha_remove').setDisabled(true);
            	Ext.getCmp('cluster_enable').setDisabled(false);
			}
            if (jsonData.data.clusterType == "none") {
				Ext.getCmp('fha_remove').setDisabled(true);
				Ext.getCmp('cluster_enable').setDisabled(true);
			} else{
            	Ext.getCmp('cluster_type').setValue(jsonData.data.clusterType);
            }
            CP.util.clearFormDirtyFlag( "cluster-panel" ); //clear dirty flag
        }
        , failure: function() {
        }
});
},
beforeSubmit:function(panel){
},

afterSubmit:function(form, action){
	CP.Cluster.waitMask.hide();
	if(!Ext.getCmp ("fha_remove").isDisabled()){
		Ext.getCmp ("fha_remove").disable ();
		Ext.getCmp ("cluster_enable").setDisabled(false);
		CP.WebUI4.Msg.show({
			title: 'Deleteing Cluster',
        icon: 'webui-msg-info',
        animEl: 'elId',
        msg: "This change will take effect after restarting Check Point products.",
        buttons: Ext.Msg.OK
		});
	} else {
		Ext.getCmp ("cluster_enable").disable ();
		Ext.getCmp ("fha_remove").setDisabled(false);
	}
}
,waitMask: new Ext.LoadMask(Ext.getBody(), {msg:"Operation in progress please wait..."})
,submitFailure: function(){
	CP.Cluster.waitMask.hide();
}
}


