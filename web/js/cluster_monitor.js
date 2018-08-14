
CP.cluster_monitor = {

REFRESH_TASK: null,


renderClusterMember: function(val, meta, record) {
	var cls = "";
	
	if(record.data.member_type == "local") {
		cls = "member-local";
	} else if(record.data.is_up) {
		cls = "member-up";
	} else {
		cls = "member-down";
	}
	
	return '<div class="'+ cls +'">'+ val +'</div>';
},


BuildClusterMonitorPage : function(formPanel,jsonData)
{
    var cm = [
		{header: 'Member Name' ,dataIndex:'member_name', flex:1 , renderer: CP.cluster_monitor.renderClusterMember},	
        {header: 'IPv4 Address' ,dataIndex:'member_addr', flex:1 },
		{header: 'Model' ,dataIndex:'member_model', flex:1 },
		{header: 'Up Time' ,dataIndex:'member_uptime', flex:1 },
		{header: 'OS Version' ,dataIndex:'member_os_ver', flex:1 }
    ];  

    var ClusterMembers = Ext.create( 'CP.WebUI4.JsonStore',{
		proxy: 'memory'
		,data : jsonData.data.cluster_members
        ,fields: ['member_addr',
				 'member_name',
				 'member_uptime',
				 'member_model',
				 'is_up',
				 'member_os_ver'
				 ]
    });  
	
    var membersGrid = Ext.create( 'CP.WebUI4.GridPanel',{
        id: 'cluster_mon_members_tbl'
        ,height: 220
        ,width: 800
        ,store: ClusterMembers
        ,columns: cm
    });
	
    var ClusterMonitorMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'ClusterMonitorMessage',
        titleText: 'Cloning Group Monitor'
    });
	
	var RefreshBtn = Ext.create( 'CP.WebUI4.Button', {
		text: 'Refresh',
		xtype: 'cp4_button',
		margin : '10 0 15 0',
		handler: function(){
			Ext.Ajax.request({
				url: '/cgi-bin/cluster_monitor.tcl',
				method: 'GET',
				success: function (jsonResult){			
						CP.cluster_monitor.refreshGrid(jsonResult);
					}
				});
		}
	});		
	
	formPanel.add(ClusterMonitorMessage);
	formPanel.add(RefreshBtn);
	formPanel.add(membersGrid);
},


init: function() {	
		
    var ClusterMonitorPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"cluster_monitor_panel"
        ,items: []
    });
       
    var page = {
        title:"Cloning Group"
        ,panel: ClusterMonitorPanel
        ,related : [{
			page: 'tree/cluster_config',
			tab: CP.global.config,
			displayName: 'Cloning Group Configuration'
		}]		
    };
	
	Ext.Ajax.request({
        url: '/cgi-bin/cluster_monitor.tcl',
        method: 'GET',
		success: function (jsonResult){
			var jsonData = Ext.decode(jsonResult.responseText);
		
			CP.cluster_monitor.BuildClusterMonitorPage(ClusterMonitorPanel,jsonData);

			if ( CP.cluster_monitor.REFRESH_TASK == null ) { 
				CP.cluster_monitor.REFRESH_TASK = CP.util.createFrequentRequestRunnable(
					'/cgi-bin/cluster_monitor.tcl', 'GET', CP.cluster_monitor.refreshGrid,  CP.global.GridRefreshRate);
				Ext.TaskManager.start(CP.cluster_monitor.REFRESH_TASK);
			}
			CP.UI.updateDataPanel(page,CP.global.monitor);
		}
    });	
},


liveResponseToMappedArray: function(liveResponse) {
	
	var resp_array = [];
	liveResponse = liveResponse.split("\r");

	for(var i = 0;i < liveResponse.length;i++) {
		if(i%2 == 0) {
			var member_addr = liveResponse[i].substring(("Response from node ").length,liveResponse[i].length);
		} else {
			var down_test = 'Member ' + member_addr + ' is down. See "/var/log/messages".'
			var member_response = liveResponse[i];
			
			if(member_response == down_test) {
				member_response = "";
				var m_v = {member_addr : member_addr,
						   member_response : member_response,
							is_member_up : false};
			} else {
				var m_v = {member_addr : member_addr,
						   member_response : member_response,
							is_member_up : true};
			}
			resp_array.push(m_v);
		}
	}

	return resp_array;
},


refreshGrid: function(jsonResult) {
	var jsonData = Ext.decode(jsonResult.responseText);
	
	var grid = Ext.getCmp( 'cluster_mon_members_tbl' );
	    	
	if(grid) {
		var store = grid.getStore();
		if(store) {
			store.loadData(jsonData.data.cluster_members);
			
			//update the store with live values
		
			var cluster_live_uptime = Ext.htmlDecode(jsonData.data.cluster_live_uptime);
			var cluster_live_uptime_objs = CP.cluster_monitor.liveResponseToMappedArray(cluster_live_uptime);
			
			for(var i = 0;i < cluster_live_uptime_objs.length;i++) {
				var store_pos = store.findRecord("member_addr",cluster_live_uptime_objs[i].member_addr);
				if(store_pos) {
					store_pos.set("member_uptime",cluster_live_uptime_objs[i].member_response);
				}
			}
			
			var cluster_live_model = Ext.htmlDecode(jsonData.data.cluster_live_model);
			var cluster_live_model_objs = CP.cluster_monitor.liveResponseToMappedArray(cluster_live_model);
						
			for(var i = 0;i < cluster_live_model_objs.length;i++) {
				var store_pos = store.findRecord("member_addr",cluster_live_model_objs[i].member_addr);
				if(store_pos) {
					store_pos.set("member_model",cluster_live_model_objs[i].member_response);
					store_pos.set("is_up",cluster_live_model_objs[i].is_member_up);
				}
			}
			
			var cluster_live_os_ver_product = Ext.htmlDecode(jsonData.data.cluster_live_os_ver_product);
			var cluster_live_os_ver_product_objs = CP.cluster_monitor.liveResponseToMappedArray(cluster_live_os_ver_product);
						
			var cluster_live_os_ver_build = Ext.htmlDecode(jsonData.data.cluster_live_os_ver_build);
			var cluster_live_os_ver_build_objs = CP.cluster_monitor.liveResponseToMappedArray(cluster_live_os_ver_build);						
						
						
			for(var i = 0;i < cluster_live_os_ver_product_objs.length;i++) {
				var store_pos = store.findRecord("member_addr",cluster_live_os_ver_product_objs[i].member_addr);
				
				if(store_pos) {
					var version_str = cluster_live_os_ver_product_objs[i].member_response;
				
					for(var j = 0;j < cluster_live_os_ver_build_objs.length;j++) {
						if(cluster_live_os_ver_build_objs[j].member_addr == 
							cluster_live_os_ver_product_objs[i].member_addr) {
							version_str = version_str + " Build " + cluster_live_os_ver_build_objs[j].member_response;
							break;
						}
 					}
				
					store_pos.set("member_os_ver",version_str);
				}
			}			
			
			
			var store_pos = store.findRecord("member_addr",jsonData.data.cluster_localaddr);
			if(store_pos) {
				store_pos.set("member_name",store_pos.get("member_name") + " (local)");
			}
		}
		grid.doComponentLayout();
	}
},


}
