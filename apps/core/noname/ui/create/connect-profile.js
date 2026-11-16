import { game, get, lib, ui } from "noname";

export function createConnectProfileButton() {
	if (ui.system2.querySelector(".connect-profile-button")) {
		return;
	}
	const button = ui.create.system(
		"个人信息",
		event => {
			event.stopPropagation();
			openConnectProfile();
		},
		true
	);
	button.classList.add("connect-profile-button");
	button.tabIndex = 0;
	button.setAttribute("role", "button");
	button.setAttribute("aria-haspopup", "dialog");
	button.addEventListener("keydown", event => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();
			openConnectProfile();
		}
	});
}

function openConnectProfile() {
	if (document.querySelector(".connect-profile-dialog")) {
		return;
	}
	const dialog = document.createElement("dialog");
	dialog.className = "connect-profile-dialog";
	dialog.setAttribute("aria-labelledby", "connect-profile-title");
	dialog.innerHTML = `
		<form>
			<h2 id="connect-profile-title">个人信息</h2>
			<label for="connect-profile-nickname">昵称</label>
			<input id="connect-profile-nickname" name="nickname" maxlength="12" autocomplete="off" autofocus>
			<label for="connect-profile-search">头像</label>
			<div class="connect-profile-avatar">
				<div class="connect-profile-preview" aria-hidden="true"></div>
				<div class="connect-profile-picker">
					<input id="connect-profile-search" name="search" type="search" placeholder="搜索武将名或编号" autocomplete="off">
					<select name="avatar" size="5" aria-label="选择头像"></select>
					<p class="connect-profile-results" role="status"></p>
				</div>
			</div>
			<div class="connect-profile-actions">
				<button type="button">取消</button>
				<button type="submit">保存</button>
			</div>
		</form>`;
	const form = dialog.querySelector("form");
	const nickname = form.elements.namedItem("nickname");
	const search = form.elements.namedItem("search");
	const choices = form.elements.namedItem("avatar");
	const preview = dialog.querySelector(".connect-profile-preview");
	const results = dialog.querySelector(".connect-profile-results");
	const characters = Object.keys(lib.character).map(id => ({
		id,
		name: get.plainText(lib.translate[id] || id),
		abbreviation: lib.translate[id + "_ab"] || "",
	}));
	const initialAvatar = lib.config.connect_avatar || "caocao";
	const initialNickname = get.connectNickname();
	let avatar = initialAvatar;
	nickname.value = get.plainText(initialNickname);
	const showAvatar = () => {
		preview.setBackground(avatar, "character");
	};
	const showChoices = () => {
		const query = search.value.trim().toLowerCase();
		const matches = characters.filter(({ id, name, abbreviation }) => [id, name, abbreviation].some(value => value.toLowerCase().includes(query)));
		const visible = matches.slice(0, 40);
		if (!query && !visible.some(character => character.id === avatar)) {
			visible.unshift({ id: avatar, name: get.plainText(lib.translate[avatar] || avatar) });
		}
		choices.replaceChildren(...visible.map(({ id, name }) => new Option(`${name} · ${id}`, id)));
		choices.value = avatar;
		results.textContent = !matches.length && query ? "未找到匹配的武将" : matches.length > 40 ? "输入更具体的名称可缩小范围" : "";
	};

	search.addEventListener("input", showChoices);
	search.addEventListener("keydown", event => {
		if (event.key === "Enter" && !event.isComposing) {
			event.preventDefault();
		}
	});
	nickname.addEventListener("input", () => nickname.setCustomValidity(""));
	choices.addEventListener("change", () => {
		avatar = choices.value;
		showAvatar();
	});
	form.querySelector('button[type="button"]').addEventListener("click", () => dialog.close());
	form.addEventListener("submit", event => {
		event.preventDefault();
		const name = nickname.value.replace(/[<>&]/g, "").trim().slice(0, 12) || "无名玩家";
		if (get.is.banWords(name)) {
			nickname.setCustomValidity("昵称包含不可用字符，请修改后保存。");
			nickname.reportValidity();
			return;
		}
		if (name !== initialNickname || avatar !== initialAvatar) {
			game.saveConfig("connect_nickname", name);
			game.saveConfig("connect_nickname", name, "connect");
			game.saveConfig("connect_avatar", avatar);
			game.saveConfig("connect_avatar", avatar, "connect");
			for (const field of ui.window.querySelectorAll("[data-connect-profile-field]")) {
				field.textContent = field.dataset.connectProfileField === "nickname" ? name : get.plainText(lib.translate[avatar] || avatar);
			}
			game.syncConnectProfile();
		}
		dialog.close();
	});
	dialog.addEventListener("keydown", event => event.stopPropagation());
	dialog.addEventListener("click", event => event.stopPropagation());
	dialog.addEventListener("touchend", event => event.stopPropagation());
	dialog.addEventListener("close", () => dialog.remove(), { once: true });
	ui.window.append(dialog);
	showAvatar();
	showChoices();
	dialog.showModal();
}
