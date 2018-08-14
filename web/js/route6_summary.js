
CP.Route6Summary = {

    init: function(children) {
    	var route6SummaryLeftDP = new CP.WebUI.Panel({ });
    	var route6SummaryRightDP = new CP.WebUI.Panel({	});
    	
    	var wrapperPanel = new CP.WebUI.Panel({
    		layout: 'column'
            ,defaults :{
            	columnWidth: .5
                ,style: 'padding: 0 24px 21px'
            }
    		,items:[route6SummaryLeftDP,route6SummaryRightDP]
    	});
    	
    	var Route6SummaryPanel = new CP.WebUI.DataFormPanel({
		    id:"Route6-summary-panel"
    		,items:[wrapperPanel]
        });
    	
    	if (children && children.length){
    		var chlen = children.length;
    		for (var i = 0; i < chlen; i++){
    			var route6SummaryNameTitle = new CP.WebUI.SectionTitle({
    				titleText: children[i].name
    			});
    			var route6SummaryDescPanel = new CP.WebUI.DisplayField({
    				value: children[i].desc,
    				hideLabel: true
    			});
    			if (i%2 == 0) {
    				route6SummaryLeftDP.add(route6SummaryNameTitle);
    				route6SummaryLeftDP.add(route6SummaryDescPanel);
    			}
    			else {
    				route6SummaryRightDP.add(route6SummaryNameTitle);
    				route6SummaryRightDP.add(route6SummaryDescPanel);
    			}
    		}
    	}

        var page = {
            title:"IPv6 Routing Summary"
            ,panel: Route6SummaryPanel
            ,submit:false
            ,afterSubmit:CP.Route6Summary.afterSubmit
            ,params:{}
        };

        CP.UI.updateDataPanel(page);
        CP.util.setSubmitOn();
    }

}
