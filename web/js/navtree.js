/*
 * Ext 4.0.2 has a bug in which TreePanel that was created inside view port using Ext.create
 * will not render the scrollbars when needed (overflow=hidden).
 * in the Sencha forum they said it will be fixed for future versions
 * */
//CP.WebUI4.Navtree = Ext.create( 'CP.WebUI4.TabPanel',{
CP.WebUI4.Navtree = {

        //'All' - main tree
        xtype: 'cp4_treepanel',
        id: 'cptree',
        autoScroll: true,
        lines: false,
        rootVisible: false,
		region: 'west',
		cls: 'main-navtree',
		collapsible: true,
		split: true,
		width: 260,
		minWidth: 192,
		maxWidth: 400,
        nodeHashId: "",
        selectionUrl: "",	/* The current page url */
        store: Ext.create( 'CP.WebUI4.TreeStore',{
            fields: ['access','cls','description','iconCls','id','qtip','text','url','murl'],
            storeId: 'cptree_store',
            proxy: {
                type: 'ajax',
                url: '/web/treenodes.json',
                reader: {
                    type: 'json'
                }
            },
            listeners: {
                load: function( store, records, successful, options ){
                    CP.WebUI4.Navtree.onAfterRender( store );
                }
            }
        }),
        listeners: {
            beforeselect: function(rowModel, record){
                // for now, we don't want the summary pages to be clicked
                if (record.data.url.search( /[.]*_summary/i ) != -1) {
                    return false;
                }
                if (CP.WebUI4.Navtree.handleDirtyPage( record ) == false){
                	return false;
                }
            },
            itemclick: function( view, record, htmlEl, index, event, options ){
			// hiding the tree in case of cloud mode
				if(CP.UI.isCloudMode()){
					this.hide();
					Ext.getCmp('toppanel_scratchpad_btn').hide();
					Ext.getCmp('toppanel_terminal_btn').hide();
					Ext.getCmp('tb_tools_search_combo_input').hide();
				}
                // for now, we don't want the summary pages to be clicked
                if (record.data.url.search( /[.]*_summary/i ) != -1) {
                    return;
                }
				var treePanel = Ext.getCmp('cptree');
                //if click on current node - prevent page reload
				if (treePanel.selectionUrl == record.data.url && treePanel.nodeHashId == record.data.id) {
					return;
				}
                CP.WebUI4.Navtree.transferPage( record, event );
                treePanel.nodeHashId = record.data.id;
                treePanel.selectionUrl = record.data.url;  /* update 'selectionUrl' to remember the current page */
            }
         },
         tbar: {
             cls: 'webui_tree_viewmode',
             items: [{
                 xtype: 'cp4_label',
                 text: 'View mode:',
		 width: 90,   
                 padding: '0 5 0 11'
             },{
                 text: 'Basic',
                 id: 'webui_tree_viewmode_btn',
                 cls: 'vm-button',
		 width: 120,   		 
                 tooltip: {text:'Change the view mode'},
                 disabled: true,
                 listeners:{
                	enable: function(btn){
                		btn.setTooltip("Change the view mode");
                	},
					disable: function(btn){
						btn.setTooltip("View mode can't be changed while the database is locked by another user");
					}
                 },
                 menu: {
                     items: [{
                         text: 'Basic',
                         group: 'displaymode',
                         inputValue: 'basic',
                         id: 'webui_tree_basic_item',
                         checked: true,
                         checkHandler: function(item, isChecked){CP.WebUI4.Navtree.changeViewMode(item, isChecked);}
                     },{
                         text: 'Advanced',
                         group: 'displaymode',
                         inputValue: 'advanced',
                         id: 'webui_tree_advanced_item',
                         checked: false,
                         checkHandler: function(item, isChecked){CP.WebUI4.Navtree.changeViewMode(item, isChecked);}
                     }]
                 }
             }]
         }

    ,enableTree: function(){
        var tree = Ext.getCmp( 'cptree' );
        if( !tree ){
            return;
        }
        tree.enable();
    }

    //Handle tree click for 'dirty' pages. In case user changed something in page and then tries to move to another page
    //without saving first - display a confirmation message.
    //In such a case we must cancel the selection of the clicked node in tree and the load of the new page.
    //since this 2 actions called from 2 different events that fired in parallel the loading of the new page is handle from here,
    //and the selection (highlighting) of node in tree is managed from webui-core.js using an interceptor.
    ,handleDirtyPage: function( node )
	{
        var pageObj = CP.UI.pageObj;

        if( pageObj && pageObj.obj )
		{ 	//get previous page if exsits (when entering application on first time there is no previous page)
            //check if there were any changes made in Ext4 pages
				var currentPagePanel = pageObj.obj.panel;
				var treePanel = Ext.getCmp('cptree');
                var forms4 = [];

				if( currentPagePanel.getXType() == 'cp4_formpanel' || currentPagePanel.getXType() == 'cp4_dataformpanel' )
					forms4[0] = currentPagePanel;
				else
					forms4 = Ext.ComponentQuery.query( 'cp4_formpanel, cp4_dataformpanel', currentPagePanel );

						for( var i=0 , form ; form=forms4[i] ; i++ )
						{
							if( !form.getForm ){
								continue;
							}
							var basicForm = form.getForm();
							if( !basicForm ){
								continue;
							}
							if( basicForm.isDirty() == true )  //there was changes - do not proceed!
							{
										var yes = CP.WebUI4.Msg.down('#yes');
										var yes_prev_text = yes.text;
										yes.setText('Discard Changes');

										var no = CP.WebUI4.Msg.down('#no');
										var no_prev_text = no.text;
										no.setText('Stay On Page');

										yes.setWidth(110);
										no.setWidth(100);

										CP.WebUI4.Msg.show(
										{ //display message
											title: 'Discard Changes'
											,msg: 'If you navigate away from this page, your changes will be lost.<br> Do you wish to discard the changes and navigate away?'
											,icon: 'webui-msg-warning'
											,scope: this
											,buttons: Ext.Msg.YESNO
											,fn: function( button, text, opt )
											{
												if( button == "yes" ){ //user pressed ok button and chose to proceed without saving changes
													for( var i=0 , resetform ; resetform=forms4[i] ; i++ ){
														if (resetform.getForm.reset)
															resetform.getForm.reset(); //clear isDirty flag
													}
													this.enableTree();
													this.treeClick( node );
													treePanel.getSelectionModel().select( node, false, true);
													treePanel.nodeHashId = node.data.id;
													treePanel.selectionUrl = node.data.url;	/* update 'selectionUrl' to remember the current page */
												}
												else {
													this.enableTree();
												}
												yes.setText(yes_prev_text);
												yes.setWidth(null);
												no.setText(no_prev_text);
												no.setWidth(null);
											}
										});

								return false;
							}
						}
        }
        return true;
    }

    ,transferPage: function( node, e ){
		var treePanel = Ext.getCmp('cptree');
		this.enableTree();
		this.treeClick( node, e );
		treePanel.getSelectionModel().select( node, false, true);	/* Manually mark the current selection */
		treePanel.nodeHashId = node.data.id;
		treePanel.selectionUrl = node.data.url; /* update 'selectionUrl' to remember the current page */
    }

//On tree node click - handle pages in mainframe
,treeClick: function( node, e, tree ){
    tree = tree || "cptree"; // which tree? - cptree or bmtree
    CP.global.discardClicked = false;
    var centerPanel = Ext.getCmp( "centerPanel" );
    var nodeAttrib = node.raw;
    var url = nodeAttrib.url; //config tab url
    var murl = nodeAttrib.murl; //monitor tab url
    var pageName = nodeAttrib.text;
    var access = nodeAttrib.access;

    //if we are in Overview page hide the monitor+configuration tabs panel
    if (pageName == "Overview") {
        centerPanel.hideTabPanel();
    }
    else {
        centerPanel.showTabPanel();
    }

    //set monitor+configuration tabs enable/disable status
    if (url && murl) {
        centerPanel.disableConfigTab(false);
        centerPanel.disableMonitorTab(false);
    } else if (url) {
        centerPanel.disableConfigTab(false);
        centerPanel.disableMonitorTab(true);
    } else if (murl) {
        centerPanel.disableConfigTab(true);
        centerPanel.disableMonitorTab(false);
    }

    // set the access mode
    CP.global.pageAccessMode = access;

    // setup the breadcrumb text
    if (url || murl) {
        this.updateBreadCrumbs( node, tree );
    }

    CP.global.configTab = false;
    CP.global.monitorTab = false;
    var children = [];
    if ( !node.isLeaf() && node.hasChildNodes()) {
        var cnLen = node.childNodes.length;
        var childAttrib;
        for (var i = 0; i < cnLen; i++){
            childAttrib = node.childNodes[i].raw;
            children[i] = {};
            children[i].name = childAttrib.text;
            children[i].desc = childAttrib.description;
        }
    }

	// clean up tab content
    var configPanel = Ext.getCmp( 'config-tab' );
	if(configPanel) {
		configPanel.removeAll(true);
	}
    var monitorPanel = Ext.getCmp( 'monitor-tab' );	
	if(monitorPanel) {
		monitorPanel.removeAll(true);
	}	
	
    // config url
    if(url) {
        CP.global.configTab = true;
        url =  "/js/" + url.replace(/^.*\//gi, "") + '.js';
        this.loadPage(url, pageName, access, children);
    }

    // monitor url
    if(murl) {
        CP.global.monitorTab = true;
        murl =  "/js/" + murl.replace(/^.*\//gi, "") + '.js';
        this.loadPage(murl, pageName, access, children);
    }
}

//change the breadcrumb text in top bar
,updateBreadCrumbs: function( node, tree ){
    //clear previous breadcrumbs path
    var toolbar = Ext.getCmp( 'centerPanel-bctoolbar' );
    toolbar.removeAll();

    //loop through tree
    var buttonsArr = [];
    var selectedNodeId = node.id; //save indicator reference to the node we started from (=last item in toolbar)
    while( node ){ //start from this node and go up the tree until root
        //add next item:
        var nodeData = node.raw;
        if( !nodeData ){
            //reached to the root
            break;
        }
        if( node.id == selectedNodeId ){ //last item: add bolded text, cannot be clicked
            buttonsArr.unshift( nodeData.text );
        }
        else{ //can be clicked
            //add button into toolbar + seperator arrow
            buttonsArr.unshift({
                xtype: 'button',
                text: nodeData.text,
                treeUrl: nodeData.url,
                handler: function( btn ){ CP.util.gotoPage( btn.treeUrl ); }
            },{
                xtype: 'tbseparator',
                cls: 'webui4-tbseparator'
            });
        }
        node = node.parentNode; //go up 1 level
    }

    //refresh toolbar to show the new buttons with the path from tree
    toolbar.add( buttonsArr );
    toolbar.doLayout();
}

,bmTreeClick:function(n,e) {
    this.treeClick(n,e, "bmtree");
}

,loadPage:function(u, t, accessMode, children) {
    CP.UI.accessMode = accessMode;
    Ext.Ajax.request({
        url: u
        ,method: "GET"
        ,params: children
        ,success: this.setupJSPage
        ,failure: function(){
            var statusBar = Ext.getCmp('status-msg');
            if( statusBar ){
                statusBar.removeCls('webui-statusbar-msg-txt-ok');
                statusBar.addCls('webui-statusbar-msg-txt-err');
                statusBar.setStatusType( 'error' );
            }
        }
    });
}

    ,setupJSPage: function( resp, options ){
		try {
			var tmpStuff = Ext.decode( resp.responseText );
			if( Ext.isFunction( tmpStuff.init )){
				if( options.params && options.params.length ){
					tmpStuff.init( options.params );
				}
				else{
					tmpStuff.init.call( tmpStuff );
				}
			}
			else {
				CP.util.setCustomStatMsg( 'setupJSPage: init is NOT a function', 'false' );
				return;
			}
		} catch(err) {
			//debugger
			CP.WebUI4.Msg.show({
				title: 'Connection Error',
				icon: 'webui-msg-error',
				msg: 'Your session is invalid or you have logged out. Click OK to reconnect.',
				buttons: Ext.Msg.OK,
				fn: function( btn, text ) {
					CP.util.redirectToLogin();
				}
			});
		}
    },

    onAfterRender: function( store ){
		if(CP.UI.isCloudMode()){
			var tree = Ext.getCmp( 'cptree' );
			var rootTree = tree.getRootNode();
			//flag in order to go to major tab in the page
			CP.global.redirect_to_majors=1;
			var treeNode = rootTree.findChild( 'url', 'tree/installer', true );
			if(treeNode) {		
				tree.fireEvent( 'itemclick', tree.getView(), treeNode ); //change page to the selected one
			}
		}
		else {
        //load first page in tree (currently=overview)
        CP.WebUI4.Navtree.handleDirtyPage( store.getNodeById(1) );
        CP.WebUI4.Navtree.transferPage( store.getNodeById(1) );
		}
        //bookmark tree (currently disabled)
//        var bookmarkTree = Ext.getCmp('bmtree');
//        if( bookmarkTree.isDisabled() == false ){
//            bookmarkTree.getRootNode().expand( true, true );
//            bookmarkTree.addListener( 'click', tree.bmTreeClick, this );
//        }

        //get display mode and set button accordingly
        Ext.Ajax.request({
            url: '/cgi-bin/display.tcl',
            method: 'get',
            success: function( jsonResult ) {
                var json = Ext.decode( jsonResult.responseText );
                var viewMode = json.data.displaymode;
                var label = ( viewMode == 'basic' ) ? 'Basic' : 'Advanced';
                var basicItem = Ext.getCmp( 'webui_tree_basic_item' );
                var advancedItem = Ext.getCmp( 'webui_tree_advanced_item' );
                var btn = Ext.getCmp( 'webui_tree_viewmode_btn' );

                if( viewMode == 'basic' ){
                    basicItem.checked = true;
                    advancedItem.checked = false;
                }
                else{
                    basicItem.checked = false;
                    advancedItem.checked = true;
                }
                btn.setText( label );
            }
        });

		Ext.getCmp('cptree').collapseAll();
		Ext.getCmp('cptree').expandAll();

		//Hide loading mask
		Ext.get('loading').remove();
   		Ext.get('loading-mask').fadeOut({remove:true});
    },

    changeViewMode: function( item, isChecked ){
        if( isChecked == true ){
        	//release the lock if it has been acquired
        	if (CP.global.token != -1)
        		CP.util.configLock_req("releaseLock", true);

            //set params
            var params = {};
            params[ 'save' ] = 1;
            params[ 'apply' ] = 1;
            params[ item.group ] = item.inputValue;

            //send request
            Ext.Ajax.request({
                url: '/cgi-bin/display.tcl',
                method: 'post',
                params: params,
                success: function( jsonResult ) {
                    //reload mainframe for all other browsers
                    document.location.reload();
                }
            });
        }
    }
};
 
