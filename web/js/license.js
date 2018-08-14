CP.License = {
    activated: false,
    activatable: true,
    license_exist: false,
    blades_retrieve: true,
    license_type: 0,
    installation_type: "",
    is_mgmt_module: 0,
    tabsPanelHeight: 350,
    tabsPanelWidth: 650,


    init: function() {
        // 1. create the page object
        var page = {
            title: 'License Status',
            submit: false,
            discard: false,

            // 2. configure the properties for the Ext4 panel and add it
            // into the page object
            panel: Ext.create('CP.WebUI4.DataFormPanel', {
                id: 'license-panel', // id is mandatory
                height: 1000,
                items: CP.License.getPageItems(),
                listeners: {
                    render: function(panel) {
                        CP.License.doLoad();
                    }
                }
            }),
            lock_event: CP.License.lock_event,
        };

        // 3. display the page
        CP.UI.updateDataPanel(page);
    },
    
    lock_event: function(locked) {
        if (!locked && CP.License.activatable && CP.UI.accessMode !== 'ro') {
            Ext.getCmp('activate-now').enable();
        }
        else {
            Ext.getCmp('activate-now').disable(true);
        }
    },

    bladeLoaderTask: new Ext.util.DelayedTask(function() {
        CP.util.license.loadBlades('show_blades');
        var store = Ext.getStore("show_blades");
    }),

    startBladeLoaderTimer: function() {
        CP.License.bladeLoaderTask.delay(10);
        /* this delay is needed until the db of blades will be updated after activation/ delete license operations 
		However this is too long. for now remove */
        //CP.License.bladeLoaderTask.delay(15000);
    },

    getPageItems: function() {
        /********************* Entitlements ************************/
        var entitlementTitle = {
            xtype: 'cp4_sectiontitle',
            titleText: 'License Status'
        };

        var entitlementsButtonsBar = Ext.create('CP.WebUI4.BtnsBar', {
            items: [{
                id: "activate-now",
                text: "Activate Now",
                disabled: true,
                handler: CP.License.activateOnline
			},
			{
                id: "activate-legacy",
                text: "Offline Activation",
                handler: CP.License.activateLegacy
            }]
        });


        var blades_grid_panel = CP.util.license.createBladesGrid('blades_grid', 'show_blades', CP.License.tabsPanelWidth, CP.License.tabsPanelHeight);


        /********************* License Status ************************/
        var userCenterTitle = {
            xtype: 'cp4_sectiontitle',
            id: 'userCenterTitle',
            titleText: 'User Center Registration Information'
        };

        var userCenterMac = {
            xtype: 'cp4_displayfield',
            id: 'regMAC',
            hidden: true,
            fieldLabel: 'Registration MAC Address',
            labelWidth: 150,
            width: 600
        };

        var userCenterMac_OpenServer = {
            xtype: 'cp4_displayfield',
            id: 'regCK',
            hidden: true,
            fieldLabel: 'CK',
            value: 'N/A',
            labelWidth: 150,
            width: 600
        };

        var userCenterInterface = {
            xtype: 'cp4_displayfield',
            id: 'extIF',
            hidden: true,
            fieldLabel: 'External Interface',
            labelWidth: 150,
            width: 600
        };

        var userCenterActivation = {
            xtype: 'cp4_displayfield',
            id: 'antivation_ID',
            fieldLabel: 'Activation status',
            labelWidth: 150,
            width: 800
        };

        return [
            /* License status */
            userCenterTitle,
            userCenterMac,
            userCenterMac_OpenServer,
            userCenterInterface,
            userCenterActivation,

            /* Entitlement */
            entitlementTitle,
				entitlementsButtonsBar,
				blades_grid_panel,

				{
                xtype: 'cp4_panel',
                id: 'inlinemsg_activation',
                style: " padding-top:15px",
                hidden: true,
                autoScroll: true
				},
				{
                xtype: 'cp4_formpanel',
                id: 'license_container',
                height: 35,
                autoScroll: true,
                scrollOffset: 0,
                hidden: true
            }


        ];
    },

    activateOnline: function() {
        Ext.getCmp('inlinemsg_activation').setVisible(false);
        Ext.getCmp('license_container').setVisible(false);
        CP.License.fetch_and_put_lic();
    },

    activateLegacy: function() {
        CP.License.Legacy.showDialog();
    },

    setActivationStatus: function(actID) {
        var ans = "";
        switch (actID) {
			case 0: { ans = "Not activated" ; } break;
			case 1: { ans = "Evaluation" } break;
			case 2: { ans = "Activated" ; } break;	
			default: { ans = "N/A"  } break;				
        }

        if (ans == "Activated") {
            CP.License.activatable = false;
        }

        Ext.getCmp('antivation_ID').setValue(ans);
    },

    doLoad: function(formPanel) {
        Ext.Ajax.request({
            url: '/cgi-bin/license.tcl',
            method: 'GET',
            success: function(jsonResult) {
                var jsonData = Ext.decode(jsonResult.responseText);
                var is_mgmt_module = 0;
                var is_gw_module = 0;
                if (jsonData.data.is_mgmt == "true") {
                    is_mgmt_module = 1;
                    CP.License.installation_type = "MGMT";
                }
                if (jsonData.data.is_gw == "true") {
                    is_gw_module = 1;
                    CP.License.installation_type = "GW";
                }
                if (is_mgmt_module && is_gw_module) {
                    CP.License.installation_type = "SA";
                }
                CP.License.is_mgmt_module = is_mgmt_module;
                CP.License.license_type = is_mgmt_module & is_gw_module;
				
                if (jsonData.data.status == "License OK.") {
                    CP.License.license_exist = true;
                }

                CP.util.license.set_machine_epoch(jsonData.data.epoch_now);

                Ext.getCmp('regMAC').setValue(jsonData.data.mac.toUpperCase());
                Ext.getCmp('extIF').setValue(jsonData.data.external);

                CP.License.setActivationStatus(jsonData.data.act_status);

                if (jsonData.data.ck) {
                    var ck = jsonData.data.ck.toUpperCase();
                    if (ck == '') {
                        Ext.getCmp('regCK').setValue("N/A");
                    }
					else {
						Ext.getCmp('regCK').setValue(jsonData.data.ck);
					}
                }
                if (CP.global.applianceType == "VMware" || CP.global.applianceType == "Open Server" || CP.global.applianceType.indexOf("UNIVERGE UnifiedWall") > -1) {
                    //this is open server or Vmware - don't allow 'license-now' activation from FTW
                    Ext.getCmp('regCK').setVisible(true);
                    CP.License.activatable = false;

                } 
                else {
                    Ext.getCmp('regMAC').setVisible(true);
                    Ext.getCmp('extIF').setVisible(true);

                }
                Ext.getCmp('userCenterTitle').setVisible(true);

                if (CP.UI.ftwCompleted === false) {
                    CP.License.activatable = false;
                }
                
                CP.License.lock_event(CP.global.token === -1);

                // do load blades (have to be after the license.tcl successeded 
                CP.License.startBladeLoaderTimer();
            }
        });

        //clear isDirty flag
        CP.util.clearFormDirtyFlag('license-panel');
    },

    /********** License activation ************/
    afterSubmit: function(jsonResult) {
        var jsonData = Ext.decode(jsonResult.responseText);
        if (!jsonData || !jsonData.success || !jsonData.messages) {
            return;
        }

        var success = jsonData.success;
        var messages = jsonData.messages.replace(/^\s+|\s+$/g, ''); // trim the white spaces before and after

        Ext.getBody().unmask();
        Ext.getCmp('inlinemsg_activation').setVisible(true);

		// error
        if (success !== 'true') {
            Ext.getCmp('inlinemsg_activation').update('<p style="color:red;">' + messages + '</p>');
        }

		CP.License.doLoad();
    },

    fetch_and_put_lic: function() {
        var params = {};
        params["installation_type"] = CP.License.installation_type;
        params["context"] = "WEBUI";
        Ext.getBody().mask("Contacting Check Point UserCenter, please wait...");

        Ext.Ajax.request({
            url: "/cgi-bin/license_activation.tcl",
            method: "POST",
            params: params,
            success: CP.License.afterSubmit,
            timeout: 720000 //12 minutes waiting for the activation tool

        });
    },

    /******** Legacy license management ********/
    Legacy: {
        showDialog: function() {
			var licenseStaticStore = Ext.create('CP.WebUI4.Store',
						{
                fields: ['ip', 'exp', 'sku', 'sign'],
							data: {data:{}},
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        root: 'data.signs',
                        successProperty: 'success'
                    }
                }
            });

            var licenseStatus = {
                xtype: 'cp4_displayfield',
                id: 'status',
                fieldLabel: 'License Status',
                labelWidth: 80,
                width: 600
            };

            var Spacer20 = {
                xtype: 'cp4_container',
                height: 20
            };

            var LicenseURL = {
                id: 'licenseUrl',
                xtype: 'cp4_inlinemsg',
                text: 'Obtain a license from <a href= target="_blank">Check Point User Center</a>.'
            };
            var buttonsBar = Ext.create('CP.WebUI4.BtnsBar', {
                items: [{
                    id: "new-license",
                    text: "New",
                    handler: CP.License.Legacy.addLicense
                }, {
                    id: "del-license",
                    text: "Delete",
                    disabled: true,
                    handler: CP.License.Legacy.remLicense
                }]
            });

            // Column Model
			var cm = [
				{header: 'IP Address', dataIndex: 'ip', id:'ip'}
				,{header: 'Expiration Date',  dataIndex: 'exp', id:'exp'
					,renderer: function(value){
                    var dd, mm, yy;
                    var index_mm = 1;

                    if (value.toLowerCase() == "never") return value;

                    if (value.charAt(1) >= '0' && value.charAt(1) <= '9') index_mm = 2;
                    dd = value.substr(0, index_mm);
                    mm = value.substr(index_mm, 3);
                    yy = value.substr(index_mm + 3, 4);

                    switch (mm) {
                        //JAN/FEB MAR/APR MAY/JUN JUL/AUG SEP/OCT NOV/DEC
							case 'Jan': mm = 1; break;
							case 'Feb': mm = 2; break;
							case 'Mar': mm = 3; break;                        
							case 'Apr': mm = 4; break;                    
							case 'May': mm = 5; break;           
							case 'Jun': mm = 6; break;                        
							case 'Jul': mm = 7; break;
							case 'Aug': mm = 8; break;
							case 'Sep': mm = 9; break;                        
							case 'Oct': mm = 10;break;
							case 'Nov': mm = 11;break;
							case 'Dec': mm = 12;break; 
                    }

                    return CP.util.dateToStr(dd, mm, yy);
                }

				 }
				,{header: 'SKU / Features',  dataIndex: 'sku', id:'sku', flex: 1}
				,{header: 'Signature',  dataIndex: 'sign', id:'sign', hidden:true}
			];

            var gridP = Ext.create('CP.WebUI4.GridPanel', {
				id: "license-table"
				,autoHeight :   true
				,height: 150
				,width: 600
				,store: licenseStaticStore
				,columns: cm
				,columnLines: true
				,listeners: {
                    selectionchange: function(gridView, selections) {
                        if (selections.length == 0) {
                            Ext.getCmp('del-license').disable();
                        } else {
                            Ext.getCmp('del-license').enable();
                        }
                    }
                }
            });

            var form = Ext.create('CP.WebUI4.FormPanel', {
                id: 'license-legacy-form',
                bodyPadding: 10,
                submitURL: '/cgi-bin/license.tcl',
                params: {},
                items: [licenseStatus, Spacer20, buttonsBar, gridP, LicenseURL],
                buttons: [{
                    xtype: 'cp4_button',
                    text: 'OK',
                    handler: function() {
                        // refresh the main window panel
                        CP.License.startBladeLoaderTimer();
                        modalWin.close();
                    }
                }],
                listeners: {
                    render: function(panel) {
                        Ext.Ajax.request({
                            url: '/cgi-bin/license.tcl',
                            method: 'GET',
                            success: function(jsonResult) {
                                var staticStore = Ext.decode(jsonResult.responseText);

                                Ext.getCmp('status').setValue(staticStore.data.status);
                                Ext.getCmp('licenseUrl').setTextAndType('Obtain a license from <a href=' + staticStore.data.url + ' target="_blank">Check Point User Center</a>.','info');

                                //refresh grid data				
                                var grid = Ext.getCmp('license-table');
                                var store = grid.getStore();
                                var reader = store.getProxy().getReader();
                                var data = reader.read(staticStore);
                                store.loadData(data.records);
                                grid.doComponentLayout();
                            }
                        });
                    }
                }
            });

            var modalWin = Ext.create('CP.WebUI4.ModalWin', {
                title: 'Offline Activation',
                id: 'modal_window_legacy',
                width: 630,
                height: 370,
                items: [form]
            });
            modalWin.show();
        },


        /* The following methods concern the "Paste" feature which exists in the window opened by the 'new' button*/
        /* This enables a user to enter an entire license "CLI style" through pasting from the clipboard */
        wm_license: function() {
            /*class Attributes */
            this.id = "";
            this.host = "";
            this.expiration = "";
            this.features = "";
            this.signature = "";
            this.overwrite_current_lic = 0;
            this.is_eval = true;
            this.date = null;
        },

        showPasteMsg: function(inMsg, clipboardText) {
            CP.WebUI4.Msg.show({
                title: 'Pasting License',
                msg: inMsg + '<BR>' + ((clipboardText) ? clipboardText : "Try copying your license again."),
                buttons: Ext.Msg.OK,
                icon: Ext.Msg.QUESTION
            });
        },

        setAllValues: function(ipVal, expVal, skuVal, signVal) {
            Ext.getCmp("ip_addr").setValue(ipVal);
            Ext.getCmp("expr").setValue(expVal);
            Ext.getCmp("sku").setValue(skuVal);
            Ext.getCmp("sign").setValue(signVal);
        },

        /* validates that the license being inserted "CLI style" is valid*/
        isValidLicense: function(lic) {
            if (lic.host.toLowerCase() != 'eval') {
                if (!cpVTypes_ipv4Rule.test(lic.host)) {
                    return false;
                }
            }
            var dateRegExp = /^(\d{1,2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{4})$/; //10Dec2004
            if (("never" != lic.expiration.toLowerCase()) && !dateRegExp.test(lic.expiration)) {
                return false;
            }
            return true;
        },

        /* Parses a string of "CLI style" license to a predetermined format so that it can be validated */
        parsePasteString: function(str) {
            function strim(str) {
				while(str.indexOf(" ")==0) { str = str.replace(" ",""); }
				if(str.length<=0) {return "";}
                while (str.lastIndexOf(" ") == (str.length - 1)) {
                    str = str.substring(0, (str.length - 1));
                }
                return str;
            }

            if (!str) return null;

            for (var i = 0; i < str.length; i++) {
                var c = str.charAt(i);
                if ((c == '\n') || (c == '\t') || (c == '\r')) str[i] = ' ';
            }
            str = strim(str);
            if (str == "") return ""; /* the string is an "empty string" */
            str = str.replace("'", "");
            str = str.replace("'", "");
            if (str.indexOf("fw ") < 1) str = str.replace("fw ", "");
            if (str.indexOf("cplic ") < 1) str = str.replace("cplic ", "");
            if (str.indexOf("putlic ") < 1) str = str.replace("putlic ", "");
            if (str.indexOf("put ") < 1) str = str.replace("put ", "");
            var larr = str.split(' ');
			if (larr.length<4) {return null;}
            var lic = new CP.License.Legacy.wm_license();
            lic.host = larr[0];
            lic.expiration = larr[1];
            lic.signature = larr[2];
            var ind = str.indexOf(larr[3]);
            lic.features = str.substring(ind);
            lic.features = strim(lic.features);
            return lic;
        },

        /* Loads an entire license "CLI style" through the new button */
        loadLicense: function(licStr) {
            var newLic = CP.License.Legacy.parsePasteString(licStr);
            if (!newLic) {
                CP.License.Legacy.showPasteMsg("Invalid license.", ((newLic == "") ? "Empty clipboard." : "Try copying your license again."));
                return;
            }
            if (!CP.License.Legacy.isValidLicense(newLic)) {
                CP.License.Legacy.showPasteMsg("Clipboard does not contain valid license.", licStr);
                return;
            }
            CP.License.Legacy.setAllValues(newLic.host, newLic.expiration, newLic.features, newLic.signature);
            return;
        },

        //opens a modal window to add an entry
        addLicense: function() {
            /* 'paste' is a variable which is either a button (in IE) or a text field (otherwise). */
            /* This is in order to preserve the compatibility to splat and since chrome has no "paste from clipboard" event */
            var paste = null;
            var pasteid = 'paste';
            if (Ext.isIE) {
                paste = Ext.create('CP.WebUI4.Button', {
                    id: pasteid,
                    text: 'Paste License',
                    margin: '2 0 10 3',
                    width: 100,
                    handler: function() {
                        var licStr = window.clipboardData.getData('Text');
                        if (!licStr) {
                            CP.License.Legacy.showPasteMsg("Clipboard does not contain valid license.", "Try copying your license again.");
									}
									else{
                            CP.License.Legacy.loadLicense(licStr);
                        }
                    }
                });
            } else {
                paste = Ext.create('CP.WebUI4.TextField', {
                    id: pasteid,
                    emptyText: 'Paste License here.  Example: 1.1.1.1 04Jan2012 abFGHoiYH-UEYGUYiof-I8w4J233-fGHy3P8rv CPMP-PPK-1-NGX CK-CHECK-POINT',
                    margin: '2 0 10 3',
                    width: 400,
                    listeners: {
							change: {fn:function(){
                                var licCmd = this.getValue();
										if(licCmd=="") {return;}
                                CP.License.Legacy.loadLicense(licCmd);
                                this.setValue('');
                            }
                        }
                    }
                });
            }
            var ipv4Address = Ext.create('CP.WebUI4.IPv4Field', {
                id: 'ip_addr'
            });

            var expr = Ext.create('CP.WebUI4.TextField', {
                id: 'expr',
                fieldLabel: 'Expiration Date',
                width: 450,
                allowBlank: false,
                emptyText: 'Example: 01Jan2012 or 01-Jan-2012 or never',
                regex: /(^\d{1,2}[a-zA-Z][a-zA-Z][a-zA-Z]\d{4}$)|(^\d{1,2}-[a-zA-Z][a-zA-Z][a-zA-Z]-\d{4}$)|^never$/i,
                regexText: 'Incorrect date value'
            });

            var sku = Ext.create('CP.WebUI4.TextField', {
                id: 'sku',
                fieldLabel: 'SKU / Features',
                width: 450,
                allowBlank: false
            });

            var sign = Ext.create('CP.WebUI4.TextField', {
                id: 'sign',
                fieldLabel: 'Signature Key',
                width: 450,
                allowBlank: false
            });

            var form = Ext.create('CP.WebUI4.FormPanel', {
                bodyPadding: 20,
                items: [paste, ipv4Address, expr, sku, sign],
                buttons: [{
                    xtype: 'cp4_button',
                    text: 'OK',
                    handler: function() {
                        //run validations
                        if (!form.getForm().isValid()) {
                            return;
                        }
                        CP.License.Legacy.saveHandler('ADD');
                        // Close Modal Window in case Submit succeed
                    }
                }, {
                    xtype: 'cp4_button',
                    text: 'Cancel',
                    handler: function() {
                        modalWin.close();
                    }
                }]
            });

            var modalWin = Ext.create('CP.WebUI4.ModalWin', {
                title: 'Add License',
                id: 'modal_window_addlic',
                width: 500,
                height: 262,
                items: [form]
            });
            modalWin.show();
        },

        //removes selected entries
        remLicense: function() {
            //display msg
            CP.WebUI4.Msg.show({
                title: 'Deleting License',
                msg: 'Are you sure you want to delete this license?',
                buttons: Ext.Msg.OKCANCEL,
                icon: Ext.Msg.QUESTION,
                fn: function(btn, text) {
                    if (btn == 'cancel') {
                        return;
                    }
                    CP.License.Legacy.saveHandler('DEL');
                }
            });
        },

        saveHandler: function(formType) {
            //get params object
            var params = {};
            var sprefix = '';
            switch (formType) {
                case 'ADD':
                    sprefix = ':license:add:';
                    //get selected entries
                    var valExpire = Ext.getCmp('expr').getValue().toLowerCase();
                    var valArray;

                    if (valExpire.search("9999") != -1) {
                        valExpire = "never";
                    } else if (valExpire.search("-") != -1) {
                        valArray = valExpire.split("-");
                        valExpire = "";
                        for (var i = 0; i < valArray.length; i++) {
                            valExpire = valExpire.concat(valArray[i]);
                        }
                    }

                    params[sprefix + 'host'] = Ext.getCmp('ip_addr').getValue();
                    params[sprefix + 'sku'] = Ext.getCmp('sku').getValue();
                    params[sprefix + 'expr'] = valExpire;
                    params[sprefix + 'sign'] = Ext.getCmp('sign').getValue();

                    break;

                case 'DEL':
                    sprefix = ':license:del:';
                    var selectedRow = Ext.getCmp('license-table').getSelectionModel().getLastSelected();
                    params[sprefix + 'sign'] = selectedRow.data.sign;
            }

            //submit form
            // TODO: if we are to keep the legacy license management
            // then we should modify license.tcl so that we could consolidate
            // these two requests into one.
            Ext.Ajax.request({
                url: '/cgi-bin/license.tcl',
                params: params,
                method: 'POST',
                success: function(jsonResult) {
                    Ext.Ajax.request({
                        url: '/cgi-bin/license.tcl',
                        method: 'GET',
                        success: function(jsonResult) {
                            var staticStore = Ext.decode(jsonResult.responseText);

                            Ext.getCmp('status').setValue(staticStore.data.status);
                            Ext.getCmp('licenseUrl').setTextAndType('Obtain a license from <a href=' + staticStore.data.url + ' target="_blank">Check Point User Center</a>.','info');

                            //refresh grid data				
                            var grid = Ext.getCmp('license-table');
                            var store = grid.getStore();
                            var reader = store.getProxy().getReader();
                            var data = reader.read(staticStore);
                            store.loadData(data.records);
                            grid.doComponentLayout();


                            var modalWindow = Ext.getCmp('modal_window_addlic');
                            if (modalWindow) modalWindow.close();
                        }
                    });
                }
            });
        }
    }
}
