'use strict';

var Action = require('../index');
var $ = require('jquery');
var expect = require('expect.js');

/*globals describe,it,afterEach*/

describe('Action', function() {
  var elem,
    body = $(document.body),
    triggerCount = 0;

  afterEach(function() {
    Action.empty();
    if (elem) {
      elem.remove();
      elem = null;
    }
    triggerCount = 0;
  });

  describe('normal usage', function() {

    it('should trigger action when click', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: function(e) {
          expect(this[0]).to.be(elem[0]);
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        }
      });

      elem.trigger('mousedown');
      expect(triggerCount).to.be(0);

      elem.trigger('click');
      expect(triggerCount).to.be(1);
    });

    it('should trigger action when dblclick', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: function(e) {
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        }
      }, null, 'dblclick');

      elem.trigger('click');
      expect(triggerCount).to.be(0);

      elem.trigger('dblclick');
      expect(triggerCount).to.be(1);
    });

    it('should trigger action when hover', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: function(e) {
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        }
      }, null, 'mouseover');

      elem.trigger('click');
      expect(triggerCount).to.be(0);

      elem.trigger('mouseover');
      expect(triggerCount).to.be(1);

      elem.trigger('mouseover');
      expect(triggerCount).to.be(2);
    });

    it('should trigger multiple actions when click', function() {
      elem = $('<span data-action="alert confirm"><span>')
        .appendTo(body);

      Action.listen({
        alert: function(e) {
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        },
        confirm: function(e) {
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('confirm');
          triggerCount++;
        }
      });

      elem.trigger('click');
      expect(triggerCount).to.be(2);
    });

    it('should bind action twice', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: function(e) {
          expect(this[0]).to.be(elem[0]);
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        }
      });

      Action.listen({
        alert: function(e) {
          expect(this[0]).to.be(elem[0]);
          expect(e.actionNode[0]).to.be(elem[0]);
          expect(e.actionKey).to.be('alert');
          triggerCount++;
        }
      });

      expect(Action.cache().length).to.be(1);

      Action.listen({
        confirm: function(e) {
          expect(this[0]).to.be(elem2[0]);
          expect(e.actionNode[0]).to.be(elem2[0]);
          expect(e.actionKey).to.be('confirm');
          triggerCount++;
        }
      });

      expect(Action.cache().length).to.be(1);

      var elem2 = $('<span data-action="confirm"><span>')
        .appendTo(body);

      elem.trigger('click');
      expect(triggerCount).to.be(2);

      elem2.trigger('click');
      expect(triggerCount).to.be(3);

      Action.listen({
        confirm: function(e) {
          expect(this[0]).to.be(elem2[0]);
          expect(e.actionNode[0]).to.be(elem2[0]);
          expect(e.actionKey).to.be('confirm');
          triggerCount++;
        }
      });

      elem2.trigger('click');
      expect(triggerCount).to.be(5);

      elem2.remove();
      elem2 = null;
    });

  });

  describe('before and after', function() {

    it('should trigger aspect actions when click', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: {
          before: function() {
            triggerCount++;
          },
          is: function() {
            triggerCount++;
          },
          after: function() {
            triggerCount++;
          }
        }
      });

      elem.trigger('click');
      expect(triggerCount).to.be(3);

      elem.trigger('click');
      expect(triggerCount).to.be(6);
    });

  });

  describe('is and not', function() {

    it('should not trigger action.not when click inside', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: {
          is: function() {
            triggerCount++;
          },
          not: function() {
            triggerCount--;
          }
        }
      });

      elem.trigger('click');
      expect(triggerCount).to.be(1);

      elem.trigger('click');
      expect(triggerCount).to.be(2);
    });

    it('should never trigger action.not when never click inside', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: {
          is: function() {
            triggerCount++;
          },
          not: function() {
            triggerCount--;
          }
        }
      });

      body.trigger('click');
      expect(triggerCount).to.be(0);

      body.trigger('click');
      expect(triggerCount).to.be(0);
    });

    it('should only trigger action.not once when click outside', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: {
          is: function() {
            triggerCount++;
          },
          not: function() {
            triggerCount--;
            // 执行一次后移除
            // return (not false);
          }
        }
      });

      elem.trigger('click');
      expect(triggerCount).to.be(1);

      body.trigger('click');
      expect(triggerCount).to.be(0);

      body.trigger('click');
      expect(triggerCount).to.be(0);
    });

    it('should always trigger action.not when click outside', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: {
          is: function() {
            triggerCount++;
          },
          not: function() {
            triggerCount--;
            // 不移除
            return false;
          }
        }
      });

      elem.trigger('click');
      expect(triggerCount).to.be(1);

      body.trigger('click');
      expect(triggerCount).to.be(0);

      body.trigger('click');
      expect(triggerCount).to.be(-1);
    });
  });

  describe('empty', function() {

    it('should empty cache', function() {
      elem = $('<span data-action="alert"><span>')
        .appendTo(body);

      Action.listen({
        alert: function() {
          triggerCount++;
        }
      });

      elem.trigger('click');

      expect(triggerCount).to.be(1);
      expect(Action.cache().length).to.be(1);

      Action.empty();

      elem.trigger('click');

      expect(triggerCount).to.be(1);
      expect(Action.cache().length).to.be(0);
    });
  });

});
