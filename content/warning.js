/*
	warning.js
	Copyright © 2006 - 2014  WOT Services Oy <info@mywot.com>

	This file is part of WOT.

	WOT is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WOT is distributed in the hope that it will be useful, but WITHOUT
	ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
	License for more details.

	You should have received a copy of the GNU General Public License
	along with WOT. If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

const WOT_WARNING_CSS = "@import \"chrome://wot/skin/include/warning.css\";";

var wot_warning =
{
	minheight: 600,
	width: 390,
	exit_mode: "back",
	is_blocked: false,
    warned: {},
	current_tab: null,  // hostname + tabIndex to understand, whether the warning already updated for the tab

    make_categories_block: function (categories, options) {

        var tmpl = '';
//        console.log("make_categories_block", categories);

        if (!wot_util.isEmpty(categories)) {
            var lst = [],
                ordered_cats = wot_categories.rearrange_categories(categories).all;
            for (var k in ordered_cats) {
                var cat = ordered_cats[k], cid = cat.id,
                    cconf = wot_util.get_level(WOT_CONFIDENCELEVELS, cat.c).name,
                    css = wot_categories.get_category_css(cid),
                    cat_name = wot_categories.get_category_name(cid),
                    li = "<li class='cat-item " + css + " " + cconf + "'>" + cat_name + "</li>";
                if (cat_name) {
                    lst.push(li);
                }
            }

            tmpl = "<div class='ws-categories-title'>{REASONTITLE}</div>" +
                "<ul id='ws-categories-list'>" +
                lst.join("") +
                "</ul>";
        }

        return tmpl;

    },

    make_blacklists: function(blacklists, options) {

        var bl = blacklists || [],
            tmpl = "";

        if (bl && bl.length > 0) {
            tmpl = "<div class='wot-blacklisting-info'>" +
                "<div class='wot-blacklist'>" +
                "<div class='wot-bl-decoration'>" +
                "<div class='wot-comp-icon wot-bl-decoration-donut' r='{RATING0}'></div>" +
                "</div>";

            // the blacklist is unordered. We can order it in later versions by time or by risk level.
            for (var i = 0, bl_type=""; i < 5; i++) {
                if (bl.length > i) {
                    bl_type = wot_util.getstring("bl_" + bl[i].type);
                    bl_type = bl_type ? bl_type : wot_util.getstring("bl_other");

                    tmpl += "<div class='wot-bl-verdict'>" + bl_type + "</div>"
                } else {
                    tmpl += "<div class='wot-bl-verdict empty'></div>";
                }
            }

            tmpl += "</div></div>";
        }

        return tmpl;
    },

	make_warning: function(categories, blacklists, options)
	{
		var wot_warning =
            "<div id='wotcontainer' class='wotcontainer {CLASS} {ACCESSIBLE} {BL_OR_REP} notranslate'>" +
			    "<div class='wot-logo'></div>" +
			    "<div class='wot-warning'>{WARNING}</div>" +
			    "<div class='wot-title'>{TITLE}</div>" +
                "<div id='wot-wt-warning-wrapper' style='display: none;'>" +
                    "<div class='wot-wt-warning-content'>" +
                        "<div id='wt-logo' class='wot-wt-logo'>&nbsp;</div>" +
                        "<div>{WT_CONTENT}</div>" +
                        "<div><label><input id='wt-warn-turnoff' type='checkbox' class='wot-checkbox' /> {WT_WARN_TURNOFF}</label></div>" +
                        "<div class='wot-wt-warn-footer'>" +
                            "<div id='wt-warn-ok' class='wot-wt-button wot-wt-warn-button'>{WT_BUTTON}</div>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
                "<div class='wot-desc'>{DESC}</div>" +

                this.make_blacklists(blacklists, options) +

                "<div class='wot-rep-components-wrapper'>" +
                    "<div class='wot-rep-components'>" +
                        "<div class='wot-component'>" +
                            "<div class='wot-comp-name'>{RATINGDESC0}</div>" +
                            "<div class='wot-rep-data'>" +
                                "<div class='wot-comp-icon' r='{RATING0}'></div>" +
                                "<div class='wot-comp-conf' c='{CONFIDENCE0}'></div>" +
                                "<div class='rating-legend-wrapper'>" +
                                    "<div class='rating-legend' r='{RATING0}'>{RATINGEXPL0}</div>" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                        "<div class='wot-component'>" +
                            "<div class='wot-comp-name'>{RATINGDESC4}</div>" +
                                "<div class='wot-rep-data'>" +
                                    "<div class='wot-comp-icon' r='{RATING4}'></div>" +
                                    "<div class='wot-comp-conf' c='{CONFIDENCE4}'></div>" +
                                    "<div class='rating-legend-wrapper'>" +
                                        "<div class='rating-legend' r='{RATING4}'>{RATINGEXPL4}</div>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                "</div>" +
                "<div class='ws-categories-area'>" +

                    this.make_categories_block(categories, options) +

                "</div>"+
                "<div class='wot-openscorecard-wrap'>" +
                    "<span class='wot-openscorecard'>{INFO}</span>" +
                "</div>" +
                "<div id='wot-warn-ratings'></div>" +
                "<div class='wot-rateit-wrap'>" +
                    "<span>{RATETEXT}</span>" +
                "</div>" +
                "<div class='wot-buttons'>";

        if(!this.is_blocked) {
            // don't show "Goto the site" button in "Blocked" mode
            wot_warning += "<div id='wot-btn-hide' class='wot-button'>{GOTOSITE}</div>";
        }

        wot_warning += "<div id='wot-btn-leave' class='wot-button'>{LEAVESITE}</div>" +
            "</div>" +
            "</div>";

        return wot_warning;
	},

	load_delayed: function(blocked)
	{
		this.is_blocked = !!blocked || false;
		try {
			if (this.warned && !this.is_blocked) {
				return;
			}

			this.warned = {};
		} catch (e) {
			wot_tools.wdump("wot_warning.load: failed with " + e);
		}
	},

	processhtml: function(html, replaces)
	{
		try {
			for (var i = 0; i < replaces.length; ++i) {
				html = html.replace(
							RegExp("{" + replaces[i][0] + "}", "g"),
							replaces[i][1]);
			}

			return html;
		} catch (e) {
			dump("wot_warning.processhtml: failed with " + e + "\n");
		}

		return null;
	},

	isblocking: function()
	{
		// decides whether we must block page or just warn
		var blocking = false;
		try {
			for (var i = 0, a = 0; i < WOT_COMPONENTS.length; ++i) {
                a = WOT_COMPONENTS[i];
				if (wot_prefs["warning_type_" + a] == WOT_WARNING_BLOCK) {
					blocking = true;
					break;
				}
			}
		} catch (e) {
			dump("wot_warning.isblocking: failed with " + e + "\n");
		}
		return blocking;
	},

	getwarningtype: function(hostname, app, reason)
	{
		try {
			if (!wot_prefs["show_application_" + app]) {
				return WOT_WARNING_NONE;
			}

			var type = wot_prefs["warning_type_" + app];

			if (type == WOT_WARNING_NONE) {
				return WOT_WARNING_NONE;
			}

			var min_confidence = wot_prefs.min_confidence_level;
			var level = wot_prefs["warning_level_" + app];
			var r = wot_cache.get(hostname, "reputation_" + app);
			var c = wot_cache.get(hostname, "confidence_" + app);
			var x = wot_cache.get(hostname, "excluded_" + app);
			var t = -1;

			if (wot_cache.get(hostname, "status") == WOT_QUERY_OK) {
				t = wot_cache.get(hostname, "testimony_" + app);
			}

			var unknown = wot_prefs["warning_unknown_" + app];

			var rr = x ? 0 : r;
			var cc = x ? level : c;

			if (((rr >= 0 && r <= level && (cc >= min_confidence || unknown)) ||
					(rr < 0 && unknown)) &&
				  (t < 0 || t <= level)) {
				if (r < 0) {
					return (reason) ? WOT_REASON_UNKNOWN : type;
				} else {
					return (reason) ? WOT_REASON_RATING : type;
				}
			} else if (t >= 0 && t <= level) {
				return (reason) ? WOT_REASON_TESTIMONY : type;
			}
		} catch (e) {
			dump("wot_warning.getwarningtype: failed with " + e + "\n");
		}

		return WOT_WARNING_NONE;
	},

	isdangerous: function(hostname, increase)
	{
		var result = WOT_WARNING_NONE;
		try {
			if (!wot_cache.isok(hostname)) {
				return result;
			}

			for (var i = 0, a = 0; i < WOT_COMPONENTS.length; ++i) {
                a = WOT_COMPONENTS[i];
				var type = wot_warning.getwarningtype(hostname, a, false);

				if (type > result) {
					result = type;
				}

				if (result == WOT_WARNING_BLOCK) {
					break;
				}
			}

			if (result == WOT_WARNING_NOTIFICATION ||
					result == WOT_WARNING_DOM) {
				var warned = wot_cache.get(hostname, "warned");

				if (warned >= WOT_MAX_WARNINGS) {
					result = WOT_WARNING_NONE;
				} else if (increase) {
					wot_cache.set(hostname, "warned", warned + 1);
				}
			}
		} catch (e) {
			dump("wot_warning.isdangerous: failed with " + e + "\n");
		}
		return result;
	},

	domcontentloaded: function(event)
	{
		try {
			if (!event || !wot_util.isenabled()) {
				return;
			}

            try {   // Workaround to resolve "TypeError: can't access dead object" at start of the browser
                if (!event.originalTarget) { return; }
            } catch (e) { return; }

			var content = event.originalTarget;

            // Don't show warnings in frames
            if (!content || !content.defaultView || content.defaultView != content.defaultView.top ) {
                return;
            }

			if (!content.location || !content.location.href || wot_url.isprivate(content.location.href)) {
				return;
			}

			var hostname = wot_url.gethostname(content.location.href);

			if (wot_warning.isdangerous(hostname, false) == WOT_WARNING_DOM && !wot_warning.warned[hostname]) {
				wot_warning.add_overlay(hostname, content, WOT_WARNING_DOM, false);
			}
		} catch (e) {
			dump("wot_warning.domcontentloaded: failed with " + e + "\n");
		}
	},

	getheight: function(content)
	{
		try {
			if (content.defaultView && content.defaultView.innerHeight) {
				return content.defaultView.innerHeight;
			}

			if (content.clientHeight) {
				return content.clientHeight;
			}

			if (content.body && content.body.clientHeight) {
				return content.body.clientHeight;
			}
		} catch (e) {
			dump("wot_warning.getheight: failed with " + e + "\n");
		}
		return -1;
	},

	getwarning: function () {
		return document.getElementById("wot-warning");
	},

	set_exitmode: function(content)
	{
		var window = content.defaultView;
		var steps_back = this.is_blocked ? 2 : 1; // when mode is Blocking, there are at least 2 steps in history
		if(window.history.length > steps_back) {
			wot_warning.exit_mode = "back"; // note: don't change this string, there are code dependent on it
		} else {
			wot_warning.exit_mode = "leave";
		}
		return wot_warning.exit_mode;
	},

	getposition: function (container, warning) {

		if (!container || !warning) return null;

		var nbox = gBrowser.getNotificationBox(),
			offsetY = 28;

		if (nbox && !nbox.notificationsHidden && nbox.currentNotification) {
			offsetY = nbox.currentNotification.clientHeight > 0 ? nbox.currentNotification.clientHeight + 3 : offsetY;
		}

		var warning_width = this.width,
			height = container.clientHeight;

		return {
			anchor: container,
			warning: warning,
			x: - warning_width / 2,
			y: offsetY,
			height: height
		}
	},

	get_tabtarget: function () {
		var tab = getBrowser().selectedTab;
		return wot_core.hostname + "@@" + tab.tabIndex;
	},

	add: function(hostname, content, type, blocking_mode) {
		if (window.windowState === 2) { // Main window is minimized - hide the warning popup
			this.hide(content);
		} else {

			if (wot_warning.current_tab != wot_warning.get_tabtarget()) {
				if (this.update_content(hostname, content, type, blocking_mode)) {
					this.show();

				} else {
					// if updating content was unsuccessful, don't show the warning popup
					this.hide(content);
				}
			}
		}
	},

	add_overlay: function (hostname, content, type, forced_reason) {
		// Attach the Shader to the current website
		var content_body = content.getElementsByTagName("body");

		content_body = content_body.length > 0 ? content_body[0] : null;

		if (content_body &&
			content.contentType &&
			content.contentType.toLowerCase().indexOf("html") >= 0) {

			var overlay = content.createElement("div");
			overlay.setAttribute("id", "wot-overlay"); // FIXME: the ID should be random

			// set style
			var opacity = 0;
			if (wot_prefs.warning_opacity &&
				wot_prefs.warning_opacity.length > 0 &&
				Number(wot_prefs.warning_opacity) >= 0 &&
				Number(wot_prefs.warning_opacity) <= 1) {
				opacity = wot_prefs.warning_opacity;
			}

			var style = [
				"position: fixed",
				"left: 0",
				"top: 0",
				"height: 100%",
				"width: 100%",
				"margin: 0",
				"display: block",
				"cursor: default",
				"-moz-user-select: none",
				"user-select: none",
				"z-index: 2147483647",
				"background-color: #000000",
				"opacity: " + opacity
			];

			var style_str = style.join(" !important;");
			overlay.setAttribute("style", style_str);

			content_body.appendChild(overlay);

			/* Flash has authority issues with z-index, so try to hide it
			 while warning is being shown (skip on "blocked!" page) */
			if (forced_reason === false) this.hideobjects(content, true);
		}
	},

	open_popup: function (warning, anchor, x, y) {
		// fix height + popup open
		warning.height = 10;
		// position the popup and make it visible if it is not yet
		warning.openPopup(anchor, "topcenter topleft", x, y, false, false, null);  // show it

	},

	show: function () {

		var x, y,
			warning = this.getwarning(),
			anchor = wot_core.browser; // area where a website is shown

		if (!warning || !anchor) return false;

		// get center position offset
		var pos = this.getposition(anchor, warning);
		if (!pos) return false;
		x = pos.x;
		y = pos.y;

		if (warning.state != "open") {  // to avoid flickering
			warning.style.visibility = "hidden";    // workaround to hide resizing
			this.open_popup(warning, anchor, x, y);

			// workaround to fix the height after the browser was terminated & restored
			window.setTimeout(function () {
				wot_warning.update_size();
				warning.style.visibility = "visible";
			}, 120);

		} else {
			this.open_popup(warning, anchor, x, y);
			wot_warning.update_size();
			warning.style.visibility = "visible";
		}

		// remember current "warning in the tab" to avoid unnecessary updates
		wot_warning.current_tab = wot_warning.get_tabtarget();

		return true;
	},

	blur: function (hide) {
		// used when the browser is minimized or lost focus therefor warning popup should not be visible
		if (window.windowState === 2 || hide) {
			wot_warning.hide(null, false);
		} else {
			wot_status.update();
		}
	},

	hide: function(content, hide_notification)
	{
		try {
			wot_warning.current_tab = null; // clear the tab-warning state
			// hide warning floating panel
			var warning = this.getwarning();
			warning.hidePopup();

			// hide warning notification
			if (hide_notification !== false) wot_browser.hide_warning();

			// hide shader from the webpage
			if (content) {
				var elems = [ content.getElementById("wot-overlay") ];

				for (var i = 0; i < elems.length; ++i) {
					if (elems[i] && elems[i].parentNode) {
						elems[i].parentNode.removeChild(elems[i]);
					}
				}
			}
		} catch (e) {
			dump("wot_warning.hide: failed with " + e + "\n");
		}
	},

	update_size: function () {
		var warning = this.getwarning(),
			warning_frame = document.getElementById("wot-warning-frame");

		if (!warning || !warning_frame || !warning_frame.contentDocument) return false;

		var doc = warning_frame.contentDocument,
			height = doc.documentElement ? doc.documentElement.scrollHeight : 0;

		warning.height = height;
		warning_frame.height = height;
	},

	update_content: function (hostname, content, type, blocking_mode)
	{

		try {
			if (!hostname || !content) {
				return false;
			}

			// If is set, no need to decide what kind of warning to show.
			blocking_mode = blocking_mode || false;

			if(!blocking_mode) wot_warning.set_exitmode(content); // call it only in usual mode

            var reason = WOT_WARNING_NONE,
                normalized_target = wot_cache.get(hostname, "normalized", hostname),
                accessible = wot_prefs.accessible ? " accessible" : "";

            var categories = wot_categories.target_categories(hostname),
                blacklists = wot_categories.target_blacklists(hostname),
                warning_options = {};

            var is_blacklisted = blacklists && blacklists.length > 0;

            // preprocess link "Rate the site"
            var rate_site = wot_util.getstring("warnings_ratesite").replace("<a>", "<a id='wotrate-link' class='wot-link'>"),
                wt_text = wot_util.getstring("wt_warning_text") || "";

            var info_link = is_blacklisted ? wot_util.getstring("bl_information") : wot_util.getstring("warnings_information");
            if (info_link.indexOf("<a>") < 0) {
                info_link = "<a>" + info_link + "</a>";
            }
            info_link = info_link.replace("<a>", "<a id='wotinfobutton' class='wot-link'>");

			var replaces = [
                /* Static strings */
                [ "INFO", info_link  ],
                [ "BL_OR_REP", is_blacklisted ? "blacklist": "reputation" ],
                [ "RATINGDESC0", wot_util.getstring("components_0") ],
                [ "RATINGDESC4", wot_util.getstring("components_4") ],
                [ "GOTOSITE", wot_util.getstring("warnings_goto") ],
                [ "WARNING", blocking_mode ? wot_util.getstring("warnings_blocked") : wot_util.getstring("warnings_warning") ],
                [ "RATETEXT", rate_site ],
                [ "WT_CONTENT", this.processhtml(wt_text, [ "WT_LEARNMORE", wot_util.getstring("wt_learnmore_link") ])],
                [ "REASONTITLE", wot_util.getstring("warnings_reasontitle") ],
                [ "NOREASONTITLE", wot_util.getstring("warnings_noreasontitle") ],

				/* Dynamic strings */
                [ "TITLE",      (wot_shared.decodehostname(normalized_target) || "").replace(/[<>&="']/g, "") ],
				[ "LEAVESITE",  wot_util.getstring("warnings_" + wot_warning.exit_mode) ],
                [ "ACCESSIBLE", accessible ]
			];

            var warning_template = this.make_warning(wot_categories.select_identified(categories), blacklists, warning_options);

			for (var j = 0; j < WOT_COMPONENTS.length; ++j) {

                var i = WOT_COMPONENTS[j];
				// don't call getwarningtype() if forced_reason is provided
				var t = blocking_mode ? WOT_WARNING_NONE : this.getwarningtype(hostname, i, true);

				var r = wot_cache.get(hostname, "reputation_" + i),
				    x = wot_cache.get(hostname, "excluded_" + i),
                    c = wot_cache.get(hostname, "confidence_" + i);

				if (blocking_mode) {
					reason = blocking_mode;
				} else {
					reason = (reason < t) ? t : reason;
				}


				var rep_l = wot_util.get_level(WOT_REPUTATIONLEVELS, r),
                    r_level = rep_l.level,
                    r_name = rep_l.name;

				if (r_level >= 0) {
					replaces.push([ "RATING" + i, r_name ]);
					replaces.push([ "RATINGEXPL" + i, wot_util.getstring("reputationlevels_" + r_name) ]);
                    replaces.push([ "CONFIDENCE" + i, wot_util.get_level(WOT_CONFIDENCELEVELS, c).name ]);

				} else if (x) {
					replaces.push([ "RATING" + i, "rx" ]);
					replaces.push([ "RATINGEXPL" + i, "&nbsp;" ]);
                    replaces.push([ "CONFIDENCE" + i, "c0" ]);
				}
			}

			var notification;
			var warnclass = "";

			if (this.getheight(content) < this.minheight) {
				warnclass = "wotnoratings";
			}

            if (is_blacklisted) { // If warning should show Blacklisted status
                replaces.push([ "CLASS", warnclass ]);

                var bl_description = blacklists.length == 1 ? wot_util.getstring("bl_description") : wot_util.getstring("bl_description_pl");
                notification = bl_description;
                replaces.push([ "DESC", bl_description ]);

            } else { // if Warning should show reputation reason

                if (reason == WOT_REASON_UNKNOWN) {
                    warnclass += " wotunknown";
                }

                if (reason == WOT_REASON_RATING) {
                    notification = wot_util.getstring("warnings_message_reputation");
                    replaces.push([ "CLASS", warnclass ]);
                    replaces.push([ "DESC", wot_util.getstring("warnings_reputation") ]);
                } else if (reason == WOT_REASON_TESTIMONY) {
                    notification = wot_util.getstring("warnings_message_rating");
                    replaces.push([ "CLASS", "wotnoratings" ]);
                    replaces.push([ "DESC", wot_util.getstring("warnings_rating") ]);
                } else {
                    notification = wot_util.getstring("warnings_unknown");
                    replaces.push([ "CLASS", warnclass ]);
                    replaces.push([ "DESC", wot_util.getstring("warnings_unknown") ]);
                }
            }

			/* Show the notification bar always */
			if (reason != WOT_REASON_UNKNOWN) {
				window.setTimeout(wot_browser.show_notification,
					WOT_DELAY_WARNING, hostname, notification, true);
			}

			// exit here if all we need is to show notification, or user was already warned before and decide to proceed
			if ((type != WOT_WARNING_DOM && type != WOT_WARNING_BLOCK) || this.warned[hostname]) {
				return false;
			}

			// now build the DOM of the warning

			var warning_frame = document.getElementById("wot-warning-frame");
			if (!warning_frame) return false;
			warning_frame.height = 0;   // reset the height (will be set later)

			var warning_content = warning_frame.contentDocument;

			var head = warning_content.getElementsByTagName("head");
			var body = warning_content.getElementsByTagName("body");

			if (!head || !head.length ||
				!body || !body.length) {
				return false;
			}

			if (!warning_content.getElementById("warning-style")) {
				// add style only if it is not there yet
				var style = warning_content.createElement("style");

				if (!style) {
					return false;
				}

				style.setAttribute("type", "text/css");
				style.setAttribute("id", "warning-style");
				style.innerHTML = WOT_WARNING_CSS;

				head[0].appendChild(style);
			}

			var wrapper = warning_content.getElementById("wotwrapper");
			if (!wrapper) {
				wrapper = warning_content.createElement("div");
				if (!wrapper) {
					return false;
				}
				wrapper.setAttribute("id", "wotwrapper");
				body[0].appendChild(wrapper);
			}

            wrapper.innerHTML = this.processhtml(warning_template, replaces);

			// setup listeners
			var lmap = [
				["wotrate-link", "click", wot_warning.on_ratelink_click ],
				["wot-btn-hide", "click", wot_warning.on_btnhide_click ],
				["wot-btn-leave", "click", wot_warning.on_btnleave_click ],
				["wotinfobutton", "click", wot_warning.on_info_click ]
			];

			for (var l=0; l < lmap.length; l++) {
				var elemid = lmap[l][0],
					listener = lmap[l][2],
					event = lmap[l][1];

				var elem = warning_content.getElementById(elemid);
				if (elem) {
					elem.addEventListener(event, listener, false);
				}
			}

			if (blocking_mode) {
				// Update the blocking mode page
				content.title = "WOT: " + wot_util.getstring("warnings_blocked");

				var btn_hide = warning_content.getElementById("wot-btn-hide");
				if (btn_hide) btn_hide.style.display = "none"; // hide "Open the site" in blocking mode
			}

			return true;

		} catch (e) {
			dump("wot_warning.add: failed with " + e + "\n");
		}

		return false;
	},

	hideobjects: function(content, hide)
	{
		try {
			var i,j;
			var win = content.defaultView;

			if (win && win.frames) {
				var frames = win.frames;
				for (j = 0; j < frames.length; ++j) {
					if (frames[j].document) {
						this.hideobjects(frames[j].document, hide);
					}
				}
			}

			var elems = [ "embed", "object", "iframe", "applet" ];

			for (i = 0; i < elems.length; ++i) {
				var objs = content.getElementsByTagName(elems[i]);

				for (j = 0; objs && j < objs.length; ++j) {
					if (hide) {
						objs[j].setAttribute("wothidden",
							objs[j].style.display || "block");
						objs[j].style.display = "none";
					} else {
						var display = objs[j].getAttribute("wothidden");
						if (display) {
							objs[j].removeAttribute("wothidden");
							objs[j].style.display = display;
						}
					}
				}
			}
		} catch (e) {
			dump("wot_warning.hideobjects: failed with " + e + "\n");
		}
	},

	on_ratelink_click: function (event) {
		wot_browser.openscorecard(wot_core.hostname, WOT_SCORECARD_RATE, WOT_URL_WARNRATE);
	},

	on_btnhide_click: function (event) {
		var content = getBrowser().selectedBrowser.contentDocument;
		if (content) {
			wot_warning.warned[wot_core.hostname] = true;
			wot_warning.hide(content);
		}
	},

	on_btnleave_click: function (event) {
		var content = getBrowser().selectedBrowser.contentDocument;

		if (!content) return;

		var wot_blocked = content.getElementById("wotblocked"); // Important to have element with this ID
		var is_blocked = !!wot_blocked;
		if(is_blocked) {
			this.exit_mode = wot_blocked.getAttribute("exit_mode"); // take exit_mode from DOM, since this is module
		}

		var win = content.defaultView;
		if(wot_warning.exit_mode == "leave") {
			// close tab
			win.close();
		} else {
			var e_beforeunload = win.onbeforeunload;
			var back_timer = null;
			win.onbeforeunload = function() {
				if(back_timer) {
					win.clearTimeout(back_timer);
				}
				if(e_beforeunload) e_beforeunload(win);
			};

			var steps_back = is_blocked ? -2 : -1;
			var prev_location = win.location.href;
			win.history.go(steps_back);

			back_timer = win.setTimeout(function() {
				// this is a trick: we don't know if there is a back-step possible if history.length>1,
				// so we simply wait for a short time, and if we are still on a page, then "back" is impossible and
				// we should go to blank page
				if(win.location.href == prev_location) win.close();
			}, 500);
		}
	},

	on_info_click: function (event) {
		wot_browser.openscorecard(wot_core.hostname, null, WOT_URL_WARNVIEWSC);
	}
};

wot_modules.push({ name: "wot_warning", obj: wot_warning });
