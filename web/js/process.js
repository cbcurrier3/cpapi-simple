_.indexBy = _.indexBy || _.keyBy;

var platforms = [
    {
        "key":"gui-cli",
        "name": "SmartConsole CLI"
    },
    {
        "key":"cli",
        "name": "mgmt_cli tool"
    },
    {
        "key":"clish",
        "name": "Gaia CLI"
    },
    {
        "key":"web",
        "name": "Web Services"
    }
];
var default_platform = "gui-cli";

var hashDivider = "/";
var versionDivider = "~";
var content_tree = {};

var api_commands = [];
var api_objects = {};
var api_chapters = [];
var api_static_commands = [];
var api_dynamic_commands = [];
var api_description_overrides = {};

var sorted_api_commands = [];

var searchLabel = "doc-menu-search-label";

var $searchinput = $("#searchinput");
var $sidebar = $("#sidebar");
var $content = $("#content");
var $versionSwitch = $(".version-switch > .dropdown-menu");
var $menu_items;
var $menu_containers;

function reportErrorCommandNotFound(command) {
    reportError("Unknown command \"" + command + "\" (in API version " + getApiVersion() + ")");
}

function reportError(errorMessage) {
    $("#dynamic_content").html("<div class='content-error'>" + errorMessage + "</div>");
}

var getCachedJSON = function () {
    var cache = {};
    return function (path) {
        var deferred = $.Deferred();

        if (cache[path]) {
            deferred.resolve(cache[path]);
        } else {
            $.getJSON(path).done(function (data) {
                deferred.resolve.call(this, cache[path] = data);
            }).fail(function () {
                deferred.resolve(null);
            });
        }

        return deferred;
    }
}();

// Bootstrap
$(function () {

    // Activating search form
    $searchinput.keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    });

    var $clearer = $(".clearer");
    $clearer.hide($(this).prev('input').val());
    $clearer.click(function () {
        $(this).prev('input').val('').focus().keydown();
        $(this).hide();
    });

    // Activating left navigation sidebar
    $sidebar.on('click', 'a.static-content, a.commandname', function () {
        navigateToCommand($(this).attr("data-command"));
    });

    // Helper function to stop submenu items from closing their parent
    $sidebar.on('click', ".dropdown-subitem", function (event) {
        // stop bootstrap.js to hide the parents
        event.stopPropagation();
    });

    // Activating collapse buttons
    $content.on('click', '.btn-toggle-collapse-next', function () {
        var $this = $(this);
        var $collapse = $this.nextAll('.collapse:first');

        var $parentTd = $collapse.parent('td');

        if (!$collapse.hasClass("in") && $parentTd.length > 0) {
            var topMargin = 14;

            var nextColumnDescriptionHeight = $parentTd.next('td').children('span').innerHeight();
            if (nextColumnDescriptionHeight > 8) {
                topMargin = nextColumnDescriptionHeight - 8; // 8px is a padding of td
            }

            $collapse.css("margin-top", topMargin + "px");
        }

        $collapse.collapse('toggle');
        $this.toggleClass('ar_open').toggleClass('ar_close');

        if ($this.hasClass("ar_open")) {
            $collapse.find("> table.table > tbody > tr > td > div.collapse, > div.more > div.collapse").each(resizeCollapsible);
        }
    });

    $content.on("click", ".jump-to-anchor > li > a", function () {
        var anchorId = $(this).attr("data-anchor-id");
        if (anchorId) {
            var anchorElement = document.getElementById(anchorId.substring(1));
            if (anchorElement) {
                anchorElement.scrollIntoView();
            }
        }
    });

    // Activating page tabs platform chooser
    $("body").on("click", "#platform-tab-navigation li:not(.active) a", function (e) {
        var newPlatform = $(this).data("platform");
        $(this).parent("li").siblings(".active").removeClass("active").end().addClass("active");

        setPlatform(newPlatform);

        _advance();

        updateHashPlatform(newPlatform);

        e.preventDefault();
    });

    // Loading available version to version switch
    var html = "";

    api_versions.forEach(function (v) {
        html += "<li><a data-path='" + v.key + "'>" + v.name + "</a></li>"
    });

    $versionSwitch.html(html);

    // Activating version switch
    $versionSwitch.on("click", "li:not(.active)", function (e) {
        var $li = $(this);
        var $a = $(e.target);
        var version = $a.data("path");

        switchToVersion(version);

        $li.addClass("active").siblings(".active").removeClass("active");
        $li.parent().siblings(".dropdown-toggle").find(".version-name").text($a.text());
    });

    // Activating side menu dynamic search filter
    (function () {
        var lastFilter = "";
        var timeout = 150;
        var keyTimeout;

        $searchinput.change(function () {
            if (!$menu_items) {
                return;
            }

            var filterValue = normalizeSearchText($searchinput.val());

            $sidebar.removeClass("filtered");
            $menu_items.show();

            if (filterValue.length > 0) {
                $menu_containers.filter(".filter-open").removeClass("filter-open open");
                $menu_containers.removeClass(".filter-open");
                $sidebar.addClass("filtered");
                $menu_items.each(function (i, item) {
                    var $item = $(item);
                    if ($item.data(searchLabel).indexOf(filterValue) >= 0) {
                        var $container = $item.closest(".got-inner");
                        while ($container.length > 0 && !$container.is(".nav-root")) {
                            $container.addClass("filter-open open");
                            $container = $container.parent().closest(".got-inner");
                        }
                    } else {
                        $item.hide();
                    }
                });
            }

            return false;
        }).keydown(function () {
            clearTimeout(keyTimeout);
            keyTimeout = setTimeout(function () {
                if ($searchinput.val() === lastFilter) return;
                lastFilter = $searchinput.val();
                $searchinput.change();
            }, timeout);
        });

        $searchinput.change();
    })();

    // Activating initial version
    var targetVersion = parseHash().version || getApiVersion();

    if (!_.find(api_versions, {"key": targetVersion})) {
        reportError("Unknown API version " + targetVersion);
        return;
    }

    $('.version-switch').find("a[data-path='" + targetVersion + "']").click()
});

