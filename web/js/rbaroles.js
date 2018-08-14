// Copyright Check Point

CP.RbaRoles = {
        
    //page globals
    EXT4_PANEL_ID: 'roles_ext4_panel',
    GRID_ID: 'roles_main_grid',
    FTRS_GRID_ID: 'features_grid',
    CMD_GRID_ID: 'commands_grid',
    MODAL_WIN_ID: 'roles_modal_win',
    ASSIGNMEM_MODAL_WIN_ID: 'roles_assign_members_win',
    EDIT_BTN_ID: 'roles_edit_btn',
	ADD_BTN_ID: 'roles_add_btn',
    DEL_BTN_ID: 'roles_delete_btn',
    ASIGNMEM_BTN_ID: 'roles_assign_members_btn',
    ROLE_NAME_FIELD_ID: 'role_form_name_field',
    DUAL_LIST_ID: 'roles_assign_members_duallist',
    COMBO_BATCH_ID: 'combo_batch_select',
	CHECKBOX_BATCH_ID: 'checkbox_batch_id',
    TCL_REQUEST: '/cgi-bin/rbaroles.tcl',
    FORM_TYPE_ADD: 'form-add',
    FORM_TYPE_EDIT: 'form-edit',
    FORM_TYPE_DEL: 'form-delete',
    FORM_TYPE_ASSIGN_MEM: 'form-assign-members',
   
    //build the page
    init: function(){
        //first load roles data for the entire page
        Ext.Ajax.request({
            url: CP.RbaRoles.TCL_REQUEST,
            method: 'GET',
            success: function( jsonResult ){
                //then when response is returned - load the rest
                CP.RbaRoles.rolesData = Ext.decode( jsonResult.responseText );
                
                //1. create the page object
                var page = {
                    title: 'Roles',
                    related: [{ page: 'tree/user' }],
                    params: {},
					cluster_feature_name : "users-and-roles",
                    submitURL: CP.RbaRoles.TCL_REQUEST,
                    afterSubmit: CP.RbaRoles.afterSubmit, 
                    panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
                        id: CP.RbaRoles.EXT4_PANEL_ID, //id is mandatory
                        items: CP.RbaRoles.getPageItems()
                    })
                };

                //3. display the page
                CP.UI.updateDataPanel( page );
            }
        });
    }
    
    
    //get main structure of page items
    ,getPageItems: function(){
        //load grid store with roles data
        CP.RbaRoles.rolesStore = Ext.create( 'CP.WebUI4.Store',{
            fields: [ 'name', 'features', 'commands', 'users', 'is_special_role' ],
            data: CP.RbaRoles.rolesData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.roles',
                    successProperty: 'success'
                }
            }
        });
        
        //load features store with availfeatures data
        CP.RbaRoles.ftrsStore = Ext.create( 'CP.WebUI4.Store',{
            fields: [ {name:'permission', type: 'string', defaultValue: 'none'}, 'name', 'displayname',
								'description' ,'RoleAssignmentAction'],
            data: CP.RbaRoles.rolesData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.availfeatures',
                    successProperty: 'success'
                }
            }
        });
        
        //load commands store with availcommands data
        CP.RbaRoles.cmdStore = Ext.create( 'CP.WebUI4.Store',{
            fields: [ { name:'active', type: 'bool', defaultValue:false }, 
				'name', 'displayname', 'description', 'path','RoleAssignmentAction' ],
            data: CP.RbaRoles.rolesData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.availcommands',
                    successProperty: 'success'
                }
            }
        });
        
        //table title
        var rolesTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'Roles'
        };
        
        //buttons bar above table
        var buttonsBar = {
            xtype: 'cp4_btnsbar',
            items: [{
                text: 'Add',
				id: CP.RbaRoles.ADD_BTN_ID,
                handler: Ext.Function.bind( CP.RbaRoles.openModalWin, this, [ true ])
            },{
                text: 'Edit',
                id: CP.RbaRoles.EDIT_BTN_ID,
                disabled: true,
                handler: Ext.Function.bind( CP.RbaRoles.openModalWin, this, [ false ])
            },{
                text: 'Assign Members',
                id: CP.RbaRoles.ASIGNMEM_BTN_ID,
                width: 105,
                disabled: true,
                handler: CP.RbaRoles.assignMembers
            },{
                text: 'Delete',
                id: CP.RbaRoles.DEL_BTN_ID,
                disabled: true,
                handler: CP.RbaRoles.deleteRole
            }]
        };
                
        //custom functions used for column renderer
        function renderListBrief( value, type, record ){
            if( !value || value.length < 1 ){
                //list is empty, display nothing in cell 
                return '';
            } 
            else if( value.length == 1 ){
                //one feature in list, get its name
                var name = ( value[0].name ) ? value[0].name : value[0];
                if( type == 'Features' ){
                    //find display name of feature
                    var featureRecord = CP.RbaRoles.ftrsStore.findRecord( 'name', name );
                    name = featureRecord.data.displayname;
                }
                else if( type == 'Commands' ){
                    var cmdRecord = CP.RbaRoles.cmdStore.findRecord( 'name', name );
                    name = cmdRecord.data.displayname;
                }
                return name;
            } 
            else{
                //more than 1 item in list, count number of items and and display them with their type
                var counter = 0;
                if( type == 'Features' ){
                    var fname = '';
                    for( var i in value ){
                        var permission = value[i].permission;
                        if( permission == 'rw' || 
                            permission == 'ro' ){
                            fname = value[i].name;
                            counter++;
                        }
                    }
                    if( counter == 1 ){
                        var featureRecord = CP.RbaRoles.ftrsStore.findRecord( 'name', fname );
                        return featureRecord.data.displayname;
                    }
                }
                else {
                    counter = value.length;
                }
                return counter + ' ' + type;
            }
        }
        
        function renderFeaturesListBrief( value, meta, record, rowIndex, colIndex, store, view ){
            return renderListBrief( value, 'Features', record );
        }
        
        function renderCmdListBrief( value, meta, record, rowIndex, colIndex, store, view ){
            return renderListBrief( value, 'Commands', record );
        }
        
        function renderUsersListBrief( value, meta, record, rowIndex, colIndex, store, view ){
            return renderListBrief( value, 'Users', record );
        }
        
        //grid columns
        var columns = [{  
            header: 'Role', 
            dataIndex: 'name',
            width: 120
        },{ 
            header: 'Features', 
            dataIndex: 'features',
            flex: 1,
            sortable: false, 
            renderer: renderFeaturesListBrief
        },{ 
            header: 'Commands',
            dataIndex: 'commands',
            flex: 1,
            sortable: false,
            renderer: renderCmdListBrief
        },{ 
             header: 'Users',
             dataIndex: 'users',
             flex: 1,
             sortable: false,
             renderer: renderUsersListBrief
        }];
        
        //create main table that shows the available roles and a summary of each.
        var rolesTable = {        
            xtype: 'cp4_grid',
            id: CP.RbaRoles.GRID_ID,
            autoScroll: true,
            height: 246,
            store: CP.RbaRoles.rolesStore,
            columns: columns,
            listeners: {
                //open edit dialog on row double click
                itemdblclick: function( grid, rowIndex, event ){
                    CP.RbaRoles.openModalWin( false );
                },
                selectionchange: function( gridView, selections ){
                    if( selections.length == 0 ){
                        return;
                    }
					
					if(selections[0].data.name == "cloningAdminRole") {
						Ext.getCmp( CP.RbaRoles.ASIGNMEM_BTN_ID ).disable();
						Ext.getCmp( CP.RbaRoles.DEL_BTN_ID ).disable();
						return;
					}
					
                    //enable edit, assign members and delete buttons when selecting a row
                    Ext.getCmp( CP.RbaRoles.EDIT_BTN_ID ).enable();
                    Ext.getCmp( CP.RbaRoles.ASIGNMEM_BTN_ID ).enable();
                    var delBtn = Ext.getCmp( CP.RbaRoles.DEL_BTN_ID );
                    if( !selections[0].data.is_special_role ){
                        //built-in roles cannot be deleted
                        delBtn.enable();
                    }
                    else{
                        delBtn.disable();
                    }
                }
            }
        };
		
        //return all objects as one array 
        return [
            rolesTitle,
            buttonsBar,
            rolesTable
        ];
    }


    ,getSelectedRole: function(){
        var selectedRow = Ext.getCmp( CP.RbaRoles.GRID_ID ).getSelectionModel().getLastSelected();
        var roleName = selectedRow.data.name;
        var roleRecord = CP.RbaRoles.rolesStore.findRecord( 'name', roleName );
        return roleRecord;
    }
    
    
    //open modal window for adding or editing role
    ,openModalWin: function( addmode ) {
        var  winTitle = 'Add Role';
        var roleName = '';
        var builtIn = false;
        if( !addmode ){
            var selectedRow = Ext.getCmp( CP.RbaRoles.GRID_ID ).getSelectionModel().getLastSelected();
            roleName = selectedRow.data.name;
            winTitle = 'Edit Role: ' + roleName;
            builtIn = (selectedRow.data.is_special_role == 1);
        }
       
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: CP.RbaRoles.MODAL_WIN_ID,
            width: 680,
            height: 550,
            title: winTitle,
            items: CP.RbaRoles.makeRoleForm( addmode, roleName , builtIn)
        }).show();
		
		Ext.getCmp(CP.RbaRoles.FTRS_GRID_ID).hideVerticalScroller();	
		Ext.getCmp(CP.RbaRoles.CMD_GRID_ID).hideVerticalScroller();
    }
  
    
