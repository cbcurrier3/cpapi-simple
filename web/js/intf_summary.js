
CP.IntfSummary = {

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
	
	var IntfSummaryPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
        id: "interface-summary-panel",
        items: elements
    });
	
    var page = {
        title:"Interface Management"
        ,panel: IntfSummaryPanel
        ,submit:true
        ,afterSubmit:CP.IntfSummary.afterSubmit
        ,params:{}
    };

    CP.UI.updateDataPanel(page);
}

}