function switchToVersion(version) {
    // Version argument examples: v1, v1.1, v2 ...

    setApiVersion(version);
    updateHashVersion(version);

    // Showing a loading screen
    $.blockUI({
        message: $('#loadingdialog'), css: {
            top: (($(window).height() - 72 ) / 2 + 72 ) + 'px',
            left: (($(window).width() - $sidebar.width() ) / 2 + $sidebar.width() ) + 'px',
            width: '128px',
            border: 'none',
            'z-index': '99'
        }
    });

    var subPath = "data/" + getApiVersion() + "/dynamic/";
    $.when(getCachedJSON(subPath + "content.json"), getCachedJSON(subPath + "apis.json"),
        function () {
            var deferred = $.Deferred();
            //$.getJSON(subPath + "doc_description_overrides.json").done(function () {
            //    deferred.resolve.apply(this, arguments);
            //}).fail(function () {
            //    deferred.resolve({});
            //});
            deferred.resolve([{}]);
            return deferred;
        }())
        .then(function (contentReply, apisReply, overridesReply) {
            var i;

            if (!contentReply || !apisReply) {
                var errorMessage = "Failed to load necessary resources for the API version " + version;
                $sidebar.children("li").remove();
                reportError(errorMessage);
                $.unblockUI();
                return;
            }

            // sidebar logic
            api_chapters = contentReply.chapters;

            //content logic
            api_commands = apisReply.commands;
            api_objects = _.indexBy(apisReply.objects, 'name');
            api_description_overrides = overridesReply;

            api_dynamic_commands = {};
            for (i = 0; i < api_commands.length; i++) {
                var command = api_commands[i];
                api_dynamic_commands[command.name.web] = command;
            }

            api_static_commands = {};
            for (i = 0; i < api_chapters.length; i++) {
                var chapter = api_chapters[i];
                if (chapter.file && chapter.file !== "#divider") {
                    api_static_commands[chapter.file.replace(".html", "")] = chapter;
                }
            }

            // Setting current platform from location hash
            setPlatform(parseHash().platform);
            $("#platform-tab-navigation").find("a[data-platform='" + getPlatform() + "']").parent("li").addClass("active");

            _advance();

            $.unblockUI();
        });
}

function getPlatform() {
    return window.current_platform || default_platform;
}

function setPlatform(platform) {
    if (!platform || window.current_platform === platform) return;

    if (!_.find(platforms, {"key": platform})) {
        console.error("Unknown platform " + platform);
        return;
    }

    window.current_platform = platform;
}

function getApiVersion() {
    return window.current_api_version || default_api_version;
}

function setApiVersion(version) {
    if (!version || window.current_api_version === version) return;

    if (!_.find(api_versions, {"key": version})) {
        var errorMessage = "Unknown API version " + version;
        reportError(errorMessage);
        throw new Error(errorMessage);
    }

    window.current_api_version = version;
}

function parseHash() {
    /*
     * Here we are handling the next hash states:
     * platform
     * platform/command
     * platform/command~version
     * platform/command/anchor
     * platform/command~version/anchor
     * command
     * command~version
     * command/anchor
     * command~version/anchor
     * ~version
     */

    var refinedHash = decodeURIComponent(window.location.hash).trim();
    var parts = refinedHash.substring(1).split(hashDivider);
    if (parts.length === 0) return {};

    var result = {};

    if (_.find(platforms, {"key": parts[0]})) {
        result.platform = parts[0];
        parts.shift();
    }

    if (parts[0]) {
        var arr = (parts[0] || "").split(versionDivider);
        result.command = arr[0];
        result.version = arr[1];
        result.commandWithVersion = parts[0];
        parts.shift();
    }

    result.anchor = parts[0];

    return result;
}
function setHash() {
    // Adding " " to the end to trigger "hashchange" event in browser in case page is already loaded with hash
    window.location.hash = _.compact(arguments).join(hashDivider) + " ";
}

function updateHashPlatform(platform) {
    var hashObj = parseHash();

    if (hashObj.platform === platform) {
        return;
    }

    setHash(platform, hashObj.commandWithVersion, hashObj.anchor);
}

function updateHashVersion(version) {
    var hashObj = parseHash();

    if (hashObj.version === version) {
        return;
    }

    setHash(hashObj.platform, (hashObj.command || "") + versionDivider + version, hashObj.anchor);
}

function buildGenerateHashFunction(anchor) {
    return __buildGenerateHashFunction(null, anchor);
}

function buildGenerateHashFunctionWithSign(anchor) {
    return __buildGenerateHashFunction("#", anchor);
}

function __buildGenerateHashFunction(suffix, anchor) {
    return function () {
        return (suffix ? suffix : "")
            + getPlatform()
            + hashDivider + this.name.web + "~" + getApiVersion()
            + (anchor ? (hashDivider + anchor) : "");
    }
}

// Start point in rendering docs
function _advance() {
    // Remove children to repaint the page properly
    var sidebar = document.getElementById("sidebar");
    while (sidebar.children.length !== 0) {
        sidebar.removeChild(sidebar.children[0]);
    }

    _prepare_objects();

    paint_content(api_commands);
}

//helper function that modify the objects
function _prepare_objects() {
    for (var i in api_objects) {
        if (api_objects.hasOwnProperty(i)) {
            //merge required fields and fields array into 1 importantfields array.
            if (api_objects[i].hasOwnProperty("required-fields")) {
                api_objects[i].importantfields = api_objects[i]["required-fields"].concat(api_objects[i].fields);
            } else {
                api_objects[i].importantfields = (api_objects[i].fields);
            }
            api_objects[i].importantfields = _prepare_fields(api_objects[i].importantfields);

            if (api_objects[i]["under-more-fields"].length) {
                api_objects[i]["under-more-fields"] = _prepare_fields(api_objects[i]["under-more-fields"]);
            }
        }
    }
}

//helper function that prepare the fields
function _prepare_fields(fields_arr) {
    //loop through fields and prepare field data:
    for (var j in fields_arr) {
        if (fields_arr.hasOwnProperty(j)) {
            //name column: write field name
            fields_arr[j].display_name = '<span class="blue">' + fields_arr[j].name + '</span>';
            //add field aliases
            if (fields_arr[j].hasOwnProperty("aliases")) {
                for (var k = 0; k < fields_arr[j].aliases.length; k++) {
                    fields_arr[j].display_name += "<br/><span class='grey or'>or</span><br/><span class='blue'>" + fields_arr[j].aliases[k] + "</span>";
                }
            }

            //add if required
            if (fields_arr[j].required) {
                fields_arr[j].display_name += '<br/><span class="required">Required</span>';
            }

            //description column:
            if (fields_arr[j].deprecated) {
                fields_arr[j].display_description = fields_arr[j].description + "<span class='yellow'>Deprecated:</span>" + fields_arr[j]["deprecated-description"];
            } else {
                fields_arr[j].display_description = fields_arr[j].description;
            }

            fields_arr[j] = _prepare_field_values(fields_arr[j]);
            fields_arr[j].display_value = fields_arr[j].values_arr.shift(); //present first element of values_arr as the display value
        }
    }
    return fields_arr;
}

