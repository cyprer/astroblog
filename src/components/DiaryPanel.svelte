<script lang="ts">
import { onMount } from "svelte";
import { getPostUrlBySlug } from "../utils/url-utils";

export let sortedPosts: Post[] = [];

interface Post {
	slug: string;
	data: {
		title: string;
		published: Date;
		description?: string;
	};
}

interface WeekItem {
	week: number;
	isIndex: boolean;
	posts: Post[];
}

interface MonthItem {
	month: number;
	isIndex: boolean;
	posts: Post[];
	weeks: WeekItem[];
}

interface YearItem {
	year: number;
	posts: Post[];
	months: MonthItem[];
}

let years: YearItem[] = [];
let expandedYears = new Set<number>();
let expandedMonths = new Set<string>();
let expandedWeeks = new Set<string>();

function toggleYear(year: number) {
	const next = new Set(expandedYears);
	if (next.has(year)) {
		next.delete(year);
	} else {
		next.add(year);
	}
	expandedYears = next;
}

function toggleMonth(key: string) {
	const next = new Set(expandedMonths);
	if (next.has(key)) {
		next.delete(key);
	} else {
		next.add(key);
	}
	expandedMonths = next;
}

function toggleWeek(key: string) {
	const next = new Set(expandedWeeks);
	if (next.has(key)) {
		next.delete(key);
	} else {
		next.add(key);
	}
	expandedWeeks = next;
}

function parseSlug(slug: string) {
	// summary/26year/4month/3week.md or summary/26year/4month/index.md or summary/26year/index.md
	const parts = slug.split("/");
	let year: number | null = null;
	let month: number | null = null;
	let week: number | null = null;
	let isIndex = false;

	for (const part of parts) {
		if (part.endsWith("year")) {
			const n = Number.parseInt(part.replace("year", ""), 10);
			if (!Number.isNaN(n)) year = n;
		} else if (part.endsWith("month")) {
			const n = Number.parseInt(part.replace("month", ""), 10);
			if (!Number.isNaN(n)) month = n;
		} else if (part.endsWith("week")) {
			const n = Number.parseInt(part.replace("week", ""), 10);
			if (!Number.isNaN(n)) week = n;
		} else if (part === "index") {
			isIndex = true;
		}
	}
	return { year, month, week, isIndex };
}

onMount(() => {
	// filter posts in summary/ directory or category 周报/日记
	const diaryPosts = sortedPosts.filter((post) => {
		return post.slug.startsWith("summary/");
	});

	const yearMap = new Map<number, YearItem>();

	for (const post of diaryPosts) {
		const { year, month, week, isIndex } = parseSlug(post.slug);
		if (year == null) continue;

		if (!yearMap.has(year)) {
			yearMap.set(year, { year, posts: [], months: [] });
		}
		const yItem = yearMap.get(year);
		if (!yItem) continue;

		if (month == null) {
			// year index
			yItem.posts.push(post);
			continue;
		}

		let mItem = yItem.months.find((m) => m.month === month);
		if (!mItem) {
			mItem = { month, isIndex: false, posts: [], weeks: [] };
			yItem.months.push(mItem);
		}

		if (week == null) {
			// month index
			mItem.isIndex = true;
			mItem.posts.push(post);
			continue;
		}

		let wItem = mItem.weeks.find((w) => w.week === week);
		if (!wItem) {
			wItem = { week, isIndex, posts: [] };
			mItem.weeks.push(wItem);
		}
		wItem.posts.push(post);
	}

	// sort
	years = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
	for (const y of years) {
		y.months.sort((a, b) => a.month - b.month);
		for (const m of y.months) {
			m.weeks.sort((a, b) => a.week - b.week);
		}
	}

	// Check sessionStorage for which year/month to expand (set before navigating to a post)
	const savedYear = sessionStorage.getItem("diary-expand-year");
	const savedMonth = sessionStorage.getItem("diary-expand-month");

	if (savedYear) {
		const yearNum = Number.parseInt(savedYear, 10);
		const yearItem = years.find((y) => y.year === yearNum);
		if (yearItem) {
			expandedYears = new Set([...expandedYears, yearNum]);

			if (savedMonth) {
				const monthNum = Number.parseInt(savedMonth, 10);
				const monthItem = yearItem.months.find((m) => m.month === monthNum);
				if (monthItem) {
					const mk = `${yearNum}-${monthNum}`;
					expandedMonths = new Set([...expandedMonths, mk]);
				}
			} else if (yearItem.months.length > 0) {
				// If only year specified, expand the first month
				const mk = `${yearNum}-${yearItem.months[0].month}`;
				expandedMonths = new Set([...expandedMonths, mk]);
			}
		}
		// Clear after restoring so it doesn't persist on manual refresh
		sessionStorage.removeItem("diary-expand-year");
		sessionStorage.removeItem("diary-expand-month");
	} else {
		// default expand the latest year and month
		if (years.length > 0) {
			expandedYears = new Set([...expandedYears, years[0].year]);
			if (years[0].months.length > 0) {
				const mk = `${years[0].year}-${years[0].months[0].month}`;
				expandedMonths = new Set([...expandedMonths, mk]);
			}
		}
	}
});
</script>

