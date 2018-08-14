
CP.Ssmtp = {

init: function() {
    var ssmtpPanel = Ext.create('CP.WebUI4.DataFormPanel', {
        id:"ssmtp-panel"
        ,items: [{
            xtype: 'cp4_sectiontitle',
            titleText: 'Mail Notification'
        },{
            xtype: 'cp4_textfield'
            ,vtype:'hostname' 
            ,fieldLabel:'Mail Server'
            ,id:'server'
            ,name:'server'
            ,emptyText: 'Example: mail.company.com'
            ,width: 270
            ,allowBlank: true
            ,maxlLength: 255
            ,enableKeyEvents: true
            ,listeners: {
                keyup : function(field){
                    if (field.getValue() != field.originalValue){ // only valid keystrokes
                        Ext.getCmp('ssmtp_apply').enable();
                    }
                }
            }
        },{
            xtype: 'cp4_textfield'
            ,vtype: 'email'
            ,fieldLabel:'User Name'
            ,id:'user'
            ,name:'user'
            ,emptyText:'Example: user@mail.company.com'
            ,width: 310
            ,allowBlank: true
            ,maxlLength: 255
            ,enableKeyEvents: true
            ,listeners: {
                keyup : function(field){
                    if (field.getValue() != field.originalValue){ // only valid keystrokes
                        Ext.getCmp('ssmtp_apply').enable();
                    }
                }
            }
        },{
            xtype: 'cp4_button'
    	    ,id: 'ssmtp_apply'
    	    ,text: 'Apply'
    	    ,disabled: true
    	    ,handler: CP.Ssmtp.saveHandler
	}],
	listeners: {
	    render: CP.Ssmtp.doLoad
        }
    });
	
    var page = {
        title:"Mail Notification"
        ,panel: ssmtpPanel
		,cluster_feature_name : "mailrelay"
        ,submit:false
        ,afterSubmit: CP.Ssmtp.afterSubmit
        ,submitURL:"/cgi-bin/ssmtp.tcl"
        ,params:{}
    };

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
    	Ext.Ajax.request({
		url: "/cgi-bin/ssmtp.tcl"
		,method: "GET"
    	,success: function(jsonResult) {
			var jsonData = Ext.decode(jsonResult.responseText);
			Ext.getCmp('server').setValue(jsonData.data.hub);
			Ext.getCmp('user').setValue(jsonData.data.root);
		    CP.util.clearFormDirtyFlag( 'ssmtp-panel' );
		}
	});
},

saveHandler: function( formType ){
    //get params to be posted to server
    CP.Ssmtp.setChangedParams( formType );

    //submit form
    CP.UI.applyHandler( CP.UI.getMyObj() );
},

//Collect the list of bindings for db set_list -
//update params array to be sent with the request to server
setChangedParams: function( formType ){
    //get params object
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var params = pageObj.params;

    params[ 'ssmtp:mailhub' ] = Ext.getCmp('server').getValue();
    params[ 'ssmtp:root' ] = Ext.getCmp('user').getValue();
},

afterSubmit: function( form, action ){
    //clear isDirty flag
    CP.util.clearFormDirtyFlag( 'ssmtp-panel' );
   
    //disable apply button
    Ext.getCmp( 'ssmtp_apply' ).disable();
}

}
