// Copyright Check Point

// Page for managing NetFlow configuration, mostly a list of collectors
// we send NetFlow records to.

CP.NetFlow = {
    EXT4_PANEL_ID: 'netflow_ext4_panel',
    ADD_BTN_ID: 'netflow-add-btn',
    EDIT_BTN_ID: 'netflow-edit-btn',
    DEL_BTN_ID: 'netflow-delete-btn',
    GRID_ID: 'netflow-colls-table',
    FORM_TYPE_ADD: 'add',
    FORM_TYPE_EDIT: 'edit',
    FORM_TYPE_DEL: 'delete',
    TCL_REQUEST: '/cgi-bin/netflow.tcl',

    // build the page
    init: function() {
        // load data for the entire page
        Ext.Ajax.request({
            url: CP.NetFlow.TCL_REQUEST,
            method: 'GET',
            success: function(jsonResult) {
                // then when response is returned - load the rest
                CP.NetFlow.collsData = Ext.decode(jsonResult.responseText);

                // 1. create the page object
                var page = {
                    title: 'NetFlow',
                    related: [ ],
                    params: {},
                    submitURL: CP.NetFlow.TCL_REQUEST,
                    afterSubmit: CP.NetFlow.afterSubmit,

                    // 2. configure the properties for the Ext4 panel and add it
                    // into the page object
                    panel: Ext.create('CP.WebUI4.DataFormPanel', {
                        id: CP.NetFlow.EXT4_PANEL_ID, // id is mandatory
                        items: CP.NetFlow.getPageItems()
                    })
                };

                // 3. display the page
                CP.UI.updateDataPanel(page);
	            CP.NetFlow.updateAddButton(false);
	            
                // get SecureXL status
                Ext.Ajax.request({
                    url: CP.NetFlow.TCL_REQUEST
	                ,method: "GLOBAL"
		            ,success: function(response) {
                        var jsonData = Ext.decode(response.responseText);
                        var status = Ext.String.htmlDecode(jsonData.data.securexl_active);
                        Ext.getCmp("sxl_status").setValue(status);
		            }
		            ,failure: function() {
		                Ext.Msg.alert("Error","Unable to receive data from the server.");
	                }
	            });
            }
        });
    },

    // helps sort IPv4 addresses by converting to a string that can
    // be naively sorted
    ipv4sortType: function(a) {
	var s = [];
	var aa = a.split('.');
	for (var i = 0; i < aa.length; ++i) {
	    s.push(parseInt(aa[i]) + 1000);
	}
	return(s.join('.'));
    },

    // build the main structure of page items
    getPageItems: function() {
        // load grid store with collectors data
        CP.NetFlow.collsStore = Ext.create('CP.WebUI4.Store',
                {
                    fields: [
			{ name: 'ip',
			  sortType: CP.NetFlow.ipv4sortType
			},
			'port',
			'export_format',
			{ name: 'local_addr',
			  sortType: CP.NetFlow.ipv4sortType },
			{ name: 'enabled' }
		    ],
                    data: CP.NetFlow.collsData,
                    proxy: {
                        type: 'memory',
                        reader: {
                            type: 'json',
                            root: 'data.collectors',
                            successProperty: 'success'
                        }
                    }
                });

        // table title
        var collsTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'Collectors'
        };
        
        // buttons bar above table
        var buttonsBar = {
            xtype: 'cp4_btnsbar',
            items: [
                    {
                        text: 'Add',
			id: CP.NetFlow.ADD_BTN_ID,
                        handler: Ext.Function.bind(CP.NetFlow.makeCollForm, this, [CP.NetFlow.FORM_TYPE_ADD])
                    },
                    {
                        text: 'Edit',
                        id: CP.NetFlow.EDIT_BTN_ID,
                        disabled: true,
                        handler: Ext.Function.bind(CP.NetFlow.makeCollForm, this, [CP.NetFlow.FORM_TYPE_EDIT])
                    },
                    {
                        text: 'Delete',
                        id: CP.NetFlow.DEL_BTN_ID,
                        disabled: true,
                        handler: CP.NetFlow.deleteCollector
                    } ]
        };

        // grid columns
        var columns = [ {
            header: 'IP Address',
            dataIndex: 'ip',
            flex: 1
        }, {
            header: 'UDP Port',
            dataIndex: 'port',
            flex: 1
        }, {
            header: 'Export Format',
            dataIndex: 'export_format',
            flex: 1
        }, {
            header: 'Source Addr',
            dataIndex: 'local_addr',
            flex: 1
        }, {
            header: 'Enable',
            dataIndex: 'enabled',
	    renderer: function(value) {
		return(value ? "yes" : "no");
	    },
            flex: 1
        } ];

        // create main table that shows all collectors and their settings
        var collsTable = {
            xtype: 'cp4_grid',
            id: CP.NetFlow.GRID_ID,
            height: 120,
	    width: 600,
            store: CP.NetFlow.collsStore,
            columns: columns,
            listeners: {
                // open edit dialog on row double click
                itemdblclick: function(grid, rowIndex, event) {
                    CP.NetFlow.makeCollForm(CP.NetFlow.FORM_TYPE_EDIT);
                },
                selectionchange: function(gridView, selections) {
		    var eb = Ext.getCmp(CP.NetFlow.EDIT_BTN_ID);
		    var db = Ext.getCmp(CP.NetFlow.DEL_BTN_ID);
                    if (selections.length == 0) {
			eb.disable();
			db.disable();
                    } else {
			eb.enable();
			db.enable();
		    }
                }
            }
        };

	var mxc;
	if (CP.NetFlow.collsData == undefined) mxc = undefined;
	else if (CP.NetFlow.collsData.data == undefined) mxc = undefined;
	else mxc = CP.NetFlow.collsData.data.maxcollectors;
	if (mxc == undefined) mxc = '3';

	var infoMsg = Ext.create('CP.WebUI4.inlineMsg', {
	    id: 'nfcoll-msg-1',
	    type: 'info',
	    text: ('Configure one or more (up to '+mxc+') collectors in order'+
		   ' to send NetFlow records for all traffic that is handled by SecureXL.' +
		   ' Note that SecureXL must be on to send Netflow records.')
	});
	
	var secureXL = Ext.create('CP.WebUI4.DisplayField', {
	    id: 'sxl_status',
	    fieldLabel: "SecureXL Status",
	    width: 300,
	    labelWidth: 88,
	    margin: '-10 0 15 0',
	});
        
        // return all objects as one array 
        return [
            collsTitle,
            buttonsBar,
            collsTable,
            secureXL,
	        infoMsg
        ];
    },
    
    // Create a form according to the form type (FORM_TYPE_ADD or
    // FORM_TYPE_EDIT; FORM_TYPE_DEL is handled elsewhere)
    makeCollForm: function(formType) {
        // decide which data should be loaded into the form when it opens
        var record;
        if (formType == CP.NetFlow.FORM_TYPE_ADD) {
            record = {
                ip: '',
                port: '',
                export_format: CP.NetFlow.collsData.data.defaultxf,
                local_addr: '',
		enabled: 1
            };
        } else {
	    record = Ext.getCmp(CP.NetFlow.GRID_ID).getSelectionModel().getLastSelected().data;
        }
        
        // Define the fields of the collector.
        var fldIP = Ext.create('CP.WebUI4.IPv4Field', {
            id: 'nfcoll-form-fld-ip',
            fieldLabel: 'IP Address',
            allowBlank: false,
	    octetsConfig: [
		{ minValue: 1, maxValue: 223 }, // no class D or E or wildcard
		{ minValue: 0, maxValue: 255 },
		{ minValue: 0, maxValue: 255 },
		{ minValue: 0, maxValue: 255 }
	    ]
        });
	fldIP.setValue(record.ip); // the value parameter doesn't seem to work

	var fldPort = Ext.create('CP.WebUI4.NumberField', {
	    id: 'nfcoll-form-fld-port',
	    fieldLabel: 'UDP Port Number',
	    minValue: 1,
	    maxValue: 65535,
	    allowBlank: false,
            allowDecimals: false,
	    value: record.port
	});

	var fldXF = Ext.create('CP.WebUI4.ComboBox', {
	    id: 'nfcoll-form-fld-export_format',
	    fieldLabel: 'Export Format',
	    emptyText: 'Select...',
	    allowBlank: false,
	    store: CP.NetFlow.collsData.data.availxfs,
	    displayField: 'export_format',
	    editable: false,
	    autoSelect: false,
	    value: (record.export_format == '' ?
		    CP.NetFlow.collsData.data.defaultxf :
		    record.export_format)
	});

	// "Source IP Address" is special: The user has to enter one of
	// the local IP addresses.  Or they can leave it all blank.  We
	// really don't need to validate the IP address as an IP address,
	// just that it fits in the list.  But for clarity we do perform
	// some basic checks.
	var srcsData = CP.NetFlow.collsData.data.availsrcs;
	var fldSrc = null; // will be redefined below
	var validateSrc = function () {
		// We validate the "Source IP Address" differently.
		// It can be empty, or it can match an entry in
		// srcsData.
		var ofilled = 0, i, ov
		for (i = 0; i < fldSrc.octets.length; ++i) {
			ov = fldSrc.octets[i].getValue();
			ov = (ov == null) ? "" : String(ov);
			if (ov.length > 0) ++ofilled;
		}
		if (ofilled == 0) return(true); // it's empty so it's ok
		if (ofilled < 4)
			return("Missing fields."); // it's not even complete
		var lcladdr = String(fldSrc.getValueFromOctets());
		for (var i = 0; i < srcsData.length; ++i) {
			if (lcladdr == String(srcsData[i]))
				return(true); // it's one of the ok ones
		}
		return("IP address '" + lcladdr + "' is not local");
	};
	fldSrc = Ext.create('CP.WebUI4.IPv4Field', {
	    id: 'nfcoll-form-fld-local_addr',
	    fieldLabel: 'Source IP Address',
	    fieldConfig: { allowBlank: true },
	    displayField: 'local_addr',
	    octetsConfig: [
		{ minValue: 0, maxValue: 255 },
		{ minValue: 0, maxValue: 255 },
		{ minValue: 0, maxValue: 255 },
		{ minValue: 0, maxValue: 255, validator: validateSrc }
	    ]
	});
	fldSrc.setValue(record.local_addr);

	// Let the user know that fldSrc is optional (in fact, it's usually
	// better to leave it blank).
	var fldSrcEtc = Ext.create('CP.WebUI4.Panel', {
		width: 300,
		layout: 'column',
		items: [
			fldSrc,
			Ext.create('CP.WebUI4.Label', {
				text: '(optional)',
				margin: '5 20 20 -15',
				flex: 1
			})
		]
	});
	var fldSrcInf = Ext.create('CP.WebUI4.inlineMsg', {
		type: 'info',
		text: 'The "Source IP Address" field is optional.  Leave it'
                      +' blank to have the system determine it at run time'
		      +' based on your network topology.'
	});

	var fldEna = Ext.create('CP.WebUI4.Checkbox', {
	    id: 'nfcoll-form-fld-enabled',
	    fieldLabel: 'Enable',
	    margin: '-5 0 0 0',
	    checked: record.enabled,
	    submitValue: false
	});

        // Set up the different types of form available (add or edit;
	// delete is handled elsewhere)
       
        var modalTitle = '';
        
        switch (formType) {
        case CP.NetFlow.FORM_TYPE_ADD:
            modalTitle = "Add Collector";
            break;
        case CP.NetFlow.FORM_TYPE_EDIT:
            modalTitle = ('Edit Collector (IP '+record.ip+
			  ' port '+record.port+')');
            break;
        }
        
        // panel that encloses all fields
	var modalWin;
        var form = Ext.create('CP.WebUI4.FormPanel', {
            layout: 'hbox',
            items: [{
		xtype: 'cp4_panel',
		padding: 20,
		flex: 1,
		items: [fldIP, fldPort, fldXF, fldSrcEtc, fldEna, fldSrcInf]
	    }],
            buttons: [{
                xtype: 'cp4_button',
                text: 'OK',
                handler: function() {
                    // run validations
                    if (!form.getForm().isValid()) {
                        return;
                    }
                    CP.NetFlow.saveHandler(formType, { oldip: record.ip,
						       oldport: record.port });
                }
            }, {
                xtype: 'cp4_button',
                text: 'Cancel',
                handler: function() {
                    modalWin.close();
                }
            }]
        });
        
        // make window and open it
        modalWin = Ext.create('CP.WebUI4.ModalWin', {
            title: modalTitle,
            id: 'coll_modal_win',
            width: 550,
            items: [ form ]
        });
        
        modalWin.show();
    },
    
    // delete the selected collector if user approves
    deleteCollector: function() {
	var row = Ext.getCmp(CP.NetFlow.GRID_ID).getSelectionModel().getLastSelected();
	var oldip = row.data.ip, oldport = row.data.port;;
        
        // display msg
        CP.WebUI4.Msg.show({
            title: 'Delete Collector (IP ' + row.data.ip + ' port ' +
		row.data.port + ')',
            msg: 'Are you sure you want to delete the selected collector?',
            buttons: Ext.Msg.OKCANCEL,
            icon: Ext.Msg.QUESTION,
            fn: function(btn, text) {
                if (btn == 'cancel') {
                    return;
                }
                CP.NetFlow.saveHandler(CP.NetFlow.FORM_TYPE_DEL,
				       { oldip: oldip,
					 oldport: oldport });
             }
         });
    },
    
    saveHandler: function(formType, formNotes) {
        // get params to be posted to server
        CP.NetFlow.setChangedParams(formType, formNotes);
        
        // submit form
        CP.UI.submitData(CP.UI.getMyObj());
    },
    
    setChangedParams: function(formType, formNotes) {
        // get params object
        var pageObj = CP.UI.getMyObj();
        pageObj.params = {}; // clear out old form params
        var params = pageObj.params;

	// extract fields from form
	var ipFld, portFld, xfFld, srcFld, enaFld;
	if (formType != CP.NetFlow.FORM_TYPE_DEL) {
	    ipFld = Ext.getCmp('nfcoll-form-fld-ip').getValue();
	    portFld = Ext.getCmp('nfcoll-form-fld-port').getValue();
	    xfFld = Ext.getCmp('nfcoll-form-fld-export_format').getValue();
	    srcFld = Ext.getCmp('nfcoll-form-fld-local_addr').getValue();
	    enaFld = Ext.getCmp('nfcoll-form-fld-enabled').getValue();
	}
        
	// figure out the 'prefix', which is based on the IP address and
	// port number: but sometimes the new ones, sometimes the old
	var kip, kport;
	if (formType == CP.NetFlow.FORM_TYPE_ADD) {
	    kip = ipFld; kport = portFld;
	} else {
	    kip = formNotes.oldip; kport = formNotes.oldport;
	}
	var pfx = 'collectors:' + kip + ':' + kport;

	// type of operation
	if (formType == CP.NetFlow.FORM_TYPE_ADD) {
	    params[pfx] = 'add';
	} else if (formType == CP.NetFlow.FORM_TYPE_DEL) {
	    params[pfx] = 'delete';
	} else {
	    params[pfx] = 'edit';
	}

	// IP and port number (if they might have been changed)
	if (formType == CP.NetFlow.FORM_TYPE_EDIT) {
	    params[pfx+':ip'] = ipFld;
	    params[pfx+':port'] = portFld;
	}

	// Other fields
	params[pfx+':export_format'] = xfFld;
	params[pfx+':local_addr'] = srcFld;
	params[pfx+':disable'] = enaFld ? '' : 't'; // intentionally backwards
	params['lock:token'] = CP.global.token;
    },
    
    // refresh page and reload data after submit
    afterSubmit: function(form, action) {
        Ext.Ajax.request({
            url: CP.NetFlow.TCL_REQUEST,
            method: 'GET',
            success: function(jsonResult) {
                CP.NetFlow.collsData = Ext.decode(jsonResult.responseText);    
                // refresh grid data
                var grid = Ext.getCmp(CP.NetFlow.GRID_ID);
                var store = grid.getStore();
                var reader = store.getProxy().getReader();
                var data = reader.read(CP.NetFlow.collsData);
                store.loadData(data.records);
                grid.doComponentLayout();
                
                // disable/enable buttons
                Ext.getCmp(CP.NetFlow.EDIT_BTN_ID).disable();
                Ext.getCmp(CP.NetFlow.DEL_BTN_ID).disable();
		CP.NetFlow.updateAddButton(true);
            }
        });
        
        // close modal if open
        var modalWin = Ext.getCmp('coll_modal_win');
        if (modalWin)
        	modalWin.close();
    },

    updateAddButton: function(everenable) {
	// Want the add button enabled if there is room for one more
	// collector, not otherwise.
	var data = CP.NetFlow.collsData.data;
	var maxnc = parseInt(data.maxcollectors);
	var curnc = data.collectors.length;
	var addbtn = Ext.getCmp(CP.NetFlow.ADD_BTN_ID);

	if (maxnc < 1) maxnc = 1; // just for sanity

	if (curnc >= maxnc) {
	    addbtn.disable();
	} else if (everenable) {
	    addbtn.enable();
	}
    }
}
