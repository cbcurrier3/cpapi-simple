
CP.MaintSummary = {
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
    	
    	var MaintSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'maint-summary-panel'
    		,items: elements
        });
    
        var page = {
            title: 'Routing Summary'
            ,panel: MaintSummaryPanel
            ,submit: false
            ,afterSubmit: CP.MaintSummary.afterSubmit
            ,params: {}
        };
    
        CP.UI.updateDataPanel(page);
    }
}