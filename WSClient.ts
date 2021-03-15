export class WSClient extends WebSocket {
	constructor(url: string) {
		super(url);

		this.onmessage = (evt) => {
			this.handlers[evt.data.e]?.forEach((f) => f(evt.data.p));
		};
	}

	/** Every event can have many handlers */
	handlers: { [event: string]: Function[] } = {};

	/** Sends json to a defined event */
	sendJson<T = any>(event: string, data: T): void {
		this.send(JSON.stringify({ e: event, p: data }));
	}

	/** Sends json to a defined event, expecting a message in return with the same event name */
	sendJsonWithAck<T, R>(event: string, data: T): Promise<R> {
		const listenOncePromise = this.listenOnce<R>(event);
		this.sendJson(event, data);
		return listenOncePromise;
	}

	/** Listens on an event once */
	listenOnce<R>(event: string, timeoutInMs = 30000): Promise<R> {
		let unsubscribe: Function;
		return new Promise<R>((resolve, reject) => {
			setTimeout(reject, timeoutInMs);
			unsubscribe = this.listen<R>(event, (d) => {
				resolve(d);
				unsubscribe();
			});
		});
	}

	/** Starts listeninig for an event */
	listen<R>(event: string, cb: (d: R) => void): () => void {
		const chandlers = this.chanHandlers(event);
		const idxToRemove = chandlers.length;
		chandlers.push(cb);
		const unsubscribe = () => chandlers.splice(idxToRemove, 1);
		return unsubscribe;
	}

	/** Returns a reference to a certain channel array of handlers */
	private chanHandlers(event: string): Function[] {
		if (!this.handlers[event]) this.handlers[event] = [];
		return this.handlers[event];
	}
}