<div class="card-base px-6 py-6">
	{#each years as year}
		<div class="mb-2">
			<!-- Year Header -->
			<button
				class="flex items-center w-full h-12 px-4 rounded-lg btn-plain text-left"
				on:click={() => toggleYear(year.year)}
			>
				<span class="text-xl font-bold text-[var(--primary)] mr-3">
					{expandedYears.has(year.year) ? '▼' : '▶'}
				</span>
				<span class="text-lg font-bold">20{year.year.toString().padStart(2, '0')}年</span>
				<span class="ml-3 text-sm text-50">({year.months.length}个月)</span>
			</button>

			{#if expandedYears.has(year.year)}
				<div class="ml-6 border-l-2 border-[var(--primary)]/20 pl-4 mt-1">
											{#if year.posts.length > 0}
												{#each year.posts as post}
													<a 
														href={getPostUrlBySlug(post.slug)} 
														class="block py-1 text-75 hover:text-[var(--primary)] transition"
													>
													📋 {post.data.title}
													</a>
												{/each}
											{/if}

					{#each year.months as month}
						{@const monthKey = `${year.year}-${month.month}`}
						<div class="mb-1">
							<button
								class="flex items-center w-full h-10 px-3 rounded-lg btn-plain text-left"
								on:click={() => toggleMonth(monthKey)}
							>
								<span class="text-sm font-bold text-[var(--primary)] mr-2">
									{expandedMonths.has(monthKey) ? '▼' : '▶'}
								</span>
								<span class="font-bold">{month.month}月</span>
													{#if month.isIndex}
													<a
														href={getPostUrlBySlug(month.posts[0]?.slug || '')}
														class="ml-3 text-sm text-50 hover:text-[var(--primary)]"
														on:click|stopPropagation
													>
														📋 {month.posts[0]?.data.title || '月结'}
													</a>
													{/if}
								<span class="ml-auto text-xs text-30">({month.weeks.length}周)</span>
							</button>

							{#if expandedMonths.has(monthKey)}
								<div class="ml-6 border-l-2 border-[var(--primary)]/10 pl-3 mt-1">
									{#each month.weeks as week}
										{@const weekKey = `${year.year}-${month.month}-${week.week}`}
											<div class="mb-1">
												{#if week.posts.length === 1}
													<!-- 只有一篇文章，直接显示链接，无需展开 -->
												<a
													href={getPostUrlBySlug(week.posts[0].slug)}
													class="flex items-center w-full h-9 px-3 rounded-lg btn-plain text-left hover:text-[var(--primary)] transition"
												>
													<span class="text-sm font-bold">第{week.week}周</span>
													<span class="ml-2 text-sm text-75 truncate">📝 {week.posts[0].data.title}</span>
												</a>
												{:else}
													<!-- 多篇文章，需要展开 -->
													<button
														class="flex items-center w-full h-9 px-3 rounded-lg btn-plain text-left"
														on:click={() => toggleWeek(weekKey)}
													>
														<span class="text-xs font-bold text-[var(--primary)] mr-2">
															{expandedWeeks.has(weekKey) ? '▼' : '▶'}
														</span>
														<span class="text-sm font-bold">第{week.week}周</span>
													</button>

													{#if expandedWeeks.has(weekKey)}
														<div class="ml-6 pl-2 mt-1">
															{#each week.posts as post}
																<a
																	href={getPostUrlBySlug(post.slug)}
																	class="block py-1 text-sm text-75 hover:text-[var(--primary)] transition truncate"
																>
																	📝 {post.data.title}
																</a>
															{/each}
														</div>
													{/if}
												{/if}
											</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
