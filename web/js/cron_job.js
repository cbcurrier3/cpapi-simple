CP.Cron = {
        
    GRID_ID: 'jobs-table',
	CRON_JOB_NAME_MAX_LEN: 32,

init:function() {
    var page = {
        title: "Job Scheduler Configuration",
        helpFile: "cronHelp.html",
		cluster_feature_name : "cron",
        panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
            id: 'cron_job_main_panel', 
            items: CP.Cron.getPageItems()
        }) 
    };

    //show the page
    CP.UI.updateDataPanel( page );
}


,applyMailHandler:function() {
    if (!Ext.getCmp("mailto").validate()) return; // checks the text field is valid
        mail = Ext.getCmp("mailto").getValue();
    if (mail == "")    mail = "none";
    Ext.Ajax.request({
        url: "/cgi-bin/cron_job.tcl"
        ,method: "POST"
        ,params: {mailto: mail}
        ,success: function(jsonResult) {
            Ext.getCmp('mail_apply').disable();
            CP.util.clearFormDirtyFlag('mailto-form');
            var jsonData = Ext.decode(jsonResult.responseText);
            CP.util.setStatusMsg( jsonData );
        }
    });
}


,getPageItems: function(){
    var store = Ext.create( 'CP.WebUI4.JsonStore',{
        proxy: {
            type: 'ajax',
            url: '/cgi-bin/cron_job.tcl',
            reader: {
                type: 'json',
                root: 'data.jobs'
            }
        },
        fields: ['name', 'recurrence']
    });

    // Column Model
    var cm = [
        {header: 'Job Name', dataIndex: 'name', id:'name'}
        ,{header: 'Recurrence',  dataIndex: 'recurrence', id:'recurrence', flex: 1
        	, renderer: formatHours}
    ];
    
    function formatHours(val) {  
    	if ( val.indexOf("startup") == -1){
	    	 if( CP.global.formatTime == '12-hour' ){
	             var arrSplit = val.split(" at ");            
				 return arrSplit[0] + " at " + CP.util.displayTime(arrSplit[1]);
	    	 }
    	}
    	return val;
    }

    
    var items = [
	{
        //Section title for table
        xtype: 'cp4_sectiontitle',
        titleText: 'Scheduled Jobs'
    },{
        //Buttons toolbar for table
        xtype: 'cp4_btnsbar',
        items: [{
            id: 'cron-add-job',
            text: 'Add',
            handler: Ext.Function.bind( CP.Cron.openModalWindowAdd, this, ['Add A New Scheduled Job'])
        },{
            id: 'cron-edit-job',
            text: 'Edit',
            disabled: true,
            handler: Ext.Function.bind( CP.Cron.openModalWindowEdit, this, ['Edit Scheduled Job'])
        },{
            id: 'cron-delete-job',
            text: 'Delete',
            disabled: true,
            handler: CP.Cron.openModalWindowDelete
        }]
    },{
        //scheduled jobs configuration table
        xtype: 'cp4_grid',
        id: CP.Cron.GRID_ID
        ,autoHeight: true
        ,maxHeight: 120
        ,store: store
        ,columns: cm
        ,listeners: {
            selectionchange: function( gridView, selections ){
                //set buttons
                var editBtn = Ext.getCmp("cron-edit-job");
                var delBtn = Ext.getCmp("cron-delete-job");
                if( selections.length == 0 ){
                    editBtn.disable();
                    delBtn.disable();
                }
                else{
                    editBtn.enable();
                    delBtn.enable();
                }
            }
            //open edit dialog on row double click
            ,itemdblclick:  {                                                              
                scope: this,                                                  
                fn: function( grid, rowIndex, event ){
                    

                }
            }
        }
    },{
        //Section title for email
        xtype: 'cp4_sectiontitle',
        titleText: 'E-mail Notification'
    },{
        //Email form
        xtype: 'cp4_formpanel',
        id: "mailto-form",
        items: [{
            xtype: 'cp4_textfield',
            fieldLabel: "Send jobs output to the following E-mail",
            vtype: 'email',
            id: "mailto",
            name: "mailto",
            emptyText: 'Example: user@company.com',
            labelAlign: 'top',
            width: 300,
            disabled: false,
            enableKeyEvents : true,
            isFormField : true,
            listeners: {
                keyup : function(field){
                    if (field.getValue() != field.originalValue){ // only valid keystrokes
                        Ext.getCmp('mail_apply').enable();
                    }
                }
            }
        },{
            xtype: 'cp4_button',
            text: "Apply"
            ,id: "mail_apply"
            ,disabled: true
            ,hideLabel: true
            ,handler: CP.Cron.applyMailHandler
        },{
            xtype: 'cp4_inlinemsg',
            text: 'In order to configure a mail server, use the <a href="javascript:void(0);" onclick="CP.util.gotoPage(\'tree/ssmtp\');return false;">Mail Notification</a> page.'
        }],
        listeners: {
            render: function(fPanel){
                fPanel.load({
                    url: '/cgi-bin/cron_job.tcl',
                    method: 'GET'
                    ,success: function() { 
                        CP.util.clearFormDirtyFlag('mailto-form');
                    }
                });
            }
        }
    }];
    return items;
}


