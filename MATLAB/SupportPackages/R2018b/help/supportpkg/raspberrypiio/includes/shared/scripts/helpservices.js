window.initDeferred = $.Deferred();
window.helpService = {
    "callbacks" : {},
    
    "callMessageService" : function(channel, data, callback) {
        var msgDeferred = $.Deferred();
        msgDeferred.then(callback);
        var id = channel + "_" + window.performance.now();
        
        this.registerCallbackDeferred(msgDeferred, id);
        var messageObj = {
            "channel" : channel,
            "data" : data,
            "id" : id
        };
        helpserviceIframePostMessage(messageObj);
    },

    "registerCallbackDeferred" : function(deferredObj, id) {
        var cb = this.callbacks;
        cb[id] =  deferredObj;
        
        setTimeout(function() {
            if (cb[id] && deferredObj.state() === "pending") {
                delete cb[id];
                deferredObj.reject();
            }
        }, 10000);
    },

    "docDomRequestHandler" : {
        back: function () {
            window.history.back();
        },
        forward: function () {
            window.history.forward();
        },
        find: function (msgEvt) {
            var strFound = window.find(msgEvt.data.findstring, msgEvt.data.casesensitive, msgEvt.data.backwards, true);
            var id = "docinfo_" + new Date().getTime();
            var messageObj = {
                "domchannel" : 'domeventinfo',
                "domevent": 'findresponse',
                "eventData" : '',
                "id" : id
            };
            if (!strFound) {
                messageObj['eventData'] = 'false';
            } else {
                messageObj['eventData'] = 'true';
            }
            helpserviceIframePostMessage(messageObj);
        },
        clearselection: function () {
            if (window.getSelection) {
                if (window.getSelection().empty) {  // Chrome
                    window.getSelection().empty();
                } else if (window.getSelection().removeAllRanges) {  // Firefox
                    window.getSelection().removeAllRanges();
                }
            } else if (document.selection) {  // IE?
                document.selection.empty();
            }
        },
        print: function(msgEvt) {
            var messageObj = {
                "domchannel" : 'domeventinfo',
                "domevent": 'printresponse',
                "eventData" : msgEvt.data.id
            };
            helpserviceIframePostMessage(messageObj);
            window.print();
        }
    },

    "receiveMessage" : function(msgEvt) {
        var id = msgEvt.data.id;
        if (this.callbacks[id]) {
            this.callbacks[id].resolve(msgEvt.data.data);
            delete this.callbacks[id];
        }

        if (msgEvt.data.domchannel) {
            if (msgEvt.data.domchannel === "domeventinfo") {
                if (msgEvt.data.domevent) {
                    this.docDomRequestHandler[msgEvt.data.domevent](msgEvt);
                }
            }
        }
    }
};

$(document).ready(initHelpServices);

function initHelpServices() {
    if (window.parent && window.parent.location !== window.location) {
        window.helpserviceframe = window.parent;
        // We are in an iframe, presumably the JavaScript Help Browser's
        // help panel.
        if (isFromMatlabOnline()) {
            $(window).bind('examples_cards_added', function(e) {
              $('.card_container a[href^="matlab:"]').off('click');
              registerMatlabOnlineCommandDialogAction();
            });

            registerMatlabOnlineCommandDialogAction();
        } else {
            
            handleContextMenu();
            handleDomKeyDown();
            handleDocLinksClick();
            registerUninstalledDocLink();
            handleMouseOverAndOutOnLink();
            registerWindowOnLoadAction();
            setupFinished();
            handleWindowOpen();
        }
    } else if (window.location.origin.match(/^https?:\/\/localhost.*/)) {
        // This looks like local doc served by the connector but not
        // in the JavaScript Help Browser.
        window.helpserviceframe = createHelpServiceFrame();
        handleDocLinksClick();
    }
}

