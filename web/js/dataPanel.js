/*
 * page with simple panel and no forms. For grids and pages that do not contains form fields
 */
CP.WebUI.DataPanel = Ext.extend( CP.WebUI.Panel,{
	constructor: function( config ){
	    config = Ext.apply({
	    	cls: 'webui-main-panel',
	    	border: false,
	    	title: false,
	        autoScroll: false
	    }, config);
	    CP.WebUI.DataPanel.superclass.constructor.call( this, config );
	}
});


/*
 *  page with simple form panel and form fields
 */
CP.WebUI.DataFormPanel = Ext.extend( CP.WebUI.FormPanel,{
	constructor: function( config ){
	    config = Ext.apply({
	    	cls: 'webui-main-panel',
	    	border: false,
	    	header: false,
	        autoScroll: false,
	        trackResetOnLoad: true,
	        labelWidth: 100
	    }, config);
	    CP.WebUI.DataFormPanel.superclass.constructor.call( this, config );
	}
});
Ext.reg( 'cp_dataformpanel', CP.WebUI.DataFormPanel );
