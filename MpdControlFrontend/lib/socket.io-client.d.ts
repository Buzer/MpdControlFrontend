// Type definitions for socket.io nodejs client
// Project: http://socket.io/
// Definitions by: Maido Kaara <https://github.com/v3rm0n>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Small edits done by Eljas Alakulppi <https://github.com/Buzer> for MpdControlFrontend


// This project is licensed under the MIT license.
// Copyrights are respective of each contributor listed at the beginning of each definition file.

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


declare var io: {
connect(host: string, details?: any): Socket;
}

interface EventEmitter {
    emit(name: string, ...data: any[]): any;
    on(ns: string, fn: Function): EventEmitter;
    addListener(ns: string, fn: Function): EventEmitter;
    removeListener(ns: string, fn: Function): EventEmitter;
    removeAllListeners(ns: string): EventEmitter;
    once(ns: string, fn: Function): EventEmitter;
    listeners(ns: string): Function[];
}

interface SocketNamespace extends EventEmitter {
    of(name: string): SocketNamespace;
    send(data: any, fn: Function): SocketNamespace;
    emit(name: string): SocketNamespace;
}

interface Socket extends EventEmitter {
    of(name: string): SocketNamespace;
    connect(fn: Function): Socket;
    packet(data: any): Socket;
    flushBuffer(): void;
    disconnect(): Socket;
}