//helper function that generates the simple value field as well as the other value types to print below the field row.
function _prepare_field_values(field) {

    var values_arr = [];
    var field_value = '';
    var flag_obj_wrap = false;
    var flag_default_added = false;
    var default_value = '';
    var default_value_desc = '';
    var inner_output = '';
    var parent_collapsed = field["default-collapsed"] == null ? true : field["default-collapsed"];
    for (var i = 0; i < field.types.length; i++) {
        if (typeof field.types[i] !== "undefined") {
            flag_obj_wrap = false;
            field_value = '';
            default_value_desc = '';
            //object type:
            if (field.types[i].name == "object" && (field.types[i]["object-name"].substr(0, 3) == 'com')) {
                field_value = field.types[i]["object-name"];
                flag_obj_wrap = true;
            } else if (field.types[i].name == "list" && field.types[i]["element-type"].name == "object" && (field.types[i]["element-type"]["object-name"].substr(0, 3) == 'com')) {
                //list object type:
                field_value = field.types[i]["element-type"]["object-name"];
                flag_obj_wrap = true;
            } else { //not an object:
                field_value = _render_type(field.types[i]);
            }

            //add default value if not added before: (its not per field type but per field, yet we still need it inside the value field)
            if (!flag_default_added) {
                default_value = _render_default_value(field);
                if (default_value !== "") {
                    flag_default_added = true;
                    //field_value += default_value;
                }
            }

            //add valid values:
            if (typeof field.types[i]["valid-values"] !== "undefined") {

                if (typeof field["field-in-request"] !== "undefined" && field["field-in-request"] == true) {
                    field_value += "<br/><span class='grey'>Valid values:</span> <span class='blue'>";
                }
                //Valid values in reply should be called as "Optional Arguments"
                else {
                    field_value += "<br/><span class='grey'>Optional arguments:</span> <span class='blue'>";
                }

                field_value += field.types[i]["valid-values"].join(", ");
                field_value += "</span>";
            }

            //add valid values description:
            if (typeof field.types[i]["valid-values-description"] !== "undefined") {
                default_value_desc += "<div class='valid-desc'><span class='grey'>Description:</span> <br/>";
                default_value_desc += field.types[i]["valid-values-description"] + "</div>";
            }

            //wrap object html
            if (flag_obj_wrap) {
                field_value = "Object <div data-state-collapsed='" + parent_collapsed + "' class='replace_object'>" + field_value + "</div>";
                if (field.types[i].name == "list") field_value = "List: " + field_value;
            }


            field_value = field_value + default_value + default_value_desc;
            if (i > 0) {
                values_arr.push("<tr class='con-tr'><td></td><td colspan='2' class='or_td'><span class='grey or'>or</span><br/></td></tr>");
                field_value = "<tr class='con-tr'><td></td><td colspan='2'>" + field_value + "</td></tr>";
            }

            values_arr.push(field_value);
        }
    }

    field.values_arr = values_arr;
    return field;
}

//helper function that loops over fields and returns an array of objects to print
function _get_related_object_names_from_field(field) {
    var obj_arr = [];
    for (var i = 0; i < field.types.length; i++) {
        if (typeof field.types[i] !== "undefined") {
            if (field.types[i].name == "object" && (field.types[i]["object-name"].substr(0, 3) == 'com')) {
                obj_arr.push(field.types[i]["object-name"]);
            } else {
                //objects can hide inside lists:
                if (field.types[i].name == "list" && field.types[i]["element-type"].name == "object" && (field.types[i]["element-type"]["object-name"].substr(0, 3) == 'com')) {
                    obj_arr.push(field.types[i]["element-type"]["object-name"]);
                }
            }
        }
    }
    return obj_arr;
}

//helper function used to render a single field value type.
function _render_type(vartype) {
    switch (vartype.name) {
        case "string":
            return "string";
        case "integer":
            return "integer";
        case "boolean":
            return "boolean";
        case "object":
            return "Object";
        case "list":
            return 'List: ' + vartype["element-type"].name;
        default:
            return vartype.name;
    }
}

//helper function used to render a field default value if exists, otherwise return empty string.
function _render_default_value(field) {
    if (typeof field["default-value"] !== "undefined" && field["default-value"].length) {
        return "<br/><span class='grey'>Default:&nbsp;</span><span class='blue'>" + field["default-value"] + "</span>";
    }
    return "";
}

function _print_headers(headersArray) {
    var output = {};
    output.event = [];
    output.events = [];
    output.html = '';

    for (var i = 0; i < headersArray.length; i++) {
        var field_output = {};
        field_output.event = [];
        field_output.events = [];
        field_output.html = '';
        var tmp = json2html.transform(headersArray[i], transform_header_basic, {
            'events': true
        });
        field_output.event = field_output.event.concat(tmp.event);
        field_output.events = field_output.events.concat(tmp.events);
        field_output.html += tmp.html;

        output.event = output.event.concat(field_output.event);
        output.events = output.events.concat(field_output.events);
        output.html = output.html + field_output.html;
    }

    return output;
}

//helper function that prints mail object's inner fields
function _print_fields(data) {
    var output = {};
    output.event = [];
    output.events = [];
    output.html = '';

    for (var i = 0; i < data[data.whattoprint].length; i++) {
        var field_output = {};
        field_output.event = [];
        field_output.events = [];
        field_output.html = '';
        var tmp = json2html.transform(data[data.whattoprint][i], transform_field_basic, {
            'events': true
        });
        field_output.event = field_output.event.concat(tmp.event);
        field_output.events = field_output.events.concat(tmp.events);
        field_output.html += tmp.html;

        for (var j = 0; j < data[data.whattoprint][i].values_arr.length; j++) {
            if (data[data.whattoprint][i].values_arr[j].length > 0) {
                field_output.html = field_output.html + data[data.whattoprint][i].values_arr[j];
            }
        }

        //print field alternatives
        if (typeof data[data.whattoprint][i]["field-alternatives"] !== "undefined") {
            if (data[data.whattoprint][i]["field-alternatives"].length) {
                data[data.whattoprint][i]["field-alternatives"] = _prepare_fields(data[data.whattoprint][i]["field-alternatives"]); //this has not been performed yet for alternative fields.
                var altfields = json2html.transform(data[data.whattoprint][i]["field-alternatives"],
                    transform_field_alternatives, {'events': true});
                field_output.event = field_output.event.concat(altfields.event);
                field_output.events = field_output.events.concat(altfields.events);
                field_output.html += altfields.html;

                for (var k = 0; k < data[data.whattoprint][i].values_arr.length; k++) {
                    if (data[data.whattoprint][i].values_arr[k].length > 0)
                    //output.html +=  data[data.whattoprint][i].values_arr[k];
                        field_output.html = field_output.html + data[data.whattoprint][i].values_arr[k];
                }
            }
        }

        output.event = output.event.concat(field_output.event);
        output.events = output.events.concat(field_output.events);
        output.html = output.html + field_output.html;
    }

    return output;
}

