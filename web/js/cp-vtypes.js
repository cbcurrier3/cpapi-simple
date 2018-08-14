/**
 * Contains a set of commonly used field validations.
 * Based on RFC952 and RFC1123
 */


//Overrides getErrors function for TextField to add the following condition:
//if value is blank and allowBlank is true, there cannot be any additional errors.
//Otherewise, when testing the regex it will returns false.
//This bug was fixed for later versions
Ext.override( Ext.form.TextField, {
    getErrors: function(value) {
        var errors = Ext.form.TextField.superclass.getErrors.apply(this, arguments);
        
        value = value || this.processValue(this.getRawValue());
        
        if(Ext.isFunction(this.validator)){
            var msg = this.validator(value);
            if (msg !== true) {
                errors.push(msg);
            }
        }
        
        //Add another condition for allowBlank
        if (value.length < 1 || value === this.emptyText) {
            if (this.allowBlank) {
                // if value is blank and allowBlank is true, there cannot be any additional errors
                return errors;
            } else {
                errors.push(this.blankText);
            }
        }
        
        if (!this.allowBlank && (value.length < 1 || value === this.emptyText)) { // if it's blank
            errors.push(this.blankText);
        }
        
        if (value.length < this.minLength) {
            errors.push(String.format(this.minLengthText, this.minLength));
        }
        
        if (value.length > this.maxLength) {
            errors.push(String.format(this.maxLengthText, this.maxLength));
        }
        
        if (this.vtype) {
            var vt = Ext.form.VTypes;
            if(!vt[this.vtype](value, this)){
                errors.push(this.vtypeText || vt[this.vtype +'Text']);
            }
        }
        
        if (this.regex && !this.regex.test(value)) {
            errors.push(this.regexText);
        }
        
        return errors;
    }
});


//Global rules
var cpVTypes_ipv4Rule = /^(([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]{1,3})\.)+(([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]{1,3})\.)+(([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]{1,3})\.)+([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]{1,3})$/; 

