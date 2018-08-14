
CP.SysSummary = {
    init: function(children) {
        var elements = [];
        if (children && children.length){
            var chlen = children.length;
            for (var i = 0; i < chlen; i++){
                elements.push({
                    xtype: 'cp4_sectiontitle',
                    titleText: children[i].name
                },{
                    xtype: 'cp4_displayfield',
                    value: children[i].desc,
                    hideLabel: true
                });
            }
        }
    	
    	var SysSummaryPanel =  Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'system-summary-panel',
    		items: elements
        });
    	
        var page = {
            title:'System Management',
            panel: SysSummaryPanel,
            submit: false,
            afterSubmit: CP.SysSummary.afterSubmit,
            params: {}
        };
    
        CP.UI.updateDataPanel(page);
    }
}