//helper function that injects commands into content_tree variable prior to printing content based on command-uid unside the "commands-data" attribute
function _add_commands_to_chapter(item) {

    item.commands = [];
    for (var a = 0; a < item["commands-data"].length; a++) {
        sorted_api_commands[item["commands-data"][a].name.web].examples = item["commands-data"][a]["external-data"]["file-names"]; //add example files info to command
        item.commands.push(sorted_api_commands[item["commands-data"][a].name.web]); //add command data to chapter
    }

    return item;
}

//prints the categories side menu:
function _build_menu_with_commands() {
    var command, subitem;

    var item = {};
    var output = '';

    var currentPlatform = window.getPlatform();

    if (currentPlatform != "web") {
        currentPlatform = "cli";
    }

    for (var i = 0; i < content_tree.length; i++) {
        item = content_tree[i];

        var ii = i;
        var html = "";

        if (item["sub-chapters"].length || item["commands"].length) {
            html = "<li class='got-inner dropdown'><a aria-expanded='true' class='dropdown-toggle' ><b class='caret-right'></b>" + item.name + "</a>" + "<ul class='nav dropdown-nav'>";

            //render main category commands
            if (item.commands !== "undefined" && item["commands"].length) {
                for (var h = 0; h < item.commands.length; h++) {
                    command = item.commands[h];
                    html = html + "<li class='item command-item dropdown-subitem'><a data-command='" + command.name["web"] + "' class='commandname'>" + command.name[currentPlatform] + "</a></li>";
                }
            }

            for (var j = 0; j < item["sub-chapters"].length; j++) {
                subitem = item["sub-chapters"][j];
                if (typeof subitem.commands !== "undefined" && subitem.commands.length) {
                    html = html + '<li class="item  got-inner dropdown"><a class="catname dropdown-toggle" aria-expanded="true"><b class="caret-right"></b>' + subitem.name + '</a>';
                    html = html + "<ul class='nav dropdown-nav'>";
                    for (var k = 0; k < subitem.commands.length; k++) {
                        command = subitem.commands[k];
                        html = html + "<li class='item command-item dropdown-subitem'><a data-command='" + command.name["web"] + "' class='commandname'>" + command.name[currentPlatform] + "</a></li>";
                    }
                    html = html + "</ul>";
                } else {
                    console.warn("Empty sub-category found: " + subitem.name);
                }
                html = html + "</li>";
            }

            html = html + "</ul>";
        } else if (item.file != null && item.file == "#divider") {
            html = "<li class='divider'>" + item.name;
        } else {
            html = "<li class='dropdown'><a data-command='" + item.file.replace(".html", "") + "' class='catname static-content'>" + item.name + "</a>";
        }

        html = html + "</li>";
        output += html;
    }

    $(output).appendTo($sidebar);

    $menu_items = $sidebar.find(".commandname,.static-content"); // tag "a"
    $menu_containers = $sidebar.find(".got-inner"); // tag "li"
    $menu_items.each(function (i, item) {
        var $item = $(item);
        $item.data(searchLabel, normalizeSearchText($item.text()));
    });

    //activate scrollbar for ul
    var nano = $(".nano");
    nano.nanoScroller({alwaysVisible: true});

    // Activate custom dropdown logic to support multi level dropdowns
    $sidebar.find('li.dropdown.got-inner a').on('click', function () {
        $(this).parent().toggleClass('open');
        nano.nanoScroller(); // Recalculate scroller height
    });
}

function build_inner_objects(depth) { //renders inner object tables after initial content is rendered.
    if (depth > 0) {
        $('.replace_object').each(function (index) {

            if ($(this).text().length) { //has file content

                if (typeof api_objects[$(this).text()] === 'undefined') {
                    console.log($(this).text());
                } else {
                    var current_obj = api_objects[$(this).text()];
                    if (typeof current_obj === 'undefined') {
                        console.log($(this).text());
                        console.log(api_objects[$(this).text()]);
                    }
                    current_obj.whattoprint = 'importantfields';
                    current_obj.type_collapsed = ($(this).attr("data-state-collapsed") == "true");

                    if (current_obj[current_obj.whattoprint].length) {
                        $.when(
                            $(this).json2html(current_obj, transform_object_allfields, {
                                'events': true,
                                'replace': true
                            }).attr("class", "processed_object")
                        ).then(function () {
                            //if inner object have a valid value description, move that valid value description before the collapsing div of objects table.
                            $("div.valid-desc").prev('div.collapse:not(.checked)').each(function () {
                                $(this).before($(this).next("div.valid-desc"));
                                $(this).addClass('checked');
                            });

                            build_inner_objects(depth - 1);
                        }); //recurse for inner object display

                    } else {
                        $(this).html('No fields found for object <br/>' + current_obj.name).attr("class", "processed_object empty");
                    }

                }
            } else {
                console.warn('empty replace_object container found');
            }
        });
    }
}

function _process_examples() {
    // Replace example placeholder information with results
    var $examplesContainer = $(".examples-container");

    $examplesContainer.css("visibility", "hidden");

    var examplesPromises = [];
    $examplesContainer.find("div.example-con").each(function () {
        var $this = $(this);
        var str = (this.innerHTML).replace(/\\/g, "/");

        var promise = getCachedJSON("data/" + getApiVersion() + "/dynamic/" + str).done(function (data) {
            $this.json2html(data, examples_template, {
                'replace': true,
                'events': true
            });
        });

        examplesPromises.push(promise);
    });

    $.when.apply(this, examplesPromises).then(function () {
        $(".examples-container").css("visibility", "visible");
    });
}

//helper function to loop over possible headers of an example json file
function _print_example_headers(headers) {
    var output = '';
    for (var i = 0; i < headers.length; i++) {
        output += headers[i].name + ": " + headers[i].value;
    }
    return output;
}

