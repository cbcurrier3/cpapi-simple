
CP.Blades = {
        
        page: {},
        
init: function() {
    var BladesPanel = Ext.create( 'CP.WebUI4.DataFormPanel',{
        id: 'blades-panel',
        items:[

        {
                xtype: 'cp4_container',
                items: [{
// FW Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'fw1_image',
                                        name: 'fw1_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'fw1_title',
                                        name: 'fw1_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'fw1_fields',
                                        name: 'fw1_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'fw1_chart',
                                        name: 'fw1_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 0'
                                }]
                        }]
                        
                },
                {
// IPS Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'ips_image',
                                        name: 'ips_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ips_title',
                                        name: 'ips_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ips_fields',
                                        name: 'ips_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
        
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ips_chart',
                                        name: 'ips_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// VPN Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'vpn_image',
                                        name: 'vpn_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'vpn_title',
                                        name: 'vpn_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'vpn_fields',
                                        name: 'vpn_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
        
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'vpn_chart',
                                        name: 'vpn_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// URLF Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'urlf_image',
                                        name: 'urlf_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'urlf_title',
                                        name: 'urlf_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'urlf_fields',
                                        name: 'urlf_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
        
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'urlf_chart',
                                        name: 'urlf_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// ASPM Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'aspm_image',
                                        name: 'aspm_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'aspm_title',
                                        name: 'aspm_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'aspm_fields',
                                        name: 'aspm_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'aspm_chart',
                                        name: 'aspm_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// Moblie Access Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'ma_image',
                                        name: 'ma_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ma_title',
                                        name: 'ma_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ma_fields',
                                        name: 'ma_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'ma_chart',
                                        name: 'ma_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// DLP Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'dlp_image',
                                        name: 'dlp_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'dlp_title',
                                        name: 'dlp_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'dlp_fields',
                                        name: 'dlp_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'dlp_chart',
                                        name: 'dlp_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// APPI Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'appi_image',
                                        name: 'appi_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'appi_title',
                                        name: 'appi_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'appi_fields',
                                        name: 'appi_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'appi_chart',
                                        name: 'appi_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// Anti-Bot Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'anti_bot_image',
                                        name: 'anti_bot_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'anti_bot_title',
                                        name: 'anti_bot_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'anti_bot_fields',
                                        name: 'anti_bot_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'anti_bot_chart',
                                        name: 'anti_bot_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 25'
                                }]
                        }]
                        
                },
                {
// AV Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'av_image',
                                        name: 'av_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'av_title',
                                        name: 'av_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'av_fields',
                                        name: 'av_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 100,
                                        margin: '0 0 0 25'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'av_chart',
                                        name: 'av_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 0'
                                }]
                        }]
                },
                {
// Threat Emulation Blade Section
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                },
                {
                        xtype: 'cp4_container',
                        layout: 'column',
                        items: [{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_panel',
                                        value: '',
                                        id: 'te_image',
                                        name: 'te_image',
                                        fieldLabel:'Blade',
                                        width: 75,
                                        height: 50,
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }
                                ,{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'te_title',
                                        name: 'te_title',
                                        fieldLabel: '',
                                        width: 75,
                                        height: 15,
                                        hideLabel: true,
                                        baseBodyCls: 'blade-title',
                                        labelWidth: 1,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'te_fields',
                                        name: 'te_fields',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 0'
                                }]
                        }
                        ,{
                                xtype: 'cp4_container',
                                items: [{
                                        xtype: 'cp4_displayfield',
                                        value: '',
                                        id: 'te_chart',
                                        name: 'te_chart',
                                        fieldLabel: '',
                                        width: 200,
                                        height: 70,
                                        labelWidth: 50,
                                        margin: '0 0 0 0'
                                }]
                        }]
                        
                },                
                {
                        xtype: 'menuseparator',
                        margin: '5 0 5 0'
                }]
        }
        ,{
             //inline info message
            xtype: 'cp4_inlinemsg',
            text: 'All counters are calculated since last boot.'
        }
        ,{
            xtype: 'cp4_button'
            ,text: 'Refresh'
            ,id: 'refresh'
            ,margin: '24 0 0 0'
            ,hideLabel: true
            ,disabled: false
            ,handler: function(){
                CP.Blades.init();
            }
          }]
       ,listeners: {
            render: CP.Blades.setSummary
       }
        
});

    this.initBladesTable();

    CP.Blades.page = {
        title:"Software Blades"
        ,panel: BladesPanel
        ,submit: false
        ,discard: false
        ,submitURL:"/cgi-bin/blades-summary.tcl"
        ,afterSubmit:CP.Blades.afterSubmit
        ,params:{}
    };



    CP.UI.updateDataPanel( CP.Blades.page, CP.global.monitor);
