import { _status, game, get, lib, ui } from "noname";
import { security } from "@/util/sandbox.js";

/**
 * @typedef {import("../index.js").Library["message"]["client"]} ClientMsgs
 */
/**
 * @template THIS
 * @typedef {<P extends any[], K extends keyof ClientMsgs>(
 * ...args:
 * | [func: (...args: P) => any, ...P]
 * | [msg: K , ...Parameters<ClientMsgs[K]>, ...any[]]
 * ) => THIS
 * } ClientSend
 */
export class Client {
	/**
	 * @param {import('../index.js').NodeWS | InstanceType<typeof import('ws').WebSocket> | Client} ws
	 * @param {boolean} temp
	 */
	constructor(ws, temp = false) {
		if (ws instanceof Client) {
			throw new Error("Client cannot copy.");
		}
		this.ws = ws;
		/**
		 * @type { string }
		 */
		// @ts-expect-error ignore
		this.id = ws.wsid || get.id();
		this.closed = false;

		if (!temp) {
			this.sandbox = security.createSandbox(this.id);
			if (this.sandbox) {
				Reflect.defineProperty(this, "sandbox", {
					value: this.sandbox,
					writable: false,
					configurable: false,
				});
				Reflect.defineProperty(this.sandbox, "client", {
					value: this,
					writable: false,
					configurable: false,
				});
			}
		}
	}
	/**
	 * @type {ClientSend<this>}
	 */
	send() {
		if (this.closed) {
			return this;
		}
		var args = Array.from(arguments);
		if (typeof args[0] == "function") {
			args.unshift("exec");
		}
		for (var i = 1; i < args.length; i++) {
			args[i] = get.stringifiedResult(args[i]);
		}
		try {
			this.ws.send(JSON.stringify(args));
		} catch (e) {
			this.ws.close();
		}
		return this;
	}
	/**
	 * @type {boolean | undefined}
	 */
	inited;
	/** @type {string | undefined} */
	rematchPlayer;
	midgamePending = false;
	midgameLoading = false;
	/** @type {string | undefined} */
	midgameToken;
	sendMidgameSeats(players, changed = false) {
		const seats = players
			.map(player => {
				const characters = [player.name1, player.name2].filter((name, index) => name && !player.isUnseen(index));
				return {
					id: player.playerid,
					seat: Number(player.dataset.position) + 1,
					name: characters.length ? characters.map(name => get.plainText(get.translation(name))).join(" / ") : "未亮将",
					portrait: characters[0],
				};
			})
			.sort((a, b) => a.seat - b.seat);
		this.send("midgameSeats", seats, changed, Boolean(lib.configOL.observe));
	}
	sendMidgameState() {
		this.midgameLoading = true;
		this.send("reinit", lib.configOL, get.arenaState(), game.getState ? game.getState() : {}, game.ip, null, _status.onreconnect, _status.cardtag, _status.postReconnect, {
			id: this.id,
			token: this.midgameToken,
			phase: game.phaseNumber,
			currentPlayer: _status.currentPhase?.playerid,
		});
	}
	startObserving(nickname) {
		lib.node.observing.push(this);
		this.send("reinit", lib.configOL, get.arenaState(), game.getState ? game.getState() : {}, game.ip, game.players[0].playerid, null, _status.cardtag, _status.postReconnect);
		const name = get.plainText(nickname);
		game.log("玩家 ", `#y${name}`, " 进入房间观战");
		game.me.chat(`玩家 <span style="font-weight: bold; color: rgb(126, 180, 255)">${name}</span> 进入房间观战`);
		if (!ui.removeObserve) {
			ui.removeObserve = ui.create.system(
				"移除旁观",
				function () {
					lib.configOL.observe = false;
					if (game.onlineroom) {
						game.send("server", "config", lib.configOL);
					}
					while (lib.node.observing.length) {
						lib.node.observing.shift().ws.close();
					}
					this.remove();
					delete ui.removeObserve;
				},
				true,
				true
			);
		}
	}
	close() {
		if (this.closed) {
			return this;
		}
		lib.node.clients.remove(this);
		lib.node.observing.remove(this);
		if (ui.removeObserve && !lib.node.observing.length) {
			ui.removeObserve.remove();
			delete ui.removeObserve;
		}
		this.closed = true;
		if (_status.waitingForPlayer) {
			for (var i = 0; i < game.connectPlayers.length; i++) {
				if (game.connectPlayers[i].playerid == this.id) {
					game.connectPlayers[i].uninitOL();
					delete game.connectPlayers[i].playerid;
				}
			}
			if (game.onlinezhu == this.id) {
				game.onlinezhu = null;
			}
			game.updateWaiting();
		} else if (lib.playerOL[this.id] && lib.playerOL[this.id].ws === this) {
			var player = lib.playerOL[this.id];
			var nickname = get.plainText(player.nickname);
			player.setNickname(player.nickname + " - 离线");
			// @ts-expect-error ignore
			game.broadcast(function (player) {
				player.setNickname(player.nickname + " - 离线");
			}, player);
			game.log("玩家 ", `#y${nickname}`, " 已离线，等待重连");
			game.me.chat(`玩家 <span style="font-weight: bold; color: rgb(126, 180, 255)">${nickname}</span> 已离线，等待重连`);
			player.unwait("ai");
		}
		return this;
	}
}