//main rendering function
function paint_content(itemsdata) {
    if (itemsdata) {
        //create work objects:
        sorted_api_commands = _.indexBy(api_commands, "name.web");
        content_tree = api_chapters;
        var item = {};
        var subitem = {};
        for (var i = 0; i < content_tree.length; i++) {
            if (typeof content_tree[i] !== 'undefined') {
                var ii = i;
                item = content_tree[i];
                content_tree[i] = _add_commands_to_chapter(item);
                content_tree[i].pos = i;
                if (item["sub-chapters"].length) {
                    for (var j = 0; j < item["sub-chapters"].length; j++) {
                        if (typeof item["sub-chapters"][j] !== 'undefined') {
                            subitem = item["sub-chapters"][j];
                            content_tree[ii]["sub-chapters"][j] = _add_commands_to_chapter(subitem);
                            content_tree[ii]["sub-chapters"][j].pos = j;
                            content_tree[ii]["sub-chapters"][j].parentpos = i;
                        }
                    }
                }
            }
        }

        //print menu after processing command-chapter tree
        _build_menu_with_commands();

        $searchinput.change();

        navigateToCommand();
    }
}

function normalizeSearchText(text) {
    text = text.trim().replace(/-| /gm, "_").toLowerCase();

    while (text.indexOf("__") !== -1) {
        text = text.replace("__", "_")
    }

    if (text.indexOf("_") === 0) {
        text = text.substring(1);
    }

    if (text.lastIndexOf("_") === text.length - 1) {
        text = text.substring(0, text.length - 1);
    }

    return text;
}

var transform_object_start0 = [{
    "tag": "a",
    "class": function () {
        if (!this.collapsed) {
            return "btn-toggle-collapse-next ar_open";
        } else {
            return "btn-toggle-collapse-next ar_close";
        }
    },
    "html": "v"
}, {
    "tag": "div",
    "class": function () {
        if (!this.collapsed) {
            return "collapse in";
        } else {
            return "collapse";
        }
    },
    "children": [{
        "tag": "table",
        "class": "table",
        "children": [{
            "tag": "thead",
            "class": "grey-dark",
            "children": [{
                "tag": "tr",
                "children": [{
                    "tag": "th",
                    "html": "Parameter name"
                }, {
                    "tag": "th",
                    "html": "Value"
                }, {
                    "tag": "th",
                    "html": "Description"
                }]
            }]
        }, {
            "tag": "tbody",
            "children": function (data) {
                return _print_fields(data);
            }
        }]
    },
        {
            "tag": "div",
            "children": function () {
                if (this["under-more-fields"] && this["under-more-fields"].length > 0) {
                    var current_obj = this;
                    current_obj.whattoprint = 'under-more-fields';
                    current_obj.collapsed = true;
                    var result2 = json2html.transform(current_obj, transform_object_headerless_table, {
                        'events': true
                    });
                    result2.html = "<h4 class='more-header'>More</h4>" + result2.html;
                    return (result2);
                }
            }
        }
    ]
}
];

var transform_object_allfields = [{ // inner objects table with collapsible marker and optional collapsed more fields section
    "tag": "a",
    "class": function () {
        if (this.collapsed || this.type_collapsed) {
            return "btn-toggle-collapse-next ar_close";
        } else {
            return "btn-toggle-collapse-next ar_open";
        }
    },

    "html": "v"
}, {
    "tag": "div",
    "class": function () {
        if (this.collapsed || this.type_collapsed) {
            return "collapse";
        } else {
            return "collapse in";
        }
    },
    "children": [{
        "tag": "table",
        "class": "table",
        "children": [{
            "tag": "thead",
            "class": "grey-dark",
            "children": [{
                "tag": "tr",
                "children": [{
                    "tag": "th",
                    "html": "Parameter name"
                }, {
                    "tag": "th",
                    "html": "Value"
                }, {
                    "tag": "th",
                    "html": "Description"
                }]
            }]
        }, {
            "tag": "tbody",
            "children": function (data) {
                data.whattoprint = "importantfields";
                return _print_fields(data);
            }
        }]
    }, {
        "tag": "div",
        "class": "more div",
        "children": function (data) {
            if (data['under-more-fields'] && data['under-more-fields'].length > 0) {
                var thisobj = data;
                thisobj.whattoprint = 'under-more-fields';
                thisobj.collapsed = true;
                var result2 = json2html.transform(thisobj, transform_object_headerless_table, {
                    'events': true
                });
                result2.html = "<h4 class='more-header'>More</h4>" + result2.html;
                return (result2);
            }
        }
    }]
}];

var transform_field_alternatives = [{
    "tag": "tr",
    "class": "con-tr",
    "children": [{
        "tag": "td",
        "colspan": "3",
        "html": "<span class='grey or'>or</span>",
        "class": "or_td"
    },]

}, {
    "tag": "tr",
    "class": "con-tr",
    "children": [{
        "tag": "td",
        "class": "param_key",
        "html": "${display_name}"
    }, {
        "tag": "td",
        "class": "param_value",
        "html": "${display_value}"
    }, {
        "tag": "td",
        "class": "param_description",
        "html": "<span class='description to_check_for_rewrite'>${display_description}</span>"
    }]
}];

var transform_object_headerless_table = [{
    "tag": "a",
    "class": function () {
        if (!this.collapsed) {
            return "btn-toggle-collapse-next ar_open";
        } else {
            return "btn-toggle-collapse-next ar_close";
        }
    },

    "html": "v"
}, {
    "tag": "div",
    "class": function () {
        if (!this.collapsed) {
            return "collapse in";
        } else {
            return "collapse";
        }
    },
    "children": [{
        "tag": "table",
        "class": "table",
        "children": [{
            "tag": "tbody",
            "children": function (data) {
                return _print_fields(data);
            }
        }]
    }]
}];

var transform_field_basic = {
    "tag": "tr",
    "children": [{
        "tag": "td",
        "class": "param_key",
        "html": "${display_name}"
    }, {
        "tag": "td",
        "class": "param_value",
        "html": "${display_value}"
    }, {
        "tag": "td",
        "class": "param_description",
        "html": "<span class='description to_check_for_rewrite'>${display_description}</span>"
    }]
};

var transform_header_basic = {
    "tag": "tr",
    "class": "param_key",
    "children": [{
        "tag": "td",
        "class": "blue",
        "html": "${name}"
    }, {
        "tag": "td",
        "class": "param_value",
        "html": "${value}"
    }, {
        "tag": "td",
        "class": "param_description",
        "html": "<span class='description to_check_for_rewrite'>${description}</span>"
    },]
};

var transform_content_tree = [{
    "tag": "div",
    "class": "category row",
    "children": [{
        "tag": "h2",
        "class": "category-title",
        "children": [
            {
                "tag": "a",
                "name": "chap${pos}",
                "html": ""
            } //dont print category name
        ]
    }, {
        "tag": "div",
        "class": "file-content",
        "html": "${file}"
    }, {
        "tag": "div",
        "class": "sub-categories",
        "children": function () {
            return (json2html.transform(this["sub-chapters"], transform_content_tree_subcat, {
                'events': true
            }));
        }
    }]
}];

