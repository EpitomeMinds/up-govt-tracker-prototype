#!/usr/bin/env node
/**
 * Sync authentic recommendations & growth data from official government sources.
 * Usage: node scripts/sync-authentic-data.js
 */
const { syncAuthenticData } = require("../services/recommendationSync");

syncAuthenticData()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
