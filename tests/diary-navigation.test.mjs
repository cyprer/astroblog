import test from "node:test";
import assert from "node:assert/strict";
import {
	assignDiaryWeekNavigation,
	isDiaryWeekPost,
} from "../src/utils/post-navigation.ts";

const post = (slug, title, published) => ({
	slug,
	data: {
		title,
		published: new Date(published),
		prevSlug: "",
		prevTitle: "",
		nextSlug: "",
		nextTitle: "",
	},
});

test("detects only monthly diary week posts", () => {
	assert.equal(isDiaryWeekPost("summary/26year/1month/2week"), true);
	assert.equal(isDiaryWeekPost("summary/26year/1month"), false);
	assert.equal(isDiaryWeekPost("summary/26year/1month/index"), false);
	assert.equal(isDiaryWeekPost("summary/26year"), false);
	assert.equal(isDiaryWeekPost("note/datastructure/diary/2025/3month/20"), false);
});

test("links diary week posts to adjacent weeks instead of summary index posts", () => {
	const posts = [
		post("summary/26year/1month/3week", "第三周周记", "2026-01-15"),
		post("summary/26year/1month/2week", "第二周周记", "2026-01-08"),
		post("summary/26year", "2026年年度总结", "2026-01-01"),
		post("summary/26year/1month/index", "2026年1月份summary", "2026-01-01"),
		post("summary/26year/1month/1week", "第一周周记", "2026-01-01"),
	];

	assignDiaryWeekNavigation(posts);

	const secondWeek = posts.find(
		(item) => item.slug === "summary/26year/1month/2week",
	);

	assert.equal(secondWeek.data.prevSlug, "summary/26year/1month/1week");
	assert.equal(secondWeek.data.prevTitle, "第一周周记");
	assert.equal(secondWeek.data.nextSlug, "summary/26year/1month/3week");
	assert.equal(secondWeek.data.nextTitle, "第三周周记");
});