var transform_content_tree_subcat = [{
    "tag": "div",
    "class": "sub-category",
    "children": [{
        "tag": "h2",
        "class": "category-title",
        "children": [
            {
                "tag": "a",
                "name": "chap${parentpos}sub${pos}",
                "html": ""
            } //dont print category name
        ]
    }, {
        "tag": "div",
        "class": "commands",
        "children": function () {
            return json2html.transform(this.commands, transform_content_tree_item, {
                'events': true
            });
        }
    }]
}];

function getLabelByPlatform(labelType) {

    var types = {
        "web": {
            "request": "Request",
            "request_url": "Request URL",
            "request_body": "Request Body",
            "response": "Response",
            "status_code": "HTTP Return code: "
        },
        "cli": {
            "request": "Command",
            "request_url": "Syntax",
            "request_body": "Arguments",
            "response": "Output",
            "status_code": "Return value: "
        }
    }

    return function () {
        var platformType = getPlatform();
        if (platformType != "web") {
            platformType = "cli";
        }

        return types[platformType][labelType]
    };
}

var transform_content_tree_item = {
    "tag": "div",
    "id": "dynamic_content",
    "children": [{
            "tag": "div",
            "class": "item",
            "children": [{
                "tag": "a",
                "class": "anchorcom",
                "id": buildGenerateHashFunction()
            },
               {
                "tag": "div",
                "class": "row followMeBar",
                "children": [{
                    "tag": "div",
                    "class": "box-left"
                }, {
                    "tag": "h2",
                    "class": "title",
                    "html": function () {
                        var platformType = getPlatform();
                        if (platformType != "web") {
                            platformType = "cli";
                        }
                        return this.name[platformType];
                    }
                }, {
                    "tag": "div",
                    "class": "menu",
                    "id": "${name.web}-nav",
                    "children": [{
                        "tag": "ul",
                        "class": "menu btn-group btn-group-vertical jump-to-anchor",
                        "children": [{
                            "tag": "li",
                            "children": [{
                                "tag": "a",
                                "class": "bg-description",
                                "html": "Description",
                                "data-anchor-id": buildGenerateHashFunctionWithSign("description")
                            }]
                        }, {
                            "tag": "li",
                            "children": [{
                                "tag": "a",
                                "class": "bg-request",
                                "html": getLabelByPlatform("request"),
                                "data-anchor-id": buildGenerateHashFunctionWithSign("request")
                            }]
                        }, {
                            "tag": "li",
                            "children": [{
                                "tag": "a",
                                "class": "bg-response",
                                "html": getLabelByPlatform("response"),
                                "data-anchor-id": buildGenerateHashFunctionWithSign("response")
                            }]
                        }, {
                            "tag": "li",
                            "children": [{
                                "tag": "a",
                                "class": "bg-examples",
                                "html": "Examples",
                                "data-anchor-id": buildGenerateHashFunctionWithSign("examples")
                            }]
                        }]
                    }]
                }, {
                    "tag": "div",
                    "class": "box-right"
                }]
            }, {
                "tag": "div",
                "class": function () {
                    if (this.description.length || api_description_overrides[this.name.web]) {
                        return "row sec-0-1";
                    } else {
                        return "row sec-0-1 hidden";
                    }
                },
                "children": [{
                    "tag": "a",
                    "id": buildGenerateHashFunction("description"),
                    "class": "anchorcomsec",
                    "html": "&nbsp;"
                }, {
                    "tag": "h3",
                    "class": "description",
                    "html": "Description"
                }, {
                    "tag": "span",
                    "class": "description",
                    "data-description-path": "${name.web}",
                    "html": function () {
                        return api_description_overrides[this.name.web] || this.description;
                    }
                },
                {
                    "tag": "div",
                    "class": function () {
                        var domains = this["allowed-domains"];
                        if (domains && domains.length === 1 && domains[0] === "mds") {
                            return "allowed-domains";
                        }
                        return "allowed-domains hidden";
                    },
                    "html": function () {
                        var domains = this["allowed-domains"];
                        if (domains && domains.length === 1 && domains[0] === "mds") {
                            if (getPlatform() == "gui-cli") {
                                return "This command is available using the SmartConsole CLI only on a Multi Domain environment and when logged into the MDS domain.";
                            }

                            return "This command is available only after logging in to the System Data domain.";
                        }
                        return "";
                    }
                }
                ]
            }, {
                "tag": "div",
                "class": "row sec-0-2",
                "children": [{
                    "tag": "a",
                    "id": buildGenerateHashFunction("request"),
                    "class": "anchorcomsec"
                }, {
                    "tag": "h3",
                    "class": "request",
                    "html": getLabelByPlatform("request")
                }, {
                    "tag": "h4",
                    "html": getLabelByPlatform("request_url")
                }, {
                    "tag": "p",
                    "class": "blue",
                    "html": function () {
                        return this.name.command[getPlatform()].replace(/</g, "&lt;").replace(/>/, "&gt;");
                    }
                }, {
                    "tag": "h4",
                    "class": function () {
                        if (getPlatform() != "web") {
                            return "hidden-element";
                        }
                        else {
                            return "collapsed";
                        }
                    },
                    "html": "Request Headers"
                }, {
                    "tag": "a",
                    "class": function () {
                        if (getPlatform() != "web") {
                            return "hidden-element";
                        }
                        if (!this.collapsed) {
                            return "btn-toggle-collapse-next ar_open";
                        } else {
                            return "btn-toggle-collapse-next ar_close";
                        }
                    },

                    "html": "v"
                },
                    {
                        "tag": "div",
                        "class": function () {
                            if (getPlatform() != "web") {
                                return "hidden-element";
                            }
                            else {
                                return "collapse in";
                            }
                        },
                        "children": [{
                            "tag": "table",
                            "class": "table",
                            "children": [{
                                "tag": "thead",
                                "class": "grey-dark",
                                "children": [{
                                    "tag": "tr",
                                    "children": [{
                                        "tag": "th",
                                        "html": "Header name"
                                    }, {
                                        "tag": "th",
                                        "html": "Value"
                                    }, {
                                        "tag": "th",
                                        "html": "Description"
                                    }]
                                }]
                            }, {
                                "tag": "tbody",
                                "children": function () {
                                    var platformType = getPlatform() == "web" ? getPlatform() : "cli";
                                    return _print_headers(this["headers"]);
                                }
                            }]
                        }]
                    }
                ]
            }, {
                "tag": "div",
                "class": "row sec-0-3",
                "children": [{
                    "tag": "div",
                    "class": "request-container",
                    "children": function () {
                        var current_obj = api_objects[this.request];
                        current_obj.whattoprint = 'importantfields';
                        current_obj.collapsed = false;
                        var result1 = json2html.transform(current_obj, transform_object_start0, {
                            'events': true
                        });
                        result1.html = "<h4>" + getLabelByPlatform("request_body")() + "</h4>" + result1.html;
                        return (result1);
                    }
                }]
            },
                {
                    "tag": "div",
                    "class": "row sec-0-4",
                    "children": [{
                        "tag": "a",
                        "id": buildGenerateHashFunction("response"),
                        "class": "anchorcomsec"
                    }, {
                        "tag": "h3",
                        "class": "response",
                        //"id":"${name.web}-response",
                        "html": getLabelByPlatform("response")
                    }, {
                        "tag": "div",
                        "class": "responses-container",
                        "children": function () {
                            return (json2html.transform(this.response, transform_content_tree_response_inner, {
                                'events': true
                            }));
                        }
                    }]
                }, {
                    "tag": "div",
                    "class": function () {
                        if (this.examples.length) {
                            return "row sec-0-5";
                        } else {
                            return "row sec-0-5 hidden";
                        }
                    },
                    "children": [{
                        "tag": "a",
                        "id": buildGenerateHashFunction("examples"),
                        "class": "anchorcomsec"
                    }, {
                        "tag": "h3",
                        "class": "examples",
                        //"id":"${name.web}-examples",
                        "html": "Examples"
                    }, {
                        "tag": "div",
                        "class": "examples-container",
                        "children": function () {

                            var exm_output = "";
                            for (var x = 0; this.examples[x]; x++) {
                                exm_output += "<div class='example-con'>" + this.examples[x] + "</div>";
                            }
                            return exm_output;
                        }
                    }]
                }
            ]
        }]
};

