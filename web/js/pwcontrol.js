/**
 * password-controls feature
 * - Password Strength
 * - Password History
 */
CP.pwcontrol = {

init: function() {
	
	var form = Ext.getCmp("password-control-panel");
	
	if (form) {
		form.destroy();
	}
	var pwcontrolPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
		id:"password-control-panel"
		,labelWidth: 150
		,items: [{
            // Password Strength
			xtype: "cp4_sectiontitle"
			,titleText: "Password Strength"
		},{
			xtype: 'cp4_positiveint'
			,fieldLabel: 'Minimum Password Length'
			,name: 'txtPwdLen'
			,id:'txtPwdLen'
			,maxLength: 3
			,enforceMaxLength : true
			,minValue : 6
			,maxValue : 128
			,width: 210
			,labelWidth: 145
			,allowBlank: false
			,hideTrigger: true
			,keyNavEnabled: false
			,mouseWheelEnabled: false			
			,minText: 'Enter a number between 6 and 128'
			,maxText: 'Enter a number between 6 and 128'
			,blankText:  'Enter a number between 6 and 128'
			,maxLengthText : ""
			,listeners: {
				change: CP.pwcontrol.enableApplyButton
			}
		},{
			xtype:"cp4_checkbox"
			,fieldLabel:"Disallow Palindromes"
			,name:"checkDisallowPalindromes"
			,id:"checkDisallowPalindromes"
            ,labelWidth: 145
			,listeners: {
				change: CP.pwcontrol.enableRadioApplyButton
			}
		},{
			xtype: 'cp4_inlinemsg'
			,text: 'A palindrome is a word that can be read the same way in either direction'
		},{
			xtype:"cp4_radiogroup"
			,fieldLabel:"Password Complexity"
			,columns:1
			,labelWidth: 143	
			,items:[{
				boxLabel: "1 - Don't check"
				,inputValue:"1"
				,name:"radioPwdComplexity"
				,width : 500
				,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
			},{
				boxLabel: "2 - Require two character types"
				,inputValue:"2"
				,name:"radioPwdComplexity"
				,width : 500
				,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
			},{
				boxLabel: "3 - Require three character types"
				,inputValue:"3"
				,name:"radioPwdComplexity"
				,width : 500
				,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
			},{
				boxLabel:"4 - Require four character types"
				,inputValue:"4"
				,name:"radioPwdComplexity"
				,width : 500
				,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
			}]
		},{
			xtype: 'cp4_inlinemsg'
			,text: 'Character types are: Upper case alphabetic (A-Z), Lower case alphabetic (a-z), Digits (0-9), Other (everything else)'
		}
////////////////////////// Password History ///////////////////////////////////////
		,{	xtype: "cp4_sectiontitle", titleText: "Password History" }
		,{
			xtype:"cp4_checkbox"
			,fieldLabel:"Check for Password Reuse"
			,name:"checkPwdHistory"
			,id:"checkPwdHistory"
		    ,labelWidth: 145
			,listeners: {
				change: CP.pwcontrol.enableRadioApplyButton
			}
		},
		{
			xtype: 'cp4_positiveint'
			,fieldLabel: 'History Length'
			,name: 'txtPwdHistoryLength'
			,id:'txtPwdHistoryLength'
			,width: 210
			,minValue : 1
			,maxValue : 1000
			,maxLength: 4
			,enforceMaxLength : true			
			,labelWidth: 145
			,allowBlank: false
			,hideTrigger: true
			,keyNavEnabled: false
			,mouseWheelEnabled: false			
			,minText: "Enter a number between 1 and 1000"
			,maxText:"Enter a number between 1 and 1000"
			,blankText: "Enter a number between 1 and 1000"
			,maxLengthText : ""
			,listeners: {
				change: CP.pwcontrol.enableApplyButton
			}
		}
////////////////////////// Password Expiration ///////////////////////////////////////
			,{	xtype: "cp4_sectiontitle", titleText: "Mandatory Password Change" }
			,{
			    xtype: 'cp4_panel',
			    layout: 'column',
			    items: [{
                    xtype: 'cp4_label',
                    text: 'Password Expiration:',
                    style: 'margin-right:113px'
                },{
                    xtype: 'cp4_panel',
                    items: [{
                        xtype:"cp4_radio"
                            ,name:"radioPwdExpiration"
                            ,id: "radioPwdExpNever"
                            ,boxLabel: "Passwords never expire"
                            ,inputValue:"never"
                            ,handler: function(ctl, val){
                                Ext.getCmp("txtPwdExpirationDays").setDisabled(false);
                            }
							,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
                        },{
                        xtype: 'cp4_panel'
                        ,layout: 'table'
                        ,items:[{
                            xtype:"cp4_radio"
                            ,name:"radioPwdExpiration"
                            ,id: "radioPwdExpDays"
                            ,boxLabel: "Passwords expire after"
                            ,inputValue:"days"
                            ,handler: function(){
                                Ext.getCmp("txtPwdExpirationDays").setDisabled(true);
                            }
							,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
                        },{
                            xtype: 'cp4_positiveint'
                            ,name: 'txtPwdExpirationDays'
                            ,id:'txtPwdExpirationDays'
                            ,minValue : 1
                            ,maxValue : 1827
                            ,maxLength: 4   
                            ,enforceMaxLength : true
                            ,width: 60
                            ,minwidth : 40
                            ,style: 'margin-left:15px;'
                            ,allowBlank: false
                            ,hideTrigger: true
                            ,keyNavEnabled: false
                            ,mouseWheelEnabled: false
                            ,minText: 'Enter a number between 1 and 1827'
                            ,maxText: 'Enter a number between 1 and 1827'
                            ,blankText:  'Enter a number between 1 and 1827'
                            ,maxLengthText : ""
                            ,listeners: {
                                disable: CP.pwcontrol.OnExpirationDaysDisable,
                                enable: CP.pwcontrol.OnExpirationDaysEnable
                            }
							,listeners: {
								change: CP.pwcontrol.enableApplyButton
							}
                        },{
                            xtype: 'cp4_label'
                            ,text: 'days'
                            ,style: 'margin-left:15px;'
                        }]
                    }]
                }]
                },{
                        xtype: 'cp4_panel'
                        ,layout: 'table'
                        ,items:[{
                            xtype: 'cp4_label'
                            ,text: 'Warn users before password expiration:'
                            ,style: 'margin-left:1px;'
                        },{
                            xtype: 'cp4_positiveint'
                            ,name: 'txtPwdWarningDays'
                            ,id:'txtPwdWarningDays'
                            ,minValue : 1
                            ,maxValue : 366
                            ,maxLength: 3   
                            ,enforceMaxLength : true
                            ,width: 60
                            ,minwidth : 40
                            ,style: 'margin-left:15px;'
                            ,allowBlank: false
                            ,hideTrigger: true
                            ,keyNavEnabled: false
                            ,mouseWheelEnabled: false
                            ,minText: 'Enter a number between 1 and 366'
                            ,maxText: 'Enter a number between 1 and 366'
                            ,blankText:  'Enter a number between 1 and 366'
                            ,maxLengthText : ""
				            ,listeners: {
					           change: CP.pwcontrol.enableApplyButton
			}
                        },{
                            xtype: 'cp4_label'
                            ,text: 'days'
                            ,style: 'margin-left:15px;'
                      }]
		},{
			    xtype: 'cp4_panel',
			    layout: 'column',
			    items: [{
			xtype: 'cp4_label',
			text: 'Lockout users after password expiration:',
			style: 'margin-right:13px'
			},{
                    xtype: 'cp4_panel',
                    items: [{
                        xtype:"cp4_radio"
                            ,name:"radioPwdExpirationGrace"
                            ,id: "radioPwdExpGraceNever"
                            ,boxLabel: "Never lockout users after password expires"
                            ,inputValue:"never"
                            ,handler: function(ctl, val){
                                Ext.getCmp("txtPwdExpirationGraceDays").setDisabled(false);
                            }
			    ,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
                        },{
                        xtype: 'cp4_panel'
                        ,layout: 'table'
                        ,items:[{
                            xtype:"cp4_radio"
                            ,name:"radioPwdExpirationGrace"
                            ,id: "radioPwdExpGraceDays"
                            ,boxLabel: "Lockout user after"
                            ,inputValue:"days"
                            ,handler: function(){
                                Ext.getCmp("txtPwdExpirationGraceDays").setDisabled(true);
                            }
							,listeners: {change: CP.pwcontrol.enableRadioApplyButton}
                        },{
                            xtype: 'cp4_positiveint'
                            ,name: 'txtPwdExpirationGraceDays'
                            ,id:'txtPwdExpirationGraceDays'
                            ,minValue : 1
                            ,maxValue : 1827
                            ,maxLength: 4   
                            ,enforceMaxLength : true
                            ,width: 60
                            ,minwidth : 40
                            ,style: 'margin-left:15px;'
                            ,allowBlank: false
                            ,hideTrigger: true
                            ,keyNavEnabled: false
                            ,mouseWheelEnabled: false
                            ,minText: 'Enter a number between 1 and 1827'
                            ,maxText: 'Enter a number between 1 and 1827'
                            ,blankText:  'Enter a number between 1 and 1827'
                            ,maxLengthText : ""
                            ,listeners: {
                                disable: CP.pwcontrol.OnExpirationGraceDaysDisable,
                                enable: CP.pwcontrol.OnExpirationGraceDaysEnable,
								change: CP.pwcontrol.enableApplyButton
			    			}
                        },{
                            xtype: 'cp4_label'
                            ,text: 'days'
                            ,style: 'margin-left:15px;'
                        }]
                    }]
				}]
		   },{
                xtype: 'cp4_panel',
                items: [{   
						xtype:"cp4_checkbox"
						,fieldLabel:'Force users to change password at first login after password was changed from <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/user\');return false;">Users</a> page'
						,name:"checkForcePwdChange"
						,id:"checkForcePwdChange"
					    ,labelWidth: 472
						,listeners: {
							change: CP.pwcontrol.enableRadioApplyButton
						}
               }]
		   }

////////////////////////// Deny Access to Unused Accounts ///////////////////////////////////////
			,{	xtype: "cp4_sectiontitle", titleText: "Deny Access to Unused Accounts" }
			,{
				xtype:"cp4_checkbox"
						,fieldLabel:"Deny access to unused accounts"
						,name:"checkDenyUnused"
						,id:"checkDenyUnused"
					    ,labelWidth: 180
						,listeners: {
							change: CP.pwcontrol.enableRadioApplyButton
					}
			},{
				xtype: 'cp4_positiveint'
				,fieldLabel: 'Days of non-use before lock-out'
				,name: 'txtDenyUnusedDays'
				,id:'txtDenyUnusedDays'
				,maxLength: 4
				,enforceMaxLength : true
				,minValue : 30
				,maxValue : 1827
				,width: 240
				,labelWidth: 180
				,allowBlank: false
				,hideTrigger: true
				,keyNavEnabled: false
				,mouseWheelEnabled: false			
				,minText: 'Enter a number between 30 and 1827'
				,maxText: 'Enter a number between 30 and 1827'
				,blankText:  'Enter a number between 30 and 1827'
				,maxLengthText : ""
				,listeners: {
					change: CP.pwcontrol.enableApplyButton
				}
			}
			////////////////////////// Deny Access After Failed Login Attempts ///////////////////////////////////////
			,{	xtype: "cp4_sectiontitle", titleText: "Deny Access After Failed Login Attempts" }
			,{
				xtype:"cp4_checkbox"
						,fieldLabel:"Deny access after failed login attempts"
						,name:"checkDenyFailLogin"
						,id:"checkDenyFailLogin"
					    ,labelWidth: 220
						,style: 'margin-bottom:0px;'
						,listeners: {
							change: CP.pwcontrol.enableRadioApplyButton
					}
			},{
				xtype:"cp4_checkbox"
						,fieldLabel:"Block admin user"
						,name:"checkBlockAdmin"
						,id:"checkBlockAdmin"
					    ,labelWidth: 220
						,listeners: {
							change: CP.pwcontrol.enableRadioApplyButton
					}
			},{
				xtype: 'cp4_positiveint'
				,fieldLabel: 'Maximum number of failed attempts allowed'
				,name: 'txtLoginMaxAttempts'
				,id:'txtLoginMaxAttempts'
				,maxLength: 4
				,enforceMaxLength : true
				,minValue : 2
				,maxValue : 1000
				,width: 280
				,labelWidth: 220
				,allowBlank: false
				,hideTrigger: true
				,keyNavEnabled: false
				,mouseWheelEnabled: false			
				,minText: 'Enter a number between 2 and 1000'
				,maxText: 'Enter a number between 2 and 1000'
				,blankText:  'Enter a number between 2 and 1000'
				,maxLengthText : ""
				,listeners: {
					change: CP.pwcontrol.enableApplyButton
				}
			},{
                xtype: 'cp4_panel'
                ,layout: 'table'
                ,items:[{
					xtype: 'cp4_positiveint'
					,fieldLabel: 'Allow access again after time'
					,name: 'txtLoginLockPeriod'
					,id:'txtLoginLockPeriod'
					,inputValue:"seconds"
					,maxLength: 6
					,enforceMaxLength : true
					,minValue : 60
					,maxValue : 604800
					,width: 300
					,labelWidth: 220
					,allowBlank: false
					,hideTrigger: true
					,keyNavEnabled: false
					,mouseWheelEnabled: false			
					,minText: 'Enter a number between 60 and 604800'
					,maxText: 'Enter a number between 60 and 604800'
					,blankText:  'Enter a number between 60 and 604800'
					,maxLengthText : ""
					,listeners: {
						change: CP.pwcontrol.enableApplyButton
					}
				    },{
	                 xtype: 'cp4_label'
	                ,text: 'seconds'
	                ,style: 'margin-left:15px;'
	           }]	
			},{
				xtype: "cp4_button"
				,text: "Apply"
				,name: "btnPwdApply"
				,id: "btnPwdApply"
				,disabled: true
				,handler: function(){
					CP.UI.applyHandler(page);
					this.disable();
				}
			}
		] // panel items
		,listeners: {
      		render: CP.pwcontrol.doLoad  
		}
	}); // pwcontrolPanel
	
	var checkBlockAdminCheckbox = Ext.getCmp( 'checkBlockAdmin' );
	var checkDenyFailLoginCheckbox = Ext.getCmp( 'checkDenyFailLogin' );
	if(!checkDenyFailLoginCheckbox.checked) {
		checkBlockAdminCheckbox.disable();

		
	} else {
		
		if(!checkDenyFailLoginCheckbox.disabled) {
			checkBlockAdminCheckbox.enable();
		}
	}
	
	
	var page = {
		title:"Password and Account Management Controls"
		,panel: pwcontrolPanel
		,cluster_feature_name : "password-controls"
		,submit:false
		,discard:false
		,submitURL:"/cgi-bin/pwcontrol.tcl"
		,beforeSubmit:CP.pwcontrol.beforeSubmit
		,afterSubmit:CP.pwcontrol.afterSubmit
		,params:{}
	};

	Ext.getCmp( 'btnPwdApply' ).disable();
	CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
		formPanel.load({
			url: '/cgi-bin/pwcontrol.tcl',
			method: 'GET'	
		});
	
		Ext.Ajax.request({
			url: '/cgi-bin/pwcontrol.tcl',
			method: 'GET',
			success: function (jsonResult){
			var jsonData = Ext.decode(jsonResult.responseText);

			if(jsonData.data.radioPwdExpiration == "days")
			{
				Ext.getCmp('radioPwdExpDays').setValue(true);
				if (CP.global.token != -1)
				{
					Ext.getCmp("txtPwdExpirationDays").setDisabled(false);
				}
			}
			else
			{
				Ext.getCmp('radioPwdExpNever').setValue(true);
				Ext.getCmp("txtPwdExpirationDays").setDisabled(true);
			}

			if(jsonData.data.radioPwdExpirationGrace == "days")
			{
				Ext.getCmp('radioPwdExpGraceDays').setValue(true);
				if (CP.global.token != -1)
				{
					Ext.getCmp("txtPwdExpirationGraceDays").setDisabled(false);
				}
			}
			else
			{
				Ext.getCmp('radioPwdExpGraceNever').setValue(true);
				Ext.getCmp("txtPwdExpirationGraceDays").setDisabled(true);
			}
		}
    });
	CP.pwcontrol.changedForm = 0; 
},

