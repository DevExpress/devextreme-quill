export default function getId() {
  return Math.random()
    .toString(36)
    .slice(2, 6);
}
