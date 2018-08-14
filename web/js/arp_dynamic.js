
CP.ArpDynamic = {
        
        EXT4_PANEL_ID: 'arp_dynamic_ext4_panel',
        TCL_REQUEST: '/cgi-bin/arp_dynamic.tcl',
        GRID_ID: 'arp_dynamic_main_grid',
		GRID_FLUSH_BTN_ID: 'arp_flush_button',
        
    //build the page
    init : function() {
        
        //1. create the page object
        var page = {
            title : 'ARP',
            related : [{
                page: 'tree/arp_static',
                tab: CP.global.config,
                displayName: 'Static ARP'
                }],
            params : {},
            submitURL : CP.ArpDynamic.TCL_REQUEST,
            afterSubmit : CP.ArpDynamic.doLoad,
			lock_event: CP.ArpDynamic.lock_event,
            //2. configure the properties for the panel and add it into the page object
            panel : Ext.create( 'CP.WebUI4.DataFormPanel', {
                id : CP.ArpDynamic.EXT4_PANEL_ID, //id is mandatory
                items : CP.ArpDynamic.getPageItems(),
                listeners: {
                    render: CP.ArpDynamic.doLoad
                }
            })
        };
        
        //3. display the page
        CP.UI.updateDataPanel(page, CP.global.monitor);
		if (CP.global.token == -1)
			Ext.getCmp(CP.ArpDynamic.GRID_FLUSH_BTN_ID).disable();
    },

    lock_event: function(locked) {
        if (locked) {
			Ext.getCmp(CP.ArpDynamic.GRID_FLUSH_BTN_ID).disable();
        } else {
            Ext.getCmp(CP.ArpDynamic.GRID_FLUSH_BTN_ID).enable();
        }
    },
    
    //get main structure of page items
    getPageItems: function(){
        
        //load grid store with roles data
        var arpDynamicStore = Ext.create( 'CP.WebUI4.Store', {
            fields: [ 'ipaddr', 'mac', 'depends' ],
            data: {data:{}},
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.arps',
                    successProperty: 'success'
                }
            }
        });
        
        //arp static title
        var arpDynamicTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'Dynamic ARP Entries'
        };
        
        //buttons bar above table
        var buttonsBar = {
            xtype: 'cp4_btnsbar',
            items: [{
				id: CP.ArpDynamic.GRID_FLUSH_BTN_ID,
                text: 'Flush All',
                handler: CP.ArpDynamic.flushEntries
            }]
        };
        
        //grid columns
        var columns = [{  
            header: 'IP Address', 
            dataIndex: 'ipaddr',
            flex: 1
        },{ 
            header: 'MAC Address', 
            dataIndex: 'mac',
            flex: 1
        }];
        
        //create main table that shows all ARP dynamic entries
        var arpDynamicTable = {        
            xtype: 'cp4_grid',
            id: CP.ArpDynamic.GRID_ID,
            width: 550,
            maxHeight: 120,
            autoScroll: true,
            store: arpDynamicStore,
            columns: columns
        };
        
        //return all objects as one array 
        return [
            arpDynamicTitle,
            buttonsBar,
            arpDynamicTable
        ];
    },
    
    flushEntries: function(){
        
        //display msg
        CP.WebUI4.Msg.show({
             title: 'Deleting Dynamic ARP Entries',
             msg: 'Are you sure you want to flush all dynamic ARP entries?',
             buttons: Ext.Msg.OKCANCEL,
             icon: Ext.Msg.QUESTION,
             fn: function( btn, text ){
                if( btn == 'cancel' ){
                    return;
                }
                CP.ArpDynamic.saveHandler();
             }
         });
    },
    
    saveHandler: function(){
        
        var params = {};
        params['arp_flush'] = 't';
        
        //submit form
        Ext.getCmp(CP.ArpDynamic.EXT4_PANEL_ID).submit({
            url: CP.ArpDynamic.TCL_REQUEST,
            params: params,
            method: "POST",
            success: CP.ArpDynamic.doLoad
        });
    },
    
    //load data and refresh page (on page load or after submit)
    doLoad: function(){
        Ext.Ajax.request({
            url: CP.ArpDynamic.TCL_REQUEST,
            method: 'GET',
            success: function( jsonResult ){
                var arpDynamicData = Ext.decode( jsonResult.responseText );    
                //refresh grid data
                var grid = Ext.getCmp( CP.ArpDynamic.GRID_ID );
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read( arpDynamicData );
                store.loadData( data.records );
                grid.doComponentLayout();
            }
        });
    }
}