beforeSubmit:function(panel){
/* Make sure a value is sent if checkbox is off */
	this.params.checkForcePwdChange = "off";
	this.params.checkDenyUnused = "off";
	this.params.checkDenyFailLogin = "off";
	this.params.checkBlockAdmin = "off";
	
	
},

afterSubmit: function(form, action){
	//reload the page
	CP.pwcontrol.doLoad(Ext.getCmp("password-control-panel"));
},

expirationDaysValidator: function(value) {
	if (('' + value).match(/^\d{1,4}$/) === null) {
		return ('Enter a number between 1 and 1827');
	}
	if (value >= 1 && value <= 1827) {
		return (true);
	}
	return('Enter a number between 1 and 1827');
},

OnExpirationDaysDisable: function(form, action) {
	Ext.getCmp("txtPwdExpirationDays").clearInvalid();
},

OnExpirationDaysEnable: function(form, action) {
	Ext.getCmp("txtPwdExpirationDays").validate();
},

OnExpirationGraceDaysDisable: function(form, action) {
	Ext.getCmp("txtPwdExpirationGraceDays").clearInvalid();
},

OnExpirationGraceDaysEnable: function(form, action) {
	Ext.getCmp("txtPwdExpirationGraceDays").validate();
},

/* Two different enable functions - one for radio and checkbox buttons and one for everything else*/
enableRadioApplyButton: function( field, isChecked ){
	
	
	var checkBlockAdminCheckbox = Ext.getCmp( 'checkBlockAdmin' );
	var checkDenyFailLoginCheckbox = Ext.getCmp( 'checkDenyFailLogin' );
	if(!checkDenyFailLoginCheckbox.checked) {
		checkBlockAdminCheckbox.disable();

		
	} else {
		if(!checkDenyFailLoginCheckbox.disabled) {
			checkBlockAdminCheckbox.enable();
		}
	}
	
	
	
	var button = Ext.getCmp( 'btnPwdApply' );
	var newVal = field.getValue();
	if( newVal != field.originalValue ) {
		++CP.pwcontrol.changedForm;
		button.enable();
	} else {
        --CP.pwcontrol.changedForm;
        if (CP.pwcontrol.changedForm === 0) {
			button.disable();
		}
	}
},

enableApplyButton: function( field, isChecked ){
	var button = Ext.getCmp( 'btnPwdApply' );
	var newVal = field.getValue();
	if( (field.originalValue) && newVal != field.originalValue ) {
		++CP.pwcontrol.changedForm;
		button.enable();
	} else {
        --CP.pwcontrol.changedForm;
		if (CP.pwcontrol.changedForm === 0) {
			button.disable();
		}
	}
}

} // CP.pwcontrol
