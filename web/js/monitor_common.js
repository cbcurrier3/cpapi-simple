// A placeholder for monitor page
CP.IfMonitorCommon = {

init: function() {
    var MonitorCommonPanel = new CP.WebUI.DataPanel({
          id:"maint-summary-panel"
          ,height:400
    });

    var page = {
        title:"Monitor"
        ,panel: MonitorCommonPanel
        ,submit:false
        ,params:{}
    };

    CP.UI.updateDataPanel(page, CP.global.monitor);
}

}