//  data: {
//  availfeatures: [{
//      name: 'adv_vrrp',
//      displayname: 'Advanced VRRP',
//      description: 'kakjf asfkaslkf klfjaljdf'
//  }],
//  
//  availcommands: [{
//      name: 'ext_cp_conf',
//      displayname: 'Extended Configuration',
//      description: 'kakjf asfkaslkf klfjaljdf'
//  }],
//  
//  availusers: [{
//      name: 'admin',
//      type: 'builtin'
//  }],
//  
//  roles: [{
//      name: 'Role 1',
//      is_special_role: 1,
//      features: [{ name:'adv_vrrp', permission:'ro' }],
//      commands: [{ name:'ext_cp_conf', active:true}],
//      users: [{ name:'admin'}]
//  }]
//}
    // Create a form that can be used when either adding a
    // new role or editing an existing one. 
    ,makeRoleForm: function( addmode, roleName, builtIn ){
     
        //Custom function used for column renderer
        function permissionIcon( value, meta, record, rowIndex, colIndex, store, view ){		
            if( value == 'rw' ){		
                return '<div class="roles-readwrite" data-qtip="Read / Write"></div>';
            }
            else if( value == 'ro' ){				
                return '<div class="roles-readonly" data-qtip="Read Only"></div>'; 
            }
            else{
                return '<div class="roles-undefined"></div>';
            }
        } 
       
        function getFtrsName( value, meta, record, rowIndex, colIndex, store, view )
	    {
			for(i = 0;i < CP.RbaRoles.rolesData.data.availfeatures.length;i++) {
				if(CP.RbaRoles.rolesData.data.availfeatures[i].name == value) {
					return CP.RbaRoles.rolesData.data.availfeatures[i].displayname;
				}
	    }
	    return value;
        }
        
        function getFtrsDesc( value, meta, record, rowIndex, colIndex, store, view ){
			for(i = 0;i < CP.RbaRoles.rolesData.data.availfeatures.length;i++) {
				if(CP.RbaRoles.rolesData.data.availfeatures[i].name == value) {
					return CP.RbaRoles.rolesData.data.availfeatures[i].description;
				}
	    }
	    return "Not Supported";
        }
        
        //create combobox store
        var comboStore = Ext.create( 'CP.WebUI4.ArrayStore',{
            fields: [ 'name', 'value' ],
            data: [ ['none', 'None'],
                    ['ro', 'Read Only'],
                    ['rw', 'Read / Write'] ]
        });
        
        //get features store
        var ftrsStore = null;
        if( addmode == true){
            CP.RbaRoles.ftrsStore.load(); //reset store to clear it from previous selections
            ftrsStore = CP.RbaRoles.ftrsStore;
        }
        else{
            var roleRecord = CP.RbaRoles.getSelectedRole();
            ftrsStore = Ext.create( 'CP.WebUI4.Store',{
				fields: [ {name:'permission', type: 'string', defaultValue: 'none'}, 
							'name', 'displayname', 'description','RoleAssignmentAction' ],
                data: roleRecord.data,
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        root: 'features'
                    }
                }
            }
			);
        }
             	
		if(!builtIn) {	
			ftrsStore.each( function( record ){
				for(i = 0;i < CP.RbaRoles.rolesData.data.availfeatures.length;i++) {
					if(CP.RbaRoles.rolesData.data.availfeatures[i].name == record.data.name) {
						if(record.data.permission == "none" && CP.RbaRoles.rolesData.data.availfeatures[i].RoleAssignmentAction.toLowerCase() == "block") {
							ftrsStore.remove(record);
							break;
						}
					}
				}
				return true;
			}); 
		}	
			
        var grid_selModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange     : function(view, selections, eOpts) {
                   if( selections.length == 0  ){
						Ext.getCmp( CP.RbaRoles.COMBO_BATCH_ID ).disable();
						
                    }
					else {
					 Ext.getCmp( CP.RbaRoles.COMBO_BATCH_ID ).enable();
					}
					Ext.getCmp( CP.RbaRoles.COMBO_BATCH_ID ).reset( )

                }
            }
			
        });
			
		var newVal ="";
		var comboSelectRW = new Ext.create('CP.WebUI4.ComboBox' , {
			name: 'permission',
			store: comboStore,
			displayField: 'value',
			valueField: 'name',
			disabled: ( builtIn  ? true : false ),
			editable: false,
			allowBlank: false,
			listeners: {
				afterrender: function( combo, options ){
					var input = Ext.get( combo.getInputId() ).dom;
					CP.RbaRoles.origCls = input.className;
				},
				focus: function( combo ){
					combo.expand();
				},
				change: function( combo, newValue, oldValue, options ){
				var cls = '';
				newVal = newValue;
					if( newValue == 'rw' )
						cls = 'roles-menu-icon-readwrite';
					else if( newValue == 'ro' )
						cls = 'roles-menu-icon-readonly';
					else
						cls = 'roles-menu-icon-undefined';
					
					var input = Ext.get( combo.getInputId() ).dom;
					input.className = CP.RbaRoles.origCls +' '+ cls;					
				} ,
				collapse: function( combo , options ){
					Ext.getCmp(CP.RbaRoles.FTRS_GRID_ID).getSelectionModel().getLastSelected().set("permission",newVal);			
				}
			},
			listConfig: {
				minWidth: 115,
				cls: 'roles-boundlist-item',
				getInnerTpl: function(){
					var style = 'padding: 2px 2px 2px 24px;';
					var comboOptions = '<tpl for=".">'+
							'<div style="'+ style +
							 '<tpl if="name==\'rw\'">'+
							  'background: url(../images/icons/readwrite.png) no-repeat 4px center;'+
							 '</tpl>'+
							 '<tpl if="name==\'ro\'">'+
							  'background: url(../images/icons/readonly.png) no-repeat 4px center;'+
							 '</tpl>'+
							'">'+ 
							 '{value}'+ 
							'</div>'+
						   '</tpl>';

					return comboOptions;
				}
			}
		});
		
			
		var comboBatchSelect = new Ext.create('CP.WebUI4.ComboBox' , {
			name: 'batch select permission',
			id: CP.RbaRoles.COMBO_BATCH_ID,
			displayField: 'value',
			valueField: 'name',
			store: comboStore,
			disabled: true,
			editable: false,
					listeners: {
				afterrender: function( combo, options ){
					var input = Ext.get( combo.getInputId() ).dom;
					CP.RbaRoles.origCls = input.className;
				},
				focus: function( combo ){
					combo.expand();
				},
				change: function( combo, newValue, oldValue, options ){
					if (!newValue) return;
					// updates RW values of the selected rows
					var recs = Ext.getCmp(CP.RbaRoles.FTRS_GRID_ID).getSelectionModel().getSelection();
					for(var i = 0; i < recs.length; i++) recs[i].set("permission",newValue);
				}
			},
			listConfig: {
				minWidth: 115,
				cls: 'roles-boundlist-item',
				getInnerTpl: function(){
					var style = 'padding: 2px 2px 2px 24px;';
					var comboOptions = '<tpl for=".">'+
							'<div style="'+ style +
							 '<tpl if="name==\'rw\'">'+
							  'background: url(../images/icons/readwrite.png) no-repeat 4px center;'+
							 '</tpl>'+
							 '<tpl if="name==\'ro\'">'+
							  'background: url(../images/icons/readonly.png) no-repeat 4px center;'+
							 '</tpl>'+
							'">'+ 
							 '{value}'+ 
							'</div>'+
						   '</tpl>';

					return comboOptions;
				}
			}
		});
			

        // create features Grid
        var featuresGrid = Ext.create( 'Ext.ux.LiveSearchGridPanel',{
            id: CP.RbaRoles.FTRS_GRID_ID,
            addmode: addmode,
            store: ftrsStore,
            height: 375,
			selModel : ( builtIn  ? null : grid_selModel ),
            viewConfig: {
                stripeRows: true
            },
            plugins: [
                Ext.create( 'CP.WebUI4.CellEditing',{
                    clicksToEdit: 1
                })
            ],
			dockedItems: [{
                xtype: 'toolbar',
                items: [{
						xtype: 'tbtext', 
						margin: '0 0 0 202',
						text: 'Mark selected as:'
					},
						comboBatchSelect
                ]
            }],
            columns: [{ 
				header: 'R/W',
                dataIndex: 'permission',
                width: 48,
                sortable: true,
                fixed: true,
                draggable: false,
                hideable: false,
                menuDisabled: true,
                matchFieldWidth: false,
                renderer: permissionIcon,
                field: comboSelectRW 					
            },{
                text: 'Name',
                dataIndex: 'name',
                width: 170, 
                sortable: true,
                renderer: getFtrsName
            },{
                text: 'Description',
                dataIndex: 'name',
                flex: 1, 
                sortable : true,
                renderer: getFtrsDesc
            }]
        });
        
        //reset store to clear it from previous selections
        CP.RbaRoles.cmdStore.load();
                
        //search in store to find the right command that was defined for this role.
        //for details - see structure of data above
        if( addmode == false ){
            CP.RbaRoles.cmdStore.each( function( record ){
                var isActive = false;
                //get role
                var roleRecord = CP.RbaRoles.getSelectedRole();
                var commandsList = roleRecord.data.commands;
                var cmdName = record.data.name;
                
                //search in commands list of role
                for( var i=0, cmd ; cmd=commandsList[i] ; i++ ){
                    if( cmd == cmdName ){
                        isActive = true;
                        break;
                    }
                }
                record.set( 'active', isActive );
            });
        }
                        
		if(!builtIn) {	
			CP.RbaRoles.cmdStore.each( function( record ){
				for(i = 0;i < CP.RbaRoles.rolesData.data.availcommands.length;i++) {
					if(CP.RbaRoles.rolesData.data.availcommands[i].name == record.data.name) {
						if(!record.data.active && CP.RbaRoles.rolesData.data.availcommands[i].RoleAssignmentAction.toLowerCase() == "block") {
							CP.RbaRoles.cmdStore.remove(record);
							break;
						}
					}
				}
				return true;
			}); 
		}		
		
		var batchCheckCommand= Ext.create('CP.WebUI4.Checkbox', {
		    id: CP.RbaRoles.CHECKBOX_BATCH_ID,
		    fieldLabel: 'Check selected as',
			margin: '0 0 0 252',
		    checked: false,
		    disabled: ( builtIn  ? true : false ),
			listeners: {
	            change: function(field, newValue, oldValue, eOpts) {
					if (newValue !== true && newValue !== false) return;
					// updates command of the selected rows
					var recs = Ext.getCmp(CP.RbaRoles.CMD_GRID_ID).getSelectionModel().getSelection();
					for(var i = 0; i < recs.length; i++) recs[i].set("active",newValue);
	            }
        	}
		});
		var grid_commandSelModel = Ext.create("Ext.selection.RowModel", {
            allowDeselect       : true
            ,mode               : "MULTI"
            ,listeners          : {
                selectionchange: function(view, selections, eOpts){
                    var checkBoxCmp = Ext.getCmp(CP.RbaRoles.CHECKBOX_BATCH_ID)
                    checkBoxCmp.suspendEvents(false);
                    if (selections.length == 0) {
                        checkBoxCmp.disable();
                        checkBoxCmp.reset();
                    }
                    else {
                        checkBoxCmp.enable();
                        checkBoxCmp.setValue(selections[selections.length - 1].get("active"));
                    }
                    checkBoxCmp.resumeEvents();
                }
            }
			
        });	
				
        // create commands Grid
        var cmdGrid = Ext.create( 'Ext.ux.LiveSearchGridPanel',{
            id: CP.RbaRoles.CMD_GRID_ID,
            store: CP.RbaRoles.cmdStore,
            height: 375, 
            columnLines: true,
			selModel : ( builtIn  ? null : grid_commandSelModel ),
            viewConfig: {
                stripeRows: true
            },			
            dockedItems: [{
				xtype: 'toolbar',
				items: [batchCheckCommand]
			},{
				xtype: 'toolbar',
				items: [{		
                    xtype: 'tbtext',
                    style  : "line-height:13px;",					
                    text: 'Extended command provide access to abilities outside the domain of the command line,<br>such as operating system or security gateway utilities. Additional extended commands can be defined by typing "add command". '
            	}]
			}],
            columns: [{
                xtype: 'checkcolumn',
                header: 'Active',
                dataIndex: 'active',
                width: 60,
		editable: (builtIn ? false : true),
                editor: {
                    xtype: 'checkbox',
                    cls: 'x-grid-checkheader-editor'
                }
            },{
                text     : 'Name',
                dataIndex: 'displayname',
                width    : 100, 
                sortable : true 
            },{
                text     : 'Description',
                dataIndex: 'description',
                flex     : 1, 
                sortable : true
            },{
                text: 'Path',
                dataIndex: 'path',
                width: 150,
                sortable: true
            }]
        });
        
        //add all into form
        var roleForm = Ext.create( 'CP.WebUI4.FormPanel',{
            bodyPadding: '24 10 10 10',
            items: [{
                //Role name
                xtype: 'cp4_textfield',
                id: CP.RbaRoles.ROLE_NAME_FIELD_ID,
                value: roleName,
                vtype: 'rolename',
                name: 'name',
                fieldLabel: 'Role Name',
                margin: '0 0 24 0',
                labelWidth: 70,
                allowBlank: false,
                maxLength:128,
                disabled: ( addmode ? false : true ),
                validator: function( value ){
                    if (addmode && (Ext.getCmp( CP.RbaRoles.GRID_ID ).getStore().
                            find('name', value, null, null, null, true) != -1)){
                        return ('This role name is in use by another role');
                    }
                    return true;
                }
            },{
                //tabpanel
                xtype: 'cp4_tabpanel',
                plain: true,
                autoShow: true,
                activeTab: 0,
				listeners: {
					'tabchange': function(tabPanel, tab){
						if (tab.title == "Features")
							Ext.getCmp(CP.RbaRoles.FTRS_GRID_ID).hideVerticalScroller();
						else
							Ext.getCmp(CP.RbaRoles.CMD_GRID_ID).hideVerticalScroller();
					}
				},
                defaults: {
                    xtype: 'cp4_panel',
                    height: 375
                },			
                items: [{
                    //features tab
                    title: 'Features',
                    items: [ featuresGrid ]
                },{
                    //Advanced commands tab
                    title: 'Extended Commands',
                    items: cmdGrid
                }]
            }],
            buttons: [{
                xtype: 'cp4_button',
                id: 'save_btn',
                text: 'OK',
                handler: function(){
                    //run validations
                    if( Ext.getCmp( CP.RbaRoles.ROLE_NAME_FIELD_ID ).isValid() == false ){
                        return;
                    }
					
					var cmdStore = Ext.getCmp(CP.RbaRoles.CMD_GRID_ID).getStore();
					var ftrStore = Ext.getCmp(CP.RbaRoles.FTRS_GRID_ID).getStore();
					var WarnFeatures = [];
					
					ftrStore.each( function( record ){
						var rd = record.data;
						var ftr = CP.RbaRoles.ftrsStore.findRecord("name",rd.name, 0, false, true, true);

						if(ftr !== null && ftr.data.RoleAssignmentAction.toLowerCase() === "warn" && rd.permission !== "none" && rd.permission !== "ro") {
							WarnFeatures.push(ftr.data.displayname);
						}
					});
					
					cmdStore.each( function( record ){
						var rd = record.data;
						var cmd = CP.RbaRoles.cmdStore.findRecord("name",rd.name, 0, false, true, true);

						if(cmd !== null && cmd.data.RoleAssignmentAction.toLowerCase() === "warn" && rd.active === true) {
							WarnFeatures.push(ftr.data.displayname);
						}
					});

					if(WarnFeatures.length > 0) {
					
						var WarningMsg = "The following features provide a privilege level equivalent to that of 'adminRole':<br><br>";
						
						for(var i = 0;i < WarnFeatures.length;i++) {
							WarningMsg += WarnFeatures[i] + "<br>";
						}

						WarningMsg += "<br>Are you sure you want to continue?";
					
						CP.WebUI4.Msg.show({
							 title: 'Attention',
							 msg: WarningMsg,
							 buttons: Ext.Msg.YESNO,
							 icon:  Ext.Msg.WARNING,
							 fn: function( btn, text ){
								if( btn == 'no' ){
									return;
								} else {
									save_btn_post_handler();
								}
							 }
						});
					} else {
						save_btn_post_handler();
					}
										
					function save_btn_post_handler() {
                    var formType = ( addmode == true ) ? CP.RbaRoles.FORM_TYPE_ADD : CP.RbaRoles.FORM_TYPE_EDIT;
                    CP.RbaRoles.saveHandler( formType );
                    Ext.getCmp( CP.RbaRoles.MODAL_WIN_ID ).close();
                }
					
                }
            },{
                xtype: 'cp4_button',
                text: 'Cancel',
                handler: function(){
                    Ext.getCmp( CP.RbaRoles.MODAL_WIN_ID ).close();
                }
            }]
        });
    
        return roleForm;
    }
 
 
    ,assignMembers: function(){
        
        function lockRenderer(value, metaData, record){
            if (record.data.type == 'builtin'){
                metaData.tdCls = 'roles-user-lock';
            }
            return value;
        }
        
        function lockSelect(grid, item){
            if (item.data.type == 'builtin'){
                return false;
            }
        }
        
        //left store
        var leftStore = Ext.create( 'CP.WebUI4.Store',{
            fields: [ 'name', 'type' ],
            data: CP.RbaRoles.rolesData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.availusers',
                    successProperty: 'success'
                }
            }
        });
             
        //right store
        var rightStore = Ext.create( 'CP.WebUI4.JsonStore',{
            fields: [ 'name', 'type' ],
            data: CP.RbaRoles.rolesData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'data.roles.users',
                    successProperty: 'success'
                }
            }
        });
                
        //remove selected users from left list and move them to the right
        var roleRecord = CP.RbaRoles.getSelectedRole(); //find the right role in the roles store
        var usersList = roleRecord.data.users; //get users list bounded to the selected role
        for( var i=0, userName ; userName=usersList[i] ; i++ ){ //loop through users list
            var leftRecord = leftStore.findRecord( 'name', userName );
            rightStore.add( leftRecord );
            leftStore.remove( leftRecord );
        }
        
        //open modal window with dual-list
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: CP.RbaRoles.ASSIGNMEM_MODAL_WIN_ID,
            width: 400,
            height: 380,           
            title: 'Assign Members to Role',
            items:[{
            	xtype: 'cp4_formpanel',
                id: 'roles_form_wrapper',
                width: 400,
                height: 380,               
                items: [{
                xtype: 'cp4_duallist',
                id: CP.RbaRoles.DUAL_LIST_ID,
                width: 360,
                listHeight: 250,
                bodyPadding: '15 0 15 25',
                //left
                leftListStore: leftStore,
                leftListCol: [{
                    text: 'Available Users',
                    dataIndex: 'name',                   
                    renderer: lockRenderer
                }],
                //right
                rightListStore: rightStore,
                rightListCol: [{
                    text: 'Users with Role',
                    dataIndex: 'name',
                    renderer: lockRenderer
                }]
                }],//eof formpanel items
                buttons: [{
                    xtype: 'cp4_button',
                    text: 'OK',
                    handler: function(){
                        CP.RbaRoles.saveHandler( CP.RbaRoles.FORM_TYPE_ASSIGN_MEM );
                        Ext.getCmp( CP.RbaRoles.ASSIGNMEM_MODAL_WIN_ID ).close();
                    }
                },{
                    xtype: 'cp4_button',
                    text: 'Cancel',
                    handler: function(){
                        Ext.getCmp( CP.RbaRoles.ASSIGNMEM_MODAL_WIN_ID ).close();
                    }
                }]
            }]//eof items
            
        }).show();
        
        var dualList = Ext.getCmp(CP.RbaRoles.DUAL_LIST_ID);
        dualList.leftList.addListener('beforeitemmousedown', lockSelect);
        dualList.leftList.addListener('beforeitemdblclick', lockSelect);
        dualList.rightList.addListener('beforeitemmousedown', lockSelect);
        dualList.rightList.addListener('beforeitemdblclick', lockSelect);
    }
 
    
    //delete the selected role if user approves
    ,deleteRole: function(){
        //get selected row name 
        var selectedRow = Ext.getCmp( CP.RbaRoles.GRID_ID ).getSelectionModel().getLastSelected();
        roleName = selectedRow.data.name;
        
        //display msg
        CP.WebUI4.Msg.show({
             title: 'Delete Role: '+ roleName,
             msg: 'Are you sure you want to delete the selected role?',
             buttons: Ext.Msg.OKCANCEL,
             icon: Ext.Msg.QUESTION,
             fn: function( btn, text ){
                if( btn == 'cancel' ){
                    return;
                }
                CP.RbaRoles.saveHandler( CP.RbaRoles.FORM_TYPE_DEL );
             }
         });
    }
    
    
    ,saveHandler: function( formType ){
        //get params to be posted to server
        CP.RbaRoles.setChangedParams( formType );
        
        //submit form
        CP.UI.submitData( CP.UI.getMyObj());
    }

    
  /*
    ADD + EDIT( isDirty )
    ---
    params["rbaroles"] = "role1";
    params["rbaroles:role1"] = "feature";
    params["rbaroles:role1:feature:adv_vrrp"] = "rw || ro || ";  //features
    params["rbaroles:role1:feature:ext_vrrp"] = "rw || ";        //commands
    params["lock:token"] = 5455221;
    
    DELETE
    ---
    params["rbaroles"] = "role1";
    params["rbaroles:role1"] = "";
    params["lock:token"] = 5455221;
    
    ASSIGN MEMBERS
    ---
    params["rbaroles"] = "role1";
    params["rbaroles:role1"] = "user";
    params["rbaroles:role1:user:user1] = "t";
    params["lock:token"] = 5455221;
   */
  ,setChangedParams: function( formType ){
      //get params object
      var pageObj = CP.UI.getMyObj();
      pageObj.params = {}; //clear out old form params
      var params = pageObj.params;
      var paramsKey = 'rbaroles';
      var roleName = '';
      
      switch( formType ){
      
          //ADD + EDIT
          case CP.RbaRoles.FORM_TYPE_ADD:
          case CP.RbaRoles.FORM_TYPE_EDIT:
              //get role name
              roleName = Ext.getCmp( CP.RbaRoles.ROLE_NAME_FIELD_ID ).getValue();
              var roleKey = paramsKey +":"+ roleName;
              params[ roleKey ] = 'feature';
              //get features		  
              var ftrStore = Ext.getCmp( CP.RbaRoles.FTRS_GRID_ID ).getStore();
              ftrStore.clearFilter();
              ftrStore.each( function( record ){
                  var rd = record.data;
                  if( rd.permission != 'none' ){
                      params[ roleKey +':feature:'+ rd.name ] = rd.permission;
                  }
              });
              //get commands
              CP.RbaRoles.cmdStore.clearFilter();
              CP.RbaRoles.cmdStore.each( function( record ){
                  var rd = record.data;
                  if( rd.active == true ){
                      params[ roleKey +':feature:'+ rd.name ] = 'rw';
                  }
              });
          break;
          
          //DELETE
          case CP.RbaRoles.FORM_TYPE_DEL:
              //get role name
              var selectedRow = Ext.getCmp( CP.RbaRoles.GRID_ID ).getSelectionModel().getLastSelected();
              roleName = selectedRow.data.name;
              params[ paramsKey +":"+ roleName ] = '';
          break;
          
          //ASSIGN MEMBERS
          case CP.RbaRoles.FORM_TYPE_ASSIGN_MEM:
              //get role name
              var selModel = Ext.getCmp( CP.RbaRoles.GRID_ID ).getSelectionModel();
              var selectedRow = selModel.getLastSelected();
              roleName = selectedRow.data.name;
              var roleKey = paramsKey +":"+ roleName;
              params[ roleKey ] = 'user';
              //get users
              var usrStore = Ext.getCmp( CP.RbaRoles.DUAL_LIST_ID ).rightList.getStore();
              usrStore.each( function( record ){
                  params[ roleKey +':user:'+ record.data.name ] = 't';
              });
          break;
      }
      
      //request common params
      params[ paramsKey ] = roleName;
      params[ 'lock:token' ] = CP.global.token;
  }
    
  
  //refresh page and reload data after submit
  ,afterSubmit: function( form, action ){
      Ext.Ajax.request({
          url: CP.RbaRoles.TCL_REQUEST,
          method: 'GET',
          success: function( jsonResult ){
              CP.RbaRoles.rolesData = Ext.decode( jsonResult.responseText );    
              //refresh grid data
              var grid = Ext.getCmp( CP.RbaRoles.GRID_ID );
              var store = grid.getStore();
              var reader = store.getProxy().getReader();
              var data = reader.read( CP.RbaRoles.rolesData );
              store.loadData( data.records );
              grid.doComponentLayout();
              
              //disable buttons
              Ext.getCmp( CP.RbaRoles.EDIT_BTN_ID ).disable();
              Ext.getCmp( CP.RbaRoles.ASIGNMEM_BTN_ID ).disable();
              Ext.getCmp( CP.RbaRoles.DEL_BTN_ID ).disable();
          }
      });
  }

} //eof roles object

