CP.UserSummary = {
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
    	
    	var UserSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'user-summary-panel'
    		,items: elements
        });
    
        var page = {
            title: 'User Management'
            ,panel: UserSummaryPanel
            ,submit: false
            ,afterSubmit: CP.UserSummary.afterSubmit
            ,params: {}
        };
    
        CP.UI.updateDataPanel(page);
    }
}
