/** @type { string } */
// @ts-expect-error ignore
export const nonameInitialized = localStorage.getItem("noname_inited");
export const assetURL = "";
/** @type {typeof Function} */
// @ts-expect-error ignore
export const GeneratorFunction = function* () {}.constructor;
/** @type {typeof Function} */
// @ts-expect-error ignore
export const AsyncFunction = async function () {}.constructor;
/** @type {typeof Function} */
// @ts-expect-error ignore
export const AsyncGeneratorFunction = async function* () {}.constructor;
export const userAgent = navigator.userAgent;
export const userAgentLowerCase = userAgent.toLowerCase();
export const characterDefaultPicturePath = "image/character/default_silhouette_";

// iPadOS 上的 Safari 可能使用桌面 User-Agent，结合触控点数识别触屏布局。
const isIPadOSMasqueradingAsMac = userAgentLowerCase.includes("macintosh") && typeof navigator != "undefined" && Number(navigator.maxTouchPoints) > 1;

export const device = userAgentLowerCase.includes("android") ? "android" : userAgentLowerCase.includes("iphone") || userAgentLowerCase.includes("ipad") || isIPadOSMasqueradingAsMac ? "ios" : undefined;

/**
 * 不能被new的类
 */
export class Uninstantable {
	constructor() {
		throw new TypeError(`${new.target.name} is not a constructor`);
	}
}

/**
 * 暂停x毫秒
 * @param { number } ms
 * @returns { Promise<void> }
 */
export function delay(ms) {
	return new Promise(resolve => {
		let timeout = setTimeout(() => {
			clearTimeout(timeout);
			resolve();
		}, ms);
	});
}

/**
 *
 * @return {boolean}
 * @param {function} func
 */
export function isClass(func) {
	if (typeof func !== "function") {
		return false;
	}
	const fnStr = Function.prototype.toString.call(func);
	return /^class\s/.test(fnStr);
}