/*
 * Creates the modal window (if doesnt exist - shouldnt happen)
 * Called by handlers of add/edit 
 */
,getModalWindow: function(){
    //list of months combo
    var monthsLC = Ext.create( 'CP.WebUI4.ComboCheckBox',{
        id: 'months_lc',
        name: 'months_lc',
        fieldLabel: 'Month',
        width: 200,
        maxHeight: 200,
        labelWidth: 75,
        store:[
               [1, 'January'],[2, 'February'],
               [3, 'March'],[4, 'April'],
               [5, 'May'],[6, 'June'],
               [7, 'July'],[8, 'August'],
               [9, 'September'],[10, 'October'],
               [11, 'November'],[12, 'December']
           ]
    });

    //list of days in months combo
    var dayOfMonthLC = Ext.create( 'CP.WebUI4.ComboCheckBox',{
        id: 'days_of_month_lc',
        name: 'days_of_month_lc',
        fieldLabel: 'Days of Month',
        width: 200,
        maxHeight: 200,
        labelWidth: 75,
        store: [
                [1, '1'],[2, '2'],[3, '3'],[4, '4'],[5, '5'],[6, '6'],[7, '7'],[8, '8'],[9, '9'],
                [10, '10'],[11, '11'],[12, '12'],[13, '13'],[14, '14'],[15, '15'],[16, '16'],[17, '17'],
                [18, '18'],[19, '19'],[20, '20'],[21, '21'],[22, '22'],[23, '23'],[24, '24'],[25, '25'],
                [26, '26'],[27, '27'],[28, '28'],[29, '29'],[30, '30'],[31, '31']
                ]
    });

    //list of days in week combo
    var dayOfWeekLC = Ext.create( 'CP.WebUI4.ComboCheckBox', {
        id: 'day_of_week_lc',
        name: 'day_of_week_lc',
        fieldLabel: 'Days of Week',
        width: 200,
        maxHeight: 200,
        labelWidth: 75,
        store: [[0, 'Sunday'],
                [1, 'Monday'],
                [2, 'Tuesday'],
                [3, 'Wednesday'],
                [4, 'Thursday'],
                [5, 'Friday'],
                [6, 'Saturday']]
    });

    //Add form
    var cronForm = Ext.create( 'CP.WebUI4.FormPanel',{
        bodyPadding: 10,
        id: 'cron_form',
        items: [{
            xtype: 'cp4_textfield'
            ,fieldLabel: "Job Name"
            ,id: "cron_job_name"
            ,name: "cron_job_name"
            ,validateOnBlur: false
            ,enableKeyEvents: true
            ,maxLength: CP.Cron.CRON_JOB_NAME_MAX_LEN
            ,width: 330
            ,validator: function(value){
							if (value == "")  return "Please provide a valid job name"
							
							re = new RegExp(/^[a-zA-Z0-9_]+$/g);			
							if (!re.test(value))  return "A name may only contain digits, letters and underscores (_)";
							else  return true;
						}
        },{
            xtype: 'cp4_textfield'
            ,fieldLabel: "Command to Run"
            ,id: "cron_job_command"
            ,name: "cron_job_command"
            ,validateOnBlur: false
			,validator: function(value) {
		     if (value ==  "" || Ext.getCmp('cron_job_name').value == "" )
			return "Please provide a command" ;
		      else 
			return true ;
						}
			,maskRe: /[^\\]/ 
            ,width: 400
        },{
            xtype: 'cp4_sectiontitle',
            titleText: 'Schedule'
        },{
            xtype: 'cp4_panel',
            layout: 'column',
            items:[{
                xtype: 'cp4_panel',
                columnWidth: .20,
                items: [{
                // ~~~ LEFT COLUMN
                    xtype: 'cp4_radio',
                    boxLabel: 'Daily', 
                    name: 'cb_custwidth', 
                    id: 'cb_custwidth1',
                    width: 100, // for IE
                    checked: true,
                    inputValue: 1, 
                    handler: function(){
                        CP.Cron.changeOccurMode(Ext.getCmp('cb_custwidth1'), 'add_daily_occur_panel');
                    }
                },{
                    xtype: 'cp4_radio',
                    boxLabel: 'Weekly', 
                    name: 'cb_custwidth',
                    id: 'cb_custwidth2',
                    width: 100, // for IE
                    inputValue: 2, 
                    handler: function(){
                        CP.Cron.changeOccurMode(Ext.getCmp('cb_custwidth2'), 'add_weekly_occur_panel');
                    }
                },{
                    xtype: 'cp4_radio',
                    boxLabel: 'Monthly', 
                    name: 'cb_custwidth', 
                    id: 'cb_custwidth3',
                    width: 100, // for IE
                    inputValue: 3, 
                    handler: function(){
                        CP.Cron.changeOccurMode(Ext.getCmp('cb_custwidth3'), 'add_monthly_occur_panel');
                    }
                },{
                    xtype: 'cp4_radio',
                    boxLabel: 'At startup', 
                    name: 'cb_custwidth', 
                    id: 'cb_custwidth4',
                    width: 100, // for IE
                    inputValue: 4, 
                    handler: function(){
                        CP.Cron.changeOccurMode(Ext.getCmp('cb_custwidth4'), 'at_startup_panel');
                    }
                }]
            },{
            // ~~~ MIDDLE COLUMN
                xtype: 'cp4_panel',
                width: 10,
                height: 80,
                cls: 'cron-job-seperator',
                html: '&nbsp;'
            },{
            // ~~~ RIGHT COLUMN
                xtype: 'cp4_panel',
                columnWidth: .79,
                items:[{
                    xtype: 'cp4_panel',
                    id: 'add_daily_occur_panel',
                    items: [{
                        xtype: 'cp4_timebox',
                        id: 'day_job',
                    	labelWidth: 75,
                        width: 200
                    }]
                },{
                    xtype: 'cp4_panel',
                    id: 'add_weekly_occur_panel',
                    hidden: true,
                    items: [{
                        xtype: 'cp4_timebox',
                        id: 'week_job',
                        labelWidth: 75,
                        width: 200
                    },
                    dayOfWeekLC ]
                },{
                    xtype: 'cp4_panel',
                    id: 'add_monthly_occur_panel',
                    hidden: true,
                    items: [{
                        xtype: 'cp4_timebox',
                        id: 'month_job',
                    	labelWidth: 75,
                        width: 200
                    },
                    dayOfMonthLC, 
                    monthsLC ]
                },{
                    xtype: 'cp4_panel',
                    id: 'at_startup_panel',
                    hidden: true,
                    style: 'line-height:80px;text-align:center;',
                    html: 'This job will run every time the system is started.'
                }]
            }]
        }],
        //Save and cancel buttons
        buttons: [{
            id: 'save_btn',		// The validator of the form is called through a listener func (of 'click') called 'onSaveAdd' or 'onSaveEdit'
            text: 'OK',
            xtype: 'cp4_button'
            //add handler later
        },{
            text: 'Cancel',
            xtype: 'cp4_button',
            handler: function(){
				if (null != Ext.getCmp( CP.Cron.GRID_ID ).getSelectionModel().getLastSelected()){
					Ext.getCmp( 'cron-delete-job' ).enable(); 
					Ext.getCmp( 'cron-edit-job' ).enable();
				}
                Ext.getCmp( 'add_job_window' ).close();
            }
        }]
    });

    //Modal window for add, edit
    var modalWin = Ext.create( 'CP.WebUI4.ModalWin',{
        id: 'add_job_window',
        name: 'add_job_window',
        width: 500,
        height: 300,
        title: 'Add A New Scheduled Job',
        items: [ cronForm ]
    });
  
    return modalWin;
}

