//check what is the real version of IE
if( Ext.isIE && document.documentMode == 8 ){
    Ext.isIE8 = true;
    Ext.isIE6 = false;
}

//When using IE9 with Ext 3 treepanel failed to attach events.
//Add this temporary fix (until Ext 4).
//Ext.isIE=true causing all problems
if (Ext.isIE6 && /msie 9/.test(navigator.userAgent.toLowerCase())) {
    Ext.isIE6 = Ext.isIE = false;
    Ext.isChrome = Ext.isIE9 = true;
}