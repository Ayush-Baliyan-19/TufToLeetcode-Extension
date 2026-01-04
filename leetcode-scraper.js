// leetcode_api_scraper_to_json.js

import fetch from 'node-fetch';
import fs from 'fs/promises';

const GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql/';

const getProblems = async (skip = 0, limit = 50) => {
    const res = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(
            categorySlug: $categorySlug
            limit: $limit
            skip: $skip
            filters: $filters
          ) {
            totalNum
            data {
              questionFrontendId
              title
              titleSlug
              difficulty
              isPaidOnly
              topicTags {
                name
              }
            }
          }
        }
      `,
            variables: {
                categorySlug: '',
                skip,
                limit,
                filters: {},
            },
        }),
    });

    const data = await res.json();
    console.log(data?.data.problemsetQuestionList.data);
    return data.data.problemsetQuestionList.data;
};

const main = async () => {
    let skip = 0;
    const limit = 50;
    const allProblems = [];

    while (true) {
        const problems = await getProblems(skip, limit);
        if (!problems.length) break;

        const formatted = problems.map((q) => ({
            id: q.questionFrontendId,
            title: q.title,
            url: `https://leetcode.com/problems/${q.titleSlug}`,
            difficulty: q.difficulty,
            isPremium: q.isPaidOnly,
            topics: q.topicTags.map((tag) => tag.name),
        }));

        allProblems.push(...formatted);
        console.log(`Fetched ${formatted.length} problems (skip: ${skip})`);
        skip += limit;
    }

    await fs.writeFile('leetcode-data.json', JSON.stringify(allProblems, null, 2));
    console.log('✅ Saved all problems to leetcode-data.json');
};

main();
