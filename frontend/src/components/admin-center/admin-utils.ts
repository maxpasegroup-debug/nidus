export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function groupByModule<T extends { module: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.module] = [...(groups[item.module] ?? []), item];
    return groups;
  }, {});
}
