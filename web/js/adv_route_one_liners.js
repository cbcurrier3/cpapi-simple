CP.ar_one_liners = {
    get_one_liner   : function(str) {
        var show_one_liner = true;
        var str2 = String(str).toLowerCase();
        if(str2 == "get_one_liner") {
            show_one_liner = false;
        }
        var one_liner_str = (CP.ar_one_liners[ str2 ]) ? CP.ar_one_liners[ str2 ] : "Not Found";
        var one_liner_hidden = (show_one_liner && CP.ar_one_liners[ str2 ]) ? false : true;
        var one_liner_cmp = {
            xtype           : "cp4_inlinemsg"
            ,id             : "one_liner_cmp"
            ,type           : "info"
            ,text           : one_liner_str
            ,hidden         : one_liner_hidden
            //,maxWidth       : 500
            ,style          : "margin-top:24px;"
        };
        return one_liner_cmp;
    }

    ,bgp            : "Border Gateway Protocol (BGP) is an inter-AS protocol, meaning that it can be deployed within and between autonomous systems (AS)."

    ,bootp          : "BOOTP/DHCP Relay extends Bootstrap Protocol (BOOTP) and Dynamic Host Configuration Protocol (DHCP) operation across multiple hops in a routed network. BOOTP Relay allows configuration requests to be forwarded to and serviced from configuration servers located outside the single LAN."
    
    ,dhcp6relay     : "DHCPv6 Relay extends the Dynamic Host Configuration Protocol for IPv6 (DHCPv6) across multiple hops in a routed network. This allows DHCPv6 requests to be forwarded to and serviced by configuration servers located off-link from clients."

    ,ospf           : "Open Shortest Path First (OSPF) is an interior gateway protocol (IGP) used to exchange routing information between routers within a single autonomous system (AS). OSPF is suitable for complex networks with a large number of routers."
    ,ospf3          : "Open Shortest Path First (OSPF) is an interior gateway protocol (IGP) used to exchange routing information between routers within a single autonomous system (AS). OSPF is suitable for complex networks with a large number of routers."

    ,rip            : "Routing Information Protocol (RIP) is a distance vector interior gateway protocol used to exchange routing information between routers."

    ,igmp           : "Internet Group Management Protocol (IGMP) allows hosts on multi-access networks to inform locally attached routers of their group membership information."

    ,export_proto   : "Route redistribution allows routes learned from one routing protocol to be propagated to another routing protocol. This is necessary when routes from one protocol such as RIP, OSPF, or BGP need to be advertised into another protocol (when two or more routing protocols are configured on the same router)."

    ,import_proto   : "Inbound route filters allow a network administrator to restrict or constrain the set of routes accepted by a given routing protocol. The filters let an operator include or exclude ranges of prefixes from the routes that are accepted into RIP, OSPF and BGP."

    ,iphelper       : "IP Broadcast Helper is a form of static addressing that uses directed broadcasts to forward local and all-nets broadcasts to desired destinations within the internetwork. IP Broadcast Helper allows the relaying of broadcast UDP packets on a LAN as unicasts to one or more remote servers."

    ,pim            : "Protocol-Independent Multicast (PIM) gets its name from the fact that it can work with any existing unicast protocol to perform multicast forwarding. It supports three types of multipoint traffic distribution patterns: dense, sparse, and source-specific multicast."
                    //+ "<br /><br />Dense mode is most useful when:<br />"
                    //+ "&#8226;  Senders and receivers are in close proximity.<br />"
                    //+ "&#8226;  There are few senders and many receivers.<br />"
                    //+ "&#8226;  The volume of multicast traffic is high.<br />"
                    //+ "&#8226;  The stream of multicast traffic is constant.<br /><br />"
                    //+ "Sparse mode is most useful when:<br />"
                    //+ "&#8226;  A group has few receivers.<br />"
                    //+ "&#8226;  Senders and receivers are separated by WAN links.<br />"
                    //+ "&#8226;  The type of traffic is intermittent."

    ,staticmroute   : "Static Multicast Routes are used by PIM.  They are preferred over routes learned from other sources (Static Routes, OSPF, RIP, BGP) for multicast traffic."

    ,pbr_static     : "You can exert detailed control over traffic forwarding by using policy based routing (PBR). When you use PBR, you create routing tables of static routes and direct traffic to the appropriate tables by using a policy list."
                    //+ " Using an ACL in this way lets you direct traffic flow by filtering on one or more of the following:"
                    //+ "<br />&#8226;  Source address"
                    //+ "<br />&#8226;  Source mask length"
                    //+ "<br />&#8226;  Destination address"
                    //+ "<br />&#8226;  Destination mask length"
                    //+ "<br />&#8226;  Source port"
                    //+ "<br />&#8226;  Destination port"
                    //+ "<br />&#8226;  Protocol type"
                    //+ "<br />Note - Policy based routing does not work if a VPN is enabled on the system."

    ,rdisc          : "The ICMP Router Discovery Protocol allows hosts running an ICMP router discovery client to learn dynamically about the presence of a viable default router on a LAN.  It is intended to be used instead of having hosts wiretap routing protocols such as RIP.  It is used in place of, or in addition to, statically configured default routes in hosts."
    ,rdisc6         : "The ICMPv6 Router Discovery Protocol allows hosts running an ICMPv6 router discovery client to locate neighboring routers dynamically as well as to learn prefixes and configuration parameters related to address auto-configuration."

    ,route_agg      : "Route aggregation allows you to take numerous specific routes and aggregate them into one encompassing route. Route aggregation can reduce the number of routes that a given protocol advertises. The aggregates are activated by contributing routes."

    //,route_options  : ""
    //,show_route     : ""

    ,static_routes  : "Static routes are routes that you manually configure in the routing table. Static routes do not change and are not dynamic. Static routes cause packets addresses to the destination to take a specified next hop. Static routes allow you to add routes to destinations that are not known by dynamic routing protocols. Statics can also be used in providing a default route."
    ,static_routes_6: "Static routes are routes that you manually configure in the routing table. Static routes do not change and are not dynamic. Static routes cause packets addresses to the destination to take a specified next hop. Static routes allow you to add routes to destinations that are not known by dynamic routing protocols. Statics can also be used in providing a default route."

    ,vrrp           : "Virtual Router Redundancy Protocol (VRRP) provides dynamic failover of IP addresses from one router to another in the event of failure. VRRP is defined in RFC 3768."
    ,svrrp          : "Virtual Router Redundancy Protocol (VRRP) provides dynamic failover of IP addresses from one router to another in the event of failure. VRRP is defined in RFC 3768." + "<br>This page presents the simplified method for configuring monitored-circuit virtual routers, where-in you specify the Virtual Router parameters and the Backup IP addresses and the system determines the interfaces associated with those virtual addresses and automatically configures full mesh monitoring of the interfaces."
    ,avrrp          : "Virtual Router Redundancy Protocol (VRRP) provides dynamic failover of IP addresses from one router to another in the event of failure. VRRP is defined in RFC 3768." + "<br>This page presents the flexible method for configuring either standard virtual routers or monitored-circuit virtual routers. When configuring monitored-circuit virtual routers, you need to not only specify the Virtual Router parameters and the Backup IP addresses but also the interfaces associated with those virtual addresses in however way you want interface monitoring to affect VRRP operation."
    ,vrrp6          : "Virtual Router Redundancy Protocol (VRRP) provides dynamic failover of IP addresses from one router to another in the event of failure. VRRP for IPv6 is defined in RFC 5798."
}

