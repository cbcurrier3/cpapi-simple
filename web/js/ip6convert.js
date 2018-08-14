CP.ip6convert = {
    get_v6masklength    : function(addrIn) {
        var addr = String(addrIn).toLowerCase();
        if(addr.indexOf(":") != -1) {
            addr = CP.ip6convert.ip6_2_db(addr);
        }
        //addr is in db form
        var i;
        for(i = 31; i >= 0 && addr.charAt(i) == "0"; i--);
        var a_bin = parseInt(addr.charAt(i), 16);
        if(a_bin & 0x1) {
            return 4*(i+1);
        } else if(a_bin & 0x2) {
            return 4*(i+1) - 1;
        } else if(a_bin & 0x4) {
            return 4*(i+1) - 2;
        } else if(a_bin & 0x8) {
            return 4*(i+1) - 3;
        }
        return 0;
    }

    ,db_2_ip6       : function(dbAddr, minGroupCount, firstPossibleOmission) {
        //returns address in ipv6 notation with a grouping factor based on minGroupCount
        if(!minGroupCount) { minGroupCount = 2; }
        if(!firstPossibleOmission) { firstPossibleOmission = 1; }
        firstPossibleOmission--; //adjust for array numbering
        dbAddr = String(dbAddr).toLowerCase().slice(0,32);
        var i;
        var tuple = [];
        for( i = 0 ; i < 8 ; i++ ) {
            tuple[i] = dbAddr.slice( i*4, (i*4) + 4 );
            while(tuple[i].charAt(0) == 0 && tuple[i].length > 1) {
                tuple[i] = tuple[i].slice(1);
            }
        }

        var gList = []; var g = 1;      var cList = [];
        var c = 0;      var highC = 0;  var highG = 0;
        for( i = 0 ; i < 8 ; i++ ) {
            if(i < firstPossibleOmission || tuple[i] != "0") {
                g++;            c = 0;  gList[i] = 0;       cList[i] = 0;
            } else {
                gList[i] = g;   c++;                        cList[i] = c;
            }
            if(highC < c) {
                highC = c;          highG = g;
            }
        }

        var retval = "";
        for( i = 0 ; i < 8 ; i++ ) {
            if(gList[i] == highG && gList[i] != "0" && highC >= minGroupCount) {
                tuple[i] = "";
                if(i == 0) {
                    if(highC > 1) {
                        retval = String(retval) +":";
                    } else {
                        retval = String(retval) +"0";
                    }
                }
                if (cList[i] == highC) {
                    retval = String(retval) +":";
                }
            } else {
                retval = String(retval) + String(tuple[i]);
                if(i < 7) {
                    retval = String(retval) +":";
                }
            }
        }
        return retval;
    }

    ,ip6_2_db           : function(ip6Addr) {
        //returns address in 32 digit form with no separators
        ip6Addr = String(ip6Addr).toLowerCase();
        var h = "";
        var t = "";
        var padding = "";
        var mid = 0;
        var len = 0;
        var i;
        var noEmpty = true;
        var tuple = ip6Addr.split(":");

        for( i = 0 ; i < tuple.length ; i++ ) {
            if(tuple[i] != "") {
                tuple[i] = String("0000" + tuple[i]).slice(tuple[i].length);
                //tuple[i] = tuple[i].slice(tuple[i].length - 4);

                if(noEmpty) {
                    h = String(h) + tuple[i];
                } else {
                    t = String(t) + tuple[i];
                }
                len++;
            } else {
                if(noEmpty) {
                    noEmpty = false;
                } else {
                    t = String(t) +"0000";
                    len++;
                }
            }
        }

        for( ; len < 8 ; len++ ) {
            padding = String(padding) +"0000";
        }

        return h + padding + t;
    }

    ,parse_ip6          : function(ip6AddrMask) {
        //returns an object = { address , masklength }
        return ip6AddrMask.split("/");
    }
}