function handleContextMenu() {
    var contextMenuAction = function (e) {
        var id = "docinfo_" + new Date().getTime();

        var selectedText = getSelectedText();
        var selectedUrl = getSelectedUrl(e.target);
        if (_isEnglishRedirect(selectedUrl)) {
            selectedUrl = _replaceEnglishRoute(selectedUrl);
        } else {
            selectedUrl = _normalizeEnglishRoute(selectedUrl);
        }

        var pageUrl = window.location.href;
        pageUrl = _normalizeEnglishRoute(pageUrl);

        var messageObj = {
            "domchannel" : 'domeventinfo',
            "title" : window.document.title,
            "url": pageUrl,
            "domevent": 'contextmenu',
            "eventData" : {
                "pageX": e.pageX,
                "pageY": e.pageY,
                "clientX": e.clientX,
                "clientY": e.clientY,
                "selectedText": selectedText,
                "selectedUrl": selectedUrl
            },
            "id" : id
        };
        e.preventDefault();
        helpserviceIframePostMessage(messageObj);
    };

    $('body').contextmenu(contextMenuAction);
}

function handleDomKeyDown() {
    var keyDownAction = function (e) {
        var id = "docinfo_" + new Date().getTime();

        var nativeEvent = document.createEvent("HTMLEvents");
        nativeEvent.initEvent('keydown', !!e.bubbles, !!e.cancelable);
        // and copy all our properties over
        for(var i in e){
            nativeEvent[i] = e[i];
        }

        var selectedText = getSelectedText();
        var selectedUrl = getSelectedUrl(e.target);

        if (_isEnglishRedirect(selectedUrl)) {
            selectedUrl = _replaceEnglishRoute(selectedUrl);
        } else {
            selectedUrl = _normalizeEnglishRoute(selectedUrl);
        }

        var pageUrl = window.location.href;
        pageUrl = _normalizeEnglishRoute(pageUrl);

        nativeEvent['selectedText'] = selectedText;
        nativeEvent['selectedUrl'] = selectedUrl;

         var nativeEventObj = JSON.parse(simpleStringify(nativeEvent));

        var messageObj = {
            "domchannel" : 'domeventinfo',
            "title" : window.document.title,
            "url": pageUrl,
            "domevent": 'keydown',
            "eventData" : nativeEventObj,
            "id" : id
        };

        helpserviceIframePostMessage(messageObj);
        
    };
    window.addEventListener("keydown", keyDownAction);
}

function simpleStringify (object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) === 'object'){
            continue;
        }
        if (typeof(object[prop]) === 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return JSON.stringify(simpleObject); // returns cleaned up JSON
}

// TODO: This function similar with handleDocLinksClick, but for MATLAB Online
// callMessageService would not do the right thing.
function registerMatlabOnlineCommandDialogAction() {
  $('a[href^="matlab:"]').on('click', function (e) {
      e.preventDefault();
      var href = $(this).attr('href'),
      match = href.match(/matlab:(.*)/),
      matlabCommand = null;

      if (match) {
        matlabCommand = match[1];
      }

      if (matlabCommand) {
        var id = "matlabcolone_" + new Date().getTime();
        var messageObj = {
            "domchannel" : 'matlabcolon',
            "matlabcommand" : matlabCommand,
            "id" : id
        };
        helpserviceIframePostMessage(messageObj);
        }
  });
}

function registerWindowOnLoadAction() {
    window.addEventListener('load', function (e) {
        if (window.parent && window.parent.location !== window.location) {
            // We are in an iframe, presumably the JavaScript Help Browser's
            // help panel.
            var id = "docinfo_" + new Date().getTime();
            var htmlSource = document.getElementsByTagName('html')[0].outerHTML;
            var pageUrl =  window.location.href;
            pageUrl = _normalizeEnglishRoute(pageUrl);
            var messageObj = {
                "domchannel" : 'domeventinfo',
                "domevent" : 'onload',
                "title" : window.document.title,
                "url": pageUrl,
                "htmlsource": htmlSource,
                "id" : id
            };

            helpserviceIframePostMessage(messageObj);
        }
    }, {once: true});
}

(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate === "function") {
            history.onpushstate({state: state});
        }
        // ... whatever else you want to do
        // maybe call onhashchange e.handler
        if (window.parent && window.parent.location !== window.location) {
            // We are in an iframe, presumably the JavaScript Help Browser's
            // help panel.
            var id = "docinfo_" + new Date().getTime();
            var messageObj = {
                "domchannel" : 'domeventinfo',
                "domevent" : 'historystatechange',
                "id" : id
            };
            helpserviceIframePostMessage(messageObj);
        }
        return pushState.apply(history, arguments);
    }
})(window.history);

