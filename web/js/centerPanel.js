CP.WebUI4.CenterPanel = Ext.create( 'CP.WebUI4.Panel',{
    region: 'center',
    id: 'centerPanel',
    cls: 'webui-centerpanel',
    layout: 'fit',
    listeners: {
        resize: function() {
            Ext.Array.forEach(this.items.items,function(item){
                item.doLayout();
            });
        }
    },
    items: [{
        xtype: 'cp4_tabpanel',
        id: 'tab-panel',
        defaults: {
            xtype: 'cp4_panel'
        },
        itemCls: 'header-tabs',
        tabBar: { 
            listeners: {
                beforerender: function(tb){
                    tb.getLayout().pack = 'end';
                }
            }
        },
        //Bread-crumbs toolbar
        bbar: Ext.create( 'CP.WebUI4.Toolbar',{
            id: 'centerPanel-bctoolbar',
            cls: 'centerPanel-bctoolbar',
            listeners: {
                beforerender: {
                    // bctoolbar position get override to the top by css rule (top: 0)
                    // this leave a gap in the bottom of tha page where it supposed to be
                    // so we change its getHeight() method to always return 0 so the layout object
                    // will not add it in the space calculation. but it still have a real height
                    fn: function(){
                        this.getHeight = function(){
                            return 0;
                        }
                    },
                    single: true
                }
            }
            //items:[] will be add from the navtree according to path of page
        }),
        items:[
        {
            //Configuration tab
            title: 'Configuration',
            id: 'config-tab'
        },{
            //Monitoring tab
            title: 'Monitoring',
            id: 'monitor-tab'
        },{
            //Auditing tab
            title: 'Auditing',
            hidden: true,       // No supported yet.
            id: 'audit-tab',
            disabled: true
        }],
        listeners: {
            beforetabchange: function(tp, newTab, currentTab){				
				if(currentTab) {
					currentTab.items.each(function(item) {
						if(item.onTabChange && Ext.isFunction(item.onTabChange)) {
							item.onTabChange();
						}
					});
				}
                if (newTab.id == 'centerPanel-bctoolbar')
                    return false;
                if (newTab.id == 'config-tab') {
                    CP.global.activeTab = CP.global.config;
                }
                if (newTab.id == 'monitor-tab') {
                    CP.global.activeTab = CP.global.monitor;
                }
            }
        }
    },{
        //Overview panel
        xtype: 'cp4_container',
        id: 'overview-panel',
        hidden: true
    }]
      
    
    ,hideTabPanel: function(txt) {
        Ext.getCmp('tab-panel').hide();
    }
    
    
    ,showTabPanel: function(txt) {
        Ext.getCmp('tab-panel').show();
    }
    
    
    ,disableOverviewPanel: function(flag){
        var panel = Ext.getCmp('overview-panel');
        if (flag) {
            panel.disable();
        } else {
            panel.enable();
        }
    }
    
     ,disableTab:function(tab, flag){
       if (flag) {
		    tab.tab.hide();		
        } else {
			tab.tab.show();
        }
    }    
	
    ,disableConfigTab: function(flag){
		this.disableTab(Ext.getCmp('config-tab'), flag);
    }
    
    
    ,disableMonitorTab:function(flag){
		this.disableTab(Ext.getCmp('monitor-tab'), flag);
    }
    

	
    ,setConfigTabActive: function(){
        Ext.getCmp('tab-panel').setActiveTab('config-tab');
    }
    
    
    ,setMonitorTabActive: function(){
        Ext.getCmp('tab-panel').setActiveTab('monitor-tab');
    }

});
