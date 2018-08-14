
CP.Dns = {

init: function() {
    var dnsPanel = new CP.WebUI.DataFormPanel({
          id:"dns-panel"
          ,items: [{
              xtype: 'cp_textfield'
              ,fieldLabel:'Domain Name'
              ,name:'domain'
              ,allowBlank:true
              ,emptyText:'Domain name'
              ,invalidText:'Invalid domain name.'
              ,maxlLength:255
              ,vtype:'hostname'
          }, {
              xtype: 'cp_ipv4textfield'
              ,fieldLabel: 'Primary Server'
              ,name: 'primary'
              ,allowBlank: true
              ,maxlLength: 255
          }, {
              xtype: 'cp_ipv4textfield'
              ,fieldLabel: 'Secondary Server'
              ,name: 'secondary'
              ,allowBlank: true
              ,maxlLength: 255
          }, {
              xtype: 'cp_ipv4textfield'
              ,fieldLabel: 'Tertiary Server'
              ,name: 'tertiary'
              ,allowBlank: true
              ,maxlLength: 255
          }],
          listeners: {
              render: CP.Dns.doLoad
          }
    });

    var page = {
        title:"DNS"
        ,panel: dnsPanel
        ,submit:true
        ,submitURL:"/cgi-bin/dns.tcl"
        ,params:{}
    }

    CP.UI.updateDataPanel(page);
},

doLoad: function(formPanel) {
    formPanel.load({
        url: '/cgi-bin/dns.tcl',
        method: 'GET'
    });
},

doApply: function() {
    Ext.Msg.alert('apply', 'clicked');
}

}
