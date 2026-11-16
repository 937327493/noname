import { lib, _status } from "noname";

export default class PauseManager {
	pause = new Deferred();
	pause2 = new Deferred();
	pause3 = new Deferred();
	over = new Deferred();
	delay = new Deferred();
	#delayList: Promise<void>[] = [];

	setDelay(promise: Promise<void>) {
		if (!this.delay.isStarted) {
			this.delay.start();
		}
		const newValue = promise.then(() => {
			if (!this.#delayList.includes(newValue)) {
				return;
			}
			this.#delayList.remove(newValue);
			if (this.#delayList.length === 0) {
				this.delay.resolve();
			}
		});
		this.#delayList.push(newValue);
		return newValue;
	}

	async waitPause() {
		if (_status.paused2 || _status.imchoosing) {
			if (!lib.status.dateDelaying) {
				lib.status.dateDelaying = new Date();
			}
		}
		await Promise.all([this.pause, this.pause2, this.pause3, this.over, this.delay].filter(i => i.isStarted));
		if (lib.status.dateDelaying) {
			lib.status.dateDelayed += lib.getUTC(new Date()) - lib.getUTC(lib.status.dateDelaying);
			delete lib.status.dateDelaying;
		}
	}
}

class Deferred {
	#promise: Promise<void> | null;
	#resolver: (() => void) | null;
	// resolve() 后允许立即 start()，延迟执行的微任务只能处理它捕获的那一轮状态
	#resolved = false;
	get isStarted() {
		return !!this.#promise && !this.#resolved;
	}
	start() {
		if (this.isStarted) {
			return;
		}
		({ promise: this.#promise, resolve: this.#resolver } = Promise.withResolvers());
		this.#resolved = false;
	}
	resolve() {
		if (!this.#promise || this.#resolved) {
			return;
		}
		const promise = this.#promise;
		const resolver = this.#resolver;
		this.#resolved = true;
		Promise.resolve()
			.then(() => resolver && resolver())
			.then(() => {
				if (this.#promise === promise) {
					this.#promise = null;
					this.#resolver = null;
				}
			});
	}
	then(onfulfilled?: ((value: void) => void | PromiseLike<void>) | null, onrejected?: ((reason: any) => never | PromiseLike<never>) | null) {
		if (!this.#promise) {
			return Promise.resolve().then(onfulfilled, onrejected);
		}
		return this.#promise.then(onfulfilled, onrejected);
	}
}