,changeOccurMode: function( oCB, panelId ){
    //Hide all
    if( oCB.getValue() == false){
        return;
    }
    Ext.getCmp( 'add_daily_occur_panel' ).hide();
    Ext.getCmp( 'add_weekly_occur_panel' ).hide();
    Ext.getCmp( 'add_monthly_occur_panel' ).hide();
    Ext.getCmp( 'at_startup_panel' ).hide();
    //Show selected
    if( panelId ){
        Ext.getCmp( panelId ).show();
    }
}

,openModalWindowAdd: function( title ){
    var winObj = CP.Cron.getModalWindow();
    Ext.getCmp('save_btn').addListener('click',CP.Cron.onSaveAdd);
    winObj.setTitle( title );
    Ext.getCmp('cron_job_name').enable();
    winObj.show();
}

,openModalWindowDelete: function(){
    CP.WebUI4.Msg.show({
        title:'Delete Scheduled Job',
        msg: 'Are you sure you want to delete the selected job?',
        buttons: Ext.Msg.OKCANCEL,
        icon: Ext.Msg.QUESTION,
        fn: function(btn, text){
			/* First disable the add and delete buttons to prevent more messages from being sent*/
			Ext.getCmp( 'cron-delete-job' ).disable(); 
			Ext.getCmp( 'cron-edit-job' ).disable();
            var gridSM = Ext.getCmp( CP.Cron.GRID_ID ).getSelectionModel();
            var s = gridSM.getLastSelected();
			
            if (btn == "cancel" || !s){
				Ext.getCmp( 'cron-delete-job' ).enable(); 
				Ext.getCmp( 'cron-edit-job' ).enable();
                return;
			}
			
            gridSM.clearSelections();
			
            Ext.Ajax.request({
                url: "/cgi-bin/cron_job.tcl"
                ,method: "POST"
                ,params: {action:"remove", name:s.get("name")}
                ,success: function(jsonResult) {
                    Ext.getCmp( CP.Cron.GRID_ID ).getStore().load();
                    var jsonData = Ext.decode(jsonResult.responseText);
                    CP.util.setStatusMsg(jsonData);
                }
            });
        }
    });
}