var transform_content_tree_response_inner = [{
    "tag": "h4",
    "html": "On success"
}, {
    "tag": "div",
    "html": getLabelByPlatform("status_code"),
    "children": [{
        "tag": "span",
        "class": "pink",
        "html": function () {
            var platformType = getPlatform() == "web" ? getPlatform() : "cli";
            return (this["on-success"][platformType]["status-code"] + "");
        }
    }, {
        "tag": "a",
        "class": "btn-toggle-collapse-next ar_open",
        "html": "v"
    }, {
        "tag": "div",
        "class": "collapse in success-response",
        "children": [{
            "tag": "table",
            "class": "table",
            "children": [{
                "tag": "thead",
                "class": "grey-dark",
                "children": [{
                    "tag": "tr",
                    "children": [{
                        "tag": "th",
                        "html": "Parameter name"
                    }, {
                        "tag": "th",
                        "html": "Value"
                    }, {
                        "tag": "th",
                        "html": "Description"
                    }]
                }]
            }, {
                "tag": "tbody",
                "children": function () {
                    var platformType = getPlatform() == "web" ? getPlatform() : "cli";
                    var thisobj = api_objects[this["on-success"][platformType].object["object-name"]];
                    thisobj.whattoprint = 'importantfields';
                    return _print_fields(thisobj);
                }
            }]
        },
            {
                "tag": "div",
                "children": function () {
                    var platformType = getPlatform() == "web" ? getPlatform() : "cli";
                    var current_obj = api_objects[this["on-success"][platformType].object["object-name"]];
                    if (current_obj["under-more-fields"] && current_obj["under-more-fields"].length > 0) {
                        current_obj.whattoprint = 'under-more-fields';
                        current_obj.collapsed = true;
                        var result2 = json2html.transform(current_obj, transform_object_headerless_table, {
                            'events': true
                        });
                        result2.html = "<h4 class='more-header'>More</h4>" + result2.html;
                        return (result2);
                    }
                }
            }
        ]
    } ]
}, {
    "tag": "h4",
    "html": "On Failure"
}, {
    "tag": "div",
    "html": getLabelByPlatform("status_code"),
    "children": [{
        "tag": "span",
        "class": "pink",
        "html": function () {
            var platformType = getPlatform() == "web" ? getPlatform() : "cli";
            return (this["on-failure"][platformType]["status-code"] + "");
        }
    }, {
        "tag": "a",
        "class": "btn-toggle-collapse-next ar_close",
        "html": "v"
    }, {
        "tag": "div",
        "class": "collapse error-response",
        "children": [{
            "tag": "table",
            "class": "table",
            "children": [{
                "tag": "thead",
                "class": "grey-dark",
                "children": [{
                    "tag": "tr",
                    "children": [{
                        "tag": "th",
                        "html": "Parameter name"
                    }, {
                        "tag": "th",
                        "html": "Value"
                    }, {
                        "tag": "th",
                        "html": "Description"
                    }]
                }]
            }, {
                "tag": "tbody",
                "children": function () {
                    var currentPlatform = (getPlatform() == "web") ? getPlatform() : "cli";
                    var thisobj = api_objects[this["on-failure"][currentPlatform].object["object-name"]];
                    thisobj.whattoprint = 'importantfields';
                    return _print_fields(thisobj);
                }
            }]
        },
            {
                "tag": "div",
                "children": function () {
                    var platformType = getPlatform() == "web" ? getPlatform() : "cli";
                    var current_obj = api_objects[this["on-failure"][platformType].object["object-name"]];
                    if (current_obj["under-more-fields"] && current_obj["under-more-fields"].length > 0) {
                        current_obj.whattoprint = 'under-more-fields';
                        current_obj.collapsed = true;
                        var result2 = json2html.transform(current_obj, transform_object_headerless_table, {
                            'events': true
                        });
                        result2.html = "<h4 class='more-header'>More</h4>" + result2.html;
                        return (result2);
                    }
                }
            }]
    }]
}];

