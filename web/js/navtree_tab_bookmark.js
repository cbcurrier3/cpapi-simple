/*
 * Ext 4.0.2 has a bug in which TreePanel that was created inside view port using Ext.create
 * will not render the scrollbars when needed (overflow=hidden).
 * in the Sencha forum they said it will be fixed for future versions
 * */
//CP.WebUI4.Navtree = Ext.create( 'CP.WebUI4.TabPanel',{
CP.WebUI4.Navtree = {
    xtype: 'cp4_tabpanel',
    region: 'west',
    cls: 'main-navtree',
    collapsible: true,
    split: true,
    width: 200,
    minWidth: 192,
    maxWidth: 400,
    activeTab: 0,
    listeners: {
    
        //Handle tree selection for 'dirty' pages. 
        //In case user changed something in page and then tries to move to another page 
        //without saving, display a confirmation message.
        //In case user did made changes and pressed 'cancel' from confirmation message (meaning he wants to stay in current page)
        //we must prevent the highligt of the new node in tree that he clicked on - this is managed from here,
        //and cancel the loading of the new page - this is managed from handleDirtyPage in navtree.js
        //returns false to cancel and true to procceed.
    
    /*
        beforeitemclick: function( treePanel, record, htmlEl, index, event, options ){
            var pageObj = CP.UI.pageObj;
            var treePanel = Ext.getCmp('cptree');
            if( pageObj && pageObj.obj ){ //get previous page if exsits (when entering application on first time there is no previous page)
                //check to see if there were any changes made
                var ext4Obj = pageObj.obj.Ext4Panel;
                if( ext4Obj && ext4Obj.id ){
                    var forms4 = [];
                    var ext4Panel = Ext.getCmp( pageObj.obj.Ext4Panel.id );
                    if( ext4Panel.getXType() == 'cp4_formpanel' || ext4Panel.getXType() == 'cp4_dataformpanel' ){
                        forms4[0] = ext4Panel;
                    }
                    else{
                        forms4 = Ext.ComponentQuery.query( 'cp4_formpanel, cp4_dataformpanel', ext4Panel );
                    }
                    for( var i=0 , form ; form=forms4[i] ; i++ ){
                        if( !form.getForm ){
                            continue;
                        }
                        var basicForm = form.getForm();
                        if( !basicForm ){
                            continue;
                        }
                        if( basicForm.isDirty() ){ //there was changes
                            var nodeText = node.attributes.text;
                                CP.WebUI4.Msg.show({ //display message
                                title: 'Discard Changes'
                                ,msg: 'If you navigate away from this page, your changes will be lost.<br> Click OK to discard the changes, or Cancel to stay on this page.'
                                ,icon: 'webui-msg-warning'
                                ,buttons: Ext.Msg.OKCANCEL
                                ,fn: function( button, text, opt ){
                                    if( button == "ok" ){ //user pressed ok button and chose to proceed without saving changes
                                        basicForm.reset(); //clear isDirty flag
                                        treePanel.ownerCt.treeClick( node, e );
                                        treePanel.getSelectionModel().select( node );
                                    }
                                }
                            });
                            return false; //cancel highlight will do it later from msg depending on user selection
                        }
                    }
                }
            }
            return true;
        } //eof beforeitemclick
        */
    }, //eof listeners
    
    items: [{
        //'All' - main tree
        xtype: 'cp4_treepanel',
        id: 'cptree',
       // title: 'All',
        autoScroll: true,
        lines: false,
        rootVisible: false,
        selectionUrl: "",
        store: Ext.create( 'CP.WebUI4.TreeStore',{
            fields: ['access','cls','description','iconCls','id','qtip','text','url'],
            proxy: {
                type: 'ajax',
                url: '/cgi-bin/treenodes.tcl',
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
                // for now, we don't want the summary pages to be clicked
                if (record.data.url.search( /[.]*_summary/i ) != -1) {
                    return;
                }
				var treePanel = Ext.getCmp('cptree');
                //if click on current node - prevent page reload
				if (treePanel.selectionUrl == record.data.url) {
					return;
				}
                CP.WebUI4.Navtree.transferPage( record, event );
                treePanel.selectionUrl = record.data.url;
            }
         },
         tbar: {
             cls: 'webui_tree_viewmode',
             items: [{ 
                 xtype: 'cp4_label',
                 text: 'View mode:',
                 padding: '0 0 0 11'
             },{  
                 text: 'Basic',
                 id: 'webui_tree_viewmode_btn',
                 cls: 'vm-button',
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
     },{
         //bookmark tree
         xtype: 'cp4_treepanel',
         id: 'bmtree',
         title: 'Bookmarks',
         hidden: true,			// will be used in future.
         autoScroll: true,
         lines: false,
         rootVisible: false,
         disabled: true,
         store: Ext.create( 'CP.WebUI4.TreeStore',{
             proxy: {
                 type: 'ajax',
                 url: '/cgi-bin/treenodes.tcl?option=bookmark',
                 reader: {
                     type: 'json'
                 }
             },
             root: {
                 expanded: true
             }
         })
     }]
      
    
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
										CP.WebUI4.Msg.show(
										{ //display message
											title: 'Discard Changes'
											,msg: 'If you navigate away from this page, your changes will be lost.<br> Click OK to discard the changes, or Cancel to stay on this page.'
											,icon: 'webui-msg-warning'
											,scope: this
											,buttons: Ext.Msg.OKCANCEL
											,fn: function( button, text, opt )
											{
												if( button == "ok" ){ //user pressed ok button and chose to proceed without saving changes
													for( var i=0 , resetform ; resetform=forms4[i] ; i++ ){
														if (resetform.getForm.reset)
															resetform.getForm.reset(); //clear isDirty flag
													}
													this.enableTree();
													this.treeClick( node );
													treePanel.getSelectionModel().select( node, false, true);
													treePanel.selectionUrl = node.data.url;
												}
												else {
													this.enableTree();
												}
											}
										});	
										
								return false;
							}
						}	
        }
        return true;
    }
    
    ,transferPage: function( node, e ){
		this.enableTree();
		this.treeClick( node, e );
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
    },
    
    
    onAfterRender: function( store ){
        //load first page in tree (currently=overview)
        CP.WebUI4.Navtree.handleDirtyPage( store.getNodeById(1) );
        CP.WebUI4.Navtree.transferPage( store.getNodeById(1) );
        
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
 