,openModalWindowEdit: function( title ){
    Ext.getCmp("cron-edit-job").disable();
    Ext.getCmp("cron-delete-job").disable();
    var s = Ext.getCmp( CP.Cron.GRID_ID ).getSelectionModel().getLastSelected();
    var winObj = CP.Cron.getModalWindow();
    
    if (!s || !winObj)
        return;

    Ext.getCmp('save_btn').addListener('click',CP.Cron.onSaveEdit);
    winObj.setTitle( title );
    
    //fill the fields in the modal window according to the jobs real recurrence
    Ext.Ajax.request({
        url: "/cgi-bin/cron_job.tcl"
        ,method: "GET"
        ,params: {name:s.get("name")}
        ,success: function(jsonResult) {
            var jsonData = Ext.decode(jsonResult.responseText);
            Ext.getCmp('cron_job_name').setValue(jsonData.data.jobinfo[0].name);
            Ext.getCmp('cron_job_name').disable();
            Ext.getCmp('cron_job_command').setValue(jsonData.data.jobinfo[0].command);
            
            winObj.show(); //first open window so fields will be available for settings
            
			if(jsonData.data.jobinfo[0].startup == "1")
			{				
				Ext.getCmp('cb_custwidth1').setValue(false);
				Ext.getCmp('cb_custwidth4').setValue(true);
				return;
			}
			
            if (jsonData.data.jobinfo[0].months != "all") {
                //monthly
                var monthTimeBox = Ext.getCmp( 'month_job' );
                var mHours = parseInt(jsonData.data.jobinfo[0].hours,10);
           	 	if( CP.global.formatTime == '12-hour' ){
	                if (mHours == 0 || mHours > 12) {
	                    monthTimeBox.setAmPm("PM");
	                    mHours -= 12;
	                    if (mHours == -12)
	                        mHours = 12;
	                }
	                else
	                    monthTimeBox.setAmPm("AM");
           	 	}
               Ext.getCmp('days_of_month_lc').setValue(new String(jsonData.data.jobinfo[0].daysinmonth).split(','));
                Ext.getCmp('months_lc').setValue(new String(jsonData.data.jobinfo[0].months).split(','));
              
                if (mHours >= 10)
                    monthTimeBox.setHours(mHours);
                else
                    monthTimeBox.setHours('0'+mHours);
  				var mMin = parseInt(jsonData.data.jobinfo[0].minutes,10);
                if (mMin >= 10)
                    monthTimeBox.setMinutes( mMin );
                else
                    monthTimeBox.setMinutes( '0'+mMin );

                 //deselect the radio that was selected by default
                Ext.getCmp('cb_custwidth1').setValue(false);
                Ext.getCmp('cb_custwidth3').setValue(true);
            }
            else if (jsonData.data.jobinfo[0].daysinweek != "all") {
                //weekly
                var weekTimeBox = Ext.getCmp( 'week_job' );
                var wHours = parseInt(jsonData.data.jobinfo[0].hours,10);
                if( CP.global.formatTime == '12-hour' ){
	                if (wHours== 0 || wHours > 12) {
	                    weekTimeBox.setAmPm( "PM" );
	                    wHours -= 12;
	                    if (wHours == -12)
	                        wHours = 12;
	                }
	                else
	                    weekTimeBox.setAmPm( "AM" );          
         	 	}
                Ext.getCmp('day_of_week_lc').setValue(new String(jsonData.data.jobinfo[0].daysinweek).split(','));
                   
             	if (wHours >= 10)
                    weekTimeBox.setHours( wHours );
                else
                    weekTimeBox.setHours( '0'+wHours );
                var wMin = parseInt(jsonData.data.jobinfo[0].minutes,10);
                if (wMin >= 10)
                    weekTimeBox.setMinutes( wMin );
                else
                    weekTimeBox.setMinutes( '0'+wMin );
                
                //deselect the radio that was selected by default
                Ext.getCmp('cb_custwidth1').setValue(false);
                Ext.getCmp('cb_custwidth2').setValue(true);
            }
            else {
                //daily
                var dayTimeBox = Ext.getCmp( 'day_job' );
                var dHours = parseInt(jsonData.data.jobinfo[0].hours,10);
           	 	if( CP.global.formatTime == '12-hour' ){
	                if (dHours== 0 || dHours > 12) {
	                    dayTimeBox.setAmPm("PM");
	                    dHours -= 12;
	                    if (dHours == -12)
	                        dHours = 12;
	                }
	                else
	                    dayTimeBox.setAmPm("AM");
           	 	}
                if (dHours >= 10)
                    dayTimeBox.setHours( dHours );
                else
                    dayTimeBox.setHours( '0'+dHours );
 
                var dMin = parseInt(jsonData.data.jobinfo[0].minutes,10);
                if (dMin >= 10)
                    dayTimeBox.setMinutes( dMin );
                else
                    dayTimeBox.setMinutes( '0'+dMin );
                    
                Ext.getCmp('cb_custwidth1').setValue(true);
            }
        }
    });
}

