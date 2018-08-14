


CP.SoftwareUpdatesSummary = {

init: function(children) {
	var elements = []; // will contain elements consisting of section titles and descriptions for all CPUSE pages

	// create section titles and descriptions to be displayed in the summary page
    if (children && children.length) {
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

	// main container panel
	var SUSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
    		id: 'SU-summary-panel'
    		,items: elements
	});

	// create page object that contains the main container panel
    var page = {
        title:"Software Updates"
        ,panel: SUSummaryPanel
        ,submit:false
        ,afterSubmit:CP.SoftwareUpdatesSummary.afterSubmit
        ,params:{}
    };

    CP.UI.updateDataPanel(page);
}

}


