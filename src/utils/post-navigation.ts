type NavigationData = {
	title: string;
	prevSlug?: string;
	prevTitle?: string;
	nextSlug?: string;
	nextTitle?: string;
};

export type NavigationPost = {
	slug: string;
	data: NavigationData;
};

const DIARY_WEEK_SLUG_PATTERN = /^summary\/\d+year\/\d+month\/\d+week$/;

export function isDiaryWeekPost(slug: string): boolean {
	return DIARY_WEEK_SLUG_PATTERN.test(slug);
}

export function assignDiaryWeekNavigation<TPost extends NavigationPost>(
	posts: TPost[],
): TPost[] {
	const diaryWeeks = posts.filter((post) => isDiaryWeekPost(post.slug));

	for (let i = 0; i < diaryWeeks.length; i++) {
		const newerPost = diaryWeeks[i - 1];
		const olderPost = diaryWeeks[i + 1];

		diaryWeeks[i].data.nextSlug = newerPost?.slug ?? "";
		diaryWeeks[i].data.nextTitle = newerPost?.data.title ?? "";
		diaryWeeks[i].data.prevSlug = olderPost?.slug ?? "";
		diaryWeeks[i].data.prevTitle = olderPost?.data.title ?? "";
	}

	return posts;
}
