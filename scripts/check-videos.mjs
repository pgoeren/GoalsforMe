// Run with: node scripts/check-videos.mjs
// Checks each YouTube video ID in inspirationVideos.js via the oEmbed API.
// oEmbed returns 200 if a video is public + embeddable, 4xx if not.

const videos = [
  { id: 'BwFOwyoH-3g', title: 'Why We Do What We Do', speaker: 'Tony Robbins' },
  { id: 'V1pBMbPKddo', title: 'How to Achieve Your Goals Faster', speaker: 'Tony Robbins' },
  { id: 'MJ7VxkSd7dY', title: 'The Secret to Living Is Giving', speaker: 'Tony Robbins' },
  { id: '0VbAj5j1AoI', title: 'Change Your Story, Change Your Life', speaker: 'Tony Robbins' },
  { id: 'OqDkTRDgTiY', title: 'The Power of a Compelling Future', speaker: 'Tony Robbins' },
  { id: 'E0R5gBKlOwI', title: 'How to Design Your Own Destiny', speaker: 'Tony Robbins' },
  { id: '7Pex_bxv3vI', title: 'Unleash the Power Within — Mindset Reset', speaker: 'Tony Robbins' },
  { id: 'Nd5WorTSPvI', title: 'Stop Sabotaging Yourself', speaker: 'Tony Robbins' },
  { id: '5tSTk1083VY', title: 'You Are Stopping Yourself — The 40% Rule', speaker: 'David Goggins' },
  { id: 'BvWB7B8tXK8', title: 'Nobody Cares. Work Harder.', speaker: 'David Goggins' },
  { id: 'fl6X5dh6TFU', title: 'Master Your Mind — The Only Way Out Is Through', speaker: 'David Goggins' },
  { id: 'nDLb8_wgX50', title: 'Callus Your Mind Every Single Day', speaker: 'David Goggins' },
  { id: 'cx8MLGPJBOM', title: 'Stay Hard: The Ultimate Mindset', speaker: 'David Goggins' },
  { id: 'kLSIUFVzxVg', title: 'Take Souls — Outperform Your Potential', speaker: 'David Goggins' },
  { id: 'WSgbGFqHDZE', title: 'Get Comfortable Being Uncomfortable', speaker: 'David Goggins' },
  { id: 'Lp7E973zozc', title: 'How to Stop Screwing Yourself Over', speaker: 'Mel Robbins' },
  { id: 'Oa2Bvp0FHqI', title: 'The 5-Second Rule — Take Action Now', speaker: 'Mel Robbins' },
  { id: 'iSgqzCMrFnA', title: 'How to Build Habits That Stick', speaker: 'Mel Robbins' },
  { id: 'ZRfvSSTJO8U', title: 'Stop Waiting — Start Doing', speaker: 'Mel Robbins' },
  { id: 'pRABKEeKT9E', title: 'The Truth About Why You Self-Sabotage', speaker: 'Mel Robbins' },
  { id: 'P91b4civBxA', title: 'Let Them — The Mindset Shift That Changes Everything', speaker: 'Mel Robbins' },
  { id: 'Y3C5bKa5PzQ', title: 'The Art of Setting Goals That Actually Work', speaker: 'Jim Rohn' },
  { id: 'bMH1x5BRmWE', title: 'Building Your Life Philosophy', speaker: 'Jim Rohn' },
  { id: 'YtlFT_PQ-Vc', title: 'Take Full Responsibility for Your Life', speaker: 'Jim Rohn' },
  { id: 'Cgq0WUVI_IE', title: 'The Power of Ambition', speaker: 'Jim Rohn' },
  { id: 'FKHCXKV2ooM', title: 'How to Have Your Best Year Ever', speaker: 'Jim Rohn' },
  { id: 'HmQiHHH0vMI', title: 'Disciplines for Success — Daily Habits That Pay Off', speaker: 'Jim Rohn' },
  { id: 'MCQjjFy4FVg', title: 'Six Months to a New Life', speaker: 'Jim Rohn' },
  { id: 'D4GXqPIYLNQ', title: "It's Possible — You Have Greatness Within You", speaker: 'Les Brown' },
  { id: 'ImKjFGF_0jE', title: 'Shoot for the Moon', speaker: 'Les Brown' },
  { id: 'hOhRf8EqYI0', title: 'Hunger — You Have to Be Hungry', speaker: 'Les Brown' },
  { id: 'C9OKrOHCjuE', title: 'Fear Is Not Real — Push Through Anyway', speaker: 'Les Brown' },
  { id: 'xHOd1ybRBkE', title: 'Getting Through the Hard Times', speaker: 'Les Brown' },
  { id: 'TFlHqKBFPMw', title: 'Live Full, Die Empty', speaker: 'Les Brown' },
  { id: 'bNKLfwrhkqQ', title: 'Discipline Equals Freedom', speaker: 'Jocko Willink' },
  { id: 'rJG28vg-dFs', title: 'Good — The Response to Every Setback', speaker: 'Jocko Willink' },
  { id: 'Ol2ANBCeBG8', title: 'How to Build Self-Discipline', speaker: 'Jocko Willink' },
  { id: '3q0PaEGd-Ku', title: 'Leadership and the Dichotomy of Control', speaker: 'Jocko Willink' },
  { id: 'CajOBynapvg', title: 'Default Aggressive — Take the Initiative', speaker: 'Jocko Willink' },
  { id: 'xAuFLWxHD4g', title: 'Own It All — Extreme Ownership', speaker: 'Jocko Willink' },
  { id: 'lsSC2vx7-Qs', title: 'How Bad Do You Want It? (Sleep)', speaker: 'Eric Thomas' },
  { id: 'WoP_mBovnCc', title: "Thank God It's Monday", speaker: 'Eric Thomas' },
  { id: 'B-ATbv1JCMY', title: 'Secrets to Success — When You Want It as Bad as Air', speaker: 'Eric Thomas' },
  { id: '7Oxz-4RiTBQ', title: 'Average Skill, Phenomenal Will', speaker: 'Eric Thomas' },
  { id: 'DG-oAF1i_UA', title: 'You Owe You — Bet on Yourself', speaker: 'Eric Thomas' },
  { id: 'SA68BXcJFtU', title: 'I Can, I Will, I Must', speaker: 'Eric Thomas' },
];

