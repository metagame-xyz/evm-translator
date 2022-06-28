module.exports = {
  resolveSnapshotPath: (testPath, snapshotExtension) => 'src/__tests__/__snapshots__' + testPath.slice(testPath.lastIndexOf('/')) + snapshotExtension,
  resolveTestPath: (snapshotFilePath, snapshotExtension) => 'lib/__tests__' + snapshotFilePath.slice(snapshotFilePath.lastIndexOf('/'), -snapshotExtension.length),
  testPathForConsistencyCheck: 'lib/__tests__/some.test.js',
};