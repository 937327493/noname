import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
// 构建失败必须中止,否则会把上一次的旧产物当成新包发出去
for (const args of [
	["-F", "noname...", "build"],
	["-F", "./packages/extension/**", "build"],
]) {
	const pnpm = process.env.npm_execpath;
	const result = spawnSync(pnpm ? process.execPath : "pnpm", pnpm ? [pnpm, ...args] : args, {
		stdio: "inherit",
	});
	if (result.error || result.status !== 0) {
		throw new Error(`构建失败,已中止打包: pnpm ${args.join(" ")} (exit ${result.status ?? result.error.message})`);
	}
}

console.log("合并打包结果");
await fs.rm("dist", { recursive: true, force: true });
await fs.mkdir("dist", { recursive: true });
await Promise.all([
	fs.cp("apps/core/dist", "dist", { recursive: true, preserveTimestamps: true }),
	fs.cp("apps/core/audio", "dist/audio", { recursive: true }),
	fs.cp("apps/core/image", "dist/image", { recursive: true }),
	fs.cp("apps/core/extension", "dist/extension", { recursive: true }),
	fs.cp("docs", "dist/docs", { recursive: true }),
	fs.cp(".nomedia", "dist/.nomedia"),
	fs.cp("LICENSE", "dist/LICENSE"),
	fs.cp("README.md", "dist/README.md")
]);