const CONCURRENCY = 6;

async function checkVideo(video) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.id}&format=json`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return { ...video, status: 'ok', actualTitle: data.title };
    }
    return { ...video, status: 'broken', httpStatus: res.status };
  } catch (e) {
    return { ...video, status: 'error', error: e.message };
  }
}

// Run in batches to avoid hammering the API
async function runBatch(items) {
  return Promise.all(items.map(checkVideo));
}

const results = [];
for (let i = 0; i < videos.length; i += CONCURRENCY) {
  const batch = videos.slice(i, i + CONCURRENCY);
  const batchResults = await runBatch(batch);
  results.push(...batchResults);
  if (i + CONCURRENCY < videos.length) {
    await new Promise(r => setTimeout(r, 300)); // small pause between batches
  }
}

const ok = results.filter(r => r.status === 'ok');
const broken = results.filter(r => r.status !== 'ok');

console.log(`\n✅ EMBEDDABLE (${ok.length}):`);
for (const v of ok) {
  console.log(`  ${v.id}  ${v.speaker} — ${v.title}`);
  if (v.actualTitle !== v.title) {
    console.log(`    ↳ actual YouTube title: "${v.actualTitle}"`);
  }
}

console.log(`\n❌ BROKEN — need replacement (${broken.length}):`);
for (const v of broken) {
  const reason = v.httpStatus === 401 ? 'embedding disabled'
    : v.httpStatus === 404 ? 'video deleted or private'
    : v.httpStatus === 403 ? 'embedding forbidden'
    : `HTTP ${v.httpStatus ?? v.error}`;
  console.log(`  ${v.id}  ${v.speaker} — "${v.title}"  [${reason}]`);
  console.log(`    ↳ search: https://www.youtube.com/results?search_query=${encodeURIComponent(v.speaker + ' ' + v.title)}`);
}

if (broken.length === 0) {
  console.log('  All videos are embeddable!');
}
console.log('');
