// Copyright Check Point

// Page for managing user accounts.

CP.Users = {

    EXT4_PANEL_ID : 'users_ext4_panel',
    EDIT_BTN_ID : 'user-edit-btn',
    DEL_BTN_ID : 'user-delete-btn',
    RSTPASSWD_BTN_ID : 'user-rstpasswd-btn',
    UNLOCKACC_BTN_ID : 'user-unlockacc-btn',
    GRID_ID : 'users-table',
    NO_PASS_ID: 'no_pass_warn',
    FORM_TYPE_ADD : 'add',
    FORM_TYPE_EDIT : 'edit',
    FORM_TYPE_RSTPASSWD : 'reset_password',
    FORM_TYPE_DEL: 'delete',
    DEFAULT_SHELL : '/etc/cli.sh',
    NONLOGIN_SHELL : '/sbin/nologin',
    DEFAULT_GID : 100,
    HOME_BASE : '/home/',
    TCL_REQUEST : '/cgi-bin/user.tcl',
    TCL_RBA_REQUEST : '/cgi-bin/rbaroles.tcl',
	
	user_level_map: {},
	admin_priv_roles: [],
	admin_priv_ftrs: [],
	admin_levels_arr: ["None","Access to Expert features", "Admin-like shell"],

    // build the page
    init : function() {
	
	
		/*
			Array indexOf fix for internet explorer 8
			and other browsers that not support this function.
			
			code taken from:
			https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/IndexOf#Compatibility
		*/
	
		if (!Array.prototype.indexOf) {  
			Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
				"use strict";  
				if (this === void 0 || this === null) {  
					throw new TypeError();  
				}  
				var t = Object(this);  
				var len = t.length >>> 0;  
				if (len === 0) {  
					return -1;  
				}  
				var n = 0;  
				if (arguments.length > 0) {  
					n = Number(arguments[1]);  
					if (n !== n) { // shortcut for verifying if it's NaN  
						n = 0;  
					} else if (n !== 0 && n !== window.Infinity && n !== -window.Infinity) {  
						n = (n > 0 || -1) * Math.floor(Math.abs(n));  
					}  
				}  
				if (n >= len) {  
					return -1;  
				}  
				var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
				for (; k < len; k++) {  
					if (k in t && t[k] === searchElement) {  
						return k;  
					}  
				}  
				return -1;  
			}  
		}  

        // first load roles data for the entire page
        Ext.Ajax.request({
            url : CP.Users.TCL_REQUEST,
            method : 'GET',
            success : function(jsonResult) {
                // then when response is returned - load the rest
                CP.Users.usersData = Ext.decode(jsonResult.responseText);

				
				Ext.Ajax.request({
				url : CP.Users.TCL_RBA_REQUEST,
				method : 'GET',
				success : function(jsonResult) {
					// then when response is returned - load the rest
					CP.Users.rolesData = Ext.decode(jsonResult.responseText);
					if (CP.Users.rolesData.data && CP.Users.usersData.data){
						CP.Users.rolesData = CP.Users.rolesData.data;	
						CP.Users.get_admin_priv_ftrs();
						CP.Users.get_admin_priv_roles();
						CP.Users.set_user_level();
						
					}				
                // 1. create the page object
                var page = {
                    title : 'Users',
                    related : [ {
                        page : 'tree/rbaroles'
                    } ],
                    params : {},
					cluster_feature_name : "users-and-roles",
                    submitURL : CP.Users.TCL_REQUEST,
                    afterSubmit : CP.Users.afterSubmit,
                    // 2. configure the properties for the Ext4 panel and add it
                    // into the page object
                    panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
                        id : CP.Users.EXT4_PANEL_ID, // id is mandatory
                        items : CP.Users.getPageItems()
                    })
                };

                // 3. display the page
                CP.UI.updateDataPanel(page);
            }
        });
			} 
        });
    },

    // get main structure of page items
    getPageItems : function() {
        // load grid store with users data
        CP.Users.usersStore = Ext.create('CP.WebUI4.Store',
                {
                    fields : [ 'name', 'realname', 'uid', 'gid', 'homedir',
                            'shell', {name: 'fpc', type: 'boolean'}, {name: 'acclock', type: 'boolean'}, 'roles', 'mechs', {name: 'fields_changeable', type: 'boolean'},
                            {name: 'roles_changeable', type: 'boolean'} ],
                    sorters : [ {
                        sorterFN : function(obj1, obj2) {

                            var name1 = obj1.get('name');
                            var name2 = obj2.get('name');

                            // admin is first
                            if (name1 == 'admin')
                                return -1;
                            if (name2 == 'admin')
                                return 1;

                            // cadmin is second
                            if (name1 == 'cadmin')
                                return -1;
                            if (name2 == 'cadmin')
                                return 1;								
								
                            // monitor is third
                            if (name1 == 'monitor')
                                return -1;
                            if (name2 == 'monitor')
                                return 1;

                            // the rest by alphabetic order
                            return (name1 < name2) ? -1 : 1;
                        }
                    } ],
                    data : CP.Users.usersData,
                    proxy : {
                        type : 'memory',
                        reader : {
                            type : 'json',
                            root : 'data.users',
                            successProperty : 'success'
                        }
                    }
                });

        // table title
        var usersTitle = {
            xtype : 'cp4_sectiontitle',
            titleText : 'Users'
        };
        
        // buttons bar above table
        var buttonsBar = {
            xtype : 'cp4_btnsbar',
            items : [
                    {
                        text : 'Add',
                        handler : Ext.Function.bind(CP.Users.makeUserForm, this, [CP.Users.FORM_TYPE_ADD])
                    },
                    {
                        text : 'Edit',
                        id : CP.Users.EDIT_BTN_ID,
                        disabled : true,
                        handler : Ext.Function.bind(CP.Users.makeUserForm, this, [CP.Users.FORM_TYPE_EDIT])
                    },
                    {
                        text : 'Delete',
                        id : CP.Users.DEL_BTN_ID,
                        disabled : true,
                        handler : CP.Users.deleteUser
                    },
                    {
                        text : 'Reset Password',
                        id : CP.Users.RSTPASSWD_BTN_ID,
                        width : 105,
                        disabled : true,
                        handler : Ext.Function.bind(CP.Users.makeUserForm, this, [CP.Users.FORM_TYPE_RSTPASSWD])
                    },
                    {
                        text : 'Unlock Account',
                        id : CP.Users.UNLOCKACC_BTN_ID,
                        width : 105,
                        disabled : true,
                        handler : Ext.Function.bind(CP.Users.unlockUserAccount, this )
                    } ]
        };

        
        /*******************************************
         * renderer functions for the grid columns *
         *******************************************/
        
        // name column renderer. adds icon next to login name
        function addUserIcon(value, meta, record, rowIndex, colIndex, store,
                view) {
            if (value == 'admin' || value == 'monitor' || value == 'cadmin') {
                meta.tdCls = 'user_predefined';
            } else {
                meta.tdCls = 'user_defined';
            }
            return value;
        }

        // password change column renderer. adds icon next to Force Password Change value
        function addUserPswChgIcon(value, meta, record, rowIndex, colIndex, store,
                view) {
            if (value == true ) {
                meta.tdCls = 'login-icon';
				value = 'On next logon';
            } else {
                meta.tdCls = '';
				value = ''
            }
            return value;
        }

        // account lock column renderer. adds text in Account Lock column 
        function addUserAccLockTxt(value, meta, record, rowIndex, colIndex, store,
                view) {
            if (value == true ) {
				meta.tdCls = 'lock_on-icon';
				value = 'Yes';
            } else {
            	meta.tdCls = '';
				value = ''
            }
            return value;
        }
        // custom renderer used by other column renderers
        function renderListBrief(value, type, record, map) {
            if (!value || value.length < 1) {
                // list is empty, display nothing in cell
                return '';
            } else if (value.length == 1) {
                // one record in list, display its name
                return (value[0] in map) ? map[value[0]] : value[0];
            } else {
                // more than 1 item in list, display number of items with their type
                return value.length + ' ' + type;
            }
        }

        // role column renderer
        function renderRolesListBrief(value, meta, record, rowIndex, colIndex,
                store, view) {
            return renderListBrief(value, 'Roles', record, {});
        }

        // access mechanism column renderer
        function renderAccessMechsList(value, meta, record, rowIndex, colIndex,
                store, view) {

            // map from back-end names to display names
            var map = {
                Web : 'Web',
                CLI : 'Command Line'
            };

            if (!value || value.length < 1) {
                // list is empty, display nothing in cell
                return '';
            } else if (value.length == 1) {
                // one mech in list, display its name
                return (value[0] in map) ? map[value[0]] : value[0];
            } else if (value.length == 2) {
                // both mechs in list, display both
                var name0 = (value[0] in map) ? map[value[0]] : value[0];
                var name1 = (value[1] in map) ? map[value[1]] : value[1];
                return (name0 + " and " + name1);
            } else {
                // for future use, in case more mechs are added
                renderListBrief(value, 'Access Mechanisms', record, map);
            }
        }

	 	// Privileges column renderer
        function renderPrivilegeList (value, meta, record, rowIndex, colIndex,
                store, view) {
			return CP.Users.user_level_map[record.raw.name]
        } 
        
        // grid columns
        var columns = [ {
            header: 'Login',
            dataIndex: 'name',
            flex: 1,
            renderer: addUserIcon
        }, {
            header: 'UID',
            dataIndex: 'uid',
            flex: 1,
            hidden: false
        }, {
            header: 'Real Name',
            dataIndex: 'realname',
            flex: 1
        }, {
            header: 'Shell',
            dataIndex: 'shell',
            flex: 1,
            hidden: true
        }, {
            header : 'Home',
            dataIndex : 'homedir',
            flex: 1,
            hidden: true
        }, {
            header: 'GID',
            dataIndex: 'gid',
            flex: 1,
            hidden: true
        }, {
            header: 'Roles',
            dataIndex: 'roles',
            sortable: false,
            flex: 1,
            renderer: renderRolesListBrief
        }, {
            header: 'Privileges',
            dataIndex: 'privileges',
            sortable: false,
            flex: 1,
            renderer: renderPrivilegeList,
            hidden: false
        }, {
            header: 'Access Mechanisms',
            dataIndex: 'mechs',
            sortable: false,
            flex: 1,
            renderer: renderAccessMechsList,
            hidden: true
        }, {
            header: 'Force Password Change',
            dataIndex: 'fpc',
            sortable: false,
            flex: 1,
            renderer: addUserPswChgIcon,
            hidden: true
        }, {
            header: 'Account Lock',
            dataIndex: 'acclock',
            sortable: false,
            flex: 1,
            renderer: addUserAccLockTxt,
            hidden: true
        } ];

        // create main table that shows all users (except hidden ones) and a summary of each.
        var usersTable = {
            xtype : 'cp4_grid',
            id : CP.Users.GRID_ID,
            height : 243,
	    width : 780,
            store : CP.Users.usersStore,
            columns : columns,
            listeners : {
                // open edit dialog on row double click
                itemdblclick : function(grid, rowIndex, event) {
                    CP.Users.makeUserForm(CP.Users.FORM_TYPE_EDIT);
                },
                selectionchange : function(gridView, selections) {
                    if (selections.length == 0) {
                        Ext.getCmp(CP.Users.EDIT_BTN_ID).disable();
                        Ext.getCmp(CP.Users.RSTPASSWD_BTN_ID).disable();
						Ext.getCmp(CP.Users.UNLOCKACC_BTN_ID).disable();
                        Ext.getCmp(CP.Users.DEL_BTN_ID).disable();
                        return;
                    }

                    // enable edit, reset password and delete buttons when
                    // selecting a row
                    Ext.getCmp(CP.Users.EDIT_BTN_ID).enable();
                    Ext.getCmp(CP.Users.RSTPASSWD_BTN_ID).enable();

                    var delBtn = Ext.getCmp(CP.Users.DEL_BTN_ID);
                    // built-in users cannot be deleted
                    if (selections[0].data.fields_changeable) {
                        delBtn.enable();
                    } else {
                        delBtn.disable();
                    }
					// disable "unlock account" button is user account is not locked
					var unlockBtn = Ext.getCmp(CP.Users.UNLOCKACC_BTN_ID);
					if (selections[0].data.acclock == true){
						unlockBtn.enable()
					} else {
						unlockBtn.disable()
					}
					
                }
            }
        };
        
        // inline message warning when a user is defined with no password
        var NoPwWarning = Ext.create( 'CP.WebUI4.inlineMsg', {
            id: CP.Users.NO_PASS_ID,
            type: 'warning',
            text: ('One or more of the defined users do not have passwords.' + 
                    ' This is permitted, but will prevent these users from logging in normally.' + 
                    ' You can set passwords for these users by clicking the "Reset Password" button.' + 
                    '<br/><span id="newUsersNoPwsWarning"></span>'),
            hidden: true,
            users: []
        });
        
        //return all objects as one array 
        return [
            usersTitle,
            buttonsBar,
            usersTable,
            NoPwWarning
        ];
    },
	// unlock user account if locked
	unlockUserAccount: function(){

		// decide which data should be loaded to form upon opening
        var record;
            record = CP.Users.getSelectedUser();
		if (record.acclock == true ){
		    //get params object
	        var pageObj = CP.UI.getMyObj();
	        pageObj.params = {}; //clear out old form params
	        var params = pageObj.params;
	        params['passwd:' + record.name + ':unlock'] = 't';
		    
			CP.UI.submitData( CP.UI.getMyObj());
		}else{
			// should not get here but just in case
			Ext.Msg.alert("User Account",'User "' + record.name + '" account is not locked');
		}
	},



	
    // create a form according to the form type
    makeUserForm: function(formType) {
        
        /*******************************************************
         * Different functions used in 'makeUserForm' function *
         *******************************************************/
        
        // makes a regular array readable by store
        function organizeArray(array){
            var newArray = [];
            for (var i = 0; i < array.length; i++){
                newArray.push([array[i]]);
            }
            return newArray;
        }
        
        // makes default real names 
        function recaseString(s) {
          return(s.substr(0,1).toUpperCase() + s.substr(1).toLowerCase());
        }
        
        
        // decide which data should be loaded to form upon opening
        var record;
        if (formType == CP.Users.FORM_TYPE_ADD){
            record = {
                    name: '',
                    realname: '',
                    uid: 0,
                    gid: CP.Users.DEFAULT_GID,
                    homedir: CP.Users.HOME_BASE,
                    shell: CP.Users.DEFAULT_SHELL,
                    fpc: false,
                    roles: [],
                    mechs: ['CLI', 'Web'],
                    fields_changeable: true,
                    roles_changeable: true
            };
        } else {
            record = CP.Users.getSelectedUser();
        }
        
        
        /*********************************************************
         * Define all fields of the user regardless of form type *
         *********************************************************/
        
        var name = Ext.create( 'CP.WebUI4.TextField', {
            id: 'name',
            fieldLabel: 'Login Name',
            vtype: 'username',
            allowBlank: false,
            value: record.name,
            listeners: {
                focus: function( field ){
                    field.originalValue = field.getValue();
                },
                blur: function( field ){
                    // if realname field had a default value then update it accordingly
                    if (realname.getValue() == recaseString(field.originalValue)){
                        realname.setValue(recaseString(field.getValue()));
                    }
                },
                change: function( field, newVal, oldVal ){
                    if (homedir.getValue() == (CP.Users.HOME_BASE + oldVal)){
                        homedir.setValue(CP.Users.HOME_BASE + newVal);
                    }
                }
            },
            validator: function( value ){
                if (formType != CP.Users.FORM_TYPE_ADD) {
                    // login name can only be edited when adding user
                    return true;
                }
                
                // check if user name already in use
                if (CP.Users.usersStore.find('name', value, 0, false, true, true) != -1){
                    return ('This name is in use by another user');
                }
                var hiddenUsers = CP.Users.usersData.data.hiddenusers;
                for (var i = 0; i < hiddenUsers.length; i++){
                    if (value == hiddenUsers[i]){
                        return ('This name is in use by a hidden system user');
                    }
                }
                return true;
            }
        });
        
        var realname = Ext.create( 'CP.WebUI4.TextField', {
            id: 'realname',
            fieldLabel: 'Real Name',
            maskRe: /[-_. a-zA-Z0-9]/,
            value: record.realname
        });
        
        var uid = Ext.create( 'CP.WebUI4.NumberField', {
            id: 'uid',
            fieldLabel: 'UID',
            allowBlank: false,
            value: record.uid,
            minValue: 0,
            maxValue: 65533,
            listeners: {
                change: function( field, newVal, oldVal ){
                    // if gid field had a default value then update it accordingly
                    var oldgid = (parseInt(oldVal) == 0) ? 0 : CP.Users.DEFAULT_GID;
                    var newgid = (parseInt(newVal) == 0) ? 0 : CP.Users.DEFAULT_GID;
                    var currgid = gid.getValue();
                    if (oldgid != newgid && oldgid == currgid){
                        gid.setValue(newgid);
                    }
                }
            },
            validator: function( value ){
                value = parseInt( value );
                if (!record.fields_changeable && (value == 102)) {
                    // special case: allow this; it's already set that way,
                    // the user isn't changing it
                    return true;
                }
                if (value == 0){
                    return true;
                } else if(value < 103 || value > 65533){
                    return('Invalid user id: Must be either 0 or an integer between 103 and 65533');
                } else{
                    // same uid that is configured for user
                    if (record.uid == value){
                        return true;
                    }
                    // check that the uid is not in use by another
                    if (CP.Users.usersStore.find('uid', value, 0, false, true, true) != -1){
                        return ('This UID is already in use');
                    } else{
                        return true;
                    }
                }
            }
        });
        
        var gid = Ext.create( 'CP.WebUI4.NumberField', {
            id: 'gid',
            fieldLabel: 'GID',
            minValue: 0,
            maxValue: 65535,
            allowBlank: false,
            value: record.gid
        });
        
        var password = Ext.create( 'CP.WebUI4.Password', {
            id: 'password',
            value: '',
            validator: function( value ){
                value = new String(value); // make sure it's a string
                
                if (value == '*'){
                    // special case: '*' deletes the user's password (so they can't log in with it)
                    return true;
                }
                if ((value.length >= 6) || (value.length == 0)){
                    return true;
                } else{
                    return 'Password must be at least 6 characters long';
                }
            },
            listeners: {
                change: function( field, newVal, oldVal){
                    // if confirm password was filled with a value and password filed was changed then validate it
                    if (confirmPassword.getValue() != ''){
                        confirmPassword.validate();
                    }
                }
            }
        });
        
        var passwordMeter = Ext.create( 'CP.WebUI4.PasswordMeter', {
            	id:"user_password_meter",
		passwordField: password
        });
        
        var confirmPassword = Ext.create( 'CP.WebUI4.Password', {
            id: 'confirm_password',
            fieldLabel: 'Confirm Password',
            value: '',
            validator: function( value ){
                // checks that it matches the password field
                if ( (value == password.getValue()) || !password.isValid() ){
                    return true;
                } else{
                    return ('The two passwords do not match');
                }
            }
        });
        
        // load shells store with availshells data
        var shellsStore = Ext.create('CP.WebUI4.Store', {
            fields : [ 'shell' ],
            data : organizeArray(CP.Users.usersData.data.availshells),
            proxy : {
                type : 'memory',
                reader : {
                    type : 'array',
                    successProperty : 'success'
                }
            }
        });
        
        var shell = Ext.create( 'CP.WebUI4.ComboBox', {
            id: 'shell',
	    name: 'shell',
            fieldLabel: 'Shell',
            allowBlank: false,
            store: shellsStore,
            displayField: 'shell',
            autoSelect: false,
            editable: false,
            value: record.shell
        });
        
        var fpc = Ext.create( 'CP.WebUI4.Checkbox', {
            id: 'fpc',
            boxLabel: 'User must change password at next logon',
            checked: record.fpc
        });
        
        var homedir = Ext.create( 'CP.WebUI4.TextField', {
            id: 'homedir',
            fieldLabel: 'Home Directory',
            vtype: 'path',
            allowBlank: false,
            value: record.homedir,
            validator: function(value){
                value = new String(value);
                
                if (value.indexOf(CP.Users.HOME_BASE) != 0){
                    return("Home directory must be under \"" + CP.Users.HOME_BASE + "\"");
                } else{
                    return true;
                }
            }
        });
        
        // Access Mechanisms fields
        var mechTitle = {
                xtype: 'cp4_sectiontitle',
                titleText: 'Access Mechanisms',
                width: 255
        };
        
        var mechCLI = Ext.create( 'CP.WebUI4.Checkbox', {
            id: 'cli-cb',
            boxLabel: 'Clish Access',
            checked: (record.mechs.indexOf('CLI') != -1)
        });
        
        var mechWeb = Ext.create( 'CP.WebUI4.Checkbox', {
            id: 'web-cb',
            boxLabel: 'Web',
            checked: (record.mechs.indexOf('Web') != -1)
        });
        
        
        // Dual List for Roles
        var leftStore = Ext.create( 'CP.WebUI4.Store',{
            fields: [ 'role' ],
            data: organizeArray(CP.Users.usersData.data.availroles),
            proxy: {
                type: 'memory',
                reader: {
                    type: 'array',
                    successProperty: 'success'
                }
            }
        });
        
        for (var i = 0; i < record.roles.length; i++){
            var index = leftStore.find('role', record.roles[i], 0, false, true, true);
            leftStore.removeAt(index);
        }
        
        var rightStore = Ext.create( 'CP.WebUI4.ArrayStore',{
            fields: [ 'role' ],
            data: organizeArray(record.roles),
            proxy: {
                type: 'memory',
                reader: {
                    type: 'array',
                    successProperty: 'success'
                }
            }
        });
        
        var rolesDualList = Ext.create( 'CP.WebUI4.DualList', {
            id: 'roles-dual-list',        
            width: 350,       
            defaults: {
                flex: 1,
                height: 250
            },
            listHeight: 250,
        	bodyPadding: '10 10 10 0',
            //left
            leftListStore: leftStore,
            leftListCol: [{
                text: 'Available Roles',
                width:100,
                dataIndex: 'role'
            }],
            //right
            rightListStore: rightStore,
            rightListCol: [{
                text: 'Assigned Roles',
                width:100,
                dataIndex: 'role'
            }]
        });
        
        
        /*********************************************************
         * Choose which fields to show depending on type of form *
         *********************************************************/
        
        var modalWidth = 0; 
        var modalHeight = 0;
        var modalTitle = '';
        var formItems = [];
        
        switch (formType){
        case CP.Users.FORM_TYPE_ADD:
            modalTitle = "Add User";
            modalWidth = 810; 
            modalHeight = 380;
            formItems = [{
                xtype: 'cp4_panel',             
                padding: 20, 
                width:388,
                flex: 1,
                items: [name, passwordMeter, confirmPassword, realname, homedir, shell, fpc, uid, mechTitle, mechWeb, mechCLI]
            },{
                xtype: 'cp4_panel',             
                width: 390,
                height: 350,
                items: [rolesDualList]
            }];
            
            break;
            
        case CP.Users.FORM_TYPE_EDIT:
            modalTitle = 'Edit User "' + record.name + '"';
            modalWidth = 680;
            modalHeight = 290;
            rolesDualList.leftList.setHeight(180);
            rolesDualList.rightList.setHeight(180);
            formItems = [{
                xtype: 'cp4_panel',
                padding: 20,
                flex: 1,
                items: [realname, homedir, shell, fpc, mechTitle, mechWeb, mechCLI]
            }, {
                xtype: 'cp4_panel',             
                width: 390,
                height: 350,
                items: [rolesDualList]
            }];
            
            // The roles and access mechanisms should not be changed for certain users
            if ( !record.roles_changeable ){
                rolesDualList.disable();
                mechCLI.disable();
                mechWeb.disable();
            }
            
            // This fields should not be changed for specific users
            if ( !record.fields_changeable ){
                realname.setReadOnly(true);
                realname.disable();
                uid.setReadOnly(true);
                uid.disable();
                gid.setReadOnly(true);
                gid.disable();
                homedir.setReadOnly(true);
                homedir.disable();
                fpc.disable();
            }
			
			if(record.roles.length > 0 && record.roles[0] == "cloningAdminRole") {
				shell.disable();
			}
			
            break;
            
        case CP.Users.FORM_TYPE_RSTPASSWD:
            modalTitle = 'Reset Password for User "' + record.name + '"';
            modalWidth = 460;
            modalHeight = 160;
            formItems = [{
                xtype: 'cp4_panel',
                padding: 20,
                flex: 1,
                items: [passwordMeter, confirmPassword]
            }];
            break;
        }
        
        // panel that encloses all fields
        var form = Ext.create( 'CP.WebUI4.FormPanel', {
            layout: 'hbox',
            items: formItems,
            buttons: [{
                xtype: 'cp4_button',
                text: 'OK',
                handler: function(){
                    //run validations
                    if( !form.getForm().isValid() ){
                        return;
                    }
					if( (Ext.getCmp('shell').getValue()!== "/etc/cli.sh")  && (Ext.getCmp('shell').getValue()!== "/sbin/nologin")){
						if((formType === 'edit') && ((CP.Users.user_level_map[CP.Users.getSelectedUser('user').name])==="Admin-like shell")){
							CP.WebUI4.Msg.show({
							title: 'Warning! Admin-like Shell',
							msg: 'This user has an Admin-like shell<br>When changing user privileges And/Or shell, please verify shell/privileges compliance.<br>Apply changes?',
							buttons: Ext.Msg.OKCANCEL,
							icon: Ext.Msg.QUESTION,
							fn: function( btn, text ){
							if( btn == 'cancel' ){
								return;
							}else if( btn == 'ok' ){
								CP.Users.saveHandler(formType);
							}
							}
							});
						}else{ //no warn message needed... saving changes
							CP.Users.saveHandler(formType);
						}
					}
					else{
						CP.Users.saveHandler(formType);
					}
					

                    
                }
            },{
                xtype: 'cp4_button',
                text: 'Cancel',
                handler: function(){
                    modalWin.close();
                }
            }]
        });
        
        // make window and open it
        var modalWin = Ext.create( 'CP.WebUI4.ModalWin', {
            title: modalTitle,
            id: 'user_modal_win',
			// add more width for the password stength drowing will fit
            width: modalWidth + 30,
            height: modalHeight,
            items: [ form ]
        });
        modalWin.setHeight(modalHeight + 60);
		modalWin.setWidth(modalWidth + 30);
        modalWin.show();
    },
    
    // returns the record data of the selected user in the main grid
    getSelectedUser: function (){
        var selectedRow = Ext.getCmp(CP.Users.GRID_ID).getSelectionModel().getLastSelected();
        return CP.Users.usersStore.findRecord( 'name', selectedRow.data.name, 0, false, true, true ).data;
    },
    
    //delete the selected user if user approves
    deleteUser: function(){
        var record = CP.Users.getSelectedUser();
        
        //display msg
        CP.WebUI4.Msg.show({
             title: 'Delete User: '+ record.name,
             msg: 'Are you sure you want to delete the selected user?',
             buttons: Ext.Msg.OKCANCEL,
             icon: Ext.Msg.QUESTION,
             fn: function( btn, text ){
                if( btn == 'cancel' ){
                    return;
                }
                CP.Users.saveHandler( CP.Users.FORM_TYPE_DEL );
             }
         });
    },
    
    saveHandler: function( formType ){
        //get params to be posted to server
        CP.Users.setChangedParams( formType );
        
        //submit form
        CP.UI.submitData( CP.UI.getMyObj());
    },
    
    setChangedParams: function( formType ){
        
        // update inline message warning if needed.
        // user - the user, noPass - 'true' if doesn't have a password, 'false' if does
        function updateNoPwWarning(user, noPass) {
            
            var NoPwWarning = Ext.getCmp(CP.Users.NO_PASS_ID);
            var users = NoPwWarning.users;
            var exist = (users.indexOf(user) != -1);
            
            // the case in which no change is needed
            if ((noPass && exist) || (!noPass && !exist))
                return;
            
            if (noPass)
                users.push(user);
            else
                users.splice(users.indexOf(user));
            
            var msg;
            switch (users.length){
            case 0:
                // hide it
                NoPwWarning.hide();
                return;
                
            case 1:
            case 2:
                msg = users.join(' and ');
                break;
                
            default:
                msg = (users[0] + ', ' + users[1] + ', and others');
            }
            
            document.getElementById( 'newUsersNoPwsWarning' ).innerHTML = 'Users affected: '+ msg;
            // show it
            NoPwWarning.show();
        }
        
        //get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; //clear out old form params
        var params = pageObj.params;
        
        if (formType == CP.Users.FORM_TYPE_DEL){
            var selectedRow = CP.Users.getSelectedUser();
            params['passwd:' + selectedRow.name] = '';
            updateNoPwWarning(selectedRow.name, false);
            return;
        }
        
        var user = Ext.getCmp('name').getValue();
        var uid = Ext.getCmp('uid').getValue();
        var homedir = Ext.getCmp('homedir').getValue();
        var password = Ext.getCmp('password').getValue();
        
        if (formType == CP.Users.FORM_TYPE_ADD){
            var addPfx = (':passwd:adduser:' + user);
            params[addPfx] = 't';
            params[addPfx + ':uid'] = uid;
            params[addPfx+':homedir'] = homedir;
            if (password == '')
                updateNoPwWarning(user, true);
        }
        
        if (password != ''){
            params[':passwd:chpass:' + user + ':new1'] = password;
            if (password == '*')
                updateNoPwWarning(user, true);
            else
                updateNoPwWarning(user, false);
        }
        
        if (formType == CP.Users.FORM_TYPE_RSTPASSWD ){
            return;
        }
        
        var userPfx = ('passwd:' + user);
        var rbaPfx = ('mrma:users:user:' + user);
        
        params[userPfx + ':name'] = user;
        params[userPfx + ':realname'] = Ext.getCmp('realname').getValue();
        params[userPfx + ':uid'] = uid;
        params[userPfx + ':gid'] = Ext.getCmp('gid').getValue();
        params[userPfx + ':homedir'] = homedir;
        params[userPfx + ':shell'] = Ext.getCmp('shell').getValue();
        params[userPfx + ':fpc'] = Ext.getCmp('fpc').getValue()? 't' : '';
        
        params[rbaPfx] = 't' ;
        params[rbaPfx + ':access_mechanism:CLI'] = Ext.getCmp('cli-cb').getValue()? 't' : '';
        params[rbaPfx + ':access_mechanism:Web'] = Ext.getCmp('web-cb').getValue()? 't' : '';
        
        var newRoles = Ext.getCmp('roles-dual-list').rightListStore;
        var oldRoles = (formType == CP.Users.FORM_TYPE_EDIT)? CP.Users.getSelectedUser().roles : [];

		if ( 0 == newRoles.getCount()){
			Ext.Msg.alert("User Account",'No roles were applied for user "' + user + '". He will not be able to access his account');
		}
        for (var i = 0; i < newRoles.getCount(); i++){
            var role = newRoles.getAt(i).data.role;
            if ( oldRoles.indexOf(role) == -1 ){
                params[rbaPfx + ':role:' + role] = 't';
            }
        }
        
        for (var i = 0; i < oldRoles.length; i++){
            if (newRoles.find('role', oldRoles[i], 0, false, true, true) == -1){
                params[rbaPfx + ':role:' + oldRoles[i]] = '';
            }
        }
        
    },
    
	
	check_warn_assignment : function( feature ){		
		return feature.RoleAssignmentAction == "warn";
	},
	
	// populate the admin_priv_ftrs with the expert-features that 
	// their "RoleAssignmentAction"=="warn"
    get_admin_priv_ftrs: function( ){	   
	    r_data = CP.Users.rolesData;
		all_ftrs = r_data.availfeatures;
		
		admin_priv_ftrs_map = all_ftrs.filter(function( feature ){
				return feature.	RoleAssignmentAction == "warn"; 
				});			
		CP.Users.admin_priv_ftrs = Ext.Array.map( admin_priv_ftrs_map , function(item){return item.name;});		
    },    
	
	// populate the admin_priv_roles with roles that have expert-features in RW permission 
    get_admin_priv_roles: function( ){	   
	    r_data = CP.Users.rolesData;
		roles = r_data.roles;	
		
		for (var i=0 ; i<roles.length ;  i++){
			features = roles[i].features;
			
			for (var j=0 ; j<features.length ; j++ ){
			    feature = features[j];				
			    //find out if this feature is in the admin_priv_ftrs
				if ( Ext.Array.contains(CP.Users.admin_priv_ftrs, feature.name)  &&
					feature.permission == "rw" ) {						 
					// this role has expert-access 
					CP.Users.admin_priv_roles.push( roles[i].name ); 
					break;
				}		  
			}
		}		   
    },
	
	//  return true if the user has "expert access"
    check_usr_expert_access: function( user ){	   	   
		for ( var i=0 ; i< user.roles.length ;  i++){
			role = user.roles[i];					
			//find out if this role is in the admin_priv_roles
			if ( Ext.Array.contains(CP.Users.admin_priv_roles, role) ) {						 
				// this role has expert-access 
				return true;	
			}		  		
		}
		return false;	   
    },
	
	// for every role calculate it's level of priv.  
    set_user_level: function( ){	   
	    u_data = CP.Users.usersData.data;
		users = u_data.users;	
			
		for ( var i=0 ; i<users.length ;  i++){
			user = users[i];
			if(user.shell != CP.Users.DEFAULT_SHELL || user.shell != CP.Users.DEFAULT_SHELL ){
				CP.Users.user_level_map[user.name] = CP.Users.admin_levels_arr[2];
			} 
			else if(CP.Users.check_usr_expert_access (user) ){
				CP.Users.user_level_map[user.name] = CP.Users.admin_levels_arr[1];
			}
			else {
				CP.Users.user_level_map[user.name] = CP.Users.admin_levels_arr[0];
			}		   
		}
		//add the user_level_map info to the main pannel
		CP.Users.usersData.admin_levels = CP.Users.user_level_map;
    },
	
    //refresh page and reload data after submit
    afterSubmit: function( form, action ){
        Ext.Ajax.request({
            url: CP.Users.TCL_REQUEST,
            method: 'GET',
            success: function( jsonResult ){
                CP.Users.usersData = Ext.decode( jsonResult.responseText );    
                				
				Ext.Ajax.request({
				url : CP.Users.TCL_RBA_REQUEST,
				method : 'GET',
				success : function(jsonResult) {
					// then when response is returned - load the rest
					CP.Users.rolesData = Ext.decode(jsonResult.responseText);
					if (CP.Users.rolesData.data && CP.Users.usersData.data){
						CP.Users.rolesData = CP.Users.rolesData.data;	
						CP.Users.get_admin_priv_ftrs();
						CP.Users.get_admin_priv_roles();
						CP.Users.set_user_level();
						
					}
                //refresh grid data
                var grid = Ext.getCmp( CP.Users.GRID_ID );
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read( CP.Users.usersData );
                store.loadData( data.records );
                grid.doComponentLayout();
                
                //disable buttons
                Ext.getCmp( CP.Users.EDIT_BTN_ID ).disable();
                Ext.getCmp( CP.Users.RSTPASSWD_BTN_ID ).disable();
                Ext.getCmp( CP.Users.UNLOCKACC_BTN_ID ).disable();
                Ext.getCmp( CP.Users.DEL_BTN_ID ).disable();
            }
        });
			} 
        });
        
        //close modal if open
        var modalWin = Ext.getCmp( 'user_modal_win' );
        if( modalWin )
        	modalWin.close();
    }
}
