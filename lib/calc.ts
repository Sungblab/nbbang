import type { MenuItem, Assignment } from "./types";

/**
 * 참여자별 낼 금액 계산
 * - 개인 메뉴: 배정된 가격 * 수량
 * - 공유 메뉴: floor(총액 / 인원) → 나머지는 첫 번째 참여자에게
 */
export function calculateAmounts(
  menuItems: MenuItem[],
  assignments: Assignment[],
  participantIds: string[]
): Map<string, number> {
  const amounts = new Map<string, number>();
  participantIds.forEach((id) => amounts.set(id, 0));

  for (const item of menuItems) {
    const totalItemPrice = item.price * item.qty;

    if (!item.is_shared) {
      // 개인 메뉴: 배정된 참여자에게 부과
      const assigned = assignments.filter((a) => a.menu_item_id === item.id);
      for (const a of assigned) {
        const prev = amounts.get(a.participant_id) ?? 0;
        amounts.set(a.participant_id, prev + totalItemPrice);
      }
    } else {
      // 공유 메뉴: 배정된 참여자들이 N빵
      const assigned = assignments.filter((a) => a.menu_item_id === item.id);
      if (assigned.length === 0) continue;

      const perPerson = Math.floor(totalItemPrice / assigned.length);
      const remainder = totalItemPrice - perPerson * assigned.length;

      assigned.forEach((a, idx) => {
        const extra = idx === 0 ? remainder : 0; // 나머지는 첫 번째 참여자에게
        const prev = amounts.get(a.participant_id) ?? 0;
        amounts.set(a.participant_id, prev + perPerson + extra);
      });
    }
  }

  return amounts;
}
