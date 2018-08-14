// Copyright Check Point

CP.listmover = {
  ////////
  // This is the 'list mover', a widget that lets you move entries
  // between two or more lists.  Has one big list on the left and one or more
  // lists on the right.
  //
  // How you use list movers:
  //	* call makeListMover() to create one
  //	* to fill in its values call fillListMover()
  //	* if you want to disable/enable it you can call setListMoverDisabled()
  //	* and when you want to know what it's got (ie the settings the user
  //	has made in it) call listMoverGet()
  ////////

  // makeListMover(): Creates the list mover.
  // Arguments:
  //	+ cfg: configuration; may contain the following (optional unless
  //	  stated otherwise):
  //		- id: (required) base for the 'id' attribute values
  //		- title: the title of the whole thing
  //		- left_title: title of the left list
  //		- right_titles: array of titles for the right list(s)
  //		- sortType: how to sort values; see Ext.data.SortTypes
  //		and Ext.data.Field.sortType.  Is applied to the 'sort_name'
  //		if one is specified, otherwise to the 'back_name'.
  //		- basicHeight: Height of one of the right lists; the height
  //			of the left list is based on that
  //		- columnWidth: width of one of the lists
  //		- minorSpacing: small space between/around some things;
  //			defaults to 5
  //		- majorSpacing: larger space between/around some things;
  //			defaults to 15
  //		- master_list: contains all the possible values
  //			the may appear in any of the lists.  In particular,
  //			it's a list, with one member for each possible entry;
  //			the list member is a hash that may contain
  //			the following:
  //				back_name - (required) machine readable
  //					version of the name
  //				front_name - human readable version of the
  //					name
  //				sort_name - version of the name used for
  //					sorting
  //				not_on_left - if present: don't show
  //					this entry on the left side list,
  //					even if it is not found in any
  //					right side lists
  //				locked - if present: will be shown with a
  //					lock icon if one is specified, and
  //					will not be moveable
  //					(note: the value of this doesn't
  //					matter just its existence)
  //				x_* - you are free to define and use these
  //					as you see fit; the list mover
  //					implementation will not read or
  //					modify them
  //		- master_list_proc: alternative to master_list; a function
  //			which gets called with a copy of 'obj' and which
  //			fills in 'master_list' when possible.  Should return
  //			'true' when it's done it's thing, 'false' if unable.
  //		- master_list_proc_arg: extra argument that will be
  //			passed to master_list_proc
  //		- onchange: this function will be called when the list
  //			is changed by the user
  //		- onchange_arg: extra argument that will be passed to onchange
  //		- lock_icon_html: literal HTML to use to render a "lock"
  //			icon for any items that are 'locked'
  //	+ obj: will be filled in (see below)
  // Returns an	object that's a valid ext js component; also fills in
  // its 'obj' argument with the following:
  //	left_store: store representing what's on the left
  //	right_stores: array of stores representing what's on the right
  //	master_list: as specified in the argument
  //	master_list_proc, master_list_proc_arg: from cfg
  //	extjs: the same thing makeListMover() returns
  //	buttons: an array containing all the buttons
  //	has_onchange, onchange, onchange_arg: set from 'onchange' and
  //		'onchange_arg' in the config
  makeListMover:function(cfg, obj) {
    var items = [];
    var i, j, btn1, btn2;

    // get some settings out of 'cfg'
    var id = cfg.id;
    var left_title = CP.listmover.defget(cfg,'left_title','Left');
    var right_titles = CP.listmover.defget(cfg,'right_titles',['Right']);
    var stype = CP.listmover.defget(cfg,'sortType',Ext.data.SortTypes.none);
    var basic_height = CP.listmover.defget(cfg,'basicHeight',120);
    var column_width = CP.listmover.defget(cfg,'columnWidth',200);
    var majorSpacing = CP.listmover.defget(cfg,'majorSpacing',15);
    var minorSpacing = CP.listmover.defget(cfg,'minorSpacing',5);
    obj.lock_icon_html = CP.listmover.defget(cfg,'lock_icon_html', '');
    var has_onchange, onchange, onchange_arg;
    if ('onchange' in cfg) {
      obj.has_onchange = true;
      obj.onchange = cfg.onchange;
      obj.onchange_arg = cfg.onchange_arg;
    } else {
      obj.has_onchange = false;
      obj.onchange = obj.onchange_arg = "nothing";
    }

    if ('master_list' in cfg) {
      obj.master_list = cfg.master_list;
    } else if ('master_list_proc' in cfg) {
      obj.master_list_proc = cfg.master_list_proc;
      obj.master_list_proc_arg = cfg.master_list_proc_arg;
    } else {
      // useless but that's the caller's problem
      obj.master_list = [];
    }

    // make our stores; there's one for each grid so therefore there's
    // one for the left and one for each of the lists on the right.
    // In each record of these stores there are several fields.  But only
    // one of them is shown.  The others are used in processing.
    //		entry_front: this is what's shown
    //		entry_back: this is what's used "behind the scenes".
    //			think of it as the "real value"
    //		entry_sort: this is used for sorting the list.
    //		entry_lock: boolean: whether to 'lock' this field
    // Often the three entry_* fields will all have the same value.
    var myfields = [
      { name: 'entry_front', type: 'string'}
      ,{name: 'entry_back', type: 'string'}
      ,{name: 'entry_sort', sortType: stype, type: 'string' }
      ,{name: 'entry_lock', type: 'boolean'}
    ];
    obj.left_store = new Ext.data.ArrayStore({
      autoDestroy: true
      ,storeId: id+"-store-left"
      ,fields: myfields
    });
    obj.right_stores = [];

    for (i = 0; i < right_titles.length; ++i) {
      obj.right_stores[i] = new Ext.data.ArrayStore({
	autoDestroy: true
	,storeId: id+"-store-right-"+i
	,fields: myfields
      });
    }

    obj.buttons = [];

    // We lay our pieces out in a table with five columns and it's a little
    // tricky to make sense of.  Here are the pieces and where they go
    // (in the case of two lists on the right):
    //		ABEGI
    //		ADDDD
    //		ACFHJ
    // the items are:
    //		A - the list on the left
    //		B,C - spacers to the left of the buttons
    //		D - spacer between the lists on the right
    //		E,F - buttons; for each list on the right there's one
    //			cell holding two buttons
    //		G,H - spacers to the right of the buttons
    //		I,J - the lists on the right

    // left column: the "from" list
    items.push(CP.listmover
	       .makeListMoverGrid(id+"-grid-left",
				  right_titles.length * 2 - 1,
				  left_title,
				  right_titles.length * basic_height +
				  (right_titles.length - 1) * minorSpacing,
				  column_width,
				  obj.left_store, obj));
    // middle and right columns: buttons, and "to" lists
    for (i = 0; i < right_titles.length; ++i) {
      // if there are multiple "to" lists on the right, put space between
      if (i > 0) {
	items.push(new Ext.Spacer({
	  width: minorSpacing, height: minorSpacing, colspan: 4
	}));
      }

      // spacer to the left of the buttons
      items.push(new Ext.Spacer({
	height: minorSpacing, width: minorSpacing
      }));

      // button to move right
      btn1 = new CP.WebUI.Button({
	text: '&gt;&gt;'
	,handler:function() {
	  CP.listmover
	    .listMoverHandler(id+"-grid-left",
			      id+"-grid-right-"+this.whichOne, this.theObj);
	}
	,scope: { whichOne: i, theObj: obj }
	,width: 40
      });
      obj.buttons.push(btn1);

      // button to move left
      btn2 = new CP.WebUI.Button({
	text: '&lt;&lt;'
	,handler:function() {
	  CP.listmover
	    .listMoverHandler(id+"-grid-right-"+this.whichOne,
			      id+"-grid-left", this.theObj);
	}
	,scope: { whichOne: i, theObj: obj }
	,width: 40
      });
      obj.buttons.push(btn2);

      // put the buttons together one on top of another
      items.push(new Ext.Container({
	items: [new Ext.Spacer({flex:1})
		,btn1
		,btn2
		,new Ext.Spacer({flex:1})]
	,layout: 'vbox'
	,height:100
	,width: 40
      }));

      // spacer to the right of the buttons
      items.push(new Ext.Spacer({
	height: minorSpacing, width: minorSpacing
      }));

      // list on the right
      items.push(CP.listmover.makeListMoverGrid(id+"-grid-right-"+i, 1,
					       right_titles[i],
					       basic_height, column_width,
					       obj.right_stores[i], obj));

    }

    // put those all together in a box...
    var fs = new CP.WebUI.FieldSet({
      title: CP.listmover.defget(cfg,'title','Mover')
      ,id: id
      ,layout: 'table'
      ,layoutConfig: {
	columns: 5
      }
      ,defaults: {
      }
      //,autoShow: true
      //,autoHeight: true
      ,padding: majorSpacing
      //,forceFit: true
      ,items: items
      ,width: column_width * 2 + 40 + 2 * majorSpacing + 2 * minorSpacing
    });
    obj.extjs = fs;
    return fs;
  }

  // makes a grid for the list mover.  A list mover will contain two or
  // more of these.
  ,makeListMoverGrid:function(id, rowspan, title, height, cwidth, store, obj) {
    var gr = new Ext.grid.GridPanel({
      xtype: 'cp_grid'
      ,id: id
      ,rowspan: rowspan
      ,title: title
      ,colModel:new Ext.grid.ColumnModel([{
	sortable: true, editable: false
	,hideable: false, dataIndex: 'entry_front'
	,renderer: {
	  fn: function(value, metaData, record, rowIndex, colIndex, store) {
	    var obj = this;
	    var html = Ext.util.Format.htmlEncode(value);
	    if (record.data.entry_lock) {
	      html = html + obj.lock_icon_html;
	    }
	    return html;
	  }
	  ,scope: obj
	}
      }])
      ,store: store
      ,selModel: new Ext.grid.RowSelectionModel({
	listeners: {
	  beforerowselect: function(sm, ri, kx, rec) {
	    // this runs right before a row gets selected; we use it to
	    // prevent certain "locked" rows from being selected
	    return !rec.data.entry_lock;
	  }
	}
      })
      ,height: height
      ,width: cwidth
      ,hideHeaders: true
      ,viewConfig: {
	forceFit: true
      }
    });
    return gr;
  }

  // handle button presses in the list mover (moving things from one list
  // to another)
  //	from_id - 'id' of the subwidget we're moving from
  //	to_id - likewise, for what we're moving to
  //	obj - structure that holds a lot of info about the list mover;
  //		same as the one filled in by makeListMover()
  ,listMoverHandler:function(from_id, to_id, obj) {
    var from = Ext.getCmp(from_id);
    var to = Ext.getCmp(to_id);
    var sel = from.selModel.getSelections(), sel2;
    var i;

    // filter out any locked selections
    sel2 = [];
    for (i = 0; i < sel.length; ++i) {
      if (!sel[i].data.entry_lock) {
	sel2.push(sel[i]);
      }
    }

    if (sel2.length > 0) {
      from.store.remove(sel2);
      to.store.add(sel2);
      to.store.sort('entry_sort','ASC');
      if (obj.has_onchange) {
	// call the onchange handler
	obj.onchange(obj.onchange_arg, obj, from, to, sel2);
      }
    }
  }

  // setListMoverDisable: enable/disable the listMover
  //	obj - structure that holds a lot of info about the list mover;
  //		same as the one filled in by makeListMover()
  //	disable - true or false
  ,setListMoverDisabled:function(obj,disable) {
    var i;
    for (i = 0; i < obj.buttons.length; ++i) {
      obj.buttons[i].setDisabled(disable);
    }
  }

  // fillListMover: fills in a list mover with data from the specified
  // lists.
  // Arguments:
  //	obj - structure that holds a lot of info about the list mover;
  //		same as the one passed to makeListMover()
  //	lists - array of arrays, one for each of the lists on the right,
  //		giving their elements
  ,fillListMover:function(obj, lists) {
    var i, j, mlist, mlisthash;

    // listMangler converts a list of single values into a store
    // containing four fields per record, using defaults to fill in details
    // that were unspecified.
    var listMangler = function(l) {
      var ll = [], fn,sn,bn;
      for (var k = 0; k < l.length; ++k) {
	bn = l[k];
	if (!(bn in mlisthash)) {
	  // this shouldn't happen
	  ll[k] = [bn, bn, bn, false];
	} else {
	  // fill in a record
	  if ('front_name' in mlisthash[bn]) {
	    fn = mlisthash[bn].front_name;
	  } else {
	    fn = bn; // no front name; use back name instead
	  }
	  if ('sort_name' in mlisthash[bn]) {
	    sn = mlisthash[bn].sort_name;
	  } else {
	    sn = bn; // no sort name; use back name instead
	  }
	  ll[k] = [fn, bn, sn, ('locked' in mlisthash[bn])];
	}
      }
      return ll;
    };

    // Do we have to find out the master list?  can we?
    if ('master_list' in obj) {
      // we already have a list
      mlist = obj.master_list;
    } else {
      if (obj.master_list_proc(obj, obj.master_list_proc_arg)) {
	// now we have a list
	mlist = obj.master_list;
      } else {
	// still haven't found it; we'll try again later (the next
	// time fillListMover() gets called) but for now we
	// use a dummy value, useless but the best we have for now
	mlist = [];
      }
    }

    // mlisthash will hold all the entries from mlist[], indexed on their
    // 'back_name'.
    mlisthash = {};
    for (i = 0; i < mlist.length; ++i) {
      if (typeof(mlist[i]) != "object" || !('back_name' in mlist[i])) {
	// invalid mlist!  I wish there were a good way to let the developer
	// know this error without alarming the user (since it isn't the
	// user's fault)
	mlisthash = {};
	mlist = [];
	break;
      }
      mlisthash[mlist[i].back_name] = mlist[i];
    }

    // Fill in the stores on the right, based on the provided lists.
    for (i = 0; i < obj.right_stores.length; ++i) {
      obj.right_stores[i].loadData(listMangler(lists[i]));
    }

    // Fill in the store on the left, with everything in the master list
    // that isn't in the lists on the right. (except for things which
    // have 'not_on_left')
    var seen = {};
    for (i = 0; i < obj.right_stores.length; ++i) {
      for (j = 0; j < lists[i].length; ++j) {
	seen[lists[i][j]] = 1;
      }
    }
    var left = [];
    for (i = 0; i < mlist.length; ++i) {
      if (!seen[mlist[i].back_name] && !('not_on_left' in mlist[i])) {
	left.push(mlist[i].back_name);
      }
    }
    obj.left_store.loadData(listMangler(left));

    obj.left_store.sort('entry_sort','ASC');
    for (i = 0; i < obj.right_stores.length; ++i) {
      obj.right_stores[i].sort('entry_sort','ASC');
    }
  }

  // listMoverGet: function to extract the list(s) out of a listMover.
  // Will return an array of arrays, one for each list on the right, containing
  // one string for each entry.  (In particular, it will give you the
  // 'entry_back' for each one.)
  // Arguments:
  //	obj: as passed to, and initialized by, makeListMover()
  ,listMoverGet: function(obj) {
    var i, j;
    var arys = [];
    for (i = 0; i < obj.right_stores.length; ++i) {
      var recs = obj.right_stores[i].getRange();
      var ary = [];
      for (j = 0; j < recs.length; ++j) {
	ary.push(recs[j].data.entry_back);
      }
      arys.push(ary);
    }
    return(arys);
  }

  // defget: get a value from a hash/array, or use a default if it's not
  // present
  ,defget:function(hsh,key,def) {
    if (key in hsh) {
      return hsh[key];
    } else {
      return def;
    }
  }
};
