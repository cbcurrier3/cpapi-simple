/**
 * @author Mahesh Bhoothapuri - Groups
   The template is the same as static routes
 */

CP.mgroup = {
        
        MODAL_WIN_ID: 'groups_modal_win',
        MODAL_DUALLIST_ID: 'groups_duallist',
        GROUP_STORE: null,
        DUALLIST_RIGHT_STORE: null,

init:function() {
    // panel that holds the page
    var staticPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
        id:"static-panel"
    });

    //Add section title to panel
	staticPanel.add({
	    xtype: 'cp4_sectiontitle',
        titleText: 'System Groups'
    });
    
	//add table
    CP.mgroup.addTable(staticPanel);

    //add inline message
	staticPanel.add({
        xtype: 'cp4_inlinemsg',
        text: 'System Groups control file system permissions.'
    });
	
    var obj = {
        title:"Groups"
        ,panel:staticPanel
        ,submitURL:"/cgi-bin/group.tcl"
        ,params:{}
        ,afterSubmit:CP.mgroup.afterSubmit
        ,helpFile:"staticHelp.html"
    };
    
    // Ask the infrastructure to show us.
    CP.UI.updateDataPanel(obj);
}


//Group Management main grid
,addTable: function(obj) {
    //grid store
    CP.mgroup.GROUP_STORE = Ext.create( 'CP.WebUI4.JsonStore',{
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/group.tcl',
            reader: {
                type: 'json',
                root: 'data.group_list'
            }
        },     
        fields: [
            'gname', 
            'binding_gname',          
            'gid', 
            'binding_gid', 
            'Group_Members',
            'delete', 
            'binding_delete', 
            'new'
        ]
    });
    
    //cell renderer
    function showMember( value, meta, record, rowIndex, colIndex, store, view ){ //gw, meta, rec
        var groupMembers = record.data.Group_Members;
        var total = groupMembers.length;
        var retText = '';
        if( total > 0 ){
            retText = groupMembers[0].member;
        }
        if( total <= 1){
            return retText;
        }
        else{
            return retText + " ( +" + (total - 1) + " more)";
        }
    }

    // Column Model
    var cm = [
        {header: 'Group Name', dataIndex: 'gname', flex:1},
        {header: 'Group Id',dataIndex: 'gid', flex:1},
        {header: 'Members', dataIndex: "Group_Members", renderer: showMember, flex:1}
    ];

    //Add buttons to panel
    obj.add({
        xtype: 'cp4_btnsbar',
        items: [{
            text: "Add",
            handler: Ext.Function.bind( CP.mgroup.showModalWin, this, ['Add New Group', false])
       },{
            id: 'group-edit-btn',
            text: "Edit",
            disabled: true,
            handler: Ext.Function.bind( CP.mgroup.showModalWin, this, ['Edit Group', true])
        },{
            id: 'group-delete-btn',
            text: "Delete",
            disabled: true,
            handler: function(){
                CP.WebUI4.Msg.show({
                    title: 'Delete Group',
                    msg: 'Are you sure you want to delete the selected group?',
                    icon: 'webui-msg-question',
                    buttons: Ext.Msg.OKCANCEL,
                    fn: function(btn, text){
                        if (btn == "cancel")
                            return;
                        var pageObj = CP.UI.getMyObj();
                        pageObj.params = {}; //clear out old form params
                        var params = pageObj.params;
                        var selectedRow = Ext.getCmp( 'mgroup-table' ).getSelectionModel().getLastSelected();
                        params[ 'group:'+ selectedRow.data.gname ] = '';
                        //submit form
                        CP.UI.submitData( CP.UI.getMyObj());
						CP.mgroup.afterSubmit();
                    }
                });
            }
        }]
    });
    
    //Add grid to panel
    obj.add({
        xtype: 'cp4_grid',
        id: "mgroup-table"
        ,width: 550
        ,height: 350
        ,store: CP.mgroup.GROUP_STORE
        ,columns: cm
        ,listeners: {
            selectionchange: function( gridView, selections ){
                //enable or disable buttons
                var editBtn = Ext.getCmp("group-edit-btn");
                var delBtn = Ext.getCmp("group-delete-btn");
                
                if( selections.length == 0 ){ //nothing is selected (after page refresh)
                    editBtn.disable();
                    delBtn.disable();
                }
                
                editBtn.enable();
                // Not all groups are supposed to be edited by the user.
                // A couple of built in ones aren't.  Check for that.
				if (!selections[0]){
					delBtn.disable();
				}
				else {
					var groupName = selections[0].data.gname;
					if (groupName != 'wheel' && groupName != 'users'){
						delBtn.enable();
					}
					else{
						delBtn.disable();
					}
				}
            },
            itemdblclick: {                                                              
                scope: this,                                                  
                fn: function( grid, rowIndex, event ){
                    CP.mgroup.showModalWin( 'Edit Group', true );
                }
            }
        }
    });
}
	