//Apply vtypes
Ext.apply( Ext.form.VTypes,{
    
    /* ~~~ @@ Hostname
     * Hostname labels may contain only the ASCII letters a-z, A-z, the digits 0-9, and the hyphen ('-'). 
     * Labels could not start with a hyphen, and must not end with a hyphen. 
     * Each label must be between 1 and 63 characters long, and the entire hostname (including the delimiting dots) has a maximum of 255 characters.
     * Permitted hostname labels to start with digits. 
     * No other symbols, punctuation characters, or white space are permitted.
     * Hostname field can also contain an IPv4 address.
     * e.g. comp.checkpoint.com, 172.16.254.1
     */
    hostname: function( val ){
        var hostNameRule = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])((\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))|)+$/;
        var isValidHost = hostNameRule.test( val );
        var isValidIp = cpVTypes_ipv4Rule.test( val );
        if( isValidHost == false && isValidIp == false ){
            return false;
        }
        else{
            return true;
        }
    },
    hostnameText: 'Name must consist of alphanumerics, numbers, "-", and "."',
    hostnameMask: /[\.\-a-zA-Z0-9]/,

    wildhostname: function( val ){
    	var wildIPv4Rule = /^(([1-9\*]{0,1}[0-9\*]|1[0-9\*]{2}|2[0-4\*][0-9\*]|25[0-5\*]{1,3})\.)+(([1-9\*]{0,1}[0-9\*]|1[0-9\*]{2}|2[0-4\*][0-9\*]|25[0-5\*]{1,3})\.)+(([1-9\*]{0,1}[0-9\*]|1[0-9\*]{2}|2[0-4\*][0-9\*]|25[0-5\*]{1,3})\.)+([1-9\*]{0,1}[0-9\*]|1[0-9\*]{2}|2[0-4\*][0-9\*]|25[0-5\*]{1,3})$/; 
    	var wildHostnameRule = /^([a-zA-Z0-9\*]|[a-zA-Z0-9\*][a-zA-Z0-9\-\*]{0,61}[a-zA-Z0-9\*])((\.([a-zA-Z0-9\*]|[a-zA-Z0-9\*][a-zA-Z0-9\-\*]{0,61}[a-zA-Z0-9\*]))|)+$/;
    	var isValidHost = wildHostnameRule.test( val );
    	var isValidIp = wildIPv4Rule.test( val );
    	if( isValidHost == false && isValidIp == false ){
    		return false;
    	}
    	else{
    		return true;
    	}
    },
    wildhostnameText: 'Name must consist of alphanumerics, numbers, "-", "*" and "."',
    wildhostnameMask: /[\*\.\-a-zA-Z0-9]/,

    
    /* ~~~ @@ IPv4 Address
     * IPv4 addresses are represented in dot-decimal notation, 
     * which consists of four decimal numbers, each ranging from 0 to 255, separated by dots.
     * e.g. 172.16.254.1
     */
    ipv4: function( val ){
        return cpVTypes_ipv4Rule.test( val );
    },
    ipv4Text: '1.0.0.0 - 255.255.255.254',
    ipv4Mask: /[\d\.]/i,
    
    
    /* ~~~ @@ IPv6 Address
     * An IPv6 address is represented by 8 groups of 16-bit hexadecimal values separated by colons (:).
     * The hexadecimal digits are case-insensitive.
     * The 128-bit IPv6 address can be abbreviated with the following rules:
     * Rule one: Leading zeroes within a 16-bit value may be omitted.
     * Rule two: A single occurrence of consecutive groups of zeroes within an address may be replaced by a double colon.
     * e.g. 2001:0db8:85a3:0000:0000:8a2e:0370:7334
     */
    ipv6: function( val ){
        var ipv6Rule = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
        return ipv6Rule.test( val );
    },
    ipv6Text: 'Please enter a valid IPv6 address: 8 groups of 16-bit hexadecimal values separated by colons (:)',
    ipv6Mask: /[a-fA-F0-9\:]/i,
    
    
    /* ~~~ @@ MAC Address
     * The format for printing MAC-48 addresses is six groups of two hexadecimal digits, 
     * separated by hyphens (-) or colons (:), in transmission order. 
     * Or three groups of four hexadecimal digits separated by dots (.), in transmission order.
     * e.g. 01-23-45-67-89-ab, 01:23:45:67:89:ab
     */
    mac: function( val ){
        var macRule = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/i;
        return macRule.test( val );
    },
    macText: '0:0:0:0:0:0 - FF:FF:FF:FF:FF:FF',
    macMask: /[a-fA-F0-9\:]/i,
    
    
    /* ~~~ @@ Netmask
     * The modern standard form of specification of the network prefix counts the number of bits in the prefix 
     * and appends that number to the address with a slash (/) separator:
     * 192.168.0.0, netmask 255.255.0.0 is written as 192.168.0.0/16
     * e.g. 255.255.255.0
     */
    netmask: function( val ){
        var netmaskRule = /^(128|192|224|24[08]|25[245].0.0.0)|(255.(0|128|192|224|24[08]|25[245]).0.0)|(255.255.(0|128|192|224|24[08]|25[245]).0)|(255.255.255.(0|128|192|224|24[08]|252))$/;
        return netmaskRule.test( val );
    },
    netmaskText: '128.0.0.0 - 255.255.255.252',
    netmaskMask: /[.0-9]/i,
    
    
    /* ~~~ @@ Port
     * Port matches numbers in range of 0 through 65535.
     * e.g. 4433
     */
    port: function( val ){
        var portRule = /^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
        return portRule.test( val );
    },
    portText: '0 - 65535',
    portMask: /[0-9]/,
    
    
    /* ~~~ @@ Multicast Address
     * The CIDR prefix of this group is 224.0.0.0/4. 
     * The group includes the addresses from 224.0.0.0 to 239.255.255.255. 
     * e.g. 239.255.255.255
     */
    multicast: function( val ){
        var multicastRule = /^((22[5-9]|23[0-9])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(224[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2})|(224[.]0[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))$/;
        return multicastRule.test( val );
    },
    multicastText: '224.0.0.0 - 239.255.255.255',
    multicastMask: /[.0-9]/,
    
    
    /* ~~~ @@ Username
     * Username must begin with a letter, and can contains alphanumeric chars,
     * underscores (_), hyphens (-), or dots (.), with a maximum length of 32 characters.  
     * e.g. john.doe, w3usr
     */
    username: function( val ){
        var unRule = /^[a-zA-Z][-_.a-zA-Z0-9]{0,31}$/;
        return unRule.test( val );
    },
    usernameText: 'Username must begin with a letter and cannot exceed 32 characters. Please use alphanumerics, "-", "_", and "."',
    usernameMask: /[-_.a-zA-Z0-9]/,
    
    
    /* ~~~ @@ Password
     * Password must be between 6 and 19 characters long.
     * It can contains numbers, alphanumeric and special chars !@#$%^&*()-_=+:; but spaces are not allowed.   
     * e.g. g670-U9
     */
    password: function( val ){
        var pwdRule = /^([a-zA-Z0-9!@#\$%\^&\*\(\)\-_=\+:;].{5,18})$/;
        return pwdRule.test( val );
    },
    passwordText: 'Password must be between 6 and 19 characters long. Please use numbers, alphanumeric and special chars !@#$%^&*()-_=+:;',
    passwordMask: /./,


    /* ~~~ @@ rolename
     * A Role name must start with a letter, and can contain alphanumeric 
     * chars, underscores (_) or hyphens (-), with a maximum length of 199.
     */
    rolename: function(val, field) {
        return /^[A-Za-z][-0-9a-zA-Z_]{0,199}$/.test(val);
    },
    rolenameText: ('Not a valid role name.  Must begin with a letter,'+
                   ' and may contain letters, numbers, and dashes. '+
                   ' May be up to 199 characters long.'),
    rolenameMask: /[-0-9a-zA-Z_]/,

 
    /* ~~~ @@ Minutes
     * Minutes value must be a two-digit integer between 00 and 59
     * e.g. 10
     */
    minutes: function( val ){
        var minutesRule = /^([0-5][0-9])$/;
        return minutesRule.test( val );
    },
    minutesText: 'Minutes value must be a two-digit integer between 00 and 59',
    minutesMask: /\d/,

    
    /* ~~~ @@ Hours 12
     * 12-hours format: hours value must be a one or two-digit integer between 1 and 12
     * e.g. 01, 1, 10
     */
    hours12: function( val ){
        var h12Rule = /^([1-9]|[0][0-9]|[1][0-2])$/;
        return h12Rule.test( val );
    },
    hours12Text: 'Hours value must be an integer between 1 and 12',
    hours12Mask: /\d/,
    
    
    /* ~~~ @@ Hours 24
     * 24-hours format: hours value must be a one or two-digit integer between 1 and 23
     * e.g. 01, 1, 10, 19
     */
    hours24: function( val, field ){
        var h24Rule = /^([1-9]|[0][0-9]|[1][0-9]|[2][0-3])$/;
        return h24Rule.test( val );
    },
    hours24Text: 'Hours value must be an integer between 1 and 23',
    hours24Mask: /\d/,
    
    
    /* ~~~ @@ Positive Integer
     * Any whole number greater than zero
     * e.g. 105
     */
    posint: function( val ){
        var piRule = /^[1-9](\d+|)$/; 
        return piRule.test( val );
    },
    posintText: 'Must be an integer greater than 0',
    posintMask: /\d/,

    
    /* ~~~ @@ Email
     * Must begin with a letter then alfanumeric or number and a . or _ or -, then @, and after that
     * name begin with a letter, dot, and letters.
     * e.g. user.name@company.com
     */
    email: function( val ){
        var emailRule = /^[a-zA-Z]([a-zA-Z0-9]|[_\-\.]{1}[a-zA-Z0-9])+([a-zA-Z0-9]+)@[a-zA-Z0-9]([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,255})$/;
        return emailRule.test( val );
    },
    emailText: 'Please enter a valid e-mail address, for example: user@company.com',
    emailMask: /[-_.@a-zA-Z0-9]/,

        
    /* ~~~ @@ Directory Path
     * Must sart with slash (/) then alfanumeric or number and a dot or an hyphen
     * e.g. /home/user-dir2/ddd.dd
     */
    path: function( val ){
        var pathRule = /^(\/[a-zA-Z0-9]([a-zA-Z0-9]|[\-\.]{1}[a-zA-Z0-9])+)+$/;
        return pathRule.test( val );
    },
    pathText: 'Must sart with slash then alfanumeric or number and a dot or an hyphen',
    pathMask: /[-_.a-zA-Z0-9\/]/

});
