
CP.Syslog = {

init:function() {
	
    var SyslogPanel = Ext.create('CP.WebUI4.DataFormPanel', {
    						id: "syslog_panel",
							listeners: {
								render: CP.Syslog.doLoad
							}
    					});

    
	CP.Syslog.addSyslogTable(SyslogPanel);

    var page = {
		title:"Settings"
		,panel:SyslogPanel
		,cluster_feature_name : "syslog"
		,afterSubmit: CP.Syslog.postSuccess
		,submitURL: '/cgi-bin/syslog.tcl'
		,params:{}
    };

    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(page); 
}


//  main grid
,addSyslogTable: function(obj) {	
	// store the database
	var store = Ext.create('CP.WebUI4.Store',{
       fields: [ 'ipaddr', 'binding_ipaddr', 'binding_selector','priority_level','delete' ],
       proxy: {
		            type: 'ajax',
		            url : '/cgi-bin/syslog.tcl',
		            reader: {
		                type: 'json',
		                root: 'data.remoteT'
		            }
		       }
});

    
    
    function showPrirityType(val) {
		if (val == "all") {
			return "All";
		}
		if (val == "info") {
			return "Info";
		}
		if (val == "emerg") {
			return "Emergency";
		}
		if (val == "debug") {
			return "Debug";
		}
		if (val == "crit") {
			return "Critical";
		}
		if (val == "err") {
			return "Error";
		}
		if (val == "notice") {
			return "Notice";
		}
		if (val == "warning") {
			return "Warning";
		}
		if (val == "alert") {
			return "Alert";
		}
		else {
			return val;
		}
    }
   
   	var HelpMsg = Ext.create( 'CP.WebUI4.inlineMsg',{
	id: 'one_liner',
	type: 'info',
	text: 'System Logging enables sending log entries to a remote' +
			' syslog server according to the desired priority.' ,
	style: "margin-top:24px;"
	});		
		
    //Add section title to panel
	var hostTitle2 = Ext.create('CP.WebUI4.SectionTitle', {
	    titleText: 'System Logging'
    });
	
	obj.add(HelpMsg);
	 // nice dividing line
	obj.add(hostTitle2);    
	//add all into the items array
	var items2 = [{    
		//checkbox - enable/disable 
		xtype: 'cp4_checkbox',
		boxLabel:'Send Syslog messages to management server',  
		width: 500, 		
		id: 'sendtomgmtCheckBox',
		handler: function( checkbox, isChecked ) {
		
			if( checkbox.originalValue != checkbox.getValue() ){
				Ext.getCmp('apply_checkbox_change').enable();
				
			}
			
		
		}
		
	},{
                //checkbox - enable/disable 
                xtype: 'cp4_checkbox',
                boxLabel:'Send audit logs to management server upon successful configuration',
		width: 500, 		
                id: 'sendAudittomgmtCheckBox',
                handler: function( checkbox, isChecked ) {
                        if( checkbox.originalValue != checkbox.getValue() ){
                                Ext.getCmp('apply_checkbox_change').enable();

                        }
                }
        },{
	        //checkbox - enable/disable 
	        xtype: 'cp4_checkbox',
	        boxLabel:'Send audit logs to syslog upon successful configuration',
	        id: 'sendAudittosyslogCheckBox',
		width: 500, 		
	        handler: function( checkbox, isChecked ) {
	                if( checkbox.originalValue != checkbox.getValue() ){
	                        Ext.getCmp('apply_checkbox_change').enable();
	                }
	        }
	}]
    
	 // check box
	obj.add(items2);
	//Add buttons to panel
	obj.add({
        xtype: 'cp4_btnsbar',
        items: [{
            text: "Apply",
	     margin:'5 0 0 0',
	     id: "apply_checkbox_change",
	     disabled: true ,
            handler: function( ) {					
			var checkbox = Ext.getCmp('sendtomgmtCheckBox');
			var auditbox = Ext.getCmp('sendAudittomgmtCheckBox');
			var syslogbox = Ext.getCmp('sendAudittosyslogCheckBox');
			var page = CP.UI.getMyObj();
			page.params = {};
			
			var sprefix = "syslog:sendtomgmt";						
			page.params[sprefix ] = (checkbox.getValue() == true )? "t" : "" ;
			checkbox.originalValue  = checkbox.getValue();
			checkbox.setValue(checkbox.getValue() ) ; 
			
			var sprefix = "syslog:sendaudittomgmt";
			page.params[sprefix ] = (auditbox.getValue() == true )? "t" : "" ;
			auditbox.originalValue  = auditbox.getValue();
			auditbox.setValue(auditbox.getValue() ) ;
			
			var sprefix = "xpand:auditlog";
			page.params[sprefix ] = (syslogbox.getValue() == true )? "p" : "" ;			
			syslogbox.originalValue  = syslogbox.getValue();
			syslogbox.setValue(syslogbox.getValue() ) ;				
			
			CP.UI.submitData(page);			
		}
       }]
    });
	  // Column Model
    var cm = [
	      		{
					header      : 'IP Address'
					,dataIndex  : 'ipaddr'
					,id         : 'ip-col'
					,width      : 300
	
	    	    },{
	    		    header      : 'Send Logs from Priority Level'
	    		    ,dataIndex  : 'priority_level'
	    		    ,id         : 'priority_level'
	    		    ,renderer   : showPrirityType
	    		    ,width      : 300
	    		    ,flex: 1
    	    }];
		
    //Add section title to panel
	var hostTitle = Ext.create('CP.WebUI4.SectionTitle', {
	    titleText: 'Remote System Logging'
    });
	    
	// the table
    var gridP = Ext.create('CP.WebUI4.GridPanel', {	
		id: "remote_logging_table"
		,autoHeight: true
		,maxHeight: 120
		,width: 650
		,store: store
		,columns: cm
			
		,listeners: {		
		    // open edit dialog on row double click
            itemdblclick : function(grid, rowIndex, event) {
				CP.Syslog.openModalConfigWin('Edit Remote Server Logging Entry','edit');
            },
            // select row on mouse click
        	selectionchange: function( gridView, selections ){
                var deleteBtn = Ext.getCmp( 'delete_btn' );
                var editBtn = Ext.getCmp( 'edit_btn' );
        		if (0 == selections.length){ // if no item has been selected
        			deleteBtn.disable();
        			editBtn.disable();
        		}else{  	 //enable buttons delete and edit
	                deleteBtn.enable();
	                editBtn.enable();
        		}
            }
        }
    });
	
    // nice dividing line
	obj.add(hostTitle);

	//Add buttons to panel
	obj.add({
        xtype: 'cp4_btnsbar',
        items: [{
            text: "Add",
			id: "add_new_remote_entry",
            handler: Ext.Function.bind( CP.Syslog.addNewRemoteEntry, this, ['Add Remote Server Logging Entry'])
       },{
            text: "Edit",
			id: 'edit_btn',
            disabled: true,
            handler: Ext.Function.bind( CP.Syslog.openModalConfigWin, this, ['Edit Remote Server Logging Entry','edit'])
        },{
            text: "Delete",
			id: "delete_btn",
            disabled: true,
            handler: Ext.Function.bind( CP.Syslog.showAlertBeforeDeleting, this, [])
        }]
    });
		
	//Add grid
	obj.add(gridP);
	
}

,doLoad: function(formPanel){
	
	var MyParams = {} ;	
	MyParams[ 'sendtomgmt' ] = 1;
	MyParams[ 'sendaudittomgmt' ] = 1;
	MyParams[ 'sendaudittosyslog' ] = 1;
	
	Ext.Ajax.request({
        url: "/cgi-bin/syslog.tcl",
		method: "GET",
		params: MyParams,
				success: function( jsonResult ){
			var jsonData = Ext.decode( jsonResult.responseText );
			var YesNo = jsonData.data.remoteT[0].sendtomgmt ;
			var audit = jsonData.data.remoteT[1].sendaudittomgmt ;
			var syslog = jsonData.data.remoteT[2].sendaudittosyslog ;
			var myChechBox = Ext.getCmp('sendtomgmtCheckBox');
			var auditCheckBox = Ext.getCmp('sendAudittomgmtCheckBox');
			var syslogCheckBox = Ext.getCmp('sendAudittosyslogCheckBox');
			if(syslog== 't' || syslog=='p')
			{
				syslogCheckBox.setValue( true ) ;
				syslogCheckBox.originalValue = ( true ) ;
			}
			auditCheckBox.originalValue = ( (audit == 't')?true:false ) ;
			auditCheckBox.setValue( (audit == 't')?true:false ) ;
			myChechBox.originalValue = ( (YesNo == 't')?true:false ) ;
			myChechBox.setValue( (YesNo == 't')?true:false ) ;
			Ext.getCmp('apply_checkbox_change').disable() ;
		}
	});	
}
	
,Remove_Remote_Entries:function(rowSelected) {
	var sprefix = "syslog:action:remote:";
	var page = CP.UI.getMyObj();
	page.params = {};
    	
	page.params[sprefix + rowSelected.data.ipaddr ] = "";
	page.params[sprefix + rowSelected.data.ipaddr + ':selector:all.' + rowSelected.data.priority_level] = "";

	CP.UI.submitData(page);
}

// show alert before removing the entries
,showAlertBeforeDeleting: function() {
    CP.WebUI4.Msg.show({
		title: 'Deleting Remote Logging Entries'
		,msg: 'Are you sure you want to delete remote logging entries?'
		,buttons: Ext.Msg.YESNO
		,fn: function(button, text, opt) {
			if (button == "yes") {
				var selectedRow = Ext.getCmp('remote_logging_table').getSelectionModel().getLastSelected();
				CP.Syslog.Remove_Remote_Entries(selectedRow);
            }
		}
		,animEl: 'elId'
		,icon: Ext.MessageBox.QUESTION
	});


}


// the function which stores the information to the DB (makes POST)
,AddRemoteEntryInTable:function(ip_addr, priority_level_dial)
{
	var sprefix = "syslog:action:remote:";
	var page = CP.UI.getMyObj();
	
	page.params = {};
	page.params[sprefix + ip_addr ] = 't';
	page.params[sprefix + ip_addr + ":selector:all." + priority_level_dial.getValue() ] = 't';

	//submit form
	CP.UI.submitData(page);
	
}

// the function which stores the information to the DB (makes POST)
,EditRemoteEntryInTable:function(new_ip_addr, new_priority_level_combo)
{
	var selectedRow = Ext.getCmp('remote_logging_table').getSelectionModel().getLastSelected();
	var recordData = selectedRow.data;
	
	var sprefix = "syslog:action:remote:";
	var page = CP.UI.getMyObj();
	
	var old_ip_addr = recordData.ipaddr // Ext.getCmp( 'ip_addr' ).value;
	
	//var priority_lev = priority_level_dial.getValue();
	var old_priority_level_combo = recordData.priority_level; //Ext.getCmp( 'priority_level' ).setValue( recordData.priority_level ).getValue();

	page.params = {};
	page.params[sprefix + old_ip_addr ] = '';
	page.params[sprefix + old_ip_addr + ":selector:all." + old_priority_level_combo ] = '';
	page.params[sprefix + new_ip_addr ] = 't';
	page.params[sprefix + new_ip_addr + ":selector:all." + new_priority_level_combo ] = 't';

	
	//submit form
	CP.UI.submitData(page);
	
}

//,EditRemoteEntryInTable:function(ip_addr, priority_level_dial)
//{
//	var selectedRow = Ext.getCmp('remote_logging_table').getSelectionModel().getLastSelected();
//	var recordData = selectedRow.data;
//	
//	var sprefix = "syslog:action:remote:";
//	var page = CP.UI.getMyObj();
//	
//	var old_ip_addr = Ext.getCmp( 'ip_addr' ).value;
//	var priority_lev = priority_level_dial.getValue();
//	var old_priority_level_dial = Ext.getCmp( 'priority_level' ).setValue( recordData.priority_level ).getValue();
//
//	page.params = {};
//	page.params[sprefix + ip_addr ] = 't';
//	page.params[sprefix + ip_addr + ":selector:all." + priority_lev ] = 't';
//	page.params[sprefix + old_ip_addr ] = '';
//	page.params[sprefix + old_ip_addr + ":selector:all." + old_priority_level_dial ] = '';
//	
//	//submit form
//	CP.UI.submitData(page);
//	
//}



,postSuccess:function(form,action){
	var grid = Ext.getCmp('remote_logging_table');
	if( !grid ){
		return;
	}
	grid.getStore().load();


    grid.doComponentLayout();
	//clear selection
    grid.getSelectionModel().clearSelections();
    
    
 
    // close modal if open
    var modalWindow = Ext.getCmp('add_remote_logging_window');
    if (modalWindow)
	    modalWindow.close();
		
	CP.Syslog.doLoad();
}

//add a new remote entry 
,addNewRemoteEntry:function( title) {
	
	var winObj = Ext.getCmp('add_remote_logging_window');
	
	if( !winObj ){
		CP.Syslog.declareWindow() ;

		winObj = Ext.getCmp('add_remote_logging_window');
		if( !winObj ){
			return;
		}
	}
	// empty the text.
	winObj.setTitle( title );
	winObj.show();
	
}

//open a new remote entry edit window 
,openModalConfigWin:function( title,formType) {
	
	var winObj = Ext.getCmp('add_remote_logging_window');
	
	if( !winObj ){
		CP.Syslog.declareWindow(formType) ;

		winObj = Ext.getCmp('add_remote_logging_window');
		if( !winObj ){
			return;
		}
	}
	
	//fill the fields in the modal window

	winObj.setTitle( title );
	winObj.show();
	
	 //get selected record data
	var selectedRow = Ext.getCmp('remote_logging_table').getSelectionModel().getLastSelected();
	var recordData = selectedRow.data;
	var form = Ext.getCmp( "add_remote_logging_form" );

	
	//load data into form fields
    form.getForm().loadRecord( selectedRow );
	Ext.getCmp( 'ip_addr' ).setValue( recordData.ipaddr );
	Ext.getCmp( 'priority_level_combo' ).setValue( recordData.priority_level );
}

//create window
,declareWindow: function(formType) {

	// create the combo instance
	var combo = Ext.create('CP.WebUI4.ComboBox', {
		fieldLabel: 'Priority',
	    id: 'priority_level_combo',
	    name: 'priority_level_combo',
		displayField: 'displayText',
	    valueField : 'myId',
	    store: Ext.create( 'CP.WebUI4.ArrayStore',{
	    	 data: [
					 ["all", "All"]
						,["debug", "Debug"]
						,["info", "Info"]
						,["notice", "Notice"]
						,["warning", "Warning"]
						,["err", "Error"]
						,["crit", "Critical"]
						,["alert", "Alert"]               
						,["emerg", "Emergency"]
				       ],
	        fields: [
	    			    'myId',
	    			    'displayText'
	    			]
	       
	    }),
	    value: 'all',
	    editable: false
	});
	
	
    
	 var form = Ext.create( 'CP.WebUI4.FormPanel',{
	        id: 'add_remote_logging_form',
	        bodyPadding: 10,
			items: [
			   {
				xtype: 'cp4_ipv4field',
					id: 'ip_addr',
					fieldName: 'ip_addr',
					fieldLabel: 'IP Address',
					fieldConfig: {
						allowBlank: false  //  allowBlank set to false - See comment @ 'cp4_ipv4field'
					}
			  }
			   ,combo
			],
			
			//Save and cancel buttons
			buttons: [{
				text: 'OK',
				xtype: 'cp4_button',
				handler: function(){
					//run validations
					var ipField = Ext.getCmp("ip_addr");
					var priorityField = Ext.getCmp("priority_level_combo");
                    if( !form.getForm().isValid() ){
                        return;
                    }
				  if( formType == 'edit' ) {
					CP.Syslog.EditRemoteEntryInTable( ipField.getValue(), priorityField.value );
				  }
				  else{
					CP.Syslog.AddRemoteEntryInTable( ipField.getValue(), Ext.getCmp("priority_level_combo") );
				  }
				}
			},{
				text: 'Cancel',
				xtype: 'cp4_button',
				handler: function(){
					Ext.getCmp( 'add_remote_logging_window' ).close();
				}
				
			}]
		});
		      	
	//Modal window for add, edit, delete
	var modalWin = Ext.create('CP.WebUI4.ModalWin', {
		id: 'add_remote_logging_window',
		//name: 'add_remote_logging_window',
		width: 530,
		height: 150,
		items: [ form ]//Ext.getCmp('add_remote_logging_form') ]
	});
}

}
