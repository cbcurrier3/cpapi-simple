
CP.SmartConsole = {

SMC_TYPE: 'none',

init : function () 
{
	CP.SmartConsole.doLoad();
},

init_ex: function() {
    var smarconsolePanel = Ext.create('CP.WebUI4.DataFormPanel', {
        id:"smarconsole-panel"
        ,items: [{
            xtype: 'cp4_sectiontitle',
            titleText: 'Download SmartConsole'
        },{
        	xtype: 'cp4_panel',
        	html: (CP.SmartConsole.SMC_TYPE != "none") ? "Click 'Download' in order to download the Check Point SmartConsole applications package"
				: 'SmartConsole is not available from this link. It can be downloaded from CPUSE.<br><br>1. Go to the <a style="color:blue;" href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/installer\');return false;">Upgrades (CPUSE) -> Status and Actions</a></font> page<br>2. Select Showing all packages view filter<br>3. Download the SmartConsole package'
        },{
            xtype: 'cp4_button',
            margin: '15 0 0 0',
    	    text: 'Download',
    	    handler: CP.SmartConsole.doDownload,
			hidden: (CP.SmartConsole.SMC_TYPE == "none")
		}]
    });
	
    var page = {
        title:"Download SmartConsole",
        	id: 'smartconsole_page'
        ,panel: smarconsolePanel
    };

    CP.UI.updateDataPanel(page);
},

doDownload: function( formType ){
	location.href = _sstr+"/cgi-bin/download_dashboard.tcl?file=SmartConsole." + CP.SmartConsole.SMC_TYPE;
},

doLoad: function(formPanel) {
        Ext.Ajax.request({
            url: '/cgi-bin/smart_console.tcl',
            method: 'GET',
            success: function( jsonResult ){
					var staticStore = Ext.decode( jsonResult.responseText ); 
					CP.SmartConsole.SMC_TYPE = staticStore.data.smcType;
					CP.SmartConsole.init_ex();
}
        });


}



}
