// ~~~ Toppanel: banner, toolbars and application info

CP.WebUI4.Toppanel = Ext.create( 'CP.WebUI4.Container',{
    /*  Globals     */
    scratchpadMaxLength: 3145728, // 3 MB
    suspendNetInteraction: false,

    MODAL_WIN_ID: 'enable-window',
    TCL_REQUEST: '/cgi-bin/enable.tcl',
    TCL_RESPONCE: '/cgi-bin/enable.tcl',
    rolesData : null,
    rolesStore : null,
    region: 'north',
    id: 'toppanel_main_container',
    cls: 'toppanel-main-container',
    margin: '0 0 1 0',
    height: 45,
    layout: {
        type: 'hbox',       // Arrange child items horizontally
        align: 'stretch',   // Each takes up full width
        pack: 'start'
    },
    defaults: {
        xtype: 'cp4_container',
        height: 44
    },
    listeners: {
        afterrender: { scope:this, fn:function( panel, options ){
            /*removes all concecutive separators from the toolbar*/
            function removeConsecutiveSeparatorsInToolBar(){
                var toolBar = Ext.getCmp('toppanel_tb_upper');
                var pervIsSeparator = false;
                var toRemove = []
                var arr = toolBar.items.items;
                // collect all separators to remove
                for (var i=0; i< arr.length; i++){ // collect all separators to remove
                    var item = arr[i];
                    if (item.xtype == 'tbseparator'){
                        if (pervIsSeparator) {
                            toRemove.push(item.id);
                        }
                        else {pervIsSeparator = true;}
                    }
                    //add combobox here so it will recognize the store and tpl properties
                    else if ( item.id =='search_placesaver' ){
						toolBar.remove(item, item);
						toolBar.insert(i,tools_search_combo);
						//toolBar.insert(i+1,tb_spacer);
                    	} else {
                        pervIsSeparator = false;
                    }
                }
                // remove all collected items
                for (var i=0; i< toRemove.length; i++) {toolBar.remove(toRemove[i]);}
            }

            var marginIE8 = ( screen.width > 1024 ) ? '1 0 0 147' : '1 0 0 83';
            var marginAll = ( screen.width > 1024 ) ? '0 0 0 147' : '0 0 0 83';

            var tb_spacer = {xtype: 'tbspacer', width: 200};
            //add combobox here so it will recognize the store and tpl properties
            var tools_search_combo =  {
                xtype: 'combobox',
                id: 'tb_tools_search_combo_input',
                name: 'tb_tools_search_combo_input',
                maskRe: /^\S+$/,
                emptyText: 'Search',
                cls: 'toppanel-search',
                emptyCls: 'empty-text-toppanel-search',
                triggerCls: 'toppanel-search-trigger',
                displayField: 'title',
                queryMode: 'remote',
                vtype: 'alphanum',
                hideTrigger: true,
                margin: (CP.util.isIE8()) ? marginIE8 : marginAll,
                minChars: 2,
                width: 200,
                height: 30,
                typeAhead: false,
                hideLabel: true,
                store: panel.searchStore,
                listConfig: {
                    emptyText: 'No matching items found.',
                    id: 'searchBoundlist',
                    loadingText: 'Searching...',
					cls: 'search-bound-list',
                    padding: '0 0 0 0',
                    itemSelector: 'div.search-item',
                    pagingToolbar:  new Ext.widget('cp4_searchfooter', {
                        pageSize: 5,
                        store: panel.searchStore,
                        border: false
                    }),
                    minWidth: 300,
                    maxHeight: 300,
                    width: 300,
                    getInnerTpl:
                        function(){ //custom rendering template for each item
                        return '<div class="search-item" id="comment-{id}" '
                            +  'style="margin-left:{[values.nestLevel === 0 ? "1" : "1"]}px; color: {["#f9f9dd"]}; border-top:1px #ccc solid;padding:5px;">'
                            +  '<table><tbody><tr>'
                            +  '<td width="20" class={js_icon}></td>'
                            +  '<td>'
                            +  '<b style="color: blue; text-decoration:underline">{js_text}</b>'
                            +  '<p style="color: black;"><span>  </span>{js_desc}</p>'
                            +  '</td>'
                            +  '</tr></tbody></table>'
                            +  '</div>';
                    }
                },
                listeners: {
                    select:
                    function(comb, rec, num){
                        this.RowClicked(rec[0]);
                        comb.fireEvent('blur');
                        comb.hasFocus = false;
                        comb.triggerBlur();
                    },
                    blur:
                    function(eOpts){this.clearValue();}
                },
                RowClicked:
                function(rec) {
                    var tree = Ext.getCmp( 'cptree' );
                    var rootTree = tree.getRootNode();
                    var treeNode = rootTree.findChild( 'url', 'tree/'+rec.data.js_search, true );
                    if(!treeNode) {
                        treeNode = rootTree.findChild( 'murl', 'tree/'+rec.data.js_search, true );
                    }
                    if(treeNode) {
                        tree.fireEvent( 'itemclick', tree.getView(), treeNode ); //change page to the selected one
                        tree.selectPath( treeNode.getPath() ); //expand tree and highlight the selected node
                    }
                },

                //overriding onListSelectionChange function just to remove the behavior that the field is getting focus after selection
                onListSelectionChange:
                    function(list, selectedRecords) {
                    var me = this,
                    isMulti = me.multiSelect,
                    hasRecords = selectedRecords.length > 0;

                    if (!me.ignoreSelection && me.isExpanded) {
                        if (!isMulti) {
                            Ext.defer(me.collapse, 1, me);
                        }

                        if (isMulti || hasRecords) {
                            me.setValue(selectedRecords, false);
                        }
                        if (hasRecords) {
                            me.fireEvent('select', me, selectedRecords);
                        }
                        // me.inputEl.focus();
                    }
                }
            };
			
		
            //send ext requests
            panel.sendInitRequests();

            //add before unload event to close terminal window
            Ext.EventManager.on( window, 'beforeunload', function(){
                //send the close session of the terminal when closing (or signing out) the window of the application
                var term_C = Ext.getCmp( 'webui_terminal_console' );
                if( term_C ){
                    term_C.terminal.close_term();
                }
            });
            removeConsecutiveSeparatorsInToolBar(); // in case we removed features from the toppanel
        }} //eof afterrender
    }, //eof listeners
    removeCurrentRecord: function(thisStore,record) {
	   if (thisStore.count() == 1) {
            thisStore.removeAll();
        } else {
            thisStore.remove(record);
            thisStore.totalCount--;
        }
	},
    searchStore: Ext.create( 'CP.WebUI4.JsonStore',{
        autoLoad: false,
        fields: [ 'js_search',
                  'js_text',
                  'js_desc',
                  'js_icon' ],
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/search.tcl',
            noCache: false,   //removes the ExtJS '_dc' parameter from the request
            pageParam: null,  //removes the ExtJS 'page' parameter from the request
            startParam: null, //removes the ExtJS 'start' parameter from the request
            limitParam: null, //removes the ExtJS 'limit' parameter from the request
            reader: {
                type: 'json',
                root: 'data.search'
            }
        },
        listeners: {

            beforeload: function( thisStore, operation, eOpts ){
                thisStore.removeAll();
            },
            load: function( thisStore, records, successful, operation, options ){
                var tree = Ext.getCmp( 'cptree' );
                var rootTree = tree.getRootNode();
                var count = 0;
                var foundNodeIds = [];

                //the backend doesn't send all data to the client.
                //take the page name from store, find that node in the navtree and add to record the data from tree
                thisStore.each( function( record ){
                    var jsSearch = record.data.js_search;
                    var treeNode = rootTree.findChild( 'url', 'tree/'+jsSearch, true );
                    if( !treeNode ) {
                        // first fail means, check for murl
                        treeNode = rootTree.findChild( 'murl', 'tree/'+jsSearch, true );
                    }

                    if( !treeNode ) {
                   		CP.WebUI4.Toppanel.removeCurrentRecord(thisStore,record);
                    }
                    else
                    {
                        var attrib = treeNode.raw;
                        if(Ext.Array.indexOf(foundNodeIds, attrib.id) === -1 &&
							treeNode.data.parentId != "root" ) {
                            Ext.Array.include(foundNodeIds, attrib.id);
                            count++;
                            record.data.js_text = attrib.text;
                            record.data.js_desc = attrib.description;
                            record.data.js_icon = attrib.iconCls || 'element';
                            thisStore.fireEvent("datachanged", options);
                        } else {
							CP.WebUI4.Toppanel.removeCurrentRecord(thisStore,record);
						}
                    }
                    return true;
                });

            } //eof datachanged
        } //eof listeners
    }), //eof searchStore

    //define items structure
    items: [{
        //left - name of appliance and host
        cls: 'top_center',
        width: 165,
	      height: 44,
        defaults: {
            xtype: 'cp4_container',
            padding: '2 0 0 10',
            width: '100%'
        },
        items: [{
            id: 'top_west_header',
            cls: 'top-west-header',
            value: 'Appliance Name'
        },{
            id: 'top_west_hostname',
            cls: 'top-west-hostname',
            value: 'cpmodule'
        }]
    },{
        //center - toolbars
        cls: 'top_center',
        flex: 1,
        items: [{          
            id: 'toppanel_tb_upper',
            cls: 'tb_info',
            xtype: 'cp4_toolbar',
            border: 0,
            padding: '0 5 0 10',
            height: 44,
            items: [{
               
                iconCls: 'btn_lock',
				pressedCls: '',
                id: 'tb_info_lock',
                handler: CP.util.configLock_click
             }, '-', {
                id: 'toppanel_terminal_btn',
                iconCls: 'btn-terminal',
                tooltip: 'Open terminal',
                handler: function(){
                    CP.WebUI4.Toppanel.suspendNetInteraction = true;
                    CP.WebUI4.Toppanel.openTerminal();
                }
			
             }, '-', {
                id: 'toppanel_scratchpad_btn',
                iconCls: 'btn_scratchpad',
                tooltip: 'Open scratchpad',			
                hidden: true,
                listeners: {
					afterrender : function () {					
						if (this.hidden) {
							this.prev().hide(true);
						}
					}
				},				
				handler: function(){ CP.WebUI4.Toppanel.openScratchpad(); }
			}, '-', {
			
				//cloning group,
				listeners: {
					afterrender : function () {
						if(  CP.global.isRealCadmin ||
							!CP.global.isClusterEnabled ||
							!CP.util.isPermittedFeature('CloningGroupManagement')) 
						{
							 this.previousSibling().hide()
							 this.hide();
						}
						
						if(!CP.global.isCluster) {
							this.setIconCls('btn_cg_group');
						} else {
							this.setIconCls('btn_cg_single');
						}
					}
				},
				//componentCls: 'tb_sign_out',
                pressedCls: '',
		cls:'btn_cg_single',
                id: 'tb_cloning_switch',
                handler: function(){ CP.WebUI4.Toppanel.SwitchCloningGroupMode(); }	
				

			
			}, '->', {

                //middle - search_dropbox placeholder	
                id:'search_placesaver'
				
			}, '->'
			]
						 
        }] //eof center - toolbar
    },{
        //right - logo + logout
        id: 'top_east_header',
        cls: 'top_center',
		width: 400,
		defaults: {
			height: 44
		},
		items: [
		{ 
		xtype: 'cp4_toolbar',
			cls: 'top_right',
			items: [
			'->',{	
			//right - username	
            xtype: 'tbtext',	
			id: 'top_panel_user_name1',
			cls: 'toppanel-username',
			text: _userName 
		}, '-', {               
			iconCls:'tb_sign_out',
			pressedCls: '',
			tooltip: 'Sign Out',		
			handler: function(){ CP.WebUI4.Toppanel.do_logout(); }
			},{
				xtype: 'container',	
				id: 'top_panel_east',
				cls: 'top_right_picture',
				height: 44,
				width: 120
			}]
		}]	
	}] 

    //bookmark selected page and add it to the bookmark tree
    ,add_bookmark: function(){
        var node = Ext.getCmp('cptree').getSelectionModel().getSelectedNode();
        if( !node ){
            //nothing has been selected in tree
            return;
        }
        if( Ext.getCmp('bmtree').getRootNode().findChild('url', node.attributes.url, true)){
            //the selected node is already bookmarked
            return;
        }

        //add
        var newNode = new Ext.tree.TreeNode({
            text: node.text,
            url: node.attributes.url,
            murl: node.attributes.murl,
            iconCls: node.attributes.iconCls,
            access: node.attributes.access,
            leaf: true
        });
        Ext.getCmp('bmtree').getRootNode().appendChild( newNode );
    }

    //logout from the application
    ,do_logout: function(){
        Ext.Ajax.request({
            url: "/cgi-bin/conflock.tcl?option=releaseLock&token="+ CP.global.token,
            success: function() {
                CP.util.redirectToLogin();
            }
        });
    }

    ,openModalWin: function( title ){

        var modalWin = Ext.getCmp( CP.WebUI4.Toppanel.MODAL_WIN_ID );
        if (modalWin ) {
            modalWin.show() ;
        } else {

            //load grid store with roles data
            CP.WebUI4.Toppanel.rolesStore = Ext.create( 'CP.WebUI4.Store',{
                fields: [ 'name', 'users' ],
                data: CP.WebUI4.Toppanel.rolesData,
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        root: 'data.roles',
                        successProperty: 'success'
                    }
                }
            });

            Ext.create( 'CP.WebUI4.ModalWin',{
                id: CP.WebUI4.Toppanel.MODAL_WIN_ID,
                title: title,
                width: 380,
                height: 150,
                items: [{
                    xtype: 'cp4_formpanel',
                    //id: MODAL_WIN_TAC_ID,
                    bodyPadding: 15,
                    items: [
                    {
                        // form field: 'Priority'
                        xtype: 'cp4_combobox',
                        id: 'privlevel-combobox',
                        name: 'privilege',
                        fieldLabel: 'Privilege',
                        invalidText: 'TACP-0',
                        displayField: 'users',
                        valueField : 'name',
                        store: CP.WebUI4.Toppanel.rolesStore,
                        value:'TACP-0',
                        allowBlank: false,
                        editable: false
                    },{
                        xtype: 'cp4_password',
                        id: 'enable-passwd',
                        name: 'passwd',
                        fieldLabel: 'Password',
                        maxLength: 256,
                        allowBlank: false,
                        validator: function(value){
                            // can't include space or newline.
                            if (/(\s|\n)/.test(value)) {
                              return "Invalid password: may not contain space or newline";
                            }
                            return true;
                        }
                    }],
                    buttons: [{
                        xtype: 'cp4_button',
                        text: 'OK',
                        handler: Ext.Function.bind( CP.WebUI4.Toppanel.enableUser, this )

                    },{
                        xtype: 'cp4_button',
                        text: 'Cancel',
                        handler: function(){
                            Ext.getCmp( CP.WebUI4.Toppanel.MODAL_WIN_ID ).close();
                        }
                    }]
                }]

            }).show();

        }
    }

    ,enableUser: function()
    {
        //debugger ;

        // get the password and user name from the window.
        var myparams = {};
        myparams['save'] = '1' ;
        myparams['user_name'] = Ext.getCmp('privlevel-combobox').value ;
        myparams['passwd'] = Ext.getCmp('enable-passwd').value ;

        Ext.Ajax.request({
            url: CP.WebUI4.Toppanel.TCL_RESPONCE,
            params: myparams,
            method: 'POST',
            override_ro: true,
            success: function( jsonResult ){

                //then when response is returned - load the rest
                var result = Ext.decode( jsonResult.responseText );

                if (result.success ==  "false" ) {
                    Ext.Msg.show({ //display message
                        title: "TACACS+ Enabling Failure"
                        ,msg: "Authentication failure"
                        ,animEl: 'elId'
                        ,icon: 'webui-msg-warning'
                        ,buttons:  Ext.Msg.OK
                        ,fn: function( button, text, opt ){
                            if( button == "ok" )
                                    ;
                        }
                    });

                } else  {
                    //reload mainframe for all other browsers
                    document.location.reload();


                }

            },
            failure: function () {

                Ext.Msg.alert("Warning","Failure");
            }

        });

        var modalWin = Ext.getCmp( CP.WebUI4.Toppanel.MODAL_WIN_ID );
        if (modalWin){
            modalWin.close();
        }
    }

    //open terminal window
    ,openTerminal: function(){
        var terminalId = 'webui_terminal_console_win';	
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: terminalId,
            title: 'Terminal',
            bodyStyle: 'overflow:hidden;',
            animateTarget: 'toppanel_terminal_btn',
            width: 680,
            height: 460,
			defaultFocus : 'webui_terminal_id',
            items: [{
				id: 'webui_terminal_id',
                xtype: 'cp4_consolepanel',
                terminalConsoleId: terminalId				
            }]
        }).show();		
		if (Ext.isIE){
			setTimeout(function() {document.getElementById("cursor").focus()},700);
		}
    },

    openFeedbackPanel: function(){
        Ext.create( 'CP.WebUI4.ModalWin',{
            id: 'feedback_win',
            title: 'Tell us what you think!',
            bodyStyle: 'overflow:hidden;',
            animateTarget: Ext.getCmp('toppanel_feedback_btn') ? 'toppanel_feedback_btn': '',
            width: 450,
            height: 370,
            items: [{
                xtype: 'cp4_formpanel',
                id: 'feedback_panel',
                defaults: {
                    margin: '5 10 5 10'
                },
                items: [{
                    xtype: 'cp4_displayfield',
                    value: 'Please share with us your impressions. Your feedback will help us improve Gaia.',
                    submitValue: false,
                    margin: '5 10 10 10'
                },{
                    xtype: 'cp4_radiogroup',
                    margin: '5 10 5 10',
                    width: 320,
                    allowBlank: false,
                    blankText: "Please rate your experience",
                    fieldLabel: 'Experience',
                    items: [{
                        boxLabel: '1',
                        name: 'rate',
                        inputValue: '1'
                    },{
                        boxLabel: '2',
                        name: 'rate',
                        inputValue: '2'
                    },{
                        boxLabel: '3',
                        name: 'rate',
                        inputValue: '3'
                    },{
                        boxLabel: '4',
                        name: 'rate',
                        inputValue: '4'
                    },{
                        boxLabel: '5',
                        name: 'rate',
                        inputValue: '5'
                    }]
                },{
                    xtype: 'cp4_panel',
                    layout: 'hbox',
                    margin: '0 10 5 10',
                    height: 20,
                    items: [{
                        xtype: 'cp4_panel',
                        height: 20,
                        width: 100
                    },{
                        xtype: 'cp4_panel',
                        height: 20,
                        width: 20,
                        cls: 'thumb-down'
                    },{
                        xtype: 'cp4_panel',
                        height: 20,
                        width: 155
                    },{
                        xtype: 'cp4_panel',
                        height: 20,
                        width: 20,
                        cls: 'thumb-up'
                    }]
                },{
                    xtype: 'cp4_displayfield',
                    id: 'feedback_receiver',
                    name: 'feedback_receiver',
                    fieldLabel: 'Recipient',
                    submitValue: false,
                    hidden: true
                },{
                    xtype: 'cp4_panel',
                    layout: 'hbox',
                    width: 390,
                    items: [{
                        xtype: 'cp4_textfield',
                        id: 'my_submittername',
                        name: 'name',
                        width: 300,
                        fieldLabel: "Name",
                        value: CP.global.submitterName
                    },{
                        xtype: 'cp4_displayfield',
                        value: 'Optional',
                        flex:1,
                        margin: '0 5 0 5',
                        submitValue: false
                    }]
                },{
                    xtype: 'cp4_panel',
                    layout: 'hbox',
                    width: 390,
                    items: [{
                        xtype: 'cp4_textfield',
                        id: 'my_email',
                        name: "email",
                        width: 300,
                        fieldLabel: "Email",
                        vtype: 'email',
                        emptyText: 'Example: user@company.com',
                        value: CP.global.submitterEmail
                    },{
                        xtype: 'cp4_displayfield',
                        value: 'Optional',
                        flex:1,
                        margin: '0 5 0 5',
                        submitValue: false
                    }]
                },{
                    xtype: 'cp4_panel',
                    layout: 'hbox',
                    width: 390,
                    items: [{
                        xtype: 'cp4_textfield',
                        id: 'my_organization',
                        name: 'company',
                        width: 300,
                        fieldLabel: "Organization",
                        value: CP.global.submitterOrganization
                    },{
                        xtype: 'cp4_displayfield',
                        value: 'Optional',
                        flex:1,
                        margin: '0 5 0 5',
                        submitValue: false
                    }]
                },{
                    xtype: 'cp4_textarea',
                    name: 'comment',
                    width: 390,
                    height: 100,
                    fieldLabel: "Comments and Suggestions"
                },{
                    xtype: 'cp4_textfield',
                    id: 'os_product',
                    submitValue: false,
                    hidden: true,
                    name: 'os_product'
                },{
                    xtype: 'cp4_textfield',
                    id: 'cpshared_version',
                    submitValue: false,
                    hidden: true,
                    name: 'cpshared_version'
                },{
                    xtype: 'cp4_textfield',
                    id: 'os_kernel',
                    submitValue: false,
                    hidden: true,
                    name: 'os_kernel'
                },{
                    xtype: 'cp4_textfield',
                    id: 'os_edition',
                    submitValue: false,
                    hidden: true,
                    name: 'os_edition'
                },{
                    xtype: 'cp4_textfield',
                    id: 'os_build',
                    submitValue: false,
                    hidden: true,
                    name: 'os_build'
                },{
                    xtype: 'cp4_textfield',
                    id: 'serial',
                    name: 'serial',
                    submitValue: false,
                    hidden: true
                }],
                listeners: {
                    render: function( formPanel ){
                        formPanel.getForm().load({
                            url: '/cgi-bin/overview.tcl',
                            method: 'GET'
                        });
                    }
                },
                buttons: [{
                    xtype: 'cp4_button',
                    id: 'feedback_submit_btn',
                    text: 'Submit',
                    disabled: (CP.global.token == -1),
                    tooltip: ((CP.global.token == -1)? 'Please acquire the configuration lock and try again' : ''),
                    handler: function(){
                        var form = Ext.getCmp('feedback_panel').getForm();
                        if (!form.isValid())
                            return;
                        var values = form.getValues();
                        var randStr = new String(Math.random());

                        values = Ext.apply( values, {'mode':'Feedback',
                                                     'uid': randStr.substr(2),
                                                     'unique_site_id': CP.global.dispHostname,
                                                     'product': 'Gaia',
                                                     'buildnumber': Ext.getCmp('os_build').getValue()
                                                     } );
                        var additionalComments = "\nSystem Information:\n" +
                                "os_product: " + Ext.getCmp('os_product').getValue() + "\n" +
                                "cpshared_version: " + Ext.getCmp('cpshared_version').getValue() + "\n" +
                                "os_kernel: " + Ext.getCmp('os_kernel').getValue() + "\n" +
                                "os_edition: " + Ext.getCmp('os_edition').getValue() + "\n" +
                                "platform: " + CP.global.applianceType + "\n" +
                                "serial: " + Ext.getCmp('serial').getValue() + "\n";

                        values['comment'] = values['comment'] + additionalComments;
                        var address = Ext.getCmp('feedback_receiver').getValue();
                        CP.WebUI4.Toppanel.post_to_url(address, values, "POST");

                        // update the database to remember the contact inforamtaion for the next time.
                        var myparams = {};
                        myparams['submitterEmail'] = Ext.getCmp('my_email').getValue() ;
                        myparams['submitterOrganization'] = Ext.getCmp('my_organization').getValue() ;
                        myparams['submitterName'] =  Ext.getCmp('my_submittername').getValue() ;

                        //update global
                        CP.global.submitterEmail = myparams['submitterEmail'];
                        CP.global.submitterOrganization = myparams['submitterOrganization'];
                        CP.global.submitterName = myparams['submitterName'];

                        // to FTW in topPanel.
                        Ext.Ajax.request({
                            url: "/cgi-bin/configured.tcl"
                            ,method: 'POST'
                                ,params: myparams
                            ,success: function( jsonResult ){
                                //location.href = link;
                            }
                        });

                        Ext.getCmp( 'feedback_win' ).close();

                    }
                },{
                    text: 'No, thanks',
                    xtype: 'cp4_button',
                    handler: function(){
                        Ext.getCmp( 'feedback_win' ).close();
                    }
                }]
            }]
        }).show();
    },

    sendImmediateFeedback: function(liked, data, pageObj){
        var currentPage = "";
        if ((typeof(pageObj) != "undefined") && (typeof(pageObj.title) != "undefined")){
            currentPage = pageObj.title;
        }
        else{
            currentPage = "Overview";
        }
        var randStr = new String(Math.random());
        var rate = liked ? 5 : 1;
        var values = {
            'rate': rate,
            'name': CP.global.submitterName,
            'email': CP.global.submitterEmail,
            'company': CP.global.submitterOrganization,
            'mode':'Feedback',
            'uid': randStr.substr(2),
            'unique_site_id': CP.global.dispHostname,
            'product': 'Gaia',
            'buildnumber': data.os_build,
            'comment': "Current page: " + currentPage
        };
        var additionalComments = "\nSystem Information:\n" +
                "os_product: " + data.os_product + "\n" +
                "cpshared_version: " + data.cpshared_version + "\n" +
                "os_kernel: " + data.os_kernel + "\n" +
                "os_edition: " + data.os_edition + "\n" +
                "platform: " + CP.global.applianceType + "\n" +
                "serial: " + data.serial + "\n";

        values['comment'] = values['comment'] + additionalComments;
        var address = data.feedback_receiver;

        CP.WebUI4.Toppanel.post_to_url(address, values, "POST");
    },
	
    SwitchCloningGroupMode: function() {
		Ext.Ajax.request({
			url: '/cgi-bin/cg_mgmt.tcl'
			, method: 'GET'
			, params : {
				'override_cluster_mode' : !CP.global.isCluster
			}
			, success: function(response) {
				var result = Ext.decode( response.responseText );
				if(result.success == "true") {
					location.reload();
				} else {
					Ext.Msg.alert("Error","Cloning Group mode switch failed.");
				}
			}
			, failure: function() { 
				Ext.Msg.alert("Error","Cloning Group mode switch failed.");
			}
		});
	},

    //open the scratchpad
    openScratchpad: function() {

        function loadTextToScratchpad(){    /* Private Function */
            Ext.Ajax.request({
                    url: '/cgi-bin/scratchpad.tcl'
                    , method: 'GET'
                    , success: function(response) {
                        var jsonData = Ext.decode(response.responseText);
                        var text = jsonData.data.publicScratchpadText;
                        Ext.getCmp( 'scratchpadValue' ).setValue(text);
                    }
                    ,failure: function() {Ext.Msg.alert("Error","Scratchpad experienced trouble loading your saved text.");}

            });
        }

        /*
            destination: public or private scratchpad
         */
        function saveScratchpadTextToServer(destination){    /* Private Function */
            // Encode text since it has to escape chars that ajax is sensitive to
            var text = Ext.getCmp( 'scratchpadValue' ).getValue();
            if (text.length > CP.WebUI4.Toppanel.scratchpadMaxLength){ // text saved on the server has to be limited in size
                Ext.Msg.alert("Error","The text entered is too long to be saved by the scratchpad.");
                return;
            }
            var myparams = {};
            if (text == "<BR>" || (text.length==1)){ // In case of an empty note
                myparams["publicScratchpadText"] = "";
            }
            else{
                myparams["publicScratchpadText"] = text;
            }
            myparams["scratchpadDestination"] = destination;
            Ext.Ajax.request({
                    url: "/cgi-bin/scratchpad.tcl"
                    ,method: "POST"
                    ,params: myparams
                    ,success: function() {Ext.getCmp( 'scratchpad_modalwin' ).close();}
                    ,failure: function() {Ext.Msg.alert("Error","Scratchpad experienced trouble saving your text.");}
            });
        }

        function isScratchpadRO(){ return (CP.util.featurePermission('scratchpad') == "ro");}

        Ext.create( 'CP.WebUI4.ModalWin',{
            id: 'scratchpad_modalwin',
            title: ((isScratchpadRO()) ?'Scratchpad - Read Only' : 'Scratchpad') ,
            animateTarget: 'toppanel_scratchpad_btn',

            items: [{
                xtype: 'cp4_formpanel',
                id: 'change_view_mode_form',
                defaults: {
                    hideLabel: true
                },
                items: [{
                    xtype: 'cp4_htmleditor',
                    id: 'scratchpadValue',
                    name: 'scratchpadValue',
                    width: 670,
                    height: 400,
                    enableLists: false,
                    enableLinks: false,
                    listeners:{
                        render: function()  {loadTextToScratchpad();}
                    }
                }],
                buttons: [{
                    xtype: 'cp4_button',
                    text: 'OK',
                    disabled: (isScratchpadRO()),
                    handler: function() {saveScratchpadTextToServer("public");}
                },{
                    xtype: 'cp4_button',
                    text: 'Cancel',
                    handler: function(){Ext.getCmp( 'scratchpad_modalwin' ).close();}
                }]
            }]
        }).show();
    },

    //get data and update in panel
    sendInitRequests: function(){
        Ext.Ajax.request({
            url: '/cgi-bin/image.tcl',
            method: 'GET',
            params: {appType:'true'},
            success: function( response ) {
                var jsonData = Ext.decode( response.responseText );
                var appliance_type = jsonData.data.appType;
                CP.global.applianceType = appliance_type;
                if( appliance_type != '' ){
					if(CP.global.isCluster) {
						Ext.getCmp( 'top_west_header' ).update("Cloning Group");
					} else {
						Ext.getCmp( 'top_west_header' ).update( appliance_type );      
					}					
                }                  

				// if tacacs is enabled				
				if (jsonData.data && jsonData.data.tacacs != "") { 
					
					//change the user name to indicate enabled user
					var top_panel_user_name = Ext.getCmp( 'top_panel_user_name1') ;
					top_panel_user_name.setText( _userName + "[" + jsonData.data.tacacs_role + "]");
								
					var toolbar_tools = Ext.getCmp( 'toppanel_tb_upper' );
					var loc = 5;
					
					toolbar_tools.insert(loc++, '-');
					toolbar_tools.insert(loc++, {
						id: 'tacaca_enable_btn',
						tooltip: 'Upgrade your privileges',			
						iconCls: 'btn_tacacs',
						cls: 'btn_tacacs',						
						disabled: (CP.global.token == -1),
						pressedCls: '',
						listeners:{
							afterrender	: function(){
												
								Ext.Ajax.request({ //???
										url: CP.WebUI4.Toppanel.TCL_REQUEST,
										method: 'GET',
										success: function( jsonResult ){
											//then when response is returned - load the rest
											CP.WebUI4.Toppanel.rolesData = Ext.decode( jsonResult.responseText );
										}
										
									});
							}
						},
												
						handler: function(){ CP.WebUI4.Toppanel.openModalWin("Enable"); }
			       });
				
				}
								
				if (!CP.global.isCluster && CP.util.isPermittedFeature('scratchpad')) { 
					var toolbar_tools = Ext.getCmp( 'toppanel_tb_upper' );
					var loc = 3;
					toolbar_tools.insert(loc++, '-');
					Ext.getCmp( 'toppanel_scratchpad_btn' ).show();
				}
				
				/*
				if (CP.global.isClusterEnabled && CP.util.isPermittedFeature('CloningGroupManagement')) {
					var toolbar_tools = Ext.getCmp( 'toppanel_tb_upper' );
                	if (toolbar_tools ){
                		toolbar_tools.add(loc++, { 
							id: 'toppanel_manage_cloning_group_btn',
						//	iconCls: 'btn-toppanel-simple-view',
							tooltip: 'Manage Cloning Group',
							text: !CP.global.isCluster ? 'Enter Cloning Group Mode' : 'Exit From Cloning Group Mode',
							handler: function(){ CP.WebUI4.Toppanel.SwitchCloningGroupMode(); }	
			            });
					}
				}	
				*/				
				
				if(CP.global.isCluster) {
					var toolbar = Ext.getCmp( 'toppanel_tb_upper' ); 
					//remove all items before the 'tb_cloning_switch' - terminal_btn (toppanel_terminal_btn) and lock (tb_info_lock) with their separetors. 					 
					var toRemove = [];
					var arr = toolbar.items.items;
					
					for (var i=0; i< arr.length; i++){ // collect all separators to remove
					var item = arr[i];
						if(item){
							if (item.id != 'tb_cloning_switch'){
								toRemove.push(item.id);
							}
							else {break};	
						}				
					}
					// remove all collected items
					for (var i=0; i< toRemove.length; i++) {toolbar.remove(toRemove[i]);}			
				}
				
                if (jsonData.data.ea && jsonData.data.ea != "") {
                    Ext.getCmp( 'top_east_header' ).addCls('top_east_ea');
                    CP.global.isEA = true;

                    var toolbar_tools = Ext.getCmp( 'toppanel_tb_upper' );
                    if (toolbar_tools){

                        var loc = 1 ;
                        toolbar_tools.insert(loc++, '-');
                        toolbar_tools.insert(loc++, {
                            id: 'toppanel_feedback_btn',
                            iconCls: 'btn-feedback',
                            tooltip: 'Tell us what you think',
                            handler: function(){ CP.WebUI4.Toppanel.openFeedbackPanel(); },
                            listeners:{
                                enable: function(){
                                    var fSubmitBtn = Ext.getCmp('feedback_submit_btn');
                                    if (fSubmitBtn){
                                        fSubmitBtn.enable();
                                        fSubmitBtn.setTooltip('');
                                    }
                                }
                            }
                        });
                        toolbar_tools.insert(loc++, '-');
                        toolbar_tools.insert(loc++, {
                            id: 'toppanel_feedback_smile_btn',
                            iconCls: 'btn-smile',
                            tooltip: 'When you see something that Gaia does well, click the happy face.',
                            handler: function(){
                                var pageObj = CP.UI.getMyObj();
                                Ext.Ajax.request({
                                    url: '/cgi-bin/overview.tcl',
                                    method: 'GET',
                                    success: function( jsonResult ){
                                        var jsonData = Ext.decode( jsonResult.responseText );
                                        CP.WebUI4.Toppanel.sendImmediateFeedback(true, jsonData.data, pageObj);
                                    }
                                });
                                CP.WebUI4.Msg.show({
                                    title:'Feedback',
                                    msg: 'Thank you for your feedback.',
                                    buttons: Ext.Msg.OK,
                                    icon: 'webui-msg-ok'
                                });
                            }
                        });
                        toolbar_tools.insert(loc++, '-');

                        toolbar_tools.insert(loc++, {
                            id: 'toppanel_feedback_frown_btn',
                            iconCls: 'btn-frown',
                            tooltip: 'When something could be improved, click the sad face.',
                            handler: function(){
                                var pageObj = CP.UI.getMyObj();
                                Ext.Ajax.request({
                                    url: '/cgi-bin/overview.tcl',
                                    method: 'GET',
                                    success: function( jsonResult ){
                                        var jsonData = Ext.decode( jsonResult.responseText );
                                        CP.WebUI4.Toppanel.sendImmediateFeedback(false, jsonData.data, pageObj);
                                    }
                                });
                                CP.WebUI4.Msg.show({
                                    title:'Feedback',
                                    msg: 'Thank you for your feedback.',
                                    buttons: Ext.Msg.OK,
                                    icon: 'webui-msg-ok'
                                });
                            }
                        });
                    }
                }
            }
        });
        
		if(!CP.global.isCluster) {
			Ext.Ajax.request({
				url: '/cgi-bin/hostname.tcl',
				method: 'GET',
				success: function( response ) {
					var jsonData = Ext.decode( response.responseText );
					var hostname = jsonData.data.hostname;
					if( hostname != '' ){   
						CP.util.setHostName(hostname );
					}                   
				}
			});
		}
		
		if(CP.global.isCluster) {
			CP.util.setHostName(CP.global.CloningGroupName );  
		}
    },
    post_to_url: function(path, params, method, newWin) {
        method = method || "post"; // Set method to post by default, if not specified.

        //add form targeted to the hidden iframe and submit
        var form = document.createElement("form");
        form.setAttribute("method", method);
        form.setAttribute("action", path);
        form.setAttribute("type", "hidden");

        if (newWin){
            form.setAttribute("target", '_blank');
        }
        else{
            //check whether we have hidden iframe already
            var iframesArr = document.body.getElementsByTagName("iframe");
            var i;
            for (i = 0;i < iframesArr.length;i++)
            {
                if (iframesArr[i].name == "hiddenIframe"){
                    break;
                }
            }
            if (i == iframesArr.length){
                //no iframe child - need to add one
                iframe = document.createElement("iframe");
                iframe.setAttribute("name", "hiddenIframe");
                iframe.setAttribute("width", "0");
                iframe.setAttribute("height", "0");
                document.body.appendChild(iframe);
            }
            form.setAttribute("target", 'hiddenIframe');
        }

        for(var key in params) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            if (params[key] == ""){
                params[key] = "NA";
            }
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
        document.body.appendChild(form);

        form.submit();

        //remove only the form - the iframe should remain so we can see in the results of post in debugger
        document.body.removeChild(form);
    }
});
