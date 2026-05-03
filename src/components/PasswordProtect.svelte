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

async function sha256(message: string): Promise<string> {
	const msgBuffer = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handleUnlock() {
	if (!password.trim()) {
		error = "请输入密码";
		return;
	}
	checking = true;
	const hash = await sha256(password.trim());
	if (hash === CORRECT_HASH) {
		unlocked = true;
		localStorage.setItem(STORAGE_KEY, "1");
		error = "";
	} else {
		error = "密码错误";
	}
	checking = false;
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter") {
		handleUnlock();
	}
}

onMount(() => {
	if (localStorage.getItem(STORAGE_KEY) === "1") {
		unlocked = true;
	}
});
</script>

{#if !unlocked}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--page-bg)]">
    <div class="card-base w-full max-w-sm p-8 mx-4">
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
                on:keydown={handleKeydown}
                class="w-full px-4 py-3 rounded-xl bg-[var(--btn-plain-bg)] border border-[var(--btn-plain-bg-hover)]
                       text-[var(--text-main)] placeholder:text-[var(--text-30)]
                       focus:outline-none focus:border-[var(--primary)] transition"
            />
            {#if error}
                <p class="text-sm text-red-400">{error}</p>
            {/if}
            <button
                on:click={handleUnlock}
                disabled={checking}
                class="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold
                       hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
                {checking ? "验证中..." : "进入"}
            </button>
        </div>
    </div>
</div>
{:else}
    <slot />
{/if}
