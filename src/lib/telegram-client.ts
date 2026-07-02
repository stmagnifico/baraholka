export function getTelegramContactUrl(user: {
  id: bigint | number | string;
  username?: string | null;
}): string {
  if (user.username) {
    return `https://t.me/${user.username}`;
  }

  return `tg://user?id=${user.id}`;
}
