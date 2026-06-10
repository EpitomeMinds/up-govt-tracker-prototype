import type { Job } from "./types";

const BOARD_PORTALS: { test: RegExp; url: string }[] = [
  { test: /uppsc|public service commission/i, url: "https://uppsc.up.nic.in/" },
  { test: /upsssc|subordinate services/i, url: "https://upsssc.gov.in/" },
  { test: /uppcl|power corporation/i, url: "https://www.uppcl.org/" },
  { test: /upsidc|industrial development/i, url: "https://www.upsidc.com/" },
  { test: /bank of baroda/i, url: "https://www.bankofbaroda.in/careers" },
  { test: /esic/i, url: "https://www.esic.nic.in/recruitments" },
  { test: /npcil|atomic energy/i, url: "https://npcil.nic.in/" },
  { test: /indian railway|railway/i, url: "https://indianrailways.gov.in/" },
  { test: /up police/i, url: "https://uppolice.gov.in/" },
  { test: /up basic education|education department/i, url: "https://upbasiceduboard.gov.in/" },
];

function boardPortal(postBoard: string): string | null {
  const board = postBoard.toLowerCase();
  for (const entry of BOARD_PORTALS) {
    if (entry.test.test(board)) return entry.url;
  }
  return null;
}

export function getJobNoticeUrl(job: Pick<Job, "link" | "official_link" | "post_board">): string | null {
  if (job.official_link) return job.official_link;
  if (job.link && !/freejobalert\.com/i.test(job.link)) return job.link;
  return boardPortal(job.post_board || "") || null;
}

export function isGovernmentNoticeUrl(url: string): boolean {
  return /\.(gov|nic)\.in/i.test(url) || /\.pdf$/i.test(url) || /\.edu\.in/i.test(url);
}
