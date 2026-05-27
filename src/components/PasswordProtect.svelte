<script lang="ts">
import { onMount } from "svelte";

// 设置密码：把你想用的密码用 SHA-256 编码后填在这里
// 在线生成工具：https://www.hashes.com/en/tools/hash_generator
// 当前密码是 "51522"
const CORRECT_HASH =
	"1416569546bb9d01b5462bdb998acd55ace7a4c2af82e8795ba959fad30486b6";

const STORAGE_KEY = "diary_unlocked";

let password = "";
let error = "";
let unlocked = false;
let checking = false;
let passwordInput: HTMLInputElement;

const HASH_INITIAL = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
	0x1f83d9ab, 0x5be0cd19,
];

const HASH_K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
	0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
	0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
	0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
	0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
	0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

async function sha256(message: string): Promise<string> {
	if (globalThis.crypto?.subtle) {
		try {
			const msgBuffer = new TextEncoder().encode(message);
			const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
		} catch {
			// Some Android WebViews expose crypto.subtle but fail in non-secure contexts.
		}
	}
	return sha256Fallback(message);
}

function rightRotate(value: number, amount: number) {
	return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(message: string): string {
	const msgBuffer = new TextEncoder().encode(message);
	const bytes = Array.from(msgBuffer);
	const bitLength = bytes.length * 8;
	const hash = [...HASH_INITIAL];
	const words = new Array<number>(64);

	bytes.push(0x80);
	while (bytes.length % 64 !== 56) bytes.push(0);

	const high = Math.floor(bitLength / 0x100000000);
	const low = bitLength >>> 0;
	for (let i = 3; i >= 0; i--) bytes.push((high >>> (i * 8)) & 0xff);
	for (let i = 3; i >= 0; i--) bytes.push((low >>> (i * 8)) & 0xff);

	for (let chunk = 0; chunk < bytes.length; chunk += 64) {
		for (let i = 0; i < 16; i++) {
			const offset = chunk + i * 4;
			words[i] =
				((bytes[offset] << 24) |
					(bytes[offset + 1] << 16) |
					(bytes[offset + 2] << 8) |
					bytes[offset + 3]) >>>
				0;
		}
		for (let i = 16; i < 64; i++) {
			const s0 =
				rightRotate(words[i - 15], 7) ^
				rightRotate(words[i - 15], 18) ^
				(words[i - 15] >>> 3);
			const s1 =
				rightRotate(words[i - 2], 17) ^
				rightRotate(words[i - 2], 19) ^
				(words[i - 2] >>> 10);
			words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
		}

		let [a, b, c, d, e, f, g, h] = hash;
		for (let i = 0; i < 64; i++) {
			const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
			const ch = (e & f) ^ (~e & g);
			const temp1 = (h + s1 + ch + HASH_K[i] + words[i]) >>> 0;
			const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
			const maj = (a & b) ^ (a & c) ^ (b & c);
			const temp2 = (s0 + maj) >>> 0;

			h = g;
			g = f;
			f = e;
			e = (d + temp1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temp1 + temp2) >>> 0;
		}

		hash[0] = (hash[0] + a) >>> 0;
		hash[1] = (hash[1] + b) >>> 0;
		hash[2] = (hash[2] + c) >>> 0;
		hash[3] = (hash[3] + d) >>> 0;
		hash[4] = (hash[4] + e) >>> 0;
		hash[5] = (hash[5] + f) >>> 0;
		hash[6] = (hash[6] + g) >>> 0;
		hash[7] = (hash[7] + h) >>> 0;
	}

	return hash.map((value) => value.toString(16).padStart(8, "0")).join("");
}

async function handleUnlock() {
	if (checking) return;
	if (!password.trim()) {
		error = "请输入密码";
		return;
	}
	checking = true;
	try {
		const hash = await sha256(password.trim());
		if (hash === CORRECT_HASH) {
			unlocked = true;
			localStorage.setItem(STORAGE_KEY, "1");
			error = "";
		} else {
			error = "密码错误";
			passwordInput?.focus();
		}
	} catch {
		error = "验证失败，请刷新后重试";
	} finally {
		checking = false;
	}
}

onMount(() => {
	if (localStorage.getItem(STORAGE_KEY) === "1") {
		unlocked = true;
		return;
	}
	setTimeout(() => passwordInput?.focus(), 100);
});
</script>

{#if !unlocked}
<div class="fixed inset-0 z-[200] overflow-y-auto bg-[var(--page-bg)] px-4 py-8">
    <div class="flex min-h-[100dvh] items-start justify-center pt-16 sm:items-center sm:pt-0">
    <form class="card-base w-full max-w-sm p-6 sm:p-8" on:submit|preventDefault={handleUnlock}>
        <div class="text-center mb-6">
            <div class="text-4xl mb-3">🔒</div>
            <h2 class="text-xl font-bold">私人日记</h2>
            <p class="text-sm text-50 mt-1">此页面需要密码才能访问</p>
        </div>

        <div class="flex flex-col gap-3">
            <input
                type="password"
                placeholder="请输入密码"
                bind:value={password}
                bind:this={passwordInput}
                autocomplete="current-password"
                inputmode="numeric"
                enterkeyhint="done"
                class="w-full px-4 py-3 rounded-xl bg-[var(--btn-plain-bg)] border border-[var(--btn-plain-bg-hover)]
                       text-[var(--text-main)] placeholder:text-[var(--text-30)]
                       focus:outline-none focus:border-[var(--primary)] transition"
            />
            {#if error}
                <p class="text-sm text-red-400">{error}</p>
            {/if}
            <button
                type="submit"
                disabled={checking}
                class="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold
                       hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
                {checking ? "验证中..." : "进入"}
            </button>
        </div>
    </form>
    </div>
</div>
{:else}
    <slot />
{/if}
