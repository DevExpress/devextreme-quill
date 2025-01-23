export default function isVersionNotLessThan(version, versionToCompare) {
  const aVersionArray = version.split('.').map(Number);
  const bVersionArray = versionToCompare.split('.').map(Number);

  const maxVersionLength = Math.max(aVersionArray.length, bVersionArray.length);

  for (let i = 0; i < maxVersionLength; i += 1) {
    const a = aVersionArray[i] ?? 0;
    const b = bVersionArray[i] ?? 0;

    if (a !== b) {
      return a > b;
    }
  }

  return true;
}