//open modal window for add/edit
,showModalWin: function( title, editMode ){
	Ext.create( 'CP.WebUI4.ModalWin',{
		id: CP.mgroup.MODAL_WIN_ID,
		title: title,
		width: 420,
		height: 420,
		items: CP.mgroup.getModalItems( editMode ),
		listeners: {
            afterrender: function(){
                if( editMode == true ){
                    CP.mgroup.loadDataOnEdit();
                }
            }
        }
	}).show();
}


//items array of all elements in modal window
,getModalItems: function( editMode ){
    //left store
    var leftStore = Ext.create( 'CP.WebUI4.JsonStore',{
        editMode: editMode,
        fields: [ 'user' ],
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/users.tcl',
            reader: {
                type: 'json',
                root: 'data.users'
            }
        },
        listeners: {
            load: function( leftStore, records, successful, operation, options ){
                //remove selected users from left list and move them to the right
                if( leftStore.editMode == true ){
                    var rightStore = CP.mgroup.DUALLIST_RIGHT_STORE;
                    var selectedRow = Ext.getCmp( 'mgroup-table' ).getSelectionModel().getLastSelected();
                    var membersList = selectedRow.data.Group_Members;
                    for( var i=0, groupItem ; groupItem=membersList[i] ; i++ ){
                        var leftRecord = leftStore.findRecord( 'user', groupItem.member );
                        rightStore.add( leftRecord );
                        leftStore.remove( leftRecord );
                    }
                }
            }
        }
    });
         
    //right store
    CP.mgroup.DUALLIST_RIGHT_STORE = Ext.create( 'CP.WebUI4.Store',{
        fields: [ 'user' ], //['member','new_member','delete','binding_delete'],
        data: {data:{}},
        proxy: {
            type: 'memory',
            reader: {
                type: 'json',
                root: 'data.users'
            }
        }
    });
    
    var items = [{
        xtype: 'cp4_formpanel',
        id: 'groups_form_wrapper',
        bodyPadding: 15,
        items: [{
            xtype: 'cp4_textfield',
            id: 'gname_entry',
            name: "gname",
            fieldLabel: "Group Name",
            vtype: 'groupname',
            width: 180,
            labelWidth: 70,
            allowBlank: false,
            validator: function( value ){
                //check group name to see if it already exsists
                var featureRecord = CP.mgroup.GROUP_STORE.findRecord( 'gname', value );
                if( value.length > 0 && featureRecord ){
                    return 'A group with the same name already exists';
                }
                return true;
            }
        },{
            xtype: 'cp4_positiveint',
            id: 'gid_entry',
            name: "gid",
            fieldLabel: "Group Id",
            allowBlank: false,
            width: 150,
            labelWidth: 70,
            minValue: 101,
            maxValue: 65530,
            invalidText: 'Invalid group id: Must be an integer in the range 101-65530'
        },{
            xtype: 'cp4_sectiontitle',
            titleText: 'Select Members'
        },{
            xtype: 'cp4_duallist',
            id: CP.mgroup.MODAL_DUALLIST_ID,
            width: 380,
            listHeight: 225,
            //left
            leftListStore: leftStore,
            leftListCol: [{
                text: 'Available Members',
                dataIndex: 'user'
            }],
            //right
            rightListStore: CP.mgroup.DUALLIST_RIGHT_STORE,
            rightListCol: [{
                text: 'Members of Group',
                dataIndex: 'user'
            }]
        }], //eof formpanel items
        buttons: [{
            xtype: 'cp4_button',
            id: 'save_btn',
            text: 'OK',
            handler: Ext.Function.bind( CP.mgroup.saveHandler, this, [editMode])
        },{
            xtype: 'cp4_button',
            text: 'Cancel',
            handler: function(){
                Ext.getCmp( CP.mgroup.MODAL_WIN_ID ).close();
            }
        }]
    }]; //eof items

    return items;
}


