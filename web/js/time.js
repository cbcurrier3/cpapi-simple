//searchKeys: hour minute date day


CP.Time = {

    isNTPOn: false,
    currentNTP: 0,
    primaryServer: 0,
    secondaryServer: 0,
    MAIN_PANEL_ID: 'time_main_panel',
    MODAL_WIN_ID: 'time_modal_window',
	TIME_UPDATE_TASK: null,
	NTP_UPDATE_TASK: null,

init:function() {	
    var page = {
        title: 'Time',
        helpFile: 'timeHelp.html',
        params: {},
		cluster_feature_name : "time",
        submitURL: '/cgi-bin/time.tcl',
        afterSubmit: CP.Time.init,
        related: [{ page: 'tree/format' }],
        panel: Ext.create( 'CP.WebUI4.DataFormPanel',{
            id: CP.Time.MAIN_PANEL_ID, 
            items: CP.Time.getPageItems(),
			listeners: {
					removed: function(){
						if (CP.Time.TIME_UPDATE_TASK != null){
							Ext.TaskManager.stop(CP.Time.TIME_UPDATE_TASK);
							CP.Time.TIME_UPDATE_TASK = null;
						}
						if (CP.Time.NTP_UPDATE_TASK != null){
							Ext.TaskManager.stop(CP.Time.NTP_UPDATE_TASK);
							CP.Time.NTP_UPDATE_TASK = null;
						}
					}
			}
            // if the browser is IE than it uses different functions and threads than other browser - that's why it needs to
            // close the threads upon quiting the time page           
        }) 
    };

    //display the page
    CP.UI.updateDataPanel(page);
	
	CP.Time.getTime();
	
	CP.Time.setAutomaticUpdates();
	
    //start the graphical clock procedure only if the browser is not IE. IE doesn't support it.
	CoolClock.findAndCreateClocks();
}

/*Set Timed task threads to update the clock and date automaticaly and frequently from the server*/
,setAutomaticUpdates: function(){
	CP.Time.TIME_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/time.tcl', 'GET',  CP.Time.setTimeAndDateData,  15);
    Ext.TaskManager.start(CP.Time.TIME_UPDATE_TASK);

	CP.Time.NTP_UPDATE_TASK = CP.util.createFrequentRequestRunnable('/cgi-bin/ntp.tcl', 'GET',CP.Time.setNtpData ,  20);
    Ext.TaskManager.start(CP.Time.NTP_UPDATE_TASK);
}

//get items array contains all elements in page
,getPageItems: function(){
    // in case the browser is IE than no graphical clock can be drawn. In that case the graphical clock area will be hidden
        
    var items = [{
        //Add section title to panel
        xtype: 'cp4_sectiontitle',
        titleText: 'Time and Date'
    },{
        //Time and Date
        xtype: 'cp4_panel',
        layout: 'hbox',
        padding: '0 15 15',  
        defaults: {
            xtype: 'cp4_panel'
        },
        items: [{
            width: 250,
            padding: '15 0 0 0',
            items: [{
                xtype: 'cp4_displayfield',
                fieldLabel: 'Time',
                id: 'time',
                labelWidth: 40,
                width: 150
            },{
                xtype: 'cp4_displayfield',
                fieldLabel: 'Date',
                id: 'date',
                labelWidth: 40,
                minWidth: 150,
                width: 150
            },{
                xtype: 'cp4_displayfield',
                value: 'Time is set automatically via NTP',
                id: 'ntpEnabled',
				style : 'white-space: nowrap',
                hidden: true
            },{
                xtype: 'cp4_displayfield',
                value: 'No server has yet to be synchronized',
                id: 'ntpEnabledButNoServer',
                hidden: true
            },{
                xtype: 'cp4_displayfield',
                fieldLabel: 'NTP Server',
                id: 'currentNTPField',
                hidden: true,
				labelWidth: 70
            },{
                xtype: 'cp4_button',
                id: 'setTime',
                text: 'Set Time and Date',
                margin: '20 0 10 0',
                minWidth: 130,
                handler: CP.Time.addTimeAndDateMainTable
            }]
        },{
            xtype: 'cp4_container',
            flex: 1,       
            html: '<canvas id="clockid" class="CoolClock:classic:65"></canvas>'
        }]
    },{
        //Add section title to panel
        xtype: 'cp4_sectiontitle',
        titleText: 'Time zone'
    },{
        //Time zone
        xtype: 'cp4_panel',
        padding: 15,
        margin: '0 0 24 0',
        items: [{
            xtype: 'cp4_displayfield',
            id: 'timeZoneLabel',
            name: 'timezone',
            minWidth: 190,
            width: 190
        },{
            xtype: 'cp4_button',
            text: 'Set Time Zone',
            width: 130,
            handler: CP.Time.timeZoneWindow
        }]
    }];
    
    return items;
}


//the window for setting the Time And Date
,addTimeAndDateMainTable: function(){
    var manualFormlItem = CP.Time.getManualForm();
    var NTPFormItem = CP.Time.getNTPForm();
    var manualRadioItem = CP.Time.getManualRadioForm(!CP.Time.isNTPOn);
    var automaticRadioItem = CP.Time.getAutomaticRadioForm(CP.Time.isNTPOn);
    
    var SetTimeDialog = Ext.create( 'CP.WebUI4.ModalWin',{
        id: CP.Time.MODAL_WIN_ID,
        title: 'Time and Date settings',
        width: 500,
        height: 316,
        items: [{
            xtype: 'cp4_formpanel',
            bodyPadding: 10,
            items: [
                manualRadioItem,
                manualFormlItem,
                automaticRadioItem,
                NTPFormItem
            ],
            buttons: [{
                text: 'OK',
                id:"btn-ok",
                xtype: 'cp4_button',
                handler: function(){
					var priServer = Ext.getCmp("primary_server_field");
					var secServer = Ext.getCmp("secondary_server_field");
                    if (priServer.validate() && secServer.validate()) {
						var priVal = priServer.getValue();
						var secVal = secServer.getValue();
						var isNTPon = (Ext.getCmp("ntp_radio").getValue() == true);
						
						if (isNTPon) {
							if (priVal == "") {
								priServer.markInvalid("This Field is required");
								return;
							} else if (priVal == secVal) {
								secServer.markInvalid("Secondary server can't have the same IP address");
								return;
							}
						}
						if (!isNTPon && CP.Time.isNTPOn) {
							CP.Time.isNTPOn = false;
							CP.Time.showHideNTPDetails();
						} else {
							CP.Time.isNTPOn = isNTPon;
						}
                        CP.Time.setTimeAndDate ();
                        Ext.getCmp( CP.Time.MODAL_WIN_ID ).close();
                    }
                }
            },{
                text: 'Cancel',
                xtype: 'cp4_button',
                handler: function(){
                    Ext.getCmp( CP.Time.MODAL_WIN_ID ).close();
                }
            }]
            ,listeners: {
                render: CP.Time.fillMachineTimeFields
            }    
        }]
    });
	
    Ext.Ajax.request({
        url: '/cgi-bin/ntp.tcl'
        , method: 'GET'
        , success: function(response) {
          var jsonData = Ext.decode(response.responseText);
            CP.Time.isNTPOn = ( jsonData.data.isNTPOn == "t" ) ? true : false;
            var primaryNTP = jsonData.data.primary;
            var secondaryNTP = jsonData.data.secondary;
            var primaryNTPVersion = jsonData.data.primary_version;
            var secondaryNTPVersion = jsonData.data.secondary_version;			
			
			
			if(primaryNTP != "")
				Ext.getCmp("primary_server_field").setValue(primaryNTP);
			if(secondaryNTP != "")
				Ext.getCmp("secondary_server_field").setValue(secondaryNTP);
				
			if(primaryNTPVersion != "") 
				Ext.getCmp("primary_server_version").setValue("" + primaryNTPVersion);
			if(secondaryNTPVersion != "")
				Ext.getCmp("secondary_server_version").setValue("" + secondaryNTPVersion);				
				
				
        }
    });		
	
	SetTimeDialog.show();
}


//the Time And Date Form item (manual part) which will be placed inside timeAndDateMainTable
,getManualForm: function() {
    var date_field = Ext.create( 'CP.WebUI4.DateField',{
        id: 'date_field',
        fieldLabel: 'Date',
        format: "l, F d, Y" ,
        allowBlank: false,
        minValue: "Thursday, January 01, 1970" ,
        maxValue: "Thursday, December 31, 2037",
        margin: '10 0 10 17',
        labelWidth: 115,
        width: 350,
        validator: function() {
            var timebox = Ext.getCmp('date_time_time_panel');
            var hours = timebox.getHoursField();
            var minutes = timebox.getMinutesField();
            var ampm = timebox.getAmPmField();
            
            if (!Ext.getCmp("set_time_manually_radio").getValue()){
                return true;
            }
            if (Ext.getCmp ("date_field").getValue() != "" && hours.getValue () != "" 
                && minutes.getValue () != "" && (ampm.getValue () != "" || ampm.isVisible() == false)){
                return true;
            }
            else{
                return false;
            }
        }
        , listeners: {
            valid: function(field){
                var timebox = Ext.getCmp('date_time_time_panel');
                var hours = timebox.getHoursField();
                var minutes = timebox.getMinutesField();
                var ampm = timebox.getAmPmField();
                
                if (hours.isValid () && minutes.isValid ()
                    && (ampm.isValid() || ampm.isVisible() == false)) {
                    Ext.getCmp("btn-ok").enable();
                }
                else{
                    Ext.getCmp("btn-ok").disable();
                }
            }
            ,invalid: function(){
                Ext.getCmp("btn-ok").disable();
            }
        }
    });
    
    var time_panel = ({
        xtype: 'cp4_timebox',
        id: 'date_time_time_panel',
        margin: '10 0 10 17',
        labelWidth: 115,
        width: 400
    });
    
    return [time_panel, date_field];
}



//the Time And Date Form item (automatic - NTP part) which will be placed inside timeAndDateMainTable
,getNTPForm: function() {
    var primary_server_field = 
		{
			xtype: 'cp4_domainnameAndIPv6'
			,id: 'primary_server_field'
			,emptyText: 'Example: \"pool.ntp.org\"'
			,fieldLabel: 'Primary NTP server'
			,margin: '10 0 6 8'
			,labelWidth: 115
			,width: 250
    };
	
	
    var primary_server_version = {
        xtype: 'cp4_combobox',
        id: 'primary_server_version',
	name: 'primary_server_version',
        fieldLabel: 'Version',	
		store:[['1','1'],['2','2'],['3','3'],['4','4']],
		width: 100,
		labelWidth: 60,
		margin: '10 0 5 15',
		editable : false,
		value : '1'
    };    
	
	
	var primary_field_panel = {  
            xtype: 'cp4_fieldcontainer',
            combineErrors : false,
            items: [primary_server_field,primary_server_version]
        };
	
	
    var secondary_server_field = {
        xtype: 'cp4_domainnameAndIPv6',
        id: 'secondary_server_field',
        fieldLabel: 'Secondary NTP server',
        margin: '0 0 0 8',
        labelWidth: 115,
        width: 250
    };

    var secondary_server_version = {
        xtype: 'cp4_combobox',
        id: 'secondary_server_version',
        name: 'secondary_server_version',
        fieldLabel: 'Version',	
		store:[['1','1'],['2','2'],['3','3'],['4','4']],
		width: 100,
		labelWidth: 60,
        margin: '0 0 0 15',
		editable : false,
		value : '1'
    };    
		
	var secondary_field_panel = {  
            xtype: 'cp4_fieldcontainer',
            combineErrors : false,
            items: [secondary_server_field,secondary_server_version]
        };		
	
    var shared_secret_field = {
        xtype: 'cp4_textfield'
        , id: 'shared_secret_field'
        , fieldLabel: 'Shared Secret'
        , width: 225
        ,disabled:true
        ,hidden: true    
        ,hideLabel:true    
    };
   
    var synch_period_fieldset = {
         xtype: 'cp4_panel'
         ,labelWidth: 200
         ,width: 370
         ,layout: 'column'
         ,hidden:true
         ,defaults:{          
            xtype:'cp4_panel'          
         }
         ,items: [{
            // left column
            columnWidth: .8,
            items: [{
                xtype: 'cp4_positiveint'
                , id: 'synch_period_field'
                , fieldLabel: 'Synchronization period'
                , width: 80
                , disabled:true
            }]
         },{
            // right column
            columnWidth: .2,
            items: [{
                xtype: 'cp4_label',
                text: 'seconds',
                width: 50
            }]
        }]
    };

    var synch_period_field ={
        xtype: 'cp4_positiveint'
        , id: 'synch_period_field1'
        , fieldLabel: 'Synchronization period'
        , width: 225
        , disabled:true
    };
    
    return [ primary_field_panel,
			secondary_field_panel,
             shared_secret_field, 
             synch_period_fieldset ];
}


//the Time And Date Form item (manual radio button) which will be placed inside timeAndDateMainTable
,getManualRadioForm: function( rbChecked ){
    var set_manually_radio = {
        xtype: 'cp4_radio',
        id: 'set_time_manually_radio',
        name: 'set_time_manually_radio',
	width: 350,
        boxLabel: 'Set Time and Date manually',
        checked: rbChecked,
        inputValue: 'true',
        handler: function(field, ischecked) {
            // setting the enabled fields on each radio check / uncheck
            this.change_state();
        },
        listeners: {
            // setting the enabled fields on first creation
            beforerender: function(field, ischecked) {
                var datefld = Ext.getCmp("date_field");
                if (CP.Time.isNTPOn == false){
                    datefld.enable();
                    datefld.validate();
                    Ext.getCmp("date_time_time_panel").enable();
                }
                else{
                    datefld.disable();
                    Ext.getCmp("date_time_time_panel").disable();
                    Ext.getCmp("primary_server_field").validate();
                    Ext.getCmp("secondary_server_field").validate();
                }
            }
        }
        , change_state: function(){
            if( Ext.getCmp('set_time_manually_radio').getGroupValue() == "true"){
                Ext.getCmp("ntp_radio").setValue(false);                        
                Ext.getCmp("primary_server_field").disable();
                Ext.getCmp("secondary_server_field").disable();
                Ext.getCmp("shared_secret_field").disable();
                Ext.getCmp("synch_period_field").disable();
				Ext.getCmp("primary_server_version").disable();
				Ext.getCmp("secondary_server_version").disable();
                Ext.getCmp("btn-ok").enable();
                Ext.getCmp("primary_server_field").clearInvalid();
                Ext.getCmp("secondary_server_field").clearInvalid();        
            }
            else{
                Ext.getCmp("primary_server_field").enable();
                Ext.getCmp("secondary_server_field").enable();
                Ext.getCmp("shared_secret_field").enable();
                Ext.getCmp("synch_period_field").enable();
                Ext.getCmp('ntp_radio').change_state();
				Ext.getCmp("primary_server_version").enable();			
				Ext.getCmp("secondary_server_version").enable();	
            }
        }              
    };

    return set_manually_radio;
}


//the Time And Date Form item (automatic radio button) which will be placed inside timeAndDateMainTable
,getAutomaticRadioForm : function (rbChecked){
    var set_automatic_radio = {
        xtype: 'cp4_radio',
        id: 'ntp_radio',
        name: 'ntp_radio',
	width: 400,
        boxLabel: 'Set Time and Date automatically using Network Time Protocol (NTP)',
        checked: rbChecked,
        margin: '24 0 0 0',
        inputValue: 'later',
        handler: function(field, ischecked) {
            // setting the enabled fields on each radio check / uncheck
            this.change_state();
        },
        listeners: {
            // setting the enabled fields on first creation
            beforerender: function(field, ischecked){
                var primarySrvFld = Ext.getCmp("primary_server_field");
                var secondSrvFld = Ext.getCmp("secondary_server_field");
                var primarySrvFldVersion = Ext.getCmp("primary_server_version");
                var secondSrvFldVersion = Ext.getCmp("secondary_server_version");				
                var sharedSecretFld = Ext.getCmp("shared_secret_field");
                var synchPeriodFld = Ext.getCmp("synch_period_field");
                if (CP.Time.isNTPOn == true){
                    primarySrvFld.enable();
                    secondSrvFld.enable();
                    sharedSecretFld.enable();
                    synchPeriodFld.enable();
					primarySrvFldVersion.enable();
					secondSrvFldVersion.enable();
                }
                else{
                    primarySrvFld.disable();
                    secondSrvFld.disable();
                    sharedSecretFld.disable();
                    synchPeriodFld.disable();
                    Ext.getCmp("date_field").validate ();
					primarySrvFldVersion.disable();
					secondSrvFldVersion.disable();
                }
            }
        }
        , change_state: function(){
            if(Ext.getCmp('ntp_radio').getGroupValue() == "later"){
                Ext.getCmp("set_time_manually_radio").setValue(false);
                Ext.getCmp("date_field").disable();
                Ext.getCmp("date_time_time_panel").disable();
                Ext.getCmp("secondary_server_field").validate ();
            }
            else{
                Ext.getCmp("date_field").enable();
                Ext.getCmp("date_time_time_panel").enable();
                Ext.getCmp("date_field").validate ();
                Ext.getCmp('set_time_manually_radio').change_state();
            }
        }
    };

    return set_automatic_radio;
}
   
    
// the window for setting the timeZone
,timeZoneWindow: function(){
    Ext.create( 'CP.WebUI4.ModalWin',{
        id: "timeZone-window"
        ,title: 'Time Zone Settings'
        ,width: 500
        ,height: 140
        ,items: [{
            xtype: 'cp4_formpanel',
            bodyPadding: 10,
            items: [{
                xtype: 'cp4_combobox',
                id: 'timezone_field',
                name: 'timezone_field',
                fieldLabel: 'Time Zone',
                displayField: 'location',
                typeAhead: true,
                selectOnFocus: true,
                forceSelection: true,
                width: 330,
                maxHeight: 225,
                store: Ext.create( 'CP.WebUI4.Store',{
                    fields: ['zone', 'gmt', 'location'],
                    proxy: {
                        type: 'ajax',
                        url : '/webui/conf/TimeZoneDB.xml',
                        reader: {
                            type: 'xml',
                            record: 'entry',
                            idProperty: 'timeZoneStore'
                        }
                    },
                    sorters: {
                         sorterFn: function(x, y){
                               var val1 = x.data.gmt;
                               var val2 = y.data.gmt;
                               val1 = Number(val1 ? val1.replace(":",".") : 0);
                               val2 = Number(val2 ? val2.replace(":",".") : 0);
                         
                               if ((val1 - val2) > 0)
                                       return 1;
                               else if ((val1 - val2) < 0)
                                       return -1;
                               return 0;
                         }    
                    },
					listeners: {
						load : function(){
							Ext.getCmp ('timezone_field').setValue (CP.Time.displayTimeZone());
						}
					}
                }),
                listeners: {
                    valid: function(field){
                        if (field.getValue() != "")
                            Ext.getCmp("TZ-btn-ok").enable();
                        else
                            Ext.getCmp("TZ-btn-ok").disable();
                    }
                    ,invalid: function(){
                        Ext.getCmp("TZ-btn-ok").disable();
                    }
                }
            }],
            buttons: [{
                text: 'OK',
                id:"TZ-btn-ok",
                xtype: 'cp4_button',
                handler: function(){
                        CP.Time.setTimeZone();
                        Ext.getCmp( 'timeZone-window' ).close();
                    
                }
            },{
                text: 'Cancel',
                xtype: 'cp4_button',
                handler: function(){
                    Ext.getCmp( 'timeZone-window' ).close();
                }
            }]
        }]
    }).show();
}    
    
    
// the function write the time in the appropriate text box (in the main Time and date section) - it uses two digits format - i.e., 9 -> 09
, fillMachineTimeFields :function(){
    var timebox = Ext.getCmp('date_time_time_panel');
    var hours = timebox.getHoursField();
    var minutes = timebox.getMinutesField();
    var ampm = timebox.getAmPmField();
    
    // filling the manual time fields
    if (new String (window.minutes).length == 1){
        minutes.setValue ('0' + window.minutes);
    }
    else    {
        minutes.setValue (window.minutes);
    }
    if (window.hours >= 12)    {
        // if the format is 12-hour than need to convert hour. if it is 24-hour than no need to do nothing
        if (CP.global.formatTime == "12-hour" && window.hours != 12){
            if ((window.hours - 12) < 10)            {
                // adding 0 in the beginning if needed
                hours.setValue ('0' + (window.hours - 12));
            }
            else            {
                hours.setValue (window.hours - 12);
            }
        }
        else        {
            hours.setValue (window.hours);
        }
        ampm.setValue ('PM');
    }
    else    {
        // in 12-hour format midnight is 12
        if (window.hours == 0 && CP.global.formatTime == "12-hour")        {
            hours.setValue ("12");
        }
        else        {
            if (new String (window.hours).length == 1)            {
                hours.setValue ('0' + window.hours);
            }
            else            {
                hours.setValue (window.hours);
            }
        }
        ampm.setValue ('AM');
    }
    
    var temp = new String (window.date).split ("-");
    var time = temp[1] + "/" + temp[2] + "/" + temp[0];
    Ext.getCmp('date_field').setValue (new Date(time));    
}
 

// the function which stores the time and date information to the DB (makes POST)
,setTimeAndDate : function(){
    if (Ext.getCmp("set_time_manually_radio").getValue() == true){
        var dateString = Ext.getCmp ('date_field').getValue();
        var date = new Date (dateString);
        
        dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        
        var myparams = {};  
        
        var timebox = Ext.getCmp('date_time_time_panel');
        var hours = timebox.getHoursField();
        var minutes = timebox.getMinutesField();
        var ampm = timebox.getAmPmField();
        
        var Htime = hours.getValue();
        // if the format is 12-hour than need to convert the hour
        if (CP.global.formatTime == "12-hour")
        {
            if (ampm.getValue() == "PM")
            {
                if (Htime.length == 2)
                {
                    if (Htime.charAt(0) == '0')
                    {
                        Htime = parseInt(Htime.charAt(1)) + 12;
                    }
                    else
                    {
                        Htime = parseInt (Htime) + 12;
                    }
                    // for PM need to convert to 12
                    if (Htime == "24")
                    {
                            Htime = "12";
                    }
                }
            
                else
                {
                    Htime = parseInt(Htime.charAt(0)) + 12;
                }
                    
            }
            // for AM need to conver to 0
            else
            {
                if (Htime == "12")
                {
                    (Htime = "00");
                }
            }
        }
        // if the format is 24-hour than no need to do nothing
        var min = minutes.getValue();
        //myparams[":clock:time"] = String (Htime) + ":" + String (min);
        myparams["time"] = String (Htime) + ":" + String (min);
        //myparams[":clock:date"] = String (dateString);
        myparams["date"] = String (dateString);
        myparams["apply"] = '1';
        myparams["save"] = '1';
        
        Ext.Ajax.request({
            url: "/cgi-bin/time.tcl"
            ,method: "POST"
            ,params: myparams
            ,success: function(jsonResult) {
                CP.Time.postSuccess(Htime, min, dateString, false);
                CP.Time.getTime();
				var jsonData = Ext.decode(jsonResult.responseText);
				CP.util.setStatusMsg(jsonData);
            }
        });
    } else if (Ext.getCmp("ntp_radio").getValue() == true) {   // if NTP was chosen
        var myparams = {};  
        var primary = Ext.getCmp ("primary_server_field").getValue ();
        if (primary != "") {
            myparams["primary"] = primary;
			myparams["primary_version"] = Ext.getCmp("primary_server_version").getValue();

			if (-1 != primary.indexOf(":")) {
				 myparams["primary_ipv6_state"] = true;
			} else {
				 myparams["primary_ipv6_state"] = false;
			}
			
            // secondary server can be assigned only if the primary was inserted
            var secondary = Ext.getCmp ("secondary_server_field").getValue ();
            if (secondary != "") {
                myparams["secondary"] = secondary;
				myparams["secondary_version"] = Ext.getCmp("secondary_server_version").getValue();
				if (-1 != secondary.indexOf(":")) {
					 myparams["secondary_ipv6_state"] = true;
				} else {
					 myparams["secondary_ipv6_state"] = false;
            }
            } else {
                myparams["secondary"] = "";
            }
        } else { // if no input was inserted than no server will be assigned
            myparams["primary"] = "";
            myparams["secondary"] = "";
        }
        myparams["apply"] = '1';
        myparams["save"] = '1';
                
        Ext.Ajax.request({
            url: "/cgi-bin/ntp.tcl"
            ,method: "POST"
            ,params: myparams
            ,success: function(jsonResult) {
                CP.Time.postSuccess(Htime, min, dateString, true);
                CP.Time.getTime ();
                var jsonData = Ext.decode(jsonResult.responseText);
                CP.util.setStatusMsg(jsonData);
            }
        });
    }
    
    
}

// this function will update the local clock timers instead of getting them from the DB
,postSuccess:function (Htime, min, dateString, isNTP){
    if (isNTP == true){
        CP.Time.isNTPOn = true;
    }
    else{
        CP.Time.isNTPOn = false;
    
        var H = String (Htime);
        if (H.length == 2 && H.charAt(0) == '0')
        {
            H = H.charAt(1);
        }
        
        var M = String (min);
        if (M.length == 2 && M.charAt(0) == '0')
        {
            M = M.charAt(1);
        }
            
        window.hours = String (H);
        window.minutes = String (M);
        window.date = String (dateString);
    }
}

// store the information from the DB in global vars
,setTimeAndDateData: function(jsonResult){
	data = Ext.decode( jsonResult.responseText).data;  
    var machTime = new String (data.clock_time).split (":");
    
    window.hours = machTime[0];
    window.minutes = machTime[1];
    window.seconds = machTime[2];
    window.date = data.clock_date;
    window.timezone = data.timezone;
}

,setNtpData: function(jsonResult){
	data = Ext.decode( jsonResult.responseText).data;  
	CP.Time.isNTPOn = ( data.isNTPOn == "t" ) ? true : false;
	var primaryNTP = data.primary;
	var secondaryNTP = data.secondary;
	var currentNTP = data.current;
	CP.Time.setNTPDetails (primaryNTP, secondaryNTP, currentNTP);
	CP.Time.showHideNTPDetails();
}

// Get the time form the DB manually 
,getTime:function(){
    // get the correct time and date
	Ext.Ajax.request({
		url: '/cgi-bin/time.tcl'
		, method: 'GET'
		, success: function(response) {
				CP.Time.setTimeAndDateData(response);
		}
	});
	
    // get the information about the NTP if available
	Ext.Ajax.request({
		url: '/cgi-bin/ntp.tcl'
		, method: 'GET'
		, success: function(response) {
					CP.Time.setNtpData(response);
		}
	});
}

// this function sets the ntp display label according to the inserted servers
,setNTPDetails:function (primary, secondary, current){
	var ntpEnabledValue = "Time is set automatically via NTP<br><br>";
	if(primary != "") {
		ntpEnabledValue += "Primary server: " + primary + "<br>"
	}
	if(secondary != "") {
		ntpEnabledValue += "Secondary server: " + secondary + "<br>"
	}
	Ext.getCmp("ntpEnabled").setValue(ntpEnabledValue);
	
    Ext.getCmp ("currentNTPField").setValue(current);
    CP.Time.primaryServer = primary;
    CP.Time.secondaryServer = secondary;
    CP.Time.currentNTP = current;
}

// this function shows or hides the ntp details according to the user's selection
,showHideNTPDetails:function (){
    var currNTP = Ext.getCmp ("currentNTPField"); 
    var ntpEnabledNoSrv = Ext.getCmp ("ntpEnabledButNoServer");
    var ntpEnabled = Ext.getCmp ("ntpEnabled");
    if (CP.Time.isNTPOn == true) {// if NTP radio is selected
        if ((CP.Time.currentNTP)&&("No server has yet to be synchronized" != CP.Time.currentNTP)){ // we have an ntp server
            ntpEnabledNoSrv.hide();
            currNTP.show();    // show text
        }
        else{ // No server has been synchronized as an NTP server. 
              // this may take up to 30 minutes. but usually no more than 5...
            currNTP.hide();
            ntpEnabledNoSrv.show();
        }
        ntpEnabled.show();
    }
    else { // NTP is not selected to synchronize the clock
        ntpEnabled.hide();
        currNTP.hide();    // show text
        ntpEnabledNoSrv.hide();        
    }
}


// this function generate and returns a string out of the clock - with the format HH:MM:SS
,timeToString :function ()    
{
    var string = "";
    var min;
    var sec;
    
    if (String(window.minutes).length == 1)
    {
        min = "0" + window.minutes;
    }
    else
    {
        min = window.minutes;
    }
    
    if (String(window.seconds).length == 1)
    {
        sec = ":0" + window.seconds;
    }
    else
    {
        sec = ":" + window.seconds;
    }
    
    if (CP.global.formatTime == "24-hour")
    {
    if (String(window.hours).length == 1)
    {
        string = string + "0" + window.hours + ":";
    }
    else
    {
        string = string + window.hours + ":";
    }
    
        string = string + min + sec;

    }
    else
    {
        var AMPM = "AM";
        var currHours = window.hours;
        // using 12-hour format - midnight is shows as 12 and not 00
        
        if (currHours == "0")
        {
            currHours = "12";
        }
        else 
        {    
            if (currHours >= 12)
            {
                if (currHours != 12)
                {
                    currHours = String(parseInt(currHours) - 12);
                }
                AMPM = "PM";
            }
        }
        if (String(currHours).length == 1)
    {
            string = string + "0" + currHours + ":";
    }
    else
    {
            string = string + currHours + ":";
        }
        
        string = string + min + sec + " " + AMPM;
    
        
    }
    return string;
}

// returns the date according to the selected format
, formatDateToString:function ()
{
    var date = CP.global.formatDate;
    var tmp = new String (window.date).split ("-");
    // add '0' to the month and day if it's value is 1-9. i.e., 6 -> 06
    if (tmp[1].length == 1)
    {
        tmp[1] = '0' + tmp[1];
    }
    if (tmp[2].length == 1)
    {
        tmp[2] = '0' + tmp[2];
    }
    // set the date according to the format
    if (date == "yyyy/mm/dd")
    {
        date = tmp[0] + '/' + tmp[1] + '/' + tmp[2];
    }
    if (date == "mm/dd/yyyy")
    {
        date = tmp[1] + '/' + tmp[2] + '/' + tmp[0];
    }
    if (date == "dd/mm/yyyy")
    {
        date = tmp[2] + '/' + tmp[1] + '/' + tmp[0];
    }
    if (date == "dd-mmm-yyyy")
    {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        date = tmp[2] + '-' + months[tmp[1] - 1] + '-' + tmp[0];
    }
    return date;
}

// the function which initiates the time display for the IE (on IE there will be no graphical clock)
, executeOnIE:function ()
{
    CoolClock.prototype.refreshDisplay();
}

// the function which stops the thread of the clock for IE browser
, endIEExecution:function ()
{
    window.clearInterval(window.thread);
}

// the function which converst the time zone DB representation to the WebUI representation
// from AREA/REGION (GMT -/+ X) to REGION, AREA (GMT -/+ X)
, displayTimeZone:function (timeZoneString)
{
    var arr;
    if (!timeZoneString)
    {
        arr = window.timezone.split (" ");
    }
    else
    {
        arr = timeZoneString.split (" ");
    }
    var zone = arr[0].split ("/");
    // if it is 3-tier zone, i.e. America/Argentina/Buenos_Aires, show only 2-tier, i.e., Buenos_Aires, America
    if (zone.length == 3)
    {
        //zone[1] = zone[1] + "/" + zone[2];
        zone[1] = zone[2];
    }
    var toDisplay;
    // +00:00 will be shown in the webUI as GMT only so it will be equal to the DB information
    if (arr[2] == "+00:00)")
    {
        toDisplay = zone[1] + ", " + zone [0] + " " + arr[1] + ")";
        toDisplay = toDisplay.replace (/_/g, " ");
        return toDisplay;
    }
    // every 00: will become 0: for example +00:00 -> +0:00 so it will be equal to the DB information
    if (arr[2].charAt(1) == '0')
    {
        arr[2] = arr[2].charAt(0) + arr[2].substring (2);
    }
    toDisplay = zone[1] + ", " + zone [0] + " " + arr[1] + " " + arr[2];
    toDisplay = toDisplay.replace (/_/g, " ");
    return toDisplay;
}


// the function which stores the time and date information to the DB (makes POST)
,setTimeZone : function(){
    var Fieldzone = Ext.getCmp ('timezone_field').getValue();
    var region = Fieldzone.split (',')[0];
    region = region.replace (/ /g, "_");
    // GMT+x is not the regExp that we want, therefore we need to add backslashes
    // GMT+x --> GMT\\+x (in regExp + means one or more, but we simply want a plus sign)
    region = region.replace (/GMT\+/g, "GMT\\+");
    var regularExp = new RegExp (region + "$");
    var comboStore = Ext.getCmp('timezone_field').store;
    var objectIndex = comboStore.find ('zone' , regularExp);
    var entry = comboStore.getAt (objectIndex);
    var DBZone = entry.get('zone');
    
    var myparams = {};
    myparams["timezone"] = DBZone;
    myparams["TZOnly"] = "";
    myparams["apply"] = '1';
    myparams["save"] = '1';
    Ext.Ajax.request({
        url: "/cgi-bin/time.tcl"
        ,method: "POST"
        ,params: myparams
        ,success: function(jsonResult) {
            CP.Time.getTime ();
            var jsonData = Ext.decode(jsonResult.responseText);
            CP.util.setStatusMsg(jsonData);
        }
    });
}
} //eof CP.Time
