module.exports = {
  branches: ['main'],
  plugins: [
    // Analyze commits to determine version bump
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'chore', release: false },
          { type: 'test', release: false },
          { type: 'ci', release: false },
          { breaking: true, release: 'major' },
        ],
      },
    ],
    // Generate release notes from commits
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance' },
            { type: 'refactor', section: 'Refactoring' },
            { type: 'docs', section: 'Documentation', hidden: true },
            { type: 'style', section: 'Styles', hidden: true },
            { type: 'chore', section: 'Chores', hidden: true },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'ci', section: 'CI', hidden: true },
          ],
        },
      },
    ],
    // Update CHANGELOG.md
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    // Update package.json version and commit changes
    [
      '@semantic-release/npm',
      {
        npmPublish: false, // Only update package.json version
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json', 'bun.lockb'],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
    // Create GitHub release (this also pushes the tag)
    '@semantic-release/github',
  ],
};
