window.JST = window.JST || {};

function parseParams() {
	var params = {};
    var qs = window.location.search;
    if (qs && qs.length > 0) {
        var paramsArray = qs.replace(/^\?/,"").split("&");
        for (var i = 0; i < paramsArray.length; i++) {
            var nameValPair = paramsArray[i].split("=");
            var name = nameValPair[0];
            var value = nameValPair.length > 1 ? decodeURIComponent(nameValPair[1].replace(/\+/g," ")) : "";
            params[name] = value;
        }
    }
    return params;
}

function categoryPage() {
    var params = parseParams();
    var services = {
        "messagechannel":"categorypage",
    }
    requestHelpService(params, services, function(data) {
        document.location = data;
    });
}

function topnav(page,type) {
    var url = page + window.location.search;
    if (type) {
        url += "&type=" + type;
    }
    document.location = url;
}

function createAncestorHtml(leftNavData, baseUrl) {
    return JST['left_nav_ancestors']({"leftNavData" : leftNavData, "baseUrl" : baseUrl});
}

function createLeftNavHtml(leftNavData, baseUrl) {
    return JST['leftnav_item']({"leftNavData" : leftNavData, "baseUrl" : baseUrl});
}

function createFilterHtml(filterName, filter, labels, baseUrl) {
    return JST['nav_filter']({"filterName" : filterName, "filter" : filter , "labels" : labels, "baseUrl" : baseUrl});
}

function createFilterDetailHtml(filterDetailArray) {
    return JST['nav_filter_detail']({"filters" : filterDetailArray});
}

function createMessagesHtml(messages) {
    return JST['topnav_messages']({"messages":messages});
}

JST['left_nav_ancestors'] = _.template(
  '<%_.each(leftNavData.ancestors, function(category) { %>' +
    '<li><a href="<%=buildTopNavUrl(baseUrl,category.urlinfo)%>"><%=category.name%></a></li>' +
  '<% }); %>'
);

JST['leftnav_item'] = _.template(
  '<div class="search_refine">' +
    '<h3><%= getLocalizedString("topnav_header_category") %></h3>' +
    '<div id="nav_categories" style="max-height:350px;overflow-y:auto;">' +
    '<ul class="nav_toc" id="nav_siblings">' +
    '<% _.each(leftNavData.siblingCategories, function(category) { %>' +
      '<li class="<% if (category.selected) { %>active"<% } %>">' +
      '<a href="<%= buildTopNavUrl(category.helpdir + baseUrl,category.urlinfo) %>">'+
      '<span class="refine_type_count"><%= category.count %></span>' +
      '<%= category.name %></a></span>' +
      '<% if (category.children && category.children.length > 0) { %>' +
        '<ul>' +
        '<% _.each(category.children, function(child) { %>' +
          '<li><a href="<%= buildTopNavUrl(baseUrl,child.urlinfo) %>">' +
            '<span class="refine_type_count"><%= child.count %></span>' +
          '<%= child.name %></a></li>' +
        '<% }); %>' +
        '</ul>' +
      '<% } %>' +
      '</li>' +
    '<% }); %>' +
    '</ul>' +
    '</div>' +
  '</div>'
);

JST['nav_filter_detail'] = _.template(
  '<% _.each(filters, function(filter) { %>' +
    '<div class="search_refine">' +
    '<h3><%= getFilterHeader(filter.type) %></h3>' +
    '<ul class="list-unstyled">' +
    '<% _.each(filter.values, function(filterVal) { %>' +
      '<% var label = getFilterLabel(filterVal.value); %>' +
      '<li class="<%= filter.display %><% if (filterVal.selected) { %> active<% } %>">' +
        '<span class="refine_type_count"><%= filterVal.count %></span>' +
        '<label><input type="<%= filter.display %>" name="<%= filter.type %>" ' +
        '<% if (filterVal.selected) { %>checked<% } %> ' +
        'value="<%= filterVal.value %>" onchange="updateFilters();" class="filtercheckbox"><%= label %></label>' +
      '</li>' +
    '<% }); %>' +
  '<% }); %>'
);

