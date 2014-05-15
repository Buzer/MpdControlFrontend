define(["require", "exports"], function(require, exports) {
    /*
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    /**
    * EventDispatcher (TypeScript)
    * - Simple extendable event dispatching class
    *
    * @version 0.1.5
    * @author John Vrbanac
    * @license MIT License
    **/
    var Event = (function () {
        function Event(type, targetObj) {
            this._type = type;
            this._target = targetObj;
        }
        Event.prototype.getTarget = function () {
            return this._target;
        };

        Event.prototype.getType = function () {
            return this._type;
        };
        return Event;
    })();
    exports.Event = Event;

    var EventDispatcher = (function () {
        function EventDispatcher() {
            this._listeners = [];
        }
        EventDispatcher.prototype.hasEventListener = function (type, listener) {
            var exists = false;
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === type && this._listeners[i].listener === listener) {
                    exists = true;
                }
            }

            return exists;
        };

        EventDispatcher.prototype.addEventListener = function (typeStr, listenerFunc) {
            if (this.hasEventListener(typeStr, listenerFunc)) {
                return;
            }

            this._listeners.push({ type: typeStr, listener: listenerFunc });
        };

        EventDispatcher.prototype.removeEventListener = function (typeStr, listenerFunc) {
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === typeStr && this._listeners[i].listener === listenerFunc) {
                    this._listeners.splice(i, 1);
                }
            }
        };

        EventDispatcher.prototype.dispatchEvent = function (evt) {
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === evt.getType()) {
                    this._listeners[i].listener.call(this, evt);
                }
            }
        };
        return EventDispatcher;
    })();
    exports.EventDispatcher = EventDispatcher;
});
//# sourceMappingURL=EventDispatcher.js.map
