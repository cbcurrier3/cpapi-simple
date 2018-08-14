// Advanced Routing Utilities
CP.ar_util = {
    INSTANCE                : function() {
        //return active instance, augment once the VS selector is implemented again
        return "default";
    }

//  regular expressions for comment fields to restrict the allowed characters
    ,comment_maskRe         : /[0-9a-zA-Z\ \.\,]/
    ,comment_stripCharsRe   : /[^0-9a-zA-Z\ \.\,]/
//  regular expressions for password fields
    ,password_maskRe        : /[0-9a-zA-Z\`\~\!\@\#\%\^\&\*\(\)\{\[\}\]\:\;\,\.\_\-\+\=]/
    ,password_stripCharsRe  : /[^0-9a-zA-Z\`\~\!\@\#\%\^\&\*\(\)\{\[\}\]\:\;\,\.\_\-\+\=]/
    //list of symbol characters allowed for use in qtipText if necessary
    ,password_symbolstring  : "`~!@#*(){}[]:;,.-+="

    ,CharsRe_validator      : function(allowBlank, str, charsRe) {
        if (String(str).length == 0) {
            return (allowBlank ? true : "");
        }
        var v = String(str).replace(charsRe, "");
        if (str != v) {
            return "Restricted character found";
        }
        return true;
    }

//  renderers for grid columns
    ,rendererSpecific       : function(value, tip, align, color) {
        switch ( Ext.typeOf(value) ) {
            case "null":
            case "undefined":
                value = "&nbsp;";
                break;
            case "number":
                break;
            default:
                if (value == "") { value = "&nbsp;"; }
        }
        switch ( Ext.typeOf(tip) ) {
            case "null":
            case "undefined":
                tip = value;
                break;
            case "number":
                break;
            default:
                if (tip == "") { tip = value; }
        }
        if (!align) { align = "left"; }
        if (!color) { color = "black"; }
        if (tip == "" || tip == " " || tip == "&nbsp;") {
            /* Don't include hover over text */
            return '<div style="text-align:'+align+';color:'+color+';white-space:pre-wrap !important;">'+value+'</div>';
        } else {
            return '<div data-qtip="'+tip+'" style="text-align:'+align+';color:'+color+';white-space:pre-wrap !important;">'+value+'</div>';
        }
    }
    ,rendererGeneric        : function(value) {
        return CP.ar_util.rendererSpecific(value, value, "left", "black");
    }

//  useful functions, pass the id and if the component exists do the operation on it
    ,checkWindowClose       : function(winId) {
        var win = Ext.getCmp(winId);
        if (win && win.close) { win.close(); }
    }
    ,checkBtnsbar           : function(btnsbarId) {
        var bar = Ext.getCmp(btnsbarId);
        if (bar && bar.chkBtns) { bar.chkBtns(); }
    }
    ,checkDisabledBtn       : function(btnId) {
        var b = Ext.getCmp(btnId);
        if (b && b.handle_no_token) { b.handle_no_token(); }
    }
    ,checkFormValid         : function(formId, defaultValue) {
        if (!defaultValue) { defaultValue = false; } else { defaultValue = true; }
        var f = Ext.getCmp(formId);
        if (f) {
            if (f.isValid) {
                return ( f.isValid() );
            } else if (f.getForm) {
                var form = f.getForm();
                if (form && form.isValid) {
                    return ( form.isValid() );
                }
            }
        }
        return defaultValue;
    }
    ,isAlpha                : function(c) {
        if (!((c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z'))) {
            return 0;
        }
        return 1;
    }
    ,isAlnum                : function(c) {
        if (!(CP.ar_util.isAlpha(c) || (c >= '0' && c <= '9'))) {
            return 0;
        }
        return 1;
    }

//  complex component editing functions ////////////////////////////////////////
    ,setMaxValueLength      : function(cmpId, newMaxValue) {
        //set maxValue and update the enforced maxLength
        var c = Ext.getCmp(cmpId);
        if (c && c.setMaxValue) {
            c.setMaxValue(newMaxValue);
            c.maxLength = String(newMaxValue).length;
            if(c.enforceMaxLength && c.inputEl && c.inputEl.dom) {
                c.inputEl.dom.maxLength = c.maxLength;
            }
        }
    }

//  useful functions for saves      ////////////////////////////////////////////
    ,mySubmit                       : function() {
        //note, it pushes mySubmit to the loadList
        var no_token = CP.ar_util.checkBlockActivity(false);
        if (!no_token) {
            CP.ar_util.loadListPush("mySubmit");
            CP.UI.applyHandler( CP.UI.getMyObj() );
        }
    }
    ,getParams                      : function() {
        //clear params and return reference
        var myObj = CP.UI.getMyObj();
        if (myObj) {
            return (myObj.params);
        }
        return false;
    }
    ,clearParams                    : function() {
        //clear params and return reference
        var myObj = CP.UI.getMyObj();
        if (myObj) {
            myObj.params = {};
            return (myObj.params);
        }
        return false;
    }
//  find interface that uses the passed IP  ////////////////////////////////////
    ,getInterfaceByIp               : function(st, testIp) {
        //assume testIp is a valid ipv4 or ipv6
        //requires the passed store st to have fields intf, addr4_list and addr6_list
        if (st) {
            var recs = st.getRange();
            var o, i, j, l, a;
            var ip = String(testIp);
            var type = (ip.indexOf(".") > -1) ? "4" : "6";
            if (type == "6") {
                ip = CP.ip6convert.ip6_2_db(ip);
                ip = CP.ip6convert.db_2_ip6(ip);
            } else {
                o = ip.split(".");
                for(i = 0; i < o.length; i++) {
                    o[i] = String( parseInt(o[i], 10) );
                }
                ip = o.join(".");
            }
            for(i = 0; i < recs.length; i++) {
                if (type == "6") {
                    l = recs[i].data.addr6_list;
                } else {
                    l = recs[i].data.addr4_list;
                }
                for(j = 0; j < l.length; j++) {
                    if (type == "6") {
                        a = l[j].addr6;
                    } else {
                        a = l[j].addr4;
                    }
                    if (a == ip) {
                        return String(recs[i].data.intf);
                    }
                }
            }
        }
        return false;
    }

//  REGEX conversion tools  ////////////////////////////////////////////////////
    ,REGEX_SPECIAL_SET              : "()[]{}*+?|,._-^$\\ "
    ,REGEX_REPLACED_SET             : "abcdefghijklmnopqrstuvwxyz"
    ,DB_to_REGEX                    : function(db) {
        var retValue = String(db);
        var r, i;
        for(i = 0; i < CP.ar_util.REGEX_SPECIAL_SET.length; i++) {
            r = RegExp( CP.ar_util.REGEX_REPLACED_SET.charAt(i) ,"g" );
            retValue = retValue.replace( r, CP.ar_util.REGEX_SPECIAL_SET.charAt(i) );
        }
        return retValue;
    }
    ,REGEX_to_DB                    : function(regex) {
        var retValue = String(regex);
        var r, i;
        for(i = 0; i < CP.ar_util.REGEX_SPECIAL_SET.length; i++) {
            r = RegExp( "\\" + CP.ar_util.REGEX_SPECIAL_SET.charAt(i) ,"g" );
            retValue = retValue.replace( r, CP.ar_util.REGEX_REPLACED_SET.charAt(i) );
        }
        return retValue;
    }

    ,REGEX_lookUp                   : function(regexStr, lookUpEl, splitEl) {
        switch( Ext.typeOf(splitEl) ) {
            case "undefined":
            case "null":
                return -1;
            case "string":
                if (splitEl == "") {
                    splitEl = " ";
                }
                break;
            default:
        }
        if (!splitEl) { splitEl = " "; }
        switch( Ext.typeOf(lookUpEl) ) {
            case "undefined":
            case "null":
                return -1;
            case "string":
                if (lookUpEl == "") {
                    return -1;
                }
                break;
            default:
        }
        if (!lookUpEl) { return -1; }
        var regexList = String(regexStr).split(splitEl);
        return ( Ext.Array.indexOf(regexList, lookUpEl) );
    }
    ,REGEX_cleanUp                  : function(regexStr, splitEl) {
        switch( Ext.typeOf(splitEl) ) {
            case "null":
            case "undefined":
                splitEl = "";
                break;
            default:
                splitEl = String(splitEl);
                if (splitEl == "") {
                    splitEl = " ";
                }
        }
        regexStr = CP.ar_util.REGEX_removeDoubleWS(regexStr);
        regexStr = CP.ar_util.REGEX_removeAlpha(regexStr, false);
        var regexList = regexStr.split(" ");
        var i;
        var t;
        var o = [];
        for(i = 0; i < regexList.length; i++) {
            //t = CP.ar_util.REGEX_removeLeadingZeros( regexList.charAt(i) );
            t = String(regexList.charAt(i));
            if (t != "") {
                o.push( String(t) );
            }
        }
        return ( Ext.String.trim( o.join(" ") ) );
    }
    ,REGEX_removeDoubleWS           : function(str) {
        var r = RegExp("  ", "g");
        str.replace(r, " ");
        return str;
    }
    ,REGEX_removeAlpha              : function(str, hex) {
        var r;
        var i = 6;
        if (!hex) { i = 0; }
        for(i; i < CP.ar_util.REGEX_REPLACED_SET.length; i++) {
            r = RegExp(CP.ar_util.REGEX_REPLACED_SET.charAt(i), "gi");
            str = str.replace(r, "");
        }
        return str;
    }
    ,REGEX_removeLeadingZeros       : function(str) {
        //remove leading zeros
        //only removes leading zeros if the str is just a number.
            // 00502 -> 502
            // (00502) doesn't get changed
        var s = String(str);
        if ( s == "") { return ""; }
        if ( isNaN(s) ) { return s; }
        var v = parseInt(s, 10);
        if ( isNaN(v) ) { return ""; }
        return String(v);
    }
    ,convertToASDotSimple            : function(value) {
        /* Converts the given ASPLAIN/ASDOT value into ASDOT simplified.
         * This means that if the given value is less than 65536, the ASPLAIN value
         * is returned. Otherwise, the ASDOT value is returned.
         *
         * Assumes valid input
         */

        if (value.indexOf('.') != -1) {
            var parts = value.split('.');
            if (parts[0] == "0") {
                return parts[1];
            } else {
                return value;
            }
        } else {
            var leftas = (value / 65536) | 0; // returns the integer part
            var rightas = value - (leftas * 65536);
            if (leftas == 0) {
                return rightas;
            } else {
                return ("" + leftas + "." + rightas);
            }
        }
    }
    ,validateConvertToPlain        : function(value) {
        /* Validates the given ASPlain/ASDot value. Returns the ASPLAIN value and error string
         * [covertedValue, errorString]
         * - covertedValue: the ASPLAIN value of the given value. -1 if error
         * - errorString: error string associated if convertedValue is -1
         */

        /* Don't allow empty values */
        if (value == "") {
            return [-1, "This field is required. Enter a valid ASPLAIN or ASDOT number."];
        }

        /* Don't allow negative numbers */
        if (value.indexOf('-') != -1) {
            return [-1, "Negative numbers are not allowed."];
        }

        /* Don't allow spaces */
        if (value.indexOf(' ') != -1) {
            return [-1, "Spaces are not allowed."];
        }

        dot = value.indexOf('.');
        if (dot != -1) { /* AS DOT */
            var ases = value.split('.');
            var numAs = ases.length;
            var leftAS, rightAS;

            /* Missing AS before dot */
            if (numAs < 2) {
                return [-1, "Missing arguments."];
            }

            /* Too many dots */
            if (numAs > 2) {
                return [-1, "Too many dots."];
            }

            if (ases[0] == "") {
                return [-1, "Missing number before the dot."];
            }
            if (ases[1] == "") {
                return [-1, "Missing number after the dot."];
            }

            /* Convert and verify the AS numbers */
            leftAS = Number(ases[0]);
            if (isNaN(leftAS)) {
                return [-1, (ases[0] +" is not a number.")];
            }
            if ((leftAS < 0) || (leftAS > 65535)) {
                return [-1, (leftAS +" is not in the range 0-65535.")];
            }
            rightAS = Number(ases[1]);
            if (isNaN(rightAS)) {
                return [-1, (ases[1] +" is not a number.")];
            }
            if ((rightAS < 0) || (rightAS > 65535)) {
                return [-1, (rightAS +" is not in the range 0-65535.")];
            }
            if (leftAS == 0 && rightAS == 0) { 
                return [-1, "0.0 is an invalid AS number."];
            }

            /* Passed all AS DOT tests */
            var asplain = (leftAS * 65535) + (rightAS + leftAS);
            return [asplain, ""];
        } else { /* Treat as AS PLAIN notation */
            var asnum = Number(value);

            /* Convert and verify the AS number */
            if (isNaN(asnum)) {
                return [-1, "Not a number."];
            }
            if ((asnum < 1) || (asnum > 4294967295)) {
                return [-1, (asnum +" is not valid. Must be a number in the range 1-4294967295.")];
            }

            /* Passed all AS PLAIN tests */
            return [asnum, ""];
        }
    }
    /*
    //TODO - too hard to justify spending more time on right now
    ,checkValidASPath               : function(regexStr) {
        if (regexStr.indexOf("  ") != -1) {
            return "AS Path may not contain consecutive whitespace.";
        }
        if (regexStr.charAt(0) == " ") {
            return "AS Path may not begin with whitespace.";
        }
        if (regexStr.charAt(regexStr.length - 1) == " ") {
            return "AS Path may not end with whitespace.";
        }
        if (regexStr.indexOf("(|

        var comments = 0;
        var orFront = 0;
        var orBack = 1; //pretend there is an OR before the regex
        //to correctly identify:  "| 5" as incorrect.
        var numSym = /[0-9][\ \[\]\(\)\*\+\?\|\.\-\^]/;
        var symNum = /[\ \[\]\(\)\*\+\?\|\.\-\^][0-9]/;
        var ns, sn;
        var i, n, o;
        var vList = regexStr.split(" ");
        for(i = 0; i < vList.length; i++) {
            if (orFront > 1) {
                
            }
            orFront = orBack; // remember last count
            orBack = 0; //?
            n = String(vList[i]);
            while(n.length > 0 && (n.charAt(0) == "|" || n.charAt(0) == "(") ) {
                switch( n.charAt(0) ) {
                    case "(":
                        comments++;
                        orSym = 0;
                        break;
                    case "|":
                        orFront++;
                        break;
                    default:
                        //??
                }
                n = n.slice(1);
            }
            if (orFront > 1) {
                return "Consecutive or symbols (|).";
            }
            while(n.length > 0 && (n.charAt(n.length - 1) == "|" || n.charAt(n.length - 1) == ")") ) {
                switch( n.charAt(n.length - 1) ) {
                    case ")":
                        comments--;
                        if (comments < 0) {
                            return "Invalid parentheses.";
                        }
                        break;
                    case "|":
                        orBack ++;
                        
                        break;
                    default:
                }
                n = n.slice(0, -1);
            }
            
            
        }

        if (comments > 0) {
            return "Invalid parentheses.";
        }
        return true;
    }
    // */

//  debuggable user access control  ////////////////////////////////////////////
    // CP.ar_util.loadListPush( ajaxId )    - add this string to the list (if not already included)
    // CP.ar_util.loadListPop( ajaxId )     - remove all cases of this string in the list
    // CP.ar_util.callChkCmpState()         - call the registered function (called as part of the push and pop)
    // CP.ar_util.checkBlockActivity( ignoreLoadList )
    //                                      - return false if nothing is inhibiting user write permission
    ,loadList               : []
    ,loadListLength         : function() {
        if (Ext.typeOf(CP.ar_util.loadList) != "array") {
            CP.ar_util.loadList = [];
        }
        return (CP.ar_util.loadList.length);
    }
    ,loadListPush           : function(loadEl) {
        if ( Ext.typeOf(CP.ar_util.loadList) != "array" ) {
            CP.ar_util.loadList = [];
        }
        if ( Ext.typeOf(loadEl) == "string" ) {
            Ext.Array.include( CP.ar_util.loadList, String(loadEl).toLowerCase() );
        }
        CP.ar_util.callChkCmpState();
    }
    ,loadListPop            : function(loadEl) {
        if ( Ext.typeOf(CP.ar_util.loadList) != "array" ) {
            CP.ar_util.loadList = [];
        }
        if ( Ext.typeOf(loadEl) == "string" ) {
            while (Ext.Array.indexOf( CP.ar_util.loadList, String(loadEl).toLowerCase() ) != -1) {
                CP.ar_util.loadList = Ext.Array.remove( CP.ar_util.loadList, String(loadEl).toLowerCase() );
            }
        }
        CP.ar_util.callChkCmpState();
    }
    ,callChkCmpState        : function() {
        //check if there is a registered function to activate the various handle functions
        var pgObj;
        if (CP.UI && CP.UI.pageObj) {
            pgObj = CP.UI.pageObj;
            if (pgObj.obj && Ext.typeOf(pgObj.obj.checkCmpState) == "function") {
                pgObj.obj.checkCmpState();
            }
        }
    }

    ,blockActivity_ReadOnly : function() {
        if (CP.UI && CP.UI.accessMode) {
            return (CP.UI.accessMode != "rw");
        }
        return true;
    }
    ,blockActivity_NoToken  : function() {
        if (CP.global && CP.global.token) {
            return (CP.global.token < 1);
        }
        return true;
    }
    ,blockActivity_Cluster  : function() {
        var obj = CP.UI.getMyObj();
        return (obj && obj.disabled_by_clustering);
    }
    ,checkBlockActivity     : function(ignore_loads) {
        if (!ignore_loads) { ignore_loads = false; }
        if (!ignore_loads && CP.ar_util.loadListLength() > 0) {
            return true;
        }
        return (CP.ar_util.blockActivity_ReadOnly() ||
                CP.ar_util.blockActivity_NoToken() ||
                CP.ar_util.blockActivity_Cluster());
    }

    //wrapper for Ext.Number.toFixed to ensure the parameters are (number, int)
    ,safeToFixed            : function(inp, precision) {
        switch(Ext.typeOf(precision)) {
            case "number":
                precision = parseInt(precision, 10);
                break;
            default:
                precision = 0;
        }
        switch(Ext.typeOf(inp)) {
            case "number":
                break;
            case "string":
                inp = parseInt(inp, 10);
                break;
            default:
                inp = 0;
        }
        inp = Ext.Number.toFixed(inp, precision);
        return inp;
    }

    // wrapper for obj.setDisabled() that also takes into account
    // our own checkBlockActivity() logic.
    ,safeSetDisabled: function(obj, val) {
        val = val || CP.ar_util.checkBlockActivity(true);
	if (val != obj.isDisabled())
            return(obj.setDisabled(val));
    }
}

