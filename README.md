# cpapi-simple
A simple html file and python file that leverage Check Points Management API to create access rules. R80.10

Written by CB Currier ccurrier@checkpoint.com
8/14/18

Setup notes:

httpd.conf example of settings you will need:
	<IfModule mime_module>
		 AddHandler cgi-script .py
	</IfModule>
	<IfModule alias_module>
		 ScriptAlias /simple/bin "/var/www/html/simple/bin"
	</IfModule>
	<Directory "/var/www/html/simple/bin">
	    AllowOverride None
	    Options +ExecCGI 
	    Require all granted
	</Directory>

Also be sure your machine has access to your SmartCenter or MDM.

Paths in page are relative.
Finally, in bin/add-rule-helper.py set credentials and SmartCenter / MDM address and port.

server='192.168.1.100'
muser='apiuser'
mpass='CProcks'
mport='443'
domain='Default'
session=''