//sub template for rendering the command examples part
var examples_template = [{
    "tag": "div",
    "children": [
        {
            "tag": "h4",
            "html": "${name}"
        }, {
            "tag": "a",
            "class": "btn-toggle-collapse-next ar_close",

            "html": "v"
        }, {
            "tag": "div",
            "class": "collapse",
            "children": [{
                "tag": "p",
                "html": "${description}"
            }, {
                "tag": "p",
                "class": function () {
                    if (this[getPlatform()] != null) {
                        return "example-sec-title";
                    } else {
                        return "example-sec-title hidden";
                    }
                },
                "html": getLabelByPlatform("request")
            }, {
                "tag": "pre",
                "class": function () {
                    if (this[getPlatform()] != null) {
                        return "code";
                    } else {
                        return "code hidden";
                    }
                },
                "html": function () {
                    if (getPlatform() == "web" && this.web != null) { //Render web example
                        return this.web.request.url + "\n" + this.web.request.headers + "\n" + this.web.request.body +
                            (this.web.request.comments ? "\n\n" + this.web.request.comments : "");
                    }
                    else {
                        return this[getPlatform()].request.body;
                    }
                }
            }, {
                "tag": "p",
                "class": function () {
                    if (this[getPlatform()].response != null) {
                        return "example-sec-title";
                    } else {
                        return "example-sec-title hidden";
                    }
                },
                "html": getLabelByPlatform("response")
            }, {
                "tag": "pre",
                "class": function () {
                    if (this[getPlatform()].response != null) {
                        return "code";
                    } else {
                        return "code hidden";
                    }
                },
                "html": function () {
                    if (this[getPlatform()].response != null) {
                        return this[getPlatform()].response.body;
                    }
                }
            }]
        }
    ]
}
];

function navigateToCommand(commandParameter) {
    var hashObj = parseHash();

    var command = commandParameter || hashObj.command || Object.keys(api_static_commands)[0];

    var platform = getPlatform();
    if (api_static_commands[command]) {
        platform = undefined;
    }

    var version = getApiVersion();
    if (hashObj.version && hashObj.version !== version) {
        version = hashObj.version;
    }

    var anchor = hashObj.anchor;

    if (!command) return;

    if (version !== getApiVersion()) {
        switchToVersion(version);
    }

    renderCommandContent(platform, command, anchor);

    highlightCommandInMenu(command);
}

function renderCommandContent(platform, command, anchor) {
    if (!command) {
        console.warn("Nothing to render");
        return;
    }

    var $dynamicContent = $("#dynamic_content");

    var api_command;
    if (api_command = api_static_commands[command]) {
        $dynamicContent.html("<div class='item'><a class='anchorcom'/><div class='file-content'/></div>");
        $(".file-content").load("data/" + getApiVersion() + "/" + api_command.file + " .content");
        $("#leftCol").removeClass("leftCol");
    } else if (api_command = api_dynamic_commands[command]) {
        // Dynamic command must have platform set in any case
        platform = platform || getPlatform();

        var top_node_index, top_node, sub_node_index, sub_node;
        var command_index;
        var current_command;
        var matched_command;
        top_search_loop:
            for (top_node_index in content_tree) {
                top_node = content_tree[top_node_index];
                if (top_node.file) continue;

                for (command_index in top_node.commands) {
                    current_command = top_node.commands[command_index];
                    if (current_command.name.web === command) {
                        matched_command = current_command;
                        break top_search_loop;
                    }
                }

                for (sub_node_index in top_node["sub-chapters"]) {
                    sub_node = top_node["sub-chapters"][sub_node_index];
                    for (command_index in sub_node.commands) {
                        current_command = sub_node.commands[command_index];
                        if (current_command.name.web === command) {
                            matched_command = current_command;
                            break top_search_loop;
                        }
                    }
                }
            }

        if (matched_command) {
            $dynamicContent.json2html(matched_command, transform_content_tree_item, {
                'events': true,
                'replace': true
            });
        } else {
            reportErrorCommandNotFound(command);
            return;
        }
    } else {
        reportErrorCommandNotFound(command);
        return;
    }

    refresh_content(command);

    var anchorElement = document.getElementById(document.location.hash.substring(1));

    // Reassigning the hash to drop the anchor
    setHash(platform, command + "~" + getApiVersion(), "");

    // Scroll to the anchor
    if (anchorElement) {
        anchorElement.scrollIntoView();
    }

    // Overwriting request descriptions
    $dynamicContent.find(".request-container .description.to_check_for_rewrite").each(function (i, elt) {
        overwrite_description(elt, command, "request");
    });

    // Overwriting response descriptions
    $dynamicContent.find(".success-response .description.to_check_for_rewrite").each(function (i, elt) {
        overwrite_description(elt, command, "response");
    });
}

function highlightCommandInMenu(command_name) {
    $sidebar.find("li.active").parentsUntil('#sidebar').andSelf().removeClass('active');
    $sidebar.find("a[data-command='" + command_name + "']").parent("li").parentsUntil('#sidebar').addClass('open').andSelf().addClass('active');
}

function overwrite_description(element, command, division) {
    var $elt = $(element);

    // Base path
    var path_arr = [];

    var current = $elt.parent();
    while (current.length > 0) {
        path_arr.push(current.siblings(".param_key").children(".blue").text());
        current = current.parent().closest(".param_value").siblings(".param_description");
    }
    path_arr.push(division, command);

    var path = path_arr.reverse().join(".");

    if (api_description_overrides[path]) {
        $elt.text(api_description_overrides[path]);
    }

    $elt.attr("data-description-path", path);

    $elt.removeClass("to_check_for_rewrite");
}

function refresh_content(com_name) {
    build_inner_objects(4);

    // inject commands-external-data array values as example content for section commands.
    _process_examples();

    //render supporting external files in chapters
    $('.file-content').each(function (index) {
        if ($(this).text().length) { //has file content
            $(this).load('dynamic/' + $(this).text() + " .content");
        }
    });

    $("div > div > table.table:visible").find("> tbody > tr > td > div.collapse, > div.more > div.collapse").each(resizeCollapsible);

    return true;
}

function resizeCollapsible () {
    var BOOTSTRAP_TABLE_MIN_WIDTH = 700;
    var BOOTSTRAP_TD_PADDING = 8;

    var $this = $(this);
    var $parent = $this.parent();
    var $container = $this.closest("table.table");
    var containerOffset = $container.offset();
    var maxright = containerOffset.left + $container.width();
    if (maxright < containerOffset.left + BOOTSTRAP_TABLE_MIN_WIDTH) {
        maxright = containerOffset.left + BOOTSTRAP_TABLE_MIN_WIDTH;
    }

    var collapseWidth = maxright - $parent.offset().left;

    if (collapseWidth < BOOTSTRAP_TABLE_MIN_WIDTH) {
        collapseWidth = BOOTSTRAP_TABLE_MIN_WIDTH;
    }

    $this.css("width", (collapseWidth - BOOTSTRAP_TD_PADDING) + "px");
    $this.css("min-width", (BOOTSTRAP_TABLE_MIN_WIDTH - BOOTSTRAP_TD_PADDING) + "px");
}