,loadDataOnEdit: function(){
    var gnameFld = Ext.getCmp("gname_entry");
    var gidFld = Ext.getCmp( 'gid_entry' );
    var selectedRow = Ext.getCmp( 'mgroup-table' ).getSelectionModel().getLastSelected();
    gnameFld.setDisabled( true );
    gnameFld.setValue( selectedRow.data.gname );
    if (selectedRow.data.gid <= 100)
        gidFld.setDisabled( true );
    gidFld.setValue( selectedRow.data.gid );
}


,saveHandler: function( editMode ){
    //run form validations
    if( Ext.getCmp( 'groups_form_wrapper' ).getForm().isValid() == false ){
        return;
    }
    
    //set params to be posted to server
    CP.mgroup.setChangedParams( editMode );
    
    //submit form
    CP.UI.submitData( CP.UI.getMyObj());
}


,setChangedParams: function(editMode) {
    //get params object
    var pageObj = CP.UI.getMyObj();
    pageObj.params = {}; //clear out old form params
    var params = pageObj.params;
    var paramsKey = 'group:';
    
    //edit group
    if (editMode) {
        var groupName = Ext.getCmp("gname_entry").getValue();
        var groupKey = paramsKey + groupName;
        params[ groupKey ] = 't';
        params[ groupKey +':gid' ] = Ext.getCmp("gid_entry").getValue();
        
        Ext.getCmp( CP.mgroup.MODAL_DUALLIST_ID ).rightList.getStore().each( function(record){
            var memberName = record.data.user;
            params[ groupKey +':'+ memberName +':newmember' ] = memberName;
        });
		
        Ext.getCmp( CP.mgroup.MODAL_DUALLIST_ID ).leftList.getStore().each( function(record){
            var memberName = record.data.user;
            params[ groupKey +':member:'+ memberName ] = ''; //deleted
        });		
		
    } 
   
    // add new group 
    else { 
        var groupName = Ext.getCmp("gname_entry").getValue();
        var groupKey = paramsKey + groupName;
        params[ groupKey +':gid' ] = Ext.getCmp("gid_entry").getValue();
        params[ groupKey +':newgroup' ] = groupName;
        
        Ext.getCmp( CP.mgroup.MODAL_DUALLIST_ID ).rightList.getStore().each( function(record){
            var memberName = record.data.user;
            params[ groupKey +':'+ memberName +':newmember' ] = memberName;
        });
    }
}
    

,afterSubmit: function(form, action){
    //refresh grid data
    var grid = Ext.getCmp( 'mgroup-table' );
    grid.getStore().load();
    grid.doComponentLayout();
    
    //disable buttons
    Ext.getCmp( 'group-edit-btn' ).disable();
    Ext.getCmp( 'group-delete-btn' ).disable();
    
    //close window after success
    Ext.getCmp( CP.mgroup.MODAL_WIN_ID ).close();
}

}
