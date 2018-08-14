
CP.HighAvailSummary = {
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
    	
    	var HighAvailSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'ha-summary-panel'
    		,items: elements
        });
    
        var page = {
            title: 'High Availability Summary'
            ,panel: HighAvailSummaryPanel
            ,submit: false
            ,afterSubmit: CP.HighAvailSummary.afterSubmit
            ,params: {}
        };
    
        CP.UI.updateDataPanel(page);
    }
}