function handleWindowOpen() {
    window.open = function(url, name, features) {
        if (url) {
            callMessageService("windowopen", {"link":url}, function() {});
        }
    };
}

function handleMouseOverAndOutOnLink() {
    $(window).bind("mouseenter", "a", mouseOnLinkEventHandler);
    $(window).bind("mouseleave", "a", mouseOnLinkEventHandler);
}

function mouseOnLinkEventHandler(evt) {
    if (evt.target) {
        var href = getSelectedUrl(evt.target);
        if (href) {
            callMessageService(event.type +"link", {"link":href}, function() {});
        }
    }
}

function helpserviceIframePostMessage(msgObject) {
    if (window.helpserviceframe) {
        window.helpserviceframe.postMessage(msgObject, '*');
    }
}

//-------------- Start: Dom Access Helper functions ----------------------

function getSelectedText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (window.document.selection
        && window.document.selection.type !== "Control") {
        text = window.document.selection.createRange().text;
    }
    return text;
}

function getSelectedUrl(targetNode) {
    var link = "";
    if (targetNode) {
        var cur = targetNode;
        while(cur && !isAnchor(cur)) { //keep going up until we find a match
            cur = cur.parentElement; //go up
        }

        if (cur && cur.href) {
            return cur.href;
        }
    }
    return link;
}

function isAnchor(el) {
    var selector = "a";
    return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector
    || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
}
//-------------- End: Dom Access Helper functions ----------------------

function createHelpServiceFrame() {
    var ifrm = document.createElement("iframe");
    var hsUrl = window.location.origin + "/ui/help/helpbrowser/helpbrowser/helpservices.html";
    ifrm.setAttribute("src", hsUrl);
    ifrm.setAttribute("onLoad", "setupFinished();");
    ifrm.style.width = "0px";
    ifrm.style.height = "0px";
    document.body.appendChild(ifrm);
    return $(ifrm).get(0).contentWindow;
}

function handleDocLinksClick() {
   $(window).bind("click","a",function(evt) {
       if (evt.target) {
           var href = getSelectedUrl(evt.target);
           if (href) {
               var currentPageHost = window.location.host;
               var currentPageProtocol = window.location.protocol;
               var pageUrl = window.location.href;
               pageUrl = _normalizeEnglishRoute(pageUrl);

               if (href && href.match(/^\s*matlab:.*/)) {
                   evt.preventDefault();
                   var messageObj = {
                       "url" : href,
                       "currenturl" : pageUrl
                   };
                   callMessageService("matlab", messageObj, function() {});
               } else if (href
                   && (href.indexOf(currentPageProtocol) < 0 || href.indexOf(currentPageHost) < 0)
                   && href.indexOf('http') === 0) {
                   evt.preventDefault();
                   callMessageService("externalclick", {"url":href}, function() {});
               } else if (evt.target.target && evt.target.target === '_blank') {
                   evt.preventDefault();
                   var openNewTabMsgObj = {
                       "openaction" : 'newtab',
                       "openurl" : href
                   };
                   callMessageService("openbrowserstrategy", openNewTabMsgObj, function() {});
               } else if (evt.which === 2) { // this mean middle mouse click
                   evt.preventDefault();
                   var openNewTabMsgObj = {
                       "openaction" : 'newtab',
                       "openurl" : href
                   };
                   callMessageService("openbrowserstrategy", openNewTabMsgObj, function() {});
               } else if (_isEnglishRedirect(href)) {
                   evt.originalEvent.target.href = _replaceEnglishRoute(href);
               } else if (_isEnglishRoute(href)) {
                   evt.originalEvent.target.href = _normalizeEnglishRoute(href);
               }
           }
       }
    });
}

function registerUninstalledDocLink() {
    $("a").bind("click", handleUninstalledDocLink);
}

