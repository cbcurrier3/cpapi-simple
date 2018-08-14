/**
 * @class Ext.ux.grid.column.Progress
 * @extends Ext.grid.Column
 * <p>
 * A Grid column type which renders a numeric value as a progress bar.
 * </p>
 * <p>
 * <b>Notes:</b><ul>
 * <li>Compatible with Ext 4.0</li>
 * </ul>
 * </p>
 * Example usage:
 * <pre><code>
    var grid = new Ext.grid.Panel({
        columns: [{
            dataIndex: 'progress'
            ,xtype: 'progresscolumn'
        },{
           ...
        ]}
        ...
    });
 * </code></pre>
 * <p>The column can be at any index in the columns array, and a grid can have any number of progress columns.</p>
 * @author Phil Crawford
 * @license Licensed under the terms of the Open Source <a href="http://www.gnu.org/licenses/lgpl.html">LGPL 3.0 license</a>.  Commercial use is permitted to the extent that the code/component(s) do NOT become part of another Open Source or Commercially licensed development library or toolkit without explicit permission.
 * @version 0.1 (June 30, 2011)
 * @constructor
 * @param {Object} config 
 */
Ext.define('Ext.ux.grid.column.SUProgress', {
    extend: 'Ext.grid.column.Column'
    ,alias: 'widget.suprogresscolumn'
    
    ,cls: 'x-progress-column-su'
    
    /**
     * @cfg {String} progressCls
     */
    ,progressCls: 'x-progress'
    /**
     * @cfg {String} progressText
     */
    ,progressText: '{0} %'
    
    /**
     * @private
     * @param {Object} config
     */
    ,constructor: function(config){
        var me = this
            ,cfg = Ext.apply({}, config)
            ,cls = me.progressCls;

        me.callParent([cfg]);

//      Renderer closure iterates through items creating an <img> element for each and tagging with an identifying 
//      class name x-action-col-{n}
        me.renderer = function(v, meta, record, rowIndex, colIndex, store, view) {
        	//meta- tdls,style
            var text, newWidth;
			
			var status_str='';
			var color="black";
			var status="";
			switch (record.data.status) {
				case 1: { 
					status="Available for Download";
					color="purple";
				} break;
				case 2: { status = "Downloading: "; } break;
				case 3: { 
					status="Available for Install"; 
					color="blue";
				} break;
				case 4: { status = "Installing: "; } break;
				case 5: { 
					if (record.data.bundle_err=="1") {
						status="Installed with errors";
						color="darkorange";
					} else {
						if (record.data.self_test_res=="success") {
							status="Installed, self-test passed";
							color="green";
						} else
						if (record.data.self_test_res=="failure") {
							status="Installed, self-test failed";
							color="darkorange";

						} 
						else if (record.data.self_test_res=="pending_reboot") {
							status="Installed, pending reboot";
							color="darkorange";

						}
						else {
						        status="Installed";
						        color="green";
						}
					}
				} break;
				case 6: { 
					status="Download Failed";
					color="red"; 
				} break;
				case 7: { 
					status="Install Failed";
					color="red"; 
				} break;
				case 8: { status = "Uninstalling: "; } break;
				case 9: { 
					status="Uninstall Failed";
					color="red";
				} break;
				case 11: { 
					status="Install Skipped";
					color="red";
				} break;
				default: { status = record.data.status; } break;
			}
			if (CP.Packages.isNotInstallCritical(record.data.package_name)) {
				color="lightgrey";
			}
			status_str = '<span style="color:'+color+';">'+status+'</span>';
           
            if ((v == 0) || (v == 100)) {
				if ((record.data.status == 2) || (record.data.status == 4) || (record.data.status == 8)) {
					return "";
				}
        		return status_str;
        	} 
            	
            var style = '';
    		var textClass = (v < 55) ? 'x-progress-col-text-back' : 'x-progress-col-text-front' + (Ext.isIE6 ? '-ie6' : '');
    		
    		v = Ext.isFunction(cfg.renderer) ? cfg.renderer.apply(this, arguments)||v : v; //this = renderer scope
    		var my_text = status_str + Ext.String.format(me.progressText,Math.round(v*100)/100);
				
    		var text =  Ext.String.format('</div><div class="x-progress-col-text {0}" id="{1}">{2}</div></div>',
    	    		  textClass, Ext.id(), my_text
    	    		);
    		text = (v<100) ? text.substring(0, text.length - 6) : text.substr(6);
    		
    		meta.tdCls += 'x-grid3-progresscol';
    		meta.style = "padding:0;";
    		
    		return Ext.String.format(
    		  '<div class="x-progress-col-wrap"><div class="x-progress-col-inner"><div class="x-progress-col-bar" style="width:{1}%;">{0}</div>' +
    		  '</div></div>', text, v
    		);
    		 
        };    
        
    }//eof constructor
    

    /**
     * @private
     */
    ,destroy: function() {
        delete this.renderer;
        return this.callParent(arguments);
    }//eof destroy
    
}); //eo extend

//end of file
