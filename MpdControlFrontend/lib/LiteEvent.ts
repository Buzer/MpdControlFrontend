// Taken from http://stackoverflow.com/questions/12881212/does-typescript-support-events-on-classes
// Original author: http://stackoverflow.com/users/162273/uosa
// License: CC BY-SA 3.0  <http://creativecommons.org/licenses/by-sa/3.0/>

interface ILiteEvent<T> {
    on(handler: { (data?: T): void });
    off(handler: { (data?: T): void });
}

class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }) {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        if (this.handlers) {
            this.handlers.forEach(h => h(data));
        }
    }
}