function handleUninstalledDocLink(evt) {
    var href = $(this).attr("href");
    if (href) {
        evt.preventDefault();
        var services = {
            "messagechannel":"doclink"
        };
        var aTag = this;

        if (requestHelpService) {
            requestHelpService({"source":document.location.href, "target":aTag.href}, services, function(response) {
                if (response.response === "ok") {
                    $(aTag).unbind("click");
                    aTag.click();
                } else {
                    var messageObj = {
                        "domchannel" : 'domeventinfo',
                        "domevent": 'pagenotinstalled',
                        "weburl" : response.data
                    };
                    helpserviceIframePostMessage(messageObj);
                }
            });
        }
    }
}

// this method only used when initial click on the link with 'lang=en' parameter
function _isEnglishRedirect(href) {
    return href && href.indexOf('lang=en') >= 0 && _isLocalConnectorUrl(href);
}

function setupFinished() {
    window.initDeferred.resolve();
    window.addEventListener("message", function(msgEvt) {
        this.helpService.receiveMessage(msgEvt);
    });
}

function _isEnglishRoute(href) {
    return href && href.indexOf('/static/en/help/') >= 0 && _isLocalConnectorUrl(href);
}

function _isLocalConnectorUrl(url) {
    if (!url) {
        return url;
    }

    return url.indexOf('https://localhost') >= 0;
}

function _replaceEnglishRoute(url) {
    if (!url) {
        return url;
    }
    return url.replace(/\/static\/help\//, '/static/en/help/');
}

function _normalizeEnglishRoute(url) {
    if (!url) {
        return url;
    }
    return url.replace(/\/static\/en\/help\//, '/static/help/');
}

function requestHelpService(params, services, callback, errorhandler) {
    var servicePrefs;
    try {
        servicePrefs = $.parseJSON(sessionStorage.getItem("help_preferred_services"));
    } catch (e) {
        servicePrefs = null;
    }
    
    if (!servicePrefs) {
        // TODO: We must be able to do better here.
        if (window.helpserviceframe && _isLocalConnectorUrl(window.location.href)) {
            callMessageService("servicepref", document.location.href, function(data) {
                sessionStorage.setItem("help_preferred_services", JSON.stringify(data));
                doServiceRequest(data, params, services, callback, errorhandler);
            });
        } else {
            var servicePrefs = document.location.protocol.match(/https?/) ? ["webservice","requesthandler"] : ["requesthandler"];
            sessionStorage.setItem("help_preferred_services", JSON.stringify(servicePrefs));
            doServiceRequest(servicePrefs, params, services, callback, errorhandler);
        }
    } else {
        doServiceRequest(servicePrefs, params, services, callback, errorhandler);
    }
}

function doServiceRequest(servicePrefs, params, services, callback, errorhandler) {
    for (var i = 0; i < servicePrefs.length; i++) {
        var svc = servicePrefs[i];
        if (services[svc]) {
            // TODO: It would be great to detect errors and continue falling back.
            switch (svc) {
                case "messagechannel" :
                    var channel = services[svc];
                    callMessageService(channel, params, callback);
                    return;
                case "webservice" :
                    var url = services.webservice;
                    var qs = $.param(params);
                    if (qs && qs.length > 0) {
                        url += url.indexOf("?") > 0 ? "&" : "?";
                        url += qs;
                    }
                    jqxhr = $.get(url);
                    jqxhr.done(callback);
                    if (errorhandler) {
                        jqxhr.fail(errorhandler);
                    }
                    return;
                case "requesthandler" :
                    var requestHandlerUrl = services.requesthandler + "?" + $.param(params);
                    document.location = requestHandlerUrl;
                    return;
            }
        }
    }
}

function callMessageService(channel, data, callback) {
    window.initDeferred.done(function() {
        window.helpService.callMessageService(channel, data, callback);
    });
}

function loadUrl(url) {
    document.location = url;
}

function isFromMatlabOnline() {
   var cookieRegexp = /MW_Doc_Template="?([^;"]*)/;
   var cookies = document.cookie;
   var matches = cookieRegexp.exec(cookies);
   if (matches != null && matches.length > 0) {
       var docCookie = matches[1];
       var parts = docCookie.split(/\|\|/);
       if (parts[0].indexOf("ONLINE") !== -1) {
           return true;
       }
   } 
   return false;
}