/*
 * Extract the scheduling from the fields and put it into properties of an object scheduling
 * Returns: true if the field is valid, else otherwise
 */
,getSchedulingToSend: function(scheduling) {
    var mwField =  Ext.getCmp('cron_job_name');
    var result = mwField.validate();
    scheduling.job_name = mwField.getValue();
    
    mwField = Ext.getCmp('cron_job_command');
    result = ( mwField.validate() && result);
    scheduling.command = mwField.getValue();
    
	if (!result){ // Every job must have a name and a command
		return result;	
	}
	
    scheduling.hours = "all";
    scheduling.minutes = "all";
    scheduling.daysinmonth = "all";
    scheduling.months = "all";
    scheduling.daysinweek = "all";
    scheduling.startup = "0";
    
    function sorter(a,b){
        return a-b;
    }
    
    if (Ext.getCmp('cb_custwidth4').getValue()) {
        scheduling.startup = "1";
    }
    else if (Ext.getCmp('cb_custwidth1').getValue()) {
        //daily
        result = ( CP.Cron.getTimeFromBox('day_job', scheduling) && result );
    }
    else if (Ext.getCmp('cb_custwidth2').getValue()) {
        //weekly 
        scheduling.daysinweek = Ext.getCmp('day_of_week_lc').getValue().sort(sorter).join(',');
        result = (result && scheduling.daysinweek);
        result = ( CP.Cron.getTimeFromBox('week_job', scheduling) && result );
    }
    else if (Ext.getCmp('cb_custwidth3').getValue()) {
        //monthly
        scheduling.months = Ext.getCmp('months_lc').getValue().sort(sorter).join(',');
        result = (result && scheduling.months);
        scheduling.daysinmonth = Ext.getCmp('days_of_month_lc').getValue().sort(sorter).join(',');
        result = (result && scheduling.daysinmonth);
        result = ( CP.Cron.getTimeFromBox('month_job', scheduling) && result );
    }
    
    return result;
}

