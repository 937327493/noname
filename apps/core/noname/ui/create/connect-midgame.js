import { game, ui } from "noname";

export function showMidgameSeats(seats, changed, canObserve) {
	let dialog = ui.midgameSeats;
	if (!dialog) {
		dialog = document.createElement("dialog");
		dialog.className = "connect-midgame-dialog";
		dialog.setAttribute("aria-labelledby", "connect-midgame-title");
		dialog.innerHTML = `
			<form>
				<h2 id="connect-midgame-title">中途加入</h2>
				<p role="status"></p>
				<fieldset aria-label="选择人机角色"></fieldset>
				<footer>
					<button type="button" value="leave">离开房间</button>
					<button type="button" value="observe" hidden>旁观</button>
					<button type="submit" disabled>接管角色</button>
				</footer>
			</form>`;
		const form = dialog.querySelector("form");
		const submit = form.querySelector("button[type=submit]");
		form.addEventListener("change", () => {
			submit.disabled = false;
		});
		form.addEventListener("submit", event => {
			event.preventDefault();
			const selected = new FormData(form).get("seat");
			if (selected) {
				form.querySelector("fieldset").disabled = true;
				submit.disabled = true;
				dialog.querySelector("p").textContent = "正在接管角色…";
				game.send("takeMidgameSeat", selected);
			}
		});
		form.querySelector("button[value=leave]").addEventListener("click", () => game.ws?.close());
		form.querySelector("button[value=observe]").addEventListener("click", () => game.send("takeMidgameSeat", null));
		dialog.addEventListener("cancel", event => {
			event.preventDefault();
			game.ws?.close();
		});
		ui.midgameSeats = dialog;
		ui.window.append(dialog);
		dialog.showModal();
	}

	const list = dialog.querySelector("fieldset");
	list.disabled = false;
	dialog.querySelector("button[value=observe]").hidden = !canObserve;
	dialog.querySelector("button[type=submit]").disabled = true;
	dialog.querySelector("p").textContent = !seats.length ? "当前没有可接管的人机角色。" : changed ? "该座位已不可接管，请重新选择。" : "选择一名人机角色，接手其当前牌局。";
	list.replaceChildren(
		...seats.map(seat => {
			const label = document.createElement("label");
			const input = document.createElement("input");
			input.type = "radio";
			input.name = "seat";
			input.value = seat.id;
			const portrait = document.createElement("div");
			portrait.className = "connect-midgame-portrait";
			portrait.setAttribute("aria-hidden", "true");
			if (seat.portrait) {
				portrait.setBackground(seat.portrait, "character");
			}
			const text = document.createElement("span");
			const name = document.createElement("strong");
			name.textContent = seat.name;
			const position = document.createElement("small");
			position.textContent = `${seat.seat} 号位 · 人机`;
			text.append(name, position);
			label.append(input, portrait, text);
			return label;
		})
	);
}
