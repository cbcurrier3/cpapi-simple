CP.raid_monitor = {

REFRESH_TASK: null,

renderStatusDiskIcon: function(val, meta, record) {
	var cls = "";
	if(record.data.disk_state == "") {
		return val;
	}
	else if(record.data.disk_state == "ONLINE") {
		cls = "raid-status-ok";
	} 
	else {
		cls = "raid-status-warning";
	}
	return '<div class="'+ cls +'">'+ val +'</div>';
},

renderStatusVolIcon: function(val, meta, record) {
	var cls = "";
	if(record.data.volume_state == "") {
		return val;
	}
	else if(record.data.volume_state == "OPTIMAL") {
		cls = "raid-status-ok";
	} 
	else if (record.data.volume_state == "DEGRADED"){
		cls = "raid-status-warning";
	}
	else{
		cls = "raid-status-error";
	}

	return '<div class="'+ cls +'">'+ val +'</div>';
},

BuildRaidMonitorPage : function(formPanel)
{

	Ext.define('VolumeDataModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'volume_state', type: 'string'},
        {name: 'volume_id',  type: 'string'},
        {name: 'volume_type',       type: 'string'},
		{name: 'volume_disks',  type: 'string'},
        {name: 'volume_size',       type: 'string'},
		{name: 'volume_flags',  type: 'string'}
    ]
	});
	Ext.define('DiskDataModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'disk_state', type: 'string'},
        {name: 'disk_id',  type: 'string'},
        {name: 'disk_number',       type: 'string'},
		{name: 'disk_vendor',  type: 'string'},
        {name: 'disk_product',       type: 'string'},
		{name: 'disk_revision',       type: 'string'},
		{name: 'disk_size',  type: 'string'},
        {name: 'disk_flags',       type: 'string'},
		{name: 'disk_sync_state',  type: 'string'}
    ]
	});

    var vg = [
		{header: 'State' ,dataIndex:'volume_state', flex:1, renderer: CP.raid_monitor.renderStatusVolIcon},
		{header: 'Volume ID' ,dataIndex:'volume_id', flex:1 },
        {header: 'Type' ,dataIndex:'volume_type', flex:1 },
		{header: 'Disks' ,dataIndex:'volume_disks', flex:1 },
		{header: 'Size' ,dataIndex:'volume_size', flex:1 },
		{header: 'Flags' ,dataIndex:'volume_flags', flex:1 }
    ];  
	
	var dg = [
		{header: 'State' ,dataIndex:'disk_state', flex:1, renderer: CP.raid_monitor.renderStatusDiskIcon},
		{header: 'Id' ,dataIndex:'disk_id', flex:1 },
		{header: 'Number' ,dataIndex:'disk_number', flex:1 },
		{header: 'Vendor' ,dataIndex:'disk_vendor', flex:1 },
		{header: 'Product' ,dataIndex:'disk_product', flex:1 },
		{header: 'Revision' ,dataIndex:'disk_revision', flex:1 },
		{header: 'Size' ,dataIndex:'disk_size', flex:1 },
		{header: 'Flags' ,dataIndex:'disk_flags', flex:1 },
		{header: 'Sync state' ,dataIndex:'disk_sync_state', flex:1 }
    ]; 

    var DiskStore = Ext.create( 'CP.WebUI4.JsonStore',{
		
		model: 'DiskDataModel',
		data : [ {disk_id: '', disk_number: '', disk_vendor: '', disk_product: '', disk_revision: '', disk_size: '', disk_state: '', disk_flags: '', disk_sync_state: '' } ]
    });

	var VolStore = Ext.create( 'CP.WebUI4.JsonStore',{
		
		model: 'VolumeDataModel',
		data : [ {volume_id: '', volume_type: '', volume_disks: '', volume_size: '', volume_state: '', volume_flags: '' } ]
    });

    var volumesGrid = Ext.create( 'CP.WebUI4.GridPanel',{
        id: 'raid_mon_vol_tbl'
        ,height: 80
        ,width: 800
        ,store: VolStore
        ,columns: vg
    });
	
	var disksGrid = Ext.create( 'CP.WebUI4.GridPanel',{
        id: 'raid_mon_disk_tbl'
        ,height: 220
        ,width: 800
        ,store: DiskStore
        ,columns: dg
    });

    var raidVolumeMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'raid_mon_vol_msg'
        ,titleText: 'RAID Volumes'
    });
	var raidDiskMessage = Ext.create('CP.WebUI4.SectionTitle',{
		id : 'raid_mon_disk_msg'
        ,titleText: 'RAID Volume Disks'
    });

	formPanel.add(raidVolumeMessage);
	formPanel.add(volumesGrid);
	formPanel.add(raidDiskMessage);
	formPanel.add(disksGrid);	
},

init: function() {

    var RaidMonitorPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    	id:"raid_monitor_panel"
        ,items: []
    });
	
    var page = {
        title:"Raid Monitor"
        ,panel: RaidMonitorPanel
    };
	
	CP.raid_monitor.BuildRaidMonitorPage(RaidMonitorPanel);
	CP.UI.updateDataPanel(page,CP.global.monitor);
	
	if ( CP.raid_monitor.REFRESH_TASK == null ) {
				CP.raid_monitor.REFRESH_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/raid_mon.tcl','GET', CP.raid_monitor.refreshGrid,CP.global.GridRefreshRate);
				Ext.TaskManager.start(CP.raid_monitor.REFRESH_TASK);
	}
	
	Ext.getCmp('raid_mon_disk_tbl').setLoading(true);
	Ext.getCmp('raid_mon_vol_tbl').setLoading(true);
	
	RaidMonitorPanel.doComponentLayout();
},

refreshGrid: function(jsonResult) {
	var jsonData = Ext.decode(jsonResult.responseText);
	var disk_grid = Ext.getCmp('raid_mon_disk_tbl');
	var vol_grid = Ext.getCmp('raid_mon_vol_tbl' );

	if(vol_grid) {
		vol_grid.setLoading(false);
		var vol_store = vol_grid.getStore();
		if(vol_store) {
			vol_store.loadRawData(jsonData.data);
		}
	}
	
	if(disk_grid) {
	disk_grid.setLoading(false);
		var disk_store = disk_grid.getStore();
		if(disk_store) {
			disk_store.loadRawData(jsonData.data.volume_disk_list);
		}
	}
	
	var panel = Ext.getCmp( 'raid_monitor_panel' );
	if (panel){	
		panel.doComponentLayout();
	}
}

}