,getTimeFromBox: function( timeBoxId, scheduling ){
    var timeField = Ext.getCmp( timeBoxId );
    //hours    
    var hoursField = timeField.getHoursField();
    var result = hoursField.validate();
    scheduling.hours = parseInt( hoursField.getValue(), 10 );
    
    //AM:PM
    var ampmField = timeField.getAmPmField();
    if ( ampmField.getValue() == "PM")
        scheduling.hours = (scheduling.hours + 12)%24;
    else if ( ampmField.getValue() != "AM")
        result = false;
    
    //minutes
    var minField = timeField.getMinutesField();
    result = ( minField.validate() && result);
    scheduling.minutes = minField.getValue();
    
    return result;
}

/*
 * Save button handlers for add/edit actions. Get the values, validate and send a request to add/edit.
 * If not valid do nothing and return.
 */
,onSaveAdd: function( btn, evt) {
    btn.removeListener('click',CP.Cron.onSaveAdd);
    var winObj = Ext.getCmp('add_job_window');
    
    var scheduling = {};
    if (!winObj || !CP.Cron.getSchedulingToSend(scheduling)) {
        btn.addListener('click',CP.Cron.onSaveAdd);
        return;
    }
    var cmd = scheduling.command.replace(/;/g, "\\;");
	Ext.Ajax.request({
        url: "/cgi-bin/cron_job.tcl"
        ,method: "POST"
        ,params:{    action:"add", name:scheduling.job_name, jCommand:cmd, 
                    hours:scheduling.hours, minutes:scheduling.minutes, 
                    daysinmonth:scheduling.daysinmonth, months:scheduling.months, 
                    daysinweek:scheduling.daysinweek,startup:scheduling.startup
                }
        ,success: function(jsonResult) {
            Ext.getCmp( CP.Cron.GRID_ID ).getStore().load();
            var jsonData = Ext.decode(jsonResult.responseText);
            CP.util.setStatusMsg( jsonData );
        }
    });
    
    Ext.getCmp( CP.Cron.GRID_ID ).getSelectionModel().clearSelections();
    winObj.close();
}

/*
 * see description above
 */
,onSaveEdit: function( btn, evt) {
    btn.removeListener('click',CP.Cron.onSaveEdit);
    var winObj = Ext.getCmp('add_job_window');
    
    var scheduling = {};
    if (!winObj || !CP.Cron.getSchedulingToSend(scheduling)) {
        btn.addListener('click',CP.Cron.onSaveEdit);
        return;
    }

    var cmd = scheduling.command.replace(/;/g, "\\;");
    Ext.Ajax.request({
        url: "/cgi-bin/cron_job.tcl"
        ,method: "POST"
        ,params: {action:"set", name:scheduling.job_name, editCommand:cmd}
        ,success: function(jsonResult) {}
    });
    
    Ext.Ajax.request({
        url: "/cgi-bin/cron_job.tcl"
        ,method: "POST"
        ,params:{    action:"setall", name:scheduling.job_name, 
                    hours:scheduling.hours, minutes:scheduling.minutes, 
                    daysinmonth:scheduling.daysinmonth, months:scheduling.months, 
                    daysinweek:scheduling.daysinweek,startup:scheduling.startup
                }
        ,success: function(jsonResult) {
            Ext.getCmp( CP.Cron.GRID_ID ).getStore().load();
            var jsonData = Ext.decode(jsonResult.responseText);
            CP.util.setStatusMsg( jsonData );
        }
    });
    
    Ext.getCmp( CP.Cron.GRID_ID ).getSelectionModel().clearSelections();
    winObj.close();
}

}
