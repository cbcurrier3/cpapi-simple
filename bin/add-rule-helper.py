#!/usr/bin/env python 

import os, sys, argparse, json, cgi, cgitb, urllib, string, requests, urllib3, datetime, time

from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

server='192.168.10.100'
muser='apiuser'
mpass='CPr0cks!'
mport='443'
domain='Default'
session=''

cgitb.enable()

# get the info from the html form
form = cgi.FieldStorage()
#set up the html stuff
print "Content-Type:application/json\n\n"

def api_call(ip_addr, port, command, json_payload, sid):
    url = 'https://' + ip_addr + ':' + port + '/web_api/' + command
    if sid == '':
        request_headers = {'Content-Type' : 'application/json'}
    else:
        request_headers = {'Content-Type' : 'application/json', 'X-chkp-sid' : sid}
    r = requests.post(url, data=json.dumps(json_payload), headers=request_headers, verify=False)
    return r.json()


def login(server, sport, user, password, dmain):
    sessnam = user+'_{:%Y%b%d%H%M%S}'.format(datetime.datetime.now())
    if (dmain != 'Default' ):
    	payload = {'user' : user, 'password' : password, 'domain' : dmain , 'session-name' : sessnam }
    else:
    	payload = {'user' : user, 'password' : password , 'session-name' : sessnam }

    response = api_call(server, sport, 'login', payload, '')
    return response["sid"]

def simple_add(server, sport, sessid, ipadd): 
	sid=str(sessid)
	nname='host_'+ipadd
	#see if IP exists
	myobjects=[]
	payld = { "limit" : "500", "offset" : "0", "order" : [{ "ASC" : "name" }], "type" : "host", "filter" : ipadd, "ip-only" : "true" }
	results = api_call(server, sport , 'show-objects', payld , sid ) 
#	print results
	fresults = results["objects"]
	i=0
	for objs in fresults:
	   i += 1
	   oname = str(objs["name"])
	   myobjects.append({ 'oname' : oname })

	if i == 0: # add host
	     shost={ "ipv4-address" : ipadd , "name" : nname }
	     reslt = api_call(server, sport, 'add-host', shost, sid )
	     try:
	         reslt["message"]
	     except KeyError:
	         return reslt["name"]
	     else:
	         return reslt["message"]
	else: # host exists
	     return oname

def logout(server, sport, sid, pub):
    payload = {}
    if ( pub == "yes" ):
      api_call(server, sport, 'publish', payload, sid)

    time.sleep(2)
    api_call(server, sport, 'discard', payload, sid)
    time.sleep(2)
    api_call(server, sport, 'logout', payload, sid )

session = login(server, mport, muser, mpass, domain)
try:
   form["what"]
except KeyError:
   pass
else:

    if ( form["what"].value == "hosts" ):
	#myhosts=dict()
	myhosts=[]
	payld = { "limit" : "500", "offset" : "0", "details-level" : "standard" }
	results = api_call(server,  mport, 'show-hosts', payld, session )
	fresults = results["objects"]
	i=0
	for hosts in fresults:
	   i += 1
	   ahost = str(hosts["ipv4-address"])
	   bhost = str(hosts["name"])
	   nhost = 'host'+str(i)
	   myhosts.append({'ipv4-address':ahost,'name':bhost})
	print json.dumps(myhosts)

	logout(server, mport, session, "no")

    elif ( form["what"].value == "services" ):
	myports=[]
	payld = { "limit" : "500", "offset" : "0", "details-level" : "standard" }
	results = api_call(server, mport, 'show-services-tcp', payld, session ) 
	fresults = results["objects"]
	i=0
	for ports in fresults:
	   i += 1
	   aport = str(ports["name"])
	   bport = str(ports["port"])
	   nport = 'host'+str(i)
	   myports.append({ 'sname' : aport , 'sport' : bport })
	print json.dumps(myports, indent=4, sort_keys=True )

	logout(server, mport, session, "no")

    elif ( form["what"].value == "addhost" ):
	ihost = str(form["ipv4"].value)
	nhost = str(form["name"].value)
	myhosts={ "ipv4-address" : ihost , "name" : nhost }
	results = api_call(server, mport, 'add-host', myhosts, session )
	try:
	    results["message"]
	except KeyError:
	    print '<p><code>',json.dumps(results,indent=4, sort_keys=True),'</code></p>'
	else:
	    print '<p><code>',results["message"],'</code></p>\n'

	logout(server, mport, session, "yes")

    elif ( form["what"].value == "sendrule"):
	ilayer = "Network"
	ruleName = 'acc_rule_{:%Y%b%d%H%M%S}'.format(datetime.datetime.now())
	isrc = str(form["source"].value)
	idest = str(form["dest"].value)
	iport = str(form["port"].value)
	iact = str(form["act"].value)
	myrule= { "name" : ruleName, "layer" : "AutomatedLayer", "position" : 1 , "destination" : idest, "service" : iport, "source": isrc , "action" : iact , "track" : { "type" : "log", "per-session" : "true" } }
	results = api_call(server, mport, 'add-access-rule', myrule, session )
	time.sleep(2)
	try:
	    results["message"]
	except KeyError:
	    print json.dumps(results,indent=4, sort_keys=True)
	else:
	    print results["message"]

	logout(server, mport, session, "yes")

    elif ( form["what"].value == "simplerule"):
	ilayer = "Network"
	ruleName = 'acc_rule_{:%Y%b%d%H%M%S}'.format(datetime.datetime.now())
	isrc = str(form["source"].value)
	idest = str(form["dest"].value)
	iport = str(form["port"].value)
	iact = str(form["act"].value)
	isrcname = simple_add(server, mport, session, isrc) 
	idestname = simple_add(server, mport, session, idest) 
	
	myrule= { "name" : ruleName, "layer" : "AutomatedLayer", "position" : 1 , "destination" : idestname, "service" : iport, "source": isrcname , "action" : iact , "track" : { "type" : "log", "per-session" : "true" } }
	results = api_call(server, mport, 'add-access-rule', myrule, session )
	time.sleep(2)
	try:
	    results["message"]
	except KeyError:
	    print json.dumps(results,indent=4, sort_keys=True)
	else:
	    print results["message"]

	logout(server, mport, session, "yes")



