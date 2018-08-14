
CP.RouteSummary = {
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
        	
    	var RouteSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'Route-summary-panel'
    		,items: elements
        });
    	
        var page = {
            title:'Routing Summary'
            ,panel: RouteSummaryPanel
            ,submit: false
            ,afterSubmit: CP.RouteSummary.afterSubmit
            ,params: {}
        };
    
        CP.UI.updateDataPanel(page);
    }
}