JST['nav_filter'] = _.template(
  '<div class="search_refine">' +
  '<ul class="nav_toc">' +
  '<% _.each(filter, function(filterVal) { %>' +
    '<% var label = labels[filterVal.value] ? labels[filterVal.value] : filterVal.value; %>' +
    '<li class="<% if (filterVal.selected) { %>active<% } %>">' +
       '<span class="refine_type_count"><%= filterVal.count %></span>' +
      '<label><input type="checkbox" name="<%= filterName %>" ' +
      '<% if (filterVal.selected) { %>checked<% } %> ' +
      'value="<%= filterVal.value %>" onchange="updateFilters();" class="filtercheckbox"><%= label %></label>' +
    '</li>' +
  '<% }); %>'
);

JST['topnav_messages'] = _.template(
  '<% _.each(messages, function(message) { %>' +
    '<div class="alert alert-info">' +
      '<span class="alert_icon icon-alert-info-reverse"></span>' +
      '<p><%= getLocalizedString(message.key) %></p>' +
    '</div>' +
  '<% }); %>'
)

function buildTopNavUrl(baseUrl, overrides) {
    var params = parseParams();
    if (overrides) {
        $.extend(params, overrides);
    }
    var qs = $.param(params);
    return baseUrl + "?" + qs;
}

function updateTopNavLinks(params) {
    var links = $(".crux_nav").find("a");
    links.each(function(i,link) {
        var href = $(link).attr("href");
        if (i == 0) {
            // This is the link to the category page...
            href = (params.category || "index") + ".html";
        } else {
            href += href.indexOf('?') > 0 ? '&' : '?';
            href += $.param(params);
        }
        $(link).attr("href", href);
    });
}

function updateFilters() {
    var filters = {};
    var params = parseParams();
    $(".filtercheckbox").each(function(i,box) {
        var name = box.name;
        delete params[name];
        if (box.checked) {
            if (filters[name]) {
                filters[name] = filters[name] + "," + box.value;
            } else {
                filters[name] = box.value;
            }
        }
    });
    $.extend(params, filters);
    var url = document.location.href.replace(location.search, "") + "?" + $.param(params);
    document.location = url;
}

function selectTopNavLink(linkType) {
    $(".crux_nav").find("li").removeClass("crux_nav_active");
    $("#crux_nav_" + linkType).addClass("crux_nav_active");
}

function populateH1Tag(catName, typeLabel) {
    var h1Text = (catName && catName.length > 0) ? catName + " &mdash; " + typeLabel : typeLabel;
    $("#pgtype-category h1").html(h1Text);
    $("title").html(h1Text);
}

function getLabelForType(type) {
    return $("#crux_nav_" + type + " a").html();
}

function getFilterLabel(id) {
    var label = getLocalizedString("topnav_filter_" + id);
    return label ? label : id;
}

function getFilterHeader(filterName) {
    var label = getLocalizedString("topnav_filter_header_" + filterName);
    return label ? label : filterName;
}

function handleNoResults(catName, relatedCategories) {
    var noResultsContent = $("<div></div>");
    var header = $("<strong></strong>");
    var headerText = getLocalizedString("topnav_no_results_header").replace(/\{0\}/, catName);
    header.html(headerText);
    noResultsContent.append(header);
    
    if (relatedCategories.length > 0) {
        var relatedCatsHeader = $("<div></div>");
        relatedCatsHeader.html(getLocalizedString("topnav_related_results"));
        
        var relatedCats = $("<ul></ul>");
        relatedCategories.forEach(function(relatedCat) {
            var relatedCatLi = $("<li></li>");
            var catLink = $("<a></a>");
            catLink.attr("href", buildTopNavUrl(document.location.pathname, {"category":relatedCat.id}));
            catLink.html(relatedCat.name);
            relatedCatLi.append(catLink);
            relatedCatLi.append(" (" + relatedCat.count + ")");
            relatedCats.append(relatedCatLi);
        });

        noResultsContent.append(relatedCatsHeader);
        noResultsContent.append(relatedCats);
    }
    return noResultsContent;
}

function findDocRoot() {
    var docRootMatches = document.location.href.match(/^.*\/help(\/releases\/R20\d\d[ab])?/);
    return docRootMatches.length > 0 ? docRootMatches[0] : "/help";
}