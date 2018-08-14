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
Ext.define('Ext.ux.grid.column.Progress', {
    extend: 'Ext.grid.column.Column'
    ,alias: 'widget.progresscolumn'
    
    ,cls: 'x-progress-column'
    
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
            
            if (v == 0) { 
     		 	meta.style = "background-color: white;";
        		return '';
        	} 
        	else if (v == 100) {
        		meta.tdCls = 'icon_ok';        	
        		return '';
        		
        	}      
            	
            var style = '';
    		var textClass = (v < 55) ? 'x-progress-text-back' : 'x-progress-text-front' + (Ext.isIE6 ? '-ie6' : '');
    		
    		v = Ext.isFunction(cfg.renderer) ? cfg.renderer.apply(this, arguments)||v : v; //this = renderer scope
    		var my_text = Ext.String.format(me.progressText,Math.round(v*100)/100);
    		
    		var text =  Ext.String.format('</div><div class="x-progress-text {0}" style="width:162px;" id="{1}">{2}</div></div>',
    	    		  textClass, Ext.id(), my_text
    	    		);
    		text = (v<96) ? text.substring(0, text.length - 6) : text.substr(6);
    		
    		meta.tdCls += 'x-grid3-progresscol';
    		meta.style = "padding:0;";
    		
    		return Ext.String.format(
    		  '<div class="x-progress-wrap"><div class="x-progress-inner"><div class="x-progress-bar" style="width:{0}%;">{1}</div>' +
    		  '</div></div>', v, text
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
