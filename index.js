/**
 * Description: index.js
 * Author: crossjs <liwenfu@crossjs.com>
 * Date: 2014-12-18 09:59:22
 * Fork: https://github.com/gazira/action
 */

'use strict';

var $ = require('jquery');
var Events = require('nd-events');

var cache = [];

var actionKeyVal = 'data-action';
var actionKeySplitter = /\s+/;

var ACTION_NS = 'action-ns';

function bindContext(events, context) {
  var __events = events.__events;

  $.each(__events, function(actionKey, arr) {
    $.each(arr, function(index) {
      if (index % 2 === 1) {
        arr[index] = context;
      }
    });
  });
}

function bindAction(events, notEvents, actions) {
  $.each(actions, function(actionKey, action) {
    var parsedAction = {};

    if ($.isFunction(action)) {
      parsedAction.is = action;
    } else {
      parsedAction = action;
      parsedAction.is || (parsedAction.is = parsedAction.callback);
    }

    $.each(parsedAction, function(aspect, actionCallback) {
      if ($.isFunction(actionCallback)) {
        events.on(aspect + ':' + actionKey, actionCallback);
      }
    });

    // 如果存在not事件，绑定默认事件
    if ($.isFunction(parsedAction.not)) {
      events.on('is:' + actionKey, function(e) {
        notEvents[actionKey] = {
          actionNode: e.actionNode
        };
      });
    }
  });
}

function triggerEvent(events, e) {
  return events.trigger(e.actionAspect + ':' + e.actionKey, e);
}

function findIndex(node, type) {
  var i, n = cache.length;

  for (i = 0; i < n; i++) {
    if (node === cache[i].dom && type === cache[i].eventType) {
      return i;
    }
  }

  return -1;
}

module.exports = {

  setActionKey: function(key) {
    actionKeyVal = key;
    this.setActionKey = null;
  },

  setActionKeySplitter: function(key) {
    actionKeySplitter = key;
    this.setActionKeySplitter = null;
  },

  /**
   * 利用冒泡来做监听，这样做有以下优势：
   *     1. 减少事件绑定数量，提高程序效率，尤其在列表性质的节点上，无需每个节点都绑定
   *     2. 动态生成的内容无需绑定事件也能响应
   *     3. 节点外点击隐藏某些节点
   * @param actions {Object} 响应类型与对应处理事件，
   *     键：是事件源上的data-action属性
   *     值：可能是下面两种格式：
   *         function：回调函数，当事件源触发时候执行该函数，函数的this是事件源的jQuery节点，参数是事件对象
   *         object：对象，包含两个属性：
   *             before：在is回调函数之前执行，this是事件源的jQuery节点，参数是事件对象, 返回false则不调用is
   *             is：回调函数，事件源触发时候执行，this是事件源的jQuery节点，参数是事件对象
   *             after：在is回调函数之后执行，this是事件源的jQuery节点，参数是事件对象
   *             not：点击在其他节点上时执行的回调函数，this是事件源的jQuery节点，参数是事件对象,
   *                  return false将不会移除回调函数;其他return值会或没有return则移除not回调
   *             callback： 同is
   * @param node {Object} jQuery对象，绑定的节点，是父容器
   * @param type 事件类型，默认是click，基本也都是处理click事件
   * @return {object} jQuery对象，父节点
   */
  listen: function(actions, node, type) {
    actions || (actions = {});

    node = node ? $(node) : $(document);
    type = (type ||'click') + '.' + ACTION_NS;

    var index = findIndex(node[0], type);

    if (index === -1) {
      var actionItem = {
        dom: node[0],
        eventType: type,
        events: new Events(),
        notEvents: {}
      };

      var events = actionItem.events;
      var notEvents = actionItem.notEvents;

      bindAction(events, notEvents, actions);

      node.on(type, function(e) {
        var target = $(e.target);
        var actionNode = target.closest('[' + actionKeyVal + ']');
        var actionKeys = $.trim(actionNode.attr(actionKeyVal));

        var contextBinded = false;

        // 返回
        if (!actionKeys && $.isEmptyObject(notEvents)) {
          return;
        }

        // 遍历 notEvents 如果新对象不是原先触发的对象则触发 not 事件
        $.each(notEvents, function(actionKey, notEvent) {
          if (actionNode[0] !== notEvent.actionNode[0]) {
            $.extend(e, {
              actionNode: notEvent.actionNode,
              actionKey: actionKey,
              actionAspect: 'not'
            });

            if (!contextBinded) {
              bindContext(events, target);
              contextBinded = true;
            }

            if (triggerEvent(events, e) !== false) {
              delete notEvents[actionKey];
            }
          }
        });

        if (actionKeys) {

          if (!contextBinded) {
            bindContext(events, target);
            contextBinded = true;
          }

          actionKeys = actionKeys.split(actionKeySplitter);
          $.each(actionKeys, function(_index, actionKey) {
            $.extend(e, {
              actionNode: actionNode,
              actionKey: actionKey,
              actionAspect: 'before'
            });

            if (triggerEvent(events, e) !== false) {
              e.actionAspect = 'is';
              triggerEvent(events, e);

              e.actionAspect = 'after';
              triggerEvent(events, e);
            }
          });
        }
      });

      cache.push(actionItem);
    } else {
      bindAction(cache[index].events, cache[index].notEvents, actions);
    }

    return node;
  },

  cache: function() {
    return cache;
  },

  empty: function() {
    var n = cache.length, item;

    while (n--) {
      item = cache[n];
      $(item.dom).off(item.eventType);
    }

    // reset
    cache = [];
  }
};