//    CP.Blades.setSummary();
},

initBladesTable:function()
{

        this.blades_table = {
//                           0          1         2              3          4             5             6
//             xml name : [index,printed name, image item, fields item, chart item, enable image, disable image ]
                 'fw':   [1,'Firewall','fw1_title','fw1_image','fw1_fields','fw1_chart','fw-on','fw-off']
                ,'vpn':  [2,'IPSec VPN','vpn_title','vpn_image','vpn_fields','vpn_chart','vpn-on','vpn-off']
                ,'ips':  [3,'IPS','ips_title','ips_image','ips_fields','ips_chart','ips-on','ips-off']
                ,'av':   [4,'Anti-Virus','av_title','av_image','av_fields','av_chart','av-on','av-off']
                ,'urlf': [5,'URL Filtering','urlf_title','urlf_image','urlf_fields','urlf_chart','urlf-on','urlf-off']
                ,'aspm': [6,'Anti-Spam and Mail','aspm_title','aspm_image','aspm_fields','aspm_chart','aspm-on','aspm-off']
                ,'dlp':  [7,'Data Loss Prevention','dlp_title','dlp_image','dlp_fields','dlp_chart','dlp-on','dlp-off']
                ,'appi': [8,'Application Control','appi_title','appi_image','appi_fields','appi_chart','app_cont-on','app_cont-off']
                ,'anti_bot': [9,'Anti-Bot','anti_bot_title','anti_bot_image','anti_bot_fields','anti_bot_chart','anti_bot-on','anti_bot-off']
                ,'cvpn': [10,'Mobile Access','ma_title','ma_image','ma_fields','ma_chart','ma-on','ma-off']
                ,'ThreatEmulation': [11,'Threat Emulation','te_title','te_image','te_fields','te_chart','te-on','te-off']
        };

},

afterSubmit:function(form, action){
    //reload the page
    CP.Blades.init();
},


setBladeItems:function(blade_data,blade_params){

        bladeName= blade_params[1]
        bladeImageItem=blade_params[3]
        blade_image=Ext.getCmp(bladeImageItem);
        bladeTitleItem=blade_params[2]
        blade_title=Ext.getCmp(bladeTitleItem);
        blade_title.setValue(bladeName);
        if (blade_data.is_enabled == 1)
        {
                bladeFieldsItem=blade_params[4]
                bladeChartsItem=blade_params[5]
                bladeImage=blade_params[6]
                if (blade_data.fields )
                {
                        fields_text = ""
                        have_fields = 0
                        for ( var lable in blade_data.fields)
                        {
                                have_fields = 1
                                fields_text = fields_text + lable + ": " + blade_data.fields[lable] + "<br/>"
                        }
                        if (have_fields == 1)
                        {
                                blade_fields=Ext.getCmp(bladeFieldsItem);
                                blade_fields.setValue(fields_text);
                        }
                }
                if (blade_data.charts )
                {
                        charts_text = ""
                        for (j = 0; j < blade_data.charts.length; j++)
                        {
                                charts_text = charts_text + blade_data.charts[j].title + "<br/>"
                                have_fields = 0
                                for ( var entry in blade_data.charts[j].chart)
                                {
                                        charts_text = charts_text + entry + ": " + blade_data.charts[j].chart[entry] + "<br/>"
                                        have_fields = 1
                                }
                                if (have_fields == 1)
                                {
                                        chart_fields=Ext.getCmp(bladeChartsItem);
                                        chart_fields.setValue(charts_text);
                                }
                        }
                }
        }
        else
        {
                bladeImage=blade_params[7]
        }
        if (blade_image)
        {
                blade_image.addCls(bladeImage);
        }
},

setSummary:function(){
    var summary;
     Ext.Ajax.request({
        url: '/cgi-bin/blades-summary.tcl'
         , method: 'GET'
         , success: function(response) {
              var blades_table = CP.Blades.blades_table;
              var jsonData = Ext.decode(response.responseText);
              if (jsonData.data) {
                if (jsonData.data.blades)
                {
                        for (i = 0; i < jsonData.data.blades.length; i++)
                        {
                                if (blades_table[jsonData.data.blades[i].name])
                                {
                                        blade_params = blades_table[jsonData.data.blades[i].name]
                                        CP.Blades.setBladeItems (jsonData.data.blades[i],blade_params)
                                }
                        }
                }
              }
         }
     })
}

}
