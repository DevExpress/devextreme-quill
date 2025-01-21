export default function getVersionNumber(versionString) {
  return Number(versionString.split('.')[0]);
}
